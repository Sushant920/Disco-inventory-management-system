import { randomUUID } from 'node:crypto';
import { getDb, run, all } from '../db/connection';
import { addBarcode, getProductByBarcode } from './products';
import { getOnHand } from './inventory';

export async function recordSaleByBarcode(code: string, units = 1, opts?: { force?: boolean; note?: string }) {
  const db = await getDb();
  const lookup = await getProductByBarcode(code);
  if (!lookup) {
    throw new Error('UNKNOWN_BARCODE');
  }
  const { product, barcode } = lookup;
  const onHand = await getOnHand(product.id);
  if (onHand < units && !opts?.force) {
    throw new Error('INSUFFICIENT_STOCK');
  }
  const now = new Date().toISOString();
  const saleId = randomUUID();
  const invId = randomUUID();
  const earningsId = randomUUID();

  await run(
    db,
    `INSERT INTO sales (id, product_id, units, unit_price, barcode_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    [saleId, product.id, units, product.price, barcode.id, now]
  );
  await run(
    db,
    `INSERT INTO inventory_transactions (id, product_id, change, reason, reference_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    [invId, product.id, -1 * units, opts?.force ? 'sale_override' : 'sale', opts?.note ?? saleId, now]
  );
  await run(
    db,
    `INSERT INTO earnings_log (id, sale_id, product_id, amount, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    [earningsId, saleId, product.id, product.price * units, now]
  );
  return { saleId, product, units, newOnHand: onHand - units };
}

export async function assignBarcodeToProduct(productId: string, code: string) {
  return addBarcode(productId, code, 'custom');
}

export async function listSales(from?: string, to?: string) {
  const db = await getDb();
  const where: string[] = [];
  const params: any[] = [];
  if (from) {
    where.push('created_at >= ?');
    params.push(from);
  }
  if (to) {
    where.push('created_at <= ?');
    params.push(to);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await all<any>(db, `SELECT * FROM sales ${clause} ORDER BY created_at DESC`, params);
  return rows.map((row: any) => ({
    id: row.id,
    productId: row.product_id,
    units: row.units,
    unitPrice: row.unit_price,
    barcodeId: row.barcode_id,
    createdAt: row.created_at
  }));
}

