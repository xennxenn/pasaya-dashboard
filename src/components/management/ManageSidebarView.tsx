import React, { useState } from 'react';
import {
  Menu,
  PlusCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  LayoutDashboard,
  TrendingUp,
  Award,
  Target,
  Users,
  FileSpreadsheet,
  Settings,
  FileText,
  RotateCcw,
  Calendar,
  Percent,
  AlertTriangle,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';

const ICON_OPTIONS = [
  { name: 'LayoutDashboard', label: 'หน้าแดชบอร์ด (Dashboard)' },
  { name: 'Users', label: 'รายชื่อลูกค้า / พนักงาน (Lead & Users)' },
  { name: 'TrendingUp', label: 'ผลงานการขาย (Sales Performance)' },
  { name: 'Calendar', label: 'คิวนัดหมาย (Measurement Scheduling)' },
  { name: 'Target', label: 'เป้าหมาย KPI (Target vs Achievement)' },
  { name: 'Percent', label: 'อัตราปิดการขาย (Conversion Rate)' },
  { name: 'AlertTriangle', label: 'การเคลม / ปัญหา (Claim Issues)' },
  { name: 'Award', label: 'อันดับยอดขาย (Progress / Ranking)' },
  { name: 'FileSpreadsheet', label: 'ตารางชีทข้อมูล (Spreadsheet)' },
  { name: 'Settings', label: 'การตั้งค่า (Settings)' },
  { name: 'FileText', label: 'เอกสาร / รายงาน (Report)' },
];

export const ManageSidebarView: React.FC = () => {
  const {
    sidebarItems,
    toggleSidebarItemVisibility,
    reorderSidebarItems,
    deleteSidebarItem,
    addSidebarItem,
    resetSidebarItems,
    settings,
  } = useSales();

  const isLight = settings.themeMode === 'light';

  // Form for adding custom page
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('FileText');
  const [newDescription, setNewDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const sortedItems = [...sidebarItems].sort((a, b) => a.order - b.order);

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderSidebarItems(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < sortedItems.length - 1) {
      reorderSidebarItems(index, index + 1);
    }
  };

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    addSidebarItem({
      label: newLabel.trim(),
      icon: newIcon,
      visible: true,
      customDescription: newDescription.trim() || 'หน้าเพจที่กำหนดเองสำหรับ PASAYA Curtain Center',
    });

    setNewLabel('');
    setNewDescription('');
    setSuccessMsg('เพิ่มหน้าใหม่ไปยัง Sidebar เรียบร้อยแล้ว!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleResetToDefault = () => {
    resetSidebarItems();
    setSuccessMsg('รีเซ็ตเมนู Sidebar กลับเป็นค่าเริ่มต้นและแสดงครบทั้ง 16 หน้าเรียบร้อยแล้ว!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className={`pb-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <div>
          <h1
            className={`text-xl sm:text-2xl font-bold flex items-center gap-2.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            <Menu className="w-6 h-6 text-cyan-500" />
            <span>จัดการหน้าเมนู Sidebar (Sidebar Page Manager)</span>
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            คุณสามารถเปิด/ปิด ซ่อนหรือแสดงผล และจัดลำดับหน้าต่างๆ บนแถบเมนูด้านซ้าย (Sidebar) ได้อย่างอิสระ
          </p>
        </div>

        {/* Prominent Reset to Default Button */}
        <button
          type="button"
          onClick={handleResetToDefault}
          className={`shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 ${
            isLight
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 shadow-cyan-900/10'
              : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 shadow-cyan-950/40'
          }`}
          title="คืนค่าเมนูมาตรฐานทั้งหมด 16 หน้าให้แสดงผลครบถ้วน"
        >
          <RotateCcw className="w-4 h-4" />
          <span>รีเซ็ตเมนูเป็นค่าเริ่มต้น (Reset to Default - แสดงครบ 16 หน้า)</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-sm animate-fade-in">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Reorder & Visibility List */}
        <div
          className={`lg:col-span-2 rounded-2xl border overflow-hidden shadow-xl ${
            isLight ? 'bg-white border-slate-200' : 'glass-panel border-cyan-500/20'
          }`}
        >
          <div
            className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-cyan-500/15'
            }`}
          >
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              ลำดับเมนูใน Sidebar ปัจจุบัน ({sortedItems.length} รายการ)
            </h3>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              กดลูกศรขึ้น/ลง เพื่อสลับตำแหน่ง หรือกดไอคอนตาเพื่อซ่อน/เปิดแสดงผล
            </span>
          </div>

          <div className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/80'}`}>
            {sortedItems.map((item, index) => (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 transition-colors ${
                  item.visible
                    ? isLight
                      ? 'hover:bg-slate-50'
                      : 'hover:bg-slate-800/40'
                    : isLight
                    ? 'bg-slate-100/60 opacity-60'
                    : 'bg-slate-950/40 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 text-center font-mono text-xs font-bold ${
                      isLight ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </span>

                  <div
                    className={`p-2 rounded-xl border shrink-0 ${
                      isLight
                        ? 'bg-slate-100 text-cyan-700 border-slate-200'
                        : 'bg-slate-800 text-cyan-400 border-slate-700'
                    }`}
                  >
                    <Menu className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`text-xs sm:text-sm font-semibold flex items-center gap-2 truncate ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.isCustom && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            isLight
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                              : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          }`}
                        >
                          สร้างเอง
                        </span>
                      )}
                      {!item.visible && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          ซ่อนอยู่
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[11px] font-mono truncate ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      ID: {item.id} • ไอคอน: {item.icon}
                    </div>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent ${
                      isLight
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="เลื่อนขึ้น"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === sortedItems.length - 1}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent ${
                      isLight
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="เลื่อนลง"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => toggleSidebarItemVisibility(item.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.visible
                        ? isLight
                          ? 'text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200'
                          : 'text-cyan-400 hover:bg-cyan-500/10'
                        : isLight
                        ? 'text-slate-400 hover:bg-slate-100'
                        : 'text-slate-500 hover:bg-slate-800'
                    }`}
                    title={item.visible ? 'กดเพื่อซ่อนจาก Sidebar' : 'กดเพื่อเปิดแสดงที่ Sidebar'}
                  >
                    {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Delete (if custom) */}
                  {item.isCustom && (
                    <button
                      type="button"
                      onClick={() => deleteSidebarItem(item.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isLight
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                      }`}
                      title="ลบหน้านี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Add New Sidebar Page Form */}
        <div
          className={`rounded-2xl border p-5 shadow-xl space-y-4 self-start ${
            isLight ? 'bg-white border-slate-200' : 'glass-panel border-cyan-500/20'
          }`}
        >
          <div
            className={`flex items-center gap-2 pb-3 border-b ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}
          >
            <PlusCircle className="w-5 h-5 text-cyan-500" />
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              เพิ่มหน้าที่ Sidebar ใหม่
            </h3>
          </div>

          <form onSubmit={handleCreatePage} className="space-y-4 text-xs">
            <div>
              <label
                className={`block font-medium mb-1.5 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                ชื่อหน้า (Page Label) *
              </label>
              <input
                type="text"
                required
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="เช่น บันทึกการประชุมทีม, สรุปโปรโมชั่น"
                className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-600'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500'
                }`}
              />
            </div>

            <div>
              <label
                className={`block font-medium mb-1.5 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                เลือกไอคอนเมนู
              </label>
              <select
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-600'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500'
                }`}
              >
                {ICON_OPTIONS.map((opt) => (
                  <option
                    key={opt.name}
                    value={opt.name}
                    className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`block font-medium mb-1.5 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                รายละเอียดหรือข้อความสำหรับหน้านี้
              </label>
              <textarea
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="ระบุข้อความแนะนำหรือจุดประสงค์ของหน้านี้..."
                className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-600'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500'
                }`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>บันทึกและแสดงบน Sidebar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
