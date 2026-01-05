<script lang="ts">
	import Instrucciones from '$lib/components/modales/Instrucciones.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { obtenerArtistaActivo } from '$lib/db/artistas.service';
	import * as logicaHistorias from '$lib/stores/historias';
	import type { CapituloConProgreso } from '$lib/stores/historias';

	let historiaId = $state<string>('');
	let tituloHistoria = $state<string>('');
	let capitulos = $state<CapituloConProgreso[]>([]);
	let cargando = $state<boolean>(true);
	let error = $state<string | null>(null);
	let capituloSeleccionadoIndex = $state<number>(0);
	let mostrarInstrucciones = $state<boolean>(false);

	onMount(async () => {
		try {
			// Obtener el artista actual
			const artista = await obtenerArtistaActivo();
			if (!artista || !artista.id) {
				error = 'No hay artista activo. Por favor, crea un perfil primero.';
				cargando = false;
				return;
			}

			historiaId = $page.params.historiaId ?? '';
			if (!historiaId) {
				error = 'ID de historia no válido';
				cargando = false;
				return;
			}
			
			// Cargar la historia desde el JSON
			const historiaJSON = await logicaHistorias.cargarHistoriaJSON(historiaId);
			
			if (!historiaJSON) {
				error = 'Historia no encontrada';
				cargando = false;
				return;
			}

			// Combinar con el progreso de la BD
			const historiaConProgreso = await logicaHistorias.combinarHistoriaConProgreso(
				artista.id!,
				historiaJSON
			);

			tituloHistoria = historiaConProgreso.titulo;
			capitulos = historiaConProgreso.capitulos;

			// Seleccionar el primer capítulo desbloqueado
			const primerDesbloqueado = capitulos.findIndex(c => c.desbloqueado);
			if (primerDesbloqueado !== -1) {
				capituloSeleccionadoIndex = primerDesbloqueado;
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

	function seleccionarCapitulo(capitulo: CapituloConProgreso) {
		if (capitulo.desbloqueado) {
			goto(`/juegos/historias/${historiaId}/${capitulo.id}`);
		}
	}

	function manejarTeclaPresionada(event: KeyboardEvent) {
		// Solo manejar Enter/Espacio si hay un elemento enfocado (botón)
		if (event.key === 'Enter' || event.key === ' ') {
			const elementoActivo = document.activeElement;
			// Si hay un botón enfocado, permitir que el navegador maneje el evento
			if (elementoActivo && elementoActivo.tagName === 'BUTTON') {
				return;
			}
			// Si no hay botón enfocado, prevenir la acción por defecto
			event.preventDefault();
			return;
		}

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
		
		// Escuchar evento de abrir instrucciones desde el layout
		const handleAbrirInstrucciones = () => {
			mostrarInstrucciones = true;
		};
		window.addEventListener('abrir-instrucciones', handleAbrirInstrucciones);
		
		return () => {
			window.removeEventListener('resize', actualizarEscala);
			window.removeEventListener('keydown', manejarTeclaPresionada);
			window.removeEventListener('abrir-instrucciones', handleAbrirInstrucciones);
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
		<div class="titulo-historia-contenedor pattern-black" data-magnificable>
			<h1 tabindex="0" data-magnificable data-readable data-narration-text="Historia: {tituloHistoria}">{tituloHistoria}</h1>
		</div>

		<!-- Contenedor de capítulos -->
		{#if capitulos.length > 0}
			<div class="marco-externo pattern-black" data-magnificable>
				<div class="capitulos-contenedor" data-magnificable>
                    <!-- Personaje decorativo -->
                    <div class="personaje-decorativo" data-magnificable>
                        <img src="/historias/personaje.png" alt="Personaje de la historia" />
                    </div>

					{#each capitulos as capitulo, index}
                    	<!-- Flecha conectora (no mostrar después del último) -->
                        <div class="flecha-conectora" data-magnificable aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32" data-magnificable>
                                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                            </svg>
                        </div>

						<div class="capitulo-wrapper" data-magnificable>
							<button
							class="capitulo-boton capitulo-imagen"
								class:desbloqueado={capitulo.desbloqueado}
								class:bloqueado={!capitulo.desbloqueado}
							class:seleccionado={index === capituloSeleccionadoIndex}
							class:pattern-green={capitulo.desbloqueado}
							class:pattern-black={!capitulo.desbloqueado}
							onclick={() => seleccionarCapitulo(capitulo)}
								onfocus={() => { if (capitulo.desbloqueado) capituloSeleccionadoIndex = index; }}
								disabled={!capitulo.desbloqueado}
								title={capitulo.desbloqueado ? `Jugar ${capitulo.nombre}` : `Completa el capítulo anterior para desbloquear`}
								style={!capitulo.desbloqueado ? `background-image: url('${capitulo.imagen}');` : ''}
								data-magnificable
								data-readable
								data-narration-text={capitulo.desbloqueado ? `${capitulo.nombre}` : `${capitulo.nombre}, bloqueado`}
								>
								{#if capitulo.desbloqueado}
								<img src={capitulo.imagen} alt="" data-magnificable aria-hidden="true" />
							{:else}
								<div class="overlay-bloqueo" data-magnificable aria-hidden="true"></div>
								<div class="candado-contenedor" data-magnificable aria-hidden="true">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="80" height="80" data-magnificable aria-hidden="true">
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

<!-- Modal de Instrucciones -->
{#if mostrarInstrucciones}
	<Instrucciones on:close={() => mostrarInstrucciones = false} />
{/if}

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
		color: var(--icono-color-borde, var(--color-texto, #333));
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
