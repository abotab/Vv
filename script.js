// ====== بيانات التطبيق الأساسية ======

// بيانات المستخدم الحالي
let currentUser = null;
let isLoggedIn = false;
let currentPage = 'home';

// مسارات الرجوع
let pageHistory = [];

// بيانات الدورات
const courses = {
    free: [
        {
            id: 1,
            title: "كورس التداول من صفر الى الاحتراف",
            instructor: "حيدر الجنابي",
            description: "دورة متكاملة لتعلم أساسيات التداول من الصفر وحتى الاحتراف، تشمل مفاهيم الأموال الذكية والتطبيقات العملية.",
            videos: [
                { id: 1, title: "دورة سمارت موني كونسبت الحلقة الأولى للمبتدئين", url: "G8eeqb82KOM" },
                { id: 2, title: "الدرس الثاني من كورس الأموال الذكية", url: "vUeyLqB82CM" },
                { id: 3, title: "الدرس الثالث ترابط الفريمات من كورس الأموال الذكية", url: "CrzVLmflQgQ" }
            ],
            level: "مبتدئ",
            telegramChannel: "https://t.me/thesuccessfulwayarabs",
            telegramAccount: "https://t.me/haideraljanabi90",
            note: "هذه الدورة مجانية بالكامل ومتاحة لجميع المستخدمين."
        },
        {
            id: 2,
            title: "أفضل دورة لتعلم SMC في الوطن العربي",
            instructor: "الدكتور محمد مهدي",
            description: "تعلم علم SMC (الأموال الذكية) بأسلوب احترافي مع تطبيقات عملية ومفصلة.",
            videos: [
                { id: 1, title: "مقدمة هامة لدورة SMC Exaado", url: "eb2y-Kbd_N8" },
                { id: 2, title: "لماذا المستوي الأول مجاني؟", url: "XSPuivsDNd4" },
                { id: 3, title: "هل علم SMC أفضل علم لتحقيق الأرباح بالفوركس؟", url: "cWx_GkB2htE" },
                { id: 4, title: "تأسيس SMC | درس1 | الشموع اليابانية", url: "pQsk2N8j08I" },
                { id: 5, title: "تأسيس SMC | الدرس2 | هيكلية الشموع", url: "C1qDxNJJbbI" },
                { id: 6, title: "تأسيس SMC | الدرس3 | الغلبة لمن؟", url: "fH0vP9NNuug" },
                { id: 7, title: "تأسيس SMC | الدرس4 | قمم وقيعان الهيكل؟", url: "QmhYCHTkGPU" },
                { id: 8, title: "تأسيس SMC | درس5 | كيف تتكون اتجاهات السوق؟", url: "h9JXmwltHvw" },
                { id: 9, title: "تأسيس SMC | درس6 | تطبيق عملي على اتجاهات السوق", url: "R08Q9wj0vHw" },
                { id: 10, title: "تأسيس SMC | الدرس7 | الاتجاهات الرئيسية والداخلية", url: "vkEgojBoLO4" },
                { id: 11, title: "تأسيس SMC | الدرس8 | تطبيق عملي على الاتجاه الرئيسي والداخلي", url: "ITKrEnK152M" },
                { id: 12, title: "الدرس1 | الحافز | Level 2 | Inducment IDM", url: "ICJbnDo20mI" },
                { id: 13, title: "الدرس2: شروط | Level 2 | Inducment IDM", url: "sKfoeLGsQUY" },
                { id: 14, title: "الدرس3 | تطبيق عملي لاستخراج Level 2 | IDM", url: "U1Alwc74Ap0" },
                { id: 15, title: "الدرس4 | تطبيق عملي على كل ما سبق | Level 2", url: "IdkFy19mPag" }
            ],
            level: "متوسط",
            telegramChannel: "https://t.me/Exaado",
            telegramAccount: "https://t.me/ExaadoSupport",
            note: "دورة متخصصة في علم SMC مع تطبيقات عملية."
        },
        {
            id: 3,
            title: "الكورس السداسي في احتراف التحليل الفني",
            instructor: "حيدر تريدنك",
            description: "كورس متكامل لتعلم التحليل الفني بأسلوب احترافي، يشمل جميع الأساسيات والتقنيات المتقدمة.",
            videos: [
                { id: 1, title: "مقدمة الكورس السداسي احتراف التحليل الفني في كوكب التداول", url: "pNLb-3Nrjv0" },
                { id: 2, title: "شرح الشمعة اليابانية بالتفصيل | الكورس السداسي 1/1", url: "QEMB6XnoAPU" },
                { id: 3, title: "شرح القمم والقيعان واهميتها في التحليل الفني 2/1", url: "SC9IA6y0mLo" },
                { id: 4, title: "علم تحديد الاتجاه في الأسواق المالية الكورس السداسي 3/1", url: "SL0sab2OsPQ" },
                { id: 5, title: "علم تحديد الاتجاه (الترند الفرعي) في الأسواق الكورس السداسي 4/1", url: "vdhBbWv7P8Q" },
                { id: 6, title: "علم تحديد الاتجاه في الأسواق المالية (المتوسط المتحرك 200) الكورس السداسي 5/1", url: "qMSe7tjnkE0" },
                { id: 7, title: "الدعم الثابت ماهو وكيف نحدده بشكل دقيق الكورس السداسي 6/1", url: "4CNWWp2toNI" },
                { id: 8, title: "المقاومة الثابتة ماهي وكيف نحددها بشكل دقيق الكورس السداسي 7/1", url: "FMQG-iud_3k" },
                { id: 9, title: "عملية الاستبدال (بين دعم ومقاومة) في الأسواق الكورس السداسي 8/1", url: "jEOCbIDFagE" },
                { id: 10, title: "الدعم والمقاومات الديناميكية (المتحركة) الكورس السداسي 9/1", url: "hsWQxsmF7Z4" },
                { id: 11, title: "الدعوم والمقاومات الديناميكية (المتحركة) الكورس السداسي 10/1", url: "r0dtL2Eey34" },
                { id: 12, title: "الدعم والمقاومات على طريقة أعظم محللين العالم (شبه الديناميكية) الكورس السداسي 11/1", url: "S-PceOrWCVc" },
                { id: 13, title: "تحديد الدعوم والمقاومات على طريقة أعظم محللين التاريخ (القنوات السعرية) الكورس السداسي 12/1", url: "X7aBNS3fj3E" },
                { id: 14, title: "تحديد الدعوم والمقاومات على طريقة أعظم محللين التاريخ (القنوات السعرية) الكورس السداسي 13/1", url: "gsMhtEVN8us" },
                { id: 15, title: "قراءة الحالة النفسية في السوق عن طريق الشموع اليابانية (أنماط الشموع اليابانية) الكورس السداسي 14/1", url: "ECC5erFed88" },
                { id: 16, title: "أساسيات البرايس أكشن (قراءة الحالة النفسية) في السوق الكورس السداسي 15/1", url: "dh4OZDqZohA" },
                { id: 17, title: "التصحيح والكسر والاختراق وإعادة الاختبار في التحليل الفني الكورس السداسي 1/2", url: "wfidL8peRxA" },
                { id: 18, title: "تتبع البنوك والحيتان في الأسواق المالية (معلومات بآلاف الدولارات) الكورس السداسي 2/2", url: "evnMF07iHfA" },
                { id: 19, title: "تأكيد الاختراق الحقيقي وتجنب الاختراق الوهمي بالتحليل الفني عن طريق الفوليوم الكورس السداسي 3/2", url: "qfsu98cAwaM" },
                { id: 20, title: "تأكيد الكسر الحقيقي وتجنب الكسر الوهمي بالتحليل الفني عن طريق الفوليوم الكورس السداسي 4/2", url: "dhpeq_sfy_k" },
                { id: 21, title: "البرايس أكشن النوع الأول.. تعلم بطريقة جديدة الكورس السداسي 1/3", url: "6dH93cY8G7Y" },
                { id: 22, title: "البرايس أكشن المتحرك النوع الثاني.. تعلم بطريقة جديدة الكورس السداسي 2/3", url: "C_4NsWODb7c" },
                { id: 23, title: "الفيبوناتشي والبرايس أكشن النوع الثالث 3/3 تعلم بطريقة الكورس السداسي", url: "Iv-oyMEzR74" },
                { id: 24, title: "مؤشر EMA و Stochastic أهم مؤشرين في وضع أي استراتيجية الحلقة الأخيرة من الكورس السداسي", url: "IsW3t13FfTE" }
            ],
            level: "متقدم",
            telegramChannel: "https://t.me/tradaying",
            telegramAccount: "",
            note: "كورس متكامل وشامل لاحتراف التحليل الفني."
        }
    ],
    premium: [
        {
            id: 4,
            title: "كورس ICT من الصفر للمبتدئين",
            instructor: "محمد سماره",
            description: "دورة متكاملة لتعلم مفهوم ICT في التداول من الصفر، تشمل جميع الأساسيات والتقنيات المتقدمة.",
            videos: [
                { id: 1, title: "بعد 4 سنين تداول.... كورس ICT من الصفر للمبتدئين | الدرس الأول", url: "B_Cniskclho" },
                { id: 2, title: "لا تصدق أن السوق يتحرك عشوائيا.... تعرف على BSL و SSL واكشف الحقيقة | الدرس 2", url: "P02iX2KGYpc" },
                { id: 3, title: "كيف يصنع السوق مناطق سيولة كاذبة لخداعك؟ افهم ERL و IRL بوضوح | الدرس 3", url: "sRBlms-TcMM" },
                { id: 4, title: "هل تغير هيكل السوق يعني فرصة ربح؟ تعرف على MSS و BMS بوضوح | الدرس 4", url: "p-tI_Opbstk" },
                { id: 5, title: "كيف تستخدم فيبوناتشي و OTE لتحديد أفضل نقاط الدخول والخروج | الدرس 5", url: "Hd4ogoQabuA" },
                { id: 6, title: "شرح مختلف يخليك تفهم السوق من جذوره | الدرس FVG. 6", url: "j-z1_kvtS4M" },
                { id: 7, title: "كيف تكتشف الفجوات غير المتوازنة وتتفوق على IFVG السوق | الدرس 7", url: "L897X5SrnaE" },
                { id: 8, title: "سر اختيار أفضل نقاط الانعكاس في السوق | BPR FVG الدرس 8", url: "VFsQ9mNebNk" },
                { id: 9, title: "أداة سرية يستخدمها الحيتان لدخول السوق! | شرح اختلال الحجم (Volume Imbalance) بأسلوب ICT | الدرس 9", url: "rWx1zIaPhAw" },
                { id: 10, title: "كيف تكتشف الكسر الحقيقي في السوق؟ | شرح BSG خطوة بخطوة | بأسلوب ICT | الدرس 10", url: "Uws5QjN2Dr4" },
                { id: 11, title: "شرح جميع أنواع الـ FVG في استراتيجية ICT | دليل شامل للمبتدئين خطوة بخطوة | الدرس 11", url: "ME6rPGFoWbU" },
                { id: 12, title: "عرفت OB؟ بس هل عرفت +OB و -OB؟ الفروقات المهمة اللي تغير قراراتك | الدرس 12", url: "2hGENxNVCDc" },
                { id: 13, title: "ما حد علمك الـ BB بهالطريقة.... الفرصة بيدك! | الدرس 13", url: "x0OgWDaPhtc" },
                { id: 14, title: "اكتشف سر الـ Rejection Block قبل ما يتحرك السوق | الدرس 14", url: "GCaYsTLRs04" },
                { id: 15, title: "ختام كورس أساس ICT | اكتشف قوة SETAB + A | الدرس 15", url: "kD8Xs6qzgYc" }
            ],
            level: "متقدم",
            telegramChannel: "https://t.me/mos_rar",
            telegramAccount: "https://t.me/rar42rar",
            note: "ملاحظة: هذا الكورس مجاني 100% وتم وضعه في خانة البروميوم لتجربة ميزات البروميوم فقط، وتم نشر أكواد مجانية حتى تستطيع استخدام البروميوم بشكل مفتوح."
        }
    ]
};

// متغيرات المشغل
let currentVideoCourse = null;
let currentVideoIndex = 0;

// ====== نظام التخزين ======

// تهيئة التخزين
function initializeStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('messages')) {
        localStorage.setItem('messages', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('premiumCodes')) {
        localStorage.setItem('premiumCodes', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('bannedEmails')) {
        localStorage.setItem('bannedEmails', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('appTheme')) {
        localStorage.setItem('appTheme', 'dark');
    }
    
    // تحميل الثيم
    const theme = localStorage.getItem('appTheme');
    if (theme === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        document.querySelector('.theme-toggle i').className = 'fas fa-sun';
    }
}

// حفظ المستخدمين
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// جلب المستخدمين
function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

// حفظ الرسائل
function saveMessages(messages) {
    localStorage.setItem('messages', JSON.stringify(messages));
}

// جلب الرسائل
function getMessages() {
    return JSON.parse(localStorage.getItem('messages')) || [];
}

// حفظ الأكواد
function savePremiumCodes(codes) {
    localStorage.setItem('premiumCodes', JSON.stringify(codes));
}

// جلب الأكواد
function getPremiumCodes() {
    return JSON.parse(localStorage.getItem('premiumCodes')) || [];
}

// حفظ الإيميلات المحظورة
function saveBannedEmails(emails) {
    localStorage.setItem('bannedEmails', JSON.stringify(emails));
}

// جلب الإيميلات المحظورة
function getBannedEmails() {
    return JSON.parse(localStorage.getItem('bannedEmails')) || [];
}

// حفظ الثيم
function saveTheme(theme) {
    localStorage.setItem('appTheme', theme);
}

// ====== إدارة المستخدم ======

// تسجيل الدخول
function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showAlert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    // التحقق من الحظر
    const bannedEmails = getBannedEmails();
    if (bannedEmails.includes(email)) {
        showAlert('حظر', 'تم حظر هذا الحساب من قبل الإدارة');
        return;
    }
    
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // تسجيل الدخول الناجح
        currentUser = user;
        isLoggedIn = true;
        
        // حفظ حالة تسجيل الدخول
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // إخفاء شاشة المصادقة وإظهار التطبيق
        document.getElementById('authScreen').classList.remove('active');
        document.getElementById('appScreen').classList.add('active');
        
        // تحميل البيانات
        loadUserData();
        navigateTo('home');
        
        showAlert('نجاح', `مرحباً بعودتك، ${user.name}!`);
    } else {
        showAlert('خطأ', 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
}

// إنشاء حساب
function register() {
    const name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    
    // التحقق من المدخلات
    if (!name || !username || !email || !password) {
        showAlert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    // التحقق من صحة اسم المستخدم
    if (!/^[a-zA-Z].{3,}$/.test(username)) {
        showAlert('خطأ', 'اسم المستخدم يجب أن يبدأ بحرف ويتكون من 4 رموز على الأقل');
        return;
    }
    
    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح');
        return;
    }
    
    // التحقق من الحظر
    const bannedEmails = getBannedEmails();
    if (bannedEmails.includes(email)) {
        showAlert('حظر', 'هذا البريد الإلكتروني محظور من قبل الإدارة');
        return;
    }
    
    // التحقق من تكرار البريد الإلكتروني
    const users = getUsers();
    if (users.some(u => u.email === email)) {
        showAlert('خطأ', 'البريد الإلكتروني مستخدم مسبقاً');
        return;
    }
    
    // التحقق من تكرار اسم المستخدم
    if (users.some(u => u.username === username)) {
        showAlert('خطأ', 'اسم المستخدم مستخدم مسبقاً');
        return;
    }
    
    // إنشاء حساب جديد
    const newUser = {
        id: Date.now(),
        name: name,
        username: username,
        email: email,
        password: password,
        avatar: null,
        isPremium: false,
        premiumExpiry: null,
        registeredAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // تسجيل الدخول تلقائي
    currentUser = newUser;
    isLoggedIn = true;
    
    // حفظ حالة تسجيل الدخول
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    // إخفاء شاشة المصادقة وإظهار التطبيق
    document.getElementById('authScreen').classList.remove('active');
    document.getElementById('appScreen').classList.add('active');
    
    // تحميل البيانات
    loadUserData();
    navigateTo('home');
    
    showAlert('نجاح', `تم إنشاء حسابك بنجاح، ${name}!`);
}

// تسجيل الخروج
function logout() {
    showConfirm('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', () => {
        currentUser = null;
        isLoggedIn = false;
        localStorage.removeItem('currentUser');
        
        document.getElementById('appScreen').classList.remove('active');
        document.getElementById('authScreen').classList.add('active');
        
        // إعادة تعليمات النموذج
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        switchAuthTab('login');
        
        showAlert('تم', 'تم تسجيل الخروج بنجاح');
    });
}

// تحميل بيانات المستخدم
function loadUserData() {
    if (!currentUser) return;
    
    // تحديث القائمة الجانبية
    document.getElementById('sideName').textContent = currentUser.name;
    document.getElementById('sideUsername').textContent = `@${currentUser.username}`;
    
    const sideBadge = document.getElementById('sideBadge');
    sideBadge.textContent = currentUser.isPremium ? 'Premium' : 'عادي';
    sideBadge.classList.toggle('premium', currentUser.isPremium);
    
    // تحديث صورة الحساب
    const sideAvatar = document.getElementById('sideAvatar');
    if (currentUser.avatar) {
        sideAvatar.innerHTML = `<img src="${currentUser.avatar}" alt="صورة المستخدم">`;
    } else {
        sideAvatar.innerHTML = '<i class="fas fa-user"></i>';
    }
    
    // تحديث صفحة الحساب
    if (currentPage === 'account') {
        renderAccountPage();
    }
}

// حفظ بيانات المستخدم
function saveUserData() {
    if (!currentUser) return;
    
    const users = getUsers();
    const index = users.findIndex(u => u.id === currentUser.id);
    
    if (index !== -1) {
        users[index] = currentUser;
        saveUsers(users);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

// ====== إدارة الواجهة ======

// تبديل تبويبات المصادقة
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelector('.auth-tab:nth-child(1)').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelector('.auth-tab:nth-child(2)').classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

// تبديل القائمة الجانبية
function toggleSideMenu() {
    document.getElementById('sideMenu').classList.toggle('active');
}

// التنقل بين الصفحات
function navigateTo(page, fromHistory = false) {
    // إضافة الصفحة الحالية للتاريخ
    if (!fromHistory && currentPage !== page) {
        pageHistory.push(currentPage);
    }
    
    currentPage = page;
    
    // إظهار/إخفاء زر الرجوع
    const backBtn = document.querySelector('.back-btn');
    if (pageHistory.length > 0 && page !== 'home') {
        backBtn.classList.add('active');
    } else {
        backBtn.classList.remove('active');
    }
    
    // تحديث الشريط السفلي
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (page === 'account') {
        document.querySelector('.nav-item:nth-child(1)').classList.add('active');
    } else if (page === 'home') {
        document.querySelector('.nav-item:nth-child(2)').classList.add('active');
    } else if (page === 'courses') {
        document.querySelector('.nav-item:nth-child(3)').classList.add('active');
    } else if (page === 'premium') {
        document.querySelector('.nav-item:nth-child(4)').classList.add('active');
    } else if (page === 'tools') {
        document.querySelector('.nav-item:nth-child(5)').classList.add('active');
    }
    
    // إغلاق القائمة الجانبية
    document.getElementById('sideMenu').classList.remove('active');
    
    // تحميل المحتوى
    loadPageContent(page);
}

// الرجوع للصفحة السابقة
function goBack() {
    if (pageHistory.length > 0) {
        const prevPage = pageHistory.pop();
        navigateTo(prevPage, true);
    }
}

// تحميل محتوى الصفحة
function loadPageContent(page) {
    const mainContent = document.getElementById('mainContent');
    
    switch (page) {
        case 'account':
            renderAccountPage();
            break;
        case 'home':
            renderHomePage();
            break;
        case 'courses':
            renderCoursesPage();
            break;
        case 'premium':
            renderPremiumPage();
            break;
        case 'tools':
            renderToolsPage();
            break;
        default:
            renderHomePage();
    }
}

// ====== عرض الصفحات ======

// صفحة الحساب
function renderAccountPage() {
    if (!currentUser) {
        showAlert('خطأ', 'يرجى تسجيل الدخول أولاً');
        navigateTo('home');
        return;
    }
    
    const isPremium = currentUser.isPremium;
    const premiumText = isPremium ? 
        `مميز - ينتهي في ${new Date(currentUser.premiumExpiry).toLocaleDateString('ar-SA')}` : 
        'عادي';
    
    const html = `
        <div class="page-header">
            <h2 class="page-title">الحساب الشخصي</h2>
            <p class="page-subtitle">إدارة بياناتك واشتراكاتك</p>
        </div>
        
        <div class="account-container">
            <div class="account-header">
                <div class="account-avatar">
                    <div class="avatar-img" id="accountAvatarImg">
                        ${currentUser.avatar ? 
                            `<img src="${currentUser.avatar}" alt="صورة المستخدم">` : 
                            `<i class="fas fa-user"></i>`
                        }
                    </div>
                    <div class="avatar-upload" onclick="openChangeAvatarModal()">
                        <i class="fas fa-camera"></i>
                    </div>
                </div>
                <div class="account-details">
                    <h3 class="account-name">${currentUser.name}</h3>
                    <p class="account-username">@${currentUser.username}</p>
                    <div class="account-status">
                        <span class="status-dot ${isPremium ? 'premium' : ''}"></span>
                        <span class="status-text">${premiumText}</span>
                    </div>
                </div>
            </div>
            
            <div class="account-actions">
                <button class="action-btn" onclick="openEditProfileModal()">
                    <span>تعديل البيانات الشخصية</span>
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="openChangePasswordModal()">
                    <span>تغيير كلمة المرور</span>
                    <i class="fas fa-key"></i>
                </button>
                <button class="action-btn" onclick="activatePremiumModal()">
                    <span>تفعيل الاشتراك المميز</span>
                    <i class="fas fa-crown"></i>
                </button>
                <button class="action-btn" onclick="logout()">
                    <span>تسجيل الخروج</span>
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = html;
}

// صفحة الرئيسية
function renderHomePage() {
    const html = `
        <div class="page-header">
            <h2 class="page-title">اكزم لتداول</h2>
            <p class="page-subtitle">منصة تعليم التداول الاحترافية</p>
        </div>
        
        <div class="home-grid">
            <div class="home-card" onclick="navigateTo('courses')">
                <i class="fas fa-graduation-cap"></i>
                <h3>الدورات التعليمية</h3>
                <p>استعرض أفضل الدورات المجانية لتعلم التداول من الصفر للاحتراف</p>
            </div>
            
            <div class="home-card" onclick="navigateTo('tools')">
                <i class="fas fa-calculator"></i>
                <h3>أدوات التداول</h3>
                <p>استخدم أدوات تداول عملية مثل حاسبة فيبوناتشي وإدارة رأس المال</p>
            </div>
            
            <div class="home-card" onclick="openSupport()">
                <i class="fas fa-headset"></i>
                <h3>الدعم الفني</h3>
                <p>فريق دعم متاح لمساعدتك في أي استفسار أو مشكلة تواجهك</p>
            </div>
            
            <div class="home-card journey-card" onclick="navigateTo('courses')">
                <i class="fas fa-rocket"></i>
                <h3>ابدأ رحلتك التعليمية</h3>
                <p>استعرض الدورات المجانية وابدأ رحلتك في تعلم التداول الآن</p>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = html;
}

// صفحة الدورات
function renderCoursesPage() {
    const html = `
        <div class="page-header">
            <h2 class="page-title">الدورات التعليمية</h2>
            <p class="page-subtitle">دورات مجانية متكاملة لتعلم التداول</p>
        </div>
        
        <div class="courses-list">
            ${courses.free.map(course => `
                <div class="course-card">
                    <div class="course-header">
                        <h3 class="course-title">${course.title}</h3>
                        <p class="course-instructor">
                            <i class="fas fa-chalkboard-teacher"></i>
                            ${course.instructor}
                        </p>
                    </div>
                    <div class="course-body">
                        <p class="course-description">${course.description}</p>
                        <div class="course-footer">
                            <div class="course-meta">
                                <span class="meta-item">
                                    <i class="fas fa-video"></i>
                                    ${course.videos.length} فيديو
                                </span>
                                <span class="meta-item">
                                    <i class="fas fa-chart-line"></i>
                                    ${course.level}
                                </span>
                            </div>
                            <div class="course-actions">
                                <button class="course-btn" onclick="showCourseInfo(${course.id})">
                                    <i class="fas fa-info-circle"></i>
                                    معلومات
                                </button>
                                <button class="course-btn primary" onclick="startCourse(${course.id})">
                                    <i class="fas fa-play"></i>
                                    مشاهدة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = html;
}

// صفحة المتقدمين
function renderPremiumPage() {
    const course = courses.premium[0];
    const canAccess = currentUser && currentUser.isPremium;
    
    const html = `
        <div class="page-header">
            <h2 class="page-title">قسم المتقدمين</h2>
            <p class="page-subtitle">دورات حصرية تتطلب تفعيل الاشتراك المميز</p>
        </div>
        
        <div class="premium-container">
            <div class="premium-header">
                <div class="premium-icon">
                    <i class="fas fa-crown"></i>
                </div>
                <h2 class="premium-title">الاشتراك المميز</h2>
                <p class="premium-subtitle">شاهد دورات حصرية بأعلى جودة</p>
            </div>
            
            <div class="premium-card">
                <h3 class="premium-card-title">${course.title}</h3>
                <p class="premium-card-instructor">
                    <i class="fas fa-chalkboard-teacher"></i>
                    ${course.instructor}
                </p>
                <p class="premium-card-description">${course.description}</p>
                
                ${canAccess ? `
                    <button class="premium-activate-btn" onclick="startPremiumCourse()">
                        <i class="fas fa-play"></i>
                        مشاهدة الدورة الآن
                    </button>
                ` : `
                    <button class="premium-activate-btn" onclick="showActivateModal()">
                        <i class="fas fa-unlock"></i>
                        تفعيل الاشتراك للمشاهدة
                    </button>
                `}
            </div>
            
            <div class="premium-note">
                <p><strong>ملاحظة:</strong> ${course.note}</p>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = html;
}

// صفحة الأدوات
function renderToolsPage() {
    const html = `
        <div class="page-header">
            <h2 class="page-title">أدوات التداول</h2>
            <p class="page-subtitle">أدوات عملية تساعدك في تحليل وتداول أفضل</p>
        </div>
        
        <div class="tools-grid">
            <div class="tool-card" onclick="openFibonacciCalculator()">
                <i class="fas fa-chart-line"></i>
                <h3>حاسبة فيبوناتشي</h3>
                <p>احسب مستويات فيبوناتشي التراجعية للأسعار بسهولة ودقة</p>
            </div>
            
            <div class="tool-card" onclick="openRiskCalculator()">
                <i class="fas fa-shield-alt"></i>
                <h3>إدارة رأس المال</h3>
                <p>احسب حجم الصفقة المناسب بناءً على نسبة المخاطرة ورأس المال</p>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = html;
}

// ====== نافذة تغيير الصورة الشخصية ======
function openChangeAvatarModal() {
    const html = `
        <div class="modal-content small">
            <div class="modal-header">
                <h3>تغيير الصورة الشخصية</h3>
                <button class="close-modal" onclick="closeModal('changeAvatarModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="avatar-options">
                    <p class="modal-text">اختر طريقة تغيير الصورة:</p>
                    <div class="avatar-options-grid">
                        <button class="avatar-option-btn" onclick="selectDefaultAvatar()">
                            <i class="fas fa-user-circle"></i>
                            <span>صورة افتراضية</span>
                        </button>
                        <button class="avatar-option-btn" onclick="uploadAvatarFromDevice()">
                            <i class="fas fa-upload"></i>
                            <span>رفع من الجهاز</span>
                        </button>
                    </div>
                    <div class="avatar-preview" id="avatarPreviewContainer" style="display: none;">
                        <h4>معاينة الصورة:</h4>
                        <div class="preview-img" id="avatarPreview"></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn secondary" onclick="closeModal('changeAvatarModal')">إلغاء</button>
                <button class="modal-btn" onclick="saveNewAvatar()" id="saveAvatarBtn" style="display: none;">حفظ الصورة</button>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'changeAvatarModal';
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

function selectDefaultAvatar() {
    // صورة افتراضية
    const defaultAvatar = 'https://j.top4top.io/p_3670reejg0.png';
    
    document.getElementById('avatarPreviewContainer').style.display = 'block';
    document.getElementById('avatarPreview').innerHTML = `
        <img src="${defaultAvatar}" alt="صورة افتراضية">
    `;
    document.getElementById('saveAvatarBtn').style.display = 'block';
    
    window.selectedAvatarUrl = defaultAvatar;
}

function uploadAvatarFromDevice() {
    // إنشاء عنصر input للصور
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            showAlert('خطأ', 'الرجاء اختيار ملف صورة فقط');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB حد أقصى
            showAlert('خطأ', 'حجم الصورة كبير جداً (الحد الأقصى 5MB)');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatarPreviewContainer').style.display = 'block';
            document.getElementById('avatarPreview').innerHTML = `
                <img src="${e.target.result}" alt="صورة جديدة">
            `;
            document.getElementById('saveAvatarBtn').style.display = 'block';
            
            window.selectedAvatarUrl = e.target.result;
        };
        reader.readAsDataURL(file);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

function saveNewAvatar() {
    if (!window.selectedAvatarUrl) {
        showAlert('خطأ', 'الرجاء اختيار صورة أولاً');
        return;
    }
    
    if (!currentUser) return;
    
    currentUser.avatar = window.selectedAvatarUrl;
    saveUserData();
    loadUserData();
    
    // إغلاق النافذة
    const modal = document.getElementById('changeAvatarModal');
    if (modal) {
        modal.remove();
    }
    
    showAlert('نجاح', 'تم تغيير الصورة الشخصية بنجاح');
    window.selectedAvatarUrl = null;
}

// ====== نافذة تعديل البيانات الشخصية ======
function openEditProfileModal() {
    if (!currentUser) return;
    
    const html = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>تعديل البيانات الشخصية</h3>
                <button class="close-modal" onclick="closeModal('editProfileModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="edit-form">
                    <div class="input-group">
                        <label for="editName">الاسم الكامل</label>
                        <input type="text" id="editName" value="${currentUser.name}" placeholder="أدخل الاسم الكامل">
                    </div>
                    
                    <div class="input-group">
                        <label for="editUsername">اسم المستخدم</label>
                        <input type="text" id="editUsername" value="${currentUser.username}" placeholder="أدخل اسم المستخدم">
                        <small class="input-hint">يبدأ بحرف، 4 رموز على الأقل</small>
                    </div>
                    
                    <div class="input-group">
                        <label for="editEmail">البريد الإلكتروني</label>
                        <input type="email" id="editEmail" value="${currentUser.email}" placeholder="أدخل البريد الإلكتروني" disabled>
                        <small class="input-hint">لا يمكن تغيير البريد الإلكتروني</small>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn secondary" onclick="closeModal('editProfileModal')">إلغاء</button>
                <button class="modal-btn" onclick="saveProfileChanges()">حفظ التغييرات</button>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'editProfileModal';
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

function saveProfileChanges() {
    if (!currentUser) return;
    
    const newName = document.getElementById('editName').value.trim();
    const newUsername = document.getElementById('editUsername').value.trim();
    
    if (!newName || !newUsername) {
        showAlert('خطأ', 'الرجاء ملء جميع الحقول المطلوبة');
        return;
    }
    
    // التحقق من صحة اسم المستخدم
    if (!/^[a-zA-Z].{3,}$/.test(newUsername)) {
        showAlert('خطأ', 'اسم المستخدم يجب أن يبدأ بحرف ويتكون من 4 رموز على الأقل');
        return;
    }
    
    // التحقق من تكرار اسم المستخدم
    if (newUsername !== currentUser.username) {
        const users = getUsers();
        if (users.some(u => u.id !== currentUser.id && u.username === newUsername)) {
            showAlert('خطأ', 'اسم المستخدم مستخدم مسبقاً');
            return;
        }
    }
    
    currentUser.name = newName;
    currentUser.username = newUsername;
    saveUserData();
    loadUserData();
    
    // إغلاق النافذة
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.remove();
    }
    
    showAlert('نجاح', 'تم تحديث البيانات الشخصية بنجاح');
}

// ====== نافذة تغيير كلمة المرور ======
function openChangePasswordModal() {
    if (!currentUser) return;
    
    const html = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>تغيير كلمة المرور</h3>
                <button class="close-modal" onclick="closeModal('changePasswordModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="password-form">
                    <div class="input-group">
                        <label for="currentPassword">كلمة المرور الحالية</label>
                        <input type="password" id="currentPassword" placeholder="أدخل كلمة المرور الحالية">
                    </div>
                    
                    <div class="input-group">
                        <label for="newPassword">كلمة المرور الجديدة</label>
                        <input type="password" id="newPassword" placeholder="أدخل كلمة المرور الجديدة">
                        <small class="input-hint">يجب أن تكون 6 أحرف على الأقل</small>
                    </div>
                    
                    <div class="input-group">
                        <label for="confirmPassword">تأكيد كلمة المرور الجديدة</label>
                        <input type="password" id="confirmPassword" placeholder="أكد كلمة المرور الجديدة">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn secondary" onclick="closeModal('changePasswordModal')">إلغاء</button>
                <button class="modal-btn" onclick="saveNewPassword()">تغيير كلمة المرور</button>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'changePasswordModal';
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

function saveNewPassword() {
    if (!currentUser) return;
    
    const currentPass = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    
    if (!currentPass || !newPass || !confirmPass) {
        showAlert('خطأ', 'الرجاء ملء جميع الحقول المطلوبة');
        return;
    }
    
    if (currentPass !== currentUser.password) {
        showAlert('خطأ', 'كلمة المرور الحالية غير صحيحة');
        return;
    }
    
    if (newPass.length < 6) {
        showAlert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }
    
    if (newPass !== confirmPass) {
        showAlert('خطأ', 'كلمات المرور غير متطابقة');
        return;
    }
    
    currentUser.password = newPass;
    saveUserData();
    
    // إغلاق النافذة
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.remove();
    }
    
    showAlert('نجاح', 'تم تغيير كلمة المرور بنجاح');
}

// ====== إدارة الدورات ======

// عرض معلومات الكورس
function showCourseInfo(courseId) {
    let course;
    
    // البحث في الدورات المجانية
    course = courses.free.find(c => c.id === courseId);
    
    // إذا لم يكن موجوداً في المجانية، ابحث في المميزة
    if (!course) {
        course = courses.premium.find(c => c.id === courseId);
    }
    
    if (!course) return;
    
    document.getElementById('courseInfoTitle').textContent = `معلومات عن: ${course.title}`;
    document.getElementById('courseInfoInstructor').textContent = course.instructor;
    document.getElementById('courseInfoVideos').textContent = course.videos.length;
    document.getElementById('courseInfoLevel').textContent = course.level;
    
    // تعيين روابط التلجرام
    const channelLink = document.getElementById('courseTelegramChannel');
    const accountLink = document.getElementById('courseTelegramAccount');
    
    channelLink.href = course.telegramChannel;
    channelLink.querySelector('span').textContent = 'قناة تلجرام';
    
    if (course.telegramAccount) {
        accountLink.href = course.telegramAccount;
        accountLink.querySelector('span').textContent = 'حساب تلجرام';
        accountLink.style.display = 'flex';
    } else {
        accountLink.style.display = 'none';
    }
    
    openModal('courseInfoModal');
}

// بدء مشاهدة الكورس
function startCourse(courseId) {
    const course = courses.free.find(c => c.id === courseId);
    if (!course) return;
    
    currentVideoCourse = course;
    currentVideoIndex = 0;
    openVideoPlayer();
}

// بدء مشاهدة الكورس المميز
function startPremiumCourse() {
    if (!currentUser || !currentUser.isPremium) {
        showAlert('خطأ', 'يجب تفعيل الاشتراك المميز أولاً');
        showActivateModal();
        return;
    }
    
    const course = courses.premium[0];
    if (!course) return;
    
    currentVideoCourse = course;
    currentVideoIndex = 0;
    openVideoPlayer();
}

// ====== مشغل الفيديو ======

// فتح مشغل الفيديو
function openVideoPlayer() {
    if (!currentVideoCourse || currentVideoCourse.videos.length === 0) return;
    
    document.getElementById('videoPlayer').classList.add('active');
    document.getElementById('videoTitle').textContent = currentVideoCourse.title;
    playCurrentVideo();
}

// إغلاق مشغل الفيديو
function closeVideoPlayer() {
    document.getElementById('videoPlayer').classList.remove('active');
    currentVideoCourse = null;
    currentVideoIndex = 0;
}

// تشغيل الفيديو الحالي
function playCurrentVideo() {
    if (!currentVideoCourse || !currentVideoCourse.videos[currentVideoIndex]) return;
    
    const video = currentVideoCourse.videos[currentVideoIndex];
    const videoUrl = `https://www.youtube.com/embed/${video.url}?autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0`;
    
    document.getElementById('videoFrame').src = videoUrl;
    document.getElementById('currentVideoInfo').textContent = 
        `${video.title} (${currentVideoIndex + 1} من ${currentVideoCourse.videos.length})`;
}

// الفيديو التالي
function nextVideo() {
    if (!currentVideoCourse) return;
    
    if (currentVideoIndex < currentVideoCourse.videos.length - 1) {
        currentVideoIndex++;
        playCurrentVideo();
    } else {
        showAlert('معلومة', 'هذا آخر فيديو في الدورة');
    }
}

// الفيديو السابق
function prevVideo() {
    if (!currentVideoCourse) return;
    
    if (currentVideoIndex > 0) {
        currentVideoIndex--;
        playCurrentVideo();
    } else {
        showAlert('معلومة', 'هذا أول فيديو في الدورة');
    }
}

// ====== إدارة البروميوم ======

// عرض نافذة تفعيل الكود
function showActivateModal() {
    if (!currentUser) {
        showAlert('خطأ', 'يجب تسجيل الدخول أولاً');
        navigateTo('account');
        return;
    }
    
    document.getElementById('activationCode').value = '';
    openModal('activateModal');
}

// تفعيل الكود
function activatePremium() {
    const code = document.getElementById('activationCode').value.trim();
    
    if (!code) {
        showAlert('خطأ', 'يرجى إدخال كود التفعيل');
        return;
    }
    
    // التحقق من صحة الكود
    const codes = getPremiumCodes();
    const codeObj = codes.find(c => c.code === code && !c.used);
    
    if (!codeObj) {
        showAlert('خطأ', 'كود التفعيل غير صالح أو مستخدم مسبقاً');
        return;
    }
    
    // تفعيل البروميوم للمستخدم
    currentUser.isPremium = true;
    currentUser.premiumExpiry = codeObj.expiry;
    
    // تحديث حالة الكود
    codeObj.used = true;
    codeObj.usedBy = currentUser.id;
    codeObj.usedAt = new Date().toISOString();
    
    savePremiumCodes(codes);
    saveUserData();
    
    closeModal('activateModal');
    showAlert('نجاح', 'تم تفعيل الاشتراك المميز بنجاح!');
    
    // تحديث الواجهة
    loadUserData();
    
    // إذا كان في صفحة المتقدمين، إعادة تحميلها
    if (currentPage === 'premium') {
        renderPremiumPage();
    }
}

// ====== الأدوات ======

// فتح حاسبة فيبوناتشي
function openFibonacciCalculator() {
    document.getElementById('fibLow').value = '';
    document.getElementById('fibHigh').value = '';
    document.getElementById('fibonacciResults').innerHTML = '';
    
    // تعيين الاتجاه الافتراضي
    setFibonacciDirection('lowToHigh');
    
    openModal('fibonacciModal');
}

// تعيين اتجاه حاسبة فيبوناتشي
function setFibonacciDirection(direction) {
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
    
    if (direction === 'lowToHigh') {
        document.querySelector('.option-btn:nth-child(1)').classList.add('active');
        document.querySelector('label[for="fibLow"]').textContent = 'القاع (Low)';
        document.querySelector('label[for="fibHigh"]').textContent = 'القمة (High)';
    } else {
        document.querySelector('.option-btn:nth-child(2)').classList.add('active');
        document.querySelector('label[for="fibLow"]').textContent = 'القمة (High)';
        document.querySelector('label[for="fibHigh"]').textContent = 'القاع (Low)';
    }
}

// حساب مستويات فيبوناتشي
function calculateFibonacci() {
    const low = parseFloat(document.getElementById('fibLow').value);
    const high = parseFloat(document.getElementById('fibHigh').value);
    
    if (isNaN(low) || isNaN(high)) {
        showAlert('خطأ', 'يرجى إدخال قيم صحيحة للقاع والقمة');
        return;
    }
    
    if (low === high) {
        showAlert('خطأ', 'القاع والقمة يجب أن يكونا قيمتين مختلفتين');
        return;
    }
    
    const isLowToHigh = document.querySelector('.option-btn:nth-child(1)').classList.contains('active');
    const start = isLowToHigh ? low : high;
    const end = isLowToHigh ? high : low;
    const difference = end - start;
    
    // مستويات فيبوناتشي الشائعة
    const levels = [
        { level: '0.0%', value: start },
        { level: '23.6%', value: start + difference * 0.236 },
        { level: '38.2%', value: start + difference * 0.382 },
        { level: '50.0%', value: start + difference * 0.5 },
        { level: '61.8%', value: start + difference * 0.618 },
        { level: '78.6%', value: start + difference * 0.786 },
        { level: '100.0%', value: end }
    ];
    
    let resultsHtml = '';
    levels.forEach(level => {
        resultsHtml += `
            <div class="result-item">
                <div class="result-level">${level.level}</div>
                <div class="result-value">${level.value.toFixed(4)}</div>
            </div>
        `;
    });
    
    document.getElementById('fibonacciResults').innerHTML = resultsHtml;
}

// فتح حاسبة إدارة رأس المال
function openRiskCalculator() {
    document.getElementById('capitalAmount').value = '';
    document.getElementById('riskPercentage').value = '2';
    document.getElementById('entryPrice').value = '';
    document.getElementById('stopLoss').value = '';
    document.getElementById('riskResults').innerHTML = '';
    
    openModal('riskModal');
}

// حساب إدارة رأس المال
function calculateRisk() {
    const capital = parseFloat(document.getElementById('capitalAmount').value);
    const riskPercent = parseFloat(document.getElementById('riskPercentage').value);
    const entry = parseFloat(document.getElementById('entryPrice').value);
    const stopLoss = parseFloat(document.getElementById('stopLoss').value);
    
    if (isNaN(capital) || capital <= 0) {
        showAlert('خطأ', 'يرجى إدخال رأس مال صحيح');
        return;
    }
    
    if (isNaN(riskPercent) || riskPercent <= 0 || riskPercent > 100) {
        showAlert('خطأ', 'نسبة المخاطرة يجب أن تكون بين 0.1% و 100%');
        return;
    }
    
    const riskAmount = capital * (riskPercent / 100);
    
    let resultsHtml = '';
    
    if (!isNaN(entry) && !isNaN(stopLoss) && entry > 0 && stopLoss > 0) {
        const riskPerUnit = Math.abs(entry - stopLoss);
        
        if (riskPerUnit === 0) {
            showAlert('خطأ', 'سعر الدخول وسعر وقف الخسارة يجب أن يكونا مختلفين');
            return;
        }
        
        const positionSize = riskAmount / riskPerUnit;
        
        resultsHtml = `
            <div class="result-row">
                <span class="result-label">رأس المال:</span>
                <span class="result-amount">$${capital.toFixed(2)}</span>
            </div>
            <div class="result-row">
                <span class="result-label">نسبة المخاطرة:</span>
                <span class="result-amount">${riskPercent}%</span>
            </div>
            <div class="result-row">
                <span class="result-label">مبلغ المخاطرة:</span>
                <span class="result-amount">$${riskAmount.toFixed(2)}</span>
            </div>
            <div class="result-row">
                <span class="result-label">المخاطرة لكل وحدة:</span>
                <span class="result-amount">$${riskPerUnit.toFixed(4)}</span>
            </div>
            <div class="result-row">
                <span class="result-label">حجم الصفقة:</span>
                <span class="result-amount">${positionSize.toFixed(2)} وحدة</span>
            </div>
        `;
    } else {
        resultsHtml = `
            <div class="result-row">
                <span class="result-label">رأس المال:</span>
                <span class="result-amount">$${capital.toFixed(2)}</span>
            </div>
            <div class="result-row">
                <span class="result-label">نسبة المخاطرة:</span>
                <span class="result-amount">${riskPercent}%</span>
            </div>
            <div class="result-row">
                <span class="result-label">مبلغ المخاطرة:</span>
                <span class="result-amount">$${riskAmount.toFixed(2)}</span>
            </div>
            <div class="result-row">
                <span class="result-label">حجم الصفقة:</span>
                <span class="result-amount">أدخل سعر الدخول والستوب لحساب الحجم</span>
            </div>
        `;
    }
    
    document.getElementById('riskResults').innerHTML = resultsHtml;
    document.getElementById('riskLossAmount').textContent = riskAmount.toFixed(2);
    document.getElementById('riskLossPercent').textContent = riskPercent.toFixed(1);
}

// ====== الدعم الفني ======

// فتح الدعم الفني
function openSupport() {
    if (!currentUser) {
        showAlert('خطأ', 'يجب تسجيل الدخول أولاً');
        navigateTo('account');
        return;
    }
    
    const messages = getMessages();
    const userMessages = messages.filter(msg => msg.userId === currentUser.id);
    
    let chatHtml = '';
    userMessages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString('ar-SA', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        chatHtml += `
            <div class="message ${msg.type}">
                <p>${msg.text}</p>
                <small class="message-time">${time}</small>
            </div>
        `;
    });
    
    if (chatHtml === '') {
        chatHtml = `
            <div class="no-messages">
                <p>لا توجد رسائل بعد. ابدأ محادثة مع الدعم الفني.</p>
            </div>
        `;
    }
    
    document.getElementById('supportChat').innerHTML = chatHtml;
    openModal('supportModal');
    
    // تمرير للأسفل لرؤية آخر رسالة
    setTimeout(() => {
        const chatContainer = document.getElementById('supportChat');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
}

// إرسال رسالة دعم
function sendSupportMessage() {
    const input = document.getElementById('supportMessage');
    const message = input.value.trim();
    
    if (!message) {
        showAlert('خطأ', 'يرجى كتابة رسالة');
        return;
    }
    
    if (!currentUser) {
        showAlert('خطأ', 'يجب تسجيل الدخول أولاً');
        return;
    }
    
    const messages = getMessages();
    const newMessage = {
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.name,
        text: message,
        type: 'sent',
        timestamp: new Date().toISOString(),
        read: false
    };
    
    messages.push(newMessage);
    saveMessages(messages);
    
    // إضافة الرسالة للدردشة
    const time = new Date().toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const chatHtml = `
        <div class="message sent">
            <p>${message}</p>
            <small class="message-time">${time}</small>
        </div>
    `;
    
    document.getElementById('supportChat').innerHTML += chatHtml;
    input.value = '';
    
    // تمرير للأسفل لرؤية آخر رسالة
    setTimeout(() => {
        const chatContainer = document.getElementById('supportChat');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
    
    // رسالة رد تلقائية (محاكاة)
    setTimeout(() => {
        const autoReply = {
            id: Date.now() + 1,
            userId: currentUser.id,
            userName: 'الدعم الفني',
            text: 'شكراً لتواصلك معنا. سيقوم أحد ممثلي الدعم بالرد عليك قريباً.',
            type: 'received',
            timestamp: new Date().toISOString(),
            read: false
        };
        
        messages.push(autoReply);
        saveMessages(messages);
        
        const replyTime = new Date().toLocaleTimeString('ar-SA', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const replyHtml = `
            <div class="message received">
                <p>${autoReply.text}</p>
                <small class="message-time">${replyTime}</small>
            </div>
        `;
        
        document.getElementById('supportChat').innerHTML += replyHtml;
        
        // تحديث عداد الرسائل
        updateMessageBadge();
        
        // تمرير للأسفل
        setTimeout(() => {
            const chatContainer = document.getElementById('supportChat');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
    }, 2000);
}

// تحديث عداد الرسائل
function updateMessageBadge() {
    if (!currentUser) return;
    
    const messages = getMessages();
    const unreadCount = messages.filter(msg => 
        msg.userId === currentUser.id && 
        msg.type === 'received' && 
        !msg.read
    ).length;
    
    document.getElementById('messageBadge').textContent = unreadCount > 0 ? unreadCount : '0';
    document.getElementById('messageBadge').style.display = unreadCount > 0 ? 'flex' : 'none';
}

// ====== سياسة الخصوصية ومن نحن ======

// عرض سياسة الخصوصية
function showPrivacyPolicy() {
    openModal('privacyModal');
}

// عرض من نحن
function showAboutUs() {
    openModal('aboutModal');
}

// ====== إدارة الثيم ======

// تبديل الثيم
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-toggle i');
    
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themeIcon.className = 'fas fa-sun';
        saveTheme('light');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeIcon.className = 'fas fa-moon';
        saveTheme('dark');
    }
}

// ====== إدارة النوافذ ======

// فتح نافذة
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

// إغلاق نافذة
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// عرض رسالة تأكيد
function showConfirm(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    
    window.confirmAction = callback;
    openModal('confirmModal');
}

// تنفيذ إجراء التأكيد
function confirmAction() {
    if (window.confirmAction) {
        window.confirmAction();
    }
    closeModal('confirmModal');
}

// عرض رسالة تنبيه
function showAlert(title, message) {
    document.getElementById('alertTitle').textContent = title;
    document.getElementById('alertMessage').textContent = message;
    openModal('alertModal');
}

// ====== التهيئة ======

// تهيئة التطبيق
function initializeApp() {
    // إخفاء شاشة التحميل
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        
        // تهيئة التخزين
        initializeStorage();
        
        // التحقق من تسجيل الدخول السابق
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
                isLoggedIn = true;
                
                document.getElementById('authScreen').classList.remove('active');
                document.getElementById('appScreen').classList.add('active');
                
                loadUserData();
                navigateTo('home');
                
                // تحديث عداد الرسائل
                updateMessageBadge();
            } catch (e) {
                console.error('خطأ في تحميل بيانات المستخدم:', e);
                localStorage.removeItem('currentUser');
            }
        }
    }, 1500);
    
    // إضافة مستخدم الإدمن الافتراضي (إذا لم يكن موجوداً)
    setTimeout(() => {
        const users = getUsers();
        const adminExists = users.some(u => u.email === 'mstrhmd2005@gmail.com');
        
        if (!adminExists) {
            const adminUser = {
                id: 1,
                name: 'الإدارة',
                username: 'admin',
                email: 'mstrhmd2005@gmail.com',
                password: 'T1O2K3abot$',
                avatar: null,
                isPremium: true,
                premiumExpiry: new Date('2030-01-01').toISOString(),
                registeredAt: new Date().toISOString(),
                isAdmin: true
            };
            
            users.push(adminUser);
            saveUsers(users);
            
            // إضافة بعض الأكواد الافتراضية
            const codes = getPremiumCodes();
            if (codes.length === 0) {
                const defaultCodes = [
                    {
                        code: 'PREMIUM123',
                        duration: 'month',
                        expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        used: false,
                        createdBy: 'admin',
                        createdAt: new Date().toISOString()
                    },
                    {
                        code: 'GOLD456',
                        duration: 'year',
                        expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                        used: false,
                        createdBy: 'admin',
                        createdAt: new Date().toISOString()
                    }
                ];
                
                savePremiumCodes(defaultCodes);
            }
        }
    }, 2000);
}

// بدء التطبيق
window.addEventListener('DOMContentLoaded', initializeApp);

// إغلاق النوافذ بالضغط خارجها
window.addEventListener('click', (e) => {
    const modals = document.querySelectorAll('.modal.active');
    modals.forEach(modal => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // إغلاق القائمة الجانبية بالضغط خارجها
    const sideMenu = document.getElementById('sideMenu');
    if (sideMenu.classList.contains('active') && 
        !e.target.closest('.side-menu') && 
        !e.target.closest('.menu-toggle')) {
        sideMenu.classList.remove('active');
    }
});

// منع الإدخال غير المرغوب فيه
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModals = document.querySelectorAll('.modal.active');
        if (activeModals.length > 0) {
            activeModals.forEach(modal => {
                modal.classList.remove('active');
            });
        } else if (document.getElementById('videoPlayer').classList.contains('active')) {
            closeVideoPlayer();
        } else if (document.getElementById('sideMenu').classList.contains('active')) {
            toggleSideMenu();
        } else if (pageHistory.length > 0) {
            goBack();
        }
    }
});