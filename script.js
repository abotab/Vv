// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAMMS8UccAPP4_4517ehfS2paPYEPJ7nbw",
    authDomain: "tradingchatapp.firebaseapp.com",
    databaseURL: "https://tradingchatapp-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tradingchatapp",
    storageBucket: "tradingchatapp.firebasestorage.app",
    messagingSenderId: "826334456372",
    appId: "1:826334456372:web:4f99b76fe47328d3e4b861",
    measurementId: "G-VFQVMQR80S"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();
const messaging = firebase.messaging();

// حالة التطبيق
let currentUser = null;
let currentPage = 'home';
let pageHistory = [];

// دورات الفيديو
const courses = {
    free: [
        {
            id: 1,
            title: "كورس التداول من صفر الى الاحتراف",
            instructor: "حيدر الجنابي",
            videos: [
                { id: 1, title: "مقدمة الكورس", url: "G8eeqb82KOM" },
                { id: 2, title: "دورة سمارت موني كونسبت", url: "vUeyLqB82CM" },
                { id: 3, title: "الدرس الثالث ترابط الفريمات", url: "CrzVLmflQgQ" }
            ],
            rights: {
                channel: "https://t.me/thesuccessfulwayarabs",
                account: "https://t.me/haideraljanabi90"
            }
        },
        {
            id: 2,
            title: "أفضل دورة لتعلم SMC في الوطن العربي",
            instructor: "الدكتور محمد مهدي",
            videos: [
                { id: 1, title: "مقدمة هامة لدورة SMC", url: "eb2y-Kbd_N8" },
                { id: 2, title: "لماذا المستوي الأول مجاني؟", url: "XSPuivsDNd4" },
                { id: 3, title: "هل علم SMC أفضل علم لتحقيق الارباح؟", url: "cWx_GkB2htE" },
                { id: 4, title: "تأسيس SMC - الشموع اليابانية", url: "pQsk2N8j08I" },
                { id: 5, title: "تأسيس SMC - هيكلية الشموع", url: "C1qDxNJJbbI" },
                { id: 6, title: "تأسيس SMC - الغلبة لمن؟", url: "fH0vP9NNuug" }
            ],
            rights: {
                channel: "https://t.me/Exaado",
                account: "https://t.me/ExaadoSupport"
            }
        },
        {
            id: 3,
            title: "الكورس السداسي في احتراف التحليل الفني",
            instructor: "حيدر تريدنك",
            videos: [
                { id: 1, title: "مقدمة الكورس السداسي", url: "pNLb-3Nrjv0" },
                { id: 2, title: "شرح الشمعه اليابانية بالتفصيل", url: "QEMB6XnoAPU" },
                { id: 3, title: "شرح القمم والقيعان", url: "SC9IA6y0mLo" }
            ],
            rights: {
                channel: "https://t.me/tradaying"
            }
        }
    ],
    premium: {
        id: 4,
        title: "كورس ICT من الصفر للمبتدئين",
        instructor: "محمد سماره",
        videos: [
            { id: 1, title: "الدرس الأول - بعد 4 سنين تداول", url: "B_Cniskclho" },
            { id: 2, title: "الدرس الثاني - لا تصدق ان السوق يتحرك عشوائيا", url: "P02iX2KGYpc" },
            { id: 3, title: "الدرس الثالث - كيف يصنع السوق مناطق سيولة", url: "sRBlms-TcMM" }
        ],
        rights: {
            channel: "https://t.me/mos_rar",
            account: "https://t.me/rar42rar"
        },
        note: "الكورس مجاني 100% وتم وضعه في خانة البرمويوم لتجربة ميزات البرمويوم فقط"
    }
};

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        
        // التحقق من حالة تسجيل الدخول
        auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                loadUserData();
                showApp();
            } else {
                showAuth();
            }
        });
        
        setupEventListeners();
    }, 2000);
}

function setupEventListeners() {
    // مصادقة
    document.getElementById('showRegister').addEventListener('click', showRegisterForm);
    document.getElementById('showLogin').addEventListener('click', showLoginForm);
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('registerBtn').addEventListener('click', register);
    
    // التنقل
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => navigateToPage(e.target.closest('.nav-btn').dataset.page));
    });
    
    // القائمة الجانبية
    document.getElementById('menuBtn').addEventListener('click', openSidebar);
    document.getElementById('closeSidebar').addEventListener('click', closeSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
    
    // الروابط الجانبية
    document.querySelectorAll('.sidebar-menu a[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage(e.target.closest('a').dataset.page);
            closeSidebar();
        });
    });
    
    // زر الرجوع
    document.getElementById('backBtn').addEventListener('click', goBack);
    
    // دعم الفني
    document.getElementById('supportFloat').addEventListener('click', openSupport);
    document.getElementById('closeSupport').addEventListener('click', closeSupport);
    document.getElementById('sendMessage').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Premium
    document.getElementById('activatePremium').addEventListener('click', activatePremium);
    document.getElementById('cancelPremium').addEventListener('click', closePremiumModal);
    
    // تأكيد
    document.getElementById('confirmCancel').addEventListener('click', closeConfirmModal);
    document.getElementById('confirmOk').addEventListener('click', confirmAction);
    
    // تسجيل الخروج
    document.getElementById('supportBtn').addEventListener('click', (e) => {
        e.preventDefault();
        openSupport();
        closeSidebar();
    });
    
    // سياسة الخصوصية ومن نحن
    document.getElementById('privacyBtn').addEventListener('click', (e) => {
        e.preventDefault();
        showPrivacyPolicy();
        closeSidebar();
    });
    
    document.getElementById('aboutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        showAboutUs();
        closeSidebar();
    });
    
    // حساب الأدمن
    document.getElementById('adminAccess').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'admin.html';
    });
}

function showAuth() {
    document.getElementById('authScreen').style.display = 'block';
    document.getElementById('appScreen').style.display = 'none';
}

function showApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    navigateToPage('home');
}

function showRegisterForm(e) {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLoginForm(e) {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert('خطأ في تسجيل الدخول: ' + error.message);
    }
}

async function register() {
    const name = document.getElementById('registerName').value;
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const photo = document.getElementById('registerPhoto').files[0];
    
    // التحقق من اسم المستخدم
    if (!/^[a-zA-Z].{3,}$/.test(username)) {
        alert('اسم المستخدم يجب أن يبدأ بحرف ويكون 4 رموز على الأقل');
        return;
    }
    
    // التحقق من عدم تكرار اسم المستخدم
    const usernameSnapshot = await database.ref('usernames').child(username).once('value');
    if (usernameSnapshot.exists()) {
        alert('اسم المستخدم موجود مسبقاً');
        return;
    }
    
    try {
        // إنشاء المستخدم
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // رفع الصورة إذا وجدت
        let photoURL = '';
        if (photo) {
            const storageRef = storage.ref(`profile_photos/${user.uid}`);
            await storageRef.put(photo);
            photoURL = await storageRef.getDownloadURL();
        }
        
        // حفظ بيانات المستخدم
        const userData = {
            name: name,
            username: username,
            email: email,
            photoURL: photoURL,
            status: 'عادي',
            premiumExpiry: null,
            createdAt: new Date().toISOString()
        };
        
        await database.ref('users').child(user.uid).set(userData);
        await database.ref('usernames').child(username).set(user.uid);
        
        // تسجيل الدخول تلقائي
        await auth.signInWithEmailAndPassword(email, password);
        
    } catch (error) {
        alert('خطأ في إنشاء الحساب: ' + error.message);
    }
}

async function loadUserData() {
    if (!currentUser) return;
    
    const userRef = database.ref('users').child(currentUser.uid);
    userRef.on('value', (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            updateUIWithUserData(userData);
            checkUnreadMessages();
        }
    });
}

function updateUIWithUserData(userData) {
    // تحديث القائمة الجانبية
    document.getElementById('sidebarUserName').textContent = userData.name;
    document.getElementById('sidebarUserStatus').textContent = userData.status === 'premium' ? 'حساب Premium' : 'حساب عادي';
    
    if (userData.photoURL) {
        document.getElementById('sidebarUserPhoto').src = userData.photoURL;
    }
    
    // تحديث صفحة الحساب
    if (currentPage === 'account') {
        renderAccountPage(userData);
    }
}

function navigateToPage(page) {
    pageHistory.push(currentPage);
    currentPage = page;
    
    // تحديث الشريط العلوي
    document.getElementById('pageTitle').textContent = getPageTitle(page);
    document.getElementById('backBtn').style.display = pageHistory.length > 0 ? 'block' : 'none';
    
    // تحديث التنقل السفلي
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === page) {
            btn.classList.add('active');
        }
    });
    
    // تحميل المحتوى
    loadPageContent(page);
}

function getPageTitle(page) {
    const titles = {
        'account': 'الحساب',
        'home': 'الرئيسية',
        'courses': 'الدورات',
        'premium': 'المتقدمين',
        'tools': 'الأدوات'
    };
    return titles[page] || 'اكزم لتداول';
}

function loadPageContent(page) {
    const content = document.getElementById('mainContent');
    
    switch(page) {
        case 'home':
            renderHomePage();
            break;
        case 'account':
            renderAccountPage();
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
    }
}

function renderHomePage() {
    const content = `
        <div class="page home-page">
            <div class="welcome">
                <h2>مرحباً بك في اكزم لتداول</h2>
                <p>التطبيق التعليمي الاحترافي الذي يجمع أفضل الدورات والأدوات في مكان واحد لتطوير مهاراتك في التداول</p>
            </div>
            
            <div class="stats">
                <div class="stat-card">
                    <i class="fas fa-graduation-cap"></i>
                    <h3>${courses.free.length} دورات</h3>
                    <p>مجانية متاحة</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-crown"></i>
                    <h3>دورة مميزة</h3>
                    <p>للمتقدمين</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-tools"></i>
                    <h3>أدوات متقدمة</h3>
                    <p>لتحليل السوق</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-headset"></i>
                    <h3>دعم فني</h3>
                    <p>متاح 24/7</p>
                </div>
            </div>
            
            <div style="background: #222; padding: 1.5rem; border-radius: 10px;">
                <h3 style="margin-bottom: 1rem;">نصائح سريعة</h3>
                <ul style="list-style: none; padding: 0;">
                    <li style="padding: 5px 0; border-bottom: 1px solid #333;">📚 ابدأ بالدورات المجانية</li>
                    <li style="padding: 5px 0; border-bottom: 1px solid #333;">⚡ استخدم أدوات التحليل</li>
                    <li style="padding: 5px 0; border-bottom: 1px solid #333;">👑 جرب ميزات Premium</li>
                    <li style="padding: 5px 0;">📞 تواصل مع الدعم الفني</li>
                </ul>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function renderAccountPage(userData) {
    if (!userData && currentUser) {
        database.ref('users').child(currentUser.uid).once('value').then(snapshot => {
            renderAccountPage(snapshot.val());
        });
        return;
    }
    
    const isPremium = userData && userData.status === 'premium';
    const expiryDate = userData && userData.premiumExpiry ? 
        new Date(userData.premiumExpiry).toLocaleDateString('ar-EG') : 'غير مفعل';
    
    const content = `
        <div class="page account-page">
            <div class="profile-header">
                <img class="profile-img" src="${userData?.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData?.name || 'User')}" 
                     alt="صورة الحساب" onerror="this.src='https://ui-avatars.com/api/?name=User&background=random'">
                <h2>${userData?.name || 'المستخدم'}</h2>
                <p>@${userData?.username || 'username'}</p>
                ${isPremium ? '<span class="premium-badge">Premium</span>' : ''}
            </div>
            
            <div class="user-info">
                <div class="info-row">
                    <span>نوع الحساب:</span>
                    <span>${isPremium ? 'Premium' : 'عادي'}</span>
                </div>
                <div class="info-row">
                    <span>البريد الإلكتروني:</span>
                    <span>${userData?.email || 'غير متوفر'}</span>
                </div>
                ${isPremium ? `
                <div class="info-row">
                    <span>انتهاء الاشتراك:</span>
                    <span>${expiryDate}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="account-actions">
                <button class="btn-secondary" onclick="editProfile()">
                    <i class="fas fa-edit"></i> تعديل البيانات
                </button>
                ${!isPremium ? `
                <button class="btn-primary" onclick="showPremiumModal()">
                    <i class="fas fa-crown"></i> ترقية إلى Premium
                </button>
                ` : ''}
                <button class="btn-danger" onclick="confirmLogout()">
                    <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function renderCoursesPage() {
    let coursesHTML = '';
    
    courses.free.forEach(course => {
        let videosHTML = '';
        course.videos.forEach(video => {
            videosHTML += `
                <div class="video-item" onclick="playVideo('${video.url}', '${course.title} - ${video.title}', ${course.id})">
                    <i class="fas fa-play-circle"></i>
                    <span>الدرس ${video.id}: ${video.title}</span>
                </div>
            `;
        });
        
        coursesHTML += `
            <div class="course-card">
                <div class="course-header">
                    <h3>${course.title}</h3>
                    <p>المدرب: ${course.instructor}</p>
                </div>
                <div class="course-content">
                    <div class="video-list">
                        ${videosHTML}
                    </div>
                    <button class="btn-secondary" style="width: 100%; margin-top: 1rem;" 
                            onclick="showCourseInfo(${course.id})">
                        <i class="fas fa-info-circle"></i> معلومات الكورس
                    </button>
                </div>
            </div>
        `;
    });
    
    document.getElementById('mainContent').innerHTML = `
        <div class="page courses-page">
            <h2 style="margin-bottom: 1.5rem;">الدورات المجانية</h2>
            ${coursesHTML}
        </div>
    `;
}

function renderPremiumPage() {
    database.ref('users').child(currentUser.uid).once('value').then(snapshot => {
        const userData = snapshot.val();
        const isPremium = userData && userData.status === 'premium';
        
        if (isPremium) {
            let videosHTML = '';
            courses.premium.videos.forEach(video => {
                videosHTML += `
                    <div class="video-item" onclick="playVideo('${video.url}', '${courses.premium.title} - ${video.title}', 'premium')">
                        <i class="fas fa-play-circle"></i>
                        <span>الدرس ${video.id}: ${video.title}</span>
                    </div>
                `;
            });
            
            document.getElementById('mainContent').innerHTML = `
                <div class="page courses-page">
                    <div class="course-card">
                        <div class="course-header" style="background: linear-gradient(135deg, #ffd700, #ff9800);">
                            <h3><i class="fas fa-crown"></i> ${courses.premium.title}</h3>
                            <p>المدرب: ${courses.premium.instructor}</p>
                        </div>
                        <div class="course-content">
                            <div class="video-list">
                                ${videosHTML}
                            </div>
                            <button class="btn-secondary" style="width: 100%; margin-top: 1rem;" 
                                    onclick="showCourseInfo('premium')">
                                <i class="fas fa-info-circle"></i> معلومات الكورس
                            </button>
                        </div>
                    </div>
                    
                    <div style="background: #222; padding: 1rem; border-radius: 10px; margin-top: 1rem;">
                        <p style="color: #ffd700; text-align: center;">${courses.premium.note}</p>
                    </div>
                </div>
            `;
        } else {
            document.getElementById('mainContent').innerHTML = `
                <div class="page premium-page">
                    <div class="locked-content">
                        <i class="fas fa-lock"></i>
                        <h2>محتوى Premium</h2>
                        <p style="margin: 1rem 0;">هذا المحتوى متاح فقط للأعضاء المشتركين في Premium</p>
                        <button class="btn-primary" onclick="showPremiumModal()">
                            <i class="fas fa-crown"></i> تفعيل Premium
                        </button>
                    </div>
                </div>
            `;
        }
    });
}

function renderToolsPage() {
    document.getElementById('mainContent').innerHTML = `
        <div class="page tools-page">
            <h2 style="margin-bottom: 1.5rem;">أدوات التداول</h2>
            <div class="tool-card" onclick="openFibonacciCalculator()">
                <i class="fas fa-calculator"></i>
                <h3>حاسبة فيبوناتشي</h3>
                <p>حساب مستويات فيبوناتشي</p>
            </div>
            <div class="tool-card" onclick="openRiskCalculator()">
                <i class="fas fa-chart-line"></i>
                <h3>إدارة رأس المال</h3>
                <p>حساب حجم الصفقة</p>
            </div>
            <div class="tool-card" onclick="openPivotCalculator()">
                <i class="fas fa-balance-scale"></i>
                <h3>حاسبة النقاط المحورية</h3>
                <p>Pivot Points Calculator</p>
            </div>
        </div>
    `;
}

function playVideo(videoId, title, courseId) {
    document.getElementById('videoTitle').textContent = title;
    document.getElementById('videoPlayer').src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    
    let infoHTML = '';
    let course;
    
    if (courseId === 'premium') {
        course = courses.premium;
    } else {
        course = courses.free.find(c => c.id === courseId);
    }
    
    if (course) {
        infoHTML = `
            <h4>معلومات الكورس:</h4>
            <p><strong>العنوان:</strong> ${course.title}</p>
            <p><strong>المدرب:</strong> ${course.instructor}</p>
            ${course.rights.channel ? `<p><strong>قناة تلجرام:</strong> <a href="${course.rights.channel}" target="_blank">${course.rights.channel}</a></p>` : ''}
            ${course.rights.account ? `<p><strong>حساب تلجرام:</strong> <a href="${course.rights.account}" target="_blank">${course.rights.account}</a></p>` : ''}
        `;
    }
    
    document.getElementById('videoInfo').innerHTML = infoHTML;
    document.getElementById('videoModal').classList.add('active');
}

function showCourseInfo(courseId) {
    let course;
    
    if (courseId === 'premium') {
        course = courses.premium;
    } else {
        course = courses.free.find(c => c.id === courseId);
    }
    
    if (!course) return;
    
    let infoHTML = `
        <h3>${course.title}</h3>
        <p><strong>المدرب:</strong> ${course.instructor}</p>
        <p><strong>عدد الدروس:</strong> ${course.videos.length} درس</p>
        <hr>
        <h4>حقوق الكورس:</h4>
    `;
    
    if (course.rights.channel) {
        infoHTML += `<p><i class="fab fa-telegram"></i> <a href="${course.rights.channel}" target="_blank">قناة تلجرام</a></p>`;
    }
    
    if (course.rights.account) {
        infoHTML += `<p><i class="fab fa-telegram"></i> <a href="${course.rights.account}" target="_blank">حساب تلجرام</a></p>`;
    }
    
    if (courseId === 'premium') {
        infoHTML += `<hr><p style="color: #ffd700;">${course.note}</p>`;
    }
    
    alertCustom('معلومات الكورس', infoHTML);
}

function openFibonacciCalculator() {
    const content = `
        <div class="page">
            <h2 style="margin-bottom: 1.5rem;">حاسبة فيبوناتشي</h2>
            <div class="calculator-form">
                <select id="fibDirection" class="calc-input">
                    <option value="low-high">من القاع إلى القمة</option>
                    <option value="high-low">من القمة إلى القاع</option>
                </select>
                <input type="number" id="fibHigh" class="calc-input" placeholder="السعر المرتفع (القمة)">
                <input type="number" id="fibLow" class="calc-input" placeholder="السعر المنخفض (القاع)">
                <button class="btn-primary" onclick="calculateFibonacci()">حساب</button>
            </div>
            <div class="calc-results" id="fibResults" style="display: none;"></div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function calculateFibonacci() {
    const direction = document.getElementById('fibDirection').value;
    const high = parseFloat(document.getElementById('fibHigh').value);
    const low = parseFloat(document.getElementById('fibLow').value);
    
    if (!high || !low) {
        alert('يرجى إدخال جميع القيم');
        return;
    }
    
    const diff = Math.abs(high - low);
    const levels = {
        '0%': direction === 'low-high' ? low : high,
        '23.6%': direction === 'low-high' ? low + diff * 0.236 : high - diff * 0.236,
        '38.2%': direction === 'low-high' ? low + diff * 0.382 : high - diff * 0.382,
        '50%': direction === 'low-high' ? low + diff * 0.5 : high - diff * 0.5,
        '61.8%': direction === 'low-high' ? low + diff * 0.618 : high - diff * 0.618,
        '78.6%': direction === 'low-high' ? low + diff * 0.786 : high - diff * 0.786,
        '100%': direction === 'low-high' ? high : low,
        '161.8%': direction === 'low-high' ? low + diff * 1.618 : high - diff * 1.618
    };
    
    let resultsHTML = '<h4>مستويات فيبوناتشي:</h4>';
    Object.keys(levels).forEach(level => {
        resultsHTML += `
            <div class="result-row">
                <span>${level}</span>
                <span>${levels[level].toFixed(5)}</span>
            </div>
        `;
    });
    
    document.getElementById('fibResults').innerHTML = resultsHTML;
    document.getElementById('fibResults').style.display = 'block';
}

function openRiskCalculator() {
    const content = `
        <div class="page">
            <h2 style="margin-bottom: 1.5rem;">إدارة رأس المال</h2>
            <div class="calculator-form">
                <input type="number" id="riskCapital" class="calc-input" placeholder="رأس المال ($)">
                <input type="number" id="riskPercent" class="calc-input" placeholder="نسبة المخاطرة (%)" value="2" min="0.1" max="100" step="0.1">
                <input type="number" id="riskEntry" class="calc-input" placeholder="سعر الدخول">
                <input type="number" id="riskStopLoss" class="calc-input" placeholder="سعر Stop Loss">
                <button class="btn-primary" onclick="calculateRisk()">حساب</button>
            </div>
            <div class="calc-results" id="riskResults" style="display: none;"></div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function calculateRisk() {
    const capital = parseFloat(document.getElementById('riskCapital').value);
    const riskPercent = parseFloat(document.getElementById('riskPercent').value);
    const entry = parseFloat(document.getElementById('riskEntry').value);
    const stopLoss = parseFloat(document.getElementById('riskStopLoss').value);
    
    if (!capital || !riskPercent || !entry || !stopLoss) {
        alert('يرجى إدخال جميع القيم');
        return;
    }
    
    const riskAmount = capital * (riskPercent / 100);
    const riskPerUnit = Math.abs(entry - stopLoss);
    
    if (riskPerUnit === 0) {
        alert('سعر الدخول و Stop Loss لا يمكن أن يكونا متساويين');
        return;
    }
    
    const positionSize = riskAmount / riskPerUnit;
    const riskReward = riskPerUnit * 3; // Assuming 1:3 risk-reward
    
    document.getElementById('riskResults').innerHTML = `
        <h4>نتائج الحساب:</h4>
        <div class="result-row">
            <span>مبلغ المخاطرة:</span>
            <span>$${riskAmount.toFixed(2)}</span>
        </div>
        <div class="result-row">
            <span>حجم الصفقة:</span>
            <span>${positionSize.toFixed(2)} وحدة</span>
        </div>
        <div class="result-row">
            <span>الخسارة المحتملة:</span>
            <span>${riskPercent}% من رأس المال</span>
        </div>
        <div class="result-row">
            <span>المكسب المحتمل (1:3):</span>
            <span>$${(riskAmount * 3).toFixed(2)}</span>
        </div>
    `;
    document.getElementById('riskResults').style.display = 'block';
}

function openPivotCalculator() {
    const content = `
        <div class="page">
            <h2 style="margin-bottom: 1.5rem;">حاسبة النقاط المحورية</h2>
            <div class="calculator-form">
                <input type="number" id="pivotHigh" class="calc-input" placeholder="أعلى سعر">
                <input type="number" id="pivotLow" class="calc-input" placeholder="أقل سعر">
                <input type="number" id="pivotClose" class="calc-input" placeholder="سعر الإغلاق">
                <button class="btn-primary" onclick="calculatePivot()">حساب</button>
            </div>
            <div class="calc-results" id="pivotResults" style="display: none;"></div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function calculatePivot() {
    const high = parseFloat(document.getElementById('pivotHigh').value);
    const low = parseFloat(document.getElementById('pivotLow').value);
    const close = parseFloat(document.getElementById('pivotClose').value);
    
    if (!high || !low || !close) {
        alert('يرجى إدخال جميع القيم');
        return;
    }
    
    const pivot = (high + low + close) / 3;
    const r1 = (2 * pivot) - low;
    const s1 = (2 * pivot) - high;
    const r2 = pivot + (high - low);
    const s2 = pivot - (high - low);
    const r3 = high + 2 * (pivot - low);
    const s3 = low - 2 * (high - pivot);
    
    document.getElementById('pivotResults').innerHTML = `
        <h4>النقاط المحورية:</h4>
        <div class="result-row">
            <span>النقطة المحورية (PP):</span>
            <span>${pivot.toFixed(5)}</span>
        </div>
        <div class="result-row">
            <span>المقاومة 1 (R1):</span>
            <span>${r1.toFixed(5)}</span>
        </div>
        <div class="result-row">
            <span>الدعم 1 (S1):</span>
            <span>${s1.toFixed(5)}</span>
        </div>
        <div class="result-row">
            <span>المقاومة 2 (R2):</span>
            <span>${r2.toFixed(5)}</span>
        </div>
        <div class="result-row">
            <span>الدعم 2 (S2):</span>
            <span>${s2.toFixed(5)}</span>
        </div>
        <div class="result-row">
            <span>المقاومة 3 (R3):</span>
            <span>${r3.toFixed(5)}</span>
        </div>
        <div class="result-row">
            <span>الدعم 3 (S3):</span>
            <span>${s3.toFixed(5)}</span>
        </div>
    `;
    document.getElementById('pivotResults').style.display = 'block';
}

function editProfile() {
    database.ref('users').child(currentUser.uid).once('value').then(snapshot => {
        const userData = snapshot.val();
        
        const content = `
            <div class="page">
                <h2 style="margin-bottom: 1.5rem;">تعديل البيانات</h2>
                <div class="calculator-form">
                    <input type="text" id="editName" class="calc-input" value="${userData.name}" placeholder="الاسم الكامل">
                    <input type="text" id="editUsername" class="calc-input" value="${userData.username}" placeholder="اسم المستخدم">
                    <input type="password" id="editPassword" class="calc-input" placeholder="كلمة المرور الجديدة">
                    <input type="file" id="editPhoto" class="calc-input" accept="image/*">
                    <small>اترك كلمة المرور فارغة إذا لم ترد تغييرها</small>
                    
                    <div style="display: flex; gap: 10px; margin-top: 1rem;">
                        <button class="btn-secondary" onclick="navigateToPage('account')">إلغاء</button>
                        <button class="btn-primary" onclick="saveProfileChanges()">حفظ التغييرات</button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('mainContent').innerHTML = content;
    });
}

async function saveProfileChanges() {
    const name = document.getElementById('editName').value;
    const username = document.getElementById('editUsername').value;
    const password = document.getElementById('editPassword').value;
    const photo = document.getElementById('editPhoto').files[0];
    
    if (!/^[a-zA-Z].{3,}$/.test(username)) {
        alert('اسم المستخدم يجب أن يبدأ بحرف ويكون 4 رموز على الأقل');
        return;
    }
    
    try {
        const updates = {};
        
        // التحقق من اسم المستخدم
        if (username !== currentUser.username) {
            const usernameSnapshot = await database.ref('usernames').child(username).once('value');
            if (usernameSnapshot.exists() && usernameSnapshot.val() !== currentUser.uid) {
                alert('اسم المستخدم موجود مسبقاً');
                return;
            }
            
            // تحديث اسم المستخدم
            await database.ref('usernames').child(username).set(currentUser.uid);
            await database.ref('usernames').child(currentUser.username).remove();
            updates.username = username;
        }
        
        // تحديث الاسم
        updates.name = name;
        
        // رفع الصورة
        if (photo) {
            const storageRef = storage.ref(`profile_photos/${currentUser.uid}`);
            await storageRef.put(photo);
            const photoURL = await storageRef.getDownloadURL();
            updates.photoURL = photoURL;
        }
        
        // تحديث كلمة المرور
        if (password) {
            await currentUser.updatePassword(password);
        }
        
        // تحديث البيانات في قاعدة البيانات
        await database.ref('users').child(currentUser.uid).update(updates);
        
        alert('تم تحديث البيانات بنجاح');
        navigateToPage('account');
        
    } catch (error) {
        alert('خطأ في تحديث البيانات: ' + error.message);
    }
}

function confirmLogout() {
    showConfirmModal('تأكيد تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', () => {
        auth.signOut().then(() => {
            window.location.reload();
        });
    });
}

function showPremiumModal() {
    document.getElementById('premiumModal').classList.add('active');
}

function closePremiumModal() {
    document.getElementById('premiumModal').classList.remove('active');
    document.getElementById('premiumCode').value = '';
}

async function activatePremium() {
    const code = document.getElementById('premiumCode').value.trim();
    
    if (!code) {
        alert('يرجى إدخال كود التفعيل');
        return;
    }
    
    const codeRef = database.ref('premiumCodes').child(code);
    const codeSnapshot = await codeRef.once('value');
    const codeData = codeSnapshot.val();
    
    if (!codeData) {
        alert('كود التفعيل غير صحيح');
        return;
    }
    
    if (codeData.used) {
        alert('هذا الكود تم استخدامه مسبقاً');
        return;
    }
    
    if (codeData.userId && codeData.userId !== currentUser.uid) {
        alert('هذا الكود خاص بمستخدم آخر');
        return;
    }
    
    // حساب تاريخ الانتهاء
    const now = new Date();
    let expiryDate = new Date(now);
    
    switch(codeData.duration) {
        case 'minute':
            expiryDate.setMinutes(now.getMinutes() + 1);
            break;
        case 'hour':
            expiryDate.setHours(now.getHours() + 1);
            break;
        case 'day':
            expiryDate.setDate(now.getDate() + 1);
            break;
        case 'month':
            expiryDate.setMonth(now.getMonth() + 1);
            break;
        case 'year':
            expiryDate.setFullYear(now.getFullYear() + 1);
            break;
    }
    
    // تحديث حالة المستخدم
    await database.ref('users').child(currentUser.uid).update({
        status: 'premium',
        premiumExpiry: expiryDate.toISOString(),
        premiumCode: code
    });
    
    // تحديث حالة الكود
    await codeRef.update({
        used: true,
        userId: currentUser.uid,
        usedAt: new Date().toISOString()
    });
    
    // إرسال إشعار
    await database.ref('messages').child(currentUser.uid).push({
        from: 'admin',
        message: 'مبروك! تم تفعيل الاشتراك Premium بنجاح.',
        timestamp: new Date().toISOString(),
        read: false
    });
    
    alert('تم تفعيل الاشتراك Premium بنجاح!');
    closePremiumModal();
    navigateToPage('premium');
}

function openSidebar() {
    document.getElementById('sidebarOverlay').classList.add('active');
    document.getElementById('sidebar').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebarOverlay').classList.remove('active');
    document.getElementById('sidebar').classList.remove('active');
}

function goBack() {
    if (pageHistory.length > 0) {
        const prevPage = pageHistory.pop();
        navigateToPage(prevPage);
    }
}

let confirmCallback = null;

function showConfirmModal(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = callback;
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    confirmCallback = null;
}

function confirmAction() {
    if (confirmCallback) {
        confirmCallback();
    }
    closeConfirmModal();
}

function openSupport() {
    loadMessages();
    document.getElementById('supportModal').classList.add('active');
    markMessagesAsRead();
}

function closeSupport() {
    document.getElementById('supportModal').classList.remove('active');
}

async function loadMessages() {
    if (!currentUser) return;
    
    const messagesRef = database.ref('messages').child(currentUser.uid);
    messagesRef.on('value', (snapshot) => {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
        
        const messages = [];
        snapshot.forEach(child => {
            messages.push({
                id: child.key,
                ...child.val()
            });
        });
        
        // ترتيب الرسائل من الأقدم إلى الأحدث
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.from === 'admin' ? 'admin' : ''}`;
            
            const time = new Date(msg.timestamp).toLocaleString('ar-EG');
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span>${msg.from === 'admin' ? 'الدعم الفني' : 'أنت'}</span>
                    <span>${time}</span>
                </div>
                <div class="message-body">${msg.message}</div>
            `;
            
            messagesContainer.appendChild(messageDiv);
        });
        
        // التمرير للأسفل
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    if (!currentUser) {
        alert('يجب تسجيل الدخول أولاً');
        return;
    }
    
    try {
        await database.ref('messages').child(currentUser.uid).push({
            from: currentUser.uid,
            message: message,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        input.value = '';
        
    } catch (error) {
        alert('خطأ في إرسال الرسالة: ' + error.message);
    }
}

async function checkUnreadMessages() {
    if (!currentUser) return;
    
    const messagesRef = database.ref('messages').child(currentUser.uid);
    messagesRef.on('value', (snapshot) => {
        let unreadCount = 0;
        
        snapshot.forEach(child => {
            if (!child.val().read && child.val().from === 'admin') {
                unreadCount++;
            }
        });
        
        const badge = document.getElementById('messageCount');
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    });
}

async function markMessagesAsRead() {
    if (!currentUser) return;
    
    const messagesRef = database.ref('messages').child(currentUser.uid);
    const snapshot = await messagesRef.once('value');
    
    const updates = {};
    snapshot.forEach(child => {
        if (!child.val().read && child.val().from === 'admin') {
            updates[child.key + '/read'] = true;
        }
    });
    
    if (Object.keys(updates).length > 0) {
        await messagesRef.update(updates);
    }
}

function showPrivacyPolicy() {
    const content = `
        <div class="page">
            <h2 style="margin-bottom: 1.5rem;">سياسة الخصوصية</h2>
            <div style="background: #222; padding: 1.5rem; border-radius: 10px;">
                <h3 style="color: #4CAF50; margin-bottom: 1rem;">حماية خصوصيتك أولويتنا</h3>
                <p style="margin-bottom: 1rem;">
                    نحن في تطبيق "اكزم لتداول" نلتزم بحماية خصوصية مستخدمينا بشكل كامل. نضمن أن جميع البيانات الشخصية محفوظة بأمان ولا يتم مشاركتها مع أي طرف ثالث دون موافقتك.
                </p>
                <h4 style="color: #4CAF50; margin: 1rem 0;">البيانات التي نجمعها:</h4>
                <ul style="list-style: none; padding: 0;">
                    <li style="padding: 5px 0; border-bottom: 1px solid #333;">✅ معلومات الحساب الأساسية (الاسم، البريد الإلكتروني)</li>
                    <li style="padding: 5px 0; border-bottom: 1px solid #333;">✅ بيانات الاستخدام لتحسين تجربتك</li>
                    <li style="padding: 5px 0;">✅ رسائل الدعم الفني للرد على استفساراتك</li>
                </ul>
                <p style="margin-top: 1rem; color: #aaa; font-size: 0.9rem;">
                    نستخدم أحدث تقنيات التشفير لحماية بياناتك، ولديك دائمًا الحق في حذف حسابك أو تصحيح بياناتك.
                </p>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function showAboutUs() {
    const content = `
        <div class="page">
            <h2 style="margin-bottom: 1.5rem;">من نحن</h2>
            <div style="background: #222; padding: 1.5rem; border-radius: 10px; text-align: center;">
                <h3 style="color: #4CAF50; margin-bottom: 1rem;">فريق اكزم لتداول</h3>
                <p style="margin-bottom: 1rem; font-size: 1.1rem;">
                    نحن فريق من المطورين والمحترفين في مجال التداول، نعمل بجد لتقديم أفضل الحلول التعليمية للمتداولين العرب.
                </p>
                <div style="display: flex; justify-content: center; gap: 2rem; margin: 2rem 0;">
                    <div style="text-align: center;">
                        <i class="fas fa-rocket" style="font-size: 2rem; color: #4CAF50;"></i>
                        <h4 style="margin: 0.5rem 0;">الرؤية</h4>
                        <p style="font-size: 0.9rem;">تطوير مهارات التداول في العالم العربي</p>
                    </div>
                    <div style="text-align: center;">
                        <i class="fas fa-bullseye" style="font-size: 2rem; color: #4CAF50;"></i>
                        <h4 style="margin: 0.5rem 0;">الرسالة</h4>
                        <p style="font-size: 0.9rem;">توفير محتوى تعليمي احترافي ومجاني للجميع</p>
                    </div>
                </div>
                <p style="color: #aaa; font-size: 0.9rem;">
                    نسعى دائمًا لتطوير التطبيق وإضافة المزيد من الميزات والأدوات المفيدة لمستخدمينا الأعزاء.
                </p>
                <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #333;">
                    <h4 style="color: #4CAF50; margin-bottom: 1rem;">روابط التواصل:</h4>
                    <div style="display: flex; justify-content: center; gap: 1rem;">
                        <a href="https://wa.me/442031375274" target="_blank" style="color: #25D366;">
                            <i class="fab fa-whatsapp" style="font-size: 1.5rem;"></i>
                        </a>
                        <a href="https://t.me/ASQ412" target="_blank" style="color: #0088cc;">
                            <i class="fab fa-telegram" style="font-size: 1.5rem;"></i>
                        </a>
                        <a href="https://t.me/pine_Scripts0" target="_blank" style="color: #0088cc;">
                            <i class="fab fa-telegram" style="font-size: 1.5rem;"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function alertCustom(title, message) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').innerHTML = message;
    document.getElementById('confirmCancel').style.display = 'none';
    document.getElementById('confirmOk').textContent = 'موافق';
    document.getElementById('confirmOk').className = 'btn-primary';
    
    confirmCallback = () => {
        document.getElementById('confirmCancel').style.display = 'block';
        document.getElementById('confirmOk').textContent = 'نعم';
        document.getElementById('confirmOk').className = 'btn-danger';
        closeConfirmModal();
    };
    
    document.getElementById('confirmModal').classList.add('active');
}

// إضافة سحب وإفلات لدعم الفني العائم
const supportFloat = document.getElementById('supportFloat');
let isDragging = false;
let offsetX, offsetY;

supportFloat.addEventListener('mousedown', startDrag);
supportFloat.addEventListener('touchstart', startDragTouch);

function startDrag(e) {
    isDragging = true;
    const rect = supportFloat.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
}

function startDragTouch(e) {
    isDragging = true;
    const touch = e.touches[0];
    const rect = supportFloat.getBoundingClientRect();
    offsetX = touch.clientX - rect.left;
    offsetY = touch.clientY - rect.top;
    
    document.addEventListener('touchmove', onDragTouch);
    document.addEventListener('touchend', stopDrag);
}

function onDrag(e) {
    if (!isDragging) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // الحدود
    const maxX = window.innerWidth - supportFloat.offsetWidth;
    const maxY = window.innerHeight - supportFloat.offsetHeight;
    
    supportFloat.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    supportFloat.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
}

function onDragTouch(e) {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const x = touch.clientX - offsetX;
    const y = touch.clientY - offsetY;
    
    // الحدود
    const maxX = window.innerWidth - supportFloat.offsetWidth;
    const maxY = window.innerHeight - supportFloat.offsetHeight;
    
    supportFloat.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    supportFloat.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
}

function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('touchmove', onDragTouch);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
}

// إغلاق الفيديو
document.getElementById('closeVideo').addEventListener('click', () => {
    document.getElementById('videoModal').classList.remove('active');
    document.getElementById('videoPlayer').src = '';
});