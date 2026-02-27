/* ============================================================
   صفوان ستوديو — studio.js
   Full drawing engine with layers, brushes, tools, colors
   ============================================================ */

'use strict';

// ============================================================
// GLOBALS
// ============================================================
const THEME_KEY = 'safwan_theme';
let currentTool = 'brush';
let currentColor = '#ff6b35';
let bgColor = '#ffffff';
let brushSize = 20;
let brushOpacity = 1;
let brushHardness = 0.8;
let brushSmooth = 0.5;
let brushFlow = 1;
let brushAngle = 0;
let brushSpacing = 25;
let blendMode = 'source-over';
let currentBrushId = 'safwan-round';
let zoom = 1;
let canvasWidth = 1920;
let canvasHeight = 1080;
let gridVisible = false;
let rulersVisible = true;
let isDrawing = false;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };
let lastPoint = null;
let smoothPoints = [];
let history = [];
let historyIndex = -1;
let historyMaxDepth = 100;
let layers = [];
let activeLayerIndex = 0;
let recentColors = [];
let selectionActive = false;
let selectionPath = null;
let clipboardData = null;
let isSpaceDown = false;
let refImageObj = null;
let refOpacity = 0.5;
let refScale = 1;
let gridSize = 20;
let rotationAngle = 0;

// ============================================================
// BRUSH DEFINITIONS — صفوان الفرش
// ============================================================
const BRUSHES = [
  {
    id: 'safwan-round',
    name: 'صفوان المستدير',
    tag: 'فرشاة صفوان',
    category: 'safwan',
    preview: null,
    render: renderRoundBrush,
  },
  {
    id: 'safwan-soft',
    name: 'صفوان الناعم',
    tag: 'فرشاة صفوان',
    category: 'safwan',
    render: renderSoftBrush,
  },
  {
    id: 'safwan-ink',
    name: 'صفوان الحبر',
    tag: 'فرشاة صفوان',
    category: 'safwan',
    render: renderInkBrush,
  },
  {
    id: 'safwan-texture',
    name: 'صفوان الملمس',
    tag: 'فرشاة صفوان',
    category: 'safwan',
    render: renderTextureBrush,
  },
  {
    id: 'safwan-calligraphy',
    name: 'صفوان الخط',
    tag: 'فرشاة صفوان',
    category: 'safwan',
    render: renderCalligraphyBrush,
  },
  { id: 'pencil', name: 'قلم رصاص', tag: 'كلاسيكية', category: 'classic', render: renderPencilBrush },
  { id: 'marker', name: 'ماركر', tag: 'كلاسيكية', category: 'classic', render: renderMarkerBrush },
  { id: 'watercolor', name: 'ألوان مائية', tag: 'مائية', category: 'water', render: renderWatercolorBrush },
  { id: 'charcoal', name: 'فحم', tag: 'فنية', category: 'art', render: renderCharcoalBrush },
  { id: 'oil', name: 'زيت', tag: 'فنية', category: 'art', render: renderOilBrush },
  { id: 'airbrush', name: 'بخاخ', tag: 'خاصة', category: 'special', render: renderAirbrushBrush },
  { id: 'glitter', name: 'بريق', tag: 'خاصة', category: 'special', render: renderGlitterBrush },
  { id: 'eraser-soft', name: 'ممحاة ناعمة', tag: 'محو', category: 'erase', render: renderSoftEraser },
];

// ============================================================
// 500+ COLOR PALETTE
// ============================================================
function generatePalette() {
  const palette = [];
  // Hue sweep at multiple lightness/saturation levels
  for (let h = 0; h < 360; h += 5) {
    for (let s = 80; s <= 100; s += 20) {
      for (let l = 30; l <= 70; l += 20) {
        palette.push(hslToHex(h, s, l));
      }
    }
  }
  // Neutrals
  for (let i = 0; i <= 255; i += 10) {
    palette.push(rgbToHex(i, i, i));
  }
  // Skin tones
  const skins = [
    '#FFDBB4','#EEC99F','#D4A574','#C68642','#A0522D','#8B4513',
    '#FFCBA4','#F3A97F','#C8935E','#A07040','#7B4E2D','#5C3317',
  ];
  skins.forEach(c => palette.push(c));
  // Neons
  const neons = [
    '#FF00FF','#00FFFF','#FF0090','#00FF90','#FFFF00','#FF4500',
    '#39FF14','#FF6EC7','#00BFFF','#FF073A','#FEF65B','#08F7FE',
  ];
  neons.forEach(c => palette.push(c));
  // Pastels
  for (let h = 0; h < 360; h += 15) {
    palette.push(hslToHex(h, 60, 85));
  }
  // Dark shades
  for (let h = 0; h < 360; h += 20) {
    palette.push(hslToHex(h, 70, 20));
  }
  return [...new Set(palette)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
  const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.replace(/^#(\w)(\w)(\w)$/, '#$1$1$2$2$3$3'));
  return res ? { r: parseInt(res[1], 16), g: parseInt(res[2], 16), b: parseInt(res[3], 16) } : { r: 0, g: 0, b: 0 };
}

// ============================================================
// LAYER MANAGEMENT
// ============================================================
function createLayer(name = null) {
  const id = Date.now();
  const layerName = name || `طبقة ${layers.length + 1}`;
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.id = `layer-canvas-${id}`;
  canvas.className = 'layer-canvas';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.display = 'block';

  const layer = { id, name: layerName, canvas, visible: true, locked: false, opacity: 1, blendMode: 'source-over' };
  return layer;
}

function addLayer(name = null) {
  const layer = createLayer(name);
  layers.splice(activeLayerIndex + 1, 0, layer);
  activeLayerIndex = layers.indexOf(layer);
  rebuildCanvasStack();
  renderLayersList();
  saveHistorySnapshot();
  return layer;
}

function deleteActiveLayer() {
  if (layers.length <= 1) { showToast('يجب أن تبقى طبقة واحدة على الأقل'); return; }
  layers.splice(activeLayerIndex, 1);
  activeLayerIndex = Math.max(0, activeLayerIndex - 1);
  rebuildCanvasStack();
  renderLayersList();
  saveHistorySnapshot();
}

function duplicateActiveLayer() {
  const src = layers[activeLayerIndex];
  const newLayer = createLayer(src.name + ' — نسخة');
  const ctx = newLayer.canvas.getContext('2d');
  ctx.drawImage(src.canvas, 0, 0);
  layers.splice(activeLayerIndex + 1, 0, newLayer);
  activeLayerIndex = layers.indexOf(newLayer);
  rebuildCanvasStack();
  renderLayersList();
  saveHistorySnapshot();
}

function mergeLayers() {
  if (layers.length < 2) return;
  const merged = createLayer('طبقة مدمجة');
  const mctx = merged.canvas.getContext('2d');
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    if (!l.visible) continue;
    mctx.save();
    mctx.globalAlpha = l.opacity;
    mctx.globalCompositeOperation = l.blendMode;
    mctx.drawImage(l.canvas, 0, 0);
    mctx.restore();
  }
  layers = [merged];
  activeLayerIndex = 0;
  rebuildCanvasStack();
  renderLayersList();
  saveHistorySnapshot();
}

function rebuildCanvasStack() {
  const stack = document.getElementById('canvasStack');
  if (!stack) return;
  stack.innerHTML = '';
  // Layers go bottom to top
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    l.canvas.style.opacity = l.opacity;
    l.canvas.style.mixBlendMode = l.blendMode;
    l.canvas.style.display = l.visible ? 'block' : 'none';
    stack.appendChild(l.canvas);
  }
  // Size the stack
  stack.style.width = canvasWidth + 'px';
  stack.style.height = canvasHeight + 'px';
  stack.style.position = 'relative';
  // Also set selection/cursor canvas size
  ['selectionCanvas', 'cursorCanvas'].forEach(id => {
    const c = document.getElementById(id);
    if (c) { c.width = canvasWidth; c.height = canvasHeight; }
  });
  updateCheckerSize();
}

function updateCheckerSize() {
  const checker = document.getElementById('canvasChecker');
  if (checker) { checker.style.width = canvasWidth + 'px'; checker.style.height = canvasHeight + 'px'; }
}

function getActiveCanvas() {
  return layers[activeLayerIndex]?.canvas || null;
}

function getActiveCtx() {
  const c = getActiveCanvas();
  if (!c) return null;
  const ctx = c.getContext('2d');
  ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : blendMode;
  ctx.globalAlpha = brushOpacity;
  return ctx;
}

// ============================================================
// RENDER LAYERS LIST UI
// ============================================================
function renderLayersList() {
  const list = document.getElementById('layersList');
  if (!list) return;
  list.innerHTML = '';
  layers.forEach((layer, idx) => {
    const row = document.createElement('div');
    row.className = `layer-row${idx === activeLayerIndex ? ' active' : ''}`;
    row.dataset.idx = idx;
    row.draggable = true;

    // Visibility
    const visBtn = document.createElement('button');
    visBtn.className = `layer-visibility${!layer.visible ? ' hidden' : ''}`;
    visBtn.innerHTML = layer.visible
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    visBtn.addEventListener('click', (e) => { e.stopPropagation(); layer.visible = !layer.visible; rebuildCanvasStack(); renderLayersList(); });

    // Thumbnail
    const thumb = document.createElement('div');
    thumb.className = 'layer-thumb';
    const tc = document.createElement('canvas');
    tc.width = 32; tc.height = 24;
    const tctx = tc.getContext('2d');
    tctx.drawImage(layer.canvas, 0, 0, 32, 24);
    thumb.appendChild(tc);

    // Name
    const nameEl = document.createElement('span');
    nameEl.className = 'layer-name';
    nameEl.textContent = layer.name;
    nameEl.addEventListener('dblclick', () => {
      const input = document.createElement('input');
      input.className = 'layer-name-input';
      input.value = layer.name;
      nameEl.replaceWith(input);
      input.focus();
      input.select();
      const done = () => { layer.name = input.value || layer.name; input.replaceWith(nameEl); nameEl.textContent = layer.name; };
      input.addEventListener('blur', done);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
    });

    // Opacity
    const opEl = document.createElement('span');
    opEl.className = 'layer-opacity-mini';
    opEl.textContent = Math.round(layer.opacity * 100) + '%';

    // Lock
    const lockBtn = document.createElement('button');
    lockBtn.className = 'layer-lock';
    lockBtn.innerHTML = layer.locked
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
    lockBtn.addEventListener('click', (e) => { e.stopPropagation(); layer.locked = !layer.locked; renderLayersList(); });

    row.append(visBtn, thumb, nameEl, opEl, lockBtn);
    row.addEventListener('click', () => { activeLayerIndex = idx; renderLayersList(); });

    list.appendChild(row);
  });
}

// ============================================================
// BRUSH RENDERING FUNCTIONS
// ============================================================
function getBrushCanvas(size, color, hardness, angle, brushId) {
  const bc = document.createElement('canvas');
  const r = size;
  bc.width = bc.height = r * 2 + 4;
  const bctx = bc.getContext('2d');
  const cx = bc.width / 2;
  const cy = bc.height / 2;

  const brush = BRUSHES.find(b => b.id === brushId) || BRUSHES[0];
  brush.render(bctx, cx, cy, r, color, hardness, angle);
  return bc;
}

function renderRoundBrush(ctx, cx, cy, r, color, hardness) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  const rgb = hexToRgb(color);
  g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},1)`);
  g.addColorStop(hardness, `rgba(${rgb.r},${rgb.g},${rgb.b},0.9)`);
  g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
}

function renderSoftBrush(ctx, cx, cy, r, color) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  const rgb = hexToRgb(color);
  g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.8)`);
  g.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`);
  g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
}

function renderInkBrush(ctx, cx, cy, r, color, hardness, angle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle * Math.PI / 180);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  const rgb = hexToRgb(color);
  g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},1)`);
  g.addColorStop(hardness, `rgba(${rgb.r},${rgb.g},${rgb.b},0.95)`);
  g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.3, r, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

function renderTextureBrush(ctx, cx, cy, r, color) {
  const rgb = hexToRgb(color);
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * r;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const sr = Math.random() * 3 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.random() * 0.6 + 0.2})`;
    ctx.fill();
  }
}

function renderCalligraphyBrush(ctx, cx, cy, r, color, hardness, angle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angle + 45) * Math.PI / 180);
  const rgb = hexToRgb(color);
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${hardness})`;
  ctx.fill();
  ctx.restore();
}

function renderPencilBrush(ctx, cx, cy, r, color) {
  const rgb = hexToRgb(color);
  for (let i = 0; i < 25; i++) {
    const ox = (Math.random() - 0.5) * r * 2;
    const oy = (Math.random() - 0.5) * r * 2;
    if (ox * ox + oy * oy > r * r) continue;
    ctx.beginPath();
    ctx.arc(cx + ox, cy + oy, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.random() * 0.5 + 0.3})`;
    ctx.fill();
  }
}

function renderMarkerBrush(ctx, cx, cy, r, color) {
  const rgb = hexToRgb(color);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(30 * Math.PI / 180);
  ctx.beginPath();
  ctx.rect(-r * 0.3, -r, r * 0.6, r * 2);
  ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.65)`;
  ctx.fill();
  ctx.restore();
}

function renderWatercolorBrush(ctx, cx, cy, r, color) {
  const rgb = hexToRgb(color);
  for (let i = 0; i < 5; i++) {
    const ox = (Math.random() - 0.5) * r * 0.8;
    const oy = (Math.random() - 0.5) * r * 0.8;
    const g = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r * 0.8);
    g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`);
    g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
    ctx.beginPath();
    ctx.arc(cx + ox, cy + oy, r * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }
}

function renderCharcoalBrush(ctx, cx, cy, r, color) {
  const rgb = hexToRgb(color);
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * r;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
    ctx.lineTo(cx + Math.cos(angle) * (dist + 2), cy + Math.sin(angle) * (dist + 2));
    ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.random() * 0.4 + 0.1})`;
    ctx.lineWidth = Math.random() * 1.5;
    ctx.stroke();
  }
}

function renderOilBrush(ctx, cx, cy, r, color, hardness) {
  const rgb = hexToRgb(color);
  for (let i = 0; i < 8; i++) {
    const ox = (Math.random() - 0.5) * r * 0.5;
    const oy = (Math.random() - 0.5) * r * 0.5;
    const g = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r * 0.6);
    g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.7)`);
    g.addColorStop(hardness * 0.8, `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`);
    g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
    ctx.beginPath();
    ctx.ellipse(cx + ox, cy + oy, r * 0.6, r * 0.4, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }
}

function renderAirbrushBrush(ctx, cx, cy, r, color) {
  const rgb = hexToRgb(color);
  for (let i = 0; i < 100; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.pow(Math.random(), 0.5) * r;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.random() * 0.3})`;
    ctx.fill();
  }
}

function renderGlitterBrush(ctx, cx, cy, r, color) {
  const colors = ['#ff6b35','#ffd166','#06d6a0','#a855f7','#e63946','#ffffff'];
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * r;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.random() * 2 + 0.5, 0, Math.PI * 2);
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.globalAlpha = Math.random() * 0.8 + 0.2;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function renderSoftEraser(ctx, cx, cy, r) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
}

// ============================================================
// DRAWING ENGINE
// ============================================================
function drawBrushStroke(ctx, x, y, pressure = 1) {
  const size = brushSize * pressure;
  const brushCanvas = getBrushCanvas(size, currentColor, brushHardness, brushAngle, currentBrushId);
  ctx.save();
  ctx.globalAlpha = brushOpacity * brushFlow;
  ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : blendMode;
  ctx.drawImage(brushCanvas, x - brushCanvas.width / 2, y - brushCanvas.height / 2);
  ctx.restore();
}

function interpolatePoints(p1, p2, spacing) {
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const steps = Math.max(1, Math.floor(dist / spacing));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    pts.push({
      x: p1.x + (p2.x - p1.x) * (i / steps),
      y: p1.y + (p2.y - p1.y) * (i / steps),
      pressure: p1.pressure + (p2.pressure - p1.pressure) * (i / steps),
    });
  }
  return pts;
}

function smoothPoint(pt) {
  if (brushSmooth <= 0) return pt;
  smoothPoints.push(pt);
  const maxPts = Math.ceil(brushSmooth * 10) + 2;
  if (smoothPoints.length > maxPts) smoothPoints.shift();
  const avg = smoothPoints.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y, pressure: a.pressure + p.pressure }), { x: 0, y: 0, pressure: 0 });
  return { x: avg.x / smoothPoints.length, y: avg.y / smoothPoints.length, pressure: avg.pressure / smoothPoints.length };
}

// ============================================================
// CANVAS EVENT HANDLING
// ============================================================
function initCanvasEvents() {
  const viewport = document.getElementById('canvasViewport');
  if (!viewport) return;

  viewport.addEventListener('pointerdown', onPointerDown, { passive: false });
  viewport.addEventListener('pointermove', onPointerMove, { passive: false });
  viewport.addEventListener('pointerup', onPointerUp, { passive: false });
  viewport.addEventListener('pointerleave', onPointerUp);
  viewport.addEventListener('wheel', onWheel, { passive: false });
  viewport.addEventListener('contextmenu', e => e.preventDefault());
}

function getCanvasPos(e) {
  const viewport = document.getElementById('canvasViewport');
  const rect = viewport.getBoundingClientRect();
  const wrapper = document.getElementById('canvasWrapper');
  const wRect = wrapper.getBoundingClientRect();
  return {
    x: (e.clientX - wRect.left) / zoom,
    y: (e.clientY - wRect.top) / zoom,
    pressure: e.pressure || 0.5,
  };
}

function onPointerDown(e) {
  e.preventDefault();

  const tool = isSpaceDown ? 'hand' : currentTool;
  if (tool === 'hand') {
    isPanning = true;
    panStart = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    document.getElementById('canvasViewport').classList.add('dragging');
    return;
  }

  const layer = layers[activeLayerIndex];
  if (!layer || layer.locked) { showToast('الطبقة مقفلة'); return; }

  const pos = getCanvasPos(e);
  isDrawing = true;
  lastPoint = { ...pos };
  smoothPoints = [pos];

  const ctx = getActiveCtx();
  if (!ctx) return;

  if (tool === 'fill') {
    floodFill(pos.x, pos.y, currentColor);
    saveHistorySnapshot();
    return;
  }
  if (tool === 'eyedropper') {
    pickColor(pos.x, pos.y);
    return;
  }
  if (['brush', 'pencil', 'pen', 'marker', 'calligraphy', 'airbrush', 'eraser'].includes(tool)) {
    drawBrushStroke(ctx, pos.x, pos.y, pos.pressure);
    updateLayerThumbnails();
  }
}

function onPointerMove(e) {
  const pos = getCanvasPos(e);
  updateCursorDisplay(pos.x, pos.y);
  updateStatusBar(pos.x, pos.y);

  if (isPanning) {
    panOffset.x = e.clientX - panStart.x;
    panOffset.y = e.clientY - panStart.y;
    applyTransform();
    return;
  }
  if (!isDrawing) return;

  const smoothed = smoothPoint({ x: pos.x, y: pos.y, pressure: pos.pressure || 0.5 });
  const ctx = getActiveCtx();
  if (!ctx) return;

  const tool = currentTool;
  if (['brush', 'pencil', 'pen', 'marker', 'calligraphy', 'airbrush', 'eraser'].includes(tool)) {
    if (lastPoint) {
      const pts = interpolatePoints(lastPoint, smoothed, brushSpacing / 10);
      pts.forEach(pt => drawBrushStroke(ctx, pt.x, pt.y, pt.pressure));
    }
  }

  lastPoint = smoothed;
  updateLayerThumbnails();
}

function onPointerUp(e) {
  if (isDrawing) {
    isDrawing = false;
    lastPoint = null;
    smoothPoints = [];
    saveHistorySnapshot();
    updateLayerThumbnails();
  }
  if (isPanning) {
    isPanning = false;
    document.getElementById('canvasViewport')?.classList.remove('dragging');
  }
}

function onWheel(e) {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(zoom * delta);
  } else {
    panOffset.x -= e.deltaX;
    panOffset.y -= e.deltaY;
    applyTransform();
  }
}

function applyTransform() {
  const wrapper = document.getElementById('canvasWrapper');
  if (!wrapper) return;
  wrapper.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom}) rotate(${rotationAngle}deg)`;
}

function setZoom(z) {
  zoom = Math.min(32, Math.max(0.1, z));
  applyTransform();
  updateZoomDisplay();
}

function updateZoomDisplay() {
  const lbl = document.getElementById('zoomLabel');
  if (lbl) lbl.textContent = Math.round(zoom * 100) + '%';
  const slider = document.getElementById('zoomSlider');
  if (slider) slider.value = Math.round(zoom * 100);
}

// ============================================================
// CURSOR DISPLAY
// ============================================================
function updateCursorDisplay(x, y) {
  const cursorCanvas = document.getElementById('cursorCanvas');
  if (!cursorCanvas) return;
  const ctx = cursorCanvas.getContext('2d');
  ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

  if (['brush', 'eraser', 'pencil', 'marker', 'calligraphy', 'airbrush'].includes(currentTool)) {
    const r = brushSize;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    // Crosshair center
    ctx.beginPath();
    ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
    ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ============================================================
// FLOOD FILL
// ============================================================
function floodFill(startX, startY, fillColor) {
  const activeCanvas = getActiveCanvas();
  if (!activeCanvas) return;
  const ctx = activeCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  const px = Math.floor(startX);
  const py = Math.floor(startY);
  if (px < 0 || py < 0 || px >= canvasWidth || py >= canvasHeight) return;

  const idx = (py * canvasWidth + px) * 4;
  const targetR = data[idx], targetG = data[idx + 1], targetB = data[idx + 2], targetA = data[idx + 3];

  const rgb = hexToRgb(fillColor);
  if (targetR === rgb.r && targetG === rgb.g && targetB === rgb.b && targetA === 255) return;

  const tolerance = 30;
  const stack = [[px, py]];
  const visited = new Set();

  function colorMatch(i) {
    return Math.abs(data[i] - targetR) < tolerance &&
           Math.abs(data[i + 1] - targetG) < tolerance &&
           Math.abs(data[i + 2] - targetB) < tolerance &&
           Math.abs(data[i + 3] - targetA) < tolerance;
  }

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= canvasWidth || y >= canvasHeight) continue;
    const key = y * canvasWidth + x;
    if (visited.has(key)) continue;
    visited.add(key);
    const i = key * 4;
    if (!colorMatch(i)) continue;
    data[i] = rgb.r; data[i + 1] = rgb.g; data[i + 2] = rgb.b; data[i + 3] = 255;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  ctx.putImageData(imageData, 0, 0);
}

// ============================================================
// EYEDROPPER
// ============================================================
function pickColor(x, y) {
  const activeCanvas = getActiveCanvas();
  if (!activeCanvas) return;
  const ctx = activeCanvas.getContext('2d');
  const px = Math.floor(x), py = Math.floor(y);
  const d = ctx.getImageData(px, py, 1, 1).data;
  const hex = rgbToHex(d[0], d[1], d[2]);
  setFgColor(hex);
}

// ============================================================
// HISTORY
// ============================================================
function saveHistorySnapshot() {
  // Trim forward history
  history.splice(historyIndex + 1);
  // Limit
  if (history.length >= historyMaxDepth) history.shift();

  const snapshot = layers.map(l => {
    const c = document.createElement('canvas');
    c.width = canvasWidth; c.height = canvasHeight;
    c.getContext('2d').drawImage(l.canvas, 0, 0);
    return { name: l.name, visible: l.visible, locked: l.locked, opacity: l.opacity, blendMode: l.blendMode, snapshot: c };
  });
  history.push(snapshot);
  historyIndex = history.length - 1;
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  restoreSnapshot(history[historyIndex]);
  showToast('تراجع');
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  restoreSnapshot(history[historyIndex]);
  showToast('إعادة');
}

function restoreSnapshot(snapshot) {
  layers = snapshot.map(s => {
    const l = createLayer(s.name);
    l.visible = s.visible;
    l.locked = s.locked;
    l.opacity = s.opacity;
    l.blendMode = s.blendMode;
    l.canvas.getContext('2d').drawImage(s.snapshot, 0, 0);
    return l;
  });
  if (activeLayerIndex >= layers.length) activeLayerIndex = 0;
  rebuildCanvasStack();
  renderLayersList();
}

// ============================================================
// COLOR WHEEL
// ============================================================
function drawColorWheel() {
  const canvas = document.getElementById('colorWheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const r = Math.min(cx, cy) - 4;

  // Hue wheel
  for (let angle = 0; angle < 360; angle++) {
    const startAngle = (angle - 1) * Math.PI / 180;
    const endAngle = (angle + 1) * Math.PI / 180;
    const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
    grad.addColorStop(0, `hsla(${angle}, 100%, 50%, 0)`);
    grad.addColorStop(1, `hsl(${angle}, 100%, 50%)`);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // White center
  const whiteGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.55);
  whiteGrad.addColorStop(0, 'rgba(255,255,255,1)');
  whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = whiteGrad;
  ctx.fill();

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pixel = ctx.getImageData(x * (w / rect.width), y * (h / rect.height), 1, 1).data;
    if (pixel[3] > 10) {
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      setFgColor(hex);
    }
  });
}

function setFgColor(hex) {
  currentColor = hex;
  const swatch = document.getElementById('fgColorSwatch');
  if (swatch) swatch.style.background = hex;
  const preview = document.getElementById('colorPreviewBox');
  if (preview) preview.style.background = hex;
  const hexInput = document.getElementById('hexInput');
  if (hexInput) hexInput.value = hex.toUpperCase();
  const rgb = hexToRgb(hex);
  const r = document.getElementById('rSlider'); if (r) { r.value = rgb.r; document.getElementById('rVal').textContent = rgb.r; }
  const g = document.getElementById('gSlider'); if (g) { g.value = rgb.g; document.getElementById('gVal').textContent = rgb.g; }
  const b = document.getElementById('bSlider'); if (b) { b.value = rgb.b; document.getElementById('bVal').textContent = rgb.b; }
  addToRecentColors(hex);
}

function addToRecentColors(hex) {
  recentColors = recentColors.filter(c => c !== hex);
  recentColors.unshift(hex);
  if (recentColors.length > 20) recentColors.pop();
  renderRecentColors();
}

function renderRecentColors() {
  const list = document.getElementById('recentColors');
  if (!list) return;
  list.innerHTML = '';
  recentColors.forEach(c => {
    const s = document.createElement('div');
    s.className = 'recent-swatch';
    s.style.background = c;
    s.title = c;
    s.addEventListener('click', () => setFgColor(c));
    list.appendChild(s);
  });
}

// ============================================================
// SWATCHES GRID
// ============================================================
function renderSwatches(filter = '') {
  const grid = document.getElementById('swatchesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const palette = generatePalette();
  const filtered = filter
    ? palette.filter(c => c.toLowerCase().includes(filter.toLowerCase()))
    : palette;
  filtered.slice(0, 600).forEach(color => {
    const s = document.createElement('div');
    s.className = 'swatch';
    s.style.background = color;
    s.title = color;
    s.addEventListener('click', () => setFgColor(color));
    grid.appendChild(s);
  });
}

// ============================================================
// BRUSH PANEL
// ============================================================
function renderBrushList() {
  const list = document.getElementById('brushList');
  if (!list) return;
  list.innerHTML = '';
  BRUSHES.forEach(brush => {
    const item = document.createElement('div');
    item.className = `brush-item${brush.id === currentBrushId ? ' active' : ''}`;

    const preview = document.createElement('div');
    preview.className = 'brush-preview';
    const pc = document.createElement('canvas');
    pc.width = 36; pc.height = 24;
    const pctx = pc.getContext('2d');
    brush.render(pctx, 18, 12, 10, '#ffffff', 0.8, 0);
    preview.appendChild(pc);

    const info = document.createElement('div');
    info.className = 'brush-info';
    info.innerHTML = `<div class="brush-name">${brush.name}</div><div class="brush-tag">${brush.tag}</div>`;

    item.append(preview, info);
    item.addEventListener('click', () => {
      currentBrushId = brush.id;
      document.querySelectorAll('.brush-item').forEach(b => b.classList.remove('active'));
      item.classList.add('active');
    });
    list.appendChild(item);
  });
}

// ============================================================
// EXPORT
// ============================================================
function exportCanvas(format, quality = 0.95) {
  // Flatten all visible layers
  const flat = document.createElement('canvas');
  flat.width = canvasWidth;
  flat.height = canvasHeight;
  const ctx = flat.getContext('2d');

  if (format !== 'png-transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    if (!l.visible) continue;
    ctx.save();
    ctx.globalAlpha = l.opacity;
    ctx.globalCompositeOperation = l.blendMode;
    ctx.drawImage(l.canvas, 0, 0);
    ctx.restore();
  }

  const link = document.createElement('a');
  const name = document.getElementById('projectNameInput')?.value || 'safwan-art';

  if (format === 'jpeg') {
    link.href = flat.toDataURL('image/jpeg', quality);
    link.download = `${name}.jpg`;
  } else if (format === 'webp') {
    link.href = flat.toDataURL('image/webp', quality);
    link.download = `${name}.webp`;
  } else {
    link.href = flat.toDataURL('image/png');
    link.download = `${name}.png`;
  }
  link.click();
  showToast('تم التصدير بنجاح');
}

function exportAllLayers() {
  layers.forEach((l, i) => {
    const link = document.createElement('a');
    link.href = l.canvas.toDataURL('image/png');
    link.download = `${l.name}-${i}.png`;
    link.click();
  });
  showToast('تم تصدير جميع الطبقات');
}

// ============================================================
// CANVAS OPERATIONS
// ============================================================
function clearCanvas() {
  const ctx = getActiveCtx();
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  saveHistorySnapshot();
  updateLayerThumbnails();
}

function copySelection() {
  const ctx = getActiveCtx();
  if (!ctx) return;
  clipboardData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  showToast('تم النسخ');
}

function pasteSelection() {
  if (!clipboardData) return;
  const ctx = getActiveCtx();
  if (!ctx) return;
  ctx.putImageData(clipboardData, 0, 0);
  saveHistorySnapshot();
  updateLayerThumbnails();
  showToast('تم اللصق');
}

function flipCanvas(direction) {
  const activeCanvas = getActiveCanvas();
  if (!activeCanvas) return;
  const ctx = activeCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const temp = document.createElement('canvas');
  temp.width = canvasWidth; temp.height = canvasHeight;
  const tc = temp.getContext('2d');
  tc.putImageData(imageData, 0, 0);
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.save();
  if (direction === 'h') {
    ctx.scale(-1, 1);
    ctx.drawImage(temp, -canvasWidth, 0);
  } else {
    ctx.scale(1, -1);
    ctx.drawImage(temp, 0, -canvasHeight);
  }
  ctx.restore();
  saveHistorySnapshot();
  updateLayerThumbnails();
}

function rotateCanvas(angle) {
  rotationAngle = (rotationAngle + angle) % 360;
  applyTransform();
}

function openImageOnCanvas(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const layer = addLayer('صورة مستوردة');
    const ctx = layer.canvas.getContext('2d');
    // Scale to fit
    const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
    const w = img.width * scale, h = img.height * scale;
    const ox = (canvasWidth - w) / 2, oy = (canvasHeight - h) / 2;
    ctx.drawImage(img, ox, oy, w, h);
    saveHistorySnapshot();
    updateLayerThumbnails();
    showToast('تم فتح الصورة');
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

// ============================================================
// REFERENCE IMAGE
// ============================================================
function initReferencePanel() {
  const input = document.getElementById('refImageInput');
  if (!input) return;
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    refImageObj = new Image();
    refImageObj.onload = () => {
      const preview = document.getElementById('refImagePreview');
      if (preview) { preview.src = url; }
      document.getElementById('refUploadArea').style.display = 'none';
      document.getElementById('refControls').style.display = 'flex';
      showToast('تم تحميل المرجع');
    };
    refImageObj.src = url;
  });

  document.getElementById('refOpacitySlider')?.addEventListener('input', (e) => {
    refOpacity = e.target.value / 100;
    document.getElementById('refOpacityVal').textContent = e.target.value + '%';
    const preview = document.getElementById('refImagePreview');
    if (preview) preview.style.opacity = refOpacity;
  });

  document.getElementById('clearRefBtn')?.addEventListener('click', () => {
    refImageObj = null;
    document.getElementById('refImagePreview').src = '';
    document.getElementById('refUploadArea').style.display = 'block';
    document.getElementById('refControls').style.display = 'none';
  });

  document.getElementById('addRefToCanvasBtn')?.addEventListener('click', () => {
    if (!refImageObj) return;
    const layer = addLayer('مرجع');
    const ctx = layer.canvas.getContext('2d');
    ctx.globalAlpha = refOpacity;
    const scale = Math.min(canvasWidth / refImageObj.width, canvasHeight / refImageObj.height) * (refScale / 100);
    const w = refImageObj.width * scale, h = refImageObj.height * scale;
    ctx.drawImage(refImageObj, (canvasWidth - w) / 2, (canvasHeight - h) / 2, w, h);
    ctx.globalAlpha = 1;
    saveHistorySnapshot();
    updateLayerThumbnails();
    showToast('تم إضافة المرجع كطبقة');
  });
}

// ============================================================
// GRID
// ============================================================
function renderGrid() {
  const viewport = document.getElementById('canvasViewport');
  let gridEl = document.getElementById('gridOverlay');
  if (!gridEl) {
    gridEl = document.createElement('canvas');
    gridEl.id = 'gridOverlay';
    gridEl.className = 'grid-overlay';
    gridEl.style.position = 'absolute';
    gridEl.style.top = '0'; gridEl.style.left = '0';
    gridEl.style.pointerEvents = 'none';
    gridEl.style.zIndex = '15';
    viewport.appendChild(gridEl);
  }
  gridEl.width = canvasWidth; gridEl.height = canvasHeight;
  gridEl.style.width = canvasWidth + 'px'; gridEl.style.height = canvasHeight + 'px';
  gridEl.style.display = gridVisible ? 'block' : 'none';
  if (!gridVisible) return;
  const ctx = gridEl.getContext('2d');
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvasWidth; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasHeight); ctx.stroke();
  }
  for (let y = 0; y <= canvasHeight; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasWidth, y); ctx.stroke();
  }
}

// ============================================================
// STATUS BAR
// ============================================================
function updateStatusBar(x, y) {
  const pos = document.getElementById('cursorPosStatus');
  if (pos) pos.textContent = `${Math.floor(x)}, ${Math.floor(y)}`;
  // Color under cursor
  const activeCanvas = getActiveCanvas();
  if (activeCanvas) {
    const px = Math.floor(x), py = Math.floor(y);
    if (px >= 0 && py >= 0 && px < canvasWidth && py < canvasHeight) {
      const d = activeCanvas.getContext('2d').getImageData(px, py, 1, 1).data;
      const indicator = document.getElementById('colorUnderCursor');
      if (indicator) indicator.style.background = `rgb(${d[0]},${d[1]},${d[2]})`;
    }
  }
}

// ============================================================
// LAYER THUMBNAILS
// ============================================================
function updateLayerThumbnails() {
  document.querySelectorAll('.layer-row').forEach((row, idx) => {
    if (idx >= layers.length) return;
    const tc = row.querySelector('.layer-thumb canvas');
    if (!tc) return;
    tc.getContext('2d').drawImage(layers[idx].canvas, 0, 0, 32, 24);
  });
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ============================================================
// THEME
// ============================================================
function applyTheme(theme) {
  document.body.classList.toggle('light-mode', theme === 'light');
  localStorage.setItem(THEME_KEY, theme);
  document.querySelectorAll('.theme-choice').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  applyTheme(saved || preferred);
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { isSpaceDown = true; return; }
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z': e.preventDefault(); e.shiftKey ? redo() : undo(); break;
        case 'y': e.preventDefault(); redo(); break;
        case 'c': e.preventDefault(); copySelection(); break;
        case 'v': e.preventDefault(); pasteSelection(); break;
        case 'x': e.preventDefault(); break;
        case 'a': e.preventDefault(); break;
        case '=': case '+': e.preventDefault(); setZoom(zoom * 1.2); break;
        case '-': e.preventDefault(); setZoom(zoom / 1.2); break;
        case '0': e.preventDefault(); setZoom(1); panOffset = { x: 0, y: 0 }; applyTransform(); break;
      }
      return;
    }
    switch (e.key.toLowerCase()) {
      case 'b': setTool('brush'); break;
      case 'e': setTool('eraser'); break;
      case 'v': setTool('select'); break;
      case 'g': setTool('fill'); break;
      case 't': setTool('text'); break;
      case 'i': setTool('eyedropper'); break;
      case 'z': setTool('zoom-tool'); break;
      case 'h': setTool('hand'); break;
      case 'p': setTool('pencil'); break;
      case '[': brushSize = Math.max(1, brushSize - 5); updateBrushSizeUI(); break;
      case ']': brushSize = Math.min(500, brushSize + 5); updateBrushSizeUI(); break;
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') { isSpaceDown = false; }
  });
}

function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });
  const viewport = document.getElementById('canvasViewport');
  if (viewport) viewport.dataset.tool = tool;
}

function updateBrushSizeUI() {
  const slider = document.getElementById('brushSizeSlider');
  const val = document.getElementById('brushSizeVal');
  if (slider) slider.value = brushSize;
  if (val) val.textContent = brushSize;
}

// ============================================================
// UI EVENT BINDINGS
// ============================================================
function bindUI() {
  // Tool buttons
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tool) setTool(btn.dataset.tool);
    });
  });

  // Brush sliders
  document.getElementById('brushSizeSlider')?.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
    document.getElementById('brushSizeVal').textContent = brushSize;
  });
  document.getElementById('brushOpacitySlider')?.addEventListener('input', (e) => {
    brushOpacity = e.target.value / 100;
    document.getElementById('brushOpacityVal').textContent = e.target.value + '%';
  });
  document.getElementById('brushHardnessSlider')?.addEventListener('input', (e) => {
    brushHardness = e.target.value / 100;
    document.getElementById('brushHardnessVal').textContent = e.target.value + '%';
  });
  document.getElementById('brushSmoothSlider')?.addEventListener('input', (e) => {
    brushSmooth = e.target.value / 100;
    document.getElementById('brushSmoothVal').textContent = e.target.value + '%';
  });
  document.getElementById('brushFlowSlider')?.addEventListener('input', (e) => {
    brushFlow = e.target.value / 100;
    document.getElementById('brushFlowVal').textContent = e.target.value + '%';
  });
  document.getElementById('brushAngleSlider')?.addEventListener('input', (e) => {
    brushAngle = parseInt(e.target.value);
    document.getElementById('brushAngleVal').textContent = e.target.value + '°';
  });
  document.getElementById('brushSpacingSlider')?.addEventListener('input', (e) => {
    brushSpacing = parseInt(e.target.value);
    document.getElementById('brushSpacingVal').textContent = e.target.value + '%';
  });
  document.getElementById('blendModeSelect')?.addEventListener('change', (e) => {
    blendMode = e.target.value;
  });

  // Layer buttons
  document.getElementById('addLayerBtn')?.addEventListener('click', () => addLayer());
  document.getElementById('duplicateLayerBtn')?.addEventListener('click', duplicateActiveLayer);
  document.getElementById('mergeLayersBtn')?.addEventListener('click', mergeLayers);
  document.getElementById('deleteLayerBtn')?.addEventListener('click', deleteActiveLayer);
  document.getElementById('flattenBtn')?.addEventListener('click', mergeLayers);

  // Panel tabs
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const panel = tab.dataset.panel;
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${panel}`)?.classList.add('active');
    });
  });

  // Zoom
  document.getElementById('zoomMinus')?.addEventListener('click', () => setZoom(zoom / 1.2));
  document.getElementById('zoomPlus')?.addEventListener('click', () => setZoom(zoom * 1.2));
  document.getElementById('zoomSlider')?.addEventListener('input', (e) => { setZoom(parseInt(e.target.value) / 100); });
  document.getElementById('zoomInBtn')?.addEventListener('click', () => setZoom(zoom * 1.2));
  document.getElementById('zoomOutBtn')?.addEventListener('click', () => setZoom(zoom / 1.2));
  document.getElementById('zoomFitBtn')?.addEventListener('click', () => { setZoom(1); panOffset = { x: 0, y: 0 }; applyTransform(); });

  // File menu
  document.getElementById('savePNG')?.addEventListener('click', () => exportCanvas('png'));
  document.getElementById('saveJPEG')?.addEventListener('click', () => exportCanvas('jpeg'));
  document.getElementById('saveWebP')?.addEventListener('click', () => exportCanvas('webp'));
  document.getElementById('saveTransparent')?.addEventListener('click', () => exportCanvas('png-transparent'));
  document.getElementById('exportAllLayers')?.addEventListener('click', exportAllLayers);
  document.getElementById('openImageBtn')?.addEventListener('click', () => document.getElementById('openImageInput').click());
  document.getElementById('openImageInput')?.addEventListener('change', (e) => openImageOnCanvas(e.target.files[0]));

  // Edit menu
  document.getElementById('undoBtn')?.addEventListener('click', undo);
  document.getElementById('redoBtn')?.addEventListener('click', redo);
  document.getElementById('undoTopBtn')?.addEventListener('click', undo);
  document.getElementById('redoTopBtn')?.addEventListener('click', redo);
  document.getElementById('clearBtn')?.addEventListener('click', clearCanvas);
  document.getElementById('copyBtn')?.addEventListener('click', copySelection);
  document.getElementById('pasteBtn')?.addEventListener('click', pasteSelection);

  // Canvas menu
  document.getElementById('rotateCCW')?.addEventListener('click', () => rotateCanvas(-90));
  document.getElementById('rotateCW')?.addEventListener('click', () => rotateCanvas(90));
  document.getElementById('flipH')?.addEventListener('click', () => flipCanvas('h'));
  document.getElementById('flipV')?.addEventListener('click', () => flipCanvas('v'));

  // View menu
  document.getElementById('toggleGridBtn')?.addEventListener('click', () => { gridVisible = !gridVisible; renderGrid(); });
  document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });

  // Settings
  document.getElementById('settingsBtn')?.addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'flex';
  });
  document.querySelectorAll('.theme-choice').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });
  document.querySelectorAll('.toggle-switch').forEach(sw => {
    sw.addEventListener('click', () => {
      sw.classList.toggle('active');
      if (sw.id === 'gridToggleSwitch') { gridVisible = sw.classList.contains('active'); renderGrid(); }
    });
  });

  // Hex input
  document.getElementById('hexInput')?.addEventListener('change', (e) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) setFgColor(val);
  });

  // RGB sliders
  ['r', 'g', 'b'].forEach(ch => {
    document.getElementById(`${ch}Slider`)?.addEventListener('input', (e) => {
      document.getElementById(`${ch}Val`).textContent = e.target.value;
      const r = parseInt(document.getElementById('rSlider')?.value || 0);
      const g = parseInt(document.getElementById('gSlider')?.value || 0);
      const b = parseInt(document.getElementById('bSlider')?.value || 0);
      setFgColor(rgbToHex(r, g, b));
    });
  });
  document.getElementById('aSlider')?.addEventListener('input', (e) => {
    brushOpacity = e.target.value / 100;
    document.getElementById('aVal').textContent = e.target.value + '%';
  });

  // Color search
  document.getElementById('colorSearch')?.addEventListener('input', (e) => renderSwatches(e.target.value));

  // Swap colors
  document.getElementById('swapColorsBtn')?.addEventListener('click', () => {
    const tmp = currentColor;
    setFgColor(bgColor);
    bgColor = tmp;
    document.getElementById('bgColorSwatch').style.background = bgColor;
  });

  // Color swatches open
  window.openColorPicker = (type) => {
    if (type === 'fg') {
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
      document.querySelector('[data-panel="colors"]')?.classList.add('active');
      document.getElementById('panel-colors')?.classList.add('active');
    }
  };
}

// ============================================================
// INIT
// ============================================================
function initFromURL() {
  const params = new URLSearchParams(window.location.search);
  const w = parseInt(params.get('w')) || 1920;
  const h = parseInt(params.get('h')) || 1080;
  const name = params.get('name') || 'بدون عنوان';
  const bg = params.get('bg') || 'white';

  canvasWidth = w;
  canvasHeight = h;
  bgColor = bg === 'white' ? '#ffffff' : bg === 'black' ? '#000000' : 'transparent';

  const nameInput = document.getElementById('projectNameInput');
  if (nameInput) nameInput.value = name;
  const sizeStatus = document.getElementById('canvasSizeStatus');
  if (sizeStatus) sizeStatus.textContent = `${w} × ${h} px`;
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initFromURL();

  // Create initial layer
  const initLayer = createLayer('الطبقة 1');
  layers.push(initLayer);

  // Fill background on base layer if needed
  if (bgColor !== 'transparent') {
    const ctx = initLayer.canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  rebuildCanvasStack();
  renderLayersList();

  // Center canvas in viewport
  const viewport = document.getElementById('canvasViewport');
  if (viewport) {
    setTimeout(() => {
      const vw = viewport.clientWidth, vh = viewport.clientHeight;
      const scaleX = (vw - 80) / canvasWidth, scaleY = (vh - 80) / canvasHeight;
      const initZoom = Math.min(scaleX, scaleY, 1);
      panOffset.x = (vw - canvasWidth * initZoom) / 2;
      panOffset.y = (vh - canvasHeight * initZoom) / 2;
      setZoom(initZoom);
    }, 50);
  }

  initCanvasEvents();
  initKeyboard();
  bindUI();
  drawColorWheel();
  renderSwatches();
  renderBrushList();
  initReferencePanel();
  renderGrid();
  saveHistorySnapshot();

  setFgColor('#ff6b35');
  document.getElementById('bgColorSwatch').style.background = bgColor;

  showToast('مرحباً بك في صفوان ستوديو');
});
