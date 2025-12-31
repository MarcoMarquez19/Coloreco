/**
 * Servicio para gestionar el progreso de historias en la base de datos
 * Maneja la lógica de desbloqueo de capítulos y seguimiento del progreso
 * 
 * @module db/historias.service
 */

import { getDB } from './database';
import { generarUUID, type ProgresoHistoria, type ProgresoCapitulo } from './schemas';

/**
 * Información de una historia desde el JSON
 */
export interface HistoriaInfo {
	historiaId: string;
	titulo: string;
	totalCapitulos: number;
}

/**
 * Obtiene el progreso de una historia para un artista
 * Si no existe, lo crea con el primer capítulo desbloqueado
 * 
 * @param artistaId - ID del artista
 * @param historiaId - ID de la historia
 * @param totalCapitulos - Total de capítulos de la historia
 * @returns Progreso de la historia o null si no hay DB
 */
export async function obtenerProgresoHistoria(
	artistaId: number,
	historiaId: string,
	totalCapitulos: number
): Promise<ProgresoHistoria | null> {
	const db = getDB();
	if (!db) return null;

	try {
		// Buscar progreso existente
		const progresoExistente = await db.progresosHistorias
			.where({ artistaId, historiaId })
			.first();

		if (progresoExistente) {
			return progresoExistente;
		}

		// Si no existe, crear uno nuevo con el primer capítulo desbloqueado
		const capitulos: ProgresoCapitulo[] = [];
		for (let i = 1; i <= totalCapitulos; i++) {
			capitulos.push({
				numeroCapitulo: i,
				desbloqueado: i === 1, // Solo el primero está desbloqueado
				completado: false,
				fechaDesbloqueo: i === 1 ? new Date() : undefined,
				intentos: 0
			});
		}

		const nuevoProgreso: ProgresoHistoria = {
			id: generarUUID(),
			artistaId,
			historiaId,
			capitulos,
			capituloActual: 1,
			totalCapitulos,
			completada: false,
			fechaInicio: new Date(),
			ultimaActividad: new Date()
		};

		await db.progresosHistorias.add(nuevoProgreso);
		return nuevoProgreso;
	} catch (error) {
		console.error('Error al obtener progreso de historia:', error);
		return null;
	}
}

/**
 * Obtiene todos los progresos de historias para un artista
 * 
 * @param artistaId - ID del artista
 * @returns Array de progresos o vacío si no hay DB
 */
export async function obtenerTodosLosProgresos(
	artistaId: number
): Promise<ProgresoHistoria[]> {
	const db = getDB();
	if (!db) return [];

	try {
		return await db.progresosHistorias
			.where({ artistaId })
			.toArray();
	} catch (error) {
		console.error('Error al obtener todos los progresos:', error);
		return [];
	}
}

/**
 * Marca un capítulo como completado y desbloquea el siguiente
 * 
 * @param artistaId - ID del artista
 * @param historiaId - ID de la historia
 * @param numeroCapitulo - Número del capítulo completado
 * @returns true si se actualizó correctamente, false en caso contrario
 */
export async function completarCapitulo(
	artistaId: number,
	historiaId: string,
	numeroCapitulo: number
): Promise<boolean> {
	const db = getDB();
	if (!db) return false;

	try {
		const progreso = await db.progresosHistorias
			.where({ artistaId, historiaId })
			.first();

		if (!progreso) {
			console.error('No se encontró el progreso de la historia');
			return false;
		}

		// Actualizar el capítulo completado
		const capituloIdx = progreso.capitulos.findIndex(
			c => c.numeroCapitulo === numeroCapitulo
		);

		if (capituloIdx === -1) {
			console.error('Capítulo no encontrado');
			return false;
		}

		progreso.capitulos[capituloIdx].completado = true;
		progreso.capitulos[capituloIdx].fechaCompletado = new Date();

		// Desbloquear el siguiente capítulo si existe
		const siguienteCapituloIdx = progreso.capitulos.findIndex(
			c => c.numeroCapitulo === numeroCapitulo + 1
		);

		if (siguienteCapituloIdx !== -1) {
			progreso.capitulos[siguienteCapituloIdx].desbloqueado = true;
			progreso.capitulos[siguienteCapituloIdx].fechaDesbloqueo = new Date();
			progreso.capituloActual = numeroCapitulo + 1;
		} else {
			// Es el último capítulo, marcar historia como completada
			progreso.completada = true;
			progreso.fechaCompletado = new Date();
		}

		progreso.ultimaActividad = new Date();

		// Guardar cambios
		await db.progresosHistorias.put(progreso);
		return true;
	} catch (error) {
		console.error('Error al completar capítulo:', error);
		return false;
	}
}

/**
 * Incrementa el contador de intentos de un capítulo
 * 
 * @param artistaId - ID del artista
 * @param historiaId - ID de la historia
 * @param numeroCapitulo - Número del capítulo
 * @returns true si se actualizó correctamente, false en caso contrario
 */
export async function incrementarIntentos(
	artistaId: number,
	historiaId: string,
	numeroCapitulo: number
): Promise<boolean> {
	const db = getDB();
	if (!db) return false;

	try {
		const progreso = await db.progresosHistorias
			.where({ artistaId, historiaId })
			.first();

		if (!progreso) return false;

		const capituloIdx = progreso.capitulos.findIndex(
			c => c.numeroCapitulo === numeroCapitulo
		);

		if (capituloIdx === -1) return false;

		progreso.capitulos[capituloIdx].intentos++;
		progreso.ultimaActividad = new Date();

		await db.progresosHistorias.put(progreso);
		return true;
	} catch (error) {
		console.error('Error al incrementar intentos:', error);
		return false;
	}
}

/**
 * Verifica si un capítulo está desbloqueado
 * 
 * @param artistaId - ID del artista
 * @param historiaId - ID de la historia
 * @param numeroCapitulo - Número del capítulo a verificar
 * @returns true si está desbloqueado, false en caso contrario
 */
export async function estaCapituloDesbloqueado(
	artistaId: number,
	historiaId: string,
	numeroCapitulo: number
): Promise<boolean> {
	const db = getDB();
	if (!db) return false;

	try {
		const progreso = await db.progresosHistorias
			.where({ artistaId, historiaId })
			.first();

		if (!progreso) return numeroCapitulo === 1; // Si no hay progreso, solo el primero está desbloqueado

		const capitulo = progreso.capitulos.find(c => c.numeroCapitulo === numeroCapitulo);
		return capitulo?.desbloqueado ?? false;
	} catch (error) {
		console.error('Error al verificar capítulo desbloqueado:', error);
		return false;
	}
}

/**
 * Reinicia el progreso de una historia (útil para testing o reset)
 * 
 * @param artistaId - ID del artista
 * @param historiaId - ID de la historia
 * @returns true si se reinició correctamente, false en caso contrario
 */
export async function reiniciarProgresoHistoria(
	artistaId: number,
	historiaId: string
): Promise<boolean> {
	const db = getDB();
	if (!db) return false;

	try {
		const progreso = await db.progresosHistorias
			.where({ artistaId, historiaId })
			.first();

		if (!progreso) return false;

		await db.progresosHistorias.delete(progreso.id);
		return true;
	} catch (error) {
		console.error('Error al reiniciar progreso:', error);
		return false;
	}
}
