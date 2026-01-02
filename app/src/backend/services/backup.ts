import path from 'node:path';
import fs from 'node:fs/promises';
import { app } from 'electron';
import { exportDb, loadDbFromFile } from '../db/connection';
import { ensureSchema } from '../db/schema';

const BACKUP_DIR = 'backups';

export async function backupDatabase(targetPath?: string) {
  const data = await exportDb();
  const dir =
    targetPath && path.extname(targetPath)
      ? path.dirname(targetPath)
      : path.join(app.getPath('documents'), 'DiscoInventoryBackups');
  await fs.mkdir(dir, { recursive: true });
  const file =
    targetPath && path.extname(targetPath)
      ? targetPath
      : path.join(dir, `disco-inventory-${Date.now()}.db`);
  await fs.writeFile(file, Buffer.from(data));
  return file;
}

export async function restoreDatabase(fromPath: string) {
  const file = await fs.readFile(fromPath);
  await loadDbFromFile(new Uint8Array(file));
  await ensureSchema();
  return true;
}

