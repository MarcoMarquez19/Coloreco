<script lang="ts">
    import LibroDibujo from '$lib/components/iconos/LibroDibujo.png';
    import CuerpoHumano from '$lib/components/iconos/CuerpoHumano.png';
    import LibroHistorias from '$lib/components/iconos/LibroCuentos.png';
    import { goto } from '$app/navigation';
    import Trofeo from '$lib/components/iconos/Trofeo.svelte';
    import { onMount } from 'svelte';
    import { configuraciones } from '$lib/stores/settings';
    import { obtenerArtistaActivo } from '$lib/db/artistas.service';
    import { calcularRangoArtista } from '$lib/db/logros.service';
    import { audioStore, clickSound } from '$lib/stores/audio';

    // Props para controlar el trofeo dinámicamente
    let rangoTrofeo = $state<'oro' | 'plata' | 'bronce' | null>(null);
    let textoRango = $state('...');

    // Detectar si hay filtros de fuente o espaciado activos
    let hayFiltrosActivos = $derived(
        $configuraciones.multiplicadorTamanioFuente !== 1 || 
        $configuraciones.multiplicadorEspaciado !== 1
    );

    function irALogrosTaller() {
        goto(`logros/escenas`);
    }

    function irALogrosCuerpo() {
        goto(`logros/cuerpo-humano`);
    }

    function irALogrosHistorias() {
        goto(`logros/historias`);
    }

    // Cargar rango del artista
    async function cargarRango() {
        const artista = await obtenerArtistaActivo();
        if (!artista || !artista.id) return;
        
        const rango = await calcularRangoArtista(artista.id);
        if (rango === 'oro') {
            rangoTrofeo = 'oro';
            textoRango = 'Oro';
        } else if (rango === 'plata') {
            rangoTrofeo = 'plata';
            textoRango = 'Plata';
        } else if (rango === 'bronce') {
            rangoTrofeo = 'bronce';
            textoRango = 'Bronce';
        } else {
            rangoTrofeo = null;
            textoRango = 'Sin Rango';
        }
    }

    let contenedorLogrosRef: HTMLElement | null = null;

    /** Calcula y aplica la escala según la altura de la ventana (máx 1080px) */
    function actualizarEscala(): void {
        if (!contenedorLogrosRef) return;
        const maxHeight = 1080; // referencia 1080p
        const rawScale = window.innerHeight / maxHeight;
        // limitar entre 0.6 y 1 para evitar escalados excesivos
        const scale = Math.max(0.6, Math.min(1, rawScale));
        contenedorLogrosRef.style.transform = `scale(${scale})`;
        contenedorLogrosRef.style.transformOrigin = 'top center';
    }

    onMount(() => {
        document.body.style.overflow = 'hidden';
        audioStore.playMusic('default');
        cargarRango();
        return () => {
            document.body.style.overflow = ''; // Restaurar al desmontar
        };
    });

    $effect(() => {
        actualizarEscala();
        window.addEventListener('resize', actualizarEscala);
        return () => {
            window.removeEventListener('resize', actualizarEscala);
            // restaurar transform si existe
            if (contenedorLogrosRef) {
                contenedorLogrosRef.style.transform = '';
                contenedorLogrosRef.style.transformOrigin = '';
                contenedorLogrosRef.style.margin = '';
            }
        };
    })

</script>

<div class="seleccionar-logros-contenedor" bind:this={contenedorLogrosRef} aria-label="Contenedor para seleccionar la categoría de logros" data-magnificable>
    <h1>Rango General</h1>
    
    <div class="trofeo-contenedor">
        <div class="trofeo-con-texto">
            <div class="trofeo-wrapper" data-tipo-trofeo={rangoTrofeo}>
                <Trofeo/>
            </div>
            <p class="texto-trofeo" data-tipo-trofeo={rangoTrofeo}>{textoRango}</p>
        </div>
    </div>

        <button class="boton-logro pattern-yellow"
            aria-label="Ver logros del taller de escenas creativas" 
            title="Logros Taller"   
            onclick={irALogrosTaller}
            use:clickSound
            >
            <img src={LibroDibujo} alt="Logo logros taller de dibujo - Cuaderno de dibujos">
            Logros Taller
        </button>
        <button class="boton-logro pattern-yellow"
            aria-label="Ver logros del cuerpo y yo" 
            title="Logros Cuerpo"
            onclick={irALogrosCuerpo}
            use:clickSound
            >
            <img src={CuerpoHumano} alt="Logo logros cuerpo humano - Imagen del cuerpo humano">
            Logros Cuerpo
        </button>
        <button class="boton-logro pattern-yellow"
            aria-label="Ver logros del rincón de historias" 
            title="Logros Historias"
            onclick={irALogrosHistorias}
            use:clickSound
            >
            <img src={LibroHistorias} alt="Logo logros historias - Libro de historias">
            Logros Historias
        </button>
</div>

<style>
    .seleccionar-logros-contenedor {
        margin: 1vh auto;
        background: transparent;
        z-index: 1;
        max-width: 1080px;
        width: 100%;
        text-align: center;
        align-items: center;
        justify-content: flex-start;
        display: flex;
        flex-direction: column;
    }

    h1 {
        font-size: calc(var(--font-size-base, 1rem) * 2.5);
        margin: 0 0 calc(var(--spacing-base, 1rem) * 0.25) 0;
        padding: 0;
        font-weight: 600;
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.1);
        word-spacing: calc(var(--spacing-base, 1rem) * 0.2);
    }

    .trofeo-contenedor {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: calc(var(--spacing-base, 1rem) * 0.25);
        margin-bottom: calc(var(--spacing-base, 1rem) * 0.25);
        width: 100%;
    }

    .trofeo-con-texto {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: calc(var(--spacing-base, 1rem) * 0.1);
    }

    .trofeo-wrapper {
        width: calc(var(--font-size-base, 1rem) * 10);
        height: calc(var(--font-size-base, 1rem) * 10);
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    }

    .trofeo-wrapper :global(svg) {
        /* Aplicar directamente stroke/fill desde variables de tema o del trofeo para evitar referencias circulares */
        stroke: var(--trofeo-color-borde, var(--icono-color-borde, #B8860B));
        fill: var(--trofeo-color-relleno, var(--icono-color-relleno, #FFD700));
    }

    /* Colores de trofeo según el rango */
    .trofeo-wrapper[data-tipo-trofeo="oro"] :global(svg) {
        --trofeo-color-borde: #B8860B;
        --trofeo-color-relleno: #FFD700;
    }

    .trofeo-wrapper[data-tipo-trofeo="plata"] :global(svg) {
        --trofeo-color-borde: #888888;
        --trofeo-color-relleno: #C0C0C0;
    }

    .trofeo-wrapper[data-tipo-trofeo="bronce"] :global(svg) {
        --trofeo-color-borde: #804A00;
        --trofeo-color-relleno: #CD7F32;
    }

    :global(.trofeo-wrapper[data-tipo-trofeo="oro"] svg path) {
        stroke: var(--trofeo-color-borde, #B8860B);
        fill: var(--trofeo-color-relleno, #FFD700);
    }

    :global(.trofeo-wrapper[data-tipo-trofeo="plata"] svg path) {
        stroke: var(--trofeo-color-borde, #888888);
        fill: var(--trofeo-color-relleno, #C0C0C0);
    }

    :global(.trofeo-wrapper[data-tipo-trofeo="bronce"] svg path) {
        stroke: var(--trofeo-color-borde, #804A00);
        fill: var(--trofeo-color-relleno, #CD7F32);
    }

    /* Sin rango - borde según tema, sin relleno */
    :global(.trofeo-wrapper[data-tipo-trofeo="null"] svg path),
    :global(.trofeo-wrapper:not([data-tipo-trofeo="oro"]):not([data-tipo-trofeo="plata"]):not([data-tipo-trofeo="bronce"]) svg path) {
        stroke: var(--icono-color-borde, #000000); /* forzar stroke desde la variable del tema (blanco en dark) */
        fill: transparent !important; /* asegurarse de que no haya relleno */
    }

    .texto-trofeo {
        margin: 0;
        font-size: calc(var(--font-size-base, 1rem) * 2);
        font-weight: 600;
        color: var(--trofeo-texto-color, #FFD700);
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.05);
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    /* Colores de texto según el rango */
    .texto-trofeo[data-tipo-trofeo="oro"] {
        --trofeo-texto-color: #FFD700;
        color: var(--trofeo-texto-color);
    }

    .texto-trofeo[data-tipo-trofeo="plata"] {
        --trofeo-texto-color: #C0C0C0;
        color: var(--trofeo-texto-color);
    }

    .texto-trofeo[data-tipo-trofeo="bronce"] {
        --trofeo-texto-color: #CD7F32;
        color: var(--trofeo-texto-color);
    }

    /* Sin rango - texto gris */
    .texto-trofeo[data-tipo-trofeo="null"],
    .texto-trofeo:not([data-tipo-trofeo="oro"]):not([data-tipo-trofeo="plata"]):not([data-tipo-trofeo="bronce"]) {
        --trofeo-texto-color: #666666;
        color: var(--trofeo-texto-color);
    }

    /* Estilos copiados de .boton-juego para mantener coherencia visual (altura reducida) */
    .boton-logro {      
        padding: calc(var(--spacing-base,1rem) * 1) 0.75rem; /* menos padding vertical para reducir altura */
        margin-top: 2rem; /* menor separación entre botones */
        background: var(--fondo-botones, #ffca00);
        color: var(--icono-color-relleno, black);
        border: none;
        font-size: calc(var(--font-size-base, 1rem) * 1.8);
        font-weight: 600;
        width: 100%;
        letter-spacing: 0.05em;
        border-radius: var(--border-radius, 8px);
        cursor: pointer;
        box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
        text-align: left;
        transition: transform 120ms ease, box-shadow 120ms ease;
    }

    .boton-logro img {
        height: auto;
        width: calc(var(--font-size-base, 1rem) * 5);
        margin-right: calc(var(--font-size-base, 1rem) * 1.8);
        margin-left:  calc(var(--font-size-base, 1rem) * 1.8);
        vertical-align: middle;
        filter: drop-shadow(0 0 3px var(--icono-color-relleno, rgb(255, 255, 255)));    
    }

    .boton-logro:hover {
        background: var(--fondo-botones-hover, #d1a700);
        transform: translateY(-2px);
    }

    .boton-logro:active {
        transform: translateY(0);
    }

    .boton-logro:focus {
        outline: var(--borde-botones, 4px solid #000000);
        background: var(--fondo-botones-hover, #d1a700);
        outline-offset: 7px;
    }
</style>