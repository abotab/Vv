class LazyRamadanApp {
    constructor() {
        this.currentDateType = 'hijri';
        this.prayerTimes = {
            fajr: '05:04',
            sunrise: '06:23',
            dhuhr: '12:19',
            asr: '03:40',
            maghrib: '06:05',
            isha: '07:30'
        };
        
        this.eqamaTimes = {
            fajr: '05:53',
            dhuhr: '12:29',
            asr: '03:20',
            maghrib: '05:36',
            isha: '06:58'
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDateTime();
        this.setupPrayerCountdown();
        this.loadDailyContent();
        this.setupNotifications();
        this.setupModals();
    }

    setupEventListeners() {
        document.getElementById('dateToggle').addEventListener('click', () => this.toggleDateType());
        document.getElementById('notificationBell').addEventListener('click', () => this.showNotifications());
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(btn.closest('.modal')));
        });
        
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleActionClick(e));
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
    }

    toggleDateType() {
        this.currentDateType = this.currentDateType === 'hijri' ? 'gregorian' : 'hijri';
        this.updateDateTime();
        
        const toggleBtn = document.getElementById('dateToggle');
        toggleBtn.textContent = this.currentDateType === 'hijri' ? 'الميلادي' : 'الهجري';
    }

    updateDateTime() {
        const now = new Date();
        
        if (this.currentDateType === 'hijri') {
            const hijriDate = this.getHijriDate(now);
            document.getElementById('hijriDate').textContent = hijriDate;
            document.getElementById('gregorianDate').style.opacity = '0.7';
            document.getElementById('hijriDate').style.opacity = '1';
        } else {
            const gregorianDate = this.getGregorianDate(now);
            document.getElementById('gregorianDate').textContent = gregorianDate;
            document.getElementById('gregorianDate').style.opacity = '1';
            document.getElementById('hijriDate').style.opacity = '0.7';
        }
        
        document.getElementById('currentDay').textContent = this.getDayName(now.getDay());
        document.getElementById('ramadanDay').textContent = `16 رمضان`;
    }

    getHijriDate(date) {
        const hijriMonths = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
        const day = 16;
        const month = hijriMonths[8];
        const year = 1447;
        return `${day} ${month} ${year}`;
    }

    getGregorianDate(date) {
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        const dayName = days[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        return `${dayName} ${day} ${month} ${year}`;
    }

    getDayName(dayIndex) {
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        return days[dayIndex];
    }

    setupPrayerCountdown() {
        this.updateCountdown();
        setInterval(() => this.updateCountdown(), 1000);
    }

    updateCountdown() {
        const now = new Date();
        const maghribTime = this.prayerTimes.maghrib;
        const [maghribHours, maghribMinutes] = maghribTime.split(':').map(Number);
        
        const maghribDate = new Date();
        maghribDate.setHours(maghribHours, maghribMinutes, 0, 0);
        
        if (now > maghribDate) {
            maghribDate.setDate(maghribDate.getDate() + 1);
        }
        
        const diff = maghribDate - now;
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const countdownStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('prayerCountdown').textContent = countdownStr;
        
        this.updateCurrentPrayer(now);
    }

    updateCurrentPrayer(now) {
        const prayers = [
            { name: 'fajr', time: this.prayerTimes.fajr },
            { name: 'dhuhr', time: this.prayerTimes.dhuhr },
            { name: 'asr', time: this.prayerTimes.asr },
            { name: 'maghrib', time: this.prayerTimes.maghrib },
            { name: 'isha', time: this.prayerTimes.isha }
        ];
        
        document.querySelectorAll('.prayer-time').forEach(el => {
            el.classList.remove('current-prayer');
        });
        
        for (let i = 0; i < prayers.length; i++) {
            const prayer = prayers[i];
            const [hours, minutes] = prayer.time.split(':').map(Number);
            const prayerTime = new Date();
            prayerTime.setHours(hours, minutes, 0, 0);
            
            let nextPrayerTime;
            if (i < prayers.length - 1) {
                const [nextHours, nextMinutes] = prayers[i + 1].time.split(':').map(Number);
                nextPrayerTime = new Date();
                nextPrayerTime.setHours(nextHours, nextMinutes, 0, 0);
            } else {
                const [firstHours, firstMinutes] = prayers[0].time.split(':').map(Number);
                nextPrayerTime = new Date();
                nextPrayerTime.setHours(firstHours, firstMinutes, 0, 0);
                nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
            }
            
            if (now >= prayerTime && now < nextPrayerTime) {
                const prayerElement = document.querySelector(`.prayer-time:nth-child(${i + 1})`);
                if (prayerElement) {
                    prayerElement.classList.add('current-prayer');
                }
                document.getElementById('nextPrayer').querySelector('span').textContent = 
                    this.getPrayerArabicName(prayer.name);
                break;
            }
        }
    }

    getPrayerArabicName(prayerName) {
        const names = {
            fajr: 'الفجر',
            dhuhr: 'الظهر',
            asr: 'العصر',
            maghrib: 'المغرب',
            isha: 'العشاء'
        };
        return names[prayerName] || prayerName;
    }

    loadDailyContent() {
        const verses = [
            { text: '﴿ وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ﴾', ref: 'سورة الطلاق - الآية 2' },
            { text: '﴿ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾', ref: 'سورة الشرح - الآية 5' },
            { text: '﴿ وَاذْكُرُوا اللَّهَ كَثِيرًا لَّعَلَّكُمْ تُفْلِحُونَ ﴾', ref: 'سورة الجمعة - الآية 10' }
        ];
        
        const hadiths = [
            { text: 'من صام رمضان إيماناً واحتساباً غفر له ما تقدم من ذنبه', ref: 'رواه البخاري ومسلم' },
            { text: 'الصيام جنة، فإذا كان يوم صوم أحدكم فلا يرفث ولا يصخب', ref: 'رواه البخاري ومسلم' },
            { text: 'ثلاث من كن فيه وجد حلاوة الإيمان: أن يكون الله ورسوله أحب إليه مما سواهما', ref: 'رواه البخاري ومسلم' }
        ];
        
        const today = new Date().getDate();
        const verseIndex = today % verses.length;
        const hadithIndex = today % hadiths.length;
        
        document.getElementById('verseOfDay').textContent = verses[verseIndex].text;
        document.getElementById('verseReference').textContent = verses[verseIndex].ref;
        document.getElementById('hadithOfDay').textContent = hadiths[hadithIndex].text;
        document.getElementById('hadithReference').textContent = hadiths[hadithIndex].ref;
    }

    setupNotifications() {
        this.checkForPrayerNotifications();
        setInterval(() => this.checkForPrayerNotifications(), 60000);
    }

    checkForPrayerNotifications() {
        const now = new Date();
        const notifications = [];
        
        const prayerTimes = [
            { name: 'الفجر', time: this.prayerTimes.fajr, offset: 30 },
            { name: 'الظهر', time: this.prayerTimes.dhuhr, offset: 10 },
            { name: 'العصر', time: this.prayerTimes.asr, offset: 10 },
            { name: 'المغرب', time: this.prayerTimes.maghrib, offset: 30 },
            { name: 'العشاء', time: this.prayerTimes.isha, offset: 10 }
        ];
        
        prayerTimes.forEach(prayer => {
            const [hours, minutes] = prayer.time.split(':').map(Number);
            const prayerTime = new Date();
            prayerTime.setHours(hours, minutes, 0, 0);
            
            const notificationTime = new Date(prayerTime.getTime() - prayer.offset * 60000);
            
            if (now >= notificationTime && now < new Date(notificationTime.getTime() + 60000)) {
                notifications.push(`تبقى ${prayer.offset} دقيقة على أذان ${prayer.name}`);
                
                if (prayer.name === 'المغرب') {
                    this.showAdhanNotification();
                }
            }
        });
        
        if (notifications.length > 0) {
            this.showNotification(notifications[0]);
        }
        
        this.updateNotificationCount();
    }

    showNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('ليزي رمضان', {
                body: message,
                icon: 'https://cdn-icons-png.flaticon.com/512/2097/2097081.png'
            });
        }
    }

    showAdhanNotification() {
        setTimeout(() => {
            this.showAdhanVideo();
        }, 1000);
    }

    showAdhanVideo() {
        const modal = document.getElementById('adhanVideoModal');
        const video = document.getElementById('adhanVideo');
        
        video.currentTime = 0;
        video.play().catch(e => console.log('Video play failed:', e));
        
        modal.style.display = 'flex';
        
        video.onended = () => {
            setTimeout(() => {
                this.closeModal(modal);
                this.showDuaVideo();
            }, 1000);
        };
    }

    showDuaVideo() {
        setTimeout(() => {
            alert('شاهد دعاء بعد الأذان');
        }, 500);
    }

    updateNotificationCount() {
        const count = Math.floor(Math.random() * 5) + 1;
        document.getElementById('notificationCount').textContent = count;
    }

    showNotifications() {
        document.getElementById('notificationModal').style.display = 'flex';
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            const video = modal.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        }
    }

    handleActionClick(event) {
        const buttonId = event.currentTarget.id;
        
        const actions = {
            quranBtn: () => window.location.href = 'quran.html',
            tasbihBtn: () => this.showTasbih(),
            azkarBtn: () => window.location.href = 'duas.html',
            compassBtn: () => this.showCompass(),
            radioBtn: () => this.showRadio(),
            imsakiyahBtn: () => window.location.href = 'imsakiyah.html',
            seerahBtn: () => window.location.href = 'seerah.html',
            settingsBtn: () => window.location.href = 'settings.html'
        };
        
        if (actions[buttonId]) {
            actions[buttonId]();
        }
    }

    showTasbih() {
        alert('فتح شاشة المسبحة الإلكترونية');
    }

    showCompass() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.location.href = 'compass.html';
                    } else {
                        alert('يجب السماح بالوصول إلى المستشعرات لاستخدام البوصلة');
                    }
                })
                .catch(console.error);
        } else {
            window.location.href = 'compass.html';
        }
    }

    showRadio() {
        window.location.href = 'radio.html';
    }

    setupModals() {
        const notificationModal = document.getElementById('notificationModal');
        const adhanModal = document.getElementById('adhanVideoModal');
        
        if (notificationModal) {
            notificationModal.style.display = 'none';
        }
        
        if (adhanModal) {
            adhanModal.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new LazyRamadanApp();
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
    
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            position => {
                this.updateLocation(position);
            },
            error => {
                console.log('Geolocation error:', error);
            }
        );
    }
});

function updateLocation(position) {
    const locationText = document.getElementById('locationText');
    if (locationText) {
        locationText.textContent = 'حسب موقعك الحالي';
    }
}

window.addEventListener('online', () => {
    console.log('Application is online');
});

window.addEventListener('offline', () => {
    alert('أنت غير متصل بالإنترنت. بعض الميزات قد لا تعمل.');
});