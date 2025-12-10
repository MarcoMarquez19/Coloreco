<script>
	import FondoManchas from '$lib/components/fondos/FondoManchas.svelte';

    function crearEstudio() {
        // Lógica para crear un nuevo estudio
    }
</script>

<FondoManchas />

<div class="seleccionar-estudio-contenedor" aria-label="Contenedor para seleccionar el estudio del artista">
    <h1 data-magnificable>Bienvenido artista</h1>
    <h2 data-magnificable>¡Vamos a tu estudio!</h2>

    <div class="estudio-acciones">
		<button class="boton-nuevo" 
			aria-label="Crear un nuevo estudio" 
			title="Crea un estudio nuevo"
			onclick={crearEstudio}
			>
			SOY NUEVO
		</button>
	</div>
</div>

<style>
    .seleccionar-estudio-contenedor {
        background: var(--bg,white);
        margin: auto;
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
</style>