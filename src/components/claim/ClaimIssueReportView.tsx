import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Filter,
  Calendar,
  Users,
  Eye,
  EyeOff,
  Image as ImageIcon,
  DollarSign,
  Wrench,
  Search,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { MONTH_NAMES, MONTH_FULL_TH } from '../../data/salesDataService';

export const ClaimIssueReportView: React.FC = () => {
  const { claimRows, salesReps, toggleClaimVisibility, settings } = useSales();
  const isLight = settings.themeMode === 'light';

  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterRep, setFilterRep] = useState<string>('all');
  const [filterProblemSource, setFilterProblemSource] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Photo Lightbox modal
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  // Set of valid sales rep names
  const validRepNames = useMemo(() => {
    return new Set(salesReps.map((r) => r.name.trim()));
  }, [salesReps]);

  // Extract unique years from claimDate
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    claimRows.forEach((c) => {
      if (c.claimDate) {
        const yr = parseInt(c.claimDate.split('-')[0], 10);
        if (yr > 2000) set.add(yr);
      }
    });
    if (set.size === 0) set.add(2026);
    return Array.from(set).sort((a, b) => b - a); // Newest year on top
  }, [claimRows]);

  // Extract unique problem sources for filter
  const problemSources = useMemo(() => {
    const set = new Set<string>();
    claimRows.forEach((c) => {
      if (c.problemSource?.trim()) set.add(c.problemSource.trim());
    });
    return Array.from(set);
  }, [claimRows]);

  // Filter claim rows:
  // Rule: "แสดงข้อมูลเฉพาะที่เกิดจากพนักงานขายที่รายชื่อเท่านั้น"
  const filteredClaims = useMemo(() => {
    return claimRows.filter((c) => {
      // Must belong to known sales reps
      const repTrim = c.salesPerson?.trim() || '';
      const isKnownRep = validRepNames.has(repTrim) || salesReps.some((r) => repTrim.includes(r.nickname || r.name));
      if (!isKnownRep) return false;

      // Extract Year and Month from claimDate (YYYY-MM-DD)
      let claimYr = 2026;
      let claimMo = 10;
      if (c.claimDate) {
        const parts = c.claimDate.split('-');
        if (parts.length >= 2) {
          claimYr = parseInt(parts[0], 10);
          claimMo = parseInt(parts[1], 10);
        }
      }

      // Year Filter
      if (filterYear !== 'all' && String(claimYr) !== filterYear) return false;

      // Month Filter
      if (filterMonth !== 'all') {
        const mName = MONTH_NAMES[claimMo - 1];
        if (mName !== filterMonth) return false;
      }

      // Rep Filter
      if (filterRep !== 'all' && !repTrim.includes(filterRep)) return false;

      // Problem Source Filter
      if (filterProblemSource !== 'all' && c.problemSource !== filterProblemSource) return false;

      // Search Term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          c.customerName.toLowerCase().includes(q) ||
          c.salesPerson.toLowerCase().includes(q) ||
          c.problem.toLowerCase().includes(q) ||
          c.rootCause.toLowerCase().includes(q) ||
          c.fabricName.toLowerCase().includes(q) ||
          c.orderNo.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [claimRows, validRepNames, salesReps, filterYear, filterMonth, filterRep, filterProblemSource, searchTerm]);

  // Group by Year: 1 รายงาน 1 ปี ปีล่าสุดขึ้นก่อน
  const claimsByYear = useMemo(() => {
    const years = availableYears.filter((yr) => filterYear === 'all' || String(yr) === filterYear);
    return years.map((yr) => {
      const rows = filteredClaims.filter((c) => {
        const itemYr = c.claimDate ? parseInt(c.claimDate.split('-')[0], 10) : 2026;
        return itemYr === yr;
      });

      // ONLY include in total calculation if isVisible !== false
      const visibleRows = rows.filter((r) => r.isVisible !== false);
      const totalClaimCost = visibleRows.reduce((sum, r) => sum + (r.claimCost || 0), 0);
      const totalOrderValue = visibleRows.reduce((sum, r) => sum + (r.orderValue || 0), 0);

      return {
        year: yr,
        rows,
        visibleCount: visibleRows.length,
        totalCount: rows.length,
        totalClaimCost,
        totalOrderValue,
      };
    });
  }, [availableYears, filterYear, filteredClaims]);

  // Grand summary for active visible claims
  const grandVisibleClaims = filteredClaims.filter((r) => r.isVisible !== false);
  const grandTotalCost = grandVisibleClaims.reduce((s, r) => s + (r.claimCost || 0), 0);

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
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-400/30'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Claim Issue Report (รายงานงานแก้ไข)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  เฉพาะพนักงานขายในระบบ
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                ติดตามรายการแก้ไขงาน พร้อมรูปประกอบ สามารถกดเปิด/ปิดการแสดงผลเพื่อไม่นำยอดมารวมในรายงานได้
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-2xl border border-white/10">
            <div className="text-right">
              <span className="text-[11px] block text-slate-400">มูลค่างานแก้ไขรวม (ที่แสดง):</span>
              <span className="text-base font-black text-rose-400 font-mono">
                {formatCurrency(grandTotalCost)}
              </span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-right">
              <span className="text-[11px] block text-slate-400">จำนวนงานแก้ไข:</span>
              <span className="text-base font-black text-white font-mono">
                {grandVisibleClaims.length} / {filteredClaims.length} งาน
              </span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-4 border-t border-white/10 text-xs">
          {/* Year */}
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-slate-400">ปี:</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl font-bold border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}
            >
              <option value="all">ทุกปี</option>
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  ปี {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-slate-400">เดือน:</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
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

          {/* Sales Rep */}
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-slate-400">พนักงานขาย:</label>
            <select
              value={filterRep}
              onChange={(e) => setFilterRep(e.target.value)}
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

          {/* Problem Source */}
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-slate-400">แหล่งที่มาของปัญหา:</label>
            <select
              value={filterProblemSource}
              onChange={(e) => setFilterProblemSource(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl font-bold border max-w-[200px] truncate ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}
            >
              <option value="all">ทุกแหล่งที่มา</option>
              {problemSources.map((ps) => (
                <option key={ps} value={ps}>
                  {ps}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative ml-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาลูกค้า, อาการ, ผ้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-8 pr-3 py-1.5 rounded-xl font-medium border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Yearly Reports: 1 รายงาน 1 ปี ปีล่าสุดขึ้นก่อน */}
      <div className="space-y-8">
        {claimsByYear.map((yItem) => (
          <div
            key={yItem.year}
            className={`p-5 sm:p-6 rounded-3xl border space-y-4 transition-all ${
              isLight
                ? 'bg-white/90 border-slate-200 shadow-xl'
                : 'liquid-glass-card border-white/10 shadow-2xl'
            }`}
          >
            {/* Year Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl text-base font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                  รายงานงานแก้ไข ประจำปี {yItem.year} (พ.ศ. {yItem.year + 543})
                </span>
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  (แสดงผลในรายงาน {yItem.visibleCount} จาก {yItem.totalCount} งาน)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">
                  มูลค่าออเดอร์:{' '}
                  <strong className="text-white">{formatCurrency(yItem.totalOrderValue)}</strong>
                </span>
                <span className="text-slate-400">
                  มูลค่างานแก้ไข:{' '}
                  <strong className="text-rose-400 font-bold">{formatCurrency(yItem.totalClaimCost)}</strong>
                </span>
              </div>
            </div>

            {/* Table */}
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
                    <th className="py-3 px-3 text-center w-20">แสดงในรายงาน</th>
                    <th className="py-3 px-3 min-w-[90px]">วันที่เคลม</th>
                    <th className="py-3 px-3 min-w-[140px]">ชื่อลูกค้า</th>
                    <th className="py-3 px-3 min-w-[150px]">พนักงานขาย</th>
                    <th className="py-3 px-3 min-w-[160px]">ปัญหา (Problem)</th>
                    <th className="py-3 px-3 min-w-[180px]">รายละเอียด</th>
                    <th className="py-3 px-3 min-w-[160px]">สาเหตุของปัญหา</th>
                    <th className="py-3 px-3 min-w-[130px]">ชื่อผ้า</th>
                    <th className="py-3 px-3 text-right min-w-[110px]">มูลค่าแก้ไข (บาท)</th>
                    <th className="py-3 px-3 min-w-[130px]">ทีมช่างติดตั้ง</th>
                    <th className="py-3 px-3 text-center min-w-[80px]">รูปภาพ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {yItem.rows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        ไม่มีรายการงานแก้ไขของพนักงานขายในปี {yItem.year} ที่ตรงกับตัวกรอง
                      </td>
                    </tr>
                  ) : (
                    yItem.rows.map((row) => {
                      const isVisible = row.isVisible !== false;

                      return (
                        <tr
                          key={row.id}
                          className={`transition-colors ${
                            isVisible
                              ? 'hover:bg-white/[0.03]'
                              : 'opacity-40 bg-white/[0.01] line-through'
                          }`}
                        >
                          {/* Toggle Switch: แสดงหรือไม่แสดง (หากไม่แสดง จะไม่นำมารวมในผลรวม) */}
                          <td className="py-3 px-3 text-center no-underline">
                            <button
                              type="button"
                              onClick={() => toggleClaimVisibility(row.id)}
                              className={`p-1.5 rounded-xl border transition-all ${
                                isVisible
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                              }`}
                              title={
                                isVisible
                                  ? 'กำลังแสดงในรายงาน (คลิกเพื่อซ่อนและไม่รวมยอด)'
                                  : 'ซ่อนอยู่ (คลิกเพื่อแสดงและรวมยอด)'
                              }
                            >
                              {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          </td>

                          <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                            {row.claimDate || '-'}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-200">{row.customerName}</td>
                          <td className="py-3 px-3 font-bold text-cyan-400">{row.salesPerson}</td>
                          <td className="py-3 px-3 font-semibold text-rose-300">{row.problem}</td>
                          <td className="py-3 px-3 text-slate-300 text-[11px] max-w-[200px] line-clamp-2">
                            {row.details || '-'}
                          </td>
                          <td className="py-3 px-3 text-amber-300 text-[11px]">{row.rootCause || '-'}</td>
                          <td className="py-3 px-3 text-[11px] text-slate-300 font-mono">
                            {row.fabricName || '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-black font-mono text-rose-400">
                            {formatCurrency(row.claimCost)}
                          </td>
                          <td className="py-3 px-3 text-slate-300 text-[11px]">
                            {row.installTechnicianTeam || '-'}
                          </td>

                          {/* Image preview button */}
                          <td className="py-3 px-3 text-center no-underline">
                            {row.photoUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPhoto({
                                    url: row.photoUrl,
                                    title: `${row.customerName} - ${row.problem}`,
                                  })
                                }
                                className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all inline-flex items-center gap-1 text-[10px]"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>ดูรูป</span>
                              </button>
                            ) : (
                              <span className="text-slate-500 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
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
                    <td colSpan={8} className="py-3.5 px-4 font-sans">
                      รวมมูลค่างานแก้ไขที่แสดงผล (ปี {yItem.year})
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-rose-400 text-sm">
                      {formatCurrency(yItem.totalClaimCost)}
                    </td>
                    <td colSpan={2} className="py-3.5 px-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-2xl w-full bg-slate-900 border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <h3 className="text-sm font-bold truncate">{selectedPhoto.title}</h3>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/40">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[70vh] rounded-2xl object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
