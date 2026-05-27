'use strict';
const express = require('express');
const pool    = require('../db');
const auth    = require('../middleware/auth');

const router = express.Router();

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

/* ── GET /api/profile ────────────────────────────────────────── */
router.get('/', auth, async function(req, res) {
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
    console.error('[Profile] Get error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* ── PATCH /api/profile ──────────────────────────────────────── */
router.patch('/', auth, async function(req, res) {
  try {
    const { fname, lname, email, colorIdx, theme } = req.body;

    const setClauses = [];
    const values     = [];
    let   idx        = 1;

    if (fname    !== undefined) { setClauses.push(`fname     = $${idx++}`); values.push(fname.trim()); }
    if (lname    !== undefined) { setClauses.push(`lname     = $${idx++}`); values.push(lname.trim()); }
    if (email    !== undefined) { setClauses.push(`email     = $${idx++}`); values.push(email.toLowerCase().trim()); }
    if (colorIdx !== undefined) { setClauses.push(`color_idx = $${idx++}`); values.push(Number(colorIdx)); }
    if (theme    !== undefined) { setClauses.push(`theme     = $${idx++}`); values.push(theme); }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    values.push(req.userId);
    const result = await pool.query(
      `UPDATE users SET ${setClauses.join(', ')}
       WHERE id = $${idx}
       RETURNING id, fname, lname, email, color_idx, theme`,
      values
    );

    res.json(formatUser(result.rows[0]));

  } catch (err) {
    console.error('[Profile] Update error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;
