<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import LibroHistorias from '$lib/components/iconos/LibroAbierto.png';
	import ConfetiImagen from '$lib/components/iconos/Confeti.png';
	import { audioStore } from '$lib/stores/audio';
	import { obtenerArtistaActivo } from '$lib/db/artistas.service';
	import { obtenerLogrosDesbloqueadosEnUltimosPeriodo } from '$lib/db/logros.service';
	import type { LogroDefinicion } from '$lib/db/schemas';
	import { ttsService } from '$lib/audio/tts.service';
	import { configuraciones } from '$lib/stores/settings';

	interface Historia {
		historiaId: string;
		titulo: string;
		imagen: string;
		totalCapitulos: number;
	}

	let historia = $state<Historia | null>(null);
	let cargando = $state<boolean>(true);
	let error = $state<string | null>(null);
	let logrosDesbloqueados = $state<LogroDefinicion[]>([]);

	// Tamaño de la imagen decorativa
	let tamañoImagen = '20rem';

	onMount(async () => {
		audioStore.playSound('finished');
		
		try {
			const historiaId = $page.params.historiaId;
			
			// Cargar historia
			const response = await fetch('/historias/historias.json');
			if (!response.ok) {
				throw new Error('Error al cargar historias');
			}
			
			const historias = await response.json();
			historia = historias.find((h: Historia) => h.historiaId === historiaId);
			
			if (!historia) {
				throw new Error('Historia no encontrada');
			}
			
			// Cargar logros desbloqueados en los últimos 10 minutos (solo de historias)
			const artista = await obtenerArtistaActivo();
			if (artista?.id) {
				const logrosRecientes = await obtenerLogrosDesbloqueadosEnUltimosPeriodo(artista.id, 10);
				// Filtrar solo logros de historias
				logrosDesbloqueados = logrosRecientes.filter(logro => logro.modo === 'historias');
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
			goto('/juegos/historias/seleccionar-historia');
		};
		
		window.addEventListener('popstate', handlePopState);
		
		return () => {
			document.body.style.overflow = '';
			window.removeEventListener('popstate', handlePopState);
		};
	});

	function volverAHistorias() {
		goto('/juegos/historias/seleccionar-historia');
	}

	function leerContenido() {
		if (!historia) return;
		
		let narracionActiva = false;
		configuraciones.subscribe(config => { narracionActiva = config.narrationEnabled; })();
		
		if (!narracionActiva) return;
		
		ttsService.stop();
		
		let texto = '¡Actividad completada! ';
		
		if (logrosDesbloqueados.length > 0) {
			texto += logrosDesbloqueados.length === 1 
				? '¡Has obtenido un nuevo logro! ' 
				: `¡Has obtenido ${logrosDesbloqueados.length} nuevos logros! `;
			
			logrosDesbloqueados.forEach(logro => {
				texto += `${logro.nombre}. `;
			});
		}
		
		texto += `Completaste: ${historia.titulo}. ${historia.totalCapitulos} capítulos superados.`;
		
		setTimeout(() => {
			ttsService.speak(texto);
		}, 100);
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

		<button 
			type="button"
			class="marco-externo" 
			data-magnificable
			aria-label="Resumen de actividad completada, presiona Enter o Espacio para escuchar"
			onfocus={leerContenido}
			onclick={leerContenido}
		>
			<div class="mensaje-contenedor" data-magnificable>
				<h1 data-magnificable data-readable>¡Actividad completada!</h1>
				{#if logrosDesbloqueados.length > 0}
					<h2 data-magnificable data-readable>
						{logrosDesbloqueados.length === 1 ? '¡Has obtenido un nuevo logro!' : `¡Has obtenido ${logrosDesbloqueados.length} nuevos logros!`}
					</h2>
					
					<div class="logros-contenedor" data-magnificable>
						{#each logrosDesbloqueados as logro}
							<div class="logro-item" data-magnificable>
								<div class="logro-icono" data-magnificable aria-hidden="true" data-no-adapt>{logro.icono || '🏆'}</div>
								<p class="logro-nombre" data-magnificable data-readable>{logro.nombre}</p>
							</div>
						{/each}
					</div>
				{/if}
				
				<p class="historia-titulo" data-magnificable data-readable>Completaste: {historia.titulo}</p>
				<p class="capitulos-info" data-magnificable data-readable>{historia.totalCapitulos} capítulos superados</p>
			</div>
		</button>
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
		margin: 0 auto;
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
		gap: calc(var(--spacing-base, 1rem) * 0.5);
	}

	h1 {
		font-size: calc(var(--font-size-base, 1rem) * 2.5);
		margin: 0;
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
		padding: calc(var(--spacing-base, 1rem) * 1.5);
		box-shadow: var(--sombra-botones, 0 4px 16px rgba(0, 0, 0, 0.15));
		margin-top: 0;
		display: inline-block;
		max-width: 1200px;
		width: 100%;
		outline: none;
		cursor: pointer;
		text-align: inherit;
		font-family: inherit;
		transition: border-color 200ms ease, box-shadow 200ms ease;
	}

	.marco-externo:hover {
		border-color: var(--color-acento, #000000);
	}

	   .marco-externo:focus {
		   border-color: var(--color-acento, #000000);
		   box-shadow:
			0 0 0 2px var(--color-acento-transparente, rgba(0, 0, 0, 0.18)),
			0 0 8px 2px var(--color-acento, #000000);
		   animation: focus-pop 0.25s cubic-bezier(.4,1.6,.4,1) both;
	   }

	   @keyframes focus-pop {
		   0% {
			   transform: scale(1);
			   box-shadow:
				0 0 0 0px var(--color-acento-transparente, rgba(0, 0, 0, 0)),
				0 0 0 0px var(--color-acento, #000000);
		   }
		   60% {
			transform: scale(1.025);
			box-shadow:
				0 0 0 3px var(--color-acento-transparente, rgba(0, 0, 0, 0.10)),
				0 0 10px 2px var(--color-acento, #000000);
		   }
		   100% {
			   transform: scale(1.02);
			   box-shadow:
				0 0 0 2px var(--color-acento-transparente, rgba(0, 0, 0, 0.18)),
				0 0 8px 2px var(--color-acento, #000000);
		   }
	   }

	.confeti-contenedor {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: calc(var(--spacing-base, 1rem) * 1) 0;
		width: 100%;
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

	.mensaje-contenedor {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--spacing-base, 1rem) * 0.5);
	}

	.historia-titulo {
		font-size: calc(var(--font-size-base, 1rem) * 1.5);
		font-weight: 600;
		color: var(--color-texto, #333);
		margin: 0;
	}

	.capitulos-info {
		font-size: calc(var(--font-size-base, 1rem) * 1.2);
		color: var(--color-texto, #333);
		margin: 0;
	}

	.logros-contenedor {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		gap: calc(var(--spacing-base, 1rem) * 1.5);
		margin-top: calc(var(--spacing-base, 1rem) * 1);
		width: 100%;
		max-width: 800px;
	}

	.logro-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--spacing-base, 1rem) * 0.5);
		background: transparent;
		border: none;
		padding: 0;
		box-shadow: none;
		transition: transform 120ms ease;
		max-width: 150px;
	}

	.logro-item:hover {
		transform: scale(1.05);
	}

	.logro-icono {
		width: calc(var(--font-size-base, 1rem) * 5);
		height: calc(var(--font-size-base, 1rem) * 5);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: calc(var(--font-size-base, 1rem) * 4);
	}

	.logro-nombre {
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
		font-weight: 600;
		color: var(--color-texto, #333);
		margin: 0;
		text-align: center;
		line-height: 1.2;
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
		
		.logros-contenedor {
			gap: calc(var(--spacing-base, 1rem) * 1);
		}
		
		.logro-icono {
			width: calc(var(--font-size-base, 1rem) * 4);
			height: calc(var(--font-size-base, 1rem) * 4);
			font-size: calc(var(--font-size-base, 1rem) * 3);
		}
		
		.logro-nombre {
			font-size: calc(var(--font-size-base, 1rem) * 1);
		}
	}
</style>
