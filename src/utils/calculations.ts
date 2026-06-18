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
  SupplierInfo,
  PlanType,
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

/**
 * 计算某城市档位+方案下的实际显示单价
 * 备用金类别不乘系数
 */
export function calcDisplayPrice(
  basePrice: number,
  cityTier: CityTier,
  plan: PlanType,
  category: CostCategory,
): number {
  if (category === 'contingency') return basePrice;
  return basePrice * CITY_TIER_MULTIPLIER[cityTier] * PLAN_MULTIPLIER[plan];
}

/**
 * 从显示价格反推基准单价（用于用户编辑显示单价时写回）
 */
export function reverseBasePrice(
  displayPrice: number,
  cityTier: CityTier,
  plan: PlanType,
  category: CostCategory,
): number {
  if (category === 'contingency') return displayPrice;
  const mult = CITY_TIER_MULTIPLIER[cityTier] * PLAN_MULTIPLIER[plan];
  return mult > 0 ? displayPrice / mult : 0;
}

export function createDefaultCostItem(
  name: string,
  basePrice: number,
  quantity: number,
  unit: string,
): CostItem {
  return {
    id: generateId(),
    name,
    basePrice,
    quantity,
    unit,
    remark: '',
    internalNote: '',
    isCustom: false,
    selectedSupplierId: undefined,
  };
}

export function createDefaultSupplier(category: CostCategory): SupplierInfo {
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return {
    id: generateId(),
    name: '',
    contact: '',
    phone: '',
    email: '',
    quoteDate: new Date().toISOString().slice(0, 10),
    quoteAmount: 0,
    quoteUnit: '元/次',
    taxIncluded: true,
    applicableTaxRate: 6,
    isRecommended: false,
    validUntil: nextMonth.toISOString().slice(0, 10),
    attachmentUrl: '',
    rating: 3,
    internalNotes: '',
    notes: '',
    category,
    relatedItemIds: [],
  };
}

export function createDefaultCosts(): CostData {
  return {
    venue: [
      createDefaultCostItem('场地租赁', 3000, 1, '元/天'),
      createDefaultCostItem('场地布置搭建', 5000, 1, '元/次'),
      createDefaultCostItem('音响设备租赁', 1500, 1, '元/天'),
      createDefaultCostItem('灯光设备租赁', 1800, 1, '元/天'),
      createDefaultCostItem('投影/LED屏', 2000, 1, '元/天'),
    ],
    catering: [
      createDefaultCostItem('正餐餐费', 120, 100, '元/人'),
      createDefaultCostItem('茶歇点心', 40, 100, '元/人'),
      createDefaultCostItem('酒水饮料', 30, 100, '元/人'),
    ],
    materials: [
      createDefaultCostItem('宣传物料(海报/X展架)', 800, 1, '元/批'),
      createDefaultCostItem('签到用品', 500, 1, '元/批'),
      createDefaultCostItem('伴手礼', 80, 100, '元/份'),
      createDefaultCostItem('鲜花装饰', 1200, 1, '元/批'),
    ],
    transport: [
      createDefaultCostItem('接送大巴(50座)', 1200, 1, '元/辆'),
      createDefaultCostItem('物料运输', 800, 1, '元/次'),
    ],
    personnel: [
      createDefaultCostItem('主持人', 2500, 1, '元/场'),
      createDefaultCostItem('摄影师', 1500, 1, '元/场'),
      createDefaultCostItem('摄像师', 1800, 1, '元/场'),
      createDefaultCostItem('礼仪人员', 400, 4, '元/人'),
      createDefaultCostItem('兼职工作人员', 250, 4, '元/人'),
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
    clientName: '',
    clientContact: '',
  };
}

export function createDefaultBudget(): BudgetData {
  const now = new Date().toISOString();
  return {
    basic: createDefaultBasicInfo(),
    currentPlan: 'standard',
    costs: createDefaultCosts(),
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
    confirmation: {
      status: 'pending',
      confirmedBy: '',
      confirmedPhone: '',
      confirmedAt: '',
      comment: '',
      internalNote: '',
      history: [],
      requestedAdjustments: '',
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 计算单项小计：优先使用选中的供应商报价，否则按基准单价×系数
 */
export function calcItemSubtotal(
  item: CostItem,
  cityTier: CityTier,
  plan: PlanType,
  category: CostCategory,
  suppliers: SupplierInfo[] = [],
  adjustmentsTaxRate: number,
): { subtotal: number; fromSupplier: boolean; supplier?: SupplierInfo } {
  // 1. 优先使用选中的供应商报价
  if (item.selectedSupplierId) {
    const supplier = suppliers.find((s) => s.id === item.selectedSupplierId);
    if (supplier) {
      let amount = supplier.quoteAmount;
      // 不含税报价需要加上税
      if (!supplier.taxIncluded) {
        amount = amount * (1 + (supplier.applicableTaxRate || adjustmentsTaxRate) / 100);
      }
      return {
        subtotal: amount,
        fromSupplier: true,
        supplier,
      };
    }
  }

  // 2. 否则使用基准单价计算
  const price = calcDisplayPrice(item.basePrice, cityTier, plan, category);
  return { subtotal: price * item.quantity, fromSupplier: false };
}

export function calculateBudget(data: BudgetData): CalculationResult {
  const { basic, costs, adjustments, currentPlan, suppliers } = data;
  const categories: CostCategory[] = ['venue', 'catering', 'materials', 'transport', 'personnel', 'contingency'];

  let supplierDelta = 0;

  const categoryTotals: CategoryTotal[] = categories.map((cat) => {
    const items = costs[cat];
    let subtotal = 0;
    items.forEach((item) => {
      const r = calcItemSubtotal(item, basic.cityTier, currentPlan, cat, suppliers[cat], adjustments.taxRate);
      subtotal += r.subtotal;
      // 计算与原始估算的差异（如果用了供应商报价）
      if (r.fromSupplier) {
        const original = calcDisplayPrice(item.basePrice, basic.cityTier, currentPlan, cat) * item.quantity;
        supplierDelta += r.subtotal - original;
      }
    });
    return {
      category: cat,
      name: CATEGORY_LABELS[cat],
      subtotal,
      items,
    };
  });

  // 自动计提备用金逻辑
  const fiveCatTotal = categoryTotals
    .filter((c) => c.category !== 'contingency')
    .reduce((s, c) => s + c.subtotal, 0);

  const contingencyIdx = categoryTotals.findIndex((c) => c.category === 'contingency');
  if (contingencyIdx >= 0) {
    const cont = categoryTotals[contingencyIdx];
    const contItem = costs.contingency[0];
    if (contItem && contItem.basePrice === 0) {
      const suggested = fiveCatTotal * (adjustments.contingencyRate / 100);
      categoryTotals[contingencyIdx] = { ...cont, subtotal: suggested };
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
    supplierDelta,
  };
}

export function analyzeRisks(data: BudgetData, result: CalculationResult): RiskItem[] {
  const risks: RiskItem[] = [];
  const { basic, costs, suppliers } = data;
  const { categoryTotals, grandTotal, pretaxTotal, perPersonCost, supplierDelta } = result;

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

  if (supplierDelta !== 0) {
    risks.push({
      id: generateId(),
      level: supplierDelta > 0 ? 'high' : 'low',
      type: 'supplier',
      title: `供应商报价${supplierDelta > 0 ? '超估' : '节省'}`,
      description: `已选用的供应商报价与原估算相比，${supplierDelta > 0 ? '增加' : '减少'} ${formatCurrency(Math.abs(supplierDelta))}`,
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

  // 检查即将过期的报价
  const now = new Date();
  (Object.keys(suppliers) as CostCategory[]).forEach((cat) => {
    suppliers[cat].forEach((s) => {
      if (s.isRecommended && s.validUntil) {
        const valid = new Date(s.validUntil);
        const diffDays = Math.ceil((valid.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7 && diffDays > 0) {
          risks.push({
            id: generateId(),
            level: 'medium',
            type: 'supplier',
            title: `「${s.name || '某供应商'}」报价即将过期`,
            description: `报价有效期还剩 ${diffDays} 天，请尽快确认`,
            relatedCategory: cat,
          });
        } else if (diffDays < 0) {
          risks.push({
            id: generateId(),
            level: 'high',
            type: 'supplier',
            title: `「${s.name || '某供应商'}」报价已过期`,
            description: `报价已于 ${s.validUntil} 过期，请联系重新报价`,
            relatedCategory: cat,
          });
        }
      }
    });
  });

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

  if (perPersonCost > 0 && perPersonCost < 100) {
    risks.push({
      id: generateId(),
      level: 'medium',
      type: 'anomaly',
      title: '人均成本偏低',
      description: `人均总成本仅 ${formatCurrency(perPersonCost)}，建议确认是否遗漏关键费用项`,
    });
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
        const raw = JSON.parse(reader.result as string);
        const data = normalizeBudgetData(raw);
        resolve(data as BudgetData);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * 兼容老版本数据导入时，自动补充新增字段并转换 unitPrice → basePrice
 */
export function normalizeBudgetData(raw: any): BudgetData {
  const def = createDefaultBudget();
  // 转换 unitPrice → basePrice
  const costs: any = {};
  const catKeys: CostCategory[] = ['venue', 'catering', 'materials', 'transport', 'personnel', 'contingency'];
  if (raw.costs) {
    catKeys.forEach((cat) => {
      costs[cat] = (raw.costs[cat] || []).map((item: any) => ({
        id: item.id || generateId(),
        name: item.name || '未命名',
        basePrice:
          typeof item.basePrice === 'number'
            ? item.basePrice
            : typeof item.unitPrice === 'number'
            ? item.unitPrice
            : 0,
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        unit: item.unit || '元/次',
        remark: item.remark || '',
        internalNote: item.internalNote || '',
        isCustom: !!item.isCustom,
        selectedSupplierId: item.selectedSupplierId || undefined,
      }));
    });
  } else {
    Object.assign(costs, def.costs);
  }

  // 供应商
  const suppliers: any = {};
  if (raw.suppliers) {
    catKeys.forEach((cat) => {
      suppliers[cat] = (raw.suppliers[cat] || []).map((s: any) => ({
        id: s.id || generateId(),
        name: s.name || '',
        contact: s.contact || '',
        phone: s.phone || '',
        email: s.email || '',
        quoteDate: s.quoteDate || new Date().toISOString().slice(0, 10),
        quoteAmount: typeof s.quoteAmount === 'number' ? s.quoteAmount : 0,
        quoteUnit: s.quoteUnit || s.unit || '元/次',
        taxIncluded: typeof s.taxIncluded === 'boolean' ? s.taxIncluded : true,
        applicableTaxRate: typeof s.applicableTaxRate === 'number' ? s.applicableTaxRate : 6,
        isRecommended: !!s.isRecommended,
        validUntil: s.validUntil || '',
        attachmentUrl: s.attachmentUrl || '',
        rating: typeof s.rating === 'number' ? Math.max(1, Math.min(5, s.rating)) : 3,
        internalNotes: s.internalNotes || '',
        notes: s.notes || '',
        category: cat,
        relatedItemIds: s.relatedItemIds || [],
      }));
    });
  } else {
    catKeys.forEach((cat) => (suppliers[cat] = []));
  }

  const confirmation = raw.confirmation
    ? {
        status: raw.confirmation.status || 'pending',
        confirmedBy: raw.confirmation.confirmedBy || '',
        confirmedPhone: raw.confirmation.confirmedPhone || '',
        confirmedAt: raw.confirmation.confirmedAt || '',
        comment: raw.confirmation.comment || '',
        internalNote: raw.confirmation.internalNote || '',
        history: raw.confirmation.history || [],
        requestedAdjustments: raw.confirmation.requestedAdjustments || '',
      }
    : { ...def.confirmation };

  return {
    basic: {
      ...def.basic,
      ...(raw.basic || {}),
    },
    currentPlan: raw.currentPlan || 'standard',
    costs,
    adjustments: {
      ...def.adjustments,
      ...(raw.adjustments || {}),
    },
    suppliers,
    confirmation,
    createdAt: raw.createdAt || def.createdAt,
    updatedAt: new Date().toISOString(),
  };
}
