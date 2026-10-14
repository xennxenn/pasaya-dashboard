import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Users,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { formatNumber } from '../../utils/formatters';
import { MONTH_NAMES, MONTH_FULL_TH } from '../../data/salesDataService';

export const MeasurementReportView: React.FC = () => {
  const { measurementRows, salesReps, settings } = useSales();
  const isLight = settings.themeMode === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  // Extract unique years from measurementRows and sort descending (ปีใหม่สุดอยู่ด้านบนเสมอ)
  const availableYears = useMemo(() => {
    const yrs = Array.from(new Set(measurementRows.map((r) => r.year).filter((y) => y > 0)));
    return yrs.sort((a, b) => b - a);
  }, [measurementRows]);

  // Group by Year
  const yearlyData = useMemo(() => {
    return availableYears.map((yr) => {
      // Filter rows for this year and optional month
      const rowsForYear = measurementRows.filter((r) => {
        if (r.year !== yr) return false;
        if (filterMonth !== 'all' && r.month !== filterMonth) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          return r.salesPerson.toLowerCase().includes(q);
        }
        return true;
      });

      // Aggregate by sales rep
      const repMap = new Map<
        string,
        {
          salesPerson: string;
          areaMeasurementCount: number;
          turnkeyMeetingCount: number;
          siteRecheckCount: number;
          fabricSummaryCount: number;
          installationSiteCheckCount: number;
          totalCount: number;
        }
      >();

      rowsForYear.forEach((r) => {
        const rep = r.salesPerson.trim() || 'ไม่ระบุ';
        // Exclude aggregate row if aggregating
        if (rep === 'รวมทั้งหมด') return;

        if (!repMap.has(rep)) {
          repMap.set(rep, {
            salesPerson: rep,
            areaMeasurementCount: 0,
            turnkeyMeetingCount: 0,
            siteRecheckCount: 0,
            fabricSummaryCount: 0,
            installationSiteCheckCount: 0,
            totalCount: 0,
          });
        }

        const item = repMap.get(rep)!;
        item.areaMeasurementCount += r.areaMeasurementCount || 0;
        item.turnkeyMeetingCount += r.turnkeyMeetingCount || 0;
        item.siteRecheckCount += r.siteRecheckCount || 0;
        item.fabricSummaryCount += r.fabricSummaryCount || 0;
        item.installationSiteCheckCount += r.installationSiteCheckCount || 0;
        item.totalCount += r.totalCount || 0;
      });

      const repsList = Array.from(repMap.values()).sort((a, b) => b.totalCount - a.totalCount);

      // Totals for this year
      const totals = repsList.reduce(
        (acc, r) => ({
          areaMeasurement: acc.areaMeasurement + r.areaMeasurementCount,
          turnkey: acc.turnkey + r.turnkeyMeetingCount,
          siteRecheck: acc.siteRecheck + r.siteRecheckCount,
          fabricSummary: acc.fabricSummary + r.fabricSummaryCount,
          installCheck: acc.installCheck + r.installationSiteCheckCount,
          grandTotal: acc.grandTotal + r.totalCount,
        }),
        { areaMeasurement: 0, turnkey: 0, siteRecheck: 0, fabricSummary: 0, installCheck: 0, grandTotal: 0 }
      );

      return {
        year: yr,
        repsList,
        totals,
      };
    });
  }, [availableYears, measurementRows, filterMonth, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in">
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
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
              }`}
            >
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Measurement Scheduling Report
              </h1>
              <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                รายงานการเข้าหน้างานแต่ละแบบงาน แยกตามพนักงานขาย (1 ตาราง 1 ปี ปีใหม่สุดอยู่ด้านบนเสมอ)
              </p>
            </div>
          </div>

          {/* Filters: Month & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <label className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                เดือน:
              </label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800'
                    : 'bg-white/5 border-white/10 text-white'
                }`}
              >
                <option value="all">ทั้งปี (ทุกเดือน)</option>
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>
                    {MONTH_FULL_TH[m]}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาพนักงานขาย..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-9 pr-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800'
                    : 'bg-white/5 border-white/10 text-white'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Yearly Tables: 1 ตาราง 1 ปี ปีใหม่สุดอยู่ด้านบนเสมอ */}
      <div className="space-y-8">
        {yearlyData.map((yItem) => (
          <div
            key={yItem.year}
            className={`p-6 rounded-3xl border space-y-4 transition-all ${
              isLight
                ? 'bg-white/90 border-slate-200 shadow-xl'
                : 'liquid-glass-card border-white/10 shadow-2xl'
            }`}
          >
            {/* Table Year Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-xl text-base font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                  ปี {yItem.year} (พ.ศ. {yItem.year + 543})
                </span>
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  พนักงานขาย {yItem.repsList.length} คน | รวมการเข้าหน้างานทั้งหมด:{' '}
                  <strong className="text-blue-400 font-mono">{formatNumber(yItem.totals.grandTotal)} ครั้ง</strong>
                </span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b font-bold ${
                      isLight
                        ? 'bg-slate-100 text-slate-800 border-slate-200'
                        : 'bg-white/10 text-slate-200 border-white/10'
                    }`}
                  >
                    <th className="py-3.5 px-4 sticky left-0 z-10 bg-inherit min-w-[200px]">
                      ชื่อพนักงานขาย
                    </th>
                    <th className="py-3.5 px-3 text-center">
                      <span className="block">1. วัดพื้นที่</span>
                      <span className="text-[10px] text-slate-400 font-normal">(Col.D)</span>
                    </th>
                    <th className="py-3.5 px-3 text-center">
                      <span className="block">2. เข้าพบ Turnkey</span>
                      <span className="text-[10px] text-slate-400 font-normal">(Col.E)</span>
                    </th>
                    <th className="py-3.5 px-3 text-center">
                      <span className="block">3. รีเช็คหน้างาน</span>
                      <span className="text-[10px] text-slate-400 font-normal">(Col.F)</span>
                    </th>
                    <th className="py-3.5 px-3 text-center">
                      <span className="block">4. สรุปผ้า/เลือกผ้า</span>
                      <span className="text-[10px] text-slate-400 font-normal">(Col.G)</span>
                    </th>
                    <th className="py-3.5 px-3 text-center">
                      <span className="block">5. ดูหน้างานติดตั้ง</span>
                      <span className="text-[10px] text-slate-400 font-normal">(Col.H)</span>
                    </th>
                    <th className="py-3.5 px-4 text-center font-black text-cyan-400 bg-cyan-500/10 min-w-[90px]">
                      <span className="block">ยอดรวม (ครั้ง)</span>
                      <span className="text-[10px] text-cyan-300 font-normal">(Col.I)</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {yItem.repsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                        ไม่มีข้อมูลการเข้าหน้างานในปี {yItem.year}
                      </td>
                    </tr>
                  ) : (
                    yItem.repsList.map((row) => (
                      <tr key={row.salesPerson} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 px-4 sticky left-0 z-10 bg-inherit font-sans font-bold border-r border-white/5">
                          {row.salesPerson}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.areaMeasurementCount > 0 ? (
                            <span className="font-bold text-slate-200">{row.areaMeasurementCount}</span>
                          ) : (
                            <span className="text-slate-500 opacity-40">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.turnkeyMeetingCount > 0 ? (
                            <span className="font-bold text-slate-200">{row.turnkeyMeetingCount}</span>
                          ) : (
                            <span className="text-slate-500 opacity-40">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.siteRecheckCount > 0 ? (
                            <span className="font-bold text-slate-200">{row.siteRecheckCount}</span>
                          ) : (
                            <span className="text-slate-500 opacity-40">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.fabricSummaryCount > 0 ? (
                            <span className="font-bold text-slate-200">{row.fabricSummaryCount}</span>
                          ) : (
                            <span className="text-slate-500 opacity-40">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.installationSiteCheckCount > 0 ? (
                            <span className="font-bold text-slate-200">{row.installationSiteCheckCount}</span>
                          ) : (
                            <span className="text-slate-500 opacity-40">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-cyan-400 bg-cyan-500/5 text-sm">
                          {row.totalCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr
                    className={`border-t font-black ${
                      isLight
                        ? 'bg-slate-200/70 text-slate-900 border-slate-300'
                        : 'bg-white/15 text-white border-white/20'
                    }`}
                  >
                    <td className="py-3.5 px-4 sticky left-0 z-10 bg-inherit font-sans">
                      รวมทุกพนักงานขาย (ปี {yItem.year})
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {formatNumber(yItem.totals.areaMeasurement)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {formatNumber(yItem.totals.turnkey)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {formatNumber(yItem.totals.siteRecheck)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {formatNumber(yItem.totals.fabricSummary)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {formatNumber(yItem.totals.installCheck)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-cyan-400 text-base bg-cyan-500/20">
                      {formatNumber(yItem.totals.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
