export class JuegoViajeBYD {
    constructor() {
        this.canvas = document.getElementById('canvas-byd');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.progresoSpan = document.getElementById('progreso-byd');
        this.btnNiveles = document.querySelectorAll('.niveles-byd .btn-jugar');
        
        this.uiControles = document.getElementById('byd-controles');
        this.uiEstadisticas = document.querySelector('.byd-ui');
        this.gasolinaBar = document.getElementById('gasolina-bar');
        
        this.btnGas = document.getElementById('btn-gas');
        this.btnFreno = document.getElementById('btn-freno');

        this.ancho = this.canvas.width;
        this.alto = this.canvas.height;
        
        // Matter.js alias
        this.Engine = Matter.Engine;
        this.Render = Matter.Render;
        this.Runner = Matter.Runner;
        this.Composites = Matter.Composites;
        this.Composite = Matter.Composite;
        this.Constraint = Matter.Constraint;
        this.MouseConstraint = Matter.MouseConstraint;
        this.Mouse = Matter.Mouse;
        this.World = Matter.World;
        this.Bodies = Matter.Bodies;
        this.Body = Matter.Body;
        this.Events = Matter.Events;

        this.enJuego = false;
        this.gasolina = 100;
        
        this.distanciaTotal = 4000;
        this.offsetX = 0; // Cámara X
        this.offsetY = 0; // Cámara Y

        this.asignarEventos();
    }

    asignarEventos() {
        this.btnNiveles.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.iniciarJuego(e.target.dataset.nivel);
            });
        });

        const setPedal = (tipo, activo) => {
            if(tipo === 'gas') this.gasPresionado = activo;
            if(tipo === 'freno') this.frenoPresionado = activo;
        };

        // Pedales táctiles / mouse
        this.btnGas.addEventListener('mousedown', () => setPedal('gas', true));
        this.btnGas.addEventListener('mouseup', () => setPedal('gas', false));
        this.btnGas.addEventListener('mouseleave', () => setPedal('gas', false));
        this.btnGas.addEventListener('touchstart', (e) => { e.preventDefault(); setPedal('gas', true); });
        this.btnGas.addEventListener('touchend', (e) => { e.preventDefault(); setPedal('gas', false); });

        this.btnFreno.addEventListener('mousedown', () => setPedal('freno', true));
        this.btnFreno.addEventListener('mouseup', () => setPedal('freno', false));
        this.btnFreno.addEventListener('mouseleave', () => setPedal('freno', false));
        this.btnFreno.addEventListener('touchstart', (e) => { e.preventDefault(); setPedal('freno', true); });
        this.btnFreno.addEventListener('touchend', (e) => { e.preventDefault(); setPedal('freno', false); });

        // Teclado
        document.addEventListener('keydown', (e) => {
            if(e.key === 'ArrowRight' || e.key === 'd') setPedal('gas', true);
            if(e.key === 'ArrowLeft' || e.key === 'a') setPedal('freno', true);
        });
        document.addEventListener('keyup', (e) => {
            if(e.key === 'ArrowRight' || e.key === 'd') setPedal('gas', false);
            if(e.key === 'ArrowLeft' || e.key === 'a') setPedal('freno', false);
        });

        document.addEventListener('cerrarJuegos', () => {
            this.limpiarJuego();
        });
    }

    limpiarJuego() {
        this.enJuego = false;
        if(this.engine) {
            Matter.Engine.clear(this.engine);
            if(this.runner) Matter.Runner.stop(this.runner);
            this.engine = null;
        }
        this.uiControles.style.display = 'none';
        this.uiEstadisticas.style.display = 'none';
        this.canvas.style.display = 'none';
        if(this.renderLoop) cancelAnimationFrame(this.renderLoop);
    }

    iniciarJuego(nivel) {
        this.limpiarJuego();
        
        this.canvas.style.display = 'block';
        this.uiControles.style.display = 'flex';
        this.uiEstadisticas.style.display = 'flex';
        this.gasolina = 100;
        this.gasPresionado = false;
        this.frenoPresionado = false;
        this.gameOver = false;
        this.victoria = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.turbos = [];

        let terrenoScaleY = 50;
        if(nivel === 'facil') {
            this.distanciaTotal = 4000;
            terrenoScaleY = 40;
        } else if (nivel === 'medio') {
            this.distanciaTotal = 6000;
            terrenoScaleY = 75;
        } else {
            this.distanciaTotal = 8000;
            terrenoScaleY = 120;
        }

        // 1. Motor Matter.js
        this.engine = this.Engine.create();
        this.world = this.engine.world;
        
        // Gravedad
        this.engine.gravity.y = 1.0;

        // 2. Construir Terreno
        this.generarTerreno(terrenoScaleY);

        // 3. Construir Carro
        this.construirCarro();

        // 4. Lógica de Colisiones (Recolectar corazones)
        this.Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                const a = pair.bodyA;
                const b = pair.bodyB;
                
                // Si toca un corazón de gasolina
                if (a.label === 'corazon' && (b === this.carBody || b === this.wheelA || b === this.wheelB)) {
                    this.recogerGasolina(a);
                } else if (b.label === 'corazon' && (a === this.carBody || a === this.wheelA || a === this.wheelB)) {
                    this.recogerGasolina(b);
                }

                // Si toca un turbo
                if (a.label === 'turbo' && (b === this.carBody || b === this.wheelA || b === this.wheelB)) {
                    this.recogerTurbo(a);
                } else if (b.label === 'turbo' && (a === this.carBody || a === this.wheelA || a === this.wheelB)) {
                    this.recogerTurbo(b);
                }
            });
        });

        // 5. Iniciar simulación manual (para mejor control de cámara)
        this.enJuego = true;
        this.runner = this.Runner.create();
        this.Runner.run(this.runner, this.engine);
        
        this.loop();
    }

    generarTerreno(scaleY) {
        let x = 0;
        let y = this.alto - 100;
        const segmentWidth = 100;
        this.terrenoBlocks = [];
        this.corazones = [];

        // Agregar una plataforma inicial plana
        let startBlock = this.Bodies.rectangle(-200, y + 50, 1000, 100, { isStatic: true, label: 'terreno', friction: 0.8 });
        this.World.add(this.world, startBlock);
        this.terrenoBlocks.push(startBlock);

        for (let i = 0; i < this.distanciaTotal / segmentWidth; i++) {
            x = i * segmentWidth;
            // Ecuación de ondas para montañas suaves
            let heightOffset = Math.sin(i * 0.4) * scaleY + Math.sin(i * 0.15) * (scaleY * 0.4);
            
            // Suavizar la meta
            if (i > (this.distanciaTotal / segmentWidth) - 10) {
                heightOffset = 0;
            }

            let blockY = this.alto - 50 - heightOffset;
            
            let rect = this.Bodies.rectangle(x, blockY + 200, segmentWidth + 5, 400, {
                isStatic: true,
                friction: 0.8,
                restitution: 0.1,
                label: 'terreno'
            });
            this.World.add(this.world, rect);
            this.terrenoBlocks.push(rect);

            // Generar gasolina (Corazones)
            if (i > 10 && i % 12 === 0) {
                let heart = this.Bodies.circle(x, blockY - 50, 20, {
                    isStatic: true,
                    isSensor: true,
                    label: 'corazon'
                });
                this.World.add(this.world, heart);
                this.corazones.push(heart);
            }

            // Generar Turbos (Rayos)
            if (i > 20 && i % 25 === 0) {
                let turbo = this.Bodies.circle(x + 50, blockY - 60, 15, {
                    isStatic: true,
                    isSensor: true,
                    label: 'turbo'
                });
                this.World.add(this.world, turbo);
                this.turbos.push(turbo);
            }
        }

        // Meta (Pared invisible en la playa)
        let meta = this.Bodies.rectangle(this.distanciaTotal + 500, this.alto / 2, 50, 1000, { isStatic: true });
        this.World.add(this.world, meta);
    }

    construirCarro() {
        const carX = 150;
        const carY = 0;

        // Chasis
        this.carBody = this.Bodies.rectangle(carX, carY, 110, 30, {
            collisionFilter: { group: -1 },
            friction: 0.1,
            density: 0.003,
            label: 'chasis'
        });

        // Llantas (más densidad para que tengan tracción real)
        this.wheelA = this.Bodies.circle(carX - 45, carY + 20, 18, {
            collisionFilter: { group: -1 },
            friction: 1.0, 
            restitution: 0.1,
            density: 0.005
        });
        
        this.wheelB = this.Bodies.circle(carX + 45, carY + 20, 18, {
            collisionFilter: { group: -1 },
            friction: 1.0,
            restitution: 0.1,
            density: 0.005
        });

        // Unir piezas al chasis
        let axelA = this.Constraint.create({
            bodyB: this.carBody,
            pointB: { x: -45, y: 15 },
            bodyA: this.wheelA,
            stiffness: 0.15, // Suspensión suave
            damping: 0.05
        });
        let axelB = this.Constraint.create({
            bodyB: this.carBody,
            pointB: { x: 45, y: 15 },
            bodyA: this.wheelB,
            stiffness: 0.15, // Suspensión suave
            damping: 0.05
        });

        this.car = this.Composite.create({
            bodies: [this.carBody, this.wheelA, this.wheelB],
            constraints: [axelA, axelB]
        });

        this.World.add(this.world, this.car);
    }

    recogerGasolina(corazonBody) {
        this.gasolina = 100; // Recarga completa
        this.World.remove(this.world, corazonBody);
        this.corazones = this.corazones.filter(c => c !== corazonBody);
    }

    recogerTurbo(turboBody) {
        // Empujón hacia adelante
        this.Body.setVelocity(this.carBody, { x: this.carBody.velocity.x + 25, y: this.carBody.velocity.y - 5 });
        this.World.remove(this.world, turboBody);
        this.turbos = this.turbos.filter(t => t !== turboBody);
    }

    finJuego(motivo) {
        this.gameOver = true;
        this.motivoPerdida = motivo;
        this.uiControles.style.pointerEvents = 'none';
        this.btnGas.style.opacity = '0.5';
        this.btnFreno.style.opacity = '0.5';
    }

    loop() {
        if(!this.enJuego) return;

        // Consumo de gasolina
        if(!this.gameOver && !this.victoria) {
            this.gasolina -= 0.15;
            if(this.gasolina <= 0) {
                this.gasolina = 0;
                this.finJuego('gasolina');
            }
        }
        
        // Actualizar UI
        this.gasolinaBar.style.width = this.gasolina + '%';
        if(this.gasolina < 20) this.gasolinaBar.style.background = '#ff0000';
        else this.gasolinaBar.style.background = '#ff4757';

        let mRecorridos = Math.floor(this.carBody.position.x / 10);
        if(mRecorridos < 0) mRecorridos = 0;
        this.progresoSpan.textContent = mRecorridos;

        // Victoria
        if(this.carBody.position.x >= this.distanciaTotal && !this.gameOver) {
            this.victoria = true;
            this.uiControles.style.display = 'none';
        }

        // Detección de vuelco por ángulo
        if (!this.gameOver && !this.victoria) {
            // Si el ángulo pasa de ~110 grados, es que está de cabeza
            if (Math.abs(this.carBody.angle) > Math.PI * 0.6) {
                this.finJuego('vuelco');
            }
        }

        // Físicas del carro (Motor)
        if(!this.gameOver && !this.victoria) {
            const torque = 0.08;
            if (this.gasPresionado) {
                this.Body.setAngularVelocity(this.wheelA, Math.min(this.wheelA.angularVelocity + torque, 0.4));
                this.Body.setAngularVelocity(this.wheelB, Math.min(this.wheelB.angularVelocity + torque, 0.4));
            }
            if (this.frenoPresionado) {
                this.Body.setAngularVelocity(this.wheelA, Math.max(this.wheelA.angularVelocity - torque, -0.4));
                this.Body.setAngularVelocity(this.wheelB, Math.max(this.wheelB.angularVelocity - torque, -0.4));
            }
        }

        this.dibujarEscena();

        this.renderLoop = requestAnimationFrame(() => this.loop());
    }

    dibujarEscena() {
        this.ctx.clearRect(0, 0, this.ancho, this.alto);

        // Cámara sigue al chasis del coche en X y Y
        let targetOffsetX = this.carBody.position.x - this.ancho * 0.3; 
        let targetOffsetY = this.carBody.position.y - this.alto * 0.6; // Mantiene el carro abajo del centro
        
        this.offsetX += (targetOffsetX - this.offsetX) * 0.1;
        this.offsetY += (targetOffsetY - this.offsetY) * 0.1;

        this.ctx.save();
        
        // --- FONDO Y CIELO ---
        let progreso = this.carBody.position.x / this.distanciaTotal;
        if(progreso > 1) progreso = 1;
        if(progreso < 0) progreso = 0;
        
        // Gradiente de cielo (fijo a la pantalla)
        let gradientCielo = this.ctx.createLinearGradient(0, 0, 0, this.alto);
        if (progreso > 0.8) {
            // Atardecer en la playa
            gradientCielo.addColorStop(0, '#FF7E5F');
            gradientCielo.addColorStop(1, '#FEB47B');
        } else {
            // Día normal
            gradientCielo.addColorStop(0, '#87CEEB');
            gradientCielo.addColorStop(1, '#E0F6FF');
        }
        this.ctx.fillStyle = gradientCielo;
        this.ctx.fillRect(0, 0, this.ancho, this.alto);

        // Montañas de fondo (Parallax lento)
        this.ctx.fillStyle = (progreso > 0.8) ? 'rgba(255, 140, 100, 0.5)' : 'rgba(150, 200, 150, 0.5)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.alto);
        let fondoOffsetX = this.offsetX * 0.2;
        let fondoOffsetY = this.offsetY * 0.2;
        for(let i=0; i <= this.ancho; i+=50) {
            let mtY = this.alto - 150 + Math.sin((i + fondoOffsetX) * 0.01) * 50 - fondoOffsetY;
            this.ctx.lineTo(i, mtY);
        }
        this.ctx.lineTo(this.ancho, this.alto);
        this.ctx.fill();

        let solX = this.distanciaTotal - this.offsetX + 300;
        let solY = 100 - this.offsetY * 0.1;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(solX, solY, 60, 0, Math.PI*2);
        this.ctx.fill();

        // Aplicar transformación de cámara para el mundo físico
        this.ctx.translate(-this.offsetX, -this.offsetY);

        // --- TERRENO (Gradiente sin rectángulos) ---
        let gradientTerreno = this.ctx.createLinearGradient(0, this.alto - 200, 0, this.alto);
        if (progreso > 0.8) {
            gradientTerreno.addColorStop(0, '#F4E3A6');
            gradientTerreno.addColorStop(1, '#D4B86A');
        } else {
            gradientTerreno.addColorStop(0, '#4CAF50');
            gradientTerreno.addColorStop(1, '#2E7D32');
        }
        this.ctx.fillStyle = gradientTerreno; 

        const camIzq = this.offsetX - 200;
        const camDer = this.offsetX + this.ancho + 200;

        for(let block of this.terrenoBlocks) {
            if (block.position.x > camIzq && block.position.x < camDer) {
                this.ctx.beginPath();
                let p = block.vertices;
                this.ctx.moveTo(p[0].x, p[0].y);
                for (let j = 1; j < p.length; j++) {
                    this.ctx.lineTo(p[j].x, p[j].y);
                }
                this.ctx.closePath();
                // Solo llenamos, quitamos el stroke para evitar líneas rectangulares
                this.ctx.fill();
            }
        }

        // Borde superior continuo para que se vea bonito (sin costuras)
        this.ctx.beginPath();
        let empezo = false;
        for(let block of this.terrenoBlocks) {
            if (block.position.x > camIzq && block.position.x < camDer) {
                let p = block.vertices;
                if(!empezo) {
                    this.ctx.moveTo(p[0].x, p[0].y);
                    empezo = true;
                } else {
                    this.ctx.lineTo(p[0].x, p[0].y);
                }
                this.ctx.lineTo(p[1].x, p[1].y);
            }
        }
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = (progreso > 0.8) ? '#C2B280' : '#2E7D32';
        this.ctx.stroke();

        // --- DECORACIONES DE PLAYA ---
        if (progreso > 0.7) {
            this.dibujarPalmera(this.distanciaTotal - 500, this.alto - 120);
            this.dibujarPalmera(this.distanciaTotal - 100, this.alto - 100);
            this.dibujarPalmera(this.distanciaTotal + 200, this.alto - 80);
        }

        // --- OBJETOS ---
        for(let corazon of this.corazones) {
            if (corazon.position.x > camIzq && corazon.position.x < camDer) {
                this.dibujarCorazon(corazon.position.x, corazon.position.y);
            }
        }
        for(let turbo of this.turbos) {
            if (turbo.position.x > camIzq && turbo.position.x < camDer) {
                this.dibujarTurbo(turbo.position.x, turbo.position.y);
            }
        }

        // --- COCHE BYD ---
        this.dibujarBYD();

        this.ctx.restore();

        // --- UI ESTADOS FINALES ---
        if(this.gameOver) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0,0,this.ancho, this.alto);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 30px Poppins, sans-serif';
            this.ctx.textAlign = 'center';
            
            let txt = this.motivoPerdida === 'vuelco' ? '¡Se volcó el carro! 💥' : '¡Sin gasolina! ⛽';
            this.ctx.fillText(txt, this.ancho/2, this.alto/2 - 10);
            
            this.ctx.font = '16px Poppins, sans-serif';
            this.ctx.fillText('Cierra el juego o elige un nivel de nuevo', this.ancho/2, this.alto/2 + 30);
        } else if (this.victoria) {
            this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
            this.ctx.fillRect(0,0,this.ancho, this.alto);
            this.ctx.fillStyle = '#ff7f50';
            this.ctx.font = 'bold 30px Poppins, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('¡Llegamos a la playa! 🏖️', this.ancho/2, this.alto/2 - 10);
            this.ctx.fillStyle = '#333';
            this.ctx.font = '16px Poppins, sans-serif';
            this.ctx.fillText('Contigo manejo a cualquier lado 💖', this.ancho/2, this.alto/2 + 30);
        }
    }

    dibujarBYD() {
        const x = this.carBody.position.x;
        const y = this.carBody.position.y;
        const ang = this.carBody.angle;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(ang);

        // Chasis Blanco
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.roundRect(-55, -15, 110, 30, 5); // Base
        this.ctx.roundRect(-30, -35, 60, 25, 8);  // Cabina
        this.ctx.fill();
        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Ventanas
        this.ctx.fillStyle = '#88ccff';
        this.ctx.beginPath();
        this.ctx.roundRect(-25, -30, 25, 15, 3); // Trasera
        this.ctx.roundRect(5, -30, 20, 15, 3); // Delantera
        this.ctx.fill();

        // Logo BYD
        this.ctx.fillStyle = '#555';
        this.ctx.font = 'bold 10px "Playfair Display", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BYD', -2, 5);

        // Pareja
        this.ctx.fillStyle = '#333'; // Él
        this.ctx.beginPath();
        this.ctx.arc(15, -20, 6, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ff99cc'; // Ella
        this.ctx.beginPath();
        this.ctx.arc(-10, -20, 6, 0, Math.PI*2);
        this.ctx.fill();

        // Luces
        this.ctx.fillStyle = '#ff3333';
        this.ctx.fillRect(-55, -5, 5, 8); // Freno trasero
        this.ctx.fillStyle = '#eeffff';
        this.ctx.fillRect(50, -5, 5, 8);  // Faro delantero

        this.ctx.restore();

        // Llantas
        this.dibujarLlanta(this.wheelA);
        this.dibujarLlanta(this.wheelB);
    }

    dibujarLlanta(wheelBody) {
        this.ctx.save();
        this.ctx.translate(wheelBody.position.x, wheelBody.position.y);
        this.ctx.rotate(wheelBody.angle);
        
        // Goma negra
        this.ctx.fillStyle = '#222';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 18, 0, Math.PI*2);
        this.ctx.fill();
        
        // Rin
        this.ctx.fillStyle = '#ddd';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI*2);
        this.ctx.fill();
        
        // Línea (rines)
        this.ctx.strokeStyle = '#aaa';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-18,0);
        this.ctx.lineTo(18, 0);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(0,-18);
        this.ctx.lineTo(0, 18);
        this.ctx.stroke();

        this.ctx.restore();
    }

    dibujarCorazon(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(0.8, 0.8);
        this.ctx.fillStyle = '#ff4757';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 5);
        this.ctx.bezierCurveTo(0, -15, -20, -15, -20, 5);
        this.ctx.bezierCurveTo(-20, 20, 0, 30, 0, 35);
        this.ctx.bezierCurveTo(0, 30, 20, 20, 20, 5);
        this.ctx.bezierCurveTo(20, -15, 0, -15, 0, 5);
        this.ctx.fill();
        
        this.ctx.shadowColor = '#ff4757';
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.restore();
    }

    dibujarTurbo(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.fillStyle = '#ffdd59'; // Amarillo eléctrico
        this.ctx.beginPath();
        this.ctx.moveTo(0, -15);
        this.ctx.lineTo(8, -2);
        this.ctx.lineTo(2, -2);
        this.ctx.lineTo(10, 15);
        this.ctx.lineTo(-6, 2);
        this.ctx.lineTo(0, 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowColor = '#ffdd59';
        this.ctx.shadowBlur = 15;
        this.ctx.fill();
        this.ctx.restore();
    }

    dibujarPalmera(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Tronco
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.moveTo(-5, 0);
        this.ctx.quadraticCurveTo(10, -50, 0, -100);
        this.ctx.lineTo(5, -100);
        this.ctx.quadraticCurveTo(15, -50, 5, 0);
        this.ctx.fill();

        // Hojas
        this.ctx.fillStyle = '#228B22';
        for(let i=0; i<5; i++) {
            this.ctx.save();
            this.ctx.translate(2, -100);
            this.ctx.rotate(i * Math.PI * 0.4);
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.quadraticCurveTo(30, -20, 50, 0);
            this.ctx.quadraticCurveTo(30, 10, 0, 0);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
}
