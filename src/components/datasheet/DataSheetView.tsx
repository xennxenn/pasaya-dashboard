import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Search,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Layers,
  Info,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { SheetType, SHEET_SPECS } from '../../types/sheetSchemas';

export const DataSheetView: React.FC = () => {
  const {
    records,
    importCsv,
    importSheetCsv,
    resetAllData,
    sheetsConfig,
    isRealtimeConnected,
    isSyncingSheets,
    setIsSyncModalOpen,
    triggerGoogleSheetsSync,
    settings,
    activeSheetTab,
    setActiveSheetTab,
    leadRows,
    forecastRows,
    dbConfigRows,
    quotationRows,
    measurementRows,
    installmentRows,
    claimRows,
  } = useSales();

  const isLight = settings.themeMode === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [csvInput, setCsvInput] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tab definitions
  const tabs: { id: SheetType; label: string; count: number }[] = [
    { id: 'sales_summary', label: 'ภาพรวมยอดขาย (Sales Summary)', count: records.length },
    { id: 'lead_report', label: '1. Lead Report', count: leadRows.length },
    { id: 'forecast_sales', label: '2. Forecast Sales', count: forecastRows.length },
    { id: 'database', label: '3. Database', count: dbConfigRows.length },
    { id: 'quotation_report', label: '4. Quotation Report', count: quotationRows.length },
    { id: 'measurement_report', label: '5. Measurement', count: measurementRows.length },
    { id: 'installment_report', label: '6. Installment', count: installmentRows.length },
    { id: 'claim_report', label: '7. Claim Report', count: claimRows.length },
  ];

  // Filtered rows for sales summary
  const filteredSalesRecords = records.filter((r) => {
    const matchesSearch =
      r.salesPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.quarter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === 'all' || r.year.toString() === filterYear;
    const matchesMonth = filterMonth === 'all' || r.month === filterMonth;
    return matchesSearch && matchesYear && matchesMonth;
  });

  // Filtered rows for 1. Lead Report
  const filteredLeadRows = leadRows.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.customerName.toLowerCase().includes(q) ||
      r.customerId.toLowerCase().includes(q) ||
      r.customerStatus.toLowerCase().includes(q) ||
      r.salesPerson.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q) ||
      r.province.toLowerCase().includes(q)
    );
  });

  // Filtered rows for 2. Forecast Sales
  const filteredForecastRows = forecastRows.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.customerName.toLowerCase().includes(q) ||
      r.salesPerson.toLowerCase().includes(q) ||
      r.presentationStatus.toLowerCase().includes(q) ||
      r.leadJobType.toLowerCase().includes(q)
    );
  });

  // Filtered rows for 3. Database
  const filteredDbRows = dbConfigRows.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.leadSource.toLowerCase().includes(q) ||
      r.leadChannel.toLowerCase().includes(q) ||
      r.customerStatus.toLowerCase().includes(q)
    );
  });

  // Filtered rows for 4. Quotation Report
  const filteredQuoteRows = quotationRows.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.quotationNo.toLowerCase().includes(q) ||
      r.customerFullName.toLowerCase().includes(q) ||
      r.customerId.toLowerCase().includes(q) ||
      r.employeeCode.toLowerCase().includes(q) ||
      r.rStatus.toLowerCase().includes(q)
    );
  });

  // Filtered rows for 5. Measurement Report
  const filteredMeasureRows = measurementRows.filter((r) => {
    const q = searchTerm.toLowerCase();
    return r.salesPerson.toLowerCase().includes(q) || String(r.year).includes(q);
  });

  // Filtered rows for 6. Installment Report
  const filteredInstallRows = installmentRows.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.queueNo.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.technicianTeam.toLowerCase().includes(q) ||
      r.salesFullName.toLowerCase().includes(q) ||
      r.orderNo.toLowerCase().includes(q) ||
      r.installLocation.toLowerCase().includes(q)
    );
  });

  // Filtered rows for 7. Claim Report
  const filteredClaimRows = claimRows.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.customerName.toLowerCase().includes(q) ||
      r.salesPerson.toLowerCase().includes(q) ||
      r.orderNo.toLowerCase().includes(q) ||
      r.problem.toLowerCase().includes(q) ||
      r.fabricName.toLowerCase().includes(q)
    );
  });

  // Generic CSV Download for currently active tab
  const handleDownloadCsv = () => {
    let header = '';
    let rows: string[] = [];
    const escape = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    if (activeSheetTab === 'sales_summary') {
      header = 'Year,Month,พนักงานขาย,ยอดขาย MTO,ยอดขาย ผ้า,ยอดขาย ผ้าปูที่นอน,ยอดขายรวม,Rank,Quarter,Orders\n';
      rows = records.map((r) =>
        [r.year, r.month, escape(r.salesPerson), escape(r.salesMTO), escape(r.salesFabric), escape(r.salesBedding), escape(r.salesTotal), r.rank || '', r.quarter, r.orders || ''].join(',')
      );
    } else if (activeSheetTab === 'lead_report') {
      header = 'Col.B สถานะ,Col.C รหัสลูกค้า,วันที่แปลง,Col.G ชื่อลูกค้า,Col.H เบอร์ติดต่อ,Col.M แหล่งที่มา,Col.O ประเภทหน้างาน,Col.P พนักงานขาย,Col.V รหัสสาขา,Col.X อำเภอ,Col.Z จังหวัด\n';
      rows = leadRows.map((r) =>
        [escape(r.customerStatus), escape(r.customerId), escape(r.date?.formatted || ''), escape(r.customerName), escape(r.customerPhone), escape(r.leadSource), escape(r.leadJobType), escape(r.salesPerson), escape(r.branchCode), escape(r.district), escape(r.province)].join(',')
      );
    } else if (activeSheetTab === 'forecast_sales') {
      header = 'Col.B วันที่สร้าง,Col.E สถานะนำเสนอ,Col.F ชื่อลูกค้า,Col.G เบอร์ติดต่อ,Col.H แหล่งที่มา,Col.I ประเภทหน้างาน,Col.J พนักงานขาย,Col.K ยอดเสนอราคา,Col.L งวด60%,Col.M เดือน60%,Col.N ปี60%,Col.R งวด40%,Col.S เดือน40%,Col.T ปี40%\n';
      rows = forecastRows.map((r) =>
        [escape(r.createdDate), escape(r.presentationStatus), escape(r.customerName), escape(r.customerPhone), escape(r.leadSource), escape(r.leadJobType), escape(r.salesPerson), escape(r.totalQuoteAmount), escape(r.amount60), escape(r.month60), escape(r.year60), escape(r.amount40), escape(r.month40), escape(r.year40)].join(',')
      );
    } else if (activeSheetTab === 'database') {
      header = 'Col.A แหล่งที่มา,Col.B ช่องทาง,Col.D ปีเป้าหมาย,Col.E เดือนเป้าหมาย,Col.F เป้ายอดขาย,Col.H สถานะลูกค้า,Col.I Conversion True\n';
      rows = dbConfigRows.map((r) =>
        [escape(r.leadSource), escape(r.leadChannel), escape(r.targetYear), escape(r.targetMonth), escape(r.targetAmount), escape(r.customerStatus), r.isConversionEligible ? 'True' : 'False'].join(',')
      );
    } else if (activeSheetTab === 'quotation_report') {
      header = 'Col.A เลขที่ใบเสนอราคา,Col.B ยืนยัน(Y),Col.C Revise,Col.D วันที่,Col.E รหัสสาขา(64),Col.F รหัสพนักงาน,Col.M R_Status,Col.P ชื่อจริง,Col.Q นามสกุล,Col.S ยอดเสนอราคา,Col.T รหัสลูกค้า\n';
      rows = quotationRows.map((r) =>
        [escape(r.quotationNo), r.isConfirmed ? 'Y' : 'N', escape(r.revisionNo), escape(r.quotationDate), escape(r.branchCode), escape(r.employeeCode), escape(r.rStatus), escape(r.customerFirstName), escape(r.customerLastName), escape(r.quotedAmount), escape(r.customerId)].join(',')
      );
    } else if (activeSheetTab === 'measurement_report') {
      header = 'Col.A ปี,Col.B เดือน,Col.C พนักงานขาย,Col.D วัดพื้นที่,Col.E พบTurnkey,Col.F รีเช็ค,Col.G สรุปผ้า,Col.H ดูงานติดตั้ง,Col.I ยอดรวม\n';
      rows = measurementRows.map((r) =>
        [escape(r.year), escape(r.month), escape(r.salesPerson), escape(r.areaMeasurementCount), escape(r.turnkeyMeetingCount), escape(r.siteRecheckCount), escape(r.fabricSummaryCount), escape(r.installationSiteCheckCount), escape(r.totalCount)].join(',')
      );
    } else if (activeSheetTab === 'installment_report') {
      header = 'Col.A คิวติดตั้ง,Col.B วันที่ติดตั้ง,วันที่แปลง,Col.E เวลาเข้า,Col.F เวลาออก,ช่วงเวลา,Col.G ทีมช่าง,Col.H ลูกค้า,Col.J คนติดต่อ,Col.K เบอร์โทร,Col.L สถานที่,Col.M จำนวน,Col.N ชื่อเซลส์,Col.O สกุลเซลส์,Col.S ออเดอร์,Col.T ประเภทงาน,Col.V เลขที่งาน,Col.Z ทีมช่าง(pasaya/supplier)\n';
      rows = installmentRows.map((r) =>
        [escape(r.queueNo), escape(r.installDateRaw), escape(r.installDateFormatted), escape(r.timeIn), escape(r.timeOut), escape(r.timeSlot), escape(r.technicianTeam), escape(r.customerName), escape(r.contactPerson), escape(r.customerPhone), escape(r.installLocation), escape(r.installQuantity), escape(r.salesFirstName), escape(r.salesLastName), escape(r.orderNo), escape(r.workTypeCode), escape(r.jobNo), escape(r.technicianTypeRaw)].join(',')
      );
    } else if (activeSheetTab === 'claim_report') {
      header = 'Col.A ชื่อลูกค้า,Col.D พนักงานขาย,Col.E วันที่เคลม,Col.F ทีมช่างติดตั้ง,Col.G แผนกขาย,Col.H ออเดอร์,Col.I เลขที่แก้ไข,Col.J มูลค่าออเดอร์,Col.K มูลค่าแก้งาน,Col.N แหล่งปัญหา,Col.O ฝ่ายรับผิดชอบ,Col.P ปัญหา,Col.Q ผ้ามีปัญหา,Col.R รายละเอียด,Col.V สาเหตุ,Col.Z ลิงก์รูป\n';
      rows = claimRows.map((r) =>
        [escape(r.customerName), escape(r.salesPerson), escape(r.claimDate), escape(r.installTechnicianTeam), escape(r.salesDepartment), escape(r.orderNo), escape(r.revisionJobNo), escape(r.orderValue), escape(r.claimCost), escape(r.problemSource), escape(r.responsibleDept), escape(r.problem), escape(r.fabricName), escape(r.details), escape(r.rootCause), escape(r.photoUrl)].join(',')
      );
    }

    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PASAYA_${activeSheetTab}_${new Date().toISOString().slice(0, 10)}.csv`);
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
        const res = importSheetCsv(content, activeSheetTab);
        if (res.success) {
          setMsg({ type: 'success', text: `นำเข้าไฟล์ ${file.name}: ${res.message}` });
        } else {
          setMsg({ type: 'error', text: res.message || 'ไม่สามารถนำเข้าไฟล์ได้ กรุณาตรวจสอบรูปแบบ CSV' });
        }
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!csvInput.trim()) return;
    const res = importSheetCsv(csvInput, activeSheetTab);
    if (res.success) {
      setMsg({ type: 'success', text: `นำเข้าข้อมูล CSV: ${res.message}` });
      setCsvInput('');
      setShowUploadModal(false);
    } else {
      setMsg({ type: 'error', text: res.message || 'รูปแบบข้อมูล CSV ไม่ถูกต้อง' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Top Header Card */}
      <div
        className={`p-6 rounded-3xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'liquid-glass-card border-white/10'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3.5 rounded-2xl ${
                isLight
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
              }`}
            >
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">
                  ชีทข้อมูล &amp; รายงานฝ่ายขาย (Data Sheets &amp; Reports)
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    isRealtimeConnected
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : isLight
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isRealtimeConnected ? '● เชื่อมต่อ Realtime' : '○ ออฟไลน์'}
                </span>
              </div>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                โครงสร้าง 7 ชีทหลักตามสเปกของ PASAYA Curtain Center พร้อมรองรับ Google Sheets Sync
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all shadow-md active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>ซิงค์ Google Sheets</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-medium border transition-colors ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-medium border transition-colors ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>นำเข้า CSV</span>
            </button>
          </div>
        </div>

        {/* 7 Sheets Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-700/20 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSheetTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeSheetTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-extrabold'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeSheetTab === tab.id
                    ? 'bg-slate-950/20 text-slate-950 font-bold'
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Banner */}
      {msg && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            msg.type === 'success'
              ? isLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : isLight
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="font-medium">{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-xs hover:underline">
            ปิด
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isLight ? 'bg-white border-slate-200' : 'liquid-glass-card border-white/10'
        }`}
      >
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, รหัส, เซลส์, ทีมช่าง, หรือคำค้น..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-slate-900/80 border-slate-700 text-white'
            }`}
          />
        </div>

        {activeSheetTab === 'sales_summary' && (
          <div className="flex items-center gap-2">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900/80 border-slate-700 text-white'
              }`}
            >
              <option value="all">ทุกปี (All Years)</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
        )}
      </div>

      {/* Data Table Container */}
      <div
        className={`rounded-3xl border overflow-hidden transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'liquid-glass-card border-white/10'
        }`}
      >
        <div className="overflow-x-auto">
          {/* TAB 0: Sales Summary */}
          {activeSheetTab === 'sales_summary' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-slate-300'}>
                  <th className="px-4 py-3 font-bold">ปี</th>
                  <th className="px-4 py-3 font-bold">เดือน</th>
                  <th className="px-4 py-3 font-bold">พนักงานขาย</th>
                  <th className="px-4 py-3 font-bold text-right">ยอดขาย MTO</th>
                  <th className="px-4 py-3 font-bold text-right">ยอดขาย ผ้า</th>
                  <th className="px-4 py-3 font-bold text-right">ยอดขาย ผ้าปู</th>
                  <th className="px-4 py-3 font-bold text-right">ยอดขายรวม</th>
                  <th className="px-4 py-3 font-bold text-center">อันดับ</th>
                  <th className="px-4 py-3 font-bold text-center">ไตรมาส</th>
                  <th className="px-4 py-3 font-bold text-right">คำสั่งซื้อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20 font-mono">
                {filteredSalesRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      ไม่พบข้อมูลที่ตรงกับคำค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredSalesRecords.map((r, i) => (
                    <tr
                      key={r.id || i}
                      className={
                        r.salesPerson === 'รวมทั้งหมด'
                          ? isLight
                            ? 'bg-cyan-50/70 font-bold'
                            : 'bg-cyan-950/30 font-bold'
                          : isLight
                          ? i % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/50'
                          : i % 2 === 0
                          ? 'bg-slate-900/30'
                          : 'bg-white/[0.01]'
                      }
                    >
                      <td className="px-4 py-2.5 font-bold">{r.year}</td>
                      <td className="px-4 py-2.5">{r.month}</td>
                      <td className="px-4 py-2.5 font-sans font-semibold">{r.salesPerson}</td>
                      <td className="px-4 py-2.5 text-right">{r.salesMTO ? formatNumber(r.salesMTO) : '-'}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-500">{r.salesFabric ? formatNumber(r.salesFabric) : '-'}</td>
                      <td className="px-4 py-2.5 text-right text-indigo-400">{r.salesBedding ? formatNumber(r.salesBedding) : '-'}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-cyan-400">{formatNumber(r.salesTotal)}</td>
                      <td className="px-4 py-2.5 text-center">{r.rank || '-'}</td>
                      <td className="px-4 py-2.5 text-center">{r.quarter}</td>
                      <td className="px-4 py-2.5 text-right">{r.orders ? formatNumber(r.orders) : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 1: Lead Report */}
          {activeSheetTab === 'lead_report' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-slate-300'}>
                  <th className="px-3.5 py-3 font-bold">Col.B สถานะ</th>
                  <th className="px-3.5 py-3 font-bold">Col.C รหัสลูกค้า</th>
                  <th className="px-3.5 py-3 font-bold">วันที่ถอดรหัส</th>
                  <th className="px-3.5 py-3 font-bold">Col.G ชื่อลูกค้า</th>
                  <th className="px-3.5 py-3 font-bold">Col.H เบอร์โทร</th>
                  <th className="px-3.5 py-3 font-bold">Col.M แหล่งที่มา</th>
                  <th className="px-3.5 py-3 font-bold">Col.O ประเภทหน้างาน</th>
                  <th className="px-3.5 py-3 font-bold">Col.P พนักงานขาย</th>
                  <th className="px-3.5 py-3 font-bold text-center">Col.V สาขา</th>
                  <th className="px-3.5 py-3 font-bold">Col.X อำเภอ</th>
                  <th className="px-3.5 py-3 font-bold">Col.Z จังหวัด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20">
                {filteredLeadRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                      ไม่พบข้อมูล Lead Report
                    </td>
                  </tr>
                ) : (
                  filteredLeadRows.map((r, i) => (
                    <tr
                      key={r.id || i}
                      className={
                        isLight
                          ? i % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/50'
                          : i % 2 === 0
                          ? 'bg-slate-900/30'
                          : 'bg-white/[0.01]'
                      }
                    >
                      <td className="px-3.5 py-2.5 font-semibold">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {r.customerStatus || 'รอดำเนินการ'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-cyan-400 font-bold">{r.customerId}</td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-amber-400 font-bold">
                        {r.date?.formatted || '-'}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold">{r.customerName}</td>
                      <td className="px-3.5 py-2.5 font-mono">{r.customerPhone}</td>
                      <td className="px-3.5 py-2.5 text-slate-400">{r.leadSource}</td>
                      <td className="px-3.5 py-2.5">{r.leadJobType}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-cyan-400">{r.salesPerson}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {r.branchCode === '64' ? '64 Curtain Center' : r.branchCode || '64'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">{r.district}</td>
                      <td className="px-3.5 py-2.5">{r.province}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 2: Forecast Sales Report */}
          {activeSheetTab === 'forecast_sales' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-slate-300'}>
                  <th className="px-3.5 py-3 font-bold">Col.B วันที่สร้าง</th>
                  <th className="px-3.5 py-3 font-bold">Col.E สถานะนำเสนอ</th>
                  <th className="px-3.5 py-3 font-bold">Col.F ชื่อลูกค้า</th>
                  <th className="px-3.5 py-3 font-bold">Col.G เบอร์โทร</th>
                  <th className="px-3.5 py-3 font-bold">Col.H แหล่งที่มา</th>
                  <th className="px-3.5 py-3 font-bold">Col.I หน้างาน</th>
                  <th className="px-3.5 py-3 font-bold">Col.J เซลส์</th>
                  <th className="px-3.5 py-3 font-bold text-right">Col.K ยอดเสนอราคา</th>
                  <th className="px-3.5 py-3 font-bold text-right text-emerald-400">Col.L งวด 60%</th>
                  <th className="px-3.5 py-3 font-bold text-center">Col.M/N งวด60%</th>
                  <th className="px-3.5 py-3 font-bold text-right text-cyan-400">Col.R งวด 40%</th>
                  <th className="px-3.5 py-3 font-bold text-center">Col.S/T งวด40%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20">
                {filteredForecastRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                      ไม่พบข้อมูล Forecast Sales Report
                    </td>
                  </tr>
                ) : (
                  filteredForecastRows.map((r, i) => (
                    <tr
                      key={r.id || i}
                      className={
                        isLight
                          ? i % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/50'
                          : i % 2 === 0
                          ? 'bg-slate-900/30'
                          : 'bg-white/[0.01]'
                      }
                    >
                      <td className="px-3.5 py-2.5 font-mono">{r.createdDate}</td>
                      <td className="px-3.5 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {r.presentationStatus}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-bold">{r.customerName}</td>
                      <td className="px-3.5 py-2.5 font-mono">{r.customerPhone}</td>
                      <td className="px-3.5 py-2.5 text-slate-400">{r.leadSource}</td>
                      <td className="px-3.5 py-2.5">{r.leadJobType}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-cyan-400">{r.salesPerson}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold">{formatCurrency(r.totalQuoteAmount)}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-emerald-400 font-bold">{formatCurrency(r.amount60)}</td>
                      <td className="px-3.5 py-2.5 text-center font-mono text-[11px] text-slate-400">{r.month60} {r.year60}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-cyan-400 font-bold">{formatCurrency(r.amount40)}</td>
                      <td className="px-3.5 py-2.5 text-center font-mono text-[11px] text-slate-400">{r.month40} {r.year40}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 3: Database */}
          {activeSheetTab === 'database' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-slate-300'}>
                  <th className="px-4 py-3 font-bold">Col.A แหล่งที่มา</th>
                  <th className="px-4 py-3 font-bold">Col.B ช่องทางที่มา</th>
                  <th className="px-4 py-3 font-bold text-center">Col.D ปีเป้าหมาย</th>
                  <th className="px-4 py-3 font-bold text-center">Col.E เดือนเป้าหมาย</th>
                  <th className="px-4 py-3 font-bold text-right">Col.F เป้ายอดขาย (บาท)</th>
                  <th className="px-4 py-3 font-bold">Col.H สถานะลูกค้า</th>
                  <th className="px-4 py-3 font-bold text-center">Col.I คำนวณ Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20">
                {filteredDbRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      ไม่พบข้อมูล Database Config
                    </td>
                  </tr>
                ) : (
                  filteredDbRows.map((r, i) => (
                    <tr
                      key={r.id || i}
                      className={
                        isLight
                          ? i % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/50'
                          : i % 2 === 0
                          ? 'bg-slate-900/30'
                          : 'bg-white/[0.01]'
                      }
                    >
                      <td className="px-4 py-2.5 font-bold text-cyan-400">{r.leadSource}</td>
                      <td className="px-4 py-2.5">{r.leadChannel}</td>
                      <td className="px-4 py-2.5 text-center font-mono">{r.targetYear}</td>
                      <td className="px-4 py-2.5 text-center font-mono">{r.targetMonth}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-400">{formatCurrency(r.targetAmount)}</td>
                      <td className="px-4 py-2.5 font-semibold">{r.customerStatus}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.isConversionEligible
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                          }`}
                        >
                          {r.isConversionEligible ? '✓ True (รวมนับ Conversion)' : '✕ False'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 4: Quotation Report */}
          {activeSheetTab === 'quotation_report' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-slate-300'}>
                  <th className="px-3.5 py-3 font-bold">Col.A ใบเสนอราคา</th>
                  <th className="px-3.5 py-3 font-bold text-center">Col.B ยืนยัน (Y)</th>
                  <th className="px-3.5 py-3 font-bold text-center">Col.C Revise</th>
                  <th className="px-3.5 py-3 font-bold">Col.D วันที่</th>
                  <th className="px-3.5 py-3 font-bold text-center">Col.E รหัสสาขา</th>
                  <th className="px-3.5 py-3 font-bold">Col.F รหัสพนักงาน</th>
                  <th className="px-3.5 py-3 font-bold text-center">Col.M R_Status</th>
                  <th className="px-3.5 py-3 font-bold">Col.P/Q ชื่อ-นามสกุลลูกค้า</th>
                  <th className="px-3.5 py-3 font-bold text-right">Col.S ยอดที่เสนอราคา</th>
                  <th className="px-3.5 py-3 font-bold">Col.T รหัสลูกค้า</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20">
                {filteredQuoteRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      ไม่พบข้อมูล Quotation Report
                    </td>
                  </tr>
                ) : (
                  filteredQuoteRows.map((r, i) => (
                    <tr
                      key={r.id || i}
                      className={
                        isLight
                          ? i % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/50'
                          : i % 2 === 0
                          ? 'bg-slate-900/30'
                          : 'bg-white/[0.01]'
                      }
                    >
                      <td className="px-3.5 py-2.5 font-mono font-bold text-cyan-400">{r.quotationNo}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.isConfirmed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {r.isConfirmed ? 'Y (ยืนยัน)' : 'N'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono">Rev.{r.revisionNo}</td>
                      <td className="px-3.5 py-2.5 font-mono">{r.quotationDate}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-500/10 text-cyan-400">
                          {r.branchCode === '64' ? '64 Curtain Center' : r.branchCode}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-amber-400">{r.employeeCode}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          {r.rStatus}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-bold">{r.customerFullName}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-400">{formatCurrency(r.quotedAmount)}</td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-400">{r.customerId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 5: Measurement Report */}
          {activeSheetTab === 'measurement_report' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-slate-300'}>
                  <th className="px-3.5 py-3 font-bold">Col.A ปี</th>
                  <th className="px-3.5 py-3 font-bold">Col.B เดือน</th>
                  <th className="px-3.5 py-3 font-bold">Col.C ชื่อพนักงานขาย</th>
                  <th className="px-3.5 py-3 font-bold text-right">Col.D วัดพื้นที่</th>
                  <th className="px-3.5 py-3 font-bold text-right">Col.E พบ Turnkey</th>
                  <th className="px-3.5 py-3 font-bold text-right">Col.F รีเช็คหน้างาน</th>
                  <th className="px-3.5 py-3 font-bold text-right">Col.G สรุปผ้า/เลือกผ้า</th>
                  <th className="px-3.5 py-3 font-bold text-right">Col.H ดูงานติดตั้ง</th>
                  <th className="px-3.5 py-3 font-bold text-right font-bold text-cyan-400">Col.I ยอดรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20 font-mono">
                {filteredMeasureRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      ไม่พบข้อมูล Measurement Report
                    </td>
                  </tr>
                ) : (
                  filteredMeasureRows.map((r, i) => (
                    <tr
                      key={r.id || i}
                      className={
                        r.salesPerson === 'รวมทั้งหมด'
                          ? isLight
                            ? 'bg-cyan-50 font-bold'
                            : 'bg-cyan-950/30 font-bold'
                          : isLight
                          ? i % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/50'
                          : i % 2 === 0
                          ? 'bg-slate-900/30'
                          : 'bg-white/[0.01]'
                      }
                    >
                      <td className="px-3.5 py-2.5 font-bold">{r.year}</td>
                      <td className="px-3.5 py-2.5">{r.month}</td>
                      <td className="px-3.5 py-2.5 font-sans font-semibold text-cyan-400">{r.salesPerson}</td>
                      <td className="px-3.5 py-2.5 text-right">{r.areaMeasurementCount}</td>
                      <td className="px-3.5 py-2.5 text-right">{r.turnkeyMeetingCount}</td>
                      <td className="px-3.5 py-2.5 text-right">{r.siteRecheckCount}</td>
                      <td className="px-3.5 py-2.5 text-right">{r.fabricSummaryCount}</td>
                      <td className="px-3.5 py-2.5 text-right">{r.installationSiteCheckCount}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-cyan-400">{r.totalCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 6: Installment Report */}
          {activeSheetTab === 'installment_report' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-slate-300'}>
                  <th className="px-3 py-3 font-bold">Col.A คิวติดตั้ง</th>
                  <th className="px-3 py-3 font-bold">Col.B วันที่ติดตั้ง</th>
                  <th className="px-3 py-3 font-bold text-center">Col.E-F เวลาเข้า-ออก</th>
                  <th className="px-3 py-3 font-bold">Col.G ทีมช่าง</th>
                  <th className="px-3 py-3 font-bold">Col.H ลูกค้า</th>
                  <th className="px-3 py-3 font-bold">Col.J/K ผู้ติดต่อ/เบอร์</th>
                  <th className="px-3 py-3 font-bold">Col.L สถานที่</th>
                  <th className="px-3 py-3 font-bold text-center">Col.M จำนวน</th>
                  <th className="px-3 py-3 font-bold">Col.N/O พนักงานขาย</th>
                  <th className="px-3 py-3 font-bold">Col.S ออเดอร์</th>
                  <th className="px-3 py-3 font-bold">Col.T ประเภทงาน</th>
                  <th className="px-3 py-3 font-bold text-center">Col.Z ประเภททีมช่าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20">
                {filteredInstallRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                      ไม่พบข้อมูล Installment Report
                    </td>
                  </tr>
                ) : (
                  filteredInstallRows.map((r, i) => (
                    <tr
                      key={r.id || i}
                      className={
                        isLight
                          ? i % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/50'
                          : i % 2 === 0
                          ? 'bg-slate-900/30'
                          : 'bg-white/[0.01]'
                      }
                    >
                      <td className="px-3 py-2.5 font-mono font-bold text-cyan-400">{r.queueNo}</td>
                      <td className="px-3 py-2.5 font-mono">
                        <div className="font-bold text-amber-400">{r.installDateFormatted}</div>
                        <div className="text-[10px] text-slate-400">({r.installDateRaw})</div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold text-[11px]">
                          {r.timeSlot}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-emerald-400">{r.technicianTeam}</td>
                      <td className="px-3 py-2.5 font-bold">{r.customerName}</td>
                      <td className="px-3 py-2.5">
                        <div>{r.contactPerson}</div>
                        <div className="font-mono text-[10px] text-slate-400">{r.customerPhone}</div>
                      </td>
                      <td className="px-3 py-2.5 max-w-[150px] truncate" title={r.installLocation}>{r.installLocation}</td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold">{r.installQuantity}</td>
                      <td className="px-3 py-2.5 font-semibold text-cyan-400">{r.salesFullName}</td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">{r.orderNo}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          {r.workTypeLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.technicianTypeLabel.includes('PASAYA')
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {r.technicianTypeLabel}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 7: Claim Report */}
          {activeSheetTab === 'claim_report' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-slate-300'}>
                  <th className="px-3.5 py-3 font-bold">Col.A ชื่อลูกค้า</th>
                  <th className="px-3.5 py-3 font-bold">Col.D พนักงานขาย</th>
                  <th className="px-3.5 py-3 font-bold">Col.E วันที่เคลม</th>
                  <th className="px-3.5 py-3 font-bold">Col.F ทีมช่างติดตั้ง</th>
                  <th className="px-3.5 py-3 font-bold">Col.H ออเดอร์</th>
                  <th className="px-3.5 py-3 font-bold">Col.I เลขที่แก้ไข</th>
                  <th className="px-3.5 py-3 font-bold text-right">Col.J มูลค่าออเดอร์</th>
                  <th className="px-3.5 py-3 font-bold text-right text-rose-400">Col.K มูลค่าแก้งาน</th>
                  <th className="px-3.5 py-3 font-bold">Col.N แหล่งปัญหา</th>
                  <th className="px-3.5 py-3 font-bold">Col.O ฝ่ายรับผิดชอบ</th>
                  <th className="px-3.5 py-3 font-bold">Col.P ปัญหา &amp; Col.Q ผ้า</th>
                  <th className="px-3.5 py-3 font-bold text-center">Col.Z รูปภาพ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20">
                {filteredClaimRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                      ไม่พบข้อมูล Claim Report
                    </td>
                  </tr>
                ) : (
                  filteredClaimRows.map((r, i) => (
                    <tr
                      key={r.id || i}
                      className={
                        isLight
                          ? i % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/50'
                          : i % 2 === 0
                          ? 'bg-slate-900/30'
                          : 'bg-white/[0.01]'
                      }
                    >
                      <td className="px-3.5 py-2.5 font-bold">{r.customerName}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-cyan-400">{r.salesPerson}</td>
                      <td className="px-3.5 py-2.5 font-mono">{r.claimDate}</td>
                      <td className="px-3.5 py-2.5">{r.installTechnicianTeam}</td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-400">{r.orderNo}</td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-amber-400">{r.revisionJobNo}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono">{formatCurrency(r.orderValue)}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-rose-400">{formatCurrency(r.claimCost)}</td>
                      <td className="px-3.5 py-2.5">{r.problemSource}</td>
                      <td className="px-3.5 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-500/10 text-slate-300 font-semibold">
                          {r.responsibleDept}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold text-rose-300">{r.problem}</div>
                        {r.fabricName && <div className="text-[10px] text-slate-400 mt-0.5 font-mono">ผ้า: {r.fabricName}</div>}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        {r.photoUrl ? (
                          <a
                            href={r.photoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline font-bold"
                          >
                            <span>ดูรูป</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CSV Import Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className={`w-full max-w-xl p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'liquid-glass-modal border-cyan-500/30 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <span>นำเข้าข้อมูล CSV ไปยังแท็บ: {activeSheetTab}</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              ท่านสามารถอัปโหลดไฟล์ .csv หรือคัดลอกข้อความ CSV มาวางในช่องด้านล่างได้ทันที ระบบจะตรวจจับและแปลงข้อมูลตามคอลัมน์ของชีทที่เลือกอัตโนมัติ
            </p>

            <div className="space-y-2">
              <label className="block font-medium">1. เลือกไฟล์จากเครื่อง (.csv):</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="block font-medium">2. หรือวางข้อความ CSV ที่คัดลอกมา:</label>
              <textarea
                rows={6}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="วางแถวข้อมูล CSV ที่นี่..."
                className={`w-full p-3 rounded-xl font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-900/90 border-slate-700 text-white'
                }`}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300' : 'bg-white/5 hover:bg-white/10 border-white/10'
                }`}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handlePasteImport}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md"
              >
                ประมวลผลข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
