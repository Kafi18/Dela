import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dest = path.join(rootDir, 'server', '.env');

const force = process.argv.includes('--force');

const content = `# Встроенная БД (pg-mem) — clone и запуск без PostgreSQL/Docker
DELA_EMBEDDED_DB=true
JWT_SECRET=super_secret_key_change_me
PORT=4000
`;

if (fs.existsSync(dest) && !force) {
  process.stdout.write('[env] server/.env уже есть — пропуск (для перезаписи: npm run env:embedded -- --force)\n');
  process.exit(0);
}

fs.writeFileSync(dest, content, 'utf8');
process.stdout.write('[env] Создан server/.env для встроенной БД (DELA_EMBEDDED_DB=true)\n');
