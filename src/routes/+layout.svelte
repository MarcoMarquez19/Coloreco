<script lang="ts">
	import logoColoreco from '$lib/assets/Logo_coloreco.png';
	import { configuraciones } from '$lib/stores/settings';
	import LupaMagica from '$lib/components/a11y/LupaMagica.svelte';
	import EfectoLupa from '$lib/components/a11y/EfectoLupa.svelte';
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
		const esPaginaConBarra = $page.url.pathname === '/ajustes' || $page.url.pathname === '/seleccionar-estudio' || $page.url.pathname.startsWith('/estudio');
		document.body.style.setProperty('--body-display', esPaginaConBarra ? 'block' : 'flex');
	});
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

	<!-- Botón de volver fijo en la esquina inferior izquierda (oculto en página inicial) -->
	{#if !estaEnInicio && !estaEnEstudio}
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
	{#if !estaEnConfiguracion && !estaEnEstudio}
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