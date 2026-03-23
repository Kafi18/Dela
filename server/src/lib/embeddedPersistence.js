import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Хранилище для встроенной БД (pg-mem): чтобы аккаунты и голоса
 * не терялись при новом clone / перезапуске.
 *
 * Файл лежит в профиле пользователя Windows (AppData), поэтому переживает
 * клонирование репозитория в другую папку.
 */

function getDataFile() {
  const base =
    process.env.APPDATA ||
    process.env.LOCALAPPDATA ||
    path.join(os.homedir(), 'AppData', 'Roaming');
  return path.join(base, 'Dela', 'embedded-db.json');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadState() {
  const file = getDataFile();
  try {
    const txt = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(txt);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      votes: Array.isArray(parsed.votes) ? parsed.votes : []
    };
  } catch {
    return { users: [], votes: [] };
  }
}

function saveState(state) {
  const file = getDataFile();
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
}

export function upsertEmbeddedUser(user) {
  const state = loadState();
  const email = String(user.email || '').toLowerCase();
  if (!email) return;

  const idx = state.users.findIndex((u) => String(u.email).toLowerCase() === email);
  const normalized = {
    email,
    password_hash: String(user.password_hash),
    full_name: String(user.full_name || ''),
    role: user.role || 'user',
    is_active: Boolean(user.is_active),
    created_at: user.created_at || new Date().toISOString()
  };

  if (idx >= 0) state.users[idx] = normalized;
  else state.users.push(normalized);

  saveState(state);
}

export function upsertEmbeddedVote(vote) {
  const state = loadState();
  const user_email = String(vote.user_email || '').toLowerCase();
  const topic_id = Number(vote.topic_id);
  if (!user_email || !Number.isFinite(topic_id)) return;

  const key = (v) => `${String(v.user_email).toLowerCase()}:${Number(v.topic_id)}`;
  const idx = state.votes.findIndex((v) => key(v) === `${user_email}:${topic_id}`);

  const normalized = {
    user_email,
    topic_id,
    choice: vote.choice,
    created_at: vote.created_at || new Date().toISOString(),
    updated_at: vote.updated_at || null
  };

  if (idx >= 0) state.votes[idx] = normalized;
  else state.votes.push(normalized);

  saveState(state);
}

export async function applyEmbeddedPersistenceToDb(pool) {
  const state = loadState();
  if (!state.users.length && !state.votes.length) return;

  // 1) Пользователи
  const emailToId = new Map();

  for (const u of state.users) {
    const email = String(u.email).toLowerCase();
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [email, u.password_hash, u.full_name, u.role, u.is_active, u.created_at]
      );
    }
    const idRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (idRes.rows[0]?.id) emailToId.set(email, idRes.rows[0].id);
  }

  // 2) Голоса
  for (const v of state.votes) {
    const user_email = String(v.user_email).toLowerCase();
    const userId = emailToId.get(user_email);
    if (!userId) continue;

    const exists = await pool.query(
      'SELECT id FROM votes WHERE user_id = $1 AND topic_id = $2',
      [userId, v.topic_id]
    );
    if (exists.rows.length > 0) continue;

    await pool.query(
      `INSERT INTO votes (user_id, topic_id, choice, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, v.topic_id, v.choice, v.created_at, v.updated_at]
    );
  }
}

