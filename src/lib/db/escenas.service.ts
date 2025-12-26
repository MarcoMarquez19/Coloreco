/**
 * Servicio de gestión de escenas del catálogo
 * Proporciona funciones CRUD para trabajar con EscenaCatalogo en IndexedDB
 */

import { getDB } from './database';
import type { EscenaCatalogo, Modo } from './schemas';
import { generarUUID } from './schemas';

/**
 * Lista todas las escenas disponibles en el catálogo
 * @returns Array de escenas o array vacío si la DB no está disponible
 */
export async function listarTodos(): Promise<EscenaCatalogo[]> {
	const db = getDB();
	if (!db) {
		console.warn('[escenas.service] DB no disponible en este contexto (SSR?)');
		return [];
	}

	try {
		return await db.escenasCatalogo.toArray();
	} catch (error) {
		console.error('[escenas.service] Error al listar todas las escenas:', error);
		return [];
	}
}

/**
 * Lista escenas filtradas por modo de juego
 * @param modo - El modo a filtrar ('dibujo' | 'cuerpoHumano' | 'historias')
 * @returns Array de escenas del modo especificado
 */
export async function listarPorModo(modo: Modo): Promise<EscenaCatalogo[]> {
	const db = getDB();
	if (!db) {
		console.warn('[escenas.service] DB no disponible en este contexto (SSR?)');
		return [];
	}

	try {
		return await db.escenasCatalogo.where('modo').equals(modo).toArray();
	} catch (error) {
		console.error(`[escenas.service] Error al listar escenas por modo ${modo}:`, error);
		return [];
	}
}

/**
 * Obtiene una escena específica por su ID
 * @param id - ID de la escena
 * @returns La escena encontrada o undefined
 */
export async function obtenerPorId(id: string): Promise<EscenaCatalogo | undefined> {
	const db = getDB();
	if (!db) {
		console.warn('[escenas.service] DB no disponible en este contexto (SSR?)');
		return undefined;
	}

	try {
		return await db.escenasCatalogo.get(id);
	} catch (error) {
		console.error(`[escenas.service] Error al obtener escena ${id}:`, error);
		return undefined;
	}
}

/**
 * Busca escenas por escenaId (identificador interno del modo)
 * @param escenaId - Identificador de la escena dentro del modo
 * @returns Array de escenas que coinciden
 */
export async function buscarPorEscenaId(escenaId: string): Promise<EscenaCatalogo[]> {
	const db = getDB();
	if (!db) {
		console.warn('[escenas.service] DB no disponible en este contexto (SSR?)');
		return [];
	}

	try {
		return await db.escenasCatalogo.where('escenaId').equals(escenaId).toArray();
	} catch (error) {
		console.error(`[escenas.service] Error al buscar por escenaId ${escenaId}:`, error);
		return [];
	}
}

/**
 * Agrega una nueva escena al catálogo
 * @param escena - Datos de la escena (sin id, se genera automáticamente)
 * @returns ID de la escena creada
 */
export async function agregarEscena(
	escena: Omit<EscenaCatalogo, 'id'>
): Promise<string | null> {
	const db = getDB();
	if (!db) {
		console.error('[escenas.service] DB no disponible, no se puede agregar escena');
		return null;
	}

	try {
		const id = generarUUID();
		await db.escenasCatalogo.add({ ...escena, id });
		return id;
	} catch (error) {
		console.error('[escenas.service] Error al agregar escena:', error);
		return null;
	}
}

/**
 * Actualiza una escena existente
 * @param id - ID de la escena a actualizar
 * @param cambios - Campos a actualizar
 */
export async function actualizarEscena(
	id: string,
	cambios: Partial<Omit<EscenaCatalogo, 'id'>>
): Promise<boolean> {
	const db = getDB();
	if (!db) {
		console.error('[escenas.service] DB no disponible');
		return false;
	}

	try {
		await db.escenasCatalogo.update(id, cambios);
		return true;
	} catch (error) {
		console.error(`[escenas.service] Error al actualizar escena ${id}:`, error);
		return false;
	}
}

/**
 * Elimina una escena del catálogo
 * @param id - ID de la escena a eliminar
 */
export async function eliminarEscena(id: string): Promise<boolean> {
	const db = getDB();
	if (!db) {
		console.error('[escenas.service] DB no disponible');
		return false;
	}

	try {
		await db.escenasCatalogo.delete(id);
		return true;
	} catch (error) {
		console.error(`[escenas.service] Error al eliminar escena ${id}:`, error);
		return false;
	}
}

/**
 * Cuenta cuántas escenas hay en el catálogo
 * @returns Número total de escenas
 */
export async function contarEscenas(): Promise<number> {
	const db = getDB();
	if (!db) return 0;

	try {
		return await db.escenasCatalogo.count();
	} catch (error) {
		console.error('[escenas.service] Error al contar escenas:', error);
		return 0;
	}
}

/**
 * Siembra el catálogo con escenas iniciales si está vacío
 * @param escenasIniciales - Array de escenas a sembrar
 * @returns true si se sembraron datos, false si ya existían
 */
export async function sembrarIniciales(
	escenasIniciales: Omit<EscenaCatalogo, 'id'>[]
): Promise<boolean> {
	const db = getDB();
	if (!db) {
		console.error('[escenas.service] DB no disponible, no se puede sembrar');
		return false;
	}

	try {
		const count = await contarEscenas();
		if (count > 0) {
			console.info('[escenas.service] Catálogo ya contiene escenas, omitiendo sembrado');
			return false;
		}

		// Agregar todas las escenas iniciales con IDs generados
		const escemasConId: EscenaCatalogo[] = escenasIniciales.map((escena) => ({
			...escena,
			id: generarUUID()
		}));

		await db.escenasCatalogo.bulkAdd(escemasConId);
		console.info(`[escenas.service] Sembradas ${escemasConId.length} escenas iniciales`);
		return true;
	} catch (error) {
		console.error('[escenas.service] Error al sembrar escenas iniciales:', error);
		return false;
	}
}

/**
 * Limpia todas las escenas del catálogo (usar con precaución)
 */
export async function limpiarCatalogo(): Promise<boolean> {
	const db = getDB();
	if (!db) {
		console.error('[escenas.service] DB no disponible');
		return false;
	}

	try {
		await db.escenasCatalogo.clear();
		console.info('[escenas.service] Catálogo limpiado');
		return true;
	} catch (error) {
		console.error('[escenas.service] Error al limpiar catálogo:', error);
		return false;
	}
}
