import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** server/.env — всегда один и тот же файл, даже если cwd = корень монорепы */
export const SERVER_ENV_PATH = path.resolve(__dirname, '../../.env');

const result = dotenv.config({ path: SERVER_ENV_PATH });

if (result.error) {
  // Файла может не быть — тогда остаются дефолты и переменные окружения ОС
  console.warn(
    `[env] Не удалось загрузить ${SERVER_ENV_PATH}: ${result.error.message}. Скопируйте server/.env.example в server/.env и укажите DB_PASSWORD.`
  );
} else {
  const n = Object.keys(result.parsed || {}).length;
  if (n > 0) {
    console.log(`[env] Загружено переменных из server/.env: ${n}`);
  }
}
