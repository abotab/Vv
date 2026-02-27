/* ============================================================
   صفوان ستوديو — landing.js
   ============================================================ */

'use strict';

// ---- Theme ----
const THEME_KEY = 'safwan_theme';

function applyTheme(theme) {
  document.body.classList.toggle('light-mode', theme === 'light');
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  applyTheme(saved || preferred);
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.contains('light-mode');
      applyTheme(isLight ? 'dark' : 'light');
    });
  }

  // Particle / animated BG canvas
  initParticleBg();

  // Intersection observer for scroll animations
  initScrollAnimations();

  // Start button → open new project modal
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const modal = document.getElementById('newProjectModal');
      if (modal) { modal.style.display = 'flex'; }
    });
  }

  // CTA buttons that go directly to studio
  document.querySelectorAll('[onclick*="studio.html"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // If startBtn specifically, we handle via modal
      if (btn.id === 'startBtn') return;
    });
  });

  // Close modal on overlay click
  const modal = document.getElementById('newProjectModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) { modal.style.display = 'none'; }
    });
  }

  // Modal: size presets
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const w = btn.dataset.w;
      const h = btn.dataset.h;
      if (w) document.getElementById('canvasWidth').value = w;
      if (h) document.getElementById('canvasHeight').value = h;
    });
  });

  // Modal: bg options
  document.querySelectorAll('.bg-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.bg-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
  });

  // Modal: create project → go to studio
  const createBtn = document.getElementById('createProjectBtn');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const name = document.getElementById('projectName').value || 'بدون عنوان';
      const w = document.getElementById('canvasWidth').value || 1920;
      const h = document.getElementById('canvasHeight').value || 1080;
      const dpi = document.getElementById('canvasDPI').value || 300;
      const bg = document.querySelector('.bg-opt.active')?.dataset.bg || 'white';
      const params = new URLSearchParams({ name, w, h, dpi, bg });
      window.location.href = `studio.html?${params.toString()}`;
    });
  }

  // Category cards hover reveal
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const label = card.querySelector('.cat-label');
      if (label) {
        label.style.opacity = '1';
        label.style.transform = 'translateY(0)';
      }
    });
    card.addEventListener('mouseleave', () => {
      const label = card.querySelector('.cat-label');
      if (label) {
        label.style.opacity = '0';
        label.style.transform = 'translateY(8px)';
      }
    });
  });

  // Feature cards tilt on hover
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-6px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
});

// ---- Particle Background ----
function initParticleBg() {
  const container = document.getElementById('bgCanvas');
  if (!container) return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const particles = [];

  function resize() {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  const colors = ['#ff6b35', '#ffd166', '#06d6a0', '#e63946', '#a855f7', '#118ab2'];

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Draw connections
    ctx.strokeStyle = 'rgba(255,107,53,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.globalAlpha = (1 - dist / 120) * 0.15;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}

// ---- Scroll Animations ----
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Add fade-up class to sections
  const targets = document.querySelectorAll(
    '.feature-card, .category-card, .section-header, .cta-content'
  );

  targets.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity .6s ease ${i * 0.08}s, transform .6s ease ${i * 0.08}s`;
    observer.observe(el);
  });

  // Once in view
  const styleEl = document.createElement('style');
  styleEl.textContent = `.in-view { opacity: 1 !important; transform: translateY(0) !important; }`;
  document.head.appendChild(styleEl);
}
