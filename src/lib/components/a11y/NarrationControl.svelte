<script lang="ts">
	import { configuraciones } from '$lib/stores/settings';
	import { ttsService } from '$lib/audio/tts.service';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';

	let isPlaying = $state(false);
	let isPaused = $state(false);
	let currentSpeed = $state($configuraciones.ttsSpeed || 1);
	let readMode: 'focus' | 'all' = $state('focus'); // 'focus' = leer enfocado, 'all' = leer todo

	// Velocidades accesibles según WCAG
	const speedOptions = [
		{ value: 0.75, label: '0.75x - Muy lento' },
		{ value: 1.0, label: '1x - Normal' },
		{ value: 1.25, label: '1.25x - Rápido' },
		{ value: 1.5, label: '1.5x - Muy rápido' },
		{ value: 1.75, label: '1.75x - Máximo' }
	];

	// Obtener todo el texto visible de la página (solo para modo "Leer Todo")
	function getAllPageText(): string {
		if (!browser) return '';
		
		const mainContent = document.querySelector('main') || document.body;
		const elements = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, button:not(.narration-control *), label, li, a');
		const texts = Array.from(elements)
			.map(el => el.textContent?.trim())
			.filter(Boolean);
		
		return texts.join('. ');
	}

	// Leer elemento enfocado
	function readFocusedElement(element: Element | null) {
		if (!element || !$configuraciones.narrationEnabled || readMode === 'all') return;

		// Ignorar elementos dentro de los controles de narración
		if (element.closest('.narration-control')) return;

		const text = element.textContent?.trim() || element.getAttribute('aria-label') || '';
		
		if (text) {
			isPlaying = true;
			isPaused = false;
			
			ttsService.speak(text, {
				rate: currentSpeed,
				lang: 'es-ES'
			});

			// Escuchar cuando termine para actualizar el estado
			const unsubscribe = ttsService.onEnd(() => {
				isPlaying = false;
				isPaused = false;
				unsubscribe();
			});
		}
	}

	// Manejar eventos de foco (TAB)
	function handleFocus(event: FocusEvent) {
		if ($configuraciones.narrationEnabled && readMode === 'focus') {
			readFocusedElement(event.target as Element);
		}
	}

	// Leer todo el contenido de la página (solo cuando el usuario lo pide)
	function readAll() {
		const text = getAllPageText();
		if (!text) return;

		readMode = 'all';
		isPlaying = true;
		isPaused = false;

		ttsService.speak(text, {
			rate: currentSpeed,
			lang: 'es-ES'
		});

		// Cuando termine, volver al modo enfocado
		const unsubscribe = ttsService.onEnd(() => {
			isPlaying = false;
			isPaused = false;
			readMode = 'focus';
			unsubscribe();
		});
	}

	function pauseNarration() {
		ttsService.pause();
		isPaused = true;
	}

	function resumeNarration() {
		ttsService.resume();
		isPaused = false;
	}

	function stopNarration() {
		ttsService.stop();
		isPlaying = false;
		isPaused = false;
		readMode = 'focus';
	}

	// Cambiar velocidad en tiempo real
	function changeSpeed(newSpeed: number) {
		currentSpeed = newSpeed;
		configuraciones.setTTSSpeed(newSpeed);
		
		// Si está hablando, actualizar velocidad
		if (isPlaying) {
			ttsService.changeSpeed(newSpeed);
		}
	}

	// Registrar listener de foco al montar
	onMount(() => {
		if (browser) {
			document.addEventListener('focusin', handleFocus);
		}
	});

	// Limpiar al desmontar
	onDestroy(() => {
		if (browser) {
			document.removeEventListener('focusin', handleFocus);
		}
		if (isPlaying) {
			ttsService.stop();
		}
	});

	// Detener narración cuando se desactiva el modo
	$effect(() => {
		if (!$configuraciones.narrationEnabled && isPlaying) {
			stopNarration();
		}
	});
</script>

{#if $configuraciones.narrationEnabled}
	<div class="narration-control" role="region" aria-label="Controles de narración">
		<!-- Indicador de modo actual -->
		<div class="mode-indicator" aria-live="polite">
			{#if readMode === 'focus'}
				<span class="mode-badge">📍 Modo: Enfocado</span>
			{:else}
				<span class="mode-badge active">📖 Leyendo todo</span>
			{/if}
		</div>

		<!-- Controles de reproducción -->
		<div class="playback-controls">
			{#if readMode === 'focus'}
				<!-- Botón para leer todo -->
				<button 
					class="control-button read-all"
					onclick={readAll}
					aria-label="Leer todo el contenido de la página"
					title="Leer todo el contenido"
				>
					📖
				</button>
			{:else}
				<!-- Controles cuando está leyendo todo -->
				{#if isPaused}
					<button 
						class="control-button resume"
						onclick={resumeNarration}
						aria-label="Reanudar narración"
						title="Reanudar"
					>
						▶️
					</button>
				{:else}
					<button 
						class="control-button pause"
						onclick={pauseNarration}
						aria-label="Pausar narración"
						title="Pausar"
					>
						⏸️
					</button>
				{/if}

				<button 
					class="control-button stop"
					onclick={stopNarration}
					aria-label="Detener narración y volver al modo enfocado"
					title="Detener"
				>
					⏹️
				</button>
			{/if}
		</div>

		<!-- Control de velocidad -->
		<div class="speed-control">
			<label for="narration-speed" class="speed-label">
				Velocidad: {currentSpeed}x
			</label>
			<select 
				id="narration-speed"
				bind:value={currentSpeed}
				onchange={() => changeSpeed(currentSpeed)}
				aria-label="Seleccionar velocidad de narración"
				class="speed-select"
			>
				{#each speedOptions as option}
					<option value={option.value}>
						{option.label}
					</option>
				{/each}
			</select>
		</div>

		<!-- Ayuda contextual -->
		<div class="help-text" role="status" aria-live="polite">
			{#if readMode === 'focus'}
				<small>💡 Navega con TAB para escuchar cada elemento</small>
			{:else if isPlaying && !isPaused}
				<small>🔊 Leyendo contenido completo...</small>
			{:else if isPaused}
				<small>⏸ Narración en pausa</small>
			{/if}
		</div>
	</div>
{/if}

<style>
	.narration-control {
		position: fixed;
		bottom: calc(var(--spacing-base, 1rem) * 8);
		right: calc(var(--spacing-base, 1rem) * 1.5);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--bg, white);
		border: 2px solid var(--icono-color-borde, #000);
		border-radius: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
		z-index: 1000;
		min-width: 280px;
		max-width: 320px;
	}

	.mode-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: var(--fondo-secundario, #f5f5f5);
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.mode-badge {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.mode-badge.active {
		color: var(--color-primario, #4caf50);
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.playback-controls {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.control-button {
		width: 3rem;
		height: 3rem;
		border: 2px solid var(--icono-color-borde, #000);
		border-radius: 50%;
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.control-button:hover:not(:disabled) {
		transform: scale(1.1);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
	}

	.control-button:active:not(:disabled) {
		transform: scale(0.95);
	}

	.control-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.control-button.stop {
		background: #ff6b6b;
		color: white;
		border-color: #d63031;
	}

	.control-button.read-all {
		background: #4caf50;
		color: white;
		border-color: #388e3c;
	}

	.speed-control {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--fondo-secundario, #f5f5f5);
		border-radius: 8px;
	}

	.speed-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--texto-principal, #000);
		text-align: center;
	}

	.speed-select {
		padding: 0.5rem;
		border: 2px solid var(--icono-color-borde, #000);
		border-radius: 6px;
		background: var(--bg, white);
		color: var(--texto-principal, #000);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.speed-select:hover {
		border-color: var(--color-primario, #4caf50);
	}

	.speed-select:focus {
		outline: 2px solid var(--color-primario, #4caf50);
		outline-offset: 2px;
	}

	.help-text {
		padding: 0.5rem;
		text-align: center;
		font-size: 0.75rem;
		color: var(--texto-secundario, #666);
		background: var(--fondo-terciario, #fafafa);
		border-radius: 6px;
		line-height: 1.4;
	}

	.help-text small {
		display: block;
	}

	/* Modo alto contraste */
	@media (prefers-contrast: high) {
		.narration-control {
			border-width: 3px;
		}

		.control-button {
			border-width: 3px;
		}
	}

	/* Modo reducción de movimiento */
	@media (prefers-reduced-motion: reduce) {
		.control-button {
			transition: none;
		}

		.mode-badge.active {
			animation: none;
		}
	}
</style>
