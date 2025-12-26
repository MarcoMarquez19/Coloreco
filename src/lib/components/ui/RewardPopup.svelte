<script lang="ts">
	import { onMount } from 'svelte';
	import { audioService } from '$lib/audio/audio.service';

	export let show: boolean = false;
	export let title: string = '¡Logro desbloqueado!';
	export let description: string = '';
	export let icon: string = '🏆';
	export let duration: number = 3000;
	export let onClose: (() => void) | undefined = undefined;

	let visible: boolean = false;
	let animating: boolean = false;

	$: if (show && !visible) {
		displayReward();
	}

	async function displayReward() {
		visible = true;
		animating = true;

		// Reproducir sonido de logro
		await audioService.playSound('achievement');

		// Auto-cerrar después de la duración
		setTimeout(() => {
			closeReward();
		}, duration);
	}

	function closeReward() {
		animating = false;
		
		setTimeout(() => {
			visible = false;
			if (onClose) {
				onClose();
			}
		}, 300); // Esperar animación de salida
	}
</script>

{#if visible}
	<div class="reward-overlay" class:animating on:click={closeReward}>
		<div class="reward-popup" class:animating>
			<div class="reward-icon">
				{icon}
			</div>
			<h3 class="reward-title">{title}</h3>
			{#if description}
				<p class="reward-description">{description}</p>
			{/if}
			<div class="reward-stars">
				<span class="star">⭐</span>
				<span class="star">⭐</span>
				<span class="star">⭐</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.reward-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.reward-overlay.animating {
		opacity: 1;
	}

	.reward-popup {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20px;
		padding: 2rem;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-width: 400px;
		color: white;
		transform: scale(0) rotate(-180deg);
		transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	.reward-popup.animating {
		transform: scale(1) rotate(0deg);
	}

	.reward-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		animation: bounce 1s infinite;
	}

	.reward-title {
		font-size: 1.8rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.reward-description {
		font-size: 1.1rem;
		margin: 0 0 1rem 0;
		opacity: 0.9;
	}

	.reward-stars {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}

	.star {
		font-size: 1.5rem;
		animation: twinkle 1s infinite;
	}

	.star:nth-child(1) {
		animation-delay: 0s;
	}

	.star:nth-child(2) {
		animation-delay: 0.2s;
	}

	.star:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-20px);
		}
	}

	@keyframes twinkle {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.5;
			transform: scale(0.8);
		}
	}
</style>
