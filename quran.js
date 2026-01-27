// Quran Management System

class QuranManager {
    constructor() {
        this.surahs = [];
        this.currentSurah = null;
        this.currentAyah = null;
        this.reciters = [];
        this.currentReciter = null;
        this.bookmarks = [];
        this.history = [];
        this.settings = {
            fontSize: 18,
            fontFamily: 'UthmanicHafs',
            theme: 'default',
            showTranslation: false,
            showTafsir: false,
            autoScroll: true,
            nightMode: false,
            wordByWord: false
        };
        this.audioPlayer = null;
        this.init();
    }

    async init() {
        // Load settings
        await this.loadSettings();
        
        // Load Quran data
        await this.loadSurahs();
        
        // Load reciters
        await this.loadReciters();
        
        // Load bookmarks and history
        await this.loadUserData();
        
        // Initialize audio player
        this.initAudioPlayer();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI
        this.updateUI();
    }

    async loadSettings() {
        const savedSettings = Utils.getLocalStorage('quranSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };
        }
    }

    async loadSurahs() {
        try {
            // Try to load from API
            const response = await fetch('https://quran.yousefheiba.com/api/surahs');
            
            if (response.ok) {
                const data = await response.json();
                this.surahs = data.surahs || [];
            } else {
                // Fallback to local data
                await this.loadLocalSurahs();
            }
        } catch (error) {
            console.error('Error loading surahs:', error);
            await this.loadLocalSurahs();
        }
        
        // Cache surahs
        this.cacheSurahs();
    }

    async loadLocalSurahs() {
        try {
            const response = await fetch('data/quran/surahs.json');
            if (response.ok) {
                const data = await response.json();
                this.surahs = data;
            } else {
                // Create minimal surah list
                this.surahs = this.createMinimalSurahList();
            }
        } catch (error) {
            console.error('Error loading local surahs:', error);
            this.surahs = this.createMinimalSurahList();
        }
    }

    createMinimalSurahList() {
        // Create a minimal list of surahs for fallback
        return [
            {
                id: 1,
                name: 'الفاتحة',
                englishName: 'Al-Fatiha',
                ayahs: 7,
                type: 'meccan',
                revelationOrder: 5
            },
            {
                id: 2,
                name: 'البقرة',
                englishName: 'Al-Baqarah',
                ayahs: 286,
                type: 'medinan',
                revelationOrder: 87
            },
            {
                id: 114,
                name: 'الناس',
                englishName: 'An-Nas',
                ayahs: 6,
                type: 'meccan',
                revelationOrder: 21
            }
        ];
    }

    async loadReciters() {
        try {
            const response = await fetch('https://quran.yousefheiba.com/api/reciters');
            
            if (response.ok) {
                const data = await response.json();
                this.reciters = data.reciters || [];
            } else {
                // Fallback to default reciters
                this.reciters = this.getDefaultReciters();
            }
        } catch (error) {
            console.error('Error loading reciters:', error);
            this.reciters = this.getDefaultReciters();
        }
        
        // Set default reciter
        if (this.reciters.length > 0) {
            const savedReciterId = Utils.getLocalStorage('currentReciterId');
            this.currentReciter = this.reciters.find(r => r.id === savedReciterId) || this.reciters[0];
        }
    }

    getDefaultReciters() {
        return [
            {
                id: 'ar.abdulbasitmurattal',
                name: 'عبد الباسط عبد الصمد',
                style: 'Murattal'
            },
            {
                id: 'ar.abdullahbasfar',
                name: 'عبد الله بصفر',
                style: 'Murattal'
            },
            {
                id: 'ar.abdurrahmaansudais',
                name: 'عبد الرحمن السديس',
                style: 'Murattal'
            },
            {
                id: 'ar.ahmedajamy',
                name: 'أحمد العجمي',
                style: 'Murattal'
            },
            {
                id: 'ar.alafasy',
                name: 'مشاري العفاسي',
                style: 'Murattal'
            }
        ];
    }

    async loadUserData() {
        this.bookmarks = Utils.getLocalStorage('quranBookmarks', []);
        this.history = Utils.getLocalStorage('quranHistory', []);
    }

    initAudioPlayer() {
        this.audioPlayer = new Audio();
        
        this.audioPlayer.addEventListener('timeupdate', () => {
            this.onAudioTimeUpdate();
        });
        
        this.audioPlayer.addEventListener('ended', () => {
            this.onAudioEnded();
        });
        
        this.audioPlayer.addEventListener('error', (error) => {
            console.error('Audio player error:', error);
            Utils.showToast('تعذر تشغيل التلاوة', 'error');
        });
    }

    async loadSurah(surahId, startAyah = 1) {
        try {
            const surah = this.surahs.find(s => s.id === surahId);
            if (!surah) {
                throw new Error('Surah not found');
            }
            
            this.currentSurah = surah;
            this.currentAyah = startAyah;
            
            // Load surah content
            const ayahs = await this.loadSurahContent(surahId);
            
            // Update history
            this.addToHistory(surahId, startAyah);
            
            // Update UI
            this.displaySurah(ayahs);
            
            // Load audio if auto-play is enabled
            if (this.settings.autoPlay) {
                await this.playAyah(surahId, startAyah);
            }
            
            return ayahs;
        } catch (error) {
            console.error('Error loading surah:', error);
            Utils.showToast('تعذر تحميل السورة', 'error');
            return null;
        }
    }

    async loadSurahContent(surahId) {
        try {
            // Try to load from API
            const response = await fetch(`https://quran.yousefheiba.com/api/surah/${surahId}`);
            
            if (response.ok) {
                const data = await response.json();
                return data.ayahs || [];
            } else {
                // Fallback to local storage
                return await this.loadLocalSurahContent(surahId);
            }
        } catch (error) {
            console.error('Error loading surah content:', error);
            return await this.loadLocalSurahContent(surahId);
        }
    }

    async loadLocalSurahContent(surahId) {
        try {
            const response = await fetch(`data/quran/surah_${surahId}.json`);
            if (response.ok) {
                const data = await response.json();
                return data.ayahs || [];
            }
        } catch (error) {
            console.error('Error loading local surah content:', error);
        }
        
        // Return empty array if no content found
        return [];
    }

    displaySurah(ayahs) {
        const container = document.getElementById('quran-content');
        if (!container) return;
        
        Utils.removeAllChildren(container);
        
        // Create surah header
        const header = this.createSurahHeader();
        container.appendChild(header);
        
        // Create ayahs container
        const ayahsContainer = Utils.createElement('div', {
            className: 'ayahs-container',
            style: {
                fontFamily: this.settings.fontFamily,
                fontSize: `${this.settings.fontSize}px`,
                lineHeight: '2',
                textAlign: 'right',
                padding: '1rem'
            }
        });
        
        // Add each ayah
        ayahs.forEach((ayah, index) => {
            const ayahElement = this.createAyahElement(ayah, index + 1);
            ayahsContainer.appendChild(ayahElement);
        });
        
        container.appendChild(ayahsContainer);
        
        // Scroll to current ayah
        this.scrollToAyah(this.currentAyah);
    }

    createSurahHeader() {
        const header = Utils.createElement('div', {
            className: 'surah-header',
            style: {
                background: 'linear-gradient(135deg, var(--primary-dark), var(--primary-color))',
                color: 'white',
                padding: '1.5rem',
                textAlign: 'center',
                borderRadius: '12px 12px 0 0',
                marginBottom: '1rem'
            }
        });
        
        const surahName = Utils.createElement('h1', {
            className: 'surah-name',
            style: {
                fontSize: '1.8rem',
                marginBottom: '0.5rem'
            }
        }, this.currentSurah.name);
        
        const surahInfo = Utils.createElement('div', {
            className: 'surah-info',
            style: {
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                fontSize: '0.9rem',
                opacity: '0.9'
            }
        });
        
        const ayahsCount = Utils.createElement('span', {}, `عدد الآيات: ${this.currentSurah.ayahs}`);
        const revelationType = Utils.createElement('span', {}, `نوعها: ${this.currentSurah.type === 'meccan' ? 'مكية' : 'مدنية'}`);
        
        surahInfo.appendChild(ayahsCount);
        surahInfo.appendChild(revelationType);
        
        const bismillah = Utils.createElement('div', {
            className: 'bismillah',
            style: {
                fontFamily: this.settings.fontFamily,
                fontSize: `${this.settings.fontSize + 4}px`,
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
            }
        }, 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ');
        
        header.appendChild(surahName);
        header.appendChild(surahInfo);
        
        // Add bismillah for all surahs except At-Tawbah
        if (this.currentSurah.id !== 9) {
            header.appendChild(bismillah);
        }
        
        return header;
    }

    createAyahElement(ayah, ayahNumber) {
        const ayahElement = Utils.createElement('div', {
            className: 'ayah',
            'data-ayah': ayahNumber,
            style: {
                marginBottom: '1.5rem',
                padding: '0.5rem',
                borderRadius: '8px',
                transition: 'background-color 0.3s'
            }
        });
        
        // Highlight current ayah
        if (ayahNumber === this.currentAyah) {
            ayahElement.style.backgroundColor = 'rgba(26, 93, 26, 0.1)';
        }
        
        // Ayah number
        const ayahNumberElement = Utils.createElement('span', {
            className: 'ayah-number',
            style: {
                display: 'inline-block',
                width: '30px',
                height: '30px',
                lineHeight: '30px',
                textAlign: 'center',
                background: 'var(--primary-color)',
                color: 'white',
                borderRadius: '50%',
                marginLeft: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 'bold'
            }
        }, Utils.arabicNumber(ayahNumber));
        
        // Ayah text
        const ayahTextElement = Utils.createElement('span', {
            className: 'ayah-text',
            style: {
                fontFamily: this.settings.fontFamily,
                fontSize: `${this.settings.fontSize}px`,
                lineHeight: '2'
            }
        }, ayah.text);
        
        // Ayah actions
        const actionsContainer = Utils.createElement('div', {
            className: 'ayah-actions',
            style: {
                display: 'flex',
                gap: '0.5rem',
                marginTop: '0.5rem',
                opacity: '0.7',
                transition: 'opacity 0.3s'
            }
        });
        
        actionsContainer.addEventListener('mouseenter', () => {
            actionsContainer.style.opacity = '1';
        });
        
        actionsContainer.addEventListener('mouseleave', () => {
            actionsContainer.style.opacity = '0.7';
        });
        
        // Play button
        const playBtn = Utils.createElement('button', {
            className: 'ayah-action-btn',
            'data-action': 'play',
            'data-ayah': ayahNumber,
            style: {
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                transition: 'background-color 0.3s'
            }
        }, '<i class="fas fa-play"></i> تشغيل');
        
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.playAyah(this.currentSurah.id, ayahNumber);
        });
        
        // Bookmark button
        const isBookmarked = this.isAyahBookmarked(this.currentSurah.id, ayahNumber);
        const bookmarkBtn = Utils.createElement('button', {
            className: 'ayah-action-btn',
            'data-action': 'bookmark',
            'data-ayah': ayahNumber,
            style: {
                background: 'none',
                border: 'none',
                color: isBookmarked ? 'var(--secondary-color)' : 'var(--text-light)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                transition: 'background-color 0.3s'
            }
        }, isBookmarked ? '<i class="fas fa-bookmark"></i> محفوظة' : '<i class="far fa-bookmark"></i> حفظ');
        
        bookmarkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleBookmark(this.currentSurah.id, ayahNumber);
            bookmarkBtn.innerHTML = this.isAyahBookmarked(this.currentSurah.id, ayahNumber) 
                ? '<i class="fas fa-bookmark"></i> محفوظة' 
                : '<i class="far fa-bookmark"></i> حفظ';
            bookmarkBtn.style.color = this.isAyahBookmarked(this.currentSurah.id, ayahNumber) 
                ? 'var(--secondary-color)' 
                : 'var(--text-light)';
        });
        
        // Share button
        const shareBtn = Utils.createElement('button', {
            className: 'ayah-action-btn',
            'data-action': 'share',
            'data-ayah': ayahNumber,
            style: {
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                transition: 'background-color 0.3s'
            }
        }, '<i class="fas fa-share"></i> مشاركة');
        
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.shareAyah(this.currentSurah.id, ayahNumber);
        });
        
        actionsContainer.appendChild(playBtn);
        actionsContainer.appendChild(bookmarkBtn);
        actionsContainer.appendChild(shareBtn);
        
        ayahElement.appendChild(ayahTextElement);
        ayahElement.appendChild(ayahNumberElement);
        ayahElement.appendChild(actionsContainer);
        
        // Add click handler to select ayah
        ayahElement.addEventListener('click', () => {
            this.selectAyah(ayahNumber);
        });
        
        return ayahElement;
    }

    async playAyah(surahId, ayahNumber, reciterId = null) {
        try {
            // Stop current playback
            if (this.audioPlayer && !this.audioPlayer.paused) {
                this.audioPlayer.pause();
                this.audioPlayer.currentTime = 0;
            }
            
            // Get reciter
            const reciter = reciterId 
                ? this.reciters.find(r => r.id === reciterId) 
                : this.currentReciter;
            
            if (!reciter) {
                throw new Error('Reciter not found');
            }
            
            // Construct audio URL
            const audioUrl = `https://quran.yousefheiba.com/api/reciterAudio?reciter_id=${reciter.id}&surah=${surahId}&ayah=${ayahNumber}`;
            
            // Set audio source
            this.audioPlayer.src = audioUrl;
            
            // Play audio
            await this.audioPlayer.play();
            
            // Update current ayah
            this.currentAyah = ayahNumber;
            
            // Update UI
            this.highlightCurrentAyah();
            
            // Show player controls
            this.showAudioPlayer(reciter.name);
            
            return true;
        } catch (error) {
            console.error('Error playing ayah:', error);
            Utils.showToast('تعذر تشغيل التلاوة', 'error');
            return false;
        }
    }

    async playSurah(surahId, reciterId = null) {
        return this.playAyah(surahId, 1, reciterId);
    }

    onAudioTimeUpdate() {
        // Update progress bar
        const progressBar = document.getElementById('audioProgress');
        if (progressBar && this.audioPlayer.duration) {
            const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            progressBar.value = progress;
        }
    }

    onAudioEnded() {
        // Auto-play next ayah if enabled
        if (this.settings.autoContinue && this.currentAyah < this.currentSurah.ayahs) {
            this.playAyah(this.currentSurah.id, this.currentAyah + 1);
        }
    }

    showAudioPlayer(reciterName) {
        const player = document.getElementById('audioPlayer');
        if (player) {
            player.classList.add('active');
            
            // Update player info
            const title = document.getElementById('playerTitle');
            const subtitle = document.getElementById('playerSubtitle');
            
            if (title) {
                title.textContent = `سورة ${this.currentSurah.name} - الآية ${this.currentAyah}`;
            }
            
            if (subtitle) {
                subtitle.textContent = reciterName;
            }
            
            // Setup player controls
            this.setupPlayerControls();
        }
    }

    setupPlayerControls() {
        const playBtn = document.getElementById('playBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const progressBar = document.getElementById('progressBar');
        
        if (playBtn) {
            playBtn.innerHTML = this.audioPlayer.paused 
                ? '<i class="fas fa-play"></i>' 
                : '<i class="fas fa-pause"></i>';
            
            playBtn.onclick = () => {
                if (this.audioPlayer.paused) {
                    this.audioPlayer.play();
                    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                } else {
                    this.audioPlayer.pause();
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                }
            };
        }
        
        if (prevBtn) {
            prevBtn.onclick = () => {
                if (this.currentAyah > 1) {
                    this.playAyah(this.currentSurah.id, this.currentAyah - 1);
                }
            };
        }
        
        if (nextBtn) {
            nextBtn.onclick = () => {
                if (this.currentAyah < this.currentSurah.ayahs) {
                    this.playAyah(this.currentSurah.id, this.currentAyah + 1);
                }
            };
        }
        
        if (progressBar) {
            progressBar.oninput = (e) => {
                const time = (e.target.value / 100) * this.audioPlayer.duration;
                this.audioPlayer.currentTime = time;
            };
        }
    }

    highlightCurrentAyah() {
        // Remove highlight from all ayahs
        document.querySelectorAll('.ayah').forEach(ayah => {
            ayah.style.backgroundColor = '';
        });
        
        // Highlight current ayah
        const currentAyah = document.querySelector(`.ayah[data-ayah="${this.currentAyah}"]`);
        if (currentAyah) {
            currentAyah.style.backgroundColor = 'rgba(26, 93, 26, 0.1)';
            
            // Scroll to ayah if auto-scroll is enabled
            if (this.settings.autoScroll) {
                this.scrollToAyah(this.currentAyah);
            }
        }
    }

    scrollToAyah(ayahNumber) {
        const ayahElement = document.querySelector(`.ayah[data-ayah="${ayahNumber}"]`);
        if (ayahElement) {
            ayahElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    selectAyah(ayahNumber) {
        this.currentAyah = ayahNumber;
        this.highlightCurrentAyah();
        
        // Update history
        this.addToHistory(this.currentSurah.id, ayahNumber);
    }

    addToHistory(surahId, ayahNumber) {
        const historyItem = {
            surahId,
            ayahNumber,
            timestamp: Date.now()
        };
        
        // Remove if already exists
        this.history = this.history.filter(item => 
            !(item.surahId === surahId && item.ayahNumber === ayahNumber)
        );
        
        // Add to beginning
        this.history.unshift(historyItem);
        
        // Keep only last 50 items
        this.history = this.history.slice(0, 50);
        
        // Save to localStorage
        Utils.setLocalStorage('quranHistory', this.history);
    }

    toggleBookmark(surahId, ayahNumber) {
        const bookmarkIndex = this.bookmarks.findIndex(b => 
            b.surahId === surahId && b.ayah === ayahNumber
        );
        
        if (bookmarkIndex > -1) {
            // Remove bookmark
            this.bookmarks.splice(bookmarkIndex, 1);
            Utils.showToast('تمت إزالة الإشارة المرجعية', 'success');
        } else {
            // Add bookmark
            this.bookmarks.push({
                surahId,
                ayah: ayahNumber,
                surahName: this.surahs.find(s => s.id === surahId)?.name || '',
                timestamp: Date.now()
            });
            Utils.showToast('تمت إضافة الإشارة المرجعية', 'success');
        }
        
        // Save to localStorage
        Utils.setLocalStorage('quranBookmarks', this.bookmarks);
    }

    isAyahBookmarked(surahId, ayahNumber) {
        return this.bookmarks.some(b => 
            b.surahId === surahId && b.ayah === ayahNumber
        );
    }

    async shareAyah(surahId, ayahNumber) {
        try {
            const surah = this.surahs.find(s => s.id === surahId);
            const text = `سورة ${surah.name} - الآية ${ayahNumber}`;
            
            if (navigator.share) {
                await navigator.share({
                    title: 'آية من القرآن الكريم',
                    text: text,
                    url: window.location.href
                });
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(text);
                Utils.showToast('تم نسخ الآية', 'success');
            }
        } catch (error) {
            console.error('Error sharing ayah:', error);
        }
    }

    cacheSurahs() {
        Utils.setLocalStorage('cachedSurahs', {
            surahs: this.surahs,
            timestamp: Date.now()
        });
    }

    loadCachedSurahs() {
        const cachedData = Utils.getLocalStorage('cachedSurahs');
        
        if (cachedData && cachedData.timestamp) {
            const cacheAge = Date.now() - cachedData.timestamp;
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            if (cacheAge < maxAge) {
                this.surahs = cachedData.surahs || [];
                return true;
            }
        }
        
        return false;
    }

    updateUI() {
        // Update font size
        document.documentElement.style.setProperty('--quran-font-size', `${this.settings.fontSize}px`);
        
        // Update theme
        document.body.setAttribute('data-quran-theme', this.settings.theme);
        
        // Update night mode
        if (this.settings.nightMode) {
            document.body.classList.add('night-mode');
        } else {
            document.body.classList.remove('night-mode');
        }
    }

    setupEventListeners() {
        // Font size controls
        document.addEventListener('fontSizeChanged', (event) => {
            this.settings.fontSize = event.detail;
            this.updateUI();
            Utils.setLocalStorage('quranSettings', this.settings);
        });
        
        // Theme changes
        document.addEventListener('themeChanged', (event) => {
            this.settings.theme = event.detail;
            this.updateUI();
            Utils.setLocalStorage('quranSettings', this.settings);
        });
        
        // Night mode toggle
        document.addEventListener('nightModeToggled', (event) => {
            this.settings.nightMode = event.detail;
            this.updateUI();
            Utils.setLocalStorage('quranSettings', this.settings);
        });
        
        // Reciter changed
        document.addEventListener('reciterChanged', (event) => {
            this.currentReciter = event.detail;
            Utils.setLocalStorage('currentReciterId', this.currentReciter.id);
            
            // Restart playback if currently playing
            if (!this.audioPlayer.paused && this.currentSurah) {
                this.playAyah(this.currentSurah.id, this.currentAyah);
            }
        });
    }

    // Public API methods
    getSurah(surahId) {
        return this.surahs.find(s => s.id === surahId);
    }

    getSurahByName(name) {
        return this.surahs.find(s => 
            s.name === name || s.englishName.toLowerCase() === name.toLowerCase()
        );
    }

    searchInQuran(query) {
        if (!query || query.length < 2) return [];
        
        // This would search in cached ayahs or use an API
        // For now, return matching surahs
        return this.surahs.filter(surah => 
            surah.name.includes(query) || 
            surah.englishName.toLowerCase().includes(query.toLowerCase())
        );
    }

    getRandomAyah() {
        if (this.surahs.length === 0) return null;
        
        const randomSurah = this.surahs[Math.floor(Math.random() * this.surahs.length)];
        const randomAyah = Math.floor(Math.random() * randomSurah.ayahs) + 1;
        
        return {
            surah: randomSurah,
            ayah: randomAyah
        };
    }

    getBookmarks() {
        return this.bookmarks.map(bookmark => ({
            ...bookmark,
            surah: this.surahs.find(s => s.id === bookmark.surahId)
        })).filter(b => b.surah); // Filter out bookmarks with invalid surahs
    }

    getRecentHistory(limit = 10) {
        return this.history.slice(0, limit).map(item => ({
            ...item,
            surah: this.surahs.find(s => s.id === item.surahId)
        })).filter(h => h.surah); // Filter out history with invalid surahs
    }

    clearHistory() {
        this.history = [];
        Utils.setLocalStorage('quranHistory', []);
        Utils.showToast('تم مسح السجل', 'success');
    }

    clearBookmarks() {
        this.bookmarks = [];
        Utils.setLocalStorage('quranBookmarks', []);
        Utils.showToast('تم مسح الإشارات المرجعية', 'success');
    }

    // Static method to get instance
    static async getInstance() {
        if (!QuranManager.instance) {
            QuranManager.instance = new QuranManager();
            await QuranManager.instance.init();
        }
        return QuranManager.instance;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.quranManager = await QuranManager.getInstance();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuranManager;
}