import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  User,
  ArrowUpDown,
  Calendar,
  Layers,
  ChevronDown,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { MONTH_NAMES, MONTH_SHORT_TH } from '../../data/salesDataService';

export const SalesPerformanceView: React.FC = () => {
  const { records, salesReps, uniqueYears, settings } = useSales();
  const isLight = settings.themeMode === 'light';

  // Sort option for Area charts: 'code' (ลำดับรหัสพนักงาน) vs 'sales' (ยอดขายปีนั้นๆ มากที่สุด)
  const [repSortBy, setRepSortBy] = useState<'code' | 'sales'>('code');
  const [selectedChartYear, setSelectedChartYear] = useState<number>(
    uniqueYears.length > 0 ? uniqueYears[0] : 2026
  );

  // Map each rep to their employee code
  const repCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    salesReps.forEach((r) => {
      map.set(r.name.trim(), r.code.trim());
    });
    return map;
  }, [salesReps]);

  // Clean list of unique individual sales reps sorted by employee code fromน้อยไปมาก
  const sortedRepsByCode = useMemo(() => {
    // Unique reps from records or configured
    const repNames = Array.from(
      new Set(
        records
          .map((r) => r.salesPerson.trim())
          .filter((name) => name && name !== 'รวมทั้งหมด')
      )
    );

    return repNames.sort((a, b) => {
      const codeA = repCodeMap.get(a) || 'Z99999';
      const codeB = repCodeMap.get(b) || 'Z99999';
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    });
  }, [records, repCodeMap]);

  // 1. Group records by Year (1 ตาราง 1 ปี ปีใหม่สุดอยู่ด้านบนเสมอ)
  // Each table displays months 1-12 and total per rep, sorted by code from least to most
  const yearlyPerformanceTables = useMemo(() => {
    // Sort years descending
    const sortedYears = [...uniqueYears].sort((a, b) => b - a);

    return sortedYears.map((yr) => {
      const yearRecords = records.filter((r) => r.year === yr && r.salesPerson !== 'รวมทั้งหมด');

      // Build matrix for each rep
      const repRows = sortedRepsByCode.map((repName) => {
        const empCode = repCodeMap.get(repName) || '-';
        const repYearRecords = yearRecords.filter((r) => r.salesPerson === repName);
        const monthlySales = Array.from({ length: 12 }, (_, i) => {
          const mRec = repYearRecords.find((r) => r.monthNum === i + 1);
          return mRec?.salesTotal || 0;
        });
        const total = monthlySales.reduce((a, b) => a + b, 0);

        return {
          repName,
          empCode,
          monthlySales,
          total,
        };
      });

      // Filter out reps who have 0 total in this year if desired, or keep all who worked
      const activeRepRows = repRows.filter((r) => r.total > 0 || r.empCode !== '-');

      // Month columns total
      const monthTotals = Array.from({ length: 12 }, (_, i) => {
        return activeRepRows.reduce((sum, r) => sum + r.monthlySales[i], 0);
      });
      const grandTotal = monthTotals.reduce((a, b) => a + b, 0);

      return {
        year: yr,
        repRows: activeRepRows,
        monthTotals,
        grandTotal,
      };
    });
  }, [records, uniqueYears, sortedRepsByCode, repCodeMap]);

  // 2. Data for Area Charts (1 กราฟ 1 คน เปรียบเทียบขายแต่ละปีในแต่ละเดือน)
  // Can be sorted by code or by highest sales in selected year
  const chartRepsList = useMemo(() => {
    const list = sortedRepsByCode.map((repName) => {
      const empCode = repCodeMap.get(repName) || '-';
      // Calculate sales in selected year
      const recsInSelectedYear = records.filter(
        (r) => r.salesPerson === repName && r.year === selectedChartYear
      );
      const salesInSelectedYear = recsInSelectedYear.reduce((s, r) => s + (r.salesTotal || 0), 0);

      // Multi-year data per month
      const yearsData = uniqueYears.map((yr) => {
        const yrRecs = records.filter((r) => r.salesPerson === repName && r.year === yr);
        const monthly = Array.from({ length: 12 }, (_, i) => {
          const mRec = yrRecs.find((r) => r.monthNum === i + 1);
          return mRec?.salesTotal || 0;
        });
        const yrTotal = monthly.reduce((a, b) => a + b, 0);
        return {
          year: yr,
          monthly,
          total: yrTotal,
        };
      });

      return {
        repName,
        empCode,
        salesInSelectedYear,
        yearsData,
      };
    });

    if (repSortBy === 'sales') {
      return list.sort((a, b) => b.salesInSelectedYear - a.salesInSelectedYear);
    }
    return list; // already sorted by code
  }, [sortedRepsByCode, repCodeMap, records, selectedChartYear, uniqueYears, repSortBy]);

  // Helper for generating SVG Area path
  const generateAreaSvgPath = (
    data: number[],
    maxVal: number,
    width = 300,
    height = 90
  ): { linePath: string; areaPath: string } => {
    if (data.length === 0 || maxVal <= 0) {
      return { linePath: '', areaPath: '' };
    }
    const stepX = width / (data.length - 1);
    const points = data.map((val, idx) => {
      const x = idx * stepX;
      const y = height - (val / maxVal) * (height - 12);
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

    return { linePath, areaPath };
  };

  const YEAR_COLORS: Record<number, { stroke: string; fill: string; badge: string }> = {
    2026: { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.25)', badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
    2025: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.20)', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    2024: { stroke: '#a855f7', fill: 'rgba(168, 85, 247, 0.18)', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    2023: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.18)', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition-all ${
          isLight
            ? 'bg-white/90 border-slate-200 shadow-lg'
            : 'liquid-glass-card border-white/10 shadow-2xl'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                isLight
                  ? 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30'
              }`}
            >
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Sales Performance (ผลการดำเนินงานทีมขาย)
              </h1>
              <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                ตารางยอดขายจริงรายคนรายเดือน (เรียงตามรหัสพนักงาน) &amp; กราฟ Area เปรียบเทียบยอดขายแต่ละปี
              </p>
            </div>
          </div>

          {/* Sorter & Selector for Area Charts */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>เรียงลำดับกราฟ:</span>
              <div className="flex items-center p-1 rounded-xl bg-black/20 border border-white/10">
                <button
                  type="button"
                  onClick={() => setRepSortBy('code')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    repSortBy === 'code'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  รหัสพนักงาน (น้อยไปมาก)
                </button>
                <button
                  type="button"
                  onClick={() => setRepSortBy('sales')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    repSortBy === 'sales'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ยอดขายปีสูงสุด
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>ปีอ้างอิง:</span>
              <select
                value={selectedChartYear}
                onChange={(e) => setSelectedChartYear(parseInt(e.target.value, 10))}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800'
                    : 'bg-white/5 border-white/10 text-white'
                }`}
              >
                {uniqueYears.map((yr) => (
                  <option key={yr} value={yr}>
                    ปี {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Yearly Performance Tables (1 ตาราง 1 ปี ปีใหม่สุดอยู่ด้านบนเสมอ เรียงตามรหัสพนักงาน) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-black tracking-tight">
            1. ตารางยอดขายจริงรายเดือนแยกตามพนักงาน (1 ตาราง 1 ปี ปีใหม่สุดอยู่ด้านบน)
          </h2>
        </div>

        {yearlyPerformanceTables.map((yTable) => (
          <div
            key={yTable.year}
            className={`p-5 sm:p-6 rounded-3xl border transition-all ${
              isLight
                ? 'bg-white/90 border-slate-200 shadow-xl'
                : 'liquid-glass-card border-white/10 shadow-2xl'
            }`}
          >
            {/* Table Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl text-sm font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono">
                  ปี {yTable.year} (พ.ศ. {yTable.year + 543})
                </span>
                <span className="text-xs text-slate-400">
                  พนักงานขาย {yTable.repRows.length} คน | ยอดรวมทั้งปี:{' '}
                  <strong className="text-cyan-400 font-mono">{formatCurrency(yTable.grandTotal)}</strong>
                </span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto mt-4 rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b font-bold ${
                      isLight
                        ? 'bg-slate-100 text-slate-800 border-slate-200'
                        : 'bg-white/10 text-slate-200 border-white/10'
                    }`}
                  >
                    <th className="py-3 px-3 sticky left-0 z-10 bg-inherit font-mono w-24">
                      รหัส
                    </th>
                    <th className="py-3 px-4 sticky left-24 z-10 bg-inherit min-w-[180px]">
                      ชื่อพนักงานขาย
                    </th>
                    {MONTH_NAMES.map((m, idx) => (
                      <th key={m} className="py-3 px-2 text-right whitespace-nowrap min-w-[75px]">
                        {MONTH_SHORT_TH[m]}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-right font-black text-cyan-400 min-w-[110px] bg-cyan-500/10">
                      รวมทั้งปี
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {yTable.repRows.map((row) => (
                    <tr key={row.repName} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-2.5 px-3 sticky left-0 z-10 bg-inherit font-bold text-cyan-500 border-r border-white/5">
                        {row.empCode}
                      </td>
                      <td className="py-2.5 px-4 sticky left-24 z-10 bg-inherit font-sans font-bold border-r border-white/5 truncate max-w-[200px]">
                        {row.repName}
                      </td>
                      {row.monthlySales.map((val, idx) => (
                        <td
                          key={idx}
                          className={`py-2.5 px-2 text-right ${
                            val > 0
                              ? val >= 1000000
                                ? 'text-emerald-400 font-bold'
                                : 'text-slate-200 font-medium'
                              : 'text-slate-500 opacity-40'
                          }`}
                        >
                          {val > 0 ? formatNumber(val) : '-'}
                        </td>
                      ))}
                      <td className="py-2.5 px-4 text-right font-black text-cyan-400 bg-cyan-500/5 text-sm">
                        {formatCurrency(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr
                    className={`border-t font-black ${
                      isLight
                        ? 'bg-slate-200/70 text-slate-900 border-slate-300'
                        : 'bg-white/15 text-white border-white/20'
                    }`}
                  >
                    <td colSpan={2} className="py-3 px-4 sticky left-0 z-10 bg-inherit font-sans">
                      ยอดรวมแผนกรายเดือน (ปี {yTable.year})
                    </td>
                    {yTable.monthTotals.map((mTotal, idx) => (
                      <td key={idx} className="py-3 px-2 text-right font-mono">
                        {formatNumber(mTotal)}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-right font-mono text-cyan-400 text-sm bg-cyan-500/15">
                      {formatCurrency(yTable.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 2: Area Comparison Charts per Sales Rep (1 กราฟ 1 คน เปรียบเทียบขายแต่ละปีในแต่ละเดือน) */}
      <div className="space-y-6 pt-6 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-cyan-400" />
              2. กราฟ Area เปรียบเทียบยอดขายแต่ละปีในแต่ละเดือน (1 กราฟ ต่อ 1 พนักงานขาย)
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              เปรียบเทียบผลงานของพนักงานแต่ละคนข้ามปีแบบเจาะลึก (ม.ค. - ธ.ค.)
            </p>
          </div>

          {/* Year Legend */}
          <div className="flex items-center gap-3 text-xs font-bold">
            {uniqueYears.map((yr) => {
              const cfg = YEAR_COLORS[yr] || YEAR_COLORS[2026];
              return (
                <div key={yr} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.stroke }} />
                  <span>ปี {yr}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reps Grid of Area Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {chartRepsList.map((rep) => {
            // Find max monthly sale across all years for scaling
            const allVals = rep.yearsData.flatMap((y) => y.monthly);
            const maxVal = Math.max(...allVals, 500000);

            return (
              <div
                key={rep.repName}
                className={`p-5 rounded-3xl border flex flex-col justify-between transition-all hover:border-cyan-500/40 ${
                  isLight
                    ? 'bg-white/90 border-slate-200 shadow-md hover:shadow-lg'
                    : 'liquid-glass-card border-white/10 shadow-xl'
                }`}
              >
                {/* Rep Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                          {rep.empCode}
                        </span>
                        <h3 className="text-sm font-bold truncate max-w-[170px]" title={rep.repName}>
                          {rep.repName}
                        </h3>
                      </div>
                      <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        ยอดปี {selectedChartYear}:{' '}
                        <span className="font-bold font-mono text-cyan-400">
                          {formatCurrency(rep.salesInSelectedYear)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* SVG Area Chart */}
                  <div className="mt-4 pt-2 border-t border-white/5 relative">
                    <svg viewBox="0 0 300 90" className="w-full h-24 overflow-visible">
                      <defs>
                        {rep.yearsData.map((y) => {
                          const col = YEAR_COLORS[y.year] || YEAR_COLORS[2026];
                          return (
                            <linearGradient
                              key={y.year}
                              id={`area-grad-${rep.empCode}-${y.year}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor={col.stroke} stopOpacity="0.4" />
                              <stop offset="100%" stopColor={col.stroke} stopOpacity="0.0" />
                            </linearGradient>
                          );
                        })}
                      </defs>

                      {/* Zero horizontal axis line */}
                      <line x1="0" y1="90" x2="300" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                      {/* Area and Line for each Year */}
                      {rep.yearsData.map((y) => {
                        const col = YEAR_COLORS[y.year] || YEAR_COLORS[2026];
                        const { linePath, areaPath } = generateAreaSvgPath(y.monthly, maxVal, 300, 90);
                        if (!linePath) return null;

                        return (
                          <g key={y.year}>
                            <path
                              d={areaPath}
                              fill={`url(#area-grad-${rep.empCode}-${y.year})`}
                            />
                            <path
                              d={linePath}
                              fill="none"
                              stroke={col.stroke}
                              strokeWidth={y.year === selectedChartYear ? 2.5 : 1.5}
                              strokeDasharray={y.year === selectedChartYear ? undefined : '3,3'}
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Month tick labels */}
                    <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                      <span>ม.ค.</span>
                      <span>เม.ย.</span>
                      <span>ก.ค.</span>
                      <span>ต.ค.</span>
                      <span>ธ.ค.</span>
                    </div>
                  </div>
                </div>

                {/* Yearly Stats Summary Footer */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  {rep.yearsData.slice(0, 3).map((y) => (
                    <div key={y.year} className="text-center">
                      <span className="block text-[10px] text-slate-400 font-bold">{y.year}</span>
                      <span className="font-mono font-bold">{formatNumber(y.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
