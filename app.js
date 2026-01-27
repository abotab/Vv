// Main Application Controller
class LazyRamadanApp {
    constructor() {
        this.currentTheme = 'light';
        this.currentPage = 'home';
        this.isLoading = true;
        this.userLocation = null;
        this.prayerTimes = [];
        this.init();
    }

    async init() {
        try {
            // Initialize all components
            await this.initializeComponents();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadInitialData();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Start background services
            this.startBackgroundServices();
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showNotification('حدث خطأ في تحميل التطبيق', 'error');
        }
    }

    async initializeComponents() {
        // Initialize theme
        this.initializeTheme();
        
        // Initialize date
        this.updateDateDisplay();
        
        // Initialize prayer times
        await this.initializePrayerTimes();
        
        // Initialize Quran
        this.initializeQuran();
        
        // Initialize other components
        this.initializeSidebar();
        this.initializeSearch();
        this.initializeAudioPlayer();
    }

    initializeTheme() {
        // Check saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        }
        
        this.applyTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
    }

    updateDateDisplay() {
        const now = new Date();
        
        // Update Gregorian date
        const gregorianDate = document.getElementById('gregorianDate');
        if (gregorianDate) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            gregorianDate.textContent = now.toLocaleDateString('ar-SA', options);
        }
        
        // Update Hijri date (simplified calculation)
        const hijriDate = document.getElementById('hijriDate');
        if (hijriDate) {
            // This is a simplified calculation - in production, use a proper Hijri calendar library
            const hijriOptions = { weekday: 'long', month: 'long', day: 'numeric' };
            hijriDate.textContent = now.toLocaleDateString('ar-SA-u-ca-islamic', hijriOptions);
        }
        
        // Update day counter
        const dayCounter = document.getElementById('dayCounter');
        if (dayCounter) {
            // Calculate Ramadan day (simplified)
            const ramadanStart = new Date(2026, 2, 1); // March 1, 2026
            const diffTime = Math.abs(now - ramadanStart);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            dayCounter.textContent = `اليوم ${diffDays} من رمضان`;
        }
    }

    async initializePrayerTimes() {
        try {
            // Try to get user location
            await this.getUserLocation();
            
            // Load prayer times
            if (this.userLocation) {
                await this.loadPrayerTimes();
            } else {
                // Use default location (Mecca)
                this.userLocation = { latitude: 21.4225, longitude: 39.8262 };
                await this.loadPrayerTimes();
            }
            
            // Start prayer time countdown
            this.startPrayerCountdown();
            
        } catch (error) {
            console.error('Error initializing prayer times:', error);
            this.showNotification('تعذر تحميل مواقيت الصلاة', 'warning');
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
                    this.userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    resolve(this.userLocation);
                },
                (error) => {
                    console.warn('Location access denied:', error);
                    reject(error);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }

    async loadPrayerTimes() {
        try {
            // For now, use mock data or Aladhan.com API
            const today = new Date();
            const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
            
            // This would be replaced with actual API call
            this.prayerTimes = this.getMockPrayerTimes();
            
            // Update UI
            this.updatePrayerTimesUI();
            
        } catch (error) {
            console.error('Error loading prayer times:', error);
            throw error;
        }
    }

    getMockPrayerTimes() {
        // Mock prayer times for demonstration
        return [
            { name: 'الفجر', time: '05:21', icon: 'fas fa-moon' },
            { name: 'الشروق', time: '06:43', icon: 'fas fa-sun' },
            { name: 'الظهر', time: '12:30', icon: 'fas fa-sun' },
            { name: 'العصر', time: '15:45', icon: 'fas fa-sun' },
            { name: 'المغرب', time: '18:15', icon: 'fas fa-sun' },
            { name: 'العشاء', time: '19:45', icon: 'fas fa-moon' }
        ];
    }

    updatePrayerTimesUI() {
        const prayerTimesContainer = document.getElementById('prayerTimes');
        if (!prayerTimesContainer) return;
        
        prayerTimesContainer.innerHTML = '';
        
        this.prayerTimes.forEach(prayer => {
            const prayerElement = document.createElement('div');
            prayerElement.className = 'prayer-time-item';
            prayerElement.innerHTML = `
                <span class="prayer-name">${prayer.name}</span>
                <span class="prayer-time">${prayer.time}</span>
            `;
            prayerTimesContainer.appendChild(prayerElement);
        });
    }

    startPrayerCountdown() {
        // Calculate next prayer time
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        let nextPrayer = null;
        let nextPrayerTime = null;
        
        // This is simplified - in production, parse actual prayer times
        const prayerTimes = [
            { name: 'الفجر', time: '05:21' },
            { name: 'الظهر', time: '12:30' },
            { name: 'العصر', time: '15:45' },
            { name: 'المغرب', time: '18:15' },
            { name: 'العشاء', time: '19:45' }
        ];
        
        prayerTimes.forEach(prayer => {
            const [hours, minutes] = prayer.time.split(':').map(Number);
            const prayerTime = hours * 60 + minutes;
            
            if (prayerTime > currentTime && (!nextPrayerTime || prayerTime < nextPrayerTime)) {
                nextPrayer = prayer;
                nextPrayerTime = prayerTime;
            }
        });
        
        // If no next prayer found today, use first prayer tomorrow
        if (!nextPrayer) {
            nextPrayer = prayerTimes[0];
            nextPrayerTime = 5 * 60 + 21; // Fajr time
            nextPrayerTime += 24 * 60; // Add 24 hours
        }
        
        // Update next prayer display
        const nextPrayerElement = document.getElementById('nextPrayer');
        if (nextPrayerElement) {
            const prayerNameElement = nextPrayerElement.querySelector('.prayer-name');
            if (prayerNameElement) {
                prayerNameElement.textContent = nextPrayer.name;
            }
        }
        
        // Start countdown timer
        this.updatePrayerCountdown(nextPrayerTime);
        setInterval(() => {
            this.updatePrayerCountdown(nextPrayerTime);
        }, 1000);
    }

    updatePrayerCountdown(nextPrayerTime) {
        const now = new Date();
        const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        
        // Calculate time difference
        let diffSeconds = nextPrayerTime * 60 - currentTime;
        if (diffSeconds < 0) diffSeconds += 24 * 3600; // Add 24 hours if negative
        
        // Format countdown
        const hours = Math.floor(diffSeconds / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = diffSeconds % 60;
        
        const countdownElement = document.getElementById('prayerCountdown');
        if (countdownElement) {
            countdownElement.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    initializeQuran() {
        // Initialize Quran functionality
        console.log('Initializing Quran...');
        // Will be implemented in quran.js
    }

    initializeSidebar() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebarClose = document.getElementById('sidebarClose');
        const sidebar = document.getElementById('sidebar');
        
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.add('active');
            });
        }
        
        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => {
                sidebar.classList.remove('active');
            });
        }
        
        // Close sidebar when clicking outside
        document.addEventListener('click', (event) => {
            if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        });
    }

    initializeSearch() {
        const searchToggle = document.getElementById('searchToggle');
        const searchClose = document.getElementById('searchClose');
        const searchBar = document.getElementById('searchBar');
        
        if (searchToggle) {
            searchToggle.addEventListener('click', () => {
                searchBar.classList.add('active');
                document.getElementById('searchInput').focus();
            });
        }
        
        if (searchClose) {
            searchClose.addEventListener('click', () => {
                searchBar.classList.remove('active');
            });
        }
        
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                this.performSearch(event.target.value);
            });
        }
    }

    initializeAudioPlayer() {
        // Initialize audio player controls
        const playBtn = document.getElementById('playBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.toggleAudioPlayback();
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.previousAudioTrack();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextAudioTrack();
            });
        }
    }

    performSearch(query) {
        if (query.length < 2) return;
        
        console.log('Searching for:', query);
        // Implement search functionality across all content
        // This will search in Quran, Hadith, Recipes, etc.
    }

    toggleAudioPlayback() {
        // Toggle audio playback
        console.log('Toggle audio playback');
        // Will be implemented in audio controller
    }

    previousAudioTrack() {
        console.log('Previous track');
        // Will be implemented in audio controller
    }

    nextAudioTrack() {
        console.log('Next track');
        // Will be implemented in audio controller
    }

    async loadInitialData() {
        // Load initial data from APIs
        await Promise.all([
            this.loadDailyContent(),
            this.loadImsakiya(),
            this.loadHadithOfDay()
        ]);
    }

    async loadDailyContent() {
        try {
            // Load verse of the day
            const verseResponse = await fetch('https://quran.yousefheiba.com/api/random-verse');
            if (verseResponse.ok) {
                const verseData = await verseResponse.json();
                // Update verse of the day
                const verseElement = document.getElementById('verseOfDay');
                const verseReference = document.querySelector('.verse-reference');
                
                if (verseElement && verseReference) {
                    verseElement.textContent = verseData.text;
                    verseReference.textContent = verseData.reference;
                }
            }
        } catch (error) {
            console.error('Error loading daily content:', error);
        }
    }

    async loadImsakiya() {
        try {
            // Load Imsakiya data from local JSON
            const response = await fetch('data/imsakia.json');
            if (response.ok) {
                const imsakiyaData = await response.json();
                this.updateImsakiyaWidget(imsakiyaData);
            }
        } catch (error) {
            console.error('Error loading Imsakiya:', error);
        }
    }

    updateImsakiyaWidget(data) {
        const widget = document.getElementById('imsakiyaWidget');
        if (!widget) return;
        
        // Find today's Imsakiya
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const todayImsakiya = data.find(item => item.date === todayStr);
        
        if (todayImsakiya) {
            widget.innerHTML = `
                <div class="imsakiya-today">
                    <div class="imsakiya-item">
                        <span class="imsakiya-label">السحور</span>
                        <span class="imsakiya-time">${todayImsakiya.suhoor}</span>
                    </div>
                    <div class="imsakiya-item">
                        <span class="imsakiya-label">الفجر</span>
                        <span class="imsakiya-time">${todayImsakiya.fajr}</span>
                    </div>
                    <div class="imsakiya-item">
                        <span class="imsakiya-label">المغرب</span>
                        <span class="imsakiya-time">${todayImsakiya.iftar}</span>
                    </div>
                </div>
            `;
        }
    }

    async loadHadithOfDay() {
        try {
            // Load hadiths from local JSON
            const response = await fetch('data/hadiths.json');
            if (response.ok) {
                const hadithsData = await response.json();
                this.updateHadithOfDay(hadithsData);
            }
        } catch (error) {
            console.error('Error loading hadiths:', error);
        }
    }

    updateHadithOfDay(hadiths) {
        if (!hadiths || hadiths.length === 0) return;
        
        // Select a random hadith
        const randomIndex = Math.floor(Math.random() * hadiths.length);
        const randomHadith = hadiths[randomIndex];
        
        const hadithElement = document.getElementById('hadithOfDay');
        const referenceElement = document.getElementById('hadithReference');
        
        if (hadithElement && referenceElement) {
            hadithElement.textContent = randomHadith.text;
            referenceElement.textContent = randomHadith.source;
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const content = document.getElementById('notificationContent');
        
        if (!notification || !content) return;
        
        // Set message and type
        content.textContent = message;
        notification.className = `notification ${type}`;
        
        // Show notification
        notification.classList.add('active');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('active');
        }, 5000);
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                const target = item.getAttribute('href').substring(1);
                this.navigateTo(target);
            });
        });
        
        // Menu items
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                const target = item.getAttribute('href').substring(1);
                this.navigateTo(target);
                
                // Close sidebar
                document.getElementById('sidebar').classList.remove('active');
            });
        });
        
        // Quick actions
        const actionCards = document.querySelectorAll('.action-card');
        actionCards.forEach(card => {
            card.addEventListener('click', (event) => {
                event.preventDefault();
                const target = card.getAttribute('href').substring(1);
                this.navigateTo(target);
            });
        });
        
        // Update date every minute
        setInterval(() => {
            this.updateDateDisplay();
        }, 60000);
    }

    navigateTo(page) {
        this.currentPage = page;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`.nav-item[href="#${page}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        // Load page content
        this.loadPageContent(page);
    }

    async loadPageContent(page) {
        // Hide all sections first
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show loading indicator if needed
        this.showLoading(page);
        
        try {
            switch (page) {
                case 'home':
                    // Home is already loaded
                    break;
                    
                case 'quran':
                    await this.loadQuranPage();
                    break;
                    
                case 'tasbih':
                    await this.loadTasbihPage();
                    break;
                    
                case 'qibla':
                    await this.loadQiblaPage();
                    break;
                    
                case 'azkar':
                    await this.loadAzkarPage();
                    break;
                    
                case 'hadith':
                    await this.loadHadithPage();
                    break;
                    
                case 'recipes':
                    await this.loadRecipesPage();
                    break;
                    
                case 'imsakiya':
                    await this.loadImsakiyaPage();
                    break;
                    
                case 'radio':
                    await this.loadRadioPage();
                    break;
                    
                case 'seerah':
                    await this.loadSeerahPage();
                    break;
                    
                case 'settings':
                    await this.loadSettingsPage();
                    break;
                    
                default:
                    console.warn(`Unknown page: ${page}`);
            }
            
            this.hideLoading();
            
        } catch (error) {
            console.error(`Error loading page ${page}:`, error);
            this.showNotification(`تعذر تحميل الصفحة: ${page}`, 'error');
            this.hideLoading();
        }
    }

    showLoading(page) {
        // Implement loading indicator for specific page
        console.log(`Loading ${page}...`);
    }

    hideLoading() {
        // Hide loading indicator
        console.log('Loading complete');
    }

    startBackgroundServices() {
        // Start background tasks
        this.startPrayerNotifications();
        this.startIftarCountdown();
        
        // Update data periodically
        setInterval(() => {
            this.updatePrayerTimes();
            this.updateDateDisplay();
        }, 300000); // Every 5 minutes
    }

    startPrayerNotifications() {
        // Setup prayer notifications
        console.log('Starting prayer notifications...');
        // Will be implemented in notifications.js
    }

    startIftarCountdown() {
        // Start Iftar countdown
        console.log('Starting Iftar countdown...');
        // Will be implemented
    }

    async updatePrayerTimes() {
        try {
            await this.loadPrayerTimes();
            this.showNotification('تم تحديث مواقيت الصلاة', 'success');
        } catch (error) {
            console.error('Error updating prayer times:', error);
        }
    }

    // Page loading methods (to be implemented in respective files)
    async loadQuranPage() {
        console.log('Loading Quran page...');
        // Implement in quran.js
    }

    async loadTasbihPage() {
        console.log('Loading Tasbih page...');
        // Implement in tasbih.js
    }

    async loadQiblaPage() {
        console.log('Loading Qibla page...');
        // Implement in qibla.js
    }

    async loadAzkarPage() {
        console.log('Loading Azkar page...');
        // Implement in azkar.js
    }

    async loadHadithPage() {
        console.log('Loading Hadith page...');
        // Implement in hadith.js
    }

    async loadRecipesPage() {
        console.log('Loading Recipes page...');
        // Implement in recipes.js
    }

    async loadImsakiyaPage() {
        console.log('Loading Imsakiya page...');
        // Implement in imsakiya.js
    }

    async loadRadioPage() {
        console.log('Loading Radio page...');
        // Implement in radio.js
    }

    async loadSeerahPage() {
        console.log('Loading Seerah page...');
        // Implement in seerah.js
    }

    async loadSettingsPage() {
        console.log('Loading Settings page...');
        // Implement in settings.js
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LazyRamadanApp();
});