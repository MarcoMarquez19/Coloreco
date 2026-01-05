<!--
  DibujoBarraHerramientas.svelte
  Barra de herramientas para el modo de dibujo con tres secciones:
  1. Acciones generales (mover, deshacer, guardar, terminar)
  2. Herramientas (pincel, borrador, stickers)
  3. Opciones específicas de herramienta (colores, grosor)
-->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { CATEGORIAS_STICKERS, TAMANOS_STICKER, type Sticker, type Categoria, type Subcategoria } from '../stickers.data';
	import { clickSound } from '$lib/stores/audio';

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
		seleccionarSticker: { sticker: Sticker };
		cambiarTamanoSticker: { escala: number };
		accionDeshacer: {};
		accionGuardar: {};
		accionTerminar: {};
		accionMover: {};
		cambiarZoom: { nivel: number };
	}>();

	// Estado de la barra de herramientas
	let herramientaActual = $state<string>(herramientaInicial);
	let colorActual = $state<string>(colorInicial);
	let grosorActual = $state<number>(grosorInicial);
	let nivelZoomActual = $state<number>(1); // 1 = sin zoom, 1.5 = zoom medio, 2.5 = zoom alto

	// Estado para stickers
	let categoriaActual = $state<Categoria>(CATEGORIAS_STICKERS[0]);
	let subcategoriaActual = $state<Subcategoria>(CATEGORIAS_STICKERS[0].subcategorias[0]);
	let stickerSeleccionado = $state<Sticker | null>(null);
	let tamanoStickerActual = $state<number>(1.0); // Escala mediana por defecto
	let mostrarPanelStickers = $state<boolean>(false);
	let botonStickersRef: HTMLButtonElement | null = $state(null);
	let panelTop = $state<number>(0);
	let panelLeft = $state<number>(0);

	// Colores predefinidos con sus patrones correspondientes
	const coloresPredefinidos = [
		{ color: '#222121ff', patron: 'pattern-black', nombre: 'Negro' },
		{ color: '#f53c3cff', patron: 'pattern-red', nombre: 'Rojo' },
		{ color: '#45d145ff', patron: 'pattern-green', nombre: 'Verde' },
		{ color: '#0000FF', patron: 'pattern-blue', nombre: 'Azul' },
		{ color: '#e7e74fff', patron: 'pattern-yellow', nombre: 'Amarillo' },
		{ color: '#fa64faff', patron: 'pattern-magenta', nombre: 'Magenta' },
		{ color: '#89ebebff', patron: 'pattern-cyan', nombre: 'Cian' },
		{ color: '#e2b35dff', patron: 'pattern-orange', nombre: 'Naranja' },
		{ color: '#9c359cff', patron: 'pattern-purple', nombre: 'Púrpura' },
		{ color: '#FFC0CB', patron: 'pattern-pink', nombre: 'Rosa' }
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
			icono: '🧼​',
			descripcion: 'Herramienta para borrar partes del dibujo'
		},
		{
			id: 'stickers',
			nombre: 'Stickers',
			icono: '🖼️',
			descripcion: 'Añadir stickers decorativos al dibujo'
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
			mostrarPanelStickers = false;
		} else if (herramienta === 'borrador') {
			grosorActual = 15; // Pequeño por defecto para borrador
			dispatch('cambiarGrosor', { grosor: grosorActual });
			mostrarPanelStickers = false;
		} else if (herramienta === 'stickers') {
			// Cargar sticker por defecto: primer sticker de Flora en tamaño mediano
			const categoriaEntornoNatural = CATEGORIAS_STICKERS[0]; // Entorno Natural
			const subcategoriaFlora = categoriaEntornoNatural.subcategorias[0]; // Flora
			const stickerPorDefecto = subcategoriaFlora.stickers[0]; // Primer sticker
			
			if (stickerPorDefecto) {
				categoriaActual = categoriaEntornoNatural;
				subcategoriaActual = subcategoriaFlora;
				stickerSeleccionado = stickerPorDefecto;
				tamanoStickerActual = 1.0; // Tamaño mediano por defecto
				
				// Disparar eventos
				dispatch('seleccionarSticker', { sticker: stickerPorDefecto });
				dispatch('cambiarTamanoSticker', { escala: 1.0 });
			}
			
			mostrarPanelStickers = false;
		}
		
		dispatch('cambiarHerramienta', { herramienta });
	}

	/**
	 * Selecciona una categoría principal de stickers
	 */
	function seleccionarCategoria(categoria: Categoria) {
		categoriaActual = categoria;
		subcategoriaActual = categoria.subcategorias[0];
	}

	/**
	 * Selecciona un sticker específico
	 */
	function seleccionarStickerItem(sticker: Sticker) {
		stickerSeleccionado = sticker;
		mostrarPanelStickers = false;
		dispatch('seleccionarSticker', { sticker });
	}

	/**
	 * Cambia el tamaño del sticker
	 */
	function seleccionarTamanoSticker(escala: number) {
		tamanoStickerActual = escala;
		dispatch('cambiarTamanoSticker', { escala });
	}

	/**
	 * Abre el panel de stickers posicionado desde el botón
	 */
	function abrirPanelStickers() {
		if (!botonStickersRef) return;
		
		const rect = botonStickersRef.getBoundingClientRect();
		// Panel aparece debajo del botón, centrado horizontalmente respecto al botón
		panelTop = rect.bottom + 10; // 10px de espacio debajo del botón
		panelLeft = rect.left + rect.width / 2; // Centro horizontal del botón
		
		mostrarPanelStickers = true;
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
	 * Efecto para actualizar las variables CSS de posicionamiento del panel
	 */
	$effect(() => {
		if (typeof window !== 'undefined' && mostrarPanelStickers) {
			const root = document.documentElement;
			root.style.setProperty('--panel-top', `${panelTop}px`);
			root.style.setProperty('--panel-left', `${panelLeft}px`);
		}
	});

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
		herramientaActual = 'mover';
		dispatch('accionMover', {});
	}

	/**
	 * Cambia el nivel de zoom
	 */
	function seleccionarZoom(nivel: number) {
		nivelZoomActual = nivel;
		dispatch('cambiarZoom', { nivel });
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
					class="boton-accion pattern-yellow"
					onclick={ejecutarMover}
					use:clickSound
					aria-label="Mover vista del lienzo"
					title="Mover"
				>
					<span class="icono">↔️</span>
					<span class="texto">Mover</span>
				</button>
			{/if}

			{#if mostrarAccion('deshacer')}
				<button
					class="boton-accion pattern-yellow"
					onclick={ejecutarDeshacer}
					use:clickSound
					aria-label="Deshacer última acción"
					title="Deshacer"
				>
					<span class="icono">↩️</span>
					<span class="texto">Deshacer</span>
				</button>
			{/if}

			{#if mostrarAccion('guardar')}
				<button
					class="boton-accion pattern-yellow"
					onclick={ejecutarGuardar}
					use:clickSound
					aria-label="Guardar dibujo actual"
					title="Guardar (próximamente)"
				>
					<span class="icono">💾</span>
					<span class="texto">Guardar</span>
				</button>
			{/if}

			{#if mostrarAccion('terminar')}
				<button
					class="boton-accion boton-terminar pattern-yellow"
					onclick={ejecutarTerminar}
					use:clickSound
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
				class="boton-herramienta pattern-yellow"
				class:activa={herramientaActual === herramienta.id}
				onclick={() => seleccionarHerramienta(herramienta.id)}
				use:clickSound
				aria-label={herramienta.descripcion}
				aria-pressed={herramientaActual === herramienta.id}
				title={herramienta.nombre}
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
		{#if herramientaActual === 'mover'}
			<!-- Opciones de Mover: Niveles de Zoom -->
			<div class="grupo-opciones">
				<div class="opcion-zoom">
					<label class="etiqueta-opcion" for="zoom-selector">Nivel de Zoom</label>
					<div class="botones-zoom">
						<button
							type="button"
							class="boton-zoom"
							class:seleccionado={nivelZoomActual === 1}
							onclick={() => seleccionarZoom(1)}
							use:clickSound
							aria-label="Zoom normal (x1)"
							title="Zoom normal"
						>
							<span class="icono-zoom">🔍</span>
							<span class="texto-zoom">x1</span>
						</button>
						<button
							type="button"
							class="boton-zoom"
							class:seleccionado={nivelZoomActual === 1.5}
							onclick={() => seleccionarZoom(1.5)}
							use:clickSound
							aria-label="Zoom medio (x1.5)"
							title="Zoom medio"
						>
							<span class="icono-zoom">🔍</span>
							<span class="texto-zoom">x1.5</span>
						</button>
						<button
							type="button"
							class="boton-zoom"
							class:seleccionado={nivelZoomActual === 2.5}
							onclick={() => seleccionarZoom(2.5)}
							use:clickSound
							aria-label="Zoom alto (x2.5)"
							title="Zoom alto"
						>
							<span class="icono-zoom">🔍</span>
							<span class="texto-zoom">x2.5</span>
						</button>
					</div>
				</div>
			</div>
		{:else if herramientaActual === 'pincel'}
			<!-- Opciones del Pincel: Color y Grosor -->
			<div class="grupo-opciones">
				<div class="opcion-color">
					<label for="selector-color" class="etiqueta-opcion">Color:</label>
					<div class="paleta-colores" role="radiogroup" aria-label="Selector de color">
						{#each coloresPredefinidos as { color, patron, nombre }}
							<button
								class="color-muestra {patron}"
								class:seleccionado={colorActual === color}
								style="background-color: {color}"
								onclick={() => seleccionarColor(color)}
								use:clickSound
								aria-label="Color {nombre}"
								role="radio"
								aria-checked={colorActual === color}
								title="Seleccionar color {nombre}"
							></button>
						{/each}
					</div>
				</div>

				<div class="opcion-grosor">
					<label class="etiqueta-opcion" for="">Grosor:</label>
					<div class="botones-grosor" role="radiogroup" aria-label="Selector de grosor">
						<button
							class="boton-grosor"
							class:seleccionado={grosorActual === 5}
							onclick={() => { grosorActual = 5; dispatch('cambiarGrosor', { grosor: 5 }); }}
							use:clickSound
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
							use:clickSound
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
							use:clickSound
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
					<label class="etiqueta-opcion" for="">Grosor:</label>
					<div class="botones-grosor" role="radiogroup" aria-label="Selector de grosor del borrador">
						<button
							class="boton-grosor"
							class:seleccionado={grosorActual === 15}
							onclick={() => { grosorActual = 15; dispatch('cambiarGrosor', { grosor: 15 }); }}
							use:clickSound
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
							use:clickSound
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
							use:clickSound
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
			<!-- Opciones de Stickers: Panel completo -->
			<div class="grupo-opciones grupo-stickers">
				<!-- Botón para abrir/cerrar panel de stickers -->
				<button
					bind:this={botonStickersRef}
					class="boton-abrir-stickers"
					class:activo={mostrarPanelStickers}
					onclick={() => {
						if (mostrarPanelStickers) {
							mostrarPanelStickers = false;
						} else {
							abrirPanelStickers();
						}
					}}
					use:clickSound
					aria-label="Abrir panel de stickers"
					aria-expanded={mostrarPanelStickers}
				>
					<span class="icono-sticker">{stickerSeleccionado?.emoji ?? '🎨'}</span>
					<span class="texto-sticker">{stickerSeleccionado ? stickerSeleccionado.nombre : 'Elegir sticker'}</span>
					<span class="flecha-sticker">{mostrarPanelStickers ? '▲' : '▼'}</span>
				</button>

				<!-- Selector de tamaño de sticker -->
				<div class="selector-tamano-sticker">
					<label class="etiqueta-opcion" for="">Tamaño:</label>
					<div class="botones-tamano" role="radiogroup" aria-label="Selector de tamaño de sticker">
						{#each TAMANOS_STICKER as tamano}
							<button
								class="boton-tamano"
								class:seleccionado={tamanoStickerActual === tamano.escala}
								onclick={() => seleccionarTamanoSticker(tamano.escala)}
								use:clickSound
								aria-label={tamano.descripcion}
								role="radio"
								aria-checked={tamanoStickerActual === tamano.escala}
								title={tamano.descripcion}
							>
								{tamano.nombre}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Panel flotante de stickers -->
			{#if mostrarPanelStickers}
				<div class="panel-stickers-flotante" role="dialog" aria-label="Selector de stickers">
					<!-- Header del panel -->
					<div class="panel-header">
						<h3>Selecciona un sticker</h3>
						<button
							class="boton-cerrar-panel"
							onclick={() => mostrarPanelStickers = false}
							use:clickSound
							aria-label="Cerrar panel de stickers"
						>
							✕
						</button>
					</div>

					<!-- Tabs de categorías principales -->
					<div class="tabs-categorias" role="tablist" aria-label="Categorías de stickers">
						{#each CATEGORIAS_STICKERS as categoria}
							<button
								class="tab-categoria"
								class:activa={categoriaActual.id === categoria.id}
								onclick={() => seleccionarCategoria(categoria)}
								use:clickSound
								role="tab"
								aria-selected={categoriaActual.id === categoria.id}
								aria-label={categoria.nombre}
								title={categoria.descripcion}
							>
								<span class="icono-tab">{categoria.icono}</span>
								<span class="texto-tab">{categoria.nombre}</span>
							</button>
						{/each}
					</div>

					<!-- Tabs de subcategorías -->
					<div class="tabs-subcategorias" role="tablist" aria-label="Subcategorías">
						{#each categoriaActual.subcategorias as subcategoria}
							<button
								class="tab-subcategoria"
								class:activa={subcategoriaActual.id === subcategoria.id}
								onclick={() => subcategoriaActual = subcategoria}
								use:clickSound
								role="tab"
								aria-selected={subcategoriaActual.id === subcategoria.id}
								aria-label={subcategoria.nombre}
							>
								<span class="icono-sub">{subcategoria.icono}</span>
								<span class="texto-sub">{subcategoria.nombre}</span>
							</button>
						{/each}
					</div>

					<!-- Grid de stickers -->
					<div class="grid-stickers" role="listbox" aria-label="Stickers disponibles">
						{#each subcategoriaActual.stickers as sticker}
							<button
								class="boton-sticker"
								class:seleccionado={stickerSeleccionado?.id === sticker.id}
								onclick={() => seleccionarStickerItem(sticker)}
								use:clickSound
								role="option"
								aria-selected={stickerSeleccionado?.id === sticker.id}
								aria-label={sticker.nombre}
								title={sticker.descripcion}
							>
								<span class="emoji-sticker">{sticker.emoji}</span>
								<span class="nombre-sticker">{sticker.nombre}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
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
		font-size: calc(var(--font-size-base,1rem)*1.1);
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
		background: var(--fondo-botones-hover, #7a7a7a);
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

	/* ====== Estilos para Stickers ====== */
	
	.grupo-stickers {
		position: relative;
		flex-wrap: wrap;
	}

	.boton-abrir-stickers {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 2px solid var(--icono-color-borde, #000);
		border-radius: 8px;
		background: var(--fondo-botones, #ffca00);
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 150px;
		color: var(--icono-color-relleno, #000);
	}

	.boton-abrir-stickers:hover {
		background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-2px);
	}

	.boton-abrir-stickers.activo {
		border-color: var(--color-primario, #007bff);
		border-width: 3px;
	}

	.boton-abrir-stickers:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #d1a700);
		outline-offset: 7px;
	}

	.icono-sticker {
		font-size: 1.5rem;
	}

	.texto-sticker {
		font-size: calc(var(--font-size-base, 1rem) * 0.9);
		font-weight: 600;
		flex: 1;
	}

	.flecha-sticker {
		font-size: 0.8rem;
	}

	.selector-tamano-sticker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
	}

	.botones-tamano {
		display: flex;
		gap: 0.5rem;
	}

	.boton-tamano {
		padding: 0.4rem 0.8rem;
		border: 2px solid var(--icono-color-borde, #ccc);
		border-radius: 6px;
		background: var(--bg, #fff);
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: calc(var(--font-size-base, 1rem) * 0.85);
		font-weight: 500;
		color: var(--color-texto, #333);
	}

	.boton-tamano:hover {
		background: var(--fondo-botones-hover, #e0e0e0);
		transform: translateY(-1px);
	}

	.boton-tamano.seleccionado {
		border-color: var(--color-primario, #007bff);
		border-width: 3px;
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, #000);
	}

	.boton-tamano:focus {
		outline: 2px solid var(--fondo-botones-hover, #000);
		outline-offset: 2px;
	}

	/* Panel flotante de stickers */
	.panel-stickers-flotante {
		position: fixed;
		top: var(--panel-top, 0px);
		left: var(--panel-left, 0px);
		transform: translateX(-100%);
		width: auto;
		min-width: 32vw;
		max-width: min(90vw, 500px);
		background: var(--bg, #ffffff);
		border: 3px solid var(--icono-color-relleno, #000);
		border-radius: 16px;
		box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
		z-index: 99999;
		display: flex;
		flex-direction: column;
		overflow: visible;
		box-sizing: border-box;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--fondo-botones, #ffca00);
		border-bottom: 2px solid var(--icono-color-relleno, #000);
		flex-shrink: 0;
	}

	.panel-header h3 {
		margin: 0;
		font-size: calc(var(--font-size-base, 1rem) * 1.2);
		font-weight: 700;
		color: var(--icono-color-relleno, #000);
	}

	.boton-cerrar-panel {
		width: 32px;
		height: 32px;
		border: 2px solid var(--icono-color-relleno, #000);
		border-radius: 50%;
		cursor: pointer;
		font-size: 1rem;
		font-weight: bold;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.boton-cerrar-panel:hover {
		background: var(--color-error, #ff4444);
		color: white;
	}

	.boton-cerrar-panel:focus {
		outline: 2px solid var(--fondo-botones-hover, #000);
		outline-offset: 2px;
	}

	/* Tabs de categorías */
	.tabs-categorias {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		padding: 0.5rem;
		flex-shrink: 0;
		justify-content: center;
	}

	.tab-categoria {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		padding: 0.4rem 0.6rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
		min-width: fit-content;
		color: var(--color-texto, #333);
		background: var(--bg, #fff);
		border: 2px solid var(--icono-color-borde, #ccc);
	}

	.tab-categoria:hover {
		background: var(--fondo-botones-hover, #8e8e8e);
		transform: translateY(-1px);
	}

	.tab-categoria.activa {
		border-width: 3px;
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, #000);
	}

	.tab-categoria:focus {
		outline: 2px solid var(--fondo-botones-hover, #000);
		outline-offset: 2px;
	}

	.icono-tab {
		font-size: 1.1rem;
	}

	.texto-tab {
		font-size: calc(var(--font-size-base, 1rem) * 0.9);
		font-weight: 600;
		text-align: center;
		white-space: nowrap;
	}

	/* Tabs de subcategorías */
	.tabs-subcategorias {
		display: flex;
		gap: 0.4rem;
		padding: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
		flex-shrink: 0;
		max-width: 100%;
		border-bottom: 2px solid var(--icono-color-borde, #000000);
		border-top: 2px solid var(--icono-color-borde, #000000);
	}

	.tab-subcategoria {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.3rem 0.5rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: calc(var(--font-size-base, 1rem) * 0.9);
		flex-shrink: 0;
		color: var(--color-texto, #333);
		background: var(--bg, #fff);
		border: 2px solid var(--icono-color-borde, #ccc);
	}

	.tab-subcategoria:hover {
		background: var(--fondo-botones-hover, #8e8e8e);
		transform: translateY(-1px);
	}

	.tab-subcategoria.activa {
		border-width: 3px;
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, #000);
	}

	.tab-subcategoria:focus {
		outline: 2px solid var(--fondo-botones-hover, #000);
		outline-offset: 2px;
	}

	.icono-sub {
		font-size: 0.9rem;
	}

	.texto-sub {
		font-weight: 600;
		text-align: center;
		white-space: nowrap;
	}

	/* Grid de stickers */
	.grid-stickers {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
		padding: 0.5rem;
		width: 100%;
		box-sizing: border-box;
	}

	.boton-sticker {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		padding: 0.5rem;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 95px;
		height: auto;
		width: 100%;
		color: var(--color-texto, #333);
		background: var(--bg, #fff);
		border: 2px solid var(--icono-color-borde, #ccc);
	}

	.boton-sticker:hover {
		background: var(--fondo-botones-hover, #8b8b8b);
		transform: translateY(-1px);
	}

	.boton-sticker.seleccionado {
		border-width: 3px;
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, #000);
	}

	.boton-sticker:focus {
		outline: 2px solid var(--fondo-botones-hover, #000);
		outline-offset: 2px;
	}

	.emoji-sticker {
		font-size: calc(var(--font-size-base, 1rem) * 2.5);
		line-height: 1;
		flex-shrink: 0;
	}

	.nombre-sticker {
		font-size: calc(var(--font-size-base, 1rem) * 0.9);
		text-align: center;
		font-weight: 600;
		line-height: 1;
		max-width: 100%;
		word-wrap: break-word;
		overflow-wrap: break-word;
		hyphens: auto;
		flex-shrink: 0;
	}

	/* ====== Estilos para Zoom ====== */
	
	.opcion-zoom {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
		font-size: calc(var(--font-size-base, 1rem) * 1.2);
	}

	.botones-zoom {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.boton-zoom {
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
		font-size: calc(var(--font-size-base, 1rem) * 0.9);
		color: var(--color-texto, #333);
	}

	.boton-zoom:hover {
		background: var(--fondo-botones-hover, #e0e0e0);
		transform: translateY(-1px);
	}

	.boton-zoom.seleccionado {
		border-color: var(--color-primario, #000000);
		border-width: 3px;
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, #000);
	}

	.boton-zoom:focus {
		outline: 2px solid var(--fondo-botones-hover, #000);
		outline-offset: 2px;
	}

	.icono-zoom {
		font-size: 1.5rem;
		line-height: 1;
	}

</style>