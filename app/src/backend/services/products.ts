import { randomUUID } from 'node:crypto';
import { all, get, getDb, run } from '../db/connection';
import { Product, Barcode } from '@shared/types';

const productSelect = `
  SELECT id, title,
    COALESCE(volume_ml, 0) AS volume_ml,
    COALESCE(volume_l, 0) AS volume_l,
    category, price, cost, sku, default_barcode_id,
    created_at, updated_at
  FROM products
`;

export async function listProducts(): Promise<Product[]> {
  const db = await getDb();
  const rows = await all<any>(db, productSelect);
  return rows.map(mapRowToProduct);
}

export async function createProduct(
  input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { volume: number; volumeUnit: 'ml' | 'l'; barcodes?: { code: string; type?: string }[] }
): Promise<{ product: Product; barcodes: Barcode[] }> {
  const db = await getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const volume_ml = input.volumeUnit === 'ml' ? input.volume : null;
  const volume_l = input.volumeUnit === 'l' ? input.volume : null;

  await run(
    db,
    `INSERT INTO products (id, title, volume_ml, volume_l, category, price, cost, sku, default_barcode_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.title, volume_ml, volume_l, input.category, input.price, input.cost ?? null, input.sku ?? null, null, now, now]
  );

  const barcodes: Barcode[] = [];
  if (input.barcodes) {
    for (const b of input.barcodes) {
      const bid = randomUUID();
      await run(
        db,
        `INSERT INTO barcodes (id, product_id, code, type, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [bid, id, b.code, b.type ?? 'custom', now, now]
      );
      barcodes.push({
        id: bid,
        productId: id,
        code: b.code,
        type: b.type ?? 'custom',
        createdAt: now,
        updatedAt: now
      });
    }
  }

  const product = mapRowToProduct({
    id,
    title: input.title,
    volume_ml,
    volume_l,
    category: input.category,
    price: input.price,
    cost: input.cost ?? null,
    sku: input.sku ?? null,
    default_barcode_id: null,
    created_at: now,
    updated_at: now
  });
  return { product, barcodes };
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> & { volume?: number; volumeUnit?: 'ml' | 'l' }
) {
  const db = await getDb();
  const existing = await get<any>(db, `${productSelect} WHERE id = ?`, [id]);
  if (!existing) throw new Error('Product not found');
  const now = new Date().toISOString();
  const volume_ml = patch.volumeUnit === 'ml' ? patch.volume : existing.volume_ml;
  const volume_l = patch.volumeUnit === 'l' ? patch.volume : existing.volume_l;
  await run(
    db,
    `UPDATE products
     SET title=?, volume_ml=?, volume_l=?, category=?, price=?,
         cost=?, sku=?, default_barcode_id=?, updated_at=?
     WHERE id=?`,
    [
      patch.title ?? existing.title,
      volume_ml,
      volume_l,
      patch.category ?? existing.category,
      patch.price ?? existing.price,
      patch.cost ?? existing.cost,
      patch.sku ?? existing.sku,
      patch.defaultBarcodeId ?? existing.default_barcode_id,
      now,
      id
    ]
  );
}

export async function deleteProduct(id: string) {
  const db = await getDb();
  await run(db, 'DELETE FROM products WHERE id = ?', [id]);
}

export async function addBarcode(productId: string, code: string, type = 'custom'): Promise<Barcode> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = randomUUID();
  await run(
    db,
    `INSERT INTO barcodes (id, product_id, code, type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, productId, code, type, now, now]
  );
  return { id, productId, code, type, createdAt: now, updatedAt: now };
}

export async function getProductByBarcode(code: string): Promise<{ product: Product; barcode: Barcode } | null> {
  const db = await getDb();
  const row = await get<any>(
    db,
    `SELECT p.*, b.id as b_id, b.code as b_code, b.type as b_type, b.created_at as b_created, b.updated_at as b_updated
       FROM barcodes b
       JOIN products p ON p.id = b.product_id
       WHERE b.code = ?`,
    [code]
  );
  if (!row) return null;
  const product = mapRowToProduct(row);
  const barcode: Barcode = {
    id: row.b_id,
    productId: row.id,
    code: row.b_code,
    type: row.b_type,
    createdAt: row.b_created,
    updatedAt: row.b_updated
  };
  return { product, barcode };
}

function mapRowToProduct(row: any): Product {
  return {
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
  };
}

