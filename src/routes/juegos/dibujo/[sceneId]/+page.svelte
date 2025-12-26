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
				// TODO: Implementar funcionalidad de mover/pan
				console.log('[TallerDibujo] Función mover no implementada aún');
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
			case 'navegar':
				// El overlay maneja su propia navegación
				console.log(`[TallerDibujo] Navegación: ${detail.direccion}`);
				break;
			
			case 'seleccionar':
				// TODO: Implementar acción de dibujo en coordenadas específicas
				console.log(`[TallerDibujo] Seleccionar en: ${detail.x}, ${detail.y}`);
				break;
			
			case 'escapar':
				console.log('[TallerDibujo] Salir del modo accesible');
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
		servicioDibujo.destruir();
	});

    let contenedorModoDibujoRef: HTMLElement | null = null;

	/** Calcula y aplica la escala según la altura de la ventana (máx 1080px) */
	function actualizarEscala(): void {
		if (!contenedorModoDibujoRef) return;
		const maxHeight = 1080;
		const rawScale = window.innerHeight / maxHeight;
		// limitar entre 0.6 y 1 para evitar escalados excesivos
		const scale = Math.max(0.8, Math.min(1, rawScale));
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
	<!-- Panel de ayuda -->
	{#if mostrarAyuda}
		<aside class="panel-ayuda" aria-label="Panel de ayuda">
			<div class="contenido-ayuda">
				<h2>Atajos de Teclado</h2>
				<ul class="lista-atajos">
					<li><kbd>Ctrl+Z</kbd> - Deshacer</li>
					<li><kbd>Ctrl+S</kbd> - Guardar</li>
					<li><kbd>A</kbd> - Modo accesible</li>
					<li><kbd>F1</kbd> - Ayuda</li>
					<li><kbd>Escape</kbd> - Salir</li>
				</ul>
				<button class="boton-cerrar-ayuda" onclick={alternarAyuda}>
					Cerrar ayuda
				</button>
			</div>
		</aside>
	{/if}

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
			/>
		</section>

		<!-- Área del lienzo -->
		<section class="seccion-lienzo" aria-label="Lienzo de dibujo">
			<div class="contenedor-lienzo">
				<DibujoCanvas bind:this={canvasRef} />
				
				<!-- Overlay de accesibilidad -->
				<DibujoOverlay
					bind:this={overlayRef}
					on:navegar={manejarEventoOverlay}
					on:seleccionar={manejarEventoOverlay}
					on:escapar={manejarEventoOverlay}
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
		height: 90vh;
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

	/* Panel de ayuda */
	.panel-ayuda {
		position: absolute;
		top: 90px;
		right: 1.5rem;
		z-index: 1000;
		background: var(--color-fondo-panel, #fff);
		border: 3px solid var(--color-borde-panel, #000);
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
		max-width: 300px;
	}

	.contenido-ayuda h2 {
		margin: 0 0 1rem 0;
		font-size: 1.3rem;
		color: var(--color-titulo, #333);
	}

	.lista-atajos {
		list-style: none;
		padding: 0;
		margin: 0 0 1.5rem 0;
	}

	.lista-atajos li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--color-borde-lista, #eee);
	}

	.lista-atajos li:last-child {
		border-bottom: none;
	}

	.lista-atajos kbd {
		background: var(--color-fondo-kbd, #f1f1f1);
		border: 1px solid var(--color-borde-kbd, #ccc);
		border-radius: 4px;
		padding: 0.25rem 0.5rem;
		font-family: monospace;
		font-size: 0.9rem;
		font-weight: bold;
	}

	.boton-cerrar-ayuda {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid var(--color-borde-boton, #000);
		border-radius: 8px;
		background: var(--color-fondo-boton, #fff);
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.boton-cerrar-ayuda:hover {
		background: var(--color-fondo-boton-hover, #f0f0f0);
	}

	/* Área principal */
	.area-principal {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		overflow: hidden;
        justify-content: center;
        align-items: center;
	}

	.seccion-herramientas {
        min-width: 95vw;
		flex-shrink: 0;
		z-index: 201;
	}

	.seccion-lienzo {
        min-width: 70vw;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
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
