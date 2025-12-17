<script lang="ts">
	// Página de bienvenida para la aplicación COLORECO
	// Importar imágenes desde assets 
	import logoColoreco from '$lib/assets/Logo_coloreco.png';
	import {configuraciones} from '$lib/stores/settings';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	function iniciar() {
		goto('/seleccionar-estudio');
	}

	let contenedorPantallaPrincipalRef: HTMLElement | null = null;

	/** Calcula y aplica la escala según la altura de la ventana (máx 1080px) */
	function actualizarEscala(): void {
		if (!contenedorPantallaPrincipalRef) return;
		const maxHeight = 1080; // referencia 1080p
		const rawScale = window.innerHeight / maxHeight;
		// limitar entre 0.6 y 1 para evitar escalados excesivos
		const scale = Math.max(0.6, Math.min(1, rawScale));
		contenedorPantallaPrincipalRef.style.transform = `scale(${scale})`;
		contenedorPantallaPrincipalRef.style.transformOrigin = 'top center';
	}

	onMount(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = ''; // Restaurar al desmontar
		};
	});

	$effect(() => {
		actualizarEscala();
		window.addEventListener('resize', actualizarEscala);
		return () => {
			window.removeEventListener('resize', actualizarEscala);
			// restaurar transform si existe
			if (contenedorPantallaPrincipalRef) {
				contenedorPantallaPrincipalRef.style.transform = '';
				contenedorPantallaPrincipalRef.style.transformOrigin = '';
				contenedorPantallaPrincipalRef.style.margin = '';
			}
		};
	})
</script>

<div class="bienvenida" bind:this={contenedorPantallaPrincipalRef} aria-labelledby="titulo-coloreco" data-magnificable>
	<header class="bienvenida-cabecera">

		<h1 id="titulo-coloreco" class="titulo">COLORECO</h1>

		<div class="logo-ovalo" aria-label="Logo de coloreco - Pincel mágico en un libro de historias con nombre COLORECO">
			<img src={logoColoreco} alt="Logo de coloreco - Pincel mágico en un libro de historias con nombre COLORECO" class="logo" width="260" height="120" />
		</div>

		<p class="subtitulo">Tu estudio de pinturas e historias</p>
	</header>

	<div class="bienvenida-acciones">
		<button class="boton-principal pattern-yellow" 
			aria-label="Iniciar aplicación" 
			title="Iniciar"
			onclick={iniciar}
			>
			Iniciar
		</button>
	</div>
</div>

<style>
	/* Estilos adaptativos que responden a las variables CSS dinámicas del store */
	.bienvenida {
		margin-top: 13vh;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.bienvenida-cabecera {
		margin-bottom: calc(var(--spacing-base, 1rem) * 1.5); 
	}
	
	.titulo {
		padding: 0 auto;
		margin: calc(var(--spacing-base, 1rem) * 1.25) 0;
		font-size: calc(var(--font-size-base, 1rem) * 7.5);
		letter-spacing: 0.26em;
	}

	.logo-ovalo {
		margin: calc(var(--spacing-base, 1rem) * 1.8) auto calc(var(--spacing-base, 1rem) * 1.8);
		display: inline-flex;
		justify-content: center;
		align-items: center;
		border: 4px solid #000;      
		border-radius: 9px;       
		background: white;           
		box-shadow: 0 4px 10px rgba(0,0,0,0.15);
	}

	.logo {
		display: block;
		max-width: 90%;
		height: auto;
	}

	.subtitulo {
		margin: 0;
		color: var(--color-texto, #535353);
		font-size: calc(var(--font-size-base, 1rem) * 2.5);
		font-weight: 500;
	}

	.bienvenida-acciones { 
		margin-top: calc(var(--spacing-base, 1rem) * 3); 
	}

	.boton-principal {
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		border: none;
		/* Usa la variable CSS --button-padding definida en +layout.svelte */
		padding: 1rem 10rem;
		font-size: calc(var(--font-size-base, 1rem) * 3.8);
		font-weight: 600;
		letter-spacing: 0.05em;
		border-radius: var(--border-radius, 8px);
		cursor: pointer;
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
		transition: transform 120ms ease, box-shadow 120ms ease;
		overflow: hidden;
	}

	.boton-principal:hover {
		background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-2px);
	}

	.boton-principal:active {
		transform: translateY(0);
	}

	.boton-principal:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #d1a700);
		outline-offset: 7px;
	}
</style>
