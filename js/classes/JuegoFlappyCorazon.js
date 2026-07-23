export class JuegoFlappyCorazon {
    constructor() {
        this.canvas = document.getElementById('canvas-flappy');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.btnStart = document.getElementById('start-flappy');
        this.scoreElem = document.getElementById('puntos-flappy');
        
        this.animacionId = null;
        this.jugando = false;
        
        // Pájaro (Corazón)
        this.pajaro = { x: 50, y: 150, radius: 12, velocity: 0, gravity: 0.5, jump: -7 };
        
        // Tuberías
        this.tuberias = [];
        this.tuberiaAncho = 40;
        this.gap = 120;
        this.frames = 0;
        this.score = 0;

        this.asignarEventos();
    }

    asignarEventos() {
        this.btnStart.addEventListener('click', () => this.iniciar());
        
        const saltar = (e) => {
            if(e.type === 'touchstart') e.preventDefault();
            if(this.jugando) this.pajaro.velocity = this.pajaro.jump;
        };
        
        this.canvas.addEventListener('mousedown', saltar);
        this.canvas.addEventListener('touchstart', saltar, {passive: false});

        // Soporte para PC (Barra espaciadora o Flecha Arriba)
        window.addEventListener('keydown', (e) => {
            if (this.jugando && (e.code === 'Space' || e.code === 'ArrowUp')) {
                e.preventDefault(); // Evitar que la página haga scroll
                this.pajaro.velocity = this.pajaro.jump;
            }
        });

        document.addEventListener('cerrarJuegos', () => {
            this.jugando = false;
            cancelAnimationFrame(this.animacionId);
            this.btnStart.style.display = 'block';
            this.canvas.style.display = 'none';
        });
    }

    iniciar() {
        this.pajaro.y = 150;
        this.pajaro.velocity = 0;
        this.tuberias = [];
        this.frames = 0;
        this.score = 0;
        this.scoreElem.textContent = this.score;
        this.jugando = true;
        
        this.btnStart.style.display = 'none';
        this.canvas.style.display = 'block';
        
        if(this.animacionId) cancelAnimationFrame(this.animacionId);
        this.loop();
    }

    dibujarCorazon(x, y, size) {
        this.ctx.fillStyle = '#ff4d6d';
        this.ctx.beginPath();
        const topCurveHeight = size * 0.3;
        this.ctx.moveTo(x, y + topCurveHeight);
        // top left curve
        this.ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
        // bottom left curve
        this.ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
        // bottom right curve
        this.ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
        // top right curve
        this.ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
        this.ctx.closePath();
        this.ctx.fill();
    }

    loop() {
        if (!this.jugando) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.frames++;

        // Físicas del corazón
        this.pajaro.velocity += this.pajaro.gravity;
        this.pajaro.y += this.pajaro.velocity;

        // Dibujar corazón
        this.dibujarCorazon(this.pajaro.x, this.pajaro.y - this.pajaro.radius, this.pajaro.radius * 2.5);

        // Generar tuberías
        if (this.frames % 90 === 0) {
            let topHeight = Math.random() * (this.canvas.height - this.gap - 50) + 20;
            this.tuberias.push({
                x: this.canvas.width,
                y: 0,
                width: this.tuberiaAncho,
                height: topHeight,
                passed: false
            });
        }

        // Mover y dibujar tuberías
        this.ctx.fillStyle = '#ffb3c6';
        for (let i = 0; i < this.tuberias.length; i++) {
            let t = this.tuberias[i];
            t.x -= 2;

            // Tubería de arriba
            this.ctx.fillRect(t.x, t.y, t.width, t.height);
            // Tubería de abajo
            this.ctx.fillRect(t.x, t.height + this.gap, t.width, this.canvas.height - t.height - this.gap);

            // Colisiones
            if (this.pajaro.x + this.pajaro.radius > t.x && this.pajaro.x - this.pajaro.radius < t.x + t.width) {
                if (this.pajaro.y - this.pajaro.radius < t.height || this.pajaro.y + this.pajaro.radius > t.height + this.gap) {
                    this.gameOver();
                }
            }

            // Puntuación
            if (t.x + t.width < this.pajaro.x && !t.passed) {
                this.score++;
                this.scoreElem.textContent = this.score;
                t.passed = true;
            }
        }

        // Eliminar tuberías que salieron de pantalla
        if (this.tuberias.length > 0 && this.tuberias[0].x < -this.tuberiaAncho) {
            this.tuberias.shift();
        }

        // Colisión suelo y techo
        if (this.pajaro.y + this.pajaro.radius >= this.canvas.height || this.pajaro.y - this.pajaro.radius <= 0) {
            this.gameOver();
        }

        if(this.jugando) {
            this.animacionId = requestAnimationFrame(() => this.loop());
        }
    }

    gameOver() {
        this.jugando = false;
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(0,0,this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Poppins';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('¡Ups! Chocaste', this.canvas.width/2, this.canvas.height/2);
        this.btnStart.textContent = 'Reintentar';
        this.btnStart.style.display = 'block';
    }
}
