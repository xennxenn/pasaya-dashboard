import React, { useState } from 'react';
import {
  Target,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Save,
  Sparkles,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { MONTH_NAMES, MONTH_FULL_TH } from '../../data/salesDataService';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

export const ManageTargetsView: React.FC = () => {
  const {
    targets,
    yearlyOverviewData,
    salesReps,
    updateMonthlyTarget,
    updateIndividualTarget,
  } = useSales();

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);

  // Stats for the selected year
  const yearOverview = yearlyOverviewData.find((y) => y.year === selectedYear);

  // Targets for this year
  const yearTargets = targets.filter((t) => t.year === selectedYear);

  // Annual Totals
  const totalAnnualTarget = yearTargets.reduce((sum, t) => sum + (t.teamTarget || 0), 0);
  const totalAnnualActual = yearOverview?.annualTotal || 0;
  const annualAttainment =
    totalAnnualTarget > 0 ? (totalAnnualActual / totalAnnualTarget) * 100 : 0;
  const remainingToGoal = Math.max(0, totalAnnualTarget - totalAnnualActual);

  return (
    <div className="space-y-6">
      {/* Header & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Target className="w-6 h-6 text-cyan-400" />
            <span>จัดการเป้าหมายยอดขายของทีม (Sales Target & KPI)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            กำหนดเป้าหมายยอดขายประจำเดือนของทีมและจัดสรรเป้ารายบุคคล พร้อมติดตาม %ความสำเร็จ
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400">เลือกปีเป้าหมาย:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
          >
            <option value={2026} className="bg-slate-900">ปี 2026</option>
            <option value={2025} className="bg-slate-900">ปี 2025</option>
            <option value={2024} className="bg-slate-900">ปี 2024</option>
            <option value={2023} className="bg-slate-900">ปี 2023</option>
          </select>
        </div>
      </div>

      {/* Target KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl glass-panel border border-cyan-500/20">
          <div className="text-xs text-slate-400">เป้าหมายรวมทั้งปี ({selectedYear})</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1.5">
            {formatCurrency(totalAnnualTarget, true)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            เฉลี่ยเดือนละ {formatCurrency(Math.round(totalAnnualTarget / 12), true)}
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-emerald-500/20">
          <div className="text-xs text-slate-400">ยอดขายจริงสะสม</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1.5">
            {formatCurrency(totalAnnualActual, true)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span
              className={`font-semibold font-mono ${
                annualAttainment >= 100 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              บรรลุ {annualAttainment.toFixed(1)}%
            </span>
            <span>ของเป้าหมายทั้งปี</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-amber-500/20">
          <div className="text-xs text-slate-400">ขาดอีก (Remaining to Goal)</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 mt-1.5">
            {formatCurrency(remainingToGoal, true)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {remainingToGoal === 0
              ? '🎉 บรรลุเป้าหมายทั้งปีเรียบร้อยแล้ว!'
              : `ต้องการอีก ${formatCurrency(remainingToGoal, true)} เพื่อแตะเป้า`}
          </div>
        </div>
      </div>

      {/* Monthly Target Grid / Table */}
      <div className="rounded-2xl glass-panel border border-cyan-500/20 overflow-hidden shadow-xl">
        <div className="px-5 py-4 bg-slate-900/80 border-b border-cyan-500/15 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span>ตารางเป้าหมายยอดขายรายเดือน ปี {selectedYear}</span>
          </h3>
          <span className="text-xs text-slate-400">
            คลิกแก้ไขในช่องเป้าหมายเพื่อปรับปรุงตัวเลขได้ทันที
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[#050e1f] text-slate-300 border-b border-slate-700/60 uppercase text-[11px] font-semibold">
                <th className="px-5 py-3 w-36">เดือน</th>
                <th className="px-5 py-3 text-right">เป้าหมายยอดขายทีม (บาท)</th>
                <th className="px-5 py-3 text-right">ยอดขายจริง (Actual)</th>
                <th className="px-5 py-3 text-right">ส่วนต่าง (Diff)</th>
                <th className="px-5 py-3 text-center w-48">% ความสำเร็จ (Attainment)</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono tabular-nums">
              {MONTH_NAMES.map((mName, idx) => {
                const mNum = idx + 1;
                const targetObj = yearTargets.find((t) => t.monthNum === mNum);
                const teamTarget = targetObj?.teamTarget || 0;
                const actual = yearOverview?.total[mNum] || 0;
                const diff = actual - teamTarget;
                const pct = teamTarget > 0 ? (actual / teamTarget) * 100 : 0;
                const isOver = diff >= 0 && actual > 0;
                const isEditing = editingMonth === mNum;

                return (
                  <tr
                    key={mName}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-3 font-sans font-medium text-slate-200">
                      <span>{MONTH_FULL_TH[mName]}</span>
                      <span className="text-[10px] text-slate-500 ml-1">({mName})</span>
                    </td>

                    {/* Team Target Input / Display */}
                    <td className="px-5 py-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="10000"
                          defaultValue={teamTarget}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateMonthlyTarget(selectedYear, mNum, val);
                          }}
                          className="w-32 px-2 py-1 bg-slate-900 border border-cyan-500 rounded text-right text-white font-mono"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => setEditingMonth(mNum)}
                          className="font-bold text-white hover:text-cyan-300 cursor-pointer underline decoration-dotted underline-offset-4"
                          title="คลิกเพื่อแก้ไขเป้าหมาย"
                        >
                          {formatCurrency(teamTarget, true)}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3 text-right font-bold text-cyan-300">
                      {actual > 0 ? formatCurrency(actual, true) : '-'}
                    </td>

                    <td
                      className={`px-5 py-3 text-right font-semibold ${
                        actual === 0
                          ? 'text-slate-500'
                          : diff >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {actual > 0
                        ? `${diff >= 0 ? '+' : ''}${formatCurrency(diff, true)}`
                        : '-'}
                    </td>

                    {/* Progress Bar */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, pct)}%` }}
                            className={`h-full rounded-full ${
                              pct >= 100
                                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                                : pct >= 70
                                ? 'bg-cyan-400'
                                : 'bg-amber-400'
                            }`}
                          />
                        </div>
                        <span className="w-14 text-right font-bold text-slate-200">
                          {actual > 0 ? `${pct.toFixed(1)}%` : '-'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center font-sans">
                      {actual === 0 ? (
                        <span className="text-[10px] text-slate-500">รอข้อมูล</span>
                      ) : isOver ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>เกินเป้า</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                          <AlertCircle className="w-3 h-3" />
                          <span>ต่ำกว่าเป้า</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingMonth(isEditing ? null : mNum)
                        }
                        className="px-2.5 py-1 rounded text-[11px] text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30 font-sans"
                      >
                        {isEditing ? 'เสร็จสิ้น' : 'แก้ไขเป้า'}
                      </button>
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
