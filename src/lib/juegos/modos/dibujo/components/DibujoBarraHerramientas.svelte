<!--
  DibujoBarraHerramientas.svelte
  Barra de herramientas para el modo de dibujo con tres secciones:
  1. Acciones generales (mover, deshacer, guardar, terminar)
  2. Herramientas (pincel, borrador, stickers)
  3. Opciones específicas de herramienta (colores, grosor)
-->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props para configurar herramientas y acciones visibles
	interface Props {
		herramientasVisibles?: string[];
		accionesVisibles?: string[];
		herramientaInicial?: string;
		colorInicial?: string;
		grosorInicial?: number;
	}

	let { 
		herramientasVisibles = ['pincel', 'borrador', 'stickers'],
		accionesVisibles = ['mover', 'deshacer', 'guardar', 'terminar'],
		herramientaInicial = 'pincel',
		colorInicial = '#000000',
		grosorInicial = 5
	}: Props = $props();

	// Dispatcher para comunicar cambios a los componentes padre
	const dispatch = createEventDispatcher<{
		cambiarHerramienta: { herramienta: string };
		cambiarColor: { color: string };
		cambiarGrosor: { grosor: number };
		accionDeshacer: {};
		accionGuardar: {};
		accionTerminar: {};
		accionMover: {};
	}>();

	// Estado de la barra de herramientas
	let herramientaActual = $state<string>(herramientaInicial);
	let colorActual = $state<string>(colorInicial);
	let grosorActual = $state<number>(grosorInicial);

	// Colores predefinidos
	const coloresPredefinidos = [
		'#000000', // Negro
		'#FF0000', // Rojo
		'#00FF00', // Verde
		'#0000FF', // Azul
		'#FFFF00', // Amarillo
		'#FF00FF', // Magenta
		'#00FFFF', // Cian
		'#FFA500', // Naranja
		'#800080', // Púrpura
		'#FFC0CB'  // Rosa
	];

	// Todas las herramientas disponibles
	const todasLasHerramientas = [
		{
			id: 'pincel',
			nombre: 'Pincel',
			icono: '🖌️',
			descripcion: 'Herramienta para dibujar con color'
		},
		{
			id: 'borrador',
			nombre: 'Borrador',
			icono: '🧽',
			descripcion: 'Herramienta para borrar partes del dibujo'
		},
		{
			id: 'stickers',
			nombre: 'Stickers',
			icono: '🌟',
			descripcion: 'Añadir stickers decorativos (próximamente)'
		}
	];

	// Herramientas filtradas según configuración
	const herramientasDisponibles = $derived(
		todasLasHerramientas.filter(h => herramientasVisibles.includes(h.id))
	);

	/**
	 * Cambia la herramienta activa
	 */
	function seleccionarHerramienta(herramienta: string) {
		herramientaActual = herramienta;
		
		// Establecer valores por defecto según la herramienta
		if (herramienta === 'pincel') {
			colorActual = '#000000'; // Negro por defecto
			grosorActual = 5; // Pequeño por defecto
			dispatch('cambiarColor', { color: colorActual });
			dispatch('cambiarGrosor', { grosor: grosorActual });
		} else if (herramienta === 'borrador') {
			grosorActual = 15; // Pequeño por defecto para borrador
			dispatch('cambiarGrosor', { grosor: grosorActual });
		}
		// Para stickers, mantener valores actuales
		
		dispatch('cambiarHerramienta', { herramienta });
	}

	/**
	 * Cambia el color activo
	 */
	function seleccionarColor(color: string) {
		colorActual = color;
		dispatch('cambiarColor', { color });
	}

	/**
	 * Cambia el grosor del pincel/borrador
	 */
	function cambiarGrosor(event: Event) {
		const input = event.target as HTMLInputElement;
		grosorActual = parseInt(input.value);
		dispatch('cambiarGrosor', { grosor: grosorActual });
	}

	/**
	 * Ejecuta acción de deshacer
	 */
	function ejecutarDeshacer() {
		dispatch('accionDeshacer', {});
	}

	/**
	 * Ejecuta acción de guardar
	 */
	function ejecutarGuardar() {
		dispatch('accionGuardar', {});
	}

	/**
	 * Ejecuta acción de terminar
	 */
	function ejecutarTerminar() {
		dispatch('accionTerminar', {});
	}

	/**
	 * Ejecuta acción de mover
	 */
	function ejecutarMover() {
		dispatch('accionMover', {});
	}

	/**
	 * Verifica si una acción debe mostrarse
	 */
	function mostrarAccion(accion: string): boolean {
		return accionesVisibles.includes(accion);
	}
</script>

<div class="barra-herramientas" role="toolbar" aria-label="Herramientas de dibujo">
	<!-- Sección 1: Acciones Generales -->
	{#if accionesVisibles.length > 0}
		<section class="seccion-acciones" aria-label="Acciones generales">
			{#if mostrarAccion('mover')}
				<button
					class="boton-accion"
					onclick={ejecutarMover}
					aria-label="Mover vista del lienzo"
					title="Mover (próximamente)"
					disabled
				>
					<span class="icono">↔️</span>
					<span class="texto">Mover</span>
				</button>
			{/if}

			{#if mostrarAccion('deshacer')}
				<button
					class="boton-accion"
					onclick={ejecutarDeshacer}
					aria-label="Deshacer última acción"
					title="Deshacer"
				>
					<span class="icono">↩️</span>
					<span class="texto">Deshacer</span>
				</button>
			{/if}

			{#if mostrarAccion('guardar')}
				<button
					class="boton-accion"
					onclick={ejecutarGuardar}
					aria-label="Guardar dibujo actual"
					title="Guardar (próximamente)"
				>
					<span class="icono">💾</span>
					<span class="texto">Guardar</span>
				</button>
			{/if}

			{#if mostrarAccion('terminar')}
				<button
					class="boton-accion boton-terminar"
					onclick={ejecutarTerminar}
					aria-label="Terminar sesión de dibujo"
					title="Terminar (próximamente)"
				>
					<span class="icono">🚪</span>
					<span class="texto">Terminar</span>
				</button>
			{/if}
		</section>
	{/if}

	<!-- Separador -->
	{#if accionesVisibles.length > 0 && herramientasDisponibles.length > 0}
		<div class="separador" aria-hidden="true"></div>
	{/if}

	<!-- Sección 2: Herramientas -->
	<section class="seccion-herramientas" aria-label="Herramientas de dibujo">
		{#each herramientasDisponibles as herramienta}
			<button
				class="boton-herramienta"
				class:activa={herramientaActual === herramienta.id}
				onclick={() => seleccionarHerramienta(herramienta.id)}
				aria-label={herramienta.descripcion}
				aria-pressed={herramientaActual === herramienta.id}
				title={herramienta.nombre}
				disabled={herramienta.id === 'stickers'}
			>
				<span class="icono">{herramienta.icono}</span>
				<span class="texto">{herramienta.nombre}</span>
			</button>
		{/each}
	</section>

	<!-- Separador -->
	{#if herramientasDisponibles.length > 0}
		<div class="separador" aria-hidden="true"></div>
	{/if}

	<!-- Sección 3: Opciones Específicas de Herramienta -->
	<section class="seccion-opciones" aria-label="Opciones de la herramienta seleccionada">
		{#if herramientaActual === 'pincel'}
			<!-- Opciones del Pincel: Color y Grosor -->
			<div class="grupo-opciones">
				<div class="opcion-color">
					<label for="selector-color" class="etiqueta-opcion">Color:</label>
					<div class="paleta-colores" role="radiogroup" aria-label="Selector de color">
						{#each coloresPredefinidos as color}
							<button
								class="color-muestra"
								class:seleccionado={colorActual === color}
								style="background-color: {color}"
								onclick={() => seleccionarColor(color)}
								aria-label="Color {color}"

								role="radio"
								aria-checked={colorActual === color}
								title="Seleccionar color {color}"
							></button>
						{/each}
					</div>
				</div>

				<div class="opcion-grosor">
					<label class="etiqueta-opcion">Grosor:</label>
					<div class="botones-grosor" role="radiogroup" aria-label="Selector de grosor">
						<button
							class="boton-grosor"
							class:seleccionado={grosorActual === 5}
							onclick={() => { grosorActual = 5; dispatch('cambiarGrosor', { grosor: 5 }); }}
							aria-label="Grosor pequeño"
							role="radio"
							aria-checked={grosorActual === 5}
							title="Pequeño (5px)"
						>
							<div class="circulo-grosor pequeno"></div>
							<span class="texto-grosor">Pequeño</span>
						</button>
						<button
							class="boton-grosor"
							class:seleccionado={grosorActual === 15}
							onclick={() => { grosorActual = 15; dispatch('cambiarGrosor', { grosor: 15 }); }}
							aria-label="Grosor mediano"
							role="radio"
							aria-checked={grosorActual === 15}
							title="Mediano (15px)"
						>
							<div class="circulo-grosor mediano"></div>
							<span class="texto-grosor">Mediano</span>
						</button>
						<button
							class="boton-grosor"
							class:seleccionado={grosorActual === 30}
							onclick={() => { grosorActual = 30; dispatch('cambiarGrosor', { grosor: 30 }); }}
							aria-label="Grosor grande"
							role="radio"
							aria-checked={grosorActual === 30}
							title="Grande (30px)"
						>
							<div class="circulo-grosor grande"></div>
							<span class="texto-grosor">Grande</span>
						</button>
					</div>
				</div>
			</div>
		{:else if herramientaActual === 'borrador'}
			<!-- Opciones del Borrador: Solo Grosor -->
			<div class="grupo-opciones">
				<div class="opcion-grosor">
					<label class="etiqueta-opcion">Grosor:</label>
					<div class="botones-grosor" role="radiogroup" aria-label="Selector de grosor del borrador">
						<button
							class="boton-grosor"
							class:seleccionado={grosorActual === 15}
							onclick={() => { grosorActual = 15; dispatch('cambiarGrosor', { grosor: 15 }); }}
							aria-label="Grosor pequeño"
							role="radio"
							aria-checked={grosorActual === 15}
							title="Pequeño (15px)"
						>
							<div class="circulo-grosor pequeno"></div>
							<span class="texto-grosor">Pequeño</span>
						</button>
						<button
							class="boton-grosor"
							class:seleccionado={grosorActual === 40}
							onclick={() => { grosorActual = 40; dispatch('cambiarGrosor', { grosor: 40 }); }}
							aria-label="Grosor mediano"
							role="radio"
							aria-checked={grosorActual === 40}
							title="Mediano (40px)"
						>
							<div class="circulo-grosor mediano"></div>
							<span class="texto-grosor">Mediano</span>
						</button>
						<button
							class="boton-grosor"
							class:seleccionado={grosorActual === 70}
							onclick={() => { grosorActual = 70; dispatch('cambiarGrosor', { grosor: 70 }); }}
							aria-label="Grosor grande"
							role="radio"
							aria-checked={grosorActual === 70}
							title="Grande (70px)"
						>
							<div class="circulo-grosor grande"></div>
							<span class="texto-grosor">Grande</span>
						</button>
					</div>
				</div>
			</div>
		{:else if herramientaActual === 'stickers'}
			<!-- Opciones de Stickers: Placeholder -->
			<div class="grupo-opciones">
				<p class="mensaje-proximamente">Stickers disponibles próximamente</p>
			</div>
		{/if}
	</section>
</div>

<style>
	.barra-herramientas {
		display: flex;
		align-items: center;
        justify-content: center;
		background: var(--bg, #ffffff);
		border: 2px solid var(--icono-color-borde, #000000);
		border-radius: 12px;
		padding: calc(var(--spacing-base,1rem)*1.2) 1rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		gap: 1rem;
		overflow-x: auto;
		min-height: 70px;
	}

	/* Sección de Acciones */
	.seccion-acciones {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.boton-accion {
        margin: calc(var(--spacing-base,1rem)*0.5);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		border: 2px solid var(--icono-color-borde, black);
		border-radius: 8px;
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 60px;
	}

	.boton-accion:hover:not(:disabled) {
		background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-2px);
	}

	.boton-accion:active:not(:disabled) {
		transform: translateY(0);
	}

	.boton-accion:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.boton-accion:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #d1a700);
		outline-offset: 7px;
	}
    
	/* Separadores */
	.separador {
		width: 2px;
		height: 50px;
		background: var(--icono-color-borde, black);
		border-radius: 1px;
	}

	/* Sección de Herramientas */
	.seccion-herramientas {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.boton-herramienta {
        margin: calc(var(--spacing-base,1rem)*0.5);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		border: 2px solid var(--icono-color-borde, black);
		border-radius: 8px;
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 60px;
	}

	.boton-herramienta:hover:not(:disabled) {
		background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-2px);
	}

	.boton-herramienta:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.boton-herramienta.activa {
		transform: translateY(0);
	}

	.boton-herramienta:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #d1a700);
		outline-offset: 7px;
	}

	/* Sección de Opciones */
	.seccion-opciones {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
	}

	.grupo-opciones {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		width: 100%;
	}

	.opcion-color,
	.opcion-grosor {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
	}

	.etiqueta-opcion {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-texto, #333);
		margin: 0;
	}

	/* Paleta de Colores */
	.paleta-colores {
		display: grid;
		grid-template-columns: repeat(5, 30px);
		grid-template-rows: repeat(2, 30px);
		gap: 0.25rem;
		justify-content: center;
	}

	.color-muestra {
		width: 30px;
		height: 30px;
		border: 2px solid var(--fondo-botones-hover, #000000);;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.color-muestra:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
		outline: 2px solid var(--fondo-botones-hover, #000000);
	}

	.color-muestra.seleccionado {
		border-color: var(--fondo-botones-hover, #000000);
		border-width: 3px;
		transform: scale(1.1);
	}

	.color-muestra:focus {
		outline: 2px solid var(--fondo-botones-hover, #000000);
		outline-offset: 0.3vh;
	}

	/* Botones de Grosor */
	.botones-grosor {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.boton-grosor {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		border: 2px solid var(--icono-color-borde, #ccc);
		border-radius: 8px;
		background: var(--bg, #fff);
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 60px;
	}

	.boton-grosor:hover {
		background: var(--fondo-botones-hover, #000000);
		transform: translateY(-2px);
	}

	.boton-grosor.seleccionado {
		border-color: var(--fondo-botones-hover, #000000);
		border-width: 3px;
	}

	.boton-grosor:focus {
		outline: 2px solid var(--fondo-botones-hover, #000000);
		outline-offset: 2px;
	}

	.circulo-grosor {
		border-radius: 50%;
		background: var(--icono-color-relleno, #333);
		border: 4px solid var(--icono-color-borde,#000000);
	}

	.circulo-grosor.pequeno {
		width: 8px;
		height: 8px;
	}

	.circulo-grosor.mediano {
		width: 16px;
		height: 16px;
	}

	.circulo-grosor.grande {
		width: 24px;
		height: 24px;
	}

	.texto-grosor {
		font-size: calc(var(--font-size-base, 1rem) * 0.8); 
		font-weight: 500;
		color: var(--color-texto, #333);
	}

	/* Textos */
	.icono {
		font-size: 1.5rem;
		line-height: 1;
	}

	.texto {
		font-size: calc(var(--font-size-base, 1rem) * 1);
		font-weight: 600;
		line-height: 1;
		text-align: center;
	}

	.mensaje-proximamente {
		font-style: italic;
		color: var(--color-texto-secundario, #666);
		margin: 0;
		text-align: center;
		padding: 1rem;
	}
</style>