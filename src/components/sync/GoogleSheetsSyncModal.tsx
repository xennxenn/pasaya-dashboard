import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Database,
  Radio,
  Layers,
  Sparkles,
  Link2,
  Copy,
  Share2,
  Users,
  ChevronRight,
  Info,
  Check,
  Upload,
  ClipboardPaste,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { formatNumber } from '../../utils/formatters';
import { SHEET_SPECS, SheetMetadata, SheetType } from '../../types/sheetSchemas';

export const GoogleSheetsSyncModal: React.FC = () => {
  const {
    settings,
    sheetsConfig,
    syncLogs,
    isRealtimeConnected,
    isSyncingSheets,
    isSyncModalOpen,
    setIsSyncModalOpen,
    triggerGoogleSheetsSync,
    updateGoogleSheetsConfig,
    importSheetCsv,
  } = useSales();

  const isLight = settings.themeMode === 'light';

  const [modalTab, setModalTab] = useState<'sync' | 'paste_csv' | 'schemas'>('sync');
  const [selectedSpecId, setSelectedSpecId] = useState<string>('lead_report');
  const [copiedTabName, setCopiedTabName] = useState<string | null>(null);

  const [inputUrl, setInputUrl] = useState(sheetsConfig.sheetUrl || '');
  const [inputSheetName, setInputSheetName] = useState(sheetsConfig.sheetName || '');
  const [autoSync, setAutoSync] = useState(sheetsConfig.autoSync ?? true);
  const [intervalSec, setIntervalSec] = useState(sheetsConfig.syncIntervalSec || 30);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  // Direct CSV Text Paste & Upload State
  const [pasteType, setPasteType] = useState<SheetType | 'auto'>('auto');
  const [pasteCsvContent, setPasteCsvContent] = useState('');
  const [isProcessingPaste, setIsProcessingPaste] = useState(false);
  const [showHowToGuide, setShowHowToGuide] = useState(false);

  React.useEffect(() => {
    if (isSyncModalOpen) {
      setInputUrl(sheetsConfig.sheetUrl || '');
      setInputSheetName(sheetsConfig.sheetName || '');
      setAutoSync(sheetsConfig.autoSync ?? true);
      setIntervalSec(sheetsConfig.syncIntervalSec || 30);
      setFeedback(null);
      setHasCopiedLink(false);
    }
  }, [
    isSyncModalOpen,
    sheetsConfig.sheetUrl,
    sheetsConfig.sheetName,
    sheetsConfig.autoSync,
    sheetsConfig.syncIntervalSec,
  ]);

  if (!isSyncModalOpen) return null;

  const handleSaveAndSync = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFeedback(null);

    await updateGoogleSheetsConfig({
      sheetUrl: inputUrl,
      sheetName: inputSheetName,
      autoSync,
      syncIntervalSec: intervalSec,
    });

    if (inputUrl.trim()) {
      const res = await triggerGoogleSheetsSync();
      if (res.success) {
        setFeedback({
          type: 'success',
          text: res.message || `ซิงค์ข้อมูลเรียลไทม์สำเร็จ (${res.rowCount} แถว)`,
        });
      } else {
        setFeedback({
          type: 'error',
          text: res.message || 'เกิดข้อผิดพลาดในการซิงค์ข้อมูลจาก Google Sheets',
        });
      }
    } else {
      setFeedback({ type: 'success', text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' });
    }
  };

  const handleCopyTeamLink = () => {
    try {
      const currentUrl = new URL(window.location.href);
      if (inputUrl.trim()) {
        currentUrl.searchParams.set('sheetUrl', inputUrl.trim());
      }
      navigator.clipboard.writeText(currentUrl.toString());
      setHasCopiedLink(true);
      setTimeout(() => setHasCopiedLink(false), 3000);
      setFeedback({
        type: 'success',
        text: 'คัดลอกลิงก์แชร์ให้ทีมงานสำเร็จ! เพื่อนร่วมงานเปิดลิงก์นี้จะเชื่อมต่อข้อมูลล่าสุดอัตโนมัติทันที',
      });
    } catch {
      setFeedback({
        type: 'error',
        text: 'ไม่สามารถคัดลอกลิงก์ได้ กรุณาคัดลอก URL จากแถบเบราว์เซอร์แทน',
      });
    }
  };

  const handleManualSync = async () => {
    setFeedback(null);
    const res = await triggerGoogleSheetsSync();
    if (res.success) {
      setFeedback({
        type: 'success',
        text: res.message || `ซิงค์ข้อมูลเรียลไทม์สำเร็จ (${res.rowCount} แถว)`,
      });
    } else {
      setFeedback({
        type: 'error',
        text: res.message || 'เกิดข้อผิดพลาดในการซิงค์ข้อมูลจาก Google Sheets',
      });
    }
  };

  const handleSelectTabFromSpec = (spec: SheetMetadata) => {
    setInputSheetName(spec.recommendedTabName);
    setModalTab('sync');
    setFeedback({
      type: 'success',
      text: `เลือกแท็บ "${spec.recommendedTabName}" เรียบร้อยแล้ว พร้อมกดซิงค์`,
    });
  };

  const handleCopySpecTabName = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedTabName(name);
    setTimeout(() => setCopiedTabName(null), 2500);
  };

  const getUrlTypeBadge = (url: string) => {
    const trimmed = (url || '').trim();
    if (!trimmed) return null;
    if (trimmed.includes('/pub') || trimmed.includes('/d/e/')) {
      return {
        label: '✓ ตรวจพบ Published Comma-separated values (.csv): ลิงก์ที่แชร์แบบ CSV จาก Google Sheets สมบูรณ์แบบ พร้อมซิงค์ข้อมูลสด',
        className: isLight ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
      };
    }
    if (trimmed.includes('/spreadsheets/d/')) {
      return {
        label: '✓ ตรวจพบ Google Spreadsheet Link มาตรฐาน: ระบบจะดึงข้อมูลผ่าน Live CSV Export อัตโนมัติ (ตั้งสิทธิ์เป็น "ทุกคนที่มีลิงก์มีสิทธิ์ดู")',
        className: isLight ? 'text-cyan-700 bg-cyan-50 border-cyan-200' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
      };
    }
    if (!trimmed.startsWith('http') && (trimmed.includes('\n') || (trimmed.includes(',') && trimmed.length > 40))) {
      return {
        label: '📋 ตรวจพบข้อความ CSV ดิบ: สามารถกดปุ่มบันทึก/ซิงค์เพื่อนำเข้าสู่ฐานข้อมูลได้ทันที',
        className: isLight ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-purple-400 bg-purple-500/10 border-purple-500/25',
      };
    }
    if (trimmed.startsWith('http')) {
      return {
        label: '✓ ลิงก์ URL ภายนอก: พร้อมส่งคำขอดึงไฟล์ CSV จาก URL ที่ระบุ',
        className: isLight ? 'text-sky-700 bg-sky-50 border-sky-200' : 'text-sky-400 bg-sky-500/10 border-sky-500/25',
      };
    }
    return {
      label: '⚠️ รูปแบบลิงก์อาจไม่สมบูรณ์ (ควรเป็นลิงก์ที่ขึ้นต้นด้วย https://docs.google.com/spreadsheets/...)',
      className: isLight ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    };
  };

  const handleImportPastedCsv = () => {
    if (!pasteCsvContent.trim()) {
      setFeedback({ type: 'error', text: 'กรุณาวางข้อความ Comma-separated values (CSV) ก่อนกดยืนยัน' });
      return;
    }
    setIsProcessingPaste(true);
    try {
      const type = pasteType === 'auto' ? undefined : pasteType;
      const res = importSheetCsv(pasteCsvContent.trim(), type);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `นำเข้าข้อมูลสำเร็จ (${res.rowCount} แถว - ${res.message})`,
        });
        setPasteCsvContent('');
      } else {
        setFeedback({ type: 'error', text: res.message || 'ไม่สามารถนำเข้าข้อมูล CSV ได้' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการประมวลผล CSV' });
    } finally {
      setIsProcessingPaste(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setPasteCsvContent(text);
        setFeedback({ type: 'success', text: `โหลดไฟล์ "${file.name}" เรียบร้อยแล้ว พร้อมกดยืนยันนำเข้าข้อมูล` });
      }
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', text: 'เกิดข้อผิดพลาดในการอ่านไฟล์' });
    };
    reader.readAsText(file, 'utf-8');
  };

  const selectedSpec = SHEET_SPECS.find((s) => s.id === selectedSpecId) || SHEET_SPECS[0];
  const urlBadge = getUrlTypeBadge(inputUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'liquid-glass-modal border-cyan-500/30 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-b ${
            isLight ? 'border-slate-200 bg-slate-50/80' : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                isLight
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  Google Sheets Realtime Sync
                </h2>
                {/* Live Realtime Badge */}
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isRealtimeConnected
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : isLight
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span>{isRealtimeConnected ? 'ฐานข้อมูลกลาง Realtime: เชื่อมต่อแล้ว' : 'กำลังเชื่อมต่อฐานข้อมูล...'}</span>
                </div>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                ซิงค์ข้อมูล Google Sheets แบบ Realtime อัตโนมัติ รองรับ 7 ชีทหลักของฝ่ายขาย
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSyncModalOpen(false)}
            className={`p-2 rounded-xl transition-colors ${
              isLight ? 'text-slate-500 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Top Tabs */}
        <div
          className={`px-6 pt-3 flex items-center gap-2 border-b overflow-x-auto ${
            isLight ? 'border-slate-200 bg-slate-100/50' : 'border-white/10 bg-white/[0.01]'
          }`}
        >
          <button
            type="button"
            onClick={() => setModalTab('sync')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              modalTab === 'sync'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>⚡ ตั้งค่าลิงก์ Google Sheets (Sync Setup)</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('paste_csv')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              modalTab === 'paste_csv'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>📋 วางข้อความ CSV / อัปโหลดไฟล์ (Direct CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('schemas')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              modalTab === 'schemas'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>📑 โครงสร้าง 7 ชีท &amp; คอลัมน์ที่กำหนด (7 Sheets Specs)</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {modalTab === 'sync' ? (
            <>
              {/* Status Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <span className={`text-[11px] block font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    สถานะ Realtime
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-bold">
                    <Radio className={`w-3.5 h-3.5 ${isRealtimeConnected ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <span className={isRealtimeConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}>
                      {isRealtimeConnected ? 'ออนไลน์พร้อมซิงค์' : 'รอการเชื่อมต่อ'}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <span className={`text-[11px] block font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    ซิงค์ล่าสุด
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-bold truncate">
                    <Clock className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span className="truncate">
                      {sheetsConfig.lastSyncTime
                        ? new Date(sheetsConfig.lastSyncTime).toLocaleTimeString('th-TH')
                        : 'ยังไม่เคยซิงค์'}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <span className={`text-[11px] block font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    แถวข้อมูลในระบบ
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-bold">
                    <Database className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-purple-600 dark:text-purple-400 font-mono">
                      {formatNumber(sheetsConfig.syncedRowCount || 220)} แถว
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <span className={`text-[11px] block font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    จำนวนครั้งที่ซิงค์
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400 font-mono">
                      {sheetsConfig.syncCount || 0} ครั้ง
                    </span>
                  </div>
                </div>
              </div>

              {/* Feedback banner */}
              {feedback && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-center gap-2.5 animate-fade-in ${
                    feedback.type === 'success'
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : isLight
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  )}
                  <span className="font-medium">{feedback.text}</span>
                </div>
              )}

              {/* Configuration Form */}
              <form onSubmit={handleSaveAndSync} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      ลิงก์ Google Sheets หรือ Published Comma-separated values (.csv) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowHowToGuide(!showHowToGuide)}
                      className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showHowToGuide ? 'ซ่อนคำแนะนำ' : 'วิธีคัดลอกลิงก์ CSV จาก Google Sheets'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Link2 className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                    <input
                      type="text"
                      required
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="วางลิงก์ เช่น https://docs.google.com/spreadsheets/d/e/.../pub?output=csv หรือ /edit"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                          : 'bg-slate-900/90 border-slate-700 text-white placeholder-slate-500'
                      }`}
                    />
                  </div>

                  {/* Dynamic URL badge */}
                  {urlBadge && (
                    <div className={`mt-2 p-2 rounded-xl text-[11px] font-medium border flex items-center gap-2 animate-fade-in ${urlBadge.className}`}>
                      <span>{urlBadge.label}</span>
                    </div>
                  )}

                  {/* Expandable Guide */}
                  {showHowToGuide && (
                    <div className={`mt-2.5 p-3.5 rounded-2xl border text-xs animate-fade-in ${isLight ? 'bg-amber-50/90 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'}`}>
                      <div className="font-bold flex items-center gap-1.5 mb-1.5">
                        <Info className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>วิธีสร้างและคัดลอกลิงก์ Comma-separated values (.csv) จาก Google Sheets:</span>
                      </div>
                      <ol className="list-decimal pl-5 space-y-1.5 text-[11px] leading-relaxed">
                        <li>เปิด Google Sheets ของคุณ</li>
                        <li>คลิกเมนู <strong>ไฟล์ (File)</strong> &gt; <strong>แชร์ (Share)</strong> &gt; <strong>เผยแพร่ไปยังเว็บ (Publish to web)</strong></li>
                        <li>ในหน้าต่าง ให้เลือกชีทที่ต้องการ หรือ 'ทั้งเอกสาร'</li>
                        <li>เปลี่ยนจาก 'หน้าเว็บ' เป็น <strong>'ค่าที่คั่นด้วยเครื่องหมายจุลภาค (.csv) / Comma-separated values (.csv)'</strong></li>
                        <li>กดปุ่ม <strong>'เผยแพร่' (Publish)</strong> แล้วคัดลอกลิงก์มาวางในช่องนี้ได้ทันที!</li>
                        <li>หรือหากใช้ลิงก์จากแถบเบราว์เซอร์ปกติ ให้ตั้งค่าแชร์เป็น <strong>"ทุกคนที่มีลิงก์มีสิทธิ์ดู" (Anyone with the link can view)</strong></li>
                      </ol>
                    </div>
                  )}
                  <p className={`text-[11px] mt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    รองรับทั้ง Published CSV link (/pub?output=csv), Share Link, Edit Link, หรือข้อความ CSV โดยตรง
                  </p>
                </div>

                {/* Sheet Tab Name and Quick Selection Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      ชื่อแท็บชีท (Sheet Tab Name)
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalTab('schemas')}
                      className="text-[11px] text-cyan-500 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>ดูโครงสร้างคอลัมน์ของแต่ละชีท</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={inputSheetName}
                    onChange={(e) => setInputSheetName(e.target.value)}
                    placeholder="เช่น Lead Report, Forecast Sales Report, Quotation Report (เว้นว่างเพื่อใช้แท็บแรก)"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-900/90 border-slate-700 text-white'
                    }`}
                  />

                  {/* 7 Sheets Quick Chips */}
                  <div className="mt-2 space-y-1.5">
                    <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      ⚡ คลิกเพื่อเลือกชีทที่ต้องการซิงค์ทันที:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SHEET_SPECS.map((spec) => (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() => setInputSheetName(spec.recommendedTabName)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                            inputSheetName === spec.recommendedTabName
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500 font-bold'
                              : isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                          }`}
                        >
                          {spec.title}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setInputSheetName('')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                          !inputSheetName
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500 font-bold'
                            : isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                        }`}
                      >
                        แท็บแรก (Default)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block mb-1.5 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      ความถี่ในการตรวจจับข้อมูลใหม่ (Auto-Sync Interval)
                    </label>
                    <select
                      value={intervalSec}
                      onChange={(e) => setIntervalSec(Number(e.target.value))}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900'
                          : 'bg-slate-900/90 border-slate-700 text-white'
                      }`}
                    >
                      <option value={15}>ทุก 15 วินาที (เร็วที่สุด - Realtime)</option>
                      <option value={30}>ทุก 30 วินาที (แนะนำ)</option>
                      <option value={60}>ทุก 1 นาที</option>
                      <option value={300}>ทุก 5 นาที</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <div
                      className={`w-full p-3 rounded-2xl border flex items-center justify-between ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
                      }`}
                    >
                      <div>
                        <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          ซิงค์อัตโนมัติในพื้นหลัง
                        </div>
                        <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          ดึงข้อมูลใหม่ทุกๆ {intervalSec} วินาที
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoSync}
                        onChange={(e) => setAutoSync(e.target.checked)}
                        className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleManualSync}
                      disabled={isSyncingSheets}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        isSyncingSheets
                          ? 'opacity-70 cursor-not-allowed bg-slate-700 text-white'
                          : isLight
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                      <span>{isSyncingSheets ? 'กำลังซิงค์ข้อมูล...' : '⚡ ซิงค์ทันทีเดี๋ยวนี้ (Sync Now)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyTeamLink}
                      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                      }`}
                      title="คัดลอกลิงก์แชร์สำหรับเพื่อนร่วมงาน เครื่องอื่นเปิดลิงก์นี้จะเชื่อมโยงชีทและอัปเดต Realtime อัตโนมัติทันที"
                    >
                      {hasCopiedLink ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">คัดลอกลิงก์แล้ว!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-cyan-500" />
                          <span>แชร์ลิงก์ให้ทีม</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSyncingSheets}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      isLight
                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกการตั้งค่า &amp; เชื่อมต่อชีท</span>
                  </button>
                </div>
              </form>

              {/* Master-Client One-Device Sync Banner */}
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  isLight ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200' : 'bg-gradient-to-r from-emerald-950/20 to-teal-950/20 border-emerald-500/30'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                  <Users className="w-4 h-4" />
                  <span>ซิงค์ Google Sheets เครื่องเดียว — ใช้งาน Realtime พร้อมกันได้ทั้งองค์กร:</span>
                </div>
                <div className={`space-y-1.5 text-[11px] leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                    <div>
                      <strong>เครื่องหลัก (Master Sync):</strong> เมื่อตั้งค่าลิงก์ Google Sheets บนเครื่องนี้ ข้อมูลจะถูกจัดเก็บบนฐานข้อมูลกลางของเซิร์ฟเวอร์ทันที
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                    <div>
                      <strong>เครื่องอื่นๆ ของทีม:</strong> ไม่ต้องกรอกลิงก์หรือกดซิงค์ซ้ำ เพียงเปิดหน้าเว็บระบบ ทันทีที่ Google Sheets หรือเครื่องหลักมีการอัปเดต ทุกคนจะเห็นข้อมูลล่าสุดพร้อมกันแบบ Realtime ทันที
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Sync History Logs */}
              <div className="space-y-2">
                <h4 className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  ประวัติการซิงค์ล่าสุด (Recent Realtime Sync Logs)
                </h4>
                <div
                  className={`rounded-xl border overflow-hidden max-h-36 overflow-y-auto ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  {syncLogs.length === 0 ? (
                    <div className={`p-4 text-center ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      ยังไม่มีประวัติการซิงค์
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/50">
                      {syncLogs.slice(0, 10).map((log) => (
                        <div key={log.id} className="px-3.5 py-2 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            <span className={`truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                              {log.message}
                            </span>
                          </div>
                          <span className={`shrink-0 font-mono text-[10px] ml-2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                            {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : modalTab === 'paste_csv' ? (
            /* Direct CSV Text Paste & Upload Tab */
            <div className="space-y-5 animate-fade-in">
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  isLight ? 'bg-purple-50/70 border-purple-200 text-slate-800' : 'bg-purple-950/20 border-purple-500/30 text-slate-200'
                }`}
              >
                <ClipboardPaste className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-purple-600 dark:text-purple-400">
                    วางเนื้อหาข้อความ Comma-separated values (CSV) โดยตรง หรืออัปโหลดไฟล์ .csv
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    หากคุณไม่ต้องการเชื่อมต่อ URL ผ่านเว็บ หรือมีไฟล์ .csv ที่ดาวน์โหลดมาจาก Google Sheets หรือระบบอื่นๆ สามารถนำข้อความมาวางที่นี่ หรือเลือกไฟล์ .csv จากเครื่องคอมพิวเตอร์ของคุณเพื่อนำเข้าข้อมูลแบบ Realtime ได้ทันที
                  </p>
                </div>
              </div>

              {/* Feedback banner */}
              {feedback && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-center gap-2.5 animate-fade-in ${
                    feedback.type === 'success'
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : isLight
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  )}
                  <span className="font-medium">{feedback.text}</span>
                </div>
              )}

              {/* Select Target Sheet Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block mb-1.5 font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    เลือกประเภทชีทที่ต้องการนำเข้าข้อมูล
                  </label>
                  <select
                    value={pasteType}
                    onChange={(e) => setPasteType(e.target.value as SheetType | 'auto')}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-900/90 border-slate-700 text-white'
                    }`}
                  >
                    <option value="auto">✨ ตรวจจับอัตโนมัติจากหัวตาราง (Auto-detect)</option>
                    <option value="lead_report">Lead Report (ลีดลูกค้า - 70 คอลัมน์)</option>
                    <option value="forecast_sales">Forecast Sales Report (พยากรณ์การขาย - 49 คอลัมน์)</option>
                    <option value="quotation_report">Quotation Report (ใบเสนอราคา - 43 คอลัมน์)</option>
                    <option value="database">Database Config (ตั้งค่าข้อมูลดิบ)</option>
                    <option value="measurement_report">Measurement Report (ตารางวัดพื้นที่/เข้าหน้างาน)</option>
                    <option value="installment_report">Installment Report (ยอดชำระเงิน/มัดจำ)</option>
                    <option value="claim_report">Claim Report (งานแก้ไขเคลม - 21 คอลัมน์)</option>
                    <option value="sales_summary">Sales Summary (สรุปยอดขาย 3 สินค้าหลัก)</option>
                  </select>
                </div>

                {/* Upload File Button */}
                <div>
                  <label className={`block mb-1.5 font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    หรืออัปโหลดไฟล์ .csv จากเครื่องคอมพิวเตอร์
                  </label>
                  <label
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border border-dashed transition-all ${
                      isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                        : 'bg-white/5 hover:bg-white/10 border-white/20 text-slate-200'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-purple-500" />
                    <span>เลือกไฟล์ .csv จากเครื่อง</span>
                    <input
                      type="file"
                      accept=".csv, .txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Textarea for CSV Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    ข้อความ Comma-separated values (CSV Content)
                  </label>
                  {pasteCsvContent && (
                    <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                      {pasteCsvContent.split('\n').filter((l) => l.trim()).length} แถว ({(pasteCsvContent.length / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
                <textarea
                  rows={8}
                  value={pasteCsvContent}
                  onChange={(e) => setPasteCsvContent(e.target.value)}
                  placeholder="คัดลอกข้อความจาก Google Sheets หรือเปิดไฟล์ .csv แล้ววางที่นี่..."
                  className={`w-full p-3.5 rounded-2xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900/90 border-slate-700 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPasteCsvContent('')}
                  disabled={!pasteCsvContent}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-30 ${
                    isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-white/10'
                  }`}
                >
                  ล้างข้อความ
                </button>

                <button
                  type="button"
                  onClick={handleImportPastedCsv}
                  disabled={!pasteCsvContent.trim() || isProcessingPaste}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isLight
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-900/10'
                      : 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-purple-950/40'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessingPaste ? 'กำลังนำเข้าข้อมูล...' : 'นำเข้าข้อมูลสู่ระบบทันที (Import CSV Now)'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Schemas & Columns Reference Tab */
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  isLight ? 'bg-cyan-50/70 border-cyan-200 text-slate-800' : 'bg-cyan-950/20 border-cyan-500/30 text-slate-200'
                }`}
              >
                <Info className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-cyan-600 dark:text-cyan-400">
                    ข้อมูลโครงสร้างคอลัมน์ของทั้ง 7 ชีท ที่ระบบจดจำและรองรับการดึงข้อมูลอย่างแม่นยำ
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    ระบบได้ตั้งค่าแมปปิ้งคอลัมน์และอัลกอริทึมการคำนวณตามสเปกทั้ง 7 ชีทอย่างครบถ้วน สามารถเลือกแท็บชีทเพื่อซิงค์ข้อมูลลงระบบได้ทันที
                  </p>
                </div>
              </div>

              {/* Sheet Selector Buttons */}
              <div className="flex flex-wrap gap-2">
                {SHEET_SPECS.map((spec) => (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => setSelectedSpecId(spec.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                      selectedSpecId === spec.id
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                        : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    <span>{spec.title}</span>
                  </button>
                ))}
              </div>

              {/* Selected Sheet Details Card */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-white/10'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <span>{selectedSpec.title}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                        {selectedSpec.recommendedTabName}
                      </span>
                    </h3>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {selectedSpec.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopySpecTabName(selectedSpec.recommendedTabName)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                      }`}
                    >
                      {copiedTabName === selectedSpec.recommendedTabName ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500 font-bold">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>คัดลอกชื่อแท็บ</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTabFromSpec(selectedSpec)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-sm"
                    >
                      <span>เลือกซิงค์แท็บนี้ ⚡</span>
                    </button>
                  </div>
                </div>

                {/* Columns Mapping Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-700/30">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={isLight ? 'bg-slate-200/70 text-slate-800' : 'bg-white/5 text-slate-300'}>
                        <th className="px-3.5 py-2.5 font-bold w-20">คอลัมน์</th>
                        <th className="px-3.5 py-2.5 font-bold w-44">ชื่อข้อมูลที่ระบุ</th>
                        <th className="px-3.5 py-2.5 font-bold">คำอธิบาย &amp; กฎการแปลงข้อมูล</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                      {selectedSpec.columns.map((col, idx) => (
                        <tr
                          key={idx}
                          className={
                            isLight
                              ? idx % 2 === 0
                                ? 'bg-white'
                                : 'bg-slate-50/70'
                              : idx % 2 === 0
                              ? 'bg-slate-900/40'
                              : 'bg-white/[0.02]'
                          }
                        >
                          <td className="px-3.5 py-2">
                            <span className="px-1.5 py-0.5 rounded font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/30">
                              Col.{col.colLetter}
                            </span>
                          </td>
                          <td className={`px-3.5 py-2 font-sans font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                            {col.name}
                          </td>
                          <td className="px-3.5 py-2 font-sans text-slate-400">
                            <div>{col.description}</div>
                            {col.rule && (
                              <div className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold mt-0.5">
                                💡 {col.rule}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
