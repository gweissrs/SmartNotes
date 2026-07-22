'use strict';
require('dotenv').config();
const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL || '';
// Conexão interna Railway (.railway.internal) não precisa de SSL
const isRailwayInternal = dbUrl.includes('.railway.internal');
const isProd = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isProd && !isRailwayInternal ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', function(err) {
  console.error('[DB] Erro inesperado no pool:', err.message);
});

module.exports = pool;
