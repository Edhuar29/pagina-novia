import { ReproductorMusical } from './classes/ReproductorMusical.js?v=20';
import { AnimadorScroll } from './classes/AnimadorScroll.js?v=20';
import { ContadorAmor } from './classes/ContadorAmor.js?v=20';
import { BoletoSorpresa } from './classes/BoletoSorpresa.js?v=20';
import { Navegacion } from './classes/Navegacion.js?v=20';
import { JuegosController } from './classes/JuegosController.js?v=20';
import { JuegoTicTacToe } from './classes/JuegoTicTacToe.js?v=20';
import { JuegoFlappyCorazon } from './classes/JuegoFlappyCorazon.js?v=20';
import { JuegoAtrapaBesos } from './classes/JuegoAtrapaBesos.js?v=20';
import { JuegoViajeBYD } from './classes/JuegoViajeBYD.js?v=20';
import { ThemeController } from './classes/ThemeController.js?v=20';
import { ArbolCorazones } from './classes/ArbolCorazones.js?v=20';
import { EspejoMagico } from './classes/EspejoMagico.js?v=20';

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

    // Inicializar Árbol de Corazones
    const arbol = new ArbolCorazones('sakuraCanvas', '2026-07-10T00:00:00'); 
    const espejoMagico = new EspejoMagico();

    console.log("Aplicación iniciada correctamente.");

    const besos = new JuegoAtrapaBesos();
    const byd = new JuegoViajeBYD();

});
