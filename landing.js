/* landing.js — Safwan Studio v2 */
'use strict';

// ── Canvas Background ──
(function(){
  const canvas = document.getElementById('bgCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const particles = [];
  const N = 90;

  function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize);
  resize();

  class P {
    constructor(){ this.reset(); }
    reset(){
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.4 + 0.3;
      this.vx = (Math.random() - .5) * .38;
      this.vy = (Math.random() - .5) * .38;
      this.a = Math.random() * .38 + .05;
      const t = Math.random();
      this.c = t > .6 ? `rgba(255,107,53,${this.a})` : t > .35 ? `rgba(247,197,159,${this.a})` : `rgba(239,239,208,${this.a})`;
    }
    update(){ this.x += this.vx; this.y += this.vy; if(this.x<0||this.x>W||this.y<0||this.y>H) this.reset(); }
    draw(){ ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fillStyle=this.c; ctx.fill(); }
  }
  for(let i=0;i<N;i++) particles.push(new P());

  function lines(){
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<110){ ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.strokeStyle=`rgba(255,107,53,${.05*(1-d/110)})`; ctx.lineWidth=.45; ctx.stroke(); }
      }
    }
  }

  (function animate(){
    ctx.clearRect(0,0,W,H);
    const g = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.65);
    g.addColorStop(0,'rgba(255,107,53,.025)'); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    lines();
    particles.forEach(p=>{ p.update(); p.draw(); });
    requestAnimationFrame(animate);
  })();
})();

// ── Nav Scroll Effect ──
(function(){
  const nav = document.getElementById('landingNav');
  if(!nav) return;
  window.addEventListener('scroll',()=>{ nav.style.background = window.scrollY>50 ? 'rgba(13,14,19,.92)' : 'rgba(13,14,19,.6)'; });
})();

// ── Scroll Reveal ──
(function(){
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
  },{threshold:.1});
  document.querySelectorAll('.feat-card,.art-card-big,.section-header').forEach(el=>{
    el.classList.add('reveal'); obs.observe(el);
  });
  const s = document.createElement('style');
  s.textContent = `.reveal{opacity:0;transform:translateY(26px);transition:opacity .55s cubic-bezier(.4,0,.2,1),transform .55s cubic-bezier(.4,0,.2,1)}.reveal.visible{opacity:1;transform:translateY(0)}.feat-card:nth-child(1){transition-delay:0s}.feat-card:nth-child(2){transition-delay:.08s}.feat-card:nth-child(3){transition-delay:.16s}.feat-card:nth-child(4){transition-delay:.24s}.feat-card:nth-child(5){transition-delay:.32s}.feat-card:nth-child(6){transition-delay:.4s}.art-card-big:nth-child(1){transition-delay:0s}.art-card-big:nth-child(2){transition-delay:.1s}.art-card-big:nth-child(3){transition-delay:.2s}.art-card-big:nth-child(4){transition-delay:.3s}`;
  document.head.appendChild(s);
})();

// ── Art Cards: Click to Reveal Label, Click Outside to Hide ──
(function(){
  const cards = document.querySelectorAll('.art-card-big');
  if(!cards.length) return;

  cards.forEach(card=>{
    card.addEventListener('click', e=>{
      e.stopPropagation();
      const wasRevealed = card.classList.contains('revealed');
      // Hide all
      cards.forEach(c=>c.classList.remove('revealed'));
      // Toggle current
      if(!wasRevealed) card.classList.add('revealed');
    });
    // Keyboard support
    card.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); card.click(); } });
  });

  // Click anywhere else to hide all
  document.addEventListener('click',()=>{ cards.forEach(c=>c.classList.remove('revealed')); });
})();

// ── Smooth Scroll ──
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if(t) t.scrollIntoView({behavior:'smooth',block:'start'});
  });
});

// ── Hero Mouse Parallax ──
(function(){
  const floats = document.querySelectorAll('.float-item');
  if(!floats.length) return;
  document.addEventListener('mousemove',e=>{
    const cx=window.innerWidth/2, cy=window.innerHeight/2;
    const dx=(e.clientX-cx)/cx, dy=(e.clientY-cy)/cy;
    floats.forEach((item,i)=>{
      const d=(i+1)*.35;
      item.style.transform=`translateY(0) rotate(0deg) translate(${dx*d*7}px,${dy*d*7}px)`;
    });
  });
})();
