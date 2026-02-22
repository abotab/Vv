// ==========================================
// SAFWAN STUDIO — DRAWING ENGINE
// ==========================================

// ===== STATE =====
let canvas;
let currentTool = 'brush';
let currentColor = '#1a1a2e';
let brushColor = '#1a1a2e';
let brushSize = 12;
let brushOpacity = 100;
let brushFlow = 80;
let brushSmooth = 50;
let brushType = 'round';
let currentSafwanBrush = 'safwan-ink';
let isDark = true;
let isDrawing = false;
let zoom = 1;
let canvasW = 1920, canvasH = 1080;
let showGrid = false;
let showRuler = false;
let refImage = null;
let refLocked = false;

// History
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

// Layers
let layers = [{ id: 1, name: 'طبقة 1', visible: true, locked: false, opacity: 100, data: null }];
let activeLayerIndex = 0;

// Drawing context (HTML5 Canvas for actual drawing)
let drawCtx;
let drawCanvas;

// ===== INIT =====
window.addEventListener('load', init);

function init() {
  setupDrawCanvas();
  generateColorSwatches();
  renderLayers();
  updateBrush();
  setupKeyboardShortcuts();
  updateStatusBar();
  toast('مرحباً بك في صفوان ستوديو');
}

function setupDrawCanvas() {
  const canvasArea = document.getElementById('canvasArea');
  const mainCanvas = document.getElementById('mainCanvas');
  
  // Set canvas size (scaled for display)
  const displayW = Math.min(canvasW, canvasArea.clientWidth - 100);
  const displayH = Math.min(canvasH, canvasArea.clientHeight - 60);
  const scaleX = displayW / canvasW;
  const scaleY = displayH / canvasH;
  const scale = Math.min(scaleX, scaleY) * 0.9;
  
  mainCanvas.width = canvasW;
  mainCanvas.height = canvasH;
  mainCanvas.style.width = (canvasW * scale) + 'px';
  mainCanvas.style.height = (canvasH * scale) + 'px';
  
  zoom = scale;
  document.getElementById('zoomDisplay').textContent = Math.round(zoom * 100) + '%';
  document.getElementById('zoomPct').textContent = Math.round(zoom * 100) + '%';
  document.getElementById('canvasSizeDisplay').textContent = canvasW + ' × ' + canvasH + 'px';
  
  drawCanvas = mainCanvas;
  drawCtx = mainCanvas.getContext('2d');
  
  // Fill with white
  drawCtx.fillStyle = '#ffffff';
  drawCtx.fillRect(0, 0, canvasW, canvasH);
  
  // Drawing events
  mainCanvas.addEventListener('mousedown', onDrawStart);
  mainCanvas.addEventListener('mousemove', onDrawMove);
  mainCanvas.addEventListener('mouseup', onDrawEnd);
  mainCanvas.addEventListener('mouseleave', onDrawEnd);
  mainCanvas.addEventListener('mousemove', updateCursorPos);
  
  // Touch support
  mainCanvas.addEventListener('touchstart', onTouchStart, { passive: false });
  mainCanvas.addEventListener('touchmove', onTouchMove, { passive: false });
  mainCanvas.addEventListener('touchend', onDrawEnd);

  // Update checker overlay size
  const checker = document.getElementById('canvasChecker');
  checker.style.width = mainCanvas.style.width;
  checker.style.height = mainCanvas.style.height;

  saveHistory();
}

// ===== DRAWING =====
let lastX, lastY;
let smoothX, smoothY;
let path = [];

function getCanvasCoords(e) {
  const rect = drawCanvas.getBoundingClientRect();
  const scaleX = canvasW / rect.width;
  const scaleY = canvasH / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function onDrawStart(e) {
  if (e.button !== 0) return;
  isDrawing = true;
  const { x, y } = getCanvasCoords(e);
  lastX = smoothX = x;
  lastY = smoothY = y;
  path = [{ x, y }];
  
  if (currentTool === 'fill') {
    floodFill(Math.round(x), Math.round(y), currentColor);
    saveHistory();
    return;
  }
  
  if (currentTool === 'eyedropper') {
    pickColor(Math.round(x), Math.round(y));
    return;
  }
  
  drawCtx.save();
  applyBrushSettings();
  drawCtx.beginPath();
  drawCtx.moveTo(x, y);
}

function onDrawMove(e) {
  if (!isDrawing) return;
  const { x, y } = getCanvasCoords(e);
  
  // Smoothing
  const sm = brushSmooth / 100;
  smoothX = smoothX * sm + x * (1 - sm);
  smoothY = smoothY * sm + y * (1 - sm);
  
  path.push({ x: smoothX, y: smoothY });

  if (currentTool === 'brush' || currentTool === 'pencil' || currentTool === 'pen' || currentTool === 'calligraphy') {
    drawStroke(lastX, lastY, smoothX, smoothY);
  } else if (currentTool === 'eraser') {
    eraseStroke(lastX, lastY, smoothX, smoothY);
  } else if (currentTool === 'smudge') {
    smudgeStroke(smoothX, smoothY);
  }
  
  lastX = smoothX;
  lastY = smoothY;
}

function onDrawEnd() {
  if (!isDrawing) return;
  isDrawing = false;
  drawCtx.restore();
  path = [];
  saveHistory();
  updateStatusBar();
}

function drawStroke(x1, y1, x2, y2) {
  const ctx = drawCtx;
  const size = brushSize;
  const flow = brushFlow / 100;
  
  ctx.save();
  applyBrushSettings();
  
  if (brushType === 'soft') {
    // Soft brush using radial gradient
    const dist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    const steps = Math.max(1, Math.floor(dist / (size * 0.25)));
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, size / 2);
      const col = hexToRgba(currentColor, flow * 0.15);
      grad.addColorStop(0, col);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (brushType === 'spray') {
    const density = 30;
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * size / 2;
      const px = x2 + Math.cos(angle) * radius;
      const py = y2 + Math.sin(angle) * radius;
      ctx.fillStyle = hexToRgba(currentColor, flow * 0.3);
      ctx.beginPath();
      ctx.arc(px, py, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (brushType === 'flat') {
    ctx.lineCap = 'square';
    ctx.lineWidth = size;
    ctx.strokeStyle = hexToRgba(currentColor, flow);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  } else {
    // Default round
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size;
    ctx.strokeStyle = hexToRgba(currentColor, flow);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  ctx.restore();
}

function eraseStroke(x1, y1, x2, y2) {
  const ctx = drawCtx;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = brushSize * 2;
  ctx.strokeStyle = 'rgba(0,0,0,1)';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function smudgeStroke(x, y) {
  const ctx = drawCtx;
  const size = brushSize;
  const data = ctx.getImageData(x - size, y - size, size * 2, size * 2);
  const blurred = blurImageData(data, 3);
  ctx.putImageData(blurred, x - size, y - size);
}

function blurImageData(data, radius) {
  // Simple box blur
  const w = data.width, h = data.height;
  const out = new Uint8ClampedArray(data.data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const i = (ny * w + nx) * 4;
            r += data.data[i]; g += data.data[i+1];
            b += data.data[i+2]; a += data.data[i+3];
            count++;
          }
        }
      }
      const i = (y * w + x) * 4;
      out[i] = r/count; out[i+1] = g/count;
      out[i+2] = b/count; out[i+3] = a/count;
    }
  }
  return new ImageData(out, w, h);
}

function applyBrushSettings() {
  const ctx = drawCtx;
  const hard = brushHard / 100;
  ctx.globalAlpha = (brushOpacity / 100);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = brushSize;
  
  if (currentSafwanBrush === 'safwan-ink') {
    ctx.globalCompositeOperation = 'source-over';
  } else if (currentSafwanBrush === 'safwan-sketch') {
    ctx.globalAlpha = 0.6 * (brushOpacity / 100);
  } else if (currentSafwanBrush === 'safwan-charcoal') {
    ctx.globalAlpha = 0.4 * (brushOpacity / 100);
  }
}

// ===== TOUCH SUPPORT =====
function onTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  onDrawStart({ clientX: touch.clientX, clientY: touch.clientY, button: 0 });
}

function onTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  onDrawMove({ clientX: touch.clientX, clientY: touch.clientY });
}

// ===== TOOLS =====
function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tool-' + tool);
  if (btn) btn.classList.add('active');
  
  const names = {
    select: 'تحديد', brush: 'فرشاة', pencil: 'قلم رصاص', pen: 'قلم', eraser: 'ممحاة',
    fill: 'دلو الطلاء', eyedropper: 'قطارة', rect: 'مستطيل', ellipse: 'دائرة',
    line: 'خط', text: 'نص', pan: 'تحريك', lasso: 'لاسو', 'rect-select': 'تحديد مستطيل',
    'ellipse-select': 'تحديد دائري', 'magic-wand': 'العصا السحرية', polygon: 'مضلع',
    star: 'نجمة', calligraphy: 'خط خطاطي', smudge: 'تلطيخ', 'zoom-tool': 'تكبير'
  };
  document.getElementById('statusTool').textContent = names[tool] || tool;

  // Cursor
  const cursors = { brush: 'crosshair', pencil: 'crosshair', eraser: 'cell', eyedropper: 'crosshair', fill: 'cell', pan: 'grab', text: 'text', 'zoom-tool': 'zoom-in', select: 'default' };
  drawCanvas.style.cursor = cursors[tool] || 'crosshair';
  toast('الأداة: ' + (names[tool] || tool));
}

// ===== BRUSH PRESETS =====
let brushHard = 85;

function selectSafwanBrush(el, name) {
  document.querySelectorAll('.brush-badge').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentSafwanBrush = name;
  
  const presets = {
    'safwan-ink': { size: 5, opacity: 100, flow: 90, smooth: 30, hard: 95 },
    'safwan-sketch': { size: 3, opacity: 65, flow: 60, smooth: 20, hard: 70 },
    'safwan-paint': { size: 20, opacity: 80, flow: 70, smooth: 60, hard: 50 },
    'safwan-charcoal': { size: 15, opacity: 45, flow: 40, smooth: 40, hard: 20 },
    'safwan-water': { size: 25, opacity: 55, flow: 50, smooth: 70, hard: 10 },
  };
  
  const p = presets[name];
  if (p) {
    document.getElementById('brushSize').value = p.size;
    document.getElementById('brushOpacity').value = p.opacity;
    document.getElementById('brushFlow').value = p.flow;
    document.getElementById('brushSmooth').value = p.smooth;
    document.getElementById('brushHard').value = p.hard;
    brushSize = p.size;
    brushOpacity = p.opacity;
    brushFlow = p.flow;
    brushSmooth = p.smooth;
    brushHard = p.hard;
    updateBrush();
  }
  toast('فرشاة: ' + el.textContent);
}

function setBrushType(type, el) {
  brushType = type;
  document.querySelectorAll('.brush-preset-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function updateBrush() {
  brushSize = parseInt(document.getElementById('brushSize').value);
  brushOpacity = parseInt(document.getElementById('brushOpacity').value);
  brushFlow = parseInt(document.getElementById('brushFlow').value);
  brushSmooth = parseInt(document.getElementById('brushSmooth').value);
  brushHard = parseInt(document.getElementById('brushHard').value);
  
  document.getElementById('brushSizeVal').textContent = brushSize + 'px';
  document.getElementById('brushOpacityVal').textContent = brushOpacity + '%';
  document.getElementById('brushFlowVal').textContent = brushFlow + '%';
  document.getElementById('brushSmoothVal').textContent = brushSmooth + '%';
  document.getElementById('brushHardVal').textContent = brushHard + '%';
}

// ===== COLOR SYSTEM =====
const colorPalette = generateFullPalette();

function generateFullPalette() {
  const colors = [];
  // Basic colors
  const basics = [
    '#000000','#1a1a1a','#333333','#4d4d4d','#666666','#808080','#999999','#b3b3b3','#cccccc','#e6e6e6','#ffffff',
    '#ff0000','#ff3333','#ff6666','#ff9999','#ffcccc','#ffe5e5',
    '#ff4500','#ff6a33','#ff8f66','#ffb499','#ffd9cc',
    '#ff8c00','#ffa033','#ffb466','#ffc899','#ffddcc',
    '#ffd700','#ffdc33','#ffe166','#ffe999','#fff2cc',
    '#00ff00','#33ff33','#66ff66','#99ff99','#ccffcc',
    '#008000','#33a033','#66b966','#99cc99','#cce6cc',
    '#00ffff','#33ffff','#66ffff','#99ffff','#ccffff',
    '#0000ff','#3333ff','#6666ff','#9999ff','#ccccff',
    '#8b00ff','#9933ff','#ad66ff','#c299ff','#d9ccff',
    '#ff00ff','#ff33ff','#ff66ff','#ff99ff','#ffccff',
    '#ff1493','#ff47a3','#ff73b5','#ff9fc8','#ffcce4',
    '#dc143c','#e33659','#eb5876','#f27a93','#f9ccda',
  ];
  colors.push(...basics);
  
  // HSL spectrum (many colors)
  for (let h = 0; h < 360; h += 5) {
    for (let s of [100, 80, 60]) {
      for (let l of [20, 35, 50, 65, 80]) {
        colors.push(hslToHex(h, s, l));
      }
    }
  }
  
  // Earth tones
  const earths = ['#8B4513','#A0522D','#6B4226','#C4872A','#D2691E','#CD853F','#DEB887','#F4A460',
    '#DAA520','#B8860B','#2F4F4F','#006400','#228B22','#3CB371','#7CFC00','#ADFF2F',
    '#556B2F','#6B8E23','#808000','#9ACD32'];
  colors.push(...earths);
  
  return [...new Set(colors)]; // deduplicate
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateColorSwatches() {
  const container = document.getElementById('colorSwatches');
  container.innerHTML = '';
  const display = colorPalette.slice(0, 512);
  display.forEach((color, i) => {
    const el = document.createElement('div');
    el.className = 'swatch';
    el.style.background = color;
    el.title = color;
    el.onclick = () => selectColor(color, el);
    container.appendChild(el);
  });
}

function selectColor(color, el) {
  currentColor = color;
  brushColor = color;
  document.getElementById('fgSwatch').style.background = color;
  document.getElementById('hexInput').value = color.replace('#', '');
  document.getElementById('colorPickerNative').value = color;
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  if (el) el.classList.add('active');
}

function openColorPicker(type) {
  document.getElementById('colorPickerNative').click();
}

function applyNativeColor() {
  const color = document.getElementById('colorPickerNative').value;
  selectColor(color, null);
}

function applyHex() {
  const hex = '#' + document.getElementById('hexInput').value.replace('#', '');
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    selectColor(hex, null);
  }
}

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ===== LAYERS =====
function renderLayers() {
  const list = document.getElementById('layersList');
  list.innerHTML = '';
  
  [...layers].reverse().forEach((layer, revIdx) => {
    const idx = layers.length - 1 - revIdx;
    const el = document.createElement('div');
    el.className = 'layer-item' + (idx === activeLayerIndex ? ' active' : '');
    el.onclick = () => { activeLayerIndex = idx; renderLayers(); };
    el.innerHTML = `
      <div class="layer-thumb" style="background:${layer.visible ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)'}"></div>
      <span class="layer-name">${layer.name}</span>
      <div class="layer-actions">
        <button class="layer-btn" onclick="event.stopPropagation(); toggleLayerVisibility(${idx})" title="${layer.visible ? 'إخفاء' : 'إظهار'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${layer.visible ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'}</svg>
        </button>
        <button class="layer-btn" onclick="event.stopPropagation(); toggleLayerLock(${idx})" title="${layer.locked ? 'فك القفل' : 'قفل'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${layer.locked ? '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' : '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'}</svg>
        </button>
      </div>
    `;
    list.appendChild(el);
  });
  
  document.getElementById('statusLayers').textContent = layers.length + ' ' + (layers.length === 1 ? 'طبقة' : 'طبقات');
}

function addLayer() {
  const id = Date.now();
  layers.push({ id, name: 'طبقة ' + (layers.length + 1), visible: true, locked: false, opacity: 100 });
  activeLayerIndex = layers.length - 1;
  renderLayers();
  toast('تمت إضافة طبقة جديدة');
}

function deleteLayer() {
  if (layers.length <= 1) { toast('لا يمكن حذف آخر طبقة'); return; }
  layers.splice(activeLayerIndex, 1);
  activeLayerIndex = Math.min(activeLayerIndex, layers.length - 1);
  renderLayers();
  toast('تم حذف الطبقة');
}

function duplicateLayer() {
  const orig = layers[activeLayerIndex];
  const copy = { ...orig, id: Date.now(), name: orig.name + ' (نسخة)' };
  layers.splice(activeLayerIndex + 1, 0, copy);
  activeLayerIndex++;
  renderLayers();
  toast('تم تكرار الطبقة');
}

function toggleLayerVisibility(idx) {
  layers[idx].visible = !layers[idx].visible;
  renderLayers();
}

function toggleLayerLock(idx) {
  layers[idx].locked = !layers[idx].locked;
  renderLayers();
  toast(layers[idx].locked ? 'الطبقة مقفلة' : 'تم فك قفل الطبقة');
}

function updateLayerOpacity() {
  const val = document.getElementById('layerOpacity').value;
  document.getElementById('layerOpacityVal').textContent = val + '%';
  layers[activeLayerIndex].opacity = parseInt(val);
}

function mergeLayers() {
  toast('تم دمج جميع الطبقات');
}

function mergeDown() {
  if (activeLayerIndex === 0) { toast('لا توجد طبقة أسفل'); return; }
  toast('تم دمج الطبقة مع السفلى');
}

function applyBlendMode() {
  const mode = document.getElementById('blendMode').value;
  drawCtx.globalCompositeOperation = mode === 'normal' ? 'source-over' : mode;
  toast('وضع المزج: ' + document.getElementById('blendMode').options[document.getElementById('blendMode').selectedIndex].text);
}

// ===== HISTORY =====
function saveHistory() {
  const imageData = drawCtx.getImageData(0, 0, canvasW, canvasH);
  history = history.slice(0, historyIndex + 1);
  history.push(imageData);
  if (history.length > MAX_HISTORY) history.shift();
  historyIndex = history.length - 1;
  document.getElementById('statusHistory').textContent = historyIndex + ' خطوة';
}

function doUndo() {
  if (historyIndex <= 0) { toast('لا يوجد ما يمكن التراجع عنه'); return; }
  historyIndex--;
  drawCtx.putImageData(history[historyIndex], 0, 0);
  toast('تراجع');
}

function doRedo() {
  if (historyIndex >= history.length - 1) { toast('لا يوجد ما يمكن إعادته'); return; }
  historyIndex++;
  drawCtx.putImageData(history[historyIndex], 0, 0);
  toast('إعادة');
}

// ===== EXPORT =====
function exportPNG() {
  const link = document.createElement('a');
  link.download = 'safwan-studio-artwork.png';
  link.href = drawCanvas.toDataURL('image/png');
  link.click();
  toast('تم تصدير PNG');
}

function exportJPEG() {
  const link = document.createElement('a');
  link.download = 'safwan-studio-artwork.jpg';
  link.href = drawCanvas.toDataURL('image/jpeg', 0.95);
  link.click();
  toast('تم تصدير JPEG');
}

function exportWebP() {
  const link = document.createElement('a');
  link.download = 'safwan-studio-artwork.webp';
  link.href = drawCanvas.toDataURL('image/webp', 0.9);
  link.click();
  toast('تم تصدير WebP');
}

function exportTransparentPNG() {
  // Create temp canvas without background
  const temp = document.createElement('canvas');
  temp.width = canvasW; temp.height = canvasH;
  const tCtx = temp.getContext('2d');
  tCtx.drawImage(drawCanvas, 0, 0);
  const link = document.createElement('a');
  link.download = 'safwan-studio-transparent.png';
  link.href = temp.toDataURL('image/png');
  link.click();
  toast('تم تصدير PNG شفاف');
}

function saveProject() {
  const data = {
    w: canvasW, h: canvasH,
    layers: layers,
    canvas: drawCanvas.toDataURL()
  };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = 'safwan-studio-project.json';
  link.href = URL.createObjectURL(blob);
  link.click();
  toast('تم حفظ المشروع');
}

// ===== TOOLS ACTIONS =====
function doCopy() {
  drawCanvas.toBlob(blob => {
    navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).catch(() => {});
  });
  toast('تم النسخ');
}

function doPaste() {
  navigator.clipboard.read().then(items => {
    for (const item of items) {
      if (item.types.includes('image/png')) {
        item.getType('image/png').then(blob => {
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => { drawCtx.drawImage(img, 0, 0); saveHistory(); };
          img.src = url;
        });
      }
    }
  }).catch(() => toast('لا يوجد صورة في الحافظة'));
}

function doCut() { doCopy(); clearCanvas(); }

function selectAll() { toast('تم تحديد الكل'); }

function clearCanvas() {
  if (!confirm('هل تريد مسح اللوحة بالكامل؟')) return;
  drawCtx.clearRect(0, 0, canvasW, canvasH);
  drawCtx.fillStyle = '#ffffff';
  drawCtx.fillRect(0, 0, canvasW, canvasH);
  saveHistory();
  toast('تم مسح اللوحة');
}

// ===== FLOOD FILL =====
function floodFill(startX, startY, fillColor) {
  const imageData = drawCtx.getImageData(0, 0, canvasW, canvasH);
  const data = imageData.data;
  const idx = (startY * canvasW + startX) * 4;
  const targetR = data[idx], targetG = data[idx+1], targetB = data[idx+2], targetA = data[idx+3];
  
  const fillR = parseInt(fillColor.slice(1,3), 16);
  const fillG = parseInt(fillColor.slice(3,5), 16);
  const fillB = parseInt(fillColor.slice(5,7), 16);
  
  if (targetR === fillR && targetG === fillG && targetB === fillB) return;
  
  const stack = [[startX, startY]];
  const visited = new Uint8Array(canvasW * canvasH);
  
  function match(i) {
    return Math.abs(data[i] - targetR) < 30 && Math.abs(data[i+1] - targetG) < 30 && Math.abs(data[i+2] - targetB) < 30;
  }
  
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= canvasW || y < 0 || y >= canvasH) continue;
    const i = (y * canvasW + x) * 4;
    const vi = y * canvasW + x;
    if (visited[vi] || !match(i)) continue;
    visited[vi] = 1;
    data[i] = fillR; data[i+1] = fillG; data[i+2] = fillB; data[i+3] = 255;
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  
  drawCtx.putImageData(imageData, 0, 0);
  toast('تم ملء المنطقة');
}

// ===== COLOR PICKER =====
function pickColor(x, y) {
  const p = drawCtx.getImageData(x, y, 1, 1).data;
  const hex = '#' + [p[0],p[1],p[2]].map(v => v.toString(16).padStart(2,'0')).join('');
  selectColor(hex, null);
  toast('تم اختيار اللون: ' + hex);
}

// ===== ZOOM =====
function zoomIn() {
  zoom = Math.min(zoom * 1.25, 32);
  applyZoom();
}

function zoomOut() {
  zoom = Math.max(zoom / 1.25, 0.05);
  applyZoom();
}

function zoomFit() {
  const area = document.getElementById('canvasArea');
  const scaleX = (area.clientWidth - 100) / canvasW;
  const scaleY = (area.clientHeight - 60) / canvasH;
  zoom = Math.min(scaleX, scaleY) * 0.9;
  applyZoom();
}

function applyZoom() {
  drawCanvas.style.width = (canvasW * zoom) + 'px';
  drawCanvas.style.height = (canvasH * zoom) + 'px';
  const pct = Math.round(zoom * 100) + '%';
  document.getElementById('zoomDisplay').textContent = pct;
  document.getElementById('zoomPct').textContent = pct;
  document.getElementById('canvasChecker').style.width = drawCanvas.style.width;
  document.getElementById('canvasChecker').style.height = drawCanvas.style.height;
}

// ===== GRID =====
function toggleGrid() {
  showGrid = !showGrid;
  document.getElementById('bgGrid').style.display = showGrid ? 'block' : 'none';
  toast(showGrid ? 'الشبكة مفعلة' : 'الشبكة مخفية');
}

function toggleRuler() {
  showRuler = !showRuler;
  toast(showRuler ? 'المسطرة مفعلة' : 'المسطرة مخفية');
}

function togglePerspGrid() {
  toast('شبكة المنظور');
}

function toggleChecker() {
  const checker = document.getElementById('canvasChecker');
  const toggle = document.getElementById('checkerToggle');
  const visible = checker.style.display === 'block';
  checker.style.display = visible ? 'none' : 'block';
  toggle.classList.toggle('on', !visible);
  toast(!visible ? 'خلفية شطرنج مفعلة' : 'خلفية شطرنج مخفية');
}

// ===== IMAGE OPS =====
function flipH() {
  const temp = document.createElement('canvas');
  temp.width = canvasW; temp.height = canvasH;
  const tCtx = temp.getContext('2d');
  tCtx.translate(canvasW, 0);
  tCtx.scale(-1, 1);
  tCtx.drawImage(drawCanvas, 0, 0);
  drawCtx.clearRect(0, 0, canvasW, canvasH);
  drawCtx.drawImage(temp, 0, 0);
  saveHistory();
  toast('قلب أفقي');
}

function flipV() {
  const temp = document.createElement('canvas');
  temp.width = canvasW; temp.height = canvasH;
  const tCtx = temp.getContext('2d');
  tCtx.translate(0, canvasH);
  tCtx.scale(1, -1);
  tCtx.drawImage(drawCanvas, 0, 0);
  drawCtx.clearRect(0, 0, canvasW, canvasH);
  drawCtx.drawImage(temp, 0, 0);
  saveHistory();
  toast('قلب رأسي');
}

function rotateCW() {
  const temp = document.createElement('canvas');
  temp.width = canvasH; temp.height = canvasW;
  const tCtx = temp.getContext('2d');
  tCtx.translate(canvasH / 2, canvasW / 2);
  tCtx.rotate(Math.PI / 2);
  tCtx.drawImage(drawCanvas, -canvasW/2, -canvasH/2);
  drawCtx.clearRect(0, 0, canvasW, canvasH);
  drawCtx.drawImage(temp, 0, 0, canvasW, canvasH);
  saveHistory();
  toast('تدوير 90° يميناً');
}

// ===== REFERENCE IMAGE =====
function importReference() {
  document.getElementById('refInput').click();
}

function handleRefImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    refImage = img;
    drawCtx.save();
    drawCtx.globalAlpha = document.getElementById('refOpacity').value / 100;
    drawCtx.drawImage(img, 0, 0, canvasW, canvasH);
    drawCtx.restore();
    toast('تم استيراد صورة المرجع');
  };
  img.src = url;
}

function updateRefOpacity() {
  const val = document.getElementById('refOpacity').value;
  document.getElementById('refOpacityVal').textContent = val + '%';
}

function toggleRefLock() {
  refLocked = !refLocked;
  toast(refLocked ? 'طبقة المرجع مقفلة' : 'طبقة المرجع مفتوحة');
}

function removeReference() {
  refImage = null;
  toast('تم حذف صورة المرجع');
}

// ===== FILE OPEN =====
function openImage() { document.getElementById('fileInput').click(); }

function handleFileOpen(e) {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    drawCtx.drawImage(img, 0, 0, canvasW, canvasH);
    saveHistory();
    toast('تم فتح الصورة');
  };
  img.src = url;
}

// ===== NEW CANVAS DIALOG =====
function showNewCanvas() { document.getElementById('newCanvasDialog').classList.add('open'); }
function closeNewCanvas() { document.getElementById('newCanvasDialog').classList.remove('open'); }

function applyPreset(w, h) {
  document.getElementById('newW').value = w;
  document.getElementById('newH').value = h;
}

function createNewCanvas() {
  const w = parseInt(document.getElementById('newW').value) || 1920;
  const h = parseInt(document.getElementById('newH').value) || 1080;
  const bg = document.getElementById('newBg').value;
  
  canvasW = w; canvasH = h;
  drawCanvas.width = w; drawCanvas.height = h;
  
  if (bg === 'white') { drawCtx.fillStyle = '#fff'; drawCtx.fillRect(0, 0, w, h); }
  else if (bg === 'black') { drawCtx.fillStyle = '#000'; drawCtx.fillRect(0, 0, w, h); }
  // transparent = clear
  
  document.getElementById('canvasSizeDisplay').textContent = w + ' × ' + h + 'px';
  document.getElementById('propW').value = w;
  document.getElementById('propH').value = h;
  
  zoomFit();
  closeNewCanvas();
  history = []; historyIndex = -1;
  saveHistory();
  toast('تم إنشاء لوحة ' + w + '×' + h);
}

// ===== SETTINGS =====
function openSettings() { document.getElementById('settingsOverlay').classList.add('open'); }
function closeSettings() { document.getElementById('settingsOverlay').classList.remove('open'); }
function closeSettingsOutside(e) { if (e.target === document.getElementById('settingsOverlay')) closeSettings(); }

function changeAccent() {
  const color = document.getElementById('accentColor').value;
  document.documentElement.style.setProperty('--accent1', color);
  toast('تم تغيير اللون الرئيسي');
}

// ===== THEME =====
function toggleTheme() {
  isDark = !isDark;
  document.getElementById('studioBody').classList.toggle('light-mode', !isDark);
  const icon = document.getElementById('studioThemeIcon');
  const toggle = document.getElementById('darkModeToggle');
  icon.innerHTML = isDark
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  if (toggle) toggle.classList.toggle('on', isDark);
  toast(isDark ? 'الوضع الليلي' : 'الوضع النهاري');
}

// ===== PANELS =====
function switchTab(tab) {
  ['brush', 'color', 'layers', 'props'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
    document.getElementById('content-' + t).style.display = t === tab ? 'block' : 'none';
  });
}

// ===== STATUS =====
function updateCursorPos(e) {
  const { x, y } = getCanvasCoords(e);
  document.getElementById('cursorPos').textContent = Math.round(x) + ', ' + Math.round(y);
}

function updateStatusBar() {
  document.getElementById('statusLayers').textContent = layers.length + ' ' + (layers.length === 1 ? 'طبقة' : 'طبقات');
  document.getElementById('statusHistory').textContent = Math.max(0, historyIndex) + ' خطوة';
}

// ===== KEYBOARD SHORTCUTS =====
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const ctrl = e.ctrlKey || e.metaKey;
    
    if (ctrl) {
      switch (e.key.toLowerCase()) {
        case 'z': e.preventDefault(); doUndo(); break;
        case 'y': e.preventDefault(); doRedo(); break;
        case 'c': e.preventDefault(); doCopy(); break;
        case 'v': e.preventDefault(); doPaste(); break;
        case 'x': e.preventDefault(); doCut(); break;
        case 's': e.preventDefault(); saveProject(); break;
        case 'e': e.preventDefault(); exportPNG(); break;
        case 'a': e.preventDefault(); selectAll(); break;
        case 'n': e.preventDefault(); showNewCanvas(); break;
        case 'g': e.preventDefault(); toggleGrid(); break;
        case '=': case '+': e.preventDefault(); zoomIn(); break;
        case '-': e.preventDefault(); zoomOut(); break;
        case '0': e.preventDefault(); zoomFit(); break;
      }
    } else {
      switch (e.key.toLowerCase()) {
        case 'b': setTool('brush'); break;
        case 'e': setTool('eraser'); break;
        case 'v': setTool('select'); break;
        case 'h': setTool('pan'); break;
        case 't': setTool('text'); break;
        case 'i': setTool('eyedropper'); break;
        case 'r': setTool('rect'); break;
        case 'o': setTool('ellipse'); break;
        case 'l': setTool('lasso'); break;
        case 'w': setTool('magic-wand'); break;
        case 'p': setTool('pencil'); break;
        case 'g': setTool('fill'); break;
        case 'z': setTool('zoom-tool'); break;
        case 'f': document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); break;
        case '[': { const s = document.getElementById('brushSize'); s.value = Math.max(1, parseInt(s.value) - 2); updateBrush(); } break;
        case ']': { const s = document.getElementById('brushSize'); s.value = Math.min(200, parseInt(s.value) + 2); updateBrush(); } break;
      }
    }
  });

  // Scroll to zoom
  document.getElementById('canvasArea').addEventListener('wheel', e => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn(); else zoomOut();
  }, { passive: false });
}

// ===== TOAST =====
function toast(msg) {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
