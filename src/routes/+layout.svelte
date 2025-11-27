<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import AccessibilityMenu from '$lib/components/layout/AccessibilityMenu.svelte';

	// Pequeño helper de accesibilidad: enfocar el contenido principal al navegar
	let mainEl: HTMLElement | null = null;

	// Props para recibir el contenido de las páginas hijas
	let { children } = $props();

	onMount(() => {
		// sin operación por ahora; mantiene la variable disponible para futura gestión de foco
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
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

	<!-- Menú de accesibilidad: recibe el contenido de la página para mostrarlo en el preview -->
	<AccessibilityMenu>
		{@render children()}
	</AccessibilityMenu>
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
		width: 48px;
		height: 48px;
		border-radius: var(--border-radius, 8px);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--accent, #0b6efd);
		color: white;
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

	@media (prefers-reduced-motion: reduce) {
		.settings-button { transition: none; }
	}
</style>
