// بيانات التطبيق
const AppData = {
    currentUser: null,
    currentPage: 'authPage',
    currentCourse: null,
    currentVideoIndex: 0,
    messages: [],
    notifications: 0,
    player: null,
    
    // بيانات الدورات
    courses: [
        {
            id: 1,
            title: 'كورس التداول من صفر الى الاحتراف',
            instructor: 'حيدر الجنابي',
            description: 'دورة متكاملة لتعلم التداول من البداية إلى الاحتراف',
            videos: [
                {
                    id: 'G8eeqb82KOM',
                    title: 'دورة سمارت موني كونسبت (الأموال الذكية) الحلقة الأولى للمبتدئين',
                    duration: '11:46'
                },
                {
                    id: 'vUeyLqB82CM',
                    title: 'الدرس الثاني من كورس الأموال الذكية',
                    duration: '15:30'
                },
                {
                    id: 'CrzVLmflQgQ',
                    title: 'الدرس الثالث ترابط الفريمات من كورس الأموال الذكية',
                    duration: '13:45'
                }
            ],
            rights: {
                channel: 'https://t.me/thesuccessfulwayarabs',
                account: 'https://t.me/haideraljanabi90'
            }
        },
        {
            id: 2,
            title: 'أفضل دورة لتعلم SMC في الوطن العربي',
            instructor: 'الدكتور محمد مهدي',
            description: 'دورة شاملة لتعلم SMC بأسلوب احترافي',
            videos: [
                { id: 'eb2y-Kbd_N8', title: 'مقدمة هامة لدورة SMC Exaado', duration: '10:20' },
                { id: 'XSPuivsDNd4', title: 'لماذا المستوي الأول مجاني؟', duration: '8:45' },
                { id: 'cWx_GkB2htE', title: 'هل علم SMC أفضل علم لتحقيق الأرباح بالفوركس؟', duration: '12:30' },
                { id: 'pQsk2N8j08I', title: 'تأسيس SMC | درس1 | الشموع اليابانية', duration: '15:20' },
                { id: 'C1qDxNJJbbI', title: 'تأسيس SMC | الدرس2 | هيكلية الشموع', duration: '14:15' },
                { id: 'fH0vP9NNuug', title: 'تأسيس SMC | الدرس3 | الغلبة لمن؟', duration: '11:40' },
                { id: 'QmhYCHTkGPU', title: 'تأسيس SMC | الدرس4 | قمم وقيعان الهيكل؟', duration: '13:25' },
                { id: 'h9JXmwltHvw', title: 'تأسيس SMC | درس5 | كيف تتكون اتجاهات السوق؟', duration: '16:10' },
                { id: 'R08Q9wj0vHw', title: 'تأسيس SMC | درس6 | تطبيق عملي على اتجاهات السوق', duration: '14:50' },
                { id: 'vkEgojBoLO4', title: 'تأسيس SMC | الدرس7 | الاتجاهات الرئيسية والداخلية', duration: '12:35' },
                { id: 'ITKrEnK152M', title: 'تأسيس SMC | الدرس8 | تطبيق عملي على الاتجاه الرئيسي والداخلي', duration: '15:45' },
                { id: 'ICJbnDo20mI', title: 'الدرس1 | الحافز Level 2 | Inducment IDM', duration: '13:20' },
                { id: 'sKfoeLGsQUY', title: 'الدرس2: شروط | Level2 | lnducment IDM', duration: '11:55' },
                { id: 'U1Alwc74Ap0', title: 'الدرس3 | تطبيق عملي لاستخراج Level 2 | IDM', duration: '14:30' },
                { id: 'IdkFy19mPag', title: 'الدرس4 | تطبيق عملي على كل ما سبق | Level 2', duration: '16:40' }
            ],
            rights: {
                channel: 'https://t.me/Exaado',
                account: 'https://t.me/ExaadoSupport'
            }
        },
        {
            id: 3,
            title: 'الكورس السداسي في احتراف التحليل الفني',
            instructor: 'حيدر تريدنك',
            description: 'كورس متكامل لاحتراف التحليل الفني',
            videos: [
                { id: 'pNLb-3Nrjv0', title: 'مقدمة الكورس السداسي احتراف التحليل الفني في كوكب التداول', duration: '12:15' },
                { id: 'QEMB6XnoAPU', title: 'شرح الشمعة اليابانية بالتفصيل', duration: '18:30' },
                { id: 'SC9IA6y0mLo', title: 'شرح القمم والقيعان وأهميتها في التحليل الفني', duration: '15:45' },
                { id: 'SL0sab2OsPQ', title: 'علم تحديد الاتجاه في الأسواق المالية', duration: '14:20' },
                { id: 'vdhBbWv7P8Q', title: 'علم تحديد الاتجاه (الترند الفرعي) في الأسواق', duration: '13:55' },
                { id: 'qMSe7tjnkE0', title: 'علم تحديد الاتجاه في الأسواق المالية (المتوسط المتحرك 200)', duration: '16:10' },
                { id: '4CNWWp2toNI', title: 'الدعم الثابت ماهو وكيف نحدده بشكل دقيق', duration: '12:40' },
                { id: 'FMQG-iud_3k', title: 'المقاومة الثابتة ماهي وكيف نحددها بشكل دقيق', duration: '13:25' },
                { id: 'jEOCbIDFagE', title: 'عملية الاستبدال (بين دعم ومقاومة) في الأسواق', duration: '14:50' },
                { id: 'hsWQxsmF7Z4', title: 'الدعم والمقاومات الديناميكية (المتحركة)', duration: '15:35' },
                { id: 'r0dtL2Eey34', title: 'الدعوم والمقاومات الديناميكية (المتحركة) الجزء الثاني', duration: '13:20' },
                { id: 'S-PceOrWCVc', title: 'الدعم والمقاومات على طريقة أعظم محللي العالم (شبه الديناميكية)', duration: '16:45' },
                { id: 'X7aBNS3fj3E', title: 'تحديد الدعوم والمقاومات على طريقة أعظم محللي التاريخ (القنوات السعرية)', duration: '17:30' },
                { id: 'gsMhtEVN8us', title: 'تحديد الدعوم والمقاومات على طريقة أعظم محللي التاريخ (القنوات السعرية) الجزء الثاني', duration: '15:55' },
                { id: 'ECC5erFed88', title: 'قراءة الحالة النفسية في السوق عن طريق الشموع اليابانية (أنماط الشموع اليابانية)', duration: '18:20' },
                { id: 'dh4OZDqZohA', title: 'أساسيات البرايس اكشن (قراءة الحالة النفسية) في السوق', duration: '14:45' },
                { id: 'wfidL8peRxA', title: 'التصحيح والكسر والاختراق وإعادة الاختبار في التحليل الفني', duration: '16:30' },
                { id: 'evnMF07iHfA', title: 'تتبع البنوك والحيتان في الأسواق المالية (معلومات بآلاف الدولارات)', duration: '19:15' },
                { id: 'qfsu98cAwaM', title: 'تأكيد الاختراق الحقيقي وتجنب الاختراق الوهمي بالتحليل الفني عن طريق الفوليوم', duration: '17:40' },
                { id: 'dhpeq_sfy_k', title: 'تأكيد الكسر الحقيقي وتجنب الكسر الوهمي بالتحليل الفني عن طريق الفوليوم', duration: '15:25' },
                { id: '6dH93cY8G7Y', title: 'البرايس اكشن النوع الأول.. تعلم بطريقة جديدة', duration: '18:50' },
                { id: 'C_4NsWODb7c', title: 'البرايس اكشن المتحرك النوع الثاني.. تعلم بطريقة جديدة', duration: '16:35' },
                { id: 'Iv-oyMEzR74', title: 'الفيبوناتشي والبرايس اكشن النوع الثالث.. تعلم بطريقة جديدة', duration: '19:30' },
                { id: 'IsW3t13FfTE', title: 'مؤشر EMA و Stochastic أهم مؤشرين في وضع أي استراتيجية', duration: '21:15' }
            ],
            rights: {
                channel: 'https://t.me/tradaying',
                account: ''
            }
        }
    ],
    
    // دورة البرمويوم
    premiumCourse: {
        id: 4,
        title: 'كورس ICT من الصفر للمبتدئين',
        instructor: 'محمد سماره',
        description: 'دورة متكاملة لتعلم مفهوم ICT في التداول من الصفر',
        videos: [
            { id: 'B_Cniskclho', title: 'بعد 4 سنين تداول.... كورس ICT من الصفر للمبتدئين | الدرس الأول', duration: '25:30' },
            { id: 'P02iX2KGYpc', title: 'لا تصدق أن السوق يتحرك عشوائياً.... تعرف على BSL و SSL وأكشف الحقيقة | الدرس 2', duration: '28:15' },
            { id: 'sRBlms-TcMM', title: 'كيف يصنع السوق مناطق سيولة كاذبة لخداعك ؟ افهم ERL و IRL بوضوح | الدرس 3', duration: '31:40' },
            { id: 'p-tI_Opbstk', title: 'هل تغير هيكل السوق يعني فرصة ربح ؟ تعرف على MSS و BMS بوضوح | الدرس 4', duration: '27:55' },
            { id: 'Hd4ogoQabuA', title: 'كيف تستخدم فيبوناتشي و OTE لتحديد أفضل نقاط الدخول والخروج | الدرس 5', duration: '34:20' },
            { id: 'j-z1_kvtS4M', title: 'شرح مختلف يخليك تفهم السوق من جذوره | الدرس FVG 6', duration: '29:45' },
            { id: 'L897X5SrnaE', title: 'كيف تكتشف الفجوات غير المتوازنة وتتفوق على السوق | الدرس 7', duration: '33:10' },
            { id: 'VFsQ9mNebNk', title: 'سر اختيار أفضل نقاط الانعكاس في السوق | BPR FVG الدرس 8', duration: '30:25' },
            { id: 'rWx1zIaPhAw', title: 'أداة سرية يستخدمها الحيتان لدخول السوق ! | شرح اختلال الحجم بأسلوب ICT | الدرس 9', duration: '36:50' },
            { id: 'Uws5QjN2Dr4', title: 'كيف تكتشف الكسر الحقيقي في السوق ؟ | شرح BSG خطوة بخطوة | بأسلوب ICT | الدرس 10', duration: '32:35' },
            { id: 'ME6rPGFoWbU', title: 'شرح جميع أنواع الـ FVG في استراتيجية ICT | دليل شامل للمبتدئين خطوة بخطوة | الدرس 11', duration: '38:20' },
            { id: '2hGENxNVCDc', title: 'عرفت OB ؟ بس هل عرفت +OB و -OB؟ الفروقات المهمة اللي تغير قراراتك | الدرس 12', duration: '35:15' },
            { id: 'x0OgWDaPhtc', title: 'ما حد علمك الـ BB بهالطريقة.... الفرصة بيدك ! | الدرس 13', duration: '31:40' },
            { id: 'GCaYsTLRs04', title: 'اكتشف سر الـ Rejection Block قبل ما يتحرك السوق | الدرس 14', duration: '37:55' },
            { id: 'kD8Xs6qzgYc', title: 'ختام كورس أساس ICT | اكتشف قوة SETAB +A | الدرس 15', duration: '40:30' }
        ],
        rights: {
            channel: 'https://t.me/mos_rar',
            account: 'https://t.me/rar42rar'
        }
    },
    
    // أكواد البرمويوم المخزنة محلياً
    premiumCodes: [],
    
    // تخزين محلي
    storage: {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('خطأ في التخزين:', e);
                return false;
            }
        },
        
        get: function(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('خطأ في القراءة:', e);
                return null;
            }
        },
        
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('خطأ في الحذف:', e);
                return false;
            }
        }
    }
};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // تحميل البيانات المحفوظة
    loadSavedData();
    
    // تهيئة واجهة المستخدم
    setupEventListeners();
    
    // عرض الصفحة المناسبة
    showPage(AppData.currentPage);
    
    // تحديث واجهة المستخدم
    updateUI();
}

function loadSavedData() {
    // تحميل بيانات المستخدم
    AppData.currentUser = AppData.storage.get('currentUser');
    
    // تحميل الأكواد
    AppData.premiumCodes = AppData.storage.get('premiumCodes') || [];
    
    // تحميل الرسائل
    AppData.messages = AppData.storage.get('messages') || [];
    
    // إذا كان هناك مستخدم مسجل، انتقل للرئيسية
    if (AppData.currentUser) {
        AppData.currentPage = 'homePage';
        updateNav('home');
    }
}

function setupEventListeners() {
    // القائمة الجانبية
    document.getElementById('menuBtn').addEventListener('click', openSideMenu);
    document.getElementById('closeMenu').addEventListener('click', closeSideMenu);
    
    // زر الرجوع
    document.getElementById('backBtn').addEventListener('click', goBack);
    
    // تسجيل الدخول وإنشاء حساب
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // الحساب
    document.getElementById('editImageBtn').addEventListener('click', triggerImageUpload);
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    document.getElementById('editDataBtn').addEventListener('click', toggleEditForm);
    document.getElementById('cancelEditBtn').addEventListener('click', toggleEditForm);
    document.getElementById('updateForm').addEventListener('submit', handleUpdateProfile);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // التنقل
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateTo(page);
        });
    });
    
    document.querySelectorAll('.side-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (this.hasAttribute('data-page')) {
                const page = this.getAttribute('data-page');
                navigateTo(page);
                closeSideMenu();
            }
        });
    });
    
    // الدورات
    document.getElementById('coursesList').addEventListener('click', function(e) {
        const courseCard = e.target.closest('.course-card');
        if (courseCard) {
            const courseId = parseInt(courseCard.getAttribute('data-id'));
            openCourse(courseId);
        }
    });
    
    // معلومات الدورة
    document.getElementById('courseInfoBtn').addEventListener('click', showCourseInfo);
    document.getElementById('closeInfoBtn').addEventListener('click', closeCourseInfo);
    
    // المتقدمين
    document.getElementById('premiumCourseBtn').addEventListener('click', openPremiumModal);
    document.getElementById('closePremiumModal').addEventListener('click', closePremiumModal);
    document.getElementById('cancelPremiumBtn').addEventListener('click', closePremiumModal);
    document.getElementById('activatePremiumBtn').addEventListener('click', activatePremium);
    
    // الأدوات
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', function() {
            const tool = this.getAttribute('data-tool');
            openTool(tool);
        });
    });
    
    // حاسبة فيبوناتشي
    document.getElementById('fibonacciForm').addEventListener('submit', calculateFibonacci);
    document.getElementById('closeFibonacciResults').addEventListener('click', closeFibonacciResults);
    
    // إدارة رأس المال
    document.getElementById('riskForm').addEventListener('submit', calculateRisk);
    document.getElementById('closeRiskResults').addEventListener('click', closeRiskResults);
    
    // الدعم الفني
    document.getElementById('floatingSupport').addEventListener('click', openSupportModal);
    document.getElementById('closeSupportModal').addEventListener('click', closeSupportModal);
    
    // سياسة الخصوصية ومن نحن
    document.getElementById('privacyBtn').addEventListener('click', showPrivacyModal);
    document.getElementById('aboutBtn').addEventListener('click', showAboutModal);
    document.getElementById('closePrivacyModal').addEventListener('click', closePrivacyModal);
    document.getElementById('closeAboutModal').addEventListener('click', closeAboutModal);
    document.getElementById('acceptPrivacyBtn').addEventListener('click', closePrivacyModal);
    document.getElementById('acceptAboutBtn').addEventListener('click', closeAboutModal);
    
    // التنبيهات
    document.getElementById('alertOkBtn').addEventListener('click', closeAlert);
    
    // النقر خارج القوائم
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.side-menu') && !e.target.closest('.menu-btn') && 
            document.querySelector('.side-menu').style.right === '0px') {
            closeSideMenu();
        }
    });
}

// ============== إدارة الصفحات ==============

function showPage(pageId) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // إخفاء النوافذ المنبثقة
    document.querySelectorAll('.modal, .support-modal, .alert-modal').forEach(modal => {
        modal.style.display = 'none';
    });
    
    // إظهار الصفحة المطلوبة
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
        AppData.currentPage = pageId;
        
        // تحديث زر الرجوع
        updateBackButton();
        
        // تحميل محتوى الصفحة إذا لزم
        switch(pageId) {
            case 'coursesPage':
                loadCourses();
                break;
            case 'courseDetailPage':
                loadCourseVideos();
                break;
            case 'homePage':
                updateHomePage();
                break;
            case 'accountPage':
                updateAccountPage();
                break;
        }
    }
}

function navigateTo(page) {
    // التحقق من المصادقة للصفحات المحمية
    if ((page === 'premium' || page === 'account' || page === 'tools') && !AppData.currentUser) {
        showAlert('يرجى تسجيل الدخول أولاً للوصول إلى هذه الصفحة');
        showPage('authPage');
        updateNav('account');
        return;
    }
    
    const pageMap = {
        'account': 'accountPage',
        'home': 'homePage',
        'courses': 'coursesPage',
        'premium': 'premiumPage',
        'tools': 'toolsPage',
        'support': 'supportPage'
    };
    
    if (pageMap[page]) {
        showPage(pageMap[page]);
        updateNav(page);
    }
}

function updateNav(activePage) {
    // تحديث الشريط السفلي
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === activePage) {
            item.classList.add('active');
        }
    });
}

function updateBackButton() {
    const backBtn = document.getElementById('backBtn');
    const pagesWithBack = ['courseDetailPage', 'courseInfoPage', 'fibonacciPage', 'riskPage'];
    
    if (pagesWithBack.includes(AppData.currentPage)) {
        backBtn.style.display = 'flex';
    } else {
        backBtn.style.display = 'none';
    }
}

function goBack() {
    switch(AppData.currentPage) {
        case 'courseDetailPage':
            showPage('coursesPage');
            updateNav('courses');
            break;
        case 'courseInfoPage':
            showPage('courseDetailPage');
            break;
        case 'fibonacciPage':
        case 'riskPage':
            showPage('toolsPage');
            updateNav('tools');
            break;
        default:
            showPage('homePage');
            updateNav('home');
    }
}

// ============== القائمة الجانبية ==============

function openSideMenu() {
    document.querySelector('.side-menu').style.right = '0';
}

function closeSideMenu() {
    document.querySelector('.side-menu').style.right = '-300px';
}

// ============== المصادقة ==============

function switchAuthTab(tabName) {
    // تحديث التبويبات
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`.auth-tab[data-tab="${tabName}"]`).classList.add('active');
    
    // تحديث النماذج
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    document.getElementById(`${tabName}Form`).classList.add('active');
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const messageElement = document.getElementById('loginMessage');
    
    // التحقق البسيط
    if (!email || !password) {
        showMessage(messageElement, 'يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    // محاكاة تسجيل الدخول
    const user = AppData.storage.get('user_' + email);
    
    if (user && user.password === password) {
        // تسجيل الدخول الناجح
        AppData.currentUser = user;
        AppData.storage.set('currentUser', user);
        
        showMessage(messageElement, 'تم تسجيل الدخول بنجاح!', 'success');
        
        setTimeout(() => {
            showPage('homePage');
            updateNav('home');
            updateUI();
            clearAuthForms();
        }, 1000);
    } else {
        showMessage(messageElement, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('registerMessage');
    
    // التحقق من صحة البيانات
    if (!fullName || !username || !email || !password) {
        showMessage(messageElement, 'يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (username.length < 4 || !/^[a-zA-Z]/.test(username)) {
        showMessage(messageElement, 'اسم المستخدم يجب أن يبدأ بحرف ولا يقل عن 4 رموز', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage(messageElement, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    // التحقق من عدم تكرار البريد الإلكتروني
    const existingUser = AppData.storage.get('user_' + email);
    if (existingUser) {
        showMessage(messageElement, 'هذا البريد الإلكتروني مستخدم بالفعل', 'error');
        return;
    }
    
    // إنشاء حساب جديد
    const newUser = {
        id: Date.now(),
        fullName: fullName,
        username: username,
        email: email,
        password: password,
        profileImage: 'https://j.top4top.io/p_3670reejg0.png',
        status: 'عادي',
        isPremium: false,
        premiumExpiry: null,
        createdAt: new Date().toISOString()
    };
    
    // حفظ المستخدم
    AppData.storage.set('user_' + email, newUser);
    
    // تسجيل الدخول التلقائي
    AppData.currentUser = newUser;
    AppData.storage.set('currentUser', newUser);
    
    showMessage(messageElement, 'تم إنشاء الحساب بنجاح!', 'success');
    
    setTimeout(() => {
        showPage('homePage');
        updateNav('home');
        updateUI();
        clearAuthForms();
    }, 1000);
}

function handleLogout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        AppData.currentUser = null;
        AppData.storage.remove('currentUser');
        
        showPage('authPage');
        updateNav('account');
        updateUI();
        
        showAlert('تم تسجيل الخروج بنجاح');
    }
}

function clearAuthForms() {
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    document.getElementById('loginMessage').textContent = '';
    document.getElementById('registerMessage').textContent = '';
}

// ============== إدارة الحساب ==============

function updateAccountPage() {
    if (!AppData.currentUser) return;
    
    const user = AppData.currentUser;
    
    document.getElementById('userFullName').textContent = user.fullName;
    document.getElementById('userUsername').textContent = '@' + user.username;
    document.getElementById('userImage').src = user.profileImage;
    document.getElementById('userStatus').textContent = user.isPremium ? 'Premium' : 'عادي';
    document.getElementById('userStatus').className = user.isPremium ? 'status-badge premium' : 'status-badge';
    
    // تعبئة حقول التعديل
    document.getElementById('editName').value = user.fullName;
    document.getElementById('editUsername').value = user.username;
}

function triggerImageUpload() {
    document.getElementById('imageUpload').click();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // محاكاة رفع الصورة (في الواقع سيتم رفعها لخادم)
    const reader = new FileReader();
    reader.onload = function(event) {
        const imageUrl = event.target.result;
        
        // تحديث صورة المستخدم
        AppData.currentUser.profileImage = imageUrl;
        AppData.storage.set('user_' + AppData.currentUser.email, AppData.currentUser);
        AppData.storage.set('currentUser', AppData.currentUser);
        
        // تحديث الواجهة
        document.getElementById('userImage').src = imageUrl;
        
        showAlert('تم تحديث صورة الحساب بنجاح');
    };
    
    reader.readAsDataURL(file);
}

function toggleEditForm() {
    const form = document.getElementById('editDataForm');
    if (form.style.display === 'none') {
        form.style.display = 'block';
        updateAccountPage();
    } else {
        form.style.display = 'none';
    }
}

function handleUpdateProfile(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('editName').value.trim();
    const username = document.getElementById('editUsername').value.trim();
    const password = document.getElementById('editPassword').value;
    
    if (!fullName || !username) {
        showAlert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    if (username.length < 4 || !/^[a-zA-Z]/.test(username)) {
        showAlert('اسم المستخدم يجب أن يبدأ بحرف ولا يقل عن 4 رموز');
        return;
    }
    
    // تحديث بيانات المستخدم
    AppData.currentUser.fullName = fullName;
    AppData.currentUser.username = username;
    
    if (password) {
        if (password.length < 6) {
            showAlert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }
        AppData.currentUser.password = password;
    }
    
    // حفظ التغييرات
    AppData.storage.set('user_' + AppData.currentUser.email, AppData.currentUser);
    AppData.storage.set('currentUser', AppData.currentUser);
    
    // تحديث الواجهة
    updateAccountPage();
    toggleEditForm();
    
    showAlert('تم تحديث البيانات بنجاح');
}

// ============== الدورات ==============

function loadCourses() {
    const container = document.getElementById('coursesList');
    container.innerHTML = '';
    
    AppData.courses.forEach(course => {
        const courseElement = document.createElement('div');
        courseElement.className = 'course-card';
        courseElement.setAttribute('data-id', course.id);
        
        courseElement.innerHTML = `
            <div class="course-card-header">
                <h3>${course.title}</h3>
                <p class="course-instructor">${course.instructor}</p>
            </div>
            <div class="course-card-body">
                <p>${course.description}</p>
            </div>
            <div class="course-card-footer">
                <span>${course.videos.length} فيديو</span>
                <button class="btn-secondary">مشاهدة الدورة</button>
            </div>
        `;
        
        container.appendChild(courseElement);
    });
}

function openCourse(courseId) {
    const course = AppData.courses.find(c => c.id === courseId);
    if (!course) return;
    
    AppData.currentCourse = course;
    AppData.currentVideoIndex = 0;
    
    document.getElementById('courseTitle').textContent = course.title;
    document.getElementById('courseInstructor').textContent = course.instructor;
    
    showPage('courseDetailPage');
    loadCourseVideos();
}

function loadCourseVideos() {
    if (!AppData.currentCourse) return;
    
    const videosList = document.getElementById('videosList');
    videosList.innerHTML = '';
    
    AppData.currentCourse.videos.forEach((video, index) => {
        const videoElement = document.createElement('div');
        videoElement.className = `video-item ${index === AppData.currentVideoIndex ? 'active' : ''}`;
        videoElement.setAttribute('data-index', index);
        
        videoElement.innerHTML = `
            <span class="video-number">${index + 1}</span>
            <span class="video-title">${video.title}</span>
        `;
        
        videoElement.addEventListener('click', () => playVideo(index));
        
        videosList.appendChild(videoElement);
    });
    
    // تشغيل الفيديو الأول
    playVideo(AppData.currentVideoIndex);
}

function playVideo(index) {
    if (!AppData.currentCourse || !AppData.currentCourse.videos[index]) return;
    
    AppData.currentVideoIndex = index;
    
    const video = AppData.currentCourse.videos[index];
    const container = document.getElementById('plyrContainer');
    
    // تحديث العنصر النشط
    document.querySelectorAll('.video-item').forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // إذا كان هناك مشغل حالي، قم بتدميره
    if (AppData.player) {
        AppData.player.destroy();
    }
    
    // إنشاء مشغل جديد
    container.innerHTML = `
        <div class="plyr__video-embed" id="player">
            <iframe 
                src="https://www.youtube-nocookie.com/embed/${video.id}?origin=https://plyr.io&amp;iv_load_policy=3&amp;modestbranding=1&amp;playsinline=1&amp;showinfo=0&amp;rel=0&amp;enablejsapi=1"
                allowfullscreen
                allowtransparency
                allow="autoplay"
            ></iframe>
        </div>
    `;
    
    // تهيئة مشغل Plyr
    AppData.player = new Plyr('#player', {
        controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        hideControls: false,
        resetOnEnd: true
    });
}

function showCourseInfo() {
    if (!AppData.currentCourse) return;
    
    document.getElementById('infoCourseTitle').textContent = AppData.currentCourse.title;
    document.getElementById('infoInstructor').textContent = AppData.currentCourse.instructor;
    document.getElementById('infoVideosCount').textContent = AppData.currentCourse.videos.length;
    
    document.getElementById('infoChannelLink').href = AppData.currentCourse.rights.channel;
    document.getElementById('infoAccountLink').href = AppData.currentCourse.rights.account || '#';
    
    if (!AppData.currentCourse.rights.account) {
        document.getElementById('infoAccountLink').style.display = 'none';
    } else {
        document.getElementById('infoAccountLink').style.display = 'block';
    }
    
    showPage('courseInfoPage');
}

function closeCourseInfo() {
    showPage('courseDetailPage');
}

// ============== البرمويوم ==============

function openPremiumModal() {
    if (!AppData.currentUser) {
        showAlert('يرجى تسجيل الدخول أولاً');
        showPage('authPage');
        return;
    }
    
    document.getElementById('premiumModal').style.display = 'flex';
    document.getElementById('premiumMessage').textContent = '';
    document.getElementById('premiumCode').value = '';
}

function closePremiumModal() {
    document.getElementById('premiumModal').style.display = 'none';
}

function activatePremium() {
    const code = document.getElementById('premiumCode').value.trim();
    const messageElement = document.getElementById('premiumMessage');
    
    if (!code) {
        showMessage(messageElement, 'يرجى إدخال كود التفعيل', 'error');
        return;
    }
    
    // البحث عن الكود
    const premiumCode = AppData.premiumCodes.find(c => c.code === code && !c.used);
    
    if (premiumCode) {
        // تفعيل البرمويوم
        premiumCode.used = true;
        premiumCode.usedBy = AppData.currentUser.email;
        premiumCode.usedAt = new Date().toISOString();
        
        AppData.currentUser.isPremium = true;
        AppData.currentUser.premiumExpiry = new Date(Date.now() + premiumCode.duration * 60000).toISOString(); // دقائق إلى تاريخ انتهاء
        
        // حفظ التغييرات
        AppData.storage.set('user_' + AppData.currentUser.email, AppData.currentUser);
        AppData.storage.set('currentUser', AppData.currentUser);
        AppData.storage.set('premiumCodes', AppData.premiumCodes);
        
        showMessage(messageElement, 'تم تفعيل الاشتراك المميز بنجاح!', 'success');
        
        setTimeout(() => {
            closePremiumModal();
            updateUI();
            showAlert('مبروك! تم تفعيل الاشتراك المميز بنجاح');
        }, 1500);
    } else {
        showMessage(messageElement, 'كود التفعيل غير صالح أو مستخدم مسبقاً', 'error');
    }
}

// ============== الأدوات ==============

function openTool(tool) {
    switch(tool) {
        case 'fibonacci':
            showPage('fibonacciPage');
            break;
        case 'risk':
            showPage('riskPage');
            break;
    }
}

function calculateFibonacci(e) {
    e.preventDefault();
    
    const low = parseFloat(document.getElementById('lowPrice').value);
    const high = parseFloat(document.getElementById('highPrice').value);
    const direction = document.querySelector('input[name="direction"]:checked').value;
    
    if (isNaN(low) || isNaN(high)) {
        showAlert('يرجى إدخال قيم صحيحة');
        return;
    }
    
    if (direction === 'lowToHigh' && low >= high) {
        showAlert('القاع يجب أن يكون أقل من القمة');
        return;
    }
    
    if (direction === 'highToLow' && high <= low) {
        showAlert('القمة يجب أن تكون أعلى من القاع');
        return;
    }
    
    const diff = Math.abs(high - low);
    const levels = [
        { name: '0.0%', value: direction === 'lowToHigh' ? low : high },
        { name: '23.6%', value: direction === 'lowToHigh' ? low + diff * 0.236 : high - diff * 0.236 },
        { name: '38.2%', value: direction === 'lowToHigh' ? low + diff * 0.382 : high - diff * 0.382 },
        { name: '50.0%', value: direction === 'lowToHigh' ? low + diff * 0.5 : high - diff * 0.5 },
        { name: '61.8%', value: direction === 'lowToHigh' ? low + diff * 0.618 : high - diff * 0.618 },
        { name: '78.6%', value: direction === 'lowToHigh' ? low + diff * 0.786 : high - diff * 0.786 },
        { name: '100.0%', value: direction === 'lowToHigh' ? high : low }
    ];
    
    const container = document.getElementById('fibonacciLevels');
    container.innerHTML = '';
    
    levels.forEach(level => {
        const levelElement = document.createElement('div');
        levelElement.className = 'fib-level';
        levelElement.innerHTML = `
            <div class="level-name">${level.name}</div>
            <div class="level-value">${level.value.toFixed(4)}</div>
        `;
        container.appendChild(levelElement);
    });
    
    document.getElementById('fibonacciResults').style.display = 'block';
}

function closeFibonacciResults() {
    document.getElementById('fibonacciResults').style.display = 'none';
    document.getElementById('fibonacciForm').reset();
}

function calculateRisk(e) {
    e.preventDefault();
    
    const balance = parseFloat(document.getElementById('accountBalance').value);
    const riskPercent = parseFloat(document.getElementById('riskPercent').value);
    const entry = parseFloat(document.getElementById('entryPrice').value);
    const stopLoss = parseFloat(document.getElementById('stopLoss').value);
    
    if (isNaN(balance) || isNaN(riskPercent) || isNaN(entry) || isNaN(stopLoss)) {
        showAlert('يرجى إدخال جميع القيم بشكل صحيح');
        return;
    }
    
    if (riskPercent <= 0 || riskPercent > 100) {
        showAlert('نسبة المخاطرة يجب أن تكون بين 0.1% و 100%');
        return;
    }
    
    // الحسابات
    const riskAmount = balance * (riskPercent / 100);
    const priceDiff = Math.abs(entry - stopLoss);
    const positionSize = riskAmount / priceDiff;
    const potentialLoss = positionSize * priceDiff;
    
    // عرض النتائج
    document.getElementById('riskAmount').textContent = riskAmount.toFixed(2);
    document.getElementById('positionSize').textContent = positionSize.toFixed(2);
    document.getElementById('priceDifference').textContent = priceDiff.toFixed(4);
    document.getElementById('potentialLoss').textContent = potentialLoss.toFixed(2);
    
    document.getElementById('riskResults').style.display = 'block';
}

function closeRiskResults() {
    document.getElementById('riskResults').style.display = 'none';
    document.getElementById('riskForm').reset();
}

// ============== الدعم الفني ==============

function openSupportModal() {
    document.getElementById('supportModal').style.display = 'flex';
    loadMessages();
}

function closeSupportModal() {
    document.getElementById('supportModal').style.display = 'none';
    updateNotificationBadge(0);
}

function loadMessages() {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    AppData.messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${msg.sender === 'admin' ? 'admin' : 'user'}`;
        
        const time = new Date(msg.timestamp).toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageElement.innerHTML = `
            <div class="message-text">${msg.text}</div>
            <span class="message-time">${time}</span>
        `;
        
        container.appendChild(messageElement);
    });
    
    // التمرير للأسفل
    container.scrollTop = container.scrollHeight;
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('supportBadge');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
        badge.classList.add('pulse-animation');
    } else {
        badge.style.display = 'none';
        badge.classList.remove('pulse-animation');
    }
}

// ============== النوافذ المنبثقة ==============

function showPrivacyModal() {
    document.getElementById('privacyModal').style.display = 'flex';
}

function closePrivacyModal() {
    document.getElementById('privacyModal').style.display = 'none';
}

function showAboutModal() {
    document.getElementById('aboutModal').style.display = 'flex';
}

function closeAboutModal() {
    document.getElementById('aboutModal').style.display = 'none';
}

function showAlert(message) {
    document.getElementById('alertMessage').textContent = message;
    document.getElementById('alertModal').style.display = 'flex';
}

function closeAlert() {
    document.getElementById('alertModal').style.display = 'none';
}

// ============== وظائف مساعدة ==============

function updateUI() {
    // تحديث الحالة بناءً على المستخدم الحالي
    if (AppData.currentUser) {
        // تحديث صفحة الحساب
        updateAccountPage();
        
        // تحديث الرئيسية
        updateHomePage();
        
        // تحديث عدد الإشعارات
        updateNotificationBadge(AppData.notifications);
    }
}

function updateHomePage() {
    if (AppData.currentUser) {
        document.querySelector('.welcome-section h2').textContent = `مرحباً ${AppData.currentUser.fullName}`;
    } else {
        document.querySelector('.welcome-section h2').textContent = 'مرحباً بك في اكزم لتداول';
    }
}

function showMessage(element, text, type) {
    element.textContent = text;
    element.className = 'auth-message ' + type + '-message';
}

// توليد أكواد برمويوم (للواجهة الإدارية لاحقاً)
function generatePremiumCode(duration) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 4 === 0) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const premiumCode = {
        code: code,
        duration: duration, // بالدقائق
        createdAt: new Date().toISOString(),
        used: false,
        usedBy: null,
        usedAt: null
    };
    
    AppData.premiumCodes.push(premiumCode);
    AppData.storage.set('premiumCodes', AppData.premiumCodes);
    
    return code;
}

// إضافة رسالة دعم
function addSupportMessage(text, sender = 'user') {
    const message = {
        id: Date.now(),
        text: text,
        sender: sender,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    AppData.messages.push(message);
    AppData.storage.set('messages', AppData.messages);
    
    if (sender === 'admin') {
        AppData.notifications++;
        updateNotificationBadge(AppData.notifications);
    }
}

// تهيئة بعض البيانات الافتراضية
function initSampleData() {
    if (!AppData.storage.get('premiumCodes')) {
        // إنشاء بعض الأكواد التجريبية
        const sampleCodes = [
            {
                code: 'ABCD-1234-EFGH-5678',
                duration: 525600, // سنة (365 يوم × 24 ساعة × 60 دقيقة)
                createdAt: new Date().toISOString(),
                used: false,
                usedBy: null,
                usedAt: null
            },
            {
                code: 'TEST-CODE-1234-5678',
                duration: 1440, // يوم واحد
                createdAt: new Date().toISOString(),
                used: false,
                usedBy: null,
                usedAt: null
            }
        ];
        
        AppData.storage.set('premiumCodes', sampleCodes);
    }
    
    if (!AppData.storage.get('messages')) {
        // رسائل ترحيبية
        const welcomeMessages = [
            {
                id: 1,
                text: 'مرحباً بك في تطبيق اكزم لتداول! نحن هنا لمساعدتك.',
                sender: 'admin',
                timestamp: new Date().toISOString(),
                read: true
            }
        ];
        
        AppData.storage.set('messages', welcomeMessages);
    }
}

// تشغيل بيانات العينة عند التحميل الأول
initSampleData();