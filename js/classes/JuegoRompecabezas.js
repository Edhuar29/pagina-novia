export class JuegoRompecabezas {
    constructor() {
        this.board = document.getElementById('puzzle-board');
        this.btnStart = document.getElementById('start-rompecabezas');
        this.txtMovimientos = document.getElementById('movimientos-puzzle');
        this.txtExito = document.getElementById('puzzle-mensaje-exito');
        
        this.btnCambiarFoto = document.getElementById('btn-cambiar-foto-puzzle');
        
        if (!this.board || !this.btnStart) return;

        this.fotos = [
            'assets/botes.jpg',
            'assets/vosandes.jpg',
            'assets/epn.jpg',
            'assets/biblioteca.jpg',
            'assets/hambre.jpg',
            'assets/preciosa.jpg',
            'assets/llamadas.jpg',
            'assets/juntos.jpg',
            'assets/dia-de-misa.jpg',
            'assets/fin-de-año.jpg',
            'assets/juntos-con-mibebe.jpg',
            'assets/hamburguesas.jpg',
            'assets/dia-de-autos.jpg',
            'assets/duende-captado-en-camara.jpg',
            'assets/de-chill.jpg',
            'assets/centro-historico.jpg',
            'assets/con-los-compas.jpg',
            'assets/mimiendo.jpg',
            'assets/en-los-bross.jpg',
            'assets/ecuador.jpg',
            'assets/dia-de-postre.jpg',
            'assets/comida.jpg'
        ];

        this.gridSize = 3; // 3x3
        this.piezas = [];
        this.piezaSeleccionada = null;
        this.movimientos = 0;
        this.jugando = false;
        this.fotoActual = null;

        this.btnStart.addEventListener('click', () => this.iniciarJuego());
        if (this.btnCambiarFoto) {
            this.btnCambiarFoto.addEventListener('click', () => {
                let nuevaFoto;
                do {
                    nuevaFoto = this.fotos[Math.floor(Math.random() * this.fotos.length)];
                } while (nuevaFoto === this.fotoActual && this.fotos.length > 1);
                this.fotoActual = nuevaFoto;
                this.iniciarJuego(true);
            });
        }

        // Escuchar el evento global para detener
        document.addEventListener('cerrarJuegos', () => {
            this.jugando = false;
        });
    }

    iniciarJuego(mantenerFoto = false) {
        this.jugando = true;
        this.movimientos = 0;
        this.txtMovimientos.textContent = this.movimientos;
        this.txtExito.style.display = 'none';
        this.piezaSeleccionada = null;
        this.board.style.display = 'grid';
        this.board.innerHTML = '';
        
        // CSS Grid para el tablero
        this.board.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        this.board.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`;
        
        // Elegir foto al azar si no se mantiene
        if (!mantenerFoto || !this.fotoActual) {
            this.fotoActual = this.fotos[Math.floor(Math.random() * this.fotos.length)];
        }
        const fotoSrc = this.fotoActual;
        
        // Crear las piezas en orden correcto
        let posiciones = [];
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            posiciones.push(i);
        }

        // Desordenar posiciones
        posiciones = posiciones.sort(() => Math.random() - 0.5);

        this.piezas = [];

        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const pieza = document.createElement('div');
            pieza.className = 'puzzle-piece';
            
            const correctIndex = posiciones[i]; // El índice real de la imagen que va en este slot
            
            // Calculamos fila y columna de la pieza original para recortar el background
            const row = Math.floor(correctIndex / this.gridSize);
            const col = correctIndex % this.gridSize;
            
            pieza.style.backgroundImage = `url('${fotoSrc}')`;
            pieza.style.backgroundSize = `${this.gridSize * 100}% ${this.gridSize * 100}%`;
            pieza.style.backgroundPosition = `${(col * 100) / (this.gridSize - 1)}% ${(row * 100) / (this.gridSize - 1)}%`;
            
            // Guardamos metadata para la lógica de victoria
            pieza.dataset.correctIndex = correctIndex;
            pieza.dataset.currentIndex = i;
            
            pieza.addEventListener('click', () => this.tocarPieza(pieza));
            
            this.board.appendChild(pieza);
            this.piezas.push(pieza);
        }
        
        this.btnStart.textContent = "Reiniciar Rompecabezas";
    }

    tocarPieza(pieza) {
        if (!this.jugando) return;

        if (!this.piezaSeleccionada) {
            // Seleccionamos la primera pieza
            this.piezaSeleccionada = pieza;
            pieza.classList.add('selected');
        } else {
            // Intercambiamos la pieza seleccionada con la nueva
            const pieza1 = this.piezaSeleccionada;
            const pieza2 = pieza;
            
            // Quitamos el borde de selección
            pieza1.classList.remove('selected');
            
            // Si tocamos la misma pieza, solo la deseleccionamos
            if (pieza1 === pieza2) {
                this.piezaSeleccionada = null;
                return;
            }

            // Intercambiar en el DOM
            const index1 = parseInt(pieza1.dataset.currentIndex);
            const index2 = parseInt(pieza2.dataset.currentIndex);
            
            // Truco para intercambiar nodos en el DOM manteniendo el grid
            const temp = document.createElement('div');
            pieza1.parentNode.insertBefore(temp, pieza1);
            pieza2.parentNode.insertBefore(pieza1, pieza2);
            temp.parentNode.insertBefore(pieza2, temp);
            temp.parentNode.removeChild(temp);
            
            // Actualizar currentIndex
            pieza1.dataset.currentIndex = index2;
            pieza2.dataset.currentIndex = index1;
            
            // Actualizar array
            this.piezas[index2] = pieza1;
            this.piezas[index1] = pieza2;
            
            this.piezaSeleccionada = null;
            this.movimientos++;
            this.txtMovimientos.textContent = this.movimientos;
            
            this.verificarVictoria();
        }
    }

    verificarVictoria() {
        let victoria = true;
        for (let i = 0; i < this.piezas.length; i++) {
            if (parseInt(this.piezas[i].dataset.correctIndex) !== i) {
                victoria = false;
                break;
            }
        }
        
        if (victoria) {
            this.jugando = false;
            this.txtExito.textContent = `¡Felicidades mi amor! Armaste nuestro recuerdo en ${this.movimientos} movimientos. Te amo ❤️`;
            this.txtExito.style.display = 'block';
            
            // Opcional: tirar confeti
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#ff4757', '#ffa502', '#2ed573']
                });
            }
        }
    }
}
