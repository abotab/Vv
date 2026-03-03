/**
 * SAFWAN STUDIO - studio.js
 * Full Professional Drawing Studio Engine
 * Supports: Brushes, Layers, Selection, Colors, Shapes, Animation Timeline
 */

'use strict';

// ============================================================
// STUDIO ENGINE
// ============================================================
const Studio = {
  // State
  project: null,
  canvas: null,
  ctx: null,
  overlayCanvas: null,
  overlayCtx: null,

  // Tool state
  currentTool: 'brush',
  isDrawing: false,
  lastX: 0, lastY: 0,
  startX: 0, startY: 0,

  // Transform
  zoom: 1,
  panX: 0, panY: 0,
  rotation: 0,

  // Drawing options
  brushSize: 12,
  brushOpacity: 1.0,
  brushHardness: 0.8,
  brushSpacing: 0.3,
  brushSmoothing: 0.5,
  brushFlow: 1.0,

  // Colors
  foreColor: '#000000',
  backColor: '#FFFFFF',

  // Layers
  layers: [],
  activeLayerIndex: 0,

  // History
  history: [],
  historyIndex: -1,
  maxHistory: 50,

  // Selection
  selection: null,
  selectionPath: null,
  isSelecting: false,

  // Animation
  frames: [],
  activeFrameIndex: 0,
  fps: 12,
  isPlaying: false,
  playInterval: null,

  // Brush points for smoothing
  brushPoints: [],

  // Reference image
  referenceImage: null,
  referenceOpacity: 0.5,

  // Grid
  showGrid: false,
  gridSize: 20,

  // Pressure simulation
  pressure: 1.0,

  init(project) {
    this.project = project;
    this.setupCanvas();
    this.setupLayers();
    this.setupFrames();
    this.bindEvents();
    this.render();
    this.updateUI();
    this.generateBrushPreviews();
    this.renderColorPalette();
    this.renderLayers();

    // Load sample fire animation if available
    if (project.sampleFire) {
      this.loadFireAnimation();
    }

    document.getElementById('studio-project-title')?.childNodes[0] &&
      (document.getElementById('studio-project-title').textContent = project.name);

    const titleEl = document.querySelector('.studio-project-name');
    if (titleEl) titleEl.textContent = project.name;

    if (project.type === 'animated') {
      document.querySelector('.studio-timeline')?.classList.add('visible');
      this.updateTimeline();
    }

    // Restore from localStorage if exists
    this.loadProjectData();

    showNotification(`تم فتح "${project.name}"`, 'success');
  },

  setupCanvas() {
    this.canvas = document.getElementById('main-canvas');
    this.overlayCanvas = document.getElementById('overlay-canvas');
    if (!this.canvas) return;

    const w = this.project.width || 1080;
    const h = this.project.height || 1080;

    this.canvas.width = w;
    this.canvas.height = h;
    this.overlayCanvas.width = w;
    this.overlayCanvas.height = h;

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.overlayCtx = this.overlayCanvas.getContext('2d');

    // Initial background
    const bg = this.project.bgColor || '#FFFFFF';
    if (bg === '#transparent') {
      this.ctx.clearRect(0, 0, w, h);
    } else {
      this.ctx.fillStyle = bg;
      this.ctx.fillRect(0, 0, w, h);
    }

    // Set canvas container size via CSS
    this.fitCanvas();
    window.addEventListener('resize', () => this.fitCanvas());
  },

  fitCanvas() {
    const area = document.querySelector('.studio-canvas-area');
    if (!area || !this.canvas) return;

    const areaW = area.clientWidth - 60;
    const areaH = area.clientHeight - 60;
    const scaleX = areaW / this.canvas.width;
    const scaleY = areaH / this.canvas.height;
    const scale = Math.min(scaleX, scaleY, 1);

    const container = document.querySelector('.canvas-container');
    if (container) {
      container.style.width = (this.canvas.width * scale * this.zoom) + 'px';
      container.style.height = (this.canvas.height * scale * this.zoom) + 'px';
    }

    this.displayScale = scale;
    this.updateZoomDisplay();
  },

  setupLayers() {
    if (this.project.layers && this.project.layers.length > 0) {
      this.layers = this.project.layers.map(l => ({
        ...l,
        canvas: document.createElement('canvas'),
      }));
    } else {
      this.layers = [this.createLayer('الطبقة 1')];
    }

    this.layers.forEach(layer => {
      layer.canvas.width = this.project.width || 1080;
      layer.canvas.height = this.project.height || 1080;
    });

    // Fill background on first layer
    const bg = this.project.bgColor || '#FFFFFF';
    if (bg !== '#transparent' && this.layers[0]) {
      const lCtx = this.layers[0].canvas.getContext('2d');
      lCtx.fillStyle = bg;
      lCtx.fillRect(0, 0, this.layers[0].canvas.width, this.layers[0].canvas.height);
    }

    this.activeLayerIndex = 0;
  },

  createLayer(name) {
    const c = document.createElement('canvas');
    c.width = this.project.width || 1080;
    c.height = this.project.height || 1080;
    return {
      id: 'layer_' + Date.now() + '_' + Math.random(),
      name: name || `الطبقة ${this.layers.length + 1}`,
      canvas: c,
      opacity: 1.0,
      visible: true,
      locked: false,
      blendMode: 'source-over',
      data: null
    };
  },

  setupFrames() {
    if (this.project.type !== 'animated') return;

    if (this.project.sampleFire) {
      this.frames = this.buildFireFrames();
    } else if (this.project.frames && this.project.frames.length > 0) {
      this.frames = this.project.frames;
    } else {
      this.frames = [{ id: 'frame_0', duration: 100, snapshot: null }];
    }
    this.activeFrameIndex = 0;
  },

  buildFireFrames() {
    // Build sample fire animation (6 frames)
    const frames = [];
    for (let i = 0; i < 6; i++) {
      frames.push({
        id: 'frame_' + i,
        duration: 80,
        snapshot: null,
        fireData: i // will be drawn dynamically
      });
    }
    return frames;
  },

  // ---- Event Binding ----
  bindEvents() {
    const canvas = this.canvas;
    if (!canvas) return;

    canvas.addEventListener('pointerdown', e => this.onPointerDown(e));
    canvas.addEventListener('pointermove', e => this.onPointerMove(e));
    canvas.addEventListener('pointerup', e => this.onPointerUp(e));
    canvas.addEventListener('pointerleave', e => this.onPointerUp(e));
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => this.onWheel(e), { passive: false });

    // Keyboard
    document.addEventListener('keydown', e => this.onKeyDown(e));

    // Tool buttons
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => this.setTool(btn.dataset.tool));
    });

    // Sliders
    this.bindSlider('brush-size-slider', v => {
      this.brushSize = parseInt(v);
      document.querySelector('.brush-size-val') && (document.querySelector('.brush-size-val').textContent = v + 'px');
    });

    this.bindSlider('brush-opacity-slider', v => {
      this.brushOpacity = parseInt(v) / 100;
      document.querySelector('.brush-opacity-val') && (document.querySelector('.brush-opacity-val').textContent = v + '%');
    });

    this.bindSlider('brush-hardness-slider', v => {
      this.brushHardness = parseInt(v) / 100;
      document.querySelector('.brush-hardness-val') && (document.querySelector('.brush-hardness-val').textContent = v + '%');
    });

    this.bindSlider('brush-smoothing-slider', v => {
      this.brushSmoothing = parseInt(v) / 100;
    });

    this.bindSlider('brush-flow-slider', v => {
      this.brushFlow = parseInt(v) / 100;
    });

    // Zoom controls
    document.getElementById('zoom-in-btn')?.addEventListener('click', () => this.setZoom(this.zoom * 1.25));
    document.getElementById('zoom-out-btn')?.addEventListener('click', () => this.setZoom(this.zoom / 1.25));
    document.getElementById('zoom-reset-btn')?.addEventListener('click', () => this.setZoom(1));

    // Layer controls
    document.getElementById('add-layer-btn')?.addEventListener('click', () => this.addLayer());
    document.getElementById('delete-layer-btn')?.addEventListener('click', () => this.deleteActiveLayer());
    document.getElementById('merge-layers-btn')?.addEventListener('click', () => this.mergeLayers());

    // Timeline controls
    document.getElementById('play-btn')?.addEventListener('click', () => this.togglePlayback());
    document.getElementById('add-frame-btn')?.addEventListener('click', () => this.addFrame());
    document.getElementById('delete-frame-btn')?.addEventListener('click', () => this.deleteActiveFrame());
    document.getElementById('fps-input')?.addEventListener('change', e => { this.fps = parseInt(e.target.value) || 12; });

    // File operations
    document.getElementById('save-btn')?.addEventListener('click', () => this.saveProject());
    document.getElementById('export-btn')?.addEventListener('click', () => this.showExportMenu());
    document.getElementById('undo-btn')?.addEventListener('click', () => this.undo());
    document.getElementById('redo-btn')?.addEventListener('click', () => this.redo());

    // Color swatches
    document.querySelector('.color-swatch-fg')?.addEventListener('click', () => this.openColorPicker('fg'));
    document.querySelector('.color-swatch-bg')?.addEventListener('click', () => this.openColorPicker('bg'));
    document.querySelector('.swap-colors-btn')?.addEventListener('click', () => this.swapColors());

    // Reference image
    document.getElementById('ref-import-btn')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = e => this.loadReferenceImage(e.target.files[0]);
      input.click();
    });

    // Back button
    document.getElementById('back-to-projects-btn')?.addEventListener('click', () => this.exitStudio());

    // Blend mode
    document.getElementById('blend-mode-select')?.addEventListener('change', e => {
      if (this.layers[this.activeLayerIndex]) {
        this.layers[this.activeLayerIndex].blendMode = e.target.value;
        this.render();
      }
    });

    // Context menu
    canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY);
    });

    document.addEventListener('click', () => this.hideContextMenu());

    // Grid toggle
    document.getElementById('grid-btn')?.addEventListener('click', () => {
      this.showGrid = !this.showGrid;
      document.getElementById('grid-btn')?.classList.toggle('active', this.showGrid);
      this.render();
    });

    // Brush list
    document.querySelectorAll('.brush-item').forEach((item, i) => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.brush-item').forEach(b => b.classList.remove('active'));
        item.classList.add('active');
        this.currentBrushIndex = i;
        this.applyBrushPreset(i);
      });
    });

    // Keyboard shortcuts panel
    document.getElementById('shortcuts-btn')?.addEventListener('click', () => {
      const panel = document.getElementById('shortcuts-panel');
      panel?.classList.add('active');
    });
    document.getElementById('shortcuts-close-btn')?.addEventListener('click', () => {
      document.getElementById('shortcuts-panel')?.classList.remove('active');
    });

    // Pointerdown on document to close color picker
    document.addEventListener('pointerdown', e => {
      const picker = document.getElementById('color-picker-popup');
      if (picker && !picker.contains(e.target) && !e.target.closest('.color-swatch-fg, .color-swatch-bg')) {
        picker.classList.remove('visible');
      }
    });
  },

  bindSlider(id, callback) {
    const slider = document.getElementById(id);
    if (slider) {
      slider.addEventListener('input', e => callback(e.target.value));
    }
  },

  // ---- Pointer Events ----
  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure || 0.5
    };
  },

  onPointerDown(e) {
    e.preventDefault();
    const pos = this.getCanvasPos(e);
    this.isDrawing = true;
    this.lastX = pos.x; this.lastY = pos.y;
    this.startX = pos.x; this.startY = pos.y;
    this.pressure = pos.pressure;
    this.brushPoints = [{ x: pos.x, y: pos.y, pressure: pos.pressure }];

    this.canvas.setPointerCapture(e.pointerId);

    switch (this.currentTool) {
      case 'brush': case 'pencil': case 'marker': case 'pen':
        this.saveHistoryState();
        this.drawBrushDot(pos.x, pos.y, pos.pressure);
        break;
      case 'eraser':
        this.saveHistoryState();
        this.erase(pos.x, pos.y, pos.pressure);
        break;
      case 'fill':
        this.saveHistoryState();
        this.floodFill(Math.floor(pos.x), Math.floor(pos.y));
        break;
      case 'eyedropper':
        this.pickColor(Math.floor(pos.x), Math.floor(pos.y));
        break;
      case 'select-rect': case 'select-ellipse': case 'lasso':
        this.startSelection(pos.x, pos.y);
        break;
      case 'move':
        break;
    }
  },

  onPointerMove(e) {
    if (!this.isDrawing) {
      // Update cursor info
      const pos = this.getCanvasPos(e);
      this.updateCursorInfo(pos.x, pos.y);
      return;
    }

    const pos = this.getCanvasPos(e);
    this.pressure = pos.pressure;

    switch (this.currentTool) {
      case 'brush': case 'pencil': case 'marker': case 'pen':
        this.brushPoints.push({ x: pos.x, y: pos.y, pressure: pos.pressure });
        this.drawBrushStroke(pos.x, pos.y, pos.pressure);
        break;
      case 'eraser':
        this.erase(pos.x, pos.y, pos.pressure);
        break;
      case 'select-rect':
        this.updateSelectionRect(pos.x, pos.y);
        break;
      case 'select-ellipse':
        this.updateSelectionEllipse(pos.x, pos.y);
        break;
      case 'lasso':
        this.updateLasso(pos.x, pos.y);
        break;
      case 'line':
        this.previewLine(this.startX, this.startY, pos.x, pos.y);
        break;
      case 'rect-shape':
        this.previewRect(this.startX, this.startY, pos.x, pos.y);
        break;
      case 'ellipse-shape':
        this.previewEllipse(this.startX, this.startY, pos.x, pos.y);
        break;
    }

    this.lastX = pos.x; this.lastY = pos.y;
  },

  onPointerUp(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    const pos = this.getCanvasPos(e);

    switch (this.currentTool) {
      case 'line':
        this.drawLine(this.startX, this.startY, pos.x, pos.y);
        break;
      case 'rect-shape':
        this.drawRect(this.startX, this.startY, pos.x, pos.y);
        break;
      case 'ellipse-shape':
        this.drawEllipse(this.startX, this.startY, pos.x, pos.y);
        break;
      case 'select-rect':
        this.finalizeSelectionRect();
        break;
      case 'select-ellipse':
        this.finalizeSelectionEllipse();
        break;
      case 'lasso':
        this.finalizeLasso();
        break;
    }

    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    this.brushPoints = [];

    // Update frame snapshot for animation
    if (this.project.type === 'animated') {
      this.saveFrameSnapshot();
    }

    // Update layer thumbnail
    this.updateLayerThumbnail(this.activeLayerIndex);
    this.render();
  },

  onWheel(e) {
    e.preventDefault();
    if (e.ctrlKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.setZoom(this.zoom * delta);
    }
  },

  onKeyDown(e) {
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === 'z') { e.preventDefault(); this.undo(); return; }
    if (ctrl && e.key === 'y') { e.preventDefault(); this.redo(); return; }
    if (ctrl && e.key === 's') { e.preventDefault(); this.saveProject(); return; }
    if (ctrl && e.key === 'c') { this.copySelection(); return; }
    if (ctrl && e.key === 'v') { this.pasteSelection(); return; }
    if (ctrl && e.key === 'a') { e.preventDefault(); this.selectAll(); return; }
    if (ctrl && e.key === 'd') { e.preventDefault(); this.deselect(); return; }
    if (e.key === 'Escape') { this.deselect(); return; }

    // Tool shortcuts
    const tools = { b: 'brush', e: 'eraser', g: 'fill', i: 'eyedropper',
                    m: 'select-rect', l: 'lasso', w: 'magic-wand',
                    t: 'text', r: 'rect-shape', o: 'ellipse-shape',
                    p: 'pen', k: 'marker', v: 'move', c: 'crop' };
    if (tools[e.key.toLowerCase()]) this.setTool(tools[e.key.toLowerCase()]);

    // Brush size
    if (e.key === '[') this.setBrushSize(Math.max(1, this.brushSize - 2));
    if (e.key === ']') this.setBrushSize(Math.min(300, this.brushSize + 2));

    // Zoom
    if (ctrl && e.key === '+') { e.preventDefault(); this.setZoom(this.zoom * 1.2); }
    if (ctrl && e.key === '-') { e.preventDefault(); this.setZoom(this.zoom / 1.2); }
    if (ctrl && e.key === '0') { e.preventDefault(); this.setZoom(1); }

    // Space = toggle hand tool temporarily
    if (e.key === ' ') { e.preventDefault(); this._prevTool = this.currentTool; this.setTool('hand'); }
  },

  // ---- Brush Drawing ----
  getActiveLayerCtx() {
    const layer = this.layers[this.activeLayerIndex];
    if (!layer || !layer.canvas) return null;
    return layer.canvas.getContext('2d');
  },

  drawBrushDot(x, y, pressure = 0.5) {
    const ctx = this.getActiveLayerCtx();
    if (!ctx) return;

    const layer = this.layers[this.activeLayerIndex];
    if (layer.locked) return;

    const size = this.brushSize * (0.5 + pressure * 0.5);
    const opacity = this.brushOpacity * this.brushFlow * (0.6 + pressure * 0.4);

    ctx.save();
    ctx.globalCompositeOperation = layer.blendMode || 'source-over';
    ctx.globalAlpha = opacity;

    this.applyBrushStamp(ctx, x, y, size);
    ctx.restore();
    this.render();
  },

  drawBrushStroke(x, y, pressure = 0.5) {
    const ctx = this.getActiveLayerCtx();
    if (!ctx) return;

    const layer = this.layers[this.activeLayerIndex];
    if (layer.locked) return;

    // Apply smoothing
    const smooth = this.brushSmoothing;
    const sx = this.lastX + (x - this.lastX) * (1 - smooth);
    const sy = this.lastY + (y - this.lastY) * (1 - smooth);

    const size = this.brushSize * (0.5 + pressure * 0.5);
    const opacity = this.brushOpacity * this.brushFlow * (0.6 + pressure * 0.4);
    const dist = Math.hypot(sx - this.lastX, sy - this.lastY);
    const step = Math.max(1, size * this.brushSpacing);
    const steps = Math.max(1, Math.floor(dist / step));

    ctx.save();
    ctx.globalCompositeOperation = layer.blendMode || 'source-over';
    ctx.globalAlpha = opacity;

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const bx = this.lastX + (sx - this.lastX) * t;
      const by = this.lastY + (sy - this.lastY) * t;
      this.applyBrushStamp(ctx, bx, by, size);
    }

    ctx.restore();
    this.render();
  },

  applyBrushStamp(ctx, x, y, size) {
    const brush = BrushEngine.brushes[this.currentBrushIndex || 0];
    if (!brush) return;
    brush.draw(ctx, x, y, size, this.foreColor, this.brushHardness);
  },

  erase(x, y, pressure = 0.5) {
    const ctx = this.getActiveLayerCtx();
    if (!ctx) return;

    const layer = this.layers[this.activeLayerIndex];
    if (layer.locked) return;

    const size = this.brushSize * 2 * (0.5 + pressure * 0.5);
    const dist = Math.hypot(x - this.lastX, y - this.lastY);
    const step = Math.max(1, size * 0.3);
    const steps = Math.max(1, Math.floor(dist / step));

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = this.brushOpacity;

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const bx = this.lastX + (x - this.lastX) * t;
      const by = this.lastY + (y - this.lastY) * t;
      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, size / 2);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(this.brushHardness, 'rgba(0,0,0,0.8)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    this.render();
  },

  // ---- Shape Drawing ----
  drawLine(x1, y1, x2, y2) {
    const ctx = this.getActiveLayerCtx();
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = this.foreColor;
    ctx.lineWidth = this.brushSize;
    ctx.lineCap = 'round';
    ctx.globalAlpha = this.brushOpacity;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
    this.render();
  },

  drawRect(x1, y1, x2, y2) {
    const ctx = this.getActiveLayerCtx();
    if (!ctx) return;
    const x = Math.min(x1, x2), y = Math.min(y1, y2);
    const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
    ctx.save();
    ctx.globalAlpha = this.brushOpacity;
    if (this._shapeFill) { ctx.fillStyle = this.foreColor; ctx.fillRect(x, y, w, h); }
    ctx.strokeStyle = this.foreColor; ctx.lineWidth = this.brushSize;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
    this.render();
  },

  drawEllipse(x1, y1, x2, y2) {
    const ctx = this.getActiveLayerCtx();
    if (!ctx) return;
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
    ctx.save();
    ctx.globalAlpha = this.brushOpacity;
    ctx.strokeStyle = this.foreColor; ctx.lineWidth = this.brushSize;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (this._shapeFill) { ctx.fillStyle = this.foreColor; ctx.fill(); }
    ctx.stroke(); ctx.restore();
    this.render();
  },

  previewLine(x1, y1, x2, y2) {
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    this.overlayCtx.save();
    this.overlayCtx.strokeStyle = this.foreColor;
    this.overlayCtx.lineWidth = this.brushSize;
    this.overlayCtx.setLineDash([6, 3]);
    this.overlayCtx.lineCap = 'round';
    this.overlayCtx.globalAlpha = 0.7;
    this.overlayCtx.beginPath();
    this.overlayCtx.moveTo(x1, y1); this.overlayCtx.lineTo(x2, y2);
    this.overlayCtx.stroke();
    this.overlayCtx.restore();
  },

  previewRect(x1, y1, x2, y2) {
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    const x = Math.min(x1, x2), y = Math.min(y1, y2);
    const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
    this.overlayCtx.save();
    this.overlayCtx.strokeStyle = this.foreColor;
    this.overlayCtx.lineWidth = this.brushSize;
    this.overlayCtx.setLineDash([6, 3]);
    this.overlayCtx.globalAlpha = 0.7;
    this.overlayCtx.strokeRect(x, y, w, h);
    this.overlayCtx.restore();
  },

  previewEllipse(x1, y1, x2, y2) {
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
    this.overlayCtx.save();
    this.overlayCtx.strokeStyle = this.foreColor;
    this.overlayCtx.lineWidth = this.brushSize;
    this.overlayCtx.setLineDash([6, 3]);
    this.overlayCtx.globalAlpha = 0.7;
    this.overlayCtx.beginPath();
    this.overlayCtx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
    this.overlayCtx.stroke();
    this.overlayCtx.restore();
  },

  // ---- Fill Tool ----
  floodFill(startX, startY) {
    const ctx = this.getActiveLayerCtx();
    if (!ctx) return;

    const w = this.canvas.width, h = this.canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const colorAt = (x, y) => {
      const i = (y * w + x) * 4;
      return [data[i], data[i+1], data[i+2], data[i+3]];
    };

    const targetColor = colorAt(startX, startY);
    const fillColor = this.hexToRgba(this.foreColor);

    if (this.colorsMatch(targetColor, fillColor)) return;

    const tolerance = 30;
    const stack = [[startX, startY]];
    const visited = new Uint8Array(w * h);

    const colorsClose = (a, b) =>
      Math.abs(a[0]-b[0]) <= tolerance &&
      Math.abs(a[1]-b[1]) <= tolerance &&
      Math.abs(a[2]-b[2]) <= tolerance &&
      Math.abs(a[3]-b[3]) <= tolerance;

    while (stack.length > 0) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
      const idx = cy * w + cx;
      if (visited[idx]) continue;
      visited[idx] = 1;

      if (!colorsClose(colorAt(cx, cy), targetColor)) continue;

      const i = idx * 4;
      data[i] = fillColor[0]; data[i+1] = fillColor[1];
      data[i+2] = fillColor[2]; data[i+3] = fillColor[3];

      stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
    }

    ctx.putImageData(imgData, 0, 0);
    this.render();
  },

  hexToRgba(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255];
  },

  colorsMatch(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  },

  // ---- Eyedropper ----
  pickColor(x, y) {
    const ctx = this.getActiveLayerCtx();
    if (!ctx) return;
    const p = ctx.getImageData(x, y, 1, 1).data;
    const hex = '#' + [p[0], p[1], p[2]].map(v => v.toString(16).padStart(2, '0')).join('');
    this.setForeColor(hex);
  },

  // ---- Selection Tools ----
  startSelection(x, y) {
    this.selectionStart = { x, y };
    this.isSelecting = true;
    if (this.currentTool === 'lasso') {
      this.lassoPoints = [{ x, y }];
    }
  },

  updateSelectionRect(x, y) {
    if (!this.isSelecting) return;
    const s = this.selectionStart;
    const sx = Math.min(s.x, x), sy = Math.min(s.y, y);
    const sw = Math.abs(x - s.x), sh = Math.abs(y - s.y);

    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    this.overlayCtx.save();
    this.overlayCtx.strokeStyle = 'rgba(100,200,255,0.9)';
    this.overlayCtx.lineWidth = 1.5;
    this.overlayCtx.setLineDash([8, 4]);
    this.overlayCtx.lineDashOffset = (Date.now() / 50) % 12;
    this.overlayCtx.strokeRect(sx, sy, sw, sh);
    this.overlayCtx.fillStyle = 'rgba(100,200,255,0.08)';
    this.overlayCtx.fillRect(sx, sy, sw, sh);
    this.overlayCtx.restore();

    this.selection = { type: 'rect', x: sx, y: sy, w: sw, h: sh };
  },

  updateSelectionEllipse(x, y) {
    if (!this.isSelecting) return;
    const s = this.selectionStart;
    const cx = (s.x + x) / 2, cy = (s.y + y) / 2;
    const rx = Math.abs(x - s.x) / 2, ry = Math.abs(y - s.y) / 2;

    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    this.overlayCtx.save();
    this.overlayCtx.strokeStyle = 'rgba(100,200,255,0.9)';
    this.overlayCtx.lineWidth = 1.5;
    this.overlayCtx.setLineDash([8, 4]);
    this.overlayCtx.beginPath();
    this.overlayCtx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
    this.overlayCtx.stroke();
    this.overlayCtx.fillStyle = 'rgba(100,200,255,0.08)';
    this.overlayCtx.fill();
    this.overlayCtx.restore();

    this.selection = { type: 'ellipse', cx, cy, rx, ry };
  },

  updateLasso(x, y) {
    if (!this.isSelecting || !this.lassoPoints) return;
    this.lassoPoints.push({ x, y });

    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    this.overlayCtx.save();
    this.overlayCtx.strokeStyle = 'rgba(100,200,255,0.9)';
    this.overlayCtx.lineWidth = 1.5;
    this.overlayCtx.setLineDash([4, 2]);
    this.overlayCtx.beginPath();
    this.lassoPoints.forEach((p, i) => {
      if (i === 0) this.overlayCtx.moveTo(p.x, p.y);
      else this.overlayCtx.lineTo(p.x, p.y);
    });
    this.overlayCtx.stroke();
    this.overlayCtx.restore();
  },

  finalizeSelectionRect() {
    this.isSelecting = false;
    if (this.selection) {
      showNotification(`تحديد: ${Math.round(this.selection.w)}×${Math.round(this.selection.h)} بكسل`, 'info');
    }
  },

  finalizeSelectionEllipse() { this.isSelecting = false; },

  finalizeLasso() {
    this.isSelecting = false;
    if (this.lassoPoints && this.lassoPoints.length > 3) {
      this.selection = { type: 'lasso', points: [...this.lassoPoints] };
      showNotification('تم اكتمال التحديد الحر', 'info');
    }
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
  },

  selectAll() {
    this.selection = { type: 'rect', x: 0, y: 0, w: this.canvas.width, h: this.canvas.height };
    showNotification('تم تحديد الكل', 'info');
  },

  deselect() {
    this.selection = null;
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
  },

  copySelection() {
    if (!this.selection) return;
    const ctx = this.getActiveLayerCtx();
    if (!ctx) return;

    const s = this.selection;
    if (s.type === 'rect') {
      this.clipboard = ctx.getImageData(s.x, s.y, s.w, s.h);
      this.clipboardX = s.x; this.clipboardY = s.y;
      showNotification('تم النسخ', 'success');
    }
  },

  pasteSelection() {
    if (!this.clipboard) return;
    const ctx = this.getActiveLayerCtx();
    if (!ctx) return;

    const newLayer = this.createLayer('لصق');
    this.layers.splice(this.activeLayerIndex + 1, 0, newLayer);
    this.activeLayerIndex++;

    const lCtx = newLayer.canvas.getContext('2d');
    lCtx.putImageData(this.clipboard, this.clipboardX + 10, this.clipboardY + 10);

    this.renderLayers();
    this.render();
    showNotification('تم اللصق في طبقة جديدة', 'success');
  },

  // ---- Magic Wand ----
  magicWandSelect(x, y) {
    const ctx = this.getActiveLayerCtx();
    if (!ctx) return;
    const w = this.canvas.width, h = this.canvas.height;
    const data = ctx.getImageData(0, 0, w, h).data;

    const getColor = (px, py) => {
      const i = (py * w + px) * 4;
      return [data[i], data[i+1], data[i+2], data[i+3]];
    };

    const targetColor = getColor(Math.floor(x), Math.floor(y));
    const tolerance = 40;
    const points = [];
    const visited = new Uint8Array(w * h);

    const close = (a, b) =>
      Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) + Math.abs(a[2]-b[2]) <= tolerance * 3;

    const stack = [[Math.floor(x), Math.floor(y)]];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
      const idx = cy * w + cx;
      if (visited[idx]) continue;
      visited[idx] = 1;
      if (!close(getColor(cx, cy), targetColor)) continue;
      points.push({ x: cx, y: cy });
      stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
    }

    this.selection = { type: 'magic', points };
    showNotification(`تم التحديد: ${points.length} بكسل`, 'info');
  },

  // ---- Render ----
  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw checkerboard for transparency
    this.drawCheckerboard(ctx);

    // Draw reference image first (below all layers)
    if (this.referenceImage) {
      ctx.save();
      ctx.globalAlpha = this.referenceOpacity;
      ctx.drawImage(this.referenceImage, 0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
    }

    // Draw layers bottom to top
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      if (!layer.visible || !layer.canvas) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode || 'source-over';
      ctx.drawImage(layer.canvas, 0, 0);
      ctx.restore();
    }

    // Draw grid
    if (this.showGrid) {
      this.drawGrid(ctx);
    }

    ctx.restore();
  },

  drawCheckerboard(ctx) {
    const bg = this.project.bgColor;
    if (bg && bg !== '#transparent') {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    const size = 16;
    for (let y = 0; y < this.canvas.height; y += size) {
      for (let x = 0; x < this.canvas.width; x += size) {
        ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? '#CCCCCC' : '#FFFFFF';
        ctx.fillRect(x, y, size, size);
      }
    }
  },

  drawGrid(ctx) {
    const size = this.gridSize;
    ctx.save();
    ctx.strokeStyle = 'rgba(100,100,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);

    for (let x = 0; x <= this.canvas.width; x += size) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= this.canvas.height; y += size) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y); ctx.stroke();
    }
    ctx.restore();
  },

  // ---- Layers ----
  addLayer() {
    const layer = this.createLayer(`الطبقة ${this.layers.length + 1}`);
    this.layers.splice(this.activeLayerIndex, 0, layer);
    this.renderLayers();
    this.render();
    showNotification(`أضيفت "${layer.name}"`, 'success');
  },

  deleteActiveLayer() {
    if (this.layers.length <= 1) {
      showNotification('لا يمكن حذف الطبقة الأخيرة', 'error');
      return;
    }
    this.layers.splice(this.activeLayerIndex, 1);
    this.activeLayerIndex = Math.max(0, this.activeLayerIndex - 1);
    this.renderLayers();
    this.render();
    showNotification('تم حذف الطبقة', 'error');
  },

  mergeLayers() {
    if (this.layers.length <= 1) return;
    const top = this.layers[this.activeLayerIndex];
    const below = this.layers[this.activeLayerIndex + 1];
    if (!below) return;

    const belowCtx = below.canvas.getContext('2d');
    belowCtx.save();
    belowCtx.globalAlpha = top.opacity;
    belowCtx.globalCompositeOperation = top.blendMode || 'source-over';
    belowCtx.drawImage(top.canvas, 0, 0);
    belowCtx.restore();

    this.layers.splice(this.activeLayerIndex, 1);
    this.activeLayerIndex = Math.max(0, this.activeLayerIndex - 1);
    this.renderLayers();
    this.render();
    showNotification('تم دمج الطبقتين', 'success');
  },

  setActiveLayer(index) {
    this.activeLayerIndex = index;
    this.renderLayers();
    const blendSelect = document.getElementById('blend-mode-select');
    if (blendSelect && this.layers[index]) {
      blendSelect.value = this.layers[index].blendMode || 'source-over';
    }
  },

  updateLayerThumbnail(index) {
    const layer = this.layers[index];
    if (!layer || !layer.canvas) return;

    const thumbCanvas = document.querySelector(`.layer-thumb[data-layer="${index}"] canvas`);
    if (thumbCanvas) {
      const tc = thumbCanvas.getContext('2d');
      tc.clearRect(0, 0, 32, 22);
      tc.drawImage(layer.canvas, 0, 0, 32, 22);
    }
  },

  renderLayers() {
    const list = document.querySelector('.layers-list');
    if (!list) return;

    list.innerHTML = this.layers.map((l, i) => `
      <div class="layer-item ${i === this.activeLayerIndex ? 'active' : ''}" data-layer-idx="${i}">
        <div class="layer-thumb" data-layer="${i}">
          <canvas width="32" height="22"></canvas>
        </div>
        <div class="layer-info">
          <div class="layer-name" contenteditable="true" data-layer-name="${i}">${l.name}</div>
          <div class="layer-opacity-mini">${Math.round(l.opacity * 100)}%</div>
        </div>
        <div class="layer-controls">
          <button class="layer-control-btn ${l.visible ? 'active' : ''}" data-layer-vis="${i}" title="${l.visible ? 'إخفاء' : 'إظهار'}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${l.visible
                ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
                : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'}
            </svg>
          </button>
          <button class="layer-control-btn ${l.locked ? 'active' : ''}" data-layer-lock="${i}" title="${l.locked ? 'فتح' : 'قفل'}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${l.locked
                ? '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
                : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'}
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    // Draw thumbnails
    this.layers.forEach((l, i) => {
      const thumb = list.querySelector(`.layer-thumb[data-layer="${i}"] canvas`);
      if (thumb && l.canvas) {
        const tc = thumb.getContext('2d');
        tc.clearRect(0, 0, 32, 22);
        tc.drawImage(l.canvas, 0, 0, 32, 22);
      }
    });

    // Bind layer events
    list.querySelectorAll('.layer-item').forEach(item => {
      item.addEventListener('click', e => {
        if (e.target.closest('.layer-control-btn')) return;
        const idx = parseInt(item.dataset.layerIdx);
        this.setActiveLayer(idx);
      });
    });

    list.querySelectorAll('[data-layer-vis]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.layerVis);
        this.layers[idx].visible = !this.layers[idx].visible;
        this.renderLayers(); this.render();
      });
    });

    list.querySelectorAll('[data-layer-lock]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.layerLock);
        this.layers[idx].locked = !this.layers[idx].locked;
        this.renderLayers();
        showNotification(this.layers[idx].locked ? 'تم قفل الطبقة' : 'تم فتح الطبقة', 'info');
      });
    });

    // Layer name editing
    list.querySelectorAll('[data-layer-name]').forEach(el => {
      el.addEventListener('blur', e => {
        const idx = parseInt(el.dataset.layerName);
        this.layers[idx].name = el.textContent.trim() || `الطبقة ${idx + 1}`;
      });
    });

    // Opacity slider for active layer
    this.setupLayerOpacitySlider();
  },

  setupLayerOpacitySlider() {
    const slider = document.getElementById('layer-opacity-slider');
    if (!slider) return;
    const layer = this.layers[this.activeLayerIndex];
    if (layer) {
      slider.value = Math.round(layer.opacity * 100);
      slider.oninput = (e) => {
        this.layers[this.activeLayerIndex].opacity = parseInt(e.target.value) / 100;
        this.render();
        this.renderLayers();
      };
    }
  },

  // ---- Animation ----
  addFrame() {
    const frame = {
      id: 'frame_' + Date.now(),
      duration: Math.round(1000 / this.fps),
      snapshot: null
    };
    this.frames.splice(this.activeFrameIndex + 1, 0, frame);
    this.activeFrameIndex++;
    this.updateTimeline();
    showNotification('تم إضافة إطار جديد', 'success');
  },

  deleteActiveFrame() {
    if (this.frames.length <= 1) {
      showNotification('لا يمكن حذف الإطار الأخير', 'error');
      return;
    }
    this.frames.splice(this.activeFrameIndex, 1);
    this.activeFrameIndex = Math.max(0, this.activeFrameIndex - 1);
    this.updateTimeline();
    showNotification('تم حذف الإطار', 'error');
  },

  saveFrameSnapshot() {
    const frame = this.frames[this.activeFrameIndex];
    if (!frame) return;
    const thumb = document.createElement('canvas');
    thumb.width = 48; thumb.height = 36;
    const tc = thumb.getContext('2d');
    tc.drawImage(this.canvas, 0, 0, 48, 36);
    frame.snapshot = thumb;
    this.updateTimeline();
  },

  togglePlayback() {
    this.isPlaying = !this.isPlaying;
    const btn = document.getElementById('play-btn');
    if (btn) {
      btn.innerHTML = this.isPlaying
        ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
        : `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    }

    if (this.isPlaying) {
      let fi = this.activeFrameIndex;
      this.playInterval = setInterval(() => {
        fi = (fi + 1) % this.frames.length;
        this.activeFrameIndex = fi;
        this.gotoFrame(fi);
        this.updateTimeline();
      }, 1000 / this.fps);
    } else {
      clearInterval(this.playInterval);
    }
  },

  gotoFrame(index) {
    this.activeFrameIndex = index;
    const frame = this.frames[index];
    if (!frame) return;

    if (frame.snapshot) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(frame.snapshot, 0, 0, this.canvas.width, this.canvas.height);
    } else if (frame.fireData !== undefined) {
      this.drawFireFrame(frame.fireData);
    }
  },

  drawFireFrame(frameIndex) {
    const ctx = this.getActiveLayerCtx();
    if (!ctx) return;
    const w = this.canvas.width, h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw fire using canvas drawing
    const frames = [
      // Frame 0: small flame
      [{ x: w/2, y: h/2+80, rx: 40, ry: 60, colors: ['#FF4500','#FF6347','#FFD700'] }],
      // Frame 1: growing
      [{ x: w/2, y: h/2+60, rx: 50, ry: 80, colors: ['#FF2200','#FF4500','#FF8C00'] }],
      // Frame 2: full flame left lean
      [{ x: w/2-15, y: h/2+40, rx: 55, ry: 100, colors: ['#FF1500','#FF4500','#FFA500'] }],
      // Frame 3: full flame
      [{ x: w/2, y: h/2+30, rx: 60, ry: 110, colors: ['#FF0000','#FF4500','#FFD700'] }],
      // Frame 4: right lean
      [{ x: w/2+15, y: h/2+50, rx: 55, ry: 95, colors: ['#FF2200','#FF6347','#FF8C00'] }],
      // Frame 5: shrinking
      [{ x: w/2, y: h/2+70, rx: 45, ry: 70, colors: ['#FF3300','#FF5733','#FFC107'] }],
    ];

    const fi = frameIndex % frames.length;
    const shapes = frames[fi];

    shapes.forEach(shape => {
      const grad = ctx.createRadialGradient(shape.x, shape.y, 0, shape.x, shape.y, Math.max(shape.rx, shape.ry));
      grad.addColorStop(0, shape.colors[2] + 'FF');
      grad.addColorStop(0.4, shape.colors[1] + 'CC');
      grad.addColorStop(0.8, shape.colors[0] + '88');
      grad.addColorStop(1, 'transparent');

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = grad;
      ctx.scale(1, 1.4); // make taller
      ctx.beginPath();
      ctx.ellipse(shape.x, shape.y / 1.4, shape.rx, shape.ry / 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Inner bright core
      const innerGrad = ctx.createRadialGradient(shape.x, shape.y + 20, 0, shape.x, shape.y + 20, shape.rx * 0.5);
      innerGrad.addColorStop(0, '#FFFFFF99');
      innerGrad.addColorStop(0.5, '#FFD70066');
      innerGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.ellipse(shape.x, shape.y + 20, shape.rx * 0.5, shape.ry * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    this.render();
  },

  updateTimeline() {
    const ruler = document.querySelector('.timeline-ruler');
    const framesArea = document.querySelector('.timeline-frames-area');
    if (!ruler || !framesArea) return;

    // Update ruler
    ruler.innerHTML = this.frames.map((_, i) =>
      `<div class="ruler-mark">
         <span class="ruler-label">${i + 1}</span>
         <div class="ruler-tick"></div>
       </div>`
    ).join('');

    // Update frames rows
    const frameRows = document.querySelectorAll('.timeline-frames-row');
    if (frameRows.length > 0) {
      frameRows[0].innerHTML = this.frames.map((f, i) => `
        <div class="timeline-frame ${f.snapshot || f.fireData !== undefined ? 'has-content' : 'empty'} ${i === this.activeFrameIndex ? 'active' : ''}" data-frame="${i}">
          ${f.snapshot ? `<div class="frame-thumb"><canvas width="24" height="18" style="width:24px;height:18px"></canvas></div>` : `<span style="font-size:0.6rem;color:var(--studio-muted)">${i+1}</span>`}
        </div>
      `).join('');

      // Draw thumbnails
      frameRows[0].querySelectorAll('.timeline-frame.has-content canvas').forEach((thumbC, i) => {
        const frame = this.frames[i];
        if (frame.snapshot) {
          const tc = thumbC.getContext('2d');
          tc.drawImage(frame.snapshot, 0, 0, 24, 18);
        }
      });

      // Frame click
      frameRows[0].querySelectorAll('.timeline-frame').forEach((el, i) => {
        el.addEventListener('click', () => {
          this.gotoFrame(i);
          if (this.frames[i].fireData !== undefined) {
            this.drawFireFrame(this.frames[i].fireData);
          }
        });
      });
    }
  },

  // ---- Colors ----
  setForeColor(color) {
    this.foreColor = color;
    const swatch = document.querySelector('.color-swatch-fg');
    if (swatch) swatch.style.background = color;
    const hexInput = document.getElementById('color-hex-input');
    if (hexInput) hexInput.value = color;
  },

  setBackColor(color) {
    this.backColor = color;
    const swatch = document.querySelector('.color-swatch-bg');
    if (swatch) swatch.style.background = color;
  },

  swapColors() {
    [this.foreColor, this.backColor] = [this.backColor, this.foreColor];
    this.setForeColor(this.foreColor);
    this.setBackColor(this.backColor);
  },

  openColorPicker(target) {
    const picker = document.getElementById('color-picker-popup');
    if (!picker) return;
    picker.classList.add('visible');
    picker.dataset.target = target;
    this.initColorPicker(target === 'fg' ? this.foreColor : this.backColor);
  },

  initColorPicker(initialColor) {
    const canvas = document.getElementById('color-spectrum-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    // Draw spectrum
    for (let hue = 0; hue < 360; hue++) {
      const x = (hue / 360) * w;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.fillRect(x, 0, w / 360 + 1, h);
    }

    // White gradient
    const white = ctx.createLinearGradient(0, 0, w, 0);
    white.addColorStop(0, 'rgba(255,255,255,1)');
    white.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = white;
    ctx.fillRect(0, 0, w, h);

    // Black gradient
    const black = ctx.createLinearGradient(0, 0, 0, h);
    black.addColorStop(0, 'rgba(0,0,0,0)');
    black.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = black;
    ctx.fillRect(0, 0, w, h);

    // Bind click
    canvas.onclick = e => {
      const rect = canvas.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * w;
      const py = ((e.clientY - rect.top) / rect.height) * h;
      const pixel = ctx.getImageData(px, py, 1, 1).data;
      const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
      this.applyPickedColor(hex);
    };

    const hexInput = document.getElementById('color-hex-input');
    if (hexInput) {
      hexInput.value = initialColor;
      hexInput.onchange = e => this.applyPickedColor(e.target.value);
    }
  },

  applyPickedColor(hex) {
    const picker = document.getElementById('color-picker-popup');
    const target = picker ? picker.dataset.target : 'fg';
    if (target === 'fg') this.setForeColor(hex);
    else this.setBackColor(hex);

    const hexInput = document.getElementById('color-hex-input');
    if (hexInput) hexInput.value = hex;
  },

  renderColorPalette() {
    const palette = document.querySelector('.color-palette');
    if (!palette) return;
    palette.innerHTML = ColorPalette.categories.map(cat => `
      <div class="palette-category">
        <div class="palette-category-name">${cat.name}</div>
        <div class="palette-colors">
          ${cat.colors.map(c => `
            <div class="palette-color" data-color="${c.hex}" style="background:${c.hex}" title="${c.name}">
              <div class="color-name-tooltip">${c.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    palette.addEventListener('click', e => {
      const colorEl = e.target.closest('.palette-color');
      if (colorEl) {
        this.setForeColor(colorEl.dataset.color);
        showNotification(`اللون: ${colorEl.title}`, 'info');
      }
    });
  },

  // ---- Tool Management ----
  setTool(tool) {
    this.currentTool = tool;
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    this.updateCursorForTool();
  },

  updateCursorForTool() {
    const cursors = {
      brush: 'crosshair', pencil: 'crosshair', marker: 'crosshair', pen: 'crosshair',
      eraser: 'cell', fill: 'cell', eyedropper: 'copy',
      'select-rect': 'default', 'select-ellipse': 'default', lasso: 'default',
      'magic-wand': 'default', move: 'move', hand: 'grab', text: 'text',
      'rect-shape': 'crosshair', 'ellipse-shape': 'crosshair', line: 'crosshair',
      crop: 'crosshair'
    };
    if (this.canvas) {
      this.canvas.style.cursor = cursors[this.currentTool] || 'crosshair';
    }
  },

  setBrushSize(size) {
    this.brushSize = size;
    const slider = document.getElementById('brush-size-slider');
    if (slider) slider.value = size;
    const val = document.querySelector('.brush-size-val');
    if (val) val.textContent = size + 'px';
  },

  // ---- Zoom ----
  setZoom(z) {
    this.zoom = Math.max(0.1, Math.min(32, z));
    this.fitCanvas();
    this.updateZoomDisplay();
  },

  updateZoomDisplay() {
    const el = document.querySelector('.zoom-value');
    if (el) el.textContent = Math.round(this.zoom * 100) + '%';
  },

  // ---- History ----
  saveHistoryState() {
    // Trim future
    this.history = this.history.slice(0, this.historyIndex + 1);

    const snapshot = this.layers.map(l => ({
      id: l.id,
      data: l.canvas.toDataURL()
    }));

    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) this.history.shift();
    else this.historyIndex++;

    this.updateHistoryBtns();
  },

  undo() {
    if (this.historyIndex <= 0) {
      showNotification('لا يوجد ما يمكن التراجع عنه', 'error');
      return;
    }
    this.historyIndex--;
    this.restoreState(this.history[this.historyIndex]);
    showNotification('تراجع', 'info');
  },

  redo() {
    if (this.historyIndex >= this.history.length - 1) {
      showNotification('لا يوجد ما يمكن الإعادة', 'error');
      return;
    }
    this.historyIndex++;
    this.restoreState(this.history[this.historyIndex]);
    showNotification('إعادة', 'info');
  },

  restoreState(snapshot) {
    snapshot.forEach(s => {
      const layer = this.layers.find(l => l.id === s.id);
      if (!layer) return;
      const img = new Image();
      img.src = s.data;
      img.onload = () => {
        const ctx = layer.canvas.getContext('2d');
        ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
        ctx.drawImage(img, 0, 0);
        this.render();
      };
    });
  },

  updateHistoryBtns() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.style.opacity = this.historyIndex <= 0 ? '0.4' : '1';
    if (redoBtn) redoBtn.style.opacity = this.historyIndex >= this.history.length - 1 ? '0.4' : '1';
  },

  // ---- Save & Export ----
  saveProject() {
    const project = { ...this.project };
    project.thumbnail = this.canvas.toDataURL('image/jpeg', 0.4);
    project.savedAt = new Date().toISOString();

    try {
      if (typeof ProjectsManager !== 'undefined') {
        ProjectsManager.saveProject(project);
      } else {
        const projects = JSON.parse(localStorage.getItem('safwan-projects') || '[]');
        const idx = projects.findIndex(p => p.id === project.id);
        if (idx >= 0) projects[idx] = project;
        else projects.unshift(project);
        localStorage.setItem('safwan-projects', JSON.stringify(projects.slice(0, 20)));
      }
    } catch (e) {
      console.warn('Save error:', e);
    }

    showNotification('تم الحفظ بنجاح', 'success');
  },

  loadProjectData() {
    try {
      const projects = JSON.parse(localStorage.getItem('safwan-projects') || '[]');
      const saved = projects.find(p => p.id === this.project.id);
      if (saved && saved.thumbnail) {
        // Project was saved before, restore thumbnail to canvas
      }
    } catch (e) {}
  },

  showExportMenu() {
    const menu = document.getElementById('export-menu');
    if (menu) {
      menu.classList.toggle('visible');
    } else {
      this.createExportMenu();
    }
  },

  createExportMenu() {
    let menu = document.getElementById('export-menu');
    if (menu) { menu.classList.toggle('visible'); return; }

    menu = document.createElement('div');
    menu.id = 'export-menu';
    menu.className = 'context-menu visible';
    menu.style.cssText = 'position:fixed;top:50px;left:200px;z-index:99999;';
    menu.innerHTML = `
      <div class="context-menu-item" data-export="png">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        PNG شفاف (جودة عالية)
      </div>
      <div class="context-menu-item" data-export="png-bg">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        PNG مع خلفية بيضاء
      </div>
      <div class="context-menu-item" data-export="jpeg">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        JPEG جودة عالية
      </div>
      <div class="context-menu-item" data-export="webp">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        WebP (حجم صغير)
      </div>
      ${this.project.type === 'animated' ? `
        <div class="context-menu-sep"></div>
        <div class="context-menu-item" data-export="gif">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          GIF متحرك
        </div>
        <div class="context-menu-item" data-export="webm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          فيديو WebM
        </div>
      ` : ''}
    `;
    document.body.appendChild(menu);

    menu.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        this.exportAs(item.dataset.export);
        menu.classList.remove('visible');
      });
    });

    setTimeout(() => {
      document.addEventListener('click', () => menu.classList.remove('visible'), { once: true });
    }, 100);
  },

  exportAs(format) {
    const name = this.project.name.replace(/\s+/g, '_');
    const link = document.createElement('a');

    if (format === 'png') {
      link.href = this.canvas.toDataURL('image/png');
      link.download = `${name}.png`;
    } else if (format === 'png-bg') {
      const temp = document.createElement('canvas');
      temp.width = this.canvas.width; temp.height = this.canvas.height;
      const tc = temp.getContext('2d');
      tc.fillStyle = '#FFFFFF';
      tc.fillRect(0, 0, temp.width, temp.height);
      tc.drawImage(this.canvas, 0, 0);
      link.href = temp.toDataURL('image/png');
      link.download = `${name}.png`;
    } else if (format === 'jpeg') {
      const temp = document.createElement('canvas');
      temp.width = this.canvas.width; temp.height = this.canvas.height;
      const tc = temp.getContext('2d');
      tc.fillStyle = '#FFFFFF';
      tc.fillRect(0, 0, temp.width, temp.height);
      tc.drawImage(this.canvas, 0, 0);
      link.href = temp.toDataURL('image/jpeg', 0.95);
      link.download = `${name}.jpg`;
    } else if (format === 'webp') {
      link.href = this.canvas.toDataURL('image/webp', 0.9);
      link.download = `${name}.webp`;
    } else if (format === 'gif' || format === 'webm') {
      this.exportAnimation(format, name);
      return;
    }

    link.click();
    showNotification(`تم تصدير ${format.toUpperCase()} بنجاح`, 'success');
  },

  exportAnimation(format, name) {
    // For animation export, we create a series of frames
    if (this.frames.length === 0) return;

    showNotification('جارٍ تصدير الرسوم المتحركة...', 'info');

    // Draw each frame to a temp canvas and collect data URLs
    const frameDataURLs = [];
    const temp = document.createElement('canvas');
    temp.width = this.canvas.width; temp.height = this.canvas.height;
    const tc = temp.getContext('2d');

    for (let i = 0; i < this.frames.length; i++) {
      tc.clearRect(0, 0, temp.width, temp.height);
      tc.fillStyle = '#FFFFFF';
      tc.fillRect(0, 0, temp.width, temp.height);

      const frame = this.frames[i];
      if (frame.snapshot) {
        tc.drawImage(frame.snapshot, 0, 0, temp.width, temp.height);
      } else if (frame.fireData !== undefined) {
        // Draw fire frame
        this.drawFireFrame(frame.fireData);
        tc.drawImage(this.canvas, 0, 0);
      }
      frameDataURLs.push(temp.toDataURL('image/png'));
    }

    // For a real GIF, we'd need gif.js library
    // For now, download first frame + show message
    const link = document.createElement('a');
    link.href = frameDataURLs[0];
    link.download = `${name}_frame1.png`;
    link.click();

    setTimeout(() => showNotification('تم تصدير إطار النموذج. لتصدير GIF كامل، استخدم مكتبة gif.js', 'info'), 500);
  },

  // ---- Reference Image ----
  loadReferenceImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        this.referenceImage = img;
        this.render();
        showNotification('تم تحميل صورة المرجع', 'success');

        const slider = document.getElementById('ref-opacity-slider');
        if (slider) {
          slider.value = 50;
          slider.oninput = e => {
            this.referenceOpacity = parseInt(e.target.value) / 100;
            this.render();
          };
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  // ---- Cursor Info ----
  updateCursorInfo(x, y) {
    const xEl = document.querySelector('.cursor-x');
    const yEl = document.querySelector('.cursor-y');
    if (xEl) xEl.textContent = Math.round(x);
    if (yEl) yEl.textContent = Math.round(y);
  },

  // ---- Context Menu ----
  showContextMenu(cx, cy) {
    let menu = document.getElementById('canvas-context-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'canvas-context-menu';
      menu.className = 'context-menu';
      menu.innerHTML = `
        <div class="context-menu-item" data-action="copy">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          نسخ التحديد
        </div>
        <div class="context-menu-item" data-action="paste">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          لصق
        </div>
        <div class="context-menu-item" data-action="select-all">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>
          تحديد الكل
        </div>
        <div class="context-menu-sep"></div>
        <div class="context-menu-item" data-action="deselect">إلغاء التحديد</div>
        <div class="context-menu-item" data-action="invert-select">عكس التحديد</div>
        <div class="context-menu-sep"></div>
        <div class="context-menu-item" data-action="add-layer">إضافة طبقة</div>
        <div class="context-menu-item danger" data-action="clear-layer">مسح الطبقة الحالية</div>
      `;
      document.body.appendChild(menu);

      menu.addEventListener('click', e => {
        const item = e.target.closest('[data-action]');
        if (!item) return;
        switch (item.dataset.action) {
          case 'copy': this.copySelection(); break;
          case 'paste': this.pasteSelection(); break;
          case 'select-all': this.selectAll(); break;
          case 'deselect': this.deselect(); break;
          case 'add-layer': this.addLayer(); break;
          case 'clear-layer': this.clearActiveLayer(); break;
        }
        menu.classList.remove('visible');
      });
    }

    menu.style.left = cx + 'px';
    menu.style.top = cy + 'px';
    menu.classList.add('visible');
  },

  hideContextMenu() {
    document.getElementById('canvas-context-menu')?.classList.remove('visible');
  },

  clearActiveLayer() {
    const ctx = this.getActiveLayerCtx();
    if (!ctx) return;
    this.saveHistoryState();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.render();
    showNotification('تم مسح الطبقة', 'info');
  },

  // ---- Exit ----
  exitStudio() {
    if (confirm('هل تريد الخروج؟ سيتم حفظ المشروع تلقائياً')) {
      this.saveProject();
      sessionStorage.setItem('safwan-nav-page', 'projects');
      if (window.location.pathname.includes('studio')) {
        window.location.href = 'index.html';
      } else {
        if (typeof Navigation !== 'undefined') {
          Navigation.showPage('projects');
        }
      }
    }
  },

  // ---- UI Updates ----
  updateUI() {
    this.setForeColor(this.foreColor);
    this.setBackColor(this.backColor);
    this.setTool(this.currentTool);
    this.updateHistoryBtns();
  },

  generateBrushPreviews() {
    document.querySelectorAll('.brush-preview canvas').forEach((c, i) => {
      c.width = 36; c.height = 20;
      const ctx = c.getContext('2d');
      const brush = BrushEngine.brushes[i];
      if (brush) {
        brush.drawPreview(ctx, 36, 20);
      }
    });
  }
};

// ============================================================
// BRUSH ENGINE
// ============================================================
const BrushEngine = {
  brushes: [],

  init() {
    this.brushes = [
      // === صفوان بيرمو (Safwan Premium Brushes) ===
      this.createSafwanBrush('فرشاة صفوان 1', 'smooth', '#FF6B35'),
      this.createSafwanBrush('فرشاة صفوان 2', 'textured', '#4ECDC4'),
      this.createSafwanBrush('فرشاة صفوان 3', 'wet', '#9B5DE5'),
      this.createSafwanBrush('فرشاة صفوان 4', 'charcoal', '#F7C948'),
      this.createSafwanBrush('فرشاة صفوان 5', 'watercolor', '#F15BB5'),
      // === Standard Brushes ===
      this.createBrush('قلم عادي', 'round'),
      this.createBrush('قلم حبر', 'ink'),
      this.createBrush('فرشاة ناعمة', 'soft'),
      this.createBrush('فرشاة صلبة', 'hard'),
      this.createBrush('فرشاة مسطحة', 'flat'),
      this.createBrush('قلم رصاص', 'pencil'),
      this.createBrush('فحم', 'charcoal'),
      this.createBrush('ألوان مائية', 'watercolor'),
      this.createBrush('ألوان زيتية', 'oil'),
      this.createBrush('اسفنج', 'sponge'),
      this.createBrush('قلم جاف', 'ballpoint'),
      this.createBrush('قلم بكسل', 'pixel'),
      this.createBrush('فرشاة الكاليغرافيا', 'calligraphy'),
      this.createBrush('فرشاة مرذاذ', 'spray'),
      this.createBrush('فرشاة ضبابية', 'fog'),
      this.createBrush('فرشاة بنية', 'grain'),
      this.createBrush('فرشاة خشبية', 'wood'),
      this.createBrush('فرشاة وبرية', 'fur'),
      this.createBrush('فرشاة ريش', 'feather'),
      this.createBrush('فرشاة حبيبية', 'particle'),
      this.createBrush('قلم تقني', 'technical'),
      this.createBrush('فرشاة كرتون', 'cartoon'),
      this.createBrush('فرشاة كومكس', 'comics'),
      this.createBrush('فرشاة بلاستيك', 'plastic'),
      this.createBrush('فرشاة معدن', 'metal'),
      this.createBrush('فرشاة قماش', 'canvas'),
      this.createBrush('فرشاة طين', 'clay'),
      this.createBrush('فرشاة مطر', 'rain'),
      this.createBrush('فرشاة نجوم', 'stars'),
      this.createBrush('فرشاة أوراق', 'leaves'),
      this.createBrush('فرشاة شعر', 'hair'),
      this.createBrush('فرشاة فراشة', 'butterfly'),
      this.createBrush('فرشاة دائري', 'circular'),
      this.createBrush('قلم مزدوج', 'dual'),
      this.createBrush('فرشاة رسم تعبيري', 'expressive'),
      this.createBrush('قلم طباعة', 'print'),
      this.createBrush('فرشاة رسم مبسط', 'simple'),
      this.createBrush('فرشاة ناعمة 2', 'soft2'),
      this.createBrush('فرشاة تلوين', 'coloring'),
      this.createBrush('قلم أقواس', 'arcs'),
      this.createBrush('فرشاة ضوء', 'glow'),
      this.createBrush('فرشاة ظل', 'shadow'),
      this.createBrush('فرشاة حرارة', 'heat'),
      this.createBrush('فرشاة نيون', 'neon'),
      this.createBrush('فرشاة نسيج', 'weave'),
      this.createBrush('فرشاة خطوط', 'lines'),
    ];
  },

  createSafwanBrush(name, type, color) {
    return {
      name,
      type,
      premium: true,
      draw(ctx, x, y, size, fgColor, hardness = 0.8) {
        ctx.save();
        const h = parseFloat(hardness);
        let grad;

        switch (type) {
          case 'smooth':
            grad = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
            grad.addColorStop(0, fgColor + 'FF');
            grad.addColorStop(h, fgColor + 'CC');
            grad.addColorStop(1, fgColor + '00');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'textured':
            for (let i = 0; i < 8; i++) {
              const ang = (i / 8) * Math.PI * 2;
              const r = size * 0.3 * Math.random();
              const tx = x + Math.cos(ang) * r;
              const ty = y + Math.sin(ang) * r;
              ctx.fillStyle = fgColor + Math.floor(180 + Math.random() * 75).toString(16).padStart(2, '0');
              ctx.beginPath();
              ctx.arc(tx, ty, size * 0.1 * Math.random(), 0, Math.PI * 2);
              ctx.fill();
            }
            break;

          case 'wet':
            grad = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
            grad.addColorStop(0, fgColor + 'AA');
            grad.addColorStop(0.5, fgColor + '66');
            grad.addColorStop(1, fgColor + '11');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, size / 2 * 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = fgColor;
            ctx.beginPath();
            ctx.arc(x, y, size * 0.1, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'charcoal':
            ctx.globalAlpha = 0.15;
            for (let i = 0; i < 12; i++) {
              const dx = (Math.random() - 0.5) * size;
              const dy = (Math.random() - 0.5) * size * 0.2;
              ctx.fillStyle = fgColor;
              ctx.fillRect(x + dx, y + dy, size * 0.05, size * 0.02);
            }
            break;

          case 'watercolor':
            for (let i = 0; i < 6; i++) {
              const r = size * (0.3 + Math.random() * 0.5);
              const dx = (Math.random() - 0.5) * size * 0.6;
              const dy = (Math.random() - 0.5) * size * 0.6;
              grad = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
              grad.addColorStop(0, fgColor + '55');
              grad.addColorStop(0.7, fgColor + '22');
              grad.addColorStop(1, 'transparent');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
        }
        ctx.restore();
      },
      drawPreview(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const mid = h / 2;
        for (let x = 4; x < w - 4; x += 3) {
          const y = mid + Math.sin(x / 6) * 5;
          const s = 4 + Math.sin(x / 8) * 2;
          this.draw(ctx, x, y, s, color, 0.8);
        }
      }
    };
  },

  createBrush(name, type) {
    return {
      name,
      type,
      premium: false,
      draw(ctx, x, y, size, fgColor, hardness = 0.8) {
        ctx.save();
        let grad;

        switch (type) {
          case 'round': case 'soft':
            grad = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
            grad.addColorStop(0, fgColor + 'FF');
            grad.addColorStop(hardness, fgColor + 'BB');
            grad.addColorStop(1, fgColor + '00');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'hard':
            ctx.fillStyle = fgColor;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'pencil':
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = fgColor;
            ctx.beginPath();
            ctx.ellipse(x, y, size * 0.3, size * 0.15, Math.random() * 0.5, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'ink':
            ctx.fillStyle = fgColor;
            ctx.beginPath();
            ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'flat':
            ctx.fillStyle = fgColor;
            ctx.fillRect(x - size / 2, y - size * 0.15, size, size * 0.3);
            break;

          case 'spray':
            ctx.globalAlpha = 0.05;
            for (let i = 0; i < 20; i++) {
              const angle = Math.random() * Math.PI * 2;
              const r = Math.random() * size / 2;
              ctx.fillStyle = fgColor;
              ctx.beginPath();
              ctx.arc(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 1, 0, Math.PI * 2);
              ctx.fill();
            }
            break;

          case 'calligraphy':
            ctx.fillStyle = fgColor;
            ctx.save();
            ctx.rotate(Math.PI / 6);
            ctx.fillRect(x - size * 0.5, y - size * 0.1, size, size * 0.2);
            ctx.restore();
            break;

          case 'pixel':
            ctx.fillStyle = fgColor;
            const ps = Math.max(2, Math.floor(size / 3));
            const px = Math.floor(x / ps) * ps;
            const py = Math.floor(y / ps) * ps;
            ctx.fillRect(px, py, ps, ps);
            break;

          case 'glow':
            for (let i = 3; i >= 1; i--) {
              grad = ctx.createRadialGradient(x, y, 0, x, y, size * i * 0.4);
              grad.addColorStop(0, fgColor + (i === 1 ? 'FF' : '44'));
              grad.addColorStop(1, 'transparent');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(x, y, size * i * 0.4, 0, Math.PI * 2);
              ctx.fill();
            }
            break;

          case 'neon':
            ctx.shadowBlur = size;
            ctx.shadowColor = fgColor;
            grad = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(0.3, fgColor);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;

          default:
            // Default smooth brush
            grad = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
            grad.addColorStop(0, fgColor + 'CC');
            grad.addColorStop(1, fgColor + '00');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
      },

      drawPreview(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const mid = h / 2;
        for (let x = 4; x < w - 4; x += 2) {
          const y = mid + Math.sin(x / 5) * 6;
          const s = 3 + Math.sin(x / 7) * 2;
          this.draw(ctx, x, y, s, '#888888', 0.8);
        }
      }
    };
  }
};

// ============================================================
// COLOR PALETTE (1000+ colors)
// ============================================================
const ColorPalette = {
  categories: []
};

// Build massive palette
(function buildPalette() {
  // Skin tones
  const skin = [
    { hex: '#FDDCB5', name: 'بشرة فاتحة جداً' },
    { hex: '#F7C89B', name: 'بشرة فاتحة' },
    { hex: '#E8B88A', name: 'بشرة فاتحة متوسطة' },
    { hex: '#D4A574', name: 'بشرة متوسطة' },
    { hex: '#C19A6B', name: 'بشرة ذهبية' },
    { hex: '#B08850', name: 'بشرة بنية فاتحة' },
    { hex: '#A0724A', name: 'بشرة بنية' },
    { hex: '#8B6240', name: 'بشرة بنية داكنة' },
    { hex: '#7A5030', name: 'بشرة برونزية' },
    { hex: '#6B3F20', name: 'بشرة بنية غامقة' },
    { hex: '#5C3218', name: 'بشرة داكنة' },
    { hex: '#4A2510', name: 'بشرة داكنة جداً' },
    { hex: '#3A1C08', name: 'بشرة عميقة' },
    { hex: '#E8D5C0', name: 'بشرة وردية فاتحة' },
    { hex: '#D4B89A', name: 'بشرة خوخية' },
    { hex: '#C09A78', name: 'بشرة عسلية' },
    { hex: '#AA8060', name: 'بشرة كاراميل' },
    { hex: '#906848', name: 'بشرة قهوة بالحليب' },
    { hex: '#785038', name: 'بشرة خشبية' },
    { hex: '#603828', name: 'بشرة تراب' },
  ];

  // Build color ramp for a hue
  const ramp = (name, hues) => {
    const colors = [];
    const shades = [95, 90, 80, 70, 60, 50, 40, 30, 20, 15];
    hues.forEach((h, hi) => {
      shades.forEach((l, li) => {
        const s = 70 + (li % 3) * 10;
        const hex = hslToHex(h, s, l);
        colors.push({ hex, name: `${name} ${shades.length * hi + li + 1}` });
      });
    });
    return colors;
  };

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

  ColorPalette.categories = [
    { name: 'بشرة وجلد', colors: skin },
    { name: 'أحمر ووردي', colors: ramp('أحمر', [0, 350, 340, 330, 320]) },
    { name: 'برتقالي وأصفر', colors: ramp('دافئ', [30, 40, 50, 55, 45]) },
    { name: 'أخضر', colors: ramp('أخضر', [120, 130, 140, 150, 110]) },
    { name: 'أزرق وسماوي', colors: ramp('أزرق', [200, 210, 220, 230, 195]) },
    { name: 'بنفسجي ووردي', colors: ramp('بنفسجي', [270, 280, 290, 300, 260]) },
    {
      name: 'رمادي ومحايد',
      colors: [
        '#FFFFFF','#F8F8F8','#F0F0F0','#E8E8E8','#E0E0E0',
        '#D0D0D0','#C0C0C0','#B0B0B0','#A0A0A0','#909090',
        '#808080','#707070','#606060','#505050','#404040',
        '#303030','#202020','#181818','#101010','#000000'
      ].map((h, i) => ({ hex: h, name: `رمادي ${i + 1}` }))
    },
    {
      name: 'ألوان محترفة',
      colors: [
        { hex: '#FF6B35', name: 'برتقالي صفوان' },
        { hex: '#F7C948', name: 'ذهبي' },
        { hex: '#4ECDC4', name: 'تيل' },
        { hex: '#9B5DE5', name: 'بنفسجي' },
        { hex: '#F15BB5', name: 'وردي' },
        { hex: '#00BBF9', name: 'أزرق' },
        { hex: '#00F5FF', name: 'سيان' },
        { hex: '#7FFF00', name: 'أخضر نيون' },
        { hex: '#FF1493', name: 'وردي عميق' },
        { hex: '#FF4500', name: 'أحمر برتقالي' },
        { hex: '#8B0000', name: 'أحمر داكن' },
        { hex: '#006400', name: 'أخضر داكن' },
        { hex: '#000080', name: 'كحلي' },
        { hex: '#4B0082', name: 'نيلي' },
        { hex: '#800080', name: 'موف' },
        { hex: '#D2691E', name: 'شوكولا' },
        { hex: '#CD853F', name: 'بيرو' },
        { hex: '#DAA520', name: 'ذهبي داكن' },
        { hex: '#B8860B', name: 'ذهبي قاتم' },
        { hex: '#2F4F4F', name: 'أخضر رمادي داكن' },
      ]
    }
  ];
})();

// ============================================================
// INITIALIZE STUDIO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  BrushEngine.init();

  // Get current project
  let project = null;

  // Try sessionStorage first (from landing page)
  const stored = sessionStorage.getItem('safwan-current-project');
  if (stored) {
    try {
      project = JSON.parse(stored);
      sessionStorage.removeItem('safwan-current-project');
    } catch (e) {}
  }

  // If on studio.html directly without a project, create default
  if (!project && document.getElementById('main-canvas')) {
    project = {
      id: 'proj_default_' + Date.now(),
      name: 'مشروع جديد',
      type: 'static',
      width: 1080, height: 1080,
      dpi: 72,
      bgColor: '#FFFFFF',
      created: new Date().toISOString(),
      layers: [],
      frames: []
    };
  }

  if (project && document.getElementById('main-canvas')) {
    Studio.init(project);
  }

  // Listen for studio:open event (single-page mode)
  document.addEventListener('studio:open', e => {
    Studio.init(e.detail);
  });
});
