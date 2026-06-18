import { useBudgetStore } from '@/store/budgetStore';
import { createDefaultCosts } from '@/utils/calculations';
import { CITY_TIER_LABELS, CityTier } from '@/types';
import { Building2, Users, Calendar, MapPin, Target, Clock, Landmark, RefreshCw } from 'lucide-react';

export default function BasicInfoSection() {
  const basic = useBudgetStore((s) => s.data.basic);
  const setBasic = useBudgetStore((s) => s.setBasic);
  const resetBudget = useBudgetStore((s) => s.resetBudget);
  const data = useBudgetStore((s) => s.data);
  const replaceBudget = useBudgetStore((s) => s.replaceBudget);

  const handleCityChange = (tier: CityTier) => {
    const prevTier = basic.cityTier;
    setBasic('cityTier', tier);
    const ratio = (tier === 't1' ? 1.4 : tier === 't1n' ? 1.2 : tier === 't2' ? 1.0 : 0.8) /
      (prevTier === 't1' ? 1.4 : prevTier === 't1n' ? 1.2 : prevTier === 't2' ? 1.0 : 0.8);
    const newCosts: any = {};
    (Object.keys(data.costs) as any[]).forEach((key) => {
      newCosts[key] = data.costs[key].map((item: any) => ({
        ...item,
        unitPrice: Math.round(item.unitPrice * ratio),
      }));
    });
    replaceBudget({ ...data, costs: newCosts, basic: { ...basic, cityTier: tier } });
  };

  const handlePeopleChange = (count: number) => {
    const prev = basic.peopleCount || 1;
    const ratio = count / prev;
    setBasic('peopleCount', count);
    const scaleCats: any[] = ['catering', 'personnel'];
    const newCosts: any = { ...data.costs };
    scaleCats.forEach((cat) => {
      newCosts[cat] = data.costs[cat].map((item: any) => {
        if (item.unit.includes('人') || item.unit.includes('份')) {
          return { ...item, quantity: count };
        }
        if (item.name.includes('兼职') || item.name.includes('礼仪')) {
          return { ...item, quantity: Math.ceil(count / 30) };
        }
        return item;
      });
    });
    replaceBudget({ ...data, costs: newCosts, basic: { ...basic, peopleCount: count } });
  };

  const handleDaysChange = (days: number) => {
    const prev = basic.durationDays || 1;
    setBasic('durationDays', days);
    const scaleCats: any[] = ['venue'];
    const newCosts: any = { ...data.costs };
    scaleCats.forEach((cat) => {
      newCosts[cat] = data.costs[cat].map((item: any) => {
        if (item.unit.includes('天') || item.unit.includes('日')) {
          return { ...item, quantity: days };
        }
        return item;
      });
    });
    replaceBudget({ ...data, costs: newCosts, basic: { ...basic, durationDays: days } });
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
          <button onClick={handleReset} className="btn-ghost flex items-center gap-1.5 text-navy-500 hover:text-danger">
            <RefreshCw className="w-3.5 h-3.5" />
            清空重填
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm text-navy-600 mb-2">
              <Landmark className="w-4 h-4 text-gold-400" />
              公司名称
            </label>
            <input
              type="text"
              value={basic.companyName}
              onChange={(e) => setBasic('companyName', e.target.value)}
              placeholder="请输入公司名称（可选）"
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
                onChange={(e) => handlePeopleChange(Math.max(1, parseInt(e.target.value) || 1))}
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
                  onChange={(e) => handleDaysChange(Math.max(0.5, parseFloat(e.target.value) || 1))}
                  className="w-20 px-0 py-2 input-underline font-mono-num text-navy-800 text-xl font-semibold"
                />
                <span className="text-sm text-navy-500 pb-2">天</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm text-navy-600 mb-2 opacity-50">
                <Clock className="w-4 h-4 text-gold-400" />
                每天时长
              </label>
              <div className="flex items-end gap-2">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={basic.durationHours}
                  onChange={(e) => setBasic('durationHours', Math.max(1, parseInt(e.target.value) || 8))}
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
                      ? 'bg-navy-800 text-white border-navy-800'
                      : 'bg-white text-navy-600 border-stone2 hover:border-navy-300'
                  }`}
                >
                  {CITY_TIER_LABELS[tier]}
                </button>
              ))}
            </div>
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
                onChange={(e) => setBasic('targetBudget', Math.max(0, parseInt(e.target.value) || 0))}
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
