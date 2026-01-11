<script lang="ts">
	// Página de Créditos de COLORECO
	import { configuraciones } from '$lib/stores/settings';
	import { clickSound } from '$lib/stores/audio';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

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

</script>

<!-- Contenedor directo sin tarjeta -->
<div class="contenedor-creditos" data-magnificable>
	<!-- Título -->
	<div class="header">
		<h1 class="titulo">COLORECO</h1>
	</div>
	
	<!-- Contenido enriquecido -->
	<div class="contenido">
		<!-- Institución -->
		<div class="seccion">
			<div class="icono-seccion">🏛️</div>
			<p class="institucion"><strong>Escuela Politécnica Nacional</strong></p>
			<p class="pais">República del Ecuador</p>
		</div>

		<!-- Proyecto -->
		<div class="seccion">
			<div class="icono-seccion">📚</div>
			<p class="proyecto-titulo">Trabajo de Integración Curricular</p>
			<p class="facultad">Facultad de Ingeniería de Sistemas</p>
		</div>

		<!-- Desarrolladores -->
		<div class="seccion">
			<div class="icono-seccion">👨‍💻</div>
			<p class="label">Equipo de Desarrollo</p>
			<div class="nombres-grid">
				<span class="nombre">Jorge Dueñas</span>
				<span class="nombre">Marco Márquez</span>
				<span class="nombre">Jonathan Poaquiza</span>
			</div>
		</div>

		<!-- Contacto -->
		<div class="seccion">
			<div class="icono-seccion">✉️</div>
			<p class="label-contacto">¿Tienes preguntas? ¡Contáctanos!</p>
			<a 
				href="mailto:marco.marquez@epn.edu.ec" 
				class="enlace pattern-yellow"
				use:clickSound
				aria-label="Enviar correo a marco.marquez@epn.edu.ec"
			>
				marco.marquez@epn.edu.ec
			</a>
		</div>

		<!-- Año -->
		<div class="footer-creditos">
			<p class="ano">© 2025 - 2026 | Todos los derechos reservados</p>
		</div>
	</div>
</div>

<style>
	.contenedor-creditos {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		text-align: center;
		position: relative;
		z-index: 1;
		padding: calc(var(--spacing-base, 1rem) * 2) 2rem calc(var(--spacing-base, 1rem) * 2);
		overflow-y: auto;
	}

	.header {
		margin-bottom: calc(var(--spacing-base, 1rem) * 1.5);
	}

	.titulo {
		font-size: calc(var(--font-size-base, 1rem) * 4);
		color: var(--color-texto, #000000);
		font-weight: 700;
		margin: 0 0 calc(var(--spacing-base, 1rem) * 0.5) 0;
		letter-spacing: 0.15em;
		text-shadow: 2px 2px 12px var(--bg, rgba(255, 255, 255, 0.95)),
		             0 0 40px var(--bg, rgba(255, 255, 255, 0.85));
	}

	.contenido {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--spacing-base, 1rem) * 1.5);
		max-width: 900px;
		width: 100%;
	}

	.seccion {
		background: var(--bg, rgba(255, 255, 255, 0.9));
		padding: calc(var(--spacing-base, 1rem) * 1.2);
		border-radius: var(--border-radius, 12px);
		border: 2px solid var(--color-texto, rgba(0, 0, 0, 0.2));
		width: 100%;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	/* Fondo específico para modo noche */
	:global([data-theme="dark"]) .seccion {
		background: rgba(20, 20, 20, 0.85);
		border-color: rgba(245, 245, 245, 0.3);
	}

	/* Fondo específico para modo noche inverso */
	:global([data-theme="dark-inverted"]) .seccion {
		background: rgba(240, 240, 240, 0.9);
		border-color: rgba(0, 0, 0, 0.3);
	}

	.icono-seccion {
		font-size: 2.5rem;
		margin-bottom: calc(var(--spacing-base, 1rem) * 0.5);
	}

	.institucion {
		font-size: calc(var(--font-size-base, 1rem) * 1.7);
		color: var(--color-texto, #000000);
		margin: 0;
	}

	.institucion strong {
		font-weight: 700;
	}

	.pais {
		font-size: calc(var(--font-size-base, 1rem) * 1.2);
		color: var(--color-texto, #666);
		margin: calc(var(--spacing-base, 1rem) * 0.3) 0 0 0;
		font-style: italic;
	}

	.proyecto-titulo {
		font-size: calc(var(--font-size-base, 1rem) * 1.4);
		color: var(--color-texto, #000000);
		margin: 0 0 calc(var(--spacing-base, 1rem) * 0.5) 0;
		font-weight: 600;
	}

	.facultad {
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
		color: var(--color-texto, #666);
		margin: 0;
		font-style: italic;
	}

	.label {
		font-size: calc(var(--font-size-base, 1rem) * 1.3);
		color: var(--color-texto, #000000);
		margin: 0 0 calc(var(--spacing-base, 1rem) * 0.6) 0;
		font-weight: 600;
	}

	.nombres-grid {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-base, 1rem) * 0.4);
		align-items: center;
	}

	.nombre {
		font-size: calc(var(--font-size-base, 1rem) * 1.3);
		color: #000000;
		font-weight: 600;
		padding: calc(var(--spacing-base, 1rem) * 0.3) calc(var(--spacing-base, 1rem) * 0.8);
		background: rgba(255, 202, 0, 0.35);
		border-radius: var(--border-radius, 6px);
		border: 1px solid rgba(0, 0, 0, 0.2);
	}

	/* Fondo de nombres en modo noche */
	:global([data-theme="dark"]) .nombre {
		background: rgba(255, 202, 0, 0.85);
		color: #000000;
		border-color: rgba(255, 202, 0, 0.9);
	}

	/* Fondo de nombres en modo noche inverso */
	:global([data-theme="dark-inverted"]) .nombre {
		background: rgba(255, 202, 0, 0.75);
		color: #000000;
		border-color: rgba(0, 0, 0, 0.4);
	}

	.label-contacto {
		font-size: calc(var(--font-size-base, 1rem) * 1.3);
		color: var(--color-texto, #000000);
		margin: 0 0 calc(var(--spacing-base, 1rem) * 0.6) 0;
		font-weight: 600;
	}

	.enlace {
		display: inline-block;
		padding: calc(var(--spacing-base, 1rem) * 0.6) calc(var(--spacing-base, 1rem) * 2);
		background: var(--fondo-botones, #ffca00);
		color: #000000;
		text-decoration: none;
		border-radius: var(--border-radius, 10px);
		border: var(--borde-botones, 3px solid #000000);
		box-shadow: var(--sombra-botones, 0 5px 15px rgba(0, 0, 0, 0.3));
		font-size: calc(var(--font-size-base, 1rem) * 1.2);
		font-weight: 700;
		transition: transform 120ms ease, background 120ms ease, box-shadow 120ms ease;
		overflow: hidden;
	}

	.enlace:hover {
		background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-3px);
		box-shadow: var(--sombra-botones, 0 7px 20px rgba(0, 0, 0, 0.4));
	}

	.enlace:active {
		transform: translateY(-1px);
	}

	.enlace:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #d1a700);
		outline-offset: 6px;
	}

	/* Ajustar color del texto del enlace en modo noche inverso */
	:global([data-theme="dark-inverted"]) .enlace {
		color: #ffffff;
	}

	.footer-creditos {
		margin-top: calc(var(--spacing-base, 1rem) * 1);
		width: 100%;
	}

	.ano {
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
		color: var(--color-texto, #666);
		margin: 0;
		font-style: italic;
		text-shadow: 1px 1px 6px var(--bg, rgba(255, 255, 255, 0.9));
	}

	@media (max-width: 768px) {
		.titulo {
			font-size: calc(var(--font-size-base, 1rem) * 4);
		}

		.contenido {
			gap: calc(var(--spacing-base, 1rem) * 2);
		}

		.seccion {
			padding: calc(var(--spacing-base, 1rem) * 1.2);
		}

		.icono-seccion {
			font-size: calc(var(--font-size-base, 1rem) * 2.5);
		}

		.institucion {
			font-size: calc(var(--font-size-base, 1rem) * 1.7);
		}

		.proyecto-titulo {
			font-size: calc(var(--font-size-base, 1rem) * 1.4);
		}

		.nombre {
			font-size: calc(var(--font-size-base, 1rem) * 1.3);
		}
	}
</style>
