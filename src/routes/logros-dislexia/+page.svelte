<script lang="ts">
    import LibroHistorias from '$lib/components/iconos/LibroAbierto.png';
    import Trofeo from '$lib/components/iconos/Trofeo.svelte';
    import { onMount } from 'svelte';

    // Props para controlar el trofeo dinámicamente
    let rangoTrofeo = $state<'oro' | 'plata' | 'bronce'>('plata');
    let textoRango = $state('Plata');

    // Tamaño de la imagen decorativa (ajustable)
    let tamañoImagen = '20rem'; // Puedes cambiar este valor: '8rem', '12rem', etc.

    // Sistema de logros
    interface Logro {
        id: string;
        titulo: string;
        descripcion: string;
        icono: string;
    }

    const logros: Logro[] = [
        {
            id: 'gran-lector',
            titulo: 'Gran Lector',
            descripcion: 'Lee 10 historias completas',
            icono: '📚'
        },
        {
            id: 'explorador',
            titulo: 'Explorador de Mundos',
            descripcion: 'Visita 5 mundos diferentes',
            icono: '🗺️'
        },
        {
            id: 'aventurero',
            titulo: 'Aventurero Valiente',
            descripcion: 'Completa 3 aventuras',
            icono: '⚔️'
        }
    ];

    let logroActualIndex = $state(0);

    function logroAnterior() {
        logroActualIndex = (logroActualIndex - 1 + logros.length) % logros.length;
    }

    function logroSiguiente() {
        logroActualIndex = (logroActualIndex + 1) % logros.length;
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
        const maxHeight = 1080;
        const rawScale = window.innerHeight / maxHeight;
        const scale = Math.max(0.6, Math.min(1, rawScale));
        contenedorLogrosRef.style.transform = `scale(${scale})`;
        contenedorLogrosRef.style.transformOrigin = 'top center';
    }

    onMount(() => {
        document.body.style.overflow = 'hidden';
        
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
    <h1>Rango general</h1>
    
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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>

        <div class="tarjeta-logro">
            <div class="icono-logro">{logros[logroActualIndex].icono}</div>
            <h3 class="titulo-logro-individual">{logros[logroActualIndex].titulo}</h3>
            <p class="descripcion-logro">{logros[logroActualIndex].descripcion}</p>
        </div>

        <button 
            class="flecha-navegacion derecha" 
            onclick={logroSiguiente}
            aria-label="Logro siguiente"
            title="Ver siguiente logro (→)"
        >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
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
        margin: 4vh auto;
        background: transparent;
        z-index: 1;
        max-width: 1080px;
        width: 100%;
        padding: 0 2rem;
        text-align: center;
        align-items: center;
        justify-content: flex-start;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }

    h1 {
        font-size: clamp(2rem, 5vw, 3rem);
        margin: 0;
        margin-top: clamp(1rem, 3vh, 2rem);
        margin-bottom: clamp(0.5rem, 2vh, 1rem);
        padding: 0;
        font-weight: 600;
        letter-spacing: 0.1em;
        word-spacing: 0.2em;
    }

    .trofeo-contenedor {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: clamp(1rem, 2vh, 2rem);
        margin-bottom: clamp(1rem, 2vh, 2rem);
        width: 100%;
    }

    .trofeo-con-texto {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: clamp(0.5rem, 1vh, 1rem);
    }

    .trofeo-wrapper {
        width: clamp(6rem, 18vw, 10rem);
        height: clamp(6rem, 18vw, 10rem);
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
        font-size: clamp(1.5rem, 4vw, 2.5rem);
        font-weight: 600;
        color: var(--trofeo-texto-color, #FFD700);
        letter-spacing: 0.05em;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .titulo-logro {
        font-size: clamp(1.5rem, 4vw, 2.5rem);
        font-weight: 600;
        margin: clamp(2rem, 4vh, 3rem) 0 clamp(1.5rem, 3vh, 2.5rem) 0;
        letter-spacing: 0.05em;
    }

    .navegacion-logros {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(2rem, 5vw, 5rem);
        width: 100%;
        max-width: 1000px;
        margin-top: clamp(1rem, 2vh, 2rem);
    }

    .flecha-navegacion {
        background: var(--fondo-botones, #ffca00);
        border: none;
        border-radius: 50%;
        width: clamp(3.5rem, 8vw, 5rem);
        height: clamp(3.5rem, 8vw, 5rem);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
        transition: transform 120ms ease, background 120ms ease;
        flex-shrink: 0;
    }

    .flecha-navegacion svg {
        width: 60%;
        height: 60%;
        color: var(--icono-color-relleno, black);
    }

    .flecha-navegacion:hover {
        background: var(--fondo-botones-hover, #d1a700);
        transform: scale(1.1);
    }

    .flecha-navegacion:active {
        transform: scale(0.95);
    }

    .flecha-navegacion:focus {
        outline: var(--borde-botones, 4px solid #000000);
        outline-offset: 4px;
    }

    .tarjeta-logro {
        background: white;
        border: 4px solid #333;
        border-radius: var(--border-radius, 16px);
        padding: clamp(2rem, 4vw, 3rem);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: clamp(0.75rem, 1.5vh, 1.25rem);
        box-shadow: var(--sombra-botones, 0 8px 24px rgba(0, 0, 0, 0.2));
        min-width: clamp(250px, 40vw, 400px);
        min-height: clamp(250px, 30vh, 350px);
    }

    .icono-logro {
        font-size: clamp(4rem, 10vw, 6rem);
        line-height: 1;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
    }

    .titulo-logro-individual {
        margin: 0;
        font-size: clamp(1.3rem, 3.5vw, 2.2rem);
        font-weight: 700;
        color: #222;
        letter-spacing: 0.03em;
    }

    .descripcion-logro {
        margin: 0;
        font-size: clamp(1rem, 2.5vw, 1.5rem);
        font-weight: 500;
        color: #555;
        letter-spacing: 0.02em;
    }

    /* Media queries para pantallas pequeñas */
    @media (max-height: 700px) {
        .seleccionar-logros-contenedor {
            margin: 2vh auto;
            padding: 0 1rem;
        }

        h1 {
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
        }

        .trofeo-contenedor {
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
        }

        .titulo-logro {
            margin: 1rem 0 1rem 0;
        }

        .navegacion-logros {
            margin-top: 0.5rem;
            gap: 1.5rem;
        }

        .tarjeta-logro {
            padding: 1.5rem;
            min-height: 200px;
        }
    }

    @media (max-width: 768px) {
        .navegacion-logros {
            gap: 1rem;
        }

        .tarjeta-logro {
            min-width: 200px;
        }
    }
</style>