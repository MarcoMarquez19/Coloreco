<!--
  Ejemplo de integración completa del modo de dibujo con accesibilidad SVG
  
  Este ejemplo muestra cómo usar:
  - DibujoCanvas: El lienzo de dibujo
  - DibujoBarraHerramientas: Barra de herramientas de dibujo
  - DibujoOverlay: Capa de accesibilidad con SVG interactivo
  - servicioDibujo: Orquestador del estado global
  
  CARACTERÍSTICAS:
  - Navegación por Tab entre zonas del SVG
  - Feedback visual al enfocar zonas (WCAG 2.4.7)
  - Lectores de pantalla leen aria-label de cada zona
  - Selección de zona con Enter/Espacio
  - Salida del modo accesible con Escape
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import DibujoCanvas from '$lib/juegos/modos/dibujo/components/DibujoCanvas.svelte';
	import DibujoBarraHerramientas from '$lib/juegos/modos/dibujo/components/DibujoBarraHerramientas.svelte';
	import DibujoOverlay from '$lib/juegos/modos/dibujo/components/DibujoOverlay.svelte';
	import { servicioDibujo } from '$lib/juegos/modos/dibujo/dibujo.service';

	// Referencias a los componentes
	let canvasRef: DibujoCanvas;
	let overlayRef: DibujoOverlay;

	// Estado del ejemplo
	let tallerInicializado = $state<boolean>(false);
	let mensajeZonaActual = $state<string>('');
	let ultimaZonaSeleccionada = $state<string>('');

	// Ruta al SVG de accesibilidad de ejemplo
	// En este caso usamos el SVG de la cabaña en el bosque
	const rutaSvgAccesibilidad = '/escenas/accesibilidad/cabaña-bosque-accesible.svg';

	// Configuración de herramientas visibles
	const herramientasVisibles = ['pincel', 'borrador', 'stickers'];
	const accionesVisibles = ['deshacer', 'guardar'];

	/**
	 * Maneja eventos de la barra de herramientas
	 */
	function manejarEventoBarra(evento: CustomEvent) {
		const { type, detail } = evento;

		switch (type) {
			case 'cambiarHerramienta':
				servicioDibujo.cambiarHerramienta(detail.herramienta);
				console.log(`Herramienta cambiada a: ${detail.herramienta}`);
				break;
			
			case 'cambiarColor':
				servicioDibujo.cambiarColor(detail.color);
				console.log(`Color cambiado a: ${detail.color}`);
				break;
			
			case 'cambiarGrosor':
				servicioDibujo.cambiarTamano(detail.grosor);
				console.log(`Grosor cambiado a: ${detail.grosor}`);
				break;
			
			case 'seleccionarSticker':
				servicioDibujo.seleccionarSticker(detail.sticker);
				console.log(`Sticker seleccionado: ${detail.sticker.nombre}`);
				break;
			
			case 'cambiarTamanoSticker':
				servicioDibujo.cambiarTamanoSticker(detail.escala);
				console.log(`Tamaño de sticker cambiado a escala: ${detail.escala}`);
				break;

			case 'accionDeshacer':
				servicioDibujo.deshacer();
				console.log('Acción deshecha');
				break;
			
			case 'accionGuardar':
				servicioDibujo.guardarDibujo();
				console.log('Dibujo guardado');
				break;
		}
	}

	/**
	 * Maneja eventos del overlay de accesibilidad
	 */
	function manejarEventoOverlay(evento: CustomEvent) {
		const { type, detail } = evento;

		switch (type) {
			case 'seleccionar':
				// Cuando se selecciona una zona del SVG
				ultimaZonaSeleccionada = detail.zona;
				console.log(`Zona seleccionada: "${detail.zona}" en coordenadas (${detail.x}, ${detail.y})`);
				
				// Aquí podrías implementar acciones como:
				// - Dibujar un punto/círculo en esa ubicación
				// - Aplicar un color específico a esa zona
				// - Colocar un sticker en el centro de la zona
				// Por ejemplo:
				// servicioDibujo.colocarSticker(detail.x, detail.y);
				break;
			
			case 'zonaEnfocada':
				// Actualizar mensaje cuando una zona recibe el foco
				mensajeZonaActual = detail.label;
				console.log(`Zona enfocada: ${detail.label}`);
				break;
		}
	}

	/**
	 * Activa/desactiva el modo accesible con el overlay SVG
	 */
	function toggleModoAccesible() {
		if (overlayRef) {
			overlayRef.alternarOverlay();
		}
	}

	/**
	 * Limpia el canvas
	 */
	function limpiarCanvas() {
		servicioDibujo.limpiarLienzo();
	}

	// Inicializar servicio cuando el canvas esté listo
	$effect(() => {
		if (canvasRef && overlayRef && !tallerInicializado) {
			servicioDibujo.inicializar(canvasRef, overlayRef);
			tallerInicializado = true;
			console.log('Taller de dibujo accesible inicializado');
		}
	});

	// Limpiar al desmontar
	onDestroy(() => {
		servicioDibujo.destruir();
	});
</script>

<svelte:head>
	<title>Ejemplo: Dibujo Accesible con SVG Interactivo | Coloreco</title>
</svelte:head>

<div class="contenedor-ejemplo">
	<!-- Encabezado con información -->
	<header class="encabezado-ejemplo">
		<h1>🎨 Ejemplo: Dibujo Accesible con SVG Interactivo</h1>
		<p class="descripcion">
			Esta página demuestra la integración completa de los componentes de dibujo con la capa
			de accesibilidad basada en SVG. El overlay está <strong>siempre visible</strong> pero 
			<strong>no interfiere con el dibujo</strong>. Presiona <kbd>Tab</kbd> para navegar por las zonas,
			o usa <kbd>Ctrl+Shift+A</kbd> para activar/desactivar el modo de navegación.
		</p>
		
		<div class="alertas-info">
			<div class="alerta alerta-info">
				ℹ️ El overlay está siempre activo. Puedes dibujar normalmente mientras navegas por las zonas.
			</div>
		</div>
		
		{#if mensajeZonaActual}
			<div class="zona-actual" role="status" aria-live="polite">
				<strong>Zona enfocada:</strong> {mensajeZonaActual}
			</div>
		{/if}
		
		{#if ultimaZonaSeleccionada}
			<div class="zona-seleccionada" role="status">
				<strong>Última zona seleccionada:</strong> {ultimaZonaSeleccionada}
			</div>
		{/if}
	</header>

	<!-- Controles adicionales de ejemplo -->
	<aside class="controles-ejemplo">
		<h2>Controles de Ejemplo</h2>
		<div class="botones-control">
			<button class="boton-control" onclick={toggleModoAccesible}>
				♿ Toggle Modo Accesible
			</button>
			<button class="boton-control" onclick={limpiarCanvas}>
				🗑️ Limpiar Canvas
			</button>
		</div>
		
		<div class="instrucciones-teclado">
			<h3>Atajos de Teclado</h3>
			<div class="alerta alerta-info">
				<strong>🎨 Modo Predeterminado: Dibujo Libre</strong><br>
				El overlay NO bloquea el dibujo. Usa mouse/touch con normalidad.
			</div>
			<div class="alerta alerta-info">
				<strong>⌨️ Presiona <kbd>Tab</kbd> para activar Modo Navegación</strong><br>
				Navega por zonas con el teclado. Presiona <kbd>Escape</kbd> para volver a dibujar.
			</div>
			<ul>
				<li><kbd>Tab</kbd> - Activar modo navegación / Navegar a siguiente zona</li>
				<li><kbd>Shift+Tab</kbd> - Navegar a zona anterior</li>
				<li><kbd>Home</kbd> - Ir a la primera zona</li>
				<li><kbd>End</kbd> - Ir a la última zona</li>
				<li><kbd>Enter</kbd> o <kbd>Espacio</kbd> - Seleccionar zona enfocada</li>
				<li><kbd>Escape</kbd> - Desactivar navegación y volver a modo dibujo</li>
				<li><kbd>Ctrl+Shift+A</kbd> - Toggle modo navegación</li>
				<li><kbd>Ctrl+Z</kbd> - Deshacer última acción</li>
			</ul>
		</div>
	</aside>

	<!-- Área principal con canvas y herramientas -->
	<main class="area-principal-ejemplo">
		<!-- Barra de herramientas -->
		<section class="seccion-herramientas">
			<DibujoBarraHerramientas
				herramientasVisibles={herramientasVisibles}
				accionesVisibles={accionesVisibles}
				on:cambiarHerramienta={manejarEventoBarra}
				on:cambiarColor={manejarEventoBarra}
				on:cambiarGrosor={manejarEventoBarra}
				on:seleccionarSticker={manejarEventoBarra}
				on:cambiarTamanoSticker={manejarEventoBarra}
				on:accionDeshacer={manejarEventoBarra}
				on:accionGuardar={manejarEventoBarra}
			/>
		</section>

		<!-- Canvas con overlay de accesibilidad -->
		<section class="seccion-canvas">
			<div class="contenedor-canvas">
				<!-- Canvas de dibujo -->
				<DibujoCanvas bind:this={canvasRef} />
				
				<!-- Overlay de accesibilidad con SVG -->
				<DibujoOverlay
					bind:this={overlayRef}
					rutaSvgAccesibilidad={rutaSvgAccesibilidad}
					on:seleccionar={manejarEventoOverlay}
					on:zonaEnfocada={manejarEventoOverlay}
				/>
			</div>
		</section>
	</main>

	<!-- Información técnica -->
	<footer class="info-tecnica">
		<h3>📋 Información Técnica</h3>
		<details>
			<summary>Ver detalles de implementación</summary>
			<div class="detalles-implementacion">
				<h4>Componentes utilizados:</h4>
				<ul>
					<li><code>DibujoCanvas</code> - Lienzo de dibujo con soporte para escenas SVG</li>
					<li><code>DibujoBarraHerramientas</code> - Herramientas de dibujo (pincel, borrador, stickers)</li>
					<li><code>DibujoOverlay</code> - Capa de accesibilidad con SVG interactivo</li>
					<li><code>servicioDibujo</code> - Orquestador del estado global</li>
				</ul>
				
				<h4>Archivos clave:</h4>
				<ul>
					<li><code>static/escenas/escenas.json</code> - Catálogo de escenas con rutas de accesibilidad</li>
					<li><code>static/escenas/accesibilidad/*.svg</code> - SVGs con zonas semánticas</li>
					<li><code>src/lib/db/schemas.ts</code> - Schema con propiedad <code>rutaAccesibilidad</code></li>
				</ul>
				
				<h4>Cumplimiento WCAG:</h4>
				<ul>
					<li>✅ 2.4.7 Focus Visible - Indicador visual de foco claro</li>
					<li>✅ 2.1.1 Keyboard - Navegación completa por teclado</li>
					<li>✅ 4.1.2 Name, Role, Value - Roles y labels ARIA apropiados</li>
					<li>✅ 2.5.3 Label in Name - Etiquetas accesibles en elementos</li>
				</ul>
			</div>
		</details>
	</footer>
</div>

<style>
	.contenedor-ejemplo {
		min-height: 100vh;
		padding: 2rem;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		font-family: system-ui, -apple-system, sans-serif;
	}

	.encabezado-ejemplo {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.encabezado-ejemplo h1 {
		margin: 0 0 1rem 0;
		color: #2c3e50;
		font-size: 2rem;
	}

	.descripcion {
		color: #546e7a;
		line-height: 1.6;
		margin: 0 0 1rem 0;
	}

	.alertas-info {
		margin-top: 1rem;
	}

	.alerta {
		padding: 0.75rem 1rem;
		border-radius: 6px;
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}

	.alerta-info {
		background: #e3f2fd;
		border-left: 4px solid #2196f3;
		color: #1565c0;
	}

	.zona-actual,
	.zona-seleccionada {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		font-size: 0.95rem;
	}

	.zona-actual {
		background: #e3f2fd;
		border-left: 4px solid #2196f3;
		color: #1565c0;
	}

	.zona-seleccionada {
		background: #e8f5e9;
		border-left: 4px solid #4caf50;
		color: #2e7d32;
	}

	.controles-ejemplo {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.controles-ejemplo h2 {
		margin: 0 0 1rem 0;
		font-size: 1.3rem;
		color: #2c3e50;
	}

	.botones-control {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.boton-control {
		padding: 0.75rem 1.5rem;
		border: 2px solid #2196f3;
		border-radius: 8px;
		background: white;
		color: #2196f3;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.boton-control:hover {
		background: #2196f3;
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
	}

	.boton-control:focus {
		outline: 3px solid #64b5f6;
		outline-offset: 2px;
	}

	.instrucciones-teclado {
		border-top: 2px solid #e0e0e0;
		padding-top: 1rem;
	}

	.instrucciones-teclado h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1.1rem;
		color: #37474f;
	}

	.instrucciones-teclado ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.instrucciones-teclado li {
		padding: 0.4rem 0;
		color: #546e7a;
	}

	kbd {
		background: #f5f5f5;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 0.2rem 0.5rem;
		font-size: 0.9rem;
		font-family: monospace;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.area-principal-ejemplo {
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.seccion-herramientas {
		margin-bottom: 1.5rem;
	}

	.seccion-canvas {
		width: 100%;
	}

	.contenedor-canvas {
		position: relative;
		width: 100%;
		height: 600px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		overflow: hidden;
		background: #fafafa;
	}

	.info-tecnica {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	.info-tecnica h3 {
		margin: 0 0 1rem 0;
		font-size: 1.3rem;
		color: #2c3e50;
	}

	details {
		cursor: pointer;
	}

	summary {
		padding: 0.75rem;
		background: #f5f5f5;
		border-radius: 6px;
		font-weight: 600;
		color: #37474f;
		user-select: none;
	}

	summary:hover {
		background: #eeeeee;
	}

	.detalles-implementacion {
		padding: 1.5rem;
		line-height: 1.6;
	}

	.detalles-implementacion h4 {
		margin: 1.5rem 0 0.75rem 0;
		color: #37474f;
		font-size: 1.1rem;
	}

	.detalles-implementacion h4:first-child {
		margin-top: 0;
	}

	.detalles-implementacion ul {
		margin: 0 0 1rem 0;
		padding-left: 1.5rem;
	}

	.detalles-implementacion li {
		padding: 0.3rem 0;
		color: #546e7a;
	}

	.detalles-implementacion code {
		background: #f5f5f5;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: 'Courier New', monospace;
		font-size: 0.9em;
		color: #d32f2f;
	}

	@media (max-width: 768px) {
		.contenedor-ejemplo {
			padding: 1rem;
		}

		.encabezado-ejemplo h1 {
			font-size: 1.5rem;
		}

		.contenedor-canvas {
			height: 400px;
		}

		.botones-control {
			flex-direction: column;
		}
	}
</style>
