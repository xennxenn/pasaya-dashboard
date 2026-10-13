import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { MONTH_NAMES, MONTH_SHORT_TH } from '../../data/salesDataService';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

export const AnalyticsView: React.FC = () => {
  const { yearlyOverviewData } = useSales();
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const yearData =
    yearlyOverviewData.find((y) => y.year === selectedYear) || yearlyOverviewData[0];

  // Product mix distribution
  const mtoShare =
    yearData.annualTotal > 0 ? (yearData.annualMTO / yearData.annualTotal) * 100 : 0;
  const fabricShare =
    yearData.annualTotal > 0 ? (yearData.annualFabric / yearData.annualTotal) * 100 : 0;
  const beddingShare =
    yearData.annualTotal > 0 ? (yearData.annualBedding / yearData.annualTotal) * 100 : 0;

  // Monthly breakdown for bar chart
  const maxMonthTotal = useMemo(() => {
    let max = 0;
    for (let m = 1; m <= 12; m++) {
      if (yearData.total[m] > max) max = yearData.total[m];
    }
    return max > 0 ? max * 1.15 : 100;
  }, [yearData]);

  return (
    <div className="space-y-6">
      {/* Header & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            <span>กราฟวิเคราะห์ข้อมูลเชิงลึก & สัดส่วนสินค้า</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            วิเคราะห์สัดส่วนรายได้ MTO ผ้าม่านสั่งตัด, ผ้าเมตร (Fabric) และชุดเครื่องนอน (Bedding)
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">เลือกปี:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
          >
            {yearlyOverviewData.map((y) => (
              <option key={y.year} value={y.year} className="bg-slate-900">
                ปี {y.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Mix 3 Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* MTO Card */}
        <div className="p-5 rounded-2xl glass-panel border border-cyan-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>ผ้าม่านสั่งตัด MTO (Made-to-Order)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-300">
              {formatCurrency(yearData.annualMTO, true)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              ครองสัดส่วนหลัก{' '}
              <strong className="text-white text-sm font-mono font-bold">
                {mtoShare.toFixed(1)}%
              </strong>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div
              style={{ width: `${mtoShare}%` }}
              className="h-full bg-cyan-400 rounded-full"
            />
          </div>
        </div>

        {/* Fabric Card */}
        <div className="p-5 rounded-2xl glass-panel border border-purple-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>ผ้าเมตรสำเร็จรูป (Fabric)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-300">
              {formatCurrency(yearData.annualFabric, true)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              ครองสัดส่วน{' '}
              <strong className="text-white text-sm font-mono font-bold">
                {fabricShare.toFixed(1)}%
              </strong>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div
              style={{ width: `${fabricShare}%` }}
              className="h-full bg-purple-400 rounded-full"
            />
          </div>
        </div>

        {/* Bedding Card */}
        <div className="p-5 rounded-2xl glass-panel border border-amber-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>ชุดเครื่องนอน (Bedding)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300">
              {formatCurrency(yearData.annualBedding, true)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              ครองสัดส่วน{' '}
              <strong className="text-white text-sm font-mono font-bold">
                {beddingShare.toFixed(1)}%
              </strong>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div
              style={{ width: `${beddingShare}%` }}
              className="h-full bg-amber-400 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart Breakdown */}
      <div className="rounded-2xl glass-panel border border-cyan-500/20 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>ยอดขายแยกตามหมวดหมู่ 12 เดือน (Stacked Bar Chart - ปี {selectedYear})</span>
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-slate-300">MTO</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span className="text-slate-300">Fabric</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-300">Bedding</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2 pt-6">
          {MONTH_NAMES.map((mName, idx) => {
            const mNum = idx + 1;
            const tot = yearData.total[mNum] || 0;
            const mto = yearData.mto[mNum] || 0;
            const fab = yearData.fabric[mNum] || 0;
            const bed = yearData.bedding[mNum] || 0;

            const heightPct = maxMonthTotal > 0 ? (tot / maxMonthTotal) * 100 : 0;

            return (
              <div
                key={mName}
                className="flex flex-col items-center justify-end h-64 p-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/60 transition-colors group"
              >
                <div className="text-[10px] font-mono font-bold text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">
                  {tot >= 1_000_000 ? `${(tot / 1_000_000).toFixed(1)}M` : formatNumber(tot)}
                </div>

                {/* Stacked Bar Container */}
                <div className="w-8 sm:w-10 bg-slate-800 rounded-t-lg overflow-hidden flex flex-col justify-end" style={{ height: `${Math.max(10, heightPct)}%` }}>
                  {bed > 0 && (
                    <div
                      style={{ height: `${tot > 0 ? (bed / tot) * 100 : 0}%` }}
                      className="bg-amber-400 w-full"
                      title={`Bedding: ฿${formatNumber(bed)}`}
                    />
                  )}
                  {fab > 0 && (
                    <div
                      style={{ height: `${tot > 0 ? (fab / tot) * 100 : 0}%` }}
                      className="bg-purple-400 w-full"
                      title={`Fabric: ฿${formatNumber(fab)}`}
                    />
                  )}
                  {mto > 0 && (
                    <div
                      style={{ height: `${tot > 0 ? (mto / tot) * 100 : 0}%` }}
                      className="bg-cyan-400 w-full"
                      title={`MTO: ฿${formatNumber(mto)}`}
                    />
                  )}
                </div>

                <div className="text-[11px] font-medium text-slate-300 mt-2.5">
                  {MONTH_SHORT_TH[mName]}
                </div>
                <div className="text-[9px] font-mono text-slate-500">({mNum})</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quarter Comparison Table */}
      <div className="rounded-2xl glass-panel border border-cyan-500/20 overflow-hidden p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>เปรียบเทียบยอดขาย 4 ไตรมาส (Q1 - Q4 ปี {selectedYear})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((qKey) => {
            const qTot = yearData.quarterTotal[qKey];
            const qOrd = yearData.quarterOrders[qKey];
            const qAvg = yearData.quarterAvgTicket[qKey];
            const qGrowth = yearData.quarterGrowthYoY[qKey];

            return (
              <div
                key={qKey}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-bold text-white">{qKey}</span>
                  {qGrowth !== null && (
                    <span
                      className={`font-mono font-semibold ${
                        qGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatPercent(qGrowth)}
                    </span>
                  )}
                </div>
                <div className="text-lg font-bold font-mono text-cyan-300">
                  {formatCurrency(qTot, true)}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 space-y-0.5">
                  <div>ออเดอร์: {formatNumber(qOrd)} ออเดอร์</div>
                  <div>ยอดเฉลี่ย/ออเดอร์: {formatCurrency(qAvg, true)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
