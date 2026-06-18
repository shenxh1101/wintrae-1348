import { useMemo } from 'react';
import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import { calculateBudget, analyzeRisks } from '@/utils/calculations';
import { RiskItem, CATEGORY_LABELS } from '@/types';

const LEVEL_STYLES: Record<RiskItem['level'], {
  icon: any;
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  title: string;
  badge: string;
}> = {
  high: {
    icon: AlertTriangle,
    bg: 'bg-red-50/60',
    border: 'border-danger/30',
    iconBg: 'bg-danger/15',
    iconColor: 'text-danger',
    title: '高风险',
    badge: 'bg-danger text-white',
  },
  medium: {
    icon: AlertCircle,
    bg: 'bg-amber-50/60',
    border: 'border-warning/30',
    iconBg: 'bg-warning/15',
    iconColor: 'text-warning',
    title: '中风险',
    badge: 'bg-warning text-white',
  },
  low: {
    icon: Info,
    bg: 'bg-navy-50/60',
    border: 'border-navy-200',
    iconBg: 'bg-navy-100',
    iconColor: 'text-navy-600',
    title: '提示',
    badge: 'bg-navy-600 text-white',
  },
};

export default function RiskSection() {
  const data = useBudgetStore((s) => s.data);
  const result = useMemo(() => calculateBudget(data), [data]);
  const risks = useMemo(() => analyzeRisks(data, result), [data, result]);

  const grouped: Record<RiskItem['level'], RiskItem[]> = {
    high: [],
    medium: [],
    low: [],
  };
  risks.forEach((r) => grouped[r.level].push(r));

  const counts = {
    high: grouped.high.length,
    medium: grouped.medium.length,
    low: grouped.low.length,
  };

  const scrollToCategory = (cat?: string) => {
    if (!cat) return;
    const el = document.getElementById(`cat-${cat}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const renderList = (list: RiskItem[]) =>
    list.map((r) => {
      const style = LEVEL_STYLES[r.level];
      const Icon = style.icon;
      return (
        <div
          key={r.id}
          className={`${style.bg} border ${style.border} rounded-sm p-4 flex gap-3`}
        >
          <div className={`${style.iconBg} w-9 h-9 rounded-sm flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${style.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-navy-800 text-sm">{r.title}</h4>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${style.badge}`}>
                {style.title}
              </span>
            </div>
            <p className="text-xs text-navy-600 leading-relaxed">{r.description}</p>
            {r.relatedCategory && (
              <button
                onClick={() => scrollToCategory(r.relatedCategory)}
                className="mt-2 text-xs text-gold-600 hover:text-gold-700 flex items-center gap-0.5 font-medium"
              >
                前往{CATEGORY_LABELS[r.relatedCategory]}
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      );
    });

  return (
    <section id="section-risk" className="scroll-mt-28 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="section-title !border-0 !pb-0">风险提示</h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-danger">
            <span className="w-2 h-2 rounded-full bg-danger" />
            高风险 {counts.high}
          </span>
          <span className="flex items-center gap-1 text-warning">
            <span className="w-2 h-2 rounded-full bg-warning" />
            中风险 {counts.medium}
          </span>
          <span className="flex items-center gap-1 text-navy-500">
            <span className="w-2 h-2 rounded-full bg-navy-400" />
            提示 {counts.low}
          </span>
        </div>
      </div>

      {counts.high > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-danger flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            需要立即关注
          </h3>
          {renderList(grouped.high)}
        </div>
      )}

      {counts.medium > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-warning flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            建议复核
          </h3>
          {renderList(grouped.medium)}
        </div>
      )}

      {counts.low > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-navy-600 flex items-center gap-2">
            <Info className="w-4 h-4" />
            优化建议
          </h3>
          {renderList(grouped.low)}
        </div>
      )}

      {risks.length === 0 && (
        <div className="card-base p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-success/15 mx-auto mb-4 flex items-center justify-center">
            <Info className="w-7 h-7 text-success" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-navy-800 mb-1">预算方案健康</h3>
          <p className="text-sm text-navy-500">未发现风险项，继续完善细节或导出方案。</p>
        </div>
      )}
    </section>
  );
}
