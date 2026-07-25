export class ParticleSystem3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container || typeof THREE === 'undefined') {
            console.error('Three.js or container not found');
            return;
        }

        this.initThree();
        this.createParticles();
        this.bindEvents();
        
        this.targetPoint = new THREE.Vector3(0, 0, 0);
        this.handState = 'open'; // 'open' | 'closed'
        
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        this.scene = new THREE.Scene();
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimization
        this.container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    createParticles() {
        this.particleCount = 5000;
        this.geometry = new THREE.BufferGeometry();
        
        this.positions = new Float32Array(this.particleCount * 3);
        this.basePositions = new Float32Array(this.particleCount * 3);
        this.velocities = new Float32Array(this.particleCount * 3);
        
        // Initial random sphere
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            const radius = 3 * Math.cbrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            this.positions[i3] = x;
            this.positions[i3 + 1] = y;
            this.positions[i3 + 2] = z;
            
            this.basePositions[i3] = x;
            this.basePositions[i3 + 1] = y;
            this.basePositions[i3 + 2] = z;

            this.velocities[i3] = 0;
            this.velocities[i3 + 1] = 0;
            this.velocities[i3 + 2] = 0;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        
        this.material = new THREE.PointsMaterial({
            color: new THREE.Color(document.getElementById('espejo-color')?.value || 0xff4757),
            size: 0.05,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);
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
        
        const fullscreenBtn = document.getElementById('btn-fullscreen-espejo');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                const vista = document.getElementById('vista-espejo');
                if (!document.fullscreenElement) {
                    vista.requestFullscreen().catch(err => {
                        console.error(`Error entering fullscreen: ${err.message}`);
                    });
                } else {
                    document.exitFullscreen();
                }
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
                // Heart math equation
                const t = (Math.random() - 0.5) * 2 * Math.PI;
                const r = 0.15;
                x = r * 16 * Math.pow(Math.sin(t), 3);
                y = r * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
                z = (Math.random() - 0.5) * 1;
                
                // Add some volume
                x += (Math.random() - 0.5) * 0.5;
                y += (Math.random() - 0.5) * 0.5;
            }
            else if (patternName === 'galaxy') {
                const radius = Math.random() * 4;
                const branches = 3;
                const spinAngle = radius * 2;
                const branchAngle = (i % branches) / branches * Math.PI * 2;
                
                const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;
                const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;
                const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;

                x = Math.cos(branchAngle + spinAngle) * radius + randomX;
                y = randomY;
                z = Math.sin(branchAngle + spinAngle) * radius + randomZ;
            }

            this.basePositions[i3] = x;
            this.basePositions[i3 + 1] = y;
            this.basePositions[i3 + 2] = z;
        }
    }

    updateHandState(normalizedX, normalizedY, handState) {
        // Map normalized coordinates [0, 1] to 3D space
        const fov = this.camera.fov * (Math.PI / 180);
        const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
        const width = height * this.camera.aspect;

        const targetX = (normalizedX - 0.5) * width;
        const targetY = -(normalizedY - 0.5) * height; // Y is flipped in 3D

        this.targetPoint.set(targetX, targetY, 0);
        this.handState = handState;
    }

    animate() {
        requestAnimationFrame(this.animate);
        
        const pos = this.geometry.attributes.position.array;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            const px = pos[i3];
            const py = pos[i3 + 1];
            const pz = pos[i3 + 2];
            
            const bx = this.basePositions[i3];
            const by = this.basePositions[i3 + 1];
            const bz = this.basePositions[i3 + 2];

            let dx = 0, dy = 0, dz = 0;

            if (this.handState === 'closed') {
                // Attract to hand target
                dx = this.targetPoint.x - px;
                dy = this.targetPoint.y - py;
                dz = this.targetPoint.z - pz;
                
                // Add some noise
                dx += (Math.random() - 0.5) * 2;
                dy += (Math.random() - 0.5) * 2;
                dz += (Math.random() - 0.5) * 2;

            } else {
                // Return to base pattern
                dx = bx - px;
                dy = by - py;
                dz = bz - pz;
                
                if (document.getElementById('espejo-pattern')?.value === 'galaxy') {
                    const sin = Math.sin(0.01);
                    const cos = Math.cos(0.01);
                    this.basePositions[i3] = bx * cos - bz * sin;
                    this.basePositions[i3 + 2] = bz * cos + bx * sin;
                }
            }

            // Spring physics
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
