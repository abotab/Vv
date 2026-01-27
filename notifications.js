// Notification System for Lazy Ramadan App

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.scheduledNotifications = [];
        this.permission = 'default';
        this.settings = {
            prayerNotifications: true,
            prayerBeforeTime: 10, // minutes
            iftarNotification: true,
            suhoorNotification: true,
            qiyamNotification: true,
            qiyamTime: '03:00',
            dailyReminders: true,
            vibration: true,
            sound: true,
            ledColor: '#1a5d1a',
            showOnLockScreen: true
        };
        this.init();
    }

    async init() {
        // Load settings
        await this.loadSettings();
        
        // Request notification permission
        await this.requestPermission();
        
        // Load saved notifications
        await this.loadNotifications();
        
        // Schedule all notifications
        await this.scheduleAllNotifications();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start background checks
        this.startBackgroundChecks();
    }

    async loadSettings() {
        const savedSettings = Utils.getLocalStorage('notificationSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };
        }
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            this.permission = 'denied';
            return;
        }
        
        if (Notification.permission === 'granted') {
            this.permission = 'granted';
        } else if (Notification.permission !== 'denied') {
            try {
                const permission = await Notification.requestPermission();
                this.permission = permission;
            } catch (error) {
                console.error('Error requesting notification permission:', error);
                this.permission = 'denied';
            }
        } else {
            this.permission = 'denied';
        }
        
        return this.permission;
    }

    async loadNotifications() {
        this.notifications = Utils.getLocalStorage('notifications', []);
        this.scheduledNotifications = Utils.getLocalStorage('scheduledNotifications', []);
    }

    async scheduleAllNotifications() {
        // Clear existing notifications
        await this.clearAllNotifications();
        
        // Schedule prayer notifications
        if (this.settings.prayerNotifications) {
            await this.schedulePrayerNotifications();
        }
        
        // Schedule Iftar notification
        if (this.settings.iftarNotification) {
            await this.scheduleIftarNotification();
        }
        
        // Schedule Suhoor notification
        if (this.settings.suhoorNotification) {
            await this.scheduleSuhoorNotification();
        }
        
        // Schedule Qiyam notification
        if (this.settings.qiyamNotification) {
            await this.scheduleQiyamNotification();
        }
        
        // Schedule daily reminders
        if (this.settings.dailyReminders) {
            await this.scheduleDailyReminders();
        }
    }

    async schedulePrayerNotifications() {
        try {
            const prayerTimes = await this.getPrayerTimes();
            
            if (!prayerTimes || prayerTimes.length === 0) {
                console.warn('No prayer times available for scheduling');
                return;
            }
            
            const today = new Date();
            
            prayerTimes.forEach(prayer => {
                if (prayer.type === 'sunrise') return; // Skip sunrise
                
                // Schedule notification for prayer time
                this.schedulePrayerNotification(prayer, today);
                
                // Schedule before-prayer notification if enabled
                if (this.settings.prayerBeforeTime > 0) {
                    this.scheduleBeforePrayerNotification(prayer, today);
                }
            });
            
            console.log('Prayer notifications scheduled successfully');
        } catch (error) {
            console.error('Error scheduling prayer notifications:', error);
        }
    }

    async getPrayerTimes() {
        try {
            // Try to get from prayerTimesManager
            if (window.prayerTimesManager) {
                return window.prayerTimesManager.prayerTimes;
            }
            
            // Fallback to API or local calculation
            const response = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Mecca&country=SA&method=4');
            if (response.ok) {
                const data = await response.json();
                const timings = data.data.timings;
                
                return [
                    { name: 'الفجر', time: timings.Fajr, type: 'fajr' },
                    { name: 'الظهر', time: timings.Dhuhr, type: 'dhuhr' },
                    { name: 'العصر', time: timings.Asr, type: 'asr' },
                    { name: 'المغرب', time: timings.Maghrib, type: 'maghrib' },
                    { name: 'العشاء', time: timings.Isha, type: 'isha' }
                ];
            }
        } catch (error) {
            console.error('Error getting prayer times:', error);
        }
        
        // Default fallback times
        return [
            { name: 'الفجر', time: '05:21', type: 'fajr' },
            { name: 'الظهر', time: '12:30', type: 'dhuhr' },
            { name: 'العصر', time: '15:45', type: 'asr' },
            { name: 'المغرب', time: '18:15', type: 'maghrib' },
            { name: 'العشاء', time: '19:45', type: 'isha' }
        ];
    }

    schedulePrayerNotification(prayer, date) {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const notificationTime = new Date(date);
        notificationTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (notificationTime < new Date()) {
            notificationTime.setDate(notificationTime.getDate() + 1);
        }
        
        const notification = {
            id: `prayer-${prayer.type}-${notificationTime.getTime()}`,
            title: `حان وقت صلاة ${prayer.name}`,
            body: 'الله أكبر، الله أكبر، أشهد أن لا إله إلا الله',
            time: notificationTime.getTime(),
            type: 'prayer',
            data: {
                prayer: prayer.type,
                time: prayer.time,
                action: 'openPrayerTimes'
            },
            icon: '/icons/prayer-icon.png',
            badge: '/icons/badge.png',
            vibrate: this.settings.vibration ? [200, 100, 200] : undefined,
            tag: 'prayer-time'
        };
        
        this.scheduleNotification(notification);
    }

    scheduleBeforePrayerNotification(prayer, date) {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const beforeTime = new Date(date);
        beforeTime.setHours(hours, minutes - this.settings.prayerBeforeTime, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (beforeTime < new Date()) {
            beforeTime.setDate(beforeTime.getDate() + 1);
        }
        
        const notification = {
            id: `before-prayer-${prayer.type}-${beforeTime.getTime()}`,
            title: `اقترب وقت صلاة ${prayer.name}`,
            body: `باقي ${this.settings.prayerBeforeTime} دقيقة لصلاة ${prayer.name}`,
            time: beforeTime.getTime(),
            type: 'before-prayer',
            data: {
                prayer: prayer.type,
                minutes: this.settings.prayerBeforeTime,
                action: 'openPrayerTimes'
            },
            icon: '/icons/reminder-icon.png',
            badge: '/icons/badge.png',
            vibrate: this.settings.vibration ? [100, 50, 100] : undefined,
            tag: 'before-prayer'
        };
        
        this.scheduleNotification(notification);
    }

    async scheduleIftarNotification() {
        try {
            const iftarTime = await this.getIftarTime();
            const [hours, minutes] = iftarTime.split(':').map(Number);
            
            const today = new Date();
            const notificationTime = new Date(today);
            notificationTime.setHours(hours, minutes, 0, 0);
            
            // If time has passed today, schedule for tomorrow
            if (notificationTime < new Date()) {
                notificationTime.setDate(notificationTime.getDate() + 1);
            }
            
            const notification = {
                id: `iftar-${notificationTime.getTime()}`,
                title: 'حان وقت الإفطار',
                body: 'تقبل الله منا ومنكم صالح الأعمال، كل عام وأنتم بخير',
                time: notificationTime.getTime(),
                type: 'iftar',
                data: {
                    action: 'openImsakiya'
                },
                icon: '/icons/iftar-icon.png',
                badge: '/icons/badge.png',
                vibrate: this.settings.vibration ? [300, 100, 300] : undefined,
                tag: 'iftar'
            };
            
            this.scheduleNotification(notification);
        } catch (error) {
            console.error('Error scheduling iftar notification:', error);
        }
    }

    async getIftarTime() {
        try {
            if (window.prayerTimesManager) {
                const maghrib = window.prayerTimesManager.prayerTimes.find(p => p.type === 'maghrib');
                if (maghrib) return maghrib.time;
            }
            
            // Default Iftar time (Maghrib)
            return '18:15';
        } catch (error) {
            console.error('Error getting iftar time:', error);
            return '18:15';
        }
    }

    async scheduleSuhoorNotification() {
        try {
            const suhoorTime = await this.getSuhoorTime();
            const [hours, minutes] = suhoorTime.split(':').map(Number);
            
            const today = new Date();
            const notificationTime = new Date(today);
            notificationTime.setHours(hours, minutes, 0, 0);
            
            // If time has passed today, schedule for tomorrow
            if (notificationTime < new Date()) {
                notificationTime.setDate(notificationTime.getDate() + 1);
            }
            
            const notification = {
                id: `suhoor-${notificationTime.getTime()}`,
                title: 'وقت السحور',
                body: 'تسحروا فإن في السحور بركة',
                time: notificationTime.getTime(),
                type: 'suhoor',
                data: {
                    action: 'openImsakiya'
                },
                icon: '/icons/suhoor-icon.png',
                badge: '/icons/badge.png',
                vibrate: this.settings.vibration ? [200, 100, 200] : undefined,
                tag: 'suhoor'
            };
            
            this.scheduleNotification(notification);
        } catch (error) {
            console.error('Error scheduling suhoor notification:', error);
        }
    }

    async getSuhoorTime() {
        try {
            // Suhoor is usually 30 minutes before Fajr
            if (window.prayerTimesManager) {
                const fajr = window.prayerTimesManager.prayerTimes.find(p => p.type === 'fajr');
                if (fajr) {
                    const [hours, minutes] = fajr.time.split(':').map(Number);
                    const suhoorDate = new Date();
                    suhoorDate.setHours(hours, minutes - 30, 0, 0);
                    return `${suhoorDate.getHours().toString().padStart(2, '0')}:${suhoorDate.getMinutes().toString().padStart(2, '0')}`;
                }
            }
            
            // Default Suhoor time (30 minutes before Fajr)
            return '04:51';
        } catch (error) {
            console.error('Error getting suhoor time:', error);
            return '04:51';
        }
    }

    async scheduleQiyamNotification() {
        const [hours, minutes] = this.settings.qiyamTime.split(':').map(Number);
        
        const today = new Date();
        const notificationTime = new Date(today);
        notificationTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (notificationTime < new Date()) {
            notificationTime.setDate(notificationTime.getDate() + 1);
        }
        
        const notification = {
            id: `qiyam-${notificationTime.getTime()}`,
            title: 'وقت قيام الليل',
            body: 'من قام الليل إيماناً واحتساباً غفر له ما تقدم من ذنبه',
            time: notificationTime.getTime(),
            type: 'qiyam',
            data: {
                action: 'openQiyam'
            },
            icon: '/icons/qiyam-icon.png',
            badge: '/icons/badge.png',
            vibrate: this.settings.vibration ? [100, 50, 100, 50, 100] : undefined,
            tag: 'qiyam'
        };
        
        this.scheduleNotification(notification);
    }

    async scheduleDailyReminders() {
        // Schedule daily reminders at specific times
        const reminders = [
            {
                time: '08:00',
                title: 'تذكير صباحي',
                body: 'اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور',
                type: 'morning'
            },
            {
                time: '12:00',
                title: 'تذكير ظهري',
                body: 'ألا بذكر الله تطمئن القلوب',
                type: 'noon'
            },
            {
                time: '18:00',
                title: 'تذكير مسائي',
                body: 'اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير',
                type: 'evening'
            },
            {
                time: '21:00',
                title: 'تذكير ليلي',
                body: 'إذا أمسيت فلا تنتظر الصباح، وإذا أصبحت فلا تنتظر المساء',
                type: 'night'
            }
        ];
        
        const today = new Date();
        
        reminders.forEach(reminder => {
            const [hours, minutes] = reminder.time.split(':').map(Number);
            const notificationTime = new Date(today);
            notificationTime.setHours(hours, minutes, 0, 0);
            
            // If time has passed today, schedule for tomorrow
            if (notificationTime < new Date()) {
                notificationTime.setDate(notificationTime.getDate() + 1);
            }
            
            const notification = {
                id: `reminder-${reminder.type}-${notificationTime.getTime()}`,
                title: reminder.title,
                body: reminder.body,
                time: notificationTime.getTime(),
                type: 'reminder',
                data: {
                    reminderType: reminder.type,
                    action: 'openReminders'
                },
                icon: '/icons/reminder-icon.png',
                badge: '/icons/badge.png',
                vibrate: this.settings.vibration ? [100] : undefined,
                tag: 'daily-reminder'
            };
            
            this.scheduleNotification(notification);
        });
    }

    scheduleNotification(notification) {
        const now = Date.now();
        const timeUntilNotification = notification.time - now;
        
        // Only schedule if in the future
        if (timeUntilNotification > 0) {
            // Schedule using setTimeout (for demo purposes)
            // In production, use Service Worker and Notification API
            const timeoutId = setTimeout(() => {
                this.showNotification(notification);
                this.removeScheduledNotification(notification.id);
            }, timeUntilNotification);
            
            // Store the timeout ID
            notification.timeoutId = timeoutId;
            this.scheduledNotifications.push(notification);
            
            // Save to localStorage
            this.saveScheduledNotifications();
            
            console.log(`Scheduled notification: ${notification.title} at ${new Date(notification.time).toLocaleTimeString()}`);
        }
    }

    async showNotification(notification) {
        // Check permission
        if (this.permission !== 'granted') {
            console.log('Notification permission not granted');
            return;
        }
        
        // Create notification options
        const options = {
            body: notification.body,
            icon: notification.icon || '/icons/icon-192.png',
            badge: notification.badge || '/icons/badge.png',
            tag: notification.tag,
            data: notification.data,
            requireInteraction: false,
            silent: !this.settings.sound,
            vibrate: notification.vibrate
        };
        
        // Add actions if supported
        if ('actions' in Notification.prototype) {
            options.actions = [
                {
                    action: 'open',
                    title: 'فتح التطبيق',
                    icon: '/icons/open-icon.png'
                },
                {
                    action: 'snooze',
                    title: 'تأجيل 5 دقائق',
                    icon: '/icons/snooze-icon.png'
                }
            ];
        }
        
        // Show notification
        const notif = new Notification(notification.title, options);
        
        // Add click handler
        notif.onclick = (event) => {
            event.preventDefault();
            this.handleNotificationClick(notification.data);
            notif.close();
        };
        
        // Add action handlers
        notif.onactionclick = (event) => {
            switch (event.action) {
                case 'open':
                    this.handleNotificationClick(notification.data);
                    break;
                case 'snooze':
                    this.snoozeNotification(notification, 5); // 5 minutes
                    break;
            }
            notif.close();
        };
        
        // Store notification
        this.notifications.push({
            ...notification,
            shownAt: Date.now(),
            read: false
        });
        
        // Save notifications
        this.saveNotifications();
        
        // Play sound if enabled
        if (this.settings.sound) {
            this.playNotificationSound();
        }
        
        // Show in-app notification
        this.showInAppNotification(notification);
    }

    handleNotificationClick(data) {
        // Focus the app window
        window.focus();
        
        // Handle the action based on notification data
        if (data && data.action) {
            switch (data.action) {
                case 'openPrayerTimes':
                    window.app?.navigateTo('prayer-times');
                    break;
                case 'openImsakiya':
                    window.app?.navigateTo('imsakiya');
                    break;
                case 'openQiyam':
                    window.app?.navigateTo('qiyam');
                    break;
                case 'openReminders':
                    window.app?.navigateTo('reminders');
                    break;
                default:
                    window.app?.navigateTo('home');
            }
        } else {
            window.app?.navigateTo('home');
        }
    }

    snoozeNotification(notification, minutes) {
        // Create new notification with snooze time
        const snoozedNotification = {
            ...notification,
            id: `${notification.id}-snooze-${Date.now()}`,
            time: Date.now() + (minutes * 60 * 1000),
            title: `(مؤجل) ${notification.title}`,
            snoozed: true
        };
        
        // Schedule the snoozed notification
        this.scheduleNotification(snoozedNotification);
        
        // Show confirmation
        Utils.showToast(`تم تأجيل الإشعار لمدة ${minutes} دقائق`, 'success');
    }

    playNotificationSound() {
        // Create notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    showInAppNotification(notification) {
        // Create in-app notification element
        const notificationElement = Utils.createElement('div', {
            className: 'in-app-notification',
            style: {
                position: 'fixed',
                top: '20px',
                right: '20px',
                left: '20px',
                background: 'var(--bg-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                boxShadow: 'var(--shadow-lg)',
                borderLeft: '4px solid var(--primary-color)',
                zIndex: '9999',
                transform: 'translateX(100%)',
                opacity: '0',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }
        });
        
        // Icon
        const icon = Utils.createElement('div', {
            className: 'notification-icon',
            style: {
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.2rem'
            }
        }, '<i class="fas fa-bell"></i>');
        
        // Content
        const content = Utils.createElement('div', {
            className: 'notification-content',
            style: {
                flex: '1'
            }
        });
        
        const title = Utils.createElement('div', {
            className: 'notification-title',
            style: {
                fontWeight: 'bold',
                marginBottom: '0.25rem',
                color: 'var(--text-primary)'
            }
        }, notification.title);
        
        const body = Utils.createElement('div', {
            className: 'notification-body',
            style: {
                fontSize: '0.9rem',
                color: 'var(--text-light)',
                lineHeight: '1.4'
            }
        }, notification.body);
        
        // Close button
        const closeBtn = Utils.createElement('button', {
            className: 'notification-close',
            style: {
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.25rem'
            }
        }, '<i class="fas fa-times"></i>');
        
        content.appendChild(title);
        content.appendChild(body);
        
        notificationElement.appendChild(icon);
        notificationElement.appendChild(content);
        notificationElement.appendChild(closeBtn);
        
        document.body.appendChild(notificationElement);
        
        // Show notification
        setTimeout(() => {
            notificationElement.style.transform = 'translateX(0)';
            notificationElement.style.opacity = '1';
        }, 10);
        
        // Auto-remove after 5 seconds
        const autoRemove = setTimeout(() => {
            notificationElement.style.transform = 'translateX(100%)';
            notificationElement.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notificationElement)) {
                    document.body.removeChild(notificationElement);
                }
            }, 300);
        }, 5000);
        
        // Close button handler
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            notificationElement.style.transform = 'translateX(100%)';
            notificationElement.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notificationElement)) {
                    document.body.removeChild(notificationElement);
                }
            }, 300);
        });
        
        // Click handler
        notificationElement.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-close')) {
                this.handleNotificationClick(notification.data);
                clearTimeout(autoRemove);
                if (document.body.contains(notificationElement)) {
                    document.body.removeChild(notificationElement);
                }
            }
        });
    }

    saveNotifications() {
        // Keep only last 100 notifications
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(-100);
        }
        
        Utils.setLocalStorage('notifications', this.notifications);
    }

    saveScheduledNotifications() {
        // Remove timeoutId before saving
        const notificationsToSave = this.scheduledNotifications.map(({ timeoutId, ...rest }) => rest);
        Utils.setLocalStorage('scheduledNotifications', notificationsToSave);
    }

    removeScheduledNotification(id) {
        const index = this.scheduledNotifications.findIndex(n => n.id === id);
        if (index > -1) {
            clearTimeout(this.scheduledNotifications[index].timeoutId);
            this.scheduledNotifications.splice(index, 1);
            this.saveScheduledNotifications();
        }
    }

    async clearAllNotifications() {
        // Clear all scheduled notifications
        this.scheduledNotifications.forEach(notification => {
            if (notification.timeoutId) {
                clearTimeout(notification.timeoutId);
            }
        });
        
        this.scheduledNotifications = [];
        this.saveScheduledNotifications();
        
        // Close all shown notifications
        if (this.permission === 'granted') {
            // This would close all notifications in a real implementation
            console.log('All notifications cleared');
        }
    }

    startBackgroundChecks() {
        // Check for missed notifications every minute
        setInterval(() => {
            this.checkMissedNotifications();
        }, 60000);
        
        // Reschedule notifications daily at midnight
        this.scheduleDailyReschedule();
    }

    checkMissedNotifications() {
        const now = Date.now();
        const missedNotifications = this.scheduledNotifications.filter(
            notification => notification.time < now - 60000 // Missed by more than 1 minute
        );
        
        if (missedNotifications.length > 0) {
            console.log(`Found ${missedNotifications.length} missed notifications`);
            
            // Show missed notifications immediately
            missedNotifications.forEach(notification => {
                this.showNotification(notification);
                this.removeScheduledNotification(notification.id);
            });
        }
    }

    scheduleDailyReschedule() {
        // Schedule rescheduling for tomorrow at 00:01
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 1, 0, 0);
        
        const timeUntilReschedule = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.scheduleAllNotifications();
            // Reschedule again for next day
            this.scheduleDailyReschedule();
        }, timeUntilReschedule);
    }

    setupEventListeners() {
        // Listen for prayer time updates
        document.addEventListener('prayerTimesUpdated', () => {
            this.reschedulePrayerNotifications();
        });
        
        // Listen for settings changes
        document.addEventListener('notificationSettingsChanged', (event) => {
            this.settings = { ...this.settings, ...event.detail };
            Utils.setLocalStorage('notificationSettings', this.settings);
            this.scheduleAllNotifications();
        });
        
        // Listen for app visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // App became visible, check for missed notifications
                this.checkMissedNotifications();
            }
        });
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            // Reschedule notifications when coming online
            this.scheduleAllNotifications();
        });
    }

    async reschedulePrayerNotifications() {
        // Clear existing prayer notifications
        const prayerNotifications = this.scheduledNotifications.filter(
            n => n.type === 'prayer' || n.type === 'before-prayer'
        );
        
        prayerNotifications.forEach(notification => {
            this.removeScheduledNotification(notification.id);
        });
        
        // Schedule new prayer notifications
        if (this.settings.prayerNotifications) {
            await this.schedulePrayerNotifications();
        }
    }

    // Public API methods
    getUpcomingNotifications() {
        const now = Date.now();
        return this.scheduledNotifications
            .filter(notification => notification.time > now)
            .sort((a, b) => a.time - b.time);
    }

    getNotificationHistory(limit = 50) {
        return this.notifications
            .sort((a, b) => (b.shownAt || 0) - (a.shownAt || 0))
            .slice(0, limit);
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.saveNotifications();
    }

    deleteNotification(notificationId) {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index > -1) {
            this.notifications.splice(index, 1);
            this.saveNotifications();
            return true;
        }
        return false;
    }

    clearHistory() {
        if (confirm('هل أنت متأكد من مسح سجل الإشعارات؟')) {
            this.notifications = [];
            this.saveNotifications();
            Utils.showToast('تم مسح سجل الإشعارات', 'success');
        }
    }

    testNotification(type = 'test') {
        const testNotification = {
            id: `test-${Date.now()}`,
            title: 'إشعار تجريبي',
            body: 'هذا إشعار تجريبي للتحقق من عمل النظام',
            time: Date.now() + 1000, // Show after 1 second
            type: 'test',
            data: {
                action: 'openHome'
            },
            icon: '/icons/icon-192.png',
            badge: '/icons/badge.png',
            vibrate: [200, 100, 200],
            tag: 'test'
        };
        
        this.scheduleNotification(testNotification);
        Utils.showToast('سيظهر إشعار تجريبي خلال ثانية', 'info');
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        Utils.setLocalStorage('notificationSettings', this.settings);
        
        // Reschedule notifications with new settings
        this.scheduleAllNotifications();
        
        return this.settings;
    }

    getSettings() {
        return { ...this.settings };
    }

    isPermissionGranted() {
        return this.permission === 'granted';
    }

    requestPermissionAgain() {
        return this.requestPermission();
    }

    // Static method to get instance
    static async getInstance() {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
            await NotificationManager.instance.init();
        }
        return NotificationManager.instance;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.notificationManager = await NotificationManager.getInstance();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}