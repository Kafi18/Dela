import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const envPath = path.join(rootDir, 'server', '.env');
const examplePath = path.join(rootDir, 'server', '.env.example');

function log(message) {
  process.stdout.write(`${message}\n`);
}

if (fs.existsSync(envPath)) {
  log('[setup] server/.env already exists, skipping.');
  process.exit(0);
}

if (!fs.existsSync(examplePath)) {
  log('[setup] server/.env.example is missing. Create server/.env manually.');
  process.exit(1);
}

const template = fs.readFileSync(examplePath, 'utf8');
fs.writeFileSync(envPath, template, 'utf8');

log('[setup] Created server/.env from server/.env.example.');
log('[setup] Open server/.env and set DB_PASSWORD before starting backend.');
