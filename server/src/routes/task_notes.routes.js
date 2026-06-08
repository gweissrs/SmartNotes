'use strict';
const express = require('express');
const pool    = require('../db');
const auth    = require('../middleware/auth');

const router = express.Router();

function fmt(n) {
  return {
    id:        n.id,
    title:     n.title,
    content:   n.content,
    createdAt: n.created_at,
    updatedAt: n.updated_at,
  };
}

/* ── GET /api/task-notes ─────────────────────────────────────── */
router.get('/', auth, async function(req, res) {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0',  10), 0);

    const [result, countRes] = await Promise.all([
      pool.query(
        `SELECT id, user_id, title, content, created_at, updated_at
         FROM task_notes WHERE user_id = $1
         ORDER BY updated_at DESC LIMIT $2 OFFSET $3`,
        [req.userId, limit, offset]
      ),
      pool.query(
        'SELECT COUNT(*)::int AS total FROM task_notes WHERE user_id = $1',
        [req.userId]
      ),
    ]);

    res.json({
      items:  result.rows.map(fmt),
      total:  countRes.rows[0].total,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[TaskNotes] Get error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* ── POST /api/task-notes ────────────────────────────────────── */
router.post('/', auth, async function(req, res) {
  try {
    const { title, content } = req.body;
    const result = await pool.query(
      `INSERT INTO task_notes (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, title, content, created_at, updated_at`,
      [req.userId, title || '', content || '']
    );
    res.status(201).json(fmt(result.rows[0]));
  } catch (err) {
    console.error('[TaskNotes] Create error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* ── PATCH /api/task-notes/:id ───────────────────────────────── */
router.patch('/:id', auth, async function(req, res) {
  try {
    const { title, content } = req.body;
    const setClauses = [];
    const values     = [];
    let   idx        = 1;

    if (title   !== undefined) { setClauses.push(`title   = $${idx++}`); values.push(title); }
    if (content !== undefined) { setClauses.push(`content = $${idx++}`); values.push(content); }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    values.push(req.params.id, req.userId);
    const result = await pool.query(
      `UPDATE task_notes SET ${setClauses.join(', ')}
       WHERE id = $${idx++} AND user_id = $${idx++}
       RETURNING id, user_id, title, content, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nota não encontrada.' });
    }
    res.json(fmt(result.rows[0]));
  } catch (err) {
    console.error('[TaskNotes] Update error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* ── DELETE /api/task-notes/:id ──────────────────────────────── */
router.delete('/:id', auth, async function(req, res) {
  try {
    const result = await pool.query(
      'DELETE FROM task_notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nota não encontrada.' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('[TaskNotes] Delete error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;
