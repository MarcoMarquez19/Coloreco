<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { buscarPorEscenaId } from '$lib/db/escenas.service';
	import type { EscenaCatalogo } from '$lib/db/schemas';

	let escena: EscenaCatalogo | null = $state<EscenaCatalogo | null>(null);
	let error: string | null = $state<string | null>(null);
	let cargando = $state<boolean>(true); // Estado de carga inicial ;

	async function cargarEscena() {
		try {
			const { params } = get(page);
			const escenaId = params?.escenaId;

			if (!escenaId) {
				error = 'Falta el identificador de la escena.';
				return;
			}

			const resultados = await buscarPorEscenaId(escenaId);
			if (!resultados || resultados.length === 0) {
				error = 'La escena no existe o no está disponible.';
				return;
			}

			escena = resultados[0];
			error = null;
		} catch (e) {
			console.error('[descripcion-escena] Error al cargar escena:', e);
			error = 'Ocurrió un error al cargar la escena.';
		} finally {
			cargando = false;
		}
	}

    function empezarDibujo(escenaId: string) {
        // TODO: Navegar al canvas con la escena seleccionada
    }


	onMount(() => {
		void cargarEscena();
        document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = ''; // Restaurar al desmontar
		};
	});

	let contenedorSeleccionarEscenaRef: HTMLElement | null = null;

	/** Calcula y aplica la escala según la altura de la ventana (máx 1080px) */
	function actualizarEscala(): void {
		if (!contenedorSeleccionarEscenaRef) return;
		const maxHeight = 1080;
		const rawScale = window.innerHeight / maxHeight;
		// limitar entre 0.6 y 1 para evitar escalados excesivos
		const scale = Math.max(0.6, Math.min(1, rawScale));
		contenedorSeleccionarEscenaRef.style.transform = `scale(${scale})`;
		contenedorSeleccionarEscenaRef.style.transformOrigin = 'top center';
	}

	$effect(() => {
		actualizarEscala();
		window.addEventListener('resize', actualizarEscala);
		return () => {
			window.removeEventListener('resize', actualizarEscala);
			// restaurar transform si existe
			if (contenedorSeleccionarEscenaRef) {
				contenedorSeleccionarEscenaRef.style.transform = '';
				contenedorSeleccionarEscenaRef.style.transformOrigin = '';
				contenedorSeleccionarEscenaRef.style.margin = '';
			}
		};
	})
</script>

<div
	class="descripcion-escena"
	bind:this={contenedorSeleccionarEscenaRef}
	aria-labelledby="titulo-escena"
	aria-live="polite"
>
	<h1 id="titulo-escena">Descripción de la escena</h1>

	{#if cargando}
		<section class="estado" role="status" aria-busy="true">
			<p>Cargando escena...</p>
		</section>
	{:else if error}
		<section class="estado estado-error" role="alert">
			<p>{error}</p>
			<button
				type="button"
				class="boton-secundario"
				onclick={() => goto('/taller-escenas')}
				aria-label="Volver al listado de escenas"
			>
				Volver al listado
			</button>
		</section>
	{:else if escena}
		<section class="layout" aria-label="Detalle de la escena cargada">
			<div class="col-izquierda">
				<div class="marco-preview" aria-label="Previsualización de la escena">
					<img
						src={escena.ruta}
						alt={`Vista previa de la escena: ${escena.nombre}`}
						loading="lazy"
						tabindex="-1"
						onerror={(ev) => {
							const target = ev.currentTarget as HTMLImageElement;
							target.alt = 'No se pudo cargar la imagen de la escena.';
						}}
					/>
				</div>
				<h2 class="nombre-escena">{escena.nombre}</h2>
			</div>

			<div class="col-derecha" aria-label="Paneles de información de la escena">
				<section class="panel panel-descripcion" aria-label="Descripción de la escena" tabindex="-1">
					<p class="texto-descripcion">
                        {#if escena.descripcion}
                            {escena.descripcion}
                            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Vero, doloremque sequi aperiam voluptatum deserunt fugit porro omnis voluptatem, ab similique dolorem culpa. Suscipit reprehenderit vero rerum consequuntur, repudiandae velit hic.
                        {:else}
                            No hay descripción disponible para esta escena.
                        {/if}
                    </p>
				</section>

                <h2 tabindex="-1">Retos de la escena</h2>

				<section class="panel panel-retos" aria-label="Retos y logros" tabindex="-1">
					<p class="placeholder-retos">TODO: cargar logros asociados a la escena (obtenerLogrosEscenaID()).
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Eligendi ad quo nisi suscipit quos? Facere, rerum recusandae molestias eius perspiciatis inventore eligendi ratione rem. Cumque vitae amet perspiciatis deserunt et?
                    </p>
				</section>
			</div>
		</section>

        <button class="boton-crear"
		aria-label="Selecciona la escena a utilizar en el taller de dibujo" 
		title="Ver Descripción de la escena seleccionada"
		onclick={() => empezarDibujo(escena!.escenaId)}
	>
		¡Vamos a crear!
	</button>
	{/if}
</div>

<style>

	.descripcion-escena {
		max-width: 1280px;
		margin: 0 auto;
		color: var(--color-texto, #222);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-base,1.5rem)*2);
        justify-content: center;
		align-items: center;
        min-height: 90vh;
        padding-bottom: 2.5rem;
	}

	h1 {
		font-size: calc(var(--font-size-base, 1rem) * 2.5);
		margin: 0;
		text-align: center;
		font-weight: 600;
		letter-spacing: 0.1em;
		word-spacing: 0.2em;
	}
    h2 {
		font-size: calc(var(--font-size-base, 1rem) * 2);
		margin: 0;
		text-align: center;
		font-weight: 600;
		letter-spacing: 0.1em;
		word-spacing: 0.2em;
	}

	.estado {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
		text-align: center;
	}

	.estado-error {
		color: var(--color-error, #d32f2f);
		display: grid;
		gap: 1rem;
		justify-items: center;
	}

	.layout {
		display: grid;
		grid-template-columns: 1.5fr 2fr;
		gap: calc(var(--spacing-base,1rem) * 3);
		align-items: center;
		height: 100%;
		box-sizing: border-box;
	}

	.col-izquierda {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.marco-preview {
		width: 100%;
		aspect-ratio: 4 / 3;
		background: var(--color-fondo-preview, #e0e0e0);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.marco-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.nombre-escena {
		margin: 0;
		font-size: calc(var(--font-size-base, 1rem) * 2);
		font-weight: 700;
		text-align: center;
		color: var(--color-texto, #333);
		letter-spacing: 0.05em;
	}

	.col-derecha {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
        max-height: 60vh;
	}

	.panel {
		background: var(--bg,"white");
		border-radius: 8px;
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		overflow-y: auto;
		border: 3px solid var(--icono-color-borde, #000000);
	}

	.panel-descripcion {
		flex: 1 1 35%;
	}

	.panel-retos {
		flex: 1 1 65%;
	}

	.texto-descripcion {
		margin: 0;
		line-height: 1.6;
		color: var(--color-texto, #333);
        font-size: calc(var(--font-size-base, 1rem) * 2);
	}

	.placeholder-retos {
		margin: 0;
		line-height: 1.6;
		color: var(--color-texto, #000000);
        font-size: calc(var(--font-size-base, 1rem) * 2);
	}

    .boton-crear {      
        padding: calc(var(--spacing-base,2rem) * 1.5) 1rem;
        margin-top: 2rem;
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		border: none;
		font-size: calc(var(--font-size-base, 1rem) * 1.8);
		font-weight: 600;
        width: 50%;
		letter-spacing: 0.05em;
		border-radius: var(--border-radius, 8px);
		cursor: pointer;
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
        text-align: center;
		transition: transform 120ms ease, box-shadow 120ms ease;
	}

	.boton-crear:hover {
		background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-2px);
	}

	.boton-crear:active {
		transform: translateY(0);
	}

	.boton-crear:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #d1a700);
		outline-offset: 7px;
	}

</style>
