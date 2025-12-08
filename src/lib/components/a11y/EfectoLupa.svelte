<script lang="ts">
// Componente Lupa Mágica - Magnificación en vivo
import { configuraciones } from '$lib/stores/settings';
import { onMount, onDestroy } from 'svelte';

let mouseX = $state(window.innerWidth / 2);
let mouseY = $state(window.innerHeight / 2);
// NUEVO ESTADO: ¿El mouse está sobre una zona permitida?
let isOverZone = $state(false); 
const LENS_SIZE = 185;
let lensX = $state(0);
let lensY = $state(0);
const OFFSET_DISTANCE = 40;
// Agrega esto junto a tus otras declaraciones 'let'
let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout>;
let lensElement: HTMLElement | null = $state(null);
let portalContainer: HTMLDivElement | null = $state(null);
let clonedNode: HTMLElement | null = null;

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

	// Verificamos si el elemento bajo el mouse (o alguno de sus padres) tiene el atributo 'data-magnificable'
	const target = event.target as HTMLElement;
	// .closest() busca hacia arriba en el árbol DOM de forma muy eficiente
	isOverZone = !!target.closest('[data-magnificable]');
	updateTransform();
}

function updateTransform() {
	if (portalContainer && clonedNode) {
		const zoom = $configuraciones.nivelMagnificacion;
		const scrollX = window.scrollX;
		const scrollY = window.scrollY;
		const originX = mouseX + scrollX;
		const originY = mouseY + scrollY;
		clonedNode.style.transformOrigin = `${originX}px ${originY}px`;
		clonedNode.style.transform = `scale(${zoom})`;
		portalContainer.scrollLeft = originX - LENS_SIZE / (0.99 * zoom);
		portalContainer.scrollTop = originY - LENS_SIZE / (0.99 * zoom);
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
	 // --- NUEVA LÓGICA: MutationObserver ---
    const appRoot = document.getElementById('svelte') ?? document.body;
	
	if (appRoot) {
        observer = new MutationObserver((mutations) => {
            // Usamos 'debounce' para esperar a que terminen los cambios
            // antes de volver a clonar. Esto evita parpadeos y lentitud.
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                // Solo recreamos si la lupa está activa
                if ($configuraciones.lupaActivada) {
                    recreateClone();
                }
            }, 100); // 100ms de espera es suficiente
        });

        // Configuración: vigilar cambios en hijos (childList), 
        // en profundidad (subtree) y cambios de atributos (como clases que ocultan cosas)
        observer.observe(appRoot, {
            childList: true, // Detecta si se agregó el botón
            subtree: true,   // Detecta cambios profundos
            attributes: true // Detecta cambios de clase (visible/oculto)
        });
    }
});

onDestroy(() => {
	document.removeEventListener('mousemove', handleMouseMove);
	window.removeEventListener('scroll', updateTransform, true);
	// --- NUEVA LÓGICA: Limpieza ---
    if (observer) {
        observer.disconnect();
    }
    clearTimeout(debounceTimer);

    if (portalContainer && clonedNode) {
        portalContainer.removeChild(clonedNode);
    }
});

$effect(() => {
	// Recrear el clon cada vez que se activa la lupa o cambia el menú
	if ($configuraciones.lupaActivada && portalContainer) {
		recreateClone();
	}
});

$effect(() => {
	updateTransform();
});
</script>

{#if $configuraciones.lupaActivada}
<div
	bind:this={lensElement}
	class="magic-magnifier"
	style="
		left: {lensX}px;
		top: {lensY}px;
		width: {LENS_SIZE}px;
		height: {LENS_SIZE}px;
		/* CAMBIO AQUÍ: Si está sobre una zona, opacidad 1, si no, opacidad 0 */
		opacity: {isOverZone ? 1 : 0};
		/* Si no es visible, lo hacemos más pequeño para una transición suave */
		transform: {isOverZone ? 'scale(1)' : 'scale(0.8)'};
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
	transition: opacity 0.2s ease, transform 0.2s ease;
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
