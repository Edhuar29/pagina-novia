export class ReproductorMusical {
    constructor() {
        // Encontrar los elementos en el HTML
        this.audioElemento = document.getElementById('bgMusic');
        this.botonReproducir = document.getElementById('playBtn');
        this.botonAnterior = document.getElementById('prevBtn');
        this.botonSiguiente = document.getElementById('nextBtn');
        this.timeSlider = document.getElementById('timeSlider');
        this.currentTimeLabel = document.getElementById('currentTime');
        this.durationTimeLabel = document.getElementById('durationTime');
        this.disco = document.getElementById('disk');
        this.tituloCancion = document.getElementById('songTitle');
        this.fuenteAudio = document.getElementById('audioSource');
        
        this.estaReproduciendo = false;
        this.indiceCancionActual = 0;

        // Lista de canciones
        this.listaDeCanciones = [
            { titulo: "Ojitos Lindos", url: "assets/Ojitos Lindos.mp3" }
        ];

        this.configurarReproductor();
        this.asignarEventos();
    }

    configurarReproductor() {
        this.audioElemento.volume = 0.4;
        // Cargar la primera canción al iniciar la página para que el botón de Play funcione de inmediato
        this.cargarCancion(this.indiceCancionActual);
    }

    cargarCancion(indice) {
        this.tituloCancion.textContent = this.listaDeCanciones[indice].titulo;
        this.fuenteAudio.src = this.listaDeCanciones[indice].url;
        this.audioElemento.load();
    }

    iniciarMusica() {
        this.audioElemento.play().then(() => {
            this.botonReproducir.innerHTML = '<i class="fas fa-pause"></i>';
            this.disco.classList.add('playing');
            this.estaReproduciendo = true;
        }).catch(error => {
            console.log("No se pudo reproducir automáticamente:", error);
        });
    }

    pausarMusica() {
        this.audioElemento.pause();
        this.botonReproducir.innerHTML = '<i class="fas fa-play"></i>';
        this.disco.classList.remove('playing');
        this.estaReproduciendo = false;
    }

    alternarReproduccion() {
        if (this.estaReproduciendo) {
            this.pausarMusica();
        } else {
            this.iniciarMusica();
        }
    }

    siguienteCancion() {
        this.indiceCancionActual = (this.indiceCancionActual + 1) % this.listaDeCanciones.length;
        this.cargarCancion(this.indiceCancionActual);
        if (this.estaReproduciendo) this.iniciarMusica();
    }

    cancionAnterior() {
        this.indiceCancionActual = (this.indiceCancionActual - 1 + this.listaDeCanciones.length) % this.listaDeCanciones.length;
        this.cargarCancion(this.indiceCancionActual);
        if (this.estaReproduciendo) this.iniciarMusica();
    }

    actualizarTiempo() {
        const current = this.audioElemento.currentTime;
        const duration = this.audioElemento.duration || 1;
        
        if (this.timeSlider && !this.timeSlider.isDragging) {
            this.timeSlider.value = (current / duration) * 100;
        }
        
        if (this.currentTimeLabel) {
            this.currentTimeLabel.textContent = this.formatearTiempo(current);
        }
    }

    cambiarTiempo(porcentaje) {
        const duration = this.audioElemento.duration || 1;
        this.audioElemento.currentTime = (porcentaje / 100) * duration;
    }

    formatearTiempo(segundos) {
        if (isNaN(segundos)) return "0:00";
        const min = Math.floor(segundos / 60);
        const sec = Math.floor(segundos % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    asignarEventos() {
        // Asignar funciones a los botones
        this.botonReproducir.addEventListener('click', () => this.alternarReproduccion());
        this.botonSiguiente.addEventListener('click', () => this.siguienteCancion());
        this.botonAnterior.addEventListener('click', () => this.cancionAnterior());
        
        // Eventos de la barra de tiempo
        this.audioElemento.addEventListener('timeupdate', () => this.actualizarTiempo());
        this.audioElemento.addEventListener('loadedmetadata', () => {
            if (this.durationTimeLabel) {
                this.durationTimeLabel.textContent = this.formatearTiempo(this.audioElemento.duration);
            }
        });
        
        if (this.timeSlider) {
            this.timeSlider.addEventListener('input', (e) => {
                this.timeSlider.isDragging = true;
            });
            this.timeSlider.addEventListener('change', (e) => {
                this.timeSlider.isDragging = false;
                this.cambiarTiempo(e.target.value);
            });
        }
        
        // Cuando termine la canción actual, pasar a la siguiente automáticamente
        this.audioElemento.addEventListener('ended', () => this.siguienteCancion());
    }
}
