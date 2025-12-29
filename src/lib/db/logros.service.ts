/**
 * Servicio para gestionar logros y medallas
 * Maneja la definición, seguimiento y desbloqueo de logros para cada artista
 * 
 * @module db/logros.service
 */

import { getDB } from './database';
import { generarUUID, type LogroDefinicion, type LogroArtista, type Modo } from './schemas';
import type { CodigoLogro } from './schemas';

// ============================================================================
// DEFINICIONES DE LOGROS
// ============================================================================

export interface LogroJSON {
	codigo: string;
	nombre: string;
	descripcion: string;
	criterio: string;
	icono: string;
}

interface LogrosData {
	historias: LogroJSON[];
	dibujo: LogroJSON[];
	cuerpoHumano: LogroJSON[];
}

let logrosCache: LogrosData | null = null;

/**
 * Carga las definiciones de logros desde el archivo JSON
 * 
 * @returns Datos de logros por modo
 */
async function cargarDefinicionesLogros(): Promise<LogrosData> {
	if (logrosCache) return logrosCache;

	try {
		const response = await fetch('/logros/logros.json');
		if (!response.ok) {
			throw new Error(`Error cargando logros: ${response.status}`);
		}
		logrosCache = await response.json();
		return logrosCache as LogrosData;
	} catch (error) {
		console.error('[LogrosService] Error cargando definiciones de logros:', error);
		return { historias: [], dibujo: [], cuerpoHumano: [] };
	}
}

/**
 * Obtiene las definiciones de logros para un modo específico
 * 
 * @param modo - Modo del juego
 * @returns Array de definiciones de logros
 */
async function obtenerDefinicionesPorModo(modo: Modo): Promise<Omit<LogroDefinicion, 'id'>[]> {
	const logrosData = await cargarDefinicionesLogros();
	const logrosJSON = logrosData[modo] || [];

	return logrosJSON.map(logro => ({
		codigo: logro.codigo,
		nombre: logro.nombre,
		descripcion: logro.descripcion,
		modo: modo,
		criterio: logro.criterio,
		icono: logro.icono
	}));
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa el catálogo de logros en la base de datos
 * Solo crea logros que no existen (basado en código único)
 * 
 * @returns Número de logros creados
 */
export async function inicializarCatalogoLogros(): Promise<number> {
	const db = getDB();
	if (!db) return 0;

	let logrosCreados = 0;

	try {
		// Cargar definiciones desde JSON
		const modos: Modo[] = ['historias', 'dibujo', 'cuerpoHumano'];
		
		for (const modo of modos) {
			const definiciones = await obtenerDefinicionesPorModo(modo);
			
			for (const defLogro of definiciones) {
				// Verificar si ya existe
				const existente = await db.logrosDefinicion
					.where('codigo')
					.equals(defLogro.codigo)
					.first();

				if (!existente) {
					const logroCompleto: LogroDefinicion = {
						id: generarUUID(),
						...defLogro
					};
					await db.logrosDefinicion.add(logroCompleto);
					logrosCreados++;
					console.log(`[LogrosService] Logro creado: ${defLogro.nombre}`);
				}
			}
		}

		if (logrosCreados > 0) {
			console.log(`[LogrosService] ${logrosCreados} logros inicializados`);
		}
	} catch (error) {
		console.error('[LogrosService] Error inicializando catálogo de logros:', error);
	}

	return logrosCreados;
}

// ============================================================================
// CONSULTAS DE LOGROS
// ============================================================================

/**
 * Obtiene las definiciones de logros desde el JSON por modo
 * 
 * @param modo - Modo del juego (opcional, si no se especifica devuelve todos)
 * @returns Array de definiciones de logros
 */
export async function obtenerDefinicionesLogrosJSON(modo?: Modo): Promise<LogroJSON[]> {
	const logrosData = await cargarDefinicionesLogros();
	
	if (modo) {
		return logrosData[modo] || [];
	}
	
	// Devolver todos los logros de todos los modos
	return [...logrosData.historias, ...logrosData.dibujo, ...logrosData.cuerpoHumano];
}

/**
 * Obtiene todos los logros definidos
 * 
 * @returns Array de definiciones de logros
 */
export async function obtenerTodosLosLogros(): Promise<LogroDefinicion[]> {
	const db = getDB();
	if (!db) return [];

	try {
		return await db.logrosDefinicion.toArray();
	} catch (error) {
		console.error('[LogrosService] Error obteniendo logros:', error);
		return [];
	}
}

/**
 * Obtiene logros filtrados por modo
 * 
 * @param modo - Modo de juego
 * @returns Array de logros del modo especificado
 */
export async function obtenerLogrosPorModo(modo: 'historias' | 'dibujo' | 'cuerpoHumano'): Promise<LogroDefinicion[]> {
	const db = getDB();
	if (!db) return [];

	try {
		return await db.logrosDefinicion
			.where('modo')
			.equals(modo)
			.toArray();
	} catch (error) {
		console.error('[LogrosService] Error obteniendo logros por modo:', error);
		return [];
	}
}

/**
 * Obtiene un logro por su código
 * 
 * @param codigo - Código del logro
 * @returns Definición del logro o null
 */
export async function obtenerLogroPorCodigo(codigo: string): Promise<LogroDefinicion | null> {
	const db = getDB();
	if (!db) return null;

	try {
		const logro = await db.logrosDefinicion
			.where('codigo')
			.equals(codigo)
			.first();
		return logro ?? null;
	} catch (error) {
		console.error('[LogrosService] Error obteniendo logro por código:', error);
		return null;
	}
}

/**
 * Obtiene logros filtrados por escenaId
 * 
 * @param escenaId - ID de la escena
 * @returns Array de logros asociados a la escena especificada
 */
export async function obtenerLogrosPorEscenaId(escenaId: string): Promise<LogroDefinicion[]> {
	const db = getDB();
	if (!db) return [];

	try {
		return await db.logrosDefinicion
			.where('escenaId')
			.equals(escenaId)
			.toArray();
	} catch (error) {
		console.error('[LogrosService] Error obteniendo logros por escenaId:', error);
		return [];
	}
}

// ============================================================================
// LOGROS DE ARTISTAS
// ============================================================================

/**
 * Obtiene todos los logros de un artista con su estado
 * 
 * @param artistaId - ID del artista
 * @returns Array con definición y estado de cada logro
 */
export async function obtenerLogrosArtista(artistaId: number): Promise<{
	definicion: LogroDefinicion;
	estado: LogroArtista | null;
}[]> {
	const db = getDB();
	if (!db) return [];

	try {
		const definiciones = await db.logrosDefinicion.toArray();
		const estados = await db.logrosArtista
			.where('artistaId')
			.equals(artistaId)
			.toArray();

		return definiciones.map(def => {
			const estado = estados.find(e => e.logroId === def.id) ?? null;
			return { definicion: def, estado };
		});
	} catch (error) {
		console.error('[LogrosService] Error obteniendo logros del artista:', error);
		return [];
	}
}

/**
 * Obtiene logros de un artista filtrados por modo
 * 
 * @param artistaId - ID del artista
 * @param modo - Modo de juego
 * @returns Array con definición y estado de cada logro del modo
 */
export async function obtenerLogrosArtistaPorModo(
	artistaId: number,
	modo: 'historias' | 'dibujo' | 'cuerpoHumano'
): Promise<{
	definicion: LogroDefinicion;
	estado: LogroArtista | null;
}[]> {
	const db = getDB();
	if (!db) return [];

	try {
		const definiciones = await db.logrosDefinicion
			.where('modo')
			.equals(modo)
			.toArray();

		const estados = await db.logrosArtista
			.where('artistaId')
			.equals(artistaId)
			.toArray();

		return definiciones.map(def => {
			const estado = estados.find(e => e.logroId === def.id) ?? null;
			return { definicion: def, estado };
		});
	} catch (error) {
		console.error('[LogrosService] Error obteniendo logros del artista por modo:', error);
		return [];
	}
}

/**
 * Verifica si un artista tiene un logro desbloqueado
 * 
 * @param artistaId - ID del artista
 * @param codigoLogro - Código del logro
 * @returns true si está desbloqueado
 */
export async function tieneLogroDesbloqueado(artistaId: number, codigoLogro: string): Promise<boolean> {
	const db = getDB();
	if (!db) return false;

	try {
		const logro = await obtenerLogroPorCodigo(codigoLogro);
		if (!logro) return false;

		const estado = await db.logrosArtista
			.where({ artistaId, logroId: logro.id })
			.first();

		return estado?.desbloqueado ?? false;
	} catch (error) {
		console.error('[LogrosService] Error verificando logro:', error);
		return false;
	}
}

// ============================================================================
// DESBLOQUEO DE LOGROS
// ============================================================================

/**
 * Desbloquea un logro para un artista
 * 
 * @param artistaId - ID del artista
 * @param codigoLogro - Código del logro a desbloquear
 * @returns true si se desbloqueó exitosamente, false si ya estaba desbloqueado o hubo error
 */
export async function desbloquearLogro(artistaId: number, codigoLogro: string): Promise<boolean> {
	const db = getDB();
	if (!db) return false;

	try {
		// Obtener la definición del logro
		const logro = await obtenerLogroPorCodigo(codigoLogro);
		if (!logro) {
			console.warn(`[LogrosService] Logro con código ${codigoLogro} no encontrado`);
			return false;
		}

		// Verificar si ya está desbloqueado
		const estadoExistente = await db.logrosArtista
			.where({ artistaId, logroId: logro.id })
			.first();

		if (estadoExistente?.desbloqueado) {
			console.log(`[LogrosService] Logro ${logro.nombre} ya estaba desbloqueado`);
			return false;
		}

		// Crear o actualizar el estado del logro
		const nuevoEstado: LogroArtista = {
			id: estadoExistente?.id ?? generarUUID(),
			artistaId,
			logroId: logro.id,
			desbloqueado: true,
			fechaDesbloqueo: new Date(),
			progresoParcial: 100
		};

		if (estadoExistente) {
			await db.logrosArtista.put(nuevoEstado);
		} else {
			await db.logrosArtista.add(nuevoEstado);
		}

		console.log(`[LogrosService] ¡Logro desbloqueado! ${logro.nombre}`);

		return true;
	} catch (error) {
		console.error('[LogrosService] Error desbloqueando logro:', error);
		return false;
	}
}

/**
 * Actualiza el progreso parcial de un logro
 * 
 * @param artistaId - ID del artista
 * @param codigoLogro - Código del logro
 * @param progreso - Progreso actual (0-100)
 */
export async function actualizarProgresoLogro(
	artistaId: number,
	codigoLogro: string,
	progreso: number
): Promise<void> {
	const db = getDB();
	if (!db) return;

	try {
		const logro = await obtenerLogroPorCodigo(codigoLogro);
		if (!logro) return;

		const estadoExistente = await db.logrosArtista
			.where({ artistaId, logroId: logro.id })
			.first();

		const nuevoEstado: LogroArtista = {
			id: estadoExistente?.id ?? generarUUID(),
			artistaId,
			logroId: logro.id,
			desbloqueado: estadoExistente?.desbloqueado ?? false,
			fechaDesbloqueo: estadoExistente?.fechaDesbloqueo,
			progresoParcial: Math.min(100, Math.max(0, progreso))
		};

		if (estadoExistente) {
			await db.logrosArtista.put(nuevoEstado);
		} else {
			await db.logrosArtista.add(nuevoEstado);
		}
	} catch (error) {
		console.error('[LogrosService] Error actualizando progreso:', error);
	}
}

// ============================================================================
// RANGOS
// ============================================================================

/**
 * Calcula el rango del artista según logros desbloqueados
 * 
 * @param artistaId - ID del artista
 * @returns Rango: 'bronce', 'plata', 'oro' o null
 */
export async function calcularRangoArtista(artistaId: number): Promise<'bronce' | 'plata' | 'oro' | null> {
	const db = getDB();
	if (!db) return null;

	try {
		const todosLosLogros = await db.logrosArtista
			.where('artistaId')
			.equals(artistaId)
			.toArray();
		
		const logrosDesbloqueados = todosLosLogros.filter(logro => logro.desbloqueado === true).length;

		if (logrosDesbloqueados === 0) return null;
		if (logrosDesbloqueados <= 3) return 'bronce';
		if (logrosDesbloqueados <= 7) return 'plata';
		return 'oro';
	} catch (error) {
		console.error('[LogrosService] Error calculando rango:', error);
		return null;
	}
}

/**
 * Obtiene estadísticas de logros de un artista
 * 
 * @param artistaId - ID del artista
 * @returns Estadísticas de logros
 */
export async function obtenerEstadisticasLogros(artistaId: number): Promise<{
	totalLogros: number;
	desbloqueados: number;
	rango: 'bronce' | 'plata' | 'oro' | null;
}> {
	const db = getDB();
	if (!db) {
		return {
			totalLogros: 0,
			desbloqueados: 0,
			rango: null
		};
	}

	try {
		const totalLogros = await db.logrosDefinicion.count();
		
		const todosLosLogros = await db.logrosArtista
			.where('artistaId')
			.equals(artistaId)
			.toArray();
		
		const desbloqueados = todosLosLogros.filter(logro => logro.desbloqueado === true).length;

		const rango = await calcularRangoArtista(artistaId);

		console.log(`[LogrosService] Estadísticas - Total: ${totalLogros}, Desbloqueados: ${desbloqueados}, Rango: ${rango}`);

		return {
			totalLogros,
			desbloqueados,
			rango
		};
	} catch (error) {
		console.error('[LogrosService] Error obteniendo estadísticas:', error);
		return {
			totalLogros: 0,
			desbloqueados: 0,
			rango: null
		};
	}
}
