<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let updateAvailable = $state(false);
	let newWorker: ServiceWorker | null = null;

	onMount(() => {
		if (!browser || !('serviceWorker' in navigator)) return;

		navigator.serviceWorker.ready.then((registration) => {
			registration.addEventListener('updatefound', () => {
				newWorker = registration.installing;

				if (newWorker) {
					newWorker.addEventListener('statechange', () => {
						if (newWorker?.state === 'installed' && navigator.serviceWorker.controller) {
							updateAvailable = true;
						}
					});
				}
			});
		});
	});

	function actualizarApp() {
		if (newWorker) {
			newWorker.postMessage({ type: 'SKIP_WAITING' });
			window.location.reload();
		}
	}

	function cerrarNotificacion() {
		updateAvailable = false;
	}
</script>

{#if updateAvailable}
	<div class="update-notification" role="alert" aria-live="polite">
		<div class="update-content">
			<div class="update-icon">🔄</div>
			<div class="update-text">
				<strong>¡Nueva versión disponible!</strong>
				<p>Hay una actualización de la aplicación lista para instalar.</p>
			</div>
			<div class="update-actions">
				<button class="btn-actualizar" onclick={actualizarApp}>
					Actualizar ahora
				</button>
				<button class="btn-cerrar" onclick={cerrarNotificacion} aria-label="Cerrar notificación">
					×
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.update-notification {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 10000;
		max-width: 400px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateY(100px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.update-content {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		color: white;
	}

	.update-icon {
		font-size: 32px;
		animation: spin 2s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.update-text {
		flex: 1;
	}

	.update-text strong {
		display: block;
		font-size: 16px;
		margin-bottom: 4px;
	}

	.update-text p {
		margin: 0;
		font-size: 14px;
		opacity: 0.9;
	}

	.update-actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.btn-actualizar,
	.btn-cerrar {
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	.btn-actualizar {
		background: white;
		color: #667eea;
		padding: 8px 16px;
		font-size: 14px;
	}

	.btn-actualizar:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.btn-cerrar {
		background: transparent;
		color: white;
		padding: 4px 8px;
		font-size: 20px;
		opacity: 0.7;
	}

	.btn-cerrar:hover {
		opacity: 1;
	}

	@media (max-width: 600px) {
		.update-notification {
			bottom: 10px;
			right: 10px;
			left: 10px;
			max-width: none;
		}

		.update-content {
			flex-wrap: wrap;
		}

		.update-actions {
			width: 100%;
			flex-direction: row;
		}

		.btn-actualizar {
			flex: 1;
		}
	}
</style>
