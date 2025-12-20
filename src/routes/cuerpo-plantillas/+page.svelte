<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { escenasStore, escenasFiltradas, cargando, error } from '$lib/stores/escenas';
	import type { EscenaCatalogo } from '$lib/db/schemas';
	import IconoVolver from '$lib/components/iconos/IconoVolver.svelte';

	let escenasIniciales: Omit<EscenaCatalogo, 'id'>[] = [];
	let busqueda = '';

	onMount(async () => {
		// Cargar escenas iniciales desde JSON estático
		try {
			const response = await fetch('/escenas/escenas.json');
			escenasIniciales = await response.json();
			
			// Inicializar catálogo (siembra solo si está vacío)
			await escenasStore.inicializarCatalogo(escenasIniciales);
		} catch (err) {
			console.error('Error al cargar escenas iniciales:', err);
		}

		// Cargar escenas del modo 'cuerpoHumano'
		await escenasStore.cargarPorModo('cuerpoHumano');
	});

	function seleccionarEscena(escena: EscenaCatalogo) {
		// TODO: Navegar al canvas con la escena seleccionada
		// Por ahora solo navegamos a una ruta placeholder
		console.log('Escena seleccionada:', escena);
		goto(`/canvas?escenaId=${escena.escenaId}&modo=${escena.modo}`);
	}

	function volver() {
		goto('/menu-juegos');
	}

	function filtrarPorBusqueda() {
		escenasStore.buscarPorTexto(busqueda);
	}

	$: if (busqueda !== undefined) {
		filtrarPorBusqueda();
	}
</script>

<main class="cuerpo-humano">
	<header class="header">
		<button class="btn-volver" on:click={volver} aria-label="Volver al menú de juegos">
			<IconoVolver />
		</button>
		<h1>Aprende el Cuerpo Humano</h1>
	</header>

	<div class="buscador">
		<label for="busqueda" class="sr-only">Buscar escenas del cuerpo humano</label>
		<input
			id="busqueda"
			type="text"
			bind:value={busqueda}
			placeholder="Buscar sistema o parte del cuerpo..."
			class="input-busqueda"
		/>
	</div>

	{#if $cargando}
		<div class="estado-carga">
			<p>Cargando escenas del cuerpo humano...</p>
		</div>
	{:else if $error}
		<div class="estado-error">
			<p>Error: {$error}</p>
		</div>
	{:else if $escenasFiltradas.length === 0}
		<div class="estado-vacio">
			<p>No hay escenas disponibles para el modo Cuerpo Humano.</p>
		</div>
	{:else}
		<div class="grid-escenas">
			{#each $escenasFiltradas as escena (escena.id)}
				<article class="tarjeta-escena">
					<button
						class="contenedor-escena"
						on:click={() => seleccionarEscena(escena)}
						aria-label={`Seleccionar escena ${escena.nombre}`}
					>
						<div class="preview">
							<!-- TODO: Cargar preview/thumbnail real -->
							<div class="placeholder-preview">
								<span>🧬</span>
							</div>
						</div>
						<h2 class="nombre-escena">{escena.nombre}</h2>
					</button>
				</article>
			{/each}
		</div>
	{/if}
</main>

<style>
	.cuerpo-humano {
		min-height: 100vh;
		padding: 2rem;
		background: var(--color-fondo, #f5f5f5);
	}

	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.btn-volver {
		padding: 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.btn-volver:hover {
		transform: scale(1.1);
	}

	h1 {
		font-size: 2.5rem;
		color: var(--color-texto, #333);
		margin: 0;
	}

	.buscador {
		margin-bottom: 2rem;
	}

	.input-busqueda {
		width: 100%;
		max-width: 500px;
		padding: 0.75rem 1rem;
		font-size: 1.125rem;
		border: 2px solid var(--color-borde, #ccc);
		border-radius: 8px;
		transition: border-color 0.2s;
	}

	.input-busqueda:focus {
		outline: none;
		border-color: var(--color-primario, #007bff);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	.estado-carga,
	.estado-error,
	.estado-vacio {
		text-align: center;
		padding: 3rem;
		font-size: 1.25rem;
	}

	.estado-error {
		color: var(--color-error, #d32f2f);
	}

	.grid-escenas {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 2rem;
		padding: 1rem 0;
	}

	.tarjeta-escena {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.tarjeta-escena:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.contenedor-escena {
		width: 100%;
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0;
		text-align: left;
	}

	.preview {
		width: 100%;
		aspect-ratio: 4 / 3;
		background: var(--color-fondo-preview, #e0e0e0);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-preview {
		font-size: 4rem;
	}

	.nombre-escena {
		padding: 1rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-texto, #333);
		margin: 0;
	}

	@media (max-width: 768px) {
		.cuerpo-humano {
			padding: 1rem;
		}

		h1 {
			font-size: 1.75rem;
		}

		.grid-escenas {
			grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
			gap: 1rem;
		}
	}
</style>
