export class BoletoSorpresa {
    constructor() {
        this.sobre = document.getElementById('sobre-interactivo');
        this.canvas = document.getElementById('scratch-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d', { willReadFrequently: true }) : null;
        
        this.isDrawing = false;
        this.scratchThreshold = 50; // % necesario para revelar automáticamente
        this.isRevealed = false;

        this.premiosSencillos = [
            "¡Vale por un juguito! 🧃",
            "¡Vale por unas papitas / picadas! 🍟",
            "¡Vale por un chocolate! 🍫",
            "¡Vale por un masaje de 5 minutos! 💆‍♀️",
            "¡Vale por una botellita de agua fría! 💧",
            "¡Vale por tu dulce favorito! 🍬",
            "¡Vale por un beso apasionado! 💋",
            "¡Vale por un abrazo de oso! 🐻",
            "¡Vale por un heladito! 🍦",
            "¡Vale por elegir la película de hoy! 🍿",
            "¡Vale por dejarte ganar en una discusión! 😂",
            "¡Vale por unas gomitas! 🧸",
            "¡Vale por un postre! 🍰"
        ];

        if (this.sobre && this.canvas) {
            this.asignarPremioAleatorio();
            this.asignarEventosSobre();
            this.inicializarCanvas();
            this.asignarEventosCanvas();
        }
    }

    asignarPremioAleatorio() {
        const premioText = this.sobre.querySelector('.boleto h3');
        if (premioText) {
            const indiceAleatorio = Math.floor(Math.random() * this.premiosSencillos.length);
            premioText.textContent = this.premiosSencillos[indiceAleatorio];
        }
    }

    asignarEventosSobre() {
        this.sobre.addEventListener('click', () => {
            if (!this.sobre.classList.contains('abierto')) {
                this.sobre.classList.add('abierto');
                // Inicializar tamaño del canvas correcto una vez que se muestra
                setTimeout(() => {
                    this.redimensionarCanvas();
                    this.llenarCanvas();
                }, 500); // esperar animación CSS
            }
        });
    }

    inicializarCanvas() {
        this.redimensionarCanvas();
        this.llenarCanvas();
    }

    redimensionarCanvas() {
        // Asegurar que la resolución del canvas coincida con su tamaño en CSS
        // Si la vista está oculta (display: none), getBoundingClientRect() devuelve 0.
        // Por eso usamos los valores fijos de sorpresa.css (280x180) como respaldo.
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width || 280;
        this.canvas.height = rect.height || 180;
    }

    llenarCanvas() {
        if (!this.ctx) return;
        this.ctx.fillStyle = '#dec2cb'; // Color de la cubierta (lavanda suave)
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Texto sobre la cubierta
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Poppins';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('¡Ráspame con el dedo o el mouse!', this.canvas.width / 2, this.canvas.height / 2);
    }

    getPosicionRaton(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    raspar(e) {
        if (!this.isDrawing || this.isRevealed) return;
        e.preventDefault();

        const pos = this.getPosicionRaton(e);
        
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
        this.ctx.fill();

        this.comprobarProgreso();
    }

    comprobarProgreso() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imageData.data;
        let transparentPixels = 0;

        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) transparentPixels++;
        }

        const totalPixels = pixels.length / 4;
        const porcentaje = (transparentPixels / totalPixels) * 100;

        if (porcentaje > this.scratchThreshold && !this.isRevealed) {
            this.revelarTodo();
        }
    }

    revelarTodo() {
        this.isRevealed = true;
        this.canvas.style.transition = 'opacity 0.5s';
        this.canvas.style.opacity = '0';
        setTimeout(() => {
            this.canvas.style.display = 'none';
        }, 500);
    }

    asignarEventosCanvas() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => { this.isDrawing = true; this.raspar(e); });
        this.canvas.addEventListener('mousemove', (e) => this.raspar(e));
        this.canvas.addEventListener('mouseup', () => this.isDrawing = false);
        this.canvas.addEventListener('mouseleave', () => this.isDrawing = false);

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => { this.isDrawing = true; this.raspar(e); });
        this.canvas.addEventListener('touchmove', (e) => this.raspar(e));
        this.canvas.addEventListener('touchend', () => this.isDrawing = false);
    }
}
