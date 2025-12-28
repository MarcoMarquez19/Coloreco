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

    // Props para controlar el trofeo dinámicamente
    let rangoTrofeo = $state<'oro' | 'plata' | 'bronce'>('bronce');
    let textoRango = $state('Bronce');

    // Detectar si hay filtros de fuente o espaciado activos
    let hayFiltrosActivos = $derived(
        $configuraciones.multiplicadorTamanioFuente !== 1 || 
        $configuraciones.multiplicadorEspaciado !== 1
    );

    function irALogrosTaller() {
        //TODO: PONER LA PAGINA DE LOGROS TALLER
    }

    function irALogrosCuerpo() {
        //TODO: PONER LA PAGINA DE LOGROS CUERPO
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
        } else {
            rangoTrofeo = 'bronce';
            textoRango = 'Bronce';
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

    // Obtener colores según el rango
    function obtenerColoresTrofeo(rango: 'oro' | 'plata' | 'bronce') {
        const colores = {
            oro: {
                borde: '#B8860B',
                relleno: '#FFD700',
                texto: '#FFD700'
            },
            plata: {
                borde: '#707070',
                relleno: '#C0C0C0',
                texto: '#C0C0C0'
            },
            bronce: {
                borde: '#8B4513',
                relleno: '#CD7F32',
                texto: '#CD7F32'
            }
        };
        return colores[rango];
    }

    $effect(() => {
        // Actualizar colores CSS según el rango
        const colores = obtenerColoresTrofeo(rangoTrofeo);
        document.documentElement.style.setProperty('--trofeo-color-borde', colores.borde);
        document.documentElement.style.setProperty('--trofeo-color-relleno', colores.relleno);
        document.documentElement.style.setProperty('--trofeo-texto-color', colores.texto);
    });

</script>

<div class="seleccionar-logros-contenedor" bind:this={contenedorLogrosRef} aria-label="Contenedor para seleccionar la categoría de logros" data-magnificable>
    <h1>Rango General</h1>
    
    <div class="trofeo-contenedor">
        <div class="trofeo-con-texto">
            <div class="trofeo-wrapper">
                <Trofeo/>
            </div>
            <p class="texto-trofeo">{textoRango}</p>
        </div>
    </div>

    <div class="botones-contenedor" style="gap: {hayFiltrosActivos ? '0' : 'calc(var(--spacing-base, 1rem) * 4)'}">
        <button class="boton-logro"
            aria-label="Ver logros del taller de escenas creativas" 
            title="Logros Taller"   
            onclick={irALogrosTaller}
            >
            <img src={LibroDibujo} alt="Logo logros taller de dibujo - Cuaderno de dibujos">
            Logros Taller
        </button>
        <button class="boton-logro"
            aria-label="Ver logros del cuerpo y yo" 
            title="Logros Cuerpo"
            onclick={irALogrosCuerpo}
            >
            <img src={CuerpoHumano} alt="Logo logros cuerpo humano - Imagen del cuerpo humano">
            Logros Cuerpo
        </button>
        <button class="boton-logro"
            aria-label="Ver logros del rincón de historias" 
            title="Logros Historias"
            onclick={irALogrosHistorias}
            >
            <img src={LibroHistorias} alt="Logo logros historias - Libro de historias">
            Logros Historias
        </button>
    </div>
</div>

<style>
    .seleccionar-logros-contenedor {
        margin: 2vh auto;
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
        margin: 0;
        margin-top: calc(var(--spacing-base, 1rem) * 0.5);
        margin-bottom: calc(var(--spacing-base, 1rem) * 0.5);
        padding: 0;
        font-weight: 600;
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.1);
        word-spacing: calc(var(--spacing-base, 1rem) * 0.2);
    }

    .trofeo-contenedor {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: calc(var(--spacing-base, 1rem) * 0.5);
        margin-bottom: calc(var(--spacing-base, 1rem) * 0.5);
        width: 100%;
    }

    .trofeo-con-texto {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: calc(var(--spacing-base, 1rem) * 0.5);
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
        --icono-color-borde: var(--trofeo-color-borde, #B8860B);
        --icono-color-relleno: var(--trofeo-color-relleno, #FFD700);
    }

    .texto-trofeo {
        margin: 0;
        font-size: calc(var(--font-size-base, 1rem) * 2);
        font-weight: 600;
        color: var(--trofeo-texto-color, #FFD700);
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.05);
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .botones-contenedor {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0;
        margin-top: calc(var(--spacing-base, 1rem) * 1);
        margin-bottom: calc(var(--spacing-base, 1rem) * 2);
        justify-content: flex-start;
    }

    .boton-logro {      
        padding: calc(var(--spacing-base, 1rem) * 1.2) calc(var(--spacing-base, 1rem) * 1);
        margin-top: 0;
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		border: none;
		font-size: calc(var(--font-size-base, 1rem) * 1.8);
		font-weight: 600;
        width: 100%;
		letter-spacing: calc(var(--spacing-base, 1rem) * 0.05);
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