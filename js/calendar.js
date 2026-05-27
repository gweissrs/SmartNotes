'use strict';

// ── Calendário ───────────────────────────────────────────────────
(function() {
  var CAL_COLORS  = ['#1a73e8','#34a853','#ea4335','#fbbc04','#9334e6','#00bcd4'];
  var MONTHS_PT   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var DAYS_SHORT  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  var DAYS_MINI   = ['D','S','T','Q','Q','S','S'];
  var DAYS_LONG   = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

  var calEvents = {};
  try { calEvents = JSON.parse(localStorage.getItem('snCalEvents') || '{}'); } catch(e) {}
  function saveCalEvents() { try { localStorage.setItem('snCalEvents', JSON.stringify(calEvents)); } catch(e) {} }

  var today    = new Date();
  var calYear  = today.getFullYear();
  var calMonth = today.getMonth();
  var selDate  = null; // "YYYY-MM-DD"

  var elGrid     = document.getElementById('cal-grid');
  var elTitle    = document.getElementById('cal-month-title');
  var elWd       = document.getElementById('cal-weekdays');
  var elStrip    = document.getElementById('cal-mini-strip');
  var elPanel    = document.getElementById('cal-day-panel');
  var elPanTitle = document.getElementById('cal-day-panel-title');
  var elPanBody  = document.getElementById('cal-day-panel-body');

  // Build weekday headers once
  DAYS_SHORT.forEach(function(d) {
    var el = document.createElement('div');
    el.className = 'cal-weekday';
    el.textContent = d;
    elWd.appendChild(el);
  });

  function toKey(y, m, d) {
    return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }
  function parseKey(k) {
    var p = k.split('-');
    return { y: +p[0], m: +p[1] - 1, d: +p[2] };
  }
  function isToday(y, m, d) {
    return y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
  }

  // ── Main grid ───────────────────────────────────────────────────
  function renderMain() {
    elTitle.textContent = MONTHS_PT[calMonth] + ' ' + calYear;
    elGrid.innerHTML = '';

    var firstDay    = new Date(calYear, calMonth, 1).getDay();
    var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    var daysInPrev  = new Date(calYear, calMonth, 0).getDate();

    var cells = [];
    for (var i = firstDay - 1; i >= 0; i--) cells.push({ d: daysInPrev - i, m: calMonth - 1, y: calYear });
    for (var d = 1; d <= daysInMonth; d++) cells.push({ d: d, m: calMonth, y: calYear });
    while (cells.length < 42) cells.push({ d: cells.length - firstDay - daysInMonth + 1, m: calMonth + 1, y: calYear });

    cells.forEach(function(c) {
      var date = new Date(c.y, c.m, c.d);
      var ry = date.getFullYear(), rm = date.getMonth(), rd = date.getDate();
      var key = toKey(ry, rm, rd);
      var isOther = rm !== calMonth || ry !== calYear;
      var events  = calEvents[key] || [];

      var cell = document.createElement('div');
      cell.className = 'cal-day'
        + (isOther ? ' other-month' : '')
        + (isToday(ry, rm, rd) ? ' is-today' : '')
        + (key === selDate ? ' selected' : '');

      var numEl = document.createElement('div');
      numEl.className = 'cal-day-num';
      numEl.textContent = rd;
      cell.appendChild(numEl);

      if (events.length > 0) {
        var evWrap = document.createElement('div');
        evWrap.className = 'cal-day-events';
        events.slice(0, 2).forEach(function(ev) {
          var chip = document.createElement('div');
          chip.className = 'cal-day-event-chip';
          chip.style.background = ev.color || CAL_COLORS[0];
          chip.textContent = (ev.time ? ev.time + ' ' : '') + ev.title;
          evWrap.appendChild(chip);
        });
        if (events.length > 2) {
          var more = document.createElement('div');
          more.className = 'cal-day-more';
          more.textContent = '+' + (events.length - 2) + ' mais';
          evWrap.appendChild(more);
        }
        cell.appendChild(evWrap);
      }

      cell.addEventListener('dblclick', function() {
        if (isOther) { calYear = ry; calMonth = rm; }
        selDate = key;
        renderMain();
        renderMiniStrip();
        openDayPanel(key);
      });

      elGrid.appendChild(cell);
    });
  }

  // ── Mini strip ─────────────────────────────────────────────────
  function renderMiniStrip() {
    elStrip.innerHTML = '';
    for (var i = 0; i < 12; i++) {
      var ref  = new Date(today.getFullYear(), today.getMonth() + i, 1);
      var y = ref.getFullYear(), m = ref.getMonth();

      var block = document.createElement('div');
      block.className = 'cal-mini-month';

      var title = document.createElement('div');
      title.className = 'cal-mini-title';
      title.textContent = MONTHS_PT[m] + ' ' + y;
      block.appendChild(title);

      var wds = document.createElement('div');
      wds.className = 'cal-mini-weekdays';
      DAYS_MINI.forEach(function(d) {
        var el = document.createElement('div');
        el.className = 'cal-mini-wd';
        el.textContent = d;
        wds.appendChild(el);
      });
      block.appendChild(wds);

      var grid = document.createElement('div');
      grid.className = 'cal-mini-grid';

      var firstDay    = new Date(y, m, 1).getDay();
      var daysInMonth = new Date(y, m + 1, 0).getDate();
      var daysInPrev  = new Date(y, m, 0).getDate();

      for (var p = firstDay - 1; p >= 0; p--) {
        var el = document.createElement('div');
        el.className = 'cal-mini-day other-month';
        el.textContent = daysInPrev - p;
        grid.appendChild(el);
      }
      for (var d = 1; d <= daysInMonth; d++) {
        (function(day) {
          var key      = toKey(y, m, day);
          var todayDay = isToday(y, m, day);
          var selDay   = key === selDate;
          var hasEv    = !!(calEvents[key] && calEvents[key].length > 0);

          var el = document.createElement('div');
          el.className = 'cal-mini-day'
            + (todayDay ? ' is-today' : '')
            + (selDay   ? ' is-selected' : '')
            + (hasEv    ? ' has-events' : '');
          el.textContent = day;
          el.addEventListener('click', function() {
            calYear = y; calMonth = m;
            selDate = key;
            renderMain();
            renderMiniStrip();
            openDayPanel(key);
          });
          grid.appendChild(el);
        })(d);
      }
      var pad = (7 - (firstDay + daysInMonth) % 7) % 7;
      for (var n = 1; n <= pad; n++) {
        var el = document.createElement('div');
        el.className = 'cal-mini-day other-month';
        el.textContent = n;
        grid.appendChild(el);
      }

      block.appendChild(grid);
      elStrip.appendChild(block);
    }
  }

  // ── Day panel ──────────────────────────────────────────────────
  function openDayPanel(key) {
    var p    = parseKey(key);
    var date = new Date(p.y, p.m, p.d);
    elPanTitle.textContent = DAYS_LONG[date.getDay()] + ', ' + p.d + ' de ' + MONTHS_PT[p.m] + ' de ' + p.y;
    elPanel.classList.add('open');
    renderDayPanel(key, null);
  }

  function closeDayPanel() {
    elPanel.classList.remove('open');
    selDate = null;
    renderMain();
    renderMiniStrip();
  }

  function renderDayPanel(key, editingId) {
    elPanBody.innerHTML = '';
    var events = (calEvents[key] || []).slice().sort(function(a, b) {
      return (a.time || '').localeCompare(b.time || '');
    });

    if (events.length === 0 && !editingId) {
      var empty = document.createElement('p');
      empty.className = 'cal-empty-day';
      empty.textContent = 'Nenhum evento neste dia. Adicione um abaixo.';
      elPanBody.appendChild(empty);
    }

    events.forEach(function(ev) {
      if (ev.id === editingId) {
        elPanBody.appendChild(buildEventForm(key, ev));
        return;
      }
      var item = document.createElement('div');
      item.className = 'cal-event-item';

      var dot = document.createElement('div');
      dot.className = 'cal-event-dot';
      dot.style.background = ev.color || CAL_COLORS[0];

      var info = document.createElement('div');
      info.className = 'cal-event-info';

      var hdr = document.createElement('div');
      hdr.className = 'cal-event-header';

      var time = document.createElement('span');
      time.className = 'cal-event-time';
      time.textContent = ev.time || '';

      var titleEl = document.createElement('span');
      titleEl.className = 'cal-event-title';
      titleEl.textContent = ev.title;

      hdr.appendChild(time);
      hdr.appendChild(titleEl);
      info.appendChild(hdr);

      if (ev.note) {
        var note = document.createElement('span');
        note.className = 'cal-event-note';
        note.textContent = ev.note;
        info.appendChild(note);
      }

      var acts = document.createElement('div');
      acts.className = 'cal-event-actions';

      var editBtn = document.createElement('button');
      editBtn.className = 'cal-event-btn';
      editBtn.title = 'Editar';
      editBtn.innerHTML = '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      editBtn.addEventListener('click', function() { renderDayPanel(key, ev.id); });

      var delBtn = document.createElement('button');
      delBtn.className = 'cal-event-btn danger';
      delBtn.title = 'Excluir';
      delBtn.innerHTML = '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
      delBtn.addEventListener('click', function() { deleteCalEvent(key, ev.id); });

      acts.appendChild(editBtn);
      acts.appendChild(delBtn);
      item.appendChild(dot);
      item.appendChild(info);
      item.appendChild(acts);
      elPanBody.appendChild(item);
    });

    if (!editingId) {
      var addBtn = document.createElement('button');
      addBtn.className = 'cal-add-btn';
      addBtn.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Adicionar evento';

      var form = buildEventForm(key, null);
      elPanBody.appendChild(addBtn);
      elPanBody.appendChild(form);

      addBtn.addEventListener('click', function() {
        addBtn.style.display = 'none';
        form.classList.add('open');
        form.querySelector('.cal-form-input').focus();
      });
    }
  }

  function buildEventForm(key, existingEv) {
    var currentColor = existingEv ? (existingEv.color || CAL_COLORS[0]) : CAL_COLORS[0];

    var form = document.createElement('div');
    form.className = 'cal-event-form' + (existingEv ? ' open' : '');

    var titleInput = document.createElement('input');
    titleInput.className = 'cal-form-input';
    titleInput.type = 'text';
    titleInput.placeholder = 'Título do evento';
    titleInput.maxLength = 80;
    if (existingEv) titleInput.value = existingEv.title;
    form.appendChild(titleInput);

    var row = document.createElement('div');
    row.className = 'cal-form-row';

    var timeInput = document.createElement('input');
    timeInput.className = 'cal-form-input cal-form-time';
    timeInput.type = 'time';
    if (existingEv && existingEv.time) timeInput.value = existingEv.time;
    row.appendChild(timeInput);

    var picker = document.createElement('div');
    picker.className = 'cal-color-picker';
    CAL_COLORS.forEach(function(c) {
      var dot = document.createElement('button');
      dot.className = 'cal-color-opt' + (c === currentColor ? ' active' : '');
      dot.style.background = c;
      dot.type = 'button';
      dot.addEventListener('click', function() {
        currentColor = c;
        picker.querySelectorAll('.cal-color-opt').forEach(function(d) { d.classList.remove('active'); });
        dot.classList.add('active');
      });
      picker.appendChild(dot);
    });
    row.appendChild(picker);
    form.appendChild(row);

    var noteInput = document.createElement('input');
    noteInput.className = 'cal-form-input';
    noteInput.type = 'text';
    noteInput.placeholder = 'Nota (opcional)';
    noteInput.maxLength = 120;
    if (existingEv && existingEv.note) noteInput.value = existingEv.note;
    form.appendChild(noteInput);

    var acts = document.createElement('div');
    acts.className = 'cal-form-actions';

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'cal-form-cancel';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', function() { renderDayPanel(key, null); });

    var saveBtn = document.createElement('button');
    saveBtn.className = 'cal-form-save';
    saveBtn.type = 'button';
    saveBtn.textContent = existingEv ? 'Salvar' : 'Adicionar';
    saveBtn.addEventListener('click', function() {
      var t = titleInput.value.trim();
      if (!t) { titleInput.focus(); titleInput.style.borderColor = 'var(--danger)'; return; }
      if (!calEvents[key]) calEvents[key] = [];
      if (existingEv) {
        var idx = calEvents[key].findIndex(function(e) { return e.id === existingEv.id; });
        if (idx > -1) calEvents[key][idx] = { id: existingEv.id, title: t, time: timeInput.value, color: currentColor, note: noteInput.value.trim() };
      } else {
        calEvents[key].push({ id: crypto.randomUUID(), title: t, time: timeInput.value, color: currentColor, note: noteInput.value.trim() });
      }
      saveCalEvents();
      renderMain();
      renderMiniStrip();
      renderDayPanel(key, null);
    });

    [titleInput, noteInput].forEach(function(inp) {
      inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') saveBtn.click(); });
    });

    acts.appendChild(cancelBtn);
    acts.appendChild(saveBtn);
    form.appendChild(acts);
    return form;
  }

  function deleteCalEvent(key, id) {
    if (!calEvents[key]) return;
    calEvents[key] = calEvents[key].filter(function(e) { return e.id !== id; });
    if (calEvents[key].length === 0) delete calEvents[key];
    saveCalEvents();
    renderMain();
    renderMiniStrip();
    renderDayPanel(key, null);
  }

  // ── Navigation ─────────────────────────────────────────────────
  document.getElementById('cal-prev').addEventListener('click', function() {
    calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
    renderMain(); renderMiniStrip();
  });
  document.getElementById('cal-next').addEventListener('click', function() {
    calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
    renderMain(); renderMiniStrip();
  });
  document.getElementById('cal-today').addEventListener('click', function() {
    calYear = today.getFullYear(); calMonth = today.getMonth();
    renderMain(); renderMiniStrip();
  });
  document.getElementById('cal-day-panel-close').addEventListener('click', closeDayPanel);

  // ── Init on first show ──────────────────────────────────────────
  var calReady = false;
  var _origSwitch = switchView;
  switchView = function(name) {
    _origSwitch(name);
    if (name === 'calendario') {
      if (!calReady) { calReady = true; renderMain(); renderMiniStrip(); }
    }
  };
})();