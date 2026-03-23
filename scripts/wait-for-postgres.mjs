import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, 'server', '.env');

let host = 'localhost';
let port = 5432;

if (fs.existsSync(envPath)) {
  const txt = fs.readFileSync(envPath, 'utf8');
  for (const line of txt.split(/\n')) {
    const t = line.trim();
    if (t.startsWith('#') || !t) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim();
    if (key === 'DB_HOST') host = val;
    if (key === 'DB_PORT') port = parseInt(val, 10) || 5432;
  }
}

function tryConnect() {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.end();
      resolve();
    });
    socket.setTimeout(2000);
    socket.on('error', reject);
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('timeout'));
    });
  });
}

const deadline = Date.now() + 90_000;
process.stdout.write(`[db] Ожидаю PostgreSQL на ${host}:${port}...\n`);

while (Date.now() < deadline) {
  try {
    await tryConnect();
    process.stdout.write(`[db] PostgreSQL доступен.\n`);
    process.exit(0);
  } catch {
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 1000));
  }
}

process.stderr.write(`\n[db] Таймаут: не удалось подключиться к ${host}:${port}. Запустите: npm run db:up\n`);
process.exit(1);
