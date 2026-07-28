import { ParticleSystem3D } from './ParticleSystem3D.js';

export class EspejoMagico {
    constructor() {
        this.video = document.getElementById('video-espejo');
        this.canvas = document.getElementById('canvas-espejo');
        this.btnCerrar = document.getElementById('btn-cerrar-espejo');
        this.loading = document.getElementById('espejo-loading');
        this.btnLimpiarUI = document.getElementById('btn-limpiar-ui');
        this.btnSwitchCamera = document.getElementById('btn-switch-camera');
        this.btnTakePhoto = document.getElementById('btn-take-photo');
        this.canvas3D = document.getElementById('canvas-3d-container');
        
        if (!this.video || !this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.stream = null;
        this.handLandmarker = null;
        this.particles = [];
        this.lastVideoTime = -1;
        this.running = false;
        this.efectosOcultos = false;
        this.facingMode = 'user'; // Por defecto, cámara frontal
        
        // Formas disponibles (corazones, estrellas, flores)
        this.shapes = ['heart', 'star', 'flower'];
        
        this.initBtnEvent();
    }

    initBtnEvent() {
        if (this.btnLimpiarUI) {
            this.btnLimpiarUI.addEventListener('click', () => {
                document.body.classList.add('ui-hidden');
            });
        }
        
        // Restaurar UI al tocar la pantalla limpia
        document.getElementById('vista-espejo').addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'I' && !e.target.closest('.espejo-panel') && !e.target.closest('.camera-controls')) {
                document.body.classList.remove('ui-hidden');
            }
        });

        if (this.btnSwitchCamera) {
            this.btnSwitchCamera.addEventListener('click', async () => {
                this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
                if (this.facingMode === 'environment') {
                    this.video.style.transform = 'scaleX(1)';
                } else {
                    this.video.style.transform = 'scaleX(-1)';
                }
                
                if (this.stream) {
                    this.stream.getTracks().forEach(track => track.stop());
                }
                
                try {
                    const isMobile = window.innerWidth < 768;
                    const constraints = {
                        video: {
                            facingMode: this.facingMode,
                            width: isMobile ? { ideal: window.innerHeight } : { ideal: 1280 },
                            height: isMobile ? { ideal: window.innerWidth } : { ideal: 720 }
                        }
                    };
                    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
                    this.video.srcObject = this.stream;
                    await this.video.play();
                } catch (error) {
                    console.error("Error al girar cámara", error);
                }
            });
        }

        if (this.btnTakePhoto) {
            this.btnTakePhoto.addEventListener('click', () => {
                this.tomarFoto();
            });
        }

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
                    facingMode: this.facingMode,
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

            // Mostrar video al instante sin esperar la descarga de MediaPipe en móviles
            this.loading.style.display = 'none';
            this.renderLoop();

            // Cargar modelo de MediaPipe dinámicamente en segundo plano
            if (!this.handLandmarker) {
                try {
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
                } catch (mpErr) {
                    console.error("Error al cargar MediaPipe:", mpErr);
                }
            }

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
        document.body.classList.remove('ui-hidden');
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    async renderLoop() {
        if (!this.running) return;

        if (this.efectosOcultos) {
            requestAnimationFrame(() => this.renderLoop());
            return;
        }

        // Limpiar canvas de partículas 2D (el video se renderiza por CSS/hardware GPU)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
        
        // Mapeo preciso compensando object-fit: cover en móviles
        const W_w = this.canvas.width;
        const W_h = this.canvas.height;
        const vidW = this.video.videoWidth || 1280;
        const vidH = this.video.videoHeight || 720;
        const scale = Math.max(W_w / vidW, W_h / vidH);
        const dispW = vidW * scale;
        const dispH = vidH * scale;
        const offsetX = (dispW - W_w) / 2;
        const offsetY = (dispH - W_h) / 2;
        
        const screenX = (indexFingerTip.x * dispW) - offsetX;
        const screenY = (indexFingerTip.y * dispH) - offsetY;
        const x = W_w - screenX;
        const y = screenY;

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

    tomarFoto() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');

        // Flash blanco
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0'; flash.style.left = '0';
        flash.style.width = '100%'; flash.style.height = '100%';
        flash.style.backgroundColor = 'white';
        flash.style.zIndex = '9999';
        flash.style.transition = 'opacity 0.4s';
        document.getElementById('vista-espejo').appendChild(flash);
        setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 400); }, 50);

        // 1. Dibujar el video
        const vidW = this.video.videoWidth;
        const vidH = this.video.videoHeight;
        const scale = Math.max(w / vidW, h / vidH);
        const dispW = vidW * scale;
        const dispH = vidH * scale;
        const offsetX = (w - dispW) / 2;
        const offsetY = (h - dispH) / 2;

        if (this.facingMode === 'user') {
            tempCtx.translate(w, 0);
            tempCtx.scale(-1, 1);
        }
        
        tempCtx.drawImage(this.video, offsetX, offsetY, dispW, dispH);
        
        if (this.facingMode === 'user') {
            tempCtx.setTransform(1, 0, 0, 1, 0, 0);
        }

        // 2. Dibujar el canvas 3D si hay efectos
        const webglCanvas = this.canvas3D.querySelector('canvas');
        if (webglCanvas) {
            tempCtx.drawImage(webglCanvas, 0, 0, w, h);
        }

        // 3. Dibujar las partículas 2D (manos)
        tempCtx.drawImage(this.canvas, 0, 0, w, h);

        // Forzar la descarga
        const dataUrl = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `recuerdo_${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
