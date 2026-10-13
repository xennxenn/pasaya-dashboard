import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { RAW_CSV_DATA } from '../../data/rawCsv';

export const DataSheetView: React.FC = () => {
  const {
    records,
    importCsv,
    resetAllData,
    sheetsConfig,
    isRealtimeConnected,
    isSyncingSheets,
    setIsSyncModalOpen,
    triggerGoogleSheetsSync,
    settings,
  } = useSales();

  const isLight = settings.themeMode === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [csvInput, setCsvInput] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtered rows
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.salesPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.quarter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === 'all' || r.year.toString() === filterYear;
    const matchesMonth = filterMonth === 'all' || r.month === filterMonth;
    return matchesSearch && matchesYear && matchesMonth;
  });

  const handleDownloadCsv = () => {
    const header = 'Year,Month,พนักงานขาย,ยอดขาย MTO,ยอดขาย ผ้า,ยอดขาย ผ้าปูที่นอน,ยอดขายรวม,Rank,Quarter,Orders\n';
    const lines = records.map((r) => {
      const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
      return [
        r.year,
        r.month,
        escape(r.salesPerson),
        `"${r.salesMTO.toLocaleString()}"`,
        r.salesFabric ? `"${r.salesFabric.toLocaleString()}"` : '',
        r.salesBedding ? `"${r.salesBedding.toLocaleString()}"` : '',
        `"${r.salesTotal.toLocaleString()}"`,
        r.rank || '',
        r.quarter,
        r.orders || '',
      ].join(',');
    });

    const blob = new Blob([header + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PASAYA_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importCsv(content);
        if (success) {
          setMsg({ type: 'success', text: `นำเข้าไฟล์ ${file.name} สำเร็จ!` });
        } else {
          setMsg({ type: 'error', text: 'ไม่สามารถนำเข้าไฟล์ได้ กรุณาตรวจสอบรูปแบบ CSV' });
        }
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!csvInput.trim()) return;
    const ok = importCsv(csvInput);
    if (ok) {
      setMsg({ type: 'success', text: 'นำเข้าข้อมูล CSV สำเร็จเรียบร้อย!' });
      setShowUploadModal(false);
      setCsvInput('');
    } else {
      setMsg({ type: 'error', text: 'รูปแบบ CSV ไม่ถูกต้อง กรุณาตรวจสอบ' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <div>
          <h1
            className={`text-xl sm:text-2xl font-bold flex items-center gap-2.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            <FileSpreadsheet className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>ชีทข้อมูล Sales Report (Master Data)</span>
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            ข้อมูลหลักที่นำมาประมวลผล รายงานยอดขาย MTO, ผ้า, ผ้าปูที่นอน และจำนวนออเดอร์
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Realtime Google Sheets Sync Trigger */}
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
            <span>⚡ เชื่อมต่อ Google Sheets Realtime</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              isLight
                ? 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                : 'bg-cyan-600/30 text-cyan-300 border-cyan-500/40 hover:bg-cyan-600/40'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>อัปโหลด / วาง CSV</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลด CSV</span>
          </button>
        </div>
      </div>

      {/* Realtime Google Sheets Central Database Live Info Card */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              isLight
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm">
                ระบบฐานข้อมูลกลาง Realtime &amp; Google Sheets
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isRealtimeConnected
                    ? isLight
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-emerald-500/20 text-emerald-300'
                    : isLight
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {isRealtimeConnected ? '🟢 กำลังออนไลน์แบบ Realtime' : '🟡 กำลังเชื่อมต่อ'}
              </span>
            </div>
            <p className={`text-[11px] mt-0.5 ${isLight ? 'text-emerald-800' : 'text-emerald-300/80'}`}>
              {sheetsConfig.sheetUrl
                ? `เชื่อมต่อกับ Google Sheets: ${sheetsConfig.sheetUrl.slice(0, 45)}...`
                : 'พร้อมเชื่อมต่อ Google Sheets เพื่อซิงค์ข้อมูลยอดขายอัตโนมัติแบบ Realtime'}
              {sheetsConfig.lastSyncTime && (
                <span className="ml-2 font-mono">
                  (ซิงค์ล่าสุด: {new Date(sheetsConfig.lastSyncTime).toLocaleTimeString('th-TH')})
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={async () => {
              const res = await triggerGoogleSheetsSync();
              if (res.success) {
                setMsg({ type: 'success', text: res.message });
              } else {
                setMsg({ type: 'error', text: res.message });
              }
            }}
            disabled={isSyncingSheets}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isLight
                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
            <span>{isSyncingSheets ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลเดี๋ยวนี้'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              isLight
                ? 'bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-50'
                : 'bg-white/5 border-emerald-500/30 text-emerald-300 hover:bg-white/10'
            }`}
          >
            ตั้งค่าชีท
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 animate-fade-in ${
            msg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อพนักงานขาย, ไตรมาส..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
          >
            <option value="all">ทุกปี (All Years)</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>

          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
          >
            <option value="all">ทุกเดือน (All Months)</option>
            {[
              'January',
              'February',
              'March',
              'April',
              'May',
              'June',
              'July',
              'August',
              'September',
              'October',
              'November',
              'December',
            ].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Records */}
      <div className="rounded-2xl glass-panel border border-cyan-500/20 overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 bg-slate-900/80 border-b border-cyan-500/15 flex items-center justify-between text-xs text-slate-400">
          <span>
            แสดงผล <strong className="text-white font-mono">{filteredRecords.length}</strong> แถว (จากทั้งหมด {records.length} แถวในระบบ)
          </span>
          <span className="font-mono text-cyan-300">
            PASAYA Curtain Center — Sales Report
          </span>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="sticky top-0 z-20 bg-[#071328] text-slate-300 uppercase text-[11px] font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Col.A: ปี</th>
                <th className="px-4 py-3">Col.B: เดือน</th>
                <th className="px-5 py-3">Col.C: พนักงานขาย</th>
                <th className="px-4 py-3 text-right">Col.D: ยอดขาย MTO</th>
                <th className="px-4 py-3 text-right">Col.E: ยอดขาย ผ้า</th>
                <th className="px-4 py-3 text-right">Col.F: ยอดขาย ผ้าปูที่นอน</th>
                <th className="px-5 py-3 text-right font-bold text-cyan-300">
                  Col.G: ยอดขายรวม
                </th>
                <th className="px-3 py-3 text-center">Col.H: Rank</th>
                <th className="px-3 py-3 text-center">Col.I: ไตรมาส</th>
                <th className="px-4 py-3 text-center">Col.J: Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono tabular-nums">
              {filteredRecords.map((r, i) => {
                const isTotalRow = r.salesPerson === 'รวมทั้งหมด';
                return (
                  <tr
                    key={r.id || i}
                    className={`transition-colors ${
                      isTotalRow
                        ? 'bg-cyan-950/20 font-bold hover:bg-cyan-950/30'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-4 py-2.5 text-slate-300">{r.year}</td>
                    <td className="px-4 py-2.5 font-sans text-slate-300">{r.month}</td>
                    <td
                      className={`px-5 py-2.5 font-sans ${
                        isTotalRow ? 'text-cyan-300' : 'text-white'
                      }`}
                    >
                      {r.salesPerson}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-200">
                      {formatCurrency(r.salesMTO)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400">
                      {r.salesFabric > 0 ? formatCurrency(r.salesFabric) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400">
                      {r.salesBedding > 0 ? formatCurrency(r.salesBedding) : '-'}
                    </td>
                    <td className="px-5 py-2.5 text-right font-bold text-cyan-300">
                      {formatCurrency(r.salesTotal)}
                    </td>
                    <td className="px-3 py-2.5 text-center text-amber-400">
                      {r.rank || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-300">{r.quarter}</td>
                    <td className="px-4 py-2.5 text-center text-emerald-400">
                      {r.orders > 0 ? r.orders : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl glass-dropdown border border-cyan-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <span>นำเข้าข้อมูล Sales Report (CSV)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  1. อัปโหลดไฟล์ .CSV จากเครื่อง
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  2. หรือวางข้อความ CSV ตรงนี้:
                </label>
                <textarea
                  rows={8}
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder="Year,Month,พนักงานขาย,ยอดขาย MTO,ยอดขาย ผ้า,ยอดขาย ผ้าปูที่นอน,ยอดขายรวม,Rank,Quarter,Orders..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handlePasteImport}
                  className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-500"
                >
                  นำเข้าข้อมูลทันที
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
