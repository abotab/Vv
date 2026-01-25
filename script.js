class LazyRamadanApp {
    constructor() {
        this.currentPage = 'home';
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.prayerTimes = null;
        this.currentLocation = null;
        this.adhanAudio = null;
        this.quranAudio = null;
        this.tasbeehCount = 0;
        this.tasbeehType = 'سبحان الله';
        this.fastingStartTime = null;
        this.azkarData = {};
        this.duaData = {};
        this.hadiths = [];
        this.quranSurahs = [];
        
        this.init();
    }

    async init() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.loadHadiths();
        this.loadAzkar();
        this.loadDua();
        this.loadQuranSurahs();
        this.loadImsakiyah();
        this.loadPrayerHistory();
        this.loadTasbeehHistory();
        this.setupEventListeners();
        this.startClocks();
        this.updateNextPrayer();
        this.startFastingTimer();
        this.getLocation();
        this.requestNotificationPermission();
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }
    }

    loadHadiths() {
        const hadithsData = [
            {id: 1, text: "من صام رمضان إيماناً واحتساباً غفر له ما تقدم من ذنبه", ref: "رواه البخاري ومسلم"},
            {id: 2, text: "الصلاة نور", ref: "رواه مسلم"},
            {id: 3, text: "الدين النصيحة", ref: "رواه مسلم"},
            {id: 4, text: "الطهور شطر الإيمان", ref: "رواه مسلم"},
            {id: 5, text: "اتقوا النار ولو بشق تمرة", ref: "رواه البخاري ومسلم"},
            {id: 6, text: "إنما الأعمال بالنيات", ref: "رواه البخاري ومسلم"},
            {id: 7, text: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه", ref: "رواه البخاري ومسلم"},
            {id: 8, text: "الكلمة الطيبة صدقة", ref: "رواه البخاري ومسلم"},
            {id: 9, text: "تبسمك في وجه أخيك صدقة", ref: "رواه الترمذي"},
            {id: 10, text: "الحياء شعبة من الإيمان", ref: "رواه البخاري ومسلم"}
        ];
        this.hadiths = hadithsData;
        this.showDailyHadith();
    }

    showDailyHadith() {
        const today = new Date().getDate();
        const hadithIndex = today % this.hadiths.length;
        const hadith = this.hadiths[hadithIndex];
        
        document.getElementById('dailyHadith').textContent = hadith.text;
        document.getElementById('hadithReference').textContent = hadith.ref;
    }

    async loadAzkar() {
        try {
            const response = await fetch('https://quran.yousefheiba.com/api/azkar');
            if (response.ok) {
                this.azkarData = await response.json();
                this.displayAzkar();
            } else {
                this.loadDefaultAzkar();
            }
        } catch (error) {
            this.loadDefaultAzkar();
        }
    }

    loadDefaultAzkar() {
        this.azkarData = {
            morning: [
                {text: "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", count: 1},
                {text: "اللهم ما أصبح بي من نعمة أو بأحد من خلقك فمنك وحدك لا شريك لك، فلك الحمد ولك الشكر", count: 1},
                {text: "اللهم إني أصبحت أشهدك، وأشهد حملة عرشك، وملائكتك، وجميع خلقك، أنك أنت الله لا إله إلا أنت وحدك لا شريك لك، وأن محمداً عبدك ورسولك", count: 4}
            ],
            evening: [
                {text: "أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", count: 1},
                {text: "اللهم ما أمسى بي من نعمة أو بأحد من خلقك فمنك وحدك لا شريك لك، فلك الحمد ولك الشكر", count: 1},
                {text: "اللهم إني أمسيت أشهدك، وأشهد حملة عرشك، وملائكتك، وجميع خلقك، أنك أنت الله لا إله إلا أنت وحدك لا شريك لك، وأن محمداً عبدك ورسولك", count: 4}
            ],
            prayer: [
                {text: "سبحان الله", count: 33},
                {text: "الحمد لله", count: 33},
                {text: "الله أكبر", count: 33},
                {text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", count: 1}
            ]
        };
        this.displayAzkar();
    }

    displayAzkar() {
        const containers = {
            morning: document.getElementById('morningAzkar'),
            evening: document.getElementById('eveningAzkar'),
            prayer: document.getElementById('prayerAzkar')
        };

        for (const [type, container] of Object.entries(containers)) {
            if (this.azkarData[type]) {
                container.innerHTML = this.azkarData[type].map(azkar => `
                    <div class="azkar-item">
                        <div class="azkar-text">${azkar.text}</div>
                        <div class="azkar-count">${azkar.count} مرة</div>
                    </div>
                `).join('');
            }
        }

        document.getElementById('ramadanAzkar').innerHTML = `
            <div class="azkar-item">
                <div class="azkar-text">اللهم بلغنا رمضان وأعنا على الصيام والقيام وتلاوة القرآن</div>
                <div class="azkar-count">مستحب في رمضان</div>
            </div>
            <div class="azkar-item">
                <div class="azkar-text">اللهم إني أسألك رحمتك التي وسعت كل شيء، أن تغفر لي ذنوبي</div>
                <div class="azkar-count">مستحب في رمضان</div>
            </div>
        `;
    }

    async loadDua() {
        try {
            const response = await fetch('https://quran.yousefheiba.com/api/duas');
            if (response.ok) {
                this.duaData = await response.json();
                this.displayDua();
            } else {
                this.loadDefaultDua();
            }
        } catch (error) {
            this.loadDefaultDua();
        }
    }

    loadDefaultDua() {
        this.duaData = {
            quran: [
                {text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", ref: "البقرة: 201"},
                {text: "رَبِّ اغْفِرْ وَارْحَمْ وَأَنْتَ خَيْرُ الرَّاحِمِينَ", ref: "المؤمنون: 118"}
            ],
            prophet: [
                {text: "اللهم إني أسألك العفو والعافية في الدنيا والآخرة", ref: "رواه أبو داود"},
                {text: "اللهم إني أعوذ بك من الهم والحزن، والعجز والكسل، والبخل والجبن، وضلع الدين وغلبة الرجال", ref: "رواه البخاري"}
            ],
            iftar: [
                {text: "اللهم لك صمت وعلى رزقك أفطرت", ref: "دعاء الإفطار"},
                {text: "ذهب الظمأ وابتلت العروق وثبت الأجر إن شاء الله", ref: "دعاء الإفطار"}
            ]
        };
        this.displayDua();
    }

    displayDua() {
        const duaList = document.getElementById('duaList');
        if (this.duaData.quran) {
            duaList.innerHTML = this.duaData.quran.map(dua => `
                <div class="azkar-item">
                    <div class="azkar-text">${dua.text}</div>
                    <div class="azkar-count">${dua.ref}</div>
                </div>
            `).join('');
        }
    }

    async loadQuranSurahs() {
        try {
            const response = await fetch('https://quran.yousefheiba.com/api/surahs');
            if (response.ok) {
                const data = await response.json();
                this.quranSurahs = data.surahs || [];
                this.displaySurahs();
            } else {
                this.loadDefaultSurahs();
            }
        } catch (error) {
            this.loadDefaultSurahs();
        }
    }

    loadDefaultSurahs() {
        this.quranSurahs = [
            {number: 1, name: "الفاتحة", englishName: "Al-Fatihah", numberOfAyahs: 7, revelationType: "Meccan"},
            {number: 2, name: "البقرة", englishName: "Al-Baqarah", numberOfAyahs: 286, revelationType: "Medinan"},
            {number: 114, name: "الناس", englishName: "An-Nas", numberOfAyahs: 6, revelationType: "Meccan"}
        ];
        this.displaySurahs();
    }

    displaySurahs() {
        const surahList = document.getElementById('surahList');
        surahList.innerHTML = this.quranSurahs.map(surah => `
            <div class="surah-item" data-surah="${surah.number}">
                <div class="surah-name">${surah.name}</div>
                <div class="surah-details">${surah.numberOfAyahs} آية - ${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</div>
            </div>
        `).join('');
    }

    loadImsakiyah() {
        const tableBody = document.getElementById('imsakiyahBody');
        let html = '';
        
        for (let day = 1; day <= 30; day++) {
            const suhourTime = this.calculateSuhourTime(day);
            const fajrTime = this.calculateFajrTime(day);
            const maghribTime = this.calculateMaghribTime(day);
            const gregorianDate = this.calculateGregorianDate(day);
            const dayName = this.getDayName(day);
            
            html += `
                <tr>
                    <td>${dayName}</td>
                    <td>${day}</td>
                    <td>${gregorianDate}</td>
                    <td>${suhourTime}</td>
                    <td>${fajrTime}</td>
                    <td>${maghribTime}</td>
                </tr>
            `;
        }
        
        tableBody.innerHTML = html;
    }

    calculateSuhourTime(day) {
        const baseTime = "04:46";
        const [hours, minutes] = baseTime.split(':').map(Number);
        const adjustedMinutes = minutes - (day * 1);
        const adjustedHours = hours + Math.floor(adjustedMinutes / 60);
        const finalMinutes = adjustedMinutes % 60;
        return `${adjustedHours.toString().padStart(2, '0')}:${Math.abs(finalMinutes).toString().padStart(2, '0')}`;
    }

    calculateFajrTime(day) {
        const baseTime = "05:37";
        const [hours, minutes] = baseTime.split(':').map(Number);
        const adjustedMinutes = minutes - (day * 1);
        const adjustedHours = hours + Math.floor(adjustedMinutes / 60);
        const finalMinutes = adjustedMinutes % 60;
        return `${adjustedHours.toString().padStart(2, '0')}:${Math.abs(finalMinutes).toString().padStart(2, '0')}`;
    }

    calculateMaghribTime(day) {
        const baseTime = "18:29";
        const [hours, minutes] = baseTime.split(':').map(Number);
        const adjustedMinutes = minutes + (day * 1);
        const adjustedHours = hours + Math.floor(adjustedMinutes / 60);
        const finalMinutes = adjustedMinutes % 60;
        return `${adjustedHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
    }

    calculateGregorianDate(day) {
        const baseDate = new Date(2026, 1, 18);
        baseDate.setDate(baseDate.getDate() + (day - 1));
        return `${baseDate.getDate()}/${baseDate.getMonth() + 1}`;
    }

    getDayName(day) {
        const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
        const baseIndex = 3;
        return days[(baseIndex + day - 1) % 7];
    }

    loadPrayerHistory() {
        const historyGrid = document.getElementById('prayerHistory');
        let html = '';
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayName = date.toLocaleDateString('ar-SA', { weekday: 'short' });
            const isPrayed = Math.random() > 0.3;
            
            html += `
                <div class="history-item ${isPrayed ? 'prayed' : ''}">
                    <div>${dayName}</div>
                    <div>${date.getDate()}</div>
                </div>
            `;
        }
        
        historyGrid.innerHTML = html;
    }

    loadTasbeehHistory() {
        const historyList = document.getElementById('tasbeehHistory');
        const history = JSON.parse(localStorage.getItem('tasbeehHistory')) || [];
        
        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div>${item.date}</div>
                <div>${item.count} ${item.type}</div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchPage(e.target.closest('.nav-btn').dataset.page);
            });
        });

        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('dateSwitch').addEventListener('click', () => {
            this.toggleDate();
        });

        document.getElementById('notificationsBtn').addEventListener('click', () => {
            this.showNotifications();
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.switchPage('more');
            setTimeout(() => {
                document.getElementById('settingsPageBtn').click();
            }, 100);
        });

        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.id;
                if (id === 'qiblaBtn') this.findQibla();
                if (id === 'adhanBtn') this.playAdhan();
                if (id === 'duaBtn') this.showRandomDua();
                if (id === 'recipesBtn') this.showRecipes();
            });
        });

        document.getElementById('findQibla').addEventListener('click', () => {
            this.findQibla();
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchAzkarTab(tab);
            });
        });

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.switchDuaCategory(category);
            });
        });

        document.querySelectorAll('.bead').forEach(bead => {
            bead.addEventListener('click', (e) => {
                const dhikr = e.currentTarget.dataset.dhikr;
                this.updateTasbeeh(dhikr);
            });
        });

        document.getElementById('resetTasbeeh').addEventListener('click', () => {
            this.resetTasbeeh();
        });

        document.getElementById('saveTasbeeh').addEventListener('click', () => {
            this.saveTasbeeh();
        });

        document.getElementById('setGoal').addEventListener('click', () => {
            this.setTasbeehGoal();
        });

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.loadTasbeehPreset(preset);
            });
        });

        document.getElementById('startFasting').addEventListener('click', () => {
            this.startFasting();
        });

        document.getElementById('breakFasting').addEventListener('click', () => {
            this.breakFasting();
        });

        document.querySelectorAll('.more-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.id;
                if (id === 'settingsPageBtn') this.showSettings();
                if (id === 'liveRadioBtn') this.showLiveRadio();
                if (id === 'seerahBtn') this.showSeerah();
                if (id === 'laylatQadrBtn') this.showLaylatQadr();
                if (id === 'nightPrayerBtn') this.showNightPrayer();
                if (id === 'aboutBtn') this.showAbout();
            });
        });

        document.getElementById('darkModeToggle').addEventListener('change', (e) => {
            this.toggleDarkMode(e.target.checked);
        });

        document.getElementById('radioPlayBtn').addEventListener('click', () => {
            this.toggleRadio();
        });

        document.getElementById('snoozeAdhan').addEventListener('click', () => {
            this.snoozeAdhan();
        });

        document.getElementById('playAdhanNow').addEventListener('click', () => {
            this.playAdhanNotification();
        });

        document.getElementById('closeAdhan').addEventListener('click', () => {
            this.closeAdhanPlayer();
        });

        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.toggleQuranPlayback();
        });

        window.addEventListener('deviceorientation', (e) => {
            this.updateCompass(e.alpha);
        });

        window.addEventListener('online', () => {
            this.showToast('تم استعادة الاتصال بالإنترنت');
        });

        window.addEventListener('offline', () => {
            this.showToast('تم فقد الاتصال بالإنترنت - التطبيق يعمل بدون اتصال');
        });
    }

    switchPage(page) {
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(page + 'Page').classList.add('active');
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        this.currentPage = page;

        if (page === 'tasbeeh') {
            this.updateTasbeehDisplay();
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    toggleDate() {
        const hijriDate = document.getElementById('hijriDate');
        const gregorianDate = document.getElementById('gregorianDate');
        
        hijriDate.classList.toggle('hidden');
        gregorianDate.classList.toggle('hidden');
    }

    startClocks() {
        this.updateClock();
        setInterval(() => {
            this.updateClock();
            this.updateNextPrayer();
        }, 1000);
    }

    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ar-SA', { hour12: false, hour: '2-digit', minute: '2-digit' });
        document.getElementById('currentTime').textContent = timeString;
    }

    updateNextPrayer() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        const prayers = [
            { name: 'الفجر', time: '05:37' },
            { name: 'الشروق', time: '07:02' },
            { name: 'الظهر', time: '12:19' },
            { name: 'العصر', time: '15:40' },
            { name: 'المغرب', time: '18:29' },
            { name: 'العشاء', time: '19:43' }
        ];

        let nextPrayer = prayers[prayers.length - 1];
        let nextPrayerTime = null;

        for (const prayer of prayers) {
            const [hour, minute] = prayer.time.split(':').map(Number);
            const prayerTime = hour * 60 + minute;
            const currentTime = currentHour * 60 + currentMinute;

            if (prayerTime > currentTime) {
                nextPrayer = prayer;
                nextPrayerTime = prayerTime - currentTime;
                break;
            }
        }

        if (!nextPrayerTime) {
            nextPrayer = prayers[0];
            const [hour, minute] = nextPrayer.time.split(':').map(Number);
            const prayerTime = hour * 60 + minute;
            nextPrayerTime = prayerTime + (24 * 60 - (currentHour * 60 + currentMinute));
        }

        const hours = Math.floor(nextPrayerTime / 60);
        const minutes = nextPrayerTime % 60;
        
        document.getElementById('nextPrayerName').textContent = nextPrayer.name;
        document.getElementById('nextPrayerCountdown').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    async getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.fetchPrayerTimes();
                    this.calculateQibla();
                },
                (error) => {
                    console.log('Error getting location:', error);
                    this.useDefaultLocation();
                }
            );
        } else {
            this.useDefaultLocation();
        }
    }

    useDefaultLocation() {
        this.currentLocation = { lat: 21.4225, lng: 39.8262 };
        this.fetchPrayerTimes();
        this.calculateQibla();
    }

    async fetchPrayerTimes() {
        try {
            const response = await fetch(
                `https://api.aladhan.com/v1/timings/${this.getTodayDate()}?latitude=${this.currentLocation.lat}&longitude=${this.currentLocation.lng}&method=4`
            );
            
            if (response.ok) {
                const data = await response.json();
                this.prayerTimes = data.data.timings;
                this.updatePrayerTimesDisplay();
            }
        } catch (error) {
            console.log('Error fetching prayer times:', error);
        }
    }

    getTodayDate() {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    }

    updatePrayerTimesDisplay() {
        if (!this.prayerTimes) return;

        const prayerElements = {
            'الفجر': document.querySelector('.prayer-time:nth-child(1) .prayer-time-azan'),
            'الشروق': document.querySelector('.prayer-time:nth-child(2) .prayer-time-azan'),
            'الظهر': document.querySelector('.prayer-time:nth-child(3) .prayer-time-azan'),
            'العصر': document.querySelector('.prayer-time:nth-child(4) .prayer-time-azan'),
            'المغرب': document.querySelector('.prayer-time:nth-child(5) .prayer-time-azan'),
            'العشاء': document.querySelector('.prayer-time:nth-child(6) .prayer-time-azan')
        };

        for (const [prayer, element] of Object.entries(prayerElements)) {
            if (this.prayerTimes[prayer.toLowerCase()] && element) {
                const time = this.prayerTimes[prayer.toLowerCase()];
                element.textContent = time.substring(0, 5);
            }
        }
    }

    calculateQibla() {
        if (!this.currentLocation) return;

        const makkah = { lat: 21.4225, lng: 39.8262 };
        const lat1 = this.currentLocation.lat * Math.PI / 180;
        const lat2 = makkah.lat * Math.PI / 180;
        const lngDiff = (makkah.lng - this.currentLocation.lng) * Math.PI / 180;

        const y = Math.sin(lngDiff);
        const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(lngDiff);
        let qibla = Math.atan2(y, x) * 180 / Math.PI;

        qibla = (qibla + 360) % 360;
        
        document.getElementById('qiblaAngle').textContent = Math.round(qibla) + '°';
        
        const qiblaIndicator = document.getElementById('qiblaIndicator');
        if (qiblaIndicator) {
            qiblaIndicator.style.transform = `translate(-50%, -100%) rotate(${qibla}deg)`;
        }
    }

    findQibla() {
        this.switchPage('prayer');
        
        if (!this.currentLocation) {
            this.getLocation();
        }
        
        if (window.DeviceOrientationEvent) {
            this.showToast('حرك هاتفك لتحديد اتجاه القبلة');
        } else {
            this.showToast('هاتفك لا يدعم البوصلة. تم عرض اتجاه القبلة بناءً على موقعك.');
        }
    }

    updateCompass(alpha) {
        const needle = document.querySelector('.compass-needle');
        if (needle) {
            needle.style.transform = `translate(-50%, -100%) rotate(${alpha}deg)`;
        }
    }

    playAdhan() {
        const prayerName = document.getElementById('nextPrayerName').textContent;
        const videoSources = [
            'https://j.top4top.io/m_3675du7yg0.mp4',
            'https://k.top4top.io/m_3675lh1nn0.mp4',
            'https://f.top4top.io/m_36754qx8g0.mp4',
            'https://b.top4top.io/m_36759dac10.mp4',
            'https://f.top4top.io/m_3675e4zi30.mp4',
            'https://h.top4top.io/m_36769ugnc0.mp4'
        ];

        const randomVideo = videoSources[Math.floor(Math.random() * videoSources.length)];
        
        document.getElementById('adhanPrayerName').textContent = prayerName;
        document.getElementById('adhanVideo').src = randomVideo;
        document.getElementById('adhanPlayer').classList.remove('hidden');
        
        const video = document.getElementById('adhanVideo');
        video.play();
        
        if (localStorage.getItem('vibration') === 'true') {
            navigator.vibrate([200, 100, 200]);
        }
    }

    showRandomDua() {
        const duas = this.duaData.quran || [];
        if (duas.length > 0) {
            const randomDua = duas[Math.floor(Math.random() * duas.length)];
            this.showToast(randomDua.text, 5000);
        }
    }

    showRecipes() {
        const recipes = [
            { name: "شوربة العدس", time: "30 دقيقة", difficulty: "سهلة" },
            { name: "سمبوسة رمضانية", time: "45 دقيقة", difficulty: "متوسطة" },
            { name: "طاجن الدجاج", time: "60 دقيقة", difficulty: "متوسطة" },
            { name: "سلطة رمضانية", time: "15 دقيقة", difficulty: "سهلة" }
        ];

        const recipesGrid = document.getElementById('recipesGrid');
        recipesGrid.innerHTML = recipes.map(recipe => `
            <div class="recipe-card">
                <h4>${recipe.name}</h4>
                <p>⏱️ ${recipe.time}</p>
                <p>📊 ${recipe.difficulty}</p>
            </div>
        `).join('');

        this.switchPage('fasting');
    }

    switchAzkarTab(tab) {
        document.querySelectorAll('.azkar-list').forEach(list => {
            list.classList.add('hidden');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(tab + 'Azkar').classList.remove('hidden');
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    }

    switchDuaCategory(category) {
        const duaList = document.getElementById('duaList');
        
        if (this.duaData[category]) {
            duaList.innerHTML = this.duaData[category].map(dua => `
                <div class="azkar-item">
                    <div class="azkar-text">${dua.text}</div>
                    <div class="azkar-count">${dua.ref}</div>
                </div>
            `).join('');
        }
    }

    updateTasbeeh(dhikr) {
        this.tasbeehCount++;
        this.tasbeehType = dhikr;
        this.updateTasbeehDisplay();
        
        if (localStorage.getItem('vibration') === 'true') {
            navigator.vibrate(50);
        }
    }

    updateTasbeehDisplay() {
        document.getElementById('tasbeehCount').textContent = this.tasbeehCount;
        document.getElementById('tasbeehText').textContent = this.tasbeehType;
    }

    resetTasbeeh() {
        this.tasbeehCount = 0;
        this.tasbeehType = 'سبحان الله';
        this.updateTasbeehDisplay();
    }

    saveTasbeeh() {
        const today = new Date().toLocaleDateString('ar-SA');
        const history = JSON.parse(localStorage.getItem('tasbeehHistory')) || [];
        
        history.push({
            date: today,
            count: this.tasbeehCount,
            type: this.tasbeehType
        });
        
        localStorage.setItem('tasbeehHistory', JSON.stringify(history));
        this.loadTasbeehHistory();
        this.showToast('تم حفظ التسبيح بنجاح');
    }

    setTasbeehGoal() {
        const goal = prompt('حدد هدف التسبيح اليومي:', '100');
        if (goal && !isNaN(goal)) {
            localStorage.setItem('tasbeehGoal', goal);
            this.showToast(`تم تعيين الهدف اليومي إلى ${goal} تسبيحة`);
        }
    }

    loadTasbeehPreset(preset) {
        const presets = {
            morning: { dhikr: 'سبحان الله وبحمده', count: 100 },
            evening: { dhikr: 'الحمد لله', count: 100 },
            afterPrayer: { dhikr: 'سبحان الله والحمد لله ولا إله إلا الله والله أكبر', count: 33 },
            sleep: { dhikr: 'أعوذ بكلمات الله التامات من شر ما خلق', count: 3 }
        };

        if (presets[preset]) {
            this.tasbeehType = presets[preset].dhikr;
            const goal = presets[preset].count;
            this.showToast(`تم تحميل ${preset} - الهدف: ${goal} مرة`);
            this.updateTasbeehDisplay();
        }
    }

    startFasting() {
        this.fastingStartTime = new Date();
        this.showToast('بدأت الصيام - بارك الله فيك');
        this.updateFastingStatus();
    }

    breakFasting() {
        if (this.fastingStartTime) {
            const now = new Date();
            const diff = now - this.fastingStartTime;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            this.showToast(`أفطرت بعد ${hours} ساعة و ${minutes} دقيقة - تقبل الله منا ومنك`);
            this.fastingStartTime = null;
        } else {
            this.showToast('لم تبدأ الصيام بعد');
        }
    }

    startFastingTimer() {
        setInterval(() => {
            this.updateFastingStatus();
        }, 60000);
        
        this.updateFastingStatus();
    }

    updateFastingStatus() {
        const now = new Date();
        const iftarTime = new Date();
        iftarTime.setHours(18, 29, 0, 0);

        if (now > iftarTime) {
            iftarTime.setDate(iftarTime.getDate() + 1);
        }

        const diff = iftarTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        document.getElementById('fastingHours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('fastingMinutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('iftarCountdown').textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        if (this.fastingStartTime) {
            document.getElementById('fastingStatus').textContent = 'متبقي للإفطار';
        } else {
            document.getElementById('fastingStatus').textContent = 'لم تبدأ الصيام بعد';
        }
    }

    showSettings() {
        document.querySelectorAll('.more-content > div').forEach(div => {
            div.classList.add('hidden');
        });
        document.getElementById('settingsContent').classList.remove('hidden');
    }

    showLiveRadio() {
        document.querySelectorAll('.more-content > div').forEach(div => {
            div.classList.add('hidden');
        });
        document.getElementById('liveRadio').classList.remove('hidden');
    }

    showSeerah() {
        this.showToast('قسم السيرة النبوية قيد التطوير');
    }

    showLaylatQadr() {
        this.showToast('معلومات ليلة القدر قيد التطوير');
    }

    showNightPrayer() {
        this.showToast('تذكير قيام الليل سيكون في الثلث الأخير من الليل');
    }

    showAbout() {
        this.showToast('ليزي رمضان - تطبيق رمضان الشامل - الإصدار 1.0.0');
    }

    toggleDarkMode(enabled) {
        this.currentTheme = enabled ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }

    toggleRadio() {
        const btn = document.getElementById('radioPlayBtn');
        const icon = btn.querySelector('i');
        
        if (icon.classList.contains('fa-play')) {
            icon.className = 'fas fa-pause';
            this.showToast('جاري تشغيل الراديو...');
        } else {
            icon.className = 'fas fa-play';
            this.showToast('تم إيقاف الراديو');
        }
    }

    showNotifications() {
        this.showToast('لديك 3 إشعارات غير مقروءة');
    }

    snoozeAdhan() {
        document.getElementById('adhanNotification').classList.add('hidden');
        this.showToast('تم تأجيل التنبيه لمدة 5 دقائق');
        
        setTimeout(() => {
            this.showAdhanNotification();
        }, 5 * 60 * 1000);
    }

    playAdhanNotification() {
        document.getElementById('adhanNotification').classList.add('hidden');
        this.playAdhan();
    }

    closeAdhanPlayer() {
        document.getElementById('adhanPlayer').classList.add('hidden');
        const video = document.getElementById('adhanVideo');
        video.pause();
        video.currentTime = 0;
    }

    toggleQuranPlayback() {
        const btn = document.getElementById('playPauseBtn');
        const icon = btn.querySelector('i');
        
        if (icon.classList.contains('fa-play')) {
            icon.className = 'fas fa-pause';
            this.showToast('جاري تشغيل التلاوة...');
        } else {
            icon.className = 'fas fa-play';
            this.showToast('تم إيقاف التلاوة');
        }
    }

    showAdhanNotification() {
        const notification = document.getElementById('adhanNotification');
        const prayerName = document.getElementById('nextPrayerName').textContent;
        
        document.getElementById('prayerNameNotif').textContent = prayerName;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('ar-SA', { hour12: false, hour: '2-digit', minute: '2-digit' });
        document.getElementById('currentPrayerTime').textContent = timeString;
        
        notification.classList.remove('hidden');
        
        if (localStorage.getItem('notifications') === 'true') {
            if (Notification.permission === 'granted') {
                new Notification(`حان وقت صلاة ${prayerName}`, {
                    body: 'اضغط لتشغيل الأذان',
                    icon: '/assets/images/logos/logo-192.png'
                });
            }
        }
    }

    requestNotificationPermission() {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-color);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            z-index: 9999;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: toastSlideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }

    loadHealthTips() {
        const tips = [
            "اشرب 8 أكواب من الماء بين الإفطار والسحور",
            "تجنب الأطعمة المقلية والمشروبات الغازية",
            "ابدأ إفطارك بالتمر والماء",
            "تناول السحور متأخراً قدر الإمكان",
            "مارس الرياضة بعد الإفطار بساعتين"
        ];

        const tipsSlider = document.getElementById('healthTips');
        tipsSlider.innerHTML = tips.map(tip => `
            <div class="tip-card">
                <p>${tip}</p>
            </div>
        `).join('');
    }
}

window.addEventListener('load', () => {
    new LazyRamadanApp();
});

const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideIn {
        from { transform: translateX(-50%) translateY(-50px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes toastSlideOut {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-50px); opacity: 0; }
    }
    
    .toast {
        font-family: 'Tajawal', sans-serif;
        font-weight: 500;
    }
    
    .recipe-card {
        background: #f8f9fa;
        padding: 15px;
        border-radius: var(--radius);
        margin-bottom: 10px;
        border-left: 4px solid var(--accent-color);
    }
    
    [data-theme="dark"] .recipe-card {
        background: #252525;
    }
`;
document.head.appendChild(style);