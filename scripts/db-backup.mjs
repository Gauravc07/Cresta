/*
 *   npm run db:backup                         writes backups/cresta-<date>.json
 *   npm run db:restore -- <file> --confirm    upserts a backup into the cresta schema
 *
 * Restore overwrites rows with the same ID and leaves newer rows in place. Admin logins are not in backups.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { restoreAll, writeBackup } from '../server/backup.mjs';
import { closePool } from '../server/db.mjs';

const [mode, file] = process.argv.slice(2);
try {
  if (mode === 'restore') {
    if (!file || !process.argv.includes('--confirm')) throw new Error('Usage: npm run db:restore -- <file> --confirm');
    console.log('Restored rows:', await restoreAll(JSON.parse(await readFile(file, 'utf8'))));
  } else {
    console.log('Backup written:', await writeBackup(process.env.BACKUP_DIR || path.resolve('backups')));
  }
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
