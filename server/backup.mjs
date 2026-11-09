/* JSON backup and restore of the `cresta` schema. Admin accounts and sessions are deliberately excluded. */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { query, tx } from './db.mjs';

export const BACKUP_TABLES = ['settings', 'categories', 'products', 'frp_collections', 'frp_models', 'downloads', 'enquiries', 'blogs', 'projects', 'testimonials', 'banners', 'redirects', 'media'];
const PRIMARY_KEY = { settings: 'key', redirects: 'from_path' };

export async function dumpAll() {
  const tables = {};
  for (const t of BACKUP_TABLES) {
    // to_jsonb stores bytea as \x hex text, which restore reads back losslessly.
    const { rows } = await query(`select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) as rows from cresta.${t} x`);
    tables[t] = rows[0].rows;
  }
  return { app: 'cresta', created_at: new Date().toISOString(), tables };
}

/** Upserts every row in the backup. Rows added since the backup are left in place. */
export async function restoreAll(backup) {
  if (backup?.app !== 'cresta' || !backup.tables) throw new Error('This is not a Cresta backup file.');
  return tx(async (client) => {
    const counts = {};
    for (const t of BACKUP_TABLES) {
      const rows = backup.tables[t];
      if (!rows?.length) { counts[t] = 0; continue; }
      const pk = PRIMARY_KEY[t] ?? 'id';
      const { rows: cols } = await client.query(
        `select column_name from information_schema.columns where table_schema = 'cresta' and table_name = $1`, [t],
      );
      const names = cols.map((c) => `"${c.column_name}"`);
      const updates = cols.filter((c) => c.column_name !== pk).map((c) => `"${c.column_name}" = excluded."${c.column_name}"`).join(', ');
      await client.query(
        `insert into cresta.${t} (${names.join(', ')})
         select ${names.join(', ')} from jsonb_populate_recordset(null::cresta.${t}, $1::jsonb)
         on conflict ("${pk}") do update set ${updates}`,
        [JSON.stringify(rows)],
      );
      counts[t] = rows.length;
    }
    return counts;
  });
}

/** Writes backups/cresta-<date>.json and keeps the newest `keep` files. */
export async function writeBackup(dir, keep = 14) {
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `cresta-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`);
  await writeFile(file, JSON.stringify(await dumpAll()));
  const old = (await readdir(dir)).filter((f) => /^cresta-.*\.json$/.test(f)).sort().reverse().slice(keep);
  await Promise.all(old.map((f) => rm(path.join(dir, f))));
  return file;
}
