import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  parseRawCsv,
  INITIAL_SALES_REPS,
  generateInitialTargets,
  INITIAL_SIDEBAR_ITEMS,
  DEFAULT_APP_SETTINGS,
  DEFAULT_GOOGLE_SHEETS_CONFIG,
  extractUniqueRepsFromRecords,
} from './src/data/salesDataService.ts';
import {
  detectSheetType,
  parseLeadReport,
  parseForecastSalesReport,
  parseDatabaseConfig,
  parseQuotationReport,
  parseMeasurementReport,
  parseInstallmentReport,
  parseClaimReport,
  convertQuotationReportToSalesRecords,
} from './src/data/multiSheetParser.ts';
import {
  INITIAL_LEAD_REPORT,
  INITIAL_FORECAST_SALES,
  INITIAL_DATABASE_CONFIG,
  INITIAL_QUOTATION_REPORT,
  INITIAL_MEASUREMENT_REPORT,
  INITIAL_INSTALLMENT_REPORT,
  INITIAL_CLAIM_REPORT_2026,
} from './src/data/initialMultiSheetData.ts';
import type {
  SheetType,
  LeadReportRow,
  ForecastSalesReportRow,
  DatabaseConfigRow,
  QuotationReportRow,
  MeasurementReportRow,
  InstallmentReportRow,
  ClaimReportRow,
} from './src/types/sheetSchemas.ts';
import { RAW_CSV_DATA } from './src/data/rawCsv.ts';
import type {
  SalesRecord,
  SalesRep,
  MonthlyTarget,
  SidebarMenuItem,
  AppSettings,
  GoogleSheetsConfig,
  SyncLogEntry,
} from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_DIR = path.resolve(__dirname, 'server_data');
const DB_FILE = path.join(DB_DIR, 'database.json');

interface DatabaseSchema {
  records: SalesRecord[];
  salesReps: SalesRep[];
  targets: MonthlyTarget[];
  sidebarItems: SidebarMenuItem[];
  settings: AppSettings;
  sheetsConfig: GoogleSheetsConfig;
  syncLogs: SyncLogEntry[];
  leadRows?: LeadReportRow[];
  forecastRows?: ForecastSalesReportRow[];
  dbConfigRows?: DatabaseConfigRow[];
  quotationRows?: QuotationReportRow[];
  measurementRows?: MeasurementReportRow[];
  installmentRows?: InstallmentReportRow[];
  claimRows?: ClaimReportRow[];
}

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database with seed data if not present
function getInitialDatabase(): DatabaseSchema {
  return {
    records: parseRawCsv(RAW_CSV_DATA),
    salesReps: INITIAL_SALES_REPS,
    targets: generateInitialTargets(),
    sidebarItems: INITIAL_SIDEBAR_ITEMS,
    settings: DEFAULT_APP_SETTINGS,
    sheetsConfig: DEFAULT_GOOGLE_SHEETS_CONFIG,
    leadRows: INITIAL_LEAD_REPORT,
    forecastRows: INITIAL_FORECAST_SALES,
    dbConfigRows: INITIAL_DATABASE_CONFIG,
    quotationRows: INITIAL_QUOTATION_REPORT,
    measurementRows: INITIAL_MEASUREMENT_REPORT,
    installmentRows: INITIAL_INSTALLMENT_REPORT,
    claimRows: INITIAL_CLAIM_REPORT_2026,
    syncLogs: [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'reset',
        status: 'success',
        message: 'เริ่มต้นระบบฐานข้อมูลกลาง PASAYA Curtain Center สำเร็จ',
        rowCount: 220,
      },
    ],
  };
}

let db: DatabaseSchema;
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    db = JSON.parse(raw);
    // Ensure all keys are defined
    if (!db.records) db.records = parseRawCsv(RAW_CSV_DATA);
    if (!db.salesReps) db.salesReps = INITIAL_SALES_REPS;
    if (!db.targets) db.targets = generateInitialTargets();

    // Reconcile sidebar items so all initial items exist
    const existingSidebarIds = new Set((db.sidebarItems || []).map((i) => i.id));
    const missingInitials = INITIAL_SIDEBAR_ITEMS.filter((i) => !existingSidebarIds.has(i.id));
    if (missingInitials.length > 0 || !db.sidebarItems || db.sidebarItems.length < INITIAL_SIDEBAR_ITEMS.length) {
      const existingMap = new Map((db.sidebarItems || []).map((i) => [i.id, i]));
      const reconciled = INITIAL_SIDEBAR_ITEMS.map((init) => {
        const found = existingMap.get(init.id);
        if (found) {
          return { ...init, ...found, visible: found.visible ?? true };
        }
        return init;
      });
      for (const item of (db.sidebarItems || [])) {
        if (!INITIAL_SIDEBAR_ITEMS.some((init) => init.id === item.id)) {
          reconciled.push(item);
        }
      }
      db.sidebarItems = reconciled.sort((a, b) => a.order - b.order);
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    }

    if (!db.settings) db.settings = DEFAULT_APP_SETTINGS;
    if (!db.sheetsConfig) db.sheetsConfig = DEFAULT_GOOGLE_SHEETS_CONFIG;
    if (!db.syncLogs) db.syncLogs = [];
    if (!db.leadRows) db.leadRows = INITIAL_LEAD_REPORT;
    if (!db.forecastRows) db.forecastRows = INITIAL_FORECAST_SALES;
    if (!db.dbConfigRows) db.dbConfigRows = INITIAL_DATABASE_CONFIG;
    if (!db.quotationRows) db.quotationRows = INITIAL_QUOTATION_REPORT;
    if (!db.measurementRows) db.measurementRows = INITIAL_MEASUREMENT_REPORT;
    if (!db.installmentRows) db.installmentRows = INITIAL_INSTALLMENT_REPORT;
    if (!db.claimRows) db.claimRows = INITIAL_CLAIM_REPORT_2026;
  } else {
    db = getInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }
} catch (e) {
  console.warn('Error reading database file, resetting to seed:', e);
  db = getInitialDatabase();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    const publicApiDir = path.resolve(__dirname, 'public', 'api');
    if (fs.existsSync(publicApiDir)) {
      fs.writeFileSync(path.join(publicApiDir, 'data.json'), JSON.stringify(db), 'utf-8');
      fs.writeFileSync(path.join(publicApiDir, 'data'), JSON.stringify(db), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

// Set of connected SSE clients
const sseClients = new Set<express.Response>();

function broadcast(eventType: string, payload: unknown) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Helper: Convert Google Sheet URL/ID into downloadable CSV URLs with cache busting
function extractGoogleSheetCsvUrls(rawInput: string, sheetName?: string): string[] {
  let trimmed = (rawInput || '').trim();
  if (!trimmed) return [];

  // Remove wrapping quotes or angle brackets
  trimmed = trimmed.replace(/^["'<]|["'>]$/g, '').trim();

  const urls: string[] = [];
  const timestamp = Date.now();

  // 1. Google Sheets "Publish to the web" URLs (e.g. /spreadsheets/d/e/2PACX-.../pub...)
  if (trimmed.includes('/pub') || trimmed.includes('/d/e/')) {
    let pubUrl = trimmed;
    // Replace /pubhtml with /pub
    if (pubUrl.includes('/pubhtml')) {
      pubUrl = pubUrl.replace(/\/pubhtml([?#].*)?$/, '/pub$1');
    }
    // Ensure output=csv parameter is present
    if (!pubUrl.includes('output=csv')) {
      const sep = pubUrl.includes('?') ? '&' : '?';
      pubUrl = `${pubUrl}${sep}output=csv`;
    }
    const sep = pubUrl.includes('?') ? '&' : '?';
    urls.push(`${pubUrl}${sep}_t=${timestamp}`);
    urls.push(pubUrl);
    return urls;
  }

  // 2. Already a direct CSV export or gviz link
  if (trimmed.includes('export?format=csv') || trimmed.includes('gviz/tq?tqx=out:csv')) {
    const sep = trimmed.includes('?') ? '&' : '?';
    urls.push(`${trimmed}${sep}_t=${timestamp}`);
    urls.push(trimmed);
    return urls;
  }

  // 3. Standard Google Sheet URL: /spreadsheets/d/<SHEET_ID>/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = match && match[1] !== 'e' ? match[1] : trimmed.startsWith('http') ? '' : trimmed;

  if (sheetId && sheetId !== 'e') {
    const gidMatch = trimmed.match(/gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    const sheetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '';

    // Primary: Google Visualization API CSV Export with cache buster (instant live updates)
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}${sheetParam}&headers=1&_t=${timestamp}`);
    // Secondary: Direct export format=csv with cache buster
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}&_t=${timestamp}`);
    // Tertiary: Fallback without cache buster
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`);
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}${sheetParam}`);
    return urls;
  }

  if (trimmed.startsWith('http')) {
    const sep = trimmed.includes('?') ? '&' : '?';
    urls.push(`${trimmed}${sep}_t=${timestamp}`);
    urls.push(trimmed);
  }

  return urls;
}

// Sync Google Sheets Engine
async function syncGoogleSheets(): Promise<{ success: boolean; message: string; rowCount?: number }> {
  const { sheetUrl, sheetName } = db.sheetsConfig;
  if (!sheetUrl || !sheetUrl.trim()) {
    return { success: false, message: 'ยังไม่ได้ระบุลิงก์หรือไอดี Google Sheet' };
  }

  const trimmed = sheetUrl.trim();

  // If user pasted raw CSV content directly into the sheetUrl field
  if (!trimmed.startsWith('http') && (trimmed.includes('\n') || (trimmed.includes(',') && trimmed.length > 50))) {
    return applyCsvDataToDatabase(trimmed, sheetName, 'manual_csv');
  }

  const candidateUrls = extractGoogleSheetCsvUrls(trimmed, sheetName);
  if (candidateUrls.length === 0) {
    return { success: false, message: 'รูปแบบลิงก์ Google Sheets ไม่ถูกต้อง กรุณาวางลิงก์ Google Sheets หรือ Published CSV' };
  }

  db.sheetsConfig.lastSyncStatus = 'syncing';
  broadcast('sheets_status_update', { sheetsConfig: db.sheetsConfig });

  let fetchedCsv = '';
  let lastError = '';

  for (const url of candidateUrls) {
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/csv, text/plain, */*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (resp.ok) {
        const text = await resp.text();
        // Check if response looks like HTML (e.g. login page) or actual CSV
        if (text.trim().startsWith('<!DOCTYPE html>') || text.includes('<html') || text.includes('accounts.google.com')) {
          lastError = 'Google Sheet ต้องถูกตั้งค่าแชร์เป็น "ทุกคนที่มีลิงก์มีสิทธิ์ดู" (Anyone with the link can view)';
          continue;
        }
        if (text.trim().length > 10) {
          fetchedCsv = text;
          break;
        }
      } else {
        lastError = `HTTP ${resp.status}: ${resp.statusText}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  if (!fetchedCsv) {
    const errorMsg = lastError || 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้ กรุณาตรวจสอบการแชร์ไฟล์ หรือลิงก์ Published CSV';
    db.sheetsConfig.lastSyncStatus = 'error';
    db.sheetsConfig.lastSyncMessage = errorMsg;
    db.sheetsConfig.lastSyncTime = new Date().toISOString();
    
    db.syncLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'google_sheets',
      status: 'error',
      message: errorMsg,
    });
    if (db.syncLogs.length > 50) db.syncLogs.pop();
    saveDatabase();

    broadcast('sheets_status_update', {
      sheetsConfig: db.sheetsConfig,
      syncLogs: db.syncLogs,
    });
    return { success: false, message: errorMsg };
  }

  return applyCsvDataToDatabase(fetchedCsv, db.sheetsConfig.sheetName, 'google_sheets');
}

function applyCsvDataToDatabase(
  csvContent: string,
  targetSheetName?: string,
  syncType: 'google_sheets' | 'manual_csv' | 'reset' = 'google_sheets'
): { success: boolean; message: string; rowCount?: number } {
  // Parse CSV records according to detected sheet type or tab
  try {
    const sheetType = detectSheetType(csvContent, targetSheetName);
    let rowCount = 0;
    let sheetLabel = '';

    switch (sheetType) {
      case 'lead_report': {
        const rows = parseLeadReport(csvContent);
        if (rows.length === 0) throw new Error('ไม่พบแถวข้อมูล Lead Report ที่ถูกต้องใน Google Sheet หรือข้อความ CSV');
        db.leadRows = rows;
        rowCount = rows.length;
        sheetLabel = 'Lead Report (ลีดลูกค้า)';
        break;
      }
      case 'forecast_sales': {
        const rows = parseForecastSalesReport(csvContent);
        if (rows.length === 0) throw new Error('ไม่พบแถวข้อมูล Forecast Sales Report ที่ถูกต้องใน Google Sheet หรือข้อความ CSV');
        db.forecastRows = rows;
        rowCount = rows.length;
        sheetLabel = 'Forecast Sales Report';
        break;
      }
      case 'database': {
        const rows = parseDatabaseConfig(csvContent);
        if (rows.length === 0) throw new Error('ไม่พบแถวข้อมูล Database Config ที่ถูกต้องใน Google Sheet หรือข้อความ CSV');
        db.dbConfigRows = rows;
        rowCount = rows.length;
        sheetLabel = 'Database Config';
        break;
      }
      case 'quotation_report': {
        const rows = parseQuotationReport(csvContent);
        if (rows.length === 0) throw new Error('ไม่พบแถวข้อมูล Quotation Report ที่ถูกต้องใน Google Sheet หรือข้อความ CSV');
        db.quotationRows = rows;
        rowCount = rows.length;
        sheetLabel = 'Quotation Report';
        const conv = convertQuotationReportToSalesRecords(rows, db.salesReps);
        if (conv.length > 0) {
          db.records = [...conv, ...db.records.filter((r) => !r.id.startsWith('quote-rec-'))];
        }
        break;
      }
      case 'measurement_report': {
        const rows = parseMeasurementReport(csvContent);
        if (rows.length === 0) throw new Error('ไม่พบแถวข้อมูล Measurement Report ที่ถูกต้องใน Google Sheet หรือข้อความ CSV');
        db.measurementRows = rows;
        rowCount = rows.length;
        sheetLabel = 'Measurement Report';
        break;
      }
      case 'installment_report': {
        const rows = parseInstallmentReport(csvContent);
        if (rows.length === 0) throw new Error('ไม่พบแถวข้อมูล Installment Report ที่ถูกต้องใน Google Sheet หรือข้อความ CSV');
        db.installmentRows = rows;
        rowCount = rows.length;
        sheetLabel = 'Installment Report';
        break;
      }
      case 'claim_report': {
        const rows = parseClaimReport(csvContent);
        if (rows.length === 0) throw new Error('ไม่พบแถวข้อมูล Claim Report ที่ถูกต้องใน Google Sheet หรือข้อความ CSV');
        db.claimRows = rows;
        rowCount = rows.length;
        sheetLabel = 'Claim Report';
        break;
      }
      case 'sales_summary':
      default: {
        const newRecords = parseRawCsv(csvContent);
        if (newRecords.length === 0) {
          throw new Error('ไม่พบแถวข้อมูลยอดขายที่ถูกต้องในไฟล์ Google Sheet (โปรดตรวจสอบหัวตารางและข้อมูล)');
        }
        db.records = newRecords;
        db.salesReps = extractUniqueRepsFromRecords(newRecords, db.salesReps);
        rowCount = newRecords.length;
        sheetLabel = 'Sales Summary Report';
        break;
      }
    }

    db.sheetsConfig.lastSyncStatus = 'success';
    db.sheetsConfig.lastSyncMessage = `ซิงค์ข้อมูลล่าสุดสำเร็จ (${sheetLabel}) พบ ${rowCount} แถว`;
    db.sheetsConfig.lastSyncTime = new Date().toISOString();
    db.sheetsConfig.syncCount = (db.sheetsConfig.syncCount || 0) + 1;
    db.sheetsConfig.syncedRowCount = rowCount;

    db.syncLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: syncType,
      status: 'success',
      message: `ซิงค์เรียลไทม์สำเร็จ (${sheetLabel}, ${rowCount} แถว)`,
      rowCount,
    });
    if (db.syncLogs.length > 50) db.syncLogs.pop();

    saveDatabase();

    // Broadcast entire updated state to all connected clients in real time!
    broadcast('data_update', {
      records: db.records,
      salesReps: db.salesReps,
      sheetsConfig: db.sheetsConfig,
      syncLogs: db.syncLogs,
      leadRows: db.leadRows,
      forecastRows: db.forecastRows,
      dbConfigRows: db.dbConfigRows,
      quotationRows: db.quotationRows,
      measurementRows: db.measurementRows,
      installmentRows: db.installmentRows,
      claimRows: db.claimRows,
    });

    return { success: true, message: `ซิงค์ข้อมูลล่าสุดสำเร็จ (${sheetLabel}, ${rowCount} แถว)`, rowCount };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการแปลงข้อมูล CSV';
    db.sheetsConfig.lastSyncStatus = 'error';
    db.sheetsConfig.lastSyncMessage = errorMsg;
    db.sheetsConfig.lastSyncTime = new Date().toISOString();

    db.syncLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: syncType,
      status: 'error',
      message: errorMsg,
    });
    if (db.syncLogs.length > 50) db.syncLogs.pop();
    saveDatabase();

    broadcast('sheets_status_update', {
      sheetsConfig: db.sheetsConfig,
      syncLogs: db.syncLogs,
    });

    return { success: false, message: errorMsg };
  }
}

// Background Auto-sync loop
let autoSyncTimer: NodeJS.Timeout | null = null;
function startAutoSyncLoop() {
  if (autoSyncTimer) clearInterval(autoSyncTimer);

  const intervalSec = Math.max(10, db.sheetsConfig.syncIntervalSec || 30);
  autoSyncTimer = setInterval(() => {
    if (db.sheetsConfig.autoSync && db.sheetsConfig.sheetUrl?.trim()) {
      syncGoogleSheets().catch((e) => console.error('Auto sync error:', e));
    }
  }, intervalSec * 1000);
}

startAutoSyncLoop();

// Start Express Application
async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // SSE Realtime stream endpoint
  app.get('/api/realtime/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    // Send initial snapshot
    res.write(
      `event: initial_state\ndata: ${JSON.stringify({
        records: db.records,
        salesReps: db.salesReps,
        targets: db.targets,
        sidebarItems: db.sidebarItems,
        settings: db.settings,
        sheetsConfig: db.sheetsConfig,
        syncLogs: db.syncLogs,
      })}\n\n`
    );

    // Keepalive ping every 20 seconds
    const pingInterval = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(pingInterval);
        sseClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(pingInterval);
      sseClients.delete(res);
    });
  });

  // REST API: Get All Data
  app.get('/api/data', (_req, res) => {
    res.json(db);
  });

  // REST API: Update Sales Records
  app.post('/api/records', (req, res) => {
    const { records } = req.body;
    if (Array.isArray(records)) {
      db.records = records;
      // Auto-reconcile sales reps from records so no employee ever disappears
      db.salesReps = extractUniqueRepsFromRecords(records, db.salesReps);

      db.syncLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'manual_csv',
        status: 'success',
        message: `อัปเดตข้อมูล Sales Records (${records.length} แถว, พนักงาน ${db.salesReps.length} คน)`,
        rowCount: records.length,
      });
      if (db.syncLogs.length > 50) db.syncLogs.pop();
      saveDatabase();
      broadcast('data_update', {
        records: db.records,
        salesReps: db.salesReps,
        syncLogs: db.syncLogs,
      });
      res.json({ success: true, count: records.length, repsCount: db.salesReps.length });
    } else {
      res.status(400).json({ error: 'Invalid records array' });
    }
  });

  // REST API: Update Sales Reps (Safely merges without wiping custom data)
  app.post('/api/reps', (req, res) => {
    const { salesReps } = req.body;
    if (Array.isArray(salesReps)) {
      db.salesReps = salesReps;
      saveDatabase();
      broadcast('data_update', { salesReps: db.salesReps });
      res.json({ success: true, count: db.salesReps.length });
    } else {
      res.status(400).json({ error: 'Invalid salesReps' });
    }
  });

  // REST API: Delete specific Sales Rep
  app.post('/api/reps/delete', (req, res) => {
    const { id } = req.body;
    if (id) {
      db.salesReps = db.salesReps.filter((r) => r.id !== id);
      saveDatabase();
      broadcast('data_update', { salesReps: db.salesReps });
      res.json({ success: true, count: db.salesReps.length });
    } else {
      res.status(400).json({ error: 'Missing rep id' });
    }
  });

  // REST API: Auto-reconcile & restore sales reps from sales data
  app.post('/api/reps/reconcile', (_req, res) => {
    db.salesReps = extractUniqueRepsFromRecords(db.records, db.salesReps);
    saveDatabase();
    broadcast('data_update', { salesReps: db.salesReps });
    res.json({ success: true, salesReps: db.salesReps, count: db.salesReps.length });
  });

  // REST API: Update Targets
  app.post('/api/targets', (req, res) => {
    const { targets } = req.body;
    if (Array.isArray(targets)) {
      db.targets = targets;
      saveDatabase();
      broadcast('data_update', { targets: db.targets });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid targets' });
    }
  });

  // REST API: Update Sidebar Items
  app.post('/api/sidebar', (req, res) => {
    const { sidebarItems } = req.body;
    if (Array.isArray(sidebarItems)) {
      db.sidebarItems = sidebarItems;
      saveDatabase();
      broadcast('data_update', { sidebarItems: db.sidebarItems });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid sidebarItems' });
    }
  });

  // REST API: Reset Sidebar Items to default 16 pages
  app.post('/api/sidebar/reset', (_req, res) => {
    db.sidebarItems = INITIAL_SIDEBAR_ITEMS;
    saveDatabase();
    broadcast('data_update', { sidebarItems: db.sidebarItems });
    res.json({ success: true, count: db.sidebarItems.length, sidebarItems: db.sidebarItems });
  });

  // REST API: Update Settings
  app.post('/api/settings', (req, res) => {
    const { settings } = req.body;
    if (settings && typeof settings === 'object') {
      db.settings = { ...db.settings, ...settings };
      saveDatabase();
      broadcast('data_update', { settings: db.settings });
      res.json({ success: true, settings: db.settings });
    } else {
      res.status(400).json({ error: 'Invalid settings' });
    }
  });

  // REST API: Update Google Sheets Configuration
  app.post('/api/sheets/config', async (req, res) => {
    const { sheetUrl, sheetName, autoSync, syncIntervalSec } = req.body;
    db.sheetsConfig = {
      ...db.sheetsConfig,
      sheetUrl: sheetUrl !== undefined ? sheetUrl : db.sheetsConfig.sheetUrl,
      sheetName: sheetName !== undefined ? sheetName : db.sheetsConfig.sheetName,
      autoSync: autoSync !== undefined ? autoSync : db.sheetsConfig.autoSync,
      syncIntervalSec: syncIntervalSec !== undefined ? syncIntervalSec : db.sheetsConfig.syncIntervalSec,
    };
    saveDatabase();
    startAutoSyncLoop();
    broadcast('sheets_status_update', { sheetsConfig: db.sheetsConfig });

    // If new sheet URL is provided, trigger instant sync
    let syncResult = null;
    if (sheetUrl && sheetUrl.trim()) {
      syncResult = await syncGoogleSheets();
    }

    res.json({ success: true, sheetsConfig: db.sheetsConfig, syncResult });
  });

  // REST API: Instant Google Sheets Sync
  app.post('/api/sheets/sync', async (_req, res) => {
    const result = await syncGoogleSheets();
    res.json(result);
  });

  // REST API: Reset All Data to Seed
  app.post('/api/reset', (_req, res) => {
    db = getInitialDatabase();
    saveDatabase();
    startAutoSyncLoop();
    broadcast('data_update', db);
    res.json({ success: true, message: 'รีเซ็ตข้อมูลสู่ค่าเริ่มต้นเรียบร้อย' });
  });

  // Mount Vite development middlewares or serve static build
  if (process.env.NODE_ENV === 'production' || process.env.VITE_DEV !== 'true') {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      // In dev mode when dist does not exist yet
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PASAYA Realtime Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
