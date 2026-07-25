export class ParticleSystem3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container || typeof THREE === 'undefined') {
            console.error('Three.js or container not found');
            return;
        }

        this.isAnimating = true;
        this.targetRotation = { x: 0, y: 0 };
        this.currentRotation = { x: 0, y: 0 };
        this.targetScale = 1.0;
        this.currentScale = 1.0;
        
        this.initThree();
        this.createParticles();
        this.bindEvents();
        
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 6;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.hologramGroup = new THREE.Group();
        this.scene.add(this.hologramGroup);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    createParticles() {
        this.particleCount = 6000;
        this.geometry = new THREE.BufferGeometry();
        
        this.positions = new Float32Array(this.particleCount * 3);
        this.basePositions = new Float32Array(this.particleCount * 3);
        this.velocities = new Float32Array(this.particleCount * 3);
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        
        this.material = new THREE.PointsMaterial({
            color: new THREE.Color(document.getElementById('espejo-color')?.value || 0xff4757),
            size: 0.06,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.hologramGroup.add(this.points);

        // Load initial pattern
        const initialPattern = document.getElementById('espejo-pattern')?.value || 'sphere';
        this.changePattern(initialPattern);
    }

    bindEvents() {
        const colorInput = document.getElementById('espejo-color');
        if (colorInput) {
            colorInput.addEventListener('input', (e) => {
                this.material.color.setHex(parseInt(e.target.value.replace('#', '0x')));
            });
        }

        const patternSelect = document.getElementById('espejo-pattern');
        if (patternSelect) {
            patternSelect.addEventListener('change', (e) => {
                this.changePattern(e.target.value);
            });
        }

        const btnAnim = document.getElementById('btn-anim-espejo');
        if (btnAnim) {
            btnAnim.addEventListener('click', () => {
                this.isAnimating = !this.isAnimating;
                btnAnim.innerHTML = this.isAnimating ? '<i class="fas fa-pause"></i> Pausar Animación' : '<i class="fas fa-play"></i> Reanudar Animación';
            });
        }
    }

    changePattern(patternName) {
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            let x = 0, y = 0, z = 0;

            if (patternName === 'sphere') {
                const radius = 3 * Math.cbrt(Math.random());
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos(2 * Math.random() - 1);
                x = radius * Math.sin(phi) * Math.cos(theta);
                y = radius * Math.sin(phi) * Math.sin(theta);
                z = radius * Math.cos(phi);
            } 
            else if (patternName === 'cube') {
                x = (Math.random() - 0.5) * 4;
                y = (Math.random() - 0.5) * 4;
                z = (Math.random() - 0.5) * 4;
            } 
            else if (patternName === 'heart') {
                const t = (Math.random() - 0.5) * 2 * Math.PI;
                const r = 0.15;
                x = r * 16 * Math.pow(Math.sin(t), 3);
                y = r * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
                z = (Math.random() - 0.5) * 1.5;
            }
            else if (patternName === 'galaxy') {
                const radius = Math.random() * 4;
                const branches = 4;
                const spinAngle = radius * 1.5;
                const branchAngle = (i % branches) / branches * Math.PI * 2;
                
                const randomSpread = (Math.random() - 0.5) * (Math.random() * 0.8);

                x = Math.cos(branchAngle + spinAngle) * radius + randomSpread;
                y = (Math.random() - 0.5) * 0.5;
                z = Math.sin(branchAngle + spinAngle) * radius + randomSpread;
            }
            else if (patternName === 'tornado') {
                const height = (Math.random() - 0.5) * 6;
                const radius = (height + 3) * 0.5 * Math.random();
                const angle = height * 4 + Math.random() * Math.PI * 2;
                x = Math.cos(angle) * radius;
                y = height;
                z = Math.sin(angle) * radius;
            }
            else if (patternName === 'dna') {
                const height = (Math.random() - 0.5) * 6;
                const angle = height * 2;
                const strand = i % 2 === 0 ? 1 : -1;
                const radius = 1.2;
                x = Math.cos(angle + (strand === 1 ? 0 : Math.PI)) * radius;
                y = height;
                z = Math.sin(angle + (strand === 1 ? 0 : Math.PI)) * radius;
                
                // Add bridges between strands
                if (Math.random() > 0.8) {
                    const lerp = Math.random();
                    const x1 = Math.cos(angle) * radius;
                    const z1 = Math.sin(angle) * radius;
                    const x2 = Math.cos(angle + Math.PI) * radius;
                    const z2 = Math.sin(angle + Math.PI) * radius;
                    x = x1 + (x2 - x1) * lerp;
                    z = z1 + (z2 - z1) * lerp;
                }
                
                // Add noise
                x += (Math.random() - 0.5) * 0.2;
                y += (Math.random() - 0.5) * 0.2;
                z += (Math.random() - 0.5) * 0.2;
            }

            this.basePositions[i3] = x;
            this.basePositions[i3 + 1] = y;
            this.basePositions[i3 + 2] = z;
        }
    }

    updateHandState(normalizedX, normalizedY, openness) {
        // Iron Man Style Interaction
        
        // 1. Rotation mapping: Map hand X, Y to rotation angles
        // normalizedX goes 0 to 1 (left to right) -> map to Y axis rotation (-PI to PI)
        // normalizedY goes 0 to 1 (top to bottom) -> map to X axis rotation (-PI/2 to PI/2)
        this.targetRotation.y = (normalizedX - 0.5) * Math.PI * 2;
        this.targetRotation.x = (normalizedY - 0.5) * Math.PI;

        // 2. Scale mapping: Map hand openness (0 to 1) to scale (0.2 to 2.0)
        // openness is distance between fingers. High distance = large scale.
        // We expect openness to roughly be between 0.0 (closed) and 0.5 (wide open)
        const mappedScale = 0.5 + (openness * 4); // If openness=0 -> 0.5. If 0.5 -> 2.5
        this.targetScale = Math.max(0.2, Math.min(mappedScale, 3.0));
    }

    animate() {
        requestAnimationFrame(this.animate);
        
        // Smoothly interpolate rotation and scale (Lerp)
        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.1;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.1;
        this.currentScale += (this.targetScale - this.currentScale) * 0.1;

        this.hologramGroup.rotation.x = this.currentRotation.x;
        this.hologramGroup.rotation.y = this.currentRotation.y;
        this.hologramGroup.scale.set(this.currentScale, this.currentScale, this.currentScale);

        // Particle Physics
        const pos = this.geometry.attributes.position.array;
        const time = Date.now() * 0.001;

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            const bx = this.basePositions[i3];
            const by = this.basePositions[i3 + 1];
            const bz = this.basePositions[i3 + 2];

            let targetX = bx;
            let targetY = by;
            let targetZ = bz;

            // Optional idle animation (breathing/waving)
            if (this.isAnimating) {
                const noise = Math.sin(time * 2 + bx) * 0.1;
                targetX += noise;
                targetY += Math.cos(time * 2 + by) * 0.1;
                targetZ += Math.sin(time * 2 + bz) * 0.1;
            }

            // Spring physics to return to base/target shape
            const px = pos[i3];
            const py = pos[i3 + 1];
            const pz = pos[i3 + 2];

            const dx = targetX - px;
            const dy = targetY - py;
            const dz = targetZ - pz;

            this.velocities[i3] += dx * 0.05;
            this.velocities[i3 + 1] += dy * 0.05;
            this.velocities[i3 + 2] += dz * 0.05;

            // Damping
            this.velocities[i3] *= 0.8;
            this.velocities[i3 + 1] *= 0.8;
            this.velocities[i3 + 2] *= 0.8;

            pos[i3] += this.velocities[i3];
            pos[i3 + 1] += this.velocities[i3 + 1];
            pos[i3 + 2] += this.velocities[i3 + 2];
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.renderer.render(this.scene, this.camera);
    }
    
    destroy() {
        if (this.container && this.renderer) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}
