'use strict';

/* ── Converte nota da API para o formato local ──────────────── */
function apiNoteToLocal(n) {
  var ci    = n.colorIdx != null ? n.colorIdx : 0;
  var color = NOTE_COLORS[ci] || NOTE_COLORS[0];
  return {
    id:      n.id,
    text:    n.text  || '',
    color:   color,
    colorIdx: ci,
    boardX:  n.boardX != null ? n.boardX : 100,
    boardY:  n.boardY != null ? n.boardY : 100,
    boardW:  n.boardW || undefined,
    boardH:  n.boardH || undefined,
  };
}

/* ── Utilitário: animar remoção ───────────────────────────────── */
function animateOut(el) {
  if (!el || el.classList.contains('removing')) return;
  el.classList.add('removing');
  var done = false;
  function finish() {
    if (done) return;
    done = true;
    el.removeEventListener('animationend', finish);
    if (el.parentNode) el.parentNode.removeChild(el);
  }
  el.addEventListener('animationend', finish, { once: true });
  setTimeout(finish, 350);
}

/* ── Utilitário: criar SVG de X ───────────────────────────────── */
function makeDelSvg() {
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14'); svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.5');
  svg.setAttribute('stroke-linecap', 'round');
  var l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  l1.setAttribute('x1','18'); l1.setAttribute('y1','6');
  l1.setAttribute('x2','6');  l1.setAttribute('y2','18');
  var l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  l2.setAttribute('x1','6');  l2.setAttribute('y1','6');
  l2.setAttribute('x2','18'); l2.setAttribute('y2','18');
  svg.appendChild(l1); svg.appendChild(l2);
  return svg;
}

/* ── NoteManager ──────────────────────────────────────────────── */
var NoteManager = {
  notes:      [],
  selectedId: null,

  /* ── Adicionar via posição (usado por board canvas) ─────────── */
  addNoteAtPosition: function(text, x, y, colorIdx) {
    var self = this;
    var ci   = colorIdx !== undefined ? colorIdx : 0;

    API.createNote(activeBoardId, { text: text, colorIdx: ci, x: x, y: y })
      .then(function(apiNote) {
        var note = apiNoteToLocal(apiNote);
        pushUndo({ type: 'add', note: note });
        self._rawAdd(note);
      })
      .catch(function() {
        /* Fallback offline */
        var color = NOTE_COLORS[ci];
        var note  = { id: crypto.randomUUID(), text: text, color: color, colorIdx: ci, boardX: x, boardY: y };
        pushUndo({ type: 'add', note: note });
        self._rawAdd(note);
      });
  },

  /* ── Adicionar via formulário do painel ─────────────────────── */
  addNote: function(text) {
    var self  = this;
    var plain = text ? text.replace(/<[^>]*>/g, '').trim() : '';
    if (!plain) {
      errorMsgEl.textContent = 'Digite algo antes de salvar.';
      noteInput.focus();
      return;
    }
    var pos = getInitialBoardPos();
    closeForm();

    API.createNote(activeBoardId, {
      text:     text,
      colorIdx: selectedColorIdx,
      x:        pos.x,
      y:        pos.y,
    })
      .then(function(apiNote) {
        var note = apiNoteToLocal(apiNote);
        pushUndo({ type: 'add', note: note });
        self._rawAdd(note);
      })
      .catch(function() {
        /* Fallback offline */
        var color = NOTE_COLORS[selectedColorIdx];
        var note  = { id: crypto.randomUUID(), text: text, color: color, colorIdx: selectedColorIdx, boardX: pos.x, boardY: pos.y };
        pushUndo({ type: 'add', note: note });
        self._rawAdd(note);
      });
  },

  _rawAdd: function(note) {
    this.notes.unshift(note);
    var pc = this.createPanelCard(note);
    notesList.prepend(pc);
    notesList.scrollTop = 0;
    var bc = this.createBoardCard(note);
    boardCanvas.prepend(bc);
    this.updateCounters();
    this.updateEmpties();
  },

  /* ── Remover (otimista + API) ────────────────────────────────── */
  removeNote: function(id) {
    var snap = null;
    for (var i = 0; i < this.notes.length; i++) {
      if (this.notes[i].id === id) { snap = this.notes[i]; break; }
    }
    if (snap) pushUndo({ type: 'remove', note: snap });

    this.notes = this.notes.filter(function(n) { return n.id !== id; });
    if (this.selectedId === id) this.selectedId = null;

    animateOut(notesList.querySelector('[data-id="' + id + '"]'));
    animateOut(boardGrid.querySelector('[data-id="' + id + '"]'));

    this.updateCounters();
    this.updateEmpties();

    API.deleteNote(id).catch(function(err) {
      console.warn('[NoteManager] deleteNote falhou:', err);
    });
  },

  /* ── Seleção ─────────────────────────────────────────────────── */
  selectNote: function(id) {
    if (this.selectedId === id) { this.clearSelection(); return; }
    this.clearSelection();
    var pc = notesList.querySelector('[data-id="' + id + '"]');
    var bc = boardGrid.querySelector('[data-id="' + id + '"]');
    if (pc) pc.classList.add('selected');
    if (bc) bc.classList.add('selected');
    this.selectedId = id;
  },

  clearSelection: function() {
    document.querySelectorAll('.panel-card.selected, .board-card.selected').forEach(function(el) {
      el.classList.remove('selected');
    });
    this.selectedId = null;
  },

  /* ── Editar texto ────────────────────────────────────────────── */
  editNote: function(id, newText) {
    for (var i = 0; i < this.notes.length; i++) {
      if (this.notes[i].id === id) {
        pushUndo({ type: 'edit', id: id, oldText: this.notes[i].text, newText: newText });
        this.notes[i].text = newText;
        break;
      }
    }
    var pc = notesList.querySelector('[data-id="' + id + '"]');
    if (pc) {
      var pt = pc.querySelector('.panel-card-text');
      if (pt) pt.innerHTML = newText;
      pc.setAttribute('aria-label', 'Nota: ' + newText.replace(/<[^>]*>/g, ''));
    }
    var bc = boardGrid.querySelector('[data-id="' + id + '"]');
    if (bc) {
      var bt = bc.querySelector('.board-card-text');
      if (bt) bt.innerHTML = newText;
      bc.setAttribute('aria-label', 'Nota: ' + newText.replace(/<[^>]*>/g, ''));
    }
    API.updateNote(id, { text: newText }).catch(function(err) {
      console.warn('[NoteManager] editNote falhou:', err);
    });
  },

  /* ── Alterar cor ─────────────────────────────────────────────── */
  changeNoteColor: function(id, colorIdx) {
    var color = NOTE_COLORS[colorIdx];
    for (var i = 0; i < this.notes.length; i++) {
      if (this.notes[i].id === id) {
        pushUndo({ type: 'color', id: id, oldIdx: this.notes[i].colorIdx, newIdx: colorIdx });
        this.notes[i].color    = color;
        this.notes[i].colorIdx = colorIdx;
        break;
      }
    }
    var bc = boardGrid.querySelector('[data-id="' + id + '"]');
    if (bc) {
      bc.style.setProperty('--note-accent', color.accent);
      bc.style.setProperty('--note-bg',     color.bg);
      bc.style.background    = color.bg;
      bc.style.borderTopColor = color.accent;
    }
    var pc = notesList.querySelector('[data-id="' + id + '"]');
    if (pc) {
      pc.style.setProperty('--note-accent', color.accent);
      pc.style.setProperty('--note-bg',     color.bg);
    }
    API.updateNote(id, { colorIdx: colorIdx }).catch(function(err) {
      console.warn('[NoteManager] changeNoteColor falhou:', err);
    });
  },

  /* ── Contadores / empties ────────────────────────────────────── */
  updateCounters: function() {
    var n     = this.notes.length;
    var label = n + ' nota' + (n !== 1 ? 's' : '');
    panelCounter.textContent = label;
    boardCount.textContent   = label;
  },

  updateEmpties: function() {
    var empty = this.notes.length === 0;
    panelEmpty.classList.toggle('hidden', !empty);
    boardEmpty.classList.toggle('hidden', !empty);
  },

  /* ── Card do painel (compacto, borda esquerda) ───────────────── */
  createPanelCard: function(note) {
    var self = this;
    var id   = note.id;

    var card = document.createElement('div');
    card.className = 'panel-card';
    card.setAttribute('data-id', id);
    card.setAttribute('role', 'article');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Nota: ' + note.text);
    card.style.setProperty('--note-bg',     note.color.bg);
    card.style.setProperty('--note-accent', note.color.accent);

    var textEl    = document.createElement('div');
    textEl.className   = 'panel-card-text';
    textEl.innerHTML   = note.text;

    var actionsEl = document.createElement('div');
    actionsEl.className = 'panel-card-actions';

    var editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'panel-card-edit';
    editBtn.setAttribute('aria-label', 'Editar nota');
    editBtn.setAttribute('title', 'Editar');
    editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>';

    var delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'panel-card-del';
    delBtn.setAttribute('aria-label', 'Remover nota');
    delBtn.setAttribute('title', 'Remover');
    delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

    actionsEl.appendChild(editBtn);
    actionsEl.appendChild(delBtn);

    var clickTimer = null;

    card.addEventListener('click', function(e) {
      if (actionsEl.contains(e.target)) return;
      e.stopPropagation();
      if (clickTimer !== null) return;
      clickTimer = setTimeout(function() { clickTimer = null; self.selectNote(id); }, 220);
    });
    card.addEventListener('dblclick', function(e) {
      if (actionsEl.contains(e.target)) return;
      e.stopPropagation();
      if (clickTimer !== null) { clearTimeout(clickTimer); clickTimer = null; }
      self.removeNote(id);
    });
    delBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (clickTimer !== null) { clearTimeout(clickTimer); clickTimer = null; }
      self.removeNote(id);
    });
    editBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (clickTimer !== null) { clearTimeout(clickTimer); clickTimer = null; }
      var noteObj = null;
      for (var i = 0; i < NoteManager.notes.length; i++) {
        if (NoteManager.notes[i].id === id) { noteObj = NoteManager.notes[i]; break; }
      }
      if (!noteObj) return;
      textEl.style.display    = 'none';
      actionsEl.style.display = 'none';

      var editArea = document.createElement('div');
      editArea.className       = 'panel-card-edit-area';
      editArea.contentEditable = 'true';
      editArea.innerHTML       = noteObj.text;
      editArea.setAttribute('aria-label', 'Editar texto da nota');

      var editActions  = document.createElement('div');
      editActions.className = 'panel-card-edit-actions';

      var cancelEditBtn = document.createElement('button');
      cancelEditBtn.type = 'button';
      cancelEditBtn.className = 'btn-ghost';
      cancelEditBtn.style.cssText = 'font-size:.8rem;padding:5px 12px';
      cancelEditBtn.textContent   = 'Cancelar';

      var saveEditBtn = document.createElement('button');
      saveEditBtn.type = 'button';
      saveEditBtn.className = 'btn-solid';
      saveEditBtn.style.cssText = 'font-size:.8rem;padding:5px 12px';
      saveEditBtn.textContent   = 'Salvar';

      editActions.appendChild(cancelEditBtn);
      editActions.appendChild(saveEditBtn);
      card.appendChild(editArea);
      card.appendChild(editActions);
      setTimeout(function() {
        editArea.focus();
        var r = document.createRange();
        r.selectNodeContents(editArea);
        r.collapse(false);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(r);
      }, 10);

      function doSave() {
        var newHtml = editArea.innerHTML;
        if (newHtml.replace(/<[^>]*>/g, '').trim().length > 0) self.editNote(id, newHtml);
        doCleanup();
      }
      function doCleanup() {
        if (editArea.parentNode)    card.removeChild(editArea);
        if (editActions.parentNode) card.removeChild(editActions);
        textEl.style.display    = '';
        actionsEl.style.display = '';
      }

      saveEditBtn.addEventListener('click',  function(e) { e.stopPropagation(); doSave(); });
      cancelEditBtn.addEventListener('click', function(e) { e.stopPropagation(); doCleanup(); });
      editArea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doSave(); }
        if (e.key === 'Escape') { e.preventDefault(); doCleanup(); }
      });
      editArea.addEventListener('mousedown', function(e) { e.stopPropagation(); });
    });
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.selectNote(id); }
      if (e.key === 'Delete') self.removeNote(id);
    });

    card.appendChild(textEl);
    card.appendChild(actionsEl);
    return card;
  },

  /* ── Card do quadro (maior, borda no topo) ───────────────────── */
  createBoardCard: function(note) {
    var self = this;
    var id   = note.id;

    var card = document.createElement('div');
    card.className = 'board-card';
    card.setAttribute('data-id', id);
    card.setAttribute('role', 'article');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Nota: ' + note.text);
    card.style.setProperty('--note-bg',     note.color.bg);
    card.style.setProperty('--note-accent', note.color.accent);
    card.style.background = note.color.bg;
    card.style.left = (note.boardX || 20) + 'px';
    card.style.top  = (note.boardY || 20) + 'px';
    if (note.boardW) card.style.width     = note.boardW + 'px';
    if (note.boardH) card.style.minHeight = note.boardH + 'px';

    var textEl    = document.createElement('div');
    textEl.className = 'board-card-text';
    textEl.innerHTML = note.text;

    var toolbarEl = document.createElement('div');
    toolbarEl.className = 'board-card-toolbar';

    var btnRowEl = document.createElement('div');
    btnRowEl.className = 'board-card-toolbar-buttons';

    var colorBtn = document.createElement('button');
    colorBtn.type = 'button';
    colorBtn.className = 'board-card-toolbar-btn';
    colorBtn.setAttribute('aria-label', 'Alterar cor');
    colorBtn.setAttribute('title', 'Cor');
    colorBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/><circle cx="8" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="10.5" cy="9.5" r="1" fill="currentColor" stroke="none"/><circle cx="14" cy="9.5" r="1" fill="currentColor" stroke="none"/><circle cx="17" cy="14" r="1" fill="currentColor" stroke="none"/></svg>';

    var editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'board-card-toolbar-btn edit';
    editBtn.setAttribute('aria-label', 'Editar nota');
    editBtn.setAttribute('title', 'Editar');
    editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>';

    var delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'board-card-toolbar-btn del';
    delBtn.setAttribute('aria-label', 'Remover nota');
    delBtn.setAttribute('title', 'Remover');
    delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

    var colorRowEl = document.createElement('div');
    colorRowEl.className = 'board-card-color-row';

    NOTE_COLORS.forEach(function(c, idx) {
      var swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'board-card-color-swatch' + (note.color.accent === c.accent ? ' active' : '');
      swatch.style.background = c.accent;
      swatch.setAttribute('aria-label', 'Cor ' + c.label);
      swatch.setAttribute('title', c.label);
      swatch.addEventListener('click', function(e) {
        e.stopPropagation();
        NoteManager.changeNoteColor(id, idx);
        colorRowEl.querySelectorAll('.board-card-color-swatch').forEach(function(s) { s.classList.remove('active'); });
        swatch.classList.add('active');
        colorRowEl.classList.remove('open');
      });
      colorRowEl.appendChild(swatch);
    });

    colorBtn.addEventListener('click', function(e) { e.stopPropagation(); colorRowEl.classList.toggle('open'); });
    btnRowEl.appendChild(colorBtn);
    btnRowEl.appendChild(editBtn);
    btnRowEl.appendChild(delBtn);
    toolbarEl.appendChild(btnRowEl);
    toolbarEl.appendChild(colorRowEl);

    var hideToolbarTimer = null;
    function showToolbar() {
      if (hideToolbarTimer) { clearTimeout(hideToolbarTimer); hideToolbarTimer = null; }
      toolbarEl.style.opacity = '1';
      toolbarEl.style.pointerEvents = 'auto';
    }
    function scheduleHideToolbar() {
      hideToolbarTimer = setTimeout(function() {
        toolbarEl.style.opacity = '0';
        toolbarEl.style.pointerEvents = 'none';
      }, 200);
    }
    card.addEventListener('mouseenter', showToolbar);
    card.addEventListener('mouseleave', scheduleHideToolbar);
    toolbarEl.addEventListener('mouseenter', showToolbar);
    toolbarEl.addEventListener('mouseleave', scheduleHideToolbar);

    var clickTimer = null;

    card.addEventListener('mousedown', function(e) {
      if (toolbarEl.contains(e.target)) return;
      e.stopPropagation();
      var p = screenToCanvas(e.clientX, e.clientY);
      activeDragCard     = card;
      activeDragNoteId   = id;
      activeDragOldX     = parseFloat(card.style.left) || 0;
      activeDragOldY     = parseFloat(card.style.top)  || 0;
      activeDragOffsetX  = p.x - activeDragOldX;
      activeDragOffsetY  = p.y - activeDragOldY;
      activeDragHasMoved = false;
      card.classList.add('dragging-card');
    });
    card.addEventListener('click', function(e) {
      if (toolbarEl.contains(e.target)) return;
      e.stopPropagation();
      if (lastCardDragHasMoved) { lastCardDragHasMoved = false; return; }
      if (clickTimer !== null) return;
      clickTimer = setTimeout(function() { clickTimer = null; self.selectNote(id); }, 220);
    });
    card.addEventListener('dblclick', function(e) {
      if (toolbarEl.contains(e.target)) return;
      e.stopPropagation();
      if (clickTimer !== null) { clearTimeout(clickTimer); clickTimer = null; }
      self.removeNote(id);
    });
    delBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (clickTimer !== null) { clearTimeout(clickTimer); clickTimer = null; }
      self.removeNote(id);
    });
    editBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (clickTimer !== null) { clearTimeout(clickTimer); clickTimer = null; }
      var noteObj = null;
      for (var i = 0; i < NoteManager.notes.length; i++) {
        if (NoteManager.notes[i].id === id) { noteObj = NoteManager.notes[i]; break; }
      }
      if (!noteObj) return;
      textEl.style.display = 'none';
      toolbarEl.style.opacity = '0';
      toolbarEl.style.pointerEvents = 'none';

      var editArea = document.createElement('div');
      editArea.contentEditable = 'true';
      editArea.innerHTML = noteObj.text;
      editArea.style.cssText = 'width:100%;border:none;background:transparent;font-family:inherit;font-size:.875rem;color:var(--text);outline:none;min-height:60px;line-height:1.55;padding:0;display:block;';

      card.appendChild(editArea);
      setTimeout(function() {
        editArea.focus();
        var r = document.createRange();
        r.selectNodeContents(editArea);
        r.collapse(false);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(r);
      }, 10);

      function doSave() {
        var newHtml = editArea.innerHTML;
        if (newHtml.replace(/<[^>]*>/g, '').trim().length > 0) NoteManager.editNote(id, newHtml);
        doCleanup();
      }
      function doCleanup() {
        if (editArea.parentNode) card.removeChild(editArea);
        textEl.style.display = '';
        toolbarEl.style.opacity = '0';
        toolbarEl.style.pointerEvents = 'none';
      }

      editArea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doSave(); }
        if (e.key === 'Escape') { e.preventDefault(); doCleanup(); }
      });
      editArea.addEventListener('blur',      function() { doSave(); });
      editArea.addEventListener('mousedown', function(e) { e.stopPropagation(); });
    });
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.selectNote(id); }
      if (e.key === 'Delete') self.removeNote(id);
    });

    /* ── Resize grip ─────────────────────────────────────────── */
    var resizeGrip = document.createElement('div');
    resizeGrip.className = 'board-card-resize';
    resizeGrip.setAttribute('title', 'Redimensionar');
    resizeGrip.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="2" y1="9" x2="9" y2="2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="5.5" y1="9" x2="9" y2="5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

    resizeGrip.addEventListener('mousedown', function(e) {
      e.stopPropagation();
      e.preventDefault();
      var startX = e.clientX;
      var startY = e.clientY;
      var startW = card.offsetWidth;
      var startH = card.offsetHeight;

      function onResizeMove(e) {
        var dx   = (e.clientX - startX) / bScale;
        var dy   = (e.clientY - startY) / bScale;
        card.style.width     = Math.max(160, startW + dx) + 'px';
        card.style.minHeight = Math.max(80,  startH + dy) + 'px';
      }
      function onResizeUp() {
        document.removeEventListener('mousemove', onResizeMove);
        document.removeEventListener('mouseup',   onResizeUp);
        var newW = card.offsetWidth;
        var newH = card.offsetHeight;
        for (var i = 0; i < NoteManager.notes.length; i++) {
          if (NoteManager.notes[i].id === id) {
            NoteManager.notes[i].boardW = newW;
            NoteManager.notes[i].boardH = newH;
            break;
          }
        }
        API.updateNote(id, { w: newW, h: newH }).catch(function(err) {
          console.warn('[NoteManager] resize save falhou:', err);
        });
      }
      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup',   onResizeUp);
    });

    card.appendChild(toolbarEl);
    card.appendChild(textEl);
    card.appendChild(resizeGrip);
    return card;
  },
};

/* Deselect ao clicar fora dos cards */
document.addEventListener('click', function() { NoteManager.clearSelection(); });
