/* ================================================
   استوديو صفوان - app.js
   ================================================ */

'use strict';

// ============================
// STATE
// ============================
const App = {
  projects: [],
  currentProject: null,
  currentTool: 'brush',
  currentColor: '#000000',
  secondaryColor: '#ffffff',
  brushSize: 10,
  brushOpacity: 100,
  brushSmooth: 50,
  brushPressure: 70,
  currentBrush: 'safwan',
  layers: [],
  activeLayerIndex: 0,
  undoStack: [],
  redoStack: [],
  isDrawing: false,
  lastX: 0,
  lastY: 0,
  scale: 1,
  frameIndex: 0,
  frames: [],
  fps: 12,
  isPlaying: false,
  playInterval: null,
  onionSkin: false,
  exportFormat: 'png',
  exportQuality: 0.95,
  exportScale: 1,
  newProjectType: 'static',
  recentColors: [],
  colorH: 0, colorS: 0, colorV: 0,
  brightnessFactor: 1,
  isColorWheelDragging: false,
  isBrightnessDragging: false,
  smoothPoints: [],
  lastPressure: 1,
  canvasOffX: 0,
  canvasOffY: 0,
  projBg: 'white',
};

// ============================
// BRUSH DEFINITIONS
// ============================
const BRUSHES = [
  { id:'safwan', name:'فرشاة صفوان', cat:'أساسية', desc:'الفرشاة الاحترافية الرئيسية', pressure:true, smooth:true, texture:false },
  { id:'pen_soft', name:'قلم جبر طري', cat:'أقلام', desc:'خطوط ناعمة مرنة', pressure:true, smooth:true, texture:false },
  { id:'pen_hard', name:'قلم جبر قاسي', cat:'أقلام', desc:'خطوط حادة واضحة', pressure:false, smooth:false, texture:false },
  { id:'pen_liquid', name:'قلم جبر سائل', cat:'أقلام', desc:'محاكاة الحبر السائل', pressure:true, smooth:true, texture:false },
  { id:'marker_soft', name:'قلم رأسه لباد طري', cat:'أقلام', desc:'ماركر ناعم', pressure:true, smooth:true, texture:false },
  { id:'marker_hard', name:'قلم رأسه لباد صلب', cat:'أقلام', desc:'حواف حادة محددة', pressure:false, smooth:false, texture:false },
  { id:'pen_fade', name:'قلم يبهت', cat:'أقلام', desc:'يتلاشى عند نهاية الخط', pressure:true, smooth:true, texture:false },
  { id:'pen_digital', name:'القلم الرقمي', cat:'أقلام', desc:'دقيق ومستقيم', pressure:false, smooth:false, texture:false },
  { id:'pen_arabic', name:'قلم الخط العربي', cat:'أقلام', desc:'مصمم للخط العربي', pressure:true, smooth:true, texture:false },
  { id:'pen_calligraphy', name:'قلم الكاليغرافي', cat:'أقلام', desc:'للكتابة الفنية', pressure:true, smooth:true, texture:false },
  { id:'pencil_soft', name:'فرشاة رصاص ناعم', cat:'رسم طبيعي', desc:'محاكاة رصاص HB', pressure:true, smooth:false, texture:true },
  { id:'pencil_hard', name:'فرشاة رصاص خشن', cat:'رسم طبيعي', desc:'محاكاة رصاص 6B', pressure:true, smooth:false, texture:true },
  { id:'charcoal', name:'فرشاة فحم', cat:'رسم طبيعي', desc:'ملمس فحم حقيقي', pressure:true, smooth:false, texture:true },
  { id:'chalk', name:'فرشاة طباشير', cat:'رسم طبيعي', desc:'ملمس طباشير جاف', pressure:true, smooth:false, texture:true },
  { id:'pastel', name:'فرشاة باستيل', cat:'رسم طبيعي', desc:'ألوان باستيل ناعمة', pressure:true, smooth:true, texture:true },
  { id:'ink', name:'فرشاة قلم حبر', cat:'رسم طبيعي', desc:'تدفق حبر واقعي', pressure:true, smooth:true, texture:false },
  { id:'oil_classic', name:'فرشاة زيت كلاسيكية', cat:'طلاء', desc:'محاكاة الزيت الحقيقي', pressure:true, smooth:true, texture:true },
  { id:'oil_fan', name:'فرشاة زيت مروحة', cat:'طلاء', desc:'تأثير ريشة مروحة', pressure:true, smooth:false, texture:true },
  { id:'watercolor_soft', name:'ألوان مائية ناعمة', cat:'طلاء', desc:'تلاشٍ طبيعي', pressure:true, smooth:true, texture:true },
  { id:'watercolor_rough', name:'ألوان مائية خشنة', cat:'طلاء', desc:'ملمس ورق مائي', pressure:true, smooth:false, texture:true },
  { id:'gouache', name:'فرشاة غواش', cat:'طلاء', desc:'ألوان معتمة كثيفة', pressure:true, smooth:true, texture:false },
  { id:'acrylic', name:'فرشاة أكريليك', cat:'طلاء', desc:'ألوان سميكة قوية', pressure:true, smooth:true, texture:true },
  { id:'stars', name:'فرشاة نجوم', cat:'تأثيرات', desc:'رش نجوم ولمعات', pressure:true, smooth:false, texture:false },
  { id:'fog', name:'فرشاة ضبيضب', cat:'تأثيرات', desc:'تأثير الضباب والغبار', pressure:true, smooth:true, texture:true },
  { id:'fire', name:'فرشاة نار', cat:'تأثيرات', desc:'تأثيرات نارية', pressure:true, smooth:true, texture:false },
  { id:'water_ripple', name:'فرشاة ماء', cat:'تأثيرات', desc:'تموجات مائية', pressure:true, smooth:true, texture:false },
  { id:'leaves', name:'فرشاة غابة', cat:'تأثيرات', desc:'أوراق شجر عشوائية', pressure:true, smooth:false, texture:false },
  { id:'rain', name:'فرشاة مطر', cat:'تأثيرات', desc:'نقاط مطر متناثرة', pressure:true, smooth:false, texture:false },
  { id:'snow', name:'فرشاة ثلج', cat:'تأثيرات', desc:'رقاقات ثلج', pressure:true, smooth:false, texture:false },
  { id:'smoke', name:'فرشاة دخان', cat:'تأثيرات', desc:'تأثير دخان متصاعد', pressure:true, smooth:true, texture:true },
  { id:'shadow_soft', name:'فرشاة تظليل ناعم', cat:'تظليل', desc:'للظلال الناعمة', pressure:true, smooth:true, texture:false },
  { id:'hatch', name:'فرشاة تظليل هاشور', cat:'تظليل', desc:'خطوط هاشور', pressure:true, smooth:false, texture:false },
  { id:'highlight', name:'فرشاة إضاءة', cat:'تظليل', desc:'إبراز النقاط المضيئة', pressure:true, smooth:true, texture:false },
  { id:'glow', name:'فرشاة توهج', cat:'تظليل', desc:'تأثير توهج وهالة', pressure:true, smooth:true, texture:false },
  { id:'gradient_brush', name:'فرشاة تدرج', cat:'تظليل', desc:'تدرج لوني سلس', pressure:true, smooth:true, texture:false },
  { id:'manga_line', name:'خط المانغا', cat:'مانغا', desc:'مخصصة للمانغا', pressure:true, smooth:true, texture:false },
  { id:'manga_screen', name:'تظليل المانغا', cat:'مانغا', desc:'نقاط هالفتون', pressure:false, smooth:false, texture:true },
  { id:'manga_speed', name:'خطوط السرعة', cat:'مانغا', desc:'خطوط سرعة المانغا', pressure:true, smooth:false, texture:false },
  { id:'manga_fx', name:'تأثير المانغا', cat:'مانغا', desc:'تعبيرات مانغا', pressure:true, smooth:false, texture:false },
  { id:'comics', name:'فرشاة الكوميكس', cat:'مانغا', desc:'نمط قصص مصورة', pressure:true, smooth:true, texture:false },
  { id:'hair', name:'فرشاة الشعر', cat:'ذكية', desc:'رسم شعر واقعي', pressure:true, smooth:true, texture:false },
  { id:'fur', name:'فرشاة الفراء', cat:'ذكية', desc:'رسم فراء وريش', pressure:true, smooth:true, texture:true },
  { id:'skin', name:'فرشاة الجلد', cat:'ذكية', desc:'ملمس جلدي', pressure:true, smooth:true, texture:true },
  { id:'stone', name:'فرشاة الحجر', cat:'ذكية', desc:'ملمس صخري', pressure:true, smooth:false, texture:true },
  { id:'wood', name:'فرشاة الخشب', cat:'ذكية', desc:'حبوب خشب طبيعية', pressure:true, smooth:false, texture:true },
];

// ============================
// INIT
// ============================
window.addEventListener('DOMContentLoaded', () => {
  loadProjects();
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    splash.classList.add('fade-out');
    setTimeout(() => { splash.style.display='none'; }, 500);
  }, 2200);
  initColorWheel();
  renderBrushPanel();
  applyDarkMode(true);
  renderRecentProjects();
});

// ============================
// PAGE NAVIGATION
// ============================
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });
  const pg = document.getElementById(id);
  if (pg) { pg.classList.remove('hidden'); pg.classList.add('active'); }
}

function goHome() {
  if (App.isPlaying) stopPlayback();
  renderRecentProjects();
  showPage('page-home');
}

function showSettings() { showPage('page-settings'); }

function showAllProjects() {
  renderAllProjects();
  showPage('page-all-projects');
}

// ============================
// PROJECTS - Storage
// ============================
function loadProjects() {
  try {
    const raw = localStorage.getItem('safwan_projects');
    App.projects = raw ? JSON.parse(raw) : [];
  } catch(e) { App.projects = []; }
}

function saveProjects() {
  try { localStorage.setItem('safwan_projects', JSON.stringify(App.projects)); }
  catch(e) {}
}

function getTimestamp() {
  const d = new Date();
  return d.toLocaleDateString('ar-SA') + ' ' + d.toLocaleTimeString('ar-SA', {hour:'2-digit',minute:'2-digit'});
}

// ============================
// NEW PROJECT DIALOG
// ============================
function showNewProjectDialog(type) {
  App.newProjectType = type;
  document.getElementById('dialog-title').textContent = type==='animated' ? 'رسوم متحركة جديدة' : 'رسم ثابت جديد';
  document.getElementById('fps-group').style.display = type==='animated' ? 'block' : 'none';
  document.getElementById('proj-name').value = type==='animated' ? 'رسوم متحركة' : 'رسم جديد';
  // Show animated export btns if needed
  openDialog('dialog-new-project');
}

function selectSize(btn) {
  document.querySelectorAll('.size-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('proj-width').value = btn.dataset.w;
  document.getElementById('proj-height').value = btn.dataset.h;
}

function selectFps(btn) {
  document.querySelectorAll('.fps-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  App.fps = parseInt(btn.dataset.fps);
}

function selectBg(btn) {
  document.querySelectorAll('.bg-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  App.projBg = btn.dataset.bg;
}

function createProject() {
  const name = document.getElementById('proj-name').value.trim() || 'مشروع';
  const w = parseInt(document.getElementById('proj-width').value) || 1080;
  const h = parseInt(document.getElementById('proj-height').value) || 1080;
  const type = App.newProjectType;

  const project = {
    id: Date.now().toString(),
    name, type, width: w, height: h, fps: App.fps,
    bg: App.projBg, created: getTimestamp(), modified: getTimestamp(),
    frames: [{ id: 1, duration: 1/App.fps, layers: [{ id:1, name:'طبقة 1', visible:true, locked:false, opacity:100, blendMode:'normal', dataURL: null }] }],
    thumbnail: null
  };

  App.projects.unshift(project);
  saveProjects();
  closeDialog('dialog-new-project');
  openProject(project);
}

// ============================
// RENDER PROJECTS
// ============================
function renderRecentProjects() {
  const el = document.getElementById('recent-projects-list');
  if (!el) return;
  if (App.projects.length === 0) {
    el.innerHTML = `<div class="empty-projects">
      <svg viewBox="0 0 64 64" fill="none"><rect x="8" y="8" width="48" height="48" rx="6" stroke="currentColor" stroke-width="2" opacity="0.4"/><path d="M24 32h16M32 24v16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/></svg>
      <p>لا توجد مشاريع بعد</p><span>ابدأ بإنشاء مشروع جديد</span>
    </div>`;
    return;
  }
  el.innerHTML = '';
  const recent = App.projects.slice(0, 6);
  recent.forEach((proj, i) => {
    el.appendChild(createProjectCard(proj, i));
  });
}

function renderAllProjects() {
  const el = document.getElementById('all-projects-grid');
  if (!el) return;
  el.innerHTML = '';
  if (App.projects.length === 0) {
    el.innerHTML = `<div class="empty-projects" style="grid-column:span 2">
      <svg viewBox="0 0 64 64" fill="none"><rect x="8" y="8" width="48" height="48" rx="6" stroke="currentColor" stroke-width="2" opacity="0.4"/></svg>
      <p>لا توجد مشاريع</p>
    </div>`;
    return;
  }
  App.projects.forEach((proj, i) => el.appendChild(createProjectCard(proj, i)));
}

function createProjectCard(proj, i) {
  const card = document.createElement('div');
  card.className = 'project-card';
  card.style.animationDelay = (i*0.05)+'s';
  const badge = proj.type === 'animated' ? '<span class="pc-badge">متحرك</span>' : '';
  card.innerHTML = `
    <div class="pc-thumb">
      ${proj.thumbnail ? `<img src="${proj.thumbnail}" style="width:100%;height:100%;object-fit:cover"/>` : `
      <div class="pc-thumb-placeholder">
        <svg viewBox="0 0 48 48" fill="none">
          <rect x="6" y="6" width="36" height="36" rx="4" stroke="currentColor" stroke-width="2" opacity="0.4"/>
          <path d="M14 30 Q20 18 24 24 Q28 30 34 20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.4"/>
        </svg>
      </div>`}
      ${badge}
    </div>
    <div class="pc-info"><h4>${proj.name}</h4><span>${proj.modified || proj.created}</span></div>
    <button class="pc-menu-btn" onclick="event.stopPropagation(); showProjectMenu(event, '${proj.id}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
      </svg>
    </button>
  `;
  card.addEventListener('click', () => openProject(proj));
  return card;
}

function showProjectMenu(e, projId) {
  removeContextMenu();
  const proj = App.projects.find(p => p.id === projId);
  if (!proj) return;
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.id = 'ctx-menu';
  menu.style.cssText = `top:${e.clientY}px;right:${window.innerWidth - e.clientX}px`;
  menu.innerHTML = `
    <div class="ctx-item" onclick="removeContextMenu(); openProject(App.projects.find(p=>p.id==='${projId}'))">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      فتح وتعديل
    </div>
    <div class="ctx-item" onclick="removeContextMenu(); renameProject('${projId}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
      إعادة تسمية
    </div>
    <div class="ctx-item" onclick="removeContextMenu(); duplicateProject('${projId}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      نسخ
    </div>
    <div class="ctx-item danger" onclick="removeContextMenu(); deleteProject('${projId}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      حذف
    </div>
  `;
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', removeContextMenu, {once:true}), 10);
}

function removeContextMenu() {
  const m = document.getElementById('ctx-menu');
  if (m) m.remove();
}

function renameProject(id) {
  const proj = App.projects.find(p=>p.id===id);
  if (!proj) return;
  const n = prompt('اسم جديد:', proj.name);
  if (n && n.trim()) { proj.name = n.trim(); saveProjects(); renderRecentProjects(); }
}

function duplicateProject(id) {
  const proj = App.projects.find(p=>p.id===id);
  if (!proj) return;
  const copy = JSON.parse(JSON.stringify(proj));
  copy.id = Date.now().toString();
  copy.name = proj.name + ' - نسخة';
  copy.created = copy.modified = getTimestamp();
  App.projects.unshift(copy);
  saveProjects();
  renderRecentProjects();
  showToast('تم نسخ المشروع');
}

function deleteProject(id) {
  if (!confirm('هل تريد حذف هذا المشروع؟')) return;
  App.projects = App.projects.filter(p=>p.id!==id);
  saveProjects();
  renderRecentProjects();
  renderAllProjects();
  showToast('تم حذف المشروع');
}

function deleteAllProjects() {
  if (!confirm('هل تريد حذف كل المشاريع؟')) return;
  App.projects = [];
  saveProjects();
  renderRecentProjects();
  showToast('تم حذف كل المشاريع');
}

// ============================
// OPEN PROJECT / EDITOR
// ============================
function openProject(proj) {
  App.currentProject = proj;
  App.frameIndex = 0;
  App.frames = proj.frames || [{ id:1, duration:1/12, layers:[{ id:1, name:'طبقة 1', visible:true, locked:false, opacity:100, blendMode:'normal', dataURL:null }] }];
  App.fps = proj.fps || 12;
  document.getElementById('canvas-title').textContent = proj.name;
  document.getElementById('fps-display').textContent = App.fps;

  showPage('page-canvas');

  const isAnimated = proj.type === 'animated';
  const timeline = document.getElementById('timeline-panel');
  timeline.style.display = isAnimated ? 'flex' : 'none';

  if (proj.type === 'animated') {
    document.getElementById('gif-btn').style.display = 'block';
    document.getElementById('mp4-btn').style.display = 'block';
  }

  initCanvas(proj);
  renderLayersPanel();
  if (isAnimated) renderTimeline();
}

function exitEditor() {
  autoSave();
  if (App.isPlaying) stopPlayback();
  goHome();
}

function autoSave() {
  if (!App.currentProject) return;
  const canv = document.getElementById('main-canvas');
  // save thumbnail
  try {
    const tCanvas = document.createElement('canvas');
    tCanvas.width = 200; tCanvas.height = 200;
    const tCtx = tCanvas.getContext('2d');
    tCtx.drawImage(canv, 0, 0, 200, 200);
    App.currentProject.thumbnail = tCanvas.toDataURL('image/jpeg', 0.5);
  } catch(e) {}
  // save frame layer data
  saveCurrentLayerToFrame();
  App.currentProject.frames = App.frames;
  App.currentProject.modified = getTimestamp();
  saveProjects();
}

// ============================
// CANVAS INIT
// ============================
function initCanvas(proj) {
  const container = document.getElementById('canvas-container');
  const wrapper = document.getElementById('canvas-wrapper');
  const canvas = document.getElementById('main-canvas');
  const overlay = document.getElementById('overlay-canvas');

  canvas.width = proj.width;
  canvas.height = proj.height;
  overlay.width = proj.width;
  overlay.height = proj.height;
  wrapper.style.width = proj.width + 'px';
  wrapper.style.height = proj.height + 'px';

  // Scale to fit screen
  const cw = container.clientWidth - 20;
  const ch = container.clientHeight - 20;
  App.scale = Math.min(cw / proj.width, ch / proj.height, 1);
  wrapper.style.transform = `scale(${App.scale})`;
  wrapper.style.transformOrigin = 'center center';

  // Fill background
  const ctx = canvas.getContext('2d');
  if (proj.bg === 'white') { ctx.fillStyle='#fff'; ctx.fillRect(0,0,proj.width,proj.height); }
  else if (proj.bg === 'black') { ctx.fillStyle='#000'; ctx.fillRect(0,0,proj.width,proj.height); }

  // Load current frame layer
  loadCurrentFrameToCanvas();
  setupDrawingEvents(overlay, proj);
}

function loadCurrentFrameToCanvas() {
  const frame = App.frames[App.frameIndex];
  if (!frame) return;
  const canvas = document.getElementById('main-canvas');
  const ctx = canvas.getContext('2d');

  // Clear
  const proj = App.currentProject;
  if (proj.bg === 'white') { ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); }
  else if (proj.bg === 'black') { ctx.fillStyle='#000'; ctx.fillRect(0,0,canvas.width,canvas.height); }
  else { ctx.clearRect(0,0,canvas.width,canvas.height); }

  // Draw all visible layers
  App.layers = frame.layers || [];
  App.layers.forEach(layer => {
    if (!layer.visible || !layer.dataURL) return;
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = layer.opacity/100;
      ctx.globalCompositeOperation = blendModeToCanvas(layer.blendMode);
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };
    img.src = layer.dataURL;
  });
  App.activeLayerIndex = 0;
}

function saveCurrentLayerToFrame() {
  const frame = App.frames[App.frameIndex];
  if (!frame || !App.layers[App.activeLayerIndex]) return;
  const canvas = document.getElementById('main-canvas');
  // Save the composited canvas as the layer data (simplified for single-layer use)
  App.layers[App.activeLayerIndex].dataURL = canvas.toDataURL();
  frame.layers = App.layers;
}

function blendModeToCanvas(mode) {
  const map = { normal:'source-over', multiply:'multiply', screen:'screen', overlay:'overlay', 'soft-light':'soft-light', 'hard-light':'hard-light', difference:'difference', exclusion:'exclusion', 'color-dodge':'color-dodge', 'color-burn':'color-burn' };
  return map[mode] || 'source-over';
}

// ============================
// DRAWING EVENTS
// ============================
function setupDrawingEvents(overlay, proj) {
  App.isDrawing = false;
  App.smoothPoints = [];

  overlay.removeEventListener('touchstart', touchStart);
  overlay.removeEventListener('touchmove', touchMove);
  overlay.removeEventListener('touchend', touchEnd);
  overlay.removeEventListener('mousedown', mouseDown);
  overlay.removeEventListener('mousemove', mouseMove);
  overlay.removeEventListener('mouseup', mouseUp);

  overlay.addEventListener('touchstart', touchStart, {passive:false});
  overlay.addEventListener('touchmove', touchMove, {passive:false});
  overlay.addEventListener('touchend', touchEnd, {passive:false});
  overlay.addEventListener('mousedown', mouseDown);
  overlay.addEventListener('mousemove', mouseMove);
  overlay.addEventListener('mouseup', mouseUp);
  overlay.addEventListener('mouseleave', mouseUp);
}

function getCanvasPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (e.touches) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: (clientX - rect.left) / App.scale,
    y: (clientY - rect.top) / App.scale
  };
}

function touchStart(e) { e.preventDefault(); mouseDown(e); }
function touchMove(e) { e.preventDefault(); mouseMove(e); }
function touchEnd(e) { e.preventDefault(); mouseUp(e); }

function mouseDown(e) {
  if (App.currentTool === 'eyedropper') { pickColor(e); return; }
  if (App.currentTool === 'fill') { floodFill(e); return; }
  if (App.currentTool === 'text') { addText(e); return; }
  App.isDrawing = true;
  const overlay = document.getElementById('overlay-canvas');
  const pos = getCanvasPos(e, overlay);
  App.lastX = pos.x;
  App.lastY = pos.y;
  App.smoothPoints = [pos];
  // Push to undo
  pushUndoState();

  const layer = App.layers[App.activeLayerIndex];
  if (layer && layer.locked) { App.isDrawing = false; showToast('الطبقة مقفلة'); return; }

  if (App.currentTool === 'brush' || App.currentTool === 'eraser') {
    const ctx = document.getElementById('main-canvas').getContext('2d');
    applyBrushStrokeStart(ctx, pos.x, pos.y, e);
  } else if (App.currentTool === 'line' || App.currentTool === 'rect' || App.currentTool === 'circle') {
    App.shapeStart = pos;
  }
}

function mouseMove(e) {
  if (!App.isDrawing) return;
  const overlay = document.getElementById('overlay-canvas');
  const pos = getCanvasPos(e, overlay);

  if (App.currentTool === 'brush' || App.currentTool === 'eraser') {
    App.smoothPoints.push(pos);
    const ctx = document.getElementById('main-canvas').getContext('2d');
    drawSmoothedStroke(ctx, pos.x, pos.y, e);
  } else if (App.currentTool === 'line' || App.currentTool === 'rect' || App.currentTool === 'circle') {
    drawShapePreview(pos);
  } else if (App.currentTool === 'move') {
    const dx = (pos.x - App.lastX);
    const dy = (pos.y - App.lastY);
    shiftCanvas(dx, dy);
    App.lastX = pos.x; App.lastY = pos.y;
  }
}

function mouseUp(e) {
  if (!App.isDrawing) return;
  App.isDrawing = false;
  const overlay = document.getElementById('overlay-canvas');
  const pos = getCanvasPos(e.changedTouches ? e.changedTouches[0] ? e : e : e, overlay);

  if (App.currentTool === 'line' || App.currentTool === 'rect' || App.currentTool === 'circle') {
    if (App.shapeStart) commitShape(pos);
    const octx = overlay.getContext('2d');
    octx.clearRect(0,0,overlay.width,overlay.height);
  }
  autoSave();
  addRecentColor(App.currentColor);
}

// ============================
// BRUSH STROKES
// ============================
function applyBrushStrokeStart(ctx, x, y, e) {
  const pressure = e.touches && e.touches[0] && e.touches[0].force ? e.touches[0].force : App.brushPressure/100;
  const size = getBrushSize(pressure);
  ctx.globalCompositeOperation = App.currentTool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.globalAlpha = App.brushOpacity/100;
  ctx.fillStyle = App.currentColor;
  ctx.beginPath();
  ctx.arc(x, y, size/2, 0, Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  App.lastX = x; App.lastY = y;
}

function drawSmoothedStroke(ctx, x, y, e) {
  const pressure = e.touches && e.touches[0] && e.touches[0].force ? e.touches[0].force : App.brushPressure/100;
  const smooth = App.brushSmooth / 100;
  const sx = App.lastX + (x - App.lastX) * (1-smooth*0.8);
  const sy = App.lastY + (y - App.lastY) * (1-smooth*0.8);

  const size = getBrushSize(pressure);
  ctx.globalCompositeOperation = App.currentTool === 'eraser' ? 'destination-out' : 'source-over';

  if (App.currentTool === 'eraser') {
    ctx.globalAlpha = App.brushOpacity/100;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.beginPath();
    ctx.moveTo(App.lastX, App.lastY);
    ctx.quadraticCurveTo(App.lastX, App.lastY, sx, sy);
    ctx.stroke();
  } else {
    ctx.globalAlpha = (App.brushOpacity/100) * 0.9;
    ctx.lineWidth = size;
    ctx.lineCap = getBrushLineCap();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = App.currentColor;
    ctx.beginPath();
    ctx.moveTo(App.lastX, App.lastY);
    ctx.quadraticCurveTo(App.lastX, App.lastY, sx, sy);
    ctx.stroke();

    // Special brush effects
    applyBrushSpecialEffect(ctx, sx, sy, size, pressure);
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  App.lastX = sx; App.lastY = sy;
}

function getBrushSize(pressure) {
  const base = App.brushSize;
  const brush = BRUSHES.find(b=>b.id===App.currentBrush);
  if (brush && brush.pressure) {
    return Math.max(1, base * (0.3 + pressure * 0.7));
  }
  return base;
}

function getBrushLineCap() {
  const b = App.currentBrush;
  if (['pen_hard','marker_hard','pen_digital','manga_line'].includes(b)) return 'square';
  return 'round';
}

function applyBrushSpecialEffect(ctx, x, y, size, pressure) {
  switch(App.currentBrush) {
    case 'stars':
      if (Math.random() < 0.3) {
        ctx.globalAlpha = (App.brushOpacity/100) * Math.random() * 0.8;
        ctx.fillStyle = App.currentColor;
        const starSize = size * (0.3 + Math.random()*0.7);
        const sx = x + (Math.random()-0.5)*size*3;
        const sy2 = x + (Math.random()-0.5)*size*3;
        drawStar(ctx, sx, y + (Math.random()-0.5)*size*3, starSize);
      }
      break;
    case 'fog':
    case 'smoke':
      ctx.globalAlpha = (App.brushOpacity/100) * 0.03;
      for (let i=0; i<3; i++) {
        const ox = x + (Math.random()-0.5)*size*2;
        const oy = y + (Math.random()-0.5)*size*2;
        const r = size * (0.5 + Math.random());
        const grad = ctx.createRadialGradient(ox,oy,0,ox,oy,r);
        grad.addColorStop(0, App.currentColor);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(ox,oy,r,0,Math.PI*2); ctx.fill();
      }
      break;
    case 'pencil_soft':
    case 'pencil_hard':
    case 'charcoal':
    case 'chalk':
      if (Math.random() < 0.4) {
        ctx.globalAlpha = (App.brushOpacity/100) * 0.05;
        const noise_x = x + (Math.random()-0.5)*size;
        const noise_y = y + (Math.random()-0.5)*size;
        ctx.fillStyle = App.currentColor;
        ctx.fillRect(noise_x, noise_y, Math.random()*2, Math.random()*2);
      }
      break;
    case 'watercolor_soft':
    case 'watercolor_rough':
      ctx.globalAlpha = (App.brushOpacity/100) * 0.04;
      for (let i=0; i<2; i++) {
        const wx = x + (Math.random()-0.5)*size*1.5;
        const wy = y + (Math.random()-0.5)*size*1.5;
        const wr = size * Math.random() * 0.8;
        ctx.fillStyle = App.currentColor;
        ctx.beginPath(); ctx.arc(wx,wy,wr,0,Math.PI*2); ctx.fill();
      }
      break;
    case 'leaves':
      if (Math.random() < 0.15) {
        ctx.globalAlpha = (App.brushOpacity/100) * (0.5 + Math.random()*0.5);
        ctx.fillStyle = App.currentColor;
        ctx.save();
        ctx.translate(x + (Math.random()-0.5)*size*3, y + (Math.random()-0.5)*size*3);
        ctx.rotate(Math.random()*Math.PI*2);
        ctx.beginPath();
        ctx.ellipse(0,0,size*0.4,size*0.2,0,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
      }
      break;
    case 'rain':
      if (Math.random() < 0.3) {
        ctx.globalAlpha = (App.brushOpacity/100) * 0.6;
        ctx.strokeStyle = App.currentColor;
        ctx.lineWidth = 1;
        const rx = x + (Math.random()-0.5)*size*4;
        const ry = y + (Math.random()-0.5)*size*4;
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx-1, ry+size*0.5); ctx.stroke();
      }
      break;
    case 'snow':
      if (Math.random() < 0.2) {
        ctx.globalAlpha = (App.brushOpacity/100) * (0.5+Math.random()*0.5);
        ctx.fillStyle = App.currentColor;
        const snx = x + (Math.random()-0.5)*size*4;
        const sny = y + (Math.random()-0.5)*size*4;
        const snr = size*0.15 + Math.random()*size*0.1;
        ctx.beginPath(); ctx.arc(snx,sny,snr,0,Math.PI*2); ctx.fill();
      }
      break;
    case 'glow':
    case 'highlight':
      ctx.globalAlpha = (App.brushOpacity/100) * 0.05;
      const gr = ctx.createRadialGradient(x,y,0,x,y,size*2);
      gr.addColorStop(0, App.currentColor);
      gr.addColorStop(1, 'transparent');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(x,y,size*2,0,Math.PI*2); ctx.fill();
      break;
  }
}

function drawStar(ctx, x, y, size) {
  ctx.save(); ctx.translate(x,y);
  ctx.beginPath();
  for(let i=0;i<5;i++){
    const a = (i*4*Math.PI/5) - Math.PI/2;
    const ia = ((i*4+2)*Math.PI/5) - Math.PI/2;
    if(i===0) ctx.moveTo(Math.cos(a)*size, Math.sin(a)*size);
    else ctx.lineTo(Math.cos(a)*size, Math.sin(a)*size);
    ctx.lineTo(Math.cos(ia)*size*0.4, Math.sin(ia)*size*0.4);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

// ============================
// SHAPES
// ============================
function drawShapePreview(pos) {
  const overlay = document.getElementById('overlay-canvas');
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0,0,overlay.width,overlay.height);
  ctx.strokeStyle = App.currentColor;
  ctx.fillStyle = App.currentColor + '33';
  ctx.lineWidth = App.brushSize;
  ctx.globalAlpha = App.brushOpacity/100;
  const s = App.shapeStart;
  if (!s) return;
  if (App.currentTool === 'line') {
    ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(pos.x,pos.y); ctx.stroke();
  } else if (App.currentTool === 'rect') {
    ctx.beginPath(); ctx.rect(s.x,s.y,pos.x-s.x,pos.y-s.y); ctx.stroke(); ctx.fill();
  } else if (App.currentTool === 'circle') {
    const rx = Math.abs(pos.x-s.x)/2, ry = Math.abs(pos.y-s.y)/2;
    ctx.beginPath(); ctx.ellipse(s.x+(pos.x-s.x)/2,s.y+(pos.y-s.y)/2,rx,ry,0,0,Math.PI*2); ctx.stroke(); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function commitShape(pos) {
  const canvas = document.getElementById('main-canvas');
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = App.currentColor;
  ctx.fillStyle = App.currentColor + '33';
  ctx.lineWidth = App.brushSize;
  ctx.lineCap = 'round';
  ctx.globalAlpha = App.brushOpacity/100;
  const s = App.shapeStart;
  if (App.currentTool === 'line') {
    ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(pos.x,pos.y); ctx.stroke();
  } else if (App.currentTool === 'rect') {
    ctx.beginPath(); ctx.rect(s.x,s.y,pos.x-s.x,pos.y-s.y); ctx.stroke(); ctx.fill();
  } else if (App.currentTool === 'circle') {
    const rx = Math.abs(pos.x-s.x)/2, ry = Math.abs(pos.y-s.y)/2;
    ctx.beginPath(); ctx.ellipse(s.x+(pos.x-s.x)/2,s.y+(pos.y-s.y)/2,rx,ry,0,0,Math.PI*2); ctx.stroke(); ctx.fill();
  }
  ctx.globalAlpha = 1;
  App.shapeStart = null;
}

function shiftCanvas(dx, dy) {
  const canvas = document.getElementById('main-canvas');
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.putImageData(imgData, dx, dy);
}

// ============================
// FILL (FLOOD FILL)
// ============================
function floodFill(e) {
  const overlay = document.getElementById('overlay-canvas');
  const canvas = document.getElementById('main-canvas');
  const pos = getCanvasPos(e, overlay);
  const ctx = canvas.getContext('2d');
  const x = Math.floor(pos.x), y = Math.floor(pos.y);
  if (x<0||y<0||x>=canvas.width||y>=canvas.height) return;
  pushUndoState();
  const imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
  const data = imgData.data;
  const idx = (y*canvas.width+x)*4;
  const targetR=data[idx],targetG=data[idx+1],targetB=data[idx+2],targetA=data[idx+3];
  const fillRGB = hexToRgb(App.currentColor);
  if (!fillRGB) return;
  if (targetR===fillRGB.r && targetG===fillRGB.g && targetB===fillRGB.b) return;
  const stack = [[x,y]];
  const visited = new Uint8Array(canvas.width*canvas.height);
  function match(i){ return Math.abs(data[i]-targetR)<30 && Math.abs(data[i+1]-targetG)<30 && Math.abs(data[i+2]-targetB)<30 && Math.abs(data[i+3]-targetA)<30; }
  while (stack.length) {
    const [cx,cy] = stack.pop();
    if (cx<0||cy<0||cx>=canvas.width||cy>=canvas.height) continue;
    const ci = cy*canvas.width+cx;
    if (visited[ci]) continue;
    visited[ci] = 1;
    const pi = ci*4;
    if (!match(pi)) continue;
    data[pi]=fillRGB.r; data[pi+1]=fillRGB.g; data[pi+2]=fillRGB.b; data[pi+3]=Math.round(App.brushOpacity/100*255);
    stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
  }
  ctx.putImageData(imgData,0,0);
  autoSave();
}

// ============================
// EYEDROPPER
// ============================
function pickColor(e) {
  const overlay = document.getElementById('overlay-canvas');
  const canvas = document.getElementById('main-canvas');
  const pos = getCanvasPos(e, overlay);
  const ctx = canvas.getContext('2d');
  const p = ctx.getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1).data;
  const hex = '#' + [p[0],p[1],p[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
  setCurrentColor(hex);
  selectTool('brush', document.querySelector('[data-tool=brush]'));
  showToast('تم اختيار اللون');
}

// ============================
// TEXT TOOL
// ============================
function addText(e) {
  const overlay = document.getElementById('overlay-canvas');
  const pos = getCanvasPos(e, overlay);
  const txt = prompt('أدخل النص:');
  if (!txt) return;
  pushUndoState();
  const canvas = document.getElementById('main-canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = App.currentColor;
  ctx.globalAlpha = App.brushOpacity/100;
  ctx.font = `${App.brushSize*3}px Tajawal, Cairo, sans-serif`;
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillText(txt, pos.x, pos.y);
  ctx.globalAlpha = 1;
  autoSave();
}

// ============================
// TOOLS
// ============================
function selectTool(tool, btn) {
  App.currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const isTransform = ['select','move'].includes(tool);
  document.getElementById('panel-brush').style.display = isTransform ? 'none' : 'block';
  document.getElementById('panel-transform').style.display = isTransform ? 'block' : 'none';

  const overlay = document.getElementById('overlay-canvas');
  if (tool === 'move') overlay.style.cursor = 'grab';
  else if (tool === 'eyedropper') overlay.style.cursor = 'crosshair';
  else if (tool === 'fill') overlay.style.cursor = 'cell';
  else overlay.style.cursor = 'crosshair';
}

function updateBrushSize(v) {
  App.brushSize = parseFloat(v);
  document.getElementById('brush-size-val').textContent = v;
}
function updateBrushOpacity(v) {
  App.brushOpacity = parseFloat(v);
  document.getElementById('brush-opacity-val').textContent = v+'%';
}
function updateBrushSmooth(v) {
  App.brushSmooth = parseFloat(v);
  document.getElementById('brush-smooth-val').textContent = v;
}
function updateBrushPressure(v) {
  App.brushPressure = parseFloat(v);
  document.getElementById('brush-pressure-val').textContent = v;
}

// ============================
// UNDO / REDO
// ============================
function pushUndoState() {
  const canvas = document.getElementById('main-canvas');
  if (!canvas) return;
  App.undoStack.push(canvas.toDataURL());
  if (App.undoStack.length > 30) App.undoStack.shift();
  App.redoStack = [];
}

function undoAction() {
  if (!App.undoStack.length) { showToast('لا يوجد شيء للتراجع عنه'); return; }
  const canvas = document.getElementById('main-canvas');
  App.redoStack.push(canvas.toDataURL());
  const prev = App.undoStack.pop();
  const img = new Image();
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0);
  };
  img.src = prev;
  showToast('تراجع');
}

function redoAction() {
  if (!App.redoStack.length) { showToast('لا يوجد شيء للإعادة'); return; }
  const canvas = document.getElementById('main-canvas');
  App.undoStack.push(canvas.toDataURL());
  const next = App.redoStack.pop();
  const img = new Image();
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0);
  };
  img.src = next;
  showToast('إعادة');
}

// ============================
// TRANSFORM
// ============================
function applyTransform() {}
function applyRotation(v) {
  document.getElementById('tf-rot-val').textContent = v + '°';
}
function flipH() {
  pushUndoState();
  const canvas = document.getElementById('main-canvas');
  const ctx = canvas.getContext('2d');
  const tmp = document.createElement('canvas');
  tmp.width = canvas.width; tmp.height = canvas.height;
  tmp.getContext('2d').drawImage(canvas,0,0);
  ctx.save(); ctx.scale(-1,1); ctx.drawImage(tmp,-canvas.width,0); ctx.restore();
  showToast('قلب أفقي');
}
function flipV() {
  pushUndoState();
  const canvas = document.getElementById('main-canvas');
  const ctx = canvas.getContext('2d');
  const tmp = document.createElement('canvas');
  tmp.width = canvas.width; tmp.height = canvas.height;
  tmp.getContext('2d').drawImage(canvas,0,0);
  ctx.save(); ctx.scale(1,-1); ctx.drawImage(tmp,0,-canvas.height); ctx.restore();
  showToast('قلب عمودي');
}

// ============================
// LAYERS
// ============================
function renderLayersPanel() {
  const list = document.getElementById('layers-list');
  if (!list) return;
  list.innerHTML = '';
  const frame = App.frames[App.frameIndex];
  if (!frame) return;
  App.layers = frame.layers;
  [...App.layers].reverse().forEach((layer, ri) => {
    const i = App.layers.length - 1 - ri;
    const item = document.createElement('div');
    item.className = 'layer-item' + (i===App.activeLayerIndex?' active':'');
    item.innerHTML = `
      <div class="layer-thumb"><canvas width="40" height="30"></canvas></div>
      <div class="layer-info">
        <input type="text" value="${layer.name}" onchange="renameLayer(${i},this.value)" onclick="event.stopPropagation()"/>
        <span>${Math.round(layer.opacity)}%</span>
      </div>
      <button class="layer-vis-btn ${layer.visible?'':'hidden-layer'}" onclick="event.stopPropagation();toggleLayerVisibility(${i})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${layer.visible ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'}
        </svg>
      </button>
    `;
    item.addEventListener('click', () => setActiveLayer(i));
    // Draw thumbnail
    const thumbCanvas = item.querySelector('canvas');
    if (layer.dataURL) {
      const img = new Image();
      img.onload = () => thumbCanvas.getContext('2d').drawImage(img,0,0,40,30);
      img.src = layer.dataURL;
    }
    list.appendChild(item);
  });
}

function setActiveLayer(i) {
  App.activeLayerIndex = i;
  renderLayersPanel();
}

function addLayer() {
  const newId = Date.now();
  App.layers.push({ id:newId, name:'طبقة '+(App.layers.length+1), visible:true, locked:false, opacity:100, blendMode:'normal', dataURL:null });
  App.activeLayerIndex = App.layers.length-1;
  App.frames[App.frameIndex].layers = App.layers;
  renderLayersPanel();
  showToast('تمت إضافة طبقة');
}

function duplicateLayer() {
  const layer = App.layers[App.activeLayerIndex];
  if (!layer) return;
  const copy = JSON.parse(JSON.stringify(layer));
  copy.id = Date.now();
  copy.name = layer.name + ' - نسخة';
  App.layers.splice(App.activeLayerIndex+1, 0, copy);
  App.activeLayerIndex = App.activeLayerIndex+1;
  App.frames[App.frameIndex].layers = App.layers;
  renderLayersPanel();
  showToast('تم نسخ الطبقة');
}

function deleteLayer() {
  if (App.layers.length <= 1) { showToast('لا يمكن حذف الطبقة الوحيدة'); return; }
  App.layers.splice(App.activeLayerIndex, 1);
  App.activeLayerIndex = Math.max(0, App.activeLayerIndex-1);
  App.frames[App.frameIndex].layers = App.layers;
  renderLayersPanel();
  showToast('تم حذف الطبقة');
}

function mergeLayerDown() {
  if (App.activeLayerIndex === 0) { showToast('لا توجد طبقة تحت'); return; }
  const upper = App.layers[App.activeLayerIndex];
  const lower = App.layers[App.activeLayerIndex-1];
  const tmp = document.createElement('canvas');
  const proj = App.currentProject;
  tmp.width = proj.width; tmp.height = proj.height;
  const tctx = tmp.getContext('2d');
  if (lower.dataURL) { const i=new Image(); i.src=lower.dataURL; tctx.drawImage(i,0,0); }
  if (upper.dataURL) { const i=new Image(); i.src=upper.dataURL; tctx.globalAlpha=upper.opacity/100; tctx.drawImage(i,0,0); tctx.globalAlpha=1; }
  lower.dataURL = tmp.toDataURL();
  App.layers.splice(App.activeLayerIndex, 1);
  App.activeLayerIndex = App.activeLayerIndex-1;
  App.frames[App.frameIndex].layers = App.layers;
  renderLayersPanel();
  showToast('تم دمج الطبقتين');
}

function toggleLayerVisibility(i) {
  App.layers[i].visible = !App.layers[i].visible;
  loadCurrentFrameToCanvas();
  renderLayersPanel();
}

function renameLayer(i, name) { App.layers[i].name = name; }

function changeBlendMode(mode) {
  const layer = App.layers[App.activeLayerIndex];
  if (layer) { layer.blendMode = mode; loadCurrentFrameToCanvas(); }
}

function changeLayerOpacity(v) {
  document.getElementById('layer-opacity-val').textContent = v+'%';
  const layer = App.layers[App.activeLayerIndex];
  if (layer) { layer.opacity = parseFloat(v); loadCurrentFrameToCanvas(); }
}

function showLayersPanel() {
  renderLayersPanel();
  document.getElementById('layers-panel').classList.remove('hidden');
}
function hideLayersPanel() { document.getElementById('layers-panel').classList.add('hidden'); }

// ============================
// BRUSH PANEL
// ============================
function renderBrushPanel() {
  const container = document.getElementById('brush-categories');
  if (!container) return;
  const cats = [...new Set(BRUSHES.map(b=>b.cat))];
  container.innerHTML = '';
  cats.forEach(cat => {
    const header = document.createElement('div');
    header.className = 'brush-cat-header'; header.textContent = cat;
    container.appendChild(header);
    BRUSHES.filter(b=>b.cat===cat).forEach(brush => {
      const item = document.createElement('div');
      item.className = 'brush-item' + (brush.id===App.currentBrush?' active':'');
      item.dataset.id = brush.id;
      const checkSvg = `<svg class="bi-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
      item.innerHTML = `
        <div class="bi-preview"><canvas width="60" height="28"></canvas></div>
        <div class="bi-info"><h5>${brush.name}</h5><span>${brush.desc}</span></div>
        ${checkSvg}
      `;
      // Draw brush preview
      const previewCanvas = item.querySelector('canvas');
      drawBrushPreview(previewCanvas, brush);
      item.addEventListener('click', () => {
        App.currentBrush = brush.id;
        document.querySelectorAll('.brush-item').forEach(bi=>bi.classList.remove('active'));
        item.classList.add('active');
        document.getElementById('current-brush-name').textContent = brush.name;
        hideBrushPanel();
        showToast('تم اختيار: ' + brush.name);
      });
      container.appendChild(item);
    });
  });
}

function drawBrushPreview(canvas, brush) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,60,28);
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text') || '#e0e0e0';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(4,20);
  ctx.bezierCurveTo(15,4,25,24,38,12);
  ctx.bezierCurveTo(45,6,52,18,57,14);
  // Vary width based on brush type
  const widths = [1,2,3,4,3,2,1,2,3,4,3,2,1];
  widths.forEach((w,i) => {
    const t = i/widths.length;
    const x = 4 + t*53;
    ctx.lineWidth = w * (brush.pressure ? (0.5+t*0.5) : 1);
    ctx.globalAlpha = brush.id==='pen_fade' ? (1-t*0.8) : 0.85;
  });
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = brush.id==='pen_hard'||brush.id==='pen_digital' ? 2 : 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function filterBrushes(query) {
  const items = document.querySelectorAll('.brush-item');
  const headers = document.querySelectorAll('.brush-cat-header');
  const q = query.toLowerCase();
  items.forEach(item => {
    const name = item.querySelector('h5').textContent.toLowerCase();
    const desc = item.querySelector('span').textContent.toLowerCase();
    item.style.display = (name.includes(q)||desc.includes(q)) ? '' : 'none';
  });
  headers.forEach(h => {
    const cat = h.nextElementSibling;
    let visible = false;
    let s = h.nextElementSibling;
    while(s && s.classList.contains('brush-item')) { if(s.style.display!=='none') visible=true; s=s.nextElementSibling; }
    h.style.display = visible ? '' : 'none';
  });
}

function showBrushPanel() { document.getElementById('brush-panel').classList.remove('hidden'); }
function hideBrushPanel() { document.getElementById('brush-panel').classList.add('hidden'); }

// ============================
// COLOR WHEEL
// ============================
function initColorWheel() {
  const canvas = document.getElementById('color-wheel');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 110, cy = 110, r = 108;
  // Draw hue wheel
  for (let angle=0; angle<360; angle++) {
    const startAngle = (angle-1) * Math.PI/180;
    const endAngle = (angle+1) * Math.PI/180;
    const grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    grad.addColorStop(0, `hsla(${angle},0%,50%,0)`);
    grad.addColorStop(0.5, `hsla(${angle},50%,50%,0.5)`);
    grad.addColorStop(1, `hsla(${angle},100%,50%,1)`);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,startAngle,endAngle); ctx.closePath(); ctx.fill();
  }
  // White center
  const wg = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
  wg.addColorStop(0,'rgba(255,255,255,1)');
  wg.addColorStop(0.5,'rgba(255,255,255,0.5)');
  wg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();

  drawBrightnessBar(1);
  updateColorPreview();

  // Events
  canvas.addEventListener('touchstart', onWheelTouch, {passive:false});
  canvas.addEventListener('touchmove', onWheelTouch, {passive:false});
  canvas.addEventListener('mousedown', onWheelMouse);
  document.addEventListener('mousemove', e=>{ if(App.isColorWheelDragging) onWheelMouse(e); });
  document.addEventListener('mouseup', ()=>{ App.isColorWheelDragging=false; App.isBrightnessDragging=false; });

  const bbar = document.getElementById('brightness-bar');
  bbar.addEventListener('touchstart', onBrightnessTouch, {passive:false});
  bbar.addEventListener('touchmove', onBrightnessTouch, {passive:false});
  bbar.addEventListener('mousedown', onBrightnessMouse);
  document.addEventListener('mousemove', e=>{ if(App.isBrightnessDragging) onBrightnessMouse(e); });
}

function drawBrightnessBar(h) {
  const canvas = document.getElementById('brightness-bar');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0,0,220,0);
  grad.addColorStop(0,'#000');
  grad.addColorStop(0.5,`hsl(${h},100%,50%)`);
  grad.addColorStop(1,'#fff');
  ctx.fillStyle = grad; ctx.fillRect(0,0,220,24);
}

function onWheelTouch(e) {
  e.preventDefault();
  const t = e.touches[0];
  pickFromWheel(t.clientX, t.clientY);
}
function onWheelMouse(e) {
  if (e.type==='mousedown') App.isColorWheelDragging = true;
  if (App.isColorWheelDragging) pickFromWheel(e.clientX, e.clientY);
}

function pickFromWheel(clientX, clientY) {
  const canvas = document.getElementById('color-wheel');
  const rect = canvas.getBoundingClientRect();
  const x = clientX-rect.left, y = clientY-rect.top;
  // Cursor
  const cur = document.getElementById('color-wheel-cursor');
  cur.style.left = x+'px'; cur.style.top = y+'px';
  // Read pixel
  const ctx = canvas.getContext('2d');
  const px = ctx.getImageData(Math.floor(x),Math.floor(y),1,1).data;
  const r=px[0],g=px[1],b=px[2];
  // Apply brightness
  const factor = App.brightnessFactor;
  const fr = Math.min(255,Math.round(r*factor)), fg=Math.min(255,Math.round(g*factor)), fb=Math.min(255,Math.round(b*factor));
  const hex = '#'+[fr,fg,fb].map(v=>v.toString(16).padStart(2,'0')).join('');
  setCurrentColor(hex);
}

function onBrightnessTouch(e) { e.preventDefault(); pickBrightness(e.touches[0].clientX); }
function onBrightnessMouse(e) {
  if (e.type==='mousedown') App.isBrightnessDragging = true;
  if (App.isBrightnessDragging) pickBrightness(e.clientX);
}

function pickBrightness(clientX) {
  const canvas = document.getElementById('brightness-bar');
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0,Math.min(220,clientX-rect.left));
  App.brightnessFactor = x/110; // 0-2, 1 = normal
  const cur = document.getElementById('brightness-cursor');
  cur.style.left = x+'px';
}

function setCurrentColor(hex) {
  App.currentColor = hex;
  document.getElementById('current-color-swatch').style.background = hex;
  document.getElementById('hex-input').value = hex;
  document.getElementById('color-preview').style.background = hex;
  const rgb = hexToRgb(hex);
  if (rgb) {
    document.getElementById('r-slider').value = rgb.r;
    document.getElementById('g-slider').value = rgb.g;
    document.getElementById('b-slider').value = rgb.b;
    document.getElementById('r-val').value = rgb.r;
    document.getElementById('g-val').value = rgb.g;
    document.getElementById('b-val').value = rgb.b;
  }
}

function updateColorPreview() { setCurrentColor(App.currentColor); }

function updateFromRGB() {
  const r = parseInt(document.getElementById('r-slider').value);
  const g = parseInt(document.getElementById('g-slider').value);
  const b = parseInt(document.getElementById('b-slider').value);
  document.getElementById('r-val').value = r;
  document.getElementById('g-val').value = g;
  document.getElementById('b-val').value = b;
  const hex = '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
  setCurrentColor(hex);
}

function setColorFromHex(hex) {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) setCurrentColor(hex);
}

function setQuickColor(hex) { setCurrentColor(hex); }

function addRecentColor(hex) {
  App.recentColors = App.recentColors.filter(c=>c!==hex);
  App.recentColors.unshift(hex);
  if (App.recentColors.length > 12) App.recentColors.pop();
  const el = document.getElementById('recent-colors');
  if (!el) return;
  el.innerHTML = '';
  App.recentColors.forEach(c => {
    const d = document.createElement('div');
    d.className = 'recent-color-item'; d.style.background = c;
    d.onclick = () => setCurrentColor(c);
    el.appendChild(d);
  });
}

function showColorPanel() { document.getElementById('color-panel').classList.remove('hidden'); updateColorPreview(); }
function hideColorPanel() { document.getElementById('color-panel').classList.add('hidden'); addRecentColor(App.currentColor); }

// ============================
// ANIMATION - FRAMES
// ============================
function renderTimeline() {
  const track = document.getElementById('frames-track');
  if (!track) return;
  track.innerHTML = '';
  App.frames.forEach((frame, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'frame-thumb' + (i===App.frameIndex?' active':'');
    thumb.innerHTML = `<canvas width="56" height="56"></canvas><span class="frame-num">${i+1}</span>`;
    thumb.addEventListener('click', () => switchToFrame(i));
    thumb.addEventListener('contextmenu', e => { e.preventDefault(); showFrameMenu(e, i); });

    // Draw thumbnail
    const tcanvas = thumb.querySelector('canvas');
    const layer = frame.layers && frame.layers[0];
    if (layer && layer.dataURL) {
      const img = new Image();
      img.onload = () => { const tctx = tcanvas.getContext('2d'); tctx.drawImage(img,0,0,56,56); };
      img.src = layer.dataURL;
    } else {
      const tctx = tcanvas.getContext('2d');
      tctx.fillStyle = App.currentProject && App.currentProject.bg==='black' ? '#000' : '#fff';
      tctx.fillRect(0,0,56,56);
    }
    track.appendChild(thumb);
  });
}

function switchToFrame(i) {
  // Save current frame
  saveCurrentLayerToFrame();
  App.frameIndex = i;
  loadCurrentFrameToCanvas();
  renderTimeline();
  renderLayersPanel();
}

function addFrame() {
  const newFrame = {
    id: Date.now(),
    duration: 1/App.fps,
    layers: [{ id:Date.now(), name:'طبقة 1', visible:true, locked:false, opacity:100, blendMode:'normal', dataURL:null }]
  };
  App.frames.splice(App.frameIndex+1, 0, newFrame);
  switchToFrame(App.frameIndex+1);
  showToast('تمت إضافة فريم');
}

function duplicateFrame() {
  saveCurrentLayerToFrame();
  const copy = JSON.parse(JSON.stringify(App.frames[App.frameIndex]));
  copy.id = Date.now();
  copy.layers.forEach(l => l.id = Date.now()+Math.random());
  App.frames.splice(App.frameIndex+1, 0, copy);
  switchToFrame(App.frameIndex+1);
  showToast('تم نسخ الفريم');
}

function deleteFrame() {
  if (App.frames.length <= 1) { showToast('لا يمكن حذف الفريم الوحيد'); return; }
  App.frames.splice(App.frameIndex, 1);
  App.frameIndex = Math.max(0, App.frameIndex-1);
  loadCurrentFrameToCanvas();
  renderTimeline();
  showToast('تم حذف الفريم');
}

function showFrameMenu(e, i) {
  removeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'context-menu'; menu.id='ctx-menu';
  menu.style.cssText = `top:${e.clientY}px;right:${window.innerWidth-e.clientX}px`;
  menu.innerHTML = `
    <div class="ctx-item" onclick="removeContextMenu();switchToFrame(${i})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>تحديد
    </div>
    <div class="ctx-item" onclick="removeContextMenu();App.frameIndex=${i};duplicateFrame()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>نسخ
    </div>
    <div class="ctx-item" onclick="removeContextMenu();showFrameSettings(${i})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33"/></svg>إعدادات
    </div>
    <div class="ctx-item danger" onclick="removeContextMenu();App.frameIndex=${i};deleteFrame()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>حذف
    </div>
  `;
  document.body.appendChild(menu);
  setTimeout(()=>document.addEventListener('click',removeContextMenu,{once:true}),10);
}

function showFrameSettings(i) {
  document.getElementById('frame-duration').value = App.frames[i].duration || (1/App.fps);
  App._editingFrameIndex = i;
  openDialog('dialog-frame-settings');
}

function applyFrameSettings() {
  const i = App._editingFrameIndex;
  if (i !== undefined) {
    App.frames[i].duration = parseFloat(document.getElementById('frame-duration').value);
  }
  closeDialog('dialog-frame-settings');
}

// ============================
// PLAYBACK
// ============================
function togglePlayback() {
  if (App.isPlaying) stopPlayback(); else startPlayback();
}

function startPlayback() {
  App.isPlaying = true;
  document.getElementById('play-icon').innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';
  App.playInterval = setInterval(() => {
    App.frameIndex = (App.frameIndex+1) % App.frames.length;
    loadCurrentFrameToCanvas();
    renderTimeline();
  }, 1000/App.fps);
}

function stopPlayback() {
  App.isPlaying = false;
  document.getElementById('play-icon').innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
  clearInterval(App.playInterval);
}

function toggleOnionSkin(val) { App.onionSkin = val; }

// ============================
// EXPORT
// ============================
function showExportDialog() { openDialog('dialog-export'); }

function selectExportFmt(btn) {
  document.querySelectorAll('.exp-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  App.exportFormat = btn.dataset.fmt;
  const qualityGroup = document.getElementById('quality-group');
  qualityGroup.style.display = ['jpeg','webp'].includes(App.exportFormat) ? 'block' : 'none';
}

function doExport() {
  const canvas = document.getElementById('main-canvas');
  const scale = parseFloat(document.getElementById('export-scale').value);
  const quality = parseFloat(document.getElementById('export-quality').value)/100;
  const fmt = App.exportFormat;

  if (fmt === 'png') {
    exportCanvas(canvas, 'image/png', 1, scale, 'رسم');
  } else if (fmt === 'jpeg') {
    exportCanvas(canvas, 'image/jpeg', quality, scale, 'رسم');
  } else if (fmt === 'webp') {
    exportCanvas(canvas, 'image/webp', quality, scale, 'رسم');
  } else if (fmt === 'gif') {
    exportAsGif();
  } else if (fmt === 'mp4') {
    showToast('تصدير MP4 يحتاج متصفح يدعم MediaRecorder');
  }
  closeDialog('dialog-export');
}

function exportCanvas(canvas, mimeType, quality, scale, name) {
  const out = document.createElement('canvas');
  out.width = canvas.width * scale;
  out.height = canvas.height * scale;
  out.getContext('2d').drawImage(canvas, 0,0, out.width, out.height);
  const url = out.toDataURL(mimeType, quality);
  const a = document.createElement('a');
  a.href = url;
  const ext = mimeType.split('/')[1];
  a.download = (App.currentProject ? App.currentProject.name : name) + '.' + ext;
  a.click();
  showToast('تم التنزيل!');
}

function exportAsGif() {
  showToast('يتم تصدير GIF...');
  // Simple implementation: export all frames as PNG sequence
  App.frames.forEach((frame, i) => {
    const layer = frame.layers && frame.layers[0];
    if (!layer || !layer.dataURL) return;
    const a = document.createElement('a');
    a.href = layer.dataURL;
    a.download = `فريم_${i+1}.png`;
    // a.click(); // uncomment to download all frames
  });
  // Export current canvas as PNG with note
  exportCanvas(document.getElementById('main-canvas'), 'image/png', 1, 1, 'رسوم');
  showToast('تم تنزيل الفريم الحالي. لتصدير GIF كامل استخدم أداة خارجية');
}

// ============================
// DIALOGS
// ============================
function openDialog(id) {
  const d = document.getElementById(id);
  if (d) { d.classList.remove('hidden'); }
}
function closeDialog(id) {
  const d = document.getElementById(id);
  if (d) d.classList.add('hidden');
}

// ============================
// SETTINGS
// ============================
function toggleDarkMode(isDark) {
  document.body.classList.toggle('light', !isDark);
}
function applyDarkMode(isDark) {
  document.body.classList.toggle('light', !isDark);
}

// ============================
// UTILS
// ============================
function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r:parseInt(r[1],16), g:parseInt(r[2],16), b:parseInt(r[3],16) } : null;
}

function showToast(msg, dur=2000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(App._toastTimer);
  App._toastTimer = setTimeout(() => t.classList.add('hidden'), dur);
}

// Prevent native scroll/zoom on canvas
document.addEventListener('gesturestart', e => e.preventDefault(), {passive:false});
document.addEventListener('gesturechange', e => e.preventDefault(), {passive:false});
