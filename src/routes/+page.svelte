<script lang="ts">
	// Página de bienvenida para la aplicación COLORECO
	// Aquí colocamos placeholders para las imágenes SVG del logo y del icono de la app.
	// Ruta recomendada para las imágenes: `src/lib/assets/`
	// - `logo-coloreco.svg`  -> logo grande para la pantalla de bienvenida
	// - `icon-coloreco.svg`  -> icono de la aplicación (pequeño)

	// Importar imágenes desde assets (mejor práctica en SvelteKit)
	import logoColoreco from '$lib/assets/logo-coloreco.svg';
	import iconColoreco from '$lib/assets/icon-coloreco.svg';
</script>

<div class="bienvenida" aria-labelledby="titulo-coloreco">
	<header class="bienvenida-cabecera">
		<!-- Logo: reemplaza el archivo en src/lib/assets/logo-coloreco.svg -->
		<img src={logoColoreco} alt="Logo COLORECO" class="logo" width="260" height="120" />

		<!-- Título textual accesible -->
		<h1 id="titulo-coloreco" class="titulo">COLORECO</h1>

		<!-- Subtítulo / lema -->
		<p class="subtitulo">Tu estudio de pinturas e historias</p>
	</header>

	<div class="bienvenida-acciones">
		<button class="boton-principal" aria-label="Iniciar aplicación">Iniciar</button>
	</div>
</div>

<style>
	/* Estilos adaptativos que responden a las variables CSS dinámicas del store */
	
	.bienvenida {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		/* Usa var(--spacing-base) para padding adaptativo */
		padding: calc(var(--spacing-base, 1rem) * 2) var(--spacing-base, 1rem);
	}

	.bienvenida-cabecera { 
		margin-bottom: calc(var(--spacing-base, 1rem) * 1.5); 
	}

	.logo {
		display: block;
		margin: 0 auto calc(var(--spacing-base, 1rem) * 0.5);
		max-width: 90%;
		height: auto;
	}

	.titulo {
		margin: calc(var(--spacing-base, 1rem) * 0.25) 0;
		/* Tamaño de fuente adaptativo basado en --font-size-base */
		font-size: calc(var(--font-size-base, 1rem) * 2.25);
		letter-spacing: 0.06em;
	}

	.subtitulo {
		margin: 0;
		color: var(--muted, #555);
		/* Tamaño de fuente adaptativo */
		font-size: calc(var(--font-size-base, 1rem) * 1);
	}

	.bienvenida-acciones { 
		margin-top: calc(var(--spacing-base, 1rem) * 1.75); 
	}

	.boton-principal {
		background: var(--accent, #0b6efd);
		color: white;
		border: none;
		/* Usa la variable CSS --button-padding definida en +layout.svelte */
		padding: var(--button-padding, 0.9rem 1.6rem);
		/* Tamaño de fuente adaptativo */
		font-size: calc(var(--font-size-base, 1rem) * 1.05);
		/* Border radius adaptativo */
		border-radius: var(--border-radius, 8px);
		cursor: pointer;
		box-shadow: 0 8px 20px rgba(11,110,253,0.18);
		transition: transform 120ms ease;
	}

	.boton-principal:hover {
		transform: translateY(-2px);
	}

	.boton-principal:focus {
		outline: 3px solid #000000;
		outline-offset: 3px;
	}

	@media (prefers-reduced-motion: reduce) {
		.boton-principal { transition: none; }
	}
</style>
