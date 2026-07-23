export class ContadorAmor {
    constructor(fechaInicioTexto) {
        this.fechaInicio = new Date(fechaInicioTexto).getTime();
        this.elementoDias = document.getElementById('contador-dias');
        this.elementoHoras = document.getElementById('contador-horas');
        this.elementoMinutos = document.getElementById('contador-minutos');
        this.elementoSegundos = document.getElementById('contador-segundos');
        
        if (this.elementoDias) {
            this.iniciar();
        }
    }

    iniciar() {
        this.actualizarContador();
        setInterval(() => this.actualizarContador(), 1000);
    }

    actualizarContador() {
        const ahora = new Date().getTime();
        let diferencia = ahora - this.fechaInicio;

        // Si la fecha es en el futuro (por error o timezone), mostrar 0
        if (diferencia < 0) diferencia = 0;

        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

        this.elementoDias.textContent = dias;
        this.elementoHoras.textContent = horas;
        this.elementoMinutos.textContent = minutos;
        this.elementoSegundos.textContent = segundos;
    }
}
