import React, { useState, useMemo } from 'react';
import {
  Award,
  Filter,
  Calendar,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  MousePointerClick,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { MONTH_NAMES, MONTH_FULL_TH } from '../../data/salesDataService';

export const ProgressOfSalesView: React.FC = () => {
  const {
    records,
    salesReps,
    leadRows,
    installmentRows,
    claimRows,
    measurementRows,
    uniqueYears,
    settings,
  } = useSales();

  const isLight = settings.themeMode === 'light';

  // Filters: Year, Quarter, Month, Cutoff Mode (ปัจจุบัน หรือ แค่สิ้นเดือน), Salesperson
  const [selectedYear, setSelectedYear] = useState<string>(
    uniqueYears.length > 0 ? String(uniqueYears[0]) : '2026'
  );
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all'); // 'all', 'Q1', 'Q2', 'Q3', 'Q4'
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [cutoffMode, setCutoffMode] = useState<'current' | 'month_end'>('current'); // ปัจจุบัน หรือ แค่สิ้นเดือน
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal for Double-Click on site visits (รายละเอียดการเข้าหน้างาน)
  const [siteVisitModalRep, setSiteVisitModalRep] = useState<string | null>(null);

  // Quarter to months map
  const quarterMonths: Record<string, number[]> = {
    Q1: [1, 2, 3],
    Q2: [4, 5, 6],
    Q3: [7, 8, 9],
    Q4: [10, 11, 12],
  };

  // Helper to determine if a record month matches selected filters
  const matchesTimeFilter = (year: number, monthNum: number): boolean => {
    if (selectedYear !== 'all' && String(year) !== selectedYear) return false;
    if (selectedQuarter !== 'all') {
      const allowed = quarterMonths[selectedQuarter] || [];
      if (!allowed.includes(monthNum)) return false;
    }
    if (selectedMonth !== 'all') {
      const expectedNum = MONTH_NAMES.indexOf(selectedMonth as any) + 1;
      if (expectedNum > 0 && monthNum !== expectedNum) return false;
    }
    return true;
  };

  // Helper to check if a customer status counts as a customer
  const isCustomerStatus = (statusStr: string): boolean => {
    if (!statusStr) return false;
    const s = statusStr.toLowerCase();
    return (
      s.includes('ชำระเงิน') ||
      s.includes('payment') ||
      s.includes('ติดตั้งเรียบร้อย') ||
      s.includes('site install') ||
      s.includes('บริการหลังการขาย') ||
      s.includes('after sale')
    );
  };

  // Calculate table rows for each sales rep with all 14 columns
  const progressRows = useMemo(() => {
    const activeReps = salesReps.filter((r) => r.status === 'active');

    return activeReps
      .filter((rep) => {
        if (selectedRep !== 'all' && rep.name !== selectedRep) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          return (
            rep.name.toLowerCase().includes(q) ||
            (rep.code && rep.code.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .map((rep) => {
        const repName = rep.name;

        // 1. Sales Records for this rep
        const repRecords = records.filter(
          (r) => r.salesPerson === repName && matchesTimeFilter(r.year, r.monthNum)
        );

        // 2. Sales Totals: Total, MTO, Fabric, Bedding
        const salesTotal = repRecords.reduce((sum, r) => sum + (r.salesTotal || 0), 0);
        const salesMTO = repRecords.reduce((sum, r) => sum + (r.salesMTO || 0), 0);
        const salesFabric = repRecords.reduce((sum, r) => sum + (r.salesFabric || 0), 0);
        const salesBedding = repRecords.reduce((sum, r) => sum + (r.salesBedding || 0), 0);

        // 6. Average Sales per Month (ยอดขายเฉลี่ยต่อเดือน)
        const distinctMonthsCount = new Set(repRecords.map((r) => `${r.year}-${r.monthNum}`)).size || 1;
        const avgSalesPerMonth = salesTotal / distinctMonthsCount;

        // 7. Orders Count (จำนวนออเดอร์)
        const orders = repRecords.reduce((sum, r) => sum + (r.orders || 0), 0);

        // 8. Average Ticket per Order (ยอดขายเฉลี่ยต่อออเดอร์ เทียบเฉพาะยอดขาย MTO)
        const avgMtoPerOrder = orders > 0 ? salesMTO / orders : 0;

        // 9. Curtain installs (งานติดตั้งผ้าม่าน) vs Wallpaper installs (งานติดตั้งวอลเปเปอร์)
        const repInstalls = installmentRows.filter((inst) => {
          const matchRep =
            inst.salesFullName?.includes(rep.nickname || '') ||
            inst.salesFullName?.includes(rep.name.split(' ')[0]) ||
            repName.includes(inst.salesFirstName || '');

          let instYr = 2026;
          let instMo = 10;
          if (inst.installDateParsed) {
            instYr = inst.installDateParsed.year;
            instMo = inst.installDateParsed.month;
          }
          return matchRep && matchesTimeFilter(instYr, instMo);
        });

        const curtainInstalls = repInstalls.filter(
          (inst) => String(inst.workTypeCode) === '1' || inst.workTypeLabel.includes('ผ้าม่าน')
        ).length;

        const wallpaperInstalls = repInstalls.filter(
          (inst) => String(inst.workTypeCode) === '4' || inst.workTypeLabel.includes('วอลเปเปอร์')
        ).length;

        // 10. Claim Revision Jobs count and value (จำนวนงานที่แก้ไข และมูลค่า)
        const repClaims = claimRows.filter((c) => {
          if (c.isVisible === false) return false;
          const matchRep = c.salesPerson?.includes(rep.nickname || '') || c.salesPerson?.includes(rep.name.split(' ')[0]);
          let claimYr = 2026;
          let claimMo = 10;
          if (c.claimDate) {
            const p = c.claimDate.split('-');
            if (p.length >= 2) {
              claimYr = parseInt(p[0], 10);
              claimMo = parseInt(p[1], 10);
            }
          }
          return matchRep && matchesTimeFilter(claimYr, claimMo);
        });

        const claimCount = repClaims.length;
        const claimCostTotal = repClaims.reduce((sum, c) => sum + (c.claimCost || 0), 0);

        // 11. Total Leads (จำนวน Lead ทั้งหมด)
        const repLeads = leadRows.filter((l) => {
          const matchRep = l.salesPerson?.includes(rep.nickname || '') || l.salesPerson?.includes(rep.name.split(' ')[0]);
          let lYr = 2026;
          let lMo = 10;
          if (l.date && l.date.year > 0) {
            lYr = l.date.year;
            lMo = l.date.month;
          }
          return matchRep && matchesTimeFilter(lYr, lMo);
        });

        const totalLeads = repLeads.length;

        // 12. Customer Leads (จำนวน Lead ที่เป็นลูกค้า)
        const customerLeads = repLeads.filter((l) => isCustomerStatus(l.customerStatus)).length;

        // 13. Conversion Rate (%)
        const conversionRate = totalLeads > 0 ? (customerLeads / totalLeads) * 100 : 0;

        // 14. Total On-Site Visits (จำนวนที่เข้าหน้างานทั้งหมด) from Measurement and Installments
        const repMeasurements = measurementRows.filter((m) => {
          const matchRep = m.salesPerson?.includes(rep.nickname || '') || m.salesPerson?.includes(rep.name.split(' ')[0]);
          const mYr = m.year || 2026;
          const mMo = MONTH_NAMES.indexOf(m.month as any) + 1 || 10;
          return matchRep && matchesTimeFilter(mYr, mMo);
        });

        const totalMeasureVisits = repMeasurements.reduce((sum, m) => sum + (m.totalCount || 0), 0);
        const totalSiteVisits = totalMeasureVisits + repInstalls.length;

        return {
          repId: rep.id,
          repCode: rep.code || '-',
          repName,
          salesTotal,
          salesMTO,
          salesFabric,
          salesBedding,
          avgSalesPerMonth,
          orders,
          avgMtoPerOrder,
          curtainInstalls,
          wallpaperInstalls,
          claimCount,
          claimCostTotal,
          totalLeads,
          customerLeads,
          conversionRate,
          totalSiteVisits,
          // Raw lists for double click modal
          repInstalls,
          repMeasurements,
        };
      });
  }, [
    salesReps,
    records,
    installmentRows,
    claimRows,
    leadRows,
    measurementRows,
    selectedYear,
    selectedQuarter,
    selectedMonth,
    selectedRep,
    searchTerm,
  ]);

  // Overall column totals
  const totals = useMemo(() => {
    return progressRows.reduce(
      (acc, r) => ({
        salesTotal: acc.salesTotal + r.salesTotal,
        salesMTO: acc.salesMTO + r.salesMTO,
        salesFabric: acc.salesFabric + r.salesFabric,
        salesBedding: acc.salesBedding + r.salesBedding,
        orders: acc.orders + r.orders,
        curtainInstalls: acc.curtainInstalls + r.curtainInstalls,
        wallpaperInstalls: acc.wallpaperInstalls + r.wallpaperInstalls,
        claimCount: acc.claimCount + r.claimCount,
        claimCostTotal: acc.claimCostTotal + r.claimCostTotal,
        totalLeads: acc.totalLeads + r.totalLeads,
        customerLeads: acc.customerLeads + r.customerLeads,
        totalSiteVisits: acc.totalSiteVisits + r.totalSiteVisits,
      }),
      {
        salesTotal: 0,
        salesMTO: 0,
        salesFabric: 0,
        salesBedding: 0,
        orders: 0,
        curtainInstalls: 0,
        wallpaperInstalls: 0,
        claimCount: 0,
        claimCostTotal: 0,
        totalLeads: 0,
        customerLeads: 0,
        totalSiteVisits: 0,
      }
    );
  }, [progressRows]);

  // Active rep data for the Site Visits Modal
  const modalRepData = useMemo(() => {
    if (!siteVisitModalRep) return null;
    return progressRows.find((r) => r.repName === siteVisitModalRep) || null;
  }, [siteVisitModalRep, progressRows]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
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
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
              }`}
            >
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Progress of Sales (รายงานความคืบหน้างานขายเชิงลึก)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  14 มิติข้อมูล
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                วิเคราะห์ผลงานและประสิทธิภาพแบบครบวงจร (ดับเบิ้ลคลิกแถวเพื่อดูรายละเอียดการเข้าหน้างาน)
              </p>
            </div>
          </div>

          {/* Quick Notice Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
            <MousePointerClick className="w-4 h-4" />
            <span>Double Click ที่แถวเพื่อดูรายการเข้าหน้างาน</span>
          </div>
        </div>

        {/* Filter Toolbar: Year, Quarter, Month, Cutoff Mode, Sales Rep */}
        <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-4 border-t border-white/10 text-xs">
          {/* Year */}
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-slate-400">ปี:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl font-bold border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}
            >
              <option value="all">ทุกปี</option>
              {uniqueYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  ปี {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Quarter */}
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-slate-400">ไตรมาส:</label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl font-bold border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}
            >
              <option value="all">ทุกไตรมาส</option>
              <option value="Q1">Q1 (ม.ค. - มี.ค.)</option>
              <option value="Q2">Q2 (เม.ย. - มิ.ย.)</option>
              <option value="Q3">Q3 (ก.ค. - ก.ย.)</option>
              <option value="Q4">Q4 (ต.ค. - ธ.ค.)</option>
            </select>
          </div>

          {/* Month */}
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-slate-400">เดือน:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl font-bold border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}
            >
              <option value="all">ทุกเดือน</option>
              {MONTH_NAMES.map((m) => (
                <option key={m} value={m}>
                  {MONTH_FULL_TH[m]}
                </option>
              ))}
            </select>
          </div>

          {/* Cutoff Mode: ปัจจุบัน หรือ แค่สิ้นเดือน */}
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-slate-400">ช่วงเวลาตัดยอด:</label>
            <div className="flex items-center p-1 rounded-xl bg-black/20 border border-white/10">
              <button
                type="button"
                onClick={() => setCutoffMode('current')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  cutoffMode === 'current'
                    ? 'bg-amber-500 text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ปัจจุบัน (Realtime)
              </button>
              <button
                type="button"
                onClick={() => setCutoffMode('month_end')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  cutoffMode === 'month_end'
                    ? 'bg-amber-500 text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                แค่สิ้นเดือน (Month-End)
              </button>
            </div>
          </div>

          {/* Rep Filter */}
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-slate-400">พนักงานขาย:</label>
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl font-bold border max-w-[180px] truncate ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}
            >
              <option value="all">ทุกคน</option>
              {salesReps.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-8 pr-3 py-1.5 rounded-xl font-medium border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Main 14-Column Table */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition-all ${
          isLight
            ? 'bg-white/90 border-slate-200 shadow-xl'
            : 'liquid-glass-card border-white/10 shadow-2xl'
        }`}
      >
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
                {/* 1. ชื่อพนักงานขาย */}
                <th className="py-3 px-4 sticky left-0 z-10 bg-inherit min-w-[180px]">
                  1. ชื่อพนักงานขาย
                </th>
                {/* 2. ยอดขายรวม */}
                <th className="py-3 px-3 text-right min-w-[110px] text-cyan-400 font-black">
                  2. ยอดขายรวม
                </th>
                {/* 3. ยอดขาย MTO */}
                <th className="py-3 px-3 text-right min-w-[100px]">3. ยอด MTO</th>
                {/* 4. ยอดขาย Fabric */}
                <th className="py-3 px-3 text-right min-w-[95px]">4. Fabric</th>
                {/* 5. ยอดขาย Bedding */}
                <th className="py-3 px-3 text-right min-w-[95px]">5. Bedding</th>
                {/* 6. ยอดขายเฉลี่ยต่อเดือน */}
                <th className="py-3 px-3 text-right min-w-[110px]">6. เฉลี่ย/เดือน</th>
                {/* 7. จำนวนออเดอร์ */}
                <th className="py-3 px-3 text-center min-w-[80px]">7. ออเดอร์</th>
                {/* 8. ยอดขายเฉลี่ยต่อออเดอร์ (เทียบเฉพาะ MTO) */}
                <th className="py-3 px-3 text-right min-w-[110px] text-amber-300">
                  8. เฉลี่ย/ออเดอร์ (MTO)
                </th>
                {/* 9. งานติดตั้งผ้าม่าน / วอลเปเปอร์ */}
                <th className="py-3 px-3 text-center min-w-[120px]">
                  9. ผ้าม่าน / วอลเปเปอร์
                </th>
                {/* 10. งานแก้ไขและมูลค่า */}
                <th className="py-3 px-3 text-center min-w-[120px] text-rose-300">
                  10. งานแก้ไข (ครั้ง/บาท)
                </th>
                {/* 11. จำนวน Lead ทั้งหมด */}
                <th className="py-3 px-3 text-center min-w-[85px]">11. Lead ทั้งหมด</th>
                {/* 12. จำนวน Lead ที่เป็นลูกค้า */}
                <th className="py-3 px-3 text-center min-w-[90px] text-emerald-400">
                  12. Lead ลูกค้า
                </th>
                {/* 13. Conversion Rate */}
                <th className="py-3 px-3 text-right min-w-[90px] text-emerald-400 font-bold">
                  13. CR (%)
                </th>
                {/* 14. จำนวนที่เข้าหน้างานทั้งหมด (Double Click) */}
                <th className="py-3 px-4 text-center min-w-[130px] bg-cyan-500/10 text-cyan-300 font-black">
                  14. เข้าหน้างานรวม (ครั้ง) 🔍
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {progressRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400 font-sans">
                    ไม่มีข้อมูลพนักงานขายตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                progressRows.map((row) => (
                  <tr
                    key={row.repId}
                    onDoubleClick={() => setSiteVisitModalRep(row.repName)}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    title="ดับเบิ้ลคลิกเพื่อดูรายละเอียดงานเข้าหน้างานทั้งหมดของพนักงานท่านนี้"
                  >
                    {/* 1. Rep Name */}
                    <td className="py-3 px-4 sticky left-0 z-10 bg-inherit font-sans font-bold border-r border-white/5 truncate max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-cyan-400 text-xs font-mono">{row.repCode}</span>
                        <span>{row.repName}</span>
                      </div>
                    </td>

                    {/* 2. Total Sales */}
                    <td className="py-3 px-3 text-right font-black text-cyan-400 text-sm">
                      {formatCurrency(row.salesTotal)}
                    </td>

                    {/* 3. MTO */}
                    <td className="py-3 px-3 text-right text-slate-200">
                      {formatNumber(row.salesMTO)}
                    </td>

                    {/* 4. Fabric */}
                    <td className="py-3 px-3 text-right text-slate-300">
                      {formatNumber(row.salesFabric)}
                    </td>

                    {/* 5. Bedding */}
                    <td className="py-3 px-3 text-right text-slate-300">
                      {formatNumber(row.salesBedding)}
                    </td>

                    {/* 6. Avg Monthly */}
                    <td className="py-3 px-3 text-right text-slate-200 font-bold">
                      {formatCurrency(row.avgSalesPerMonth)}
                    </td>

                    {/* 7. Orders */}
                    <td className="py-3 px-3 text-center text-slate-200">
                      {row.orders > 0 ? row.orders : '-'}
                    </td>

                    {/* 8. Avg MTO per order */}
                    <td className="py-3 px-3 text-right text-amber-300 font-bold">
                      {row.avgMtoPerOrder > 0 ? formatCurrency(row.avgMtoPerOrder) : '-'}
                    </td>

                    {/* 9. Installs: Curtain / Wallpaper */}
                    <td className="py-3 px-3 text-center text-slate-200">
                      <span className="text-cyan-400 font-bold">{row.curtainInstalls}</span>
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-purple-400 font-bold">{row.wallpaperInstalls}</span>
                    </td>

                    {/* 10. Claim count & Cost */}
                    <td className="py-3 px-3 text-center text-rose-300">
                      {row.claimCount > 0 ? (
                        <span>
                          {row.claimCount} งาน ({formatNumber(row.claimCostTotal)})
                        </span>
                      ) : (
                        <span className="text-slate-500 opacity-40">-</span>
                      )}
                    </td>

                    {/* 11. Total Leads */}
                    <td className="py-3 px-3 text-center text-slate-200">{row.totalLeads}</td>

                    {/* 12. Customer Leads */}
                    <td className="py-3 px-3 text-center text-emerald-400 font-bold">
                      {row.customerLeads}
                    </td>

                    {/* 13. Conversion Rate */}
                    <td className="py-3 px-3 text-right text-emerald-400 font-black">
                      {row.conversionRate.toFixed(1)}%
                    </td>

                    {/* 14. Total Site Visits (Interactive Double-click badge) */}
                    <td
                      onClick={() => setSiteVisitModalRep(row.repName)}
                      className="py-3 px-4 text-center font-black text-cyan-300 bg-cyan-500/5 group-hover:bg-cyan-500/20 transition-colors"
                    >
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/30 font-mono text-sm">
                        {row.totalSiteVisits}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
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
                <td className="py-3.5 px-4 sticky left-0 z-10 bg-inherit font-sans">รวมทั้งแผนก</td>
                <td className="py-3.5 px-3 text-right text-cyan-400 text-sm">
                  {formatCurrency(totals.salesTotal)}
                </td>
                <td className="py-3.5 px-3 text-right">{formatNumber(totals.salesMTO)}</td>
                <td className="py-3.5 px-3 text-right">{formatNumber(totals.salesFabric)}</td>
                <td className="py-3.5 px-3 text-right">{formatNumber(totals.salesBedding)}</td>
                <td className="py-3.5 px-3 text-right">-</td>
                <td className="py-3.5 px-3 text-center">{totals.orders}</td>
                <td className="py-3.5 px-3 text-right text-amber-300">
                  {totals.orders > 0 ? formatCurrency(totals.salesMTO / totals.orders) : '-'}
                </td>
                <td className="py-3.5 px-3 text-center">
                  {totals.curtainInstalls} / {totals.wallpaperInstalls}
                </td>
                <td className="py-3.5 px-3 text-center text-rose-300">
                  {totals.claimCount} ({formatNumber(totals.claimCostTotal)})
                </td>
                <td className="py-3.5 px-3 text-center">{totals.totalLeads}</td>
                <td className="py-3.5 px-3 text-center text-emerald-400">{totals.customerLeads}</td>
                <td className="py-3.5 px-3 text-right text-emerald-400">
                  {totals.totalLeads > 0
                    ? ((totals.customerLeads / totals.totalLeads) * 100).toFixed(1)
                    : 0}
                  %
                </td>
                <td className="py-3.5 px-4 text-center text-cyan-400 text-sm bg-cyan-500/15">
                  {totals.totalSiteVisits}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Double-Click Details Modal: รายละเอียดงานเข้าหน้างานแต่ละงาน */}
      {siteVisitModalRep && modalRepData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-4xl w-full bg-slate-900 border border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    รายละเอียดงานเข้าหน้างาน: {modalRepData.repName} ({modalRepData.repCode})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    รวมงานติดตั้ง {modalRepData.repInstalls.length} งาน | งานสำรวจ/วัดพื้นที่ {modalRepData.totalSiteVisits - modalRepData.repInstalls.length} ครั้ง
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSiteVisitModalRep(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                คิวงานติดตั้งจริง (Installment Report)
              </h4>

              {modalRepData.repInstalls.length === 0 ? (
                <p className="text-slate-400 py-4 text-center">ไม่มีรายการติดตั้งในระบบสำหรับพนักงานท่านนี้</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {modalRepData.repInstalls.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-white text-sm">{job.customerName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          {job.workTypeLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                        <div>
                          <span className="text-slate-400">วันที่: </span>
                          <span className="font-mono">{job.installDateFormatted}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">เวลา: </span>
                          <span className="font-mono">{job.timeSlot}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">ทีมช่าง: </span>
                          <span>{job.technicianTeam}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">เบอร์ติดต่อ: </span>
                          <span className="font-mono">{job.customerPhone || '-'}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-start gap-1 pt-1 border-t border-white/5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span className="truncate">{job.installLocation || 'ไม่ระบุสถานที่'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex justify-end bg-white/[0.01]">
              <button
                type="button"
                onClick={() => setSiteVisitModalRep(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-white hover:bg-cyan-600 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
