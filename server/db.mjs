/* Postgres access for the Cresta server. Every statement names the `cresta` schema explicitly. */
import pg from 'pg';

let pool = null;

export function getPool() {
  if (!process.env.SUPABASE_DB_URL) return null;
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      statement_timeout: 15_000,
    });
    // Without this handler a dropped idle connection would crash the process.
    pool.on('error', (err) => console.error('[db] idle connection error:', err.message));
  }
  return pool;
}

export async function query(sql, params) {
  const p = getPool();
  if (!p) throw new Error('SUPABASE_DB_URL is not set');
  return p.query(sql, params);
}

export async function tx(fn) {
  const p = getPool();
  if (!p) throw new Error('SUPABASE_DB_URL is not set');
  const client = await p.connect();
  try {
    await client.query('begin');
    const out = await fn(client);
    await client.query('commit');
    return out;
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool() {
  if (pool) await pool.end();
  pool = null;
}
