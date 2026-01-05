<!--
  Componente de notificación/mensaje de feedback
  Muestra mensajes de éxito o error con animación
-->

<script lang="ts">
	interface Props {
		visible: boolean;
		mensaje: string;
		tipo: 'success' | 'error';
	}

	let { visible, mensaje, tipo }: Props = $props();
</script>

{#if visible}
	<div class="mensaje-feedback" class:success={tipo === 'success'} class:error={tipo === 'error'} class:pattern-green={tipo === 'success'} class:pattern-red={tipo === 'error'}>
		<div class="contenido-mensaje">
			<span class="icono-mensaje" aria-hidden="true">
				{#if tipo === 'success'}
					✓
				{:else}
					✗
				{/if}
			</span>
			<span class="texto-mensaje">{mensaje}</span>
		</div>
	</div>
{/if}

<style>
	.mensaje-feedback {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1000;
		padding: 2rem 3rem;
		border-radius: 16px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		animation: aparecer 0.3s ease-out;
		pointer-events: none;
	}

	.mensaje-feedback.success {
		background: linear-gradient(135deg, #4caf50, #8bc34a);
		border: 4px solid #2e7d32;
	}

	.mensaje-feedback.error {
		background: linear-gradient(135deg, #f44336, #ff5722);
		border: 4px solid #c62828;
	}

	.contenido-mensaje {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.icono-mensaje {
		font-size: 3rem;
		font-weight: bold;
		color: white;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.texto-mensaje {
		font-size: 2rem;
		font-weight: bold;
		color: white;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	@keyframes aparecer {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.8);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}
</style>
