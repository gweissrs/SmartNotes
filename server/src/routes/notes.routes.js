'use strict';
const express = require('express');
const pool    = require('../db');
const auth    = require('../middleware/auth');

const router = express.Router();

function fmtNote(n) {
  return {
    id:        n.id,
    boardId:   n.board_id,
    text:      n.text,
    colorIdx:  n.color_idx,
    boardX:    n.board_x,
    boardY:    n.board_y,
    boardW:    n.board_w,
    boardH:    n.board_h,
    createdAt: n.created_at,
  };
}

/* ── GET /api/boards/:boardId/notes ──────────────────────────── */
router.get('/boards/:boardId/notes', auth, async function(req, res) {
  try {
    // Verifica que o quadro pertence ao usuário
    const board = await pool.query(
      'SELECT id FROM boards WHERE id = $1 AND user_id = $2',
      [req.params.boardId, req.userId]
    );
    if (board.rows.length === 0) {
      return res.status(404).json({ error: 'Quadro não encontrado.' });
    }

    const result = await pool.query(
      `SELECT * FROM notes
       WHERE board_id = $1 AND user_id = $2
       ORDER BY created_at ASC`,
      [req.params.boardId, req.userId]
    );

    res.json(result.rows.map(fmtNote));

  } catch (err) {
    console.error('[Notes] Get error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* ── POST /api/boards/:boardId/notes ─────────────────────────── */
router.post('/boards/:boardId/notes', auth, async function(req, res) {
  try {
    const board = await pool.query(
      'SELECT id FROM boards WHERE id = $1 AND user_id = $2',
      [req.params.boardId, req.userId]
    );
    if (board.rows.length === 0) {
      return res.status(404).json({ error: 'Quadro não encontrado.' });
    }

    const { text, colorIdx, x, y, w, h } = req.body;

    const result = await pool.query(
      `INSERT INTO notes (board_id, user_id, text, color_idx, board_x, board_y, board_w, board_h)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.params.boardId,
        req.userId,
        text     || '',
        colorIdx != null ? Number(colorIdx) : 0,
        x        != null ? Number(x)        : 100,
        y        != null ? Number(y)        : 100,
        w        != null ? Number(w)        : 220,
        h        != null ? Number(h)        : 90,
      ]
    );

    res.status(201).json(fmtNote(result.rows[0]));

  } catch (err) {
    console.error('[Notes] Create error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* ── PATCH /api/notes/:id ────────────────────────────────────── */
router.patch('/notes/:id', auth, async function(req, res) {
  try {
    const { text, colorIdx, x, y, w, h } = req.body;

    const setClauses = [];
    const values     = [];
    let   idx        = 1;

    if (text     !== undefined) { setClauses.push(`text     = $${idx++}`); values.push(text); }
    if (colorIdx !== undefined) { setClauses.push(`color_idx= $${idx++}`); values.push(Number(colorIdx)); }
    if (x        !== undefined) { setClauses.push(`board_x  = $${idx++}`); values.push(Number(x)); }
    if (y        !== undefined) { setClauses.push(`board_y  = $${idx++}`); values.push(Number(y)); }
    if (w        !== undefined) { setClauses.push(`board_w  = $${idx++}`); values.push(Number(w)); }
    if (h        !== undefined) { setClauses.push(`board_h  = $${idx++}`); values.push(Number(h)); }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    values.push(req.params.id, req.userId);
    const result = await pool.query(
      `UPDATE notes SET ${setClauses.join(', ')}
       WHERE id = $${idx++} AND user_id = $${idx++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nota não encontrada.' });
    }
    res.json(fmtNote(result.rows[0]));

  } catch (err) {
    console.error('[Notes] Update error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/* ── DELETE /api/notes/:id ───────────────────────────────────── */
router.delete('/notes/:id', auth, async function(req, res) {
  try {
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nota não encontrada.' });
    }
    res.status(204).send();

  } catch (err) {
    console.error('[Notes] Delete error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;
