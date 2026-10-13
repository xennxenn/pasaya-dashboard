import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  ShoppingBag,
  DollarSign,
  Receipt,
  Percent,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { MONTH_NAMES, MONTH_SHORT_EN, MONTH_FULL_TH } from '../../data/salesDataService';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';
import { THEME_CONFIGS, getThemePrimaryText } from '../../utils/theme';

export const OverviewTable: React.FC = () => {
  const {
    yearlyOverviewData,
    uniqueYears,
    settings,
    updateSettings,
    setSelectedMonthDetail,
  } = useSales();

  const isLight = settings.themeMode === 'light';
  const primaryTextColor = getThemePrimaryText(settings.fontTheme, settings.themeMode);

  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    uniqueYears.forEach((y) => {
      initial[y] = true;
    });
    return initial;
  });

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const cutoff = settings.ytdCutoffMonth || 9;
  const cutoffMonthName = MONTH_SHORT_EN[MONTH_NAMES[cutoff - 1]];

  // Quick summary stats for the latest year (2026)
  const latestYearData = yearlyOverviewData.find((y) => y.year === 2026) || yearlyOverviewData[0];

  return (
    <div className="space-y-6">
      {/* Top Headline & Quick Metrics */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b transition-colors ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <div>
          <h1
            className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            <span>ตารางรายงานยอดขายประจำปี</span>
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            คลิกที่เดือนเพื่อเปิดดูรายละเอียดเจาะลึกรายคน สัดส่วนสินค้า และอันดับยอดขาย
          </p>
        </div>

        {/* Quick YTD Filter Badge */}
        <div
          className={`flex items-center gap-2 self-start sm:self-auto rounded-full px-4 py-2 text-xs transition-colors ${
            isLight
              ? 'bg-white border border-slate-200 text-slate-700 shadow-sm'
              : 'bg-white/[0.04] border border-white/10 text-slate-300 backdrop-blur-xl shadow-lg'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="font-medium">เกณฑ์ YTD:</span>
          <select
            value={settings.ytdCutoffMonth}
            onChange={(e) => updateSettings({ ytdCutoffMonth: parseInt(e.target.value, 10) })}
            className={`bg-transparent font-semibold focus:outline-none cursor-pointer ${
              isLight ? 'text-cyan-700' : 'text-cyan-300'
            }`}
          >
            <option value={9} className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'}>
              ถึงเดือน 9 (SEP - ตามโจทย์)
            </option>
            <option value={10} className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'}>
              ถึงเดือน 10 (OCT - เดือนปัจจุบัน)
            </option>
            <option value={6} className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'}>
              ถึงเดือน 6 (JUN - สิ้น Q2)
            </option>
            <option value={12} className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'}>
              ถึงเดือน 12 (DEC - เต็มปี)
            </option>
          </select>
        </div>
      </div>

      {/* KPI Cards Strip */}
      {latestYearData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`p-5 rounded-3xl relative overflow-hidden transition-all duration-200 ${
              isLight
                ? 'bg-white border border-slate-200/90 shadow-sm'
                : 'liquid-glass liquid-glass-interactive specular-rim'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                ยอดขายสะสม YTD ({latestYearData.year})
              </span>
              <div
                className={`p-1.5 rounded-xl ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                    : 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/20'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {formatCurrency(latestYearData.ytdTotal, true)}
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs">
              {latestYearData.ytdGrowthYoY !== null && (
                <span
                  className={`flex items-center font-semibold font-mono px-2 py-0.5 rounded-full text-[11px] ${
                    latestYearData.ytdGrowthYoY >= 0
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : isLight
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {latestYearData.ytdGrowthYoY >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1 inline" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1 inline" />
                  )}
                  {formatPercent(latestYearData.ytdGrowthYoY)}
                </span>
              )}
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>เทียบปีที่แล้ว (YoY)</span>
            </div>
          </div>

          <div
            className={`p-5 rounded-3xl relative overflow-hidden transition-all duration-200 ${
              isLight
                ? 'bg-white border border-slate-200/90 shadow-sm'
                : 'liquid-glass liquid-glass-interactive specular-rim'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                ยอดขาย MTO สะสม YTD
              </span>
              <div
                className={`p-1.5 rounded-xl ${
                  isLight
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-blue-500/15 text-blue-300 border border-blue-400/20'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${
                isLight ? 'text-cyan-800' : 'text-cyan-300'
              }`}
            >
              {formatCurrency(latestYearData.ytdMTO, true)}
            </div>
            <div className={`text-xs mt-2.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              สัดส่วน{' '}
              <strong className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {latestYearData.ytdTotal > 0
                  ? ((latestYearData.ytdMTO / latestYearData.ytdTotal) * 100).toFixed(1)
                  : 0}
                %
              </strong>{' '}
              ของยอดขายทั้งหมด
            </div>
          </div>

          <div
            className={`p-5 rounded-3xl relative overflow-hidden transition-all duration-200 ${
              isLight
                ? 'bg-white border border-slate-200/90 shadow-sm'
                : 'liquid-glass liquid-glass-interactive specular-rim'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                จำนวนออเดอร์สะสม YTD
              </span>
              <div
                className={`p-1.5 rounded-xl ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${
                isLight ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              {formatNumber(latestYearData.ytdOrders)} ออเดอร์
            </div>
            <div className={`text-xs mt-2.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              คำนวณสะสม ม.ค. - {cutoffMonthName}
            </div>
          </div>

          <div
            className={`p-5 rounded-3xl relative overflow-hidden transition-all duration-200 ${
              isLight
                ? 'bg-white border border-slate-200/90 shadow-sm'
                : 'liquid-glass liquid-glass-interactive specular-rim'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                ยอดเฉลี่ยต่อออเดอร์ (เฉพาะ MTO)
              </span>
              <div
                className={`p-1.5 rounded-xl ${
                  isLight
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-400/20'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${
                isLight ? 'text-amber-800' : 'text-amber-400'
              }`}
            >
              {formatCurrency(latestYearData.ytdAvgTicket, true)}
            </div>
            <div className={`text-xs mt-2.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              คำนวณจากยอด MTO ÷ จำนวนออเดอร์
            </div>
          </div>
        </div>
      )}

      {/* Main Tables for Each Year (Sorted Newest to Oldest) */}
      <div className="space-y-6">
        {yearlyOverviewData.map((yData) => {
          const isExpanded = !!expandedYears[yData.year];
          const hasYoYData = Object.values(yData.growthYoY).some((v) => v !== null);
          const hasFabricData =
            (yData.annualFabric && yData.annualFabric > 0) ||
            Object.values(yData.fabric).some((v) => (v || 0) > 0);
          const hasBeddingData =
            (yData.annualBedding && yData.annualBedding > 0) ||
            Object.values(yData.bedding).some((v) => (v || 0) > 0);

          return (
            <div
              key={yData.year}
              className={`rounded-3xl overflow-hidden transition-all duration-200 ${
                isLight
                  ? 'bg-white border border-slate-200 shadow-sm'
                  : 'liquid-glass specular-rim shadow-2xl'
              }`}
            >
              {/* Year Accordion Bar */}
              <div
                onClick={() => toggleYear(yData.year)}
                className={`px-5 sm:px-6 py-4 flex items-center justify-between cursor-pointer transition-colors border-b select-none ${
                  isLight
                    ? 'bg-slate-50/90 hover:bg-slate-100/90 border-slate-200 text-slate-800'
                    : 'bg-[#040c1e] hover:bg-white/[0.03] border-white/10 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={`p-1.5 rounded-xl transition-all ${
                      isLight
                        ? 'bg-white border border-slate-200 text-slate-600 shadow-xs'
                        : 'bg-white/[0.06] border border-white/10 text-slate-300'
                    }`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      รายงานยอดขายปี {yData.year}
                    </span>
                    <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      ({yData.year + 543} BE)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className={isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}>
                      ยอดรวมทั้งปี:
                    </span>
                    <span className={`font-mono font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {formatCurrency(yData.annualTotal, true)}
                    </span>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <span className={isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}>
                      YTD (ถึง {cutoffMonthName}):
                    </span>
                    <span className={`font-mono font-bold text-sm ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
                      {formatCurrency(yData.ytdTotal, true)}
                    </span>
                  </div>
                  {yData.annualGrowthYoY !== null && (
                    <span
                      className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                        yData.annualGrowthYoY >= 0
                          ? isLight
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : isLight
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      YoY: {formatPercent(yData.annualGrowthYoY)}
                    </span>
                  )}
                </div>
              </div>

              {/* Table Body */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                    {/* Header Columns */}
                    <thead>
                      <tr
                        className={`uppercase text-[11px] font-semibold border-b ${
                          isLight
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-[#050e1f] text-slate-300 border-slate-700/60'
                        }`}
                      >
                        <th
                          className={`sticky left-0 z-20 px-4 py-3 min-w-[210px] border-r ${
                            isLight
                              ? 'bg-slate-100 text-slate-900 border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]'
                              : 'bg-[#071328] text-white border-slate-700/60 shadow-[2px_0_5px_rgba(0,0,0,0.3)]'
                          }`}
                        >
                          Category
                        </th>

                        {/* Months 1 - 12 (JAN - DEC) */}
                        {MONTH_NAMES.map((mName, idx) => {
                          const mNum = idx + 1;
                          const isYtdIncluded = mNum <= cutoff;
                          const enShort = MONTH_SHORT_EN[mName];
                          return (
                            <th
                              key={mName}
                              onClick={() =>
                                setSelectedMonthDetail({
                                  year: yData.year,
                                  monthNum: mNum,
                                  monthName: mName,
                                })
                              }
                              title={`คลิกเพื่อดูรายละเอียดเดือน ${mName}`}
                              className={`px-3 py-3 text-right cursor-pointer transition-colors group ${
                                isLight
                                  ? isYtdIncluded
                                    ? 'bg-cyan-50/70 hover:bg-cyan-100/70 text-slate-800'
                                    : 'hover:bg-slate-200/60 text-slate-700'
                                  : isYtdIncluded
                                  ? 'bg-cyan-950/20 hover:bg-cyan-500/15 text-slate-300'
                                  : 'hover:bg-cyan-500/15 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-end gap-1 group-hover:text-cyan-700 dark:group-hover:text-cyan-300">
                                <span className="font-bold">{enShort}</span>
                                <span
                                  className={`text-[10px] font-mono ${
                                    isLight ? 'text-slate-500' : 'text-slate-500'
                                  }`}
                                >
                                  ({mNum})
                                </span>
                              </div>
                            </th>
                          );
                        })}

                        {/* Summary Columns */}
                        <th
                          className={`px-4 py-3 text-right font-bold border-l ${
                            isLight
                              ? 'bg-cyan-50 text-cyan-900 border-slate-200'
                              : 'bg-[#0a1836] text-cyan-200 border-slate-700/60'
                          }`}
                        >
                          ยอดขายรวมทั้งหมด
                        </th>
                        <th
                          className={`px-4 py-3 text-right font-bold border-l ${
                            isLight
                              ? 'bg-sky-50 text-sky-900 border-slate-200'
                              : 'bg-[#0d214a] text-cyan-100 border-slate-700/60'
                          }`}
                        >
                          ยอดขายรวมถึงปัจจุบัน
                          <span
                            className={`block text-[9px] font-normal ${
                              isLight ? 'text-sky-700' : 'text-cyan-300'
                            }`}
                          >
                            (YTD: ม.ค. - {cutoffMonthName})
                          </span>
                        </th>
                        <th
                          className={`px-3.5 py-3 text-right border-l ${
                            isLight
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-slate-900 text-slate-300 border-slate-700/60'
                          }`}
                        >
                          Q1
                        </th>
                        <th
                          className={`px-3.5 py-3 text-right ${
                            isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-slate-300'
                          }`}
                        >
                          Q2
                        </th>
                        <th
                          className={`px-3.5 py-3 text-right ${
                            isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-slate-300'
                          }`}
                        >
                          Q3
                        </th>
                        <th
                          className={`px-3.5 py-3 text-right ${
                            isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-slate-300'
                          }`}
                        >
                          Q4
                        </th>
                      </tr>
                    </thead>

                    <tbody
                      className={`divide-y font-mono tabular-nums ${
                        isLight ? 'divide-slate-200 text-slate-800' : 'divide-slate-800 text-slate-200'
                      }`}
                    >
                      {/* Row 1: ยอดขายทั้งหมด (Bold) */}
                      <tr
                        className={`transition-colors font-bold group ${
                          isLight
                            ? 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-900'
                            : 'bg-slate-950/20 hover:bg-slate-800/40 text-white'
                        }`}
                      >
                        <td
                          className={`sticky left-0 z-10 px-4 py-2.5 font-sans font-bold border-r transition-colors ${
                            isLight
                              ? 'bg-white group-hover:bg-slate-100/90 text-slate-900 border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]'
                              : 'bg-[#071328] group-hover:bg-[#0c1a36] text-white border-slate-700/60 shadow-[2px_0_5px_rgba(0,0,0,0.3)]'
                          }`}
                        >
                          ยอดขายทั้งหมด
                        </td>
                        {MONTH_NAMES.map((_, idx) => {
                          const val = yData.total[idx + 1];
                          const hasValue = val > 0;
                          return (
                            <td
                              key={idx}
                              onClick={() =>
                                setSelectedMonthDetail({
                                  year: yData.year,
                                  monthNum: idx + 1,
                                  monthName: MONTH_NAMES[idx],
                                })
                              }
                              className={`px-3 py-2.5 text-right font-bold cursor-pointer transition-colors ${
                                isLight
                                  ? 'hover:bg-cyan-100/60 hover:text-cyan-800'
                                  : 'hover:bg-cyan-500/15 hover:text-cyan-300'
                              } ${!hasValue ? (isLight ? 'text-slate-400 font-normal' : 'text-slate-500 font-normal') : ''}`}
                            >
                              {hasValue ? formatCurrency(val) : '-'}
                            </td>
                          );
                        })}
                        <td
                          className={`px-4 py-2.5 text-right font-extrabold border-l transition-colors ${
                            isLight
                              ? 'bg-cyan-50 group-hover:bg-cyan-100/70 text-cyan-900 border-slate-200'
                              : 'bg-[#0a1836]/40 group-hover:bg-[#0f244e] text-white border-slate-700/60'
                          }`}
                        >
                          {yData.annualTotal > 0 ? formatCurrency(yData.annualTotal) : '-'}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-extrabold border-l transition-colors ${
                            isLight
                              ? 'bg-sky-50 group-hover:bg-sky-100/70 text-sky-900 border-slate-200'
                              : 'bg-[#0d214a]/40 group-hover:bg-[#132c5e] text-cyan-300 border-slate-700/60'
                          }`}
                        >
                          {yData.ytdTotal > 0 ? formatCurrency(yData.ytdTotal) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right font-bold border-l ${
                            isLight ? 'border-slate-200 text-slate-800' : 'border-slate-700/60 text-slate-300'
                          }`}
                        >
                          {yData.quarterTotal.Q1 > 0 ? formatCurrency(yData.quarterTotal.Q1) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right font-bold ${
                            isLight ? 'text-slate-800' : 'text-slate-300'
                          }`}
                        >
                          {yData.quarterTotal.Q2 > 0 ? formatCurrency(yData.quarterTotal.Q2) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right font-bold ${
                            isLight ? 'text-slate-800' : 'text-slate-300'
                          }`}
                        >
                          {yData.quarterTotal.Q3 > 0 ? formatCurrency(yData.quarterTotal.Q3) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right font-bold ${
                            isLight ? 'text-slate-800' : 'text-slate-300'
                          }`}
                        >
                          {yData.quarterTotal.Q4 > 0 ? formatCurrency(yData.quarterTotal.Q4) : '-'}
                        </td>
                      </tr>

                      {/* Row 2: ยอดขาย MTO */}
                      <tr
                        className={`transition-colors group ${
                          isLight
                            ? 'hover:bg-slate-100/70 text-slate-800'
                            : 'hover:bg-slate-800/40 text-slate-200'
                        }`}
                      >
                        <td
                          className={`sticky left-0 z-10 px-4 py-2.5 font-sans font-medium pl-6 border-r transition-colors ${
                            isLight
                              ? 'bg-white group-hover:bg-slate-100/90 text-slate-700 border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]'
                              : 'bg-[#071328] group-hover:bg-[#0c1a36] text-slate-300 border-slate-700/60 shadow-[2px_0_5px_rgba(0,0,0,0.3)]'
                          }`}
                        >
                          • ยอดขาย MTO
                        </td>
                        {MONTH_NAMES.map((_, idx) => {
                          const val = yData.mto[idx + 1];
                          const hasValue = val > 0;
                          return (
                            <td
                              key={idx}
                              onClick={() =>
                                setSelectedMonthDetail({
                                  year: yData.year,
                                  monthNum: idx + 1,
                                  monthName: MONTH_NAMES[idx],
                                })
                              }
                              className={`px-3 py-2.5 text-right cursor-pointer transition-colors ${
                                isLight
                                  ? 'hover:bg-cyan-100/60 hover:text-cyan-800 text-slate-700'
                                  : 'hover:bg-cyan-500/15 hover:text-cyan-300 text-slate-300'
                              } ${!hasValue ? (isLight ? 'text-slate-400' : 'text-slate-500') : ''}`}
                            >
                              {hasValue ? formatCurrency(val) : '-'}
                            </td>
                          );
                        })}
                        <td
                          className={`px-4 py-2.5 text-right font-semibold border-l transition-colors ${
                            isLight
                              ? 'bg-cyan-50/50 group-hover:bg-cyan-100/60 text-cyan-900 border-slate-200'
                              : 'bg-[#0a1836]/30 group-hover:bg-[#0f244e] text-slate-200 border-slate-700/60'
                          }`}
                        >
                          {yData.annualMTO > 0 ? formatCurrency(yData.annualMTO) : '-'}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-semibold border-l transition-colors ${
                            isLight
                              ? 'bg-sky-50/50 group-hover:bg-sky-100/60 text-sky-900 border-slate-200'
                              : 'bg-[#0d214a]/30 group-hover:bg-[#132c5e] text-cyan-200 border-slate-700/60'
                          }`}
                        >
                          {yData.ytdMTO > 0 ? formatCurrency(yData.ytdMTO) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right border-l ${
                            isLight ? 'border-slate-200 text-slate-700' : 'border-slate-700/60 text-slate-300'
                          }`}
                        >
                          {yData.quarterMTO.Q1 > 0 ? formatCurrency(yData.quarterMTO.Q1) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right ${
                            isLight ? 'text-slate-700' : 'text-slate-300'
                          }`}
                        >
                          {yData.quarterMTO.Q2 > 0 ? formatCurrency(yData.quarterMTO.Q2) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right ${
                            isLight ? 'text-slate-700' : 'text-slate-300'
                          }`}
                        >
                          {yData.quarterMTO.Q3 > 0 ? formatCurrency(yData.quarterMTO.Q3) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right ${
                            isLight ? 'text-slate-700' : 'text-slate-300'
                          }`}
                        >
                          {yData.quarterMTO.Q4 > 0 ? formatCurrency(yData.quarterMTO.Q4) : '-'}
                        </td>
                      </tr>

                      {/* Row 3: ยอดขาย Fabric (ผ้า) - ซ่อนหากไม่มีข้อมูล */}
                      {hasFabricData && (
                        <tr
                          className={`transition-colors group ${
                            isLight
                              ? 'hover:bg-slate-100/70 text-slate-700'
                              : 'hover:bg-slate-800/40 text-slate-300'
                          }`}
                        >
                          <td
                            className={`sticky left-0 z-10 px-4 py-2.5 font-sans font-medium pl-6 border-r transition-colors ${
                              isLight
                                ? 'bg-white group-hover:bg-slate-100/90 text-slate-700 border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]'
                                : 'bg-[#071328] group-hover:bg-[#0c1a36] text-slate-300 border-slate-700/60 shadow-[2px_0_5px_rgba(0,0,0,0.3)]'
                            }`}
                          >
                            • ยอดขาย Fabric (ผ้า)
                          </td>
                          {MONTH_NAMES.map((_, idx) => {
                            const val = yData.fabric[idx + 1];
                            const hasValue = val > 0;
                            return (
                              <td
                                key={idx}
                                onClick={() =>
                                  setSelectedMonthDetail({
                                    year: yData.year,
                                    monthNum: idx + 1,
                                    monthName: MONTH_NAMES[idx],
                                  })
                                }
                                className={`px-3 py-2.5 text-right cursor-pointer transition-colors ${
                                  isLight
                                    ? 'hover:bg-cyan-100/60 hover:text-cyan-800 text-slate-600'
                                    : 'hover:bg-cyan-500/15 hover:text-cyan-300 text-slate-400'
                                } ${!hasValue ? (isLight ? 'text-slate-400' : 'text-slate-500') : ''}`}
                              >
                                {hasValue ? formatCurrency(val) : '-'}
                              </td>
                            );
                          })}
                          <td
                            className={`px-4 py-2.5 text-right border-l transition-colors ${
                              isLight
                                ? 'bg-cyan-50/30 group-hover:bg-cyan-100/50 text-slate-700 border-slate-200'
                                : 'bg-[#0a1836]/30 group-hover:bg-[#0f244e] text-slate-300 border-slate-700/60'
                            }`}
                          >
                            {yData.annualFabric > 0 ? formatCurrency(yData.annualFabric) : '-'}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right border-l transition-colors ${
                              isLight
                                ? 'bg-sky-50/30 group-hover:bg-sky-100/50 text-slate-700 border-slate-200'
                                : 'bg-[#0d214a]/30 group-hover:bg-[#132c5e] text-slate-300 border-slate-700/60'
                            }`}
                          >
                            {yData.ytdFabric > 0 ? formatCurrency(yData.ytdFabric) : '-'}
                          </td>
                          <td
                            className={`px-3.5 py-2.5 text-right border-l ${
                              isLight ? 'border-slate-200 text-slate-600' : 'border-slate-700/60 text-slate-400'
                            }`}
                          >
                            {yData.quarterFabric.Q1 > 0 ? formatCurrency(yData.quarterFabric.Q1) : '-'}
                          </td>
                          <td
                            className={`px-3.5 py-2.5 text-right ${
                              isLight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            {yData.quarterFabric.Q2 > 0 ? formatCurrency(yData.quarterFabric.Q2) : '-'}
                          </td>
                          <td
                            className={`px-3.5 py-2.5 text-right ${
                              isLight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            {yData.quarterFabric.Q3 > 0 ? formatCurrency(yData.quarterFabric.Q3) : '-'}
                          </td>
                          <td
                            className={`px-3.5 py-2.5 text-right ${
                              isLight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            {yData.quarterFabric.Q4 > 0 ? formatCurrency(yData.quarterFabric.Q4) : '-'}
                          </td>
                        </tr>
                      )}

                      {/* Row 4: ยอดขาย Bedding (ผ้าปูที่นอน) - ซ่อนหากไม่มีข้อมูล */}
                      {hasBeddingData && (
                        <tr
                          className={`transition-colors group ${
                            isLight
                              ? 'hover:bg-slate-100/70 text-slate-700'
                              : 'hover:bg-slate-800/40 text-slate-300'
                          }`}
                        >
                          <td
                            className={`sticky left-0 z-10 px-4 py-2.5 font-sans font-medium pl-6 border-r transition-colors ${
                              isLight
                                ? 'bg-white group-hover:bg-slate-100/90 text-slate-700 border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]'
                                : 'bg-[#071328] group-hover:bg-[#0c1a36] text-slate-300 border-slate-700/60 shadow-[2px_0_5px_rgba(0,0,0,0.3)]'
                            }`}
                          >
                            • ยอดขาย Bedding (ผ้าปูที่นอน)
                          </td>
                          {MONTH_NAMES.map((_, idx) => {
                            const val = yData.bedding[idx + 1];
                            const hasValue = val > 0;
                            return (
                              <td
                                key={idx}
                                onClick={() =>
                                  setSelectedMonthDetail({
                                    year: yData.year,
                                    monthNum: idx + 1,
                                    monthName: MONTH_NAMES[idx],
                                  })
                                }
                                className={`px-3 py-2.5 text-right cursor-pointer transition-colors ${
                                  isLight
                                    ? 'hover:bg-cyan-100/60 hover:text-cyan-800 text-slate-600'
                                    : 'hover:bg-cyan-500/15 hover:text-cyan-300 text-slate-400'
                                } ${!hasValue ? (isLight ? 'text-slate-400' : 'text-slate-500') : ''}`}
                              >
                                {hasValue ? formatCurrency(val) : '-'}
                              </td>
                            );
                          })}
                          <td
                            className={`px-4 py-2.5 text-right border-l transition-colors ${
                              isLight
                                ? 'bg-cyan-50/30 group-hover:bg-cyan-100/50 text-slate-700 border-slate-200'
                                : 'bg-[#0a1836]/30 group-hover:bg-[#0f244e] text-slate-300 border-slate-700/60'
                            }`}
                          >
                            {yData.annualBedding > 0 ? formatCurrency(yData.annualBedding) : '-'}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right border-l transition-colors ${
                              isLight
                                ? 'bg-sky-50/30 group-hover:bg-sky-100/50 text-slate-700 border-slate-200'
                                : 'bg-[#0d214a]/30 group-hover:bg-[#132c5e] text-slate-300 border-slate-700/60'
                            }`}
                          >
                            {yData.ytdBedding > 0 ? formatCurrency(yData.ytdBedding) : '-'}
                          </td>
                          <td
                            className={`px-3.5 py-2.5 text-right border-l ${
                              isLight ? 'border-slate-200 text-slate-600' : 'border-slate-700/60 text-slate-400'
                            }`}
                          >
                            {yData.quarterBedding.Q1 > 0 ? formatCurrency(yData.quarterBedding.Q1) : '-'}
                          </td>
                          <td
                            className={`px-3.5 py-2.5 text-right ${
                              isLight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            {yData.quarterBedding.Q2 > 0 ? formatCurrency(yData.quarterBedding.Q2) : '-'}
                          </td>
                          <td
                            className={`px-3.5 py-2.5 text-right ${
                              isLight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            {yData.quarterBedding.Q3 > 0 ? formatCurrency(yData.quarterBedding.Q3) : '-'}
                          </td>
                          <td
                            className={`px-3.5 py-2.5 text-right ${
                              isLight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            {yData.quarterBedding.Q4 > 0 ? formatCurrency(yData.quarterBedding.Q4) : '-'}
                          </td>
                        </tr>
                      )}

                      {/* Row 5: จำนวนออเดอร์ */}
                      <tr
                        className={`transition-colors group ${
                          isLight
                            ? 'hover:bg-slate-100/70 text-emerald-800'
                            : 'hover:bg-slate-800/40 text-emerald-300'
                        }`}
                      >
                        <td
                          className={`sticky left-0 z-10 px-4 py-2.5 font-sans font-medium border-r transition-colors ${
                            isLight
                              ? 'bg-white group-hover:bg-slate-100/90 text-emerald-800 border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]'
                              : 'bg-[#071328] group-hover:bg-[#0c1a36] text-emerald-400 border-slate-700/60 shadow-[2px_0_5px_rgba(0,0,0,0.3)]'
                          }`}
                        >
                          จำนวนออเดอร์
                        </td>
                        {MONTH_NAMES.map((_, idx) => {
                          const val = yData.orders[idx + 1];
                          const hasValue = val > 0;
                          return (
                            <td
                              key={idx}
                              onClick={() =>
                                setSelectedMonthDetail({
                                  year: yData.year,
                                  monthNum: idx + 1,
                                  monthName: MONTH_NAMES[idx],
                                })
                              }
                              className={`px-3 py-2.5 text-right cursor-pointer transition-colors ${
                                isLight
                                  ? 'hover:bg-emerald-100/60 hover:text-emerald-950 text-emerald-700'
                                  : 'hover:bg-emerald-500/20 hover:text-white text-emerald-300'
                              } ${!hasValue ? (isLight ? 'text-slate-400' : 'text-slate-500') : ''}`}
                            >
                              {hasValue ? formatNumber(val) : '-'}
                            </td>
                          );
                        })}
                        <td
                          className={`px-4 py-2.5 text-right font-semibold border-l transition-colors ${
                            isLight
                              ? 'bg-emerald-50/50 group-hover:bg-emerald-100/60 text-emerald-800 border-slate-200'
                              : 'bg-[#0a1836]/30 group-hover:bg-[#0f244e] text-emerald-300 border-slate-700/60'
                          }`}
                        >
                          {yData.annualOrders > 0 ? formatNumber(yData.annualOrders) : '-'}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-semibold border-l transition-colors ${
                            isLight
                              ? 'bg-emerald-50/50 group-hover:bg-emerald-100/60 text-emerald-800 border-slate-200'
                              : 'bg-[#0d214a]/30 group-hover:bg-[#132c5e] text-emerald-300 border-slate-700/60'
                          }`}
                        >
                          {yData.ytdOrders > 0 ? formatNumber(yData.ytdOrders) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right border-l ${
                            isLight
                              ? 'border-slate-200 text-emerald-800'
                              : 'border-slate-700/60 text-emerald-300'
                          }`}
                        >
                          {yData.quarterOrders.Q1 > 0 ? formatNumber(yData.quarterOrders.Q1) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right ${
                            isLight ? 'text-emerald-800' : 'text-emerald-300'
                          }`}
                        >
                          {yData.quarterOrders.Q2 > 0 ? formatNumber(yData.quarterOrders.Q2) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right ${
                            isLight ? 'text-emerald-800' : 'text-emerald-300'
                          }`}
                        >
                          {yData.quarterOrders.Q3 > 0 ? formatNumber(yData.quarterOrders.Q3) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right ${
                            isLight ? 'text-emerald-800' : 'text-emerald-300'
                          }`}
                        >
                          {yData.quarterOrders.Q4 > 0 ? formatNumber(yData.quarterOrders.Q4) : '-'}
                        </td>
                      </tr>

                      {/* Row 6: ยอดเฉลี่ยต่อออเดอร์ (เฉพาะ MTO) */}
                      <tr
                        className={`transition-colors group ${
                          isLight
                            ? 'hover:bg-slate-100/70 text-amber-800'
                            : 'hover:bg-slate-800/40 text-amber-300'
                        }`}
                      >
                        <td
                          className={`sticky left-0 z-10 px-4 py-2.5 font-sans font-medium border-r transition-colors ${
                            isLight
                              ? 'bg-white group-hover:bg-slate-100/90 text-amber-800 border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]'
                              : 'bg-[#071328] group-hover:bg-[#0c1a36] text-amber-300 border-slate-700/60 shadow-[2px_0_5px_rgba(0,0,0,0.3)]'
                          }`}
                        >
                          ยอดเฉลี่ยต่อออเดอร์ (เฉพาะ MTO)
                        </td>
                        {MONTH_NAMES.map((_, idx) => {
                          const val = yData.avgTicket[idx + 1];
                          const hasValue = val > 0 && yData.orders[idx + 1] > 0;
                          return (
                            <td
                              key={idx}
                              onClick={() =>
                                setSelectedMonthDetail({
                                  year: yData.year,
                                  monthNum: idx + 1,
                                  monthName: MONTH_NAMES[idx],
                                })
                              }
                              className={`px-3 py-2.5 text-right cursor-pointer transition-colors ${
                                isLight
                                  ? 'hover:bg-amber-100/60 hover:text-amber-950 text-amber-700'
                                  : 'hover:bg-amber-500/20 hover:text-white text-amber-300'
                              } ${!hasValue ? (isLight ? 'text-slate-400' : 'text-slate-500') : ''}`}
                            >
                              {hasValue ? formatCurrency(val) : '-'}
                            </td>
                          );
                        })}
                        <td
                          className={`px-4 py-2.5 text-right font-semibold border-l transition-colors ${
                            isLight
                              ? 'bg-amber-50/50 group-hover:bg-amber-100/60 text-amber-900 border-slate-200'
                              : 'bg-[#0a1836]/30 group-hover:bg-[#0f244e] text-amber-300 border-slate-700/60'
                          }`}
                        >
                          {yData.annualAvgTicket > 0 ? formatCurrency(yData.annualAvgTicket) : '-'}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-semibold border-l transition-colors ${
                            isLight
                              ? 'bg-amber-50/50 group-hover:bg-amber-100/60 text-amber-900 border-slate-200'
                              : 'bg-[#0d214a]/30 group-hover:bg-[#132c5e] text-amber-300 border-slate-700/60'
                          }`}
                        >
                          {yData.ytdAvgTicket > 0 ? formatCurrency(yData.ytdAvgTicket) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right border-l ${
                            isLight ? 'border-slate-200 text-amber-800' : 'border-slate-700/60 text-amber-300'
                          }`}
                        >
                          {yData.quarterAvgTicket.Q1 > 0 ? formatCurrency(yData.quarterAvgTicket.Q1) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right ${
                            isLight ? 'text-amber-800' : 'text-amber-300'
                          }`}
                        >
                          {yData.quarterAvgTicket.Q2 > 0 ? formatCurrency(yData.quarterAvgTicket.Q2) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right ${
                            isLight ? 'text-amber-800' : 'text-amber-300'
                          }`}
                        >
                          {yData.quarterAvgTicket.Q3 > 0 ? formatCurrency(yData.quarterAvgTicket.Q3) : '-'}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right ${
                            isLight ? 'text-amber-800' : 'text-amber-300'
                          }`}
                        >
                          {yData.quarterAvgTicket.Q4 > 0 ? formatCurrency(yData.quarterAvgTicket.Q4) : '-'}
                        </td>
                      </tr>

                      {/* Row 7: Growth YoY% (Only render if there is prior year data) */}
                      {hasYoYData && (
                        <tr
                          className={`transition-colors font-semibold group ${
                            isLight ? 'bg-slate-50/80 hover:bg-slate-100/90' : 'bg-slate-900/60 hover:bg-slate-800/40'
                          }`}
                        >
                          <td
                            className={`sticky left-0 z-10 px-4 py-2.5 font-sans font-medium border-r transition-colors ${
                              isLight
                                ? 'bg-white group-hover:bg-slate-100/90 text-purple-800 border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]'
                                : 'bg-[#071328] group-hover:bg-[#0c1a36] text-purple-300 border-slate-700/60 shadow-[2px_0_5px_rgba(0,0,0,0.3)]'
                            }`}
                          >
                            Growth YoY % (เทียบปี {yData.year - 1})
                          </td>
                          {MONTH_NAMES.map((_, idx) => {
                            const val = yData.growthYoY[idx + 1];
                            const hasGrowth = val !== null;
                            const isPos = val !== null && val >= 0;
                            return (
                              <td
                                key={idx}
                                onClick={() =>
                                  setSelectedMonthDetail({
                                    year: yData.year,
                                    monthNum: idx + 1,
                                    monthName: MONTH_NAMES[idx],
                                  })
                                }
                                className={`px-3 py-2.5 text-right cursor-pointer transition-colors ${
                                  !hasGrowth
                                    ? isLight
                                      ? 'text-slate-400'
                                      : 'text-slate-500'
                                    : isPos
                                    ? isLight
                                      ? 'text-emerald-700 font-bold hover:bg-emerald-100/60'
                                      : 'text-emerald-400 hover:bg-emerald-500/20'
                                    : isLight
                                    ? 'text-rose-700 font-bold hover:bg-rose-100/60'
                                    : 'text-rose-400 hover:bg-rose-500/20'
                                }`}
                              >
                                {hasGrowth ? formatPercent(val) : ''}
                              </td>
                            );
                          })}
                          <td
                            className={`px-4 py-2.5 text-right font-bold border-l ${
                              isLight
                                ? 'bg-cyan-50/60 border-slate-200'
                                : 'bg-[#0a1836]/40 border-slate-700/60'
                            } ${
                              yData.annualGrowthYoY === null
                                ? isLight
                                  ? 'text-slate-400'
                                  : 'text-slate-500'
                                : yData.annualGrowthYoY >= 0
                                ? isLight
                                  ? 'text-emerald-700'
                                  : 'text-emerald-400'
                                : isLight
                                ? 'text-rose-700'
                                : 'text-rose-400'
                            }`}
                          >
                            {yData.annualGrowthYoY !== null ? formatPercent(yData.annualGrowthYoY) : ''}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right font-bold border-l ${
                              isLight
                                ? 'bg-sky-50/60 border-slate-200'
                                : 'bg-[#0d214a]/40 border-slate-700/60'
                            } ${
                              yData.ytdGrowthYoY === null
                                ? isLight
                                  ? 'text-slate-400'
                                  : 'text-slate-500'
                                : yData.ytdGrowthYoY >= 0
                                ? isLight
                                  ? 'text-emerald-700'
                                  : 'text-emerald-400'
                                : isLight
                                ? 'text-rose-700'
                                : 'text-rose-400'
                            }`}
                          >
                            {yData.ytdGrowthYoY !== null ? formatPercent(yData.ytdGrowthYoY) : ''}
                          </td>
                          <td
                            className={`px-3.5 py-2.5 text-right border-l ${
                              isLight ? 'border-slate-200 text-slate-700' : 'border-slate-700/60 text-slate-300'
                            }`}
                          >
                            {yData.quarterGrowthYoY.Q1 !== null ? formatPercent(yData.quarterGrowthYoY.Q1) : ''}
                          </td>
                          <td
                            className={`px-3.5 py-2.5 text-right ${
                              isLight ? 'text-slate-700' : 'text-slate-300'
                            }`}
                          >
                            {yData.quarterGrowthYoY.Q2 !== null ? formatPercent(yData.quarterGrowthYoY.Q2) : ''}
                          </td>
                          <td
                            className={`px-3.5 py-2.5 text-right ${
                              isLight ? 'text-slate-700' : 'text-slate-300'
                            }`}
                          >
                            {yData.quarterGrowthYoY.Q3 !== null ? formatPercent(yData.quarterGrowthYoY.Q3) : ''}
                          </td>
                          <td
                            className={`px-3.5 py-2.5 text-right ${
                              isLight ? 'text-slate-700' : 'text-slate-300'
                            }`}
                          >
                            {yData.quarterGrowthYoY.Q4 !== null ? formatPercent(yData.quarterGrowthYoY.Q4) : ''}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
