<!--
  DibujoCanvas.svelte
  Componente de lienzo de dibujo que permite dibujar sobre una imagen de escena de fondo.
  Recibe el sceneId y carga la imagen correspondiente usando el servicio de escenas.
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { buscarPorEscenaId } from '$lib/db/escenas.service';
	import type { EscenaCatalogo } from '$lib/db/schemas';
	import { guardarObra } from '$lib/db/obras.service';
	import { obtenerSesionActual } from '$lib/db/artistas.service';

	// Referencias del canvas y contexto
	let canvasDibujoRef: HTMLCanvasElement; // Canvas para el dibujo del usuario
	let canvasEscenaRef: HTMLCanvasElement; // Canvas para la imagen de la escena
	let contextoDibujo: CanvasRenderingContext2D; // Contexto para dibujar
	let contextoEscena: CanvasRenderingContext2D; // Contexto para la escena
	
	// Estado de la escena
	let escena: EscenaCatalogo | null = $state<EscenaCatalogo | null>(null);
	let error: string | null = $state<string | null>(null);
	let cargando = $state<boolean>(true);
	
	// Estado del dibujo
	let estaDibujando = $state<boolean>(false);
	let colorActual = $state<string>('#000000');
	let grosorActual = $state<number>(5);
	let herramientaActual = $state<'pincel' | 'borrador'>('pincel');
	
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
			console.error('[DibujoCanvas] Error al cargar escena:', e);
			error = 'Ocurrió un error al cargar la escena.';
		} finally {
			cargando = false;
		}
	}

	/**
	 * Inicializa el canvas y carga la imagen de fondo
	 */
	function inicializarCanvas() {
		if (!canvasDibujoRef || !canvasEscenaRef || !escena) return;

		// Inicializar contextos
		contextoDibujo = canvasDibujoRef.getContext('2d')!;
		contextoEscena = canvasEscenaRef.getContext('2d')!;
		
		// Configurar el tamaño de ambos canvas
		const width = canvasDibujoRef.offsetWidth;
		const height = canvasDibujoRef.offsetHeight;
		
		canvasDibujoRef.width = width;
		canvasDibujoRef.height = height;
		canvasEscenaRef.width = width;
		canvasEscenaRef.height = height;
		
		// Cargar imagen de escena en el canvas superior
		cargarImagenDeFondo();
		
		// Guardar estado inicial del canvas de dibujo
		guardarEstadoEnHistorial();
	}

	/**
	 * Carga la imagen de fondo de la escena
	 */
	function cargarImagenDeFondo() {
		if (!contextoEscena || !escena) return;

		const imagen = new Image();
		imagen.onload = () => {
			// Limpiar canvas de escena
			contextoEscena.clearRect(0, 0, canvasEscenaRef.width, canvasEscenaRef.height);
			
			// Dibujar imagen ajustada al 100% del canvas (puede deformarse para ocupar todo el espacio)
			contextoEscena.drawImage(imagen, 0, 0, canvasEscenaRef.width, canvasEscenaRef.height);
		};
		
		imagen.onerror = () => {
			console.error('[DibujoCanvas] Error al cargar la imagen de la escena');
		};
		
		imagen.src = escena.ruta;
	}

	/**
	 * Guarda el estado actual del canvas en el historial
	 */
	function guardarEstadoEnHistorial() {
		if (!contextoDibujo) return;
		
		const estadoActual = contextoDibujo.getImageData(0, 0, canvasDibujoRef.width, canvasDibujoRef.height);
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
		const rect = canvasDibujoRef.getBoundingClientRect();
		let clientX: number, clientY: number;

		if (evento instanceof MouseEvent) {
			clientX = evento.clientX;
			clientY = evento.clientY;
		} else {
			clientX = evento.touches[0].clientX;
			clientY = evento.touches[0].clientY;
		}

		return {
			x: clientX - rect.left,
			y: clientY - rect.top
		};
	}

	/**
	 * Inicia el dibujo
	 */
	function iniciarDibujo(evento: MouseEvent | TouchEvent) {
		evento.preventDefault();
		estaDibujando = true;
		
		const { x, y } = obtenerCoordenadas(evento);
		contextoDibujo.beginPath();
		contextoDibujo.moveTo(x, y);
	}

	/**
	 * Dibuja mientras se mueve el cursor/dedo
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
		}
	}

	/**
	 * Limpia todo el canvas y vuelve a cargar la imagen de fondo
	 */
	export function limpiar() {
		if (!contextoDibujo) return;
		
		// Limpiar el canvas de dibujo
		contextoDibujo.clearRect(0, 0, canvasDibujoRef.width, canvasDibujoRef.height);
		
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
	 * Guarda el dibujo como obra en la galería
	 */
	export async function guardarDibujo(): Promise<void> {
		if (!canvasDibujoRef || !canvasEscenaRef || !escena) {
			console.error('[DibujoCanvas] No hay canvas o escena disponible para guardar');
			return;
		}

		try {
			// Obtener el artistaId actual de los ajustes
			const sesion = await obtenerSesionActual();
			const artistaId = sesion?.artistaActualId ?? null;

			if (!artistaId) {
				console.error('[DibujoCanvas] No hay artista seleccionado');
				alert('Por favor, selecciona un artista antes de guardar el dibujo.');
				return;
			}

			// Crear un canvas temporal para combinar ambas capas
			const canvasTemp = document.createElement('canvas');
			canvasTemp.width = canvasDibujoRef.width;
			canvasTemp.height = canvasDibujoRef.height;
			const ctxTemp = canvasTemp.getContext('2d')!;
			
			// Primero dibujar el canvas de dibujo (capa inferior)
			ctxTemp.drawImage(canvasDibujoRef, 0, 0);
			// Luego dibujar el canvas de escena encima
			ctxTemp.drawImage(canvasEscenaRef, 0, 0);

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
			
			console.log(`[DibujoCanvas] Obra guardada exitosamente con ID: ${obraId}`);
			alert(`¡Dibujo guardado exitosamente en la galería! 🎨`);

		} catch (error) {
			console.error('[DibujoCanvas] Error al guardar el dibujo:', error);
			alert('Ocurrió un error al guardar el dibujo. Por favor, inténtalo de nuevo.');
		}
	}

	// Efectos reactivos
	$effect(() => {
		if (escena && canvasDibujoRef && canvasEscenaRef) {
			inicializarCanvas();
		}
	});

	// Cargar escena al montar el componente
	onMount(() => {
		void cargarEscena();
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
		<!-- Canvas de dibujo (capa inferior - donde dibuja el usuario) -->
		<canvas
			bind:this={canvasDibujoRef}
			class="lienzo-dibujo"
			aria-label={`Lienzo para dibujar sobre la escena: ${escena.nombre}`}
			onmousedown={iniciarDibujo}
			onmousemove={dibujar}
			onmouseup={terminarDibujo}
			onmouseleave={terminarDibujo}
			ontouchstart={iniciarDibujo}
			ontouchmove={dibujar}
			ontouchend={terminarDibujo}
		></canvas>
		
		<!-- Canvas de escena (capa superior - imagen que permanece encima) -->
		<canvas
			bind:this={canvasEscenaRef}
			class="lienzo-escena"
			aria-hidden="true"
		></canvas>
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
		background: var(--color-fondo-canvas, #f5f5f5);
		border-radius: 8px;
		overflow: hidden;
	}

	.lienzo-dibujo,
	.lienzo-escena {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: transparent;
	}

	.lienzo-dibujo {
		z-index: 1; /* Capa inferior para el dibujo del usuario */
		cursor: crosshair;
		touch-action: none;
		background: white;
	}

	.lienzo-escena {
		z-index: 200; /* Capa superior para la imagen de la escena */
		pointer-events: none; /* Permite que los eventos pasen al canvas de dibujo */
	}

	.lienzo-dibujo:active {
		cursor: grabbing;
	}

	.estado-carga,
	.estado-error {
		padding: 2rem;
		text-align: center;
		font-size: 1.2rem;
		color: var(--color-texto, #333);
	}

	.estado-error {
		color: var(--color-error, #d32f2f);
	}

	.estado-carga p,
	.estado-error p {
		margin: 0;
	}
</style>