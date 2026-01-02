import { randomUUID } from 'node:crypto';
import { all, get, getDb, run } from '../db/connection';
import { InventorySummary } from '@shared/types';

export async function addStock(productId: string, units: number, reason: 'intake' | 'adjustment' = 'intake') {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = randomUUID();
  await run(
    db,
    `INSERT INTO inventory_transactions (id, product_id, change, reason, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    [id, productId, units, reason, now]
  );
}

export async function getInventory(): Promise<InventorySummary[]> {
  const db = await getDb();
  const rows = await all<any>(
    db,
    `SELECT p.*, 
              COALESCE(SUM(it.change), 0) as on_hand,
              MAX(it.created_at) as last_txn
       FROM products p
       LEFT JOIN inventory_transactions it ON it.product_id = p.id
       GROUP BY p.id`
  );
  return Promise.all(
    rows.map(async (row: any) => {
      const barcodes = await all<any>(
        db,
        `SELECT id, product_id, code, type, created_at, updated_at FROM barcodes WHERE product_id = ?`,
        [row.id]
      );
      return {
        product: {
          id: row.id,
          title: row.title,
          volume: row.volume_ml ?? row.volume_l ?? 0,
          volumeUnit: row.volume_ml ? 'ml' : 'l',
          category: row.category,
          price: row.price,
          cost: row.cost ?? null,
          sku: row.sku ?? null,
          defaultBarcodeId: row.default_barcode_id ?? null,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        },
        barcodes: barcodes.map((b: any) => ({
          id: b.id,
          productId: b.product_id,
          code: b.code,
          type: b.type,
          createdAt: b.created_at,
          updatedAt: b.updated_at
        })),
        onHand: row.on_hand ?? 0,
        lastTransactionAt: row.last_txn ?? undefined
      };
    })
  );
}

export async function getOnHand(productId: string): Promise<number> {
  const db = await getDb();
  const row = await get<any>(db, `SELECT COALESCE(SUM(change), 0) as qty FROM inventory_transactions WHERE product_id = ?`, [productId]);
  return row?.qty ?? 0;
}

