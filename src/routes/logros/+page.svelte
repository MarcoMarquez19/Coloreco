<script lang="ts">
    import LibroDibujo from '$lib/components/iconos/LibroDibujo.png';
    import CuerpoHumano from '$lib/components/iconos/CuerpoHumano.png';
    import LibroHistorias from '$lib/components/iconos/LibroCuentos.png';
    import { goto } from '$app/navigation';
    import Trofeo from '$lib/components/iconos/Trofeo.svelte';
    import { onMount } from 'svelte';

    // Props para controlar el trofeo dinámicamente
    let rangoTrofeo = $state<'oro' | 'plata' | 'bronce'>('oro');
    let textoRango = $state('Oro');

    function irALogrosTaller() {
        //TODO: PONER LA PAGINA DE LOGROS TALLER
    }

    function irALogrosCuerpo() {
        //TODO: PONER LA PAGINA DE LOGROS CUERPO
    }

    function irALogrosCuentos() {
        goto(`/logros-dislexia`);
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

    <div class="botones-contenedor">
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
            title="Logros Cuentos"
            onclick={irALogrosCuentos}
            >
            <img src={LibroHistorias} alt="Logo logros historias - Libro de historias">
            Logros Cuentos
        </button>
    </div>
</div>

<style>
    .seleccionar-logros-contenedor {
        margin: 8vh auto;
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
        margin-bottom: calc(var(--spacing-base, 1rem) * 0.5);
        margin: 0;
        margin-top: calc(var(--spacing-base,1rem) * 1.5);
        padding: 0;
        font-weight: 600;
        letter-spacing: 0.1em;
        word-spacing: 0.2em;
    }

    .trofeo-contenedor {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: clamp(0.5rem, 1vh, 1rem);
        margin-bottom: clamp(0.5rem, 1vh, 1.5rem);
        width: 100%;
    }

    .trofeo-con-texto {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: clamp(0.25rem, 1vh, 0.5rem);
    }

    .trofeo-wrapper {
        width: clamp(4rem, 15vw, 8rem);
        height: clamp(4rem, 15vw, 8rem);
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
        font-size: clamp(1.2rem, 4vw, 2rem);
        font-weight: 600;
        color: var(--trofeo-texto-color, #FFD700);
        letter-spacing: 0.05em;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .botones-contenedor {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: clamp(0.75rem, 2vh, 1.5rem);
        margin-top: clamp(0.5rem, 1vh, 1rem);
        flex: 1;
        justify-content: flex-start;
    }

    .boton-logro {      
        padding: calc(var(--spacing-base,2rem) * 1.5) 1rem;
        margin-top: 4rem;
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

    /* Media queries para pantallas pequeñas */
    @media (max-height: 700px) {
        .seleccionar-logros-contenedor {
            margin: 1vh auto;
        }

        h1 {
            margin-top: 1rem;
        }

        .trofeo-contenedor {
            margin-top: 1rem;
            margin-bottom: 0rem;
        }

        .botones-contenedor {
            gap: 0rem;
        }


    }
</style>