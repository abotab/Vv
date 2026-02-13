class AnimatedStudio {
    constructor() {
        this.textElement = document.querySelector('.animated-text');
        this.colors = ['#ffffff', '#ffd700', '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181', '#aa96da'];
        this.currentColorIndex = 0;
        this.init();
    }

    init() {
        if (this.textElement) {
            this.addClickListener();
            this.addMouseMoveEffect();
        }
    }

    addClickListener() {
        this.textElement.addEventListener('click', () => {
            this.changeColor();
            this.createParticles();
        });
    }

    changeColor() {
        this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;
        this.textElement.style.color = this.colors[this.currentColorIndex];
    }

    addMouseMoveEffect() {
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            const rotateX = (y - 0.5) * 20;
            const rotateY = (x - 0.5) * -20;
            
            this.textElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
    }

    createParticles() {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '10px';
        particle.style.height = '10px';
        particle.style.backgroundColor = this.colors[this.currentColorIndex];
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.left = Math.random() * window.innerWidth + 'px';
        particle.style.top = '50%';
        particle.style.animation = 'particleAnimation 1s ease-out forwards';
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }
}

const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes particleAnimation {
        0% {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translateY(-200px) scale(0);
            opacity: 0;
        }
    }
`;
document.head.appendChild(styleSheet);

const studio = new AnimatedStudio();
