/* ==========================================
   صفوان ستوديو - JavaScript الصفحة الرئيسية
   landing.js
   ========================================== */

'use strict';

// ====================================
// حالة الصفحة الرئيسية
// ====================================
const حالة_الرئيسية = {
  بطاقة_مفتوحة: null,
  لون_محدد: null,
  قياس_محدد: null,
  جسيمات: [],
  canvas_جسيمات: null,
  ctx_جسيمات: null,
  تحميل_منتهي: false,
  رقم_حركة: null
};

const إعدادات_المشروع = {
  لون_خلفية: '#1a1a2e',
  قياس_عرض: 1080,
  قياس_ارتفاع: 1920,
  اسم_قياس: 'TikTok عمودي',
  اسم_مشروع: ''
};

// ====================================
// بدء التشغيل عند تحميل الصفحة
// ====================================
document.addEventListener('DOMContentLoaded', () => {
  بدء_التحميل();
});

// ====================================
// نظام شاشة التحميل
// ====================================
function بدء_التحميل() {
  const شريط_تقدم = document.querySelector('.تحميل-تقدم');
  const نسبة = document.querySelector('.تحميل-نسبة');
  let تقدم = 0;
  const مدة_كل_خطوة = 30;

  const زيادة_تقدم = setInterval(() => {
    const زيادة = Math.random() * 8 + 3;
    تقدم = Math.min(تقدم + زيادة, 100);

    if (شريط_تقدم) شريط_تقدم.style.width = تقدم + '%';
    if (نسبة) نسبة.textContent = Math.floor(تقدم) + '%';

    if (تقدم >= 100) {
      clearInterval(زيادة_تقدم);
      setTimeout(إنهاء_التحميل, 500);
    }
  }, مدة_كل_خطوة);
}

function إنهاء_التحميل() {
  const شاشة = document.getElementById('شاشة-التحميل');
  const موقع = document.getElementById('الموقع-الرئيسي');

  if (شاشة) {
    شاشة.classList.add('منتهي');
    setTimeout(() => {
      if (شاشة) شاشة.style.display = 'none';
    }, 800);
  }

  if (موقع) {
    موقع.classList.remove('مخفي');
    بدء_الموقع();
  }
}

// ====================================
// تهيئة الموقع الرئيسي
// ====================================
function بدء_الموقع() {
  تهيئة_canvas_جسيمات();
  إنشاء_ذرات_عائمة();
  بدء_عداد_إحصائيات();
  تطبيق_تأثيرات_دخول();
}

// ====================================
// نظام الجسيمات الخلفية
// ====================================
function تهيئة_canvas_جسيمات() {
  const canvas = document.getElementById('canvas-جسيمات');
  if (!canvas) return;

  حالة_الرئيسية.canvas_جسيمات = canvas;
  حالة_الرئيسية.ctx_جسيمات = canvas.getContext('2d');

  const تحديث_حجم = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  تحديث_حجم();
  window.addEventListener('resize', تحديث_حجم);

  // إنشاء الجسيمات
  const عدد_جسيمات = 80;
  حالة_الرئيسية.جسيمات = [];

  for (let i = 0; i < عدد_جسيمات; i++) {
    حالة_الرئيسية.جسيمات.push(إنشاء_جسيمة(canvas.width, canvas.height));
  }

  رسم_جسيمات();
}

function إنشاء_جسيمة(عرض, ارتفاع) {
  return {
    x: Math.random() * عرض,
    y: Math.random() * ارتفاع,
    حجم: Math.random() * 2.5 + 0.5,
    سرعة_x: (Math.random() - 0.5) * 0.4,
    سرعة_y: (Math.random() - 0.5) * 0.4,
    شفافية: Math.random() * 0.6 + 0.1,
    لون: الألوان_جسيمات[Math.floor(Math.random() * الألوان_جسيمات.length)],
    طور: Math.random() * Math.PI * 2,
    سرعة_طور: (Math.random() - 0.5) * 0.02
  };
}

const الألوان_جسيمات = ['#ff6b35', '#ffd700', '#00d4ff', '#7b2ff7', '#ff3366', '#00ff88'];

function رسم_جسيمات() {
  const canvas = حالة_الرئيسية.canvas_جسيمات;
  const ctx = حالة_الرئيسية.ctx_جسيمات;
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  حالة_الرئيسية.جسيمات.forEach((ج, i) => {
    // تحريك
    ج.x += ج.سرعة_x;
    ج.y += ج.سرعة_y;
    ج.طور += ج.سرعة_طور;

    // ارتداد من الحواف
    if (ج.x < 0) ج.x = canvas.width;
    if (ج.x > canvas.width) ج.x = 0;
    if (ج.y < 0) ج.y = canvas.height;
    if (ج.y > canvas.height) ج.y = 0;

    // رسم الجسيمة
    const شفافية_فعلية = ج.شفافية * (0.5 + Math.sin(ج.طور) * 0.5);
    ctx.beginPath();
    ctx.arc(ج.x, ج.y, ج.حجم, 0, Math.PI * 2);
    ctx.fillStyle = ج.لون + Math.floor(شفافية_فعلية * 255).toString(16).padStart(2, '0');
    ctx.fill();

    // رسم خطوط الاتصال
    حالة_الرئيسية.جسيمات.forEach((ج2, j) => {
      if (j <= i) return;
      const مسافة = Math.hypot(ج2.x - ج.x, ج2.y - ج.y);
      if (مسافة < 100) {
        ctx.beginPath();
        ctx.moveTo(ج.x, ج.y);
        ctx.lineTo(ج2.x, ج2.y);
        const شفافية_خط = (1 - مسافة / 100) * 0.15;
        ctx.strokeStyle = `rgba(255,107,53,${شفافية_خط})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });
  });

  حالة_الرئيسية.رقم_حركة = requestAnimationFrame(رسم_جسيمات);
}

// ====================================
// إنشاء الذرات العائمة
// ====================================
function إنشاء_ذرات_عائمة() {
  const حاوية = document.getElementById('حاوية-ذرات');
  if (!حاوية) return;

  const عدد_ذرات = 30;
  const ألوان = ['#ff6b35', '#ffd700', '#00d4ff', '#7b2ff7', '#ff3366'];

  for (let i = 0; i < عدد_ذرات; i++) {
    const ذرة = document.createElement('div');
    ذرة.className = 'ذرة';

    const حجم = Math.random() * 4 + 2;
    const موضع_x = Math.random() * 100;
    const موضع_y = Math.random() * 100;
    const لون = ألوان[Math.floor(Math.random() * ألوان.length)];
    const مدة = (Math.random() * 8 + 6) + 's';
    const تأخير = (Math.random() * 6) + 's';

    const ارتفاع_y = (Math.random() - 0.5) * 60;
    const مسافة_x = (Math.random() - 0.5) * 80;
    const مقياس = Math.random() * 0.8 + 0.4;

    ذرة.style.cssText = `
      width: ${حجم}px;
      height: ${حجم}px;
      background: ${لون};
      left: ${موضع_x}%;
      top: ${موضع_y}%;
      box-shadow: 0 0 ${حجم * 2}px ${لون};
      --مدة: ${مدة};
      --تأخير: ${تأخير};
      --ارتفاع-y: ${ارتفاع_y}px;
      --مسافة-x: ${مسافة_x}px;
      --حجم: ${مقياس};
      animation: عوم-ذرة ${مدة} ease-in-out ${تأخير} infinite alternate;
    `;

    حاوية.appendChild(ذرة);
  }
}

// ====================================
// عداد الإحصائيات
// ====================================
function بدء_عداد_إحصائيات() {
  const عناصر = document.querySelectorAll('.رقم-إحصائية');

  عناصر.forEach(عنصر => {
    const هدف = parseInt(عنصر.getAttribute('data-هدف'));
    let حالي = 0;
    const مدة_الكل = 1500;
    const خطوة_وقت = 30;
    const خطوة = هدف / (مدة_الكل / خطوة_وقت);

    setTimeout(() => {
      const مؤقت = setInterval(() => {
        حالي = Math.min(حالي + خطوة, هدف);
        عنصر.textContent = Math.floor(حالي);
        if (حالي >= هدف) clearInterval(مؤقت);
      }, خطوة_وقت);
    }, 500);
  });
}

// ====================================
// تأثيرات الدخول
// ====================================
function تطبيق_تأثيرات_دخول() {
  const عناصر_للظهور = [
    '.حاوية-شعار-رئيسي',
    '.مجموعة-العنوان',
    '.وصف-رئيسي',
    '.شبكة-ميزات',
    '.أزرار-رئيسية',
    '.قسم-إحصائيات'
  ];

  عناصر_للظهور.forEach((محدد, i) => {
    const عنصر = document.querySelector(محدد);
    if (!عنصر) return;

    عنصر.style.opacity = '0';
    عنصر.style.transform = 'translateY(20px)';
    عنصر.style.transition = `opacity 0.6s ease ${i * 0.15}s, transform 0.6s ease ${i * 0.15}s`;

    setTimeout(() => {
      عنصر.style.opacity = '1';
      عنصر.style.transform = 'translateY(0)';
    }, 100);
  });
}

// ====================================
// تبديل شرح البطاقات
// ====================================
function تبديل_شرح(بطاقة) {
  const بطاقة_مفتوحة_حالياً = حالة_الرئيسية.بطاقة_مفتوحة;

  // إغلاق البطاقة المفتوحة
  if (بطاقة_مفتوحة_حالياً && بطاقة_مفتوحة_حالياً !== بطاقة) {
    بطاقة_مفتوحة_حالياً.classList.remove('مفتوح');
  }

  // تبديل البطاقة الحالية
  if (بطاقة.classList.contains('مفتوح')) {
    بطاقة.classList.remove('مفتوح');
    حالة_الرئيسية.بطاقة_مفتوحة = null;
  } else {
    بطاقة.classList.add('مفتوح');
    حالة_الرئيسية.بطاقة_مفتوحة = بطاقة;
  }
}

// إغلاق البطاقات عند النقر خارجها
document.addEventListener('click', (ح) => {
  const بطاقة = ح.target.closest('.بطاقة-ميزة');
  if (!بطاقة && حالة_الرئيسية.بطاقة_مفتوحة) {
    حالة_الرئيسية.بطاقة_مفتوحة.classList.remove('مفتوح');
    حالة_الرئيسية.بطاقة_مفتوحة = null;
  }
});

// ====================================
// نافذة إعدادات المشروع
// ====================================
function ابدا_الآن() {
  const نافذة = document.getElementById('نافذة-مشروع');
  if (نافذة) {
    نافذة.classList.remove('مخفية');
    إضافة_تأثير_زر();
  }
}

function إغلاق_نافذة() {
  const نافذة = document.getElementById('نافذة-مشروع');
  if (نافذة) نافذة.classList.add('مخفية');
}

// إغلاق النافذة بالنقر على الخلفية
document.addEventListener('click', (ح) => {
  const نافذة = document.getElementById('نافذة-مشروع');
  if (نافذة && ح.target === نافذة) {
    إغلاق_نافذة();
  }
});

// ====================================
// اختيار لون الخلفية
// ====================================
function اختيار_لون(زر) {
  document.querySelectorAll('.خيار-لون').forEach(ز => ز.classList.remove('محدد'));
  زر.classList.add('محدد');
  إعدادات_المشروع.لون_خلفية = زر.getAttribute('data-لون');
  إعدادات_المشروع.اسم_لون = زر.getAttribute('data-اسم');
}

// ====================================
// اختيار قياس المشروع
// ====================================
function اختيار_قياس(زر) {
  document.querySelectorAll('.خيار-قياس').forEach(ز => ز.classList.remove('محدد'));
  زر.classList.add('محدد');
  إعدادات_المشروع.قياس_عرض = parseInt(زر.getAttribute('data-عرض'));
  إعدادات_المشروع.قياس_ارتفاع = parseInt(زر.getAttribute('data-ارتفاع'));
  إعدادات_المشروع.اسم_قياس = زر.getAttribute('data-اسم');
}

// ====================================
// بدء المشروع والانتقال للاستوديو
// ====================================
function بدء_مشروع() {
  const حقل_اسم = document.getElementById('حقل-اسم-مشروع');

  if (!حقل_اسم || !حقل_اسم.value.trim()) {
    تأثير_خطأ_حقل(حقل_اسم);
    return;
  }

  if (!إعدادات_المشروع.لون_خلفية) {
    // اختيار افتراضي
    إعدادات_المشروع.لون_خلفية = '#1a1a2e';
  }

  إعدادات_المشروع.اسم_مشروع = حقل_اسم.value.trim();

  // حفظ في sessionStorage
  sessionStorage.setItem('إعدادات_صفوان', JSON.stringify(إعدادات_المشروع));

  // تأثير الانتقال
  const زر = document.querySelector('.زر-بدء-مشروع');
  if (زر) {
    زر.textContent = '...جاري التحضير';
    زر.style.opacity = '0.7';
    زر.style.cursor = 'not-allowed';
  }

  setTimeout(() => {
    window.location.href = 'studio.html';
  }, 800);
}

function تأثير_خطأ_حقل(حقل) {
  if (!حقل) return;
  حقل.style.borderColor = 'var(--لون-خطأ)';
  حقل.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.2)';
  حقل.classList.add('هزة');

  حقل.addEventListener('input', () => {
    حقل.style.borderColor = '';
    حقل.style.boxShadow = '';
  }, { once: true });

  // هزة CSS
  حقل.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-6px)' },
    { transform: 'translateX(6px)' },
    { transform: 'translateX(-4px)' },
    { transform: 'translateX(4px)' },
    { transform: 'translateX(0)' }
  ], { duration: 400, easing: 'ease-out' });
}

// ====================================
// زر العرض التوضيحي
// ====================================
function عرض_توضيحي() {
  // فتح الاستوديو بمشروع تجريبي
  const إعدادات_تجريبية = {
    لون_خلفية: '#1a1a2e',
    قياس_عرض: 1080,
    قياس_ارتفاع: 1920,
    اسم_قياس: 'TikTok عمودي',
    اسم_مشروع: 'مشروع التجربة'
  };
  sessionStorage.setItem('إعدادات_صفوان', JSON.stringify(إعدادات_تجريبية));
  window.location.href = 'studio.html';
}

// ====================================
// تأثيرات الزر الرئيسي
// ====================================
function إضافة_تأثير_زر() {
  const زر = document.querySelector('.زر-ابدا-الآن');
  if (!زر) return;

  زر.addEventListener('mouseenter', () => {
    const تأثير = زر.querySelector('.زر-تأثير-ضوء');
    if (تأثير) {
      تأثير.style.animation = 'none';
      void تأثير.offsetWidth;
      تأثير.style.animation = 'بريق-زر 0.6s ease';
    }
  });
}

// ====================================
// اختصارات لوحة المفاتيح
// ====================================
document.addEventListener('keydown', (ح) => {
  if (ح.key === 'Escape') {
    إغلاق_نافذة();
  }
  if (ح.key === 'Enter') {
    const نافذة = document.getElementById('نافذة-مشروع');
    if (نافذة && !نافذة.classList.contains('مخفية')) {
      بدء_مشروع();
    }
  }
});

// ====================================
// تأثيرات hover للشعار
// ====================================
const الشعار = document.getElementById('شعار-رئيسي');
if (الشعار) {
  document.querySelector('.حاوية-شعار-رئيسي')?.addEventListener('mouseenter', () => {
    الشعار.style.filter = 'drop-shadow(0 0 50px rgba(255,107,53,0.8))';
    الشعار.style.transition = 'filter 0.3s ease';
  });

  document.querySelector('.حاوية-شعار-رئيسي')?.addEventListener('mouseleave', () => {
    الشعار.style.filter = 'drop-shadow(0 0 30px rgba(255,107,53,0.5))';
  });
}

// ====================================
// تأثيرات متابعة الماوس للجسيمات
// ====================================
document.addEventListener('mousemove', (ح) => {
  const { clientX, clientY } = ح;
  const عرض_نصف = window.innerWidth / 2;
  const ارتفاع_نصف = window.innerHeight / 2;

  const x_إزاحة = (clientX - عرض_نصف) / عرض_نصف;
  const y_إزاحة = (clientY - ارتفاع_نصف) / ارتفاع_نصف;

  // تأثير parallax على الشعار
  const حاوية_شعار = document.querySelector('.حاوية-شعار-رئيسي');
  if (حاوية_شعار) {
    حاوية_شعار.style.transform = `translate(${x_إزاحة * -8}px, ${y_إزاحة * -8}px)`;
    حاوية_شعار.style.transition = 'transform 0.3s ease';
  }

  // تأثير جذب الجسيمات نحو الماوس
  if (حالة_الرئيسية.جسيمات) {
    حالة_الرئيسية.جسيمات.forEach(ج => {
      const مسافة = Math.hypot(clientX - ج.x, clientY - ج.y);
      if (مسافة < 150) {
        const زاوية = Math.atan2(ج.y - clientY, ج.x - clientX);
        const قوة = (150 - مسافة) / 150 * 0.5;
        ج.سرعة_x += Math.cos(زاوية) * قوة;
        ج.سرعة_y += Math.sin(زاوية) * قوة;
        // تحديد سرعة قصوى
        const سرعة = Math.hypot(ج.سرعة_x, ج.سرعة_y);
        if (سرعة > 3) {
          ج.سرعة_x = (ج.سرعة_x / سرعة) * 3;
          ج.سرعة_y = (ج.سرعة_y / سرعة) * 3;
        }
      }
    });
  }
});

// تهيئة البطاقة الأولى من المحدد
document.querySelector('.خيار-قياس')?.classList.add('محدد');
