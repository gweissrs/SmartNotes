'use strict';

/* ============================================================
   MAIN.JS — Inicialização do app (carrega boards da API)
   ============================================================ */

extTrigger.style.display = 'none';

/* ── Carrega boards do servidor ──────────────────────────────── */
API.getBoards()
  .then(function(apiBoards) {

    if (!apiBoards || apiBoards.length === 0) {
      /* Nenhum board no servidor — cria o padrão */
      return addBoard('Quadro Principal').then(function(board) {
        switchBoard(board.id);
      });
    }

    /* Registra todos os boards (notas carregam lazy via switchBoard) */
    apiBoards.forEach(function(b) {
      initBoardFromAPI(b);
    });

    /* Abre o primeiro board */
    switchBoard(apiBoards[0].id);
  })
  .catch(function(err) {
    console.warn('[Main] API indisponível — modo offline:', err && err.message);

    /* Fallback: cria um board em memória sem persistência */
    var offlineBoard = {
      id:          crypto.randomUUID(),
      name:        'Quadro Principal',
      notes:       [],
      notesLoaded: true,
      undoStack:   [],
      redoStack:   [],
    };
    boards.push(offlineBoard);
    createBoardNavItem(offlineBoard);
    switchBoard(offlineBoard.id);

    /* Aviso visual discreto */
    var warn = document.createElement('div');
    warn.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#fce8e6;border:1px solid #f5c6c2;color:#c5221f;padding:8px 16px;border-radius:6px;font-size:.8rem;z-index:9999;pointer-events:none;';
    warn.textContent   = '⚠️ Servidor offline — dados não serão salvos';
    document.body.appendChild(warn);
    setTimeout(function() { if (warn.parentNode) warn.parentNode.removeChild(warn); }, 5000);
  });
