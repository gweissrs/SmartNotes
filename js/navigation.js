'use strict';

// ── Hamburger ─────────────────────────────────────────────────
var navOpen = true;

hamburgerBtn.addEventListener('click', function() {
  navOpen = !navOpen;
  hamburgerBtn.classList.toggle('active', !navOpen);
  gcNav.classList.toggle('closed', !navOpen);
});

// ── Navegação entre views ─────────────────────────────────────
var currentView = 'tarefas';
var views = {
  quadro:     document.getElementById('view-quadro'),
  tarefas:    document.getElementById('view-tarefas'),
  calendario: document.getElementById('view-calendario'),
  outros:     document.getElementById('view-outros'),
};

function switchView(name) {
  currentView = name;

  // atualiza views
  Object.keys(views).forEach(function(k) {
    views[k].classList.add('hidden');
  });
  var target = views[name] || views['outros'];
  target.classList.remove('hidden');

  // atualiza nav
  navItems.forEach(function(item) {
    var v = item.getAttribute('data-view');
    item.classList.toggle('active', v === name);
  });

  // FAB só aparece no quadro
  extTrigger.style.display = (name === 'quadro') ? '' : 'none';

  // Re-executa pesquisa para a nova view
  if (typeof searchBarInput !== 'undefined' && searchBarInput.value.trim()) {
    setTimeout(function() { doSearch(searchBarInput.value); }, 80);
  } else if (typeof clearAllHighlights === 'function') {
    clearAllHighlights();
  }
}

navItems.forEach(function(item) {
  item.addEventListener('click', function() {
    var v = item.getAttribute('data-view');
    switchView(v);
  });
});