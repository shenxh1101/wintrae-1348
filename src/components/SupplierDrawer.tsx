import { X, Plus, Trash2, FileCheck, Calendar, User, Phone, DollarSign, StickyNote } from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import { CATEGORY_LABELS, SupplierInfo } from '@/types';
import { formatCurrency } from '@/utils/calculations';

export default function SupplierDrawer() {
  const activeCategory = useBudgetStore((s) => s.activeSupplierCategory);
  const setActiveSupplierCategory = useBudgetStore((s) => s.setActiveSupplierCategory);
  const suppliers = activeCategory
    ? useBudgetStore((s) => s.data.suppliers[activeCategory])
    : [];
  const addSupplier = useBudgetStore((s) => s.addSupplier);
  const updateSupplier = useBudgetStore((s) => s.updateSupplier);
  const removeSupplier = useBudgetStore((s) => s.removeSupplier);

  if (!activeCategory) return null;

  const handleClose = () => setActiveSupplierCategory(null);
  const handleAdd = () => addSupplier(activeCategory!, {});

  const updateField = (id: string, field: keyof SupplierInfo, value: any) => {
    updateSupplier(activeCategory!, id, field, value);
  };

  return (
    <div className="fixed inset-0 z-50 no-print">
      <div
        className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="bg-navy-800 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-gold-400" />
            <div>
              <h3 className="font-serif text-base font-semibold">
                {CATEGORY_LABELS[activeCategory]}
              </h3>
              <p className="text-xs text-navy-200">供应商报价记录</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-navy-700 rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="gold-divider" />

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {suppliers.length === 0 && (
            <div className="text-center py-12 text-navy-400">
              <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无供应商报价记录</p>
              <p className="text-xs mt-1 opacity-70">点击下方按钮添加第一份报价</p>
            </div>
          )}

          {suppliers.map((s, idx) => (
            <div
              key={s.id}
              className="card-base p-4 space-y-3 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-num px-2 py-0.5 bg-navy-50 text-navy-600 rounded-sm">
                  报价 #{idx + 1}
                </span>
                <button
                  onClick={() => removeSupplier(activeCategory!, s.id)}
                  className="p-1 text-navy-400 hover:text-danger hover:bg-red-50 rounded-sm"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

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
                  <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                    <DollarSign className="w-3 h-3" />
                    报价金额
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={s.quoteAmount}
                    onChange={(e) =>
                      updateField(s.id, 'quoteAmount', Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400 font-mono-num"
                  />
                </div>
              </div>

              {s.quoteAmount > 0 && (
                <div className="bg-gold-50 border border-gold-100 rounded-sm px-3 py-2">
                  <span className="text-xs text-gold-700">报价金额：</span>
                  <span className="font-mono-num text-gold-800 font-semibold">
                    {formatCurrency(s.quoteAmount)}
                  </span>
                </div>
              )}

              <div>
                <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                  <StickyNote className="w-3 h-3" />
                  备注说明
                </label>
                <textarea
                  value={s.notes}
                  rows={2}
                  placeholder="付款方式、含税情况、服务范围等..."
                  onChange={(e) => updateField(s.id, 'notes', e.target.value)}
                  className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400 resize-none"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-stone2 p-4">
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
