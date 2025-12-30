<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { obtenerArtistaActivo } from '$lib/db/artistas.service';
	import * as logrosService from '$lib/db/logros.service';
	import * as progresoService from '$lib/db/progreso.service';
	import { obtenerConfiguracionEscena } from '$lib/juegos/modos/cuerpo-humano/configuraciones-escenas';
	import type { EscenaConfig } from '$lib/juegos/modos/cuerpo-humano/types/cuerpo-humano.types';
	import ConfetiImagen from '$lib/components/iconos/Confeti.png';

	let escenaConfig = $state<EscenaConfig | null>(null);
	let cargando = $state<boolean>(true);
	let error = $state<string | null>(null);

	// Estadísticas de la actividad
	let partesCorrectas = $state<number>(0);
	let totalPartes = $state<number>(0);
	let tienePerfecto = $state<boolean>(false);

	// Estadísticas de logros
	let artistaId = $state<number | null>(null);
	let cargandoLogros = $state<boolean>(true);
	let totalLogros = $state<number>(0);
	let logrosDesbloqueados = $state<number>(0);
	let rangoActual = $state<'bronce' | 'plata' | 'oro' | null>(null);
	let siguienteRango = $state<string>('');
	let logrosFaltantes = $state<number>(0);
	let porcentajeProgreso = $state<number>(0);

	// Definir umbrales de rangos
	const RANGOS = {
		bronce: { min: 1, max: 3, nombre: 'Bronce', siguiente: 'Plata', logrosNecesarios: 4 },
		plata: { min: 4, max: 7, nombre: 'Plata', siguiente: 'Oro', logrosNecesarios: 8 },
		oro: { min: 8, max: Infinity, nombre: 'Oro', siguiente: null, logrosNecesarios: null }
	};

	onMount(async () => {
		try {
			const sceneId = $page.params.sceneId || 'default';
			
			// Cargar configuración de la escena
			const config = obtenerConfiguracionEscena(sceneId);
			if (!config) {
				throw new Error('Escena no encontrada');
			}
			escenaConfig = config;

			// Obtener artista activo
			const artista = await obtenerArtistaActivo();
			artistaId = artista?.id ?? null;

		// Cargar estadísticas desde sessionStorage
		totalPartes = config.partes.length;
		if (typeof window !== 'undefined') {
			const datosGuardados = sessionStorage.getItem('cuerpoHumano_ultimaActividad');
			if (datosGuardados) {
				try {
					const datos = JSON.parse(datosGuardados);
					partesCorrectas = datos.partesCorrectas || 0;
					totalPartes = datos.totalPartes || totalPartes;
					tienePerfecto = datos.tienePerfecto || false;
					// Limpiar sessionStorage
					sessionStorage.removeItem('cuerpoHumano_ultimaActividad');
				} catch (e) {
					console.error('Error parseando datos de actividad:', e);
					// Usar valores por defecto
					partesCorrectas = 0;
					tienePerfecto = false;
				}
			} else {
				// Si no hay datos guardados, asumimos valores por defecto
				partesCorrectas = 0;
				tienePerfecto = false;
			}
		}

		// Cargar estadísticas de logros
		if (artistaId) {
				await cargarEstadisticasLogros();
			}

			cargando = false;
		} catch (err) {
			console.error('Error al cargar actividad completada:', err);
			error = err instanceof Error ? err.message : 'Error desconocido';
			cargando = false;
		}
	});

	onMount(() => {
		document.body.style.overflow = 'auto';
		
		// Interceptar el botón de volver del navegador
		const handlePopState = (event: PopStateEvent) => {
			event.preventDefault();
			goto('/taller-escenas');
		};
		
		window.addEventListener('popstate', handlePopState);
		
		return () => {
			document.body.style.overflow = '';
			window.removeEventListener('popstate', handlePopState);
		};
	});

	async function cargarEstadisticasLogros() {
		if (!artistaId) return;

		try {
			const stats = await logrosService.obtenerEstadisticasLogros(artistaId);
			totalLogros = stats.totalLogros;
			logrosDesbloqueados = stats.desbloqueados;
			rangoActual = stats.rango;

			// Calcular progreso hacia el siguiente rango
			calcularProgresoRango();
		} catch (error) {
			console.error('[ActividadCompletada] Error cargando logros:', error);
		} finally {
			cargandoLogros = false;
		}
	}

	function calcularProgresoRango() {
		if (logrosDesbloqueados === 0) {
			siguienteRango = 'Bronce';
			logrosFaltantes = 1;
			porcentajeProgreso = 0;
		} else if (logrosDesbloqueados >= 1 && logrosDesbloqueados <= 3) {
			// Rango Bronce (1-3 logros) → Necesita 4 para Plata
			rangoActual = 'bronce';
			siguienteRango = 'Plata';
			logrosFaltantes = 4 - logrosDesbloqueados;
			// Progreso dentro del rango bronce: de 0 a 100% cuando tiene 1-3 logros
			porcentajeProgreso = ((logrosDesbloqueados - 1) / 3) * 100;
		} else if (logrosDesbloqueados >= 4 && logrosDesbloqueados <= 7) {
			// Rango Plata (4-7 logros) → Necesita 8 para Oro
			rangoActual = 'plata';
			siguienteRango = 'Oro';
			logrosFaltantes = 8 - logrosDesbloqueados;
			// Progreso dentro del rango plata: de 0 a 100% cuando tiene 4-7 logros
			porcentajeProgreso = ((logrosDesbloqueados - 4) / 4) * 100;
		} else {
			// Rango Oro (8+ logros) → Máximo alcanzado
			rangoActual = 'oro';
			siguienteRango = '';
			logrosFaltantes = 0;
			porcentajeProgreso = 100;
		}

		porcentajeProgreso = Math.min(100, Math.max(0, porcentajeProgreso));
	}

	function obtenerColorRango(rango: 'bronce' | 'plata' | 'oro' | null): string {
		switch (rango) {
			case 'bronce': return '#cd7f32';
			case 'plata': return '#c0c0c0';
			case 'oro': return '#ffd700';
			default: return '#888';
		}
	}

	function volverAlMenu() {
		goto('/menu-juegos');
	}

	function irAGaleria() {
		goto('/galeria');
	}

	function verLogros() {
		goto('/logros/cuerpo-humano');
	}

	function manejarTecla(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			volverAlMenu();
		}
	}

	let contenedorCompletadaRef: HTMLElement | null = null;

	function actualizarEscala(): void {
		if (!contenedorCompletadaRef) return;
		const maxHeight = 1080;
		const rawScale = window.innerHeight / maxHeight;
		const scale = Math.max(0.6, Math.min(1, rawScale));
		contenedorCompletadaRef.style.transform = `scale(${scale})`;
		contenedorCompletadaRef.style.transformOrigin = 'top center';
	}

	$effect(() => {
		actualizarEscala();
		window.addEventListener('resize', actualizarEscala);
		window.addEventListener('keydown', manejarTecla);
		
		return () => {
			window.removeEventListener('resize', actualizarEscala);
			window.removeEventListener('keydown', manejarTecla);
			if (contenedorCompletadaRef) {
				contenedorCompletadaRef.style.transform = '';
				contenedorCompletadaRef.style.transformOrigin = '';
			}
		};
	});
</script>

<div class="completada-contenedor" bind:this={contenedorCompletadaRef} aria-label="Actividad completada" data-magnificable>
	{#if cargando}
		<div class="estado-carga">
			<p data-magnificable data-readable>Cargando...</p>
		</div>
	{:else if error}
		<div class="estado-error">
			<p data-magnificable data-readable>Error: {error}</p>
		</div>
	{:else if escenaConfig}
		
		<!-- Confeti de celebración -->
		<div class="confeti-contenedor" data-magnificable>
			<div class="confeti-wrapper" data-magnificable>
				<img src={ConfetiImagen} alt="Confeti de celebración" class="confeti-imagen" data-magnificable />
			</div>
		</div>

		<!-- Contenido principal -->
		<div class="marco-externo" data-magnificable>
			<div class="mensaje-contenedor" data-magnificable>
				<!-- Título principal -->
				<h1 data-magnificable data-readable>
					{#if tienePerfecto}
						¡Perfecto!
					{:else}
						¡Actividad Completada!
					{/if}
				</h1>

				<!-- Información de la plantilla -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<p class="plantilla-nombre" data-magnificable data-readable tabindex="0">
					<strong>Plantilla:</strong> {escenaConfig.nombre}
				</p>

				<!-- Estadísticas de partes -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div class="estadisticas" data-magnificable data-readable tabindex="0">
					<div class="stat-item" data-readable>
						<div class="stat-numero" style="color: #2eaf6a;" data-readable>{partesCorrectas}</div>
						<div class="stat-label" data-readable>Partes correctas</div>
					</div>
					<div class="stat-divider" aria-hidden="true">/</div>
					<div class="stat-item" data-readable>
						<div class="stat-numero" data-readable>{totalPartes}</div>
						<div class="stat-label" data-readable>Total de partes</div>
					</div>
				</div>

				<!-- Mensaje especial si es perfecto -->
				{#if tienePerfecto}
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<p class="mensaje-perfecto" data-magnificable data-readable tabindex="0">
						🏆 ¡Colocaste todas las partes correctamente sin errores!
					</p>
				{/if}

				<!-- Sección de progreso de logros -->
				{#if artistaId && !cargandoLogros}
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<div class="seccion-logros" data-magnificable data-readable tabindex="0">
						<h2 data-readable>Progreso de Logros</h2>
						
						<!-- Rango actual -->
						{#if rangoActual}
							<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
							<div class="rango-actual" style="border-color: {obtenerColorRango(rangoActual)};" data-readable tabindex="0">
								<span class="rango-icono" style="color: {obtenerColorRango(rangoActual)};" aria-hidden="true">★</span>
								<span class="rango-nombre" data-readable>Rango {rangoActual.charAt(0).toUpperCase() + rangoActual.slice(1)}</span>
							</div>
						{:else}
							<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
							<p class="sin-rango" data-readable tabindex="0">Sin rango aún</p>
						{/if}

						<!-- Barra de progreso -->
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<div class="progreso-container" data-readable tabindex="0">
							<div class="progreso-info" data-readable>
								<span data-readable>Tienes {logrosDesbloqueados} de {totalLogros} logros</span>
								{#if siguienteRango}
									<span class="siguiente-rango" data-readable>
										Faltan {logrosFaltantes} {logrosFaltantes === 1 ? 'logro' : 'logros'} para alcanzar {siguienteRango}
									</span>
								{:else}
									<span class="siguiente-rango" data-readable>
										¡Has alcanzado el rango máximo!
									</span>
								{/if}
							</div>
							<div class="barra-progreso" role="progressbar" aria-valuenow="{Math.round(porcentajeProgreso)}" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso hacia el siguiente rango">
								<div 
									class="barra-relleno" 
									style="width: {porcentajeProgreso}%; background: {obtenerColorRango(rangoActual)};"
								></div>
							</div>
						</div>
					</div>
				{:else if cargandoLogros}
					<div class="seccion-logros">
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<p class="cargando" data-readable tabindex="0">Cargando estadísticas...</p>
					</div>
				{/if}

				<!-- Botones de acción -->
				<div class="botones-contenedor" data-magnificable>
					<button class="boton-accion boton-menu" onclick={volverAlMenu} data-magnificable data-readable>
						Regresar al menú
					</button>
					<button class="boton-accion boton-galeria" onclick={irAGaleria} data-magnificable data-readable>
						Ir a la galería
					</button>
					<button class="boton-accion boton-logros" onclick={verLogros} data-magnificable data-readable>
						Ver logros
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.completada-contenedor {
		margin: 1rem auto;
		background: transparent;
		z-index: 1;
		max-width: 900px;
		width: 100%;
		text-align: center;
		align-items: center;
		justify-content: flex-start;
		display: flex;
		flex-direction: column;
		padding: 0 calc(var(--spacing-base, 1rem) * 1);
		box-sizing: border-box;
		gap: calc(var(--spacing-base, 1rem) * 1);
		min-height: auto;
		overflow-y: visible;
	}

	h1 {
		font-size: calc(var(--font-size-base, 1rem) * 2);
		margin: 0;
		margin-top: calc(var(--spacing-base, 1rem) * 0.5);
		padding: 0;
		font-weight: 700;
		color: var(--fg, #333);
	}

	h2 {
		font-size: calc(var(--font-size-base, 1rem) * 1.6);
		margin: 0 0 calc(var(--spacing-base, 1rem) * 1) 0;
		padding: 0;
		font-weight: 600;
		color: var(--fg, #333);
	}

	.marco-externo {
		background: var(--bg, white);
		border: 3px solid var(--icono-color-borde, #000000);
		border-radius: var(--border-radius, 8px);
		padding: calc(var(--spacing-base, 1rem) * 2);
		box-shadow: var(--sombra-botones, 0 4px 16px rgba(0, 0, 0, 0.15));
		margin-top: calc(var(--spacing-base, 1rem) * 0.5);
		display: inline-block;
		max-width: 1200px;
		width: 100%;
	}

	.confeti-contenedor {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: calc(var(--spacing-base, 1rem) * 1) 0;
		width: 100%;
	}

	.confeti-wrapper {
		width: calc(var(--font-size-base, 1rem) * 8);
		height: calc(var(--font-size-base, 1rem) * 8);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: confetti-bounce 1s ease-in-out infinite;
	}

	.confeti-imagen {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	@keyframes confetti-bounce {
		0%, 100% { transform: translateY(0) rotate(0deg); }
		50% { transform: translateY(-20px) rotate(10deg); }
	}

	.mensaje-contenedor {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--spacing-base, 1rem) * 1);
	}

	.plantilla-nombre {
		font-size: calc(var(--font-size-base, 1rem) * 1.3);
		margin: 0;
		color: var(--text-secondary, #555);
	}

	.plantilla-nombre strong {
		color: var(--fg, #333);
		font-weight: 700;
	}

	.estadisticas {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: calc(var(--spacing-base, 1rem) * 2);
		margin: calc(var(--spacing-base, 1rem) * 1) 0;
		padding: calc(var(--spacing-base, 1rem) * 1.5);
		background: transparent;
		border-radius: var(--border-radius, 8px);
		border: 2px solid var(--border, #e0e0e0);
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--spacing-base, 1rem) * 0.5);
	}

	.stat-numero {
		font-size: calc(var(--font-size-base, 1rem) * 3);
		font-weight: 700;
		color: var(--fg, #333);
		line-height: 1;
	}

	.stat-label {
		font-size: calc(var(--font-size-base, 1rem) * 1);
		color: var(--text-secondary, #666);
		font-weight: 600;
	}

	.stat-divider {
		font-size: calc(var(--font-size-base, 1rem) * 3);
		font-weight: 300;
		color: var(--text-secondary, #999);
	}

	.mensaje-perfecto {
		font-size: calc(var(--font-size-base, 1rem) * 1.2);
		margin: calc(var(--spacing-base, 1rem) * 1) 0;
		padding: calc(var(--spacing-base, 1rem) * 1.2);
		background: linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%);
		border: 3px solid #ffd700;
		border-radius: var(--border-radius, 8px);
		color: var(--fg, #333);
		font-weight: 700;
		box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
	}

	.seccion-logros {
		margin-top: calc(var(--spacing-base, 1rem) * 2);
		padding-top: calc(var(--spacing-base, 1rem) * 2);
		border-top: 2px solid var(--border, #e0e0e0);
		width: 100%;
	}

	.rango-actual {
		display: inline-flex;
		align-items: center;
		gap: calc(var(--spacing-base, 1rem) * 0.5);
		padding: calc(var(--spacing-base, 1rem) * 0.8) calc(var(--spacing-base, 1rem) * 2);
		background: var(--bg, #fff);
		border: 3px solid;
		border-radius: var(--border-radius, 8px);
		margin-bottom: calc(var(--spacing-base, 1rem) * 1);
		font-size: calc(var(--font-size-base, 1rem) * 1.3);
		font-weight: 700;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.rango-icono {
		font-size: calc(var(--font-size-base, 1rem) * 1.8);
	}

	.rango-nombre {
		color: var(--fg, #333);
	}

	.sin-rango {
		color: var(--text-secondary, #666);
		font-style: italic;
		margin-bottom: calc(var(--spacing-base, 1rem) * 1);
	}

	.progreso-container {
		margin: calc(var(--spacing-base, 1rem) * 1.5) 0;
		width: 100%;
	}

	.progreso-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: calc(var(--spacing-base, 1rem) * 0.75);
		font-size: calc(var(--font-size-base, 1rem) * 1);
		color: var(--fg, #555);
		font-weight: 600;
	}

	.siguiente-rango {
		color: var(--text-secondary, #666);
		font-size: calc(var(--font-size-base, 1rem) * 0.95);
	}

	.barra-progreso {
		width: 100%;
		height: calc(var(--spacing-base, 1rem) * 1.8);
		background: var(--surface-hover, #e0e0e0);
		border-radius: var(--border-radius, 8px);
		overflow: hidden;
		border: 2px solid var(--border, #ccc);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.barra-relleno {
		height: 100%;
		transition: width 0.8s ease-out;
		background: linear-gradient(90deg, currentColor 0%, currentColor 100%);
		box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3);
	}

	.botones-contenedor {
		display: flex;
		gap: calc(var(--spacing-base, 1rem) * 1.5);
		margin-top: calc(var(--spacing-base, 1rem) * 2);
		flex-wrap: wrap;
		justify-content: center;
		width: 100%;
	}

	.boton-accion {
		background: var(--fondo-botones, #ffca00);
		color: var(--icono-color-relleno, black);
		border: 3px solid var(--icono-color-borde, #000000);
		border-radius: var(--border-radius, 8px);
		padding: calc(var(--spacing-base, 1rem) * 1.2) calc(var(--spacing-base, 1rem) * 2.5);
		font-size: calc(var(--font-size-base, 1rem) * 1.2);
		font-weight: 700;
		cursor: pointer;
		box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
		transition: transform 120ms ease, box-shadow 120ms ease;
		min-width: 180px;
		flex: 1;
		max-width: 250px;
	}

	.boton-accion:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	.boton-accion:active {
		transform: translateY(-2px);
	}

	.boton-accion:focus {
		outline: var(--borde-botones, 4px solid #000000);
		outline-offset: 4px;
	}

	.boton-menu {
		background: var(--fondo-botones, #ffca00);
	}

	.boton-galeria {
		background: var(--fondo-botones, #ffca00);
	}

	.boton-logros {
		background: var(--fondo-botones, #ffca00);
	}

	.estado-carga,
	.estado-error {
		text-align: center;
		padding: calc(var(--spacing-base, 1rem) * 3);
		font-size: calc(var(--font-size-base, 1rem) * 1.25);
		color: var(--fg, #333);
	}

	.estado-error {
		color: var(--color-error, #d32f2f);
	}

	.cargando {
		color: var(--text-secondary, #666);
		font-style: italic;
	}

	/* Responsive */
	@media (max-width: 768px) {
		h1 {
			font-size: calc(var(--font-size-base, 1rem) * 2);
		}

		h2 {
			font-size: calc(var(--font-size-base, 1rem) * 1.4);
		}

		.confeti-wrapper {
			width: calc(var(--font-size-base, 1rem) * 8);
			height: calc(var(--font-size-base, 1rem) * 8);
		}

		.estadisticas {
			gap: calc(var(--spacing-base, 1rem) * 1);
			flex-wrap: wrap;
		}

		.stat-numero {
			font-size: calc(var(--font-size-base, 1rem) * 2.5);
		}

		.botones-contenedor {
			flex-direction: column;
			width: 100%;
		}

		.boton-accion {
			width: 100%;
			max-width: none;
		}

		.marco-externo {
			padding: calc(var(--spacing-base, 1rem) * 2);
		}
	}
</style>
