<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import AccessibilityMenu from '$lib/components/layout/AccessibilityMenu.svelte';
	import { interpolateMatrix } from '$lib/constants/colorMatrices';

	// Pequeño helper de accesibilidad: enfocar el contenido principal al navegar
	let mainEl: HTMLElement | null = null;

	// Props para recibir el contenido de las páginas hijas
	let { children } = $props();

	// Cálculo reactivo de la matriz de color
	let matrixValues = $derived(interpolateMatrix(settings.colorBlindness, settings.intensity));

	// Clases dinámicas para el wrapper principal
	let wrapperClasses = $derived([
		'app-layout',
		settings.textures ? 'enable-textures' : '',
		settings.contrast === 'high' ? 'enable-high-contrast' : ''
	].filter(Boolean).join(' '));

	onMount(() => {
		// sin operación por ahora; mantiene la variable disponible para futura gestión de foco
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width,initial-scale=1" />
</svelte:head>

<!-- Filtros SVG para simulación de daltonismo y alto contraste inteligente -->
<svg style="position: absolute; width: 0; height: 0; overflow: hidden;" aria-hidden="true">
	<defs>
		<!-- Filtro de Daltonismo (CVD) -->
		<filter id="cvd-filter" color-interpolation-filters="sRGB">
			<feColorMatrix type="matrix" values={matrixValues} />
		</filter>

		<!-- Filtro de Alto Contraste Inteligente -->
		<!-- Aumenta la separación entre tonos sin quemar los negros puros ni los blancos -->
		<filter id="smart-contrast-filter" color-interpolation-filters="sRGB">
			<feComponentTransfer>
				<!-- Pendiente 1.2 aumenta el contraste suavemente, intercept -0.1 oscurece medios tonos -->
				<feFuncR type="linear" slope="1.2" intercept="-0.1"/>
				<feFuncG type="linear" slope="1.2" intercept="-0.1"/>
				<feFuncB type="linear" slope="1.2" intercept="-0.1"/>
			</feComponentTransfer>
		</filter>
	</defs>
</svg>

<!-- Contenedor principal con variables CSS dinámicas conectadas al store -->
<div 
	class={wrapperClasses}
	style="
		--font-size-base: {settings.fontSizeMultiplier}rem;
		--spacing-base: {settings.spacingMultiplier}rem;
		--border-radius: {settings.borderRadius}px;
		--button-padding: calc(var(--spacing-base) * 0.6) calc(var(--spacing-base) * 1.2);
	"
>
	<!-- Aplicación de filtros en cadena: CVD primero, luego Contraste si es necesario -->
	<div 
		class="app-content-wrapper"
		style="filter: {settings.colorBlindness !== 'none' ? 'url(#cvd-filter)' : ''} {settings.contrast === 'high' ? 'url(#smart-contrast-filter)' : ''};"
	>
		<main bind:this={mainEl} class="app-main">
			{@render children()}
		</main>

		<!-- Botón de ajustes fijo en la esquina inferior derecha -->
		<button 
			class="settings-button" 
			aria-label="Abrir ajustes" 
			title="Ajustes" 
			type="button"
			onclick={settings.toggleMenu}
		>
			<span class="sr-only">Abrir ajustes</span>
			<!-- Icono SVG de engranaje incrustado -->
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
				<path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" fill="currentColor"/>
				<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.28 17.88l.06-.06c.4-.4.5-1.03.33-1.57A1.65 1.65 0 0 0 1.17 14H1a2 2 0 1 1 0-4h.17c.7 0 1.3-.45 1.57-1.08.17-.54.07-1.17-.33-1.57L1.88 6.12A2 2 0 1 1 4.71 3.29l.06.06c.4.4 1.03.5 1.57.33.63-.27 1.08-.87 1.08-1.57V1a2 2 0 1 1 4 0v.17c0 .7.45 1.3 1.08 1.57.54.17 1.17.07 1.57-.33l.06-.06A2 2 0 1 1 19.4 4.71l-.06.06c-.4.4-.5 1.03-.33 1.57.27.63.87 1.08 1.57 1.08H23a2 2 0 1 1 0 4h-.17c-.7 0-1.3.45-1.57 1.08-.17.54-.07 1.17.33 1.57l.06.06A2 2 0 1 1 19.4 15z" fill="currentColor" opacity="0.9"/>
			</svg>
		</button>
		
		<AccessibilityMenu>
			{@render children()}
		</AccessibilityMenu>
	</div>
</div>

<style>
	:global(html, body, #svelte) {
		height: 100%;
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

	/* =========================================
	   SISTEMA DE ALTO CONTRASTE
	   ========================================= */
	/* Variables CSS que cambian cuando se activa el modo */
	
	.app-layout {
		/* Variables por defecto */
		--border-color: #e0e0e0;
		--text-color: #333;
		--text-secondary: #666;
		--border-width: 1px;
		
		min-height: 100vh;
		background-color: #f8f9fa;
		color: var(--text-color);
		font-family: system-ui, -apple-system, sans-serif;
		font-size: var(--font-size-base, 1rem);
	}

	/* Sobrescrituras para Alto Contraste */
	.app-layout.enable-high-contrast {
		--border-color: #000000; /* Bordes negros puros */
		--text-color: #000000;   /* Texto negro puro */
		--text-secondary: #000000; /* No hay grises en texto secundario */
		--border-width: 2px;     /* Bordes más gruesos */
		
		/* Forzar colores de fondo más claros para maximizar contraste */
		background-color: #ffffff;
	}

	/* Aplicación global de variables de borde para elementos comunes */
	:global(.enable-high-contrast button),
	:global(.enable-high-contrast input),
	:global(.enable-high-contrast .card),
	:global(.enable-high-contrast .panel) {
		border-width: var(--border-width) !important;
		border-color: var(--border-color) !important;
	}

	.app-content-wrapper {
		width: 100%;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		transition: filter 0.3s ease;
	}

	.app-main {
		flex: 1;
		padding: var(--spacing-base);
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
	}

	.settings-button {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		background: white;
		border: var(--border-width) solid var(--border-color);
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #555;
		transition: all 0.2s ease;
		z-index: 9000;
	}

	.settings-button:hover {
		transform: scale(1.05);
		box-shadow: 0 6px 16px rgba(0,0,0,0.15);
		color: #000;
	}
	
	.sr-only {
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
</style>
