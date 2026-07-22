'use strict';

// ── Pesquisa (Ctrl+F) ─────────────────────────────────────────
var searchBarInput = document.getElementById('search-bar-input');
var searchCountEl  = document.getElementById('search-count');
var searchHLs      = [];
var currentHLIdx   = 0;

function getSearchTargets() {
  if (currentView === 'quadro')  return Array.from(document.querySelectorAll('.board-card-text'));
  if (currentView === 'tarefas') return Array.from(document.querySelectorAll('.tnote-preview-text, .tnote-preview-title'));
  return [];
}

function clearAllHighlights() {
  document.querySelectorAll('mark.search-hl').forEach(function(m) {
    var p = m.parentNode;
    if (!p) return;
    while (m.firstChild) p.insertBefore(m.firstChild, m);
    p.removeChild(m);
  });
  getSearchTargets().forEach(function(el) { try { el.normalize(); } catch(e) {} });
  searchHLs = [];
  currentHLIdx = 0;
  searchCountEl.textContent = '';
}

function highlightInEl(el, query) {
  var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: function(n) {
      var tag = n.parentElement && n.parentElement.tagName;
      return (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'MARK')
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  }, false);
  var nodes = [];
  var n;
  while ((n = walker.nextNode())) nodes.push(n);

  var count = 0;
  var lq = query.toLowerCase();
  nodes.forEach(function(node) {
    var text = node.textContent;
    var lt   = text.toLowerCase();
    var idx  = lt.indexOf(lq);
    if (idx === -1) return;
    var frag = document.createDocumentFragment();
    var last = 0;
    while (idx !== -1) {
      if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
      var mark = document.createElement('mark');
      mark.className = 'search-hl';
      mark.textContent = text.slice(idx, idx + query.length);
      frag.appendChild(mark);
      count++;
      last = idx + query.length;
      idx  = lt.indexOf(lq, last);
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
  return count;
}

function activateHL(idx) {
  searchHLs.forEach(function(m, i) { m.classList.toggle('search-current', i === idx); });
  if (searchHLs[idx]) searchHLs[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
  searchCountEl.textContent = searchHLs.length
    ? (idx + 1) + ' / ' + searchHLs.length
    : 'Sem resultados';
}

var searchDebounce = null;
function doSearch(query) {
  clearAllHighlights();
  if (!query.trim()) return;
  getSearchTargets().forEach(function(el) { highlightInEl(el, query); });
  searchHLs = Array.from(document.querySelectorAll('mark.search-hl'));
  currentHLIdx = 0;
  if (searchHLs.length) activateHL(0);
  else searchCountEl.textContent = 'Sem resultados';
}

searchBarInput.addEventListener('input', function() {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(function() { doSearch(searchBarInput.value); }, 220);
});

searchBarInput.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    searchBarInput.value = ''; clearAllHighlights(); searchBarInput.blur(); return;
  }
  if (e.key === 'Enter' && searchHLs.length) {
    e.preventDefault();
    currentHLIdx = e.shiftKey
      ? (currentHLIdx - 1 + searchHLs.length) % searchHLs.length
      : (currentHLIdx + 1) % searchHLs.length;
    activateHL(currentHLIdx);
  }
});

// Interceptar Ctrl+F para abrir a search bar
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    searchBarInput.focus();
    searchBarInput.select();
  }
});

// Initialize with one default board (switchBoard calls switchView('quadro') which shows the FAB)
extTrigger.style.display = 'none';
var _defaultBoard = addBoard('Quadro Principal');
switchBoard(_defaultBoard.id);