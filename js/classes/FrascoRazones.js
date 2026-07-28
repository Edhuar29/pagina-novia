export class FrascoRazones {
    constructor() {
        this.jar = document.getElementById('magic-jar');
        if (!this.jar) return;

        this.razones = [
            "Porque me haces reír incluso cuando no quiero sonreír.",
            "Por la forma en la que me miras.",
            "Porque siempre sabes cómo hacerme sentir mejor.",
            "Por tu hermosa sonrisa que ilumina mi día.",
            "Porque me aceptas tal como soy, con todos mis defectos.",
            "Por cada mensaje de buenos días que me envías.",
            "Porque a tu lado siento que todo es posible.",
            "Por la paz que me da escuchar tu voz.",
            "Porque eres mi lugar seguro.",
            "Por tu paciencia infinita conmigo.",
            "Porque me inspiras a ser una mejor persona cada día.",
            "Por todos los momentos divertidos y locuras juntos.",
            "Porque contigo el silencio nunca es incómodo.",
            "Por cómo te preocupas por mí en los pequeños detalles.",
            "Porque simplemente eres tú, y eso es todo lo que necesito."
        ];

        // Crear el modal para mostrar la razón
        this.crearModal();
        this.initEvents();
    }

    crearModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'jar-modal';
        this.modal.innerHTML = `
            <div class="jar-modal-content glass">
                <button class="jar-modal-close"><i class="fas fa-times"></i></button>
                <h3>Una razón por la que te amo:</h3>
                <p class="jar-razon-texto"></p>
                <i class="fas fa-heart jar-modal-heart"></i>
            </div>
        `;
        document.body.appendChild(this.modal);

        this.btnCerrar = this.modal.querySelector('.jar-modal-close');
        this.textoRazon = this.modal.querySelector('.jar-razon-texto');

        this.btnCerrar.addEventListener('click', () => {
            this.modal.classList.remove('active');
        });

        // Cerrar al hacer clic fuera
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.modal.classList.remove('active');
            }
        });
    }

    initEvents() {
        this.jar.addEventListener('click', () => {
            // Animación de vibración
            this.jar.classList.add('shake-jar');
            
            // Elegir razón aleatoria
            const razon = this.razones[Math.floor(Math.random() * this.razones.length)];
            
            setTimeout(() => {
                this.jar.classList.remove('shake-jar');
                // Efecto de sonido corto (opcional si añadimos uno)
                this.textoRazon.textContent = razon;
                this.modal.classList.add('active');
            }, 500);
        });
    }
}
