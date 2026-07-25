export class BonsaiTree {
    constructor(canvasId, fechaInicio) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.fechaInicio = new Date(fechaInicio);
        this.diasJuntos = this.calcularDias();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.hojas = [];
        this.generarHojasIniciales();
        
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
        this.canvas.height = 350; // Un poco más alto para el bonsái
        
        if (!this.treeCanvas) {
            this.treeCanvas = document.createElement('canvas');
            this.treeCtx = this.treeCanvas.getContext('2d');
        }
        this.treeCanvas.width = this.canvas.width;
        this.treeCanvas.height = this.canvas.height;
        this.drawBonsaiToCache();
    }

    drawBonsaiToCache() {
        const ctx = this.treeCtx;
        ctx.clearRect(0, 0, this.treeCanvas.width, this.treeCanvas.height);

        const startX = this.treeCanvas.width / 2;
        const startY = this.treeCanvas.height - 20;

        // Base/Maceta del Bonsái
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.roundRect(startX - 60, startY, 120, 20, 5);
        ctx.fill();
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.roundRect(startX - 65, startY, 130, 8, 3);
        ctx.fill();

        // Tronco principal
        const length = 60 + Math.min(this.diasJuntos / 10, 40); // Crece con el tiempo
        const thickness = 25 + Math.min(this.diasJuntos / 50, 15); // Engruesa con el tiempo
        
        this.drawBranch(ctx, startX, startY, length, -Math.PI / 2, thickness, 0);
    }

    drawBranch(ctx, x, y, length, angle, thickness, depth) {
        if (depth > 6 || thickness < 1) return;

        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;

        // Gradiente de madera milenaria
        const grad = ctx.createLinearGradient(x, y, endX, endY);
        grad.addColorStop(0, '#3e2723');
        grad.addColorStop(1, '#5d4037');

        ctx.beginPath();
        ctx.moveTo(x, y);
        // Usar curvas de bezier para hacer orgánico el tronco
        const cp1x = x + Math.cos(angle - 0.2) * (length / 2);
        const cp1y = y + Math.sin(angle - 0.2) * (length / 2);
        ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
        
        ctx.lineCap = 'round';
        ctx.lineWidth = thickness;
        ctx.strokeStyle = grad;
        ctx.stroke();

        // Ramas
        const branches = depth === 0 ? 3 : 2; // Más ramas en la base
        for (let i = 0; i < branches; i++) {
            const newAngle = angle + (Math.random() * 1.2 - 0.6);
            const newLength = length * (0.65 + Math.random() * 0.15);
            const newThickness = thickness * 0.65;
            
            // Crecer follaje estático
            if (depth > 3 && Math.random() > 0.3) {
                this.drawLeaves(ctx, endX, endY, newThickness * 4);
            }

            this.drawBranch(ctx, endX, endY, newLength, newAngle, newThickness, depth + 1);
        }
    }

    drawLeaves(ctx, x, y, size) {
        // Racimo de hojas realista (Bonsái pino/enebro)
        ctx.fillStyle = `rgba(${30 + Math.random()*20}, ${100 + Math.random()*50}, ${40 + Math.random()*20}, 0.8)`;
        ctx.beginPath();
        ctx.arc(x, y, size * 2 + Math.min(this.diasJuntos / 20, 15), 0, Math.PI * 2);
        ctx.fill();
        
        // Highlights
        ctx.fillStyle = `rgba(100, 200, 100, 0.4)`;
        ctx.beginPath();
        ctx.arc(x - size/2, y - size/2, size, 0, Math.PI * 2);
        ctx.fill();
    }

    generarHojasIniciales() {
        // Hojas cayendo suavemente
        const cantidad = Math.min(this.diasJuntos, 80); 
        for (let i = 0; i < cantidad; i++) {
            this.hojas.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 4 + 2,
                speedX: Math.random() * 0.5 - 0.25,
                speedY: Math.random() * 0.5 + 0.2,
                angle: Math.random() * Math.PI * 2,
                spin: Math.random() * 0.05 - 0.025,
                color: `rgba(${40 + Math.random()*30}, ${120 + Math.random()*60}, ${50 + Math.random()*30}, 0.8)`
            });
        }
    }

    iniciarAnimacion() {
        const loop = () => {
            if (!this.ctx) return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Dibujar árbol estático
            if (this.treeCanvas) {
                this.ctx.drawImage(this.treeCanvas, 0, 0);
            }
            
            // Animar hojas cayendo
            this.hojas.forEach(hoja => {
                hoja.x += hoja.speedX;
                hoja.y += hoja.speedY;
                hoja.angle += hoja.spin;
                
                // Efecto de viento sutil
                hoja.speedX += (Math.random() - 0.5) * 0.02;

                if (hoja.y > this.canvas.height) {
                    hoja.y = -10;
                    hoja.x = Math.random() * this.canvas.width;
                }
                if (hoja.x > this.canvas.width) hoja.x = 0;
                if (hoja.x < 0) hoja.x = this.canvas.width;

                this.ctx.save();
                this.ctx.translate(hoja.x, hoja.y);
                this.ctx.rotate(hoja.angle);
                
                // Dibujar hojita detallada
                this.ctx.fillStyle = hoja.color;
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, hoja.size, hoja.size / 2, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            });

            requestAnimationFrame(loop);
        };
        loop();
    }
}
