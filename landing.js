/* landing.js — Safwan Studio Landing Page */

// ─── Canvas Background Animation ───
(function() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const particles = [];
  const PARTICLE_COUNT = 80;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.alpha = Math.random() * 0.4 + 0.05;
      this.color = Math.random() > 0.6
        ? `rgba(255,107,53,${this.alpha})`
        : Math.random() > 0.5
          ? `rgba(247,197,159,${this.alpha})`
          : `rgba(239,239,208,${this.alpha})`;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  // Draw connecting lines
  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(255,107,53,${0.05 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    // Radial gradient overlay
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(255,107,53,0.03)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    drawLines();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
})();

// ─── Scroll Animations ───
(function() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.feat-card, .art-card, .section-header').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });

  // Inject reveal CSS
  const style = document.createElement('style');
  style.textContent = `
    .reveal {
      opacity: 0;
      transform: translateY(28px);
      transition: opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1);
    }
    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .feat-card:nth-child(1) { transition-delay: 0s; }
    .feat-card:nth-child(2) { transition-delay: 0.08s; }
    .feat-card:nth-child(3) { transition-delay: 0.16s; }
    .feat-card:nth-child(4) { transition-delay: 0.24s; }
    .feat-card:nth-child(5) { transition-delay: 0.32s; }
    .feat-card:nth-child(6) { transition-delay: 0.40s; }
    .art-card:nth-child(1) { transition-delay: 0s; }
    .art-card:nth-child(2) { transition-delay: 0.1s; }
    .art-card:nth-child(3) { transition-delay: 0.2s; }
    .art-card:nth-child(4) { transition-delay: 0.3s; }
  `;
  document.head.appendChild(style);
})();

// ─── Nav Scroll Effect ───
(function() {
  const nav = document.querySelector('.landing-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.style.background = 'rgba(14,15,20,0.92)';
    } else {
      nav.style.background = 'rgba(14,15,20,0.6)';
    }
  });
})();

// ─── Art Cards Hover Label ───
(function() {
  document.querySelectorAll('.art-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const label = card.querySelector('.card-label');
      if (label) label.style.opacity = '1';
    });
    card.addEventListener('mouseleave', () => {
      const label = card.querySelector('.card-label');
      if (label) label.style.opacity = '0';
    });
  });
})();

// ─── Smooth Scroll for anchor links ───
(function() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

// ─── Mouse parallax on hero ───
(function() {
  const hero = document.querySelector('.hero-section');
  const floatItems = document.querySelectorAll('.float-item');
  if (!hero || !floatItems.length) return;
  document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    floatItems.forEach((item, i) => {
      const depth = (i + 1) * 0.4;
      item.style.transform += ` translate(${dx * depth * 8}px, ${dy * depth * 8}px)`;
    });
  });
})();
