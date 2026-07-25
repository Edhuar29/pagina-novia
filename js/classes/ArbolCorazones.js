export class ArbolCorazones {
    constructor(canvasId, fechaInicio) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.fechaInicio = new Date(fechaInicio);
        this.diasJuntos = this.calcularDias();
        
        this.corazonesCaidos = [];
        this.corazonesEstaticos = [];
        
        // Colores del estilo acuarela (Rosa claro, Rojo brillante, Rojo vino oscuro)
        this.coloresCorazon = ['#ff99aa', '#ff4d6d', '#800f2f', '#c9184a', '#ffb3c1'];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.generarCorazonesCaidos();
        this.iniciarAnimacion();
    }

    calcularDias() {
        const ahora = new Date();
        const diff = ahora - this.fechaInicio;
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    }

    resize() {
        const parent = this.canvas.parentElement;
        const width = parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
        this.canvas.width = Math.max(width - 40, 200);
        this.canvas.height = 400; 
        
        if (!this.treeCanvas) {
            this.treeCanvas = document.createElement('canvas');
            this.treeCtx = this.treeCanvas.getContext('2d', { alpha: true });
        }
        this.treeCanvas.width = this.canvas.width;
        this.treeCanvas.height = this.canvas.height;
        this.dibujarArbolAcuarela();
    }

    dibujarArbolAcuarela() {
        const ctx = this.treeCtx;
        ctx.clearRect(0, 0, this.treeCanvas.width, this.treeCanvas.height);

        const startX = this.treeCanvas.width / 2;
        const startY = this.treeCanvas.height - 30;

        // Detectar si el modo oscuro está activo
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        // Dibujar el suelo de acuarela (Más sutil en modo oscuro)
        this.dibujarSuelo(ctx, startX, startY, isDark);

        this.corazonesEstaticos = []; // Resetear para recalcular posiciones

        // Tronco (Gris claro en modo oscuro, casi negro en modo claro)
        const crecimiento = Math.min(this.diasJuntos / 10, 60);
        const length = 110 + crecimiento; // Más largo para que no quede amontonado abajo
        const thickness = 12 + Math.min(this.diasJuntos / 100, 8); 
        
        // Ramas y tronco principal
        this.dibujarRama(ctx, startX, startY, length, -Math.PI / 2, thickness, 0, isDark);
        
        // Pintar todos los corazones (follaje) que se registraron en las ramas
        // Ordenarlos aleatoriamente para mezclar colores
        this.corazonesEstaticos.sort(() => Math.random() - 0.5);
        this.corazonesEstaticos.forEach(c => {
            this.dibujarCorazonAcuarela(ctx, c.x, c.y, c.size, c.color, c.angle, c.opacity);
        });
    }

    dibujarSuelo(ctx, x, y, isDark) {
        // Suelo mancha de acuarela roja/rosa
        const grad = ctx.createRadialGradient(x, y + 10, 10, x, y + 10, 180);
        
        if (isDark) {
            grad.addColorStop(0, 'rgba(128, 15, 47, 0.2)'); // Más transparente
            grad.addColorStop(0.5, 'rgba(255, 77, 109, 0.1)');
        } else {
            grad.addColorStop(0, 'rgba(128, 15, 47, 0.4)');
            grad.addColorStop(0.5, 'rgba(255, 77, 109, 0.2)');
        }
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x, y + 10, 180, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trazos de pasto
        ctx.strokeStyle = isDark ? 'rgba(255, 153, 170, 0.3)' : 'rgba(128, 15, 47, 0.5)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 40; i++) {
            const px = x + (Math.random() - 0.5) * 250;
            const py = y + 5 + Math.random() * 10;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.quadraticCurveTo(px + (Math.random() - 0.5) * 20, py - 10 - Math.random() * 15, px + (Math.random() - 0.5) * 30, py - 20 - Math.random() * 20);
            ctx.stroke();
        }
    }

    dibujarRama(ctx, x, y, length, angle, thickness, depth, isDark) {
        if (depth > 6 || thickness < 0.5) return;

        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;

        // Estilo de tinta / acuarela negra para el tronco, más claro en modo oscuro
        ctx.strokeStyle = isDark ? '#b0b0b0' : '#1a1a1a';
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(x, y);
        
        // Tronco irregular (ondulado)
        const cp1x = x + Math.cos(angle - 0.2) * (length / 3);
        const cp1y = y + Math.sin(angle - 0.2) * (length / 3);
        const cp2x = x + Math.cos(angle + 0.2) * (length * 2 / 3);
        const cp2y = y + Math.sin(angle + 0.2) * (length * 2 / 3);
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        ctx.stroke();

        // Ramificaciones (más esparcidas para evitar amontonamiento)
        const branches = depth === 0 ? (Math.random() > 0.5 ? 3 : 2) : 2;
        
        for (let i = 0; i < branches; i++) {
            // Ampliar el ángulo para abrir más el árbol
            const newAngle = angle + (Math.random() * 1.6 - 0.8);
            const newLength = length * (0.65 + Math.random() * 0.15);
            const newThickness = thickness * 0.6;

            // Generar follaje de corazones alrededor de ramas medias y altas
            if (depth > 1) {
                // Menos corazones por rama pero más esparcidos
                const cantidadCorazones = Math.floor(Math.random() * 3) + 1;
                for (let j = 0; j < cantidadCorazones; j++) {
                    // Distribuir más a lo largo y ancho de la rama
                    const t = Math.random();
                    // Mayor offset aleatorio (80 en vez de 40)
                    const spread = 70 + (depth * 10);
                    const hx = x + (endX - x) * t + (Math.random() - 0.5) * spread;
                    const hy = y + (endY - y) * t + (Math.random() - 0.5) * spread;
                    
                    this.corazonesEstaticos.push({
                        x: hx,
                        y: hy,
                        size: 7 + Math.random() * 14, // Ligeramente más grandes para llenar mejor
                        color: this.coloresCorazon[Math.floor(Math.random() * this.coloresCorazon.length)],
                        angle: (Math.random() - 0.5) * 0.8,
                        opacity: 0.6 + Math.random() * 0.4
                    });
                }
            }

            this.dibujarRama(ctx, endX, endY, newLength, newAngle, newThickness, depth + 1, isDark);
        }
    }

    dibujarCorazonAcuarela(ctx, x, y, size, color, angle, opacity = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // Darle un estilo levemente irregular como brocha de acuarela
        ctx.scale(1 + (Math.random() - 0.5)*0.1, 1 + (Math.random() - 0.5)*0.1);

        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(0, topCurveHeight);
        
        // Curva izquierda superior
        ctx.bezierCurveTo(
            -size / 2, -size / 2, 
            -size, topCurveHeight, 
            0, size
        );
        
        // Curva derecha superior
        ctx.bezierCurveTo(
            size, topCurveHeight, 
            size / 2, -size / 2, 
            0, topCurveHeight
        );
        
        ctx.fill();
        ctx.restore();
    }

    generarCorazonesCaidos() {
        const cantidad = Math.min(this.diasJuntos, 80); 
        for (let i = 0; i < cantidad; i++) {
            this.corazonesCaidos.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 4 + Math.random() * 8,
                speedX: 1 + Math.random() * 2, // Viento empuja a la derecha (basado en imagen)
                speedY: 0.5 + Math.random() * 1.5, // Caída suave
                angle: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.1,
                color: this.coloresCorazon[Math.floor(Math.random() * this.coloresCorazon.length)],
                opacity: 0.5 + Math.random() * 0.5
            });
        }
    }

    iniciarAnimacion() {
        const loop = () => {
            if (!this.ctx) return;

            // Observar cambios de tema para redibujar el árbol
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            if (this.lastTheme !== currentTheme) {
                this.lastTheme = currentTheme;
                this.dibujarArbolAcuarela();
            }

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Dibujar árbol estático cacheado
            if (this.treeCanvas) {
                this.ctx.drawImage(this.treeCanvas, 0, 0);
            }
            
            // Animar corazones voladores
            this.corazonesCaidos.forEach(c => {
                c.x += c.speedX;
                c.y += c.speedY;
                c.angle += c.spin;
                
                // Efecto de viento ondulante
                c.speedX += Math.sin(Date.now() / 1000 + c.y) * 0.02;

                if (c.y > this.canvas.height + 20) {
                    c.y = -20;
                    c.x = Math.random() * this.canvas.width;
                }
                if (c.x > this.canvas.width + 20) {
                    c.x = -20;
                }
                
                this.dibujarCorazonAcuarela(this.ctx, c.x, c.y, c.size, c.color, c.angle, c.opacity);
            });

            requestAnimationFrame(loop);
        };
        loop();
    }
}
