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
	let isAutoFocusing = $state(false); // Bandera para indicar que el focus es automático de la narración
	let isWaitingToStartAutoNarration = $state(false); // Bandera para evitar lecturas mientras se prepara el inicio automático

	// Suscripción temporal al evento de fin de narración para acciones (p.ej. avanzar índice)
	let currentEndUnsubscribe: (() => void) | null = null;

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
		
		// Buscar primero en modales activos (tienen mayor prioridad)
		const modal = document.querySelector('.modal[role="dialog"]');
		const mainContent = modal || document.querySelector('main');
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
			// Solo excluir si el elemento mismo tiene aria-hidden, no sus ancestros
			if (element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'true') return;
			
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

		// Ignorar etiquetas de narración
		if (element.classList.contains('narration-label')) return;

		// Si la narración automática está activa, NO leer elementos enfocados
		// porque el focus es parte del proceso automático
		if (isPlaying && !isPaused) return;
		
		// Si estamos esperando para iniciar la narración automática, ignorar
		if (isWaitingToStartAutoNarration) return;

// Obtener texto accesible: primero data-narration-text, luego span.solo-lectores, luego aria-label, finalmente textContent
	let text = '';
	const narrationText = (element as HTMLElement).getAttribute('data-narration-text');
	if (narrationText) {
		text = narrationText.trim();
	} else {
		const soloLectoresSpan = (element as HTMLElement).querySelector('.solo-lectores');
		if (soloLectoresSpan) {
			text = soloLectoresSpan.textContent?.trim() || '';
		} else {
			text = element.getAttribute('aria-label') || element.textContent?.trim() || '';
		}
		}
		
		if (text && browser && ttsService.isSupported()) {
			// Verificar si el elemento es un botón de control ANTES de cualquier otra lógica
			const isControlButton = (element as HTMLElement).closest('.narration-control') !== null;
			
			// Si es un botón de control, solo leerlo sin alterar el estado de la narración
			if (isControlButton) {
				ttsService.speak(text, { lang: 'es-ES', rate: currentSpeed });
				return; // Salir sin modificar índices ni estados
			}
			
			// Siempre detener cualquier narración anterior (automática o manual)
			ttsService.stop();
			
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
			
			// Pequeño delay después de detener para asegurar que el motor de síntesis esté listo
			setTimeout(() => {
				// Limpiar handler anterior
				if (currentEndUnsubscribe) { currentEndUnsubscribe(); currentEndUnsubscribe = null; }
				
				if (isPlaying && isPaused && wasPlayingBeforeFocus) {
					ttsService.speakAsync(text, { lang: 'es-ES', rate: currentSpeed })
						.then(() => {
							// Avanzar al siguiente elemento para cuando se reanude
							currentElementIndex++;
						})
						.catch(() => {
							// Cancelado o error - no modificar índice
						});
				} else {
					// Lectura normal (no es reanudación) — usar speak para mantener comportamiento anterior
					ttsService.speak(text, { lang: 'es-ES', rate: currentSpeed });
				}
			}, 10);
		}
	}

	// Manejar eventos de foco (TAB)
	function handleFocus(event: FocusEvent) {
		if (!$configuraciones.narrationEnabled) return;
		
		// Ignorar si el focus es automático de la narración
		if (isAutoFocusing) return;
		
		const target = event.target as Element;
		
		// Si hay narración automática en curso
		if (isPlaying && !isPaused) {
			// Buscar el elemento enfocado en la lista
			const focusedIndex = readableElements.findIndex(el => el === target);
			
			if (focusedIndex !== -1) {
				// El usuario hizo Tab a un elemento de la lista
				// Detener la narración actual y actualizar el índice
				ttsService.stop();
				currentElementIndex = focusedIndex;
				// Continuar desde el nuevo elemento
				readCurrentElement();
				return;
			} else {
				// Focus fuera de los elementos narrables, pausar
				ttsService.stop();
				isPaused = true;
				wasPlayingBeforeFocus = true;
			}
		}
		
		readFocusedElement(target);
	}

	// Manejar eventos de clic
	function handleClick(event: MouseEvent) {
		if (!$configuraciones.narrationEnabled) return;
		
		// Ignorar clics en los controles de narración
		const target = event.target as Element;
		if (target.closest('.narration-control')) return;
		
		// Si hay una narración automática en curso, detenerla
		if (isPlaying && !isPaused) {
			ttsService.stop();
			isPaused = true;
			wasPlayingBeforeFocus = true;
		}
		
		// Leer el elemento clickeado (el focus ya se encarga de esto)
		// Solo aseguramos que la narración automática se detenga
	}

	// Obtener todos los elementos legibles de la página
	function getAllReadableElements(): HTMLElement[] {
		if (!browser) return [];
		
		// Buscar primero en modales activos (tienen mayor prioridad)
		const modal = document.querySelector('.modal[role="dialog"]');
		const mainContent = modal || document.querySelector('main');
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
			// Solo excluir si el elemento mismo tiene aria-hidden, no sus ancestros
			if (element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'true') return;
			
			const rect = element.getBoundingClientRect();
			const style = window.getComputedStyle(element);
			
			const isVisible = 
				style.display !== 'none' &&
				style.visibility !== 'hidden' &&
				style.opacity !== '0' &&
				rect.width > 0 &&
				rect.height > 0;
			
			if (isVisible) {
			const narrationText = element.getAttribute('data-narration-text');
			const soloLectoresSpan = element.querySelector('.solo-lectores');
			const text = narrationText?.trim() || soloLectoresSpan?.textContent?.trim() || element.textContent?.trim() || '';
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

		// Limpiar outline de TODOS los elementos anteriores
		readableElements.forEach((el, index) => {
			if (index !== currentElementIndex && el.style.outline) {
				el.style.outline = '';
			}
		});

		// Activar bandera para evitar que handleFocus interfiera
		isAutoFocusing = true;

		// Poner outline en el elemento actual (SIEMPRE, sin importar el tipo)
		element.style.outline = '2px solid var(--color-enfoque, #0066cc)';

		// Hacer focus en el elemento (sincronizar con el focus del navegador)
		if (element.hasAttribute('tabindex') || element.tagName === 'BUTTON' || element.tagName === 'A') {
			element.focus({ preventScroll: true });
		} else {
			element.setAttribute('tabindex', '-1');
			element.focus({ preventScroll: true });
		}

		// Desactivar bandera después de un pequeño delay
		setTimeout(() => {
			isAutoFocusing = false;
		}, 50);

// Obtener texto a leer: primero data-narration-text, luego solo-lectores, finalmente textContent
	const narrationText = element.getAttribute('data-narration-text');
	const soloLectoresSpan = element.querySelector('.solo-lectores');
	const text = narrationText?.trim() || soloLectoresSpan?.textContent?.trim() || element.textContent?.trim() || '';

		if (text && ttsService.isSupported()) {
			// Limpiar handler anterior
			if (currentEndUnsubscribe) { currentEndUnsubscribe(); currentEndUnsubscribe = null; }
			
			// Usar speakAsync para encadenar lecturas de forma fiable
			ttsService.speakAsync(text, { lang: 'es-ES', rate: currentSpeed })
				.then(() => {
					// Solo avanzar si NO está pausado
					if (!isPaused) {
						currentElementIndex++;
						if (isPlaying && currentElementIndex < readableElements.length) {
							readCurrentElement();
						} else {
							stopNarration();
						}
					}
				})
				.catch((e) => {
					// Cancelación o error: no continuar
					// console.debug('tts speakAsync rejected', e);
				});
		} else {
			// Si no hay texto, pasar al siguiente
			currentElementIndex++;
			readCurrentElement();
		}
	}

	// Leer todo el contenido de la página (narración automática)
	function readAll() {		// Desactivar bandera de espera
		isWaitingToStartAutoNarration = false;
				if (browser && ttsService.isSupported()) {
			ttsService.stop();
		}
		
		readableElements = getAllReadableElements();
		if (readableElements.length === 0) return;

		// Limpiar TODOS los outlines del DOM (no solo de la lista)
		// Esto asegura que no queden outlines residuales de narraciones anteriores
		if (browser) {
			document.querySelectorAll('[style*="outline"]').forEach((el) => {
				(el as HTMLElement).style.outline = '';
			});
		}

		currentElementIndex = 0;
		isPlaying = true;
		isPaused = false;
		wasPlayingBeforeFocus = false;

		// Delay de 200ms antes de iniciar la narración para evitar leer el botón
		setTimeout(() => {
			readCurrentElement();
		}, 500);
	}

	function pauseNarration() {
		if (!isPlaying || isPaused) return;
		
		// Pausar el TTS y marcar como pausado
		if (browser && ttsService.isSupported()) {
			ttsService.stop(); // Detener el audio actual
			isPaused = true;
		}
		
		// Limpiar outline del elemento actual cuando se pausa
		if (browser && currentElementIndex < readableElements.length) {
			const currentElement = readableElements[currentElementIndex];
			if (currentElement && currentElement.style.outline) {
				currentElement.style.outline = '';
			}
		}
	}

	function resumeNarration() {
		if (!isPlaying || !isPaused) return;
		
		// Detener cualquier audio actual (por ejemplo, la lectura del botón "Reanudar")
		if (browser && ttsService.isSupported()) {
			ttsService.stop();
		}
		
		// Marcar como activo ANTES de llamar a readCurrentElement
		isPaused = false;
		wasPlayingBeforeFocus = false;
		
		// Continuar desde donde se pausó (NO reiniciar desde el principio)
		if (browser && ttsService.isSupported()) {
			// Delay para asegurar que el TTS se detuvo completamente
			setTimeout(() => {
				readCurrentElement();
			}, 100);
		}
	}

	function stopNarration() {
		if (browser && ttsService.isSupported()) {
			ttsService.stop();
		}
		
		// Limpiar todos los outlines de todos los elementos legibles
		if (browser && readableElements.length > 0) {
			readableElements.forEach(element => {
				if (element && element.style.outline) {
					element.style.outline = '';
				}
			});
		}
		
		isPlaying = false;
		isPaused = false;
		wasPlayingBeforeFocus = false;
		currentElementIndex = 0; // Reiniciar índice para que al volver a iniciar comience desde el principio
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
			document.addEventListener('click', handleClick, true); // true para capturar antes que otros eventos
			
			// Listener para iniciar lectura cuando se abre un modal
			const handleReadModal = () => {
				if ($configuraciones.narrationEnabled) {
					// Detener cualquier narración actual
					if (isPlaying || isPaused) {
						stopNarration();
					}
					// Iniciar lectura del modal
					setTimeout(() => {
						readAll();
					}, 100);
				}
			};
			
			window.addEventListener('read-modal', handleReadModal);
			
			return () => {
				window.removeEventListener('read-modal', handleReadModal);
				document.removeEventListener('click', handleClick, true);
			};
		}
	});

	// Limpiar al desmontar
	onDestroy(() => {
		if (browser) {
			document.removeEventListener('focusin', handleFocus);
			document.removeEventListener('click', handleClick, true);
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
		} else if ($configuraciones.narrationEnabled && previousNarrationState) {
			// Si el modo ya estaba activo pero está pausado, limpiar el estado de pausa
			if (isPaused && !isPlaying) {
				isPaused = false;
				wasPlayingBeforeFocus = false;
			}
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
			// Activar bandera para evitar lecturas mientras se prepara el inicio
			isWaitingToStartAutoNarration = true;
			// Iniciar narración automáticamente después de un delay
			setTimeout(() => {
				if ($configuraciones.narrationEnabled && !isPlaying) {
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
			<div>Narración</div>
			<div>automática</div>
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
		top: 50%;
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
		color: var(--color-texto, #000);
		padding: 0 0.5rem;
		text-align: center;
		line-height: 1.2;
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
