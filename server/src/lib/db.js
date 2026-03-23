import './env.js';
import pg from 'pg';
import { newDb } from 'pg-mem';

const { Pool: PgPool } = pg;

const hasExplicitPgEnv = Boolean(
  process.env.DB_HOST ||
    process.env.DB_USER ||
    (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== '') ||
    process.env.DB_NAME ||
    process.env.DB_PORT
);

const forcePostgres = process.env.DELA_EMBEDDED_DB === 'false';

/**
 * Встроенная БД: clone без Postgres. Если в .env заданы DB_* — считаем, что нужен настоящий PostgreSQL.
 */
export const useEmbeddedDb =
  !forcePostgres && (process.env.DELA_EMBEDDED_DB === 'true' || !hasExplicitPgEnv);

let pool;

if (useEmbeddedDb) {
  console.log('[db] Режим встроенной БД (pg-mem) — установка PostgreSQL не требуется.');
  const mem = newDb();
  const { Pool: MemPool } = mem.adapters.createPg();
  pool = new MemPool();
} else {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD ?? ''),
    database: process.env.DB_NAME || 'shareholder_voting',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };

  const hasExplicitDbEnv = Boolean(
    process.env.DB_HOST ||
      process.env.DB_USER ||
      (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== '') ||
      process.env.DB_NAME ||
      process.env.DB_PORT
  );

  if (process.env.DATABASE_URL && !hasExplicitDbEnv) {
    try {
      const u = new URL(process.env.DATABASE_URL);
      dbConfig.user = u.username;
      dbConfig.password = String(u.password ?? '');
      dbConfig.host = u.hostname;
      dbConfig.port = parseInt(u.port || '5432', 10);
      dbConfig.database = u.pathname.replace(/^\//, '') || 'shareholder_voting';
    } catch (_) {
      // ignore
    }
  }

  pool = new PgPool({
    ...dbConfig,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  });

  pool.on('error', (err) => {
    const safe = err?.message ? String(err.message).replace(/[^\x20-\x7E]/g, '?') : String(err);
    console.error(`[pg pool] idle client error code=${err?.code || 'n/a'} ${safe}`);
  });
}

export { pool };
