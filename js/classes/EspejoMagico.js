import { ParticleSystem3D } from './ParticleSystem3D.js';

export class EspejoMagico {
    constructor() {
        this.video = document.getElementById('video-espejo');
        this.canvas = document.getElementById('canvas-espejo');
        this.btnCerrar = document.getElementById('btn-cerrar-espejo');
        this.loading = document.getElementById('espejo-loading');
        
        if (!this.video || !this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.stream = null;
        this.handLandmarker = null;
        this.particles = [];
        this.lastVideoTime = -1;
        this.running = false;
        
        // Formas disponibles (corazones, estrellas, flores)
        this.shapes = ['heart', 'star', 'flower'];
        
        this.initBtnEvent();
    }

    initBtnEvent() {
        document.getElementById('btn-nav-espejo').addEventListener('click', async (e) => {
            e.preventDefault();
            // Cerrar otras vistas
            document.querySelectorAll('.vista').forEach(v => {
                v.classList.remove('active');
                v.style.display = 'none';
            });
            const vistaEspejo = document.getElementById('vista-espejo');
            vistaEspejo.style.display = 'block';
            setTimeout(() => vistaEspejo.classList.add('active'), 50);
            
            // Ocultar barra de navegación inferior para el espejo
            document.querySelector('.bottom-nav').style.display = 'none';

            await this.iniciarEspejo();
        });

        this.btnCerrar.addEventListener('click', () => {
            this.detenerEspejo();
            // Restaurar navegación
            const vistaEspejo = document.getElementById('vista-espejo');
            vistaEspejo.classList.remove('active');
            vistaEspejo.style.display = 'none';
            
            const vistaInicio = document.getElementById('vista-inicio');
            vistaInicio.style.display = 'block';
            setTimeout(() => vistaInicio.classList.add('active'), 50);
            
            document.querySelector('.bottom-nav').style.display = 'flex';
        });
    }

    async iniciarEspejo() {
        this.loading.style.display = 'block';
        this.running = true;
        this.resize();
        window.addEventListener('resize', () => this.resize());

        try {
            const isMobile = window.innerWidth < 768;
            const constraints = {
                video: {
                    facingMode: 'user',
                    width: isMobile ? { ideal: window.innerHeight } : { ideal: 1280 },
                    height: isMobile ? { ideal: window.innerWidth } : { ideal: 720 }
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = stream;
            
            // Inicializar sistema de partículas 3D
            if (!this.particleSystem) {
                this.particleSystem = new ParticleSystem3D('canvas-3d-container');
                document.getElementById('espejo-ui').style.display = 'block';
            }

            const musicPlayer = document.querySelector('.music-player');
            if (musicPlayer) musicPlayer.classList.add('espejo-mode');
            this.video.muted = true; // REQUERIDO para móviles
            
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    resolve(this.video);
                };
            });
            this.resize();
            await this.video.play();

            // Cargar modelo de MediaPipe dinámicamente para no bloquear carga inicial en móviles
            if (!this.handLandmarker) {
                const mediapipe = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/+esm');
                const { FilesetResolver, HandLandmarker } = mediapipe;
                
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );
                
                try {
                    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                            delegate: "GPU"
                        },
                        runningMode: "VIDEO",
                        numHands: 2,
                        minHandDetectionConfidence: 0.5,
                        minHandPresenceConfidence: 0.5,
                        minTrackingConfidence: 0.5
                    });
                } catch (gpuError) {
                    console.warn("GPU delegate falló en móvil/navegador, cayendo a CPU:", gpuError);
                    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`
                        },
                        runningMode: "VIDEO",
                        numHands: 2,
                        minHandDetectionConfidence: 0.5,
                        minHandPresenceConfidence: 0.5,
                        minTrackingConfidence: 0.5
                    });
                }
            }

            this.loading.style.display = 'none';
            this.renderLoop();

        } catch (error) {
            console.error("Error al iniciar cámara o IA: ", error);
            alert("No pudimos encender tu cámara 😢. Asegúrate de dar permisos y no tener la cámara en uso por otra app. (Error: " + error.message + ")");
            this.btnCerrar.click();
        }
    }

    detenerEspejo() {
        this.running = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.video) {
            this.video.srcObject = null;
        }
        
        if (this.particleSystem) {
            this.particleSystem.destroy();
            this.particleSystem = null;
        }
        
        const ui = document.getElementById('espejo-ui');
        if (ui) ui.style.display = 'none';
        
        const musicPlayer = document.querySelector('.music-player');
        if (musicPlayer) musicPlayer.classList.remove('espejo-mode');
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles = [];
        this.resize();
    }

    resize() {
        if (this.video && this.video.videoWidth > 0) {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    async renderLoop() {
        if (!this.running) return;

        // Limpiar canvas y dibujar video (Espejado)
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reflejar horizontalmente
        this.ctx.translate(this.canvas.width, 0);
        this.ctx.scale(-1, 1);
        
        // Dibujar el video cubriendo todo
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        // Procesar IA
        if (this.handLandmarker && this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;
            const detections = this.handLandmarker.detectForVideo(this.video, performance.now());
            
            if (detections.landmarks) {
                // Enviar todas las manos detectadas al sistema holográfico 3D
                if (this.particleSystem) {
                    this.particleSystem.updateHands(detections.landmarks, this.video.videoWidth || 1280, this.video.videoHeight || 720);
                }

                for (const landmarks of detections.landmarks) {
                    this.procesarGesto(landmarks);
                }
            } else if (this.particleSystem) {
                // Si no hay manos, avisar al sistema
                this.particleSystem.updateHands([], this.video.videoWidth || 1280, this.video.videoHeight || 720);
            }
        }

        // Actualizar y dibujar partículas
        this.dibujarParticulas();

        requestAnimationFrame(() => this.renderLoop());
    }

    procesarGesto(landmarks) {
        // Dedo índice
        const indexFingerTip = landmarks[8];
        
        // MediaPipe da coordenadas normalizadas [0, 1]
        // OJO: Como espejamos el video en el canvas, debemos invertir X aquí también
        const x = (1 - indexFingerTip.x) * this.canvas.width;
        const y = indexFingerTip.y * this.canvas.height;

        // Detectar si la mano está abierta o cerrada
        const middleFingerTip = landmarks[12];
        const wrist = landmarks[0];
        const distance = Math.hypot(middleFingerTip.x - wrist.x, middleFingerTip.y - wrist.y);
        
        // Distancia pulgar - indice (para otro gesto)
        const thumbTip = landmarks[4];
        const pinchDist = Math.hypot(thumbTip.x - indexFingerTip.x, thumbTip.y - indexFingerTip.y);

        let shape = 'heart';
        let color = '#ff4757';

        if (pinchDist < 0.05) {
            // Haciendo pincitas -> Estrellas doradas
            shape = 'star';
            color = '#f1c40f';
        } else if (distance < 0.2) {
            // Puño cerrado -> Flores moradas/rosas
            shape = 'flower';
            color = '#9b59b6';
        }

        // Generar partículas en la punta del índice
        if (Math.random() > 0.4) {
            this.particles.push({
                x: x,
                y: y,
                shape: shape,
                color: color,
                size: Math.random() * 15 + 10,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4 - 2, // Tienden a subir
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01,
                rotation: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.2
            });
        }
    }

    dibujarParticulas() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            
            p.x += p.speedX;
            p.y += p.speedY;
            p.rotation += p.spin;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;

            if (p.shape === 'heart') {
                this.drawHeart(this.ctx, 0, 0, p.size);
            } else if (p.shape === 'star') {
                this.drawStar(this.ctx, 0, 0, 5, p.size, p.size / 2);
            } else if (p.shape === 'flower') {
                this.drawFlower(this.ctx, 0, 0, p.size);
            }
            
            this.ctx.restore();
        }
    }

    drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(x, y + topCurveHeight);
        ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
        ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
        ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
        ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
        ctx.fill();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.fill();
    }

    drawFlower(ctx, x, y, size) {
        const petals = 5;
        for (let i = 0; i < petals; i++) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((Math.PI * 2 / petals) * i);
            ctx.beginPath();
            ctx.ellipse(0, -size / 2, size / 3, size / 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        // Centro amarillo
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(x, y, size / 4, 0, Math.PI * 2);
        ctx.fill();
    }
}
