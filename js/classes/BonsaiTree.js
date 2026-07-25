export class BonsaiTree {
    constructor(canvasId, fechaInicio) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.fechaInicio = new Date(fechaInicio);
        this.diasJuntos = this.calcularDias();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.petalos = [];
        this.generarPetalosIniciales();
        
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
        this.canvas.height = 380; 
        
        if (!this.treeCanvas) {
            this.treeCanvas = document.createElement('canvas');
            this.treeCtx = this.treeCanvas.getContext('2d', { alpha: true });
        }
        this.treeCanvas.width = this.canvas.width;
        this.treeCanvas.height = this.canvas.height;
        this.dibujarArbolGhibli();
    }

    dibujarArbolGhibli() {
        const ctx = this.treeCtx;
        ctx.clearRect(0, 0, this.treeCanvas.width, this.treeCanvas.height);

        const startX = this.treeCanvas.width / 2;
        const startY = this.treeCanvas.height - 20;

        // Base - Montículo de hierba suave (Estilo Ghibli)
        ctx.fillStyle = '#7ebd7e';
        ctx.beginPath();
        ctx.ellipse(startX, startY + 10, 100, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6ab06a'; // Sombra de la hierba
        ctx.beginPath();
        ctx.ellipse(startX, startY + 15, 90, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tronco Ghibli (Marrón cálido pastel)
        const maxGrowth = Math.min(this.diasJuntos / 10, 50);
        const length = 70 + maxGrowth; 
        const thickness = 28 + Math.min(this.diasJuntos / 50, 15); 
        
        // Fase 1: Dibujar ramas
        this.drawBranch(ctx, startX, startY, length, -Math.PI / 2, thickness, 0);

        // Fase 2: Dibujar follaje "Esponjoso" (Nubes de sakura)
        // Guardamos posiciones clave en Fase 1 para pintar nubes grandes en Fase 2
        this.cloudPositions.forEach(pos => {
            this.drawFluffyClouds(ctx, pos.x, pos.y, pos.size);
        });
    }

    drawBranch(ctx, x, y, length, angle, thickness, depth) {
        if (depth === 0) this.cloudPositions = [];
        if (depth > 5 || thickness < 1.5) return;

        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;

        // Color del tronco
        ctx.strokeStyle = '#8B6B63'; // Marrón suave
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(x, y);
        // Curva suave
        const cp1x = x + Math.cos(angle - 0.15) * (length / 2);
        const cp1y = y + Math.sin(angle - 0.15) * (length / 2);
        ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
        ctx.stroke();

        // Highlight sutil
        ctx.strokeStyle = '#A38178';
        ctx.lineWidth = thickness * 0.4;
        ctx.beginPath();
        ctx.moveTo(x - thickness*0.2, y);
        ctx.quadraticCurveTo(cp1x - thickness*0.2, cp1y, endX - thickness*0.2, endY);
        ctx.stroke();

        const branches = depth === 0 ? 3 : 2;
        for (let i = 0; i < branches; i++) {
            const newAngle = angle + (Math.random() * 1.4 - 0.7);
            const newLength = length * (0.65 + Math.random() * 0.1);
            const newThickness = thickness * 0.65;

            // Recolectar posiciones para el follaje en ramas altas
            if (depth > 2 && Math.random() > 0.4) {
                this.cloudPositions.push({ x: endX, y: endY, size: newThickness * 8 + 20 });
            }

            this.drawBranch(ctx, endX, endY, newLength, newAngle, newThickness, depth + 1);
        }
    }

    drawFluffyClouds(ctx, x, y, size) {
        // Generar un estilo nube esponjosa combinando círculos superpuestos
        const numCircles = 5;
        for(let i=0; i<numCircles; i++) {
            const cx = x + (Math.random() - 0.5) * size;
            const cy = y + (Math.random() - 0.5) * size * 0.6;
            const cSize = size * (0.5 + Math.random() * 0.5);

            // Sombra
            ctx.fillStyle = '#ff9ebb';
            ctx.beginPath();
            ctx.arc(cx, cy + 5, cSize, 0, Math.PI * 2);
            ctx.fill();

            // Color Principal
            ctx.fillStyle = '#ffb7cc';
            ctx.beginPath();
            ctx.arc(cx, cy, cSize, 0, Math.PI * 2);
            ctx.fill();

            // Brillo
            ctx.fillStyle = '#ffd5e1';
            ctx.beginPath();
            ctx.arc(cx - 5, cy - 5, cSize * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    generarPetalosIniciales() {
        const cantidad = Math.min(this.diasJuntos, 120); 
        for (let i = 0; i < cantidad; i++) {
            this.petalos.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 4 + 3,
                speedX: Math.random() * 1 - 0.5,
                speedY: Math.random() * 1 + 0.5,
                angle: Math.random() * Math.PI * 2,
                spin: Math.random() * 0.1 - 0.05,
                color: Math.random() > 0.5 ? '#ffb7cc' : '#ffd5e1'
            });
        }
    }

    iniciarAnimacion() {
        const loop = () => {
            if (!this.ctx) return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Dibujar árbol estático cachead
            if (this.treeCanvas) {
                this.ctx.drawImage(this.treeCanvas, 0, 0);
            }
            
            // Animar pétalos
            this.petalos.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                p.angle += p.spin;
                
                // Viento (movimiento oscilatorio suave)
                p.speedX += Math.sin(Date.now() / 1000 + p.y) * 0.01;

                if (p.y > this.canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * this.canvas.width;
                }
                if (p.x > this.canvas.width + 20) p.x = -20;
                if (p.x < -20) p.x = this.canvas.width + 20;

                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.angle);
                
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                // Dibujar forma de pétalo en lugar de círculo
                this.ctx.moveTo(0, -p.size);
                this.ctx.bezierCurveTo(p.size, -p.size, p.size, p.size, 0, p.size);
                this.ctx.bezierCurveTo(-p.size, p.size, -p.size, -p.size, 0, -p.size);
                this.ctx.fill();
                
                this.ctx.restore();
            });

            requestAnimationFrame(loop);
        };
        loop();
    }
}
