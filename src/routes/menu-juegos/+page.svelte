<script lang="ts">
    import LibroDibujo from '$lib/components/iconos/LibroDibujo.png';
    import CuerpoHumano from '$lib/components/iconos/CuerpoHumano.png';
    import LibroHistorias from '$lib/components/iconos/LibroCuentos.png';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import {obtenerArtistas,cambiarArtista} from '$lib/db/artistas.service';

    function irAlTallerDibujo() {
        goto('/taller-escenas');
    }

    function irAlModoPartesDelCuerpo() {
        goto('/cuerpo-plantillas');
    }

    function irAModoHistorias() {
        goto('/juegos/historias/seleccionar-historia');
    }

	let contenedorMenuJuegosRef: HTMLElement | null = null;

	/** Calcula y aplica la escala según la altura de la ventana (máx 1080px) */
	function actualizarEscala(): void {
		if (!contenedorMenuJuegosRef) return;
		const maxHeight = 1080; // referencia 1080p
		const rawScale = window.innerHeight / maxHeight;
		// limitar entre 0.6 y 1 para evitar escalados excesivos
		const scale = Math.max(0.6, Math.min(1, rawScale));
		contenedorMenuJuegosRef.style.transform = `scale(${scale})`;
		contenedorMenuJuegosRef.style.transformOrigin = 'top center';
	}

	onMount(() => {
		document.body.style.overflow = 'hidden';
		
		// Interceptar el botón de volver del navegador/layout para ir a estudio
		const handlePopState = (event: PopStateEvent) => {
			event.preventDefault();
			goto('/estudio');
		};
		
		window.addEventListener('popstate', handlePopState);
		
		return () => {
			document.body.style.overflow = '';
			window.removeEventListener('popstate', handlePopState);
		};
	});

	$effect(() => {
		actualizarEscala();
		window.addEventListener('resize', actualizarEscala);
		return () => {
			window.removeEventListener('resize', actualizarEscala);
			// restaurar transform si existe
			if (contenedorMenuJuegosRef) {
				contenedorMenuJuegosRef.style.transform = '';
				contenedorMenuJuegosRef.style.transformOrigin = '';
				contenedorMenuJuegosRef.style.margin = '';
			}
		};
	})

</script>

<div class="seleccionar-juegos-contenedor" bind:this={contenedorMenuJuegosRef} aria-label="Contenedor para seleccionar el juego de preferencia del artista" data-magnificable>
    <h1>¿Qué quieres probar?</h1>

    <button class="boton-juego"
		aria-label="Entra al modo de juego de dibujo" 
		title="Taller de escenas creativas"   
		onclick={irAlTallerDibujo}
		>
        <img src={LibroDibujo} alt="Logo modo de juegos taller de dibujo - Cuaderno de dibujos">
		Taller de escenas creativas
	</button>
    <button class="boton-juego"
		aria-label="Entra al modo de juego del cuerpo humano" 
		title="El cuerpo y yo"
		onclick={irAlModoPartesDelCuerpo}
		>
        <img src={CuerpoHumano} alt="Logo modo de juegos cuerpo humano - Imagen del cuerpo humano">
		El cuerpo y yo
	</button>
    <button class="boton-juego"
		aria-label="Entra al modo de juego de historias" 
		title="El rincón de las historias"
		onclick={irAModoHistorias}
		>
        <img src={LibroHistorias} alt="Logo modo de juegos historias - Libro de historias">
		El rincón de las historias
	</button>
</div>

<style>
    .seleccionar-juegos-contenedor {
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

	.boton-juego {      
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
    .boton-juego img {
        height: auto;
        width: calc(var(--font-size-base, 1rem) * 5);
        margin-right: calc(var(--font-size-base, 1rem) * 1.8);
        margin-left:  calc(var(--font-size-base, 1rem) * 1.8);
        vertical-align: middle;
        filter: drop-shadow(0 0 3px var(--icono-color-relleno, rgb(255, 255, 255)));    
    }

	.boton-juego:hover {
		background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-2px);
	}

	.boton-juego:active {
		transform: translateY(0);
	}

	.boton-juego:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #d1a700);
		outline-offset: 7px;
	}
</style>