/**
 * Configuración e instancia de la base de datos Dexie.js
 * Base de datos IndexedDB para persistencia local en Coloreco
 * 
 * @module db/database
 */

import Dexie, { type Table } from 'dexie';
import { browser } from '$app/environment';
import type {
	Artista,
	Sesion,
	Ajustes,
	LogroDefinicion,
	LogroArtista,
	Obra,
	ObraBlob,
	MiniaturaBlob,
	EscenaCatalogo,
	Progreso,
	ProgresoHistoria
} from './schemas';

// ============================================================================
// CLASE DE BASE DE DATOS
// ============================================================================

/**
 * Clase que extiende Dexie para tipado fuerte de tablas
 */
export class ColorecoDB extends Dexie {
	// Declaración de tablas con tipos
	artistas!: Table<Artista, number>;
	sesion!: Table<Sesion, 'actual'>;
	ajustes!: Table<Ajustes, string>;
	logrosDefinicion!: Table<LogroDefinicion, string>;
	logrosArtista!: Table<LogroArtista, string>;
	obras!: Table<Obra, string>;
	obrasBlobs!: Table<ObraBlob, string>;
	miniaturasBlobs!: Table<MiniaturaBlob, string>;
	escenasCatalogo!: Table<EscenaCatalogo, string>;
	progreso!: Table<Progreso, string>;
	progresosHistorias!: Table<ProgresoHistoria, string>;

	constructor() {
		super('ColorecoDB');
		
		// ========================================================================
		// VERSIÓN 1: Artistas, Sesión, Ajustes, Obras
		// ========================================================================
		this.version(1).stores({
			// artistas: clave primaria autoincremental, índice en ultimaActividad
			artistas: '++id, ultimaActividad',
			// sesion: clave primaria fija 'actual' (singleton)
			sesion: 'id',
			// ajustes: UUID como clave, índice en artistaId
			ajustes: 'id, artistaId',
			// obras: UUID como clave, índices múltiples para búsqueda
			obras: 'id, artistaId, modo, fechaCreacion, titulo',
			// obrasBlobs: FK a obra como clave primaria
			obrasBlobs: 'idObra'
		});

		// ========================================================================
		// VERSIÓN 2: Sistema de Logros y Medallas
		// ========================================================================
		this.version(2).stores({
			// Mantener stores anteriores
			artistas: '++id, ultimaActividad',
			sesion: 'id',
			ajustes: 'id, artistaId',
			obras: 'id, artistaId, modo, fechaCreacion, titulo',
			obrasBlobs: 'idObra',
			// Nuevos stores
			logrosDefinicion: 'id, codigo',
			logrosArtista: 'id, artistaId, logroId'
		}).upgrade(async (trans) => {
			// Migración v1 → v2: inicializar catálogo de logros si está vacío
			const logrosCount = await trans.table('logrosDefinicion').count();
			if (logrosCount === 0) {
				// Se inicializará desde el servicio de logros
				console.log('[DB] v2: Tablas de logros creadas');
			}
		});

		// ========================================================================
		// VERSIÓN 3: Progreso y Miniaturas
		// ========================================================================
		this.version(3).stores({
			// Mantener stores anteriores
			artistas: '++id, ultimaActividad',
			sesion: 'id',
			ajustes: 'id, artistaId',
			obras: 'id, artistaId, modo, fechaCreacion, titulo',
			obrasBlobs: 'idObra',
			logrosDefinicion: 'id, codigo',
			logrosArtista: 'id, artistaId, logroId',
			// Nuevos stores
			progreso: 'id, artistaId, modo',
			miniaturasBlobs: 'idObra'
		}).upgrade(async (trans) => {
			// Migración v2 → v3
			const progresoCount = await trans.table('progreso').count();
			if (progresoCount === 0) {
				console.log('[DB] v3: Tablas de progreso y miniaturas creadas');
			}
		});

		// ========================================================================
		// VERSIÓN 4: Catálogo de Escenas
		// ========================================================================
		this.version(4).stores({
			// Mantener todos los stores anteriores
			artistas: '++id, ultimaActividad',
			sesion: 'id',
			ajustes: 'id, artistaId',
			obras: 'id, artistaId, modo, fechaCreacion, titulo',
			obrasBlobs: 'idObra',
			logrosDefinicion: 'id, codigo',
			logrosArtista: 'id, artistaId, logroId',
			progreso: 'id, artistaId, modo',
			miniaturasBlobs: 'idObra',
			// Nuevo store
			escenasCatalogo: 'id, modo, escenaId'
		}).upgrade(async (trans) => {
			// Migración v3 → v4
			const escenasCount = await trans.table('escenasCatalogo').count();
			if (escenasCount === 0) {
				console.log('[DB] v4: Tabla de escenas catálogo creada');
			}
		});

		// ========================================================================
		// VERSIÓN 5: Progreso de Historias
		// ========================================================================
		this.version(5).stores({
			// Mantener todos los stores anteriores
			artistas: '++id, ultimaActividad',
			sesion: 'id',
			ajustes: 'id, artistaId',
			obras: 'id, artistaId, modo, fechaCreacion, titulo',
			obrasBlobs: 'idObra',
			logrosDefinicion: 'id, codigo',
			logrosArtista: 'id, artistaId, logroId',
			progreso: 'id, artistaId, modo',
			miniaturasBlobs: 'idObra',
			escenasCatalogo: 'id, modo, escenaId',
			// Nuevo store
			progresosHistorias: 'id, artistaId, historiaId'
		}).upgrade(async (trans) => {
			// Migración v4 → v5
			const progresosHistoriasCount = await trans.table('progresosHistorias').count();
			if (progresosHistoriasCount === 0) {
				console.log('[DB] v5: Tabla de progreso de historias creada');
			}
		});
	}
}

// ============================================================================
// INSTANCIA SINGLETON
// ============================================================================

/**
 * Instancia única de la base de datos
 * Solo se crea en el navegador (SSR-safe)
 */
let dbInstance: ColorecoDB | null = null;

/**
 * Obtiene la instancia de la base de datos
 * Crea una nueva instancia si no existe (solo en browser)
 * 
 * @returns Instancia de ColorecoDB o null si está en SSR
 */
export function getDB(): ColorecoDB | null {
	if (!browser) {
		return null;
	}
	
	if (!dbInstance) {
		dbInstance = new ColorecoDB();
	}
	
	return dbInstance;
}

/**
 * Instancia directa de la base de datos
 * ⚠️ Usar con precaución, preferir getDB() para manejo de SSR
 * ESTE SOLAMENTE LO ESTAMOS USANDO EN TESTS
 */
export const db = browser ? new ColorecoDB() : null;

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Verifica si la base de datos está disponible
 */
export function isDBAvailable(): boolean {
	return browser && db !== null;
}

/**
 * Limpia toda la base de datos (testing y reset completo)
 */
export async function limpiarBaseDeDatos(): Promise<void> {
	const database = getDB();
	if (!database) return;
	
	await database.transaction('rw', [
		database.artistas,
		database.sesion,
		database.ajustes,
		database.obras,
		database.obrasBlobs,
		database.logrosDefinicion,
		database.logrosArtista,
		database.progreso,
		database.miniaturasBlobs,
		database.escenasCatalogo,
		database.progresosHistorias
	], async () => {
		await database.artistas.clear();
		await database.sesion.clear();
		await database.ajustes.clear();
		await database.obras.clear();
		await database.obrasBlobs.clear();
		await database.logrosDefinicion.clear();
		await database.logrosArtista.clear();
		await database.progreso.clear();
		await database.miniaturasBlobs.clear();
		await database.escenasCatalogo.clear();
		await database.progresosHistorias.clear();
	});
	
	console.log('[DB] Base de datos limpiada completamente');
}

/**
 * Exporta información de diagnóstico de la base de datos
 */
export async function obtenerInfoDB(): Promise<{
	version: number;
	tablas: string[];
	conteos: Record<string, number>;
} | null> {
	const database = getDB();
	if (!database) return null;
	
	const conteos: Record<string, number> = {};
	
	conteos.artistas = await database.artistas.count();
	conteos.sesion = await database.sesion.count();
	conteos.ajustes = await database.ajustes.count();
	conteos.obras = await database.obras.count();
	conteos.logrosDefinicion = await database.logrosDefinicion.count();
	conteos.logrosArtista = await database.logrosArtista.count();
	conteos.progresosHistorias = await database.progresosHistorias.count();
	conteos.progreso = await database.progreso.count();
	conteos.escenasCatalogo = await database.escenasCatalogo.count();
	
	return {
		version: database.verno,
		tablas: database.tables.map(t => t.name),
		conteos
	};
}

/**
 * Reinicia (elimina) la base de datos completa y recarga la página.
 * Útil para desarrollo o para resetear el contador autoincremental de artistas.
 * Nota: elimina todos los datos del usuario. Ejecutar solo en entorno de desarrollo
 * o cuando el usuario confirme la acción.
 */
export async function reiniciarBaseDeDatosYRecargar(): Promise<void> {
	if (!browser) return;
	const nombre = 'ColorecoDB';
	try {
		const database = getDB();
		if (database) {
			// Cerrar la conexión antes de borrar
			database.close();
		}
		// Eliminar la base de datos desde IndexedDB
		await Dexie.delete(nombre);
		console.log('[DB] Base de datos eliminada satisfactoriamente');
		// Recargar para que el módulo vuelva a crear la instancia limpia
		location.reload();
	} catch (e) {
		console.error('[DB] Error reiniciando la base de datos:', e);
		throw e;
	}
}
