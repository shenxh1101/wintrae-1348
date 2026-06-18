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
  FileCheck,
  Calculator,
  Tag,
  Shield,
  Building,
  FileSpreadsheet,
} from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import {
  calculateBudget,
  calcDisplayPrice,
  formatCurrency,
  formatNumber,
  reverseBasePrice,
  calcItemSubtotal as utilCalcItemSubtotal,
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

const UNIT_OPTIONS = [
  '元/人',
  '元/小时',
  '元/天',
  '元/次',
  '元/桌',
  '元/辆',
  '元/份',
  '元/场',
  '元/批',
  '元/套',
];

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
  const openComparePanel = useBudgetStore((s) => s.openComparePanel);
  const selectSupplierForItem = useBudgetStore((s) => s.selectSupplierForItem);
  const suppliers = useBudgetStore((s) => s.data.suppliers[category]);

  const catTotal = result.categoryTotals.find((c) => c.category === category)?.subtotal || 0;
  const Icon = CATEGORY_ICONS_COMP[category];
  const color = CATEGORY_COLORS[category];

  /** 计算单项小计（优先供应商报价） */
  const calcItemResult = (item: CostItem) => {
    return utilCalcItemSubtotal(
      item,
      data.basic.cityTier,
      data.currentPlan,
      category,
      suppliers,
      data.adjustments.taxRate,
    );
  };

  /** 用户编辑显示单价 → 反推写回 basePrice（以当前档位/方案为基准） */
  const handleDisplayPriceChange = (item: CostItem, displayPrice: number) => {
    const newBase = reverseBasePrice(
      displayPrice,
      data.basic.cityTier,
      data.currentPlan,
      category,
    );
    updateCostItem(category, item.id, 'basePrice', Math.round(newBase * 100) / 100);
  };

  const handleAddItem = () => {
    const name = window.prompt('请输入新项目名称：', '自定义项目');
    if (name && name.trim()) {
      addCostItem(category, name.trim());
    }
  };

  /** 获取显示单价：基准价格 × 系数，备用金不乘 */
  const getDisplayPrice = (item: CostItem): number => {
    return calcDisplayPrice(item.basePrice, data.basic.cityTier, data.currentPlan, category);
  };

  /** 计算选中供应商的占比数量，用于展示进度 */
  const supplierCount = suppliers.length;
  const itemsUsingSupplier = items.filter((i) => i.selectedSupplierId).length;

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
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-base font-semibold text-navy-800">
              {CATEGORY_LABELS[category]}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-sm bg-navy-50 text-navy-600">
              {items.length} 项
            </span>
            {supplierCount > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-sm flex items-center gap-1 ${
                  itemsUsingSupplier > 0
                    ? 'bg-gold-100 text-gold-700'
                    : 'bg-navy-50 text-navy-600'
                }`}
              >
                <FileSpreadsheet className="w-3 h-3" />
                {supplierCount} 份报价
                {itemsUsingSupplier > 0 && (
                  <span className="ml-0.5">· 已采用 {itemsUsingSupplier}</span>
                )}
              </span>
            )}
            {category === 'contingency' && (
              <span className="text-[11px] text-navy-400">
                应急备用金设为 0 时，自动按前五项合计 × {data.adjustments.contingencyRate}% 计提
              </span>
            )}
          </div>
        </div>
        <div className="text-right mr-4 shrink-0">
          <p className="text-xs text-navy-500">合计</p>
          <p
            className="font-mono-num text-lg font-semibold"
            style={{ color }}
          >
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
                  <th className="text-left font-medium px-5 py-2.5 w-[22%]">项目名称</th>
                  <th className="text-right font-medium px-3 py-2.5 w-[11%]">
                    显示单价
                    <span className="block text-[10px] font-normal text-navy-400 mt-0.5">
                      (基准价×系数)
                    </span>
                  </th>
                  <th className="text-right font-medium px-3 py-2.5 w-[7%]">数量</th>
                  <th className="text-center font-medium px-3 py-2.5 w-[11%]">计价单位</th>
                  <th className="text-center font-medium px-3 py-2.5 w-[9%]">供应商</th>
                  <th className="text-left font-medium px-3 py-2.5 w-[15%]">备注</th>
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
                  const r = calcItemResult(item);
                  let showSubtotal = r.subtotal;
                  if (category === 'contingency' && idx === 0 && item.basePrice === 0) {
                    const five = COST_CATEGORIES.filter((c) => c !== 'contingency').reduce(
                      (s, c) =>
                        s +
                        (result.categoryTotals.find((x) => x.category === c)?.subtotal || 0),
                      0,
                    );
                    showSubtotal = five * (data.adjustments.contingencyRate / 100);
                  }

                  const displayPrice = getDisplayPrice(item);
                  const isRiskHigh =
                    data.basic.targetBudget > 0 &&
                    category !== 'contingency' &&
                    showSubtotal > data.basic.targetBudget * 0.3;

                  const currentSupplier = r.fromSupplier ? r.supplier : null;

                  return (
                    <tr
                      key={item.id}
                      className={`border-t border-stone2/60 hover:bg-navy-50/30 transition-colors ${
                        isRiskHigh ? 'bg-red-50/40' : ''
                      } ${r.fromSupplier ? 'bg-gold-50/30' : ''}`}
                    >
                      <td className="px-5 py-2.5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateCostItem(category, item.id, 'name', e.target.value)
                          }
                          className="w-full bg-transparent focus:outline-none focus:bg-white focus:border focus:border-gold-300 rounded-sm px-1 py-0.5 -ml-1 text-navy-800 font-medium"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {r.fromSupplier ? (
                          <div className="inline-block text-right">
                            <div className="text-[11px] text-gold-600 font-medium flex items-center justify-end gap-1">
                              <Shield className="w-3 h-3" />
                              供应商价
                            </div>
                            <div
                              className="font-mono-num font-semibold text-gold-700 cursor-help"
                              title={`供应商「${currentSupplier?.name || ''}」报价`}
                            >
                              {formatCurrency(
                                (currentSupplier?.quoteAmount || 0) /
                                  Math.max(1, item.quantity),
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-navy-400 text-xs">¥</span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={displayPrice.toFixed(2)}
                              onChange={(e) =>
                                handleDisplayPriceChange(
                                  item,
                                  Math.max(0, parseFloat(e.target.value) || 0),
                                )
                              }
                              className="w-24 bg-transparent text-right focus:outline-none focus:bg-white focus:border focus:border-gold-300 rounded-sm px-1 py-0.5 font-mono-num text-navy-800"
                            />
                          </div>
                        )}
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
                          onChange={(e) =>
                            updateCostItem(category, item.id, 'unit', e.target.value)
                          }
                          disabled={r.fromSupplier}
                          className="bg-transparent border border-stone2 rounded-sm px-2 py-1 text-xs focus:outline-none focus:border-gold-400 text-navy-700 disabled:opacity-60"
                        >
                          <option value={item.unit}>{item.unit}</option>
                          {UNIT_OPTIONS.filter((u) => u !== item.unit).map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => openComparePanel(category, item.id)}
                            disabled={category === 'contingency'}
                            className={`px-2 py-1 rounded-sm text-[11px] flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              r.fromSupplier
                                ? 'bg-gold-100 text-gold-700 hover:bg-gold-200 border border-gold-300'
                                : supplierCount > 0
                                ? 'bg-navy-50 text-navy-600 hover:bg-navy-100 border border-navy-200'
                                : 'bg-white text-navy-500 hover:bg-navy-50 border border-stone2'
                            }`}
                            title={supplierCount > 0 ? `已有 ${supplierCount} 份报价，点击比价并选用` : '录入供应商报价后进行比价'}
                          >
                            <Tag className="w-3 h-3" />
                            {r.fromSupplier
                              ? currentSupplier?.name
                                ? currentSupplier.name.slice(0, 6) +
                                  (currentSupplier.name.length > 6 ? '…' : '')
                                : '已选用'
                              : supplierCount > 0
                              ? `比价(${supplierCount})`
                              : '比价'}
                          </button>
                        </div>
                        {r.fromSupplier && (
                          <button
                            onClick={() => selectSupplierForItem(category, item.id, null)}
                            className="text-[10px] text-navy-400 hover:text-danger mt-1 block mx-auto"
                          >
                            取消
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={item.remark}
                          placeholder="客户可见备注..."
                          onChange={(e) =>
                            updateCostItem(category, item.id, 'remark', e.target.value)
                          }
                          className="w-full bg-transparent focus:outline-none focus:bg-white focus:border focus:border-gold-300 rounded-sm px-1 py-0.5 -ml-1 text-navy-600 text-xs placeholder:text-navy-300"
                        />
                        <input
                          type="text"
                          value={item.internalNote}
                          placeholder="【内部】仅我方可见..."
                          onChange={(e) =>
                            updateCostItem(category, item.id, 'internalNote', e.target.value)
                          }
                          className="w-full mt-1 bg-amber-50/40 border border-amber-100 focus:border-gold-300 rounded-sm px-1.5 py-0.5 -ml-1 text-navy-600 text-[11px] placeholder:text-amber-300 focus:outline-none"
                        />
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <span
                          className={`font-mono-num font-semibold ${
                            isRiskHigh ? 'text-danger' : r.fromSupplier ? 'text-gold-700' : 'text-navy-800'
                          }`}
                        >
                          {formatCurrency(showSubtotal)}
                        </span>
                        {r.fromSupplier && (
                          <div className="text-[10px] text-gold-600 mt-0.5">
                            供应商报价
                          </div>
                        )}
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
                  <td colSpan={6} className="px-5 py-3 text-right text-navy-700">
                    {CATEGORY_LABELS[category]} 小计：
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className="font-mono-num text-lg font-bold"
                      style={{ color }}
                    >
                      {formatCurrency(catTotal)}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-stone2 bg-cream/30 flex-wrap gap-2">
            <button
              onClick={handleAddItem}
              className="btn-ghost flex items-center gap-1.5 text-navy-600"
            >
              <Plus className="w-3.5 h-3.5" />
              添加自定义项目
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openComparePanel(category, items[0]?.id || 'dummy')}
                className={`btn-ghost flex items-center gap-1.5 ${supplierCount > 0 ? 'text-gold-600 hover:text-gold-700 hover:bg-gold-50' : 'text-navy-600'}`}
                disabled={items.length === 0}
                title="直接打开比价面板，录入多家报价"
              >
                <Shield className="w-3.5 h-3.5" />
                比价管理 ({supplierCount})
              </button>
              <button
                onClick={() => setActiveSupplierCategory(category)}
                className="btn-ghost flex items-center gap-1.5 text-navy-600 hover:bg-navy-50"
                title="以列表形式批量管理该类别的所有供应商报价"
              >
                <Building className="w-3.5 h-3.5" />
                供应商列表
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CostSection() {
  return (
    <section id="section-cost" className="space-y-4 scroll-mt-28">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="section-title !border-0 !pb-0">费用明细</h2>
        <div className="text-xs text-navy-500 flex items-center gap-3">
          <span>
            <Tag className="w-3.5 h-3.5 inline align-[-2px] mr-1 text-gold-500" />
            每行可录入多家供应商比价，直接选用报价代入预算
          </span>
          <span className="font-mono-num">
            共 {formatNumber(COST_CATEGORIES.length)} 大类
          </span>
        </div>
      </div>
      {COST_CATEGORIES.map((cat) => (
        <CostCategoryCard key={cat} category={cat} />
      ))}
    </section>
  );
}
