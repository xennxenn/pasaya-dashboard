import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  Calendar,
  Filter,
  Palette,
  ChevronDown,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { THEME_CONFIGS, getThemePrimaryText } from '../../utils/theme';
import { FontTheme } from '../../types';
import { MONTH_SHORT_EN } from '../../data/salesDataService';

export const Navbar: React.FC = () => {
  const {
    settings,
    sheetsConfig,
    isRealtimeConnected,
    isSyncingSheets,
    setIsSyncModalOpen,
    triggerGoogleSheetsSync,
    updateSettings,
    toggleThemeMode,
    toggleMobileSidebar,
    resetAllData,
  } = useSales();

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isYtdMenuOpen, setIsYtdMenuOpen] = useState(false);

  const isLight = settings.themeMode === 'light';
  const currentTheme = THEME_CONFIGS[settings.fontTheme] || THEME_CONFIGS.cyan;
  const primaryTextColor = getThemePrimaryText(settings.fontTheme, settings.themeMode);

  return (
    <header
      className={`sticky top-0 z-30 w-full transition-colors duration-300 ${
        isLight
          ? 'bg-white/95 border-b border-slate-200 shadow-xs text-slate-800'
          : 'bg-[#040a1c]/80 border-b border-white/10 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] text-slate-100'
      }`}
    >
      <div className="flex h-16 items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleMobileSidebar}
            className={`lg:hidden p-2 rounded-xl border transition-all ${
              isLight
                ? 'text-slate-600 hover:text-cyan-700 hover:bg-slate-100 border-slate-200'
                : 'text-slate-300 hover:text-cyan-300 hover:bg-white/5 border-white/5'
            }`}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            {/* Logo rendering */}
            {settings.showAppLogo && (
              settings.appLogoUrl ? (
                <div
                  className={`flex items-center justify-center transition-all ${
                    !isLight && settings.logoDarkBacking !== false
                      ? 'bg-white/95 px-2 py-1 rounded-xl shadow-md border border-white/30 backdrop-blur-md'
                      : ''
                  }`}
                >
                  <img
                    src={settings.appLogoUrl}
                    alt="PASAYA Logo"
                    className={`h-8 w-auto max-w-[130px] object-contain rounded ${
                      !isLight && settings.logoInvertInDark ? 'brightness-0 invert' : ''
                    }`}
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center shadow-sm text-white font-bold text-sm tracking-wider border border-white/20">
                  P
                </div>
              )
            )}

            <div className="flex flex-col">
              <span
                className={`text-base sm:text-lg font-bold tracking-tight whitespace-nowrap ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                PASAYA <span className={primaryTextColor}>Curtain Center</span>
              </span>
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  isLight ? 'text-slate-500 font-semibold' : 'text-cyan-300/70'
                }`}
              >
                Sales Intelligence Dashboard
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Quick Breadcrumb */}
        <nav
          className={`hidden md:flex items-center gap-4 text-xs sm:text-sm font-medium ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          {/* Quick YTD Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsYtdMenuOpen(!isYtdMenuOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>YTD Cutoff:</span>
              <span className={`font-semibold ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>
                {settings.ytdCutoffMonth === 9
                  ? 'SEP (เดือน 9 - ตามโจทย์)'
                  : settings.ytdCutoffMonth === 10
                  ? 'OCT (เดือน 10)'
                  : settings.ytdCutoffMonth === 6
                  ? 'JUN (สิ้น Q2)'
                  : 'DEC (เต็มปี)'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isYtdMenuOpen && (
              <div
                className={`absolute left-0 mt-2 w-64 py-2 rounded-2xl shadow-xl z-50 border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-[#061129] border-white/20 text-slate-100'
                }`}
                onMouseLeave={() => setIsYtdMenuOpen(false)}
              >
                <div
                  className={`px-3.5 py-1.5 text-[11px] font-semibold border-b ${
                    isLight ? 'text-slate-500 border-slate-100' : 'text-slate-400 border-white/10'
                  }`}
                >
                  เลือกช่วงเดือนสำหรับ YTD
                </div>
                {[
                  { m: 9, name: 'SEP (เดือน 9) - ตามโจทย์' },
                  { m: 10, name: 'OCT (เดือน 10) - เดือนปัจจุบัน' },
                  { m: 6, name: 'JUN (เดือน 6) - สิ้น Q2' },
                  { m: 12, name: 'DEC (เดือน 12) - ทั้งปี' },
                ].map((item) => (
                  <button
                    key={item.m}
                    type="button"
                    onClick={() => {
                      updateSettings({ ytdCutoffMonth: item.m });
                      setIsYtdMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                      settings.ytdCutoffMonth === item.m
                        ? isLight
                          ? 'text-cyan-800 font-bold bg-cyan-50'
                          : 'text-cyan-300 font-bold bg-white/10'
                        : isLight
                        ? 'text-slate-700 hover:bg-slate-50'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{item.name}</span>
                    {settings.ytdCutoffMonth === item.m && (
                      <span className="w-2 h-2 rounded-full bg-cyan-600 dark:bg-cyan-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Zone 3: Primary Action, Theme & Mode Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Realtime Central Database & Google Sheets Sync Button */}
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-xs ${
              isRealtimeConnected
                ? isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : isLight
                ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
            title="คลิกเพื่อเชื่อมต่อและซิงค์ข้อมูล Google Sheets แบบ Realtime ทั่วทั้งระบบ"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin text-emerald-500' : ''}`} />
            <span className="hidden sm:inline">
              {isSyncingSheets ? 'กำลังซิงค์...' : 'Realtime Sync'}
            </span>
          </button>

          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleThemeMode}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-xs ${
              isLight
                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                : 'bg-white/[0.05] border-white/10 text-cyan-300 hover:bg-white/[0.08]'
            }`}
            title={isLight ? 'สลับไปยัง Dark Mode (โหมดมืด)' : 'สลับไปยัง Light Mode (โหมดสว่าง)'}
          >
            {isLight ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>โหมดสว่าง</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span>โหมดมืด</span>
              </>
            )}
          </button>

          {/* Font Color Theme Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all shadow-xs ${
                isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                  : 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
              }`}
              title="ปรับเปลี่ยนสี Font และโทนสีข้อความ"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="hidden sm:inline">สีฟอนต์:</span>
              <span className={`font-semibold ${primaryTextColor}`}>
                {currentTheme.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isThemeOpen && (
              <div
                className={`absolute right-0 mt-2 w-56 py-2 rounded-2xl shadow-2xl z-50 border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-[#061129] border-white/20 text-slate-100'
                }`}
                onMouseLeave={() => setIsThemeOpen(false)}
              >
                <div
                  className={`px-3.5 py-1 text-[11px] font-semibold border-b ${
                    isLight ? 'text-slate-500 border-slate-100' : 'text-slate-400 border-white/10'
                  }`}
                >
                  เลือกโทนสี Font
                </div>
                {(Object.keys(THEME_CONFIGS) as FontTheme[]).map((themeKey) => {
                  const t = THEME_CONFIGS[themeKey];
                  const isSelected = settings.fontTheme === themeKey;
                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => {
                        updateSettings({ fontTheme: themeKey });
                        setIsThemeOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? isLight
                            ? `${t.lightPrimaryText} font-bold bg-slate-50`
                            : `${t.primaryText} font-bold bg-white/10`
                          : isLight
                          ? 'text-slate-700 hover:bg-slate-50'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full border border-white/30 shadow-xs"
                          style={{ backgroundColor: t.chartColor }}
                        />
                        <span>{t.name}</span>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
                          ACTIVE
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Realtime Sync Button */}
          <button
            type="button"
            onClick={async () => {
              await triggerGoogleSheetsSync();
            }}
            disabled={isSyncingSheets}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              isLight
                ? 'border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                : 'border-white/10 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
            title="ซิงค์ข้อมูลล่าสุดกับ Google Sheets ทันที"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
