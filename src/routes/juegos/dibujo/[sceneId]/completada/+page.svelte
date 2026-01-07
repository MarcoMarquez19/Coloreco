<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { obtenerArtistaActivo } from '$lib/db/artistas.service';
	import { obtenerLogrosPorEscenaId } from '$lib/db/logros.service';
	import { buscarPorEscenaId } from '$lib/db/escenas.service';
	import type { EscenaCatalogo } from '$lib/db/schemas';
	import type { LogroConEstado } from '$lib/stores/logros';
	import ConfetiImagen from '$lib/components/iconos/Confeti.png';
	import { audioStore, clickSound } from '$lib/stores/audio';

	let escena: EscenaCatalogo | null = $state<EscenaCatalogo | null>(null);
	let logros: LogroConEstado[] = $state<LogroConEstado[]>([]);
	let cargando = $state<boolean>(true);
	let error = $state<string | null>(null);

	// Estadísticas de logros
	let artistaId = $state<number | null>(null);
	let retosCompletados = $state<number>(0);
	let totalRetos = $state<number>(0);
	
	// Miniatura del canvas
	let miniaturaCanvas = $state<string | null>(null);

	onMount(async () => {
		audioStore.playSound('finished');
		
		try {
			const sceneId = $page.params.sceneId || 'default';
			
			// Cargar miniatura desde sessionStorage
			if (typeof window !== 'undefined') {
				const datosGuardados = sessionStorage.getItem('dibujo_ultimaActividad');
				if (datosGuardados) {
					try {
						const datos = JSON.parse(datosGuardados);
						miniaturaCanvas = datos.miniatura || null;
						// Limpiar sessionStorage
						sessionStorage.removeItem('dibujo_ultimaActividad');
					} catch (e) {
						console.error('Error parseando datos de actividad:', e);
					}
				}
			}
			
			// Cargar información de la escena desde la base de datos
			const resultados = await buscarPorEscenaId(sceneId);
			if (!resultados || resultados.length === 0) {
				throw new Error('Escena no encontrada');
			}
			escena = resultados[0];

			// Obtener artista activo
			const artista = await obtenerArtistaActivo();
			artistaId = artista?.id ?? null;

			// Cargar logros de la escena
			if (artistaId && sceneId) {
				// Obtener todas las definiciones de logros de la escena
				const definiciones = await obtenerLogrosPorEscenaId(sceneId);
				totalRetos = definiciones.length;
				
				// Importar el servicio de logros para obtener el estado
				const { obtenerLogrosArtista } = await import('$lib/db/logros.service');
				const logrosConEstado = await obtenerLogrosArtista(artistaId);
				
				// Combinar definiciones con su estado
				logros = definiciones.map(definicion => {
					const logroConEstado = logrosConEstado.find(l => l.definicion.id === definicion.id);
					const estado = logroConEstado?.estado;
					return {
						definicion,
						estado: estado ?? null,
						desbloqueado: estado?.desbloqueado ?? false,
						progreso: estado?.progresoParcial ?? 0
					};
				});
				
				// Contar retos completados (logros desbloqueados)
				retosCompletados = logros.filter(l => l.desbloqueado).length;
				
				console.log(`[CompletadaDibujo] ${retosCompletados}/${totalRetos} retos completados`);
			} else {
				// Si no hay artista, solo mostrar las definiciones sin estado
				const definiciones = await obtenerLogrosPorEscenaId(sceneId);
				totalRetos = definiciones.length;
				logros = definiciones.map(definicion => ({
					definicion,
					estado: null,
					desbloqueado: false,
					progreso: 0
				}));
				retosCompletados = 0;
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

	function volverAlMenu() {
		goto('/menu-juegos');
	}

	function irAGaleria() {
		goto('/galeria');
	}

	function verLogros() {
		goto('/logros/escenas');
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
	{:else if escena}
		
		<!-- Confeti de celebración -->
		<div class="confeti-contenedor" data-magnificable>
			<div class="confeti-wrapper" data-magnificable>
				<img src={ConfetiImagen} alt="Confeti de celebración" class="confeti-imagen" data-magnificable />
			</div>
		</div>

		<!-- Contenido principal -->
		<div class="marco-externo pattern-black" data-magnificable>
			<div class="mensaje-contenedor" data-magnificable>
				<!-- Título principal -->
				<h1 data-magnificable data-readable>
					¡Actividad Completada!
				</h1>

				<!-- Información de la escena -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<p class="plantilla-nombre" data-magnificable data-readable tabindex="0">
					<strong>Escena:</strong> {escena.nombre}
				</p>
				<!-- Botones de acción (abajo en todo el ancho) -->
				<div class="botones-contenedor" data-magnificable>
					<button class="boton-accion boton-menu pattern-yellow" onclick={volverAlMenu} use:clickSound data-magnificable data-readable>
						Regresar al menú
					</button>
					<button class="boton-accion boton-galeria pattern-yellow" onclick={irAGaleria} use:clickSound data-magnificable data-readable>
						Ir a la galería
					</button>
					<button class="boton-accion boton-logros pattern-yellow" onclick={verLogros} use:clickSound data-magnificable data-readable>
						Ver logros
					</button>
				</div>
				<!-- Contenido en dos columnas -->
				<div class="contenido-dos-columnas" data-magnificable>
					<!-- Columna izquierda: Miniatura -->
					<div class="columna-izquierda" data-magnificable>
						{#if miniaturaCanvas}
							<div class="contenedor-miniatura" data-magnificable>
								<img 
									src={miniaturaCanvas} 
									alt="Miniatura de tu obra" 
								class="miniatura-canvas pattern-black"
									data-magnificable
								/>
								<p class="label-miniatura" data-readable>Tu obra</p>
							</div>
						{:else}
							<div class="contenedor-miniatura-vacio" data-magnificable>
								<div class="icono-canvas-vacio" aria-hidden="true">🎨</div>
								<p class="texto-sin-miniatura" data-readable>Sin miniatura disponible</p>
							</div>
						{/if}
					</div>

					<!-- Columna derecha: Estadísticas de retos -->
					<div class="columna-derecha" data-magnificable>
						<!-- Estadísticas de retos -->
                        <!-- Mensaje especial si completó todos los retos -->
						{#if retosCompletados === totalRetos && totalRetos > 0}
							<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
							<p class="mensaje-perfecto pattern-yellow" data-magnificable data-readable tabindex="0">
								🏆 ¡Completaste todos los retos de esta escena!
							</p>
						{/if}
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<div class="estadisticas pattern-black" data-magnificable data-readable tabindex="0">
							<div class="stat-item" data-readable>
							<div class="stat-numero" data-readable>{retosCompletados}</div>
								<div class="stat-label" data-readable>Retos completados</div>
							</div>
							<div class="stat-divider" aria-hidden="true">/</div>
							<div class="stat-item" data-readable>
								<div class="stat-numero" data-readable>{totalRetos}</div>
								<div class="stat-label" data-readable>Total de retos</div>
							</div>
						</div>
					</div>
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
		max-width: 1200px;
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
		color: var(--color-texto, #333);
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
		color: var(--color-texto, #333);
	}

	.plantilla-nombre strong {
		color: var(--color-texto, #333);
		font-weight: 700;
	}

	/* Layout de dos columnas */
	.contenido-dos-columnas {
		display: flex;
		gap: calc(var(--spacing-base, 1rem) * 3);
		width: 100%;
		margin: calc(var(--spacing-base, 1rem) * 2) 0;
		align-items: flex-start;
	}

	.columna-izquierda {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.columna-derecha {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-base, 1rem) * 1.5);
	}

	/* Estilos para la miniatura */
	.contenedor-miniatura {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--spacing-base, 1rem) * 1);
		width: 100%;
	}

	.miniatura-canvas {
		max-width: 100%;
		height: 45vh;
		border: 3px solid var(--icono-color-borde, #000);
		border-radius: var(--border-radius, 8px);
		box-shadow: var(--sombra-botones, 0 4px 12px rgba(0, 0, 0, 0.2));
		background: white;
	}

	.label-miniatura {
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
		font-weight: 600;
		color: var(--color-texto, #333);
		margin: 0;
	}

	.contenedor-miniatura-vacio {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: calc(var(--spacing-base, 1rem) * 1);
		padding: calc(var(--spacing-base, 1rem) * 3);
		border: 2px dashed var(--border, #ccc);
		border-radius: var(--border-radius, 8px);
		background: var(--surface, #f9f9f9);
		width: 100%;
		min-height: 200px;
	}

	.icono-canvas-vacio {
		font-size: calc(var(--font-size-base, 1rem) * 4);
		opacity: 0.5;
	}

	.texto-sin-miniatura {
		font-size: calc(var(--font-size-base, 1rem) * 1);
		color: var(--text-secondary, #999);
		font-style: italic;
		margin: 0;
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
		color: var(--color-texto, #333);
		line-height: 1;
	}

	.stat-label {
		font-size: calc(var(--font-size-base, 1rem) * 1);
		color: var(--color-texto, #333);
		font-weight: 600;
	}

	.stat-divider {
		font-size: calc(var(--font-size-base, 1rem) * 3);
		font-weight: 300;
		color: var(--color-texto, #333);
	}

	.mensaje-perfecto {
		font-size: calc(var(--font-size-base, 1rem) * 1.2);
		margin: calc(var(--spacing-base, 1rem) * 1) 0;
		padding: calc(var(--spacing-base, 1rem) * 1.2);
		background: linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%);
		border: 3px solid #ffd700;
		border-radius: var(--border-radius, 8px);
		color: #333 !important;
		font-weight: 700;
		box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
		word-wrap: break-word;
		overflow-wrap: break-word;
		white-space: normal;
		width: 100%;
		box-sizing: border-box;
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
        background: var(--fondo-botones-hover, #d1a700);
	}

	.boton-accion:active {
		transform: translateY(-2px);
	}

	.boton-accion:focus {
        background: var(--fondo-botones-hover, #d1a700);
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

	/* Responsive */
	@media (max-width: 768px) {
		h1 {
			font-size: calc(var(--font-size-base, 1rem) * 2);
		}

		.confeti-wrapper {
			width: calc(var(--font-size-base, 1rem) * 8);
			height: calc(var(--font-size-base, 1rem) * 8);
		}

		/* Apilar columnas en móviles */
		.contenido-dos-columnas {
			flex-direction: column;
			gap: calc(var(--spacing-base, 1rem) * 2);
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
