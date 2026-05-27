'use strict';

/* ============================================================
   API.JS — Cliente centralizado para a SmartNotes REST API
   Todas as funções retornam Promises.
   ============================================================ */

var API_BASE = (typeof window !== 'undefined' && window.SN_API_BASE)
  ? window.SN_API_BASE
  : 'http://localhost:3001/api';

/* ── Token helpers ───────────────────────────────────────────── */
var API = {

  _token: function() {
    return localStorage.getItem('snToken') || '';
  },

  _setToken: function(token) {
    localStorage.setItem('snToken', token);
  },

  _clearToken: function() {
    localStorage.removeItem('snToken');
    localStorage.removeItem('snSession');
  },

  /* ── Request base ─────────────────────────────────────────── */
  _req: function(method, path, body) {
    var token = API._token();
    var opts  = {
      method:  method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body !== undefined) opts.body = JSON.stringify(body);

    return fetch(API_BASE + path, opts).then(function(res) {
      if (res.status === 401) {
        API._clearToken();
        window.location.href = 'login.html';
        return Promise.reject(new Error('Unauthorized'));
      }
      if (res.status === 204) return null;

      return res.json().then(function(data) {
        if (!res.ok) return Promise.reject(data);
        return data;
      });
    });
  },

  /* ── Auth ─────────────────────────────────────────────────── */
  register: function(fname, lname, email, password) {
    return API._req('POST', '/auth/register', { fname: fname, lname: lname, email: email, password: password });
  },

  login: function(email, password) {
    return API._req('POST', '/auth/login', { email: email, password: password });
  },

  me: function() {
    return API._req('GET', '/auth/me');
  },

  /* ── Profile ──────────────────────────────────────────────── */
  getProfile: function() {
    return API._req('GET', '/profile');
  },

  updateProfile: function(data) {
    return API._req('PATCH', '/profile', data);
  },

  /* ── Boards ───────────────────────────────────────────────── */
  getBoards: function() {
    return API._req('GET', '/boards');
  },

  createBoard: function(name) {
    return API._req('POST', '/boards', { name: name });
  },

  updateBoard: function(id, data) {
    return API._req('PATCH', '/boards/' + id, data);
  },

  deleteBoard: function(id) {
    return API._req('DELETE', '/boards/' + id);
  },

  /* ── Notes ────────────────────────────────────────────────── */
  getNotes: function(boardId) {
    return API._req('GET', '/boards/' + boardId + '/notes');
  },

  createNote: function(boardId, data) {
    return API._req('POST', '/boards/' + boardId + '/notes', data);
  },

  updateNote: function(id, data) {
    return API._req('PATCH', '/notes/' + id, data);
  },

  deleteNote: function(id) {
    return API._req('DELETE', '/notes/' + id);
  },

  /* ── Health check (testa se a API está acessível) ─────────── */
  health: function() {
    return fetch(API_BASE + '/health').then(function(r) { return r.json(); });
  },

  /* ── Sessão helper (salva token + session após login/register) */
  saveSession: function(token, user) {
    API._setToken(token);
    localStorage.setItem('snSession', JSON.stringify({
      email:    user.email,
      name:     user.name,
      loggedAt: Date.now(),
    }));
  },
};
