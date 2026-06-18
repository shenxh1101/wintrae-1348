import { useState, useEffect } from 'react';
import {
  FileText,
  Receipt,
  GitCompare,
  AlertTriangle,
  Settings,
  Download,
  Building2,
  UtensilsCrossed,
  Package,
  Car,
  Users,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import { calculateBudget, formatCurrency, formatNumber } from '@/utils/calculations';
import { CATEGORY_COLORS, CATEGORY_LABELS, CostCategory } from '@/types';

const NAV_ITEMS = [
  { id: 'section-basic', label: '基础信息', icon: FileText },
  { id: 'section-cost', label: '费用明细', icon: Receipt },
  { id: 'section-plan', label: '方案对比', icon: GitCompare },
  { id: 'section-risk', label: '风险提示', icon: AlertTriangle },
  { id: 'section-adjust', label: '调整设置', icon: Settings },
  { id: 'section-export', label: '导出预览', icon: Download },
];

const CATEGORY_ICONS_COMP = {
  venue: Building2,
  catering: UtensilsCrossed,
  materials: Package,
  transport: Car,
  personnel: Users,
  contingency: ShieldAlert,
};

const COST_CATEGORIES: CostCategory[] = [
  'venue',
  'catering',
  'materials',
  'transport',
  'personnel',
  'contingency',
];

export default function Sidebar() {
  const [active, setActive] = useState('section-basic');
  const [costsExpanded, setCostsExpanded] = useState(true);
  const data = useBudgetStore((s) => s.data);
  const result = calculateBudget(data);

  useEffect(() => {
    const handler = () => {
      const offsets = NAV_ITEMS.map((item) => {
        const el = document.getElementById(item.id);
        return { id: item.id, top: el?.getBoundingClientRect().top ?? Infinity };
      });
      const visible = offsets
        .filter((o) => o.top <= 120)
        .sort((a, b) => b.top - a.top)[0];
      if (visible) setActive(visible.id);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleNav = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <aside className="no-print w-64 shrink-0 hidden lg:block">
      <div className="sticky top-[104px] space-y-2">
        <nav className="card-base overflow-hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            const isCost = item.id === 'section-cost';
            return (
              <div key={item.id}>
                <div
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNav(item.id)}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isCost && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCostsExpanded((v) => !v);
                      }}
                      className="p-1 hover:bg-navy-100 rounded-sm"
                    >
                      {costsExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
                {isCost && costsExpanded && (
                  <div className="bg-cream/50 border-t border-stone2 py-1">
                    {COST_CATEGORIES.map((cat) => {
                      const IconC = CATEGORY_ICONS_COMP[cat];
                      const total =
                        result.categoryTotals.find((c) => c.category === cat)?.subtotal || 0;
                      return (
                        <div
                          key={cat}
                          onClick={() => handleNav(`cat-${cat}`)}
                          className="flex items-center gap-2 px-4 py-2 pl-11 text-xs text-navy-600 hover:bg-navy-50 cursor-pointer"
                        >
                          <IconC className="w-3.5 h-3.5 shrink-0" style={{ color: CATEGORY_COLORS[cat] }} />
                          <span className="flex-1 truncate">{CATEGORY_LABELS[cat]}</span>
                          <span className="font-mono-num text-navy-500">
                            {formatCurrency(total)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="card-base p-4">
          <h3 className="font-serif text-sm font-semibold text-navy-800 mb-3 pb-2 border-b border-stone2">
            费用占比
          </h3>
          <div className="space-y-2.5">
            {result.categoryTotals.map((cat) => {
              const percent =
                result.pretaxTotal > 0 ? (cat.subtotal / result.pretaxTotal) * 100 : 0;
              return (
                <div key={cat.category} className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-navy-600 truncate pr-2">{cat.name}</span>
                    <span className="font-mono-num text-navy-500 shrink-0">
                      {formatNumber(percent, 1)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-stone2 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all"
                      style={{ width: `${percent}%`, backgroundColor: CATEGORY_COLORS[cat.category] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
