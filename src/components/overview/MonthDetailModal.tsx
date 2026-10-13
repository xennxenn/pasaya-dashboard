import React from 'react';
import {
  X,
  Award,
  Calendar,
  DollarSign,
  ShoppingBag,
  Users,
  Target,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { MONTH_FULL_TH, MONTH_SHORT_EN } from '../../data/salesDataService';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

export const MonthDetailModal: React.FC = () => {
  const {
    selectedMonthDetail,
    setSelectedMonthDetail,
    records,
    yearlyOverviewData,
    targets,
    settings,
  } = useSales();

  if (!selectedMonthDetail) return null;

  const isLight = settings.themeMode === 'light';
  const { year, monthNum, monthName } = selectedMonthDetail;

  // Find summary stats for this year & month
  const currentYearOverview = yearlyOverviewData.find((y) => y.year === year);

  const monthTotal = currentYearOverview?.total[monthNum] || 0;
  const monthMTO = currentYearOverview?.mto[monthNum] || 0;
  const monthFabric = currentYearOverview?.fabric[monthNum] || 0;
  const monthBedding = currentYearOverview?.bedding[monthNum] || 0;
  const monthOrders = currentYearOverview?.orders[monthNum] || 0;
  const monthAvgTicket = currentYearOverview?.avgTicket[monthNum] || 0;
  const growthYoY = currentYearOverview?.growthYoY[monthNum];

  // Target for this month
  const monthTargetObj = targets.find((t) => t.year === year && t.monthNum === monthNum);
  const teamTarget = monthTargetObj?.teamTarget || 0;
  const targetPct = teamTarget > 0 ? (monthTotal / teamTarget) * 100 : 0;

  // Individual Sales Reps rows for this month
  const repRows = records
    .filter(
      (r) =>
        r.year === year &&
        r.monthNum === monthNum &&
        r.salesPerson !== 'รวมทั้งหมด'
    )
    .sort((a, b) => (a.rank || 999) - (b.rank || 999));

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-md animate-fade-in ${
        isLight ? 'bg-slate-900/35' : 'bg-black/80'
      }`}
      onClick={() => setSelectedMonthDetail(null)}
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800 shadow-[0_24px_60px_rgba(15,23,42,0.18)]'
            : 'liquid-glass-modal specular-rim border-white/20 text-white shadow-[0_32px_80px_rgba(0,0,0,0.85)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'border-white/10 bg-gradient-to-r from-white/[0.08] via-cyan-500/[0.06] to-transparent'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`p-2.5 rounded-2xl ${
                isLight
                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={`text-lg sm:text-xl font-bold tracking-wide flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                <span>
                  รายละเอียดประจำเดือน {MONTH_SHORT_EN[monthName]} ({MONTH_FULL_TH[monthName]}) {year}
                </span>
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                เจาะลึกผลงานทีมขาย สัดส่วนยอดจำหน่าย MTO / ผ้า / ผ้าปูที่นอน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedMonthDetail(null)}
            className={`p-2 rounded-xl transition-colors ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top Monthly Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div
              className={`p-3.5 rounded-2xl border ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-900/70 border-slate-700/60'
              }`}
            >
              <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                ยอดขายรวมประจำเดือน
              </div>
              <div
                className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
                  isLight ? 'text-cyan-800' : 'text-cyan-300'
                }`}
              >
                {monthTotal > 0 ? formatCurrency(monthTotal, true) : '-'}
              </div>
              <div className="text-[11px] mt-1.5 flex items-center gap-1">
                {growthYoY !== null && growthYoY !== undefined ? (
                  <span
                    className={`font-mono font-semibold ${
                      growthYoY >= 0
                        ? isLight
                          ? 'text-emerald-700'
                          : 'text-emerald-400'
                        : isLight
                        ? 'text-rose-700'
                        : 'text-rose-400'
                    }`}
                  >
                    YoY: {formatPercent(growthYoY)}
                  </span>
                ) : (
                  <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>-</span>
                )}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-900/70 border-slate-700/60'
              }`}
            >
              <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                ยอดขาย MTO (สั่งตัด)
              </div>
              <div
                className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {monthMTO > 0 ? formatCurrency(monthMTO, true) : '-'}
              </div>
              <div className={`text-[11px] mt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                คิดเป็น {monthTotal > 0 ? ((monthMTO / monthTotal) * 100).toFixed(1) : 0}% ของยอด
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-900/70 border-slate-700/60'
              }`}
            >
              <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                จำนวนคำสั่งซื้อ (Orders)
              </div>
              <div
                className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
                  isLight ? 'text-emerald-700' : 'text-emerald-400'
                }`}
              >
                {monthOrders > 0 ? `${formatNumber(monthOrders)} ออเดอร์` : '-'}
              </div>
              <div className={`text-[11px] mt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                เฉลี่ย (เฉพาะ MTO): {monthOrders > 0 ? `฿${formatNumber(monthAvgTicket)}` : '-'}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-900/70 border-slate-700/60'
              }`}
            >
              <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                เป้าหมายประจำเดือน (KPI)
              </div>
              <div
                className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
                  isLight ? 'text-amber-700' : 'text-amber-400'
                }`}
              >
                {teamTarget > 0 && monthTotal > 0 ? `${targetPct.toFixed(1)}%` : '-'}
              </div>
              <div className={`text-[11px] mt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                เป้าทีม: {formatCurrency(teamTarget, true)}
              </div>
            </div>
          </div>

          {/* Product Category Breakdown Bar */}
          {monthTotal > 0 && (
            <div
              className={`p-4 rounded-2xl border space-y-2 ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div
                className={`flex items-center justify-between text-xs font-medium ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                <span>สัดส่วนยอดขายตามหมวดหมู่สินค้า</span>
                <span className={`font-mono font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
                  รวม 100%
                </span>
              </div>

              <div
                className={`w-full h-3.5 rounded-full overflow-hidden flex ${
                  isLight ? 'bg-slate-200' : 'bg-slate-800'
                }`}
              >
                <div
                  style={{
                    width: `${monthTotal > 0 ? (monthMTO / monthTotal) * 100 : 0}%`,
                  }}
                  className="bg-cyan-600 hover:opacity-90 transition-all"
                />
                <div
                  style={{
                    width: `${monthTotal > 0 ? (monthFabric / monthTotal) * 100 : 0}%`,
                  }}
                  className="bg-purple-600 hover:opacity-90 transition-all"
                />
                <div
                  style={{
                    width: `${monthTotal > 0 ? (monthBedding / monthTotal) * 100 : 0}%`,
                  }}
                  className="bg-amber-600 hover:opacity-90 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>ผ้าม่าน MTO:</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatCurrency(monthMTO, true)} ({((monthMTO / monthTotal) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>ผ้า Fabric:</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatCurrency(monthFabric, true)} ({((monthFabric / monthTotal) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>ผ้าปูที่นอน:</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatCurrency(monthBedding, true)} ({((monthBedding / monthTotal) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Individual Sales Representatives Ranking Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3
                className={`text-sm font-bold flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                <Award className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>อันดับและผลงานพนักงานขายรายคน</span>
              </h3>
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {repRows.length > 0 ? `พบข้อมูล ${repRows.length} ท่าน` : 'ไม่มีข้อมูลแยกรายบุคคล'}
              </span>
            </div>

            {repRows.length > 0 ? (
              <div
                className={`overflow-x-auto rounded-2xl border ${
                  isLight ? 'border-slate-200 bg-white' : 'border-slate-700/80 bg-slate-900/60'
                }`}
              >
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr
                      className={`border-b font-semibold uppercase text-[11px] ${
                        isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-[#071328] text-slate-300 border-slate-700/60'
                      }`}
                    >
                      <th className="px-3.5 py-2.5 text-center w-14">อันดับ</th>
                      <th className="px-4 py-2.5">ชื่อพนักงานขาย</th>
                      <th className="px-3.5 py-2.5 text-right">ยอดขาย MTO</th>
                      <th className="px-3.5 py-2.5 text-right">ยอดขาย ผ้า</th>
                      <th className="px-3.5 py-2.5 text-right">ยอดขาย ผ้าปูฯ</th>
                      <th
                        className={`px-4 py-2.5 text-right font-bold ${
                          isLight ? 'text-cyan-900' : 'text-cyan-300'
                        }`}
                      >
                        ยอดขายรวม
                      </th>
                      <th className="px-3 py-2.5 text-center">Orders</th>
                      <th className="px-3.5 py-2.5 text-right">% สัดส่วน</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y font-mono tabular-nums ${
                      isLight ? 'divide-slate-200 text-slate-800' : 'divide-slate-800 text-slate-200'
                    }`}
                  >
                    {repRows.map((rep) => {
                      const share = monthTotal > 0 ? (rep.salesTotal / monthTotal) * 100 : 0;
                      return (
                        <tr
                          key={rep.id}
                          className={`transition-colors ${
                            isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="px-3.5 py-2.5 text-center font-bold">
                            {rep.rank || '-'}
                          </td>
                          <td className="px-4 py-2.5 font-sans font-medium">
                            {rep.salesPerson}
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            {rep.salesMTO > 0 ? formatCurrency(rep.salesMTO) : '-'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            {rep.salesFabric > 0 ? formatCurrency(rep.salesFabric) : '-'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            {rep.salesBedding > 0 ? formatCurrency(rep.salesBedding) : '-'}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right font-bold ${
                              isLight ? 'text-cyan-800 font-extrabold' : 'text-cyan-300'
                            }`}
                          >
                            {formatCurrency(rep.salesTotal)}
                          </td>
                          <td className="px-3 py-2.5 text-center text-emerald-700 dark:text-emerald-300">
                            {formatNumber(rep.orders)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            {share.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className={`p-8 text-center text-xs rounded-2xl border ${
                  isLight
                    ? 'border-slate-200 bg-slate-50 text-slate-500'
                    : 'border-white/10 bg-white/[0.02] text-slate-400'
                }`}
              >
                ไม่พบข้อมูลรายการพนักงานขายสำหรับเดือนนี้
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
