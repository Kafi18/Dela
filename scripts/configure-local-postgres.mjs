/**
 * Настраивает server/.env под ЛОКАЛЬНЫЙ PostgreSQL (Windows / без Docker).
 * Пароль передаётся только в командной строке или через переменную окружения.
 *
 * npm run env:localpg -- ВАШ_ПАРОЛЬ
 *   или
 * $env:POSTGRES_PASSWORD='ВАШ_ПАРОЛЬ'; npm run env:localpg
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, 'server', '.env');

const password =
  process.argv[2] ||
  process.env.POSTGRES_PASSWORD ||
  process.env.PGPASSWORD ||
  '';

if (!password) {
  process.stderr.write(
    `Укажите пароль пользователя postgres для вашего локального PostgreSQL:\n\n` +
      `  npm run env:localpg -- ВАШ_ПАРОЛЬ\n\n` +
      `или в PowerShell:\n` +
      `  $env:POSTGRES_PASSWORD='ВАШ_ПАРОЛЬ'; npm run env:localpg\n`
  );
  process.exit(1);
}

const psqlCandidates = [
  'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
  'psql'
];

function findPsql() {
  for (const p of psqlCandidates) {
    if (p === 'psql') return 'psql';
    if (fs.existsSync(p)) return p;
  }
  return 'psql';
}

const psql = findPsql();

function escapeEnvValue(val) {
  const s = String(val);
  if (/[\s#'"]/u.test(s)) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return s.replace(/\n/g, '');
}

const envBlock = `# Локальный PostgreSQL (npm run env:localpg)
DELA_EMBEDDED_DB=false
# Не задавайте DATABASE_URL — используйте только DB_* ниже.
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=${escapeEnvValue(password)}
DB_NAME=shareholder_voting
DB_SSL=false

JWT_SECRET=super_secret_key_change_me
PORT=4000
`;

fs.writeFileSync(envPath, envBlock, 'utf8');
process.stdout.write(`[env] Записан server/.env (локальный Postgres, пользователь postgres)\n`);

const runPsql = (sql) => {
  const r = spawnSync(
    psql,
    [
      '-h',
      'localhost',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-t',
      '-A',
      '-c',
      sql
    ],
    {
      encoding: 'utf8',
      env: { ...process.env, PGPASSWORD: password, PGCLIENTENCODING: 'UTF8' }
    }
  );
  return r;
};

let r = runPsql(
  "SELECT COUNT(*)::text FROM pg_database WHERE datname = 'shareholder_voting'"
);
if (r.status !== 0) {
  process.stderr.write(`[db] Проверка подключения не удалась:\n${r.stderr || r.stdout}\n`);
  process.exit(1);
}

const count = (r.stdout || '').trim();
if (count !== '1') {
  r = runPsql('CREATE DATABASE shareholder_voting');
  if (r.status !== 0) {
    process.stderr.write(`[db] CREATE DATABASE не удалось:\n${r.stderr || r.stdout}\n`);
    process.exit(1);
  }
  process.stdout.write(`[db] Создана база shareholder_voting\n`);
} else {
  process.stdout.write(`[db] База shareholder_voting уже есть\n`);
}

process.stdout.write(`\nГотово. Запустите: npm run dev:server  и проверьте http://localhost:4000/api/health\n`);
