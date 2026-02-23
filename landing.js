// THEME
let isDark = true;
function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('light-mode', !isDark);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.innerHTML = isDark
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>';
}

// PARTICLES
const canvas = document.getElementById('particles-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [];
  const colors = ['#FF6B6B','#4ECDC4','#FFE66D','#A8EDEA','#FED6E3'];

  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  function mkParticle() {
    return { x: Math.random()*canvas.width, y: Math.random()*canvas.height,
      vx: (Math.random()-.5)*.4, vy: (Math.random()-.5)*.4,
      r: Math.random()*1.8+.4, color: colors[Math.floor(Math.random()*colors.length)],
      a: Math.random()*.5+.1 };
  }
  function init() { particles = Array.from({length:55}, mkParticle); }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (let i=0;i<particles.length;i++) {
      const p = particles[i];
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=canvas.width; if(p.x>canvas.width)p.x=0;
      if(p.y<0)p.y=canvas.height; if(p.y>canvas.height)p.y=0;
      for(let j=i+1;j<particles.length;j++) {
        const q=particles[j], dx=p.x-q.x, dy=p.y-q.y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<110){ctx.beginPath();ctx.strokeStyle=p.color;ctx.globalAlpha=(1-d/110)*.08;ctx.lineWidth=.5;ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
      }
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.color; ctx.globalAlpha=p.a; ctx.fill();
    }
    ctx.globalAlpha=1;
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize(); init(); draw();
}
