<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	interface Capitulo {
		id: number;
		nombre: string;
		imagen: string;
		desbloqueado: boolean;
	}

	interface Historia {
		historiaId: string;
		titulo: string;
		imagen: string;
		progreso: number;
		totalCapitulos: number;
		version: number;
		capitulos: Capitulo[];
	}

	let historiaId = $state<string>('');
	let tituloHistoria = $state<string>('');
	let capitulos = $state<Capitulo[]>([]);
	let cargando = $state<boolean>(true);
	let error = $state<string | null>(null);
	let capituloSeleccionadoIndex = $state<number>(0);

	onMount(async () => {
		// Cargar historias desde JSON
		try {
			const response = await fetch('/historias/historias.json');
			if (!response.ok) {
				throw new Error('Error al cargar las historias');
			}
			const todasLasHistorias: Historia[] = await response.json();
			
			// Buscar la historia actual
			const historiaActual = todasLasHistorias.find(h => h.historiaId === $page.params.historiaId);
			
			if (historiaActual) {
				historiaId = historiaActual.historiaId;
				tituloHistoria = historiaActual.titulo;
				capitulos = historiaActual.capitulos;
			} else {
				error = 'Historia no encontrada';
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

	function seleccionarCapitulo(capitulo: Capitulo) {
		if (capitulo.desbloqueado) {
			goto(`/historias/${historiaId}/${capitulo.id}`);
		}
	}

	function manejarTeclaPresionada(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') {
			// Navegar al capítulo anterior desbloqueado
			let nuevoIndex = capituloSeleccionadoIndex - 1;
			while (nuevoIndex >= 0 && !capitulos[nuevoIndex]?.desbloqueado) {
				nuevoIndex--;
			}
			if (nuevoIndex >= 0) {
				capituloSeleccionadoIndex = nuevoIndex;
			}
		} else if (event.key === 'ArrowRight') {
			// Navegar al siguiente capítulo desbloqueado
			let nuevoIndex = capituloSeleccionadoIndex + 1;
			while (nuevoIndex < capitulos.length && !capitulos[nuevoIndex]?.desbloqueado) {
				nuevoIndex++;
			}
			if (nuevoIndex < capitulos.length) {
				capituloSeleccionadoIndex = nuevoIndex;
			}
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			const capituloActual = capitulos[capituloSeleccionadoIndex];
			if (capituloActual) {
				seleccionarCapitulo(capituloActual);
			}
		}
	}

	let contenedorProgresoRef: HTMLElement | null = null;

	/** Calcula y aplica la escala según la altura de la ventana (máx 1080px) */
	function actualizarEscala(): void {
		if (!contenedorProgresoRef) return;
		const maxHeight = 1080;
		const rawScale = window.innerHeight / maxHeight;
		// limitar entre 0.6 y 1 para evitar escalados excesivos
		const scale = Math.max(0.6, Math.min(1, rawScale));
		contenedorProgresoRef.style.transform = `scale(${scale})`;
		contenedorProgresoRef.style.transformOrigin = 'top center';
	}

	$effect(() => {
		actualizarEscala();
		window.addEventListener('resize', actualizarEscala);
		window.addEventListener('keydown', manejarTeclaPresionada);
		return () => {
			window.removeEventListener('resize', actualizarEscala);
			window.removeEventListener('keydown', manejarTeclaPresionada);
			if (contenedorProgresoRef) {
				contenedorProgresoRef.style.transform = '';
				contenedorProgresoRef.style.transformOrigin = '';
			}
		};
	})
</script>

<div class="progreso-contenedor" bind:this={contenedorProgresoRef} aria-label="Progreso de la historia" data-magnificable>
	{#if cargando}
		<div class="estado-carga">
			<p data-magnificable data-readable>Cargando progreso...</p>
		</div>
	{:else if error}
		<div class="estado-error">
			<p data-magnificable data-readable>Error: {error}</p>
		</div>
	{:else}
		<!-- Título de la historia -->
		<div class="titulo-historia-contenedor">
			<h1>{tituloHistoria}</h1>
		</div>

		<!-- Contenedor de capítulos -->
		{#if capitulos.length > 0}
			<div class="marco-externo">
				<div class="capitulos-contenedor">
                    <!-- Personaje decorativo -->
                    <div class="personaje-decorativo">
                        <img src="/historias/personaje.png" alt="Personaje de la historia" />
                    </div>

					{#each capitulos as capitulo, index}
                    	<!-- Flecha conectora (no mostrar después del último) -->
                        <div class="flecha-conectora">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                            </svg>
                        </div>

						<div class="capitulo-wrapper">
							<button
								class="capitulo-boton"
								class:desbloqueado={capitulo.desbloqueado}
								class:bloqueado={!capitulo.desbloqueado}
								class:seleccionado={index === capituloSeleccionadoIndex}
								onclick={() => seleccionarCapitulo(capitulo)}
								onfocus={() => { if (capitulo.desbloqueado) capituloSeleccionadoIndex = index; }}
								disabled={!capitulo.desbloqueado}
								aria-label={capitulo.desbloqueado ? `Jugar ${capitulo.nombre}` : `${capitulo.nombre} bloqueado`}
								title={capitulo.desbloqueado ? `Jugar ${capitulo.nombre}` : `Completa el capítulo anterior para desbloquear`}
								style={!capitulo.desbloqueado ? `background-image: url('${capitulo.imagen}');` : ''}
							>
								{#if capitulo.desbloqueado}
									<img src={capitulo.imagen} alt={capitulo.nombre} />
								{:else}
									<div class="overlay-bloqueo"></div>
									<div class="candado-contenedor">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="80" height="80">
											<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
										</svg>
									</div>
								{/if}
							</button>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="estado-vacio">
				<p data-magnificable data-readable>No se encontraron capítulos para esta historia.</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.progreso-contenedor {
		margin: 3vh auto;
		background: transparent;
		z-index: 1;
		width: 100%;
		max-width: 2000px;
		text-align: center;
		align-items: center;
		display: flex;
		flex-direction: column;
		padding: 0 0.5rem;
		position: relative;
	}

	.titulo-historia-contenedor {
		width: 100%;
		max-width: 600px;
		background: var(--bg, white);
		border: 2px solid var(--icono-color-borde, #000000);
		border-radius: 8px;
		padding: calc(var(--spacing-base, 1rem) * 1) calc(var(--spacing-base, 1rem) * 2);
		margin-bottom: calc(var(--spacing-base, 1rem) * 2);
		box-shadow: var(--sombra-botones, 0 4px 12px rgba(0, 0, 0, 0.2));
	}

	h1 {
		font-size: calc(var(--font-size-base, 1rem) * 2.5);
		margin: 0;
		padding: 0;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: var(--color-texto, #333);
	}

	.marco-externo {
		background: var(--bg, white);
		border: 2px solid var(--icono-color-borde, #000000);
		border-radius: 8px;
		padding: calc(var(--spacing-base, 1rem) * 3);
		box-shadow: var(--sombra-botones, 0 4px 16px rgba(0, 0, 0, 0.15));
		margin-top: calc(var(--spacing-base, 1rem) * 2);
		display: inline-block;
	}

	.capitulos-contenedor {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: calc(var(--spacing-base, 1rem) * 1);
		flex-wrap: wrap;
		max-width: calc((var(--font-size-base, 1rem) * 12 + var(--spacing-base, 1rem) * 1) * 4 + var(--font-size-base, 1rem) * 8 + var(--spacing-base, 1rem) * 4);
	}

	.personaje-decorativo {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.personaje-decorativo img {
		width: calc(var(--font-size-base, 1rem) * 8);
		height: auto;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
	}

	.capitulo-wrapper {
		display: flex;
		align-items: center;
		gap: calc(var(--spacing-base, 1rem) * 1);
	}

	.capitulo-boton {
		width: calc(var(--font-size-base, 1rem) * 12);
		height: calc(var(--font-size-base, 1rem) * 12);
		border-radius: 25px;
		overflow: hidden;
		cursor: pointer;
		transition: transform 120ms ease, box-shadow 120ms ease;
		position: relative;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.capitulo-boton.desbloqueado {
		background: var(--fondo-botones, #4caf50);
		border: var(--borde-botones, 4px solid #2e7d32);
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
	}

	.capitulo-boton.desbloqueado:hover {
		transform: translateY(-4px) scale(1.05);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	.capitulo-boton.desbloqueado:active {
		transform: translateY(-2px) scale(1.02);
	}

	.capitulo-boton.desbloqueado:focus {
		outline: var(--borde-botones, 4px solid #000000);
		outline-offset: 7px;
	}

	.capitulo-boton.bloqueado {
		background: var(--color-fondo-preview, #424242);
		border: var(--borde-botones, 4px solid #212121);
		box-shadow: var(--sombra-botones, 0 4px 12px rgba(0, 0, 0, 0.3));
		cursor: not-allowed;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.overlay-bloqueo {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.7);
		z-index: 1;
	}

	.capitulo-boton img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.candado-contenedor {
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		z-index: 2;
	}

	.flecha-conectora {
		color: var(--icono-color-relleno, #333);
		display: flex;
		align-items: center;
	}

	.flecha-conectora svg {
		width: calc(var(--font-size-base, 1rem) * 3);
		height: calc(var(--font-size-base, 1rem) * 3);
	}

	.estado-carga,
	.estado-error,
	.estado-vacio {
		text-align: center;
		padding: 3rem;
		font-size: 1.25rem;
		color: var(--color-texto, #333);
	}

	.estado-error {
		color: var(--color-error, #d32f2f);
	}

	.estado-vacio {
		text-align: center;
		padding: 3rem;
		font-size: 1.25rem;
		color: var(--color-texto, #333);
	}

	@media (max-width: 768px) {
		.progreso-contenedor {
			max-width: 95vw;
			padding: 0 1rem;
		}

		h1 {
			font-size: calc(var(--font-size-base, 1rem) * 2);
		}

		.personaje-decorativo {
			left: 1rem;
			top: 12%;
		}

		.personaje-decorativo img {
			width: calc(var(--font-size-base, 1rem) * 4);
		}

		.capitulos-contenedor {
			gap: calc(var(--spacing-base, 1rem) * 0.5);
		}

		.capitulo-boton {
			width: calc(var(--font-size-base, 1rem) * 8);
			height: calc(var(--font-size-base, 1rem) * 8);
		}

		.flecha-conectora svg {
			width: calc(var(--font-size-base, 1rem) * 2);
			height: calc(var(--font-size-base, 1rem) * 2);
		}
	}

	@media (max-width: 480px) {
		.capitulos-contenedor {
			flex-direction: column;
		}

		.capitulo-wrapper {
			flex-direction: column;
			gap: calc(var(--spacing-base, 1rem) * 0.5);
		}

		.flecha-conectora {
			transform: rotate(90deg);
		}
	}
</style>
