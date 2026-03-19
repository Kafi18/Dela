import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../lib/db.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = '8h';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
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

    res.json({
      token,
      user
    });
  } catch (e) {
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
    console.error(e);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

