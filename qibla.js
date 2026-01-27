// Qibla Compass System

class QiblaManager {
    constructor() {
        this.currentHeading = 0;
        this.qiblaDirection = 0;
        this.isCalibrating = false;
        this.calibrationCount = 0;
        this.userLocation = null;
        this.isCompassAvailable = false;
        this.animationFrame = null;
        this.settings = {
            showDegrees: true,
            showCardinal: true,
            vibration: true,
            sound: true,
            calibration: true,
            theme: 'light',
            accuracy: 'high'
        };
        this.init();
    }

    async init() {
        // Load settings
        await this.loadSettings();
        
        // Get user location
        await this.getUserLocation();
        
        // Calculate Qibla direction
        this.calculateQibla();
        
        // Check compass availability
        await this.checkCompassAvailability();
        
        // Initialize UI
        this.initUI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start compass if available
        if (this.isCompassAvailable) {
            this.startCompass();
        }
    }

    async loadSettings() {
        const savedSettings = Utils.getLocalStorage('qiblaSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };
        }
    }

    async getUserLocation() {
        return new Promise((resolve, reject) => {
            // Try to get from localStorage first
            const savedLocation = Utils.getLocalStorage('userLocation');
            if (savedLocation) {
                this.userLocation = savedLocation;
                resolve(this.userLocation);
                return;
            }
            
            // Try geolocation
            if (!navigator.geolocation) {
                this.userLocation = {
                    latitude: 21.4225, // Mecca coordinates
                    longitude: 39.8262,
                    city: 'مكة المكرمة',
                    country: 'السعودية',
                    accuracy: 0
                };
                resolve(this.userLocation);
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    };
                    
                    // Save to localStorage
                    Utils.setLocalStorage('userLocation', this.userLocation);
                    
                    resolve(this.userLocation);
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    // Use Mecca as default
                    this.userLocation = {
                        latitude: 21.4225,
                        longitude: 39.8262,
                        city: 'مكة المكرمة',
                        country: 'السعودية',
                        accuracy: 0
                    };
                    resolve(this.userLocation);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    calculateQibla() {
        if (!this.userLocation) return;
        
        const { latitude, longitude } = this.userLocation;
        
        // Mecca coordinates
        const meccaLat = 21.4225;
        const meccaLon = 39.8262;
        
        // Convert to radians
        const phiK = this.degToRad(meccaLat);
        const lambdaK = this.degToRad(meccaLon);
        const phi = this.degToRad(latitude);
        const lambda = this.degToRad(longitude);
        
        // Calculate Qibla direction
        const numerator = Math.sin(lambdaK - lambda);
        const denominator = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
        
        let qibla = Math.atan2(numerator, denominator);
        qibla = this.radToDeg(qibla);
        
        // Normalize to 0-360
        qibla = (qibla + 360) % 360;
        
        this.qiblaDirection = qibla;
        
        return qibla;
    }

    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    radToDeg(radians) {
        return radians * (180 / Math.PI);
    }

    async checkCompassAvailability() {
        if ('DeviceOrientationEvent' in window && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ devices
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                this.isCompassAvailable = permission === 'granted';
            } catch (error) {
                console.error('Compass permission error:', error);
                this.isCompassAvailable = false;
            }
        } else if ('ondeviceorientationabsolute' in window) {
            // Android and other devices
            this.isCompassAvailable = true;
        } else {
            this.isCompassAvailable = false;
        }
        
        return this.isCompassAvailable;
    }

    initUI() {
        const qiblaSection = document.getElementById('qibla-section');
        if (!qiblaSection) return;
        
        qiblaSection.innerHTML = '';
        
        // Main container
        const container = Utils.createElement('div', {
            className: 'qibla-container',
            style: {
                maxWidth: '600px',
                margin: '0 auto',
                padding: '1rem',
                textAlign: 'center'
            }
        });
        
        // Header
        const header = this.createHeader();
        container.appendChild(header);
        
        // Compass container
        const compassContainer = this.createCompassContainer();
        container.appendChild(compassContainer);
        
        // Information panel
        const infoPanel = this.createInfoPanel();
        container.appendChild(infoPanel);
        
        // Controls
        const controls = this.createControls();
        container.appendChild(controls);
        
        qiblaSection.appendChild(container);
    }

    createHeader() {
        const header = Utils.createElement('div', {
            className: 'qibla-header',
            style: {
                marginBottom: '1.5rem'
            }
        });
        
        const title = Utils.createElement('h2', {
            className: 'qibla-title',
            style: {
                color: 'var(--primary-color)',
                marginBottom: '0.5rem'
            }
        }, 'بوصلة القبلة');
        
        const subtitle = Utils.createElement('p', {
            className: 'qibla-subtitle',
            style: {
                color: 'var(--text-light)',
                fontSize: '0.9rem'
            }
        }, 'ابحث عن اتجاه القبلة بدقة عالية');
        
        header.appendChild(title);
        header.appendChild(subtitle);
        
        return header;
    }

    createCompassContainer() {
        const container = Utils.createElement('div', {
            className: 'compass-container',
            style: {
                position: 'relative',
                width: '300px',
                height: '300px',
                margin: '0 auto 2rem',
                background: 'var(--bg-secondary)',
                borderRadius: '50%',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }
        });
        
        // Compass outer ring
        const outerRing = Utils.createElement('div', {
            className: 'compass-outer-ring',
            style: {
                position: 'absolute',
                top: '10px',
                left: '10px',
                right: '10px',
                bottom: '10px',
                border: '2px solid var(--border-color)',
                borderRadius: '50%'
            }
        });
        
        // Compass inner circle
        const innerCircle = Utils.createElement('div', {
            className: 'compass-inner-circle',
            style: {
                position: 'absolute',
                top: '50px',
                left: '50px',
                right: '50px',
                bottom: '50px',
                background: 'var(--bg-color)',
                borderRadius: '50%',
                border: '1px solid var(--border-color)'
            }
        });
        
        // Compass needle container
        const needleContainer = Utils.createElement('div', {
            id: 'compassNeedle',
            className: 'compass-needle-container',
            style: {
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                transition: 'transform 0.1s ease-out'
            }
        });
        
        // Compass needle
        const needle = Utils.createElement('div', {
            className: 'compass-needle',
            style: {
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '2px',
                height: '100px',
                background: 'var(--danger-color)',
                transform: 'translate(-50%, -50%)',
                transformOrigin: 'center 0'
            }
        });
        
        // Qibla indicator
        const qiblaIndicator = Utils.createElement('div', {
            className: 'qibla-indicator',
            style: {
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '4px',
                height: '80px',
                background: 'var(--primary-color)',
                transform: `translate(-50%, -50%) rotate(${this.qiblaDirection}deg)`,
                transformOrigin: 'center 0',
                opacity: '0.7'
            }
        });
        
        // Qibla marker
        const qiblaMarker = Utils.createElement('div', {
            className: 'qibla-marker',
            style: {
                position: 'absolute',
                top: '30px',
                left: '50%',
                width: '40px',
                height: '40px',
                background: 'var(--primary-color)',
                borderRadius: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                boxShadow: '0 2px 10px rgba(26, 93, 26, 0.3)'
            }
        }, 'ق');
        
        // Cardinal directions
        const directions = ['ش', 'غ', 'ج', 'ش'];
        const angles = [0, 90, 180, 270];
        
        directions.forEach((direction, index) => {
            const angle = angles[index];
            const rad = this.degToRad(angle);
            const x = 150 + Math.sin(rad) * 110;
            const y = 150 - Math.cos(rad) * 110;
            
            const dirElement = Utils.createElement('div', {
                className: 'compass-direction',
                style: {
                    position: 'absolute',
                    top: `${y}px`,
                    left: `${x}px`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)'
                }
            }, direction);
            
            container.appendChild(dirElement);
        });
        
        // Degree markers
        for (let i = 0; i < 360; i += 45) {
            const rad = this.degToRad(i);
            const x1 = 150 + Math.sin(rad) * 120;
            const y1 = 150 - Math.cos(rad) * 120;
            const x2 = 150 + Math.sin(rad) * 130;
            const y2 = 150 - Math.cos(rad) * 130;
            
            const marker = Utils.createElement('div', {
                className: 'degree-marker',
                style: {
                    position: 'absolute',
                    top: `${y1}px`,
                    left: `${x1}px`,
                    width: '2px',
                    height: '10px',
                    background: 'var(--text-light)',
                    transform: `translate(-50%, -50%) rotate(${i}deg)`,
                    transformOrigin: 'center'
                }
            });
            
            container.appendChild(marker);
            
            // Degree numbers for major angles
            if (i % 90 === 0) {
                const x3 = 150 + Math.sin(rad) * 100;
                const y3 = 150 - Math.cos(rad) * 100;
                
                const number = Utils.createElement('div', {
                    className: 'degree-number',
                    style: {
                        position: 'absolute',
                        top: `${y3}px`,
                        left: `${x3}px`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: '0.8rem',
                        color: 'var(--text-light)'
                    }
                }, i.toString());
                
                container.appendChild(number);
            }
        }
        
        needleContainer.appendChild(needle);
        container.appendChild(outerRing);
        container.appendChild(innerCircle);
        container.appendChild(needleContainer);
        container.appendChild(qiblaIndicator);
        container.appendChild(qiblaMarker);
        
        return container;
    }

    createInfoPanel() {
        const panel = Utils.createElement('div', {
            className: 'qibla-info-panel',
            style: {
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                marginBottom: '2rem',
                textAlign: 'left'
            }
        });
        
        // Location info
        const locationInfo = Utils.createElement('div', {
            className: 'location-info',
            style: {
                marginBottom: '1rem'
            }
        });
        
        const locationTitle = Utils.createElement('h4', {
            style: {
                color: 'var(--primary-color)',
                marginBottom: '0.5rem',
                fontSize: '0.9rem'
            }
        }, 'موقعك الحالي');
        
        let locationText = '';
        if (this.userLocation.city) {
            locationText = `${this.userLocation.city}, ${this.userLocation.country}`;
        } else {
            locationText = `${this.userLocation.latitude.toFixed(4)}°, ${this.userLocation.longitude.toFixed(4)}°`;
        }
        
        const locationValue = Utils.createElement('p', {
            style: {
                fontSize: '1rem',
                fontWeight: 'bold'
            }
        }, locationText);
        
        // Accuracy info
        const accuracyInfo = Utils.createElement('div', {
            className: 'accuracy-info',
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
            }
        });
        
        let accuracyText = '';
        let accuracyColor = 'var(--success-color)';
        
        if (this.userLocation.accuracy) {
            if (this.userLocation.accuracy < 50) {
                accuracyText = 'دقة عالية';
                accuracyColor = 'var(--success-color)';
            } else if (this.userLocation.accuracy < 200) {
                accuracyText = 'دقة متوسطة';
                accuracyColor = 'var(--warning-color)';
            } else {
                accuracyText = 'دقة منخفضة';
                accuracyColor = 'var(--danger-color)';
            }
        } else {
            accuracyText = 'موقع تقديري';
            accuracyColor = 'var(--warning-color)';
        }
        
        const accuracyDot = Utils.createElement('div', {
            style: {
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: accuracyColor
            }
        });
        
        const accuracyTextEl = Utils.createElement('span', {
            style: {
                fontSize: '0.9rem',
                color: 'var(--text-light)'
            }
        }, accuracyText);
        
        // Qibla info
        const qiblaInfo = Utils.createElement('div', {
            className: 'qibla-info'
        });
        
        const qiblaTitle = Utils.createElement('h4', {
            style: {
                color: 'var(--primary-color)',
                marginBottom: '0.5rem',
                fontSize: '0.9rem'
            }
        }, 'اتجاه القبلة');
        
        const qiblaValue = Utils.createElement('p', {
            id: 'qiblaValue',
            style: {
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'var(--primary-color)'
            }
        }, `${this.qiblaDirection.toFixed(1)}°`);
        
        const qiblaCardinal = Utils.createElement('p', {
            id: 'qiblaCardinal',
            style: {
                fontSize: '0.9rem',
                color: 'var(--text-light)'
            }
        }, this.getCardinalDirection(this.qiblaDirection));
        
        locationInfo.appendChild(locationTitle);
        locationInfo.appendChild(locationValue);
        
        accuracyInfo.appendChild(accuracyDot);
        accuracyInfo.appendChild(accuracyTextEl);
        
        qiblaInfo.appendChild(qiblaTitle);
        qiblaInfo.appendChild(qiblaValue);
        qiblaInfo.appendChild(qiblaCardinal);
        
        panel.appendChild(locationInfo);
        panel.appendChild(accuracyInfo);
        panel.appendChild(qiblaInfo);
        
        return panel;
    }

    createControls() {
        const controls = Utils.createElement('div', {
            className: 'qibla-controls',
            style: {
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap'
            }
        });
        
        // Calibrate button
        const calibrateBtn = Utils.createElement('button', {
            id: 'calibrateBtn',
            className: 'qibla-btn primary',
            style: {
                padding: '0.75rem 1.5rem',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
            }
        }, '<i class="fas fa-compass"></i> معايرة');
        
        calibrateBtn.addEventListener('click', () => {
            this.startCalibration();
        });
        
        // Update location button
        const updateLocationBtn = Utils.createElement('button', {
            id: 'updateLocationBtn',
            className: 'qibla-btn secondary',
            style: {
                padding: '0.75rem 1.5rem',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
            }
        }, '<i class="fas fa-location-arrow"></i> تحديث الموقع');
        
        updateLocationBtn.addEventListener('click', () => {
            this.updateLocation();
        });
        
        // Settings button
        const settingsBtn = Utils.createElement('button', {
            id: 'qiblaSettingsBtn',
            className: 'qibla-btn',
            style: {
                padding: '0.75rem 1.5rem',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
            }
        }, '<i class="fas fa-cog"></i> إعدادات');
        
        settingsBtn.addEventListener('click', () => {
            this.showSettings();
        });
        
        controls.appendChild(calibrateBtn);
        controls.appendChild(updateLocationBtn);
        controls.appendChild(settingsBtn);
        
        return controls;
    }

    startCompass() {
        if (!this.isCompassAvailable) {
            this.showCompassUnavailable();
            return;
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        const handleOrientation = (event) => {
            if (event.alpha !== null) {
                let heading = event.alpha; // Compass heading in degrees
                
                // Apply calibration offset if calibrating
                if (this.isCalibrating) {
                    heading = this.applyCalibration(heading);
                }
                
                // Update current heading
                this.currentHeading = heading;
                
                // Update UI
                this.updateCompass(heading);
                
                // Check if pointing to Qibla
                this.checkQiblaAlignment(heading);
            }
        };
        
        // Use absolute orientation if available
        if ('ondeviceorientationabsolute' in window) {
            window.addEventListener('deviceorientationabsolute', handleOrientation);
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
        }
        
        // Start animation loop
        this.animationFrame = requestAnimationFrame(() => this.animateCompass());
    }

    stopCompass() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        window.removeEventListener('deviceorientationabsolute', this.handleOrientation);
        window.removeEventListener('deviceorientation', this.handleOrientation);
    }

    animateCompass() {
        this.updateCompassDisplay();
        this.animationFrame = requestAnimationFrame(() => this.animateCompass());
    }

    updateCompass(heading) {
        // Calculate the difference between current heading and Qibla direction
        let diff = this.qiblaDirection - heading;
        
        // Normalize difference to -180 to 180 range
        diff = ((diff + 180) % 360) - 180;
        
        // Store for display
        this.currentDiff = diff;
        
        // Update needle position
        const needleContainer = document.getElementById('compassNeedle');
        if (needleContainer) {
            needleContainer.style.transform = `rotate(${heading}deg)`;
        }
    }

    updateCompassDisplay() {
        // Update heading display
        const headingElement = document.getElementById('currentHeading');
        if (headingElement && this.currentHeading !== undefined) {
            headingElement.textContent = `${this.currentHeading.toFixed(1)}°`;
        }
        
        // Update Qibla difference
        const diffElement = document.getElementById('qiblaDiff');
        if (diffElement && this.currentDiff !== undefined) {
            const absDiff = Math.abs(this.currentDiff);
            diffElement.textContent = `${absDiff.toFixed(1)}°`;
            diffElement.style.color = this.getDiffColor(absDiff);
        }
        
        // Update cardinal direction
        const cardinalElement = document.getElementById('currentCardinal');
        if (cardinalElement && this.currentHeading !== undefined) {
            cardinalElement.textContent = this.getCardinalDirection(this.currentHeading);
        }
    }

    getDiffColor(diff) {
        if (diff < 5) return 'var(--success-color)';
        if (diff < 15) return 'var(--warning-color)';
        return 'var(--danger-color)';
    }

    getCardinalDirection(degrees) {
        const directions = ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }

    checkQiblaAlignment(heading) {
        const diff = Math.abs(this.qiblaDirection - heading);
        const normalizedDiff = Math.min(diff, 360 - diff);
        
        // Check if aligned (within 5 degrees)
        if (normalizedDiff < 5) {
            this.onQiblaAligned();
        }
    }

    onQiblaAligned() {
        // Play sound
        if (this.settings.sound) {
            this.playAlignmentSound();
        }
        
        // Vibrate
        if (this.settings.vibration && 'vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // Show visual feedback
        this.showAlignmentFeedback();
    }

    playAlignmentSound() {
        // Play a beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    showAlignmentFeedback() {
        // Add pulse animation to compass
        const compass = document.querySelector('.compass-container');
        if (compass) {
            compass.classList.add('qibla-aligned');
            setTimeout(() => {
                compass.classList.remove('qibla-aligned');
            }, 1000);
        }
        
        // Show notification
        Utils.showToast('اتجاه القبلة!', 'success');
    }

    startCalibration() {
        this.isCalibrating = true;
        this.calibrationCount = 0;
        this.calibrationReadings = [];
        
        // Show calibration instructions
        this.showCalibrationInstructions();
        
        // Start calibration process
        this.calibrationInterval = setInterval(() => {
            this.calibrationCount++;
            
            if (this.calibrationCount <= 10) {
                // Collect readings
                if (this.currentHeading !== undefined) {
                    this.calibrationReadings.push(this.currentHeading);
                }
                
                // Update progress
                this.updateCalibrationProgress();
            } else {
                // Finish calibration
                this.finishCalibration();
            }
        }, 1000);
    }

    updateCalibrationProgress() {
        const progress = (this.calibrationCount / 10) * 100;
        const progressElement = document.getElementById('calibrationProgress');
        
        if (progressElement) {
            progressElement.style.width = `${progress}%`;
        }
        
        // Update count
        const countElement = document.getElementById('calibrationCount');
        if (countElement) {
            countElement.textContent = `${this.calibrationCount}/10`;
        }
    }

    finishCalibration() {
        clearInterval(this.calibrationInterval);
        this.isCalibrating = false;
        
        // Calculate average heading
        if (this.calibrationReadings.length > 0) {
            const sum = this.calibrationReadings.reduce((a, b) => a + b, 0);
            const average = sum / this.calibrationReadings.length;
            
            // Calculate calibration offset
            this.calibrationOffset = 360 - average;
            
            // Save calibration
            Utils.setLocalStorage('compassCalibration', this.calibrationOffset);
            
            // Show success
            Utils.showToast('تمت المعايرة بنجاح', 'success');
        }
        
        // Hide calibration UI
        this.hideCalibrationUI();
    }

    applyCalibration(heading) {
        if (this.calibrationOffset) {
            return (heading + this.calibrationOffset) % 360;
        }
        return heading;
    }

    showCalibrationInstructions() {
        // Create calibration overlay
        const overlay = Utils.createElement('div', {
            className: 'calibration-overlay',
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
                color: 'white',
                padding: '2rem'
            }
        });
        
        const title = Utils.createElement('h2', {
            style: {
                marginBottom: '1rem',
                textAlign: 'center'
            }
        }, 'معايرة البوصلة');
        
        const instructions = Utils.createElement('p', {
            style: {
                marginBottom: '2rem',
                textAlign: 'center',
                lineHeight: '1.6'
            }
        }, 'قومي بتحريك هاتفك في شكل الرقم 8 لمدة 10 ثواني لمعايرة البوصلة بدقة.');
        
        const progressContainer = Utils.createElement('div', {
            style: {
                width: '80%',
                height: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '1rem'
            }
        });
        
        const progressBar = Utils.createElement('div', {
            id: 'calibrationProgress',
            style: {
                width: '0%',
                height: '100%',
                background: 'var(--primary-color)',
                transition: 'width 0.3s ease'
            }
        });
        
        const count = Utils.createElement('div', {
            id: 'calibrationCount',
            style: {
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginBottom: '2rem'
            }
        }, '0/10');
        
        const cancelBtn = Utils.createElement('button', {
            style: {
                padding: '0.75rem 2rem',
                background: 'var(--danger-color)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                cursor: 'pointer'
            }
        }, 'إلغاء');
        
        cancelBtn.addEventListener('click', () => {
            clearInterval(this.calibrationInterval);
            this.isCalibrating = false;
            document.body.removeChild(overlay);
        });
        
        progressContainer.appendChild(progressBar);
        overlay.appendChild(title);
        overlay.appendChild(instructions);
        overlay.appendChild(progressContainer);
        overlay.appendChild(count);
        overlay.appendChild(cancelBtn);
        
        document.body.appendChild(overlay);
    }

    hideCalibrationUI() {
        const overlay = document.querySelector('.calibration-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    }

    async updateLocation() {
        try {
            // Clear cached location
            Utils.removeLocalStorage('userLocation');
            
            // Get new location
            await this.getUserLocation();
            
            // Recalculate Qibla
            this.calculateQibla();
            
            // Update UI
            this.updateLocationInfo();
            
            Utils.showToast('تم تحديث الموقع بنجاح', 'success');
        } catch (error) {
            console.error('Error updating location:', error);
            Utils.showToast('تعذر تحديث الموقع', 'error');
        }
    }

    updateLocationInfo() {
        // Update location text
        const locationValue = document.querySelector('.location-info p');
        if (locationValue && this.userLocation) {
            let locationText = '';
            if (this.userLocation.city) {
                locationText = `${this.userLocation.city}, ${this.userLocation.country}`;
            } else {
                locationText = `${this.userLocation.latitude.toFixed(4)}°, ${this.userLocation.longitude.toFixed(4)}°`;
            }
            locationValue.textContent = locationText;
        }
        
        // Update Qibla direction
        const qiblaValue = document.getElementById('qiblaValue');
        const qiblaCardinal = document.getElementById('qiblaCardinal');
        
        if (qiblaValue) {
            qiblaValue.textContent = `${this.qiblaDirection.toFixed(1)}°`;
        }
        
        if (qiblaCardinal) {
            qiblaCardinal.textContent = this.getCardinalDirection(this.qiblaDirection);
        }
        
        // Update Qibla indicator
        const qiblaIndicator = document.querySelector('.qibla-indicator');
        if (qiblaIndicator) {
            qiblaIndicator.style.transform = `translate(-50%, -50%) rotate(${this.qiblaDirection}deg)`;
        }
    }

    showSettings() {
        // Create settings modal
        const modal = Utils.createElement('div', {
            className: 'qibla-settings-modal',
            style: {
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: '10000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }
        });
        
        const modalContent = Utils.createElement('div', {
            className: 'modal-content',
            style: {
                background: 'var(--bg-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto'
            }
        });
        
        const title = Utils.createElement('h2', {
            style: {
                marginBottom: '1.5rem',
                color: 'var(--primary-color)'
            }
        }, 'إعدادات البوصلة');
        
        // Settings options
        const settingsForm = this.createSettingsForm();
        
        const closeBtn = Utils.createElement('button', {
            style: {
                padding: '0.75rem 2rem',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                cursor: 'pointer',
                marginTop: '1.5rem',
                width: '100%'
            }
        }, 'حفظ الإعدادات');
        
        closeBtn.addEventListener('click', () => {
            this.saveSettings();
            document.body.removeChild(modal);
        });
        
        modalContent.appendChild(title);
        modalContent.appendChild(settingsForm);
        modalContent.appendChild(closeBtn);
        
        modal.appendChild(modalContent);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        document.body.appendChild(modal);
    }

    createSettingsForm() {
        const form = Utils.createElement('form', {
            style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }
        });
        
        // Show degrees toggle
        const degreesToggle = this.createToggleSetting(
            'showDegrees',
            'عرض الدرجات',
            this.settings.showDegrees
        );
        
        // Show cardinal directions toggle
        const cardinalToggle = this.createToggleSetting(
            'showCardinal',
            'عرض الاتجاهات الأساسية',
            this.settings.showCardinal
        );
        
        // Vibration toggle
        const vibrationToggle = this.createToggleSetting(
            'vibration',
            'الاهتزاز عند اتجاه القبلة',
            this.settings.vibration
        );
        
        // Sound toggle
        const soundToggle = this.createToggleSetting(
            'sound',
            'الصوت عند اتجاه القبلة',
            this.settings.sound
        );
        
        // Auto-calibration toggle
        const calibrationToggle = this.createToggleSetting(
            'calibration',
            'المعايرة التلقائية',
            this.settings.calibration
        );
        
        // Accuracy selector
        const accuracySelector = this.createSelectSetting(
            'accuracy',
            'دقة الموقع',
            [
                { value: 'high', label: 'عالية' },
                { value: 'medium', label: 'متوسطة' },
                { value: 'low', label: 'منخفضة' }
            ],
            this.settings.accuracy
        );
        
        form.appendChild(degreesToggle);
        form.appendChild(cardinalToggle);
        form.appendChild(vibrationToggle);
        form.appendChild(soundToggle);
        form.appendChild(calibrationToggle);
        form.appendChild(accuracySelector);
        
        return form;
    }

    createToggleSetting(id, label, checked) {
        const container = Utils.createElement('div', {
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--border-color)'
            }
        });
        
        const labelElement = Utils.createElement('label', {
            htmlFor: id,
            style: {
                fontSize: '0.9rem',
                cursor: 'pointer'
            }
        }, label);
        
        const toggle = Utils.createElement('input', {
            type: 'checkbox',
            id: id,
            checked: checked,
            style: {
                width: '40px',
                height: '20px',
                cursor: 'pointer'
            }
        });
        
        container.appendChild(labelElement);
        container.appendChild(toggle);
        
        return container;
    }

    createSelectSetting(id, label, options, selectedValue) {
        const container = Utils.createElement('div', {
            style: {
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--border-color)'
            }
        });
        
        const labelElement = Utils.createElement('label', {
            htmlFor: id,
            style: {
                display: 'block',
                fontSize: '0.9rem',
                marginBottom: '0.5rem'
            }
        }, label);
        
        const select = Utils.createElement('select', {
            id: id,
            style: {
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
            }
        });
        
        options.forEach(option => {
            const optionElement = Utils.createElement('option', {
                value: option.value,
                selected: option.value === selectedValue
            }, option.label);
            
            select.appendChild(optionElement);
        });
        
        container.appendChild(labelElement);
        container.appendChild(select);
        
        return container;
    }

    saveSettings() {
        // Get values from form
        this.settings.showDegrees = document.getElementById('showDegrees')?.checked || false;
        this.settings.showCardinal = document.getElementById('showCardinal')?.checked || false;
        this.settings.vibration = document.getElementById('vibration')?.checked || false;
        this.settings.sound = document.getElementById('sound')?.checked || false;
        this.settings.calibration = document.getElementById('calibration')?.checked || false;
        this.settings.accuracy = document.getElementById('accuracy')?.value || 'high';
        
        // Save to localStorage
        Utils.setLocalStorage('qiblaSettings', this.settings);
        
        // Apply settings
        this.applySettings();
    }

    applySettings() {
        // Update UI based on settings
        this.updateUI();
    }

    updateUI() {
        // Show/hide degrees
        const degreeNumbers = document.querySelectorAll('.degree-number');
        degreeNumbers.forEach(el => {
            el.style.display = this.settings.showDegrees ? 'block' : 'none';
        });
        
        // Show/hide cardinal directions
        const directions = document.querySelectorAll('.compass-direction');
        directions.forEach(el => {
            el.style.display = this.settings.showCardinal ? 'block' : 'none';
        });
    }

    showCompassUnavailable() {
        const compassContainer = document.querySelector('.compass-container');
        if (compassContainer) {
            const message = Utils.createElement('div', {
                className: 'compass-unavailable',
                style: {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: 'var(--text-light)',
                    padding: '1rem',
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: 'var(--radius-md)'
                }
            });
            
            message.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>البوصلة غير متاحة على هذا الجهاز</p>
            `;
            
            compassContainer.appendChild(message);
        }
    }

    setupEventListeners() {
        // Screen orientation change
        window.addEventListener('orientationchange', () => {
            // Reinitialize compass on orientation change
            setTimeout(() => {
                this.stopCompass();
                this.startCompass();
            }, 300);
        });
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopCompass();
            } else {
                this.startCompass();
            }
        });
    }

    // Public API methods
    getQiblaDirection() {
        return {
            degrees: this.qiblaDirection,
            cardinal: this.getCardinalDirection(this.qiblaDirection),
            location: this.userLocation
        };
    }

    getCurrentHeading() {
        return {
            degrees: this.currentHeading,
            cardinal: this.getCardinalDirection(this.currentHeading),
            diffToQibla: this.currentDiff
        };
    }

    isPointingToQibla() {
        if (this.currentDiff === undefined) return false;
        const absDiff = Math.abs(this.currentDiff);
        return absDiff < 5 || absDiff > 355; // Within 5 degrees
    }

    // Static method to get instance
    static async getInstance() {
        if (!QiblaManager.instance) {
            QiblaManager.instance = new QiblaManager();
            await QiblaManager.instance.init();
        }
        return QiblaManager.instance;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.qiblaManager = await QiblaManager.getInstance();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QiblaManager;
}