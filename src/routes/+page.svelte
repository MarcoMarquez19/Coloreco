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
		<!-- Añadimos pattern-blue al botón principal para demostrar la textura en controles -->
		<button class="boton-principal pattern-blue" aria-label="Iniciar aplicación">Iniciar</button>
	</div>

	<!-- SECCIÓN DEMO: Para visualizar las texturas de accesibilidad -->
	<div class="demo-accesibilidad">
		<p class="demo-titulo">Demo de Patrones de Accesibilidad</p>
		<p class="demo-instruccion"><small>(Abre Ajustes ⚙️ y activa "Texturas de Ayuda")</small></p>
		
		<div class="demo-grid">
			<!-- Cada tarjeta tiene un color de fondo y la clase de patrón correspondiente -->
			<div class="demo-card bg-red pattern-red">
				<span>Error / Rojo</span>
			</div>
			<div class="demo-card bg-green pattern-green">
				<span>Éxito / Verde</span>
			</div>
			<div class="demo-card bg-blue pattern-blue">
				<span>Info / Azul</span>
			</div>
			<div class="demo-card bg-yellow pattern-yellow">
				<span>Aviso / Amarillo</span>
			</div>
		</div>
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
		min-height: 80vh;
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
		font-size: calc(var(--font-size-base, 1rem) * 2.5);
		margin: 0;
		color: #333;
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.subtitulo {
		font-size: calc(var(--font-size-base, 1rem) * 1.2);
		color: #666;
		margin: 0.5rem 0 0 0;
	}

	.bienvenida-acciones {
		margin-bottom: 3rem;
	}

	.boton-principal {
		background-color: #1890ff;
		color: white;
		border: none;
		padding: var(--button-padding, 0.8rem 1.6rem);
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
		border-radius: var(--border-radius, 8px);
		cursor: pointer;
		font-weight: 600;
		transition: transform 0.2s, box-shadow 0.2s;
		/* Aseguramos que el patrón se vea bien sobre el botón */
		position: relative;
		overflow: hidden; 
	}

	.boton-principal:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
	}

	/* Estilos para la Demo */
	.demo-accesibilidad {
		margin-top: 2rem;
		padding: 1.5rem;
		background: white;
		border-radius: var(--border-radius, 8px);
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);
		max-width: 600px;
		width: 100%;
	}

	.demo-titulo {
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		color: #444;
	}

	.demo-instruccion {
		margin: 0 0 1rem 0;
		color: #888;
	}

	.demo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
	}

	.demo-card {
		height: 80px;
		border-radius: var(--border-radius, 8px);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 500;
		font-size: 0.9rem;
		text-shadow: 0 1px 2px rgba(0,0,0,0.2);
		/* Importante: position relative para que el pseudo-elemento del patrón se posicione bien */
		position: relative;
		overflow: hidden;
	}

	/* Colores de fondo para la demo */
	.bg-red { background-color: #ff4d4f; }
	.bg-green { background-color: #52c41a; }
	.bg-blue { background-color: #1890ff; }
	.bg-yellow { background-color: #fadb14; color: #333; text-shadow: none; }

</style>
