import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Filter,
  DollarSign,
  FileCheck,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  PieChart as PieIcon,
  CheckCircle2,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { MONTH_NAMES, MONTH_FULL_TH } from '../../data/salesDataService';

export const ExecutiveDashboardView: React.FC = () => {
  const {
    records,
    salesReps,
    targets,
    quotationRows,
    forecastRows,
    leadRows,
    uniqueYears,
    settings,
  } = useSales();

  const isLight = settings.themeMode === 'light';

  // Filters: Year, Month, Sales Person
  const [selectedYear, setSelectedYear] = useState<string>(
    uniqueYears.length > 0 ? String(uniqueYears[0]) : '2026'
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedRep, setSelectedRep] = useState<string>('all');

  // Month lookup helper
  const monthNameToNum: Record<string, number> = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
  };

  // 1. Calculate Actual Sales (ยอดขายจริง) from records filtered by year, month, rep
  const filteredActualRecords = useMemo(() => {
    return records.filter((r) => {
      // Exclude overall summary row when summing individual reps
      if (r.salesPerson === 'รวมทั้งหมด') return false;
      const matchYear = selectedYear === 'all' || String(r.year) === selectedYear;
      const matchMonth = selectedMonth === 'all' || r.month === selectedMonth;
      const matchRep = selectedRep === 'all' || r.salesPerson === selectedRep;
      return matchYear && matchMonth && matchRep;
    });
  }, [records, selectedYear, selectedMonth, selectedRep]);

  const actualSalesTotal = useMemo(() => {
    return filteredActualRecords.reduce((sum, r) => sum + (r.salesTotal || 0), 0);
  }, [filteredActualRecords]);

  // 2. Calculate Quoted Amount (ยอดที่เสนอราคา) from quotationRows
  // Quoted is confirmed quotes (Col.B = 'Y' / isConfirmed = true) and branch 64
  const filteredQuotationRows = useMemo(() => {
    return quotationRows.filter((q) => {
      if (!q.isConfirmed) return false;
      let quoteYear = 0;
      let quoteMonthNum = 0;
      if (q.quotationDate) {
        const parts = q.quotationDate.split('-');
        if (parts.length >= 2) {
          quoteYear = parseInt(parts[0], 10);
          quoteMonthNum = parseInt(parts[1], 10);
        }
      }
      const matchYear = selectedYear === 'all' || String(quoteYear) === selectedYear;
      const matchMonth = selectedMonth === 'all' || (quoteMonthNum > 0 && MONTH_NAMES[quoteMonthNum - 1] === selectedMonth);
      
      // Match rep either by employee code or name
      let matchRep = true;
      if (selectedRep !== 'all') {
        const matchedRepObj = salesReps.find((r) => r.name === selectedRep);
        if (matchedRepObj && q.employeeCode) {
          matchRep = q.employeeCode === matchedRepObj.code;
        } else {
          matchRep = true;
        }
      }
      return matchYear && matchMonth && matchRep;
    });
  }, [quotationRows, selectedYear, selectedMonth, selectedRep, salesReps]);

  const quotedAmountTotal = useMemo(() => {
    return filteredQuotationRows.reduce((sum, q) => sum + (q.quotedAmount || 0), 0);
  }, [filteredQuotationRows]);

  // Combined: ยอดที่เสนอราคา + ยอดขายจริง
  const quotedPlusActualTotal = quotedAmountTotal + actualSalesTotal;

  // 3. Calculate Target Sales (เป้ายอดขาย)
  const targetSalesTotal = useMemo(() => {
    const yr = selectedYear === 'all' ? 2026 : parseInt(selectedYear, 10);
    const yearTargets = targets.filter((t) => t.year === yr);
    
    if (selectedRep === 'all') {
      if (selectedMonth === 'all') {
        return yearTargets.reduce((sum, t) => sum + (t.teamTarget || 0), 0);
      }
      const monthTarget = yearTargets.find((t) => t.monthName === selectedMonth);
      return monthTarget?.teamTarget || 0;
    } else {
      const repObj = salesReps.find((r) => r.name === selectedRep);
      if (!repObj) return 0;
      if (selectedMonth === 'all') {
        return yearTargets.reduce((sum, t) => sum + (t.individualTargets[repObj.id] || 1000000), 0);
      }
      const monthTarget = yearTargets.find((t) => t.monthName === selectedMonth);
      return monthTarget?.individualTargets[repObj.id] || 1000000;
    }
  }, [targets, selectedYear, selectedMonth, selectedRep, salesReps]);

  // 4. Forecast Sales by Presentation Status (สถานะการนำเสนอขาย)
  const filteredForecastRows = useMemo(() => {
    return forecastRows.filter((f) => {
      const matchRep = selectedRep === 'all' || f.salesPerson === selectedRep;
      const matchYear = selectedYear === 'all' || f.year60 === selectedYear || f.year40 === selectedYear;
      const matchMonth = selectedMonth === 'all' || f.month60 === selectedMonth || f.month40 === selectedMonth;
      return matchRep && matchYear && matchMonth;
    });
  }, [forecastRows, selectedRep, selectedYear, selectedMonth]);

  const forecastByStatus = useMemo(() => {
    const map: Record<string, { count: number; totalAmount: number }> = {};
    filteredForecastRows.forEach((f) => {
      const status = f.presentationStatus || 'กำลังนำเสนอ';
      if (!map[status]) {
        map[status] = { count: 0, totalAmount: 0 };
      }
      map[status].count += 1;
      map[status].totalAmount += f.totalQuoteAmount || 0;
    });
    return Object.entries(map).map(([status, data]) => ({
      status,
      count: data.count,
      totalAmount: data.totalAmount,
    }));
  }, [filteredForecastRows]);

  // Monthly breakdown for the Comparison Chart
  const monthlyChartData = useMemo(() => {
    const yr = selectedYear === 'all' ? 2026 : parseInt(selectedYear, 10);
    return MONTH_NAMES.map((mName, idx) => {
      const mNum = idx + 1;
      const actual = filteredActualRecords
        .filter((r) => r.monthNum === mNum && (selectedYear === 'all' || r.year === yr))
        .reduce((sum, r) => sum + (r.salesTotal || 0), 0);

      const quoted = filteredQuotationRows
        .filter((q) => {
          if (!q.quotationDate) return false;
          const parts = q.quotationDate.split('-');
          return parts.length >= 2 && parseInt(parts[1], 10) === mNum;
        })
        .reduce((sum, q) => sum + (q.quotedAmount || 0), 0);

      const forecast = filteredForecastRows
        .filter((f) => f.month60 === mName || f.month40 === mName)
        .reduce((sum, f) => sum + (f.totalQuoteAmount || 0), 0);

      return {
        month: mName,
        monthTh: MONTH_FULL_TH[mName],
        actual,
        quoted,
        quotedPlusActual: actual + quoted,
        forecast,
      };
    });
  }, [filteredActualRecords, filteredQuotationRows, filteredForecastRows, selectedYear]);

  // 5. Lead Count by Status (ตารางจำนวน Lead ในแต่ละสถานะของ Lead)
  const filteredLeadRows = useMemo(() => {
    return leadRows.filter((l) => {
      const matchRep = selectedRep === 'all' || l.salesPerson === selectedRep;
      let leadYear = 0;
      let leadMonthNum = 0;
      if (l.date && l.date.year) {
        leadYear = l.date.year;
        leadMonthNum = l.date.month;
      }
      const matchYear = selectedYear === 'all' || String(leadYear) === selectedYear;
      const matchMonth = selectedMonth === 'all' || (leadMonthNum > 0 && MONTH_NAMES[leadMonthNum - 1] === selectedMonth);
      return matchRep && matchYear && matchMonth;
    });
  }, [leadRows, selectedRep, selectedYear, selectedMonth]);

  const leadStatusHierarchy = [
    'รอติดต่อ (New)',
    'นำเสนอ (Proposing)',
    'มัดจำวัดพื้นที่ (Deposit)',
    'วัดพี้นที่ (Field Service)',
    'เสนอราคา (Quotation)',
    'ชำระเงิน (Payment)',
    'ติดตั้งเรียบร้อย (Site Install)',
    'บริการหลังการขาย (After Sale Service)',
    'ไม่สนใจ',
  ];

  const leadCountsByStatus = useMemo(() => {
    const countMap: Record<string, number> = {};
    leadStatusHierarchy.forEach((s) => (countMap[s] = 0));

    filteredLeadRows.forEach((l) => {
      // Find matching standard status or normalize
      const matched = leadStatusHierarchy.find((s) => l.customerStatus.includes(s.split(' ')[0])) || l.customerStatus;
      countMap[matched] = (countMap[matched] || 0) + 1;
    });

    return leadStatusHierarchy.map((status) => ({
      status,
      count: countMap[status] || 0,
      percentage: filteredLeadRows.length > 0 ? ((countMap[status] || 0) / filteredLeadRows.length) * 100 : 0,
    }));
  }, [filteredLeadRows]);

  // Max value for chart scaling
  const maxMonthlyVal = useMemo(() => {
    const vals = monthlyChartData.map((d) => Math.max(d.quotedPlusActual, d.actual, d.forecast));
    return Math.max(...vals, 1000000);
  }, [monthlyChartData]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition-all ${
          isLight
            ? 'bg-white/90 border-slate-200/90 shadow-lg shadow-slate-200/50'
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
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Dashboard ภาพรวมยอดขาย &amp; รายงาน Lead
              </h1>
              <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                วิเคราะห์เป้ายอดขาย, ยอดขายจริง, ยอดเสนอราคา, Pipeline การนำเสนอ และสถานะ Lead เรียลไทม์
              </p>
            </div>
          </div>

          {/* Filters: Year, Month, Salesperson */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Year Filter */}
            <div className="flex items-center gap-1.5">
              <label className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                ปี:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-500'
                    : 'bg-white/5 border-white/10 text-white focus:border-cyan-400'
                }`}
              >
                <option value="all">ทุกปี (All Years)</option>
                {uniqueYears.map((yr) => (
                  <option key={yr} value={String(yr)}>
                    {yr} (พ.ศ. {yr + 543})
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-1.5">
              <label className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                เดือน:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-500'
                    : 'bg-white/5 border-white/10 text-white focus:border-cyan-400'
                }`}
              >
                <option value="all">ทุกเดือน (ทั้งปี)</option>
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>
                    {MONTH_FULL_TH[m]} ({m})
                  </option>
                ))}
              </select>
            </div>

            {/* Sales Rep Filter */}
            <div className="flex items-center gap-1.5">
              <label className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                พนักงานขาย:
              </label>
              <select
                value={selectedRep}
                onChange={(e) => setSelectedRep(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border max-w-[200px] truncate transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-500'
                    : 'bg-white/5 border-white/10 text-white focus:border-cyan-400'
                }`}
              >
                <option value="all">ทุกคน (All Sales Reps)</option>
                {salesReps.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name} ({r.code || r.nickname})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Metric Cards: Target, Actual, Quoted + Actual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: เป้ายอดขาย (Target Sales) */}
        <div
          className={`p-5 rounded-3xl border relative overflow-hidden transition-all ${
            isLight
              ? 'bg-white/90 border-slate-200 shadow-md'
              : 'liquid-glass-card border-white/10 shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              🎯 เป้ายอดขาย (Target Sales)
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {formatCurrency(targetSalesTotal)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                เป้าหมายแผนก {selectedYear !== 'all' ? `ปี ${selectedYear}` : ''}{' '}
                {selectedMonth !== 'all' ? `(${MONTH_FULL_TH[selectedMonth as keyof typeof MONTH_FULL_TH]})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: ยอดขายจริง (Actual Sales) */}
        <div
          className={`p-5 rounded-3xl border relative overflow-hidden transition-all ${
            isLight
              ? 'bg-white/90 border-slate-200 shadow-md'
              : 'liquid-glass-card border-white/10 shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              💰 ยอดขายจริง (Actual Sales)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatCurrency(actualSalesTotal)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs font-semibold">
              <span
                className={`px-2 py-0.5 rounded-full ${
                  actualSalesTotal >= targetSalesTotal && targetSalesTotal > 0
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                }`}
              >
                บรรลุ {targetSalesTotal > 0 ? ((actualSalesTotal / targetSalesTotal) * 100).toFixed(1) : 0}% ของเป้าหมาย
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: ยอดที่เสนอราคา + ยอดขายจริง (Quotation + Actual) */}
        <div
          className={`p-5 rounded-3xl border relative overflow-hidden transition-all ${
            isLight
              ? 'bg-white/90 border-slate-200 shadow-md'
              : 'liquid-glass-card border-cyan-500/30 shadow-xl shadow-cyan-950/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
              ⚡ ยอดเสนอราคา + ยอดขายจริง (Quoted + Actual)
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-300 tracking-tight">
              {formatCurrency(quotedPlusActualTotal)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                (ยอดเสนอราคาที่ยืนยัน: {formatCurrency(quotedAmountTotal)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Comparison Chart: Actual vs Quoted+Actual vs Forecast */}
        <div
          className={`lg:col-span-2 p-5 sm:p-6 rounded-3xl border transition-all ${
            isLight
              ? 'bg-white/90 border-slate-200 shadow-lg'
              : 'liquid-glass-card border-white/10 shadow-2xl'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-500" />
                กราฟเปรียบเทียบยอดขายที่เกิดขึ้น, ยอดเสนอราคา + ยอดขายจริง &amp; Forecast
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                แสดงแนวโน้มยอดขายรายเดือนในแต่ละมิติข้อมูล
              </p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>ยอดขายจริง</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-500" />
                <span>เสนอราคา + จริง</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Forecast Pipeline</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="mt-6 space-y-4">
            {monthlyChartData.map((d) => (
              <div key={d.month} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold w-16">{d.monthTh}</span>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-emerald-500">จริง: {formatCurrency(d.actual)}</span>
                    <span className="text-cyan-400 font-bold">รวม: {formatCurrency(d.quotedPlusActual)}</span>
                    {d.forecast > 0 && (
                      <span className="text-amber-400 hidden sm:inline">Forecast: {formatCurrency(d.forecast)}</span>
                    )}
                  </div>
                </div>
                {/* Multi-layered bar */}
                <div className="h-5 w-full bg-slate-200/50 dark:bg-white/5 rounded-full overflow-hidden flex relative">
                  {/* Actual bar */}
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${maxMonthlyVal > 0 ? Math.min(100, (d.actual / maxMonthlyVal) * 100) : 0}%`,
                    }}
                    title={`ยอดขายจริง: ${formatCurrency(d.actual)}`}
                  />
                  {/* Quoted extra portion */}
                  {d.quoted > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-sky-500 opacity-80 rounded-r-full transition-all duration-500"
                      style={{
                        width: `${maxMonthlyVal > 0 ? Math.min(100, (d.quoted / maxMonthlyVal) * 100) : 0}%`,
                      }}
                      title={`ส่วนเสนอราคา: ${formatCurrency(d.quoted)}`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Presentation Status Pipeline Card */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border flex flex-col justify-between transition-all ${
            isLight
              ? 'bg-white/90 border-slate-200 shadow-lg'
              : 'liquid-glass-card border-white/10 shadow-2xl'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <PieIcon className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-bold">ยอดในแต่ละสถานะการนำเสนอ</h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  (Forecast Presentation Statuses)
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {forecastByStatus.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  ไม่มีรายการ Forecast ในเงื่อนไขที่เลือก
                </div>
              ) : (
                forecastByStatus.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border transition-all ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="truncate max-w-[180px]">{item.status}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[11px] font-bold">
                        {item.count} ราย
                      </span>
                    </div>
                    <div className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
                      {formatCurrency(item.totalAmount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className={`mt-4 p-3 rounded-2xl border text-xs ${
              isLight ? 'bg-cyan-50/70 border-cyan-200 text-cyan-900' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>รวมยอด Forecast ทั้งหมด:</span>
              <span>
                {formatCurrency(forecastByStatus.reduce((s, i) => s + i.totalAmount, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Lead Status Count Table */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition-all ${
          isLight
            ? 'bg-white/90 border-slate-200 shadow-lg'
            : 'liquid-glass-card border-white/10 shadow-2xl'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                ตารางจำนวน Lead ที่อยู่ในแต่ละสถานะของ Lead
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                รวม Lead ทั้งหมด {filteredLeadRows.length} รายการ (เรียงตามขั้นตอนการขาย)
              </p>
            </div>
          </div>
        </div>

        {/* Lead Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b ${isLight ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                <th className="py-3 px-4 font-bold rounded-l-xl">ลำดับ</th>
                <th className="py-3 px-4 font-bold">สถานะของ Lead (Customer Status)</th>
                <th className="py-3 px-4 font-bold text-center">จำนวน Lead (ราย)</th>
                <th className="py-3 px-4 font-bold">สัดส่วน (%)</th>
                <th className="py-3 px-4 font-bold rounded-r-xl">ความหมายในระบบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leadCountsByStatus.map((row, index) => {
                const isCustomer =
                  row.status.includes('ชำระเงิน') ||
                  row.status.includes('ติดตั้งเรียบร้อย') ||
                  row.status.includes('บริการหลังการขาย');
                return (
                  <tr
                    key={row.status}
                    className={`transition-colors hover:bg-white/[0.04] ${
                      isCustomer ? (isLight ? 'bg-emerald-50/40' : 'bg-emerald-500/[0.05]') : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-bold flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCustomer
                            ? 'bg-emerald-500'
                            : row.status.includes('ไม่สนใจ')
                            ? 'bg-rose-500'
                            : 'bg-cyan-500'
                        }`}
                      />
                      <span>{row.status}</span>
                      {isCustomer && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          นับเป็นลูกค้า
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-sm font-mono">
                      {formatNumber(row.count)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200/50 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isCustomer
                                ? 'bg-emerald-500'
                                : row.status.includes('ไม่สนใจ')
                                ? 'bg-rose-500'
                                : 'bg-cyan-500'
                            }`}
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-400">{row.percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {index === 0 && 'Lead ใหม่ รอเจ้าหน้าที่ติดต่อกลับ'}
                      {index === 1 && 'พูดคุยนำเสนอแบบและประเมินเบื้องต้น'}
                      {index === 2 && 'ลูกค้าชำระเงินมัดจำเข้าวัดพื้นที่'}
                      {index === 3 && 'ช่างเข้าหน้างานวัดขนาดหน้าต่าง/พื้นที่'}
                      {index === 4 && 'ออกใบเสนอราคาอย่างเป็นทางการ'}
                      {index === 5 && 'ลูกค้าชำระเงินค่างวด (นับเป็น Conversion)'}
                      {index === 6 && 'เข้าติดตั้งผ้าม่าน/วอลเปเปอร์เสร็จสิ้น'}
                      {index === 7 && 'ดูแลบริการหลังการขาย/รับประกัน'}
                      {index === 8 && 'ลูกค้ายกเลิกหรือไม่สนใจ'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={`border-t font-black ${isLight ? 'border-slate-300 bg-slate-100 text-slate-900' : 'border-white/20 bg-white/10 text-white'}`}>
                <td colSpan={2} className="py-3 px-4 rounded-l-xl">
                  รวมจำนวน Lead ทั้งหมด
                </td>
                <td className="py-3 px-4 text-center text-base font-mono font-black text-cyan-500">
                  {formatNumber(filteredLeadRows.length)}
                </td>
                <td className="py-3 px-4 font-mono">100.0%</td>
                <td className="py-3 px-4 rounded-r-xl"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
