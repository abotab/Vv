// البيانات المخزنة محلياً
let currentUser = null;
let users = JSON.parse(localStorage.getItem('trading_users')) || [];
let premiumCodes = JSON.parse(localStorage.getItem('premium_codes')) || [];
let supportMessages = JSON.parse(localStorage.getItem('support_messages')) || [];
let currentCourse = null;
let currentVideos = [];
let currentVideoIndex = 0;

// بيانات الدورات
const coursesData = {
    haider: {
        title: "كورس التداول من صفر الى الاحتراف",
        author: "حيدر الجنابي",
        videos: [
            { id: "G8eeqb82KOM", title: "دورة سمارت موني كونسبت الحلقة الأولى للمبتدئين" },
            { id: "vUeyLqB82CM", title: "الدرس الثاني من كورس الأموال الذكية" },
            { id: "CrzVLmflQgQ", title: "الدرس الثالث ترابط الفريمات من كورس الأموال الذكية" }
        ],
        info: `
            <div class="info-section">
                <p><strong>المدرب:</strong> حيدر الجنابي</p>
                <p><strong>عدد الفيديوهات:</strong> 3</p>
            </div>
            <div class="rights-section">
                <p><strong>حقوق الدورة:</strong></p>
                <p><a href="https://t.me/thesuccessfulwayarabs" target="_blank">قناة تلجرام: thesuccessfulwayarabs</a></p>
                <p><a href="https://t.me/haideraljanabi90" target="_blank">حساب تلجرام: haideraljanabi90</a></p>
            </div>
        `
    },
    mohamed: {
        title: "أفضل دورة لتعلم SMC في الوطن العربي",
        author: "الدكتور محمد مهدي",
        videos: [
            { id: "eb2y-Kbd_N8", title: "مقدمة هامة لدورة SMC Exaado" },
            { id: "XSPuivsDNd4", title: "لماذا المستوى الأول مجاني؟" },
            { id: "cWx_GkB2htE", title: "هل علم SMC أفضل علم لتحقيق الأرباح بالفوركس؟" },
            { id: "pQsk2N8j08I", title: "تأسيس SMC - درس 1 - الشموع اليابانية" },
            { id: "C1qDxNJJbbI", title: "تأسيس SMC - الدرس 2 - هيكلية الشموع" },
            { id: "fH0vP9NNuug", title: "تأسيس SMC - الدرس 3 - الغلبة لمن؟" },
            { id: "QmhYCHTkGPU", title: "تأسيس SMC - الدرس 4 - قمم وقيعان الهيكل" },
            { id: "h9JXmwltHvw", title: "تأسيس SMC - درس 5 - كيف تتكون اتجاهات السوق؟" },
            { id: "R08Q9wj0vHw", title: "تأسيس SMC - درس 6 - تطبيق عملي على اتجاهات السوق" },
            { id: "vkEgojBoLO4", title: "تأسيس SMC - الدرس 7 - الاتجاهات الرئيسية والداخلية" },
            { id: "ITKrEnK152M", title: "تأسيس SMC - الدرس 8 - تطبيق عملي على الاتجاه الرئيسي والداخلي" },
            { id: "ICJbnDo20mI", title: "الحافز Level 2 - Inducment IDM" },
            { id: "sKfoeLGsQUY", title: "شروط Level 2 - Inducment IDM" },
            { id: "U1Alwc74Ap0", title: "تطبيق عملي لاستخراج Level 2 - IDM" },
            { id: "IdkFy19mPag", title: "تطبيق عملي على كل ما سبق - Level 2" }
        ],
        info: `
            <div class="info-section">
                <p><strong>المدرب:</strong> الدكتور محمد مهدي</p>
                <p><strong>عدد الفيديوهات:</strong> 15</p>
            </div>
            <div class="rights-section">
                <p><strong>حقوق الدورة:</strong></p>
                <p><a href="https://t.me/Exaado" target="_blank">قناة تلجرام: Exaado</a></p>
                <p><a href="https://t.me/ExaadoSupport" target="_blank">حساب الدعم: ExaadoSupport</a></p>
            </div>
        `
    },
    tradaying: {
        title: "الكورس السداسي في احتراف التحليل الفني",
        author: "حيدر تريدنك",
        videos: [
            { id: "pNLb-3Nrjv0", title: "مقدمة الكورس السداسي احتراف التحليل الفني" },
            { id: "QEMB6XnoAPU", title: "شرح الشمعة اليابانية بالتفصيل" },
            { id: "SC9IA6y0mLo", title: "شرح القمم والقيعان وأهميتها في التحليل الفني" },
            { id: "SL0sab2OsPQ", title: "علم تحديد الاتجاه في الأسواق المالية" },
            { id: "vdhBbWv7P8Q", title: "علم تحديد الاتجاه (الترند الفرعي) في الأسواق" },
            { id: "qMSe7tjnkE0", title: "علم تحديد الاتجاه في الأسواق المالية (المتوسط المتحرك 200)" },
            { id: "4CNWWp2toNI", title: "الدعم الثابت ماهو وكيف نحدده بشكل دقيق" },
            { id: "FMQG-iud_3k", title: "المقاومة الثابتة ماهي وكيف نحددها بشكل دقيق" },
            { id: "jEOCbIDFagE", title: "عملية الاستبدال (بين دعم ومقاومة) في الأسواق" },
            { id: "hsWQxsmF7Z4", title: "الدعم والمقاومات الديناميكية (المتحركة)" },
            { id: "r0dtL2Eey34", title: "الدعوم والمقاومات الديناميكية (المتحركة)" },
            { id: "S-PceOrWCVc", title: "الدعم والمقاومات على طريقة أعظم محللين العالم (شبه الديناميكية)" },
            { id: "X7aBNS3fj3E", title: "تحديد الدعوم والمقاومات على طريقة أعظم محللين التاريخ (القنوات السعرية)" },
            { id: "gsMhtEVN8us", title: "تحديد الدعوم والمقاومات على طريقة أعظم محللين التاريخ (القنوات السعرية)" },
            { id: "ECC5erFed88", title: "قراءة الحالة النفسية في السوق عن طريق الشموع اليابانية (أنماط الشموع اليابانية)" },
            { id: "dh4OZDqZohA", title: "أساسيات البرايس اكشن (قراءة الحالة النفسية) في السوق" },
            { id: "wfidL8peRxA", title: "التصحيح والكسر والاختراق وإعادة الاختبار في التحليل الفني" },
            { id: "evnMF07iHfA", title: "تتبع البنوك والحيتان في الأسواق المالية (معلومات بآلاف الدولارات)" },
            { id: "qfsu98cAwaM", title: "تأكيد الاختراق الحقيقي وتجنب الاختراق الوهمي بالتحليل الفني عن طريق الفوليوم" },
            { id: "dhpeq_sfy_k", title: "تأكيد الكسر الحقيقي وتجنب الكسر الوهمي بالتحليل الفني عن طريق الفوليوم" },
            { id: "6dH93cY8G7Y", title: "البرايس اكشن النوع الأول.. تعلم بطريقة جديدة" },
            { id: "C_4NsWODb7c", title: "البرايس اكشن المتحرك النوع الثاني.. تعلم بطريقة جديدة" },
            { id: "Iv-oyMEzR74", title: "الفيبوناتشي والبرايس اكشن النوع الثالث.. تعلم بطريقة جديدة" },
            { id: "IsW3t13FfTE", title: "مؤشر EMA و Stochastic أهم مؤشرين في وضع أي استراتيجية" }
        ],
        info: `
            <div class="info-section">
                <p><strong>المدرب:</strong> حيدر تريدنك</p>
                <p><strong>عدد الفيديوهات:</strong> 24</p>
            </div>
            <div class="rights-section">
                <p><strong>حقوق الدورة:</strong></p>
                <p><a href="https://t.me/tradaying" target="_blank">قناة تلجرام: tradaying</a></p>
            </div>
        `
    },
    ict: {
        title: "كورس ICT من الصفر للمبتدئين",
        author: "محمد سماره",
        videos: [
            { id: "B_Cniskclho", title: "بعد 4 سنين تداول.... كورس ICT من الصفر للمبتدئين - الدرس الأول" },
            { id: "P02iX2KGYpc", title: "لا تصدق أن السوق يتحرك عشوائياً.... تعرف على BSL و SSL واكتشف الحقيقة - الدرس 2" },
            { id: "sRBlms-TcMM", title: "كيف يصنع السوق مناطق سيولة كاذبة لخداعك؟ افهم ERL و IRL بوضوح - الدرس 3" },
            { id: "p-tI_Opbstk", title: "هل تغير هيكل السوق يعني فرصة ربح؟ تعرف على MSS و BMS بوضوح - الدرس 4" },
            { id: "Hd4ogoQabuA", title: "كيف تستخدم فيبوناتشي و OTE لتحديد أفضل نقاط الدخول والخروج - الدرس 5" },
            { id: "j-z1_kvtS4M", title: "شرح مختلف يخليك تفهم السوق من جذوره - الدرس FVG 6" },
            { id: "L897X5SrnaE", title: "كيف تكتشف الفجوات غير المتوازنة وتتفوق على IFVG السوق - الدرس 7" },
            { id: "VFsQ9mNebNk", title: "سر اختيار أفضل نقاط الانعكاس في السوق - BPR FVG الدرس 8" },
            { id: "rWx1zIaPhAw", title: "أداة سرية يستخدمها الحيتان لدخول السوق! شرح اختلال الحجم بأسلوب ICT - الدرس 9" },
            { id: "Uws5QjN2Dr4", title: "كيف تكتشف الكسر الحقيقي في السوق؟ شرح BSG خطوة بخطوة بأسلوب ICT - الدرس 10" },
            { id: "ME6rPGFoWbU", title: "شرح جميع أنواع FVG في استراتيجية ICT - دليل شامل للمبتدئين خطوة بخطوة - الدرس 11" },
            { id: "2hGENxNVCDc", title: "عرفت OB؟ بس هل عرفت +OB و -OB؟ الفروقات المهمة التي تغير قراراتك - الدرس 12" },
            { id: "x0OgWDaPhtc", title: "ما حد علمك الـ BB بهذه الطريقة.... الفرصة بيدك! - الدرس 13" },
            { id: "GCaYsTLRs04", title: "اكتشف سر الـ Rejection Block قبل ما يتحرك السوق - الدرس 14" },
            { id: "kD8Xs6qzgYc", title: "ختام كورس أساس ICT - اكتشف قوة SETAB + A - الدرس 15" }
        ],
        info: `
            <div class="info-section">
                <p><strong>المدرب:</strong> محمد سماره</p>
                <p><strong>عدد الفيديوهات:</strong> 15</p>
            </div>
            <div class="rights-section">
                <p><strong>حقوق الدورة:</strong></p>
                <p><a href="https://t.me/mos_rar" target="_blank">قناة تلجرام: mos_rar</a></p>
                <p><a href="https://t.me/rar42rar" target="_blank">حساب تلجرام: rar42rar</a></p>
            </div>
        `
    }
};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    checkUserSession();
    setupEventListeners();
    updateSupportBadge();
});

// تهيئة التطبيق
function initApp() {
    // تحميل المستخدم الحالي من الجلسة
    const sessionUser = sessionStorage.getItem('current_user');
    if (sessionUser) {
        currentUser = JSON.parse(sessionUser);
        updateUIForLoggedInUser();
    }
    
    // تحميل الرسائل
    loadSupportMessages();
    
    // إعداد أيقونة الدعم العائمة
    setupFloatingSupport();
    
    // إعداد الشريط السفلي
    setupBottomNav();
    
    // إعداد زر الرجوع
    setupBackButton();
}

// التحقق من جلسة المستخدم
function checkUserSession() {
    if (!currentUser) {
        // إظهار زر إنشاء حساب فقط
        document.getElementById('authFab').style.display = 'block';
    }
}

// إعداد المستمعين للأحداث
function setupEventListeners() {
    // القائمة الجانبية
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
    document.getElementById('closeMenu').addEventListener('click', toggleSidebar);
    
    // زر الرجوع
    document.getElementById('backBtn').addEventListener('click', goBack);
    
    // الشريط السفلي
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });
    
    // زر تسجيل الخروج
    document.getElementById('logoutBtn').addEventListener('click', confirmLogout);
    document.getElementById('confirmLogoutBtn').addEventListener('click', logout);
    document.getElementById('cancelLogoutBtn').addEventListener('click', function() {
        hideModal('logoutConfirmModal');
    });
    
    // تعديل البيانات
    document.getElementById('editProfileBtn').addEventListener('click', showEditForm);
    document.getElementById('cancelEditBtn').addEventListener('click', hideEditForm);
    document.getElementById('saveEditBtn').addEventListener('click', saveProfileChanges);
    document.getElementById('changeImgBtn').addEventListener('click', showImageModal);
    
    // الروابط السريعة
    document.getElementById('goToCoursesBtn').addEventListener('click', function() {
        if (!currentUser) {
            showError('يرجى إنشاء حساب أولاً', 'يجب عليك إنشاء حساب للوصول إلى الدورات التعليمية');
            showAuthModal();
            return;
        }
        navigateToPage('courses');
    });
    
    document.getElementById('goToToolsBtn').addEventListener('click', function() {
        if (!currentUser) {
            showError('يرجى إنشاء حساب أولاً', 'يجب عليك إنشاء حساب لاستخدام أدوات التداول');
            showAuthModal();
            return;
        }
        navigateToPage('tools');
    });
    
    // الدورات
    document.querySelectorAll('.view-course-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!currentUser) {
                showError('يرجى إنشاء حساب أولاً', 'يجب عليك إنشاء حساب لمشاهدة الدورات');
                showAuthModal();
                return;
            }
            const course = this.getAttribute('data-course');
            openCourse(course);
        });
    });
    
    document.querySelectorAll('.course-info-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const course = this.getAttribute('data-course');
            showCourseInfo(course);
        });
    });
    
    // مشغل الفيديو
    document.getElementById('closeVideoBtn').addEventListener('click', function() {
        hideModal('videoModal');
    });
    
    document.getElementById('prevVideoBtn').addEventListener('click', playPreviousVideo);
    document.getElementById('nextVideoBtn').addEventListener('click', playNextVideo);
    
    // معلومات الدورة
    document.getElementById('closeInfoBtn').addEventListener('click', function() {
        hideModal('infoModal');
    });
    
    // المتقدمين
    document.getElementById('viewPremiumCourseBtn').addEventListener('click', function() {
        if (!currentUser) {
            showError('يرجى إنشاء حساب أولاً', 'يجب عليك إنشاء حساب للوصول لدورات المتقدمين');
            showAuthModal();
            return;
        }
        
        if (currentUser && currentUser.premium) {
            openCourse('ict');
        } else {
            showActivationSection();
        }
    });
    
    document.getElementById('activatePremiumBtn').addEventListener('click', activatePremium);
    
    // الأدوات
    document.getElementById('fibonacciCalculatorBtn').addEventListener('click', function() {
        if (!currentUser) {
            showError('يرجى إنشاء حساب أولاً', 'يجب عليك إنشاء حساب لاستخدام أدوات التداول');
            showAuthModal();
            return;
        }
        showToolModal('fibonacciModal');
    });
    
    document.getElementById('riskManagerBtn').addEventListener('click', function() {
        if (!currentUser) {
            showError('يرجى إنشاء حساب أولاً', 'يجب عليك إنشاء حساب لاستخدام أدوات التداول');
            showAuthModal();
            return;
        }
        showToolModal('riskModal');
    });
    
    document.getElementById('calculateFibBtn').addEventListener('click', calculateFibonacci);
    document.getElementById('calculateRiskBtn').addEventListener('click', calculateRiskManagement);
    
    document.querySelectorAll('.close-tool').forEach(btn => {
        btn.addEventListener('click', function() {
            const tool = this.getAttribute('data-tool');
            hideToolModal(tool);
        });
    });
    
    // الدعم الفني
    document.getElementById('sendMessageBtn').addEventListener('click', sendSupportMessage);
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendSupportMessage();
        }
    });
    
    // المصادقة
    document.getElementById('loginFabBtn').addEventListener('click', showAuthModal);
    document.getElementById('closeAuthBtn').addEventListener('click', function() {
        hideModal('authModal');
    });
    
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabType = this.getAttribute('data-tab');
            switchAuthTab(tabType);
        });
    });
    
    document.getElementById('registerBtn').addEventListener('click', registerUser);
    document.getElementById('loginBtn').addEventListener('click', loginUser);
    
    // اختيار الصورة
    document.getElementById('cameraOption').addEventListener('click', function() {
        showError('غير متاح حالياً', 'ميزة الكاميرا غير متاحة حالياً. يرجى استخدام المعرض أو رابط الصورة.');
    });
    
    document.getElementById('galleryOption').addEventListener('click', function() {
        showError('غير متاح حالياً', 'ميزة المعرض غير متاحة حالياً. يرجى استخدام رابط الصورة.');
    });
    
    document.getElementById('urlOption').addEventListener('click', function() {
        document.getElementById('imageUrlInput').style.display = 'block';
    });
    
    document.getElementById('saveImageUrlBtn').addEventListener('click', function() {
        const imageUrl = document.getElementById('imageUrl').value.trim();
        if (imageUrl) {
            changeProfileImageFromUrl(imageUrl);
        } else {
            showError('رابط فارغ', 'يرجى إدخال رابط صورة صالح');
        }
    });
    
    document.getElementById('closeImageBtn').addEventListener('click', function() {
        hideModal('imageModal');
    });
    
    // زر إغلاق الخطأ
    document.getElementById('closeErrorBtn').addEventListener('click', function() {
        hideModal('errorModal');
    });
    
    // صفحات سياسة الخصوصية ومن نحن
    document.querySelector('.sidebar-item[href="#privacy"]').addEventListener('click', function(e) {
        e.preventDefault();
        navigateToPage('privacy');
        document.querySelector('.sidebar').classList.remove('open');
    });
    
    document.querySelector('.sidebar-item[href="#about"]').addEventListener('click', function(e) {
        e.preventDefault();
        navigateToPage('about');
        document.querySelector('.sidebar').classList.remove('open');
    });
    
    document.querySelector('.close-policy-btn').addEventListener('click', function() {
        navigateToPage('home');
    });
    
    document.querySelector('.close-about-btn').addEventListener('click', function() {
        navigateToPage('home');
    });
    
    // استماع لتغييرات الصفحة في الرابط
    window.addEventListener('hashchange', handleHashChange);
}

// إظهار رسالة خطأ
function showError(title, message) {
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').style.display = 'flex';
}

// التعامل مع تغيير الرابط
function handleHashChange() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        navigateToPage(hash);
    }
}

// التنقل بين الصفحات
function navigateToPage(page) {
    // تحديث الرابط
    window.location.hash = page;
    
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // إظهار الصفحة المطلوبة
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.classList.add('active');
    } else {
        document.getElementById('homePage').classList.add('active');
    }
    
    // تحديث العنوان
    const titles = {
        account: 'الحساب',
        home: 'الرئيسية',
        courses: 'الدورات',
        premium: 'المتقدمين',
        tools: 'الأدوات',
        support: 'الدعم الفني',
        privacy: 'سياسة الخصوصية',
        about: 'من نحن'
    };
    
    document.getElementById('pageTitle').textContent = titles[page] || 'اكزم لتداول';
    
    // إظهار زر الرجوع إذا لم تكن في الصفحة الرئيسية
    if (page !== 'home') {
        document.getElementById('backBtn').style.display = 'flex';
    } else {
        document.getElementById('backBtn').style.display = 'none';
    }
    
    // تحديث الشريط السفلي
    updateBottomNav(page);
    
    // إغلاق القائمة الجانبية
    document.querySelector('.sidebar').classList.remove('open');
}

// تحديث الشريط السفلي
function updateBottomNav(activePage) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === activePage) {
            item.classList.add('active');
        }
    });
}

// إعداد زر الرجوع
function setupBackButton() {
    document.getElementById('backBtn').addEventListener('click', function() {
        if (window.location.hash === '#home' || !window.location.hash) {
            navigateToPage('home');
        } else {
            window.history.back();
        }
    });
}

// إعداد الشريط السفلي
function setupBottomNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });
}

// تبديل القائمة الجانبية
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// تحديث واجهة المستخدم للمستخدم المسجل
function updateUIForLoggedInUser() {
    if (currentUser) {
        // تحديث معلومات الحساب
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userUsername').textContent = '@' + currentUser.username;
        
        // تحديث حالة الحساب
        const statusBadge = document.getElementById('accountStatus');
        if (currentUser.premium) {
            statusBadge.textContent = 'حساب مميز';
            statusBadge.classList.add('premium');
        } else {
            statusBadge.textContent = 'حساب عادي';
            statusBadge.classList.remove('premium');
        }
        
        // تحديث الصورة
        if (currentUser.profileImage) {
            document.getElementById('profileImg').src = currentUser.profileImage;
        }
        
        // إخفاء زر المصادقة
        document.getElementById('authFab').style.display = 'none';
        
        // إظهار زر تسجيل الخروج
        document.getElementById('logoutBtn').style.display = 'flex';
    }
}

// إظهار نموذج المصادقة
function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('authTitle').textContent = 'إنشاء حساب جديد';
    switchAuthTab('register');
}

// إخفاء النافذة
function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// تبديل تبويبات المصادقة
function switchAuthTab(tab) {
    // تحديث الأزرار
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    
    // تحديث النماذج
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    document.getElementById(tab + 'Form').classList.add('active');
    
    // تحديث العنوان
    document.getElementById('authTitle').textContent = 
        tab === 'register' ? 'إنشاء حساب جديد' : 'تسجيل الدخول';
}

// تسجيل مستخدم جديد
function registerUser() {
    const name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    
    // التحقق من الحقول المطلوبة
    if (!name || !username || !email || !password) {
        showError('حقول مطلوبة', 'يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    // التحقق من اسم المستخدم
    if (!/^[a-zA-Z]/.test(username)) {
        showError('خطأ في اسم المستخدم', 'اسم المستخدم يجب أن يبدأ بحرف إنجليزي');
        return;
    }
    
    if (username.length < 4) {
        showError('خطأ في اسم المستخدم', 'اسم المستخدم يجب أن يكون 4 أحرف على الأقل');
        return;
    }
    
    // التحقق من البريد الإلكتروني
    if (!isValidEmail(email)) {
        showError('خطأ في البريد الإلكتروني', 'يرجى إدخال بريد إلكتروني صحيح');
        return;
    }
    
    // التحقق من عدم وجود نفس البريد الإلكتروني
    if (users.some(user => user.email === email)) {
        showError('بريد إلكتروني موجود', 'هذا البريد الإلكتروني مسجل مسبقاً');
        return;
    }
    
    // التحقق من عدم وجود نفس اسم المستخدم
    if (users.some(user => user.username === username)) {
        showError('اسم مستخدم موجود', 'اسم المستخدم هذا مستخدم مسبقاً');
        return;
    }
    
    // إنشاء المستخدم الجديد
    const newUser = {
        id: Date.now().toString(),
        name: name,
        username: username,
        email: email,
        password: password,
        profileImage: 'https://j.top4top.io/p_3670reejg0.png',
        premium: false,
        premiumExpiry: null,
        createdAt: new Date().toISOString()
    };
    
    // إضافة المستخدم للقائمة
    users.push(newUser);
    localStorage.setItem('trading_users', JSON.stringify(users));
    
    // تسجيل الدخول تلقائياً
    currentUser = newUser;
    sessionStorage.setItem('current_user', JSON.stringify(currentUser));
    
    // تحديث الواجهة
    updateUIForLoggedInUser();
    
    // إغلاق النافذة
    hideModal('authModal');
    
    // إظهار رسالة ترحيب
    showError('تم بنجاح', `مرحباً ${name}! تم إنشاء حسابك بنجاح.`);
    
    // التوجه للصفحة الرئيسية
    navigateToPage('home');
}

// تسجيل الدخول
function loginUser() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    
    // البحث عن المستخدم
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // تسجيل الدخول
        currentUser = user;
        sessionStorage.setItem('current_user', JSON.stringify(currentUser));
        
        // تحديث الواجهة
        updateUIForLoggedInUser();
        
        // إغلاق النافذة
        hideModal('authModal');
        
        // التوجه للصفحة الرئيسية
        navigateToPage('home');
    } else {
        showError('خطأ في تسجيل الدخول', 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
}

// التحقق من صحة البريد الإلكتروني
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// تأكيد تسجيل الخروج
function confirmLogout() {
    document.getElementById('logoutConfirmModal').style.display = 'flex';
}

// تسجيل الخروج
function logout() {
    // حذف جلسة المستخدم
    sessionStorage.removeItem('current_user');
    currentUser = null;
    
    // إعادة تعيين الواجهة
    document.getElementById('userName').textContent = 'مستخدم جديد';
    document.getElementById('userUsername').textContent = '@username';
    document.getElementById('accountStatus').textContent = 'حساب عادي';
    document.getElementById('accountStatus').classList.remove('premium');
    document.getElementById('profileImg').src = 'https://j.top4top.io/p_3670reejg0.png';
    
    // إظهار زر المصادقة
    document.getElementById('authFab').style.display = 'block';
    
    // إخفاء نموذج تعديل البيانات إذا كان ظاهراً
    hideEditForm();
    
    // إخفاء نافذة التأكيد
    hideModal('logoutConfirmModal');
    
    // التوجه للصفحة الرئيسية
    navigateToPage('home');
}

// إظهار نموذج تعديل البيانات
function showEditForm() {
    if (!currentUser) {
        showError('غير مسجل', 'يرجى تسجيل الدخول أولاً');
        return;
    }
    
    // تعبئة الحقول بالمعلومات الحالية
    document.getElementById('editName').value = currentUser.name;
    document.getElementById('editUsername').value = currentUser.username;
    document.getElementById('editPassword').value = '';
    
    // إظهار النموذج
    document.getElementById('editForm').style.display = 'block';
}

// إخفاء نموذج تعديل البيانات
function hideEditForm() {
    document.getElementById('editForm').style.display = 'none';
    document.getElementById('usernameError').textContent = '';
}

// حفظ التغييرات
function saveProfileChanges() {
    if (!currentUser) return;
    
    const name = document.getElementById('editName').value.trim();
    const username = document.getElementById('editUsername').value.trim();
    const password = document.getElementById('editPassword').value;
    
    // التحقق من الاسم
    if (!name) {
        showError('اسم مطلوب', 'يرجى إدخال الاسم');
        return;
    }
    
    // التحقق من اسم المستخدم
    if (!/^[a-zA-Z]/.test(username)) {
        document.getElementById('usernameError').textContent = 'يجب أن يبدأ اسم المستخدم بحرف إنجليزي';
        return;
    }
    
    if (username.length < 4) {
        document.getElementById('usernameError').textContent = 'يجب أن يكون اسم المستخدم 4 أحرف على الأقل';
        return;
    }
    
    // التحقق من عدم استخدام اسم المستخدم من قبل مستخدم آخر
    if (username !== currentUser.username && users.some(u => u.username === username && u.id !== currentUser.id)) {
        document.getElementById('usernameError').textContent = 'اسم المستخدم هذا مستخدم مسبقاً';
        return;
    }
    
    // تحديث بيانات المستخدم
    currentUser.name = name;
    currentUser.username = username;
    
    if (password) {
        currentUser.password = password;
    }
    
    // تحديث القائمة
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('trading_users', JSON.stringify(users));
    }
    
    // تحديث الجلسة
    sessionStorage.setItem('current_user', JSON.stringify(currentUser));
    
    // تحديث الواجهة
    updateUIForLoggedInUser();
    
    // إخفاء النموذج
    hideEditForm();
    
    showError('تم التحديث', 'تم تحديث بياناتك بنجاح');
}

// إظهار نافذة اختيار الصورة
function showImageModal() {
    if (!currentUser) {
        showError('غير مسجل', 'يرجى تسجيل الدخول أولاً');
        return;
    }
    
    document.getElementById('imageModal').style.display = 'flex';
    document.getElementById('imageUrlInput').style.display = 'none';
    document.getElementById('imageUrl').value = '';
}

// تغيير صورة الحساب من رابط
function changeProfileImageFromUrl(imageUrl) {
    if (!imageUrl.startsWith('http')) {
        showError('رابط غير صالح', 'يرجى إدخال رابط صورة صالح يبدأ بـ http أو https');
        return;
    }
    
    // اختبار تحميل الصورة
    const img = new Image();
    img.onload = function() {
        currentUser.profileImage = imageUrl;
        
        // تحديث القائمة
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('trading_users', JSON.stringify(users));
        }
        
        // تحديث الجلسة
        sessionStorage.setItem('current_user', JSON.stringify(currentUser));
        
        // تحديث الصورة في الواجهة
        document.getElementById('profileImg').src = imageUrl;
        
        // إغلاق النافذة
        hideModal('imageModal');
        
        showError('تم التحديث', 'تم تحديث صورة الحساب بنجاح');
    };
    
    img.onerror = function() {
        showError('رابط غير صالح', 'لا يمكن تحميل الصورة من هذا الرابط. يرجى التحقق من الرابط والمحاولة مرة أخرى.');
    };
    
    img.src = imageUrl;
}

// فتح دورة
function openCourse(courseKey) {
    if (courseKey === 'ict' && (!currentUser || !currentUser.premium)) {
        showActivationSection();
        return;
    }
    
    const course = coursesData[courseKey];
    if (!course) return;
    
    currentCourse = courseKey;
    currentVideos = course.videos;
    currentVideoIndex = 0;
    
    // تحديث عنوان الفيديو
    document.getElementById('videoTitle').textContent = course.title;
    
    // تشغيل الفيديو الأول
    playVideo(currentVideos[0].id, currentVideos[0].title);
    
    // تحديث قائمة الفيديوهات
    updateVideoList();
    
    // تحديث أرقام الفيديوهات
    document.getElementById('currentVideoNumber').textContent = currentVideoIndex + 1;
    document.getElementById('totalVideos').textContent = currentVideos.length;
    
    // إظهار مشغل الفيديو
    document.getElementById('videoModal').style.display = 'flex';
}

// تحديث قائمة الفيديوهات
function updateVideoList() {
    const videoList = document.getElementById('videoList');
    videoList.innerHTML = '';
    
    currentVideos.forEach((video, index) => {
        const videoItem = document.createElement('div');
        videoItem.className = `video-item ${index === currentVideoIndex ? 'active' : ''}`;
        videoItem.innerHTML = `
            <strong>${index + 1}.</strong> ${video.title}
        `;
        
        videoItem.addEventListener('click', function() {
            currentVideoIndex = index;
            playVideo(video.id, video.title);
            updateVideoList();
            document.getElementById('currentVideoNumber').textContent = currentVideoIndex + 1;
        });
        
        videoList.appendChild(videoItem);
    });
}

// تشغيل فيديو
function playVideo(videoId, title) {
    const videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&showinfo=0&rel=0&modestbranding=1`;
    
    document.getElementById('videoPlayer').src = videoUrl;
    document.getElementById('videoTitle').textContent = title;
    document.getElementById('currentVideoNumber').textContent = currentVideoIndex + 1;
}

// تشغيل الفيديو السابق
function playPreviousVideo() {
    if (currentVideoIndex > 0) {
        currentVideoIndex--;
        const video = currentVideos[currentVideoIndex];
        playVideo(video.id, video.title);
        updateVideoList();
        document.getElementById('currentVideoNumber').textContent = currentVideoIndex + 1;
    }
}

// تشغيل الفيديو التالي
function playNextVideo() {
    if (currentVideoIndex < currentVideos.length - 1) {
        currentVideoIndex++;
        const video = currentVideos[currentVideoIndex];
        playVideo(video.id, video.title);
        updateVideoList();
        document.getElementById('currentVideoNumber').textContent = currentVideoIndex + 1;
    }
}

// إظهار معلومات الدورة
function showCourseInfo(courseKey) {
    const course = coursesData[courseKey];
    if (!course) return;
    
    document.getElementById('infoTitle').textContent = `معلومات عن: ${course.title}`;
    document.getElementById('infoBody').innerHTML = course.info;
    
    document.getElementById('infoModal').style.display = 'flex';
}

// إظهار قسم التفعيل
function showActivationSection() {
    if (!currentUser) {
        showError('غير مسجل', 'يرجى إنشاء حساب أولاً للوصول لدورات المتقدمين');
        showAuthModal();
        return;
    }
    
    document.getElementById('activationSection').style.display = 'block';
    
    // التمرير للقسم
    document.getElementById('activationSection').scrollIntoView({ behavior: 'smooth' });
}

// تفعيل الاشتراك المميز
function activatePremium() {
    if (!currentUser) return;
    
    const code = document.getElementById('activationCode').value.trim();
    
    if (!code) {
        showError('كود مطلوب', 'يرجى إدخال كود التفعيل');
        return;
    }
    
    // البحث عن الكود
    const codeIndex = premiumCodes.findIndex(c => c.code === code && !c.used);
    
    if (codeIndex === -1) {
        showError('كود غير صالح', 'كود التفعيل غير صالح أو مستخدم مسبقاً');
        return;
    }
    
    // تفعيل الكود
    const premiumCode = premiumCodes[codeIndex];
    premiumCode.used = true;
    premiumCode.usedBy = currentUser.id;
    premiumCode.usedAt = new Date().toISOString();
    
    // تفعيل المستخدم
    currentUser.premium = true;
    currentUser.premiumExpiry = premiumCode.expiry;
    
    // تحديث القوائم
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
    }
    
    premiumCodes[codeIndex] = premiumCode;
    
    // حفظ التغييرات
    localStorage.setItem('trading_users', JSON.stringify(users));
    localStorage.setItem('premium_codes', JSON.stringify(premiumCodes));
    sessionStorage.setItem('current_user', JSON.stringify(currentUser));
    
    // تحديث الواجهة
    updateUIForLoggedInUser();
    
    // إخفاء قسم التفعيل
    document.getElementById('activationSection').style.display = 'none';
    
    // إظهار رسالة نجاح
    showError('تم التفعيل', 'مبروك! تم تفعيل الاشتراك المميز بنجاح.');
    
    // فتح الدورة مباشرة
    openCourse('ict');
}

// إظهار نافذة الأداة
function showToolModal(toolId) {
    document.getElementById(toolId).style.display = 'flex';
}

// إخفاء نافذة الأداة
function hideToolModal(toolId) {
    document.getElementById(toolId).style.display = 'none';
}

// حساب فيبوناتشي
function calculateFibonacci() {
    const direction = document.querySelector('input[name="fibDirection"]:checked').value;
    const low = parseFloat(document.getElementById('fibLow').value);
    const high = parseFloat(document.getElementById('fibHigh').value);
    
    if (!low || !high || low >= high) {
        showError('قيم غير صحيحة', 'يرجى إدخال قيم صحيحة (القاع يجب أن يكون أقل من القمة)');
        return;
    }
    
    const levels = {
        '0.0': direction === 'lowToHigh' ? low : high,
        '0.236': direction === 'lowToHigh' ? low + (high - low) * 0.236 : high - (high - low) * 0.236,
        '0.382': direction === 'lowToHigh' ? low + (high - low) * 0.382 : high - (high - low) * 0.382,
        '0.5': direction === 'lowToHigh' ? low + (high - low) * 0.5 : high - (high - low) * 0.5,
        '0.618': direction === 'lowToHigh' ? low + (high - low) * 0.618 : high - (high - low) * 0.618,
        '0.786': direction === 'lowToHigh' ? low + (high - low) * 0.786 : high - (high - low) * 0.786,
        '1.0': direction === 'lowToHigh' ? high : low,
        '1.272': direction === 'lowToHigh' ? high + (high - low) * 0.272 : low - (high - low) * 0.272,
        '1.618': direction === 'lowToHigh' ? high + (high - low) * 0.618 : low - (high - low) * 0.618
    };
    
    let resultsHTML = '<h4>مستويات فيبوناتشي:</h4>';
    resultsHTML += '<div class="results-grid">';
    
    for (const [level, value] of Object.entries(levels)) {
        resultsHTML += `
            <div class="result-item">
                <span class="result-label">مستوى ${level}:</span>
                <span class="result-value">${value.toFixed(4)}</span>
            </div>
        `;
    }
    
    resultsHTML += '</div>';
    
    document.getElementById('fibResults').innerHTML = resultsHTML;
}

// إدارة رأس المال
function calculateRiskManagement() {
    const capital = parseFloat(document.getElementById('riskCapital').value);
    const riskPercent = parseFloat(document.getElementById('riskPercentage').value);
    const entryPrice = parseFloat(document.getElementById('entryPrice').value);
    const stopLoss = parseFloat(document.getElementById('stopLoss').value);
    
    if (!capital || !riskPercent || !entryPrice || !stopLoss) {
        showError('حقول مطلوبة', 'يرجى ملء جميع الحقول');
        return;
    }
    
    if (riskPercent < 0.1 || riskPercent > 10) {
        showError('نسبة غير صحيحة', 'نسبة المخاطرة يجب أن تكون بين 0.1% و 10%');
        return;
    }
    
    // حساب مبلغ المخاطرة
    const riskAmount = capital * (riskPercent / 100);
    
    // حساب النقاط بين الدخول والوقف
    const points = Math.abs(entryPrice - stopLoss);
    
    if (points === 0) {
        showError('قيم متطابقة', 'سعر الدخول لا يمكن أن يساوي سعر وقف الخسارة');
        return;
    }
    
    // حساب حجم الصفقة (مبسط)
    const positionSize = (riskAmount / points).toFixed(2);
    
    let resultsHTML = '<h4>نتائج إدارة رأس المال:</h4>';
    resultsHTML += '<div class="results-grid">';
    resultsHTML += `<div class="result-item"><span class="result-label">رأس المال:</span><span class="result-value">$${capital.toFixed(2)}</span></div>`;
    resultsHTML += `<div class="result-item"><span class="result-label">نسبة المخاطرة:</span><span class="result-value">${riskPercent}%</span></div>`;
    resultsHTML += `<div class="result-item"><span class="result-label">مبلغ المخاطرة:</span><span class="result-value">$${riskAmount.toFixed(2)}</span></div>`;
    resultsHTML += `<div class="result-item"><span class="result-label">سعر الدخول:</span><span class="result-value">${entryPrice}</span></div>`;
    resultsHTML += `<div class="result-item"><span class="result-label">وقف الخسارة:</span><span class="result-value">${stopLoss}</span></div>`;
    resultsHTML += `<div class="result-item"><span class="result-label">النقاط بين الدخول والوقف:</span><span class="result-value">${points.toFixed(4)}</span></div>`;
    resultsHTML += `<div class="result-item" style="background: rgba(231, 76, 60, 0.1);"><span class="result-label">الحجم المقترح:</span><span class="result-value" style="color: #e74c3c;">${positionSize}</span></div>`;
    resultsHTML += '</div>';
    
    document.getElementById('riskResults').innerHTML = resultsHTML;
}

// إعداد أيقونة الدعم العائمة
function setupFloatingSupport() {
    const supportIcon = document.getElementById('floatingSupport');
    let isDragging = false;
    
    supportIcon.addEventListener('mousedown', startDrag);
    supportIcon.addEventListener('touchstart', startDragTouch);
    supportIcon.addEventListener('click', function(e) {
        if (!isDragging) {
            if (!currentUser) {
                showError('غير مسجل', 'يرجى إنشاء حساب للوصول للدعم الفني');
                showAuthModal();
                return;
            }
            navigateToPage('support');
        }
    });
    
    function startDrag(e) {
        isDragging = false;
        const rect = supportIcon.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        
        function drag(e) {
            isDragging = true;
            supportIcon.style.left = (e.clientX - offsetX) + 'px';
            supportIcon.style.top = (e.clientY - offsetY) + 'px';
        }
        
        function stopDrag() {
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
            setTimeout(() => {
                isDragging = false;
            }, 100);
        }
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    }
    
    function startDragTouch(e) {
        isDragging = false;
        const touch = e.touches[0];
        const rect = supportIcon.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        
        function dragTouch(e) {
            isDragging = true;
            const touch = e.touches[0];
            supportIcon.style.left = (touch.clientX - offsetX) + 'px';
            supportIcon.style.top = (touch.clientY - offsetY) + 'px';
        }
        
        function stopDrag() {
            document.removeEventListener('touchmove', dragTouch);
            document.removeEventListener('touchend', stopDrag);
            setTimeout(() => {
                isDragging = false;
            }, 100);
        }
        
        document.addEventListener('touchmove', dragTouch);
        document.addEventListener('touchend', stopDrag);
    }
}

// تحميل رسائل الدعم
function loadSupportMessages() {
    const messagesContainer = document.getElementById('supportMessages');
    messagesContainer.innerHTML = '';
    
    const userMessages = supportMessages.filter(msg => 
        msg.userId === (currentUser ? currentUser.id : 'anonymous')
    );
    
    if (userMessages.length === 0) {
        messagesContainer.innerHTML = `
            <div style="text-align: center; padding: 50px 20px; color: #95a5a6;">
                <p>لا توجد رسائل حالياً</p>
                <p>اكتب رسالتك وسيتم الرد عليك قريباً</p>
            </div>
        `;
        return;
    }
    
    userMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.type}`;
        messageDiv.innerHTML = `
            <p>${msg.text}</p>
            <div class="message-time">${formatTime(msg.timestamp)}</div>
        `;
        messagesContainer.appendChild(messageDiv);
    });
    
    // التمرير للأسفل
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// إرسال رسالة دعم
function sendSupportMessage() {
    if (!currentUser) {
        showError('غير مسجل', 'يرجى إنشاء حساب لإرسال رسائل الدعم');
        showAuthModal();
        return;
    }
    
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) {
        showError('رسالة فارغة', 'يرجى كتابة رسالة');
        return;
    }
    
    // إنشاء الرسالة
    const message = {
        id: Date.now().toString(),
        userId: currentUser.id,
        text: text,
        type: 'sent',
        timestamp: new Date().toISOString()
    };
    
    // إضافة الرسالة
    supportMessages.push(message);
    localStorage.setItem('support_messages', JSON.stringify(supportMessages));
    
    // تحديث الواجهة
    loadSupportMessages();
    
    // مسح حقل الإدخال
    input.value = '';
    
    // إضافة رد آلي (محاكاة)
    setTimeout(() => {
        const autoReply = {
            id: Date.now().toString() + 'auto',
            userId: currentUser.id,
            text: 'شكراً لتواصلكم. تم استلام رسالتك وسيتم الرد عليك في أقرب وقت ممكن.',
            type: 'received',
            timestamp: new Date().toISOString()
        };
        
        supportMessages.push(autoReply);
        localStorage.setItem('support_messages', JSON.stringify(supportMessages));
        loadSupportMessages();
        updateSupportBadge();
    }, 2000);
}

// تحديث شعار الإشعارات
function updateSupportBadge() {
    if (!currentUser) return;
    
    const unreadCount = supportMessages.filter(msg => 
        msg.userId === currentUser.id && 
        msg.type === 'received' &&
        !msg.read
    ).length;
    
    const badge = document.getElementById('notificationBadge');
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
}

// تنسيق الوقت
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}