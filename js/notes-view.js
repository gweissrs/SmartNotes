'use strict';

// ── Task Notes (seção Tarefas) ────────────────────────────────
var taskNotes       = [];
var activeTaskNoteId = null;
var tnoteAutoSaveTimer = null;

var tnoteGrid        = document.getElementById('tnotes-grid');
var tnoteEditor      = document.getElementById('tnote-editor');
var tnoteEditorTitle = document.getElementById('tnote-editor-title');
var tnoteEditorBody  = document.getElementById('tnote-editor-body');

function getTaskNoteById(id) {
  for (var i = 0; i < taskNotes.length; i++) {
    if (taskNotes[i].id === id) return taskNotes[i];
  }
  return null;
}

function saveActiveTaskNote() {
  if (!activeTaskNoteId) return;
  var note = getTaskNoteById(activeTaskNoteId);
  if (!note) return;
  note.title = tnoteEditorTitle.value.trim();
  note.content = tnoteEditorBody.innerHTML;
  note.updatedAt = new Date();
}

function renderTaskGrid() {
  tnoteGrid.innerHTML = '';
  if (taskNotes.length === 0) {
    var empty = document.createElement('div');
    empty.className = 'tnotes-empty';
    empty.innerHTML = '<span class="tnotes-empty-icon">📝</span>'
      + '<p class="tnotes-empty-title">Nenhuma nota</p>'
      + '<p class="tnotes-empty-sub">Clique em "+ Nova nota" para começar</p>';
    tnoteGrid.appendChild(empty);
    return;
  }
  taskNotes.forEach(function(note) {
    var tile = document.createElement('div');
    tile.className = 'tnote-tile';
    tile.setAttribute('data-tnote-id', note.id);

    var preview = document.createElement('div');
    preview.className = 'tnote-preview';

    var lines = document.createElement('div');
    lines.className = 'tnote-preview-lines';

    var previewTitle = document.createElement('div');
    previewTitle.className = 'tnote-preview-title';
    previewTitle.textContent = note.title || 'Sem título';

    var previewText = document.createElement('div');
    previewText.className = 'tnote-preview-text';
    previewText.innerHTML = note.content || '';

    preview.appendChild(lines);
    preview.appendChild(previewTitle);
    preview.appendChild(previewText);

    var label = document.createElement('div');
    label.className = 'tnote-label';

    var titleEl = document.createElement('div');
    titleEl.className = 'tnote-title';
    titleEl.textContent = note.title || 'Sem título';

    var dateEl = document.createElement('div');
    dateEl.className = 'tnote-date';
    var d = note.updatedAt || note.createdAt;
    dateEl.textContent = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    label.appendChild(titleEl);
    label.appendChild(dateEl);
    tile.appendChild(preview);
    tile.appendChild(label);

    tile.addEventListener('click', function() { openTaskNote(note.id); });
    tnoteGrid.appendChild(tile);
  });
}

function openTaskNote(id) {
  var note = getTaskNoteById(id);
  if (!note) return;
  activeTaskNoteId = id;
  tnoteEditorTitle.value = note.title;
  tnoteEditorBody.innerHTML = note.content || '';
  tnoteEditor.classList.add('open');
  setTimeout(function() { tnoteEditorBody.focus(); }, 300);
}

function closeTaskEditor() {
  clearTimeout(tnoteAutoSaveTimer);
  saveActiveTaskNote();
  var note = getTaskNoteById(activeTaskNoteId);
  if (note) {
    var plain = note.content.replace(/<[^>]*>/g, '').trim();
    if (!note.title && !plain) {
      taskNotes = taskNotes.filter(function(n) { return n.id !== note.id; });
    }
  }
  tnoteEditor.classList.remove('open');
  activeTaskNoteId = null;
  renderTaskGrid();
}

function scheduleAutoSave() {
  clearTimeout(tnoteAutoSaveTimer);
  tnoteAutoSaveTimer = setTimeout(saveActiveTaskNote, 800);
}

document.getElementById('btn-add-tnote').addEventListener('click', function() {
  var note = {
    id: crypto.randomUUID(), title: '', content: '',
    createdAt: new Date(), updatedAt: new Date()
  };
  taskNotes.unshift(note);
  openTaskNote(note.id);
  setTimeout(function() { tnoteEditorTitle.focus(); }, 310);
});

document.getElementById('btn-tnote-back').addEventListener('click', closeTaskEditor);

document.getElementById('btn-tnote-del').addEventListener('click', function() {
  if (!activeTaskNoteId) return;
  if (!confirm('Excluir esta nota?')) return;
  taskNotes = taskNotes.filter(function(n) { return n.id !== activeTaskNoteId; });
  tnoteEditor.classList.remove('open');
  activeTaskNoteId = null;
  renderTaskGrid();
});

tnoteEditorTitle.addEventListener('input', scheduleAutoSave);
tnoteEditorBody.addEventListener('input', scheduleAutoSave);
tnoteEditorTitle.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') { e.preventDefault(); tnoteEditorBody.focus(); }
});

renderTaskGrid();

// Formatação no editor de notas
var tnoteFmtDropdown = document.getElementById('tnote-fmt-dropdown');
var tnoteFmtColorBar = document.getElementById('tnote-fmt-color-bar');

TEXT_COLORS.forEach(function(tc) {
  var dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'tnote-fmt-color-dot' + (tc.value === '#202124' ? ' active' : '');
  dot.style.background = tc.value;
  if (tc.value === '#ffffff') { dot.style.borderColor = '#dadce0'; }
  dot.setAttribute('title', tc.label);
  dot.addEventListener('mousedown', function(e) {
    e.preventDefault();
    tnoteFmtColorBar.style.background = tc.value;
    tnoteFmtDropdown.querySelectorAll('.tnote-fmt-color-dot').forEach(function(d) { d.classList.remove('active'); });
    dot.classList.add('active');
    document.execCommand('foreColor', false, tc.value);
    tnoteFmtDropdown.classList.remove('open');
  });
  tnoteFmtDropdown.appendChild(dot);
});

document.getElementById('tnote-fmt-bold').addEventListener('mousedown', function(e) {
  e.preventDefault(); document.execCommand('bold');
});
document.getElementById('tnote-fmt-italic').addEventListener('mousedown', function(e) {
  e.preventDefault(); document.execCommand('italic');
});
document.getElementById('tnote-fmt-color').addEventListener('mousedown', function(e) {
  e.preventDefault(); tnoteFmtDropdown.classList.toggle('open');
});
document.addEventListener('mousedown', function(e) {
  if (!e.target.closest('.tnote-fmt-color-wrap')) tnoteFmtDropdown.classList.remove('open');
});

// Alinhamento
var alignMap = [
  { id: 'tnote-fmt-al', cmd: 'justifyLeft'   },
  { id: 'tnote-fmt-ac', cmd: 'justifyCenter'  },
  { id: 'tnote-fmt-ar', cmd: 'justifyRight'   },
  { id: 'tnote-fmt-aj', cmd: 'justifyFull'    },
];
alignMap.forEach(function(a) {
  document.getElementById(a.id).addEventListener('mousedown', function(e) {
    e.preventDefault();
    document.execCommand(a.cmd);
    updateAlignActive();
  });
});

function updateAlignActive() {
  alignMap.forEach(function(a) {
    var btn = document.getElementById(a.id);
    btn.classList.toggle('fmt-active', document.queryCommandState(a.cmd));
  });
}
tnoteEditorBody.addEventListener('keyup',   updateAlignActive);
tnoteEditorBody.addEventListener('mouseup', updateAlignActive);

// Checklist
document.getElementById('tnote-fmt-check').addEventListener('mousedown', function(e) {
  e.preventDefault();
  insertCheckItem();
});

function createCheckItem() {
  var item = document.createElement('div');
  item.className = 'ck-item';
  var box = document.createElement('span');
  box.className = 'ck-box';
  box.contentEditable = 'false';
  var text = document.createElement('span');
  text.className = 'ck-text';
  item.appendChild(box);
  item.appendChild(text);
  return { item: item, text: text };
}

function insertCheckItem() {
  tnoteEditorBody.focus();
  var sel = window.getSelection();
  var created = createCheckItem();
  var inserted = false;
  if (sel && sel.rangeCount > 0) {
    var anchor = sel.anchorNode;
    var child = anchor;
    while (child && child.parentNode !== tnoteEditorBody) {
      child = child.parentNode;
    }
    if (child && child !== tnoteEditorBody) {
      var next = child.nextSibling;
      if (next) {
        tnoteEditorBody.insertBefore(created.item, next);
      } else {
        tnoteEditorBody.appendChild(created.item);
      }
      inserted = true;
    }
  }
  if (!inserted) {
    tnoteEditorBody.appendChild(created.item);
  }
  var nr = document.createRange();
  nr.setStart(created.text, 0);
  nr.collapse(true);
  var s = window.getSelection();
  s.removeAllRanges();
  s.addRange(nr);
}

// Toggle checkbox ao clicar
tnoteEditorBody.addEventListener('mousedown', function(e) {
  var box = e.target.closest('.ck-box');
  if (box) {
    e.preventDefault();
    var item = box.closest('.ck-item');
    if (item) item.classList.toggle('checked');
  }
});

// Keyboard handling inside checklist items
tnoteEditorBody.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter' && e.key !== 'Backspace') return;
  var sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  var anchor = sel.anchorNode;
  if (!anchor) return;
  var node = anchor.nodeType === 3 ? anchor.parentNode : anchor;
  var ckText = null;
  while (node && node !== tnoteEditorBody) {
    if (node.classList && node.classList.contains('ck-text')) { ckText = node; break; }
    node = node.parentNode;
  }
  if (!ckText) return;
  var ckItem = ckText.closest('.ck-item');
  if (!ckItem) return;

  if (e.key === 'Enter') {
    e.preventDefault();
    if (ckText.textContent.trim() === '') {
      var newDiv = document.createElement('div');
      newDiv.appendChild(document.createElement('br'));
      tnoteEditorBody.insertBefore(newDiv, ckItem.nextSibling || null);
      ckItem.remove();
      var nr = document.createRange();
      nr.setStart(newDiv, 0);
      nr.collapse(true);
      sel.removeAllRanges();
      sel.addRange(nr);
    } else {
      var created = createCheckItem();
      if (ckItem.nextSibling) {
        tnoteEditorBody.insertBefore(created.item, ckItem.nextSibling);
      } else {
        tnoteEditorBody.appendChild(created.item);
      }
      var nr = document.createRange();
      nr.setStart(created.text, 0);
      nr.collapse(true);
      sel.removeAllRanges();
      sel.addRange(nr);
    }
  } else if (e.key === 'Backspace') {
    var range = sel.getRangeAt(0);
    if (range.collapsed && ckText.textContent === '') {
      e.preventDefault();
      var prev = ckItem.previousSibling;
      ckItem.remove();
      if (prev) {
        var nr = document.createRange();
        nr.selectNodeContents(prev);
        nr.collapse(false);
        sel.removeAllRanges();
        sel.addRange(nr);
      }
    }
  }
});
