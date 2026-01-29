// ============================
// تهيئة اللعبة والمتغيرات الأساسية
// ============================

// الحالة العامة للعبة
const gameState = {
    isPlaying: false,
    isPaused: false,
    gameStarted: false,
    gameOver: false,
    difficulty: 'medium',
    score: 0,
    kills: 0,
    startTime: 0,
    playerHealth: 100,
    zoneTimer: 150, // 2:30 دقيقة بالثواني
    playersAlive: 16,
    weapons: ['AK-47', 'M416', 'Kar98k', 'UMP45', 'S686'],
    currentWeapon: 0
};

// عناصر DOM
const elements = {
    loadingScreen: document.getElementById('loadingScreen'),
    startScreen: document.getElementById('startScreen'),
    gameContainer: document.getElementById('gameContainer'),
    endScreen: document.getElementById('endScreen'),
    startBtn: document.getElementById('startBtn'),
    restartBtn: document.getElementById('restartBtn'),
    difficultySelect: document.getElementById('difficulty'),
    healthFill: document.getElementById('healthFill'),
    healthText: document.getElementById('healthText'),
    zoneTimer: document.getElementById('zoneTimer'),
    playersLeft: document.getElementById('playersLeft'),
    weaponIcon: document.getElementById('weaponIcon'),
    weaponName: document.getElementById('weaponName'),
    ammoCount: document.getElementById('ammoCount'),
    scoreValue: document.getElementById('scoreValue'),
    killList: document.getElementById('killList'),
    endTitle: document.getElementById('endTitle'),
    endMessage: document.getElementById('endMessage'),
    killsStat: document.getElementById('killsStat'),
    timeStat: document.getElementById('timeStat'),
    scoreStat: document.getElementById('scoreStat'),
    gameCanvas: document.getElementById('gameCanvas'),
    mapCanvas: document.getElementById('mapCanvas')
};

// ============================
// تهيئة اللعبة ثلاثية الأبعاد
// ============================

let scene, camera, renderer, controls;
let player, bots = [];
let mapSize = 1000;
let zoneRadius = 500;
let zoneCenter = { x: 0, z: 0 };

function initGame() {
    // تهيئة Three.js Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 500, 1000);
    
    // الكاميرا
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 10, 20);
    
    // ال Renderer
    renderer = new THREE.WebGLRenderer({ canvas: elements.gameCanvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // الإضاءة
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
    
    // إنشاء الأرض
    createGround();
    
    // إنشاء البيئة
    createEnvironment();
    
    // إنشاء اللاعب
    createPlayer();
    
    // إنشاء البوتات
    createBots();
    
    // بدء دورة اللعبة
    animate();
    
    // إخفاء شاشة التحميل
    setTimeout(() => {
        elements.loadingScreen.style.display = 'none';
    }, 1500);
}

// إنشاء الأرض
function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(mapSize, mapSize, 100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x3a7c3a,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // إضافة نسيج عشبي
    const grassGeometry = new THREE.PlaneGeometry(mapSize, mapSize, 200, 200);
    const grassMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x4a9c4a,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = 0.1;
    scene.add(grass);
}

// إنشاء البيئة (جدران، بيوت، عوائق)
function createEnvironment() {
    const wallHeight = 10;
    const wallThickness = 2;
    
    // إنشاء جدران حول الخريطة
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    
    // الجدار الشمالي
    const northWall = new THREE.Mesh(
        new THREE.BoxGeometry(mapSize, wallHeight, wallThickness),
        wallMaterial
    );
    northWall.position.set(0, wallHeight/2, -mapSize/2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);
    
    // الجدار الجنوبي
    const southWall = new THREE.Mesh(
        new THREE.BoxGeometry(mapSize, wallHeight, wallThickness),
        wallMaterial
    );
    southWall.position.set(0, wallHeight/2, mapSize/2);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);
    
    // الجدار الشرقي
    const eastWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, mapSize),
        wallMaterial
    );
    eastWall.position.set(mapSize/2, wallHeight/2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);
    
    // الجدار الغربي
    const westWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, mapSize),
        wallMaterial
    );
    westWall.position.set(-mapSize/2, wallHeight/2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);
    
    // إنشاء بيوت عشوائية
    const houseMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    
    for (let i = 0; i < 10; i++) {
        const houseWidth = 15 + Math.random() * 20;
        const houseDepth = 15 + Math.random() * 20;
        const houseHeight = 8 + Math.random() * 10;
        
        const house = new THREE.Mesh(
            new THREE.BoxGeometry(houseWidth, houseHeight, houseDepth),
            houseMaterial
        );
        
        const x = (Math.random() - 0.5) * (mapSize - 100);
        const z = (Math.random() - 0.5) * (mapSize - 100);
        house.position.set(x, houseHeight/2, z);
        house.castShadow = true;
        house.receiveShadow = true;
        scene.add(house);
        
        // السقف
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(houseWidth/1.5, 5, 4),
            roofMaterial
        );
        roof.position.set(x, houseHeight + 2.5, z);
        roof.rotation.y = Math.PI/4;
        roof.castShadow = true;
        scene.add(roof);
    }
    
    // عوائق متنوعة (صناديق، براميل)
    const obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    
    for (let i = 0; i < 30; i++) {
        const obstacleType = Math.random() > 0.5 ? 'box' : 'cylinder';
        let obstacle;
        
        if (obstacleType === 'box') {
            const size = 2 + Math.random() * 3;
            obstacle = new THREE.Mesh(
                new THREE.BoxGeometry(size, size, size),
                obstacleMaterial
            );
        } else {
            const radius = 1 + Math.random() * 2;
            const height = 3 + Math.random() * 4;
            obstacle = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, height, 8),
                obstacleMaterial
            );
        }
        
        const x = (Math.random() - 0.5) * (mapSize - 50);
        const z = (Math.random() - 0.5) * (mapSize - 50);
        obstacle.position.set(x, obstacle.geometry.parameters.height/2, z);
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        scene.add(obstacle);
    }
}

// إنشاء اللاعب
function createPlayer() {
    const playerGeometry = new THREE.CapsuleGeometry(1, 3, 4, 8);
    const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff88 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 2, 0);
    player.castShadow = true;
    scene.add(player);
    
    // مؤشر اللاعب
    const playerIndicator = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 2, 4),
        new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    );
    playerIndicator.position.set(0, 5, 0);
    player.add(playerIndicator);
}

// إنشاء البوتات
function createBots() {
    const botMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 });
    
    for (let i = 0; i < 15; i++) {
        const botGeometry = new THREE.CapsuleGeometry(1, 3, 4, 8);
        const bot = new THREE.Mesh(botGeometry, botMaterial);
        
        // وضع عشوائي للبوتات
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 300;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        bot.position.set(x, 2, z);
        bot.castShadow = true;
        scene.add(bot);
        
        // مؤشر البوت
        const botIndicator = new THREE.Mesh(
            new THREE.ConeGeometry(0.5, 2, 4),
            new THREE.MeshBasicMaterial({ color: 0xff4444 })
        );
        botIndicator.position.set(0, 5, 0);
        bot.add(botIndicator);
        
        bots.push({
            mesh: bot,
            health: 100,
            speed: 0.5 + Math.random() * 1,
            state: 'wandering', // wandering, chasing, attacking, fleeing
            targetPosition: null,
            lastShot: 0
        });
    }
}

// ============================
// نظام التحكم
// ============================

const keys = {};
const mouse = { x: 0, y: 0, isDown: false };

// إدارة إدخال لوحة المفاتيح
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // إيقاف اللعبة مؤقتًا بالزر ESC
    if (e.key === 'Escape' && gameState.isPlaying) {
        togglePause();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// إدارة الماوس
elements.gameCanvas.addEventListener('mousedown', (e) => {
    if (!gameState.isPlaying || gameState.isPaused) return;
    mouse.isDown = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    
    // إطلاق النار عند النقر الأيسر
    if (e.button === 0) {
        shoot();
    }
});

elements.gameCanvas.addEventListener('mousemove', (e) => {
    if (!mouse.isDown || !gameState.isPlaying || gameState.isPaused) return;
    
    const deltaX = e.clientX - mouse.x;
    const deltaY = e.clientY - mouse.y;
    
    // تدوير الكاميرا
    camera.rotation.y -= deltaX * 0.01;
    camera.rotation.x -= deltaY * 0.01;
    camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
    
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

elements.gameCanvas.addEventListener('mouseup', () => {
    mouse.isDown = false;
});

// التحكم باللمس للجوال
let movementTouchId = null;
let cameraTouchId = null;

elements.gameCanvas.addEventListener('touchstart', (e) => {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    for (let touch of e.touches) {
        const rect = elements.gameCanvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // تحديد إذا كانت اللمسة في منطقة حركة أو كاميرا
        if (x < window.innerWidth / 2) {
            movementTouchId = touch.identifier;
        } else {
            cameraTouchId = touch.identifier;
            mouse.x = touch.clientX;
            mouse.y = touch.clientY;
            mouse.isDown = true;
        }
    }
    
    e.preventDefault();
});

elements.gameCanvas.addEventListener('touchmove', (e) => {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    for (let touch of e.touches) {
        if (touch.identifier === cameraTouchId) {
            const deltaX = touch.clientX - mouse.x;
            const deltaY = touch.clientY - mouse.y;
            
            camera.rotation.y -= deltaX * 0.01;
            camera.rotation.x -= deltaY * 0.01;
            camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
            
            mouse.x = touch.clientX;
            mouse.y = touch.clientY;
        }
    }
    
    e.preventDefault();
});

elements.gameCanvas.addEventListener('touchend', (e) => {
    for (let touch of e.changedTouches) {
        if (touch.identifier === movementTouchId) {
            movementTouchId = null;
        }
        if (touch.identifier === cameraTouchId) {
            cameraTouchId = null;
            mouse.isDown = false;
        }
    }
});

// ============================
// نظام اللعبة الأساسي
// ============================

function updateGame() {
    if (!gameState.isPlaying || gameState.isPaused || gameState.gameOver) return;
    
    // تحديث حركة اللاعب
    updatePlayerMovement();
    
    // تحديث البوتات
    updateBots();
    
    // تحديث الزون
    updateZone();
    
    // تحديث واجهة المستخدم
    updateUI();
    
    // التحقق من فوز/خسارة اللاعب
    checkGameEnd();
}

// حركة اللاعب
function updatePlayerMovement() {
    const moveSpeed = 0.2;
    const rotationSpeed = 0.05;
    
    // الحركة بناءً على إدخال المستخدم
    let moveX = 0;
    let moveZ = 0;
    
    if (keys['w'] || keys['arrowup']) moveZ -= moveSpeed;
    if (keys['s'] || keys['arrowdown']) moveZ += moveSpeed;
    if (keys['a'] || keys['arrowleft']) moveX -= moveSpeed;
    if (keys['d'] || keys['arrowright']) moveX += moveSpeed;
    
    // تطبيق الحركة
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    
    forward.multiplyScalar(moveZ);
    right.multiplyScalar(moveX);
    
    player.position.add(forward);
    player.position.add(right);
    
    // التأكد من بقاء اللاعب داخل الحدود
    player.position.x = Math.max(-mapSize/2 + 10, Math.min(mapSize/2 - 10, player.position.x));
    player.position.z = Math.max(-mapSize/2 + 10, Math.min(mapSize/2 - 10, player.position.z));
    
    // تحديث موضع الكاميرا لتبع اللاعب
    camera.position.x = player.position.x;
    camera.position.z = player.position.z;
    camera.position.y = player.position.y + 5;
}

// تحديث البوتات
function updateBots() {
    const now = Date.now();
    
    bots.forEach((bot, index) => {
        if (bot.health <= 0) return;
        
        // حساب المسافة إلى اللاعب
        const distanceToPlayer = player.position.distanceTo(bot.mesh.position);
        
        // تحديث حالة البوت بناءً على المسافة
        if (distanceToPlayer < 50) {
            bot.state = 'chasing';
            bot.targetPosition = player.position.clone();
            
            // إذا كان قريبًا بما يكفي للهجوم
            if (distanceToPlayer < 20 && now - bot.lastShot > 1000) {
                bot.state = 'attacking';
                attackPlayer(bot);
                bot.lastShot = now;
            }
        } else if (bot.state === 'chasing' && distanceToPlayer > 70) {
            bot.state = 'wandering';
            bot.targetPosition = null;
        }
        
        // تحريك البوت
        if (bot.state === 'wandering') {
            // حركة عشوائية
            if (!bot.targetPosition || bot.mesh.position.distanceTo(bot.targetPosition) < 5) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 10 + Math.random() * 30;
                bot.targetPosition = new THREE.Vector3(
                    Math.cos(angle) * distance + bot.mesh.position.x,
                    2,
                    Math.sin(angle) * distance + bot.mesh.position.z
                );
            }
        }
        
        if (bot.targetPosition) {
            // التحرك نحو الهدف
            const direction = new THREE.Vector3()
                .subVectors(bot.targetPosition, bot.mesh.position)
                .normalize()
                .multiplyScalar(bot.speed * 0.1);
            
            bot.mesh.position.add(direction);
            
            // تدوير البوت ليواجه اتجاه الحركة
            if (direction.length() > 0.01) {
                bot.mesh.lookAt(bot.mesh.position.clone().add(direction));
            }
        }
        
        // التأكد من بقاء البوت داخل الحدود
        bot.mesh.position.x = Math.max(-mapSize/2 + 10, Math.min(mapSize/2 - 10, bot.mesh.position.x));
        bot.mesh.position.z = Math.max(-mapSize/2 + 10, Math.min(mapSize/2 - 10, bot.mesh.position.z));
        
        // التحقق من خروج البوت من الزون
        const distanceToZoneCenter = bot.mesh.position.distanceTo(new THREE.Vector3(zoneCenter.x, 2, zoneCenter.z));
        if (distanceToZoneCenter > zoneRadius) {
            // البوت يخرج من الزون ويتلقى ضررًا
            bot.health -= 5;
            if (bot.health <= 0) {
                botDie(index);
            }
        }
    });
}

// هجوم البوت على اللاعب
function attackPlayer(bot) {
    const distance = player.position.distanceTo(bot.mesh.position);
    const accuracy = Math.max(0.1, 1 - (distance / 100));
    
    if (Math.random() < accuracy * 0.8) {
        // البوت يصيب اللاعب
        const damage = 10 + Math.random() * 20;
        gameState.playerHealth -= damage;
        
        // تحديث شريط الصحة
        updateHealthBar();
        
        // إضافة حدث إلى قائمة الأحداث
        addKillFeed(`بوت أطلق النار عليك (-${Math.round(damage)} صحة)`);
        
        // اهتزاز الكاميرا للإحساس بالضربة
        cameraShake(0.5);
        
        // التحقق من موت اللاعب
        if (gameState.playerHealth <= 0) {
            gameOver(false);
        }
    } else {
        // البوت يخطئ
        addKillFeed('بوت أطلق النار وأخطأ');
    }
}

// موت البوت
function botDie(index) {
    const bot = bots[index];
    
    // إزالة البوت من المشهد
    scene.remove(bot.mesh);
    
    // تحديث عدد اللاعبين الأحياء
    gameState.playersAlive--;
    gameState.kills++;
    gameState.score += 100;
    
    // إضافة حدث
    addKillFeed(`قمت بتصفية بوت! (+100 نقطة)`);
    
    // تحديث القائمة
    bots.splice(index, 1);
}

// تحديث الزون
function updateZone() {
    gameState.zoneTimer--;
    
    if (gameState.zoneTimer <= 0) {
        // تضييق الزون
        zoneRadius = Math.max(100, zoneRadius - 50);
        gameState.zoneTimer = 60; // إعادة ضبط المؤقت لدقيقة واحدة
        
        // إضافة حدث
        addKillFeed('الزون يتقلص! أسرع إلى المنطقة الآمنة');
        
        // ضرر للاعبين خارج الزون
        const distanceToZoneCenter = player.position.distanceTo(new THREE.Vector3(zoneCenter.x, 2, zoneCenter.z));
        if (distanceToZoneCenter > zoneRadius) {
            gameState.playerHealth -= 20;
            updateHealthBar();
            addKillFeed('أنت خارج المنطقة الآمنة! (-20 صحة)');
            
            if (gameState.playerHealth <= 0) {
                gameOver(false);
            }
        }
    }
    
    // تحديث عرض الزون
    const minutes = Math.floor(gameState.zoneTimer / 60);
    const seconds = gameState.zoneTimer % 60;
    elements.zoneTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// إطلاق النار
function shoot() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    // التحقق من وجود هدف (بوت)
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(mouseVector, camera);
    
    const intersects = raycaster.intersectObjects(bots.map(bot => bot.mesh));
    
    if (intersects.length > 0) {
        const botMesh = intersects[0].object;
        const botIndex = bots.findIndex(bot => bot.mesh === botMesh);
        
        if (botIndex !== -1 && bots[botIndex].health > 0) {
            // إصابة البوت
            const damage = 25 + Math.random() * 50;
            bots[botIndex].health -= damage;
            
            // اهتزاز الكاميرا
            cameraShake(0.3);
            
            // تحديث النقاط
            if (bots[botIndex].health <= 0) {
                botDie(botIndex);
            } else {
                addKillFeed(`أصبت بوت (-${Math.round(damage)} صحة)`);
                gameState.score += 25;
            }
        }
    } else {
        // إطلاق نار دون إصابة
        addKillFeed('أطلقت النار');
    }
    
    // تحديث واجهة المستخدم
    updateUI();
}

// اهتزاز الكاميرا
function cameraShake(intensity) {
    const originalPosition = camera.position.clone();
    
    let shakeCount = 0;
    const maxShakes = 10;
    
    function shake() {
        if (shakeCount >= maxShakes) {
            camera.position.copy(originalPosition);
            return;
        }
        
        camera.position.x = originalPosition.x + (Math.random() - 0.5) * intensity;
        camera.position.y = originalPosition.y + (Math.random() - 0.5) * intensity;
        camera.position.z = originalPosition.z + (Math.random() - 0.5) * intensity;
        
        shakeCount++;
        setTimeout(shake, 50);
    }
    
    shake();
}

// ============================
// واجهة المستخدم
// ============================

function updateUI() {
    // تحديث الصحة
    updateHealthBar();
    
    // تحديث عدد اللاعبين الباقين
    elements.playersLeft.textContent = gameState.playersAlive.toString();
    
    // تحديث النقاط
    elements.scoreValue.textContent = gameState.score.toString();
    
    // تحديث السلاح
    elements.weaponName.textContent = gameState.weapons[gameState.currentWeapon];
    const ammo = gameState.currentWeapon === 2 ? '5/20' : '30/120'; // Kar98k له ذخيرة أقل
    elements.ammoCount.textContent = ammo;
}

function updateHealthBar() {
    const healthPercent = Math.max(0, gameState.playerHealth);
    elements.healthFill.style.width = `${healthPercent}%`;
    elements.healthText.textContent = `${Math.round(healthPercent)}%`;
    
    // تغيير لون شريط الصحة حسب النسبة
    if (healthPercent > 60) {
        elements.healthFill.style.background = 'linear-gradient(90deg, #00ff88, #00cc6a)';
    } else if (healthPercent > 30) {
        elements.healthFill.style.background = 'linear-gradient(90deg, #ffaa00, #ff8800)';
    } else {
        elements.healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff4400)';
    }
}

function addKillFeed(message) {
    const li = document.createElement('li');
    li.textContent = message;
    elements.killList.prepend(li);
    
    // حفظ آخر 10 أحداث فقط
    while (elements.killList.children.length > 10) {
        elements.killList.removeChild(elements.killList.lastChild);
    }
}

// ============================
// بداية ونهاية اللعبة
// ============================

function startGame() {
    gameState.isPlaying = true;
    gameState.gameStarted = true;
    gameState.difficulty = elements.difficultySelect.value;
    gameState.startTime = Date.now();
    
    // إخفاء شاشة البداية وإظهار اللعبة
    elements.startScreen.classList.add('hidden');
    elements.gameContainer.classList.remove('hidden');
    
    // تدوير الجهاز تلقائياً (لمستخدمي الجوال)
    if (window.screen.orientation && window.screen.orientation.lock) {
        window.screen.orientation.lock('landscape').catch(() => {
            console.log('لم يتمكن من قفل اتجاه الشاشة');
        });
    }
    
    // بدء تحديث اللعبة
    gameLoop();
}

function gameOver(isWinner) {
    gameState.isPlaying = false;
    gameState.gameOver = true;
    
    // حساب الوقت المستغرق
    const timeElapsed = Date.now() - gameState.startTime;
    const minutes = Math.floor(timeElapsed / 60000);
    const seconds = Math.floor((timeElapsed % 60000) / 1000);
    
    // تحديث شاشة النهاية
    if (isWinner) {
        elements.endTitle.textContent = '🎉 فزت باللعبة! 🎉';
        elements.endMessage.textContent = 'أنت آخر من بقي على قيد الحياة!';
        gameState.score += 500; // مكافأة الفوز
    } else {
        elements.endTitle.textContent = '💀 لقد خسرت 💀';
        elements.endMessage.textContent = 'حاول مرة أخرى للفوز!';
    }
    
    elements.killsStat.textContent = gameState.kills.toString();
    elements.timeStat.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    elements.scoreStat.textContent = gameState.score.toString();
    
    // إخفاء اللعبة وإظهار شاشة النهاية
    elements.gameContainer.classList.add('hidden');
    elements.endScreen.classList.remove('hidden');
}

function checkGameEnd() {
    // الفوز: القضاء على جميع البوتات
    if (bots.length === 0 && gameState.playerHealth > 0) {
        gameOver(true);
        return;
    }
    
    // الخسارة: موت اللاعب
    if (gameState.playerHealth <= 0) {
        gameOver(false);
        return;
    }
    
    // الخسارة: خروج جميع اللاعبين
    if (gameState.playersAlive <= 1 && gameState.playerHealth > 0) {
        gameOver(true);
        return;
    }
}

function resetGame() {
    // إعادة تعيين حالة اللعبة
    gameState.isPlaying = false;
    gameState.gameStarted = false;
    gameState.gameOver = false;
    gameState.score = 0;
    gameState.kills = 0;
    gameState.playerHealth = 100;
    gameState.zoneTimer = 150;
    gameState.playersAlive = 16;
    gameState.currentWeapon = 0;
    
    // مسح المشهد
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    
    // إعادة تهيئة البوتات
    bots = [];
    
    // إعادة تهيئة قائمة الأحداث
    elements.killList.innerHTML = '';
    
    // إخفاء شاشة النهاية وإظهار شاشة البداية
    elements.endScreen.classList.add('hidden');
    elements.startScreen.classList.remove('hidden');
    
    // إعادة تهيئة اللعبة
    initGame();
}

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        addKillFeed('اللعبة متوقفة مؤقتاً');
    } else {
        addKillFeed('استئناف اللعبة');
    }
}

// ============================
// دورة اللعبة
// ============================

function gameLoop() {
    if (!gameState.isPlaying || gameState.gameOver) return;
    
    updateGame();
    requestAnimationFrame(gameLoop);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// ============================
// مستمعي الأحداث
// ============================

// زر البداية
elements.startBtn.addEventListener('click', startGame);

// زر إعادة التشغيل
elements.restartBtn.addEventListener('click', resetGame);

// أزرار التحكم (الجوال)
document.getElementById('jumpBtn').addEventListener('click', () => {
    if (gameState.isPlaying && !gameState.isPaused) {
        player.position.y += 5;
        setTimeout(() => {
            player.position.y = Math.max(2, player.position.y - 5);
        }, 300);
        addKillFeed('قفزة');
    }
});

document.getElementById('crouchBtn').addEventListener('click', () => {
    if (gameState.isPlaying && !gameState.isPaused) {
        addKillFeed('انحناء');
    }
});

document.getElementById('reloadBtn').addEventListener('click', () => {
    if (gameState.isPlaying && !gameState.isPaused) {
        addKillFeed('إعادة تعبئة الذخيرة');
    }
});

document.getElementById('healBtn').addEventListener('click', () => {
    if (gameState.isPlaying && !gameState.isPaused && gameState.playerHealth < 100) {
        gameState.playerHealth = Math.min(100, gameState.playerHealth + 30);
        updateHealthBar();
        addKillFeed('استخدمت علاج (+30 صحة)');
    }
});

// تغيير حجم النافذة
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================
// بدء التحميل
// ============================

// بدء اللعبة عند تحميل الصفحة
window.addEventListener('load', () => {
    initGame();
    
    // محاكاة التحميل
    setTimeout(() => {
        elements.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            elements.loadingScreen.style.display = 'none';
        }, 1000);
    }, 2000);
});