/**
 * SAFWAN STUDIO - landing.js
 * Landing Page & Projects Page JavaScript
 */

'use strict';

// ============================================================
// THEME MANAGEMENT
// ============================================================
const ThemeManager = {
  current: 'light',

  init() {
    const saved = localStorage.getItem('safwan-theme') || 'light';
    this.set(saved);
    // Auto detect system preference
    if (!localStorage.getItem('safwan-theme')) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.set('dark');
      }
    }
  },

  set(theme) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('safwan-theme', theme);
    this.updateToggleIcons();
  },

  toggle() {
    this.set(this.current === 'dark' ? 'light' : 'dark');
  },

  updateToggleIcons() {
    document.querySelectorAll('.btn-theme-toggle').forEach(btn => {
      const icon = btn.querySelector('svg, .theme-icon');
      btn.title = this.current === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي';
      btn.innerHTML = this.current === 'dark'
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
             <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
             <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
             <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
             <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
           </svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
           </svg>`;
    });
  }
};

// ============================================================
// PARTICLE SYSTEM
// ============================================================
const ParticleSystem = {
  particles: [],
  colors: ['#FF6B35', '#F7C948', '#4ECDC4', '#9B5DE5', '#F15BB5', '#00BBF9'],

  init() {
    const container = document.querySelector('.hero-particles');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
      this.createParticle(container);
    }
  },

  createParticle(container) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 12 + 4;
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      background: ${color};
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      --duration: ${Math.random() * 6 + 4}s;
      --delay: ${Math.random() * 4}s;
      opacity: ${Math.random() * 0.3 + 0.1};
    `;
    container.appendChild(p);
  }
};

// ============================================================
// ART TYPES GRID
// ============================================================
const ArtTypesSection = {
  artData: [
    {
      id: 'realistic',
      title: 'الرسم الواقعي',
      desc: 'فن يهدف لمحاكاة الواقع بدقة متناهية، يعتمد على الضوء والظل والنسب الدقيقة لخلق أعمال شبيهة بالصور.',
      tag: 'Realistic',
      gradient: 'linear-gradient(135deg, #2c3e50, #3498db)',
      img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80'
    },
    {
      id: 'abstract',
      title: 'الرسم التجريدي',
      desc: 'تعبير فني حر يتجاوز حدود الواقع، يستخدم الأشكال والألوان والخطوط للتعبير عن المشاعر والأفكار.',
      tag: 'Abstract',
      gradient: 'linear-gradient(135deg, #8e44ad, #e74c3c)',
      img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80'
    },
    {
      id: 'cartoon',
      title: 'الرسم الكرتوني',
      desc: 'أسلوب بصري مرح ومبسط يعتمد على خطوط واضحة وألوان زاهية لإنشاء شخصيات وقصص جذابة.',
      tag: 'Cartoon',
      gradient: 'linear-gradient(135deg, #f39c12, #e74c3c)',
      img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'
    },
    {
      id: 'sketch',
      title: 'رسم السكتشات',
      desc: 'الرسم التخطيطي السريع الذي يلتقط جوهر الفكرة بخطوط تلقائية وعفوية، أساس كل مشروع إبداعي.',
      tag: 'Sketch',
      gradient: 'linear-gradient(135deg, #27ae60, #2980b9)',
      img: 'https://images.unsplash.com/photo-1605472915823-5a4528a29cc2?w=600&q=80'
    }
  ],

  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const grid = document.querySelector('.art-types-grid');
    if (!grid) return;

    grid.innerHTML = this.artData.map(art => `
      <div class="art-card" data-id="${art.id}">
        <img
          class="art-card-img"
          src="${art.img}"
          alt="${art.title}"
          loading="lazy"
          onerror="this.style.display='none'; this.parentElement.style.background='${art.gradient}'"
        />
        <div class="art-card-overlay">
          <div class="art-card-info">
            <div class="art-card-title">${art.title}</div>
            <div class="art-card-desc">${art.desc}</div>
          </div>
        </div>
        <div class="art-card-tag">${art.tag}</div>
      </div>
    `).join('');
  },

  bindEvents() {
    document.addEventListener('click', e => {
      const card = e.target.closest('.art-card');
      if (card) {
        document.querySelectorAll('.art-card.active').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      } else {
        document.querySelectorAll('.art-card.active').forEach(c => c.classList.remove('active'));
      }
    });
  }
};

// ============================================================
// NEW PROJECT MODAL
// ============================================================
const NewProjectModal = {
  isOpen: false,
  selectedType: 'static',
  selectedPreset: null,
  bgColor: '#FFFFFF',

  presets: [
    // Social Media
    { id: 'instagram_sq', name: 'Instagram مربع', w: 1080, h: 1080, cat: 'social', platform: 'IG' },
    { id: 'instagram_story', name: 'Instagram قصة', w: 1080, h: 1920, cat: 'social', platform: 'IG' },
    { id: 'tiktok', name: 'TikTok', w: 1080, h: 1920, cat: 'social', platform: 'TK' },
    { id: 'youtube_thumb', name: 'YouTube مصغر', w: 1280, h: 720, cat: 'social', platform: 'YT' },
    { id: 'youtube_banner', name: 'YouTube بانر', w: 2560, h: 1440, cat: 'social', platform: 'YT' },
    { id: 'facebook_post', name: 'Facebook منشور', w: 1200, h: 630, cat: 'social', platform: 'FB' },
    { id: 'facebook_cover', name: 'Facebook غلاف', w: 1640, h: 624, cat: 'social', platform: 'FB' },
    { id: 'twitter_post', name: 'Twitter منشور', w: 1200, h: 675, cat: 'social', platform: 'TW' },
    { id: 'twitter_header', name: 'Twitter هيدر', w: 1500, h: 500, cat: 'social', platform: 'TW' },
    { id: 'snapchat', name: 'Snapchat', w: 1080, h: 1920, cat: 'social', platform: 'SC' },
    { id: 'linkedin_post', name: 'LinkedIn منشور', w: 1200, h: 627, cat: 'social', platform: 'LI' },
    { id: 'pinterest', name: 'Pinterest', w: 1000, h: 1500, cat: 'social', platform: 'PI' },
    // Print
    { id: 'a4', name: 'A4', w: 2480, h: 3508, cat: 'print', platform: 'A4' },
    { id: 'a3', name: 'A3', w: 3508, h: 4961, cat: 'print', platform: 'A3' },
    { id: 'a5', name: 'A5', w: 1748, h: 2480, cat: 'print', platform: 'A5' },
    { id: 'business_card', name: 'بطاقة عمل', w: 1050, h: 600, cat: 'print', platform: 'BC' },
    // Screen
    { id: 'hd', name: 'HD 720p', w: 1280, h: 720, cat: 'screen', platform: 'HD' },
    { id: 'fhd', name: 'FHD 1080p', w: 1920, h: 1080, cat: 'screen', platform: 'FH' },
    { id: '4k', name: '4K Ultra HD', w: 3840, h: 2160, cat: 'screen', platform: '4K' },
    { id: 'square', name: 'مربع', w: 1000, h: 1000, cat: 'screen', platform: 'SQ' },
    { id: 'banner_wide', name: 'بانر عريض', w: 1600, h: 400, cat: 'screen', platform: 'BN' },
    // Mobile
    { id: 'iphone_14', name: 'iPhone 14', w: 1170, h: 2532, cat: 'mobile', platform: 'IP' },
    { id: 'android', name: 'Android HD', w: 1080, h: 1920, cat: 'mobile', platform: 'AN' },
    { id: 'ipad', name: 'iPad', w: 2048, h: 2732, cat: 'mobile', platform: 'ID' },
  ],

  bgColors: [
    { hex: '#FFFFFF', name: 'أبيض' },
    { hex: '#000000', name: 'أسود' },
    { hex: '#F8F9FA', name: 'رمادي فاتح' },
    { hex: '#212529', name: 'رمادي داكن' },
    { hex: '#FF6B35', name: 'برتقالي' },
    { hex: '#F7C948', name: 'أصفر ذهبي' },
    { hex: '#4ECDC4', name: 'تيل' },
    { hex: '#9B5DE5', name: 'بنفسجي' },
    { hex: '#00BBF9', name: 'أزرق' },
    { hex: '#transparent', name: 'شفاف' },
  ],

  open() {
    const overlay = document.getElementById('new-project-modal');
    if (overlay) {
      overlay.classList.add('active');
      this.isOpen = true;
    }
  },

  close() {
    const overlay = document.getElementById('new-project-modal');
    if (overlay) {
      overlay.classList.remove('active');
      this.isOpen = false;
    }
  },

  init() {
    this.renderModal();
    this.bindEvents();
  },

  renderModal() {
    const cats = ['social', 'print', 'screen', 'mobile'];
    const catNames = { social: 'شبكات التواصل', print: 'طباعة', screen: 'شاشة', mobile: 'جوال' };
    let presetsHTML = '';
    cats.forEach(cat => {
      const items = this.presets.filter(p => p.cat === cat);
      presetsHTML += `<div style="grid-column:1/-1;font-size:0.7rem;color:var(--text-muted);font-weight:700;padding:4px 0;letter-spacing:1px;text-transform:uppercase">${catNames[cat]}</div>`;
      presetsHTML += items.map(p => `
        <button class="preset-btn" data-preset="${p.id}" data-w="${p.w}" data-h="${p.h}" title="${p.name}: ${p.w}×${p.h}">
          <div class="preset-btn-icon">
            <span style="font-size:0.6rem;font-weight:900;color:var(--text-muted)">${p.platform}</span>
          </div>
          <span class="preset-btn-name">${p.name}</span>
          <span class="preset-btn-size">${p.w}×${p.h}</span>
        </button>
      `).join('');
    });

    const colorsHTML = this.bgColors.map(c => `
      <div class="color-opt ${c.hex === '#FFFFFF' ? 'selected' : ''}"
           data-color="${c.hex}"
           title="${c.name}"
           style="background:${c.hex === '#transparent' ? 'linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)' : c.hex};background-size:8px 8px;background-position:0 0,4px 4px;border:2px solid rgba(0,0,0,0.1)">
      </div>
    `).join('');

    const modal = document.getElementById('new-project-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">مشروع جديد</div>
        <div class="modal-subtitle">اختر نوع المشروع وإعدادات اللوحة</div>

        <div class="modal-form-group">
          <label class="modal-label">اسم المشروع</label>
          <input type="text" class="modal-input" id="project-name-input" placeholder="مشروعي الجديد" value="مشروع ${Date.now().toString().slice(-4)}">
        </div>

        <div class="modal-form-group">
          <label class="modal-label">نوع المشروع</label>
          <div class="project-type-grid">
            <button class="project-type-btn selected" data-type="static">
              <span class="project-type-btn-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                </svg>
              </span>
              <span class="project-type-btn-label">رسم ثابت</span>
            </button>
            <button class="project-type-btn" data-type="animated">
              <span class="project-type-btn-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </span>
              <span class="project-type-btn-label">رسم متحرك</span>
            </button>
          </div>
        </div>

        <div class="modal-form-group">
          <label class="modal-label">قياسات جاهزة</label>
          <div class="preset-grid" id="presets-grid">${presetsHTML}</div>
        </div>

        <div class="modal-form-group">
          <label class="modal-label">أبعاد مخصصة</label>
          <div class="size-inputs">
            <input type="number" class="size-input" id="canvas-w" value="1080" min="1" max="8000">
            <span class="size-separator">×</span>
            <input type="number" class="size-input" id="canvas-h" value="1080" min="1" max="8000">
            <span class="size-separator" style="font-size:0.75rem;color:var(--text-muted)">px</span>
            <input type="number" class="size-input" id="canvas-dpi" value="72" min="72" max="300">
          </div>
          <div style="display:flex;gap:12px;margin-top:6px;font-size:0.72rem;color:var(--text-muted)">
            <span>العرض</span><span style="margin-right:auto"></span><span>الارتفاع</span><span style="margin-right:auto"></span><span>DPI</span>
          </div>
        </div>

        <div class="modal-form-group">
          <label class="modal-label">لون الخلفية</label>
          <div class="color-options">${colorsHTML}</div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" id="modal-cancel-btn">إلغاء</button>
          <button class="btn-create" id="modal-create-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:6px">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            ابدأ الرسم
          </button>
        </div>
      </div>
    `;
  },

  bindEvents() {
    document.addEventListener('click', e => {
      // Open buttons
      if (e.target.closest('#start-btn, .btn-primary-hero, #cta-start-btn, .btn-cta-white')) {
        e.preventDefault();
        this.open();
        return;
      }

      // Cancel
      if (e.target.closest('#modal-cancel-btn')) {
        this.close();
        return;
      }

      // Close on overlay click
      const overlay = document.getElementById('new-project-modal');
      if (e.target === overlay) {
        this.close();
        return;
      }

      // Project type
      const typeBtn = e.target.closest('.project-type-btn');
      if (typeBtn) {
        document.querySelectorAll('.project-type-btn').forEach(b => b.classList.remove('selected'));
        typeBtn.classList.add('selected');
        this.selectedType = typeBtn.dataset.type;
        return;
      }

      // Preset
      const presetBtn = e.target.closest('.preset-btn');
      if (presetBtn) {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
        presetBtn.classList.add('selected');
        this.selectedPreset = presetBtn.dataset.preset;
        const w = presetBtn.dataset.w;
        const h = presetBtn.dataset.h;
        const wInput = document.getElementById('canvas-w');
        const hInput = document.getElementById('canvas-h');
        if (wInput) wInput.value = w;
        if (hInput) hInput.value = h;
        return;
      }

      // Background color
      const colorOpt = e.target.closest('.color-opt');
      if (colorOpt) {
        document.querySelectorAll('.color-opt').forEach(c => c.classList.remove('selected'));
        colorOpt.classList.add('selected');
        this.bgColor = colorOpt.dataset.color;
        return;
      }

      // Create project
      if (e.target.closest('#modal-create-btn')) {
        this.createProject();
        return;
      }
    });
  },

  createProject() {
    const nameInput = document.getElementById('project-name-input');
    const wInput = document.getElementById('canvas-w');
    const hInput = document.getElementById('canvas-h');
    const dpiInput = document.getElementById('canvas-dpi');

    const project = {
      id: 'proj_' + Date.now(),
      name: nameInput ? nameInput.value || 'مشروع جديد' : 'مشروع جديد',
      type: this.selectedType,
      width: wInput ? parseInt(wInput.value) || 1080 : 1080,
      height: hInput ? parseInt(hInput.value) || 1080 : 1080,
      dpi: dpiInput ? parseInt(dpiInput.value) || 72 : 72,
      bgColor: this.bgColor,
      created: new Date().toISOString(),
      thumbnail: null,
      layers: [{ id: 'layer_0', name: 'الطبقة الأساسية', opacity: 100, visible: true, locked: false, data: null }],
      frames: this.selectedType === 'animated' ? [{ id: 'frame_0', duration: 100, layers: [] }] : []
    };

    // Save to storage
    ProjectsManager.addProject(project);
    this.close();

    // Open studio
    StudioLauncher.open(project);
  }
};

// ============================================================
// PROJECTS MANAGER
// ============================================================
const ProjectsManager = {
  storageKey: 'safwan-projects',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch { return []; }
  },

  addProject(project) {
    const projects = this.getAll();
    projects.unshift(project);
    this.saveAll(projects);
  },

  saveProject(project) {
    const projects = this.getAll();
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = project;
    } else {
      projects.unshift(project);
    }
    this.saveAll(projects);
  },

  deleteProject(id) {
    const projects = this.getAll().filter(p => p.id !== id);
    this.saveAll(projects);
  },

  saveAll(projects) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(projects));
    } catch (e) {
      console.warn('Storage full, clearing old projects');
      const slim = projects.slice(0, 10).map(p => ({ ...p, thumbnail: null }));
      localStorage.setItem(this.storageKey, JSON.stringify(slim));
    }
  },

  renderGrid() {
    const grid = document.querySelector('.projects-grid');
    if (!grid) return;

    const projects = this.getAll();
    const newCard = `
      <div class="project-card-new" id="new-project-card">
        <div class="project-card-new-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <div style="font-size:0.88rem;font-weight:700">مشروع جديد</div>
      </div>
    `;

    const projectCards = projects.map(p => `
      <div class="project-card" data-id="${p.id}">
        <div class="project-thumb">
          ${p.thumbnail
            ? `<img src="${p.thumbnail}" style="width:100%;height:100%;object-fit:contain">`
            : `<svg class="project-thumb-placeholder" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1">
                 <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
               </svg>`
          }
        </div>
        <div class="project-info">
          <div class="project-name">${p.name}</div>
          <div class="project-meta">
            <span>${p.width}×${p.height}</span>
            <span class="project-type-badge ${p.type}">${p.type === 'static' ? 'ثابت' : 'متحرك'}</span>
          </div>
        </div>
        <div class="project-actions">
          <button class="project-action-btn delete-btn" data-id="${p.id}" title="حذف">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    grid.innerHTML = newCard + projectCards;

    // Bind events
    document.getElementById('new-project-card')?.addEventListener('click', () => NewProjectModal.open());

    grid.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.delete-btn')) return;
        const id = card.dataset.id;
        const project = this.getAll().find(p => p.id === id);
        if (project) StudioLauncher.open(project);
      });
    });

    grid.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm('هل تريد حذف هذا المشروع؟')) {
          this.deleteProject(btn.dataset.id);
          this.renderGrid();
          showNotification('تم حذف المشروع', 'error');
        }
      });
    });
  }
};

// ============================================================
// NAVIGATION
// ============================================================
const Navigation = {
  currentPage: 'landing',

  showPage(page) {
    const landing = document.getElementById('landing-page');
    const projects = document.getElementById('projects-page');
    const studio = document.getElementById('studio-page');

    [landing, projects, studio].forEach(el => {
      if (el) {
        el.classList.remove('active');
        el.style.display = 'none';
      }
    });

    this.currentPage = page;

    if (page === 'landing' && landing) {
      landing.style.display = 'block';
      landing.classList.add('active');
    } else if (page === 'projects' && projects) {
      projects.style.display = 'block';
      projects.classList.add('active');
      ProjectsManager.renderGrid();
    } else if (page === 'studio' && studio) {
      studio.style.display = 'flex';
      studio.classList.add('active');
    }
  }
};

// ============================================================
// STUDIO LAUNCHER
// ============================================================
const StudioLauncher = {
  currentProject: null,

  open(project) {
    this.currentProject = project;

    // If studio page doesn't exist, redirect
    const studioPage = document.getElementById('studio-page');
    if (!studioPage) {
      // Store in session and open studio.html
      sessionStorage.setItem('safwan-current-project', JSON.stringify(project));
      window.location.href = 'studio.html';
      return;
    }

    Navigation.showPage('studio');
    document.dispatchEvent(new CustomEvent('studio:open', { detail: project }));
  }
};

// ============================================================
// SETTINGS
// ============================================================
const SettingsPanel = {
  isOpen: false,

  open() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.classList.add('active');
      this.isOpen = true;
    }
  },

  close() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.classList.remove('active');
      this.isOpen = false;
    }
  },

  init() {
    this.renderModal();
    this.bindEvents();
  },

  renderModal() {
    let modal = document.getElementById('settings-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'settings-modal';
      modal.className = 'settings-modal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="settings-box">
        <div class="settings-header">
          <div class="settings-title">الإعدادات</div>
          <button class="settings-close" id="settings-close-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="settings-body">
          <div class="settings-row">
            <div>
              <div class="settings-row-label">الوضع الليلي</div>
              <div class="settings-row-desc">تغيير مظهر الواجهة</div>
            </div>
            <div class="toggle-switch ${ThemeManager.current === 'dark' ? 'on' : ''}" id="theme-toggle-settings">
              <div class="toggle-thumb"></div>
            </div>
          </div>

          <div class="settings-row">
            <div>
              <div class="settings-row-label">اللغة</div>
              <div class="settings-row-desc">العربية - Arabic</div>
            </div>
            <div style="font-size:0.85rem;color:var(--text-muted);padding:6px 12px;background:var(--bg-secondary);border-radius:20px">العربية</div>
          </div>

          <div class="settings-row">
            <div>
              <div class="settings-row-label">الحفظ التلقائي</div>
              <div class="settings-row-desc">حفظ المشاريع تلقائياً</div>
            </div>
            <div class="toggle-switch on" id="autosave-toggle">
              <div class="toggle-thumb"></div>
            </div>
          </div>

          <div class="settings-row">
            <div>
              <div class="settings-row-label">الضغط على القلم</div>
              <div class="settings-row-desc">استخدام الضغط للتحكم في السماكة</div>
            </div>
            <div class="toggle-switch on" id="pressure-toggle">
              <div class="toggle-thumb"></div>
            </div>
          </div>

          <div style="padding-top:8px;border-top:1px solid var(--border-color)">
            <div class="settings-row-label" style="margin-bottom:12px">حجم الخط الافتراضي</div>
            <input type="range" min="1" max="100" value="12" class="studio-slider" style="width:100%;background:var(--bg-secondary)">
          </div>

          <div style="padding-top:8px;border-top:1px solid var(--border-color)">
            <button onclick="localStorage.clear(); location.reload()" style="width:100%;padding:10px;border:none;border-radius:8px;background:rgba(255,60,60,0.1);color:#ff4444;cursor:pointer;font-family:'Cairo',sans-serif;font-weight:600;font-size:0.88rem">
              مسح جميع البيانات
            </button>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents() {
    document.addEventListener('click', e => {
      if (e.target.closest('#settings-btn, .settings-open-btn')) {
        this.open();
        return;
      }
      if (e.target.closest('#settings-close-btn')) {
        this.close();
        return;
      }
      const modal = document.getElementById('settings-modal');
      if (e.target === modal) this.close();

      // Theme toggle in settings
      if (e.target.closest('#theme-toggle-settings')) {
        ThemeManager.toggle();
        const toggle = document.getElementById('theme-toggle-settings');
        if (toggle) toggle.classList.toggle('on', ThemeManager.current === 'dark');
        return;
      }

      // Other toggles
      const anyToggle = e.target.closest('.toggle-switch');
      if (anyToggle && anyToggle.id !== 'theme-toggle-settings') {
        anyToggle.classList.toggle('on');
        return;
      }
    });
  }
};

// ============================================================
// SCROLL ANIMATIONS
// ============================================================
const ScrollAnimations = {
  init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'fadeInUp 0.6s ease both';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .art-card, .section').forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });
  }
};

// ============================================================
// UTILITY: NOTIFICATION
// ============================================================
function showNotification(msg, type = 'info') {
  let notif = document.getElementById('global-notification');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'global-notification';
    notif.className = 'notification';
    document.body.appendChild(notif);
  }

  const icons = {
    success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
  };

  notif.className = `notification ${type}`;
  notif.innerHTML = `${icons[type] || icons.info} ${msg}`;
  notif.classList.add('show');

  clearTimeout(notif._timeout);
  notif._timeout = setTimeout(() => notif.classList.remove('show'), 3000);
}

window.showNotification = showNotification;

// ============================================================
// INITIALIZE
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  ParticleSystem.init();
  ArtTypesSection.init();
  NewProjectModal.init();
  SettingsPanel.init();
  ScrollAnimations.init();

  // Setup theme toggle buttons
  document.querySelectorAll('.btn-theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => ThemeManager.toggle());
  });

  // Navigation events
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      Navigation.showPage(el.dataset.nav);
    });
  });

  // Start button opens new project
  document.querySelector('#start-btn')?.addEventListener('click', e => {
    e.preventDefault();
    NewProjectModal.open();
  });

  // Projects button
  document.querySelector('[data-page="projects"]')?.addEventListener('click', e => {
    e.preventDefault();
    Navigation.showPage('projects');
  });

  // ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      NewProjectModal.close();
      SettingsPanel.close();
    }
  });

  // Check if opened from studio link back
  const savedPage = sessionStorage.getItem('safwan-nav-page');
  if (savedPage) {
    sessionStorage.removeItem('safwan-nav-page');
    Navigation.showPage(savedPage);
  }
});
