/*
 * Creates/updates the `cresta` schema and seeds starter content.
 *
 *   npm run db:migrate                 # schema + any missing starter rows (keeps edits made in the admin)
 *   npm run db:migrate -- --schema-only
 *   npm run db:migrate -- --reseed     # also overwrite existing rows with the seed values
 *
 * Needs SUPABASE_DB_URL in .env. Touches ONLY the `cresta` schema.
 */
import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';
import {
  SETTINGS, CATEGORIES, PRODUCTS, FRP_COLLECTIONS, FRP_MODELS, DOWNLOADS,
  DEFAULT_BANNERS,
} from '../src/data/seed.js';
import { ARTICLES } from './seed-articles.mjs';

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('SUPABASE_DB_URL is missing. Add it to .env (never prefix it with VITE_).');
  process.exit(1);
}
const schemaOnly = process.argv.includes('--schema-only');
const reseed = process.argv.includes('--reseed');

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function upsert(table, rows, columns) {
  if (!rows.length) return 0;
  const cols = columns.map((c) => `"${c}"`).join(', ');
  const updates = columns.filter((c) => c !== 'id' && c !== 'key')
    .map((c) => `"${c}" = excluded."${c}"`).join(', ');
  const pk = columns.includes('key') ? 'key' : 'id';
  for (const row of rows) {
    const values = columns.map((c) => row[c] ?? null);
    const params = columns.map((_, i) => `$${i + 1}`).join(', ');
    await client.query(
      `insert into cresta.${table} (${cols}) values (${params})
       on conflict ("${pk}") do ${reseed ? `update set ${updates}` : 'nothing'}`,
      values,
    );
  }
  return rows.length;
}

try {
  await client.connect();
  const dir = new URL('../supabase/migrations/', import.meta.url);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

  await client.query('begin');
  for (const f of files) {
    await client.query(await readFile(new URL(f, dir), 'utf8'));
    console.log(`✓ applied ${f}`);
  }

  if (!schemaOnly) {
    const settings = Object.entries(SETTINGS).map(([key, value]) => ({ key, value }));
    const counts = {
      settings: await upsert('settings', settings, ['key', 'value']),
      categories: await upsert('categories', CATEGORIES, ['id', 'name', 'blurb', 'sort']),
      products: await upsert('products', PRODUCTS, ['id', 'category_id', 'label', 'name', 'description', 'image_path', 'is_photo', 'datasheet_url', 'sort', 'is_published']),
      frp_collections: await upsert('frp_collections', FRP_COLLECTIONS, ['id', 'name', 'blurb', 'sort']),
      frp_models: await upsert('frp_models', FRP_MODELS, ['id', 'collection_id', 'width_ft', 'length_ft', 'sort', 'is_published']),
      downloads: await upsert('downloads', DOWNLOADS, ['id', 'title', 'subtitle', 'url', 'category', 'featured', 'sort', 'is_published']),
    };
    for (const [t, n] of Object.entries(counts)) console.log(`✓ checked ${String(n).padStart(3)} seed rows → cresta.${t}`);

    // Starter homepage banner and articles, only where there is nothing yet.
    const { rows: [{ n: bannerCount }] } = await client.query('select count(*)::int n from cresta.banners');
    if (!bannerCount) {
      for (const [i, b] of DEFAULT_BANNERS.entries()) {
        await client.query(
          'insert into cresta.banners (eyebrow, title, subtitle, image_path, image_alt, cta_label, cta_url, sort) values ($1, $2, $3, $4, $5, $6, $7, $8)',
          [b.eyebrow, b.title, b.subtitle, b.image_path, b.image_alt, b.cta_label, b.cta_url, i],
        );
      }
    }
    for (const a of ARTICLES) {
      await client.query(
        `insert into cresta.blogs (slug, title, category, excerpt, image_path, image_alt, content, meta_title, meta_description, status, published_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published', now()) on conflict (slug) do nothing`,
        [a.slug, a.title, a.category, a.excerpt, a.image_path, a.image_alt, a.content, a.meta_title, a.meta_description],
      );
    }
  }
  await client.query('commit');

  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema = 'cresta' order by 1",
  );
  console.log('Tables in cresta:', rows.map((r) => r.table_name).join(', '));
} catch (err) {
  await client.query('rollback').catch(() => {});
  console.error('✗ Migration failed — nothing was changed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
