// تهيئة الصفحة الرئيسية
document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    initAnimations();
    initCategories();
    generateColors();
});

// نظام الجسيمات
function initParticles() {
    const container = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 4 + 2}px;
        height: ${Math.random() * 4 + 2}px;
        background: rgba(102, 126, 234, ${Math.random() * 0.5 + 0.2});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: float ${Math.random() * 10 + 10}s infinite ease-in-out;
        pointer-events: none;
    `;
    container.appendChild(particle);
    
    // حركة الجسيمات باستخدام GSAP
    gsap.to(particle, {
        x: `random(-100, 100)`,
        y: `random(-100, 100)`,
        duration: `random(10, 20)`,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
}

// التحريكات الأولية
function initAnimations() {
    // تحريك الشعار
    anime({
        targets: '.logo-wrapper',
        scale: [0, 1],
        opacity: [0, 1],
        duration: 1000,
        easing: 'easeOutElastic(1, .5)'
    });
    
    // تحريك العنوان
    anime({
        targets: '.studio-title',
        translateY: [50, 0],
        opacity: [0, 1],
        duration: 800,
        delay: 300,
        easing: 'easeOutExpo'
    });
    
    // تحريك البطاقات
    anime({
        targets: '.category-card',
        translateY: [100, 0],
        opacity: [0, 1],
        delay: anime.stagger(150, {start: 500}),
        duration: 800,
        easing: 'easeOutExpo'
    });
    
    // تحريك زر البدء
    anime({
        targets: '.start-btn',
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 600,
        delay: 1200,
        easing: 'easeOutBack'
    });
}

// تفاعل البطاقات
function initCategories() {
    const cards = document.querySelectorAll('.category-card');
    
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const type = this.dataset.type;
            showProjectModal();
            
            // تأثير النقر
            anime({
                targets: this,
                scale: [1, 0.95, 1],
                duration: 300,
                easing: 'easeInOutQuad'
            });
        });
    });
}

// عرض نافذة المشروع
function showProjectModal() {
    const modal = document.getElementById('projectModal');
    modal.style.display = 'flex';
    
    anime({
        targets: '.modal-content',
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutBack'
    });
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    modal.style.display = 'none';
}

// فتح الاستوديو
let projectType = '';
let selectedWidth = 1080;
let selectedHeight = 1080;

function openStudio(type) {
    projectType = type;
    closeProjectModal();
    
    setTimeout(() => {
        showSizeModal();
    }, 300);
}

// نافذة الأحجام
function showSizeModal() {
    const modal = document.getElementById('sizeModal');
    modal.style.display = 'flex';
    
    // تحديد الحجم الافتراضي
    document.querySelectorAll('.size-preset').forEach(preset => {
        preset.classList.remove('active');
    });
    
    // إضافة مستمعي الأحداث للأحجام الجاهزة
    document.querySelectorAll('.size-preset').forEach(preset => {
        preset.addEventListener('click', function() {
            document.querySelectorAll('.size-preset').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            selectedWidth = parseInt(this.dataset.width);
            selectedHeight = parseInt(this.dataset.height);
            document.getElementById('customWidth').value = '';
            document.getElementById('customHeight').value = '';
        });
    });
}

function closeSizeModal() {
    document.getElementById('sizeModal').style.display = 'none';
}

// إنشاء المشروع
function createProject() {
    const customW = document.getElementById('customWidth').value;
    const customH = document.getElementById('customHeight').value;
    
    if (customW && customH) {
        selectedWidth = parseInt(customW);
        selectedHeight = parseInt(customH);
    }
    
    // حفظ إعدادات المشروع
    const projectSettings = {
        type: projectType,
        width: selectedWidth,
        height: selectedHeight,
        name: 'مشروع جديد',
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('currentProject', JSON.stringify(projectSettings));
    
    // الانتقال للاستوديو
    window.location.href = 'studio.html';
}

// إنشاء لوحة الألوان
function generateColors() {
    const colors = [
        '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
        '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
        '#ffc0cb', '#a52a2a', '#808080', '#008000', '#000080',
        '#ff6347', '#40e0d0', '#ee82ee', '#f5deb3', '#d2691e'
    ];
    
    // إضافة ألوان متدرجة
    for (let i = 0; i < 100; i++) {
        const hue = (i * 3.6) % 360;
        colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    
    window.colorPalette = colors;
}

// إغلاق النوافذ عند النقر خارجها
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}