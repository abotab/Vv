/* landing.js — صفحة الهبوط */

// إعدادات المشروع
let projectSettings = {
  type: null,
  bgColor: '#ffffff',
  width: 800,
  height: 600
};

// جسيمات الخلفية
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resize();
  window.addEventListener('resize', resize);
  
  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.size = Math.random() * 2 + 0.5;
      this.opacity = Math.random() * 0.4 + 0.05;
      this.color = Math.random() > 0.5 ? '#FF6B35' : '#FFD700';
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
        this.reset();
      }
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  // إنشاء 80 جسيم
  for (let i = 0; i < 80; i++) particles.push(new Particle());
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // رسم خطوط الاتصال
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / 100) * 0.05;
          ctx.strokeStyle = '#FF6B35';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  
  animate();
})();

// تفعيل البطاقات
function toggleCard(card) {
  const cards = document.querySelectorAll('.art-card');
  const wasActive = card.classList.contains('active');
  
  cards.forEach(c => c.classList.remove('active'));
  
  if (!wasActive) {
    card.classList.add('active');
  }
}

// الانتقال للاستوديو
function goToStudio() {
  document.getElementById('projectModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('projectModal').style.display = 'none';
}

// اختيار نوع المشروع
function openStudio(type) {
  const cards = document.querySelectorAll('.project-type-card');
  cards.forEach(c => c.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  
  projectSettings.type = type;
  document.getElementById('canvasSettings').style.display = 'block';
  
  if (type === 'animated') {
    document.getElementById('animExportLabel').style.display = 'block';
    document.getElementById('animExportGrid').style.display = 'grid';
  }
}

// اختيار لون الخلفية
function selectBg(btn, color, isCustom = false) {
  projectSettings.bgColor = color;
  
  if (!isCustom) {
    document.querySelectorAll('.bg-opt').forEach(b => b.classList.remove('selected'));
    if (btn) btn.classList.add('selected');
  }
}

// اختيار حجم
function selectSize(btn, w, h) {
  projectSettings.width = w;
  projectSettings.height = h;
  
  document.querySelectorAll('.size-preset').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  
  document.getElementById('customWidth').value = w;
  document.getElementById('customHeight').value = h;
}

// تطبيق أبعاد مخصصة
function applyCustomDims() {
  const w = parseInt(document.getElementById('customWidth').value);
  const h = parseInt(document.getElementById('customHeight').value);
  
  if (w >= 100 && w <= 8000 && h >= 100 && h <= 8000) {
    projectSettings.width = w;
    projectSettings.height = h;
    document.querySelectorAll('.size-preset').forEach(b => b.classList.remove('selected'));
  } else {
    alert('الأبعاد يجب أن تكون بين 100 و 8000 بكسل');
  }
}

// إنشاء المشروع
function createProject() {
  if (!projectSettings.type) {
    alert('الرجاء اختيار نوع المشروع أولاً');
    return;
  }
  
  // حفظ الإعدادات
  sessionStorage.setItem('projectSettings', JSON.stringify(projectSettings));
  
  // الانتقال للاستوديو
  window.location.href = 'studio.html';
}

// إغلاق النافذة عند النقر خارجها
document.getElementById('projectModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// تحريك ظهور العناصر عند التمرير
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.art-card, .feature-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s, transform 0.5s';
  observer.observe(el);
});
