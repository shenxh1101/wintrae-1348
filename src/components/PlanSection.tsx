import { useMemo } from 'react';
import { Zap, Scale, ArrowDownToLine, GitCompare, CheckCircle2 } from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import {
  calculateBudget,
  calcItemSubtotal,
  formatCurrency,
  formatNumber,
} from '@/utils/calculations';
import {
  CATEGORY_LABELS,
  CostCategory,
  PLAN_DESCRIPTIONS,
  PLAN_LABELS,
  PLAN_MULTIPLIER,
  PlanType,
} from '@/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const PLAN_ICONS: Record<PlanType, any> = {
  conservative: Zap,
  standard: Scale,
  lean: ArrowDownToLine,
};

const PLAN_COLORS: Record<PlanType, { bg: string; border: string; text: string; card: string }> = {
  conservative: {
    bg: 'bg-navy-50',
    border: 'border-navy-300',
    text: 'text-navy-800',
    card: 'bg-navy-800 text-white',
  },
  standard: {
    bg: 'bg-gold-50',
    border: 'border-gold-300',
    text: 'text-gold-700',
    card: 'bg-gold-400 text-navy-900',
  },
  lean: {
    bg: 'bg-success/10',
    border: 'border-success/40',
    text: 'text-success',
    card: 'bg-success text-white',
  },
};

const COST_CATEGORIES: CostCategory[] = [
  'venue',
  'catering',
  'materials',
  'transport',
  'personnel',
  'contingency',
];

function computePlanTotal(data: any, plan: PlanType) {
  let pretax = 0;
  const cats: Record<string, number> = {};
  COST_CATEGORIES.forEach((cat) => {
    let sub = 0;
    data.costs[cat].forEach((item: any) => {
      if (cat === 'contingency') {
        // 备用金不乘方案系数，直接用 basePrice * quantity
        sub += item.basePrice * item.quantity;
      } else {
        // 使用 calcItemSubtotal 正确处理供应商报价 + 基准价换算
        const r = calcItemSubtotal(
          item,
          data.basic.cityTier,
          plan,
          cat,
          data.suppliers[cat],
          data.adjustments.taxRate,
        );
        sub += r.subtotal;
      }
    });
    cats[cat] = sub;
    pretax += sub;
  });
  const contingencyIdx = COST_CATEGORIES.indexOf('contingency');
  if (contingencyIdx >= 0) {
    const first5 = COST_CATEGORIES.filter((c) => c !== 'contingency').reduce(
      (s, c) => s + cats[c],
      0,
    );
    const contItem = data.costs.contingency[0];
    if (contItem && contItem.basePrice === 0) {
      const newCont = first5 * (data.adjustments.contingencyRate / 100);
      cats.contingency = newCont;
      pretax = first5 + newCont;
    }
  }
  const tax = pretax * (data.adjustments.taxRate / 100);
  const fee = pretax * (data.adjustments.serviceRate / 100);
  const total = pretax + tax + fee;
  return {
    pretax,
    tax,
    fee,
    total,
    perPerson: data.basic.peopleCount > 0 ? total / data.basic.peopleCount : 0,
    categoryTotals: cats,
  };
}

export default function PlanSection() {
  const data = useBudgetStore((s) => s.data);
  const currentPlan = useBudgetStore((s) => s.data.currentPlan);
  const setPlan = useBudgetStore((s) => s.setPlan);
  const currentResult = useMemo(() => calculateBudget(data), [data]);

  const plans: PlanType[] = ['conservative', 'standard', 'lean'];
  const planResults = useMemo(
    () => plans.map((p) => ({ plan: p, result: computePlanTotal(data, p) })),
    [data],
  );

  const barData = {
    labels: COST_CATEGORIES.map((c) => CATEGORY_LABELS[c]),
    datasets: plans.map((p) => {
      const colors: Record<PlanType, string> = {
        conservative: '#1E3A5F',
        standard: '#C9A962',
        lean: '#3A7D44',
      };
      const r = planResults.find((x) => x.plan === p)!;
      return {
        label: PLAN_LABELS[p],
        data: COST_CATEGORIES.map((c) => Math.round(r.result.categoryTotals[c])),
        backgroundColor: colors[p],
        borderRadius: 2,
      };
    }),
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { family: '"Noto Sans SC"', size: 11 }, padding: 15 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            return `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#627d98' },
      },
      y: {
        grid: { color: '#E8E4DE' },
        ticks: {
          font: { size: 10 },
          color: '#627d98',
          callback: (v: any) => '¥' + formatNumber(v / 1000) + 'k',
        },
      },
    },
  };

  const standardTotal = planResults.find((x) => x.plan === 'standard')!.result.total;

  return (
    <section id="section-plan" className="scroll-mt-28 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="section-title !border-0 !pb-0">方案对比</h2>
        <span className="text-xs text-navy-500">
          <GitCompare className="w-3.5 h-3.5 inline align-[-2px] mr-1" />
          三档方案系数不同，点击选择
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const Icon = PLAN_ICONS[p];
          const r = planResults.find((x) => x.plan === p)!.result;
          const isActive = currentPlan === p;
          const diff = standardTotal > 0 ? ((r.total - standardTotal) / standardTotal) * 100 : 0;
          const colors = PLAN_COLORS[p];
          return (
            <div
              key={p}
              onClick={() => setPlan(p)}
              className={`card-base cursor-pointer transition-all duration-300 ${
                isActive
                  ? `ring-2 ring-offset-2 ring-gold-400 shadow-cardHover border-gold-300`
                  : 'hover:shadow-cardHover hover:-translate-y-0.5'
              }`}
            >
              <div className={`${colors.card} px-5 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <div>
                    <p className="font-serif font-semibold">{PLAN_LABELS[p]}</p>
                    <p className="text-xs opacity-80">{PLAN_DESCRIPTIONS[p]}</p>
                  </div>
                </div>
                {isActive && (
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <p className="text-xs text-navy-500">方案系数</p>
                  <p className="font-mono-num text-lg font-bold text-navy-800">
                    ×{PLAN_MULTIPLIER[p].toFixed(2)}
                  </p>
                </div>
                <div className="pt-3 border-t border-stone2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-navy-500">总预算</span>
                    <span className={`text-xs ${diff > 0 ? 'text-danger' : diff < 0 ? 'text-success' : 'text-navy-500'}`}>
                      {p === 'standard' ? '基准' : diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                    </span>
                  </div>
                  <p className="font-mono-num text-2xl font-bold mt-1 text-navy-800">
                    {formatCurrency(r.total)}
                  </p>
                </div>
                <div className="pt-3 border-t border-stone2 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-navy-500">人均成本</p>
                    <p className="font-mono-num text-sm font-semibold text-navy-700">
                      {formatCurrency(r.perPerson)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500">税费+服务费</p>
                    <p className="font-mono-num text-sm font-semibold text-navy-700">
                      {formatCurrency(r.tax + r.fee)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-base p-5">
        <h3 className="font-serif text-base font-semibold text-navy-800 mb-1">分类对比</h3>
        <p className="text-xs text-navy-500 mb-4">三档方案各费用类别横向对比（单位：元）</p>
        <div className="h-72">
          <Bar data={barData} options={barOptions as any} />
        </div>
      </div>

      <div className="card-base overflow-hidden">
        <h3 className="font-serif text-base font-semibold text-navy-800 px-5 pt-5 pb-3">
          详细对比表
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/60 text-navy-700 text-xs border-y border-stone2">
                <th className="text-left font-medium px-5 py-3">费用类别</th>
                {plans.map((p) => (
                  <th key={p} className={`text-right font-medium px-5 py-3 ${PLAN_COLORS[p].text}`}>
                    {PLAN_LABELS[p]}
                  </th>
                ))}
                <th className="text-right font-medium px-5 py-3 text-navy-500">当前方案</th>
              </tr>
            </thead>
            <tbody>
              {COST_CATEGORIES.map((cat) => (
                <tr key={cat} className="border-t border-stone2/60">
                  <td className="px-5 py-3 font-medium text-navy-800">{CATEGORY_LABELS[cat]}</td>
                  {plans.map((p) => {
                    const r = planResults.find((x) => x.plan === p)!;
                    return (
                      <td key={p} className="px-5 py-3 text-right font-mono-num text-navy-700">
                        {formatCurrency(r.result.categoryTotals[cat])}
                      </td>
                    );
                  })}
                  <td className="px-5 py-3 text-right font-mono-num font-semibold text-gold-600">
                    {formatCurrency(
                      currentResult.categoryTotals.find((c) => c.category === cat)?.subtotal || 0,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-stone2 bg-cream/50 font-semibold">
                <td className="px-5 py-3 text-navy-800">合计（含税+服务费）</td>
                {plans.map((p) => {
                  const r = planResults.find((x) => x.plan === p)!;
                  return (
                    <td key={p} className={`px-5 py-3 text-right font-mono-num ${PLAN_COLORS[p].text}`}>
                      {formatCurrency(r.result.total)}
                    </td>
                  );
                })}
                <td className="px-5 py-3 text-right font-mono-num font-bold text-gold-700 text-base">
                  {formatCurrency(currentResult.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
