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
	import { audioStore } from '$lib/stores/audio';

	// Props para zoom y pan
	interface Props {
		nivelZoom?: number;
		offsetX?: number;
		offsetY?: number;
		modoMoverActivo?: boolean;
		onStickerColocado?: (sticker: { emoji: string; escala: number }) => void;
	}

	let { 
		nivelZoom = 1,
		offsetX = 0,
		offsetY = 0,
		modoMoverActivo = false,
		onStickerColocado
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

		// Reproducir sonido en loop según la herramienta
		if (herramientaActual === 'pincel') {
			audioStore.playLoopSound('pencil');
		} else if (herramientaActual === 'borrador') {
			audioStore.playLoopSound('eraser');
		}
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
		
		// Detener el sonido en loop
		audioStore.stopLoopSound();
		
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
		
		// Reproducir sonido de colocar sticker
		audioStore.playSound('stickerPlace');
		
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
		
		// Notificar que se colocó un sticker (si hay callback)
		if (onStickerColocado) {
			onStickerColocado({ emoji, escala });
		}
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
	 * Carga una imagen existente en el canvas para edición
	 * @param urlImagen - URL de la imagen (blob URL o data URL)
	 */
	export async function cargarImagenParaEditar(urlImagen: string): Promise<void> {
		if (!contextoDibujo || !canvasDibujoRef) {
			console.error('[DibujoCanvas] Canvas no inicializado');
			return;
		}

		return new Promise((resolve, reject) => {
			const imagen = new Image();
			
			imagen.onload = () => {
				// Guardar el estado actual del contexto
				contextoDibujo.save();
				
				// Limpiar el canvas primero
				contextoDibujo.clearRect(0, 0, canvasDibujoRef!.width, canvasDibujoRef!.height);
				
				// Restaurar todos los valores por defecto del contexto para que la imagen se vea correctamente
				contextoDibujo.globalAlpha = 1.0; // Opacidad completa
				contextoDibujo.globalCompositeOperation = 'source-over'; // Modo de composición normal
				contextoDibujo.imageSmoothingEnabled = true;
				contextoDibujo.imageSmoothingQuality = 'high';
				
				// Dibujar la imagen ajustándola al tamaño del canvas
				// Mantener la proporción si es necesario
				const canvasWidth = canvasDibujoRef!.width;
				const canvasHeight = canvasDibujoRef!.height;
				
				// Calcular la escala para que la imagen quepa en el canvas
				const escalaAncho = canvasWidth / imagen.width;
				const escalaAlto = canvasHeight / imagen.height;
				const escala = Math.min(escalaAncho, escalaAlto);
				
				const nuevoAncho = imagen.width * escala;
				const nuevoAlto = imagen.height * escala;
				
				// Centrar la imagen en el canvas
				const x = (canvasWidth - nuevoAncho) / 2;
				const y = (canvasHeight - nuevoAlto) / 2;
				
				// Dibujar la imagen en el canvas con máxima calidad
				contextoDibujo.drawImage(imagen, x, y, nuevoAncho, nuevoAlto);
				
				// Restaurar el estado del contexto
				contextoDibujo.restore();
				
				// Guardar este estado como inicio del historial
				historialDibujo = [];
				guardarEstadoEnHistorial();
				
				console.log('[DibujoCanvas] Imagen cargada para edición');
				resolve();
			};
			
			imagen.onerror = (error) => {
				console.error('[DibujoCanvas] Error cargando imagen:', error);
				reject(error);
			};
			
			imagen.src = urlImagen;
		});
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
	 * Obtiene el elemento canvas de dibujo
	 * @returns El elemento canvas o undefined si no está disponible
	 */
	export function obtenerCanvas(): HTMLCanvasElement | undefined {
		return canvasDibujoRef;
	}

	/**
	 * Obtiene una miniatura combinando el SVG de fondo con el dibujo del usuario
	 * @param maxWidth - Ancho máximo de la miniatura (por defecto 400px)
	 * @param maxHeight - Alto máximo de la miniatura (por defecto 400px)
	 * @returns Data URL de la imagen combinada o null si hay error
	 */
	export function obtenerMiniatura(maxWidth: number = 1920, maxHeight: number = 1920): string | null {
		if (!canvasDibujoRef) {
			console.error('[DibujoCanvas] Canvas no disponible para miniatura');
			return null;
		}

		try {
			// Crear un canvas temporal para combinar las capas
			const canvasTemp = document.createElement('canvas');
			canvasTemp.width = canvasDibujoRef.width;
			canvasTemp.height = canvasDibujoRef.height;
			const ctxTemp = canvasTemp.getContext('2d')!;
			
			// Fondo blanco para la miniatura
			ctxTemp.fillStyle = '#ffffff';
			ctxTemp.fillRect(0, 0, canvasTemp.width, canvasTemp.height);
			
			// Primero dibujar el canvas de dibujo (trazos del usuario)
			ctxTemp.drawImage(canvasDibujoRef, 0, 0);
			
			// Si hay una imagen de escena, dibujarla encima
			if (imagenEscenaRef && escena) {
				ctxTemp.drawImage(imagenEscenaRef, 0, 0, canvasTemp.width, canvasTemp.height);
			}

			// Crear canvas para la miniatura redimensionada
			const scale = Math.min(maxWidth / canvasTemp.width, maxHeight / canvasTemp.height);
			const miniaturaCanvas = document.createElement('canvas');
			miniaturaCanvas.width = canvasTemp.width * scale;
			miniaturaCanvas.height = canvasTemp.height * scale;
			
			const ctxMiniatura = miniaturaCanvas.getContext('2d');
			if (ctxMiniatura) {
				ctxMiniatura.drawImage(canvasTemp, 0, 0, miniaturaCanvas.width, miniaturaCanvas.height);
				return miniaturaCanvas.toDataURL('image/png');
			}
			
			return null;
		} catch (error) {
			console.error('[DibujoCanvas] Error generando miniatura:', error);
			return null;
		}
	}

	/**
	 * Calcula el porcentaje del canvas que ha sido pintado/modificado
	 * @returns Porcentaje entre 0 y 100
	 */
	export function calcularPorcentajePintado(): number {
		if (!canvasDibujoRef || !contextoDibujo) return 0;

		try {
			// Obtener los datos de píxeles del canvas
			const imageData = contextoDibujo.getImageData(
				0, 
				0, 
				canvasDibujoRef.width, 
				canvasDibujoRef.height
			);
			const pixeles = imageData.data;
			
			let pixelesPintados = 0;
			let totalPixeles = canvasDibujoRef.width * canvasDibujoRef.height;
			
			// Recorrer los píxeles (RGBA, cada píxel son 4 valores)
			for (let i = 0; i < pixeles.length; i += 4) {
				const alpha = pixeles[i + 3]; // Canal alpha (transparencia)
				
				// Si el píxel tiene alguna opacidad, se considera pintado
				if (alpha > 0) {
					pixelesPintados++;
				}
			}
			
			// Calcular porcentaje
			const porcentaje = (pixelesPintados / totalPixeles) * 100;
			return Math.round(porcentaje * 100) / 100; // Redondear a 2 decimales
		} catch (error) {
			console.error('Error al calcular porcentaje pintado:', error);
			return 0;
		}
	}

	/**
	 * Guarda el dibujo como obra en la galería
	 */
	export async function guardarDibujo(): Promise<void> {
		if (!canvasDibujoRef) {
			throw new Error('Canvas no disponible');
		}

		try {
			// Obtener el artistaId actual de los ajustes
			const sesion = await obtenerSesionActual();
			const artistaId = sesion?.artistaActualId ?? null;

			if (!artistaId) return;

			// Crear un canvas temporal para combinar ambas capas (o solo el canvas si no hay escena)
			const canvasTemp = document.createElement('canvas');
			canvasTemp.width = canvasDibujoRef.width;
			canvasTemp.height = canvasDibujoRef.height;
			const ctxTemp = canvasTemp.getContext('2d')!;
			
			// Primero dibujar el canvas de dibujo (capa inferior - trazos del usuario)
			ctxTemp.drawImage(canvasDibujoRef, 0, 0);
			
			// Si hay una imagen de escena, dibujarla encima
			if (imagenEscenaRef && escena) {
				// La imagen mantiene su calidad vectorial hasta este momento
				ctxTemp.drawImage(imagenEscenaRef, 0, 0, canvasTemp.width, canvasTemp.height);
			}

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

			// Generar título basado en la escena (si existe) y fecha
			const fecha = new Date();
			const titulo = escena 
				? `${escena.nombre} - ${fecha.toLocaleDateString()}`
				: `Obra editada - ${fecha.toLocaleDateString()}`;
			
			// Preparar datos de la obra
			const datosObra = {
				artistaId,
				titulo,
				descripcion: escena 
					? `Dibujo creado en la escena: ${escena.nombre}`
					: 'Obra editada en el taller de dibujo',
				modo: (escena?.modo ?? 'dibujo') as 'dibujo' | 'cuerpoHumano' | 'historias',
				blob,
				mime: 'image/png',
				escenaId: escena?.escenaId,
				etiquetas: escena 
					? [escena.nombre, 'dibujo', 'taller']
					: ['dibujo', 'taller', 'editado'],
				alt: escena 
					? `Dibujo de ${escena.nombre} creado el ${fecha.toLocaleDateString()}`
					: `Obra editada el ${fecha.toLocaleDateString()}`
			};

			// Guardar la obra en la base de datos
			const obraId = await guardarObra(datosObra);
		} catch (error) {
			throw error; // Propagar el error
		}
	}

	// Efectos reactivos
	$effect(() => {
		// Inicializar canvas cuando esté listo (con o sin escena)
		if (canvasDibujoRef && (escena || !cargando)) {
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
	{:else}
		<!-- Contenedor interno que recibe el transform de zoom -->
		<div bind:this={contenedorCanvasRef} class="contenedor-canvas-transform">
			<!-- Canvas de dibujo (capa inferior - donde dibuja el usuario) -->
			<canvas
				bind:this={canvasDibujoRef}
				class="lienzo-dibujo"
				aria-label={escena ? `Lienzo para dibujar sobre la escena: ${escena.nombre}` : 'Lienzo de dibujo'}
				onmousedown={iniciarDibujo}
				onmousemove={dibujar}
				onmouseup={terminarDibujo}
				onmouseleave={terminarDibujo}

			></canvas>
			
			<!-- Imagen vectorial de escena (capa superior - renderizado nativo del navegador) -->
			<!-- Solo mostrar si hay una escena -->
			{#if escena}
				<img
					bind:this={imagenEscenaRef}
					src={escena.ruta}
					alt={escena.nombre}
					class="imagen-escena"
					aria-hidden="true"
				/>
			{/if}
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