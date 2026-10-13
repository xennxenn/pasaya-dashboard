import React, { useState, useRef } from 'react';
import {
  Settings,
  Palette,
  Calendar,
  RefreshCw,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Image as ImageIcon,
  Upload,
  Trash2,
  Eye,
  Sliders,
  Droplets,
  Database,
  FileSpreadsheet,
  Radio,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { THEME_CONFIGS, getThemePrimaryText } from '../../utils/theme';
import { FontTheme } from '../../types';

// Luxury Preset SVG Logos for PASAYA
const PRESET_LOGOS = [
  {
    name: 'PASAYA Gold Monogram (มงกุฎทองหรูหรา)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 50" fill="none"><rect width="160" height="50" rx="8" fill="%230f172a"/><path d="M25 12L32 25L39 12L46 38H18L25 12Z" fill="%23d97706"/><circle cx="32" cy="10" r="3" fill="%23f59e0b"/><text x="56" y="28" fill="%23f8fafc" font-family="sans-serif" font-weight="bold" font-size="14" letter-spacing="2">PASAYA</text><text x="56" y="40" fill="%23d97706" font-family="sans-serif" font-size="8" letter-spacing="1">CURTAIN CENTER</text></svg>',
  },
  {
    name: 'PASAYA Cyan Neon (ไอคอนกระจกคริสตัล)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 50" fill="none"><rect width="160" height="50" rx="8" fill="%23082f49"/><rect x="15" y="10" width="30" height="30" rx="8" fill="%230284c7"/><path d="M23 33V17H28.5C31.5 17 33.5 18.5 33.5 21C33.5 23.5 31.5 25 28.5 25H26V33H23Z" fill="%23ffffff"/><text x="54" y="28" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="14" letter-spacing="2">PASAYA</text><text x="54" y="40" fill="%2338bdf8" font-family="sans-serif" font-size="8" letter-spacing="1">CURTAIN CENTER</text></svg>',
  },
  {
    name: 'PASAYA Minimalist Monochrome (ขาว-ดำ คมชัด)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 50" fill="none"><rect width="160" height="50" rx="8" fill="%231e293b"/><circle cx="28" cy="25" r="14" stroke="%23ffffff" stroke-width="2"/><text x="23" y="30" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="14">P</text><text x="52" y="28" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="14" letter-spacing="2">PASAYA</text><text x="52" y="40" fill="%2394a3b8" font-family="sans-serif" font-size="8" letter-spacing="1">FABRIC &amp; DECOR</text></svg>',
  },
];

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllData,
    sheetsConfig,
    isRealtimeConnected,
    isSyncingSheets,
    setIsSyncModalOpen,
    triggerGoogleSheetsSync,
    updateGoogleSheetsConfig,
  } = useSales();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isLight = settings.themeMode === 'light';
  const currentTheme = THEME_CONFIGS[settings.fontTheme] || THEME_CONFIGS.cyan;
  const primaryTextColor = getThemePrimaryText(settings.fontTheme, settings.themeMode);

  const [customUrlInput, setCustomUrlInput] = useState(settings.appLogoUrl || '');
  const [logoError, setLogoError] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle image upload from user device / attached image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('กรุณาเลือกไฟล์รูปภาพ (PNG, JPG, SVG, WebP)');
      setTimeout(() => setLogoError(null), 4000);
      return;
    }
    setLogoError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateSettings({
          appLogoUrl: result,
          showAppLogo: true,
        });
        setCustomUrlInput(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div
        className={`pb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}
      >
        <h1
          className={`text-xl sm:text-2xl font-bold flex items-center gap-2.5 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          <Settings className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          <span>การตั้งค่าระบบ (Settings & Customization)</span>
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          จัดการโลโก้แอปพลิเคชัน สลับโหมดสว่าง/มืด ปรับแต่งสี Font และเกณฑ์คำนวณ YTD
        </p>
      </div>

      {/* Feature 1: Application Logo Management */}
      <div
        className={`rounded-3xl p-6 shadow-sm border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'liquid-glass specular-rim text-white'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isLight
                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-400/20'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide">
                จัดการการแสดงโลโก้แอปพลิเคชัน (App Logo Management)
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                เปิด/ปิด แสดงโลโก้, อัปโหลดรูปภาพโลโก้ของคุณ, หรือเลือกชุดโลโก้มาตรฐานของ PASAYA
              </p>
            </div>
          </div>

          {/* Toggle Show/Hide Logo */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              แสดงโลโก้
            </span>
            <input
              type="checkbox"
              checked={settings.showAppLogo}
              onChange={(e) => updateSettings({ showAppLogo: e.target.checked })}
              className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="mt-5 space-y-5">
          {/* Live Preview Bar */}
          <div
            className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-white/[0.03] border-white/10'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <span className={`text-xs font-medium whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                ตัวอย่างการแสดงผล:
              </span>

              <div className="flex flex-wrap items-center gap-3">
                {/* Light Mode Preview */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    โหมดสว่าง (Light)
                  </span>
                  {settings.showAppLogo && (
                    settings.appLogoUrl ? (
                      <img
                        src={settings.appLogoUrl}
                        alt="Logo Preview Light"
                        className="h-8 w-auto max-w-[120px] object-contain rounded"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">
                        P
                      </div>
                    )
                  )}
                  <span className="text-xs font-bold text-slate-900">
                    PASAYA <span className="text-cyan-600">Curtain Center</span>
                  </span>
                </div>

                {/* Dark Mode Preview */}
                <div className="p-2.5 rounded-xl bg-[#040a1c] border border-white/15 shadow-md flex items-center gap-3">
                  <span className="text-[10px] font-bold text-cyan-400 bg-white/10 px-1.5 py-0.5 rounded">
                    โหมดมืด (Dark)
                  </span>
                  {settings.showAppLogo && (
                    settings.appLogoUrl ? (
                      <div
                        className={
                          settings.logoDarkBacking !== false
                            ? 'bg-white/95 px-2 py-0.5 rounded-lg shadow-sm'
                            : ''
                        }
                      >
                        <img
                          src={settings.appLogoUrl}
                          alt="Logo Preview Dark"
                          className={`h-8 w-auto max-w-[120px] object-contain rounded ${
                            settings.logoInvertInDark ? 'brightness-0 invert' : ''
                          }`}
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                        P
                      </div>
                    )
                  )}
                  <span className="text-xs font-bold text-white">
                    PASAYA <span className="text-cyan-400">Curtain Center</span>
                  </span>
                </div>
              </div>
            </div>

            {settings.appLogoUrl && (
              <button
                type="button"
                onClick={() => {
                  updateSettings({ appLogoUrl: '' });
                  setCustomUrlInput('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all self-start md:self-auto ${
                  isLight
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/60'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบโลโก้ที่กำหนดเอง</span>
              </button>
            )}
          </div>

          {/* Action 1: Upload from Device / Image file */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-2xl border flex flex-col justify-between ${
                isLight
                  ? 'bg-white border-slate-200 shadow-xs'
                  : 'bg-white/[0.02] border-white/10'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-bold mb-1">
                  <Upload className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>อัปโหลดรูปภาพโลโก้จากอุปกรณ์</span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  เลือกไฟล์รูปภาพโลโก้ของคุณ (รองรับ PNG, JPG, WebP, SVG) ระบบจะบันทึกลงแคชอัตโนมัติ
                </p>
              </div>

              <div className="mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    isLight
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30 hover:bg-cyan-500/30'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>เลือกไฟล์รูปภาพโลโก้...</span>
                </button>
              </div>
            </div>

            {/* Action 2: Direct URL */}
            <div
              className={`p-4 rounded-2xl border flex flex-col justify-between ${
                isLight
                  ? 'bg-white border-slate-200 shadow-xs'
                  : 'bg-white/[0.02] border-white/10'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-bold mb-1">
                  <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>ใส่ลิงก์รูปภาพโลโก้ (Image URL)</span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  วางลิงก์รูปภาพโลโก้จากเว็บไซต์หรือระบบโฮสต์ของคุณ
                </p>
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className={`flex-1 px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({
                      appLogoUrl: customUrlInput.trim(),
                      showAppLogo: true,
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    isLight
                      ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-900'
                      : 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                  }`}
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>

          {/* Preset Logos for PASAYA */}
          <div className="space-y-2 pt-2">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              หรือเลือกชุดโลโก้มาตรฐาน PASAYA:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESET_LOGOS.map((preset, idx) => {
                const isSelected = settings.appLogoUrl === preset.url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      updateSettings({
                        appLogoUrl: preset.url,
                        showAppLogo: true,
                      });
                      setCustomUrlInput(preset.url);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? isLight
                          ? 'bg-cyan-50 border-cyan-500 shadow-sm ring-2 ring-cyan-200'
                          : 'bg-cyan-500/15 border-cyan-400 ring-2 ring-cyan-500/40'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-center p-2 rounded-lg bg-slate-950/40 border border-white/10 mb-2">
                      <img src={preset.url} alt={preset.name} className="h-8 w-auto object-contain" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        {preset.name}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dark Mode Logo Visibility Adaptation Controls */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                การปรับการแสดงผลโลโก้ใน Dark Mode (สำหรับโลโก้สีดำ / สีเข้ม)
              </span>
            </div>
            <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              เมื่อใช้โลโก้ที่มีสีดำ บนพื้นหลัง Dark Mode อาจกลืนไปกับพื้นหลัง เลือกระบบตัวช่วยแสดงผลด้านล่างเพื่อแก้ปัญหาทันที:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  settings.logoDarkBacking !== false
                    ? isLight
                      ? 'bg-white border-cyan-400 ring-1 ring-cyan-200 shadow-2xs'
                      : 'bg-cyan-500/10 border-cyan-400/50'
                    : isLight
                    ? 'bg-white border-slate-200'
                    : 'bg-white/[0.02] border-white/5'
                }`}
              >
                <input
                  type="checkbox"
                  checked={settings.logoDarkBacking !== false}
                  onChange={(e) => updateSettings({ logoDarkBacking: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <div>
                  <span className={`text-xs font-semibold block ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    แผ่นรองพื้นสว่างใน Dark Mode (แนะนำ)
                  </span>
                  <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    ใส่กรอบรองพื้นกระจกสีขาวละมุนด้านหลังโลโก้เฉพาะตอนอยู่ใน Dark Mode ทำให้มองเห็นโลโก้สีดำได้คมชัด 100%
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  settings.logoInvertInDark
                    ? isLight
                      ? 'bg-white border-cyan-400 ring-1 ring-cyan-200 shadow-2xs'
                      : 'bg-cyan-500/10 border-cyan-400/50'
                    : isLight
                    ? 'bg-white border-slate-200'
                    : 'bg-white/[0.02] border-white/5'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!settings.logoInvertInDark}
                  onChange={(e) => updateSettings({ logoInvertInDark: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <div>
                  <span className={`text-xs font-semibold block ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    แปลงสีโลโก้เป็นสีขาวใน Dark Mode (Invert)
                  </span>
                  <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    กลับสีของไฟล์โลโก้ให้กลายเป็นสีขาวสว่างเฉพาะเมื่ออยู่ใน Dark Mode
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 2: Appearance Mode Selector (Light vs Dark Mode) */}
      <div
        className={`rounded-3xl p-6 shadow-sm border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'liquid-glass specular-rim text-white'
        }`}
      >
        <div
          className={`flex items-center gap-2.5 pb-3 border-b ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}
        >
          <div
            className={`p-2 rounded-xl ${
              isLight
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-cyan-500/15 text-cyan-400 border border-cyan-400/20'
            }`}
          >
            {isLight ? <Sun className="w-5 h-5 text-amber-600" /> : <Moon className="w-5 h-5 text-cyan-400" />}
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wide">
              โหมดการแสดงผล (Appearance Mode)
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              เลือกธีมแบบโทนสว่างจริง (Pure Light) หรือธีมมืด (Midnight OLED)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {/* Light Mode Card */}
          <button
            type="button"
            onClick={() => updateSettings({ themeMode: 'light' })}
            className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all relative overflow-hidden ${
              isLight
                ? 'bg-cyan-50/70 border-cyan-500 shadow-md ring-2 ring-cyan-200'
                : 'bg-white/[0.04] border-white/15 hover:border-white/30'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-xs">
              <Sun className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Light Mode (โทนสว่าง - สะอาดตา)
                </span>
                {isLight && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
              </div>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                โทนสว่างจริง ไม่มีสีเข้มปน คมชัดสูง ตัวหนังสืออ่านง่าย เหมาะสำหรับใช้งานในสำนักงาน
              </p>
            </div>
          </button>

          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => updateSettings({ themeMode: 'dark' })}
            className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all relative overflow-hidden ${
              !isLight
                ? 'bg-gradient-to-br from-slate-900 to-[#071328] border-cyan-500 shadow-md ring-2 ring-cyan-500/40 text-white'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#030712] border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-xs">
              <Moon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${!isLight ? 'text-white' : 'text-slate-800'}`}>
                  Dark Mode (โทนมืด)
                </span>
                {!isLight && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </div>
              <p className={`text-xs mt-1 ${!isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                โทนสีน้ำเงิน-ดำเข้ม สบายตา เหมาะสำหรับใช้งานในห้องประชุม
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Feature 3: Font Color Theme Customizer */}
      <div
        className={`rounded-3xl p-6 shadow-sm border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'liquid-glass specular-rim text-white'
        }`}
      >
        <div
          className={`flex items-center gap-2.5 pb-3 border-b ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}
        >
          <Palette className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h2 className="text-base font-bold">
            เลือกโทนสี Font (Font Accent Color)
          </h2>
        </div>

        <p className={`text-xs mt-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          ปรับเปลี่ยนสีไฮไลต์ของตัวอักษร หัวข้อ และป้ายสถานะต่าง ๆ ในระบบ
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3">
          {(Object.keys(THEME_CONFIGS) as FontTheme[]).map((themeKey) => {
            const t = THEME_CONFIGS[themeKey];
            const isSelected = settings.fontTheme === themeKey;

            return (
              <button
                key={themeKey}
                type="button"
                onClick={() => updateSettings({ fontTheme: themeKey })}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  isSelected
                    ? isLight
                      ? 'bg-slate-50 border-cyan-600 shadow-sm ring-2 ring-cyan-200'
                      : 'bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                    : isLight
                    ? 'bg-white border-slate-200 hover:bg-slate-50'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-white/40 shrink-0 mt-0.5 shadow-xs"
                  style={{ backgroundColor: t.chartColor }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isLight ? t.lightPrimaryText : t.primaryText
                      }`}
                    >
                      {t.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    )}
                  </div>
                  <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    ฟอนต์: <strong>Bai Jamjuree</strong>
                  </div>
                  <div
                    className={`text-xs font-mono font-bold mt-2 ${
                      isLight ? t.lightAccentText : t.accentText
                    }`}
                  >
                    ฿5,428,669 (ตัวอย่าง)
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature 4: YTD Calculation Criteria */}
      <div
        className={`rounded-3xl p-6 shadow-sm border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'liquid-glass specular-rim text-white'
        }`}
      >
        <div
          className={`flex items-center gap-2.5 pb-3 border-b ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}
        >
          <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h2 className="text-base font-bold">
            เกณฑ์การคำนวณยอดขายรวมถึงปัจจุบัน (YTD Cutoff)
          </h2>
        </div>

        <p className={`text-xs mt-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          กำหนดช่วงเดือนสำหรับคอลัมน์ "ยอดขายรวมถึงปัจจุบัน (YTD)" ในตาราง Overview
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3">
          <select
            value={settings.ytdCutoffMonth}
            onChange={(e) =>
              updateSettings({ ytdCutoffMonth: parseInt(e.target.value, 10) })
            }
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border focus:outline-none ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-slate-900 border-slate-700 text-white'
            }`}
          >
            <option value={9}>ถึงเดือน 9 (กันยายน - SEP ตามโจทย์)</option>
            <option value={10}>ถึงเดือน 10 (ตุลาคม - OCT เดือนปัจจุบัน)</option>
            <option value={6}>ถึงเดือน 6 (มิถุนายน - JUN สิ้น Q2)</option>
            <option value={3}>ถึงเดือน 3 (มีนาคม - MAR สิ้น Q1)</option>
            <option value={12}>ถึงเดือน 12 (ธันวาคม - DEC เต็มปี)</option>
          </select>

          <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            ระบบจะรวมข้อมูลตั้งแต่เดือน ม.ค. ถึงเดือนที่ท่านเลือก
          </span>
        </div>
      </div>

      {/* Feature 5: Liquid Glass Water Droplet Effect */}
      <div
        className={`rounded-3xl p-6 shadow-sm border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'liquid-glass specular-rim text-white'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isLight
                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-400/20'
              }`}
            >
              <Droplets className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                เอฟเฟกต์หยดน้ำตามเมาส์ (Liquid Glass Water Droplet Cursor)
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                แสดงเอฟเฟกต์หยดน้ำแก้วเหลวพร้อมระลอกคลื่นเฉพาะตำแหน่งที่เมาส์ชี้ และจางหายเองเมื่อเลื่อนผ่าน
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              เปิดใช้งาน
            </span>
            <input
              type="checkbox"
              checked={settings.waterDropletEffect ?? true}
              onChange={(e) => updateSettings({ waterDropletEffect: e.target.checked })}
              className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Feature 6: Central Database & Google Sheets Realtime Sync */}
      <div
        className={`rounded-3xl p-6 shadow-sm border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'liquid-glass specular-rim text-white'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isLight
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-400/20'
              }`}
            >
              <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                ฐานข้อมูลกลาง &amp; Google Sheets Realtime Sync
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                ใช้ฐานข้อมูลกลางเดียวกัน ทุกคนเห็นข้อมูลตรงกันทันทีพร้อมระบบซิงค์ Realtime อัตโนมัติ
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isRealtimeConnected
                ? isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : isLight
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isRealtimeConnected ? 'Realtime Connected' : 'Connecting...'}</span>
          </div>
        </div>

        <div className="pt-4 space-y-4 text-xs">
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
            }`}
          >
            <div className="space-y-1">
              <div className="font-bold text-sm">
                {sheetsConfig.sheetUrl ? 'เชื่อมต่อ Google Sheets แล้ว' : 'ยังไม่ได้เชื่อมต่อ Google Sheets'}
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {sheetsConfig.sheetUrl
                  ? `URL: ${sheetsConfig.sheetUrl.slice(0, 50)}...`
                  : 'ระบุลิงก์ Google Sheets ของท่านเพื่อเริ่มซิงค์ยอดขายอัตโนมัติ'}
              </p>
              {sheetsConfig.lastSyncTime && (
                <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  ซิงค์ล่าสุด: {new Date(sheetsConfig.lastSyncTime).toLocaleString('th-TH')}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {syncToast && (
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                    syncToast.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {syncToast.type === 'success' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>{syncToast.message}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerGoogleSheetsSync();
                    setSyncToast({
                      type: res.success ? 'success' : 'error',
                      message: res.message,
                    });
                    setTimeout(() => setSyncToast(null), 5000);
                  }}
                  disabled={isSyncingSheets}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    isLight
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSheets ? 'กำลังซิงค์...' : 'ซิงค์เดี๋ยวนี้'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(true)}
                  className={`px-4 py-2 rounded-xl border font-bold transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                      : 'bg-white/5 border-white/15 text-white hover:bg-white/10'
                  }`}
                >
                  ตั้งค่าลิงก์ชีท
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 7: Reset Data */}
      <div
        className={`rounded-3xl p-6 shadow-sm border transition-all ${
          isLight
            ? 'bg-rose-50/50 border-rose-200 text-slate-900'
            : 'bg-rose-950/20 border-rose-800/40 text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
          <RefreshCw className="w-5 h-5" />
          <h2 className="text-base font-bold">รีเซ็ตข้อมูลสู่ค่าเริ่มต้น (Reset Data)</h2>
        </div>

        <p className={`text-xs mt-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          ล้างข้อมูลแคชทั้งหมดและดึงข้อมูลเริ่มต้นจากชีท Sales Report และรายชื่อพนักงานขายใหม่
        </p>

        {!showResetConfirm ? (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            รีเซ็ตข้อมูลระบบกลับสู่ค่าเริ่มต้น
          </button>
        ) : (
          <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
            <p className="text-xs font-bold text-rose-400">
              ⚠️ คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้น?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                ยืนยันการรีเซ็ต
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  isLight ? 'bg-slate-200 text-slate-800' : 'bg-white/10 text-slate-200'
                }`}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
