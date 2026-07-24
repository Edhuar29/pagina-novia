export class JuegoViajeBYD {
    constructor() {
        this.canvas = document.getElementById('canvas-byd');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.progresoSpan = document.getElementById('progreso-byd');
        this.btnNiveles = document.querySelectorAll('.niveles-byd .btn-jugar');
        
        this.ancho = this.canvas.width;
        this.alto = this.canvas.height;
        this.pisoY = this.alto - 40;

        this.enJuego = false;
        this.gameOver = false;
        this.victoria = false;
        
        this.nivelActual = 'medio';
        this.velocidadFondo = 3;
        this.frecuenciaObstaculos = 120; // frames
        
        this.distanciaTotal = 2000;
        this.distanciaRecorrida = 0;
        this.frames = 0;
        this.obstaculos = [];

        this.carro = {
            x: 50,
            y: this.pisoY - 60,
            w: 100,
            h: 60,
            velY: 0,
            saltando: false,
            gravedad: 0.6,
            saltoFuerza: -12
        };

        this.asignarEventos();
    }

    asignarEventos() {
        // Seleccionar nivel y empezar
        this.btnNiveles.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.iniciarJuego(e.target.dataset.nivel);
            });
        });

        // Controles de salto (pantalla táctil o espacio)
        const saltar = (e) => {
            if(e.type !== 'mousedown') e.preventDefault();
            if(!this.enJuego && !this.gameOver && !this.victoria) return;
            
            if(this.gameOver || this.victoria) {
                this.iniciarJuego(this.nivelActual); // Reiniciar
                return;
            }

            if (!this.carro.saltando) {
                this.carro.velY = this.carro.saltoFuerza;
                this.carro.saltando = true;
            }
        };

        this.canvas.addEventListener('touchstart', saltar, {passive: false});
        this.canvas.addEventListener('mousedown', saltar);
        document.addEventListener('keydown', (e) => {
            if(e.code === 'Space' && this.canvas.offsetParent !== null) {
                e.preventDefault();
                saltar(e);
            }
        });

        // Escuchar el evento de cerrar juegos
        document.addEventListener('cerrarJuegos', () => {
            this.enJuego = false;
            this.limpiarCanvas();
        });
    }

    iniciarJuego(nivel) {
        this.nivelActual = nivel;
        this.distanciaRecorrida = 0;
        this.frames = 0;
        this.obstaculos = [];
        this.gameOver = false;
        this.victoria = false;
        this.enJuego = true;
        this.carro.y = this.pisoY - this.carro.h;
        this.carro.velY = 0;
        this.carro.saltando = false;

        // Configurar nivel
        if(nivel === 'facil') {
            this.velocidadFondo = 3;
            this.frecuenciaObstaculos = 150;
            this.distanciaTotal = 1500;
        } else if (nivel === 'medio') {
            this.velocidadFondo = 4.5;
            this.frecuenciaObstaculos = 100;
            this.distanciaTotal = 2500;
        } else { // dificil
            this.velocidadFondo = 6.5;
            this.frecuenciaObstaculos = 80;
            this.distanciaTotal = 4000;
        }

        // Permitir que el canvas reciba eventos de teclado
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
        this.canvas.style.display = 'block';

        this.loop();
    }

    loop() {
        if (!this.enJuego) return;

        this.actualizar();
        this.dibujar();

        if(this.enJuego) {
            requestAnimationFrame(() => this.loop());
        }
    }

    actualizar() {
        if(this.gameOver || this.victoria) return;

        this.frames++;
        this.distanciaRecorrida += this.velocidadFondo;

        // Física del salto
        this.carro.velY += this.carro.gravedad;
        this.carro.y += this.carro.velY;

        // Colisión con el piso
        if (this.carro.y > this.pisoY - this.carro.h) {
            this.carro.y = this.pisoY - this.carro.h;
            this.carro.velY = 0;
            this.carro.saltando = false;
        }

        // Progreso
        let porc = Math.floor((this.distanciaRecorrida / this.distanciaTotal) * 100);
        if(porc > 100) porc = 100;
        this.progresoSpan.textContent = porc;

        if (this.distanciaRecorrida >= this.distanciaTotal) {
            this.victoria = true;
            this.enJuego = false;
            this.dibujar(); // Dibujar pantalla de victoria final
            return;
        }

        // Generar obstáculos
        if (this.frames % this.frecuenciaObstaculos === 0 && this.distanciaRecorrida < this.distanciaTotal - 300) {
            this.obstaculos.push({
                x: this.ancho,
                y: this.pisoY - 30,
                w: 25,
                h: 30
            });
        }

        // Mover y limpiar obstáculos
        for (let i = 0; i < this.obstaculos.length; i++) {
            let obs = this.obstaculos[i];
            obs.x -= this.velocidadFondo;

            // Colisión (Hitbox ajustado para ser amable)
            let hitboxCarro = { x: this.carro.x + 10, y: this.carro.y + 10, w: this.carro.w - 20, h: this.carro.h - 15 };
            let hitboxObs = { x: obs.x + 5, y: obs.y + 5, w: obs.w - 10, h: obs.h - 5 };

            if (hitboxCarro.x < hitboxObs.x + hitboxObs.w &&
                hitboxCarro.x + hitboxCarro.w > hitboxObs.x &&
                hitboxCarro.y < hitboxObs.y + hitboxObs.h &&
                hitboxCarro.y + hitboxCarro.h > hitboxObs.y) {
                this.gameOver = true;
                this.enJuego = false;
                this.dibujar(); // Dibujar pantalla de choque final
            }
        }

        this.obstaculos = this.obstaculos.filter(obs => obs.x + obs.w > 0);
    }

    dibujar() {
        // Fondo del cielo y ciudad/playa
        if(this.distanciaRecorrida > this.distanciaTotal - 800) {
            // Zona de transición a la playa
            this.ctx.fillStyle = '#87CEEB'; // Cielo claro
            this.ctx.fillRect(0, 0, this.ancho, this.alto);
            // Sol
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(this.ancho - 80, 60, 40, 0, Math.PI*2);
            this.ctx.fill();
        } else {
            // Zona ciudad/carretera normal
            this.ctx.fillStyle = '#A0D8EF';
            this.ctx.fillRect(0, 0, this.ancho, this.alto);
        }

        // Piso
        if(this.distanciaRecorrida > this.distanciaTotal - 600) {
            this.ctx.fillStyle = '#EED690'; // Arena
        } else {
            this.ctx.fillStyle = '#555'; // Asfalto
        }
        this.ctx.fillRect(0, this.pisoY, this.ancho, this.alto - this.pisoY);

        // Nubes (movimiento lento)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        let nubeX = (this.frames * 0.5) % (this.ancho + 200);
        this.dibujarNube(this.ancho - nubeX, 50);
        this.dibujarNube(this.ancho - nubeX + 300, 80);

        // Carro BYD
        this.dibujarCarro(this.carro.x, this.carro.y, this.carro.w, this.carro.h);

        // Obstáculos
        for (let obs of this.obstaculos) {
            this.dibujarObstaculo(obs.x, obs.y, obs.w, obs.h);
        }

        // Textos de fin de juego
        if (this.victoria) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            this.ctx.fillRect(0, 0, this.ancho, this.alto);
            this.ctx.fillStyle = '#ff7f50';
            this.ctx.font = '24px Poppins, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('¡Llegamos a la playa!', this.ancho/2, this.alto/2 - 10);
            this.ctx.fillStyle = '#333';
            this.ctx.font = '16px Poppins, sans-serif';
            this.ctx.fillText('Contigo voy al fin del mundo 💖', this.ancho/2, this.alto/2 + 20);
            this.ctx.fillText('Toca para jugar otra vez', this.ancho/2, this.alto/2 + 60);
        } else if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(0, 0, this.ancho, this.alto);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Poppins, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('¡Ups! Chocamos 💥', this.ancho/2, this.alto/2);
            this.ctx.font = '16px Poppins, sans-serif';
            this.ctx.fillText('Toca para intentar de nuevo', this.ancho/2, this.alto/2 + 40);
        }
    }

    dibujarNube(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, Math.PI * 0.5, Math.PI * 1.5);
        this.ctx.arc(x + 25, y - 10, 25, Math.PI * 1, Math.PI * 2);
        this.ctx.arc(x + 50, y, 20, Math.PI * 1.5, Math.PI * 0.5);
        this.ctx.closePath();
        this.ctx.fill();
    }

    dibujarCarro(x, y, w, h) {
        // Silueta del carro (Estilo BYD Blanco moderno)
        this.ctx.fillStyle = '#ffffff'; // Color blanco común
        this.ctx.beginPath();
        this.ctx.moveTo(x + 10, y + h - 15); // base trasera
        this.ctx.lineTo(x + 10, y + 25); // maletero
        this.ctx.lineTo(x + 30, y + 5);  // techo atras
        this.ctx.lineTo(x + w - 30, y + 5); // techo adelante
        this.ctx.lineTo(x + w - 5, y + 25); // capot
        this.ctx.lineTo(x + w, y + h - 15); // parachoques frontal
        this.ctx.lineTo(x + 10, y + h - 15); 
        this.ctx.fill();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = '#ccc';
        this.ctx.stroke();

        // Ventanas (Vidrios oscuros)
        this.ctx.fillStyle = '#88ccff';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 32, y + 10);
        this.ctx.lineTo(x + 50, y + 10);
        this.ctx.lineTo(x + 50, y + 25);
        this.ctx.lineTo(x + 25, y + 25);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(x + 55, y + 10);
        this.ctx.lineTo(x + w - 35, y + 10);
        this.ctx.lineTo(x + w - 15, y + 25);
        this.ctx.lineTo(x + 55, y + 25);
        this.ctx.fill();

        // Luces LED (Típicas de BYD)
        this.ctx.fillStyle = '#ff3333'; // Freno
        this.ctx.fillRect(x + 5, y + 20, 5, 8);
        this.ctx.fillStyle = '#eef'; // Faro delantero
        this.ctx.fillRect(x + w - 10, y + 20, 10, 8);

        // Pareja adentro (Siluetas)
        this.ctx.fillStyle = '#333'; // Él manejando
        this.ctx.beginPath();
        this.ctx.arc(x + 65, y + 18, 5, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ff99cc'; // Ella acompañante
        this.ctx.beginPath();
        this.ctx.arc(x + 40, y + 18, 5, 0, Math.PI*2);
        this.ctx.fill();

        // Ruedas (Rotando)
        let angulo = this.frames * 0.2;
        this.dibujarLlanta(x + 25, y + h - 10, 12, angulo);
        this.dibujarLlanta(x + w - 25, y + h - 10, 12, angulo);
    }

    dibujarLlanta(x, y, radio, angulo) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angulo);
        this.ctx.fillStyle = '#222';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radio, 0, Math.PI*2);
        this.ctx.fill();
        
        // Rin metalizado
        this.ctx.fillStyle = '#ddd';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radio/2, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.restore();
    }

    dibujarObstaculo(x, y, w, h) {
        // Cono de tráfico
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.moveTo(x + w/2, y);
        this.ctx.lineTo(x + w, y + h);
        this.ctx.lineTo(x, y + h);
        this.ctx.fill();
        // Franja blanca del cono
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.moveTo(x + w/4, y + h/2);
        this.ctx.lineTo(x + w - w/4, y + h/2);
        this.ctx.lineTo(x + w - w/6, y + h/2 + 5);
        this.ctx.lineTo(x + w/6, y + h/2 + 5);
        this.ctx.fill();
    }

    limpiarCanvas() {
        if(this.ctx) this.ctx.clearRect(0, 0, this.ancho, this.alto);
    }
}
