'use strict';

// ── Zoom / Pan ────────────────────────────────────────────────
var bScale    = 1;
var bPanX     = 0;
var bPanY     = 0;
var MIN_SCALE = 0.2;
var MAX_SCALE = 4;

function applyBoardTransform() {
  boardCanvas.style.transform =
    'translate(' + bPanX + 'px, ' + bPanY + 'px) scale(' + bScale + ')';
  var dotSize = 22 * bScale;
  boardGrid.style.backgroundSize     = dotSize + 'px ' + dotSize + 'px';
  boardGrid.style.backgroundPosition = bPanX + 'px ' + bPanY + 'px';
  zoomLevelEl.textContent = Math.round(bScale * 100) + '%';
}

function zoomAt(cx, cy, newScale) {
  newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
  var canvasX = (cx - bPanX) / bScale;
  var canvasY = (cy - bPanY) / bScale;
  bScale = newScale;
  bPanX  = cx - canvasX * bScale;
  bPanY  = cy - canvasY * bScale;
  applyBoardTransform();
}

boardGrid.addEventListener('wheel', function(e) {
  e.preventDefault();
  var rect   = boardGrid.getBoundingClientRect();
  var factor = e.deltaY < 0 ? 1.1 : 0.9;
  zoomAt(e.clientX - rect.left, e.clientY - rect.top, bScale * factor);
}, { passive: false });

function zoomCenter(factor) {
  zoomAt(boardGrid.clientWidth / 2, boardGrid.clientHeight / 2, bScale * factor);
}
btnZoomIn.addEventListener('click',    function() { zoomCenter(1.25); });
btnZoomOut.addEventListener('click',   function() { zoomCenter(0.8);  });
btnZoomReset.addEventListener('click', function() {
  bScale = 1; bPanX = 0; bPanY = 0;
  applyBoardTransform();
});

document.addEventListener('keydown', function(e) {
  if (!e.ctrlKey && !e.metaKey) return;
  if (currentView !== 'quadro') return;
  if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomCenter(1.25); }
  if (e.key === '-')                  { e.preventDefault(); zoomCenter(0.8);  }
  if (e.key === '0')                  { e.preventDefault(); bScale=1; bPanX=0; bPanY=0; applyBoardTransform(); }
});

// ── Pan ───────────────────────────────────────────────────────
var isDragging  = false;
var dragStartX  = 0, dragStartY  = 0;
var dragStartPX = 0, dragStartPY = 0;
var hasMoved    = false;

// ── Card drag state ───────────────────────────────────────────
var activeDragCard        = null;
var activeDragNoteId      = null;
var activeDragOffsetX     = 0;
var activeDragOffsetY     = 0;
var activeDragHasMoved    = false;
var lastCardDragHasMoved  = false;
var activeDragOldX        = 0;
var activeDragOldY        = 0;

function screenToCanvas(sx, sy) {
  var rect = boardGrid.getBoundingClientRect();
  return {
    x: (sx - rect.left - bPanX) / bScale,
    y: (sy - rect.top  - bPanY) / bScale,
  };
}

function getInitialBoardPos() {
  var cx  = (boardGrid.clientWidth  / 2 - bPanX) / bScale - 110;
  var cy  = (boardGrid.clientHeight / 3 - bPanY) / bScale;
  var off = NoteManager.notes.length % 8 * 30;
  return { x: Math.max(20, cx + off), y: Math.max(20, cy + off) };
}

boardGrid.addEventListener('mousedown', function(e) {
  if (e.target.closest('.board-card') || e.target.closest('.board-card-toolbar')) return;
  isDragging  = true;
  hasMoved    = false;
  dragStartX  = e.clientX;
  dragStartY  = e.clientY;
  dragStartPX = bPanX;
  dragStartPY = bPanY;
  boardGrid.classList.add('dragging');
  e.preventDefault();
});

document.addEventListener('mousemove', function(e) {
  if (activeDragCard) {
    var pos = screenToCanvas(e.clientX, e.clientY);
    activeDragCard.style.left  = (pos.x - activeDragOffsetX) + 'px';
    activeDragCard.style.top   = (pos.y - activeDragOffsetY) + 'px';
    activeDragHasMoved = true;
    return;
  }
  if (!isDragging) return;
  var dx = e.clientX - dragStartX;
  var dy = e.clientY - dragStartY;
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasMoved = true;
  bPanX = dragStartPX + dx;
  bPanY = dragStartPY + dy;
  applyBoardTransform();
});

document.addEventListener('mouseup', function(e) {
  if (activeDragCard) {
    lastCardDragHasMoved = activeDragHasMoved;

    if (activeDragHasMoved) {
      var pos = screenToCanvas(e.clientX, e.clientY);
      var nx  = pos.x - activeDragOffsetX;
      var ny  = pos.y - activeDragOffsetY;

      for (var i = 0; i < NoteManager.notes.length; i++) {
        if (NoteManager.notes[i].id === activeDragNoteId) {
          NoteManager.notes[i].boardX = nx;
          NoteManager.notes[i].boardY = ny;
          break;
        }
      }

      pushUndo({ type: 'move', id: activeDragNoteId,
                 oldX: activeDragOldX, oldY: activeDragOldY, newX: nx, newY: ny });

      /* Persiste nova posição no banco */
      var noteIdToSave = activeDragNoteId;
      API.updateNote(noteIdToSave, { x: nx, y: ny }).catch(function(err) {
        console.warn('[Canvas] save position falhou:', err);
      });
    }

    activeDragCard.classList.remove('dragging-card');
    activeDragCard     = null;
    activeDragNoteId   = null;
    activeDragHasMoved = false;
    return;
  }

  if (!isDragging) return;
  isDragging = false;
  boardGrid.classList.remove('dragging');
});
