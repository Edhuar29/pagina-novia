import { ReproductorMusical } from './classes/ReproductorMusical.js';
import { AnimadorScroll } from './classes/AnimadorScroll.js';
import { ContadorAmor } from './classes/ContadorAmor.js';
import { BoletoSorpresa } from './classes/BoletoSorpresa.js';
import { Navegacion } from './classes/Navegacion.js';
import { JuegosController } from './classes/JuegosController.js';
import { JuegoTicTacToe } from './classes/JuegoTicTacToe.js';
import { JuegoFlappyCorazon } from './classes/JuegoFlappyCorazon.js';
import { JuegoAtrapaBesos } from './classes/JuegoAtrapaBesos.js';
import { JuegoViajeBYD } from './classes/JuegoViajeBYD.js';
import { ThemeController } from './classes/ThemeController.js';

// Cuando la página termine de cargar, inicializamos nuestras clases
document.addEventListener('DOMContentLoaded', () => {
    
    console.log("Iniciando aplicación SPA...");

    // Inicializar controlador de tema (Modo Noche)
    const tema = new ThemeController();

    // Inicializar navegación SPA
    const nav = new Navegacion();

    // Inicializar las animaciones de scroll
    const animador = new AnimadorScroll();

    // Inicializar el reproductor de música
    const reproductor = new ReproductorMusical();

    // Inicializar el contador con una fecha en el PASADO para que cuente hacia arriba
    // (Ejemplo: 10 de Julio de 2023). Cambia esta fecha por tu fecha real.
    const contador = new ContadorAmor("2026-07-10T00:00:00");

    // Inicializar el sobre interactivo (raspadita)
    const sobre = new BoletoSorpresa();

    // Inicializar Control de Juegos y los Minijuegos
    const controlJuegos = new JuegosController();
    const ticTacToe = new JuegoTicTacToe();
    const flappy = new JuegoFlappyCorazon();
    const besos = new JuegoAtrapaBesos();
    const byd = new JuegoViajeBYD();

});
