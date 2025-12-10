<script lang="ts">
	// Página de Ajustes de Accesibilidad
	// Este componente permite al usuario personalizar la apariencia de la app.
	// Se ha transformado de modal a página independiente.
	
	import { configuraciones } from '$lib/stores/settings';
	import { onMount } from 'svelte';

	// Nota: En una 'page.svelte' normal no recibimos 'children' como snippet de contenido principal,
	// por lo que se ha eliminado esa prop para evitar errores. 
	// La lógica de vista previa se mantiene, pero el contenido a previsualizar dependerá del contexto.

	let previewMarcoEl: HTMLElement | null = $state(null);
	let previewContEl: HTMLElement | null = $state(null);
	let previewScale = 1;

	// Recalcular la escala de la vista previa cuando cambian los ajustes relevantes
	$effect(() => {
		if (previewMarcoEl && previewContEl) {
			updatePreviewSize();
		}
	});

	$effect(() => {
		if (previewMarcoEl && previewContEl && ($configuraciones.multiplicadorTamanioFuente || $configuraciones.multiplicadorEspaciado || $configuraciones.lupaActivada)) {
			// Cuando cambian los ajustes que afectan al diseño, actualizar la escala de la vista previa
			updatePreviewSize();
		}
	});

	function updatePreviewSize() {
		// Busca la raíz de la aplicación para calcular dimensiones
		const appRoot = document.getElementById('svelte') || document.body;
		if (!appRoot || !previewMarcoEl || !previewContEl) return;

		const appW = appRoot.scrollWidth;
		const appH = appRoot.scrollHeight;
		const marcoRect = previewMarcoEl.getBoundingClientRect();
		const maxW = marcoRect.width;
		const maxH = marcoRect.height;
		
		// Calcular escala para encajar la vista
		const scale = Math.max(0.1, Math.min(maxW / Math.max(1, appW), maxH / Math.max(1, appH)));
		previewScale = scale;

		// Aplicar tamaño y centrar el contenido escalado dentro del marco
		previewContEl.style.width = `${appW}px`;
		previewContEl.style.height = `${appH}px`;
		const offsetX = (maxW - appW * scale) / 2;
		const offsetY = (maxH - appH * scale) / 2;
		previewContEl.style.transformOrigin = 'top left';
		previewContEl.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
	}

	onMount(() => {
		// Actualización inicial
		updatePreviewSize();
		
		// Eventos de redimensionamiento
		window.addEventListener('resize', updatePreviewSize);
		window.addEventListener('orientationchange', updatePreviewSize);

		// Observar cambios en el DOM de la app para adaptar la vista previa
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

<!-- Contenedor principal de la página -->
<div class="contenedor-pagina">
	<div class="panel-ajustes" role="region" aria-labelledby="titulo-ajustes">
		<!-- Encabezado de la página -->
		<header class="panel-header" data-magnificable>
			<h2 id="titulo-ajustes">Ajustes de Accesibilidad</h2>
			<!-- Se eliminó el botón de cerrar al ser una página dedicada -->
		</header>

		<!-- Contenido: Controles a la izquierda, Vista previa a la derecha -->
		<div class="panel-contenido">
			<!-- Sección de Controles -->
			<section class="controles" aria-label="Controles de personalización" data-magnificable>
				
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
							aria-checked={$configuraciones.multiplicadorTamanioFuente >= 1.2}
							aria-describedby="toggle-font-size-desc"
							class="switch-toggle"
							class:active={$configuraciones.multiplicadorTamanioFuente >= 1.2}
							onclick={() => configuraciones.setFontSize($configuraciones.multiplicadorTamanioFuente >= 1.2 ? 1 : 1.5) }
							aria-label={$configuraciones.multiplicadorTamanioFuente >= 1.2 ? 'Desactivar tamaño de fuente duplicado' : 'Activar tamaño de fuente duplicado'}
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
							aria-checked={$configuraciones.multiplicadorEspaciado >= 1.2}
							aria-describedby="toggle-spacing-desc"
							class="switch-toggle"
							class:active={$configuraciones.multiplicadorEspaciado >= 1.2}
							onclick={() => configuraciones.setSpacing($configuraciones.multiplicadorEspaciado >= 1.2 ? 1 : 1.5) }
							aria-label={$configuraciones.multiplicadorEspaciado >= 1.2 ? 'Desactivar espaciado duplicado' : 'Activar espaciado duplicado'}
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

			<!-- Sección de Vista Previa -->
			<aside class="vista-previa" aria-label="Vista previa de cambios en tiempo real">
				<h3 class="preview-titulo">Vista Previa</h3>
				<div class="preview-marco" bind:this={previewMarcoEl}>
					<div class="preview-contenedor" bind:this={previewContEl}>
						<div class="preview-placeholder">
							<p>La vista previa reaccionará a los cambios de tamaño de la ventana.</p>
						</div>
					</div>
				</div>
			</aside>
		</div>
	</div>
</div>

<style>
	/* Contenedor general de la página (sustituye al backdrop) */
	.contenedor-pagina {
		width: 100%;
		min-height: 100vh;
		display: flex;
		justify-content: center;
		padding: var(--spacing-base, 1rem);
		background: var(--bg, #f8f9fa); /* Fondo neutro para la página */
	}

	/* Panel principal */
	.panel-ajustes {
		background: var(--bg,white);
		border-radius: var(--border-radius, 8px);
		max-width: 900px;
		width: 100%;
		/* Eliminado max-height y overflow para permitir scroll natural de la página */
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		border: 1px solid #e0e0e0;
		height: fit-content;
		margin-top: 2rem;
		margin-bottom: 2rem;
	}

	/* Encabezado del panel */
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: calc(var(--spacing-base, 1rem) * 1.5);
		border-bottom: 1px solid #e0e0e0;
		background: white;
		border-top-left-radius: var(--border-radius, 8px);
		border-top-right-radius: var(--border-radius, 8px);
	}

	.panel-header h2 {
		margin: 0;
		font-size: calc(var(--font-size-base, 1rem) * 1.5);
		color: #222;
	}

	/* Contenido principal: controles + vista previa */
	.panel-contenido {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: calc(var(--spacing-base, 1rem) * 2);
		padding: calc(var(--spacing-base, 1rem) * 2);
	}

	@media (max-width: 768px) {
		.panel-contenido {
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
		overflow: hidden;
		height: fit-content;
		position: sticky; /* Sticky para que siga visible si la página es larga */
		top: 20px;
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
		overflow: hidden;
		position: relative;
		aspect-ratio: 16 / 9;
		width: 100%;
	}

	/* Contenedor interno escalado que muestra el contenido */
	.preview-contenedor {
		background: white;
		pointer-events: none;
		overflow: hidden;
		position: absolute;
		top: 0;
		left: 0;
	}
	
	.preview-placeholder {
		padding: 2rem;
		text-align: center;
		color: #666;
		font-size: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	@media (prefers-reduced-motion: reduce) {
		.boton-reset { transition: none; }
	}

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