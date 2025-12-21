<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { escenasStore, escenasFiltradas, cargando, error } from '$lib/stores/escenas';
	import type { EscenaCatalogo } from '$lib/db/schemas';
	import IconoVolver from '$lib/components/iconos/IconoVolver.svelte';

	let escenasIniciales: Omit<EscenaCatalogo, 'id'>[] = [];
	let busqueda = '';
	let indiceActual = $state<number>(0);

	onMount(async () => {


		// Cargar escenas iniciales desde JSON estático
		try {
			const response = await fetch('/escenas/escenas.json');
			escenasIniciales = await response.json();
			
			// Inicializar catálogo (siembra solo si está vacío)
			await escenasStore.inicializarCatalogo(escenasIniciales);
		} catch (err) {
			console.error('Error al cargar escenas iniciales:', err);
		}

		// Cargar escenas del modo 'dibujo' (Taller de escenas creativas)
		await escenasStore.cargarPorModo('dibujo');
		
	});

	onMount(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = ''; // Restaurar al desmontar
		};
	});

	function seleccionarEscena(escena: EscenaCatalogo) {
		// TODO: Navegar al canvas con la escena seleccionada
		// Por ahora solo navegamos a una ruta placeholder
		console.log('Escena seleccionada:', escena);
		goto(`/canvas?escenaId=${escena.escenaId}&modo=${escena.modo}`);
	}

	let escenaActual = $state<EscenaCatalogo | null>(null);

	// Animación de carrusel: clase temporal y duración accesible
	let animClass = $state<string>('');
	const CAROUSEL_ANIM_DURATION = 700; // ms, velocidad moderada
	let animTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		escenaActual = $escenasFiltradas.length > 0 ? $escenasFiltradas[indiceActual] : null;
	});

    function verDescripcionEscena() {
		if ($escenasFiltradas.length === 0) return;
		const escenaActual = $escenasFiltradas[indiceActual];
		const destino = `/taller-escenas/descripcion/${encodeURIComponent(escenaActual.escenaId)}`;
		goto(destino);
    }

	function navegarAnterior() {
		if ($escenasFiltradas.length === 0) return;
		// aplicar clase de entrada desde la izquierda
		animClass = 'slide-left';
		if (animTimer) { clearTimeout(animTimer); animTimer = null; }
		indiceActual = (indiceActual - 1 + $escenasFiltradas.length) % $escenasFiltradas.length;
		animTimer = setTimeout(() => { animClass = ''; animTimer = null; }, CAROUSEL_ANIM_DURATION);
	}

	function navegarSiguiente() {
		if ($escenasFiltradas.length === 0) return;
		// aplicar clase de entrada desde la derecha
		animClass = 'slide-right';
		if (animTimer) { clearTimeout(animTimer); animTimer = null; }
		indiceActual = (indiceActual + 1) % $escenasFiltradas.length;
		animTimer = setTimeout(() => { animClass = ''; animTimer = null; }, CAROUSEL_ANIM_DURATION);
	}

	function manejarTeclaPresionada(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') {
			navegarAnterior();
		} else if (event.key === 'ArrowRight') {
			navegarSiguiente();
		}
	}

	let contenedorSeleccionarEscenaRef: HTMLElement | null = null;

	/** Calcula y aplica la escala según la altura de la ventana (máx 1080px) */
	function actualizarEscala(): void {
		if (!contenedorSeleccionarEscenaRef) return;
		const maxHeight = 1080;
		const rawScale = window.innerHeight / maxHeight;
		// limitar entre 0.6 y 1 para evitar escalados excesivos
		const scale = Math.max(0.6, Math.min(1, rawScale));
		contenedorSeleccionarEscenaRef.style.transform = `scale(${scale})`;
		contenedorSeleccionarEscenaRef.style.transformOrigin = 'top center';
	}

	$effect(() => {
		actualizarEscala();
		window.addEventListener('resize', actualizarEscala);
		window.addEventListener('keydown', manejarTeclaPresionada);
		return () => {
			window.removeEventListener('resize', actualizarEscala);
			window.removeEventListener('keydown', manejarTeclaPresionada);
			// restaurar transform si existe
			if (contenedorSeleccionarEscenaRef) {
				contenedorSeleccionarEscenaRef.style.transform = '';
				contenedorSeleccionarEscenaRef.style.transformOrigin = '';
				contenedorSeleccionarEscenaRef.style.margin = '';
			}
		};
	})
</script>

<div class="seleccionar-escenas-contenedor" bind:this={contenedorSeleccionarEscenaRef} aria-label="Contenedor para seleccionar la escena de preferencia del artista" data-magnificable>
    <h1>Elige una escena</h1>

	{#if $cargando}
		<div class="estado-carga">
			<p>Cargando escenas...</p>
		</div>
	{:else if $error}
		<div class="estado-error">
			<p>Error: {$error}</p>
		</div>
	{:else if $escenasFiltradas.length === 0}
		<div class="estado-vacio">
			<p>No hay escenas disponibles para el Taller de Escenas Creativas.</p>
		</div>
	{:else}
		<!-- Indicador de escena actual -->
		<div class="indicador-escena">
			<p>Escena {indiceActual + 1} de {$escenasFiltradas.length}</p>
		</div>

		<!-- Carrusel de escenas -->
		<div class="carrusel-contenedor">
			<!-- Botón flecha izquierda -->
			<button 
				class="boton-flecha boton-izquierda"
				onclick={navegarAnterior}
				aria-label="Escena anterior"
				title="Navegar a la escena anterior (← tecla izquierda)"
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

			<!-- Escena actual -->
			{#if escenaActual}
			<article class={"tarjeta-escena-carrusel " + animClass}>
				<button
					class="contenedor-escena-carrusel"
					onclick={() => seleccionarEscena(escenaActual!)}
					aria-label={`Seleccionar escena ${escenaActual!.nombre}`}
				>
					<div class="preview">
						<!-- TODO: Cargar preview/thumbnail real -->
						<div class="placeholder-preview">
							<span>🎨</span>
						</div>
					</div>
					<h2 class="nombre-escena">{escenaActual.nombre}</h2>
				</button>
			</article>
			{/if}

			<!-- Botón flecha derecha -->
			<button 
				class="boton-flecha boton-derecha"
				onclick={navegarSiguiente}
				aria-label="Escena siguiente"
				title="Navegar a la escena siguiente (→ tecla derecha)"
			>
				<!-- TODO: Reemplazar este SVG con tu icono de flecha derecha -->
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
	{/if}

    <button class="boton-selección"
		aria-label="Selecciona la escena a utilizar en el taller de dibujo" 
		title="Ver Descripción de la escena seleccionada"
		onclick={verDescripcionEscena}
	>
		Ver descripción
	</button>
</div>

<style>
    .seleccionar-escenas-contenedor {
        margin: 5vh auto;
        background: transparent;
        z-index: 1;
        width: 100%;
		max-width: 70vw;
        text-align: center;
        align-items: center;
        justify-content: center;
        display: flex;
        flex-direction: column;
		padding: 0 2rem;
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

	/* Indicador de escena */
	.indicador-escena {
		margin: 2rem 0 1rem;
		font-size: calc(var(--font-size-base, 1rem) * 1.5);
		font-weight: 600;
		color: var(--color-texto, #333);
	}

	.indicador-escena p {
		margin: 0;
		letter-spacing: 0.05em;
	}

	/* Contenedor del carrusel */
	.carrusel-contenedor {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: calc(var(--font-size-base, 1rem) * 5.5);
		width: 100%;
		margin: 2rem 0;
	}

	/* Botones de flecha */
	.boton-flecha {
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

	.boton-flecha:hover {
		background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
	}

	.boton-flecha:active {
		transform: translateY(0);
	}

	.boton-flecha:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #d1a700);
		outline-offset: 7px;
	}

	.boton-flecha svg {
		width: calc(var(--font-size-base,1rem)*6);
		height: calc(var(--font-size-base,1rem)*6);
		pointer-events: none;
	}

	/* Tarjeta de escena en carrusel */
	.tarjeta-escena-carrusel {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		transition: transform 0.3s, box-shadow 0.3s;
		flex: 1;
		min-width: 35vw;
		max-width: 35vw;
	}

	.tarjeta-escena-carrusel:hover {
		transform: translateY(-4px);
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
	}

	.contenedor-escena-carrusel {
		width: 100%;
		border: none;
		background: var(--fondo-botones,"transparent");
		cursor: pointer;
		padding: 0;
		text-align: center;
	}

	.preview {
		width: 100%;
		aspect-ratio: 4 / 3;
		background: var(--color-fondo-preview, #e0e0e0);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-preview {
		font-size: 6rem;
	}

	.nombre-escena {
		padding: 1.5rem;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--icono-color-relleno, #333);
		margin: 0;
		letter-spacing: 0.05em;
	}

	.boton-selección {      
        padding: calc(var(--spacing-base,2rem) * 1.5) 1rem;
        margin-top: 4rem;
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		border: none;
		font-size: calc(var(--font-size-base, 1rem) * 1.8);
		font-weight: 600;
        width: 50%;
		letter-spacing: 0.05em;
		border-radius: var(--border-radius, 8px);
		cursor: pointer;
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
        text-align: center;
		transition: transform 120ms ease, box-shadow 120ms ease;
	}

	.boton-selección:hover {
		background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-2px);
	}

	.boton-selección:active {
		transform: translateY(0);
	}

	.boton-selección:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #d1a700);
		outline-offset: 7px;
	}

	.estado-carga,
	.estado-error,
	.estado-vacio {
		text-align: center;
		padding: 3rem;
		font-size: 1.25rem;
	}

	.estado-error {
		color: var(--color-error, #d32f2f);
	}

	@media (max-width: 768px) {
		.seleccionar-escenas-contenedor {
			padding: 0 1rem;
		}

		h1 {
			font-size: 1.75rem;
		}

		.carrusel-contenedor {
			gap: 1rem;
		}

		.boton-flecha {
			min-width: 60px;
			min-height: 60px;
			padding: 1rem;
		}

		.boton-flecha svg {
			width: 32px;
			height: 32px;
		}

		.tarjeta-escena-carrusel {
			max-width: 400px;
		}

		.placeholder-preview {
			font-size: 4rem;
		}

		.nombre-escena {
			font-size: 1.25rem;
			padding: 1rem;
		}

		.indicador-escena {
			font-size: calc(var(--font-size-base, 1rem) * 1.2);
		}
	}

	@media (max-width: 480px) {
		.carrusel-contenedor {
			gap: 0.5rem;
		}

		.boton-flecha {
			min-width: 50px;
			min-height: 50px;
			padding: 0.75rem;
		}

		.boton-flecha svg {
			width: 24px;
			height: 24px;
		}
	}

/* Animaciones de entrada para simular movimiento de carrusel */
@keyframes slideInFromRight {
	from { transform: translateX(30%); opacity: 0; }
	to   { transform: translateX(0);   opacity: 1; }
}

@keyframes slideInFromLeft {
	from { transform: translateX(-30%); opacity: 0; }
	to   { transform: translateX(0);     opacity: 1; }
}

.slide-right {
	animation: slideInFromRight 700ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
}

.slide-left {
	animation: slideInFromLeft 700ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
}

/* Respetar preferencias de reducción de movimiento */
@media (prefers-reduced-motion: reduce) {
	.slide-right,
	.slide-left {
		animation: none !important;
		transition: none !important;
	}
}

</style>