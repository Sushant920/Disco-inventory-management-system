import { get, getDb, run } from '../db/connection';
import { Settings } from '@shared/types';

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const row = await get<any>(db, 'SELECT * FROM settings LIMIT 1');
  return map(row);
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  const existing = await get<any>(db, 'SELECT * FROM settings LIMIT 1');
  if (!existing) throw new Error('Settings missing');
  const now = new Date().toISOString();
  await run(
    db,
    `UPDATE settings SET
       currency=?,
       scan_default_qty=?,
       low_stock_threshold=?,
       data_path=?,
       backup_path=?,
       theme=?,
       updated_at=?
     WHERE id=?`,
    [
      patch.currency ?? existing.currency,
      patch.scanDefaultQty ?? existing.scan_default_qty,
      patch.lowStockThreshold ?? existing.low_stock_threshold,
      patch.dataPath ?? existing.data_path,
      patch.backupPath ?? existing.backup_path,
      patch.theme ?? existing.theme,
      now,
      existing.id
    ]
  );
}

function map(row: any): Settings {
  return {
    id: row.id,
    currency: row.currency,
    scanDefaultQty: row.scan_default_qty,
    lowStockThreshold: row.low_stock_threshold,
    dataPath: row.data_path,
    backupPath: row.backup_path,
    theme: row.theme,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

