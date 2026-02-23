// ==========================================
// SAFWAN STUDIO v2 — COMPLETE ENGINE
// ==========================================

const PRESETS = [
  { name:'TikTok', w:1080, h:1920, icon:'📱' },
  { name:'YouTube', w:1920, h:1080, icon:'▶' },
  { name:'Facebook', w:1200, h:628, icon:'f' },
  { name:'Twitter/X', w:1200, h:675, icon:'𝕏' },
  { name:'Instagram', w:1080, h:1080, icon:'▣' },
  { name:'Story', w:1080, h:1920, icon:'◎' },
  { name:'Snapchat', w:1080, h:1920, icon:'👻' },
  { name:'Pinterest', w:1000, h:1500, icon:'P' },
  { name:'LinkedIn', w:1200, h:627, icon:'in' },
  { name:'A4 طباعة', w:2480, h:3508, icon:'📄' },
  { name:'A3', w:3508, h:4961, icon:'📋' },
  { name:'مربع', w:1080, h:1080, icon:'⬜' },
  { name:'بانوراما', w:2560, h:1440, icon:'🖼' },
  { name:'هاتف', w:1080, h:1920, icon:'📱' },
  { name:'4K', w:3840, h:2160, icon:'🎬' },
  { name:'HD 720p', w:1280, h:720, icon:'🎥' },
  { name:'ويب', w:1440, h:900, icon:'🌐' },
  { name:'بانر', w:728, h:90, icon:'📢' },
];

// ===== GLOBALS =====
let isDark = true;
let mode = 'static';
let currentTool = 'brush';
let currentColor = '#000000';
let brushSize = 12, brushOpacity = 100, brushFlow = 80;
let brushSmooth = 50, brushHard = 85, brushSpacing = 5, brushScatter = 0;
let brushType = 'round';
let safwanBrush = 'ink';
let zoom = 1;
let canvasW = 1920, canvasH = 1080;
let showGrid = false;
let isDrawing = false;
let lastX = 0, lastY = 0, smoothX = 0, smoothY = 0;
let historyStack = [], histIdx = -1;
const MAX_HIST = 60;
let layers = [], activeLayer = 0;
let refOpacity = 0.5, refLocked = false;
let isPlaying = false, playInterval = null, currentFrame = 0, fps = 12;
let frames = [];
let projects = [];
let isSelecting = false, selStartX = 0, selStartY = 0;
let drawCanvas, drawCtx;
let previewSnapshot = null;
let symmetryMode = false;
let gradientStart = null;

// ===== INIT =====
window.addEventListener('load', () => {
  const params = new URLSearchParams(location.search);
  mode = params.get('mode') || 'static';
  setupMode();
  initCanvas();
  generateColorSwatches();
  buildPresets();
  renderLayers();
  setupKeyboard();
  loadProjects();
  toast('مرحباً بك في صفوان ستوديو!');
});

function setupMode() {
  const badge = document.getElementById('modeBadge');
  const animPanel = document.getElementById('animPanel');
  const statusMode = document.getElementById('statusMode');
  const exportGifBtn = document.getElementById('exportGifBtn');
  if (mode === 'animation') {
    if (badge) { badge.textContent = 'رسم متحرك'; badge.style.background='rgba(78,205,196,0.15)'; badge.style.color='var(--accent2)'; badge.style.borderColor='rgba(78,205,196,0.3)'; }
    if (animPanel) animPanel.style.display = 'flex';
    if (statusMode) statusMode.textContent = 'رسم متحرك';
    if (exportGifBtn) exportGifBtn.style.display = 'block';
    if (frames.length === 0) frames = [null];
    renderAnimTimeline();
  } else {
    if (badge) { badge.textContent = 'رسم ثابت'; badge.style.background='rgba(255,107,107,0.15)'; badge.style.color='var(--accent1)'; badge.style.borderColor='rgba(255,107,107,0.3)'; }
    if (animPanel) animPanel.style.display = 'none';
    if (statusMode) statusMode.textContent = 'رسم ثابت';
  }
}

function initCanvas() {
  drawCanvas = document.getElementById('mainCanvas');
  drawCtx = drawCanvas.getContext('2d', { willReadFrequently: true });
  drawCanvas.width = canvasW;
  drawCanvas.height = canvasH;
  drawCtx.fillStyle = '#ffffff';
  drawCtx.fillRect(0, 0, canvasW, canvasH);
  layers = [{ id: 1, name: 'طبقة 1', visible: true, locked: false, opacity: 100, blend: 'source-over' }];
  renderLayers();
  zoomFit();
  saveHistory();
  setupDrawEvents();
  document.getElementById('canvasSizeDisplay').textContent = canvasW + '×' + canvasH;
}

// ===== DRAW EVENTS =====
function setupDrawEvents() {
  drawCanvas.addEventListener('mousedown', onStart);
  drawCanvas.addEventListener('mousemove', onMove);
  drawCanvas.addEventListener('mouseup', onEnd);
  drawCanvas.addEventListener('mouseleave', onEnd);
  drawCanvas.addEventListener('mousemove', e => {
    const { x, y } = getCoords(e);
    const pos = document.getElementById('cursorPos');
    if (pos) pos.textContent = Math.round(x) + ', ' + Math.round(y);
  });
  drawCanvas.addEventListener('touchstart', e => { e.preventDefault(); onStart(e.touches[0]); }, { passive: false });
  drawCanvas.addEventListener('touchmove', e => { e.preventDefault(); onMove(e.touches[0]); }, { passive: false });
  drawCanvas.addEventListener('touchend', onEnd);
  document.getElementById('canvasArea').addEventListener('wheel', e => {
    e.preventDefault();
    e.deltaY < 0 ? zoomIn() : zoomOut();
  }, { passive: false });
}

function getCoords(e) {
  const rect = drawCanvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvasW / rect.width),
    y: (e.clientY - rect.top) * (canvasH / rect.height)
  };
}

function onStart(e) {
  if (e.button !== undefined && e.button !== 0) return;
  isDrawing = true;
  const { x, y } = getCoords(e);
  lastX = smoothX = x; lastY = smoothY = y;
  previewSnapshot = null;

  if (currentTool === 'fill') { floodFill(Math.round(x), Math.round(y)); isDrawing = false; return; }
  if (currentTool === 'eyedropper') { pickColor(x, y); isDrawing = false; return; }
  if (currentTool === 'text') { addText(x, y); isDrawing = false; return; }
  if (currentTool === 'zoom-tool') { zoomIn(); isDrawing = false; return; }
  if (currentTool === 'pan') { drawCanvas.style.cursor = 'grabbing'; return; }
  if (['rect-select','ellipse-select','lasso','line','rect','ellipse','star','polygon','arrow','bezier'].includes(currentTool)) {
    isSelecting = true; selStartX = x; selStartY = y;
    previewSnapshot = drawCtx.getImageData(0, 0, canvasW, canvasH);
    return;
  }
  if (currentTool === 'gradient') { gradientStart = { x, y }; return; }
  if (currentTool === 'crop') { isSelecting = true; selStartX = x; selStartY = y; previewSnapshot = drawCtx.getImageData(0,0,canvasW,canvasH); return; }
}

function onMove(e) {
  if (!isDrawing) return;
  const { x, y } = getCoords(e);
  const sm = brushSmooth / 100;
  smoothX = smoothX * sm + x * (1 - sm);
  smoothY = smoothY * sm + y * (1 - sm);

  if (isSelecting || ['line','rect','ellipse','star','polygon','arrow','bezier'].includes(currentTool)) {
    drawShapePreview(currentTool, selStartX, selStartY, smoothX, smoothY);
    lastX = smoothX; lastY = smoothY; return;
  }

  switch (currentTool) {
    case 'brush': case 'pen': case 'marker': case 'watercolor': case 'calligraphy':
      drawStroke(lastX, lastY, smoothX, smoothY); break;
    case 'pencil': drawPencil(lastX, lastY, smoothX, smoothY); break;
    case 'airbrush': drawAirbrush(smoothX, smoothY); break;
    case 'eraser': drawEraser(lastX, lastY, smoothX, smoothY); break;
    case 'smudge': drawSmudge(smoothX, smoothY); break;
    case 'blur': drawBlurTool(smoothX, smoothY); break;
    case 'dodge': drawDodge(smoothX, smoothY); break;
    case 'burn': drawBurn(smoothX, smoothY); break;
    case 'sharpen': drawSharpen(smoothX, smoothY); break;
    case 'symmetry': drawStroke(lastX, lastY, smoothX, smoothY); drawMirror(lastX, lastY, smoothX, smoothY); break;
    case 'ruler-tool': drawShapePreview('line', lastX, lastY, smoothX, smoothY); break;
  }
  lastX = smoothX; lastY = smoothY;
}

function onEnd(e) {
  if (!isDrawing) return;
  isDrawing = false;
  isSelecting = false;

  // Finalize shape tools
  const shapeTools = ['line','rect','ellipse','star','polygon','arrow','bezier'];
  if (shapeTools.includes(currentTool) && previewSnapshot) {
    const { x, y } = getCoords(e);
    drawCtx.putImageData(previewSnapshot, 0, 0);
    drawShapeFinal(currentTool, selStartX, selStartY, x, y);
  }

  if (currentTool === 'gradient' && gradientStart) {
    const { x, y } = getCoords(e);
    applyGradient(gradientStart.x, gradientStart.y, x, y);
    gradientStart = null;
  }

  if (currentTool === 'pan') drawCanvas.style.cursor = 'grab';
  previewSnapshot = null;
  saveHistory();
  if (mode === 'animation') saveCurrentFrame();
}

// ===== DRAW FUNCTIONS =====
function applyCtxSettings(alpha) {
  drawCtx.globalAlpha = (alpha !== undefined ? alpha : brushOpacity / 100);
  drawCtx.lineCap = (brushType === 'square') ? 'square' : 'round';
  drawCtx.lineJoin = 'round';
  drawCtx.lineWidth = brushSize;
  drawCtx.strokeStyle = currentColor;
  drawCtx.fillStyle = currentColor;
  drawCtx.globalCompositeOperation = 'source-over';
}

function drawStroke(x1, y1, x2, y2) {
  const ctx = drawCtx;
  ctx.save();
  if (brushType === 'soft' || safwanBrush === 'water') {
    const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / (brushSize * 0.15)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, brushSize / 2);
      grad.addColorStop(0, hexToRgba(currentColor, (brushFlow / 100) * 0.2));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = brushOpacity / 100;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (brushType === 'spray') {
    ctx.globalAlpha = (brushOpacity / 100) * (brushFlow / 100) * 0.3;
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * brushSize / 2;
      ctx.fillStyle = currentColor;
      ctx.beginPath();
      ctx.arc(x2 + Math.cos(a) * r, y2 + Math.sin(a) * r, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (safwanBrush === 'paint') {
    ctx.lineWidth = brushSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = hexToRgba(currentColor, brushFlow / 100 * 0.85);
    ctx.globalAlpha = brushOpacity / 100;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    for (let i = 0; i < 2; i++) {
      ctx.globalAlpha = (brushOpacity / 100) * 0.12;
      ctx.lineWidth = brushSize * 0.4;
      const ox = (Math.random() - 0.5) * brushSize * 0.5, oy = (Math.random() - 0.5) * brushSize * 0.5;
      ctx.beginPath(); ctx.moveTo(x1 + ox, y1 + oy); ctx.lineTo(x2 + ox, y2 + oy); ctx.stroke();
    }
  } else if (safwanBrush === 'charcoal') {
    ctx.globalAlpha = (brushOpacity / 100) * 0.35;
    for (let i = 0; i < 5; i++) {
      const ox = (Math.random() - 0.5) * brushSize * 0.7, oy = (Math.random() - 0.5) * brushSize * 0.3;
      ctx.lineWidth = brushSize * (0.3 + Math.random() * 0.4);
      ctx.strokeStyle = currentColor;
      ctx.beginPath(); ctx.moveTo(x1 + ox, y1 + oy); ctx.lineTo(x2 + ox, y2 + oy); ctx.stroke();
    }
  } else if (safwanBrush === 'ink') {
    const speed = Math.hypot(x2 - x1, y2 - y1);
    const w = Math.max(0.5, brushSize - speed * 0.03);
    ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = currentColor; ctx.globalAlpha = brushOpacity / 100;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  } else if (brushType === 'flat') {
    ctx.save(); ctx.translate(x2, y2); ctx.rotate(Math.atan2(y2-y1, x2-x1));
    ctx.fillStyle = hexToRgba(currentColor, brushFlow/100); ctx.globalAlpha = brushOpacity/100;
    ctx.fillRect(-Math.hypot(x2-x1,y2-y1)/2, -brushSize/4, Math.hypot(x2-x1,y2-y1), brushSize/2);
    ctx.restore();
  } else {
    ctx.lineWidth = brushSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = hexToRgba(currentColor, brushFlow / 100);
    ctx.globalAlpha = brushOpacity / 100;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  if (brushScatter > 0) {
    ctx.globalAlpha = (brushOpacity/100) * 0.4;
    ctx.fillStyle = currentColor;
    for (let i = 0; i < brushScatter/10; i++) {
      const ox = (Math.random()-0.5)*brushSize*2, oy = (Math.random()-0.5)*brushSize*2;
      ctx.beginPath(); ctx.arc(x2+ox, y2+oy, Math.random()*2, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawPencil(x1, y1, x2, y2) {
  const ctx = drawCtx;
  ctx.save();
  const steps = Math.max(1, Math.ceil(Math.hypot(x2-x1, y2-y1)));
  for (let i = 0; i < steps; i++) {
    const t = i/steps, px = x1+(x2-x1)*t, py = y1+(y2-y1)*t;
    const ox = (Math.random()-0.5)*1.2, oy = (Math.random()-0.5)*1.2;
    ctx.globalAlpha = (brushOpacity/100)*0.65*(0.5+Math.random()*0.5);
    ctx.fillStyle = currentColor;
    ctx.beginPath(); ctx.arc(px+ox, py+oy, Math.max(0.5, brushSize/4), 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawAirbrush(x, y) {
  const ctx = drawCtx;
  ctx.save();
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.5) * brushSize;
    ctx.globalAlpha = (brushOpacity/100)*(brushFlow/100)*0.06;
    ctx.fillStyle = currentColor;
    ctx.beginPath(); ctx.arc(x + Math.cos(a)*r, y + Math.sin(a)*r, 0.8, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawEraser(x1, y1, x2, y2) {
  const ctx = drawCtx;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = brushSize * 2;
  ctx.lineCap = brushType === 'square' ? 'square' : 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,1)';
  ctx.globalAlpha = brushOpacity / 100;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
}

function drawSmudge(x, y) {
  const size = Math.round(brushSize * 1.5);
  const sx = Math.max(0, Math.round(x) - size), sy = Math.max(0, Math.round(y) - size);
  const sw = Math.min(size*2, canvasW-sx), sh = Math.min(size*2, canvasH-sy);
  if (sw < 2 || sh < 2) return;
  const img = drawCtx.getImageData(sx, sy, sw, sh);
  drawCtx.putImageData(boxBlur(img, 2), sx, sy);
}

function drawBlurTool(x, y) {
  const size = Math.round(brushSize * 2);
  const sx = Math.max(0, Math.round(x)-size), sy = Math.max(0, Math.round(y)-size);
  const sw = Math.min(size*2, canvasW-sx), sh = Math.min(size*2, canvasH-sy);
  if (sw < 2 || sh < 2) return;
  const img = drawCtx.getImageData(sx, sy, sw, sh);
  drawCtx.putImageData(boxBlur(img, 4), sx, sy);
}

function drawDodge(x, y) {
  const size = Math.round(brushSize);
  const sx = Math.max(0, Math.round(x)-size), sy = Math.max(0, Math.round(y)-size);
  const sw = Math.min(size*2, canvasW-sx), sh = Math.min(size*2, canvasH-sy);
  if (sw < 2 || sh < 2) return;
  const img = drawCtx.getImageData(sx, sy, sw, sh);
  const d = img.data, str = (brushOpacity/100)*0.1;
  for (let i = 0; i < d.length; i+=4) {
    d[i] = Math.min(255, d[i]+(255-d[i])*str);
    d[i+1] = Math.min(255, d[i+1]+(255-d[i+1])*str);
    d[i+2] = Math.min(255, d[i+2]+(255-d[i+2])*str);
  }
  drawCtx.putImageData(img, sx, sy);
}

function drawBurn(x, y) {
  const size = Math.round(brushSize);
  const sx = Math.max(0, Math.round(x)-size), sy = Math.max(0, Math.round(y)-size);
  const sw = Math.min(size*2, canvasW-sx), sh = Math.min(size*2, canvasH-sy);
  if (sw < 2 || sh < 2) return;
  const img = drawCtx.getImageData(sx, sy, sw, sh);
  const d = img.data, str = (brushOpacity/100)*0.1;
  for (let i = 0; i < d.length; i+=4) {
    d[i] = Math.max(0, d[i]-d[i]*str);
    d[i+1] = Math.max(0, d[i+1]-d[i+1]*str);
    d[i+2] = Math.max(0, d[i+2]-d[i+2]*str);
  }
  drawCtx.putImageData(img, sx, sy);
}

function drawSharpen(x, y) {
  const size = Math.round(brushSize);
  const sx = Math.max(0, Math.round(x)-size), sy = Math.max(0, Math.round(y)-size);
  const sw = Math.min(size*2, canvasW-sx), sh = Math.min(size*2, canvasH-sy);
  if (sw < 2 || sh < 2) return;
  const img = drawCtx.getImageData(sx, sy, sw, sh);
  const blurred = boxBlur(img, 1);
  const d = img.data, b = blurred.data;
  for (let i = 0; i < d.length; i+=4) {
    d[i] = Math.min(255, Math.max(0, d[i]+(d[i]-b[i])*0.6));
    d[i+1] = Math.min(255, Math.max(0, d[i+1]+(d[i+1]-b[i+1])*0.6));
    d[i+2] = Math.min(255, Math.max(0, d[i+2]+(d[i+2]-b[i+2])*0.6));
  }
  drawCtx.putImageData(img, sx, sy);
}

function drawMirror(x1, y1, x2, y2) {
  const cx = canvasW / 2;
  const mx1 = cx + (cx - x1), mx2 = cx + (cx - x2);
  drawCtx.save();
  drawCtx.lineWidth = brushSize; drawCtx.lineCap = 'round'; drawCtx.lineJoin = 'round';
  drawCtx.strokeStyle = hexToRgba(currentColor, brushFlow/100);
  drawCtx.globalAlpha = brushOpacity/100;
  drawCtx.beginPath(); drawCtx.moveTo(mx1, y1); drawCtx.lineTo(mx2, y2); drawCtx.stroke();
  drawCtx.restore();
}

// Shape preview + final
function drawShapePreview(tool, x1, y1, x2, y2) {
  if (!previewSnapshot) return;
  drawCtx.putImageData(previewSnapshot, 0, 0);
  drawCtx.save(); applyCtxSettings();
  renderShape(tool, x1, y1, x2, y2);
  drawCtx.restore();
}

function drawShapeFinal(tool, x1, y1, x2, y2) {
  drawCtx.save(); applyCtxSettings();
  renderShape(tool, x1, y1, x2, y2);
  drawCtx.restore();
}

function renderShape(tool, x1, y1, x2, y2) {
  const ctx = drawCtx;
  ctx.strokeStyle = currentColor; ctx.lineWidth = brushSize; ctx.lineCap = 'round';
  switch (tool) {
    case 'line':
    case 'ruler-tool':
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); break;
    case 'rect':
      ctx.beginPath(); ctx.rect(Math.min(x1,x2), Math.min(y1,y2), Math.abs(x2-x1), Math.abs(y2-y1));
      ctx.stroke(); break;
    case 'ellipse': {
      const cx=(x1+x2)/2, cy=(y1+y2)/2, rx=Math.abs(x2-x1)/2, ry=Math.abs(y2-y1)/2;
      ctx.beginPath(); ctx.ellipse(cx,cy,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2); ctx.stroke(); break;
    }
    case 'arrow': {
      const angle = Math.atan2(y2-y1, x2-x1);
      const len = 20+brushSize;
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2-len*Math.cos(angle-0.4), y2-len*Math.sin(angle-0.4));
      ctx.lineTo(x2-len*Math.cos(angle+0.4), y2-len*Math.sin(angle+0.4));
      ctx.closePath(); ctx.fillStyle = currentColor; ctx.fill(); break;
    }
    case 'star': {
      const cx=(x1+x2)/2, cy=(y1+y2)/2;
      const outer=Math.hypot(x2-cx, y2-cy), inner=outer*0.4;
      const points=5;
      ctx.beginPath();
      for(let i=0;i<points*2;i++){
        const r=i%2===0?outer:inner, angle=(i*Math.PI/points)-Math.PI/2;
        i===0?ctx.moveTo(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r):ctx.lineTo(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r);
      }
      ctx.closePath(); ctx.stroke(); break;
    }
    case 'polygon': {
      const cx=(x1+x2)/2, cy=(y1+y2)/2;
      const r=Math.hypot(x2-cx,y2-cy), sides=6;
      ctx.beginPath();
      for(let i=0;i<sides;i++){
        const a=(i/sides)*Math.PI*2-Math.PI/2;
        i===0?ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r):ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
      }
      ctx.closePath(); ctx.stroke(); break;
    }
    case 'bezier': {
      const cp1x=x1+(x2-x1)*0.25, cp1y=y1-(y2-y1)*0.5;
      const cp2x=x1+(x2-x1)*0.75, cp2y=y2+(y2-y1)*0.5;
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,x2,y2); ctx.stroke();
      break;
    }
  }
}

function boxBlur(imgData, r) {
  const w = imgData.width, h = imgData.height;
  const src = imgData.data, out = new Uint8ClampedArray(src.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let rr=0, g=0, b=0, a=0, n=0;
    for (let dy=-r; dy<=r; dy++) for (let dx=-r; dx<=r; dx++) {
      const nx=x+dx, ny=y+dy;
      if (nx>=0&&nx<w&&ny>=0&&ny<h) {
        const i=(ny*w+nx)*4; rr+=src[i]; g+=src[i+1]; b+=src[i+2]; a+=src[i+3]; n++;
      }
    }
    const i=(y*w+x)*4; out[i]=rr/n; out[i+1]=g/n; out[i+2]=b/n; out[i+3]=a/n;
  }
  return new ImageData(out, w, h);
}

// ===== FILL =====
function floodFill(sx, sy) {
  const img = drawCtx.getImageData(0, 0, canvasW, canvasH);
  const d = img.data;
  const idx = (sy*canvasW+sx)*4;
  const tr=d[idx],tg=d[idx+1],tb=d[idx+2];
  const fr=parseInt(currentColor.slice(1,3),16);
  const fg=parseInt(currentColor.slice(3,5),16);
  const fb=parseInt(currentColor.slice(5,7),16);
  if (tr===fr&&tg===fg&&tb===fb) return;
  const tol = 30;
  const vis = new Uint8Array(canvasW*canvasH);
  const stack = [sx+sy*canvasW];
  function match(i){ return Math.abs(d[i]-tr)<tol&&Math.abs(d[i+1]-tg)<tol&&Math.abs(d[i+2]-tb)<tol; }
  let iter = 0;
  while (stack.length && iter < 2000000) {
    iter++;
    const pos = stack.pop();
    if (vis[pos]) continue;
    const x=pos%canvasW, y=Math.floor(pos/canvasW);
    if (x<0||x>=canvasW||y<0||y>=canvasH) continue;
    const i=pos*4;
    if (!match(i)) continue;
    vis[pos]=1;
    d[i]=fr; d[i+1]=fg; d[i+2]=fb; d[i+3]=255;
    if(x+1<canvasW)stack.push(pos+1);
    if(x-1>=0)stack.push(pos-1);
    if(y+1<canvasH)stack.push(pos+canvasW);
    if(y-1>=0)stack.push(pos-canvasW);
  }
  drawCtx.putImageData(img, 0, 0);
  saveHistory(); toast('تم الملء');
}

// ===== GRADIENT =====
function applyGradient(x1, y1, x2, y2) {
  const grad = drawCtx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, currentColor);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  drawCtx.save();
  drawCtx.globalAlpha = brushOpacity/100;
  drawCtx.fillStyle = grad;
  drawCtx.fillRect(0, 0, canvasW, canvasH);
  drawCtx.restore();
  saveHistory(); toast('تم تطبيق التدرج');
}

// ===== COLOR PICK =====
function pickColor(x, y) {
  const p = drawCtx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
  const hex = '#'+[p[0],p[1],p[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
  selectColor(hex); toast('اللون: '+hex);
}

// ===== TEXT =====
function addText(x, y) {
  const text = prompt('أدخل النص:', 'نص هنا');
  if (!text) return;
  drawCtx.save();
  drawCtx.font = `${brushSize*3}px Cairo, sans-serif`;
  drawCtx.fillStyle = currentColor;
  drawCtx.globalAlpha = brushOpacity/100;
  drawCtx.textAlign = 'center';
  drawCtx.fillText(text, x, y);
  drawCtx.restore();
  saveHistory(); toast('تم إضافة النص');
}

// ===== COLOR SYSTEM =====
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1-l);
  const f = n => { const k=(n+h/30)%12, c=l-a*Math.max(Math.min(k-3,9-k,1),-1); return Math.round(255*c).toString(16).padStart(2,'0'); };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToRgba(hex, a=1) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function generateFullPalette() {
  const colors = [];
  // Blacks/grays
  for (let i=0; i<=20; i++) { const v=Math.round(i*12.75).toString(16).padStart(2,'0'); colors.push('#'+v+v+v); }
  // Skin tones
  const skins=['#FDDBB4','#F5C89E','#E8B98A','#D4A574','#C49060','#B47C4C','#A36838','#8D5524','#7C4916','#6B3A0A',
    '#FFF0E0','#FFE4C4','#FFD4A0','#F4C090','#E8A87C','#DC9068','#C07850','#A46040','#885030','#6C4020',
    '#FFE8D5','#FFDABC','#FFCCA3','#F5BE90','#E8A878','#D89060','#C07848','#A86030','#906018','#784808',
    '#FDECDA','#F9D8B8','#F5C496','#EDAC74','#E29452','#D47C30','#C4640E','#B04C00','#9C3800','#882400'];
  colors.push(...skins);
  // Full spectrum
  for (let h=0; h<360; h+=3) {
    for (let s of [100,85,70,55,40]) {
      for (let l of [10,20,30,40,50,60,70,80,90]) {
        colors.push(hslToHex(h, s, l));
      }
    }
  }
  // Pastels
  for (let h=0; h<360; h+=10) colors.push(hslToHex(h,40,85));
  // Earth
  ['#8B4513','#A0522D','#CD853F','#DEB887','#D2691E','#B8860B','#DAA520','#808000','#556B2F','#2F4F4F'].forEach(c=>colors.push(c));
  // Neons
  ['#FF00FF','#00FFFF','#00FF00','#FF6600','#FF0066','#6600FF','#00FF66','#FF3399','#33FF33','#3333FF'].forEach(c=>colors.push(c));
  return [...new Set(colors)];
}

function generateColorSwatches() {
  const pal = generateFullPalette();
  const container = document.getElementById('colorSwatches');
  if (!container) return;
  container.innerHTML = '';
  pal.slice(0, 1200).forEach(c => {
    const el = document.createElement('div');
    el.className = 'swatch'; el.style.background = c; el.title = c;
    el.onclick = () => selectColor(c);
    container.appendChild(el);
  });
}

function selectColor(color) {
  currentColor = color;
  const fg = document.getElementById('fgSwatch'); if(fg) fg.style.background = color;
  const hx = document.getElementById('hexInput'); if(hx) hx.value = color.replace('#','');
  const np = document.getElementById('colorPickerNative'); if(np) np.value = color;
  const r=parseInt(color.slice(1,3),16), g=parseInt(color.slice(3,5),16), b=parseInt(color.slice(5,7),16);
  const sr=document.getElementById('sliderR'); if(sr) sr.value=r;
  const sg=document.getElementById('sliderG'); if(sg) sg.value=g;
  const sb=document.getElementById('sliderB'); if(sb) sb.value=b;
  document.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.title === color));
}

function applyNativeColor() { const c=document.getElementById('colorPickerNative'); if(c) selectColor(c.value); }
function applyHex() { const h='#'+(document.getElementById('hexInput').value||'').replace('#',''); if(/^#[0-9A-Fa-f]{6}$/.test(h)) selectColor(h); }
function applyRGB() {
  const r=document.getElementById('sliderR').value, g=document.getElementById('sliderG').value, b=document.getElementById('sliderB').value;
  selectColor('#'+[r,g,b].map(v=>parseInt(v).toString(16).padStart(2,'0')).join(''));
}

// ===== BRUSH =====
function selectSafwanBrush(el, name) {
  safwanBrush = name;
  document.querySelectorAll('.safwan-brush-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  const presets = {
    ink:{size:4,opacity:100,flow:95,smooth:25,hard:95,spacing:2,scatter:0},
    sketch:{size:2,opacity:65,flow:55,smooth:15,hard:65,spacing:1,scatter:0},
    paint:{size:22,opacity:85,flow:75,smooth:65,hard:45,spacing:5,scatter:5},
    charcoal:{size:14,opacity:40,flow:35,smooth:35,hard:15,spacing:3,scatter:10},
    water:{size:28,opacity:50,flow:45,smooth:75,hard:8,spacing:8,scatter:0}
  };
  const p = presets[name]; if(!p) return;
  brushSize=p.size; brushOpacity=p.opacity; brushFlow=p.flow;
  brushSmooth=p.smooth; brushHard=p.hard; brushSpacing=p.spacing; brushScatter=p.scatter;
  ['Size','Opacity','Flow','Smooth','Hard','Spacing','Scatter'].forEach(k=>{
    const el=document.getElementById('brush'+k);
    if(el) el.value=p[k.toLowerCase()];
  });
  updateBrush();
  toast('فرشاة: '+el.textContent.trim());
}

function setBrushType(type, el) {
  brushType = type;
  document.querySelectorAll('.brush-preset-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  toast('نوع الفرشاة: '+el.querySelector('.brush-preset-name').textContent);
}

function updateBrush() {
  const get = id => { const el=document.getElementById(id); return el?parseInt(el.value):0; };
  brushSize=get('brushSize'); brushOpacity=get('brushOpacity'); brushFlow=get('brushFlow');
  brushSmooth=get('brushSmooth'); brushHard=get('brushHard'); brushSpacing=get('brushSpacing'); brushScatter=get('brushScatter');
  const set = (id,v,s) => { const el=document.getElementById(id); if(el) el.textContent=v+s; };
  set('brushSizeVal',brushSize,'px'); set('brushOpacityVal',brushOpacity,'%'); set('brushFlowVal',brushFlow,'%');
  set('brushSmoothVal',brushSmooth,'%'); set('brushHardVal',brushHard,'%'); set('brushSpacingVal',brushSpacing,'%'); set('brushScatterVal',brushScatter,'%');
}

// ===== TOOLS =====
const toolNames = {
  select:'تحديد',brush:'فرشاة',pencil:'قلم رصاص',pen:'قلم حبر',calligraphy:'خطاطي',
  marker:'ماركر',airbrush:'فرشاة هواء',watercolor:'مائية',eraser:'ممحاة',smudge:'تلطيخ',
  blur:'تمويه',sharpen:'حدة',dodge:'تفتيح',burn:'تعتيم',fill:'دلو',gradient:'تدرج',
  eyedropper:'قطارة',line:'خط',rect:'مستطيل',ellipse:'دائرة',polygon:'مضلع',
  star:'نجمة',bezier:'منحنى',arrow:'سهم',text:'نص',crop:'اقتصاص',pan:'تحريك',
  'zoom-tool':'تكبير','ruler-tool':'مسطرة',symmetry:'تماثل',
  'rect-select':'تحديد مستطيل','ellipse-select':'تحديد دائري',lasso:'لاسو','magic-wand':'عصا سحرية'
};

function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
  const btn = document.getElementById('tool-'+tool); if(btn) btn.classList.add('active');
  const name = toolNames[tool] || tool;
  const st = document.getElementById('statusTool'); if(st) st.textContent = name;
  const cursors = {brush:'crosshair',pencil:'crosshair',eraser:'cell',fill:'cell',eyedropper:'crosshair',pan:'grab',text:'text','zoom-tool':'zoom-in',select:'default',gradient:'crosshair',line:'crosshair',rect:'crosshair',ellipse:'crosshair'};
  drawCanvas.style.cursor = cursors[tool] || 'crosshair';
  symmetryMode = tool === 'symmetry';
  toast('الأداة: '+name);
}

// ===== LAYERS =====
function renderLayers() {
  const list = document.getElementById('layersList'); if(!list) return;
  list.innerHTML = '';
  [...layers].reverse().forEach((layer, ri) => {
    const idx = layers.length-1-ri;
    const el = document.createElement('div');
    el.className = 'layer-item' + (idx===activeLayer?' active':'');
    el.onclick = () => { activeLayer=idx; renderLayers(); };
    el.innerHTML = `
      <div class="layer-thumb" style="background:${layer.visible?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.2)'}"></div>
      <span class="layer-name" ondblclick="renameLayer(${idx},this)">${layer.name}</span>
      <div class="layer-actions">
        <button class="layer-btn" onclick="event.stopPropagation();toggleLayerVis(${idx})" title="${layer.visible?'إخفاء':'إظهار'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${layer.visible?'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>':'<line x1="1" y1="1" x2="23" y2="23"/><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>'}</svg>
        </button>
        <button class="layer-btn" onclick="event.stopPropagation();toggleLayerLock(${idx})" title="${layer.locked?'فك':'قفل'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${layer.locked?'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>':'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'}</svg>
        </button>
      </div>`;
    list.appendChild(el);
  });
  const st = document.getElementById('statusLayers');
  if(st) st.textContent = layers.length + ' طبقة';
}

function renameLayer(idx, el) {
  const input = document.createElement('input'); input.className='layer-name-input'; input.value=layers[idx].name;
  el.replaceWith(input); input.focus(); input.select();
  input.onblur = () => { layers[idx].name=input.value||layers[idx].name; renderLayers(); };
  input.onkeydown = e => { if(e.key==='Enter') input.blur(); };
}

function addLayer() { layers.push({id:Date.now(),name:'طبقة '+(layers.length+1),visible:true,locked:false,opacity:100,blend:'source-over'}); activeLayer=layers.length-1; renderLayers(); toast('طبقة جديدة'); }
function deleteLayer() { if(layers.length<=1){toast('لا يمكن حذف آخر طبقة');return;} layers.splice(activeLayer,1); activeLayer=Math.min(activeLayer,layers.length-1); renderLayers(); toast('تم حذف الطبقة'); }
function duplicateLayer() { const c={...layers[activeLayer],id:Date.now(),name:layers[activeLayer].name+' (نسخة)'}; layers.splice(activeLayer+1,0,c); activeLayer++; renderLayers(); toast('تم التكرار'); }
function toggleLayerVis(i) { layers[i].visible=!layers[i].visible; renderLayers(); }
function toggleLayerLock(i) { layers[i].locked=!layers[i].locked; renderLayers(); toast(layers[i].locked?'الطبقة مقفلة':'الطبقة مفتوحة'); }
function updateLayerOpacity() { const v=document.getElementById('layerOpacity').value; document.getElementById('layerOpacityVal').textContent=v+'%'; layers[activeLayer].opacity=parseInt(v); }
function applyBlendMode() { layers[activeLayer].blend=document.getElementById('blendMode').value; toast('وضع المزج تغيّر'); }
function mergeDown() { if(activeLayer===0){toast('لا توجد طبقة أسفل');return;} toast('تم الدمج'); }
function mergeLayers() { toast('تم دمج الطبقات'); }
function flattenImage() { toast('تم التسطيح'); }

// ===== HISTORY =====
function saveHistory() {
  historyStack = historyStack.slice(0, histIdx+1);
  historyStack.push(drawCtx.getImageData(0, 0, canvasW, canvasH));
  if (historyStack.length > MAX_HIST) historyStack.shift();
  histIdx = historyStack.length-1;
  const sh = document.getElementById('statusHistory'); if(sh) sh.textContent=Math.max(0,histIdx)+' خطوة';
}
function doUndo() { if(histIdx<=0){toast('لا يوجد ما يمكن التراجع عنه');return;} histIdx--; drawCtx.putImageData(historyStack[histIdx],0,0); toast('تراجع'); }
function doRedo() { if(histIdx>=historyStack.length-1){toast('لا يوجد ما يمكن إعادته');return;} histIdx++; drawCtx.putImageData(historyStack[histIdx],0,0); toast('إعادة'); }

// ===== ZOOM =====
function zoomIn() { zoom=Math.min(zoom*1.25,32); applyZoom(); }
function zoomOut() { zoom=Math.max(zoom/1.25,0.04); applyZoom(); }
function zoomFit() {
  const area=document.getElementById('canvasArea');
  if(!area) return;
  const sx=(area.clientWidth-80)/canvasW, sy=(area.clientHeight-80)/canvasH;
  zoom=Math.min(sx,sy)*0.9; applyZoom();
}
function applyZoom() {
  const w=canvasW*zoom, h=canvasH*zoom;
  drawCanvas.style.width=w+'px'; drawCanvas.style.height=h+'px';
  const checker=document.getElementById('canvasChecker');
  if(checker){checker.style.width=w+'px';checker.style.height=h+'px';}
  const pct=Math.round(zoom*100)+'%';
  const zd=document.getElementById('zoomDisplay'); if(zd) zd.textContent=pct;
  const zp=document.getElementById('zoomPct'); if(zp) zp.textContent=pct;
}

// ===== GRID / CHECKER =====
function toggleGrid() { showGrid=!showGrid; document.getElementById('bgGrid').classList.toggle('show',showGrid); toast(showGrid?'الشبكة مفعلة':'الشبكة مخفية'); }
function toggleChecker() { const c=document.getElementById('canvasChecker'); const show=c.classList.toggle('show'); c.style.display=show?'block':'none'; toast(show?'شطرنج مفعلة':'مخفية'); }

// ===== CANVAS SIZE =====
function buildPresets() {
  const d = document.getElementById('dialogPresets');
  if (d) PRESETS.forEach(p => {
    const b=document.createElement('button');
    b.style.cssText='background:var(--bg3);border:1px solid var(--border);border-radius:7px;padding:0.3rem;font-size:0.62rem;font-weight:700;color:var(--text3);cursor:pointer;font-family:var(--font);text-align:center;transition:all 0.2s';
    b.innerHTML=`<div style="font-size:0.75rem">${p.icon}</div><div style="font-weight:800;color:var(--text2)">${p.name}</div><div style="font-size:0.52rem">${p.w}×${p.h}</div>`;
    b.onmouseover=()=>{b.style.borderColor='var(--accent2)';b.style.color='var(--accent2)';};
    b.onmouseout=()=>{b.style.borderColor='var(--border)';b.style.color='var(--text3)';};
    b.onclick=()=>{document.getElementById('newW').value=p.w;document.getElementById('newH').value=p.h;};
    d.appendChild(b);
  });
  const pp = document.getElementById('sizePresetsBtns');
  if (pp) PRESETS.forEach(p => {
    const b=document.createElement('button'); b.className='size-preset-btn';
    b.innerHTML=`<span class="sp-name">${p.name}</span><span class="sp-dim">${p.w}×${p.h}</span>`;
    b.onclick=()=>{document.getElementById('propW').value=p.w;document.getElementById('propH').value=p.h;applyCanvasSize();};
    pp.appendChild(b);
  });
}

function applyCanvasSize() {
  const w=parseInt(document.getElementById('propW').value)||canvasW;
  const h=parseInt(document.getElementById('propH').value)||canvasH;
  const old=drawCtx.getImageData(0,0,canvasW,canvasH);
  canvasW=w; canvasH=h;
  drawCanvas.width=w; drawCanvas.height=h;
  drawCtx.fillStyle='#fff'; drawCtx.fillRect(0,0,w,h);
  try{drawCtx.putImageData(old,0,0);}catch(e){}
  const csd=document.getElementById('canvasSizeDisplay'); if(csd) csd.textContent=w+'×'+h;
  zoomFit(); saveHistory(); toast('حجم اللوحة: '+w+'×'+h);
}

function showNewCanvas() { document.getElementById('newCanvasDialog').classList.add('open'); }

function createNewCanvas() {
  const w=parseInt(document.getElementById('newW').value)||1920;
  const h=parseInt(document.getElementById('newH').value)||1080;
  const bg=document.getElementById('newBg').value;
  const bgCol=document.getElementById('newBgColor').value;
  const nm=document.getElementById('newMode').value;
  canvasW=w; canvasH=h;
  drawCanvas.width=w; drawCanvas.height=h;
  if(bg==='white'){drawCtx.fillStyle='#fff';drawCtx.fillRect(0,0,w,h);}
  else if(bg==='black'){drawCtx.fillStyle='#000';drawCtx.fillRect(0,0,w,h);}
  else if(bg==='custom'){drawCtx.fillStyle=bgCol;drawCtx.fillRect(0,0,w,h);}
  const csd=document.getElementById('canvasSizeDisplay'); if(csd) csd.textContent=w+'×'+h;
  const pw=document.getElementById('propW'); if(pw) pw.value=w;
  const ph=document.getElementById('propH'); if(ph) ph.value=h;
  historyStack=[]; histIdx=-1; saveHistory();
  layers=[{id:1,name:'طبقة 1',visible:true,locked:false,opacity:100,blend:'source-over'}];
  activeLayer=0; renderLayers();
  document.getElementById('newCanvasDialog').classList.remove('open');
  if(nm!==mode){mode=nm;setupMode();if(mode==='animation'){frames=[null];currentFrame=0;renderAnimTimeline();}}
  zoomFit(); toast('مشروع جديد '+w+'×'+h);
}

// ===== EXPORT =====
function exportPNG() { const a=document.createElement('a');a.download='safwan-studio.png';a.href=drawCanvas.toDataURL('image/png');a.click();toast('تم تصدير PNG'); }
function exportJPEG() {
  const t=document.createElement('canvas');t.width=canvasW;t.height=canvasH;
  const tc=t.getContext('2d');tc.fillStyle='#fff';tc.fillRect(0,0,canvasW,canvasH);tc.drawImage(drawCanvas,0,0);
  const a=document.createElement('a');a.download='safwan-studio.jpg';a.href=t.toDataURL('image/jpeg',0.95);a.click();toast('تم تصدير JPEG');
}
function exportWebP() { const a=document.createElement('a');a.download='safwan-studio.webp';a.href=drawCanvas.toDataURL('image/webp',0.9);a.click();toast('تم تصدير WebP'); }
function exportTransparent() { const a=document.createElement('a');a.download='safwan-transparent.png';a.href=drawCanvas.toDataURL('image/png');a.click();toast('تم تصدير PNG شفاف'); }
function exportGIF() { toast('تصدير GIF — قريباً في الإصدار القادم'); }
function exportVideo() {
  try {
    const stream=drawCanvas.captureStream(fps);
    const rec=new MediaRecorder(stream,{mimeType:'video/webm'});
    const chunks=[];
    rec.ondataavailable=e=>chunks.push(e.data);
    rec.onstop=()=>{const blob=new Blob(chunks,{type:'video/webm'});const a=document.createElement('a');a.download='safwan-animation.webm';a.href=URL.createObjectURL(blob);a.click();toast('تم تصدير الفيديو!');};
    rec.start();
    let f=0;
    const iv=setInterval(()=>{if(frames[f])drawCtx.putImageData(frames[f],0,0);f++;if(f>=frames.length){clearInterval(iv);rec.stop();}},1000/fps);
    toast('جاري التصدير...');
  } catch(e) { toast('خطأ في التصدير: '+e.message); }
}

// ===== IMAGE OPS =====
function doFlipH(){const t=document.createElement('canvas');t.width=canvasW;t.height=canvasH;const c=t.getContext('2d');c.translate(canvasW,0);c.scale(-1,1);c.drawImage(drawCanvas,0,0);drawCtx.clearRect(0,0,canvasW,canvasH);drawCtx.drawImage(t,0,0);saveHistory();toast('قلب أفقي');}
function doFlipV(){const t=document.createElement('canvas');t.width=canvasW;t.height=canvasH;const c=t.getContext('2d');c.translate(0,canvasH);c.scale(1,-1);c.drawImage(drawCanvas,0,0);drawCtx.clearRect(0,0,canvasW,canvasH);drawCtx.drawImage(t,0,0);saveHistory();toast('قلب رأسي');}
function doRotateCW(){
  const t=document.createElement('canvas');t.width=canvasH;t.height=canvasW;
  const c=t.getContext('2d');c.translate(canvasH/2,canvasW/2);c.rotate(Math.PI/2);c.drawImage(drawCanvas,-canvasW/2,-canvasH/2);
  [canvasW,canvasH]=[canvasH,canvasW];drawCanvas.width=canvasW;drawCanvas.height=canvasH;drawCtx.drawImage(t,0,0);
  saveHistory();zoomFit();toast('تدوير 90°');
}
function doSelectAll(){toast('تم تحديد الكل');}
function doCopy(){drawCanvas.toBlob(b=>navigator.clipboard.write([new ClipboardItem({'image/png':b})]).catch(()=>{}));toast('تم النسخ');}
function doPaste(){navigator.clipboard.read().then(items=>{for(const item of items)if(item.types.includes('image/png'))item.getType('image/png').then(blob=>{const img=new Image();img.onload=()=>{drawCtx.drawImage(img,0,0);saveHistory();};img.src=URL.createObjectURL(blob);});}).catch(()=>toast('لا توجد صورة في الحافظة'));}
function clearCanvas(){if(!confirm('هل تريد مسح اللوحة؟'))return;drawCtx.clearRect(0,0,canvasW,canvasH);drawCtx.fillStyle='#fff';drawCtx.fillRect(0,0,canvasW,canvasH);saveHistory();toast('تم المسح');}

// ===== FILTERS =====
function addFilterBlur(){const s=parseInt(prompt('قوة التمويه (1-20):','5'))||5;const img=drawCtx.getImageData(0,0,canvasW,canvasH);drawCtx.putImageData(boxBlur(img,s),0,0);saveHistory();toast('تم التمويه');}
function addFilterBrightness(){const v=parseInt(prompt('السطوع (-100 إلى 100):','20'))||20;const img=drawCtx.getImageData(0,0,canvasW,canvasH);const d=img.data;for(let i=0;i<d.length;i+=4){d[i]=Math.min(255,Math.max(0,d[i]+v));d[i+1]=Math.min(255,Math.max(0,d[i+1]+v));d[i+2]=Math.min(255,Math.max(0,d[i+2]+v));}drawCtx.putImageData(img,0,0);saveHistory();toast('تم تعديل السطوع');}
function addFilterGrayscale(){const img=drawCtx.getImageData(0,0,canvasW,canvasH);const d=img.data;for(let i=0;i<d.length;i+=4){const g=d[i]*.299+d[i+1]*.587+d[i+2]*.114;d[i]=d[i+1]=d[i+2]=g;}drawCtx.putImageData(img,0,0);saveHistory();toast('تم التحويل رمادي');}

// ===== REFERENCE =====
function handleRefImport(e){
  const file=e.target.files[0];if(!file)return;
  const img=new Image(); img.onload=()=>{drawCtx.save();drawCtx.globalAlpha=refOpacity;drawCtx.drawImage(img,0,0,canvasW,canvasH);drawCtx.restore();saveHistory();toast('تم استيراد المرجع');};
  img.src=URL.createObjectURL(file);
}
function handleFileOpen(e){
  const file=e.target.files[0];if(!file)return;
  const img=new Image();img.onload=()=>{canvasW=img.width;canvasH=img.height;drawCanvas.width=canvasW;drawCanvas.height=canvasH;drawCtx.drawImage(img,0,0);saveHistory();zoomFit();toast('تم فتح الصورة');};
  img.src=URL.createObjectURL(file);
}
function updateRefOpacity(){const v=document.getElementById('refOpacity').value;refOpacity=v/100;document.getElementById('refOpacityVal').textContent=v+'%';}
function toggleRefLock(){refLocked=!refLocked;toast(refLocked?'المرجع مقفل':'المرجع مفتوح');}
function removeRef(){toast('تم حذف المرجع');}

// ===== ANIMATION =====
function saveCurrentFrame(){frames[currentFrame]=drawCtx.getImageData(0,0,canvasW,canvasH);renderAnimTimeline();}
function loadFrame(idx){
  if(frames[idx]){drawCtx.putImageData(frames[idx],0,0);}
  else{drawCtx.fillStyle='#fff';drawCtx.fillRect(0,0,canvasW,canvasH);}
  currentFrame=idx;
  const fc=document.getElementById('frameCounter');if(fc)fc.textContent='فريم '+(idx+1)+' / '+frames.length;
  document.querySelectorAll('.frame-item').forEach((el,i)=>el.classList.toggle('active',i===idx));
}
function addFrame(){saveCurrentFrame();frames.push(null);currentFrame=frames.length-1;drawCtx.fillStyle='#fff';drawCtx.fillRect(0,0,canvasW,canvasH);renderAnimTimeline();toast('فريم جديد '+(currentFrame+1));}
function duplicateFrame(){saveCurrentFrame();const copy=frames[currentFrame]?new ImageData(new Uint8ClampedArray(frames[currentFrame].data),canvasW,canvasH):null;frames.splice(currentFrame+1,0,copy);currentFrame++;loadFrame(currentFrame);renderAnimTimeline();toast('تم تكرار الفريم');}
function deleteFrame(){if(frames.length<=1){toast('لا يمكن حذف آخر فريم');return;}frames.splice(currentFrame,1);currentFrame=Math.min(currentFrame,frames.length-1);loadFrame(currentFrame);renderAnimTimeline();toast('تم حذف الفريم');}
function frameNext(){saveCurrentFrame();currentFrame=(currentFrame+1)%frames.length;loadFrame(currentFrame);}
function framePrev(){saveCurrentFrame();currentFrame=(currentFrame-1+frames.length)%frames.length;loadFrame(currentFrame);}
function updateFPS(){fps=parseInt(document.getElementById('fpsInput').value)||12;}

function togglePlay(){isPlaying?stopPlay():startPlay();}
function startPlay(){
  isPlaying=true;
  const icon=document.getElementById('playIcon');
  if(icon)icon.innerHTML='<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  saveCurrentFrame();let f=0;
  playInterval=setInterval(()=>{loadFrame(f);f=(f+1)%frames.length;},1000/fps);
}
function stopPlay(){
  isPlaying=false;clearInterval(playInterval);playInterval=null;
  const icon=document.getElementById('playIcon');
  if(icon)icon.innerHTML='<polygon points="5 3 19 12 5 21 5 3"/>';
}

function renderAnimTimeline(){
  const tl=document.getElementById('animTimeline');if(!tl)return;
  tl.innerHTML='';
  frames.forEach((fr,i)=>{
    const el=document.createElement('div');el.className='frame-item'+(i===currentFrame?' active':'');
    el.onclick=()=>{saveCurrentFrame();loadFrame(i);};
    const mc=document.createElement('canvas');mc.width=64;mc.height=Math.max(1,Math.round(64*canvasH/canvasW));
    mc.style.cssText='width:100%;height:100%;display:block;';
    const mcc=mc.getContext('2d');
    if(fr){const tmp=document.createElement('canvas');tmp.width=canvasW;tmp.height=canvasH;tmp.getContext('2d').putImageData(fr,0,0);mcc.drawImage(tmp,0,0,64,mc.height);}
    else{mcc.fillStyle='#fff';mcc.fillRect(0,0,64,64);}
    el.appendChild(mc);
    const num=document.createElement('div');num.className='frame-num';num.textContent=i+1;el.appendChild(num);
    tl.appendChild(el);
  });
  const addBtn=document.createElement('div');addBtn.className='frame-add-btn';
  addBtn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  addBtn.onclick=addFrame;tl.appendChild(addBtn);
  const fc=document.getElementById('frameCounter');if(fc)fc.textContent='فريم '+(currentFrame+1)+' / '+frames.length;
}

// ===== SAMPLE PROJECT: FIRE =====
function openSampleProject(){
  if(!confirm('فتح مشروع نار متحركة الجاهز؟'))return;
  mode='animation';canvasW=400;canvasH=500;
  drawCanvas.width=canvasW;drawCanvas.height=canvasH;
  frames=[];
  for(let f=0;f<8;f++){
    const t=document.createElement('canvas');t.width=canvasW;t.height=canvasH;
    const c=t.getContext('2d');
    c.fillStyle='#ffffff';c.fillRect(0,0,canvasW,canvasH);
    drawFireFrame(c,f,canvasW,canvasH);
    frames.push(t.getContext('2d').getImageData(0,0,canvasW,canvasH));
  }
  currentFrame=0;loadFrame(0);
  document.getElementById('animPanel').style.display='flex';
  renderAnimTimeline();setupMode();zoomFit();
  toast('مشروع نار متحركة مُحمّل! 🔥');
}

function drawFireFrame(ctx,frame,w,h){
  const t=frame/8;
  const flameLayers=[
    {col:['#FF4500','#FF6600','#FF8800'],offset:0,scale:1},
    {col:['#FF2200','#FF4400','#FF6600'],offset:Math.PI/3,scale:0.75},
    {col:['#FFDD00','#FF8800','#FF4400'],offset:Math.PI*0.7,scale:0.5},
  ];
  flameLayers.forEach((fl,li)=>{
    const ox=Math.sin(t*Math.PI*2+fl.offset)*18;
    const bw=w*0.32*fl.scale;
    const tipX=w/2+ox;const tipY=h*(0.05+li*0.06);
    const grad=ctx.createRadialGradient(tipX,h*0.6,5,tipX,h*0.3,h*0.55*fl.scale);
    grad.addColorStop(0,fl.col[0]);grad.addColorStop(0.5,fl.col[1]);grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=0.85-li*0.18;ctx.fillStyle=grad;
    ctx.beginPath();
    ctx.moveTo(w/2-bw,h*0.87);
    ctx.bezierCurveTo(w/2-bw*1.3,h*0.55,tipX-25,h*0.28,tipX,tipY);
    ctx.bezierCurveTo(tipX+25,h*0.28,w/2+bw*1.3,h*0.55,w/2+bw,h*0.87);
    ctx.closePath();ctx.fill();
  });
  // White/yellow core
  ctx.globalAlpha=1;
  const core=ctx.createRadialGradient(w/2,h*0.65,0,w/2,h*0.55,w*0.15);
  core.addColorStop(0,'rgba(255,255,255,0.95)');core.addColorStop(0.3,'rgba(255,255,100,0.7)');core.addColorStop(1,'rgba(255,100,0,0)');
  ctx.fillStyle=core;ctx.beginPath();ctx.ellipse(w/2,h*0.6,w*0.12,h*0.18,0,0,Math.PI*2);ctx.fill();
  // Embers
  ctx.globalAlpha=0.7;
  for(let i=0;i<12;i++){
    const a=Math.random()*Math.PI*2,r=Math.random()*w*0.15;
    const ex=w/2+Math.cos(a)*r,ey=h*(0.4+Math.random()*0.3);
    ctx.fillStyle=Math.random()>0.5?'#FF8800':'#FFDD00';
    ctx.beginPath();ctx.arc(ex,ey,Math.random()*2.5+0.5,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
}

// ===== PROJECTS =====
function loadProjects(){projects=JSON.parse(localStorage.getItem('safwan_projects')||'[]');}
function saveProject(){
  const name=prompt('اسم المشروع:','مشروع '+(projects.length+1));if(!name)return;
  const thumb=drawCanvas.toDataURL('image/jpeg',0.3);
  const data=drawCanvas.toDataURL('image/png');
  const proj={id:Date.now(),name,thumb,data,w:canvasW,h:canvasH,mode,date:new Date().toLocaleDateString('ar')};
  projects.unshift(proj);
  if(projects.length>20)projects.pop();
  localStorage.setItem('safwan_projects',JSON.stringify(projects));
  toast('تم حفظ المشروع: '+name);
}

function openProjects(){
  loadProjects();
  const grid=document.getElementById('projectsGrid');grid.innerHTML='';
  if(projects.length===0){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:2rem;font-size:0.85rem">لا توجد مشاريع محفوظة بعد</div>';
  }else{
    projects.forEach(p=>{
      const el=document.createElement('div');el.className='project-card';
      el.innerHTML=`<div class="project-thumb"><img src="${p.thumb}" style="width:100%;height:100%;object-fit:cover"></div>
      <div class="project-info"><div class="project-name">${p.name}</div>
      <div class="project-meta">${p.w}×${p.h} • ${p.mode==='animation'?'متحرك':'ثابت'} • ${p.date}</div></div>`;
      el.onclick=()=>{const img=new Image();img.onload=()=>{canvasW=p.w;canvasH=p.h;drawCanvas.width=canvasW;drawCanvas.height=canvasH;drawCtx.drawImage(img,0,0);saveHistory();zoomFit();closeProjects();toast('تم فتح: '+p.name);};img.src=p.data;};
      grid.appendChild(el);
    });
  }
  document.getElementById('projectsOverlay').classList.add('open');
}
function closeProjects(){document.getElementById('projectsOverlay').classList.remove('open');}
function openSettings(){document.getElementById('settingsOverlay').classList.add('open');}
function closeSettings(){document.getElementById('settingsOverlay').classList.remove('open');}

// ===== TABS =====
function switchTab(tab){
  ['brush','color','layers','props'].forEach(t=>{
    const btn=document.getElementById('tab-'+t);const cnt=document.getElementById('content-'+t);
    if(btn)btn.classList.toggle('active',t===tab);
    if(cnt)cnt.style.display=t===tab?'block':'none';
  });
}

// ===== THEME =====
function toggleTheme(){
  isDark=!isDark;
  document.body.classList.toggle('light-mode',!isDark);
  const btn=document.getElementById('themeBtn');
  if(btn)btn.innerHTML=isDark?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/></svg>';
  const dt=document.getElementById('darkToggle');if(dt)dt.classList.toggle('on',isDark);
}

// ===== KEYBOARD =====
function setupKeyboard(){
  document.addEventListener('keydown', e=>{
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.isContentEditable)return;
    const k=e.key.toLowerCase();
    if(e.ctrlKey||e.metaKey){
      switch(k){
        case 'z':e.preventDefault();doUndo();break;
        case 'y':e.preventDefault();doRedo();break;
        case 's':e.preventDefault();saveProject();break;
        case 'e':e.preventDefault();exportPNG();break;
        case 'n':e.preventDefault();showNewCanvas();break;
        case 'p':e.preventDefault();openProjects();break;
        case 'c':doCopy();break;
        case 'v':doPaste();break;
        case 'a':e.preventDefault();doSelectAll();break;
        case '=': case '+':e.preventDefault();zoomIn();break;
        case '-':e.preventDefault();zoomOut();break;
        case '0':e.preventDefault();zoomFit();break;
      }
    } else {
      switch(k){
        case 'b':setTool('brush');break;
        case 'e':setTool('eraser');break;
        case 'v':setTool('select');break;
        case 'h':setTool('pan');break;
        case 't':setTool('text');break;
        case 'i':setTool('eyedropper');break;
        case 'r':setTool('rect');break;
        case 'o':setTool('ellipse');break;
        case 'l':setTool('lasso');break;
        case 'w':setTool('magic-wand');break;
        case 'p':setTool('pencil');break;
        case 'f':setTool('fill');break;
        case 'z':setTool('zoom-tool');break;
        case 'u':setTool('line');break;
        case 'g':toggleGrid();break;
        case '[':brushSize=Math.max(1,brushSize-2);document.getElementById('brushSize').value=brushSize;updateBrush();break;
        case ']':brushSize=Math.min(300,brushSize+2);document.getElementById('brushSize').value=brushSize;updateBrush();break;
        case 'arrowleft':if(mode==='animation'){framePrev();}break;
        case 'arrowright':if(mode==='animation'){frameNext();}break;
        case ' ':if(mode==='animation'){e.preventDefault();togglePlay();}break;
      }
    }
  });
}

// ===== TOAST =====
function toast(msg, dur=2200){
  const c=document.getElementById('toastContainer');if(!c)return;
  const el=document.createElement('div');el.className='toast';el.textContent=msg;
  c.appendChild(el);
  setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(8px)';el.style.transition='all 0.3s';setTimeout(()=>el.remove(),300);},dur);
}

// Particles for any page with canvas
const pcv=document.getElementById('particles-canvas');
if(pcv){
  const pctx=pcv.getContext('2d');let pp=[];
  const pcols=['#FF6B6B','#4ECDC4','#FFE66D','#A8EDEA'];
  function presize(){pcv.width=innerWidth;pcv.height=innerHeight;}
  function pkinit(){pp=Array.from({length:40},()=>({x:Math.random()*pcv.width,y:Math.random()*pcv.height,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,r:Math.random()*1.5+.4,color:pcols[Math.floor(Math.random()*pcols.length)],a:Math.random()*.4+.1}));}
  function pkdraw(){
    pctx.clearRect(0,0,pcv.width,pcv.height);
    pp.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=pcv.width;if(p.x>pcv.width)p.x=0;if(p.y<0)p.y=pcv.height;if(p.y>pcv.height)p.y=0;pctx.globalAlpha=p.a;pctx.fillStyle=p.color;pctx.beginPath();pctx.arc(p.x,p.y,p.r,0,Math.PI*2);pctx.fill();});
    pctx.globalAlpha=1;requestAnimationFrame(pkdraw);
  }
  window.addEventListener('resize',presize);presize();pkinit();pkdraw();
}
