<script lang="ts">
	import type { Snippet } from 'svelte';
	import { configuraciones } from '$lib/stores/settings';

	/**
	 * Props del Modal
	 */
	interface Props {
		/** Si el modal está abierto o cerrado */
		abierto?: boolean;
		/** Callback al cerrar el modal */
		alCerrar?: () => void;
		/** Título del modal (opcional, puede usar slot) */
		titulo?: string;
		/** Ancho máximo del modal */
		anchoMaximo?: string;
		/** Si muestra el botón X para cerrar */
		mostrarBotonCerrar?: boolean;
		/** Si se puede cerrar clickeando fuera del modal */
		cerrarAlClickearFuera?: boolean;
		/** Clase CSS adicional para el contenedor del modal */
		clase?: string;
		/** Snippet para las acciones (botones) del modal */
		acciones?: Snippet;
		/** Contenido principal del modal */
		children?: Snippet;
	}

	let {
		abierto = $bindable(false),
		alCerrar = () => {},
		titulo = '',
		anchoMaximo = '600px',
		mostrarBotonCerrar = true,
		cerrarAlClickearFuera = true,
		clase = '',
		acciones,
		children
	}: Props = $props();

	let contenedorModalRef = $state<HTMLDivElement | null>(null);

	/**
	 * Cierra el modal
	 */
	function cerrarModal(): void {
		abierto = false;
		alCerrar();
	}

	/**
	 * Maneja el click en el backdrop
	 */
	function manejarClickBackdrop(event: MouseEvent): void {
		if (cerrarAlClickearFuera && event.target === event.currentTarget) {
			cerrarModal();
		}
	}

	/**
	 * Maneja la tecla ESC
	 */
	function manejarTecla(event: KeyboardEvent): void {
		if (event.key === 'Escape' && abierto) {
			event.preventDefault();
			cerrarModal();
		}
	}

	/**
	 * Evita propagación de clicks dentro del modal
	 */
	function manejarClickModal(event: MouseEvent): void {
		event.stopPropagation();
	}

	/**
	 * Maneja teclas en el modal (permite ESC pero detiene otras)
	 */
	function manejarTeclaModal(event: KeyboardEvent): void {
		// No detener ESC para que pueda cerrar el modal
		if (event.key !== 'Escape') {
			event.stopPropagation();
		}
	}

	// Efecto para manejar el estado del modal
	$effect(() => {
		let blockedElements: Array<{element: HTMLElement, originalTabIndex: string | null}> = [];
		
		if (abierto) {
			// Prevenir scroll del body cuando el modal está abierto
			document.body.style.overflow = 'hidden';
			
			// Bloquear todos los elementos tabulables excepto el modal y controles permitidos
			const allowedIds = ['narration-controls-container', 'floating-back-button', 'floating-settings-button', 'floating-instructions-button'];
			const tabbableElements = document.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
			);
			
			tabbableElements.forEach((element) => {
				// No bloquear si el elemento está dentro del modal
				if (contenedorModalRef?.contains(element)) {
					return;
				}
				
				// No bloquear si el elemento está en un contenedor permitido
				const isInAllowedContainer = allowedIds.some(id => {
					const container = document.getElementById(id);
					return container?.contains(element);
				});
				
				if (!isInAllowedContainer) {
					const originalTabIndex = element.getAttribute('tabindex');
					blockedElements.push({ element, originalTabIndex });
					element.setAttribute('tabindex', '-1');
					element.setAttribute('data-modal-blocked', 'true');
				}
			});
			
			// Marcar contenido de fondo para lectores de pantalla
			const mainContent = document.querySelector('main');
			if (mainContent) {
				mainContent.setAttribute('aria-hidden', 'true');
			}
			
			// Disparar evento personalizado para que el layout procese el modal
			setTimeout(() => {
				const event = new CustomEvent('modal-mounted');
				window.dispatchEvent(event);
				
				// Enfocar el primer elemento interactivo
				setTimeout(() => {
					const primerElemento = contenedorModalRef?.querySelector(
						'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
					) as HTMLElement;
					primerElemento?.focus();
				}, 100);
				
				// Si la narración está activada, iniciar lectura automática del modal
				if ($configuraciones.narrationEnabled) {
					setTimeout(() => {
						const readModalEvent = new CustomEvent('read-modal');
						window.dispatchEvent(readModalEvent);
					}, 200);
				}
			}, 50);
		} else {
			// Restaurar scroll del body
			document.body.style.overflow = '';
			
			// Restaurar tabindex de elementos bloqueados
			blockedElements.forEach(({ element, originalTabIndex }) => {
				if (originalTabIndex !== null) {
					element.setAttribute('tabindex', originalTabIndex);
				} else {
					element.removeAttribute('tabindex');
				}
				element.removeAttribute('data-modal-blocked');
			});
			blockedElements = [];
			
			// Restaurar aria-hidden
			const mainContent = document.querySelector('main');
			if (mainContent) {
				mainContent.removeAttribute('aria-hidden');
			}
		}

		// Cleanup
		return () => {
			document.body.style.overflow = '';
			
			// Restaurar tabindex de elementos bloqueados
			blockedElements.forEach(({ element, originalTabIndex }) => {
				if (originalTabIndex !== null) {
					element.setAttribute('tabindex', originalTabIndex);
				} else {
					element.removeAttribute('tabindex');
				}
				element.removeAttribute('data-modal-blocked');
			});
			
			const mainContent = document.querySelector('main');
			if (mainContent) {
				mainContent.removeAttribute('aria-hidden');
			}
		};
	});
</script>

<svelte:window onkeydown={manejarTecla} />

{#if abierto}
	<div
		class="modal-backdrop"
		onclick={manejarClickBackdrop}
		role="presentation"
	>
		<div
			bind:this={contenedorModalRef}
			class="modal-contenedor {clase}"
			style="max-width: {anchoMaximo};"
			role="dialog"
			aria-modal="true"
			aria-labelledby={titulo ? 'modal-titulo' : undefined}
			tabindex="-1"
			onclick={manejarClickModal}
			onkeydown={manejarTeclaModal}
		>
			<!-- Encabezado -->
			{#if titulo || mostrarBotonCerrar}
				<header class="modal-encabezado">
					{#if titulo}
						<h2 id="modal-titulo" class="modal-titulo">{titulo}</h2>
					{/if}
					{#if mostrarBotonCerrar}
						<button
							class="modal-boton-cerrar"
							onclick={cerrarModal}
							aria-label="Cerrar modal"
							type="button"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
								width="24"
								height="24"
							>
								<path
									d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
								/>
							</svg>
						</button>
					{/if}
				</header>
			{/if}

			<!-- Contenido del modal -->
			<div class="modal-cuerpo">
				{@render children?.()}
			</div>

			<!-- Pie del modal (botones de acción) -->
			{#if acciones}
				<footer class="modal-pie">
					{@render acciones()}
				</footer>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Backdrop oscuro - similar a RegistrarArtista */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.795);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 50000000;
		padding: calc(var(--spacing-base, 1rem) * 2);
		box-sizing: border-box;
	}

	/* Contenedor del modal - adaptable con accesibilidad y temas */
	.modal-contenedor {
		background: var(--bg, #ffffff);
		color: var(--fg, #111111);
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		width: 95%;
		max-height: 80vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;
		box-sizing: border-box;
	}

	@media (min-width: 768px) {
		.modal-contenedor {
			width: auto;
			min-width: 400px;
		}
	}

	/* Encabezado */
	.modal-encabezado {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: calc(var(--spacing-base, 1rem) * 1.5);
		border-bottom: 2px solid var(--border, #e0e0e0);
		flex-shrink: 0;
		background: var(--bg, #ffffff);
		z-index: 1;
	}

	.modal-titulo {
		font-size: calc(var(--font-size-base, 1rem) * 1.3);
		font-weight: 700;
		margin: 0;
		color: var(--fg, #111111);
		line-height: 1.3;
	}

	.modal-boton-cerrar {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: calc(var(--spacing-base, 1rem) * 0.5);
		border-radius: 4px;
		color: var(--fg, #333333);
		transition: background 120ms ease, transform 120ms ease;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: calc(var(--spacing-base, 1rem) * 1);
		flex-shrink: 0;
	}

	.modal-boton-cerrar:hover {
		background: var(--surface-hover, rgba(0, 0, 0, 0.1));
		transform: scale(1.1);
	}

	.modal-boton-cerrar:focus {
		outline: 2px solid var(--fg, #000000);
		outline-offset: 2px;
	}

	/* Cuerpo del modal - permite scroll */
	.modal-cuerpo {
		padding: calc(var(--spacing-base, 1rem) * 1.5);
		flex: 1 1 auto;
		overflow-y: auto;
		overflow-x: hidden;
		font-size: calc(var(--font-size-base, 1rem) * 1);
		line-height: 1.5;
		color: var(--fg, #111111);
		min-height: 0;
	}

	/* Pie del modal */
	.modal-pie {
		display: flex;
		gap: calc(var(--spacing-base, 1rem) * 1);
		justify-content: flex-end;
		padding: calc(var(--spacing-base, 1rem) * 1.5);
		border-top: 2px solid var(--border, #e0e0e0);
		flex-shrink: 0;
		flex-wrap: wrap;
		background: var(--bg, #ffffff);
		z-index: 1;
	}

	/* Respetar preferencias de movimiento reducido */
	@media (prefers-reduced-motion: reduce) {
		.modal-backdrop,
		.modal-contenedor {
			animation: none !important;
			transition: none !important;
		}
	}
</style>
