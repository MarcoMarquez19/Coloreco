/**
 * Servicio de gestión de ajustes/preferencias de accesibilidad
 * Sincroniza la base de datos con el store de Svelte (settings.ts)
 * 
 * @module db/ajustes.service
 */

import { get } from 'svelte/store';
import { getDB } from './database';
import type { Ajustes, ModoVisionColor, ModoContraste } from './schemas';
import { generarUUID } from './schemas';
import { configuraciones, type ConfiguracionUI } from '../stores/settings';

// ============================================================================
// MAPEO DE CAMPOS: BD ↔ UI
// ============================================================================
/**
 * Mapeo de campos entre la base de datos y el store de UI:
 * 
 * BD (Ajustes)                  →  UI (ConfiguracionUI)
 * ─────────────────────────────────────────────────────
 * multiplicadorTamanioFuente    →  multiplicadorTamanioFuente
 * multiplicadorEspaciado        →  multiplicadorEspaciado
 * redondesBordes                →  redondesBordes
 * lupaActivada                  →  lupaActivada
 * nivelMagnificacion            →  nivelMagnificacion
 * modoNoche                     →  modoNoche
 * modoInverso                   →  modoInverso
 * modoBionico                   →  bionicMode
 * narracionActivada             →  narrationEnabled
 * velocidadTTS                  →  ttsSpeed
 * modoRima                      →  rhymeMode
 * modoPictograma                →  pictogramMode
 * modoVisionColor               →  colorBlindness
 * intensidadFiltro              →  intensity
 * texturasActivas               →  textures
 * modoContraste                 →  contrast
 * 
 * Campos solo en BD (para futuras implementaciones):
 * - volumenMusica
 * - volumenEfectos
 */

// ============================================================================
// VALORES POR DEFECTO
// ============================================================================

/**
 * Valores por defecto para los ajustes de un nuevo artista
 */
const AJUSTES_POR_DEFECTO: Omit<Ajustes, 'id' | 'artistaId' | 'actualizadoEn'> = {
	// Interfaz
	multiplicadorTamanioFuente: 1,
	multiplicadorEspaciado: 1,
	redondesBordes: 8,
	
	// Lupa
	lupaActivada: false,
	nivelMagnificacion: 2,
	
	// Tema
	modoNoche: false,
	modoInverso: false,
	
	// DISLEXIA / Lectura accesible
	modoBionico: false,
	narracionActivada: false,
	modoRima: false,
	modoPictograma: false,

	// Daltonismo
	modoVisionColor: 'none',
	intensidadFiltro: 1,
	texturasActivas: false,
	modoContraste: 'normal',
	
	// Audio
	volumenMusica: 1,
	volumenEfectos: 1,
	velocidadTTS: 1
};

// ============================================================================
// OPERACIONES CRUD
// ============================================================================

/**
 * Obtiene los ajustes de un artista
 * 
 * @param artistaId - ID del artista
 * @returns Ajustes del artista o undefined si no existen
 */
export async function obtenerAjustesPorArtista(artistaId: number): Promise<Ajustes | undefined> {
	const db = getDB();
	if (!db) return undefined;

	const ajustes = await db.ajustes
		.where('artistaId')
		.equals(artistaId)
		.first();
	
	return ajustes;
}

/**
 * Crea ajustes por defecto para un artista
 * 
 * @param artistaId - ID del artista
 * @returns Ajustes creados
 */
export async function crearAjustesPorDefecto(artistaId: number): Promise<Ajustes> {
	const db = getDB();
	if (!db) {
		throw new Error('[AjustesService] Base de datos no disponible');
	}

	const ahora = new Date();
	
	const nuevosAjustes: Ajustes = {
		id: generarUUID(),
		artistaId,
		...AJUSTES_POR_DEFECTO,
		actualizadoEn: ahora
	};

	await db.ajustes.add(nuevosAjustes);
	
	console.log(`[AjustesService] Ajustes por defecto creados para artista ${artistaId}`);
	
	return nuevosAjustes;
}

/**
 * Guarda/actualiza los ajustes en la base de datos
 * 
 * @param ajustes - Ajustes a guardar
 */
export async function guardarAjustes(ajustes: Ajustes): Promise<void> {
	const db = getDB();
	if (!db) {
		throw new Error('[AjustesService] Base de datos no disponible');
	}

	ajustes.actualizadoEn = new Date();
	
	await db.ajustes.put(ajustes);
	
	console.log(`[AjustesService] Ajustes guardados para artista ${ajustes.artistaId}`);
}

// ============================================================================
// SINCRONIZACIÓN BD → UI
// ============================================================================

/**
 * Aplica los ajustes de la base de datos al store de UI
 * Mapea los campos de la BD a los del store de Svelte
 * 
 * @param ajustes - Ajustes desde la base de datos
 */
export function sincronizarAjustesAUI(ajustes: Ajustes): void {
	// Aplicar cada configuración al store de UI
	// Usando los métodos setter del store configuraciones
	
	// Interfaz
	configuraciones.setFontSize(ajustes.multiplicadorTamanioFuente);
	configuraciones.setSpacing(ajustes.multiplicadorEspaciado);
	configuraciones.setBorderRadius(ajustes.redondesBordes);
	
	// Lupa
	configuraciones.setMagnifierEnabled(ajustes.lupaActivada);
	configuraciones.setMagnifierZoom(ajustes.nivelMagnificacion);
	
	// Tema - Necesitamos manejar estos con cuidado
	// Si el valor de la BD difiere del actual, alternamos
	// Usamos una aproximación directa actualizando el store
	
	// Aplicar modoNoche y modoInverso explícitamente para evitar toggles inconsistentes
	// Los setters gestionan dependencias (ej. activar modoNoche si se habilita modoInverso)
	configuraciones.setModoNoche(ajustes.modoNoche);
	configuraciones.setModoInverso(ajustes.modoInverso);
	
	// DISLEXIA - Mapear campos de BD a UI
	// Usar setters explícitos para evitar toggles inconsistentes
	configuraciones.setBionicMode(!!ajustes.modoBionico);
	configuraciones.setNarrationEnabled(!!ajustes.narracionActivada);
	configuraciones.setTTSSpeed(ajustes.velocidadTTS ?? 1);
	configuraciones.setRhymeMode(!!ajustes.modoRima);
	configuraciones.setPictogramMode(!!ajustes.modoPictograma);

	// Daltonismo - estos tienen setters directos
	configuraciones.setColorBlindness(ajustes.modoVisionColor);
	configuraciones.setIntensity(ajustes.intensidadFiltro);
	configuraciones.setTextures(ajustes.texturasActivas);
	configuraciones.setContrast(ajustes.modoContraste);
	
	console.log(`[AjustesService] Ajustes sincronizados a UI para artista ${ajustes.artistaId}`);
}

// ============================================================================
// SINCRONIZACIÓN UI → BD
// ============================================================================

/**
 * Convierte el estado actual de la UI a un objeto Ajustes parcial
 * Útil para guardar cambios desde la UI a la BD
 * 
 * @param artistaId - ID del artista
 * @param ajustesId - ID del registro de ajustes existente
 * @returns Objeto Ajustes con valores actuales de la UI
 */
export function obtenerAjustesDesdeUI(artistaId: number, ajustesId: string): Ajustes {
	// Usar get() para obtener el valor actual del store de forma síncrona
	const configActual: ConfiguracionUI = get(configuraciones);
	
	return {
		id: ajustesId,
		artistaId,
		
		// Mapeo UI → BD
		multiplicadorTamanioFuente: configActual.multiplicadorTamanioFuente,
		multiplicadorEspaciado: configActual.multiplicadorEspaciado,
		redondesBordes: configActual.redondesBordes,
		lupaActivada: configActual.lupaActivada,
		nivelMagnificacion: configActual.nivelMagnificacion,
		modoNoche: configActual.modoNoche ?? false,
		modoInverso: configActual.modoInverso ?? false,
		
		// DISLEXIA (mapeo UI → BD)
		modoBionico: configActual.bionicMode,
		narracionActivada: configActual.narrationEnabled,
		modoRima: configActual.rhymeMode,
		modoPictograma: configActual.pictogramMode,
		
		// Daltonismo (mapeo de nombres)
		modoVisionColor: configActual.colorBlindness,
		intensidadFiltro: configActual.intensity,
		texturasActivas: configActual.textures,
		modoContraste: configActual.contrast,
		
		// Audio (valores por defecto, aún no en UI)
		volumenMusica: 1,
		volumenEfectos: 1,
		velocidadTTS: configActual.ttsSpeed || 1,
		
		actualizadoEn: new Date()
	};
}

// ============================================================================
// FLUJO PRINCIPAL
// ============================================================================

/**
 * Carga los ajustes de un artista y los aplica a la UI
 * Si el artista no tiene ajustes, crea los valores por defecto
 * 
 * @param artistaId - ID del artista
 */
export async function cargarAjustesDelArtista(artistaId: number): Promise<void> {
	const db = getDB();
	if (!db) {
		console.warn('[AjustesService] BD no disponible, usando valores por defecto de UI');
		return;
	}

	// Intentar obtener ajustes existentes
	let ajustes = await obtenerAjustesPorArtista(artistaId);
	
	// Si no existen, crear por defecto
	if (!ajustes) {
		ajustes = await crearAjustesPorDefecto(artistaId);
	}
	
	// Sincronizar con la UI
	sincronizarAjustesAUI(ajustes);
}

/**
 * Guarda los ajustes actuales de la UI para el artista especificado
 * 
 * @param artistaId - ID del artista
 */
export async function guardarAjustesDesdeUI(artistaId: number): Promise<void> {
	const db = getDB();
	if (!db) {
		throw new Error('[AjustesService] Base de datos no disponible');
	}

	// Obtener ajustes existentes o crear nuevos
	let ajustesExistentes = await obtenerAjustesPorArtista(artistaId);
	
	const ajustesId = ajustesExistentes?.id ?? generarUUID();
	
	const ajustesActuales = obtenerAjustesDesdeUI(artistaId, ajustesId);
	
	await guardarAjustes(ajustesActuales);
}
