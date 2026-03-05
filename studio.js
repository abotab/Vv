/* ═══════════════════════════════════════════════════
   AnimForge — studio.js
   Full Animation Studio Engine
   ═══════════════════════════════════════════════════ */

'use strict';

// ═══════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════
const State = {
  // Project
  projectId: null,
  projectName: 'مشروع جديد',

  // Canvas
  canvasW: 1280, canvasH: 720,
  zoom: 1.0, panX: 0, panY: 0,
  showGrid: false,
  showBones: true,
  showOnion: false,
  showSymmetry: false,

  // Tool
  activeTool: 'select',
  fgColor: '#00d4ff',
  bgColor: '#000000',
  strokeColor: '#ffffff',
  brushSize: 4,
  eraserSize: 20,
  strokeWidth: 2,
  opacity: 1.0,
  blendMode: 'normal',

  // Layers
  layers: [],
  activeLayerIndex: 0,

  // Bones
  bones: [],
  selectedBoneId: null,
  boneMode: 'pose', // 'pose' | 'edit'

  // Animation
  fps: 24,
  currentFrame: 0,
  totalFrames: 48,
  isPlaying: false,
  isLooping: true,
  keyframes: {},   // { layerId_frame: { x, y, rotation, ... } }
  boneKeyframes: {},

  // Drawing
  isDrawing: false,
  drawPath: [],
  currentObject: null,
  selectedObjects: [],
  clipboard: null,

  // History
  history: [],
  historyIndex: -1,

  // UI
  colorPickerTarget: 'fill',
};

// ═══════════════════════════════════════════════════
// CANVAS SETUP
// ═══════════════════════════════════════════════════
let canvas, ctx, overlayCanvas, overlayCtx;
let animFrameId = null;
let lastTimestamp = 0;

// ═══════════════════════════════════════════════════
// BONES DATA STRUCTURES
// ═══════════════════════════════════════════════════
const BONE_COLOR    = '#8b5cf6';
const BONE_SEL_CLR  = '#ff6b35';
const BONE_JOINT_R  = 6;

class Bone {
  constructor(id, name, x, y, length, angle, parentId = null) {
    this.id       = id;
    this.name     = name;
    this.x        = x;     // head position
    this.y        = y;
    this.length   = length;
    this.angle    = angle; // radians
    this.parentId = parentId;
    this.children = [];
    this.ikEnabled  = false;
    this.minAngle   = -Math.PI;
    this.maxAngle   = Math.PI;
  }

  get tip() {
    return {
      x: this.x + Math.cos(this.angle) * this.length,
      y: this.y + Math.sin(this.angle) * this.length,
    };
  }
}

// ═══════════════════════════════════════════════════
// LAYER DATA STRUCTURE
// ═══════════════════════════════════════════════════
class Layer {
  constructor(id, name, type = 'draw') {
    this.id        = id;
    this.name      = name;
    this.type      = type; // 'draw' | 'bone' | 'image'
    this.visible   = true;
    this.locked    = false;
    this.opacity   = 1.0;
    this.blendMode = 'normal';
    this.objects   = [];   // drawn objects
    this.offCanvas = document.createElement('canvas');
    this.offCanvas.width  = State.canvasW;
    this.offCanvas.height = State.canvasH;
    this.offCtx    = this.offCanvas.getContext('2d');
  }
}

// ═══════════════════════════════════════════════════
// PREBUILT ANIMATIONS
// ═══════════════════════════════════════════════════
const PREBUILT_ANIMS = {
  walk: {
    name: 'مشي', frames: 8, fps: 12,
    keyframes: [
      { frame: 0,  bones: { root: { angle: 0 }, rleg: { angle: 0.3 }, lleg: { angle: -0.3 }, rarm: { angle: -0.3 }, larm: { angle: 0.3 } } },
      { frame: 4,  bones: { root: { angle: 0 }, rleg: { angle: -0.3 }, lleg: { angle: 0.3 }, rarm: { angle: 0.3 }, larm: { angle: -0.3 } } },
    ]
  },
  run: {
    name: 'ركض', frames: 6, fps: 24,
    keyframes: [
      { frame: 0,  bones: { root: { angle: 0.1 }, rleg: { angle: 0.6 }, lleg: { angle: -0.6 }, rarm: { angle: -0.6 }, larm: { angle: 0.6 } } },
      { frame: 3,  bones: { root: { angle: 0.1 }, rleg: { angle: -0.6 }, lleg: { angle: 0.6 }, rarm: { angle: 0.6 }, larm: { angle: -0.6 } } },
    ]
  },
  jump: {
    name: 'قفز', frames: 12, fps: 24,
    keyframes: [
      { frame: 0,  bones: { root: { y: 0 }, rleg: { angle: 0 }, lleg: { angle: 0 } } },
      { frame: 4,  bones: { root: { y: -80 }, rleg: { angle: 0.5 }, lleg: { angle: 0.5 } } },
      { frame: 8,  bones: { root: { y: -100 }, rleg: { angle: -0.3 }, lleg: { angle: -0.3 } } },
      { frame: 11, bones: { root: { y: 0 }, rleg: { angle: 0 }, lleg: { angle: 0 } } },
    ]
  },
  idle: {
    name: 'خمول', frames: 16, fps: 12,
    keyframes: [
      { frame: 0,  bones: { root: { y: 0 }, chest: { angle: 0 } } },
      { frame: 8,  bones: { root: { y: -5 }, chest: { angle: 0.05 } } },
      { frame: 15, bones: { root: { y: 0 }, chest: { angle: 0 } } },
    ]
  },
  attack: {
    name: 'هجوم', frames: 8, fps: 24,
    keyframes: [
      { frame: 0,  bones: { rarm: { angle: -0.5 } } },
      { frame: 3,  bones: { rarm: { angle: 1.8 } } },
      { frame: 7,  bones: { rarm: { angle: -0.5 } } },
    ]
  },
  hit: {
    name: 'ضربة', frames: 4, fps: 24,
    keyframes: [
      { frame: 0, bones: { root: { x: 0 } } },
      { frame: 1, bones: { root: { x: 15 } } },
      { frame: 3, bones: { root: { x: 0 } } },
    ]
  },
  sit: {
    name: 'جلوس', frames: 10, fps: 12,
    keyframes: [
      { frame: 0,  bones: { root: { y: 0 }, rleg: { angle: 0 }, lleg: { angle: 0 } } },
      { frame: 9,  bones: { root: { y: 60 }, rleg: { angle: 1.4 }, lleg: { angle: 1.4 } } },
    ]
  },
};

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  startStudioLoading();
});

function startStudioLoading() {
  const prog = document.getElementById('studioLoadProg');
  const txt  = document.getElementById('studioLoadText');
  const steps = [
    [15, 'تهيئة Canvas...'],
    [35, 'بناء نظام الطبقات...'],
    [55, 'تحميل نظام العظام...'],
    [75, 'إعداد Timeline...'],
    [90, 'تحميل المشروع...'],
    [100,'جاهز للرسم!'],
  ];
  let i = 0;
  const tick = () => {
    if (i >= steps.length) {
      setTimeout(() => {
        const ls = document.getElementById('studioLoading');
        if (ls) { ls.style.opacity = '0'; setTimeout(() => ls.remove(), 400); }
        const sl = document.getElementById('studioLayout');
        if (sl) { sl.style.opacity = '1'; sl.style.transition = 'opacity 0.4s'; }
        initStudio();
      }, 300);
      return;
    }
    if (prog) prog.style.width = steps[i][0] + '%';
    if (txt)  txt.textContent  = steps[i][1];
    i++;
    setTimeout(tick, 250 + Math.random() * 150);
  };
  setTimeout(tick, 100);
}

function initStudio() {
  canvas        = document.getElementById('mainCanvas');
  ctx           = canvas.getContext('2d');
  overlayCanvas = document.getElementById('overlayCanvas');
  overlayCtx    = overlayCanvas.getContext('2d');

  initDefaultProject();
  bindEvents();
  bindKeyboard();
  renderLayersPanel();
  renderBonesPanel();
  renderTimeline();
  renderPrebuiltAnims();
  applyThemeFromStorage();
  checkURLParams();
  renderAll();
  showToast('مرحباً في AnimForge Studio! 🔥', 'info');
}

function initDefaultProject() {
  State.projectId = Date.now().toString();

  // Default skeleton
  const root  = new Bone('root',   'Root (الجذع)', 640, 500, 80, -Math.PI/2);
  const head  = new Bone('head',   'رأس',           0,   0,  40, -Math.PI/2, 'root');
  const rarm  = new Bone('rarm',   'ذراع يمين',     0,   0,  60,  0,         'root');
  const larm  = new Bone('larm',   'ذراع يسار',     0,   0,  60,  Math.PI,   'root');
  const rleg  = new Bone('rleg',   'رجل يمين',      0,   0,  70,  Math.PI/4, 'root');
  const lleg  = new Bone('lleg',   'رجل يسار',      0,   0,  70, Math.PI-Math.PI/4, 'root');
  const rhand = new Bone('rhand',  'يد يمين',       0,   0,  30, 0, 'rarm');
  const lhand = new Bone('lhand',  'يد يسار',       0,   0,  30, Math.PI, 'larm');
  const rfoot = new Bone('rfoot',  'قدم يمين',      0,   0,  25, Math.PI/2, 'rleg');
  const lfoot = new Bone('lfoot',  'قدم يسار',      0,   0,  25, Math.PI/2, 'lleg');

  State.bones = [root, head, rarm, larm, rleg, lleg, rhand, lhand, rfoot, lfoot];

  // Update child positions
  updateBonePositions();

  // Default layers
  State.layers = [
    new Layer('bg_layer',   'خلفية',    'draw'),
    new Layer('body_layer', 'الجسم',    'draw'),
    new Layer('bone_layer', 'العظام',   'bone'),
  ];
  State.activeLayerIndex = 1;
}

function updateBonePositions() {
  // Build parent map
  const bmap = {};
  State.bones.forEach(b => bmap[b.id] = b);

  const visited = new Set();
  function updateBone(bone) {
    if (visited.has(bone.id)) return;
    visited.add(bone.id);
    if (bone.parentId && bmap[bone.parentId]) {
      const p = bmap[bone.parentId];
      updateBone(p);
      bone.x = p.tip.x;
      bone.y = p.tip.y;
    }
  }
  State.bones.forEach(b => updateBone(b));
}

// ═══════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════
function renderAll() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(renderLoop);
}

function renderLoop(ts) {
  if (State.isPlaying) {
    const elapsed = ts - lastTimestamp;
    const frameDur = 1000 / State.fps;
    if (elapsed >= frameDur) {
      lastTimestamp = ts;
      State.currentFrame++;
      if (State.currentFrame >= State.totalFrames) {
        if (State.isLooping) State.currentFrame = 0;
        else { State.isPlaying = false; State.currentFrame = State.totalFrames - 1; updatePlayBtn(); }
      }
      updateFrameDisplay();
      updatePlayheadPosition();
      applyKeyframeAtCurrentFrame();
    }
  }

  drawCanvas();
  drawOverlay();
  animFrameId = requestAnimationFrame(renderLoop);
}

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  if (State.showGrid) drawGrid();

  // Draw layers bottom to top
  State.layers.forEach(layer => {
    if (!layer.visible || layer.type === 'bone') return;
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;
    ctx.drawImage(layer.offCanvas, 0, 0);
    ctx.restore();
  });

  // Draw all shape objects
  State.layers.forEach(layer => {
    if (!layer.visible || layer.type !== 'draw') return;
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;
    layer.objects.forEach(obj => drawObject(ctx, obj));
    ctx.restore();
  });

  // Draw bones overlay
  if (State.showBones) drawBones();

  // Symmetry guide
  if (State.showSymmetry) drawSymmetryGuide();

  // Onion skin
  if (State.showOnion) drawOnionSkin();

  // Current drawing path
  if (State.isDrawing && State.drawPath.length > 1) {
    ctx.save();
    ctx.strokeStyle = State.fgColor;
    ctx.lineWidth = State.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = State.opacity;
    ctx.beginPath();
    State.drawPath.forEach((pt, i) => {
      i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.restore();
  }

  // Draw active path preview
  if (State.currentObject && State.activeTool === 'bezier' && State.bezierPoints) {
    drawBezierPreview();
  }
}

function drawGrid() {
  const gridSize = 40;
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  // Center cross
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.moveTo(canvas.width/2, 0); ctx.lineTo(canvas.width/2, canvas.height); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, canvas.height/2); ctx.lineTo(canvas.width, canvas.height/2); ctx.stroke();
  ctx.restore();
}

function drawSymmetryGuide() {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,212,255,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(canvas.width/2, 0);
  ctx.lineTo(canvas.width/2, canvas.height);
  ctx.stroke();
  ctx.restore();
}

function drawOnionSkin() {
  const prevFrame = State.currentFrame - 1;
  const nextFrame = State.currentFrame + 1;
  if (prevFrame >= 0) drawGhostFrame(prevFrame, 'rgba(0,212,255,0.25)');
  if (nextFrame < State.totalFrames) drawGhostFrame(nextFrame, 'rgba(255,107,53,0.25)');
}

function drawGhostFrame(frame, color) {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = color;
  // Simplified: just show a tinted version
  ctx.restore();
}

function drawBones() {
  const bmap = {};
  State.bones.forEach(b => bmap[b.id] = b);
  updateBonePositions();

  ctx.save();
  State.bones.forEach(bone => {
    const isSelected = bone.id === State.selectedBoneId;
    const color = isSelected ? BONE_SEL_CLR : BONE_COLOR;

    // Draw bone body
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.globalAlpha = 0.85;

    const tx = bone.tip.x, ty = bone.tip.y;

    // Bone shape (diamond)
    ctx.beginPath();
    ctx.moveTo(bone.x, bone.y);
    // Offset for nicer bone shape
    const perp = bone.angle + Math.PI/2;
    const w = bone.length * 0.15;
    ctx.lineTo(
      bone.x + Math.cos(bone.angle) * bone.length * 0.2 + Math.cos(perp) * w,
      bone.y + Math.sin(bone.angle) * bone.length * 0.2 + Math.sin(perp) * w
    );
    ctx.lineTo(tx, ty);
    ctx.lineTo(
      bone.x + Math.cos(bone.angle) * bone.length * 0.2 - Math.cos(perp) * w,
      bone.y + Math.sin(bone.angle) * bone.length * 0.2 - Math.sin(perp) * w
    );
    ctx.closePath();
    ctx.fillStyle = isSelected ? BONE_SEL_CLR + '44' : BONE_COLOR + '44';
    ctx.fill();
    ctx.stroke();

    // Head joint
    ctx.beginPath();
    ctx.arc(bone.x, bone.y, BONE_JOINT_R, 0, Math.PI*2);
    ctx.fillStyle = isSelected ? BONE_SEL_CLR : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Tip joint
    ctx.beginPath();
    ctx.arc(tx, ty, BONE_JOINT_R - 2, 0, Math.PI*2);
    ctx.fillStyle = color;
    ctx.fill();

    // IK indicator
    if (bone.ikEnabled) {
      ctx.font = '10px monospace';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('IK', bone.x - 8, bone.y - 10);
    }
  });
  ctx.restore();
}

function drawOverlay() {
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Selection handles
  State.selectedObjects.forEach(obj => {
    drawSelectionHandles(overlayCtx, obj);
  });
}

function drawSelectionHandles(c, obj) {
  if (!obj) return;
  const padding = 6;
  const x = (obj.x || 0) - padding;
  const y = (obj.y || 0) - padding;
  const w = (obj.w || 50) + padding*2;
  const h = (obj.h || 50) + padding*2;

  c.save();
  c.strokeStyle = '#00d4ff';
  c.lineWidth = 1.5;
  c.setLineDash([4, 2]);
  c.strokeRect(x, y, w, h);
  c.setLineDash([]);

  const handles = [
    [x, y], [x+w/2, y], [x+w, y],
    [x+w, y+h/2],
    [x+w, y+h], [x+w/2, y+h], [x, y+h],
    [x, y+h/2],
  ];
  handles.forEach(([hx, hy]) => {
    c.fillStyle = '#ffffff';
    c.strokeStyle = '#00d4ff';
    c.lineWidth = 1.5;
    c.beginPath();
    c.rect(hx-4, hy-4, 8, 8);
    c.fill();
    c.stroke();
  });
  c.restore();
}

function drawObject(c, obj) {
  if (!obj || obj.hidden) return;
  c.save();
  c.globalAlpha   = obj.opacity || 1;
  c.fillStyle     = obj.fill || 'transparent';
  c.strokeStyle   = obj.stroke || 'transparent';
  c.lineWidth     = obj.strokeWidth || 1;
  c.globalCompositeOperation = obj.blendMode || 'normal';

  if (obj.type === 'path' && obj.points && obj.points.length > 1) {
    c.beginPath();
    obj.points.forEach((pt, i) => {
      i === 0 ? c.moveTo(pt.x, pt.y) : c.lineTo(pt.x, pt.y);
    });
    if (obj.closed) c.closePath();
    if (obj.fill !== 'transparent') c.fill();
    c.stroke();
  } else if (obj.type === 'rect') {
    if (obj.fill !== 'transparent') c.fillRect(obj.x, obj.y, obj.w, obj.h);
    c.strokeRect(obj.x, obj.y, obj.w, obj.h);
  } else if (obj.type === 'circle') {
    c.beginPath();
    c.arc(obj.x, obj.y, obj.r, 0, Math.PI*2);
    if (obj.fill !== 'transparent') c.fill();
    c.stroke();
  } else if (obj.type === 'line') {
    c.beginPath();
    c.moveTo(obj.x1, obj.y1);
    c.lineTo(obj.x2, obj.y2);
    c.stroke();
  }
  c.restore();
}

function drawBezierPreview() {
  const pts = State.bezierPoints;
  if (!pts || pts.length < 1) return;
  ctx.save();
  ctx.strokeStyle = State.fgColor;
  ctx.lineWidth = State.strokeWidth;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach((pt, i) => {
    if (i > 0) ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // Draw control points
  pts.forEach(pt => {
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.restore();
}

// ═══════════════════════════════════════════════════
// CANVAS EVENTS
// ═══════════════════════════════════════════════════
function bindEvents() {
  const container = document.getElementById('canvasContainer');

  container.addEventListener('mousedown', onMouseDown);
  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('mouseup',   onMouseUp);
  container.addEventListener('dblclick',  onDblClick);
  container.addEventListener('contextmenu', onRightClick);
  container.addEventListener('wheel', onWheel, { passive: false });

  // Touch support
  container.addEventListener('touchstart',  onTouchStart,  { passive: false });
  container.addEventListener('touchmove',   onTouchMove,   { passive: false });
  container.addEventListener('touchend',    onTouchEnd);

  // UI Events
  document.getElementById('btnPlay').addEventListener('click', togglePlay);
  document.getElementById('btnToStart').addEventListener('click', () => setFrame(0));
  document.getElementById('btnToEnd').addEventListener('click', () => setFrame(State.totalFrames - 1));
  document.getElementById('btnPrevFrame').addEventListener('click', () => setFrame(State.currentFrame - 1));
  document.getElementById('btnNextFrame').addEventListener('click', () => setFrame(State.currentFrame + 1));
  document.getElementById('btnLoop').addEventListener('click', () => {
    State.isLooping = !State.isLooping;
    document.getElementById('btnLoop').style.color = State.isLooping ? 'var(--accent)' : '';
  });
  document.getElementById('fpsSelect').addEventListener('change', e => { State.fps = parseInt(e.target.value); });
  document.getElementById('tlDuration').addEventListener('change', e => {
    State.totalFrames = Math.max(1, parseInt(e.target.value) || 48);
    renderTimeline();
  });
  document.getElementById('btnSave').addEventListener('click', saveProject);
  document.getElementById('btnExport').addEventListener('click', openExportModal);
  document.getElementById('addKeyframeBtn').addEventListener('click', addKeyframeAtCurrent);

  document.getElementById('zoomIn').addEventListener('click', () => setZoom(State.zoom * 1.25));
  document.getElementById('zoomOut').addEventListener('click', () => setZoom(State.zoom / 1.25));
  document.getElementById('zoomFit').addEventListener('click', zoomFit);

  document.getElementById('toggleGrid').addEventListener('click', () => toggleOverlay('grid'));
  document.getElementById('toggleBones').addEventListener('click', () => toggleOverlay('bones'));
  document.getElementById('toggleOnion').addEventListener('click', () => toggleOverlay('onion'));
  document.getElementById('toggleSymmetry').addEventListener('click', () => toggleOverlay('symmetry'));

  document.getElementById('btnTheme').addEventListener('click', toggleTheme);
  document.getElementById('projectName').addEventListener('change', e => { State.projectName = e.target.value; });

  document.getElementById('canvasSizeSelect').addEventListener('change', e => {
    const [w, h] = e.target.value.split('x').map(Number);
    resizeCanvas(w, h);
  });

  // Properties panel sync
  ['propX', 'propY', 'propW', 'propH'].forEach(id => {
    document.getElementById(id).addEventListener('change', applyPropsToSelection);
  });

  const rotSlider = document.getElementById('propRotation');
  const rotVal    = document.getElementById('propRotVal');
  rotSlider.addEventListener('input', () => { rotVal.value = rotSlider.value; applyPropsToSelection(); });
  rotVal.addEventListener('change', () => { rotSlider.value = rotVal.value; applyPropsToSelection(); });

  const opSlider = document.getElementById('propOpacity');
  const opVal    = document.getElementById('propOpVal');
  opSlider.addEventListener('input', () => { opVal.value = opSlider.value; State.opacity = opSlider.value / 100; });
  opVal.addEventListener('change', () => { opSlider.value = opVal.value; State.opacity = opVal.value / 100; });

  const strokeSlider = document.getElementById('propStrokeW');
  const strokeVal    = document.getElementById('propStrokeVal');
  strokeSlider.addEventListener('input', () => { strokeVal.value = strokeSlider.value; State.strokeWidth = parseInt(strokeSlider.value); });
  strokeVal.addEventListener('change', () => { strokeSlider.value = strokeVal.value; State.strokeWidth = parseInt(strokeVal.value); });

  document.getElementById('propColorHex').addEventListener('change', e => {
    State.fgColor = e.target.value;
    document.getElementById('propColorPrev').style.background = e.target.value;
    document.getElementById('fgColorSwatch').style.background = e.target.value;
  });

  document.getElementById('strokeColorHex').addEventListener('change', e => {
    State.strokeColor = e.target.value;
    document.getElementById('strokeColorPrev').style.background = e.target.value;
  });

  // Tool buttons
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectTool(btn.dataset.tool);
    });
  });

  // Timeline ruler click
  const tlMain = document.getElementById('tlMain');
  if (tlMain) {
    tlMain.addEventListener('click', onTimelineClick);
    tlMain.addEventListener('mousemove', onTimelineHover);
  }

  // Close context menu on click
  document.addEventListener('click', e => {
    if (!e.target.closest('#contextMenu')) closeContextMenu();
  });

  // Close color picker on outside click
  document.addEventListener('click', e => {
    const popup = document.getElementById('colorPickerPopup');
    if (popup && popup.style.display !== 'none' &&
        !e.target.closest('#colorPickerPopup') &&
        !e.target.closest('.color-preview') &&
        !e.target.closest('#fgColorSwatch')) {
      closeColorPicker();
    }
  });

  // Header menu buttons (stub)
  ['menuFile', 'menuEdit', 'menuView', 'menuAnimate', 'menuExport'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => handleMenuClick(id));
  });
}

// ─── Mouse Coordinates ────────────────────────────
function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top)  * scaleY,
  };
}

// ─── Mouse Down ───────────────────────────────────
function onMouseDown(e) {
  if (e.button !== 0) return;
  const pos = getCanvasPos(e);

  switch (State.activeTool) {
    case 'select':    startSelect(pos); break;
    case 'move':      startMove(pos); break;
    case 'pen':
    case 'brush':     startDraw(pos); break;
    case 'eraser':    startErase(pos); break;
    case 'rect':      startRect(pos); break;
    case 'circle':    startCircle(pos); break;
    case 'line':      startLine(pos); break;
    case 'fill':      doFill(pos); break;
    case 'bezier':    addBezierPoint(pos); break;
    case 'bone':      startBoneDraw(pos); break;
    case 'pan':       startPan(pos); break;
    case 'zoom':      handleZoomClick(pos, e); break;
  }

  State.mouseDown = true;
  State.lastMousePos = pos;
}

// ─── Mouse Move ───────────────────────────────────
function onMouseMove(e) {
  const pos = getCanvasPos(e);
  const coords = document.getElementById('canvasCoords');
  if (coords) coords.textContent = `X: ${Math.round(pos.x)}  Y: ${Math.round(pos.y)}`;

  if (!State.mouseDown) return;

  switch (State.activeTool) {
    case 'pen':
    case 'brush':     continueDraw(pos); break;
    case 'eraser':    continueErase(pos); break;
    case 'rect':      updateRect(pos); break;
    case 'circle':    updateCircle(pos); break;
    case 'line':      updateLine(pos); break;
    case 'move':
    case 'select':    continueMoveOrSelect(pos); break;
    case 'bone':      updateBoneDraw(pos); break;
    case 'pan':       continuePan(pos); break;
  }

  State.lastMousePos = pos;
}

// ─── Mouse Up ─────────────────────────────────────
function onMouseUp(e) {
  const pos = getCanvasPos(e);

  switch (State.activeTool) {
    case 'pen':
    case 'brush':     endDraw(pos); break;
    case 'eraser':    endErase(); break;
    case 'rect':      endRect(pos); break;
    case 'circle':    endCircle(pos); break;
    case 'line':      endLine(pos); break;
    case 'select':
    case 'move':      endMoveOrSelect(pos); break;
    case 'bone':      endBoneDraw(pos); break;
    case 'pan':       endPan(); break;
  }

  State.mouseDown = false;
}

function onDblClick(e) {
  if (State.activeTool === 'bezier') finalizeBezier();
}

function onRightClick(e) {
  e.preventDefault();
  showContextMenu(e.clientX, e.clientY);
}

function onWheel(e) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  setZoom(State.zoom * delta);
}

// ─── Touch Events ─────────────────────────────────
function onTouchStart(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    onMouseDown({ button: 0, clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
  }
}

function onTouchMove(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
  }
}

function onTouchEnd(e) {
  onMouseUp({ clientX: 0, clientY: 0 });
}

// ═══════════════════════════════════════════════════
// DRAWING TOOLS
// ═══════════════════════════════════════════════════
function getActiveLayerCtx() {
  const layer = State.layers[State.activeLayerIndex];
  return layer ? layer.offCtx : null;
}

function startDraw(pos) {
  State.isDrawing = true;
  State.drawPath = [pos];
  if (State.showSymmetry) {
    State.mirrorPath = [{ x: canvas.width - pos.x, y: pos.y }];
  }
}

function continueDraw(pos) {
  if (!State.isDrawing) return;
  State.drawPath.push(pos);
  if (State.showSymmetry) {
    State.mirrorPath = State.mirrorPath || [];
    State.mirrorPath.push({ x: canvas.width - pos.x, y: pos.y });
  }

  const lctx = getActiveLayerCtx();
  if (!lctx) return;

  const path = State.drawPath;
  if (path.length < 2) return;

  lctx.save();
  lctx.globalAlpha = State.opacity;
  lctx.globalCompositeOperation = State.blendMode;
  lctx.strokeStyle = State.fgColor;
  lctx.lineWidth   = State.brushSize;
  lctx.lineCap     = 'round';
  lctx.lineJoin    = 'round';
  lctx.beginPath();

  const len = path.length;
  lctx.moveTo(path[len-2].x, path[len-2].y);
  lctx.lineTo(path[len-1].x, path[len-1].y);
  lctx.stroke();

  // Mirror
  if (State.showSymmetry && State.mirrorPath && State.mirrorPath.length >= 2) {
    const m = State.mirrorPath;
    lctx.beginPath();
    lctx.moveTo(m[m.length-2].x, m[m.length-2].y);
    lctx.lineTo(m[m.length-1].x, m[m.length-1].y);
    lctx.stroke();
  }
  lctx.restore();
}

function endDraw(pos) {
  if (!State.isDrawing) return;
  State.isDrawing = false;

  // Save as object
  const layer = State.layers[State.activeLayerIndex];
  if (layer && State.drawPath.length > 1) {
    layer.objects.push({
      id: genId(),
      type: 'path',
      points: [...State.drawPath],
      fill: 'transparent',
      stroke: State.fgColor,
      strokeWidth: State.brushSize,
      opacity: State.opacity,
      blendMode: State.blendMode,
      closed: false,
    });
    pushHistory();
  }
  State.drawPath = [];
  State.mirrorPath = [];
}

// ─── Eraser ───────────────────────────────────────
function startErase(pos) {
  State.isDrawing = true;
  doErase(pos);
}

function continueErase(pos) {
  if (!State.isDrawing) return;
  doErase(pos);
}

function doErase(pos) {
  const lctx = getActiveLayerCtx();
  if (!lctx) return;
  lctx.save();
  lctx.globalCompositeOperation = 'destination-out';
  lctx.beginPath();
  lctx.arc(pos.x, pos.y, State.eraserSize/2, 0, Math.PI*2);
  lctx.fill();
  lctx.restore();
}

function endErase() { State.isDrawing = false; }

// ─── Rect ─────────────────────────────────────────
function startRect(pos) {
  State.isDrawing = true;
  State.shapeStart = pos;
  State.currentObject = { type: 'rect', x: pos.x, y: pos.y, w: 0, h: 0, fill: State.fgColor, stroke: State.strokeColor, strokeWidth: State.strokeWidth, opacity: State.opacity };
}

function updateRect(pos) {
  if (!State.isDrawing || !State.currentObject) return;
  const s = State.shapeStart;
  State.currentObject.x = Math.min(s.x, pos.x);
  State.currentObject.y = Math.min(s.y, pos.y);
  State.currentObject.w = Math.abs(pos.x - s.x);
  State.currentObject.h = Math.abs(pos.y - s.y);
}

function endRect(pos) {
  if (!State.isDrawing) return;
  State.isDrawing = false;
  if (State.currentObject && State.currentObject.w > 2 && State.currentObject.h > 2) {
    const layer = State.layers[State.activeLayerIndex];
    if (layer) {
      const obj = { id: genId(), ...State.currentObject };
      layer.objects.push(obj);
      drawObject(layer.offCtx, obj);
      pushHistory();
    }
  }
  State.currentObject = null;
}

// ─── Circle ───────────────────────────────────────
function startCircle(pos) {
  State.isDrawing = true;
  State.shapeStart = pos;
  State.currentObject = { type: 'circle', x: pos.x, y: pos.y, r: 0, fill: State.fgColor, stroke: State.strokeColor, strokeWidth: State.strokeWidth, opacity: State.opacity };
}

function updateCircle(pos) {
  if (!State.isDrawing || !State.currentObject) return;
  const dx = pos.x - State.shapeStart.x;
  const dy = pos.y - State.shapeStart.y;
  State.currentObject.r = Math.sqrt(dx*dx + dy*dy);
}

function endCircle(pos) {
  if (!State.isDrawing) return;
  State.isDrawing = false;
  if (State.currentObject && State.currentObject.r > 2) {
    const layer = State.layers[State.activeLayerIndex];
    if (layer) {
      const obj = { id: genId(), ...State.currentObject };
      layer.objects.push(obj);
      drawObject(layer.offCtx, obj);
      pushHistory();
    }
  }
  State.currentObject = null;
}

// ─── Line ─────────────────────────────────────────
function startLine(pos) {
  State.isDrawing = true;
  State.shapeStart = pos;
  State.currentObject = { type: 'line', x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, stroke: State.fgColor, strokeWidth: State.strokeWidth, opacity: State.opacity };
}

function updateLine(pos) {
  if (!State.isDrawing || !State.currentObject) return;
  State.currentObject.x2 = pos.x;
  State.currentObject.y2 = pos.y;
}

function endLine(pos) {
  if (!State.isDrawing) return;
  State.isDrawing = false;
  if (State.currentObject) {
    const layer = State.layers[State.activeLayerIndex];
    if (layer) {
      const obj = { id: genId(), ...State.currentObject };
      layer.objects.push(obj);
      drawObject(layer.offCtx, obj);
      pushHistory();
    }
  }
  State.currentObject = null;
}

// ─── Bezier ───────────────────────────────────────
function addBezierPoint(pos) {
  if (!State.bezierPoints) State.bezierPoints = [];
  State.bezierPoints.push(pos);
}

function finalizeBezier() {
  if (!State.bezierPoints || State.bezierPoints.length < 2) {
    State.bezierPoints = [];
    return;
  }
  const layer = State.layers[State.activeLayerIndex];
  if (layer) {
    const obj = {
      id: genId(), type: 'path',
      points: [...State.bezierPoints],
      fill: 'transparent',
      stroke: State.fgColor,
      strokeWidth: State.strokeWidth,
      opacity: State.opacity,
    };
    layer.objects.push(obj);
    drawObject(layer.offCtx, obj);
    pushHistory();
  }
  State.bezierPoints = [];
}

// ─── Fill ─────────────────────────────────────────
function doFill(pos) {
  const lctx = getActiveLayerCtx();
  if (!lctx) return;
  lctx.save();
  lctx.globalCompositeOperation = State.blendMode;
  lctx.fillStyle = State.fgColor;
  lctx.fillRect(0, 0, canvas.width, canvas.height);
  lctx.restore();
  showToast('تم تطبيق التعبئة', 'success');
}

// ─── Select ───────────────────────────────────────
function startSelect(pos) {
  // Hit test objects
  const layer = State.layers[State.activeLayerIndex];
  if (!layer) return;
  const hit = hitTestObjects(layer.objects, pos);
  if (hit) {
    State.selectedObjects = [hit];
    updatePropsPanel(hit);
  } else {
    State.selectedObjects = [];
  }
}

function startMove(pos) { startSelect(pos); }

function continueMoveOrSelect(pos) {
  if (State.selectedObjects.length > 0 && State.mouseDown) {
    const dx = pos.x - State.lastMousePos.x;
    const dy = pos.y - State.lastMousePos.y;
    State.selectedObjects.forEach(obj => {
      if (obj.type === 'rect' || obj.type === 'circle') { obj.x += dx; obj.y += dy; }
      else if (obj.type === 'line') { obj.x1 += dx; obj.y1 += dy; obj.x2 += dx; obj.y2 += dy; }
      else if (obj.type === 'path') { obj.points = obj.points.map(p => ({ x: p.x+dx, y: p.y+dy })); }
    });
    redrawActiveLayer();
  }
}

function endMoveOrSelect(pos) {
  if (State.selectedObjects.length > 0) pushHistory();
}

function hitTestObjects(objects, pos) {
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (obj.type === 'rect') {
      if (pos.x >= obj.x && pos.x <= obj.x+obj.w && pos.y >= obj.y && pos.y <= obj.y+obj.h) return obj;
    } else if (obj.type === 'circle') {
      const dx = pos.x - obj.x, dy = pos.y - obj.y;
      if (Math.sqrt(dx*dx+dy*dy) <= obj.r) return obj;
    } else if (obj.type === 'path' && obj.points) {
      for (let j = 0; j < obj.points.length - 1; j++) {
        if (distToSegment(pos, obj.points[j], obj.points[j+1]) < 8) return obj;
      }
    }
  }
  return null;
}

function distToSegment(p, a, b) {
  const dx = b.x-a.x, dy = b.y-a.y;
  const len2 = dx*dx+dy*dy;
  if (len2 === 0) return Math.sqrt((p.x-a.x)**2+(p.y-a.y)**2);
  let t = ((p.x-a.x)*dx+(p.y-a.y)*dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt((p.x-(a.x+t*dx))**2+(p.y-(a.y+t*dy))**2);
}

function redrawActiveLayer() {
  const layer = State.layers[State.activeLayerIndex];
  if (!layer) return;
  layer.offCtx.clearRect(0, 0, canvas.width, canvas.height);
  layer.objects.forEach(obj => drawObject(layer.offCtx, obj));
}

// ─── Bone Drawing ─────────────────────────────────
function startBoneDraw(pos) {
  State.isDrawing = true;
  State.boneDrawStart = pos;
}

function updateBoneDraw(pos) {
  // Preview drawn in renderAll
  State.boneDrawEnd = pos;
}

function endBoneDraw(pos) {
  if (!State.isDrawing) return;
  State.isDrawing = false;
  const start = State.boneDrawStart;
  if (!start) return;
  const dx = pos.x - start.x, dy = pos.y - start.y;
  const len = Math.sqrt(dx*dx+dy*dy);
  if (len < 10) return;
  const angle = Math.atan2(dy, dx);
  const id = 'bone_' + genId();
  const bone = new Bone(id, 'عظمة جديدة', start.x, start.y, len, angle, null);
  State.bones.push(bone);
  renderBonesPanel();
  showToast('تم إضافة عظمة جديدة', 'success');
  pushHistory();
}

// ─── Bone Selection (click near joint) ────────────
function hitTestBone(pos) {
  for (const bone of State.bones) {
    const dx = pos.x - bone.x, dy = pos.y - bone.y;
    if (Math.sqrt(dx*dx+dy*dy) < BONE_JOINT_R + 4) return bone.id;
    const tip = bone.tip;
    const tdx = pos.x - tip.x, tdy = pos.y - tip.y;
    if (Math.sqrt(tdx*tdx+tdy*tdy) < BONE_JOINT_R + 4) return bone.id;
  }
  return null;
}

// ─── Pan ──────────────────────────────────────────
function startPan(pos) { State.panStart = pos; State.panOrigin = { x: State.panX, y: State.panY }; }
function continuePan(pos) {
  if (!State.panStart) return;
  State.panX = State.panOrigin.x + (pos.x - State.panStart.x);
  State.panY = State.panOrigin.y + (pos.y - State.panStart.y);
  updateCanvasTransform();
}
function endPan() { State.panStart = null; }

function handleZoomClick(pos, e) {
  if (e.shiftKey || e.button === 2) setZoom(State.zoom / 1.25);
  else setZoom(State.zoom * 1.25);
}

// ═══════════════════════════════════════════════════
// ZOOM
// ═══════════════════════════════════════════════════
function setZoom(z) {
  State.zoom = Math.max(0.1, Math.min(8, z));
  updateCanvasTransform();
  document.getElementById('zoomLevel').textContent = Math.round(State.zoom*100) + '%';
}

function updateCanvasTransform() {
  const style = `translate(-50%, -50%) scale(${State.zoom})`;
  canvas.style.transform        = style;
  overlayCanvas.style.transform = style;
}

function zoomFit() {
  const container = document.getElementById('canvasContainer');
  const scaleX = container.clientWidth  / canvas.width;
  const scaleY = container.clientHeight / canvas.height;
  setZoom(Math.min(scaleX, scaleY) * 0.9);
}

// ═══════════════════════════════════════════════════
// PLAYBACK
// ═══════════════════════════════════════════════════
function togglePlay() {
  State.isPlaying = !State.isPlaying;
  updatePlayBtn();
  lastTimestamp = performance.now();
}

function updatePlayBtn() {
  const btn = document.getElementById('btnPlay');
  if (btn) {
    btn.textContent = State.isPlaying ? '⏸' : '▶';
    btn.classList.toggle('active', State.isPlaying);
  }
}

function setFrame(f) {
  State.currentFrame = Math.max(0, Math.min(State.totalFrames - 1, f));
  updateFrameDisplay();
  updatePlayheadPosition();
  applyKeyframeAtCurrentFrame();
}

function updateFrameDisplay() {
  const el = document.getElementById('frameDisplay');
  if (el) el.textContent = `${State.currentFrame} / ${State.totalFrames - 1}`;
  const el2 = document.getElementById('tlFrameNum');
  if (el2) el2.textContent = State.currentFrame;
}

function updatePlayheadPosition() {
  const tlMain = document.getElementById('tlMain');
  const ph     = document.getElementById('playhead');
  if (!tlMain || !ph) return;
  const w = Math.max(tlMain.clientWidth, State.totalFrames * 16);
  const x = (State.currentFrame / State.totalFrames) * w;
  ph.style.left = x + 'px';
}

// ═══════════════════════════════════════════════════
// KEYFRAMES
// ═══════════════════════════════════════════════════
function addKeyframeAtCurrent() {
  const layer = State.layers[State.activeLayerIndex];
  if (!layer) return;
  const key = `${layer.id}_${State.currentFrame}`;
  State.keyframes[key] = {
    frame: State.currentFrame,
    layerId: layer.id,
    objects: JSON.parse(JSON.stringify(layer.objects)),
  };
  renderTimeline();
  showToast(`Keyframe مضاف في الإطار ${State.currentFrame}`, 'success');
}

function applyKeyframeAtCurrentFrame() {
  // Interpolate between keyframes
  State.layers.forEach(layer => {
    const key = `${layer.id}_${State.currentFrame}`;
    if (State.keyframes[key]) {
      layer.objects = JSON.parse(JSON.stringify(State.keyframes[key].objects));
      redrawLayerFromObjects(layer);
    }
  });

  // Apply bone keyframes
  applyBoneKeyframes();
}

function redrawLayerFromObjects(layer) {
  layer.offCtx.clearRect(0, 0, canvas.width, canvas.height);
  layer.objects.forEach(obj => drawObject(layer.offCtx, obj));
}

function applyBoneKeyframes() {
  const kfAtFrame = State.boneKeyframes[State.currentFrame];
  if (!kfAtFrame) return;
  const bmap = {};
  State.bones.forEach(b => bmap[b.id] = b);
  Object.entries(kfAtFrame).forEach(([boneId, props]) => {
    if (bmap[boneId]) Object.assign(bmap[boneId], props);
  });
  updateBonePositions();
}

// ═══════════════════════════════════════════════════
// PREBUILT ANIMATIONS
// ═══════════════════════════════════════════════════
function renderPrebuiltAnims() {
  const container = document.getElementById('prebuiltAnims');
  if (!container) return;
  container.innerHTML = '';

  Object.entries(PREBUILT_ANIMS).forEach(([id, anim]) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline btn-sm';
    btn.style.cssText = 'font-size:12px; justify-content:flex-start; gap:8px;';
    btn.innerHTML = `<span>${getAnimIcon(id)}</span> <span>${anim.name}</span> <span style="margin-right:auto;font-family:var(--font-mono);color:var(--text-dim);font-size:10px;">${anim.frames}f</span>`;
    btn.addEventListener('click', () => applyPrebuiltAnim(id));
    container.appendChild(btn);
  });
}

function getAnimIcon(id) {
  const icons = { walk:'🚶', run:'🏃', jump:'🦘', idle:'😤', attack:'⚔', hit:'💥', sit:'🧘' };
  return icons[id] || '🎬';
}

function applyPrebuiltAnim(id) {
  const anim = PREBUILT_ANIMS[id];
  if (!anim) return;

  State.totalFrames = anim.frames;
  State.fps = anim.fps || 24;

  // Load bone keyframes
  State.boneKeyframes = {};
  anim.keyframes.forEach(kf => {
    State.boneKeyframes[kf.frame] = kf.bones;
  });

  document.getElementById('tlDuration').value = anim.frames;
  document.getElementById('fpsSelect').value  = anim.fps || 24;

  setFrame(0);
  renderTimeline();
  showToast(`تم تحميل حركة "${anim.name}"`, 'success');
}

// ═══════════════════════════════════════════════════
// TIMELINE
// ═══════════════════════════════════════════════════
function renderTimeline() {
  renderTlLabels();
  renderTlTracks();
  renderTlRuler();
  updatePlayheadPosition();
}

function renderTlLabels() {
  const el = document.getElementById('tlLabels');
  if (!el) return;
  el.innerHTML = '<div class="timeline-label-header">الطبقة / العظمة</div>';

  State.layers.forEach((layer, i) => {
    const row = document.createElement('div');
    row.className = 'timeline-track-label' + (i === State.activeLayerIndex ? ' selected' : '');
    row.innerHTML = `<span class="track-type-icon">📚</span><span class="track-name">${layer.name}</span>`;
    row.addEventListener('click', () => {
      State.activeLayerIndex = i;
      renderLayersPanel();
      renderTimeline();
    });
    el.appendChild(row);
  });

  State.bones.slice(0, 6).forEach(bone => {
    const row = document.createElement('div');
    row.className = 'timeline-track-label' + (bone.id === State.selectedBoneId ? ' selected' : '');
    row.innerHTML = `<span class="track-type-icon">🦴</span><span class="track-name">${bone.name}</span>`;
    row.addEventListener('click', () => { State.selectedBoneId = bone.id; renderBonesPanel(); renderTimeline(); });
    el.appendChild(row);
  });
}

function renderTlTracks() {
  const el = document.getElementById('tlTracks');
  if (!el) return;
  const trackW = Math.max(800, State.totalFrames * 16);
  el.style.width = trackW + 'px';
  el.innerHTML = '';

  const allTracks = [...State.layers, ...State.bones.slice(0, 6)];

  allTracks.forEach((item, ti) => {
    const track = document.createElement('div');
    track.className = 'timeline-track' + (ti === State.activeLayerIndex ? ' selected' : '');

    // Find keyframes for this track
    const isLayer = item instanceof Layer;
    if (isLayer) {
      Object.entries(State.keyframes).forEach(([key, kf]) => {
        if (kf.layerId === item.id) {
          const kfEl = document.createElement('div');
          kfEl.className = 'keyframe';
          const x = (kf.frame / State.totalFrames) * trackW;
          kfEl.style.left = x + 'px';
          kfEl.addEventListener('click', e => { e.stopPropagation(); setFrame(kf.frame); });
          track.appendChild(kfEl);
        }
      });
    } else {
      // Bone keyframes
      Object.entries(State.boneKeyframes).forEach(([frame, boneData]) => {
        if (boneData[item.id]) {
          const kfEl = document.createElement('div');
          kfEl.className = 'keyframe';
          const x = (parseInt(frame) / State.totalFrames) * trackW;
          kfEl.style.left = x + 'px';
          kfEl.style.background = 'var(--purple)';
          track.appendChild(kfEl);
        }
      });
    }

    track.addEventListener('click', e => {
      const rect = el.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const frame = Math.round((clickX / trackW) * State.totalFrames);
      setFrame(Math.max(0, Math.min(frame, State.totalFrames - 1)));
    });

    el.appendChild(track);
  });
}

function renderTlRuler() {
  const c = document.getElementById('tlRuler');
  if (!c) return;
  const trackW = Math.max(800, State.totalFrames * 16);
  c.width = trackW;
  const rctx = c.getContext('2d');
  rctx.clearRect(0, 0, c.width, c.height);
  rctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card') || '#0a0f1e';
  rctx.fillRect(0, 0, c.width, c.height);

  const step = State.totalFrames <= 48 ? 2 : State.totalFrames <= 120 ? 6 : 12;
  for (let f = 0; f <= State.totalFrames; f++) {
    const x = (f / State.totalFrames) * trackW;
    const isMajor = f % step === 0;
    rctx.strokeStyle = isMajor ? '#4a6080' : '#1e2d4a';
    rctx.lineWidth = 1;
    rctx.beginPath();
    rctx.moveTo(x, isMajor ? 8 : 14);
    rctx.lineTo(x, 24);
    rctx.stroke();
    if (isMajor) {
      rctx.fillStyle = '#4a6080';
      rctx.font = '9px monospace';
      rctx.fillText(f, x + 2, 10);
    }
  }
}

function onTimelineClick(e) {
  const tlMain = document.getElementById('tlMain');
  const rect   = tlMain.getBoundingClientRect();
  const clickX = e.clientX - rect.left + tlMain.scrollLeft;
  const trackW = Math.max(800, State.totalFrames * 16);
  const frame  = Math.round((clickX / trackW) * State.totalFrames);
  setFrame(Math.max(0, Math.min(frame, State.totalFrames - 1)));
}

function onTimelineHover(e) {
  // No-op for now
}

// ═══════════════════════════════════════════════════
// LAYERS PANEL
// ═══════════════════════════════════════════════════
function renderLayersPanel() {
  const el = document.getElementById('layersList');
  if (!el) return;
  el.innerHTML = '';

  [...State.layers].reverse().forEach((layer, ri) => {
    const i = State.layers.length - 1 - ri;
    const item = document.createElement('div');
    item.className = 'layer-item' + (i === State.activeLayerIndex ? ' active' : '');
    item.innerHTML = `
      <span class="layer-visibility ${layer.visible ? '' : 'hidden'}" data-idx="${i}" title="إظهار/إخفاء">
        ${layer.visible ? '👁' : '🚫'}
      </span>
      <span class="layer-lock" title="قفل">${layer.locked ? '🔒' : '🔓'}</span>
      <canvas class="layer-thumb" width="32" height="24"></canvas>
      <span class="layer-name">${layer.name}</span>
      <span class="layer-opacity">${Math.round(layer.opacity * 100)}%</span>
    `;

    // Thumb
    const thumb = item.querySelector('canvas');
    const thumbCtx = thumb.getContext('2d');
    thumbCtx.drawImage(layer.offCanvas, 0, 0, 32, 24);

    item.querySelector('.layer-visibility').addEventListener('click', e => {
      e.stopPropagation();
      layer.visible = !layer.visible;
      renderLayersPanel();
    });

    item.querySelector('.layer-lock').addEventListener('click', e => {
      e.stopPropagation();
      layer.locked = !layer.locked;
      renderLayersPanel();
    });

    item.querySelector('.layer-name').addEventListener('dblclick', e => {
      const input = document.createElement('input');
      input.className = 'layer-name-input';
      input.value = layer.name;
      e.target.replaceWith(input);
      input.focus();
      input.addEventListener('blur', () => { layer.name = input.value; renderLayersPanel(); });
      input.addEventListener('keydown', e2 => { if (e2.key === 'Enter') input.blur(); });
    });

    item.addEventListener('click', () => {
      State.activeLayerIndex = i;
      renderLayersPanel();
    });

    el.appendChild(item);
  });
}

function addLayer() {
  const id = 'layer_' + genId();
  State.layers.push(new Layer(id, `طبقة ${State.layers.length + 1}`));
  State.activeLayerIndex = State.layers.length - 1;
  renderLayersPanel();
  renderTimeline();
  showToast('تمت إضافة طبقة جديدة', 'success');
}

function deleteActiveLayer() {
  if (State.layers.length <= 1) { showToast('يجب بقاء طبقة واحدة على الأقل', 'warning'); return; }
  State.layers.splice(State.activeLayerIndex, 1);
  State.activeLayerIndex = Math.min(State.activeLayerIndex, State.layers.length - 1);
  renderLayersPanel();
  renderTimeline();
  pushHistory();
}

// ═══════════════════════════════════════════════════
// BONES PANEL
// ═══════════════════════════════════════════════════
function renderBonesPanel() {
  const el = document.getElementById('boneTree');
  if (!el) return;
  el.innerHTML = '';

  const bmap = {};
  State.bones.forEach(b => bmap[b.id] = b);

  // Render roots first, then children
  function renderBone(bone, depth) {
    const item = document.createElement('div');
    item.className = 'bone-item' + (bone.id === State.selectedBoneId ? ' selected' : '');
    item.innerHTML = `
      <div class="bone-indent" style="width:${depth*16}px;"></div>
      <span class="bone-icon">${depth === 0 ? '🦴' : '╰🦴'}</span>
      <span class="bone-name">${bone.name}</span>
    `;
    item.addEventListener('click', () => {
      State.selectedBoneId = bone.id;
      renderBonesPanel();
      showBoneProps(bone);
    });
    el.appendChild(item);

    // Children
    State.bones.filter(b => b.parentId === bone.id).forEach(child => renderBone(child, depth + 1));
  }

  State.bones.filter(b => !b.parentId).forEach(root => renderBone(root, 0));
}

function showBoneProps(bone) {
  const sect = document.getElementById('bonePropSection');
  if (sect) sect.style.display = 'block';
  const lenInput   = document.getElementById('boneLength');
  const angleInput = document.getElementById('boneAngle');
  if (lenInput)   lenInput.value   = Math.round(bone.length);
  if (angleInput) angleInput.value = Math.round(bone.angle * 180 / Math.PI);
}

function startAddBone() { selectTool('bone'); }
function deleteSelectedBone() {
  if (!State.selectedBoneId) return;
  State.bones = State.bones.filter(b => b.id !== State.selectedBoneId);
  State.selectedBoneId = null;
  renderBonesPanel();
  pushHistory();
}

// ─── IK Solver (FABRIK simplified) ───────────────
function solveIK(boneChain, targetX, targetY) {
  if (boneChain.length === 0) return;
  // Simple 2-bone IK
  const root = boneChain[0];
  const end  = boneChain[boneChain.length - 1];
  const totalLen = boneChain.reduce((sum, b) => sum + b.length, 0);
  const dx = targetX - root.x;
  const dy = targetY - root.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const angle = Math.atan2(dy, dx);

  if (dist >= totalLen) {
    // Fully extended
    boneChain.forEach((bone, i) => {
      bone.angle = angle;
      if (i > 0) { bone.x = boneChain[i-1].tip.x; bone.y = boneChain[i-1].tip.y; }
    });
  } else if (boneChain.length === 2) {
    // Two-bone analytic IK
    const a = boneChain[0].length;
    const b = boneChain[1].length;
    const cosC = (a*a + dist*dist - b*b) / (2*a*dist);
    const C = Math.acos(Math.max(-1, Math.min(1, cosC)));
    boneChain[0].angle = angle - C;
    boneChain[1].x = boneChain[0].tip.x;
    boneChain[1].y = boneChain[0].tip.y;
    const angle2 = Math.atan2(targetY - boneChain[1].y, targetX - boneChain[1].x);
    boneChain[1].angle = angle2;
  }
}

// ═══════════════════════════════════════════════════
// PROPERTIES PANEL
// ═══════════════════════════════════════════════════
function updatePropsPanel(obj) {
  if (!obj) return;
  const xEl = document.getElementById('propX');
  const yEl = document.getElementById('propY');
  const wEl = document.getElementById('propW');
  const hEl = document.getElementById('propH');
  if (xEl) xEl.value = Math.round(obj.x || obj.x1 || 0);
  if (yEl) yEl.value = Math.round(obj.y || obj.y1 || 0);
  if (wEl) wEl.value = Math.round(obj.w || obj.r*2 || 0);
  if (hEl) hEl.value = Math.round(obj.h || obj.r*2 || 0);
}

function applyPropsToSelection() {
  State.selectedObjects.forEach(obj => {
    const x = parseFloat(document.getElementById('propX').value);
    const y = parseFloat(document.getElementById('propY').value);
    const w = parseFloat(document.getElementById('propW').value);
    const h = parseFloat(document.getElementById('propH').value);
    if (obj.type === 'rect') { obj.x = x; obj.y = y; obj.w = w; obj.h = h; }
    else if (obj.type === 'circle') { obj.x = x; obj.y = y; obj.r = Math.min(w,h)/2; }
  });
  redrawActiveLayer();
}

function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.toggle('collapsed');
}

// ═══════════════════════════════════════════════════
// COLOR PICKER
// ═══════════════════════════════════════════════════
let colorPickerHue = 180;
let colorPickerSat = 100;
let colorPickerBri = 80;

function openColorPicker(target = 'fill') {
  State.colorPickerTarget = target;
  const popup = document.getElementById('colorPickerPopup');
  if (!popup) return;

  const swatch = target === 'fill'
    ? document.getElementById('fgColorSwatch')
    : document.getElementById('strokeColorPrev');
  const rect = swatch ? swatch.getBoundingClientRect() : { left: 100, bottom: 200 };
  popup.style.display = 'block';
  popup.style.left = (rect.left) + 'px';
  popup.style.top  = (rect.bottom + 8) + 'px';

  drawColorSpectrum();
  drawHueSlider();
  bindColorPickerEvents();
}

function openStrokeColorPicker() { openColorPicker('stroke'); }

function closeColorPicker() {
  const popup = document.getElementById('colorPickerPopup');
  if (popup) popup.style.display = 'none';
}

function applyColor() {
  const hex = document.getElementById('colorPickerHex').value;
  if (State.colorPickerTarget === 'fill') {
    State.fgColor = hex;
    document.getElementById('fgColorSwatch').style.background = hex;
    document.getElementById('propColorPrev').style.background = hex;
    document.getElementById('propColorHex').value = hex;
  } else {
    State.strokeColor = hex;
    document.getElementById('strokeColorPrev').style.background = hex;
    document.getElementById('strokeColorHex').value = hex;
  }
  closeColorPicker();
}

function drawColorSpectrum() {
  const c = document.getElementById('colorSpectrum');
  if (!c) return;
  const sctx = c.getContext('2d');
  const w = c.width, h = c.height;

  const hueGrad = sctx.createLinearGradient(0, 0, w, 0);
  hueGrad.addColorStop(0, `hsl(${colorPickerHue}, 100%, 100%)`);
  hueGrad.addColorStop(1, `hsl(${colorPickerHue}, 100%, 50%)`);
  sctx.fillStyle = hueGrad;
  sctx.fillRect(0, 0, w, h);

  const darkGrad = sctx.createLinearGradient(0, 0, 0, h);
  darkGrad.addColorStop(0, 'rgba(0,0,0,0)');
  darkGrad.addColorStop(1, 'rgba(0,0,0,1)');
  sctx.fillStyle = darkGrad;
  sctx.fillRect(0, 0, w, h);
}

function drawHueSlider() {
  const c = document.getElementById('hueSlider');
  if (!c) return;
}

function bindColorPickerEvents() {
  const spectrum = document.getElementById('colorSpectrum');
  const hueSlider = document.getElementById('hueSlider');

  if (spectrum && !spectrum._bound) {
    spectrum._bound = true;
    spectrum.addEventListener('click', e => {
      const rect = spectrum.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hex = getColorFromSpectrum(spectrum, x, y);
      document.getElementById('colorPickerHex').value = hex;
      document.getElementById('colorPickerPreview').style.background = hex;
    });
  }

  if (hueSlider && !hueSlider._bound) {
    hueSlider._bound = true;
    hueSlider.addEventListener('click', e => {
      const rect = hueSlider.getBoundingClientRect();
      colorPickerHue = Math.round((e.clientX - rect.left) / rect.width * 360);
      drawColorSpectrum();
    });
  }
}

function getColorFromSpectrum(canvas, x, y) {
  const ctx2 = canvas.getContext('2d');
  const data = ctx2.getImageData(x, y, 1, 1).data;
  return rgbToHex(data[0], data[1], data[2]);
}

function rgbToHex(r, g, b) {
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function swapColors() {
  [State.fgColor, State.bgColor] = [State.bgColor, State.fgColor];
  document.getElementById('fgColorSwatch').style.background = State.fgColor;
  document.getElementById('bgColorSwatch').style.background = State.bgColor;
  document.getElementById('propColorPrev').style.background = State.fgColor;
  document.getElementById('propColorHex').value = State.fgColor;
}

// ═══════════════════════════════════════════════════
// TOOLS
// ═══════════════════════════════════════════════════
function selectTool(tool) {
  State.activeTool = tool;
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });

  // Update cursor
  const cursors = {
    select: 'default', move: 'move', pen: 'crosshair', brush: 'crosshair',
    eraser: 'cell', rect: 'crosshair', circle: 'crosshair', line: 'crosshair',
    fill: 'cell', bezier: 'crosshair', bone: 'crosshair',
    pan: 'grab', zoom: 'zoom-in', eyedropper: 'crosshair',
  };
  document.getElementById('canvasContainer').style.cursor = cursors[tool] || 'default';

  // Cancel bezier if switching away
  if (tool !== 'bezier') State.bezierPoints = null;
}

// ═══════════════════════════════════════════════════
// OVERLAYS TOGGLE
// ═══════════════════════════════════════════════════
function toggleOverlay(type) {
  const map = { grid: 'showGrid', bones: 'showBones', onion: 'showOnion', symmetry: 'showSymmetry' };
  const btnMap = { grid: 'toggleGrid', bones: 'toggleBones', onion: 'toggleOnion', symmetry: 'toggleSymmetry' };
  const key = map[type];
  if (key) {
    State[key] = !State[key];
    const btn = document.getElementById(btnMap[type]);
    if (btn) {
      btn.classList.toggle('active', State[key]);
      btn.textContent = State[key] ?
        { grid:'شبكة', bones:'عظام', onion:'بصل', symmetry:'تماثل' }[type] :
        { grid:'إيقاف', bones:'إيقاف', onion:'إيقاف', symmetry:'إيقاف' }[type];
    }
  }
}

// ═══════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════
function bindKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's': e.preventDefault(); saveProject(); break;
        case 'z': e.preventDefault(); e.shiftKey ? redo() : undo(); break;
        case 'y': e.preventDefault(); redo(); break;
        case 'c': e.preventDefault(); copySelection(); break;
        case 'v': e.preventDefault(); pasteSelection(); break;
        case 'd': e.preventDefault(); duplicateSelection(); break;
        case 'a': e.preventDefault(); selectAll(); break;
      }
      return;
    }

    switch (e.key.toLowerCase()) {
      case 'v': selectTool('select'); break;
      case 'm': selectTool('move'); break;
      case 'p': selectTool('pen'); break;
      case 'b': selectTool('brush'); break;
      case 'e': selectTool('eraser'); break;
      case 'r': selectTool('rect'); break;
      case 'o': selectTool('circle'); break;
      case 'l': selectTool('line'); break;
      case 'f': selectTool('fill'); break;
      case 'c': selectTool('bezier'); break;
      case 'n': selectTool('bone'); break;
      case 'i': selectTool('ik'); break;
      case 'z': selectTool('zoom'); break;
      case 'h': selectTool('pan'); break;
      case 'x': swapColors(); break;
      case 'k': addKeyframeAtCurrent(); break;
      case ' ': e.preventDefault(); togglePlay(); break;
      case 'arrowleft': setFrame(State.currentFrame - 1); break;
      case 'arrowright': setFrame(State.currentFrame + 1); break;
      case 'delete':
      case 'backspace': deleteSelection(); break;
      case 'escape': State.selectedObjects = []; State.bezierPoints = null; break;
    }
  });
}

// ═══════════════════════════════════════════════════
// EDIT OPERATIONS
// ═══════════════════════════════════════════════════
function copySelection() {
  if (State.selectedObjects.length > 0) {
    State.clipboard = JSON.parse(JSON.stringify(State.selectedObjects));
    showToast('تم النسخ', 'info');
  }
}

function pasteSelection() {
  if (!State.clipboard) return;
  const layer = State.layers[State.activeLayerIndex];
  if (!layer) return;
  State.clipboard.forEach(obj => {
    const newObj = JSON.parse(JSON.stringify(obj));
    newObj.id = genId();
    if ('x' in newObj) { newObj.x += 20; newObj.y += 20; }
    layer.objects.push(newObj);
    drawObject(layer.offCtx, newObj);
  });
  pushHistory();
  showToast('تم اللصق', 'info');
}

function duplicateSelection() {
  copySelection();
  pasteSelection();
}

function deleteSelection() {
  if (State.selectedObjects.length > 0) {
    const layer = State.layers[State.activeLayerIndex];
    if (layer) {
      const idsToDelete = new Set(State.selectedObjects.map(o => o.id));
      layer.objects = layer.objects.filter(o => !idsToDelete.has(o.id));
      redrawActiveLayer();
      State.selectedObjects = [];
      pushHistory();
    }
  }
}

function selectAll() {
  const layer = State.layers[State.activeLayerIndex];
  if (layer) { State.selectedObjects = [...layer.objects]; }
}

// ═══════════════════════════════════════════════════
// HISTORY (Undo/Redo)
// ═══════════════════════════════════════════════════
function pushHistory() {
  const snapshot = {
    layers: State.layers.map(l => ({
      ...l,
      objects: JSON.parse(JSON.stringify(l.objects)),
    })),
    bones: JSON.parse(JSON.stringify(State.bones)),
  };
  State.history = State.history.slice(0, State.historyIndex + 1);
  State.history.push(snapshot);
  if (State.history.length > 50) State.history.shift();
  State.historyIndex = State.history.length - 1;
}

function undo() {
  if (State.historyIndex <= 0) { showToast('لا يوجد ما يمكن التراجع عنه', 'info'); return; }
  State.historyIndex--;
  restoreFromHistory();
  showToast('تراجع', 'info');
}

function redo() {
  if (State.historyIndex >= State.history.length - 1) return;
  State.historyIndex++;
  restoreFromHistory();
  showToast('إعادة', 'info');
}

function restoreFromHistory() {
  const snap = State.history[State.historyIndex];
  if (!snap) return;
  snap.layers.forEach((snapL, i) => {
    if (State.layers[i]) {
      State.layers[i].objects = JSON.parse(JSON.stringify(snapL.objects));
      redrawLayerFromObjects(State.layers[i]);
    }
  });
  State.bones = JSON.parse(JSON.stringify(snap.bones)).map(b => Object.assign(new Bone(b.id, b.name, b.x, b.y, b.length, b.angle, b.parentId), b));
  renderBonesPanel();
}

// ═══════════════════════════════════════════════════
// SAVE / LOAD / EXPORT
// ═══════════════════════════════════════════════════
function saveProject() {
  const data = {
    id:          State.projectId || genId(),
    name:        State.projectName,
    savedAt:     Date.now(),
    fps:         State.fps,
    frameCount:  State.totalFrames,
    bones:       State.bones,
    keyframes:   State.keyframes,
    boneKeyframes: State.boneKeyframes,
    layers:      State.layers.map(l => ({
      id: l.id, name: l.name, type: l.type,
      visible: l.visible, locked: l.locked,
      opacity: l.opacity, blendMode: l.blendMode,
      objects: l.objects,
      imageData: l.offCanvas.toDataURL('image/png'),
    })),
  };

  // Save current project
  localStorage.setItem('animforge_project_' + data.id, JSON.stringify(data));

  // Update projects list
  let projects = [];
  try { projects = JSON.parse(localStorage.getItem('animforge_projects') || '[]'); } catch {}
  const existing = projects.findIndex(p => p.id === data.id);
  const entry = { id: data.id, name: data.name, savedAt: data.savedAt, fps: data.fps, frameCount: data.frameCount };
  if (existing >= 0) projects[existing] = entry;
  else projects.unshift(entry);
  localStorage.setItem('animforge_projects', JSON.stringify(projects.slice(0, 50)));

  showToast('تم حفظ المشروع ✓', 'success');
}

function loadProject(id) {
  try {
    const raw = localStorage.getItem('animforge_project_' + id);
    if (!raw) return;
    const data = JSON.parse(raw);
    State.projectName  = data.name;
    State.fps          = data.fps || 24;
    State.totalFrames  = data.frameCount || 48;
    State.keyframes    = data.keyframes || {};
    State.boneKeyframes = data.boneKeyframes || {};
    State.bones        = (data.bones || []).map(b => Object.assign(new Bone(b.id, b.name, b.x, b.y, b.length, b.angle, b.parentId), b));

    State.layers = (data.layers || []).map(ld => {
      const layer = new Layer(ld.id, ld.name, ld.type);
      layer.visible  = ld.visible;
      layer.locked   = ld.locked;
      layer.opacity  = ld.opacity;
      layer.blendMode = ld.blendMode;
      layer.objects  = ld.objects || [];
      // Restore image data
      if (ld.imageData) {
        const img = new Image();
        img.onload = () => layer.offCtx.drawImage(img, 0, 0);
        img.src = ld.imageData;
      }
      return layer;
    });

    document.getElementById('projectName').value = State.projectName;
    document.getElementById('fpsSelect').value   = State.fps;
    document.getElementById('tlDuration').value  = State.totalFrames;

    renderLayersPanel();
    renderBonesPanel();
    renderTimeline();
    showToast(`تم تحميل "${State.projectName}"`, 'success');
  } catch (err) {
    showToast('خطأ في تحميل المشروع', 'error');
    console.error(err);
  }
}

// ─── Export ───────────────────────────────────────
let selectedExportFormat = 'gif';

function openExportModal() {
  document.getElementById('exportModal').classList.add('open');
}

function closeExportModal() {
  document.getElementById('exportModal').classList.remove('open');
}

function selectExport(el, format) {
  document.querySelectorAll('.export-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedExportFormat = format;
}

function doExport() {
  closeExportModal();
  switch (selectedExportFormat) {
    case 'gif':         exportGIF(); break;
    case 'mp4':         exportMP4(); break;
    case 'spritesheet': exportSpriteSheet(); break;
    case 'json':        exportJSON(); break;
    case 'svg':         exportSVG(); break;
  }
}

function exportGIF() {
  showToast('جاري إنشاء GIF... ⏳ (يتطلب مكتبة gif.js)', 'info');
  // GIF export requires gif.js library — shows concept
  const frames = captureFrames();
  console.log('GIF frames:', frames.length);
  showToast('تم تصدير GIF (محاكاة)', 'success');
}

function exportMP4() {
  showToast('MP4 يتطلب مكتبة ffmpeg.wasm', 'info');
}

function exportSpriteSheet() {
  const cols = Math.ceil(Math.sqrt(State.totalFrames));
  const rows = Math.ceil(State.totalFrames / cols);
  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width  = canvas.width * cols;
  sheetCanvas.height = canvas.height * rows;
  const sheetCtx = sheetCanvas.getContext('2d');

  captureFrames().forEach((frameData, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const img = new Image();
    img.onload = () => sheetCtx.drawImage(img, col * canvas.width, row * canvas.height);
    img.src = frameData;
  });

  setTimeout(() => {
    const link = document.createElement('a');
    link.download = `${State.projectName}_spritesheet.png`;
    link.href = sheetCanvas.toDataURL('image/png');
    link.click();
    showToast('تم تصدير Sprite Sheet ✓', 'success');
  }, 500);
}

function exportJSON() {
  const data = {
    name: State.projectName,
    fps: State.fps,
    totalFrames: State.totalFrames,
    bones: State.bones,
    keyframes: State.keyframes,
    boneKeyframes: State.boneKeyframes,
    layers: State.layers.map(l => ({ id: l.id, name: l.name, objects: l.objects })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = `${State.projectName}.json`;
  link.href = URL.createObjectURL(blob);
  link.click();
  showToast('تم تصدير JSON ✓', 'success');
}

function exportSVG() {
  let svgContent = `<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">`;
  State.layers.forEach(layer => {
    if (!layer.visible) return;
    layer.objects.forEach(obj => {
      if (obj.type === 'rect') {
        svgContent += `<rect x="${obj.x}" y="${obj.y}" width="${obj.w}" height="${obj.h}" fill="${obj.fill}" stroke="${obj.stroke}" stroke-width="${obj.strokeWidth}"/>`;
      } else if (obj.type === 'circle') {
        svgContent += `<circle cx="${obj.x}" cy="${obj.y}" r="${obj.r}" fill="${obj.fill}" stroke="${obj.stroke}" stroke-width="${obj.strokeWidth}"/>`;
      } else if (obj.type === 'path' && obj.points) {
        const d = obj.points.map((p, i) => `${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
        svgContent += `<path d="${d}" fill="none" stroke="${obj.stroke}" stroke-width="${obj.strokeWidth}"/>`;
      }
    });
  });
  svgContent += '</svg>';
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const link = document.createElement('a');
  link.download = `${State.projectName}.svg`;
  link.href = URL.createObjectURL(blob);
  link.click();
  showToast('تم تصدير SVG ✓', 'success');
}

function captureFrames() {
  const frames = [];
  const savedFrame = State.currentFrame;
  for (let f = 0; f < State.totalFrames; f++) {
    setFrame(f);
    drawCanvas();
    frames.push(canvas.toDataURL('image/png'));
  }
  setFrame(savedFrame);
  return frames;
}

// ═══════════════════════════════════════════════════
// CONTEXT MENU
// ═══════════════════════════════════════════════════
function showContextMenu(x, y) {
  const menu = document.getElementById('contextMenu');
  if (!menu) return;
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  menu.classList.add('open');
}

function closeContextMenu() {
  const menu = document.getElementById('contextMenu');
  if (menu) menu.classList.remove('open');
}

function ctxAction(action) {
  closeContextMenu();
  switch (action) {
    case 'copy':       copySelection(); break;
    case 'paste':      pasteSelection(); break;
    case 'duplicate':  duplicateSelection(); break;
    case 'delete':     deleteSelection(); break;
    case 'addKeyframe': addKeyframeAtCurrent(); break;
    case 'bringFront': bringToFront(); break;
    case 'sendBack':   sendToBack(); break;
  }
}

function bringToFront() {
  const layer = State.layers[State.activeLayerIndex];
  if (!layer || State.selectedObjects.length === 0) return;
  State.selectedObjects.forEach(obj => {
    const idx = layer.objects.indexOf(obj);
    if (idx < layer.objects.length - 1) {
      layer.objects.splice(idx, 1);
      layer.objects.push(obj);
    }
  });
  redrawActiveLayer();
  pushHistory();
}

function sendToBack() {
  const layer = State.layers[State.activeLayerIndex];
  if (!layer || State.selectedObjects.length === 0) return;
  State.selectedObjects.forEach(obj => {
    const idx = layer.objects.indexOf(obj);
    if (idx > 0) {
      layer.objects.splice(idx, 1);
      layer.objects.unshift(obj);
    }
  });
  redrawActiveLayer();
  pushHistory();
}

// ═══════════════════════════════════════════════════
// THEME & MISC
// ═══════════════════════════════════════════════════
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('animforge_theme', next);
  const btn = document.getElementById('btnTheme');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}

function applyThemeFromStorage() {
  const saved = localStorage.getItem('animforge_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('btnTheme');
  if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
}

function resizeCanvas(w, h) {
  State.canvasW = w;
  State.canvasH = h;
  canvas.width  = w; canvas.height  = h;
  overlayCanvas.width = w; overlayCanvas.height = h;
  State.layers.forEach(l => {
    l.offCanvas.width = w; l.offCanvas.height = h;
  });
  zoomFit();
  showToast(`Canvas: ${w}×${h}`, 'info');
}

function checkURLParams() {
  const params = new URLSearchParams(location.search);
  const projectId = params.get('project');
  const animId    = params.get('anim');
  if (projectId) loadProject(projectId);
  if (animId && PREBUILT_ANIMS[animId]) applyPrebuiltAnim(animId);
}

function handleMenuClick(menuId) {
  const actions = {
    menuFile: () => showToast('قائمة الملف — قريباً', 'info'),
    menuEdit: () => showToast('قائمة التحرير — قريباً', 'info'),
    menuView: () => showToast('قائمة العرض — قريباً', 'info'),
    menuAnimate: () => showToast('قائمة التحريك — قريباً', 'info'),
    menuExport: () => openExportModal(),
  };
  const action = actions[menuId];
  if (action) action();
}

// ═══════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || ''}</span><span class="toast-text">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toast-in 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ═══════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Make key functions accessible globally (for HTML onclick attributes)
window.addLayer          = addLayer;
window.deleteActiveLayer = deleteActiveLayer;
window.startAddBone      = startAddBone;
window.deleteSelectedBone= deleteSelectedBone;
window.togglePanel       = togglePanel;
window.openColorPicker   = openColorPicker;
window.openStrokeColorPicker = openStrokeColorPicker;
window.closeColorPicker  = closeColorPicker;
window.applyColor        = applyColor;
window.swapColors        = swapColors;
window.closeExportModal  = closeExportModal;
window.selectExport      = selectExport;
window.doExport          = doExport;
window.ctxAction         = ctxAction;
