import {
  BudgetData,
  CalculationResult,
  CategoryTotal,
  CityTier,
  CostCategory,
  CostItem,
  RiskItem,
  CATEGORY_LABELS,
  CITY_TIER_MULTIPLIER,
  PLAN_MULTIPLIER,
  CostData,
  BasicInfo,
} from '@/types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function formatCurrency(value: number): string {
  if (!isFinite(value)) return '¥0.00';
  return '¥' + value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumber(value: number, decimals: number = 0): string {
  if (!isFinite(value)) return '0';
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function createDefaultCostItem(name: string, unitPrice: number, quantity: number, unit: string): CostItem {
  return {
    id: generateId(),
    name,
    unitPrice,
    quantity,
    unit,
    remark: '',
    isCustom: false,
  };
}

export function createDefaultCosts(tier: CityTier, people: number, days: number): CostData {
  const t = CITY_TIER_MULTIPLIER[tier];
  return {
    venue: [
      createDefaultCostItem('场地租赁', Math.round(3000 * t), days, '元/天'),
      createDefaultCostItem('场地布置搭建', Math.round(5000 * t), 1, '元/次'),
      createDefaultCostItem('音响设备租赁', Math.round(1500 * t), days, '元/天'),
      createDefaultCostItem('灯光设备租赁', Math.round(1800 * t), days, '元/天'),
      createDefaultCostItem('投影/LED屏', Math.round(2000 * t), days, '元/天'),
    ],
    catering: [
      createDefaultCostItem('正餐餐费', Math.round(120 * t), people, '元/人'),
      createDefaultCostItem('茶歇点心', Math.round(40 * t), people, '元/人'),
      createDefaultCostItem('酒水饮料', Math.round(30 * t), people, '元/人'),
    ],
    materials: [
      createDefaultCostItem('宣传物料(海报/X展架)', Math.round(800 * t), 1, '元/批'),
      createDefaultCostItem('签到用品', Math.round(500 * t), 1, '元/批'),
      createDefaultCostItem('伴手礼', Math.round(80 * t), people, '元/份'),
      createDefaultCostItem('鲜花装饰', Math.round(1200 * t), 1, '元/批'),
    ],
    transport: [
      createDefaultCostItem('接送大巴(50座)', Math.round(1200 * t), 1, '元/辆'),
      createDefaultCostItem('物料运输', Math.round(800 * t), 1, '元/次'),
    ],
    personnel: [
      createDefaultCostItem('主持人', Math.round(2500 * t), 1, '元/场'),
      createDefaultCostItem('摄影师', Math.round(1500 * t), 1, '元/场'),
      createDefaultCostItem('摄像师', Math.round(1800 * t), 1, '元/场'),
      createDefaultCostItem('礼仪人员', Math.round(400 * t), 4, '元/人'),
      createDefaultCostItem('兼职工作人员', Math.round(250 * t), Math.ceil(people / 30), '元/人'),
    ],
    contingency: [
      createDefaultCostItem('应急备用金', 0, 1, '元'),
    ],
  };
}

export function createDefaultBasicInfo(): BasicInfo {
  const today = new Date();
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    eventName: '2026年度品牌发布会',
    eventDate: nextMonth.toISOString().slice(0, 10),
    peopleCount: 100,
    durationHours: 8,
    durationDays: 1,
    cityTier: 't2',
    targetBudget: 150000,
    companyName: '',
  };
}

export function createDefaultBudget(): BudgetData {
  const basic = createDefaultBasicInfo();
  return {
    basic,
    currentPlan: 'standard',
    costs: createDefaultCosts(basic.cityTier, basic.peopleCount, basic.durationDays),
    adjustments: {
      taxRate: 6,
      serviceRate: 10,
      contingencyRate: 10,
    },
    suppliers: {
      venue: [],
      catering: [],
      materials: [],
      transport: [],
      personnel: [],
      contingency: [],
    },
  };
}

export function calcItemSubtotal(
  item: CostItem,
  cityTier: CityTier,
  plan: keyof typeof PLAN_MULTIPLIER,
): number {
  const mult = CITY_TIER_MULTIPLIER[cityTier] * PLAN_MULTIPLIER[plan];
  return item.unitPrice * item.quantity * mult;
}

export function calculateBudget(data: BudgetData): CalculationResult {
  const { basic, costs, adjustments, currentPlan } = data;
  const categories: CostCategory[] = ['venue', 'catering', 'materials', 'transport', 'personnel', 'contingency'];

  const categoryTotals: CategoryTotal[] = categories.map((cat) => {
    const items = costs[cat];
    let subtotal = 0;
    items.forEach((item) => {
      if (cat === 'contingency') {
        subtotal += item.unitPrice * item.quantity;
      } else {
        subtotal += calcItemSubtotal(item, basic.cityTier, currentPlan);
      }
    });
    return {
      category: cat,
      name: CATEGORY_LABELS[cat],
      subtotal,
      items,
    };
  });

  const fiveCatTotal = categoryTotals
    .filter((c) => c.category !== 'contingency')
    .reduce((s, c) => s + c.subtotal, 0);

  const contingencyIdx = categoryTotals.findIndex((c) => c.category === 'contingency');
  if (contingencyIdx >= 0) {
    const cont = categoryTotals[contingencyIdx];
    if (cont.items.length > 0 && cont.items[0].unitPrice === 0) {
      const suggested = fiveCatTotal * (adjustments.contingencyRate / 100);
      categoryTotals[contingencyIdx] = {
        ...cont,
        subtotal: suggested,
      };
    }
  }

  const pretaxTotal = categoryTotals.reduce((s, c) => s + c.subtotal, 0);
  const tax = pretaxTotal * (adjustments.taxRate / 100);
  const serviceFee = pretaxTotal * (adjustments.serviceRate / 100);
  const grandTotal = pretaxTotal + tax + serviceFee;
  const perPersonCost = basic.peopleCount > 0 ? grandTotal / basic.peopleCount : 0;
  const budgetRemaining = basic.targetBudget - grandTotal;
  const budgetUsedPercent = basic.targetBudget > 0 ? (grandTotal / basic.targetBudget) * 100 : 0;

  return {
    categoryTotals,
    pretaxTotal,
    tax,
    serviceFee,
    grandTotal,
    perPersonCost,
    budgetRemaining,
    budgetUsedPercent,
  };
}

export function analyzeRisks(data: BudgetData, result: CalculationResult): RiskItem[] {
  const risks: RiskItem[] = [];
  const { basic, costs } = data;
  const { categoryTotals, grandTotal, pretaxTotal, perPersonCost } = result;

  if (basic.targetBudget > 0 && grandTotal > basic.targetBudget) {
    risks.push({
      id: generateId(),
      level: 'high',
      type: 'over_budget',
      title: '总预算超支',
      description: `当前总预算 ${formatCurrency(grandTotal)} 已超出目标预算 ${formatCurrency(basic.targetBudget)}，超支 ${formatCurrency(grandTotal - basic.targetBudget)}`,
    });
  } else if (basic.targetBudget > 0 && grandTotal > basic.targetBudget * 0.9) {
    risks.push({
      id: generateId(),
      level: 'medium',
      type: 'over_budget',
      title: '预算接近上限',
      description: `当前总预算已使用目标的 ${((grandTotal / basic.targetBudget) * 100).toFixed(1)}%，请谨慎调整`,
    });
  }

  const caterTotal = categoryTotals.find((c) => c.category === 'catering');
  if (caterTotal && basic.peopleCount > 0) {
    const avgCater = caterTotal.subtotal / basic.peopleCount;
    if (avgCater < 30) {
      risks.push({
        id: generateId(),
        level: 'medium',
        type: 'anomaly',
        title: '餐饮标准偏低',
        description: `人均餐饮费用仅 ${formatCurrency(avgCater)}，低于常规水平(≥¥30)，可能影响活动品质`,
        relatedCategory: 'catering',
      });
    } else if (avgCater > 1000) {
      risks.push({
        id: generateId(),
        level: 'medium',
        type: 'anomaly',
        title: '餐饮标准偏高',
        description: `人均餐饮费用达 ${formatCurrency(avgCater)}，高于常规水平(≤¥1000)，请确认是否必要`,
        relatedCategory: 'catering',
      });
    }
  }

  if (basic.peopleCount >= 50) {
    const hasPhotography = costs.personnel.some((i) =>
      i.name.includes('摄影') || i.name.includes('摄像'),
    );
    if (!hasPhotography) {
      risks.push({
        id: generateId(),
        level: 'low',
        type: 'missing',
        title: '建议增加影像记录',
        description: `活动规模 ${basic.peopleCount} 人，建议配置摄影/摄像人员记录活动`,
        relatedCategory: 'personnel',
      });
    }

    const hasSignin = costs.materials.some((i) =>
      i.name.includes('签到') || i.name.includes('报名'),
    );
    if (!hasSignin) {
      risks.push({
        id: generateId(),
        level: 'low',
        type: 'missing',
        title: '建议配置签到用品',
        description: '中大型活动建议配置签到台/签到系统，便于人员管理',
        relatedCategory: 'materials',
      });
    }
  }

  const fiveCats = categoryTotals.filter((c) => c.category !== 'contingency');
  fiveCats.forEach((cat) => {
    if (pretaxTotal > 0) {
      const percent = (cat.subtotal / pretaxTotal) * 100;
      if (percent > 50) {
        risks.push({
          id: generateId(),
          level: 'high',
          type: 'over_budget',
          title: `${cat.name}占比过高`,
          description: `${cat.name}占总费用的 ${percent.toFixed(1)}%，单项占比超过50%，建议复核是否合理`,
          relatedCategory: cat.category,
        });
      }
    }
  });

  if (perPersonCost > 0) {
    if (perPersonCost < 100) {
      risks.push({
        id: generateId(),
        level: 'medium',
        type: 'anomaly',
        title: '人均成本偏低',
        description: `人均总成本仅 ${formatCurrency(perPersonCost)}，建议确认是否遗漏关键费用项`,
      });
    }
  }

  if (risks.length === 0) {
    risks.push({
      id: generateId(),
      level: 'low',
      type: 'general',
      title: '预算健康',
      description: '当前预算方案结构合理，暂未发现风险项。',
    });
  }

  return risks;
}

const STORAGE_KEY = 'event-budget-templates';

export function loadTemplates(): { templates: any[]; lastUsed: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { templates: [], lastUsed: null };
    const parsed = JSON.parse(raw);
    return {
      templates: parsed.templates || [],
      lastUsed: parsed.lastUsed || null,
    };
  } catch {
    return { templates: [], lastUsed: null };
  }
}

export function saveTemplates(storage: { templates: any[]; lastUsed: string | null }): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

export function exportJSON(data: BudgetData, filename: string = '活动预算.json'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importJSON(file: File): Promise<BudgetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        resolve(data as BudgetData);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
