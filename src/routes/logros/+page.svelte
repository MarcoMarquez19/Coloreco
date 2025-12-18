<script lang="ts">
    import LibroDibujo from '$lib/components/iconos/LibroDibujo.png';
    import CuerpoHumano from '$lib/components/iconos/CuerpoHumano.png';
    import LibroHistorias from '$lib/components/iconos/LibroCuentos.png';
    import Trofeo from '$lib/components/iconos/Trofeo.svelte';
    import { onMount } from 'svelte';

    let colorTrofeo = '#FFD700'; // Color dorado

    function irALogrosTaller() {
        //TODO: PONER LA PAGINA DE LOGROS TALLER
    }

    function irALogrosCuerpo() {
        //TODO: PONER LA PAGINA DE LOGROS CUERPO
    }

    function irALogrosCuentos() {
        //TODO: PONER LA PAGINA DE LOGROS CUENTOS
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

</script>

<div class="seleccionar-logros-contenedor" bind:this={contenedorLogrosRef} aria-label="Contenedor para seleccionar la categoría de logros" data-magnificable>
    <h1>Rango General</h1>
    
    <div class="trofeo-contenedor" style="--color-trofeo: {colorTrofeo};">
        <div class="trofeo-con-texto">
            <Trofeo clase="trofeo-icono" />
            <p class="texto-trofeo">Oro</p>
        </div>
    </div>

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

<style>
    .seleccionar-logros-contenedor {
        margin: 8vh auto;
        background: transparent;
        z-index: 1;
        max-width: 1080px;
        width: 100%;
        text-align: center;
        align-items: center;
        justify-content: center;
        display: flex;
        flex-direction: column
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
        margin-top: calc(var(--spacing-base, 1rem) * 1.5);
        margin-bottom: calc(var(--spacing-base, 1rem) * 2);
    }

    .trofeo-con-texto {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    :global(.trofeo-icono) {
        width: calc(var(--font-size-base, 1rem) * 6);
        height: calc(var(--font-size-base, 1rem) * 6);
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    }

    .texto-trofeo {
        margin: 0;
        font-size: calc(var(--font-size-base, 1rem) * 1.4);
        font-weight: 600;
        color: #FFD700;
        letter-spacing: 0.05em;
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
</style>
