<script lang="ts">
	import { configuraciones } from '$lib/stores/settings';
	import { ttsService } from '$lib/audio/tts.service';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	let isPlaying = $state(false);
	let isPaused = $state(false);
	let currentSpeed = $state($configuraciones.ttsSpeed || 1);
	let wasPlayingBeforeFocus = $state(false); // Guarda si estaba reproduciendo antes de enfocar
	let previousNarrationState = $state(false); // Rastrear el estado anterior del modo narración
	let currentPath = $state($page.url.pathname); // Rastrear la ruta actual
	let readableElements: HTMLElement[] = $state([]); // Lista de elementos a leer
	let currentElementIndex = $state(0); // Índice del elemento actual
	let isAutoFocusing = $state(false); // Bandera para indicar que el focus es automático

	// Sincronizar currentSpeed con las configuraciones
	$effect(() => {
		currentSpeed = $configuraciones.ttsSpeed || 1;
	});

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
		
		// Buscar el contenido principal de la página actual
		const mainContent = document.querySelector('main');
		if (!mainContent) return '';
		
		// Solo elementos de texto visibles de nivel superior (sin incluir elementos anidados)
		const selector = 'h1, h2, h3, h4, h5, h6, p, button, label, a';
		const elements = mainContent.querySelectorAll(selector);
		
		const texts: string[] = [];
		const seenTexts = new Set<string>(); // Para evitar duplicados
		const processedElements = new Set<Element>(); // Para evitar elementos anidados
		
		elements.forEach(el => {
			const element = el as HTMLElement;
			
			// Ignorar si ya procesamos este elemento o uno de sus padres
			if (processedElements.has(element)) return;
			
			// Ignorar controles de narración y elementos ocultos
			if (element.closest('.narration-control')) return;
			if (element.closest('.contenedor-flotante-i')) return;
			if (element.closest('.contenedor-flotante-d')) return;
			if (element.closest('[aria-hidden="true"]')) return;
			
			// Verificar que el elemento esté realmente visible en la pantalla
			const rect = element.getBoundingClientRect();
			const style = window.getComputedStyle(element);
			
			const isVisible = 
				style.display !== 'none' &&
				style.visibility !== 'hidden' &&
				style.opacity !== '0' &&
				rect.width > 0 &&
				rect.height > 0;
			
			if (isVisible) {
				// Obtener solo el texto directo del elemento (no el de sus hijos)
				let text = '';
				element.childNodes.forEach(node => {
					if (node.nodeType === Node.TEXT_NODE) {
						text += node.textContent?.trim() + ' ';
					}
				});
				
				// Si no hay texto directo, usar el textContent completo (para elementos sin hijos)
				if (!text.trim() && element.children.length === 0) {
					text = element.textContent?.trim() || '';
				}
				
				text = text.trim();
				
				if (text && !seenTexts.has(text)) {
					seenTexts.add(text);
					texts.push(text);
					processedElements.add(element);
					
					// Marcar hijos como procesados para evitar duplicados
					element.querySelectorAll(selector).forEach(child => {
						processedElements.add(child);
					});
				}
			}
		});
		
		return texts.join('. ');
	}

	// Leer elemento enfocado
	function readFocusedElement(element: Element | null) {
		if (!element || !$configuraciones.narrationEnabled) return;

		// Ignorar solo la etiqueta de narración, pero permitir los botones
		if (element.classList.contains('narration-label')) return;

		// Obtener texto accesible: primero buscar span.solo-lectores, luego aria-label, finalmente textContent
		let text = '';
		const soloLectoresSpan = (element as HTMLElement).querySelector('.solo-lectores');
		if (soloLectoresSpan) {
			text = soloLectoresSpan.textContent?.trim() || '';
		} else {
			text = element.getAttribute('aria-label') || element.textContent?.trim() || '';
		}
		
		if (text && browser && window.speechSynthesis) {
			// SIEMPRE cancelar cualquier narración anterior (automática o manual)
			window.speechSynthesis.cancel();
			
			// Si estaba reproduciendo la narración automática, pausarla
			if (isPlaying && !isPaused) {
				isPaused = true;
				wasPlayingBeforeFocus = true;
				
				// Buscar el elemento enfocado en la lista y actualizar el índice
				const focusedIndex = readableElements.findIndex(el => el === element);
				if (focusedIndex !== -1) {
					currentElementIndex = focusedIndex;
				}
			}
			
			// Leer el elemento enfocado inmediatamente
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.lang = 'es-ES';
			utterance.rate = currentSpeed;
			
			if (isPlaying && isPaused && wasPlayingBeforeFocus) {
				utterance.onend = () => {
					// Avanzar al siguiente elemento para cuando se reanude
					currentElementIndex++;
				};
			}
			
			window.speechSynthesis.speak(utterance);
		}
	}

	// Manejar eventos de foco (TAB)
	function handleFocus(event: FocusEvent) {
		if ($configuraciones.narrationEnabled && !isAutoFocusing) {
			readFocusedElement(event.target as Element);
		}
	}

	// Obtener todos los elementos legibles de la página
	function getAllReadableElements(): HTMLElement[] {
		if (!browser) return [];
		
		const mainContent = document.querySelector('main');
		if (!mainContent) return [];
		
		const selector = 'h1, h2, h3, h4, h5, h6, p, button, label';
		const elements = mainContent.querySelectorAll(selector);
		
		const readableElements: HTMLElement[] = [];
		const processedElements = new Set<Element>();
		
		elements.forEach(el => {
			const element = el as HTMLElement;
			
			if (processedElements.has(element)) return;
			if (element.closest('.narration-control')) return;
			if (element.closest('.contenedor-flotante-i')) return;
			if (element.closest('.contenedor-flotante-d')) return;
			if (element.closest('[aria-hidden="true"]')) return;
			
			const rect = element.getBoundingClientRect();
			const style = window.getComputedStyle(element);
			
			const isVisible = 
				style.display !== 'none' &&
				style.visibility !== 'hidden' &&
				style.opacity !== '0' &&
				rect.width > 0 &&
				rect.height > 0;
			
			if (isVisible) {
				const soloLectoresSpan = element.querySelector('.solo-lectores');
				const text = soloLectoresSpan?.textContent?.trim() || element.textContent?.trim() || '';
				
				if (text) {
					readableElements.push(element);
					processedElements.add(element);
					element.querySelectorAll(selector).forEach(child => {
						processedElements.add(child);
					});
				}
			}
		});
		
		return readableElements;
	}

	// Leer el elemento en el índice actual
	function readCurrentElement() {
		if (!browser || currentElementIndex >= readableElements.length) {
			stopNarration();
			return;
		}

		const element = readableElements[currentElementIndex];
		if (!element) {
			stopNarration();
			return;
		}

		// Activar bandera de focus automático
		isAutoFocusing = true;

		// Hacer focus en el elemento
		if (element.hasAttribute('tabindex') || element.tagName === 'BUTTON' || element.tagName === 'A') {
			element.focus();
		} else {
			element.setAttribute('tabindex', '-1');
			element.focus();
			element.style.outline = '2px solid var(--color-enfoque, #0066cc)';
		}

		// Desactivar bandera después de un pequeño delay
		setTimeout(() => {
			isAutoFocusing = false;
		}, 50);

		// Obtener texto a leer
		const soloLectoresSpan = element.querySelector('.solo-lectores');
		const text = soloLectoresSpan?.textContent?.trim() || element.textContent?.trim() || '';

		if (text && window.speechSynthesis) {
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.lang = 'es-ES';
			utterance.rate = currentSpeed;
			
			utterance.onend = () => {
				// Quitar outline si lo agregamos
				if (element.style.outline) {
					element.style.outline = '';
				}
				
				// Solo avanzar si NO está pausado
				if (!isPaused) {
					// Pasar al siguiente elemento
					currentElementIndex++;
					if (isPlaying && currentElementIndex < readableElements.length) {
						readCurrentElement();
					} else {
						stopNarration();
					}
				}
			};
			
			utterance.onerror = () => {
				stopNarration();
			};
			
			window.speechSynthesis.speak(utterance);
		} else {
			// Si no hay texto, pasar al siguiente
			currentElementIndex++;
			readCurrentElement();
		}
	}

	// Leer todo el contenido de la página (narración automática)
	function readAll() {
		if (browser && window.speechSynthesis) {
			window.speechSynthesis.cancel();
		}
		
		readableElements = getAllReadableElements();
		if (readableElements.length === 0) return;

		currentElementIndex = 0;
		isPlaying = true;
		isPaused = false;
		wasPlayingBeforeFocus = false;

		readCurrentElement();
	}

	function pauseNarration() {
		// Pausar el audio usando la API de speechSynthesis
		if (browser && window.speechSynthesis && window.speechSynthesis.speaking) {
			window.speechSynthesis.pause();
			isPaused = true;
		}
	}

	function resumeNarration() {
		if (!isPlaying) return;
		
		isPaused = false;
		wasPlayingBeforeFocus = false;
		
		// Limpiar el outline del elemento actual antes de reiniciar
		if (browser && currentElementIndex < readableElements.length) {
			const currentElement = readableElements[currentElementIndex];
			if (currentElement && currentElement.style.outline) {
				currentElement.style.outline = '';
			}
		}
		
		// Reiniciar desde el primer elemento
		currentElementIndex = 0;
		
		// Cancelar cualquier audio anterior y comenzar desde el principio
		if (browser && window.speechSynthesis) {
			window.speechSynthesis.cancel();
			readCurrentElement();
		}
	}

	function stopNarration() {
		if (browser && window.speechSynthesis) {
			window.speechSynthesis.cancel();
		}
		isPlaying = false;
		isPaused = false;
		wasPlayingBeforeFocus = false;
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
		// Siempre detener al desmontar
		ttsService.stop();
		isPlaying = false;
		isPaused = false;
	});

	// Detener narración cuando se desactiva el modo
	$effect(() => {
		if (!$configuraciones.narrationEnabled) {
			if (isPlaying || isPaused) {
				stopNarration();
			}
			previousNarrationState = false;
		}
	});

	// Manejar inicio automático: cuando se activa el modo O cuando cambia de ruta con modo activo
	$effect(() => {
		const newPath = $page.url.pathname;
		const routeChanged = browser && newPath !== currentPath;
		const modeActivated = browser && $configuraciones.narrationEnabled && !previousNarrationState;
		
		// Si cambió la ruta, actualizar
		if (routeChanged) {
			currentPath = newPath;
			// Detener narración actual si existe
			if (isPlaying || isPaused) {
				stopNarration();
			}
			previousNarrationState = false;
		}
		
		// Si el modo está activo Y (cambió la ruta O se acaba de activar el modo)
		if (browser && $configuraciones.narrationEnabled && (routeChanged || modeActivated)) {
			previousNarrationState = true;
			// Un solo setTimeout para evitar duplicaciones
			setTimeout(() => {
				if ($configuraciones.narrationEnabled && !isPlaying && !isPaused) {
					readAll();
				}
			}, 600);
		}
	});
</script>

{#if $configuraciones.narrationEnabled}
	<div class="narration-control" role="region" aria-label="Controles de narración">
		<!-- Etiqueta descriptiva -->
		<div class="narration-label">
			Narración automática
		</div>
		
		<!-- Botón Reproducir/Pausar -->
		{#if !isPlaying}
			<button 
				class="control-button play"
				onclick={readAll}
				title="Reproducir narración"
			>
				<span class="solo-lectores">Iniciar narración</span>
				<span aria-hidden="true">▶️</span>
			</button>
		{:else if isPaused}
			<button 
				class="control-button resume"
				onclick={resumeNarration}
				title="Reanudar"
			>
				<span class="solo-lectores">Reanudar narración</span>
				<span aria-hidden="true">▶️</span>
			</button>
		{:else}
			<button 
				class="control-button pause"
				onclick={pauseNarration}
				title="Pausar"
			>
				<span class="solo-lectores">Pausar narración</span>
				<span aria-hidden="true">⏸️</span>
			</button>
		{/if}

		<!-- Botón Detener -->
		<button 
			class="control-button stop"
			onclick={stopNarration}
			title="Detener"
			disabled={!isPlaying}
		>
			<span class="solo-lectores">Detener narración</span>
			<span aria-hidden="true">⏹️</span>
		</button>
	</div>
{/if}

<style>
	.narration-control {
		position: fixed;
		bottom: calc(var(--spacing-base, 1rem) * 8);
		right: calc(var(--spacing-base, 1rem) * 1.5);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--bg, white);
		border: 2px solid var(--icono-color-borde, #000);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 1000;
	}

	.narration-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--texto-principal, #000);
		padding: 0 0.5rem;
		white-space: nowrap;
	}

	.control-button {
		width: 3rem;
		height: 3rem;
		border: none;
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

	:global(.sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	/* Modo reducción de movimiento */
	@media (prefers-reduced-motion: reduce) {
		.control-button {
			transition: none;
		}
	}
</style>
