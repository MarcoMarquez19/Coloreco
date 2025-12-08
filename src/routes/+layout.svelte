<script lang="ts">
	import logoColoreco from '$lib/assets/Logo_coloreco.png';
	import { settings } from '$lib/stores/settings';
	import LupaMagica from '$lib/components/a11y/LupaMagica.svelte';
	import EfectoLupa from '$lib/components/a11y/EfectoLupa.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import '../lib/styles/themes.css';
	import IconoVolver from '$lib/components/iconos/IconoVolver.svelte';

	// Pequeño helper de accesibilidad: enfocar el contenido principal al navegar
	let mainEl: HTMLElement | null = null;

	// Props para recibir el contenido de las páginas hijas
	let { children } = $props();

	// Computed theme: determina el valor del atributo data-theme basado en modoNoche y modoInverso
	let modoActual = $derived(
		$settings.modoNoche 
			? ($settings.modoInverso ? 'dark-inverted' : 'dark')
			: ''
	);

	// Detectar si estamos en la página de ajustes o en la página inicial
	let estaEnConfiguracion = $derived($page.url.pathname === '/ajustes');
	let estaEnInicio = $derived($page.url.pathname === '/');

	// Funciones de navegación
	function abrirConfiguracion() {
		goto('/ajustes');
	}
	function volver() {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			goto('/');
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
</script>

<svelte:head>
	<title>Coloreco - Tu estudio de pinturas e historias</title>
	<link rel="icon" href={logoColoreco} />
	<meta name="viewport" content="width=device-width,initial-scale=1" />
</svelte:head>

<!-- Contenedor principal con variables CSS dinámicas conectadas al store -->
<div 
	class="app-layout"
	style="
		--font-size-base: {$settings.fontSizeMultiplier}rem;
		--spacing-base: {$settings.spacingMultiplier}rem;
		--border-radius: {$settings.borderRadius}px;
		--button-padding: calc(var(--spacing-base) * 0.6) calc(var(--spacing-base) * 1.2);
	"
>
	<main bind:this={mainEl} class="app-main">
		{@render children()}
	</main>

	<!-- Lupa Mágica: magnificación del contenido de la página -->
	{#if $settings.lupaActivada}
		<EfectoLupa />
	{/if}

	<!-- Botón de volver fijo en la esquina inferior izquierda (oculto en página inicial) -->
	{#if !estaEnInicio}
		<button 
			class="boton-volver" 
			aria-label="Volver a la página anterior" 
			title="Volver" 
			type="button"
			onclick={volver}
		>
			<span class="solo-lectores">Volver a la página anterior</span>
			
			<!-- 2. Usamos el componente. No necesita src -->
			<IconoVolver />
		</button>
	{/if}
	
	<!-- Botón de ajustes fijo en la esquina inferior derecha (oculto en /ajustes) -->
	{#if !estaEnConfiguracion}
		<button 
			class="settings-button" 
			aria-label="Abrir ajustes" 
			title="Ajustes" 
			type="button"
			onclick={abrirConfiguracion}
		>
			<span class="sr-only">Abrir ajustes</span>
			<!-- Icono SVG de engranaje incrustado -->
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
				<path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" fill="currentColor"/>
				<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.28 17.88l.06-.06c.4-.4.5-1.03.33-1.57A1.65 1.65 0 0 0 1.17 14H1a2 2 0 1 1 0-4h.17c.7 0 1.3-.45 1.57-1.08.17-.54.07-1.17-.33-1.57L1.88 6.12A2 2 0 1 1 4.71 3.29l.06.06c.4.4 1.03.5 1.57.33.63-.27 1.08-.87 1.08-1.57V1a2 2 0 1 1 4 0v.17c0 .7.45 1.3 1.08 1.57.54.17 1.17.07 1.57-.33l.06-.06A2 2 0 1 1 19.4 4.71l-.06.06c-.4.4-.5 1.03-.33 1.57.27.63.87 1.08 1.57 1.08H23a2 2 0 1 1 0 4h-.17c-.7 0-1.3.45-1.57 1.08-.17.54-.07 1.17.33 1.57l.06.06A2 2 0 1 1 19.4 15z" fill="currentColor" opacity="0.9"/>
			</svg>
		</button>
	{/if}
</div>

<style>
	:global(html, body, #svelte) {
		height: 100%;
	}

	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg, #fff);
		color: var(--fg, #111);
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
		/* Variables CSS base ahora se inyectan dinámicamente desde el store */
		font-size: var(--font-size-base, 1rem);
	}

	.app-main {
		flex: 1 1 auto;
		width: 100%;
		max-width: 1100px;
		margin: var(--spacing-base, 1rem) auto;
		padding: 0 var(--spacing-base, 1rem) calc(var(--spacing-base, 1rem) * 2);
		box-sizing: border-box;
	}

	.settings-button {
		position: fixed;
		right: var(--spacing-base, 1rem);
		bottom: var(--spacing-base, 1rem);
		width: 68px;
		height: 68px;
		border-radius: var(--border-radius, 8px);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--accent, #0b6efd);
		color: var(--color,rgb(255, 255, 255));
		border: none;
		box-shadow: 0 6px 18px rgba(11,110,253,0.18);
		cursor: pointer;
		transition: transform 120ms ease, box-shadow 120ms ease;
	}

	.settings-button:hover {
		transform: translateY(-2px);
	}

	.settings-button:active {
		transform: translateY(0);
	}

	.settings-button:focus {
		outline: 3px solid #000000;
		outline-offset: 3px;
	}

	/* Botón de volver en esquina inferior izquierda */
	.boton-volver {
		position: fixed;
		left: var(--spacing-base, 1rem);
		bottom: var(--spacing-base, 1rem);
		width: 68px;
		height: 68px;
		border-radius: var(--border-radius, 8px);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--fondo-botones, #e49124);
		color: var(--color, #000000);
		border: none;
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
		cursor: pointer;
		transition: transform 120ms ease, box-shadow 120ms ease;
		z-index: 100;
	}
	.boton-volver:hover {
		transform: translateY(-2px);
		background: var(--fondo-botones-hover, #7c4b0c);
	}

	.boton-volver:active {
		transform: translateY(0);
	}

	.boton-volver:focus{
		outline: var(--borde-botones, 3px solid #000000);
		outline-offset: 3px;
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

	@media (prefers-reduced-motion: reduce) {
		.settings-button, .boton-volver { transition: none; }
	}
</style>
