import React, { useState, useRef } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Phone,
  Mail,
  Building,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Upload,
  Download,
  Link,
  Save,
  X,
  Sparkles,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { SalesRep } from '../../types';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256',
];

export const ManageRepsView: React.FC = () => {
  const {
    salesReps,
    addSalesRep,
    updateSalesRep,
    deleteSalesRep,
    reconcileRepsFromRecords,
    exportRepsJson,
    importRepsJson,
    settings,
  } = useSales();
  const isLight = settings.themeMode === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<SalesRep | null>(null);
  const [deleteConfirmRep, setDeleteConfirmRep] = useState<SalesRep | null>(null);

  // Recovery & Backup State
  const [isReconciling, setIsReconciling] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Avatar upload tab
  const [avatarTab, setAvatarTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [formData, setFormData] = useState<Omit<SalesRep, 'id'>>({
    code: '',
    name: '',
    nickname: '',
    avatarUrl: '',
    role: 'Sales Representative',
    phone: '',
    email: '',
    branch: 'Curtain Center',
    status: 'active',
    joinedDate: new Date().toISOString().split('T')[0],
  });

  const handleOpenAdd = () => {
    setEditingRep(null);
    setFormError(null);
    setFormData({
      code: `T${String(60000 + salesReps.length * 111)}`,
      name: '',
      nickname: '',
      avatarUrl: AVATAR_PRESETS[0],
      role: 'Sales Representative',
      phone: '',
      email: '',
      branch: 'Curtain Center',
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
    });
    setAvatarTab('upload');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rep: SalesRep) => {
    setEditingRep(rep);
    setFormError(null);
    setFormData({
      code: rep.code,
      name: rep.name,
      nickname: rep.nickname,
      avatarUrl: rep.avatarUrl,
      role: rep.role,
      phone: rep.phone,
      email: rep.email,
      branch: rep.branch,
      status: rep.status,
      joinedDate: rep.joinedDate,
    });
    setAvatarTab('upload');
    setIsModalOpen(true);
  };

  // Auto-detect and reconcile sales reps from sales data
  const handleAutoReconcile = async () => {
    setIsReconciling(true);
    setFeedback(null);
    const res = await reconcileRepsFromRecords();
    setIsReconciling(false);
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const jsonStr = exportRepsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pasaya_sales_reps_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback({
      type: 'success',
      text: 'ดาวน์โหลดไฟล์สำรองข้อมูลพนักงานเรียบร้อยแล้ว',
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = importRepsJson(reader.result);
        setFeedback({
          type: res.success ? 'success' : 'error',
          text: res.message,
        });
        setTimeout(() => setFeedback(null), 5000);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, WebP, SVG)');
      return;
    }

    setFormError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, avatarUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('กรุณากรอกชื่อ-นามสกุลพนักงาน');
      return;
    }

    if (editingRep) {
      updateSalesRep(editingRep.id, formData);
    } else {
      addSalesRep(formData);
    }
    setIsModalOpen(false);
    setFeedback({
      type: 'success',
      text: `บันทึกข้อมูลพนักงาน "${formData.name}" เรียบร้อยแล้ว`,
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmRep) {
      deleteSalesRep(deleteConfirmRep.id);
      setFeedback({
        type: 'success',
        text: `ลบข้อมูลพนักงาน "${deleteConfirmRep.name}" เรียบร้อยแล้ว`,
      });
      setTimeout(() => setFeedback(null), 3000);
      setDeleteConfirmRep(null);
    }
  };

  const filteredReps = salesReps.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.branch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ? true : r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
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
            <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>จัดการพนักงานขาย (Sales Representatives)</span>
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            จัดการรหัสพนักงาน, ชื่อ-นามสกุล, รูปภาพประจำตัว (อัปโหลดเองหรือแนบลิงก์), สาขา และสถานะ
          </p>
        </div>

        {/* Action Buttons: Add Rep, Auto-Reconcile from Sales, Backup & Restore */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Auto Reconcile from Sales Records */}
          <button
            type="button"
            onClick={handleAutoReconcile}
            disabled={isReconciling}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isLight
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
            }`}
            title="ตรวจหาชื่อพนักงานทั้งหมดที่มีในข้อมูลยอดขายและกู้คืนเข้าสู่ระบบอัตโนมัติ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
            <span>{isReconciling ? 'กำลังกู้คืน...' : 'กู้คืนจากข้อมูลยอดขาย'}</span>
          </button>

          {/* Export JSON Backup */}
          <button
            type="button"
            onClick={handleExportBackup}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/15'
            }`}
            title="ดาวน์โหลดไฟล์สำรองข้อมูลพนักงาน JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ส่งออกสำรอง</span>
          </button>

          {/* Import JSON Backup */}
          <input
            ref={backupInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => backupInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/15'
            }`}
            title="นำเข้าไฟล์สำรองข้อมูลพนักงาน JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">นำเข้าสำรอง</span>
          </button>

          {/* Add New Rep */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold text-xs sm:text-sm hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-900/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มพนักงานขายใหม่</span>
          </button>
        </div>
      </div>

      {/* Live Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl flex items-center justify-between text-xs font-medium border animate-fade-in ${
            feedback.type === 'success'
              ? isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : isLight
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl ${
          isLight
            ? 'bg-white border border-slate-200 shadow-sm'
            : 'liquid-glass border border-white/10'
        }`}
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาด้วยชื่อ, รหัสพนักงาน, หรือสาขา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none transition-colors ${
              isLight
                ? 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-cyan-500'
                : 'bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-500'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterStatus === status
                  ? isLight
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              {status === 'all'
                ? 'ทั้งหมด'
                : status === 'active'
                ? 'กำลังปฏิบัติงาน'
                : 'ไม่ได้ปฏิบัติงาน'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Sales Rep Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReps.map((rep) => (
          <div
            key={rep.id}
            className={`rounded-2xl p-5 flex flex-col justify-between transition-all group ${
              isLight
                ? 'bg-white border border-slate-200 shadow-sm hover:border-cyan-400 hover:shadow-md'
                : 'liquid-glass border border-white/10 hover:border-cyan-500/40'
            }`}
          >
            <div>
              {/* Top row: Avatar + Badge + Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl border-2 overflow-hidden shadow-md shrink-0 ${
                      isLight ? 'border-cyan-500/40 bg-slate-100' : 'border-cyan-500/30 bg-slate-900'
                    }`}
                  >
                    <img
                      src={
                        rep.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(rep.name)}&background=0284c7&color=fff`
                      }
                      alt={rep.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span
                      className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                        isLight
                          ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                          : 'bg-slate-800 text-cyan-300 border-slate-700'
                      }`}
                    >
                      {rep.code}
                    </span>
                    <h3
                      className={`text-sm font-bold mt-1 transition-colors ${
                        isLight
                          ? 'text-slate-900 group-hover:text-cyan-700'
                          : 'text-white group-hover:text-cyan-300'
                      }`}
                    >
                      {rep.name}
                    </h3>
                    <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {rep.role}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(rep)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isLight
                        ? 'text-slate-500 hover:text-cyan-700 hover:bg-slate-100'
                        : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                    }`}
                    title="แก้ไขข้อมูล"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmRep(rep)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isLight
                        ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                        : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                    }`}
                    title="ลบพนักงาน"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Detail fields */}
              <div
                className={`mt-4 space-y-2 pt-3 border-t text-xs ${
                  isLight
                    ? 'border-slate-200 text-slate-700'
                    : 'border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="truncate">{rep.branch}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{rep.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">{rep.email || '-'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Status & Joined date */}
            <div
              className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                isLight ? 'border-slate-200' : 'border-slate-800/80'
              }`}
            >
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                เริ่มงาน: {rep.joinedDate}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateSalesRep(rep.id, {
                    status: rep.status === 'active' ? 'inactive' : 'active',
                  })
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  rep.status === 'active'
                    ? isLight
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : isLight
                    ? 'bg-slate-100 text-slate-500 border border-slate-200'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {rep.status === 'active' ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>กำลังปฏิบัติงาน</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-slate-400" />
                    <span>ไม่ได้ปฏิบัติงาน</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Sales Rep with Dual Avatar Options */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${
              isLight
                ? 'bg-white border border-slate-200 text-slate-900'
                : 'liquid-glass-modal border border-cyan-500/30 text-white'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isLight ? 'border-slate-200' : 'border-slate-700'
              }`}
            >
              <h3 className="text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>{editingRep ? 'แก้ไขข้อมูลพนักงานขาย' : 'เพิ่มพนักงานขายใหม่'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`p-1 rounded-lg transition-colors ${
                  isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {formError && (
                <div
                  className={`p-2.5 rounded-xl flex items-center gap-2 border text-xs ${
                    isLight
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    รหัสพนักงาน (Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl font-mono focus:outline-none focus:border-cyan-500 ${
                      isLight
                        ? 'bg-slate-50 border border-slate-200 text-slate-900'
                        : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                    placeholder="เช่น T46160"
                  />
                </div>
                <div>
                  <label className={`block mb-1 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    ชื่อเล่น
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 ${
                      isLight
                        ? 'bg-slate-50 border border-slate-200 text-slate-900'
                        : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                    placeholder="เช่น ปอนด์, ออย"
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-1 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  ชื่อ-นามสกุล (พร้อมชื่อเล่น) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:border-cyan-500 ${
                    isLight
                      ? 'bg-slate-50 border border-slate-200 text-slate-900'
                      : 'bg-slate-900 border border-slate-700 text-white'
                  }`}
                  placeholder="เช่น ภัทยา (ปอนด์) นาแพงเมือง"
                />
              </div>

              {/* Enhanced Avatar Management: Upload vs URL vs Presets */}
              <div
                className={`p-3.5 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    รูปประจำตัวพนักงาน (Avatar)
                  </label>

                  {/* Mode switch tabs */}
                  <div
                    className={`flex items-center p-0.5 rounded-lg text-[11px] border ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setAvatarTab('upload')}
                      className={`px-2 py-1 rounded-md font-medium transition-all ${
                        avatarTab === 'upload'
                          ? isLight
                            ? 'bg-cyan-600 text-white'
                            : 'bg-cyan-500 text-slate-950 font-bold'
                          : isLight
                          ? 'text-slate-600'
                          : 'text-slate-400'
                      }`}
                    >
                      <Upload className="w-3 h-3 inline mr-1" />
                      อัปโหลดรูป
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarTab('url')}
                      className={`px-2 py-1 rounded-md font-medium transition-all ${
                        avatarTab === 'url'
                          ? isLight
                            ? 'bg-cyan-600 text-white'
                            : 'bg-cyan-500 text-slate-950 font-bold'
                          : isLight
                          ? 'text-slate-600'
                          : 'text-slate-400'
                      }`}
                    >
                      <Link className="w-3 h-3 inline mr-1" />
                      แนบลิงก์
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarTab('presets')}
                      className={`px-2 py-1 rounded-md font-medium transition-all ${
                        avatarTab === 'presets'
                          ? isLight
                            ? 'bg-cyan-600 text-white'
                            : 'bg-cyan-500 text-slate-950 font-bold'
                          : isLight
                          ? 'text-slate-600'
                          : 'text-slate-400'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      เลือกรูป
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Current Avatar Preview */}
                  <div
                    className={`w-14 h-14 rounded-2xl border-2 overflow-hidden shadow-sm shrink-0 ${
                      isLight ? 'border-cyan-400 bg-white' : 'border-cyan-500 bg-slate-900'
                    }`}
                  >
                    {formData.avatarUrl ? (
                      <img
                        src={formData.avatarUrl}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                        ?
                      </div>
                    )}
                  </div>

                  {/* Input area based on active tab */}
                  <div className="flex-1">
                    {avatarTab === 'upload' && (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed font-medium transition-all cursor-pointer ${
                            isLight
                              ? 'border-cyan-300 hover:border-cyan-500 bg-cyan-50/50 text-cyan-800'
                              : 'border-cyan-500/40 hover:border-cyan-400 bg-cyan-500/10 text-cyan-300'
                          }`}
                        >
                          <Upload className="w-4 h-4" />
                          <span>เลือกไฟล์รูปภาพจากอุปกรณ์...</span>
                        </button>
                        <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          รองรับ PNG, JPG, WebP (แปลงเป็น Base64 อัตโนมัติ)
                        </p>
                      </div>
                    )}

                    {avatarTab === 'url' && (
                      <div>
                        <input
                          type="url"
                          value={formData.avatarUrl}
                          onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                          placeholder="วาง URL รูปภาพ (เช่น https://...)"
                          className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 ${
                            isLight
                              ? 'bg-white border border-slate-200 text-slate-900'
                              : 'bg-slate-900 border border-slate-700 text-white'
                          }`}
                        />
                        <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          สามารถคัดลอกลิงก์รูปภาพจากอินเทอร์เน็ตมาวางได้โดยตรง
                        </p>
                      </div>
                    )}

                    {avatarTab === 'presets' && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {AVATAR_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormData({ ...formData, avatarUrl: preset })}
                            className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition-transform hover:scale-110 ${
                              formData.avatarUrl === preset
                                ? 'border-cyan-500 ring-2 ring-cyan-400'
                                : 'border-transparent opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img src={preset} alt={`preset ${idx}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    ตำแหน่ง (Role)
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 ${
                      isLight
                        ? 'bg-slate-50 border border-slate-200 text-slate-900'
                        : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    สาขา (Branch)
                  </label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 ${
                      isLight
                        ? 'bg-slate-50 border border-slate-200 text-slate-900'
                        : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    เบอร์ติดต่อ
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 ${
                      isLight
                        ? 'bg-slate-50 border border-slate-200 text-slate-900'
                        : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    สถานะการทำงาน
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                    }
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 ${
                      isLight
                        ? 'bg-slate-50 border border-slate-200 text-slate-900'
                        : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  >
                    <option value="active">กำลังปฏิบัติงาน (Active)</option>
                    <option value="inactive">ไม่ได้ปฏิบัติงาน (Inactive)</option>
                  </select>
                </div>
              </div>

              <div
                className={`flex items-center justify-end gap-3 pt-3 border-t ${
                  isLight ? 'border-slate-200' : 'border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium hover:from-cyan-500 hover:to-blue-500 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกข้อมูลพนักงาน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'liquid-glass-modal border-rose-500/30 text-white'
            }`}
          >
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold">ยืนยันการลบข้อมูลพนักงาน</h3>
            </div>

            <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              คุณต้องการลบข้อมูลพนักงาน <strong className="text-rose-500 font-bold">"{deleteConfirmRep.name}"</strong> ({deleteConfirmRep.code}) ออกจากระบบหรือไม่?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setDeleteConfirmRep(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-white/10 hover:bg-white/15 text-slate-200'
                }`}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/30 cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
