<script lang="ts">
    import RegistrarArtista from '$lib/components/modales/RegistrarArtista.svelte';
    import { clickSound } from '$lib/stores/audio';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import {obtenerArtistas,cambiarArtista} from '$lib/db/artistas.service';

    let mostrarRegistrarArtista = false;

    function crearEstudio() {
        mostrarRegistrarArtista = true;
    }

    // Lista real de artistas cargados desde la base de datos
    let artistas:any = [];

    async function cargarArtistas() {
        artistas = await obtenerArtistas();
    }

    onMount(async () => {
        await cargarArtistas();
    });

    onMount(() => {
        const handlePopState = (event: PopStateEvent) => {
			event.preventDefault();
			goto('/');
		};
		window.addEventListener('popstate', handlePopState);
		
		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
    });

    // Navegar al estudio de un artista concreto
    async function irAlEstudio(artistaId: number) {
        // Asegurarse de cambiar el artista y cargar sus ajustes antes de navegar
        await cambiarArtista(artistaId);
        goto(`/estudio`);
    }

    // Manejar cierre del modal: ocultar modal y recargar artistas
    async function handleModalClose() {
        mostrarRegistrarArtista = false;
        await cargarArtistas();
    }
</script>

{#if mostrarRegistrarArtista}
    <!-- Agregamos on:close para cambiar la variable a false -->
    <RegistrarArtista on:close={() => handleModalClose()} />
{/if}

<div class="seleccionar-estudio-contenedor" aria-label="Contenedor para seleccionar el estudio del artista" data-magnificable>
    <h1 data-magnificable>Bienvenido artista</h1>
    <h2 data-magnificable>¡Vamos a tu estudio!</h2>

    <div class="estudio-acciones">

            <!-- Contenedor de estudios de artistas -->
            <div class="estudios-lista" aria-label="Lista de estudios de artistas">
                {#each artistas as artista}
                    <div class="estudio-item">
                        <span class="artista-numero" aria-label={`Número de artista: ${artista.id}`}>{artista.id}</span>
                        <button class="boton-estudio" 
                        aria-label={`Estudio de ${artista.nombre}`}
                        title={`Ir al estudio de ${artista.nombre}`}
                        onclick={() => irAlEstudio(artista.id)}
                        use:clickSound
                        >
                            Estudio de {artista.nombre}
                        </button>
                    </div>
                {/each}
            </div>

            <button class="boton-nuevo pattern-yellow"
			aria-label="Crear un nuevo estudio" 
			title="Crea un estudio nuevo"
			onclick={crearEstudio}
			use:clickSound
			>
			SOY NUEVO
		</button>
	</div>
</div>

<style>
    .seleccionar-estudio-contenedor {
        background: var(--bg,white);
        margin: auto;
        margin-top: 2rem;
        z-index: 1;
        max-width: 870px;
        width: 100%;
        min-height: 85vh;
        padding: 0;
        text-align: center;
        border: 2px solid var(--icono-color-borde, #000000);
        border-radius: 8px;
    }

    h1 {
        font-size: calc(var(--font-size-base, 1rem) * 2.5);
        margin-bottom: calc(var(--spacing-base, 1rem) * 0.5);
        margin: 0;
        margin-top: calc(var(--spacing-base,1rem) * 1.5);
        padding: 0;
        font-weight: 600;
        letter-spacing: 0.1em;
        word-spacing: 0.2em;
    }

    h2 {
        font-size: calc(var(--font-size-base, 1rem) * 1.5);
        font-weight: 400;
        margin: 0;
        margin-top: calc(var(--spacing-base,1rem) * .5);
        padding: 0;
        letter-spacing: 0.1em;
        word-spacing: 0.2em;
    }

    .estudio-acciones { 
		margin-top: calc(var(--spacing-base, 1rem) * 3); 
	}

	.boton-nuevo {        
        margin-bottom: calc(var(--spacing-base,2rem) * 3);
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		border: none;
		padding: 1rem 5rem;
		font-size: calc(var(--font-size-base, 1rem) * 1.8);
		font-weight: 600;
		letter-spacing: 0.05em;
		border-radius: var(--border-radius, 8px);
		cursor: pointer;
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
		transition: transform 120ms ease, box-shadow 120ms ease;
	}

	.boton-nuevo:hover {
		background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-2px);
	}

	.boton-nuevo:active {
		transform: translateY(0);
	}

	.boton-nuevo:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #d1a700);
		outline-offset: 7px;
	}

    /* Estilos para la lista de estudios de artistas */
    .estudios-lista {
        padding-left: calc(var(--spacing-base,2rem) * 4);
        margin-top: calc(var(--spacing-base,2rem) * 3);
        margin-bottom: calc(var(--spacing-base,2rem) * 3);
        display: flex;
        flex-direction: column;
        gap: calc(var(--spacing-base,2rem) * 2);
        align-items: center;
    }

    .estudio-item {
        display: flex;
        align-items: center;
        gap: calc(var(--spacing-base,2rem) * 3);
    }

    .boton-estudio {
        min-width: 500px;
		background: var(--fondo-botones, #333333);
		color: var(--icono-color-relleno, white);
        border: 2px solid var(--icono-color-borde, #000000);
        border-radius: 8px;
        padding: 0.7rem 5.5rem;
        font-size: calc(var(--font-size-base,2rem)*1.2);
        font-weight: 500;
        letter-spacing: 0.05em;
        word-spacing: 0.2em;
        cursor: pointer;
        box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
        transition: background 120ms;
    }

    .boton-estudio:hover{
        background: var(--fondo-botones-hover, #9b978a);
    }
    .boton-estudio:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #9b978a);
		outline-offset: 7px;
        transform: translateY(-2px);
    }

    .artista-numero {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
		background: var(--fondo-botones, white);
		color: var(--icono-color-relleno, black);
        border: 2px solid var(--icono-color-borde, #000000);
        border-radius: 50%;
        font-size: calc(var(--font-size-base,2rem)*1.2);
        font-weight: 600;
    }

        /* Efecto hover/focus en el botón para cambiar color del círculo asociado */
        .estudio-item:hover .artista-numero {
            background: #ffe0b2; /* naranja suave */
            color: #d35400;
            border-color: #d35400;
        }

        .estudio-item:focus-within .artista-numero {
            background: #c8f7c5; /* verde suave */
            color: #229954;
            border-color: #229954;
        }
</style>