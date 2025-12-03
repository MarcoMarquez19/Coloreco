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
					
					<!-- Sección: Lupa Mágica -->
					<div class="control-grupo">
						<h3 class="seccion-titulo">Lupa Mágica</h3>
                        
						<!-- Interruptor para activar/desactivar la lupa -->
						<div class="switch-container">
							<label for="toggle-magnifier" class="switch-label">Activar lupa mágica</label>
							<button
								id="toggle-magnifier"
								type="button"
								role="switch"
								aria-checked={$settings.magnifierEnabled}
								aria-describedby="toggle-magnifier-desc"
								class="switch-toggle"
								class:active={$settings.magnifierEnabled}
								onclick={() => settings.toggleMagnifier()}
								aria-label={$settings.magnifierEnabled ? 'Desactivar lupa mágica' : 'Activar lupa mágica'}
							>
								<span class="switch-knob"></span>
							</button>
						</div>
						<div class="control-ayuda" id="toggle-magnifier-desc">
							<small>Muestra una lente que magnifica parte de la pantalla.</small>
						</div>
					</div>
					<!-- Control: Tamaño de Fuente (TOGGLE X2) -->
					<div class="control-grupo">
						<div class="control-label" id="font-size-label">
							<span>Tamaño de Fuente</span>
							<span class="control-valor">{$settings.fontSizeMultiplier.toFixed(1)}×</span>
						</div>
						<div class="switch-container">
							<label for="toggle-font-size" class="switch-label">Duplicar tamaño de texto</label>
							<button
								id="toggle-font-size"
								type="button"
								role="switch"
								aria-checked={$settings.fontSizeMultiplier >= 1.9}
								aria-describedby="toggle-font-size-desc"
								class="switch-toggle"
								class:active={$settings.fontSizeMultiplier >= 1.9}
								onclick={() => settings.setFontSize($settings.fontSizeMultiplier >= 1.9 ? 1 : 2) }
								aria-label={$settings.fontSizeMultiplier >= 1.9 ? 'Desactivar tamaño de fuente duplicado' : 'Activar tamaño de fuente duplicado'}
							>
								<span class="switch-knob"></span>
							</button>
						</div>
						<div class="control-ayuda" id="toggle-font-size-desc">
							<small>Activa para duplicar el tamaño del texto en toda la aplicación y mejorar la legibilidad.</small>
						</div>
					</div>

					<!-- Control: Espaciado (TOGGLE X2) -->
					<div class="control-grupo">
						<div class="control-label" id="spacing-label">
							<span>Espaciado</span>
							<span class="control-valor">{$settings.spacingMultiplier.toFixed(1)}×</span>
						</div>
						<div class="switch-container">
							<label for="toggle-spacing" class="switch-label">Duplicar espaciado</label>
							<button
								id="toggle-spacing"
								type="button"
								role="switch"
								aria-checked={$settings.spacingMultiplier >= 1.9}
								aria-describedby="toggle-spacing-desc"
								class="switch-toggle"
								class:active={$settings.spacingMultiplier >= 1.9}
								onclick={() => settings.setSpacing($settings.spacingMultiplier >= 1.9 ? 1 : 2) }
								aria-label={$settings.spacingMultiplier >= 1.9 ? 'Desactivar espaciado duplicado' : 'Activar espaciado duplicado'}
							>
								<span class="switch-knob"></span>
							</button>
						</div>
						<div class="control-ayuda" id="toggle-spacing-desc">
							<small>Activa para duplicar el espaciado entre elementos y mejorar la lectura visual.</small>
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

	/* Nota: sliders reemplazados por toggles en la UI de accesibilidad */

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

	/* Nota: estilos específicos de Lupa Mágica removidos para que sea consistente con el resto */

	.seccion-titulo {
		margin: 0 0 calc(var(--spacing-base, 1rem) * 1) 0;
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
		font-weight: 600;
		color: #222;
	}

	/* Switch toggle */
	.switch-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: calc(var(--spacing-base, 1rem) * 1);
	}

	.switch-label {
		font-weight: 500;
		font-size: calc(var(--font-size-base, 1rem) * 0.95);
		color: #333;
	}

	.switch-toggle {
		position: relative;
		width: 52px;
		height: 28px;
		background: #ccc;
		border: none;
		border-radius: 14px;
		cursor: pointer;
		transition: background 200ms ease;
		padding: 0;
	}

	.switch-toggle.active {
		background: #0b6efd;
	}

	.switch-toggle:focus {
		outline: 2px solid #0b6efd;
		outline-offset: 2px;
	}

	.switch-knob {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 22px;
		height: 22px;
		background: white;
		border-radius: 50%;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 200ms ease;
	}

	.switch-toggle.active .switch-knob {
		transform: translateX(24px);
	}
</style>
