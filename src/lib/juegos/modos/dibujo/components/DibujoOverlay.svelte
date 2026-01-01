<!--
  DibujoOverlay.svelte
  Capa de accesibilidad para el modo de dibujo con SVG interactivo.
  Carga dinámicamente un SVG con zonas semánticas y permite navegación por Tab.
  Proporciona navegación por teclado, gestión de foco y roles/labels ARIA.
-->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props
	interface Props {
		/** Ruta al SVG de accesibilidad de la escena */
		rutaSvgAccesibilidad?: string;
		/** Nivel de zoom aplicado */
		nivelZoom?: number;
		/** Offset horizontal de pan */
		offsetX?: number;
		/** Offset vertical de pan */
		offsetY?: number;
	}

	let { 
		rutaSvgAccesibilidad,
		nivelZoom = 1,
		offsetX = 0,
		offsetY = 0
	}: Props = $props();

	// Dispatcher para comunicar eventos de accesibilidad
	const dispatch = createEventDispatcher<{
		seleccionar: { zona: string };
		zonaEnfocada: { zona: string; label: string };
		modoNavegacionCambiado: { activo: boolean };
	}>();

	// Estado del overlay - siempre visible
	let contenedorOverlay: HTMLDivElement | null = $state(null);
	let contenedorSvg: HTMLDivElement | null = $state(null);
	let contenedorTransformable: HTMLDivElement | null = $state(null);
	let svgCargado = $state<boolean>(false);
	let modoNavegacionActivo = $state<boolean>(false);
	let altoContrasteActivo = $state<boolean>(false);
	let zonaActualmenteFocusada = $state<string>('');
	let elementosOriginales: Map<SVGElement, { fill: string }> = new Map();

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
		// Emitir evento de cambio
		dispatch('modoNavegacionCambiado', { activo: true });
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
		// Emitir evento de cambio
		dispatch('modoNavegacionCambiado', { activo: false });
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

			const respuesta = await fetch(rutaSvgAccesibilidad);
			
			if (!respuesta.ok) {
				throw new Error(`Error HTTP: ${respuesta.status}`);
			}

			const textoSvg = await respuesta.text();
			
			// Inyectar el SVG en el contenedor
			contenedorSvg.innerHTML = textoSvg;

			// Ajustar tamaño del SVG al contenedor (similar a DibujoCanvas)
			ajustarTamanoSvg();

			// Configurar elementos interactivos
			configurarElementosSvg();

			svgCargado = true;
			console.log('[DibujoOverlay] SVG accesible cargado correctamente');
		} catch (error) {
			console.error('[DibujoOverlay] Error al cargar SVG:', error);
			svgCargado = false;
		}
	}

	/**
	 * Ajusta el tamaño del SVG al contenedor (igual que DibujoCanvas con canvas)
	 * Obtiene las dimensiones reales del contenedor y las aplica al SVG
	 */
	function ajustarTamanoSvg() {
		if (!contenedorSvg || !contenedorOverlay) return;

		const svg = contenedorSvg.querySelector('svg');
		if (!svg) return;

		// Obtener dimensiones REALES del contenedor (como lo hace DibujoCanvas con offsetWidth/offsetHeight)
		const width = contenedorOverlay.offsetWidth;
		const height = contenedorOverlay.offsetHeight;

		// Establecer las dimensiones exactas del SVG en pixels (como canvas.width y canvas.height)
		svg.setAttribute('width', width.toString());
		svg.setAttribute('height', height.toString());
		
		// Preservar el viewBox original del SVG para escalar el contenido correctamente
		// Esto permite que el contenido del SVG se escale mientras mantiene sus proporciones internas
		const viewBoxActual = svg.getAttribute('viewBox');
		if (viewBoxActual) {
			// Mantener el viewBox para que el contenido se escale correctamente
			svg.setAttribute('preserveAspectRatio', 'none');
		}

		// Estilos CSS para posicionamiento (no para tamaño)
		svg.style.position = 'absolute';
		svg.style.top = '0';
		svg.style.left = '0';
		svg.style.display = 'block';

		console.log(`[DibujoOverlay] SVG ajustado a ${width}x${height}px (igual que canvas)`);
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
			elemento.setAttribute('tabindex', '0');
			
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

		// Si no hay elemento enfocado o no está en la lista, ir al primero
		if (indice === -1) {
			(elementos[0] as HTMLElement).focus();
			return;
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

		// Si no hay elemento enfocado o no está en la lista, ir al último
		if (indice === -1) {
			(elementos[elementos.length - 1] as HTMLElement).focus();
			return;
		}

		// Calcular el índice anterior (circular)
		const indiceAnterior = indice === 0 ? elementos.length - 1 : indice - 1;
		(elementos[indiceAnterior] as HTMLElement).focus();
	}

	/**
	 * Maneja el evento de teclado en una zona
	 * NOTA: Shift+A y Shift+D se manejan en manejarTecladoGlobal para evitar conflictos
	 */
	function manejarTecladoEnZona(evento: Event) {
		const keyEvent = evento as KeyboardEvent;
		const elemento = evento.target as SVGElement;

		// Shift + X: desactivar modo navegación
		if (keyEvent.shiftKey && (keyEvent.key === 'X' || keyEvent.key === 'x')) {
			keyEvent.preventDefault();
			desactivarAltoContraste();
			desactivarNavegacion();
			return;
		}

		// Home: ir a primera zona
		if (keyEvent.key === 'Home') {
			keyEvent.preventDefault();
			desactivarAltoContraste();
			enfocarPrimeraZona();
			return;
		}

		// End: ir a última zona
		if (keyEvent.key === 'End') {
			keyEvent.preventDefault();
			desactivarAltoContraste();
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
		
		// Activar alto contraste pasando el elemento seleccionado
		activarAltoContraste(elemento);
		
		// Emitir evento de selección
		dispatch('seleccionar', { zona });
		console.log(`[DibujoOverlay] Zona seleccionada: ${zona}`);
	}

	/**
	 * Activa el modo de alto contraste oscureciendo todos los elementos SVG excepto el seleccionado
	 */
	export function activarAltoContraste(elementoSeleccionado: SVGElement) {
		if (altoContrasteActivo || !contenedorSvg) return;

		altoContrasteActivo = true;
		elementosOriginales.clear();

		// Obtener todos los elementos con tabindex (zonas navegables)
		const elementos = contenedorSvg.querySelectorAll('[aria-label]');
		
		elementos.forEach((elemento) => {
			const svgElemento = elemento as SVGElement;
			
			// Guardar estado original
			elementosOriginales.set(svgElemento, {
				fill: svgElemento.style.fill || 'none'
			});
			
			// Si NO es el elemento seleccionado, oscurecerlo
			if (svgElemento !== elementoSeleccionado) {
				svgElemento.style.fill = 'rgba(0, 0, 0,0.5)';
			} else {
				// El elemento seleccionado mantiene su brillo
				svgElemento.style.opacity = '1';
				svgElemento.style.filter = 'brightness(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))';
			}
		});

		console.log('[DibujoOverlay] Modo de alto contraste activado');
	}

	/**
	 * Desactiva el modo de alto contraste y restaura el estado original de todos los elementos
	 */
	export function desactivarAltoContraste() {
		if (!altoContrasteActivo || !contenedorSvg) return;

		altoContrasteActivo = false;

		// Restaurar estado original de todos los elementos
		elementosOriginales.forEach((estadoOriginal, elemento) => {
			elemento.style.fill = estadoOriginal.fill;
		});

		elementosOriginales.clear();
		console.log('[DibujoOverlay] Modo de alto contraste desactivado');
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
				desactivarAltoContraste();
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
				desactivarAltoContraste();
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

	// Efecto reactivo: aplicar zoom y offset al overlay (igual que en DibujoCanvas)
	$effect(() => {
		if (!contenedorTransformable) return;
		
		const transform = `scale(${nivelZoom}) translate(${offsetX}px, ${offsetY}px)`;
		contenedorTransformable.style.transform = transform;
		contenedorTransformable.style.transformOrigin = 'center center';
		contenedorTransformable.style.transition = 'transform 0.3s ease';
	});

	// Efecto reactivo: ajustar tamaño cuando cambia el contenedor o se redimensiona la ventana
	$effect(() => {
		if (contenedorOverlay && svgCargado) {
			// Ajustar inmediatamente
			ajustarTamanoSvg();

			// Escuchar cambios de tamaño del contenedor
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
			<p>Modo de navegación por zonas activado. Use Shift+D para siguiente, Shift+A para anterior, Enter para seleccionar, Ctrl+X para salir.</p>
		{/if}
	</div>

	<!-- Contenedor transformable (recibe zoom y pan como DibujoCanvas) -->
	<div 
		class="contenedor-overlay-transform"
		bind:this={contenedorTransformable}
	>
		<!-- Contenedor para el SVG dinámico -->
		<div 
			class="contenedor-svg-accesible"
			bind:this={contenedorSvg}
			aria-label="Mapa interactivo de la escena"
		>
			<!-- El SVG se inyectará aquí dinámicamente -->
		</div>
	</div>

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

	/* Contenedor transformable (recibe zoom y pan) */
	.contenedor-overlay-transform {
		position: relative;
		width: 100%;
		height: 100%;
		transform-origin: center center;
		pointer-events: none;
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
		position: absolute;
		top: 0;
		left: 0;
		/* NO establecer width/height en CSS - se controlan en JavaScript */
		display: block;
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
</style>
