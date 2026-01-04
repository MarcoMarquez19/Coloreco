<script lang="ts">
	import { applyPictogramsWithPopover } from '$lib/juegos/modos/historias/pictograms';
	import { onMount } from 'svelte';

	export let text: string = '';
	export let showIcons: boolean = true;

	let containerEl: HTMLDivElement;
	let processedHTML: string = '';

	$: {
		if (text) {
			processedHTML = showIcons ? applyPictogramsWithPopover(text) : text;
		}
	}

	onMount(() => {
		if (!containerEl) return;

		// Manejar eventos para mostrar/ocultar popovers
		const handleFocus = (e: Event) => {
			const target = e.target as HTMLElement;
			if (target.classList.contains('pictogram-word')) {
				const popover = target.nextElementSibling as HTMLElement;
				if (popover?.classList.contains('pictogram-popover')) {
					popover.classList.add('visible');
					popover.setAttribute('aria-hidden', 'false');
				}
			}
		};

		const handleBlur = (e: Event) => {
			const target = e.target as HTMLElement;
			if (target.classList.contains('pictogram-word')) {
				const popover = target.nextElementSibling as HTMLElement;
				if (popover?.classList.contains('pictogram-popover')) {
					popover.classList.remove('visible');
					popover.setAttribute('aria-hidden', 'true');
				}
			}
		};

		const handleMouseEnter = (e: Event) => {
			const target = e.target as HTMLElement;
			if (target.classList.contains('pictogram-word')) {
				const popover = target.nextElementSibling as HTMLElement;
				if (popover?.classList.contains('pictogram-popover')) {
					popover.classList.add('visible');
				}
			}
		};

		const handleMouseLeave = (e: Event) => {
			const target = e.target as HTMLElement;
			if (target.classList.contains('pictogram-word')) {
				const popover = target.nextElementSibling as HTMLElement;
				if (popover?.classList.contains('pictogram-popover')) {
					popover.classList.remove('visible');
				}
			}
		};

		containerEl.addEventListener('focusin', handleFocus);
		containerEl.addEventListener('focusout', handleBlur);
		containerEl.addEventListener('mouseover', handleMouseEnter);
		containerEl.addEventListener('mouseout', handleMouseLeave);

		return () => {
			containerEl.removeEventListener('focusin', handleFocus);
			containerEl.removeEventListener('focusout', handleBlur);
			containerEl.removeEventListener('mouseover', handleMouseEnter);
			containerEl.removeEventListener('mouseout', handleMouseLeave);
		};
	});
</script>

<div bind:this={containerEl} class="pictogram-text" class:icons-enabled={showIcons}>
	{@html processedHTML}
</div>

<style>
	.pictogram-text {
		font-size: inherit;
		line-height: 1.8;
	}

	/* Wrapper para posicionamiento del popover */
	.pictogram-text :global(.pictogram-wrapper) {
		position: relative;
		display: inline-block;
	}

	/* Palabra con pictograma disponible - subrayado sutil */
	.pictogram-text :global(.pictogram-word) {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: inherit;
		cursor: help;
		border-bottom: 2px dashed #3498db;
		border-radius: 0;
		transition: all 0.2s ease;
		outline-offset: 2px;
	}

	.pictogram-text :global(.pictogram-word:hover),
	.pictogram-text :global(.pictogram-word:focus) {
		border-bottom-color: #2980b9;
		background: rgba(52, 152, 219, 0.1);
		outline: 2px solid #3498db;
	}

	/* Popover emergente - oculto por defecto */
	.pictogram-text :global(.pictogram-popover) {
		position: absolute;
		bottom: 120%;
		left: 50%;
		transform: translateX(-50%) scale(0.8);
		opacity: 0;
		pointer-events: none;
		transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
		
		background: white;
		border: 3px solid #3498db;
		border-radius: 12px;
		padding: 12px;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
		z-index: 1000;
		
		width: 80px;
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Flecha del popover */
	.pictogram-text :global(.pictogram-popover::after) {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 8px solid transparent;
		border-top-color: #3498db;
	}

	/* Estado visible */
	.pictogram-text :global(.pictogram-popover.visible) {
		opacity: 1;
		transform: translateX(-50%) scale(1);
		pointer-events: auto;
	}

	/* Icono del pictograma */
	.pictogram-text :global(.pictogram-icon) {
		font-size: 2.5em;
		line-height: 1;
		display: block;
	}

	/* Adaptación para modo noche */
	:global([data-theme="dark"]) .pictogram-text :global(.pictogram-popover) {
		background: #1a1a1a;
		border-color: #90CAF9;
	}

	:global([data-theme="dark"]) .pictogram-text :global(.pictogram-popover::after) {
		border-top-color: #90CAF9;
	}

	:global([data-theme="dark"]) .pictogram-text :global(.pictogram-word) {
		border-bottom-color: #90CAF9;
	}

	:global([data-theme="dark"]) .pictogram-text :global(.pictogram-word:hover),
	:global([data-theme="dark"]) .pictogram-text :global(.pictogram-word:focus) {
		border-bottom-color: #64B5F6;
		background: rgba(144, 202, 249, 0.1);
		outline-color: #90CAF9;
	}

	/* Animación de entrada */
	.pictogram-text.icons-enabled :global(.pictogram-popover.visible) {
		animation: bounce-in 0.3s ease;
	}

	@keyframes bounce-in {
		0% {
			transform: translateX(-50%) scale(0);
			opacity: 0;
		}
		50% {
			transform: translateX(-50%) scale(1.1);
		}
		100% {
			transform: translateX(-50%) scale(1);
			opacity: 1;
		}
	}

	/* Accesibilidad: reducción de movimiento */
	@media (prefers-reduced-motion: reduce) {
		.pictogram-text :global(.pictogram-popover) {
			transition: opacity 0.1s;
		}
		
		.pictogram-text.icons-enabled :global(.pictogram-popover.visible) {
			animation: none;
		}
	}
</style>
