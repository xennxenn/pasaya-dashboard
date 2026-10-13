import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Award,
  Target,
  Users,
  Menu,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { THEME_CONFIGS, getThemePrimaryText } from '../../utils/theme';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  LayoutDashboard,
  TrendingUp,
  Award,
  Target,
  Users,
  Menu,
  FileSpreadsheet,
  Settings,
  FileText,
};

export const Sidebar: React.FC = () => {
  const {
    sidebarItems,
    activePage,
    setActivePage,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    settings,
  } = useSales();

  const isLight = settings.themeMode === 'light';
  const currentTheme = THEME_CONFIGS[settings.fontTheme] || THEME_CONFIGS.cyan;
  const primaryTextColor = getThemePrimaryText(settings.fontTheme, settings.themeMode);

  // Filter visible items and sort by order
  const sortedItems = [...sidebarItems]
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order);

  const renderNavLinks = () => (
    <div className="space-y-1.5 px-3 py-4">
      {sortedItems.map((item) => {
        const IconComponent = ICON_MAP[item.icon] || FileText;
        const isActive = activePage === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActivePage(item.id);
              setIsMobileSidebarOpen(false);
            }}
            title={isSidebarCollapsed ? item.label : undefined}
            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200 relative overflow-hidden ${
              isActive
                ? isLight
                  ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/10 to-transparent text-cyan-900 border border-cyan-500/30 border-t-white shadow-md'
                  : 'bg-gradient-to-r from-cyan-500/25 via-sky-500/15 to-blue-600/10 text-cyan-200 border border-cyan-400/35 border-t-white/35 shadow-lg shadow-cyan-950/60'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]'
            }`}
          >
            {/* Liquid highlight bar */}
            {isActive && (
              <div
                className={`absolute left-0 inset-y-1 w-1 rounded-r-full ${
                  isLight
                    ? 'bg-cyan-600 shadow-[0_0_8px_#0284c7]'
                    : 'bg-cyan-400 shadow-[0_0_10px_#38bdf8]'
                }`}
              />
            )}

            <div
              className={`p-2 rounded-xl transition-all shrink-0 ${
                isActive
                  ? isLight
                    ? 'bg-cyan-500/20 text-cyan-700 shadow-sm border border-cyan-500/30'
                    : 'bg-cyan-500/25 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] border border-white/20'
                  : isLight
                  ? 'text-slate-500 group-hover:text-cyan-700 group-hover:bg-slate-200/60'
                  : 'text-slate-400 group-hover:text-cyan-300 group-hover:bg-white/[0.06]'
              }`}
            >
              <IconComponent className="w-4 h-4" />
            </div>

            {!isSidebarCollapsed && (
              <span className="truncate text-left flex-1 whitespace-nowrap font-medium tracking-wide">
                {item.label}
              </span>
            )}

            {!isSidebarCollapsed && item.isCustom && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-mono ${
                  isLight
                    ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                    : 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60'
                }`}
              >
                Custom
              </span>
            )}
          </button>
        );
      })}

      {/* Quick Add Custom Page button at bottom of nav */}
      {!isSidebarCollapsed && (
        <div className="pt-3">
          <button
            type="button"
            onClick={() => setActivePage('manage-sidebar')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium transition-all ${
              isLight
                ? 'text-slate-600 hover:text-cyan-800 hover:bg-slate-100 border border-dashed border-slate-300'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-white/[0.04] border border-dashed border-white/10 hover:border-cyan-500/30'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-500" />
            <span>เพิ่ม / จัดการเมนู Sidebar</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md lg:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer (Slide-over for iPhone & iPad portrait) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          isLight
            ? 'bg-white/95 border-r border-slate-200 text-slate-800'
            : 'bg-[#040a1c]/90 border-r border-white/10 text-slate-100'
        } ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div
          className={`flex items-center justify-between h-16 px-5 border-b ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {settings.showAppLogo && (
              settings.appLogoUrl ? (
                <div
                  className={`flex items-center justify-center transition-all ${
                    !isLight && settings.logoDarkBacking !== false
                      ? 'bg-white/95 px-1.5 py-0.5 rounded-lg shadow-sm border border-white/30 backdrop-blur-md'
                      : ''
                  }`}
                >
                  <img
                    src={settings.appLogoUrl}
                    alt="Logo"
                    className={`h-7 w-auto max-w-[90px] object-contain rounded ${
                      !isLight && settings.logoInvertInDark ? 'brightness-0 invert' : ''
                    }`}
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center font-bold text-white text-xs border border-white/20">
                  P
                </div>
              )
            )}
            <span
              className={`text-sm font-bold tracking-wide ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              PASAYA <span className={primaryTextColor}>Curtain Center</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className={`p-1.5 rounded-xl transition-colors ${
              isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{renderNavLinks()}</div>

        <div
          className={`p-4 border-t ${
            isLight
              ? 'border-slate-200 bg-slate-50 text-slate-600'
              : 'border-white/10 bg-[#030716]/60 text-slate-400'
          }`}
        >
          <div className="text-[11px] font-medium">
            ระบบรายงานยอดขายผ้าม่าน PASAYA
          </div>
          <div
            className={`text-[10px] font-mono mt-0.5 ${
              isLight ? 'text-cyan-700 font-semibold' : 'text-cyan-400'
            }`}
          >
            Liquid Glass • iOS 27
          </div>
        </div>
      </aside>

      {/* Desktop Persistent Sidebar (iPad Landscape & PC) */}
      <aside
        className={`hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] border-r backdrop-blur-2xl transition-all duration-300 shrink-0 ${
          isLight
            ? 'bg-white/70 border-slate-200/80 shadow-[4px_0_24px_rgba(15,23,42,0.05)] text-slate-800'
            : 'bg-[#040a1c]/65 border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.4)] text-slate-100'
        } ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Collapse toggle header button */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${
            isLight ? 'border-slate-200/80' : 'border-white/[0.08]'
          }`}
        >
          {!isSidebarCollapsed && (
            <span
              className={`text-[10px] font-bold tracking-wider uppercase ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              เมนูหลัก (Navigation)
            </span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className={`p-1.5 rounded-xl border border-transparent transition-all ${
              isLight
                ? 'text-slate-600 hover:text-cyan-800 hover:bg-slate-100 hover:border-slate-200'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-white/[0.06] hover:border-white/10'
            } ${isSidebarCollapsed ? 'mx-auto' : ''}`}
            title={isSidebarCollapsed ? 'ขยาย Sidebar' : 'ย่อ Sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Scrollable links */}
        <div className="flex-1 overflow-y-auto">{renderNavLinks()}</div>

        {/* Bottom Sidebar Info */}
        {!isSidebarCollapsed && (
          <div
            className={`p-3.5 m-3 rounded-2xl border relative overflow-hidden ${
              isLight
                ? 'bg-white/80 border-slate-200 shadow-sm text-slate-800'
                : 'liquid-glass-subtle border-white/10 text-white'
            }`}
          >
            <div
              className={`text-xs font-bold tracking-wide ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              PASAYA Flagship
            </div>
            <div
              className={`text-[11px] mt-0.5 ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Curtain & Bedding Center
            </div>
            <div
              className={`mt-2 text-[10px] font-mono flex items-center gap-1.5 ${
                isLight ? 'text-cyan-700 font-semibold' : 'text-cyan-300'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLight
                    ? 'bg-cyan-600 shadow-[0_0_6px_#0284c7]'
                    : 'bg-cyan-400 shadow-[0_0_6px_#38bdf8]'
                }`}
              />
              <span>Real-Time Sales Intelligence</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
