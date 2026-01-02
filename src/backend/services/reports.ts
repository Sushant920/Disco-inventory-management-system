import { all, get, getDb } from '../db/connection';
import { ReportFilters, SalesReportItem } from '@shared/types';

export async function earningsSummary(filters: ReportFilters) {
  const db = await getDb();
  const where: string[] = [];
  const params: any[] = [];
  if (filters.from) {
    where.push('created_at >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    where.push('created_at <= ?');
    params.push(filters.to);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = await get<any>(db, `SELECT SUM(amount) as total FROM earnings_log ${clause}`, params);
  return { total: total?.total ?? 0 };
}

export async function salesByProduct(filters: ReportFilters): Promise<SalesReportItem[]> {
  const db = await getDb();
  const where: string[] = [];
  const params: any[] = [];
  if (filters.from) {
    where.push('s.created_at >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    where.push('s.created_at <= ?');
    params.push(filters.to);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await all<any>(
    db,
    `SELECT s.product_id, p.title, SUM(s.units) as units, SUM(s.units * s.unit_price) as revenue
       FROM sales s
       JOIN products p ON p.id = s.product_id
       ${clause}
       GROUP BY s.product_id, p.title
       ORDER BY revenue DESC`,
    params
  );
  return rows.map((r: any) => ({
    productId: r.product_id,
    title: r.title,
    revenue: r.revenue ?? 0,
    units: r.units ?? 0
  }));
}

