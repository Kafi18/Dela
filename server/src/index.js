import './lib/env.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import votingRoutes from './routes/voting.js';
import { pool, useEmbeddedDb } from './lib/db.js';
import { ensureSchema } from './lib/bootstrap.js';
import { seed } from './seed.js';
import { applyEmbeddedPersistenceToDb } from './lib/embeddedPersistence.js';
import { promoteBuiltInAdmins } from './lib/promoteAdmins.js';

function logErr(label, e) {
  const safe = e?.message ? String(e.message).replace(/[^\x20-\x7E\n]/g, '?') : String(e);
  console.error(`${label} code=${e?.code || 'n/a'} ${safe}`);
}

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const portFile = path.join(repoRoot, '.dev-api-port');

const app = express();
const preferredPort = parseInt(process.env.PORT || '4000', 10);
/** Фактический порт после listenWithFallback (для /api/health) */
let actualListenPort = preferredPort;

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', embeddedDb: useEmbeddedDb, port: actualListenPort });
  } catch (e) {
    res.status(500).json({ status: 'error', embeddedDb: useEmbeddedDb });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/voting', votingRoutes);

/**
 * Если порт занят (два окна бэкенда), пробуем следующие — без ручного taskkill.
 */
async function listenWithFallback(expressApp, firstPort) {
  const max = firstPort + 30;
  for (let p = firstPort; p < max; p++) {
    const server = http.createServer(expressApp);
    try {
      await new Promise((resolve, reject) => {
        const onErr = (err) => {
          server.removeListener('error', onErr);
          reject(err);
        };
        server.once('error', onErr);
        server.listen(p, '0.0.0.0', () => {
          server.removeListener('error', onErr);
          resolve();
        });
      });
      try {
        fs.writeFileSync(portFile, String(p), 'utf8');
      } catch (e) {
        console.warn('[server] не удалось записать .dev-api-port:', e.message);
      }
      actualListenPort = p;
      if (p !== firstPort) {
        console.log(`[server] Порт ${firstPort} занят — используется ${p} (Vite читает .dev-api-port)`);
      }
      console.log(`Server listening on port ${p}`);
      return server;
    } catch (e) {
      if (e.code !== 'EADDRINUSE') throw e;
      await new Promise((resolve) => server.close(() => resolve()));
    }
  }
  throw new Error(`Нет свободного порта в диапазоне ${firstPort}-${max - 1}`);
}

async function start() {
  try {
    await ensureSchema();
  } catch (e) {
    logErr('Schema init error:', e);
  }
  try {
    await seed();
  } catch (e) {
    logErr('Seed error:', e);
  }
  if (useEmbeddedDb) {
    try {
      await applyEmbeddedPersistenceToDb(pool);
    } catch (e) {
      logErr('Embedded persistence error:', e);
    }
  }
  try {
    await promoteBuiltInAdmins(pool);
  } catch (e) {
    logErr('promoteBuiltInAdmins error:', e);
  }
  const server = await listenWithFallback(app, preferredPort);
  server.on('error', (err) => logErr('HTTP server error:', err));
}

start().catch((e) => logErr('Fatal start():', e));
