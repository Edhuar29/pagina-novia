export class JuegosController {
    constructor() {
        this.menu = document.querySelector('.juegos-menu');
        this.pantallas = document.querySelectorAll('.juego-pantalla');
        
        // Botones del menú
        this.btnBesos = document.getElementById('btn-juego-besos');
        this.btnFlappy = document.getElementById('btn-juego-flappy');
        this.btnTic = document.getElementById('btn-juego-tic');
        this.btnByd = document.getElementById('btn-juego-byd');
        
        // Botones de cerrar
        this.btnsCerrar = document.querySelectorAll('.btn-cerrar-juego');

        if(this.menu) this.asignarEventos();
    }

    asignarEventos() {
        this.btnBesos.addEventListener('click', () => this.abrirJuego('juego-contenedor-besos'));
        this.btnFlappy.addEventListener('click', () => this.abrirJuego('juego-contenedor-flappy'));
        this.btnTic.addEventListener('click', () => this.abrirJuego('juego-contenedor-tic'));
        if(this.btnByd) this.btnByd.addEventListener('click', () => this.abrirJuego('juego-contenedor-byd'));

        this.btnsCerrar.forEach(btn => {
            btn.addEventListener('click', () => this.cerrarJuegos());
        });
    }

    abrirJuego(idPantalla) {
        this.menu.style.display = 'none';
        this.pantallas.forEach(p => p.style.display = 'none');
        document.getElementById(idPantalla).style.display = 'block';
    }

    cerrarJuegos() {
        this.pantallas.forEach(p => p.style.display = 'none');
        this.menu.style.display = 'flex';
        // Detener cualquier juego activo (se manejará en las clases)
        document.dispatchEvent(new CustomEvent('cerrarJuegos'));
    }
}
