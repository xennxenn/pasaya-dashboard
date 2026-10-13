import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  Tag,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { MONTH_NAMES, MONTH_SHORT_EN, MONTH_FULL_TH } from '../../data/salesDataService';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const YEAR_COLORS: Record<number, { stroke: string; fill: string; hex: string; text: string; lightText: string }> = {
  2026: {
    stroke: '#0284c7', // Sky Blue
    fill: 'rgba(2, 132, 199, 0.15)',
    hex: '#0284c7',
    text: 'text-sky-400',
    lightText: 'text-sky-700',
  },
  2025: {
    stroke: '#8b5cf6', // Violet
    fill: 'rgba(139, 92, 246, 0.12)',
    hex: '#8b5cf6',
    text: 'text-purple-400',
    lightText: 'text-purple-700',
  },
  2024: {
    stroke: '#059669', // Emerald
    fill: 'rgba(5, 150, 105, 0.10)',
    hex: '#059669',
    text: 'text-emerald-400',
    lightText: 'text-emerald-700',
  },
  2023: {
    stroke: '#d97706', // Amber
    fill: 'rgba(217, 119, 6, 0.08)',
    hex: '#d97706',
    text: 'text-amber-400',
    lightText: 'text-amber-700',
  },
};

type MetricType = 'total' | 'mto' | 'orders';

export const YearComparisonChart: React.FC = () => {
  const { yearlyOverviewData, uniqueYears, setSelectedMonthDetail, settings } = useSales();
  const isLight = settings.themeMode === 'light';

  const [activeMetric, setActiveMetric] = useState<MetricType>('total');
  const [showDataLabels, setShowDataLabels] = useState<boolean>(true);
  const [enabledYears, setEnabledYears] = useState<Record<number, boolean>>(() => {
    const res: Record<number, boolean> = {};
    uniqueYears.forEach((y) => (res[y] = true));
    return res;
  });

  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  const toggleYear = (year: number) => {
    setEnabledYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  // Find max value across all months and enabled years
  const maxValue = useMemo(() => {
    let max = 0;
    yearlyOverviewData.forEach((yData) => {
      if (!enabledYears[yData.year]) return;
      for (let m = 1; m <= 12; m++) {
        let val = 0;
        if (activeMetric === 'total') val = yData.total[m] || 0;
        else if (activeMetric === 'mto') val = yData.mto[m] || 0;
        else if (activeMetric === 'orders') val = yData.orders[m] || 0;

        if (val > max) max = val;
      }
    });
    return max > 0 ? max * 1.2 : 100; // 20% headroom for data labels
  }, [yearlyOverviewData, enabledYears, activeMetric]);

  // Chart SVG geometry
  const width = 940;
  const height = 350;
  const padding = { top: 35, right: 35, bottom: 45, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (monthIdx: number) => {
    return padding.left + (monthIdx / 11) * chartWidth;
  };

  const getY = (val: number) => {
    return padding.top + chartHeight - (val / maxValue) * chartHeight;
  };

  // Format label text for data point
  const formatPointLabel = (val: number) => {
    if (val <= 0) return '';
    if (activeMetric === 'orders') {
      return `${val}`;
    }
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(2)}M`;
    }
    if (val >= 1_000) {
      return `${(val / 1_000).toFixed(0)}k`;
    }
    return `${val}`;
  };

  // Build SVG path for a year
  const getYearPath = (yData: (typeof yearlyOverviewData)[0]) => {
    const points: { x: number; y: number; val: number; monthIdx: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      let val = 0;
      if (activeMetric === 'total') val = yData.total[m] || 0;
      else if (activeMetric === 'mto') val = yData.mto[m] || 0;
      else if (activeMetric === 'orders') val = yData.orders[m] || 0;

      // If future month in 2026 where val === 0, stop projecting line to avoid steep crash
      if (yData.year === 2026 && m > (settings.ytdCutoffMonth || 9) && val === 0) {
        continue;
      }

      points.push({ x: getX(m - 1), y: getY(val), val, monthIdx: m - 1 });
    }

    if (points.length === 0) return { path: '', area: '', points: [] };

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      path += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }

    const last = points[points.length - 1];
    const area = `${path} L ${last.x} ${height - padding.bottom} L ${points[0].x} ${
      height - padding.bottom
    } Z`;

    return { path, area, points };
  };

  // Grid steps (5 horizontal ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => pct * maxValue);

  return (
    <div
      className={`rounded-3xl p-6 sm:p-7 transition-all duration-200 space-y-6 ${
        isLight
          ? 'bg-white border border-slate-200 shadow-sm text-slate-800'
          : 'liquid-glass specular-rim shadow-2xl text-white'
      }`}
    >
      {/* Chart Header & Controls */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isLight
                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/25'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2
              className={`text-lg font-bold tracking-wide ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              กราฟ Line Chart เปรียบเทียบยอดขายแต่ละปี
            </h2>
            <span
              className={`hidden sm:inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                isLight
                  ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                  : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              กด Double Click ที่จุดใดๆ เพื่อเปิดข้อมูลของปีนั้นๆ
            </span>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            เปรียบเทียบแนวโน้มยอดขายรายเดือนตลอด 4 ปี • ดับเบิ้ลคลิกที่จุดบนกราฟเพื่อเปิดดูข้อมูลเจาะลึก
          </p>
        </div>

        {/* Metric Selector Tabs & Data Labels Switch */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Data labels toggle */}
          <button
            type="button"
            onClick={() => setShowDataLabels((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showDataLabels
                ? isLight
                  ? 'bg-cyan-50 text-cyan-800 border-cyan-200 shadow-xs'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-xs'
                : isLight
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : 'bg-white/[0.04] text-slate-400 border-white/10'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>แสดงตัวเลขกำกับ</span>
          </button>

          {/* Metric Selector Tabs */}
          <div
            className={`p-1 rounded-2xl flex items-center text-xs border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'liquid-pill-control'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveMetric('total')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeMetric === 'total'
                  ? isLight
                    ? 'bg-white text-cyan-900 shadow-sm font-bold border border-slate-200'
                    : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-md'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ยอดขายทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('mto')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeMetric === 'mto'
                  ? isLight
                    ? 'bg-white text-cyan-900 shadow-sm font-bold border border-slate-200'
                    : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-md'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ยอดขาย MTO
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('orders')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeMetric === 'orders'
                  ? isLight
                    ? 'bg-white text-emerald-900 shadow-sm font-bold border border-slate-200'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              จำนวนออเดอร์
            </button>
          </div>

          {/* Year Legend Toggles */}
          <div className="flex items-center gap-1.5">
            {uniqueYears.map((year) => {
              const c = YEAR_COLORS[year] || { stroke: '#94a3b8', text: 'text-slate-400', lightText: 'text-slate-600' };
              const isEnabled = enabledYears[year];

              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => toggleYear(year)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 border transition-all ${
                    isEnabled
                      ? isLight
                        ? `bg-slate-50 border-slate-200 shadow-xs ${c.lightText}`
                        : `bg-white/[0.06] border-white/20 shadow-sm ${c.text}`
                      : isLight
                      ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 line-through'
                      : 'bg-white/[0.02] text-slate-500 border-white/5 opacity-40 line-through'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: isEnabled ? c.stroke : '#94a3b8' }}
                  />
                  <span>{year}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-x-auto">
        <div className="min-w-[700px] w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible select-none"
          >
            <defs>
              {Object.entries(YEAR_COLORS).map(([yr, col]) => (
                <linearGradient
                  key={yr}
                  id={`area-grad-${yr}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={col.stroke} stopOpacity={isLight ? 0.18 : 0.25} />
                  <stop offset="100%" stopColor={col.stroke} stopOpacity={0.0} />
                </linearGradient>
              ))}
            </defs>

            {/* Horizontal Grid Lines & Y-Axis Labels */}
            {yTicks.map((val, idx) => {
              const y = getY(val);
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke={isLight ? '#e2e8f0' : '#1e293b'}
                    strokeDasharray={idx === 0 ? 'none' : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill={isLight ? '#64748b' : '#64748b'}
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {activeMetric === 'orders'
                      ? formatNumber(Math.round(val))
                      : val >= 1_000_000
                      ? `${(val / 1_000_000).toFixed(1)}M`
                      : formatNumber(val)}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Month Labels */}
            {MONTH_NAMES.map((mName, idx) => {
              const x = getX(idx);
              const isHovered = hoveredMonthIdx === idx;
              return (
                <g key={mName}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke={
                      isHovered
                        ? isLight
                          ? 'rgba(2, 132, 199, 0.4)'
                          : 'rgba(56, 189, 248, 0.3)'
                        : isLight
                        ? '#f1f5f9'
                        : '#0f172a'
                    }
                    strokeWidth={isHovered ? '2' : '1'}
                  />
                  <text
                    x={x}
                    y={height - padding.bottom + 22}
                    textAnchor="middle"
                    fill={
                      isHovered
                        ? isLight
                          ? '#0284c7'
                          : '#38bdf8'
                        : isLight
                        ? '#475569'
                        : '#94a3b8'
                    }
                    fontSize="11"
                    fontWeight={isHovered ? '700' : '600'}
                  >
                    {MONTH_SHORT_EN[mName]}
                  </text>
                </g>
              );
            })}

            {/* Render Filled Areas and Lines for Each Year */}
            {yearlyOverviewData.map((yData) => {
              if (!enabledYears[yData.year]) return null;
              const color = YEAR_COLORS[yData.year] || { stroke: '#94a3b8' };
              const { path, area, points } = getYearPath(yData);

              return (
                <g key={yData.year}>
                  {/* Fill */}
                  <path d={area} fill={`url(#area-grad-${yData.year})`} />

                  {/* Line */}
                  <path
                    d={path}
                    fill="none"
                    stroke={color.stroke}
                    strokeWidth={yData.year === 2026 ? '3' : '2'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Points & Numeric Labels on the chart */}
                  {points.map((pt, pIdx) => {
                    const isHovered = hoveredMonthIdx === pIdx;
                    const labelText = formatPointLabel(pt.val);

                    return (
                      <g
                        key={pIdx}
                        className="cursor-pointer group"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setSelectedMonthDetail({
                            year: yData.year,
                            monthNum: pt.monthIdx + 1,
                            monthName: MONTH_NAMES[pt.monthIdx],
                          });
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMonthDetail({
                            year: yData.year,
                            monthNum: pt.monthIdx + 1,
                            monthName: MONTH_NAMES[pt.monthIdx],
                          });
                        }}
                      >
                        <title>
                          ดับเบิ้ลคลิกเพื่อเปิดข้อมูลปี {yData.year} เดือน {MONTH_SHORT_EN[MONTH_NAMES[pt.monthIdx]]}
                        </title>
                        {/* Larger hit target for double clicking & clicking */}
                        <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />

                        {/* Dot */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : yData.year === 2026 ? 4.5 : 3.5}
                          fill={color.stroke}
                          stroke={isLight ? '#ffffff' : '#030712'}
                          strokeWidth="2"
                        />

                        {/* Numeric Data Label displayed directly on graph */}
                        {showDataLabels && pt.val > 0 && (
                          <g>
                            {/* Small background pill for label readability */}
                            <rect
                              x={pt.x - 18}
                              y={pt.y - 19}
                              width={36}
                              height={13}
                              rx={3}
                              fill={isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.85)'}
                              stroke={color.stroke}
                              strokeWidth={yData.year === 2026 ? '1' : '0.5'}
                            />
                            <text
                              x={pt.x}
                              y={pt.y - 9}
                              textAnchor="middle"
                              fill={isLight ? '#0f172a' : '#f8fafc'}
                              fontSize="8.5"
                              fontWeight={yData.year === 2026 ? '700' : '600'}
                              fontFamily="monospace"
                            >
                              {labelText}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Invisible overlay columns for mouse tracking */}
            {MONTH_NAMES.map((mName, idx) => {
              const x = getX(idx);
              const colWidth = chartWidth / 12;
              return (
                <rect
                  key={idx}
                  x={x - colWidth / 2}
                  y={padding.top}
                  width={colWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredMonthIdx(idx)}
                  onClick={() =>
                    setSelectedMonthDetail({
                      year: 2026,
                      monthNum: idx + 1,
                      monthName: mName,
                    })
                  }
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Interactive Tooltip Card at the bottom when hovered */}
      {hoveredMonthIdx !== null && (
        <div
          className={`p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 transition-all ${
            isLight
              ? 'bg-slate-50 border border-slate-200 text-slate-800 shadow-sm'
              : 'bg-slate-900/90 border border-cyan-500/30 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className={`w-4 h-4 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
            <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              เดือน {MONTH_SHORT_EN[MONTH_NAMES[hoveredMonthIdx]]} ({MONTH_FULL_TH[MONTH_NAMES[hoveredMonthIdx]]})
            </span>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              [คลิกในกราฟเพื่อดูรายละเอียดเจาะลึก]
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums">
            {yearlyOverviewData.map((yData) => {
              if (!enabledYears[yData.year]) return null;
              const col = YEAR_COLORS[yData.year] || { stroke: '#000', text: '', lightText: '' };
              const mNum = hoveredMonthIdx + 1;
              let val = 0;
              if (activeMetric === 'total') val = yData.total[mNum] || 0;
              else if (activeMetric === 'mto') val = yData.mto[mNum] || 0;
              else if (activeMetric === 'orders') val = yData.orders[mNum] || 0;

              return (
                <button
                  key={yData.year}
                  type="button"
                  onClick={() =>
                    setSelectedMonthDetail({
                      year: yData.year,
                      monthNum: hoveredMonthIdx + 1,
                      monthName: MONTH_NAMES[hoveredMonthIdx],
                    })
                  }
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 border-slate-200 shadow-2xs'
                      : 'bg-white/[0.04] hover:bg-white/[0.1] border-white/10'
                  }`}
                  title={`คลิกเพื่อเปิดข้อมูลปี ${yData.year} เดือน ${MONTH_SHORT_EN[MONTH_NAMES[hoveredMonthIdx]]}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.stroke }}
                  />
                  <span className={isLight ? 'text-slate-600 font-medium' : 'text-slate-400 font-medium'}>
                    {yData.year}:
                  </span>
                  <span className={`font-bold ${isLight ? col.lightText : col.text}`}>
                    {val > 0
                      ? activeMetric === 'orders'
                        ? `${formatNumber(val)}`
                        : formatCurrency(val, true)
                      : '-'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
