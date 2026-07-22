'use strict';

// ── Menus dropdown do quadro ──────────────────────────────────
var gridVisible = true;

function closeAllMenus() {
  document.querySelectorAll('.quadro-dropdown.open').forEach(function(d) { d.classList.remove('open'); });
  document.querySelectorAll('.quadro-menu-btn.open').forEach(function(b) { b.classList.remove('open'); });
}

document.querySelectorAll('.quadro-menu-btn[data-menu]').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var menuId = 'menu-' + btn.getAttribute('data-menu');
    var dropdown = document.getElementById(menuId);
    var isOpen = dropdown.classList.contains('open');
    closeAllMenus();
    if (!isOpen) {
      dropdown.classList.add('open');
      btn.classList.add('open');
    }
  });
});

document.addEventListener('click', closeAllMenus);
document.querySelectorAll('.quadro-dropdown').forEach(function(d) {
  d.addEventListener('click', function(e) { e.stopPropagation(); });
});

// Fechar menus ao clicar em item
document.querySelectorAll('.quadro-dropdown-item').forEach(function(item) {
  item.addEventListener('click', closeAllMenus);
});

// ── Ações: Arquivo ────────────────────────────────────────────
document.getElementById('mi-export-txt').addEventListener('click', function() {
  if (NoteManager.notes.length === 0) return;
  var txt = NoteManager.notes.map(function(n, i) {
    return (i + 1) + '. ' + n.text;
  }).join('\n\n');
  var blob = new Blob([txt], { type: 'text/plain' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = 'notas.txt'; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('mi-export-json').addEventListener('click', function() {
  if (NoteManager.notes.length === 0) return;
  var data = NoteManager.notes.map(function(n) {
    return { texto: n.text, cor: n.color.label, x: Math.round(n.boardX), y: Math.round(n.boardY) };
  });
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = 'notas.json'; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('mi-export-pdf').addEventListener('click', function() {
  if (NoteManager.notes.length === 0) return;
  var now     = new Date();
  var dateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  var count   = NoteManager.notes.length;
  var label   = count + ' nota' + (count !== 1 ? 's' : '');

  var noteCards = NoteManager.notes.map(function(n) {
    return [
      '<div class="note" style="background:', n.color.bg,
      ';border-left:4px solid ', n.color.accent, '">',
      '<div class="note-text">', n.text, '</div>',
      '</div>'
    ].join('');
  }).join('');

  var parts = [
    '<!DOCTYPE html>',
    '<html lang="pt-BR">',
    '<head>',
    '<meta charset="UTF-8">',
    '<title>Quadro de Notas</title>',
    '<style>',
    '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}',
    'body{font-family:system-ui,sans-serif;background:#f1f3f4;padding:28px;color:#202124}',
    'header{margin-bottom:24px;border-bottom:2px solid #1a73e8;padding-bottom:12px;',
    'display:flex;justify-content:space-between;align-items:flex-end}',
    'header h1{font-size:1.2rem;font-weight:500;color:#1a73e8}',
    'header span{font-size:.75rem;color:#5f6368}',
    '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}',
    '.note{border-radius:8px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,.1);break-inside:avoid}',
    '.note-text{font-size:.875rem;line-height:1.6;word-break:break-word}',
    'footer{margin-top:28px;font-size:.72rem;color:#9aa0a6;text-align:center}',
    '@media print{',
    'body{background:#fff;padding:0}',
    '@page{margin:15mm 12mm}',
    '}',
    '<\/style>',
    '<\/head>',
    '<body>',
    '<header>',
    '<h1>Quadro de Notas — ', label, '<\/h1>',
    '<span>', dateStr, '<\/span>',
    '<\/header>',
    '<div class="grid">', noteCards, '<\/div>',
    '<footer>Gerado por SmartNotes<\/footer>',
    '<\/body><\/html>'
  ];

  var blob = new Blob([parts.join('')], { type: 'text/html;charset=utf-8' });
  var url  = URL.createObjectURL(blob);
  var win  = window.open(url, '_blank');
  if (!win) { alert('Permita pop-ups para exportar o PDF.'); URL.revokeObjectURL(url); return; }
  win.addEventListener('load', function() {
    win.print();
    setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
  });
});

document.getElementById('mi-print').addEventListener('click', function() { window.print(); });

document.getElementById('mi-clear-all').addEventListener('click', function() {
  if (NoteManager.notes.length === 0) return;
  if (!confirm('Apagar todas as notas do quadro?')) return;
  NoteManager.notes.slice().forEach(function(n) { NoteManager.removeNote(n.id); });
});

// ── Ações: Editar ─────────────────────────────────────────────
document.getElementById('mi-select-all').addEventListener('click', function() {
  document.querySelectorAll('.panel-card, .board-card').forEach(function(c) { c.classList.add('selected'); });
});

document.getElementById('mi-delete-selected').addEventListener('click', function() {
  if (NoteManager.selectedId) NoteManager.removeNote(NoteManager.selectedId);
});

// ── Formatação de texto ───────────────────────────────────────
var TEXT_COLORS = [
  { value: '#202124', label: 'Preto'    },
  { value: '#d93025', label: 'Vermelho' },
  { value: '#f97316', label: 'Laranja'  },
  { value: '#ca8a04', label: 'Amarelo'  },
  { value: '#22c55e', label: 'Verde'    },
  { value: '#1a73e8', label: 'Azul'     },
  { value: '#a855f7', label: 'Roxo'     },
  { value: '#ffffff', label: 'Branco'   },
];
var currentTextColor = '#202124';
var fmtColorBar      = document.getElementById('fmt-color-bar');
var fmtColorDropdown = document.getElementById('fmt-color-dropdown');

TEXT_COLORS.forEach(function(tc) {
  var dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'fmt-color-dot' + (tc.value === currentTextColor ? ' active' : '');
  dot.style.background = tc.value;
  if (tc.value === '#ffffff') { dot.style.borderColor = '#dadce0'; }
  dot.setAttribute('aria-label', 'Cor: ' + tc.label);
  dot.setAttribute('title', tc.label);
  dot.addEventListener('mousedown', function(e) {
    e.preventDefault();
    currentTextColor = tc.value;
    fmtColorBar.style.background = tc.value;
    fmtColorDropdown.querySelectorAll('.fmt-color-dot').forEach(function(d) { d.classList.remove('active'); });
    dot.classList.add('active');
    document.execCommand('foreColor', false, tc.value);
    fmtColorDropdown.classList.remove('open');
  });
  fmtColorDropdown.appendChild(dot);
});

document.getElementById('fmt-bold').addEventListener('mousedown', function(e) {
  e.preventDefault();
  document.execCommand('bold');
});
document.getElementById('fmt-italic').addEventListener('mousedown', function(e) {
  e.preventDefault();
  document.execCommand('italic');
});
document.getElementById('fmt-color').addEventListener('mousedown', function(e) {
  e.preventDefault();
  fmtColorDropdown.classList.toggle('open');
});
document.addEventListener('mousedown', function(e) {
  if (!e.target.closest('.format-color-wrap')) {
    fmtColorDropdown.classList.remove('open');
  }
});