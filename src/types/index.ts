export type MonthName =
  | 'January'
  | 'February'
  | 'March'
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December';

export type QuarterName = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface SalesRecord {
  id: string;
  year: number;
  month: MonthName;
  monthNum: number; // 1 - 12
  salesPerson: string; // 'รวมทั้งหมด' or sales rep name
  salesMTO: number;
  salesFabric: number;
  salesBedding: number;
  salesTotal: number;
  rank?: number;
  quarter: QuarterName;
  orders: number;
}

export interface SalesRep {
  id: string;
  code: string; // รหัสพนักงาน เช่น EMP-001
  name: string; // ชื่อพนักงาน
  nickname: string; // ชื่อเล่น
  avatarUrl: string; // รูปพนักงาน
  role: string;
  phone: string;
  email: string;
  branch: string;
  status: 'active' | 'inactive';
  joinedDate: string;
}

export interface MonthlyTarget {
  year: number;
  monthNum: number;
  monthName: MonthName;
  teamTarget: number;
  individualTargets: Record<string, number>; // repId -> target
}

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  visible: boolean;
  order: number;
  isCustom?: boolean;
  customDescription?: string;
}

export type FontTheme = 'cyan' | 'emerald' | 'amber' | 'blue' | 'purple' | 'slate';

export type ThemeMode = 'dark' | 'light';

export interface AppSettings {
  themeMode: ThemeMode;
  fontTheme: FontTheme;
  ytdCutoffMonth: number; // e.g. 9 for September
  autoCalculateYTD: boolean;
  companyName: string;
  currency: string;
  showAppLogo: boolean;
  appLogoUrl: string;
  logoSize?: 'sm' | 'md' | 'lg';
  logoDarkBacking?: boolean;
  logoInvertInDark?: boolean;
  waterDropletEffect?: boolean;
}

export interface YearlyOverviewRow {
  category:
    | 'total_sales'
    | 'mto_sales'
    | 'fabric_sales'
    | 'bedding_sales'
    | 'orders_count'
    | 'avg_ticket'
    | 'growth_yoy';
  label: string;
  months: Record<number, number | null>; // 1-12 -> value or null if future
  annualTotal: number;
  ytdTotal: number;
  quarters: Record<QuarterName, number>;
}

export interface GoogleSheetsConfig {
  sheetUrl: string;
  sheetName?: string;
  autoSync: boolean;
  syncIntervalSec: number;
  lastSyncTime: string | null;
  lastSyncStatus: 'idle' | 'success' | 'error' | 'syncing';
  lastSyncMessage: string;
  syncCount: number;
  syncedRowCount: number;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  type: 'google_sheets' | 'manual_csv' | 'reset';
  status: 'success' | 'error';
  message: string;
  rowCount?: number;
}

