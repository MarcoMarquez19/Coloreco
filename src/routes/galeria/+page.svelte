<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { configuraciones } from '$lib/stores/settings';
	import { obtenerSesionActual } from '$lib/db/artistas.service';
	import { obtenerObras, eliminarObra, liberarURLsImagenes, type ObraCompleta } from '$lib/db/obras.service';

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
	 * Maneja la eliminación de una obra
	 * Muestra confirmación y actualiza la lista tras borrar
	 */
	async function manejarEliminar(): Promise<void> {
		if (!obraActual) return;
		
		const confirmar = confirm(`¿Seguro que deseas eliminar "${obraActual.titulo}"?\n\nEsta acción no se puede deshacer.`);
		
		if (!confirmar) return;
		
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
				
				alert('Obra eliminada correctamente');
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
				<!-- Botón Editar (Azul) -->
				<button
					class="boton boton-editar pattern-blue"
					onclick={editarObra}
					aria-label="Editar obra actual"
				>
					✏️ Editar
				</button>

				<!-- Botón Descargar (Verde) -->
				<button
					class="boton boton-descargar pattern-green"
					onclick={descargarObra}
					aria-label="Descargar imagen de la obra"
				>
					💾 Descargar
				</button>

				<!-- Botón Eliminar (Rojo) -->
				<button
					class="boton boton-eliminar pattern-red"
					onclick={manejarEliminar}
					aria-label="Eliminar obra de la galería"
				>
					🗑️ Eliminar
				</button>
			</section>

			<!-- Carrusel de obras -->
			<div class="carrusel">
				<!-- Flecha anterior -->
				<button
					class="flecha flecha-anterior"
					onclick={irAnterior}
					disabled={!puedeRetroceder}
					aria-label="Ver obra anterior"
				>
					<span aria-hidden="true">‹</span>
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
					class="flecha flecha-siguiente"
					onclick={irSiguiente}
					disabled={!puedeAvanzar}
					aria-label="Ver obra siguiente"
				>
					<span aria-hidden="true">›</span>
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
		font-size: calc(var(--font-size-base, 1rem) * 1.2);
		color: var(--text-secondary, #666);
		margin: 0;
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
		color: var(--text-secondary, #666);
		text-align: center;
	}

	/* ============================================================================
	   CARRUSEL DE OBRAS
	   ============================================================================ */
	.carrusel {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: calc(var(--espaciado) * 12);
		margin-bottom: 0;
		flex-shrink: 0;
		min-height: 110px;
	}

	.flecha {
		/* Flechas grandes y destacadas */
		width: 110px;
		height: 110px;
		font-size: calc(var(--font-size-base, 1rem) * 5.5);
		flex-shrink: 0;
		background: var(--fondo-botones, #f5f5f5);
		border: 3px solid var(--icono-color-borde, #ccc);
		border-radius: var(--radio-borde);
		color: var(--icono-color-relleno, #111);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		line-height: 1;
	}

	.flecha:hover:not(:disabled) {
		background: var(--fondo-botones-hover, #0b6efd);
		color: var(--icono-color-relleno, white);
		transform: scale(1.1);
	}

	.flecha:focus-visible {
		outline: 3px solid var(--fondo-botones-hover, #0b6efd);
		outline-offset: 2px;
	}

	.flecha:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.marco-obra {
		/* Marco central para la imagen */
		flex: 0 0 auto;
		max-width: 850px;
		background: var(--fondo-botones, white);
		border: 4px solid var(--icono-color-borde, #ccc);
		border-radius: var(--radio-borde);
		padding: calc(var(--espaciado) * 1);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
	}

	.imagen-obra {
		width: 100%;
		max-height: 410px;
		display: block;
		border-radius: calc(var(--radio-borde) * 0.5);
		object-fit: contain;
		max-width: 100%;
	}

	/* ============================================================================
	   METADATOS
	   ============================================================================ */
	.metadatos {
		text-align: center;
		padding: calc(var(--espaciado) * 0.6);
		background: var(--fondo-botones, #f5f5f5);
		border-radius: var(--radio-borde);
		border: 2px solid var(--icono-color-borde, #e0e0e0);
		flex-shrink: 0;
	}

	.titulo-obra {
		font-size: calc(var(--font-size-base, 1rem) * 1.5);
		font-weight: 600;
		margin: 0;
		margin-bottom: calc(var(--espaciado) * 0.5);
		color: var(--icono-color-relleno, #111);
	}

	.info-obra {
		display: flex;
		flex-direction: column;
		gap: calc(var(--espaciado) * 0.3);
	}

	.dato {
		font-size: calc(var(--font-size-base, 1rem) * 1);
		margin: 0;
		color: var(--icono-color-relleno, #666);
	}

	.dato strong {
		color: var(--icono-color-relleno, #111);
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
		/* Botones grandes y accesibles */
		padding: calc(var(--espaciado) * 0.8) calc(var(--espaciado) * 2);
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
		font-weight: 600;
		border: 3px solid;
		border-radius: var(--radio-borde);
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 140px;
		position: relative;
	}

	.boton:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
	}

	.boton:active {
		transform: translateY(0);
	}

	.boton:focus-visible {
		outline: 3px solid var(--fondo-botones-hover, #0b6efd);
		outline-offset: 2px;
	}

	/* Botón Editar (Azul) */
	.boton-editar {
		background: #2196f3;
		border-color: #1976d2;
		color: white;
	}

	.boton-editar:hover {
		background: #1976d2;
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

	/* Botón Eliminar (Rojo) */
	.boton-eliminar {
		background: #f44336;
		border-color: #d32f2f;
		color: white;
	}

	.boton-eliminar:hover {
		background: #d32f2f;
	}
</style>