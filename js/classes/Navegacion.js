export class Navegacion {
    constructor() {
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.vistas = document.querySelectorAll('.vista');

        this.asignarEventos();
    }

    asignarEventos() {
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetViewId = btn.getAttribute('data-target');
                this.cambiarVista(targetViewId);
            });
        });
    }

    cambiarVista(targetId) {
        // Remover activo de todos los botones
        this.navButtons.forEach(btn => btn.classList.remove('active'));
        // Agregar activo al botón correspondiente
        const btnActivo = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
        if(btnActivo) btnActivo.classList.add('active');

        // Ocultar todas las vistas
        this.vistas.forEach(vista => {
            vista.classList.remove('active');
            vista.style.display = 'none'; // ocultar completamente
        });

        // Mostrar la vista objetivo
        const vistaActiva = document.getElementById(targetId);
        if (vistaActiva) {
            vistaActiva.style.display = 'block';
            // pequeño delay para la animación de entrada
            setTimeout(() => {
                vistaActiva.classList.add('active');
            }, 50);
        }
        
        // Forzar scroll arriba al cambiar de pestaña
        window.scrollTo(0, 0);
    }
}
