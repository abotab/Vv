// Utility Functions for Lazy Ramadan App

class Utils {
    // Date and Time Utilities
    static formatTime(date) {
        return date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static formatDate(date, format = 'full') {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        if (format === 'short') {
            options.month = 'short';
        }
        
        return date.toLocaleDateString('ar-SA', options);
    }

    static getHijriDate() {
        // Simplified Hijri date calculation
        // In production, use a proper library like moment-hijri
        const today = new Date();
        return today.toLocaleDateString('ar-SA-u-ca-islamic', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    }

    static calculateTimeDifference(time1, time2) {
        // Calculate difference between two times in milliseconds
        return Math.abs(time1 - time2);
    }

    static formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours} ساعة ${minutes % 60} دقيقة`;
        } else if (minutes > 0) {
            return `${minutes} دقيقة ${seconds % 60} ثانية`;
        } else {
            return `${seconds} ثانية`;
        }
    }

    // String Utilities
    static truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    static sanitizeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static arabicNumber(number) {
        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return number.toString().replace(/\d/g, digit => arabicNumbers[digit]);
    }

    // Storage Utilities
    static setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    static getLocalStorage(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    static removeLocalStorage(key) {
        localStorage.removeItem(key);
    }

    static clearLocalStorage() {
        localStorage.clear();
    }

    // DOM Utilities
    static createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'style') {
                Object.assign(element.style, attributes[key]);
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        // Set content
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(child => {
                if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    }

    static removeAllChildren(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    static toggleClass(element, className) {
        element.classList.toggle(className);
    }

    static addClass(element, className) {
        element.classList.add(className);
    }

    static removeClass(element, className) {
        element.classList.remove(className);
    }

    static showElement(element) {
        element.style.display = '';
    }

    static hideElement(element) {
        element.style.display = 'none';
    }

    // Validation Utilities
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidPhone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
        return phoneRegex.test(phone);
    }

    static isArabicText(text) {
        const arabicRegex = /[\u0600-\u06FF]/;
        return arabicRegex.test(text);
    }

    // Math Utilities
    static calculateDistance(lat1, lon1, lat2, lon2) {
        // Calculate distance between two coordinates in kilometers
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    static deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    static calculateQiblaDirection(lat, lon) {
        // Calculate Qibla direction from given coordinates
        const meccaLat = 21.4225;
        const meccaLon = 39.8262;
        
        const phiK = this.deg2rad(meccaLat);
        const lambdaK = this.deg2rad(meccaLon);
        const phi = this.deg2rad(lat);
        const lambda = this.deg2rad(lon);
        
        const numerator = Math.sin(lambdaK - lambda);
        const denominator = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
        
        let qiblaDirection = Math.atan2(numerator, denominator);
        qiblaDirection = this.rad2deg(qiblaDirection);
        
        // Normalize to 0-360
        qiblaDirection = (qiblaDirection + 360) % 360;
        
        return qiblaDirection;
    }

    static rad2deg(rad) {
        return rad * (180 / Math.PI);
    }

    // Prayer Calculation Utilities
    static calculatePrayerTimes(date, latitude, longitude, timezone, method = 'MWL') {
        // Simplified prayer time calculation
        // In production, use a proper prayer time calculation library
        
        const times = {
            fajr: '05:21',
            sunrise: '06:43',
            dhuhr: '12:30',
            asr: '15:45',
            maghrib: '18:15',
            isha: '19:45'
        };
        
        return times;
    }

    static parseTimeString(timeStr) {
        // Parse time string like "05:21" to Date object
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    // File Utilities
    static async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    static async readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Network Utilities
    static async fetchWithTimeout(url, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    static async checkInternetConnection() {
        try {
            const response = await this.fetchWithTimeout(
                'https://www.google.com/favicon.ico',
                { method: 'HEAD' },
                5000
            );
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    static async getIPAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return null;
        }
    }

    // Audio Utilities
    static async playAudio(src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(src);
            audio.onended = resolve;
            audio.onerror = reject;
            audio.play();
        });
    }

    static stopAllAudio() {
        // Stop all audio elements on the page
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    // Notification Utilities
    static showToast(message, type = 'info', duration = 3000) {
        // Create toast element
        const toast = this.createElement('div', {
            className: `toast toast-${type}`,
            style: {
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                right: '20px',
                backgroundColor: type === 'success' ? '#28a745' : 
                              type === 'error' ? '#dc3545' : 
                              type === 'warning' ? '#ffc107' : '#17a2b8',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: '9999',
                transform: 'translateY(100px)',
                opacity: '0',
                transition: 'all 0.3s ease'
            }
        }, message);
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }

    // Animation Utilities
    static animate(element, keyframes, options = {}) {
        return element.animate(keyframes, {
            duration: 300,
            easing: 'ease-in-out',
            fill: 'both',
            ...options
        });
    }

    static fadeIn(element, duration = 300) {
        return this.animate(element, [
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
    }

    static fadeOut(element, duration = 300) {
        return this.animate(element, [
            { opacity: 1 },
            { opacity: 0 }
        ], { duration });
    }

    static slideIn(element, duration = 300) {
        return this.animate(element, [
            { transform: 'translateY(20px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 }
        ], { duration });
    }

    // Ramadan Specific Utilities
    static getRamadanDay() {
        const ramadanStart = new Date(2026, 2, 1); // March 1, 2026
        const today = new Date();
        const diffTime = Math.abs(today - ramadanStart);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    static isRamadan() {
        const today = new Date();
        const ramadanStart = new Date(2026, 2, 1);
        const ramadanEnd = new Date(2026, 2, 30);
        return today >= ramadanStart && today <= ramadanEnd;
    }

    static getTimeUntilIftar() {
        const now = new Date();
        const iftarTime = new Date();
        iftarTime.setHours(18, 15, 0, 0); // 6:15 PM
        
        if (now > iftarTime) {
            iftarTime.setDate(iftarTime.getDate() + 1);
        }
        
        return iftarTime - now;
    }

    static getTimeUntilSuhoor() {
        const now = new Date();
        const suhoorTime = new Date();
        suhoorTime.setHours(4, 21, 0, 0); // 4:21 AM
        
        if (now > suhoorTime) {
            suhoorTime.setDate(suhoorTime.getDate() + 1);
        }
        
        return suhoorTime - now;
    }

    static formatRamadanTime(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Performance Utilities
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Device Detection
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    static isAndroid() {
        return /Android/.test(navigator.userAgent);
    }

    static isDesktop() {
        return !this.isMobile();
    }

    static getDeviceType() {
        if (this.isMobile()) {
            return this.isIOS() ? 'ios' : 'android';
        }
        return 'desktop';
    }

    // Browser Detection
    static isChrome() {
        return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    }

    static isFirefox() {
        return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    }

    static isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    // PWA Utilities
    static isPWAInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true;
    }

    static async installPWA() {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            const { outcome } = await window.deferredPrompt.userChoice;
            window.deferredPrompt = null;
            return outcome === 'accepted';
        }
        return false;
    }

    // Accessibility Utilities
    static setFocus(element) {
        if (element && typeof element.focus === 'function') {
            element.focus();
        }
    }

    static trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];
        
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    // Error Handling
    static handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        // Show user-friendly error message
        const message = error.message || 'حدث خطأ غير متوقع';
        this.showToast(message, 'error');
        
        // Log to analytics if available
        if (window.analytics) {
            window.analytics.track('Error', {
                context,
                message: error.message,
                stack: error.stack
            });
        }
        
        return {
            success: false,
            error: message,
            originalError: error
        };
    }

    // Data Export/Import
    static exportData(data, filename = 'data.json') {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    static importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('ملف غير صالح'));
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // Cache Management
    static async clearCache() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }
        
        this.clearLocalStorage();
        this.showToast('تم مسح ذاكرة التخزين المؤقت', 'success');
    }

    // Image Utilities
    static async compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(
                        (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
                        'image/jpeg',
                        quality
                    );
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }

    // Localization
    static getDirection() {
        return document.documentElement.dir || 'rtl';
    }

    static setDirection(dir) {
        document.documentElement.dir = dir;
        document.documentElement.lang = dir === 'rtl' ? 'ar' : 'en';
    }

    // Debug Utilities
    static logPerformance(label, startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`${label}: ${duration.toFixed(2)}ms`);
        return duration;
    }

    static measurePerformance(func) {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        return {
            result,
            duration: end - start
        };
    }
}

// Export as global utility
window.Utils = Utils;