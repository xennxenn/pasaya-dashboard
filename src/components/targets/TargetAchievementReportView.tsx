import React, { useState, useMemo } from 'react';
import {
  Target,
  Trophy,
  CheckCircle2,
  XCircle,
  Edit2,
  Calendar,
  Search,
  Filter,
  Check,
  X,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { MONTH_NAMES, MONTH_FULL_TH } from '../../data/salesDataService';

export const TargetAchievementReportView: React.FC = () => {
  const { records, salesReps, targets, updateIndividualTarget, uniqueYears, settings } = useSales();
  const isLight = settings.themeMode === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');

  // Editing state for inline target modification
  const [editingKey, setEditingKey] = useState<string | null>(null); // `${year}-${monthNum}-${repId}`
  const [editValue, setEditValue] = useState<number>(1000000);

  // Group records by Year and Month, sorted latest month first globally
  const monthlyAchievementData = useMemo(() => {
    // Generate all year + month combos from records and targets
    interface MonthItem {
      year: number;
      monthNum: number;
      monthName: string;
      key: string;
      repAchievements: {
        repId: string;
        repName: string;
        repCode: string;
        target: number;
        actualSales: number;
        orders: number;
        achievementRate: number;
        isAchieved: boolean;
        diff: number;
        rank: number;
      }[];
      totalTarget: number;
      totalActual: number;
      totalOrders: number;
      overallAchievementRate: number;
    }

    const map = new Map<string, { year: number; monthNum: number; monthName: string }>();

    // Collect all months that have records
    records.forEach((r) => {
      if (r.year && r.monthNum) {
        const key = `${r.year}-${r.monthNum}`;
        if (!map.has(key)) {
          map.set(key, { year: r.year, monthNum: r.monthNum, monthName: r.month });
        }
      }
    });

    // Ensure 2026 current months are present
    [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].forEach((mNum) => {
      const key = `2026-${mNum}`;
      if (!map.has(key)) {
        map.set(key, { year: 2026, monthNum: mNum, monthName: MONTH_NAMES[mNum - 1] });
      }
    });

    // Convert map to array and sort latest month first
    const sortedMonthKeys = Array.from(map.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.monthNum - a.monthNum;
    });

    const activeReps = salesReps.filter((r) => r.status === 'active');

    const result: MonthItem[] = [];

    sortedMonthKeys.forEach(({ year, monthNum, monthName }) => {
      if (selectedYearFilter !== 'all' && String(year) !== selectedYearFilter) {
        return;
      }

      // Find monthly target object
      const targetObj = targets.find((t) => t.year === year && t.monthNum === monthNum);

      // Build achievements for each sales rep
      const repAchievements = activeReps
        .map((rep) => {
          // Default target is 1,000,000 Baht per prompt specification
          const target = targetObj?.individualTargets?.[rep.id] ?? 1000000;

          // Find records for this rep, year, month
          const repRecord = records.find(
            (r) =>
              r.salesPerson === rep.name &&
              r.year === year &&
              r.monthNum === monthNum
          );

          const actualSales = repRecord?.salesTotal || 0;
          const orders = repRecord?.orders || 0;
          const achievementRate = target > 0 ? (actualSales / target) * 100 : 0;
          const isAchieved = actualSales >= target && target > 0;
          const diff = actualSales - target;

          return {
            repId: rep.id,
            repName: rep.name,
            repCode: rep.code || '-',
            target,
            actualSales,
            orders,
            achievementRate,
            isAchieved,
            diff,
            rank: 1, // Will assign rank based on actual sales
          };
        })
        .filter((item) => {
          if (!searchTerm) return true;
          const q = searchTerm.toLowerCase();
          return item.repName.toLowerCase().includes(q) || item.repCode.toLowerCase().includes(q);
        });

      // Sort by actual sales descending to assign rank
      repAchievements.sort((a, b) => b.actualSales - a.actualSales);
      repAchievements.forEach((item, idx) => {
        item.rank = idx + 1;
      });

      const totalTarget = repAchievements.reduce((s, i) => s + i.target, 0);
      const totalActual = repAchievements.reduce((s, i) => s + i.actualSales, 0);
      const totalOrders = repAchievements.reduce((s, i) => s + i.orders, 0);
      const overallAchievementRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

      // Only include month if it has data or is 2026
      if (repAchievements.length > 0 && (totalActual > 0 || year >= 2025)) {
        result.push({
          year,
          monthNum,
          monthName,
          key: `${year}-${monthNum}`,
          repAchievements,
          totalTarget,
          totalActual,
          totalOrders,
          overallAchievementRate,
        });
      }
    });

    return result;
  }, [records, salesReps, targets, selectedYearFilter, searchTerm]);

  // Handle saving inline target edit
  const handleSaveTarget = (year: number, monthNum: number, repId: string) => {
    updateIndividualTarget(year, monthNum, repId, editValue);
    setEditingKey(null);
  };

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
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
              }`}
            >
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Target vs Achievement Report
              </h1>
              <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                รายงานการบรรลุเป้าหมายยอดขายรายคน ลำดับ Rank จำนวนออเดอร์ (Default เป้า 1,000,000 บาท สามารถปรับแก้ไขได้)
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <label className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                ปี:
              </label>
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800'
                    : 'bg-white/5 border-white/10 text-white'
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

      {/* Monthly Tables: เดือนล่าสุดอยู่ด้านบนเสมอ */}
      <div className="space-y-6">
        {monthlyAchievementData.map((mItem) => (
          <div
            key={mItem.key}
            className={`p-5 sm:p-6 rounded-3xl border transition-all ${
              isLight
                ? 'bg-white/90 border-slate-200 shadow-xl'
                : 'liquid-glass-card border-white/10 shadow-2xl'
            }`}
          >
            {/* Month Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 font-bold font-mono">
                  {MONTH_FULL_TH[mItem.monthName as keyof typeof MONTH_FULL_TH]} {mItem.year}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    ผลงานประจำเดือน {MONTH_FULL_TH[mItem.monthName as keyof typeof MONTH_FULL_TH]} {mItem.year}
                  </h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    เป้าหมายทีม: <span className="font-mono">{formatCurrency(mItem.totalTarget)}</span> | ยอดจริง:{' '}
                    <span className="font-mono text-cyan-400 font-bold">{formatCurrency(mItem.totalActual)}</span> ({mItem.overallAchievementRate.toFixed(1)}%)
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    mItem.totalActual >= mItem.totalTarget && mItem.totalTarget > 0
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {mItem.totalActual >= mItem.totalTarget && mItem.totalTarget > 0
                    ? '🎉 แผนกบรรลุเป้าหมาย'
                    : '⚡ อยู่ระหว่างทำเป้าหมาย'}
                </span>
              </div>
            </div>

            {/* Table */}
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
                    <th className="py-3 px-3 text-center w-14 font-bold">ลำดับ</th>
                    <th className="py-3 px-3 w-20 font-mono">รหัส</th>
                    <th className="py-3 px-4 min-w-[180px]">ชื่อพนักงานขาย</th>
                    <th className="py-3 px-4 text-right min-w-[130px]">
                      เป้ายอดขาย (บาท)
                      <span className="text-[10px] block text-cyan-400 font-normal">กดแก้ไขได้</span>
                    </th>
                    <th className="py-3 px-4 text-right min-w-[130px]">ยอดขายจริง</th>
                    <th className="py-3 px-3 text-center min-w-[80px]">จำนวนออเดอร์</th>
                    <th className="py-3 px-4 text-right min-w-[110px]">บรรลุเป้า (%)</th>
                    <th className="py-3 px-3 text-center min-w-[110px]">สถานะ</th>
                    <th className="py-3 px-4 text-right min-w-[120px]">ส่วนต่าง (+/-)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {mItem.repAchievements.map((rep) => {
                    const rowKey = `${mItem.year}-${mItem.monthNum}-${rep.repId}`;
                    const isEditing = editingKey === rowKey;

                    return (
                      <tr key={rep.repId} className="hover:bg-white/[0.03] transition-colors">
                        {/* Rank Badge */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                              rep.rank === 1
                                ? 'bg-amber-400 text-slate-900 shadow-md shadow-amber-400/30'
                                : rep.rank === 2
                                ? 'bg-slate-300 text-slate-900'
                                : rep.rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-white/10 text-slate-400'
                            }`}
                          >
                            {rep.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-cyan-400 font-bold">{rep.repCode}</td>
                        <td className="py-3 px-4 font-sans font-bold text-slate-100">{rep.repName}</td>

                        {/* Editable Target */}
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(Number(e.target.value))}
                                className="w-24 px-1.5 py-0.5 text-xs text-right rounded bg-black/40 border border-cyan-400 text-white font-mono"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveTarget(mItem.year, mItem.monthNum, rep.repId)}
                                className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingKey(null)}
                                className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingKey(rowKey);
                                setEditValue(rep.target);
                              }}
                              className="group flex items-center justify-end gap-1.5 cursor-pointer hover:text-cyan-400 transition-colors"
                              title="คลิกเพื่อปรับเปลี่ยนเป้ายอดขาย"
                            >
                              <span>{formatCurrency(rep.target)}</span>
                              <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>

                        {/* Actual Sales */}
                        <td className="py-3 px-4 text-right font-black text-cyan-300">
                          {formatCurrency(rep.actualSales)}
                        </td>

                        {/* Orders */}
                        <td className="py-3 px-3 text-center text-slate-300 font-bold">
                          {rep.orders > 0 ? `${rep.orders} ออเดอร์` : '-'}
                        </td>

                        {/* % Achievement */}
                        <td className="py-3 px-4 text-right font-black">
                          <span
                            className={
                              rep.achievementRate >= 100
                                ? 'text-emerald-400'
                                : rep.achievementRate >= 75
                                ? 'text-cyan-400'
                                : 'text-amber-400'
                            }
                          >
                            {rep.achievementRate.toFixed(1)}%
                          </span>
                        </td>

                        {/* Is Achieved Badge */}
                        <td className="py-3 px-3 text-center font-sans">
                          {rep.isAchieved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              บรรลุเป้า
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              ยังไม่บรรลุ
                            </span>
                          )}
                        </td>

                        {/* Diff */}
                        <td
                          className={`py-3 px-4 text-right font-bold ${
                            rep.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {rep.diff >= 0 ? `+${formatCurrency(rep.diff)}` : formatCurrency(rep.diff)}
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
                    <td colSpan={3} className="py-3.5 px-4 font-sans">
                      รวมทั้งแผนก (เดือน {MONTH_FULL_TH[mItem.monthName as keyof typeof MONTH_FULL_TH]} {mItem.year})
                    </td>
                    <td className="py-3.5 px-4 text-right">{formatCurrency(mItem.totalTarget)}</td>
                    <td className="py-3.5 px-4 text-right text-cyan-400 text-sm">
                      {formatCurrency(mItem.totalActual)}
                    </td>
                    <td className="py-3.5 px-3 text-center">{mItem.totalOrders} ออเดอร์</td>
                    <td className="py-3.5 px-4 text-right text-emerald-400">
                      {mItem.overallAchievementRate.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-3 text-center font-sans">
                      {mItem.totalActual >= mItem.totalTarget ? 'บรรลุเป้า' : 'ไม่บรรลุ'}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right ${
                        mItem.totalActual - mItem.totalTarget >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(mItem.totalActual - mItem.totalTarget)}
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
