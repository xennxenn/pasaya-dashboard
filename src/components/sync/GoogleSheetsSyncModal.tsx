import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Clock,
  Database,
  Radio,
  Layers,
  Sparkles,
  Link2,
  Copy,
  Share2,
  Users,
  Monitor,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { formatNumber } from '../../utils/formatters';

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
  } = useSales();

  const isLight = settings.themeMode === 'light';

  const [inputUrl, setInputUrl] = useState(sheetsConfig.sheetUrl || '');
  const [inputSheetName, setInputSheetName] = useState(sheetsConfig.sheetName || '');
  const [autoSync, setAutoSync] = useState(sheetsConfig.autoSync ?? true);
  const [intervalSec, setIntervalSec] = useState(sheetsConfig.syncIntervalSec || 30);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
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
                ใช้ฐานข้อมูลกลางเดียวกัน ทุกคนเห็นข้อมูลตรงกันทันทีเมื่อชีทมีการอัปเดต
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

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
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
              <label className={`block mb-1.5 font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                ลิงก์ Google Sheets (Google Sheet URL หรือ Sheet ID) *
              </label>
              <div className="relative">
                <Link2 className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  required
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5n.../edit หรือ Published CSV link"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900/90 border-slate-700 text-white placeholder-slate-500'
                  }`}
                />
              </div>
              <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                รองรับทั้งลิงก์แบบ Share Link, Edit Link, หรือ Publish to Web (CSV)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block mb-1.5 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  ชื่อแท็บชีท (Sheet Tab Name - ถ้ามี)
                </label>
                <input
                  type="text"
                  value={inputSheetName}
                  onChange={(e) => setInputSheetName(e.target.value)}
                  placeholder="เช่น Sheet1 หรือ Sales Report (เว้นว่างเพื่อใช้แท็บแรก)"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-900/90 border-slate-700 text-white'
                  }`}
                />
              </div>

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
            </div>

            {/* Auto Sync Toggle */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
              }`}
            >
              <div>
                <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  เปิดโหมดซิงค์อัตโนมัติในพื้นหลัง (Background Realtime Sync)
                </div>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  เซิร์ฟเวอร์จะคอยดึงข้อมูลจาก Google Sheets และส่งอัปเดตไปยังหน้าจอของทุกคนแบบอัตโนมัติ
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer"
              />
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
                  <strong>เครื่องอื่นๆ ของทีม (Client Devices):</strong> ไม่ต้องกรอกลิงก์หรือกดซิงค์ซ้ำ เพียงเปิดหน้าเว็บระบบ ทันทีที่เครื่องหลักหรือ Google Sheets มีการอัปเดต ทุกเครื่องจะเห็นข้อมูลเปลี่ยนไปพร้อมกันแบบ Realtime ทันที
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <strong>การแชร์ให้ผู้อื่น:</strong> ส่งลิงก์แชร์จากปุ่ม <em>"แชร์ลิงก์ให้ทีม"</em> ด้านบน หรือเปิดผ่านโดเมน/IP เดียวกันในวงแลนออฟฟิศ
                </div>
              </div>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div
            className={`p-4 rounded-2xl border space-y-2.5 ${
              isLight ? 'bg-cyan-50/60 border-cyan-200' : 'bg-cyan-950/20 border-cyan-500/20'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-cyan-600 dark:text-cyan-400">
              <Layers className="w-4 h-4" />
              <span>วิธีตั้งค่าการแชร์ Google Sheets ให้ระบบสามารถดึงข้อมูลได้:</span>
            </div>
            <ol className={`list-decimal list-inside space-y-1 text-[11px] leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <li>เปิดไฟล์ Google Sheet ของท่าน (ตารางยอดขาย PASAYA)</li>
              <li>กดปุ่ม <strong>"แชร์ (Share)"</strong> ที่มุมบนขวาของ Google Sheets</li>
              <li>ในหัวข้อ <em>การเข้าถึงทั่วไป</em> ให้เปลี่ยนเป็น <strong>"ทุกคนที่มีลิงก์ (Anyone with the link)"</strong> และตั้งสิทธิ์เป็น <strong>"มีสิทธิ์ดู (Viewer)"</strong></li>
              <li>คัดลอกลิงก์ (Copy Link) แล้วนำมาวางในช่องด้านบน แล้วกด <strong>"ซิงค์ทันที"</strong></li>
              <li>หรือไปที่เมนู <strong>ไฟล์ (File) &gt; แชร์ &gt; เผยแพร่ไปยังเว็บ (Publish to web)</strong> เลือกทั้งเอกสารหรือชีทที่ต้องการเป็น <strong>ค่าที่คั่นด้วยจุลภาค (.csv)</strong> แล้วนำลิงก์มาวาง</li>
            </ol>
          </div>

          {/* Recent Sync History Logs */}
          <div className="space-y-2">
            <h4 className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              ประวัติการซิงค์ล่าสุด (Recent Realtime Sync Logs)
            </h4>
            <div
              className={`rounded-xl border overflow-hidden max-h-40 overflow-y-auto ${
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
        </div>

        {/* Modal Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            PASAYA Curtain Center — Central Database &amp; SSE Realtime Sync
          </span>
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(false)}
            className={`px-4 py-1.5 rounded-xl font-medium transition-colors ${
              isLight ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
