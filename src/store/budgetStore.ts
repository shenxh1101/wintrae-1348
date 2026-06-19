import { create } from 'zustand';
import {
  BudgetData,
  BudgetSnapshot,
  CostCategory,
  CostItem,
  PlanType,
  SavedTemplate,
  SupplierInfo,
  ConfirmationStatus,
  ConfirmationRecord,
  CATEGORY_LABELS,
} from '@/types';
import {
  calculateBudget,
  calcItemSubtotal,
  createDefaultBudget,
  createDefaultCostItem,
  createDefaultSupplier,
  generateId,
  loadTemplates,
  normalizeBudgetData,
  saveTemplates,
} from '@/utils/calculations';

interface BudgetStore {
  data: BudgetData;
  templates: SavedTemplate[];
  lastUsedTemplateId: string | null;
  activeSupplierCategory: CostCategory | null;
  /** 比价模式：当前在哪个费用项上打开比价面板 */
  compareItemId: { category: CostCategory; itemId: string } | null;
  previewMode: 'full' | 'simple' | 'client';
  /** 附件清单视图是否打开 */
  showAttachmentGallery: boolean;
  /** 抽屉中聚焦的供应商ID（用于从附件清单跳转定位） */
  focusedSupplierId: string | null;
  touchUpdatedAt: () => void;
  setBasic: <K extends keyof BudgetData['basic']>(
    key: K,
    value: BudgetData['basic'][K],
  ) => void;
  setPlan: (plan: PlanType) => void;
  /** 直接设置城市档位，不触碰价格（因为价格通过 basePrice + 系数计算） */
  setCityTier: (tier: BudgetData['basic']['cityTier']) => void;
  updateCostItem: (
    category: CostCategory,
    itemId: string,
    field: keyof CostItem,
    value: any,
  ) => void;
  addCostItem: (category: CostCategory, name?: string) => void;
  removeCostItem: (category: CostCategory, itemId: string) => void;
  selectSupplierForItem: (
    category: CostCategory,
    itemId: string,
    supplierId: string | null,
  ) => void;
  setAdjustment: <K extends keyof BudgetData['adjustments']>(
    key: K,
    value: number,
  ) => void;
  addSupplier: (category: CostCategory, supplier?: Partial<SupplierInfo>) => void;
  updateSupplier: (
    category: CostCategory,
    id: string,
    field: keyof SupplierInfo,
    value: any,
  ) => void;
  removeSupplier: (category: CostCategory, id: string) => void;
  toggleSupplierRecommended: (category: CostCategory, id: string) => void;
  setActiveSupplierCategory: (cat: CostCategory | null) => void;
  openComparePanel: (category: CostCategory, itemId: string) => void;
  closeComparePanel: () => void;
  setShowAttachmentGallery: (open: boolean) => void;
  /** 直接打开供应商抽屉并定位到指定供应商 */
  openSupplierDrawer: (category: CostCategory, supplierId?: string) => void;
  setFocusedSupplierId: (id: string | null) => void;
  updateConfirmation: (
    updates: Partial<BudgetData['confirmation']> & {
      addHistory?: {
        status: ConfirmationStatus;
        operator: string;
        comment: string;
        snapshotGrandTotal: number;
      };
    },
  ) => void;
  saveAsTemplate: (name: string) => void;
  loadTemplate: (id: string) => void;
  loadLastTemplate: () => boolean;
  deleteTemplate: (id: string) => void;
  resetBudget: () => void;
  replaceBudget: (data: BudgetData) => void;
  setPreviewMode: (mode: 'full' | 'simple' | 'client') => void;
  refreshTemplates: () => void;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  data: createDefaultBudget(),
  templates: [],
  lastUsedTemplateId: null,
  activeSupplierCategory: null,
  compareItemId: null,
  previewMode: 'full',
  showAttachmentGallery: false,
  focusedSupplierId: null,

  setShowAttachmentGallery: (open) => {
    set({ showAttachmentGallery: open });
  },

  openSupplierDrawer: (category, supplierId) => {
    set({
      activeSupplierCategory: category,
      focusedSupplierId: supplierId || null,
      showAttachmentGallery: false,
    });
  },

  setFocusedSupplierId: (id) => {
    set({ focusedSupplierId: id });
  },

  touchUpdatedAt: () => {
    set((state) => ({
      data: { ...state.data, updatedAt: new Date().toISOString() },
    }));
  },

  setBasic: (key, value) => {
    set((state) => ({
      data: {
        ...state.data,
        basic: { ...state.data.basic, [key]: value },
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  setPlan: (plan) => {
    set((state) => ({
      data: { ...state.data, currentPlan: plan, updatedAt: new Date().toISOString() },
    }));
  },

  setCityTier: (tier) => {
    // 只改档位，不动 basePrice！显示价格将自动通过系数重算
    set((state) => ({
      data: {
        ...state.data,
        basic: { ...state.data.basic, cityTier: tier },
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  updateCostItem: (category, itemId, field, value) => {
    set((state) => {
      const items = state.data.costs[category].map((it) =>
        it.id === itemId ? { ...it, [field]: value } : it,
      );
      return {
        data: {
          ...state.data,
          costs: { ...state.data.costs, [category]: items },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  addCostItem: (category, name) => {
    set((state) => {
      const newItem = createDefaultCostItem(name || '自定义项目', 0, 1, '元/次');
      newItem.isCustom = true;
      return {
        data: {
          ...state.data,
          costs: {
            ...state.data.costs,
            [category]: [...state.data.costs[category], newItem],
          },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  removeCostItem: (category, itemId) => {
    set((state) => ({
      data: {
        ...state.data,
        costs: {
          ...state.data.costs,
          [category]: state.data.costs[category].filter((it) => it.id !== itemId),
        },
        // 如果某项被删除，也要清除可能存在的该供应商关联
        suppliers: state.data.suppliers,
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  selectSupplierForItem: (category, itemId, supplierId) => {
    set((state) => {
      const items = state.data.costs[category].map((it) =>
        it.id === itemId ? { ...it, selectedSupplierId: supplierId || undefined } : it,
      );
      return {
        data: {
          ...state.data,
          costs: { ...state.data.costs, [category]: items },
          updatedAt: new Date().toISOString(),
        },
        compareItemId: null,
      };
    });
  },

  setAdjustment: (key, value) => {
    set((state) => ({
      data: {
        ...state.data,
        adjustments: { ...state.data.adjustments, [key]: value },
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  addSupplier: (category, supplier = {}) => {
    set((state) => {
      const def = createDefaultSupplier(category);
      const newSupplier: SupplierInfo = {
        ...def,
        ...supplier,
        id: def.id, // 保证 ID 唯一
      };
      return {
        data: {
          ...state.data,
          suppliers: {
            ...state.data.suppliers,
            [category]: [...state.data.suppliers[category], newSupplier],
          },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  updateSupplier: (category, id, field, value) => {
    set((state) => ({
      data: {
        ...state.data,
        suppliers: {
          ...state.data.suppliers,
          [category]: state.data.suppliers[category].map((s) =>
            s.id === id ? { ...s, [field]: value } : s,
          ),
        },
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  removeSupplier: (category, id) => {
    set((state) => {
      // 删除供应商时，同时清除引用此供应商的费用项关联
      const items = state.data.costs[category].map((it) =>
        it.selectedSupplierId === id ? { ...it, selectedSupplierId: undefined } : it,
      );
      return {
        data: {
          ...state.data,
          suppliers: {
            ...state.data.suppliers,
            [category]: state.data.suppliers[category].filter((s) => s.id !== id),
          },
          costs: { ...state.data.costs, [category]: items },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  toggleSupplierRecommended: (category, id) => {
    set((state) => ({
      data: {
        ...state.data,
        suppliers: {
          ...state.data.suppliers,
          [category]: state.data.suppliers[category].map((s) =>
            s.id === id ? { ...s, isRecommended: !s.isRecommended } : s,
          ),
        },
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  setActiveSupplierCategory: (cat) => {
    set({ activeSupplierCategory: cat });
  },

  openComparePanel: (category, itemId) => {
    set({ compareItemId: { category, itemId } });
  },

  closeComparePanel: () => {
    set({ compareItemId: null });
  },

  updateConfirmation: ({ addHistory, ...updates }) => {
    set((state) => {
      const newConf = { ...state.data.confirmation, ...updates };

      // 如果有历史记录追加（状态变更时触发）
      if (addHistory) {
        const record: ConfirmationRecord = {
          id: generateId(),
          status: addHistory.status,
          timestamp: new Date().toISOString(),
          operator: addHistory.operator,
          comment: addHistory.comment,
          snapshotGrandTotal: addHistory.snapshotGrandTotal,
        };
        newConf.history = [...newConf.history, record];

        // 版本号递增（每次状态流转都 +1，首次从 1 开始）
        const currentVersion = typeof newConf.version === 'number' ? newConf.version : 1;
        newConf.version = currentVersion + 1;

        // 每次进入 confirmed 状态时刷新 confirmedAt（包括从 needs_adjustment 回转回来）
        if (addHistory.status === 'confirmed') {
          newConf.confirmedAt = record.timestamp;
        } else if (addHistory.status === 'needs_adjustment') {
          newConf.requestedAdjustments = addHistory.comment || newConf.requestedAdjustments;
        }

        // 自动打预算版本快照
        const result = calculateBudget(state.data);
        const snapshotItems: BudgetSnapshot['items'] = [];
        const catKeys: CostCategory[] = [
          'venue',
          'catering',
          'materials',
          'transport',
          'personnel',
          'contingency',
        ];
        catKeys.forEach((cat) => {
          state.data.costs[cat].forEach((it) => {
            const r = calcItemSubtotal(
              it,
              state.data.basic.cityTier,
              state.data.currentPlan,
              cat,
              state.data.suppliers[cat],
              state.data.adjustments.taxRate,
            );
            snapshotItems.push({
              category: cat,
              itemId: it.id,
              name: it.name,
              subtotal: r.subtotal,
            });
          });
        });
        const snapshot: BudgetSnapshot = {
          id: generateId(),
          version: newConf.version,
          status: addHistory.status,
          timestamp: record.timestamp,
          operator: addHistory.operator,
          comment: addHistory.comment,
          grandTotal: result.grandTotal,
          pretaxTotal: result.pretaxTotal,
          categoryTotals: result.categoryTotals.map((c) => ({
            category: c.category,
            name: CATEGORY_LABELS[c.category],
            subtotal: c.subtotal,
          })),
          items: snapshotItems,
        };
        return {
          data: {
            ...state.data,
            confirmation: newConf,
            snapshots: [...state.data.snapshots, snapshot],
            updatedAt: new Date().toISOString(),
          },
        };
      }

      return {
        data: {
          ...state.data,
          confirmation: newConf,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  saveAsTemplate: (name) => {
    const { data, templates, lastUsedTemplateId } = get();
    const newTemplate: SavedTemplate = {
      id: generateId(),
      name,
      savedAt: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(data)),
    };
    const updated = [...templates, newTemplate];
    saveTemplates({ templates: updated, lastUsed: newTemplate.id });
    set({ templates: updated, lastUsedTemplateId: newTemplate.id });
  },

  loadTemplate: (id) => {
    const { templates } = get();
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      const normalized = normalizeBudgetData(JSON.parse(JSON.stringify(tpl.data)));
      set({
        data: normalized,
        lastUsedTemplateId: id,
      });
      saveTemplates({ templates, lastUsed: id });
    }
  },

  loadLastTemplate: () => {
    const storage = loadTemplates();
    if (storage.lastUsed) {
      const tpl = storage.templates.find((t) => t.id === storage.lastUsed);
      if (tpl) {
        const normalized = normalizeBudgetData(JSON.parse(JSON.stringify(tpl.data)));
        set({
          data: normalized,
          templates: storage.templates,
          lastUsedTemplateId: storage.lastUsed,
        });
        return true;
      }
    }
    set({ templates: storage.templates, lastUsedTemplateId: storage.lastUsed });
    return false;
  },

  deleteTemplate: (id) => {
    const { templates, lastUsedTemplateId } = get();
    const updated = templates.filter((t) => t.id !== id);
    const newLast = lastUsedTemplateId === id ? null : lastUsedTemplateId;
    saveTemplates({ templates: updated, lastUsed: newLast });
    set({ templates: updated, lastUsedTemplateId: newLast });
  },

  resetBudget: () => {
    set({
      data: createDefaultBudget(),
      compareItemId: null,
      activeSupplierCategory: null,
      showAttachmentGallery: false,
      focusedSupplierId: null,
    });
  },

  replaceBudget: (rawData) => {
    const normalized = normalizeBudgetData(rawData);
    set({ data: normalized });
  },

  setPreviewMode: (mode) => {
    set({ previewMode: mode });
  },

  refreshTemplates: () => {
    const storage = loadTemplates();
    set({ templates: storage.templates, lastUsedTemplateId: storage.lastUsed });
  },
}));
