<script lang="ts">
	import logoColoreco from '$lib/assets/Logo_coloreco.png';
	import { configuraciones } from '$lib/stores/settings';
	import { interpolateMatrix } from '$lib/constants/colorMatrices';
	import EfectoLupa from '$lib/components/a11y/EfectoLupa.svelte';
	import NarrationControl from '$lib/components/a11y/NarrationControl.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { obtenerSesionActual } from '$lib/db/artistas.service';
	import '../lib/styles/themes.css';
	import IconoVolver from '$lib/components/iconos/IconoVolver.svelte';
	import IconoAccesibilidad from '$lib/components/iconos/Accesibilidad.svelte';
	import FondoManchas from '$lib/components/fondos/FondoManchas.svelte';
	import FondoLogrosGeneral from '$lib/components/fondos/FondoLogrosGeneral.svelte';

	// Pequeño helper de accesibilidad: enfocar el contenido principal al navegar
	let mainEl: HTMLElement | null = null;

	// Props para recibir el contenido de las páginas hijas
	let { children } = $props();

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
	);

	//DETECTAR SI SE NECESITA EL FONDO DE LOGROS GENERAL
	let necesitaFondoLogrosGeneral = $derived($page.url.pathname===('/logros'));

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
		if (event.key === 'Escape') volver();
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

	// Guardia de rutas: si no hay artista activo solo permitir rutas públicas
	onMount(async () => {
		if (!browser) return;
		try {
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

	// Efecto para reaplicar los modos cuando cambia la página
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

	// Función para aplicar todos los modos activos de forma combinada
	async function applyAccessibilityModes() {
		if (!mainEl) return;
		
		// Restaurar primero
		restoreOriginalText();
		
		const elements = mainEl.querySelectorAll('h1, h2, h3, h4, h5, h6, .seccion-titulo, p, button:not(.control-button):not(.boton-volver):not(.boton-configuracion):not(.switch-toggle), label:not(.switch-knob), .switch-label, span:not(.bionic-highlight):not(.bionic-rest):not(.rhyme-highlight):not(.switch-knob):not(.control-valor), small, div.control-ayuda, .control-label span');
		
		// Importar funciones de rima si es necesario
		let detectRhymes: ((text: string) => any[]) | undefined;
		let applyRhymeHighlight: ((text: string, patterns: any[], backgroundColor?: string) => string) | undefined;
		let splitIntoSyllables: ((word: string) => string[]) | undefined;
		if ($configuraciones.rhymeMode || $configuraciones.bionicMode) {
			const rhymeModule = await import('$lib/logic/rhyme');
			detectRhymes = rhymeModule.detectRhymes;
			applyRhymeHighlight = rhymeModule.applyRhymeHighlight;
			splitIntoSyllables = rhymeModule.splitIntoSyllables;
		}
		
		elements.forEach((element) => {

			// Evitar procesar elementos ya procesados
			if (element.querySelector('.bionic-highlight') || element.querySelector('.rhyme-highlight')) return;
			
			const text = element.textContent?.trim();
			if (!text) return;
			
			// Guardar HTML original para poder restaurarlo exactamente
			element.setAttribute('data-original-html', (element as HTMLElement).innerHTML);
			
			let processedHTML = text;
			
			// Aplicar modo rima primero si está activo
			if ($configuraciones.rhymeMode && detectRhymes && applyRhymeHighlight) {
				const patterns = detectRhymes(text);
				const backgroundColor = $configuraciones.modoNoche 
					? ($configuraciones.modoInverso ? '#ffffff' : '#121212')
					: '#ffffff';
				processedHTML = applyRhymeHighlight(text, patterns, backgroundColor);
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
							
							words.forEach(word => {
								if (/^\s+$/.test(word)) {
									// Es espacio, mantenerlo
									container.appendChild(document.createTextNode(word));
								} else if (word.length > 0) {
									// Es palabra, aplicar formato biónico por sílabas
									const syllables = splitIntoSyllables(word);
									
									if (syllables.length === 0) {
										container.appendChild(document.createTextNode(word));
									} else if (syllables.length === 1 && word.length <= 3) {
										// Palabra corta, resaltar completa
										const span = document.createElement('span');
										span.className = 'bionic-highlight';
										span.style.cssText = 'color: inherit; font-weight: 700;';
										span.textContent = word;
										container.appendChild(span);
									} else {
										// Resaltar primera sílaba
										const firstSyllable = syllables[0];
										const rest = word.slice(firstSyllable.length);
										
										const highlightSpan = document.createElement('span');
										highlightSpan.className = 'bionic-highlight';
										highlightSpan.style.cssText = 'color: inherit; font-weight: 700;';
										highlightSpan.textContent = firstSyllable;
										container.appendChild(highlightSpan);
										
										if (rest) {
											const restSpan = document.createElement('span');
											restSpan.className = 'bionic-rest';
											restSpan.style.cssText = 'color: inherit; font-weight: 400;';
											restSpan.textContent = rest;
											container.appendChild(restSpan);
										}
									}
								}
							});
							
							if (node.parentNode) {
								node.parentNode.replaceChild(container, node);
							}
						} else if (node.nodeType === Node.ELEMENT_NODE && (node as Element).classList.contains('rhyme-highlight')) {
							// Procesar texto dentro de spans de rima sin destruir el span
							Array.from(node.childNodes).forEach(processTextNode);
						} else if (node.childNodes.length > 0) {
							// Recursivamente procesar hijos
							Array.from(node.childNodes).forEach(processTextNode);
						}
					};
					
					processTextNode(tempDiv);
					processedHTML = tempDiv.innerHTML;
				} else {
					// Aplicar biónico simple sin rima
					if (!splitIntoSyllables) return;
					const words = text.split(/(\s+)/);
					
					const processedWords = words.map((word) => {
						if (/^\s+$/.test(word)) {
							return word;
						}
						
						if (word.length === 0) return word;
						
						const syllables = splitIntoSyllables(word);
						
						if (syllables.length === 0) {
							return word;
						} else if (syllables.length === 1 && word.length <= 3) {
							// Palabra corta, resaltar completa
							return `<span class="bionic-highlight" style="font-weight: 700;">${word}</span>`;
						} else {
							// Resaltar primera sílaba
							const firstSyllable = syllables[0];
							const rest = word.slice(firstSyllable.length);
							return `<span class="bionic-highlight" style="font-weight: 700;">${firstSyllable}</span><span class="bionic-rest" style="font-weight: 400;">${rest}</span>`;
						}
					});
					
					processedHTML = processedWords.join('');
				}
			}

			// En lugar de reemplazar el innerHTML completo (que rompe la estructura), procesamos
			// cada nodo de texto individualmente y reemplazamos solo lo necesario.
			const createBionicFragment = (text: string) => {
				const frag = document.createDocumentFragment();
				if (!splitIntoSyllables) { frag.appendChild(document.createTextNode(text)); return frag; }
				const tokens = text.split(/(\s+)/);
				tokens.forEach(token => {
					if (/^\s+$/.test(token)) { frag.appendChild(document.createTextNode(token)); return; }
					const syllables = splitIntoSyllables(token);
					if (!syllables || syllables.length === 0) { frag.appendChild(document.createTextNode(token)); return; }
					if (syllables.length === 1 && token.length <= 3) {
						const s = document.createElement('span'); s.className = 'bionic-highlight'; s.textContent = token; frag.appendChild(s); return;
					}
					const first = syllables[0]; const rest = token.slice(first.length);
					const h = document.createElement('span'); h.className = 'bionic-highlight'; h.textContent = first; frag.appendChild(h);
					if (rest) { const r = document.createElement('span'); r.className = 'bionic-rest'; r.textContent = rest; frag.appendChild(r); }
				});
				return frag;
			};

			const processNode = (node: Node) => {
				if (node.nodeType === Node.TEXT_NODE) {
					const txt = node.textContent || '';
					if (!txt.trim()) return;
					if ($configuraciones.rhymeMode && detectRhymes && applyRhymeHighlight) {
						const patterns = detectRhymes(txt);
						const backgroundColor = $configuraciones.modoNoche ? ($configuraciones.modoInverso ? '#ffffff' : '#121212') : '#ffffff';
						const html = applyRhymeHighlight(txt, patterns, backgroundColor);
						const tmp = document.createElement('div'); tmp.innerHTML = html;
						if ($configuraciones.bionicMode) {
							const walk = (n: Node) => {
								if (n.nodeType === Node.TEXT_NODE) {
									const frag = createBionicFragment(n.textContent || ''); n.parentNode?.replaceChild(frag, n);
								} else if (n.nodeType === Node.ELEMENT_NODE && (n as Element).classList.contains('rhyme-highlight')) {
									Array.from(n.childNodes).forEach(walk);
								} else if (n.childNodes && n.childNodes.length) { Array.from(n.childNodes).forEach(walk); }
							};
							Array.from(tmp.childNodes).forEach(walk);
						}
						const frag = document.createDocumentFragment(); Array.from(tmp.childNodes).forEach(c => frag.appendChild(c.cloneNode(true)));
						node.parentNode?.replaceChild(frag, node);
						return;
					}
					if ($configuraciones.bionicMode) { const f = createBionicFragment(txt); node.parentNode?.replaceChild(f, node); return; }
					return;
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					if ((node as Element).classList.contains('bionic-highlight') || (node as Element).classList.contains('rhyme-highlight')) return;
					Array.from(node.childNodes).forEach(processNode);
				}
			};

			Array.from(element.childNodes).forEach(processNode);
		});
	}

	// Función para restaurar texto original
	function restoreOriginalText() {
		if (!mainEl) return;
		
		const elements = mainEl.querySelectorAll('[data-original-html]');
		elements.forEach((element) => {
			const originalHtml = element.getAttribute('data-original-html');
			if (originalHtml !== null) {
				(element as HTMLElement).innerHTML = originalHtml;
				element.removeAttribute('data-original-html');
			}
		});
	}
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
				onclick={volver}
			>
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
				onclick={abrirConfiguracion}
			>
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
		width: 75px;
		height: 75px;
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
	
	/* Patrón para ROJO / PELIGRO / ERROR: Rayas diagonales densas */
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

	/* Patrón para VERDE / ÉXITO: Puntos */
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

	/* Patrón para AZUL / INFO: Líneas verticales */
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

	/* Patrón para AMARILLO / ADVERTENCIA: Zigzag (simulado con gradientes cruzados) */
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