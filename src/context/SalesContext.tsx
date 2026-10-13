import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  SalesRecord,
  SalesRep,
  MonthlyTarget,
  SidebarMenuItem,
  AppSettings,
  MonthName,
  QuarterName,
  GoogleSheetsConfig,
  SyncLogEntry,
} from '../types';
import { RAW_CSV_DATA } from '../data/rawCsv';
import {
  parseRawCsv,
  INITIAL_SALES_REPS,
  generateInitialTargets,
  INITIAL_SIDEBAR_ITEMS,
  DEFAULT_APP_SETTINGS,
  DEFAULT_GOOGLE_SHEETS_CONFIG,
  MONTH_NAMES,
  extractUniqueRepsFromRecords,
} from '../data/salesDataService';

interface MonthDetailPopup {
  year: number;
  monthNum: number;
  monthName: MonthName;
}

export interface YearOverviewStats {
  year: number;
  mto: Record<number, number>;
  fabric: Record<number, number>;
  bedding: Record<number, number>;
  total: Record<number, number>;
  orders: Record<number, number>;
  avgTicket: Record<number, number>;
  growthYoY: Record<number, number | null>;
  // Totals
  annualMTO: number;
  annualFabric: number;
  annualBedding: number;
  annualTotal: number;
  annualOrders: number;
  annualAvgTicket: number;
  annualGrowthYoY: number | null;
  // YTD
  ytdMTO: number;
  ytdFabric: number;
  ytdBedding: number;
  ytdTotal: number;
  ytdOrders: number;
  ytdAvgTicket: number;
  ytdGrowthYoY: number | null;
  // Quarters
  quarterMTO: Record<QuarterName, number>;
  quarterFabric: Record<QuarterName, number>;
  quarterBedding: Record<QuarterName, number>;
  quarterTotal: Record<QuarterName, number>;
  quarterOrders: Record<QuarterName, number>;
  quarterAvgTicket: Record<QuarterName, number>;
  quarterGrowthYoY: Record<QuarterName, number | null>;
}

interface SalesContextType {
  records: SalesRecord[];
  salesReps: SalesRep[];
  targets: MonthlyTarget[];
  sidebarItems: SidebarMenuItem[];
  settings: AppSettings;
  sheetsConfig: GoogleSheetsConfig;
  syncLogs: SyncLogEntry[];
  isRealtimeConnected: boolean;
  isSyncingSheets: boolean;
  isSyncModalOpen: boolean;
  activePage: string;
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  selectedMonthDetail: MonthDetailPopup | null;
  yearlyOverviewData: YearOverviewStats[];
  uniqueYears: number[];
  // Actions
  setActivePage: (pageId: string) => void;
  toggleSidebar: () => void;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setIsSyncModalOpen: (open: boolean) => void;
  setSelectedMonthDetail: (detail: MonthDetailPopup | null) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  toggleThemeMode: () => void;
  // Sales Rep actions
  addSalesRep: (rep: Omit<SalesRep, 'id'>) => void;
  updateSalesRep: (id: string, rep: Partial<SalesRep>) => void;
  deleteSalesRep: (id: string) => void;
  reconcileRepsFromRecords: () => Promise<{ success: boolean; message: string; count?: number }>;
  exportRepsJson: () => string;
  importRepsJson: (jsonString: string) => { success: boolean; message: string; count?: number };
  // Target actions
  updateMonthlyTarget: (year: number, monthNum: number, teamTarget: number) => void;
  updateIndividualTarget: (year: number, monthNum: number, repId: string, amount: number) => void;
  // Sidebar actions
  addSidebarItem: (item: Omit<SidebarMenuItem, 'id' | 'order'>) => void;
  toggleSidebarItemVisibility: (id: string) => void;
  reorderSidebarItems: (sourceIndex: number, destinationIndex: number) => void;
  deleteSidebarItem: (id: string) => void;
  // CSV & Sheets Data actions
  importCsv: (csvContent: string) => boolean;
  triggerGoogleSheetsSync: () => Promise<{ success: boolean; message: string; rowCount?: number }>;
  updateGoogleSheetsConfig: (newConfig: Partial<GoogleSheetsConfig>) => Promise<void>;
  resetAllData: () => void;
}

const SalesContext = createContext<SalesContextType | null>(null);

const STORAGE_KEYS = {
  RECORDS: 'pasaya_sales_records_v1',
  REPS: 'pasaya_sales_reps_v1',
  TARGETS: 'pasaya_sales_targets_v1',
  SIDEBAR: 'pasaya_sidebar_items_v1',
  SETTINGS: 'pasaya_app_settings_v1',
  SHEETS: 'pasaya_sheets_config_v1',
};

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from local cache or seed defaults
  const [records, setRecords] = useState<SalesRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading records cache', e);
    }
    return parseRawCsv(RAW_CSV_DATA);
  });

  const [salesReps, setSalesReps] = useState<SalesRep[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REPS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading reps cache', e);
    }
    return INITIAL_SALES_REPS;
  });

  const [targets, setTargets] = useState<MonthlyTarget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TARGETS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading targets cache', e);
    }
    return generateInitialTargets();
  });

  const [sidebarItems, setSidebarItems] = useState<SidebarMenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading sidebar cache', e);
    }
    return INITIAL_SIDEBAR_ITEMS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Error reading settings cache', e);
    }
    return DEFAULT_APP_SETTINGS;
  });

  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHEETS);
      if (saved) return { ...DEFAULT_GOOGLE_SHEETS_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Error reading sheets cache', e);
    }
    return DEFAULT_GOOGLE_SHEETS_CONFIG;
  });

  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  const [activePage, setActivePage] = useState<string>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [selectedMonthDetail, setSelectedMonthDetail] = useState<MonthDetailPopup | null>(null);

  // Sync to local storage for instant offline access
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch (e) {
      console.error(e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REPS, JSON.stringify(salesReps));
    } catch (e) {
      console.error(e);
    }
  }, [salesReps]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify(targets));
    } catch (e) {
      console.error(e);
    }
  }, [targets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR, JSON.stringify(sidebarItems));
    } catch (e) {
      console.error(e);
    }
  }, [sidebarItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHEETS, JSON.stringify(sheetsConfig));
    } catch (e) {
      console.error(e);
    }
  }, [sheetsConfig]);

  // Initial fetch from central database to ensure immediate consistency
  useEffect(() => {
    fetch('/api/data')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.records) setRecords(data.records);
        if (data.salesReps && Array.isArray(data.salesReps)) {
          setSalesReps((prevLocal) => {
            const serverIds = new Set(data.salesReps.map((r: SalesRep) => r.id));
            const serverNames = new Set(data.salesReps.map((r: SalesRep) => r.name.trim()));
            const extraLocal = prevLocal.filter(
              (r) => !serverIds.has(r.id) && !serverNames.has(r.name.trim())
            );
            if (extraLocal.length > 0) {
              const merged = [...data.salesReps, ...extraLocal];
              // Persist merged reps to server
              fetch('/api/reps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ salesReps: merged }),
              }).catch((e) => console.warn(e));
              return merged;
            }
            return data.salesReps;
          });
        }
        if (data.targets) setTargets(data.targets);
        if (data.sidebarItems) setSidebarItems(data.sidebarItems);
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
        if (data.sheetsConfig) setSheetsConfig(data.sheetsConfig);
        if (data.syncLogs) setSyncLogs(data.syncLogs);
        setIsRealtimeConnected(true);
      })
      .catch((err) => {
        console.warn('Initial server fetch skipped or server starting:', err);
      });

    // Check if opened with a team share link e.g. ?sheetUrl=https%3A%2F%2Fdocs.google.com...
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const searchParams = new URLSearchParams(window.location.search);
        const sharedUrl = searchParams.get('sheetUrl') || searchParams.get('sheet');
        if (sharedUrl) {
          const decoded = decodeURIComponent(sharedUrl).trim();
          if (decoded.startsWith('http') || decoded.length > 20) {
            setSheetsConfig((prev) => ({
              ...prev,
              sheetUrl: decoded,
              autoSync: true,
            }));
            fetch('/api/sheets/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sheetUrl: decoded, autoSync: true }),
            }).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn('Error reading share link parameter:', e);
    }
  }, []);

  // Connect to SSE Realtime Stream: Realtime sync across all users and Google Sheets
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        es = new EventSource('/api/realtime/stream');

        es.onopen = () => {
          setIsRealtimeConnected(true);
        };

        es.addEventListener('initial_state', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.records) setRecords(data.records);
            if (data.salesReps) setSalesReps(data.salesReps);
            if (data.targets) setTargets(data.targets);
            if (data.sidebarItems) setSidebarItems(data.sidebarItems);
            if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
            if (data.sheetsConfig) setSheetsConfig(data.sheetsConfig);
            if (data.syncLogs) setSyncLogs(data.syncLogs);
            setIsRealtimeConnected(true);
          } catch (err) {
            console.error('SSE initial_state parse error:', err);
          }
        });

        es.addEventListener('data_update', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.records) setRecords(data.records);
            if (data.salesReps) setSalesReps(data.salesReps);
            if (data.targets) setTargets(data.targets);
            if (data.sidebarItems) setSidebarItems(data.sidebarItems);
            if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
            if (data.sheetsConfig) setSheetsConfig(data.sheetsConfig);
            if (data.syncLogs) setSyncLogs(data.syncLogs);
          } catch (err) {
            console.error('SSE data_update parse error:', err);
          }
        });

        es.addEventListener('sheets_status_update', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.sheetsConfig) setSheetsConfig(data.sheetsConfig);
            if (data.syncLogs) setSyncLogs(data.syncLogs);
            if (data.sheetsConfig?.lastSyncStatus === 'syncing') {
              setIsSyncingSheets(true);
            } else {
              setIsSyncingSheets(false);
            }
          } catch (err) {
            console.error('SSE sheets_status_update error:', err);
          }
        });

        es.onerror = () => {
          setIsRealtimeConnected(false);
          es?.close();
          reconnectTimer = setTimeout(connectSSE, 3000);
        };
      } catch (err) {
        console.warn('SSE creation error:', err);
        reconnectTimer = setTimeout(connectSSE, 4000);
      }
    };

    connectSSE();

    return () => {
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  // Unique years sorted from newest to oldest
  const uniqueYears = useMemo(() => {
    const yearsSet = new Set<number>();
    records.forEach((r) => yearsSet.add(r.year));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [records]);

  // Compute Year Overview Table Data
  const yearlyOverviewData = useMemo<YearOverviewStats[]>(() => {
    const cutoff = settings.ytdCutoffMonth || 9;

    // Helper map: year -> monthNum (1-12) -> aggregate record
    const yearMonthTotals: Record<
      number,
      Record<
        number,
        {
          mto: number;
          fabric: number;
          bedding: number;
          total: number;
          orders: number;
        }
      >
    > = {};

    uniqueYears.forEach((y) => {
      yearMonthTotals[y] = {};
      for (let m = 1; m <= 12; m++) {
        yearMonthTotals[y][m] = { mto: 0, fabric: 0, bedding: 0, total: 0, orders: 0 };
      }
    });

    records.forEach((r) => {
      if (!yearMonthTotals[r.year]) return;
      if (r.salesPerson === 'รวมทั้งหมด') {
        // Direct summary row
        yearMonthTotals[r.year][r.monthNum] = {
          mto: r.salesMTO,
          fabric: r.salesFabric,
          bedding: r.salesBedding,
          total: r.salesTotal,
          orders: r.orders,
        };
      }
    });

    // Check individual sales reps sums and reconcile with summary row
    uniqueYears.forEach((y) => {
      for (let m = 1; m <= 12; m++) {
        const cur = yearMonthTotals[y][m];
        const repRows = records.filter(
          (r) => r.year === y && r.monthNum === m && r.salesPerson !== 'รวมทั้งหมด'
        );
        if (repRows.length > 0) {
          let mtoSum = 0;
          let fabSum = 0;
          let bedSum = 0;
          let totSum = 0;
          let ordSum = 0;
          repRows.forEach((row) => {
            mtoSum += row.salesMTO;
            fabSum += row.salesFabric;
            bedSum += row.salesBedding;
            totSum += row.salesTotal;
            ordSum += row.orders;
          });

          if (cur.total === 0 || totSum > cur.total) {
            yearMonthTotals[y][m] = {
              mto: Math.max(cur.mto, mtoSum),
              fabric: Math.max(cur.fabric, fabSum),
              bedding: Math.max(cur.bedding, bedSum),
              total: Math.max(cur.total, totSum),
              orders: Math.max(cur.orders, ordSum),
            };
          }
        }
      }
    });

    // Compute YoY growth and stats per year
    const result: YearOverviewStats[] = [];

    uniqueYears.forEach((year) => {
      const prevYear = year - 1;
      const prevYearData = yearMonthTotals[prevYear];

      const mto: Record<number, number> = {};
      const fabric: Record<number, number> = {};
      const bedding: Record<number, number> = {};
      const total: Record<number, number> = {};
      const orders: Record<number, number> = {};
      const avgTicket: Record<number, number> = {};
      const growthYoY: Record<number, number | null> = {};

      let annualMTO = 0;
      let annualFabric = 0;
      let annualBedding = 0;
      let annualTotal = 0;
      let annualOrders = 0;

      let ytdMTO = 0;
      let ytdFabric = 0;
      let ytdBedding = 0;
      let ytdTotal = 0;
      let ytdOrders = 0;

      const quarterMTO: Record<QuarterName, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      const quarterFabric: Record<QuarterName, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      const quarterBedding: Record<QuarterName, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      const quarterTotal: Record<QuarterName, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      const quarterOrders: Record<QuarterName, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

      for (let m = 1; m <= 12; m++) {
        const cur = yearMonthTotals[year][m];
        mto[m] = cur.mto;
        fabric[m] = cur.fabric;
        bedding[m] = cur.bedding;
        total[m] = cur.total;
        orders[m] = cur.orders;
        avgTicket[m] = cur.orders > 0 ? Math.round(cur.mto / cur.orders) : 0;

        // YoY growth for this month
        if (prevYearData && prevYearData[m] && prevYearData[m].total > 0 && cur.total > 0) {
          growthYoY[m] = ((cur.total - prevYearData[m].total) / prevYearData[m].total) * 100;
        } else {
          growthYoY[m] = null;
        }

        // Annual sums
        annualMTO += cur.mto;
        annualFabric += cur.fabric;
        annualBedding += cur.bedding;
        annualTotal += cur.total;
        annualOrders += cur.orders;

        // YTD sums
        if (m <= cutoff) {
          ytdMTO += cur.mto;
          ytdFabric += cur.fabric;
          ytdBedding += cur.bedding;
          ytdTotal += cur.total;
          ytdOrders += cur.orders;
        }

        // Quarter sums
        let q: QuarterName = 'Q1';
        if (m >= 4 && m <= 6) q = 'Q2';
        else if (m >= 7 && m <= 9) q = 'Q3';
        else if (m >= 10 && m <= 12) q = 'Q4';

        quarterMTO[q] += cur.mto;
        quarterFabric[q] += cur.fabric;
        quarterBedding[q] += cur.bedding;
        quarterTotal[q] += cur.total;
        quarterOrders[q] += cur.orders;
      }

      const annualAvgTicket =
        annualOrders > 0 ? Math.round(annualMTO / annualOrders) : 0;
      const ytdAvgTicket = ytdOrders > 0 ? Math.round(ytdMTO / ytdOrders) : 0;

      // Annual & YTD YoY Growth
      let annualGrowthYoY: number | null = null;
      let ytdGrowthYoY: number | null = null;

      if (prevYearData) {
        let prevAnnualTotal = 0;
        let prevYtdTotal = 0;
        for (let m = 1; m <= 12; m++) {
          prevAnnualTotal += prevYearData[m].total;
          if (m <= cutoff) {
            prevYtdTotal += prevYearData[m].total;
          }
        }
        if (prevAnnualTotal > 0 && annualTotal > 0) {
          annualGrowthYoY = ((annualTotal - prevAnnualTotal) / prevAnnualTotal) * 100;
        }
        if (prevYtdTotal > 0 && ytdTotal > 0) {
          ytdGrowthYoY = ((ytdTotal - prevYtdTotal) / prevYtdTotal) * 100;
        }
      }

      // Quarter avg tickets and YoY
      const quarterAvgTicket: Record<QuarterName, number> = {
        Q1: quarterOrders.Q1 > 0 ? Math.round(quarterMTO.Q1 / quarterOrders.Q1) : 0,
        Q2: quarterOrders.Q2 > 0 ? Math.round(quarterMTO.Q2 / quarterOrders.Q2) : 0,
        Q3: quarterOrders.Q3 > 0 ? Math.round(quarterMTO.Q3 / quarterOrders.Q3) : 0,
        Q4: quarterOrders.Q4 > 0 ? Math.round(quarterMTO.Q4 / quarterOrders.Q4) : 0,
      };

      const quarterGrowthYoY: Record<QuarterName, number | null> = {
        Q1: null,
        Q2: null,
        Q3: null,
        Q4: null,
      };

      if (prevYearData) {
        const prevQTotals: Record<QuarterName, number> = {
          Q1: prevYearData[1].total + prevYearData[2].total + prevYearData[3].total,
          Q2: prevYearData[4].total + prevYearData[5].total + prevYearData[6].total,
          Q3: prevYearData[7].total + prevYearData[8].total + prevYearData[9].total,
          Q4: prevYearData[10].total + prevYearData[11].total + prevYearData[12].total,
        };
        (['Q1', 'Q2', 'Q3', 'Q4'] as QuarterName[]).forEach((qKey) => {
          if (prevQTotals[qKey] > 0 && quarterTotal[qKey] > 0) {
            quarterGrowthYoY[qKey] =
              ((quarterTotal[qKey] - prevQTotals[qKey]) / prevQTotals[qKey]) * 100;
          }
        });
      }

      result.push({
        year,
        mto,
        fabric,
        bedding,
        total,
        orders,
        avgTicket,
        growthYoY,
        annualMTO,
        annualFabric,
        annualBedding,
        annualTotal,
        annualOrders,
        annualAvgTicket,
        annualGrowthYoY,
        ytdMTO,
        ytdFabric,
        ytdBedding,
        ytdTotal,
        ytdOrders,
        ytdAvgTicket,
        ytdGrowthYoY,
        quarterMTO,
        quarterFabric,
        quarterBedding,
        quarterTotal,
        quarterOrders,
        quarterAvgTicket,
        quarterGrowthYoY,
      });
    });

    return result;
  }, [records, uniqueYears, settings.ytdCutoffMonth]);

  // Actions
  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev);

  const toggleThemeMode = () => {
    const newMode = settings.themeMode === 'light' ? 'dark' : 'light';
    updateSettings({ themeMode: newMode });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: merged }),
      }).catch((e) => console.warn('Failed to sync settings with server:', e));
      return merged;
    });
  };

  const addSalesRep = (repData: Omit<SalesRep, 'id'>) => {
    const newId = `EMP-${String(salesReps.length + 1).padStart(3, '0')}`;
    const newRep: SalesRep = { ...repData, id: newId };
    const updated = [newRep, ...salesReps];
    setSalesReps(updated);
    fetch('/api/reps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salesReps: updated }),
    }).catch((e) => console.warn('Failed to sync reps with server:', e));
  };

  const updateSalesRep = (id: string, repData: Partial<SalesRep>) => {
    const updated = salesReps.map((r) => (r.id === id ? { ...r, ...repData } : r));
    setSalesReps(updated);
    fetch('/api/reps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salesReps: updated }),
    }).catch((e) => console.warn('Failed to sync reps with server:', e));
  };

  const deleteSalesRep = (id: string) => {
    const updated = salesReps.filter((r) => r.id !== id);
    setSalesReps(updated);
    fetch('/api/reps/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch((e) => console.warn('Failed to delete rep on server:', e));
  };

  const reconcileRepsFromRecords = async () => {
    try {
      const res = await fetch('/api/reps/reconcile', { method: 'POST' });
      const data = await res.json();
      if (data.salesReps) {
        setSalesReps(data.salesReps);
        return {
          success: true,
          count: data.count,
          message: `กู้คืนและซิงค์รายชื่อพนักงานจากข้อมูลยอดขายสำเร็จ (${data.count} คน)`,
        };
      }
      return { success: false, message: 'ไม่สามารถกู้คืนรายชื่อพนักงานได้' };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
      };
    }
  };

  const exportRepsJson = () => {
    return JSON.stringify(salesReps, null, 2);
  };

  const importRepsJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSalesReps(parsed);
        fetch('/api/reps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salesReps: parsed }),
        }).catch((e) => console.warn('Failed to sync imported reps with server:', e));
        return {
          success: true,
          count: parsed.length,
          message: `นำเข้าข้อมูลพนักงานสำเร็จ (${parsed.length} คน)`,
        };
      }
      return { success: false, message: 'รูปแบบไฟล์ JSON ข้อมูลพนักงานไม่ถูกต้อง' };
    } catch (err) {
      return { success: false, message: 'เกิดข้อผิดพลาดในการอ่านไฟล์ JSON' };
    }
  };

  const updateMonthlyTarget = (year: number, monthNum: number, teamTarget: number) => {
    let updated: MonthlyTarget[];
    const idx = targets.findIndex((t) => t.year === year && t.monthNum === monthNum);
    if (idx >= 0) {
      updated = [...targets];
      updated[idx] = { ...updated[idx], teamTarget };
    } else {
      updated = [
        ...targets,
        {
          year,
          monthNum,
          monthName: MONTH_NAMES[monthNum - 1],
          teamTarget,
          individualTargets: {},
        },
      ];
    }
    setTargets(updated);
    fetch('/api/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: updated }),
    }).catch((e) => console.warn('Failed to sync targets with server:', e));
  };

  const updateIndividualTarget = (
    year: number,
    monthNum: number,
    repId: string,
    amount: number
  ) => {
    let updated: MonthlyTarget[];
    const idx = targets.findIndex((t) => t.year === year && t.monthNum === monthNum);
    if (idx >= 0) {
      updated = [...targets];
      const newInd = { ...updated[idx].individualTargets, [repId]: amount };
      updated[idx] = { ...updated[idx], individualTargets: newInd };
    } else {
      updated = [
        ...targets,
        {
          year,
          monthNum,
          monthName: MONTH_NAMES[monthNum - 1],
          teamTarget: 5000000,
          individualTargets: { [repId]: amount },
        },
      ];
    }
    setTargets(updated);
    fetch('/api/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: updated }),
    }).catch((e) => console.warn('Failed to sync targets with server:', e));
  };

  const addSidebarItem = (item: Omit<SidebarMenuItem, 'id' | 'order'>) => {
    const id = `custom-${Date.now()}`;
    const order = sidebarItems.length + 1;
    const newItem: SidebarMenuItem = {
      ...item,
      id,
      order,
      isCustom: true,
    };
    const updated = [...sidebarItems, newItem];
    setSidebarItems(updated);
    fetch('/api/sidebar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sidebarItems: updated }),
    }).catch((e) => console.warn('Failed to sync sidebar with server:', e));
  };

  const toggleSidebarItemVisibility = (id: string) => {
    const updated = sidebarItems.map((item) =>
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    setSidebarItems(updated);
    fetch('/api/sidebar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sidebarItems: updated }),
    }).catch((e) => console.warn('Failed to sync sidebar with server:', e));
  };

  const reorderSidebarItems = (sourceIndex: number, destinationIndex: number) => {
    const clone = [...sidebarItems];
    const [removed] = clone.splice(sourceIndex, 1);
    clone.splice(destinationIndex, 0, removed);
    const updated = clone.map((item, idx) => ({ ...item, order: idx + 1 }));
    setSidebarItems(updated);
    fetch('/api/sidebar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sidebarItems: updated }),
    }).catch((e) => console.warn('Failed to sync sidebar with server:', e));
  };

  const deleteSidebarItem = (id: string) => {
    const updated = sidebarItems.filter((item) => item.id !== id);
    setSidebarItems(updated);
    if (activePage === id) {
      setActivePage('overview');
    }
    fetch('/api/sidebar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sidebarItems: updated }),
    }).catch((e) => console.warn('Failed to sync sidebar with server:', e));
  };

  const importCsv = (csvContent: string): boolean => {
    try {
      const parsed = parseRawCsv(csvContent);
      if (parsed.length === 0) return false;
      setRecords(parsed);
      fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: parsed }),
      }).catch((e) => console.warn('Failed to sync imported records with server:', e));
      return true;
    } catch (e) {
      console.error('Failed to parse CSV', e);
      return false;
    }
  };

  // Trigger manual or immediate Google Sheets Sync with intelligent dual-engine (server + client fallback)
  const triggerGoogleSheetsSync = useCallback(async () => {
    setIsSyncingSheets(true);
    try {
      // 1. First attempt: If running full-stack with server, trigger server-side sync & SSE broadcast
      try {
        const res = await fetch('/api/sheets/sync', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            setIsSyncingSheets(false);
            return data;
          }
        }
      } catch {
        // Server not available (e.g. running on Vercel static deployment) -> seamlessly proceed to client engine
      }

      // 2. Second attempt / Vercel engine: Direct browser-to-Google Sheets fetch
      if (sheetsConfig.sheetUrl?.trim()) {
        const rawUrl = sheetsConfig.sheetUrl.trim();
        const idMatch = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        const gidMatch = rawUrl.match(/gid=([0-9]+)/);
        const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
        const sheetParam = sheetsConfig.sheetName ? `&sheet=${encodeURIComponent(sheetsConfig.sheetName)}` : '';
        const timestamp = Date.now();

        const testUrls: string[] = [];

        // Handle published CSV or gviz link directly
        if (rawUrl.includes('pub?output=csv') || rawUrl.includes('gviz/tq?tqx=out:csv')) {
          const sep = rawUrl.includes('?') ? '&' : '?';
          testUrls.push(`${rawUrl}${sep}_t=${timestamp}`);
          testUrls.push(rawUrl);
        } else if (rawUrl.includes('/pubhtml') || rawUrl.includes('/pub?')) {
          const converted = rawUrl.replace(/\/pubhtml.*/, '/pub?output=csv').replace(/\/pub\?.*/, '/pub?output=csv');
          testUrls.push(`${converted}&_t=${timestamp}`);
          testUrls.push(converted);
        }

        if (idMatch) {
          // Google Visualization API CSV Export with cache buster (most reliable)
          testUrls.push(`https://docs.google.com/spreadsheets/d/${idMatch[1]}/gviz/tq?tqx=out:csv${gidParam}${sheetParam}&headers=1&_t=${timestamp}`);
          // Direct export format=csv
          testUrls.push(`https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv${gidParam}&_t=${timestamp}`);
          testUrls.push(`https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`);
        } else if (rawUrl.startsWith('http')) {
          testUrls.push(rawUrl);
        }

        let fetchedText = '';
        let lastErrorText = '';

        for (const tUrl of testUrls) {
          try {
            const resp = await fetch(tUrl, {
              headers: {
                'Accept': 'text/csv, text/plain, */*',
                'Cache-Control': 'no-cache',
              },
            });
            if (resp.ok) {
              const text = await resp.text();
              if (text.includes('accounts.google.com') || text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                lastErrorText = 'Google Sheet ต้องถูกตั้งค่าเป็น "ทุกคนที่มีลิงก์มีสิทธิ์ดู" (Anyone with the link can view)';
                continue;
              }
              if (text.trim().length > 10) {
                fetchedText = text;
                break;
              }
            } else {
              lastErrorText = `HTTP ${resp.status}: ไม่สามารถเข้าถึงชีทได้`;
            }
          } catch (fetchErr) {
            lastErrorText = fetchErr instanceof Error ? fetchErr.message : 'เชื่อมต่อ Google Sheets ไม่สำเร็จ';
          }
        }

        if (fetchedText) {
          const parsed = parseRawCsv(fetchedText);
          if (parsed.length > 0) {
            setRecords(parsed);
            setSalesReps((prev) => extractUniqueRepsFromRecords(parsed, prev));

            const successMsg = `ซิงค์เรียลไทม์สำเร็จพบ ${parsed.length} แถว`;
            setSheetsConfig((prev) => ({
              ...prev,
              lastSyncTime: new Date().toISOString(),
              lastSyncStatus: 'success',
              lastSyncMessage: successMsg,
              syncedRowCount: parsed.length,
              syncCount: (prev.syncCount || 0) + 1,
            }));

            setSyncLogs((prev) => [
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: 'google_sheets',
                status: 'success',
                message: successMsg,
                rowCount: parsed.length,
              },
              ...prev.slice(0, 49),
            ]);

            // If backend is running, also persist to server database
            fetch('/api/records', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ records: parsed }),
            }).catch(() => {});

            setIsSyncingSheets(false);
            return {
              success: true,
              message: successMsg,
              rowCount: parsed.length,
            };
          }
        }

        const failMsg = lastErrorText || 'ไม่พบแถวข้อมูลยอดขายที่ถูกต้องในไฟล์ Google Sheet';
        setSheetsConfig((prev) => ({
          ...prev,
          lastSyncTime: new Date().toISOString(),
          lastSyncStatus: 'error',
          lastSyncMessage: failMsg,
        }));
        setIsSyncingSheets(false);
        return { success: false, message: failMsg };
      }

      setIsSyncingSheets(false);
      return { success: false, message: 'ยังไม่ได้ระบุลิงก์ Google Sheets' };
    } catch (err) {
      setIsSyncingSheets(false);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
      };
    }
  }, [sheetsConfig]);

  // Client-side background auto-sync loop (vital for Vercel/standalone deployments and continuous live sync)
  useEffect(() => {
    if (!sheetsConfig.autoSync || !sheetsConfig.sheetUrl?.trim()) return;

    const intervalSec = Math.max(10, sheetsConfig.syncIntervalSec || 30);
    const timer = setInterval(() => {
      triggerGoogleSheetsSync().catch((e) => console.warn('Background auto-sync:', e));
    }, intervalSec * 1000);

    return () => clearInterval(timer);
  }, [sheetsConfig.autoSync, sheetsConfig.sheetUrl, sheetsConfig.syncIntervalSec, triggerGoogleSheetsSync]);

  // Initial startup sync if Google Sheets link is already configured
  useEffect(() => {
    if (sheetsConfig.sheetUrl?.trim() && sheetsConfig.autoSync) {
      const startupTimer = setTimeout(() => {
        triggerGoogleSheetsSync().catch(() => {});
      }, 1500);
      return () => clearTimeout(startupTimer);
    }
  }, []);

  // Update Google Sheets Configuration on central server
  const updateGoogleSheetsConfig = useCallback(async (newConfig: Partial<GoogleSheetsConfig>) => {
    setSheetsConfig((prev) => ({ ...prev, ...newConfig }));
    try {
      const res = await fetch('/api/sheets/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      const data = await res.json();
      if (data.sheetsConfig) {
        setSheetsConfig(data.sheetsConfig);
      }
    } catch (err) {
      console.error('Failed to update sheets config:', err);
    }
  }, []);

  const resetAllData = () => {
    setRecords(parseRawCsv(RAW_CSV_DATA));
    setSalesReps(INITIAL_SALES_REPS);
    setTargets(generateInitialTargets());
    setSidebarItems(INITIAL_SIDEBAR_ITEMS);
    setSettings(DEFAULT_APP_SETTINGS);
    setSheetsConfig(DEFAULT_GOOGLE_SHEETS_CONFIG);
    setActivePage('overview');
    localStorage.clear();
    fetch('/api/reset', { method: 'POST' }).catch((e) => console.warn('Failed to reset server data:', e));
  };

  return (
    <SalesContext.Provider
      value={{
        records,
        salesReps,
        targets,
        sidebarItems,
        settings,
        sheetsConfig,
        syncLogs,
        isRealtimeConnected,
        isSyncingSheets,
        isSyncModalOpen,
        activePage,
        isSidebarCollapsed,
        isMobileSidebarOpen,
        selectedMonthDetail,
        yearlyOverviewData,
        uniqueYears,
        setActivePage,
        toggleSidebar,
        setIsSidebarCollapsed,
        toggleMobileSidebar,
        setIsMobileSidebarOpen,
        setIsSyncModalOpen,
        setSelectedMonthDetail,
        updateSettings,
        toggleThemeMode,
        addSalesRep,
        updateSalesRep,
        deleteSalesRep,
        reconcileRepsFromRecords,
        exportRepsJson,
        importRepsJson,
        updateMonthlyTarget,
        updateIndividualTarget,
        addSidebarItem,
        toggleSidebarItemVisibility,
        reorderSidebarItems,
        deleteSidebarItem,
        importCsv,
        triggerGoogleSheetsSync,
        updateGoogleSheetsConfig,
        resetAllData,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const ctx = useContext(SalesContext);
  if (!ctx) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return ctx;
};
