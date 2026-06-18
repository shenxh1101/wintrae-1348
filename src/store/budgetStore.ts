import { create } from 'zustand';
import {
  BudgetData,
  CostCategory,
  CostItem,
  PlanType,
  SavedTemplate,
  SupplierInfo,
} from '@/types';
import {
  createDefaultBudget,
  createDefaultCostItem,
  generateId,
  loadTemplates,
  saveTemplates,
} from '@/utils/calculations';

interface BudgetStore {
  data: BudgetData;
  templates: SavedTemplate[];
  lastUsedTemplateId: string | null;
  activeSupplierCategory: CostCategory | null;
  previewMode: 'full' | 'simple';
  setBasic: <K extends keyof BudgetData['basic']>(key: K, value: BudgetData['basic'][K]) => void;
  setPlan: (plan: PlanType) => void;
  updateCostItem: (category: CostCategory, itemId: string, field: keyof CostItem, value: any) => void;
  addCostItem: (category: CostCategory, name?: string) => void;
  removeCostItem: (category: CostCategory, itemId: string) => void;
  setAdjustment: <K extends keyof BudgetData['adjustments']>(key: K, value: number) => void;
  addSupplier: (category: CostCategory, supplier: Partial<SupplierInfo>) => void;
  updateSupplier: (category: CostCategory, id: string, field: keyof SupplierInfo, value: any) => void;
  removeSupplier: (category: CostCategory, id: string) => void;
  setActiveSupplierCategory: (cat: CostCategory | null) => void;
  saveAsTemplate: (name: string) => void;
  loadTemplate: (id: string) => void;
  loadLastTemplate: () => boolean;
  deleteTemplate: (id: string) => void;
  resetBudget: () => void;
  replaceBudget: (data: BudgetData) => void;
  setPreviewMode: (mode: 'full' | 'simple') => void;
  refreshTemplates: () => void;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  data: createDefaultBudget(),
  templates: [],
  lastUsedTemplateId: null,
  activeSupplierCategory: null,
  previewMode: 'full',

  setBasic: (key, value) => {
    set((state) => ({
      data: {
        ...state.data,
        basic: { ...state.data.basic, [key]: value },
      },
    }));
  },

  setPlan: (plan) => {
    set((state) => ({
      data: { ...state.data, currentPlan: plan },
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
      },
    }));
  },

  setAdjustment: (key, value) => {
    set((state) => ({
      data: {
        ...state.data,
        adjustments: { ...state.data.adjustments, [key]: value },
      },
    }));
  },

  addSupplier: (category, supplier) => {
    set((state) => {
      const newSupplier: SupplierInfo = {
        id: generateId(),
        name: supplier.name || '',
        contact: supplier.contact || '',
        phone: supplier.phone || '',
        quoteDate: supplier.quoteDate || new Date().toISOString().slice(0, 10),
        quoteAmount: supplier.quoteAmount || 0,
        notes: supplier.notes || '',
        category,
      };
      return {
        data: {
          ...state.data,
          suppliers: {
            ...state.data.suppliers,
            [category]: [...state.data.suppliers[category], newSupplier],
          },
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
      },
    }));
  },

  removeSupplier: (category, id) => {
    set((state) => ({
      data: {
        ...state.data,
        suppliers: {
          ...state.data.suppliers,
          [category]: state.data.suppliers[category].filter((s) => s.id !== id),
        },
      },
    }));
  },

  setActiveSupplierCategory: (cat) => {
    set({ activeSupplierCategory: cat });
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
      const newData = JSON.parse(JSON.stringify(tpl.data));
      set({
        data: newData,
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
        set({
          data: JSON.parse(JSON.stringify(tpl.data)),
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
    set({ data: createDefaultBudget() });
  },

  replaceBudget: (data) => {
    set({ data });
  },

  setPreviewMode: (mode) => {
    set({ previewMode: mode });
  },

  refreshTemplates: () => {
    const storage = loadTemplates();
    set({ templates: storage.templates, lastUsedTemplateId: storage.lastUsed });
  },
}));
