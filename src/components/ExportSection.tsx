import { useMemo, useState } from 'react';
import {
  Download,
  Printer,
  FileText,
  ScrollText,
  PieChart,
  Building2,
  MapPin,
  Users,
  Calendar,
  Target,
  Landmark,
  Check,
} from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import {
  calculateBudget,
  calcItemSubtotal,
  formatCurrency,
  formatNumber,
  exportJSON,
} from '@/utils/calculations';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CostCategory,
  CITY_TIER_LABELS,
  PLAN_LABELS,
} from '@/types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const COST_CATEGORIES: CostCategory[] = [
  'venue',
  'catering',
  'materials',
  'transport',
  'personnel',
  'contingency',
];

export default function ExportSection() {
  const data = useBudgetStore((s) => s.data);
  const previewMode = useBudgetStore((s) => s.previewMode);
  const setPreviewMode = useBudgetStore((s) => s.setPreviewMode);
  const result = useMemo(() => calculateBudget(data), [data]);

  const [companyNameForPrint, setCompanyNameForPrint] = useState(data.basic.companyName);

  const cityMult =
    data.basic.cityTier === 't1'
      ? 1.4
      : data.basic.cityTier === 't1n'
      ? 1.2
      : data.basic.cityTier === 't2'
      ? 1.0
      : 0.8;
  const planMult =
    data.currentPlan === 'conservative' ? 1.3 : data.currentPlan === 'lean' ? 0.75 : 1.0;

  const pieData = {
    labels: COST_CATEGORIES.map((c) => CATEGORY_LABELS[c]),
    datasets: [
      {
        data: result.categoryTotals.map((c) => Math.round(c.subtotal)),
        backgroundColor: COST_CATEGORIES.map((c) => CATEGORY_COLORS[c]),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
            return `${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
          },
        },
      },
    },
  };

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };

  const handleExportClientPDF = () => {
    setPreviewMode('simple');
    setTimeout(() => window.print(), 200);
  };

  const getItemSubtotal = (cat: CostCategory, item: any): number => {
    if (cat === 'contingency') return item.unitPrice * item.quantity;
    return calcItemSubtotal(item, data.basic.cityTier, data.currentPlan);
  };

  const getContingencyForPrint = (): number => {
    const five = COST_CATEGORIES.filter((c) => c !== 'contingency').reduce((s, c) => {
      const sub = result.categoryTotals.find((x) => x.category === c)?.subtotal || 0;
      return s + sub;
    }, 0);
    const contItem = data.costs.contingency[0];
    if (contItem && contItem.unitPrice === 0) {
      return five * (data.adjustments.contingencyRate / 100);
    }
    return (
      data.costs.contingency.reduce((s, it) => s + it.unitPrice * it.quantity, 0) || five * 0.1
    );
  };

  return (
    <section id="section-export" className="scroll-mt-28 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="section-title !border-0 !pb-0">导出预览</h2>
        <div className="no-print flex items-center gap-2">
          <button
            onClick={() => setPreviewMode('full')}
            className={`px-4 py-2 text-sm rounded-sm border transition-colors flex items-center gap-1.5 ${
              previewMode === 'full'
                ? 'bg-navy-800 text-white border-navy-800'
                : 'bg-white text-navy-700 border-stone2 hover:border-navy-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            完整版
          </button>
          <button
            onClick={() => setPreviewMode('simple')}
            className={`px-4 py-2 text-sm rounded-sm border transition-colors flex items-center gap-1.5 ${
              previewMode === 'simple'
                ? 'bg-navy-800 text-white border-navy-800'
                : 'bg-white text-navy-700 border-stone2 hover:border-navy-300'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            客户简版
          </button>
        </div>
      </div>

      {previewMode === 'full' && (
        <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card-base p-5 lg:col-span-1">
            <h3 className="font-serif font-semibold text-navy-800 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-gold-400" />
              费用分类占比
            </h3>
            <div className="h-64 mb-4">
              <Doughnut data={pieData} options={pieOptions as any} />
            </div>
            <div className="space-y-2">
              {result.categoryTotals.map((cat) => {
                const pct = result.pretaxTotal > 0 ? (cat.subtotal / result.pretaxTotal) * 100 : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[cat.category] }}
                    />
                    <span className="flex-1 truncate text-navy-700">{cat.name}</span>
                    <span className="font-mono-num text-xs text-navy-500 w-12 text-right">
                      {formatNumber(pct, 1)}%
                    </span>
                    <span className="font-mono-num text-xs text-navy-800 w-24 text-right">
                      {formatCurrency(cat.subtotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-base p-5 lg:col-span-2 space-y-5">
            <h3 className="font-serif font-semibold text-navy-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-gold-400" />
              汇总数据
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-sm bg-navy-50 border border-navy-100">
                <p className="text-xs text-navy-500 mb-1">参与人数</p>
                <p className="font-mono-num text-2xl font-bold text-navy-800">
                  {formatNumber(data.basic.peopleCount)}
                </p>
              </div>
              <div className="p-4 rounded-sm bg-gold-50 border border-gold-100">
                <p className="text-xs text-navy-500 mb-1">税前总额</p>
                <p className="font-mono-num text-2xl font-bold text-gold-700">
                  {formatCurrency(result.pretaxTotal)}
                </p>
              </div>
              <div className="p-4 rounded-sm bg-success/10 border border-success/30">
                <p className="text-xs text-navy-500 mb-1">人均成本</p>
                <p className="font-mono-num text-2xl font-bold text-success">
                  {formatCurrency(result.perPersonCost)}
                </p>
              </div>
              <div className="p-4 rounded-sm border border-stone2">
                <p className="text-xs text-navy-500 mb-1">预算使用率</p>
                <p className="font-mono-num text-2xl font-bold text-navy-800">
                  {formatNumber(
                    Math.min(result.budgetUsedPercent, 999.9),
                    1,
                  )}
                  <span className="text-base ml-1">%</span>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-stone2">
              <h4 className="text-sm font-semibold text-navy-700 mb-3">税费与附加</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 border border-stone2 rounded-sm">
                  <p className="text-xs text-navy-500 mb-0.5">增值税 ({data.adjustments.taxRate}%)</p>
                  <p className="font-mono-num font-semibold text-navy-800">{formatCurrency(result.tax)}</p>
                </div>
                <div className="p-3 border border-stone2 rounded-sm">
                  <p className="text-xs text-navy-500 mb-0.5">服务费 ({data.adjustments.serviceRate}%)</p>
                  <p className="font-mono-num font-semibold text-navy-800">{formatCurrency(result.serviceFee)}</p>
                </div>
                <div className="p-3 border-2 border-gold-300 bg-gold-50/50 rounded-sm">
                  <p className="text-xs text-gold-700 mb-0.5 font-medium">最终总预算</p>
                  <p className="font-mono-num font-bold text-navy-800 text-lg">{formatCurrency(result.grandTotal)}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone2">
              <h4 className="text-sm font-semibold text-navy-700 mb-3">操作导出</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={handlePrint}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  打印完整版
                </button>
                <button
                  onClick={handleExportClientPDF}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  客户简版
                </button>
                <button
                  onClick={() =>
                    exportJSON(data, `${data.basic.eventName || '活动预算'}_完整版.json`)
                  }
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  导出数据
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(formatCurrency(result.grandTotal)).then(
                      () => {
                        const btn = document.createElement('div');
                        btn.innerText = '已复制总预算';
                        btn.className =
                          'fixed top-20 right-6 z-50 bg-navy-800 text-white px-4 py-2 text-sm rounded-sm shadow-lg';
                        document.body.appendChild(btn);
                        setTimeout(() => btn.remove(), 1500);
                      },
                    );
                  }}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  复制总额
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="a4-page-wrap card-base overflow-hidden no-print">
        <div className="bg-cream/70 px-5 py-3 border-b border-stone2 flex items-center justify-between no-print">
          <p className="text-sm text-navy-600 font-medium">
            {previewMode === 'full' ? 'A4 完整版预算单预览' : 'A4 客户确认简版预览'}
          </p>
          <div className="flex items-center gap-2">
            {previewMode === 'full' ? (
              <label className="text-xs text-navy-500 flex items-center gap-1.5">
                页眉公司名称：
                <input
                  type="text"
                  value={companyNameForPrint}
                  onChange={(e) => setCompanyNameForPrint(e.target.value)}
                  placeholder="填写后打印显示"
                  className="w-40 px-2 py-1 border border-stone2 rounded-sm text-xs focus:outline-none focus:border-gold-400"
                />
              </label>
            ) : null}
            <button onClick={handlePrint} className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              打印/保存 PDF
            </button>
          </div>
        </div>

        <div className="bg-navy-50/40 p-6 md:p-10 overflow-auto max-h-[900px]">
          <div className="a4-page mx-auto bg-white shadow-lg !p-10 md:!p-[20mm]" style={{ width: '210mm', minHeight: '297mm' }}>
            <div className="border-b-2 border-gold-400 pb-4 mb-6 print-only-block">
              <div className="flex items-start justify-between">
                <div>
                  {companyNameForPrint && (
                    <p className="text-xs text-navy-500 mb-1 font-medium">{companyNameForPrint}</p>
                  )}
                  <h1 className="font-serif text-2xl font-bold text-navy-800 tracking-wide">
                    线下活动预算单
                  </h1>
                  <p className="text-sm text-navy-500 mt-1">
                    Activity Budget Estimation Sheet
                  </p>
                </div>
                <div className="text-right">
                  <div className="px-3 py-1.5 border border-navy-800 rounded-sm">
                    <p className="text-xs text-navy-500">方案</p>
                    <p className="font-serif font-semibold text-navy-800">{PLAN_LABELS[data.currentPlan]}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-cream/50 rounded-sm avoid-break">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-navy-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-navy-400">活动名称</p>
                  <p className="text-sm font-medium text-navy-800 truncate">{data.basic.eventName || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-navy-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-navy-400">举办日期</p>
                  <p className="text-sm font-medium text-navy-800">{data.basic.eventDate || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-navy-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-navy-400">参与人数</p>
                  <p className="text-sm font-medium text-navy-800 font-mono-num">
                    {formatNumber(data.basic.peopleCount)} 人
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-navy-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-navy-400">城市档位</p>
                  <p className="text-sm font-medium text-navy-800">
                    {CITY_TIER_LABELS[data.basic.cityTier]}
                  </p>
                </div>
              </div>
            </div>

            {previewMode === 'full' ? (
              <div className="space-y-5">
                {COST_CATEGORIES.map((cat) => {
                  const items = data.costs[cat];
                  if (items.length === 0) return null;
                  const catTotal =
                    result.categoryTotals.find((x) => x.category === cat)?.subtotal || 0;
                  let actualContTotal = catTotal;
                  if (cat === 'contingency') {
                    actualContTotal = getContingencyForPrint();
                  }
                  return (
                    <div key={cat} className="avoid-break">
                      <div className="flex items-center justify-between mb-2 pb-1 border-b border-stone2">
                        <h3 className="font-serif font-semibold text-navy-800 flex items-center gap-2">
                          <span
                            className="w-1 h-4 rounded-sm"
                            style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                          />
                          {CATEGORY_LABELS[cat]}
                        </h3>
                        <span
                          className="font-mono-num text-sm font-semibold"
                          style={{ color: CATEGORY_COLORS[cat] }}
                        >
                          {formatCurrency(cat === 'contingency' ? actualContTotal : catTotal)}
                        </span>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-navy-500 border-b border-stone2/60">
                            <th className="text-left font-medium py-1.5 w-[28%]">项目</th>
                            <th className="text-right font-medium py-1.5 w-[14%]">单价</th>
                            <th className="text-right font-medium py-1.5 w-[10%]">数量</th>
                            <th className="text-center font-medium py-1.5 w-[14%]">单位</th>
                            {previewMode === 'full' && (
                              <th className="text-left font-medium py-1.5 w-[20%]">备注</th>
                            )}
                            <th className="text-right font-medium py-1.5 w-[14%]">小计</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => {
                            let sub = getItemSubtotal(cat, item);
                            if (cat === 'contingency' && idx === 0 && item.unitPrice === 0) {
                              sub = getContingencyForPrint();
                            }
                            return (
                              <tr key={item.id} className="border-b border-stone2/40">
                                <td className="py-1.5 text-navy-800">
                                  {item.name}
                                  {cat === 'contingency' &&
                                    idx === 0 &&
                                    item.unitPrice === 0 && (
                                      <span className="ml-1 text-[10px] text-navy-400">
                                        (自动计提 {data.adjustments.contingencyRate}%)
                                      </span>
                                    )}
                                </td>
                                <td className="py-1.5 text-right font-mono-num text-navy-700">
                                  ¥{formatNumber(item.unitPrice)}
                                </td>
                                <td className="py-1.5 text-right font-mono-num text-navy-700">
                                  {formatNumber(item.quantity)}
                                </td>
                                <td className="py-1.5 text-center text-navy-600">{item.unit}</td>
                                {previewMode === 'full' && (
                                  <td className="py-1.5 text-navy-500 text-[11px] truncate pr-2">
                                    {item.remark || '-'}
                                  </td>
                                )}
                                <td className="py-1.5 text-right font-mono-num font-semibold text-navy-800">
                                  {formatCurrency(sub)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}

                <div className="mt-6 avoid-break page-break-before">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-t-2 border-stone2">
                        <td colSpan={3} className="py-2 text-right text-navy-600 pr-4">
                          税前合计
                        </td>
                        <td className="py-2 text-right font-mono-num font-semibold text-navy-800 w-32">
                          {formatCurrency(result.pretaxTotal)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 text-right text-navy-600 pr-4">
                          增值税 ({data.adjustments.taxRate}%)
                        </td>
                        <td className="py-2 text-right font-mono-num text-navy-700">
                          {formatCurrency(result.tax)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 text-right text-navy-600 pr-4">
                          服务费 ({data.adjustments.serviceRate}%)
                        </td>
                        <td className="py-2 text-right font-mono-num text-navy-700">
                          {formatCurrency(result.serviceFee)}
                        </td>
                      </tr>
                      <tr className="border-t-2 border-gold-400 bg-gold-50/50">
                        <td colSpan={3} className="py-3 text-right font-semibold text-navy-800 pr-4">
                          预算总计
                        </td>
                        <td className="py-3 text-right font-mono-num text-xl font-bold text-navy-800">
                          {formatCurrency(result.grandTotal)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 text-right text-navy-500 pr-4 text-xs">
                          人均成本
                        </td>
                        <td className="py-2 text-right font-mono-num text-navy-600">
                          {formatCurrency(result.perPersonCost)} / 人
                        </td>
                      </tr>
                      {data.basic.targetBudget > 0 && (
                        <tr>
                          <td colSpan={3} className="py-2 text-right text-navy-500 pr-4 text-xs">
                            目标预算
                          </td>
                          <td className="py-2 text-right font-mono-num text-navy-600">
                            {formatCurrency(data.basic.targetBudget)}
                            <span
                              className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-sm ${
                                result.budgetRemaining < 0
                                  ? 'bg-red-100 text-danger'
                                  : 'bg-green-100 text-success'
                              }`}
                            >
                              {result.budgetRemaining < 0 ? '超支' : '剩余'}{' '}
                              {formatCurrency(Math.abs(result.budgetRemaining))}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-10 pt-6 border-t border-stone2 avoid-break grid grid-cols-2 gap-8 text-xs text-navy-600">
                  <div>
                    <p className="mb-8 pb-8 border-b border-stone2/60">
                      客户确认（盖章/签字）：_______________________
                    </p>
                    <p className="text-navy-400">日期：______________</p>
                  </div>
                  <div className="text-right">
                    <p className="mb-8 pb-8 border-b border-stone2/60">
                      策划方（盖章/签字）：_______________________
                    </p>
                    <p className="text-navy-400">
                      编制日期：{new Date().toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-5 border-2 border-gold-300 rounded-sm bg-gold-50/30 avoid-break">
                  <p className="text-xs text-gold-700 text-center mb-2 tracking-widest">
                    预 算 总 览
                  </p>
                  <p className="font-mono-num text-4xl font-bold text-center text-navy-800 mb-1">
                    {formatCurrency(result.grandTotal)}
                  </p>
                  <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-gold-200/60 text-xs">
                    <span className="text-navy-600">
                      <Users className="w-3 h-3 inline align-[-2px] mr-1" />
                      {formatNumber(data.basic.peopleCount)} 人
                    </span>
                    <span className="text-navy-600">
                      人均 {formatCurrency(result.perPersonCost)}
                    </span>
                    <span className="text-navy-600">{PLAN_LABELS[data.currentPlan]}</span>
                  </div>
                </div>

                <table className="w-full text-sm avoid-break">
                  <thead>
                    <tr className="border-b-2 border-navy-800 text-left">
                      <th className="py-2 font-semibold text-navy-800">费用类别</th>
                      <th className="py-2 text-right font-semibold text-navy-800">金额</th>
                      <th className="py-2 text-right font-semibold text-navy-800 w-16">占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COST_CATEGORIES.map((cat) => {
                      const catTotal =
                        cat === 'contingency'
                          ? getContingencyForPrint()
                          : (result.categoryTotals.find((x) => x.category === cat)?.subtotal || 0);
                      const pct = result.pretaxTotal > 0 ? (catTotal / result.pretaxTotal) * 100 : 0;
                      return (
                        <tr key={cat} className="border-b border-stone2/60">
                          <td className="py-2.5 text-navy-800 flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-sm"
                              style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                            />
                            {CATEGORY_LABELS[cat]}
                          </td>
                          <td className="py-2.5 text-right font-mono-num text-navy-800">
                            {formatCurrency(catTotal)}
                          </td>
                          <td className="py-2.5 text-right font-mono-num text-navy-500 text-xs">
                            {formatNumber(pct, 1)}%
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-gold-400 bg-gold-50/30 font-semibold">
                      <td className="py-3 text-navy-800">合计（含税+服务费）</td>
                      <td className="py-3 text-right font-mono-num text-lg font-bold text-navy-800">
                        {formatCurrency(result.grandTotal)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-6 pt-5 border-t border-stone2 grid grid-cols-2 gap-6 text-xs text-navy-500 avoid-break">
                  <div>
                    <Building2 className="w-3 h-3 inline align-[-2px] mr-1 text-navy-400" />
                    活动名称：<span className="text-navy-700 font-medium">{data.basic.eventName}</span>
                  </div>
                  <div>
                    <Calendar className="w-3 h-3 inline align-[-2px] mr-1 text-navy-400" />
                    活动日期：<span className="text-navy-700 font-medium">{data.basic.eventDate}</span>
                  </div>
                  <div>
                    <Users className="w-3 h-3 inline align-[-2px] mr-1 text-navy-400" />
                    参与人数：<span className="text-navy-700 font-medium">{formatNumber(data.basic.peopleCount)} 人</span>
                  </div>
                  <div>
                    <MapPin className="w-3 h-3 inline align-[-2px] mr-1 text-navy-400" />
                    城市档位：<span className="text-navy-700 font-medium">{CITY_TIER_LABELS[data.basic.cityTier]}</span>
                  </div>
                </div>

                <div className="mt-12 pt-6 border-t border-dashed border-stone2 text-xs text-navy-400 avoid-break">
                  <p className="mb-6 pb-6 border-b border-stone2/60">
                    客户确认签字：_________________________________ 日期：______________
                  </p>
                  <p className="text-center text-[10px]">
                    本预算单仅供参考，最终费用以实际发生为准 · 编制日期：{new Date().toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
