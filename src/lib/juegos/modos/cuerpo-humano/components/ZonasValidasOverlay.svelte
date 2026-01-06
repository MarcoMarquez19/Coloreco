<!--
  Overlay que muestra las zonas válidas cuando se arrastra una parte
  Incluye capa de bloqueo del canvas y resaltado de zonas
-->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ZonaValida } from '../types/cuerpo-humano.types';

	interface Props {
		visible: boolean;
		zonas: ZonaValida[];
		zonaHover: string | null;
	}

	let { visible, zonas, zonaHover }: Props = $props();

	const dispatch = createEventDispatcher();

	/**
	 * Maneja el drop de una parte en una zona
	 */
	function manejarDrop(zona: ZonaValida, evento: DragEvent) {
		evento.preventDefault();
		evento.stopPropagation();
		
		const data = evento.dataTransfer?.getData('application/json');
		if (data) {
			try {
				const parte = JSON.parse(data);
				dispatch('colocarParte', { parte, zona });
			} catch (error) {
				console.error('[ZonasValidasOverlay] Error al parsear datos del drag:', error);
			}
		}
	}

	/**
	 * Maneja el dragover para permitir el drop
	 */
	function manejarDragOver(zona: ZonaValida, evento: DragEvent) {
		evento.preventDefault();
		evento.stopPropagation();
		dispatch('hoverZona', { zonaId: zona.id });
	}

	/**
	 * Maneja cuando el cursor sale de una zona
	 */
	function manejarDragLeave(evento: DragEvent) {
		// Solo disparar si realmente sale del elemento
		const target = evento.currentTarget as HTMLElement;
		const relatedTarget = evento.relatedTarget as HTMLElement;
		
		if (!target.contains(relatedTarget)) {
			dispatch('hoverZona', { zonaId: null });
		}
	}
</script>

{#if visible}
	<div class="overlay-zonas" aria-hidden="true">
		<!-- Capa de bloqueo del canvas -->
		<div class="capa-bloqueo"></div>

		<!-- Zonas válidas resaltadas -->
		{#each zonas as zona (zona.id)}
			<div
				class="zona-valida pattern-blue"
				class:hover={zonaHover === zona.id}
				style:left="{zona.x}%"
				style:top="{zona.y}%"
				style:width="{zona.width}%"
				style:height="{zona.height}%"
				ondrop={(e) => manejarDrop(zona, e)}
				ondragover={(e) => manejarDragOver(zona, e)}
				ondragleave={manejarDragLeave}
				role="region"
				aria-label="Zona de colocación"
			>
				<!-- Sin indicador visible para no dar pistas -->
			</div>
		{/each}

		<!-- Texto instructivo -->
		<div class="texto-instruccion pattern-black">
			<p>Suelta la parte en la zona correcta</p>
		</div>
	</div>
{/if}

<style>
	.overlay-zonas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: auto;
		z-index: 50;
	}

	.capa-bloqueo {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.15);
	}

	.zona-valida {
		position: absolute;
		border: 3px dashed var(--color-zona-valida, #4a90e2);
		border-radius: 8px;
		background: rgba(74, 144, 226, 0.15);
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: pulso 2s ease-in-out infinite;
		box-shadow: 0 0 20px rgba(74, 144, 226, 0.3);
	}

	.zona-valida.hover {
		background: rgba(74, 144, 226, 0.4);
		border-color: var(--color-zona-hover, #2c5aa0);
		border-style: solid;
		border-width: 4px;
		transform: scale(1.05);
		animation: none;
		box-shadow: 0 0 30px rgba(74, 144, 226, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.3);
	}

	@keyframes pulso {
		0%, 100% {
			opacity: 0.8;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.03);
		}
	}

	/* Texto instructivo flotante */
	.texto-instruccion {
		position: absolute;
		top: 2rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-fondo-instruccion, rgba(0, 0, 0, 0.8));
		color: var(--color-texto-instruccion, #fff);
		padding: 1rem 2rem;
		border-radius: 12px;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
		pointer-events: none;
		animation: aparecer 0.3s ease;
		z-index: 60;
	}

	.texto-instruccion p {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		text-align: center;
	}

	@keyframes aparecer {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	/* Efectos de resplandor para zonas activas */
	@keyframes resplandor {
		0%, 100% {
			box-shadow: 0 0 20px rgba(74, 144, 226, 0.3);
		}
		50% {
			box-shadow: 0 0 40px rgba(74, 144, 226, 0.6);
		}
	}
</style>
