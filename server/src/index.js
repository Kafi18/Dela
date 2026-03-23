import './lib/env.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import votingRoutes from './routes/voting.js';
import { pool } from './lib/db.js';
import { ensureSchema } from './lib/bootstrap.js';
import { seed } from './seed.js';

function logErr(label, e) {
  const safe = e?.message ? String(e.message).replace(/[^\x20-\x7E\n]/g, '?') : String(e);
  console.error(`${label} code=${e?.code || 'n/a'} ${safe}`);
}

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'error' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/voting', votingRoutes);

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
  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
  server.on('error', (err) => {
    logErr('HTTP server error:', err);
  });
}

start().catch((e) => logErr('Fatal start():', e));

