'use strict';

// ── Painel extensão ───────────────────────────────────────────
function openPanel() {
  extPanel.classList.add('open');
  extBackdrop.classList.add('visible');
  extTrigger.style.display = 'none';
}
function closePanel() {
  extPanel.classList.remove('open');
  extBackdrop.classList.remove('visible');
  if (currentView === 'quadro') extTrigger.style.display = '';
  closeForm();
}

extTrigger.addEventListener('click', function() {
  if (currentView !== 'quadro') switchView('quadro');
  startInlineNote();
});
btnClose.addEventListener('click', closePanel);
extBackdrop.addEventListener('click', closePanel);

// botão "Nova nota" do quadro → cria card inline direto no canvas
function startInlineNote() {
  var pos   = getInitialBoardPos();
  var color = NOTE_COLORS[0];

  var draft = document.createElement('div');
  draft.style.cssText = [
    'position:absolute',
    'width:220px',
    'background:' + color.bg,
    'border:1px solid rgba(0,0,0,.07)',
    'border-top:4px solid ' + color.accent,
    'border-radius:8px',
    'padding:14px',
    'box-shadow:0 4px 16px rgba(0,0,0,.14)',
    'z-index:1000',
    'left:' + pos.x + 'px',
    'top:'  + pos.y + 'px',
  ].join(';');

  var ta = document.createElement('textarea');
  ta.placeholder = 'Digite sua nota...';
  ta.setAttribute('maxlength', '500');
  ta.style.cssText = 'width:100%;border:none;background:transparent;font-family:inherit;font-size:.875rem;color:#202124;resize:none;outline:none;min-height:80px;line-height:1.55;padding:0;display:block;';

  var hint = document.createElement('p');
  hint.textContent = 'Enter salva · Esc cancela · Shift+Enter nova linha';
  hint.style.cssText = 'font-size:.68rem;color:#9aa0a6;margin-top:8px;';

  draft.appendChild(ta);
  draft.appendChild(hint);
  boardCanvas.appendChild(draft);
  boardEmpty.classList.add('hidden');
  draft.addEventListener('mousedown', function(e) { e.stopPropagation(); });

  setTimeout(function() { ta.focus(); }, 10);

  function doSave() {
    var text = ta.value.trim();
    if (text.length > 0) {
      var tmp = document.createElement('div');
      tmp.textContent = text;
      NoteManager.addNoteAtPosition(tmp.innerHTML, pos.x, pos.y, 0);
    }
    removeDraft();
  }
  function removeDraft() {
    document.removeEventListener('mousedown', onOutside, true);
    if (draft.parentNode) boardCanvas.removeChild(draft);
    if (NoteManager.notes.length === 0) boardEmpty.classList.remove('hidden');
  }
  function onOutside(e) {
    if (!draft.contains(e.target)) { doSave(); }
  }

  ta.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSave(); }
    if (e.key === 'Escape') { removeDraft(); }
  });
  setTimeout(function() {
    document.addEventListener('mousedown', onOutside, true);
  }, 100);
}
btnQuadroAdd.addEventListener('click', function() {
  openPanel();
  openForm();
});

// ── Formulário ────────────────────────────────────────────────
var formOpen = false;
var selectedColorIdx = 0;

// Monta o color picker
NOTE_COLORS.forEach(function(color, idx) {
  var dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'color-dot' + (idx === 0 ? ' active' : '');
  dot.style.background = color.accent;
  dot.setAttribute('aria-label', 'Cor ' + color.label);
  dot.setAttribute('title', color.label);
  dot.addEventListener('click', function() {
    selectedColorIdx = idx;
    colorPickerEl.querySelectorAll('.color-dot').forEach(function(b) { b.classList.remove('active'); });
    dot.classList.add('active');
  });
  colorPickerEl.appendChild(dot);
});

function openForm() {
  formOpen = true;
  addForm.classList.add('open');
  fabBtn.style.display = 'none';
  setTimeout(function() { noteInput.focus(); }, 310);
}
function closeForm() {
  formOpen = false;
  addForm.classList.remove('open');
  fabBtn.style.display = '';
  noteInput.innerHTML = '';
  errorMsgEl.textContent = '';
}

fabBtn.addEventListener('click', openForm);
cancelBtn.addEventListener('click', closeForm);
saveBtn.addEventListener('click', function() { NoteManager.addNote(noteInput.innerHTML); });

noteInput.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeForm(); return; }
  if (e.key === 'Enter' && e.shiftKey) return; // contenteditable insere <br> nativamente
  if (e.key === 'Enter') {
    e.preventDefault();
    NoteManager.addNote(noteInput.innerHTML);
  }
});
