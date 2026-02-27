/* studio.js — محرك الاستوديو الكامل لصفوان ستوديو */

// ============== الحالة العامة ==============
const state = {
  tool: 'brush',
  brush: 'safwan-pro',
  color: '#000000',
  bgColor: '#ffffff',
  opacity: 1.0,
  size: 10,
  smoothing: 50,
  zoom: 1,
  isDrawing: false,
  lastX: 0, lastY: 0,
  history: [],
  historyIndex: -1,
  maxHistory: 50,
  layers: [],
  activeLayerIndex: 0,
  projectType: 'static',
  canvasWidth: 800,
  canvasHeight: 600,
  frames: [],
  currentFrame: 0,
  fps: 12,
  isPlaying: false,
  animTimer: null,
  isDark: true,
  gridVisible: false,
  blendMode: 'source-over',
  refImage: null,
  refOpacity: 0.5,
  refLocked: false,
  pressureEnabled: true,
  savedColors: [],
  colorH: 0, colorS: 1, colorV: 0.5,
  points: [],
  projectId: null,
  startPoint: null,
  lassoPath: []
};

// ============== تهيئة ==============
window.onload = function () {
  loadSettings();
  initCanvases();
  initColorPicker();
  initColorPalette();
  renderLayersList();
  initEventListeners();
  updateUI();

  if (state.projectType === 'animated') {
    document.getElementById('timelineBar').style.display = 'flex';
    initTimeline();
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    state.isDark = false;
    document.body.classList.add('light-theme');
    document.getElementById('moonIcon').style.display = 'none';
    document.getElementById('sunIcon').style.display = 'block';
    const dt = document.getElementById('darkModeToggle');
    if (dt) dt.checked = false;
  }

  setTimeout(saveHistory, 200);
};

function loadSettings() {
  const raw = sessionStorage.getItem('projectSettings');
  if (raw) {
    const s = JSON.parse(raw);
    state.projectType = s.type || 'static';
    state.bgColor = s.bgColor || '#ffffff';
    state.canvasWidth = s.width || 800;
    state.canvasHeight = s.height || 600;
  }
  document.getElementById('pdType').textContent = state.projectType === 'animated' ? 'متحرك' : 'ثابت';
  document.getElementById('pdSize').textContent = `${state.canvasWidth} × ${state.canvasHeight}`;
}

function initCanvases() {
  ['bgCanvas', 'layer0', 'overlayCanvas', 'selectionCanvas'].forEach(id => {
    const c = document.getElementById(id);
    if (c) { c.width = state.canvasWidth; c.height = state.canvasHeight; }
  });

  const stack = document.getElementById('canvasStack');
  if (stack) { stack.style.width = state.canvasWidth + 'px'; stack.style.height = state.canvasHeight + 'px'; }

  drawBackground();

  state.layers = [{
    id: 0, name: 'الطبقة 1',
    canvas: document.getElementById('layer0'),
    visible: true, locked: false, opacity: 1.0, blendMode: 'source-over'
  }];

  document.getElementById('layer0').style.zIndex = 10;
  document.getElementById('overlayCanvas').style.zIndex = 200;
  document.getElementById('selectionCanvas').style.zIndex = 300;
}

function drawBackground() {
  const bg = document.getElementById('bgCanvas');
  if (!bg) return;
  const ctx = bg.getContext('2d');
  if (state.bgColor === 'transparent') {
    ctx.clearRect(0, 0, bg.width, bg.height);
  } else {
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, bg.width, bg.height);
  }
}

// ============== الرسم ==============
function getActiveCanvas() { return state.layers[state.activeLayerIndex]?.canvas; }
function getActiveCtx() { const c = getActiveCanvas(); return c ? c.getContext('2d') : null; }

function initEventListeners() {
  const stack = document.getElementById('canvasStack');
  if (!stack) return;

  stack.addEventListener('mousedown', startDraw);
  stack.addEventListener('mousemove', duringDraw);
  stack.addEventListener('mouseup', endDraw);
  stack.addEventListener('mouseleave', endDraw);

  stack.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    startDraw({ clientX: t.clientX, clientY: t.clientY, pressure: t.force || 0.5, buttons: 1 });
  }, { passive: false });

  stack.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    duringDraw({ clientX: t.clientX, clientY: t.clientY, pressure: t.force || 0.5, buttons: 1 });
  }, { passive: false });

  stack.addEventListener('touchend', endDraw);

  document.getElementById('canvasContainer').addEventListener('wheel', e => {
    e.preventDefault();
    state.zoom = Math.max(0.1, Math.min(32, state.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    applyZoom();
  }, { passive: false });

  document.addEventListener('keydown', handleKeyboard);

  document.addEventListener('click', e => {
    if (!e.target.closest('.tool-group')) {
      document.querySelectorAll('.tool-group').forEach(g => g.classList.remove('open'));
    }
  });
}

function getCanvasPos(e) {
  const wrapper = document.getElementById('canvasWrapper');
  const rect = wrapper.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / state.zoom,
    y: (e.clientY - rect.top) / state.zoom
  };
}

function startDraw(e) {
  if (state.layers[state.activeLayerIndex]?.locked) return;
  const pos = getCanvasPos(e);
  state.isDrawing = true;
  state.lastX = pos.x;
  state.lastY = pos.y;
  state.startPoint = { ...pos };
  state.points = [{ ...pos }];
  state.lassoPath = [{ ...pos }];

  const ctx = getActiveCtx();
  if (!ctx) return;

  if (state.tool === 'fill') { floodFill(ctx, Math.round(pos.x), Math.round(pos.y), state.color); saveHistory(); return; }
  if (state.tool === 'eyedropper') { pickColor(ctx, Math.round(pos.x), Math.round(pos.y)); state.isDrawing = false; return; }
  if (state.tool === 'text') { addText(pos.x, pos.y); state.isDrawing = false; return; }

  if (['brush','pencil','pen','marker','charcoal','airbrush','eraser','smudge','soft','hard'].includes(state.tool)) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }
}

function duringDraw(e) {
  if (!state.isDrawing) return;
  const pos = getCanvasPos(e);
  const ctx = getActiveCtx();
  if (!ctx) return;

  const pressure = (e.pressure !== undefined && e.pressure > 0) ? e.pressure : 0.5;

  if (state.tool === 'hand') { panCanvas(pos); return; }
  if (state.tool === 'move') { moveCanvasContent(pos); state.lastX = pos.x; state.lastY = pos.y; return; }
  if (state.tool === 'select-rect') { drawSelRect(pos); return; }
  if (state.tool === 'select-circle') { drawSelCircle(pos); return; }
  if (state.tool === 'lasso') { state.lassoPath.push(pos); drawLasso(); return; }
  if (['line','rect','circle','triangle','polygon','star','bezier'].includes(state.tool)) { drawShapePreview(pos); return; }
  if (state.tool === 'gradient') { drawGradientPreview(pos); return; }

  state.points.push(pos);
  applyBrushAt(ctx, pos, pressure);
  state.lastX = pos.x;
  state.lastY = pos.y;
}

function endDraw(e) {
  if (!state.isDrawing) return;
  state.isDrawing = false;

  const ctx = getActiveCtx();
  if (!ctx) return;

  const pos = e ? getCanvasPos(e) : { x: state.lastX, y: state.lastY };

  if (state.tool === 'gradient' && state.startPoint) {
    applyGradient(ctx, state.startPoint, pos);
  } else if (['line','rect','circle','triangle','polygon','star','bezier'].includes(state.tool) && state.startPoint) {
    clearOverlay();
    drawShapeFinal(ctx, state.startPoint, pos);
  }

  try { ctx.restore(); } catch(e_) {}
  saveHistory();
  updateFrameThumbnail();
  state.points = [];
  state.startPoint = null;
  state.lassoPath = [];
}

// ============== الفرشاة ==============
function applyBrushAt(ctx, pos, pressure) {
  const sz = state.pressureEnabled ? state.size * (0.4 + pressure * 0.6) : state.size;

  ctx.save();
  ctx.globalAlpha = state.opacity;
  ctx.strokeStyle = state.color;
  ctx.fillStyle = state.color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = sz;

  if (state.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = state.blendMode;
  }

  const x1 = state.lastX, y1 = state.lastY, x2 = pos.x, y2 = pos.y;
  const smooth = state.smoothing / 100;

  switch (state.brush) {
    case 'safwan-watercolor':
    case 'watercolor':
      for (let i = 0; i < 6; i++) {
        ctx.globalAlpha = state.opacity * 0.12;
        const ox = (Math.random()-0.5)*sz*0.6, oy = (Math.random()-0.5)*sz*0.6;
        ctx.beginPath(); ctx.moveTo(x1+ox, y1+oy); ctx.lineTo(x2+ox, y2+oy); ctx.stroke();
      }
      break;

    case 'safwan-sketch':
    case 'charcoal':
      ctx.lineWidth = sz * 0.8; ctx.globalAlpha = state.opacity * 0.65;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const ang = Math.atan2(y2-y1, x2-x1) + Math.PI/2;
      ctx.lineWidth = sz * 0.25; ctx.globalAlpha = state.opacity * 0.3;
      ctx.beginPath();
      ctx.moveTo(x1+Math.cos(ang)*sz*0.3, y1+Math.sin(ang)*sz*0.3);
      ctx.lineTo(x2+Math.cos(ang)*sz*0.3, y2+Math.sin(ang)*sz*0.3);
      ctx.stroke();
      break;

    case 'splatter':
    case 'airbrush':
      const dist = Math.hypot(x2-x1, y2-y1);
      const steps = Math.max(1, Math.ceil(dist));
      for (let i = 0; i < steps; i++) {
        const px = x1+(x2-x1)*(i/steps), py = y1+(y2-y1)*(i/steps);
        for (let j = 0; j < 10; j++) {
          const r = Math.random()*sz*1.8, a = Math.random()*Math.PI*2;
          ctx.globalAlpha = state.opacity * Math.random() * 0.15;
          ctx.beginPath();
          ctx.arc(px+Math.cos(a)*r, py+Math.sin(a)*r, Math.random()*sz*0.12+0.5, 0, Math.PI*2);
          ctx.fill();
        }
      }
      break;

    case 'soft':
      const g = ctx.createRadialGradient(x2, y2, 0, x2, y2, sz/2);
      g.addColorStop(0, state.color);
      g.addColorStop(1, 'transparent');
      ctx.globalAlpha = state.opacity * 0.35;
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x2, y2, sz/2, 0, Math.PI*2); ctx.fill();
      break;

    case 'safwan-glow':
      ctx.shadowColor = state.color;
      ctx.shadowBlur = sz * 2.5;
      ctx.globalAlpha = state.opacity * 0.85;
      drawSmoothLine(ctx, x1, y1, x2, y2, smooth);
      ctx.shadowBlur = 0;
      break;

    case 'safwan-ink':
    case 'pen':
      ctx.lineWidth = sz * (0.25 + pressure * 0.75);
      drawSmoothLine(ctx, x1, y1, x2, y2, smooth);
      break;

    case 'marker':
      ctx.lineWidth = sz * 1.2;
      ctx.globalAlpha = state.opacity * 0.7;
      ctx.lineCap = 'square';
      drawSmoothLine(ctx, x1, y1, x2, y2, 0);
      break;

    case 'oil':
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = state.opacity * 0.5;
        ctx.lineWidth = sz * (0.6 + i * 0.2);
        drawSmoothLine(ctx, x1+(i-1)*2, y1, x2+(i-1)*2, y2, smooth);
      }
      break;

    case 'smudge':
      const d = Math.hypot(x2-x1, y2-y1);
      if (d < 2) break;
      const img = ctx.getImageData(
        Math.min(x1,x2)-sz, Math.min(y1,y2)-sz,
        Math.abs(x2-x1)+sz*2, Math.abs(y2-y1)+sz*2
      );
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.putImageData(img, Math.min(x1,x2)-sz + (x2-x1)*0.3, Math.min(y1,y2)-sz + (y2-y1)*0.3);
      ctx.restore();
      break;

    case 'calligraphy':
      ctx.lineWidth = sz;
      ctx.lineCap = 'butt';
      const angle = Math.atan2(y2-y1, x2-x1);
      ctx.save();
      ctx.translate(x2, y2); ctx.rotate(angle + Math.PI/4);
      ctx.scale(1, 0.3);
      ctx.beginPath(); ctx.arc(0, 0, sz/2, 0, Math.PI*2); ctx.fill();
      ctx.restore();
      break;

    default:
      drawSmoothLine(ctx, x1, y1, x2, y2, smooth);
  }

  ctx.restore();
}

function drawSmoothLine(ctx, x1, y1, x2, y2, smooth) {
  if (smooth > 0 && state.points.length >= 3) {
    const pts = state.points;
    const p0 = pts[pts.length-3], p1 = pts[pts.length-2], p2 = pts[pts.length-1];
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
    ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
}

// ============== الأشكال ==============
function clearOverlay() {
  const ov = document.getElementById('overlayCanvas');
  if (ov) ov.getContext('2d').clearRect(0, 0, ov.width, ov.height);
}

function drawShapePreview(pos) {
  clearOverlay();
  const ov = document.getElementById('overlayCanvas');
  const ctx = ov.getContext('2d');
  ctx.save();
  ctx.globalAlpha = state.opacity;
  ctx.strokeStyle = state.color;
  ctx.fillStyle = 'transparent';
  ctx.lineWidth = state.size;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  renderShape(ctx, state.startPoint || pos, pos);
  ctx.restore();
}

function drawShapeFinal(ctx, start, end) {
  ctx.save();
  ctx.globalAlpha = state.opacity;
  ctx.strokeStyle = state.color;
  ctx.lineWidth = state.size;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.globalCompositeOperation = state.blendMode;
  renderShape(ctx, start, end);
  ctx.restore();
}

function renderShape(ctx, s, e) {
  const dx = e.x-s.x, dy = e.y-s.y;
  ctx.beginPath();
  switch (state.tool) {
    case 'line':
      ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke(); break;
    case 'rect':
      ctx.strokeRect(s.x, s.y, dx, dy); break;
    case 'circle':
      ctx.ellipse(s.x+dx/2, s.y+dy/2, Math.abs(dx)/2, Math.abs(dy)/2, 0, 0, Math.PI*2); ctx.stroke(); break;
    case 'triangle':
      ctx.moveTo(s.x+dx/2, s.y); ctx.lineTo(e.x, e.y); ctx.lineTo(s.x, e.y); ctx.closePath(); ctx.stroke(); break;
    case 'polygon':
      drawPolygon(ctx, s, e, 6); break;
    case 'star':
      drawStar(ctx, s, e, 5); break;
    case 'bezier':
      const cpx = s.x + (e.x-s.x)*0.5, cpy = s.y;
      ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(cpx, cpy, e.x, e.y); ctx.stroke(); break;
  }
}

function drawPolygon(ctx, s, e, sides) {
  const cx=(s.x+e.x)/2, cy=(s.y+e.y)/2;
  const r=Math.hypot(e.x-cx, e.y-cy);
  for (let i=0; i<sides; i++) {
    const a=(i*2*Math.PI/sides)-Math.PI/2;
    i===0 ? ctx.moveTo(cx+r*Math.cos(a), cy+r*Math.sin(a)) : ctx.lineTo(cx+r*Math.cos(a), cy+r*Math.sin(a));
  }
  ctx.closePath(); ctx.stroke();
}

function drawStar(ctx, s, e, pts) {
  const cx=(s.x+e.x)/2, cy=(s.y+e.y)/2;
  const outerR=Math.hypot(e.x-cx, e.y-cy), innerR=outerR*0.4;
  for (let i=0; i<pts*2; i++) {
    const a=(i*Math.PI/pts)-Math.PI/2;
    const r=i%2===0?outerR:innerR;
    i===0 ? ctx.moveTo(cx+r*Math.cos(a), cy+r*Math.sin(a)) : ctx.lineTo(cx+r*Math.cos(a), cy+r*Math.sin(a));
  }
  ctx.closePath(); ctx.stroke();
}

// ============== التحديد ==============
function drawSelRect(pos) {
  const s = state.startPoint; if (!s) return;
  const sel = document.getElementById('selectionCanvas');
  const ctx = sel.getContext('2d');
  ctx.clearRect(0, 0, sel.width, sel.height);
  ctx.save();
  ctx.strokeStyle = '#FF6B35'; ctx.lineWidth = 1/state.zoom;
  ctx.setLineDash([5/state.zoom, 3/state.zoom]);
  ctx.strokeRect(s.x, s.y, pos.x-s.x, pos.y-s.y);
  ctx.restore();
}

function drawSelCircle(pos) {
  const s = state.startPoint; if (!s) return;
  const sel = document.getElementById('selectionCanvas');
  const ctx = sel.getContext('2d');
  ctx.clearRect(0, 0, sel.width, sel.height);
  ctx.save();
  ctx.strokeStyle = '#FF6B35'; ctx.lineWidth = 1/state.zoom;
  ctx.setLineDash([5/state.zoom, 3/state.zoom]);
  ctx.beginPath();
  ctx.ellipse(s.x+(pos.x-s.x)/2, s.y+(pos.y-s.y)/2, Math.abs(pos.x-s.x)/2, Math.abs(pos.y-s.y)/2, 0, 0, Math.PI*2);
  ctx.stroke(); ctx.restore();
}

function drawLasso() {
  const sel = document.getElementById('selectionCanvas');
  const ctx = sel.getContext('2d');
  ctx.clearRect(0, 0, sel.width, sel.height);
  if (state.lassoPath.length < 2) return;
  ctx.save();
  ctx.strokeStyle = '#FF6B35'; ctx.lineWidth = 1/state.zoom;
  ctx.setLineDash([3/state.zoom, 2/state.zoom]);
  ctx.beginPath();
  ctx.moveTo(state.lassoPath[0].x, state.lassoPath[0].y);
  state.lassoPath.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.stroke(); ctx.restore();
}

// ============== أدوات إضافية ==============
function floodFill(ctx, sx, sy, fillColor) {
  const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const d = imgData.data, w = imgData.width, h = imgData.height;
  const i = (sy*w+sx)*4;
  const tr=d[i], tg=d[i+1], tb=d[i+2], ta=d[i+3];
  const fc = hexToRgb(fillColor);
  if (!fc || (tr===fc.r && tg===fc.g && tb===fc.b)) return;
  const stack = [[sx,sy]];
  while (stack.length) {
    const [x,y] = stack.pop();
    if (x<0||x>=w||y<0||y>=h) continue;
    const idx=(y*w+x)*4;
    if (Math.abs(d[idx]-tr)>40||Math.abs(d[idx+1]-tg)>40||Math.abs(d[idx+2]-tb)>40) continue;
    if (d[idx]===fc.r&&d[idx+1]===fc.g&&d[idx+2]===fc.b&&d[idx+3]===255) continue;
    d[idx]=fc.r; d[idx+1]=fc.g; d[idx+2]=fc.b; d[idx+3]=255;
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  ctx.putImageData(imgData, 0, 0);
}

function pickColor(ctx, x, y) {
  const p = ctx.getImageData(x, y, 1, 1).data;
  const hex = '#'+[p[0],p[1],p[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
  setColor(hex);
}

function addText(x, y) {
  const text = prompt('أدخل النص:');
  if (!text) return;
  const ctx = getActiveCtx(); if (!ctx) return;
  ctx.save();
  ctx.fillStyle = state.color;
  ctx.font = `${Math.max(12, state.size*2)}px Tajawal, Cairo, sans-serif`;
  ctx.globalAlpha = state.opacity;
  ctx.fillText(text, x, y);
  ctx.restore();
  saveHistory();
}

function drawGradientPreview(pos) {
  clearOverlay();
  const ov = document.getElementById('overlayCanvas');
  const ctx = ov.getContext('2d');
  const s = state.startPoint; if (!s) return;
  const grad = ctx.createLinearGradient(s.x, s.y, pos.x, pos.y);
  grad.addColorStop(0, state.color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ov.width, ov.height);
}

function applyGradient(ctx, start, end) {
  clearOverlay();
  const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
  grad.addColorStop(0, state.color);
  grad.addColorStop(1, document.getElementById('bgColorSwatch').style.background || '#ffffff');
  ctx.save();
  ctx.globalAlpha = state.opacity;
  ctx.globalCompositeOperation = state.blendMode;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

function moveCanvasContent(pos) {
  const ctx = getActiveCtx(); if (!ctx) return;
  const dx = pos.x - state.lastX, dy = pos.y - state.lastY;
  const img = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.putImageData(img, dx, dy);
}

function panCanvas(pos) {
  const dx = pos.x - state.lastX, dy = pos.y - state.lastY;
  const container = document.getElementById('canvasContainer');
  container.scrollLeft -= dx;
  container.scrollTop -= dy;
}

// ============== التاريخ ==============
function saveHistory() {
  state.history = state.history.slice(0, state.historyIndex+1);
  const snapshot = state.layers.map(l => ({
    id: l.id,
    imageData: l.canvas.getContext('2d').getImageData(0, 0, l.canvas.width, l.canvas.height)
  }));
  state.history.push(snapshot);
  state.historyIndex++;
  if (state.history.length > state.maxHistory) { state.history.shift(); state.historyIndex--; }
}

function undoAction() {
  if (state.historyIndex <= 0) return;
  state.historyIndex--;
  restoreSnapshot(state.history[state.historyIndex]);
}

function redoAction() {
  if (state.historyIndex >= state.history.length-1) return;
  state.historyIndex++;
  restoreSnapshot(state.history[state.historyIndex]);
}

function restoreSnapshot(snap) {
  if (!snap) return;
  snap.forEach(item => {
    const layer = state.layers.find(l => l.id === item.id);
    if (layer) layer.canvas.getContext('2d').putImageData(item.imageData, 0, 0);
  });
}

// ============== التكبير ==============
function applyZoom() {
  const wrapper = document.getElementById('canvasWrapper');
  if (wrapper) { wrapper.style.transform = `scale(${state.zoom})`; wrapper.style.transformOrigin = 'center center'; }
  document.getElementById('zoomDisplay').textContent = Math.round(state.zoom*100)+'%';
}

function zoomIn() { state.zoom = Math.min(32, state.zoom*1.25); applyZoom(); }
function zoomOut() { state.zoom = Math.max(0.1, state.zoom*0.8); applyZoom(); }
function resetZoom() { state.zoom = 1; applyZoom(); }

// ============== الأدوات ==============
function selectTool(tool) {
  state.tool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-tool="${tool}"]`).forEach(b => b.classList.add('active'));
  const cursors = {
    brush:'crosshair', pencil:'crosshair', pen:'crosshair', marker:'crosshair',
    charcoal:'crosshair', airbrush:'crosshair', oil:'crosshair', soft:'crosshair',
    eraser:'cell', fill:'copy', eyedropper:'crosshair', move:'move', hand:'grab',
    text:'text', 'select-rect':'crosshair', 'select-circle':'crosshair',
    lasso:'crosshair', 'magic-wand':'crosshair', smudge:'crosshair',
    blur:'crosshair', sharpen:'crosshair', clone:'crosshair',
    gradient:'crosshair', line:'crosshair', rect:'crosshair', circle:'crosshair',
    triangle:'crosshair', polygon:'crosshair', star:'crosshair', bezier:'crosshair'
  };
  const activeCanvas = getActiveCanvas();
  if (activeCanvas) activeCanvas.style.cursor = cursors[tool] || 'crosshair';
  document.querySelectorAll('.tool-group').forEach(g => g.classList.remove('open'));
}

function toggleToolGroup(id) {
  const g = document.getElementById(id);
  const wasOpen = g.classList.contains('open');
  document.querySelectorAll('.tool-group').forEach(x => x.classList.remove('open'));
  if (!wasOpen) g.classList.add('open');
}

function selectBrush(brush, btn) {
  state.brush = brush;
  document.querySelectorAll('.brush-btn, .brush-list-btn').forEach(b => b.classList.remove('selected','active'));
  if (btn) { btn.classList.add('selected'); btn.classList.add('active'); }
  if (!['eraser','fill','eyedropper','select-rect','select-circle','lasso','magic-wand','move','hand','text','gradient'].includes(state.tool)) {
    selectTool('brush');
  }
}

// ============== الألوان ==============
function setColor(hex) {
  state.color = hex;
  const fgEl = document.getElementById('fgColor');
  const hexEl = document.getElementById('hexInput');
  if (fgEl) fgEl.style.background = hex;
  if (hexEl) hexEl.value = hex.replace('#','');
  const rgb = hexToRgb(hex);
  if (rgb) {
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    state.colorH = hsv.h; state.colorS = hsv.s; state.colorV = hsv.v;
    drawColorWheel(); drawColorStrip();
  }
}

function setHexColor(hex) { if (hex.length===6) setColor('#'+hex); }

function swapColors() {
  const fg = state.color; state.color = state.bgColor; state.bgColor = fg;
  const fgEl = document.getElementById('fgColor');
  const bgEl = document.getElementById('bgColorSwatch');
  const hexEl = document.getElementById('hexInput');
  if (fgEl) fgEl.style.background = state.color;
  if (bgEl) bgEl.style.background = state.bgColor;
  if (hexEl) hexEl.value = state.color.replace('#','');
}

function openColorPicker(type) {}

function saveCurrentColor() {
  if (state.savedColors.includes(state.color)) return;
  state.savedColors.unshift(state.color);
  if (state.savedColors.length > 24) state.savedColors.pop();
  renderSavedColors();
}

function renderSavedColors() {
  const el = document.getElementById('savedColorsList'); if (!el) return;
  el.innerHTML = state.savedColors.map(c =>
    `<div class="sc-color" style="background:${c}" onclick="setColor('${c}')" title="${c}"></div>`
  ).join('');
}

// ============== دائرة الألوان ==============
function initColorPicker() {
  drawColorWheel(); drawColorStrip();
  const wheel = document.getElementById('colorWheelCanvas');
  const strip = document.getElementById('colorStrip');
  if (wheel) {
    const pick = e => {
      const r = wheel.getBoundingClientRect();
      pickFromWheel(wheel, e.clientX-r.left, e.clientY-r.top);
    };
    wheel.addEventListener('click', pick);
    wheel.addEventListener('mousemove', e => { if (e.buttons) pick(e); });
  }
  if (strip) {
    const pick = e => {
      const r = strip.getBoundingClientRect();
      pickFromStrip((e.clientX-r.left)/r.width);
    };
    strip.addEventListener('click', pick);
    strip.addEventListener('mousemove', e => { if (e.buttons) pick(e); });
  }
  state.savedColors = ['#FF6B35','#FFD700','#FF4500','#4488FF','#44FF88','#FF4488','#9B59B6','#1ABC9C','#E67E22','#ECF0F1','#2C3E50','#000000','#FFFFFF'];
  renderSavedColors();
}

function drawColorWheel() {
  const canvas = document.getElementById('colorWheelCanvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width/2, cy = canvas.height/2, R = Math.min(cx,cy)-2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let a=0; a<360; a++) {
    const rad = (a-90)*Math.PI/180;
    const g = ctx.createLinearGradient(cx, cy, cx+R*Math.cos(rad), cy+R*Math.sin(rad));
    g.addColorStop(0, `hsla(${a},0%,50%,1)`);
    g.addColorStop(0.5, `hsla(${a},100%,50%,1)`);
    g.addColorStop(1, `hsla(${a},100%,15%,1)`);
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx, cy, R, (a-91)*Math.PI/180, (a-89)*Math.PI/180);
    ctx.fillStyle = g; ctx.fill();
  }

  // تأثير أبيض مركزي
  const wg = ctx.createRadialGradient(cx,cy,0, cx,cy,R*0.35);
  wg.addColorStop(0,'rgba(255,255,255,0.95)'); wg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(cx,cy,R*0.35,0,Math.PI*2); ctx.fillStyle=wg; ctx.fill();

  // مؤشر اللون
  const sa = (state.colorH-90)*Math.PI/180;
  const sd = state.colorS*R*0.85;
  const sx = cx+sd*Math.cos(sa), sy = cy+sd*Math.sin(sa);
  ctx.beginPath(); ctx.arc(sx,sy,7,0,Math.PI*2);
  ctx.strokeStyle='white'; ctx.lineWidth=2.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(sx,sy,5,0,Math.PI*2);
  ctx.fillStyle=state.color; ctx.fill();
}

function drawColorStrip() {
  const canvas = document.getElementById('colorStrip'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0,0,canvas.width,0);
  g.addColorStop(0,'#000000');
  g.addColorStop(0.45,`hsl(${state.colorH},${Math.round(state.colorS*100)}%,45%)`);
  g.addColorStop(1,'#ffffff');
  ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height);
}

function pickFromWheel(canvas, x, y) {
  const cx=canvas.width/2, cy=canvas.height/2, R=Math.min(cx,cy)-2;
  const dx=x-cx, dy=y-cy, dist=Math.hypot(dx,dy);
  if (dist>R) return;
  state.colorH = ((Math.atan2(dy,dx)*180/Math.PI)+90+360)%360;
  state.colorS = Math.min(1, dist/(R*0.85));
  const rgb = hslToRgb(state.colorH/360, state.colorS, 0.5);
  const hex = '#'+[rgb.r,rgb.g,rgb.b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  setColor(hex);
}

function pickFromStrip(t) {
  t = Math.max(0, Math.min(1, t));
  let r,g,b;
  if (t < 0.45) {
    const f = t/0.45;
    const base = hslToRgb(state.colorH/360, state.colorS, 0.45);
    r = Math.round(base.r*f); g = Math.round(base.g*f); b = Math.round(base.b*f);
  } else {
    const f = (t-0.45)/0.55;
    const base = hslToRgb(state.colorH/360, state.colorS, 0.45);
    r = Math.round(base.r+(255-base.r)*f); g = Math.round(base.g+(255-base.g)*f); b = Math.round(base.b+(255-base.b)*f);
  }
  setColor('#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join(''));
}

// ============== لوحة الألوان الكاملة (1000+ لون) ==============
function initColorPalette() {
  const container = document.getElementById('fullPalette'); if (!container) return;
  const colors = generateAllColors();
  container.innerHTML = colors.map(c =>
    `<div class="palette-color" style="background:${c}" onclick="setColor('${c}')" title="${c}"></div>`
  ).join('');
}

function generateAllColors() {
  const set = new Set();

  // طيف كامل
  for (let h=0; h<360; h+=5) {
    for (let s=30; s<=100; s+=20) {
      for (let l=15; l<=85; l+=15) {
        const rgb = hslToRgb(h/360, s/100, l/100);
        set.add('#'+[rgb.r,rgb.g,rgb.b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''));
      }
    }
  }

  // رماديات
  for (let v=0; v<=255; v+=12) { const h=v.toString(16).padStart(2,'0'); set.add('#'+h+h+h); }

  // ألوان البشرة (من فاتح لغامق)
  ['#FFDBB4','#FFD1A0','#FFC890','#F5B78A','#E8A070','#D48B60','#C07550','#A86040',
   '#8B4A30','#6B3020','#4A1E10','#3C1810','#2E1008','#FDE4CC','#F8C9A0','#EDB180',
   '#D4935A','#BB7540','#9A5A28','#7A3E18'].forEach(c=>set.add(c));

  // ألوان خاصة
  ['#FF0000','#FF4500','#FF6347','#FF7F50','#FFA500','#FFD700','#FFFF00',
   '#ADFF2F','#7FFF00','#00FF00','#00FF7F','#00FFFF','#00BFFF','#1E90FF',
   '#0000FF','#8A2BE2','#9400D3','#FF1493','#FF69B4','#DC143C',
   '#8B0000','#800000','#B22222','#CD5C5C','#FA8072','#FFA07A',
   '#006400','#228B22','#32CD32','#90EE90','#98FB98','#00FA9A',
   '#006994','#4169E1','#6495ED','#B0C4DE','#87CEEB','#87CEFA',
   '#4B0082','#6A0DAD','#7B68EE','#9370DB','#BA55D3','#EE82EE',
   '#C71585','#DB7093','#FF6EB4','#FFB6C1','#FFC0CB','#FFD1DC',
   '#800020','#722F37','#A52A2A','#CD853F','#DEB887','#D2B48C',
   '#F5F5DC','#FAEBD7','#FFF8DC','#FFFACD','#FAFAD2','#FFFFE0',
   '#F0FFF0','#F5FFFA','#F0FFFF','#F0F8FF','#F8F8FF','#FFF0F5',
   '#1C1C1C','#2F2F2F','#3C3C3C','#505050','#696969','#808080',
   '#A9A9A9','#C0C0C0','#D3D3D3','#DCDCDC','#F5F5F5','#FFFFFF',
   '#FF6B35','#F7931E','#FFC234','#5D5FEF','#3EC9A7','#FF6584'].forEach(c=>set.add(c));

  return [...set].slice(0, 1200);
}

// ============== الطبقات ==============
function addLayer() {
  const id = state.layers.length;
  const newCanvas = document.createElement('canvas');
  newCanvas.width = state.canvasWidth; newCanvas.height = state.canvasHeight;
  newCanvas.className = 'drawing-canvas'; newCanvas.id = 'layer'+id;
  newCanvas.style.cssText = `position:absolute;top:0;left:0;z-index:${id+10};`;
  document.getElementById('canvasStack').insertBefore(newCanvas, document.getElementById('overlayCanvas'));
  state.layers.push({ id, name:`الطبقة ${id+1}`, canvas:newCanvas, visible:true, locked:false, opacity:1.0, blendMode:'source-over' });
  state.activeLayerIndex = state.layers.length-1;
  document.getElementById('pdLayers').textContent = state.layers.length;
  renderLayersList(); saveHistory();
}

function deleteActiveLayer() {
  if (state.layers.length<=1) { showNotification('لا يمكن حذف الطبقة الأخيرة'); return; }
  state.layers[state.activeLayerIndex].canvas.remove();
  state.layers.splice(state.activeLayerIndex, 1);
  state.activeLayerIndex = Math.max(0, state.activeLayerIndex-1);
  document.getElementById('pdLayers').textContent = state.layers.length;
  renderLayersList(); saveHistory();
}

function mergeAllLayers() {
  const bg = document.getElementById('bgCanvas');
  const ctx = bg.getContext('2d');
  state.layers.forEach(l => {
    if (l.visible) {
      ctx.save(); ctx.globalAlpha = l.opacity;
      ctx.globalCompositeOperation = l.blendMode;
      ctx.drawImage(l.canvas, 0, 0); ctx.restore();
    }
  });
  state.layers.slice(1).forEach(l => l.canvas.getContext('2d').clearRect(0,0,l.canvas.width,l.canvas.height));
  showNotification('تم دمج الطبقات');
}

function renderLayersList() {
  const container = document.getElementById('layersList'); if (!container) return;
  container.innerHTML = '';
  [...state.layers].reverse().forEach((layer, ri) => {
    const idx = state.layers.length-1-ri;
    const item = document.createElement('div');
    item.className = 'layer-item'+(idx===state.activeLayerIndex?' active':'');
    item.onclick = () => setActiveLayer(idx);
    const thumb = document.createElement('canvas');
    thumb.width=32; thumb.height=24;
    const tc = thumb.getContext('2d');
    tc.fillStyle='#ffffff'; tc.fillRect(0,0,32,24);
    tc.drawImage(layer.canvas, 0, 0, 32, 24);
    item.innerHTML = `
      <div class="layer-thumb"></div>
      <span class="layer-name" ondblclick="renameLayer(event,${idx})">${layer.name}</span>
      <div class="layer-controls">
        <button class="layer-ctrl-btn ${layer.visible?'active':''}" onclick="event.stopPropagation();toggleLayerVisibility(${idx})" title="إظهار/إخفاء">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${layer.visible?'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>':'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'}</svg>
        </button>
        <button class="layer-ctrl-btn ${layer.locked?'active':''}" onclick="event.stopPropagation();toggleLayerLock(${idx})" title="قفل">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${layer.locked?'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>':'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'}</svg>
        </button>
      </div>
      <input type="range" class="layer-opacity-mini" min="0" max="100" value="${Math.round(layer.opacity*100)}" 
        onchange="event.stopPropagation();setLayerOpacity(${idx},this.value/100)" title="الشفافية">
    `;
    item.querySelector('.layer-thumb').appendChild(thumb);
    container.appendChild(item);
  });
}

function setActiveLayer(idx) { state.activeLayerIndex=idx; renderLayersList(); }
function toggleLayerVisibility(idx) { state.layers[idx].visible=!state.layers[idx].visible; state.layers[idx].canvas.style.opacity=state.layers[idx].visible?1:0; renderLayersList(); }
function toggleLayerLock(idx) { state.layers[idx].locked=!state.layers[idx].locked; renderLayersList(); }
function setLayerOpacity(idx, op) { state.layers[idx].opacity=op; state.layers[idx].canvas.style.opacity=op; renderLayersList(); }
function renameLayer(e, idx) { e.stopPropagation(); const n=prompt('اسم الطبقة:',state.layers[idx].name); if(n) { state.layers[idx].name=n; renderLayersList(); } }
function setBlendMode(mode) { state.blendMode=mode; if(state.layers[state.activeLayerIndex]) { state.layers[state.activeLayerIndex].blendMode=mode; state.layers[state.activeLayerIndex].canvas.style.mixBlendMode=mode; } }

// ============== الخصائص ==============
function updateBrushSize(v) { state.size=parseInt(v); document.getElementById('brushSizeVal').textContent=v; }
function updateOpacity(v) { state.opacity=parseInt(v)/100; document.getElementById('opacityVal').textContent=v+'%'; }
function updateSmoothing(v) { state.smoothing=parseInt(v); document.getElementById('smoothingVal').textContent=v+'%'; }

// ============== مرجع الرسم ==============
function loadReferenceImage(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      state.refImage = img;
      const old = document.getElementById('refCanvas');
      if (old) old.remove();
      const rc = document.createElement('canvas');
      rc.id='refCanvas'; rc.width=state.canvasWidth; rc.height=state.canvasHeight;
      rc.style.cssText=`position:absolute;top:0;left:0;z-index:5;opacity:${state.refOpacity};pointer-events:none;`;
      document.getElementById('canvasStack').appendChild(rc);
      rc.getContext('2d').drawImage(img, 0, 0, state.canvasWidth, state.canvasHeight);
      const prev = document.getElementById('refPreview');
      prev.style.backgroundImage = `url(${e.target.result})`;
      prev.style.backgroundSize = 'cover';
      document.getElementById('refControls').style.display='block';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateRefOpacity(v) {
  state.refOpacity=v/100;
  document.getElementById('refOpacityVal').textContent=v+'%';
  const rc=document.getElementById('refCanvas');
  if (rc) rc.style.opacity=state.refOpacity;
}

function toggleRefLock() { state.refLocked=!state.refLocked; const btn=document.getElementById('refLockBtn'); if(btn) btn.style.background=state.refLocked?'rgba(255,107,53,0.2)':''; }

function clearReference() {
  const rc=document.getElementById('refCanvas'); if(rc) rc.remove();
  state.refImage=null;
  const prev=document.getElementById('refPreview');
  prev.style.backgroundImage='none';
  prev.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>اضغط لرفع صورة مرجعية</span><input type="file" id="refImageInput" accept="image/*" onchange="loadReferenceImage(event)">`;
  document.getElementById('refControls').style.display='none';
}

// ============== الرسوم المتحركة ==============
function initTimeline() {
  state.frames=[{ id:0, duration:83, data:{} }];
  renderTimeline(); updateFrameCounter();
}

function captureFrame() {
  const data={};
  state.layers.forEach(l => { data[l.id]=l.canvas.getContext('2d').getImageData(0,0,l.canvas.width,l.canvas.height); });
  return data;
}

function saveCurrentFrame() { if(state.frames[state.currentFrame]) state.frames[state.currentFrame].data=captureFrame(); }

function restoreFrame(frame) {
  state.layers.forEach(l => {
    const ctx=l.canvas.getContext('2d');
    ctx.clearRect(0,0,l.canvas.width,l.canvas.height);
    if(frame.data&&frame.data[l.id]) ctx.putImageData(frame.data[l.id],0,0);
  });
}

function addFrame() {
  saveCurrentFrame();
  state.frames.push({ id:state.frames.length, duration:parseInt(document.getElementById('frameDuration').value)||83, data:{} });
  state.currentFrame=state.frames.length-1;
  state.layers.forEach(l=>l.canvas.getContext('2d').clearRect(0,0,l.canvas.width,l.canvas.height));
  renderTimeline(); updateFrameCounter();
}

function duplicateFrame() {
  saveCurrentFrame();
  const copy = { id:state.frames.length, duration:state.frames[state.currentFrame].duration, data:captureFrame() };
  state.frames.splice(state.currentFrame+1,0,copy);
  state.currentFrame++;
  restoreFrame(state.frames[state.currentFrame]);
  renderTimeline(); updateFrameCounter();
}

function deleteFrame() {
  if (state.frames.length<=1) return;
  state.frames.splice(state.currentFrame,1);
  state.currentFrame=Math.max(0,state.currentFrame-1);
  restoreFrame(state.frames[state.currentFrame]||{data:{}});
  renderTimeline(); updateFrameCounter();
}

function goToFrame(idx) {
  saveCurrentFrame(); state.currentFrame=idx;
  restoreFrame(state.frames[idx]||{data:{}}); renderTimeline(); updateFrameCounter();
}

function renderTimeline() {
  const track=document.getElementById('framesTrack'); if(!track) return;
  track.innerHTML='';
  state.frames.forEach((frame,i) => {
    const wrap=document.createElement('div');
    wrap.className='frame-thumb'+(i===state.currentFrame?' active':'');
    wrap.onclick=()=>goToFrame(i);
    const c=document.createElement('canvas'); c.width=60; c.height=45;
    const tc=c.getContext('2d');
    tc.fillStyle=state.bgColor==='transparent'?'#ffffff':state.bgColor; tc.fillRect(0,0,60,45);
    if(frame.data&&Object.keys(frame.data).length>0){
      state.layers.forEach(l=>{
        if(frame.data[l.id]){
          const tmp=document.createElement('canvas'); tmp.width=l.canvas.width; tmp.height=l.canvas.height;
          tmp.getContext('2d').putImageData(frame.data[l.id],0,0);
          tc.drawImage(tmp,0,0,60,45);
        }
      });
    } else if(i===state.currentFrame){ state.layers.forEach(l=>tc.drawImage(l.canvas,0,0,60,45)); }
    const num=document.createElement('div'); num.className='frame-num'; num.textContent=i+1;
    wrap.appendChild(c); wrap.appendChild(num); track.appendChild(wrap);
  });
}

function updateFrameThumbnail() {
  if(state.projectType!=='animated') return;
  const thumbs=document.querySelectorAll('.frame-thumb');
  const active=thumbs[state.currentFrame]; if(!active) return;
  const c=active.querySelector('canvas'); if(!c) return;
  const tc=c.getContext('2d');
  tc.clearRect(0,0,60,45);
  tc.fillStyle=state.bgColor==='transparent'?'#ffffff':state.bgColor; tc.fillRect(0,0,60,45);
  state.layers.forEach(l=>tc.drawImage(l.canvas,0,0,60,45));
}

function updateFrameCounter() { const el=document.getElementById('frameCounter'); if(el) el.textContent=`${state.currentFrame+1} / ${state.frames.length}`; }
function updateFPS(v) { state.fps=Math.max(1,Math.min(60,parseInt(v))); }
function updateFrameDuration(v) { if(state.frames[state.currentFrame]) state.frames[state.currentFrame].duration=parseInt(v); }

function togglePlayAnimation() {
  state.isPlaying=!state.isPlaying;
  document.getElementById('playIcon').style.display=state.isPlaying?'none':'block';
  document.getElementById('pauseIcon').style.display=state.isPlaying?'block':'none';
  if(state.isPlaying) { saveCurrentFrame(); playNext(); }
  else clearTimeout(state.animTimer);
}

function playNext() {
  if(!state.isPlaying) return;
  state.currentFrame=(state.currentFrame+1)%state.frames.length;
  restoreFrame(state.frames[state.currentFrame]||{data:{}});
  renderTimeline(); updateFrameCounter();
  state.animTimer=setTimeout(playNext, state.frames[state.currentFrame]?.duration||Math.round(1000/state.fps));
}

// ============== مشاريع جاهزة ==============
function openSampleProjects() {
  document.getElementById('sampleProjectsPanel').style.display='flex';
  setTimeout(()=>{ const c=document.getElementById('sampleFireCanvas'); if(c) drawFireOnCtx(c.getContext('2d'),0,c.width,c.height); },100);
}

function loadSampleProject(name) {
  if(name!=='fire') return;
  closePanel('sampleProjectsPanel');
  state.layers.forEach(l=>l.canvas.getContext('2d').clearRect(0,0,l.canvas.width,l.canvas.height));
  state.bgColor='#ffffff'; drawBackground();
  state.frames=[];
  state.projectType='animated';
  document.getElementById('timelineBar').style.display='flex';
  for(let i=0;i<8;i++){
    const ctx=state.layers[0].canvas.getContext('2d');
    ctx.clearRect(0,0,state.canvasWidth,state.canvasHeight);
    drawFireOnCtx(ctx, i, state.canvasWidth, state.canvasHeight);
    state.frames.push({ id:i, duration:100, data:captureFrame() });
  }
  state.currentFrame=0;
  restoreFrame(state.frames[0]);
  renderTimeline(); updateFrameCounter();
  showNotification('تم تحميل مشروع النار المتحركة');
}

function drawFireOnCtx(ctx, frameIdx, w, h) {
  const cx=w/2, baseY=h*0.75;
  const rng=n=>((Math.sin(n*127.1+frameIdx*73)*43758.5453)%1+1)/2;
  const layers=[
    {sc:1.3,col:'#FF2200',al:0.7},{sc:1.1,col:'#FF4400',al:0.8},
    {sc:0.9,col:'#FF6600',al:0.85},{sc:0.7,col:'#FF8800',al:0.9},
    {sc:0.5,col:'#FFAA00',al:0.95},{sc:0.35,col:'#FFCC00',al:1.0},
    {sc:0.2,col:'#FFEE44',al:1.0}
  ];
  layers.forEach((layer,li)=>{
    const fh=h*0.52*layer.sc, fw=w*0.22*layer.sc;
    const wob=(rng(li*7+1)*2-1)*w*0.05;
    const tip=baseY-fh*(0.9+rng(li*3)*0.2);
    ctx.save(); ctx.globalAlpha=layer.al;
    const g=ctx.createRadialGradient(cx+wob*0.3, baseY-fh*0.4, 0, cx, baseY, fw*1.2);
    g.addColorStop(0, layer.col); g.addColorStop(0.5, layer.col+'99'); g.addColorStop(1,'transparent');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.moveTo(cx-fw, baseY);
    const steps=10;
    for(let i=0;i<=steps;i++){
      const t=i/steps;
      const x=cx-fw+fw*2*t;
      const yw=baseY-(fh*(1-Math.pow(Math.abs(t-0.5)*2,1.8)))+((rng(li*11+i)*2-1)*fh*0.1);
      ctx.lineTo(x+(rng(li*5+i)*2-1)*fw*0.12, Math.min(baseY,yw));
    }
    ctx.lineTo(cx+fw, baseY); ctx.closePath(); ctx.fill(); ctx.restore();
  });
  // شعلة مركزية مضيئة
  const cg=ctx.createRadialGradient(cx,baseY-h*0.18,0, cx,baseY,w*0.08);
  cg.addColorStop(0,'#FFFFFF'); cg.addColorStop(0.25,'#FFFF99'); cg.addColorStop(0.6,'#FFAA00'); cg.addColorStop(1,'transparent');
  ctx.save(); ctx.globalAlpha=0.95; ctx.fillStyle=cg;
  ctx.beginPath();
  const off=(rng(99)*2-1)*w*0.025;
  ctx.moveTo(cx-w*0.08,baseY);
  ctx.quadraticCurveTo(cx-w*0.04+off*0.3, baseY-h*0.28, cx+off, baseY-h*0.45-rng(77)*h*0.06);
  ctx.quadraticCurveTo(cx+w*0.04+off*0.3, baseY-h*0.28, cx+w*0.08, baseY);
  ctx.closePath(); ctx.fill(); ctx.restore();
}

// ============== التصدير ==============
function openExportPanel() {
  document.getElementById('exportPanel').style.display='flex';
  if(state.projectType==='animated'){
    document.getElementById('animExportLabel').style.display='block';
    document.getElementById('animExportGrid').style.display='grid';
  }
  const flat=getFlatCanvas();
  const prev=document.getElementById('exportPreview');
  prev.innerHTML='';
  const img=document.createElement('img');
  img.src=flat.toDataURL(); img.style.cssText='max-width:100%;max-height:100%;object-fit:contain;';
  prev.appendChild(img);
}

function getFlatCanvas() {
  const flat=document.createElement('canvas'); flat.width=state.canvasWidth; flat.height=state.canvasHeight;
  const ctx=flat.getContext('2d');
  if(state.bgColor!=='transparent'){ ctx.fillStyle=state.bgColor; ctx.fillRect(0,0,flat.width,flat.height); }
  state.layers.forEach(l=>{ if(l.visible){ ctx.save(); ctx.globalAlpha=l.opacity; ctx.globalCompositeOperation=l.blendMode; ctx.drawImage(l.canvas,0,0); ctx.restore(); } });
  return flat;
}

function exportAs(format) {
  const flat=getFlatCanvas();
  const quality=parseInt(document.getElementById('jpegQuality')?.value||90)/100;
  const link=document.createElement('a');
  if(format==='png') { link.href=flat.toDataURL('image/png'); link.download='safwan-studio.png'; }
  else if(format==='jpeg') { link.href=flat.toDataURL('image/jpeg',quality); link.download='safwan-studio.jpg'; }
  else if(format==='webp') { link.href=flat.toDataURL('image/webp',0.92); link.download='safwan-studio.webp'; }
  link.click(); closePanel('exportPanel');
}

function exportAnimation(format) {
  if(state.projectType!=='animated'||state.frames.length===0) return;
  saveCurrentFrame();
  showNotification('جارٍ التصدير كإطارات منفصلة...');
  state.frames.forEach((frame,i)=>{
    const tmp=document.createElement('canvas'); tmp.width=state.canvasWidth; tmp.height=state.canvasHeight;
    const ctx=tmp.getContext('2d');
    if(state.bgColor!=='transparent'){ ctx.fillStyle=state.bgColor; ctx.fillRect(0,0,tmp.width,tmp.height); }
    state.layers.forEach(l=>{
      if(frame.data&&frame.data[l.id]){
        const t2=document.createElement('canvas'); t2.width=l.canvas.width; t2.height=l.canvas.height;
        t2.getContext('2d').putImageData(frame.data[l.id],0,0); ctx.drawImage(t2,0,0);
      }
    });
    setTimeout(()=>{
      const link=document.createElement('a');
      link.href=tmp.toDataURL('image/png');
      link.download=`safwan-frame-${String(i+1).padStart(3,'0')}.png`;
      link.click();
    }, i*100);
  });
}

// ============== حفظ المشروع ==============
function saveProject() {
  if(state.projectType==='animated') saveCurrentFrame();
  const flat=getFlatCanvas();
  const projectData={
    id: state.projectId||Date.now(),
    title: document.getElementById('projectTitleDisplay')?.textContent||'مشروع جديد',
    type: state.projectType,
    bgColor: state.bgColor,
    width: state.canvasWidth, height: state.canvasHeight,
    date: new Date().toISOString(),
    thumbnail: flat.toDataURL('image/jpeg',0.3),
    layerData: state.layers.map(l=>({ id:l.id, name:l.name, visible:l.visible, locked:l.locked, opacity:l.opacity, imageData:l.canvas.toDataURL() }))
  };
  state.projectId=projectData.id;
  try {
    const projects=JSON.parse(localStorage.getItem('safwanProjects')||'[]');
    const idx=projects.findIndex(p=>p.id===projectData.id);
    if(idx>=0) projects[idx]=projectData; else projects.unshift(projectData);
    localStorage.setItem('safwanProjects', JSON.stringify(projects.slice(0,10)));
    showNotification('تم الحفظ بنجاح');
  } catch(e) { showNotification('فشل الحفظ — المساحة ممتلئة'); }
}

// ============== واجهة المستخدم ==============
function toggleSection(id) {
  const el=document.getElementById(id); if(!el) return;
  const hidden=el.style.display==='none'||el.style.display==='';
  el.style.display=hidden?(id==='fullPalette'?'grid':id==='proBrushes'?'flex':'flex'):'none';
  const hdr=el.previousElementSibling; if(hdr) hdr.classList.toggle('open',hidden);
}

function toggleTheme() {
  state.isDark=!state.isDark;
  document.body.classList.toggle('light-theme',!state.isDark);
  document.getElementById('moonIcon').style.display=state.isDark?'block':'none';
  document.getElementById('sunIcon').style.display=state.isDark?'none':'block';
  const dt=document.getElementById('darkModeToggle'); if(dt) dt.checked=!state.isDark;
  localStorage.setItem('theme',state.isDark?'dark':'light');
}

function toggleGrid() {
  state.gridVisible=!state.gridVisible;
  let g=document.getElementById('gridOverlay');
  if(state.gridVisible){
    if(!g){ g=document.createElement('div'); g.id='gridOverlay';
      g.style.cssText=`position:absolute;inset:0;z-index:400;pointer-events:none;
        background-image:linear-gradient(rgba(128,128,128,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(128,128,128,0.2) 1px,transparent 1px);
        background-size:20px 20px;`;
      document.getElementById('canvasWrapper')?.appendChild(g); }
    g.style.display='block';
  } else if(g) g.style.display='none';
}

function toggleRuler() {}
function toggleThumbnail() {}
function togglePressure() { state.pressureEnabled=!state.pressureEnabled; }
function openSettings() { document.getElementById('settingsPanel').style.display='flex'; }
function closePanel(id) { const el=document.getElementById(id); if(el) el.style.display='none'; }

function goHome() {
  if(confirm('العودة للصفحة الرئيسية؟ سيتم حفظ مشروعك تلقائياً.')){ saveProject(); window.location.href='index.html'; }
}

function editTitle() {
  const el=document.getElementById('projectTitleDisplay');
  const n=prompt('اسم المشروع:',el?.textContent||'');
  if(n&&el) el.textContent=n;
}

function updateUI() {
  document.getElementById('pdSize').textContent=`${state.canvasWidth} × ${state.canvasHeight}`;
  document.getElementById('pdLayers').textContent=state.layers.length;
  document.getElementById('pdType').textContent=state.projectType==='animated'?'متحرك':'ثابت';
}

function showNotification(msg) {
  const n=document.createElement('div');
  n.style.cssText=`position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:linear-gradient(135deg,#FF6B35,#FFD700);color:white;
    padding:10px 28px;border-radius:30px;font-weight:700;font-size:13px;
    z-index:9999;box-shadow:0 4px 20px rgba(255,107,53,0.45);
    font-family:Tajawal,sans-serif;pointer-events:none;
    animation:fadeInUp 0.3s ease;`;
  n.textContent=msg; document.body.appendChild(n);
  setTimeout(()=>n.remove(), 2600);
}

// ============== اختصارات لوحة المفاتيح ==============
function handleKeyboard(e) {
  const ctrl=e.ctrlKey||e.metaKey;
  if(ctrl&&e.key==='z'){ e.preventDefault(); undoAction(); return; }
  if(ctrl&&(e.key==='y'||e.key==='Y')){ e.preventDefault(); redoAction(); return; }
  if(ctrl&&e.key==='s'){ e.preventDefault(); saveProject(); return; }
  if(ctrl&&e.key==='e'){ e.preventDefault(); openExportPanel(); return; }
  if(ctrl&&e.key==='+'){ e.preventDefault(); zoomIn(); return; }
  if(ctrl&&e.key==='-'){ e.preventDefault(); zoomOut(); return; }
  if(e.key==='0'&&ctrl){ e.preventDefault(); resetZoom(); return; }
  if(e.key==='Delete'||e.key==='Backspace'){
    if(document.activeElement===document.body){
      const ctx=getActiveCtx(); if(ctx) ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height); saveHistory();
    }
    return;
  }
  // اختصارات الأدوات
  if(!ctrl&&!e.shiftKey&&!e.altKey){
    const keys={'b':'brush','e':'eraser','f':'fill','i':'eyedropper','m':'move','h':'hand','t':'text','r':'rect','c':'circle','l':'line','v':'move'};
    if(keys[e.key]) selectTool(keys[e.key]);
  }
}

// ============== أدوات المساعدة ==============
function hexToRgb(hex) {
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r?{r:parseInt(r[1],16),g:parseInt(r[2],16),b:parseInt(r[3],16)}:null;
}

function rgbToHsv(r,g,b) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  let h=0;
  if(d!==0){
    if(max===r) h=((g-b)/d)%6;
    else if(max===g) h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h=Math.round(h*60); if(h<0) h+=360;
  }
  return { h, s:max===0?0:d/max, v:max };
}

function hslToRgb(h,s,l) {
  let r,g,b;
  if(s===0){ r=g=b=l; }
  else {
    const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
    const hue2rgb=(p,q,t)=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  return { r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) };
}

// CSS للإشعار
const style = document.createElement('style');
style.textContent = `@keyframes fadeInUp { from { opacity:0; transform:translate(-50%,20px); } to { opacity:1; transform:translate(-50%,0); } }`;
document.head.appendChild(style);
