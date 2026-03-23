import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dest = path.join(rootDir, 'server', '.env');

/** Совпадает с docker-compose.yml — не нужно править пароль вручную */
const content = `# Автоматически создано для Docker (npm run env:docker / START_PROJECT.bat)
DELA_EMBEDDED_DB=false
# Пароль совпадает с docker-compose.yml
# Не задавайте DATABASE_URL здесь — старая строка перебивала бы пароль и ломала вход (28P01).
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=shareholder_voting
DB_SSL=false

JWT_SECRET=super_secret_key_change_me
PORT=4000
`;

fs.writeFileSync(dest, content, 'utf8');
process.stdout.write(`[env] Записан server/.env (учётные данные для Docker Postgres)\n`);
