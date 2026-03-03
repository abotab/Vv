/* studio.js — Safwan Studio Drawing Engine */

'use strict';

// ─────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────
const State = {
  tool: 'brush',
  brushType: 'round',
  brushSize: 20,
  brushOpacity: 1,
  brushFlow: 1,
  brushHardness: 0.8,
  blendMode: 'source-over',
  smoothing: 50,
  fgColor: '#FF6B35',
  bgColor: '#1A1A2E',
  zoom: 1,
  panX: 0,
  panY: 0,
  isDrawing: false,
  isPanning: false,
  spaceHeld: false,
  lastX: 0,
  lastY: 0,
  history: [],
  redoStack: [],
  MAX_HISTORY: 50,
  canvasW: 1920,
  canvasH: 1080,
  canvasBg: 'white',
  layers: [],
  activeLayerIndex: 0,
  selection: null,
  refImage: null,
  refOpacity: 0.5,
  refLocked: false,
  theme: 'dark',
  showGrid: false,
  showRuler: true,
  copyBuffer: null,
  textPos: { x: 0, y: 0 },
  drawing: { startX: 0, startY: 0 },
};

// ─────────────────────────────────────────────────────────
//  DOM REFS
// ─────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const mainCanvas = $('mainCanvas');
const overlayCanvas = $('overlayCanvas');
const referenceCanvas = $('referenceCanvas');
const canvasViewport = $('canvasViewport');
const canvasWrapper = $('canvasWrapper');
const layersList = $('layersList');
const toast = $('toast');

let ctx = mainCanvas.getContext('2d');
const octx = overlayCanvas.getContext('2d');
const rctx = referenceCanvas.getContext('2d');

// ─────────────────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, duration = 2000) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ─────────────────────────────────────────────────────────
//  INIT — New Project Modal
// ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Size presets
  $$('.size-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.size-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('canvasW').value = btn.dataset.w;
      $('canvasH').value = btn.dataset.h;
    });
  });

  // BG options
  $$('.bg-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.bg-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Create project
  $('createProjectBtn').addEventListener('click', () => {
    State.canvasW = parseInt($('canvasW').value) || 1920;
    State.canvasH = parseInt($('canvasH').value) || 1080;
    const activeBg = document.querySelector('.bg-opt.active');
    State.canvasBg = activeBg ? activeBg.dataset.bg : 'white';
    $('newProjectModal').style.display = 'none';
    initStudio();
  });
});

// ─────────────────────────────────────────────────────────
//  STUDIO INIT
// ─────────────────────────────────────────────────────────
function initStudio() {
  setupCanvas();
  setupLayers();
  setupTools();
  setupBrushPanel();
  setupColorPanel();
  setupLayersPanel();
  setupTopBar();
  setupKeyboard();
  setupCanvasEvents();
  setupModals();
  setupRulers();
  buildPalette();
  fitCanvas();
  renderLayersList();
  showToast('مرحباً بك في صفوان ستوديو');
}

// ─────────────────────────────────────────────────────────
//  CANVAS SETUP
// ─────────────────────────────────────────────────────────
function setupCanvas() {
  mainCanvas.width = State.canvasW;
  mainCanvas.height = State.canvasH;
  overlayCanvas.width = State.canvasW;
  overlayCanvas.height = State.canvasH;
  referenceCanvas.width = State.canvasW;
  referenceCanvas.height = State.canvasH;

  // Initial background
  ctx.fillStyle = State.canvasBg === 'transparent' ? 'transparent'
    : State.canvasBg === 'black' ? '#000000' : '#FFFFFF';
  if (State.canvasBg !== 'transparent') ctx.fillRect(0, 0, State.canvasW, State.canvasH);

  canvasWrapper.style.width = State.canvasW + 'px';
  canvasWrapper.style.height = State.canvasH + 'px';
}

// ─────────────────────────────────────────────────────────
//  LAYERS
// ─────────────────────────────────────────────────────────
function setupLayers() {
  State.layers = [];
  addLayer('الطبقة 1', true);
}

function addLayer(name, isBackground = false) {
  const offscreen = document.createElement('canvas');
  offscreen.width = State.canvasW;
  offscreen.height = State.canvasH;
  const lctx = offscreen.getContext('2d');

  if (isBackground && State.canvasBg !== 'transparent') {
    lctx.fillStyle = State.canvasBg === 'black' ? '#000000' : '#FFFFFF';
    lctx.fillRect(0, 0, State.canvasW, State.canvasH);
  }

  const layer = {
    id: Date.now() + Math.random(),
    name: name || `طبقة ${State.layers.length + 1}`,
    canvas: offscreen,
    ctx: lctx,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'source-over',
  };

  State.layers.unshift(layer);
  State.activeLayerIndex = 0;
  ctx = State.layers[0].ctx;
  compositeAll();
}

function compositeAll() {
  const displayCanvas = mainCanvas;
  const dctx = displayCanvas.getContext('2d');
  dctx.clearRect(0, 0, State.canvasW, State.canvasH);

  // Draw from bottom to top (reversed because we store layers top-first)
  for (let i = State.layers.length - 1; i >= 0; i--) {
    const layer = State.layers[i];
    if (!layer.visible) continue;
    dctx.globalAlpha = layer.opacity;
    dctx.globalCompositeOperation = layer.blendMode;
    dctx.drawImage(layer.canvas, 0, 0);
  }
  dctx.globalAlpha = 1;
  dctx.globalCompositeOperation = 'source-over';
}

function getActiveLayer() {
  return State.layers[State.activeLayerIndex];
}
function getActiveCtx() {
  return getActiveLayer() ? getActiveLayer().ctx : ctx;
}

// ─────────────────────────────────────────────────────────
//  HISTORY
// ─────────────────────────────────────────────────────────
function saveHistory() {
  const snapshot = State.layers.map(l => {
    const clone = document.createElement('canvas');
    clone.width = l.canvas.width;
    clone.height = l.canvas.height;
    clone.getContext('2d').drawImage(l.canvas, 0, 0);
    return { id: l.id, canvas: clone };
  });
  State.history.push(snapshot);
  if (State.history.length > State.MAX_HISTORY) State.history.shift();
  State.redoStack = [];
  updateHistoryBtns();
}

function undo() {
  if (State.history.length === 0) return showToast('لا يوجد ما يمكن التراجع عنه');
  const redoSnap = State.layers.map(l => {
    const c = document.createElement('canvas');
    c.width = l.canvas.width; c.height = l.canvas.height;
    c.getContext('2d').drawImage(l.canvas, 0, 0);
    return { id: l.id, canvas: c };
  });
  State.redoStack.push(redoSnap);

  const snap = State.history.pop();
  snap.forEach(s => {
    const l = State.layers.find(x => x.id === s.id);
    if (l) l.ctx.drawImage(s.canvas, 0, 0);
  });
  compositeAll();
  updateHistoryBtns();
  showToast('تم التراجع');
}

function redo() {
  if (State.redoStack.length === 0) return showToast('لا يوجد ما يمكن إعادته');
  const snap = State.redoStack.pop();
  const histSnap = State.layers.map(l => {
    const c = document.createElement('canvas');
    c.width = l.canvas.width; c.height = l.canvas.height;
    c.getContext('2d').drawImage(l.canvas, 0, 0);
    return { id: l.id, canvas: c };
  });
  State.history.push(histSnap);
  snap.forEach(s => {
    const l = State.layers.find(x => x.id === s.id);
    if (l) { l.ctx.clearRect(0, 0, l.canvas.width, l.canvas.height); l.ctx.drawImage(s.canvas, 0, 0); }
  });
  compositeAll();
  updateHistoryBtns();
  showToast('تمت الإعادة');
}

function updateHistoryBtns() {
  $('undoBtn').disabled = State.history.length === 0;
  $('redoBtn').disabled = State.redoStack.length === 0;
}

// ─────────────────────────────────────────────────────────
//  TOOLS SETUP
// ─────────────────────────────────────────────────────────
function setupTools() {
  $$('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.tool = btn.dataset.tool;
      updateCursor();
    });
  });
}

function updateCursor() {
  const cursors = {
    brush: 'crosshair',
    pencil: 'crosshair',
    eraser: 'cell',
    fill: 'cell',
    eyedropper: 'crosshair',
    'select-rect': 'crosshair',
    'select-circle': 'crosshair',
    lasso: 'crosshair',
    'magic-wand': 'crosshair',
    line: 'crosshair',
    rect: 'crosshair',
    circle: 'crosshair',
    text: 'text',
    move: 'move',
    hand: 'grab',
  };
  canvasViewport.style.cursor = cursors[State.tool] || 'crosshair';
}

// ─────────────────────────────────────────────────────────
//  BRUSH RENDERING
// ─────────────────────────────────────────────────────────
function getBrushPath(type, x, y, size) {
  // Returns drawing function for current brush type
  return type;
}

function drawBrush(lctx, x, y, pressure = 1) {
  const s = State.brushSize * pressure;
  const alpha = State.brushOpacity * State.brushFlow * pressure;
  const hard = State.brushHardness;

  lctx.globalCompositeOperation = State.blendMode;
  lctx.globalAlpha = alpha;

  switch (State.brushType) {
    case 'round': {
      const grad = lctx.createRadialGradient(x, y, 0, x, y, s / 2);
      grad.addColorStop(0, State.fgColor);
      grad.addColorStop(hard, State.fgColor);
      grad.addColorStop(1, State.fgColor + '00');
      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.arc(x, y, s / 2, 0, Math.PI * 2);
      lctx.fill();
      break;
    }
    case 'soft': {
      const grad = lctx.createRadialGradient(x, y, 0, x, y, s / 2);
      grad.addColorStop(0, State.fgColor);
      grad.addColorStop(0.4, State.fgColor + 'BB');
      grad.addColorStop(1, State.fgColor + '00');
      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.arc(x, y, s / 2, 0, Math.PI * 2);
      lctx.fill();
      break;
    }
    case 'flat': {
      lctx.fillStyle = State.fgColor;
      lctx.beginPath();
      lctx.ellipse(x, y, s / 2, s / 6, 0, 0, Math.PI * 2);
      lctx.fill();
      break;
    }
    case 'texture': {
      for (let i = 0; i < 8; i++) {
        const rx = x + (Math.random() - 0.5) * s;
        const ry = y + (Math.random() - 0.5) * s;
        lctx.fillStyle = State.fgColor;
        lctx.beginPath();
        lctx.arc(rx, ry, (Math.random() * s) / 8 + 1, 0, Math.PI * 2);
        lctx.fill();
      }
      break;
    }
    case 'pencil': {
      for (let i = 0; i < 4; i++) {
        const rx = x + (Math.random() - 0.5) * s * 0.5;
        const ry = y + (Math.random() - 0.5) * s * 0.5;
        lctx.strokeStyle = State.fgColor;
        lctx.lineWidth = 0.5;
        lctx.beginPath();
        lctx.arc(rx, ry, s / 10, 0, Math.PI * 2);
        lctx.stroke();
      }
      break;
    }
    default: {
      lctx.fillStyle = State.fgColor;
      lctx.beginPath();
      lctx.arc(x, y, s / 2, 0, Math.PI * 2);
      lctx.fill();
    }
  }
  lctx.globalAlpha = 1;
  lctx.globalCompositeOperation = 'source-over';
}

// Smooth stroke interpolation
function interpolateStroke(lctx, x1, y1, x2, y2) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.floor(dist / (State.brushSize * 0.3)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ix = x1 + (x2 - x1) * t;
    const iy = y1 + (y2 - y1) * t;
    drawBrush(lctx, ix, iy);
  }
}

// ─────────────────────────────────────────────────────────
//  CANVAS EVENTS
// ─────────────────────────────────────────────────────────
function getCanvasPos(e) {
  const rect = mainCanvas.getBoundingClientRect();
  const scaleX = State.canvasW / (rect.width);
  const scaleY = State.canvasH / (rect.height);
  let clientX = e.touches ? e.touches[0].clientX : e.clientX;
  let clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function setupCanvasEvents() {
  const vp = canvasViewport;

  vp.addEventListener('mousedown', onPointerDown);
  vp.addEventListener('mousemove', onPointerMove);
  vp.addEventListener('mouseup', onPointerUp);
  vp.addEventListener('mouseleave', onPointerUp);
  vp.addEventListener('touchstart', onPointerDown, { passive: false });
  vp.addEventListener('touchmove', onPointerMove, { passive: false });
  vp.addEventListener('touchend', onPointerUp);
  vp.addEventListener('wheel', onWheel, { passive: false });

  // Update cursor info
  vp.addEventListener('mousemove', e => {
    const pos = getCanvasPos(e);
    $('cursorX').textContent = Math.round(pos.x);
    $('cursorY').textContent = Math.round(pos.y);
  });
}

function onPointerDown(e) {
  e.preventDefault();
  const pos = getCanvasPos(e);

  if (State.spaceHeld || State.tool === 'hand') {
    State.isPanning = true;
    State.lastX = e.clientX || e.touches[0].clientX;
    State.lastY = e.clientY || e.touches[0].clientY;
    canvasViewport.style.cursor = 'grabbing';
    return;
  }

  if (State.tool === 'eyedropper') {
    pickColor(pos.x, pos.y);
    return;
  }

  if (State.tool === 'fill') {
    saveHistory();
    floodFill(Math.round(pos.x), Math.round(pos.y), State.fgColor);
    compositeAll();
    return;
  }

  if (State.tool === 'text') {
    State.textPos = { x: pos.x, y: pos.y };
    showTextInput(pos.x, pos.y);
    return;
  }

  State.isDrawing = true;
  State.lastX = pos.x;
  State.lastY = pos.y;
  State.drawing.startX = pos.x;
  State.drawing.startY = pos.y;
  saveHistory();

  const lctx = getActiveCtx();
  if (State.tool === 'brush' || State.tool === 'pencil') {
    drawBrush(lctx, pos.x, pos.y);
    compositeAll();
  } else if (State.tool === 'eraser') {
    lctx.globalCompositeOperation = 'destination-out';
    lctx.globalAlpha = State.brushOpacity;
    lctx.beginPath();
    lctx.arc(pos.x, pos.y, State.brushSize / 2, 0, Math.PI * 2);
    lctx.fill();
    lctx.globalCompositeOperation = 'source-over';
    lctx.globalAlpha = 1;
    compositeAll();
  }
}

function onPointerMove(e) {
  e.preventDefault();
  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);
  const pos = getCanvasPos(e);

  // Update brush preview on overlay
  octx.clearRect(0, 0, State.canvasW, State.canvasH);
  if (State.tool === 'brush' || State.tool === 'pencil') {
    octx.globalAlpha = 0.35;
    octx.strokeStyle = State.fgColor;
    octx.lineWidth = 1;
    octx.beginPath();
    octx.arc(pos.x, pos.y, State.brushSize / 2, 0, Math.PI * 2);
    octx.stroke();
    octx.globalAlpha = 1;
  } else if (State.tool === 'eraser') {
    octx.globalAlpha = 0.5;
    octx.strokeStyle = '#fff';
    octx.lineWidth = 1;
    octx.beginPath();
    octx.arc(pos.x, pos.y, State.brushSize / 2, 0, Math.PI * 2);
    octx.stroke();
    octx.globalAlpha = 1;
  }

  if (State.isPanning) {
    const dx = clientX - State.lastX;
    const dy = clientY - State.lastY;
    State.panX += dx;
    State.panY += dy;
    State.lastX = clientX;
    State.lastY = clientY;
    applyTransform();
    return;
  }

  if (!State.isDrawing) return;

  const lctx = getActiveCtx();
  const layer = getActiveLayer();
  if (!layer || layer.locked) return;

  switch (State.tool) {
    case 'brush':
    case 'pencil':
      interpolateStroke(lctx, State.lastX, State.lastY, pos.x, pos.y);
      compositeAll();
      break;

    case 'eraser': {
      const erase = lctx;
      erase.globalCompositeOperation = 'destination-out';
      erase.globalAlpha = State.brushOpacity;
      erase.lineWidth = State.brushSize;
      erase.lineCap = 'round';
      erase.beginPath();
      erase.moveTo(State.lastX, State.lastY);
      erase.lineTo(pos.x, pos.y);
      erase.stroke();
      erase.globalCompositeOperation = 'source-over';
      erase.globalAlpha = 1;
      compositeAll();
      break;
    }

    case 'line':
    case 'rect':
    case 'circle':
    case 'select-rect':
    case 'select-circle': {
      octx.clearRect(0, 0, State.canvasW, State.canvasH);
      octx.globalAlpha = 0.8;
      octx.strokeStyle = State.fgColor;
      octx.lineWidth = State.brushSize * 0.5;
      octx.setLineDash([]);
      if (State.tool === 'line') {
        octx.beginPath();
        octx.moveTo(State.drawing.startX, State.drawing.startY);
        octx.lineTo(pos.x, pos.y);
        octx.stroke();
      } else if (State.tool === 'rect' || State.tool === 'select-rect') {
        if (State.tool === 'select-rect') { octx.setLineDash([6, 3]); }
        octx.strokeRect(
          State.drawing.startX, State.drawing.startY,
          pos.x - State.drawing.startX, pos.y - State.drawing.startY
        );
        octx.setLineDash([]);
      } else if (State.tool === 'circle' || State.tool === 'select-circle') {
        if (State.tool === 'select-circle') { octx.setLineDash([6, 3]); }
        const rx = Math.abs(pos.x - State.drawing.startX) / 2;
        const ry = Math.abs(pos.y - State.drawing.startY) / 2;
        const cx = State.drawing.startX + (pos.x - State.drawing.startX) / 2;
        const cy = State.drawing.startY + (pos.y - State.drawing.startY) / 2;
        octx.beginPath();
        octx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        octx.stroke();
        octx.setLineDash([]);
      }
      octx.globalAlpha = 1;
      break;
    }
  }

  State.lastX = pos.x;
  State.lastY = pos.y;
}

function onPointerUp(e) {
  const pos = e.type === 'touchend' ? State : getCanvasPos(e);

  if (State.isPanning) {
    State.isPanning = false;
    canvasViewport.style.cursor = State.spaceHeld ? 'grab' : 'crosshair';
    return;
  }

  if (!State.isDrawing) return;
  State.isDrawing = false;
  octx.clearRect(0, 0, State.canvasW, State.canvasH);

  const endPos = e.type === 'touchend' ? { x: State.lastX, y: State.lastY } : getCanvasPos(e);
  const lctx = getActiveCtx();

  // Commit shape tools
  if (['line', 'rect', 'circle'].includes(State.tool)) {
    lctx.globalCompositeOperation = State.blendMode;
    lctx.globalAlpha = State.brushOpacity;
    lctx.strokeStyle = State.fgColor;
    lctx.lineWidth = State.brushSize * 0.5;
    lctx.lineCap = 'round';
    lctx.lineJoin = 'round';

    if (State.tool === 'line') {
      lctx.beginPath();
      lctx.moveTo(State.drawing.startX, State.drawing.startY);
      lctx.lineTo(endPos.x, endPos.y);
      lctx.stroke();
    } else if (State.tool === 'rect') {
      lctx.strokeRect(
        State.drawing.startX, State.drawing.startY,
        endPos.x - State.drawing.startX, endPos.y - State.drawing.startY
      );
    } else if (State.tool === 'circle') {
      const rx = Math.abs(endPos.x - State.drawing.startX) / 2;
      const ry = Math.abs(endPos.y - State.drawing.startY) / 2;
      const cx = State.drawing.startX + (endPos.x - State.drawing.startX) / 2;
      const cy = State.drawing.startY + (endPos.y - State.drawing.startY) / 2;
      lctx.beginPath();
      lctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      lctx.stroke();
    }

    lctx.globalAlpha = 1;
    lctx.globalCompositeOperation = 'source-over';
    compositeAll();
  }
}

function onWheel(e) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const rect = canvasViewport.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const oldZoom = State.zoom;
  State.zoom = Math.min(32, Math.max(0.05, State.zoom * delta));

  State.panX = mouseX - (mouseX - State.panX) * (State.zoom / oldZoom);
  State.panY = mouseY - (mouseY - State.panY) * (State.zoom / oldZoom);

  applyTransform();
  updateZoomLabel();
}

// ─────────────────────────────────────────────────────────
//  TRANSFORM
// ─────────────────────────────────────────────────────────
function applyTransform() {
  canvasWrapper.style.transform = `translate(${State.panX}px, ${State.panY}px) scale(${State.zoom})`;
}

function fitCanvas() {
  const vp = canvasViewport.getBoundingClientRect();
  const scaleX = (vp.width - 60) / State.canvasW;
  const scaleY = (vp.height - 60) / State.canvasH;
  State.zoom = Math.min(scaleX, scaleY, 1);
  State.panX = (vp.width - State.canvasW * State.zoom) / 2;
  State.panY = (vp.height - State.canvasH * State.zoom) / 2;
  applyTransform();
  updateZoomLabel();
}

function updateZoomLabel() {
  $('zoomLabel').textContent = Math.round(State.zoom * 100) + '%';
}

// ─────────────────────────────────────────────────────────
//  COLOR TOOLS
// ─────────────────────────────────────────────────────────
function pickColor(x, y) {
  const imageData = mainCanvas.getContext('2d').getImageData(Math.round(x), Math.round(y), 1, 1);
  const [r, g, b] = imageData.data;
  const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  setFgColor(hex);
  showToast('تم اختيار اللون: ' + hex.toUpperCase());
}

function setFgColor(hex) {
  State.fgColor = hex;
  $('fgSwatch').style.background = hex;
  $('hexInput').value = hex.replace('#', '').toUpperCase();
  $('colorPreviewDot').style.background = hex;
  updateRGBInputs(hex);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function updateRGBInputs(hex) {
  const { r, g, b } = hexToRgb(hex);
  $('rInput').value = r;
  $('gInput').value = g;
  $('bInput').value = b;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('');
}

// ─────────────────────────────────────────────────────────
//  FLOOD FILL
// ─────────────────────────────────────────────────────────
function floodFill(startX, startY, fillColorHex) {
  const lctx = getActiveCtx();
  const imageData = lctx.getImageData(0, 0, State.canvasW, State.canvasH);
  const data = imageData.data;
  const w = State.canvasW;
  const idx = (y, x) => (y * w + x) * 4;

  const sr = data[idx(startY, startX)];
  const sg = data[idx(startY, startX) + 1];
  const sb = data[idx(startY, startX) + 2];
  const sa = data[idx(startY, startX) + 3];

  const fr = parseInt(fillColorHex.slice(1, 3), 16);
  const fg = parseInt(fillColorHex.slice(3, 5), 16);
  const fb = parseInt(fillColorHex.slice(5, 7), 16);
  const fa = 255;

  if (sr === fr && sg === fg && sb === fb && sa === fa) return;

  const tolerance = 30;
  const colorMatch = (i) => {
    return Math.abs(data[i] - sr) <= tolerance &&
      Math.abs(data[i + 1] - sg) <= tolerance &&
      Math.abs(data[i + 2] - sb) <= tolerance &&
      Math.abs(data[i + 3] - sa) <= tolerance;
  };

  const stack = [[startX, startY]];
  const visited = new Uint8Array(w * State.canvasH);

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= w || y < 0 || y >= State.canvasH) continue;
    const i = idx(y, x);
    if (visited[y * w + x]) continue;
    if (!colorMatch(i)) continue;
    visited[y * w + x] = 1;
    data[i] = fr; data[i + 1] = fg; data[i + 2] = fb; data[i + 3] = fa;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  lctx.putImageData(imageData, 0, 0);
}

// ─────────────────────────────────────────────────────────
//  TEXT TOOL
// ─────────────────────────────────────────────────────────
function showTextInput(cx, cy) {
  const overlay = $('textInputOverlay');
  overlay.classList.remove('hidden');
  // Position near click
  const rect = mainCanvas.getBoundingClientRect();
  const screenX = rect.left + cx * (rect.width / State.canvasW);
  const screenY = rect.top + cy * (rect.height / State.canvasH);
  overlay.style.left = Math.min(screenX, window.innerWidth - 260) + 'px';
  overlay.style.top = Math.min(screenY, window.innerHeight - 140) + 'px';
  $('textInput').value = '';
  $('textInput').focus();

  $('confirmTextBtn').onclick = () => {
    const text = $('textInput').value.trim();
    if (text) {
      saveHistory();
      const lctx = getActiveCtx();
      lctx.globalAlpha = State.brushOpacity;
      lctx.fillStyle = State.fgColor;
      lctx.font = `${State.brushSize * 2}px Cairo, Tajawal, sans-serif`;
      lctx.textAlign = 'right';
      lctx.fillText(text, cx, cy);
      lctx.globalAlpha = 1;
      compositeAll();
      showToast('تم إضافة النص');
    }
    overlay.classList.add('hidden');
  };

  $('cancelTextBtn').onclick = () => overlay.classList.add('hidden');
}

// ─────────────────────────────────────────────────────────
//  BRUSH PANEL SETUP
// ─────────────────────────────────────────────────────────
function setupBrushPanel() {
  // Brush presets
  $$('.brush-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.brush-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.brushType = btn.dataset.brush;
    });
  });

  // Sliders
  const sliders = [
    { id: 'brushSize', valId: 'brushSizeVal', suffix: 'px', key: 'brushSize', scale: 1 },
    { id: 'brushOpacity', valId: 'brushOpacityVal', suffix: '%', key: 'brushOpacity', scale: 0.01 },
    { id: 'brushFlow', valId: 'brushFlowVal', suffix: '%', key: 'brushFlow', scale: 0.01 },
    { id: 'brushHardness', valId: 'brushHardnessVal', suffix: '%', key: 'brushHardness', scale: 0.01 },
  ];

  sliders.forEach(({ id, valId, suffix, key, scale }) => {
    const el = $(id);
    const val = $(valId);
    el.addEventListener('input', () => {
      val.textContent = el.value;
      State[key] = parseFloat(el.value) * scale;
    });
  });

  // Blend mode
  $('blendMode').addEventListener('change', (e) => {
    State.blendMode = e.target.value;
  });

  // Panel toggles
  $$('.panel-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = $(btn.dataset.target);
      if (!target) return;
      const isHidden = target.style.display === 'none';
      target.style.display = isHidden ? '' : 'none';
      btn.classList.toggle('collapsed', !isHidden);
    });
  });
}

// ─────────────────────────────────────────────────────────
//  COLOR PANEL SETUP
// ─────────────────────────────────────────────────────────
function setupColorPanel() {
  // Color wheel canvas
  drawColorWheel();

  const colorWheel = $('colorWheel');
  colorWheel.addEventListener('click', (e) => {
    const rect = colorWheel.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const imageData = colorWheel.getContext('2d').getImageData(Math.round(x * (180 / rect.width)), Math.round(y * (180 / rect.height)), 1, 1);
    const [r, g, b, a] = imageData.data;
    if (a > 10) {
      const hex = rgbToHex(r, g, b);
      setFgColor(hex);
    }
  });

  // Hex input
  $('hexInput').addEventListener('input', (e) => {
    const val = e.target.value.replace(/[^0-9a-fA-F]/g, '');
    e.target.value = val;
    if (val.length === 6) {
      setFgColor('#' + val);
    }
  });

  // RGB inputs
  ['rInput', 'gInput', 'bInput'].forEach(id => {
    $(id).addEventListener('input', () => {
      const r = parseInt($('rInput').value) || 0;
      const g = parseInt($('gInput').value) || 0;
      const b = parseInt($('bInput').value) || 0;
      setFgColor(rgbToHex(r, g, b));
    });
  });

  // FG/BG swatches
  $('fgSwatch').addEventListener('click', () => {
    $('colorPicker').value = State.fgColor;
    $('colorPicker').click();
  });
  $('bgSwatch').addEventListener('click', () => {
    // Show temp picker for BG
    const tmp = document.createElement('input');
    tmp.type = 'color';
    tmp.value = State.bgColor;
    tmp.addEventListener('input', (e) => {
      State.bgColor = e.target.value;
      $('bgSwatch').style.background = State.bgColor;
    });
    tmp.click();
  });
  $('colorPicker').addEventListener('input', (e) => setFgColor(e.target.value));
  $('openColorBtn').addEventListener('click', () => {
    $('colorPicker').value = State.fgColor;
    $('colorPicker').click();
  });
  $('swapColorsBtn').addEventListener('click', () => {
    const tmp = State.fgColor;
    State.fgColor = State.bgColor;
    State.bgColor = tmp;
    $('fgSwatch').style.background = State.fgColor;
    $('bgSwatch').style.background = State.bgColor;
    setFgColor(State.fgColor);
  });

  setFgColor(State.fgColor);
  $('bgSwatch').style.background = State.bgColor;
}

function drawColorWheel() {
  const wheel = $('colorWheel');
  const wctx = wheel.getContext('2d');
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  // Draw hue ring
  for (let angle = 0; angle < 360; angle++) {
    const startAngle = (angle - 1) * Math.PI / 180;
    const endAngle = (angle + 1) * Math.PI / 180;
    const grad = wctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'white');
    grad.addColorStop(0.5, `hsl(${angle}, 100%, 50%)`);
    grad.addColorStop(1, 'black');
    wctx.beginPath();
    wctx.moveTo(cx, cy);
    wctx.arc(cx, cy, r, startAngle, endAngle);
    wctx.closePath();
    wctx.fillStyle = grad;
    wctx.fill();
  }

  // Clip to circle
  wctx.globalCompositeOperation = 'destination-in';
  wctx.beginPath();
  wctx.arc(cx, cy, r, 0, Math.PI * 2);
  wctx.fillStyle = 'black';
  wctx.fill();
  wctx.globalCompositeOperation = 'source-over';
}

// ─────────────────────────────────────────────────────────
//  PALETTE
// ─────────────────────────────────────────────────────────
function buildPalette() {
  const palette = $('paletteGrid');
  const colors = generatePalette();
  palette.innerHTML = '';
  colors.forEach(hex => {
    const div = document.createElement('div');
    div.className = 'palette-color';
    div.style.background = hex;
    div.title = hex;
    div.addEventListener('click', () => setFgColor(hex));
    palette.appendChild(div);
  });
}

function generatePalette() {
  const colors = [];
  // Grays
  for (let i = 0; i <= 255; i += 17) colors.push(rgbToHex(i, i, i));
  // Reds
  for (let i = 0; i < 10; i++) colors.push(`hsl(${i * 4},100%,${30 + i * 5}%)`);
  // Oranges
  for (let i = 0; i < 10; i++) colors.push(`hsl(${20 + i * 4},100%,${30 + i * 5}%)`);
  // Yellows
  for (let i = 0; i < 8; i++) colors.push(`hsl(${50 + i * 5},100%,${40 + i * 5}%)`);
  // Greens
  for (let i = 0; i < 14; i++) colors.push(`hsl(${90 + i * 6},${60 + i * 3}%,${30 + i * 4}%)`);
  // Cyans
  for (let i = 0; i < 8; i++) colors.push(`hsl(${170 + i * 5},80%,${35 + i * 5}%)`);
  // Blues
  for (let i = 0; i < 14; i++) colors.push(`hsl(${200 + i * 7},${70 + i * 2}%,${25 + i * 5}%)`);
  // Purples
  for (let i = 0; i < 12; i++) colors.push(`hsl(${260 + i * 5},${60 + i * 3}%,${30 + i * 4}%)`);
  // Pinks
  for (let i = 0; i < 10; i++) colors.push(`hsl(${300 + i * 4},80%,${35 + i * 5}%)`);
  // Browns
  for (let i = 0; i < 8; i++) colors.push(`hsl(${25 + i * 5},${50 + i * 5}%,${20 + i * 8}%)`);
  // Skin tones
  ['#FFDBB4','#F5CBA7','#E8B89A','#D4956A','#C4835A','#A0674B','#7D4E3C','#5C3427'].forEach(c => colors.push(c));
  // Accent shades of brand
  ['#FF6B35','#F7C59F','#EFEFD0','#FF9A76','#FFB347','#FF6B6B','#FF4500','#C0392B'].forEach(c => colors.push(c));
  // Fill to 500+
  for (let h = 0; h < 360; h += 18) {
    for (let l = 20; l <= 80; l += 20) {
      colors.push(`hsl(${h},70%,${l}%)`);
    }
  }

  // Convert HSL strings to hex
  return colors.map(c => {
    if (c.startsWith('#')) return c;
    // Create temp element to compute color
    const div = document.createElement('div');
    div.style.color = c;
    document.body.appendChild(div);
    const computed = getComputedStyle(div).color;
    document.body.removeChild(div);
    const m = computed.match(/\d+/g);
    if (m && m.length >= 3) return rgbToHex(+m[0], +m[1], +m[2]);
    return c;
  });
}

// ─────────────────────────────────────────────────────────
//  LAYERS PANEL
// ─────────────────────────────────────────────────────────
function setupLayersPanel() {
  $('addLayerBtn').addEventListener('click', () => {
    addLayer();
    renderLayersList();
    showToast('تمت إضافة طبقة جديدة');
  });

  $('duplicateLayerBtn').addEventListener('click', () => {
    const active = getActiveLayer();
    if (!active) return;
    const clone = document.createElement('canvas');
    clone.width = State.canvasW; clone.height = State.canvasH;
    clone.getContext('2d').drawImage(active.canvas, 0, 0);
    const newLayer = {
      id: Date.now(),
      name: active.name + ' (نسخة)',
      canvas: clone,
      ctx: clone.getContext('2d'),
      visible: true, locked: false, opacity: 1, blendMode: 'source-over',
    };
    State.layers.splice(State.activeLayerIndex, 0, newLayer);
    renderLayersList();
    compositeAll();
    showToast('تم تكرار الطبقة');
  });

  $('mergeLayersBtn').addEventListener('click', () => {
    if (State.layers.length < 2) return showToast('يجب وجود طبقتين على الأقل');
    saveHistory();
    const merged = document.createElement('canvas');
    merged.width = State.canvasW; merged.height = State.canvasH;
    const mctx = merged.getContext('2d');
    for (let i = State.layers.length - 1; i >= 0; i--) {
      const l = State.layers[i];
      if (!l.visible) continue;
      mctx.globalAlpha = l.opacity;
      mctx.globalCompositeOperation = l.blendMode;
      mctx.drawImage(l.canvas, 0, 0);
    }
    mctx.globalAlpha = 1;
    mctx.globalCompositeOperation = 'source-over';
    State.layers = [{
      id: Date.now(), name: 'طبقة مدمجة',
      canvas: merged, ctx: mctx,
      visible: true, locked: false, opacity: 1, blendMode: 'source-over',
    }];
    State.activeLayerIndex = 0;
    renderLayersList();
    compositeAll();
    showToast('تم دمج جميع الطبقات');
  });

  $('deleteLayerBtn').addEventListener('click', () => {
    if (State.layers.length === 1) return showToast('لا يمكن حذف الطبقة الوحيدة');
    State.layers.splice(State.activeLayerIndex, 1);
    State.activeLayerIndex = Math.min(State.activeLayerIndex, State.layers.length - 1);
    renderLayersList();
    compositeAll();
    showToast('تم حذف الطبقة');
  });
}

function renderLayersList() {
  const list = $('layersList');
  list.innerHTML = '';
  State.layers.forEach((layer, i) => {
    const item = document.createElement('div');
    item.className = 'layer-item' + (i === State.activeLayerIndex ? ' active' : '');
    item.dataset.index = i;

    // Thumbnail
    const thumb = document.createElement('div');
    thumb.className = 'layer-thumb';
    const tc = document.createElement('canvas');
    tc.width = 64; tc.height = 48;
    tc.getContext('2d').drawImage(layer.canvas, 0, 0, 64, 48);
    thumb.appendChild(tc);

    // Name
    const nameWrap = document.createElement('div');
    nameWrap.className = 'layer-name-wrap';
    nameWrap.innerHTML = `<div class="layer-name">${layer.name}</div><div class="layer-opacity-small">${Math.round(layer.opacity * 100)}%</div>`;

    // Controls
    const ctrls = document.createElement('div');
    ctrls.className = 'layer-controls';

    // Visibility
    const visBtn = document.createElement('button');
    visBtn.className = 'layer-ctrl-btn' + (layer.visible ? ' active' : '');
    visBtn.title = layer.visible ? 'إخفاء' : 'إظهار';
    visBtn.innerHTML = layer.visible
      ? `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2.5"/></svg>`
      : `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="2" y1="2" x2="14" y2="14"/><path d="M5 5a5 5 0 006 6M9.5 3.5A6 6 0 0115 8s-1.5 3-4 4.5"/><path d="M1 8s1.5-3 4-4.5"/></svg>`;
    visBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      layer.visible = !layer.visible;
      compositeAll();
      renderLayersList();
    });

    // Lock
    const lockBtn = document.createElement('button');
    lockBtn.className = 'layer-ctrl-btn' + (layer.locked ? ' locked' : '');
    lockBtn.title = layer.locked ? 'فك القفل' : 'قفل';
    lockBtn.innerHTML = layer.locked
      ? `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>`
      : `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0"/></svg>`;
    lockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      layer.locked = !layer.locked;
      renderLayersList();
      showToast(layer.locked ? 'تم قفل الطبقة' : 'تم فك قفل الطبقة');
    });

    ctrls.appendChild(visBtn);
    ctrls.appendChild(lockBtn);

    item.appendChild(thumb);
    item.appendChild(nameWrap);
    item.appendChild(ctrls);

    item.addEventListener('click', () => {
      State.activeLayerIndex = i;
      renderLayersList();
    });

    // Opacity slider on double-click
    nameWrap.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const val = prompt('شفافية الطبقة (0-100):', Math.round(layer.opacity * 100));
      if (val !== null) {
        layer.opacity = Math.min(1, Math.max(0, parseInt(val) / 100));
        compositeAll();
        renderLayersList();
      }
    });

    list.appendChild(item);
  });
}

// ─────────────────────────────────────────────────────────
//  TOP BAR
// ─────────────────────────────────────────────────────────
function setupTopBar() {
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  updateHistoryBtns();

  $('clearCanvasBtn').addEventListener('click', () => {
    if (!confirm('هل تريد مسح اللوحة؟')) return;
    saveHistory();
    const lctx = getActiveCtx();
    lctx.clearRect(0, 0, State.canvasW, State.canvasH);
    compositeAll();
    showToast('تم مسح الطبقة');
  });

  $('zoomInBtn').addEventListener('click', () => {
    State.zoom = Math.min(32, State.zoom * 1.2);
    applyTransform(); updateZoomLabel();
  });
  $('zoomOutBtn').addEventListener('click', () => {
    State.zoom = Math.max(0.05, State.zoom / 1.2);
    applyTransform(); updateZoomLabel();
  });
  $('zoomFitBtn').addEventListener('click', fitCanvas);

  $('exportBtn').addEventListener('click', () => {
    $('exportModal').classList.remove('hidden');
  });

  $('settingsBtn').addEventListener('click', () => {
    $('settingsModal').classList.remove('hidden');
  });

  $('refImgBtn').addEventListener('click', () => {
    $('referenceModal').classList.remove('hidden');
  });

  $('fullscreenBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });
}

// ─────────────────────────────────────────────────────────
//  MODALS
// ─────────────────────────────────────────────────────────
function setupModals() {
  // Export
  $('closeExportModal').addEventListener('click', () => $('exportModal').classList.add('hidden'));

  let selectedFormat = 'png';
  $$('.export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.export-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFormat = btn.dataset.format;
      exportCanvas(selectedFormat);
    });
  });

  $('exportQuality').addEventListener('input', () => {
    $('qualityVal').textContent = $('exportQuality').value;
  });

  // Settings
  $('closeSettingsModal').addEventListener('click', () => $('settingsModal').classList.add('hidden'));

  $('darkThemeBtn').addEventListener('click', () => {
    document.body.dataset.theme = 'dark';
    $('darkThemeBtn').classList.add('active');
    $('lightThemeBtn').classList.remove('active');
  });
  $('lightThemeBtn').addEventListener('click', () => {
    document.body.dataset.theme = 'light';
    $('lightThemeBtn').classList.add('active');
    $('darkThemeBtn').classList.remove('active');
  });

  $('toggleGrid').addEventListener('change', (e) => {
    $('canvasGrid').classList.toggle('hidden', !e.target.checked);
  });

  $('smoothingSlider').addEventListener('input', (e) => {
    $('smoothingVal').textContent = e.target.value;
    State.smoothing = parseInt(e.target.value);
  });

  $('showShortcutsBtn').addEventListener('click', () => {
    $('settingsModal').classList.add('hidden');
    $('shortcutsModal').classList.remove('hidden');
  });
  $('closeShortcutsModal').addEventListener('click', () => $('shortcutsModal').classList.add('hidden'));

  // Reference
  $('closeReferenceModal').addEventListener('click', () => $('referenceModal').classList.add('hidden'));

  $('refUploadArea').addEventListener('click', () => $('refFileInput').click());
  $('refFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      State.refImage = img;
      renderReferenceImage();
      $('refControls').classList.remove('hidden');
      $('refUploadArea').style.display = 'none';
      showToast('تم رفع صورة المرجع');
    };
    img.src = url;
  });

  $('refOpacity').addEventListener('input', (e) => {
    State.refOpacity = parseInt(e.target.value) / 100;
    $('refOpacityVal').textContent = e.target.value;
    renderReferenceImage();
  });

  $('lockRefBtn').addEventListener('click', () => {
    State.refLocked = !State.refLocked;
    showToast(State.refLocked ? 'تم قفل المرجع' : 'تم فك قفل المرجع');
  });
  $('removeRefBtn').addEventListener('click', () => {
    State.refImage = null;
    rctx.clearRect(0, 0, State.canvasW, State.canvasH);
    $('refControls').classList.add('hidden');
    $('refUploadArea').style.display = '';
    showToast('تم حذف صورة المرجع');
  });

  // Close modals on overlay click
  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && overlay.id !== 'newProjectModal') {
        overlay.classList.add('hidden');
      }
    });
  });
}

function renderReferenceImage() {
  if (!State.refImage) return;
  rctx.clearRect(0, 0, State.canvasW, State.canvasH);
  rctx.globalAlpha = State.refOpacity;
  rctx.drawImage(State.refImage, 0, 0, State.canvasW, State.canvasH);
  rctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────
//  EXPORT
// ─────────────────────────────────────────────────────────
function exportCanvas(format = 'png') {
  const quality = parseInt($('exportQuality').value) / 100;
  let mimeType = 'image/png';
  let ext = 'png';
  if (format === 'jpg') { mimeType = 'image/jpeg'; ext = 'jpg'; }
  if (format === 'webp') { mimeType = 'image/webp'; ext = 'webp'; }

  const link = document.createElement('a');
  link.download = `safwan-studio-${Date.now()}.${ext}`;
  link.href = mainCanvas.toDataURL(mimeType, quality);
  link.click();
  showToast(`تم تصدير العمل بصيغة ${ext.toUpperCase()}`);
  $('exportModal').classList.add('hidden');
}

// ─────────────────────────────────────────────────────────
//  KEYBOARD SHORTCUTS
// ─────────────────────────────────────────────────────────
function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') { e.preventDefault(); State.spaceHeld = true; canvasViewport.style.cursor = 'grab'; }
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z': e.preventDefault(); undo(); break;
        case 'y': e.preventDefault(); redo(); break;
        case 's': e.preventDefault(); exportCanvas('png'); break;
        case 'e': e.preventDefault(); $('exportModal').classList.remove('hidden'); break;
        case 'c': e.preventDefault(); copySelection(); break;
        case 'v': e.preventDefault(); pasteSelection(); break;
        case '+': case '=': e.preventDefault(); State.zoom = Math.min(32, State.zoom * 1.2); applyTransform(); updateZoomLabel(); break;
        case '-': e.preventDefault(); State.zoom = Math.max(0.05, State.zoom / 1.2); applyTransform(); updateZoomLabel(); break;
        case '0': e.preventDefault(); fitCanvas(); break;
      }
      return;
    }

    const toolMap = { b: 'brush', e: 'eraser', g: 'fill', v: 'move', m: 'select-rect', l: 'lasso', h: 'hand', t: 'text', p: 'pencil' };
    if (toolMap[e.key.toLowerCase()]) {
      const tool = toolMap[e.key.toLowerCase()];
      State.tool = tool;
      $$('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
      updateCursor();
    }

    // Brush size with [ ]
    if (e.key === '[') { State.brushSize = Math.max(1, State.brushSize - 2); $('brushSize').value = State.brushSize; $('brushSizeVal').textContent = State.brushSize; }
    if (e.key === ']') { State.brushSize = Math.min(200, State.brushSize + 2); $('brushSize').value = State.brushSize; $('brushSizeVal').textContent = State.brushSize; }

    // Fullscreen
    if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      State.spaceHeld = false;
      if (!State.isPanning) updateCursor();
    }
  });
}

// ─────────────────────────────────────────────────────────
//  COPY / PASTE
// ─────────────────────────────────────────────────────────
function copySelection() {
  const copy = document.createElement('canvas');
  copy.width = State.canvasW; copy.height = State.canvasH;
  copy.getContext('2d').drawImage(mainCanvas, 0, 0);
  State.copyBuffer = copy;
  showToast('تم النسخ');
}

function pasteSelection() {
  if (!State.copyBuffer) return showToast('لا يوجد شيء للصق');
  saveHistory();
  addLayer('طبقة ملصوقة');
  getActiveCtx().drawImage(State.copyBuffer, 0, 0);
  compositeAll();
  renderLayersList();
  showToast('تم اللصق على طبقة جديدة');
}

// ─────────────────────────────────────────────────────────
//  RULERS
// ─────────────────────────────────────────────────────────
function setupRulers() {
  drawRulers();
  canvasViewport.addEventListener('scroll', drawRulers);
}

function drawRulers() {
  const hCanvas = $('rulerH');
  const vCanvas = $('rulerV');
  if (!hCanvas || !vCanvas) return;

  const hctx = hCanvas.getContext('2d');
  const vc = vCanvas.getContext('2d');

  hCanvas.width = canvasViewport.clientWidth;
  hCanvas.height = 20;
  vCanvas.width = 20;
  vCanvas.height = canvasViewport.clientHeight;

  const bg = getComputedStyle(document.body).getPropertyValue('--dark-surface').trim() || '#161820';
  const tc = getComputedStyle(document.body).getPropertyValue('--text-muted').trim() || '#5A5B78';

  // Horizontal
  hctx.fillStyle = bg;
  hctx.fillRect(0, 0, hCanvas.width, 20);
  hctx.fillStyle = tc;
  hctx.font = '9px monospace';
  hctx.textAlign = 'center';
  const step = Math.max(20, Math.round(50 / State.zoom));
  for (let x = 0; x < State.canvasW; x += step) {
    const sx = State.panX + x * State.zoom;
    if (sx < 0 || sx > hCanvas.width) continue;
    hctx.fillRect(sx, 14, 1, 6);
    if (x % (step * 5) === 0) hctx.fillText(x, sx, 11);
  }

  // Vertical
  vc.fillStyle = bg;
  vc.fillRect(0, 0, 20, vCanvas.height);
  vc.fillStyle = tc;
  vc.font = '9px monospace';
  vc.textAlign = 'right';
  for (let y = 0; y < State.canvasH; y += step) {
    const sy = State.panY + y * State.zoom;
    if (sy < 0 || sy > vCanvas.height) continue;
    vc.fillRect(14, sy, 6, 1);
    if (y % (step * 5) === 0) {
      vc.save();
      vc.translate(10, sy);
      vc.rotate(-Math.PI / 2);
      vc.fillText(y, 0, 0);
      vc.restore();
    }
  }
}
