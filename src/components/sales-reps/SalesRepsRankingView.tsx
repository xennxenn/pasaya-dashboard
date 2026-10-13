import React, { useState, useMemo } from 'react';
import {
  Award,
  Crown,
  Medal,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  UserCheck,
  ShoppingBag,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { MONTH_NAMES, MONTH_FULL_TH } from '../../data/salesDataService';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export const SalesRepsRankingView: React.FC = () => {
  const { records, salesReps } = useSales();

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = all months (YTD/Annual)

  // Filter records for individual sales reps
  const repRecords = useMemo(() => {
    return records.filter(
      (r) =>
        r.year === selectedYear &&
        r.salesPerson !== 'รวมทั้งหมด' &&
        (selectedMonth === 0 || r.monthNum === selectedMonth)
    );
  }, [records, selectedYear, selectedMonth]);

  // Aggregate by sales rep name
  const repStats = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        mto: number;
        fabric: number;
        bedding: number;
        total: number;
        orders: number;
        bestRank: number;
      }
    >();

    repRecords.forEach((r) => {
      const cur = map.get(r.salesPerson) || {
        name: r.salesPerson,
        mto: 0,
        fabric: 0,
        bedding: 0,
        total: 0,
        orders: 0,
        bestRank: 999,
      };

      cur.mto += r.salesMTO;
      cur.fabric += r.salesFabric;
      cur.bedding += r.salesBedding;
      cur.total += r.salesTotal;
      cur.orders += r.orders;
      if (r.rank && r.rank < cur.bestRank) cur.bestRank = r.rank;

      map.set(r.salesPerson, cur);
    });

    const list = Array.from(map.values()).sort((a, b) => b.total - a.total);
    return list;
  }, [repRecords]);

  const grandTotal = useMemo(() => {
    return repStats.reduce((sum, r) => sum + r.total, 0);
  }, [repStats]);

  const top3 = repStats.slice(0, 3);

  // Helper to find avatar from salesReps
  const getRepDetails = (name: string) => {
    return salesReps.find((s) => s.name === name || name.includes(s.nickname));
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-400" />
            <span>อันดับและผลงานทีมงานขาย (Sales Rep Leaderboard)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ติดตามยอดขายรายคน จัดอันดับ Top Performer และวิเคราะห์สัดส่วนความสำเร็จ
          </p>
        </div>

        {/* Filter Strip */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value={2026} className="bg-slate-900">ปี 2026</option>
              <option value={2025} className="bg-slate-900">ปี 2025</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value={0} className="bg-slate-900">ทุกเดือน (สะสมทั้งปี / YTD)</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1} className="bg-slate-900">
                  เดือน {idx + 1}: {MONTH_FULL_TH[m]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Podium Top 3 Cards - Liquid Glass iOS 27 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="order-2 md:order-1 rounded-3xl liquid-glass specular-rim p-6 flex flex-col items-center text-center relative overflow-hidden transition-all hover:scale-[1.01]">
              <div className="absolute top-4 left-4 text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-300/10 text-slate-200 border border-white/20 backdrop-blur-md">
                🥈 อันดับ 2
              </div>
              <div className="w-20 h-20 rounded-2xl border-2 border-slate-300/40 p-1 mb-3 bg-slate-900/60 overflow-hidden shadow-xl mt-4">
                <img
                  src={
                    getRepDetails(top3[1].name)?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[1].name)}&background=334155&color=fff`
                  }
                  alt={top3[1].name}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-base font-bold text-white tracking-wide">{top3[1].name}</h3>
              <div className="text-xs text-slate-400 mt-0.5">
                {getRepDetails(top3[1].name)?.branch || 'Curtain Specialist'}
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-300 mt-3 tracking-tight">
                {formatCurrency(top3[1].total, true)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                สัดส่วน: {grandTotal > 0 ? ((top3[1].total / grandTotal) * 100).toFixed(1) : 0}% • {top3[1].orders} ออเดอร์
              </div>
            </div>
          )}

          {/* 1st Place (Champion) */}
          {top3[0] && (
            <div className="order-1 md:order-2 rounded-3xl liquid-glass specular-rim p-7 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-amber-500/[0.08] via-transparent to-transparent border-amber-400/40 shadow-2xl shadow-amber-950/40 transition-all hover:scale-[1.02]">
              <div className="absolute top-4 left-4 text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>🥇 อันดับ 1 Champion</span>
              </div>
              <div className="w-24 h-24 rounded-2xl border-2 border-amber-400/70 p-1 mb-3 bg-slate-900/60 overflow-hidden shadow-2xl shadow-amber-500/30 mt-5">
                <img
                  src={
                    getRepDetails(top3[0].name)?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[0].name)}&background=b45309&color=fff`
                  }
                  alt={top3[0].name}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-lg font-bold text-amber-200 tracking-wide">{top3[0].name}</h3>
              <div className="text-xs text-slate-300 mt-0.5">
                {getRepDetails(top3[0].name)?.branch || 'Top Curtain Consultant'}
              </div>
              <div className="text-3xl font-bold font-mono text-amber-300 mt-3 tracking-tight">
                {formatCurrency(top3[0].total, true)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                ครองสัดส่วน: {grandTotal > 0 ? ((top3[0].total / grandTotal) * 100).toFixed(1) : 0}% • {top3[0].orders} ออเดอร์
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="order-3 md:order-3 rounded-3xl liquid-glass specular-rim p-6 flex flex-col items-center text-center relative overflow-hidden transition-all hover:scale-[1.01]">
              <div className="absolute top-4 left-4 text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-700/20 text-amber-400 border border-amber-600/30 backdrop-blur-md">
                🥉 อันดับ 3
              </div>
              <div className="w-20 h-20 rounded-2xl border-2 border-amber-700/40 p-1 mb-3 bg-slate-900/60 overflow-hidden shadow-xl mt-4">
                <img
                  src={
                    getRepDetails(top3[2].name)?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[2].name)}&background=78350f&color=fff`
                  }
                  alt={top3[2].name}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-base font-bold text-white tracking-wide">{top3[2].name}</h3>
              <div className="text-xs text-slate-400 mt-0.5">
                {getRepDetails(top3[2].name)?.branch || 'Curtain Specialist'}
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-300 mt-3 tracking-tight">
                {formatCurrency(top3[2].total, true)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                สัดส่วน: {grandTotal > 0 ? ((top3[2].total / grandTotal) * 100).toFixed(1) : 0}% • {top3[2].orders} ออเดอร์
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete Rankings Table */}
      <div className="rounded-2xl glass-panel border border-cyan-500/20 overflow-hidden shadow-xl">
        <div className="px-5 py-4 bg-slate-900/80 border-b border-cyan-500/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              ตารางสรุปผลงานพนักงานขายทั้งหมด ({repStats.length} ท่าน)
            </h3>
          </div>
          <div className="text-xs font-mono text-cyan-300">
            ยอดรวมทั้งหมด: {formatCurrency(grandTotal, true)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[#050e1f] text-slate-300 border-b border-slate-700/60 uppercase text-[11px] font-semibold">
                <th className="px-4 py-3 text-center w-14">อันดับ</th>
                <th className="px-5 py-3">พนักงานขาย</th>
                <th className="px-4 py-3">สาขา / สังกัด</th>
                <th className="px-4 py-3 text-right">ยอดขาย MTO</th>
                <th className="px-4 py-3 text-right">ยอดขาย ผ้า</th>
                <th className="px-4 py-3 text-right">ยอดขาย ผ้าปูที่นอน</th>
                <th className="px-5 py-3 text-right font-bold text-cyan-300">
                  ยอดขายรวมทั้งหมด
                </th>
                <th className="px-4 py-3 text-center">จำนวน Orders</th>
                <th className="px-5 py-3 text-right">ส่วนแบ่งยอดขาย (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono tabular-nums">
              {repStats.map((rep, idx) => {
                const repMeta = getRepDetails(rep.name);
                const share = grandTotal > 0 ? (rep.total / grandTotal) * 100 : 0;
                const rank = idx + 1;

                return (
                  <tr
                    key={rep.name}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-center">
                      {rank === 1 ? (
                        <span className="font-bold text-amber-400">#1 👑</span>
                      ) : rank === 2 ? (
                        <span className="font-bold text-slate-300">#2 🥈</span>
                      ) : rank === 3 ? (
                        <span className="font-bold text-amber-600">#3 🥉</span>
                      ) : (
                        <span className="text-slate-500 font-sans">#{rank}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            repMeta?.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(rep.name)}&background=1e293b&color=fff`
                          }
                          alt={rep.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="font-sans">
                          <div className="font-semibold text-white">{rep.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {repMeta?.code || `PSY-${String(idx + 1).padStart(3, '0')}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-sans text-slate-300">
                      {repMeta?.branch || 'Flagship Curtain Center'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-200">
                      {rep.mto > 0 ? formatCurrency(rep.mto) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {rep.fabric > 0 ? formatCurrency(rep.fabric) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {rep.bedding > 0 ? formatCurrency(rep.bedding) : '-'}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-cyan-300 text-sm">
                      {formatCurrency(rep.total, true)}
                    </td>
                    <td className="px-4 py-3 text-center text-emerald-400">
                      {rep.orders > 0 ? rep.orders : '-'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, share * 3)}%` }}
                            className="h-full bg-cyan-400 rounded-full"
                          />
                        </div>
                        <span className="font-bold text-slate-200 w-12 text-right">
                          {share.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
