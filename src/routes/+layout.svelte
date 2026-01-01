<script lang="ts">
	import logoColoreco from '$lib/assets/Logo_coloreco.png';
	import { configuraciones } from '$lib/stores/settings';
	import { audioStore, clickSound } from '$lib/stores/audio';
	import { interpolateMatrix } from '$lib/constants/colorMatrices';
	import EfectoLupa from '$lib/components/a11y/EfectoLupa.svelte';
	import NarrationControl from '$lib/components/a11y/NarrationControl.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { obtenerSesionActual } from '$lib/db/artistas.service';
	import { inicializarCatalogoLogros } from '$lib/db/logros.service';
	import '../lib/styles/themes.css';
	import IconoVolver from '$lib/components/iconos/IconoVolver.svelte';
	import IconoAccesibilidad from '$lib/components/iconos/Accesibilidad.svelte';
	import FondoManchas from '$lib/components/fondos/FondoManchas.svelte';
	import FondoLogrosGeneral from '$lib/components/fondos/FondoLogrosGeneral.svelte';
	import FondoCuerpoHumano from '$lib/components/fondos/FondoCuerpoHumano.svelte';

	// Pequeño helper de accesibilidad: enfocar el contenido principal al navegar
	let mainEl: HTMLElement | null = null;

	// Props para recibir el contenido de las páginas hijas
	let { children } = $props();

	// Control de procesamiento de accesibilidad
	let isProcessing = false;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// 1. Matriz de color reactiva
	let matrixValues = $derived(interpolateMatrix($configuraciones.colorBlindness, $configuraciones.intensity));

	// 2. String del filtro CSS (Reutilizable para contenido y botones)
	let filterStyle = $derived(`
		filter: ${$configuraciones.colorBlindness !== 'none' ? 'url(#cvd-filter)' : ''} 
		        ${$configuraciones.contrast === 'high' ? 'url(#smart-contrast-filter)' : ''};
	`);

	// 3. Clases globales (Texturas y Contraste) - Se aplican al Shell para que afecten a todo
	let shellClasses = $derived([
		'app-layout',
		$configuraciones.textures ? 'enable-textures' : '',
		$configuraciones.contrast === 'high' ? 'enable-high-contrast' : ''
	].filter(Boolean).join(' '));

	let modoActual = $derived(
		$configuraciones.modoNoche 
			? ($configuraciones.modoInverso ? 'dark-inverted' : 'dark')
			: ''
	);

	// Detectar si estamos en la página de ajustes o en la página inicial
	let estaEnConfiguracion = $derived($page.url.pathname === '/ajustes');
	let estaEnInicio = $derived($page.url.pathname === '/');
	let estaEnEstudio = $derived($page.url.pathname.startsWith('/estudio'));

	//DETECTAR SI SE NECESITA EL FONDO DE MANCHAS
	let necesitaFondoManchas = $derived($page.url.pathname === '/' 
	|| $page.url.pathname === '/seleccionar-estudio' 
	|| $page.url.pathname.startsWith('/galeria')
	|| $page.url.pathname.startsWith('/menu-juegos')
	|| $page.url.pathname.startsWith('/taller-escenas')
	);

	//DETECTAR SI SE NECESITA EL FONDO DE LOGROS GENERAL
	let necesitaFondoLogrosGeneral = $derived($page.url.pathname===('/logros'));

	//DETECTAR SI SE NECESITA EL FONDO DE CUERPO HUMANO
	let necesitaFondoCuerpoHumano = $derived(
		$page.url.pathname === '/cuerpo-plantillas' ||
		$page.url.pathname === '/logros/cuerpo-humano' ||
		($page.url.pathname.includes('/juegos/cuerpo-humano') && $page.url.pathname.endsWith('/completada'))
	);

	// Funciones de navegación
	function abrirConfiguracion() {
		if (estaEnConfiguracion) return;
		goto('/ajustes');
	}
	function volver() {
		if (estaEnInicio) return;
		if (window.history.length > 1) {
			window.history.back();
		} else {
			goto('/');
		}
	}
	function manejarTecla(event: KeyboardEvent) {
		// No capturar ESC si hay un modal abierto
		if (event.key === 'Escape') {
			const modalAbierto = document.querySelector('[aria-modal="true"]');
			if (!modalAbierto) {
				volver();
			}
			return;
		}
		if ((event.key === 'a' || event.key === 'A') && event.ctrlKey) {
			event.preventDefault();
			abrirConfiguracion();
		}
	}

	// Efecto para aplicar el atributo data-theme al body
	$effect(() => {
		if (modoActual) {
			document.body.setAttribute('data-theme', modoActual);
		} else {
			document.body.removeAttribute('data-theme');
		}
	});

	// Efecto para reproducir música según la pantalla actual
	$effect(() => {
		if (!browser) return;
		
		const path = $page.url.pathname;
		
		// Determinar qué música reproducir según la ruta
		if (path === '/' || path === '/seleccionar-estudio') {
			audioStore.playMusic('menu');
		} else if (path.startsWith('/estudio')) {
			audioStore.playMusic('estudio');
		} else if (path.startsWith('/galeria')) {
			audioStore.playMusic('galeria');
		} else if (path === '/ajustes') {
			// En ajustes mantener la música actual
		} else {
			audioStore.playMusic('default');
		}
	});

	// Guardia de rutas: si no hay artista activo solo permitir rutas públicas
	onMount(async () => {
		if (!browser) return;
		try {
			// Inicializar catálogo de logros al cargar la aplicación
			await inicializarCatalogoLogros();
			
			const sesion = await obtenerSesionActual();
			const artistaId = sesion?.artistaActualId ?? null;
			const path = $page.url.pathname;
			const permisosSinArtista = ['/', '/ajustes', '/seleccionar-estudio'];
			const permitido = permisosSinArtista.some(p => path === p || path.startsWith(p + '/'));
			if (!artistaId && !permitido) {
				// redirigir a página de inicio
				goto('/');
			}
		} catch (e) {
			console.error('[Layout] Error verificando sesión:', e);
		}
	});

	// Listener para procesar modales cuando se montan y para reaplicar cuando el contenido cambia
	onMount(() => {
		if (!browser) return;
		
		const handleModalMounted = () => {
			setTimeout(() => {
				if ($configuraciones.bionicMode || $configuraciones.rhymeMode) {
					applyAccessibilityModes();
				}
			}, 100);
		};

		const handleContentUpdated = (e: Event) => {
			const detail = (e as CustomEvent)?.detail || {};
			// Pequeña espera para que Svelte remonte el DOM
			setTimeout(() => {
				if ($configuraciones.bionicMode || $configuraciones.rhymeMode) {
					applyAccessibilityModes();
				}
			}, 80);

			// Programar una segunda reaplicación tras la animación si se especifica, o usar un fallback
			const animationDuration = typeof detail.animationDuration === 'number' ? detail.animationDuration : 500;
			setTimeout(() => {
				if ($configuraciones.bionicMode || $configuraciones.rhymeMode) {
					applyAccessibilityModes();
				}
			}, animationDuration + 60);
		};
		
		window.addEventListener('modal-mounted', handleModalMounted);
		window.addEventListener('content-updated', handleContentUpdated as EventListener);
		
		return () => {
			window.removeEventListener('modal-mounted', handleModalMounted);
			window.removeEventListener('content-updated', handleContentUpdated as EventListener);
		};
	});

	// Efecto para aplicar atributos data según modos activos
	$effect(() => {
		const root = document.documentElement;
		
		// Modo biónico
		if ($configuraciones.bionicMode) {
			root.setAttribute('data-bionic', 'true');
		} else {
			root.removeAttribute('data-bionic');
		}
		
		// Modo rima
		if ($configuraciones.rhymeMode) {
			root.setAttribute('data-rhyme', 'true');
		} else {
			root.removeAttribute('data-rhyme');
		}
		
		// Modo pictograma
		if ($configuraciones.pictogramMode) {
			root.setAttribute('data-pictogram', 'true');
		} else {
			root.removeAttribute('data-pictogram');
		}
		
		// Modo narración
		if ($configuraciones.narrationEnabled) {
			root.setAttribute('data-narration', 'true');
		} else {
			root.removeAttribute('data-narration');
		}

		// Aplicar efectos combinados
		setTimeout(() => applyAccessibilityModes(), 100);
	});

	// Mapa para observers que limpian data-original-html si el DOM cambia
	const originalObservers = new WeakMap<Element, MutationObserver>();

	// Cache de patrones de rimas para mantener colores consistentes
	let cachedRhymePatterns: any[] = [];
	let cachedMainContent = '';

/**
 * Calcula cuántos caracteres resaltar según la longitud de la palabra
 * Reglas:
 * - 1-3 letras: resaltar la primera letra
 * - 4 letras: resaltar 2 letras
 * - 5-6 letras: resaltar 3 letras
 * - 7+ letras: resaltar aproximadamente 40% - 50% (usa intensidad y clampa entre 0.4 y 0.5)
 */
function getHighlightLengthForWord(wordLength: number, intensity: number = 0.5): number {
	if (wordLength <= 3) return 1;
	if (wordLength === 4) return 2;
	if (wordLength === 5 || wordLength === 6) return 3;
	const minPct = 0.4;
	const maxPct = 0.5;
	const pct = Math.max(minPct, Math.min(intensity, maxPct));
	return Math.min(wordLength - 1, Math.max(1, Math.ceil(wordLength * pct)));
}

/**
 * Devuelve las dos partes (highlight/rest) de una palabra según las reglas
 */
function splitWordIntoBionicParts(word: string, intensity: number = 0.5): { highlighted: string; rest: string } {
	const hl = getHighlightLengthForWord(word.length, intensity);
	return { highlighted: word.slice(0, hl), rest: word.slice(hl) };
}

/**
 * Detecta si el fondo del elemento es claro u oscuro y retorna el color apropiado
 * @param element Elemento DOM a analizar
 * @returns Color hexadecimal apropiado para resaltado biónico
 */
function getBionicColorForBackground(element: Element): string {
	const computed = window.getComputedStyle(element);
	let bgColor = computed.backgroundColor;
	
	// Si es transparente, buscar en ancestros
	let current = element.parentElement;
	while ((!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') && current) {
		bgColor = window.getComputedStyle(current).backgroundColor;
		current = current.parentElement;
	}
	
	// Convertir RGB a luminancia
	const rgb = bgColor.match(/\d+/g);
	if (!rgb || rgb.length < 3) {
		// Fallback: usar modo noche si está activo
		return $configuraciones.modoNoche ? '#90CAF9' : '#003366';
	}
	
	const r = parseInt(rgb[0]);
	const g = parseInt(rgb[1]);
	const b = parseInt(rgb[2]);
	
	// Calcular luminancia relativa (fórmula WCAG)
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	
	// Si luminancia > 0.5 (fondo claro), usar azul oscuro; sino azul claro
	return luminance > 0.5 ? '#003366' : '#90CAF9';
}

// Funciones auxiliares para procesamiento de colores en rimas
function hexToRgbSimple(hex: string): [number, number, number] | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? [
		parseInt(result[1], 16),
		parseInt(result[2], 16),
		parseInt(result[3], 16)
	] : null;
}

function darkenColorSimple(hex: string, amount: number): string {
	const rgb = hexToRgbSimple(hex);
	if (!rgb) return hex;
	
	const [r, g, b] = rgb.map(v => Math.max(0, Math.floor(v * (1 - amount))));
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

	$effect(() => {
		// Escuchar cambios en la ruta
		const currentPath = $page.url.pathname;
		
		// Reaplicar modos después de que el DOM se actualice
		setTimeout(() => {
			if ($configuraciones.bionicMode || $configuraciones.rhymeMode) {
				applyAccessibilityModes();
			}
		}, 200);
	});

	// Escuchar cambios en los modos de accesibilidad con debounce
	$effect(() => {
		// Observar cambios en bionicMode y rhymeMode
		const bionicActive = $configuraciones.bionicMode;
		const rhymeActive = $configuraciones.rhymeMode;
		
		// Limpiar timeout anterior si existe
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		
		// Aplicar con debounce de 150ms para evitar múltiples llamadas rápidas
		debounceTimer = setTimeout(() => {
			if (bionicActive || rhymeActive) {
				applyAccessibilityModes();
			} else {
				// Si ambos están desactivados, restaurar el texto original
				restoreOriginalText();
			}
		}, 150);
	});

	// Función para aplicar todos los modos activos de forma combinada
	async function applyAccessibilityModes() {
		// Evitar procesamiento concurrente
		if (isProcessing) {
			return;
		}
		
		isProcessing = true;
		
		try {
			// Procesar tanto el main como los modales montados (los modales se mueven al <body>)
			const modalRoots = Array.from(document.querySelectorAll('.modal')) as Element[];
			if (!mainEl && modalRoots.length === 0) {
				isProcessing = false;
				return;
			}

			// Restaurar primero en todo el documento
			restoreOriginalText();

		// Preparar raíces a procesar (main primero, luego modales)
		const roots: Element[] = [];
		if (mainEl) roots.push(mainEl);
		modalRoots.forEach(m => roots.push(m));

		// Importar funciones de rima si es necesario (una sola vez)
		let detectRhymes: ((text: string) => any[]) | undefined;
		let applyRhymeHighlight: ((text: string, patterns: any[], backgroundColor?: string) => string) | undefined;
		let splitIntoSyllables: ((word: string) => string[]) | undefined;
		if ($configuraciones.rhymeMode || $configuraciones.bionicMode) {
			const rhymeModule = await import('$lib/juegos/modos/historias/rhyme');
			detectRhymes = rhymeModule.detectRhymes;
			applyRhymeHighlight = rhymeModule.applyRhymeHighlight;
			splitIntoSyllables = rhymeModule.splitIntoSyllables;
		}

		// Selector de elementos a procesar dentro de cada raíz
		const selector = 'h1, h2, h3, h4, h5, h6, .seccion-titulo, p, button:not(.control-button):not(.boton-volver):not(.boton-configuracion):not(.switch-toggle), label:not(.switch-knob), .switch-label, span:not(.bionic-highlight):not(.bionic-rest):not(.rhyme-highlight):not(.switch-knob):not(.control-valor):not(.icono), small, div.control-ayuda, .control-label span';

		// Si el modo rima está activo, primero recolectar TODO el texto visible de la página PRINCIPAL (sin modales)
		let globalRhymePatterns: any[] = [];
		if ($configuraciones.rhymeMode && detectRhymes) {
			// Solo considerar el mainEl para el cálculo de patrones base
			let mainContent = '';
			if (mainEl) {
				const elements = mainEl.querySelectorAll(selector);
				elements.forEach((element) => {
					// Solo incluir elementos visibles
					const computedStyle = window.getComputedStyle(element as Element);
					if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
						const text = element.textContent?.trim();
						if (text) {
							mainContent += ' ' + text;
						}
					}
				});
			}
			
			// Solo recalcular si el contenido principal cambió
			if (mainContent !== cachedMainContent) {
				cachedMainContent = mainContent;
				cachedRhymePatterns = detectRhymes(mainContent);
			}
			
			// Usar los patrones cacheados
			globalRhymePatterns = cachedRhymePatterns;
		}

		roots.forEach((root) => {
			const elements = root.querySelectorAll(selector);

			elements.forEach((element) => {

				// Verificar qué modos están activos y qué highlights ya existen
				const hasBionic = !!element.querySelector('.bionic-highlight');
				const hasRhyme = !!element.querySelector('.rhyme-highlight');
				
				// Determinar si el elemento ya está correctamente procesado para el estado actual
				const bionicOk = $configuraciones.bionicMode ? hasBionic : !hasBionic;
				const rhymeOk = $configuraciones.rhymeMode ? hasRhyme : !hasRhyme;
				
				// Solo saltamos si el elemento ya tiene exactamente los highlights que necesita
				if (bionicOk && rhymeOk) return;
				
				// Si llegamos aquí, el elemento no coincide con el estado deseado
				// Primero, asegurarnos de que tenemos el HTML original guardado
				if (!element.hasAttribute('data-original-html')) {
					// Si el elemento actualmente tiene highlights, necesitamos limpiarlo primero
					// antes de guardarlo como original
					if (hasBionic || hasRhyme) {
						// Crear una copia temporal para limpiar
						const tempEl = element.cloneNode(true) as HTMLElement;
						const highlights = tempEl.querySelectorAll('.bionic-highlight, .bionic-rest, .rhyme-highlight');
						highlights.forEach(h => {
							// Preservar el contenido interno, solo quitar el wrapper
							const parent = h.parentNode;
							if (parent) {
								while (h.firstChild) {
									parent.insertBefore(h.firstChild, h);
								}
								parent.removeChild(h);
							}
						});
						element.setAttribute('data-original-html', tempEl.innerHTML);
					} else {
						// No hay highlights, guardar directamente
						element.setAttribute('data-original-html', (element as HTMLElement).innerHTML);
					}
				}
				
				// Limpiar cualquier highlight existente antes de reprocesar
				if (hasBionic || hasRhyme) {
					const originalHtml = element.getAttribute('data-original-html');
					if (originalHtml) {
						(element as HTMLElement).innerHTML = originalHtml;
					}
				}
				
let text = element.textContent?.trim();
			if (!text) return;
			
			// Si el elemento está dentro del carrusel, no reemplazamos todo el innerHTML
			// (evita borrar imágenes u otros nodos no-texto). En su lugar, solo eliminamos
			// spans de resaltado previos para evitar contenido obsoleto.
			if ((element as Element).closest('.carrusel-contenedor')) {
				const highlights = element.querySelectorAll('.bionic-highlight, .bionic-rest, .rhyme-highlight');
				if (highlights.length) {
					highlights.forEach(h => {
						const txt = h.textContent || '';
						h.replaceWith(document.createTextNode(txt));
					});
				}
				text = element.textContent?.trim() || '';
				if (!text) return;
			}
				
				// Configurar MutationObserver si no existe ya
				if (!originalObservers.has(element)) {
					setTimeout(() => {
						if (originalObservers.has(element)) return;
						try {
							const obs = new MutationObserver(() => {
								// Si el elemento es actualizado por otro proceso (ej. re-render de Svelte),
								// remover el HTML original guardado para no restaurar contenido obsoleto
								element.removeAttribute('data-original-html');
								const o = originalObservers.get(element);
								if (o) { o.disconnect(); }
								originalObservers.delete(element);
							});
							obs.observe(element, { childList: true, subtree: true, characterData: true });
							originalObservers.set(element, obs);
						} catch (e) {
							// ignorar fallos del observer
						}
					}, 80);
				}
				
				let processedHTML = text;
				
				// Aplicar modo rima primero si está activo
				if ($configuraciones.rhymeMode && applyRhymeHighlight) {
					// Usar los patrones globales calculados previamente para toda la página
					const backgroundColor = $configuraciones.modoNoche 
						? ($configuraciones.modoInverso ? '#ffffff' : '#121212')
						: '#ffffff';
					processedHTML = applyRhymeHighlight(text, globalRhymePatterns, backgroundColor);
				}
				
				// Aplicar modo biónico después si está activo
				if ($configuraciones.bionicMode) {
					// Si ya hay HTML del modo rima, procesar respetando los spans de rima
					if ($configuraciones.rhymeMode) {
						const tempDiv = document.createElement('div');
						tempDiv.innerHTML = processedHTML;
						
						// Usar función de separación de sílabas importada
						if (!splitIntoSyllables) return;
						
						// Procesar todos los textos, tanto dentro como fuera de spans de rima
						const processTextNode = (node: Node) => {
							if (node.nodeType === Node.TEXT_NODE) {
								const text = node.textContent || '';
								if (!text.trim()) return;

					// Dividir en palabras
					const words = text.split(/(\s+)/);
					const container = document.createElement('span');
					
					// Detectar color apropiado basado en fondo del elemento ancestro
					const bionicColor = getBionicColorForBackground(element);

					words.forEach(word => {
						if (/^\s+$/.test(word)) {
							container.appendChild(document.createTextNode(word));
						} else if (word.length > 0) {
							// Aplicar reglas por longitud de palabra (caracteres)
							const { highlighted, rest } = splitWordIntoBionicParts(word, 0.5);

							const highlightSpan = document.createElement('span');
							highlightSpan.className = 'bionic-highlight';
							highlightSpan.style.cssText = `color: ${bionicColor}; font-weight: 700;`;
							highlightSpan.textContent = highlighted;
							container.appendChild(highlightSpan);

							if (rest) {
								const restSpan = document.createElement('span');
								restSpan.className = 'bionic-rest';
								restSpan.style.cssText = 'color: inherit; font-weight: 400;';
								restSpan.textContent = rest;
								container.appendChild(restSpan);
							}
						}
					});

					if (node.parentNode) {
						node.parentNode.replaceChild(container, node);
					}
							Array.from(node.childNodes).forEach(processTextNode);
						}
					};
					
					processTextNode(tempDiv);
					processedHTML = tempDiv.innerHTML;
				} else {
					// Aplicar biónico simple sin rima
					if (!splitIntoSyllables) return;
					const words = text.split(/(\s+)/);
					
					// Detectar color apropiado basado en fondo del elemento
					const bionicColor = getBionicColorForBackground(element);
					
					const processedWords = words.map((word) => {
						if (/^\s+$/.test(word)) {
							return word;
						}
						
						if (word.length === 0) return word;
						
						const { highlighted, rest } = splitWordIntoBionicParts(word, 0.5);
						
						if (!rest) {
							return `<span class=\"bionic-highlight\" style=\"font-weight: 700; color: ${bionicColor};\">${word}</span>`;
						} else {
							return `<span class=\"bionic-highlight\" style=\"font-weight: 700; color: ${bionicColor};\">${highlighted}</span><span class=\"bionic-rest\" style=\"font-weight: 400;\">${rest}</span>`;
						}
					});
					
					processedHTML = processedWords.join('');
				}
			}

			// En lugar de reemplazar el innerHTML completo (que rompe la estructura), procesamos
			// cada nodo de texto individualmente y reemplazamos solo lo necesario.
			const createBionicFragment = (text: string, el: Element) => {
				const frag = document.createDocumentFragment();
				const bionicColor = getBionicColorForBackground(el);
				const tokens = text.split(/(\s+)/);
				tokens.forEach(token => {
					if (/^\s+$/.test(token)) { frag.appendChild(document.createTextNode(token)); return; }
					if (token.length === 0) { frag.appendChild(document.createTextNode(token)); return; }
					const { highlighted, rest } = splitWordIntoBionicParts(token, 0.5);
					if (!rest) { const s = document.createElement('span'); s.className = 'bionic-highlight'; s.style.color = bionicColor; s.textContent = token; frag.appendChild(s); return; }
					const h = document.createElement('span'); h.className = 'bionic-highlight'; h.style.color = bionicColor; h.textContent = highlighted; frag.appendChild(h);
					if (rest) { const r = document.createElement('span'); r.className = 'bionic-rest'; r.textContent = rest; frag.appendChild(r); }
				});
				return frag;
			};

			const processNode = (node: Node) => {
				if (node.nodeType === Node.TEXT_NODE) {
					const txt = node.textContent || '';
					if (!txt.trim()) return;
					
					// Verificar si el nodo de texto está dentro de un elemento .icono
					let parent = node.parentElement;
					while (parent && parent !== element) {
						if (parent.classList.contains('icono')) return;
						parent = parent.parentElement;
					}
					
					// Detectar si el texto original tiene negrita (strong, b, o font-weight bold/bolder)
					const hasOriginalBold = (() => {
						let p = node.parentElement;
						while (p && p !== element) {
							const tagName = p.tagName.toLowerCase();
							if (tagName === 'strong' || tagName === 'b') return true;
							const computedStyle = window.getComputedStyle(p);
							const fontWeight = computedStyle.fontWeight;
							if (fontWeight === 'bold' || fontWeight === 'bolder' || parseInt(fontWeight) >= 700) return true;
							p = p.parentElement;
						}
						return false;
					})();
					
					// NUEVO ENFOQUE: Procesar palabra por palabra aplicando AMBOS modos simultáneamente
					if (($configuraciones.bionicMode || $configuraciones.rhymeMode) && detectRhymes && applyRhymeHighlight) {
						// Usar los patrones globales de rima (ya detectados para toda la página)
						const patterns = globalRhymePatterns;
						const words = txt.split(/(\s+|[.,;:!?¿¡()"""'])/);
						const frag = document.createDocumentFragment();
						const bionicColor = getBionicColorForBackground(element);
						
						words.forEach(word => {
							// Si es espacio o puntuación, añadir tal cual
							if (/^\s+$/.test(word) || /^[.,;:!?¿¡()"""']$/.test(word)) {
								frag.appendChild(document.createTextNode(word));
								return;
							}
							
							if (word.length === 0) {
								frag.appendChild(document.createTextNode(word));
								return;
							}
							
							// Limpiar palabra para buscar patrón de rima
							const cleanWord = word.toLowerCase().replace(/[.,;:!?¿¡()"""']/g, '');
							const pattern = patterns.find(p => p.word === cleanWord);
							
							// Calcular posiciones de biónico
							let bionicLength = 0;
							if ($configuraciones.bionicMode) {
								bionicLength = getHighlightLengthForWord(word.length, 0.5);
							}
							
							// Calcular posiciones de rima
							let rhymeStartIndex = -1;
							let rhymeColor = '';
							let rhymeBgColor = '';
							
							if ($configuraciones.rhymeMode && pattern && pattern.hasRhyme && pattern.ending) {
								const ending = pattern.ending.toLowerCase();
								const wordLower = cleanWord;
								rhymeStartIndex = wordLower.lastIndexOf(ending);
								
								if (rhymeStartIndex === -1 || rhymeStartIndex + ending.length !== wordLower.length) {
									rhymeStartIndex = wordLower.length - ending.length;
								}
								
								if (rhymeStartIndex >= 0 && rhymeStartIndex < word.length) {
									const rgb = hexToRgbSimple(pattern.color);
									const lum = rgb ? (0.2126 * rgb[0]/255 + 0.7152 * rgb[1]/255 + 0.0722 * rgb[2]/255) : 0.5;
									
									// Ajustar colores según el modo
									if ($configuraciones.modoNoche) {
										// En modo noche, usar opacidad mayor y aclarar el color del borde
										rhymeColor = pattern.color; // Color original más brillante
										rhymeBgColor = rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.45)` : 'rgba(255,255,255,0.45)';
									} else {
										// En modo claro, oscurecer el borde y usar opacidad baja
										rhymeColor = lum > 0.4 ? darkenColorSimple(pattern.color, 0.4) : pattern.color;
										rhymeBgColor = rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.20)` : 'rgba(0,0,0,0.20)';
									}
								} else {
									rhymeStartIndex = -1;
								}
							}
							
							// Dividir la palabra en segmentos según estilos para evitar separación de letras
							let currentSegment = '';
							let currentStyle = { isBionic: false, isRhyme: false };
							
							const flushSegment = () => {
								if (currentSegment.length === 0) return;
								
								const span = document.createElement('span');
								
								// Prioridad: Si es rima, aplicar estilos de rima
								if (currentStyle.isRhyme) {
									// Rima: fondo/subrayado
									span.style.backgroundColor = rhymeBgColor;
									span.style.borderBottom = `2px solid ${rhymeColor}`;
									span.style.padding = '0';
									span.style.borderRadius = '2px';
									
									// Si ambos modos están activos
									if ($configuraciones.bionicMode && currentStyle.isBionic) {
										// Mantener negrita si el texto original la tenía, sino normal
										span.style.fontWeight = hasOriginalBold ? '700' : 'normal';
										span.style.color = bionicColor;
										span.className = 'bionic-highlight rhyme-highlight';
									} else if ($configuraciones.bionicMode) {
										// Solo modo biónico activo (pero esta parte es rima, no biónica)
										span.style.fontWeight = hasOriginalBold ? '700' : 'normal';
										span.className = 'rhyme-highlight';
									} else {
										// Solo rima activa, no tocar font-weight (preservar negrita original)
										span.className = 'rhyme-highlight';
									}
								} else if (currentStyle.isBionic) {
									// Solo biónico: negrita
									span.style.fontWeight = '700';
									span.style.color = bionicColor;
									span.className = 'bionic-highlight';
								} else {
									// Ninguno: texto normal
									span.className = 'bionic-rest';
									// Solo aplicar font-weight normal si el modo biónico está activo
									// (para diferenciar partes resaltadas vs no resaltadas)
									// Si solo está el modo rima, no tocar font-weight (preservar negrita original)
									if ($configuraciones.bionicMode) {
										span.style.fontWeight = hasOriginalBold ? '700' : 'normal';
									}
								}
								
								
								span.textContent = currentSegment;
								frag.appendChild(span);
								currentSegment = '';
							};
							
							for (let i = 0; i < word.length; i++) {
								const char = word[i];
								const isBionic = $configuraciones.bionicMode && i < bionicLength;
								const isRhyme = rhymeStartIndex >= 0 && i >= rhymeStartIndex;
								
								// Si el estilo cambió, crear un nuevo segmento
								if (currentSegment.length > 0 && 
									(currentStyle.isBionic !== isBionic || currentStyle.isRhyme !== isRhyme)) {
									flushSegment();
								}
								
								currentSegment += char;
								currentStyle = { isBionic, isRhyme };
							}
							
							// Añadir el último segmento
							flushSegment();
						});
						
						node.parentNode?.replaceChild(frag, node);
						return;
					}
					
					return;
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					// Ignorar elementos SVG y sus hijos
					if ((node as Element).tagName === 'svg' || (node as Element).closest('svg')) return;
					// Ignorar elementos con clase .icono y sus hijos
					if ((node as Element).classList.contains('icono')) return;
					if ((node as Element).classList.contains('bionic-highlight') || (node as Element).classList.contains('rhyme-highlight')) return;
					Array.from(node.childNodes).forEach(processNode);
				}
			};

			Array.from(element.childNodes).forEach(processNode);
		});
		});
		} finally {
			// Siempre liberar la bandera de procesamiento
			isProcessing = false;
		}
	}

	// Función para restaurar texto original
	function restoreOriginalText() {
		// Restaurar en todo el documento (incluye modales que puedan tener data-original-html)
		const elements = document.querySelectorAll('[data-original-html]');
		elements.forEach((element) => {
			const originalHtml = element.getAttribute('data-original-html');
			if (originalHtml === null) return;
			const el = element as HTMLElement;
			// Si el elemento contiene highlights, restauramos al original guardado
			const hasHighlight = !!el.querySelector('.bionic-highlight, .rhyme-highlight');
			if (hasHighlight) {
				el.innerHTML = originalHtml;
				element.removeAttribute('data-original-html');
				// Disconnect observer if exists
				const o = originalObservers.get(element);
				if (o) {
					o.disconnect();
					originalObservers.delete(element);
				}
				return;
			}

			// Si no hay highlights pero el DOM cambió desde que guardamos el original,
			// actualizamos el 'data-original-html' con el contenido actual para que
			// futuras restauraciones reflejen el nuevo estado del template y no
			// sobrescriban cambios dinámicos (p.ej. indicador 'Historia X de Y').
			if (el.innerHTML !== originalHtml) {
				element.setAttribute('data-original-html', el.innerHTML);
				return;
			}

			// Si el contenido coincide con el original y no hay highlights, limpiamos.
			element.removeAttribute('data-original-html');
			const o = originalObservers.get(element);
			if (o) {
				o.disconnect();
				originalObservers.delete(element);
			}
		});
	}
    // Escalado accesible de botones según resolución (mantener tamaño aparente entre 720p y 1080p)
    function actualizarEscalaBotones() {
        if (!browser) return;
        const BASE_HEIGHT = 1080;
        const MIN_SCALE = 0.6;   // evita que en pantallas muy altas se reduzca demasiado
        const MAX_SCALE = 1;   // en 720p ≈ 1.5 para igualar tamaño aparente
        const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, BASE_HEIGHT / window.innerHeight));
        document.documentElement.style.setProperty('--btn-scale', String(scale));
    }

    onMount(() => {
        actualizarEscalaBotones();
        window.addEventListener('resize', actualizarEscalaBotones);
        return () => window.removeEventListener('resize', actualizarEscalaBotones);
    });
</script>

<!-- Escuchamos el evento de teclado en toda la ventana -->
<svelte:window onkeydown={manejarTecla} />

<svelte:head>
	<title>Coloreco - Tu estudio de pinturas e historias</title>
	<link rel="icon" href={logoColoreco} />
	<meta name="viewport" content="width=device-width,initial-scale=1" />
</svelte:head>

<svg style="position: absolute; width: 0; height: 0; overflow: hidden;" aria-hidden="true">
	<defs>
		<filter id="cvd-filter" color-interpolation-filters="sRGB">
			<feColorMatrix type="matrix" values={matrixValues} />
		</filter>
		<filter id="smart-contrast-filter" color-interpolation-filters="sRGB">
			<feComponentTransfer>
				<feFuncR type="linear" slope="1.2" intercept="-0.1"/>
				<feFuncG type="linear" slope="1.2" intercept="-0.1"/>
				<feFuncB type="linear" slope="1.2" intercept="-0.1"/>
			</feComponentTransfer>
		</filter>
	</defs>
</svg>

<div 
	class={shellClasses}
	style="
		--font-size-base: {$configuraciones.multiplicadorTamanioFuente}rem;
		--spacing-base: {$configuraciones.multiplicadorEspaciado}rem;
		--border-radius: {$configuraciones.redondesBordes}px;
		--button-padding: calc(var(--spacing-base) * 0.6) calc(var(--spacing-base) * 1.2);
	"

>
<!-- Apartado de fondos -->
{#if (necesitaFondoManchas)}
	<FondoManchas style={filterStyle}/>
{/if}

{#if (necesitaFondoLogrosGeneral)}
	<FondoLogrosGeneral style={filterStyle}/>
{/if}

{#if (necesitaFondoCuerpoHumano)}
	<FondoCuerpoHumano style={filterStyle}/>
{/if}

	<div class="app-filtered-content" style={filterStyle}>
		
		<main bind:this={mainEl} class="app-main">
			{@render children()}
		</main>
	</div>

	<!-- Lupa Mágica: magnificación del contenido de la página -->
	{#if $configuraciones.lupaActivada}
	<div inert tabindex="-1">
		<EfectoLupa />
	</div>
	{/if}

	<!-- Control de narración -->
	<NarrationControl />

	<!-- Botón de volver fijo en la esquina inferior izquierda (oculto en página inicial) -->
	{#if !estaEnInicio && !estaEnEstudio}
		<div class="contenedor-flotante-i" style={filterStyle}>
			<button 
				class="boton-volver pattern-yellow" 
				aria-label="Volver a la página anterior"
				aria-keyshortcuts="Escape" 
				title="Volver (Esc)" 
				type="button"
				onclick={volver}				use:clickSound			>
				<span class="solo-lectores">Volver a la página anterior</span>
				<IconoVolver />
			</button>

			<!-- Texto visual indicativo -->
			<span class="texto-tecla">ESC</span>
		</div>
	{/if}
	
	<!-- Botón de ajustes fijo en la esquina inferior derecha (oculto en /ajustes) -->

	{#if !estaEnConfiguracion && !estaEnEstudio}
		<div class="contenedor-flotante-d" style={filterStyle}>
			<button 
				class="boton-configuracion pattern-yellow" 
				aria-label="Abrir los ajustes"
				aria-keyshortcuts="Control + A" 
				title="Ajustes (Control + A)" 
				type="button"
				onclick={abrirConfiguracion}				use:clickSound			>
				<span class="solo-lectores">Abrir los ajustes</span>
				<IconoAccesibilidad />
			</button>

			<!-- Texto visual indicativo -->
			<span class="texto-tecla">Ctrl + A</span>
		</div>
	{/if}
</div>

<style>
	:global(html, body, #svelte) {
		min-height: 100vh;
		height: 100vh;
		display: block;
		flex-direction: column;
		align-content: center;
		justify-content: center;
		margin: 0;
	}

	.app-layout {
		display: flex;
		flex-direction: column;
		background: transparent;
		min-height: 100vh;
		color: var(--fg, #111);
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
		/* Variables CSS base ahora se inyectan dinámicamente desde el store */
		font-size: var(--font-size-base, 1rem);
		overflow: hidden; /* Evita que app-layout tenga scroll */
	}

	.app-filtered-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		transition: filter 0.3s ease;
		min-height: 100vh;
		height: 100%; /* Ocupa toda la altura disponible */
		overflow: hidden; /* El scroll lo manejará app-main */
	}

	.app-main {
		flex: 1 1 auto;
		display: block;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		overflow-x: hidden;
		overflow-y: auto; /* Permite scroll vertical interno */
		width: 100%;
		margin: 0 auto;
		padding: 0 var(--spacing-base, 1rem) calc(var(--spacing-base, 1rem) * 2);
		box-sizing: border-box;
	}

	/* Contenedores flotantes: Ahora aceptan filtros y mantienen su posición */
	.contenedor-flotante-i,
	.contenedor-flotante-d {
		position: fixed;
		bottom: var(--spacing-base, 1rem);
		display: flex;
		flex-direction: column; 
		align-items: center;    
		gap: 4px;              
		z-index: 100;
		transition: filter 0.3s ease; /* Transición suave para el filtro */
	}

	.contenedor-flotante-i { left: calc(var(--spacing-base, 1rem) * 2.5); }
	.contenedor-flotante-d { right: calc(var(--spacing-base, 1rem) * 2.5); }

	.texto-tecla {
		font-size: calc(4vh * var(--btn-scale, 1));
		font-weight: 500;
		width: 100%;
		text-align: center;
		padding-top: 1rem;
		color: var(--color-texto,rgb(0, 0, 0));
		user-select: none; /* Evita que se seleccione el texto al dar doble clic */
		pointer-events: none; /* El clic traspasa al fondo */
		text-shadow: 0 1px 2px rgba(255,255,255,0.8);
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
	/*Botón volver esquina inferior izquierda y botón ajustes esquina inferior derecha*/
	.boton-volver, .boton-configuracion{
		position: relative;
		width: calc(8vw * var(--btn-scale, 1));
		height: calc(15vh * var(--btn-scale, 1));
		border-radius: var(--border-radius, 8px);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--fondo-botones, #ffca00);
		border: none;
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
		cursor: pointer;
		transition: transform 120ms ease, box-shadow 120ms ease;
		z-index: 100;
	}
	.boton-volver:hover, .boton-configuracion:hover {
		transform: translateY(-2px);
		background: var(--fondo-botones-hover, #d1a700);
	}
	.boton-volver:active, .boton-configuracion:active {
		transform: translateY(0);
	}
	.boton-volver:focus, .boton-configuracion:focus{
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #d1a700);
		outline-offset: 7px;
	}

	/* =========================================
	   SISTEMA DE TEXTURAS (Pattern Coding)
	   ========================================= */
	/* Solo se activan si el padre tiene la clase .enable-textures */
	
	/* Negro (#000000): Cuadrícula de puntos pequeños */
	:global(.enable-textures .pattern-black) {
		position: relative;
	}
	:global(.enable-textures .pattern-black::after) {
		content: "";
		position: absolute;
		inset: 0;
		background-image: radial-gradient(
			rgba(255, 255, 255, 0.3) 15%, 
			transparent 15%
		);
		background-size: 6px 6px;
		pointer-events: none;
		z-index: 1;
	}

	/* Rojo (#FF0000): Rayas diagonales 45° */
	:global(.enable-textures .pattern-red),
	:global(.enable-textures .pattern-danger) {
		position: relative;
	}
	:global(.enable-textures .pattern-red::after),
	:global(.enable-textures .pattern-danger::after) {
		content: "";
		position: absolute;
		inset: 0;
		background-image: repeating-linear-gradient(
			45deg,
			rgba(0, 0, 0, 0.2),
			rgba(0, 0, 0, 0.2) 2px,
			transparent 2px,
			transparent 8px
		);
		pointer-events: none;
		z-index: 1;
	}

	/* Verde (#00FF00): Puntos circulares */
	:global(.enable-textures .pattern-green),
	:global(.enable-textures .pattern-success) {
		position: relative;
	}
	:global(.enable-textures .pattern-green::after),
	:global(.enable-textures .pattern-success::after) {
		content: "";
		position: absolute;
		inset: 0;
		background-image: radial-gradient(
			rgba(0, 0, 0, 0.2) 20%, 
			transparent 20%
		);
		background-size: 8px 8px;
		pointer-events: none;
		z-index: 1;
	}

	/* Azul (#0000FF): Líneas verticales */
	:global(.enable-textures .pattern-blue),
	:global(.enable-textures .pattern-info) {
		position: relative;
	}
	:global(.enable-textures .pattern-blue::after),
	:global(.enable-textures .pattern-info::after) {
		content: "";
		position: absolute;
		inset: 0;
		background-image: repeating-linear-gradient(
			90deg,
			rgba(0, 0, 0, 0.2),
			rgba(0, 0, 0, 0.2) 2px,
			transparent 2px,
			transparent 8px
		);
		pointer-events: none;
		z-index: 1;
	}

	/* Amarillo (#FFFF00): Zigzag diagonal */
	:global(.enable-textures .pattern-yellow),
	:global(.enable-textures .pattern-warning) {
		position: relative;
	}
	:global(.enable-textures .pattern-yellow::after),
	:global(.enable-textures .pattern-warning::after) {
		content: "";
		position: absolute;
		inset: 0;
		background-image: 
			linear-gradient(135deg, rgba(0,0,0,0.15) 25%, transparent 25%),
			linear-gradient(225deg, rgba(0,0,0,0.15) 25%, transparent 25%),
			linear-gradient(45deg, rgba(0,0,0,0.15) 25%, transparent 25%),
			linear-gradient(315deg, rgba(0,0,0,0.15) 25%, transparent 25%);
		background-position: 4px 0, 4px 0, 0 0, 0 0;
		background-size: 8px 8px;
		background-repeat: repeat;
		pointer-events: none;
		z-index: 1;
	}

	/* Magenta (#FF00FF): Líneas horizontales */
	:global(.enable-textures .pattern-magenta) {
		position: relative;
	}
	:global(.enable-textures .pattern-magenta::after) {
		content: "";
		position: absolute;
		inset: 0;
		background-image: repeating-linear-gradient(
			0deg,
			rgba(255, 255, 255, 0.25),
			rgba(255, 255, 255, 0.25) 2px,
			transparent 2px,
			transparent 6px
		);
		pointer-events: none;
		z-index: 1;
	}

	/* Cian (#00FFFF): Tablero de ajedrez */
	:global(.enable-textures .pattern-cyan) {
		position: relative;
	}
	:global(.enable-textures .pattern-cyan::after) {
		content: "";
		position: absolute;
		inset: 0;
		background-image: 
			linear-gradient(45deg, rgba(0, 0, 0, 0.2) 25%, transparent 25%),
			linear-gradient(-45deg, rgba(0, 0, 0, 0.2) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, rgba(0, 0, 0, 0.2) 75%),
			linear-gradient(-45deg, transparent 75%, rgba(0, 0, 0, 0.2) 75%);
		background-size: 8px 8px;
		background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
		pointer-events: none;
		z-index: 1;
	}

	/* Naranja (#FFA500): Rayas diagonales -45° */
	:global(.enable-textures .pattern-orange) {
		position: relative;
	}
	:global(.enable-textures .pattern-orange::after) {
		content: "";
		position: absolute;
		inset: 0;
		background-image: repeating-linear-gradient(
			-45deg,
			rgba(0, 0, 0, 0.2),
			rgba(0, 0, 0, 0.2) 2px,
			transparent 2px,
			transparent 6px
		);
		pointer-events: none;
		z-index: 1;
	}

	/* Púrpura (#800080): Cruces (grid) */
	:global(.enable-textures .pattern-purple) {
		position: relative;
	}
	:global(.enable-textures .pattern-purple::after) {
		content: "";
		position: absolute;
		inset: 0;
		background-image: 
			repeating-linear-gradient(0deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 8px),
			repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 8px);
		pointer-events: none;
		z-index: 1;
	}

	/* Rosa (#FFC0CB): Ondas concéntricas */
	:global(.enable-textures .pattern-pink) {
		position: relative;
	}
	:global(.enable-textures .pattern-pink::after) {
		content: "";
		position: absolute;
		inset: 0;
		background-image: repeating-radial-gradient(
			circle at 0 0,
			rgba(0, 0, 0, 0.15) 0px,
			rgba(0, 0, 0, 0.15) 1px,
			transparent 1px,
			transparent 4px
		);
		background-size: 10px 10px;
		pointer-events: none;
		z-index: 1;
	}

	/* === INYECCIÓN CSS: ALTO CONTRASTE === */
	/* Al aplicarlo al padre (.app-layout), las variables bajan a todos los hijos */
	.app-layout.enable-high-contrast {
		--border-color: #000000 !important;
		--text-color: #000000 !important;
		--border-width: 2px !important;
	}
	/* El fondo blanco lo forzamos solo en el contenido y botones para asegurar legibilidad */
	.app-layout.enable-high-contrast .app-filtered-content,
	.app-layout.enable-high-contrast .boton-volver,
	:global(.enable-high-contrast button), :global(.enable-high-contrast input), :global(.enable-high-contrast .card) {
		border: 2px solid #000 !important;
	}
</style>