import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool, useEmbeddedDb } from '../lib/db.js';
import { upsertEmbeddedUser } from '../lib/embeddedPersistence.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = '8h';

const demoUsers = [
  {
    id: 1,
    email: 'admin@example.com',
    password: 'admin123',
    fullName: 'Демо Администратор',
    role: 'admin',
    isActive: true
  },
  {
    id: 2,
    email: 'user@example.com',
    password: 'user123',
    fullName: 'Демо Пользователь',
    role: 'user',
    isActive: true
  }
];

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function isDbAuthError(e) {
  return e?.code === '28P01' || e?.routine === 'auth_failed';
}

/** БД недоступна: неверный пароль, не запущен PostgreSQL, нет базы и т.п. */
function isDbUnavailable(e) {
  if (isDbAuthError(e)) return true;
  if (e?.code === 'ECONNREFUSED' || e?.code === 'ENOTFOUND') return true;
  if (e?.code === '3D000') return true; // database does not exist
  return false;
}

// Simple mock captcha validation: expect captcha === "1234"
function validateCaptcha(captcha) {
  return captcha === '1234';
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, captcha } = req.body;

    if (!validateCaptcha(captcha)) {
      return res.status(400).json({ message: 'Неверная капча' });
    }

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'Заполните все поля' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role`,
      [email, passwordHash, fullName, 'user', true]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    if (useEmbeddedDb) {
      // Встроенная БД (pg-mem) живёт в памяти — сохраняем учётку в файл,
      // чтобы она не пропадала после clone/перезапуска.
      upsertEmbeddedUser({
        email: user.email,
        password_hash: passwordHash,
        full_name: user.full_name,
        role: user.role,
        is_active: true,
        created_at: new Date().toISOString()
      });
    }

    res.json({
      token,
      user
    });
  } catch (e) {
    if (isDbUnavailable(e)) {
      const { email, password, fullName } = req.body;
      if (!email || !password || !fullName) {
        return res.status(400).json({ message: 'Заполните все поля' });
      }
      const existing = demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
      }
      const user = {
        id: demoUsers.length + 1,
        email,
        password,
        fullName,
        role: 'user',
        isActive: true
      };
      demoUsers.push(user);
      const token = generateToken(user);
      return res.json({
        token,
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }
      });
    }
    console.error(e);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, captcha } = req.body;

    if (!validateCaptcha(captcha)) {
      return res.status(400).json({ message: 'Неверная капча' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }
    if (!user.is_active) {
      return res.status(403).json({ message: 'Пользователь деактивирован' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (e) {
    if (isDbUnavailable(e)) {
      const { email, password } = req.body;
      const user = demoUsers.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
      if (user && user.password === password) {
        if (!user.isActive) {
          return res.status(403).json({ message: 'Пользователь деактивирован' });
        }
        const token = generateToken(user);
        return res.json({
          token,
          user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }
        });
      }
      // Fallback без БД: разрешаем вход по любым данным, чтобы интерфейс был доступен после clone.
      if (!email || !password) {
        return res.status(400).json({ message: 'Введите email и пароль' });
      }
      const derivedName = String(email).split('@')[0] || 'Пользователь';
      const fallbackUser = {
        id: demoUsers.length + 1000,
        email: String(email),
        fullName: derivedName,
        role: 'user',
        isActive: true
      };
      const token = generateToken(fallbackUser);
      return res.json({
        token,
        user: {
          id: fallbackUser.id,
          email: fallbackUser.email,
          fullName: fallbackUser.fullName,
          role: fallbackUser.role
        },
        warning:
          'Вход выполнен в fallback-режиме без БД. Для реальных аккаунтов настройте server/.env и PostgreSQL.'
      });
    }
    console.error(e);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

