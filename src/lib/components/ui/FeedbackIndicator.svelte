<script lang="ts">
	import { onMount } from 'svelte';
	import { audioService } from '$lib/audio/audio.service';

	export let type: 'success' | 'error' | 'info' = 'success';
	export let show: boolean = false;
	export let message: string = '';
	export let duration: number = 2000;
	export let position: 'top' | 'center' | 'bottom' = 'top';

	let visible: boolean = false;
	let animating: boolean = false;

	$: if (show && !visible) {
		displayFeedback();
	}

	async function displayFeedback() {
		visible = true;
		animating = true;

		// Reproducir sonido según el tipo
		if (type === 'success') {
			await audioService.playSound('correct');
		} else if (type === 'error') {
			await audioService.playSound('incorrect');
		}

		// Auto-ocultar después de la duración
		setTimeout(() => {
			hideFeedback();
		}, duration);
	}

	function hideFeedback() {
		animating = false;
		
		setTimeout(() => {
			visible = false;
		}, 300);
	}

	function getIcon(): string {
		switch (type) {
			case 'success':
				return '✅';
			case 'error':
				return '❌';
			case 'info':
				return 'ℹ️';
			default:
				return '✅';
		}
	}

	function getColor(): string {
		switch (type) {
			case 'success':
				return '#28a745';
			case 'error':
				return '#dc3545';
			case 'info':
				return '#17a2b8';
			default:
				return '#28a745';
		}
	}
</script>

{#if visible}
	<div 
		class="feedback-indicator" 
		class:animating
		class:position-top={position === 'top'}
		class:position-center={position === 'center'}
		class:position-bottom={position === 'bottom'}
		style="--feedback-color: {getColor()}"
	>
		<div class="feedback-content">
			<span class="feedback-icon">{getIcon()}</span>
			{#if message}
				<span class="feedback-message">{message}</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.feedback-indicator {
		position: fixed;
		left: 50%;
		transform: translateX(-50%) translateY(-100px);
		z-index: 10000;
		opacity: 0;
		transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	.feedback-indicator.position-top {
		top: 2rem;
	}

	.feedback-indicator.position-center {
		top: 50%;
		transform: translateX(-50%) translateY(-50%) scale(0.5);
	}

	.feedback-indicator.position-bottom {
		top: auto;
		bottom: 2rem;
		transform: translateX(-50%) translateY(100px);
	}

	.feedback-indicator.animating {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}

	.feedback-indicator.position-center.animating {
		transform: translateX(-50%) translateY(-50%) scale(1);
	}

	.feedback-content {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 1rem 1.5rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		border: 3px solid var(--feedback-color);
		min-width: 200px;
	}

	.feedback-icon {
		font-size: 2rem;
		animation: pulse 0.6s ease-in-out;
	}

	.feedback-message {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--feedback-color);
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.3);
		}
	}

	/* Animación de partículas para éxito */
	.feedback-indicator.animating::before,
	.feedback-indicator.animating::after {
		content: '✨';
		position: absolute;
		font-size: 1.5rem;
		animation: sparkle 1s ease-out;
	}

	.feedback-indicator.animating::before {
		left: -30px;
		top: 50%;
	}

	.feedback-indicator.animating::after {
		right: -30px;
		top: 50%;
	}

	@keyframes sparkle {
		0% {
			opacity: 1;
			transform: translateY(0) scale(0);
		}
		50% {
			opacity: 1;
			transform: translateY(-20px) scale(1);
		}
		100% {
			opacity: 0;
			transform: translateY(-40px) scale(0.5);
		}
	}
</style>
