// ============================================
// الثوابت والمتغيرات العامة
// ============================================

const GAME_CONFIG = {
    VERSION: "1.0",
    MAX_PLAYERS: 16,
    MAP_SIZE: 1000,
    ZONE_SHRINK_TIME: 300, // 5 دقائق
    BOT_COUNT: 15,
    DIFFICULTY_LEVELS: {
        easy: { botAccuracy: 0.3, botSpeed: 0.7, botReaction: 1.5 },
        normal: { botAccuracy: 0.5, botSpeed: 0.85, botReaction: 1.0 },
        hard: { botAccuracy: 0.7, botSpeed: 1.0, botReaction: 0.7 },
        expert: { botAccuracy: 0.9, botSpeed: 1.2, botReaction: 0.5 }
    }
};

// حالة اللعبة
const GameState = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

let currentState = GameState.LOADING;
let gameDifficulty = 'normal';
let gameSettings = {
    graphicsQuality: 'medium',
    resolution: 'auto',
    shadows: true,
    particles: true,
    masterVolume: 80,
    sfxVolume: 90,
    musicVolume: 60,
    mouseSensitivity: 10,
    invertMouse: true,
    movementSpeed: 5
};

// العناصر DOM
const elements = {
    // الشاشات
    loadingScreen: document.getElementById('loadingScreen'),
    mainMenu: document.getElementById('mainMenu'),
    difficultyMenu: document.getElementById('difficultyMenu'),
    gameScreen: document.getElementById('gameScreen'),
    settingsScreen: document.getElementById('settingsScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    aboutScreen: document.getElementById('aboutScreen'),
    
    // الأزرار
    playBtn: document.getElementById('playBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    difficultyBtn: document.getElementById('difficultyBtn'),
    controlsBtn: document.getElementById('controlsBtn'),
    aboutBtn: document.getElementById('aboutBtn'),
    backFromDifficulty: document.getElementById('backFromDifficulty'),
    confirmDifficulty: document.getElementById('confirmDifficulty'),
    backFromSettings: document.getElementById('backFromSettings'),
    saveSettings: document.getElementById('saveSettings'),
    backFromAbout: document.getElementById('backFromAbout'),
    resumeBtn: document.getElementById('resumeBtn'),
    restartBtn: document.getElementById('restartBtn'),
    settingsInGameBtn: document.getElementById('settingsInGameBtn'),
    quitBtn: document.getElementById('quitBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    menuFromGameOverBtn: document.getElementById('menuFromGameOverBtn'),
    shareBtn: document.getElementById('shareBtn'),
    
    // العناصر التفاعلية
    currentDifficulty: document.getElementById('currentDifficulty'),
    progressBar: document.getElementById('progressBar'),
    loadingPercentage: document.getElementById('loadingPercentage'),
    
    // عناصر اللعبة
    gameCanvas: document.getElementById('gameCanvas'),
    healthFill: document.getElementById('healthFill'),
    healthText: document.getElementById('healthText'),
    armorText: document.getElementById('armorText'),
    zoneTimer: document.getElementById('zoneTimer'),
    currentWeapon: document.getElementById('currentWeapon'),
    currentAmmo: document.getElementById('currentAmmo'),
    totalAmmo: document.getElementById('totalAmmo'),
    playersLeft: document.getElementById('playersLeft'),
    
    // عناصر تحكم الهواتف
    joystickArea: document.getElementById('joystickArea'),
    joystick: document.getElementById('joystick'),
    jumpBtn: document.getElementById('jumpBtn'),
    crouchBtn: document.getElementById('crouchBtn'),
    shootBtn: document.getElementById('shootBtn'),
    reloadBtn: document.getElementById('reloadBtn'),
    scopeBtn: document.getElementById('scopeBtn'),
    
    // عناصر الإعدادات
    graphicsQuality: document.getElementById('graphicsQuality'),
    resolution: document.getElementById('resolution'),
    shadows: document.getElementById('shadows'),
    particles: document.getElementById('particles'),
    masterVolume: document.getElementById('masterVolume'),
    sfxVolume: document.getElementById('sfxVolume'),
    musicVolume: document.getElementById('musicVolume'),
    mouseSensitivity: document.getElementById('mouseSensitivity'),
    invertMouse: document.getElementById('invertMouse'),
    movementSpeed: document.getElementById('movementSpeed'),
    masterVolumeValue: document.getElementById('masterVolumeValue'),
    sfxVolumeValue: document.getElementById('sfxVolumeValue'),
    musicVolumeValue: document.getElementById('musicVolumeValue'),
    mouseSensitivityValue: document.getElementById('mouseSensitivityValue'),
    movementSpeedValue: document.getElementById('movementSpeedValue'),
    
    // عناصر نهاية اللعبة
    resultIcon: document.getElementById('resultIcon'),
    resultTitle: document.getElementById('resultTitle'),
    resultMessage: document.getElementById('resultMessage'),
    rank: document.getElementById('rank'),
    kills: document.getElementById('kills'),
    time: document.getElementById('time'),
    accuracy: document.getElementById('accuracy'),
    
    // الإشعارات
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText'),
    rotateNotice: document.getElementById('rotateNotice')
};

// متغيرات WebGL واللعبة
let gl, program;
let canvas, ctx;
let lastTime = 0;
let deltaTime = 0;
let gameTime = 0;
let zoneTime = GAME_CONFIG.ZONE_SHRINK_TIME;
let playersRemaining = GAME_CONFIG.MAX_PLAYERS;
let isMobile = false;
let isPaused = false;

// إحصائيات اللعبة
let gameStats = {
    kills: 0,
    damageDealt: 0,
    accuracy: { shots: 0, hits: 0 },
    survivalTime: 0,
    rank: GAME_CONFIG.MAX_PLAYERS
};

// بيانات اللاعب
const player = {
    position: { x: 0, y: 1.5, z: 0 },
    rotation: { x: 0, y: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    health: 100,
    armor: 0,
    isMoving: false,
    isRunning: false,
    isCrouching: false,
    isJumping: false,
    currentWeapon: null,
    inventory: []
};

// البوتات
let bots = [];

// الخريطة والزون
let map = [];
let safeZone = {
    center: { x: 0, z: 0 },
    radius: GAME_CONFIG.MAP_SIZE / 2,
    nextCenter: { x: 0, z: 0 },
    nextRadius: GAME_CONFIG.MAP_SIZE / 3,
    isShrinking: false
};

// ============================================
// نظام الصوت
// ============================================

const AudioSystem = {
    context: null,
    sounds: {},
    music: null,
    isMuted: false,
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.loadSounds();
        } catch (e) {
            console.warn('Web Audio API غير مدعوم:', e);
        }
    },
    
    loadSounds() {
        // أصوات الأسلحة
        this.sounds.shot = this.createGunshotSound();
        this.sounds.reload = this.createReloadSound();
        this.sounds.empty = this.createEmptyMagazineSound();
        
        // أصوات الحركة
        this.sounds.footstep = this.createFootstepSound();
        this.sounds.jump = this.createJumpSound();
        
        // أصوات البيئة
        this.sounds.zone = this.createZoneSound();
        this.sounds.pickup = this.createPickupSound();
        this.sounds.heal = this.createHealSound();
        
        // أصوات خاصة
        this.sounds.victory = this.createVictorySound();
        this.sounds.defeat = this.createDefeatSound();
    },
    
    createGunshotSound() {
        if (!this.context) return null;
        
        const duration = 0.1;
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(2, sampleRate * duration, sampleRate);
        
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < data.length; i++) {
                const t = i / sampleRate;
                // نمط صوت إطلاق نار
                data[i] = Math.random() * 0.5 * Math.exp(-t * 50) * 
                          Math.sin(2 * Math.PI * 800 * t * Math.exp(-t * 10));
            }
        }
        
        return buffer;
    },
    
    createFootstepSound() {
        if (!this.context) return null;
        
        const duration = 0.3;
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(2, sampleRate * duration, sampleRate);
        
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < data.length; i++) {
                const t = i / sampleRate;
                // صوت خطوات
                data[i] = Math.random() * 0.2 * Math.exp(-t * 20) * 
                          Math.sin(2 * Math.PI * 200 * t);
            }
        }
        
        return buffer;
    },
    
    createSound(buffer, volume = 1.0, pitch = 1.0) {
        if (!this.context || !buffer) return null;
        
        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        
        source.buffer = buffer;
        source.playbackRate.value = pitch;
        gainNode.gain.value = volume * (gameSettings.sfxVolume / 100) * (gameSettings.masterVolume / 100);
        
        source.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        return { source, gainNode };
    },
    
    play(soundName, options = {}) {
        if (this.isMuted || !this.sounds[soundName]) return;
        
        const sound = this.createSound(
            this.sounds[soundName],
            options.volume || 1.0,
            options.pitch || 1.0
        );
        
        if (sound) {
            sound.source.start(0);
            return sound;
        }
    },
    
    playMusic() {
        // يمكن إضافة موسيقى خلفية هنا
    },
    
    createReloadSound() {
        // توليد صوت إعادة التعبئة
        return this.createGunshotSound(); // مؤقت
    },
    
    createEmptyMagazineSound() {
        // توليد صوت خرطوشة فارغة
        return this.createGunshotSound(); // مؤقت
    },
    
    createJumpSound() {
        // توليد صوت القفز
        return this.createGunshotSound(); // مؤقت
    },
    
    createZoneSound() {
        // توليد صوت الزون
        return this.createGunshotSound(); // مؤقت
    },
    
    createPickupSound() {
        // توليد صوت التقاط العناصر
        return this.createGunshotSound(); // مؤقت
    },
    
    createHealSound() {
        // توليد صوت العلاج
        return this.createGunshotSound(); // مؤقت
    },
    
    createVictorySound() {
        // توليد صوت الفوز
        return this.createGunshotSound(); // مؤقت
    },
    
    createDefeatSound() {
        // توليد صوت الخسارة
        return this.createGunshotSound(); // مؤقت
    },
    
    setVolume(type, value) {
        gameSettings[type] = value;
        this.updateVolumeValues();
    },
    
    updateVolumeValues() {
        if (elements.masterVolumeValue) {
            elements.masterVolumeValue.textContent = `${gameSettings.masterVolume}%`;
        }
        if (elements.sfxVolumeValue) {
            elements.sfxVolumeValue.textContent = `${gameSettings.sfxVolume}%`;
        }
        if (elements.musicVolumeValue) {
            elements.musicVolumeValue.textContent = `${gameSettings.musicVolume}%`;
        }
    },
    
    toggleMute() {
        this.isMuted = !this.isMuted;
    }
};

// ============================================
// نظام الإشعارات
// ============================================

const NotificationSystem = {
    show(message, duration = 3000) {
        elements.notificationText.textContent = message;
        elements.notification.classList.add('show');
        
        setTimeout(() => {
            elements.notification.classList.remove('show');
        }, duration);
    },
    
    showDamage(amount) {
        this.show(`-${amount} ضرر`, 1500);
    },
    
    showPickup(item) {
        this.show(`تم التقاط ${item}`, 2000);
    },
    
    showKill(botName) {
        this.show(`قمت بالقضاء على ${botName}`, 2500);
    },
    
    showZoneWarning() {
        this.show('الزون يتقلص! ابحث عن منطقة آمنة', 4000);
    }
};

// ============================================
// نظام الذكاء الاصطناعي للبوتات
// ============================================

class Bot {
    constructor(id, difficulty) {
        this.id = id;
        this.name = `بوت ${id}`;
        this.difficulty = difficulty;
        this.config = GAME_CONFIG.DIFFICULTY_LEVELS[difficulty];
        
        this.position = this.getRandomSpawn();
        this.rotation = { x: 0, y: Math.random() * Math.PI * 2 };
        this.health = 100;
        this.armor = Math.random() > 0.7 ? 50 : 0;
        
        this.target = null;
        this.state = 'wandering'; // wandering, chasing, attacking, fleeing
        this.wanderTime = 0;
        this.reactionTime = 0;
        
        this.weapon = {
            name: ['AKM', 'M416', 'SCAR-L'][Math.floor(Math.random() * 3)],
            damage: 30,
            fireRate: 0.5,
            range: 100,
            lastShot: 0
        };
    }
    
    getRandomSpawn() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (GAME_CONFIG.MAP_SIZE / 2 - 100);
        return {
            x: Math.cos(angle) * distance,
            y: 1.5,
            z: Math.sin(angle) * distance
        };
    }
    
    update(deltaTime, playerPosition) {
        if (this.health <= 0) return;
        
        const distanceToPlayer = this.getDistance(playerPosition);
        
        switch (this.state) {
            case 'wandering':
                this.wander(deltaTime);
                if (distanceToPlayer < 50) {
                    this.state = 'chasing';
                }
                break;
                
            case 'chasing':
                this.chase(playerPosition, deltaTime);
                if (distanceToPlayer < 20) {
                    this.state = 'attacking';
                } else if (distanceToPlayer > 100) {
                    this.state = 'wandering';
                }
                break;
                
            case 'attacking':
                this.attack(playerPosition, deltaTime);
                if (distanceToPlayer > 30) {
                    this.state = 'chasing';
                }
                break;
        }
        
        this.updateReaction(deltaTime);
    }
    
    wander(deltaTime) {
        this.wanderTime += deltaTime;
        
        if (this.wanderTime > 2) {
            this.rotation.y += (Math.random() - 0.5) * Math.PI;
            this.wanderTime = 0;
        }
        
        const speed = 2 * this.config.botSpeed;
        this.position.x += Math.cos(this.rotation.y) * speed * deltaTime;
        this.position.z += Math.sin(this.rotation.y) * speed * deltaTime;
        
        // التأكد من بقاء البوت داخل الخريطة
        this.position.x = Math.max(-GAME_CONFIG.MAP_SIZE/2, Math.min(GAME_CONFIG.MAP_SIZE/2, this.position.x));
        this.position.z = Math.max(-GAME_CONFIG.MAP_SIZE/2, Math.min(GAME_CONFIG.MAP_SIZE/2, this.position.z));
    }
    
    chase(target, deltaTime) {
        const dx = target.x - this.position.x;
        const dz = target.z - this.position.z;
        this.rotation.y = Math.atan2(dz, dx);
        
        const speed = 3 * this.config.botSpeed;
        this.position.x += Math.cos(this.rotation.y) * speed * deltaTime;
        this.position.z += Math.sin(this.rotation.y) * speed * deltaTime;
    }
    
    attack(target, deltaTime) {
        const dx = target.x - this.position.x;
        const dz = target.z - this.position.z;
        this.rotation.y = Math.atan2(dz, dx);
        
        if (this.reactionTime <= 0) {
            if (Math.random() < this.config.botAccuracy) {
                this.shoot();
            }
            this.reactionTime = this.config.botReaction;
        }
    }
    
    updateReaction(deltaTime) {
        if (this.reactionTime > 0) {
            this.reactionTime -= deltaTime;
        }
    }
    
    shoot() {
        // محاكاة إطلاق النار
        this.weapon.lastShot = gameTime;
        AudioSystem.play('shot', { volume: 0.7, pitch: 0.9 + Math.random() * 0.2 });
        
        // حساب إصابة اللاعب
        const distance = this.getDistance(player.position);
        if (distance < this.weapon.range && Math.random() < this.config.botAccuracy) {
            const damage = this.weapon.damage * (1 - distance / this.weapon.range);
            takeDamage(damage, this.name);
        }
    }
    
    takeDamage(amount) {
        const actualDamage = amount * (1 - this.armor / 100);
        this.health -= actualDamage;
        
        if (this.health <= 0) {
            this.die();
        } else {
            this.state = 'chasing';
        }
    }
    
    die() {
        playersRemaining--;
        gameStats.kills++;
        updatePlayersLeft();
        NotificationSystem.showKill(this.name);
        
        // تحديث الترتيب
        gameStats.rank = playersRemaining;
        
        // إسقاط بعض الغنائم
        // (سيتم تطويرها لاحقاً)
    }
    
    getDistance(position) {
        const dx = position.x - this.position.x;
        const dz = position.z - this.position.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
}

// ============================================
// نظام الأسلحة
// ============================================

const WeaponSystem = {
    weapons: {
        AKM: {
            name: 'AKM',
            damage: 47,
            fireRate: 0.1,
            range: 300,
            ammo: 30,
            reloadTime: 2.5,
            spread: 0.05,
            sound: 'shot'
        },
        M416: {
            name: 'M416',
            damage: 41,
            fireRate: 0.085,
            range: 350,
            ammo: 30,
            reloadTime: 2.1,
            spread: 0.03,
            sound: 'shot'
        },
        SCAR_L: {
            name: 'SCAR-L',
            damage: 43,
            fireRate: 0.096,
            range: 320,
            ammo: 30,
            reloadTime: 2.3,
            spread: 0.04,
            sound: 'shot'
        }
    },
    
    currentWeapon: null,
    isReloading: false,
    lastShot: 0,
    
    init() {
        this.currentWeapon = { ...this.weapons.AKM, currentAmmo: 30, totalAmmo: 120 };
        this.updateWeaponUI();
    },
    
    updateWeaponUI() {
        if (this.currentWeapon) {
            elements.currentWeapon.textContent = this.currentWeapon.name;
            elements.currentAmmo.textContent = this.currentWeapon.currentAmmo;
            elements.totalAmmo.textContent = this.currentWeapon.totalAmmo;
        }
    },
    
    shoot() {
        if (!this.currentWeapon || this.isReloading) return false;
        
        const now = gameTime;
        if (now - this.lastShot < this.currentWeapon.fireRate) return false;
        
        if (this.currentWeapon.currentAmmo <= 0) {
            AudioSystem.play('empty', { volume: 0.5 });
            this.reload();
            return false;
        }
        
        // خصم الرصاصة
        this.currentWeapon.currentAmmo--;
        this.lastShot = now;
        
        // تشغيل صوت إطلاق النار
        AudioSystem.play(this.currentWeapon.sound, { 
            volume: 0.8, 
            pitch: 0.95 + Math.random() * 0.1 
        });
        
        // تحديث دقة التصويب
        gameStats.accuracy.shots++;
        
        // حساب إصابة البوتات
        let hit = false;
        for (const bot of bots) {
            if (bot.health <= 0) continue;
            
            const distance = Math.sqrt(
                Math.pow(bot.position.x - player.position.x, 2) +
                Math.pow(bot.position.z - player.position.z, 2)
            );
            
            if (distance < this.currentWeapon.range) {
                // حساب الانتشار
                const spread = this.currentWeapon.spread * distance / 100;
                const hitChance = 1 - spread;
                
                if (Math.random() < hitChance) {
                    const damage = this.currentWeapon.damage * (1 - distance / this.currentWeapon.range);
                    bot.takeDamage(damage);
                    gameStats.accuracy.hits++;
                    gameStats.damageDealt += damage;
                    hit = true;
                    break; // رصاصة واحدة تصيب بوت واحد
                }
            }
        }
        
        this.updateWeaponUI();
        return hit;
    },
    
    reload() {
        if (this.isReloading || this.currentWeapon.totalAmmo <= 0) return;
        
        this.isReloading = true;
        AudioSystem.play('reload', { volume: 0.6 });
        
        setTimeout(() => {
            const needed = this.currentWeapon.ammo - this.currentWeapon.currentAmmo;
            const available = Math.min(needed, this.currentWeapon.totalAmmo);
            
            this.currentWeapon.currentAmmo += available;
            this.currentWeapon.totalAmmo -= available;
            this.isReloading = false;
            
            this.updateWeaponUI();
            NotificationSystem.show(`تم إعادة التعبئة (${available})`);
        }, this.currentWeapon.reloadTime * 1000);
    },
    
    switchWeapon(weaponName) {
        if (this.weapons[weaponName]) {
            this.currentWeapon = {
                ...this.weapons[weaponName],
                currentAmmo: this.weapons[weaponName].ammo,
                totalAmmo: 120
            };
            this.updateWeaponUI();
            NotificationSystem.show(`تم تغيير السلاح إلى ${weaponName}`);
        }
    }
};

// ============================================
// نظام الحركة والتحكم
// ============================================

const InputSystem = {
    keys: {},
    mouse: { x: 0, y: 0, dx: 0, dy: 0, isLocked: false },
    touch: { x: 0, y: 0, isActive: false },
    
    init() {
        // إعداد لوحة المفاتيح
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleKeyDown(e);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // إعداد الماوس
        elements.gameCanvas.addEventListener('mousedown', (e) => {
            if (currentState === GameState.PLAYING && !isPaused) {
                this.lockPointer();
                if (e.button === 0) { // زر الماوس الأيسر
                    WeaponSystem.shoot();
                }
            }
        });
        
        window.addEventListener('mousemove', (e) => {
            if (this.mouse.isLocked && currentState === GameState.PLAYING && !isPaused) {
                this.mouse.dx = e.movementX || 0;
                this.mouse.dy = e.movementY || 0;
                this.updateCameraRotation();
            }
        });
        
        window.addEventListener('click', () => {
            if (currentState === GameState.PLAYING && !this.mouse.isLocked) {
                this.lockPointer();
            }
        });
        
        // إعداد اللمس للهواتف
        this.setupTouchControls();
        
        // إعداد أزرار التحكم الافتراضية
        this.setupMobileButtons();
    },
    
    setupTouchControls() {
        isMobile = 'ontouchstart' in window;
        
        if (isMobile) {
            // جويستيك الحركة
            elements.joystickArea.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touch.isActive = true;
                const rect = elements.joystickArea.getBoundingClientRect();
                this.touch.x = e.touches[0].clientX - rect.left;
                this.touch.y = e.touches[0].clientY - rect.top;
                this.updateJoystick();
            });
            
            elements.joystickArea.addEventListener('touchmove', (e) => {
                if (!this.touch.isActive) return;
                e.preventDefault();
                const rect = elements.joystickArea.getBoundingClientRect();
                this.touch.x = e.touches[0].clientX - rect.left;
                this.touch.y = e.touches[0].clientY - rect.top;
                this.updateJoystick();
            });
            
            elements.joystickArea.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touch.isActive = false;
                this.touch.x = 0;
                this.touch.y = 0;
                this.updateJoystick();
            });
        }
    },
    
    setupMobileButtons() {
        // زر القفز
        elements.jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            player.isJumping = true;
            setTimeout(() => { player.isJumping = false; }, 300);
            AudioSystem.play('jump', { volume: 0.5 });
        });
        
        // زر الركوع
        elements.crouchBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            player.isCrouching = !player.isCrouching;
        });
        
        // زر إطلاق النار
        elements.shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            WeaponSystem.shoot();
        });
        
        // زر إعادة التعبئة
        elements.reloadBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            WeaponSystem.reload();
        });
        
        // زر التكبير
        elements.scopeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // سيتم تطويرها لاحقاً
        });
    },
    
    updateJoystick() {
        if (!this.touch.isActive) {
            elements.joystick.style.transform = 'translate(50%, -50%)';
            return;
        }
        
        const radius = 60;
        const center = 60;
        const dx = this.touch.x - center;
        const dy = this.touch.y - center;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        if (distance > radius) {
            this.touch.x = center + Math.cos(angle) * radius;
            this.touch.y = center + Math.sin(angle) * radius;
        }
        
        const joystickX = (this.touch.x - center) / 2;
        const joystickY = (this.touch.y - center) / 2;
        
        elements.joystick.style.transform = `translate(${50 + joystickX}%, ${-50 + joystickY}%)`;
        
        // تحديث حركة اللاعب
        player.velocity.x = Math.cos(angle - Math.PI/2) * (distance / radius);
        player.velocity.z = Math.sin(angle - Math.PI/2) * (distance / radius);
    },
    
    lockPointer() {
        if (currentState === GameState.PLAYING && !isPaused) {
            elements.gameCanvas.requestPointerLock =
                elements.gameCanvas.requestPointerLock ||
                elements.gameCanvas.mozRequestPointerLock;
            
            elements.gameCanvas.requestPointerLock();
            this.mouse.isLocked = true;
        }
    },
    
    unlockPointer() {
        document.exitPointerLock =
            document.exitPointerLock ||
            document.mozExitPointerLock;
        
        document.exitPointerLock();
        this.mouse.isLocked = false;
    },
    
    updateCameraRotation() {
        const sensitivity = gameSettings.mouseSensitivity * 0.001;
        const invert = gameSettings.invertMouse ? -1 : 1;
        
        player.rotation.y += this.mouse.dx * sensitivity;
        player.rotation.x += this.mouse.dy * sensitivity * invert;
        
        // تقييد حركة الكاميرا الرأسية
        player.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, player.rotation.x));
        
        this.mouse.dx = 0;
        this.mouse.dy = 0;
    },
    
    handleKeyDown(e) {
        if (currentState === GameState.PLAYING) {
            switch(e.key) {
                case ' ':
                    player.isJumping = true;
                    setTimeout(() => { player.isJumping = false; }, 300);
                    AudioSystem.play('jump', { volume: 0.5 });
                    break;
                    
                case 'r':
                    WeaponSystem.reload();
                    break;
                    
                case '1':
                    WeaponSystem.switchWeapon('AKM');
                    break;
                case '2':
                    WeaponSystem.switchWeapon('M416');
                    break;
                case '3':
                    WeaponSystem.switchWeapon('SCAR_L');
                    break;
                    
                case 'Escape':
                    togglePause();
                    break;
            }
        }
    },
    
    updatePlayerMovement(deltaTime) {
        const speed = gameSettings.movementSpeed * 2;
        const runMultiplier = this.keys['shift'] ? 1.5 : 1;
        const crouchMultiplier = player.isCrouching ? 0.5 : 1;
        const moveSpeed = speed * runMultiplier * crouchMultiplier * deltaTime;
        
        player.velocity.x = 0;
        player.velocity.z = 0;
        
        // حركة لوحة المفاتيح
        if (this.keys['w'] || this.keys['arrowup']) {
            player.velocity.x -= Math.sin(player.rotation.y) * moveSpeed;
            player.velocity.z -= Math.cos(player.rotation.y) * moveSpeed;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            player.velocity.x += Math.sin(player.rotation.y) * moveSpeed;
            player.velocity.z += Math.cos(player.rotation.y) * moveSpeed;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            player.velocity.x -= Math.cos(player.rotation.y) * moveSpeed;
            player.velocity.z += Math.sin(player.rotation.y) * moveSpeed;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            player.velocity.x += Math.cos(player.rotation.y) * moveSpeed;
            player.velocity.z -= Math.sin(player.rotation.y) * moveSpeed;
        }
        
        // تطبيق الجاذبية والقفز
        if (player.isJumping && player.position.y <= 1.5) {
            player.velocity.y = 5;
        }
        
        player.velocity.y -= 9.8 * deltaTime;
        player.position.y += player.velocity.y * deltaTime;
        
        if (player.position.y < 1.5) {
            player.position.y = 1.5;
            player.velocity.y = 0;
        }
        
        // تحديث موقع اللاعب مع تجنب العوائق
        const newX = player.position.x + player.velocity.x;
        const newZ = player.position.z + player.velocity.z;
        
        if (!checkCollision(newX, player.position.z)) {
            player.position.x = newX;
        }
        if (!checkCollision(player.position.x, newZ)) {
            player.position.z = newZ;
        }
        
        // التأكد من بقاء اللاعب داخل الخريطة
        const halfMap = GAME_CONFIG.MAP_SIZE / 2 - 10;
        player.position.x = Math.max(-halfMap, Math.min(halfMap, player.position.x));
        player.position.z = Math.max(-halfMap, Math.min(halfMap, player.position.z));
        
        // تحديث حالة الحركة
        player.isMoving = Math.abs(player.velocity.x) > 0 || Math.abs(player.velocity.z) > 0;
        player.isRunning = this.keys['shift'] && player.isMoving;
        
        // تشغيل صوت الخطوات
        if (player.isMoving && !player.isJumping) {
            if (Math.random() < 0.1) {
                AudioSystem.play('footstep', { volume: 0.3, pitch: 0.8 + Math.random() * 0.4 });
            }
        }
    }
};

// ============================================
// نظام الخريطة والزون
// ============================================

function generateMap() {
    map = [];
    
    // إنشاء عوائق عشوائية
    for (let i = 0; i < 50; i++) {
        const x = (Math.random() - 0.5) * GAME_CONFIG.MAP_SIZE;
        const z = (Math.random() - 0.5) * GAME_CONFIG.MAP_SIZE;
        const size = 5 + Math.random() * 10;
        
        map.push({
            type: 'obstacle',
            position: { x, y: 0, z },
            size: { width: size, height: 3, depth: size }
        });
    }
    
    // إنشاء مباني صغيرة
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * GAME_CONFIG.MAP_SIZE;
        const z = (Math.random() - 0.5) * GAME_CONFIG.MAP_SIZE;
        
        map.push({
            type: 'building',
            position: { x, y: 0, z },
            size: { width: 15, height: 8, depth: 15 },
            color: '#8B7355'
        });
    }
    
    // إنشاء أعشاب
    for (let i = 0; i < 200; i++) {
        const x = (Math.random() - 0.5) * GAME_CONFIG.MAP_SIZE;
        const z = (Math.random() - 0.5) * GAME_CONFIG.MAP_SIZE;
        
        map.push({
            type: 'grass',
            position: { x, y: 0, z },
            size: 0.5 + Math.random() * 1.5
        });
    }
}

function checkCollision(x, z) {
    // فحص التصادم مع العوائق
    for (const object of map) {
        if (object.type === 'obstacle' || object.type === 'building') {
            const dx = Math.abs(x - object.position.x);
            const dz = Math.abs(z - object.position.z);
            
            if (dx < object.size.width/2 + 1 && dz < object.size.depth/2 + 1) {
                return true;
            }
        }
    }
    return false;
}

function updateZone(deltaTime) {
    zoneTime -= deltaTime;
    
    if (zoneTime <= 0) {
        // تقلص الزون
        safeZone.radius = safeZone.nextRadius;
        safeZone.center = { ...safeZone.nextCenter };
        
        // تحديد منطقة آمنة جديدة
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * safeZone.radius * 0.5;
        safeZone.nextCenter = {
            x: safeZone.center.x + Math.cos(angle) * distance,
            z: safeZone.center.z + Math.sin(angle) * distance
        };
        safeZone.nextRadius = safeZone.radius * 0.7;
        
        zoneTime = GAME_CONFIG.ZONE_SHRINK_TIME * 0.8;
        safeZone.isShrinking = true;
        
        NotificationSystem.showZoneWarning();
        AudioSystem.play('zone', { volume: 0.6 });
        
        setTimeout(() => {
            safeZone.isShrinking = false;
        }, 5000);
    }
    
    // تحديث العداد
    const minutes = Math.floor(zoneTime / 60);
    const seconds = Math.floor(zoneTime % 60);
    elements.zoneTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // فحص إذا كان اللاعب خارج المنطقة الآمنة
    const dx = player.position.x - safeZone.center.x;
    const dz = player.position.z - safeZone.center.z;
    const distanceToCenter = Math.sqrt(dx * dx + dz * dz);
    
    if (distanceToCenter > safeZone.radius) {
        // ضرر خارج المنطقة
        const damage = 5 * deltaTime;
        takeDamage(damage, "المنطقة غير الآمنة");
    }
}

// ============================================
// نظام الصحة والضرر
// ============================================

function takeDamage(amount, source) {
    const actualDamage = amount * (1 - player.armor / 100);
    player.health -= actualDamage;
    
    NotificationSystem.showDamage(Math.round(actualDamage));
    
    if (player.health <= 0) {
        player.health = 0;
        endGame(false);
    }
    
    updateHealthUI();
}

function heal(amount) {
    player.health = Math.min(100, player.health + amount);
    updateHealthUI();
    AudioSystem.play('heal', { volume: 0.5 });
}

function updateHealthUI() {
    const healthPercent = player.health;
    elements.healthFill.style.width = `${healthPercent}%`;
    elements.healthText.textContent = Math.round(player.health);
    
    // تغيير لون شريط الصحة
    if (healthPercent > 50) {
        elements.healthFill.style.background = 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)';
    } else if (healthPercent > 25) {
        elements.healthFill.style.background = 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)';
    } else {
        elements.healthFill.style.background = '#ef4444';
    }
}

function updatePlayersLeft() {
    elements.playersLeft.textContent = playersRemaining;
}

// ============================================
// نظام الرسومات (WebGL مبسط)
// ============================================

const GraphicsSystem = {
    init() {
        canvas = elements.gameCanvas;
        ctx = canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // محاولة تهيئة WebGL
        try {
            gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                this.initWebGL();
            }
        } catch (e) {
            console.warn('WebGL غير مدعوم، سيتم استخدام Canvas 2D:', e);
        }
    },
    
    initWebGL() {
        // شادر بسيط
        const vsSource = `
            attribute vec3 aPosition;
            attribute vec3 aColor;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            varying vec3 vColor;
            
            void main() {
                gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
                vColor = aColor;
            }
        `;
        
        const fsSource = `
            precision mediump float;
            varying vec3 vColor;
            
            void main() {
                gl_FragColor = vec4(vColor, 1.0);
            }
        `;
        
        // إنشاء وتجميع الشادرات
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
        
        program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('خطأ في ربط البرنامج:', gl.getProgramInfoLog(program));
        }
        
        gl.useProgram(program);
    },
    
    compileShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('خطأ في تجميع الشادر:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    },
    
    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        if (ctx) {
            ctx.scale(dpr, dpr);
        }
    },
    
    render() {
        if (!ctx) return;
        
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        
        // مسح الخلفية
        ctx.fillStyle = '#1a3a1a';
        ctx.fillRect(0, 0, width, height);
        
        // رسم الأرض
        this.drawGround();
        
        // رسم العوائق
        this.drawObstacles();
        
        // رسم البوتات
        this.drawBots();
        
        // رسم اللاعب
        this.drawPlayer();
        
        // رسم الزون
        this.drawZone();
        
        // رسم السماء
        this.drawSky();
    },
    
    drawGround() {
        const ctx = this.get2DContext();
        const groundSize = GAME_CONFIG.MAP_SIZE;
        const scale = Math.min(canvas.width, canvas.height) / groundSize * 0.5;
        
        ctx.fillStyle = '#2d5a2d';
        ctx.fillRect(
            canvas.width/2 - groundSize * scale/2,
            canvas.height/2 - groundSize * scale/2,
            groundSize * scale,
            groundSize * scale
        );
        
        // شبكة الأرض
        ctx.strokeStyle = '#3a7a3a';
        ctx.lineWidth = 1;
        const gridSize = 100;
        
        for (let i = -groundSize/2; i <= groundSize/2; i += gridSize) {
            const x = canvas.width/2 + i * scale;
            ctx.beginPath();
            ctx.moveTo(x, canvas.height/2 - groundSize * scale/2);
            ctx.lineTo(x, canvas.height/2 + groundSize * scale/2);
            ctx.stroke();
            
            const y = canvas.height/2 + i * scale;
            ctx.beginPath();
            ctx.moveTo(canvas.width/2 - groundSize * scale/2, y);
            ctx.lineTo(canvas.width/2 + groundSize * scale/2, y);
            ctx.stroke();
        }
    },
    
    drawObstacles() {
        const ctx = this.get2DContext();
        const scale = Math.min(canvas.width, canvas.height) / GAME_CONFIG.MAP_SIZE * 0.5;
        
        for (const object of map) {
            const x = canvas.width/2 + object.position.x * scale;
            const y = canvas.height/2 + object.position.z * scale;
            
            switch(object.type) {
                case 'obstacle':
                    ctx.fillStyle = '#8B4513';
                    const size = object.size.width * scale;
                    ctx.fillRect(x - size/2, y - size/2, size, size);
                    break;
                    
                case 'building':
                    ctx.fillStyle = object.color || '#8B7355';
                    const width = object.size.width * scale;
                    const depth = object.size.depth * scale;
                    ctx.fillRect(x - width/2, y - depth/2, width, depth);
                    
                    // رسم النوافذ
                    ctx.fillStyle = '#87CEEB';
                    ctx.fillRect(x - width/3, y - depth/3, width/4, depth/4);
                    ctx.fillRect(x + width/6, y - depth/3, width/4, depth/4);
                    break;
                    
                case 'grass':
                    ctx.fillStyle = '#32CD32';
                    const grassSize = object.size * scale;
                    ctx.beginPath();
                    ctx.arc(x, y, grassSize, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
        }
    },
    
    drawBots() {
        const ctx = this.get2DContext();
        const scale = Math.min(canvas.width, canvas.height) / GAME_CONFIG.MAP_SIZE * 0.5;
        
        for (const bot of bots) {
            if (bot.health <= 0) continue;
            
            const x = canvas.width/2 + bot.position.x * scale;
            const y = canvas.height/2 + bot.position.z * scale;
            const size = 8 * (bot.health / 100);
            
            // جسم البوت
            ctx.fillStyle = bot.state === 'attacking' ? '#FF0000' : '#FF6B35';
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // اتجاه البوت
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(
                x + Math.cos(bot.rotation.y) * size * 1.5,
                y + Math.sin(bot.rotation.y) * size * 1.5
            );
            ctx.stroke();
            
            // شريط صحة البوت
            const healthBarWidth = 20;
            const healthBarHeight = 4;
            const healthPercent = bot.health / 100;
            
            ctx.fillStyle = '#000000';
            ctx.fillRect(x - healthBarWidth/2, y - size - 10, healthBarWidth, healthBarHeight);
            
            ctx.fillStyle = healthPercent > 0.5 ? '#10b981' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
            ctx.fillRect(x - healthBarWidth/2, y - size - 10, healthBarWidth * healthPercent, healthBarHeight);
        }
    },
    
    drawPlayer() {
        const ctx = this.get2DContext();
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // مؤشر اللاعب (في المنتصف)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // خط اتجاه اللاعب
        ctx.strokeStyle = '#FF4655';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.sin(player.rotation.y) * 30,
            centerY + Math.cos(player.rotation.y) * 30
        );
        ctx.stroke();
        
        // رسم اللاعب على الخريطة المصغرة
        const miniMap = document.querySelector('.mini-map');
        if (miniMap) {
            const miniCtx = miniMap.getContext('2d');
            if (miniCtx) {
                miniCtx.clearRect(0, 0, miniMap.width, miniMap.height);
                
                // خلفية الخريطة
                miniCtx.fillStyle = '#1a3a1a';
                miniCtx.fillRect(0, 0, miniMap.width, miniMap.height);
                
                // رسم اللاعب
                const playerX = miniMap.width / 2;
                const playerY = miniMap.height / 2;
                
                miniCtx.fillStyle = '#FF4655';
                miniCtx.beginPath();
                miniCtx.arc(playerX, playerY, 4, 0, Math.PI * 2);
                miniCtx.fill();
                
                // رسم البوتات على الخريطة
                const miniScale = miniMap.width / GAME_CONFIG.MAP_SIZE;
                for (const bot of bots) {
                    if (bot.health <= 0) continue;
                    
                    const botX = playerX + (bot.position.x - player.position.x) * miniScale;
                    const botY = playerY + (bot.position.z - player.position.z) * miniScale;
                    
                    if (botX >= 0 && botX <= miniMap.width && botY >= 0 && botY <= miniMap.height) {
                        miniCtx.fillStyle = bot.state === 'attacking' ? '#FF0000' : '#FF6B35';
                        miniCtx.beginPath();
                        miniCtx.arc(botX, botY, 3, 0, Math.PI * 2);
                        miniCtx.fill();
                    }
                }
                
                // رسم المنطقة الآمنة
                const zoneX = playerX + (safeZone.center.x - player.position.x) * miniScale;
                const zoneY = playerY + (safeZone.center.z - player.position.z) * miniScale;
                const zoneRadius = safeZone.radius * miniScale;
                
                miniCtx.strokeStyle = safeZone.isShrinking ? '#FFA500' : '#00FF00';
                miniCtx.lineWidth = 2;
                miniCtx.beginPath();
                miniCtx.arc(zoneX, zoneY, zoneRadius, 0, Math.PI * 2);
                miniCtx.stroke();
                
                // رسم المنطقة الآمنة القادمة
                const nextZoneX = playerX + (safeZone.nextCenter.x - player.position.x) * miniScale;
                const nextZoneY = playerY + (safeZone.nextCenter.z - player.position.z) * miniScale;
                const nextZoneRadius = safeZone.nextRadius * miniScale;
                
                miniCtx.strokeStyle = '#FFFF00';
                miniCtx.lineWidth = 1;
                miniCtx.setLineDash([5, 5]);
                miniCtx.beginPath();
                miniCtx.arc(nextZoneX, nextZoneY, nextZoneRadius, 0, Math.PI * 2);
                miniCtx.stroke();
                miniCtx.setLineDash([]);
            }
        }
    },
    
    drawZone() {
        const ctx = this.get2DContext();
        const scale = Math.min(canvas.width, canvas.height) / GAME_CONFIG.MAP_SIZE * 0.5;
        
        const zoneX = canvas.width/2 + safeZone.center.x * scale;
        const zoneY = canvas.height/2 + safeZone.center.z * scale;
        const zoneRadius = safeZone.radius * scale;
        
        // المنطقة الآمنة
        ctx.strokeStyle = safeZone.isShrinking ? 'rgba(255, 165, 0, 0.5)' : 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(zoneX, zoneY, zoneRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // المنطقة الآمنة القادمة
        const nextZoneX = canvas.width/2 + safeZone.nextCenter.x * scale;
        const nextZoneY = canvas.height/2 + safeZone.nextCenter.z * scale;
        const nextZoneRadius = safeZone.nextRadius * scale;
        
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(nextZoneX, nextZoneY, nextZoneRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    },
    
    drawSky() {
        const ctx = this.get2DContext();
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#1E3A8A');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    
    get2DContext() {
        return ctx;
    }
};

// ============================================
// إدارة حالة اللعبة
// ============================================

function showScreen(screenName) {
    // إخفاء جميع الشاشات
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // إظهار الشاشة المطلوبة
    if (elements[screenName]) {
        elements[screenName].classList.add('active');
    }
    
    // تحديث حالة اللعبة
    switch(screenName) {
        case 'mainMenu':
            currentState = GameState.MENU;
            InputSystem.unlockPointer();
            break;
        case 'gameScreen':
            currentState = GameState.PLAYING;
            if (!isPaused) {
                InputSystem.lockPointer();
            }
            break;
        case 'gameOverScreen':
            currentState = GameState.GAME_OVER;
            InputSystem.unlockPointer();
            break;
    }
}

function startGame() {
    // إعادة تعيين اللعبة
    resetGame();
    
    // إنشاء البوتات
    bots = [];
    for (let i = 1; i <= GAME_CONFIG.BOT_COUNT; i++) {
        bots.push(new Bot(i, gameDifficulty));
    }
    
    // تهيئة اللاعب
    player.position = { x: 0, y: 1.5, z: 0 };
    player.health = 100;
    player.armor = 0;
    
    // تهيئة الأسلحة
    WeaponSystem.init();
    
    // تحديث واجهة المستخدم
    updateHealthUI();
    updatePlayersLeft();
    
    // بدء اللعبة
    showScreen('gameScreen');
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    NotificationSystem.show('ابدأ المعركة! البقاء للأقوى');
}

function resetGame() {
    // إعادة تعيين جميع القيم
    gameTime = 0;
    zoneTime = GAME_CONFIG.ZONE_SHRINK_TIME;
    playersRemaining = GAME_CONFIG.MAX_PLAYERS;
    isPaused = false;
    
    gameStats = {
        kills: 0,
        damageDealt: 0,
        accuracy: { shots: 0, hits: 0 },
        survivalTime: 0,
        rank: GAME_CONFIG.MAX_PLAYERS
    };
    
    // توليد الخريطة
    generateMap();
    
    // إعادة تعيين المنطقة الآمنة
    safeZone = {
        center: { x: 0, z: 0 },
        radius: GAME_CONFIG.MAP_SIZE / 2,
        nextCenter: { x: 0, z: 0 },
        nextRadius: GAME_CONFIG.MAP_SIZE / 3,
        isShrinking: false
    };
    
    // إخفاء قائمة الإيقاف
    document.querySelector('.pause-menu').style.display = 'none';
}

function togglePause() {
    if (currentState !== GameState.PLAYING) return;
    
    isPaused = !isPaused;
    const pauseMenu = document.querySelector('.pause-menu');
    
    if (isPaused) {
        pauseMenu.style.display = 'block';
        InputSystem.unlockPointer();
    } else {
        pauseMenu.style.display = 'none';
        InputSystem.lockPointer();
    }
}

function endGame(isVictory) {
    currentState = GameState.GAME_OVER;
    
    // تحديث إحصائيات نهاية اللعبة
    const accuracy = gameStats.accuracy.shots > 0 ? 
        Math.round((gameStats.accuracy.hits / gameStats.accuracy.shots) * 100) : 0;
    
    elements.rank.textContent = `#${gameStats.rank}`;
    elements.kills.textContent = gameStats.kills;
    elements.time.textContent = formatTime(gameStats.survivalTime);
    elements.accuracy.textContent = `${accuracy}%`;
    
    if (isVictory) {
        elements.resultIcon.innerHTML = '<i class="fas fa-trophy"></i>';
        elements.resultTitle.textContent = 'لقد فزت!';
        elements.resultMessage.textContent = 'قمت بالقضاء على جميع الخصوم ونجوت';
        AudioSystem.play('victory', { volume: 0.7 });
    } else {
        elements.resultIcon.innerHTML = '<i class="fas fa-skull-crossbones"></i>';
        elements.resultTitle.textContent = 'لقد خسرت';
        elements.resultMessage.textContent = 'حاول مرة أخرى للفوز في المعركة';
        AudioSystem.play('defeat', { volume: 0.7 });
    }
    
    showScreen('gameOverScreen');
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// حلقة اللعبة الرئيسية
// ============================================

function gameLoop(currentTime) {
    if (currentState !== GameState.PLAYING) return;
    
    // حساب الوقت المنقضي
    deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // تقييد قيمة deltaTime
    if (deltaTime > 0.1) deltaTime = 0.1;
    
    if (!isPaused) {
        // تحديث الوقت
        gameTime += deltaTime;
        gameStats.survivalTime += deltaTime;
        
        // تحديث حركة اللاعب
        InputSystem.updatePlayerMovement(deltaTime);
        
        // تحديث البوتات
        for (const bot of bots) {
            bot.update(deltaTime, player.position);
        }
        
        // تحديث الزون
        updateZone(deltaTime);
        
        // التحقق من فوز اللاعب
        if (playersRemaining <= 1) {
            endGame(true);
            return;
        }
    }
    
    // عرض الرسومات
    GraphicsSystem.render();
    
    // الاستمرار في الحلقة
    requestAnimationFrame(gameLoop);
}

// ============================================
// إعدادات النظام
// ============================================

function loadSettings() {
    const savedSettings = localStorage.getItem('battleRoyaleSettings');
    if (savedSettings) {
        try {
            gameSettings = { ...gameSettings, ...JSON.parse(savedSettings) };
        } catch (e) {
            console.warn('خطأ في تحميل الإعدادات:', e);
        }
    }
    applySettings();
}

function saveSettings() {
    localStorage.setItem('battleRoyaleSettings', JSON.stringify(gameSettings));
    NotificationSystem.show('تم حفظ الإعدادات');
}

function applySettings() {
    // تطبيق إعدادات الصوت
    if (elements.masterVolume) {
        elements.masterVolume.value = gameSettings.masterVolume;
        elements.masterVolumeValue.textContent = `${gameSettings.masterVolume}%`;
    }
    if (elements.sfxVolume) {
        elements.sfxVolume.value = gameSettings.sfxVolume;
        elements.sfxVolumeValue.textContent = `${gameSettings.sfxVolume}%`;
    }
    if (elements.musicVolume) {
        elements.musicVolume.value = gameSettings.musicVolume;
        elements.musicVolumeValue.textContent = `${gameSettings.musicVolume}%`;
    }
    
    // تطبيق إعدادات الرسوميات
    if (elements.graphicsQuality) {
        elements.graphicsQuality.value = gameSettings.graphicsQuality;
    }
    if (elements.resolution) {
        elements.resolution.value = gameSettings.resolution;
    }
    if (elements.shadows) {
        elements.shadows.checked = gameSettings.shadows;
    }
    if (elements.particles) {
        elements.particles.checked = gameSettings.particles;
    }
    
    // تطبيق إعدادات التحكم
    if (elements.mouseSensitivity) {
        elements.mouseSensitivity.value = gameSettings.mouseSensitivity;
        elements.mouseSensitivityValue.textContent = gameSettings.mouseSensitivity;
    }
    if (elements.invertMouse) {
        elements.invertMouse.checked = gameSettings.invertMouse;
    }
    if (elements.movementSpeed) {
        elements.movementSpeed.value = gameSettings.movementSpeed;
        elements.movementSpeedValue.textContent = gameSettings.movementSpeed;
    }
}

// ============================================
// تهيئة اللعبة
// ============================================

function init() {
    console.log('🚀 تهيئة لعبة Battle Royale...');
    
    // تهيئة أنظمة اللعبة
    AudioSystem.init();
    InputSystem.init();
    GraphicsSystem.init();
    
    // تحميل الإعدادات
    loadSettings();
    
    // إعداد مستويات الصعوبة
    setupDifficultyOptions();
    
    // إعداد المستمعين للأحداث
    setupEventListeners();
    
    // محاكاة التحميل
    simulateLoading();
    
    // التحقق من اتجاه الشاشة للهواتف
    checkOrientation();
    
    console.log('✅ تم تهيئة اللعبة بنجاح');
}

function simulateLoading() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;
        
        elements.progressBar.style.width = `${progress}%`;
        elements.loadingPercentage.textContent = `${Math.round(progress)}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                showScreen('mainMenu');
                currentState = GameState.MENU;
                NotificationSystem.show('مرحباً بك في معركة البقاء!');
            }, 500);
        }
    }, 100);
}

function setupDifficultyOptions() {
    const difficultyOptions = document.querySelectorAll('.difficulty-option');
    
    difficultyOptions.forEach(option => {
        option.addEventListener('click', () => {
            difficultyOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            gameDifficulty = option.dataset.level;
            elements.currentDifficulty.textContent = option.querySelector('h3').textContent;
        });
    });
}

function setupEventListeners() {
    // أزرار القائمة الرئيسية
    elements.playBtn.addEventListener('click', () => {
        showScreen('difficultyMenu');
    });
    
    elements.settingsBtn.addEventListener('click', () => {
        showScreen('settingsScreen');
    });
    
    elements.difficultyBtn.addEventListener('click', () => {
        showScreen('difficultyMenu');
    });
    
    elements.controlsBtn.addEventListener('click', () => {
        // يمكن إضافة شاشة خاصة بأزرار التحكم
        NotificationSystem.show('راجع قسم "عن اللعبة" لمعرفة أزرار التحكم');
    });
    
    elements.aboutBtn.addEventListener('click', () => {
        showScreen('aboutScreen');
    });
    
    // أزرار شاشة الصعوبة
    elements.backFromDifficulty.addEventListener('click', () => {
        showScreen('mainMenu');
    });
    
    elements.confirmDifficulty.addEventListener('click', () => {
        startGame();
    });
    
    // أزرار شاشة الإعدادات
    elements.backFromSettings.addEventListener('click', () => {
        showScreen('mainMenu');
    });
    
    elements.saveSettings.addEventListener('click', () => {
        // تحديث الإعدادات من واجهة المستخدم
        gameSettings.graphicsQuality = elements.graphicsQuality.value;
        gameSettings.resolution = elements.resolution.value;
        gameSettings.shadows = elements.shadows.checked;
        gameSettings.particles = elements.particles.checked;
        gameSettings.masterVolume = parseInt(elements.masterVolume.value);
        gameSettings.sfxVolume = parseInt(elements.sfxVolume.value);
        gameSettings.musicVolume = parseInt(elements.musicVolume.value);
        gameSettings.mouseSensitivity = parseInt(elements.mouseSensitivity.value);
        gameSettings.invertMouse = elements.invertMouse.checked;
        gameSettings.movementSpeed = parseInt(elements.movementSpeed.value);
        
        saveSettings();
        showScreen('mainMenu');
    });
    
    // تحديث قيم الإعدادات أثناء التغيير
    if (elements.masterVolume) {
        elements.masterVolume.addEventListener('input', (e) => {
            elements.masterVolumeValue.textContent = `${e.target.value}%`;
        });
    }
    
    if (elements.sfxVolume) {
        elements.sfxVolume.addEventListener('input', (e) => {
            elements.sfxVolumeValue.textContent = `${e.target.value}%`;
        });
    }
    
    if (elements.musicVolume) {
        elements.musicVolume.addEventListener('input', (e) => {
            elements.musicVolumeValue.textContent = `${e.target.value}%`;
        });
    }
    
    if (elements.mouseSensitivity) {
        elements.mouseSensitivity.addEventListener('input', (e) => {
            elements.mouseSensitivityValue.textContent = e.target.value;
        });
    }
    
    if (elements.movementSpeed) {
        elements.movementSpeed.addEventListener('input', (e) => {
            elements.movementSpeedValue.textContent = e.target.value;
        });
    }
    
    // أزرار شاشة حول اللعبة
    elements.backFromAbout.addEventListener('click', () => {
        showScreen('mainMenu');
    });
    
    // أزرار قائمة الإيقاف
    elements.resumeBtn.addEventListener('click', togglePause);
    elements.restartBtn.addEventListener('click', () => {
        if (confirm('هل تريد إعادة تشغيل اللعبة؟')) {
            startGame();
        }
    });
    elements.settingsInGameBtn.addEventListener('click', () => {
        showScreen('settingsScreen');
    });
    elements.quitBtn.addEventListener('click', () => {
        if (confirm('هل تريد العودة إلى القائمة الرئيسية؟')) {
            showScreen('mainMenu');
        }
    });
    
    // أزرار شاشة نهاية اللعبة
    elements.playAgainBtn.addEventListener('click', () => {
        startGame();
    });
    
    elements.menuFromGameOverBtn.addEventListener('click', () => {
        showScreen('mainMenu');
    });
    
    elements.shareBtn.addEventListener('click', () => {
        const shareText = `لقد حصلت على المركز #${gameStats.rank} مع ${gameStats.kills} قتيل في معركة البقاء!`;
        if (navigator.share) {
            navigator.share({
                title: 'نتيجة معركة البقاء',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(shareText);
            NotificationSystem.show('تم نسخ النتيجة إلى الحافظة');
        }
    });
    
    // منع السلوك الافتراضي لأزرار التحكم
    window.addEventListener('keydown', (e) => {
        if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    });
}

function checkOrientation() {
    if (!isMobile) return;
    
    function updateOrientation() {
        if (window.innerHeight > window.innerWidth) {
            elements.rotateNotice.style.display = 'flex';
        } else {
            elements.rotateNotice.style.display = 'none';
        }
    }
    
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    updateOrientation();
}

// ============================================
// بدء تشغيل اللعبة
// ============================================

// انتظار تحميل الصفحة
window.addEventListener('DOMContentLoaded', init);

// تضمين جميع الدوال في النطاق العام للاختبار
window.takeDamage = takeDamage;
window.heal = heal;
window.togglePause = togglePause;
window.startGame = startGame;
window.showScreen = showScreen;