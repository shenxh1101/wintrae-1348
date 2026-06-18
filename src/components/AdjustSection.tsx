import { useRef, useState } from 'react';
import {
  Settings,
  Percent,
  FileStack,
  Save,
  FolderOpen,
  Trash2,
  Download,
  Upload,
  Sparkles,
} from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import {
  exportJSON,
  formatCurrency,
  importJSON,
} from '@/utils/calculations';
import { formatNumber } from '@/utils/calculations';

export default function AdjustSection() {
  const data = useBudgetStore((s) => s.data);
  const adjustments = useBudgetStore((s) => s.data.adjustments);
  const setAdjustment = useBudgetStore((s) => s.setAdjustment);
  const saveAsTemplate = useBudgetStore((s) => s.saveAsTemplate);
  const loadTemplate = useBudgetStore((s) => s.loadTemplate);
  const deleteTemplate = useBudgetStore((s) => s.deleteTemplate);
  const loadLastTemplate = useBudgetStore((s) => s.loadLastTemplate);
  const templates = useBudgetStore((s) => s.templates);
  const lastUsed = useBudgetStore((s) => s.lastUsedTemplateId);
  const refreshTemplates = useBudgetStore((s) => s.refreshTemplates);
  const replaceBudget = useBudgetStore((s) => s.replaceBudget);

  const [showTemplates, setShowTemplates] = useState(false);
  const [tplName, setTplName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveTpl = () => {
    const name = tplName.trim() || `${data.basic.eventName} - ${new Date().toLocaleDateString()}`;
    saveAsTemplate(name);
    setTplName('');
    refreshTemplates();
  };

  const handleLoadTpl = (id: string) => {
    if (window.confirm('加载模板将覆盖当前数据，确定继续？')) {
      loadTemplate(id);
      setShowTemplates(false);
    }
  };

  const handleLoadLast = () => {
    if (window.confirm('复制上次活动模板将覆盖当前数据，确定继续？')) {
      const loaded = loadLastTemplate();
      if (!loaded) {
        alert('暂无上次活动记录');
      }
    }
  };

  const handleDeleteTpl = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定删除此模板？')) {
      deleteTemplate(id);
    }
  };

  const handleExport = () => {
    exportJSON(data, `${data.basic.eventName || '活动预算'}.json`);
  };

  const handleImport = (file: File) => {
    importJSON(file)
      .then((d) => {
        if (window.confirm('导入将覆盖当前数据，确定继续？')) {
          replaceBudget(d);
        }
      })
      .catch(() => {
        alert('文件解析失败，请选择正确的 JSON 文件');
      })
      .finally(() => {
        if (fileRef.current) fileRef.current.value = '';
      });
  };

  return (
    <section id="section-adjust" className="scroll-mt-28 space-y-5">
      <h2 className="section-title !border-0 !pb-0">调整设置</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-base p-5 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-4 h-4 text-gold-400" />
            <h3 className="font-serif font-semibold text-navy-800">税费与服务费</h3>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-navy-600">增值税率</label>
              <span className="font-mono-num text-sm text-navy-800 font-semibold">
                {adjustments.taxRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={adjustments.taxRate}
                onChange={(e) => setAdjustment('taxRate', parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-stone2 rounded-sm appearance-none cursor-pointer accent-gold-400"
              />
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={adjustments.taxRate}
                onChange={(e) => setAdjustment('taxRate', Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-20 px-2 py-1.5 border border-stone2 rounded-sm text-sm font-mono-num text-right focus:outline-none focus:border-gold-400"
              />
              <span className="text-sm text-navy-500">%</span>
            </div>
            <p className="text-xs text-navy-400 mt-1.5 font-mono-num">
              当前税费：{formatCurrency((calculateSum(data) * adjustments.taxRate) / 100)}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-navy-600">服务费率</label>
              <span className="font-mono-num text-sm text-navy-800 font-semibold">
                {adjustments.serviceRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={30}
                step={0.5}
                value={adjustments.serviceRate}
                onChange={(e) => setAdjustment('serviceRate', parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-stone2 rounded-sm appearance-none cursor-pointer accent-gold-400"
              />
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={adjustments.serviceRate}
                onChange={(e) =>
                  setAdjustment('serviceRate', Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-20 px-2 py-1.5 border border-stone2 rounded-sm text-sm font-mono-num text-right focus:outline-none focus:border-gold-400"
              />
              <span className="text-sm text-navy-500">%</span>
            </div>
            <p className="text-xs text-navy-400 mt-1.5 font-mono-num">
              当前服务费：{formatCurrency((calculateSum(data) * adjustments.serviceRate) / 100)}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-navy-600">备用金计提比例</label>
              <span className="font-mono-num text-sm text-navy-800 font-semibold">
                {adjustments.contingencyRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={25}
                step={0.5}
                value={adjustments.contingencyRate}
                onChange={(e) => setAdjustment('contingencyRate', parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-stone2 rounded-sm appearance-none cursor-pointer accent-navy-600"
              />
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={adjustments.contingencyRate}
                onChange={(e) =>
                  setAdjustment('contingencyRate', Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-20 px-2 py-1.5 border border-stone2 rounded-sm text-sm font-mono-num text-right focus:outline-none focus:border-gold-400"
              />
              <span className="text-sm text-navy-500">%</span>
            </div>
            <p className="text-xs text-navy-400 mt-1.5">
              当备用金金额设为 0 时生效，从前五项合计自动计提
            </p>
          </div>
        </div>

        <div className="card-base p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gold-400" />
            <h3 className="font-serif font-semibold text-navy-800">模板与数据管理</h3>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleLoadLast}
              disabled={!lastUsed}
              className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              复制上次活动模板
            </button>

            <div
              className="border border-stone2 rounded-sm p-3 cursor-pointer"
              onClick={() => setShowTemplates((v) => !v)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-navy-700">
                  <FileStack className="w-4 h-4" />
                  查看已保存模板
                  <span className="text-xs text-navy-400">({formatNumber(templates.length)})</span>
                </div>
                <Settings
                  className={`w-4 h-4 text-navy-400 transition-transform ${showTemplates ? 'rotate-90' : ''}`}
                />
              </div>
            </div>

            {showTemplates && templates.length > 0 && (
              <div className="border border-stone2 rounded-sm max-h-56 overflow-y-auto">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 border-b border-stone2 last:border-0 hover:bg-cream/40 cursor-pointer"
                    onClick={() => handleLoadTpl(t.id)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy-800 truncate">{t.name}</p>
                      <p className="text-xs text-navy-400 font-mono-num">
                        {new Date(t.savedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {t.id === lastUsed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-gold-100 text-gold-700">
                          最近使用
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDeleteTpl(e, t.id)}
                        className="p-1 text-navy-400 hover:text-danger hover:bg-red-50 rounded-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showTemplates && templates.length === 0 && (
              <div className="border border-stone2 rounded-sm p-6 text-center text-xs text-navy-400">
                暂无保存的模板
              </div>
            )}

            <div className="border border-stone2 rounded-sm p-3 space-y-2">
              <p className="text-xs text-navy-500">保存当前方案为模板</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder="模板名称（可留空）"
                  className="flex-1 px-3 py-1.5 border border-stone2 rounded-sm text-sm focus:outline-none focus:border-gold-400"
                />
                <button
                  onClick={handleSaveTpl}
                  className="btn-primary flex items-center gap-1.5 !py-1.5 !px-3"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone2 grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              导出 JSON
            </button>
            <label className="btn-secondary flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4" />
              导入 JSON
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}

function calculateSum(data: any): number {
  const cats: any[] = ['venue', 'catering', 'materials', 'transport', 'personnel', 'contingency'];
  let pretax = 0;
  const cityMult =
    data.basic.cityTier === 't1'
      ? 1.4
      : data.basic.cityTier === 't1n'
      ? 1.2
      : data.basic.cityTier === 't2'
      ? 1.0
      : 0.8;
  const planMult =
    data.currentPlan === 'conservative' ? 1.3 : data.currentPlan === 'lean' ? 0.75 : 1.0;
  const catTotals: any = {};

  cats.forEach((cat) => {
    let sub = 0;
    data.costs[cat].forEach((item: any) => {
      if (cat === 'contingency') {
        sub += item.unitPrice * item.quantity;
      } else {
        sub += item.unitPrice * item.quantity * cityMult * planMult;
      }
    });
    catTotals[cat] = sub;
    pretax += sub;
  });

  const first5 = cats
    .filter((c) => c !== 'contingency')
    .reduce((s, c) => s + catTotals[c], 0);
  const contItem = data.costs.contingency[0];
  if (contItem && contItem.unitPrice === 0) {
    const newCont = first5 * (data.adjustments.contingencyRate / 100);
    pretax = first5 + newCont;
  }

  return pretax;
}
