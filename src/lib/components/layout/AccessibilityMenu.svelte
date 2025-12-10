<script lang="ts">
	// Menú de Accesibilidad - Modal para ajustar preferencias de UI
	// Este componente permite al usuario personalizar la apariencia de la app en tiempo real
	
	import { configuraciones } from '$lib/stores/settings';
	import { onMount, onDestroy } from 'svelte';

	// Props: recibe el contenido de la página actual para mostrarlo en el preview
	let { children } = $props();
	let previewMarcoEl: HTMLElement | null = $state(null);
	let previewContEl: HTMLElement | null = $state(null);
	let previewScale = 1;

	// Recompute preview scale when relevant settings change
	$effect(() => {
		if (previewMarcoEl && previewContEl) {
			updatePreviewSize();
		}
	});

	$effect(() => {
		if (previewMarcoEl && previewContEl && ($configuraciones.multiplicadorTamanioFuente || $configuraciones.multiplicadorEspaciado || $configuraciones.lupaActivada)) {
			// When settings affecting layout change, update preview scale
			updatePreviewSize();
		}
	});

	function updatePreviewSize() {
		const appRoot = document.getElementById('svelte') || document.body;
		if (!appRoot || !previewMarcoEl || !previewContEl) return;

		const appW = appRoot.scrollWidth;
		const appH = appRoot.scrollHeight;
		const marcoRect = previewMarcoEl.getBoundingClientRect();
		const maxW = marcoRect.width;
		const maxH = marcoRect.height;
		const scale = Math.max(0.1, Math.min(maxW / Math.max(1, appW), maxH / Math.max(1, appH)));
		previewScale = scale;

		// apply size and center the scaled content inside the marco
		previewContEl.style.width = `${appW}px`;
		previewContEl.style.height = `${appH}px`;
		const offsetX = (maxW - appW * scale) / 2;
		const offsetY = (maxH - appH * scale) / 2;
		previewContEl.style.transformOrigin = 'top left';
		previewContEl.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
	}

	// Función para cerrar el menú al hacer clic fuera de él
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			configuraciones.cerrarMenu();
		}
	}

	// Función para cerrar con tecla Escape
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			configuraciones.cerrarMenu();
		}
	}
onMount(() => {
	// Update initially
	updatePreviewSize();
	// Resize listener
	window.addEventListener('resize', updatePreviewSize);
	window.addEventListener('orientationchange', updatePreviewSize);

	// Observe DOM changes in the app content so the preview can adapt
	const appRoot = document.getElementById('svelte') || document.body;
	const observer = new MutationObserver(() => updatePreviewSize());
	if (appRoot) observer.observe(appRoot, { subtree: true, childList: true, attributes: true, characterData: true });

	return () => {
		window.removeEventListener('resize', updatePreviewSize);
		window.removeEventListener('orientationchange', updatePreviewSize);
		observer.disconnect();
	};
});

</script>

<!-- Backdrop (fondo oscuro) que aparece detrás del menú -->
{#if $configuraciones.estaAbiertoElMenu}
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
					onclick={configuraciones.cerrarMenu}
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
								aria-checked={$configuraciones.lupaActivada}
								aria-describedby="toggle-magnifier-desc"
								class="switch-toggle"
								class:active={$configuraciones.lupaActivada}
								onclick={() => configuraciones.toggleMagnifier()}
								aria-label={$configuraciones.lupaActivada ? 'Desactivar lupa mágica' : 'Activar lupa mágica'}
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
							<span class="control-valor">{$configuraciones.multiplicadorTamanioFuente.toFixed(1)}×</span>
						</div>
						<div class="switch-container">
							<label for="toggle-font-size" class="switch-label">Duplicar tamaño de texto</label>
							<button
								id="toggle-font-size"
								type="button"
								role="switch"
								aria-checked={$configuraciones.multiplicadorTamanioFuente >= 1.9}
								aria-describedby="toggle-font-size-desc"
								class="switch-toggle"
								class:active={$configuraciones.multiplicadorTamanioFuente >= 1.9}
								onclick={() => configuraciones.setFontSize($configuraciones.multiplicadorTamanioFuente >= 1.9 ? 1 : 2) }
								aria-label={$configuraciones.multiplicadorTamanioFuente >= 1.9 ? 'Desactivar tamaño de fuente duplicado' : 'Activar tamaño de fuente duplicado'}
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
							<span class="control-valor">{$configuraciones.multiplicadorEspaciado.toFixed(1)}×</span>
						</div>
						<div class="switch-container">
							<label for="toggle-spacing" class="switch-label">Duplicar espaciado</label>
							<button
								id="toggle-spacing"
								type="button"
								role="switch"
								aria-checked={$configuraciones.multiplicadorEspaciado >= 1.9}
								aria-describedby="toggle-spacing-desc"
								class="switch-toggle"
								class:active={$configuraciones.multiplicadorEspaciado >= 1.9}
								onclick={() => configuraciones.setSpacing($configuraciones.multiplicadorEspaciado >= 1.9 ? 1 : 2) }
								aria-label={$configuraciones.multiplicadorEspaciado >= 1.9 ? 'Desactivar espaciado duplicado' : 'Activar espaciado duplicado'}
							>
								<span class="switch-knob"></span>
							</button>
						</div>
						<div class="control-ayuda" id="toggle-spacing-desc">
							<small>Activa para duplicar el espaciado entre elementos y mejorar la lectura visual.</small>
						</div>
					</div>

					<!-- Sección: Modo Noche (Alto Contraste) -->
					<div class="control-grupo">
						<h3 class="seccion-titulo">Alto Contraste</h3>
                        
						<!-- Interruptor para activar/desactivar el Modo Noche -->
						<div class="switch-container">
							<label for="toggle-modo-noche" class="switch-label">Activar Modo Noche</label>
							<button
								id="toggle-modo-noche"
								type="button"
								role="switch"
								aria-checked={$configuraciones.modoNoche}
								aria-describedby="toggle-modo-noche-desc"
								class="switch-toggle"
								class:active={$configuraciones.modoNoche}
								onclick={() => configuraciones.toggleModoNoche()}
								aria-label={$configuraciones.modoNoche ? 'Desactivar Modo Noche' : 'Activar Modo Noche'}
							>
								<span class="switch-knob"></span>
							</button>
						</div>
						<div class="control-ayuda" id="toggle-modo-noche-desc">
							<small>Activa una paleta de alto contraste con fondo oscuro y texto claro.</small>
						</div>

						<!-- Interruptor condicional para el Modo Inverso (solo visible si modoNoche está activo) -->
						{#if $configuraciones.modoNoche}
							<div class="switch-container">
								<label for="toggle-modo-inverso" class="switch-label">Activar Modo Inverso</label>
								<button
									id="toggle-modo-inverso"
									type="button"
									role="switch"
									aria-checked={$configuraciones.modoInverso}
									aria-describedby="toggle-modo-inverso-desc"
									class="switch-toggle"
									class:active={$configuraciones.modoInverso}
									onclick={() => configuraciones.toggleModoInverso()}
									aria-label={$configuraciones.modoInverso ? 'Desactivar Modo Inverso' : 'Activar Modo Inverso'}
								>
									<span class="switch-knob"></span>
								</button>
							</div>
							<div class="control-ayuda" id="toggle-modo-inverso-desc">
								<small>Invierte la paleta del Modo Noche para una experiencia visual alternativa.</small>
							</div>
						{/if}
					</div>

					<!-- Sección: Modos de Lectura -->
					<div class="control-grupo">
						<h3 class="seccion-titulo">Modos de Lectura</h3>
                        
						<!-- Modo Biónico -->
						<div class="switch-container">
							<label for="toggle-bionic" class="switch-label">Modo biónico</label>
							<button
								id="toggle-bionic"
								type="button"
								role="switch"
								aria-checked={$configuraciones.bionicMode}
								aria-describedby="toggle-bionic-desc"
								class="switch-toggle"
								class:active={$configuraciones.bionicMode}
								onclick={() => configuraciones.toggleBionicMode()}
								aria-label={$configuraciones.bionicMode ? 'Desactivar modo biónico' : 'Activar modo biónico'}
							>
								<span class="switch-knob"></span>
							</button>
						</div>
						<div class="control-ayuda" id="toggle-bionic-desc">
							<small>Resalta las primeras sílabas de cada palabra para facilitar la lectura rápida.</small>
						</div>

						<!-- Modo Rima -->
						<div class="switch-container">
							<label for="toggle-rhyme" class="switch-label">Modo rima</label>
							<button
								id="toggle-rhyme"
								type="button"
								role="switch"
								aria-checked={$configuraciones.rhymeMode}
								aria-describedby="toggle-rhyme-desc"
								class="switch-toggle"
								class:active={$configuraciones.rhymeMode}
								onclick={() => configuraciones.toggleRhymeMode()}
								aria-label={$configuraciones.rhymeMode ? 'Desactivar modo rima' : 'Activar modo rima'}
							>
								<span class="switch-knob"></span>
							</button>
						</div>
						<div class="control-ayuda" id="toggle-rhyme-desc">
							<small>Colorea las rimas y sílabas para mejorar la comprensión de patrones.</small>
						</div>

						<!-- Modo Pictográfico -->
						<div class="switch-container">
							<label for="toggle-pictogram" class="switch-label">Modo pictográfico</label>
							<button
								id="toggle-pictogram"
								type="button"
								role="switch"
								aria-checked={$configuraciones.pictogramMode}
								aria-describedby="toggle-pictogram-desc"
								class="switch-toggle"
								class:active={$configuraciones.pictogramMode}
								onclick={() => configuraciones.togglePictogramMode()}
								aria-label={$configuraciones.pictogramMode ? 'Desactivar modo pictográfico' : 'Activar modo pictográfico'}
							>
								<span class="switch-knob"></span>
							</button>
						</div>
						<div class="control-ayuda" id="toggle-pictogram-desc">
							<small>Muestra iconos junto a palabras clave para facilitar la comprensión visual.</small>
						</div>

						<!-- Modo Dislexia -->
						<div class="switch-container">
							<label for="toggle-dyslexia" class="switch-label">Fuente para dislexia</label>
							<button
								id="toggle-dyslexia"
								type="button"
								role="switch"
								aria-checked={$configuraciones.dyslexiaMode}
								aria-describedby="toggle-dyslexia-desc"
								class="switch-toggle"
								class:active={$configuraciones.dyslexiaMode}
								onclick={() => configuraciones.toggleDyslexiaMode()}
								aria-label={$configuraciones.dyslexiaMode ? 'Desactivar fuente para dislexia' : 'Activar fuente para dislexia'}
							>
								<span class="switch-knob"></span>
							</button>
						</div>
						<div class="control-ayuda" id="toggle-dyslexia-desc">
							<small>Usa una tipografía diseñada especialmente para personas con dislexia.</small>
						</div>
					</div>

					<!-- Sección: Narración Auditiva -->
					<div class="control-grupo">
						<h3 class="seccion-titulo">Narración</h3>
                        
						<!-- Activar Narración -->
						<div class="switch-container">
							<label for="toggle-narration" class="switch-label">Activar narración de voz</label>
							<button
								id="toggle-narration"
								type="button"
								role="switch"
								aria-checked={$configuraciones.narrationEnabled}
								aria-describedby="toggle-narration-desc"
								class="switch-toggle"
								class:active={$configuraciones.narrationEnabled}
								onclick={() => configuraciones.toggleNarration()}
								aria-label={$configuraciones.narrationEnabled ? 'Desactivar narración' : 'Activar narración'}
							>
								<span class="switch-knob"></span>
							</button>
						</div>
						<div class="control-ayuda" id="toggle-narration-desc">
							<small>Lee el texto en voz alta con resaltado palabra por palabra.</small>
						</div>

						<!-- Velocidad de Narración (solo visible si está activada) -->
						{#if $configuraciones.narrationEnabled}
							<div class="control-label">
								<span>Velocidad de narración</span>
								<span class="control-valor">{$configuraciones.ttsSpeed?.toFixed(1) || '1.0'}×</span>
							</div>
							<input
								type="range"
								min="0.5"
								max="2"
								step="0.1"
								value={$configuraciones.ttsSpeed || 1}
								oninput={(e) => configuraciones.setTTSSpeed(parseFloat((e.target as HTMLInputElement).value))}
								aria-label="Velocidad de narración"
								class="slider"
							/>
							<div class="control-ayuda">
								<small>Ajusta qué tan rápido se lee el texto (0.5× lento - 2× rápido).</small>
							</div>
						{/if}
					</div>

					<!-- Botón para reiniciar valores -->
					<button class="boton-reset" onclick={configuraciones.reset}>
						Restaurar valores por defecto
					</button>
				</section>

				<!-- Sección de Vista Previa: Muestra la página actual en tiempo real -->
				<aside class="vista-previa" aria-label="Vista previa de cambios en tiempo real">
					<h3 class="preview-titulo">Vista Previa en Tiempo Real</h3>
					
					<!-- Marco tipo "monitor" que contiene el preview escalado -->
					<div class="preview-marco" bind:this={previewMarcoEl}>
						<div class="preview-contenedor" bind:this={previewContEl}>
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

	/* Slider para controles con rango (como velocidad de narración) */
	.slider {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: #e0e0e0;
		outline: none;
		-webkit-appearance: none;
		appearance: none;
		cursor: pointer;
		margin: calc(var(--spacing-base, 1rem) * 0.5) 0;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #0b6efd;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: background 150ms ease;
	}

	.slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #0b6efd;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: background 150ms ease;
	}

	.slider:hover::-webkit-slider-thumb {
		background: #0958d9;
	}

	.slider:hover::-moz-range-thumb {
		background: #0958d9;
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
		/* The size of the contenedor will be set dynamically based on the app root size */
		/* Transform is applied dynamically using inline style for correct centering and scaling */
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
