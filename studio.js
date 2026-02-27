/* ============================================
   studio.js - الاستوديو الاحترافي الكامل
   ============================================ */

'use strict';

// ============================================
// الحالة العامة
// ============================================
const S = {
  project: null,
  projectType: 'static',
  canvasWidth: 1080,
  canvasHeight: 1080,
  background: '#ffffff',
  fps: 24,
  dpi: 300,

  currentTool: 'brush',
  previousTool: 'brush',

  fgColor: '#1a1a2e',
  bgColor: '#ffffff',

  brush: {
    size: 20, opacity: 1, flow: 1, smooth: 50, hardness: 0.8, spacing: 5,
    type: 'safwan-round', name: 'فرشاة صفوان الدائرية'
  },

  zoom: 1,
  panX: 0, panY: 0,

  isDrawing: false,
  lastX: 0, lastY: 0,
  lastPressure: 0.5,
  brushPoints: [],

  shapeStart: null,
  shapeEnd: null,

  layers: [],
  activeLayerIdx: 0,

  history: [],
  historyIdx: -1,
  maxHistory: 50,

  showGrid: false,
  showRulers: true,
  snapToGrid: false,
  gridSize: 40,

  frames: [],
  currentFrame: 0,
  isPlaying: false,
  loop: true,
  playInterval: null,

  refImage: null,
  refOpacity: 0.5,
  refScale: 1,
  refX: 0, refY: 0,
  refLocked: false,

  selection: null,
  clipboard: null,

  mainCanvas: null,
  mainCtx: null,
  overlayCanvas: null,
  overlayCtx: null,
};

// ============================================
// التهيئة
// ============================================
window.addEventListener('DOMContentLoaded', initStudio);

function initStudio() {
  const theme = localStorage.getItem('safwan-theme') || 'dark';
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    const sw = document.getElementById('darkModeSwitch');
    if (sw) sw.checked = false;
  } else {
    const sw = document.getElementById('darkModeSwitch');
    if (sw) sw.checked = true;
  }
  updateThemeToggle();

  renderProjectsGrid();

  const currentProject = localStorage.getItem('safwan-current-project');
  if (currentProject) {
    try {
      const proj = JSON.parse(currentProject);
      localStorage.removeItem('safwan-current-project');
      setTimeout(() => openProject(proj), 200);
    } catch (e) {}
  }

  initKeyboardShortcuts();
}

// ============================================
// إدارة المشاريع
// ============================================
function getProjects() {
  try { return JSON.parse(localStorage.getItem('safwan-projects') || '[]'); }
  catch (e) { return []; }
}

function saveProjects(projects) {
  localStorage.setItem('safwan-projects', JSON.stringify(projects));
}

function renderProjectsGrid() {
  const grid = document.getElementById('projectsGrid');
  const empty = document.getElementById('psEmpty');
  if (!grid) return;
  const projects = getProjects();

  grid.querySelectorAll('.project-card').forEach(c => c.remove());

  if (projects.length === 0) {
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  projects.forEach(proj => {
    const card = createProjectCard(proj);
    grid.appendChild(card);
  });
}

function createProjectCard(proj) {
  const card = document.createElement('div');
  card.className = 'project-card fade-in';
  const typeLabel = proj.type === 'animated' ? 'متحرك' : 'ثابت';
  const typeCls = proj.type === 'animated' ? 'animated' : 'static';
  const date = new Date(proj.created || Date.now()).toLocaleDateString('ar');
  const bgStyle = proj.background && proj.background !== 'transparent' ? `background:${proj.background}` : 'background:#eee';

  card.innerHTML = `
    <div class="pc-thumbnail">
      <div style="width:100%;height:100%;${bgStyle};display:flex;align-items:center;justify-content:center;">
        ${proj.thumbnail ? `<img src="${proj.thumbnail}" style="width:100%;height:100%;object-fit:cover">` : `<svg viewBox="0 0 60 60" width="40" height="40" opacity="0.2"><path d="M10,50 Q20,20 30,35 Q40,50 50,10" fill="none" stroke="#888" stroke-width="3" stroke-linecap="round"/></svg>`}
      </div>
      <div class="pc-type-badge ${typeCls}">${typeLabel}</div>
    </div>
    <div class="pc-actions">
      <button class="pca-btn" onclick="event.stopPropagation();deleteProjectById('${proj.id}')" title="حذف">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
      </button>
    </div>
    <div class="pc-info">
      <div class="pc-name">${proj.name || 'بدون عنوان'}</div>
      <div class="pc-meta">
        <span>${proj.width}×${proj.height}</span>
        <span>${date}</span>
      </div>
    </div>
  `;
  card.addEventListener('click', () => openProject(proj));
  return card;
}

function deleteProjectById(id) {
  if (!confirm('هل تريد حذف هذا المشروع نهائيًا؟')) return;
  const projects = getProjects().filter(p => p.id !== id);
  saveProjects(projects);
  renderProjectsGrid();
  showToast('تم حذف المشروع', 'error');
}

function filterProjects(query) {
  const projects = getProjects();
  const filtered = query ? projects.filter(p => (p.name || '').includes(query)) : projects;
  const grid = document.getElementById('projectsGrid');
  grid.querySelectorAll('.project-card').forEach(c => c.remove());
  const empty = document.getElementById('psEmpty');
  if (filtered.length === 0) { if (empty) empty.style.display = 'flex'; return; }
  if (empty) empty.style.display = 'none';
  filtered.forEach(p => grid.appendChild(createProjectCard(p)));
}

// ============================================
// فتح مشروع
// ============================================
function openProject(proj) {
  S.project = { ...proj };
  S.projectType = proj.type || 'static';
  S.canvasWidth = parseInt(proj.width) || 1080;
  S.canvasHeight = parseInt(proj.height) || 1080;
  S.background = proj.background || '#ffffff';
  S.fps = parseInt(proj.fps) || 24;
  S.dpi = parseInt(proj.dpi) || 300;

  document.getElementById('projectsScreen').style.display = 'none';
  const app = document.getElementById('studioApp');
  app.style.display = 'flex';
  app.style.flexDirection = 'column';

  // شريط الأنيميشن
  const animBar = document.getElementById('animationBar');
  if (animBar) animBar.style.display = S.projectType === 'animated' ? 'flex' : 'none';
  const exportVideoOpt = document.getElementById('exportVideoOpt');
  if (exportVideoOpt) exportVideoOpt.style.display = S.projectType === 'animated' ? 'block' : 'none';

  setTimeout(() => {
    initCanvas();
    initLayers();
    if (S.projectType === 'animated') initAnimation(proj);
    updateProjectName();
    updateCanvasInfo();
    initColorPicker();
    initBrushList();
    initColorPalette();
    fitCanvasToView();
    drawRulers();
  }, 100);
}

// ============================================
// مشروع جديد من الاستوديو
// ============================================
const SNP = { width: 1080, height: 1080, bg: '#ffffff', fps: 24, type: 'static' };

function showNewProjectFromStudio() {
  document.getElementById('studioNewProjectModal').classList.add('active');
}

function hideStudioNewProject() {
  document.getElementById('studioNewProjectModal').classList.remove('active');
}

document.getElementById('studioNewProjectModal')?.addEventListener('click', function(e) {
  if (e.target === this) hideStudioNewProject();
});

function switchStudioTab(type) {
  SNP.type = type;
  document.querySelectorAll('#studioNewProjectModal .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === type);
  });
  const as = document.getElementById('studioAnimSettings');
  if (as) as.style.display = type === 'animated' ? 'block' : 'none';
}

function selectStudioSize(btn, w, h) {
  SNP.width = w; SNP.height = h;
  document.querySelectorAll('#studioNewProjectModal .size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const cs = document.getElementById('studioCustomSize');
  if (cs) cs.style.display = 'none';
}

function toggleStudioCustomSize() {
  const cs = document.getElementById('studioCustomSize');
  if (cs) cs.style.display = cs.style.display === 'none' ? 'flex' : 'none';
}

function selectStudioBg(btn, color) {
  SNP.bg = color;
  document.querySelectorAll('#studioNewProjectModal .bg-opt').forEach(b => {
    b.style.outline = 'none';
    const sv = b.querySelector('svg'); if (sv) sv.style.opacity = '0';
  });
  if (btn) {
    btn.style.outline = '2px solid #ff6b35';
    const sv = btn.querySelector('svg'); if (sv) sv.style.opacity = '1';
  }
}

function selectStudioFPS(btn, fps) {
  SNP.fps = fps;
  document.querySelectorAll('#studioNewProjectModal .fps-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function createStudioProject() {
  const w = parseInt(document.getElementById('sCustomW')?.value) || SNP.width;
  const h = parseInt(document.getElementById('sCustomH')?.value) || SNP.height;
  const proj = {
    id: Date.now().toString(),
    name: `مشروع ${new Date().toLocaleDateString('ar')}`,
    width: w, height: h,
    background: SNP.bg, fps: SNP.fps,
    type: SNP.type, created: Date.now()
  };
  const projects = getProjects();
  projects.unshift(proj);
  saveProjects(projects);
  hideStudioNewProject();
  openProject(proj);
}

function exitToProjects() {
  autoSaveProject();
  if (S.isPlaying) { clearInterval(S.playInterval); S.isPlaying = false; }
  document.getElementById('studioApp').style.display = 'none';
  document.getElementById('projectsScreen').style.display = 'flex';
  renderProjectsGrid();
}

function newFileFromMenu() {
  closeAllMenus();
  showNewProjectFromStudio();
}

// ============================================
// تهيئة الكانفاس
// ============================================
function initCanvas() {
  const wrapper = document.getElementById('canvasWrapper');
  wrapper.innerHTML = '';
  wrapper.style.position = 'relative';
  wrapper.style.width = S.canvasWidth + 'px';
  wrapper.style.height = S.canvasHeight + 'px';

  S.mainCanvas = document.createElement('canvas');
  S.mainCanvas.id = 'mainCanvas';
  S.mainCanvas.width = S.canvasWidth;
  S.mainCanvas.height = S.canvasHeight;
  S.mainCanvas.style.display = 'block';
  S.mainCtx = S.mainCanvas.getContext('2d', { willReadFrequently: true });

  S.overlayCanvas = document.createElement('canvas');
  S.overlayCanvas.width = S.canvasWidth;
  S.overlayCanvas.height = S.canvasHeight;
  S.overlayCanvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
  S.overlayCtx = S.overlayCanvas.getContext('2d', { willReadFrequently: true });

  wrapper.appendChild(S.mainCanvas);
  wrapper.appendChild(S.overlayCanvas);

  S.mainCanvas.addEventListener('pointerdown', onPointerDown);
  S.mainCanvas.addEventListener('pointermove', onPointerMove);
  S.mainCanvas.addEventListener('pointerup', onPointerUp);
  S.mainCanvas.addEventListener('pointerleave', onPointerUp);
  S.mainCanvas.addEventListener('wheel', onWheel, { passive: false });
  S.mainCanvas.addEventListener('contextmenu', e => e.preventDefault());
  S.mainCanvas.style.touchAction = 'none';
}

function fillBackground() {
  if (!S.mainCtx) return;
  S.mainCtx.save();
  S.mainCtx.setTransform(1, 0, 0, 1, 0, 0);
  if (S.background === 'transparent') {
    const sz = 20;
    for (let y = 0; y < S.canvasHeight; y += sz)
      for (let x = 0; x < S.canvasWidth; x += sz) {
        S.mainCtx.fillStyle = ((Math.floor(x/sz)+Math.floor(y/sz))%2===0) ? '#cccccc' : '#ffffff';
        S.mainCtx.fillRect(x, y, sz, sz);
      }
  } else {
    S.mainCtx.fillStyle = S.background;
    S.mainCtx.fillRect(0, 0, S.canvasWidth, S.canvasHeight);
  }
  S.mainCtx.restore();
}

// ============================================
// الطبقات
// ============================================
function initLayers() {
  S.layers = [];
  S.history = [];
  S.historyIdx = -1;

  if (S.project?.layersData && S.project.layersData.length > 0) {
    const promises = S.project.layersData.map((ld, i) => new Promise(res => {
      const canvas = document.createElement('canvas');
      canvas.width = S.canvasWidth; canvas.height = S.canvasHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ld.data) {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); res(); };
        img.onerror = () => res();
        img.src = ld.data;
      } else res();
      S.layers.push({ id: ld.id||Date.now()+i, name: ld.name||`طبقة ${i+1}`, canvas, ctx, opacity: ld.opacity??1, visible: ld.visible!==false, locked: ld.locked||false, blendMode: ld.blendMode||'source-over' });
    }));
    Promise.all(promises).then(() => { renderLayers(); renderLayersList(); });
  } else {
    addLayer(true);
  }
}

function addLayer(silent = false) {
  const canvas = document.createElement('canvas');
  canvas.width = S.canvasWidth; canvas.height = S.canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const layer = { id: Date.now(), name: `طبقة ${S.layers.length + 1}`, canvas, ctx, opacity: 1, visible: true, locked: false, blendMode: 'source-over' };
  S.layers.splice(S.activeLayerIdx, 0, layer);
  S.activeLayerIdx = S.layers.indexOf(layer);
  renderLayersList();
  if (!silent) { renderLayers(); showToast('تمت إضافة طبقة جديدة'); }
}

function deleteLayer() {
  if (S.layers.length <= 1) { showToast('لا يمكن حذف الطبقة الوحيدة', 'error'); return; }
  S.layers.splice(S.activeLayerIdx, 1);
  S.activeLayerIdx = Math.max(0, S.activeLayerIdx - 1);
  renderLayersList(); renderLayers(); showToast('تم حذف الطبقة');
}

function duplicateLayer() {
  const src = S.layers[S.activeLayerIdx];
  const canvas = document.createElement('canvas');
  canvas.width = S.canvasWidth; canvas.height = S.canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(src.canvas, 0, 0);
  const layer = { id: Date.now(), name: src.name + ' (نسخة)', canvas, ctx, opacity: src.opacity, visible: src.visible, locked: src.locked, blendMode: src.blendMode };
  S.layers.splice(S.activeLayerIdx, 0, layer);
  renderLayersList(); renderLayers(); showToast('تم تكرار الطبقة');
}

function mergeLayerDown() {
  if (S.activeLayerIdx >= S.layers.length - 1) { showToast('لا توجد طبقة أدناه', 'error'); return; }
  const top = S.layers[S.activeLayerIdx];
  const bot = S.layers[S.activeLayerIdx + 1];
  bot.ctx.save();
  bot.ctx.globalAlpha = top.opacity;
  bot.ctx.globalCompositeOperation = top.blendMode;
  bot.ctx.drawImage(top.canvas, 0, 0);
  bot.ctx.restore();
  S.layers.splice(S.activeLayerIdx, 1);
  S.activeLayerIdx = Math.max(0, S.activeLayerIdx - 1);
  renderLayersList(); renderLayers(); showToast('تم دمج الطبقة');
}

function flattenLayers() {
  if (!confirm('دمج جميع الطبقات في طبقة واحدة؟')) return;
  const canvas = document.createElement('canvas');
  canvas.width = S.canvasWidth; canvas.height = S.canvasHeight;
  const ctx = canvas.getContext('2d');
  if (S.background !== 'transparent') { ctx.fillStyle = S.background; ctx.fillRect(0, 0, S.canvasWidth, S.canvasHeight); }
  for (let i = S.layers.length - 1; i >= 0; i--) {
    const l = S.layers[i];
    if (!l.visible) continue;
    ctx.save(); ctx.globalAlpha = l.opacity; ctx.globalCompositeOperation = l.blendMode;
    ctx.drawImage(l.canvas, 0, 0); ctx.restore();
  }
  S.layers = [{ id: Date.now(), name: 'طبقة 1', canvas, ctx, opacity: 1, visible: true, locked: false, blendMode: 'source-over' }];
  S.activeLayerIdx = 0;
  renderLayersList(); renderLayers(); showToast('تم دمج جميع الطبقات');
}

function setLayerOpacity(val) {
  const l = S.layers[S.activeLayerIdx];
  if (!l) return;
  l.opacity = val / 100;
  document.getElementById('layerOpacityVal').textContent = val + '%';
  renderLayers();
}

function setLayerBlendMode(mode) {
  const l = S.layers[S.activeLayerIdx];
  if (!l) return;
  l.blendMode = mode;
  renderLayers();
}

function toggleLayerVisibility(idx) {
  S.layers[idx].visible = !S.layers[idx].visible;
  renderLayersList(); renderLayers();
}

function toggleLayerLock(idx) {
  S.layers[idx].locked = !S.layers[idx].locked;
  renderLayersList();
}

function selectLayer(idx) {
  S.activeLayerIdx = idx;
  renderLayersList();
  const l = S.layers[idx];
  if (l) {
    document.getElementById('layerOpacity').value = Math.round(l.opacity * 100);
    document.getElementById('layerOpacityVal').textContent = Math.round(l.opacity * 100) + '%';
    document.getElementById('blendModeSelect').value = l.blendMode;
  }
}

function renderLayersList() {
  const list = document.getElementById('layersList');
  if (!list) return;
  list.innerHTML = '';
  S.layers.forEach((layer, idx) => {
    const item = document.createElement('div');
    item.className = 'layer-item' + (idx === S.activeLayerIdx ? ' active' : '');

    const thumb = document.createElement('div');
    thumb.className = 'layer-thumb';
    const tc = document.createElement('canvas');
    tc.width = 36; tc.height = 36;
    const tCtx = tc.getContext('2d');
    tCtx.drawImage(layer.canvas, 0, 0, 36, 36);
    thumb.appendChild(tc);

    const info = document.createElement('div');
    info.className = 'layer-info';
    const nameWrap = document.createElement('div');
    nameWrap.className = 'layer-name';
    const nameInput = document.createElement('input');
    nameInput.value = layer.name;
    nameInput.addEventListener('change', () => layer.name = nameInput.value);
    nameInput.addEventListener('click', e => e.stopPropagation());
    nameWrap.appendChild(nameInput);
    const meta = document.createElement('div');
    meta.className = 'layer-meta';
    meta.textContent = Math.round(layer.opacity * 100) + '%' + (layer.locked ? ' · مقفل' : '');
    info.appendChild(nameWrap); info.appendChild(meta);

    const controls = document.createElement('div');
    controls.className = 'layer-controls';

    const visBtn = document.createElement('button');
    visBtn.className = 'lc-btn' + (layer.visible ? ' active' : '');
    visBtn.title = layer.visible ? 'إخفاء' : 'إظهار';
    visBtn.innerHTML = layer.visible
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 0 1-4.24-4.24M1 1l22 22"/></svg>`;
    visBtn.addEventListener('click', e => { e.stopPropagation(); toggleLayerVisibility(idx); });

    const lockBtn = document.createElement('button');
    lockBtn.className = 'lc-btn' + (layer.locked ? ' active' : '');
    lockBtn.title = layer.locked ? 'فك القفل' : 'قفل';
    lockBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 ${layer.locked ? '10 0v4' : '9.9-1'}"/></svg>`;
    lockBtn.addEventListener('click', e => { e.stopPropagation(); toggleLayerLock(idx); });

    controls.appendChild(visBtn); controls.appendChild(lockBtn);
    item.appendChild(thumb); item.appendChild(info); item.appendChild(controls);
    item.addEventListener('click', () => selectLayer(idx));
    list.appendChild(item);
  });
  const ci = document.getElementById('ciLayers');
  if (ci) ci.textContent = S.layers.length;
}

function renderLayers() {
  if (!S.mainCtx) return;
  S.mainCtx.clearRect(0, 0, S.canvasWidth, S.canvasHeight);

  if (S.background === 'transparent') {
    const sz = 20;
    for (let y = 0; y < S.canvasHeight; y += sz)
      for (let x = 0; x < S.canvasWidth; x += sz) {
        S.mainCtx.fillStyle = ((Math.floor(x/sz)+Math.floor(y/sz))%2===0) ? '#cccccc' : '#ffffff';
        S.mainCtx.fillRect(x, y, sz, sz);
      }
  } else {
    S.mainCtx.fillStyle = S.background;
    S.mainCtx.fillRect(0, 0, S.canvasWidth, S.canvasHeight);
  }

  if (S.refImage) {
    S.mainCtx.save();
    S.mainCtx.globalAlpha = S.refOpacity;
    const rw = S.refImage.naturalWidth * S.refScale;
    const rh = S.refImage.naturalHeight * S.refScale;
    S.mainCtx.drawImage(S.refImage, S.refX, S.refY, rw, rh);
    S.mainCtx.restore();
  }

  for (let i = S.layers.length - 1; i >= 0; i--) {
    const l = S.layers[i];
    if (!l.visible) continue;
    S.mainCtx.save();
    S.mainCtx.globalAlpha = l.opacity;
    S.mainCtx.globalCompositeOperation = l.blendMode;
    S.mainCtx.drawImage(l.canvas, 0, 0);
    S.mainCtx.restore();
  }

  if (S.showGrid) drawGrid();
}

function drawGrid() {
  S.mainCtx.save();
  S.mainCtx.strokeStyle = 'rgba(128,128,200,0.2)';
  S.mainCtx.lineWidth = 0.5;
  for (let x = 0; x <= S.canvasWidth; x += S.gridSize) {
    S.mainCtx.beginPath(); S.mainCtx.moveTo(x, 0); S.mainCtx.lineTo(x, S.canvasHeight); S.mainCtx.stroke();
  }
  for (let y = 0; y <= S.canvasHeight; y += S.gridSize) {
    S.mainCtx.beginPath(); S.mainCtx.moveTo(0, y); S.mainCtx.lineTo(S.canvasWidth, y); S.mainCtx.stroke();
  }
  S.mainCtx.restore();
}

// ============================================
// أحداث الرسم
// ============================================
function getCanvasPos(e) {
  const rect = S.mainCanvas.getBoundingClientRect();
  const scaleX = S.canvasWidth / rect.width;
  const scaleY = S.canvasHeight / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
    p: e.pressure > 0 ? e.pressure : 0.5
  };
}

function onPointerDown(e) {
  e.preventDefault();
  if (e.button === 1) { setTool('hand'); return; }
  const layer = S.layers[S.activeLayerIdx];
  if (!layer || layer.locked) { showToast('الطبقة مقفلة', 'error'); return; }
  const pos = getCanvasPos(e);
  S.isDrawing = true;
  S.lastX = pos.x; S.lastY = pos.y; S.lastPressure = pos.p;
  S.brushPoints = [{ x: pos.x, y: pos.y, p: pos.p }];
  S.mainCanvas.setPointerCapture(e.pointerId);
  saveHistory();
  handleToolDown(pos, layer, e);
}

function onPointerMove(e) {
  const pos = getCanvasPos(e);
  updateStatusCoords(Math.round(pos.x), Math.round(pos.y));
  if (!S.isDrawing) return;
  const layer = S.layers[S.activeLayerIdx];
  if (!layer || layer.locked) return;
  handleToolMove(pos, layer, e);
  S.lastX = pos.x; S.lastY = pos.y; S.lastPressure = pos.p;
}

function onPointerUp(e) {
  if (!S.isDrawing) return;
  S.isDrawing = false;
  const layer = S.layers[S.activeLayerIdx];
  if (layer) handleToolUp(layer, e);
  S.overlayCtx.clearRect(0, 0, S.canvasWidth, S.canvasHeight);
  S.brushPoints = [];
  S.shapeStart = null; S.shapeEnd = null;
  renderLayersList();
  autoSaveProject();
}

function onWheel(e) {
  e.preventDefault();
  if (e.ctrlKey) {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(S.zoom * delta);
  } else {
    // تمرير عادي
  }
}

// ============================================
// منطق الأدوات
// ============================================
function handleToolDown(pos, layer, e) {
  switch (S.currentTool) {
    case 'brush': case 'pencil': case 'pen': startBrushStroke(pos, layer); break;
    case 'eraser': startEraser(pos, layer); break;
    case 'fill': floodFill(layer.ctx, Math.round(pos.x), Math.round(pos.y), hexToRgb(S.fgColor)); renderLayers(); break;
    case 'spray': doSpray(pos, layer); break;
    case 'eyedropper': pickColor(pos); break;
    case 'line': case 'rect': case 'circle': case 'triangle': case 'star': case 'polygon': case 'bezier':
      S.shapeStart = { x: pos.x, y: pos.y }; break;
    case 'smudge': startSmudge(pos, layer); break;
    case 'clone': startClone(pos, layer); break;
    case 'text': break;
    case 'crop': S.shapeStart = { x: pos.x, y: pos.y }; break;
    case 'rect-select': case 'ellipse-select': case 'lasso':
      S.shapeStart = { x: pos.x, y: pos.y }; break;
  }
}

function handleToolMove(pos, layer, e) {
  switch (S.currentTool) {
    case 'brush': case 'pencil': case 'pen': continueBrushStroke(pos, layer); break;
    case 'eraser': continueEraser(pos, layer); break;
    case 'spray': doSpray(pos, layer); break;
    case 'smudge': continueSmudge(pos, layer); break;
    case 'line': previewShape('line', pos); break;
    case 'rect': previewShape('rect', pos); break;
    case 'circle': previewShape('circle', pos); break;
    case 'triangle': previewShape('triangle', pos); break;
    case 'star': previewShape('star', pos); break;
    case 'hand': panCanvas(e); break;
    case 'rect-select': previewShape('rect-select', pos); break;
    case 'ellipse-select': previewShape('ellipse-select', pos); break;
    case 'lasso': continueLasso(pos); break;
    case 'crop': previewShape('crop', pos); break;
  }
}

function handleToolUp(layer, e) {
  switch (S.currentTool) {
    case 'line': case 'rect': case 'circle': case 'triangle': case 'star':
      if (S.shapeStart && S.shapeEnd) finalizeShape(S.currentTool, layer);
      break;
    case 'text': addText(layer); break;
    case 'lasso': finalizeLasso(layer); break;
    case 'crop': finalizeCrop(); break;
  }
  S.overlayCtx.clearRect(0, 0, S.canvasWidth, S.canvasHeight);
}

// ============================================
// الفرشاة الاحترافية
// ============================================
function startBrushStroke(pos, layer) {
  const ctx = layer.ctx;
  const size = getBrushSize(pos.p);
  applyBrushDot(ctx, pos.x, pos.y, size, pos.p);
  renderLayers();
}

function continueBrushStroke(pos, layer) {
  const ctx = layer.ctx;
  const smooth = S.brush.smooth / 100;
  const sx = S.lastX + (pos.x - S.lastX) * (1 - smooth * 0.5);
  const sy = S.lastY + (pos.y - S.lastY) * (1 - smooth * 0.5);
  const size = getBrushSize(pos.p);

  if (S.currentTool === 'pencil') {
    // قلم رصاص: خطوط جافة
    ctx.save();
    ctx.globalAlpha = S.brush.opacity * pos.p * 0.8;
    ctx.strokeStyle = S.fgColor;
    ctx.lineWidth = size * 0.6;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(S.lastX, S.lastY); ctx.lineTo(sx, sy); ctx.stroke();
    ctx.restore();
  } else if (S.brush.hardness < 0.5 || S.brush.type === 'safwan-soft' || S.brush.type === 'texture-watercolor') {
    // فرشاة ناعمة
    const dist = Math.hypot(sx - S.lastX, sy - S.lastY);
    const step = Math.max(1, size * (S.brush.spacing / 100) * 0.5);
    for (let d = 0; d <= dist; d += step) {
      const t = dist > 0 ? d / dist : 0;
      const x = S.lastX + (sx - S.lastX) * t;
      const y = S.lastY + (sy - S.lastY) * t;
      applyBrushDot(ctx, x, y, size, pos.p);
    }
  } else {
    // فرشاة صلبة: خط مستمر
    ctx.save();
    ctx.globalAlpha = S.brush.opacity * S.brush.flow * pos.p;
    ctx.strokeStyle = S.fgColor;
    ctx.lineWidth = size;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(S.lastX, S.lastY);
    ctx.quadraticCurveTo(S.lastX, S.lastY, (S.lastX + sx) / 2, (S.lastY + sy) / 2);
    ctx.stroke();
    ctx.restore();
  }

  renderLayers();
}

function getBrushSize(pressure) {
  return S.brush.size * (0.4 + pressure * 0.6);
}

function applyBrushDot(ctx, x, y, size, pressure) {
  ctx.save();
  const alpha = S.brush.opacity * S.brush.flow * pressure;

  switch (S.brush.type) {
    case 'safwan-soft':
    case 'texture-watercolor':
      drawSoftDot(ctx, x, y, size / 2, S.fgColor, alpha * 0.25);
      break;
    case 'texture-charcoal':
      drawCharcoalDot(ctx, x, y, size / 2, alpha);
      break;
    case 'texture-oil':
      drawOilDot(ctx, x, y, size / 2, alpha);
      break;
    default:
      ctx.globalAlpha = alpha;
      ctx.fillStyle = S.fgColor;
      ctx.beginPath();
      ctx.arc(x, y, size / 2 * S.brush.hardness, 0, Math.PI * 2);
      ctx.fill();
      if (S.brush.hardness < 1) drawSoftDot(ctx, x, y, size / 2, S.fgColor, alpha * 0.2);
  }
  ctx.restore();
}

function drawSoftDot(ctx, x, y, r, color, alpha) {
  const rgb = hexToRgb(color);
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.min(1, alpha)})`);
  grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawCharcoalDot(ctx, x, y, r, alpha) {
  const rgb = hexToRgb(S.fgColor);
  for (let i = 0; i < 8; i++) {
    ctx.globalAlpha = alpha * 0.15 * Math.random();
    ctx.fillStyle = S.fgColor;
    const ox = (Math.random() - 0.5) * r * 1.5;
    const oy = (Math.random() - 0.5) * r * 1.5;
    const sr = Math.random() * r * 0.6 + r * 0.1;
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOilDot(ctx, x, y, r, alpha) {
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillStyle = S.fgColor;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = lightenColor(S.fgColor, 40);
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function lightenColor(hex, amount) {
  const rgb = hexToRgb(hex);
  const r = Math.min(255, rgb.r + amount);
  const g = Math.min(255, rgb.g + amount);
  const b = Math.min(255, rgb.b + amount);
  return `rgb(${r},${g},${b})`;
}

// ========== الممحاة ==========
function startEraser(pos, layer) {
  layer.ctx.save();
  layer.ctx.globalCompositeOperation = 'destination-out';
  layer.ctx.beginPath();
  layer.ctx.arc(pos.x, pos.y, S.brush.size / 2, 0, Math.PI * 2);
  layer.ctx.fillStyle = 'rgba(0,0,0,1)';
  layer.ctx.fill();
  layer.ctx.restore();
  renderLayers();
}

function continueEraser(pos, layer) {
  layer.ctx.save();
  layer.ctx.globalCompositeOperation = 'destination-out';
  layer.ctx.lineWidth = S.brush.size;
  layer.ctx.lineCap = 'round'; layer.ctx.lineJoin = 'round';
  layer.ctx.strokeStyle = 'rgba(0,0,0,1)';
  layer.ctx.beginPath();
  layer.ctx.moveTo(S.lastX, S.lastY);
  layer.ctx.lineTo(pos.x, pos.y);
  layer.ctx.stroke();
  layer.ctx.restore();
  renderLayers();
}

// ========== الرش ==========
function doSpray(pos, layer) {
  const ctx = layer.ctx;
  const radius = S.brush.size;
  const density = Math.floor(radius * 2);
  ctx.save();
  for (let i = 0; i < density; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    const x = pos.x + Math.cos(angle) * r;
    const y = pos.y + Math.sin(angle) * r;
    ctx.globalAlpha = Math.random() * S.brush.opacity * 0.6;
    ctx.fillStyle = S.fgColor;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 1.5 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  renderLayers();
}

// ========== التمويه ==========
function startSmudge(pos, layer) {
  S.smudgeData = layer.ctx.getImageData(0, 0, S.canvasWidth, S.canvasHeight);
}

function continueSmudge(pos, layer) {
  if (!S.smudgeData) return;
  const ctx = layer.ctx;
  const r = S.brush.size / 2;
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.drawImage(layer.canvas, S.lastX - r, S.lastY - r, r * 2, r * 2, pos.x - r, pos.y - r, r * 2, r * 2);
  ctx.restore();
  renderLayers();
}

// ========== الاستنساخ ==========
function startClone(pos, layer) {
  if (!S.cloneSource) {
    S.cloneSource = { x: pos.x, y: pos.y };
    showToast('تم تحديد مصدر الاستنساخ. ارسم للنسخ.');
    return;
  }
  S.cloneOffset = { x: pos.x - S.cloneSource.x, y: pos.y - S.cloneSource.y };
}

// ========== قطارة اللون ==========
function pickColor(pos) {
  const imgData = S.mainCtx.getImageData(Math.round(pos.x), Math.round(pos.y), 1, 1).data;
  const hex = rgbToHex(imgData[0], imgData[1], imgData[2]);
  setFgColor(hex);
  showToast(`اللون: ${hex}`);
  setTool(S.previousTool || 'brush');
}

// ========== تعبئة الفيضان ==========
function floodFill(ctx, startX, startY, fillColor) {
  const imageData = ctx.getImageData(0, 0, S.canvasWidth, S.canvasHeight);
  const data = imageData.data;
  const w = S.canvasWidth, h = S.canvasHeight;

  const getPixel = (x, y) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return [-1, -1, -1, -1];
    const i = (y * w + x) * 4;
    return [data[i], data[i+1], data[i+2], data[i+3]];
  };

  const setPixel = (x, y, r, g, b, a) => {
    const i = (y * w + x) * 4;
    data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = a;
  };

  const targetColor = getPixel(startX, startY);
  if (targetColor[0] === fillColor.r && targetColor[1] === fillColor.g && targetColor[2] === fillColor.b) return;

  const tolerance = 30;
  const match = (c) => Math.abs(c[0]-targetColor[0]) + Math.abs(c[1]-targetColor[1]) + Math.abs(c[2]-targetColor[2]) <= tolerance * 3;

  const stack = [[startX, startY]];
  const visited = new Uint8Array(w * h);
  visited[startY * w + startX] = 1;

  let iterations = 0;
  while (stack.length > 0 && iterations < 500000) {
    iterations++;
    const [x, y] = stack.pop();
    setPixel(x, y, fillColor.r, fillColor.g, fillColor.b, 255);

    const neighbors = [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const vi = ny * w + nx;
      if (visited[vi]) continue;
      visited[vi] = 1;
      if (match(getPixel(nx, ny))) stack.push([nx, ny]);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

// ========== معاينة الأشكال ==========
function previewShape(type, pos) {
  if (!S.shapeStart) return;
  S.shapeEnd = pos;
  S.overlayCtx.clearRect(0, 0, S.canvasWidth, S.canvasHeight);
  S.overlayCtx.save();
  const isDashed = type === 'rect-select' || type === 'ellipse-select' || type === 'crop' || type === 'lasso';
  S.overlayCtx.strokeStyle = isDashed ? 'rgba(255,255,255,0.9)' : S.fgColor;
  S.overlayCtx.lineWidth = isDashed ? 1.5 : S.brush.size;
  S.overlayCtx.lineCap = 'round'; S.overlayCtx.lineJoin = 'round';
  S.overlayCtx.globalAlpha = isDashed ? 1 : S.brush.opacity;
  if (isDashed) S.overlayCtx.setLineDash([6, 4]);

  const x1 = S.shapeStart.x, y1 = S.shapeStart.y;
  const x2 = pos.x, y2 = pos.y;

  switch (type) {
    case 'line':
      S.overlayCtx.beginPath(); S.overlayCtx.moveTo(x1, y1); S.overlayCtx.lineTo(x2, y2); S.overlayCtx.stroke(); break;
    case 'rect': case 'rect-select': case 'crop':
      S.overlayCtx.beginPath(); S.overlayCtx.rect(x1, y1, x2-x1, y2-y1); S.overlayCtx.stroke(); break;
    case 'circle': case 'ellipse-select': {
      const rx = Math.abs(x2-x1)/2, ry = Math.abs(y2-y1)/2;
      const cx = (x1+x2)/2, cy = (y1+y2)/2;
      S.overlayCtx.beginPath(); S.overlayCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); S.overlayCtx.stroke(); break;
    }
    case 'triangle': {
      const mx = (x1+x2)/2;
      S.overlayCtx.beginPath(); S.overlayCtx.moveTo(mx, y1); S.overlayCtx.lineTo(x2, y2); S.overlayCtx.lineTo(x1, y2); S.overlayCtx.closePath(); S.overlayCtx.stroke(); break;
    }
    case 'star': {
      const cx = x1, cy = y1;
      const outer = Math.hypot(x2-cx, y2-cy);
      const inner = outer * 0.4;
      S.overlayCtx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i%2===0 ? outer : inner;
        const angle = (i * Math.PI / 5) - Math.PI/2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        i===0 ? S.overlayCtx.moveTo(x,y) : S.overlayCtx.lineTo(x,y);
      }
      S.overlayCtx.closePath(); S.overlayCtx.stroke(); break;
    }
  }
  S.overlayCtx.restore();
}

function continueLasso(pos) {
  if (!S.lassoPoints) S.lassoPoints = [S.shapeStart];
  S.lassoPoints.push({ x: pos.x, y: pos.y });
  S.overlayCtx.clearRect(0, 0, S.canvasWidth, S.canvasHeight);
  S.overlayCtx.save();
  S.overlayCtx.strokeStyle = 'rgba(255,255,255,0.9)';
  S.overlayCtx.lineWidth = 1.5;
  S.overlayCtx.setLineDash([6, 4]);
  S.overlayCtx.beginPath();
  S.lassoPoints.forEach((p, i) => i===0 ? S.overlayCtx.moveTo(p.x,p.y) : S.overlayCtx.lineTo(p.x,p.y));
  S.overlayCtx.stroke();
  S.overlayCtx.restore();
}

function finalizeLasso() {
  S.lassoPoints = null;
}

function finalizeCrop() {
  if (!S.shapeStart || !S.shapeEnd) return;
  const x = Math.min(S.shapeStart.x, S.shapeEnd.x);
  const y = Math.min(S.shapeStart.y, S.shapeEnd.y);
  const w = Math.abs(S.shapeEnd.x - S.shapeStart.x);
  const h = Math.abs(S.shapeEnd.y - S.shapeStart.y);
  if (w < 10 || h < 10) return;

  S.layers.forEach(l => {
    const nc = document.createElement('canvas');
    nc.width = Math.round(w); nc.height = Math.round(h);
    const nc_ctx = nc.getContext('2d', { willReadFrequently: true });
    nc_ctx.drawImage(l.canvas, Math.round(x), Math.round(y), Math.round(w), Math.round(h), 0, 0, Math.round(w), Math.round(h));
    l.canvas.width = Math.round(w); l.canvas.height = Math.round(h);
    l.ctx.drawImage(nc, 0, 0);
  });

  S.canvasWidth = Math.round(w);
  S.canvasHeight = Math.round(h);
  document.getElementById('canvasWrapper').style.width = w + 'px';
  document.getElementById('canvasWrapper').style.height = h + 'px';
  S.mainCanvas.width = w; S.mainCanvas.height = h;
  S.overlayCanvas.width = w; S.overlayCanvas.height = h;
  renderLayers();
  updateCanvasInfo();
  showToast('تم اقتصاص اللوحة');
}

function finalizeShape(type, layer) {
  const pos = S.shapeEnd || { x: S.lastX, y: S.lastY };
  const ctx = layer.ctx;
  ctx.save();
  ctx.strokeStyle = S.fgColor;
  ctx.lineWidth = S.brush.size;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalAlpha = S.brush.opacity;

  const x1 = S.shapeStart.x, y1 = S.shapeStart.y, x2 = pos.x, y2 = pos.y;

  switch (type) {
    case 'line':
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); break;
    case 'rect':
      ctx.beginPath(); ctx.rect(x1,y1,x2-x1,y2-y1); ctx.stroke(); break;
    case 'circle': {
      const rx = Math.abs(x2-x1)/2, ry = Math.abs(y2-y1)/2;
      const cx = (x1+x2)/2, cy = (y1+y2)/2;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); ctx.stroke(); break;
    }
    case 'triangle': {
      const mx = (x1+x2)/2;
      ctx.beginPath(); ctx.moveTo(mx,y1); ctx.lineTo(x2,y2); ctx.lineTo(x1,y2); ctx.closePath(); ctx.stroke(); break;
    }
    case 'star': {
      const cx = x1, cy = y1;
      const outer = Math.hypot(x2-cx, y2-cy);
      const inner = outer * 0.4;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i%2===0 ? outer : inner;
        const angle = (i*Math.PI/5) - Math.PI/2;
        const x = cx + Math.cos(angle)*r, y = cy + Math.sin(angle)*r;
        i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.closePath(); ctx.stroke(); break;
    }
  }
  ctx.restore();
  renderLayers();
}

// ========== أداة النص ==========
function addText(layer) {
  const x = S.lastX, y = S.lastY;
  const text = prompt('أدخل النص:');
  if (!text) return;
  const size = prompt('حجم الخط:', '40');
  const ctx = layer.ctx;
  ctx.save();
  ctx.fillStyle = S.fgColor;
  ctx.globalAlpha = S.brush.opacity;
  ctx.font = `bold ${size || 40}px Cairo, Tajawal, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(text, x, y);
  ctx.restore();
  renderLayers();
  showToast('تمت إضافة النص');
}

// ========== تحديد الكل / نسخ / لصق ==========
function selectAll() {
  showToast('تم تحديد الكل');
}

function deselectAll() {
  S.selection = null;
  S.overlayCtx.clearRect(0, 0, S.canvasWidth, S.canvasHeight);
  showToast('تم إلغاء التحديد');
}

function invertSelection() { showToast('تم عكس التحديد'); }

function copySelected() {
  S.clipboard = S.layers[S.activeLayerIdx]?.canvas;
  showToast('تم النسخ');
}

function cutSelected() {
  copySelected();
  const l = S.layers[S.activeLayerIdx];
  if (l) { l.ctx.clearRect(0, 0, S.canvasWidth, S.canvasHeight); renderLayers(); }
  showToast('تم القص');
}

function pasteContent() {
  if (!S.clipboard) return;
  addLayer();
  const l = S.layers[S.activeLayerIdx];
  l.ctx.drawImage(S.clipboard, 0, 0);
  renderLayers();
  showToast('تم اللصق في طبقة جديدة');
}

// ============================================
// التنقل والتكبير
// ============================================
function panCanvas(e) {
  if (!S.isDrawing) return;
  const rect = S.mainCanvas.getBoundingClientRect();
  const dx = (e.movementX || 0);
  const dy = (e.movementY || 0);
  const area = document.getElementById('canvasScrollArea');
  if (area) { area.scrollLeft -= dx; area.scrollTop -= dy; }
}

function setZoom(z) {
  S.zoom = Math.max(0.1, Math.min(32, z));
  const wrapper = document.getElementById('canvasWrapper');
  if (wrapper) {
    wrapper.style.transform = `scale(${S.zoom})`;
    wrapper.style.transformOrigin = 'center center';
  }
  document.getElementById('zoomDisplay').textContent = Math.round(S.zoom * 100) + '%';
  document.getElementById('statusZoom').textContent = 'تكبير: ' + Math.round(S.zoom * 100) + '%';
}

function zoomIn() { setZoom(S.zoom * 1.25); }
function zoomOut() { setZoom(S.zoom * 0.8); }
function zoomFit() {
  const area = document.getElementById('canvasScrollArea');
  if (!area) return;
  const zx = (area.clientWidth - 80) / S.canvasWidth;
  const zy = (area.clientHeight - 80) / S.canvasHeight;
  setZoom(Math.min(zx, zy));
}
function zoom100() { setZoom(1); }

function fitCanvasToView() {
  setTimeout(zoomFit, 50);
}

// ============================================
// الشبكة والمسطرة
// ============================================
function toggleGrid() {
  S.showGrid = !S.showGrid;
  document.getElementById('gridToggle').textContent = S.showGrid ? 'تشغيل' : 'إيقاف';
  document.getElementById('gridToggle').classList.toggle('active', S.showGrid);
  const sw = document.getElementById('gridSwitch');
  if (sw) sw.checked = S.showGrid;
  renderLayers();
  showToast(S.showGrid ? 'تم إظهار الشبكة' : 'تم إخفاء الشبكة');
}

function toggleRulers() {
  S.showRulers = !S.showRulers;
  const rh = document.getElementById('rulerH');
  const rv = document.getElementById('rulerV');
  if (rh) rh.style.display = S.showRulers ? 'block' : 'none';
  if (rv) rv.style.display = S.showRulers ? 'block' : 'none';
  document.getElementById('rulerToggle').textContent = S.showRulers ? 'تشغيل' : 'إيقاف';
  document.getElementById('rulerToggle').classList.toggle('active', S.showRulers);
}

function toggleGuides() { showToast('الخطوط المرجعية: قريبًا'); }

function toggleSnap() {
  S.snapToGrid = !S.snapToGrid;
  document.getElementById('snapToggle').textContent = S.snapToGrid ? 'تشغيل' : 'إيقاف';
  document.getElementById('snapToggle').classList.toggle('active', S.snapToGrid);
}

function drawRulers() {
  const rh = document.getElementById('rulerHCanvas');
  const rv = document.getElementById('rulerVCanvas');
  if (!rh || !rv) return;
  const wrapper = document.getElementById('canvasWrapper');
  if (!wrapper) return;
  const bw = wrapper.offsetWidth;
  const bh = wrapper.offsetHeight;

  rh.width = bw + 40; rh.height = 20;
  const ctxH = rh.getContext('2d');
  ctxH.clearRect(0, 0, rh.width, rh.height);
  ctxH.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg2') || '#1a1a2e';
  ctxH.fillRect(0, 0, rh.width, rh.height);
  ctxH.strokeStyle = 'rgba(255,255,255,0.2)';
  ctxH.fillStyle = 'rgba(255,255,255,0.4)';
  ctxH.font = '9px Cairo';
  const step = 50;
  for (let x = 0; x < bw; x += step) {
    ctxH.beginPath(); ctxH.moveTo(x, 14); ctxH.lineTo(x, 20); ctxH.stroke();
    ctxH.fillText(Math.round(x / S.zoom), x + 2, 11);
  }

  rv.width = 20; rv.height = bh + 40;
  const ctxV = rv.getContext('2d');
  ctxV.clearRect(0, 0, rv.width, rv.height);
  ctxV.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg2') || '#1a1a2e';
  ctxV.fillRect(0, 0, rv.width, rv.height);
  ctxV.strokeStyle = 'rgba(255,255,255,0.2)';
  ctxV.fillStyle = 'rgba(255,255,255,0.4)';
  ctxV.font = '9px Cairo';
  for (let y = 0; y < bh; y += step) {
    ctxV.beginPath(); ctxV.moveTo(14, y); ctxV.lineTo(20, y); ctxV.stroke();
    ctxV.save(); ctxV.translate(11, y + 2); ctxV.rotate(-Math.PI/2);
    ctxV.fillText(Math.round(y / S.zoom), 0, 0);
    ctxV.restore();
  }
}

// ============================================
// الأنيميشن (Frame by Frame)
// ============================================
function initAnimation(proj) {
  S.frames = [];
  if (proj.framesData && proj.framesData.length > 0) {
    proj.framesData.forEach((fd, i) => {
      const canvas = document.createElement('canvas');
      canvas.width = S.canvasWidth; canvas.height = S.canvasHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (fd.data) {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); renderFrames(); };
        img.src = fd.data;
      }
      S.frames.push({ id: fd.id||Date.now()+i, canvas, ctx, duration: fd.duration || (1000/S.fps) });
    });
    S.currentFrame = 0;
  } else {
    addFrame();
  }

  const fpsSelect = document.getElementById('fpsSelect');
  if (fpsSelect) fpsSelect.value = S.fps;
  renderFrames();
  updateFrameDisplay();
}

function addFrame() {
  const canvas = document.createElement('canvas');
  canvas.width = S.canvasWidth; canvas.height = S.canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // نسخ الإطار الحالي إن وجد
  if (S.frames[S.currentFrame]) {
    ctx.drawImage(S.frames[S.currentFrame].canvas, 0, 0);
  }

  const frame = { id: Date.now(), canvas, ctx, duration: 1000 / S.fps };
  S.frames.splice(S.currentFrame + 1, 0, frame);
  S.currentFrame++;

  // مزامنة الطبقة الأولى مع الإطار
  syncFrameToLayer();
  renderFrames();
  updateFrameDisplay();
  showToast('تمت إضافة إطار جديد');
}

function syncFrameToLayer() {
  if (!S.layers[0] || !S.frames[S.currentFrame]) return;
  S.frames[S.currentFrame].ctx.clearRect(0, 0, S.canvasWidth, S.canvasHeight);
  S.frames[S.currentFrame].ctx.drawImage(S.layers[0].canvas, 0, 0);
}

function goToFrame(idx) {
  // حفظ الإطار الحالي
  if (S.frames[S.currentFrame] && S.layers[0]) {
    S.frames[S.currentFrame].ctx.clearRect(0, 0, S.canvasWidth, S.canvasHeight);
    S.frames[S.currentFrame].ctx.drawImage(S.layers[0].canvas, 0, 0);
  }
  S.currentFrame = idx;
  // تحميل الإطار الجديد
  if (S.frames[S.currentFrame] && S.layers[0]) {
    S.layers[0].ctx.clearRect(0, 0, S.canvasWidth, S.canvasHeight);
    S.layers[0].ctx.drawImage(S.frames[S.currentFrame].canvas, 0, 0);
    renderLayers();
  }
  renderFrames();
  updateFrameDisplay();
}

function renderFrames() {
  const list = document.getElementById('framesList');
  if (!list) return;
  list.innerHTML = '';
  S.frames.forEach((frame, i) => {
    const item = document.createElement('div');
    item.className = 'frame-item' + (i === S.currentFrame ? ' active' : '');
    const thumb = document.createElement('canvas');
    thumb.width = 60; thumb.height = 50;
    const tCtx = thumb.getContext('2d');
    if (S.background !== 'transparent') { tCtx.fillStyle = S.background; tCtx.fillRect(0,0,60,50); }
    tCtx.drawImage(frame.canvas, 0, 0, 60, 50);
    const num = document.createElement('div');
    num.className = 'frame-num'; num.textContent = i + 1;
    const dur = document.createElement('div');
    dur.className = 'frame-duration'; dur.textContent = (frame.duration/1000).toFixed(2)+'s';
    item.appendChild(thumb); item.appendChild(num); item.appendChild(dur);
    item.addEventListener('click', () => goToFrame(i));

    // قائمة السياق
    item.addEventListener('contextmenu', e => {
      e.preventDefault();
      const action = confirm(`الإطار ${i+1}: هل تريد حذفه؟`);
      if (action && S.frames.length > 1) {
        S.frames.splice(i, 1);
        if (S.currentFrame >= S.frames.length) S.currentFrame = S.frames.length - 1;
        renderFrames(); updateFrameDisplay();
      }
    });

    list.appendChild(item);
  });
}

function updateFrameDisplay() {
  const disp = document.getElementById('currentFrameDisplay');
  const durDisp = document.getElementById('totalDurationDisplay');
  if (disp) disp.textContent = `إطار ${S.currentFrame + 1} / ${S.frames.length}`;
  if (durDisp) {
    const total = S.frames.reduce((s, f) => s + f.duration, 0);
    durDisp.textContent = (total / 1000).toFixed(2) + ' ثانية';
  }
}

function togglePlay() {
  S.isPlaying = !S.isPlaying;
  const icon = document.getElementById('playIcon');
  if (S.isPlaying) {
    if (icon) icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    playAnimation();
  } else {
    clearInterval(S.playInterval);
    if (icon) icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
  }
}

function playAnimation() {
  if (S.playInterval) clearInterval(S.playInterval);
  let fi = S.currentFrame;

  function step() {
    if (!S.isPlaying) return;
    goToFrame(fi);
    const frameDur = S.frames[fi]?.duration || (1000 / S.fps);
    fi++;
    if (fi >= S.frames.length) {
      if (S.loop) fi = 0;
      else { S.isPlaying = false; const icon = document.getElementById('playIcon'); if (icon) icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>'; return; }
    }
    S.playInterval = setTimeout(step, frameDur);
  }
  step();
}

function toggleLoop() {
  S.loop = !S.loop;
  document.getElementById('loopBtn').classList.toggle('active', S.loop);
  showToast(S.loop ? 'التكرار مفعّل' : 'التكرار متوقف');
}

function changeFPS(val) {
  S.fps = parseInt(val);
  S.frames.forEach(f => f.duration = 1000 / S.fps);
  updateFrameDisplay();
}

function animGoToStart() { if (S.isPlaying) togglePlay(); goToFrame(0); }
function animGoToEnd() { if (S.isPlaying) togglePlay(); goToFrame(S.frames.length - 1); }
function animPrevFrame() { if (S.isPlaying) togglePlay(); goToFrame(Math.max(0, S.currentFrame - 1)); }
function animNextFrame() { if (S.isPlaying) togglePlay(); goToFrame(Math.min(S.frames.length - 1, S.currentFrame + 1)); }

// ============================================
// مشروع النار الجاهز
// ============================================
function loadFireTemplate() {
  const proj = {
    id: 'fire-template-' + Date.now(),
    name: 'نار متحركة',
    width: 400, height: 400,
    background: '#1a0a00',
    fps: 12, type: 'animated',
    created: Date.now()
  };
  const projects = getProjects();
  projects.unshift(proj);
  saveProjects(projects);
  openProject(proj);
  // رسم الإطارات بعد التهيئة
  setTimeout(() => drawFireFrames(), 500);
}

function drawFireFrames() {
  // إنشاء 8 إطارات لنار متحركة
  S.frames = [];
  for (let f = 0; f < 8; f++) {
    const canvas = document.createElement('canvas');
    canvas.width = S.canvasWidth; canvas.height = S.canvasHeight;
    const ctx = canvas.getContext('2d');

    // خلفية داكنة
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(0, 0, S.canvasWidth, S.canvasHeight);

    const frame = { id: Date.now() + f, canvas, ctx, duration: 1000 / 12 };
    drawFireFrame(ctx, f, 8);
    S.frames.push(frame);
  }

  // تحديث الطبقة الأولى لتظهر الإطار الأول
  if (S.layers[0]) {
    S.layers[0].ctx.clearRect(0, 0, S.canvasWidth, S.canvasHeight);
    S.layers[0].ctx.drawImage(S.frames[0].canvas, 0, 0);
    renderLayers();
  }

  S.currentFrame = 0;
  renderFrames();
  updateFrameDisplay();
  showToast('تم تحميل مشروع النار المتحركة!');
}

function drawFireFrame(ctx, frameIdx, totalFrames) {
  const w = S.canvasWidth, h = S.canvasHeight;
  const t = frameIdx / totalFrames;
  const cx = w / 2;
  const baseY = h * 0.85;

  // طبقات اللهب - من الأسفل للأعلى
  const layers = [
    { color: '#ff6600', height: 0.45, wobble: 0.08, alpha: 0.9 },
    { color: '#ff3300', height: 0.35, wobble: 0.1, alpha: 0.85 },
    { color: '#ff8800', height: 0.3, wobble: 0.06, alpha: 0.8 },
    { color: '#ffcc00', height: 0.18, wobble: 0.05, alpha: 0.7 },
    { color: '#ffffff', height: 0.08, wobble: 0.03, alpha: 0.5 },
  ];

  layers.forEach(({ color, height, wobble, alpha }) => {
    const flameH = h * height;
    const wobbleX = Math.sin(t * Math.PI * 2 + Math.random() * 0.3) * w * wobble;
    const grad = ctx.createRadialGradient(cx + wobbleX * 0.5, baseY - flameH * 0.5, 0, cx + wobbleX * 0.5, baseY - flameH * 0.5, flameH * 0.7);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.18, baseY);

    // اللهب بمنحنيات بيزييه
    const jitter = (Math.random() - 0.5) * w * 0.05;
    ctx.bezierCurveTo(
      cx - w * 0.12 + wobbleX, baseY - flameH * 0.4,
      cx + w * 0.05 + wobbleX + jitter, baseY - flameH * 0.8,
      cx + wobbleX * 0.8, baseY - flameH
    );
    ctx.bezierCurveTo(
      cx - w * 0.05 + wobbleX, baseY - flameH * 0.8,
      cx + w * 0.12 - wobbleX, baseY - flameH * 0.4,
      cx + w * 0.18, baseY
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // الجمر في الأسفل
  for (let i = 0; i < 12; i++) {
    const ox = (Math.random() - 0.5) * w * 0.3;
    const oy = Math.random() * h * 0.08;
    const r = Math.random() * 4 + 2;
    const emberAlpha = 0.5 + Math.random() * 0.5;
    const grad = ctx.createRadialGradient(cx + ox, baseY - oy, 0, cx + ox, baseY - oy, r * 3);
    grad.addColorStop(0, `rgba(255,200,50,${emberAlpha})`);
    grad.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx + ox, baseY - oy, r * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // جزيئات ضوء في الأعلى
  for (let i = 0; i < 6; i++) {
    const sparkX = cx + (Math.random() - 0.5) * w * 0.2;
    const sparkY = baseY - h * (0.35 + Math.random() * 0.2) + (frameIdx * h * 0.02);
    ctx.save();
    ctx.globalAlpha = 0.4 + Math.random() * 0.4;
    ctx.fillStyle = '#ffee88';
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, Math.random() * 2 + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ============================================
// الصورة المرجعية
// ============================================
function importReferenceImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        S.refImage = img;
        S.refScale = Math.min(1, S.canvasWidth / img.naturalWidth, S.canvasHeight / img.naturalHeight);
        S.refX = 0; S.refY = 0;
        document.getElementById('refControls').style.display = 'flex';
        renderLayers();
        showToast('تمت إضافة الصورة المرجعية');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function setRefOpacity(val) {
  S.refOpacity = val / 100;
  document.getElementById('refOpacityVal').textContent = val + '%';
  renderLayers();
}

function setRefScale(val) {
  S.refScale = val / 100;
  document.getElementById('refScaleVal').textContent = val + '%';
  renderLayers();
}

function lockRefLayer() {
  S.refLocked = !S.refLocked;
  showToast(S.refLocked ? 'تم قفل طبقة المرجع' : 'تم فك قفل طبقة المرجع');
}

function removeRefImage() {
  S.refImage = null;
  document.getElementById('refControls').style.display = 'none';
  renderLayers();
  showToast('تمت إزالة الصورة المرجعية');
}

// ============================================
// الحفظ والتصدير
// ============================================
function saveProject() {
  if (!S.project) return;
  // حفظ بيانات الطبقات
  const layersData = S.layers.map(l => ({
    id: l.id, name: l.name,
    data: l.canvas.toDataURL('image/png'),
    opacity: l.opacity, visible: l.visible,
    locked: l.locked, blendMode: l.blendMode
  }));

  // thumbnail
  const thumb = document.createElement('canvas');
  thumb.width = 240; thumb.height = 160;
  const tCtx = thumb.getContext('2d');
  tCtx.drawImage(S.mainCanvas, 0, 0, 240, 160);

  const updatedProject = {
    ...S.project,
    layersData,
    thumbnail: thumb.toDataURL('image/jpeg', 0.6),
    saved: Date.now()
  };

  if (S.projectType === 'animated') {
    syncFrameToLayer();
    updatedProject.framesData = S.frames.map(f => ({
      id: f.id, data: f.canvas.toDataURL('image/png'), duration: f.duration
    }));
  }

  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === S.project.id);
  if (idx >= 0) projects[idx] = updatedProject;
  else projects.unshift(updatedProject);
  saveProjects(projects);
  S.project = updatedProject;
  showToast('تم الحفظ بنجاح');
}

function autoSaveProject() {
  if (!S.project) return;
  // حفظ خفيف (بدون إشعار)
  try {
    const layersData = S.layers.map(l => ({ id: l.id, name: l.name, data: l.canvas.toDataURL('image/png'), opacity: l.opacity, visible: l.visible, locked: l.locked, blendMode: l.blendMode }));
    const thumb = document.createElement('canvas');
    thumb.width = 120; thumb.height = 80;
    const tCtx = thumb.getContext('2d');
    tCtx.drawImage(S.mainCanvas, 0, 0, 120, 80);
    const updatedProject = { ...S.project, layersData, thumbnail: thumb.toDataURL('image/jpeg', 0.5), saved: Date.now() };
    if (S.projectType === 'animated') {
      syncFrameToLayer();
      updatedProject.framesData = S.frames.map(f => ({ id: f.id, data: f.canvas.toDataURL('image/png'), duration: f.duration }));
    }
    const projects = getProjects();
    const idx = projects.findIndex(p => p.id === S.project.id);
    if (idx >= 0) projects[idx] = updatedProject;
    else projects.unshift(updatedProject);
    saveProjects(projects);
    S.project = updatedProject;
  } catch (e) {}
}

function exportAs(format) {
  closeAllMenus();
  const canvas = document.createElement('canvas');
  canvas.width = S.canvasWidth; canvas.height = S.canvasHeight;
  const ctx = canvas.getContext('2d');

  if (format !== 'png' || S.background !== 'transparent') {
    ctx.fillStyle = S.background === 'transparent' ? '#ffffff' : S.background;
    ctx.fillRect(0, 0, S.canvasWidth, S.canvasHeight);
  }

  for (let i = S.layers.length - 1; i >= 0; i--) {
    const l = S.layers[i];
    if (!l.visible) continue;
    ctx.save(); ctx.globalAlpha = l.opacity; ctx.globalCompositeOperation = l.blendMode;
    ctx.drawImage(l.canvas, 0, 0); ctx.restore();
  }

  const mimeMap = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
  const ext = format === 'jpg' ? 'jpeg' : format;
  const quality = format === 'png' ? 1 : 0.92;
  const url = canvas.toDataURL(mimeMap[format] || 'image/png', quality);
  downloadFile(url, `${S.project?.name || 'رسم'}.${ext}`);
  showToast(`تم التصدير بصيغة ${format.toUpperCase()}`);
}

function quickExport() { exportAs('png'); }

function exportLayersAsPNG() {
  closeAllMenus();
  S.layers.forEach((l, i) => {
    const url = l.canvas.toDataURL('image/png');
    downloadFile(url, `${l.name}-${i+1}.png`);
  });
  showToast('تم تصدير جميع الطبقات');
}

function exportVideo() {
  closeAllMenus();
  if (S.frames.length === 0) { showToast('لا توجد إطارات للتصدير', 'error'); return; }

  // تصدير كـ GIF بالجزء 1: إنشاء مجموعة صور
  showToast('جاري إنشاء الملفات...');

  S.frames.forEach((frame, i) => {
    const canvas = document.createElement('canvas');
    canvas.width = S.canvasWidth; canvas.height = S.canvasHeight;
    const ctx = canvas.getContext('2d');
    if (S.background !== 'transparent') { ctx.fillStyle = S.background; ctx.fillRect(0, 0, S.canvasWidth, S.canvasHeight); }
    ctx.drawImage(frame.canvas, 0, 0);
    const url = canvas.toDataURL('image/png');
    setTimeout(() => downloadFile(url, `frame-${String(i+1).padStart(3,'0')}.png`), i * 100);
  });

  setTimeout(() => showToast(`تم تصدير ${S.frames.length} إطار. يمكنك دمجها في برنامج تحرير فيديو.`), 500);
}

function downloadFile(url, name) {
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
}

// ============================================
// تبديل الأداة
// ============================================
function setTool(tool) {
  if (S.currentTool !== tool) S.previousTool = S.currentTool;
  S.currentTool = tool;

  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.id === 'tool-' + tool) btn.classList.add('active');
  });

  const cursors = {
    brush: 'crosshair', pencil: 'crosshair', pen: 'crosshair',
    eraser: 'cell', fill: 'cell', eyedropper: 'crosshair',
    text: 'text', hand: 'grab', zoom-tool: 'zoom-in',
    select: 'default', rect: 'crosshair', circle: 'crosshair',
    line: 'crosshair', triangle: 'crosshair', star: 'crosshair',
    spray: 'crosshair', smudge: 'crosshair', clone: 'crosshair',
    crop: 'crosshair',
  };
  if (S.mainCanvas) S.mainCanvas.style.cursor = cursors[tool] || 'crosshair';
  document.getElementById('statusTool').textContent = 'الأداة: ' + getToolName(tool);
}

function getToolName(tool) {
  const names = {
    brush: 'فرشاة', pencil: 'قلم رصاص', pen: 'قلم بيزييه', eraser: 'ممحاة',
    fill: 'تعبئة', spray: 'رش', eyedropper: 'قطارة', text: 'نص',
    hand: 'تنقل', 'zoom-tool': 'تكبير', select: 'تحديد', line: 'خط',
    rect: 'مستطيل', circle: 'دائرة', triangle: 'مثلث', star: 'نجمة',
    smudge: 'تمويه', clone: 'استنساخ', crop: 'اقتصاص',
    'rect-select': 'تحديد مستطيل', 'ellipse-select': 'تحديد دائري',
    lasso: 'لاسو', 'magic-wand': 'عصا سحرية',
  };
  return names[tool] || tool;
}

// ============================================
// إعدادات الفرشاة
// ============================================
function updateBrushSize(val) {
  S.brush.size = parseInt(val);
  document.getElementById('brushSizeVal').textContent = val;
}
function updateBrushOpacity(val) {
  S.brush.opacity = val / 100;
  document.getElementById('brushOpacityVal').textContent = val + '%';
}
function updateBrushFlow(val) {
  S.brush.flow = val / 100;
  document.getElementById('brushFlowVal').textContent = val + '%';
}
function updateBrushSmooth(val) {
  S.brush.smooth = parseInt(val);
  document.getElementById('brushSmoothVal').textContent = val;
}
function updateBrushHardness(val) {
  S.brush.hardness = val / 100;
  document.getElementById('brushHardnessVal').textContent = val + '%';
}
function updateBrushSpacing(val) {
  S.brush.spacing = parseInt(val);
  document.getElementById('brushSpacingVal').textContent = val + '%';
}

// ============================================
// قائمة الفرش
// ============================================
const BRUSHES = [
  // فرش صفوان
  { id: 'safwan-round', name: 'فرشاة صفوان الدائرية', cat: 'safwan', desc: 'ناعمة ومتعددة الاستخدامات' },
  { id: 'safwan-soft', name: 'فرشاة صفوان الناعمة', cat: 'safwan', desc: 'حواف ناعمة ومتدرجة' },
  { id: 'safwan-ink', name: 'قلم صفوان الحبر', cat: 'safwan', desc: 'خطوط حادة وواضحة' },
  { id: 'safwan-calligraphy', name: 'خط صفوان الخطي', cat: 'safwan', desc: 'مثالية للخط العربي' },
  { id: 'safwan-sketch', name: 'فرشاة صفوان السكتش', cat: 'safwan', desc: 'للرسم التلقائي السريع' },
  // فرش أساسية
  { id: 'basic-round', name: 'دائري صلب', cat: 'basic', desc: 'فرشاة صلبة أساسية' },
  { id: 'basic-flat', name: 'مسطح', cat: 'basic', desc: 'فرشاة مسطحة' },
  { id: 'basic-fan', name: 'مروحي', cat: 'basic', desc: 'فرشاة مروحية' },
  { id: 'basic-pencil', name: 'قلم رصاص', cat: 'basic', desc: 'مثل قلم الرصاص الحقيقي' },
  { id: 'basic-marker', name: 'ماركر', cat: 'basic', desc: 'ماركر ثابت وقوي' },
  { id: 'basic-pen', name: 'قلم حبر', cat: 'basic', desc: 'خطوط دقيقة وحادة' },
  // فرش نسيج
  { id: 'texture-watercolor', name: 'ألوان مائية', cat: 'texture', desc: 'تأثير ألوان مائية' },
  { id: 'texture-oil', name: 'زيتي', cat: 'texture', desc: 'تأثير الألوان الزيتية' },
  { id: 'texture-charcoal', name: 'فحم', cat: 'texture', desc: 'تأثير الفحم الطبيعي' },
  { id: 'texture-chalk', name: 'طباشير', cat: 'texture', desc: 'مظهر الطباشير على السبورة' },
  { id: 'texture-sponge', name: 'إسفنج', cat: 'texture', desc: 'نسيج إسفنجي ناعم' },
  { id: 'texture-grain', name: 'حبوب', cat: 'texture', desc: 'ملمس حبيبي' },
  // فرش خاصة
  { id: 'special-glow', name: 'توهج', cat: 'special', desc: 'تأثير إضاءة متوهجة' },
  { id: 'special-star', name: 'نجوم', cat: 'special', desc: 'تأثير نثر نجوم' },
  { id: 'special-smoke', name: 'دخان', cat: 'special', desc: 'تأثير دخان ناعم' },
  { id: 'special-fire', name: 'نار', cat: 'special', desc: 'تأثير ألسنة النار' },
  { id: 'special-splatter', name: 'رذاذ', cat: 'special', desc: 'تأثير رذاذ الطلاء' },
];

let currentBrushCat = 'safwan';

function initBrushList() {
  filterBrushes(currentBrushCat, document.querySelector('.bc-btn.active'));
}

function filterBrushes(cat, btn) {
  currentBrushCat = cat;
  document.querySelectorAll('.bc-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const list = document.getElementById('brushList');
  if (!list) return;
  list.innerHTML = '';

  const filtered = BRUSHES.filter(b => b.cat === cat);
  filtered.forEach(b => {
    const item = document.createElement('div');
    item.className = 'brush-item' + (b.id === S.brush.type ? ' active' : '');
    item.innerHTML = `
      <div class="brush-preview"><canvas width="40" height="24"></canvas></div>
      <div>
        <div class="brush-name">${b.name}</div>
        <div class="brush-sub">${b.desc}</div>
      </div>
    `;
    // رسم معاينة الفرشاة
    const previewCanvas = item.querySelector('canvas');
    drawBrushPreview(previewCanvas.getContext('2d'), b.id);

    item.addEventListener('click', () => {
      S.brush.type = b.id;
      S.brush.name = b.name;
      document.querySelectorAll('.brush-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      setTool('brush');
    });
    list.appendChild(item);
  });
}

function drawBrushPreview(ctx, type) {
  ctx.clearRect(0, 0, 40, 24);
  const isDark = !document.body.classList.contains('light-mode');
  ctx.strokeStyle = isDark ? '#fff' : '#333';
  ctx.fillStyle = isDark ? '#fff' : '#333';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  switch (type) {
    case 'safwan-round': case 'basic-round':
      ctx.beginPath(); ctx.moveTo(4, 20); ctx.bezierCurveTo(12, 8, 28, 8, 36, 4); ctx.stroke(); break;
    case 'safwan-soft': case 'texture-watercolor':
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.arc(8+i*6, 12+Math.sin(i)*4, 4+i*0.5, 0, Math.PI*2); ctx.fill();
      }
      break;
    case 'safwan-ink': case 'basic-pen':
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(4, 20); ctx.lineTo(36, 4); ctx.stroke(); break;
    case 'texture-charcoal':
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 20; i++) {
        ctx.beginPath(); ctx.arc(4+Math.random()*32, 8+Math.random()*10, 1, 0, Math.PI*2); ctx.fill();
      }
      break;
    default:
      ctx.beginPath(); ctx.moveTo(4, 18); ctx.bezierCurveTo(12, 14, 28, 10, 36, 6); ctx.stroke();
  }
}

// ============================================
// لوحة الألوان - 1000+ لون
// ============================================
function initColorPalette() {
  const grid = document.getElementById('paletteGrid');
  if (!grid) return;
  generatePalette('all');
}

function filterPalette(cat, btn) {
  document.querySelectorAll('.pf-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  generatePalette(cat);
}

function generatePalette(cat) {
  const grid = document.getElementById('paletteGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const colors = getPaletteColors(cat);
  colors.forEach(color => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch';
    sw.style.background = color;
    sw.title = color;
    sw.addEventListener('click', () => {
      setFgColor(color);
      addRecentColor(color);
    });
    grid.appendChild(sw);
  });
}

function getPaletteColors(cat) {
  const allColors = [];

  if (cat === 'skin' || cat === 'all') {
    // ألوان البشرة (100+)
    const skinTones = [
      '#FDDBB4','#F5CBA7','#EAB890','#D4956A','#C68642','#B5722A','#A0522D','#8B4513',
      '#7B3F00','#6B2F00','#FFE0BD','#FFCD94','#EAC086','#C98B5A','#A0694A','#8B5A2B',
      '#FFF0D9','#FFE0C4','#F0C9A0','#D4A574','#C19A6B','#A67C52','#8B6914','#6B4423',
      '#FFDFC4','#FFCBA4','#E8B88A','#D4956A','#B87333','#9B5523','#7B3F00','#5C2E00',
      '#FFE8D6','#FFD5B5','#F5C089','#E8A870','#D4884A','#B5622A','#96431A','#7A2F10',
      '#FFF5E6','#FFE8CC','#FFDAB3','#FFCC99','#FFB97A','#E8965A','#C97840','#A05528',
      '#FFF8F0','#FFEEDD','#FFE4CC','#FFCCA6','#F0B07A','#D48B5A','#B06830','#8B4410',
    ];
    allColors.push(...skinTones);
  }

  if (cat === 'warm' || cat === 'all') {
    // ألوان دافئة
    for (let h = 0; h <= 60; h += 4) {
      for (let s = 60; s <= 100; s += 20) {
        for (let l = 25; l <= 75; l += 15) {
          allColors.push(`hsl(${h},${s}%,${l}%)`);
        }
      }
    }
  }

  if (cat === 'cool' || cat === 'all') {
    // ألوان باردة
    for (let h = 180; h <= 280; h += 5) {
      for (let s = 50; s <= 100; s += 20) {
        for (let l = 20; l <= 80; l += 15) {
          allColors.push(`hsl(${h},${s}%,${l}%)`);
        }
      }
    }
  }

  if (cat === 'nature' || cat === 'all') {
    // ألوان طبيعة
    const nature = [
      '#2D5016','#3A6B1F','#4E8B2A','#62A835','#76C840','#8DE050',
      '#1B4332','#2D6A4F','#40916C','#52B788','#74C69D','#95D5B2',
      '#5C3D11','#7D5A27','#9E7840','#BF9660','#D4A96A','#E8C17A',
      '#1A1A2E','#16213E','#0F3460','#533483','#E94560','#0F4C75',
      '#355C7D','#6C5B7B','#C06C84','#F67280','#F8B195',
    ];
    allColors.push(...nature);
  }

  if (cat === 'all') {
    // ألوان إضافية لتجاوز 1000
    for (let h = 0; h <= 360; h += 5) {
      for (let s = 30; s <= 100; s += 25) {
        for (let l = 20; l <= 80; l += 20) {
          allColors.push(`hsl(${h},${s}%,${l}%)`);
        }
      }
    }
    // درجات الرمادي
    for (let i = 0; i <= 255; i += 15) {
      allColors.push(`rgb(${i},${i},${i})`);
    }
    // ألوان نيون
    const neons = ['#FF00FF','#00FFFF','#00FF00','#FF0000','#0000FF','#FFFF00','#FF8000','#FF0080','#00FF80','#8000FF','#0080FF','#80FF00'];
    allColors.push(...neons);
  }

  return allColors.slice(0, 1200);
}

function addRecentColor(color) {
  const recentGrid = document.getElementById('recentColors');
  if (!recentGrid) return;
  const existing = recentGrid.querySelector(`[data-color="${color}"]`);
  if (existing) existing.remove();
  const sw = document.createElement('div');
  sw.className = 'color-swatch';
  sw.style.background = color;
  sw.dataset.color = color;
  sw.title = color;
  sw.style.width = '18px'; sw.style.height = '18px';
  sw.addEventListener('click', () => setFgColor(color));
  recentGrid.insertBefore(sw, recentGrid.firstChild);
  while (recentGrid.children.length > 20) recentGrid.removeChild(recentGrid.lastChild);
}

// ============================================
// منتقي الألوان
// ============================================
let currentColorTarget = 'fg';
let colorPickerHue = 20;
let colorPickerSat = 0.7;
let colorPickerLum = 0.6;
let colorPickerAlpha = 1;

function initColorPicker() {
  drawSpectrumCanvas();
  drawHueCanvas();
  drawAlphaCanvas();
  updateColorDisplay();

  // أحداث spectrum
  const spectrum = document.getElementById('colorSpectrum');
  if (spectrum) {
    let dragging = false;
    spectrum.addEventListener('mousedown', e => { dragging = true; pickFromSpectrum(e); });
    document.addEventListener('mousemove', e => { if (dragging) pickFromSpectrum(e); });
    document.addEventListener('mouseup', () => dragging = false);
  }

  // أحداث hue
  const hueCanvas = document.getElementById('hueCanvas');
  if (hueCanvas) {
    let dragging = false;
    hueCanvas.addEventListener('mousedown', e => { dragging = true; pickFromHue(e); });
    document.addEventListener('mousemove', e => { if (dragging) pickFromHue(e); });
    document.addEventListener('mouseup', () => dragging = false);
  }

  // alpha
  const alphaCanvas = document.getElementById('alphaCanvas');
  if (alphaCanvas) {
    let dragging = false;
    alphaCanvas.addEventListener('mousedown', e => { dragging = true; pickFromAlpha(e); });
    document.addEventListener('mousemove', e => { if (dragging) pickFromAlpha(e); });
    document.addEventListener('mouseup', () => dragging = false);
  }
}

function drawSpectrumCanvas() {
  const canvas = document.getElementById('spectrumCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;

  // تدرج أفقي من أبيض للون الأساسي
  const hslColor = `hsl(${colorPickerHue}, 100%, 50%)`;
  const gradH = ctx.createLinearGradient(0, 0, w, 0);
  gradH.addColorStop(0, '#fff');
  gradH.addColorStop(1, hslColor);
  ctx.fillStyle = gradH;
  ctx.fillRect(0, 0, w, h);

  // تدرج رأسي من شفاف لأسود
  const gradV = ctx.createLinearGradient(0, 0, 0, h);
  gradV.addColorStop(0, 'rgba(0,0,0,0)');
  gradV.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = gradV;
  ctx.fillRect(0, 0, w, h);
}

function pickFromSpectrum(e) {
  const canvas = document.getElementById('spectrumCanvas');
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * (canvas.width / rect.width)));
  const y = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * (canvas.height / rect.height)));
  colorPickerSat = x / canvas.width;
  colorPickerLum = 1 - y / canvas.height;
  updateSpectrumCursor(x / canvas.width * 100, y / canvas.height * 100);
  applyPickedColor();
}

function drawHueCanvas() {
  const canvas = document.getElementById('hueCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  for (let i = 0; i <= 360; i += 10) grad.addColorStop(i/360, `hsl(${i},100%,50%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function pickFromHue(e) {
  const canvas = document.getElementById('hueCanvas');
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * (canvas.width / rect.width)));
  colorPickerHue = (x / canvas.width) * 360;
  drawSpectrumCanvas();
  drawAlphaCanvas();
  const cursor = document.getElementById('hueCursor');
  if (cursor) cursor.style.left = (x / canvas.width * 100) + '%';
  applyPickedColor();
}

function drawAlphaCanvas() {
  const canvas = document.getElementById('alphaCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // خلفية شطرنج
  const sz = 6;
  for (let x = 0; x < canvas.width; x += sz)
    for (let y = 0; y < canvas.height; y += sz) {
      ctx.fillStyle = ((Math.floor(x/sz)+Math.floor(y/sz))%2===0) ? '#ccc' : '#fff';
      ctx.fillRect(x, y, sz, sz);
    }
  const color = hslToHex(colorPickerHue, colorPickerSat, colorPickerLum * 0.5 + 0.5 * (1 - colorPickerSat));
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function pickFromAlpha(e) {
  const canvas = document.getElementById('alphaCanvas');
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * (canvas.width / rect.width)));
  colorPickerAlpha = x / canvas.width;
  const cursor = document.getElementById('alphaCursor');
  if (cursor) cursor.style.left = (x / canvas.width * 100) + '%';
  applyPickedColor();
}

function updateSpectrumCursor(xPct, yPct) {
  const cursor = document.getElementById('spectrumCursor');
  if (cursor) { cursor.style.left = xPct + '%'; cursor.style.top = yPct + '%'; }
}

function applyPickedColor() {
  // تحويل HSV → RGB → HEX
  const h = colorPickerHue;
  const s = colorPickerSat;
  const v = colorPickerLum;

  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r=c; g=x; b=0; }
  else if (h < 120) { r=x; g=c; b=0; }
  else if (h < 180) { r=0; g=c; b=x; }
  else if (h < 240) { r=0; g=x; b=c; }
  else if (h < 300) { r=x; g=0; b=c; }
  else { r=c; g=0; b=x; }

  r = Math.round((r+m)*255);
  g = Math.round((g+m)*255);
  b = Math.round((b+m)*255);

  const hex = rgbToHex(r, g, b);
  setFgColor(hex);
  updateColorInputs(r, g, b, hex);
}

function updateColorDisplay() {
  const fg = document.getElementById('colorFG');
  const bg = document.getElementById('colorBG');
  if (fg) fg.style.background = S.fgColor;
  if (bg) bg.style.background = S.bgColor;
}

function updateColorInputs(r, g, b, hex) {
  const hi = document.getElementById('hexInput');
  const ri = document.getElementById('rInput');
  const gi = document.getElementById('gInput');
  const bi = document.getElementById('bInput');
  if (hi) hi.value = hex;
  if (ri) ri.value = r;
  if (gi) gi.value = g;
  if (bi) bi.value = b;
}

function updateFromHex(hex) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
  const rgb = hexToRgb(hex);
  setFgColor(hex);
  updateColorInputs(rgb.r, rgb.g, rgb.b, hex);
}

function updateFromRGB() {
  const r = parseInt(document.getElementById('rInput').value) || 0;
  const g = parseInt(document.getElementById('gInput').value) || 0;
  const b = parseInt(document.getElementById('bInput').value) || 0;
  const hex = rgbToHex(r, g, b);
  setFgColor(hex);
  document.getElementById('hexInput').value = hex;
}

function openColorPicker(target) {
  currentColorTarget = target;
}

function setFgColor(color) {
  S.fgColor = color;
  const fg = document.getElementById('colorFG');
  if (fg) fg.style.background = color;
  const hi = document.getElementById('hexInput');
  if (hi) hi.value = color;
  addRecentColor(color);
}

function swapColors() {
  const tmp = S.fgColor;
  S.fgColor = S.bgColor;
  S.bgColor = tmp;
  updateColorDisplay();
}

function resetColors() {
  S.fgColor = '#000000';
  S.bgColor = '#ffffff';
  updateColorDisplay();
}

function hslToHex(h, s, l) {
  l = l * 0.5 + 0.5 * (1 - s);
  const a = s * Math.min(l, 1-l);
  const f = n => {
    const k = (n + h/30) % 12;
    const color = l - a * Math.max(Math.min(k-3, 9-k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ============================================
// التاريخ (Undo/Redo)
// ============================================
function saveHistory() {
  if (S.historyIdx < S.history.length - 1) S.history.splice(S.historyIdx + 1);
  const state = S.layers.map(l => ({ id: l.id, data: l.canvas.toDataURL('image/png'), opacity: l.opacity, visible: l.visible, locked: l.locked, blendMode: l.blendMode, name: l.name }));
  S.history.push(state);
  if (S.history.length > S.maxHistory) S.history.shift();
  else S.historyIdx++;
}

function historyUndo() {
  if (S.historyIdx <= 0) { showToast('لا يمكن التراجع أكثر', 'error'); return; }
  S.historyIdx--;
  restoreHistory(S.history[S.historyIdx]);
  showToast('تم التراجع');
}

function historyRedo() {
  if (S.historyIdx >= S.history.length - 1) { showToast('لا يمكن الإعادة', 'error'); return; }
  S.historyIdx++;
  restoreHistory(S.history[S.historyIdx]);
  showToast('تمت الإعادة');
}

function restoreHistory(state) {
  if (!state) return;
  state.forEach((layerState, i) => {
    if (i >= S.layers.length) return;
    const img = new Image();
    img.onload = () => {
      S.layers[i].ctx.clearRect(0, 0, S.canvasWidth, S.canvasHeight);
      S.layers[i].ctx.drawImage(img, 0, 0);
      S.layers[i].opacity = layerState.opacity;
      S.layers[i].visible = layerState.visible;
      renderLayers(); renderLayersList();
    };
    img.src = layerState.data;
  });
}

// ============================================
// عمليات الكانفاس
// ============================================
function flipCanvasH() {
  S.layers.forEach(l => {
    const tmp = document.createElement('canvas');
    tmp.width = S.canvasWidth; tmp.height = S.canvasHeight;
    const ctx = tmp.getContext('2d');
    ctx.scale(-1, 1); ctx.translate(-S.canvasWidth, 0);
    ctx.drawImage(l.canvas, 0, 0);
    l.ctx.clearRect(0, 0, S.canvasWidth, S.canvasHeight);
    l.ctx.drawImage(tmp, 0, 0);
  });
  renderLayers();
  showToast('تم القلب الأفقي');
}

function flipCanvasV() {
  S.layers.forEach(l => {
    const tmp = document.createElement('canvas');
    tmp.width = S.canvasWidth; tmp.height = S.canvasHeight;
    const ctx = tmp.getContext('2d');
    ctx.scale(1, -1); ctx.translate(0, -S.canvasHeight);
    ctx.drawImage(l.canvas, 0, 0);
    l.ctx.clearRect(0, 0, S.canvasWidth, S.canvasHeight);
    l.ctx.drawImage(tmp, 0, 0);
  });
  renderLayers();
  showToast('تم القلب الرأسي');
}

function rotateCanvas90() {
  const newW = S.canvasHeight, newH = S.canvasWidth;
  S.layers.forEach(l => {
    const tmp = document.createElement('canvas');
    tmp.width = newW; tmp.height = newH;
    const ctx = tmp.getContext('2d');
    ctx.translate(newW / 2, newH / 2); ctx.rotate(Math.PI / 2);
    ctx.drawImage(l.canvas, -S.canvasWidth / 2, -S.canvasHeight / 2);
    l.canvas.width = newW; l.canvas.height = newH;
    l.ctx.drawImage(tmp, 0, 0);
  });
  [S.canvasWidth, S.canvasHeight] = [newW, newH];
  S.mainCanvas.width = newW; S.mainCanvas.height = newH;
  S.overlayCanvas.width = newW; S.overlayCanvas.height = newH;
  document.getElementById('canvasWrapper').style.width = newW + 'px';
  document.getElementById('canvasWrapper').style.height = newH + 'px';
  renderLayers(); updateCanvasInfo();
  showToast('تم التدوير 90 درجة');
}

function resizeCanvas() {
  const w = parseInt(prompt('العرض الجديد:', S.canvasWidth));
  const h = parseInt(prompt('الارتفاع الجديد:', S.canvasHeight));
  if (!w || !h || w < 1 || h < 1) return;

  S.layers.forEach(l => {
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const ctx = tmp.getContext('2d');
    ctx.drawImage(l.canvas, 0, 0, w, h);
    l.canvas.width = w; l.canvas.height = h;
    l.ctx.drawImage(tmp, 0, 0);
  });

  S.canvasWidth = w; S.canvasHeight = h;
  S.mainCanvas.width = w; S.mainCanvas.height = h;
  S.overlayCanvas.width = w; S.overlayCanvas.height = h;
  document.getElementById('canvasWrapper').style.width = w + 'px';
  document.getElementById('canvasWrapper').style.height = h + 'px';
  renderLayers(); updateCanvasInfo();
  showToast(`تم تغيير الحجم إلى ${w}×${h}`);
}

// ============================================
// الثيم والإعدادات
// ============================================
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('safwan-theme', isLight ? 'light' : 'dark');
  updateThemeToggle();
  // إعادة رسم الفرش
  setTimeout(initBrushList, 100);
}

function updateThemeToggle() {
  const isLight = document.body.classList.contains('light-mode');
  const sw = document.getElementById('darkModeSwitch');
  if (sw) sw.checked = !isLight;
  const btn = document.getElementById('studioThemeBtn');
  if (btn) {
    btn.innerHTML = isLight
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
  }
}

function showSettings() {
  document.getElementById('settingsModal').classList.add('active');
}

function showShortcuts() {
  closeAllMenus();
  document.getElementById('shortcutsModal').classList.add('active');
}

function showCanvasSettings() {
  closeAllMenus();
  const bg = prompt('لون الخلفية:', S.background);
  if (bg) {
    S.background = bg;
    renderLayers();
  }
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

document.querySelectorAll('.modal-overlay').forEach(modal => {
  modal.addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
});

// ============================================
// القوائم المنسدلة
// ============================================
function toggleMenu(el) {
  const isOpen = el.classList.contains('open');
  closeAllMenus();
  if (!isOpen) el.classList.add('open');
}

function closeAllMenus() {
  document.querySelectorAll('.menu-item.open').forEach(m => m.classList.remove('open'));
}

document.addEventListener('click', e => {
  if (!e.target.closest('.menu-item')) closeAllMenus();
});

// ============================================
// مجموعات الأدوات
// ============================================
function toggleToolGroup(header) {
  const items = header.nextElementSibling;
  const isActive = items.classList.contains('active');
  items.classList.toggle('active', !isActive);
  header.classList.toggle('collapsed', isActive);
}

// ============================================
// التبويبات الجانبية
// ============================================
function switchSideTab(tab) {
  document.querySelectorAll('.stab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tab));
}

// ============================================
// شريط الحالة والمعلومات
// ============================================
function updateStatusCoords(x, y) {
  const el = document.getElementById('statusCoords');
  if (el) el.textContent = `X: ${x}, Y: ${y}`;
}

function updateProjectName() {
  const el = document.getElementById('projectNameDisplay');
  if (el) el.textContent = S.project?.name || 'بدون عنوان';
}

function updateCanvasInfo() {
  const ciW = document.getElementById('ciW');
  const ciH = document.getElementById('ciH');
  const ciDPI = document.getElementById('ciDPI');
  if (ciW) ciW.textContent = S.canvasWidth + 'px';
  if (ciH) ciH.textContent = S.canvasHeight + 'px';
  if (ciDPI) ciDPI.textContent = S.dpi;
  document.getElementById('statusSize').textContent = `اللوحة: ${S.canvasWidth}×${S.canvasHeight}`;
}

// ============================================
// التوست (إشعارات)
// ============================================
let toastTimeout;
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(toastTimeout);
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ============================================
// وضع الشاشة الكاملة
// ============================================
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function toggleSidebarLeft() {
  const sidebar = document.getElementById('toolsSidebar');
  if (sidebar) sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
}

// ============================================
// مساعد التحويل اللوني
// ============================================
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1],16), g: parseInt(result[2],16), b: parseInt(result[3],16) } : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,'0')).join('');
}

// ============================================
// اختصارات لوحة المفاتيح
// ============================================
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const isApp = document.getElementById('studioApp')?.style.display !== 'none';
    if (!isApp) return;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z': e.preventDefault(); e.shiftKey ? historyRedo() : historyUndo(); break;
        case 'y': e.preventDefault(); historyRedo(); break;
        case 's': e.preventDefault(); saveProject(); break;
        case 'c': e.preventDefault(); copySelected(); break;
        case 'v': e.preventDefault(); pasteContent(); break;
        case 'x': e.preventDefault(); cutSelected(); break;
        case 'a': e.preventDefault(); selectAll(); break;
        case 'd': e.preventDefault(); deselectAll(); break;
        case 'e': e.preventDefault(); exportAs('png'); break;
        case '+': case '=': e.preventDefault(); zoomIn(); break;
        case '-': e.preventDefault(); zoomOut(); break;
      }
      return;
    }

    switch (e.key) {
      case 'b': setTool('brush'); break;
      case 'e': setTool('eraser'); break;
      case 'v': setTool('select'); break;
      case 'g': setTool('fill'); break;
      case 'i': setTool('eyedropper'); break;
      case 't': setTool('text'); break;
      case 'h': setTool('hand'); break;
      case 'p': setTool('pencil'); break;
      case 'r': setTool('rect'); break;
      case 'c': setTool('circle'); break;
      case 'l': setTool('line'); break;
      case 'x': swapColors(); break;
      case 'F11': e.preventDefault(); toggleFullscreen(); break;
      case ' ':
        if (S.projectType === 'animated') { e.preventDefault(); togglePlay(); }
        break;
      case '[':
        S.brush.size = Math.max(1, S.brush.size - 2);
        document.getElementById('brushSize').value = S.brush.size;
        document.getElementById('brushSizeVal').textContent = S.brush.size;
        break;
      case ']':
        S.brush.size = Math.min(500, S.brush.size + 2);
        document.getElementById('brushSize').value = S.brush.size;
        document.getElementById('brushSizeVal').textContent = S.brush.size;
        break;
      case '+': case '=': zoomIn(); break;
      case '-': zoomOut(); break;
    }
  });
}
