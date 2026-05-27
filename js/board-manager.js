'use strict';

// ── Board Manager ─────────────────────────────────────────────
var boards        = [];
var activeBoardId = null;
var boardTitle    = document.getElementById('board-title');
var boardsList    = document.getElementById('boards-list');

function getBoardById(id) {
  for (var i = 0; i < boards.length; i++) {
    if (boards[i].id === id) return boards[i];
  }
  return null;
}

function updateBoardNavCount(boardId) {
  var el = boardsList.querySelector('[data-board-count="' + boardId + '"]');
  var b  = getBoardById(boardId);
  if (el && b) el.textContent = b.notes.length;
}

function createBoardNavItem(board) {
  var item = document.createElement('div');
  item.className = 'gc-nav-board';
  item.setAttribute('data-board-id', board.id);

  var icon = document.createElement('span');
  icon.className  = 'board-nav-icon';
  icon.textContent = '📋';

  var nameEl = document.createElement('span');
  nameEl.className  = 'board-nav-name';
  nameEl.textContent = board.name;

  var countEl = document.createElement('span');
  countEl.className = 'board-nav-count';
  countEl.setAttribute('data-board-count', board.id);
  countEl.textContent = board.notes.length;

  var delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'board-nav-del';
  delBtn.setAttribute('title', 'Excluir quadro');
  delBtn.innerHTML = '&times;';

  item.appendChild(icon);
  item.appendChild(nameEl);
  item.appendChild(countEl);
  item.appendChild(delBtn);
  boardsList.appendChild(item);

  item.addEventListener('click', function() { switchBoard(board.id); });
  nameEl.addEventListener('dblclick', function(e) {
    e.stopPropagation();
    startRenameBoard(board.id, item, nameEl);
  });
  delBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    deleteBoard(board.id);
  });

  return item;
}

/* ── Cria board em memória a partir de dados da API ─────────── */
function initBoardFromAPI(b) {
  var board = {
    id:          b.id,
    name:        b.name,
    notes:       [],
    notesLoaded: false,   /* carrega lazy ao fazer switchBoard */
    undoStack:   [],
    redoStack:   [],
  };
  boards.push(board);
  createBoardNavItem(board);
  return board;
}

/* ── Adiciona novo board (chama API, espera UUID real) ──────── */
function addBoard(name) {
  return API.createBoard(name || ('Quadro ' + (boards.length + 1)))
    .then(function(apiBoard) {
      var board = {
        id:          apiBoard.id,
        name:        apiBoard.name,
        notes:       [],
        notesLoaded: true,   /* novo board já começa vazio */
        undoStack:   [],
        redoStack:   [],
      };
      boards.push(board);
      createBoardNavItem(board);
      return board;
    });
}

/* ── Renderiza conteúdo do board ativo ──────────────────────── */
function _renderBoard(board) {
  var id = board.id;

  boardCanvas.innerHTML = '';
  while (notesList.firstChild) notesList.removeChild(notesList.firstChild);
  notesList.appendChild(panelEmpty);

  NoteManager.notes      = board.notes;
  NoteManager.selectedId = null;
  undoStack = board.undoStack.slice();
  redoStack = board.redoStack.slice();

  board.notes.forEach(function(note) {
    notesList.insertBefore(NoteManager.createPanelCard(note), panelEmpty);
    boardCanvas.appendChild(NoteManager.createBoardCard(note));
  });

  NoteManager.updateCounters();
  NoteManager.updateEmpties();
  _syncHistoryBtns();

  boardTitle.textContent = board.name;
  boardsList.querySelectorAll('.gc-nav-board').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-board-id') === id);
  });
}

/* ── Troca de board (com lazy-load das notas) ───────────────── */
function switchBoard(id) {
  if (activeBoardId === id) {
    if (currentView !== 'quadro') switchView('quadro');
    return;
  }

  /* Salva undo/redo do board atual */
  if (activeBoardId) {
    var cur = getBoardById(activeBoardId);
    if (cur) { cur.undoStack = undoStack.slice(); cur.redoStack = redoStack.slice(); }
  }

  activeBoardId = id;
  var board = getBoardById(id);
  if (!board) return;

  /* Atualiza UI imediatamente */
  boardTitle.textContent = board.name;
  boardsList.querySelectorAll('.gc-nav-board').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-board-id') === id);
  });
  if (currentView !== 'quadro') switchView('quadro');

  /* Lazy-load das notas se ainda não carregadas */
  if (!board.notesLoaded) {
    boardCanvas.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--text-2);font-size:.875rem;gap:8px;pointer-events:none"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" style="animation:spin .8s linear infinite"/></svg><style>@keyframes spin{to{transform:rotate(360deg)}}</style>Carregando notas…</div>';

    API.getNotes(id)
      .then(function(apiNotes) {
        board.notes       = (apiNotes || []).map(apiNoteToLocal);
        board.notesLoaded = true;
        if (activeBoardId === id) _renderBoard(board);
      })
      .catch(function() {
        board.notes       = [];
        board.notesLoaded = true;
        if (activeBoardId === id) _renderBoard(board);
      });
    return;
  }

  _renderBoard(board);
}

/* ── Excluir board ──────────────────────────────────────────── */
function deleteBoard(id) {
  if (boards.length <= 1) { alert('Deve existir pelo menos um quadro.'); return; }
  var board = getBoardById(id);
  if (!board) return;
  if (board.notes.length > 0 &&
      !confirm('Excluir "' + board.name + '" e suas ' + board.notes.length + ' nota(s)?')) return;

  var idx = boards.indexOf(board);
  boards.splice(idx, 1);

  var navItem = boardsList.querySelector('[data-board-id="' + id + '"]');
  if (navItem) navItem.parentNode.removeChild(navItem);

  if (activeBoardId === id) {
    activeBoardId = null;
    switchBoard(boards[Math.min(idx, boards.length - 1)].id);
  }

  API.deleteBoard(id).catch(function(err) {
    console.warn('[BoardManager] deleteBoard falhou:', err);
  });
}

/* ── Renomear board ─────────────────────────────────────────── */
function startRenameBoard(id, item, nameEl) {
  var board = getBoardById(id);
  if (!board) return;

  var input = document.createElement('input');
  input.type      = 'text';
  input.className = 'board-nav-name-input';
  input.value     = board.name;
  item.replaceChild(input, nameEl);
  input.focus();
  input.select();

  function doRename() {
    var newName = input.value.trim() || board.name;
    board.name  = newName;
    nameEl.textContent = newName;
    item.replaceChild(nameEl, input);
    if (activeBoardId === id) boardTitle.textContent = newName;

    API.updateBoard(id, { name: newName }).catch(function(err) {
      console.warn('[BoardManager] rename falhou:', err);
    });
  }
  input.addEventListener('blur', doRename);
  input.addEventListener('keydown', function(e) {
    e.stopPropagation();
    if (e.key === 'Enter')  input.blur();
    if (e.key === 'Escape') { input.value = board.name; input.blur(); }
  });
}

/* ── Patch updateCounters para atualizar badge da sidebar ───── */
var _origUpdateCounters = NoteManager.updateCounters.bind(NoteManager);
NoteManager.updateCounters = function() {
  _origUpdateCounters();
  if (activeBoardId) updateBoardNavCount(activeBoardId);
};

/* ── Botão "+ Quadro" ───────────────────────────────────────── */
document.getElementById('btn-add-board').addEventListener('click', function() {
  addBoard().then(function(board) {
    switchBoard(board.id);
    var navItem = boardsList.querySelector('[data-board-id="' + board.id + '"]');
    if (navItem) startRenameBoard(board.id, navItem, navItem.querySelector('.board-nav-name'));
  }).catch(function(err) {
    console.warn('[BoardManager] addBoard falhou:', err);
    alert('Não foi possível criar o quadro. Verifique a conexão com o servidor.');
  });
});
