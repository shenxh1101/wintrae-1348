import { useMemo, useState } from 'react';
import {
  X,
  Plus,
  Star,
  Check,
  Shield,
  CalendarClock,
  FileCheck,
  Link as LinkIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
} from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import {
  calcDisplayPrice,
  createDefaultSupplier,
  formatCurrency,
} from '@/utils/calculations';
import { CostCategory, SupplierInfo } from '@/types';

const UNIT_OPTIONS = ['元/人', '元/小时', '元/天', '元/次', '元/桌', '元/辆', '元/份', '元/场', '元/批', '元/套', '元'];

export default function ComparePanel() {
  const compareItemId = useBudgetStore((s) => s.compareItemId);
  const closeComparePanel = useBudgetStore((s) => s.closeComparePanel);
  const data = useBudgetStore((s) => s.data);
  const selectSupplierForItem = useBudgetStore((s) => s.selectSupplierForItem);
  const addSupplier = useBudgetStore((s) => s.addSupplier);
  const updateSupplier = useBudgetStore((s) => s.updateSupplier);
  const removeSupplier = useBudgetStore((s) => s.removeSupplier);
  const toggleSupplierRecommended = useBudgetStore((s) => s.toggleSupplierRecommended);
  const [addingNew, setAddingNew] = useState(false);

  const ctx = useMemo(() => {
    if (!compareItemId) return null;
    const { category, itemId } = compareItemId;
    const item = data.costs[category].find((i) => i.id === itemId);
    if (!item) return null;
    const suppliers = data.suppliers[category];
    const estimated =
      calcDisplayPrice(item.basePrice, data.basic.cityTier, data.currentPlan, category) *
      item.quantity;
    return {
      category,
      itemId,
      item,
      suppliers,
      estimated,
    };
  }, [compareItemId, data]);

  if (!ctx) return null;
  const { category, itemId, item, suppliers, estimated } = ctx;

  const handleAddSupplier = () => {
    addSupplier(category as CostCategory, createDefaultSupplier(category as CostCategory));
    setAddingNew(true);
  };

  const handleSelect = (supplierId: string) => {
    selectSupplierForItem(category as CostCategory, itemId, supplierId);
  };

  const handleClearSelection = () => {
    selectSupplierForItem(category as CostCategory, itemId, null);
  };

  const calcSupplierFinal = (s: SupplierInfo): number => {
    const baseQty = Math.max(1, item.quantity);
    const base = s.quoteType === 'unit' ? s.quoteAmount * baseQty : s.quoteAmount;
    return s.taxIncluded
      ? base
      : base * (1 + (s.applicableTaxRate || data.adjustments.taxRate) / 100);
  };

  const checkValid = (s: SupplierInfo): { valid: boolean; label: string; color: string } => {
    if (!s.validUntil) return { valid: true, label: '未设置', color: 'text-navy-400' };
    const now = new Date();
    const valid = new Date(s.validUntil);
    const diff = Math.ceil((valid.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { valid: false, label: '已过期', color: 'text-danger' };
    if (diff <= 7) return { valid: true, label: `剩${diff}天`, color: 'text-warning' };
    return { valid: true, label: `剩${diff}天`, color: 'text-success' };
  };

  // 排序：已选中 > 推荐 > 其他，再按金额升序
  const sortedSuppliers = [...suppliers].sort((a, b) => {
    if (a.id === item.selectedSupplierId) return -1;
    if (b.id === item.selectedSupplierId) return 1;
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return calcSupplierFinal(a) - calcSupplierFinal(b);
  });

  return (
    <div className="fixed inset-0 z-50 no-print">
      <div
        className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm"
        onClick={closeComparePanel}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-navy-800 to-navy-700 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="text-xs text-gold-300 mb-1 font-medium tracking-wide">
                供应商比价
              </div>
              <h3 className="font-serif text-lg font-semibold truncate">{item.name}</h3>
              <div className="mt-2 flex items-center gap-4 text-xs text-navy-100">
                <span>
                  估算：
                  <span className="font-mono-num text-white font-semibold ml-1">
                    {formatCurrency(estimated)}
                  </span>
                </span>
                <span>
                  数量：
                  <span className="font-mono-num text-white ml-1">
                    {item.quantity}
                    {item.unit.replace('元/', '')}
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={closeComparePanel}
              className="p-2 hover:bg-white/10 rounded-sm shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="gold-divider" />

        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-cream/30">
          {suppliers.length === 0 && !addingNew && (
            <div className="text-center py-16 text-navy-400">
              <FileCheck className="w-14 h-14 mx-auto mb-3 opacity-25" />
              <p className="text-sm mb-1">尚未录入该类别的供应商报价</p>
              <p className="text-xs opacity-70">点击下方「新增供应商报价」开始比价</p>
            </div>
          )}

          {sortedSuppliers.map((s, idx) => {
            const final = calcSupplierFinal(s);
            const delta = final - estimated;
            const deltaPct = estimated > 0 ? (delta / estimated) * 100 : 0;
            const valid = checkValid(s);
            const isSelected = item.selectedSupplierId === s.id;

            return (
              <div
                key={s.id}
                className={`card-base overflow-hidden transition-all ${
                  isSelected
                    ? 'ring-2 ring-gold-400 ring-offset-2 shadow-cardHover'
                    : 'hover:shadow-cardHover'
                }`}
              >
                <div
                  className={`px-4 py-3 flex items-start gap-3 border-b border-stone2 ${
                    isSelected ? 'bg-gold-50' : 'bg-white'
                  }`}
                >
                  <button
                    onClick={() => toggleSupplierRecommended(category as CostCategory, s.id)}
                    className={`shrink-0 p-1 mt-0.5 ${
                      s.isRecommended ? 'text-gold-500' : 'text-stone2 hover:text-gold-400'
                    }`}
                    title={s.isRecommended ? '取消推荐' : '标记为推荐'}
                  >
                    <Star
                      className={`w-4 h-4 ${s.isRecommended ? 'fill-current' : ''}`}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        value={s.name}
                        placeholder="供应商名称"
                        onChange={(e) =>
                          updateSupplier(category as CostCategory, s.id, 'name', e.target.value)
                        }
                        className="flex-1 min-w-[100px] bg-transparent font-semibold text-navy-800 focus:outline-none focus:bg-white focus:border focus:border-gold-300 rounded-sm px-1.5 py-0.5 -ml-1.5"
                      />
                      {s.isRecommended && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-gold-100 text-gold-700 font-medium">
                          推荐
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-navy-50 text-navy-600 font-mono-num">
                        #{idx + 1}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
                          s.quoteType === 'unit'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-violet-50 text-violet-700'
                        }`}
                      >
                        {s.quoteType === 'unit' ? '单价报价' : '总价报价'}
                      </span>
                      {s.taxIncluded && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium bg-emerald-50 text-emerald-700">
                          已含税
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-navy-400 mb-0.5">联系人</label>
                        <input
                          type="text"
                          value={s.contact}
                          placeholder="姓名"
                          onChange={(e) =>
                            updateSupplier(category as CostCategory, s.id, 'contact', e.target.value)
                          }
                          className="w-full px-2 py-1 border border-stone2 rounded-sm focus:outline-none focus:border-gold-400"
                        />
                      </div>
                      <div>
                        <label className="block text-navy-400 mb-0.5">电话</label>
                        <input
                          type="text"
                          value={s.phone}
                          placeholder="手机号"
                          onChange={(e) =>
                            updateSupplier(category as CostCategory, s.id, 'phone', e.target.value)
                          }
                          className="w-full px-2 py-1 border border-stone2 rounded-sm focus:outline-none focus:border-gold-400"
                        />
                      </div>
                      <div>
                        <label className="block text-navy-400 mb-0.5">报价日期</label>
                        <input
                          type="date"
                          value={s.quoteDate}
                          onChange={(e) =>
                            updateSupplier(category as CostCategory, s.id, 'quoteDate', e.target.value)
                          }
                          className="w-full px-2 py-1 border border-stone2 rounded-sm focus:outline-none focus:border-gold-400"
                        />
                      </div>
                      <div>
                        <label className={`block mb-0.5 flex items-center gap-1 ${valid.color}`}>
                          <CalendarClock className="w-3 h-3" />
                          有效期 · {valid.label}
                        </label>
                        <input
                          type="date"
                          value={s.validUntil}
                          onChange={(e) =>
                            updateSupplier(category as CostCategory, s.id, 'validUntil', e.target.value)
                          }
                          className="w-full px-2 py-1 border border-stone2 rounded-sm focus:outline-none focus:border-gold-400"
                        />
                      </div>
                    </div>

                    <div className="mt-2.5 p-2.5 bg-cream/60 border border-stone2 rounded-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] text-navy-500">报价类型：</span>
                        <div className="inline-flex rounded-sm overflow-hidden border border-stone2 text-[11px]">
                          <button
                            onClick={() =>
                              updateSupplier(category as CostCategory, s.id, 'quoteType', 'total')
                            }
                            className={`px-2.5 py-1 ${
                              s.quoteType === 'total'
                                ? 'bg-violet-600 text-white'
                                : 'bg-white text-navy-600 hover:bg-violet-50'
                            }`}
                          >
                            总价
                          </button>
                          <button
                            onClick={() =>
                              updateSupplier(category as CostCategory, s.id, 'quoteType', 'unit')
                            }
                            className={`px-2.5 py-1 border-l border-stone2 ${
                              s.quoteType === 'unit'
                                ? 'bg-sky-600 text-white'
                                : 'bg-white text-navy-600 hover:bg-sky-50'
                            }`}
                          >
                            单价
                          </button>
                        </div>
                        {s.quoteType === 'unit' && (
                          <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-sm ml-auto">
                            会按数量 {item.quantity} 自动折算
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <label className="block text-navy-400 mb-0.5">
                            {s.quoteType === 'unit' ? '单价金额' : '总价金额'}
                          </label>
                          <div className="flex items-center gap-1">
                            <span className="text-navy-500">¥</span>
                            <input
                              type="number"
                              min={0}
                              value={s.quoteAmount}
                              onChange={(e) =>
                                updateSupplier(
                                  category as CostCategory,
                                  s.id,
                                  'quoteAmount',
                                  Math.max(0, parseFloat(e.target.value) || 0),
                                )
                              }
                              className="flex-1 w-full px-2 py-1 border border-stone2 rounded-sm focus:outline-none focus:border-gold-400 font-mono-num"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-navy-400 mb-0.5">计价单位</label>
                          <select
                            value={s.quoteUnit}
                            onChange={(e) =>
                              updateSupplier(category as CostCategory, s.id, 'quoteUnit', e.target.value)
                            }
                            className="w-full px-2 py-1 border border-stone2 rounded-sm focus:outline-none focus:border-gold-400"
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none p-1.5 rounded-sm hover:bg-white/60">
                          <input
                            type="checkbox"
                            checked={s.taxIncluded}
                            onChange={(e) =>
                              updateSupplier(
                                category as CostCategory,
                                s.id,
                                'taxIncluded',
                                e.target.checked,
                              )
                            }
                            className="accent-gold-500"
                          />
                          <span className="text-navy-700">含税</span>
                        </label>
                        <div>
                          <label className="block text-navy-400 mb-0.5">税率%</label>
                          <input
                            type="number"
                            min={0}
                            max={30}
                            step={0.5}
                            disabled={s.taxIncluded}
                            value={s.applicableTaxRate}
                            onChange={(e) =>
                              updateSupplier(
                                category as CostCategory,
                                s.id,
                                'applicableTaxRate',
                                Math.max(0, parseFloat(e.target.value) || 0),
                              )
                            }
                            className="w-full px-2 py-1 border border-stone2 rounded-sm focus:outline-none focus:border-gold-400 font-mono-num disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-navy-400 mb-0.5">综合评分</label>
                          <div className="flex items-center gap-0.5 py-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                onClick={() =>
                                  updateSupplier(category as CostCategory, s.id, 'rating', n)
                                }
                                className={`${
                                  n <= s.rating ? 'text-gold-500' : 'text-stone2'
                                } hover:scale-110 transition-transform`}
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${n <= s.rating ? 'fill-current' : ''}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2.5 border-t border-stone2/60">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] text-navy-500">
                              折算含税总价{s.quoteType === 'unit' ? `(×${item.quantity})` : ''}：
                            </span>
                            <span className="font-mono-num text-sm font-bold text-navy-800 ml-1">
                              {formatCurrency(final)}
                            </span>
                          </div>
                          <div
                            className={`flex items-center gap-1 text-[11px] font-medium ${
                              delta === 0
                                ? 'text-navy-500'
                                : delta > 0
                                ? 'text-danger'
                                : 'text-success'
                            }`}
                          >
                            {delta === 0 ? (
                              <>
                                <Minus className="w-3 h-3" />
                                估算一致
                              </>
                            ) : delta > 0 ? (
                              <>
                                <TrendingUp className="w-3 h-3" />
                                高 {formatCurrency(delta)} ({deltaPct.toFixed(1)}%)
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-3 h-3" />
                                低 {formatCurrency(Math.abs(delta))} (
                                {deltaPct.toFixed(1)}%)
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 space-y-2 text-xs">
                      <div>
                        <label className="block text-navy-400 mb-0.5 flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" />
                          附件链接
                        </label>
                        <input
                          type="text"
                          value={s.attachmentUrl}
                          placeholder="https://... 报价单 PDF / 云盘链接"
                          onChange={(e) =>
                            updateSupplier(
                              category as CostCategory,
                              s.id,
                              'attachmentUrl',
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-stone2 rounded-sm focus:outline-none focus:border-gold-400"
                        />
                      </div>
                      <div>
                        <label className="block text-navy-400 mb-0.5">服务范围 / 备注</label>
                        <textarea
                          rows={2}
                          value={s.notes}
                          placeholder="提供的服务内容、注意事项等..."
                          onChange={(e) =>
                            updateSupplier(category as CostCategory, s.id, 'notes', e.target.value)
                          }
                          className="w-full px-2 py-1 border border-stone2 rounded-sm focus:outline-none focus:border-gold-400 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-navy-400 mb-0.5 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          内部备注（客户不可见）
                        </label>
                        <textarea
                          rows={2}
                          value={s.internalNotes}
                          placeholder="内部评审意见、议价空间等..."
                          onChange={(e) =>
                            updateSupplier(
                              category as CostCategory,
                              s.id,
                              'internalNotes',
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-stone2 rounded-sm focus:outline-none focus:border-gold-400 resize-none bg-amber-50/40"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2.5 flex items-center justify-between bg-navy-50/50 border-t border-stone2/60">
                  <button
                    onClick={() => removeSupplier(category as CostCategory, s.id)}
                    className="text-xs text-navy-500 hover:text-danger flex items-center gap-1 transition-colors px-2 py-1 rounded-sm hover:bg-red-50"
                  >
                    删除该报价
                  </button>
                  {isSelected ? (
                    <button
                      onClick={handleClearSelection}
                      className="px-3 py-1.5 text-xs rounded-sm flex items-center gap-1.5 bg-gold-100 text-gold-700 font-medium hover:bg-gold-200 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      已使用此报价 · 点击取消
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelect(s.id)}
                      disabled={!valid.valid || !s.name}
                      className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      代入此报价
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {addingNew && suppliers.length === 0 && (
            <p className="text-center text-xs text-navy-400">
              请在上方卡片中继续填写新增报价的详情
            </p>
          )}
        </div>

        <div className="border-t border-stone2 p-4 bg-white flex items-center justify-between gap-3">
          <div className="text-xs text-navy-500">
            {item.selectedSupplierId
              ? '✅ 当前已使用供应商报价参与总预算'
              : '当前使用系统估算金额'}
          </div>
          <div className="flex gap-2">
            {item.selectedSupplierId && (
              <button onClick={handleClearSelection} className="btn-ghost">
                清除报价关联
              </button>
            )}
            <button
              onClick={handleAddSupplier}
              className="btn-secondary flex items-center gap-1.5 !py-2"
            >
              <Plus className="w-4 h-4" />
              新增供应商报价
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
