// متغيرات عامة
let canvas, ctx;
let fabricCanvas;
let currentTool = 'brush';
let currentColor = '#000000';
let currentSize = 10;
let currentOpacity = 1;
let isDrawing = false;
let layers = [];
let currentLayer = 0;
let frames = [];
let currentFrame = 0;
let isPlaying = false;
let animationInterval;
let projectType = 'static';
let zoom = 1;
let history = [];
let historyStep = -1;
let selection = null;
let referenceImage = null;

// تهيئة الاستوديو
document.addEventListener('DOMContentLoaded', function() {
    initStudio();
    initTools();
    initBrushes();
    initLayers();
    initColors();
    initEvents();
    loadProjectSettings();
    startAutoSave();
});

// تهيئة الاستوديو
function initStudio() {
    const settings = JSON.parse(localStorage.getItem('currentProject') || '{}');
    projectType = settings.type || 'static';
    const width = settings.width || 1080;
    const height = settings.height || 1080;
    
    // إنشاء canvas باستخدام Fabric.js
    canvas = document.getElementById('mainCanvas');
    canvas.width = width;
    canvas.height = height;
    
    fabricCanvas = new fabric.Canvas('mainCanvas', {
        width: width,
        height: height,
        backgroundColor: '#ffffff',
        isDrawingMode: true
    });
    
    // إعداد فرشاة الرسم
    fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush.width = currentSize;
    fabricCanvas.freeDrawingBrush.color = currentColor;
    
    // إضافة طبقة أولى
    addLayer();
    
    // إظهار لوحة الرسوم المتحركة إذا كان النوع animation
    if (projectType === 'animation') {
        document.getElementById('animationPanel').style.display = 'block';
        document.getElementById('gifExport').style.display = 'block';
        document.getElementById('videoExport').style.display = 'block';
        initAnimation();
    }
    
    // تحديث معلومات Canvas
    document.getElementById('canvasSize').textContent = `${width} × ${height} px`;
    
    // تهيئة Paper.js للرسم المتقدم
    paper.setup(canvas);
}

// تهيئة الأدوات
function initTools() {
    const tools = document.querySelectorAll('.tool-btn');
    
    tools.forEach(tool => {
        tool.addEventListener('click', function() {
            const toolName = this.dataset.tool;
            selectTool(toolName);
            
            // تحديث الواجهة
            tools.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// اختيار الأداة
function selectTool(tool) {
    currentTool = tool;
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = false;
    
    switch(tool) {
        case 'brush':
        case 'pencil':
            fabricCanvas.isDrawingMode = true;
            fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush.width = currentSize;
            fabricCanvas.freeDrawingBrush.color = currentColor;
            break;
            
        case 'eraser':
            fabricCanvas.isDrawingMode = true;
            fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush.width = currentSize;
            fabricCanvas.freeDrawingBrush.color = '#ffffff';
            break;
            
        case 'select-rect':
            fabricCanvas.selection = true;
            new fabric.Rect({
                left: 100,
                top: 100,
                fill: 'transparent',
                stroke: '#667eea',
                strokeWidth: 2,
                width: 200,
                height: 200,
                selectable: true
            });
            break;
            
        case 'select-circle':
            fabricCanvas.selection = true;
            break;
            
        case 'text':
            addTextTool();
            break;
            
        case 'fill':
            fillTool();
            break;
            
        case 'line':
            drawLine();
            break;
            
        case 'rect':
            drawRectangle();
            break;
            
        case 'circle':
            drawCircle();
            break;
            
        case 'picker':
            activateColorPicker();
            break;
    }
    
    saveState();
}

// أداة النص
function addTextTool() {
    const text = new fabric.IText('اكتب هنا', {
        left: 100,
        top: 100,
        fontFamily: 'Tajawal',
        fill: currentColor,
        fontSize: 40
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    saveState();
}

// أداة التعبئة
function fillTool() {
    fabricCanvas.backgroundColor = currentColor;
    fabricCanvas.renderAll();
    saveState();
}

// رسم خط
function drawLine() {
    const line = new fabric.Line([50, 50, 200, 200], {
        stroke: currentColor,
        strokeWidth: currentSize
    });
    fabricCanvas.add(line);
    saveState();
}

// رسم مستطيل
function drawRectangle() {
    const rect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: currentColor,
        strokeWidth: currentSize,
        width: 200,
        height: 150
    });
    fabricCanvas.add(rect);
    saveState();
}

// رسم دائرة
function drawCircle() {
    const circle = new fabric.Circle({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: currentColor,
        strokeWidth: currentSize,
        radius: 75
    });
    fabricCanvas.add(circle);
    saveState();
}

// قطارة الألوان
function activateColorPicker() {
    fabricCanvas.defaultCursor = 'crosshair';
    fabricCanvas.on('mouse:down', function(e) {
        const pointer = fabricCanvas.getPointer(e.e);
        const ctx = fabricCanvas.getContext();
        const pixel = ctx.getImageData(pointer.x, pointer.y, 1, 1).data;
        const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        setColor(color);
        fabricCanvas.defaultCursor = 'default';
        fabricCanvas.off('mouse:down');
    });
}

// تهيئة الفرش
function initBrushes() {
    const safwanBrushes = document.querySelectorAll('#safwanBrushes .brush-item');
    const proBrushes = document.querySelectorAll('#proBrushes .brush-item');
    
    safwanBrushes.forEach(brush => {
        brush.addEventListener('click', function() {
            safwanBrushes.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            applyBrushSettings(this.dataset.brush);
        });
    });
    
    proBrushes.forEach(brush => {
        brush.addEventListener('click', function() {
            proBrushes.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            applyBrushSettings(this.dataset.brush);
        });
    });
}

// تطبيق إعدادات الفرشاة
function applyBrushSettings(brushType) {
    switch(brushType) {
        case 'safwan-1':
            fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush.width = currentSize;
            fabricCanvas.freeDrawingBrush.color = currentColor;
            break;
        case 'safwan-2':
            // فرشاة متدرجة
            fabricCanvas.freeDrawingBrush = new fabric.CircleBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush.width = currentSize * 2;
            break;
        case 'safwan-3':
            // فرشاة رذاذ
            fabricCanvas.freeDrawingBrush = new fabric.SprayBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush.width = currentSize * 3;
            fabricCanvas.freeDrawingBrush.density = 20;
            break;
        case 'oil':
        case 'watercolor':
        case 'charcoal':
            // محاكاة الفرش التقليدية
            fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush.width = currentSize;
            fabricCanvas.freeDrawingBrush.color = currentColor;
            fabricCanvas.freeDrawingBrush.decimate = 0.5;
            break;
    }
}

// تهيئة الطبقات
function initLayers() {
    updateLayersList();
}

// إضافة طبقة
function addLayer() {
    const layer = {
        id: Date.now(),
        name: `طبقة ${layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: 1,
        canvas: document.createElement('canvas')
    };
    
    layer.canvas.width = fabricCanvas.width;
    layer.canvas.height = fabricCanvas.height;
    
    layers.unshift(layer);
    currentLayer = 0;
    updateLayersList();
    saveState();
}

// حذف طبقة
function deleteLayer() {
    if (layers.length > 1) {
        layers.splice(currentLayer, 1);
        currentLayer = Math.max(0, currentLayer - 1);
        updateLayersList();
        saveState();
    }
}

// تكرار طبقة
function duplicateLayer() {
    if (layers[currentLayer]) {
        const newLayer = {...layers[currentLayer], id: Date.now(), name: `${layers[currentLayer].name} نسخة`};
        layers.splice(currentLayer, 0, newLayer);
        updateLayersList();
        saveState();
    }
}

// دمج للأسفل
function mergeDown() {
    if (currentLayer < layers.length - 1) {
        // دمج المنطق هنا
        layers.splice(currentLayer + 1, 1);
        updateLayersList();
        saveState();
    }
}

// تحديث قائمة الطبقات
function updateLayersList() {
    const list = document.getElementById('layersList');
    list.innerHTML = '';
    
    layers.forEach((layer, index) => {
        const item = document.createElement('div');
        item.className = `layer-item ${index === currentLayer ? 'active' : ''}`;
        item.innerHTML = `
            <div class="layer-visibility" onclick="toggleLayerVisibility(${index})">
                ${layer.visible ? '👁' : '🚫'}
            </div>
            <div class="layer-lock" onclick="toggleLayerLock(${index})">
                ${layer.locked ? '🔒' : '🔓'}
            </div>
            <span class="layer-name">${layer.name}</span>
            <input type="range" class="layer-opacity" min="0" max="100" value="${layer.opacity * 100}" 
                   onchange="setLayerOpacity(${index}, this.value)">
        `;
        item.onclick = (e) => {
            if (!e.target.closest('.layer-visibility') && !e.target.closest('.layer-lock') && !e.target.classList.contains('layer-opacity')) {
                selectLayer(index);
            }
        };
        list.appendChild(item);
    });
}

function selectLayer(index) {
    currentLayer = index;
    updateLayersList();
}

function toggleLayerVisibility(index) {
    layers[index].visible = !layers[index].visible;
    updateLayersList();
    renderCanvas();
}

function toggleLayerLock(index) {
    layers[index].locked = !layers[index].locked;
    updateLayersList();
}

function setLayerOpacity(index, value) {
    layers[index].opacity = value / 100;
    renderCanvas();
}

// تهيئة الألوان
function initColors() {
    const palette = document.getElementById('colorPalette');
    const presets = document.querySelector('.color-presets');
    
    // إنشاء 1000+ لون
    const colors = [];
    for (let h = 0; h < 360; h += 5) {
        for (let s = 50; s <= 100; s += 25) {
            for (let l = 20; l <= 80; l += 20) {
                colors.push(`hsl(${h}, ${s}%, ${l}%)`);
            }
        }
    }
    
    // ألوان البشرة
    const skinTones = [
        '#f8e3d8', '#f5d5c5', '#e8c4b8', '#d4a594', '#c68674',
        '#b56a50', '#a05240', '#8b3a2f', '#6d2c25', '#4a1f1a'
    ];
    
    colors.push(...skinTones);
    
    // عرض الألوان
    colors.slice(0, 500).forEach(color => {
        const div = document.createElement('div');
        div.className = 'palette-color';
        div.style.backgroundColor = color;
        div.onclick = () => setColor(color);
        palette.appendChild(div);
    });
    
    // الألوان المفضلة
    skinTones.forEach(color => {
        const div = document.createElement('div');
        div.className = 'color-preset';
        div.style.backgroundColor = color;
        div.onclick = () => setColor(color);
        presets.appendChild(div);
    });
    
    // مستمع تغيير اللون
    document.getElementById('colorPicker').addEventListener('input', (e) => {
        setColor(e.target.value);
    });
}

function setColor(color) {
    currentColor = color;
    document.getElementById('colorPicker').value = color;
    if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = color;
    }
}

// تهيئة الأحداث
function initEvents() {
    // حجم الفرشاة
    document.getElementById('brushSize').addEventListener('input', (e) => {
        currentSize = parseInt(e.target.value);
        document.getElementById('brushSizeValue').textContent = currentSize + 'px';
        if (fabricCanvas.freeDrawingBrush) {
            fabricCanvas.freeDrawingBrush.width = currentSize;
        }
    });
    
    // الشفافية
    document.getElementById('opacity').addEventListener('input', (e) => {
        currentOpacity = e.target.value / 100;
        document.getElementById('opacityValue').textContent = e.target.value + '%';
    });
    
    // التنعيم
    document.getElementById('smoothing').addEventListener('input', (e) => {
        document.getElementById('smoothingValue').textContent = e.target.value + '%';
    });
    
    // التدفق
    document.getElementById('flow').addEventListener('input', (e) => {
        document.getElementById('flowValue').textContent = e.target.value + '%';
    });
    
    // وضع المزج
    document.getElementById('blendMode').addEventListener('change', (e) => {
        // تطبيق وضع المزج
    });
    
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'z':
                    e.preventDefault();
                    undo();
                    break;
                case 'y':
                    e.preventDefault();
                    redo();
                    break;
                case 's':
                    e.preventDefault();
                    saveProject();
                    break;
            }
        }
    });
    
    // حفظ الحالة عند الرسم
    fabricCanvas.on('path:created', () => {
        saveState();
    });
}

// حفظ الحالة للتراجع
function saveState() {
    const json = fabricCanvas.toJSON();
    history = history.slice(0, historyStep + 1);
    history.push(json);
    historyStep++;
    
    if (history.length > 50) {
        history.shift();
        historyStep--;
    }
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        fabricCanvas.loadFromJSON(history[historyStep], () => {
            fabricCanvas.renderAll();
        });
    }
}

function redo() {
    if (historyStep < history.length - 1) {
        historyStep++;
        fabricCanvas.loadFromJSON(history[historyStep], () => {
            fabricCanvas.renderAll();
        });
    }
}

// نظام الرسوم المتحركة
function initAnimation() {
    addFrame();
}

function addFrame() {
    const frame = {
        id: Date.now(),
        data: fabricCanvas.toJSON()
    };
    frames.push(frame);
    updateTimeline();
}

function updateTimeline() {
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    
    frames.forEach((frame, index) => {
        const item = document.createElement('div');
        item.className = `frame-item ${index === currentFrame ? 'active' : ''}`;
        item.dataset.frame = index + 1;
        item.innerHTML = `<span>${index + 1}</span>`;
        item.onclick = () => selectFrame(index);
        timeline.appendChild(item);
    });
}

function selectFrame(index) {
    // حفظ الإطار الحالي
    frames[currentFrame].data = fabricCanvas.toJSON();
    
    // تحميل الإطار الجديد
    currentFrame = index;
    fabricCanvas.loadFromJSON(frames[currentFrame].data, () => {
        fabricCanvas.renderAll();
    });
    
    updateTimeline();
}

function playAnimation() {
    if (isPlaying) return;
    isPlaying = true;
    
    const fps = parseInt(document.getElementById('fps').value) || 12;
    const interval = 1000 / fps;
    
    animationInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % frames.length;
        fabricCanvas.loadFromJSON(frames[currentFrame].data, () => {
            fabricCanvas.renderAll();
        });
        updateTimeline();
    }, interval);
}

function stopAnimation() {
    isPlaying = false;
    clearInterval(animationInterval);
}

// التكبير والتصغير
function zoomIn() {
    zoom = Math.min(zoom + 0.1, 3);
    applyZoom();
}

function zoomOut() {
    zoom = Math.max(zoom - 0.1, 0.1);
    applyZoom();
}

function applyZoom() {
    fabricCanvas.setZoom(zoom);
    document.getElementById('zoomLevel').textContent = Math.round(zoom * 100) + '%';
}

// صورة المرجع
function loadReferenceImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            fabric.Image.fromURL(e.target.result, (img) => {
                img.set({
                    left: 0,
                    top: 0,
                    opacity: 0.5,
                    selectable: false,
                    evented: false
                });
                fabricCanvas.add(img);
                fabricCanvas.sendToBack(img);
                referenceImage = img;
                document.getElementById('refControls').style.display = 'block';
            });
        };
        reader.readAsDataURL(file);
    }
}

function updateRefOpacity() {
    const opacity = document.getElementById('refOpacity').value / 100;
    if (referenceImage) {
        referenceImage.set('opacity', opacity);
        fabricCanvas.renderAll();
    }
}

// الحفظ التلقائي
function startAutoSave() {
    setInterval(() => {
        saveProject(true);
    }, 30000); // كل 30 ثانية
}

function saveProject(auto = false) {
    const projectData = {
        name: document.getElementById('projectName').value,
        canvas: fabricCanvas.toJSON(),
        layers: layers,
        frames: frames,
        type: projectType,
        settings: JSON.parse(localStorage.getItem('currentProject')),
        savedAt: new Date().toISOString()
    };
    
    let projects = JSON.parse(localStorage.getItem('safwanProjects') || '[]');
    const existingIndex = projects.findIndex(p => p.name === projectData.name);
    
    if (existingIndex >= 0) {
        projects[existingIndex] = projectData;
    } else {
        projects.push(projectData);
    }
    
    localStorage.setItem('safwanProjects', JSON.stringify(projects));
    
    if (!auto) {
        alert('تم حفظ المشروع بنجاح!');
    } else {
        document.querySelector('.autosave-status').textContent = 'تم الحفظ تلقائياً ' + new Date().toLocaleTimeString();
    }
}

// عرض المشاريع
function showProjects() {
    const modal = document.getElementById('projectsModal');
    const container = document.getElementById('savedProjects');
    
    const projects = JSON.parse(localStorage.getItem('safwanProjects') || '[]');
    
    container.innerHTML = projects.map(project => `
        <div class="project-card" onclick="loadProject('${project.name}')">
            <div class="project-thumb">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                </svg>
            </div>
            <div class="project-info-card">
                <h4>${project.name}</h4>
                <p>${new Date(project.savedAt).toLocaleString()}</p>
                <small>${project.type === 'animation' ? 'متحرك' : 'ثابت'}</small>
            </div>
        </div>
    `).join('');
    
    modal.style.display = 'flex';
}

function closeProjectsModal() {
    document.getElementById('projectsModal').style.display = 'none';
}

function loadProject(name) {
    const projects = JSON.parse(localStorage.getItem('safwanProjects') || '[]');
    const project = projects.find(p => p.name === name);
    
    if (project) {
        document.getElementById('projectName').value = project.name;
        fabricCanvas.loadFromJSON(project.canvas, () => {
            fabricCanvas.renderAll();
        });
        layers = project.layers || layers;
        frames = project.frames || frames;
        updateLayersList();
        if (project.type === 'animation') updateTimeline();
        closeProjectsModal();
    }
}

// التصدير
function exportProject() {
    document.getElementById('exportModal').style.display = 'flex';
}

function closeExportModal() {
    document.getElementById('exportModal').style.display = 'none';
}

function exportImage(format) {
    const link = document.createElement('a');
    link.download = `${document.getElementById('projectName').value}.${format}`;
    
    if (format === 'png') {
        link.href = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1
        });
    } else if (format === 'jpg') {
        link.href = fabricCanvas.toDataURL({
            format: 'jpeg',
            quality: 0.9
        });
    } else if (format === 'webp') {
        link.href = fabricCanvas.toDataURL({
            format: 'webp',
            quality: 0.9
        });
    }
    
    link.click();
    closeExportModal();
}

function exportGIF() {
    // استخدام مكتبة gif.js
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: fabricCanvas.width,
        height: fabricCanvas.height
    });
    
    frames.forEach(frame => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = fabricCanvas.width;
        tempCanvas.height = fabricCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // رسم الإطار
        fabricCanvas.loadFromJSON(frame.data, () => {
            const dataURL = fabricCanvas.toDataURL();
            const img = new Image();
            img.onload = () => {
                tempCtx.drawImage(img, 0, 0);
                gif.addFrame(tempCtx, {copy: true, delay: 1000 / (document.getElementById('fps').value || 12)});
            };
            img.src = dataURL;
        });
    });
    
    gif.on('finished', (blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${document.getElementById('projectName').value}.gif`;
        link.click();
    });
    
    gif.render();
    closeExportModal();
}

function exportVideo() {
    // تصدير كـ WebM باستخدام MediaRecorder
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
    });
    
    const chunks = [];
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, {type: 'video/webm'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${document.getElementById('projectName').value}.webm`;
        link.click();
    };
    
    // تسجيل كل إطار
    let frameIndex = 0;
    const fps = parseInt(document.getElementById('fps').value) || 12;
    
    mediaRecorder.start();
    
    const captureFrame = () => {
        if (frameIndex < frames.length) {
            fabricCanvas.loadFromJSON(frames[frameIndex].data, () => {
                fabricCanvas.renderAll();
                frameIndex++;
                setTimeout(captureFrame, 1000 / fps);
            });
        } else {
            mediaRecorder.stop();
        }
    };
    
    captureFrame();
    closeExportModal();
}

// تبديل الوضع الليلي/النهاري
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// الخروج
function exitStudio() {
    if (confirm('هل تريد حفظ المشروع قبل الخروج؟')) {
        saveProject();
    }
    window.location.href = 'index.html';
}

// تحميل إعدادات المشروع
function loadProjectSettings() {
    const settings = JSON.parse(localStorage.getItem('currentProject') || '{}');
    if (settings.name) {
        document.getElementById('projectName').value = settings.name;
    }
    
    // تحميل الثيم
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
    }
}

function renderCanvas() {
    fabricCanvas.renderAll();
}