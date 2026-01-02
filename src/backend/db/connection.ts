import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import path from 'node:path';
import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import { app } from 'electron';

const DB_FILE = 'disco-inventory.db';
let sqlInstance: SqlJsStatic | null = null;
let dbInstance: Database | null = null;
let wasmPathCache: string | null = null;

async function getSql() {
  if (sqlInstance) return sqlInstance;
  if (!wasmPathCache) {
    wasmPathCache = path.join(app.getAppPath(), 'node_modules/sql.js/dist/sql-wasm.wasm');
  }
  const wasmPath = wasmPathCache;
  sqlInstance = await initSqlJs({ locateFile: () => wasmPath });
  return sqlInstance;
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  const SQL = await getSql();
  const dbPath = path.join(app.getPath('userData'), DB_FILE);
  if (fs.existsSync(dbPath)) {
    const fileBuffer = await fsp.readFile(dbPath);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }
  return dbInstance;
}

export async function exportDb(): Promise<Uint8Array> {
  const db = await getDb();
  return db.export();
}

export async function loadDbFromFile(buffer: Uint8Array) {
  const SQL = await getSql();
  dbInstance = new SQL.Database(buffer);
  await persist(dbInstance);
}

async function persist(db: Database) {
  const data = db.export();
  const dbPath = path.join(app.getPath('userData'), DB_FILE);
  await fsp.writeFile(dbPath, data);
}

export async function exec(db: Database, sql: string): Promise<void> {
  db.exec(sql);
  await persist(db);
}

export async function run(db: Database, sql: string, params: any[] = []): Promise<void> {
  const stmt = db.prepare(sql);
  stmt.run(params);
  stmt.free();
  await persist(db);
}

export async function get<T = any>(db: Database, sql: string, params: any[] = []): Promise<T | undefined> {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : undefined;
  stmt.free();
  return row as T | undefined;
}

export async function all<T = any>(db: Database, sql: string, params: any[] = []): Promise<T[]> {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

