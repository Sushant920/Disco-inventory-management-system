import path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import isDev from 'electron-is-dev';
import { ensureSchema } from '../backend/db/schema';
import { listProducts, createProduct, updateProduct, deleteProduct, addBarcode, getProductByBarcode } from '../backend/services/products';
import { addStock, getInventory } from '../backend/services/inventory';
import { recordSaleByBarcode, listSales } from '../backend/services/sales';
import { earningsSummary, salesByProduct } from '../backend/services/reports';
import { getSettings, updateSettings } from '../backend/services/settings';
import { backupDatabase, restoreDatabase } from '../backend/services/backup';

let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer-dist/index.html'));
  }
}

app.whenReady().then(async () => {
  await ensureSchema();
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('products:list', () => listProducts());
ipcMain.handle('products:create', (_event, payload) => createProduct(payload));
ipcMain.handle('products:update', (_event, id, patch) => updateProduct(id, patch));
ipcMain.handle('products:delete', (_event, id) => deleteProduct(id));
ipcMain.handle('products:assign-barcode', (_event, productId, code) => addBarcode(productId, code));
ipcMain.handle('products:lookup-barcode', (_event, code) => getProductByBarcode(code));

ipcMain.handle('inventory:add', (_event, productId: string, units: number, reason: 'intake' | 'adjustment') =>
  addStock(productId, units, reason)
);
ipcMain.handle('inventory:list', () => getInventory());

ipcMain.handle('sales:scan', async (_event, code: string, units?: number, opts?: { force?: boolean; note?: string }) => {
  const settings = await getSettings();
  return recordSaleByBarcode(code, units ?? settings.scanDefaultQty, opts);
});
ipcMain.handle('sales:list', (_event, from?: string, to?: string) => listSales(from, to));

ipcMain.handle('reports:earnings', (_event, filters) => earningsSummary(filters));
ipcMain.handle('reports:salesByProduct', (_event, filters) => salesByProduct(filters));

ipcMain.handle('settings:get', () => getSettings());
ipcMain.handle('settings:update', (_event, patch) => updateSettings(patch));

ipcMain.handle('backup:run', (_event, targetPath?: string) => backupDatabase(targetPath));
ipcMain.handle('backup:restore', (_event, fromPath: string) => restoreDatabase(fromPath));

