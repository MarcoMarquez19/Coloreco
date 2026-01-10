<script lang="ts">
	// Página de Ajustes de Accesibilidad
	// Este componente permite al usuario personalizar la apariencia de la app.
	// Se ha transformado de modal a página independiente.
	
	import type { ColorBlindnessMode } from '$lib/stores/settings';
	import { configuraciones } from '$lib/stores/settings';
	import { audioStore, clickSound } from '$lib/stores/audio';
	import { onMount } from 'svelte';
</script>

<!-- Contenedor principal de la página -->
<div class="contenedor-pagina">
	<div class="panel-ajustes" role="region" aria-labelledby="titulo-ajustes">
		<!-- Encabezado de la página -->
		<header class="panel-header" data-magnificable>
			<h2 id="titulo-ajustes">Ajustes de Accesibilidad</h2>
			<!-- Se eliminó el botón de cerrar al ser una página dedicada -->
		</header>

		<!-- Contenido: Solo Controles -->
		<div class="panel-contenido">
			<!-- Grid de 2x2 para las secciones principales -->
			<section class="controles-grid" aria-label="Controles de personalización" data-magnificable>
				<!-- ARRIBA IZQUIERDA: Daltonismo -->
				<div class="seccion-caja">
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
					<span class="control-valor" data-no-adapt="true">{Math.round($configuraciones.intensity * 100)}%</span>
					</label>
						<input
							id="slider-intensity"
							type="range"
							min="0"
							max="1"
							step="0.1"
							value={$configuraciones.intensity}
						oninput={(e) => { 
							audioStore.playSound('hover'); 
							const val = parseFloat(e.currentTarget.value);
						configuraciones.setIntensity(val);
						}}
							disabled={$configuraciones.colorBlindness === 'none'}
							class="slider"
							aria-label="Ajustar la intensidad del filtro de color"
							aria-valuemin="0"
							aria-valuemax="1"
							aria-valuenow={$configuraciones.intensity}
							aria-valuetext="{Math.round($configuraciones.intensity * 100)} por ciento"
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

				<!-- ARRIBA DERECHA: Modos de Lectura -->
				<div class="seccion-caja">
					<h3 class="seccion-titulo">Modos de Lectura</h3>
					
					<div class="control-item">
						<button
							type="button"
							role="switch"
							aria-checked={$configuraciones.bionicMode}
							class="text-button"
							class:active={$configuraciones.bionicMode}
							onclick={() => { audioStore.playSound('click'); configuraciones.toggleBionicMode(); }}
							aria-label={$configuraciones.bionicMode ? 'Desactivar modo biónico' : 'Activar modo biónico'}
						>
							Modo Biónico
						</button>
						<div class="control-ayuda">
							<small>Resalta las primeras sílabas de cada palabra para facilitar la lectura rápida.</small>
						</div>
					</div>

					<div class="control-item">
						<button
							type="button"
							role="switch"
							aria-checked={$configuraciones.rhymeMode}
							class="text-button"
							class:active={$configuraciones.rhymeMode}
							onclick={() => { audioStore.playSound('click'); configuraciones.toggleRhymeMode(); }}
							aria-label={$configuraciones.rhymeMode ? 'Desactivar modo rima' : 'Activar modo rima'}
						>
							Modo Rima
						</button>
						<div class="control-ayuda">
							<small>Colorea las rimas y sílabas para mejorar la comprensión de patrones.</small>
						</div>
					</div>

					<div class="control-item">
						<button
							type="button"
							role="switch"
							aria-checked={$configuraciones.pictogramMode}
							class="text-button"
							class:active={$configuraciones.pictogramMode}
							onclick={() => { audioStore.playSound('click'); configuraciones.togglePictogramMode(); }}
							aria-label={$configuraciones.pictogramMode ? 'Desactivar modo pictográfico' : 'Activar modo pictográfico'}
						>
							Modo Pictográfico
						</button>
						<div class="control-ayuda">
							<small>Muestra iconos junto a palabras clave para facilitar la comprensión visual.</small>
						</div>
					</div>
				</div>

				<!-- ABAJO IZQUIERDA: Ceguera -->
				<div class="seccion-caja">
					<h3 class="seccion-titulo">Accesibilidad para Ceguera</h3>
					
					<div class="control-item">
						<button
							type="button"
							role="switch"
							aria-checked={$configuraciones.lupaActivada}
							class="text-button"
							class:active={$configuraciones.lupaActivada}
							onclick={() => { audioStore.playSound('click'); configuraciones.toggleMagnifier(); }}
							aria-label={$configuraciones.lupaActivada ? 'Desactivar lupa mágica' : 'Activar lupa mágica'}
						>
							Lupa Mágica
						</button>
						<div class="control-ayuda">
							<small>Muestra una lente que magnifica parte de la pantalla.</small>
						</div>
					</div>

					<div class="control-item">
						<button
							type="button"
							role="switch"
							aria-checked={$configuraciones.multiplicadorTamanioFuente >= 1.2}
							class="text-button"
							class:active={$configuraciones.multiplicadorTamanioFuente >= 1.2}
							onclick={() => { audioStore.playSound('click'); configuraciones.setFontSize($configuraciones.multiplicadorTamanioFuente >= 1.2 ? 1 : 1.5); }}
							aria-label={$configuraciones.multiplicadorTamanioFuente >= 1.2 ? 'Desactivar tamaño de fuente duplicado' : 'Activar tamaño de fuente duplicado'}
						>
						Duplicar tamaño de texto (<span data-no-adapt="true">{($configuraciones.multiplicadorTamanioFuente || 1).toFixed(1)}×</span>)
						</button>
						<div class="control-ayuda">
							<small>Activa para duplicar el tamaño del texto en toda la aplicación y mejorar la legibilidad.</small>
						</div>
					</div>

					<div class="control-item">
						<button
							type="button"
							role="switch"
							aria-checked={$configuraciones.multiplicadorEspaciado >= 1.2}
							class="text-button"
							class:active={$configuraciones.multiplicadorEspaciado >= 1.2}
							onclick={() => { audioStore.playSound('click'); configuraciones.setSpacing($configuraciones.multiplicadorEspaciado >= 1.2 ? 1 : 1.5); }}
							aria-label={$configuraciones.multiplicadorEspaciado >= 1.2 ? 'Desactivar espaciado duplicado' : 'Activar espaciado duplicado'}
						>
						Duplicar espaciado (<span data-no-adapt="true">{($configuraciones.multiplicadorEspaciado || 1).toFixed(1)}×</span>)
						</button>
						<div class="control-ayuda">
							<small>Activa para duplicar el espaciado entre elementos y mejorar la lectura visual.</small>
						</div>
					</div>

					<div class="control-item">
						<button
							type="button"
							role="switch"
							aria-checked={$configuraciones.modoNoche}
							class="text-button"
							class:active={$configuraciones.modoNoche}
							onclick={() => { 
								audioStore.playSound('click'); 
								configuraciones.toggleModoNoche(); 
								// Forzar actualización del contenido para que se apliquen los colores correctamente
								setTimeout(() => {
									window.dispatchEvent(new CustomEvent('content-updated', { detail: { animationDuration: 0 } }));
								}, 100);
							}}
							aria-label={$configuraciones.modoNoche ? 'Desactivar Modo Noche' : 'Activar Modo Noche'}
						>
							Modo Noche (Alto Contraste)
						</button>
						<div class="control-ayuda">
							<small>Activa una paleta de alto contraste con fondo oscuro y texto claro.</small>
						</div>
					</div>

					{#if $configuraciones.modoNoche}
						<div class="control-item">
							<button
								type="button"
								role="switch"
								aria-checked={$configuraciones.modoInverso}
								class="text-button"
								class:active={$configuraciones.modoInverso}
								onclick={() => { 
									audioStore.playSound('click'); 
									configuraciones.toggleModoInverso(); 
									// Forzar actualización del contenido para que se apliquen los colores correctamente
									setTimeout(() => {
										window.dispatchEvent(new CustomEvent('content-updated', { detail: { animationDuration: 0 } }));
									}, 100);
								}}
								aria-label={$configuraciones.modoInverso ? 'Desactivar Modo Inverso' : 'Activar Modo Inverso'}
							>
								Modo Inverso
							</button>
							<div class="control-ayuda">
								<small>Invierte la paleta del Modo Noche para una experiencia visual alternativa.</small>
							</div>
						</div>
					{/if}
				</div>

				<!-- ABAJO DERECHA: Audio (incluyendo Narración) -->
				<div class="seccion-caja">
					<h3 class="seccion-titulo">Audio</h3>
					
					<!-- Control: Música de Fondo -->
					<div class="control-item">
						<button
							type="button"
							role="switch"
							aria-checked={$audioStore.musicEnabled}
							class="text-button"
							class:active={$audioStore.musicEnabled}
							onclick={() => { audioStore.playSound('click'); audioStore.toggleMusic(); }}
							aria-label={$audioStore.musicEnabled ? 'Desactivar música de fondo' : 'Activar música de fondo'}
						>
							Música de Fondo
						</button>
						<div class="control-ayuda">
							<small>Reproduce música ambiental mientras usas la aplicación.</small>
						</div>
						
						{#if $audioStore.musicEnabled}
							<div class="control-volumen">
								<label for="slider-music-volume" class="control-label">
								<span>Volumen de Música</span>
							<span class="control-valor" data-no-adapt="true">{Math.round($audioStore.musicVolume * 100)}%</span>
								</label>
								<input
									id="slider-music-volume"
									type="range"
									min="0"
									max="1"
									step="0.1"
								value={$audioStore.musicVolume}
							oninput={(e) => { 
								audioStore.playSound('hover');
								const val = parseFloat(e.currentTarget.value);
									audioStore.setMusicVolume(val);
								}}
									class="slider"
									aria-label="Ajustar volumen de la música de fondo"
									aria-valuemin="0"
									aria-valuemax="1"
								aria-valuenow={$audioStore.musicVolume}
								aria-valuetext="{Math.round($audioStore.musicVolume * 100)} por ciento"
								/>
							</div>
						{/if}
					</div>

					<!-- Control: Efectos de Sonido -->
					<div class="control-item">
						<button
							type="button"
							role="switch"
							aria-checked={$audioStore.soundEnabled}
							class="text-button"
							class:active={$audioStore.soundEnabled}
							onclick={() => { audioStore.playSound('click'); audioStore.toggleSound(); }}
							aria-label={$audioStore.soundEnabled ? 'Desactivar efectos de sonido' : 'Activar efectos de sonido'}
						>
							Efectos de Sonido
						</button>
						<div class="control-ayuda">
							<small>Reproduce sonidos al interactuar con botones y acciones.</small>
						</div>
						
						{#if $audioStore.soundEnabled}
							<div class="control-volumen">
								<label for="slider-sound-volume" class="control-label">
								<span>Volumen de Efectos</span>
							<span class="control-valor" data-no-adapt="true">{Math.round($audioStore.soundVolume * 100)}%</span>
								</label>
								<input
									id="slider-sound-volume"
									type="range"
									min="0"
									max="1"
									step="0.1"
								value={$audioStore.soundVolume}
							oninput={(e) => { 
								audioStore.playSound('hover');
								const val = parseFloat(e.currentTarget.value);
									audioStore.setSoundVolume(val);
								}}
									class="slider"
									aria-label="Ajustar volumen de los efectos de sonido"
									aria-valuemin="0"
									aria-valuemax="1"
								aria-valuenow={$audioStore.soundVolume}
								aria-valuetext="{Math.round($audioStore.soundVolume * 100)} por ciento"
								/>
							</div>
						{/if}
					</div>

					<!-- Control: Narración de Voz -->
					<div class="control-item">
						<button
							type="button"
							role="switch"
							aria-checked={$configuraciones.narrationEnabled}
							class="text-button"
							class:active={$configuraciones.narrationEnabled}
							onclick={() => { audioStore.playSound('click'); configuraciones.toggleNarration(); }}
							aria-label={$configuraciones.narrationEnabled ? 'Desactivar narración' : 'Activar narración'}
						>
							Narración de Voz
						</button>
						<div class="control-ayuda">
							<small>Lee el texto en voz alta con resaltado palabra por palabra.</small>
						</div>

						{#if $configuraciones.narrationEnabled}
							<div class="control-volumen">
								<label for="slider-narration-speed" class="control-label">
								<span>Velocidad de narración</span>
						<span class="control-valor" data-no-adapt="true">{($configuraciones.ttsSpeed || 1).toFixed(2)}×</span>
							</label>
							<input
								id="slider-narration-speed"
								type="range"
								min="0.75"
								max="1.75"
								step="0.25"
								value={$configuraciones.ttsSpeed || 1}
								oninput={(e) => {
									audioStore.playSound('hover');
									const val = parseFloat(e.currentTarget.value);
								configuraciones.setTTSSpeed(val);
								
								if (typeof window !== 'undefined') {
									import('$lib/audio/tts.service').then(({ ttsService }) => {
										ttsService.stop();
										ttsService.speak(`Velocidad ${val.toFixed(2)}`, { lang: 'es-ES', rate: val });
										ttsService.changeSpeed(val);
									});
								}
							}}
							aria-label="Velocidad de narración"
							aria-valuemin="0.75"
									aria-valuemax="1.75"
								aria-valuenow={$configuraciones.ttsSpeed || 1}
								aria-valuetext="{($configuraciones.ttsSpeed || 1).toFixed(2)} veces la velocidad normal"
									class="slider"
								/>
								<div class="control-ayuda">
									<small>0.75× - 1× (normal) - 1.5× - 1.75×</small>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</section>

			<!-- Botón de Reset fuera del grid -->
			<div class="boton-reset-contenedor">
				<button class="boton-reset" onclick={() => { configuraciones.reset(); audioStore.reset(); }} use:clickSound>
					Restaurar valores por defecto
				</button>
			</div>
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
		background: var(--bg, white); /* Fondo que cambia con el tema */
	}

	/* Panel principal */
	.panel-ajustes {
		background: var(--bg, white);
		border-radius: var(--border-radius, 8px);
		max-width: 900px;
		width: 100%;
		/* Eliminado max-height y overflow para permitir scroll natural de la página */
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		border: 2px solid var(--icono-color-borde, #000000);
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
		border-bottom: 2px solid var(--icono-color-borde, #000000);
		background: var(--bg, white);
		color: var(--color-texto, #000000);
		border-top-left-radius: var(--border-radius, 8px);
		border-top-right-radius: var(--border-radius, 8px);
	}

	.panel-header h2 {
		margin: 0;
		font-size: calc(var(--font-size-base, 1rem) * 1.5);
		color: var(--color-texto, #000000);
	}

	/* Contenido principal: solo controles */
	.panel-contenido {
		padding: calc(var(--spacing-base, 1rem) * 2);
	}

	.control-item {
		display: flex;
		flex-direction: column;
	}

	/* Grid 2x2 para las secciones principales */
	.controles-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: calc(var(--spacing-base, 1rem) * 1.5);
		margin-bottom: calc(var(--spacing-base, 1rem) * 1.5);
	}

	/* Caja de sección individual */
	.seccion-caja {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-base, 1rem) * 0.75);
		padding: calc(var(--spacing-base, 1rem) * 1);
		background: var(--bg, white);
		border: 2px solid var(--icono-color-borde, #000000);
		border-radius: var(--border-radius, 8px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	/* Responsive para pantallas pequeñas */
	@media (max-width: 768px) {
		.controles-grid {
			grid-template-columns: 1fr;
		}
	}

	.control-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-weight: 600;
		font-size: calc(var(--font-size-base, 1rem) * 0.95);
		color: var(--color-texto, #000000);
	}

	.control-valor {
		font-weight: 700;
		color: var(--color-texto, #333);
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
	}

	.control-ayuda {
		color: var(--color-texto, #666);
		font-size: calc(var(--font-size-base, 1rem) * 0.85);
	}

	/* Slider para controles con rango (como velocidad de narración) */
	.slider {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: var(--icono-color-borde, #000000);
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
		background: var(--fondo-botones, #ffca00);
		cursor: pointer;
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
		transition: background 150ms ease;
		border: 2px solid var(--icono-color-borde, #000000);
	}

	.slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--fondo-botones, #ffca00);
		cursor: pointer;
		border: 2px solid var(--icono-color-borde, #000000);
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
		transition: background 150ms ease;
	}

	.slider:hover::-webkit-slider-thumb {
		background: var(--fondo-botones-hover, #d1a700);
	}

	.slider:hover::-moz-range-thumb {
		background: var(--fondo-botones-hover, #d1a700);
	}

	.slider:focus {
		outline: var(--borde-botones, 4px solid #000000);
		outline-offset: 2px;
	}

	/* Botón de reset */
	.boton-reset-contenedor {
		display: flex;
		justify-content: center;
		margin-top: calc(var(--spacing-base, 1rem) * 1.5);
		padding-top: calc(var(--spacing-base, 1rem) * 1.5);
		border-top: 2px solid var(--icono-color-borde, #000000);
	}

	.boton-reset {
		padding: calc(var(--spacing-base, 1rem) * 0.7) calc(var(--spacing-base, 1rem) * 1.5);
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		border: 2px solid var(--icono-color-borde, #000000);
		border-radius: var(--border-radius, 8px);
		cursor: pointer;
		font-size: calc(var(--font-size-base, 1rem) * 0.9);
		font-weight: 600;
		transition: all 150ms ease;
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
	}

	.boton-reset :global(.bionic-highlight),
	.boton-reset :global(.bionic-word) {
		color: var(--icono-color-relleno, black) !important;
	}

	.boton-reset:hover {
        background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-2px);
	}

	.boton-reset:focus {
		outline: var(--borde-botones, 4px solid #000000);
		outline-offset: 3px;
        transform: translateY(-2px);
	}



	@media (prefers-reduced-motion: reduce) {
		.boton-reset { transition: none; }
	}

	/* Text Button - Botones de texto que cambian de color */
	.text-button {
		display: block;
		width: 100%;
		padding: calc(var(--spacing-base, 1rem) * 0.75);
		margin-bottom: calc(var(--spacing-base, 1rem) * 0.5);
		background: var(--bg, white);
		color: var(--color-texto, #000000);
		border: 2px solid var(--icono-color-borde, #000000);
		border-radius: var(--border-radius, 8px);
		cursor: pointer;
		font-size: calc(var(--font-size-base, 1rem) * 1);
		font-weight: 400;
		text-align: left;
		transition: all 200ms ease;
	}

	.text-button:hover {
		background: var(--fondo-botones, #ffca00);
		border-color: var(--icono-color-borde, #000000);
		color: var(--icono-color-relleno, black);
	}

	.text-button:hover :global(.bionic-highlight),
	.text-button:hover :global(.bionic-word) {
		color: var(--icono-color-relleno, black) !important;
	}

	.text-button.active {
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		border-color: var(--icono-color-borde, #000000);
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
	}

	.text-button.active :global(.bionic-highlight),
	.text-button.active :global(.bionic-word) {
		color: var(--icono-color-relleno, black) !important;
	}

	.text-button.active:hover {
		background: var(--fondo-botones-hover, #d1a700);
	}

	.text-button.active:hover :global(.bionic-highlight),
	.text-button.active:hover :global(.bionic-word) {
		color: var(--icono-color-relleno, black) !important;
	}

	.text-button:focus {
		outline: var(--borde-botones, 4px solid #000000);
		outline-offset: 2px;
	}

	.text-button:focus :global(.bionic-highlight),
	.text-button:focus :global(.bionic-word) {
		color: var(--icono-color-relleno, black) !important;
	}

	/* === TUS ESTILOS NUEVOS (Agregados para tus controles) === */
	.seccion-titulo { margin: 0 0 calc(var(--spacing-base, 1rem) * 0.75) 0; font-size: calc(var(--font-size-base, 1rem) * 1.1); font-weight: 600; color: var(--color-texto, #000000); }
	.control-subgrupo { margin-bottom: calc(var(--spacing-base, 1rem) * 0.75); }
	
	/* Input Select */
	.select-input {
		padding: 0.5rem; border-radius: 4px; border: 2px solid var(--icono-color-borde, #000000);
		width: 100%; font-size: 1rem; background: var(--bg, white); 
		color: var(--color-texto, #000000); margin-top: 0.5rem;
	}
	
	/* Checkboxes */
	.control-row { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem; }
	.checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none; color: var(--color-texto, #000000); }
	
	/* Leyenda de Texturas */
	.texture-legend-container { margin-top: 1rem; padding: 1rem; background: var(--bg, white); border-radius: 8px; border: 2px solid var(--icono-color-borde, #000000); }
	.legend-title { margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600; color: var(--color-texto, #000000); }
	.legend-description { margin: 0 0 0.75rem 0; font-size: 0.85rem; color: var(--color-texto, #666); }
	.texture-legend { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; }
	.legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: var(--color-texto, #000000); font-weight: 500; }
	.swatch { width: 32px; height: 32px; border-radius: 4px; border: 2px solid var(--icono-color-borde, #000000); box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3)); }
	
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
</style>