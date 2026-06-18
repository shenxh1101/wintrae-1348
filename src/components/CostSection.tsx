import { useState, useMemo } from 'react';
import {
  Building2,
  UtensilsCrossed,
  Package,
  Car,
  Users,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Calculator,
  FileCheck,
} from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import {
  calculateBudget,
  calcItemSubtotal,
  formatCurrency,
  formatNumber,
} from '@/utils/calculations';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CostCategory,
  CostItem,
} from '@/types';

const CATEGORY_ICONS_COMP: Record<CostCategory, any> = {
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

const UNIT_OPTIONS = ['元/人', '元/小时', '元/天', '元/次', '元/桌', '元/辆', '元/份', '元/场', '元/批', '元/套'];

interface CostCardProps {
  category: CostCategory;
}

function CostCategoryCard({ category }: CostCardProps) {
  const [expanded, setExpanded] = useState(true);
  const data = useBudgetStore((s) => s.data);
  const items = useBudgetStore((s) => s.data.costs[category]);
  const result = useMemo(() => calculateBudget(data), [data]);
  const updateCostItem = useBudgetStore((s) => s.updateCostItem);
  const addCostItem = useBudgetStore((s) => s.addCostItem);
  const removeCostItem = useBudgetStore((s) => s.removeCostItem);
  const setActiveSupplierCategory = useBudgetStore((s) => s.setActiveSupplierCategory);
  const suppliers = useBudgetStore((s) => s.data.suppliers[category]);

  const catTotal = result.categoryTotals.find((c) => c.category === category)?.subtotal || 0;
  const Icon = CATEGORY_ICONS_COMP[category];
  const color = CATEGORY_COLORS[category];

  const calcItemTotal = (item: CostItem) => {
    if (category === 'contingency') {
      if (item.unitPrice === 0 && item.name === '应急备用金') return catTotal * 0 + 0;
      return item.unitPrice * item.quantity;
    }
    return calcItemSubtotal(item, data.basic.cityTier, data.currentPlan);
  };

  const handleAddItem = () => {
    const name = window.prompt('请输入新项目名称：', '自定义项目');
    if (name && name.trim()) {
      addCostItem(category, name.trim());
    }
  };

  return (
    <div id={`cat-${category}`} className="card-base overflow-hidden scroll-mt-28">
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-cream/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-semibold text-navy-800">
              {CATEGORY_LABELS[category]}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-sm bg-navy-50 text-navy-600">
              {items.length} 项
            </span>
            {suppliers.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-sm bg-gold-50 text-gold-600">
                <FileCheck className="w-3 h-3 inline align-[-1px] mr-1" />
                {suppliers.length} 份报价
              </span>
            )}
          </div>
          {category === 'contingency' && (
            <p className="text-xs text-navy-500 mt-0.5">
              如应急备用金为 0 元，将自动按前五项合计 × {data.adjustments.contingencyRate}% 计提
            </p>
          )}
        </div>
        <div className="text-right mr-4 shrink-0">
          <p className="text-xs text-navy-500">合计</p>
          <p className="font-mono-num text-lg font-semibold" style={{ color }}>
            {formatCurrency(catTotal)}
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-navy-400 shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-navy-400 shrink-0" />
        )}
      </div>

      {expanded && (
        <div className="border-t border-stone2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/60 text-navy-600 text-xs">
                  <th className="text-left font-medium px-5 py-2.5 w-[28%]">项目名称</th>
                  <th className="text-right font-medium px-3 py-2.5 w-[15%]">单价</th>
                  <th className="text-right font-medium px-3 py-2.5 w-[10%]">数量</th>
                  <th className="text-center font-medium px-3 py-2.5 w-[14%]">计价单位</th>
                  <th className="text-left font-medium px-3 py-2.5 w-[18%]">备注</th>
                  <th className="text-right font-medium px-5 py-2.5 w-[12%]">
                    <span className="flex items-center gap-1 justify-end">
                      <Calculator className="w-3 h-3" />
                      小计
                    </span>
                  </th>
                  <th className="w-[3%]"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const subtotal =
                    category === 'contingency' && item.unitPrice === 0 && item.name === '应急备用金'
                      ? catTotal * 0
                      : calcItemTotal(item);
                  const isRiskHigh = data.basic.targetBudget > 0 &&
                    category !== 'contingency' &&
                    subtotal > data.basic.targetBudget * 0.3;
                  return (
                    <tr
                      key={item.id}
                      className={`border-t border-stone2/60 hover:bg-navy-50/30 transition-colors ${
                        isRiskHigh ? 'bg-red-50/40' : ''
                      }`}
                    >
                      <td className="px-5 py-2.5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateCostItem(category, item.id, 'name', e.target.value)}
                          className="w-full bg-transparent focus:outline-none focus:bg-white focus:border focus:border-gold-300 rounded-sm px-1 py-0.5 -ml-1 text-navy-800 font-medium"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-navy-400 text-xs">¥</span>
                          <input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateCostItem(
                                category,
                                item.id,
                                'unitPrice',
                                Math.max(0, parseFloat(e.target.value) || 0),
                              )
                            }
                            className="w-24 bg-transparent text-right focus:outline-none focus:bg-white focus:border focus:border-gold-300 rounded-sm px-1 py-0.5 font-mono-num text-navy-800"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          min={0}
                          step="0.5"
                          value={item.quantity}
                          onChange={(e) =>
                            updateCostItem(
                              category,
                              item.id,
                              'quantity',
                              Math.max(0, parseFloat(e.target.value) || 0),
                            )
                          }
                          className="w-16 bg-transparent text-right focus:outline-none focus:bg-white focus:border focus:border-gold-300 rounded-sm px-1 py-0.5 font-mono-num text-navy-800"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <select
                          value={item.unit}
                          onChange={(e) => updateCostItem(category, item.id, 'unit', e.target.value)}
                          className="bg-transparent border border-stone2 rounded-sm px-2 py-1 text-xs focus:outline-none focus:border-gold-400 text-navy-700"
                        >
                          <option value={item.unit}>{item.unit}</option>
                          {UNIT_OPTIONS.filter((u) => u !== item.unit).map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={item.remark}
                          placeholder="输入备注..."
                          onChange={(e) => updateCostItem(category, item.id, 'remark', e.target.value)}
                          className="w-full bg-transparent focus:outline-none focus:bg-white focus:border focus:border-gold-300 rounded-sm px-1 py-0.5 -ml-1 text-navy-600 text-xs placeholder:text-navy-300"
                        />
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <span
                          className={`font-mono-num font-semibold ${
                            isRiskHigh ? 'text-danger' : 'text-navy-800'
                          }`}
                        >
                          {formatCurrency(
                            category === 'contingency' &&
                              idx === 0 &&
                              item.unitPrice === 0
                              ? (() => {
                                  const five = result.categoryTotals
                                    .filter((c) => c.category !== 'contingency')
                                    .reduce((s, c) => s + c.subtotal, 0);
                                  return five * (data.adjustments.contingencyRate / 100);
                                })()
                              : subtotal,
                          )}
                        </span>
                      </td>
                      <td className="px-1 py-2.5 text-center">
                        {item.isCustom ? (
                          <button
                            onClick={() => removeCostItem(category, item.id)}
                            className="p-1.5 text-navy-400 hover:text-danger hover:bg-red-50 rounded-sm transition-colors"
                            title="删除此项"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-cream/40 border-t-2 border-stone2 font-medium">
                  <td colSpan={5} className="px-5 py-3 text-right text-navy-700">
                    {CATEGORY_LABELS[category]} 小计：
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-mono-num text-lg font-bold" style={{ color }}>
                      {formatCurrency(catTotal)}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-stone2 bg-cream/30">
            <button
              onClick={handleAddItem}
              className="btn-ghost flex items-center gap-1.5 text-navy-600"
            >
              <Plus className="w-3.5 h-3.5" />
              添加自定义项目
            </button>
            <button
              onClick={() => setActiveSupplierCategory(category)}
              className="btn-ghost flex items-center gap-1.5 text-gold-600 hover:text-gold-700 hover:bg-gold-50"
            >
              <FileCheck className="w-3.5 h-3.5" />
              供应商报价 ({suppliers.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CostSection() {
  return (
    <section id="section-cost" className="space-y-4 scroll-mt-28">
      <div className="flex items-center justify-between">
        <h2 className="section-title !border-0 !pb-0">费用明细</h2>
        <span className="text-xs text-navy-500 font-mono-num">
          共 {formatNumber(COST_CATEGORIES.length)} 大类，实时自动计算
        </span>
      </div>
      {COST_CATEGORIES.map((cat) => (
        <CostCategoryCard key={cat} category={cat} />
      ))}
    </section>
  );
}
