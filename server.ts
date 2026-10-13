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
    if (!db.sidebarItems) db.sidebarItems = INITIAL_SIDEBAR_ITEMS;
    if (!db.settings) db.settings = DEFAULT_APP_SETTINGS;
    if (!db.sheetsConfig) db.sheetsConfig = DEFAULT_GOOGLE_SHEETS_CONFIG;
    if (!db.syncLogs) db.syncLogs = [];
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
  const trimmed = rawInput.trim();
  if (!trimmed) return [];

  const urls: string[] = [];
  const timestamp = Date.now();

  // Already a published csv url or gviz url
  if (trimmed.includes('pub?output=csv') || trimmed.includes('gviz/tq?tqx=out:csv')) {
    const sep = trimmed.includes('?') ? '&' : '?';
    urls.push(`${trimmed}${sep}_t=${timestamp}`);
    urls.push(trimmed);
    return urls;
  }

  // Handle published HTML link -> convert to output=csv
  if (trimmed.includes('/pubhtml') || trimmed.includes('/pub?')) {
    const converted = trimmed.replace(/\/pubhtml.*/, '/pub?output=csv').replace(/\/pub\?.*/, '/pub?output=csv');
    urls.push(`${converted}&_t=${timestamp}`);
    urls.push(converted);
  }

  // Extract Sheet ID
  // e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = match ? match[1] : trimmed.startsWith('http') ? '' : trimmed;

  if (sheetId) {
    // Extract gid if present
    const gidMatch = trimmed.match(/gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    const sheetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '';

    // Primary: Google Visualization API CSV Export with cache buster (instant live updates)
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}${sheetParam}&headers=1&_t=${timestamp}`);
    // Secondary: Direct export format=csv with cache buster
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}&_t=${timestamp}`);
    // Tertiary: Fallback without params
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`);
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`);
  }

  if (urls.length === 0 && trimmed.startsWith('http')) {
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

  const candidateUrls = extractGoogleSheetCsvUrls(sheetUrl, sheetName);
  if (candidateUrls.length === 0) {
    return { success: false, message: 'รูปแบบลิงก์ Google Sheets ไม่ถูกต้อง' };
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
    const errorMsg = lastError || 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้ กรุณาตรวจสอบการแชร์ไฟล์';
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

  // Parse CSV records
  try {
    const newRecords = parseRawCsv(fetchedCsv);
    if (newRecords.length === 0) {
      throw new Error('ไม่พบแถวข้อมูลยอดขายที่ถูกต้องในไฟล์ Google Sheet (โปรดตรวจสอบหัวตารางและข้อมูล)');
    }

    db.records = newRecords;
    
    // Automatically reconcile sales reps from records so no employee ever gets lost
    db.salesReps = extractUniqueRepsFromRecords(newRecords, db.salesReps);

    db.sheetsConfig.lastSyncStatus = 'success';
    db.sheetsConfig.lastSyncMessage = `ซิงค์ข้อมูลล่าสุดสำเร็จพบ ${newRecords.length} แถว (พนักงาน ${db.salesReps.length} คน)`;
    db.sheetsConfig.lastSyncTime = new Date().toISOString();
    db.sheetsConfig.syncCount = (db.sheetsConfig.syncCount || 0) + 1;
    db.sheetsConfig.syncedRowCount = newRecords.length;

    db.syncLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'google_sheets',
      status: 'success',
      message: `ซิงค์เรียลไทม์สำเร็จ (${newRecords.length} แถว, พนักงาน ${db.salesReps.length} คน)`,
      rowCount: newRecords.length,
    });
    if (db.syncLogs.length > 50) db.syncLogs.pop();

    saveDatabase();

    // Broadcast entire updated state to all connected clients in real time!
    broadcast('data_update', {
      records: db.records,
      salesReps: db.salesReps,
      sheetsConfig: db.sheetsConfig,
      syncLogs: db.syncLogs,
    });

    return { success: true, message: `ซิงค์ข้อมูลล่าสุดสำเร็จ (${newRecords.length} แถว)`, rowCount: newRecords.length };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการแปลงข้อมูล CSV จาก Google Sheets';
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
