import { useMemo, useState } from 'react';
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
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
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

type FilterType = 'all' | 'adopted' | 'missing_attachment' | 'expiring_soon';

const FILTER_TABS: { key: FilterType; label: string; icon: any; color: string }[] = [
  { key: 'all', label: '全部', icon: Layers, color: 'text-navy-600' },
  { key: 'adopted', label: '已采用', icon: CheckCircle2, color: 'text-success' },
  { key: 'missing_attachment', label: '缺附件', icon: AlertTriangle, color: 'text-warning' },
  { key: 'expiring_soon', label: '即将过期', icon: Clock, color: 'text-danger' },
];

function checkValid(s: SupplierInfo): { valid: boolean; soon: boolean; days: number } {
  if (!s.validUntil) return { valid: true, soon: false, days: 9999 };
  const now = new Date();
  const valid = new Date(s.validUntil);
  const diff = Math.ceil((valid.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { valid: diff >= 0, soon: diff >= 0 && diff <= 7, days: diff };
}

export default function AttachmentGallery() {
  const data = useBudgetStore((s) => s.data);
  const show = useBudgetStore((s) => s.showAttachmentGallery);
  const setShow = useBudgetStore((s) => s.setShowAttachmentGallery);
  const openSupplierDrawer = useBudgetStore((s) => s.openSupplierDrawer);
  const suppliersByCategory = data.suppliers;
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // 判断供应商是否被采用
  const isSupplierAdopted = (category: CostCategory, supplierId: string): boolean => {
    return (
      data.costs[category]?.some((it) => it.selectedSupplierId === supplierId) || false
    );
  };

  // 判断供应商是否缺附件
  const isMissingAttachment = (s: SupplierInfo): boolean => {
    return !s.attachmentUrl && !s.attachmentName;
  };

  // 按类别 + 筛选条件聚合
  const categories = useMemo(() => {
    const result: {
      category: CostCategory;
      name: string;
      suppliers: SupplierInfo[];
      filtered: SupplierInfo[];
      withAttachment: number;
      adopted: number;
      missingAttach: number;
      expiringSoon: number;
    }[] = [];
    CATEGORY_ORDER.forEach((cat) => {
      const list = suppliersByCategory[cat] || [];
      let filtered = list;
      if (activeFilter === 'adopted') {
        filtered = list.filter((s) => isSupplierAdopted(cat, s.id));
      } else if (activeFilter === 'missing_attachment') {
        filtered = list.filter((s) => isMissingAttachment(s));
      } else if (activeFilter === 'expiring_soon') {
        filtered = list.filter((s) => {
          const v = checkValid(s);
          return v.soon || !v.valid;
        });
      }
      if (list.length > 0) {
        result.push({
          category: cat,
          name: CATEGORY_LABELS[cat],
          suppliers: list,
          filtered,
          withAttachment: list.filter((s) => s.attachmentUrl || s.attachmentName).length,
          adopted: list.filter((s) => isSupplierAdopted(cat, s.id)).length,
          missingAttach: list.filter((s) => isMissingAttachment(s)).length,
          expiringSoon: list.filter((s) => {
            const v = checkValid(s);
            return v.soon || !v.valid;
          }).length,
        });
      }
    });
    return result;
  }, [suppliersByCategory, activeFilter, data.costs]);

  const totalCount = categories.reduce((acc, c) => acc + c.suppliers.length, 0);
  const totalFiltered = categories.reduce((acc, c) => acc + c.filtered.length, 0);
  const totalAttached = categories.reduce((acc, c) => acc + c.withAttachment, 0);
  const totalAdopted = categories.reduce((acc, c) => acc + c.adopted, 0);
  const totalMissing = categories.reduce((acc, c) => acc + c.missingAttach, 0);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-navy-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-slideInFromRight">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-stone2 shrink-0 bg-gradient-to-r from-cream to-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-serif font-bold text-navy-800 flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-gold-500" />
                报价附件清单
              </h2>
              <p className="text-xs text-navy-400 mt-1">
                共 {totalCount} 份报价 · {totalAttached} 份已附 · {totalAdopted} 家已采用
                {activeFilter !== 'all' && ` · 筛选后 ${totalFiltered} 份`}
              </p>
            </div>
            <button
              onClick={() => setShow(false)}
              className="w-9 h-9 rounded-full hover:bg-navy-50 flex items-center justify-center text-navy-500 hover:text-navy-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 筛选标签 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-navy-400 mr-1" />
            {FILTER_TABS.map((tab) => {
              const TIcon = tab.icon;
              const isActive = activeFilter === tab.key;
              const count =
                tab.key === 'all'
                  ? totalCount
                  : tab.key === 'adopted'
                  ? totalAdopted
                  : tab.key === 'missing_attachment'
                  ? totalMissing
                  : 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border flex items-center gap-1 transition-colors ${
                    isActive
                      ? 'bg-navy-800 text-white border-navy-800'
                      : 'bg-white text-navy-600 border-stone2 hover:border-navy-300 hover:bg-navy-50'
                  }`}
                >
                  <TIcon className="w-3 h-3" />
                  {tab.label}
                  <span
                    className={`font-mono-num ${
                      isActive ? 'text-white/80' : 'text-navy-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {totalFiltered === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-navy-400">
              <FileText className="w-14 h-14 mb-3 opacity-20" />
              <p className="text-sm font-medium">
                {activeFilter === 'all'
                  ? '还没有录入任何供应商报价'
                  : activeFilter === 'adopted'
                  ? '暂无已采用的供应商'
                  : activeFilter === 'missing_attachment'
                  ? '所有报价都已上传附件 ✓'
                  : '暂无即将过期的报价'}
              </p>
              {activeFilter === 'all' && (
                <p className="text-xs mt-1 opacity-70">
                  在每个费用类别下点击「管理供应商报价」即可添加
                </p>
              )}
            </div>
          ) : (
            categories
              .filter((g) => g.filtered.length > 0)
              .map((group) => (
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
                        ({group.filtered.length}
                        {activeFilter === 'all' && ` / ${group.suppliers.length} 家`})
                      </span>
                    </h3>
                    <button
                      onClick={() => openSupplierDrawer(group.category)}
                      className="text-xs text-navy-600 hover:text-gold-600 flex items-center gap-1 px-2 py-1 rounded-sm hover:bg-white/80 transition-colors"
                    >
                      跳转管理
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* 供应商列表 */}
                  <div className="divide-y divide-stone2">
                    {group.filtered.map((s) => {
                      const final = calcSupplierFinal(s, 1, data.adjustments.taxRate);
                      const isSelected = isSupplierAdopted(group.category, s.id);
                      const valid = checkValid(s);
                      const missingAttach = isMissingAttachment(s);

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
                                {s.name || '（未命名供应商）'}
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
                                {s.quoteType === 'total'
                                  ? '总价报价'
                                  : `单价 ${s.quoteUnit || '元/单位'}`}
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
                              {missingAttach && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-700 font-medium flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  缺附件
                                </span>
                              )}
                              {!valid.valid && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700 font-medium">
                                  已过期
                                </span>
                              )}
                              {valid.valid && valid.soon && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-orange-100 text-orange-700 font-medium">
                                  剩{valid.days}天到期
                                </span>
                              )}
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
                                <span
                                  className={`flex items-center gap-1 ${
                                    !valid.valid
                                      ? 'text-danger'
                                      : valid.soon
                                      ? 'text-warning'
                                      : 'text-navy-400'
                                  }`}
                                >
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
                          <div className="shrink-0 pt-1 flex flex-col gap-1.5 items-end">
                            <button
                              onClick={() => {
                                openSupplierDrawer(group.category, s.id);
                                setShow(false);
                              }}
                              className="text-xs text-navy-600 hover:text-gold-600 px-2.5 py-1 rounded-sm border border-stone2 hover:border-gold-400 bg-white hover:bg-gold-50 transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              查看
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
