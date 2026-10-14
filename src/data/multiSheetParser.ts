import {
  SheetType,
  LeadReportRow,
  ForecastSalesReportRow,
  DatabaseConfigRow,
  QuotationReportRow,
  MeasurementReportRow,
  InstallmentReportRow,
  ClaimReportRow,
} from '../types/sheetSchemas';
import { SalesRecord, SalesRep, MonthName, QuarterName } from '../types';
import { parseCsvLine } from './salesDataService';

// Clean numeric values safely
export function cleanNumber(val: string | undefined | null): number {
  if (!val) return 0;
  let str = String(val)
    .replace(/[\u00A0\r\n\t ]/g, '')
    .replace(/,/g, '')
    .replace(/฿|THB|\$/gi, '')
    .replace(/"|'/g, '')
    .trim();
  if (!str) return 0;
  if (str.startsWith('(') && str.endsWith(')')) {
    str = '-' + str.slice(1, -1);
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

// Extract date from Customer ID e.g. "L261001134800055" -> year: 2026, month: 10, day: 1 => "01-10-26"
export function parseCustomerIdDate(customerId: string): {
  day: number;
  month: number;
  year: number;
  formatted: string;
} | undefined {
  if (!customerId || customerId.length < 7) return undefined;
  const match = customerId.match(/^[a-zA-Z]?(\d{2})(\d{2})(\d{2})/);
  if (!match) return undefined;

  const rawYear = parseInt(match[1], 10);
  const rawMonth = parseInt(match[2], 10);
  const rawDay = parseInt(match[3], 10);

  // e.g. '26' -> 2026 or 2526 BE
  const fullYear = rawYear < 70 ? 2000 + rawYear : 1900 + rawYear;
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted = `${pad(rawDay)}-${pad(rawMonth)}-${pad(rawYear)}`;

  return {
    day: rawDay,
    month: rawMonth,
    year: fullYear,
    formatted,
  };
}

// Extract Install Date e.g. "20251031" -> 2025 / 10 / 31 => "31/10/2025"
export function parseInstallDate(rawDate: string): {
  year: number;
  month: number;
  day: number;
  formatted: string;
} {
  const clean = String(rawDate || '').replace(/[^0-9]/g, '');
  if (clean.length === 8) {
    const year = parseInt(clean.slice(0, 4), 10);
    const month = parseInt(clean.slice(4, 6), 10);
    const day = parseInt(clean.slice(6, 8), 10);
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      year,
      month,
      day,
      formatted: `${pad(day)}/${pad(month)}/${year}`,
    };
  }
  return {
    year: 0,
    month: 0,
    day: 0,
    formatted: rawDate || '-',
  };
}

// Work type mapping for Installment Report
export const WORK_TYPE_MAP: Record<string, string> = {
  '1': 'งานติดตั้งผ้าม่าน',
  '2': 'งานวัดพื้นที่',
  '3': 'งานแก้ไข',
  '4': 'งานติดตั้งวอลเปเปอร์',
};

// Branch code mapping
export const BRANCH_MAP: Record<string, string> = {
  '64': 'Curtain Center',
};

// R_Status mapping for Quotation Report
export const R_STATUS_MAP: Record<string, string> = {
  A: 'Approved',
  Y: 'Issue Order',
  N: 'New',
  C: 'Cancel',
};

// Detect which sheet type a CSV represents
export function detectSheetType(csvText: string, tabName?: string): SheetType {
  const name = (tabName || '').toLowerCase().trim();
  if (name.includes('lead')) return 'lead_report';
  if (name.includes('forecast')) return 'forecast_sales';
  if (name.includes('quotation') || name.includes('ใบเสนอราคา')) return 'quotation_report';
  if (name.includes('measurement') || name.includes('วัดพื้นที่')) return 'measurement_report';
  if (name.includes('install') || name.includes('ติดตั้ง')) return 'installment_report';
  if (name.includes('claim') || name.includes('เคลม')) return 'claim_report';
  if (name.includes('database') || name.includes('ฐานข้อมูล')) return 'database';

  const firstLines = csvText.split(/\r?\n/).slice(0, 4).join(' ').toLowerCase();

  if (firstLines.includes('รหัสลูกค้า') && (firstLines.includes('สถานะของลูกค้า') || firstLines.includes('curtain center'))) {
    return 'lead_report';
  }
  if (firstLines.includes('ยอดของ 60%') || (firstLines.includes('60%') && firstLines.includes('40%'))) {
    return 'forecast_sales';
  }
  if (firstLines.includes('ใบเสนอราคา') || firstLines.includes('r_status') || firstLines.includes('ยืนยันใบเสนอราคา')) {
    return 'quotation_report';
  }
  if (firstLines.includes('วัดพื้นที่') && firstLines.includes('turnkey')) {
    return 'measurement_report';
  }
  if (firstLines.includes('คิวติดตั้ง') || (firstLines.includes('เวลาเข้างาน') && firstLines.includes('ทีมช่าง'))) {
    return 'installment_report';
  }
  if (firstLines.includes('แจ้งเคลม') || firstLines.includes('งานแก้ไข') || firstLines.includes('สาเหตุของปัญหา')) {
    return 'claim_report';
  }
  if (firstLines.includes('conversion rate') || (firstLines.includes('เป้ายอดขาย') && firstLines.includes('ช่องทางที่มา'))) {
    return 'database';
  }

  // Default to standard sales summary
  return 'sales_summary';
}

// 1. Parse Lead Report
export function parseLeadReport(csvText: string): LeadReportRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const rows: LeadReportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 3) continue;

    const customerStatus = cols[1]?.trim() || ''; // Col.B
    const customerId = cols[2]?.trim() || ''; // Col.C
    const customerName = cols[6]?.trim() || ''; // Col.G
    const customerPhone = cols[7]?.trim() || ''; // Col.H
    const leadSource = cols[12]?.trim() || ''; // Col.M
    const leadJobType = cols[14]?.trim() || ''; // Col.O
    const salesPerson = cols[15]?.trim() || ''; // Col.P
    const branchCode = cols[21]?.trim() || ''; // Col.V
    const district = cols[23]?.trim() || ''; // Col.X
    const province = cols[25]?.trim() || ''; // Col.Z

    if (!customerName && !customerId && !customerPhone) continue;

    rows.push({
      id: `lead-${i}-${customerId || i}`,
      customerStatus,
      customerId,
      date: parseCustomerIdDate(customerId),
      customerName,
      customerPhone,
      leadSource,
      leadJobType,
      salesPerson,
      branchCode,
      branchName: branchCode === '64' ? 'Curtain Center' : (branchCode ? `Branch ${branchCode}` : 'Curtain Center'),
      district,
      province,
      rawCols: cols,
    });
  }
  return rows;
}

// 2. Parse Forecast Sales Report
export function parseForecastSalesReport(csvText: string): ForecastSalesReportRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const rows: ForecastSalesReportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 5) continue;

    const createdDate = cols[1]?.trim() || ''; // Col.B
    const presentationStatus = cols[4]?.trim() || ''; // Col.E
    const customerName = cols[5]?.trim() || ''; // Col.F
    const customerPhone = cols[6]?.trim() || ''; // Col.G
    const leadSource = cols[7]?.trim() || ''; // Col.H
    const leadJobType = cols[8]?.trim() || ''; // Col.I
    const salesPerson = cols[9]?.trim() || ''; // Col.J
    const totalQuoteAmount = cleanNumber(cols[10]); // Col.K
    const amount60 = cleanNumber(cols[11]); // Col.L
    const month60 = cols[12]?.trim() || ''; // Col.M
    const year60 = cols[13]?.trim() || ''; // Col.N
    const amount40 = cleanNumber(cols[17]); // Col.R
    const month40 = cols[18]?.trim() || ''; // Col.S
    const year40 = cols[19]?.trim() || ''; // Col.T

    if (!customerName && !salesPerson && totalQuoteAmount === 0) continue;

    rows.push({
      id: `forecast-${i}`,
      createdDate,
      presentationStatus,
      customerName,
      customerPhone,
      leadSource,
      leadJobType,
      salesPerson,
      totalQuoteAmount,
      amount60,
      month60,
      year60,
      amount40,
      month40,
      year40,
      rawCols: cols,
    });
  }
  return rows;
}

// 3. Parse Database Config
export function parseDatabaseConfig(csvText: string): DatabaseConfigRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const rows: DatabaseConfigRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 2) continue;

    const leadSource = cols[0]?.trim() || ''; // Col.A
    const leadChannel = cols[1]?.trim() || ''; // Col.B
    const targetYear = cleanNumber(cols[3]); // Col.D
    const targetMonth = cols[4]?.trim() || ''; // Col.E
    const targetAmount = cleanNumber(cols[5]); // Col.F
    const customerStatus = cols[7]?.trim() || ''; // Col.H
    const rawConversion = (cols[8] || '').trim().toLowerCase(); // Col.I

    const isConversionEligible =
      rawConversion === 'true' ||
      rawConversion === '1' ||
      rawConversion === 'y' ||
      customerStatus.includes('ชำระเงิน') ||
      customerStatus.includes('Payment') ||
      customerStatus.includes('ติดตั้งเรียบร้อย') ||
      customerStatus.includes('Site Install') ||
      customerStatus.includes('บริการหลังการขาย') ||
      customerStatus.includes('After Sale');

    rows.push({
      id: `db-cfg-${i}`,
      leadSource,
      leadChannel,
      targetYear,
      targetMonth,
      targetAmount,
      customerStatus,
      isConversionEligible,
      rawCols: cols,
    });
  }
  return rows;
}

// 4. Parse Quotation Report
export function parseQuotationReport(csvText: string): QuotationReportRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const rows: QuotationReportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 5) continue;

    const quotationNo = cols[0]?.trim() || ''; // Col.A
    const confirmVal = cols[1]?.trim().toUpperCase() || ''; // Col.B: Must be 'Y'
    const isConfirmed = confirmVal === 'Y';
    const revisionNo = cleanNumber(cols[2]); // Col.C
    const quotationDate = cols[3]?.trim() || ''; // Col.D
    const branchCode = cols[4]?.trim() || ''; // Col.E (64 = Curtain Center)
    const employeeCode = cols[5]?.trim() || ''; // Col.F
    const rawRStatus = cols[12]?.trim().toUpperCase() || ''; // Col.M (A, Y, N, C)
    const rStatus = R_STATUS_MAP[rawRStatus] || rawRStatus;
    const customerFirstName = cols[15]?.trim() || ''; // Col.P
    const customerLastName = cols[16]?.trim() || ''; // Col.Q
    const quotedAmount = cleanNumber(cols[18]); // Col.S
    const customerId = cols[19]?.trim() || ''; // Col.T

    if (!quotationNo && quotedAmount === 0 && !customerFirstName) continue;

    rows.push({
      id: `quote-${i}-${quotationNo}`,
      quotationNo,
      isConfirmed,
      revisionNo,
      quotationDate,
      branchCode,
      branchName: branchCode === '64' ? 'Curtain Center' : (branchCode ? `Branch ${branchCode}` : 'Curtain Center'),
      employeeCode,
      rStatus,
      customerFirstName,
      customerLastName,
      customerFullName: `${customerFirstName} ${customerLastName}`.trim(),
      quotedAmount,
      customerId,
      rawCols: cols,
    });
  }
  return rows;
}

// 5. Parse Measurement Report
export function parseMeasurementReport(csvText: string): MeasurementReportRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const rows: MeasurementReportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 3) continue;

    const year = cleanNumber(cols[0]); // Col.A
    const month = cols[1]?.trim() || ''; // Col.B
    let salesPerson = cols[2]?.trim() || ''; // Col.C
    if (salesPerson.toLowerCase().includes('รวมทั้งหมด') || salesPerson.toLowerCase().includes('total')) {
      salesPerson = 'รวมทั้งหมด';
    }

    const areaMeasurementCount = cleanNumber(cols[3]); // Col.D
    const turnkeyMeetingCount = cleanNumber(cols[4]); // Col.E
    const siteRecheckCount = cleanNumber(cols[5]); // Col.F
    const fabricSummaryCount = cleanNumber(cols[6]); // Col.G
    const installationSiteCheckCount = cleanNumber(cols[7]); // Col.H
    const sumCount = areaMeasurementCount + turnkeyMeetingCount + siteRecheckCount + fabricSummaryCount + installationSiteCheckCount;
    const totalCount = cleanNumber(cols[8]) || sumCount; // Col.I

    if (!salesPerson && year === 0) continue;

    rows.push({
      id: `measure-${i}-${year}-${month}-${salesPerson}`,
      year,
      month,
      salesPerson,
      areaMeasurementCount,
      turnkeyMeetingCount,
      siteRecheckCount,
      fabricSummaryCount,
      installationSiteCheckCount,
      totalCount,
      rawCols: cols,
    });
  }
  return rows;
}

// 6. Parse Installment Report
export function parseInstallmentReport(csvText: string): InstallmentReportRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const rows: InstallmentReportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 3) continue;

    const queueNo = cols[0]?.trim() || ''; // Col.A
    const installDateRaw = cols[1]?.trim() || ''; // Col.B (e.g. 20251031)
    const parsedDate = parseInstallDate(installDateRaw);
    const timeIn = cols[4]?.trim() || ''; // Col.E
    const timeOut = cols[5]?.trim() || ''; // Col.F
    const timeSlot = timeIn && timeOut ? `${timeIn} - ${timeOut}` : timeIn || timeOut || '-';
    const technicianTeam = cols[6]?.trim() || ''; // Col.G
    const customerName = cols[7]?.trim() || ''; // Col.H
    const contactPerson = cols[9]?.trim() || ''; // Col.J
    const customerPhone = cols[10]?.trim() || ''; // Col.K
    const installLocation = cols[11]?.trim() || ''; // Col.L
    const installQuantity = cleanNumber(cols[12]); // Col.M
    const salesFirstName = cols[13]?.trim() || ''; // Col.N
    const salesLastName = cols[14]?.trim() || ''; // Col.O
    const salesFullName = `${salesFirstName} ${salesLastName}`.trim();
    const orderNo = cols[18]?.trim() || ''; // Col.S
    const workTypeCode = cols[19]?.trim() || ''; // Col.T
    const workTypeLabel = WORK_TYPE_MAP[workTypeCode] || (workTypeCode ? `ประเภทงาน ${workTypeCode}` : 'งานติดตั้งทั่วไป');
    const jobNo = cols[21]?.trim() || ''; // Col.V
    const technicianTypeRaw = (cols[25] || '').trim().toLowerCase(); // Col.Z
    const technicianTypeLabel =
      technicianTypeRaw.includes('pasaya') || technicianTypeRaw === 'บริษัท'
        ? 'PASAYA (บริษัท)'
        : technicianTypeRaw.includes('supplier') || technicianTypeRaw === 'outsource'
        ? 'Supplier (Outsource)'
        : technicianTypeRaw || 'PASAYA (บริษัท)';

    if (!queueNo && !customerName && !orderNo) continue;

    rows.push({
      id: `install-${i}-${queueNo || orderNo || i}`,
      queueNo,
      installDateRaw,
      installDateFormatted: parsedDate.formatted,
      installDateParsed: parsedDate.year > 0 ? { year: parsedDate.year, month: parsedDate.month, day: parsedDate.day } : undefined,
      timeIn,
      timeOut,
      timeSlot,
      technicianTeam,
      customerName,
      contactPerson,
      customerPhone,
      installLocation,
      installQuantity,
      salesFirstName,
      salesLastName,
      salesFullName,
      orderNo,
      workTypeCode,
      workTypeLabel,
      jobNo,
      technicianTypeRaw,
      technicianTypeLabel,
      rawCols: cols,
    });
  }
  return rows;
}

// 7. Parse Claim Report
export function parseClaimReport(csvText: string): ClaimReportRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const rows: ClaimReportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 3) continue;

    const customerName = cols[0]?.trim() || ''; // Col.A
    const salesPerson = cols[3]?.trim() || ''; // Col.D
    const claimDate = cols[4]?.trim() || ''; // Col.E
    const installTechnicianTeam = cols[5]?.trim() || ''; // Col.F
    const salesDepartment = cols[6]?.trim() || ''; // Col.G
    const orderNo = cols[7]?.trim() || ''; // Col.H
    const revisionJobNo = cols[8]?.trim() || ''; // Col.I
    const orderValue = cleanNumber(cols[9]); // Col.J
    const claimCost = cleanNumber(cols[10]); // Col.K
    const problemSource = cols[13]?.trim() || ''; // Col.N
    const responsibleDept = cols[14]?.trim() || ''; // Col.O
    const problem = cols[15]?.trim() || ''; // Col.P
    const fabricName = cols[16]?.trim() || ''; // Col.Q
    const details = cols[17]?.trim() || ''; // Col.R
    const rootCause = cols[21]?.trim() || ''; // Col.V
    const photoUrl = cols[25]?.trim() || ''; // Col.Z

    if (!customerName && !orderNo && !problem && claimCost === 0) continue;

    rows.push({
      id: `claim-${i}-${orderNo || i}`,
      customerName,
      salesPerson,
      claimDate,
      installTechnicianTeam,
      salesDepartment,
      orderNo,
      revisionJobNo,
      orderValue,
      claimCost,
      problemSource,
      responsibleDept,
      problem,
      fabricName,
      details,
      rootCause,
      photoUrl,
      isVisible: true,
      rawCols: cols,
    });
  }
  return rows;
}

// Bridge: Convert Quotation Report rows (with confirm 'Y' and Approved/Issue Order) into SalesRecords
export function convertQuotationReportToSalesRecords(
  quotations: QuotationReportRow[],
  salesReps: SalesRep[]
): SalesRecord[] {
  const confirmedQuotes = quotations.filter(
    (q) => q.isConfirmed && (q.rStatus === 'Approved' || q.rStatus === 'Issue Order' || q.rStatus === 'A' || q.rStatus === 'Y')
  );

  if (confirmedQuotes.length === 0) return [];

  // Group by Year, Month, SalesPerson
  const groups: Record<string, { year: number; month: MonthName; salesPerson: string; total: number; count: number }> = {};

  const monthNames: MonthName[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  confirmedQuotes.forEach((q) => {
    let year = 2026;
    let month: MonthName = 'January';

    // Parse date from quotationDate or customerId
    if (q.quotationDate) {
      const match = q.quotationDate.match(/(\d{4})[/-](\d{1,2})/);
      if (match) {
        year = parseInt(match[1], 10);
        const mIdx = parseInt(match[2], 10) - 1;
        if (mIdx >= 0 && mIdx < 12) month = monthNames[mIdx];
      }
    } else if (q.customerId) {
      const parsed = parseCustomerIdDate(q.customerId);
      if (parsed) {
        year = parsed.year;
        const mIdx = parsed.month - 1;
        if (mIdx >= 0 && mIdx < 12) month = monthNames[mIdx];
      }
    }

    // Match sales person by employeeCode or name
    const matchedRep = salesReps.find(
      (r) =>
        (r.code && q.employeeCode && r.code.toLowerCase() === q.employeeCode.toLowerCase()) ||
        (r.name && q.employeeCode && r.name.includes(q.employeeCode))
    );

    const salesPerson = matchedRep ? matchedRep.name : q.employeeCode || 'พนักงานขาย';
    const key = `${year}-${month}-${salesPerson}`;

    if (!groups[key]) {
      groups[key] = { year, month, salesPerson, total: 0, count: 0 };
    }
    groups[key].total += q.quotedAmount;
    groups[key].count += 1;
  });

  const getQuarter = (m: MonthName): QuarterName => {
    const idx = monthNames.indexOf(m);
    if (idx < 3) return 'Q1';
    if (idx < 6) return 'Q2';
    if (idx < 9) return 'Q3';
    return 'Q4';
  };

  const records: SalesRecord[] = [];
  let rowId = 1;

  Object.values(groups).forEach((g) => {
    const monthNum = monthNames.indexOf(g.month) + 1;
    records.push({
      id: `quote-rec-${g.year}-${monthNum}-${rowId++}`,
      year: g.year,
      month: g.month,
      monthNum,
      salesPerson: g.salesPerson,
      salesMTO: g.total,
      salesFabric: 0,
      salesBedding: 0,
      salesTotal: g.total,
      quarter: getQuarter(g.month),
      orders: g.count,
    });
  });

  return records;
}
