/**
 * Servicio para gestionar el progreso del artista en diferentes modos de juego
 * 
 * @module db/progreso.service
 */

import { getDB } from './database';
import { generarUUID, type Progreso, type ProgresoHumanBody } from './schemas';
import { browser } from '$app/environment';

// ============================================================================
// FUNCIONES DE PROGRESO - MODO CUERPO HUMANO
// ============================================================================

/**
 * Obtiene o crea el progreso del modo cuerpo humano para un artista
 * 
 * @param artistaId - ID del artista
 * @returns Progreso del modo cuerpo humano
 */
export async function obtenerProgresoCuerpoHumano(artistaId: number): Promise<Progreso> {
	if (!browser) {
		throw new Error('Este servicio solo funciona en el navegador');
	}

	const db = getDB();
	if (!db) {
		throw new Error('Base de datos no disponible');
	}

	// Buscar progreso existente
	const progresoExistente = await db.progreso
		.where({ artistaId, modo: 'cuerpoHumano' })
		.first();

	if (progresoExistente) {
		return progresoExistente;
	}

	// Crear nuevo progreso
	const nuevoProgreso: Progreso = {
		id: generarUUID(),
		artistaId,
		modo: 'cuerpoHumano',
		nivel: 1,
		puntaje: 0,
		intentos: 0,
		completado: false,
		ultimaVez: new Date(),
		humanBody: {
			partesUbicadasCorrectamente: 0,
			errores: 0,
			escenasCompletadas: []
		}
	};

	await db.progreso.add(nuevoProgreso);
	console.log('[ProgresoService] Progreso cuerpo humano creado para artista', artistaId);

	return nuevoProgreso;
}

/**
 * Incrementa el contador de partes colocadas correctamente
 * 
 * @param artistaId - ID del artista
 * @param cantidad - Cantidad de partes a incrementar (default: 1)
 * @returns Total de partes colocadas
 */
export async function incrementarPartesColocadas(
	artistaId: number,
	cantidad: number = 1
): Promise<number> {
	if (!browser) {
		throw new Error('Este servicio solo funciona en el navegador');
	}

	const progreso = await obtenerProgresoCuerpoHumano(artistaId);

	const nuevasPartes = (progreso.humanBody?.partesUbicadasCorrectamente || 0) + cantidad;

	const db = getDB();
	if (!db) {
		throw new Error('Base de datos no disponible');
	}
	
	await db.progreso.update(progreso.id, {
		humanBody: {
			...progreso.humanBody,
			partesUbicadasCorrectamente: nuevasPartes,
			errores: progreso.humanBody?.errores || 0,
			escenasCompletadas: progreso.humanBody?.escenasCompletadas || []
		},
		ultimaVez: new Date()
	});

	console.log('[ProgresoService] Partes colocadas:', nuevasPartes);
	return nuevasPartes;
}

/**
 * Incrementa el contador de errores
 * 
 * @param artistaId - ID del artista
 * @param cantidad - Cantidad de errores a incrementar (default: 1)
 */
export async function incrementarErrores(
	artistaId: number,
	cantidad: number = 1
): Promise<void> {
	if (!browser) {
		throw new Error('Este servicio solo funciona en el navegador');
	}

	const progreso = await obtenerProgresoCuerpoHumano(artistaId);

	const nuevosErrores = (progreso.humanBody?.errores || 0) + cantidad;

	const db = getDB();
	if (!db) {
		throw new Error('Base de datos no disponible');
	}
	
	await db.progreso.update(progreso.id, {
		humanBody: {
			...progreso.humanBody,
			partesUbicadasCorrectamente: progreso.humanBody?.partesUbicadasCorrectamente || 0,
			errores: nuevosErrores,
			escenasCompletadas: progreso.humanBody?.escenasCompletadas || []
		},
		ultimaVez: new Date()
	});
}

/**
 * Marca una escena como completada (si no estaba ya)
 * 
 * @param artistaId - ID del artista
 * @param escenaId - ID de la escena completada
 * @returns Total de escenas completadas
 */
export async function marcarEscenaCompletada(
	artistaId: number,
	escenaId: string
): Promise<number> {
	if (!browser) {
		throw new Error('Este servicio solo funciona en el navegador');
	}

	const progreso = await obtenerProgresoCuerpoHumano(artistaId);

	const escenasActuales = progreso.humanBody?.escenasCompletadas || [];

	// Solo agregar si no existe ya
	if (!escenasActuales.includes(escenaId)) {
		const nuevasEscenas = [...escenasActuales, escenaId];

		const db = getDB();
		if (!db) {
			throw new Error('Base de datos no disponible');
		}
		
		await db.progreso.update(progreso.id, {
			humanBody: {
				...progreso.humanBody,
				partesUbicadasCorrectamente: progreso.humanBody?.partesUbicadasCorrectamente || 0,
				errores: progreso.humanBody?.errores || 0,
				escenasCompletadas: nuevasEscenas
			},
			completado: nuevasEscenas.length >= 3, // Completado si tiene 3+ escenas
			ultimaVez: new Date()
		});

		console.log('[ProgresoService] Escena completada:', escenaId, '- Total:', nuevasEscenas.length);
		return nuevasEscenas.length;
	}

	return escenasActuales.length;
}

/**
 * Obtiene el total de partes colocadas correctamente
 * 
 * @param artistaId - ID del artista
 * @returns Total de partes colocadas
 */
export async function obtenerTotalPartesColocadas(artistaId: number): Promise<number> {
	if (!browser) return 0;

	const progreso = await obtenerProgresoCuerpoHumano(artistaId);
	return progreso.humanBody?.partesUbicadasCorrectamente || 0;
}

/**
 * Obtiene el total de escenas completadas
 * 
 * @param artistaId - ID del artista
 * @returns Total de escenas completadas
 */
export async function obtenerTotalEscenasCompletadas(artistaId: number): Promise<number> {
	if (!browser) return 0;

	const progreso = await obtenerProgresoCuerpoHumano(artistaId);
	return progreso.humanBody?.escenasCompletadas?.length || 0;
}

/**
 * Obtiene las estadísticas completas del modo cuerpo humano
 * 
 * @param artistaId - ID del artista
 * @returns Estadísticas del progreso
 */
export async function obtenerEstadisticasCuerpoHumano(artistaId: number): Promise<{
	partesColocadas: number;
	errores: number;
	escenasCompletadas: number;
	escenasIds: string[];
}> {
	if (!browser) {
		return { partesColocadas: 0, errores: 0, escenasCompletadas: 0, escenasIds: [] };
	}

	const progreso = await obtenerProgresoCuerpoHumano(artistaId);

	return {
		partesColocadas: progreso.humanBody?.partesUbicadasCorrectamente || 0,
		errores: progreso.humanBody?.errores || 0,
		escenasCompletadas: progreso.humanBody?.escenasCompletadas?.length || 0,
		escenasIds: progreso.humanBody?.escenasCompletadas || []
	};
}
