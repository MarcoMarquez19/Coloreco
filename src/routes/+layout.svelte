<script lang="ts">
	import logoColoreco from '$lib/assets/Logo_coloreco.png';
	import { configuraciones } from '$lib/stores/settings';
	import LupaMagica from '$lib/components/a11y/LupaMagica.svelte';
	import EfectoLupa from '$lib/components/a11y/EfectoLupa.svelte';
	import NarrationControl from '$lib/components/a11y/NarrationControl.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import '../lib/styles/themes.css';
	import IconoVolver from '$lib/components/iconos/IconoVolver.svelte';
	import IconoAccesibilidad from '$lib/components/iconos/Accesibilidad.svelte';

	// Pequeño helper de accesibilidad: enfocar el contenido principal al navegar
	let mainEl: HTMLElement | null = null;

	// Props para recibir el contenido de las páginas hijas
	let { children } = $props();

	// Computed theme: determina el valor del atributo data-theme basado en modoNoche y modoInverso
	let modoActual = $derived(
		$configuraciones.modoNoche 
			? ($configuraciones.modoInverso ? 'dark-inverted' : 'dark')
			: ''
	);

	// Detectar si estamos en la página de ajustes o en la página inicial
	let estaEnConfiguracion = $derived($page.url.pathname === '/ajustes');
	let estaEnInicio = $derived($page.url.pathname === '/');

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
		if (event.key === 'Escape') {
			volver();
		}
		if ((event.key === 'a' || event.key === 'A') && event.ctrlKey) {
        event.preventDefault(); // opcional, evita seleccionar todo
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

	$effect(() => {
		// Detecta si estás en /ajustes
		const esPaginaConBarra = $page.url.pathname === '/ajustes' || $page.url.pathname === '/seleccionar-estudio';
		document.body.style.setProperty('--body-display', esPaginaConBarra ? 'block' : 'flex');
	});

	// Efecto para aplicar configuraciones de tipografía
	$effect(() => {
		const root = document.documentElement;
		
		// Aplicar familia de fuente
		if ($configuraciones.fontFamily) {
			root.style.setProperty('--font-family', $configuraciones.fontFamily);
		}
		
		// Aplicar tamaño de fuente
		if ($configuraciones.fontSize) {
			root.style.setProperty('--font-size', `${$configuraciones.fontSize}px`);
		}
		
		// Aplicar espaciado entre letras
		if ($configuraciones.letterSpacing !== undefined) {
			root.style.setProperty('--letter-spacing', `${$configuraciones.letterSpacing}em`);
		}
		
		// Aplicar altura de línea
		if ($configuraciones.lineHeight) {
			root.style.setProperty('--line-height', `${$configuraciones.lineHeight}`);
		}
	});

	// Efecto para aplicar color de fondo y contraste
	$effect(() => {
		const root = document.documentElement;
		
		if ($configuraciones.backgroundColor) {
			root.style.setProperty('--background-color', $configuraciones.backgroundColor);
		}
		
		if ($configuraciones.contrastLevel) {
			root.setAttribute('data-contrast', $configuraciones.contrastLevel);
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
	function applyAccessibilityModes() {
		if (!mainEl) return;
		
		// Restaurar primero
		restoreOriginalText();
		
		const elements = mainEl.querySelectorAll('h1, h2, h3, h4, h5, h6, p, button:not(.control-button):not(.boton-volver):not(.boton-configuracion), label, span:not(.bionic-highlight):not(.bionic-rest):not(.rhyme-word)');
		
		elements.forEach((element) => {
			// Evitar procesar elementos ya procesados
			if (element.querySelector('.bionic-highlight') || element.querySelector('.rhyme-word')) return;
			
			const text = element.textContent?.trim();
			if (!text) return;
			
			// Guardar texto original
			element.setAttribute('data-original-text', text);
			
			// Procesar palabra por palabra
			const words = text.split(/\s+/);
			const processedWords = words.map((word, index) => {
				let processedWord = word;
				
				// Aplicar modo biónico si está activo
				if ($configuraciones.bionicMode) {
					if (word.length <= 2) {
						processedWord = `<span class="bionic-highlight">${word}</span>`;
					} else {
						const highlightLength = Math.ceil(word.length * 0.45);
						const highlighted = word.slice(0, highlightLength);
						const rest = word.slice(highlightLength);
						processedWord = `<span class="bionic-highlight">${highlighted}</span><span class="bionic-rest">${rest}</span>`;
					}
				}
				
				// Aplicar modo rima si está activo (envolver el resultado del biónico)
				if ($configuraciones.rhymeMode) {
					const rhymeGroup = index % 5;
					processedWord = `<span class="rhyme-word" data-rhyme-group="${rhymeGroup}">${processedWord}</span>`;
				}
				
				return processedWord;
			});
			
			(element as HTMLElement).innerHTML = processedWords.join(' ');
		});
	}

	// Función para restaurar texto original
	function restoreOriginalText() {
		if (!mainEl) return;
		
		const elements = mainEl.querySelectorAll('[data-original-text]');
		elements.forEach((element) => {
			const originalText = element.getAttribute('data-original-text');
			if (originalText) {
				(element as HTMLElement).textContent = originalText;
				element.removeAttribute('data-original-text');
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

<!-- Contenedor principal con variables CSS dinámicas conectadas al store -->
<div 
	class="app-layout"
	style="
		--font-size-base: {$configuraciones.multiplicadorTamanioFuente}rem;
		--spacing-base: {$configuraciones.multiplicadorEspaciado}rem;
		--border-radius: {$configuraciones.redondesBordes}px;
		--button-padding: calc(var(--spacing-base) * 0.6) calc(var(--spacing-base) * 1.2);
	"
>
	<main bind:this={mainEl} class="app-main">
		{@render children()}
	</main>

	<!-- Lupa Mágica: magnificación del contenido de la página -->
	{#if $configuraciones.lupaActivada}
	<div inert tabindex="-1">
		<EfectoLupa />
	</div>
	{/if}

	<!-- Control de narración -->
	<NarrationControl />

	<!-- Botón de volver fijo en la esquina inferior izquierda (oculto en página inicial) -->
	{#if !estaEnInicio}
		<div class="contenedor-flotante-i">
			<button 
				class="boton-volver" 
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
	{#if !estaEnConfiguracion}
		<div class="contenedor-flotante-d">
			<button 
				class="boton-configuracion" 
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
		display: var(--body-display, flex);
		flex-direction: column;
		align-content: center;
		justify-content: center;
	}

	.app-layout {
		display: flex;
		flex-direction: column;
		background: transparent;
		color: var(--fg, #111);
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
		/* Variables CSS base ahora se inyectan dinámicamente desde el store */
		font-size: var(--font-size-base, 1rem);
	}

	.app-main {
		flex: 1 1 auto;
		overflow-x: hidden;
		width: 100%;
		margin: var(--spacing-base, 1rem) auto;
		padding: 0 var(--spacing-base, 1rem) calc(var(--spacing-base, 1rem) * 2);
		box-sizing: border-box;
	}

	/* Botones del pie de página*/
	.contenedor-flotante-i {
		position: fixed;
		left: calc(var(--spacing-base, 1rem) * 2.5);
		bottom: var(--spacing-base, 1rem);
		display: flex;
		flex-direction: column; 
		align-items: center;    
		gap: 4px;              
		z-index: 100;
	}
	.contenedor-flotante-d {
		position: fixed;
		right: calc(var(--spacing-base, 1rem) * 2.5);
		bottom: var(--spacing-base, 1rem);
		display: flex;
		flex-direction: column; 
		align-items: center;    
		gap: 4px;              
		z-index: 100;
	}
	.texto-tecla {
		font-weight: 500;
		width: 100%;
		text-align: center;
		padding-top: 1rem;
		color: var(--color-texto,rgb(0, 0, 0));
		user-select: none; /* Evita que se seleccione el texto al dar doble clic */
		pointer-events: none; /* El clic traspasa al fondo */
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
</style>