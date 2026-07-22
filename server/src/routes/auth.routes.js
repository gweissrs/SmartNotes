'use strict';
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const auth    = require('../middleware/auth');

const router = express.Router();

function makeToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function formatUser(u) {
  return {
    id:       u.id,
    name:     u.fname + ' ' + u.lname,
    fname:    u.fname,
    lname:    u.lname,
    email:    u.email,
    colorIdx: u.color_idx,
    theme:    u.theme,
  };
}

/* ── POST /api/auth/register ─────────────────────────────────── */
router.post('/register', async function(req, res) {
  try {
    const { fname, lname, email, password } = req.body;

    if (!fname || !lname || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    const exists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const hash   = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (fname, lname, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, fname, lname, email, color_idx, theme`,
      [fname.trim(), lname.trim(), email.toLowerCase().trim(), hash]
    );

    const user  = result.rows[0];
    const token = makeToken(user.id);
    res.status(201).json({ token, user: formatUser(user) });

  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* ── POST /api/auth/login ────────────────────────────────────── */
router.post('/login', async function(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const result = await pool.query(
      `SELECT id, fname, lname, email, password_hash, color_idx, theme
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const user  = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = makeToken(user.id);
    res.json({ token, user: formatUser(user) });

  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* ── GET /api/auth/me ────────────────────────────────────────── */
router.get('/me', auth, async function(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, fname, lname, email, color_idx, theme FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    res.json(formatUser(result.rows[0]));

  } catch (err) {
    console.error('[Auth] Me error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;
