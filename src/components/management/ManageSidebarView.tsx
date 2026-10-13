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
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { SidebarMenuItem } from '../../types';

const ICON_OPTIONS = [
  { name: 'LayoutDashboard', label: 'หน้าแดชบอร์ด' },
  { name: 'TrendingUp', label: 'กราฟแนวโน้ม' },
  { name: 'Award', label: 'รางวัล / อันดับ' },
  { name: 'Target', label: 'เป้าหมาย KPI' },
  { name: 'Users', label: 'ทีมงาน / พนักงาน' },
  { name: 'FileSpreadsheet', label: 'ตารางข้อมูล' },
  { name: 'Settings', label: 'การตั้งค่า' },
  { name: 'FileText', label: 'เอกสาร / รายงาน' },
];

export const ManageSidebarView: React.FC = () => {
  const {
    sidebarItems,
    toggleSidebarItemVisibility,
    reorderSidebarItems,
    deleteSidebarItem,
    addSidebarItem,
    setActivePage,
  } = useSales();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <Menu className="w-6 h-6 text-cyan-400" />
          <span>จัดการหน้าเมนู Sidebar (Sidebar Page Manager)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          คุณสามารถเพิ่มหน้าใหม่ จัดการลำดับการแสดงผล เลื่อนตำแหน่งขึ้น-ลง และซ่อน/แสดงเมนูที่ Sidebar ได้อย่างอิสระ
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Reorder & Visibility List */}
        <div className="lg:col-span-2 rounded-2xl glass-panel border border-cyan-500/20 overflow-hidden shadow-xl">
          <div className="px-5 py-4 bg-slate-900/80 border-b border-cyan-500/15 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              ลำดับเมนูใน Sidebar ปัจจุบัน ({sortedItems.length} รายการ)
            </h3>
            <span className="text-[11px] text-slate-400">
              กดลูกศรขึ้น/ลง เพื่อสลับตำแหน่ง หรือกดไอคอนตาเพื่อซ่อน
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {sortedItems.map((item, index) => (
              <div
                key={item.id}
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  item.visible ? 'hover:bg-slate-800/40' : 'bg-slate-950/40 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-mono text-xs font-bold text-slate-500">
                    {index + 1}
                  </span>

                  <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700">
                    <Menu className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.isCustom && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                          สร้างเอง
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      ID: {item.id} • ไอคอน: {item.icon}
                    </div>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="เลื่อนขึ้น"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === sortedItems.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="เลื่อนลง"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => toggleSidebarItemVisibility(item.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      item.visible
                        ? 'text-cyan-400 hover:bg-cyan-500/10'
                        : 'text-slate-500 hover:bg-slate-800'
                    }`}
                    title={item.visible ? 'ซ่อนจาก Sidebar' : 'แสดงที่ Sidebar'}
                  >
                    {item.visible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>

                  {/* Delete (if custom) */}
                  {item.isCustom && (
                    <button
                      type="button"
                      onClick={() => deleteSidebarItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
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
        <div className="rounded-2xl glass-panel border border-cyan-500/20 p-5 shadow-xl space-y-4 self-start">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <PlusCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              เพิ่มหน้าที่ Sidebar ใหม่
            </h3>
          </div>

          <form onSubmit={handleCreatePage} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                ชื่อหน้า (Page Label) *
              </label>
              <input
                type="text"
                required
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="เช่น บันทึกการประชุมทีม, สรุปโปรโมชั่น"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                เลือกไอคอนเมนู
              </label>
              <select
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-xs"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.name} value={opt.name} className="bg-slate-900">
                    {opt.label} ({opt.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                รายละเอียดหรือข้อความสำหรับหน้านี้
              </label>
              <textarea
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="ระบุข้อความแนะนำหรือจุดประสงค์ของหน้านี้..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-950 transition-all flex items-center justify-center gap-2"
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
