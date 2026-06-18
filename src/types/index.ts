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
  clientName: string;
  clientContact: string;
}

export interface CostItem {
  id: string;
  name: string;
  /** 基准单价：二线城市(t2) + 标准方案(standard)下的原始单价，切换档位/方案时不变 */
  basePrice: number;
  /** 数量 */
  quantity: number;
  unit: string;
  remark: string;
  internalNote: string;
  isCustom: boolean;
  /** 选中的供应商报价ID（可选） */
  selectedSupplierId?: string;
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
  email: string;
  quoteDate: string;
  /** 报价金额（总价，或按单位计价） */
  quoteAmount: number;
  /** 报价计价单位 */
  quoteUnit: string;
  /** 是否为含税报价 */
  taxIncluded: boolean;
  /** 对应税率（当 taxIncluded=false 时适用） */
  applicableTaxRate: number;
  /** 是否为推荐供应商 */
  isRecommended: boolean;
  /** 报价有效期至 */
  validUntil: string;
  /** 附件链接（如报价单PDF） */
  attachmentUrl: string;
  /** 综合评分 1-5 */
  rating: number;
  /** 内部备注（不显示给客户） */
  internalNotes: string;
  /** 可提供的服务范围描述 */
  notes: string;
  category: CostCategory;
  /** 关联的费用项目ID */
  relatedItemIds: string[];
}

export type ConfirmationStatus = 'pending' | 'confirmed' | 'needs_adjustment';

export interface ConfirmationRecord {
  id: string;
  status: ConfirmationStatus;
  timestamp: string;
  operator: string;
  comment: string;
  /** 当时的预算快照总额 */
  snapshotGrandTotal: number;
  /** 客户反馈的需要调整项 */
  adjustmentItems?: string[];
}

export interface ClientConfirmation {
  status: ConfirmationStatus;
  /** 客户名称 */
  confirmedBy: string;
  /** 联系电话 */
  confirmedPhone: string;
  /** 确认时间 */
  confirmedAt: string;
  /** 确认备注（客户可见） */
  comment: string;
  /** 内部备注（客户不可见） */
  internalNote: string;
  /** 确认历史记录 */
  history: ConfirmationRecord[];
  /** 客户回复的需要调整的具体项 */
  requestedAdjustments: string;
}

export interface BudgetData {
  basic: BasicInfo;
  currentPlan: PlanType;
  costs: CostData;
  adjustments: Adjustments;
  suppliers: Record<CostCategory, SupplierInfo[]>;
  confirmation: ClientConfirmation;
  /** 创建时间 */
  createdAt: string;
  /** 最后更新时间 */
  updatedAt: string;
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
  /** 已选中的供应商报价节省/超支金额（与原始估算对比） */
  supplierDelta: number;
}

export interface RiskItem {
  id: string;
  level: 'high' | 'medium' | 'low';
  type: 'over_budget' | 'missing' | 'anomaly' | 'general' | 'supplier';
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

export const CONFIRMATION_STATUS_LABELS: Record<ConfirmationStatus, string> = {
  pending: '待客户确认',
  confirmed: '客户已确认',
  needs_adjustment: '需调整后重审',
};

export const CONFIRMATION_STATUS_COLORS: Record<ConfirmationStatus, string> = {
  pending: 'warning',
  confirmed: 'success',
  needs_adjustment: 'danger',
};

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
