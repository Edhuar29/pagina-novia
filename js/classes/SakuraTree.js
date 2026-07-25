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
            this.drawFlower(x, y, len * 0.8 + 2);
            return;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        
        const endX = x + Math.cos(angle) * len;
        const endY = y + Math.sin(angle) * len;
        
        // Curvatura aleatoria para más realismo
        const curveOffset = (Math.random() - 0.5) * len * 0.2;
        const cpX = x + Math.cos(angle + 0.2) * (len / 2) + curveOffset;
        const cpY = y + Math.sin(angle + 0.2) * (len / 2) + curveOffset;
        
        this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        
        // El grosor disminuye con el nivel
        this.ctx.lineWidth = Math.max(level * 1.8, 0.5);
        
        // Color más realista (marrón oscuro con variaciones)
        const woodColor = 40 + Math.random() * 20;
        this.ctx.strokeStyle = \`rgb(\${woodColor}, \${woodColor - 10}, 20)\`;
        this.ctx.stroke();

        // Recursión
        // Las ramas se encogen un 75% a 85%
        const shrink = 0.7 + Math.random() * 0.15;
        const newLen = len * shrink;
        // Ángulo de apertura de las ramas (aleatorio)
        const spread1 = 0.2 + Math.random() * 0.3; 
        const spread2 = 0.2 + Math.random() * 0.3; 
        
        this.branch(endX, endY, newLen, angle - spread1, level - 1);
        this.branch(endX, endY, newLen, angle + spread2, level - 1);
        
        // A veces añade una pequeña rama extra (para más densidad)
        if (Math.random() > 0.6 && level > 2) {
            this.branch(endX, endY, newLen * 0.6, angle + (Math.random() - 0.5), level - 2);
        }
    }

    drawFlower(x, y, size) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // 5 pétalos
        const petals = 5;
        this.ctx.fillStyle = 'rgba(255, 183, 197, 0.85)';
        for (let i = 0; i < petals; i++) {
            this.ctx.rotate((Math.PI * 2) / petals);
            this.ctx.beginPath();
            // Forma de pétalo de sakura real (como un óvalo cortado en la punta)
            this.ctx.moveTo(0, 0);
            this.ctx.quadraticCurveTo(-size, -size, 0, -size * 1.5);
            this.ctx.quadraticCurveTo(size, -size, 0, 0);
            this.ctx.fill();
        }
        
        // Centro de la flor
        this.ctx.fillStyle = 'rgba(220, 100, 120, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawPetals() {
        this.petalos.forEach(p => {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.angle);
            
            // Dibujar pétalo realista individual cayendo
            this.ctx.fillStyle = 'rgba(255, 183, 197, 0.9)';
            this.ctx.beginPath();
            let s = p.size;
            this.ctx.moveTo(0, 0);
            this.ctx.quadraticCurveTo(-s, -s, 0, -s * 1.5);
            this.ctx.quadraticCurveTo(s, -s, 0, 0);
            this.ctx.fill();
            
            this.ctx.restore();

            // Mover pétalo
            p.x += p.speedX;
            p.y += p.speedY;
            p.angle += p.spin;

            // Reiniciar si sale de la pantalla
            if (p.y > this.canvas.height + 20) {
                p.y = -20;
                p.x = Math.random() * this.canvas.width;
            }
        });
    }
}
