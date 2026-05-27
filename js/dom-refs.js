'use strict';

// ── DOM refs ──────────────────────────────────────────────────
var hamburgerBtn  = document.getElementById('btn-hamburger');
var gcNav         = document.getElementById('gc-nav');
var navItems      = document.querySelectorAll('.gc-nav-item[data-view]');

var extTrigger    = document.getElementById('ext-trigger');
var extBackdrop   = document.getElementById('ext-backdrop');
var extPanel      = document.getElementById('ext-panel');
var btnClose      = document.getElementById('btn-close');

var notesList     = document.getElementById('notes-list');
var panelEmpty    = document.getElementById('panel-empty');
var panelCounter  = document.getElementById('panel-counter');

var boardGrid     = document.getElementById('board-grid');
var boardCanvas   = document.getElementById('board-canvas');
var boardEmpty    = document.getElementById('board-empty');
var boardCount    = document.getElementById('board-count');

var fabBtn        = document.getElementById('btn-fab');
var addForm       = document.getElementById('add-form');
var noteInput     = document.getElementById('note-input');
var cancelBtn     = document.getElementById('btn-cancel');
var saveBtn       = document.getElementById('btn-save');
var errorMsgEl    = document.getElementById('error-msg');
var colorPickerEl = document.getElementById('color-picker');
var btnQuadroAdd  = document.getElementById('btn-quadro-add');

var zoomLevelEl   = document.getElementById('zoom-level');
var btnZoomIn     = document.getElementById('btn-zoom-in');
var btnZoomOut    = document.getElementById('btn-zoom-out');
var btnZoomReset  = document.getElementById('btn-zoom-reset');