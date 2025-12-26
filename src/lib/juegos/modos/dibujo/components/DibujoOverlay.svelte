<!--
  DibujoOverlay.svelte
  Capa de accesibilidad para el modo de dibujo con SVG interactivo.
  Carga dinámicamente un SVG con zonas semánticas y permite navegación por Tab.
  Proporciona navegación por teclado, gestión de foco y roles/labels ARIA.
-->

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	// Props
	interface Props {
		/** Ruta al SVG de accesibilidad de la escena */
		rutaSvgAccesibilidad?: string;
	}

	let { rutaSvgAccesibilidad }: Props = $props();

	// Dispatcher para comunicar eventos de accesibilidad
	const dispatch = createEventDispatcher<{
		seleccionar: { x: number; y: number; zona: string };
		zonaEnfocada: { zona: string; label: string };
	}>();

	// Estado del overlay - siempre visible
	let contenedorOverlay: HTMLDivElement | null = $state(null);
	let contenedorSvg: HTMLDivElement | null = $state(null);
	let svgCargado = $state<boolean>(false);
	let errorCarga = $state<string | null>(null);
	let modoNavegacionActivo = $state<boolean>(false);
	let zonaActualmenteFocusada = $state<string>('');

	/**
	 * Activa el modo de navegación por teclado
	 */
	export function activarNavegacion() {
		modoNavegacionActivo = true;
		// Enfocar el primer elemento si existe
		if (contenedorSvg) {
			const primerElemento = contenedorSvg.querySelector('[tabindex="0"]') as HTMLElement;
			if (primerElemento) {
				primerElemento.focus();
			}
		}
		console.log('[DibujoOverlay] Modo de navegación activado');
	}

	/**
	 * Desactiva el modo de navegación por teclado
	 */
	export function desactivarNavegacion() {
		modoNavegacionActivo = false;
		zonaActualmenteFocusada = '';
		// Quitar foco de elementos SVG
		if (document.activeElement && contenedorSvg?.contains(document.activeElement)) {
			(document.activeElement as HTMLElement).blur();
		}
		console.log('[DibujoOverlay] Modo de navegación desactivado');
	}

	/**
	 * Alterna el modo de navegación
	 */
	export function alternarOverlay() {
		if (modoNavegacionActivo) {
			desactivarNavegacion();
		} else {
			activarNavegacion();
		}
	}

	/**
	 * Enfoca la primera zona disponible
	 */
	function enfocarPrimeraZona() {
		const primeraZona = contenedorSvg?.querySelector('[tabindex="0"]') as HTMLElement;
		if (primeraZona) {
			primeraZona.focus();
		}
	}

	/**
	 * Enfoca la última zona disponible
	 */
	function enfocarUltimaZona() {
		const zonas = contenedorSvg?.querySelectorAll('[tabindex="0"]');
		if (zonas && zonas.length > 0) {
			(zonas[zonas.length - 1] as HTMLElement).focus();
		}
	}

	/**
	 * Carga el SVG de accesibilidad desde la ruta especificada
	 */
	async function cargarSvgAccesible() {
		if (!rutaSvgAccesibilidad || !contenedorSvg) {
			console.warn('[DibujoOverlay] No hay ruta de SVG o contenedor no disponible');
			return;
		}

		try {
			svgCargado = false;
			errorCarga = null;

			const respuesta = await fetch(rutaSvgAccesibilidad);
			
			if (!respuesta.ok) {
				throw new Error(`Error HTTP: ${respuesta.status}`);
			}

			const textoSvg = await respuesta.text();
			
			// Inyectar el SVG en el contenedor
			contenedorSvg.innerHTML = textoSvg;

			// Ajustar tamaño del SVG al contenedor
			ajustarTamanoSvg();

			// Configurar elementos interactivos
			configurarElementosSvg();

			svgCargado = true;
			console.log('[DibujoOverlay] SVG accesible cargado correctamente');
		} catch (error) {
			console.error('[DibujoOverlay] Error al cargar SVG:', error);
			errorCarga = 'No se pudo cargar el mapa de accesibilidad';
			svgCargado = false;
		}
	}

	/**
	 * Ajusta el tamaño del SVG al contenedor (similar a DibujoCanvas)
	 */
	function ajustarTamanoSvg() {
		if (!contenedorSvg || !contenedorOverlay) return;

		const svg = contenedorSvg.querySelector('svg');
		if (!svg) return;

		// Obtener dimensiones del contenedor
		const width = contenedorOverlay.offsetWidth;
		const height = contenedorOverlay.offsetHeight;

		// Configurar el SVG para que ocupe todo el contenedor
		svg.setAttribute('width', '100%');
		svg.setAttribute('height', '100%');
		svg.style.position = 'absolute';
		svg.style.top = '0';
		svg.style.left = '0';

		console.log(`[DibujoOverlay] SVG ajustado a ${width}x${height}px`);
	}

	/**
	 * Configura los elementos del SVG para hacerlos interactivos
	 */
	function configurarElementosSvg() {
		if (!contenedorSvg) return;

		// Encontrar todos los elementos con tabindex
		const elementos = contenedorSvg.querySelectorAll('[tabindex]');
		
		elementos.forEach((elemento, index) => {
			// Asegurar que el elemento sea enfocable
			if (!elemento.hasAttribute('tabindex')) {
				elemento.setAttribute('tabindex', '0');
			}

			// Añadir índice para navegación
			elemento.setAttribute('data-indice', index.toString());

			// Agregar eventos
			elemento.addEventListener('keydown', manejarTecladoEnZona);
			elemento.addEventListener('focus', manejarFocoZona);
			elemento.addEventListener('blur', manejarBlurZona);
			// NO agregar click - dejamos que pase al canvas
		});

		console.log(`[DibujoOverlay] Configurados ${elementos.length} elementos interactivos`);
	}

	/**
	 * Navega al siguiente elemento (circular)
	 */
	function navegarSiguiente() {
		const elementos = contenedorSvg?.querySelectorAll('[tabindex="0"]');
		if (!elementos || elementos.length === 0) return;

		const elementoActual = document.activeElement as HTMLElement;
		let indice = -1;

		// Encontrar el índice del elemento actual
		for (let i = 0; i < elementos.length; i++) {
			if (elementos[i] === elementoActual) {
				indice = i;
				break;
			}
		}

		// Calcular el siguiente índice (circular)
		const siguienteIndice = (indice + 1) % elementos.length;
		(elementos[siguienteIndice] as HTMLElement).focus();
	}

	/**
	 * Navega al elemento anterior (circular)
	 */
	function navegarAnterior() {
		const elementos = contenedorSvg?.querySelectorAll('[tabindex="0"]');
		if (!elementos || elementos.length === 0) return;

		const elementoActual = document.activeElement as HTMLElement;
		let indice = -1;

		// Encontrar el índice del elemento actual
		for (let i = 0; i < elementos.length; i++) {
			if (elementos[i] === elementoActual) {
				indice = i;
				break;
			}
		}

		// Calcular el índice anterior (circular)
		const indiceAnterior = indice === 0 ? elementos.length - 1 : indice - 1;
		(elementos[indiceAnterior] as HTMLElement).focus();
	}

	/**
	 * Maneja el evento de teclado en una zona
	 */
	function manejarTecladoEnZona(evento: Event) {
		const keyEvent = evento as KeyboardEvent;
		const elemento = evento.target as SVGElement;

		// Escape: desactivar modo navegación
		if (keyEvent.key === 'Escape') {
			keyEvent.preventDefault();
			desactivarNavegacion();
			return;
		}

		// Shift + D: navegar al siguiente elemento
		if (keyEvent.shiftKey && (keyEvent.key === 'D' || keyEvent.key === 'd')) {
			keyEvent.preventDefault();
			navegarSiguiente();
			return;
		}

		// Shift + A: navegar al elemento anterior
		if (keyEvent.shiftKey && (keyEvent.key === 'A' || keyEvent.key === 'a')) {
			keyEvent.preventDefault();
			navegarAnterior();
			return;
		}

		// Home: ir a primera zona
		if (keyEvent.key === 'Home') {
			keyEvent.preventDefault();
			enfocarPrimeraZona();
			return;
		}

		// End: ir a última zona
		if (keyEvent.key === 'End') {
			keyEvent.preventDefault();
			enfocarUltimaZona();
			return;
		}

		// Enter o Espacio: seleccionar zona
		if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
			keyEvent.preventDefault();
			seleccionarZona(elemento);
		}
	}

	/**
	 * Maneja el foco en una zona
	 */
	function manejarFocoZona(evento: Event) {
		const elemento = evento.target as SVGElement;
		const zona = elemento.getAttribute('data-zona') || elemento.id;
		const label = elemento.getAttribute('aria-label') || zona;

		// Actualizar estado
		zonaActualmenteFocusada = label;

		// Emitir evento de zona enfocada
		dispatch('zonaEnfocada', { zona, label });

		// Aplicar efecto visual
		elemento.classList.add('zona-enfocada');

		console.log(`[DibujoOverlay] Zona enfocada: ${label}`);
	}

	/**
	 * Maneja la pérdida de foco en una zona
	 */
	function manejarBlurZona(evento: Event) {
		const elemento = evento.target as SVGElement;
		
		// Remover efecto visual
		elemento.classList.remove('zona-enfocada');
	}

	/**
	 * Selecciona una zona y emite el evento correspondiente
	 */
	function seleccionarZona(elemento: SVGElement) {
		const zona = elemento.getAttribute('data-zona') || elemento.id;
		
		// Verificar que el elemento sea un SVGGraphicsElement para usar getBBox
		if (!('getBBox' in elemento)) {
			console.warn('[DibujoOverlay] El elemento no soporta getBBox');
			return;
		}
		
		// Obtener el bounding box del elemento
		const bbox = (elemento as SVGGraphicsElement).getBBox();
		const centerX = bbox.x + bbox.width / 2;
		const centerY = bbox.y + bbox.height / 2;

		// Convertir coordenadas SVG a coordenadas del canvas
		const svg = contenedorSvg?.querySelector('svg');
		if (svg) {
			const viewBox = svg.viewBox.baseVal;
			const contenedorRect = contenedorSvg?.getBoundingClientRect();
			
			if (contenedorRect) {
				// Escalar coordenadas SVG a coordenadas de pantalla
				const scaleX = contenedorRect.width / viewBox.width;
				const scaleY = contenedorRect.height / viewBox.height;
				
				const x = centerX * scaleX;
				const y = centerY * scaleY;

				dispatch('seleccionar', { x, y, zona });
				console.log(`[DibujoOverlay] Zona seleccionada: ${zona} en (${x}, ${y})`);
			}
		}
	}

	/**
	 * Maneja atajos de teclado globales
	 * Shift + D/d: activa navegación (o siguiente si ya está activa)
	 * Shift + A/a: toggle del overlay (o anterior si ya está activa)
	 * En modo navegación: Shift + D/d para siguiente, Shift + A/a para anterior
	 */
	function manejarTecladoGlobal(evento: KeyboardEvent) {
		// Shift + D para activar navegación o ir al siguiente
		if (evento.shiftKey && (evento.key === 'D' || evento.key === 'd')) {
			evento.preventDefault();
			
			// Si no estamos en modo navegación, activar
			if (!modoNavegacionActivo && svgCargado) {
				activarNavegacion();
			} 
			// Si ya estamos en modo navegación, ir al siguiente
			else if (modoNavegacionActivo) {
				navegarSiguiente();
			}
		}

		// Shift + A para toggle del overlay o ir al anterior
		if (evento.shiftKey && (evento.key === 'A' || evento.key === 'a')) {
			evento.preventDefault();
			
			// Si no estamos en modo navegación, activar/desactivar
			if (!modoNavegacionActivo || !contenedorSvg?.contains(document.activeElement as Node)) {
				alternarOverlay();
			}
			// Si ya estamos en modo navegación, ir al anterior
			else if (modoNavegacionActivo) {
				navegarAnterior();
			}
		}
	}

	// Efecto reactivo: cargar SVG cuando cambia la ruta
	$effect(() => {
		if (rutaSvgAccesibilidad && contenedorSvg) {
			cargarSvgAccesible();
		}
	});

	// Efecto reactivo: ajustar tamaño cuando cambia el contenedor
	$effect(() => {
		if (contenedorOverlay && svgCargado) {
			// Escuchar cambios de tamaño
			const resizeObserver = new ResizeObserver(() => {
				ajustarTamanoSvg();
			});
			resizeObserver.observe(contenedorOverlay);
			return () => resizeObserver.disconnect();
		}
	});

</script>

<!-- Event listener global para teclado -->
<svelte:window onkeydown={manejarTecladoGlobal} />

<!-- Overlay de accesibilidad - SIEMPRE VISIBLE -->
<div 
	class="overlay-accesibilidad"
	class:navegacion-activa={modoNavegacionActivo}
	bind:this={contenedorOverlay}
	role="application"
	aria-label="Capa de accesibilidad del lienzo de dibujo"
>
	<!-- Información de estado para lectores de pantalla -->
	<div class="info-sr-only" aria-live="assertive" aria-atomic="true">
		{#if zonaActualmenteFocusada}
			<p>Zona enfocada: {zonaActualmenteFocusada}</p>
		{:else if modoNavegacionActivo}
			<p>Modo de navegación por zonas activado. Use Shift+D para siguiente, Shift+A para anterior, Enter para seleccionar, Escape para salir.</p>
		{/if}
	</div>

	<!-- Contenedor para el SVG dinámico -->
	<div 
		class="contenedor-svg-accesible"
		bind:this={contenedorSvg}
		aria-label="Mapa interactivo de la escena"
	>
		{#if !svgCargado && !errorCarga && rutaSvgAccesibilidad}
			<div class="mensaje-carga" role="status" aria-live="polite">
				<p>Cargando mapa de accesibilidad...</p>
			</div>
		{:else if errorCarga}
			<div class="mensaje-error" role="alert">
				<p>{errorCarga}</p>
			</div>
		{/if}
		<!-- El SVG se inyectará aquí dinámicamente -->
	</div>

	<!-- Panel de información - solo visible cuando hay zona enfocada -->
	{#if zonaActualmenteFocusada && modoNavegacionActivo}
		<div class="panel-informacion" role="status" aria-live="polite">
			<div class="zona-info">
				<span class="icono-zona">📍</span>
				<span class="texto-zona">{zonaActualmenteFocusada}</span>
			</div>
			<div class="instruccion-rapida">
				<kbd>Shift+D</kbd> siguiente • <kbd>Shift+A</kbd> anterior
			</div>
		</div>
	{/if}

	<!-- Indicador de accesibilidad disponible (esquina) -->
	{#if svgCargado && !modoNavegacionActivo}
		<button
			class="indicador-accesibilidad"
			onclick={activarNavegacion}
			aria-label="Activar navegación por zonas (Shift+A)"
			title="Presiona Shift+A para navegar por zonas"
		>
			<span aria-hidden="true">♿</span>
			<span class="texto-indicador">Navegar por zonas</span>
		</button>
	{/if}
</div>

<style>
	/* Clases para lectores de pantalla */
	.info-sr-only {
		position: absolute;
		left: -10000px;
		top: auto;
		width: 1px;
		height: 1px;
		overflow: hidden;
		pointer-events: none;
	}

	/* Overlay principal - SIEMPRE VISIBLE, NO INTERFIERE CON DIBUJO */
	.overlay-accesibilidad {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		/* NO bloquear eventos del ratón - permitir dibujo normal */
		pointer-events: none;
		z-index: 100;
		outline: none;
	}

	/* Cuando la navegación está activa, fondo sutil */
	.overlay-accesibilidad.navegacion-activa {
		background: rgba(0, 100, 255, 0.02);
	}

	/* Contenedor del SVG accesible */
	.contenedor-svg-accesible {
		width: 100%;
		height: 100%;
		position: relative;
		outline: none;
		/* SVG también sin eventos, excepto en elementos específicos */
		pointer-events: none;
	}

	/* Estilos para el SVG en sí */
	.contenedor-svg-accesible :global(svg) {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		/* Asegurar que el SVG se ajuste correctamente */
		object-fit: contain;
		pointer-events: none;
	}

	/* Elementos interactivos del SVG */
	/* Por defecto: pointer-events none para permitir dibujo libre */
	.contenedor-svg-accesible :global([tabindex]) {
		pointer-events: none;
		cursor: default;
		transition: all 0.2s ease;
		/* Invisible por defecto */
		fill: transparent;
		stroke: transparent;
	}

	/* Solo en modo navegación: permitir eventos */
	.overlay-accesibilidad.navegacion-activa .contenedor-svg-accesible :global([tabindex]) {
		pointer-events: none;
		cursor: pointer;
	}

	/* Hover en elementos - SOLO en modo navegación */
	.overlay-accesibilidad.navegacion-activa .contenedor-svg-accesible :global([tabindex]:hover) {
		fill: rgba(100, 150, 255, 0.08) !important;
		stroke: rgba(100, 150, 255, 0.3) !important;
		stroke-width: 2 !important;
	}

	/* Elemento enfocado - feedback visual fuerte (WCAG 2.4.7) */
	.contenedor-svg-accesible :global(.zona-enfocada),
	.contenedor-svg-accesible :global([tabindex]:focus) {
		fill: rgba(0, 123, 255, 0.15) !important;
		stroke: #007bff !important;
		stroke-width: 3 !important;
		outline: 3px solid #007bff;
		outline-offset: 2px;
		filter: drop-shadow(0 0 8px rgba(0, 123, 255, 0.5));
		/* Animación de pulso sutil */
		animation: pulsoZona 2s ease-in-out infinite;
	}

	@keyframes pulsoZona {
		0%, 100% { 
			fill-opacity: 0.15;
		}
		50% { 
			fill-opacity: 0.25;
		}
	}

	/* Mensaje de carga */
	.mensaje-carga {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: rgba(255, 255, 255, 0.95);
		padding: 0.75rem 1rem;
		border-radius: 6px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		font-size: 0.85rem;
		color: #666;
		pointer-events: auto;
		z-index: 101;
	}

	.mensaje-carga p {
		margin: 0;
	}

	/* Mensaje de error */
	.mensaje-error {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: rgba(255, 243, 205, 0.95);
		border: 2px solid #ff9800;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		max-width: 250px;
		font-size: 0.85rem;
		pointer-events: auto;
		z-index: 101;
	}

	.mensaje-error p {
		margin: 0.25rem 0;
		color: #e65100;
	}

	/* Panel de información compacto */
	.panel-informacion {
		position: absolute;
		top: 1rem;
		left: 1rem;
		background: transparent;
		color: rgb(0, 0, 0);
		border-radius: 8px;
		padding: 0.75rem 1rem;
		border: 2px solid #000;
		pointer-events: auto;
		z-index: 101;
		max-width: 300px;
		pointer-events: none;
	}

	.zona-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.icono-zona {
		font-size: 1.2rem;
		line-height: 1;
	}

	.texto-zona {
		font-weight: 600;
		font-size: 0.95rem;
		flex: 1;
	}

	.instruccion-rapida {
		font-size: 0.8rem;
		opacity: 0.9;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.instruccion-rapida kbd {
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 3px;
		padding: 0.15rem 0.4rem;
		font-size: 0.75rem;
		font-family: monospace;
	}

	/* Indicador de accesibilidad disponible */
	.indicador-accesibilidad {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: rgba(76, 175, 80, 0.95);
		color: white;
		border: 2px solid rgba(255, 255, 255, 0.5);
		border-radius: 8px;
		padding: 0.5rem 0.75rem;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		pointer-events: auto;
		z-index: 101;
		backdrop-filter: blur(10px);
	}

	.indicador-accesibilidad:hover {
		background: rgba(67, 160, 71, 0.95);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
	}

	.indicador-accesibilidad:focus {
		outline: 3px solid #fff;
		outline-offset: 2px;
	}

	.texto-indicador {
		font-size: 0.8rem;
		white-space: nowrap;
	}

	/* Responsividad */
	@media (max-width: 768px) {
		.panel-informacion {
			left: 0.5rem;
			bottom: 0.5rem;
			max-width: 200px;
			padding: 0.6rem 0.8rem;
		}

		.indicador-accesibilidad {
			top: 0.5rem;
			right: 0.5rem;
			padding: 0.4rem 0.6rem;
		}

		.texto-indicador {
			display: none;
		}

		.zona-info {
			font-size: 0.85rem;
		}
	}

	/* Reducir animaciones si el usuario lo prefiere */
	@media (prefers-reduced-motion: reduce) {
		.contenedor-svg-accesible :global([tabindex]),
		.indicador-accesibilidad {
			transition: none;
		}
		
		.contenedor-svg-accesible :global(.zona-enfocada),
		.contenedor-svg-accesible :global([tabindex]:focus) {
			animation: none;
		}
	}

	/* Alto contraste */
	@media (prefers-contrast: high) {
		.contenedor-svg-accesible :global(.zona-enfocada),
		.contenedor-svg-accesible :global([tabindex]:focus) {
			stroke: #000 !important;
			stroke-width: 4 !important;
			outline: 4px solid #000;
		}

		.panel-informacion {
			background: #000;
			border: 2px solid #fff;
		}
	}
</style>
