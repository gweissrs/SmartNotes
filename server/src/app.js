'use strict';
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const pool    = require('./db');

const authRoutes    = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const boardsRoutes  = require('./routes/boards.routes');
const notesRoutes   = require('./routes/notes.routes');

const app  = express();
const PORT = process.env.PORT || 3001;

/* ── CORS ─────────────────────────────────────────────────────
   Em produção, ALLOWED_ORIGINS define quais domínios podem
   chamar a API (ex: https://smartnotes.netlify.app).
   Localmente, permite tudo.
─────────────────────────────────────────────────────────────── */
var allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(function(o) { return o.trim(); })
  : null;

app.use(cors({
  origin: allowedOrigins
    ? function(origin, callback) {
        // Permite requisições sem origin (mobile, curl, Postman)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('CORS bloqueado para: ' + origin));
        }
      }
    : true,
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

/* ── Logging ──────────────────────────────────────────────── */
app.use(function(req, _res, next) {
  console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.path);
  next();
});

/* ── Health check ─────────────────────────────────────────── */
app.get('/api/health', async function(_req, res) {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', env: process.env.NODE_ENV || 'development', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: err.message });
  }
});

/* ── Rotas ────────────────────────────────────────────────── */
app.use('/api/auth',    authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/boards',  boardsRoutes);
app.use('/api',         notesRoutes);

/* ── 404 ──────────────────────────────────────────────────── */
app.use(function(_req, res) {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

/* ── Error handler ────────────────────────────────────────── */
app.use(function(err, _req, res, _next) {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

/* ── Start ────────────────────────────────────────────────── */
app.listen(PORT, function() {
  console.log('');
  console.log('  🚀  SmartNotes API rodando');
  console.log('  ➜   http://localhost:' + PORT + '/api/health');
  console.log('  ENV: ' + (process.env.NODE_ENV || 'development'));
  console.log('');
});

module.exports = app;
