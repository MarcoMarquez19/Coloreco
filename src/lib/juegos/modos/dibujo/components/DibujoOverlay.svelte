<!--
  DibujoOverlay.svelte
  Capa de accesibilidad para el modo de dibujo.
  Proporciona navegación por teclado, gestión de foco y roles/labels ARIA.
  Por el momento es un placeholder preparado para la implementación de DOM accesible por escenaId.
-->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Dispatcher para comunicar eventos de accesibilidad
	const dispatch = createEventDispatcher<{
		navegar: { direccion: 'arriba' | 'abajo' | 'izquierda' | 'derecha' };
		seleccionar: { x: number; y: number };
		escapar: {};
	}>();

	// Estado del overlay
	let overlayVisible = $state<boolean>(false);
	let posicionFoco = $state<{ x: number; y: number }>({ x: 0, y: 0 });
	let modoNavegacion = $state<'rejilla' | 'libre'>('libre');

	// Configuración de la rejilla de navegación
	const TAMANO_REJILLA = 50; // píxeles por celda
	let dimensionesRejilla = $state<{ filas: number; columnas: number }>({ 
		filas: 10, 
		columnas: 10 
	});

	/**
	 * Activa el modo de navegación accesible
	 */
	export function activarNavegacion() {
		overlayVisible = true;
		modoNavegacion = 'rejilla';
		calcularDimensionesRejilla();
		enfocarCentro();
	}

	/**
	 * Desactiva el modo de navegación accesible
	 */
	export function desactivarNavegacion() {
		overlayVisible = false;
		modoNavegacion = 'libre';
	}

	/**
	 * Alterna la visibilidad del overlay
	 */
	export function alternarOverlay() {
		overlayVisible = !overlayVisible;
		if (overlayVisible) {
			activarNavegacion();
		}
	}

	/**
	 * Calcula las dimensiones de la rejilla según el contenedor
	 */
	function calcularDimensionesRejilla() {
		// TODO: Calcular basado en el contenedor real del canvas
		const anchoEstimado = 800;
		const altoEstimado = 600;
		
		dimensionesRejilla.columnas = Math.floor(anchoEstimado / TAMANO_REJILLA);
		dimensionesRejilla.filas = Math.floor(altoEstimado / TAMANO_REJILLA);
	}

	/**
	 * Enfoca el centro de la rejilla
	 */
	function enfocarCentro() {
		posicionFoco.x = Math.floor(dimensionesRejilla.columnas / 2);
		posicionFoco.y = Math.floor(dimensionesRejilla.filas / 2);
	}

	/**
	 * Maneja la navegación por teclado
	 */
	function manejarTeclado(evento: KeyboardEvent) {
		if (!overlayVisible) return;

		evento.preventDefault();
		
		switch (evento.key) {
			case 'ArrowUp':
				if (posicionFoco.y > 0) {
					posicionFoco.y--;
					dispatch('navegar', { direccion: 'arriba' });
				}
				break;
			
			case 'ArrowDown':
				if (posicionFoco.y < dimensionesRejilla.filas - 1) {
					posicionFoco.y++;
					dispatch('navegar', { direccion: 'abajo' });
				}
				break;
			
			case 'ArrowLeft':
				if (posicionFoco.x > 0) {
					posicionFoco.x--;
					dispatch('navegar', { direccion: 'izquierda' });
				}
				break;
			
			case 'ArrowRight':
				if (posicionFoco.x < dimensionesRejilla.columnas - 1) {
					posicionFoco.x++;
					dispatch('navegar', { direccion: 'derecha' });
				}
				break;
			
			case 'Enter':
			case ' ':
				const coordX = posicionFoco.x * TAMANO_REJILLA + (TAMANO_REJILLA / 2);
				const coordY = posicionFoco.y * TAMANO_REJILLA + (TAMANO_REJILLA / 2);
				dispatch('seleccionar', { x: coordX, y: coordY });
				break;
			
			case 'Escape':
				desactivarNavegacion();
				dispatch('escapar', {});
				break;
		}
	}

	/**
	 * Obtiene la descripción de la posición actual
	 */
	function obtenerDescripcionPosicion(): string {
		const fila = posicionFoco.y + 1;
		const columna = posicionFoco.x + 1;
		return `Fila ${fila}, columna ${columna} de ${dimensionesRejilla.filas} por ${dimensionesRejilla.columnas}`;
	}

	/**
	 * Obtiene instrucciones de navegación
	 */
	function obtenerInstrucciones(): string {
		return 'Use las flechas para navegar, Enter o Espacio para seleccionar, Escape para salir del modo accesible.';
	}
</script>

<!-- Event listener global para teclado -->
<svelte:window onkeydown={manejarTeclado} />

<!-- Overlay de accesibilidad -->
{#if overlayVisible}
	<div 
		class="overlay-accesibilidad"
		role="application"
		aria-label="Navegación accesible del lienzo de dibujo"
		aria-live="polite"
	>
		<!-- Información de estado para lectores de pantalla -->
		<div class="info-sr-only" aria-live="assertive">
			<p>{obtenerDescripcionPosicion()}</p>
			<p>{obtenerInstrucciones()}</p>
		</div>

		<!-- Rejilla de navegación visual -->
		<div 
			class="rejilla-navegacion"
			style="
				--filas: {dimensionesRejilla.filas};
				--columnas: {dimensionesRejilla.columnas};
				--tamano-celda: {TAMANO_REJILLA}px;
			"
		>
			{#each Array(dimensionesRejilla.filas) as _, fila}
				{#each Array(dimensionesRejilla.columnas) as _, columna}
					<div
						class="celda-rejilla"
						class:enfocada={posicionFoco.x === columna && posicionFoco.y === fila}
						style="
							grid-row: {fila + 1};
							grid-column: {columna + 1};
						"
						role="gridcell"
						aria-label="Celda {fila + 1}, {columna + 1}"
					>
						{#if posicionFoco.x === columna && posicionFoco.y === fila}
							<div class="indicador-foco" aria-hidden="true">
								<span class="icono-foco">🎯</span>
							</div>
						{/if}
					</div>
				{/each}
			{/each}
		</div>

		<!-- Panel de información -->
		<div class="panel-informacion" role="status">
			<h3>Navegación Accesible</h3>
			<p class="posicion-actual">{obtenerDescripcionPosicion()}</p>
			<div class="instrucciones">
				<p><kbd>Flechas</kbd> Navegar</p>
				<p><kbd>Enter/Espacio</kbd> Seleccionar</p>
				<p><kbd>Escape</kbd> Salir</p>
			</div>
		</div>

		<!-- Botón para cerrar overlay -->
		<button
			class="boton-cerrar"
			onclick={desactivarNavegacion}
			aria-label="Salir del modo de navegación accesible"
			title="Cerrar navegación accesible"
		>
			✕
		</button>
	</div>
{/if}

<!-- Botón para activar overlay cuando no está visible -->
{#if !overlayVisible}
	<button
		class="boton-activar-accesibilidad"
		onclick={activarNavegacion}
		aria-label="Activar navegación accesible del lienzo"
		title="Navegación accesible (A)"
	>
		♿
	</button>
{/if}

<style>
	/* Clases para lectores de pantalla */
	.info-sr-only {
		position: absolute;
		left: -10000px;
		top: auto;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}

	/* Overlay principal */
	.overlay-accesibilidad {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.1);
		z-index: 1000;
		outline: none;
	}

	/* Rejilla de navegación */
	.rejilla-navegacion {
		display: grid;
		grid-template-rows: repeat(var(--filas), var(--tamano-celda));
		grid-template-columns: repeat(var(--columnas), var(--tamano-celda));
		width: 100%;
		height: 100%;
		position: relative;
	}

	.celda-rejilla {
		position: relative;
		border: 1px solid transparent;
		transition: all 0.2s ease;
	}

	.celda-rejilla.enfocada {
		border-color: var(--color-foco, #007bff);
		background: rgba(0, 123, 255, 0.1);
		box-shadow: 0 0 0 2px var(--color-foco, #007bff);
	}

	/* Indicador de foco */
	.indicador-foco {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--color-foco, #007bff);
		color: white;
		border-radius: 50%;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		animation: pulso 1.5s ease-in-out infinite;
	}

	.icono-foco {
		font-size: 1.2rem;
		line-height: 1;
	}

	@keyframes pulso {
		0%, 100% { transform: translate(-50%, -50%) scale(1); }
		50% { transform: translate(-50%, -50%) scale(1.1); }
	}

	/* Panel de información */
	.panel-informacion {
		position: absolute;
		top: 1rem;
		left: 1rem;
		background: var(--color-fondo-panel, rgba(255, 255, 255, 0.95));
		border: 2px solid var(--color-borde-panel, #000);
		border-radius: 8px;
		padding: 1rem;
		max-width: 250px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.panel-informacion h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-texto, #333);
	}

	.posicion-actual {
		margin: 0 0 1rem 0;
		font-weight: 600;
		color: var(--color-texto-secundario, #666);
		font-size: 0.9rem;
	}

	.instrucciones {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.instrucciones p {
		margin: 0;
		font-size: 0.8rem;
		color: var(--color-texto, #333);
	}

	.instrucciones kbd {
		background: var(--color-fondo-kbd, #f1f1f1);
		border: 1px solid var(--color-borde-kbd, #ccc);
		border-radius: 3px;
		padding: 0.1rem 0.3rem;
		font-size: 0.7rem;
		font-family: monospace;
		margin-right: 0.5rem;
	}

	/* Botón cerrar */
	.boton-cerrar {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 40px;
		height: 40px;
		border: 2px solid var(--color-borde-boton, #000);
		border-radius: 50%;
		background: var(--color-fondo-boton, #fff);
		color: var(--color-texto, #333);
		font-size: 1.2rem;
		font-weight: bold;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.boton-cerrar:hover {
		background: var(--color-fondo-boton-hover, #f0f0f0);
		transform: scale(1.05);
	}

	.boton-cerrar:focus {
		outline: 3px solid var(--color-focus, #007bff);
		outline-offset: 2px;
	}

	/* Botón activar accesibilidad */
	.boton-activar-accesibilidad {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		width: 50px;
		height: 50px;
		border: 2px solid var(--color-borde-boton, #000);
		border-radius: 50%;
		background: var(--color-fondo-accesibilidad, #4caf50);
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		z-index: 999;
	}

	.boton-activar-accesibilidad:hover {
		background: var(--color-fondo-accesibilidad-hover, #45a049);
		transform: scale(1.05);
	}

	.boton-activar-accesibilidad:focus {
		outline: 3px solid var(--color-focus, #007bff);
		outline-offset: 2px;
	}

	/* Responsividad */
	@media (max-width: 768px) {
		.panel-informacion {
			max-width: 200px;
			padding: 0.75rem;
		}

		.boton-activar-accesibilidad {
			bottom: 0.5rem;
			right: 0.5rem;
			width: 45px;
			height: 45px;
			font-size: 1.3rem;
		}
	}

	/* Reducir animaciones si el usuario lo prefiere */
	@media (prefers-reduced-motion: reduce) {
		.indicador-foco {
			animation: none;
		}
		
		.celda-rejilla,
		.boton-cerrar,
		.boton-activar-accesibilidad {
			transition: none;
		}
	}
</style>