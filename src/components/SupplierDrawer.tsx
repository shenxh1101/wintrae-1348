import { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileCheck,
  Calendar,
  CalendarClock,
  User,
  Phone,
  Mail,
  DollarSign,
  StickyNote,
  Star,
  ShieldCheck,
  Link as LinkIcon,
  Shield,
  Info,
} from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import { CATEGORY_LABELS, SupplierInfo, CostCategory } from '@/types';
import { formatCurrency } from '@/utils/calculations';

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
  '元',
];

export default function SupplierDrawer() {
  const activeCategory = useBudgetStore((s) => s.activeSupplierCategory);
  const setActiveSupplierCategory = useBudgetStore((s) => s.setActiveSupplierCategory);
  const data = useBudgetStore((s) => s.data);
  const suppliers = activeCategory ? data.suppliers[activeCategory] : [];
  const addSupplier = useBudgetStore((s) => s.addSupplier);
  const updateSupplier = useBudgetStore((s) => s.updateSupplier);
  const removeSupplier = useBudgetStore((s) => s.removeSupplier);
  const toggleSupplierRecommended = useBudgetStore((s) => s.toggleSupplierRecommended);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!activeCategory) return null;

  const handleClose = () => {
    setActiveSupplierCategory(null);
    setExpandedId(null);
  };
  const handleAdd = () => {
    const cat = activeCategory as CostCategory;
    addSupplier(cat, {});
  };

  const updateField = (id: string, field: keyof SupplierInfo, value: any) => {
    updateSupplier(activeCategory as CostCategory, id, field, value);
  };

  const calcSupplierFinal = (s: SupplierInfo): number => {
    return s.taxIncluded
      ? s.quoteAmount
      : s.quoteAmount * (1 + (s.applicableTaxRate || data.adjustments.taxRate) / 100);
  };

  const checkValid = (
    s: SupplierInfo,
  ): { valid: boolean; label: string; color: string; bgColor: string } => {
    if (!s.validUntil)
      return { valid: true, label: '未设置', color: 'text-navy-400', bgColor: 'bg-navy-50' };
    const now = new Date();
    const valid = new Date(s.validUntil);
    const diff = Math.ceil((valid.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0)
      return { valid: false, label: `已过期 ${-diff} 天`, color: 'text-danger', bgColor: 'bg-red-50' };
    if (diff <= 7)
      return {
        valid: true,
        label: `剩 ${diff} 天`,
        color: 'text-warning',
        bgColor: 'bg-amber-50',
      };
    return {
      valid: true,
      label: `剩 ${diff} 天`,
      color: 'text-success',
      bgColor: 'bg-green-50',
    };
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // 排序：推荐 > 其他，再按金额升序
  const sortedSuppliers = [...suppliers].sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return calcSupplierFinal(a) - calcSupplierFinal(b);
  });

  return (
    <div className="fixed inset-0 z-50 no-print">
      <div
        className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-navy-800 to-navy-700 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-gold-400/20 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold">
                  {CATEGORY_LABELS[activeCategory]} · 供应商管理
                </h3>
                <p className="text-xs text-navy-200 mt-0.5">
                  共 {suppliers.length} 份报价 · 推荐{' '}
                  {suppliers.filter((s) => s.isRecommended).length} 家
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-sm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="gold-divider" />

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-cream/30">
          {suppliers.length === 0 && (
            <div className="text-center py-16 text-navy-400">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-navy-50 flex items-center justify-center">
                <FileCheck className="w-10 h-10 opacity-40" />
              </div>
              <p className="text-sm font-medium text-navy-600 mb-1">
                暂无供应商报价记录
              </p>
              <p className="text-xs opacity-70">
                点击下方按钮添加第一份报价，支持多家比价
              </p>
            </div>
          )}

          {sortedSuppliers.map((s, idx) => {
            const final = calcSupplierFinal(s);
            const valid = checkValid(s);
            const isExpanded = expandedId === s.id;

            return (
              <div
                key={s.id}
                className={`card-base overflow-hidden transition-all ${
                  !valid.valid ? 'ring-1 ring-danger/40' : ''
                }`}
              >
                {/* 头部概览 */}
                <div
                  className={`px-4 py-3.5 flex items-start gap-3 border-b border-stone2 cursor-pointer hover:bg-cream/40 transition-colors ${
                    isExpanded ? 'bg-cream/60' : 'bg-white'
                  }`}
                  onClick={() => toggleExpand(s.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSupplierRecommended(activeCategory as CostCategory, s.id);
                    }}
                    className={`shrink-0 p-1 mt-0.5 ${
                      s.isRecommended
                        ? 'text-gold-500 hover:text-gold-600'
                        : 'text-stone2 hover:text-gold-400'
                    }`}
                    title={s.isRecommended ? '取消推荐' : '标记为推荐'}
                  >
                    <Star
                      className={`w-4.5 h-4.5 ${s.isRecommended ? 'fill-current' : ''}`}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy-800 truncate">
                        {s.name || <span className="text-navy-400 font-normal">（未填写名称）</span>}
                      </span>
                      {s.isRecommended && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-gold-100 text-gold-700 font-medium">
                          推荐
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-navy-50 text-navy-600 font-mono-num">
                        #{idx + 1}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${valid.color} ${valid.bgColor}`}
                      >
                        有效期 · {valid.label}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-xs text-navy-500 flex-wrap">
                        {s.contact && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {s.contact}
                          </span>
                        )}
                        {s.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {s.phone}
                          </span>
                        )}
                        <div className="flex items-center gap-0.5 py-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`w-3 h-3 ${
                                n <= s.rating
                                  ? 'text-gold-500 fill-current'
                                  : 'text-stone2'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono-num text-lg font-bold text-navy-800">
                            {formatCurrency(final)}
                          </span>
                          <span className="text-[10px] text-navy-400">含税</span>
                        </div>
                        {!s.taxIncluded && s.quoteAmount > 0 && (
                          <p className="text-[10px] text-navy-400">
                            报价 {formatCurrency(s.quoteAmount)} +{' '}
                            {s.applicableTaxRate || data.adjustments.taxRate}% 税
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSupplier(activeCategory as CostCategory, s.id);
                    }}
                    className="p-1.5 text-navy-400 hover:text-danger hover:bg-red-50 rounded-sm transition-colors shrink-0"
                    title="删除该报价"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 展开的详细编辑区 */}
                {isExpanded && (
                  <div className="px-4 py-4 space-y-3.5 bg-white">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                          <FileCheck className="w-3 h-3" />
                          供应商名称
                        </label>
                        <input
                          type="text"
                          value={s.name}
                          placeholder="如：XX会展服务有限公司"
                          onChange={(e) => updateField(s.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                          <Mail className="w-3 h-3" />
                          邮箱
                        </label>
                        <input
                          type="email"
                          value={s.email}
                          placeholder="xxx@company.com"
                          onChange={(e) => updateField(s.id, 'email', e.target.value)}
                          className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                          <User className="w-3 h-3" />
                          联系人
                        </label>
                        <input
                          type="text"
                          value={s.contact}
                          placeholder="姓名"
                          onChange={(e) => updateField(s.id, 'contact', e.target.value)}
                          className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                          <Phone className="w-3 h-3" />
                          联系电话
                        </label>
                        <input
                          type="tel"
                          value={s.phone}
                          placeholder="手机号"
                          onChange={(e) => updateField(s.id, 'phone', e.target.value)}
                          className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                          <Calendar className="w-3 h-3" />
                          报价日期
                        </label>
                        <input
                          type="date"
                          value={s.quoteDate}
                          onChange={(e) => updateField(s.id, 'quoteDate', e.target.value)}
                          className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400"
                        />
                      </div>
                      <div>
                        <label
                          className={`flex items-center gap-1.5 text-xs mb-1 ${valid.color}`}
                        >
                          <CalendarClock className="w-3 h-3" />
                          有效期至 · {valid.label}
                        </label>
                        <input
                          type="date"
                          value={s.validUntil}
                          onChange={(e) => updateField(s.id, 'validUntil', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:border-gold-400 ${
                            !valid.valid ? 'border-danger/40 bg-red-50/40' : 'border-stone2'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-cream/60 border border-stone2 rounded-sm space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <DollarSign className="w-4 h-4 text-gold-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <label className="block text-xs text-navy-500 mb-0.5">
                              报价金额
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-navy-500 shrink-0">¥</span>
                              <input
                                type="number"
                                min={0}
                                value={s.quoteAmount}
                                onChange={(e) =>
                                  updateField(
                                    s.id,
                                    'quoteAmount',
                                    Math.max(0, parseFloat(e.target.value) || 0),
                                  )
                                }
                                className="flex-1 w-full px-2.5 py-1.5 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400 font-mono-num"
                              />
                              <select
                                value={s.quoteUnit}
                                onChange={(e) =>
                                  updateField(s.id, 'quoteUnit', e.target.value)
                                }
                                className="px-2.5 py-1.5 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400 max-w-[100px]"
                              >
                                {UNIT_OPTIONS.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none p-2 rounded-sm hover:bg-white/70 border border-stone2/60 bg-white/50">
                          <input
                            type="checkbox"
                            checked={s.taxIncluded}
                            onChange={(e) =>
                              updateField(s.id, 'taxIncluded', e.target.checked)
                            }
                            className="accent-gold-500 w-3.5 h-3.5"
                          />
                          <span className="text-navy-700 font-medium">报价已含税</span>
                        </label>
                        <div>
                          <label className="block text-navy-400 mb-0.5">
                            税率 {!s.taxIncluded ? '%（适用）' : '%'}
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={30}
                            step={0.5}
                            disabled={s.taxIncluded}
                            value={s.applicableTaxRate}
                            onChange={(e) =>
                              updateField(
                                s.id,
                                'applicableTaxRate',
                                Math.max(0, parseFloat(e.target.value) || 0),
                              )
                            }
                            className="w-full px-2.5 py-1.5 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400 font-mono-num disabled:opacity-50 disabled:bg-stone-50"
                          />
                        </div>
                        <div>
                          <label className="block text-navy-400 mb-0.5">综合评分</label>
                          <div className="flex items-center gap-0.5 py-1.5 px-2 border border-stone2 rounded-sm bg-white/60 justify-center">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateField(s.id, 'rating', n);
                                }}
                                className={`${
                                  n <= s.rating ? 'text-gold-500' : 'text-stone2'
                                } hover:scale-110 transition-transform p-0.5`}
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    n <= s.rating ? 'fill-current' : ''
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-stone2/60 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <Info className="w-3.5 h-3.5 text-navy-400" />
                          <span className="text-navy-500">折算含税总价：</span>
                          <span className="font-mono-num text-base font-bold text-navy-800">
                            {formatCurrency(final)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                        <LinkIcon className="w-3 h-3" />
                        附件链接（报价单 PDF / 云盘）
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={s.attachmentUrl}
                          placeholder="https://... 粘贴报价单或云盘链接"
                          onChange={(e) =>
                            updateField(s.id, 'attachmentUrl', e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400"
                        />
                        {s.attachmentUrl && (
                          <a
                            href={s.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-2 text-xs text-navy-600 hover:text-navy-800 hover:bg-navy-50 rounded-sm border border-stone2 transition-colors shrink-0"
                          >
                            打开
                          </a>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                        <StickyNote className="w-3 h-3" />
                        服务范围 / 备注
                      </label>
                      <textarea
                        rows={2}
                        value={s.notes}
                        placeholder="提供的服务内容、付款方式、特殊注意事项等..."
                        onChange={(e) => updateField(s.id, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400 resize-none"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                        <ShieldCheck className="w-3 h-3" />
                        内部备注（客户不可见）
                      </label>
                      <textarea
                        rows={2}
                        value={s.internalNotes}
                        placeholder="内部评审意见、议价空间、合作风险提示等..."
                        onChange={(e) => updateField(s.id, 'internalNotes', e.target.value)}
                        className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400 resize-none bg-amber-50/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-stone2 p-4 bg-white">
          <button
            onClick={handleAdd}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加新供应商报价
          </button>
        </div>
      </div>
    </div>
  );
}
