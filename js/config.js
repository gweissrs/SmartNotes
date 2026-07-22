'use strict';

/* ============================================================
   CONFIG.JS — URL da API por ambiente
   - Localhost  → servidor local (porta 3001)
   - Produção   → URL do Railway (atualizar após deploy)
   ============================================================ */
(function() {
  var isLocal = window.location.hostname === 'localhost'
             || window.location.hostname === '127.0.0.1'
             || window.location.protocol === 'file:';

  window.SN_API_BASE = isLocal
    ? 'http://localhost:3001/api'
    : 'https://smartnotes-production.up.railway.app/api';
})();
