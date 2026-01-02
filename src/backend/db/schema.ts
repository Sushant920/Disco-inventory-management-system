import { getDb, run, get, exec } from './connection';

export async function ensureSchema() {
  const db = await getDb();
  await exec(
    db,
    `
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      volume_ml INTEGER,
      volume_l REAL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      cost REAL,
      sku TEXT UNIQUE,
      default_barcode_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS barcodes (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      change INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      units INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      barcode_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(barcode_id) REFERENCES barcodes(id)
    );

    CREATE TABLE IF NOT EXISTS earnings_log (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(sale_id) REFERENCES sales(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      currency TEXT NOT NULL,
      scan_default_qty INTEGER NOT NULL DEFAULT 1,
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      data_path TEXT NOT NULL,
      backup_path TEXT,
      theme TEXT NOT NULL DEFAULT 'light',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_title ON products(title);
    CREATE INDEX IF NOT EXISTS idx_barcodes_code ON barcodes(code);
    CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
  `
  );

  await ensureDefaultSettings();
}

async function ensureDefaultSettings() {
  const db = await getDb();
  const existing = await get(db, 'SELECT id FROM settings LIMIT 1');
  if (existing) return;
  const now = new Date().toISOString();
  await run(
    db,
    `INSERT INTO settings (id, currency, scan_default_qty, low_stock_threshold, data_path, theme, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['default', 'INR', 1, 5, 'local', 'light', now, now]
  );
}

