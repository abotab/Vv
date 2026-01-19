// البيانات المخزنة محلياً
let currentUser = null;
let users = JSON.parse(localStorage.getItem('trading_users')) || [];
let premiumCodes = JSON.parse(localStorage.getItem('premium_codes')) || [];
let supportMessages = JSON.parse(localStorage.getItem('support_messages')) || [];
let currentCourse = null;
let currentVideos = [];
let currentVideoIndex = 0;

// بيانات الدورات (نفس البيانات السابقة)
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
                <div class="info-item">
                    <span class="info-label"><i class="fas fa-user-tie"></i> المدرب:</span>
                    <span class="info-value">حيدر الجنابي</span>
                </div>
                <div class="info-item">
                    <span class="info-label"><i class="fas fa-video"></i> عدد الفيديوهات:</span>
                    <span class="info-value">3</span>
                </div>
            </div>
            
            <div class="rights-section">
                <h5><i class="fas fa-copyright"></i> حقوق الدورة:</h5>
                <div class="rights-links">
                    <a href="https://t.me/thesuccessfulwayarabs" target="_blank" class="rights-link">
                        <i class="fab fa-telegram"></i>
                        <span>قناة تلجرام: thesuccessfulwayarabs</span>
                    </a>
                    <a href="https://t.me/haideraljanabi90" target="_blank" class="rights-link">
                        <i class="fab fa-telegram"></i>
                        <span>حساب تلجرام: haideraljanabi90</span>
                    </a>
                </div>
            </div>
            
            <div class="info-note">
                <p><i class="fas fa-info-circle"></i> هذه الدورة مجانية بالكامل ومتاحة لجميع المستخدمين.</p>
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
                <div class="info-item">
                    <span class="info-label"><i class="fas fa-user-tie"></i> المدرب:</span>
                    <span class="info-value">الدكتور محمد مهدي</span>
                </div>
                <div class="info-item">
                    <span class="info-label"><i class="fas fa-video"></i> عدد الفيديوهات:</span>
                    <span class="info-value">15</span>
                </div>
            </div>
            
            <div class="rights-section">
                <h5><i class="fas fa-copyright"></i> حقوق الدورة:</h5>
                <div class="rights-links">
                    <a href="https://t.me/Exaado" target="_blank" class="rights-link">
                        <i class="fab fa-telegram"></i>
                        <span>قناة تلجرام: Exaado</span>
                    </a>
                    <a href="https://t.me/ExaadoSupport" target="_blank" class="rights-link">
                        <i class="fab fa-telegram"></i>
                        <span>حساب الدعم: ExaadoSupport</span>
                    </a>
                </div>
            </div>
            
            <div class="info-note">
                <p><i class="fas fa-info-circle"></i> هذه الدورة مجانية بالكامل ومتاحة لجميع المستخدمين.</p>
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
                <div class="info-item">
                    <span class="info-label"><i class="fas fa-user-tie"></i> المدرب:</span>
                    <span class="info-value">حيدر تريدنك</span>
                </div>
                <div class="info-item">
                    <span class="info-label"><i class="fas fa-video"></i> عدد الفيديوهات:</span>
                    <span class="info-value">24</span>
                </div>
            </div>
            
            <div class="rights-section">
                <h5><i class="fas fa-copyright"></i> حقوق الدورة:</h5>
                <div class="rights-links">
                    <a href="https://t.me/tradaying" target="_blank" class="rights-link">
                        <i class="fab fa-telegram"></i>
                        <span>قناة تلجرام: tradaying</span>
                    </a>
                </div>
            </div>
            
            <div class="info-note">
                <p><i class="fas fa-info-circle"></i> هذه الدورة مجانية بالكامل ومتاحة لجميع المستخدمين.</p>
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
                <div class="info-item">
                    <span class="info-label"><i class="fas fa-user-tie"></i> المدرب:</span>
                    <span class="info-value">محمد سماره</span>
                </div>
                <div class="info-item">
                    <span class="info-label"><i class="fas fa-video"></i> عدد الفيديوهات:</span>
                    <span class="info-value">15</span>
                </div>
            </div>
            
            <div class="rights-section">
                <h5><i class="fas fa-copyright"></i> حقوق الدورة:</h5>
                <div class="rights-links">
                    <a href="https://t.me/mos_rar" target="_blank" class="rights-link">
                        <i class="fab fa-telegram"></i>
                        <span>قناة تلجرام: mos_rar</span>
                    </a>
                    <a href="https://t.me/rar42rar" target="_blank" class="rights-link">
                        <i class="fab fa-telegram"></i>
                        <span>حساب تلجرام: rar42rar</span>
                    </a>
                </div>
            </div>
            
            <div class="premium-note">
                <p><i class="fas fa-crown"></i> <strong>ملاحظة مهمة:</strong></p>
                <p>هذا الكورس مجاني 100% وتم وضعه في خانة البروميوم لتجربة ميزات البروميوم فقط.</p>
                <p>تم نشر أكواد مجانية حتى تستطيع استخدام البروميوم بشكل مفتوح.</p>
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
    setupPolicyAndAboutPages();
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
    
    // إضافة أنماط CSS إضافية لمعلومات الدورة
    addInfoModalStyles();
}

// إضافة أنماط CSS لمعلومات الدورة
function addInfoModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .info-section {
            background: rgba(30, 58, 138, 0.1);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 25px;
            border-right: 4px solid #3b82f6;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(59, 130, 246, 0.2);
        }
        
        .info-item:last-child {
            border-bottom: none;
        }
        
        .info-label {
            color: #94a3b8;
            font-weight: 600;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-value {
            color: var(--dark-text);
            font-weight: 700;
            font-size: 1.2rem;
            background: rgba(59, 130, 246, 0.1);
            padding: 8px 15px;
            border-radius: 8px;
        }
        
        .rights-section {
            background: rgba(30, 41, 59, 0.8);
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            border: 2px solid #1e293b;
        }
        
        .rights-section h5 {
            color: #3b82f6;
            font-size: 1.3rem;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        
        .rights-links {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .rights-link {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 18px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 10px;
            color: var(--dark-text);
            text-decoration: none;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .rights-link:hover {
            background: rgba(59, 130, 246, 0.2);
            border-color: #3b82f6;
            transform: translateX(-5px);
        }
        
        .rights-link i {
            color: #3b82f6;
            font-size: 1.5rem;
        }
        
        .rights-link span {
            font-weight: 600;
            font-size: 1.1rem;
        }
        
        .info-note {
            background: rgba(16, 185, 129, 0.1);
            padding: 20px;
            border-radius: 12px;
            margin-top: 20px;
            border-right: 4px solid #10b981;
        }
        
        .info-note p {
            color: #10b981;
            font-weight: 600;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 0;
            line-height: 1.5;
        }
        
        .premium-note {
            background: rgba(245, 158, 11, 0.1);
            padding: 25px;
            border-radius: 12px;
            margin-top: 20px;
            border: 2px solid #f59e0b;
        }
        
        .premium-note p {
            color: #f59e0b;
            font-weight: 600;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 15px;
            line-height: 1.6;
        }
        
        .premium-note p:last-child {
            margin-bottom: 0;
        }
    `;
    document.head.appendChild(style);
}

// إعداد صفحات سياسة الخصوصية ومن نحن
function setupPolicyAndAboutPages() {
    // الروابط من القائمة الجانبية
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
    
    // أزرار الإغلاق
    document.querySelector('.close-policy-btn').addEventListener('click', function() {
        navigateToPage('home');
    });
    
    document.querySelector('.close-about-btn').addEventListener('click', function() {
        navigateToPage('home');
    });
    
    // زر إغلاق معلومات الدورة
    document.getElementById('closeInfoFooterBtn').addEventListener('click', function() {
        hideModal('infoModal');
    });
}

// التحقق من جلسة المستخدم
function checkUserSession() {
    if (!currentUser) {
        showAuthModal();
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
    document.getElementById('changeImgBtn').addEventListener('click', changeProfileImage);
    
    // الروابط السريعة
    document.getElementById('goToCoursesBtn').addEventListener('click', function() {
        navigateToPage('courses');
    });
    
    document.getElementById('goToToolsBtn').addEventListener('click', function() {
        navigateToPage('tools');
    });
    
    // الدورات
    document.querySelectorAll('.view-course-btn').forEach(btn => {
        btn.addEventListener('click', function() {
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
        if (currentUser && currentUser.premium) {
            openCourse('ict');
        } else {
            showActivationSection();
        }
    });
    
    document.getElementById('activatePremiumBtn').addEventListener('click', activatePremium);
    
    // الأدوات
    document.getElementById('fibonacciCalculatorBtn').addEventListener('click', function() {
        showToolModal('fibonacciModal');
    });
    
    document.getElementById('riskManagerBtn').addEventListener('click', function() {
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
    
    // استماع لتغييرات الصفحة في الرابط
    window.addEventListener('hashchange', handleHashChange);
    
    // التعامل مع الروابط الخارجية في معلومات الدورة
    document.addEventListener('click', function(e) {
        if (e.target.closest('.rights-link')) {
            e.preventDefault();
            const link = e.target.closest('.rights-link');
            window.open(link.href, '_blank');
        }
    });
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

// العودة للخلف
function goBack() {
    window.history.back();
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
            statusBadge.textContent = 'حساب مميز (Premium)';
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
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    // التحقق من اسم المستخدم
    if (!/^[a-zA-Z]/.test(username)) {
        alert('اسم المستخدم يجب أن يبدأ بحرف إنجليزي');
        return;
    }
    
    if (username.length < 4) {
        alert('اسم المستخدم يجب أن يكون 4 أحرف على الأقل');
        return;
    }
    
    // التحقق من البريد الإلكتروني
    if (!isValidEmail(email)) {
        alert('يرجى إدخال بريد إلكتروني صحيح');
        return;
    }
    
    // التحقق من عدم وجود نفس البريد الإلكتروني
    if (users.some(user => user.email === email)) {
        alert('هذا البريد الإلكتروني مسجل مسبقاً');
        return;
    }
    
    // التحقق من عدم وجود نفس اسم المستخدم
    if (users.some(user => user.username === username)) {
        alert('اسم المستخدم هذا مستخدم مسبقاً');
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
    alert(`مرحباً ${name}! تم إنشاء حسابك بنجاح.`);
    
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
        alert('البريد الإلكتروني أو كلمة المرور غير صحيحة');
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
    
    // إظهار نموذج المصادقة
    showAuthModal();
    
    // التوجه للصفحة الرئيسية
    navigateToPage('home');
}

// إظهار نموذج تعديل البيانات
function showEditForm() {
    if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً');
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
        alert('يرجى إدخال الاسم');
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
    
    alert('تم تحديث بياناتك بنجاح');
}

// تغيير صورة الحساب
function changeProfileImage() {
    if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
    }
    
    // في التطبيق الحقيقي، هنا سيتم رفع صورة
    // لكن في هذا المثال، سنستخدم صورة افتراضية
    const newImage = prompt('أدخل رابط الصورة الجديدة:', currentUser.profileImage);
    
    if (newImage) {
        currentUser.profileImage = newImage;
        
        // تحديث القائمة
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('trading_users', JSON.stringify(users));
        }
        
        // تحديث الجلسة
        sessionStorage.setItem('current_user', JSON.stringify(currentUser));
        
        // تحديث الصورة في الواجهة
        document.getElementById('profileImg').src = newImage;
        
        alert('تم تحديث صورة الحساب بنجاح');
    }
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
    // استخدام مشغل بديل بدون حقوق يوتيوب
    const videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&showinfo=0&rel=0&modestbranding=1&fs=1`;
    
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
        alert('يرجى إنشاء حساب أولاً للوصول لدورات المتقدمين');
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
        alert('يرجى إدخال كود التفعيل');
        return;
    }
    
    // البحث عن الكود
    const codeIndex = premiumCodes.findIndex(c => c.code === code && !c.used);
    
    if (codeIndex === -1) {
        alert('كود التفعيل غير صالح أو مستخدم مسبقاً');
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
    
    // عرض رسالة نجاح
    alert('مبروك! تم تفعيل الاشتراك المميز بنجاح.');
    
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
        alert('يرجى إدخال قيم صحيحة (القاع يجب أن يكون أقل من القمة)');
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
    resultsHTML += '<div class="info-note" style="margin-top: 20px;">';
    resultsHTML += '<p><i class="fas fa-info-circle"></i> تم حساب المستويات بناءً على الاتجاه المحدد.</p>';
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
        alert('يرجى ملء جميع الحقول');
        return;
    }
    
    if (riskPercent < 0.1 || riskPercent > 10) {
        alert('نسبة المخاطرة يجب أن تكون بين 0.1% و 10%');
        return;
    }
    
    // حساب مبلغ المخاطرة
    const riskAmount = capital * (riskPercent / 100);
    
    // حساب النقاط بين الدخول والوقف
    const points = Math.abs(entryPrice - stopLoss);
    
    if (points === 0) {
        alert('سعر الدخول لا يمكن أن يساوي سعر وقف الخسارة');
        return;
    }
    
    // حساب حجم الصفقة (مبسط)
    const positionSize = (riskAmount / points).toFixed(2);
    
    let resultsHTML = '<h4>نتائج إدارة رأس المال:</h4>';
    resultsHTML += '<div class="results-grid">';
    resultsHTML += `<div class="result-item"><span class="result-label">رأس المال:</span><span class="result-value">$${capital.toFixed(2)}</span></div>`;
    resultsHTML += `<div class="result-item"><span class="result-label">نسبة المخاطرة:</span><span class="result-value">${riskPercent}%</span></div>`;
    resultsHTML += `<div class="result-item"><span class="result-label">مبلغ المخاطرة:</span><span class="result-value">$${riskAmount.toFixed(2)}</span></div>`;
    resultsHTML += `<div class="result-item"><span class="result-label">سعر الدخول:</span><span class="result-value">${entryPrice.toFixed(4)}</span></div>`;
    resultsHTML += `<div class="result-item"><span class="result-label">وقف الخسارة:</span><span class="result-value">${stopLoss.toFixed(4)}</span></div>`;
    resultsHTML += `<div class="result-item"><span class="result-label">النقاط بين الدخول والوقف:</span><span class="result-value">${points.toFixed(4)}</span></div>`;
    resultsHTML += `<div class="result-item" style="background: rgba(239, 68, 68, 0.1); border: 2px solid #ef4444;"><span class="result-label">الحجم المقترح:</span><span class="result-value" style="color: #ef4444;">${positionSize}</span></div>`;
    resultsHTML += '</div>';
    
    resultsHTML += `
        <div class="premium-note" style="margin-top: 20px;">
            <p><i class="fas fa-info-circle"></i> <strong>تفسير النتائج:</strong></p>
            <p>إذا خسرت الصفقة، ستخسر فقط $${riskAmount.toFixed(2)} (${riskPercent}% من رأس مالك).</p>
            <p>الحجم المقترح ${positionSize} هو حجم الصفقة الذي يضمن خسارة ${riskPercent}% فقط في حالة تنفيذ الوقف.</p>
        </div>
    `;
    
    document.getElementById('riskResults').innerHTML = resultsHTML;
}

// إعداد أيقونة الدعم العائمة
function setupFloatingSupport() {
    const supportIcon = document.getElementById('floatingSupport');
    let isDragging = false;
    let offsetX, offsetY;
    
    supportIcon.addEventListener('mousedown', startDrag);
    supportIcon.addEventListener('touchstart', startDragTouch);
    supportIcon.addEventListener('click', function(e) {
        if (!isDragging) {
            navigateToPage('support');
        }
    });
    
    function startDrag(e) {
        isDragging = false;
        const rect = supportIcon.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    }
    
    function startDragTouch(e) {
        isDragging = false;
        const touch = e.touches[0];
        const rect = supportIcon.getBoundingClientRect();
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
        
        document.addEventListener('touchmove', dragTouch);
        document.addEventListener('touchend', stopDrag);
    }
    
    function drag(e) {
        isDragging = true;
        supportIcon.style.left = (e.clientX - offsetX) + 'px';
        supportIcon.style.top = (e.clientY - offsetY) + 'px';
    }
    
    function dragTouch(e) {
        isDragging = true;
        const touch = e.touches[0];
        supportIcon.style.left = (touch.clientX - offsetX) + 'px';
        supportIcon.style.top = (touch.clientY - offsetY) + 'px';
    }
    
    function stopDrag() {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', dragTouch);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchend', stopDrag);
        
        // حفظ الموقع
        setTimeout(() => {
            isDragging = false;
        }, 100);
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
            <div class="no-messages" style="text-align: center; padding: 50px 20px; color: #94a3b8;">
                <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <p style="font-size: 1.2rem; margin-bottom: 10px;">لا توجد رسائل حالياً</p>
                <p style="font-size: 1rem;">اكتب رسالتك وسيتم الرد عليك قريباً</p>
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
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) {
        alert('يرجى كتابة رسالة');
        return;
    }
    
    // إنشاء الرسالة
    const message = {
        id: Date.now().toString(),
        userId: currentUser ? currentUser.id : 'anonymous',
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
            userId: currentUser ? currentUser.id : 'anonymous',
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