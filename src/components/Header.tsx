import { useMemo } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { calculateBudget, formatCurrency, formatNumber } from '@/utils/calculations';
import { PLAN_LABELS } from '@/types';
import { Calculator, Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Header() {
  const data = useBudgetStore((s) => s.data);
  const result = useMemo(() => calculateBudget(data), [data]);

  const usedPercent = Math.min(result.budgetUsedPercent, 100);
  const barColor =
    result.budgetRemaining < 0
      ? 'bg-danger'
      : result.budgetUsedPercent >= 90
      ? 'bg-warning'
      : 'bg-success';

  return (
    <header className="sticky top-0 z-40 no-print">
      <div className="bg-navy-800 text-white">
        <div className="max-w-[1600px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 text-gold-400" />
              <div>
                <h1 className="font-serif text-lg font-semibold tracking-wide">
                  线下活动预算估算工具
                </h1>
                <p className="text-xs text-navy-200">
                  {data.basic.eventName || '未命名活动'} · {PLAN_LABELS[data.currentPlan]}
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <div className="text-right">
                <p className="text-xs text-navy-200 mb-0.5">总预算</p>
                <p className="font-mono-num text-xl font-semibold text-gold-400">
                  {formatCurrency(result.grandTotal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-navy-200 mb-0.5 flex items-center gap-1 justify-end">
                  <Users className="w-3 h-3" /> 人均成本
                </p>
                <p className="font-mono-num text-xl font-semibold">
                  {formatCurrency(result.perPersonCost)}
                </p>
              </div>
              <div className="text-right min-w-[120px]">
                <p className="text-xs text-navy-200 mb-1 flex items-center gap-1 justify-end">
                  <TrendingUp className="w-3 h-3" /> 预算进度
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-navy-700 rounded-sm overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-500`}
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                  <span className="font-mono-num text-xs w-12 text-right">
                    {formatNumber(result.budgetUsedPercent, 1)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-navy-600">
                {result.budgetRemaining < 0 ? (
                  <AlertTriangle className="w-4 h-4 text-danger" />
                ) : result.budgetUsedPercent >= 90 ? (
                  <AlertTriangle className="w-4 h-4 text-warning" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-success" />
                )}
                <span className={`text-sm font-mono-num ${
                  result.budgetRemaining < 0
                    ? 'text-danger'
                    : result.budgetUsedPercent >= 90
                    ? 'text-warning'
                    : 'text-navy-100'
                }`}>
                  {result.budgetRemaining < 0 ? '超支' : '剩余'} {formatCurrency(Math.abs(result.budgetRemaining))}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="gold-divider" />
      </div>

      <div className="md:hidden bg-white border-b border-stone2 shadow-card px-4 py-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-navy-500">总预算</p>
          <p className="font-mono-num text-lg font-semibold text-navy-800">{formatCurrency(result.grandTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-navy-500">人均成本</p>
          <p className="font-mono-num text-lg font-semibold text-navy-800">{formatCurrency(result.perPersonCost)}</p>
        </div>
      </div>
    </header>
  );
}
