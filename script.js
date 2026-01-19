// ===== بيانات التطبيق =====
class AppManager {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.theme = 'light';
        this.notifications = [];
        this.messages = [];
        this.courses = [];
        this.isLoggedIn = false;
        this.prevPage = null;
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupTemplates();
        this.checkAuth();
        this.initTheme();
        this.updateUI();
        this.hideLoading();
    }

    loadData() {
        // تحميل المستخدم الحالي
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.isLoggedIn = true;
        }

        // تحميل الإعدادات
        const settings = localStorage.getItem('appSettings');
        if (settings) {
            const { theme } = JSON.parse(settings);
            this.theme = theme || 'light';
        }

        // تحميل الرسائل
        const messages = localStorage.getItem('userMessages');
        if (messages) {
            this.messages = JSON.parse(messages);
        }

        // تحميل الدورات
        this.loadCourses();
    }

    saveData() {
        if (this.currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
        
        const settings = { theme: this.theme };
        localStorage.setItem('appSettings', JSON.stringify(settings));
        
        localStorage.setItem('userMessages', JSON.stringify(this.messages));
    }

    loadCourses() {
        // الدورات المحددة
        this.courses = [
            {
                id: 1,
                title: "كورس التداول من صفر الى الاحتراف",
                instructor: "حيدر الجنابي",
                instructorLinks: {
                    telegram: "https://t.me/haideraljanabi90",
                    channel: "https://t.me/thesuccessfulwayarabs"
                },
                videos: [
                    { id: "G8eeqb82KOM", title: "مقدمة الكورس", duration: "11:46" },
                    { id: "vUeyLqB82CM", title: "الدرس الأول: سمارت موني كونسبت", duration: "15:30" },
                    { id: "CrzVLmflQgQ", title: "الدرس الثاني: سمارت موني", duration: "18:45" }
                ]
            },
            {
                id: 2,
                title: "أفضل دورة لتعلم SMC في الوطن العربي",
                instructor: "الدكتور محمد مهدي",
                instructorLinks: {
                    telegram: "https://t.me/ExaadoSupport",
                    channel: "https://t.me/Exaado"
                },
                videos: [
                    { id: "eb2y-Kbd_N8", title: "مقدمة الدورة", duration: "20:15" },
                    { id: "XSPuivsDNd4", title: "المستوى الأول مجاني", duration: "22:30" }
                ]
            }
        ];
    }

    initTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const icon = document.querySelector('#themeToggle i');
        icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        this.saveData();
        this.showNotification('تم تغيير الوضع بنجاح', 'success');
    }

    setupEventListeners() {
        // تغيير الصفحات
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navigateTo(page);
            });
        });

        // الروابط في القائمة الجانبية
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                const page = href.substring(1);
                this.navigateTo(page);
                this.closeSideNav();
            });
        });

        // أزرار التحكم
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('menuToggle').addEventListener('click', () => this.openSideNav());
        document.getElementById('closeNav').addEventListener('click', () => this.closeSideNav());
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('supportBubble').addEventListener('click', () => this.openSupport());
        document.getElementById('closeSupport').addEventListener('click', () => this.closeSupport());
        
        // زر ابدأ التعلم
        document.addEventListener('click', (e) => {
            if (e.target.id === 'startLearning') {
                this.navigateTo('courses');
            }
        });

        // مصادقة
        document.querySelectorAll('.switch-tab').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.getAttribute('data-tab');
                this.switchAuthTab(tab);
            });
        });

        document.getElementById('closeAuth').addEventListener('click', () => this.closeAuthModal());
        document.getElementById('loginForm').addEventListener('submit', (e) => this.login(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.register(e));

        // تغيير تبويبات المصادقة
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchAuthTab(tab);
            });
        });

        // رفع الصورة
        document.getElementById('profileImage').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('fileName').textContent = file.name;
            }
        });

        // تأكيدات
        document.getElementById('confirmCancel').addEventListener('click', () => this.hideConfirm());
        document.getElementById('confirmOk').addEventListener('click', () => this.confirmAction());

        // إغلاق النوافذ بالنقر خارجها
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('auth-modal')) {
                this.closeAuthModal();
            }
            if (e.target.classList.contains('confirm-modal')) {
                this.hideConfirm();
            }
            if (e.target.classList.contains('support-modal')) {
                this.closeSupport();
            }
        });

        // منع الإغلاق عند النقر داخل المحتوى
        document.querySelectorAll('.auth-content, .confirm-content, .support-header, .support-body').forEach(el => {
            el.addEventListener('click', (e) => e.stopPropagation());
        });

        // تحميل الصفحة عند التمرير
        window.addEventListener('popstate', () => {
            const page = window.location.hash.substring(1) || 'home';
            this.navigateTo(page, false);
        });
    }

    setupTemplates() {
        // تحميل القوالب الأساسية
        this.templates = {
            home: document.getElementById('homeTemplate').content,
            courses: document.getElementById('coursesTemplate').content,
            account: this.createAccountTemplate(),
            advanced: this.createAdvancedTemplate(),
            tools: this.createToolsTemplate(),
            support: this.createSupportTemplate(),
            about: this.createAboutTemplate(),
            privacy: this.createPrivacyTemplate()
        };
    }

    checkAuth() {
        if (!this.isLoggedIn && this.currentPage !== 'home') {
            this.showAuthModal();
        }
    }

    navigateTo(page, pushState = true) {
        if (page === this.currentPage) return;

        // التحقق من الصلاحيات
        if ((page === 'advanced' || page === 'account') && !this.isLoggedIn) {
            this.showAuthModal();
            return;
        }

        // حفظ الصفحة السابقة
        this.prevPage = this.currentPage;
        this.currentPage = page;

        // تحديث العنوان
        document.getElementById('pageTitle').textContent = this.getPageTitle(page);

        // تحديث الروابط النشطة
        this.updateActiveLinks(page);

        // إظهار زر الرجوع إذا لم تكن الصفحة الرئيسية
        document.getElementById('backBtn').style.display = page === 'home' ? 'none' : 'flex';

        // تحميل المحتوى
        this.loadPageContent(page);

        // تحديث التاريخ
        if (pushState) {
            window.history.pushState({ page }, '', `#${page}`);
        }

        // إغلاق القائمة الجانبية
        this.closeSideNav();
    }

    getPageTitle(page) {
        const titles = {
            home: 'اكزم للتداول',
            account: 'حسابي',
            courses: 'الدورات',
            advanced: 'المتقدمين',
            tools: 'الأدوات',
            support: 'الدعم الفني',
            about: 'من نحن',
            privacy: 'سياسة الخصوصية'
        };
        return titles[page] || 'اكزم للتداول';
    }

    updateActiveLinks(page) {
        // شريط التنقل السفلي
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });

        // القائمة الجانبية
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${page}`) {
                link.classList.add('active');
            }
        });
    }

    loadPageContent(page) {
        const container = document.getElementById('mainContent');
        const template = this.templates[page];
        
        if (!template) {
            container.innerHTML = '<div class="error-page"><h2>الصفحة غير موجودة</h2></div>';
            return;
        }

        container.innerHTML = '';
        const clone = document.importNode(template, true);
        container.appendChild(clone);

        // تهيئة محتوى الصفحة
        this.initPageContent(page);
    }

    initPageContent(page) {
        switch (page) {
            case 'courses':
                this.initCoursesPage();
                break;
            case 'account':
                this.initAccountPage();
                break;
            case 'advanced':
                this.initAdvancedPage();
                break;
            case 'tools':
                this.initToolsPage();
                break;
            case 'support':
                this.initSupportPage();
                break;
        }
    }

    // ===== إدارة الحساب =====
    login(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        // حساب الإدمن
        if (email === 'mstrhmd2005@gmail.com' && password === 'T1O2K3abot$') {
            // تحويل إلى لوحة الإدمن
            window.location.href = 'admin.html';
            return;
        }

        // البحث عن المستخدم
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // التحقق من الحظر
            if (user.banned) {
                this.showNotification('حسابك محظور من قبل الإدارة', 'error');
                return;
            }

            this.currentUser = {
                name: user.name,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                isPremium: user.isPremium || false,
                joined: user.joined || new Date().toISOString()
            };

            this.isLoggedIn = true;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.closeAuthModal();
            this.updateUI();
            this.showNotification('مرحباً بعودتك!', 'success');
            this.navigateTo('home');
        } else {
            this.showNotification('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
        }
    }

    register(event) {
        event.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const profileImage = document.getElementById('profileImage').files[0];

        // التحقق من صحة البيانات
        if (!name || !username || !email || !password) {
            this.showNotification('يرجى ملء جميع الحقول الإلزامية', 'error');
            return;
        }

        // التحقق من اسم المستخدم
        if (!/^[A-Za-zأ-ي]/.test(username)) {
            this.showNotification('يجب أن يبدأ اسم المستخدم بحرف', 'error');
            return;
        }

        // التحقق من البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('البريد الإلكتروني غير صالح', 'error');
            return;
        }

        // التحقق من عدم وجود حساب بنفس البريد
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.email === email)) {
            this.showNotification('هذا البريد الإلكتروني مسجل بالفعل', 'error');
            return;
        }

        // التحقق من عدم وجود اسم مستخدم مكرر
        if (users.find(u => u.username === username)) {
            this.showNotification('اسم المستخدم هذا موجود بالفعل', 'error');
            return;
        }

        // إنشاء حساب جديد
        const newUser = {
            name,
            username,
            email,
            password,
            profileImage: null,
            isPremium: false,
            banned: false,
            joined: new Date().toISOString()
        };

        // معالجة صورة الحساب
        if (profileImage) {
            const reader = new FileReader();
            reader.onload = (e) => {
                newUser.profileImage = e.target.result;
                this.finalizeRegistration(newUser, users);
            };
            reader.readAsDataURL(profileImage);
        } else {
            this.finalizeRegistration(newUser, users);
        }
    }

    finalizeRegistration(newUser, existingUsers) {
        existingUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(existingUsers));

        this.currentUser = {
            name: newUser.name,
            username: newUser.username,
            email: newUser.email,
            profileImage: newUser.profileImage,
            isPremium: false,
            joined: newUser.joined
        };

        this.isLoggedIn = true;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        this.closeAuthModal();
        this.updateUI();
        this.showNotification('تم إنشاء حسابك بنجاح!', 'success');
        this.navigateTo('home');
    }

    logout() {
        this.showConfirm(
            'تسجيل الخروج',
            'هل أنت متأكد من تسجيل الخروج؟',
            () => {
                this.currentUser = null;
                this.isLoggedIn = false;
                localStorage.removeItem('currentUser');
                this.updateUI();
                this.showNotification('تم تسجيل الخروج بنجاح', 'success');
                this.navigateTo('home');
                this.closeSideNav();
            }
        );
    }

    updateUI() {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');

        if (this.isLoggedIn && this.currentUser) {
            userName.textContent = this.currentUser.name;
            userEmail.textContent = this.currentUser.email;
            if (this.currentUser.profileImage) {
                userAvatar.src = this.currentUser.profileImage;
                userAvatar.style.display = 'block';
            } else {
                userAvatar.src = '';
                userAvatar.style.display = 'none';
            }
        } else {
            userName.textContent = 'زائر';
            userEmail.textContent = 'سجل الدخول للوصول';
            userAvatar.src = '';
            userAvatar.style.display = 'none';
        }
    }

    // ===== واجهة المستخدم =====
    openSideNav() {
        document.getElementById('sideNav').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSideNav() {
        document.getElementById('sideNav').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    openSupport() {
        document.getElementById('supportModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.updateSupportBadge(0);
    }

    closeSupport() {
        document.getElementById('supportModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    showAuthModal() {
        document.getElementById('authModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.switchAuthTab('login');
    }

    closeAuthModal() {
        document.getElementById('authModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    switchAuthTab(tab) {
        // تحديث الأزرار
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tab) {
                btn.classList.add('active');
            }
        });

        // تحديث النماذج
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
            if (form.id === `${tab}Form`) {
                form.classList.add('active');
            }
        });

        // مسح الحقول
        if (tab === 'login') {
            document.getElementById('loginForm').reset();
        } else {
            document.getElementById('registerForm').reset();
            document.getElementById('fileName').textContent = '';
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // إزالة الإشعار تلقائياً بعد 5 ثوان
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showConfirm(title, message, callback) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        this.confirmCallback = callback;
    }

    hideConfirm() {
        document.getElementById('confirmModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.confirmCallback = null;
    }

    confirmAction() {
        if (this.confirmCallback) {
            this.confirmCallback();
        }
        this.hideConfirm();
    }

    goBack() {
        if (this.prevPage) {
            this.navigateTo(this.prevPage);
            this.prevPage = null;
        } else {
            this.navigateTo('home');
        }
    }

    hideLoading() {
        setTimeout(() => {
            document.getElementById('loadingOverlay').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loadingOverlay').style.display = 'none';
            }, 300);
        }, 1000);
    }

    updateSupportBadge(count) {
        const badge = document.getElementById('supportBadge');
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // ===== الصفحات =====
    createAccountTemplate() {
        const template = document.createElement('template');
        template.innerHTML = `
            <section class="page account-page">
                <div class="page-header">
                    <h2><i class="fas fa-user-circle"></i> حسابي</h2>
                    <p>إدارة معلومات حسابك الشخصي</p>
                </div>

                <div class="account-info">
                    <div class="profile-section">
                        <div class="profile-image">
                            <img src="" alt="صورة الحساب" id="accountAvatar">
                            <button class="btn btn-secondary btn-sm" id="changeAvatar">
                                <i class="fas fa-camera"></i> تغيير الصورة
                            </button>
                        </div>
                        <div class="profile-details">
                            <h3 id="accountName"></h3>
                            <p><i class="fas fa-at"></i> <span id="accountUsername"></span></p>
                            <p><i class="fas fa-envelope"></i> <span id="accountEmail"></span></p>
                            <p><i class="fas fa-calendar"></i> عضو منذ <span id="accountJoined"></span></p>
                            <div class="premium-badge" id="premiumBadge" style="display: none;">
                                <i class="fas fa-crown"></i> عضو مميز
                            </div>
                        </div>
                    </div>

                    <div class="account-actions">
                        <button class="btn btn-primary" id="editProfile">
                            <i class="fas fa-edit"></i> تعديل المعلومات
                        </button>
                        <button class="btn btn-secondary" id="changePassword">
                            <i class="fas fa-key"></i> تغيير كلمة المرور
                        </button>
                        <button class="btn btn-danger" id="deleteAccount">
                            <i class="fas fa-trash"></i> حذف الحساب
                        </button>
                    </div>

                    <div class="account-stats">
                        <h3><i class="fas fa-chart-line"></i> إحصائيات</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <i class="fas fa-video"></i>
                                <span>الدورات المشاهدة</span>
                                <strong id="watchedCourses">0</strong>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-clock"></i>
                                <span>ساعات التعلم</span>
                                <strong id="learningHours">0</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
        return template.content;
    }

    createAdvancedTemplate() {
        const template = document.createElement('template');
        template.innerHTML = `
            <section class="page advanced-page">
                <div class="page-header">
                    <h2><i class="fas fa-crown"></i> المحتوى المتقدم</h2>
                    <p>دورات احترافية تتطلب تفعيل الاشتراك المميز</p>
                </div>

                <div class="premium-status" id="premiumStatus">
                    <div class="status-content">
                        <i class="fas fa-gem"></i>
                        <h3>الاشتراك المميز غير مفعل</h3>
                        <p>للدخول إلى المحتوى المتقدم، يرجى تفعيل الاشتراك المميز</p>
                        <button class="btn btn-primary" id="activatePremium">
                            <i class="fas fa-key"></i> تفعيل الاشتراك
                        </button>
                    </div>
                </div>

                <div class="premium-courses" id="premiumCourses" style="display: none;">
                    <!-- المحتوى المتقدم يظهر هنا -->
                </div>

                <div class="activation-form" id="activationForm" style="display: none;">
                    <h3><i class="fas fa-key"></i> تفعيل الاشتراك المميز</h3>
                    <div class="input-group">
                        <label>كود التفعيل</label>
                        <input type="text" id="activationCode" placeholder="أدخل كود التفعيل">
                    </div>
                    <button class="btn btn-success" id="submitActivation">
                        <i class="fas fa-check"></i> تفعيل
                    </button>
                    <button class="btn btn-secondary" id="cancelActivation">
                        إلغاء
                    </button>
                </div>
            </section>
        `;
        return template.content;
    }

    createToolsTemplate() {
        const template = document.createElement('template');
        template.innerHTML = `
            <section class="page tools-page">
                <div class="page-header">
                    <h2><i class="fas fa-tools"></i> أدوات التداول</h2>
                    <p>مجموعة من الأدوات المساعدة للتداول</p>
                </div>

                <div class="tools-container">
                    <div class="tool-card" id="fibonacciCalculator">
                        <i class="fas fa-calculator"></i>
                        <h3>حاسبة فيبوناتشي</h3>
                        <p>حساب مستويات فيبوناتشي للترندات</p>
                    </div>

                    <div class="tool-card" id="riskManagement">
                        <i class="fas fa-chart-pie"></i>
                        <h3>إدارة رأس المال</h3>
                        <p>حساب حجم الصفقة ونسبة المخاطرة</p>
                    </div>

                    <div class="tool-card" id="positionSize">
                        <i class="fas fa-balance-scale"></i>
                        <h3>حجم الصفقة</h3>
                        <p>حساب حجم الصفقة الأمثل</p>
                    </div>
                </div>

                <!-- حاسبة فيبوناتشي -->
                <div class="tool-modal" id="fibonacciModal">
                    <div class="modal-content">
                        <h3><i class="fas fa-calculator"></i> حاسبة فيبوناتشي</h3>
                        <div class="input-group">
                            <label>اتجاه الترند</label>
                            <select id="trendDirection">
                                <option value="up">صاعد (من القاع للقمة)</option>
                                <option value="down">هابط (من القمة للقاع)</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label id="lowLabel">السعر الأدنى (القاع)</label>
                            <input type="number" id="lowPrice" placeholder="أدخل السعر الأدنى">
                        </div>
                        <div class="input-group">
                            <label id="highLabel">السعر الأعلى (القمة)</label>
                            <input type="number" id="highPrice" placeholder="أدخل السعر الأعلى">
                        </div>
                        <button class="btn btn-primary" id="calculateFibonacci">
                            <i class="fas fa-calculator"></i> حساب المستويات
                        </button>
                        <div class="results" id="fibonacciResults"></div>
                    </div>
                </div>

                <!-- إدارة المخاطرة -->
                <div class="tool-modal" id="riskModal">
                    <div class="modal-content">
                        <h3><i class="fas fa-chart-pie"></i> إدارة رأس المال</h3>
                        <div class="input-group">
                            <label>رأس المال ($)</label>
                            <input type="number" id="capital" placeholder="أدخل رأس المال">
                        </div>
                        <div class="input-group">
                            <label>نسبة المخاطرة (%)</label>
                            <input type="number" id="riskPercentage" placeholder="أدخل نسبة المخاطرة" min="0.1" max="10" step="0.1">
                        </div>
                        <div class="input-group">
                            <label>سعر الدخول ($)</label>
                            <input type="number" id="entryPrice" placeholder="أدخل سعر الدخول">
                        </div>
                        <div class="input-group">
                            <label>سعر وقف الخسارة ($)</label>
                            <input type="number" id="stopLoss" placeholder="أدخل سعر وقف الخسارة">
                        </div>
                        <button class="btn btn-primary" id="calculateRisk">
                            <i class="fas fa-calculator"></i> حساب المخاطرة
                        </button>
                        <div class="results" id="riskResults"></div>
                    </div>
                </div>
            </section>
        `;
        return template.content;
    }

    createSupportTemplate() {
        const template = document.createElement('template');
        template.innerHTML = `
            <section class="page support-page">
                <div class="page-header">
                    <h2><i class="fas fa-headset"></i> الدعم الفني</h2>
                    <p>نحن هنا لمساعدتك في أي وقت</p>
                </div>

                <div class="support-content">
                    <div class="contact-info">
                        <h3><i class="fas fa-address-book"></i> معلومات التواصل</h3>
                        <div class="contact-list">
                            <a href="https://wa.me/442031375274" target="_blank" class="contact-item">
                                <i class="fab fa-whatsapp"></i>
                                <div>
                                    <strong>واتساب الدعم</strong>
                                    <span>+44 203 137 5274</span>
                                </div>
                            </a>
                            <a href="https://t.me/ASQ412" target="_blank" class="contact-item">
                                <i class="fab fa-telegram"></i>
                                <div>
                                    <strong>تليجرام المطور</strong>
                                    <span>@ASQ412</span>
                                </div>
                            </a>
                            <a href="https://t.me/pine_Scripts0" target="_blank" class="contact-item">
                                <i class="fab fa-telegram"></i>
                                <div>
                                    <strong>قناة تليجرام</strong>
                                    <span>@pine_Scripts0</span>
                                </div>
                            </a>
                        </div>
                    </div>

                    <div class="faq-section">
                        <h3><i class="fas fa-question-circle"></i> الأسئلة الشائعة</h3>
                        <div class="faq-list">
                            <div class="faq-item">
                                <div class="faq-question">
                                    <span>كيف أشترك في المحتوى المميز؟</span>
                                    <i class="fas fa-chevron-down"></i>
                                </div>
                                <div class="faq-answer">
                                    <p>يمكنك الاشتراك في المحتوى المميز عن طريق الحصول على كود تفعيل من الإدارة.</p>
                                </div>
                            </div>
                            <div class="faq-item">
                                <div class="faq-question">
                                    <span>هل التطبيق مجاني؟</span>
                                    <i class="fas fa-chevron-down"></i>
                                </div>
                                <div class="faq-answer">
                                    <p>نعم، التطبيق مجاني بالكامل مع وجود بعض الميزات الإضافية للاشتراك المميز.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="message-form">
                        <h3><i class="fas fa-envelope"></i> أرسل رسالة</h3>
                        <div class="input-group">
                            <label>الموضوع</label>
                            <input type="text" id="messageSubject" placeholder="موضوع الرسالة">
                        </div>
                        <div class="input-group">
                            <label>الرسالة</label>
                            <textarea id="messageText" rows="4" placeholder="اكتب رسالتك هنا..."></textarea>
                        </div>
                        <button class="btn btn-primary" id="sendMessage">
                            <i class="fas fa-paper-plane"></i> إرسال الرسالة
                        </button>
                    </div>
                </div>
            </section>
        `;
        return template.content;
    }

    createAboutTemplate() {
        const template = document.createElement('template');
        template.innerHTML = `
            <section class="page about-page">
                <div class="page-header">
                    <h2><i class="fas fa-info-circle"></i> من نحن</h2>
                    <p>تعرف على فريق اكزم للتداول</p>
                </div>

                <div class="about-content">
                    <div class="about-card">
                        <h3><i class="fas fa-rocket"></i> مهمتنا</h3>
                        <p>نحن فريق من المطورين والمتداولين المحترفين، نعمل على تقديم أفضل المحتويات التعليمية والأدوات المساعدة لعالم التداول. مهمتنا هي جعل التعلم ممكناً للجميع بجودة عالية وسهولة وصول.</p>
                    </div>

                    <div class="about-card">
                        <h3><i class="fas fa-eye"></i> رؤيتنا</h3>
                        <p>نسعى لأن نكون المنصة الرائدة في تعليم التداول في الوطن العربي، من خلال تقديم محتوى احترافي، أدوات مبتكرة، ودعم فني متميز لمساعدة المتداولين على تحقيق أهدافهم.</p>
                    </div>

                    <div class="about-card">
                        <h3><i class="fas fa-handshake"></i> قيمنا</h3>
                        <ul>
                            <li><i class="fas fa-check-circle"></i> الجودة والاحترافية</li>
                            <li><i class="fas fa-check-circle"></i> الشفافية والوضوح</li>
                            <li><i class="fas fa-check-circle"></i> الابتكار والتطوير المستمر</li>
                            <li><i class="fas fa-check-circle"></i> دعم المستخدم أولوية</li>
                        </ul>
                    </div>

                    <div class="team-section">
                        <h3><i class="fas fa-users"></i> فريق العمل</h3>
                        <p>نعمل كفريق واحد لتحقيق أهدافنا المشتركة في تطوير وتعليم التداول.</p>
                    </div>
                </div>
            </section>
        `;
        return template.content;
    }

    createPrivacyTemplate() {
        const template = document.createElement('template');
        template.innerHTML = `
            <section class="page privacy-page">
                <div class="page-header">
                    <h2><i class="fas fa-shield-alt"></i> سياسة الخصوصية</h2>
                    <p>حماية بياناتك هي أولويتنا</p>
                </div>

                <div class="privacy-content">
                    <div class="privacy-section">
                        <h3><i class="fas fa-database"></i> جمع المعلومات</h3>
                        <p>نقوم بجمع المعلومات الضرورية فقط لتقديم خدمة أفضل، مثل:</p>
                        <ul>
                            <li>الاسم وبيانات الاتصال لتسجيل الدخول</li>
                            <li>سجل النشاط لتحسين الخدمة</li>
                            <li>تفضيلات المستخدم لتخصيص التجربة</li>
                        </ul>
                    </div>

                    <div class="privacy-section">
                        <h3><i class="fas fa-lock"></i> حماية البيانات</h3>
                        <p>نستخدم تقنيات متطورة لحماية بياناتك:</p>
                        <ul>
                            <li>تشفير البيانات الحساسة</li>
                            <li>حماية من الوصول غير المصرح به</li>
                            <li>نسخ احتياطي آمن للبيانات</li>
                        </ul>
                    </div>

                    <div class="privacy-section">
                        <h3><i class="fas fa-share-alt"></i> مشاركة المعلومات</h3>
                        <p>لا نشارك معلوماتك الشخصية مع أي طرف ثالث إلا في الحالات التالية:</p>
                        <ul>
                            <li>بموافقتك الصريحة</li>
                            <li>عندما يطلب القانون ذلك</li>
                            <li>لحماية حقوق وممتلكات المنصة</li>
                        </ul>
                    </div>

                    <div class="privacy-section">
                        <h3><i class="fas fa-user-cog"></i> حقوق المستخدم</h3>
                        <p>لديك الحق في:</p>
                        <ul>
                            <li>الوصول إلى بياناتك الشخصية</li>
                            <li>تصحيح البيانات غير الدقيقة</li>
                            <li>حذف حسابك وبياناتك</li>
                            <li>سحب الموافقة على جمع البيانات</li>
                        </ul>
                    </div>

                    <div class="privacy-note">
                        <p><i class="fas fa-exclamation-circle"></i> آخر تحديث: ${new Date().toLocaleDateString('ar-SA')}</p>
                        <p>لأي استفسارات حول الخصوصية، يرجى التواصل مع الدعم الفني.</p>
                    </div>
                </div>
            </section>
        `;
        return template.content;
    }

    // ===== تهيئة صفحات معينة =====
    initCoursesPage() {
        const container = document.getElementById('coursesContainer');
        if (!container) return;

        container.innerHTML = '';
        
        this.courses.forEach(course => {
            const courseCard = this.createCourseCard(course);
            container.appendChild(courseCard);
        });
    }

    createCourseCard(course) {
        const div = document.createElement('div');
        div.className = 'course-card';
        div.innerHTML = `
            <div class="course-header">
                <h3>${course.title}</h3>
                <div class="course-instructor">
                    <i class="fas fa-user-tie"></i>
                    <span>${course.instructor}</span>
                </div>
            </div>
            <div class="course-body">
                <div class="video-player" id="player-${course.id}">
                    <iframe width="100%" height="100%" 
                            src="https://www.youtube.com/embed/${course.videos[0].id}?controls=1&modestbranding=1&rel=0&showinfo=0"
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen>
                    </iframe>
                </div>
                <div class="video-list">
                    ${course.videos.map((video, index) => `
                        <div class="video-item ${index === 0 ? 'active' : ''}" 
                             data-video-id="${video.id}"
                             data-course-id="${course.id}">
                            <i class="fas fa-play-circle"></i>
                            <div>
                                <div class="video-title">${video.title}</div>
                                <div class="video-duration">${video.duration}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="course-footer">
                <button class="btn btn-secondary btn-course-info">
                    <i class="fas fa-info-circle"></i> معلومات الدورة
                </button>
                <button class="btn btn-primary btn-watch">
                    <i class="fas fa-play"></i> تشغيل
                </button>
            </div>
        `;

        // إضافة مستمعي الأحداث
        setTimeout(() => {
            const videoItems = div.querySelectorAll('.video-item');
            videoItems.forEach(item => {
                item.addEventListener('click', () => {
                    const videoId = item.getAttribute('data-video-id');
                    const courseId = item.getAttribute('data-course-id');
                    this.changeVideo(courseId, videoId, item);
                });
            });

            const infoBtn = div.querySelector('.btn-course-info');
            infoBtn.addEventListener('click', () => this.showCourseInfo(course));

            const watchBtn = div.querySelector('.btn-watch');
            watchBtn.addEventListener('click', () => {
                const firstVideo = course.videos[0];
                this.changeVideo(course.id, firstVideo.id);
            });
        }, 100);

        return div;
    }

    changeVideo(courseId, videoId, clickedItem = null) {
        // تحديث الفيديو النشط
        const player = document.getElementById(`player-${courseId}`);
        if (player) {
            const iframe = player.querySelector('iframe');
            iframe.src = `https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&showinfo=0`;
        }

        // تحديث العناصر النشطة
        if (clickedItem) {
            const allItems = clickedItem.parentElement.querySelectorAll('.video-item');
            allItems.forEach(item => item.classList.remove('active'));
            clickedItem.classList.add('active');
        }
    }

    showCourseInfo(course) {
        const info = `
            <strong>معلومات الدورة:</strong><br>
            ${course.title}<br><br>
            <strong>المدرب:</strong> ${course.instructor}<br>
            <strong>عدد الفيديوهات:</strong> ${course.videos.length}<br><br>
            <strong>روابط المدرب:</strong><br>
            <a href="${course.instructorLinks.telegram}" target="_blank">تليجرام</a> | 
            <a href="${course.instructorLinks.channel}" target="_blank">القناة</a>
        `;
        
        this.showConfirm('معلومات الدورة', info, null);
    }

    initAccountPage() {
        if (!this.isLoggedIn || !this.currentUser) {
            this.showAuthModal();
            return;
        }

        // تحديث معلومات الحساب
        document.getElementById('accountName').textContent = this.currentUser.name;
        document.getElementById('accountUsername').textContent = '@' + this.currentUser.username;
        document.getElementById('accountEmail').textContent = this.currentUser.email;
        
        const joinedDate = new Date(this.currentUser.joined);
        document.getElementById('accountJoined').textContent = joinedDate.toLocaleDateString('ar-SA');
        
        const avatar = document.getElementById('accountAvatar');
        if (this.currentUser.profileImage) {
            avatar.src = this.currentUser.profileImage;
        } else {
            avatar.style.display = 'none';
        }

        // تحديث حالة الاشتراك المميز
        const premiumBadge = document.getElementById('premiumBadge');
        premiumBadge.style.display = this.currentUser.isPremium ? 'flex' : 'none';

        // إضافة مستمعي الأحداث
        document.getElementById('editProfile').addEventListener('click', () => this.editProfile());
        document.getElementById('changePassword').addEventListener('click', () => this.changePassword());
        document.getElementById('deleteAccount').addEventListener('click', () => this.deleteAccount());
        document.getElementById('changeAvatar').addEventListener('click', () => this.changeAvatar());
    }

    editProfile() {
        this.showNotification('هذه الميزة قيد التطوير', 'info');
    }

    changePassword() {
        this.showNotification('هذه الميزة قيد التطوير', 'info');
    }

    deleteAccount() {
        this.showConfirm(
            'حذف الحساب',
            'هل أنت متأكد من حذف حسابك؟ سيتم حذف جميع بياناتك بشكل نهائي.',
            () => {
                // حذف المستخدم من قاعدة البيانات
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const updatedUsers = users.filter(u => u.email !== this.currentUser.email);
                localStorage.setItem('users', JSON.stringify(updatedUsers));
                
                // حذف المستخدم الحالي
                localStorage.removeItem('currentUser');
                this.currentUser = null;
                this.isLoggedIn = false;
                
                this.showNotification('تم حذف حسابك بنجاح', 'success');
                this.navigateTo('home');
            }
        );
    }

    changeAvatar() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.currentUser.profileImage = event.target.result;
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    
                    // تحديث الصورة في الواجهة
                    document.getElementById('accountAvatar').src = this.currentUser.profileImage;
                    document.getElementById('accountAvatar').style.display = 'block';
                    document.getElementById('userAvatar').src = this.currentUser.profileImage;
                    
                    // تحديث قاعدة البيانات
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const userIndex = users.findIndex(u => u.email === this.currentUser.email);
                    if (userIndex !== -1) {
                        users[userIndex].profileImage = this.currentUser.profileImage;
                        localStorage.setItem('users', JSON.stringify(users));
                    }
                    
                    this.showNotification('تم تحديث صورة الحساب', 'success');
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    initAdvancedPage() {
        if (!this.isLoggedIn) {
            this.showAuthModal();
            return;
        }

        const premiumStatus = document.getElementById('premiumStatus');
        const premiumCourses = document.getElementById('premiumCourses');
        const activationForm = document.getElementById('activationForm');

        if (this.currentUser.isPremium) {
            premiumStatus.style.display = 'none';
            premiumCourses.style.display = 'block';
            this.loadPremiumCourses();
        } else {
            premiumStatus.style.display = 'block';
            premiumCourses.style.display = 'none';
            activationForm.style.display = 'none';
        }

        // إضافة مستمعي الأحداث
        const activateBtn = document.getElementById('activatePremium');
        if (activateBtn) {
            activateBtn.addEventListener('click', () => {
                activationForm.style.display = 'block';
                premiumStatus.style.display = 'none';
            });
        }

        const submitBtn = document.getElementById('submitActivation');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.activatePremium());
        }

        const cancelBtn = document.getElementById('cancelActivation');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                activationForm.style.display = 'none';
                premiumStatus.style.display = 'block';
            });
        }
    }

    activatePremium() {
        const code = document.getElementById('activationCode').value.trim();
        
        if (!code) {
            this.showNotification('يرجى إدخال كود التفعيل', 'error');
            return;
        }

        // التحقق من الأكواد المخزنة
        const codes = JSON.parse(localStorage.getItem('activationCodes') || '[]');
        const validCode = codes.find(c => c.code === code && c.active && c.usedCount < c.maxUses);

        if (validCode) {
            // تفعيل الاشتراك
            this.currentUser.isPremium = true;
            validCode.usedCount++;
            validCode.users.push(this.currentUser.email);
            
            // حفظ التغييرات
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            localStorage.setItem('activationCodes', JSON.stringify(codes));
            
            // تحديث قاعدة بيانات المستخدمين
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.email === this.currentUser.email);
            if (userIndex !== -1) {
                users[userIndex].isPremium = true;
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            this.showNotification('تم تفعيل الاشتراك المميز بنجاح!', 'success');
            this.initAdvancedPage();
        } else {
            this.showNotification('كود التفعيل غير صالح أو منتهي الصلاحية', 'error');
        }
    }

    loadPremiumCourses() {
        const container = document.getElementById('premiumCourses');
        if (!container) return;

        container.innerHTML = `
            <div class="course-card">
                <div class="course-header">
                    <h3>كورس ICT من الصفر للمبتدئين</h3>
                    <div class="course-instructor">
                        <i class="fas fa-user-tie"></i>
                        <span>محمد سماره</span>
                    </div>
                </div>
                <div class="course-body">
                    <p>كورس متقدم في استراتيجية ICT للتداول</p>
                    <div class="premium-features">
                        <h4><i class="fas fa-star"></i> مميزات الكورس:</h4>
                        <ul>
                            <li>15 درساً متقدماً</li>
                            <li>أدوات تحليل احترافية</li>
                            <li>تمارين عملية</li>
                            <li>دعم مباشر</li>
                        </ul>
                    </div>
                </div>
                <div class="course-footer">
                    <button class="btn btn-primary" id="startPremiumCourse">
                        <i class="fas fa-play"></i> بدء التعلم
                    </button>
                </div>
            </div>
        `;

        const startBtn = document.getElementById('startPremiumCourse');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.showNotification('يتم تحميل المحتوى المتقدم...', 'info');
            });
        }
    }

    initToolsPage() {
        // حاسبة فيبوناتشي
        const fibonacciCard = document.getElementById('fibonacciCalculator');
        if (fibonacciCard) {
            fibonacciCard.addEventListener('click', () => this.openFibonacciCalculator());
        }

        // إدارة المخاطرة
        const riskCard = document.getElementById('riskManagement');
        if (riskCard) {
            riskCard.addEventListener('click', () => this.openRiskManagement());
        }

        // حجم الصفقة
        const positionCard = document.getElementById('positionSize');
        if (positionCard) {
            positionCard.addEventListener('click', () => {
                this.showNotification('هذه الميزة قيد التطوير', 'info');
            });
        }

        // إعدادات حاسبة فيبوناتشي
        const trendSelect = document.getElementById('trendDirection');
        if (trendSelect) {
            trendSelect.addEventListener('change', () => {
                const isUp = trendSelect.value === 'up';
                document.getElementById('lowLabel').textContent = isUp ? 'السعر الأدنى (القاع)' : 'السعر الأعلى (القمة)';
                document.getElementById('highLabel').textContent = isUp ? 'السعر الأعلى (القمة)' : 'السعر الأدنى (القاع)';
            });
        }

        const calcFibonacciBtn = document.getElementById('calculateFibonacci');
        if (calcFibonacciBtn) {
            calcFibonacciBtn.addEventListener('click', () => this.calculateFibonacci());
        }

        // إعدادات إدارة المخاطرة
        const calcRiskBtn = document.getElementById('calculateRisk');
        if (calcRiskBtn) {
            calcRiskBtn.addEventListener('click', () => this.calculateRisk());
        }
    }

    openFibonacciCalculator() {
        document.getElementById('fibonacciModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    openRiskManagement() {
        document.getElementById('riskModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    calculateFibonacci() {
        const direction = document.getElementById('trendDirection').value;
        const low = parseFloat(document.getElementById('lowPrice').value);
        const high = parseFloat(document.getElementById('highPrice').value);

        if (!low || !high) {
            this.showNotification('يرجى إدخال جميع الأسعار', 'error');
            return;
        }

        if (low >= high) {
            this.showNotification('السعر الأدنى يجب أن يكون أقل من السعر الأعلى', 'error');
            return;
        }

        const range = high - low;
        const levels = {
            '0%': direction === 'up' ? low : high,
            '23.6%': direction === 'up' ? low + range * 0.236 : high - range * 0.236,
            '38.2%': direction === 'up' ? low + range * 0.382 : high - range * 0.382,
            '50%': direction === 'up' ? low + range * 0.5 : high - range * 0.5,
            '61.8%': direction === 'up' ? low + range * 0.618 : high - range * 0.618,
            '78.6%': direction === 'up' ? low + range * 0.786 : high - range * 0.786,
            '100%': direction === 'up' ? high : low
        };

        let results = '<h4>مستويات فيبوناتشي:</h4>';
        for (const [level, price] of Object.entries(levels)) {
            results += `<div class="result-item">
                <span>${level}</span>
                <strong>${price.toFixed(4)}</strong>
            </div>`;
        }

        document.getElementById('fibonacciResults').innerHTML = results;
    }

    calculateRisk() {
        const capital = parseFloat(document.getElementById('capital').value);
        const riskPercentage = parseFloat(document.getElementById('riskPercentage').value);
        const entryPrice = parseFloat(document.getElementById('entryPrice').value);
        const stopLoss = parseFloat(document.getElementById('stopLoss').value);

        if (!capital || !riskPercentage || !entryPrice || !stopLoss) {
            this.showNotification('يرجى إدخال جميع القيم', 'error');
            return;
        }

        if (riskPercentage > 10) {
            this.showNotification('نسبة المخاطرة يجب ألا تتجاوز 10%', 'warning');
        }

        const riskAmount = capital * (riskPercentage / 100);
        const priceDifference = Math.abs(entryPrice - stopLoss);
        const positionSize = riskAmount / priceDifference;

        let results = '<h4>نتائج الحساب:</h4>';
        results += `<div class="result-item">
            <span>مبلغ المخاطرة</span>
            <strong>${riskAmount.toFixed(2)} $</strong>
        </div>`;
        results += `<div class="result-item">
            <span>فرق السعر</span>
            <strong>${priceDifference.toFixed(4)}</strong>
        </div>`;
        results += `<div class="result-item">
            <span>حجم الصفقة</span>
            <strong>${positionSize.toFixed(2)} وحدة</strong>
        </div>`;
        results += `<div class="result-item">
            <span>قيمة الصفقة</span>
            <strong>${(positionSize * entryPrice).toFixed(2)} $</strong>
        </div>`;

        document.getElementById('riskResults').innerHTML = results;
    }

    initSupportPage() {
        // إرسال الرسائل
        const sendBtn = document.getElementById('sendMessage');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendSupportMessage());
        }

        // الأسئلة الشائعة
        const faqItems = document.querySelectorAll('.faq-question');
        faqItems.forEach(item => {
            item.addEventListener('click', () => {
                const answer = item.nextElementSibling;
                const icon = item.querySelector('i');
                
                if (answer.style.maxHeight) {
                    answer.style.maxHeight = null;
                    icon.className = 'fas fa-chevron-down';
                } else {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    icon.className = 'fas fa-chevron-up';
                }
            });
        });
    }

    sendSupportMessage() {
        const subject = document.getElementById('messageSubject').value.trim();
        const text = document.getElementById('messageText').value.trim();

        if (!subject || !text) {
            this.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }

        // حفظ الرسالة محلياً
        const messages = JSON.parse(localStorage.getItem('supportMessages') || '[]');
        messages.push({
            id: Date.now(),
            subject,
            text,
            date: new Date().toISOString(),
            from: this.currentUser ? this.currentUser.email : 'زائر',
            read: false
        });
        
        localStorage.setItem('supportMessages', JSON.stringify(messages));
        
        document.getElementById('messageSubject').value = '';
        document.getElementById('messageText').value = '';
        
        this.showNotification('تم إرسال رسالتك بنجاح', 'success');
    }
}

// ===== بدء التطبيق =====
document.addEventListener('DOMContentLoaded', () => {
    const app = new AppManager();
    app.init();
    
    // إضافة CSS للرسوم المتحركة
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .faq-answer {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .result-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid var(--border-color);
        }
        
        .result-item:last-child {
            border-bottom: none;
        }
        
        .tool-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: none;
            z-index: 1002;
            padding: 20px;
            overflow-y: auto;
        }
        
        .modal-content {
            background: var(--card-color);
            border-radius: var(--border-radius);
            padding: 25px;
            max-width: 400px;
            margin: 0 auto;
        }
    `;
    document.head.appendChild(style);
});