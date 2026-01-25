// ===== تهيئة التطبيق =====
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة جميع المكونات
    initializeApp();
});

// ===== المتغيرات العامة =====
let appState = {
    currentPage: 'home',
    currentTheme: 'green',
    userLocation: null,
    prayerTimes: null,
    nextPrayer: null,
    counter: 0,
    dailyGoal: 100,
    tasbihHistory: {},
    currentTasbih: 'سبحان الله',
    currentReciter: '1',
    currentMuezzin: '1',
    notifications: [],
    settings: {
        language: 'ar',
        calendar: 'both',
        timezone: 'auto',
        azanSound: '1',
        tasbihSound: '1',
        notifications: true,
        vibration: true,
        autoSave: false
    }
};

// ===== تهيئة التطبيق =====
function initializeApp() {
    console.log('🚀 بدء تشغيل تطبيق ليزي رمضان');
    
    // محاكاة شاشة التحميل
    simulateLoading();
    
    // تهيئة التواريخ
    initializeDates();
    
    // تهيئة البيانات المحلية
    loadLocalData();
    
    // تهيئة المستمعين للأحداث
    initializeEventListeners();
    
    // جلب بيانات الموقع وأوقات الصلاة
    initializeLocation();
    
    // تهيئة المؤذن
    initializePrayerTimes();
    
    // تهيئة القرآن
    initializeQuran();
    
    // تهيئة الأدعية
    initializeDuas();
    
    // تهيئة الإمساكية
    initializeRamadanTimetable();
    
    // تهيئة البوصلة
    initializeCompass();
    
    // تهيئة البث المباشر
    initializeRadio();
    
    // تهيئة الإشعارات
    initializeNotifications();
}

// ===== شاشة التحميل =====
function simulateLoading() {
    let progress = 0;
    const progressFill = document.getElementById('progressFill');
    const loadingText = document.getElementById('loadingText');
    const loadingScreen = document.getElementById('loadingScreen');
    
    const loadingSteps = [
        { text: 'جاري تحميل البيانات الأساسية...', progress: 20 },
        { text: 'جاري تهيئة المؤذن الذكي...', progress: 40 },
        { text: 'جاري تحميل القرآن الكريم...', progress: 60 },
        { text: 'جاري تهيئة المسبحة الإلكترونية...', progress: 80 },
        { text: 'جاري إعداد الواجهات...', progress: 100 }
    ];
    
    let stepIndex = 0;
    const interval = setInterval(() => {
        if (stepIndex < loadingSteps.length) {
            const step = loadingSteps[stepIndex];
            progress = step.progress;
            progressFill.style.width = `${progress}%`;
            loadingText.textContent = step.text;
            stepIndex++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    showToast('تم تحميل التطبيق بنجاح!');
                }, 500);
            }, 500);
        }
    }, 500);
}

// ===== التواريخ =====
function initializeDates() {
    const now = new Date();
    
    // التاريخ الهجري
    const hijriDate = calculateHijriDate(now);
    document.getElementById('hijriDate').textContent = hijriDate;
    
    // التاريخ الميلادي
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const gregorianDate = now.toLocaleDateString('ar-SA', options);
    document.getElementById('gregorianDate').textContent = gregorianDate;
    
    // تاريخ البناء
    document.getElementById('buildDate').textContent = now.toISOString().split('T')[0];
    
    // أيام رمضان المتبقية
    updateRamadanCountdown();
}

function calculateHijriDate(date) {
    // محاكاة بسيطة للتاريخ الهجري (يجب استخدام مكتبة دقيقة في الإنتاج)
    const hijriMonths = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 
                        'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
    
    const day = date.getDate();
    const month = hijriMonths[date.getMonth()];
    const year = 1445 + Math.floor(date.getFullYear() - 2023);
    
    return `${day} ${month} ${year}`;
}

function updateRamadanCountdown() {
    const today = new Date();
    const ramadanStart = new Date('2026-02-18'); // تاريخ بداية رمضان 2026
    const diffTime = ramadanStart - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const ramadanDays = document.getElementById('ramadanDays');
    if (diffDays > 0) {
        ramadanDays.textContent = `${diffDays} يوم`;
    } else {
        // إذا كان رمضان بدأ، نحسب الأيام المتبقية فيه
        const ramadanEnd = new Date('2026-03-19');
        const remainingDays = Math.ceil((ramadanEnd - today) / (1000 * 60 * 60 * 24));
        ramadanDays.textContent = `${Math.max(0, remainingDays)} يوم`;
    }
}

// ===== البيانات المحلية =====
function loadLocalData() {
    try {
        const savedData = localStorage.getItem('lazyRamadanData');
        if (savedData) {
            const data = JSON.parse(savedData);
            appState = { ...appState, ...data };
            
            // تحديث العداد من البيانات المحفوظة
            document.getElementById('counterDisplay').textContent = appState.counter || 0;
            document.getElementById('dailyGoal').value = appState.dailyGoal || 100;
            
            // تحديث هدف التسبيح
            updateGoalProgress();
            
            showToast('تم تحميل البيانات المحفوظة');
        }
    } catch (error) {
        console.error('خطأ في تحميل البيانات المحلية:', error);
    }
}

function saveLocalData() {
    try {
        localStorage.setItem('lazyRamadanData', JSON.stringify(appState));
    } catch (error) {
        console.error('خطأ في حفظ البيانات المحلية:', error);
    }
}

// ===== الموقع وأوقات الصلاة =====
function initializeLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                appState.userLocation = { lat, lon };
                
                // تحديث واجهة المستخدم
                document.getElementById('currentLocation').textContent = `خط العرض: ${lat.toFixed(4)}, خط الطول: ${lon.toFixed(4)}`;
                
                // تحديث البوصلة إذا كانت الصفحة نشطة
                if (appState.currentPage === 'qibla') {
                    updateCompass();
                }
                
                // جلب أوقات الصلاة
                fetchPrayerTimes(lat, lon);
            },
            (error) => {
                console.error('خطأ في جلب الموقع:', error);
                document.getElementById('currentLocation').textContent = 'غير محدد';
                
                // استخدام موقع افتراضي (مكة المكرمة)
                appState.userLocation = { lat: 21.4225, lon: 39.8262 };
                fetchPrayerTimes(21.4225, 39.8262);
            }
        );
    } else {
        showToast('المتصفح لا يدعم تحديد الموقع');
        appState.userLocation = { lat: 21.4225, lon: 39.8262 };
        fetchPrayerTimes(21.4225, 39.8262);
    }
}

async function fetchPrayerTimes(lat, lon) {
    try {
        // استخدام API مواقيت الصلاة
        const response = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`);
        const data = await response.json();
        
        if (data.code === 200) {
            appState.prayerTimes = data.data.timings;
            updatePrayerTimesUI();
            calculateNextPrayer();
            startPrayerCountdown();
        }
    } catch (error) {
        console.error('خطأ في جلب أوقات الصلاة:', error);
        // استخدام أوقات افتراضية
        setDefaultPrayerTimes();
    }
}

function setDefaultPrayerTimes() {
    appState.prayerTimes = {
        Fajr: "05:21",
        Sunrise: "06:41",
        Dhuhr: "12:29",
        Asr: "15:40",
        Sunset: "18:17",
        Maghrib: "18:17",
        Isha: "19:37"
    };
    
    updatePrayerTimesUI();
    calculateNextPrayer();
    startPrayerCountdown();
}

function updatePrayerTimesUI() {
    const prayers = [
        { name: 'الفجر', key: 'Fajr', icon: 'fas fa-sun' },
        { name: 'الشروق', key: 'Sunrise', icon: 'fas fa-sunrise' },
        { name: 'الظهر', key: 'Dhuhr', icon: 'fas fa-sun' },
        { name: 'العصر', key: 'Asr', icon: 'fas fa-cloud-sun' },
        { name: 'المغرب', key: 'Maghrib', icon: 'fas fa-sunset' },
        { name: 'العشاء', key: 'Isha', icon: 'fas fa-moon' }
    ];
    
    const grid = document.getElementById('prayerTimesGrid');
    grid.innerHTML = '';
    
    prayers.forEach(prayer => {
        const time = appState.prayerTimes[prayer.key];
        const isActive = appState.nextPrayer === prayer.key;
        
        const prayerItem = document.createElement('div');
        prayerItem.className = `prayer-time-item ${isActive ? 'active' : ''}`;
        prayerItem.innerHTML = `
            <div class="prayer-name">${prayer.name}</div>
            <div class="prayer-time">${time}</div>
        `;
        
        grid.appendChild(prayerItem);
    });
}

function calculateNextPrayer() {
    if (!appState.prayerTimes) return;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayerTimes = [
        { key: 'Fajr', time: appState.prayerTimes.Fajr },
        { key: 'Dhuhr', time: appState.prayerTimes.Dhuhr },
        { key: 'Asr', time: appState.prayerTimes.Asr },
        { key: 'Maghrib', time: appState.prayerTimes.Maghrib },
        { key: 'Isha', time: appState.prayerTimes.Isha }
    ];
    
    let nextPrayer = null;
    let minDiff = Infinity;
    
    prayerTimes.forEach(prayer => {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerTime = hours * 60 + minutes;
        let diff = prayerTime - currentTime;
        
        if (diff < 0) {
            diff += 24 * 60; // إذا كانت الصلاة الماضية، نضيف 24 ساعة
        }
        
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextPrayer = prayer;
        }
    });
    
    if (nextPrayer) {
        appState.nextPrayer = nextPrayer.key;
        const prayerNames = {
            'Fajr': 'الفجر',
            'Dhuhr': 'الظهر',
            'Asr': 'العصر',
            'Maghrib': 'المغرب',
            'Isha': 'العشاء'
        };
        
        document.getElementById('nextPrayerInfo').innerHTML = `
            <span class="prayer-name">${prayerNames[nextPrayer.key]}</span>
            <span class="prayer-time">${nextPrayer.time}</span>
        `;
    }
}

function startPrayerCountdown() {
    updatePrayerCountdown();
    setInterval(updatePrayerCountdown, 1000);
}

function updatePrayerCountdown() {
    if (!appState.nextPrayer || !appState.prayerTimes) return;
    
    const now = new Date();
    const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    
    const [hours, minutes] = appState.prayerTimes[appState.nextPrayer].split(':').map(Number);
    const prayerTime = hours * 3600 + minutes * 60;
    
    let diff = prayerTime - currentTime;
    if (diff < 0) {
        diff += 24 * 3600;
    }
    
    const hoursLeft = Math.floor(diff / 3600);
    const minutesLeft = Math.floor((diff % 3600) / 60);
    const secondsLeft = diff % 60;
    
    const countdownElement = document.getElementById('prayerCountdown');
    if (countdownElement) {
        countdownElement.textContent = 
            `${hoursLeft.toString().padStart(2, '0')}:${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
    }
    
    // التحقق من وقت الأذان
    if (diff <= 0) {
        playAzan();
        calculateNextPrayer();
    }
}

// ===== المؤذن والأذان =====
function initializePrayerTimes() {
    // إعدادات المؤذن
    const muezzinOptions = document.querySelectorAll('.muezzin-option');
    muezzinOptions.forEach(option => {
        option.addEventListener('click', function() {
            muezzinOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            appState.currentMuezzin = this.dataset.muezzin;
            saveLocalData();
        });
    });
}

function playAzan() {
    if (!appState.settings.notifications) return;
    
    // تشغيل الفيديو
    const videoOverlay = document.getElementById('videoOverlay');
    const azanVideo = document.getElementById('azanVideo');
    
    // اختيار فيديو المؤذن المناسب
    const muezzinVideos = {
        '1': 'https://j.top4top.io/m_3675du7yg0.mp4',
        '2': 'https://k.top4top.io/m_3675lh1nn0.mp4',
        '3': 'https://f.top4top.io/m_36754qx8g0.mp4',
        '4': 'https://b.top4top.io/m_36759dac10.mp4',
        '5': 'https://f.top4top.io/m_3675e4zi30.mp4'
    };
    
    const isFajr = appState.nextPrayer === 'Fajr';
    const videoUrl = isFajr ? 'https://j.top4top.io/m_3676g8h180.mp4' : muezzinVideos[appState.currentMuezzin];
    
    azanVideo.src = videoUrl;
    videoOverlay.classList.add('show');
    azanVideo.play();
    
    // إضافة الإشعار
    addNotification('أذان الصلاة', `حان وقت أذان ${getPrayerName(appState.nextPrayer)}`, 'azan');
    
    // الاهتزاز إذا كان مفعلاً
    if (appState.settings.vibration && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
}

function getPrayerName(prayerKey) {
    const names = {
        'Fajr': 'الفجر',
        'Dhuhr': 'الظهر',
        'Asr': 'العصر',
        'Maghrib': 'المغرب',
        'Isha': 'العشاء'
    };
    return names[prayerKey] || prayerKey;
}

// ===== القرآن الكريم =====
function initializeQuran() {
    // جلب سور القرآن
    fetchQuranSurahs();
    
    // إعداد مشغل القرآن
    setupQuranPlayer();
}

async function fetchQuranSurahs() {
    try {
        // محاكاة بيانات القرآن
        const surahs = [
            { number: 1, name: 'الفاتحة', verses: 7, type: 'مكية' },
            { number: 2, name: 'البقرة', verses: 286, type: 'مدنية' },
            { number: 3, name: 'آل عمران', verses: 200, type: 'مدنية' },
            { number: 4, name: 'النساء', verses: 176, type: 'مدنية' },
            { number: 5, name: 'المائدة', verses: 120, type: 'مدنية' },
            { number: 6, name: 'الأنعام', verses: 165, type: 'مكية' },
            { number: 7, name: 'الأعراف', verses: 206, type: 'مكية' },
            { number: 8, name: 'الأنفال', verses: 75, type: 'مدنية' },
            { number: 9, name: 'التوبة', verses: 129, type: 'مدنية' },
            { number: 10, name: 'يونس', verses: 109, type: 'مكية' }
        ];
        
        displayQuranSurahs(surahs);
        
        // في الإنتاج الحقيقي:
        // const response = await fetch('https://quran.yousefheiba.com/api/surahs');
        // const data = await response.json();
        // displayQuranSurahs(data);
        
    } catch (error) {
        console.error('خطأ في جلب سور القرآن:', error);
    }
}

function displayQuranSurahs(surahs) {
    const container = document.getElementById('quranSurahs');
    container.innerHTML = '';
    
    surahs.forEach(surah => {
        const surahCard = document.createElement('div');
        surahCard.className = 'surah-card';
        surahCard.innerHTML = `
            <div class="surah-number">${surah.number}</div>
            <div class="surah-name">${surah.name}</div>
            <div class="surah-details">${surah.verses} آية - ${surah.type}</div>
        `;
        
        surahCard.addEventListener('click', () => {
            showModal('سورة ' + surah.name, `عدد الآيات: ${surah.verses}<br>نوع السورة: ${surah.type}`);
        });
        
        container.appendChild(surahCard);
    });
}

function setupQuranPlayer() {
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    
    // محاكاة مشغل القرآن
    playBtn.addEventListener('click', () => {
        showToast('جاري تشغيل التلاوة...');
    });
    
    pauseBtn.addEventListener('click', () => {
        showToast('تم إيقاف التلاوة مؤقتاً');
    });
    
    stopBtn.addEventListener('click', () => {
        showToast('تم إيقاف التلاوة');
    });
    
    volumeSlider.addEventListener('input', (e) => {
        console.log('مستوى الصوت:', e.target.value);
    });
}

// ===== الأدعية والأذكار =====
function initializeDuas() {
    // تصنيفات الأدعية
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const category = this.dataset.category;
            loadDuasByCategory(category);
        });
    });
    
    // تحميل الأدعية الأولية
    loadDuasByCategory('all');
}

function loadDuasByCategory(category) {
    // بيانات الأدعية المثال
    const allDuas = [
        {
            id: 1,
            text: 'اللهم إني أسألك علماً نافعاً، ورزقاً طيباً، وعملاً متقبلاً',
            translation: 'اللهم إني أسألك علماً نافعاً، ورزقاً طيباً، وعملاً متقبلاً',
            source: 'سنن ابن ماجه',
            category: 'morning',
            repetition: 1
        },
        {
            id: 2,
            text: 'سبحان الله وبحمده، سبحان الله العظيم',
            translation: 'سبحان الله وبحمده، سبحان الله العظيم',
            source: 'صحيح البخاري ومسلم',
            category: 'morning',
            repetition: 100
        },
        {
            id: 3,
            text: 'اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور',
            translation: 'اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور',
            source: 'سنن الترمذي',
            category: 'evening',
            repetition: 1
        },
        {
            id: 4,
            text: 'أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه',
            translation: 'أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه',
            source: 'سنن الترمذي',
            category: 'prayer',
            repetition: 100
        },
        {
            id: 5,
            text: 'اللهم إنك عفو تحب العفو فاعف عني',
            translation: 'اللهم إنك عفو تحب العفو فاعف عني',
            source: 'سنن الترمذي',
            category: 'ramadan',
            repetition: 100
        }
    ];
    
    // تصفية الأدعية حسب الفئة
    let filteredDuas = allDuas;
    if (category !== 'all') {
        filteredDuas = allDuas.filter(dua => dua.category === category);
    }
    
    displayDuas(filteredDuas);
}

function displayDuas(duas) {
    const container = document.getElementById('duasContainer');
    container.innerHTML = '';
    
    if (duas.length === 0) {
        container.innerHTML = '<div class="no-duas">لا توجد أدعية في هذه الفئة</div>';
        return;
    }
    
    duas.forEach(dua => {
        const duaCard = document.createElement('div');
        duaCard.className = 'dua-card';
        duaCard.innerHTML = `
            <div class="dua-text">${dua.text}</div>
            <div class="dua-translation">${dua.translation}</div>
            <div class="dua-source">
                <span>${dua.source}</span>
                <div class="dua-actions">
                    <button class="dua-action-btn" onclick="playDuaAudio(${dua.id})">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="dua-action-btn" onclick="copyDuaText('${dua.text}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="dua-action-btn" onclick="shareDua('${dua.text}')">
                        <i class="fas fa-share"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(duaCard);
    });
}

// ===== الإمساكية الرمضانية =====
function initializeRamadanTimetable() {
    // إنشاء إمساكية رمضان 2026
    createRamadanTimetable();
    
    // عدّاد الإفطار
    startIftarCountdown();
    
    // التحكم في الأيام
    document.getElementById('prevDay').addEventListener('click', () => changeRamadanDay(-1));
    document.getElementById('nextDay').addEventListener('click', () => changeRamadanDay(1));
}

function createRamadanTimetable() {
    const tableBody = document.getElementById('ramadanTable');
    tableBody.innerHTML = '';
    
    // بيانات الإمساكية (مثال)
    const timetable = [
        { day: 'الأربعاء', ramadanDay: 1, date: '18/2', suhur: '04:21', fajr: '05:21', maghrib: '17:53' },
        { day: 'الخميس', ramadanDay: 2, date: '19/2', suhur: '04:20', fajr: '05:20', maghrib: '17:54' },
        { day: 'الجمعة', ramadanDay: 3, date: '20/2', suhur: '04:19', fajr: '05:19', maghrib: '17:55' },
        { day: 'السبت', ramadanDay: 4, date: '21/2', suhur: '04:18', fajr: '05:18', maghrib: '17:55' },
        { day: 'الأحد', ramadanDay: 5, date: '22/2', suhur: '04:17', fajr: '05:17', maghrib: '17:56' },
        { day: 'الاثنين', ramadanDay: 6, date: '23/2', suhur: '04:16', fajr: '05:16', maghrib: '17:57' },
        { day: 'الثلاثاء', ramadanDay: 7, date: '24/2', suhur: '04:15', fajr: '05:15', maghrib: '17:58' },
        { day: 'الأربعاء', ramadanDay: 8, date: '25/2', suhur: '04:14', fajr: '05:14', maghrib: '17:59' },
        { day: 'الخميس', ramadanDay: 9, date: '26/2', suhur: '04:12', fajr: '05:12', maghrib: '18:00' },
        { day: 'الجمعة', ramadanDay: 10, date: '27/2', suhur: '04:11', fajr: '05:11', maghrib: '18:00' },
        { day: 'السبت', ramadanDay: 11, date: '28/2', suhur: '04:10', fajr: '05:10', maghrib: '18:01' },
        { day: 'الأحد', ramadanDay: 12, date: '1/3', suhur: '04:09', fajr: '05:09', maghrib: '18:02' },
        { day: 'الاثنين', ramadanDay: 13, date: '2/3', suhur: '04:08', fajr: '05:08', maghrib: '18:03' },
        { day: 'الثلاثاء', ramadanDay: 14, date: '3/3', suhur: '04:07', fajr: '05:07', maghrib: '18:04' },
        { day: 'الأربعاء', ramadanDay: 15, date: '4/3', suhur: '04:06', fajr: '05:06', maghrib: '18:04' },
        { day: 'الخميس', ramadanDay: 16, date: '5/3', suhur: '04:04', fajr: '05:04', maghrib: '18:05' },
        { day: 'الجمعة', ramadanDay: 17, date: '6/3', suhur: '04:03', fajr: '05:03', maghrib: '18:06' },
        { day: 'السبت', ramadanDay: 18, date: '7/3', suhur: '04:02', fajr: '05:02', maghrib: '18:07' },
        { day: 'الأحد', ramadanDay: 19, date: '8/3', suhur: '04:01', fajr: '05:01', maghrib: '18:08' },
        { day: 'الاثنين', ramadanDay: 20, date: '9/3', suhur: '03:59', fajr: '04:59', maghrib: '18:09' },
        { day: 'الثلاثاء', ramadanDay: 21, date: '10/3', suhur: '03:58', fajr: '04:58', maghrib: '18:10' },
        { day: 'الأربعاء', ramadanDay: 22, date: '11/3', suhur: '03:57', fajr: '04:57', maghrib: '18:11' },
        { day: 'الخميس', ramadanDay: 23, date: '12/3', suhur: '03:55', fajr: '04:55', maghrib: '18:12' },
        { day: 'الجمعة', ramadanDay: 24, date: '13/3', suhur: '03:54', fajr: '04:54', maghrib: '18:13' },
        { day: 'السبت', ramadanDay: 25, date: '14/3', suhur: '03:53', fajr: '04:53', maghrib: '18:14' },
        { day: 'الأحد', ramadanDay: 26, date: '15/3', suhur: '03:51', fajr: '04:51', maghrib: '18:15' },
        { day: 'الاثنين', ramadanDay: 27, date: '16/3', suhur: '03:50', fajr: '04:50', maghrib: '18:16' },
        { day: 'الثلاثاء', ramadanDay: 28, date: '17/3', suhur: '03:49', fajr: '04:49', maghrib: '18:16' },
        { day: 'الأربعاء', ramadanDay: 29, date: '18/3', suhur: '03:47', fajr: '04:47', maghrib: '18:16' },
        { day: 'الخميس', ramadanDay: 30, date: '19/3', suhur: '03:46', fajr: '04:46', maghrib: '18:16' }
    ];
    
    // إيجاد اليوم الحالي في رمضان
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-GB').slice(0, 5).replace('/', '-');
    
    timetable.forEach(row => {
        const rowElement = document.createElement('div');
        rowElement.className = 'timetable-row';
        
        // التحقق إذا كان اليوم الحالي
        if (row.date === todayStr) {
            rowElement.classList.add('current-day');
        }
        
        rowElement.innerHTML = `
            <div class="timetable-cell">${row.day}</div>
            <div class="timetable-cell">${row.ramadanDay}</div>
            <div class="timetable-cell">${row.date}</div>
            <div class="timetable-cell">${row.suhur}</div>
            <div class="timetable-cell">${row.fajr}</div>
            <div class="timetable-cell">${row.maghrib}</div>
        `;
        
        tableBody.appendChild(rowElement);
    });
}

function startIftarCountdown() {
    updateIftarCountdown();
    setInterval(updateIftarCountdown, 1000);
}

function updateIftarCountdown() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // وقت الإفطار الافتراضي (18:30)
    const iftarHours = 18;
    const iftarMinutes = 30;
    
    let diffHours = iftarHours - hours;
    let diffMinutes = iftarMinutes - minutes;
    let diffSeconds = -seconds;
    
    if (diffSeconds < 0) {
        diffSeconds += 60;
        diffMinutes--;
    }
    
    if (diffMinutes < 0) {
        diffMinutes += 60;
        diffHours--;
    }
    
    if (diffHours < 0) {
        diffHours += 24;
    }
    
    document.getElementById('hours').textContent = diffHours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = diffMinutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = diffSeconds.toString().padStart(2, '0');
    
    // التحقق إذا حان وقت الإفطار
    if (diffHours === 0 && diffMinutes === 0 && diffSeconds === 0) {
        showToast('حان وقت الإفطار! تقبل الله منا ومنكم');
        playIftarNotification();
    }
}

function changeRamadanDay(change) {
    // هذه وظيفة للتجربة، في التطبيق الحقيقي ستتحكم في عرض اليوم المحدد
    showToast(`سيتم عرض اليوم ${change > 0 ? 'التالي' : 'السابق'}`);
}

// ===== المسبحة الإلكترونية =====
function initializeTasbih() {
    const countBtn = document.getElementById('countBtn');
    const resetBtn = document.getElementById('resetBtn');
    const saveBtn = document.getElementById('saveBtn');
    const beads = document.querySelectorAll('.bead');
    const designOptions = document.querySelectorAll('.design-option');
    
    // زر العد
    countBtn.addEventListener('click', countTasbih);
    
    // إعادة التعيين
    resetBtn.addEventListener('click', resetTasbih);
    
    // الحفظ
    saveBtn.addEventListener('click', saveTasbih);
    
    // حبات المسبحة
    beads.forEach(bead => {
        bead.addEventListener('click', function() {
            appState.currentTasbih = this.textContent;
            document.getElementById('tasbihText').textContent = this.textContent;
            showToast(`تم اختيار: ${this.textContent}`);
        });
    });
    
    // تصاميم المسبحة
    designOptions.forEach(option => {
        option.addEventListener('click', function() {
            designOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            changeTasbihDesign(this.dataset.design);
        });
    });
    
    // هدف التسبيح
    document.getElementById('setGoalBtn').addEventListener('click', setDailyGoal);
    
    // تحديث الإحصائيات
    updateTasbihStats();
}

function countTasbih() {
    appState.counter++;
    document.getElementById('counterDisplay').textContent = appState.counter;
    
    // تحديث هدف التسبيح
    updateGoalProgress();
    
    // الصوت والاهتزاز
    if (appState.settings.tasbihSound !== '3') {
        playClickSound();
    }
    
    if (appState.settings.vibration && navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // الحفظ التلقائي
    if (appState.settings.autoSave) {
        saveLocalData();
    }
}

function resetTasbih() {
    appState.counter = 0;
    document.getElementById('counterDisplay').textContent = '0';
    updateGoalProgress();
    showToast('تم إعادة تعيين العداد');
}

function saveTasbih() {
    const today = new Date().toISOString().split('T')[0];
    
    if (!appState.tasbihHistory[today]) {
        appState.tasbihHistory[today] = [];
    }
    
    appState.tasbihHistory[today].push({
        count: appState.counter,
        tasbih: appState.currentTasbih,
        timestamp: new Date().toISOString()
    });
    
    saveLocalData();
    updateTasbihStats();
    showToast('تم حفظ التسبيح بنجاح');
}

function setDailyGoal() {
    const goalInput = document.getElementById('dailyGoal');
    const goal = parseInt(goalInput.value);
    
    if (goal > 0 && goal <= 10000) {
        appState.dailyGoal = goal;
        updateGoalProgress();
        saveLocalData();
        showToast(`تم تعيين الهدف اليومي إلى ${goal}`);
    } else {
        showToast('الرجاء إدخال هدف بين 1 و 10000', 'error');
    }
}

function updateGoalProgress() {
    const progress = Math.min((appState.counter / appState.dailyGoal) * 100, 100);
    const progressBar = document.getElementById('goalProgress');
    const goalText = document.getElementById('goalText');
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    if (goalText) {
        goalText.textContent = `${appState.counter}/${appState.dailyGoal}`;
    }
    
    // تغيير لون شريط التقدم حسب النسبة
    if (progressBar) {
        if (progress >= 100) {
            progressBar.style.background = 'var(--success-color)';
            if (progress === 100) {
                showToast('🎉 مبروك! لقد حققت هدفك اليومي!');
            }
        } else if (progress >= 75) {
            progressBar.style.background = 'var(--warning-color)';
        } else {
            progressBar.style.background = 'var(--primary-color)';
        }
    }
}

function updateTasbihStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = appState.tasbihHistory[today] ? 
        appState.tasbihHistory[today].reduce((sum, item) => sum + item.count, 0) : 0;
    
    // حساب إحصائيات الأسبوع
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    let weekCount = 0;
    
    Object.keys(appState.tasbihHistory).forEach(date => {
        const itemDate = new Date(date);
        if (itemDate >= weekAgo) {
            weekCount += appState.tasbihHistory[date].reduce((sum, item) => sum + item.count, 0);
        }
    });
    
    // حساب إحصائيات الشهر
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    let monthCount = 0;
    
    Object.keys(appState.tasbihHistory).forEach(date => {
        const itemDate = new Date(date);
        if (itemDate >= monthAgo) {
            monthCount += appState.tasbihHistory[date].reduce((sum, item) => sum + item.count, 0);
        }
    });
    
    // الإجمالي
    let totalCount = 0;
    Object.keys(appState.tasbihHistory).forEach(date => {
        totalCount += appState.tasbihHistory[date].reduce((sum, item) => sum + item.count, 0);
    });
    
    // تحديث الواجهة
    document.getElementById('todayStat').textContent = todayCount;
    document.getElementById('weekStat').textContent = weekCount;
    document.getElementById('monthStat').textContent = monthCount;
    document.getElementById('totalStat').textContent = totalCount;
}

function changeTasbihDesign(design) {
    const tasbihContainer = document.querySelector('.tasbih-container');
    tasbihContainer.className = `tasbih-container ${design}`;
    showToast(`تم تغيير التصميم إلى ${design}`);
}

// ===== البوصلة =====
function initializeCompass() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
    } else {
        showToast('المتصفح لا يدعم البوصلة');
    }
    
    // زر المعايرة
    document.getElementById('calibrateBtn').addEventListener('click', calibrateCompass);
    
    // مشاركة الموقع
    document.getElementById('shareLocationBtn').addEventListener('click', shareLocation);
}

function handleOrientation(event) {
    if (appState.currentPage !== 'qibla') return;
    
    const alpha = event.alpha; // درجة الدوران حول المحور Z (0-360)
    
    if (alpha !== null) {
        const needle = document.getElementById('compassNeedle');
        const qiblaIndicator = document.getElementById('qiblaIndicator');
        
        // تدوير الإبرة
        needle.style.transform = `translate(-50%, -50%) rotate(${alpha}deg)`;
        
        // حساب اتجاه القبلة (بسيط، في التطبيق الحقيقي يحتاج حسابات دقيقة)
        if (appState.userLocation) {
            const qiblaAngle = calculateQiblaDirection(appState.userLocation.lat, appState.userLocation.lon);
            const adjustedAngle = (360 - alpha + qiblaAngle) % 360;
            qiblaIndicator.style.transform = `translate(-50%, -50%) rotate(${adjustedAngle}deg)`;
            
            // تحديث المعلومات
            document.getElementById('qiblaDirection').textContent = `${Math.round(qiblaAngle)}°`;
        }
    }
}

function calculateQiblaDirection(lat, lon) {
    // إحداثيات الكعبة المشرفة
    const kaabaLat = 21.4225;
    const kaabaLon = 39.8262;
    
    // حساب اتجاه القبلة (صيغة مبسطة)
    const phiK = kaabaLat * Math.PI / 180;
    const lambdaK = kaabaLon * Math.PI / 180;
    const phi = lat * Math.PI / 180;
    const lambda = lon * Math.PI / 180;
    
    const y = Math.sin(lambdaK - lambda);
    const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
    
    let qibla = Math.atan2(y, x) * 180 / Math.PI;
    
    // التعديل للحصول على قيمة بين 0 و 360
    if (qibla < 0) qibla += 360;
    
    return qibla;
}

function calibrateCompass() {
    showToast('جاري معايرة البوصلة...');
    // في التطبيق الحقيقي، هنا سيتم تنفيذ خوارزمية المعايرة
    setTimeout(() => {
        showToast('تمت معايرة البوصلة بنجاح');
    }, 1000);
}

function shareLocation() {
    if (navigator.share && appState.userLocation) {
        navigator.share({
            title: 'موقعي الحالي',
            text: `موقعي: خط العرض ${appState.userLocation.lat.toFixed(4)}, خط الطول ${appState.userLocation.lon.toFixed(4)}`,
            url: window.location.href
        });
    } else {
        showToast('المتصفح لا يدعم مشاركة الموقع');
    }
}

function updateCompass() {
    if (appState.userLocation) {
        document.getElementById('latitudeValue').textContent = appState.userLocation.lat.toFixed(4);
        document.getElementById('longitudeValue').textContent = appState.userLocation.lon.toFixed(4);
        
        // حساب المسافة إلى مكة
        const distance = calculateDistanceToMakkah(appState.userLocation.lat, appState.userLocation.lon);
        document.getElementById('distanceToMakkah').textContent = `${distance.toFixed(0)} كم`;
    }
}

function calculateDistanceToMakkah(lat, lon) {
    const kaabaLat = 21.4225;
    const kaabaLon = 39.8262;
    
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (kaabaLat - lat) * Math.PI / 180;
    const dLon = (kaabaLon - lon) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(kaabaLat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ===== البث المباشر =====
function initializeRadio() {
    const playBtn = document.getElementById('radioPlayBtn');
    const pauseBtn = document.getElementById('radioPauseBtn');
    const stopBtn = document.getElementById('radioStopBtn');
    const volumeSlider = document.getElementById('radioVolume');
    
    let radioAudio = document.getElementById('radioAudio');
    let isPlaying = false;
    
    playBtn.addEventListener('click', () => {
        if (!isPlaying) {
            // محاكاة تشغيل البث المباشر
            radioAudio.src = 'https://quran.yousefheiba.com/api/radio';
            radioAudio.play();
            isPlaying = true;
            document.getElementById('radioStatus').innerHTML = '<i class="fas fa-circle"></i><span>مشغل</span>';
            showToast('جاري تشغيل البث المباشر...');
        }
    });
    
    pauseBtn.addEventListener('click', () => {
        if (isPlaying) {
            radioAudio.pause();
            isPlaying = false;
            document.getElementById('radioStatus').innerHTML = '<i class="fas fa-circle"></i><span>متوقف مؤقتاً</span>';
            showToast('تم إيقاف البث مؤقتاً');
        }
    });
    
    stopBtn.addEventListener('click', () => {
        radioAudio.pause();
        radioAudio.currentTime = 0;
        isPlaying = false;
        document.getElementById('radioStatus').innerHTML = '<i class="fas fa-circle"></i><span>متوقف</span>';
        showToast('تم إيقاف البث');
    });
    
    volumeSlider.addEventListener('input', (e) => {
        radioAudio.volume = e.target.value / 100;
    });
    
    // محاكاة عدد المستمعين
    updateListenersCount();
}

function updateListenersCount() {
    const countElement = document.getElementById('listenersCount');
    const count = Math.floor(Math.random() * 10000) + 5000;
    countElement.innerHTML = `<i class="fas fa-users"></i><span>${count.toLocaleString()} مستمع</span>`;
    
    // تحديث العدد كل 30 ثانية
    setTimeout(updateListenersCount, 30000);
}

// ===== الإشعارات =====
function initializeNotifications() {
    // إضافة بعض الإشعارات المثال
    addNotification('أذان الفجر', 'حان وقت أذان الفجر', 'azan');
    addNotification('تذكير بالتسبيح', 'لم تحقق هدف التسبيح اليومي بعد', 'tasbih');
    addNotification('رمضان كريم', 'تقبل الله طاعاتكم', 'info');
    
    // تحديث شارة الإشعارات
    updateNotificationBadge();
}

function addNotification(title, message, type = 'info') {
    const notification = {
        id: Date.now(),
        title,
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    appState.notifications.unshift(notification);
    updateNotificationBadge();
    updateNotificationList();
    
    // إشعار تلقائي
    if (appState.settings.notifications) {
        showNotification(title, message);
    }
}

function updateNotificationBadge() {
    const unreadCount = appState.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function updateNotificationList() {
    const list = document.getElementById('notificationList');
    if (!list) return;
    
    list.innerHTML = '';
    
    appState.notifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
        item.innerHTML = `
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${formatTime(notification.timestamp)}</div>
        `;
        
        item.addEventListener('click', () => {
            notification.read = true;
            updateNotificationBadge();
            updateNotificationList();
        });
        
        list.appendChild(item);
    });
}

function showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message, icon: '/assets/icons/icon-192.png' });
    }
}

// ===== الإعدادات =====
function initializeSettings() {
    // اللغة
    document.getElementById('languageSelect').value = appState.settings.language;
    document.getElementById('languageSelect').addEventListener('change', function() {
        appState.settings.language = this.value;
        saveLocalData();
        showToast('سيتم تطبيق اللغة بعد إعادة تشغيل التطبيق');
    });
    
    // التقويم
    document.getElementById('calendarSelect').value = appState.settings.calendar;
    document.getElementById('calendarSelect').addEventListener('change', function() {
        appState.settings.calendar = this.value;
        saveLocalData();
        updateDateDisplay();
    });
    
    // المنطقة الزمنية
    document.getElementById('timezoneSelect').value = appState.settings.timezone;
    
    // صوت المؤذن
    document.getElementById('azanSoundSelect').value = appState.settings.azanSound;
    
    // صوت المسبحة
    document.getElementById('tasbihSoundSelect').value = appState.settings.tasbihSound;
    
    // الإشعارات
    document.getElementById('notificationsToggle').checked = appState.settings.notifications;
    
    // الاهتزاز
    document.getElementById('vibrationToggle').checked = appState.settings.vibration;
    
    // المظاهر
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            themeOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            const theme = this.dataset.theme;
            changeTheme(theme);
        });
    });
    
    // مسح البيانات
    document.getElementById('clearCacheBtn').addEventListener('click', clearCache);
    document.getElementById('clearDataBtn').addEventListener('click', clearData);
    
    // تقييم التطبيق
    document.getElementById('rateAppBtn').addEventListener('click', rateApp);
    document.getElementById('shareAppBtn').addEventListener('click', shareApp);
    document.getElementById('contactUsBtn').addEventListener('click', contactUs);
}

function updateDateDisplay() {
    const calendarType = appState.settings.calendar;
    
    if (calendarType === 'hijri') {
        document.getElementById('gregorianDate').style.display = 'none';
        document.getElementById('hijriDate').style.display = 'block';
    } else if (calendarType === 'gregorian') {
        document.getElementById('hijriDate').style.display = 'none';
        document.getElementById('gregorianDate').style.display = 'block';
    } else {
        document.getElementById('hijriDate').style.display = 'block';
        document.getElementById('gregorianDate').style.display = 'block';
    }
}

function changeTheme(theme) {
    appState.currentTheme = theme;
    document.body.className = '';
    
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme !== 'light') {
        document.body.classList.add(theme + '-theme');
    }
    
    // تغيير ألوان CSS حسب الثيم
    document.documentElement.style.setProperty('--primary-color', getThemeColor(theme, 'primary'));
    saveLocalData();
    showToast(`تم تغيير المظهر إلى ${theme}`);
}

function getThemeColor(theme, type) {
    const colors = {
        green: { primary: '#2E7D32', secondary: '#FF9800' },
        blue: { primary: '#2196F3', secondary: '#FF9800' },
        dark: { primary: '#388E3C', secondary: '#FF9800' },
        light: { primary: '#2E7D32', secondary: '#FF9800' }
    };
    
    return colors[theme]?.[type] || colors.green[type];
}

function clearCache() {
    showModal('مسح الذاكرة المؤقتة', 'هل أنت متأكد من مسح الذاكرة المؤقتة؟', () => {
        // محاكاة مسح الذاكرة المؤقتة
        document.getElementById('cacheSize').textContent = '0 MB';
        showToast('تم مسح الذاكرة المؤقتة بنجاح');
    });
}

function clearData() {
    showModal('مسح جميع البيانات', 'هل أنت متأكد من مسح جميع البيانات المحفوظة؟ سيتم حذف جميع الإعدادات والإحصائيات.', () => {
        localStorage.clear();
        appState = {
            ...appState,
            counter: 0,
            tasbihHistory: {},
            notifications: []
        };
        
        showToast('تم مسح جميع البيانات بنجاح');
        setTimeout(() => location.reload(), 1000);
    });
}

function rateApp() {
    showToast('سيتم فتح صفحة التقييم...');
    // في التطبيق الحقيقي: window.open('https://...')
}

function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'تطبيق ليزي رمضان',
            text: 'تطبيق رمضاني متكامل مع مؤذن ذكي، قرآن، مسبحة إلكترونية وأكثر!',
            url: window.location.href
        });
    } else {
        showToast('المتصفح لا يدعم المشاركة');
    }
}

function contactUs() {
    window.location.href = 'mailto:support@lazyramadan.com?subject=تطبيق ليزي رمضان';
}

// ===== التنقل =====
function initializeEventListeners() {
    // القائمة الجانبية
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
    document.getElementById('closeSidebar').addEventListener('click', toggleSidebar);
    
    // التنقل في القائمة
    document.querySelectorAll('.menu-item, .nav-btn').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            navigateTo(section);
            toggleSidebar();
        });
    });
    
    // التنقل السريع
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', function() {
            const section = this.dataset.section;
            navigateTo(section);
        });
    });
    
    // الإشعارات
    document.getElementById('notificationBtn').addEventListener('click', toggleNotifications);
    document.getElementById('closeNotifications').addEventListener('click', toggleNotifications);
    
    // تغيير الثيم
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // إغلاق الفيديو
    document.getElementById('closeVideo').addEventListener('click', () => {
        document.getElementById('videoOverlay').classList.remove('show');
        document.getElementById('azanVideo').pause();
    });
    
    // المودال
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalConfirm').addEventListener('click', confirmModal);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    
    // تهيئة المسبحة
    initializeTasbih();
    
    // تهيئة الإعدادات
    initializeSettings();
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

function navigateTo(section) {
    // تحديث الصفحة النشطة
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.querySelectorAll('.menu-item, .nav-btn').forEach(item => {
        item.classList.remove('active');
    });
    
    // إظهار الصفحة المطلوبة
    document.getElementById(section + 'Page').classList.add('active');
    
    // تحديث العناصر النشطة
    document.querySelectorAll(`[data-section="${section}"]`).forEach(item => {
        item.classList.add('active');
    });
    
    // تحديث الحالة
    appState.currentPage = section;
    
    // تنفيذ إجراءات خاصة لكل صفحة
    onPageChange(section);
    
    // إغلاق القائمة الجانبية إذا كانت مفتوحة
    if (window.innerWidth < 768) {
        toggleSidebar();
    }
}

function onPageChange(page) {
    switch(page) {
        case 'qibla':
            updateCompass();
            break;
        case 'radio':
            updateListenersCount();
            break;
        case 'tasbih':
            updateTasbihStats();
            updateGoalProgress();
            break;
    }
}

function toggleNotifications() {
    document.getElementById('notificationPanel').classList.toggle('show');
}

function toggleTheme() {
    const currentTheme = appState.currentTheme;
    const themes = ['green', 'blue', 'dark', 'light'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    changeTheme(nextTheme);
}

// ===== الأدوات المساعدة =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    // تغيير اللون حسب النوع
    if (type === 'error') {
        toast.style.background = 'var(--danger-color)';
    } else if (type === 'warning') {
        toast.style.background = 'var(--warning-color)';
    } else {
        toast.style.background = 'var(--success-color)';
    }
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showModal(title, message, onConfirm = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalOverlay = document.getElementById('modalOverlay');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = message;
    modalOverlay.classList.add('show');
    
    if (onConfirm) {
        window.modalConfirmCallback = onConfirm;
    }
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    window.modalConfirmCallback = null;
}

function confirmModal() {
    if (window.modalConfirmCallback) {
        window.modalConfirmCallback();
    }
    closeModal();
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
        return 'الآن';
    } else if (diffMins < 60) {
        return `قبل ${diffMins} دقيقة`;
    } else if (diffHours < 24) {
        return `قبل ${diffHours} ساعة`;
    } else if (diffDays < 7) {
        return `قبل ${diffDays} يوم`;
    } else {
        return date.toLocaleDateString('ar-SA');
    }
}

function playClickSound() {
    const audio = document.getElementById('clickSound');
    audio.currentTime = 0;
    audio.play();
}

function playIftarNotification() {
    const audio = document.getElementById('clickSound');
    audio.currentTime = 0;
    audio.play();
    
    if (appState.settings.vibration && navigator.vibrate) {
        navigator.vibrate([500, 200, 500]);
    }
}

function playDuaAudio(id) {
    showToast('جاري تشغيل الدعاء...');
}

function copyDuaText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('تم نسخ الدعاء');
    });
}

function shareDua(text) {
    if (navigator.share) {
        navigator.share({
            title: 'دعاء من تطبيق ليزي رمضان',
            text: text,
            url: window.location.href
        });
    } else {
        copyDuaText(text);
        showToast('تم نسخ الدعاء للمشاركة');
    }
}

// ===== دعم PWA =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// ===== دعم الإشعارات =====
if ('Notification' in window) {
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// ===== دعم التركيز =====
if ('wakeLock' in navigator) {
    let wakeLock = null;
    
    const requestWakeLock = async () => {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('تم تفعيل منع إغلاق الشاشة');
        } catch (err) {
            console.error('فشل في تفعيل منع إغلاق الشاشة:', err);
        }
    };
    
    requestWakeLock();
}

// ===== تهيئة كاملة =====
console.log('✅ تم تحميل تطبيق ليزي رمضان بنجاح');