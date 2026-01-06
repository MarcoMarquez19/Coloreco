<script lang="ts">
	// Página de Ajustes de Accesibilidad
	// Este componente permite al usuario personalizar la apariencia de la app.
	// Se ha transformado de modal a página independiente.
	
	import type { ColorBlindnessMode } from '$lib/stores/settings';
	import { configuraciones } from '$lib/stores/settings';
	import { audioStore, clickSound } from '$lib/stores/audio';
	import { onMount } from 'svelte';

	// Nota: En una 'page.svelte' normal no recibimos 'children' como snippet de contenido principal,
	// por lo que se ha eliminado esa prop para evitar errores. 
	// La lógica de vista previa se mantiene, pero el contenido a previsualizar dependerá del contexto.

	let previewMarcoEl: HTMLElement | null = $state(null);
	let previewContEl: HTMLElement | null = $state(null);
	let previewScale = 1;
	let speedDisplay = $state(($configuraciones.ttsSpeed || 1).toFixed(2));

	// Recalcular la escala de la vista previa cuando cambian los ajustes relevantes
	$effect(() => {
		if (previewMarcoEl && previewContEl && $configuraciones) {
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
				
				<div class="control-grupo seccion-grupo">
					<h3 class="seccion-titulo">Accesibilidad Visual (Daltonismo)</h3>
					
					<div class="control-subgrupo">
						<label for="select-colorblindness" class="control-label">
							<span>Modo de Visión</span>
						</label>
						<select
							id="select-colorblindness"
							value={$configuraciones.colorBlindness as any}
						onchange={(e) => { audioStore.playSound('click'); configuraciones.setColorBlindness(e.currentTarget.value as ColorBlindnessMode); }}
							class="select-input"
							aria-label="Seleccionar modo de simulación de daltonismo"
						>
							<option value="none">Ninguno (Normal)</option>
							<option value="protanopia">Protanopía (Rojo)</option>
							<option value="deuteranopia">Deuteranopía (Verde)</option>
							<option value="tritanopia">Tritanopía (Azul)</option>
							<option value="achromatopsia">Acromatopsia (Grises)</option>
						</select>
					</div>

					<div class="control-subgrupo">
						<label for="slider-intensity" class="control-label">
							<span>Intensidad del Filtro</span>
							<span class="control-valor">{($configuraciones.intensity * 100).toFixed(0)}%</span>
						</label>
						<input
							id="slider-intensity"
							type="range"
							min="0"
							max="1"
							step="0.1"
							value={$configuraciones.intensity}
						oninput={(e) => { audioStore.playSound('hover'); configuraciones.setIntensity(parseFloat(e.currentTarget.value)); }}
							disabled={$configuraciones.colorBlindness === 'none'}
							class="slider"
							aria-label="Ajustar la intensidad del filtro de color"
							aria-valuemin="0"
							aria-valuemax="1"
							aria-valuenow={$configuraciones.intensity}
							aria-valuetext="{($configuraciones.intensity * 100).toFixed(0)} por ciento"
						/>
					</div>

					<div class="control-row">
						<label class="checkbox-label">
							<input
								type="checkbox"
								checked={$configuraciones.textures}
							onchange={(e) => { audioStore.playSound('click'); configuraciones.setTextures(e.currentTarget.checked); }}
								aria-label="Activar texturas de ayuda para diferenciar colores"
								aria-checked={$configuraciones.textures}
							/>
							<span>Texturas de Ayuda</span>
						</label>
						
						<label class="checkbox-label">
							<input
								type="checkbox"
								checked={$configuraciones.contrast === 'high'}
							onchange={(e) => { audioStore.playSound('click'); configuraciones.setContrast(e.currentTarget.checked ? 'high' : 'normal'); }}
								aria-label="Activar modo de alto contraste inteligente"
								aria-checked={$configuraciones.contrast === 'high'}
							/>
							<span>Alto Contraste Inteligente</span>
						</label>
					</div>

					{#if $configuraciones.textures}
						<div 
							class="texture-legend-container" 
							aria-label="Leyenda de patrones de identificación por texturas"
							role="region"
						>
							<h4 class="legend-title" id="legend-title">Patrones de Identificación</h4>
						<p class="legend-description">Cada color tiene un patrón único para facilitar su identificación</p>
						<div class="texture-legend" aria-labelledby="legend-title">
							<div class="legend-item"><div class="swatch pattern-black bg-black" aria-hidden="true"></div><span>Negro</span></div>
							<div class="legend-item"><div class="swatch pattern-red bg-red" aria-hidden="true"></div><span>Rojo</span></div>
							<div class="legend-item"><div class="swatch pattern-green bg-green" aria-hidden="true"></div><span>Verde</span></div>
							<div class="legend-item"><div class="swatch pattern-blue bg-blue" aria-hidden="true"></div><span>Azul</span></div>
							<div class="legend-item"><div class="swatch pattern-yellow bg-yellow" aria-hidden="true"></div><span>Amarillo</span></div>
							<div class="legend-item"><div class="swatch pattern-magenta bg-magenta" aria-hidden="true"></div><span>Magenta</span></div>
							<div class="legend-item"><div class="swatch pattern-cyan bg-cyan" aria-hidden="true"></div><span>Cian</span></div>
							<div class="legend-item"><div class="swatch pattern-orange bg-orange" aria-hidden="true"></div><span>Naranja</span></div>
							<div class="legend-item"><div class="swatch pattern-purple bg-purple" aria-hidden="true"></div><span>Púrpura</span></div>
							<div class="legend-item"><div class="swatch pattern-pink bg-pink" aria-hidden="true"></div><span>Rosa</span></div>
							</div>
						</div>
					{/if}
				</div>

				<hr class="separador" />

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
							class:pattern-blue={$configuraciones.lupaActivada}
						onclick={() => { audioStore.playSound('click'); configuraciones.toggleMagnifier(); }}
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
							class:pattern-blue={$configuraciones.multiplicadorTamanioFuente >= 1.2}
						onclick={() => { audioStore.playSound('click'); configuraciones.setFontSize($configuraciones.multiplicadorTamanioFuente >= 1.2 ? 1 : 1.5); }}
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
							class:pattern-blue={$configuraciones.multiplicadorEspaciado >= 1.2}
						onclick={() => { audioStore.playSound('click'); configuraciones.setSpacing($configuraciones.multiplicadorEspaciado >= 1.2 ? 1 : 1.5); }}
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
							class:pattern-blue={$configuraciones.modoNoche}
						onclick={() => { audioStore.playSound('click'); configuraciones.toggleModoNoche(); }}
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
								class:pattern-blue={$configuraciones.modoInverso}
							onclick={() => { audioStore.playSound('click'); configuraciones.toggleModoInverso(); }}
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
				<hr class="separador" />

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
						class:active={$configuraciones.bionicMode}						class:pattern-blue={$configuraciones.bionicMode}						onclick={() => { audioStore.playSound('click'); configuraciones.toggleBionicMode(); }}
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
						class:active={$configuraciones.rhymeMode}						class:pattern-blue={$configuraciones.rhymeMode}						onclick={() => { audioStore.playSound('click'); configuraciones.toggleRhymeMode(); }}
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
						class:active={$configuraciones.pictogramMode}						class:pattern-blue={$configuraciones.pictogramMode}						onclick={() => { audioStore.playSound('click'); configuraciones.togglePictogramMode(); }}
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
						class:active={$configuraciones.narrationEnabled}						class:pattern-blue={$configuraciones.narrationEnabled}						onclick={() => { audioStore.playSound('click'); configuraciones.toggleNarration(); }}
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
						<span class="control-valor">{speedDisplay}×</span>
					</div>
					<input
						type="range"
						min="0.75"
						max="1.75"
						step="0.25"
						bind:value={speedDisplay}
						oninput={(e) => {
							audioStore.playSound('hover');
							const val = (e.target as HTMLInputElement).value;
							speedDisplay = parseFloat(val).toFixed(2);
							configuraciones.setTTSSpeed(parseFloat(val));
							
						// Leer la velocidad actual usando ttsService (mantiene la voz seleccionada)
						if (typeof window !== 'undefined') {
							import('$lib/audio/tts.service').then(({ ttsService }) => {
								ttsService.stop();
								ttsService.speak(`Velocidad ${speedDisplay}`, { lang: 'es-ES', rate: parseFloat(val) });
									ttsService.changeSpeed(parseFloat(val));
								});
							}
						}}
						aria-label="Velocidad de narración"
						aria-valuemin="0.75"
						aria-valuemax="1.75"
						aria-valuenow={parseFloat(speedDisplay)}
						aria-valuetext="{speedDisplay} veces la velocidad normal"
						class="slider"
					/>
					<div class="control-ayuda">
						<small>0.75× (muy lento) - 1× (normal) - 1.25× (rápido) - 1.5× (muy rápido) - 1.75× (máximo)</small>
					</div>
				{/if}
				</div>

				<hr class="separador" />

				<!-- Sección: Audio -->
				<div class="control-grupo seccion-grupo">
					<h3 class="seccion-titulo">Audio</h3>
					
					<!-- Control: Música de Fondo -->
					<div class="control-subgrupo">
						<div class="switch-container">
							<label for="toggle-music" class="switch-label">Música de Fondo</label>
							<button
								id="toggle-music"
								type="button"
								role="switch"
								aria-checked={$audioStore.musicEnabled}
								aria-describedby="toggle-music-desc"
								class="switch-toggle"
								class:active={$audioStore.musicEnabled}
							class:pattern-blue={$audioStore.musicEnabled}
							onclick={() => { audioStore.playSound('click'); audioStore.toggleMusic(); }}
								aria-label={$audioStore.musicEnabled ? 'Desactivar música de fondo' : 'Activar música de fondo'}
							>
								<span class="switch-knob"></span>
							</button>
						</div>
						<div class="control-ayuda" id="toggle-music-desc">
							<small>Reproduce música ambiental mientras usas la aplicación.</small>
						</div>
						
						{#if $audioStore.musicEnabled}
							<div class="control-volumen">
								<label for="slider-music-volume" class="control-label">
									<span>Volumen de Música</span>
									<span class="control-valor">{($audioStore.musicVolume * 100).toFixed(0)}%</span>
								</label>
								<input
									id="slider-music-volume"
									type="range"
									min="0"
									max="1"
									step="0.1"
									value={$audioStore.musicVolume}
								oninput={(e) => { audioStore.playSound('hover'); audioStore.setMusicVolume(parseFloat(e.currentTarget.value)); }}
									class="slider"
									aria-label="Ajustar volumen de la música de fondo"
									aria-valuemin="0"
									aria-valuemax="1"
									aria-valuenow={$audioStore.musicVolume}
									aria-valuetext="{($audioStore.musicVolume * 100).toFixed(0)} por ciento"
								/>
							</div>
						{/if}
					</div>

					<!-- Control: Efectos de Sonido -->
					<div class="control-subgrupo">
						<div class="switch-container">
							<label for="toggle-sound" class="switch-label">Efectos de Sonido</label>
							<button
								id="toggle-sound"
								type="button"
								role="switch"
								aria-checked={$audioStore.soundEnabled}
								aria-describedby="toggle-sound-desc"
								class="switch-toggle"
								class:active={$audioStore.soundEnabled}
							class:pattern-blue={$audioStore.soundEnabled}
							onclick={() => { audioStore.playSound('click'); audioStore.toggleSound(); }}
								aria-label={$audioStore.soundEnabled ? 'Desactivar efectos de sonido' : 'Activar efectos de sonido'}
							>
								<span class="switch-knob"></span>
							</button>
						</div>
						<div class="control-ayuda" id="toggle-sound-desc">
							<small>Reproduce sonidos al interactuar con botones y acciones.</small>
						</div>
						
						{#if $audioStore.soundEnabled}
							<div class="control-volumen">
								<label for="slider-sound-volume" class="control-label">
									<span>Volumen de Efectos</span>
									<span class="control-valor">{($audioStore.soundVolume * 100).toFixed(0)}%</span>
								</label>
								<input
									id="slider-sound-volume"
									type="range"
									min="0"
									max="1"
									step="0.1"
									value={$audioStore.soundVolume}
								oninput={(e) => { audioStore.playSound('hover'); audioStore.setSoundVolume(parseFloat(e.currentTarget.value)); }}
									class="slider"
									aria-label="Ajustar volumen de los efectos de sonido"
									aria-valuemin="0"
									aria-valuemax="1"
									aria-valuenow={$audioStore.soundVolume}
									aria-valuetext="{($audioStore.soundVolume * 100).toFixed(0)} por ciento"
								/>
							</div>
						{/if}
					</div>
				</div>

				<!-- Botón para reiniciar valores -->
				<button class="boton-reset" onclick={() => { configuraciones.reset(); audioStore.reset(); }} use:clickSound>
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
		background: var(--fondo-botones, white);
		color: var(--icono-color-relleno, black);
		border-top-left-radius: var(--border-radius, 8px);
		border-top-right-radius: var(--border-radius, 8px);
	}

	.panel-header h2 {
		margin: 0;
		font-size: calc(var(--font-size-base, 1rem) * 1.5);
		color: var(--icono-color-relleno, black);
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
		color: var(--icono-color-borde, black);
	}

	.control-valor {
		font-weight: 700;
		color: var(--color-texto, #333);
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
	}

	.control-ayuda {
		color: var(--icono-color-borde, black);
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
		background: var(--fondo-botones, #333333);
		color: var(--icono-color-relleno, white);
		border: 1px solid #ccc;
		border-radius: var(--border-radius, 8px);
		cursor: pointer;
		font-size: calc(var(--font-size-base, 1rem) * 0.9);
		font-weight: 500;
		transition: background 150ms ease;
	}

	.boton-reset:hover {
        background: var(--fondo-botones-hover, #9b978a);
	}

	.boton-reset:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #9b978a);
		outline-offset: 7px;
        transform: translateY(-2px);
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
		color: var(--icono-color-borde, black);
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
		color: var(--icono-color-borde, black);
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
		/* IMPORTANTE: Z-index 2 para estar por encima de la textura pattern-blue */
		z-index: 2;
	}

	.switch-toggle.active .switch-knob {
		transform: translateX(24px);
	}
	/* === TUS ESTILOS NUEVOS (Agregados para tus controles) === */
	.seccion-grupo { margin-bottom: 1rem; }
	.control-subgrupo { margin-bottom: 1rem; }
	.separador { border: 0; border-top: 1px solid #eee; margin: 1.5rem 0; }
	
	/* Input Select */
	.select-input {
		padding: 0.5rem; border-radius: 4px; border: 1px solid #ccc;
		width: 100%; font-size: 1rem; background: white; margin-top: 0.5rem;
	}
	
	/* Range Slider */
	.slider {
		width: 100%; height: 8px; border-radius: 4px; background: #e0e0e0;
		outline: none; appearance: none; -webkit-appearance: none; margin-top: 0.5rem;
	}
	.slider:disabled { opacity: 0.5; cursor: not-allowed; }
	.slider::-webkit-slider-thumb {
		-webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
		background: #0b6efd; cursor: pointer; box-shadow: 0 2px 6px rgba(11,110,253,0.3);
	}
	
	/* Checkboxes */
	.control-row { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem; }
	.checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none; }
	
	/* Leyenda de Texturas */
	.texture-legend-container { margin-top: 1rem; padding: 1rem; background: #f9f9f9; border-radius: 8px; border: 1px solid #eee; }
	.legend-title { margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600; color: #333; }
	.legend-description { margin: 0 0 0.75rem 0; font-size: 0.85rem; color: #666; }
	.texture-legend { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; }
	.legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #333; font-weight: 500; }
	.swatch { width: 32px; height: 32px; border-radius: 4px; border: 2px solid rgba(0,0,0,0.2); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
	
	/* Colores de fondo para las muestras */
	.bg-black { background: #000000; }
	.bg-red { background: #FF0000; }
	.bg-green { background: #00FF00; }
	.bg-blue { background: #0000FF; }
	.bg-yellow { background: #FFFF00; }
	.bg-magenta { background: #FF00FF; }
	.bg-cyan { background: #00FFFF; }
	.bg-orange { background: #FFA500; }
	.bg-purple { background: #800080; }
	.bg-pink { background: #FFC0CB; }

	
	/* Referencia a las clases globales de texturas */
	.bg-red { background-color: #ff4d4f; }
	.bg-green { background-color: #52c41a; }
	.bg-blue { background-color: #1890ff; }
	.bg-yellow { background-color: #fadb14; }
</style>