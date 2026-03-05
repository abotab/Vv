/* ═══════════════════════════════════════════════════
   AnimForge — landing.js
   Landing Page JavaScript
   ═══════════════════════════════════════════════════ */

'use strict';

// ─── Libraries Data ──────────────────────────────
const LIBRARIES = [
  { name: 'Pixi.js',      type: 'drawing',   desc: 'محرك رسم 2D فائق السرعة',      url: 'https://pixijs.com' },
  { name: 'Konva.js',     type: 'drawing',   desc: 'Canvas 2D عالي الأداء',         url: 'https://konvajs.org' },
  { name: 'Fabric.js',    type: 'drawing',   desc: 'رسم تفاعلي متقدم',              url: 'http://fabricjs.com' },
  { name: 'Paper.js',     type: 'drawing',   desc: 'رسم Vector احترافي',            url: 'http://paperjs.org' },
  { name: 'Two.js',       type: 'drawing',   desc: 'رسم 2D مع دعم SVG وCanvas',    url: 'https://two.js.org' },
  { name: 'SVG.js',       type: 'drawing',   desc: 'التعامل مع SVG',                url: 'https://svgjs.dev' },
  { name: 'Rough.js',     type: 'drawing',   desc: 'رسم بمظهر يدوي',               url: '#' },
  { name: 'P5.js',        type: 'drawing',   desc: 'رسم إبداعي وتفاعلي',           url: 'https://p5js.org' },
  { name: 'Zdog',         type: 'drawing',   desc: 'رسم 3D بأسلوب Flat',            url: 'https://zzz.dog' },
  { name: 'D3.js',        type: 'drawing',   desc: 'رسوم بيانية وتصورات',           url: 'https://d3js.org' },

  { name: 'GSAP',         type: 'animation', desc: 'الأقوى عالمياً للتحريك',        url: 'https://gsap.com' },
  { name: 'Anime.js',     type: 'animation', desc: 'تحريك خفيف وسلس',              url: 'https://animejs.com' },
  { name: 'Motion One',   type: 'animation', desc: 'بديل GSAP خفيف',               url: 'https://motion.dev' },
  { name: 'Lottie',       type: 'animation', desc: 'تشغيل أنيميشن After Effects',  url: 'https://airbnb.io/lottie' },
  { name: 'Theatre.js',   type: 'animation', desc: 'محرر أنيميشن متقدم',           url: 'https://www.theatrejs.com' },
  { name: 'Mo.js',        type: 'animation', desc: 'تأثيرات حركية إبداعية',        url: 'https://mojs.github.io' },
  { name: 'Tween.js',     type: 'animation', desc: 'interpolation ناعمة',           url: '#' },
  { name: 'Popmotion',    type: 'animation', desc: 'محرك حركة فيزيائي',            url: '#' },
  { name: 'Typed.js',     type: 'animation', desc: 'تأثير الكتابة',                url: '#' },
  { name: 'AOS',          type: 'animation', desc: 'Animate On Scroll',             url: '#' },
  { name: 'Vivus',        type: 'animation', desc: 'رسم SVG تدريجي',               url: '#' },
  { name: 'Velocity.js',  type: 'animation', desc: 'تحريك CSS سريع',               url: '#' },

  { name: 'Pixi-Spine',   type: 'skeleton',  desc: 'أقوى مكتبة Spine لـ PixiJS',  url: 'https://github.com/pixijs/spine' },
  { name: 'DragonBones',  type: 'skeleton',  desc: 'نظام عظام مجاني واحترافي',    url: '#' },
  { name: 'IK.js',        type: 'skeleton',  desc: 'Inverse Kinematics',           url: '#' },
  { name: 'fullik',       type: 'skeleton',  desc: 'FABRIK IK Solver',             url: '#' },
  { name: 'Creature.js',  type: 'skeleton',  desc: 'تحريك عضوي وعظام ناعمة',     url: '#' },

  { name: 'Matter.js',    type: 'physics',   desc: 'فيزياء 2D متقدمة',             url: 'https://brm.io/matter-js' },
  { name: 'Planck.js',    type: 'physics',   desc: 'Box2D بـ JavaScript',          url: '#' },
  { name: 'Rapier.js',    type: 'physics',   desc: 'فيزياء WASM فائقة الأداء',    url: 'https://rapier.rs' },

  { name: 'Three.js',     type: 'threejs',   desc: 'محرك 3D الأشهر',              url: 'https://threejs.org' },
  { name: 'Babylon.js',   type: 'threejs',   desc: 'محرك 3D متكامل',              url: 'https://www.babylonjs.com' },
  { name: 'A-Frame',      type: 'threejs',   desc: 'WebVR/AR',                     url: 'https://aframe.io' },
  { name: 'PlayCanvas',   type: 'threejs',   desc: 'محرك ألعاب 3D',               url: 'https://playcanvas.com' },
];

const BADGE_LABELS = {
  drawing:   { label: 'رسم',    cls: 'drawing' },
  animation: { label: 'تحريك', cls: 'animation' },
  skeleton:  { label: 'عظام',  cls: 'skeleton' },
  physics:   { label: 'فيزياء', cls: 'physics' },
  threejs:   { label: '3D',     cls: 'threejs' },
};

const PREBUILT_ANIMS = [
  { id: 'walk',    name: 'مشي',    frames: 8,  icon: '🚶', color: '#00d4ff' },
  { id: 'run',     name: 'ركض',    frames: 6,  icon: '🏃', color: '#10b981' },
  { id: 'jump',    name: 'قفز',    frames: 12, icon: '🦘', color: '#8b5cf6' },
  { id: 'sit',     name: 'جلوس',   frames: 10, icon: '🧘', color: '#ff6b35' },
  { id: 'attack',  name: 'هجوم',   frames: 8,  icon: '⚔',  color: '#ef4444' },
  { id: 'hit',     name: 'ضربة',   frames: 4,  icon: '💥', color: '#fbbf24' },
  { id: 'idle',    name: 'خمول',   frames: 16, icon: '😤', color: '#06b6d4' },
];

// ─── DOM Ready ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
});

// ─── Loading Screen ───────────────────────────────
function initLoadingScreen() {
  const prog = document.getElementById('loadingProgress');
  const txt = document.getElementById('loadingText');
  const steps = [
    [20,  'تحميل المكتبات...'],
    [45,  'بناء محرك الرسم...'],
    [70,  'تهيئة نظام العظام...'],
    [90,  'تحضير الواجهة...'],
    [100, 'جاهز!'],
  ];

  let i = 0;
  const tick = () => {
    if (i >= steps.length) {
      setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('fade-out');
        setTimeout(initApp, 500);
      }, 300);
      return;
    }
    prog.style.width = steps[i][0] + '%';
    txt.textContent = steps[i][1];
    i++;
    setTimeout(tick, 300 + Math.random() * 200);
  };
  setTimeout(tick, 200);
}

// ─── Init App ─────────────────────────────────────
function initApp() {
  createParticles();
  initNav();
  initTheme();
  renderLibraries('all');
  initLibsFilter();
  renderProjects();
  renderAnimShowcase();
  initScrollAnimations();
  initCounters();
}

// ─── Particles ────────────────────────────────────
function createParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${1 + Math.random() * 3}px;
      height: ${1 + Math.random() * 3}px;
      animation-duration: ${5 + Math.random() * 10}s;
      animation-delay: ${Math.random() * 10}s;
      background: ${Math.random() > 0.5 ? 'var(--accent)' : 'var(--purple)'};
    `;
    container.appendChild(p);
  }
}

// ─── Nav Scroll ───────────────────────────────────
function initNav() {
  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ─── Theme ────────────────────────────────────────
function initTheme() {
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('animforge_theme') || 'dark';
  applyTheme(saved);
  if (btn) btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('animforge_theme', next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ─── Libraries Render ─────────────────────────────
function renderLibraries(filter) {
  const grid = document.getElementById('libsGrid');
  if (!grid) return;

  const filtered = filter === 'all' ? LIBRARIES : LIBRARIES.filter(l => l.type === filter);

  grid.innerHTML = '';
  filtered.forEach((lib, i) => {
    const badge = BADGE_LABELS[lib.type];
    const card = document.createElement('div');
    card.className = 'lib-card';
    card.style.transitionDelay = (i * 0.03) + 's';
    card.innerHTML = `
      <div class="lib-header">
        <span class="lib-name">${lib.name}</span>
        <span class="lib-badge ${badge.cls}">${badge.label}</span>
      </div>
      <div class="lib-desc">${lib.desc}</div>
    `;
    if (lib.url && lib.url !== '#') {
      card.style.cursor = 'pointer';
      card.title = lib.url;
      card.addEventListener('click', () => window.open(lib.url, '_blank'));
    }
    grid.appendChild(card);
    // Trigger animation
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('visible')));
  });
}

function initLibsFilter() {
  document.querySelectorAll('.lib-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lib-filter-btn').forEach(b => {
        b.classList.remove('btn-primary', 'active');
        b.classList.add('btn-outline');
      });
      btn.classList.add('btn-primary', 'active');
      btn.classList.remove('btn-outline');
      renderLibraries(btn.dataset.filter);
    });
  });
}

// ─── Projects Render ──────────────────────────────
function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  const noProj = document.getElementById('noProjects');
  if (!grid) return;

  const projects = loadProjects();

  if (projects.length === 0) {
    grid.style.display = 'none';
    if (noProj) noProj.style.display = 'block';
    return;
  }

  grid.innerHTML = '';
  projects.forEach(proj => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="project-thumb">
        <div class="project-thumb-anim">🎨</div>
      </div>
      <div class="project-info">
        <div class="project-name">${escapeHtml(proj.name)}</div>
        <div class="project-meta">${formatDate(proj.savedAt)} · ${proj.frameCount || 24} إطار · ${proj.fps || 24} FPS</div>
        <div class="project-actions">
          <a href="studio.html?project=${encodeURIComponent(proj.id)}" class="btn btn-primary btn-sm">▶ فتح</a>
          <button class="btn btn-outline btn-sm" onclick="deleteProject('${proj.id}', this.closest('.project-card'))">🗑</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem('animforge_projects') || '[]');
  } catch { return []; }
}

function deleteProject(id, card) {
  if (!confirm('هل تريد حذف هذا المشروع؟')) return;
  const projects = loadProjects().filter(p => p.id !== id);
  localStorage.setItem('animforge_projects', JSON.stringify(projects));
  if (card) {
    card.style.transition = 'all 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.9)';
    setTimeout(() => { card.remove(); renderProjects(); }, 300);
  }
  showToast('تم حذف المشروع', 'success');
}

// ─── Anim Showcase ────────────────────────────────
function renderAnimShowcase() {
  const grid = document.getElementById('animShowcase');
  if (!grid) return;

  PREBUILT_ANIMS.forEach(anim => {
    const card = document.createElement('div');
    card.style.cssText = `
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    card.innerHTML = `
      <div style="font-size:40px; margin-bottom:12px; display:block;">${anim.icon}</div>
      <div style="font-family:var(--font-display); font-size:13px; font-weight:700; letter-spacing:1px; color:${anim.color}; margin-bottom:6px;">${anim.name}</div>
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-dim);">${anim.frames} إطار</div>
      <div style="margin-top:12px;">
        <a href="studio.html?anim=${anim.id}" class="btn btn-sm" style="background:${anim.color}20; border:1px solid ${anim.color}40; color:${anim.color}; font-size:11px; padding:4px 12px; border-radius:4px;">▶ معاينة</a>
      </div>
    `;
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-6px)';
      card.style.borderColor = anim.color + '60';
      card.style.boxShadow = `0 12px 30px ${anim.color}20`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.borderColor = '';
      card.style.boxShadow = '';
    });
    grid.appendChild(card);
  });
}

// ─── Scroll Animations ────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = (parseInt(el.dataset.delay) || 0) * 80;
        setTimeout(() => el.classList.add('visible'), delay);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.feature-card, .lib-card').forEach(el => observer.observe(el));
}

// ─── Counters Animation ───────────────────────────
function initCounters() {
  const counters = document.querySelectorAll('.stat-value');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

function animateCounter(el) {
  const text = el.textContent;
  const num = parseInt(text.replace(/\D/g, ''));
  const suffix = text.replace(/[\d]/g, '');
  if (isNaN(num)) return;

  let current = 0;
  const step = num / 40;
  const timer = setInterval(() => {
    current = Math.min(current + step, num);
    el.innerHTML = Math.floor(current) + '<span>' + suffix.trim() + '</span>';
    if (current >= num) clearInterval(timer);
  }, 30);
}

// ─── Toast ────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-text">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toast-in 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── Utilities ────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(ts) {
  if (!ts) return 'غير محدد';
  const d = new Date(ts);
  return d.toLocaleDateString('ar-SA');
}
