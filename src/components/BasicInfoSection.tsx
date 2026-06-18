import { useBudgetStore } from '@/store/budgetStore';
import { CITY_TIER_LABELS, CityTier } from '@/types';
import { Building2, Users, Calendar, MapPin, Target, Clock, Landmark, RefreshCw, User, Phone } from 'lucide-react';

export default function BasicInfoSection() {
  const basic = useBudgetStore((s) => s.data.basic);
  const setBasic = useBudgetStore((s) => s.setBasic);
  const setCityTier = useBudgetStore((s) => s.setCityTier);
  const resetBudget = useBudgetStore((s) => s.resetBudget);
  const data = useBudgetStore((s) => s.data);
  const costs = useBudgetStore((s) => s.data.costs);
  const updateCostItem = useBudgetStore((s) => s.updateCostItem);

  const handleCityChange = (tier: CityTier) => {
    // ✅ 核心修复：只改档位，basePrice 不变。所有价格显示将通过 basePrice × 系数自动计算
    // 所以反复切换一线/二线/三线时，回到二线时金额与初始值完全一致
    setCityTier(tier);
  };

  const handlePeopleChange = (count: number) => {
    const prev = basic.peopleCount || 1;
    const ratio = count / prev;
    setBasic('peopleCount', count);
    // 调整按人头/份数计价的项目数量
    const scaleCats: any[] = ['catering', 'materials'];
    scaleCats.forEach((cat) => {
      costs[cat].forEach((item) => {
        if (item.unit.includes('人') || item.unit.includes('份')) {
          updateCostItem(cat, item.id, 'quantity', count);
        }
      });
    });
    // 兼职工作人员 = ceil(人数 / 30)
    costs.personnel.forEach((item) => {
      if (item.name.includes('兼职')) {
        updateCostItem('personnel', item.id, 'quantity', Math.ceil(count / 30));
      }
      if (item.name.includes('礼仪')) {
        updateCostItem(
          'personnel',
          item.id,
          'quantity',
          Math.max(2, Math.ceil(count / 50)),
        );
      }
    });
  };

  const handleDaysChange = (days: number) => {
    const prev = basic.durationDays || 1;
    setBasic('durationDays', days);
    // 调整按天计价的项目数量
    costs.venue.forEach((item) => {
      if (item.unit.includes('天') || item.unit.includes('日')) {
        updateCostItem('venue', item.id, 'quantity', days);
      }
    });
  };

  const handleReset = () => {
    if (window.confirm('确定要清空所有数据并重新开始吗？')) {
      resetBudget();
    }
  };

  return (
    <section id="section-basic" className="scroll-mt-28">
      <div className="card-base p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title !border-0 !pb-0">基础信息</h2>
          <button
            onClick={handleReset}
            className="btn-ghost flex items-center gap-1.5 text-navy-500 hover:text-danger"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            清空重填
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm text-navy-600 mb-2">
              <Landmark className="w-4 h-4 text-gold-400" />
              公司名称（我方）
            </label>
            <input
              type="text"
              value={basic.companyName}
              onChange={(e) => setBasic('companyName', e.target.value)}
              placeholder="填写后将出现在预算单页眉"
              className="w-full px-0 py-2 input-underline font-sans text-navy-800"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-navy-600 mb-2">
              <User className="w-4 h-4 text-gold-400" />
              客户名称
            </label>
            <input
              type="text"
              value={basic.clientName}
              onChange={(e) => setBasic('clientName', e.target.value)}
              placeholder="活动委托方"
              className="w-full px-0 py-2 input-underline font-sans text-navy-800"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-navy-600 mb-2">
              <Phone className="w-4 h-4 text-gold-400" />
              客户联系方式
            </label>
            <input
              type="text"
              value={basic.clientContact}
              onChange={(e) => setBasic('clientContact', e.target.value)}
              placeholder="客户对接人及电话（内部记录）"
              className="w-full px-0 py-2 input-underline font-sans text-navy-800"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-navy-600 mb-2">
              <Building2 className="w-4 h-4 text-gold-400" />
              活动名称
            </label>
            <input
              type="text"
              value={basic.eventName}
              onChange={(e) => setBasic('eventName', e.target.value)}
              placeholder="请输入活动名称"
              className="w-full px-0 py-2 input-underline font-sans text-navy-800"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-navy-600 mb-2">
              <Calendar className="w-4 h-4 text-gold-400" />
              活动日期
            </label>
            <input
              type="date"
              value={basic.eventDate}
              onChange={(e) => setBasic('eventDate', e.target.value)}
              className="w-full px-0 py-2 input-underline font-sans text-navy-800"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-navy-600 mb-2">
              <Users className="w-4 h-4 text-gold-400" />
              参与人数
            </label>
            <div className="flex items-end gap-2">
              <input
                type="number"
                min={1}
                value={basic.peopleCount}
                onChange={(e) =>
                  handlePeopleChange(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-32 px-0 py-2 input-underline font-mono-num text-navy-800 text-xl font-semibold"
              />
              <span className="text-sm text-navy-500 pb-2">人</span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm text-navy-600 mb-2">
                <Clock className="w-4 h-4 text-gold-400" />
                活动天数
              </label>
              <div className="flex items-end gap-2">
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={basic.durationDays}
                  onChange={(e) =>
                    handleDaysChange(Math.max(0.5, parseFloat(e.target.value) || 1))
                  }
                  className="w-20 px-0 py-2 input-underline font-mono-num text-navy-800 text-xl font-semibold"
                />
                <span className="text-sm text-navy-500 pb-2">天</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm text-navy-600 mb-2 opacity-60">
                <Clock className="w-4 h-4 text-gold-400" />
                每天时长
              </label>
              <div className="flex items-end gap-2">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={basic.durationHours}
                  onChange={(e) =>
                    setBasic(
                      'durationHours',
                      Math.max(1, parseInt(e.target.value) || 8),
                    )
                  }
                  className="w-20 px-0 py-2 input-underline font-mono-num text-navy-800 text-xl font-semibold"
                />
                <span className="text-sm text-navy-500 pb-2">小时</span>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-navy-600 mb-2">
              <MapPin className="w-4 h-4 text-gold-400" />
              城市档位
            </label>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {(Object.keys(CITY_TIER_LABELS) as CityTier[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => handleCityChange(tier)}
                  className={`py-2 text-xs rounded-sm border transition-all ${
                    basic.cityTier === tier
                      ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                      : 'bg-white text-navy-600 border-stone2 hover:border-navy-300 hover:bg-navy-50/30'
                  }`}
                >
                  {CITY_TIER_LABELS[tier]}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-navy-400 mt-1.5 leading-relaxed">
              💡 档位切换时，单价将按系数自动换算（一线×1.4 / 新一线×1.2 / 二线×1.0 / 三线×0.8）。
              因保留了基准单价，<span className="text-navy-600 font-medium">反复切换后回到二线，金额与初始值完全一致</span>。
            </p>
          </div>

          <div className="md:col-span-2 lg:col-span-3 pt-2 border-t border-stone2">
            <label className="flex items-center gap-2 text-sm text-navy-600 mb-2">
              <Target className="w-4 h-4 text-gold-400" />
              目标总预算
            </label>
            <div className="flex items-end gap-3">
              <span className="text-2xl font-serif text-navy-800">¥</span>
              <input
                type="number"
                min={0}
                value={basic.targetBudget}
                onChange={(e) =>
                  setBasic('targetBudget', Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-48 px-0 py-2 input-underline font-mono-num text-navy-800 text-2xl font-semibold"
              />
              <span className="text-sm text-navy-500 pb-2">
                （可选，用于预算超支预警）
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
