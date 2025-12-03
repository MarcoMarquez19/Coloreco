<script lang="ts">
	// Menú de Accesibilidad - Modal para ajustar preferencias de UI
	// Este componente permite al usuario personalizar la apariencia de la app en tiempo real
	
	import { settings } from '$lib/stores/settings.svelte';

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
{#if settings.isMenuOpen}
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
					
					<!-- NUEVA SECCIÓN: Accesibilidad Visual -->
					<div class="seccion-grupo">
						<h3 class="seccion-titulo">Accesibilidad Visual</h3>
						
						<!-- Control: Modo Daltonismo -->
						<div class="control-grupo">
							<label for="select-colorblindness" class="control-label">
								Modo Daltonismo
							</label>
							<select 
								id="select-colorblindness"
								bind:value={settings.colorBlindness}
								class="select-input"
							>
								<option value="none">Ninguno (Normal)</option>
								<option value="protanopia">Protanopía (Rojo)</option>
								<option value="deuteranopia">Deuteranopía (Verde)</option>
								<option value="tritanopia">Tritanopía (Azul)</option>
								<option value="achromatopsia">Acromatopsia (Grises)</option>
							</select>
						</div>

						<!-- Control: Intensidad del Filtro -->
						<div class="control-grupo">
							<label for="slider-intensity" class="control-label">
								Intensidad del Filtro
								<span class="control-valor">{(settings.intensity * 100).toFixed(0)}%</span>
							</label>
							<input 
								id="slider-intensity"
								type="range" 
								min="0" 
								max="1" 
								step="0.1"
								bind:value={settings.intensity}
								disabled={settings.colorBlindness === 'none'}
								class="slider"
							/>
						</div>

						<!-- Control: Texturas y Contraste -->
						<div class="control-row">
							<label class="checkbox-label">
								<input type="checkbox" bind:checked={settings.textures} />
								<span>Texturas de Ayuda</span>
							</label>
							
							<label class="checkbox-label">
								<input 
									type="checkbox" 
									checked={settings.contrast === 'high'} 
									onchange={(e) => settings.contrast = e.currentTarget.checked ? 'high' : 'normal'}
								/>
								<span>Alto Contraste</span>
							</label>
						</div>

						<!-- LEYENDA DE TEXTURAS: Visible solo cuando las texturas están activas -->
						{#if settings.textures}
							<div class="texture-legend-container" aria-label="Leyenda de patrones de texturas">
								<h4 class="legend-title">Leyenda de Patrones</h4>
								<div class="texture-legend">
									<div class="legend-item">
										<div class="swatch pattern-red bg-red"></div>
										<span>Rojo / Error</span>
									</div>
									<div class="legend-item">
										<div class="swatch pattern-green bg-green"></div>
										<span>Verde / Éxito</span>
									</div>
									<div class="legend-item">
										<div class="swatch pattern-blue bg-blue"></div>
										<span>Azul / Info</span>
									</div>
									<div class="legend-item">
										<div class="swatch pattern-yellow bg-yellow"></div>
										<span>Amarillo / Aviso</span>
									</div>
								</div>
								<p class="legend-note">
									<small>Estos patrones se aplicarán automáticamente a los elementos identificados con las clases correspondientes (ej: <code>.pattern-red</code>).</small>
								</p>
							</div>
						{/if}
					</div>

					<hr class="separador" />

					<!-- SECCIÓN EXISTENTE: Ajustes de Interfaz -->
					<div class="seccion-grupo">
						<h3 class="seccion-titulo">Ajustes de Interfaz</h3>

						<!-- Control: Tamaño de Fuente -->
						<div class="control-grupo">
							<label for="slider-font-size" class="control-label">
								Tamaño de Fuente
								<span class="control-valor">{settings.fontSizeMultiplier.toFixed(1)}×</span>
							</label>
							<input 
								id="slider-font-size"
								type="range" 
								min="0.8" 
								max="2" 
								step="0.1"
								bind:value={settings.fontSizeMultiplier}
								class="slider"
								aria-valuemin="0.8"
								aria-valuemax="2"
								aria-valuenow={settings.fontSizeMultiplier}
								aria-label="Ajustar tamaño de fuente"
							/>
						</div>

						<!-- Control: Espaciado -->
						<div class="control-grupo">
							<label for="slider-spacing" class="control-label">
								Espaciado
								<span class="control-valor">{settings.spacingMultiplier.toFixed(1)}×</span>
							</label>
							<input 
								id="slider-spacing"
								type="range" 
								min="0.8" 
								max="2" 
								step="0.1"
								bind:value={settings.spacingMultiplier}
								class="slider"
								aria-valuemin="0.8"
								aria-valuemax="2"
								aria-valuenow={settings.spacingMultiplier}
								aria-label="Ajustar espaciado entre elementos"
							/>
						</div>

						<!-- Control: Radio de Bordes -->
						<div class="control-grupo">
							<label for="slider-border-radius" class="control-label">
								Bordes Redondeados
								<span class="control-valor">{settings.borderRadius}px</span>
							</label>
							<input 
								id="slider-border-radius"
								type="range" 
								min="0" 
								max="20" 
								step="2"
								bind:value={settings.borderRadius}
								class="slider"
								aria-valuemin="0"
								aria-valuemax="20"
								aria-valuenow={settings.borderRadius}
								aria-label="Ajustar curvatura de bordes"
							/>
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

	.seccion-grupo {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.seccion-titulo {
		font-size: 1.1rem;
		font-weight: 600;
		color: #444;
		margin: 0 0 0.5rem 0;
		border-bottom: 2px solid #f0f0f0;
		padding-bottom: 0.5rem;
	}

	.separador {
		border: 0;
		border-top: 1px solid #eee;
		margin: 1rem 0;
	}

	.control-grupo {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-base, 1rem) * 0.5);
	}

	.control-row {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		cursor: pointer;
		user-select: none;
	}

	.select-input {
		padding: 0.5rem;
		border-radius: 4px;
		border: 1px solid #ccc;
		font-size: 1rem;
		background: white;
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

	.slider:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	/* Estilos para la leyenda de texturas */
	.texture-legend-container {
		margin-top: 1rem;
		padding: 1rem;
		background: #f9f9f9;
		border-radius: var(--border-radius, 8px);
		border: 1px solid #eee;
	}

	.legend-title {
		margin: 0 0 0.75rem 0;
		font-size: 0.95rem;
		color: #444;
	}

	.texture-legend {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: #555;
	}

	.swatch {
		width: 24px;
		height: 24px;
		border-radius: 4px;
		border: 1px solid rgba(0,0,0,0.1);
	}

	.bg-red { background-color: #ff4d4f; }
	.bg-green { background-color: #52c41a; }
	.bg-blue { background-color: #1890ff; }
	.bg-yellow { background-color: #fadb14; }

	.legend-note {
		margin: 0;
		color: #888;
		line-height: 1.4;
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
