<!--
  Página del modo de dibujo accesible
  Integra DibujoCanvas, DibujoBarraHerramientas y DibujoOverlay
  usando el ServicioDibujo como orquestador.
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import DibujoCanvas from '$lib/juegos/modos/dibujo/components/DibujoCanvas.svelte';
	import DibujoBarraHerramientas from '$lib/juegos/modos/dibujo/components/DibujoBarraHerramientas.svelte';
	import DibujoOverlay from '$lib/juegos/modos/dibujo/components/DibujoOverlay.svelte';
	import { servicioDibujo } from '$lib/juegos/modos/dibujo/dibujo.service';
    import Modal from '$lib/components/modales/Modal.svelte';
    import type { EscenaCatalogo } from '$lib/db/schemas';
	import { buscarPorEscenaId } from '$lib/db/escenas.service';
	import MensajeFeedback from '$lib/juegos/modos/cuerpo-humano/components/MensajeFeedback.svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';

	// Referencias a los componentes
	let canvasRef: DibujoCanvas;
	let overlayRef: DibujoOverlay;
	let contenedorLienzoRef: HTMLDivElement | null = null;

	// Estado del taller de dibujo
	let tallerInicializado = $state<boolean>(false);
	let mostrarAyuda = $state<boolean>(false);

	// Configuración de herramientas y acciones visibles
	// Puedes modificar estos arrays para controlar qué se muestra en la barra
	const herramientasVisibles = ['pincel', 'borrador','stickers']; // Sin stickers por ahora
	const accionesVisibles = ['mover','deshacer', 'guardar', 'terminar']; // Sin mover por ahora

	// Estado de modales de guardado
	let modalConfirmarGuardado = $state<boolean>(false);
	let modalGuardadoExitoso = $state<boolean>(false);
	let guardandoObra = $state<boolean>(false);

    // Valores iniciales para la barra de herramientas
    let herramientaInicial = $state<string>('pincel');
    let colorInicial = $state<string>('#000000');
    let grosorInicial = $state<number>(5);

	// Estado de mensajes de feedback
	let mostrarMensaje = $state<boolean>(false);
	let mensajeTexto = $state<string>('');
	let mensajeTipo = $state<'success' | 'error'>('success');
	let timeoutMensaje: ReturnType<typeof setTimeout> | null = null;

	// Estado de zoom y pan
	let nivelZoom = $state<number>(1); // 1 = sin zoom, 1.5 = medio, 2.5 = alto
	let offsetX = $state<number>(0); // Desplazamiento horizontal
	let offsetY = $state<number>(0); // Desplazamiento vertical
	let estaDraggeando = $state<boolean>(false);
	let ultimaPosX = $state<number>(0);
	let ultimaPosY = $state<number>(0);
	let herramientaMoverActiva = $state<boolean>(false);

	// Estado del panel de información de navegación
	let zonaEnfocada = $state<string>('');
	let labelZonaEnfocada = $state<string>('');
	let modoNavegacionActivo = $state<boolean>(false);
	let mostrarPanelNavegacion = $state<boolean>(false);
	let timeoutPanelNavegacion: ReturnType<typeof setTimeout> | null = null;

    //Propiedades de la escena actual
	let escena: EscenaCatalogo | null = $state<EscenaCatalogo | null>(null);
    let error: string | null = $state<string | null>(null);
	let cargando = $state<boolean>(true); // Estado de carga inicial ;

	async function cargarEscena() {
		try {
			const { params } = get(page);
			const escenaId = params?.sceneId;

			if (!escenaId) {
				error = 'Falta el identificador de la escena.';
				return;
			}

			const resultados = await buscarPorEscenaId(escenaId);
			if (!resultados || resultados.length === 0) {
				error = 'La escena no existe o no está disponible.';
				return;
			}

			escena = resultados[0];
			error = null;
		} catch (e) {
			console.error('[descripcion-escena] Error al cargar escena:', e);
			error = 'Ocurrió un error al cargar la escena.';
		} finally {
			cargando = false;
		}
	}

    onMount(() => {
        void cargarEscena();
    });

	/**
	 * Confirma y ejecuta el guardado de la obra
	 */
	async function confirmarGuardarObra() {
		modalConfirmarGuardado = false;
		guardandoObra = true;

		try {
			// Llamar al método de guardado del canvas
			await canvasRef.guardarDibujo();
			
			// Mostrar modal de éxito
			modalGuardadoExitoso = true;
		} catch (error) {
			console.error('[CuerpoHumano] Error al guardar:', error);
			mostrarMensajeFeedback('Error al guardar la obra', 'error');
		} finally {
			guardandoObra = false;
		}
	}
	/**
	 * Cancela el guardado de la obra
	 */
	function cancelarGuardarObra() {
		modalConfirmarGuardado = false;
	}

	/**
	 * Cierra el modal de guardado exitoso
	 */
	function cerrarModalExito() {
		modalGuardadoExitoso = false;
	}

	/**
	 * Muestra un mensaje al usuario
	 */
	function mostrarMensajeFeedback(texto: string, tipo: 'success' | 'error') {
		// Limpiar timeout anterior si existe
		if (timeoutMensaje) {
			clearTimeout(timeoutMensaje);
		}

		// Mostrar mensaje
		mensajeTexto = texto;
		mensajeTipo = tipo;
		mostrarMensaje = true;

		// Ocultar después de 2 segundos
		timeoutMensaje = setTimeout(() => {
			mostrarMensaje = false;
		}, 2000);
	}

	/**
	 * Inicializa el taller de dibujo
	 */
	function inicializarTaller() {
		if (!canvasRef) {
			console.error('[TallerDibujo] Canvas no disponible');
			return;
		}

		// Resetear el servicio a valores por defecto antes de inicializar
		servicioDibujo.resetear();

		// Inicializar el servicio con las referencias de los componentes
		servicioDibujo.inicializar(canvasRef, overlayRef);
		
		// Obtener el estado inicial del servicio y sincronizar con la barra
		const estado = servicioDibujo.obtenerEstado();
		herramientaInicial = estado.herramientaActual.id;
		colorInicial = estado.colorActual;
		grosorInicial = estado.grosorActual;
		
		tallerInicializado = true;
		
		console.log('[TallerDibujo] Taller inicializado correctamente');
	}

	/**
	 * Maneja los eventos de la barra de herramientas
	 */
	function manejarEventoBarra(evento: CustomEvent) {
		const { type, detail } = evento;

		switch (type) {
			case 'cambiarHerramienta':
				// Desactivar modo mover al cambiar de herramienta (pero mantener zoom)
				herramientaMoverActiva = false;
				aplicarTransformacion();
				servicioDibujo.cambiarHerramienta(detail.herramienta);
				break;
			
			case 'cambiarColor':
				servicioDibujo.cambiarColor(detail.color);
				break;
			
			case 'cambiarGrosor':
				servicioDibujo.cambiarTamano(detail.grosor);
				break;
			
			case 'accionDeshacer':
				servicioDibujo.deshacer();
				break;
			
			case 'accionGuardar':
				// Abrir modal de confirmación
				modalConfirmarGuardado = true;
				break;
			
			case 'accionTerminar':
				// TODO: Preguntar si se desea guardar antes de terminar y luego pasar a la página de evaluación del dibujo
				break;
			
			case 'accionMover':
				// Activar herramienta mover (no toggle)
				herramientaMoverActiva = true;
				aplicarTransformacion();
				console.log('[TallerDibujo] Herramienta mover activada');
				break;
			
			case 'cambiarZoom':
				cambiarZoom(detail.nivel);
				break;
			
			case 'seleccionarSticker':
				servicioDibujo.seleccionarSticker(detail.sticker);
				break;
			
			case 'cambiarTamanoSticker':
				servicioDibujo.cambiarTamanoSticker(detail.escala);
				break;
		}
	}

	/**
	 * Maneja los eventos del overlay de accesibilidad
	 */
	function manejarEventoOverlay(evento: CustomEvent) {
		const { type, detail } = evento;

		switch (type) {
			case 'seleccionar':
				// Cuando se selecciona una zona, podemos mover el cursor allí o dibujar algo
				console.log(`[TallerDibujo] Seleccionar zona "${detail.zona}"`);
				mostrarMensajeFeedback(`Zona seleccionada: ${detail.zona}`, 'success');
				break;
			
			case 'zonaEnfocada':
				// Actualizar estado para mostrar en el panel
				zonaEnfocada = detail.zona;
				labelZonaEnfocada = detail.label;
				
				// Mostrar el panel y establecer timeout para ocultarlo después de 2 segundos
				if (timeoutPanelNavegacion) {
					clearTimeout(timeoutPanelNavegacion);
				}
				mostrarPanelNavegacion = true;
				timeoutPanelNavegacion = setTimeout(() => {
					mostrarPanelNavegacion = false;
					timeoutPanelNavegacion = null;
				}, 5000);
				
				console.log(`[TallerDibujo] Zona enfocada: ${detail.label}`);
				break;
			
			case 'modoNavegacionCambiado':
				// Actualizar estado del modo de navegación
				modoNavegacionActivo = detail.activo;
				if (!detail.activo) {
					// Limpiar zona enfocada cuando se desactiva
					zonaEnfocada = '';
					labelZonaEnfocada = '';
					// Limpiar timeout del panel
					if (timeoutPanelNavegacion) {
						clearTimeout(timeoutPanelNavegacion);
						timeoutPanelNavegacion = null;
					}
					mostrarPanelNavegacion = false;
				}
				console.log(`[TallerDibujo] Modo navegación: ${detail.activo ? 'activado' : 'desactivado'}`);
				break;
		}
	}

	/**
	 * Vuelve a la pantalla anterior
	 */
	function volverAtras() {
		// TODO: Navegar a la pantalla de selección de escenas
		goto('/taller-escenas');
	}

	/**
	 * Cambia el nivel de zoom
	 */
	function cambiarZoom(nivel: number) {
		nivelZoom = nivel;
		// Resetear offset cuando cambia el zoom
		if (nivel === 1) {
			offsetX = 0;
			offsetY = 0;
		}
		aplicarTransformacion();
		console.log(`[TallerDibujo] Zoom cambiado a: ${nivel}x`);
	}

	/**
	 * Aplica la transformación de zoom y pan al contenedor del lienzo
	 */
	function aplicarTransformacion() {
		// Bloquear/desbloquear canvas según si mover está activo
		if (herramientaMoverActiva) {
			servicioDibujo.bloquear();
		} else {
			servicioDibujo.desbloquear();
		}
	}

	/**
	 * Inicia el arrastre para pan
	 */
	function iniciarDrag(event: MouseEvent) {
		if (!herramientaMoverActiva || nivelZoom === 1) return;
		
		estaDraggeando = true;
		ultimaPosX = event.clientX;
		ultimaPosY = event.clientY;
		
		if (contenedorLienzoRef) {
			contenedorLienzoRef.style.cursor = 'grabbing';
		}
	}

	/**
	 * Procesa el movimiento durante el arrastre
	 */
	function procesarDrag(event: MouseEvent) {
		if (!estaDraggeando) return;
		
		const deltaX = (event.clientX - ultimaPosX) / nivelZoom;
		const deltaY = (event.clientY - ultimaPosY) / nivelZoom;
		
		offsetX += deltaX;
		offsetY += deltaY;
		
		// Limitar el offset para no salirse de los bordes
		// Cuando hay zoom, podemos movernos, pero sin exceder los límites del canvas
		if (contenedorLienzoRef && nivelZoom > 1) {
			const containerRect = contenedorLienzoRef.getBoundingClientRect();
			const canvasWidth = containerRect.width;
			const canvasHeight = containerRect.height;
			
			// Calcular el máximo offset permitido
			// El canvas escalado tiene un tamaño efectivo mayor, podemos movernos hasta que los bordes queden visibles
			const maxOffsetX = (canvasWidth * (nivelZoom - 1)) / (2 * nivelZoom);
			const maxOffsetY = (canvasHeight * (nivelZoom - 1)) / (2 * nivelZoom);
			
			// Limitar el offset
			offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX));
			offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY));
		}
		
		ultimaPosX = event.clientX;
		ultimaPosY = event.clientY;
		
		aplicarTransformacion();
	}

	/**
	 * Finaliza el arrastre
	 */
	function finalizarDrag() {
		if (!estaDraggeando) return;
		
		estaDraggeando = false;
		
		if (contenedorLienzoRef && herramientaMoverActiva && nivelZoom > 1) {
			contenedorLienzoRef.style.cursor = 'grab';
		}
	}

	/**
	 * Alterna la ayuda del taller
	 */
	function alternarAyuda() {
		mostrarAyuda = !mostrarAyuda;
	}

	/**
	 * Activa el modo accesible
	 */
	function activarModoAccesible() {
		servicioDibujo.alternarModoAccesible();
	}

	/**
	 * Maneja los atajos de teclado globales
	 */
	function manejarAtajosTeclado(evento: KeyboardEvent) {
		// Solo procesar si no estamos en el modo accesible del overlay
		const estadoServicio = servicioDibujo.obtenerEstado();
		if (estadoServicio.modoAccesible) return;

		if (evento.ctrlKey || evento.metaKey) {
			switch (evento.key.toLowerCase()) {
				case 'z':
					evento.preventDefault();
					servicioDibujo.deshacer();
					break;
				
				case 's':
					evento.preventDefault();
					servicioDibujo.guardarDibujo();
					break;
				
				case 'h':
					evento.preventDefault();
					alternarAyuda();
					break;
			}
		} else {
			switch (evento.key) {
				
				case 'F1':
					evento.preventDefault();
					alternarAyuda();
					break;
				
				case 'a':
				case 'A':
					activarModoAccesible();
					break;
			}
		}
	}

	// Inicializar cuando el canvas esté listo
	$effect(() => {
		if (canvasRef && !tallerInicializado) {
			// Pequeño delay para asegurar que el canvas esté completamente renderizado
			setTimeout(inicializarTaller, 100);
		}
	});

	// Cleanup al desmontar
	onDestroy(() => {
		// Limpiar timeout del panel si existe
		if (timeoutPanelNavegacion) {
			clearTimeout(timeoutPanelNavegacion);
		}
		servicioDibujo.destruir();
	});

    let contenedorModoDibujoRef: HTMLElement | null = null;

	/** Calcula y aplica la escala según la altura de la ventana (máx 1080px) */
	function actualizarEscala(): void {
		if (!contenedorModoDibujoRef) return;
		const maxHeight = 1080;
		const rawScale = window.innerHeight / maxHeight;
		// limitar entre 0.6 y 1 para evitar escalados excesivos
		const scale = Math.max(0.75, Math.min(1, rawScale));
		contenedorModoDibujoRef.style.transform = `scale(${scale})`;
		contenedorModoDibujoRef.style.transformOrigin = 'top center';
	}

	$effect(() => {
		actualizarEscala();
		window.addEventListener('resize', actualizarEscala);
		return () => {
			window.removeEventListener('resize', actualizarEscala);
			// restaurar transform si existe
			if (contenedorModoDibujoRef) {
				contenedorModoDibujoRef.style.transform = '';
				contenedorModoDibujoRef.style.transformOrigin = '';
				contenedorModoDibujoRef.style.margin = '';
			}
		};
	})
</script>

<!-- Event listeners globales -->
<svelte:window onkeydown={manejarAtajosTeclado} />

<div class="taller-dibujo">
	<!-- Área principal del taller -->
	<main class="area-principal">
		<!-- Barra de herramientas -->
		<section class="seccion-herramientas" aria-label="Herramientas de dibujo"  bind:this={contenedorModoDibujoRef} data-magnificable>
			<DibujoBarraHerramientas
				herramientasVisibles={herramientasVisibles}
				accionesVisibles={accionesVisibles}
				herramientaInicial={herramientaInicial}
				colorInicial={colorInicial}
				grosorInicial={grosorInicial}
				on:cambiarHerramienta={manejarEventoBarra}
				on:cambiarColor={manejarEventoBarra}
				on:cambiarGrosor={manejarEventoBarra}
				on:seleccionarSticker={manejarEventoBarra}
				on:cambiarTamanoSticker={manejarEventoBarra}
				on:accionDeshacer={manejarEventoBarra}
				on:accionGuardar={manejarEventoBarra}
				on:accionTerminar={manejarEventoBarra}
				on:accionMover={manejarEventoBarra}
				on:cambiarZoom={manejarEventoBarra}
			/>

			<!-- Panel de información de navegación - posicionado absolutamente -->
			{#if labelZonaEnfocada && modoNavegacionActivo && mostrarPanelNavegacion}
				<div class="panel-informacion-navegacion" role="status" aria-live="polite">
					<div class="zona-info">
						<span class="icono-zona">📍</span>
						<span class="texto-zona">{labelZonaEnfocada}</span>
					</div>
					<ul class="instruccion-rapida">
						<li><kbd>Shift+D</kbd> siguiente</li>
						<li><kbd>Shift+A</kbd> anterior</li>
						<li><kbd>Enter</kbd> seleccionar</li>
						<li><kbd>Shift+X</kbd> salir</li>
					</ul>
				</div>
			{/if}
		</section>

		<!-- Área del lienzo -->
		<section class="seccion-lienzo" aria-label="Lienzo de dibujo">
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div 
				class="contenedor-lienzo"
				bind:this={contenedorLienzoRef}
				onmousedown={iniciarDrag}
				onmousemove={procesarDrag}
				onmouseup={finalizarDrag}
				onmouseleave={finalizarDrag}
				style="cursor: {herramientaMoverActiva && nivelZoom > 1 ? (estaDraggeando ? 'grabbing' : 'grab') : 'default'};"
			>
				<DibujoCanvas 
					bind:this={canvasRef} 
					nivelZoom={nivelZoom}
					offsetX={offsetX}
					offsetY={offsetY}
					modoMoverActivo={herramientaMoverActiva}
				/>
				
				<!-- Overlay de accesibilidad -->
				<DibujoOverlay
					bind:this={overlayRef}
					rutaSvgAccesibilidad={escena?.rutaAccesibilidad}
					nivelZoom={nivelZoom}
					offsetX={offsetX}
					offsetY={offsetY}
					on:seleccionar={manejarEventoOverlay}
					on:zonaEnfocada={manejarEventoOverlay}
					on:modoNavegacionCambiado={manejarEventoOverlay}
				/>
			</div>
		</section>
	</main>

	<!-- Información de estado para lectores de pantalla -->
	<div class="info-estado-sr" aria-live="polite" aria-atomic="true">
		{#if tallerInicializado}
			Taller de dibujo listo. Use las herramientas para crear su obra.
		{:else}
			Cargando taller de dibujo...
		{/if}
	</div>

	<!-- Mensaje de feedback -->
	<MensajeFeedback 
		visible={mostrarMensaje}
		mensaje={mensajeTexto}
		tipo={mensajeTipo}
	/>

	<!-- Modal de confirmación para guardar -->
	<Modal
		bind:abierto={modalConfirmarGuardado}
		titulo="Guardar obra"
		anchoMaximo="500px"
		cerrarAlClickearFuera={!guardandoObra}
		mostrarBotonCerrar={!guardandoObra}
	>
		<div style="padding: 1.5rem 0; text-align: center;">
			<div style="font-size: 4rem; margin-bottom: 1rem; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));">💾</div>
			<p style="font-size: 1.2rem; margin-bottom: 1rem; font-weight: 600; color: var(--color-texto, #333);">
				¿Deseas guardar tu obra en la galería?
			</p>
			<p style="color: var(--color-texto-secundario, #666); font-size: 1rem; line-height: 1.5;">
				Tu dibujo se guardará y podrás verlo más tarde en la galería de obras.
			</p>
		</div>

		{#snippet acciones()}
			<button
				class="boton-modal boton-secundario"
				onclick={cancelarGuardarObra}
				disabled={guardandoObra}
				type="button"
			>
				Cancelar
			</button>
			<button
				class="boton-modal boton-primario"
				onclick={confirmarGuardarObra}
				disabled={guardandoObra}
				type="button"
			>
				{#if guardandoObra}
					Guardando...
				{:else}
					Guardar
				{/if}
			</button>
		{/snippet}
	</Modal>

	<!-- Modal de guardado exitoso -->
	<Modal
		bind:abierto={modalGuardadoExitoso}
		titulo="¡Obra guardada!"
		anchoMaximo="450px"
	>
		<div style="padding: 1.5rem 0; text-align: center;">
			<div style="font-size: 4rem; margin-bottom: 1rem;">🎨</div>
			<p style="font-size: 1.1rem; margin-bottom: 0.5rem; font-weight: 600;">
				¡Tu obra ha sido guardada exitosamente!
			</p>
			<p style="color: var(--color-texto-secundario, #666); font-size: 0.9rem;">
				Puedes verla en la galería cuando quieras.
			</p>
		</div>

		{#snippet acciones()}
			<button
				class="boton-modal boton-primario"
				onclick={cerrarModalExito}
				type="button"
			>
				Aceptar
			</button>
		{/snippet}
	</Modal>
</div>

<style>
	/* Contenedor principal */
	.taller-dibujo {
		width: 100%;
		height: 92vh;
		display: flex;
		flex-direction: column;
		background: var(--bg, #f5f5f5);
		color: var(--color-texto, #333);
        align-items: center;
        justify-content: center;
	}

	/* Información para lectores de pantalla */
	.info-estado-sr {
		position: absolute;
		left: -10000px;
		top: auto;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}

	/* Área principal */
	.area-principal {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1vh;
		overflow: hidden;
        justify-content: center;
        align-items: center;
	}

	.seccion-herramientas {
        min-width: 95vw;
		flex-shrink: 0;
		z-index: 201;
		margin-bottom: 2vh;
	}

	.seccion-lienzo {
		top: 0;
        min-width: 70vw;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		position: relative;
	}

	.contenedor-lienzo {
		flex: 1;
		position: relative;
		border: 3px solid var(--color-borde-lienzo, #000);
		border-radius: 12px;
		overflow: hidden;
		background: var(--color-fondo-lienzo, #fff);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	/* Panel de información de navegación - posicionado absolutamente fuera del flujo */
	.panel-informacion-navegacion {
		position: absolute;
		bottom: -10vh;
		width: max-content;
		left: 25%;
		background: var(--color-fondo-panel, #fff);
		color: #000;
		border-radius: 8px;
		padding: 0.75rem 1rem;
		border: 2px solid var(--color-borde-panel, #000);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		white-space: nowrap;
		z-index: 202;
		font-size: calc(var(--font-size-base,1rem)*1);
		animation: fadeInPanel 0.3s ease-in-out forwards;
	}

	@keyframes fadeInPanel {
		0% {
			opacity: 0;
			transform: translateY(-10px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.zona-info {
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.icono-zona {
		line-height: 1;
	}

	.texto-zona {
		font-weight: 600;
		flex: 1;
	}

	.instruccion-rapida {
		opacity: 0.9;
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		list-style: none;
		padding: 0;
		margin: 0;
		justify-content: center;
	}

	.instruccion-rapida li {
		margin: 0;
		padding: 0;
	}

	.instruccion-rapida kbd {
		background:  #f1f1f1;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 0.2rem 0.4rem;
		font-family: monospace;
		font-weight: bold;
	}

    /* ============================================================================
	   BOTONES DEL MODAL
	   ============================================================================ */

	/* Estilos para botones de modales */
	:global(.boton-modal) {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 2px solid transparent;
	}

	:global(.boton-modal:disabled) {
		opacity: 0.6;
		cursor: not-allowed;
	}

	:global(.boton-modal.boton-primario) {
		background: var(--color-primario, #4CAF50);
		color: white;
		border-color: var(--color-primario, #4CAF50);
	}

	:global(.boton-modal.boton-primario:hover:not(:disabled)) {
		background: var(--color-primario-hover, #45a049);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
	}

	:global(.boton-modal.boton-secundario) {
		background: transparent;
		color: var(--color-texto, #333);
		border-color: var(--color-borde, #ccc);
	}

	:global(.boton-modal.boton-secundario:hover:not(:disabled)) {
		background: var(--color-fondo-hover, #f5f5f5);
		border-color: var(--color-borde-hover, #999);
	}

</style>
