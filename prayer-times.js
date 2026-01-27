// Prayer Times Management System

class PrayerTimesManager {
    constructor() {
        this.prayerTimes = [];
        this.nextPrayer = null;
        this.countdownInterval = null;
        this.userSettings = {
            location: null,
            calculationMethod: 'MWL', // Muslim World League
            asrMethod: 'Standard', // Shafi'i
            highLatitudeMethod: 'AngleBased',
            timeFormat: '24h',
            adjustments: {
                fajr: 0,
                sunrise: 0,
                dhuhr: 0,
                asr: 0,
                maghrib: 0,
                isha: 0
            }
        };
        this.init();
    }

    async init() {
        // Load user settings
        await this.loadSettings();
        
        // Initialize prayer times
        await this.updatePrayerTimes();
        
        // Start countdown
        this.startCountdown();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    async loadSettings() {
        const savedSettings = Utils.getLocalStorage('prayerSettings');
        if (savedSettings) {
            this.userSettings = { ...this.userSettings, ...savedSettings };
        }
        
        // Get user location if not set
        if (!this.userSettings.location) {
            await this.getUserLocation();
        }
    }

    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userSettings.location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        city: 'موقعك الحالي',
                        country: ''
                    };
                    Utils.setLocalStorage('prayerSettings', this.userSettings);
                    resolve(this.userSettings.location);
                },
                (error) => {
                    console.warn('Location access denied:', error);
                    // Use default location (Mecca)
                    this.userSettings.location = {
                        latitude: 21.4225,
                        longitude: 39.8262,
                        city: 'مكة المكرمة',
                        country: 'السعودية'
                    };
                    resolve(this.userSettings.location);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    async updatePrayerTimes(date = new Date()) {
        try {
            // Calculate prayer times
            this.prayerTimes = await this.calculatePrayerTimes(date);
            
            // Find next prayer
            this.findNextPrayer();
            
            // Update UI
            this.updateUI();
            
            // Save to cache
            this.cachePrayerTimes();
            
            return this.prayerTimes;
        } catch (error) {
            console.error('Error updating prayer times:', error);
            Utils.showToast('تعذر تحديث مواقيت الصلاة', 'error');
            return null;
        }
    }

    async calculatePrayerTimes(date) {
        const { latitude, longitude } = this.userSettings.location;
        const { calculationMethod, adjustments } = this.userSettings;
        
        try {
            // Try to get times from Aladhan.com API
            const times = await this.fetchFromAladhanAPI(date, latitude, longitude, calculationMethod);
            
            // Apply user adjustments
            const adjustedTimes = this.applyAdjustments(times);
            
            return adjustedTimes;
        } catch (error) {
            console.error('API Error, using calculation:', error);
            // Fallback to local calculation
            return this.calculateLocal(date, latitude, longitude);
        }
    }

    async fetchFromAladhanAPI(date, lat, lng, method) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // Using Aladhan.com API
        const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lng}&method=${method}&school=0`;
        
        const response = await Utils.fetchWithTimeout(url, {}, 5000);
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        
        if (data.code !== 200) {
            throw new Error('API returned error');
        }
        
        const timings = data.data.timings;
        
        return [
            {
                name: 'الفجر',
                time: timings.Fajr,
                icon: 'fas fa-moon',
                type: 'fajr',
                isCurrent: false
            },
            {
                name: 'الشروق',
                time: timings.Sunrise,
                icon: 'fas fa-sun',
                type: 'sunrise',
                isCurrent: false
            },
            {
                name: 'الظهر',
                time: timings.Dhuhr,
                icon: 'fas fa-sun',
                type: 'dhuhr',
                isCurrent: false
            },
            {
                name: 'العصر',
                time: timings.Asr,
                icon: 'fas fa-sun',
                type: 'asr',
                isCurrent: false
            },
            {
                name: 'المغرب',
                time: timings.Maghrib,
                icon: 'fas fa-sun',
                type: 'maghrib',
                isCurrent: false
            },
            {
                name: 'العشاء',
                time: timings.Isha,
                icon: 'fas fa-moon',
                type: 'isha',
                isCurrent: false
            }
        ];
    }

    calculateLocal(date, lat, lng) {
        // Simplified local calculation for fallback
        // In production, use a proper prayer time calculation library
        
        const times = [
            { name: 'الفجر', time: '05:21', icon: 'fas fa-moon', type: 'fajr', isCurrent: false },
            { name: 'الشروق', time: '06:43', icon: 'fas fa-sun', type: 'sunrise', isCurrent: false },
            { name: 'الظهر', time: '12:30', icon: 'fas fa-sun', type: 'dhuhr', isCurrent: false },
            { name: 'العصر', time: '15:45', icon: 'fas fa-sun', type: 'asr', isCurrent: false },
            { name: 'المغرب', time: '18:15', icon: 'fas fa-sun', type: 'maghrib', isCurrent: false },
            { name: 'العشاء', time: '19:45', icon: 'fas fa-moon', type: 'isha', isCurrent: false }
        ];
        
        return times;
    }

    applyAdjustments(times) {
        const { adjustments } = this.userSettings;
        
        return times.map(prayer => {
            const adjustment = adjustments[prayer.type] || 0;
            if (adjustment !== 0) {
                const adjustedTime = this.adjustTime(prayer.time, adjustment);
                return { ...prayer, time: adjustedTime, originalTime: prayer.time };
            }
            return prayer;
        });
    }

    adjustTime(timeStr, minutes) {
        const [hours, mins] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, mins + minutes, 0, 0);
        
        const adjustedHours = date.getHours().toString().padStart(2, '0');
        const adjustedMinutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${adjustedHours}:${adjustedMinutes}`;
    }

    findNextPrayer() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        let nextPrayer = null;
        let nextPrayerTime = Infinity;
        
        this.prayerTimes.forEach(prayer => {
            const [hours, minutes] = prayer.time.split(':').map(Number);
            const prayerTime = hours * 60 + minutes;
            
            // Skip sunrise for prayer countdown
            if (prayer.type === 'sunrise') return;
            
            if (prayerTime > currentTime && prayerTime < nextPrayerTime) {
                nextPrayer = prayer;
                nextPrayerTime = prayerTime;
            }
        });
        
        // If no prayer found for today, use first prayer tomorrow
        if (!nextPrayer) {
            nextPrayer = this.prayerTimes.find(p => p.type === 'fajr');
            nextPrayerTime = this.parseTime(nextPrayer.time) + (24 * 60); // Add 24 hours
        }
        
        // Reset current prayer flags
        this.prayerTimes.forEach(p => p.isCurrent = false);
        
        // Find current prayer (if any)
        const currentPrayer = this.findCurrentPrayer();
        if (currentPrayer) {
            currentPrayer.isCurrent = true;
        }
        
        this.nextPrayer = {
            ...nextPrayer,
            timeInMinutes: nextPrayerTime
        };
        
        return this.nextPrayer;
    }

    findCurrentPrayer() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        // Sort prayers by time
        const sortedPrayers = [...this.prayerTimes].sort((a, b) => {
            return this.parseTime(a.time) - this.parseTime(b.time);
        });
        
        for (let i = 0; i < sortedPrayers.length; i++) {
            const currentPrayerTime = this.parseTime(sortedPrayers[i].time);
            const nextPrayerTime = i < sortedPrayers.length - 1 
                ? this.parseTime(sortedPrayers[i + 1].time) 
                : 24 * 60; // End of day
            
            if (currentTime >= currentPrayerTime && currentTime < nextPrayerTime) {
                // Skip sunrise as current prayer
                if (sortedPrayers[i].type === 'sunrise') {
                    continue;
                }
                return sortedPrayers[i];
            }
        }
        
        return null;
    }

    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    startCountdown() {
        // Clear existing interval
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        // Update countdown immediately
        this.updateCountdown();
        
        // Update every second
        this.countdownInterval = setInterval(() => {
            this.updateCountdown();
        }, 1000);
    }

    updateCountdown() {
        if (!this.nextPrayer) return;
        
        const now = new Date();
        const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        
        const nextPrayerSeconds = this.nextPrayer.timeInMinutes * 60;
        let timeDiff = nextPrayerSeconds - currentTime;
        
        // If timeDiff is negative, prayer has passed for today
        if (timeDiff < 0) {
            timeDiff += 24 * 3600; // Add 24 hours
        }
        
        // Format countdown
        const hours = Math.floor(timeDiff / 3600);
        const minutes = Math.floor((timeDiff % 3600) / 60);
        const seconds = timeDiff % 60;
        
        // Update UI
        this.updateCountdownUI(hours, minutes, seconds);
        
        // Check if prayer time has arrived
        if (timeDiff === 0) {
            this.onPrayerTime();
        }
        
        // Update next prayer every minute
        if (seconds === 0) {
            this.findNextPrayer();
        }
    }

    updateCountdownUI(hours, minutes, seconds) {
        const countdownElement = document.getElementById('prayerCountdown');
        if (countdownElement) {
            countdownElement.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        const nextPrayerElement = document.querySelector('.next-prayer .prayer-name');
        if (nextPrayerElement && this.nextPrayer) {
            nextPrayerElement.textContent = this.nextPrayer.name;
        }
    }

    onPrayerTime() {
        // Play adhan
        this.playAdhan();
        
        // Show notification
        this.showPrayerNotification();
        
        // Vibrate if supported
        this.vibrateDevice();
        
        // Update prayer times for next day if needed
        const now = new Date();
        if (now.getHours() >= 21) { // After Isha
            this.scheduleTomorrowUpdate();
        }
    }

    async playAdhan() {
        try {
            // Get adhan settings
            const adhanSettings = Utils.getLocalStorage('adhanSettings', {
                enabled: true,
                volume: 0.7,
                fajrAdhan: null,
                otherAdhan: null
            });
            
            if (!adhanSettings.enabled) return;
            
            // Determine which adhan to play
            const isFajr = this.nextPrayer.type === 'fajr';
            const adhanUrl = isFajr 
                ? (adhanSettings.fajrAdhan || 'default-fajr.mp3')
                : (adhanSettings.otherAdhan || 'default-adhan.mp3');
            
            // Create audio element
            const audio = new Audio(adhanUrl);
            audio.volume = adhanSettings.volume;
            
            // Play adhan
            await audio.play();
            
            // Show controls
            this.showAdhanControls(audio);
            
        } catch (error) {
            console.error('Error playing adhan:', error);
            Utils.showToast('تعذر تشغيل الأذان', 'warning');
        }
    }

    showAdhanControls(audio) {
        // Create adhan control overlay
        const overlay = Utils.createElement('div', {
            className: 'adhan-overlay',
            style: {
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'rgba(0, 0, 0, 0.8)',
                zIndex: '10000',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }
        });
        
        const title = Utils.createElement('h2', {
            style: {
                marginBottom: '2rem',
                fontSize: '1.5rem'
            }
        }, `أذان ${this.nextPrayer.name}`);
        
        const controls = Utils.createElement('div', {
            className: 'adhan-controls',
            style: {
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem'
            }
        });
        
        const stopBtn = Utils.createElement('button', {
            className: 'btn',
            style: {
                padding: '0.75rem 2rem',
                background: 'var(--danger-color)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                cursor: 'pointer'
            }
        }, 'إيقاف الأذان');
        
        stopBtn.addEventListener('click', () => {
            audio.pause();
            audio.currentTime = 0;
            document.body.removeChild(overlay);
        });
        
        controls.appendChild(stopBtn);
        
        overlay.appendChild(title);
        overlay.appendChild(controls);
        
        // Auto-remove after adhan ends
        audio.addEventListener('ended', () => {
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
            }, 3000);
        });
        
        document.body.appendChild(overlay);
    }

    showPrayerNotification() {
        const notification = {
            title: `حان وقت صلاة ${this.nextPrayer.name}`,
            body: 'الله أكبر، الله أكبر',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png'
        };
        
        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, notification);
        }
        
        // Show in-app notification
        Utils.showToast(notification.body, 'info');
    }

    vibrateDevice() {
        // Vibrate pattern: 3 short vibrations
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 100]);
        }
    }

    scheduleTomorrowUpdate() {
        // Schedule prayer times update for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilTomorrow = tomorrow.getTime() - Date.now();
        
        setTimeout(() => {
            this.updatePrayerTimes(tomorrow);
        }, timeUntilTomorrow);
    }

    updateUI() {
        // Update prayer times grid
        this.updatePrayerTimesGrid();
        
        // Update next prayer display
        this.updateNextPrayerDisplay();
    }

    updatePrayerTimesGrid() {
        const container = document.getElementById('prayerTimes');
        if (!container) return;
        
        Utils.removeAllChildren(container);
        
        this.prayerTimes.forEach(prayer => {
            const prayerElement = Utils.createElement('div', {
                className: `prayer-time-item ${prayer.isCurrent ? 'active' : ''}`,
                'data-prayer': prayer.type
            });
            
            prayerElement.innerHTML = `
                <span class="prayer-name">${prayer.name}</span>
                <span class="prayer-time">${prayer.time}</span>
            `;
            
            container.appendChild(prayerElement);
        });
    }

    updateNextPrayerDisplay() {
        const nextPrayerElement = document.querySelector('.next-prayer');
        if (!nextPrayerElement || !this.nextPrayer) return;
        
        const infoElement = nextPrayerElement.querySelector('.next-prayer-info');
        if (infoElement) {
            const nameElement = infoElement.querySelector('.prayer-name');
            if (nameElement) {
                nameElement.textContent = this.nextPrayer.name;
            }
        }
    }

    cachePrayerTimes() {
        const cacheData = {
            times: this.prayerTimes,
            nextPrayer: this.nextPrayer,
            timestamp: Date.now(),
            location: this.userSettings.location
        };
        
        Utils.setLocalStorage('cachedPrayerTimes', cacheData);
    }

    loadCachedPrayerTimes() {
        const cachedData = Utils.getLocalStorage('cachedPrayerTimes');
        
        if (cachedData && cachedData.timestamp) {
            const cacheAge = Date.now() - cachedData.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (cacheAge < maxAge) {
                this.prayerTimes = cachedData.times || [];
                this.nextPrayer = cachedData.nextPrayer || null;
                
                // Update UI with cached data
                this.updateUI();
                this.startCountdown();
                
                return true;
            }
        }
        
        return false;
    }

    setupEventListeners() {
        // Location change
        document.addEventListener('locationChanged', (event) => {
            this.userSettings.location = event.detail;
            this.updatePrayerTimes();
        });
        
        // Settings change
        document.addEventListener('prayerSettingsChanged', (event) => {
            this.userSettings = { ...this.userSettings, ...event.detail };
            this.updatePrayerTimes();
        });
        
        // Manual refresh
        const refreshBtn = document.getElementById('refreshPrayerTimes');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.updatePrayerTimes();
            });
        }
    }

    getPrayerTimesForDate(date) {
        // Get prayer times for specific date
        return this.calculatePrayerTimes(date);
    }

    getUpcomingPrayers(count = 3) {
        // Get next N prayers including current
        const prayers = [];
        let currentIndex = -1;
        
        // Find current prayer index
        for (let i = 0; i < this.prayerTimes.length; i++) {
            if (this.prayerTimes[i].isCurrent) {
                currentIndex = i;
                break;
            }
        }
        
        // If no current prayer, start from next prayer
        if (currentIndex === -1) {
            const nextIndex = this.prayerTimes.findIndex(p => 
                p.type === this.nextPrayer.type
            );
            currentIndex = nextIndex !== -1 ? nextIndex - 1 : 0;
        }
        
        // Get upcoming prayers
        for (let i = 1; i <= count; i++) {
            const index = (currentIndex + i) % this.prayerTimes.length;
            prayers.push(this.prayerTimes[index]);
        }
        
        return prayers;
    }

    getTimeUntilPrayer(prayerType) {
        const prayer = this.prayerTimes.find(p => p.type === prayerType);
        if (!prayer) return null;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const prayerTime = this.parseTime(prayer.time);
        
        let timeDiff = prayerTime - currentTime;
        if (timeDiff < 0) {
            timeDiff += 24 * 60; // Add 24 hours
        }
        
        return timeDiff;
    }

    formatTimeUntilPrayer(minutes) {
        if (minutes < 60) {
            return `${minutes} دقيقة`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours} ساعة ${remainingMinutes} دقيقة`;
        }
    }

    // Public API
    static async getInstance() {
        if (!PrayerTimesManager.instance) {
            PrayerTimesManager.instance = new PrayerTimesManager();
            await PrayerTimesManager.instance.init();
        }
        return PrayerTimesManager.instance;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.prayerTimesManager = await PrayerTimesManager.getInstance();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrayerTimesManager;
}