'use strict';

// ── Undo / Redo ───────────────────────────────────────────────
var undoStack = [];
var redoStack = [];
var _historyLocked = false;
var btnUndo = document.getElementById('btn-undo');
var btnRedo = document.getElementById('btn-redo');

function pushUndo(action) {
  if (_historyLocked) return;
  undoStack.push(action);
  redoStack = [];
  _syncHistoryBtns();
}

function _syncHistoryBtns() {
  btnUndo.disabled = undoStack.length === 0;
  btnRedo.disabled = redoStack.length === 0;
}

function _applyMove(id, x, y) {
  for (var i = 0; i < NoteManager.notes.length; i++) {
    if (NoteManager.notes[i].id === id) { NoteManager.notes[i].boardX = x; NoteManager.notes[i].boardY = y; break; }
  }
  var bc = boardGrid.querySelector('[data-id="' + id + '"]');
  if (bc) { bc.style.left = x + 'px'; bc.style.top = y + 'px'; }
}

function _applyColor(id, colorIdx) {
  _historyLocked = true;
  NoteManager.changeNoteColor(id, colorIdx);
  var bc = boardGrid.querySelector('[data-id="' + id + '"]');
  if (bc) bc.querySelectorAll('.board-card-color-swatch').forEach(function(s, i) { s.classList.toggle('active', i === colorIdx); });
  _historyLocked = false;
}

function _applyEdit(id, text) {
  _historyLocked = true;
  NoteManager.editNote(id, text);
  _historyLocked = false;
}

function _executeAction(action, isUndo) {
  _historyLocked = true;
  switch (action.type) {
    case 'add':
      if (isUndo) NoteManager.removeNote(action.note.id);
      else        NoteManager._rawAdd(action.note);
      break;
    case 'remove':
      if (isUndo) NoteManager._rawAdd(action.note);
      else        NoteManager.removeNote(action.note.id);
      break;
    case 'edit':
      _historyLocked = false;
      _applyEdit(action.id, isUndo ? action.oldText : action.newText);
      _historyLocked = true;
      break;
    case 'color':
      _historyLocked = false;
      _applyColor(action.id, isUndo ? action.oldIdx : action.newIdx);
      _historyLocked = true;
      break;
    case 'move':
      _applyMove(action.id, isUndo ? action.oldX : action.newX, isUndo ? action.oldY : action.newY);
      break;
  }
  _historyLocked = false;
  _syncHistoryBtns();
}

function undo() {
  if (!undoStack.length) return;
  var action = undoStack.pop();
  redoStack.push(action);
  _executeAction(action, true);
}
function redo() {
  if (!redoStack.length) return;
  var action = redoStack.pop();
  undoStack.push(action);
  _executeAction(action, false);
}

btnUndo.addEventListener('click', undo);
btnRedo.addEventListener('click', redo);

document.addEventListener('keydown', function(e) {
  if (!e.ctrlKey && !e.metaKey) return;
  var tag = document.activeElement && document.activeElement.tagName;
  var isEditable = document.activeElement && document.activeElement.contentEditable === 'true';
  if (tag === 'TEXTAREA' || tag === 'INPUT' || isEditable) return;
  if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); undo(); }
  if (e.key === 'y' || e.key === 'Y') { e.preventDefault(); redo(); }
});
