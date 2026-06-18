export type CityTier = 't1' | 't1n' | 't2' | 't3';
export type PlanType = 'conservative' | 'standard' | 'lean';

export interface BasicInfo {
  eventName: string;
  eventDate: string;
  peopleCount: number;
  durationHours: number;
  durationDays: number;
  cityTier: CityTier;
  targetBudget: number;
  companyName: string;
}

export interface CostItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  remark: string;
  isCustom: boolean;
}

export type CostCategory = 'venue' | 'catering' | 'materials' | 'transport' | 'personnel' | 'contingency';

export interface CostData {
  venue: CostItem[];
  catering: CostItem[];
  materials: CostItem[];
  transport: CostItem[];
  personnel: CostItem[];
  contingency: CostItem[];
}

export interface Adjustments {
  taxRate: number;
  serviceRate: number;
  contingencyRate: number;
}

export interface SupplierInfo {
  id: string;
  name: string;
  contact: string;
  phone: string;
  quoteDate: string;
  quoteAmount: number;
  notes: string;
  category: CostCategory;
}

export interface BudgetData {
  basic: BasicInfo;
  currentPlan: PlanType;
  costs: CostData;
  adjustments: Adjustments;
  suppliers: Record<CostCategory, SupplierInfo[]>;
}

export interface CategoryTotal {
  category: CostCategory;
  name: string;
  subtotal: number;
  items: CostItem[];
}

export interface CalculationResult {
  categoryTotals: CategoryTotal[];
  pretaxTotal: number;
  tax: number;
  serviceFee: number;
  grandTotal: number;
  perPersonCost: number;
  budgetRemaining: number;
  budgetUsedPercent: number;
}

export interface RiskItem {
  id: string;
  level: 'high' | 'medium' | 'low';
  type: 'over_budget' | 'missing' | 'anomaly' | 'general';
  title: string;
  description: string;
  relatedCategory?: CostCategory;
  relatedItemId?: string;
}

export interface SavedTemplate {
  id: string;
  name: string;
  savedAt: string;
  data: BudgetData;
}

export interface TemplateStorage {
  templates: SavedTemplate[];
  lastUsed: string | null;
}

export const CATEGORY_LABELS: Record<CostCategory, string> = {
  venue: '场地费用',
  catering: '餐饮费用',
  materials: '物料费用',
  transport: '交通费用',
  personnel: '人员费用',
  contingency: '备用金',
};

export const CATEGORY_ICONS: Record<CostCategory, string> = {
  venue: 'Building2',
  catering: 'UtensilsCrossed',
  materials: 'Package',
  transport: 'Car',
  personnel: 'Users',
  contingency: 'ShieldAlert',
};

export const CATEGORY_COLORS: Record<CostCategory, string> = {
  venue: '#1E3A5F',
  catering: '#C9A962',
  materials: '#3A7D44',
  transport: '#486581',
  personnel: '#8E7231',
  contingency: '#627D98',
};

export const CITY_TIER_LABELS: Record<CityTier, string> = {
  t1: '一线城市',
  t1n: '新一线城市',
  t2: '二线城市',
  t3: '三线及以下',
};

export const CITY_TIER_MULTIPLIER: Record<CityTier, number> = {
  t1: 1.4,
  t1n: 1.2,
  t2: 1.0,
  t3: 0.8,
};

export const PLAN_LABELS: Record<PlanType, string> = {
  conservative: '保守方案',
  standard: '标准方案',
  lean: '精简方案',
};

export const PLAN_DESCRIPTIONS: Record<PlanType, string> = {
  conservative: '预算充裕，品质优先',
  standard: '平衡品质与成本',
  lean: '控制成本，简约务实',
};

export const PLAN_MULTIPLIER: Record<PlanType, number> = {
  conservative: 1.3,
  standard: 1.0,
  lean: 0.75,
};
