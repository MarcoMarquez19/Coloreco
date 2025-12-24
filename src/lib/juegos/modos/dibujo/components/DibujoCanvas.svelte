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
	let canvasRef: HTMLCanvasElement;
	let contexto: CanvasRenderingContext2D;
	
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
		if (!canvasRef || !escena) return;

		contexto = canvasRef.getContext('2d')!;
		
		// Configurar el tamaño del canvas
		canvasRef.width = canvasRef.offsetWidth;
		canvasRef.height = canvasRef.offsetHeight;
		
		// Cargar imagen de fondo
		cargarImagenDeFondo();
		
		// Guardar estado inicial
		guardarEstadoEnHistorial();
	}

	/**
	 * Carga la imagen de fondo de la escena
	 */
	function cargarImagenDeFondo() {
		if (!contexto || !escena) return;

		const imagen = new Image();
		imagen.onload = () => {
			// Limpiar canvas
			contexto.clearRect(0, 0, canvasRef.width, canvasRef.height);
			
			// Dibujar imagen ajustada al 100% del canvas (puede deformarse para ocupar todo el espacio)
			contexto.drawImage(imagen, 0, 0, canvasRef.width, canvasRef.height);
			
			// Actualizar historial después de cargar la imagen
			guardarEstadoEnHistorial();
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
		if (!contexto) return;
		
		const estadoActual = contexto.getImageData(0, 0, canvasRef.width, canvasRef.height);
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
		const rect = canvasRef.getBoundingClientRect();
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
		contexto.beginPath();
		contexto.moveTo(x, y);
	}

	/**
	 * Dibuja mientras se mueve el cursor/dedo
	 */
	function dibujar(evento: MouseEvent | TouchEvent) {
		if (!estaDibujando) return;
		evento.preventDefault();
		
		const { x, y } = obtenerCoordenadas(evento);
		contexto.lineTo(x, y);
		contexto.stroke();
	}

	/**
	 * Termina el dibujo
	 */
	function terminarDibujo() {
		if (!estaDibujando) return;
		estaDibujando = false;
		contexto.beginPath();
		
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
		
		if (contexto) {
			contexto.strokeStyle = color;
			contexto.lineWidth = grosor;
			contexto.lineCap = 'round';
			contexto.lineJoin = 'round';
			contexto.globalCompositeOperation = 'source-over';
		}
	}

	/**
	 * Establece el modo borrador
	 */
	export function establecerBorrador(grosor: number) {
		grosorActual = grosor;
		herramientaActual = 'borrador';
		
		if (contexto) {
			contexto.lineWidth = grosor;
			contexto.lineCap = 'round';
			contexto.lineJoin = 'round';
			contexto.globalCompositeOperation = 'destination-out';
		}
	}

	/**
	 * Limpia todo el canvas y vuelve a cargar la imagen de fondo
	 */
	export function limpiar() {
		if (!contexto) return;
		
		// Limpiar historial excepto el estado inicial
		historialDibujo = historialDibujo.slice(0, 1);
		
		// Recargar imagen de fondo
		cargarImagenDeFondo();
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
		if (estadoAnterior && contexto) {
			contexto.putImageData(estadoAnterior, 0, 0);
		}
	}

	/**
	 * Obtiene el contexto del canvas (para integración con el servicio)
	 */
	export function obtenerContexto(): CanvasRenderingContext2D | null {
		return contexto || null;
	}

	/**
	 * Guarda el dibujo como obra en la galería
	 */
	export async function guardarDibujo(): Promise<void> {
		if (!canvasRef || !escena) {
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

			// Convertir el canvas a blob
			const blob = await new Promise<Blob>((resolve, reject) => {
				canvasRef.toBlob((blob) => {
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
		if (escena && canvasRef) {
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
		<canvas
			bind:this={canvasRef}
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

	.lienzo-dibujo {
		width: 100%;
		height: 100%;
		cursor: crosshair;
		touch-action: none;
		background: white;
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