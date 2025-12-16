<script lang="ts">
	import logoColoreco from '$lib/assets/Logo_coloreco.png';
	import { configuraciones } from '$lib/stores/settings';
	import { interpolateMatrix } from '$lib/constants/colorMatrices';
	import EfectoLupa from '$lib/components/a11y/EfectoLupa.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { obtenerSesionActual } from '$lib/db/artistas.service';
	import '../lib/styles/themes.css';
	import IconoVolver from '$lib/components/iconos/IconoVolver.svelte';
	import IconoAccesibilidad from '$lib/components/iconos/Accesibilidad.svelte';

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

	$effect(() => {
		// Detecta si estás en /ajustes o páginas con barra lateral para ajustar el display del body
		const esPaginaConBarra = $page.url.pathname === '/ajustes' || $page.url.pathname === '/seleccionar-estudio' || $page.url.pathname.startsWith('/estudio') || $page.url.pathname.startsWith('/galeria');
		document.body.style.setProperty('--body-display', esPaginaConBarra ? 'block' : 'flex');
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
		display: var(--body-display, flex);
		flex-direction: column;
		align-content: center;
		justify-content: center;
		margin: 0;
		overflow: hidden; /* Evita scroll del body cuando hay filtros */
	}

	.app-layout {
		display: flex;
		flex-direction: column;
		background: transparent;
		min-height: 100vh;
		height: 100vh; /* Fija altura al 100% del viewport */
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
		display: var(--body-display,flex);
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