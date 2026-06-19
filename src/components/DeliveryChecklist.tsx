import { useMemo } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  FileText,
  ChevronRight,
  Layers,
  Package,
  Users,
  Crown,
  AlertTriangle,
  BadgeCheck,
} from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import { CATEGORY_LABELS, CostCategory } from '@/types';

const CATEGORY_ORDER: CostCategory[] = [
  'venue',
  'catering',
  'materials',
  'transport',
  'personnel',
  'contingency',
];

function checkValid(validUntil?: string): { valid: boolean; soon: boolean; days: number } {
  if (!validUntil) return { valid: true, soon: false, days: 9999 };
  const now = new Date();
  const valid = new Date(validUntil);
  const diff = Math.ceil((valid.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { valid: diff >= 0, soon: diff >= 0 && diff <= 7, days: diff };
}

export default function DeliveryChecklist() {
  const data = useBudgetStore((s) => s.data);
  const setShowAttachmentGallery = useBudgetStore((s) => s.setShowAttachmentGallery);
  const openSupplierDrawer = useBudgetStore((s) => s.openSupplierDrawer);

  const categoryStats = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => {
      const costs = data.costs[cat] || [];
      const suppliers = data.suppliers[cat] || [];

      // 已采用的供应商（被费用项选中的）
      const adoptedSupplierIds = new Set(
        costs.filter((c) => c.selectedSupplierId).map((c) => c.selectedSupplierId!),
      );
      const adoptedCount = adoptedSupplierIds.size;

      // 有附件的供应商
      const withAttachment = suppliers.filter(
        (s) => s.attachmentUrl || s.attachmentName,
      ).length;

      // 缺附件的已采用供应商数
      const adoptedMissingAttach = suppliers.filter(
        (s) => adoptedSupplierIds.has(s.id) && !s.attachmentUrl && !s.attachmentName,
      ).length;

      // 即将过期/已过期的已采用供应商
      const adoptedExpiringSoon = suppliers.filter((s) => {
        if (!adoptedSupplierIds.has(s.id)) return false;
        const v = checkValid(s.validUntil);
        return v.soon || !v.valid;
      }).length;

      // 未报价的费用项数
      const itemsWithQuote = costs.filter(
        (c) => c.selectedSupplierId || c.basePrice > 0,
      ).length;
      const itemsMissingQuote = costs.length - itemsWithQuote;

      // 状态评级
      let status: 'ok' | 'warn' | 'danger' = 'ok';
      if (adoptedMissingAttach > 0 || adoptedExpiringSoon > 0) status = 'warn';
      if (itemsMissingQuote > 0) status = 'danger';

      return {
        category: cat,
        name: CATEGORY_LABELS[cat],
        itemCount: costs.length,
        itemsMissingQuote,
        supplierCount: suppliers.length,
        adoptedCount,
        withAttachment,
        adoptedMissingAttach,
        adoptedExpiringSoon,
        status,
      };
    });
  }, [data.costs, data.suppliers]);

  // 总体统计
  const summary = useMemo(() => {
    const totalItems = categoryStats.reduce((acc, c) => acc + c.itemCount, 0);
    const totalMissingQuote = categoryStats.reduce((acc, c) => acc + c.itemsMissingQuote, 0);
    const totalSuppliers = categoryStats.reduce((acc, c) => acc + c.supplierCount, 0);
    const totalAdopted = categoryStats.reduce((acc, c) => acc + c.adoptedCount, 0);
    const totalMissingAttach = categoryStats.reduce(
      (acc, c) => acc + c.adoptedMissingAttach,
      0,
    );
    const totalExpiringSoon = categoryStats.reduce(
      (acc, c) => acc + c.adoptedExpiringSoon,
      0,
    );
    const categoriesWithSuppliers = categoryStats.filter((c) => c.supplierCount > 0).length;
    const categoriesComplete = categoryStats.filter(
      (c) => c.itemsMissingQuote === 0 && c.adoptedMissingAttach === 0 && c.adoptedExpiringSoon === 0 && c.adoptedCount > 0,
    ).length;

    const progress = totalItems > 0 ? ((totalItems - totalMissingQuote) / totalItems) * 100 : 0;

    return {
      totalItems,
      totalMissingQuote,
      totalSuppliers,
      totalAdopted,
      totalMissingAttach,
      totalExpiringSoon,
      categoriesWithSuppliers,
      categoriesComplete,
      progress,
    };
  }, [categoryStats]);

  const confirmation = data.confirmation;

  const handleJumpToCategory = (category: CostCategory) => {
    const el = document.getElementById(`category-${category}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToExport = () => {
    const el = document.getElementById('section-export');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="card-base overflow-hidden">
      {/* 头部 */}
      <div className="px-5 py-4 bg-gradient-to-r from-navy-800 to-navy-700 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-gold-400/20 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg">交付检查清单</h2>
            <p className="text-xs text-navy-200 mt-0.5">
              导出前统一检查：报价覆盖 · 附件完整 · 客户确认
            </p>
          </div>
        </div>
      </div>

      {/* 总览区 */}
      <div className="px-5 py-4 bg-cream/40 border-b border-stone2">
        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-navy-600">报价覆盖进度</span>
            <span className="text-xs font-mono-num font-bold text-navy-800">
              {summary.progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-navy-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all duration-500"
              style={{ width: `${summary.progress}%` }}
            />
          </div>
          <p className="text-[11px] text-navy-400 mt-1.5">
            已报价 {summary.totalItems - summary.totalMissingQuote} / {summary.totalItems} 项
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-white rounded-sm border border-stone2 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-danger" />
              <span className="text-[11px] text-navy-500">未报价</span>
            </div>
            <p className="text-lg font-mono-num font-bold text-navy-800">
              {summary.totalMissingQuote}
              <span className="text-xs font-normal text-navy-400 ml-1">项</span>
            </p>
          </div>
          <div className="bg-white rounded-sm border border-stone2 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Crown className="w-3.5 h-3.5 text-gold-500" />
              <span className="text-[11px] text-navy-500">已采用</span>
            </div>
            <p className="text-lg font-mono-num font-bold text-navy-800">
              {summary.totalAdopted}
              <span className="text-xs font-normal text-navy-400 ml-1">家</span>
            </p>
          </div>
          <div className="bg-white rounded-sm border border-stone2 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              <span className="text-[11px] text-navy-500">缺附件</span>
            </div>
            <p className="text-lg font-mono-num font-bold text-navy-800">
              {summary.totalMissingAttach}
              <span className="text-xs font-normal text-navy-400 ml-1">家</span>
            </p>
          </div>
          <div className="bg-white rounded-sm border border-stone2 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-danger" />
              <span className="text-[11px] text-navy-500">将过期</span>
            </div>
            <p className="text-lg font-mono-num font-bold text-navy-800">
              {summary.totalExpiringSoon}
              <span className="text-xs font-normal text-navy-400 ml-1">家</span>
            </p>
          </div>
        </div>

        {/* 客户确认状态 */}
        <div
          className={`mt-3 rounded-sm border px-3.5 py-2.5 flex items-center justify-between ${
            confirmation.status === 'confirmed'
              ? 'bg-green-50 border-green-200'
              : confirmation.status === 'needs_adjustment'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-navy-50 border-navy-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {confirmation.status === 'confirmed' ? (
              <BadgeCheck className="w-4.5 h-4.5 text-green-600" />
            ) : confirmation.status === 'needs_adjustment' ? (
              <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
            ) : (
              <Clock className="w-4.5 h-4.5 text-navy-500" />
            )}
            <div>
              <p
                className={`text-xs font-semibold ${
                  confirmation.status === 'confirmed'
                    ? 'text-green-700'
                    : confirmation.status === 'needs_adjustment'
                    ? 'text-amber-700'
                    : 'text-navy-600'
                }`}
              >
                客户确认：
                {confirmation.status === 'confirmed'
                  ? '已确认'
                  : confirmation.status === 'needs_adjustment'
                  ? '需调整'
                  : '待确认'}
              </p>
              {confirmation.status !== 'pending' && confirmation.history.length > 0 && (
                <p className="text-[11px] text-navy-500 mt-0.5">
                  版本 v{confirmation.version} ·{' '}
                  {new Date(
                    [...confirmation.history].sort(
                      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
                    )[0].timestamp,
                  ).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={scrollToExport}
            className="text-xs px-2.5 py-1 rounded-sm border border-stone2 bg-white hover:bg-navy-50 text-navy-600 hover:text-navy-800 transition-colors flex items-center gap-1"
          >
            查看
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 类别检查列表 */}
      <div className="divide-y divide-stone2">
        {categoryStats.map((cat) => (
          <div
            key={cat.category}
            className={`px-5 py-3 flex items-center gap-3 hover:bg-cream/30 transition-colors cursor-pointer group`}
            onClick={() => handleJumpToCategory(cat.category)}
          >
            {/* 状态图标 */}
            <div className="shrink-0">
              {cat.status === 'ok' ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : cat.status === 'warn' ? (
                <AlertTriangle className="w-5 h-5 text-warning" />
              ) : (
                <XCircle className="w-5 h-5 text-danger" />
              )}
            </div>

            {/* 类别名 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-navy-800 text-sm">{cat.name}</span>
                {cat.status === 'ok' && cat.supplierCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-green-100 text-green-700">
                    就绪
                  </span>
                )}
                {cat.status === 'warn' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-700">
                    注意
                  </span>
                )}
                {cat.status === 'danger' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700">
                    待完善
                  </span>
                )}
              </div>
              <p className="text-[11px] text-navy-400 mt-0.5">
                {cat.itemCount} 个费用项 · {cat.supplierCount} 家供应商 · {cat.adoptedCount} 家已采用
              </p>
            </div>

            {/* 细节标签 */}
            <div className="flex items-center gap-1.5 shrink-0">
              {cat.itemsMissingQuote > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700 font-medium">
                  {cat.itemsMissingQuote} 项未报价
                </span>
              )}
              {cat.adoptedMissingAttach > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-700 font-medium">
                  {cat.adoptedMissingAttach} 缺附件
                </span>
              )}
              {cat.adoptedExpiringSoon > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-orange-100 text-orange-700 font-medium">
                  {cat.adoptedExpiringSoon} 将过期
                </span>
              )}
              {cat.status === 'ok' && cat.supplierCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-green-100 text-green-700 font-medium">
                  {cat.withAttachment} 份附件
                </span>
              )}
              {cat.supplierCount === 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-500">
                  暂无供应商
                </span>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openSupplierDrawer(cat.category);
                }}
                className="text-[11px] px-2 py-1 rounded-sm border border-stone2 bg-white hover:bg-gold-50 text-navy-600 hover:text-gold-600 hover:border-gold-400 transition-colors flex items-center gap-0.5"
                title="管理供应商"
              >
                <Users className="w-3 h-3" />
                报价
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttachmentGallery(true);
                }}
                className="text-[11px] px-2 py-1 rounded-sm border border-stone2 bg-white hover:bg-blue-50 text-navy-600 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center gap-0.5"
                title="查看附件清单"
              >
                <FileText className="w-3 h-3" />
                附件
              </button>
            </div>

            <ChevronRight className="w-4 h-4 text-navy-300 group-hover:text-navy-500 shrink-0 transition-colors" />
          </div>
        ))}
      </div>

      {/* 底部操作 */}
      <div className="px-5 py-3 bg-cream/30 border-t border-stone2 flex items-center justify-between">
        <p className="text-[11px] text-navy-400">
          {summary.categoriesComplete} / 6 个类别交付就绪
        </p>
        <button
          onClick={scrollToExport}
          className="text-xs px-3 py-1.5 rounded-sm bg-navy-800 text-white hover:bg-navy-700 transition-colors flex items-center gap-1.5 font-medium"
        >
          前往导出
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
