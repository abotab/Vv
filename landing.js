// ===== THEME =====
let isDark = true;

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('light-mode', !isDark);
  const icon = document.getElementById('themeIcon');
  icon.innerHTML = isDark
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
}

// ===== PARTICLES =====
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animId;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticle() {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8EDEA'];
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 2 + 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: Math.random() * 0.5 + 0.1,
  };
}

function initParticles() {
  particles = Array.from({ length: 60 }, createParticle);
}

function animParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;
    
    // Draw connections
    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j];
      const dx = p.x - q.x, dy = p.y - q.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 120) {
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = (1 - dist / 120) * 0.1;
        ctx.lineWidth = 0.5;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.opacity;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  animId = requestAnimationFrame(animParticles);
}

// ===== MODAL =====
const cardData = {
  'رسم كاريكاتير': 'ارسم شخصيات ساخرة ومعبرة بأسلوب احترافي. أدوات متخصصة للتحريف والتشويه الفني.',
  'رسم رقمي': 'أنشئ أعمالاً فنية رقمية بجودة عالية مع طبقات، فرش متقدمة، وألوان احترافية.',
  'رسم سكتشات': 'سجّل أفكارك بسرعة وحرية. رسم حر وطبيعي مثل الورق تماماً.',
  'رسوم متحركة': 'أحِ شخصياتك بأنيميشن سلس واحترافي مع إطارات رئيسية وأدوات حركة.',
};

function openCard(el, name) {
  document.getElementById('modalTitle').textContent = name;
  document.getElementById('modalDesc').textContent = cardData[name] || '';
  document.getElementById('cardModal').classList.add('active');
}

function closeModal(e) {
  if (e.target === document.getElementById('cardModal')) {
    document.getElementById('cardModal').classList.remove('active');
  }
}

// ===== GSAP ANIMATIONS =====
function initAnimations() {
  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    
    gsap.from('.gallery-card', {
      scrollTrigger: {
        trigger: '.features-section',
        start: 'top 80%',
      },
      y: 50,
      opacity: 0,
      duration: 0.7,
      stagger: 0.15,
      ease: 'power3.out',
    });
    
    gsap.from('.cta-content', {
      scrollTrigger: {
        trigger: '.cta-section',
        start: 'top 80%',
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    });
  }
}

// ===== INIT =====
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
initParticles();
animParticles();
initAnimations();
