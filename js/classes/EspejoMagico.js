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
            // Cerrar otras vistas, que lo maneje el Navegador, pero forzamos esta
            document.querySelectorAll('.vista').forEach(v => v.classList.remove('active'));
            document.getElementById('vista-espejo').classList.add('active');
            
            // Ocultar barra de navegación inferior para el espejo
            document.querySelector('.bottom-nav').style.display = 'none';

            await this.iniciarEspejo();
        });

        this.btnCerrar.addEventListener('click', () => {
            this.detenerEspejo();
            // Restaurar navegación
            document.getElementById('vista-espejo').classList.remove('active');
            document.getElementById('vista-inicio').classList.add('active');
            document.querySelector('.bottom-nav').style.display = 'flex';
        });
    }

    async iniciarEspejo() {
        this.loading.style.display = 'block';
        this.running = true;
        this.resize();
        window.addEventListener('resize', () => this.resize());

        try {
            // Iniciar cámara
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false
            });
            this.video.srcObject = this.stream;
            this.video.muted = true; // REQUERIDO para móviles
            
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    resolve(this.video);
                };
            });
            await this.video.play();

            // Cargar modelo de MediaPipe
            if (!this.handLandmarker) {
                const vision = await window.FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );
                this.handLandmarker = await window.HandLandmarker.createFromOptions(vision, {
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
            }

            this.loading.style.display = 'none';
            this.renderLoop();

        } catch (error) {
            console.error("Error al iniciar cámara o IA: ", error);
            alert("No pudimos encender tu cámara 😢. Asegúrate de dar permisos y no tener la cámara en uso por otra app. (Error: " + error.message + ")");
            this.detenerEspejo();
        }
    }

    detenerEspejo() {
        this.running = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
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
                for (const landmarks of detections.landmarks) {
                    this.procesarGesto(landmarks);
                }
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
