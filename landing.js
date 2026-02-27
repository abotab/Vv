/* ============================================
   landing.js - ملف الصفحة الرئيسية
   ============================================ */

// حالة عامة
const landingState = {
  selectedWidth: 1080,
  selectedHeight: 1080,
  selectedBg: '#ffffff',
  selectedDPI: 300,
  selectedFPS: 24,
  projectType: 'static',
  isDark: true
};

// ========== التحميل ==========
window.addEventListener('load', () => {
  // إخفاء شاشة التحميل
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 500);
    }
  }, 2500);

  // تهيئة الخلفية المتحركة
  initParticles();
  initBgCanvas();

  // تطبيق الثيم المحفوظ
  const theme = localStorage.getItem('safwan-theme') || 'dark';
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    landingState.isDark = false;
  }
});

// ========== جسيمات الخلفية ==========
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const colors = ['#ff6b35', '#ff3d71', '#6c5ce7', '#00b894', '#fdcb6e', '#a29bfe'];
  const count = 30;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
      right: ${Math.random() * 100}%;
      width: ${Math.random() * 6 + 2}px;
      height: ${Math.random() * 6 + 2}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${Math.random() * 15 + 10}s;
      animation-delay: ${Math.random() * 10}s;
    `;
    container.appendChild(particle);
  }
}

// ========== رسم خلفية متحركة ==========
function initBgCanvas() {
  const container = document.getElementById('bgCanvas');
  if (!container) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const lines = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  // خطوط رسم متحركة في الخلفية
  class Line {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.points = [{ x: this.x, y: this.y }];
      this.speed = Math.random() * 1.5 + 0.5;
      this.angle = Math.random() * Math.PI * 2;
      this.life = 0;
      this.maxLife = Math.random() * 200 + 100;
      this.hue = Math.random() > 0.5 ? 20 : 340;
      this.opacity = Math.random() * 0.15 + 0.05;
      this.width = Math.random() * 1.5 + 0.5;
    }
    update() {
      this.angle += (Math.random() - 0.5) * 0.3;
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      this.points.push({ x: this.x, y: this.y });
      if (this.points.length > 30) this.points.shift();
      this.life++;
      if (this.life > this.maxLife || this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
        this.reset();
      }
    }
    draw() {
      if (this.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.strokeStyle = `hsla(${this.hue}, 100%, 60%, ${this.opacity})`;
      ctx.lineWidth = this.width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  for (let i = 0; i < 15; i++) lines.push(new Line());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach(l => { l.update(); l.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

// ========== تبديل الثيم ==========
function toggleThemeNav() {
  const isDark = !document.body.classList.contains('light-mode');
  if (isDark) {
    document.body.classList.add('light-mode');
    localStorage.setItem('safwan-theme', 'light');
  } else {
    document.body.classList.remove('light-mode');
    localStorage.setItem('safwan-theme', 'dark');
  }
}

document.getElementById('themeToggleNav')?.addEventListener('click', toggleThemeNav);

// ========== معرض الفنون ==========
function toggleArtInfo(card) {
  const wasActive = card.classList.contains('active');
  document.querySelectorAll('.art-card').forEach(c => c.classList.remove('active'));
  if (!wasActive) card.classList.add('active');
}

function startProject(type) {
  landingState.artType = type;
  showNewProjectModal();
}

// ========== نافذة مشروع جديد ==========
function showNewProjectModal() {
  const modal = document.getElementById('newProjectModal');
  modal.classList.add('active');
}

function hideNewProjectModal() {
  document.getElementById('newProjectModal').classList.remove('active');
}

document.getElementById('newProjectModal')?.addEventListener('click', function(e) {
  if (e.target === this) hideNewProjectModal();
});

function switchTab(type) {
  landingState.projectType = type;
  document.querySelectorAll('#newProjectModal .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === type);
  });
  const animSettings = document.getElementById('animatedSettings');
  if (animSettings) {
    animSettings.style.display = type === 'animated' ? 'block' : 'none';
  }
}

function selectSize(btn, w, h) {
  landingState.selectedWidth = w;
  landingState.selectedHeight = h;
  document.querySelectorAll('#newProjectModal .size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('customSize').style.display = 'none';
}

function toggleCustomSize() {
  const cs = document.getElementById('customSize');
  cs.style.display = cs.style.display === 'none' ? 'flex' : 'none';
  document.querySelectorAll('#newProjectModal .size-btn').forEach(b => b.classList.remove('active'));
}

function selectBg(btn, color) {
  landingState.selectedBg = color;
  document.querySelectorAll('#newProjectModal .bg-opt').forEach(b => {
    b.querySelector('svg') && (b.querySelector('svg').style.opacity = '0');
  });
  if (btn) {
    btn.querySelector('svg') && (btn.querySelector('svg').style.opacity = '1');
    document.querySelectorAll('#newProjectModal .bg-opt').forEach(b => b.style.outline = 'none');
    btn.style.outline = '2px solid #ff6b35';
  }
}

function selectCustomBg(value) {
  landingState.selectedBg = value;
}

function selectFPS(btn, fps) {
  landingState.selectedFPS = fps;
  document.querySelectorAll('#newProjectModal .fps-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function createProject() {
  // جمع البيانات
  const w = parseInt(document.getElementById('customW')?.value) || landingState.selectedWidth;
  const h = parseInt(document.getElementById('customH')?.value) || landingState.selectedHeight;
  const bg = landingState.selectedBg;
  const dpi = document.getElementById('dpiSelect')?.value || 300;
  const fps = landingState.selectedFPS;
  const type = landingState.projectType;

  // حفظ إعدادات المشروع
  const project = {
    id: Date.now().toString(),
    name: `مشروع ${new Date().toLocaleDateString('ar')}`,
    width: w,
    height: h,
    background: bg,
    dpi: dpi,
    fps: fps,
    type: type,
    created: Date.now()
  };

  // حفظ في localStorage
  const projects = JSON.parse(localStorage.getItem('safwan-projects') || '[]');
  projects.unshift(project);
  localStorage.setItem('safwan-projects', JSON.stringify(projects));
  localStorage.setItem('safwan-current-project', JSON.stringify(project));

  // الانتقال للاستوديو
  window.location.href = 'studio.html';
}

// ========== التمرير السلس ==========
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ========== تأثيرات التمرير ==========
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.art-card, .feature-card').forEach(el => observer.observe(el));

// ========== تأثير الماوس على الشعار ==========
const heroLogo = document.getElementById('heroLogo');
document.addEventListener('mousemove', (e) => {
  if (!heroLogo) return;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const dx = (e.clientX - cx) / cx;
  const dy = (e.clientY - cy) / cy;
  heroLogo.style.transform = `rotate(${dx * 20}deg) translateY(${dy * 10}px)`;
});
