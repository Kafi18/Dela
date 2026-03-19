import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

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

// Если задан полный URL — используем его, но подставляем пароль строкой (на случай пустого .env)
if (process.env.DATABASE_URL) {
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

export const pool = new Pool(dbConfig);

