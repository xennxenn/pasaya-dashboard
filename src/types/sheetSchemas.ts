// Specifications and Data Types for the 7 Google Sheets
// PASAYA Curtain Center - Complete Schema & Column Mapping Definitions

export type SheetType =
  | 'sales_summary'
  | 'lead_report'
  | 'forecast_sales'
  | 'database'
  | 'quotation_report'
  | 'measurement_report'
  | 'installment_report'
  | 'claim_report';

// 1. Lead Report
export interface LeadReportRow {
  id: string;
  customerStatus: string; // Col.B: สถานะของลูกค้า
  customerId: string; // Col.C: รหัสลูกค้า (ตัวอย่าง L261001134800055)
  date?: {
    day: number;
    month: number;
    year: number; // 2026
    formatted: string; // "01-10-26"
  };
  customerName: string; // Col.G: ชื่อลูกค้า
  customerPhone: string; // Col.H: เบอร์ติดต่อลูกค้า
  leadSource: string; // Col.M: แหล่งที่มาของ Lead
  leadJobType: string; // Col.O: ประเภทหน้างานของ Lead
  salesPerson: string; // Col.P: ชื่อพนักงานขาย
  branchCode: string; // Col.V: รหัสสาขา (64 = Curtain Center)
  branchName: string; // "Curtain Center" if 64
  district: string; // Col.X: ชื่ออำเภอ
  province: string; // Col.Z: ชื่อจังหวัด
  rawCols?: string[];
}

// 2. Forecast Sales Report
export interface ForecastSalesReportRow {
  id: string;
  createdDate: string; // Col.B: วันที่ที่สร้าง
  presentationStatus: string; // Col.E: สถานะการนำเสนอขาย
  customerName: string; // Col.F: ชื่อลูกค้า
  customerPhone: string; // Col.G: เบอร์ติดต่อลูกค้า
  leadSource: string; // Col.H: แหล่งที่มาของ Lead
  leadJobType: string; // Col.I: ประเภทหน้างานของ Lead
  salesPerson: string; // Col.J: ชื่อพนักงานขาย
  totalQuoteAmount: number; // Col.K: ยอดที่เสนอราคา/ยอดทั้งหมด
  amount60: number; // Col.L: ยอดของ 60%
  month60: string | number; // Col.M: เดือนของยอด 60%
  year60: string | number; // Col.N: ปีของยอด 60%
  amount40: number; // Col.R: ยอดที่เหลือหรือยอด 40%
  month40: string | number; // Col.S: เดือนของยอดที่เหลือหรือยอด 40%
  year40: string | number; // Col.T: ปีของยอดที่เหลือหรือยอด 40%
  rawCols?: string[];
}

// 3. Database
export interface DatabaseConfigRow {
  id: string;
  leadSource: string; // Col.A: แหล่งที่มาของ Lead
  leadChannel: string; // Col.B: ช่องทางที่มาของ Lead โดยสัมพันธ์กับแหล่งที่มา
  targetYear: number; // Col.D: ปีของเป้ายอดขาย
  targetMonth: string | number; // Col.E: เดือนของเป้ายอดขาย
  targetAmount: number; // Col.F: เป้ายอดขาย
  customerStatus: string; // Col.H: สถานะของลูกค้า
  isConversionEligible: boolean; // Col.I: คำนวณ Conversion Rate ถ้าเป็น True (ชำระเงิน, ติดตั้งเรียบร้อย, บริการหลังการขาย)
  rawCols?: string[];
}

// 4. Quotation Report
export interface QuotationReportRow {
  id: string;
  quotationNo: string; // Col.A: เลขที่ใบเสนอราคา
  isConfirmed: boolean; // Col.B: การยืนยันใบเสนอราคา (ต้องเป็น Y เท่านั้น)
  revisionNo: number; // Col.C: ลำดับที่ Revise
  quotationDate: string; // Col.D: วันที่ของใบเสนอราคา
  branchCode: string; // Col.E: รหัสสาขา (64 = Curtain Center)
  branchName: string; // "Curtain Center"
  employeeCode: string; // Col.F: รหัสพนักงาน
  rStatus: 'Approved' | 'Issue Order' | 'New' | 'Cancel' | string; // Col.M: R_Status (A=Approved, Y=Issue Order, N=New, C=Cancel)
  customerFirstName: string; // Col.P: ชื่อจริงลูกค้า
  customerLastName: string; // Col.Q: นามสกุลลูกค้า
  customerFullName: string; // ชื่อ - สกุล รวม
  quotedAmount: number; // Col.S: ยอดที่เสนอราคา
  customerId: string; // Col.T: รหัสลูกค้า
  rawCols?: string[];
}

// 5. Measurement Report
export interface MeasurementReportRow {
  id: string;
  year: number; // Col.A: ปี
  month: string | number; // Col.B: เดือน
  salesPerson: string; // Col.C: ชื่อพนักงานขาย (รวมทั้งหมด = จำนวนของทุกคน)
  areaMeasurementCount: number; // Col.D: จำนวนที่วัดพื้นที่
  turnkeyMeetingCount: number; // Col.E: จำนวนที่เข้าพบ Turnkey
  siteRecheckCount: number; // Col.F: จำนวนที่รีเช็คหน้างาน
  fabricSummaryCount: number; // Col.G: จำนวนที่เข้าไปสรุปผ้าหรือเลือกผ้า
  installationSiteCheckCount: number; // Col.H: จำนวนที่เข้าไปดูหน้างานติดตั้ง
  totalCount: number; // Col.I: ยอดรวม
  rawCols?: string[];
}

// 6. Installment Report
export interface InstallmentReportRow {
  id: string;
  queueNo: string; // Col.A: เลขที่คิวติดตั้ง
  installDateRaw: string; // Col.B: วันที่ติดตั้ง เช่น 20251031 (2025=ปี, 10=เดือน, 31=วัน)
  installDateFormatted: string; // 31/10/2025
  installDateParsed?: {
    year: number;
    month: number;
    day: number;
  };
  timeIn: string; // Col.E: เวลาเข้างาน
  timeOut: string; // Col.F: เวลาออกจากงาน (3 ช่วง: 10.00-11.30, 13.00-14.30, 15.30-17.00)
  timeSlot: string; // ข้อความช่วงเวลาสรุป
  technicianTeam: string; // Col.G: ชื่อทีมช่าง
  customerName: string; // Col.H: ชื่อลูกค้า
  contactPerson: string; // Col.J: ชื่อคนติดต่อ
  customerPhone: string; // Col.K: เบอร์ติดต่อลูกค้า
  installLocation: string; // Col.L: สถานที่ติดตั้ง
  installQuantity: number; // Col.M: จำนวนที่ติดตั้ง
  salesFirstName: string; // Col.N: ชื่อจริงพนักงานขาย
  salesLastName: string; // Col.O: นามสกุลพนักงานขาย
  salesFullName: string; // ชื่อ-สกุล พนักงานขาย
  orderNo: string; // Col.S: เลขที่ออเดอร์
  workTypeCode: string | number; // Col.T: ประเภทงาน (1,2,3,4)
  workTypeLabel: string; // 1=ติดตั้งผ้าม่าน, 2=วัดพื้นที่, 3=แก้ไข, 4=ติดตั้งวอลเปเปอร์
  jobNo: string; // Col.V: เลขที่งาน
  technicianTypeRaw: string; // Col.Z: pasaya หรือ supplier
  technicianTypeLabel: string; // pasaya = บริษัท, supplier = Outsource
  rawCols?: string[];
}

// 7. Claim Report (e.g. Claim Report 2026)
export interface ClaimReportRow {
  id: string;
  customerName: string; // Col.A: ชื่อลูกค้า
  salesPerson: string; // Col.D: ชื่อพนักงานขาย
  claimDate: string; // Col.E: วันที่แจ้งเคลม
  installTechnicianTeam: string; // Col.F: ทีมช่างที่ติดตั้ง
  salesDepartment: string; // Col.G: แผนกของทีมขาย
  orderNo: string; // Col.H: เลขที่ออเดอร์
  revisionJobNo: string; // Col.I: เลขที่แก้ไข
  orderValue: number; // Col.J: มูลค่าออเดอร์
  claimCost: number; // Col.K: มูลค่างานแก้ไข
  problemSource: string; // Col.N: แหล่งที่มาของปัญหา
  responsibleDept: string; // Col.O: ฝ่ายรับผิดชอบ
  problem: string; // Col.P: ปัญหา
  fabricName: string; // Col.Q: ชื่อผ้าที่มีปัญหา (ถ้ามี)
  details: string; // Col.R: รายละเอียด
  rootCause: string; // Col.V: สาเหตุของปัญหา
  photoUrl: string; // Col.Z: ลิงก์ของรูปงานแก้ไข
  isVisible?: boolean; // สามารถเลือกให้แสดงหรือไม่แสดงในรายงาน (ถ้าไม่แสดง จะไม่นำมูลค่ามารวม)
  rawCols?: string[];
}

// Metadata Specifications for all 7 sheets
export interface SheetMetadata {
  id: SheetType;
  title: string;
  sheetNamePattern: RegExp;
  recommendedTabName: string;
  description: string;
  columns: {
    colLetter: string;
    colIndex: number;
    name: string;
    description: string;
    rule?: string;
  }[];
}

export const SHEET_SPECS: SheetMetadata[] = [
  {
    id: 'lead_report',
    title: '1. Lead Report',
    sheetNamePattern: /lead/i,
    recommendedTabName: 'Lead Report',
    description: 'รายงานลีดลูกค้า ข้อมูลการติดต่อ แหล่งที่มา และที่อยู่',
    columns: [
      { colLetter: 'B', colIndex: 1, name: 'สถานะของลูกค้า', description: 'สถานะปัจจุบันของ Lead' },
      {
        colLetter: 'C',
        colIndex: 2,
        name: 'รหัสลูกค้า',
        description: 'ตัวอย่าง L261001134800055',
        rule: 'ตัวอักษร 2-3=ปี (26), 4-5=เดือน (10), 6-7=วัน (01) => วันที่ 01-10-26',
      },
      { colLetter: 'G', colIndex: 6, name: 'ชื่อลูกค้า', description: 'ชื่อลูกค้า' },
      { colLetter: 'H', colIndex: 7, name: 'เบอร์ติดต่อลูกค้า', description: 'เบอร์โทรศัพท์' },
      { colLetter: 'M', colIndex: 12, name: 'แหล่งที่มาของ Lead', description: 'เช่น Facebook, Showroom, Walk-in' },
      { colLetter: 'O', colIndex: 14, name: 'ประเภทหน้างานของ Lead', description: 'เช่น บ้านเดี่ยว, คอนโด, สำนักงาน' },
      { colLetter: 'P', colIndex: 15, name: 'ชื่อพนักงานขาย', description: 'ชื่อเซลส์ที่รับผิดชอบ' },
      { colLetter: 'V', colIndex: 21, name: 'รหัสสาขา', description: '64 = Curtain Center' },
      { colLetter: 'X', colIndex: 23, name: 'ชื่ออำเภอ', description: 'อำเภอ/เขตที่ตั้งหน้างาน' },
      { colLetter: 'Z', colIndex: 25, name: 'ชื่อจังหวัด', description: 'จังหวัด' },
    ],
  },
  {
    id: 'forecast_sales',
    title: '2. Forecast Sales Report',
    sheetNamePattern: /forecast/i,
    recommendedTabName: 'Forecast Sales Report',
    description: 'รายงานพยากรณ์ยอดขาย แบ่งเป็นงวด 60% และงวดที่เหลือ 40%',
    columns: [
      { colLetter: 'B', colIndex: 1, name: 'วันที่ที่สร้าง', description: 'วันที่เปิดเอกสาร Forecast' },
      { colLetter: 'E', colIndex: 4, name: 'สถานะการนำเสนอขาย', description: 'สถานะการเจรจา/นำเสนอ' },
      { colLetter: 'F', colIndex: 5, name: 'ชื่อลูกค้า', description: 'ชื่อลูกค้า' },
      { colLetter: 'G', colIndex: 6, name: 'เบอร์ติดต่อลูกค้า', description: 'เบอร์ติดต่อลูกค้า' },
      { colLetter: 'H', colIndex: 7, name: 'แหล่งที่มาของ Lead', description: 'แหล่งที่มาของ Lead' },
      { colLetter: 'I', colIndex: 8, name: 'ประเภทหน้างานของ Lead', description: 'ประเภทหน้างาน' },
      { colLetter: 'J', colIndex: 9, name: 'ชื่อพนักงานขาย', description: 'ชื่อเซลส์ผู้รับผิดชอบ' },
      { colLetter: 'K', colIndex: 10, name: 'ยอดที่เสนอราคา/ยอดทั้งหมด', description: 'มูลค่างานรวม' },
      { colLetter: 'L', colIndex: 11, name: 'ยอดของ 60%', description: 'ยอดเงินงวดมัดจำ 60%' },
      { colLetter: 'M', colIndex: 12, name: 'เดือนของยอด 60%', description: 'เดือนที่คาดว่าจะได้รับเงิน 60%' },
      { colLetter: 'N', colIndex: 13, name: 'ปีของยอด 60%', description: 'ปีที่คาดว่าจะได้รับเงิน 60%' },
      { colLetter: 'R', colIndex: 17, name: 'ยอดที่เหลือหรือยอด 40%', description: 'ยอดเงินงวดสุดท้าย 40%' },
      { colLetter: 'S', colIndex: 18, name: 'เดือนของยอด 40%', description: 'เดือนที่คาดว่าจะได้รับเงิน 40%' },
      { colLetter: 'T', colIndex: 19, name: 'ปีของยอด 40%', description: 'ปีที่คาดว่าจะได้รับเงิน 40%' },
    ],
  },
  {
    id: 'database',
    title: '3. Database',
    sheetNamePattern: /database|ฐานข้อมูล/i,
    recommendedTabName: 'Database',
    description: 'ฐานข้อมูลกำหนดช่องทาง Lead, เป้าหมายยอดขาย และเกณฑ์ Conversion Rate',
    columns: [
      { colLetter: 'A', colIndex: 0, name: 'แหล่งที่มาของ Lead', description: 'แหล่งหลัก' },
      { colLetter: 'B', colIndex: 1, name: 'ช่องทางที่มาของ Lead', description: 'สัมพันธ์กับแหล่งที่มา Col.A' },
      { colLetter: 'D', colIndex: 3, name: 'ปีของเป้ายอดขาย', description: 'เช่น 2025, 2026' },
      { colLetter: 'E', colIndex: 4, name: 'เดือนของเป้ายอดขาย', description: 'เช่น January หรือ 1' },
      { colLetter: 'F', colIndex: 5, name: 'เป้ายอดขาย', description: 'เป้าหมายยอดขายจำนวนเงิน (บาท)' },
      { colLetter: 'H', colIndex: 7, name: 'สถานะของลูกค้า', description: 'สถานะของลูกค้า' },
      {
        colLetter: 'I',
        colIndex: 8,
        name: 'คำนวณ Conversion Rate',
        description: 'True = ชำระเงิน (Payment), ติดตั้งเรียบร้อย (Site Install), บริการหลังการขาย (After Sale Service)',
      },
    ],
  },
  {
    id: 'quotation_report',
    title: '4. Quotation Report',
    sheetNamePattern: /quotation|ใบเสนอราคา/i,
    recommendedTabName: 'Quotation Report',
    description: 'รายงานใบเสนอราคา ยอดที่เสนอ สถานะการอนุมัติ และพนักงานขาย',
    columns: [
      { colLetter: 'A', colIndex: 0, name: 'เลขที่ใบเสนอราคา', description: 'รหัสเอกสารใบเสนอราคา' },
      { colLetter: 'B', colIndex: 1, name: 'การยืนยันใบเสนอราคา', description: 'ต้องเป็น Y เท่านั้น (Confirmed = Y)' },
      { colLetter: 'C', colIndex: 2, name: 'ลำดับที่ Revise', description: 'จำนวนครั้งที่แก้ไขใบเสนอราคา' },
      { colLetter: 'D', colIndex: 3, name: 'วันที่ของใบเสนอราคา', description: 'วันที่ออกใบเสนอราคา' },
      { colLetter: 'E', colIndex: 4, name: 'รหัสสาขา', description: '64 = Curtain Center' },
      { colLetter: 'F', colIndex: 5, name: 'รหัสพนักงาน', description: 'รหัสเซลส์ เช่น T46160' },
      { colLetter: 'M', colIndex: 12, name: 'R_Status', description: 'A = Approved, Y = Issue Order, N = New, C = Cancel' },
      { colLetter: 'P', colIndex: 15, name: 'ชื่อจริงลูกค้า', description: 'ชื่อจริง' },
      { colLetter: 'Q', colIndex: 16, name: 'นามสกุลลูกค้า', description: 'นามสกุล' },
      { colLetter: 'S', colIndex: 18, name: 'ยอดที่เสนอราคา', description: 'มูลค่ายอดเงินที่เสนอราคา' },
      { colLetter: 'T', colIndex: 19, name: 'รหัสลูกค้า', description: 'รหัสลูกค้าที่เชื่อมโยง' },
    ],
  },
  {
    id: 'measurement_report',
    title: '5. Measurement Report',
    sheetNamePattern: /measurement|วัดพื้นที่/i,
    recommendedTabName: 'Measurement Report',
    description: 'รายงานสถิติวัดพื้นที่ เข้าพบ Turnkey สรุปผ้า รีเช็คหน้างาน และดูงานติดตั้ง',
    columns: [
      { colLetter: 'A', colIndex: 0, name: 'ปี', description: 'เช่น 2025, 2026' },
      { colLetter: 'B', colIndex: 1, name: 'เดือน', description: 'เช่น January, February' },
      { colLetter: 'C', colIndex: 2, name: 'ชื่อพนักงานขาย', description: 'รวมทั้งหมด = ผลรวมของทุกคน' },
      { colLetter: 'D', colIndex: 3, name: 'จำนวนที่วัดพื้นที่', description: 'จำนวนครั้งที่ไปวัดพื้นที่' },
      { colLetter: 'E', colIndex: 4, name: 'จำนวนที่เข้าพบ Turnkey', description: 'จำนวนครั้งเข้าพบ Turnkey' },
      { colLetter: 'F', colIndex: 5, name: 'จำนวนที่รีเช็คหน้างาน', description: 'จำนวนครั้งรีเช็ค' },
      { colLetter: 'G', colIndex: 6, name: 'จำนวนที่เข้าไปสรุปผ้าหรือเลือกผ้า', description: 'จำนวนครั้งสรุปผ้า' },
      { colLetter: 'H', colIndex: 7, name: 'จำนวนที่เข้าไปดูหน้างานติดตั้ง', description: 'จำนวนครั้งตรวจงานติดตั้ง' },
      { colLetter: 'I', colIndex: 8, name: 'ยอดรวม', description: 'ยอดรวมกิจกรรมทั้งหมด' },
    ],
  },
  {
    id: 'installment_report',
    title: '6. Installment Report',
    sheetNamePattern: /install|ติดตั้ง/i,
    recommendedTabName: 'Installment Report',
    description: 'รายงานคิวติดตั้ง เวลาเข้า-ออก ทีมช่าง pasaya/supplier และประเภทงาน',
    columns: [
      { colLetter: 'A', colIndex: 0, name: 'เลขที่คิวติดตั้ง', description: 'รหัสคิวติดตั้ง' },
      {
        colLetter: 'B',
        colIndex: 1,
        name: 'วันที่ติดตั้ง',
        description: 'ตัวอย่าง 20251031 (2025=ปี, 10=เดือน, 31=วัน)',
        rule: 'แปลงเป็น วันที่ 31-10-2025',
      },
      { colLetter: 'E', colIndex: 4, name: 'เวลาเข้างาน', description: 'ช่วง: 10.00-11.30, 13.00-14.30, 15.30-17.00' },
      { colLetter: 'F', colIndex: 5, name: 'เวลาออกจากงาน', description: 'ช่วง: 10.00-11.30, 13.00-14.30, 15.30-17.00' },
      { colLetter: 'G', colIndex: 6, name: 'ชื่อทีมช่าง', description: 'ชื่อทีมช่างติดตั้ง' },
      { colLetter: 'H', colIndex: 7, name: 'ชื่อลูกค้า', description: 'ชื่อลูกค้า' },
      { colLetter: 'J', colIndex: 9, name: 'ชื่อคนติดต่อ', description: 'ผู้ติดต่อหน้างาน' },
      { colLetter: 'K', colIndex: 10, name: 'เบอร์ติดต่อลูกค้า', description: 'เบอร์โทรศัพท์' },
      { colLetter: 'L', colIndex: 11, name: 'สถานที่ติดตั้ง', description: 'ที่อยู่หน้างาน' },
      { colLetter: 'M', colIndex: 12, name: 'จำนวนที่ติดตั้ง', description: 'จำนวนจุด/ชิ้นงาน' },
      { colLetter: 'N', colIndex: 13, name: 'ชื่อจริงพนักงานขาย', description: 'ชื่อจริงเซลส์' },
      { colLetter: 'O', colIndex: 14, name: 'นามสกุลพนักงานขาย', description: 'นามสกุลเซลส์' },
      { colLetter: 'S', colIndex: 18, name: 'เลขที่ออเดอร์', description: 'Order ID' },
      {
        colLetter: 'T',
        colIndex: 19,
        name: 'ประเภทงาน',
        description: '1=ติดตั้งผ้าม่าน, 2=วัดพื้นที่, 3=แก้ไข, 4=ติดตั้งวอลเปเปอร์',
      },
      { colLetter: 'V', colIndex: 21, name: 'เลขที่งาน', description: 'Job ID' },
      {
        colLetter: 'Z',
        colIndex: 25,
        name: 'ประเภทของทีมช่าง',
        description: 'pasaya = บริษัท, supplier = Outsource',
      },
    ],
  },
  {
    id: 'claim_report',
    title: '7. Claim Report [Year]',
    sheetNamePattern: /claim|เคลม/i,
    recommendedTabName: 'Claim Report 2026',
    description: 'รายงานเคลม มูลค่างานแก้ไข สาเหตุของปัญหา และลิงก์รูปถ่าย (ชื่อชีทเพิ่มปี เช่น Claim Report 2026, 2027...)',
    columns: [
      { colLetter: 'A', colIndex: 0, name: 'ชื่อลูกค้า', description: 'ชื่อลูกค้า' },
      { colLetter: 'D', colIndex: 3, name: 'ชื่อพนักงานขาย', description: 'ชื่อเซลส์ผู้รับผิดชอบ' },
      { colLetter: 'E', colIndex: 4, name: 'วันที่แจ้งเคลม', description: 'วันที่รับเรื่องเคลม' },
      { colLetter: 'F', colIndex: 5, name: 'ทีมช่างที่ติดตั้ง', description: 'ทีมช่างผู้ติดตั้งเดิม' },
      { colLetter: 'G', colIndex: 6, name: 'แผนกของทีมขาย', description: 'แผนก' },
      { colLetter: 'H', colIndex: 7, name: 'เลขที่ออเดอร์', description: 'Order ID' },
      { colLetter: 'I', colIndex: 8, name: 'เลขที่แก้ไข', description: 'รหัสงานแก้งานเคลม' },
      { colLetter: 'J', colIndex: 9, name: 'มูลค่าออเดอร์', description: 'มูลค่างานรวม' },
      { colLetter: 'K', colIndex: 10, name: 'มูลค่างานแก้ไข', description: 'ค่าใช้จ่ายในการแก้งาน' },
      { colLetter: 'N', colIndex: 13, name: 'แหล่งที่มาของปัญหา', description: 'ต้นตอของปัญหา' },
      { colLetter: 'O', colIndex: 14, name: 'ฝ่ายรับผิดชอบ', description: 'ฝ่ายที่ต้องรับผิดชอบค่าใช้จ่าย/การแก้ไข' },
      { colLetter: 'P', colIndex: 15, name: 'ปัญหา', description: 'หัวข้อปัญหาที่พบ' },
      { colLetter: 'Q', colIndex: 16, name: 'ชื่อผ้าที่มีปัญหา (ถ้ามี)', description: 'รหัส/ชื่อผ้า' },
      { colLetter: 'R', colIndex: 17, name: 'รายละเอียด', description: 'คำอธิบายอย่างละเอียด' },
      { colLetter: 'V', colIndex: 21, name: 'สาเหตุของปัญหา', description: 'Root Cause' },
      { colLetter: 'Z', colIndex: 25, name: 'ลิงก์ของรูปงานแก้ไข', description: 'URL รูปภาพหน้างาน/งานแก้ไข' },
    ],
  },
];
