'use strict';

/* ============================================================
   MAIN.JS — Inicialização do app (carrega boards da API)
   ============================================================ */

extTrigger.style.display = 'none';

/* ── Carrega boards do servidor ──────────────────────────────── */
API.getBoards()
  .then(function(apiBoards) {

    if (!apiBoards || apiBoards.length === 0) {
      /* Nenhum board no servidor — tenta criar o padrão */
      return addBoard('Quadro Principal')
        .then(function(board) {
          switchBoard(board.id);
        })
        .catch(function(err) {
          /* addBoard falhou: mostra erro claro e não cria board offline */
          console.error('[Main] Falha ao criar quadro padrão:', err && err.message);
          var errDiv = document.createElement('div');
          errDiv.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#fce8e6;border:1px solid #f5c6c2;color:#c5221f;padding:12px 20px;border-radius:6px;font-size:.85rem;z-index:9999;text-align:center;';
          errDiv.textContent = 'Erro ao conectar com o servidor. Recarregue a página.';
          document.body.appendChild(errDiv);
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
    /* getBoards() falhou — servidor realmente inacessível */
    console.warn('[Main] API indisponível — modo offline:', err && err.message);

    var warn = document.createElement('div');
    warn.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#fce8e6;border:1px solid #f5c6c2;color:#c5221f;padding:12px 20px;border-radius:6px;font-size:.85rem;z-index:9999;text-align:center;';
    warn.textContent = 'Servidor indisponível. Tente novamente em alguns instantes e recarregue a página.';
    document.body.appendChild(warn);
  });
