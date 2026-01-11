<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { buscarPorEscenaId } from '$lib/db/escenas.service';
	import { obtenerLogrosPorEscenaId } from '$lib/db/logros.service';
	import { obtenerSesionActual } from '$lib/db/artistas.service';
	import type { EscenaCatalogo } from '$lib/db/schemas';
	import type { LogroConEstado } from '$lib/stores/logros';
	import { audioStore, clickSound } from '$lib/stores/audio';

	let escena: EscenaCatalogo | null = $state<EscenaCatalogo | null>(null);
	let logros: LogroConEstado[] = $state<LogroConEstado[]>([]);
	let error: string | null = $state<string | null>(null);
	let cargando = $state<boolean>(true);

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

			// Cargar logros asociados a la escena con estado de desbloqueo
			if (escenaId) {
				try {
					// Obtener artistaId de la sesión
					const sesion = await obtenerSesionActual();
					const artistaId = sesion?.artistaActualId;

					if (artistaId) {
						// Obtener todas las definiciones de logros de la escena
						const definiciones = await obtenerLogrosPorEscenaId(escenaId);
						
						// Importar el servicio de logros para obtener el estado
						const { obtenerLogrosArtista } = await import('$lib/db/logros.service');
						const logrosConEstado = await obtenerLogrosArtista(artistaId);
						
						// Combinar definiciones con su estado
						logros = definiciones.map(definicion => {
							const logroConEstado = logrosConEstado.find(l => l.definicion.id === definicion.id);
							const estado = logroConEstado?.estado;
							return {
								definicion,
								estado: estado ?? null,
								desbloqueado: estado?.desbloqueado ?? false,
								progreso: estado?.progresoParcial ?? 0
							};
						});
						
						console.log(`[descripcion-escena] ${logros.length} logros cargados para escena ${escenaId}`);
					} else {
						// Si no hay artista, solo mostrar las definiciones sin estado
						const definiciones = await obtenerLogrosPorEscenaId(escenaId);
						logros = definiciones.map(definicion => ({
							definicion,
							estado: null,
							desbloqueado: false,
							progreso: 0
						}));
					}
				} catch (e) {
					console.error('[descripcion-escena] Error cargando logros:', e);
					logros = [];
				}
			}
		} catch (e) {
			console.error('[descripcion-escena] Error al cargar escena:', e);
			error = 'Ocurrió un error al cargar la escena.';
		} finally {
			cargando = false;
		}
	}

    function empezarDibujo(escenaId: string) {
        // Navegar al canvas con la escena seleccionada
        goto(`/juegos/dibujo/${escenaId}`);
    }

	onMount(() => {
        const handlePopState = (event: PopStateEvent) => {
			event.preventDefault();
			goto('/taller-escenas');
		};
		window.addEventListener('popstate', handlePopState);
		
		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
    });

	onMount(() => {
		void cargarEscena();
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
    data-magnificable
>
	<h1 id="titulo-escena">Descripción de la escena</h1>

	{#if cargando}
		<section class="estado" role="status" aria-busy="true">
			<p>Cargando escena...</p>
		</section>
	{:else if error}
		<section class="estado estado-error" role="alert">
			<p>{error}</p>
		</section>
	{:else if escena}
	    <button class="boton-crear pattern-yellow"
			aria-label="Selecciona la escena a utilizar en el taller de dibujo" 
			title="Ver Descripción de la escena seleccionada"
			onclick={() => empezarDibujo(escena!.escenaId)}
			use:clickSound
		>
			¡Vamos a crear!
		</button>
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
<section class="panel panel-descripcion pattern-black" aria-label="Descripción de la escena" tabindex="-1">
					<p class="texto-descripcion">
                        {#if escena.descripcion}
                            {escena.descripcion}
						{:else}
                            No hay descripción disponible para esta escena.
                        {/if}
                    </p>
				</section>

                <h2 tabindex="-1">Retos de la escena</h2>

			<section class="panel panel-retos pattern-black" aria-label="Retos y logros" tabindex="-1">
					{#if logros.length > 0}
						<div class="logros-lista">
							{#each logros as logro (logro.definicion.id)}
								<div class="logro-item" role="listitem">
									<div 
										class="logro-circulo" 
										class:desbloqueado={logro.desbloqueado}
										aria-label={logro.desbloqueado ? 'Logro desbloqueado' : 'Logro bloqueado'}
									></div>
									<h3 class="logro-nombre">{logro.definicion.nombre}</h3>
									<p class="logro-descripcion">{logro.definicion.descripcion}</p>
								</div>
							{/each}
						</div>
					{:else}
						<p class="sin-logros">No hay retos especiales disponibles para esta escena.</p>
					{/if}
				</section>
			</div>
		</section>
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
		align-items: start;
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
	}

	.panel {
		background: var(--bg,"white");
		border-radius: 8px;
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border: 3px solid var(--icono-color-borde, #000000);
	}

	.panel-descripcion {
		flex: none;
	}

	.panel-retos {
		flex: none;
	}

	.texto-descripcion {
		margin: 0;
		line-height: 1.6;
		color: var(--color-texto, #333);
        font-size: calc(var(--font-size-base, 1rem) * 1.2);
	}

	/* Estilos para la lista de logros */
	.logros-lista {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-base, 1rem) * 1.5);
	}

	.logro-item {
		display: flex;
		align-items: baseline;
		gap: calc(var(--spacing-base, 1rem) * 0.75);
		line-height: 1.5;
	}

	.logro-circulo {
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		border: 2px solid var(--icono-color-borde, #000000);
		background: var(--bg, white);
		transition: background-color 200ms ease, border-color 200ms ease;
	}

	.logro-circulo.desbloqueado {
		background: #4caf50;
		border-color: #2e7d32;
	}

	.logro-nombre {
		margin: 0;
		font-weight: 700;
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
		color: var(--color-texto, #333);
		display: inline;
	}

	.logro-descripcion {
		margin: 0;
		display: inline;
		font-size: calc(var(--font-size-base, 1rem) * 0.95);
		color: var(--color-texto, #666);
	}

	.sin-logros {
		margin: 0;
		padding: calc(var(--spacing-base, 1rem) * 0.5) 0;
		font-size: calc(var(--font-size-base, 1rem) * 1);
		color: var(--color-texto, #999);
		font-style: italic;
	}

	.boton-crear {      
        padding: calc(var(--spacing-base, 1rem) * 1.5) 1rem;
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
