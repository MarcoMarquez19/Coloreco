<script lang="ts">
	import LibroHistorias from '$lib/components/iconos/LibroAbierto.png';
	import Instrucciones from '$lib/components/modales/Instrucciones.svelte';
	import IconoInstrucciones from '$lib/components/iconos/IconoInstrucciones.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { obtenerArtistaActivo } from '$lib/db/artistas.service';
	import * as logicaHistorias from '$lib/stores/historias';
	import type { HistoriaConProgreso } from '$lib/stores/historias';

	let historias = $state<HistoriaConProgreso[]>([]);
	let cargando = $state<boolean>(true);
	let error = $state<string | null>(null);
	let indiceActual = $state<number>(0);
	let mostrarInstrucciones = $state<boolean>(false);

	function abrirInstrucciones() {
		mostrarInstrucciones = true;
	}

	onMount(async () => {
		// Cargar historias con progreso desde la BD
		try {
			const artista = await obtenerArtistaActivo();
			if (!artista || !artista.id) {
				error = 'No hay artista activo. Por favor, crea un perfil primero.';
				cargando = false;
				return;
			}

			historias = await logicaHistorias.obtenerHistoriasConProgreso(artista.id);
				cargando = false;
				// Informar al layout para que reprograme la reaplicación de modos según su política centralizada
				window.dispatchEvent(new CustomEvent('content-updated'));
			} catch (err) {
			console.error('Error al cargar historias:', err);
			error = err instanceof Error ? err.message : 'Error desconocido';
			cargando = false;
		}
	});

	onMount(() => {
		document.body.style.overflow = 'hidden';
		
		// Interceptar el botón de volver del navegador/layout para ir a menu-juegos
		const handlePopState = (event: PopStateEvent) => {
			event.preventDefault();
			goto('/menu-juegos');
		};
		
		window.addEventListener('popstate', handlePopState);
		
		return () => {
			document.body.style.overflow = '';
			window.removeEventListener('popstate', handlePopState);
		};
	});

	let historiaActual = $state<HistoriaConProgreso | null>(null);

	// Animación de carrusel: clase temporal y duración accesible
	let animClass = $state<string>('');
	const CAROUSEL_ANIM_DURATION = 700; // ms, velocidad moderada
	let animTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		historiaActual = historias.length > 0 ? historias[indiceActual] : null;
	});

	function verHistoria() {
		if (historias.length > 0) {
			const historiaActual = historias[indiceActual];
			// Navegar a la página de progreso de la historia seleccionada
			goto(`/juegos/historias/${historiaActual.historiaId}/progreso`);
		}
	}

	function navegarAnterior() {
		if (historias.length === 0) return;
		// aplicar clase de entrada desde la izquierda
		animClass = 'slide-left';
		if (animTimer) { clearTimeout(animTimer); animTimer = null; }
		indiceActual = (indiceActual - 1 + historias.length) % historias.length;
		animTimer = setTimeout(() => { animClass = ''; animTimer = null; }, CAROUSEL_ANIM_DURATION);
		// Solicitar a layout reaplicar modos (layout manejará los delays)
		window.dispatchEvent(new CustomEvent('content-updated', { detail: { animationDuration: CAROUSEL_ANIM_DURATION } }));
		// Enfocar el título tras la animación para que lectores/estados se re-apliquen
		setTimeout(() => {
			const el = document.getElementById('titulo-historia-' + indiceActual) as HTMLElement | null;
			if (el) el.focus();
		}, CAROUSEL_ANIM_DURATION / 2);
	}

	function navegarSiguiente() {
		if (historias.length === 0) return;
		// aplicar clase de entrada desde la derecha
		animClass = 'slide-right';
		if (animTimer) { clearTimeout(animTimer); animTimer = null; }
		indiceActual = (indiceActual + 1) % historias.length;
		animTimer = setTimeout(() => { animClass = ''; animTimer = null; }, CAROUSEL_ANIM_DURATION);
		// Solicitar a layout reaplicar modos (layout manejará los delays)
		window.dispatchEvent(new CustomEvent('content-updated', { detail: { animationDuration: CAROUSEL_ANIM_DURATION } }));
		// Enfocar el título tras la animación para que lectores/estados se re-apliquen
		setTimeout(() => {
			const el = document.getElementById('titulo-historia-' + indiceActual) as HTMLElement | null;
			if (el) el.focus();
		}, CAROUSEL_ANIM_DURATION / 2);
	}

	function manejarTeclaPresionada(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') {
			navegarAnterior();
		} else if (event.key === 'ArrowRight') {
			navegarSiguiente();
		} else if ((event.key === 'i' || event.key === 'I') && event.ctrlKey) {
			event.preventDefault();
			abrirInstrucciones();
		}
	}

	let contenedorSeleccionarHistoriaRef: HTMLElement | null = null;

	/** Calcula y aplica la escala según la altura de la ventana (máx 1080px) */
	function actualizarEscala(): void {
		if (!contenedorSeleccionarHistoriaRef) return;
		const maxHeight = 1080;
		const rawScale = window.innerHeight / maxHeight;
		// limitar entre 0.6 y 1 para evitar escalados excesivos
		const scale = Math.max(0.6, Math.min(1, rawScale));
		contenedorSeleccionarHistoriaRef.style.transform = `scale(${scale})`;
		contenedorSeleccionarHistoriaRef.style.transformOrigin = 'top center';
	}

	$effect(() => {
		actualizarEscala();
		window.addEventListener('resize', actualizarEscala);
		window.addEventListener('keydown', manejarTeclaPresionada);
		return () => {
			window.removeEventListener('resize', actualizarEscala);
			window.removeEventListener('keydown', manejarTeclaPresionada);
			// restaurar transform si existe
			if (contenedorSeleccionarHistoriaRef) {
				contenedorSeleccionarHistoriaRef.style.transform = '';
				contenedorSeleccionarHistoriaRef.style.transformOrigin = '';
				contenedorSeleccionarHistoriaRef.style.margin = '';
			}
		};
	})

	// Tamaño de la imagen decorativa (ajustable)
	let tamañoImagen = '20rem';
</script>

<img 
	src={LibroHistorias} 
	alt="Libro de historias"
	class="imagen-decorativa"
	style="width: {tamañoImagen};"
	data-magnificable
>

<!-- Botón de instrucciones -->
<div class="contenedor-flotante-i-instrucciones">
	<button 
		class="boton-instrucciones pattern-yellow"
		onclick={abrirInstrucciones}
		aria-label="Ver instrucciones"
		aria-keyshortcuts="Control + I"
		title="Instrucciones (Control + I)"
		type="button"
	>
		<span class="solo-lectores">Ver instrucciones</span>
		<IconoInstrucciones />
	</button>
	<span class="texto-tecla">Ctrl + I</span>
</div>

<div class="seleccionar-historias-contenedor" bind:this={contenedorSeleccionarHistoriaRef} aria-label="Contenedor para seleccionar la historia de preferencia" data-magnificable>
	<h1 data-magnificable data-readable>Elige tu aventura</h1>

	{#if cargando}
		<div class="estado-carga">
			<p data-magnificable data-readable>Cargando historias...</p>
		</div>
	{:else if error}
		<div class="estado-error">
			<p data-magnificable data-readable>Error: {error}</p>
		</div>
	{:else if historias.length === 0}
		<div class="estado-vacio">
			<p data-magnificable data-readable>No hay historias disponibles.</p>
		</div>
	{:else}
		<!-- Indicador de historia actual -->
		{#key indiceActual}
		<div class="indicador-historia" data-magnificable>
			<p data-magnificable data-readable>Historia {indiceActual + 1} de {historias.length}</p>
		</div>
		{/key}

		<!-- Carrusel de historias -->
		<div class="carrusel-contenedor" data-magnificable>
			<!-- Botón flecha izquierda -->
			<button 
				class="boton-flecha boton-izquierda"
				onclick={navegarAnterior}
				aria-label="Historia anterior"
				title="Navegar a la historia anterior (← tecla izquierda)"
				data-magnificable
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

			<!-- Historia actual -->
			{#if historiaActual}
			{#key indiceActual}
			<article class={"tarjeta-historia-carrusel " + animClass} aria-label={`Historia ${historiaActual.titulo}, Progreso ${logicaHistorias.calcularCapitulosCompletados(historiaActual)} de ${historiaActual.totalCapitulos} capítulos`} data-magnificable in:fly={{ x: animClass === 'slide-right' ? 300 : animClass === 'slide-left' ? -300 : 0, duration: CAROUSEL_ANIM_DURATION }}>
				<div class="contenedor-historia-carrusel" role="group" aria-labelledby={"titulo-historia-" + indiceActual} aria-describedby={"progreso-historia-" + indiceActual} data-magnificable>
					<div class="preview" data-magnificable>
						<div class="placeholder-preview">
						<img src={historiaActual!.imagen} alt={`Imagen de la historia ${historiaActual!.titulo}`} />
						</div>
					</div>
					<h2 id={"titulo-historia-" + indiceActual} class="nombre-historia" tabindex="-1" data-magnificable data-readable>{historiaActual.titulo}</h2>
					<p id={"progreso-historia-" + indiceActual} class="progreso-historia" data-magnificable data-readable>Progreso: {logicaHistorias.calcularCapitulosCompletados(historiaActual)}/{historiaActual.totalCapitulos}</p>
					
					<button class="boton-selección"
						aria-label={`Jugar la historia ${historiaActual.titulo}`}
						title="Jugar la historia seleccionada"
						onclick={verHistoria}
						data-magnificable
						data-readable
					>
						Jugar
					</button>
				</div>
			</article>
			{/key}
			{/if}

			<!-- Botón flecha derecha -->
			<button 
				class="boton-flecha boton-derecha"
				onclick={navegarSiguiente}
				aria-label="Historia siguiente"
				title="Navegar a la historia siguiente (→ tecla derecha)"
				data-magnificable
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
	{/if}
</div>

<!-- Modal de Instrucciones -->
{#if mostrarInstrucciones}
	<Instrucciones on:close={() => mostrarInstrucciones = false} />
{/if}

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

	.seleccionar-historias-contenedor {
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

	/* Indicador de historia */
	.indicador-historia {
		margin: 2rem 0 1rem;
		font-size: calc(var(--font-size-base, 1rem) * 1.5);
		font-weight: 600;
		color: var(--color-texto, #333);
	}

	.indicador-historia p {
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

	/* Tarjeta de historia en carrusel */
	.tarjeta-historia-carrusel {
		background: var(--bg, white);
		border: 2px solid var(--icono-color-borde, #000000);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		transition: transform 0.3s, box-shadow 0.3s;
		flex: 1;
		min-width: 32vw;
		max-width: 32vw;
	}

	.tarjeta-historia-carrusel:hover {
		transform: translateY(-4px);
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
	}

	.contenedor-historia-carrusel {
		width: 100%;
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0 0 2rem 0;
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
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-preview img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}

	.nombre-historia {
		padding: 1.5rem 2rem 0.5rem 2rem;
		font-size: calc(var(--font-size-base,1rem)*1.5);
		font-weight: 600;
		color: var(--color-texto, #333);
		margin: 0;
		letter-spacing: 0.05em;
		line-height: 1.4;
	}

	.progreso-historia {
		padding: 0 2rem 1.5rem 2rem;
		font-size: calc(var(--font-size-base,1rem)*1.2);
		font-weight: 500;
		color: var(--color-texto, #666);
		margin: 0;
		letter-spacing: 0.03em;
		line-height: 1.5;
	}

	.boton-selección {      
		padding: calc(var(--spacing-base,1rem) * 1.2) calc(var(--spacing-base,1rem) * 2.5);
		margin: 1.5rem 2rem 2rem 2rem;
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		border: none;
		font-size: calc(var(--font-size-base, 1rem) * 1.8);
		font-weight: 600;
		width: calc(100% - 4rem);
		max-width: 300px;
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
		.seleccionar-historias-contenedor {
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

		.tarjeta-historia-carrusel {
			max-width: 400px;
		}

		.placeholder-preview {
			font-size: 4rem;
		}

		.nombre-historia {
			font-size: 1.25rem;
			padding: 1rem;
		}

		.indicador-historia {
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

.contenedor-flotante-i-instrucciones {
	position: fixed;
	top: var(--spacing-base, 1rem);
	left: calc(var(--spacing-base, 1rem) * 2.5);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	z-index: 100;
	transition: filter 0.3s ease;
}

.boton-instrucciones {
	position: relative;
	width: calc(8vw * var(--btn-scale, 1));
	height: calc(15vh * var(--btn-scale, 1));
	border-radius: var(--border-radius, 8px);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: var(--fondo-botones, #ffca00);
	border: none;
	box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
	cursor: pointer;
	transition: transform 120ms ease, box-shadow 120ms ease;
	z-index: 100;
}

.boton-instrucciones:hover {
	transform: translateY(-2px);
	background: var(--fondo-botones-hover, #d1a700);
}

.boton-instrucciones:active {
	transform: translateY(0);
}

.boton-instrucciones:focus {
	outline: var(--borde-botones, 4px solid #000000);
	background: var(--fondo-botones-hover, #d1a700);
	outline-offset: 7px;
}

.texto-tecla {
	font-size: calc(4vh * var(--btn-scale, 1));
	font-weight: 500;
	width: 100%;
	text-align: center;
	padding-top: 1rem;
	color: var(--color-texto, rgb(0, 0, 0));
	user-select: none;
	pointer-events: none;
	text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.solo-lectores {
	position: absolute !important;
	height: 1px;
	width: 1px;
	overflow: hidden;
	clip: rect(1px, 1px, 1px, 1px);
	white-space: nowrap;
	border: 0;
	padding: 0;
	margin: -1px;
}

</style>
