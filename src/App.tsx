import React from 'react';
import { SalesProvider, useSales } from './context/SalesContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewTable } from './components/overview/OverviewTable';
import { YearComparisonChart } from './components/overview/YearComparisonChart';
import { MonthDetailModal } from './components/overview/MonthDetailModal';
import { LiquidWaterDroplet } from './components/layout/LiquidWaterDroplet';
import { GoogleSheetsSyncModal } from './components/sync/GoogleSheetsSyncModal';
import { SalesRepsRankingView } from './components/sales-reps/SalesRepsRankingView';
import { ManageRepsView } from './components/management/ManageRepsView';
import { ManageTargetsView } from './components/management/ManageTargetsView';
import { ManageSidebarView } from './components/management/ManageSidebarView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { DataSheetView } from './components/datasheet/DataSheetView';
import { SettingsView } from './components/settings/SettingsView';
import { CustomPageView } from './components/custom/CustomPageView';
import { ExecutiveDashboardView } from './components/dashboard/ExecutiveDashboardView';
import { LeadFollowUpReportView } from './components/lead-followup/LeadFollowUpReportView';
import { SalesPerformanceView } from './components/sales-performance/SalesPerformanceView';
import { MeasurementReportView } from './components/measurement/MeasurementReportView';
import { TargetAchievementReportView } from './components/targets/TargetAchievementReportView';
import { ConversionRateReportView } from './components/conversion/ConversionRateReportView';
import { ClaimIssueReportView } from './components/claim/ClaimIssueReportView';
import { ProgressOfSalesView } from './components/progress/ProgressOfSalesView';

const MainContent: React.FC = () => {
  const { activePage, settings } = useSales();
  const isLight = settings.themeMode === 'light';

  const renderActiveView = () => {
    switch (activePage) {
      case 'dashboard':
        return <ExecutiveDashboardView />;
      case 'lead-followup':
        return <LeadFollowUpReportView />;
      case 'sales-performance':
        return <SalesPerformanceView />;
      case 'measurement-report':
        return <MeasurementReportView />;
      case 'target-achievement':
        return <TargetAchievementReportView />;
      case 'conversion-rate':
        return <ConversionRateReportView />;
      case 'claim-report':
        return <ClaimIssueReportView />;
      case 'progress-of-sales':
        return <ProgressOfSalesView />;
      case 'overview':
        return (
          <div className="space-y-8 animate-fade-in">
            <OverviewTable />
            <YearComparisonChart />
          </div>
        );
      case 'analytics':
        return <AnalyticsView />;
      case 'sales-reps':
        return <SalesRepsRankingView />;
      case 'team-targets':
        return <ManageTargetsView />;
      case 'manage-reps':
        return <ManageRepsView />;
      case 'manage-sidebar':
        return <ManageSidebarView />;
      case 'data-sheet':
        return <DataSheetView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <CustomPageView pageId={activePage} />;
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-300 ${
        isLight
          ? 'theme-light bg-[#f8fafc] text-slate-900 selection:bg-cyan-500/20 selection:text-cyan-900'
          : 'theme-dark bg-[#020614] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200'
      }`}
    >
      {/* Liquid Glass Ambient Fluid Mesh Orbs (Behind Glass) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {isLight ? (
          <>
            {/* Light Mode Pearlescent Fluid Orbs */}
            <div className="absolute -top-[15%] right-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-cyan-300/35 via-sky-300/25 to-transparent blur-[110px] liquid-orb-1" />
            <div className="absolute top-[30%] -left-[10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-blue-300/25 via-indigo-200/20 to-transparent blur-[130px] liquid-orb-2" />
            <div className="absolute -bottom-[15%] left-[25%] w-[750px] h-[550px] rounded-full bg-gradient-to-t from-sky-300/30 via-cyan-200/20 to-transparent blur-[140px] liquid-orb-3" />
            <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]" />
          </>
        ) : (
          <>
            {/* Dark Mode Luminous Neon Fluid Orbs */}
            <div className="absolute -top-[15%] right-[5%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-cyan-500/20 via-sky-600/15 to-transparent blur-[110px] liquid-orb-1" />
            <div className="absolute top-[35%] -left-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-transparent blur-[130px] liquid-orb-2" />
            <div className="absolute -bottom-[15%] left-[25%] w-[700px] h-[500px] rounded-full bg-gradient-to-t from-cyan-600/15 via-blue-500/10 to-transparent blur-[140px] liquid-orb-3" />
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035]" />
          </>
        )}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <div className="flex-1 flex overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {renderActiveView()}
          </main>
        </div>
      </div>

      <MonthDetailModal />
      <GoogleSheetsSyncModal />
      <LiquidWaterDroplet />
    </div>
  );
};

export function App() {
  return (
    <SalesProvider>
      <MainContent />
    </SalesProvider>
  );
}

export default App;
