export class JuegoAtrapaBesos {
    constructor() {
        this.container = document.getElementById('canvas-besos-container');
        if (!this.container) return;

        this.btnStart = document.getElementById('start-besos');
        this.scoreElem = document.getElementById('puntos-besos');
        this.timeElem = document.getElementById('tiempo-besos');
        
        // Crear Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.container.clientWidth || 300;
        this.canvas.height = this.container.clientHeight || 300;
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.jugando = false;
        this.animacionId = null;
        this.intervaloTiempo = null;
        
        this.cesta = { x: this.canvas.width / 2 - 25, y: this.canvas.height - 30, width: 50, height: 20, speed: 5 };
        this.items = [];
        this.score = 0;
        this.tiempoRestante = 30;

        // Emojis cayendo
        this.emojis = ['💋', '💖', '🌸', '😘'];

        this.asignarEventos();
    }

    asignarEventos() {
        this.btnStart.addEventListener('click', () => this.iniciar());

        const moverCesta = (e) => {
            if(!this.jugando) return;
            const rect = this.canvas.getBoundingClientRect();
            let clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let x = clientX - rect.left;
            this.cesta.x = x - (this.cesta.width / 2);
            
            // Límites
            if(this.cesta.x < 0) this.cesta.x = 0;
            if(this.cesta.x + this.cesta.width > this.canvas.width) this.cesta.x = this.canvas.width - this.cesta.width;
        };

        this.canvas.addEventListener('mousemove', moverCesta);
        this.canvas.addEventListener('touchmove', moverCesta, {passive: false});

        document.addEventListener('cerrarJuegos', () => {
            this.terminarJuego();
            this.btnStart.style.display = 'block';
            this.container.style.display = 'none';
        });
    }

    iniciar() {
        // Asegurar que el canvas tenga tamaño. Si el cliente devuelve 0, forzamos 300
        this.canvas.width = this.container.clientWidth || 300;
        this.canvas.height = this.container.clientHeight || 300;
        
        // Posicionar cesta basándonos en el nuevo tamaño
        this.cesta.y = this.canvas.height - 30;
        this.cesta.x = this.canvas.width / 2 - 25;
        
        this.score = 0;
        this.tiempoRestante = 30;
        this.items = [];
        this.scoreElem.textContent = this.score;
        this.timeElem.textContent = this.tiempoRestante;
        this.jugando = true;

        this.btnStart.style.display = 'none';
        this.container.style.display = 'block';

        if(this.animacionId) cancelAnimationFrame(this.animacionId);
        if(this.intervaloTiempo) clearInterval(this.intervaloTiempo);

        this.intervaloTiempo = setInterval(() => {
            this.tiempoRestante--;
            this.timeElem.textContent = this.tiempoRestante;
            if(this.tiempoRestante <= 0) {
                this.terminarJuego();
            }
        }, 1000);

        this.loop();
    }

    loop() {
        if (!this.jugando) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar cesta
        this.ctx.fillStyle = '#ff6b81';
        this.ctx.fillRect(this.cesta.x, this.cesta.y, this.cesta.width, this.cesta.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Poppins';
        this.ctx.fillText('Cesta', this.cesta.x + 10, this.cesta.y + 14);

        // Generar items
        if(Math.random() < 0.05) {
            const emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
            this.items.push({
                x: Math.random() * (this.canvas.width - 20),
                y: -20,
                size: 20,
                speed: Math.random() * 2 + 2,
                emoji: emoji
            });
        }

        // Mover y dibujar items
        this.ctx.font = '20px Arial';
        for(let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            item.y += item.speed;
            this.ctx.fillText(item.emoji, item.x, item.y);

            // Colisión con cesta
            if(item.y + item.size > this.cesta.y && item.y < this.cesta.y + this.cesta.height) {
                if(item.x + item.size > this.cesta.x && item.x < this.cesta.x + this.cesta.width) {
                    this.score++;
                    this.scoreElem.textContent = this.score;
                    this.items.splice(i, 1);
                    i--;
                    continue;
                }
            }

            // Eliminar los que caen
            if(item.y > this.canvas.height) {
                this.items.splice(i, 1);
                i--;
            }
        }

        if(this.jugando) {
            this.animacionId = requestAnimationFrame(() => this.loop());
        }
    }

    terminarJuego() {
        this.jugando = false;
        clearInterval(this.intervaloTiempo);
        cancelAnimationFrame(this.animacionId);
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(0,0,this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Poppins';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`¡Tiempo! Puntos: ${this.score}`, this.canvas.width/2, this.canvas.height/2);
        
        this.btnStart.textContent = 'Jugar de nuevo';
        this.btnStart.style.display = 'block';
    }
}
