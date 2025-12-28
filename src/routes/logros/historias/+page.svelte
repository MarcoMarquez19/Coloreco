<script lang="ts">
    import LibroHistorias from '$lib/components/iconos/LibroAbierto.png';
    import Trofeo from '$lib/components/iconos/Trofeo.svelte';
    import { onMount } from 'svelte';
    import { obtenerArtistaActivo } from '$lib/db/artistas.service';
    import { obtenerLogrosArtista, calcularRangoArtista } from '$lib/db/logros.service';
    import { LOGROS_HISTORIAS } from '$lib/db/schemas';
    import type { LogroArtista } from '$lib/db/schemas';

    // Props para controlar el trofeo dinámicamente
    let rangoTrofeo = $state<'oro' | 'plata' | 'bronce'>('bronce');
    let textoRango = $state('Bronce');

    // Tamaño de la imagen decorativa (ajustable)
    let tamañoImagen = '20rem'; // Puedes cambiar este valor: '8rem', '12rem', etc.

    // Sistema de logros con información real
    interface LogroDisplay {
        codigo: string;
        titulo: string;
        descripcion: string;
        icono: string;
        desbloqueado: boolean;
        fechaDesbloqueo?: Date;
    }

    let logrosDisplay = $state<LogroDisplay[]>([
        {
            codigo: LOGROS_HISTORIAS.GRAN_LECTOR,
            titulo: 'Gran Lector',
            descripcion: 'Completa tu primera historia',
            icono: '📚',
            desbloqueado: false
        },
        {
            codigo: LOGROS_HISTORIAS.MENTE_BRILLANTE,
            titulo: 'Mente Brillante',
            descripcion: 'Responde 3 preguntas correctas seguidas',
            icono: '🧠',
            desbloqueado: false
        },
        {
            codigo: LOGROS_HISTORIAS.MAESTRO_HISTORIAS,
            titulo: 'Maestro de Historias',
            descripcion: 'Completa todas las historias disponibles',
            icono: '🏆',
            desbloqueado: false
        }
    ]);

    let logroActualIndex = $state(0);
    let artistaId = $state<number | null>(null);

    function logroAnterior() {
        logroActualIndex = (logroActualIndex - 1 + logrosDisplay.length) % logrosDisplay.length;
    }

    function logroSiguiente() {
        logroActualIndex = (logroActualIndex + 1) % logrosDisplay.length;
    }

    // Cargar logros del artista
    async function cargarLogros() {
        const artista = await obtenerArtistaActivo();
        if (!artista || !artista.id) return;
        
        artistaId = artista.id;
        
        // Cargar logros desbloqueados
        const logrosArtista = await obtenerLogrosArtista(artista.id);
        
        // Actualizar display con información real
        logrosDisplay = logrosDisplay.map(logro => {
            const logroData = logrosArtista.find(
                (la) => la.definicion.codigo === logro.codigo
            );
            
            return {
                ...logro,
                desbloqueado: logroData?.estado?.desbloqueado ?? false,
                fechaDesbloqueo: logroData?.estado?.fechaDesbloqueo
            };
        });
        
        // Calcular rango
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

    // Navegación con teclado
    function manejarTecla(event: KeyboardEvent) {
        if (event.key === 'ArrowLeft') {
            logroAnterior();
        } else if (event.key === 'ArrowRight') {
            logroSiguiente();
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
        
        // Cargar logros
        cargarLogros();
        
        // Agregar listener para teclas
        window.addEventListener('keydown', manejarTecla);
        
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', manejarTecla);
        };
    });

    $effect(() => {
        actualizarEscala();
        window.addEventListener('resize', actualizarEscala);
        return () => {
            window.removeEventListener('resize', actualizarEscala);
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
        const colores = obtenerColoresTrofeo(rangoTrofeo);
        document.documentElement.style.setProperty('--trofeo-color-borde', colores.borde);
        document.documentElement.style.setProperty('--trofeo-color-relleno', colores.relleno);
        document.documentElement.style.setProperty('--trofeo-texto-color', colores.texto);
    });

</script>

<img 
    src={LibroHistorias} 
    alt="Libro de historias"
    class="imagen-decorativa"
    style="width: {tamañoImagen};"
>

<div class="seleccionar-logros-contenedor" bind:this={contenedorLogrosRef} aria-label="Contenedor de logros de historias" data-magnificable>
    <h1>Rango General</h1>
    
    <div class="trofeo-contenedor">
        <div class="trofeo-con-texto">
            <div class="trofeo-wrapper">
                <Trofeo/>
            </div>
            <p class="texto-trofeo">{textoRango}</p>
        </div>
    </div>

    <h2 class="titulo-logro">Logros de historias</h2>

    <div class="navegacion-logros">
        <button 
            class="flecha-navegacion izquierda" 
            onclick={logroAnterior}
            aria-label="Logro anterior"
            title="Ver logro anterior (←)"
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
                width="62"
                height="62"
            >
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
        </button>

        <div class="tarjeta-logro" class:desbloqueado={logrosDisplay[logroActualIndex].desbloqueado}>
            <div class="icono-logro">{logrosDisplay[logroActualIndex].icono}</div>
            <h3 class="titulo-logro-individual">{logrosDisplay[logroActualIndex].titulo}</h3>
            <p class="descripcion-logro">{logrosDisplay[logroActualIndex].descripcion}</p>
            <div class="estado-logro">
                {#if logrosDisplay[logroActualIndex].desbloqueado}
                    <span class="badge desbloqueado">✓ Desbloqueado</span>
                {:else}
                    <span class="badge bloqueado">🔒 Bloqueado</span>
                {/if}
            </div>
        </div>

        <button 
            class="flecha-navegacion derecha" 
            onclick={logroSiguiente}
            aria-label="Logro siguiente"
            title="Ver siguiente logro (→)"
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
                width="62"
                height="62"
            >
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
        </button>
    </div>
</div>

<style>
    .imagen-decorativa {
        position: fixed;
        top: clamp(-6rem, -20vh, 2rem);
        right: clamp(-6rem, -20vw, -5rem);
        height: auto;
        z-index: 10;
        filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
        pointer-events: none;
    }

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
        padding: 0 calc(var(--spacing-base, 1rem) * 1);
        box-sizing: border-box;
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

    .titulo-logro {
        font-size: calc(var(--font-size-base, 1rem) * 2);
        font-weight: 600;
        margin: calc(var(--spacing-base, 1rem) * 1) 0 calc(var(--spacing-base, 1rem) * 0.5) 0;
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.05);
    }

    .navegacion-logros {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: calc(var(--spacing-base, 1rem) * 1.5);
        width: 100%;
        max-width: 1000px;
        margin-top: calc(var(--spacing-base, 1rem) * 0.5);
        margin-bottom: calc(var(--spacing-base, 1rem) * 2);
    }

    .flecha-navegacion {
        background: var(--fondo-botones, #ffca00);
        color: var(--icono-color-relleno, black);
        border: none;
        border-radius: var(--border-radius, 8px);
        cursor: pointer;
        box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
        transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 80px;
        min-height: 80px;
    }

    .flecha-navegacion:hover {
        background: var(--fondo-botones-hover, #d1a700);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
    }

    .flecha-navegacion:active {
        transform: translateY(0);
    }

    .flecha-navegacion:focus {
        outline: var(--borde-botones, 4px solid #000000);
        background: var(--fondo-botones-hover, #d1a700);
        outline-offset: 7px;
    }

    .flecha-navegacion svg {
        width: calc(var(--font-size-base,1rem)*6);
        height: calc(var(--font-size-base,1rem)*6);
        pointer-events: none;
    }

    .tarjeta-logro {
        background: var(--bg, white);
        border: 2px solid var(--icono-color-borde, #000000);
        border-radius: 8px;
        padding: calc(var(--spacing-base, 1rem) * 1.5);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: calc(var(--spacing-base, 1rem) * 0.75);
        box-shadow: var(--sombra-botones, 0 8px 24px rgba(0, 0, 0, 0.2));
        min-width: calc(var(--font-size-base, 1rem) * 12.5);
        min-height: calc(var(--font-size-base, 1rem) * 12.5);
    }

    .icono-logro {
        font-size: calc(var(--font-size-base, 1rem) * 6);
        line-height: 1;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
    }

    .titulo-logro-individual {
        margin: 0;
        font-size: calc(var(--font-size-base, 1rem) * 2.2);
        font-weight: 700;
        color: var(--icono-color-relleno, #222);
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.03);
    }

    .descripcion-logro {
        margin: 0;
        font-size: calc(var(--font-size-base, 1rem) * 1.5);
        font-weight: 500;
        color: var(--icono-color-relleno, #555);
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.02);
    }

    .estado-logro {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: calc(var(--spacing-base, 1rem) * 0.5);
        margin-top: calc(var(--spacing-base, 1rem) * 0.5);
    }

    .badge {
        padding: calc(var(--spacing-base, 1rem) * 0.5) calc(var(--spacing-base, 1rem) * 1);
        border-radius: calc(var(--border-radius, 8px) * 0.5);
        font-size: calc(var(--font-size-base, 1rem) * 1.2);
        font-weight: 600;
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.02);
    }

    .badge.desbloqueado {
        background: #4caf50;
        color: white;
    }

    .badge.bloqueado {
        background: #9e9e9e;
        color: white;
    }

    .tarjeta-logro:not(.desbloqueado) {
        opacity: 0.6;
        filter: grayscale(0.5);
    }

    .tarjeta-logro.desbloqueado {
        border-color: #4caf50;
        box-shadow: 0 8px 24px rgba(76, 175, 80, 0.3);
    }
</style>