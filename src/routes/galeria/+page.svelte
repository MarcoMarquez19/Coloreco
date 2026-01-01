<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { configuraciones } from '$lib/stores/settings';
	import { audioStore, clickSound } from '$lib/stores/audio';
	import { obtenerSesionActual } from '$lib/db/artistas.service';
	import { obtenerObras, eliminarObra, liberarURLsImagenes, type ObraCompleta } from '$lib/db/obras.service';
	import Modal from '$lib/components/modales/Modal.svelte';

	// ============================================================================
	// ESTADO REACTIVO (Svelte 5 Runes)
	// ============================================================================
	
	/** Lista completa de obras del artista */
	let obras = $state<ObraCompleta[]>([]);
	
	/** Índice de la obra actualmente visible (0-based) */
	let indiceActual = $state<number>(0);
	
	/** Estado de carga */
	let cargando = $state<boolean>(true);
	
	/** Mensaje de error si falla la carga */
	let mensajeError = $state<string>('');

	/** Control del modal de confirmación de eliminación */
	let modalEliminarAbierto = $state<boolean>(false);

	/** Control del modal de eliminación exitosa */
	let modalEliminadoExitoso = $state<boolean>(false);

	/** Referencia al contenedor para aplicar transform/scale dinámico */
	let contenedorGaleriaRef: HTMLElement | null = null;

	/** Calcula y aplica la escala según la altura de la ventana (máx 1080px) */
	function actualizarEscala(): void {
		if (!contenedorGaleriaRef) return;
		const maxHeight = 1080; // referencia 1080p
		const rawScale = window.innerHeight / maxHeight;
		// limitar entre 0.6 y 1 para evitar escalados excesivos
		const scale = Math.max(0.6, Math.min(1, rawScale));
		contenedorGaleriaRef.style.transform = `scale(${scale})`;
		contenedorGaleriaRef.style.transformOrigin = 'top center';
		// Cuando escalamos hacia abajo, mantener centrado horizontalmente
		contenedorGaleriaRef.style.margin = '0 auto';
	}

	// ============================================================================
	// DERIVADOS REACTIVOS
	// ============================================================================
	
	/** Obra actualmente mostrada */
	const obraActual = $derived<ObraCompleta | null>(
		obras.length > 0 ? obras[indiceActual] : null
	);
	
	/** Total de obras en la galería */
	const totalObras = $derived<number>(obras.length);
	
	/** Si hay obras para mostrar */
	const hayObras = $derived<boolean>(obras.length > 0);
	
	/** Si puede navegar a la obra anterior */
	const puedeRetroceder = $derived<boolean>(indiceActual > 0);
	
	/** Si puede navegar a la obra siguiente */
	const puedeAvanzar = $derived<boolean>(indiceActual < obras.length - 1);

	// ============================================================================
	// FUNCIONES DE NAVEGACIÓN
	// ============================================================================
	
	/**
	 * Navega a la obra anterior en el carrusel
	 */
	function irAnterior(): void {
		if (puedeRetroceder) {
			indiceActual--;
		}
	}

	/**
	 * Navega a la obra siguiente en el carrusel
	 */
	function irSiguiente(): void {
		if (puedeAvanzar) {
			indiceActual++;
		}
	}

	/**
	 * Abre el modal de confirmación para eliminar
	 */
	function abrirModalEliminar(): void {
		if (!obraActual) return;
		modalEliminarAbierto = true;
	}

	/**
	 * Maneja la eliminación de una obra después de confirmar
	 */
	async function confirmarEliminar(): Promise<void> {
		if (!obraActual) return;
		
		modalEliminarAbierto = false;
		
		try {
			const exito = await eliminarObra(obraActual.id);
			
			if (exito) {
				// Liberar URL de la imagen eliminada
				if (obraActual.urlImagen) {
					URL.revokeObjectURL(obraActual.urlImagen);
				}
				
				// Remover de la lista
				obras = obras.filter(o => o.id !== obraActual.id);
				
				// Ajustar índice si es necesario
				if (indiceActual >= obras.length && obras.length > 0) {
					indiceActual = obras.length - 1;
				} else if (obras.length === 0) {
					indiceActual = 0;
				}

				// Mostrar modal de éxito
				modalEliminadoExitoso = true;
			} else {
				alert('Error al eliminar la obra. Inténtalo nuevamente.');
			}
		} catch (error) {
			console.error('[Galería] Error eliminando obra:', error);
			alert('Error inesperado al eliminar la obra.');
		}
	}

	/**
	 * Descarga la obra actual al dispositivo
	 */
	function descargarObra(): void {
		if (!obraActual || !obraActual.urlImagen) return;
		
		// Crear enlace temporal para descarga
		const enlace = document.createElement('a');
		enlace.href = obraActual.urlImagen;
		enlace.download = `${obraActual.titulo.replace(/\s+/g, '_')}.png`;
		enlace.click();
	}

	/**
	 * Redirige a la vista de edición (placeholder por ahora)
	 */
	function editarObra(): void {
		if (!obraActual) return;
		
		console.log('[Galería] Editar obra:', obraActual.id);
		// TODO: Implementar navegación a la vista de edición
		alert(`Función de edición próximamente.\nObra: ${obraActual.titulo}`);
	}

	/**
	 * Formatea una fecha para mostrar de forma legible
	 */
	function formatearFecha(fecha: Date): string {
		return new Intl.DateTimeFormat('es-ES', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		}).format(fecha);
	}

	/**
	 * Traduce el código de modo a nombre legible
	 */
	function nombreModo(modo: string): string {
		const modos: Record<string, string> = {
			dibujo: 'Dibujo Libre',
			cuerpoHumano: 'Cuerpo Humano',
			historias: 'Historias'
		};
		return modos[modo] || modo;
	}

	// ============================================================================
	// EFECTO DE CARGA INICIAL
	// ============================================================================
	
	$effect(() => {
		// Cargar obras al montar el componente
		(async () => {
			try {
				cargando = true;
				mensajeError = '';
				
				// Obtener artista actual
				const sesion = await obtenerSesionActual();
				
				if (!sesion?.artistaActualId) {
					mensajeError = 'No hay un artista seleccionado';
					cargando = false;
					return;
				}
				
				// Cargar obras del artista
				const obrasRecuperadas = await obtenerObras(sesion.artistaActualId);
				obras = obrasRecuperadas;
				
				if (obras.length === 0) {
					mensajeError = 'Aún no tienes obras guardadas. ¡Crea tu primer dibujo!';
				}
				
				cargando = false;
			} catch (error) {
				console.error('[Galería] Error cargando obras:', error);
				mensajeError = 'Error al cargar la galería';
				cargando = false;
			}
		})();
		
		// Ajuste de escala según tamaño de ventana y listener para resize
		actualizarEscala();
		window.addEventListener('resize', actualizarEscala);

		// Listener para navegación con teclado
		const manejarTeclado = (e: KeyboardEvent) => {
			if (e.key === 'ArrowLeft') {
				irAnterior();
			} else if (e.key === 'ArrowRight') {
				irSiguiente();
			}
		};

		window.addEventListener('keydown', manejarTeclado);
		
		// Limpiar URLs y listeners al desmontar
		return () => {
			if (obras.length > 0) {
				liberarURLsImagenes(obras);
			}
			window.removeEventListener('keydown', manejarTeclado);
			window.removeEventListener('resize', actualizarEscala);
			// restaurar transform si existe
			if (contenedorGaleriaRef) {
				contenedorGaleriaRef.style.transform = '';
				contenedorGaleriaRef.style.transformOrigin = '';
				contenedorGaleriaRef.style.margin = '';
			}
		};
	});
</script>

<div class="contenedor-galeria" data-magnificable bind:this={contenedorGaleriaRef}>
	<div class="contenedor-centrado">
		<!-- Encabezado -->
		<header class="encabezado">
			<h1 class="titulo">Mi galería</h1>
			{#if hayObras}
				<p class="contador">
					Obra {indiceActual + 1} de {totalObras}
				</p>
			{/if}
		</header>

		<!-- Contenido principal -->
		<main class="contenido-principal">
		{#if cargando}
			<!-- Estado de carga -->
			<div class="estado-mensaje">
				<p>Cargando galería...</p>
			</div>
		{:else if mensajeError}
			<!-- Mensaje de error o sin obras -->
			<div class="estado-mensaje">
				<p>{mensajeError}</p>
			</div>
		{:else if obraActual}
		<!-- Botonera de acciones -->
			<section class="acciones" aria-label="Acciones de la obra">
				<!-- Botón Editar (Amarillo) -->
				<button
					class="boton boton-editar pattern-yellow"
					onclick={editarObra}
					aria-label="Editar obra actual"
					use:clickSound
				>
					<span class="icono">✏️</span> Editar
				</button>

				<!-- Botón Descargar (Verde) -->
				<button
					class="boton boton-descargar pattern-green"
					onclick={descargarObra}
					aria-label="Descargar imagen de la obra"
					use:clickSound
				>
					<span class="icono">💾</span> Descargar
				</button>

				<!-- Botón Eliminar (Rojo) -->
				<button
					class="boton boton-eliminar pattern-red"
					onclick={abrirModalEliminar}
					aria-label="Eliminar obra de la galería"
					use:clickSound
				>
					<span class="icono">🗑️</span> Eliminar
				</button>
			</section>

			<!-- Carrusel de obras -->
			<div class="carrusel">
				<!-- Flecha anterior -->
				<button
					class="flecha flecha-anterior pattern-yellow"
					onclick={irAnterior}
					disabled={!puedeRetroceder}
					aria-label="Ver obra anterior"
					use:clickSound
					title="Navegar a la obra anterior (← tecla izquierda)"

				>
					<svg 
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
						focusable="false"
						width="62"
						height="62"
					>
						<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
					</svg>
				</button>

				<!-- Marco central con la imagen -->
				<div class="marco-obra">
					<img
						src={obraActual.urlImagen}
						alt={obraActual.alt || `Obra titulada ${obraActual.titulo}`}
						class="imagen-obra"
					/>
				</div>

				<!-- Flecha siguiente -->
				<button
					class="flecha flecha-siguiente pattern-yellow"
					onclick={irSiguiente}
					disabled={!puedeAvanzar}
					aria-label="Ver obra siguiente"
					use:clickSound
					title="Navegar a la obra siguiente (→ tecla derecha)"
				>
					<svg 
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
						focusable="false"
						width="62"
						height="62"
					>
						<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
					</svg>
				</button>
			</div>

			<!-- Metadatos de la obra -->
			<section class="metadatos">
				<h2 class="titulo-obra">{obraActual.titulo}</h2>
				
				<div class="info-obra">
					<p class="dato">
						<strong>Fecha:</strong> {formatearFecha(obraActual.fechaCreacion)}
					</p>
					<p class="dato">
						<strong>Modo de juego:</strong> {nombreModo(obraActual.modo)}
					</p>
					{#if obraActual.descripcion}
						<p class="dato">
							<strong>Descripción:</strong> {obraActual.descripcion}
						</p>
					{/if}
				</div>
			</section>
		{/if}
	</main>
	</div>
</div>

<!-- Modal de confirmación de eliminación -->
<Modal
	bind:abierto={modalEliminarAbierto}
	titulo="Confirmar eliminación"
	anchoMaximo="600px"
	cerrarAlClickearFuera={false}
>
	{#snippet children()}
		<div style="text-align: center; padding: calc(var(--spacing-base, 1rem) * 1) 0;">
			<div style="font-size: calc(var(--font-size-base, 1rem) * 5); margin-bottom: calc(var(--spacing-base, 1rem) * 1); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));">🗑️</div>
			<p style="margin: 0 0 calc(var(--spacing-base, 1rem) * 1) 0; font-size: calc(var(--font-size-base, 1rem) * 1.1); line-height: 1.5; color: var(--fg);">
				¿Estás seguro que deseas eliminar la obra <strong>"{obraActual?.titulo}"</strong>?
			</p>
			<p style="margin: 0; color: #d32f2f; font-weight: 600; font-size: calc(var(--font-size-base, 1rem) * 1);">
				⚠️ Esta acción no se puede deshacer.
			</p>
		</div>
	{/snippet}

	{#snippet acciones()}
		<button
			class="modal-boton modal-boton-cancelar"
			onclick={() => modalEliminarAbierto = false}
			type="button"
		>
			Cancelar
		</button>
		<button
			class="modal-boton modal-boton-confirmar pattern-red"
			onclick={confirmarEliminar}
			type="button"
		>
			Eliminar
		</button>
	{/snippet}
</Modal>

<!-- Modal de eliminación exitosa -->
<Modal
	bind:abierto={modalEliminadoExitoso}
	titulo="¡Obra eliminada!"
	anchoMaximo="450px"
>
	{#snippet children()}
		<div style="text-align: center; padding: calc(var(--spacing-base, 1rem) * 1.5) 0;">
			<div style="font-size: calc(var(--font-size-base, 1rem) * 4); margin-bottom: calc(var(--spacing-base, 1rem) * 1); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));">✅</div>
			<p style="font-size: calc(var(--font-size-base, 1rem) * 1.1); margin-bottom: calc(var(--spacing-base, 1rem) * 0.5); font-weight: 600; color: var(--fg);">
				¡La obra ha sido eliminada exitosamente!
			</p>
			<p style="color: var(--text-secondary, #666); font-size: calc(var(--font-size-base, 1rem) * 0.9);">
				La obra ha sido removida de tu galería.
			</p>
		</div>
	{/snippet}

	{#snippet acciones()}
		<button
			class="modal-boton modal-boton-aceptar"
			onclick={() => modalEliminadoExitoso = false}
			type="button"
			style="background: #4caf50;"
		>
			Aceptar
		</button>
	{/snippet}
</Modal>

<style>
	/* ============================================================================
	   VARIABLES CSS DINÁMICAS (Desde el store de configuración)
	   ============================================================================ */
	.contenedor-galeria {
		/* Aplicar configuraciones de accesibilidad */
		--espaciado: calc(var(--spacing-base, 1rem) * 1.2);
		--radio-borde: var(--border-radius, 8px);
	}

	/* ============================================================================
	   ESTRUCTURA PRINCIPAL
	   ============================================================================ */
	.contenedor-galeria {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: calc(var(--espaciado) * 2) calc(var(--espaciado) * 2);
		max-width: 1400px;
		margin: 0 auto;
		box-sizing: border-box;
	}

	.contenedor-centrado {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		max-width: 100%;
	}

	.encabezado {
		text-align: center;
		margin-bottom: calc(var(--espaciado) * 2);
		flex-shrink: 0;
	}

	.titulo {
		font-size: calc(var(--font-size-base, 1rem) * 2.5);
		font-weight: 700;
		color: var(--fg, #111);
		margin: 0;
		margin-bottom: calc(var(--espaciado) * 0.4);
	}

	.contador {
		font-size: calc(var(--font-size-base, 1rem) * 1.5);
		font-weight: 600;
		color: var(--fg, #333);
		margin: 0;
		letter-spacing: 0.05em;
	}

	.contenido-principal {
		display: flex;
		flex-direction: column;
		gap: calc(var(--espaciado) * 2);
		width: 100%;
		flex: 1;
		min-height: 0;
		justify-content: center;
	}

	/* ============================================================================
	   ESTADOS DE CARGA Y ERROR
	   ============================================================================ */
	.estado-mensaje {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		font-size: calc(var(--font-size-base, 1rem) * 1.3);
		color: var(--fg, #333);
		text-align: center;
	}

	/* ============================================================================
	   CARRUSEL DE OBRAS
	   ============================================================================ */
	.carrusel {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: calc(var(--font-size-base, 1rem) * 5.5);
		margin-bottom: 0;
		flex-shrink: 0;
		min-height: 80px;
	}

	.flecha {
		/* Flechas con estilo similar a taller-escenas */
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		border: none;
		border-radius: var(--border-radius, 8px);
		cursor: pointer;
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
		transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 80px;
		min-height: 80px;
	}

	.flecha:hover:not(:disabled) {
		background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
	}

	.flecha:active:not(:disabled) {
		transform: translateY(0);
	}

	.flecha:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #d1a700);
		outline-offset: 7px;
	}

	.flecha svg {
		width: calc(var(--font-size-base,1rem)*6);
		height: calc(var(--font-size-base,1rem)*6);
		pointer-events: none;
	}

	.flecha:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		background: var(--fondo-botones, #ffca00);
	}

	.marco-obra {
		/* Marco central para la imagen con estilo de tarjeta */
		flex: 0 0 auto;
		width: 750px;
		height: 450px;
		background: white;
		border-radius: var(--border-radius, 8px);
		padding: calc(var(--espaciado) * 1);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.3s, box-shadow 0.3s;
	}

	.marco-obra:hover {
		transform: translateY(-4px);
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
	}

	.imagen-obra {
		max-width: 100%;
		max-height: 100%;
		display: block;
		border-radius: var(--border-radius, 8px);
		object-fit: contain;
	}

	/* ============================================================================
	   METADATOS
	   ============================================================================ */
	.metadatos {
		text-align: center;
		padding: calc(var(--espaciado) * 1.5);
		background: var(--bg, white);
		border-radius: var(--border-radius, 8px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		flex-shrink: 0;
	}

	.titulo-obra {
		font-size: calc(var(--font-size-base, 1rem) * 1.5);
		font-weight: 600;
		margin: 0;
		margin-bottom: calc(var(--espaciado) * 0.5);
		color: var(--fg, #333);
		letter-spacing: 0.05em;
	}

	.info-obra {
		display: flex;
		flex-direction: column;
		gap: calc(var(--espaciado) * 0.3);
	}

	.dato {
		font-size: calc(var(--font-size-base, 1rem) * 1);
		margin: 0;
		color: var(--text-secondary, #666);
	}

	.dato strong {
		color: var(--fg, #111);
		font-weight: 700;
	}

	/* ============================================================================
	   BOTONERA DE ACCIONES
	   ============================================================================ */
	.acciones {
		display: flex;
		gap: calc(var(--espaciado) * 1);
		justify-content: center;
		flex-wrap: wrap;
		padding: 0;
		flex-shrink: 0;
	}

	.boton {
		/* Botones con estilo similar a taller-escenas */
		padding: calc(var(--spacing-base,2rem) * 1.5) calc(var(--spacing-base,2rem) * 2);
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		border: none;
		font-size: calc(var(--font-size-base, 1rem) * 1.4);
		font-weight: 600;
		letter-spacing: 0.05em;
		border-radius: var(--border-radius, 8px);
		cursor: pointer;
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
		text-align: center;
		transition: transform 120ms ease, box-shadow 120ms ease;
		min-width: 180px;
	}

	/* Focus para botón editar (amarillo - por defecto) */
	.boton:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: var(--fondo-botones-hover, #d1a700);
		outline-offset: 7px;
	}

	.boton:hover {
		background: var(--fondo-botones-hover, #d1a700);
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
	}

	.boton:active {
		transform: translateY(0);
	}

	/* Botón Descargar (Verde) */
	.boton-descargar {
		background: #4caf50;
		border-color: #388e3c;
		color: white;
	}

	.boton-descargar:hover {
		background: #388e3c;
	}

	.boton-descargar:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: #388e3c;
		outline-offset: 7px;
	}

	/* Botón Eliminar (Rojo) */
	.boton-eliminar {
		background: #f44336;
		border-color: #d32f2f;
		color: white;
	}

	.boton-eliminar:hover {
		background: #d32f2f;
	}

	.boton-eliminar:focus {
		outline: var(--borde-botones, 4px solid #000000);
		background: #d32f2f;
		outline-offset: 7px;
	}

	/* ============================================================================
	   BOTONES DEL MODAL
	   ============================================================================ */
	:global(.modal-boton) {
		padding: calc(var(--spacing-base, 1rem) * 1) calc(var(--spacing-base, 1rem) * 1.5);
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
		font-weight: 600;
		border: none;
		border-radius: calc(var(--border-radius, 8px) * 0.5);
		cursor: pointer;
		transition: transform 120ms ease, background 120ms ease;
		min-width: 100px;
	}

	:global(.modal-boton-cancelar) {
		background: #757575;
		color: white;
	}

	:global(.modal-boton-cancelar:hover) {
		background: #616161;
		transform: translateY(-2px);
	}

	:global(.modal-boton-cancelar:focus) {
		outline: 2px solid #000000;
		background: #616161;
		outline-offset: 2px;
	}

	:global(.modal-boton-confirmar) {
		background: #f44336;
		color: white;
	}

	:global(.modal-boton-confirmar:hover) {
		background: #d32f2f;
		transform: translateY(-2px);
	}

	:global(.modal-boton-confirmar:focus) {
		outline: 2px solid #000000;
		background: #d32f2f;
		outline-offset: 2px;
	}

	:global(.modal-boton-aceptar) {
		background: #4caf50;
		color: white;
	}

	:global(.modal-boton-aceptar:hover) {
		background: #388e3c;
		transform: translateY(-2px);
	}

	:global(.modal-boton-aceptar:focus) {
		outline: 2px solid #000000;
		background: #388e3c;
		outline-offset: 2px;
	}	
</style>