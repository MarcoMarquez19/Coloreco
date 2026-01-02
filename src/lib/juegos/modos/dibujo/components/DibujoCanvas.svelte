<!--
  DibujoCanvas.svelte
  Componente de lienzo de dibujo que permite dibujar sobre una imagen de escena de fondo.
  Recibe el sceneId y carga la imagen correspondiente usando el servicio de escenas.
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { buscarPorEscenaId } from '$lib/db/escenas.service';
	import type { EscenaCatalogo } from '$lib/db/schemas';
	import { guardarObra } from '$lib/db/obras.service';
	import { obtenerSesionActual } from '$lib/db/artistas.service';

	// Props para zoom y pan
	interface Props {
		nivelZoom?: number;
		offsetX?: number;
		offsetY?: number;
		modoMoverActivo?: boolean;
	}

	let { 
		nivelZoom = 1,
		offsetX = 0,
		offsetY = 0,
		modoMoverActivo = false
	}: Props = $props();

	// Referencias del canvas y elementos
	let canvasDibujoRef: HTMLCanvasElement | undefined = $state<HTMLCanvasElement | undefined>(undefined); // Canvas para el dibujo del usuario
	let imagenEscenaRef: HTMLImageElement | undefined = $state<HTMLImageElement | undefined>(undefined); // Imagen vectorial de fondo
	let contextoDibujo: CanvasRenderingContext2D; // Contexto para dibujar
	let contenedorCanvasRef: HTMLDivElement | undefined = $state<HTMLDivElement | undefined>(undefined); // Contenedor de los elementos
	
	// Estado de la escena
	let escena: EscenaCatalogo | null = $state<EscenaCatalogo | null>(null);
	let error: string | null = $state<string | null>(null);
	let cargando = $state<boolean>(true);
	
	// Estado del dibujo
	let estaDibujando = $state<boolean>(false);
	let colorActual = $state<string>('#000000');
	let grosorActual = $state<number>(5);
	let herramientaActual = $state<'pincel' | 'borrador' | 'stickers'>('pincel');
	
	// Estado de stickers
	let stickerPendiente: { emoji: string; escala: number } | null = $state(null);
	
	// Historial para deshacer
	let historialDibujo: ImageData[] = [];
	const MAX_HISTORIAL = 20;

	/**
	 * Carga la información de la escena basada en el sceneId de la URL
	 */
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
			error = 'Ocurrió un error al cargar la escena.';
		} finally {
			cargando = false;
		}
	}

	/**
	 * Inicializa el canvas de dibujo
	 */
	function inicializarCanvas() {
		if (!canvasDibujoRef || !escena) return;

		// Inicializar contexto de dibujo
		contextoDibujo = canvasDibujoRef.getContext('2d')!;
		
		// Configurar el tamaño del canvas de dibujo
		const width = canvasDibujoRef.offsetWidth;
		const height = canvasDibujoRef.offsetHeight;
		
		canvasDibujoRef.width = width;
		canvasDibujoRef.height = height;
		
		// Guardar estado inicial del canvas de dibujo
		guardarEstadoEnHistorial();
	}

	/**
	 * Guarda el estado actual del canvas en el historial
	 */
	function guardarEstadoEnHistorial() {
		if (!contextoDibujo) return;
		
		const estadoActual = contextoDibujo.getImageData(0, 0, canvasDibujoRef!.width, canvasDibujoRef!.height);
		historialDibujo.push(estadoActual);
		
		// Limitar el tamaño del historial
		if (historialDibujo.length > MAX_HISTORIAL) {
			historialDibujo.shift();
		}
	}

	/**
	 * Obtiene las coordenadas relativas al canvas
	 */
	function obtenerCoordenadas(evento: MouseEvent | TouchEvent): { x: number; y: number } {
		const rect = canvasDibujoRef!.getBoundingClientRect();
		let clientX: number, clientY: number;

		if (evento instanceof MouseEvent) {
			clientX = evento.clientX;
			clientY = evento.clientY;
		} else {
			clientX = evento.touches[0].clientX;
			clientY = evento.touches[0].clientY;
		}

		// 1. Calculamos la posición relativa al borde visual del canvas
		const xVisual = clientX - rect.left;
		const yVisual = clientY - rect.top;

		// 2. Ajustamos la coordenada visual dividiéndola por el factor de zoom
		// Esto mapea el píxel de la pantalla al píxel del buffer del canvas
		const x = xVisual * (canvasDibujoRef!.width / rect.width);
		const y = yVisual * (canvasDibujoRef!.height / rect.height);

		return { x, y };
	}

	/**
	 * Inicia el dibujo o coloca sticker según la herramienta activa
	 */
	function iniciarDibujo(evento: MouseEvent | TouchEvent) {
		evento.preventDefault();
		
		const { x, y } = obtenerCoordenadas(evento);
		
		// Si estamos en modo stickers y hay un sticker pendiente, colocarlo
		if (herramientaActual === 'stickers' && stickerPendiente) {
			colocarSticker(stickerPendiente.emoji, x, y, stickerPendiente.escala);
			return;
		}
		
		// Modo dibujo normal (pincel o borrador)
		estaDibujando = true;
		contextoDibujo.beginPath();
		contextoDibujo.moveTo(x, y);
	}

	/**
	 * Dibuja mientras se mueve el cursor
	 */
	function dibujar(evento: MouseEvent | TouchEvent) {
		if (!estaDibujando) return;
		evento.preventDefault();
		
		const { x, y } = obtenerCoordenadas(evento);
		contextoDibujo.lineTo(x, y);
		contextoDibujo.stroke();
	}

	/**
	 * Termina el dibujo
	 */
	function terminarDibujo() {
		if (!estaDibujando) return;
		estaDibujando = false;
		contextoDibujo.beginPath();
		
		// Guardar estado después de dibujar
		guardarEstadoEnHistorial();
	}

	// Métodos públicos expuestos
	
	/**
	 * Establece el estilo de dibujo para el pincel
	 */
	export function establecerEstiloDibujo(color: string, grosor: number) {
		colorActual = color;
		grosorActual = grosor;
		herramientaActual = 'pincel';
		
		if (contextoDibujo) {
			contextoDibujo.strokeStyle = color;
			contextoDibujo.lineWidth = grosor;
			contextoDibujo.lineCap = 'round';
			contextoDibujo.lineJoin = 'round';
			contextoDibujo.globalCompositeOperation = 'source-over';
			contextoDibujo.globalAlpha = 0.5; // Reducir opacidad para colores menos vibrantes
		}
	}

	/**
	 * Establece el modo borrador
	 */
	export function establecerBorrador(grosor: number) {
		grosorActual = grosor;
		herramientaActual = 'borrador';
		
		if (contextoDibujo) {
			contextoDibujo.lineWidth = grosor;
			contextoDibujo.lineCap = 'round';
			contextoDibujo.lineJoin = 'round';
			contextoDibujo.globalCompositeOperation = 'destination-out';
			contextoDibujo.globalAlpha = 1.0; // Borrador con opacidad completa
		}
	}

	/**
	 * Coloca un sticker (emoji) en las coordenadas indicadas
	 * @param emoji - El emoji a dibujar
	 * @param x - Coordenada X en el canvas
	 * @param y - Coordenada Y en el canvas
	 * @param escala - Factor de escala (1.0 = tamaño base de 48px)
	 */
	export function colocarSticker(emoji: string, x: number, y: number, escala: number = 1.0) {
		if (!contextoDibujo) return;
		
		// Tamaño base del sticker
		const tamanoBase = 18;
		const tamanoFinal = tamanoBase * escala;
		
		// Guardar estado actual del contexto
		contextoDibujo.save();
		
		// Configurar para dibujo de texto (emoji)
		contextoDibujo.globalCompositeOperation = 'source-over';
		contextoDibujo.globalAlpha = 1.0;
		contextoDibujo.font = `${tamanoFinal}vh "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
		contextoDibujo.textAlign = 'center';
		contextoDibujo.textBaseline = 'middle';
		
		// Dibujar el emoji centrado en las coordenadas
		contextoDibujo.fillText(emoji, x, y);
		
		// Restaurar estado del contexto
		contextoDibujo.restore();
		
		// Guardar en historial después de colocar el sticker
		guardarEstadoEnHistorial();
	}

	/**
	 * Establece el sticker pendiente para colocar al hacer click
	 * @param emoji - El emoji del sticker
	 * @param escala - Factor de escala
	 */
	export function establecerStickerPendiente(emoji: string, escala: number) {
		stickerPendiente = { emoji, escala };
		herramientaActual = 'stickers';
	}

	/**
	 * Actualiza la escala del sticker pendiente
	 * @param escala - Nueva escala
	 */
	export function actualizarEscalaSticker(escala: number) {
		if (stickerPendiente) {
			stickerPendiente = { ...stickerPendiente, escala };
		}
	}

	/**
	 * Limpia el sticker pendiente (al cambiar de herramienta)
	 */
	export function limpiarStickerPendiente() {
		stickerPendiente = null;
	}

	/**
	 * Limpia todo el canvas y vuelve a cargar la imagen de fondo
	 */
	export function limpiar() {
		if (!contextoDibujo) return;
		
		// Limpiar el canvas de dibujo
		contextoDibujo.clearRect(0, 0, canvasDibujoRef!.width, canvasDibujoRef!.height);
		
		// Limpiar historial excepto el estado inicial vacío
		historialDibujo = [];
		guardarEstadoEnHistorial();
	}

	/**
	 * Deshace la última acción
	 */
	export function deshacer() {
		if (historialDibujo.length <= 1) return;
		
		// Remover el estado actual
		historialDibujo.pop();
		
		// Restaurar el estado anterior
		const estadoAnterior = historialDibujo[historialDibujo.length - 1];
		if (estadoAnterior && contextoDibujo) {
			contextoDibujo.putImageData(estadoAnterior, 0, 0);
		}
	}

	/**
	 * Obtiene el contexto del canvas (para integración con el servicio)
	 */
	export function obtenerContexto(): CanvasRenderingContext2D | null {
		return contextoDibujo || null;
	}

	/**
	 * Deshabilita los eventos del canvas (para modo mover)
	 */
	export function deshabilitarEventos() {
		if (!canvasDibujoRef) return;
		canvasDibujoRef.style.pointerEvents = 'none';
	}

	/**
	 * Habilita los eventos del canvas
	 */
	export function habilitarEventos() {
		if (!canvasDibujoRef) return;
		canvasDibujoRef.style.pointerEvents = 'auto';
	}

	/**
	 * Guarda el dibujo como obra en la galería
	 */
	export async function guardarDibujo(): Promise<void> {
		if (!canvasDibujoRef || !imagenEscenaRef || !escena) return;

		try {
			// Obtener el artistaId actual de los ajustes
			const sesion = await obtenerSesionActual();
			const artistaId = sesion?.artistaActualId ?? null;

			if (!artistaId) return;

			// Crear un canvas temporal para combinar ambas capas
			const canvasTemp = document.createElement('canvas');
			canvasTemp.width = canvasDibujoRef.width;
			canvasTemp.height = canvasDibujoRef.height;
			const ctxTemp = canvasTemp.getContext('2d')!;
			
			// Primero dibujar el canvas de dibujo (capa inferior - trazos del usuario)
			ctxTemp.drawImage(canvasDibujoRef, 0, 0);
			
			// Luego dibujar la imagen vectorial encima
			// La imagen mantiene su calidad vectorial hasta este momento
			ctxTemp.drawImage(imagenEscenaRef, 0, 0, canvasTemp.width, canvasTemp.height);

			// Convertir el canvas temporal a blob
			const blob = await new Promise<Blob>((resolve, reject) => {
				canvasTemp.toBlob((blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error('No se pudo convertir el canvas a blob'));
					}
				}, 'image/png');
			});

			// Generar título basado en la escena y fecha
			const fecha = new Date();
			const titulo = `${escena.nombre} - ${fecha.toLocaleDateString()}`;
			
			// Preparar datos de la obra
			const datosObra = {
				artistaId,
				titulo,
				descripcion: `Dibujo creado en la escena: ${escena.nombre}`,
				modo: escena.modo,
				blob,
				mime: 'image/png',
				escenaId: escena.escenaId,
				etiquetas: [escena.nombre, 'dibujo', 'taller'],
				alt: `Dibujo de ${escena.nombre} creado el ${fecha.toLocaleDateString()}`
			};

			// Guardar la obra en la base de datos
			const obraId = await guardarObra(datosObra);
		} catch (error) {
			throw error; // Propagar el error
		}
	}

	// Efectos reactivos
	$effect(() => {
		if (escena && canvasDibujoRef) {
			inicializarCanvas();
		}
	});

	// Efecto para aplicar zoom y offset a los canvas
	$effect(() => {
		if (!contenedorCanvasRef) return;
		
		const transform = `scale(${nivelZoom}) translate(${offsetX}px, ${offsetY}px)`;
		contenedorCanvasRef.style.transform = transform;
		contenedorCanvasRef.style.transformOrigin = 'center center';
		contenedorCanvasRef.style.transition = 'transform 0.3s ease';
	});

	// Cargar escena al montar el componente
	onMount(() => {
		void cargarEscena();
	});

	// Registrar listeners con passive: false para permitir preventDefault
	$effect(() => {
		if (!canvasDibujoRef) return;

		const touchStartHandler = iniciarDibujo as EventListener;
		const touchMoveHandler = dibujar as EventListener;
		const touchEndHandler = terminarDibujo as EventListener;

		canvasDibujoRef.addEventListener('touchstart', touchStartHandler, { passive: false });
		canvasDibujoRef.addEventListener('touchmove', touchMoveHandler, { passive: false });
		canvasDibujoRef.addEventListener('touchend', touchEndHandler);

		return () => {
			canvasDibujoRef!.removeEventListener('touchstart', touchStartHandler);
			canvasDibujoRef!.removeEventListener('touchmove', touchMoveHandler);
			canvasDibujoRef!.removeEventListener('touchend', touchEndHandler);
		};
	});
</script>

<!-- Contenedor del canvas con estados de carga -->
<div class="contenedor-canvas" aria-label="Lienzo de dibujo">
	{#if cargando}
		<div class="estado-carga" role="status" aria-busy="true">
			<p>Cargando escena...</p>
		</div>
	{:else if error}
		<div class="estado-error" role="alert">
			<p>{error}</p>
		</div>
	{:else if escena}
		<!-- Contenedor interno que recibe el transform de zoom -->
		<div bind:this={contenedorCanvasRef} class="contenedor-canvas-transform">
			<!-- Canvas de dibujo (capa inferior - donde dibuja el usuario) -->
			<canvas
				bind:this={canvasDibujoRef}
				class="lienzo-dibujo"
				aria-label={`Lienzo para dibujar sobre la escena: ${escena.nombre}`}
				onmousedown={iniciarDibujo}
				onmousemove={dibujar}
				onmouseup={terminarDibujo}
				onmouseleave={terminarDibujo}

			></canvas>
			
			<!-- Imagen vectorial de escena (capa superior - renderizado nativo del navegador) -->
			<img
				bind:this={imagenEscenaRef}
				src={escena.ruta}
				alt={escena.nombre}
				class="imagen-escena"
				aria-hidden="true"
			/>
		</div>
	{/if}
</div>

<style>
	.contenedor-canvas {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		background:#f5f5f5;
		border-radius: 8px;
		overflow: hidden;
	}

	.contenedor-canvas-transform {
		position: relative;
		width: 100%;
		height: 100%;
		transform-origin: center center;
	}

	.lienzo-dibujo,
	.imagen-escena {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.lienzo-dibujo {
		z-index: 1; /* Capa inferior para el dibujo del usuario */
		cursor: crosshair;
		touch-action: none;
		background: white;
	}

	.imagen-escena {
		z-index: 200; /* Capa superior para la imagen vectorial */
		pointer-events: none; /* Permite que los eventos pasen al canvas de dibujo */
		object-fit: fill; /* Deforma la imagen para ocupar el 100% del contenedor sin mantener proporciones */
		object-position: center;
		display: block; /* Elimina espacios en blanco del elemento inline */
	}

	.lienzo-dibujo:active {
		cursor: grabbing;
	}

	.estado-carga,
	.estado-error {
		padding: 2rem;
		text-align: center;
		font-size: 1.2rem;
		color: #333;
	}

	.estado-error {
		color: var(--error, #d32f2f);
	}

	.estado-carga p,
	.estado-error p {
		margin: 0;
	}
</style>