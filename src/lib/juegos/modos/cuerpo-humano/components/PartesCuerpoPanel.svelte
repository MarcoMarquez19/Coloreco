<!--
  Panel lateral con las partes del cuerpo que se pueden arrastrar
  Maneja el drag & drop y notifica cuando se inicia/finaliza el arrastre
-->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ParteCuerpo } from '../types/cuerpo-humano.types';

	interface Props {
		partes: ParteCuerpo[];
		partesColocadas: Set<string>;
	}

	let { partes, partesColocadas }: Props = $props();

	const dispatch = createEventDispatcher();

	let parteArrastrandose = $state<string | null>(null);
	
	// Calcular progreso de forma reactiva usando Array.from para forzar reactividad
	let cantidadColocadas = $derived(Array.from(partesColocadas).length);
	let porcentajeProgreso = $derived((cantidadColocadas / partes.length) * 100);

	/**
	 * Inicia el arrastre de una parte
	 */
	function iniciarArrastre(parte: ParteCuerpo, evento: DragEvent) {
		if (partesColocadas.has(parte.id)) return;
		
		parteArrastrandose = parte.id;
		
		// Configurar datos del drag
		if (evento.dataTransfer) {
			evento.dataTransfer.effectAllowed = 'move';
			evento.dataTransfer.setData('application/json', JSON.stringify(parte));
		}

		// Notificar que se inició el arrastre
		dispatch('iniciarArrastre', { parte });
	}

	/**
	 * Finaliza el arrastre de una parte
	 */
	function finalizarArrastre() {
		parteArrastrandose = null;
		dispatch('finalizarArrastre');
	}

	/**
	 * Maneja el teclado para accesibilidad
	 */
	function manejarTeclado(parte: ParteCuerpo, evento: KeyboardEvent) {
		if (partesColocadas.has(parte.id)) return;
		
		if (evento.key === 'Enter' || evento.key === ' ') {
			evento.preventDefault();
			// TODO: Implementar selección por teclado
			console.log(`Parte seleccionada: ${parte.nombre}`);
		}
	}
</script>

<aside class="panel-partes" aria-label="Partes del cuerpo">
	<h2 class="titulo-panel">Partes</h2>
	
	<div class="lista-partes" role="list">
		{#each partes as parte (parte.id)}
			<button
				class="parte-item"
				class:arrastrando={parteArrastrandose === parte.id}
				class:colocada={partesColocadas.has(parte.id)}
				draggable={!partesColocadas.has(parte.id)}
				ondragstart={(e) => iniciarArrastre(parte, e)}
				ondragend={finalizarArrastre}
				onkeydown={(e) => manejarTeclado(parte, e)}
				disabled={partesColocadas.has(parte.id)}
				aria-label={`${parte.nombre} - ${partesColocadas.has(parte.id) ? 'Colocada correctamente' : 'Disponible para arrastrar'}`}
			>
				<span class="nombre-parte">{parte.nombre}</span>
				{#if partesColocadas.has(parte.id)}
					<span class="icono-check" aria-hidden="true">✓</span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Información de progreso -->
	<div class="progreso" aria-live="polite">
		<span class="texto-progreso">
			{cantidadColocadas} de {partes.length} partes colocadas
		</span>
		<div class="barra-progreso">
			<div 
				class="progreso-relleno" 
				style:width="{porcentajeProgreso}%"
			></div>
		</div>
	</div>
</aside>

<style>
	.panel-partes {
		position: relative;
		width: 160px;
		flex-shrink: 0;
		background: var(--color-fondo-panel, #fff);
		border: 3px solid var(--color-borde-panel, #000);
		border-radius: 12px;
		padding: 1rem;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
		z-index: 100;
		max-height: 70vh;
		display: flex;
		flex-direction: column;
		align-self: center;
	}

	.titulo-panel {
		margin: 0 0 0.6rem 0;
		font-size: 1.2rem;
		font-weight: bold;
		color: var(--color-titulo, #333);
		text-align: center;
		border-bottom: 2px solid var(--color-borde-titulo, #ddd);
		padding-bottom: 0.3rem;
	}

	.lista-partes {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		overflow-y: auto;
		padding-right: 0.5rem;
		margin-bottom: 0.75rem;
	}

	/* Scrollbar personalizado */
	.lista-partes::-webkit-scrollbar {
		width: 8px;
	}

	.lista-partes::-webkit-scrollbar-track {
		background: var(--color-scrollbar-track, #f1f1f1);
		border-radius: 4px;
	}

	.lista-partes::-webkit-scrollbar-thumb {
		background: var(--color-scrollbar-thumb, #888);
		border-radius: 4px;
	}

	.lista-partes::-webkit-scrollbar-thumb:hover {
		background: var(--color-scrollbar-thumb-hover, #555);
	}

	.parte-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.6rem;
		background: var(--color-fondo-parte, #f8f8f8);
		border: 2px solid var(--color-borde-parte, #ddd);
		border-radius: 6px;
		cursor: grab;
		transition: all 0.2s ease;
		user-select: none;
		width: 100%;
		text-align: left;
		font-family: inherit;
	}

	.parte-item:hover:not(.colocada) {
		background: var(--color-fondo-parte-hover, #e8f4ff);
		border-color: var(--color-borde-parte-hover, #4a90e2);
		transform: translateX(-4px);
		box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
	}

	.parte-item:active:not(.colocada) {
		cursor: grabbing;
	}

	.parte-item:focus {
		outline: 3px solid var(--color-focus, #4a90e2);
		outline-offset: 2px;
	}

	.parte-item.arrastrando {
		opacity: 0.5;
		cursor: grabbing;
		transform: scale(0.95);
	}

	.parte-item.colocada,
	.parte-item:disabled {
		background: var(--color-fondo-parte-colocada, #e8f5e9);
		border-color: var(--color-borde-parte-colocada, #4caf50);
		cursor: not-allowed;
		opacity: 0.7;
	}

	.nombre-parte {
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--color-texto-parte, #333);
		flex: 1;
	}

	.icono-check {
		color: var(--color-icono-check, #4caf50);
		font-size: 1.2rem;
		font-weight: bold;
		margin-left: 0.5rem;
	}

	/* Sección de progreso */
	.progreso {
		border-top: 2px solid var(--color-borde-progreso, #ddd);
		padding-top: 0.75rem;
	}

	.texto-progreso {
		display: block;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-texto-progreso, #666);
		margin-bottom: 0.4rem;
		text-align: center;
	}

	.barra-progreso {
		width: 100%;
		height: 8px;
		background: var(--color-fondo-barra, #e0e0e0);
		border-radius: 4px;
		overflow: hidden;
	}

	.progreso-relleno {
		height: 100%;
		background: linear-gradient(90deg, #4caf50, #8bc34a);
		transition: width 0.4s ease;
		border-radius: 4px;
	}
</style>
