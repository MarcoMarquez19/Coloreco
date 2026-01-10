<script lang="ts">
	import logoColoreco from '$lib/assets/Logo_coloreco.png';
	import { configuraciones } from '$lib/stores/settings';
	import { audioStore, clickSound } from '$lib/stores/audio';
	import { interpolateMatrix } from '$lib/constants/colorMatrices';
	import EfectoLupa from '$lib/components/a11y/EfectoLupa.svelte';
	import NarrationControl from '$lib/components/a11y/NarrationControl.svelte';
	import { findPictogramSync, preloadPictograms } from '$lib/juegos/modos/historias/pictograms';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { obtenerSesionActual } from '$lib/db/artistas.service';
	import { inicializarCatalogoLogros } from '$lib/db/logros.service';
	import { swManager } from '$lib/utils/sw-manager';
	import UpdateNotification from '$lib/components/ui/UpdateNotification.svelte';
	import '../lib/styles/themes.css';
	import DyslexiaModes from '$lib/styles/DyslexiaModes.svelte';
	import IconoVolver from '$lib/components/iconos/IconoVolver.svelte';
	import IconoAccesibilidad from '$lib/components/iconos/Accesibilidad.svelte';
	import IconoInstrucciones from '$lib/components/iconos/IconoInstrucciones.svelte';
	import FondoManchas from '$lib/components/fondos/FondoManchas.svelte';
	import FondoLogrosGeneral from '$lib/components/fondos/FondoLogrosGeneral.svelte';
	import FondoCuerpoHumano from '$lib/components/fondos/FondoCuerpoHumano.svelte';
	import { adaptiveObserver, adaptiveEngine } from '$lib/a11y/adaptive-engine';

	// Pequeño helper de accesibilidad: enfocar el contenido principal al navegar
	let mainEl: HTMLElement | null = null;

	// Props para recibir el contenido de las páginas hijas
	let { children } = $props();

	// Control de procesamiento de accesibilidad
	let isProcessing = false;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let requestId = 0; // Para cancelar requests antiguos

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
	
	// Detectar si necesita botón de instrucciones (solo en seleccionar-historia y progreso)
	let necesitaBotonInstrucciones = $derived(
		$page.url.pathname === '/juegos/historias/seleccionar-historia' ||
		$page.url.pathname.includes('/progreso') ||
		$page.url.pathname === '/taller-escenas' ||
		$page.url.pathname === '/cuerpo-plantillas'
	);

	//DETECTAR SI SE NECESITA EL FONDO DE MANCHAS
	let necesitaFondoManchas = $derived($page.url.pathname === '/' 
	|| $page.url.pathname === '/seleccionar-estudio' 
	|| $page.url.pathname === ('/galeria')
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
		audioStore.playSound('click');
		if (window.history.length > 1) {
			window.history.back();
		} else {
			goto('/');
		}
	}
	function abrirInstrucciones() {
		// Disparar evento personalizado para que la página lo maneje
		window.dispatchEvent(new CustomEvent('abrir-instrucciones'));
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
		if ((event.key === 'i' || event.key === 'I') && event.ctrlKey && necesitaBotonInstrucciones) {
			event.preventDefault();
			abrirInstrucciones();
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

	// Efecto para resetear el motor adaptativo en cada cambio de ruta
	$effect(() => {
		if (!browser) return;
		const currentPath = $page.url.pathname;
		adaptiveEngine.onRouteChange(currentPath);
	});

	// Efecto para reproducir música según la pantalla actual
	$effect(() => {
		if (!browser) return;
		
		const path = $page.url.pathname;
		
		// Determinar qué música reproducir según la ruta
		if (path.startsWith('/taller-escenas') || path.startsWith('/juegos/dibujo')) {
			audioStore.playMusic('modoDibujo');
		} else if (path.startsWith('/cuerpo-plantillas') || path.startsWith('/juegos/cuerpo-humano')) {
			audioStore.playMusic('modoCuerpo');
		} else if (path.startsWith('/juegos/historias')) {
			audioStore.playMusic('modoHistorias');
		} else {
			audioStore.playMusic('default');
		}
	});

	// Guardia de rutas: si no hay artista activo solo permitir rutas públicas
	onMount(async () => {
		if (!browser) return;
		try {
			// Registrar Service Worker y precargar assets
			await swManager.register();
			// Precargar assets después de un pequeño delay para no bloquear la carga inicial
			setTimeout(() => {
				swManager.precacheAllStaticAssets().catch(err => {
					console.warn('Error al precargar assets:', err);
				});
			}, 2000);
			
			// Precargar diccionario de pictogramas
			await preloadPictograms();
			
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
				if ($configuraciones.bionicMode || $configuraciones.rhymeMode || $configuraciones.pictogramMode) {
					applyAccessibilityModes();
				}
			}, 100);
		};

		const handleContentUpdated = (e: Event) => {
			const detail = (e as CustomEvent)?.detail || {};
			// Primera aplicación - rápida para cambios inmediatos
			setTimeout(() => {
				if ($configuraciones.bionicMode || $configuraciones.rhymeMode || $configuraciones.pictogramMode) {
					applyAccessibilityModes();
				}
			}, 100);

			// Segunda aplicación tras la animación si se especifica, o usar un fallback
			const animationDuration = typeof detail.animationDuration === 'number' ? detail.animationDuration : 500;
			setTimeout(() => {
				if ($configuraciones.bionicMode || $configuraciones.rhymeMode || $configuraciones.pictogramMode) {
					applyAccessibilityModes();
				}
			}, animationDuration + 100);
			
			// Tercera aplicación - para producción donde el renderizado puede ser más lento
			setTimeout(() => {
				if ($configuraciones.bionicMode || $configuraciones.rhymeMode || $configuraciones.pictogramMode) {
					applyAccessibilityModes();
				}
			}, animationDuration + 400);
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
		
		// Modo pictograma (verificar si estamos en una ruta excluida)
		const currentPath = $page.url.pathname;
		const pictogramExcludedPaths = ['/juegos/dibujo', '/juegos/cuerpo-humano'];
		const shouldExcludePictogram = pictogramExcludedPaths.some(path => currentPath.startsWith(path));
		
		if ($configuraciones.pictogramMode && !shouldExcludePictogram) {
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
		
		// Primera aplicación - rápida para desarrollo local
		setTimeout(() => {
			if ($configuraciones.bionicMode || $configuraciones.rhymeMode || $configuraciones.pictogramMode) {
				applyAccessibilityModes();
			}
		}, 200);
		
		// Segunda aplicación - para asegurar que funcione en producción (Vercel)
		// donde el contenido puede tardar más en renderizarse
		setTimeout(() => {
			if ($configuraciones.bionicMode || $configuraciones.rhymeMode || $configuraciones.pictogramMode) {
				applyAccessibilityModes();
			}
		}, 500);
	});

	// Escuchar cambios en los modos de accesibilidad con debounce mejorado
	$effect(() => {
		// Observar cambios en bionicMode, rhymeMode y pictogramMode
		const bionicActive = $configuraciones.bionicMode;
		const rhymeActive = $configuraciones.rhymeMode;
		const pictogramActive = $configuraciones.pictogramMode;
		
		// Incrementar requestId para invalidar requests anteriores
		requestId++;
		const currentRequestId = requestId;
		
		// Limpiar timeout anterior si existe
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		
		// Aplicar con debounce de 200ms para evitar múltiples llamadas rápidas
		debounceTimer = setTimeout(() => {
			// Verificar si este request sigue siendo válido
			if (currentRequestId !== requestId) {
				return; // Request cancelado, hay uno más nuevo
			}
			
			if (bionicActive || rhymeActive || pictogramActive) {
				applyAccessibilityModes();
			} else {
				// Si todos están desactivados, restaurar el texto original
				restoreOriginalText();
			}
		}, 200);
	});

	// Función para aplicar todos los modos activos de forma combinada
	async function applyAccessibilityModes() {
		// Evitar procesamiento concurrente
		if (isProcessing) {
			console.log('[Layout] Procesamiento ya en curso, esperando...');
			return;
		}
		
		isProcessing = true;
		const currentRequest = requestId; // Capturar el ID actual
		
		try {
			// Verificar si este request fue cancelado antes de continuar
			if (currentRequest !== requestId) {
				console.log('[Layout] Request cancelado');
				isProcessing = false;
				return;
			}
			// Verificar si estamos en una página donde NO debe aplicarse el modo pictográfico
			const currentPath = $page.url.pathname;
			const pictogramExcludedPaths = ['/juegos/dibujo', '/juegos/cuerpo-humano'];
			const shouldExcludePictogram = pictogramExcludedPaths.some(path => currentPath.startsWith(path));
			
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
		// Excluir explícitamente elementos con data-no-adapt
		const selector = 'h1:not([data-no-adapt]), h2:not([data-no-adapt]), h3:not([data-no-adapt]), h4:not([data-no-adapt]), h5:not([data-no-adapt]), h6:not([data-no-adapt]), .seccion-titulo:not([data-no-adapt]), p:not([data-no-adapt]), button:not(.control-button):not(.boton-volver):not(.boton-configuracion):not(.boton-instrucciones):not(.switch-toggle):not(.pictogram-word):not([data-no-adapt]), label:not(.switch-knob):not([data-no-adapt]), .switch-label:not([data-no-adapt]), span:not(.bionic-highlight):not(.bionic-rest):not(.rhyme-highlight):not(.pictogram-wrapper):not(.pictogram-icon):not(.pictogram-popover):not(.switch-knob):not(.control-valor):not(.icono):not([data-no-adapt]), small:not([data-no-adapt]), div.control-ayuda:not([data-no-adapt]), .control-label span:not([data-no-adapt])';

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

		roots.forEach((root, rootIndex) => {
			// Verificar cancelación entre cada root
			if (currentRequest !== requestId) {
				console.log('[Layout] Request cancelado durante procesamiento');
				return;
			}
			
			const elements = root.querySelectorAll(selector);

			elements.forEach((element, elementIndex) => {
				// Verificar cancelación cada 50 elementos para evitar procesamiento pesado
				if (elementIndex % 50 === 0 && currentRequest !== requestId) {
					console.log('[Layout] Request cancelado durante procesamiento de elementos');
					return;
				}
				
				// Doble verificación: asegurarse que el elemento no tenga data-no-adapt
				if (element.hasAttribute('data-no-adapt')) {
					return;
				}
				
				// Verificar que el elemento no esté dentro de un contenedor con data-no-adapt
				if (element.closest('[data-no-adapt]')) {
					return;
				}

				// Verificar qué modos están activos y qué highlights ya existen
				const hasBionic = !!element.querySelector('.bionic-highlight');
				const hasRhyme = !!element.querySelector('.rhyme-highlight');
				const hasPictogram = !!element.querySelector('.pictogram-wrapper');
				
				// Determinar si aplicar el modo pictográfico en esta página
				const applyPictogramMode = $configuraciones.pictogramMode && !shouldExcludePictogram;
				
				// Si el modo pictográfico está activo y ya tiene pictogramas, saltar
				if (applyPictogramMode && hasPictogram) return;
				
				// Si solo modos biónico/rima están activos y ya los tiene, saltar
				if (!applyPictogramMode && ($configuraciones.bionicMode || $configuraciones.rhymeMode)) {
					const bionicOk = $configuraciones.bionicMode ? hasBionic : !hasBionic;
					const rhymeOk = $configuraciones.rhymeMode ? hasRhyme : !hasRhyme;
					if (bionicOk && rhymeOk) return;
				}
				
				// Si ningún modo está activo y no tiene highlights, saltar
				if (!$configuraciones.bionicMode && !$configuraciones.rhymeMode && !applyPictogramMode && !hasBionic && !hasRhyme && !hasPictogram) return;
				
				// Si llegamos aquí, el elemento no coincide con el estado deseado
				// Primero, asegurarnos de que tenemos el HTML original guardado
				if (!element.hasAttribute('data-original-html')) {
					// Si el elemento actualmente tiene highlights, necesitamos limpiarlo primero
					// antes de guardarlo como original
					if (hasBionic || hasRhyme || hasPictogram) {
						// Crear una copia temporal para limpiar
						const tempEl = element.cloneNode(true) as HTMLElement;
						const highlights = tempEl.querySelectorAll('.bionic-highlight, .bionic-rest, .rhyme-highlight, .pictogram-wrapper');
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
				if (hasBionic || hasRhyme || hasPictogram) {
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
				const highlights = element.querySelectorAll('.bionic-highlight, .bionic-rest, .rhyme-highlight, .pictogram-wrapper');
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
					
					// Verificar si el nodo de texto está dentro de un elemento con data-no-adapt
					let parent = node.parentElement;
					while (parent && parent !== element) {
						if (parent.hasAttribute('data-no-adapt')) return;
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
					
					// Obtener el font-weight computado del elemento original para preservarlo
					const originalFontWeight = (() => {
						const computed = window.getComputedStyle(element);
						return computed.fontWeight;
					})();
					
				// NUEVO ENFOQUE: Procesar palabra por palabra aplicando TODOS los modos simultáneamente
				// Los tres modos pueden coexistir
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
					
					// Limpiar la palabra de puntuación para buscar el pictograma
					const cleanWord = word.replace(/[.,;:!?¿¡()"""']/g, '');
					const pictogram = applyPictogramMode ? findPictogramSync(cleanWord) : null;
					
					// Si hay pictograma, envolver la palabra
					if (pictogram) {
						// Crear wrapper para el pictograma con popover
						const wrapper = document.createElement('span');
						wrapper.className = 'pictogram-wrapper';
						wrapper.setAttribute('aria-hidden', 'true');
						
						const button = document.createElement('button');
						button.className = 'pictogram-word';
						button.type = 'button';
						button.setAttribute('tabindex', '-1');
						button.setAttribute('data-pictogram-icon', pictogram.icon);
						button.setAttribute('data-pictogram-category', pictogram.category);
						
						// APLICAR MODOS BIÓNICO/RIMA DENTRO DEL BOTÓN DEL PICTOGRAMA
						if ($configuraciones.bionicMode || $configuraciones.rhymeMode) {
							// Calcular posiciones de biónico
							let bionicLength = 0;
							if ($configuraciones.bionicMode) {
								bionicLength = getHighlightLengthForWord(word.length, 0.5);
							}
							
							// Calcular posiciones de rima
							let rhymeStartIndex = -1;
							let rhymeColor = '';
							let rhymeBgColor = '';
							
							if ($configuraciones.rhymeMode && detectRhymes && applyRhymeHighlight) {
								const patterns = globalRhymePatterns;
								const pattern = patterns.find(p => p.word === cleanWord.toLowerCase());
								
								if (pattern && pattern.hasRhyme && pattern.ending) {
									const ending = pattern.ending.toLowerCase();
									const wordLower = cleanWord.toLowerCase();
									rhymeStartIndex = wordLower.lastIndexOf(ending);
									
									if (rhymeStartIndex === -1 || rhymeStartIndex + ending.length !== wordLower.length) {
										rhymeStartIndex = wordLower.length - ending.length;
									}
									
									if (rhymeStartIndex >= 0 && rhymeStartIndex < word.length) {
										const rgb = hexToRgbSimple(pattern.color);
										const lum = rgb ? (0.2126 * rgb[0]/255 + 0.7152 * rgb[1]/255 + 0.0722 * rgb[2]/255) : 0.5;
										
										if ($configuraciones.modoNoche) {
											rhymeColor = pattern.color;
											rhymeBgColor = rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.45)` : 'rgba(255,255,255,0.45)';
										} else {
											rhymeColor = lum > 0.4 ? darkenColorSimple(pattern.color, 0.4) : pattern.color;
											rhymeBgColor = rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.20)` : 'rgba(0,0,0,0.20)';
										}
									} else {
										rhymeStartIndex = -1;
									}
								}
							}
							
							// Aplicar estilos combinados a la palabra dentro del botón
							let currentSegment = '';
							let currentStyle = { isBionic: false, isRhyme: false };
							
							const flushSegment = () => {
								if (currentSegment.length === 0) return;
								
								const span = document.createElement('span');
								
								if (currentStyle.isRhyme) {
									span.style.backgroundColor = rhymeBgColor;
									span.style.borderBottom = `2px solid ${rhymeColor}`;
									span.style.padding = '0';
									span.style.borderRadius = '2px';
									
									if ($configuraciones.bionicMode && currentStyle.isBionic) {
										// Cuando ambos modos están activos, rima no debe tener negrita
										span.style.fontWeight = '400';
										span.style.color = bionicColor;
										span.className = 'bionic-highlight rhyme-highlight';
									} else if ($configuraciones.bionicMode) {
										// Modo biónico activo pero esta parte no es biónica
										span.style.fontWeight = '400';
										span.className = 'rhyme-highlight';
									} else {
										// Solo rima activa - preservar font-weight original completamente
										span.style.fontWeight = originalFontWeight;
										span.className = 'rhyme-highlight';
									}
								} else if (currentStyle.isBionic) {
									span.style.fontWeight = '700';
									span.style.color = bionicColor;
									span.className = 'bionic-highlight';
								} else {
									span.className = 'bionic-rest';
									// Si modo biónico está activo, usar font-weight normal para contraste
									// Si solo modo rima, preservar originalFontWeight
									if ($configuraciones.bionicMode) {
										span.style.fontWeight = '400';
									} else {
										span.style.fontWeight = originalFontWeight;
									}
								}
								
								span.textContent = currentSegment;
								button.appendChild(span);
								currentSegment = '';
							};
							
							for (let i = 0; i < word.length; i++) {
								const char = word[i];
								const isBionic = $configuraciones.bionicMode && i < bionicLength;
								const isRhyme = rhymeStartIndex >= 0 && i >= rhymeStartIndex;
								
								if (currentSegment.length > 0 && 
									(currentStyle.isBionic !== isBionic || currentStyle.isRhyme !== isRhyme)) {
									flushSegment();
								}
								
								currentSegment += char;
								currentStyle = { isBionic, isRhyme };
							}
							
							flushSegment();
						} else {
							// Sin modos biónico/rima, preservar font-weight original
							const span = document.createElement('span');
							span.style.fontWeight = originalFontWeight;
							span.textContent = word;
							button.appendChild(span);
						}
						
						const popover = document.createElement('div');
						popover.className = 'pictogram-popover';
						popover.setAttribute('role', 'tooltip');
						popover.setAttribute('aria-hidden', 'true');
						
						const iconSpan = document.createElement('span');
						iconSpan.className = 'pictogram-icon';
						iconSpan.textContent = pictogram.icon;
						
						popover.appendChild(iconSpan);
						wrapper.appendChild(button);
						wrapper.appendChild(popover);
						
						// Agregar texto oculto visualmente pero accesible para lectores de pantalla
						const srOnly = document.createElement('span');
						srOnly.className = 'sr-only';
						srOnly.textContent = word;
						srOnly.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;';
						wrapper.appendChild(srOnly);
						
						frag.appendChild(wrapper);
						
						// Función para determinar y actualizar dirección del popover
						const updatePopoverDirection = () => {
							const buttonRect = button.getBoundingClientRect();
							const viewportHeight = window.innerHeight;
							const popoverHeight = 100; // Aumentado para mayor margen
							const spaceAbove = buttonRect.top;
							const spaceBelow = viewportHeight - buttonRect.bottom;
							
							// Si hay más espacio abajo que arriba Y no hay suficiente espacio arriba
							if (spaceAbove < popoverHeight + 40 && spaceBelow > spaceAbove) {
								popover.classList.add('popover-below');
							} else {
								popover.classList.remove('popover-below');
							}
						};
						
						// Determinar dirección inicial
						setTimeout(updatePopoverDirection, 0);
						
						// Actualizar dirección al hacer scroll
						let scrollContainer = button.closest('.app-main');
						const handleScroll = () => updatePopoverDirection();
						if (!scrollContainer) {
							window.addEventListener('scroll', handleScroll, { passive: true });
						} else {
							scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
						}
						
						// Eventos para mostrar/ocultar popover
						button.addEventListener('mouseenter', () => {
							updatePopoverDirection();
							popover.classList.add('visible');
						});
						button.addEventListener('mouseleave', () => {
							popover.classList.remove('visible');
						});
						button.addEventListener('focus', () => {
							updatePopoverDirection();
							popover.classList.add('visible');
							popover.setAttribute('aria-hidden', 'false');
						});
						button.addEventListener('blur', () => {
							popover.classList.remove('visible');
							popover.setAttribute('aria-hidden', 'true');
						});
					}
					// NO HAY PICTOGRAMA: Aplicar solo biónico/rima
					else if ($configuraciones.bionicMode || $configuraciones.rhymeMode) {
						if (detectRhymes && applyRhymeHighlight) {
							// Usar los patrones globales de rima (ya detectados para toda la página)
							const patterns = globalRhymePatterns;
							const cleanWordForRhyme = word.toLowerCase().replace(/[.,;:!?¿¡()"""']/g, '');
							const pattern = patterns.find(p => p.word === cleanWordForRhyme);
							
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
								const wordLower = cleanWordForRhyme;
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
										// Cuando ambos modos están activos, rima no debe tener negrita
										span.style.fontWeight = '400';
										span.style.color = bionicColor;
										span.className = 'bionic-highlight rhyme-highlight';
									} else if ($configuraciones.bionicMode) {
										// Modo biónico activo pero esta parte no es biónica
										span.style.fontWeight = '400';
										span.className = 'rhyme-highlight';
									} else {
										// Solo rima activa - preservar font-weight original completamente
										span.style.fontWeight = originalFontWeight;
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
									// Si modo biónico está activo, usar font-weight normal para contraste
									// Si solo modo rima, preservar originalFontWeight
									if ($configuraciones.bionicMode) {
										span.style.fontWeight = '400';
									} else {
										span.style.fontWeight = originalFontWeight;
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
						}
					}
					// Sin ningún modo activo
					else {
						// Solo preservar font-weight si no hay modos activos
						// (esta rama solo se ejecuta si NO hay modo biónico ni rima)
						frag.appendChild(document.createTextNode(word));
					}
				});
				
				node.parentNode?.replaceChild(frag, node);
				return;
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					// Ignorar elementos SVG y sus hijos
					if ((node as Element).tagName === 'svg' || (node as Element).closest('svg')) return;
					// Ignorar elementos con clase .icono y sus hijos
					if ((node as Element).classList.contains('icono')) return;
					// Ignorar elementos ya procesados
					if ((node as Element).classList.contains('bionic-highlight') || (node as Element).classList.contains('rhyme-highlight') || (node as Element).classList.contains('pictogram-wrapper') || (node as Element).classList.contains('pictogram-word')) return;
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
			// Saltar elementos con data-no-adapt
			if (element.hasAttribute('data-no-adapt') || element.closest('[data-no-adapt]')) {
				return;
			}
			
			const originalHtml = element.getAttribute('data-original-html');
			if (originalHtml === null) return;
			const el = element as HTMLElement;
			// Si el elemento contiene highlights, restauramos al original guardado
			const hasHighlight = !!el.querySelector('.bionic-highlight, .rhyme-highlight, .pictogram-wrapper');
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

<!-- Estilos globales para modos de dislexia -->
<DyslexiaModes />

<svelte:head>
	<title>Coloreco - Tu estudio de pinturas e historias</title>
	<link rel="icon" href={logoColoreco} />
	<meta name="viewport" content="width=device-width,initial-scale=1" />

	<script type="text/javascript">
		(function(c,l,a,r,i,t,y){
			c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
			t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
			y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
		})(window, document, "clarity", "script", "uytoxvwwbe");
	</script>
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

	<div use:adaptiveObserver class="app-filtered-content" style={filterStyle}>
		
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
	<div id="narration-controls-container">
		<NarrationControl />
	</div>

	<!-- Botón de instrucciones (solo en páginas de juegos de historias) -->
	{#if necesitaBotonInstrucciones}
		<div id="floating-instructions-button" class="contenedor-flotante-i-instrucciones" style={filterStyle}>
			<button 
				class="boton-instrucciones pattern-yellow" 
				aria-label="Ver instrucciones"
				aria-keyshortcuts="Control + I" 
				title="Instrucciones (Control + I)" 
				type="button"
				onclick={abrirInstrucciones}
				use:clickSound
			>
				<span class="solo-lectores">Ver instrucciones</span>
				<IconoInstrucciones />
			</button>

			<!-- Texto visual indicativo -->
			<span class="texto-tecla">Ctrl + I</span>
		</div>
	{/if}

	<!-- Botón de volver fijo en la esquina inferior izquierda (oculto en página inicial) -->
	{#if !estaEnInicio && !estaEnEstudio}
		<div id="floating-back-button" class="contenedor-flotante-i" style={filterStyle}>
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
		<div id="floating-settings-button" class="contenedor-flotante-d" style={filterStyle}>
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

	<!-- Notificación de actualización del Service Worker -->
	<UpdateNotification />
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
	.contenedor-flotante-d,
	.contenedor-flotante-i-instrucciones {
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
	.contenedor-flotante-i-instrucciones { 
		left: calc(var(--spacing-base, 1rem) * 2.5);
		top: var(--spacing-base, 1rem);
		bottom: auto;
	}

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
	.boton-volver, .boton-configuracion, .boton-instrucciones {
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
	.boton-volver:hover, .boton-configuracion:hover, .boton-instrucciones:hover {
		transform: translateY(-2px);
		background: var(--fondo-botones-hover, #d1a700);
	}
	.boton-volver:active, .boton-configuracion:active, .boton-instrucciones:active {
		transform: translateY(0);
	}
	.boton-volver:focus, .boton-configuracion:focus, .boton-instrucciones:focus{
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