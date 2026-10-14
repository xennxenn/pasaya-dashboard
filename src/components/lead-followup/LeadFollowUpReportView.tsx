import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  Filter,
  EyeOff,
  Sparkles,
  Search,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { formatNumber } from '../../utils/formatters';
import { MONTH_NAMES, MONTH_FULL_TH } from '../../data/salesDataService';

// The 9 official Lead Statuses in specified order
export const LEAD_STATUS_ORDER = [
  'รอติดต่อ (New)',
  'นำเสนอ (Proposing)',
  'มัดจำวัดพื้นที่ (Deposit)',
  'วัดพี้นที่ (Field Service)',
  'เสนอราคา (Quotation)',
  'ชำระเงิน (Payment)',
  'ติดตั้งเรียบร้อย (Site Install)',
  'บริการหลังการขาย (After Sale Service)',
  'ไม่สนใจ',
] as const;

export const LeadFollowUpReportView: React.FC = () => {
  const { leadRows, salesReps, uniqueYears, settings } = useSales();
  const isLight = settings.themeMode === 'light';

  // Toggle view mode: Yearly hierarchy (ตารางรายปีพร้อมรายเดือนข้างใต้) vs Monthly tables (ตารางรายเดือน)
  const [viewTab, setViewTab] = useState<'yearly_hierarchy' | 'monthly_tables'>('yearly_hierarchy');
  const [searchTerm, setSearchTerm] = useState('');

  // Normalize customer status to one of the 9 statuses
  const normalizeStatus = (statusStr: string): string => {
    if (!statusStr) return 'รอติดต่อ (New)';
    const clean = statusStr.trim();
    for (const st of LEAD_STATUS_ORDER) {
      const keyword = st.split(' ')[0]; // e.g. "รอติดต่อ", "นำเสนอ", "มัดจำวัดพื้นที่", etc.
      if (clean.includes(keyword)) return st;
    }
    return clean;
  };

  // Helper to extract year and month from lead row (from Col.C parsed date or created date)
  const getLeadDate = (lead: (typeof leadRows)[0]): { year: number; month: number; monthName: string } => {
    if (lead.date && lead.date.year > 0) {
      return {
        year: lead.date.year,
        month: lead.date.month,
        monthName: MONTH_NAMES[lead.date.month - 1] || 'January',
      };
    }
    // Fallback: 2026
    return { year: 2026, month: 10, monthName: 'October' };
  };

  // Active salespeople who have leads or are configured
  const relevantSalesReps = useMemo(() => {
    const repsInLeads = new Set(leadRows.map((l) => l.salesPerson.trim()));
    return salesReps.filter((r) => repsInLeads.has(r.name.trim()) || r.status === 'active');
  }, [leadRows, salesReps]);

  // Group leads by Year -> Month -> SalesPerson -> Status
  // Rule: "เดือนไหน ปีไหน พนักงานขายคนไหนไม่มีข้อมูลให้ซ่อนไว้ไม่ต้องแสดง"
  const groupedData = useMemo(() => {
    const yearsMap = new Map<
      number,
      {
        year: number;
        repsWithData: Set<string>;
        totalCount: number;
        // Rep -> Status -> Count for whole year
        yearRepStatusCounts: Record<string, Record<string, number>>;
        // Months breakdown for this year
        monthsMap: Map<
          number,
          {
            monthNum: number;
            monthName: string;
            repsWithData: Set<string>;
            totalCount: number;
            repStatusCounts: Record<string, Record<string, number>>;
          }
        >;
      }
    >();

    leadRows.forEach((l) => {
      const { year, month, monthName } = getLeadDate(l);
      const rep = l.salesPerson.trim() || 'ไม่ระบุพนักงาน';
      const status = normalizeStatus(l.customerStatus);

      // Check search filter
      if (
        searchTerm &&
        !l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !rep.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return;
      }

      if (!yearsMap.has(year)) {
        yearsMap.set(year, {
          year,
          repsWithData: new Set(),
          totalCount: 0,
          yearRepStatusCounts: {},
          monthsMap: new Map(),
        });
      }

      const yData = yearsMap.get(year)!;
      yData.repsWithData.add(rep);
      yData.totalCount += 1;

      if (!yData.yearRepStatusCounts[rep]) {
        yData.yearRepStatusCounts[rep] = {};
        LEAD_STATUS_ORDER.forEach((s) => (yData.yearRepStatusCounts[rep][s] = 0));
      }
      yData.yearRepStatusCounts[rep][status] = (yData.yearRepStatusCounts[rep][status] || 0) + 1;

      // Month level
      if (!yData.monthsMap.has(month)) {
        yData.monthsMap.set(month, {
          monthNum: month,
          monthName,
          repsWithData: new Set(),
          totalCount: 0,
          repStatusCounts: {},
        });
      }

      const mData = yData.monthsMap.get(month)!;
      mData.repsWithData.add(rep);
      mData.totalCount += 1;

      if (!mData.repStatusCounts[rep]) {
        mData.repStatusCounts[rep] = {};
        LEAD_STATUS_ORDER.forEach((s) => (mData.repStatusCounts[rep][s] = 0));
      }
      mData.repStatusCounts[rep][status] = (mData.repStatusCounts[rep][status] || 0) + 1;
    });

    // Sort years descending (ปีล่าสุดอยู่ด้านบนเสมอ)
    const sortedYears = Array.from(yearsMap.values()).sort((a, b) => b.year - a.year);

    return sortedYears;
  }, [leadRows, searchTerm]);

  // Monthly tables dataset (1 ตารางแสดง 1 เดือน และเดือนล่าสุดอยู่ด้านบนเสมอ)
  const monthlyFlatList = useMemo(() => {
    interface MonthItem {
      year: number;
      monthNum: number;
      monthName: string;
      key: string;
      repsWithData: string[];
      totalCount: number;
      repStatusCounts: Record<string, Record<string, number>>;
    }

    const list: MonthItem[] = [];
    groupedData.forEach((yData) => {
      // Sort months descending (เดือนล่าสุดอยู่ด้านบนเสมอ)
      const sortedMonths = Array.from(yData.monthsMap.values()).sort(
        (a, b) => b.monthNum - a.monthNum
      );

      sortedMonths.forEach((mData) => {
        // Filter out empty
        if (mData.totalCount > 0) {
          list.push({
            year: yData.year,
            monthNum: mData.monthNum,
            monthName: mData.monthName,
            key: `${yData.year}-${mData.monthNum}`,
            repsWithData: Array.from(mData.repsWithData),
            totalCount: mData.totalCount,
            repStatusCounts: mData.repStatusCounts,
          });
        }
      });
    });

    // Sort all months globally latest first (e.g. 2026-10 > 2026-09 > 2025-12)
    return list.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.monthNum - a.monthNum;
    });
  }, [groupedData]);

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
                  ? 'bg-purple-50 text-purple-600 border border-purple-200'
                  : 'bg-purple-500/20 text-purple-400 border border-purple-400/30'
              }`}
            >
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Lead &amp; Follow-up Report
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  9 สถานะมาตรฐาน
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                ติดตามสถานะ Lead ของพนักงานขายแต่ละคน ซ่อนเดือน/ปี/พนักงานที่ไม่มีข้อมูลอัตโนมัติ
              </p>
            </div>
          </div>

          {/* Tab Selector & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-1 rounded-2xl bg-black/20 border border-white/10">
              <button
                type="button"
                onClick={() => setViewTab('yearly_hierarchy')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewTab === 'yearly_hierarchy'
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. ตารางรายปี (มีตารางเดือนอยู่ด้านล่าง)
              </button>
              <button
                type="button"
                onClick={() => setViewTab('monthly_tables')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewTab === 'monthly_tables'
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. ตารางรายเดือน (เดือนล่าสุดขึ้นก่อน)
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อพนักงาน / ลูกค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-9 pr-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-500'
                    : 'bg-white/5 border-white/10 text-white focus:border-cyan-400'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: Yearly Hierarchy (1 ตารางแสดง 1 ปี ปีล่าสุดอยู่บนเสมอ และแต่ละปีมีตารางเดือนอยู่ด้านล่างเสมอ) */}
      {viewTab === 'yearly_hierarchy' && (
        <div className="space-y-8">
          {groupedData.length === 0 ? (
            <div
              className={`p-12 text-center rounded-3xl border ${
                isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
              }`}
            >
              <EyeOff className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold">ไม่มีข้อมูล Lead ที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
            groupedData.map((yData) => {
              const repsList = Array.from(yData.repsWithData);
              const sortedMonths = Array.from(yData.monthsMap.values()).sort(
                (a, b) => b.monthNum - a.monthNum
              );

              return (
                <div
                  key={yData.year}
                  className={`p-6 rounded-3xl border space-y-6 transition-all ${
                    isLight
                      ? 'bg-white/90 border-slate-200 shadow-xl'
                      : 'liquid-glass-card border-white/10 shadow-2xl'
                  }`}
                >
                  {/* Year Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 font-black text-lg">
                        {yData.year}
                      </div>
                      <div>
                        <h2 className="text-lg font-black tracking-tight">
                          ตารางสรุปภาพรวมสถานะ Lead ประจำปี {yData.year} (พ.ศ. {yData.year + 543})
                        </h2>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          พนักงานขายที่มีข้อมูลในระบบ: {repsList.length} คน | รวม Lead ทั้งหมด: {yData.totalCount} ราย
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Year Table */}
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
                          <th className="py-3 px-4 font-bold sticky left-0 z-10 bg-inherit min-w-[200px]">
                            พนักงานขาย
                          </th>
                          {LEAD_STATUS_ORDER.map((st, idx) => (
                            <th key={st} className="py-3 px-3 text-center whitespace-nowrap font-bold">
                              <span className="text-[11px] block">{st}</span>
                            </th>
                          ))}
                          <th className="py-3 px-4 text-center font-bold text-cyan-500 min-w-[80px]">
                            รวมทั้งปี
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {repsList.map((repName) => {
                          const repCounts = yData.yearRepStatusCounts[repName] || {};
                          const repTotal = Object.values(repCounts).reduce((s, c) => s + c, 0);

                          return (
                            <tr key={repName} className="hover:bg-white/[0.03] transition-colors">
                              <td className="py-2.5 px-4 font-bold sticky left-0 z-10 bg-inherit border-r border-white/5">
                                {repName}
                              </td>
                              {LEAD_STATUS_ORDER.map((st) => {
                                const cnt = repCounts[st] || 0;
                                const isCustomer =
                                  st.includes('ชำระเงิน') ||
                                  st.includes('ติดตั้งเรียบร้อย') ||
                                  st.includes('บริการหลังการขาย');
                                return (
                                  <td
                                    key={st}
                                    className={`py-2.5 px-3 text-center font-mono font-bold ${
                                      cnt > 0
                                        ? isCustomer
                                          ? 'text-emerald-400 bg-emerald-500/10'
                                          : 'text-slate-200'
                                        : 'text-slate-500 opacity-40'
                                    }`}
                                  >
                                    {cnt > 0 ? cnt : '-'}
                                  </td>
                                );
                              })}
                              <td className="py-2.5 px-4 text-center font-black font-mono text-cyan-400 bg-cyan-500/5">
                                {repTotal}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr
                          className={`border-t font-black ${
                            isLight
                              ? 'bg-slate-200/70 text-slate-900 border-slate-300'
                              : 'bg-white/15 text-white border-white/20'
                          }`}
                        >
                          <td className="py-3 px-4 sticky left-0 z-10 bg-inherit">รวมทั้งสิ้น (ปี {yData.year})</td>
                          {LEAD_STATUS_ORDER.map((st) => {
                            const sum = repsList.reduce(
                              (s, r) => s + (yData.yearRepStatusCounts[r]?.[st] || 0),
                              0
                            );
                            return (
                              <td key={st} className="py-3 px-3 text-center font-mono">
                                {sum}
                              </td>
                            );
                          })}
                          <td className="py-3 px-4 text-center text-cyan-400 font-mono text-sm">
                            {yData.totalCount}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Monthly Sub-tables for this Year (ตารางเดือนในปีนั้นๆ อยู่ด้านล่างเสมอ) */}
                  <div className="pt-4 border-t border-white/10 space-y-5">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-cyan-400">
                      <Calendar className="w-4 h-4" />
                      ตารางแจกแจงแยกรายเดือน ประจำปี {yData.year} (เดือนล่าสุดอยู่ด้านบน)
                    </h3>

                    <div className="grid grid-cols-1 gap-5">
                      {sortedMonths.map((mData) => {
                        const mRepsList = Array.from(mData.repsWithData);
                        return (
                          <div
                            key={mData.monthNum}
                            className={`p-4 rounded-2xl border transition-all ${
                              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                              <span className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                                📅 เดือน {MONTH_FULL_TH[mData.monthName as keyof typeof MONTH_FULL_TH]} {yData.year}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">
                                รวม {mData.totalCount} Lead (พนักงาน {mRepsList.length} คน)
                              </span>
                            </div>

                            <div className="overflow-x-auto mt-3">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className={`border-b text-[11px] ${isLight ? 'text-slate-600 bg-slate-100/50' : 'text-slate-400 bg-white/5'}`}>
                                    <th className="py-2 px-3 font-semibold min-w-[180px]">พนักงานขาย</th>
                                    {LEAD_STATUS_ORDER.map((st) => (
                                      <th key={st} className="py-2 px-2 text-center whitespace-nowrap">
                                        {st}
                                      </th>
                                    ))}
                                    <th className="py-2 px-3 text-center text-cyan-400 font-bold">รวม</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {mRepsList.map((repName) => {
                                    const counts = mData.repStatusCounts[repName] || {};
                                    const repMTotal = Object.values(counts).reduce((s, c) => s + c, 0);

                                    return (
                                      <tr key={repName} className="hover:bg-white/[0.02]">
                                        <td className="py-2 px-3 font-medium">{repName}</td>
                                        {LEAD_STATUS_ORDER.map((st) => {
                                          const cnt = counts[st] || 0;
                                          return (
                                            <td
                                              key={st}
                                              className={`py-2 px-2 text-center font-mono ${
                                                cnt > 0 ? 'font-bold text-white' : 'text-slate-500 opacity-40'
                                              }`}
                                            >
                                              {cnt > 0 ? cnt : '-'}
                                            </td>
                                          );
                                        })}
                                        <td className="py-2 px-3 text-center font-bold font-mono text-cyan-400">
                                          {repMTotal}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: Monthly Tables (1 ตารางแสดง 1 เดือน และเดือนล่าสุดอยู่ด้านบนเสมอ) */}
      {viewTab === 'monthly_tables' && (
        <div className="space-y-6">
          {monthlyFlatList.length === 0 ? (
            <div
              className={`p-12 text-center rounded-3xl border ${
                isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
              }`}
            >
              <EyeOff className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold">ไม่มีข้อมูล Lead ที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
            monthlyFlatList.map((mItem) => (
              <div
                key={mItem.key}
                className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                  isLight
                    ? 'bg-white/90 border-slate-200 shadow-lg'
                    : 'liquid-glass-card border-white/10 shadow-xl'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black tracking-tight">
                        เดือน {MONTH_FULL_TH[mItem.monthName as keyof typeof MONTH_FULL_TH]} {mItem.year} (พ.ศ. {mItem.year + 543})
                      </h2>
                      <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        พนักงานขายที่มี Lead: {mItem.repsWithData.length} คน | รวมในเดือนนี้: {mItem.totalCount} Lead
                      </p>
                    </div>
                  </div>
                </div>

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
                        <th className="py-3 px-4 font-bold sticky left-0 z-10 bg-inherit min-w-[200px]">
                          พนักงานขาย
                        </th>
                        {LEAD_STATUS_ORDER.map((st) => (
                          <th key={st} className="py-3 px-3 text-center whitespace-nowrap">
                            {st}
                          </th>
                        ))}
                        <th className="py-3 px-4 text-center font-bold text-cyan-400 min-w-[80px]">
                          รวม
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {mItem.repsWithData.map((repName) => {
                        const counts = mItem.repStatusCounts[repName] || {};
                        const repTotal = Object.values(counts).reduce((s, c) => s + c, 0);

                        return (
                          <tr key={repName} className="hover:bg-white/[0.03] transition-colors">
                            <td className="py-2.5 px-4 font-bold sticky left-0 z-10 bg-inherit border-r border-white/5">
                              {repName}
                            </td>
                            {LEAD_STATUS_ORDER.map((st) => {
                              const cnt = counts[st] || 0;
                              const isCustomer =
                                st.includes('ชำระเงิน') ||
                                st.includes('ติดตั้งเรียบร้อย') ||
                                st.includes('บริการหลังการขาย');
                              return (
                                <td
                                  key={st}
                                  className={`py-2.5 px-3 text-center font-mono font-bold ${
                                    cnt > 0
                                      ? isCustomer
                                        ? 'text-emerald-400 bg-emerald-500/10'
                                        : 'text-slate-200'
                                      : 'text-slate-500 opacity-40'
                                  }`}
                                >
                                  {cnt > 0 ? cnt : '-'}
                                </td>
                              );
                            })}
                            <td className="py-2.5 px-4 text-center font-black font-mono text-cyan-400 bg-cyan-500/5">
                              {repTotal}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr
                        className={`border-t font-black ${
                          isLight
                            ? 'bg-slate-200/70 text-slate-900 border-slate-300'
                            : 'bg-white/15 text-white border-white/20'
                        }`}
                      >
                        <td className="py-3 px-4 sticky left-0 z-10 bg-inherit">รวมทั้งเดือน</td>
                        {LEAD_STATUS_ORDER.map((st) => {
                          const sum = mItem.repsWithData.reduce(
                            (s, r) => s + (mItem.repStatusCounts[r]?.[st] || 0),
                            0
                          );
                          return (
                            <td key={st} className="py-3 px-3 text-center font-mono">
                              {sum}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-center text-cyan-400 font-mono text-sm">
                          {mItem.totalCount}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
