import { useMemo } from 'react';
import {
  X,
  FileText,
  ExternalLink,
  Building,
  CalendarDays,
  Tag,
  Layers,
  Crown,
  Link as LinkIcon,
  ChevronRight,
} from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import { CATEGORY_LABELS, CostCategory, SupplierInfo } from '@/types';
import { calcSupplierFinal, formatCurrency } from '@/utils/calculations';

const CATEGORY_ORDER: CostCategory[] = [
  'venue',
  'catering',
  'materials',
  'transport',
  'personnel',
  'contingency',
];

export default function AttachmentGallery() {
  const data = useBudgetStore((s) => s.data);
  const show = useBudgetStore((s) => s.showAttachmentGallery);
  const setShow = useBudgetStore((s) => s.setShowAttachmentGallery);
  const setActiveSupplierCategory = useBudgetStore((s) => s.setActiveSupplierCategory);
  const suppliersByCategory = data.suppliers;

  // 按类别聚合所有带附件的供应商
  const categories = useMemo(() => {
    const result: {
      category: CostCategory;
      name: string;
      suppliers: SupplierInfo[];
      withAttachment: SupplierInfo[];
    }[] = [];
    CATEGORY_ORDER.forEach((cat) => {
      const list = suppliersByCategory[cat] || [];
      const withAttach = list.filter((s) => s.attachmentUrl || s.attachmentName);
      if (list.length > 0) {
        result.push({
          category: cat,
          name: CATEGORY_LABELS[cat],
          suppliers: list,
          withAttachment: withAttach,
        });
      }
    });
    return result;
  }, [suppliersByCategory]);

  const totalCount = categories.reduce((acc, c) => acc + c.suppliers.length, 0);
  const attachedCount = categories.reduce((acc, c) => acc + c.withAttachment.length, 0);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-navy-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-slideInFromRight">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-stone2 flex items-center justify-between shrink-0 bg-gradient-to-r from-cream to-white">
          <div>
            <h2 className="font-serif font-bold text-navy-800 flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-gold-500" />
              报价附件清单
            </h2>
            <p className="text-xs text-navy-400 mt-1">
              共 {totalCount} 份报价，{attachedCount} 份已上传附件 · 按费用类别分组
            </p>
          </div>
          <button
            onClick={() => setShow(false)}
            className="w-9 h-9 rounded-full hover:bg-navy-50 flex items-center justify-center text-navy-500 hover:text-navy-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-navy-400">
              <FileText className="w-14 h-14 mb-3 opacity-20" />
              <p className="text-sm font-medium">还没有录入任何供应商报价</p>
              <p className="text-xs mt-1 opacity-70">
                在每个费用类别下点击「管理供应商报价」即可添加
              </p>
            </div>
          ) : (
            categories.map((group) => (
              <div
                key={group.category}
                className="rounded-sm border border-stone2 overflow-hidden bg-white"
              >
                {/* 类别标题 */}
                <div className="px-4 py-3 bg-navy-50 border-b border-stone2 flex items-center justify-between">
                  <h3 className="font-serif font-semibold text-navy-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gold-500" />
                    {group.name}
                    <span className="text-[11px] font-normal text-navy-400 font-sans">
                      ({group.suppliers.length} 家{group.withAttachment.length > 0 ? ` · ${group.withAttachment.length} 份附件` : ''})
                    </span>
                  </h3>
                  <button
                    onClick={() => setActiveSupplierCategory(group.category)}
                    className="text-xs text-navy-600 hover:text-gold-600 flex items-center gap-1 px-2 py-1 rounded-sm hover:bg-white/80 transition-colors"
                  >
                    跳转管理
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* 供应商列表 */}
                <div className="divide-y divide-stone2">
                  {group.suppliers.map((s) => {
                    const final = calcSupplierFinal(s, 1);
                    const isSelected =
                      data.costs[group.category]?.some(
                        (it) => it.selectedSupplierId === s.id,
                      ) || false;
                    return (
                      <div
                        key={s.id}
                        className={`px-4 py-3 flex items-start gap-3 transition-colors ${
                          isSelected ? 'bg-gold-50/40' : 'hover:bg-cream/30'
                        }`}
                      >
                        {/* 供应商信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <p className="text-sm font-semibold text-navy-800 flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-navy-400" />
                              {s.name}
                            </p>
                            {isSelected && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-gold-100 text-gold-700 font-medium flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5" />
                                已采用
                              </span>
                            )}
                            {s.isRecommended && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-green-100 text-green-700 font-medium">
                                推荐
                              </span>
                            )}
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
                                s.quoteType === 'total'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-sky-100 text-sky-700'
                              }`}
                            >
                              {s.quoteType === 'total' ? '总价报价' : `单价 ${s.quoteUnit || '元/单位'}`}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
                                s.taxIncluded
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {s.taxIncluded ? '已含税' : '不含税'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs flex-wrap">
                            <span className="font-mono-num text-navy-700 font-semibold">
                              {formatCurrency(final.finalTotal)}
                            </span>
                            {s.contact && (
                              <span className="text-navy-400 flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {s.contact}
                                {s.phone ? ` · ${s.phone}` : ''}
                              </span>
                            )}
                            {s.validUntil && (
                              <span className="text-navy-400 flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                有效期至 {new Date(s.validUntil).toLocaleDateString('zh-CN')}
                              </span>
                            )}
                          </div>

                          {/* 附件信息 */}
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {s.attachmentUrl ? (
                              <a
                                href={s.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] px-2 py-1 rounded-sm bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 transition-colors border border-blue-100"
                              >
                                <FileText className="w-3 h-3" />
                                {s.attachmentName || '报价单附件'}
                                <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                              </a>
                            ) : s.attachmentName ? (
                              <span className="text-[11px] px-2 py-1 rounded-sm bg-gray-50 text-gray-500 flex items-center gap-1 border border-gray-100">
                                <FileText className="w-3 h-3" />
                                {s.attachmentName}
                                <span className="text-gray-400">（未上传链接）</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-navy-300 flex items-center gap-1">
                                <LinkIcon className="w-3 h-3" />
                                暂无附件
                              </span>
                            )}
                          </div>

                          {s.notes && (
                            <p className="text-[11px] text-navy-400 mt-1.5 line-clamp-2">
                              {s.notes}
                            </p>
                          )}
                        </div>

                        {/* 操作区 */}
                        <div className="shrink-0 pt-1">
                          <button
                            onClick={() => {
                              setActiveSupplierCategory(group.category);
                              setShow(false);
                            }}
                            className="text-xs text-navy-600 hover:text-gold-600 px-2.5 py-1 rounded-sm border border-stone2 hover:border-gold-400 bg-white hover:bg-gold-50 transition-colors"
                          >
                            查看详情
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
