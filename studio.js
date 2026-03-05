/* ═══════════════════════════════════════════════
   studio.js  —  Safwan Studio v2  —  Full Engine
   ═══════════════════════════════════════════════ */
'use strict';

// ─────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────
const S = {
  tool:'brush', brushType:'round',
  brushSize:20, brushOpacity:1, brushFlow:1, brushHardness:.8,
  blendMode:'source-over', smoothing:50,
  fgColor:'#FF6B35', bgColor:'#1A1A2E',
  zoom:1, panX:0, panY:0,
  isDrawing:false, isPanning:false, spaceHeld:false,
  lastX:0, lastY:0,
  history:[], redoStack:[], MAX_HISTORY:60,
  canvasW:1920, canvasH:1080, canvasBg:'white',
  layers:[], activeLayerIndex:0,
  refImage:null, refOpacity:.5, refLocked:false,
  copyBuffer:null,
  drawing:{startX:0, startY:0},
  isAnimMode:false,
  frames:[], activeFrameIndex:0,
  fps:12, isPlaying:false, playTimer:null,
  onionSkin:false,
  projectName:'مشروع جديد',
  projectType:'static',
};

// ─────────────────────────────────────────────────
//  DOM
// ─────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const $$ = s  => document.querySelectorAll(s);

let mainCanvas, overlayCanvas, referenceCanvas;
let mctx, octx, rctx;

function initDomRefs(){
  mainCanvas      = $('mainCanvas');
  overlayCanvas   = $('overlayCanvas');
  referenceCanvas = $('referenceCanvas');
  mctx = mainCanvas.getContext('2d');
  octx = overlayCanvas.getContext('2d');
  rctx = referenceCanvas.getContext('2d');
}

// ─────────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────────
let _tt;
function toast(msg, dur=2200){
  const el = $('toast'); if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), dur);
}

// ─────────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDomRefs();
  setupNewProjectModal();
});

// ─────────────────────────────────────────────────
//  NEW PROJECT MODAL
// ─────────────────────────────────────────────────
function setupNewProjectModal(){
  // Project type
  $$('.proj-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.proj-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.projectType = btn.dataset.type;
      $('animSettingsSection').classList.toggle('hidden', S.projectType !== 'animation');
    });
  });

  // Platform presets
  $$('.plat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.plat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const w = parseInt(btn.dataset.w), h = parseInt(btn.dataset.h);
      if(w === 0){
        $('customSizeSection').style.display = '';
      } else {
        $('customSizeSection').style.display = 'none';
        $('canvasW').value = w;
        $('canvasH').value = h;
      }
    });
  });

  // BG color
  $$('.bg-col-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.bg-col-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if(btn.dataset.bg === 'custom'){
        const inp = $('bgCustomColor');
        inp.oninput = e => { $('bgCustomDot').style.background = e.target.value; };
        inp.click();
      }
    });
  });

  // Create project button
  $('createProjectBtn').addEventListener('click', () => {
    S.canvasW = Math.max(1, Math.min(8000, parseInt($('canvasW').value) || 1920));
    S.canvasH = Math.max(1, Math.min(8000, parseInt($('canvasH').value) || 1080));
    const bgBtn = document.querySelector('.bg-col-btn.active');
    S.canvasBg = bgBtn
      ? (bgBtn.dataset.bg === 'custom' ? $('bgCustomColor').value : bgBtn.dataset.bg)
      : 'white';
    S.isAnimMode = S.projectType === 'animation';
    if(S.isAnimMode) S.fps = parseInt($('animFPS').value) || 12;
    $('newProjectModal').style.display = 'none';
    initStudio();
  });
}

// ─────────────────────────────────────────────────
//  INIT STUDIO
// ─────────────────────────────────────────────────
function initStudio(){
  setupCanvas();
  setupLayers();
  if(S.isAnimMode) initAnimMode();
  setupToolGroups();
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
  updateHistoryBtns();
  toast('مرحباً بك في صفوان ستوديو ✦');
}

// ─────────────────────────────────────────────────
//  CANVAS SETUP
// ─────────────────────────────────────────────────
function setupCanvas(){
  [mainCanvas, overlayCanvas, referenceCanvas].forEach(c => {
    c.width = S.canvasW; c.height = S.canvasH;
  });
  const cw = $('canvasWrapper');
  cw.style.width  = S.canvasW + 'px';
  cw.style.height = S.canvasH + 'px';
  fillBackground(mctx);
}

function fillBackground(ctx){
  if(S.canvasBg === 'transparent') return;
  ctx.fillStyle =
    S.canvasBg === 'black'  ? '#000000' :
    S.canvasBg === 'white'  ? '#FFFFFF' :
    (S.canvasBg || '#FFFFFF');
  ctx.fillRect(0, 0, S.canvasW, S.canvasH);
}

// ─────────────────────────────────────────────────
//  LAYERS
// ─────────────────────────────────────────────────
function setupLayers(){
  S.layers = [];
  const l = createLayer('الطبقة 1');
  fillBackground(l.ctx);
  S.layers.push(l);
  S.activeLayerIndex = 0;
}

function createLayer(name){
  const c = document.createElement('canvas');
  c.width = S.canvasW; c.height = S.canvasH;
  return {
    id: Date.now() + Math.random(),
    name: name || `طبقة ${S.layers.length + 1}`,
    canvas: c, ctx: c.getContext('2d'),
    visible: true, locked: false, opacity: 1, blendMode: 'source-over'
  };
}

function getActiveLayer(){ return S.layers[S.activeLayerIndex]; }
function getActiveLCtx(){ const l = getActiveLayer(); return l ? l.ctx : mctx; }

function composite(){
  mctx.clearRect(0, 0, S.canvasW, S.canvasH);
  for(let i = S.layers.length - 1; i >= 0; i--){
    const l = S.layers[i];
    if(!l.visible) continue;
    mctx.globalAlpha = l.opacity;
    mctx.globalCompositeOperation = l.blendMode;
    mctx.drawImage(l.canvas, 0, 0);
  }
  mctx.globalAlpha = 1;
  mctx.globalCompositeOperation = 'source-over';
}

// ─────────────────────────────────────────────────
//  ANIMATION MODE
// ─────────────────────────────────────────────────
function initAnimMode(){
  $('animTopbarControls')?.classList.remove('hidden');
  $('framesPanel')?.classList.remove('hidden');
  $$('.anim-export-btn').forEach(b => b.classList.remove('hidden'));
  S.frames = [];
  addNewFrame();
  renderFramesStrip();
  updateFrameCounter();
  setupAnimControls();
  setTimeout(() => createFireProject(), 300);
}

function addNewFrame(){
  const bg = document.createElement('canvas');
  bg.width = S.canvasW; bg.height = S.canvasH;
  const bgctx = bg.getContext('2d');
  bgctx.fillStyle = S.canvasBg === 'black' ? '#000' : '#fff';
  bgctx.fillRect(0, 0, S.canvasW, S.canvasH);

  const drawLayer = createLayer('رسم');
  const frame = {
    id: Date.now() + Math.random(),
    duration: Math.round(1000 / S.fps),
    layers: [
      { id: Date.now() + .1, name: 'خلفية', canvas: bg, ctx: bgctx,
        visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
      drawLayer
    ]
  };
  S.frames.push(frame);
  S.activeFrameIndex = S.frames.length - 1;
  loadFrameLayers();
}

function loadFrameLayers(){
  if(!S.frames.length) return;
  const frame = S.frames[S.activeFrameIndex];
  S.layers = frame.layers;
  S.activeLayerIndex = Math.min(S.activeLayerIndex, S.layers.length - 1);
  composite();
  renderLayersList();
  renderFramesStrip();
  updateFrameCounter();
  if(S.onionSkin) renderOnionSkin();
}

function saveCurrentFrameLayers(){
  if(!S.frames.length) return;
  S.frames[S.activeFrameIndex].layers = S.layers;
}

function updateFrameCounter(){
  const el = $('frameCounter');
  if(el) el.textContent = `${S.activeFrameIndex + 1} / ${S.frames.length}`;
}

function renderFramesStrip(){
  const strip = $('framesStrip'); if(!strip) return;
  strip.innerHTML = '';
  S.frames.forEach((frame, i) => {
    const item = document.createElement('div');
    item.className = 'frame-thumb-item' + (i === S.activeFrameIndex ? ' active' : '');
    const tc = document.createElement('canvas');
    tc.width = 80; tc.height = 60;
    const tctx = tc.getContext('2d');
    for(let li = frame.layers.length - 1; li >= 0; li--){
      const l = frame.layers[li]; if(!l.visible) continue;
      tctx.globalAlpha = l.opacity;
      tctx.drawImage(l.canvas, 0, 0, 80, 60);
    }
    tctx.globalAlpha = 1;
    const num = document.createElement('div');
    num.className = 'frame-num'; num.textContent = i + 1;
    item.appendChild(tc); item.appendChild(num);
    item.addEventListener('click', () => {
      saveCurrentFrameLayers();
      S.activeFrameIndex = i;
      loadFrameLayers();
    });
    strip.appendChild(item);
  });
}

function setupAnimControls(){
  $('addFrameBtn')?.addEventListener('click', () => {
    saveCurrentFrameLayers(); addNewFrame(); toast('تمت إضافة فريم');
  });
  $('addFrame2Btn')?.addEventListener('click', () => {
    saveCurrentFrameLayers(); addNewFrame(); toast('تمت إضافة فريم');
  });
  $('prevFrameBtn')?.addEventListener('click', () => {
    if(S.activeFrameIndex <= 0) return;
    saveCurrentFrameLayers(); S.activeFrameIndex--; loadFrameLayers();
  });
  $('nextFrameBtn')?.addEventListener('click', () => {
    if(S.activeFrameIndex >= S.frames.length - 1) return;
    saveCurrentFrameLayers(); S.activeFrameIndex++; loadFrameLayers();
  });
  $('playAnimBtn')?.addEventListener('click', () => S.isPlaying ? stopAnim() : playAnim());
  $('dupFrameBtn')?.addEventListener('click', () => {
    saveCurrentFrameLayers();
    const orig = S.frames[S.activeFrameIndex];
    const newFrame = {
      id: Date.now(), duration: orig.duration,
      layers: orig.layers.map(l => {
        const nc = document.createElement('canvas');
        nc.width = S.canvasW; nc.height = S.canvasH;
        nc.getContext('2d').drawImage(l.canvas, 0, 0);
        return { ...l, id: Date.now() + Math.random(), canvas: nc, ctx: nc.getContext('2d') };
      })
    };
    S.frames.splice(S.activeFrameIndex + 1, 0, newFrame);
    S.activeFrameIndex++;
    loadFrameLayers();
    toast('تم تكرار الفريم');
  });
  $('delFrameBtn')?.addEventListener('click', () => {
    if(S.frames.length <= 1) return toast('لا يمكن حذف الفريم الوحيد');
    S.frames.splice(S.activeFrameIndex, 1);
    S.activeFrameIndex = Math.min(S.activeFrameIndex, S.frames.length - 1);
    loadFrameLayers(); toast('تم حذف الفريم');
  });
  $('fpsMini')?.addEventListener('change', e => { S.fps = parseInt(e.target.value) || 12; });
  $('onionSkinToggle')?.addEventListener('change', e => {
    S.onionSkin = e.target.checked;
    octx.clearRect(0, 0, S.canvasW, S.canvasH);
    if(S.onionSkin) renderOnionSkin();
  });
}

function playAnim(){
  if(!S.frames.length) return;
  S.isPlaying = true;
  const btn = $('playAnimBtn');
  if(btn) btn.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor"><rect x="4" y="3" width="4" height="14" rx="1"/><rect x="12" y="3" width="4" height="14" rx="1"/></svg>';
  let fi = S.activeFrameIndex;
  function tick(){
    if(!S.isPlaying) return;
    const frame = S.frames[fi];
    mctx.clearRect(0, 0, S.canvasW, S.canvasH);
    for(let li = frame.layers.length - 1; li >= 0; li--){
      const l = frame.layers[li]; if(!l.visible) continue;
      mctx.globalAlpha = l.opacity; mctx.drawImage(l.canvas, 0, 0);
    }
    mctx.globalAlpha = 1;
    $$('.frame-thumb-item').forEach((item, idx) => item.classList.toggle('active', idx === fi));
    const fc = $('frameCounter'); if(fc) fc.textContent = `${fi + 1} / ${S.frames.length}`;
    fi = (fi + 1) % S.frames.length;
    S.playTimer = setTimeout(tick, frame.duration || (1000 / S.fps));
  }
  tick();
}

function stopAnim(){
  S.isPlaying = false;
  clearTimeout(S.playTimer);
  const btn = $('playAnimBtn');
  if(btn) btn.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor"><polygon points="5,3 18,10 5,17"/></svg>';
  loadFrameLayers();
}

function renderOnionSkin(){
  const prevIdx = S.activeFrameIndex - 1;
  if(prevIdx < 0){ octx.clearRect(0, 0, S.canvasW, S.canvasH); return; }
  const prevFrame = S.frames[prevIdx];
  octx.clearRect(0, 0, S.canvasW, S.canvasH);
  octx.globalAlpha = .25;
  for(let li = prevFrame.layers.length - 1; li >= 0; li--){
    const l = prevFrame.layers[li]; if(!l.visible) continue;
    octx.drawImage(l.canvas, 0, 0);
  }
  octx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────
//  FIRE ANIMATION PROJECT (Built-in)
// ─────────────────────────────────────────────────
function createFireProject(){
  S.frames = []; S.fps = 12;
  for(let f = 0; f < 6; f++){
    const bg = document.createElement('canvas');
    bg.width = S.canvasW; bg.height = S.canvasH;
    const bgctx = bg.getContext('2d');
    bgctx.fillStyle = '#fff'; bgctx.fillRect(0, 0, S.canvasW, S.canvasH);

    const fc = document.createElement('canvas');
    fc.width = S.canvasW; fc.height = S.canvasH;
    drawFireFrame(fc.getContext('2d'), f, S.canvasW, S.canvasH);

    S.frames.push({
      id: Date.now() + f,
      duration: 83,
      layers: [
        { id: Date.now() + f + .1, name: 'خلفية', canvas: bg, ctx: bgctx,
          visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
        { id: Date.now() + f + .2, name: 'نار', canvas: fc, ctx: fc.getContext('2d'),
          visible: true, locked: false, opacity: 1, blendMode: 'source-over' }
      ]
    });
  }
  S.activeFrameIndex = 0;
  loadFrameLayers();
  toast('مشروع النار المتحركة جاهز — اضغط تشغيل ▶');
}

function drawFireFrame(ctx, fi, cw, ch){
  const cx = cw / 2, baseY = ch * .72;
  const yOffsets = [0, -5, 3, -7, 5, -3];
  const wigs = [[0,6,-4,5],[4,-5,6,-3],[0,4,-6,4],[-4,5,-4,6],[2,-3,5,-4],[-2,4,-5,5]];
  const yOff = yOffsets[fi]; const wg = wigs[fi];

  // Base glow
  const glow = ctx.createRadialGradient(cx, baseY, 5, cx, baseY, cw * .2);
  glow.addColorStop(0, 'rgba(255,110,0,.9)');
  glow.addColorStop(.5, 'rgba(255,50,0,.4)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.ellipse(cx, baseY, cw * .18, ch * .13, 0, 0, Math.PI * 2); ctx.fill();

  function drawFlame(ox, oy, h, c1, c2, w2){
    const fg = ctx.createLinearGradient(cx + ox, baseY - h, cx + ox, baseY);
    fg.addColorStop(0, c1); fg.addColorStop(.55, c2); fg.addColorStop(1, 'rgba(255,80,0,.7)');
    ctx.fillStyle = fg; ctx.beginPath();
    ctx.moveTo(cx + ox - w2, baseY + oy);
    ctx.bezierCurveTo(cx + ox - w2 * .7, baseY - h * .35, cx + ox + (wg[0]||0) * 3, baseY - h * .65, cx + ox, baseY - h + yOff);
    ctx.bezierCurveTo(cx + ox + (wg[1]||0) * 3, baseY - h * .65, cx + ox + w2 * .7, baseY - h * .35, cx + ox + w2, baseY + oy);
    ctx.closePath(); ctx.fill();
  }

  ctx.globalAlpha = .95;
  drawFlame(0,   0,  ch*.42, 'rgba(255,255,80,.95)', 'rgba(255,160,0,.85)', 80);
  drawFlame(-38, 4,  ch*.30, 'rgba(255,220,0,.9)',   'rgba(255,80,0,.75)',  60);
  drawFlame(40,  6,  ch*.27, 'rgba(255,200,0,.85)',  'rgba(255,60,0,.7)',   52);
  drawFlame(-14, 2,  ch*.46, 'rgba(255,255,160,.7)', 'rgba(255,200,0,.5)', 40);
  drawFlame(18, -3,  ch*.37, 'rgba(255,230,90,.65)', 'rgba(255,100,0,.5)', 36);
  ctx.globalAlpha = 1;

  // Embers
  for(let e = 0; e < 28; e++){
    const ex = cx + (Math.random() - .5) * cw * .28;
    const ey = baseY - Math.random() * ch * .55 - (fi * 14 % 55);
    ctx.globalAlpha = .35 + Math.random() * .55;
    ctx.fillStyle = `rgb(255,${(100 + Math.random() * 120)|0},0)`;
    ctx.beginPath(); ctx.arc(ex, ey, Math.random() * 3 + .8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────
//  HISTORY
// ─────────────────────────────────────────────────
function saveHistory(){
  const snap = S.layers.map(l => {
    const c = document.createElement('canvas');
    c.width = S.canvasW; c.height = S.canvasH;
    c.getContext('2d').drawImage(l.canvas, 0, 0);
    return { id: l.id, canvas: c };
  });
  S.history.push(snap);
  if(S.history.length > S.MAX_HISTORY) S.history.shift();
  S.redoStack = [];
  updateHistoryBtns();
}

function undo(){
  if(!S.history.length) return toast('لا يوجد ما يمكن التراجع عنه');
  const redoSnap = S.layers.map(l => {
    const c = document.createElement('canvas');
    c.width = S.canvasW; c.height = S.canvasH;
    c.getContext('2d').drawImage(l.canvas, 0, 0);
    return { id: l.id, canvas: c };
  });
  S.redoStack.push(redoSnap);
  const snap = S.history.pop();
  snap.forEach(s => {
    const l = S.layers.find(x => x.id === s.id);
    if(l){ l.ctx.clearRect(0, 0, S.canvasW, S.canvasH); l.ctx.drawImage(s.canvas, 0, 0); }
  });
  composite(); updateHistoryBtns(); toast('تراجع');
}

function redo(){
  if(!S.redoStack.length) return toast('لا يوجد ما يمكن إعادته');
  const hSnap = S.layers.map(l => {
    const c = document.createElement('canvas');
    c.width = S.canvasW; c.height = S.canvasH;
    c.getContext('2d').drawImage(l.canvas, 0, 0);
    return { id: l.id, canvas: c };
  });
  S.history.push(hSnap);
  const snap = S.redoStack.pop();
  snap.forEach(s => {
    const l = S.layers.find(x => x.id === s.id);
    if(l){ l.ctx.clearRect(0, 0, S.canvasW, S.canvasH); l.ctx.drawImage(s.canvas, 0, 0); }
  });
  composite(); updateHistoryBtns(); toast('إعادة');
}

function updateHistoryBtns(){
  const u = $('undoBtn'), r = $('redoBtn');
  if(u) u.disabled = !S.history.length;
  if(r) r.disabled = !S.redoStack.length;
}

// ─────────────────────────────────────────────────
//  TOOL GROUPS
// ─────────────────────────────────────────────────
function setupToolGroups(){
  $$('.tg-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const body = $(hdr.dataset.group); if(!body) return;
      const wasCollapsed = body.classList.contains('collapsed');
      body.classList.toggle('collapsed', !wasCollapsed);
      hdr.classList.toggle('open', wasCollapsed);
    });
    if(hdr.dataset.group === 'brushGroup'){
      hdr.classList.add('open', 'has-active');
      $(hdr.dataset.group)?.classList.remove('collapsed');
    }
  });

  $$('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.tool = btn.dataset.tool;
      $$('.tg-header').forEach(h => h.classList.remove('has-active'));
      const parentBody = btn.closest('.tg-body');
      if(parentBody){
        const hdr = document.querySelector(`.tg-header[data-group="${parentBody.id}"]`);
        if(hdr) hdr.classList.add('has-active');
      }
      updateCursor();
    });
  });
}

function updateCursor(){
  const map = {
    brush:'crosshair', pencil:'crosshair', ink:'crosshair', marker:'crosshair',
    airbrush:'crosshair', watercolor:'crosshair',
    eraser:'cell', 'eraser-soft':'cell', clone:'copy',
    fill:'cell', gradient:'crosshair', eyedropper:'crosshair',
    smudge:'crosshair', 'blur-tool':'crosshair', sharpen:'crosshair',
    'select-rect':'crosshair', 'select-circle':'crosshair',
    lasso:'crosshair', 'magic-wand':'crosshair',
    move:'move', crop:'crosshair',
    line:'crosshair', 'rect-shape':'crosshair', 'circle-shape':'crosshair',
    triangle:'crosshair', star:'crosshair', arrow:'crosshair', bezier:'crosshair',
    text:'text', 'text-path':'text',
    hand:'grab', 'zoom-tool':'zoom-in', 'rotate-canvas':'alias', measure:'crosshair'
  };
  const vp = $('canvasViewport');
  if(vp) vp.style.cursor = map[S.tool] || 'crosshair';
}

// ─────────────────────────────────────────────────
//  BRUSH DRAWING
// ─────────────────────────────────────────────────
function drawBrushAt(lctx, x, y, pressure = 1){
  const sz = S.brushSize * pressure;
  lctx.globalCompositeOperation = S.blendMode;
  lctx.globalAlpha = S.brushOpacity * S.brushFlow * pressure;

  switch(S.brushType){
    case 'round':{
      const g = lctx.createRadialGradient(x, y, 0, x, y, sz / 2);
      g.addColorStop(0, S.fgColor);
      g.addColorStop(S.brushHardness, S.fgColor);
      g.addColorStop(1, S.fgColor + '00');
      lctx.fillStyle = g;
      lctx.beginPath(); lctx.arc(x, y, sz / 2, 0, Math.PI * 2); lctx.fill();
      break;
    }
    case 'soft':{
      const g = lctx.createRadialGradient(x, y, 0, x, y, sz / 2);
      g.addColorStop(0, S.fgColor);
      g.addColorStop(.4, S.fgColor + 'BB');
      g.addColorStop(1, S.fgColor + '00');
      lctx.fillStyle = g;
      lctx.beginPath(); lctx.arc(x, y, sz / 2, 0, Math.PI * 2); lctx.fill();
      break;
    }
    case 'flat':{
      lctx.fillStyle = S.fgColor;
      lctx.beginPath(); lctx.ellipse(x, y, sz / 2, sz / 7, 0, 0, Math.PI * 2); lctx.fill();
      break;
    }
    case 'texture':{
      for(let i = 0; i < 10; i++){
        const rx = x + (Math.random() - .5) * sz, ry = y + (Math.random() - .5) * sz;
        lctx.fillStyle = S.fgColor;
        lctx.beginPath(); lctx.arc(rx, ry, sz / 10 + Math.random() * sz / 8, 0, Math.PI * 2); lctx.fill();
      }
      break;
    }
    case 'pencil-b':
    case 'pencil':{
      for(let i = 0; i < 5; i++){
        const rx = x + (Math.random() - .5) * sz * .5, ry = y + (Math.random() - .5) * sz * .5;
        lctx.strokeStyle = S.fgColor; lctx.lineWidth = .7;
        lctx.beginPath(); lctx.arc(rx, ry, sz / 12, 0, Math.PI * 2); lctx.stroke();
      }
      break;
    }
    case 'charcoal':{
      lctx.globalAlpha *= .55;
      for(let i = 0; i < 18; i++){
        const rx = x + (Math.random() - .5) * sz * 1.3, ry = y + (Math.random() - .5) * sz * .8;
        lctx.fillStyle = S.fgColor;
        lctx.beginPath(); lctx.arc(rx, ry, Math.random() * sz * .15 + .8, 0, Math.PI * 2); lctx.fill();
      }
      break;
    }
    case 'chalk':{
      for(let i = 0; i < 9; i++){
        const rx = x + (Math.random() - .5) * sz, ry = y + (Math.random() - .5) * sz;
        lctx.fillStyle = S.fgColor;
        lctx.fillRect(rx, ry, Math.random() * sz * .28 + 1, Math.random() * sz * .28 + 1);
      }
      break;
    }
    case 'splatter':{
      for(let i = 0; i < 22; i++){
        const ang = Math.random() * Math.PI * 2, r = Math.random() * sz;
        lctx.globalAlpha = S.brushOpacity * (Math.random() * .55 + .18);
        lctx.fillStyle = S.fgColor;
        lctx.beginPath(); lctx.arc(x + Math.cos(ang) * r, y + Math.sin(ang) * r, Math.random() * sz * .1 + .4, 0, Math.PI * 2); lctx.fill();
      }
      break;
    }
    case 'ink': case 'ink2':{
      lctx.fillStyle = S.fgColor;
      lctx.beginPath(); lctx.arc(x, y, sz * S.brushHardness * .6, 0, Math.PI * 2); lctx.fill();
      break;
    }
    case 'marker':{
      lctx.globalAlpha = Math.min(S.brushOpacity * .45, .28);
      lctx.fillStyle = S.fgColor;
      lctx.beginPath(); lctx.ellipse(x, y, sz * .85, sz * .5, 0, 0, Math.PI * 2); lctx.fill();
      break;
    }
    case 'airbrush':{
      for(let i = 0; i < 45; i++){
        const ang = Math.random() * Math.PI * 2, r = Math.random() * sz;
        const f = 1 - r / sz;
        lctx.globalAlpha = S.brushOpacity * .13 * f;
        lctx.fillStyle = S.fgColor;
        lctx.beginPath(); lctx.arc(x + Math.cos(ang) * r, y + Math.sin(ang) * r, .85, 0, Math.PI * 2); lctx.fill();
      }
      break;
    }
    case 'watercolor':{
      const g = lctx.createRadialGradient(x, y, 0, x, y, sz * .75);
      g.addColorStop(0, S.fgColor + '55'); g.addColorStop(.5, S.fgColor + '33'); g.addColorStop(1, S.fgColor + '00');
      lctx.fillStyle = g;
      lctx.beginPath(); lctx.arc(x, y, sz * .75, 0, Math.PI * 2); lctx.fill();
      break;
    }
    case 'fan':{
      for(let a = 0; a < 9; a++){
        const ang = (a / 9) * Math.PI * 2;
        lctx.strokeStyle = S.fgColor; lctx.lineWidth = sz * .07;
        lctx.beginPath(); lctx.moveTo(x, y); lctx.lineTo(x + Math.cos(ang) * sz * .65, y + Math.sin(ang) * sz * .65); lctx.stroke();
      }
      break;
    }
    case 'hair':{
      for(let h = 0; h < 7; h++){
        const ox = (h - .5) * sz * .18;
        lctx.strokeStyle = S.fgColor; lctx.lineWidth = .55;
        lctx.beginPath(); lctx.moveTo(x + ox, y); lctx.lineTo(x + ox + (Math.random() - .5) * 3, y + 1); lctx.stroke();
      }
      break;
    }
    case 'dry-brush':{
      for(let i = 0; i < 6; i++){
        const ox = (Math.random() - .5) * sz * .6;
        lctx.strokeStyle = S.fgColor; lctx.lineWidth = Math.random() * 2 + .5;
        lctx.globalAlpha = S.brushOpacity * (Math.random() * .5 + .3);
        lctx.beginPath(); lctx.moveTo(x + ox, y - sz * .2); lctx.lineTo(x + ox, y + sz * .2); lctx.stroke();
      }
      break;
    }
    case 'thick':{
      lctx.fillStyle = S.fgColor;
      lctx.beginPath(); lctx.arc(x, y, sz * .6, 0, Math.PI * 2); lctx.fill();
      break;
    }
    default:{
      const g = lctx.createRadialGradient(x, y, 0, x, y, sz / 2);
      g.addColorStop(0, S.fgColor); g.addColorStop(1, S.fgColor + '00');
      lctx.fillStyle = g;
      lctx.beginPath(); lctx.arc(x, y, sz / 2, 0, Math.PI * 2); lctx.fill();
    }
  }
  lctx.globalAlpha = 1;
  lctx.globalCompositeOperation = 'source-over';
}

function interpolate(lctx, x1, y1, x2, y2){
  const d = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.floor(d / (S.brushSize * .22)));
  for(let i = 0; i <= steps; i++){
    const t = i / steps;
    drawBrushAt(lctx, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
  }
}

// ─────────────────────────────────────────────────
//  CANVAS EVENTS
// ─────────────────────────────────────────────────
function getCanvasPos(e){
  const rect = mainCanvas.getBoundingClientRect();
  const sx = S.canvasW / rect.width, sy = S.canvasH / rect.height;
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
}

function setupCanvasEvents(){
  const vp = $('canvasViewport');
  vp.addEventListener('mousedown',  onDown);
  vp.addEventListener('mousemove',  onMove);
  vp.addEventListener('mouseup',    onUp);
  vp.addEventListener('mouseleave', onUp);
  vp.addEventListener('touchstart', onDown, { passive: false });
  vp.addEventListener('touchmove',  onMove, { passive: false });
  vp.addEventListener('touchend',   onUp);
  vp.addEventListener('wheel',      onWheel, { passive: false });
  vp.addEventListener('mousemove', e => {
    const p = getCanvasPos(e);
    const ex = $('cursorX'), ey = $('cursorY');
    if(ex) ex.textContent = Math.round(p.x);
    if(ey) ey.textContent = Math.round(p.y);
  });
}

const PAINT_TOOLS = ['brush','pencil','pencil-b','ink','ink2','marker','airbrush',
  'watercolor','charcoal','chalk','splatter','fan','hair','dry-brush','thick'];
const SHAPE_TOOLS = ['line','rect-shape','circle-shape','triangle','star','arrow','bezier'];

function onDown(e){
  e.preventDefault();
  const pos = getCanvasPos(e);
  const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

  if(S.spaceHeld || S.tool === 'hand'){
    S.isPanning = true; S.lastX = clientX; S.lastY = clientY;
    $('canvasViewport').style.cursor = 'grabbing'; return;
  }
  if(S.tool === 'eyedropper'){ pickColor(pos.x, pos.y); return; }
  if(S.tool === 'fill'){
    saveHistory(); floodFill(Math.round(pos.x), Math.round(pos.y), S.fgColor); composite(); return;
  }
  if(S.tool === 'gradient'){ saveHistory(); drawGradient(pos.x, pos.y); composite(); return; }
  if(S.tool === 'text' || S.tool === 'text-path'){ showTextInput(pos.x, pos.y); return; }
  if(S.tool === 'zoom-tool'){ S.zoom = Math.min(32, S.zoom * 1.3); applyTransform(); updateZoomLabel(); return; }

  const l = getActiveLayer();
  if(l && l.locked){ toast('الطبقة مقفلة'); return; }

  S.isDrawing = true;
  S.lastX = pos.x; S.lastY = pos.y;
  S.drawing.startX = pos.x; S.drawing.startY = pos.y;
  saveHistory();
  const lctx = getActiveLCtx();

  if(PAINT_TOOLS.includes(S.tool)){
    drawBrushAt(lctx, pos.x, pos.y); composite();
  } else if(S.tool === 'eraser' || S.tool === 'eraser-soft'){
    erase(lctx, pos.x, pos.y); composite();
  }
}

function onMove(e){
  e.preventDefault();
  const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
  const pos = getCanvasPos(e);

  // Brush cursor preview ring
  octx.clearRect(0, 0, S.canvasW, S.canvasH);
  if(S.isAnimMode && S.onionSkin) renderOnionSkin();
  if(!S.isDrawing || PAINT_TOOLS.includes(S.tool) || S.tool === 'eraser' || S.tool === 'eraser-soft'){
    const sz = S.brushSize;
    octx.globalAlpha = .45;
    octx.strokeStyle = S.tool.includes('eraser') ? '#ffffff' : S.fgColor;
    octx.lineWidth = 1.2;
    octx.beginPath(); octx.arc(pos.x, pos.y, sz / 2, 0, Math.PI * 2); octx.stroke();
    octx.globalAlpha = 1;
  }

  if(S.isPanning){
    S.panX += clientX - S.lastX; S.panY += clientY - S.lastY;
    S.lastX = clientX; S.lastY = clientY;
    applyTransform(); return;
  }
  if(!S.isDrawing) return;

  const l = getActiveLayer();
  if(l && l.locked) return;
  const lctx = getActiveLCtx();

  if(PAINT_TOOLS.includes(S.tool)){
    interpolate(lctx, S.lastX, S.lastY, pos.x, pos.y); composite();
  } else if(S.tool === 'eraser' || S.tool === 'eraser-soft'){
    eraseStroke(lctx, S.lastX, S.lastY, pos.x, pos.y); composite();
  } else if(S.tool === 'smudge'){
    smudgeAt(lctx, pos.x, pos.y); composite();
  } else if(S.tool === 'blur-tool'){
    blurAt(lctx, pos.x, pos.y); composite();
  } else if([...SHAPE_TOOLS, 'select-rect', 'select-circle'].includes(S.tool)){
    octx.clearRect(0, 0, S.canvasW, S.canvasH);
    if(S.isAnimMode && S.onionSkin) renderOnionSkin();
    octx.globalAlpha = .9;
    octx.strokeStyle = S.fgColor; octx.fillStyle = S.fgColor;
    octx.lineWidth = Math.max(1, S.brushSize * .5);
    octx.lineCap = 'round'; octx.lineJoin = 'round';
    drawShapePreview(octx, S.tool, S.drawing.startX, S.drawing.startY, pos.x, pos.y);
    octx.globalAlpha = 1;
  }
  S.lastX = pos.x; S.lastY = pos.y;
}

function onUp(e){
  if(S.isPanning){
    S.isPanning = false;
    $('canvasViewport').style.cursor = S.spaceHeld ? 'grab' : 'crosshair'; return;
  }
  if(!S.isDrawing) return;
  S.isDrawing = false;
  octx.clearRect(0, 0, S.canvasW, S.canvasH);
  if(S.isAnimMode && S.onionSkin) renderOnionSkin();

  const l = getActiveLayer();
  if(l && l.locked) return;
  const lctx = getActiveLCtx();
  const endPos = (e.type === 'touchend')
    ? { x: S.lastX, y: S.lastY }
    : (e.clientX ? getCanvasPos(e) : { x: S.lastX, y: S.lastY });

  if(SHAPE_TOOLS.includes(S.tool)){
    lctx.globalCompositeOperation = S.blendMode;
    lctx.globalAlpha = S.brushOpacity;
    lctx.strokeStyle = S.fgColor; lctx.fillStyle = S.fgColor;
    lctx.lineWidth = Math.max(1, S.brushSize * .5);
    lctx.lineCap = 'round'; lctx.lineJoin = 'round';
    drawShapePreview(lctx, S.tool, S.drawing.startX, S.drawing.startY, endPos.x, endPos.y);
    lctx.globalAlpha = 1; lctx.globalCompositeOperation = 'source-over';
    composite();
  }
  if(S.isAnimMode){ saveCurrentFrameLayers(); renderFramesStrip(); }
}

function onWheel(e){
  e.preventDefault();
  const delta = e.deltaY > 0 ? .87 : 1.15;
  const rect = $('canvasViewport').getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  const old = S.zoom;
  S.zoom = Math.min(32, Math.max(.05, S.zoom * delta));
  S.panX = mx - (mx - S.panX) * (S.zoom / old);
  S.panY = my - (my - S.panY) * (S.zoom / old);
  applyTransform(); updateZoomLabel();
}

// ─────────────────────────────────────────────────
//  SHAPES
// ─────────────────────────────────────────────────
function drawShapePreview(ctx, tool, x1, y1, x2, y2){
  ctx.beginPath();
  switch(tool){
    case 'line':
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); break;
    case 'rect-shape':
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1); break;
    case 'circle-shape':{
      const rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
      ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI * 2);
      ctx.stroke(); break;
    }
    case 'triangle':
      ctx.moveTo((x1 + x2) / 2, y1); ctx.lineTo(x2, y2); ctx.lineTo(x1, y2);
      ctx.closePath(); ctx.stroke(); break;
    case 'star':{
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const r = Math.max(1, Math.hypot(x2 - x1, y2 - y1) / 2);
      for(let i = 0; i < 10; i++){
        const ang = i * Math.PI / 5 - Math.PI / 2, ri = i % 2 === 0 ? r : r * .42;
        i === 0 ? ctx.moveTo(cx + ri * Math.cos(ang), cy + ri * Math.sin(ang))
                : ctx.lineTo(cx + ri * Math.cos(ang), cy + ri * Math.sin(ang));
      }
      ctx.closePath(); ctx.stroke(); break;
    }
    case 'arrow':{
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      if(len < 1) return;
      const ux = dx / len, uy = dy / len, hw = Math.max(8, S.brushSize * 1.1);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - ux * hw - uy * hw * .5, y2 - uy * hw + ux * hw * .5);
      ctx.lineTo(x2 - ux * hw + uy * hw * .5, y2 - uy * hw - ux * hw * .5);
      ctx.closePath(); ctx.fill(); break;
    }
    case 'bezier':{
      ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, y1, x2, y2); ctx.stroke(); break;
    }
    case 'select-rect':
      ctx.setLineDash([6, 3]); ctx.strokeRect(x1, y1, x2 - x1, y2 - y1); ctx.setLineDash([]); break;
    case 'select-circle':{
      const rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
      ctx.setLineDash([6, 3]);
      ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI * 2);
      ctx.stroke(); ctx.setLineDash([]); break;
    }
  }
}

// ─────────────────────────────────────────────────
//  ERASER
// ─────────────────────────────────────────────────
function erase(lctx, x, y){
  const sz = S.tool === 'eraser-soft' ? S.brushSize * 1.5 : S.brushSize;
  if(S.tool === 'eraser-soft'){
    const g = lctx.createRadialGradient(x, y, 0, x, y, sz / 2);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.globalCompositeOperation = 'destination-out';
    lctx.fillStyle = g; lctx.beginPath(); lctx.arc(x, y, sz / 2, 0, Math.PI * 2); lctx.fill();
  } else {
    lctx.globalCompositeOperation = 'destination-out';
    lctx.globalAlpha = S.brushOpacity;
    lctx.beginPath(); lctx.arc(x, y, sz / 2, 0, Math.PI * 2); lctx.fill();
  }
  lctx.globalCompositeOperation = 'source-over'; lctx.globalAlpha = 1;
}

function eraseStroke(lctx, x1, y1, x2, y2){
  lctx.globalCompositeOperation = 'destination-out';
  lctx.globalAlpha = S.brushOpacity;
  lctx.lineWidth = S.brushSize; lctx.lineCap = 'round';
  lctx.beginPath(); lctx.moveTo(x1, y1); lctx.lineTo(x2, y2); lctx.stroke();
  lctx.globalCompositeOperation = 'source-over'; lctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────
//  SMUDGE / BLUR
// ─────────────────────────────────────────────────
function smudgeAt(lctx, x, y){
  const sz = Math.max(2, S.brushSize * .6) | 0;
  try{
    const imgD = lctx.getImageData(Math.max(0, x - sz), Math.max(0, y - sz), sz * 2, sz * 2);
    lctx.putImageData(imgD, Math.max(0, x - sz) + 2, Math.max(0, y - sz) + 1);
  } catch(e){}
}
function blurAt(lctx, x, y){
  const sz = Math.max(2, S.brushSize) | 0;
  try{
    lctx.filter = `blur(${Math.max(1, sz * .1)}px)`;
    const imgD = lctx.getImageData(Math.max(0, x - sz), Math.max(0, y - sz), sz * 2, sz * 2);
    lctx.putImageData(imgD, Math.max(0, x - sz), Math.max(0, y - sz));
    lctx.filter = 'none';
  } catch(e){ lctx.filter = 'none'; }
}

// ─────────────────────────────────────────────────
//  FLOOD FILL
// ─────────────────────────────────────────────────
function floodFill(sx, sy, hexColor){
  if(sx < 0 || sy < 0 || sx >= S.canvasW || sy >= S.canvasH) return;
  const lctx = getActiveLCtx();
  const imgData = lctx.getImageData(0, 0, S.canvasW, S.canvasH);
  const d = imgData.data, w = S.canvasW;
  const idx = (y, x) => (y * w + x) * 4;
  const sr = d[idx(sy,sx)], sg = d[idx(sy,sx)+1], sb = d[idx(sy,sx)+2], sa = d[idx(sy,sx)+3];
  const fr = parseInt(hexColor.slice(1,3),16), fg = parseInt(hexColor.slice(3,5),16),
        fb = parseInt(hexColor.slice(5,7),16), fa = 255;
  if(sr===fr && sg===fg && sb===fb && sa===fa) return;
  const tol = 35;
  const match = i =>
    Math.abs(d[i]-sr)<=tol && Math.abs(d[i+1]-sg)<=tol &&
    Math.abs(d[i+2]-sb)<=tol && Math.abs(d[i+3]-sa)<=tol;
  const vis = new Uint8Array(w * S.canvasH);
  const stack = [[sx, sy]];
  while(stack.length){
    const [x, y] = stack.pop();
    if(x < 0 || x >= w || y < 0 || y >= S.canvasH) continue;
    if(vis[y * w + x]) continue;
    const i = idx(y, x); if(!match(i)) continue;
    vis[y * w + x] = 1;
    d[i]=fr; d[i+1]=fg; d[i+2]=fb; d[i+3]=fa;
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  lctx.putImageData(imgData, 0, 0);
}

// ─────────────────────────────────────────────────
//  GRADIENT
// ─────────────────────────────────────────────────
function drawGradient(x, y){
  const lctx = getActiveLCtx();
  const g = lctx.createRadialGradient(x, y, 0, x, y, Math.max(S.canvasW, S.canvasH) * .65);
  g.addColorStop(0, S.fgColor); g.addColorStop(1, S.bgColor);
  lctx.globalAlpha = S.brushOpacity;
  lctx.fillStyle = g; lctx.fillRect(0, 0, S.canvasW, S.canvasH);
  lctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────
//  COLOR
// ─────────────────────────────────────────────────
function pickColor(x, y){
  const xx = Math.round(Math.max(0, Math.min(x, S.canvasW - 1)));
  const yy = Math.round(Math.max(0, Math.min(y, S.canvasH - 1)));
  const imgD = mctx.getImageData(xx, yy, 1, 1).data;
  const hex = '#' + [imgD[0],imgD[1],imgD[2]].map(v => v.toString(16).padStart(2,'0')).join('');
  setFgColor(hex); toast('اللون: ' + hex.toUpperCase());
}

function setFgColor(hex){
  S.fgColor = hex;
  const fs = $('fgSwatch'); if(fs) fs.style.background = hex;
  const hi = $('hexInput'); if(hi) hi.value = hex.replace('#','').toUpperCase();
  const cp = $('colorPreviewDot'); if(cp) cp.style.background = hex;
  updateRGBInputs(hex);
}

function hexToRgb(hex){
  return { r:parseInt(hex.slice(1,3),16), g:parseInt(hex.slice(3,5),16), b:parseInt(hex.slice(5,7),16) };
}
function rgbToHex(r, g, b){
  return '#' + [r,g,b].map(v => Math.min(255,Math.max(0,v)).toString(16).padStart(2,'0')).join('');
}
function updateRGBInputs(hex){
  const {r,g,b} = hexToRgb(hex);
  const ri=$('rInput'),gi=$('gInput'),bi=$('bInput');
  if(ri) ri.value=r; if(gi) gi.value=g; if(bi) bi.value=b;
}

// ─────────────────────────────────────────────────
//  TEXT TOOL
// ─────────────────────────────────────────────────
function showTextInput(cx, cy){
  const ov = $('textInputOverlay');
  ov.classList.remove('hidden');
  const rect = mainCanvas.getBoundingClientRect();
  const sx = rect.left + cx * (rect.width / S.canvasW);
  const sy = rect.top  + cy * (rect.height / S.canvasH);
  ov.style.left = Math.min(sx, window.innerWidth  - 245) + 'px';
  ov.style.top  = Math.min(sy, window.innerHeight - 170) + 'px';
  $('textInput').value = ''; $('textInput').focus();

  $('confirmTextBtn').onclick = () => {
    const txt = $('textInput').value.trim();
    if(txt){
      saveHistory();
      const lctx = getActiveLCtx();
      const font = $('textFont')?.value || 'Cairo';
      const size = parseInt($('textFontSize')?.value) || 36;
      lctx.globalAlpha = S.brushOpacity;
      lctx.fillStyle = S.fgColor;
      lctx.font = `${size}px "${font}",Tajawal,sans-serif`;
      lctx.textAlign = 'right';
      lctx.direction = 'rtl';
      lctx.fillText(txt, cx, cy);
      lctx.globalAlpha = 1;
      composite(); toast('تمت إضافة النص');
    }
    ov.classList.add('hidden');
  };
  $('cancelTextBtn').onclick = () => ov.classList.add('hidden');
}

// ─────────────────────────────────────────────────
//  TRANSFORM / ZOOM
// ─────────────────────────────────────────────────
function applyTransform(){
  $('canvasWrapper').style.transform = `translate(${S.panX}px,${S.panY}px) scale(${S.zoom})`;
}
function fitCanvas(){
  const vp = $('canvasViewport').getBoundingClientRect();
  const sx = (vp.width - 60) / S.canvasW, sy = (vp.height - 60) / S.canvasH;
  S.zoom = Math.min(sx, sy, 1);
  S.panX = (vp.width  - S.canvasW * S.zoom) / 2;
  S.panY = (vp.height - S.canvasH * S.zoom) / 2;
  applyTransform(); updateZoomLabel();
}
function updateZoomLabel(){
  const el = $('zoomLabel'); if(el) el.textContent = Math.round(S.zoom * 100) + '%';
}

// ─────────────────────────────────────────────────
//  BRUSH PANEL
// ─────────────────────────────────────────────────
function setupBrushPanel(){
  $$('.brush-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.brush-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $('safwanBrushes').classList.toggle('hidden', tab.dataset.btab !== 'safwan');
      $('allBrushes').classList.toggle('hidden',    tab.dataset.btab !== 'all');
    });
  });

  $$('.brush-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.brush-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.brushType = btn.dataset.brush;
      const brushTool = document.querySelector('.tool-btn[data-tool="brush"]');
      if(brushTool) brushTool.click();
    });
  });

  [
    ['brushSize','brushSizeVal',1,'brushSize'],
    ['brushOpacity','brushOpacityVal',.01,'brushOpacity'],
    ['brushFlow','brushFlowVal',.01,'brushFlow'],
    ['brushHardness','brushHardnessVal',.01,'brushHardness'],
  ].forEach(([id,vid,scale,key]) => {
    const el = $(id); if(!el) return;
    el.addEventListener('input', () => {
      const v = $(vid); if(v) v.textContent = el.value;
      S[key] = parseFloat(el.value) * scale;
    });
  });

  $('blendMode')?.addEventListener('change', e => { S.blendMode = e.target.value; });

  $$('.panel-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const body = $(hdr.dataset.target); if(!body) return;
      const hidden = body.style.display === 'none';
      body.style.display = hidden ? '' : 'none';
      hdr.querySelector('.panel-toggle')?.classList.toggle('collapsed', !hidden);
    });
  });
}

// ─────────────────────────────────────────────────
//  COLOR PANEL
// ─────────────────────────────────────────────────
function setupColorPanel(){
  drawColorWheel();

  $('colorWheel')?.addEventListener('click', e => {
    const rect = $('colorWheel').getBoundingClientRect();
    const x = ((e.clientX - rect.left) * (190 / rect.width)) | 0;
    const y = ((e.clientY - rect.top)  * (190 / rect.height)) | 0;
    const imgD = $('colorWheel').getContext('2d').getImageData(x, y, 1, 1).data;
    if(imgD[3] > 10) setFgColor(rgbToHex(imgD[0], imgD[1], imgD[2]));
  });

  $('hexInput')?.addEventListener('input', e => {
    const v = e.target.value.replace(/[^0-9a-fA-F]/g,'');
    e.target.value = v;
    if(v.length === 6) setFgColor('#' + v);
  });

  ['rInput','gInput','bInput'].forEach(id => {
    $(id)?.addEventListener('input', () => {
      setFgColor(rgbToHex(
        parseInt($('rInput').value)||0,
        parseInt($('gInput').value)||0,
        parseInt($('bInput').value)||0
      ));
    });
  });

  $('fgSwatch')?.addEventListener('click', () => { $('colorPicker').value = S.fgColor; $('colorPicker').click(); });
  $('bgSwatch')?.addEventListener('click', () => {
    const tmp = document.createElement('input'); tmp.type = 'color'; tmp.value = S.bgColor;
    tmp.oninput = e => { S.bgColor = e.target.value; $('bgSwatch').style.background = S.bgColor; };
    tmp.click();
  });
  $('colorPicker')?.addEventListener('input',  e => setFgColor(e.target.value));
  $('openColorBtn')?.addEventListener('click', () => { $('colorPicker').value = S.fgColor; $('colorPicker').click(); });
  $('swapColorsBtn')?.addEventListener('click', () => {
    const tmp = S.fgColor; S.fgColor = S.bgColor; S.bgColor = tmp;
    $('fgSwatch').style.background = S.fgColor; $('bgSwatch').style.background = S.bgColor;
    setFgColor(S.fgColor);
  });

  setFgColor(S.fgColor);
  const bs = $('bgSwatch'); if(bs) bs.style.background = S.bgColor;
}

function drawColorWheel(){
  const wh = $('colorWheel'); if(!wh) return;
  const wctx = wh.getContext('2d');
  const size = 190, cx = size/2, cy = size/2, r = size/2 - 2;
  for(let angle = 0; angle < 360; angle++){
    const sa = (angle - 1) * Math.PI / 180, ea = (angle + 1) * Math.PI / 180;
    const grad = wctx.createRadialGradient(cx,cy,0,cx,cy,r);
    grad.addColorStop(0, 'white');
    grad.addColorStop(.5, `hsl(${angle},100%,50%)`);
    grad.addColorStop(1, 'black');
    wctx.beginPath(); wctx.moveTo(cx,cy); wctx.arc(cx,cy,r,sa,ea); wctx.closePath();
    wctx.fillStyle = grad; wctx.fill();
  }
  wctx.globalCompositeOperation = 'destination-in';
  wctx.beginPath(); wctx.arc(cx,cy,r,0,Math.PI*2);
  wctx.fillStyle = 'black'; wctx.fill();
  wctx.globalCompositeOperation = 'source-over';
}

// ─────────────────────────────────────────────────
//  PALETTE — 1200+ COLORS
// ─────────────────────────────────────────────────
function buildPalette(){
  const pg = $('paletteGrid'); if(!pg) return;
  pg.innerHTML = '';
  generateColors().forEach(hex => {
    const d = document.createElement('div');
    d.className = 'palette-color'; d.style.background = hex; d.title = hex.toUpperCase();
    d.addEventListener('click', () => setFgColor(hex));
    pg.appendChild(d);
  });
}

function generateColors(){
  const cols = [];
  // Grays
  for(let i = 0; i <= 255; i += 17) cols.push(rgbToHex(i,i,i));
  // Warm grays
  for(let i = 0; i < 8; i++) cols.push(rgbToHex(180+i*9,168+i*8,158+i*8));
  // Cool grays
  for(let i = 0; i < 8; i++) cols.push(rgbToHex(155+i*8,162+i*8,175+i*9));
  // Full spectrum — 36 hues × 6 lightness levels
  for(let h = 0; h < 360; h += 10)
    for(let l = 15; l <= 85; l += 14)
      cols.push(hslToHex(h, 90, l));
  // Skin tones — broad range
  ['#FFDBB4','#F5CBA7','#EAAD7A','#D4956A','#C4835A','#A06040','#7D4E30','#5C3420',
   '#FFF0E0','#FFE0C0','#FFD0A0','#FFBF80','#F0A060','#D08040','#A06020','#704010',
   '#FFE8D5','#F5D5B5','#E8C090','#D4A870','#C09050','#A07030','#805020','#603010',
   '#F8D5C2','#EDB99A','#D49E7A','#B87D57','#9C6140','#7A4A2F','#5C3520','#3F2210'].forEach(c=>cols.push(c));
  // Neon
  ['#FF0080','#FF00FF','#8000FF','#0040FF','#00FFFF','#00FF80','#80FF00','#FFFF00','#FF8000','#FF4000',
   '#FF007F','#7F00FF','#00FF7F','#007FFF','#FF7F00'].forEach(c=>cols.push(c));
  // Pastels
  for(let h = 0; h < 360; h += 24) cols.push(hslToHex(h, 60, 82));
  // Jewel tones
  for(let h = 0; h < 360; h += 24) cols.push(hslToHex(h, 70, 25));
  // Brand / UI
  ['#FF6B35','#F7C59F','#EFEFD0','#FF9A76','#FFB347','#FF6B6B','#FF4500','#C0392B',
   '#E74C3C','#E67E22','#F1C40F','#2ECC71','#1ABC9C','#3498DB','#9B59B6','#34495E',
   '#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#03A9F4','#00BCD4','#009688',
   '#4CAF50','#8BC34A','#CDDC39','#FFEB3B','#FFC107','#FF9800','#FF5722','#795548'].forEach(c=>cols.push(c));
  // Earth tones
  for(let h = 15; h <= 50; h += 5)
    for(let s = 30; s <= 70; s += 20) cols.push(hslToHex(h, s, 35));
  // Blues deep
  for(let h = 195; h <= 255; h += 7)
    for(let l = 22; l <= 72; l += 17) cols.push(hslToHex(h, 78, l));
  // Reds
  for(let h = 0; h <= 18; h += 4)
    for(let l = 28; l <= 70; l += 14) cols.push(hslToHex(h, 85, l));
  // Greens
  for(let h = 90; h <= 160; h += 7)
    for(let l = 22; l <= 68; l += 18) cols.push(hslToHex(h, 65, l));
  // Purples
  for(let h = 260; h <= 320; h += 9)
    for(let l = 22; l <= 68; l += 18) cols.push(hslToHex(h, 65, l));
  return [...new Set(cols)].slice(0, 1200);
}

function hslToHex(h, s, l){
  h = h % 360; s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * c).toString(16).padStart(2,'0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ─────────────────────────────────────────────────
//  LAYERS PANEL
// ─────────────────────────────────────────────────
function setupLayersPanel(){
  $('addLayerBtn')?.addEventListener('click', () => {
    S.layers.unshift(createLayer()); S.activeLayerIndex = 0;
    renderLayersList(); composite(); toast('تمت إضافة طبقة');
  });
  $('duplicateLayerBtn')?.addEventListener('click', () => {
    const al = getActiveLayer(); if(!al) return;
    const nc = document.createElement('canvas'); nc.width = S.canvasW; nc.height = S.canvasH;
    nc.getContext('2d').drawImage(al.canvas, 0, 0);
    const nl = { ...al, id:Date.now(), name: al.name + ' (نسخة)', canvas: nc, ctx: nc.getContext('2d') };
    S.layers.splice(S.activeLayerIndex, 0, nl);
    renderLayersList(); composite(); toast('تم تكرار الطبقة');
  });
  $('mergeLayersBtn')?.addEventListener('click', () => {
    if(S.layers.length < 2) return toast('تحتاج طبقتين على الأقل');
    saveHistory();
    const mc = document.createElement('canvas'); mc.width = S.canvasW; mc.height = S.canvasH;
    const mc2 = mc.getContext('2d');
    for(let i = S.layers.length - 1; i >= 0; i--){
      const l = S.layers[i]; if(!l.visible) continue;
      mc2.globalAlpha = l.opacity; mc2.globalCompositeOperation = l.blendMode;
      mc2.drawImage(l.canvas, 0, 0);
    }
    mc2.globalAlpha = 1; mc2.globalCompositeOperation = 'source-over';
    S.layers = [{ id:Date.now(), name:'طبقة مدمجة', canvas:mc, ctx:mc2, visible:true, locked:false, opacity:1, blendMode:'source-over' }];
    S.activeLayerIndex = 0;
    renderLayersList(); composite(); toast('تم دمج الطبقات');
  });
  $('moveLayerUpBtn')?.addEventListener('click', () => {
    if(S.activeLayerIndex <= 0) return;
    [S.layers[S.activeLayerIndex], S.layers[S.activeLayerIndex-1]] =
    [S.layers[S.activeLayerIndex-1], S.layers[S.activeLayerIndex]];
    S.activeLayerIndex--; renderLayersList(); composite();
  });
  $('moveLayerDownBtn')?.addEventListener('click', () => {
    if(S.activeLayerIndex >= S.layers.length - 1) return;
    [S.layers[S.activeLayerIndex], S.layers[S.activeLayerIndex+1]] =
    [S.layers[S.activeLayerIndex+1], S.layers[S.activeLayerIndex]];
    S.activeLayerIndex++; renderLayersList(); composite();
  });
  $('deleteLayerBtn')?.addEventListener('click', () => {
    if(S.layers.length === 1) return toast('لا يمكن حذف الطبقة الوحيدة');
    S.layers.splice(S.activeLayerIndex, 1);
    S.activeLayerIndex = Math.min(S.activeLayerIndex, S.layers.length - 1);
    renderLayersList(); composite(); toast('تم حذف الطبقة');
  });
}

function renderLayersList(){
  const list = $('layersList'); if(!list) return;
  list.innerHTML = '';
  S.layers.forEach((layer, i) => {
    const item = document.createElement('div');
    item.className = 'layer-item' + (i === S.activeLayerIndex ? ' active' : '');

    // Thumb
    const thumb = document.createElement('div'); thumb.className = 'layer-thumb';
    const tc = document.createElement('canvas'); tc.width = 64; tc.height = 48;
    tc.getContext('2d').drawImage(layer.canvas, 0, 0, 64, 48);
    thumb.appendChild(tc);

    // Name + opacity
    const nw = document.createElement('div'); nw.className = 'layer-name-wrap';
    nw.innerHTML = `<div class="layer-name">${layer.name}</div><div class="layer-opacity-small">${Math.round(layer.opacity*100)}%</div>`;
    nw.addEventListener('dblclick', e => {
      e.stopPropagation();
      const v = prompt('شفافية الطبقة (0-100):', Math.round(layer.opacity * 100));
      if(v !== null){
        layer.opacity = Math.min(1, Math.max(0, parseInt(v) / 100));
        composite(); renderLayersList();
      }
    });

    // Controls
    const ctrls = document.createElement('div'); ctrls.className = 'layer-controls';

    const vBtn = document.createElement('button');
    vBtn.className = 'layer-ctrl-btn' + (layer.visible ? ' active' : '');
    vBtn.title = layer.visible ? 'إخفاء' : 'إظهار';
    vBtn.innerHTML = layer.visible
      ? `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2.5"/></svg>`
      : `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="2" y1="2" x2="14" y2="14"/><path d="M6 4A5 5 0 0114 10M3 6A7 7 0 002 8s2.5 5 7 5a6 6 0 003.3-.9"/></svg>`;
    vBtn.addEventListener('click', e => {
      e.stopPropagation(); layer.visible = !layer.visible; composite(); renderLayersList();
    });

    const lBtn = document.createElement('button');
    lBtn.className = 'layer-ctrl-btn' + (layer.locked ? ' locked' : '');
    lBtn.title = layer.locked ? 'فك القفل' : 'قفل';
    lBtn.innerHTML = layer.locked
      ? `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>`
      : `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5c0-2 1-3 3-3"/></svg>`;
    lBtn.addEventListener('click', e => {
      e.stopPropagation(); layer.locked = !layer.locked; renderLayersList();
      toast(layer.locked ? 'تم قفل الطبقة' : 'فك قفل الطبقة');
    });

    ctrls.appendChild(vBtn); ctrls.appendChild(lBtn);
    item.appendChild(thumb); item.appendChild(nw); item.appendChild(ctrls);
    item.addEventListener('click', () => { S.activeLayerIndex = i; renderLayersList(); });
    list.appendChild(item);
  });
}

// ─────────────────────────────────────────────────
//  TOP BAR
// ─────────────────────────────────────────────────
function setupTopBar(){
  $('undoBtn')?.addEventListener('click', undo);
  $('redoBtn')?.addEventListener('click', redo);
  $('clearCanvasBtn')?.addEventListener('click', () => {
    if(!confirm('مسح الطبقة الحالية؟')) return;
    saveHistory(); getActiveLCtx().clearRect(0,0,S.canvasW,S.canvasH); composite(); toast('تم المسح');
  });
  $('zoomInBtn')?.addEventListener('click',  () => { S.zoom = Math.min(32, S.zoom*1.2); applyTransform(); updateZoomLabel(); });
  $('zoomOutBtn')?.addEventListener('click', () => { S.zoom = Math.max(.05, S.zoom/1.2); applyTransform(); updateZoomLabel(); });
  $('zoomFitBtn')?.addEventListener('click', fitCanvas);
  $('exportBtn')?.addEventListener('click', () => $('exportModal').classList.remove('hidden'));
  $('settingsBtn')?.addEventListener('click', () => $('settingsModal').classList.remove('hidden'));
  $('refImgBtn')?.addEventListener('click', () => $('referenceModal').classList.remove('hidden'));
  $('fullscreenBtn')?.addEventListener('click', () => {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  });
  $('saveProjectBtn')?.addEventListener('click', saveProject);
  $('openProjectsBtn')?.addEventListener('click', () => { loadSavedProjectsUI(); $('projectsModal').classList.remove('hidden'); });
}

// ─────────────────────────────────────────────────
//  MODALS
// ─────────────────────────────────────────────────
function setupModals(){
  // Export
  $('closeExportModal')?.addEventListener('click', () => $('exportModal').classList.add('hidden'));
  $$('.export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.export-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      exportCanvas(btn.dataset.format);
    });
  });
  $('exportQuality')?.addEventListener('input', e => { const v=$('qualityVal'); if(v) v.textContent=e.target.value; });

  // Settings
  $('closeSettingsModal')?.addEventListener('click', () => $('settingsModal').classList.add('hidden'));
  $('darkThemeBtn')?.addEventListener('click',  () => { document.body.dataset.theme='dark';  $('darkThemeBtn').classList.add('active');  $('lightThemeBtn').classList.remove('active'); });
  $('lightThemeBtn')?.addEventListener('click', () => { document.body.dataset.theme='light'; $('lightThemeBtn').classList.add('active'); $('darkThemeBtn').classList.remove('active'); });
  $('toggleGrid')?.addEventListener('change',  e => $('canvasGrid').classList.toggle('hidden', !e.target.checked));
  $('toggleRuler')?.addEventListener('change', e => {
    $$('.ruler').forEach(r => r.style.display = e.target.checked ? '' : 'none');
  });
  $('smoothingSlider')?.addEventListener('input', e => {
    const v=$('smoothingVal'); if(v) v.textContent=e.target.value; S.smoothing=parseInt(e.target.value);
  });
  $('showShortcutsBtn')?.addEventListener('click', () => {
    $('settingsModal').classList.add('hidden'); $('shortcutsModal').classList.remove('hidden');
  });
  $('closeShortcutsModal')?.addEventListener('click', () => $('shortcutsModal').classList.add('hidden'));

  // Reference
  $('closeReferenceModal')?.addEventListener('click', () => $('referenceModal').classList.add('hidden'));
  $('refUploadArea')?.addEventListener('click', () => $('refFileInput').click());
  $('refFileInput')?.addEventListener('change', e => {
    const file = e.target.files[0]; if(!file) return;
    const img = new Image();
    img.onload = () => {
      S.refImage = img; renderReferenceImage();
      $('refControls').classList.remove('hidden');
      $('refUploadArea').style.display = 'none';
      toast('تم رفع صورة المرجع');
    };
    img.src = URL.createObjectURL(file);
  });
  $('refOpacity')?.addEventListener('input', e => {
    S.refOpacity = parseInt(e.target.value) / 100;
    const v=$('refOpacityVal'); if(v) v.textContent=e.target.value;
    renderReferenceImage();
  });
  $('lockRefBtn')?.addEventListener('click',   () => { S.refLocked = !S.refLocked; toast(S.refLocked ? 'تم قفل المرجع' : 'فك قفل المرجع'); });
  $('removeRefBtn')?.addEventListener('click', () => {
    S.refImage = null; rctx.clearRect(0,0,S.canvasW,S.canvasH);
    $('refControls').classList.add('hidden');
    $('refUploadArea').style.display = '';
    toast('تم حذف المرجع');
  });

  // Projects
  $('closeProjectsModal')?.addEventListener('click', () => $('projectsModal').classList.add('hidden'));

  // Close on overlay click (except new project modal)
  $$('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', e => {
      if(e.target === ov && ov.id !== 'newProjectModal') ov.classList.add('hidden');
    });
  });
}

function renderReferenceImage(){
  if(!S.refImage) return;
  rctx.clearRect(0,0,S.canvasW,S.canvasH);
  rctx.globalAlpha = S.refOpacity;
  rctx.drawImage(S.refImage,0,0,S.canvasW,S.canvasH);
  rctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────
//  EXPORT
// ─────────────────────────────────────────────────
function exportCanvas(format = 'png'){
  const quality = parseInt($('exportQuality')?.value || '95') / 100;
  if(format === 'gif'){ exportFrames('gif'); return; }
  if(format === 'mp4'){ exportVideo(); return; }
  const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  const ext  = format === 'jpg' ? 'jpg' : format;
  const link = document.createElement('a');
  link.download = `safwan-studio-${Date.now()}.${ext}`;
  link.href = mainCanvas.toDataURL(mime, quality);
  link.click();
  toast(`تم التصدير بصيغة ${ext.toUpperCase()}`);
  $('exportModal').classList.add('hidden');
}

function exportFrames(){
  if(!S.isAnimMode || !S.frames.length){ toast('هذا الخيار للمشاريع المتحركة فقط'); return; }
  toast('جاري تصدير الفريمات...', 4000);
  S.frames.forEach((frame, i) => {
    const tc = document.createElement('canvas'); tc.width = S.canvasW; tc.height = S.canvasH;
    const tctx = tc.getContext('2d');
    for(let li = frame.layers.length - 1; li >= 0; li--){
      const l = frame.layers[li]; if(!l.visible) continue;
      tctx.globalAlpha = l.opacity; tctx.drawImage(l.canvas, 0, 0);
    }
    tctx.globalAlpha = 1;
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `frame-${String(i+1).padStart(3,'0')}.png`;
      link.href = tc.toDataURL('image/png');
      link.click();
    }, i * 120);
  });
  $('exportModal').classList.add('hidden');
}

function exportVideo(){
  if(!S.isAnimMode || !S.frames.length){ toast('هذا الخيار للمشاريع المتحركة فقط'); return; }
  try{
    const stream = mainCanvas.captureStream(S.fps);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];
    recorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `safwan-animation-${Date.now()}.webm`; link.href = url; link.click();
      URL.revokeObjectURL(url); toast('تم تصدير الفيديو');
    };
    recorder.start();
    let fi = 0;
    function renderTick(){
      if(fi >= S.frames.length){ recorder.stop(); return; }
      const frame = S.frames[fi];
      mctx.clearRect(0,0,S.canvasW,S.canvasH);
      for(let i = frame.layers.length-1; i>=0; i--){
        const l = frame.layers[i]; if(!l.visible) continue;
        mctx.globalAlpha = l.opacity; mctx.drawImage(l.canvas,0,0);
      }
      mctx.globalAlpha = 1; fi++;
      setTimeout(renderTick, frame.duration || (1000 / S.fps));
    }
    renderTick();
    toast('جاري تسجيل الفيديو...', 3500);
  } catch(err){
    toast('خطأ: ' + err.message); exportFrames('gif');
  }
  $('exportModal').classList.add('hidden');
}

// ─────────────────────────────────────────────────
//  SAVE / LOAD PROJECTS
// ─────────────────────────────────────────────────
function saveProject(){
  try{
    const thumb = document.createElement('canvas'); thumb.width = 320; thumb.height = 180;
    thumb.getContext('2d').drawImage(mainCanvas,0,0,320,180);
    const saved = getSavedProjects();
    const proj = {
      name: S.projectName, date: new Date().toLocaleDateString('ar-SA'),
      thumb: thumb.toDataURL('image/jpeg',.7),
      isAnim: S.isAnimMode, canvasW: S.canvasW, canvasH: S.canvasH
    };
    const idx = saved.findIndex(p => p.name === S.projectName);
    if(idx >= 0) saved[idx] = proj; else saved.unshift(proj);
    localStorage.setItem('safwan_projects', JSON.stringify(saved.slice(0, 50)));
    toast('تم حفظ المشروع: ' + S.projectName);
  } catch(e){ toast('فشل الحفظ في المتصفح'); }
}

function getSavedProjects(){
  try{ return JSON.parse(localStorage.getItem('safwan_projects') || '[]'); } catch{ return []; }
}

function loadSavedProjectsUI(){
  const grid = $('savedProjectsGrid'); if(!grid) return;
  const saved = getSavedProjects();
  if(!saved.length){ grid.innerHTML = '<div class="no-projects">لا توجد مشاريع محفوظة بعد</div>'; return; }
  grid.innerHTML = '';
  saved.forEach(proj => {
    const card = document.createElement('div'); card.className = 'saved-proj-card';
    card.innerHTML = `
      <div class="saved-proj-thumb"><img src="${proj.thumb}" style="width:100%;height:100%;object-fit:cover;display:block"/></div>
      <div class="saved-proj-info">
        <div class="saved-proj-name">${proj.name}</div>
        <div class="saved-proj-date">${proj.date}</div>
      </div>`;
    grid.appendChild(card);
  });
}

// ─────────────────────────────────────────────────
//  KEYBOARD SHORTCUTS
// ─────────────────────────────────────────────────
function setupKeyboard(){
  document.addEventListener('keydown', e => {
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if(e.code === 'Space'){ e.preventDefault(); S.spaceHeld = true; $('canvasViewport').style.cursor = 'grab'; return; }

    if(e.ctrlKey || e.metaKey){
      switch(e.key.toLowerCase()){
        case 'z': e.preventDefault(); undo(); return;
        case 'y': e.preventDefault(); redo(); return;
        case 's': e.preventDefault(); saveProject(); return;
        case 'e': e.preventDefault(); $('exportModal').classList.remove('hidden'); return;
        case 'c': e.preventDefault(); copyLayer(); return;
        case 'v': e.preventDefault(); pasteLayer(); return;
        case '+': case '=': e.preventDefault(); S.zoom=Math.min(32,S.zoom*1.2); applyTransform(); updateZoomLabel(); return;
        case '-': e.preventDefault(); S.zoom=Math.max(.05,S.zoom/1.2); applyTransform(); updateZoomLabel(); return;
        case '0': e.preventDefault(); fitCanvas(); return;
      }
    }

    const toolMap = { b:'brush', e:'eraser', g:'fill', v:'move', m:'select-rect', l:'lasso', i:'eyedropper', t:'text', p:'pencil', h:'hand' };
    const mapped = toolMap[e.key.toLowerCase()];
    if(mapped){
      S.tool = mapped;
      $$('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === S.tool));
      updateCursor(); return;
    }
    if(e.key === '['){
      S.brushSize = Math.max(1, S.brushSize - 2);
      const el=$('brushSize'); if(el){ el.value=S.brushSize; $('brushSizeVal').textContent=S.brushSize; }
    }
    if(e.key === ']'){
      S.brushSize = Math.min(300, S.brushSize + 2);
      const el=$('brushSize'); if(el){ el.value=S.brushSize; $('brushSizeVal').textContent=S.brushSize; }
    }
    if(e.key === 'Delete' || e.key === 'Backspace'){
      const l = getActiveLayer();
      if(l && !l.locked){ saveHistory(); l.ctx.clearRect(0,0,S.canvasW,S.canvasH); composite(); }
    }
    if(e.key.toLowerCase() === 'f'){
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    }
    // Animation shortcuts
    if(S.isAnimMode){
      if(e.key === 'ArrowLeft'){
        if(S.activeFrameIndex > 0){ saveCurrentFrameLayers(); S.activeFrameIndex--; loadFrameLayers(); }
      }
      if(e.key === 'ArrowRight'){
        if(S.activeFrameIndex < S.frames.length-1){ saveCurrentFrameLayers(); S.activeFrameIndex++; loadFrameLayers(); }
      }
    }
  });

  document.addEventListener('keyup', e => {
    if(e.code === 'Space'){
      S.spaceHeld = false;
      $('canvasViewport').style.cursor = 'crosshair';
    }
  });
}

// ─────────────────────────────────────────────────
//  COPY / PASTE
// ─────────────────────────────────────────────────
function copyLayer(){
  const l = getActiveLayer(); if(!l) return;
  const c = document.createElement('canvas'); c.width=S.canvasW; c.height=S.canvasH;
  c.getContext('2d').drawImage(l.canvas,0,0);
  S.copyBuffer = c; toast('تم النسخ');
}
function pasteLayer(){
  if(!S.copyBuffer) return toast('لا يوجد شيء للصق');
  saveHistory();
  getActiveLCtx().drawImage(S.copyBuffer,0,0);
  composite(); toast('تم اللصق');
}

// ─────────────────────────────────────────────────
//  RULERS
// ─────────────────────────────────────────────────
function setupRulers(){
  drawRulerH(); drawRulerV();
  $('canvasViewport')?.addEventListener('scroll', () => { drawRulerH(); drawRulerV(); });
}

function drawRulerH(){
  const ruler = $('rulerH'); if(!ruler) return;
  const W = ruler.parentElement?.clientWidth || 800;
  ruler.width = W; ruler.height = 20;
  const rc = ruler.getContext('2d');
  const theme = document.body.dataset.theme;
  rc.fillStyle = theme === 'light' ? '#EAEAF8' : '#14161F';
  rc.fillRect(0,0,W,20);
  rc.fillStyle = theme === 'light' ? '#666680' : '#555672';
  rc.font = '9px monospace';
  rc.textAlign = 'left';
  const step = S.zoom > 2 ? 50 : S.zoom > .5 ? 100 : 200;
  for(let x = 0; x <= S.canvasW; x += step){
    const px = S.panX + x * S.zoom;
    if(px < 0 || px > W) continue;
    rc.fillRect(px, 12, 1, 8);
    rc.fillText(x, px + 2, 11);
  }
}

function drawRulerV(){
  const ruler = $('rulerV'); if(!ruler) return;
  const H = ruler.parentElement?.clientHeight || 600;
  ruler.width = 20; ruler.height = H;
  const rc = ruler.getContext('2d');
  const theme = document.body.dataset.theme;
  rc.fillStyle = theme === 'light' ? '#EAEAF8' : '#14161F';
  rc.fillRect(0,0,20,H);
  rc.fillStyle = theme === 'light' ? '#666680' : '#555672';
  rc.font = '9px monospace';
  rc.textAlign = 'right';
  rc.save(); rc.rotate(-Math.PI/2);
  const step = S.zoom > 2 ? 50 : S.zoom > .5 ? 100 : 200;
  for(let y = 0; y <= S.canvasH; y += step){
    const py = S.panY + y * S.zoom;
    if(py < 0 || py > H) continue;
    rc.restore(); rc.save();
    rc.fillRect(12, py, 8, 1);
    rc.save(); rc.translate(11, py - 2); rc.rotate(-Math.PI/2);
    rc.fillText(y, 0, 0); rc.restore();
  }
  rc.restore();
}
