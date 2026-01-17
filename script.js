import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, update, remove, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentUser = null;
let isDragging = false;
let currentX = 0;
let currentY = 0;
let initialX = 0;
let initialY = 0;

const courses = {
    course1: {
        title: "كورس التداول من صفر الى الاحتراف",
        instructor: "حيدر الجنابي",
        channel: "https://t.me/thesuccessfulwayarabs",
        account: "https://t.me/haideraljanabi90",
        videos: [
            { title: "دورة سمارت موني كونسبت الحلقه الاولى للمبتدئين", id: "G8eeqb82KOM" },
            { title: "الدرس الثاني من كورس الاموال الذكيه", id: "vUeyLqB82CM" },
            { title: "الدرس الثالث ترابط الفريمات من كورس الاموال الذكيه", id: "CrzVLmflQgQ" }
        ]
    },
    course2: {
        title: "أفضل دورة لتعلم SMC في الوطن العربي",
        instructor: "الدكتور محمد مهدي",
        channel: "https://t.me/Exaado",
        account: "https://t.me/ExaadoSupport",
        videos: [
            { title: "مقدمة هامة لدورة SMC Exaado", id: "eb2y-Kbd_N8" },
            { title: "لماذا المستوي الأول مجاني", id: "XSPuivsDNd4" },
            { title: "هل علم SMC أفضل علم لتحقيق الارباح بالفوركس", id: "cWx_GkB2htE" },
            { title: "تأسيس SMC درس1 الشموع اليابانية", id: "pQsk2N8j08I" },
            { title: "تأسيس SMC الدرس2 هيكلية الشموع", id: "C1qDxNJJbbI" },
            { title: "تأسيس SMC الدرس3 الغلبة لمن", id: "fH0vP9NNuug" },
            { title: "تأسيس SMC الدرس4 قمم وقيعان الهيكل", id: "QmhYCHTkGPU" },
            { title: "تأسيس SMC درس5 كيف تتكون اتجاهات السوق", id: "h9JXmwltHvw" },
            { title: "تأسيس SMC درس6 تطبيق عملي على اتجاهات السوق", id: "R08Q9wj0vHw" },
            { title: "تأسيس SMC الدرس7 الاتجاهات الرئيسية والداخلية", id: "vkEgojBoLO4" },
            { title: "تأسيس SMC الدرس8 تطبيق عملي على الاتجاه الرئيسي والداخلي", id: "ITKrEnK152M" },
            { title: "الدرس1 الحافز Level 2 Inducment IDM", id: "ICJbnDo20mI" },
            { title: "الدرس2 شروط Level2 lnducment IDM", id: "sKfoeLGsQUY" },
            { title: "الدرس3 تطبيق عملي لاستخراج Level 2 IDM", id: "U1Alwc74Ap0" },
            { title: "الدرس4 تطبيق عملي على كل ما سبق Level 2", id: "IdkFy19mPag" }
        ]
    },
    course3: {
        title: "الكورس السداسي في احتراف التحليل الفني",
        instructor: "حيدر تريدنك",
        channel: "https://t.me/tradaying",
        account: null,
        videos: [
            { title: "مقدمة الكورس السداسي احتراف التحليل الفني في كوكب التداول", id: "pNLb-3Nrjv0" },
            { title: "شرح الشمعه اليابانية بالتفصيل الكورس السداسي 1/1", id: "QEMB6XnoAPU" },
            { title: "شرح القمم والقيعان واهميتها في التحليل الفني 2/1", id: "SC9IA6y0mLo" },
            { title: "علم تحديد الاتجاه في الاسواق المالية الكورس السداسي 3/1", id: "SL0sab2OsPQ" },
            { title: "علم تحديد الاتجاه الترند الفرعي في الاسواق الكورس السداسي 4/1", id: "vdhBbWv7P8Q" },
            { title: "علم تحديد الاتجاه في الاسواق المالية المتوسط المتحرك200 الكورس السداسي 5/1", id: "qMSe7tjnkE0" },
            { title: "الدعم الثابت ماهو وكيف نحدده بشكل دقيق الكورس السداسي 6/1", id: "4CNWWp2toNI" },
            { title: "المقاومة الثابته ماهي وكيف نحددها بشكل دقيق الكورس السداسي 7/1", id: "FMQG-iud_3k" },
            { title: "عملية الاستبدال بين دعم ومقاومة في الاسواق الكورس السداسي 8/1", id: "jEOCbIDFagE" },
            { title: "الدعم والمقاومات الديناميكية المتحركة الكورس السداسي 9/1", id: "hsWQxsmF7Z4" },
            { title: "الدعوم والمقاومات الديناميكية المتحركة الكورس السداسي 10/1", id: "r0dtL2Eey34" },
            { title: "الدعم والمقاومات على طريقة اعضم محللين العالم شبه الديناميكيه الكورس السداسي 11/1", id: "S-PceOrWCVc" },
            { title: "تحديد الدعوم والمقاومات على طريقة اعضم محللين التاريخ القنوات السعرية الكورس السداسي 12/1", id: "X7aBNS3fj3E" },
            { title: "تحديد الدعوم والمقاومات على طريقة اعضم محللين التاريخ القنوات السعرية الكورس السداسي 13/1", id: "gsMhtEVN8us" },
            { title: "قراءة الحالة النفسية في السوق عن طريق الشموع اليابانية انماط الشموع اليابانية الكورس السداسي 14/1", id: "ECC5erFed88" },
            { title: "اساسيات البرايس اكشن قراءة الحالة النفسية في السوق الكورس السداسي 15/1", id: "dh4OZDqZohA" },
            { title: "التصحيح والكسر والاختراق واعادة الاختبار في التحليل الفني الكورس السداسي 1/2", id: "wfidL8peRxA" },
            { title: "تتبع البنوك والحيتان في الاسواق المالية معلومات بآلاف الدولارات الكورس السداسي 2/2", id: "evnMF07iHfA" },
            { title: "تأكيد الاختراق الحقيقي وتجنب الاختراق الوهمي بالتحليل الفني عن طريق الفوليوم الكورس السداسي 3/2", id: "qfsu98cAwaM" },
            { title: "تأكيد الكسر الحقيقي وتجنب الكسر الوهمي بالتحليل الفني عن طريق الفوليوم الكورس السداسي 4/2", id: "dhpeq_sfy_k" },
            { title: "البرايس اكشن النوع الاول تعلم بطريقة جديدة الكورس السداسي 1/3", id: "6dH93cY8G7Y" },
            { title: "البرايس اكشن المتحرك النوع الثاني تعلم بطريقة جديدة الكورس السداسي 2/3", id: "C_4NsWODb7c" },
            { title: "الفيبوناتشي والبرايس اكشن النوع الثالث 3/3 تعلم بطريقه الكورس السداسي", id: "Iv-oyMEzR74" },
            { title: "مؤشر EMA Stochastic اهم مؤشرين في وضع اي استراتيجية الحلقه الاخيرة من الكورس السداسي", id: "IsW3t13FfTE" }
        ]
    },
    course4: {
        title: "كورس ICT من الصفر للمبتدئين",
        instructor: "محمد سماره",
        channel: "https://t.me/mos_rar",
        account: "https://t.me/rar42rar",
        premium: true,
        videos: [
            { title: "بعد 4 سنين تداول كورس ICT من الصفر للمبتدئين الدرس الاول", id: "B_Cniskclho" },
            { title: "لا تصدق ان السوق يتحرك عشوائيا تعرف على BSL و SSL واكشف الحقيقه الدرس 2", id: "P02iX2KGYpc" },
            { title: "كيف يصنع السوق مناطق سيوله كاذبه لخداعك افهم ERL و IRL بوضوح الدرس 3", id: "sRBlms-TcMM" },
            { title: "هل تغير هيكل السوق يعني فرصه ربح تعرف علي MSS وBMS بوضوح الدرس 4", id: "p-tI_Opbstk" },
            { title: "كيف تستخدم فيبوناتشي و OTE لتحديد افضل نقاط الدخول والخروج الدرس 5", id: "Hd4ogoQabuA" },
            { title: "شرح مختلف يخليك تفهم السوق من جذوره الدرس FVG 6", id: "j-z1_kvtS4M" },
            { title: "كيف تكتشف الفجوات غير المتوازنه وتتفوق على IFVG السوق الدرس 7", id: "L897X5SrnaE" },
            { title: "سر اختيار افضل نقاط الانعكاس في السوق BPR FVG الدرس 8", id: "VFsQ9mNebNk" },
            { title: "اداة سرية يستخدمها الحيتان لدخول السوق شرح اختلال الحجم Volume Imbalance بأسلوب ICT الدرس 9", id: "rWx1zIaPhAw" },
            { title: "كيف تكتشف الكسر الحقيقي في السوق شرح BSG خطوه بخطوه بأسلوب ICT الدرس 10", id: "Uws5QjN2Dr4" },
            { title: "شرح جميع انواع الـ FVG في استراتيجيه ICT دليل شامل للمبتدئين خطوه بخطوه الدرس 11", id: "ME6rPGFoWbU" },
            { title: "عرفت OB بس هل عرفت +OB و -OB الفروقات المهمه اللي تغير قراراتك الدرس 12", id: "2hGENxNVCDc" },
            { title: "ما حد علمك الـ BB بهالطريقة الفرصه بيدك الدرس 13", id: "x0OgWDaPhtc" },
            { title: "اكتشف سر الـ Rejection Block قبل ما يتحرك السوق الدرس 14", id: "GCaYsTLRs04" },
            { title: "ختام كورس اساس ICT اكتشف قوة SETAB +A الدرس 15", id: "kD8Xs6qzgYc" }
        ]
    }
};

window.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initDragSupport();
});

function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainScreen();
        loadUserMessages();
    } else {
        showAuthScreen();
    }
}

function showAuthScreen() {
    document.getElementById('authScreen').classList.add('active');
    document.getElementById('mainScreen').classList.remove('active');
}

function showMainScreen() {
    document.getElementById('authScreen').classList.remove('active');
    document.getElementById('mainScreen').classList.add('active');
    updateUserInfo();
    checkIfAdmin();
    navigateTo('home');
}

window.showLogin = function() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
}

window.showRegister = function() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
}

window.login = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('الرجاء ملء جميع الحقول');
        return;
    }

    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
        const users = snapshot.val();
        let foundUser = null;
        
        for (let userId in users) {
            const user = users[userId];
            if (user.email === email && user.password === password) {
                if (user.banned) {
                    alert('تم حظرك من قبل الادمن');
                    return;
                }
                foundUser = { id: userId, ...user };
                break;
            }
        }
        
        if (foundUser) {
            currentUser = foundUser;
            localStorage.setItem('currentUser', JSON.stringify(foundUser));
            showMainScreen();
            loadUserMessages();
            
            if (foundUser.isPremium) {
                checkPremiumExpiry();
            }
        } else {
            alert('البريد الالكتروني أو كلمة السر غير صحيحة');
        }
    } else {
        alert('لا يوجد حساب بهذا البريد');
    }
}

window.register = async function() {
    const accountName = document.getElementById('regAccountName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!accountName || !username || !email || !password) {
        alert('الرجاء ملء جميع الحقول');
        return;
    }

    if (!username.match(/^[a-zA-Z]/)) {
        alert('يجب أن يبدأ اسم المستخدم بحرف');
        return;
    }

    if (username.length < 4) {
        alert('يجب أن يكون اسم المستخدم 4 أحرف على الأقل');
        return;
    }

    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
        const users = snapshot.val();
        
        for (let userId in users) {
            const user = users[userId];
            if (user.username === username) {
                alert('اسم المستخدم مستخدم بالفعل');
                return;
            }
            if (user.email === email) {
                alert('البريد الالكتروني مستخدم بالفعل');
                return;
            }
        }
    }

    const newUserRef = push(usersRef);
    const userData = {
        accountName: accountName,
        username: username,
        email: email,
        password: password,
        isPremium: false,
        avatar: accountName.charAt(0).toUpperCase(),
        createdAt: Date.now(),
        banned: false
    };

    await set(newUserRef, userData);
    
    currentUser = { id: newUserRef.key, ...userData };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainScreen();
    loadUserMessages();
    alert('تم إنشاء الحساب بنجاح');
}

window.logout = function() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showAuthScreen();
        showLogin();
    }
}

function updateUserInfo() {
    if (!currentUser) return;
    
    const avatar = currentUser.avatar || currentUser.accountName.charAt(0).toUpperCase();
    
    document.getElementById('sidebarAvatar').textContent = avatar;
    document.getElementById('sidebarName').textContent = currentUser.accountName;
    document.getElementById('accountAvatar').textContent = avatar;
    document.getElementById('accountName').textContent = currentUser.accountName;
    document.getElementById('accountUsername').textContent = '@' + currentUser.username;
    document.getElementById('accountEmail').textContent = currentUser.email;
    
    if (currentUser.isPremium) {
        document.getElementById('premiumBadge').style.display = 'inline-block';
    }
}

function checkIfAdmin() {
    if (currentUser && currentUser.email === 'mstrhmd2005@gmail.com' && currentUser.password === 'T1O2K3abot$') {
        currentUser.isAdmin = true;
        document.getElementById('adminMenuItem').style.display = 'block';
    }
}

window.toggleSidebar = function() {
    document.getElementById('sidebar').classList.toggle('active');
}

window.navigateTo = function(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    const pages = {
        'home': 'homePage',
        'courses': 'coursesPage',
        'advanced': 'advancedPage',
        'tools': 'toolsPage',
        'account': 'accountPage',
        'admin': 'adminPage'
    };
    
    if (pages[page]) {
        document.getElementById(pages[page]).classList.add('active');
    }
    
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
    
    if (page === 'admin') {
        loadAdminData();
    }
}

window.openCourse = function(courseId) {
    const course = courses[courseId];
    if (!course) return;
    
    let html = `
        <h2>${course.title}</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">صاحب الكورس: ${course.instructor}</p>
        
        <div class="video-player" id="videoPlayer">
            <iframe src="https://www.youtube.com/embed/${course.videos[0].id}?modestbranding=1&rel=0" allowfullscreen></iframe>
        </div>
        
        <div class="video-list">
    `;
    
    course.videos.forEach((video, index) => {
        html += `
            <div class="video-item ${index === 0 ? 'active' : ''}" onclick="playVideo('${courseId}', ${index})">
                <h4>${video.title}</h4>
            </div>
        `;
    });
    
    html += `</div>
        <button class="course-info-btn" onclick="showCourseInfo('${courseId}')">معلومات الكورس</button>
    `;
    
    document.getElementById('courseContent').innerHTML = html;
    document.getElementById('courseDetailPage').classList.add('active');
    document.getElementById('coursesPage').classList.remove('active');
}

window.playVideo = function(courseId, videoIndex) {
    const course = courses[courseId];
    const video = course.videos[videoIndex];
    
    document.getElementById('videoPlayer').innerHTML = `
        <iframe src="https://www.youtube.com/embed/${video.id}?modestbranding=1&rel=0&autoplay=1" allowfullscreen></iframe>
    `;
    
    document.querySelectorAll('.video-item').forEach((item, index) => {
        if (index === videoIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

window.showCourseInfo = function(courseId) {
    const course = courses[courseId];
    let html = `
        <h3>معلومات الكورس</h3>
        <p style="margin: 20px 0;">صاحب الكورس: ${course.instructor}</p>
        <p style="margin-bottom: 20px; color: var(--text-secondary);">هذه حسابات صاحب الدورة للتواصل والمتابعة</p>
    `;
    
    if (course.channel) {
        html += `<a href="${course.channel}" target="_blank" class="btn-secondary" style="margin-bottom: 10px; display: block;">قناة تلجرام</a>`;
    }
    
    if (course.account) {
        html += `<a href="${course.account}" target="_blank" class="btn-secondary" style="display: block;">حساب تلجرام</a>`;
    }
    
    showModal(html);
}

window.checkPremiumAccess = function(courseId) {
    if (currentUser.isPremium) {
        openCourse(courseId);
    } else {
        showPremiumPrompt();
    }
}

function showPremiumPrompt() {
    const html = `
        <h3>تفعيل البرميوم</h3>
        <p style="margin: 20px 0; color: var(--text-secondary);">للوصول إلى هذا المحتوى المتقدم، يرجى تفعيل الاشتراك البرميوم</p>
        <input type="text" id="premiumCode" class="form-input" placeholder="أدخل كود التفعيل">
        <button class="btn-primary" onclick="activatePremium()">تفعيل</button>
    `;
    showModal(html);
}

window.activatePremium = async function() {
    const code = document.getElementById('premiumCode').value.trim();
    if (!code) {
        alert('الرجاء إدخال الكود');
        return;
    }

    const codesRef = ref(db, 'codes/' + code);
    const snapshot = await get(codesRef);
    
    if (snapshot.exists()) {
        const codeData = snapshot.val();
        
        if (codeData.used) {
            alert('هذا الكود مستخدم بالفعل');
            return;
        }
        
        const expiryDate = Date.now() + (codeData.duration * 60 * 1000);
        
        await update(ref(db, 'users/' + currentUser.id), {
            isPremium: true,
            premiumExpiry: expiryDate
        });
        
        await update(codesRef, {
            used: true,
            usedBy: currentUser.email,
            usedAt: Date.now()
        });
        
        currentUser.isPremium = true;
        currentUser.premiumExpiry = expiryDate;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        closeModal();
        updateUserInfo();
        alert('مبروك! تم تفعيل البرميوم بنجاح');
        addAdminNotification('تم تفعيل البرميوم بنجاح! استمتع بجميع المزايا المتقدمة');
    } else {
        alert('الكود غير صحيح');
    }
}

function checkPremiumExpiry() {
    if (currentUser.isPremium && currentUser.premiumExpiry) {
        if (Date.now() > currentUser.premiumExpiry) {
            update(ref(db, 'users/' + currentUser.id), {
                isPremium: false,
                premiumExpiry: null
            });
            currentUser.isPremium = false;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            alert('انتهت صلاحية البرميوم');
        }
    }
}

window.openTool = function(toolName) {
    document.getElementById('toolsPage').classList.remove('active');
    document.getElementById('toolDetailPage').classList.add('active');
    
    if (toolName === 'fibonacci') {
        showFibonacciTool();
    } else if (toolName === 'riskManagement') {
        showRiskManagementTool();
    }
}

function showFibonacciTool() {
    const html = `
        <h2>حاسبة فيبوناتشي</h2>
        <div class="tool-form">
            <select id="fiboDirection" class="form-input">
                <option value="lowToHigh">من القاع للقمة</option>
                <option value="highToLow">من القمة للقاع</option>
            </select>
            <input type="number" id="fiboLow" class="form-input" placeholder="القاع">
            <input type="number" id="fiboHigh" class="form-input" placeholder="القمة">
            <button class="btn-primary" onclick="calculateFibonacci()">حساب</button>
            <div id="fiboResult"></div>
        </div>
    `;
    document.getElementById('toolContent').innerHTML = html;
}

window.calculateFibonacci = function() {
    const direction = document.getElementById('fiboDirection').value;
    const low = parseFloat(document.getElementById('fiboLow').value);
    const high = parseFloat(document.getElementById('fiboHigh').value);
    
    if (isNaN(low) || isNaN(high)) {
        alert('الرجاء إدخال قيم صحيحة');
        return;
    }
    
    const diff = high - low;
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618];
    
    let html = '<div class="result-box"><h3>مستويات فيبوناتشي</h3>';
    
    levels.forEach(level => {
        const value = direction === 'lowToHigh' ? 
            low + (diff * level) : 
            high - (diff * level);
        html += `<p>${(level * 100).toFixed(1)}%: ${value.toFixed(5)}</p>`;
    });
    
    html += '</div>';
    document.getElementById('fiboResult').innerHTML = html;
}

function showRiskManagementTool() {
    const html = `
        <h2>إدارة رأس المال</h2>
        <div class="tool-form">
            <input type="number" id="capital" class="form-input" placeholder="رأس المال">
            <input type="number" id="riskPercent" class="form-input" placeholder="نسبة المخاطرة %">
            <input type="number" id="entryPrice" class="form-input" placeholder="سعر الدخول">
            <input type="number" id="stopLoss" class="form-input" placeholder="سعر الستوب لوس">
            <button class="btn-primary" onclick="calculateRisk()">حساب</button>
            <div id="riskResult"></div>
        </div>
    `;
    document.getElementById('toolContent').innerHTML = html;
}

window.calculateRisk = function() {
    const capital = parseFloat(document.getElementById('capital').value);
    const riskPercent = parseFloat(document.getElementById('riskPercent').value);
    const entryPrice = parseFloat(document.getElementById('entryPrice').value);
    const stopLoss = parseFloat(document.getElementById('stopLoss').value);
    
    if (isNaN(capital) || isNaN(riskPercent) || isNaN(entryPrice) || isNaN(stopLoss)) {
        alert('الرجاء إدخال جميع القيم');
        return;
    }
    
    const riskAmount = capital * (riskPercent / 100);
    const priceDiff = Math.abs(entryPrice - stopLoss);
    const positionSize = riskAmount / priceDiff;
    const totalValue = positionSize * entryPrice;
    
    let html = `
        <div class="result-box">
            <h3>نتائج الحساب</h3>
            <p>مبلغ المخاطرة: ${riskAmount.toFixed(2)}</p>
            <p>حجم الصفقة: ${positionSize.toFixed(4)}</p>
            <p>قيمة الصفقة الكلية: ${totalValue.toFixed(2)}</p>
            <p>الستوب لوس يجب وضعه عند: ${stopLoss}</p>
            <p>في حالة الخسارة ستخسر: ${riskPercent}% من رأس المال</p>
        </div>
    `;
    
    document.getElementById('riskResult').innerHTML = html;
}

window.showEditProfile = function() {
    const html = `
        <h3>تعديل المعلومات</h3>
        <input type="text" id="editAccountName" class="form-input" placeholder="اسم الحساب" value="${currentUser.accountName}">
        <input type="text" id="editUsername" class="form-input" placeholder="اسم المستخدم" value="${currentUser.username}">
        <input type="password" id="editPassword" class="form-input" placeholder="كلمة السر الجديدة">
        <input type="text" id="editAvatar" class="form-input" placeholder="الحرف الأول للصورة" value="${currentUser.avatar}" maxlength="1">
        <button class="btn-primary" onclick="saveProfile()">حفظ التغييرات</button>
    `;
    showModal(html);
}

window.saveProfile = async function() {
    const accountName = document.getElementById('editAccountName').value.trim();
    const username = document.getElementById('editUsername').value.trim();
    const password = document.getElementById('editPassword').value;
    const avatar = document.getElementById('editAvatar').value.trim();
    
    if (!accountName || !username) {
        alert('الرجاء ملء الحقول المطلوبة');
        return;
    }
    
    if (!username.match(/^[a-zA-Z]/)) {
        alert('يجب أن يبدأ اسم المستخدم بحرف');
        return;
    }
    
    if (username.length < 4) {
        alert('يجب أن يكون اسم المستخدم 4 أحرف على الأقل');
        return;
    }
    
    if (username !== currentUser.username) {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (let userId in users) {
                if (users[userId].username === username && userId !== currentUser.id) {
                    alert('اسم المستخدم مستخدم بالفعل');
                    return;
                }
            }
        }
    }
    
    const updates = {
        accountName: accountName,
        username: username,
        avatar: avatar || accountName.charAt(0).toUpperCase()
    };
    
    if (password) {
        updates.password = password;
    }
    
    await update(ref(db, 'users/' + currentUser.id), updates);
    
    currentUser.accountName = accountName;
    currentUser.username = username;
    currentUser.avatar = updates.avatar;
    if (password) currentUser.password = password;
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserInfo();
    closeModal();
    alert('تم تحديث المعلومات بنجاح');
}

window.toggleDarkMode = function() {
    const isDark = document.getElementById('darkModeToggle').checked;
    if (isDark) {
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.add('light-mode');
    }
}

async function loadAdminData() {
    if (!currentUser || !currentUser.isAdmin) return;
    
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    let html = '';
    if (snapshot.exists()) {
        const users = snapshot.val();
        for (let userId in users) {
            const user = users[userId];
            if (userId !== currentUser.id) {
                html += `
                    <div class="user-card">
                        <div class="user-card-info">
                            <h4>${user.accountName}</h4>
                            <p>@${user.username}</p>
                            <p>${user.email}</p>
                            <p>${user.isPremium ? 'برميوم' : 'عادي'}</p>
                        </div>
                        <div class="user-actions">
                            <button class="btn-small btn-view" onclick="viewUser('${userId}')">عرض</button>
                            <button class="btn-small btn-ban" onclick="toggleBan('${userId}', ${user.banned || false})">${user.banned ? 'إلغاء الحظر' : 'حظر'}</button>
                        </div>
                    </div>
                `;
            }
        }
    }
    
    document.getElementById('usersList').innerHTML = html || '<p>لا يوجد مستخدمين</p>';
    
    let userOptions = '<option value="">اختر مستخدم</option>';
    if (snapshot.exists()) {
        const users = snapshot.val();
        for (let userId in users) {
            const user = users[userId];
            if (userId !== currentUser.id) {
                userOptions += `<option value="${userId}">${user.accountName} (@${user.username})</option>`;
            }
        }
    }
    document.getElementById('messageUser').innerHTML = userOptions;
}

window.generateCode = async function() {
    const duration = parseInt(document.getElementById('codeDuration').value);
    const code = 'EXM' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    const codeRef = ref(db, 'codes/' + code);
    await set(codeRef, {
        duration: duration,
        created: Date.now(),
        createdBy: currentUser.email,
        used: false
    });
    
    document.getElementById('generatedCode').innerHTML = `
        <p style="margin-bottom: 10px;">تم إنشاء الكود بنجاح</p>
        <div style="font-size: 28px; color: var(--accent);">${code}</div>
        <p style="margin-top: 10px; font-size: 14px; color: var(--text-secondary);">المدة: ${getDurationText(duration)}</p>
    `;
}

function getDurationText(minutes) {
    if (minutes < 60) return minutes + ' دقيقة';
    if (minutes < 1440) return (minutes / 60) + ' ساعة';
    if (minutes < 10080) return (minutes / 1440) + ' يوم';
    if (minutes < 43200) return (minutes / 10080) + ' أسبوع';
    if (minutes < 525600) return (minutes / 43200) + ' شهر';
    return (minutes / 525600) + ' سنة';
}

window.viewUser = async function(userId) {
    const userRef = ref(db, 'users/' + userId);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
        const user = snapshot.val();
        const html = `
            <h3>معلومات المستخدم</h3>
            <div style="padding: 20px;">
                <p><strong>اسم الحساب:</strong> ${user.accountName}</p>
                <p><strong>اسم المستخدم:</strong> @${user.username}</p>
                <p><strong>البريد:</strong> ${user.email}</p>
                <p><strong>الحالة:</strong> ${user.isPremium ? 'برميوم' : 'عادي'}</p>
                <p><strong>محظور:</strong> ${user.banned ? 'نعم' : 'لا'}</p>
                <p><strong>تاريخ التسجيل:</strong> ${new Date(user.createdAt).toLocaleDateString('ar')}</p>
            </div>
        `;
        showModal(html);
    }
}

window.toggleBan = async function(userId, currentBanStatus) {
    const newStatus = !currentBanStatus;
    const confirmMsg = newStatus ? 'هل تريد حظر هذا المستخدم؟' : 'هل تريد إلغاء حظر هذا المستخدم؟';
    
    if (confirm(confirmMsg)) {
        await update(ref(db, 'users/' + userId), {
            banned: newStatus
        });
        
        loadAdminData();
        alert(newStatus ? 'تم حظر المستخدم' : 'تم إلغاء الحظر');
    }
}

window.sendAdminMessage = async function() {
    const userId = document.getElementById('messageUser').value;
    const message = document.getElementById('messageContent').value.trim();
    
    if (!userId || !message) {
        alert('الرجاء اختيار مستخدم وكتابة الرسالة');
        return;
    }
    
    const messagesRef = ref(db, 'messages/' + userId);
    const newMessageRef = push(messagesRef);
    
    await set(newMessageRef, {
        text: message,
        from: 'الادمن',
        timestamp: Date.now(),
        read: false
    });
    
    document.getElementById('messageContent').value = '';
    alert('تم إرسال الرسالة بنجاح');
}

function loadUserMessages() {
    if (!currentUser) return;
    
    const messagesRef = ref(db, 'messages/' + currentUser.id);
    onValue(messagesRef, (snapshot) => {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        if (snapshot.exists()) {
            const messages = snapshot.val();
            for (let msgId in messages) {
                const msg = messages[msgId];
                const messageDiv = document.createElement('div');
                messageDiv.className = 'chat-message';
                messageDiv.innerHTML = `
                    <strong>${msg.from}</strong>
                    <p>${msg.text}</p>
                    <small>${new Date(msg.timestamp).toLocaleString('ar')}</small>
                `;
                chatMessages.appendChild(messageDiv);
                
                if (!msg.read) {
                    showNotification('رسالة جديدة من الدعم الفني');
                    update(ref(db, 'messages/' + currentUser.id + '/' + msgId), { read: true });
                }
            }
        } else {
            chatMessages.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">لا توجد رسائل</p>';
        }
    });
}

function addAdminNotification(message) {
    if (!currentUser) return;
    
    const messagesRef = ref(db, 'messages/' + currentUser.id);
    const newMessageRef = push(messagesRef);
    
    set(newMessageRef, {
        text: message,
        from: 'النظام',
        timestamp: Date.now(),
        read: false
    });
}

function showNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('اكزم للتداول', { body: message });
    }
}

window.toggleChat = function() {
    document.getElementById('chatBox').classList.toggle('active');
}

function initDragSupport() {
    const supportChat = document.getElementById('supportChat');
    const chatIcon = supportChat.querySelector('.chat-icon');
    
    chatIcon.addEventListener('mousedown', dragStart);
    chatIcon.addEventListener('touchstart', dragStart);
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
}

function dragStart(e) {
    const supportChat = document.getElementById('supportChat');
    
    if (e.type === 'touchstart') {
        initialX = e.touches[0].clientX - currentX;
        initialY = e.touches[0].clientY - currentY;
    } else {
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
    }
    
    isDragging = true;
}

function drag(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const supportChat = document.getElementById('supportChat');
    
    if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
    } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
    }
    
    supportChat.style.right = 'auto';
    supportChat.style.bottom = 'auto';
    supportChat.style.left = currentX + 'px';
    supportChat.style.top = currentY + 'px';
}

function dragEnd() {
    isDragging = false;
}

window.showModal = function(content) {
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modal').classList.add('active');
}

window.closeModal = function() {
    document.getElementById('modal').classList.remove('active');
}

window.showPrivacyPolicy = function() {
    const html = `
        <h2>سياسة الخصوصية</h2>
        <div style="padding: 20px; line-height: 1.8;">
            <p>في اكزم للتداول، نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.</p>
            <br>
            <h3>جمع البيانات</h3>
            <p>نقوم بجمع المعلومات التي تقدمها عند إنشاء حساب، بما في ذلك الاسم والبريد الإلكتروني.</p>
            <br>
            <h3>استخدام البيانات</h3>
            <p>نستخدم بياناتك لتوفير خدماتنا وتحسين تجربتك في التطبيق.</p>
            <br>
            <h3>حماية البيانات</h3>
            <p>نحن نستخدم تقنيات أمان متقدمة لحماية معلوماتك من الوصول غير المصرح به.</p>
            <br>
            <h3>مشاركة البيانات</h3>
            <p>لن نشارك بياناتك الشخصية مع أطراف ثالثة دون موافقتك الصريحة.</p>
            <br>
            <p>للاستفسارات حول سياسة الخصوصية، يرجى التواصل معنا عبر الدعم الفني.</p>
        </div>
    `;
    showModal(html);
}

window.showAboutUs = function() {
    const html = `
        <h2>من نحن</h2>
        <div style="padding: 20px; line-height: 1.8;">
            <p>نحن فريق من المطورين المحترفين والمتخصصين في تطوير البرامج والتطبيقات المالية.</p>
            <br>
            <h3>رؤيتنا</h3>
            <p>نسعى لتوفير أفضل الأدوات والمحتوى التعليمي للمتداولين في الوطن العربي.</p>
            <br>
            <h3>مهمتنا</h3>
            <p>قمنا بتطوير تطبيق اكزم للتداول ليكون منصة شاملة تجمع أفضل الدورات التعليمية والأدوات التحليلية في مكان واحد.</p>
            <br>
            <h3>خدماتنا</h3>
            <p>نقوم بتطوير المؤشرات، البرامج التعليمية، والأدوات التحليلية التي تساعد المتداولين على تحسين أدائهم.</p>
            <br>
            <h3>التزامنا</h3>
            <p>نلتزم بتقديم محتوى عالي الجودة ودعم فني متميز لجميع مستخدمينا.</p>
            <br>
            <p>شكراً لاختياركم اكزم للتداول - منصتكم الموثوقة لتعلم التداول.</p>
        </div>
    `;
    showModal(html);
}

if ('Notification' in window) {
    Notification.requestPermission();
}