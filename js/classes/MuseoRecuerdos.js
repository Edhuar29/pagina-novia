export class MuseoRecuerdos {
    constructor() {
        this.btnEntrar = document.getElementById('btn-entrar-museo');
        if (!this.btnEntrar) return;

        this.fotos = [
            { src: 'assets/botes.jpg', titulo: 'Día de novios ✨', desc: 'Aqui fue donde te ganaste la camiset para mi jaja.' },
            { src: 'assets/vosandes.jpg', titulo: 'Cita al doctor ☕', desc: 'Acompañándonos en todo momento, porque hasta en las citas médicas nos divertimos.' },
            { src: 'assets/epn.jpg', titulo: 'EPN', desc: 'en la universidad, testigo de nuestro esfuerzo y nuestro amor.' },
            { src: 'assets/biblioteca.jpg', titulo: 'Clases virtuales', desc: 'Estudiando juntos, apoyándonos para cumplir nuestros sueños.' },
            { src: 'assets/hambre.jpg', titulo: 'comiendo el vicio', desc: 'Disfrutando de una ricas hamburguesas.' },
            { src: 'assets/preciosa.jpg', titulo: 'Mi hermosa novia', desc: 'Aqui una muestra de que es real.' },
            { src: 'assets/llamadas.jpg', titulo: 'Llamadas para mimir', desc: 'Cad dia mas enamorado de ti.' },
            { src: 'assets/juntos.jpg', titulo: 'Inicio de clases', desc: 'el tiempo se fue volando, recuerdo cuando nos gtoco virtual y yo te hiba a ver.' },
            { src: 'assets/dia-de-misa.jpg', titulo: 'Basílica del Voto Nacional', desc: 'Siempre me la paso bien contigo en cada salida.' },
            { src: 'assets/fin-de-ano.jpg', titulo: 'Fin de año', desc: 'solo puedo pensar que el tiempo pasa volando y soplo lo quiero pasar contigo.' },
            { src: 'assets/juntos-con-mibebe.jpg', titulo: 'Centro', desc: 'me recurda lo rico que son tus besos.' },
            { src: 'assets/hamburguesas.jpg', titulo: 'Aristeos', desc: 'esperamos 2 años para ser atendidos pero estuvo rico y siempre tu compañia es lo mas importante para mi.' },
            { src: 'assets/dia-de-autos.jpg', titulo: 'Vista de Carros', desc: 'algun dia tenemos que tener nuestro propio auto.' },
            { src: 'assets/duende-captado-en-camara.jpg', titulo: 'Duende', desc: 'me encanta muchisimo esa sonrisa.' },
            { src: 'assets/de-chill.jpg', titulo: 'Paseando por la U', desc: 'cada que veo un espejo me acuerdo de ti.' },
            { src: 'assets/centro-historico.jpg', titulo: 'Centro de Quito', desc: 'todo Quito es nuestro.' },
            { src: 'assets/con-los-compas.jpg', titulo: 'Ascensor', desc: 'chica tu me vuelves loco de amor.' },
            { src: 'assets/mimiendo.jpg', titulo: 'En la mimision', desc: 'Siempre me decias que soy como tu lugar seguro.' },
            { src: 'assets/en-los-bross.jpg', titulo: 'Loco por las hamburguesas', desc: 'Una rica hamburguesa con mi mujer.' },
            { src: 'assets/ecuador.jpg', titulo: 'Ecuador', desc: 'EL dia que ecuador remonto Alemania jaja.' },
            { src: 'assets/dia-de-postre.jpg', titulo: 'Postre', desc: 'feliz de siempre pasar tiempo contigo.' },
            { src: 'assets/comida.jpg', titulo: 'Lindo lugar', desc: 'Para el amor de mi vida.' },
            { src: 'assets/tienda.jpg', titulo: 'De compras', desc: 'Haciendo recados y disfrutando cada momento a tu lado.' }
        ];

        this.stepZ = 400; // Cuánto avanza por cada clic
        this.currentZ = 400; // Inicia frente al primer par
        this.maxZ = Math.ceil(this.fotos.length / 2) * this.stepZ + 400; // Límite de avance por pares

        this.crearEntorno3D();
        this.crearModal();
        
        this.btnEntrar.addEventListener('click', () => this.abrirMuseo3D());
    }

    crearEntorno3D() {
        // Contenedor principal
        this.overlay = document.createElement('div');
        this.overlay.className = 'museum-3d-overlay';
        
        // Viewport (Maneja la perspectiva sin afectar el UI)
        this.viewport = document.createElement('div');
        this.viewport.className = 'museum-viewport';

        // Cámara (maneja rotación)
        this.camera = document.createElement('div');
        this.camera.className = 'museum-camera';
        
        // Mundo 3D (maneja traslación)
        this.world = document.createElement('div');
        this.world.className = 'museum-3d-world';

        // Paredes
        // Crear pasillos en "trozos" de 2000px para evitar el límite de textura (4096px) en celulares
        this.stepZ = 400;
        this.maxZ = Math.ceil(this.fotos.length / 2) * this.stepZ + 400;
        
        const numChunks = Math.ceil((this.maxZ + 4000) / 2000); // Añadimos chunks extra
        // Comenzar desde -1 para que haya pasillo detrás de la cámara al inicio
        for (let i = -1; i < numChunks; i++) {
            const chunkZ = -(i * 2000) - 1000;
            
            const wallLeft = document.createElement('div');
            wallLeft.className = 'museum-wall wall-left';
            wallLeft.style.width = '2000px';
            wallLeft.style.transform = `translate3d(-1700px, -300px, ${chunkZ}px) rotateY(90deg)`;
            this.world.appendChild(wallLeft);
            
            const wallRight = document.createElement('div');
            wallRight.className = 'museum-wall wall-right';
            wallRight.style.width = '2000px';
            wallRight.style.transform = `translate3d(-300px, -300px, ${chunkZ}px) rotateY(-90deg)`;
            this.world.appendChild(wallRight);
            
            const floor = document.createElement('div');
            floor.className = 'wall-floor';
            floor.style.width = '1400px';
            floor.style.height = '2000px';
            floor.style.transform = `translate3d(-700px, -300px, ${chunkZ}px) rotateX(90deg)`;
            this.world.appendChild(floor);
            
            const ceiling = document.createElement('div');
            ceiling.className = 'wall-ceiling';
            ceiling.style.width = '1400px';
            ceiling.style.height = '2000px';
            ceiling.style.transform = `translate3d(-700px, -900px, ${chunkZ}px) rotateX(-90deg)`;
            this.world.appendChild(ceiling);
        }

        // Crear pared de fondo para cerrar el pasillo
        const farthestZ = -((numChunks - 1) * 2000) - 1000 - 1000;
        const wallBack = document.createElement('div');
        wallBack.className = 'museum-wall wall-back';
        wallBack.style.width = '1400px';
        wallBack.style.height = '600px';
        wallBack.style.transform = `translate3d(-700px, -300px, ${farthestZ}px)`;
        this.world.appendChild(wallBack);

        // Crear pared frontal (detrás del usuario al iniciar)
        const wallFront = document.createElement('div');
        wallFront.className = 'museum-wall wall-front';
        wallFront.style.width = '1400px';
        wallFront.style.height = '600px';
        wallFront.style.transform = `translate3d(-700px, -300px, 1000px) rotateY(180deg)`;
        this.world.appendChild(wallFront);

        // UI Controles
        const ui = document.createElement('div');
        ui.className = 'museum-ui';
        
        ui.innerHTML = `
            <div class="dpad">
                <div class="dpad-row">
                    <button class="btn-museum-nav" id="btn-museum-left"><i class="fas fa-undo"></i> Izq</button>
                    <button class="btn-museum-nav" id="btn-museum-forward"><i class="fas fa-arrow-up"></i> Avanzar</button>
                    <button class="btn-museum-nav" id="btn-museum-right">Der <i class="fas fa-redo"></i></button>
                </div>
                <div class="dpad-row center-row">
                    <button class="btn-museum-nav" id="btn-museum-center"><i class="fas fa-eye"></i> Frente</button>
                    <button class="btn-museum-nav" id="btn-museum-backward"><i class="fas fa-arrow-down"></i> Retroceder</button>
                </div>
            </div>
        `;

        const btnSalir = document.createElement('button');
        btnSalir.className = 'btn-museum-exit';
        btnSalir.innerHTML = '<i class="fas fa-sign-out-alt"></i> Salir';

        this.camera.appendChild(this.world);
        this.viewport.appendChild(this.camera);
        this.overlay.appendChild(this.viewport);
        this.overlay.appendChild(ui);
        this.overlay.appendChild(btnSalir);
        document.body.appendChild(this.overlay);

        // Distribuir fotos en el espacio 3D
        this.paintings = [];
        this.fotos.forEach((foto, i) => {
            const painting = document.createElement('div');
            painting.className = 'museum-painting';
            // Posicionar el centro del cuadro exactamente en 0,0 del mundo 3D
            painting.style.position = 'absolute';
            painting.style.left = '-125px'; // Mitad de 250px
            painting.style.top = '-160px';  // Mitad de 320px
            
            painting.innerHTML = `
                <div class="painting-light"></div>
                <img data-src="${foto.src}" alt="${foto.titulo}">
                <div class="painting-plaque">${foto.titulo}</div>
            `;
            
            const pairIndex = Math.floor(i / 2);
            // El centro del cuadro queda exactamente en depthOffset (empezando en 0)
            const depthOffset = pairIndex * this.stepZ;
            
            painting.style.setProperty('--z', `${-depthOffset}`);
            
            if (i % 2 === 0) {
                // Pared Izquierda
                painting.style.transform = `translate3d(-690px, 0, ${-depthOffset}px) rotateY(90deg)`;
            } else {
                // Pared Derecha
                painting.style.transform = `translate3d(690px, 0, ${-depthOffset}px) rotateY(-90deg)`;
            }

            painting.addEventListener('click', (e) => {
                e.stopPropagation();
                this.abrirFoto(foto);
            });
            this.world.appendChild(painting);
            this.paintings.push({ el: painting, z: depthOffset });
        });

        // Eventos de navegación
        this.btnAvanzar = ui.querySelector('#btn-museum-forward');
        this.btnRetroceder = ui.querySelector('#btn-museum-backward');
        const btnLeft = ui.querySelector('#btn-museum-left');
        const btnRight = ui.querySelector('#btn-museum-right');
        const btnCenter = ui.querySelector('#btn-museum-center');

        this.currentRot = 0;

        this.btnAvanzar.addEventListener('click', () => {
            if (this.currentZ < this.maxZ) {
                this.currentZ += this.stepZ;
                this.actualizarCamara();
            }
        });

        this.btnRetroceder.addEventListener('click', () => {
            if (this.currentZ > 0) {
                this.currentZ -= this.stepZ;
                this.actualizarCamara();
            }
        });

        btnLeft.addEventListener('click', () => {
            if (this.currentZ === 400) this.currentZ = 800; // Auto-avanzar al primer cuadro
            this.currentRot = 90; // Gira a la izquierda (el mundo gira a la derecha)
            this.actualizarCamara();
        });

        btnRight.addEventListener('click', () => {
            if (this.currentZ === 400) this.currentZ = 800; // Auto-avanzar al primer cuadro
            this.currentRot = -90; // Gira a la derecha (el mundo gira a la izquierda)
            this.actualizarCamara();
        });

        btnCenter.addEventListener('click', () => {
            this.currentRot = 0; // Mira al frente
            this.actualizarCamara();
        });

        btnSalir.addEventListener('click', () => {
            this.overlay.classList.remove('active');
            // Mostrar reproductor de música de nuevo
            const player = document.querySelector('.music-player');
            if (player) player.style.display = 'flex';
        });
    }

    actualizarCamara() {
        // La cámara (la cabeza del usuario) rota
        this.camera.style.transform = `rotateY(${this.currentRot}deg)`;
        
        // El mundo se traslada hacia el usuario para simular caminar
        this.world.style.transform = `translate3d(0, 0, ${this.currentZ}px)`;

        this.btnRetroceder.disabled = this.currentZ <= 400;
        this.btnAvanzar.disabled = this.currentZ >= this.maxZ;

        // Ocultar cuadros lejanos y hacer lazy-loading manual para ahorrar RAM sin bugs de Safari
        if (this.paintings) {
            this.paintings.forEach(p => {
                // p.z es 0, 400, 800... El usuario llega a p.z cuando currentZ = p.z + 800
                const distance = Math.abs(this.currentZ - (p.z + 800));
                
                const img = p.el.querySelector('img');
                // Cargar imagen si está a menos de 1800px de distancia
                if (distance < 1800) {
                    const dataSrc = img.getAttribute('data-src');
                    if (img.getAttribute('src') !== dataSrc) {
                        img.setAttribute('src', dataSrc);
                    }
                } else if (distance > 2500) {
                    // Descargarla de la RAM si está muy lejos
                    img.removeAttribute('src');
                }

                // Ocultar del DOM (display: none) si ya pasamos el cuadro para evitar el glitch de CSS 3D
                if (this.currentZ > p.z + 900) {
                    p.el.style.display = 'none';
                } else {
                    p.el.style.display = 'flex'; // Usaba flexbox
                }
            });
        }
    }

    abrirMuseo3D() {
        this.currentZ = 400;
        this.currentRot = 0;
        this.actualizarCamara();
        this.overlay.classList.add('active');
        
        // Ocultar reproductor de música para que no estorbe
        const player = document.querySelector('.music-player');
        if (player) player.style.display = 'none';
    }

    crearModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'museum-modal';
        this.modal.style.zIndex = '4000'; // Por encima del mundo 3D
        this.modal.innerHTML = `
            <div class="museum-modal-content">
                <button class="museum-modal-close"><i class="fas fa-times"></i></button>
                <img src="" alt="" class="museum-modal-img">
                <div class="museum-modal-info">
                    <h3 class="museum-modal-title"></h3>
                    <p class="museum-modal-desc"></p>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);

        this.btnCerrar = this.modal.querySelector('.museum-modal-close');
        this.modalImg = this.modal.querySelector('.museum-modal-img');
        this.modalTitle = this.modal.querySelector('.museum-modal-title');
        this.modalDesc = this.modal.querySelector('.museum-modal-desc');

        this.btnCerrar.addEventListener('click', () => {
            this.modal.classList.remove('active');
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.modal.classList.remove('active');
            }
        });
    }

    abrirFoto(foto) {
        this.modalImg.src = foto.src;
        this.modalTitle.textContent = foto.titulo;
        this.modalDesc.textContent = foto.desc;
        this.modal.classList.add('active');
    }
}
