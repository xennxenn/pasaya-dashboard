import React, { useState, useMemo } from 'react';
import {
  Percent,
  Calendar,
  Filter,
  CheckCircle2,
  Users,
  Globe,
  Store,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { formatNumber } from '../../utils/formatters';
import { MONTH_NAMES, MONTH_FULL_TH } from '../../data/salesDataService';

export const ConversionRateReportView: React.FC = () => {
  const { leadRows, dbConfigRows, uniqueYears, settings } = useSales();
  const isLight = settings.themeMode === 'light';

  // Date range selectors: Start Year/Month to End Year/Month
  const [startYear, setStartYear] = useState<number>(2025);
  const [startMonth, setStartMonth] = useState<number>(1); // January
  const [endYear, setEndYear] = useState<number>(2026);
  const [endMonth, setEndMonth] = useState<number>(12); // December

  // Helper to test if a status counts as a customer
  // Rule: ชำระเงิน (Payment), ติดตั้งเรียบร้อย (Site Install), บริการหลังการขาย (After Sale Service)
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

  // Helper to categorize channel as Online or Offline
  const isOnlineSource = (sourceStr: string): boolean => {
    if (!sourceStr) return false;
    const s = sourceStr.toLowerCase();
    return (
      s.includes('online') ||
      s.includes('facebook') ||
      s.includes('google') ||
      s.includes('web') ||
      s.includes('line') ||
      s.includes('chat') ||
      s.includes('sem') ||
      s.includes('ads') ||
      s.includes('social') ||
      s.includes('tiktok')
    );
  };

  // Filter leads within date range
  const leadsInDateRange = useMemo(() => {
    return leadRows.filter((l) => {
      let yr = 2026;
      let mo = 10;
      if (l.date && l.date.year > 0) {
        yr = l.date.year;
        mo = l.date.month;
      }

      // Check date range boundary
      const leadTime = yr * 100 + mo;
      const startTime = startYear * 100 + startMonth;
      const endTime = endYear * 100 + endMonth;

      return leadTime >= startTime && leadTime <= endTime;
    });
  }, [leadRows, startYear, startMonth, endYear, endMonth]);

  // Build aggregated data for a list of leads grouped by channel
  const aggregateChannels = (leads: typeof leadRows) => {
    const map = new Map<
      string,
      {
        channelName: string;
        isOnline: boolean;
        totalLeads: number;
        customerLeads: number;
        conversionRate: number;
      }
    >();

    leads.forEach((l) => {
      const channel = l.leadSource?.trim() || 'ไม่ระบุแหล่งที่มา';
      const isOnline = isOnlineSource(channel);
      const isCust = isCustomerStatus(l.customerStatus);

      if (!map.has(channel)) {
        map.set(channel, {
          channelName: channel,
          isOnline,
          totalLeads: 0,
          customerLeads: 0,
          conversionRate: 0,
        });
      }

      const item = map.get(channel)!;
      item.totalLeads += 1;
      if (isCust) {
        item.customerLeads += 1;
      }
    });

    const list = Array.from(map.values()).map((item) => ({
      ...item,
      conversionRate: item.totalLeads > 0 ? (item.customerLeads / item.totalLeads) * 100 : 0,
    }));

    return list.sort((a, b) => b.totalLeads - a.totalLeads);
  };

  // 1. All sources dataset
  const allSourcesList = useMemo(() => aggregateChannels(leadsInDateRange), [leadsInDateRange]);

  // 2. Offline sources dataset
  const offlineSourcesList = useMemo(() => {
    const offlineLeads = leadsInDateRange.filter((l) => !isOnlineSource(l.leadSource));
    return aggregateChannels(offlineLeads);
  }, [leadsInDateRange]);

  // 3. Online sources dataset
  const onlineSourcesList = useMemo(() => {
    const onlineLeads = leadsInDateRange.filter((l) => isOnlineSource(l.leadSource));
    return aggregateChannels(onlineLeads);
  }, [leadsInDateRange]);

  // Summary KPI metrics
  const totalAllLeads = leadsInDateRange.length;
  const totalCustomerLeads = leadsInDateRange.filter((l) => isCustomerStatus(l.customerStatus)).length;
  const overallCR = totalAllLeads > 0 ? (totalCustomerLeads / totalAllLeads) * 100 : 0;

  const totalOfflineLeads = leadsInDateRange.filter((l) => !isOnlineSource(l.leadSource)).length;
  const customerOfflineLeads = leadsInDateRange.filter(
    (l) => !isOnlineSource(l.leadSource) && isCustomerStatus(l.customerStatus)
  ).length;
  const offlineCR = totalOfflineLeads > 0 ? (customerOfflineLeads / totalOfflineLeads) * 100 : 0;

  const totalOnlineLeads = leadsInDateRange.filter((l) => isOnlineSource(l.leadSource)).length;
  const customerOnlineLeads = leadsInDateRange.filter(
    (l) => isOnlineSource(l.leadSource) && isCustomerStatus(l.customerStatus)
  ).length;
  const onlineCR = totalOnlineLeads > 0 ? (customerOnlineLeads / totalOnlineLeads) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Date Range Picker */}
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
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
              }`}
            >
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Conversion Rate Report (อัตราส่วนการปิดการขาย)
              </h1>
              <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                วิเคราะห์ Conversion Rate จากจำนวน Lead ทั้งหมดเทียบกับ Lead ที่เป็นลูกค้า (ชำระเงิน, ติดตั้งเรียบร้อย, บริการหลังการขาย)
              </p>
            </div>
          </div>

          {/* Date Range Picker: Start Month/Year to End Month/Year */}
          <div className="flex flex-wrap items-center gap-2 bg-black/20 p-2.5 rounded-2xl border border-white/10">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              ตั้งแต่:
            </span>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(parseInt(e.target.value, 10))}
              className={`px-2 py-1 rounded-xl text-xs font-bold border ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-white/10 border-white/15 text-white'
              }`}
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {MONTH_FULL_TH[m]}
                </option>
              ))}
            </select>
            <select
              value={startYear}
              onChange={(e) => setStartYear(parseInt(e.target.value, 10))}
              className={`px-2 py-1 rounded-xl text-xs font-bold border ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-white/10 border-white/15 text-white'
              }`}
            >
              {uniqueYears.map((yr) => (
                <option key={yr} value={yr}>
                  ปี {yr}
                </option>
              ))}
            </select>

            <ArrowRight className="w-4 h-4 text-slate-400 mx-1" />

            <span className="text-xs font-bold text-slate-300">ถึง:</span>
            <select
              value={endMonth}
              onChange={(e) => setEndMonth(parseInt(e.target.value, 10))}
              className={`px-2 py-1 rounded-xl text-xs font-bold border ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-white/10 border-white/15 text-white'
              }`}
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {MONTH_FULL_TH[m]}
                </option>
              ))}
            </select>
            <select
              value={endYear}
              onChange={(e) => setEndYear(parseInt(e.target.value, 10))}
              className={`px-2 py-1 rounded-xl text-xs font-bold border ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-white/10 border-white/15 text-white'
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

      {/* KPI Cards: Overall, Offline, Online CR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall CR */}
        <div
          className={`p-5 rounded-3xl border transition-all ${
            isLight ? 'bg-white/90 border-slate-200 shadow-md' : 'liquid-glass-card border-white/10 shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              📊 Conversion Rate รวมทั้งหมด
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-cyan-400 font-mono tracking-tight">
              {overallCR.toFixed(1)}%
            </div>
            <p className={`text-xs mt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              ลูกค้า {totalCustomerLeads} ราย จาก Lead ทั้งหมด {totalAllLeads} ราย
            </p>
          </div>
        </div>

        {/* Offline CR */}
        <div
          className={`p-5 rounded-3xl border transition-all ${
            isLight ? 'bg-white/90 border-slate-200 shadow-md' : 'liquid-glass-card border-white/10 shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              🏬 Conversion Rate รูปแบบ Offline
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
              {offlineCR.toFixed(1)}%
            </div>
            <p className={`text-xs mt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              ลูกค้า {customerOfflineLeads} ราย จาก Lead Offline {totalOfflineLeads} ราย
            </p>
          </div>
        </div>

        {/* Online CR */}
        <div
          className={`p-5 rounded-3xl border transition-all ${
            isLight ? 'bg-white/90 border-slate-200 shadow-md' : 'liquid-glass-card border-white/10 shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              🌐 Conversion Rate รูปแบบ Online
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {onlineCR.toFixed(1)}%
            </div>
            <p className={`text-xs mt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              ลูกค้า {customerOnlineLeads} ราย จาก Lead Online {totalOnlineLeads} ราย
            </p>
          </div>
        </div>
      </div>

      {/* SECTION: 3 Distinct Tables (1 ตารางแสดง 1 รูปแบบที่มา) */}
      <div className="space-y-8">
        {/* TABLE 1: รูปแบบที่มาทั้งหมด (All Sources) */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border transition-all ${
            isLight ? 'bg-white/90 border-slate-200 shadow-xl' : 'liquid-glass-card border-white/10 shadow-2xl'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 font-bold">1</div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  ตารางที่ 1: เปรียบเทียบ Conversion Rate รูปแบบที่มาทั้งหมด (All Sources)
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  รวมทุกช่องทางที่มาของ Lead พร้อมคำนวณอัตราส่วนการปิดการขาย
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto mt-4 rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b font-bold ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-white/10 text-slate-200'}`}>
                  <th className="py-3 px-4 min-w-[200px]">แหล่งที่มาของ Lead (Lead Source)</th>
                  <th className="py-3 px-3 text-center">ประเภท</th>
                  <th className="py-3 px-4 text-center font-bold">จำนวน Lead ทั้งหมด (ราย)</th>
                  <th className="py-3 px-4 text-center font-bold text-emerald-400">จำนวนที่เป็นลูกค้า (ราย)</th>
                  <th className="py-3 px-4 text-right font-black text-cyan-400">Conversion Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {allSourcesList.map((row) => (
                  <tr key={row.channelName} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-slate-100">{row.channelName}</td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.isOnline
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {row.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">{row.totalLeads}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400">{row.customerLeads}</td>
                    <td className="py-3 px-4 text-right font-black text-cyan-400 text-sm">
                      {row.conversionRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={`border-t font-black ${isLight ? 'bg-slate-200/70 text-slate-900' : 'bg-white/15 text-white'}`}>
                  <td colSpan={2} className="py-3.5 px-4 font-sans">
                    รวมทุกช่องทางที่มา
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">{totalAllLeads}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-emerald-400">{totalCustomerLeads}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-cyan-400 text-base">
                    {overallCR.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* TABLE 2: รูปแบบที่มาแบบ Offline */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border transition-all ${
            isLight ? 'bg-white/90 border-slate-200 shadow-xl' : 'liquid-glass-card border-white/10 shadow-2xl'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 font-bold">2</div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-400" />
                  ตารางที่ 2: เปรียบเทียบ Conversion Rate รูปแบบที่มาแบบ Offline
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  (Showroom Walk-in, Turnkey Architects, Customer Referral, Events ฯลฯ)
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto mt-4 rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b font-bold ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-white/10 text-slate-200'}`}>
                  <th className="py-3 px-4 min-w-[200px]">ช่องทาง Offline (Offline Channel)</th>
                  <th className="py-3 px-4 text-center font-bold">จำนวน Lead ทั้งหมด (ราย)</th>
                  <th className="py-3 px-4 text-center font-bold text-emerald-400">จำนวนที่เป็นลูกค้า (ราย)</th>
                  <th className="py-3 px-4 text-right font-black text-amber-400">Conversion Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {offlineSourcesList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 font-sans">
                      ไม่มีข้อมูล Lead ในช่องทาง Offline ในช่วงเวลาที่เลือก
                    </td>
                  </tr>
                ) : (
                  offlineSourcesList.map((row) => (
                    <tr key={row.channelName} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-4 font-sans font-bold text-slate-100">{row.channelName}</td>
                      <td className="py-3 px-4 text-center font-bold">{row.totalLeads}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">{row.customerLeads}</td>
                      <td className="py-3 px-4 text-right font-black text-amber-400 text-sm">
                        {row.conversionRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className={`border-t font-black ${isLight ? 'bg-slate-200/70 text-slate-900' : 'bg-white/15 text-white'}`}>
                  <td className="py-3.5 px-4 font-sans">รวมช่องทาง Offline ทั้งหมด</td>
                  <td className="py-3.5 px-4 text-center font-mono">{totalOfflineLeads}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-emerald-400">{customerOfflineLeads}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-amber-400 text-base">
                    {offlineCR.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* TABLE 3: รูปแบบที่มาแบบ Online */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border transition-all ${
            isLight ? 'bg-white/90 border-slate-200 shadow-xl' : 'liquid-glass-card border-white/10 shadow-2xl'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">3</div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  ตารางที่ 3: เปรียบเทียบ Conversion Rate รูปแบบที่มาแบบ Online
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  (Facebook Ads, Google Search / Website, LINE OA, Social Media ฯลฯ)
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto mt-4 rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b font-bold ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-white/10 text-slate-200'}`}>
                  <th className="py-3 px-4 min-w-[200px]">ช่องทาง Online (Online Channel)</th>
                  <th className="py-3 px-4 text-center font-bold">จำนวน Lead ทั้งหมด (ราย)</th>
                  <th className="py-3 px-4 text-center font-bold text-emerald-400">จำนวนที่เป็นลูกค้า (ราย)</th>
                  <th className="py-3 px-4 text-right font-black text-emerald-400">Conversion Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {onlineSourcesList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 font-sans">
                      ไม่มีข้อมูล Lead ในช่องทาง Online ในช่วงเวลาที่เลือก
                    </td>
                  </tr>
                ) : (
                  onlineSourcesList.map((row) => (
                    <tr key={row.channelName} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-4 font-sans font-bold text-slate-100">{row.channelName}</td>
                      <td className="py-3 px-4 text-center font-bold">{row.totalLeads}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">{row.customerLeads}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-400 text-sm">
                        {row.conversionRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className={`border-t font-black ${isLight ? 'bg-slate-200/70 text-slate-900' : 'bg-white/15 text-white'}`}>
                  <td className="py-3.5 px-4 font-sans">รวมช่องทาง Online ทั้งหมด</td>
                  <td className="py-3.5 px-4 text-center font-mono">{totalOnlineLeads}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-emerald-400">{customerOnlineLeads}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400 text-base">
                    {onlineCR.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
