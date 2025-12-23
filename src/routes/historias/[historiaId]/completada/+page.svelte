<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import LibroHistorias from '$lib/components/iconos/LibroAbierto.png';
	import ConfetiImagen from '$lib/components/iconos/Confeti.png';

	interface Historia {
		historiaId: string;
		titulo: string;
		imagen: string;
		totalCapitulos: number;
	}

	let historia = $state<Historia | null>(null);
	let cargando = $state<boolean>(true);
	let error = $state<string | null>(null);

	// Tamaño de la imagen decorativa
	let tamañoImagen = '20rem';

	onMount(async () => {
		try {
			const historiaId = $page.params.historiaId;
			
			const response = await fetch('/historias/historias.json');
			if (!response.ok) {
				throw new Error('Error al cargar historias');
			}
			
			const historias = await response.json();
			historia = historias.find((h: Historia) => h.historiaId === historiaId);
			
			if (!historia) {
				throw new Error('Historia no encontrada');
			}
			
			cargando = false;
		} catch (err) {
			console.error('Error al cargar historia:', err);
			error = err instanceof Error ? err.message : 'Error desconocido';
			cargando = false;
		}
	});

	onMount(() => {
		document.body.style.overflow = 'hidden';
		
		// Interceptar el botón de volver del navegador/layout para ir a seleccionar-historia
		const handlePopState = (event: PopStateEvent) => {
			event.preventDefault();
			goto('/historias/seleccionar-historia');
		};
		
		window.addEventListener('popstate', handlePopState);
		
		return () => {
			document.body.style.overflow = '';
			window.removeEventListener('popstate', handlePopState);
		};
	});

	function volverAHistorias() {
		goto('/historias/seleccionar-historia');
	}


	function manejarTecla(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' '|| event.key === 'Escape') {
			event.preventDefault();
			volverAHistorias();
		}
	}

	let contenedorCompletadaRef: HTMLElement | null = null;

	function actualizarEscala(): void {
		if (!contenedorCompletadaRef) return;
		const maxHeight = 1080;
		const rawScale = window.innerHeight / maxHeight;
		const scale = Math.max(0.6, Math.min(1, rawScale));
		contenedorCompletadaRef.style.transform = `scale(${scale})`;
		contenedorCompletadaRef.style.transformOrigin = 'top center';
	}

	$effect(() => {
		actualizarEscala();
		window.addEventListener('resize', actualizarEscala);
		window.addEventListener('keydown', manejarTecla);
		
		return () => {
			window.removeEventListener('resize', actualizarEscala);
			window.removeEventListener('keydown', manejarTecla);
			if (contenedorCompletadaRef) {
				contenedorCompletadaRef.style.transform = '';
				contenedorCompletadaRef.style.transformOrigin = '';
			}
		};
	});

	// Colores del confeti
	$effect(() => {
		document.documentElement.style.setProperty('--confeti-color-borde', '#B8860B');
		document.documentElement.style.setProperty('--confeti-color-relleno', '#FFD700');
		document.documentElement.style.setProperty('--confeti-texto-color', '#FFD700');
	});
</script>

<img 
	src={LibroHistorias} 
	alt="Libro de historias"
	class="imagen-decorativa"
	style="width: {tamañoImagen};"
	data-magnificable
>

<div class="completada-contenedor" bind:this={contenedorCompletadaRef} aria-label="Historia completada" data-magnificable>
	{#if cargando}
		<div class="estado-carga">
			<p data-magnificable data-readable>Cargando...</p>
		</div>
	{:else if error}
		<div class="estado-error">
			<p data-magnificable data-readable>Error: {error}</p>
		</div>
	{:else if historia}
		
		<div class="confeti-contenedor" data-magnificable>
				<div class="confeti-wrapper" data-magnificable>
					<img src={ConfetiImagen} alt="Confeti de celebración" class="confeti-imagen" data-magnificable />
				</div>
		</div>

		<div class="marco-externo" data-magnificable>
			<div class="mensaje-contenedor" data-magnificable>
				<h1 data-magnificable data-readable>¡Actividad completada!</h1>
				<h2 data-magnificable data-readable>¡Has ganado una nueva medalla!</h2>
				<p class="historia-titulo" data-magnificable data-readable>Completaste: {historia.titulo}</p>
				<p class="capitulos-info" data-magnificable data-readable>{historia.totalCapitulos} capítulos superados</p>
			</div>
		</div>
	{/if}
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

	.completada-contenedor {
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
		gap: calc(var(--spacing-base, 1rem) * 2);
	}

	h1 {
		font-size: calc(var(--font-size-base, 1rem) * 2.5);
		margin: 0;
		margin-top: calc(var(--spacing-base, 1rem) * 2);
		padding: 0;
		font-weight: 600;
		color: var(--color-texto, #333);
	}

	h2 {
		font-size: calc(var(--font-size-base, 1rem) * 1.8);
		margin: 0;
		padding: 0;
		font-weight: 600;
		color: var(--color-texto, #333);
	}

	.marco-externo {
		background: var(--bg, white);
		border: 2px solid var(--icono-color-borde, #000000);
		border-radius: 8px;
		padding: calc(var(--spacing-base, 1rem) * 3);
		box-shadow: var(--sombra-botones, 0 4px 16px rgba(0, 0, 0, 0.15));
		margin-top: calc(var(--spacing-base, 1rem) * 0.5);
		display: inline-block;
		max-width: 1200px;
		width: 100%;
	}

	.confeti-contenedor {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: calc(var(--spacing-base, 1rem) * 1) 0;
		width: 100%;
	}

	.confeti-con-texto {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--spacing-base, 1rem) * 1);
	}

	.confeti-wrapper {
		width: calc(var(--font-size-base, 1rem) * 15);
		height: calc(var(--font-size-base, 1rem) * 15);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: confetti-bounce 1s ease-in-out;
	}

	.confeti-imagen {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	@keyframes confetti-bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-20px); }
	}

	.texto-confeti {
		font-size: calc(var(--font-size-base, 1rem) * 2);
		font-weight: 700;
		color: var(--confeti-texto-color, #FFD700);
		margin: 0;
		text-transform: uppercase;
		letter-spacing: calc(var(--spacing-base, 1rem) * 0.1);
	}

	.mensaje-contenedor {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--spacing-base, 1rem) * 1);
	}

	.historia-titulo {
		font-size: calc(var(--font-size-base, 1rem) * 1.5);
		font-weight: 600;
		color: var(--color-texto, #333);
		margin: 0;
	}

	.capitulos-info {
		font-size: calc(var(--font-size-base, 1rem) * 1.2);
		color: var(--color-texto-secundario, #666);
		margin: 0;
	}

	.botones-contenedor {
		display: flex;
		gap: calc(var(--spacing-base, 1rem) * 2);
		margin-top: calc(var(--spacing-base, 1rem) * 1);
		flex-wrap: wrap;
		justify-content: center;
	}

	.boton-accion {
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		border: 2px solid var(--icono-color-borde, #000000);
		border-radius: 8px;
		padding: calc(var(--spacing-base, 1rem) * 1.5) calc(var(--spacing-base, 1rem) * 3);
		font-size: calc(var(--font-size-base, 1rem) * 1.3);
		font-weight: 600;
		cursor: pointer;
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
		transition: transform 120ms ease, box-shadow 120ms ease;
		min-width: 200px;
	}

	.boton-accion:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	.boton-accion:active {
		transform: translateY(-2px);
	}

	.boton-accion:focus {
		outline: var(--borde-botones, 4px solid #000000);
		outline-offset: 4px;
	}

	.boton-historias {
		background: var(--fondo-botones, #4caf50);
	}

	.estado-carga,
	.estado-error {
		text-align: center;
		padding: 3rem;
		font-size: 1.25rem;
		color: var(--color-texto, #333);
	}

	.estado-error {
		color: var(--color-error, #d32f2f);
	}

	@media (max-width: 768px) {
		h1 {
			font-size: calc(var(--font-size-base, 1rem) * 2);
		}

		h2 {
			font-size: calc(var(--font-size-base, 1rem) * 1.5);
		}

		.confeti-wrapper {
			width: calc(var(--font-size-base, 1rem) * 10);
			height: calc(var(--font-size-base, 1rem) * 10);
		}

		.confeti-imagen {
			width: 100%;
			height: 100%;
		}

		.botones-contenedor {
			flex-direction: column;
			width: 100%;
		}

		.boton-accion {
			width: 100%;
		}
	}
</style>
