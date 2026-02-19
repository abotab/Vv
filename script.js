// script.js - الجزء الأول: المتغيرات والتهيئة

// ==================== المتغيرات العامة ====================
let canvas, fabricCanvas;
let currentTool = 'فرشاة_رصاص';
let currentColor = '#000000';
let currentOpacity = 1;
let brushSize = 5;
let currentProjectType = 'static';
let projectName = 'مشروع جديد';
let projects = JSON.parse(localStorage.getItem('safwan_projects_v2')) || [];
let currentProjectId = null;
let isPlaying = false;
let currentFrame = 0;
let frames = [];
let fps = 24;
let animationInterval;
let layers = [];
let currentLayerIndex = 0;
let rigMode = false;
let selectedObject = null;
let exportBG = 'white';

// بيانات الأدوات (15 أداة لكل مجموعة)
const drawingTools = [
    { id: 'فرشاة_رصاص', name: 'قلم رصاص', icon: 'pencil', category: 'sketch' },
    { id: 'قلم_حبر', name: 'قلم حبر', icon: 'pen', category: 'ink' },
    { id: 'فرشاة_مائية', name: 'فرشاة مائية', icon: 'watercolor', category: 'paint' },
    { id: 'فرشاة_زيتية', name: 'فرشاة زيتية', icon: 'oil', category: 'paint' },
    { id: 'فحم', name: 'فحم رسم', icon: 'charcoal', category: 'sketch' },
    { id: 'بخاخ', name: 'بخاخ Airbrush', icon: 'airbrush', category: 'effect' },
    { id: 'تظليل', name: 'أداة تظليل', icon: 'shade', category: 'sketch' },
    { id: 'دمج', name: 'أداة دمج', icon: 'blend', category: 'effect' },
    { id: 'تفتيح', name: 'تفتيح/تظليم', icon: 'dodge', category: 'effect' },
    { id: 'ممحاة', name: 'ممحاة ناعمة', icon: 'eraser', category: 'utility' },
    { id: 'دلو_تلوين', name: 'دلو التلوين', icon: 'bucket', category: 'utility' },
    { id: 'استنساخ', name: 'استنساخ', icon: 'clone', category: 'utility' },
    { id: 'تدرج', name: 'تدرج لوني', icon: 'gradient', category: 'effect' },
    { id: 'نمط', name: 'نمط/باترن', icon: 'pattern', category: 'effect' },
    { id: 'تجاويف', name: 'تجاويف/Relief', icon: 'emboss', category: 'effect' }
];

const transformTools = [
    { id: 'تحديد', name: 'تحديد حر', icon: 'lasso', action: 'select' },
    { id: 'تحديد_مستطيل', name: 'تحديد مستطيل', icon: 'rect-select', action: 'rect-select' },
    { id: 'تحديد_دائري', name: 'تحديد دائري', icon: 'circle-select', action: 'circle-select' },
    { id: 'عصا_سحرية', name: 'عصا سحرية', icon: 'wand', action: 'magic-wand' },
    { id: 'تحريك', name: 'تحريك', icon: 'move', action: 'move' },
    { id: 'تدوير', name: 'تدوير 390°', icon: 'rotate', action: 'rotate' },
    { id: 'تحجيم', name: 'تحجيم', icon: 'scale', action: 'scale' },
    { id: 'انحراف', name: 'انحراف/Skew', icon: 'skew', action: 'skew' },
    { id: 'انعكاس', name: 'انعكاس', icon: 'flip', action: 'flip' },
    { id: 'تشويه', name: 'تشويه/Warp', icon: 'warp', action: 'warp' },
    { id: 'منظور', name: 'منظور', icon: 'perspective', action: 'perspective' },
    { id: 'تكرار', name: 'تكرار/Clone', icon: 'duplicate', action: 'duplicate' },
    { id: 'اقتصاص', name: 'اقتصاص', icon: 'crop', action: 'crop' },
    { id: 'تعديل_منحنى', name: 'تعديل المنحنى', icon: 'curve', action: 'curve' },
    { id: 'نقاط_تحكم', name: 'نقاط تحكم', icon: 'control-points', action: 'control-points' }
];

const layersTools = [
    { id: 'طبقة_جديدة', name: 'طبقة جديدة', icon: 'new-layer', action: 'new-layer' },
    { id: 'نسخ_طبقة', name: 'نسخ طبقة', icon: 'copy-layer', action: 'copy-layer' },
    { id: 'حذف_طبقة', name: 'حذف طبقة', icon: 'delete-layer', action: 'delete-layer' },
    { id: 'دمج_لأسفل', name: 'دمج للأسفل', icon: 'merge-down', action: 'merge-down' },
    { id: 'دمج_الكل', name: 'دمج الكل', icon: 'merge-all', action: 'merge-all' },
    { id: 'عظام_الشخصية', name: 'عظام الشخصية', icon: 'rig-character', action: 'rig-character' },
    { id: 'عظام_الشكل', name: 'عظام الشكل', icon: 'rig-shape', action: 'rig-shape' },
    { id: 'قناع_قص', name: 'قناع قص', icon: 'clip-mask', action: 'clip-mask' },
    { id: 'قناع_تعتيم', name: 'قناع تعتيم', icon: 'opacity-mask', action: 'opacity-mask' },
    { id: 'تأثيرات_طبقة', name: 'تأثيرات الطبقة', icon: 'layer-effects', action: 'layer-effects' },
    { id: 'تصفية_ذكية', name: 'تصفية ذكية', icon: 'smart-filter', action: 'smart-filter' },
    { id: 'ضبط_الألوان', name: 'ضبط الألوان', icon: 'color-adjust', action: 'color-adjust' },
    { id: 'مزج_الطبقات', name: 'مزج الطبقات', icon: 'blend-modes', action: 'blend-modes' },
    { id: 'قفل_طبقة', name: 'قفل الطبقة', icon: 'lock-layer', action: 'lock-layer' },
    { id: 'إخفاء_طبقة', name: 'إخفاء/إظهار', icon: 'hide-layer', action: 'hide-layer' }
];

// ==================== الفرش الاحترافية (50 فرشاة بأسماء عربية) ====================
const brushesLibrary = {
    'قلم_رصاص': {
        name: 'قلم رصاص HB',
        type: 'pencil',
        size: 3,
        opacity: 0.9,
        color: '#2d2d2d',
        shadowBlur: 0,
        lineCap: 'round',
        lineJoin: 'round'
    },
    'قلم_حبر': {
        name: 'قلم حبر سائل',
        type: 'ink',
        size: 2,
        opacity: 1,
        color: '#000000',
        shadowBlur: 0,
        lineCap: 'round',
        lineJoin: 'miter'
    },
    'فرشاة_مائية': {
        name: 'فرشاة مائية',
        type: 'watercolor',
        size: 15,
        opacity: 0.3,
        color: '#4a90e2',
        shadowBlur: 10,
        lineCap: 'round',
        lineJoin: 'round'
    },
    'فرشاة_زيتية': {
        name: 'فرشاة زيتية',
        type: 'oil',
        size: 20,
        opacity: 0.8,
        color: '#d4a373',
        shadowBlur: 5,
        lineCap: 'square',
        lineJoin: 'bevel'
    },
    'فحم': {
        name: 'فحم رسم',
        type: 'charcoal',
        size: 8,
        opacity: 0.6,
        color: '#3d3d3d',
        shadowBlur: 2,
        lineCap: 'round',
        lineJoin: 'round'
    },
    'بخاخ': {
        name: 'بخاخ Airbrush',
        type: 'airbrush',
        size: 25,
        opacity: 0.4,
        color: '#ff6b6b',
        shadowBlur: 20,
        lineCap: 'round',
        lineJoin: 'round'
    }
};

// ==================== التهيئة ====================
window.onload = function() {
    initFabricCanvas();
    initColorWheel();
    loadProjects();
    setupEventListeners();
    populateToolsMenus();
};

function initFabricCanvas() {
    const canvasEl = document.getElementById('main-canvas');
    const container = document.getElementById('canvas-container');
    
    // حساب الحجم الأمثل للهاتف
    const width = Math.min(container.clientWidth - 40, 800);
    const height = Math.min(container.clientHeight - 40, 1000);
    
    canvasEl.width = width;
    canvasEl.height = height;
    
    fabricCanvas = new fabric.Canvas('main-canvas', {
        width: width,
        height: height,
        backgroundColor: '#ffffff',
        isDrawingMode: true,
        selection: true,
        preserveObjectStacking: true
    });
    
    // إعداد الفرشاة الافتراضية
    setupBrush('قلم_رصاص');
    
    // أحداث التحديد
    fabricCanvas.on('selection:created', function(e) {
        selectedObject = e.selected[0];
        showTransformControls();
    });
    
    fabricCanvas.on('selection:cleared', function() {
        selectedObject = null;
        hideTransformControls();
    });
    
    // إنشاء طبقة أولى
    addLayer();
}

function setupBrush(brushId) {
    const brushData = brushesLibrary[brushId] || brushesLibrary['قلم_رصاص'];
    
    fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush.width = brushData.size;
    fabricCanvas.freeDrawingBrush.color = currentColor;
    
    // تطبيق خصائص الفرشاة
    if (brushData.type === 'watercolor') {
        fabricCanvas.freeDrawingBrush.shadow = new fabric.Shadow({
            blur: brushData.shadowBlur,
            color: currentColor,
            offsetX: 0,
            offsetY: 0
        });
    } else if (brushData.type === 'airbrush') {
        fabricCanvas.freeDrawingBrush.shadow = new fabric.Shadow({
            blur: brushData.shadowBlur,
            color: currentColor,
            offsetX: 0,
            offsetY: 0
        });
    }
    
    currentTool = brushId;
}

// ==================== إدارة الشاشات ====================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if (screenId === 'gallery-screen') {
        loadProjects();
    }
}

function createProject(type) {
    currentProjectType = type;
    projectName = type === 'static' ? 'رسم جديد' : type === 'animation' ? 'مشروع متحرك' : 'تعديل صورة';
    currentProjectId = Date.now();
    
    // إعادة تعيين Canvas
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    
    layers = [{
        id: 1,
        name: 'الطبقة الأساسية',
        visible: true,
        locked: false,
        canvas: fabricCanvas.toJSON()
    }];
    currentLayerIndex = 0;
    
    // إظهار/إخفاء شريط الرسوم المتحركة
    const animToolbar = document.getElementById('animation-toolbar');
    if (type === 'animation') {
        animToolbar.style.display = 'flex';
        frames = [fabricCanvas.toJSON()];
        currentFrame = 0;
        updateTimeline();
    } else {
        animToolbar.style.display = 'none';
    }
    
    document.getElementById('current-project-name').textContent = projectName;
    showScreen('canvas-screen');
    updateLayersList();
}

// ==================== إدارة المشاريع ====================
function saveAndExit() {
    saveProject();
    showScreen('gallery-screen');
}

function saveProject() {
    const thumbnail = fabricCanvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 0.2
    });
    
    const projectData = {
        id: currentProjectId || Date.now(),
        name: projectName,
        type: currentProjectType,
        date: new Date().toLocaleDateString('ar-SA'),
        thumbnail: thumbnail,
        data: fabricCanvas.toJSON(),
        layers: layers,
        frames: frames,
        fps: fps
    };
    
    const existingIndex = projects.findIndex(p => p.id === projectData.id);
    if (existingIndex >= 0) {
        projects[existingIndex] = projectData;
    } else {
        projects.push(projectData);
    }
    
    localStorage.setItem('safwan_projects_v2', JSON.stringify(projects));
}

function loadProjects() {
    const grid = document.getElementById('projects-grid');
    grid.innerHTML = '';
    
    // بطاقة إنشاء جديد
    grid.innerHTML += `
        <div class="new-project-card" onclick="showScreen('project-type-screen')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span>مشروع جديد</span>
        </div>
    `;
    
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        const typeLabel = project.type === 'static' ? 'رسم' : project.type === 'animation' ? 'متحرك' : 'صورة';
        
        card.innerHTML = `
            <div class="project-thumbnail">
                ${project.thumbnail ? `<img src="${project.thumbnail}" alt="${project.name}">` : 
                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="M21 15l-5-5L5 21"/>
                </svg>`}
            </div>
            <div class="project-info-card">
                <div class="project-name">${project.name}</div>
                <div class="project-meta">
                    <span>${typeLabel}</span>
                    <span>${project.date}</span>
                </div>
            </div>
        `;
        card.onclick = () => loadProject(project);
        grid.appendChild(card);
    });
}

function loadProject(project) {
    currentProjectId = project.id;
    projectName = project.name;
    currentProjectType = project.type;
    document.getElementById('current-project-name').textContent = projectName;
    
    // استعادة البيانات
    fabricCanvas.loadFromJSON(project.data, function() {
        fabricCanvas.renderAll();
    });
    
    if (project.layers) {
        layers = project.layers;
        updateLayersList();
    }
    
    if (project.type === 'animation' && project.frames) {
        frames = project.frames;
        fps = project.fps || 24;
        document.getElementById('fps-select').value = fps;
        updateTimeline();
        document.getElementById('animation-toolbar').style.display = 'flex';
    } else {
        document.getElementById('animation-toolbar').style.display = 'none';
    }
    
    showScreen('canvas-screen');
}

// ==================== استيراد الصور ====================
function importImageToProject() {
    document.getElementById('image-import').click();
}

function handleImageImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        fabric.Image.fromURL(e.target.result, function(img) {
            // حساب الحجم المناسب
            const canvasWidth = fabricCanvas.width;
            const canvasHeight = fabricCanvas.height;
            const scale = Math.min(
                (canvasWidth * 0.8) / img.width,
                (canvasHeight * 0.8) / img.height,
                1
            );
            
            img.set({
                left: canvasWidth / 2,
                top: canvasHeight / 2,
                originX: 'center',
                originY: 'center',
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                hasControls: true,
                hasBorders: true
            });
            
            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            fabricCanvas.renderAll();
            
            // إضافة طبقة للصورة
            addLayer('صورة مستوردة');
        });
    };
    reader.readAsDataURL(file);
}

// ==================== نظام الطبقات المحسّن ====================
function addLayer(name = null) {
    const layerName = name || `طبقة ${layers.length + 1}`;
    const newLayer = {
        id: Date.now(),
        name: layerName,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        data: fabricCanvas.toJSON()
    };
    
    layers.push(newLayer);
    currentLayerIndex = layers.length - 1;
    updateLayersList();
}

function updateLayersList() {
    const list = document.getElementById('layers-list');
    list.innerHTML = '';
    
    // عرض الطبقات من الأعلى للأسفل
    [...layers].reverse().forEach((layer, reversedIndex) => {
        const index = layers.length - 1 - reversedIndex;
        const item = document.createElement('div');
        item.className = `layer-item ${index === currentLayerIndex ? 'active' : ''} ${!layer.visible ? 'hidden' : ''}`;
        
        item.innerHTML = `
            <div class="layer-visibility ${layer.visible ? 'active' : ''}" onclick="toggleLayerVisibility(${index}, event)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${layer.visible ? 
                        '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' : 
                        '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'}
                </svg>
            </div>
            <div class="layer-thumbnail">
                <canvas width="40" height="40"></canvas>
            </div>
            <div class="layer-info">
                <div class="layer-name">${layer.name}</div>
                <div class="layer-blend">${layer.blendMode}</div>
            </div>
        `;
        
        item.onclick = (e) => {
            if (!e.target.closest('.layer-visibility')) {
                setCurrentLayer(index);
            }
        };
        
        list.appendChild(item);
    });
}

function setCurrentLayer(index) {
    currentLayerIndex = index;
    updateLayersList();
    
    // تحديث Canvas لعرض الطبقة المحددة
    if (layers[index] && layers[index].data) {
        fabricCanvas.loadFromJSON(layers[index].data, function() {
            fabricCanvas.renderAll();
        });
    }
}

function toggleLayerVisibility(index, event) {
    if (event) event.stopPropagation();
    
    layers[index].visible = !layers[index].visible;
    
    // تحديث عرض Canvas
    if (layers[index].visible) {
        fabricCanvas.setOpacity(1);
    } else {
        // إخفاء الكائنات في هذه الطبقة
        fabricCanvas.getObjects().forEach(obj => {
            obj.set('visible', false);
        });
    }
    
    updateLayersList();
    fabricCanvas.renderAll();
}

function mergeSelectedLayers() {
    if (currentLayerIndex <= 0) return;
    
    const current = layers[currentLayerIndex];
    const below = layers[currentLayerIndex - 1];
    
    if (!current.visible || !below.visible) {
        alert('لا يمكن دمج طبقات مخفية');
        return;
    }
    
    // دمج البيانات
    fabricCanvas.loadFromJSON(below.data, function() {
        fabricCanvas.loadFromJSON(current.data, function() {
            below.data = fabricCanvas.toJSON();
            layers.splice(currentLayerIndex, 1);
            currentLayerIndex--;
            updateLayersList();
        }, function(obj, target) {
            fabricCanvas.add(obj);
        });
    });
}

// ==================== الرسوم المتحركة ====================
function addFrame() {
    const frameData = fabricCanvas.toJSON();
    frames.splice(currentFrame + 1, 0, frameData);
    currentFrame++;
    updateTimeline();
}

function copyFrame() {
    if (frames.length === 0) return;
    const frameData = JSON.parse(JSON.stringify(frames[currentFrame]));
    frames.splice(currentFrame + 1, 0, frameData);
    currentFrame++;
    updateTimeline();
}

function deleteFrame() {
    if (frames.length <= 1) return;
    frames.splice(currentFrame, 1);
    if (currentFrame >= frames.length) currentFrame = frames.length - 1;
    loadFrame(currentFrame);
    updateTimeline();
}

function updateTimeline() {
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    
    frames.forEach((frame, index) => {
        const thumb = document.createElement('div');
        thumb.className = `frame-thumb ${index === currentFrame ? 'active' : ''}`;
        thumb.onclick = () => {
            saveCurrentFrame();
            currentFrame = index;
            loadFrame(index);
            updateTimeline();
        };
        
        // إنشاء صورة مصغرة للإطار
        const canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 35;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 50, 35);
        
        thumb.appendChild(canvas);
        timeline.appendChild(thumb);
    });
    
    document.getElementById('current-frame-display').textContent = `إطار: ${currentFrame + 1}/${frames.length}`;
}

function saveCurrentFrame() {
    if (currentProjectType === 'animation') {
        frames[currentFrame] = fabricCanvas.toJSON();
    }
}

function loadFrame(index) {
    if (frames[index]) {
        fabricCanvas.loadFromJSON(frames[index], function() {
            fabricCanvas.renderAll();
        });
    }
}

function togglePlayback() {
    isPlaying = !isPlaying;
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        startPlayback();
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        stopPlayback();
    }
}

function startPlayback() {
    const interval = 1000 / fps;
    animationInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % frames.length;
        loadFrame(currentFrame);
        updateTimeline();
    }, interval);
}

function stopPlayback() {
    clearInterval(animationInterval);
}

function changeFPS(value) {
    fps = parseInt(value);
    if (isPlaying) {
        stopPlayback();
        startPlayback();
    }
}

// ==================== أدوات التحويل ====================
function showTransformControls() {
    if (!selectedObject) return;
    
    // إظهار نقاط التحكم للتدوير 390 درجة
    selectedObject.set({
        hasControls: true,
        hasBorders: true,
        transparentCorners: false,
        cornerColor: '#667eea',
        cornerStrokeColor: '#ffffff',
        cornerSize: 12,
        rotatingPointOffset: 30
    });
    
    fabricCanvas.renderAll();
}

function hideTransformControls() {
    fabricCanvas.renderAll();
}

// ==================== نظام العظام (Rigging) ====================
function toggleRigMode() {
    rigMode = !rigMode;
    const rigsContainer = document.getElementById('rigs-container');
    
    if (rigMode) {
        rigsContainer.innerHTML = '';
        rigsContainer.style.pointerEvents = 'auto';
        createRigForSelectedObject();
    } else {
        rigsContainer.innerHTML = '';
        rigsContainer.style.pointerEvents = 'none';
    }
}

function createRigForSelectedObject() {
    if (!selectedObject) return;
    
    const obj = selectedObject;
    const points = [
        { x: obj.left, y: obj.top, name: 'مركز' },
        { x: obj.left - obj.width/2, y: obj.top - obj.height/2, name: 'أعلى يسار' },
        { x: obj.left + obj.width/2, y: obj.top - obj.height/2, name: 'أعلى يمين' },
        { x: obj.left - obj.width/2, y: obj.top + obj.height/2, name: 'أسفل يسار' },
        { x: obj.left + obj.width/2, y: obj.top + obj.height/2, name: 'أسفل يمين' }
    ];
    
    const rigsContainer = document.getElementById('rigs-container');
    
    points.forEach((point, index) => {
        const rigPoint = document.createElement('div');
        rigPoint.className = 'rig-point';
        rigPoint.style.left = point.x + 'px';
        rigPoint.style.top = point.y + 'px';
        rigPoint.dataset.index = index;
        rigPoint.title = point.name;
        
        rigPoint.addEventListener('mousedown', startRigDrag);
        rigPoint.addEventListener('touchstart', startRigDrag, {passive: false});
        
        rigsContainer.appendChild(rigPoint);
    });
}

function startRigDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const point = e.target;
    const startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    const initialLeft = parseFloat(point.style.left);
    const initialTop = parseFloat(point.style.top);
    
    function drag(e) {
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        
        point.style.left = (initialLeft + deltaX) + 'px';
        point.style.top = (initialTop + deltaY) + 'px';
        
        // تحديث الشكل
        if (selectedObject) {
            const index = parseInt(point.dataset.index);
            updateObjectFromRig(selectedObject, index, initialLeft + deltaX, initialTop + deltaY);
        }
    }
    
    function stopDrag() {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', stopDrag);
    }
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', drag, {passive: false});
    document.addEventListener('touchend', stopDrag);
}

function updateObjectFromRig(obj, pointIndex, x, y) {
    // تحديث خصائص الكائن بناءً على نقطة العظم المحركة
    if (pointIndex === 0) {
        obj.set({ left: x, top: y });
    } else {
        // حساب التحجيم والتدوير من النقاط الأخرى
        const centerX = obj.left;
        const centerY = obj.top;
        const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        if (pointIndex === 1 || pointIndex === 2) {
            obj.set({ scaleY: distance / (obj.height / 2) });
        }
        if (pointIndex === 3 || pointIndex === 4) {
            obj.set({ scaleY: distance / (obj.height / 2) });
        }
    }
    
    obj.setCoords();
    fabricCanvas.renderAll();
}

// ==================== الألوان ====================
function toggleColorPicker() {
    document.getElementById('color-picker').classList.toggle('active');
    drawColorWheel();
}

function drawColorWheel() {
    const wheel = document.getElementById('color-wheel');
    const ctx = wheel.getContext('2d');
    const centerX = wheel.width / 2;
    const centerY = wheel.height / 2;
    const radius = 90;
    
    ctx.clearRect(0, 0, wheel.width, wheel.height);
    
    // رسم عجلة الألوان
    for (let angle = 0; angle < 360; angle++) {
        const startAngle = (angle - 1) * Math.PI / 180;
        const endAngle = angle * Math.PI / 180;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    // دائرة بيضاء في المركز
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
}

function setColor(color) {
    currentColor = color;
    currentOpacity = document.getElementById('opacity-slider').value / 100;
    
    document.querySelector('.color-preview').style.background = color;
    document.getElementById('color-code-input').value = color;
    document.getElementById('hex-input').value = color;
    
    // تحديث الفرشاة
    if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = color;
    }
    
    // تحديث الكائن المحدد
    if (selectedObject) {
        selectedObject.set('fill', color);
        fabricCanvas.renderAll();
    }
    
    // تحديث RGB
    const rgb = hexToRgb(color);
    if (rgb) {
        document.getElementById('rgb-input').value = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function toggleColorInput() {
    document.getElementById('color-input-popup').classList.toggle('active');
}

function setColorFromInput(value) {
    if (value.startsWith('#') && value.length === 7) {
        setColor(value);
    }
}

function applyManualColor() {
    const hex = document.getElementById('manual-hex').value;
    const rgb = document.getElementById('manual-rgb').value;
    const hsl = document.getElementById('manual-hsl').value;
    
    if (hex && hex.startsWith('#')) {
        setColor(hex);
    } else if (rgb) {
        const parts = rgb.split(',').map(n => parseInt(n.trim()));
        if (parts.length === 3) {
            const hex = '#' + parts.map(x => {
                const hex = x.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
            setColor(hex);
        }
    }
    
    document.getElementById('color-input-popup').classList.remove('active');
}

// ==================== التنزيل ====================
function showDownloadOptions() {
    document.getElementById('download-options').classList.add('active');
}

function setExportBG(type) {
    exportBG = type;
    document.querySelectorAll('.bg-option').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-bg="${type}"]`).classList.add('active');
}

function confirmDownload() {
    const quality = parseInt(document.getElementById('export-quality').value);
    const format = document.getElementById('export-format').value;
    
    // حفظ الحالة الحالية
    const originalBg = fabricCanvas.backgroundColor;
    
    if (exportBG === 'transparent') {
        fabricCanvas.backgroundColor = 'transparent';
    } else {
        fabricCanvas.backgroundColor = '#ffffff';
    }
    
    fabricCanvas.renderAll();
    
    const dataURL = fabricCanvas.toDataURL({
        format: format,
        quality: 1,
        multiplier: quality
    });
    
    const link = document.createElement('a');
    link.download = `${projectName}_${quality}x.${format}`;
    link.href = dataURL;
    link.click();
    
    // استعادة الحالة
    fabricCanvas.backgroundColor = originalBg;
    fabricCanvas.renderAll();
    
    document.getElementById('download-options').classList.remove('active');
}

// ==================== قوائم الأدوات ====================
function populateToolsMenus() {
    // قائمة الرسم
    const drawingGrid = document.getElementById('drawing-tools-grid');
    drawingTools.forEach(tool => {
        const item = createToolItem(tool, 'drawing');
        drawingGrid.appendChild(item);
    });
    
    // قائمة التحويل
    const transformGrid = document.getElementById('transform-tools-grid');
    transformTools.forEach(tool => {
        const item = createToolItem(tool, 'transform');
        transformGrid.appendChild(item);
    });
}

function createToolItem(tool, category) {
    const item = document.createElement('div');
    item.className = 'tool-item';
    item.dataset.tool = tool.id;
    
    const iconSvg = getToolIcon(tool.icon);
    
    item.innerHTML = `
        <div class="tool-icon">${iconSvg}</div>
        <div class="tool-name">${tool.name}</div>
    `;
    
    item.onclick = () => selectTool(tool, category, item);
    return item;
}

function getToolIcon(iconName) {
    // أيقونات SVG للأدوات
    const icons = {
        'pencil': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>',
        'pen': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 2l4 4-10 10-4-4L18 2z"/></svg>',
        'watercolor': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
        'eraser': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L21 10L11 20"/></svg>',
        'bucket': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/><path d="M12 16V4"/></svg>',
        'lasso': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 11l5-5 5 5M7 17l5-5 5 5"/></svg>',
        'move': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3"/></svg>',
        'rotate': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>'
    };
    
    return icons[iconName] || icons['pencil'];
}

function selectTool(tool, category, element) {
    // إزالة التنشيط السابق
    element.parentElement.querySelectorAll('.tool-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    if (category === 'drawing') {
        currentTool = tool.id;
        if (brushesLibrary[tool.id]) {
            setupBrush(tool.id);
        }
        fabricCanvas.isDrawingMode = true;
    } else if (category === 'transform') {
        fabricCanvas.isDrawingMode = false;
        executeTransformTool(tool);
    }
    
    closeToolsMenu();
}

function executeTransformTool(tool) {
    switch(tool.action) {
        case 'rotate':
            if (selectedObject) {
                const angle = prompt('أدخل زاوية التدوير (0-390):', '45');
                if (angle) {
                    selectedObject.rotate(parseInt(angle));
                    fabricCanvas.renderAll();
                }
            }
            break;
        case 'scale':
            if (selectedObject) {
                const scale = prompt('أدخل معامل التحجيم:', '1.5');
                if (scale) {
                    selectedObject.scale(parseFloat(scale));
                    fabricCanvas.renderAll();
                }
            }
            break;
        case 'flip':
            if (selectedObject) {
                selectedObject.toggle('flipX');
                fabricCanvas.renderAll();
            }
            break;
        case 'control-points':
            toggleRigMode();
            break;
    }
}

function toggleToolsMenu(menuType) {
    const menus = ['drawing-menu', 'transform-menu', 'layers-menu'];
    menus.forEach(menu => {
        document.getElementById(menu).classList.remove('active');
    });
    
    const targetMenu = menuType + '-menu';
    document.getElementById(targetMenu).classList.add('active');
}

function closeToolsMenu() {
    document.querySelectorAll('.tools-menu').forEach(menu => {
        menu.classList.remove('active');
    });
}

// ==================== الأشكال الهندسية ====================
function insertShape(shapeType) {
    fabricCanvas.isDrawingMode = false;
    let shape;
    
    switch(shapeType) {
        case 'circle':
            shape = new fabric.Circle({
                radius: 50,
                fill: 'transparent',
                stroke: currentColor,
                strokeWidth: brushSize,
                left: fabricCanvas.width / 2,
                top: fabricCanvas.height / 2,
                originX: 'center',
                originY: 'center'
            });
            break;
        case 'square':
            shape = new fabric.Rect({
                width: 100,
                height: 100,
                fill: 'transparent',
                stroke: currentColor,
                strokeWidth: brushSize,
                left: fabricCanvas.width / 2,
                top: fabricCanvas.height / 2,
                originX: 'center',
                originY: 'center'
            });
            break;
        case 'rectangle':
            shape = new fabric.Rect({
                width: 150,
                height: 100,
                fill: 'transparent',
                stroke: currentColor,
                strokeWidth: brushSize,
                left: fabricCanvas.width / 2,
                top: fabricCanvas.height / 2,
                originX: 'center',
                originY: 'center'
            });
            break;
        case 'triangle':
            shape = new fabric.Triangle({
                width: 100,
                height: 100,
                fill: 'transparent',
                stroke: currentColor,
                strokeWidth: brushSize,
                left: fabricCanvas.width / 2,
                top: fabricCanvas.height / 2,
                originX: 'center',
                originY: 'center'
            });
            break;
    }
    
    if (shape) {
        shape.set({
            selectable: true,
            hasControls: true,
            hasBorders: true
        });
        fabricCanvas.add(shape);
        fabricCanvas.setActiveObject(shape);
        fabricCanvas.renderAll();
    }
}

// ==================== إعدادات عامة ====================
function setupEventListeners() {
    // إغلاق القوائم عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.color-picker-popup') && !e.target.closest('.color-btn')) {
            document.getElementById('color-picker').classList.remove('active');
        }
        if (!e.target.closest('.download-popup') && !e.target.closest('.icon-btn')) {
            document.getElementById('download-options').classList.remove('active');
        }
        if (!e.target.closest('.color-input-popup') && !e.target.closest('.icon-btn')) {
            document.getElementById('color-input-popup').classList.remove('active');
        }
    });
    
    // تحديث الشفافية
    document.getElementById('opacity-slider').addEventListener('input', (e) => {
        document.getElementById('opacity-value').textContent = e.target.value + '%';
        currentOpacity = e.target.value / 100;
    });
    
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 's') {
                e.preventDefault();
                saveProject();
            } else if (e.key === 'z') {
                e.preventDefault();
                // تراجع
            }
        }
    });
}

// تصدير الوظائف للنطاق العام
window.createProject = createProject;
window.showScreen = showScreen;
window.saveAndExit = saveAndExit;
window.toggleToolsMenu = toggleToolsMenu;
window.closeToolsMenu = closeToolsMenu;
window.toggleColorPicker = toggleColorPicker;
window.setColor = setColor;
window.toggleColorInput = toggleColorInput;
window.setColorFromInput = setColorFromInput;
window.applyManualColor = applyManualColor;
window.showDownloadOptions = showDownloadOptions;
window.setExportBG = setExportBG;
window.confirmDownload = confirmDownload;
window.importImageToProject = importImageToProject;
window.handleImageImport = handleImageImport;
window.addLayer = addLayer;
window.toggleLayerVisibility = toggleLayerVisibility;
window.mergeSelectedLayers = mergeSelectedLayers;
window.toggleRigMode = toggleRigMode;
window.addFrame = addFrame;
window.copyFrame = copyFrame;
window.deleteFrame = deleteFrame;
window.togglePlayback = togglePlayback;
window.changeFPS = changeFPS;
window.insertShape = insertShape;