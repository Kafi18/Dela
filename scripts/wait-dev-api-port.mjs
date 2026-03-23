/**
 * Ждёт появления .dev-api-port (пишет сервер после listen).
 * Убирает гонку: Vite не стартует, пока неизвестен реальный порт API.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const portFile = path.join(rootDir, '.dev-api-port');

const deadline = Date.now() + 60_000;
let dots = 0;

while (Date.now() < deadline) {
  try {
    if (fs.existsSync(portFile)) {
      const n = parseInt(fs.readFileSync(portFile, 'utf8').trim(), 10);
      if (Number.isInteger(n) && n > 0 && n < 65536) {
        process.stdout.write(`\n[dev] API порт из .dev-api-port: ${n}\n`);
        process.exit(0);
      }
    }
  } catch {
    /* ignore */
  }
  process.stdout.write(dots++ % 10 === 0 ? '.' : '');
  await new Promise((r) => setTimeout(r, 200));
}

process.stderr.write(
  '\n[dev] Таймаут: не появился .dev-api-port. Запустите сначала backend (npm run dev:server).\n'
);
process.exit(1);
