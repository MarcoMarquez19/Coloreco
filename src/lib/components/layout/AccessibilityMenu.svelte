<script lang="ts">
	// Menú de Accesibilidad - Modal para ajustar preferencias de UI
	// Este componente permite al usuario personalizar la apariencia de la app en tiempo real
	
	import { settings } from '$lib/stores/settings';

	// Props: recibe el contenido de la página actual para mostrarlo en el preview
	let { children } = $props();

	// Función para cerrar el menú al hacer clic fuera de él
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			settings.cerrarMenu();
		}
	}

	// Función para cerrar con tecla Escape
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			settings.cerrarMenu();
		}
	}
</script>

<!-- Backdrop (fondo oscuro) que aparece detrás del menú -->
{#if $settings.isMenuOpen}
	<div 
		class="backdrop" 
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="presentation"
	>
		<!-- Panel del menú de accesibilidad -->
		<div class="menu-panel" role="dialog" aria-labelledby="menu-titulo" aria-modal="true">
			<!-- Encabezado del menú -->
			<header class="menu-header">
				<h2 id="menu-titulo">Ajustes de Accesibilidad</h2>
				<button 
					class="boton-cerrar" 
					onclick={settings.cerrarMenu}
					aria-label="Cerrar menú de ajustes"
				>
					<!-- Icono X para cerrar -->
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					</svg>
				</button>
			</header>

			<!-- Contenido del menú: Controles a la izquierda, Vista previa a la derecha -->
			<div class="menu-contenido">
				<!-- Sección de Controles -->
				<section class="controles" aria-label="Controles de personalización">
					<!-- Control: Tamaño de Fuente -->
					<div class="control-grupo">
						<label for="slider-font-size" class="control-label">
							Tamaño de Fuente
							<span class="control-valor">{$settings.fontSizeMultiplier.toFixed(1)}×</span>
						</label>
						<input 
							id="slider-font-size"
							type="range" 
							min="0.8" 
							max="2" 
							step="0.1"
							value={$settings.fontSizeMultiplier}
							oninput={(e) => settings.setFontSize(parseFloat(e.currentTarget.value))}
							class="slider"
							aria-valuemin="0.8"
							aria-valuemax="2"
							aria-valuenow={$settings.fontSizeMultiplier}
							aria-label="Ajustar tamaño de fuente"
						/>
						<div class="control-ayuda">
							<small>Ajusta el tamaño del texto en toda la aplicación</small>
						</div>
					</div>

					<!-- Control: Espaciado -->
					<div class="control-grupo">
						<label for="slider-spacing" class="control-label">
							Espaciado
							<span class="control-valor">{$settings.spacingMultiplier.toFixed(1)}×</span>
						</label>
						<input 
							id="slider-spacing"
							type="range" 
							min="0.8" 
							max="2" 
							step="0.1"
							value={$settings.spacingMultiplier}
							oninput={(e) => settings.setSpacing(parseFloat(e.currentTarget.value))}
							class="slider"
							aria-valuemin="0.8"
							aria-valuemax="2"
							aria-valuenow={$settings.spacingMultiplier}
							aria-label="Ajustar espaciado entre elementos"
						/>
						<div class="control-ayuda">
							<small>Modifica el espacio entre elementos de la interfaz</small>
						</div>
					</div>

					<!-- Control: Radio de Bordes -->
					<div class="control-grupo">
						<label for="slider-border-radius" class="control-label">
							Bordes Redondeados
							<span class="control-valor">{$settings.borderRadius}px</span>
						</label>
						<input 
							id="slider-border-radius"
							type="range" 
							min="0" 
							max="20" 
							step="2"
							value={$settings.borderRadius}
							oninput={(e) => settings.setBorderRadius(parseFloat(e.currentTarget.value))}
							class="slider"
							aria-valuemin="0"
							aria-valuemax="20"
							aria-valuenow={$settings.borderRadius}
							aria-label="Ajustar curvatura de bordes"
						/>
						<div class="control-ayuda">
							<small>Controla qué tan redondeados son los bordes de botones y tarjetas</small>
						</div>
					</div>

					<!-- Botón para reiniciar valores -->
					<button class="boton-reset" onclick={settings.reset}>
						Restaurar valores por defecto
					</button>
				</section>

				<!-- Sección de Vista Previa: Muestra la página actual en tiempo real -->
				<aside class="vista-previa" aria-label="Vista previa de cambios en tiempo real">
					<h3 class="preview-titulo">Vista Previa en Tiempo Real</h3>
					<!-- Marco tipo "monitor" que contiene el preview escalado -->
					<div class="preview-marco">
						<div class="preview-contenedor">
							<!-- Aquí se renderiza la página actual que está detrás del menú -->
							<!-- Los cambios del store se reflejan automáticamente -->
							{@render children?.()}
						</div>
					</div>
				</aside>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Backdrop - Fondo semitransparente que cubre toda la pantalla */
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: var(--spacing-base, 1rem);
		backdrop-filter: blur(2px);
	}

	/* Panel principal del menú */
	.menu-panel {
		background: white;
		border-radius: var(--border-radius, 8px);
		max-width: 900px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	/* Encabezado del menú */
	.menu-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: calc(var(--spacing-base, 1rem) * 1.5);
		border-bottom: 1px solid #e0e0e0;
		position: sticky;
		top: 0;
		background: white;
		z-index: 10;
	}

	.menu-header h2 {
		margin: 0;
		font-size: calc(var(--font-size-base, 1rem) * 1.5);
		color: #222;
	}

	.boton-cerrar {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		color: #555;
		transition: background 150ms ease;
	}

	.boton-cerrar:hover {
		background: #f0f0f0;
	}

	.boton-cerrar:focus {
		outline: 2px solid #0b6efd;
		outline-offset: 2px;
	}

	/* Contenido principal: controles + vista previa */
	.menu-contenido {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: calc(var(--spacing-base, 1rem) * 2);
		padding: calc(var(--spacing-base, 1rem) * 2);
	}

	@media (max-width: 768px) {
		.menu-contenido {
			grid-template-columns: 1fr;
		}
	}

	/* Sección de controles */
	.controles {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-base, 1rem) * 1.5);
	}

	.control-grupo {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-base, 1rem) * 0.5);
	}

	.control-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-weight: 600;
		font-size: calc(var(--font-size-base, 1rem) * 0.95);
		color: #333;
	}

	.control-valor {
		font-weight: 700;
		color: #0b6efd;
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
	}

	/* Slider personalizado */
	.slider {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: #e0e0e0;
		outline: none;
		-webkit-appearance: none;
		appearance: none;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #0b6efd;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(11, 110, 253, 0.3);
	}

	.slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #0b6efd;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 6px rgba(11, 110, 253, 0.3);
	}

	.slider:focus {
		outline: 2px solid #0b6efd;
		outline-offset: 2px;
	}

	.control-ayuda {
		color: #666;
		font-size: calc(var(--font-size-base, 1rem) * 0.85);
	}

	/* Botón de reset */
	.boton-reset {
		margin-top: calc(var(--spacing-base, 1rem) * 0.5);
		padding: calc(var(--spacing-base, 1rem) * 0.7) calc(var(--spacing-base, 1rem) * 1.2);
		background: #f5f5f5;
		border: 1px solid #ccc;
		border-radius: var(--border-radius, 8px);
		cursor: pointer;
		font-size: calc(var(--font-size-base, 1rem) * 0.9);
		font-weight: 500;
		transition: background 150ms ease;
	}

	.boton-reset:hover {
		background: #e8e8e8;
	}

	.boton-reset:focus {
		outline: 2px solid #0b6efd;
		outline-offset: 2px;
	}

	/* Vista previa: simula una ventana de monitor fija */
	.vista-previa {
		background: #2a2a2a;
		padding: calc(var(--spacing-base, 1rem) * 1);
		border-radius: var(--border-radius, 8px);
		border: 1px solid #1a1a1a;
		display: flex;
		flex-direction: column;
		/* Sin scroll: simula un monitor fijo */
		overflow: hidden;
	}

	.preview-titulo {
		margin: 0 0 calc(var(--spacing-base, 1rem) * 0.75) 0;
		font-size: calc(var(--font-size-base, 1rem) * 1);
		color: #e0e0e0;
		text-align: center;
		font-weight: 500;
	}

	/* Marco exterior que define el tamaño del "monitor" */
	.preview-marco {
		background: white;
		border-radius: 4px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
		/* Sin scroll - comportamiento de monitor fijo */
		overflow: hidden;
		position: relative;
		/* Aspecto ratio 16:9 como un monitor real */
		aspect-ratio: 16 / 9;
		width: 100%;
	}

	/* Contenedor interno escalado que muestra el contenido */
	.preview-contenedor {
		background: white;
		/* Evita que los elementos interactivos del preview funcionen */
		pointer-events: none;
		/* Sin scroll interno */
		overflow: hidden;
		position: absolute;
		top: 0;
		left: 0;
		/* Ocupa el tamaño completo antes de escalar */
		width: 100%;
		height: 100%;
		/* Escala el contenido para simular zoom out */
		transform: scale(0.5);
		transform-origin: top left;
		/* Dimensiones reales antes de la escala (el doble para compensar scale 0.5) */
		width: 200%;
		height: 200%;
	}

	@media (prefers-reduced-motion: reduce) {
		.backdrop { backdrop-filter: none; }
		.boton-cerrar, .boton-reset { transition: none; }
	}
</style>
