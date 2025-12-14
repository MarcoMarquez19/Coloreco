<script lang="ts">
    import MesaCentral from '$lib/components/iconos/MesaCentral.png';
    import LamparaTecho from '$lib/assets/LamparaTecho.png';
    import { goto } from '$app/navigation';

    // Funciones para manejar las interacciones de cada elemento
    function manejarSalida() {
        console.log('Navegando a salida');
        goto('/seleccionar-estudio');
    }

    function manejarMesaTrabajo() {
        console.log('Abriendo mesa de trabajo');
        // TODO: Implementar navegación a la mesa de trabajo
    }

    function manejarLogros() {
        console.log('Abriendo logros');
        // TODO: Implementar visualización de logros
    }

    function manejarAjustes() {
        console.log('Abriendo ajustes');
        goto('/ajustes');
    }

    function manejarGaleria() {
        console.log('Abriendo galería');
        // TODO: Implementar navegación a la galería
    }

</script>

<div class="estudio-contenedor" aria-label="Contenedor del estudio del artista" data-magnificable>
    <!-- Elemento superior centrado (sin texto) -->
    <div inert
        class="elemento-interactivo elemento-superior"
        aria-label="Elemento decorativo lampara"
    >
        <div class="svg-contenedor">    
            <img src={LamparaTecho} width="150px" height="auto" alt="Lampara de techo decorativa">
        </div>
    </div>

    <!-- Elemento izquierdo: Salida -->
    <button 
        class="elemento-interactivo elemento-salida"
        on:click={manejarSalida}
        aria-label="Salir del estudio - Presione Escape"
        tabindex="0"
    >
        <div class="svg-contenedor">
            <img src={LamparaTecho} width="150px" height="auto" alt="">
            <span class="texto-elemento" data-magnificable>SALIDA (ESC)</span>
        </div>
    </button>
    
    <!-- Elemento entre puerta y mesa: Galería -->
    <button 
        class="elemento-interactivo elemento-galeria"
        on:click={manejarGaleria}
        aria-label="Visitar la galería de arte"
        tabindex="0"
    >
        <div class="svg-contenedor">
            <img src={LamparaTecho} width="150px" height="auto" alt="">
            <span class="texto-elemento" data-magnificable>Galería</span>
        </div>
    </button>

    <!-- Elemento central: Mesa de trabajo -->
    <button 
        class="elemento-interactivo elemento-mesa"
        on:click={manejarMesaTrabajo}
        aria-label="Ir a la mesa de trabajo"
        tabindex="0"
    >
        <div class="svg-contenedor">
            <img src={MesaCentral} width="300px" height="auto" alt="">
            <span class="texto-elemento" data-magnificable>Mesa de trabajo</span>
        </div>
    </button>

    <!-- Elemento derecho: Logros -->
    <button 
        class="elemento-interactivo elemento-logros"
        on:click={manejarLogros}
        aria-label="Ver logros obtenidos"
        tabindex="0"
    >
        <div class="svg-contenedor">
            <img src={LamparaTecho} width="150px" height="auto" alt="">
            <span class="texto-elemento" data-magnificable>Logros</span>
        </div>
    </button>

    <!-- Elemento inferior derecho: Ajustes -->
    <button 
        class="elemento-interactivo elemento-ajustes"
        on:click={manejarAjustes}
        aria-label="Abrir ajustes - Presione Control más A"
        tabindex="0"
    >
        <div class="svg-contenedor">
            <img src={LamparaTecho} width="150px" height="auto" alt="">
            <span class="texto-elemento" data-magnificable>Ajustes (CTRL + A)</span>
        </div>
    </button>

    <!-- Título del estudio -->
    <h1 class="titulo-estudio" data-magnificable>ESTUDIO <br> &nbsp;&nbsp;&nbsp;&nbsp; DE <br> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ARTE</h1>
</div>

<style>
    .estudio-contenedor {
        position: relative;
        padding: 0;
        margin: 0;
        margin-top: 2rem;
        border: 3px solid #000;
        border-radius: 8px;
        min-height: 85vh;
        max-height: 90vh;
        overflow: hidden;
        background: var(--bg, linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%));
    }

    /* Estilos base para elementos interactivos */
    .elemento-interactivo {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        padding: 0;
        border-radius: 12px;
    }

    /* Efectos de hover y focus para cumplir con WCAG AAA/AA */
    .elemento-interactivo:hover,
    .elemento-interactivo:focus {
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
        outline: 3px solid #2196F3;
        outline-offset: 4px;
    }

    .elemento-interactivo:focus {
        /* Asegurar que el focus sea visible para accesibilidad */
        outline: 4px solid #FF5722;
        outline-offset: 5px;
    }

    .elemento-interactivo:active {
        transform: scale(1.05);
    }

    /* Efecto adicional al hacer hover sobre el SVG */
    .elemento-interactivo:hover .svg-contenedor,
    .elemento-interactivo:focus .svg-contenedor {
        filter: drop-shadow(0 0 10px rgba(33, 150, 243, 0.6));
        animation: pulso 1.5s ease-in-out infinite;
    }

    @keyframes pulso {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
    }

    .svg-contenedor {
        width: auto;
        height: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }

    .texto-elemento {
        font-size: calc(var(--font-size-base, 1rem) * 1.2);
        font-weight: 600;
        color: #333;
        user-select: none;
        transition: color 0.3s ease;
        display: block;
        text-align: center;
        width: 100%;
    }

    .elemento-interactivo:hover .texto-elemento,
    .elemento-interactivo:focus .texto-elemento {
        color: #2196F3;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    /* Posicionamiento específico de cada elemento */
    
    /* Elemento superior centrado */
    .elemento-superior {
        top: -0.2rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 3;
    }

    /* Elemento izquierdo: Salida */
    .elemento-salida {
        left: 2rem;
        top: 50%;
        transform: translateY(-50%);
    }

    /* Elemento central: Mesa de trabajo */
    .elemento-mesa {
        left: 50%;
        top: 65%;
        transform: translate(-50%, -50%);
    }

    /* Elemento derecho: Logros */
    .elemento-logros {
        right: 2rem;
        top: 25%;
        transform: translateY(-50%);
    }

    /* Elemento inferior derecho: Ajustes */
    .elemento-ajustes {
        right: 6rem;
        bottom: 3rem;
    }

    /* Elemento galería (entre salida y mesa, un poco más arriba) */
    .elemento-galeria {
        left: 30%;
        top: 35%;
        transform: translate(-50%, -50%);
    }

    /* Título del estudio */
    .titulo-estudio {
        position: absolute;
        right: 25%;
        top: 30%;
        transform: translateY(-50%);
        font-size: calc(var(--font-size-base,2rem)*1.85);
        font-weight: 900;
        color: #1a1a1a;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin: 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        user-select: none;
        transform: translateX(35%) translateY(-50%) rotate(-20deg);
        letter-spacing: 0.25em;
        z-index: 2;
    }

    /* Mejoras adicionales para alto contraste (modo accesibilidad) */
    @media (prefers-contrast: high) {
        .elemento-interactivo:focus {
            outline-width: 6px;
            outline-color: #000;
        }

        .texto-elemento {
            color: #000;
            font-weight: 700;
        }
    }

    /* Respeto a la preferencia de movimiento reducido */
    @media (prefers-reduced-motion: reduce) {
        .elemento-interactivo,
        .svg-contenedor,
        .texto-elemento {
            transition: none;
        }

        .elemento-interactivo:hover .svg-contenedor,
        .elemento-interactivo:focus .svg-contenedor {
            animation: none;
        }
    }
</style>