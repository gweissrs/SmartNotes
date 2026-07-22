'use strict';
const express = require('express');
const pool    = require('../db');
const auth    = require('../middleware/auth');

const router = express.Router();

function fmtBoard(b) {
  return {
    id:        b.id,
    name:      b.name,
    position:  b.position,
    noteCount: parseInt(b.note_count || 0, 10),
    createdAt: b.created_at,
  };
}

/* ── GET /api/boards ─────────────────────────────────────────── */
router.get('/', auth, async function(req, res) {
  try {
    const result = await pool.query(
      `SELECT b.id, b.name, b.position, b.created_at,
              COUNT(n.id)::int AS note_count
       FROM   boards b
       LEFT JOIN notes n ON n.board_id = b.id
       WHERE  b.user_id = $1
       GROUP  BY b.id
       ORDER  BY b.position ASC, b.created_at ASC`,
      [req.userId]
    );
    res.json(result.rows.map(fmtBoard));

  } catch (err) {
    console.error('[Boards] Get error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* ── POST /api/boards ────────────────────────────────────────── */
router.post('/', auth, async function(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome do quadro é obrigatório.' });
    }

    // Próxima posição
    const posRes = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM boards WHERE user_id = $1',
      [req.userId]
    );
    const nextPos = posRes.rows[0].next_pos;

    const result = await pool.query(
      `INSERT INTO boards (user_id, name, position)
       VALUES ($1, $2, $3)
       RETURNING id, name, position, created_at, 0::int AS note_count`,
      [req.userId, name.trim(), nextPos]
    );

    res.status(201).json(fmtBoard(result.rows[0]));

  } catch (err) {
    console.error('[Boards] Create error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* ── PATCH /api/boards/:id ───────────────────────────────────── */
router.patch('/:id', auth, async function(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório.' });
    }

    const result = await pool.query(
      `UPDATE boards SET name = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, name, position, created_at, 0::int AS note_count`,
      [name.trim(), req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quadro não encontrado.' });
    }
    res.json(fmtBoard(result.rows[0]));

  } catch (err) {
    console.error('[Boards] Update error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* ── DELETE /api/boards/:id ──────────────────────────────────── */
router.delete('/:id', auth, async function(req, res) {
  try {
    const result = await pool.query(
      'DELETE FROM boards WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quadro não encontrado.' });
    }
    res.status(204).send();

  } catch (err) {
    console.error('[Boards] Delete error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;
