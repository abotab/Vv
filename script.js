// البيانات والمتغيرات
let currentUser = null;
let currentTheme = localStorage.getItem('theme') || 'light';
let courses = [];
let messages = JSON.parse(localStorage.getItem('support_messages')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];
let premiumCodes = JSON.parse(localStorage.getItem('premium_codes')) || {};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    loadCourses();
    loadUsers();
    updateUI();
    checkAdminAutoLogin();
});

// تهيئة التطبيق
function initApp() {
    // تعيين الثيم
    document.body.setAttribute('data-theme', currentTheme);
    
    // إخفاء جميع الصفحات وإظهار الرئيسية
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById('home-page').classList.add('active');
    
    // تعيين زر الرجوع
    document.querySelector('.back-btn').addEventListener('click', goBack);
    
    // نموذج تسجيل الدخول
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // نموذج التسجيل
    if (document.getElementById('register-form')) {
        document.getElementById('register-form').addEventListener('submit', handleRegister);
    }
    
    // تحديث عداد الرسائل
    updateMessageCount();
    
    // جلب البيانات من localStorage
    loadFromStorage();
}

// التبديل بين الثيمات
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    // تحديث الأيقونة
    const icon = document.querySelector('.theme-toggle i');
    icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// التبديل بين الصفحات
function showPage(page) {
    const pages = document.querySelectorAll('.page');
    const buttons = document.querySelectorAll('.nav-btn');
    
    pages.forEach(p => p.classList.remove('active'));
    buttons.forEach(b => b.classList.remove('active'));
    
    let pageElement, buttonElement;
    
    switch(page) {
        case 'home':
            pageElement = document.getElementById('home-page');
            buttonElement = document.querySelector('.nav-btn:nth-child(1)');
            break;
        case 'courses':
            pageElement = document.getElementById('courses-page');
            buttonElement = document.querySelector('.nav-btn:nth-child(2)');
            break;
        case 'advanced':
            pageElement = document.getElementById('advanced-page');
            buttonElement = document.querySelector('.nav-btn:nth-child(3)');
            break;
        case 'tools':
            pageElement = document.getElementById('tools-page');
            buttonElement = document.querySelector('.nav-btn:nth-child(4)');
            break;
        case 'account':
            pageElement = document.getElementById('account-page');
            buttonElement = document.querySelector('.nav-btn:nth-child(5)');
            break;
    }
    
    if (pageElement) {
        pageElement.classList.add('active');
        buttonElement.classList.add('active');
        updateUI();
    }
}

// الرجوع للصفحة السابقة
function goBack() {
    const activePage = document.querySelector('.page.active').id;
    switch(activePage) {
        case 'courses-page':
        case 'advanced-page':
        case 'tools-page':
        case 'account-page':
            showPage('home');
            break;
        default:
            showPage('home');
    }
}

// تحميل الدورات
function loadCourses() {
    // سيتم تحميل الدورات من ملف الدورات
    courses = [
        {
            id: 1,
            title: 'كورس التداول من صفر الى الاحتراف',
            instructor: 'حيدر الجنابي',
            videos: [
                { id: 'G8eeqb82KOM', title: 'بسره من اول فيديو لآخر فيديو' }
            ],
            telegramChannel: 'https://t.me/thesuccessfulwayarabs',
            telegramAccount: 'https://t.me/haideraljanabi90'
        },
        {
            id: 2,
            title: 'أفضل دورة لتعلم SMC في الوطن العربي',
            instructor: 'الدكتور محمد مهدي',
            videos: [
                { id: 'eb2y-Kbd_N8', title: 'مقدمة هامة لدورة SMC Exaado' },
                { id: 'XSPuivsDNd4', title: 'لماذا المستوي الأول مجاني؟' }
            ],
            telegramChannel: 'https://t.me/Exaado',
            telegramAccount: 'https://t.me/ExaadoSupport'
        },
        {
            id: 3,
            title: 'الكورس السداسي في احتراف التحليل الفني',
            instructor: 'حيدر تريدنك',
            videos: [
                { id: 'pNLb-3Nrjv0', title: 'مقدمة الكورس السداسي' },
                { id: 'QEMB6XnoAPU', title: 'شرح الشمعه اليابانية بالتفصيل' }
            ],
            telegramChannel: 'https://t.me/tradaying'
        }
    ];
    
    renderCourses();
}

// عرض الدورات
function renderCourses() {
    const container = document.querySelector('.courses-container');
    container.innerHTML = '';
    
    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.innerHTML = `
            <div class="course-header">
                <h3>${course.title}</h3>
                <p>${course.instructor}</p>
            </div>
            <div class="course-body">
                <p>${course.videos.length} فيديو تعليمي</p>
                <div class="course-info">
                    <button class="watch-btn" onclick="playCourse(${course.id})">
                        مشاهدة الدورة
                    </button>
                    <button class="info-btn" onclick="showCourseInfo(${course.id})">
                        معلومات
                    </button>
                </div>
            </div>
        `;
        container.appendChild(courseCard);
    });
}

// تشغيل الدورة
function playCourse(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (course) {
        const videoTitle = document.getElementById('video-title');
        const videoPlayer = document.getElementById('video-player');
        const videoInfo = document.getElementById('video-info');
        
        videoTitle.textContent = course.title;
        videoPlayer.src = `https://www.youtube.com/embed/${course.videos[0].id}?rel=0&modestbranding=1&showinfo=0&controls=1`;
        videoInfo.innerHTML = `
            <p><strong>المدرب:</strong> ${course.instructor}</p>
            <p><strong>عدد الفيديوهات:</strong> ${course.videos.length}</p>
        `;
        
        openModal('video-modal');
    }
}

// عرض معلومات الدورة
function showCourseInfo(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (course) {
        alert(`
            ${course.title}
            
            المدرب: ${course.instructor}
            
            روابط التواصل:
            قناة تلغرام: ${course.telegramChannel}
            ${course.telegramAccount ? `حساب تلغرام: ${course.telegramAccount}` : ''}
            
            ملاحظة: هذه الدورة مجانية 100% وتم وضعها في خانة البريميوم لتجربة الميزات فقط.
        `);
    }
}

// فتح النافذة
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// إغلاق النافذة
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    if (modalId === 'video-modal') {
        const videoPlayer = document.getElementById('video-player');
        videoPlayer.src = '';
    }
}

// الدعم الفني
function toggleSupportChat() {
    const chat = document.getElementById('support-chat');
    chat.classList.toggle('active');
    
    if (chat.classList.contains('active')) {
        // إخفاء الإشعارات
        document.getElementById('message-count').style.display = 'none';
        updateMessageCount();
    }
}

// إرسال رسالة
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (message) {
        const newMessage = {
            id: Date.now(),
            text: message,
            sender: 'user',
            time: new Date().toLocaleTimeString('ar-EG')
        };
        
        messages.push(newMessage);
        saveToStorage('support_messages', messages);
        renderMessages();
        input.value = '';
        
        // إشعار وهمي من الدعم
        setTimeout(() => {
            const reply = {
                id: Date.now() + 1,
                text: 'شكراً لتواصلكم، فريق الدعم سيرد عليكم قريباً.',
                sender: 'support',
                time: new Date().toLocaleTimeString('ar-EG')
            };
            messages.push(reply);
            saveToStorage('support_messages', messages);
            renderMessages();
            updateMessageCount();
        }, 1000);
    }
}

// عرض الرسائل
function renderMessages() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    
    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender}`;
        messageDiv.innerHTML = `
            <p>${msg.text}</p>
            <small>${msg.time}</small>
        `;
        container.appendChild(messageDiv);
    });
    
    container.scrollTop = container.scrollHeight;
}

// تحديث عداد الرسائل
function updateMessageCount() {
    const unread = messages.filter(m => m.sender === 'support' && !m.read).length;
    const badge = document.getElementById('message-count');
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
}

// تسجيل الدخول
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // التحقق من بيانات المدير
    if (email === 'mstrhmd2005@gmail.com' && password === 'T1O2K3abot$') {
        // توجيه إلى صفحة الإدارة
        window.location.href = 'admin.html';
        return;
    }
    
    // البحث عن المستخدم
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUI();
        showToast('تم تسجيل الدخول بنجاح', 'success');
        showProfile();
    } else {
        showToast('بيانات الدخول غير صحيحة', 'error');
    }
}

// عرض الملف الشخصي
function showProfile() {
    if (!currentUser) return;
    
    document.getElementById('login-section').style.display = 'none';
    
    const profileSection = document.getElementById('profile-section');
    profileSection.style.display = 'block';
    profileSection.innerHTML = `
        <div class="profile-card">
            <div class="profile-header">
                <img src="${currentUser.avatar || 'https://j.top4top.io/p_3670reejg0.png'}" 
                     alt="صورة الملف" class="profile-pic">
                <h3>${currentUser.name}</h3>
                <p>${currentUser.email}</p>
                <p>${currentUser.isPremium ? '🔓 حساب بريميوم' : '🔒 حساب عادي'}</p>
            </div>
            
            <div class="profile-actions">
                <button class="profile-btn edit-btn" onclick="editProfile()">
                    تعديل الملف
                </button>
                <button class="profile-btn logout-btn" onclick="logout()">
                    تسجيل الخروج
                </button>
            </div>
        </div>
    `;
}

// تسجيل الخروج
function logout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUI();
        document.getElementById('profile-section').style.display = 'none';
        document.getElementById('login-section').style.display = 'block';
        showToast('تم تسجيل الخروج بنجاح', 'success');
    }
}

// التحديثات
function updateUI() {
    // تحديث حالة المستخدم
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showProfile();
    }
    
    // تحديث أزرار التنقل
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        if (btn.querySelector('span').textContent === 'الحساب' && !currentUser) {
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>تسجيل</span>';
        }
    });
}

// فتح حاسبة فيبوناتشي
function openFibonacciCalculator() {
    const modalBody = document.querySelector('#fibonacci-modal .modal-body');
    modalBody.innerHTML = `
        <div class="calculator">
            <div class="form-group">
                <label>اختر الاتجاه:</label>
                <select id="fib-direction" class="form-control">
                    <option value="low-high">من القاع إلى القمة</option>
                    <option value="high-low">من القمة إلى القاع</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>السعر الأدنى (القاع):</label>
                <input type="number" id="low-price" class="form-control" step="0.0001">
            </div>
            
            <div class="form-group">
                <label>السعر الأعلى (القمة):</label>
                <input type="number" id="high-price" class="form-control" step="0.0001">
            </div>
            
            <button class="submit-btn" onclick="calculateFibonacci()">حساب</button>
            
            <div id="fib-results" class="results" style="margin-top: 2rem;"></div>
        </div>
    `;
    
    openModal('fibonacci-modal');
}

// حساب فيبوناتشي
function calculateFibonacci() {
    const direction = document.getElementById('fib-direction').value;
    const low = parseFloat(document.getElementById('low-price').value);
    const high = parseFloat(document.getElementById('high-price').value);
    
    if (!low || !high) {
        alert('يرجى إدخال جميع القيم');
        return;
    }
    
    const diff = high - low;
    const levels = {
        '0%': low,
        '23.6%': direction === 'low-high' ? low + diff * 0.236 : high - diff * 0.236,
        '38.2%': direction === 'low-high' ? low + diff * 0.382 : high - diff * 0.382,
        '50%': direction === 'low-high' ? low + diff * 0.5 : high - diff * 0.5,
        '61.8%': direction === 'low-high' ? low + diff * 0.618 : high - diff * 0.618,
        '78.6%': direction === 'low-high' ? low + diff * 0.786 : high - diff * 0.786,
        '100%': high
    };
    
    let resultsHTML = '<h4>مستويات فيبوناتشي:</h4>';
    resultsHTML += '<div class="levels-grid">';
    
    for (const [level, price] of Object.entries(levels)) {
        resultsHTML += `
            <div class="level-card">
                <div class="level-name">${level}</div>
                <div class="level-price">${price.toFixed(4)}</div>
            </div>
        `;
    }
    
    resultsHTML += '</div>';
    document.getElementById('fib-results').innerHTML = resultsHTML;
}

// فتح حاسبة المخاطرة
function openRiskCalculator() {
    const modalBody = document.querySelector('#risk-modal .modal-body');
    modalBody.innerHTML = `
        <div class="calculator">
            <div class="form-group">
                <label>رأس المال ($):</label>
                <input type="number" id="capital" class="form-control" min="0">
            </div>
            
            <div class="form-group">
                <label>نسبة المخاطرة (%):</label>
                <input type="number" id="risk-percent" class="form-control" min="0" max="100" value="2">
            </div>
            
            <div class="form-group">
                <label>سعر الدخول:</label>
                <input type="number" id="entry-price" class="form-control" step="0.0001">
            </div>
            
            <div class="form-group">
                <label>سعر وقف الخسارة:</label>
                <input type="number" id="stop-loss" class="form-control" step="0.0001">
            </div>
            
            <button class="submit-btn" onclick="calculateRisk()">حساب</button>
            
            <div id="risk-results" class="results" style="margin-top: 2rem;"></div>
        </div>
    `;
    
    openModal('risk-modal');
}

// حساب المخاطرة
function calculateRisk() {
    const capital = parseFloat(document.getElementById('capital').value);
    const riskPercent = parseFloat(document.getElementById('risk-percent').value);
    const entry = parseFloat(document.getElementById('entry-price').value);
    const stopLoss = parseFloat(document.getElementById('stop-loss').value);
    
    if (!capital || !riskPercent || !entry || !stopLoss) {
        alert('يرجى إدخال جميع القيم');
        return;
    }
    
    const riskAmount = capital * (riskPercent / 100);
    const points = Math.abs(entry - stopLoss);
    const positionSize = riskAmount / points;
    
    document.getElementById('risk-results').innerHTML = `
        <h4>نتائج الحساب:</h4>
        <div class="result-card">
            <p><strong>مبلغ المخاطرة:</strong> $${riskAmount.toFixed(2)}</p>
            <p><strong>نقاط الخطر:</strong> ${points.toFixed(4)}</p>
            <p><strong>حجم الصفقة:</strong> ${positionSize.toFixed(2)}</p>
            <p class="warning">⚠️ إذا خسرت الصفقة، ستخسر $${riskAmount.toFixed(2)} (${riskPercent}% من رأس المال)</p>
        </div>
    `;
}

// تفعيل البريميوم
function showPremiumModal() {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول أولاً', 'warning');
        showPage('account');
        return;
    }
    
    openModal('premium-modal');
}

function activatePremium() {
    const code = document.getElementById('premium-code').value.trim();
    
    if (!code) {
        showToast('يرجى إدخال كود التفعيل', 'error');
        return;
    }
    
    // التحقق من الكود
    if (premiumCodes[code] && !premiumCodes[code].used) {
        currentUser.isPremium = true;
        currentUser.premiumExpiry = premiumCodes[code].expiry;
        premiumCodes[code].used = true;
        
        saveToStorage('currentUser', currentUser);
        saveToStorage('premium_codes', premiumCodes);
        updateUsers();
        
        showToast('تم تفعيل البريميوم بنجاح!', 'success');
        closeModal('premium-modal');
        updateUI();
    } else {
        showToast('كود التفعيل غير صالح أو مستخدم مسبقاً', 'error');
    }
}

// التحقق من تسجيل الدخول التلقائي للمدير
function checkAdminAutoLogin() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.email === 'mstrhmd2005@gmail.com') {
            window.location.href = 'admin.html';
        }
    }
}

// إظهار رسائل Toast
function showToast(message, type) {
    // إنشاء عنصر Toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 9999;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// الحفظ في localStorage
function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// التحميل من localStorage
function loadFromStorage() {
    const storedUsers = localStorage.getItem('users');
    const storedCodes = localStorage.getItem('premium_codes');
    
    if (storedUsers) users = JSON.parse(storedUsers);
    if (storedCodes) premiumCodes = JSON.parse(storedCodes);
}

// تحديث بيانات المستخدمين
function updateUsers() {
    if (currentUser) {
        const index = users.findIndex(u => u.email === currentUser.email);
        if (index !== -1) {
            users[index] = currentUser;
        } else {
            users.push(currentUser);
        }
        saveToStorage('users', users);
    }
}

// تحميل المستخدمين
function loadUsers() {
    const stored = localStorage.getItem('users');
    if (stored) {
        users = JSON.parse(stored);
    }
}

// إغلاق النوافذ
function closeVideoModal() { closeModal('video-modal'); }
function closePremiumModal() { closeModal('premium-modal'); }
function closeFibonacciModal() { closeModal('fibonacci-modal'); }
function closeRiskModal() { closeModal('risk-modal'); }

// إظهار نموذج التسجيل
function showRegisterForm() {
    const loginSection = document.getElementById('login-section');
    loginSection.innerHTML = `
        <div class="login-card">
            <h3>إنشاء حساب جديد</h3>
            <form id="register-form">
                <div class="form-group">
                    <label for="reg-name">الاسم الكامل</label>
                    <input type="text" id="reg-name" required>
                </div>
                <div class="form-group">
                    <label for="reg-username">اسم المستخدم</label>
                    <input type="text" id="reg-username" required pattern="[A-Za-zأ-ي][A-Za-zأ-ي0-9]{3,}">
                    <small>يجب أن يبدأ بحرف ويحتوي على الأقل 4 أحرف</small>
                </div>
                <div class="form-group">
                    <label for="reg-email">البريد الإلكتروني</label>
                    <input type="email" id="reg-email" required>
                </div>
                <div class="form-group">
                    <label for="reg-password">كلمة المرور</label>
                    <input type="password" id="reg-password" required minlength="6">
                </div>
                <div class="form-group">
                    <label for="reg-confirm">تأكيد كلمة المرور</label>
                    <input type="password" id="reg-confirm" required>
                </div>
                <button type="submit" class="submit-btn">إنشاء حساب</button>
            </form>
            <p class="switch-form" onclick="showLoginForm()">
                لديك حساب؟ سجل الدخول
            </p>
        </div>
    `;
    
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

// إظهار نموذج تسجيل الدخول
function showLoginForm() {
    const loginSection = document.getElementById('login-section');
    loginSection.innerHTML = `
        <div class="login-card">
            <h3>تسجيل الدخول</h3>
            <form id="login-form">
                <div class="form-group">
                    <label for="login-email">البريد الإلكتروني</label>
                    <input type="email" id="login-email" required>
                </div>
                <div class="form-group">
                    <label for="login-password">كلمة المرور</label>
                    <input type="password" id="login-password" required>
                </div>
                <button type="submit" class="submit-btn">تسجيل الدخول</button>
            </form>
            <p class="switch-form" onclick="showRegisterForm()">
                ليس لديك حساب؟ سجل الآن
            </p>
        </div>
    `;
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

// التعامل مع التسجيل
function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('reg-name').value;
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    
    // التحقق من البيانات
    if (password !== confirm) {
        showToast('كلمات المرور غير متطابقة', 'error');
        return;
    }
    
    if (!username.match(/^[A-Za-zأ-ي][A-Za-zأ-ي0-9]{3,}$/)) {
        showToast('اسم المستخدم غير صالح', 'error');
        return;
    }
    
    // التحقق من عدم وجود المستخدم
    if (users.find(u => u.email === email)) {
        showToast('البريد الإلكتروني مسجل مسبقاً', 'error');
        return;
    }
    
    if (users.find(u => u.username === username)) {
        showToast('اسم المستخدم مسجل مسبقاً', 'error');
        return;
    }
    
    // إنشاء المستخدم الجديد
    const newUser = {
        id: Date.now(),
        name,
        username,
        email,
        password,
        avatar: 'https://j.top4top.io/p_3670reejg0.png',
        isPremium: false,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    currentUser = newUser;
    
    saveToStorage('users', users);
    saveToStorage('currentUser', currentUser);
    
    showToast('تم إنشاء الحساب بنجاح', 'success');
    showProfile();
}

// تحميل المزيد من الدورات من ملف الدورات
function loadFullCourses() {
    // هذه الدالة يمكن توسيعها لتحميل جميع الدورات من ملف الدورات
    // حالياً نستخدم البيانات الأولية فقط
    return courses;
}