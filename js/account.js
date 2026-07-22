'use strict';

// ── Menu de conta ────────────────────────────────────────────
(function() {
  var AVATAR_COLORS = [
    { bg: 'linear-gradient(135deg,#34a853,#4285f4)', id: 'green-blue'  },
    { bg: 'linear-gradient(135deg,#ea4335,#fbbc04)', id: 'red-yellow'  },
    { bg: 'linear-gradient(135deg,#9c27b0,#e91e63)', id: 'purple-pink' },
    { bg: 'linear-gradient(135deg,#0097a7,#00bcd4)', id: 'teal'        },
    { bg: 'linear-gradient(135deg,#ff5722,#ff9800)', id: 'orange'      },
    { bg: 'linear-gradient(135deg,#1a73e8,#0d47a1)', id: 'blue'        },
  ];

  /* ── Perfil inicial (session → localStorage → default) ──── */
  var _session = (function() {
    try { return JSON.parse(localStorage.getItem('snSession') || 'null'); } catch(_) { return null; }
  })();

  var userProfile = (function() {
    try { return JSON.parse(localStorage.getItem('snUserProfile') || 'null'); } catch(_) { return null; }
  })() || {
    name:     (_session && _session.name)  || 'Usuário',
    email:    (_session && _session.email) || '',
    colorIdx: 0,
    theme:    'light',
  };

  function saveProfile() {
    localStorage.setItem('snUserProfile', JSON.stringify(userProfile));
  }

  /* ── Tema ─────────────────────────────────────────────────── */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var badge = document.getElementById('acct-theme-badge');
    if (badge) badge.textContent = theme === 'dark' ? 'Escuro' : 'Claro';

    if (theme === 'dark') {
      document.documentElement.style.setProperty('--surface',   '#1e1e2e');
      document.documentElement.style.setProperty('--surface-2', '#252535');
      document.documentElement.style.setProperty('--surface-3', '#2a2a3e');
      document.documentElement.style.setProperty('--outline',   '#3c3c54');
      document.documentElement.style.setProperty('--text',      '#e2e2f0');
      document.documentElement.style.setProperty('--text-2',    '#9898b8');
    } else {
      ['--surface','--surface-2','--surface-3','--outline','--text','--text-2']
        .forEach(function(v) { document.documentElement.style.removeProperty(v); });
    }
  }

  /* ── Avatar ───────────────────────────────────────────────── */
  function applyAvatar(colorIdx, initial) {
    var bg = (AVATAR_COLORS[colorIdx] || AVATAR_COLORS[0]).bg;
    document.querySelectorAll('#btn-avatar, #acct-avatar-lg, #acct-modal-avatar-preview')
      .forEach(function(el) {
        el.style.background = bg;
        el.textContent = initial || userProfile.name.charAt(0).toUpperCase() || 'U';
      });
  }

  function applyProfileUI() {
    var initial = userProfile.name.charAt(0).toUpperCase() || 'U';
    applyAvatar(userProfile.colorIdx, initial);
    var nameEl  = document.getElementById('acct-display-name');
    var emailEl = document.getElementById('acct-display-email');
    if (nameEl)  nameEl.textContent  = userProfile.name;
    if (emailEl) emailEl.textContent = userProfile.email;
    applyTheme(userProfile.theme || 'light');
  }

  /* ── Sincroniza perfil com a API ─────────────────────────── */
  function syncProfileFromAPI() {
    if (!localStorage.getItem('snToken')) return;
    API.getProfile().then(function(user) {
      userProfile.name     = user.name  || userProfile.name;
      userProfile.email    = user.email || userProfile.email;
      userProfile.colorIdx = user.colorIdx != null ? user.colorIdx : userProfile.colorIdx;
      userProfile.theme    = user.theme || userProfile.theme;
      saveProfile();
      applyProfileUI();
    }).catch(function() { /* offline — usa local */ });
  }

  applyProfileUI();
  syncProfileFromAPI();

  /* ── Abrir / fechar menu ─────────────────────────────────── */
  var btnAvatar   = document.getElementById('btn-avatar');
  var accountMenu = document.getElementById('account-menu');

  function closeMenu() {
    accountMenu.classList.remove('open');
    btnAvatar.classList.remove('open');
    btnAvatar.setAttribute('aria-expanded', 'false');
  }

  btnAvatar.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = accountMenu.classList.toggle('open');
    btnAvatar.classList.toggle('open', isOpen);
    btnAvatar.setAttribute('aria-expanded', String(isOpen));
  });
  btnAvatar.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btnAvatar.click(); }
  });
  document.addEventListener('click', function(e) {
    if (!accountMenu.contains(e.target) && e.target !== btnAvatar) closeMenu();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ── Tema ─────────────────────────────────────────────────── */
  document.getElementById('acct-item-theme').addEventListener('click', function() {
    userProfile.theme = userProfile.theme === 'dark' ? 'light' : 'dark';
    saveProfile();
    applyTheme(userProfile.theme);
    API.updateProfile({ theme: userProfile.theme }).catch(function() {});
    closeMenu();
  });

  /* ── Exportar dados ──────────────────────────────────────── */
  document.getElementById('acct-item-export').addEventListener('click', function() {
    var data = { profile: userProfile };
    try { data.session = JSON.parse(localStorage.getItem('snSession') || '{}'); } catch(_) {}
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'smartnotes-perfil-' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    closeMenu();
  });

  /* ── Limpar dados locais ─────────────────────────────────── */
  document.getElementById('acct-item-clear-data').addEventListener('click', function() {
    if (!confirm('Isso limpará os dados temporários locais. Os dados no servidor são mantidos.\n\nContinuar?')) return;
    ['snUserProfile'].forEach(function(k) { localStorage.removeItem(k); });
    closeMenu();
    location.reload();
  });

  /* ── Sair ─────────────────────────────────────────────────── */
  document.getElementById('acct-item-signout').addEventListener('click', function() {
    if (!confirm('Deseja sair da conta?')) return;
    closeMenu();
    var page = document.querySelector('.webpage');
    if (page) { page.style.transition = 'opacity .35s'; page.style.opacity = '0'; }
    setTimeout(function() {
      localStorage.removeItem('snToken');
      localStorage.removeItem('snSession');
      localStorage.removeItem('snUserProfile');
      window.location.href = 'login.html';
    }, 380);
  });

  /* ── Modal editar perfil ─────────────────────────────────── */
  var overlay      = document.getElementById('acct-modal-overlay');
  var inpName      = document.getElementById('acct-input-name');
  var inpEmail     = document.getElementById('acct-input-email');
  var colorRow     = document.getElementById('acct-color-row');
  var modalPreview = document.getElementById('acct-modal-avatar-preview');
  var tempColorIdx = userProfile.colorIdx;

  function buildColorRow() {
    colorRow.innerHTML = '';
    AVATAR_COLORS.forEach(function(c, i) {
      var btn = document.createElement('button');
      btn.className = 'acct-color-opt' + (i === tempColorIdx ? ' active' : '');
      btn.style.background = c.bg;
      btn.title = 'Cor ' + (i + 1);
      btn.addEventListener('click', function() {
        tempColorIdx = i;
        modalPreview.style.background = c.bg;
        colorRow.querySelectorAll('.acct-color-opt').forEach(function(b, j) {
          b.classList.toggle('active', j === i);
        });
      });
      colorRow.appendChild(btn);
    });
  }

  function openModal() {
    tempColorIdx = userProfile.colorIdx;
    inpName.value  = userProfile.name;
    inpEmail.value = userProfile.email;
    modalPreview.textContent      = userProfile.name.charAt(0).toUpperCase() || 'U';
    modalPreview.style.background = (AVATAR_COLORS[userProfile.colorIdx] || AVATAR_COLORS[0]).bg;
    buildColorRow();
    overlay.classList.add('open');
    closeMenu();
    setTimeout(function() { inpName.focus(); inpName.select(); }, 200);
  }

  function closeModal() { overlay.classList.remove('open'); }

  document.getElementById('btn-acct-edit-profile').addEventListener('click', openModal);
  document.getElementById('acct-item-profile').addEventListener('click', openModal);
  document.getElementById('acct-modal-close').addEventListener('click', closeModal);
  document.getElementById('acct-modal-cancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });

  inpName.addEventListener('input', function() {
    var ch = inpName.value.trim().charAt(0).toUpperCase() || 'U';
    modalPreview.textContent = ch;
  });

  document.getElementById('acct-modal-save').addEventListener('click', function() {
    var newName  = inpName.value.trim();
    var newEmail = inpEmail.value.trim();
    if (!newName) { inpName.focus(); return; }

    userProfile.name     = newName;
    userProfile.email    = newEmail || userProfile.email;
    userProfile.colorIdx = tempColorIdx;
    saveProfile();
    applyProfileUI();
    closeModal();

    /* Persiste no banco */
    var parts = newName.split(' ');
    API.updateProfile({
      fname:    parts[0]              || newName,
      lname:    parts.slice(1).join(' ') || '',
      email:    newEmail || undefined,
      colorIdx: tempColorIdx,
    }).catch(function() { /* offline — alteração salva localmente */ });
  });

})();
