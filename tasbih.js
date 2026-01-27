// Tasbih (Digital Prayer Beads) System

class TasbihManager {
    constructor() {
        this.count = 0;
        this.target = 33; // Default for Subhanallah
        this.currentDhikr = 'subhanallah';
        this.history = [];
        this.settings = {
            vibration: true,
            sound: true,
            autoReset: true,
            beadDesign: 'default',
            counterColor: 'primary',
            showHistory: true,
            dailyGoal: 100
        };
        this.dhikrTypes = {
            subhanallah: {
                name: 'سبحان الله',
                target: 33,
                arabic: 'سُبْحَانَ ٱللَّٰهِ',
                meaning: 'سبحان الله',
                reward: 'محي الخطايا'
            },
            alhamdulillah: {
                name: 'الحمد لله',
                target: 33,
                arabic: 'ٱلْحَمْدُ لِلَّٰهِ',
                meaning: 'الحمد لله',
                reward: 'ملىء الميزان'
            },
            allahuakbar: {
                name: 'الله أكبر',
                target: 34,
                arabic: 'ٱللَّٰهُ أَكْبَرُ',
                meaning: 'الله أكبر',
                reward: 'ملىء ما بين السماء والأرض'
            },
            lailahaillallah: {
                name: 'لا إله إلا الله',
                target: 100,
                arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ',
                meaning: 'لا إله إلا الله',
                reward: 'أحب الكلام إلى الله'
            },
            astaghfirullah: {
                name: 'أستغفر الله',
                target: 100,
                arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ',
                meaning: 'أستغفر الله',
                reward: 'مغفرة الذنوب'
            },
            subhanallahibihamdih: {
                name: 'سبحان الله وبحمده',
                target: 100,
                arabic: 'سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ',
                meaning: 'سبحان الله وبحمده',
                reward: 'حطت خطاياه وإن كانت مثل زبد البحر'
            }
        };
        this.init();
    }

    async init() {
        // Load settings
        await this.loadSettings();
        
        // Load history
        await this.loadHistory();
        
        // Initialize UI
        this.initUI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI
        this.updateUI();
    }

    async loadSettings() {
        const savedSettings = Utils.getLocalStorage('tasbihSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };
        }
    }

    async loadHistory() {
        this.history = Utils.getLocalStorage('tasbihHistory', []);
        
        // Clean old history (keep only last 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        this.history = this.history.filter(record => 
            record.timestamp > thirtyDaysAgo
        );
    }

    initUI() {
        // Create tasbih interface if not exists
        this.createTasbihInterface();
    }

    createTasbihInterface() {
        const tasbihSection = document.getElementById('tasbih-section');
        if (!tasbihSection) return;
        
        tasbihSection.innerHTML = '';
        
        // Main container
        const container = Utils.createElement('div', {
            className: 'tasbih-container',
            style: {
                maxWidth: '600px',
                margin: '0 auto',
                padding: '1rem'
            }
        });
        
        // Header
        const header = this.createHeader();
        container.appendChild(header);
        
        // Counter display
        const counter = this.createCounter();
        container.appendChild(counter);
        
        // Beads display
        const beads = this.createBeads();
        container.appendChild(beads);
        
        // Controls
        const controls = this.createControls();
        container.appendChild(controls);
        
        // Dhikr selector
        const selector = this.createDhikrSelector();
        container.appendChild(selector);
        
        // Statistics
        const stats = this.createStatistics();
        container.appendChild(stats);
        
        tasbihSection.appendChild(container);
    }

    createHeader() {
        const header = Utils.createElement('div', {
            className: 'tasbih-header',
            style: {
                textAlign: 'center',
                marginBottom: '1.5rem'
            }
        });
        
        const title = Utils.createElement('h2', {
            className: 'tasbih-title',
            style: {
                color: 'var(--primary-color)',
                marginBottom: '0.5rem'
            }
        }, 'المسبحة الإلكترونية');
        
        const subtitle = Utils.createElement('p', {
            className: 'tasbih-subtitle',
            style: {
                color: 'var(--text-light)',
                fontSize: '0.9rem'
            }
        }, 'اضغط على الحبة للذكر والتسبيح');
        
        header.appendChild(title);
        header.appendChild(subtitle);
        
        return header;
    }

    createCounter() {
        const counterContainer = Utils.createElement('div', {
            className: 'tasbih-counter-container',
            style: {
                textAlign: 'center',
                marginBottom: '2rem'
            }
        });
        
        const counter = Utils.createElement('div', {
            id: 'tasbihCounter',
            className: 'tasbih-counter',
            style: {
                fontSize: '4rem',
                fontWeight: 'bold',
                color: `var(--${this.settings.counterColor}-color)`,
                fontFamily: 'monospace',
                marginBottom: '0.5rem',
                textShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }
        }, this.count.toString().padStart(3, '0'));
        
        const target = Utils.createElement('div', {
            className: 'tasbih-target',
            style: {
                fontSize: '1rem',
                color: 'var(--text-light)'
            }
        }, `الهدف: ${this.target}`);
        
        counterContainer.appendChild(counter);
        counterContainer.appendChild(target);
        
        return counterContainer;
    }

    createBeads() {
        const beadsContainer = Utils.createElement('div', {
            className: 'tasbih-beads-container',
            style: {
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '2rem',
                padding: '1rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)'
            }
        });
        
        // Create beads based on current dhikr target
        for (let i = 0; i < this.target; i++) {
            const bead = this.createBead(i);
            beadsContainer.appendChild(bead);
        }
        
        return beadsContainer;
    }

    createBead(index) {
        const isCompleted = index < this.count;
        
        const bead = Utils.createElement('button', {
            className: 'tasbih-bead',
            'data-index': index,
            style: {
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                background: isCompleted ? 
                    `var(--${this.settings.counterColor}-color)` : 
                    'var(--bg-tertiary)',
                color: isCompleted ? 'white' : 'var(--text-light)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
            }
        }, (index + 1).toString());
        
        // Add completed effect
        if (isCompleted) {
            bead.style.boxShadow = '0 0 15px rgba(26, 93, 26, 0.3)';
            
            // Add checkmark for completed beads
            const checkmark = Utils.createElement('div', {
                className: 'bead-checkmark',
                style: {
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    fontSize: '0.7rem',
                    opacity: '0.8'
                }
            }, '✓');
            
            bead.appendChild(checkmark);
        }
        
        // Add click handler
        bead.addEventListener('click', () => {
            this.increment(index);
        });
        
        // Add hover effects
        bead.addEventListener('mouseenter', () => {
            if (!isCompleted) {
                bead.style.transform = 'scale(1.1)';
                bead.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
            }
        });
        
        bead.addEventListener('mouseleave', () => {
            if (!isCompleted) {
                bead.style.transform = 'scale(1)';
                bead.style.boxShadow = 'none';
            }
        });
        
        return bead;
    }

    createControls() {
        const controls = Utils.createElement('div', {
            className: 'tasbih-controls',
            style: {
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: '2rem',
                flexWrap: 'wrap'
            }
        });
        
        // Increment button
        const incrementBtn = Utils.createElement('button', {
            id: 'tasbihIncrement',
            className: 'tasbih-btn primary',
            style: {
                padding: '0.75rem 1.5rem',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
            }
        }, '<i class="fas fa-plus"></i> زيادة');
        
        incrementBtn.addEventListener('click', () => {
            this.increment();
        });
        
        // Reset button
        const resetBtn = Utils.createElement('button', {
            id: 'tasbihReset',
            className: 'tasbih-btn secondary',
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
        }, '<i class="fas fa-redo"></i> إعادة');
        
        resetBtn.addEventListener('click', () => {
            this.reset();
        });
        
        // Save button
        const saveBtn = Utils.createElement('button', {
            id: 'tasbihSave',
            className: 'tasbih-btn success',
            style: {
                padding: '0.75rem 1.5rem',
                background: 'var(--success-color)',
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
        }, '<i class="fas fa-save"></i> حفظ');
        
        saveBtn.addEventListener('click', () => {
            this.saveSession();
        });
        
        controls.appendChild(incrementBtn);
        controls.appendChild(resetBtn);
        controls.appendChild(saveBtn);
        
        return controls;
    }

    createDhikrSelector() {
        const selector = Utils.createElement('div', {
            className: 'dhikr-selector',
            style: {
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                marginBottom: '2rem'
            }
        });
        
        const title = Utils.createElement('h3', {
            style: {
                marginBottom: '1rem',
                color: 'var(--primary-color)',
                fontSize: '1.1rem'
            }
        }, 'اختر نوع الذكر');
        
        selector.appendChild(title);
        
        // Create dhikr buttons
        const buttonsContainer = Utils.createElement('div', {
            className: 'dhikr-buttons',
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '0.75rem'
            }
        });
        
        Object.entries(this.dhikrTypes).forEach(([key, dhikr]) => {
            const isActive = this.currentDhikr === key;
            
            const button = Utils.createElement('button', {
                className: 'dhikr-btn',
                'data-dhikr': key,
                style: {
                    padding: '1rem',
                    background: isActive ? 'var(--primary-color)' : 'var(--bg-tertiary)',
                    color: isActive ? 'white' : 'var(--text-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }
            });
            
            const arabic = Utils.createElement('div', {
                style: {
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    fontFamily: 'Amiri, serif'
                }
            }, dhikr.arabic);
            
            const name = Utils.createElement('div', {
                style: {
                    fontSize: '0.8rem',
                    opacity: '0.9'
                }
            }, dhikr.name);
            
            const target = Utils.createElement('div', {
                style: {
                    fontSize: '0.7rem',
                    opacity: '0.7',
                    background: 'rgba(0,0,0,0.1)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '10px',
                    display: 'inline-block',
                    marginTop: '0.25rem'
                }
            }, `${dhikr.target} مرة`);
            
            button.appendChild(arabic);
            button.appendChild(name);
            button.appendChild(target);
            
            button.addEventListener('click', () => {
                this.selectDhikr(key);
            });
            
            buttonsContainer.appendChild(button);
        });
        
        selector.appendChild(buttonsContainer);
        
        return selector;
    }

    createStatistics() {
        const stats = Utils.createElement('div', {
            className: 'tasbih-stats',
            style: {
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem'
            }
        });
        
        const title = Utils.createElement('h3', {
            style: {
                marginBottom: '1rem',
                color: 'var(--primary-color)',
                fontSize: '1.1rem'
            }
        }, 'إحصائيات التسبيح');
        
        stats.appendChild(title);
        
        // Daily stats
        const today = new Date().toDateString();
        const todayCount = this.getTodayCount();
        
        const dailyStats = Utils.createElement('div', {
            className: 'daily-stats',
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                marginBottom: '1.5rem'
            }
        });
        
        const todayCountEl = Utils.createElement('div', {
            className: 'stat-item',
            style: {
                background: 'var(--bg-tertiary)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
            }
        });
        
        todayCountEl.innerHTML = `
            <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color); margin-bottom: 0.5rem;">
                ${todayCount}
            </div>
            <div style="font-size: 0.9rem; color: var(--text-light);">
                تسبيحات اليوم
            </div>
        `;
        
        const goalProgress = Utils.createElement('div', {
            className: 'stat-item',
            style: {
                background: 'var(--bg-tertiary)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
            }
        });
        
        const progress = Math.min(100, (todayCount / this.settings.dailyGoal) * 100);
        
        goalProgress.innerHTML = `
            <div style="font-size: 2rem; font-weight: bold; color: var(--secondary-color); margin-bottom: 0.5rem;">
                ${progress.toFixed(0)}%
            </div>
            <div style="font-size: 0.9rem; color: var(--text-light);">
                الهدف اليومي
            </div>
            <div style="margin-top: 0.5rem; height: 4px; background: var(--border-color); border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; width: ${progress}%; background: var(--secondary-color);"></div>
            </div>
        `;
        
        dailyStats.appendChild(todayCountEl);
        dailyStats.appendChild(goalProgress);
        
        // Weekly stats
        const weeklyStats = Utils.createElement('div', {
            className: 'weekly-stats',
            style: {
                marginBottom: '1.5rem'
            }
        });
        
        const weeklyTitle = Utils.createElement('h4', {
            style: {
                marginBottom: '0.75rem',
                fontSize: '0.9rem',
                color: 'var(--text-light)'
            }
        }, 'التسبيح خلال الأسبوع');
        
        weeklyStats.appendChild(weeklyTitle);
        
        const weekChart = this.createWeekChart();
        weeklyStats.appendChild(weekChart);
        
        // All time stats
        const allTimeStats = Utils.createElement('div', {
            className: 'alltime-stats'
        });
        
        const allTimeTitle = Utils.createElement('h4', {
            style: {
                marginBottom: '0.75rem',
                fontSize: '0.9rem',
                color: 'var(--text-light)'
            }
        }, 'الإحصائيات الكلية');
        
        allTimeStats.appendChild(allTimeTitle);
        
        const totalCount = this.history.reduce((sum, record) => sum + record.count, 0);
        const sessionCount = this.history.length;
        const favoriteDhikr = this.getFavoriteDhikr();
        
        const statsGrid = Utils.createElement('div', {
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem'
            }
        });
        
        const totalEl = Utils.createElement('div', {
            style: {
                background: 'var(--bg-tertiary)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
            }
        });
        
        totalEl.innerHTML = `
            <div style="font-size: 1.2rem; font-weight: bold; color: var(--primary-color);">
                ${totalCount.toLocaleString()}
            </div>
            <div style="font-size: 0.7rem; color: var(--text-light);">
                المجموع الكلي
            </div>
        `;
        
        const sessionsEl = Utils.createElement('div', {
            style: {
                background: 'var(--bg-tertiary)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
            }
        });
        
        sessionsEl.innerHTML = `
            <div style="font-size: 1.2rem; font-weight: bold; color: var(--success-color);">
                ${sessionCount}
            </div>
            <div style="font-size: 0.7rem; color: var(--text-light);">
                جلسات التسبيح
            </div>
        `;
        
        const favoriteEl = Utils.createElement('div', {
            style: {
                background: 'var(--bg-tertiary)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
            }
        });
        
        favoriteEl.innerHTML = `
            <div style="font-size: 1rem; font-weight: bold; color: var(--secondary-color); line-height: 1.2;">
                ${favoriteDhikr?.name || 'لا يوجد'}
            </div>
            <div style="font-size: 0.7rem; color: var(--text-light);">
                الذكر المفضل
            </div>
        `;
        
        statsGrid.appendChild(totalEl);
        statsGrid.appendChild(sessionsEl);
        statsGrid.appendChild(favoriteEl);
        
        allTimeStats.appendChild(statsGrid);
        
        stats.appendChild(dailyStats);
        stats.appendChild(weeklyStats);
        stats.appendChild(allTimeStats);
        
        return stats;
    }

    createWeekChart() {
        const chart = Utils.createElement('div', {
            className: 'week-chart',
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                height: '100px',
                padding: '0.5rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)'
            }
        });
        
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const weekData = this.getWeekData();
        
        days.forEach((day, index) => {
            const dayData = weekData[index] || 0;
            const maxCount = Math.max(...weekData, 1); // Avoid division by zero
            const height = (dayData / maxCount) * 80;
            
            const bar = Utils.createElement('div', {
                className: 'chart-bar',
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '30px'
                }
            });
            
            const barFill = Utils.createElement('div', {
                style: {
                    width: '20px',
                    height: `${height}px`,
                    background: 'var(--primary-color)',
                    borderRadius: '4px 4px 0 0',
                    marginBottom: '0.25rem',
                    transition: 'height 0.3s ease'
                }
            });
            
            const dayLabel = Utils.createElement('div', {
                style: {
                    fontSize: '0.7rem',
                    color: 'var(--text-light)',
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    height: '20px'
                }
            }, day.substring(0, 3));
            
            const countLabel = Utils.createElement('div', {
                style: {
                    fontSize: '0.6rem',
                    color: 'var(--text-light)',
                    marginTop: '0.25rem'
                }
            }, dayData);
            
            bar.appendChild(barFill);
            bar.appendChild(dayLabel);
            bar.appendChild(countLabel);
            
            chart.appendChild(bar);
        });
        
        return chart;
    }

    getWeekData() {
        const weekData = [0, 0, 0, 0, 0, 0, 0];
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        
        this.history.forEach(record => {
            const recordDate = new Date(record.timestamp);
            if (recordDate >= startOfWeek) {
                const dayIndex = recordDate.getDay();
                weekData[dayIndex] += record.count;
            }
        });
        
        return weekData;
    }

    getTodayCount() {
        const today = new Date().toDateString();
        return this.history
            .filter(record => new Date(record.timestamp).toDateString() === today)
            .reduce((sum, record) => sum + record.count, 0);
    }

    getFavoriteDhikr() {
        const dhikrCounts = {};
        
        this.history.forEach(record => {
            if (!dhikrCounts[record.dhikr]) {
                dhikrCounts[record.dhikr] = 0;
            }
            dhikrCounts[record.dhikr] += record.count;
        });
        
        let favoriteKey = null;
        let maxCount = 0;
        
        Object.entries(dhikrCounts).forEach(([key, count]) => {
            if (count > maxCount) {
                maxCount = count;
                favoriteKey = key;
            }
        });
        
        return favoriteKey ? this.dhikrTypes[favoriteKey] : null;
    }

    increment(beadIndex = null) {
        // Check if we've reached the target
        if (this.count >= this.target) {
            if (this.settings.autoReset) {
                this.reset();
            } else {
                Utils.showToast('تم إكمال الذكر!', 'success');
                return;
            }
        }
        
        // Increment count
        this.count++;
        
        // Update counter display
        this.updateCounter();
        
        // Update beads
        this.updateBeads(beadIndex);
        
        // Play sound
        if (this.settings.sound) {
            this.playClickSound();
        }
        
        // Vibrate
        if (this.settings.vibration && 'vibrate' in navigator) {
            navigator.vibrate(50);
        }
        
        // Show dhikr text
        this.showDhikrText();
        
        // Check if target reached
        if (this.count === this.target) {
            this.onTargetReached();
        }
    }

    updateCounter() {
        const counter = document.getElementById('tasbihCounter');
        if (counter) {
            counter.textContent = this.count.toString().padStart(3, '0');
            
            // Add animation
            counter.classList.add('animate-pulse');
            setTimeout(() => {
                counter.classList.remove('animate-pulse');
            }, 300);
        }
    }

    updateBeads(activatedIndex = null) {
        if (activatedIndex !== null && activatedIndex < this.count) {
            // Update specific bead
            const bead = document.querySelector(`.tasbih-bead[data-index="${activatedIndex}"]`);
            if (bead) {
                this.animateBead(bead);
            }
        }
        
        // Update all beads
        document.querySelectorAll('.tasbih-bead').forEach((bead, index) => {
            const isCompleted = index < this.count;
            const beadIndex = parseInt(bead.getAttribute('data-index'));
            
            if (isCompleted && beadIndex === this.count - 1) {
                // This is the newly completed bead
                bead.style.background = `var(--${this.settings.counterColor}-color)`;
                bead.style.color = 'white';
                bead.style.boxShadow = '0 0 15px rgba(26, 93, 26, 0.3)';
                
                // Add checkmark
                if (!bead.querySelector('.bead-checkmark')) {
                    const checkmark = Utils.createElement('div', {
                        className: 'bead-checkmark',
                        style: {
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            fontSize: '0.7rem',
                            opacity: '0.8'
                        }
                    }, '✓');
                    bead.appendChild(checkmark);
                }
            }
        });
    }

    animateBead(bead) {
        // Add animation class
        bead.classList.add('animate-bead');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            bead.classList.remove('animate-bead');
        }, 300);
    }

    playClickSound() {
        // Create click sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    showDhikrText() {
        const dhikr = this.dhikrTypes[this.currentDhikr];
        
        // Create floating text
        const floatingText = Utils.createElement('div', {
            className: 'floating-dhikr',
            style: {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '2rem',
                fontWeight: 'bold',
                color: 'var(--primary-color)',
                opacity: '0',
                zIndex: '1000',
                pointerEvents: 'none',
                fontFamily: 'Amiri, serif',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }
        }, dhikr.arabic);
        
        document.body.appendChild(floatingText);
        
        // Animate floating text
        const animation = floatingText.animate([
            { opacity: 0, transform: 'translate(-50%, -50%) scale(0.8)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1.2)' },
            { opacity: 0, transform: 'translate(-50%, -150%) scale(0.8)' }
        ], {
            duration: 1000,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });
        
        animation.onfinish = () => {
            document.body.removeChild(floatingText);
        };
    }

    onTargetReached() {
        const dhikr = this.dhikrTypes[this.currentDhikr];
        
        // Show completion message
        Utils.showToast(`أكملت ${dhikr.name} ${this.target} مرة! ${dhikr.reward}`, 'success');
        
        // Play completion sound
        this.playCompletionSound();
        
        // Show celebration
        this.showCelebration();
        
        // Auto-save if enabled
        if (this.settings.autoSave) {
            this.saveSession();
        }
        
        // Auto-reset if enabled
        if (this.settings.autoReset) {
            setTimeout(() => {
                this.reset();
            }, 2000);
        }
    }

    playCompletionSound() {
        // Play a pleasant completion sound
        const audio = new Audio();
        audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=="; // Silent audio as placeholder
        audio.volume = 0.5;
        audio.play();
    }

    showCelebration() {
        // Create celebration particles
        for (let i = 0; i < 20; i++) {
            this.createParticle();
        }
    }

    createParticle() {
        const particle = Utils.createElement('div', {
            style: {
                position: 'fixed',
                top: '50%',
                left: '50%',
                width: '10px',
                height: '10px',
                background: `var(--${Math.random() > 0.5 ? 'primary' : 'secondary'}-color)`,
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: '999'
            }
        });
        
        document.body.appendChild(particle);
        
        // Random direction
        const angle = Math.random() * Math.PI * 2;
        const velocity = 2 + Math.random() * 3;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        let x = 50;
        let y = 50;
        
        const animate = () => {
            x += vx;
            y += vy;
            
            particle.style.left = `${x}%`;
            particle.style.top = `${y}%`;
            particle.style.opacity = 1 - (Math.abs(x - 50) + Math.abs(y - 50)) / 100;
            
            if (Math.abs(x - 50) < 100 && Math.abs(y - 50) < 100) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(particle);
            }
        };
        
        animate();
    }

    reset() {
        this.count = 0;
        this.updateCounter();
        this.updateBeads();
    }

    saveSession() {
        if (this.count === 0) {
            Utils.showToast('لم تقم بأي تسبيح بعد', 'warning');
            return;
        }
        
        const session = {
            dhikr: this.currentDhikr,
            count: this.count,
            timestamp: Date.now(),
            target: this.target
        };
        
        this.history.push(session);
        
        // Keep only last 1000 sessions
        if (this.history.length > 1000) {
            this.history = this.history.slice(-1000);
        }
        
        // Save to localStorage
        Utils.setLocalStorage('tasbihHistory', this.history);
        
        // Show success message
        Utils.showToast(`تم حفظ ${this.count} تسبيحة`, 'success');
        
        // Reset if auto-reset is enabled
        if (this.settings.autoReset) {
            this.reset();
        }
    }

    selectDhikr(dhikrKey) {
        if (!this.dhikrTypes[dhikrKey]) {
            console.error('Invalid dhikr key:', dhikrKey);
            return;
        }
        
        this.currentDhikr = dhikrKey;
        this.target = this.dhikrTypes[dhikrKey].target;
        
        // Update UI
        this.updateDhikrSelector();
        this.updateTargetDisplay();
        this.reset();
        
        // Save selection
        Utils.setLocalStorage('currentDhikr', dhikrKey);
    }

    updateDhikrSelector() {
        document.querySelectorAll('.dhikr-btn').forEach(btn => {
            const dhikrKey = btn.getAttribute('data-dhikr');
            const isActive = this.currentDhikr === dhikrKey;
            
            btn.style.background = isActive ? 'var(--primary-color)' : 'var(--bg-tertiary)';
            btn.style.color = isActive ? 'white' : 'var(--text-primary)';
        });
    }

    updateTargetDisplay() {
        const targetElement = document.querySelector('.tasbih-target');
        if (targetElement) {
            targetElement.textContent = `الهدف: ${this.target}`;
        }
        
        // Recreate beads
        this.recreateBeads();
    }

    recreateBeads() {
        const beadsContainer = document.querySelector('.tasbih-beads-container');
        if (beadsContainer) {
            Utils.removeAllChildren(beadsContainer);
            
            for (let i = 0; i < this.target; i++) {
                const bead = this.createBead(i);
                beadsContainer.appendChild(bead);
            }
        }
    }

    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' || event.code === 'Enter') {
                event.preventDefault();
                this.increment();
            } else if (event.code === 'Escape') {
                this.reset();
            } else if (event.code === 'KeyS') {
                this.saveSession();
            }
        });
        
        // Touch events for mobile
        document.addEventListener('touchstart', (event) => {
            // Handle touch on beads
            if (event.target.classList.contains('tasbih-bead')) {
                const index = parseInt(event.target.getAttribute('data-index'));
                this.increment(index);
            }
        });
        
        // Settings changes
        document.addEventListener('tasbihSettingsChanged', (event) => {
            this.settings = { ...this.settings, ...event.detail };
            Utils.setLocalStorage('tasbihSettings', this.settings);
            this.updateUI();
        });
    }

    updateUI() {
        // Update counter color
        const counter = document.getElementById('tasbihCounter');
        if (counter) {
            counter.style.color = `var(--${this.settings.counterColor}-color)`;
        }
        
        // Update beads
        this.updateBeads();
    }

    // Public API methods
    getStats() {
        return {
            today: this.getTodayCount(),
            weekly: this.getWeekData(),
            total: this.history.reduce((sum, record) => sum + record.count, 0),
            sessions: this.history.length,
            favoriteDhikr: this.getFavoriteDhikr()
        };
    }

    exportData() {
        const data = {
            settings: this.settings,
            history: this.history,
            currentDhikr: this.currentDhikr,
            count: this.count,
            exportedAt: new Date().toISOString()
        };
        
        return JSON.stringify(data, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (data.settings) this.settings = data.settings;
            if (data.history) this.history = data.history;
            if (data.currentDhikr) this.currentDhikr = data.currentDhikr;
            if (data.count) this.count = data.count;
            
            // Save to localStorage
            Utils.setLocalStorage('tasbihSettings', this.settings);
            Utils.setLocalStorage('tasbihHistory', this.history);
            Utils.setLocalStorage('currentDhikr', this.currentDhikr);
            
            // Update UI
            this.updateUI();
            
            Utils.showToast('تم استيراد البيانات بنجاح', 'success');
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            Utils.showToast('فشل استيراد البيانات', 'error');
            return false;
        }
    }

    clearHistory() {
        if (confirm('هل أنت متأكد من مسح كل سجل التسبيح؟')) {
            this.history = [];
            Utils.setLocalStorage('tasbihHistory', []);
            this.reset();
            Utils.showToast('تم مسح السجل', 'success');
            
            // Refresh statistics
            this.refreshStatistics();
        }
    }

    refreshStatistics() {
        const statsContainer = document.querySelector('.tasbih-stats');
        if (statsContainer) {
            const newStats = this.createStatistics();
            statsContainer.parentNode.replaceChild(newStats, statsContainer);
        }
    }

    // Static method to get instance
    static async getInstance() {
        if (!TasbihManager.instance) {
            TasbihManager.instance = new TasbihManager();
            await TasbihManager.instance.init();
        }
        return TasbihManager.instance;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.tasbihManager = await TasbihManager.getInstance();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TasbihManager;
}