export class SakuraTree {
    constructor(canvasId, fechaInicio) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.fechaInicio = new Date(fechaInicio);
        this.diasJuntos = this.calcularDias();
        
        // Ajustar tamaño del canvas al contenedor
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
        // Obtenemos el ancho del contenedor padre
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth - 40; // padding
        this.canvas.height = 300; // altura fija
        this.drawTree();
    }

    generarPetalosIniciales() {
        // La cantidad de pétalos cayendo depende de los días
        const cantidad = Math.min(this.diasJuntos, 150); 
        for (let i = 0; i < cantidad; i++) {
            this.petalos.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 2,
                speedX: Math.random() * 1 - 0.5,
                speedY: Math.random() * 1 + 0.5,
                angle: Math.random() * Math.PI * 2,
                spin: Math.random() * 0.1 - 0.05
            });
        }
    }

    iniciarAnimacion() {
        const loop = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawTree();
            this.drawPetals();
            requestAnimationFrame(loop);
        };
        loop();
    }

    drawTree() {
        // Nivel de profundidad del fractal (crece con los días, máximo 9 para no saturar)
        // Ejemplo: 0 días = nivel 1. 365 días = nivel 9.
        let maxLevel = Math.min(Math.floor(this.diasJuntos / 40) + 3, 9);
        
        // Tronco inicial
        const startX = this.canvas.width / 2;
        const startY = this.canvas.height;
        const len = this.canvas.height / 4;
        const angle = -Math.PI / 2; // Hacia arriba
        
        this.ctx.save();
        this.ctx.lineCap = 'round';
        this.branch(startX, startY, len, angle, maxLevel);
        this.ctx.restore();
    }

    branch(x, y, len, angle, level) {
        if (level === 0) {
            // Dibujar flor en la punta
            this.drawFlower(x, y, len * 0.5);
            return;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        
        const endX = x + Math.cos(angle) * len;
        const endY = y + Math.sin(angle) * len;
        
        this.ctx.lineTo(endX, endY);
        
        // El grosor disminuye con el nivel
        this.ctx.lineWidth = level * 1.5;
        this.ctx.strokeStyle = '#4A3728'; // Color tronco
        this.ctx.stroke();

        // Recursión
        // Las ramas se encogen un 75%
        const newLen = len * 0.75;
        // Ángulo de apertura de las ramas
        const spread = 0.4; 
        
        this.branch(endX, endY, newLen, angle - spread, level - 1);
        this.branch(endX, endY, newLen, angle + spread, level - 1);
    }

    drawFlower(x, y, size) {
        this.ctx.fillStyle = 'rgba(255, 183, 197, 0.8)'; // Rosa sakura
        this.ctx.beginPath();
        this.ctx.arc(x, y, Math.max(size, 3), 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPetals() {
        this.ctx.fillStyle = 'rgba(255, 183, 197, 0.9)';
        this.petalos.forEach(p => {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.angle);
            
            // Dibujar pétalo (un óvalo ligeramente deformado)
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();

            // Mover pétalo
            p.x += p.speedX;
            p.y += p.speedY;
            p.angle += p.spin;

            // Reiniciar si sale de la pantalla
            if (p.y > this.canvas.height) {
                p.y = -10;
                p.x = Math.random() * this.canvas.width;
            }
        });
    }
}
