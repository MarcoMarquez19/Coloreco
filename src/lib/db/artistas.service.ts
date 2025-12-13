/**
 * Servicio de gestión de artistas y sesión
 * Maneja CRUD de artistas, cambio de perfil activo y borrado en cascada
 * 
 * @module db/artistas.service
 */

import { getDB } from './database';
import { browser } from '$app/environment';
import type { Artista, Sesion } from './schemas'; 
import { cargarAjustesDelArtista, guardarAjustesDesdeUI } from './ajustes.service';

// ============================================================================
// GESTIÓN DE ARTISTAS
// ============================================================================

/**
 * Crea un nuevo artista en la base de datos
 * 
 * @param nombre - Nombre artístico del usuario
 * @returns ID del artista creado
 * @throws Error si la BD no está disponible
 */
export async function crearArtista(nombre: string): Promise<number> {
	const db = getDB();
	if (!db) {
		throw new Error('[ArtistasService] Base de datos no disponible');
	}

	const ahora = new Date();
	
	const nuevoArtista: Omit<Artista, 'id'> = {
		nombre: nombre.trim(),
		fechaCreacion: ahora,
		ultimaActividad: ahora,
		puntuacion: 0
	};

	const id = await db.artistas.add(nuevoArtista as Artista);

	console.log(`[ArtistasService] Artista creado: ${nombre} (ID: ${id})`);

	// Migración automática de ajustes que el usuario haya modificado antes
	// de seleccionar/crear un artista. Si existen ajustes en localStorage
	// (la app los guarda ahí mientras no hay artista), los persistimos
	// en la BD para el nuevo artista y removemos el localStorage.
	try {
		if (browser && localStorage.getItem('coloreco_settings')) {
			await guardarAjustesDesdeUI(id as number);
			localStorage.removeItem('coloreco_settings');
			console.log('[ArtistasService] Ajustes locales migrados a la BD para artista', id);
		}
	} catch (e) {
		console.error('[ArtistasService] Error migrando ajustes locales:', e);
	}

	return id as number;
}

/**
 * Obtiene todos los artistas ordenados por última actividad (más reciente primero)
 * 
 * @returns Lista de artistas
 */
export async function obtenerArtistas(): Promise<Artista[]> {
	const db = getDB();
	if (!db) {
		console.warn('[ArtistasService] BD no disponible, retornando lista vacía');
		return [];
	}

	const artistas = await db.artistas
		.orderBy('ultimaActividad')
		.reverse()
		.toArray();
	
	return artistas;
}

/**
 * Obtiene un artista por su ID
 * 
 * @param id - ID del artista
 * @returns Artista encontrado o undefined
 */
export async function obtenerArtistaPorId(id: number): Promise<Artista | undefined> {
	const db = getDB();
	if (!db) {
		return undefined;
	}

	return await db.artistas.get(id);
}

/**
 * Actualiza la última actividad del artista
 * 
 * @param artistaId - ID del artista
 */
export async function actualizarUltimaActividad(artistaId: number): Promise<void> {
	const db = getDB();
	if (!db) return;

	await db.artistas.update(artistaId, {
		ultimaActividad: new Date()
	});
}

/**
 * Actualiza la puntuación del artista
 * 
 * @param artistaId - ID del artista
 * @param nuevaPuntuacion - Nueva puntuación total
 */
export async function actualizarPuntuacion(artistaId: number, nuevaPuntuacion: number): Promise<void> {
	const db = getDB();
	if (!db) return;

	await db.artistas.update(artistaId, {
		puntuacion: nuevaPuntuacion
	});
}

// ============================================================================
// GESTIÓN DE SESIÓN
// ============================================================================

/**
 * Obtiene la sesión actual o crea una nueva si no existe
 * 
 * @returns Sesión actual
 */
export async function obtenerSesionActual(): Promise<Sesion> {
	const db = getDB();
	if (!db) {
		// Retornar sesión por defecto para SSR
		return {
			id: 'actual',
			artistaActualId: null,
			cambioEn: new Date()
		};
	}

	let sesion = await db.sesion.get('actual');
	
	if (!sesion) {
		// Crear sesión inicial
		sesion = {
			id: 'actual',
			artistaActualId: null,
			cambioEn: new Date()
		};
		await db.sesion.put(sesion);
		console.log('[ArtistasService] Sesión inicial creada');
	}
	
	return sesion;
}

/**
 * Cambia el artista activo en la sesión
 * Actualiza la sesión, carga los ajustes del artista y actualiza su última actividad
 * 
 * @param artistaId - ID del artista a activar
 * @throws Error si el artista no existe
 */
export async function cambiarArtista(artistaId: number): Promise<void> {
	const db = getDB();
	if (!db) {
		throw new Error('[ArtistasService] Base de datos no disponible');
	}

	// Verificar que el artista existe
	const artista = await db.artistas.get(artistaId);
	if (!artista) {
		throw new Error(`[ArtistasService] Artista con ID ${artistaId} no encontrado`);
	}

	// Actualizar sesión
	await db.sesion.put({
		id: 'actual',
		artistaActualId: artistaId,
		cambioEn: new Date()
	});

	// Actualizar última actividad del artista
	await actualizarUltimaActividad(artistaId);

	// Cargar y aplicar ajustes del artista a la UI
	await cargarAjustesDelArtista(artistaId);

	console.log(`[ArtistasService] Cambiado a artista: ${artista.nombre} (ID: ${artistaId})`);
}

/**
 * Obtiene el artista actualmente activo
 * 
 * @returns Artista activo o null si no hay ninguno
 */
export async function obtenerArtistaActivo(): Promise<Artista | null> {
	const db = getDB();
	if (!db) return null;

	const sesion = await obtenerSesionActual();
	
	if (!sesion.artistaActualId) {
		return null;
	}

	const artista = await db.artistas.get(sesion.artistaActualId);
	return artista ?? null;
}

// ============================================================================
// ELIMINACIÓN EN CASCADA
// ============================================================================

/**
 * Elimina un artista y todos sus datos relacionados
 * Realiza borrado en cascada de: ajustes, logros, obras, blobs, progreso
 * 
 * @param artistaId - ID del artista a eliminar
 * @throws Error si el artista es el activo actualmente
 */
export async function eliminarArtista(artistaId: number): Promise<void> {
	const db = getDB();
	if (!db) {
		throw new Error('[ArtistasService] Base de datos no disponible');
	}

	// Verificar que el artista existe
	const artista = await db.artistas.get(artistaId);
	if (!artista) {
		throw new Error(`[ArtistasService] Artista con ID ${artistaId} no encontrado`);
	}

	// Verificar que no sea el artista activo
	const sesion = await obtenerSesionActual();
	if (sesion.artistaActualId === artistaId) {
		throw new Error('[ArtistasService] No se puede eliminar el artista activo. Cambia a otro artista primero.');
	}

	// Borrado en cascada usando transacción
	await db.transaction('rw', [
		db.artistas,
		db.ajustes,
		db.logrosArtista,
		db.obras,
		db.obrasBlobs,
		db.miniaturasBlobs,
		db.progreso
	], async () => {
		// 1. Obtener IDs de obras para eliminar blobs
		const obras = await db.obras.where('artistaId').equals(artistaId).toArray();
		const obraIds = obras.map(o => o.id);

		// 2. Eliminar blobs de obras
		if (obraIds.length > 0) {
			await db.obrasBlobs.where('idObra').anyOf(obraIds).delete();
			await db.miniaturasBlobs.where('idObra').anyOf(obraIds).delete();
		}

		// 3. Eliminar obras
		await db.obras.where('artistaId').equals(artistaId).delete();

		// 4. Eliminar ajustes
		await db.ajustes.where('artistaId').equals(artistaId).delete();

		// 5. Eliminar logros del artista
		await db.logrosArtista.where('artistaId').equals(artistaId).delete();

		// 6. Eliminar progreso
		await db.progreso.where('artistaId').equals(artistaId).delete();

		// 7. Finalmente, eliminar el artista
		await db.artistas.delete(artistaId);
	});

	console.log(`[ArtistasService] Artista eliminado con todos sus datos: ${artista.nombre} (ID: ${artistaId})`);
}

/**
 * Cuenta el número total de artistas
 * 
 * @returns Número de artistas registrados
 */
export async function contarArtistas(): Promise<number> {
	const db = getDB();
	if (!db) return 0;

	return await db.artistas.count();
}
