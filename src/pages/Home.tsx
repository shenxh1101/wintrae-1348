import { useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import BasicInfoSection from '@/components/BasicInfoSection';
import CostSection from '@/components/CostSection';
import PlanSection from '@/components/PlanSection';
import RiskSection from '@/components/RiskSection';
import AdjustSection from '@/components/AdjustSection';
import ConfirmationSection from '@/components/ConfirmationSection';
import ExportSection from '@/components/ExportSection';
import SupplierDrawer from '@/components/SupplierDrawer';
import ComparePanel from '@/components/ComparePanel';
import AttachmentGallery from '@/components/AttachmentGallery';
import { useBudgetStore } from '@/store/budgetStore';

export default function Home() {
  const loadLastTemplate = useBudgetStore((s) => s.loadLastTemplate);
  const refreshTemplates = useBudgetStore((s) => s.refreshTemplates);

  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 lg:py-8">
        <div className="flex gap-6 lg:gap-8">
          <Sidebar />
          <main className="flex-1 min-w-0 space-y-8 lg:space-y-10">
            <BasicInfoSection />
            <CostSection />
            <PlanSection />
            <RiskSection />
            <AdjustSection />
            <ConfirmationSection />
            <ExportSection />

            <footer className="pt-10 pb-4 text-center">
              <div className="gold-divider mb-4" />
              <p className="text-xs text-navy-400 font-sans">
                线下活动预算估算工具 · 所有数据本地存储，保护您的商业隐私
              </p>
            </footer>
          </main>
        </div>
      </div>
      <SupplierDrawer />
      <ComparePanel />
      <AttachmentGallery />
    </div>
  );
}
