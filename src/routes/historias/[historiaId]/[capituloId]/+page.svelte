<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { configuraciones } from '$lib/stores/settings';

	interface Opcion {
		id: string;
		texto: string;
		esCorrecta: boolean;
		feedback: string;
	}

	interface Pregunta {
		texto: string;
		opciones: Opcion[];
	}

	interface Personaje {
		nombre: string;
		imagen: string;
	}

	interface Capitulo {
		capituloId: string;
		historiaId: string;
		titulo: string;
		imagenPrincipal: string;
		texto: string;
		pregunta: Pregunta;
		personajes: Personaje[];
	}

	let capitulo = $state<Capitulo | null>(null);
	let cargando = $state<boolean>(true);
	let error = $state<string | null>(null);
	let opcionSeleccionadaIndex = $state<number>(0);
	let respuestaEnviada = $state<boolean>(false);
	let opcionCorrecta = $state<boolean>(false);
	let feedbackMostrado = $state<string>('');
	let totalCapitulos = $state<number>(0);
	let capituloActual = $state<number>(0);

	onMount(async () => {
		try {
			const historiaId = $page.params.historiaId;
			const capituloId = $page.params.capituloId;
			
			const response = await fetch(`/historias/${historiaId}/cap${capituloId}.json`);
			if (!response.ok) {
				throw new Error('Error al cargar el capítulo');
			}
			
			capitulo = await response.json();
			
			// Cargar info de la historia para saber si es el último capítulo
			const historiasResponse = await fetch('/historias/historias.json');
			if (historiasResponse.ok) {
				const historias = await historiasResponse.json();
				const historiaInfo = historias.find((h: any) => h.historiaId === historiaId);
				if (historiaInfo && capituloId) {
					totalCapitulos = historiaInfo.totalCapitulos;
					capituloActual = parseInt(capituloId);
				}
			}
			
			cargando = false;
		} catch (err) {
			console.error('Error al cargar capítulo:', err);
			error = err instanceof Error ? err.message : 'Error desconocido';
			cargando = false;
		}
	});

	onMount(() => {
		document.body.style.overflow = 'hidden';
		
		// Interceptar el botón de volver del navegador/layout para ir a progreso
		const handlePopState = (event: PopStateEvent) => {
			event.preventDefault();
			const historiaId = $page.params.historiaId;
			if (historiaId) {
				goto(`/historias/${historiaId}/progreso`);
			}
		};
		
		window.addEventListener('popstate', handlePopState);
		
		return () => {
			document.body.style.overflow = '';
			window.removeEventListener('popstate', handlePopState);
		};
	});

	function enviarRespuesta() {
		if (!capitulo || respuestaEnviada) return;
		
		const opcionElegida = capitulo.pregunta.opciones[opcionSeleccionadaIndex];
		respuestaEnviada = true;
		opcionCorrecta = opcionElegida.esCorrecta;
		feedbackMostrado = opcionElegida.feedback;
	}

	function continuar() {
		if (!capitulo) return;
		
		// Si es el último capítulo y la respuesta es correcta, ir a página de completado
		if (opcionCorrecta && capituloActual === totalCapitulos) {
			goto(`/historias/${capitulo.historiaId}/completada`);
		} else {
			// Si no, volver a progreso
			goto(`/historias/${capitulo.historiaId}/progreso`);
		}
	}

	function manejarTeclaPresionada(event: KeyboardEvent) {
		if (!capitulo) return;

		// Solo permitir Enter/Espacio cuando se envía respuesta para continuar
		if (respuestaEnviada) {
			// Verificar si hay un botón enfocado
			const elementoActivo = document.activeElement;
			if (elementoActivo && elementoActivo.tagName === 'BUTTON') {
				// Permitir que el navegador maneje el evento normalmente
				return;
			}
			// Si no hay botón enfocado, prevenir la acción
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
			}
			return;
		}

		// Prevenir Enter/Espacio cuando no hay respuesta enviada
		if (event.key === 'Enter' || event.key === ' ') {
			const elementoActivo = document.activeElement;
			// Solo permitir si hay un botón enfocado
			if (elementoActivo && elementoActivo.tagName === 'BUTTON') {
				return;
			}
			event.preventDefault();
		}
	}

	let contenedorPreguntaRef: HTMLElement | null = null;

	function actualizarEscala(): void {
		if (!contenedorPreguntaRef) return;
		const maxHeight = 1080;
		const rawScale = window.innerHeight / maxHeight;
		const scale = Math.max(0.6, Math.min(1, rawScale));
		contenedorPreguntaRef.style.transform = `scale(${scale})`;
		contenedorPreguntaRef.style.transformOrigin = 'top center';
	}

	$effect(() => {
		actualizarEscala();
		window.addEventListener('resize', actualizarEscala);
		window.addEventListener('keydown', manejarTeclaPresionada);
		return () => {
			window.removeEventListener('resize', actualizarEscala);
			window.removeEventListener('keydown', manejarTeclaPresionada);
			if (contenedorPreguntaRef) {
				contenedorPreguntaRef.style.transform = '';
				contenedorPreguntaRef.style.transformOrigin = '';
			}
		};
	});
</script>

<div class="pregunta-contenedor" bind:this={contenedorPreguntaRef} aria-label="Pregunta del capítulo" data-magnificable>
	{#if cargando}
		<div class="estado-carga">
			<p data-magnificable data-readable>Cargando capítulo...</p>
		</div>
	{:else if error}
		<div class="estado-error">
			<p data-magnificable data-readable>Error: {error}</p>
		</div>
	{:else if capitulo}
		<div class="contenido-principal">
			<!-- Panel izquierdo: Historia -->
			<div class="panel-historia">
				<div class="cuadro-historia">
					<h1 data-magnificable data-readable>{capitulo.titulo}</h1>
					
					<div class="contenido-historia">
						<div class="imagen-principal-contenedor" data-magnificable tabindex="0" role="img" aria-label={`Imagen de ${capitulo.titulo}`}>
							<img src={capitulo.imagenPrincipal} alt={capitulo.titulo} class="imagen-principal" />
						</div>

						<div class="texto-historia" tabindex="0">
							<p data-magnificable data-readable>{capitulo.texto}</p>
						</div>
					</div>

					{#if $configuraciones.pictogramMode && capitulo.personajes.length > 0}
						<div class="personajes-contenedor">
							{#each capitulo.personajes as personaje}
								<div class="personaje-item" data-magnificable>
									<img src={personaje.imagen} alt={personaje.nombre} />
								<span data-magnificable data-readable>{personaje.nombre}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Panel derecho: Pregunta y opciones -->
			<div class="panel-pregunta">
				<div class="cuadro-pregunta">
					<h2 class="pregunta-titulo" data-magnificable data-readable tabindex="0">{capitulo.pregunta.texto}</h2>
					
					<p class="etiqueta-opciones">Opciones</p>

					<div class="opciones-lista">
						{#each capitulo.pregunta.opciones as opcion, index}
							<button
								class="opcion-boton"
								class:seleccionada={index === opcionSeleccionadaIndex && !respuestaEnviada}
								class:correcta={respuestaEnviada && opcion.esCorrecta}
								class:incorrecta={respuestaEnviada && !opcion.esCorrecta && index === opcionSeleccionadaIndex}
								class:deshabilitada={respuestaEnviada}
							onclick={() => { if (!respuestaEnviada) { opcionSeleccionadaIndex = index; enviarRespuesta(); } }}
							onfocus={() => { if (!respuestaEnviada) opcionSeleccionadaIndex = index; }}
								disabled={respuestaEnviada}
								aria-label={`Opción: ${opcion.texto}`}
							title={opcion.texto}
							data-magnificable
							data-readable
						>
								{opcion.texto}
							</button>
						{/each}
					</div>

					{#if respuestaEnviada}
						<div class="feedback-contenedor" class:correcto={opcionCorrecta} class:incorrecto={!opcionCorrecta}>
							<p class="feedback-texto" data-magnificable data-readable>{feedbackMostrado}</p>
							<button class="boton-continuar" onclick={continuar} aria-label="Continuar" data-magnificable data-readable>
								Continuar
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.pregunta-contenedor {
		margin: 2vh auto;
		background: transparent;
		z-index: 1;
		width: 100%;
		max-width: 95vw;
		min-height: 90vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 1rem;
		position: relative;
	}

	.contenido-principal {
		display: flex;
		gap: calc(var(--spacing-base, 1rem) * 2);
		width: 100%;
		align-items: stretch;
		max-width: 1600px;
	}

	.panel-historia {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.panel-pregunta {
		flex: 0 0 400px;
		display: flex;
		flex-direction: column;
	}

	.cuadro-historia,
	.cuadro-pregunta {
		background: var(--bg, white);
		border: 2px solid var(--icono-color-borde, #000000);
		border-radius: 8px;
		padding: calc(var(--spacing-base, 1rem) * 2);
		box-shadow: var(--sombra-botones, 0 4px 16px rgba(0, 0, 0, 0.2));
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	h1 {
		font-size: calc(var(--font-size-base, 1rem) * 2);
		margin: 0 0 calc(var(--spacing-base, 1rem) * 1.5) 0;
		padding: 0;
		font-weight: 600;
		text-align: center;
		color: var(--color-texto, #333);
		border-bottom: 2px solid var(--icono-color-borde, #000000);
		padding-bottom: calc(var(--spacing-base, 1rem) * 1);
	}

	.contenido-historia {
		display: flex;
		gap: calc(var(--spacing-base, 1rem) * 2);
		margin-bottom: calc(var(--spacing-base, 1rem) * 1.5);
		align-items: flex-start;
	}

	.imagen-principal-contenedor {
		flex: 0 0 auto;
		width: 350px;
		border: 2px solid var(--icono-color-borde, #000000);
		border-radius: 8px;
		overflow: hidden;
	}

	.imagen-principal {
		width: 100%;
		height: auto;
		display: block;
	}

	.texto-historia {
		flex: 1;
		overflow-y: auto;
	}

	.texto-historia p {
		font-size: calc(var(--font-size-base, 1rem) * 1.2);
		line-height: 1.6;
		color: var(--color-texto, #333);
		margin: 0;
		text-align: justify;
	}

	.personajes-contenedor {
		display: flex;
		justify-content: center;
		gap: calc(var(--spacing-base, 1rem) * 1.5);
		padding-top: calc(var(--spacing-base, 1rem) * 1);
		border-top: 2px solid var(--icono-color-borde, #e0e0e0);
	}

	.personaje-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--spacing-base, 1rem) * 0.5);
	}

	.personaje-item img {
		width: calc(var(--font-size-base, 1rem) * 6);
		height: calc(var(--font-size-base, 1rem) * 6);
		object-fit: cover;
		border-radius: 8px;
		border: 2px solid var(--icono-color-borde, #000000);
	}

	.personaje-item span {
		font-size: calc(var(--font-size-base, 1rem) * 1);
		font-weight: 500;
		color: var(--color-texto, #333);
	}

	h2.pregunta-titulo {
		font-size: calc(var(--font-size-base, 1rem) * 1.5);
		margin: 0 0 calc(var(--spacing-base, 1rem) * 1) 0;
		font-weight: 600;
		color: var(--color-texto, #333);
		text-align: center;
		line-height: 1.4;
	}

	.etiqueta-opciones {
		font-size: calc(var(--font-size-base, 1rem) * 1.2);
		font-weight: 600;
		margin: calc(var(--spacing-base, 1rem) * 1) 0 calc(var(--spacing-base, 1rem) * 0.75) 0;
		text-align: center;
		color: var(--color-texto, #333);
	}

	.opciones-lista {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-base, 1rem) * 1);
		margin-bottom: calc(var(--spacing-base, 1rem) * 1.5);
	}

	.opcion-boton {
		background: var(--bg, white);
		border: 2px solid var(--icono-color-borde, #000000);
		border-radius: 8px;
		padding: calc(var(--spacing-base, 1rem) * 1);
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
		font-weight: 500;
		color: var(--color-texto, #333);
		cursor: pointer;
		transition: all 120ms ease;
		text-align: center;
		line-height: 1.4;
	}

	.opcion-boton:hover:not(.deshabilitada) {
		background: var(--fondo-botones-hover, #f0f0f0);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.opcion-boton:focus {
		outline: var(--borde-botones, 4px solid #000000);
		outline-offset: 4px;
	}

	.opcion-boton.seleccionada {
		background: var(--fondo-botones, #e3f2fd);
		border-color: var(--icono-color-borde, #1976d2);
		transform: scale(1.02);
	}

	.opcion-boton.correcta {
		background: #4caf50;
		color: white;
		border-color: #2e7d32;
	}

	.opcion-boton.incorrecta {
		background: #f44336;
		color: white;
		border-color: #c62828;
	}

	.opcion-boton.deshabilitada {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.boton-continuar {
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		border: none;
		padding: calc(var(--spacing-base, 1rem) * 1) calc(var(--spacing-base, 1rem) * 2);
		font-size: calc(var(--font-size-base, 1rem) * 1.3);
		font-weight: 600;
		border-radius: 8px;
		cursor: pointer;
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
		transition: transform 120ms ease, box-shadow 120ms ease;
		width: 100%;
	}

	.boton-continuar:hover {
		background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-2px);
	}

	.boton-continuar:active {
		transform: translateY(0);
	}

	.boton-continuar:focus {
		outline: var(--borde-botones, 4px solid #000000);
		outline-offset: 4px;
	}

	.feedback-contenedor {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-base, 1rem) * 1);
		padding: calc(var(--spacing-base, 1rem) * 1.5);
		border-radius: 8px;
		border: 2px solid;
	}

	.feedback-contenedor.correcto {
		background: #e8f5e9;
		border-color: #4caf50;
	}

	.feedback-contenedor.incorrecto {
		background: #ffebee;
		border-color: #f44336;
	}

	.feedback-texto {
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
		font-weight: 500;
		margin: 0;
		text-align: center;
		line-height: 1.4;
	}

	.feedback-contenedor.correcto .feedback-texto {
		color: #2e7d32;
	}

	.feedback-contenedor.incorrecto .feedback-texto {
		color: #c62828;
	}

	.estado-carga,
	.estado-error {
		text-align: center;
		padding: 3rem;
		font-size: 1.25rem;
		color: var(--color-texto, #333);
	}

	.estado-error {
		color: var(--color-error, #d32f2f);
	}

	@media (max-width: 1024px) {
		.contenido-principal {
			flex-direction: column;
		}

		.panel-pregunta {
			flex: 1;
		}
	}

	@media (max-width: 768px) {
		.pregunta-contenedor {
			padding: 0 0.5rem;
		}

		h1 {
			font-size: calc(var(--font-size-base, 1rem) * 1.5);
		}

		.personaje-item img {
			width: calc(var(--font-size-base, 1rem) * 4);
			height: calc(var(--font-size-base, 1rem) * 4);
		}
	}
</style>
