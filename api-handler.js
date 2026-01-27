// API Handler for Lazy Ramadan App

class APIHandler {
    constructor() {
        this.baseURL = 'https://quran.yousefheiba.com/api';
        this.aladhanBaseURL = 'https://api.aladhan.com/v1';
        this.cache = new Map();
        this.requestsQueue = [];
        this.isProcessingQueue = false;
        this.settings = {
            cacheEnabled: true,
            cacheDuration: 5 * 60 * 1000, // 5 minutes
            retryAttempts: 3,
            timeout: 10000,
            offlineMode: false
        };
        this.init();
    }

    init() {
        // Load settings
        this.loadSettings();
        
        // Setup cache cleanup
        this.setupCacheCleanup();
        
        // Setup online/offline detection
        this.setupConnectivityDetection();
    }

    loadSettings() {
        const savedSettings = Utils.getLocalStorage('apiSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };
        }
    }

    setupCacheCleanup() {
        // Cleanup expired cache every hour
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 60 * 60 * 1000);
    }

    setupConnectivityDetection() {
        window.addEventListener('online', () => {
            this.settings.offlineMode = false;
            this.processQueue();
        });
        
        window.addEventListener('offline', () => {
            this.settings.offlineMode = true;
            Utils.showToast('تم الانتقال إلى الوضع دون اتصال', 'info');
        });
    }

    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            body = null,
            headers = {},
            cacheKey = null,
            useCache = this.settings.cacheEnabled,
            forceRefresh = false,
            retryCount = 0
        } = options;
        
        // Generate cache key if not provided
        const finalCacheKey = cacheKey || this.generateCacheKey(endpoint, method, body);
        
        // Check cache first
        if (useCache && !forceRefresh) {
            const cachedResponse = this.getFromCache(finalCacheKey);
            if (cachedResponse) {
                return cachedResponse;
            }
        }
        
        // Check if offline
        if (this.settings.offlineMode && !navigator.onLine) {
            throw new Error('لا يوجد اتصال بالإنترنت');
        }
        
        // Prepare request
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
        const requestOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
            },
            signal: AbortSignal.timeout(this.settings.timeout)
        };
        
        if (body && method !== 'GET') {
            requestOptions.body = JSON.stringify(body);
        }
        
        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the response
            if (useCache) {
                this.saveToCache(finalCacheKey, data);
            }
            
            return data;
            
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            
            // Retry logic
            if (retryCount < this.settings.retryAttempts) {
                console.log(`Retrying request (${retryCount + 1}/${this.settings.retryAttempts})...`);
                await this.delay(1000 * (retryCount + 1)); // Exponential backoff
                return this.request(endpoint, { ...options, retryCount: retryCount + 1 });
            }
            
            // Check cache for fallback
            if (useCache) {
                const cachedResponse = this.getFromCache(finalCacheKey);
                if (cachedResponse) {
                    console.log('Using cached response as fallback');
                    return cachedResponse;
                }
            }
            
            throw error;
        }
    }

    generateCacheKey(endpoint, method, body) {
        const keyParts = [endpoint, method];
        if (body) {
            keyParts.push(JSON.stringify(body));
        }
        return keyParts.join('|');
    }

    getFromCache(key) {
        if (!this.settings.cacheEnabled) return null;
        
        const cachedItem = this.cache.get(key);
        if (!cachedItem) return null;
        
        const { data, timestamp } = cachedItem;
        const now = Date.now();
        
        if (now - timestamp > this.settings.cacheDuration) {
            this.cache.delete(key);
            return null;
        }
        
        return data;
    }

    saveToCache(key, data) {
        if (!this.settings.cacheEnabled) return;
        
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        // Also save to localStorage for persistence
        try {
            const cacheData = Utils.getLocalStorage('apiCache', {});
            cacheData[key] = {
                data,
                timestamp: Date.now()
            };
            Utils.setLocalStorage('apiCache', cacheData);
        } catch (error) {
            console.warn('Could not save to localStorage cache:', error);
        }
    }

    cleanupExpiredCache() {
        const now = Date.now();
        
        // Clean memory cache
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.settings.cacheDuration) {
                this.cache.delete(key);
            }
        }
        
        // Clean localStorage cache
        try {
            const cacheData = Utils.getLocalStorage('apiCache', {});
            const newCacheData = {};
            
            for (const [key, value] of Object.entries(cacheData)) {
                if (now - value.timestamp <= this.settings.cacheDuration) {
                    newCacheData[key] = value;
                }
            }
            
            Utils.setLocalStorage('apiCache', newCacheData);
        } catch (error) {
            console.warn('Could not cleanup localStorage cache:', error);
        }
    }

    clearCache() {
        this.cache.clear();
        Utils.removeLocalStorage('apiCache');
        Utils.showToast('تم مسح ذاكرة التخزين المؤقت', 'success');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    queueRequest(endpoint, options = {}) {
        return new Promise((resolve, reject) => {
            this.requestsQueue.push({
                endpoint,
                options,
                resolve,
                reject
            });
            
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessingQueue || this.requestsQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        while (this.requestsQueue.length > 0) {
            const request = this.requestsQueue.shift();
            
            try {
                const result = await this.request(request.endpoint, request.options);
                request.resolve(result);
            } catch (error) {
                request.reject(error);
            }
            
            // Small delay between requests to avoid rate limiting
            await this.delay(100);
        }
        
        this.isProcessingQueue = false;
    }

    // Specific API endpoints

    // Quran APIs
    async getSurahs() {
        return this.request('/surahs', {
            cacheKey: 'surahs',
            useCache: true
        });
    }

    async getSurah(surahId) {
        return this.request(`/surah/${surahId}`, {
            cacheKey: `surah_${surahId}`,
            useCache: true
        });
    }

    async getAzkar() {
        return this.request('/azkar', {
            cacheKey: 'azkar',
            useCache: true
        });
    }

    async getDuas() {
        return this.request('/duas', {
            cacheKey: 'duas',
            useCache: true
        });
    }

    async getReciters() {
        return this.request('/reciters', {
            cacheKey: 'reciters',
            useCache: true
        });
    }

    async getReciterAudio(reciterId, surahId, ayahId = null) {
        let endpoint = `/reciterAudio?reciter_id=${reciterId}&surah=${surahId}`;
        if (ayahId) {
            endpoint += `&ayah=${ayahId}`;
        }
        return this.request(endpoint, {
            cacheKey: `audio_${reciterId}_${surahId}_${ayahId}`,
            useCache: true
        });
    }

    async getRadio() {
        return this.request('/radio', {
            cacheKey: 'radio',
            useCache: false // Don't cache live radio
        });
    }

    async getSeerah() {
        return this.request('/seerah', {
            cacheKey: 'seerah',
            useCache: true
        });
    }

    async getLaylatAlQadr() {
        return this.request('/laylatAlQadr', {
            cacheKey: 'laylat_al_qadr',
            useCache: true
        });
    }

    // Prayer Times APIs (using Aladhan.com)
    async getPrayerTimes(latitude, longitude, date = null) {
        let endpoint = `${this.aladhanBaseURL}/timings`;
        
        if (date) {
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            endpoint += `/${day}-${month}-${year}`;
        }
        
        endpoint += `?latitude=${latitude}&longitude=${longitude}&method=4&school=0`;
        
        return this.request(endpoint, {
            cacheKey: `prayer_times_${latitude}_${longitude}_${date?.toDateString() || 'today'}`,
            useCache: true,
            cacheDuration: 24 * 60 * 60 * 1000 // 24 hours for prayer times
        });
    }

    async getPrayerTimesByCity(city, country, date = null) {
        let endpoint = `${this.aladhanBaseURL}/timingsByCity`;
        
        if (date) {
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            endpoint += `/${day}-${month}-${year}`;
        }
        
        endpoint += `?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=4&school=0`;
        
        return this.request(endpoint, {
            cacheKey: `prayer_times_${city}_${country}_${date?.toDateString() || 'today'}`,
            useCache: true,
            cacheDuration: 24 * 60 * 60 * 1000
        });
    }

    async getPrayerTimesCalendar(latitude, longitude, month, year) {
        const endpoint = `${this.aladhanBaseURL}/calendar?latitude=${latitude}&longitude=${longitude}&month=${month}&year=${year}&method=4&school=0`;
        
        return this.request(endpoint, {
            cacheKey: `prayer_calendar_${latitude}_${longitude}_${month}_${year}`,
            useCache: true,
            cacheDuration: 30 * 24 * 60 * 60 * 1000 // 30 days for calendar
        });
    }

    async getQiblaDirection(latitude, longitude) {
        const endpoint = `${this.aladhanBaseURL}/qibla/${latitude}/${longitude}`;
        
        return this.request(endpoint, {
            cacheKey: `qibla_${latitude}_${longitude}`,
            useCache: true,
            cacheDuration: 365 * 24 * 60 * 60 * 1000 // 1 year (qibla doesn't change)
        });
    }

    async getHijriCalendar(month, year) {
        const endpoint = `${this.aladhanBaseURL}/gToHCalendar/${month}/${year}`;
        
        return this.request(endpoint, {
            cacheKey: `hijri_calendar_${month}_${year}`,
            useCache: true,
            cacheDuration: 365 * 24 * 60 * 60 * 1000
        });
    }

    async getHijriDate(gregorianDate) {
        const day = gregorianDate.getDate();
        const month = gregorianDate.getMonth() + 1;
        const year = gregorianDate.getFullYear();
        
        const endpoint = `${this.aladhanBaseURL}/gToH/${day}-${month}-${year}`;
        
        return this.request(endpoint, {
            cacheKey: `hijri_date_${day}_${month}_${year}`,
            useCache: true,
            cacheDuration: 24 * 60 * 60 * 1000
        });
    }

    // Weather API (example - would need actual weather service)
    async getWeather(latitude, longitude) {
        // This is a placeholder - you would need to integrate with a real weather API
        // Example: OpenWeatherMap, WeatherAPI, etc.
        return {
            temperature: 25,
            condition: 'مشمس',
            humidity: 60,
            windSpeed: 10,
            icon: '☀️'
        };
    }

    // Additional Islamic APIs
    async getIslamicEvents(month, year) {
        // Placeholder for Islamic events API
        return {
            events: [
                {
                    date: '1 Ramadan',
                    title: 'بداية شهر رمضان',
                    description: 'أول أيام شهر رمضان المبارك'
                },
                {
                    date: '27 Ramadan',
                    title: 'ليلة القدر',
                    description: 'ليلة خير من ألف شهر'
                }
            ]
        };
    }

    async getHadithCollections() {
        // Placeholder for Hadith collections API
        return {
            collections: [
                { id: 'bukhari', name: 'صحيح البخاري', count: 7563 },
                { id: 'muslim', name: 'صحيح مسلم', count: 3033 },
                { id: 'tirmidhi', name: 'سنن الترمذي', count: 3956 }
            ]
        };
    }

    async getHadith(collection, number) {
        // Placeholder for individual Hadith API
        return {
            collection,
            number,
            text: 'حديث تجريبي',
            narrator: 'أبو هريرة',
            source: 'صحيح البخاري'
        };
    }

    async getRandomHadith() {
        // Placeholder for random Hadith API
        return {
            text: 'من صام رمضان إيماناً واحتساباً غفر له ما تقدم من ذنبه',
            narrator: 'أبو هريرة',
            source: 'صحيح البخاري'
        };
    }

    async getRandomVerse() {
        try {
            const response = await this.request('/random-verse', {
                cacheKey: 'random_verse',
                useCache: false // Don't cache random verses
            });
            return response;
        } catch (error) {
            // Fallback to a static verse
            return {
                text: 'شَهْرُ رَمَضَانَ ٱلَّذِىٓ أُنزِلَ فِيهِ ٱلْقُرْءَانُ هُدًۭى لِّلنَّاسِ وَبَيِّنَـٰتٍۢ مِّنَ ٱلْهُدَىٰ وَٱلْفُرْقَانِ',
                surah: 'البقرة',
                ayah: 185,
                translation: 'شهر رمضان الذي أنزل فيه القرآن هدى للناس وبينات من الهدى والفرقان'
            };
        }
    }

    // Utility methods
    async testConnection() {
        try {
            const startTime = Date.now();
            await this.request('/surahs', { timeout: 5000, useCache: false });
            const endTime = Date.now();
            
            return {
                connected: true,
                latency: endTime - startTime,
                message: 'الاتصال بالخوادم يعمل بشكل جيد'
            };
        } catch (error) {
            return {
                connected: false,
                latency: null,
                message: 'تعذر الاتصال بالخوادم'
            };
        }
    }

    getCacheStats() {
        const memoryCacheSize = this.cache.size;
        
        let localStorageCacheSize = 0;
        try {
            const cacheData = Utils.getLocalStorage('apiCache', {});
            localStorageCacheSize = Object.keys(cacheData).length;
        } catch (error) {
            console.warn('Could not read localStorage cache:', error);
        }
        
        return {
            memoryCache: {
                size: memoryCacheSize,
                entries: Array.from(this.cache.entries()).map(([key, value]) => ({
                    key: key.substring(0, 50) + '...',
                    age: Date.now() - value.timestamp
                }))
            },
            localStorageCache: {
                size: localStorageCacheSize
            },
            queue: {
                pending: this.requestsQueue.length,
                processing: this.isProcessingQueue
            }
        };
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        Utils.setLocalStorage('apiSettings', this.settings);
        
        // Update cache duration in milliseconds
        if (newSettings.cacheDurationMinutes) {
            this.settings.cacheDuration = newSettings.cacheDurationMinutes * 60 * 1000;
        }
        
        return this.settings;
    }

    getSettings() {
        return { ...this.settings };
    }

    // Batch requests
    async batchRequests(requests) {
        const promises = requests.map(req => 
            this.request(req.endpoint, req.options)
        );
        
        return Promise.allSettled(promises);
    }

    // Prefetch common data
    async prefetchCommonData() {
        const commonEndpoints = [
            { endpoint: '/surahs', cacheKey: 'surahs' },
            { endpoint: '/azkar', cacheKey: 'azkar' },
            { endpoint: '/duas', cacheKey: 'duas' },
            { endpoint: '/reciters', cacheKey: 'reciters' }
        ];
        
        const results = await this.batchRequests(commonEndpoints);
        
        let successCount = 0;
        let failureCount = 0;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successCount++;
            } else {
                failureCount++;
                console.warn(`Failed to prefetch ${commonEndpoints[index].endpoint}:`, result.reason);
            }
        });
        
        return {
            success: successCount,
            failure: failureCount,
            total: commonEndpoints.length
        };
    }

    // Clear specific cache
    clearSpecificCache(pattern) {
        const regex = new RegExp(pattern);
        
        // Clear memory cache
        for (const [key] of this.cache.entries()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
        
        // Clear localStorage cache
        try {
            const cacheData = Utils.getLocalStorage('apiCache', {});
            const newCacheData = {};
            
            for (const [key, value] of Object.entries(cacheData)) {
                if (!regex.test(key)) {
                    newCacheData[key] = value;
                }
            }
            
            Utils.setLocalStorage('apiCache', newCacheData);
        } catch (error) {
            console.warn('Could not clear specific cache from localStorage:', error);
        }
        
        Utils.showToast(`تم مسح ذاكرة التخزين المؤقت للمطابقة: ${pattern}`, 'success');
    }

    // Static method to get instance
    static getInstance() {
        if (!APIHandler.instance) {
            APIHandler.instance = new APIHandler();
        }
        return APIHandler.instance;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.apiHandler = APIHandler.getInstance();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIHandler;
}