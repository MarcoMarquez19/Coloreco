<script lang="ts">
// Componente Lupa Mágica - Magnificación en vivo
import { settings } from '$lib/stores/settings';
import { onMount, onDestroy } from 'svelte';

let mouseX = $state(window.innerWidth / 2);
let mouseY = $state(window.innerHeight / 2);
const LENS_SIZE = 150;
let lensElement: HTMLElement | null = $state(null);
let portalContainer: HTMLDivElement | null = $state(null);
let clonedNode: HTMLElement | null = null;
// Ajuste visual del puntero (negativo = izquierda / arriba)
let pointerOffsetX = -8; // px
let pointerOffsetY = -6; // px

function handleMouseMove(event: MouseEvent) {
	mouseX = event.clientX;
	mouseY = event.clientY;
	updateTransform();
}

function updateTransform() {
	if (portalContainer && clonedNode) {
		const zoom = $settings.magnifierZoom;
		const scrollX = window.scrollX;
		const scrollY = window.scrollY;
		const originX = mouseX + scrollX;
		const originY = mouseY + scrollY;
		clonedNode.style.transformOrigin = `${originX}px ${originY}px`;
		clonedNode.style.transform = `scale(${zoom})`;
		portalContainer.scrollLeft = originX - LENS_SIZE / (2 * zoom);
		portalContainer.scrollTop = originY - LENS_SIZE / (2 * zoom);
	}
}

function recreateClone() {
	if (!portalContainer) return;
	// Eliminar el clon anterior si existe
	if (clonedNode && portalContainer.contains(clonedNode)) {
		portalContainer.removeChild(clonedNode);
		clonedNode = null;
	}
	const appRoot = document.getElementById('svelte') || document.body;
	if (appRoot) {
		clonedNode = appRoot.cloneNode(true) as HTMLElement;
		clonedNode.removeAttribute('id');
		clonedNode.removeAttribute('tabindex');
		clonedNode.style.pointerEvents = 'none';
		clonedNode.style.userSelect = 'none';
		clonedNode.style.position = 'absolute';
		clonedNode.style.top = '0';
		clonedNode.style.left = '0';
		clonedNode.style.width = `${appRoot.scrollWidth}px`;
		clonedNode.style.height = `${appRoot.scrollHeight}px`;
		portalContainer.appendChild(clonedNode);
		updateTransform();
	}
}



onMount(() => {
	document.addEventListener('mousemove', handleMouseMove);
	window.addEventListener('scroll', updateTransform, true);
});

onDestroy(() => {
	document.removeEventListener('mousemove', handleMouseMove);
	window.removeEventListener('scroll', updateTransform, true);
	if (portalContainer && clonedNode) {
		portalContainer.removeChild(clonedNode);
	}
});

$effect(() => {
	// Recrear el clon cada vez que se activa la lupa o cambia el menú
	if ($settings.magnifierEnabled && portalContainer) {
		recreateClone();
	}
});

$effect(() => {
	updateTransform();
});

function propagateEvent(e: MouseEvent, type: string) {
	// Calcula la posición real del cursor en la página
	const realX = mouseX;
	const realY = mouseY;
	const el = document.elementFromPoint(realX, realY);
	if (el) {
		const evt = new MouseEvent(type, {
			bubbles: true,
			cancelable: true,
			clientX: realX,
			clientY: realY,
			button: e.button,
			buttons: e.buttons,
			ctrlKey: e.ctrlKey,
			shiftKey: e.shiftKey,
			altKey: e.altKey,
			metaKey: e.metaKey
		});
		el.dispatchEvent(evt);
		// Opcional: evitar que el evento se propague en la lupa
		e.preventDefault();
		e.stopPropagation();
	}
}
</script>

{#if $settings.magnifierEnabled}
<div
	bind:this={lensElement}
	class="magic-magnifier"
	style="
		left: {mouseX - LENS_SIZE / 2}px;
		top: {mouseY - LENS_SIZE / 2}px;
		width: {LENS_SIZE}px;
		height: {LENS_SIZE}px;
	"
	aria-hidden="true"
	role="presentation"
>
	<div
		bind:this={portalContainer}
		class="magnifier-portal"
		style="
			width: 100%;
			height: 100%;
			overflow: hidden;
			position: relative;
		"
	></div>
	<!-- Puntero que indica la posición relativa donde se mapeará el clic -->
	<div
		class="lens-pointer"
		style="left: {LENS_SIZE / 2 + pointerOffsetX}px; top: {LENS_SIZE / 2 + pointerOffsetY}px;"
		aria-hidden="true"
	></div>
	<div class="lens-highlight"></div>
</div>
{/if}

<style>
.magic-magnifier {
	position: fixed;
	border-radius: 50%;
	pointer-events: none;
	z-index: 9999;
	border: 3px solid #0b6efd;
	box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.8),
		0 8px 32px rgba(0, 0, 0, 0.3),
		inset 0 0 20px rgba(0, 0, 0, 0.1);
	transition: transform 0.05s ease-out;
	backdrop-filter: contrast(1.05) saturate(1.1);
	overflow: hidden;
}
.magnifier-portal {
	width: 100%;
	height: 100%;
	overflow: hidden;
	position: relative;
}
.lens-highlight {
	position: absolute;
	top: 5%;
	left: 10%;
	width: 40%;
	height: 20%;
	background: linear-gradient(180deg,rgba(255,255,255,0.6) 0%,rgba(255,255,255,0) 100%);
	border-radius: 50%;
	pointer-events: none;
}

/* Puntero dentro de la lupa - representa la diferencia de coordenadas */
.lens-pointer {
	position: absolute;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: rgba(255,255,255,0.95);
	border: 2px solid rgba(11,110,253,0.95);
	box-shadow: 0 2px 6px rgba(0,0,0,0.2);
	transform: translate(-30%, -30%); /* centrar en coordenada */
	pointer-events: none; /* no bloquear interacciones */
	z-index: 2;
}
@keyframes magnifier-appear {
	from { opacity: 0; transform: scale(0.8); }
	to { opacity: 1; transform: scale(1); }
}
.magic-magnifier {
	animation: magnifier-appear 200ms ease-out;
}
@media (prefers-reduced-motion: reduce) {
	.magic-magnifier {
		transition: none;
		animation: none;
	}
}
</style>
