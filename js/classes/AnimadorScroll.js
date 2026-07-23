export class AnimadorScroll {
    constructor() {
        this.elementosAOcultar = document.querySelectorAll('.reveal');
        this.asignarEventos();
    }

    revisarElementosVisibles() {
        const alturaVentana = window.innerHeight;
        const distanciaVisible = 150;

        this.elementosAOcultar.forEach(elemento => {
            const posicionElemento = elemento.getBoundingClientRect().top;
            
            // Si el elemento entra en la zona visible de la pantalla, añadir la clase 'active'
            if (posicionElemento < alturaVentana - distanciaVisible) {
                elemento.classList.add('active');
            }
        });
    }

    asignarEventos() {
        // Revisar cada vez que el usuario haga scroll
        window.addEventListener('scroll', () => this.revisarElementosVisibles());
        
        // Ejecutar una vez al inicio para mostrar los elementos que ya estén en pantalla
        this.revisarElementosVisibles();
    }
}
