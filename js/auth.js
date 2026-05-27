'use strict';

/* ============================================================
   AUTH.JS — Autenticação via API REST (Node + PostgreSQL)
   Fallback: localStorage para quando o servidor estiver offline.
   ============================================================ */

/* ── Helpers de sessão ───────────────────────────────────────── */
function authGetSession() {
  try { return JSON.parse(localStorage.getItem('snSession') || 'null'); }
  catch (_) { return null; }
}

function authIsLoggedIn() {
  var token = localStorage.getItem('snToken');
  var s     = authGetSession();
  return !!(token && s && s.email && s.loggedAt);
}

function authSignOut() {
  localStorage.removeItem('snToken');
  localStorage.removeItem('snSession');
  window.location.href = 'login.html';
}

/* ── Força da senha ──────────────────────────────────────────── */
function calcPasswordStrength(pwd) {
  if (!pwd) return 0;
  var score = 0;
  if (pwd.length >= 8)        score++;
  if (pwd.length >= 12)       score++;
  if (/[A-Z]/.test(pwd))      score++;
  if (/[0-9]/.test(pwd))      score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
}

function applyStrengthUI(score, segs, label) {
  var classes = ['', 'weak', 'fair', 'good', 'good'];
  var labels  = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
  var colors  = ['', '#ea4335', '#fbbc04', '#34a853', '#34a853'];
  segs.forEach(function(seg, i) {
    seg.className = 'auth-pwd-strength-seg';
    if (i < score) seg.classList.add(classes[score]);
  });
  if (label) {
    label.textContent = score > 0 ? labels[score] : '';
    label.style.color = colors[score];
  }
}

/* ── Toggle senha ────────────────────────────────────────────── */
function initPwdToggle(inputId, toggleBtnId, eyeIconId) {
  var input  = document.getElementById(inputId);
  var toggle = document.getElementById(toggleBtnId);
  var icon   = document.getElementById(eyeIconId);
  if (!input || !toggle) return;

  var eyeOpen = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  var eyeOff  = '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';

  toggle.addEventListener('click', function() {
    var showing = input.type === 'text';
    input.type  = showing ? 'password' : 'text';
    toggle.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
    if (icon) icon.innerHTML = showing ? eyeOpen : eyeOff;
  });
}

/* ── Validações ──────────────────────────────────────────────── */
function setFieldError(fieldId, msgId, msg) {
  var field = document.getElementById(fieldId);
  var span  = document.getElementById(msgId);
  if (!field) return;
  if (msg) {
    field.classList.add('has-error');
    if (span) span.textContent = msg;
  } else {
    field.classList.remove('has-error');
    if (span) span.textContent = '';
  }
}

function showAlert(alertId, msgId, msg) {
  var alert = document.getElementById(alertId);
  var span  = document.getElementById(msgId);
  if (!alert) return;
  if (span) span.textContent = msg;
  alert.classList.add('visible');
}

function hideAlert(alertId) {
  var el = document.getElementById(alertId);
  if (el) el.classList.remove('visible');
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || '').trim());
}

/* ── Botão de loading ────────────────────────────────────────── */
function setBtnLoading(btn, loading) {
  btn.disabled = loading;
  if (loading) {
    btn._origHTML = btn.innerHTML;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" style="animation:spin .8s linear infinite"/></svg><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
  } else if (btn._origHTML) {
    btn.innerHTML = btn._origHTML;
  }
}

/* ============================================================
   LOGIN PAGE
   ============================================================ */
function initLoginPage() {
  var form = document.getElementById('login-form');
  if (!form) return;

  initPwdToggle('login-email', null, null); // not needed for email
  initPwdToggle('login-password', 'toggle-pwd', 'eye-icon');

  var emailInput = document.getElementById('login-email');
  var pwdInput   = document.getElementById('login-password');
  var btnLogin   = document.getElementById('btn-login');

  /* Limpa erros ao digitar */
  if (emailInput) emailInput.addEventListener('input', function() {
    setFieldError('field-email', 'email-msg', '');
    hideAlert('login-alert');
  });
  if (pwdInput) pwdInput.addEventListener('input', function() {
    setFieldError('field-password', 'password-msg', '');
    hideAlert('login-alert');
  });

  /* ── Modal esqueceu a senha ─── */
  var overlay         = document.getElementById('forgot-overlay');
  var btnForgot       = document.getElementById('btn-forgot');
  var btnForgotCancel = document.getElementById('btn-forgot-cancel');
  var btnForgotSend   = document.getElementById('btn-forgot-send');
  var forgotEmail     = document.getElementById('forgot-email');
  var forgotSuccess   = document.getElementById('forgot-success');

  if (btnForgot) btnForgot.addEventListener('click', function(e) {
    e.preventDefault();
    if (forgotEmail && emailInput) forgotEmail.value = emailInput.value;
    if (forgotSuccess) forgotSuccess.style.display = 'none';
    setFieldError('field-forgot-email', 'forgot-email-msg', '');
    if (overlay) overlay.classList.add('open');
    setTimeout(function() { if (forgotEmail) forgotEmail.focus(); }, 120);
  });

  function closeForgot() { if (overlay) overlay.classList.remove('open'); }
  if (btnForgotCancel) btnForgotCancel.addEventListener('click', closeForgot);
  if (overlay) overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeForgot();
  });
  if (btnForgotSend) btnForgotSend.addEventListener('click', function() {
    var email = forgotEmail ? forgotEmail.value.trim() : '';
    if (!isValidEmail(email)) {
      setFieldError('field-forgot-email', 'forgot-email-msg', 'Informe um e-mail válido.');
      return;
    }
    setFieldError('field-forgot-email', 'forgot-email-msg', '');
    if (forgotSuccess) { forgotSuccess.style.display = 'flex'; }
    btnForgotSend.disabled = true;
    setTimeout(closeForgot, 2500);
  });

  /* ── Submit ─── */
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    hideAlert('login-alert');

    var email = emailInput ? emailInput.value.trim() : '';
    var pwd   = pwdInput   ? pwdInput.value          : '';
    var valid = true;

    if (!isValidEmail(email)) {
      setFieldError('field-email', 'email-msg', 'Informe um e-mail válido.');
      valid = false;
    }
    if (!pwd) {
      setFieldError('field-password', 'password-msg', 'Informe sua senha.');
      valid = false;
    }
    if (!valid) return;

    setBtnLoading(btnLogin, true);

    API.login(email, pwd)
      .then(function(data) {
        API.saveSession(data.token, data.user);
        window.location.href = 'index.html';
      })
      .catch(function(err) {
        setBtnLoading(btnLogin, false);
        var msg = (err && err.error) || 'E-mail ou senha incorretos.';
        showAlert('login-alert', 'login-alert-msg', msg);
        setFieldError('field-email', 'email-msg', ' ');
        setFieldError('field-password', 'password-msg', ' ');
      });
  });
}

/* ============================================================
   CADASTRO PAGE
   ============================================================ */
function initRegisterPage() {
  var form = document.getElementById('register-form');
  if (!form) return;

  initPwdToggle('reg-password', 'toggle-reg-pwd',    'eye-icon-reg');
  initPwdToggle('reg-confirm',  'toggle-reg-confirm', 'eye-icon-confirm');

  var fnameInput   = document.getElementById('reg-fname');
  var lnameInput   = document.getElementById('reg-lname');
  var emailInput   = document.getElementById('reg-email');
  var pwdInput     = document.getElementById('reg-password');
  var confirmInput = document.getElementById('reg-confirm');
  var btnRegister  = document.getElementById('btn-register');

  /* Strength meter */
  var strengthSegs  = [1,2,3,4].map(function(i) { return document.getElementById('strength-seg-' + i); });
  var strengthLabel = document.getElementById('strength-label');

  if (pwdInput) pwdInput.addEventListener('input', function() {
    setFieldError('field-reg-password', 'reg-password-msg', '');
    hideAlert('register-alert');
    applyStrengthUI(calcPasswordStrength(pwdInput.value), strengthSegs, strengthLabel);
  });

  function clearOnInput(el, fid, mid) {
    if (el) el.addEventListener('input', function() {
      setFieldError(fid, mid, '');
      hideAlert('register-alert');
    });
  }
  clearOnInput(fnameInput,   'field-fname',       'fname-msg');
  clearOnInput(lnameInput,   'field-lname',       'lname-msg');
  clearOnInput(emailInput,   'field-reg-email',   'reg-email-msg');
  clearOnInput(confirmInput, 'field-reg-confirm', 'confirm-msg');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    hideAlert('register-alert');

    var fname   = fnameInput   ? fnameInput.value.trim()   : '';
    var lname   = lnameInput   ? lnameInput.value.trim()   : '';
    var email   = emailInput   ? emailInput.value.trim()   : '';
    var pwd     = pwdInput     ? pwdInput.value            : '';
    var confirm = confirmInput ? confirmInput.value        : '';
    var valid   = true;

    if (!fname) { setFieldError('field-fname', 'fname-msg', 'Informe seu nome.'); valid = false; }
    if (!lname) { setFieldError('field-lname', 'lname-msg', 'Informe seu sobrenome.'); valid = false; }
    if (!isValidEmail(email)) { setFieldError('field-reg-email', 'reg-email-msg', 'E-mail inválido.'); valid = false; }
    if (pwd.length < 6) { setFieldError('field-reg-password', 'reg-password-msg', 'Mínimo 6 caracteres.'); valid = false; }
    if (pwd !== confirm) { setFieldError('field-reg-confirm', 'confirm-msg', 'As senhas não coincidem.'); valid = false; }
    if (!valid) return;

    setBtnLoading(btnRegister, true);

    API.register(fname, lname, email, pwd)
      .then(function(data) {
        API.saveSession(data.token, data.user);
        window.location.href = 'index.html';
      })
      .catch(function(err) {
        setBtnLoading(btnRegister, false);
        var msg = (err && err.error) || 'Erro ao criar conta. Tente novamente.';
        showAlert('register-alert', 'register-alert-msg', msg);
        if (msg.toLowerCase().includes('e-mail')) {
          setFieldError('field-reg-email', 'reg-email-msg', msg);
        }
      });
  });
}

/* ── Init ────────────────────────────────────────────────────── */
(function() {
  initLoginPage();
  initRegisterPage();
})();
