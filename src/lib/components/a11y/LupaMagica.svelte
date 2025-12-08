<script lang="ts">
	import { configuraciones } from '$lib/stores/settings';
	import { onDestroy, onMount } from 'svelte';

	let mouseX = $state(0);
	let mouseY = $state(0);
	let lensX = $state(0);
	let lensY = $state(0);
	let isReady = $state(false);
	
	let videoElement: HTMLVideoElement | null = $state(null);
	let canvasElement: HTMLCanvasElement | null = $state(null);
	let stream: MediaStream | null = null;
	let animationFrameId: number;
	let dpr = $state(1); // Device Pixel Ratio

	const LENS_SIZE = 230; // Un poco más grande para mejor lectura
	const OFFSET_DISTANCE = 60;

	async function startCapture() {
		try {
			// Detectar la densidad de píxeles actual (ej: 2 en Mac/Móviles, 1 en monitores normales)
			dpr = window.devicePixelRatio || 1;

			stream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					displaySurface: 'browser',
					// @ts-ignore
					preferCurrentTab: true,
					// Solicitamos la máxima resolución posible para que la fuente sea nítida
					width: { ideal: window.screen.width * dpr },
					height: { ideal: window.screen.height * dpr },
					frameRate: 30, // 30 es suficiente, priorizamos calidad sobre fps
					// @ts-ignore
					cursor: 'never' 
				},
				audio: false,
				// @ts-ignore
				selfBrowserSurface: 'include'
			});

			// CONFIGURACIÓN CRÍTICA PARA TEXTO
			const track = stream.getVideoTracks()[0];
			if ('contentHint' in track) {
				// @ts-ignore - Le dice al navegador: "Prioriza la legibilidad del texto"
				track.contentHint = 'text';
			}

			if (videoElement) {
				videoElement.srcObject = stream;
				videoElement.onloadedmetadata = () => {
					videoElement?.play();
					isReady = true;
					renderLoop();
				};
			}

			track.onended = () => {
				stopCapture();
				$configuraciones.lupaActivada = false;
			};

		} catch (err) {
			console.error("Error al iniciar lupa:", err);
			$configuraciones.lupaActivada = false;
		}
	}

	function stopCapture() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
		}
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		isReady = false;
	}

	function handleMouseMove(event: MouseEvent) {
		mouseX = event.clientX;
		mouseY = event.clientY;

		// Lógica de offset inteligente (misma que antes)
		let targetX = mouseX + OFFSET_DISTANCE;
		let targetY = mouseY + OFFSET_DISTANCE;

		if (targetX + LENS_SIZE > window.innerWidth) {
			targetX = mouseX - LENS_SIZE - OFFSET_DISTANCE;
		}
		if (targetY + LENS_SIZE > window.innerHeight) {
			targetY = mouseY - LENS_SIZE - OFFSET_DISTANCE;
		}
		lensX = targetX;
		lensY = targetY;
	}

	function renderLoop() {
		if (!videoElement || !canvasElement || !isReady) return;

		const ctx = canvasElement.getContext('2d', { 
			alpha: false,
			desynchronized: true // Mejora latencia
		});
		if (!ctx) return;

		const zoom = $configuraciones.nivelMagnificacion || 2;
		
		// CONFIGURACIÓN DE NITIDEZ
		// 'high' intenta usar mejores algoritmos de escalado
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';

		const ratioX = videoElement.videoWidth / window.innerWidth;
		const ratioY = videoElement.videoHeight / window.innerHeight;

		const sourceW = (LENS_SIZE / zoom) * ratioX;
		const sourceH = (LENS_SIZE / zoom) * ratioY;
		
		const sourceX = (mouseX * ratioX) - (sourceW / 2);
		const sourceY = (mouseY * ratioY) - (sourceH / 2);

		// Limpiar canvas antes de dibujar ayuda a evitar artefactos en algunos navegadores
		ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

		// DIBUJADO
		// Nota: Dibujamos sobre el tamaño "físico" del canvas (multiplicado por dpr)
		ctx.drawImage(
			videoElement,
			sourceX, sourceY, sourceW, sourceH, 
			0, 0, LENS_SIZE * dpr, LENS_SIZE * dpr // Escalamos al tamaño real de píxeles del dispositivo
		);
		
		// Opcional: Filtro de contraste para mejorar lectura
		// Esto se aplica vía CSS al canvas, no aquí por rendimiento
		
		animationFrameId = requestAnimationFrame(renderLoop);
	}

	$effect(() => {
		if ($configuraciones.lupaActivada && !stream) {
			startCapture();
		} else if (!$configuraciones.lupaActivada && stream) {
			stopCapture();
		}
	});

	onMount(() => {
		window.addEventListener('mousemove', handleMouseMove);
		// Actualizar DPR si el usuario mueve la ventana entre monitores
		const updateDpr = () => { dpr = window.devicePixelRatio || 1; };
		window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener("change", updateDpr);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('mousemove', handleMouseMove);
		}
		stopCapture();
	});
</script>

{#if $configuraciones.lupaActivada}
	<video bind:this={videoElement} style="display: none;" playsinline muted></video>

	<div
		class="magic-magnifier"
		style="
			left: {lensX}px;
			top: {lensY}px;
			width: {LENS_SIZE}px;
			height: {LENS_SIZE}px;
			opacity: {isReady ? 1 : 0};
		"
	>
		<!-- 
			TRUCO DE NITIDEZ: 
			El canvas tiene atributos width/height multiplicados por el DPR (píxeles reales),
			pero CSS force el tamaño visual (píxeles lógicos).
		-->
		<canvas
			bind:this={canvasElement}
			width={LENS_SIZE * dpr}
			height={LENS_SIZE * dpr}
			style="width: 100%; height: 100%;"
		></canvas>
	</div>
{/if}

<style>
	.magic-magnifier {
		position: fixed;
		border-radius: 50%;
		pointer-events: none;
		z-index: 99999;
		border: 4px solid #0b6efd;
		/* Sombra sólida para mejor contraste visual contra el fondo */
		box-shadow: 
			0 0 0 4px rgba(255, 255, 255, 0.9), 
			0 20px 50px rgba(0,0,0,0.5);
		overflow: hidden;
		background: #fff;
		transition: opacity 0.2s, top 0.08s linear, left 0.08s linear;
	}

	canvas {
		display: block;
		border-radius: 50%;
		/* Aumentamos ligeramente el contraste del video resultante para texto más negro */
		filter: contrast(1.2) saturate(1.1) brightness(1.05);
	}
</style>