import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  User,
  Phone,
  StickyNote,
  ShieldCheck,
  FileCheck,
  ChevronRight,
  Send,
  RefreshCw,
} from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import {
  CONFIRMATION_STATUS_LABELS,
  ConfirmationStatus,
  ConfirmationRecord,
} from '@/types';
import { calculateBudget, formatCurrency, formatNumber } from '@/utils/calculations';

const STATUS_STYLES: Record<
  ConfirmationStatus,
  { bg: string; border: string; text: string; iconBg: string; icon: any; dot: string }
> = {
  pending: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    iconBg: 'bg-amber-100',
    icon: Clock,
    dot: 'bg-amber-500',
  },
  confirmed: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    iconBg: 'bg-green-100',
    icon: CheckCircle2,
    dot: 'bg-green-500',
  },
  needs_adjustment: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    iconBg: 'bg-red-100',
    icon: AlertTriangle,
    dot: 'bg-red-500',
  },
};

export default function ConfirmationSection() {
  const data = useBudgetStore((s) => s.data);
  const updateConfirmation = useBudgetStore((s) => s.updateConfirmation);
  const result = useMemo(() => calculateBudget(data), [data]);
  const confirmation = data.confirmation;

  const [operator, setOperator] = useState<string>('');
  const [statusComment, setStatusComment] = useState<string>('');
  const [showHistory, setShowHistory] = useState(true);

  const styles = STATUS_STYLES[confirmation.status];
  const StatusIcon = styles.icon;

  const handleChangeStatus = (nextStatus: ConfirmationStatus) => {
    if (nextStatus === confirmation.status) return;

    const op = operator.trim() || '内部操作';
    const comment = statusComment.trim();

    updateConfirmation({
      status: nextStatus,
      addHistory: {
        status: nextStatus,
        operator: op,
        comment,
        snapshotGrandTotal: result.grandTotal,
      },
      ...(nextStatus === 'needs_adjustment' && comment
        ? { requestedAdjustments: comment }
        : {}),
    });

    setStatusComment('');
  };

  const updateField = <K extends keyof typeof confirmation>(
    key: K,
    value: (typeof confirmation)[K],
  ) => {
    updateConfirmation({ [key]: value } as any);
  };

  // 按时间倒序
  const sortedHistory: ConfirmationRecord[] = [...confirmation.history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const formatTimestamp = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section id="section-confirmation" className="scroll-mt-28 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="section-title !border-0 !pb-0">客户确认流程</h2>
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="btn-ghost !py-1.5 text-xs flex items-center gap-1.5"
        >
          <History className="w-3.5 h-3.5" />
          {showHistory ? '隐藏历史' : '查看历史'}
        </button>
      </div>

      {/* 状态横幅 */}
      <div
        className={`card-base !p-0 overflow-hidden border-l-4 ${
          confirmation.status === 'pending'
            ? 'border-l-amber-500'
            : confirmation.status === 'confirmed'
            ? 'border-l-green-500'
            : 'border-l-red-500'
        }`}
      >
        <div className={`${styles.bg} px-6 py-5 border-b ${styles.border}`}>
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center shrink-0`}
            >
              <StatusIcon className={`w-6 h-6 ${styles.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-serif text-lg font-semibold ${styles.text}`}>
                  {CONFIRMATION_STATUS_LABELS[confirmation.status]}
                </span>
                {confirmation.confirmedAt && confirmation.status === 'confirmed' && (
                  <span className="text-xs text-navy-400">
                    于 {new Date(confirmation.confirmedAt).toLocaleDateString('zh-CN')} 确认
                  </span>
                )}
              </div>
              <p className="text-xs text-navy-500 mt-1">
                当前预算快照：
                <span className="font-mono-num font-semibold text-navy-700 ml-1">
                  {formatCurrency(result.grandTotal)}
                </span>
                <span className="mx-1.5 text-navy-300">·</span>
                <span className="font-mono-num">
                  {formatNumber(data.basic.peopleCount)} 人
                </span>
                <span className="mx-1.5 text-navy-300">·</span>
                <span>人均 {formatCurrency(result.perPersonCost)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 三态切换区 */}
        <div className="px-6 py-4 border-b border-stone2 bg-white">
          <p className="text-xs text-navy-500 mb-3 font-medium">切换确认状态</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {(['pending', 'confirmed', 'needs_adjustment'] as ConfirmationStatus[]).map(
              (st) => {
                const stStyles = STATUS_STYLES[st];
                const StIcon = stStyles.icon;
                const isActive = confirmation.status === st;

                return (
                  <button
                    key={st}
                    onClick={() => handleChangeStatus(st)}
                    disabled={isActive}
                    className={`relative p-3.5 rounded-sm border-2 text-left transition-all ${
                      isActive
                        ? `${stStyles.bg} ${stStyles.border}`
                        : 'border-stone2 hover:border-navy-300 bg-white'
                    } disabled:cursor-default`}
                  >
                    {isActive && (
                      <span
                        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${stStyles.dot}`}
                      />
                    )}
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-sm ${stStyles.iconBg} flex items-center justify-center shrink-0`}
                      >
                        <StIcon className={`w-4 h-4 ${stStyles.text}`} />
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isActive ? stStyles.text : 'text-navy-800'
                          }`}
                        >
                          {CONFIRMATION_STATUS_LABELS[st]}
                        </p>
                        <p className="text-[11px] text-navy-400 mt-0.5">
                          {st === 'pending'
                            ? '已发送客户，等待回复'
                            : st === 'confirmed'
                            ? '客户认可方案，可推进执行'
                            : '客户反馈问题，需调整后重审'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              },
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-navy-500 mb-1">
                本次操作人 <span className="text-navy-300">（记入历史）</span>
              </label>
              <input
                type="text"
                value={operator}
                placeholder="如：张经理 / 客户李总"
                onChange={(e) => setOperator(e.target.value)}
                className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-navy-500 mb-1">
                本次操作备注 <span className="text-navy-300">（记入历史）</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={statusComment}
                  placeholder={
                    confirmation.status === 'needs_adjustment'
                      ? '请描述客户要求的调整项...'
                      : '沟通纪要、变更原因等（可选）'
                  }
                  onChange={(e) => setStatusComment(e.target.value)}
                  className="flex-1 px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400"
                />
                <span className="text-xs text-navy-400 whitespace-nowrap">
                  切换状态时写入
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 客户确认信息录入 */}
        <div className="px-6 py-4 bg-white">
          <p className="text-xs text-navy-500 mb-3 font-medium flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-gold-500" />
            客户确认信息
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                <User className="w-3 h-3" />
                客户确认人姓名
              </label>
              <input
                type="text"
                value={confirmation.confirmedBy}
                placeholder="对接客户签字人姓名"
                onChange={(e) => updateField('confirmedBy', e.target.value)}
                className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                <Phone className="w-3 h-3" />
                客户联系电话
              </label>
              <input
                type="tel"
                value={confirmation.confirmedPhone}
                placeholder="用于后续确认"
                onChange={(e) => updateField('confirmedPhone', e.target.value)}
                className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                <StickyNote className="w-3 h-3" />
                确认备注 <span className="text-navy-300">（客户可见）</span>
              </label>
              <textarea
                rows={2}
                value={confirmation.comment}
                placeholder="双方约定的特殊条款、交付说明等客户可见内容..."
                onChange={(e) => updateField('comment', e.target.value)}
                className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400 resize-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-navy-500 mb-1">
                <ShieldCheck className="w-3 h-3" />
                内部备注 <span className="text-amber-600">（客户不可见）</span>
              </label>
              <textarea
                rows={2}
                value={confirmation.internalNote}
                placeholder="内部跟进要点、谈判底线、客户偏好等..."
                onChange={(e) => updateField('internalNote', e.target.value)}
                className="w-full px-3 py-2 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400 resize-none bg-amber-50/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 历史记录时间线 */}
      {showHistory && (
        <div className="card-base overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone2 bg-cream/50 flex items-center justify-between">
            <h3 className="font-serif font-semibold text-navy-800 flex items-center gap-2">
              <History className="w-4 h-4 text-gold-500" />
              确认流程历史
              <span className="text-xs font-normal text-navy-400 font-sans">
                ({sortedHistory.length} 条记录)
              </span>
            </h3>
          </div>

          <div className="px-5 py-4 max-h-[400px] overflow-y-auto">
            {sortedHistory.length === 0 ? (
              <div className="text-center py-10 text-navy-400">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无历史记录</p>
                <p className="text-xs mt-0.5 opacity-70">
                  切换上方的确认状态时，将自动生成历史记录
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* 时间线竖线 */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-stone2" />

                <div className="space-y-4">
                  {sortedHistory.map((rec, idx) => {
                    const recStyles = STATUS_STYLES[rec.status];
                    const RecIcon = recStyles.icon;
                    const isLatest = idx === 0;

                    return (
                      <div key={rec.id} className="relative pl-10">
                        {/* 时间线节点 */}
                        <div
                          className={`absolute left-[6px] top-1 w-[18px] h-[18px] rounded-full ${
                            recStyles.iconBg
                          } border-2 border-white shadow flex items-center justify-center ${
                            isLatest ? 'ring-2 ring-offset-1 ring-gold-400/60' : ''
                          }`}
                        >
                          <RecIcon className={`w-3 h-3 ${recStyles.text}`} />
                        </div>

                        <div
                          className={`card-base !p-0 overflow-hidden border ${recStyles.border} ${recStyles.bg}/30`}
                        >
                          <div
                            className={`px-4 py-2.5 border-b ${recStyles.border}/60 flex items-center justify-between flex-wrap gap-2`}
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${recStyles.iconBg} ${recStyles.text}`}
                              >
                                {CONFIRMATION_STATUS_LABELS[rec.status]}
                              </span>
                              {isLatest && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-gold-100 text-gold-700 font-medium">
                                  最新
                                </span>
                              )}
                              <span className="text-xs text-navy-600 font-medium">
                                {rec.operator}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="font-mono-num text-navy-500">
                                {formatTimestamp(rec.timestamp)}
                              </span>
                              <span className="text-navy-300">|</span>
                              <span className="font-mono-num text-navy-700 font-medium">
                                {formatCurrency(rec.snapshotGrandTotal)}
                              </span>
                            </div>
                          </div>
                          {rec.comment && (
                            <div className="px-4 py-3 bg-white/60 flex items-start gap-2">
                              <ChevronRight className="w-3.5 h-3.5 text-navy-300 mt-0.5 shrink-0" />
                              <p className="text-sm text-navy-600 whitespace-pre-wrap">
                                {rec.comment}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
