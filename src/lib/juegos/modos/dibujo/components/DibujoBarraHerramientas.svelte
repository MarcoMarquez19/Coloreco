<!--
  DibujoBarraHerramientas.svelte
  Barra de herramientas para el modo de dibujo con tres secciones:
  1. Acciones generales (mover, deshacer, guardar, terminar)
  2. Herramientas (pincel, borrador, stickers)
  3. Opciones específicas de herramienta (colores, grosor)
-->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

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
	let herramientaActual = $state<string>('pincel');
	let colorActual = $state<string>('#000000');
	let grosorActual = $state<number>(5);

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

	// Herramientas disponibles
	const herramientasDisponibles = [
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

	/**
	 * Cambia la herramienta activa
	 */
	function seleccionarHerramienta(herramienta: string) {
		herramientaActual = herramienta;
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
</script>

<div class="barra-herramientas" role="toolbar" aria-label="Herramientas de dibujo">
	<!-- Sección 1: Acciones Generales -->
	<section class="seccion-acciones" aria-label="Acciones generales">
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

		<button
			class="boton-accion"
			onclick={ejecutarDeshacer}
			aria-label="Deshacer última acción"
			title="Deshacer"
		>
			<span class="icono">↩️</span>
			<span class="texto">Deshacer</span>
		</button>

		<button
			class="boton-accion"
			onclick={ejecutarGuardar}
			aria-label="Guardar dibujo actual"
			title="Guardar (próximamente)"
		>
			<span class="icono">💾</span>
			<span class="texto">Guardar</span>
		</button>

		<button
			class="boton-accion boton-terminar"
			onclick={ejecutarTerminar}
			aria-label="Terminar sesión de dibujo"
			title="Terminar (próximamente)"
		>
			<span class="icono">🚪</span>
			<span class="texto">Terminar</span>
		</button>
	</section>

	<!-- Separador -->
	<div class="separador" aria-hidden="true"></div>

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
	<div class="separador" aria-hidden="true"></div>

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
					<label for="control-grosor" class="etiqueta-opcion">Grosor: {grosorActual}px</label>
					<input
						id="control-grosor"
						type="range"
						min="1"
						max="50"
						value={grosorActual}
						oninput={cambiarGrosor}
						class="control-deslizante"
						aria-label="Control de grosor del pincel"
					/>
				</div>
			</div>
		{:else if herramientaActual === 'borrador'}
			<!-- Opciones del Borrador: Solo Grosor -->
			<div class="grupo-opciones">
				<div class="opcion-grosor">
					<label for="control-grosor-borrador" class="etiqueta-opcion">Grosor: {grosorActual}px</label>
					<input
						id="control-grosor-borrador"
						type="range"
						min="5"
						max="100"
						value={grosorActual}
						oninput={cambiarGrosor}
						class="control-deslizante"
						aria-label="Control de grosor del borrador"
					/>
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
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.color-muestra {
		width: 30px;
		height: 30px;
		border: 2px solid #fff;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.color-muestra:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.color-muestra.seleccionado {
		border-color: var(--color-seleccionado, #007bff);
		border-width: 3px;
		transform: scale(1.1);
	}

	.color-muestra:focus {
		outline: 2px solid var(--color-focus, #007bff);
		outline-offset: 2px;
	}

	/* Control Deslizante */
	.control-deslizante {
		width: 120px;
		height: 8px;
		border-radius: 5px;
		background: var(--color-fondo-slider, #ddd);
		outline: none;
		appearance: none;
		cursor: pointer;
	}

	.control-deslizante::-webkit-slider-thumb {
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-thumb-slider, #007bff);
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.control-deslizante::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-thumb-slider, #007bff);
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.control-deslizante:focus {
		box-shadow: 0 0 0 2px var(--color-focus, #007bff);
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