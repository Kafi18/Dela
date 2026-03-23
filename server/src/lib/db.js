import './env.js';
import pg from 'pg';

const { Pool } = pg;

// Подключение по явным параметрам, чтобы пароль всегда был строкой (избегаем ошибки pg "password must be a string")
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD ?? ''),
  database: process.env.DB_NAME || 'shareholder_voting',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// DATABASE_URL только если нет явных настроек в .env (иначе старый URL перебивает DB_PASSWORD и ломает Docker)
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
    // оставляем dbConfig как есть
  }
}

export const pool = new Pool({
  ...dbConfig,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

pool.on('error', (err) => {
  const safe = err?.message ? String(err.message).replace(/[^\x20-\x7E]/g, '?') : String(err);
  console.error(`[pg pool] idle client error code=${err?.code || 'n/a'} ${safe}`);
});

