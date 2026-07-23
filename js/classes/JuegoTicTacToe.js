export class JuegoTicTacToe {
    constructor() {
        this.tableroDOM = document.querySelector('.tic-tablero');
        this.textoTurno = document.getElementById('turno-actual');
        this.btnReset = document.getElementById('reset-tic');
        
        this.jugador1 = '💚';
        this.jugador2 = '🩷';
        this.turno = this.jugador1;
        this.tablero = ['', '', '', '', '', '', '', '', ''];
        this.activo = true;

        if (this.tableroDOM) {
            this.inicializarTablero();
            this.btnReset.addEventListener('click', () => this.reiniciar());
        }
    }

    inicializarTablero() {
        this.tableroDOM.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const celda = document.createElement('div');
            celda.classList.add('tic-celda');
            celda.setAttribute('data-index', i);
            celda.addEventListener('click', (e) => this.jugarCelda(e, i));
            this.tableroDOM.appendChild(celda);
        }
    }

    jugarCelda(e, index) {
        if (!this.activo || this.tablero[index] !== '') return;

        this.tablero[index] = this.turno;
        e.target.textContent = this.turno;

        if (this.verificarVictoria()) {
            this.textoTurno.textContent = `¡Ganó ${this.turno}! 🎉`;
            this.activo = false;
            return;
        }

        if (!this.tablero.includes('')) {
            this.textoTurno.textContent = '¡Empate! 😅';
            this.activo = false;
            return;
        }

        this.turno = this.turno === this.jugador1 ? this.jugador2 : this.jugador1;
        this.textoTurno.textContent = this.turno;
    }

    verificarVictoria() {
        const lineasGanadoras = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontales
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Verticales
            [0, 4, 8], [2, 4, 6]             // Diagonales
        ];

        for (let i = 0; i < lineasGanadoras.length; i++) {
            const [a, b, c] = lineasGanadoras[i];
            if (this.tablero[a] && this.tablero[a] === this.tablero[b] && this.tablero[a] === this.tablero[c]) {
                
                // Añadir clase para animación de parpadeo/latido
                this.tableroDOM.children[a].classList.add('ganadora');
                this.tableroDOM.children[b].classList.add('ganadora');
                this.tableroDOM.children[c].classList.add('ganadora');
                
                // Lanzar confeti de corazones
                this.lanzarConfeti();

                setTimeout(() => {
                    this.textoTurno.textContent = `¡GANÓ ${this.tablero[a]}! 🎉`;
                }, 300);

                return true;
            }
        }
        return false;
    }

    lanzarConfeti() {
        const contenedor = this.tableroDOM.parentElement;
        for(let i=0; i<30; i++) {
            const corazon = document.createElement('div');
            corazon.innerHTML = ['💖', '💚', '✨'][Math.floor(Math.random()*3)];
            corazon.classList.add('corazon-flotante');
            corazon.style.left = Math.random() * 100 + '%';
            corazon.style.animationDuration = (Math.random() * 2 + 1) + 's';
            contenedor.appendChild(corazon);
            
            // Eliminar después de la animación
            setTimeout(() => {
                if (corazon.parentNode) corazon.remove();
            }, 3000);
        }
    }

    reiniciar() {
        this.tablero = ['', '', '', '', '', '', '', '', ''];
        this.turno = this.jugador1;
        this.activo = true;
        this.textoTurno.textContent = this.turno;
        document.querySelectorAll('.tic-celda').forEach(celda => {
            celda.textContent = '';
            celda.classList.remove('ganadora');
        });
    }
}
