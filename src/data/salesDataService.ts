import type {
  SalesRecord,
  SalesRep,
  MonthlyTarget,
  MonthName,
  QuarterName,
  SidebarMenuItem,
  AppSettings,
  GoogleSheetsConfig,
  SyncLogEntry,
} from '../types/index.ts';
import { RAW_CSV_DATA } from './rawCsv.ts';

export const MONTH_NAMES: MonthName[] = [
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
];

export const MONTH_SHORT_EN: Record<MonthName, string> = {
  January: 'JAN',
  February: 'FEB',
  March: 'MAR',
  April: 'APR',
  May: 'MAY',
  June: 'JUN',
  July: 'JUL',
  August: 'AUG',
  September: 'SEP',
  October: 'OCT',
  November: 'NOV',
  December: 'DEC',
};

export const MONTH_SHORT_TH: Record<MonthName, string> = {
  January: 'ม.ค.',
  February: 'ก.พ.',
  March: 'มี.ค.',
  April: 'เม.ย.',
  May: 'พ.ค.',
  June: 'มิ.ย.',
  July: 'ก.ค.',
  August: 'ส.ค.',
  September: 'ก.ย.',
  October: 'ต.ค.',
  November: 'พ.ย.',
  December: 'ธ.ค.',
};

export const MONTH_FULL_TH: Record<MonthName, string> = {
  January: 'มกราคม',
  February: 'กุมภาพันธ์',
  March: 'มีนาคม',
  April: 'เมษายน',
  May: 'พฤษภาคม',
  June: 'มิถุนายน',
  July: 'กรกฎาคม',
  August: 'สิงหาคม',
  September: 'กันยายน',
  October: 'ตุลาคม',
  November: 'พฤศจิกายน',
  December: 'ธันวาคม',
};

export function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function normalizeMonthName(input: string | undefined): MonthName | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();

  // English exact or prefix
  if (clean.startsWith('jan') || clean === '1' || clean === '01' || clean === 'มกราคม' || clean === 'ม.ค.') return 'January';
  if (clean.startsWith('feb') || clean === '2' || clean === '02' || clean === 'กุมภาพันธ์' || clean === 'ก.พ.') return 'February';
  if (clean.startsWith('mar') || clean === '3' || clean === '03' || clean === 'มีนาคม' || clean === 'มี.ค.') return 'March';
  if (clean.startsWith('apr') || clean === '4' || clean === '04' || clean === 'เมษายน' || clean === 'เม.ย.') return 'April';
  if (clean.startsWith('may') || clean === '5' || clean === '05' || clean === 'พฤษภาคม' || clean === 'พ.ค.') return 'May';
  if (clean.startsWith('jun') || clean === '6' || clean === '06' || clean === 'มิถุนายน' || clean === 'มิ.ย.') return 'June';
  if (clean.startsWith('jul') || clean === '7' || clean === '07' || clean === 'กรกฎาคม' || clean === 'ก.ค.') return 'July';
  if (clean.startsWith('aug') || clean === '8' || clean === '08' || clean === 'สิงหาคม' || clean === 'ส.ค.') return 'August';
  if (clean.startsWith('sep') || clean === '9' || clean === '09' || clean === 'กันยายน' || clean === 'ก.ย.') return 'September';
  if (clean.startsWith('oct') || clean === '10' || clean === 'ตุลาคม' || clean === 'ต.ค.') return 'October';
  if (clean.startsWith('nov') || clean === '11' || clean === 'พฤศจิกายน' || clean === 'พ.ย.') return 'November';
  if (clean.startsWith('dec') || clean === '12' || clean === 'ธันวาคม' || clean === 'ธ.ค.') return 'December';

  return null;
}

export function normalizeYearValue(input: number | string | undefined): number {
  if (!input) return 0;
  let year = typeof input === 'number' ? input : parseInt(String(input).replace(/[^0-9]/g, ''), 10);
  if (isNaN(year)) return 0;
  // Thai Buddhist Era (พ.ศ. e.g. 2566 -> 2023, 2567 -> 2024, 2568 -> 2025, 2569 -> 2026)
  if (year > 2400 && year < 2700) {
    year -= 543;
  } else if (year < 100) {
    year += 2000;
  }
  return year;
}

export function parseRawCsv(csvText: string): SalesRecord[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  // Parse header line to detect column layout
  const headerCols = parseCsvLine(lines[0]).map((c) => c.toLowerCase().trim());
  let yearIdx = 0;
  let monthIdx = 1;
  let repIdx = 2;
  let mtoIdx = 3;
  let fabricIdx = 4;
  let beddingIdx = 5;
  let totalIdx = 6;
  let rankIdx = 7;
  let quarterIdx = 8;
  let ordersIdx = 9;

  let hasCustomHeader = false;
  headerCols.forEach((col, idx) => {
    const c = col.toLowerCase().trim();
    if (c.includes('year') || c.includes('ปี') || c.includes('พ.ศ.') || c.includes('ค.ศ.')) {
      yearIdx = idx;
      hasCustomHeader = true;
    } else if (c.includes('month') || c.includes('เดือน')) {
      monthIdx = idx;
      hasCustomHeader = true;
    } else if (c.includes('person') || c.includes('rep') || c.includes('พนักงาน') || c.includes('ชื่อ') || c.includes('เซลส์')) {
      repIdx = idx;
      hasCustomHeader = true;
    } else if (c.includes('bedding') || c.includes('เตียง') || c.includes('ผ้าปู') || c.includes('เครื่องนอน')) {
      // Must check bedding/bed before fabric ('ผ้า') because 'ผ้าปู' contains 'ผ้า'
      beddingIdx = idx;
      hasCustomHeader = true;
    } else if (c.includes('fabric') || (c.includes('ผ้า') && !c.includes('ผ้าปู') && !c.includes('ม่าน'))) {
      fabricIdx = idx;
      hasCustomHeader = true;
    } else if (c.includes('mto') || c.includes('ม่าน') || c.includes('curtain')) {
      mtoIdx = idx;
      hasCustomHeader = true;
    } else if (c.includes('ยอดขายรวม') || c.includes('ยอดรวม') || c.includes('รวมทั้งสิ้น') || c.includes('total') || c.includes('grand total') || (c.includes('รวม') && !c.includes('ม่าน') && !c.includes('ผ้า'))) {
      totalIdx = idx;
      hasCustomHeader = true;
    } else if (c.includes('rank') || c.includes('อันดับ')) {
      rankIdx = idx;
    } else if (c.includes('quarter') || c.includes('ไตรมาส') || c.includes('qtr')) {
      quarterIdx = idx;
    } else if (c.includes('order') || c.includes('ออเดอร์') || c.includes('คำสั่งซื้อ') || c.includes('งาน')) {
      ordersIdx = idx;
    }
  });

  const startIndex = hasCustomHeader ? 1 : 1;
  const records: SalesRecord[] = [];

  const cleanNum = (val: string | undefined): number => {
    if (!val) return 0;
    // Remove NBSP, whitespace, carriage returns, commas, currency symbols
    let stripped = val
      .replace(/[\u00A0\r\n\t ]/g, '')
      .replace(/,/g, '')
      .replace(/฿|THB|\$/gi, '')
      .replace(/"|'/g, '')
      .trim();
    if (!stripped) return 0;
    // Accounting parentheses: (123) -> -123
    if (stripped.startsWith('(') && stripped.endsWith(')')) {
      stripped = '-' + stripped.slice(1, -1);
    }
    const n = parseFloat(stripped);
    return isNaN(n) ? 0 : n;
  };

  for (let i = startIndex; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 3) continue;

    const rawYear = cols[yearIdx];
    const year = normalizeYearValue(rawYear);
    const month = normalizeMonthName(cols[monthIdx]);
    let salesPerson = (cols[repIdx] || '').trim();

    if (!year || !month || !salesPerson) continue;

    // Normalize summary row naming
    const cleanPerson = salesPerson.toLowerCase();
    if (
      cleanPerson === 'รวมทั้งหมด' ||
      cleanPerson === 'รวม' ||
      cleanPerson === 'ยอดรวม' ||
      cleanPerson === 'รวมทั้งสิ้น' ||
      cleanPerson === 'total' ||
      cleanPerson === 'grand total' ||
      cleanPerson === 'summary'
    ) {
      salesPerson = 'รวมทั้งหมด';
    }

    const salesMTO = cleanNum(cols[mtoIdx]);
    const salesFabric = cleanNum(cols[fabricIdx]);
    const salesBedding = cleanNum(cols[beddingIdx]);
    const componentSum = salesMTO + salesFabric + salesBedding;
    let salesTotal = cleanNum(cols[totalIdx]);

    // Ensure total is never lower than the sum of its explicit product components
    if (salesTotal === 0 && componentSum > 0) {
      salesTotal = componentSum;
    } else if (componentSum > salesTotal && salesTotal > 0) {
      salesTotal = componentSum;
    }

    const rankVal = cols[rankIdx] ? parseInt(cols[rankIdx].replace(/[^0-9]/g, ''), 10) : undefined;
    const rawQuarter = (cols[quarterIdx] || '').toUpperCase();
    const quarter = (['Q1', 'Q2', 'Q3', 'Q4'].includes(rawQuarter) ? rawQuarter : getQuarterFromMonth(month)) as QuarterName;
    const orders = cleanNum(cols[ordersIdx]);
    const monthNum = MONTH_NAMES.indexOf(month) + 1;

    records.push({
      id: `${year}-${monthNum}-${salesPerson}-${i}`,
      year,
      month,
      monthNum: monthNum > 0 ? monthNum : 1,
      salesPerson,
      salesMTO,
      salesFabric,
      salesBedding,
      salesTotal,
      rank: isNaN(rankVal as number) ? undefined : rankVal,
      quarter,
      orders,
    });
  }

  return records;
}

// Auto-detect and reconcile sales reps from records
export function extractUniqueRepsFromRecords(records: SalesRecord[], existingReps: SalesRep[]): SalesRep[] {
  const existingNames = new Set(existingReps.map((r) => r.name.trim()));
  const existingNicknames = new Set(existingReps.map((r) => r.nickname?.trim() || ''));

  const newReps: SalesRep[] = [];
  const presetAvatars = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
  ];

  const uniqueNames = Array.from(new Set(records.map((r) => r.salesPerson.trim())));

  uniqueNames.forEach((name) => {
    if (!name || name === 'รวมทั้งหมด' || name === 'ยอดขายรวม' || name.toLowerCase().includes('total')) return;
    if (existingNames.has(name)) return;

    // Extract nickname from parentheses e.g. "ภัทรธิดา (หมวย) สุภรพงษ์" -> "หมวย"
    const nickMatch = name.match(/\(([^)]+)\)/);
    const nickname = nickMatch ? nickMatch[1].trim() : name.split(' ')[0];

    const count = existingReps.length + newReps.length + 1;
    const newId = `EMP-${String(count).padStart(3, '0')}`;
    const code = `PSY-${String(100 + count).padStart(4, '0')}`;
    const avatarUrl = presetAvatars[(count - 1) % presetAvatars.length];

    const rep: SalesRep = {
      id: newId,
      code,
      name,
      nickname,
      avatarUrl,
      role: 'Curtain & Sales Specialist',
      phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `${nickname.toLowerCase() || 'sales'}.psy@pasaya.com`,
      branch: 'Curtain Center',
      status: 'active',
      joinedDate: '2023-01-01',
    };

    newReps.push(rep);
    existingNames.add(name);
  });

  return [...existingReps, ...newReps];
}

export function getQuarterFromMonth(month: MonthName): QuarterName {
  const idx = MONTH_NAMES.indexOf(month);
  if (idx < 3) return 'Q1';
  if (idx < 6) return 'Q2';
  if (idx < 9) return 'Q3';
  return 'Q4';
}

// Initial Sales Representatives (Configured PASAYA Curtain Center Team)
export const INITIAL_SALES_REPS: SalesRep[] = [
  {
    id: 'EMP-001',
    code: 'T46160',
    name: 'ภัทยา (ปอนด์) นาแพงเมือง',
    nickname: 'ปอนด์',
    avatarUrl: '/avatars/EMP-001.jpg',
    role: 'Sales Representative',
    phone: '',
    email: 'patthaya.n@pasaya.com',
    branch: 'Curtain Center',
    status: 'active',
    joinedDate: '2023-01-15',
  },
  {
    id: 'EMP-002',
    code: 'T62023',
    name: 'สุเทพ (เทพ) ดำศรี',
    nickname: 'เทพ',
    avatarUrl: '/avatars/EMP-002.jpg',
    role: 'Senior Sales Representative',
    phone: '',
    email: 'suthep.d@pasaya.com',
    branch: 'Curtain Center',
    status: 'active',
    joinedDate: '2023-02-01',
  },
  {
    id: 'EMP-003',
    code: 'T66084',
    name: 'ฐิติญา (ออย) ชัยรถ',
    nickname: 'ออย',
    avatarUrl: '/avatars/EMP-003.jpg',
    role: 'Sales Representative',
    phone: '',
    email: 'thitiya.c@pasaya.com',
    branch: 'Curtain Center',
    status: 'active',
    joinedDate: '2023-03-10',
  },
  {
    id: 'EMP-004',
    code: 'T65099',
    name: 'ณาตฏิกา (ณาต) กุมารสิทธิ์',
    nickname: 'ณาต',
    avatarUrl: '/avatars/EMP-004.jpg',
    role: 'Sales Representative',
    phone: '',
    email: 'nattika.k@pasaya.com',
    branch: 'Curtain Center',
    status: 'active',
    joinedDate: '2023-04-12',
  },
  {
    id: 'EMP-005',
    code: 'T66112',
    name: 'ธนัท (ตี้) จิรเศวตโชติ',
    nickname: 'ตี้',
    avatarUrl: '/avatars/EMP-005.jpg',
    role: 'Sales Representative',
    phone: '',
    email: 'thanat.j@pasaya.com',
    branch: 'Curtain Center',
    status: 'active',
    joinedDate: '2023-05-18',
  },
  {
    id: 'EMP-006',
    code: 'T67054',
    name: 'ธัญญ์ชยา (ตูน) ธนาศิริทิพย์',
    nickname: 'ตูน',
    avatarUrl: '/avatars/EMP-006.jpg',
    role: 'Sales Representative',
    phone: '',
    email: 'thanchaya.t@pasaya.com',
    branch: 'Curtain Center',
    status: 'active',
    joinedDate: '2023-06-01',
  },
  {
    id: 'EMP-007',
    code: 'T68036',
    name: 'ณัฐกฤตา (พู่กัน) แท่งทอง',
    nickname: 'พู่กัน',
    avatarUrl: '/avatars/EMP-007.jpg',
    role: 'Sales Representative',
    phone: '',
    email: 'nattakritta.t@pasaya.com',
    branch: 'Curtain Center',
    status: 'active',
    joinedDate: '2024-01-10',
  },
  {
    id: 'EMP-008',
    code: 'T69005',
    name: 'อำนาจ (เค) แซ่โง้ว',
    nickname: 'เค',
    avatarUrl: '/avatars/EMP-008.jpg',
    role: 'Sales Representative',
    phone: '',
    email: 'amnat.s@pasaya.com',
    branch: 'Curtain Center',
    status: 'active',
    joinedDate: '2024-02-15',
  },
  {
    id: 'EMP-009',
    code: 'T63084',
    name: 'มนัสสิทธิ์ (นพส์) โชคสุนทรนิธิ',
    nickname: 'นพส์',
    avatarUrl: '/avatars/EMP-009.png',
    role: 'Senior Sales Representative',
    phone: '',
    email: 'manassit.c@pasaya.com',
    branch: 'Curtain Center',
    status: 'inactive',
    joinedDate: '2023-01-01',
  },
  {
    id: 'EMP-010',
    code: 'T65089',
    name: 'จันทกานต์ (เจมี่) แทนทรัพย์',
    nickname: 'เจมี่',
    avatarUrl: '/avatars/EMP-010.png',
    role: 'Sales Representative',
    phone: '',
    email: 'jantakarn.t@pasaya.com',
    branch: 'Curtain Center',
    status: 'inactive',
    joinedDate: '2023-01-01',
  },
  {
    id: 'EMP-011',
    code: 'T68062',
    name: 'ภัทรธิดา (หมวย) สุภรพงษ์',
    nickname: 'หมวย',
    avatarUrl: '/avatars/EMP-011.png',
    role: 'Sales Representative',
    phone: '',
    email: 'patthida.s@pasaya.com',
    branch: 'Curtain Center',
    status: 'inactive',
    joinedDate: '2025-08-01',
  },
  {
    id: 'EMP-012',
    code: 'T68016',
    name: 'อภิชาติ (เจ) ทองแย้ม',
    nickname: 'เจ',
    avatarUrl: '/avatars/EMP-012.png',
    role: 'Sales Representative',
    phone: '',
    email: 'aphichat.t@pasaya.com',
    branch: 'Curtain Center',
    status: 'inactive',
    joinedDate: '2025-06-01',
  },
];

// Initial Monthly Targets
export function generateInitialTargets(): MonthlyTarget[] {
  const targets: MonthlyTarget[] = [];
  const years = [2026, 2025, 2024, 2023];

  for (const year of years) {
    for (let m = 1; m <= 12; m++) {
      const monthName = MONTH_NAMES[m - 1];
      // Team monthly target defaults around 5.0 - 5.5 million
      let teamTarget = 5200000;
      if (year === 2026) teamTarget = 5500000;
      if (year === 2024) teamTarget = 5000000;
      if (year === 2023) teamTarget = 4800000;

      // Special quarter targets
      if (m === 8 || m === 11) teamTarget += 500000; // high season
      if (m === 6 || m === 4) teamTarget -= 300000;

      const individualTargets: Record<string, number> = {};
      INITIAL_SALES_REPS.filter((r) => r.status === 'active').forEach((rep) => {
        individualTargets[rep.id] = Math.round(teamTarget / 7 / 10000) * 10000;
      });

      targets.push({
        year,
        monthNum: m,
        monthName,
        teamTarget,
        individualTargets,
      });
    }
  }
  return targets;
}

// Initial Sidebar Menu Items
export const INITIAL_SIDEBAR_ITEMS: SidebarMenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard ภาพรวม & Lead',
    icon: 'LayoutDashboard',
    visible: true,
    order: 1,
  },
  {
    id: 'lead-followup',
    label: 'Lead & Follow-up Report',
    icon: 'Users',
    visible: true,
    order: 2,
  },
  {
    id: 'sales-performance',
    label: 'Sales Performance',
    icon: 'TrendingUp',
    visible: true,
    order: 3,
  },
  {
    id: 'measurement-report',
    label: 'Measurement Scheduling',
    icon: 'Calendar',
    visible: true,
    order: 4,
  },
  {
    id: 'target-achievement',
    label: 'Target vs Achievement',
    icon: 'Target',
    visible: true,
    order: 5,
  },
  {
    id: 'conversion-rate',
    label: 'Conversion Rate',
    icon: 'Percent',
    visible: true,
    order: 6,
  },
  {
    id: 'claim-report',
    label: 'Claim Issue Report',
    icon: 'AlertTriangle',
    visible: true,
    order: 7,
  },
  {
    id: 'progress-of-sales',
    label: 'Progress of Sales',
    icon: 'Award',
    visible: true,
    order: 8,
  },
  {
    id: 'data-sheet',
    label: 'ชีทข้อมูล 7 รายงาน (Data)',
    icon: 'FileSpreadsheet',
    visible: true,
    order: 9,
  },
  {
    id: 'sales-reps',
    label: 'อันดับผลงานทีมขาย',
    icon: 'Award',
    visible: true,
    order: 10,
  },
  {
    id: 'overview',
    label: 'Overview ตารางสรุปเดิม',
    icon: 'FileText',
    visible: true,
    order: 11,
  },
  {
    id: 'analytics',
    label: 'กราฟวิเคราะห์สินค้า',
    icon: 'TrendingUp',
    visible: true,
    order: 12,
  },
  {
    id: 'team-targets',
    label: 'จัดการเป้าหมาย (KPI)',
    icon: 'Target',
    visible: true,
    order: 13,
  },
  {
    id: 'manage-reps',
    label: 'จัดการพนักงานขาย',
    icon: 'Users',
    visible: true,
    order: 14,
  },
  {
    id: 'manage-sidebar',
    label: 'จัดการหน้าเมนู Sidebar',
    icon: 'Menu',
    visible: true,
    order: 15,
  },
  {
    id: 'settings',
    label: 'ตั้งค่า & ปรับสี Font',
    icon: 'Settings',
    visible: true,
    order: 16,
  },
];

// App Default Settings
export const DEFAULT_APP_SETTINGS: AppSettings = {
  themeMode: 'dark',
  fontTheme: 'cyan',
  ytdCutoffMonth: 9, // September cutoff per prompt requirement
  autoCalculateYTD: false,
  companyName: 'PASAYA Curtain Center',
  currency: '฿',
  showAppLogo: true,
  appLogoUrl: '',
  logoSize: 'md',
  logoDarkBacking: true, // Show frosted light backing in dark mode by default so black logos are visible
  logoInvertInDark: false,
  waterDropletEffect: true, // Realistic liquid glass water droplet cursor
};

export const DEFAULT_GOOGLE_SHEETS_CONFIG: GoogleSheetsConfig = {
  sheetUrl: '',
  sheetName: '',
  autoSync: true,
  syncIntervalSec: 30,
  lastSyncTime: null,
  lastSyncStatus: 'idle',
  lastSyncMessage: 'พร้อมเชื่อมต่อ Google Sheets',
  syncCount: 0,
  syncedRowCount: 0,
};

// Re-export 7 Google Sheets schema types and parsers
export * from '../types/sheetSchemas';
export * from './multiSheetParser';


