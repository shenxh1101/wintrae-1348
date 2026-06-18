import { useMemo, useState } from 'react';
import {
  Download,
  Printer,
  FileText,
  ScrollText,
  PieChart,
  Building2,
  MapPin,
  Users,
  Calendar,
  Target,
  Landmark,
  Check,
  ShieldCheck,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import {
  calculateBudget,
  calcItemSubtotal,
  calcDisplayPrice,
  formatCurrency,
  formatNumber,
  exportJSON,
} from '@/utils/calculations';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CostCategory,
  CITY_TIER_LABELS,
  PLAN_LABELS,
  CONFIRMATION_STATUS_LABELS,
  ConfirmationStatus,
} from '@/types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const COST_CATEGORIES: CostCategory[] = [
  'venue',
  'catering',
  'materials',
  'transport',
  'personnel',
  'contingency',
];

const CLIENT_STATUS_STYLES: Record<
  ConfirmationStatus,
  { icon: any; bg: string; text: string; border: string }
> = {
  pending: {
    icon: Clock,
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  confirmed: {
    icon: CheckCircle2,
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
  },
  needs_adjustment: {
    icon: AlertTriangle,
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
  },
};

type PreviewMode = 'full' | 'simple' | 'client';

export default function ExportSection() {
  const data = useBudgetStore((s) => s.data);
  const previewMode = useBudgetStore((s) => s.previewMode) as PreviewMode;
  const setPreviewMode = useBudgetStore((s) => s.setPreviewMode);
  const result = useMemo(() => calculateBudget(data), [data]);

  const [companyNameForPrint, setCompanyNameForPrint] = useState(data.basic.companyName);
  const confirmation = data.confirmation;

  const pieData = {
    labels: COST_CATEGORIES.map((c) => CATEGORY_LABELS[c]),
    datasets: [
      {
        data: result.categoryTotals.map((c) => Math.round(c.subtotal)),
        backgroundColor: COST_CATEGORIES.map((c) => CATEGORY_COLORS[c]),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const total = ctx.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const pct =
              total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
            return `${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
          },
        },
      },
    },
  };

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };

  const handleExportClientPDF = () => {
    setPreviewMode('client');
    setTimeout(() => window.print(), 200);
  };

  const getItemSubtotal = (cat: CostCategory, item: any): number => {
    const r = calcItemSubtotal(
      item,
      data.basic.cityTier,
      data.currentPlan,
      cat,
      data.suppliers[cat],
      data.adjustments.taxRate,
    );
    return r.subtotal;
  };

  const getItemDisplayPrice = (cat: CostCategory, item: any): number => {
    // 若有供应商报价，优先显示供应商价
    if (item.selectedSupplierId) {
      const s = data.suppliers[cat].find(
        (x: any) => x.id === item.selectedSupplierId,
      );
      if (s) {
        let amt = s.quoteAmount;
        if (!s.taxIncluded) {
          amt = amt * (1 + (s.applicableTaxRate || data.adjustments.taxRate) / 100);
        }
        // 报价通常是总价，若要显示单价则除以数量（否则直接作为总价）
        // 这里为了兼容，若 item.quantity > 0 则显示单价=总价/数量
        return item.quantity > 0 ? amt / item.quantity : amt;
      }
    }
    return calcDisplayPrice(
      item.basePrice,
      data.basic.cityTier,
      data.currentPlan,
      cat,
    );
  };

  const getContingencyForPrint = (): number => {
    const five = COST_CATEGORIES.filter((c) => c !== 'contingency').reduce(
      (s, c) => {
        const sub =
          result.categoryTotals.find((x) => x.category === c)?.subtotal || 0;
        return s + sub;
      },
      0,
    );
    const contItem = data.costs.contingency[0];
    if (contItem && contItem.basePrice === 0) {
      return five * (data.adjustments.contingencyRate / 100);
    }
    const catTotal =
      result.categoryTotals.find((x) => x.category === 'contingency')
        ?.subtotal || 0;
    return catTotal || five * 0.1;
  };

  const isClientView = previewMode === 'client';
  const isSimpleView = previewMode === 'simple';
  const isFullView = previewMode === 'full';

  // 客户视图：过滤逻辑的说明
  // - 不渲染 internalNote 列/字段
  // - 不渲染供应商联系方式（只可能显示已选中供应商的名称，不含 phone/email）
  // - 不渲染风险分析、历史记录等内部模块
  // - 隐藏"备用金自动计提"的内部说明

  // 预览 Tab 配置
  const previewTabs: { key: PreviewMode; label: string; icon: any; hint: string }[] = [
    { key: 'full', label: '完整版', icon: FileText, hint: '含全部内部字段、分析、供应商' },
    { key: 'simple', label: '客户简版', icon: ScrollText, hint: '精简汇总 + 签字栏' },
    { key: 'client', label: '客户确认摘要', icon: Eye, hint: '过滤所有内部信息，专供客户' },
  ];

  // 客户端的确认状态样式
  const statusStyles = CLIENT_STATUS_STYLES[confirmation.status];
  const StatusIcon = statusStyles.icon;

  return (
    <section id="section-export" className="scroll-mt-28 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="section-title !border-0 !pb-0">导出预览</h2>
      </div>

      {/* 模式切换 Tabs */}
      <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="inline-flex p-1 rounded-sm bg-cream border border-stone2">
          {previewTabs.map((t) => {
            const TIcon = t.icon;
            const active = previewMode === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setPreviewMode(t.key)}
                className={`px-4 py-2 text-sm rounded-sm border transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                    : 'bg-transparent text-navy-700 border-transparent hover:bg-white hover:border-stone2'
                }`}
                title={t.hint}
              >
                <TIcon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-navy-400">
          💡 {previewTabs.find((t) => t.key === previewMode)?.hint}
        </p>
      </div>

      {/* 完整版：数据汇总面板 + 图表 + 操作按钮（仅屏幕可见，打印时隐藏） */}
      {isFullView && (
        <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card-base p-5 lg:col-span-1">
            <h3 className="font-serif font-semibold text-navy-800 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-gold-400" />
              费用分类占比
            </h3>
            <div className="h-64 mb-4">
              <Doughnut data={pieData} options={pieOptions as any} />
            </div>
            <div className="space-y-2">
              {result.categoryTotals.map((cat) => {
                const pct =
                  result.pretaxTotal > 0
                    ? (cat.subtotal / result.pretaxTotal) * 100
                    : 0;
                return (
                  <div
                    key={cat.category}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[cat.category] }}
                    />
                    <span className="flex-1 truncate text-navy-700">
                      {cat.name}
                    </span>
                    <span className="font-mono-num text-xs text-navy-500 w-12 text-right">
                      {formatNumber(pct, 1)}%
                    </span>
                    <span className="font-mono-num text-xs text-navy-800 w-24 text-right">
                      {formatCurrency(cat.subtotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-base p-5 lg:col-span-2 space-y-5">
            <h3 className="font-serif font-semibold text-navy-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-gold-400" />
              汇总数据
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-sm bg-navy-50 border border-navy-100">
                <p className="text-xs text-navy-500 mb-1">参与人数</p>
                <p className="font-mono-num text-2xl font-bold text-navy-800">
                  {formatNumber(data.basic.peopleCount)}
                </p>
              </div>
              <div className="p-4 rounded-sm bg-gold-50 border border-gold-100">
                <p className="text-xs text-navy-500 mb-1">税前总额</p>
                <p className="font-mono-num text-2xl font-bold text-gold-700">
                  {formatCurrency(result.pretaxTotal)}
                </p>
              </div>
              <div className="p-4 rounded-sm bg-success/10 border border-success/30">
                <p className="text-xs text-navy-500 mb-1">人均成本</p>
                <p className="font-mono-num text-2xl font-bold text-success">
                  {formatCurrency(result.perPersonCost)}
                </p>
              </div>
              <div className="p-4 rounded-sm border border-stone2">
                <p className="text-xs text-navy-500 mb-1">预算使用率</p>
                <p className="font-mono-num text-2xl font-bold text-navy-800">
                  {formatNumber(
                    Math.min(result.budgetUsedPercent, 999.9),
                    1,
                  )}
                  <span className="text-base ml-1">%</span>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-stone2">
              <h4 className="text-sm font-semibold text-navy-700 mb-3">
                税费与附加
              </h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 border border-stone2 rounded-sm">
                  <p className="text-xs text-navy-500 mb-0.5">
                    增值税 ({data.adjustments.taxRate}%)
                  </p>
                  <p className="font-mono-num font-semibold text-navy-800">
                    {formatCurrency(result.tax)}
                  </p>
                </div>
                <div className="p-3 border border-stone2 rounded-sm">
                  <p className="text-xs text-navy-500 mb-0.5">
                    服务费 ({data.adjustments.serviceRate}%)
                  </p>
                  <p className="font-mono-num font-semibold text-navy-800">
                    {formatCurrency(result.serviceFee)}
                  </p>
                </div>
                <div className="p-3 border-2 border-gold-300 bg-gold-50/50 rounded-sm">
                  <p className="text-xs text-gold-700 mb-0.5 font-medium">
                    最终总预算
                  </p>
                  <p className="font-mono-num font-bold text-navy-800 text-lg">
                    {formatCurrency(result.grandTotal)}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone2">
              <h4 className="text-sm font-semibold text-navy-700 mb-3">
                操作导出
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={handlePrint}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  打印完整版
                </button>
                <button
                  onClick={() => {
                    setPreviewMode('simple');
                    setTimeout(() => window.print(), 200);
                  }}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  客户简版
                </button>
                <button
                  onClick={handleExportClientPDF}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  客户确认摘要
                </button>
                <button
                  onClick={() =>
                    exportJSON(
                      data,
                      `${data.basic.eventName || '活动预算'}_完整版.json`,
                    )
                  }
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  导出数据
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard
                      .writeText(formatCurrency(result.grandTotal))
                      .then(() => {
                        const btn = document.createElement('div');
                        btn.innerText = '已复制总预算';
                        btn.className =
                          'fixed top-20 right-6 z-50 bg-navy-800 text-white px-4 py-2 text-sm rounded-sm shadow-lg';
                        document.body.appendChild(btn);
                        setTimeout(() => btn.remove(), 1500);
                      });
                  }}
                  className="btn-secondary flex items-center justify-center gap-2 col-span-2 md:col-span-0"
                >
                  <Check className="w-4 h-4" />
                  复制总额
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* A4 预览区 */}
      <div className="a4-page-wrap card-base overflow-hidden no-print">
        <div className="bg-cream/70 px-5 py-3 border-b border-stone2 flex items-center justify-between no-print flex-wrap gap-3">
          <p className="text-sm text-navy-600 font-medium">
            {isFullView
              ? 'A4 完整版预算单预览'
              : isSimpleView
              ? 'A4 客户简版预算单预览'
              : 'A4 客户确认摘要 · 已过滤内部信息'}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {isFullView ? (
              <label className="text-xs text-navy-500 flex items-center gap-1.5">
                页眉公司名称：
                <input
                  type="text"
                  value={companyNameForPrint}
                  onChange={(e) => setCompanyNameForPrint(e.target.value)}
                  placeholder="填写后打印显示"
                  className="w-40 px-2 py-1 border border-stone2 rounded-sm text-xs focus:outline-none focus:border-gold-400"
                />
              </label>
            ) : null}
            {isClientView && (
              <span
                className={`text-[11px] px-2 py-1 rounded-sm font-medium border flex items-center gap-1 ${statusStyles.bg} ${statusStyles.text} ${statusStyles.border}`}
              >
                <StatusIcon className="w-3 h-3" />
                {CONFIRMATION_STATUS_LABELS[confirmation.status]}
              </span>
            )}
            <button
              onClick={handlePrint}
              className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              打印/保存 PDF
            </button>
          </div>
        </div>

        <div className="bg-navy-50/40 p-6 md:p-10 overflow-auto max-h-[900px]">
          <div
            className="a4-page mx-auto bg-white shadow-lg !p-10 md:!p-[20mm]"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            {/* ===== 页眉：完整版独有公司名 ===== */}
            <div
              className={`border-b-2 pb-4 mb-6 print-only-block ${
                isClientView ? 'border-gold-400' : 'border-gold-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  {companyNameForPrint && isFullView && (
                    <p className="text-xs text-navy-500 mb-1 font-medium">
                      {companyNameForPrint}
                    </p>
                  )}
                  <h1
                    className={`font-serif font-bold tracking-wide ${
                      isClientView ? 'text-3xl text-center flex-1' : 'text-2xl text-navy-800'
                    }`}
                    style={isClientView ? { textAlign: 'center' } : {}}
                  >
                    {isClientView ? '活动预算确认单' : '线下活动预算单'}
                  </h1>
                  <p
                    className={`mt-1 ${
                      isClientView
                        ? 'text-sm text-navy-500'
                        : 'text-sm text-navy-500'
                    }`}
                    style={isClientView ? { textAlign: 'center' } : {}}
                  >
                    {isClientView
                      ? 'Activity Budget Confirmation'
                      : 'Activity Budget Estimation Sheet'}
                  </p>
                </div>
                {!isClientView && (
                  <div className="text-right">
                    <div className="px-3 py-1.5 border border-navy-800 rounded-sm">
                      <p className="text-xs text-navy-500">方案</p>
                      <p className="font-serif font-semibold text-navy-800">
                        {PLAN_LABELS[data.currentPlan]}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ===== 客户端：状态横幅 ===== */}
            {isClientView && (
              <div
                className={`avoid-break mb-6 p-4 rounded-sm border ${statusStyles.border} ${statusStyles.bg}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${statusStyles.bg} flex items-center justify-center border ${statusStyles.border} shrink-0`}
                  >
                    <StatusIcon className={`w-5 h-5 ${statusStyles.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${statusStyles.text} mb-0.5`}>
                      {CONFIRMATION_STATUS_LABELS[confirmation.status]}
                    </p>
                    <p className="text-xs text-navy-500">
                      本确认单由我司提供，供贵司核对本次活动预算。
                      {confirmation.comment && (
                        <>
                          <br />
                          <span className="text-navy-600 mt-1 block">
                            备注：{confirmation.comment}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-navy-400">最终总预算</p>
                    <p className="font-mono-num text-xl font-bold text-navy-800">
                      {formatCurrency(result.grandTotal)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== 基础信息卡片 ===== */}
            <div
              className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-cream/50 rounded-sm avoid-break ${
                isClientView ? 'md:grid-cols-4' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-navy-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-navy-400">活动名称</p>
                  <p className="text-sm font-medium text-navy-800 truncate">
                    {data.basic.eventName || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-navy-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-navy-400">举办日期</p>
                  <p className="text-sm font-medium text-navy-800">
                    {data.basic.eventDate || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-navy-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-navy-400">参与人数</p>
                  <p className="text-sm font-medium text-navy-800 font-mono-num">
                    {formatNumber(data.basic.peopleCount)} 人
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-navy-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-navy-400">城市档位</p>
                  <p className="text-sm font-medium text-navy-800">
                    {CITY_TIER_LABELS[data.basic.cityTier]}
                  </p>
                </div>
              </div>
            </div>

            {/* ===== 完整版：逐类明细表 ===== */}
            {isFullView && <FullDetailView
              data={data}
              result={result}
              getItemSubtotal={getItemSubtotal}
              getItemDisplayPrice={getItemDisplayPrice}
              getContingencyForPrint={getContingencyForPrint}
            />}

            {/* ===== 简版 + 客户端：汇总表 ===== */}
            {(isSimpleView || isClientView) && (
              <SummaryView
                data={data}
                result={result}
                getContingencyForPrint={getContingencyForPrint}
                isClientView={isClientView}
              />
            )}

            {/* ===== 完整版：汇总行（税费+服务费+总计） ===== */}
            {isFullView && (
              <FullGrandTotalView
                data={data}
                result={result}
              />
            )}

            {/* ===== 简版+客户端：签字栏 ===== */}
            {(isSimpleView || isClientView) && (
              <SignatureBlock
                data={data}
                isClientView={isClientView}
                confirmation={confirmation}
              />
            )}

            {/* ===== 完整版：签字栏 ===== */}
            {isFullView && (
              <div className="mt-10 pt-6 border-t border-stone2 avoid-break grid grid-cols-2 gap-8 text-xs text-navy-600">
                <div>
                  <p className="mb-8 pb-8 border-b border-stone2/60">
                    客户确认（盖章/签字）：_______________________
                  </p>
                  <p className="text-navy-400">日期：______________</p>
                </div>
                <div className="text-right">
                  <p className="mb-8 pb-8 border-b border-stone2/60">
                    策划方（盖章/签字）：_______________________
                  </p>
                  <p className="text-navy-400">
                    编制日期：{new Date().toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ 子组件：完整版明细表 ============ */
function FullDetailView(props: any) {
  const { data, result, getItemSubtotal, getItemDisplayPrice, getContingencyForPrint } = props;

  return (
    <div className="space-y-5">
      {COST_CATEGORIES.map((cat) => {
        const items = data.costs[cat as CostCategory];
        if (items.length === 0) return null;
        const catTotal =
          result.categoryTotals.find((x: any) => x.category === cat)?.subtotal || 0;
        const actualContTotal =
          cat === 'contingency' ? getContingencyForPrint() : catTotal;
        return (
          <div key={cat} className="avoid-break">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-stone2">
              <h3 className="font-serif font-semibold text-navy-800 flex items-center gap-2">
                <span
                  className="w-1 h-4 rounded-sm"
                  style={{ backgroundColor: CATEGORY_COLORS[cat as CostCategory] }}
                />
                {CATEGORY_LABELS[cat as CostCategory]}
                {/* 供应商报价徽章 */}
                {data.suppliers[cat as CostCategory].length > 0 && (
                  <span className="text-[10px] font-sans font-normal px-1.5 py-0.5 rounded-sm bg-gold-50 text-gold-700 border border-gold-100 ml-1">
                    {data.suppliers[cat as CostCategory].length} 份报价
                  </span>
                )}
              </h3>
              <span
                className="font-mono-num text-sm font-semibold"
                style={{ color: CATEGORY_COLORS[cat as CostCategory] }}
              >
                {formatCurrency(cat === 'contingency' ? actualContTotal : catTotal)}
              </span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-navy-500 border-b border-stone2/60">
                  <th className="text-left font-medium py-1.5 w-[24%]">项目</th>
                  <th className="text-right font-medium py-1.5 w-[12%]">单价</th>
                  <th className="text-right font-medium py-1.5 w-[8%]">数量</th>
                  <th className="text-center font-medium py-1.5 w-[10%]">单位</th>
                  <th className="text-left font-medium py-1.5 w-[14%]">备注</th>
                  <th className="text-left font-medium py-1.5 w-[14%]">
                    <span className="text-amber-700">【内部】备注</span>
                  </th>
                  <th className="text-left font-medium py-1.5 w-[8%]">来源</th>
                  <th className="text-right font-medium py-1.5 w-[10%]">小计</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => {
                  let sub = getItemSubtotal(cat, item);
                  if (
                    cat === 'contingency' &&
                    idx === 0 &&
                    item.basePrice === 0
                  ) {
                    sub = getContingencyForPrint();
                  }
                  const supplier = item.selectedSupplierId
                    ? data.suppliers[cat as CostCategory].find(
                        (s: any) => s.id === item.selectedSupplierId,
                      )
                    : null;
                  const displayPrice = getItemDisplayPrice(cat, item);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-stone2/40 ${
                        supplier ? 'bg-gold-50/40' : ''
                      }`}
                    >
                      <td className="py-1.5 text-navy-800 align-top">
                        {item.name}
                        {cat === 'contingency' &&
                          idx === 0 &&
                          item.basePrice === 0 && (
                            <span className="ml-1 text-[10px] text-navy-400">
                              (自动计提 {data.adjustments.contingencyRate}%)
                            </span>
                          )}
                      </td>
                      <td className="py-1.5 text-right font-mono-num text-navy-700 align-top">
                        ¥{formatNumber(displayPrice)}
                      </td>
                      <td className="py-1.5 text-right font-mono-num text-navy-700 align-top">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="py-1.5 text-center text-navy-600 align-top">
                        {item.unit}
                      </td>
                      <td className="py-1.5 text-navy-500 text-[11px] pr-2 align-top">
                        {item.remark || '-'}
                      </td>
                      <td className="py-1.5 text-[11px] pr-2 align-top">
                        {item.internalNote ? (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm">
                            {item.internalNote}
                          </span>
                        ) : (
                          <span className="text-stone2">-</span>
                        )}
                      </td>
                      <td className="py-1.5 text-[10px] align-top">
                        {supplier ? (
                          <span className="text-gold-700 bg-gold-50 border border-gold-200 px-1.5 py-0.5 rounded-sm font-medium">
                            供应商 · {supplier.name || '未命名'}
                          </span>
                        ) : (
                          <span className="text-navy-400">系统估算</span>
                        )}
                      </td>
                      <td
                        className={`py-1.5 text-right font-mono-num font-semibold align-top ${
                          supplier ? 'text-gold-700' : 'text-navy-800'
                        }`}
                      >
                        {formatCurrency(sub)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

/* ============ 子组件：完整版汇总行 ============ */
function FullGrandTotalView(props: any) {
  const { data, result } = props;
  return (
    <div className="mt-6 avoid-break page-break-before">
      <table className="w-full text-sm">
        <tbody>
          <tr className="border-t-2 border-stone2">
            <td
              colSpan={3}
              className="py-2 text-right text-navy-600 pr-4"
            >
              税前合计
            </td>
            <td className="py-2 text-right font-mono-num font-semibold text-navy-800 w-32">
              {formatCurrency(result.pretaxTotal)}
            </td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="py-2 text-right text-navy-600 pr-4"
            >
              增值税 ({data.adjustments.taxRate}%)
            </td>
            <td className="py-2 text-right font-mono-num text-navy-700">
              {formatCurrency(result.tax)}
            </td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="py-2 text-right text-navy-600 pr-4"
            >
              服务费 ({data.adjustments.serviceRate}%)
            </td>
            <td className="py-2 text-right font-mono-num text-navy-700">
              {formatCurrency(result.serviceFee)}
            </td>
          </tr>
          <tr className="border-t-2 border-gold-400 bg-gold-50/50">
            <td
              colSpan={3}
              className="py-3 text-right font-semibold text-navy-800 pr-4"
            >
              预算总计
            </td>
            <td className="py-3 text-right font-mono-num text-xl font-bold text-navy-800">
              {formatCurrency(result.grandTotal)}
            </td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="py-2 text-right text-navy-500 pr-4 text-xs"
            >
              人均成本
            </td>
            <td className="py-2 text-right font-mono-num text-navy-600">
              {formatCurrency(result.perPersonCost)} / 人
            </td>
          </tr>
          {data.basic.targetBudget > 0 && (
            <tr>
              <td
                colSpan={3}
                className="py-2 text-right text-navy-500 pr-4 text-xs"
              >
                目标预算
              </td>
              <td className="py-2 text-right font-mono-num text-navy-600">
                {formatCurrency(data.basic.targetBudget)}
                <span
                  className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-sm ${
                    result.budgetRemaining < 0
                      ? 'bg-red-100 text-danger'
                      : 'bg-green-100 text-success'
                  }`}
                >
                  {result.budgetRemaining < 0 ? '超支' : '剩余'}{' '}
                  {formatCurrency(Math.abs(result.budgetRemaining))}
                </span>
              </td>
            </tr>
          )}
          {result.supplierDelta !== 0 && (
            <tr>
              <td
                colSpan={3}
                className="py-2 text-right text-navy-500 pr-4 text-xs"
              >
                供应商报价影响
              </td>
              <td
                className={`py-2 text-right font-mono-num ${
                  result.supplierDelta > 0 ? 'text-danger' : 'text-success'
                }`}
              >
                {result.supplierDelta > 0 ? '+' : ''}
                {formatCurrency(result.supplierDelta)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ============ 子组件：简版+客户汇总表 ============ */
function SummaryView(props: any) {
  const { data, result, getContingencyForPrint, isClientView } = props;
  return (
    <div className="space-y-4">
      {/* 简版：顶部大金额卡片 */}
      {!isClientView && (
        <div className="p-5 border-2 border-gold-300 rounded-sm bg-gold-50/30 avoid-break">
          <p className="text-xs text-gold-700 text-center mb-2 tracking-widest">
            预 算 总 览
          </p>
          <p className="font-mono-num text-4xl font-bold text-center text-navy-800 mb-1">
            {formatCurrency(result.grandTotal)}
          </p>
          <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-gold-200/60 text-xs">
            <span className="text-navy-600">
              <Users className="w-3 h-3 inline align-[-2px] mr-1" />
              {formatNumber(data.basic.peopleCount)} 人
            </span>
            <span className="text-navy-600">
              人均 {formatCurrency(result.perPersonCost)}
            </span>
            <span className="text-navy-600">
              {PLAN_LABELS[data.currentPlan as keyof typeof PLAN_LABELS]}
            </span>
          </div>
        </div>
      )}

      {/* 客户端：按类逐项明细表（不是太粗的汇总，给客户看细项但隐藏内部） */}
      {isClientView && (
        <div className="space-y-3">
          {COST_CATEGORIES.map((cat) => {
            const items = data.costs[cat as CostCategory];
            if (items.length === 0) return null;
            const catTotal =
              cat === 'contingency'
                ? getContingencyForPrint()
                : result.categoryTotals.find((x: any) => x.category === cat)
                    ?.subtotal || 0;
            const pct =
              result.pretaxTotal > 0
                ? (catTotal / result.pretaxTotal) * 100
                : 0;
            return (
              <div key={cat} className="avoid-break">
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-stone2/60">
                  <h4 className="font-serif font-semibold text-navy-800 flex items-center gap-2 text-sm">
                    <span
                      className="w-1.5 h-4 rounded-sm"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[cat as CostCategory],
                      }}
                    />
                    {CATEGORY_LABELS[cat as CostCategory]}
                  </h4>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono-num text-navy-400 w-12 text-right">
                      {formatNumber(pct, 1)}%
                    </span>
                    <span
                      className="font-mono-num font-semibold text-sm"
                      style={{
                        color: CATEGORY_COLORS[cat as CostCategory],
                      }}
                    >
                      {formatCurrency(catTotal)}
                    </span>
                  </div>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-navy-400">
                      <th className="text-left font-medium py-1 w-[44%]">
                        项目
                      </th>
                      <th className="text-right font-medium py-1 w-[14%]">
                        单价
                      </th>
                      <th className="text-right font-medium py-1 w-[10%]">
                        数量
                      </th>
                      <th className="text-center font-medium py-1 w-[12%]">
                        单位
                      </th>
                      <th className="text-left font-medium py-1 w-[10%]">
                        备注
                      </th>
                      <th className="text-right font-medium py-1 w-[10%]">
                        小计
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, idx: number) => {
                      let sub = 0;
                      if (
                        cat === 'contingency' &&
                        idx === 0 &&
                        item.basePrice === 0
                      ) {
                        sub = getContingencyForPrint();
                      } else {
                        const r = calcItemSubtotal(
                          item,
                          data.basic.cityTier,
                          data.currentPlan,
                          cat,
                          data.suppliers[cat as CostCategory],
                          data.adjustments.taxRate,
                        );
                        sub = r.subtotal;
                      }
                      // 单价：若有供应商报价，按数量折算显示单价，否则用基准价换算
                      const supplier = item.selectedSupplierId
                        ? data.suppliers[cat as CostCategory].find(
                            (s: any) => s.id === item.selectedSupplierId,
                          )
                        : null;
                      let displayPrice: number;
                      if (supplier) {
                        let amt = supplier.quoteAmount;
                        if (!supplier.taxIncluded)
                          amt =
                            amt *
                            (1 +
                              (supplier.applicableTaxRate ||
                                data.adjustments.taxRate) /
                                100);
                        displayPrice =
                          item.quantity > 0 ? amt / item.quantity : amt;
                      } else {
                        displayPrice = calcDisplayPrice(
                          item.basePrice,
                          data.basic.cityTier,
                          data.currentPlan,
                          cat,
                        );
                      }
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-stone2/40"
                        >
                          <td className="py-1.5 text-navy-800">
                            {item.name}
                            {cat === 'contingency' &&
                              idx === 0 &&
                              item.basePrice === 0 && (
                                <span className="ml-1 text-[10px] text-navy-400">
                                  (自动计提 {data.adjustments.contingencyRate}
                                  %)
                                </span>
                              )}
                          </td>
                          <td className="py-1.5 text-right font-mono-num text-navy-700">
                            ¥{formatNumber(displayPrice)}
                          </td>
                          <td className="py-1.5 text-right font-mono-num text-navy-700">
                            {formatNumber(item.quantity)}
                          </td>
                          <td className="py-1.5 text-center text-navy-600">
                            {item.unit}
                          </td>
                          {/* 客户端：只显示 remark，不显示 internalNote */}
                          <td className="py-1.5 text-navy-500 text-[10px]">
                            {item.remark || '-'}
                          </td>
                          <td className="py-1.5 text-right font-mono-num font-semibold text-navy-800">
                            {formatCurrency(sub)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* 简版：分类汇总大表（不展开明细） */}
      {!isClientView && (
        <table className="w-full text-sm avoid-break">
          <thead>
            <tr className="border-b-2 border-navy-800 text-left">
              <th className="py-2 font-semibold text-navy-800">费用类别</th>
              <th className="py-2 text-right font-semibold text-navy-800">
                金额
              </th>
              <th className="py-2 text-right font-semibold text-navy-800 w-16">
                占比
              </th>
            </tr>
          </thead>
          <tbody>
            {COST_CATEGORIES.map((cat) => {
              const catTotal =
                cat === 'contingency'
                  ? getContingencyForPrint()
                  : result.categoryTotals.find(
                      (x: any) => x.category === cat,
                    )?.subtotal || 0;
              const pct =
                result.pretaxTotal > 0
                  ? (catTotal / result.pretaxTotal) * 100
                  : 0;
              return (
                <tr
                  key={cat}
                  className="border-b border-stone2/60"
                >
                  <td className="py-2.5 text-navy-800 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-sm"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[cat as CostCategory],
                      }}
                    />
                    {CATEGORY_LABELS[cat as CostCategory]}
                  </td>
                  <td className="py-2.5 text-right font-mono-num text-navy-800">
                    {formatCurrency(catTotal)}
                  </td>
                  <td className="py-2.5 text-right font-mono-num text-navy-500 text-xs">
                    {formatNumber(pct, 1)}%
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-gold-400 bg-gold-50/30 font-semibold">
              <td className="py-3 text-navy-800">合计（含税+服务费）</td>
              <td className="py-3 text-right font-mono-num text-lg font-bold text-navy-800">
                {formatCurrency(result.grandTotal)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      )}

      {/* 客户端：大汇总行 */}
      {isClientView && (
        <div className="avoid-break pt-4 border-t border-stone2 mt-4">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-t border-stone2">
                <td
                  colSpan={2}
                  className="py-1.5 text-right text-navy-500 pr-4 text-xs"
                >
                  费用合计（税前）
                </td>
                <td className="py-1.5 text-right font-mono-num text-navy-700 w-32">
                  {formatCurrency(result.pretaxTotal)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={2}
                  className="py-1.5 text-right text-navy-500 pr-4 text-xs"
                >
                  增值税 ({data.adjustments.taxRate}%)
                </td>
                <td className="py-1.5 text-right font-mono-num text-navy-600">
                  {formatCurrency(result.tax)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={2}
                  className="py-1.5 text-right text-navy-500 pr-4 text-xs"
                >
                  服务费 ({data.adjustments.serviceRate}%)
                </td>
                <td className="py-1.5 text-right font-mono-num text-navy-600">
                  {formatCurrency(result.serviceFee)}
                </td>
              </tr>
              <tr className="border-t-2 border-gold-400 bg-gold-50/50">
                <td
                  colSpan={2}
                  className="py-3 text-right font-bold text-navy-800 pr-4"
                >
                  最终确认金额
                </td>
                <td className="py-3 text-right font-mono-num text-xl font-bold text-navy-800">
                  {formatCurrency(result.grandTotal)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={2}
                  className="py-1.5 text-right text-navy-400 pr-4 text-xs"
                >
                  人均成本
                </td>
                <td className="py-1.5 text-right font-mono-num text-navy-500 text-xs">
                  {formatCurrency(result.perPersonCost)} / 人
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 简版：底部基础信息 */}
      {!isClientView && (
        <div className="mt-6 pt-5 border-t border-stone2 grid grid-cols-2 gap-6 text-xs text-navy-500 avoid-break">
          <div>
            <Building2 className="w-3 h-3 inline align-[-2px] mr-1 text-navy-400" />
            活动名称：
            <span className="text-navy-700 font-medium">
              {data.basic.eventName}
            </span>
          </div>
          <div>
            <Calendar className="w-3 h-3 inline align-[-2px] mr-1 text-navy-400" />
            活动日期：
            <span className="text-navy-700 font-medium">
              {data.basic.eventDate}
            </span>
          </div>
          <div>
            <Users className="w-3 h-3 inline align-[-2px] mr-1 text-navy-400" />
            参与人数：
            <span className="text-navy-700 font-medium">
              {formatNumber(data.basic.peopleCount)} 人
            </span>
          </div>
          <div>
            <MapPin className="w-3 h-3 inline align-[-2px] mr-1 text-navy-400" />
            城市档位：
            <span className="text-navy-700 font-medium">
              {
                CITY_TIER_LABELS[
                  data.basic.cityTier as keyof typeof CITY_TIER_LABELS
                ]
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ 子组件：签字栏 ============ */
function SignatureBlock(props: any) {
  const { data, isClientView, confirmation } = props;

  return (
    <div
      className={`mt-12 pt-6 border-t border-dashed border-stone2 text-xs avoid-break ${
        isClientView ? '' : 'text-navy-400'
      }`}
    >
      {isClientView ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-navy-700 font-medium mb-1">
                客户确认（盖章/签字）
              </p>
              <p className="text-[10px] text-navy-400 mb-2">
                我方确认以上预算内容无误，同意按此执行。
              </p>
              <div className="pb-10 mb-2 border-b border-stone2/60 min-h-[60px]">
                {confirmation.confirmedBy && (
                  <p className="font-serif text-lg text-navy-800">
                    {confirmation.confirmedBy}
                  </p>
                )}
              </div>
              <p className="text-navy-400 text-[11px]">
                姓名：{confirmation.confirmedBy || '____________'}
                <span className="mx-2 text-stone2">|</span>
                电话：{confirmation.confirmedPhone || '____________'}
              </p>
              <p className="text-navy-400 text-[11px] mt-0.5">
                日期：
                {confirmation.confirmedAt
                  ? new Date(confirmation.confirmedAt).toLocaleDateString(
                      'zh-CN',
                    )
                  : '______________'}
              </p>
            </div>
            <div>
              <p className="text-navy-700 font-medium mb-1">
                策划方（盖章/签字）
              </p>
              <p className="text-[10px] text-navy-400 mb-2">
                我司承诺按确认内容保质保量完成服务。
              </p>
              <div className="pb-10 mb-2 border-b border-stone2/60 min-h-[60px]" />
              <p className="text-navy-400 text-[11px]">
                联系人：{data.basic.clientContact || '____________'}
              </p>
              <p className="text-navy-400 text-[11px] mt-0.5">
                编制日期：{new Date().toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>

          {confirmation.status === 'needs_adjustment' &&
            confirmation.requestedAdjustments && (
              <div className="p-3 rounded-sm bg-red-50 border border-red-100 text-xs">
                <p className="text-red-700 font-medium mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  客户反馈需调整项
                </p>
                <p className="text-red-600 whitespace-pre-wrap">
                  {confirmation.requestedAdjustments}
                </p>
              </div>
            )}

          <p className="text-center text-[10px] text-navy-400 pt-3">
            本确认单一式两份，双方各执一份 · 最终费用以实际发生为准
          </p>
        </div>
      ) : (
        <>
          <p className="mb-6 pb-6 border-b border-stone2/60">
            客户确认签字：_________________________________ 日期：______________
          </p>
          <p className="text-center text-[10px]">
            本预算单仅供参考，最终费用以实际发生为准 · 编制日期：
            {new Date().toLocaleDateString('zh-CN')}
          </p>
        </>
      )}
    </div>
  );
}
