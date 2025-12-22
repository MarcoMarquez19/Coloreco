/**
 * Servicio de gestión de logros y medallas
 * Maneja la lógica de desbloqueo, puntuación y progreso de logros
 * 
 * @module db/logros.service
 */

import { getDB } from './database';
import { generarUUID, type LogroDefinicion, type LogroArtista, type UmbralMedalla, type Modo } from './schemas';

// ============================================================================
// CATÁLOGO DE LOGROS PREDEFINIDOS
// ============================================================================

/**
 * Catálogo de todos los logros disponibles en la aplicación
 * Se inicializa en la base de datos la primera vez que se usa
 */
export const CATALOGO_LOGROS: Omit<LogroDefinicion, 'id'>[] = [
	// ========================================================================
	// LOGROS GENERALES (sin modo específico)
	// ========================================================================
	{
		codigo: 'BIENVENIDA',
		nombre: 'Bienvenido a Coloreco',
		descripcion: 'Crea tu primer perfil de artista',
		puntos: 10,
		criterio: 'crear_perfil',
		icono: '👋'
	},
	{
		codigo: 'PRIMERA_OBRA',
		nombre: 'Primera Obra',
		descripcion: 'Crea tu primera obra de arte',
		puntos: 20,
		criterio: 'crear_primera_obra',
		icono: '🎨'
	},
	{
		codigo: 'COLECCIONISTA_NOVATO',
		nombre: 'Coleccionista Novato',
		descripcion: 'Crea 5 obras de arte',
		puntos: 50,
		criterio: 'total_obras:5',
		icono: '📚'
	},
	{
		codigo: 'COLECCIONISTA_EXPERTO',
		nombre: 'Coleccionista Experto',
		descripcion: 'Crea 20 obras de arte',
		puntos: 150,
		criterio: 'total_obras:20',
		icono: '🏆'
	},
	{
		codigo: 'MAESTRO_MULTIMODAL',
		nombre: 'Maestro Multimodal',
		descripcion: 'Crea al menos una obra en cada modo de juego',
		puntos: 100,
		criterio: 'obra_en_todos_modos',
		icono: '🌟'
	},

	// ========================================================================
	// MODO DIBUJO - LOGROS POR ESCENA
	// ========================================================================
	{
		codigo: 'ESCENA_DIBUJO_COMPLETADA',
		nombre: 'Primera Escena Completada',
		descripcion: 'Completa tu primera escena de dibujo',
		puntos: 30,
		modo: 'dibujo',
		criterio: 'completar_escena',
		icono: '🖼️'
	},
	{
		codigo: 'MAESTRO_ESCENAS',
		nombre: 'Maestro de Escenas',
		descripcion: 'Completa 10 escenas diferentes de dibujo',
		puntos: 200,
		modo: 'dibujo',
		criterio: 'escenas_unicas:10',
		icono: '🎭'
	},
	{
		codigo: 'PERFECCIONISTA_DIBUJO',
		nombre: 'Perfeccionista del Dibujo',
		descripcion: 'Crea 3 versiones de la misma escena',
		puntos: 75,
		modo: 'dibujo',
		criterio: 'versiones_escena:3',
		icono: '✨'
	},

	// ========================================================================
	// MODO CUERPO HUMANO
	// ========================================================================
	{
		codigo: 'PRIMER_CUERPO',
		nombre: 'Anatomista Principiante',
		descripcion: 'Completa tu primera composición del cuerpo humano',
		puntos: 30,
		modo: 'cuerpoHumano',
		criterio: 'completar_cuerpo',
		icono: '🧍'
	},
	{
		codigo: 'ANATOMISTA_EXPERTO',
		nombre: 'Anatomista Experto',
		descripcion: 'Coloca correctamente 20 partes del cuerpo sin errores',
		puntos: 100,
		modo: 'cuerpoHumano',
		criterio: 'partes_correctas:20',
		icono: '🩺'
	},
	{
		codigo: 'CUERPO_PERFECTO',
		nombre: 'Cuerpo Perfecto',
		descripcion: 'Completa un cuerpo entero sin ningún error',
		puntos: 150,
		modo: 'cuerpoHumano',
		criterio: 'cuerpo_sin_errores',
		icono: '⭐'
	},
	{
		codigo: 'VELOCISTA_ANATOMIA',
		nombre: 'Velocista de Anatomía',
		descripcion: 'Completa un cuerpo en menos de 2 minutos',
		puntos: 80,
		modo: 'cuerpoHumano',
		criterio: 'tiempo_menor:120',
		icono: '⚡'
	},

	// ========================================================================
	// MODO HISTORIAS
	// ========================================================================
	{
		codigo: 'PRIMERA_HISTORIA',
		nombre: 'Narrador Principiante',
		descripcion: 'Crea tu primera historia',
		puntos: 30,
		modo: 'historias',
		criterio: 'crear_historia',
		icono: '📖'
	},
	{
		codigo: 'CUENTACUENTOS',
		nombre: 'Cuentacuentos',
		descripcion: 'Crea 5 historias diferentes',
		puntos: 100,
		modo: 'historias',
		criterio: 'historias_totales:5',
		icono: '📚'
	},
	{
		codigo: 'ESCRITOR_PROLIJO',
		nombre: 'Escritor Prolijo',
		descripcion: 'Crea una historia con más de 10 escenas',
		puntos: 120,
		modo: 'historias',
		criterio: 'escenas_historia:10',
		icono: '✍️'
	},
	{
		codigo: 'MAESTRO_NARRATIVO',
		nombre: 'Maestro Narrativo',
		descripcion: 'Completa 15 historias',
		puntos: 250,
		modo: 'historias',
		criterio: 'historias_totales:15',
		icono: '🏅'
	},

	// ========================================================================
	// LOGROS DE ACCESIBILIDAD
	// ========================================================================
	{
		codigo: 'EXPLORADOR_ACCESIBILIDAD',
		nombre: 'Explorador de Accesibilidad',
		descripcion: 'Activa al menos 3 herramientas de accesibilidad',
		puntos: 50,
		criterio: 'herramientas_accesibilidad:3',
		icono: '♿'
	},
	{
		codigo: 'USUARIO_INCLUSIVE',
		nombre: 'Usuario Inclusivo',
		descripcion: 'Usa todas las herramientas de accesibilidad disponibles',
		puntos: 150,
		criterio: 'todas_herramientas_accesibilidad',
		icono: '🌈'
	}
];

/**
 * Umbrales de medallas predefinidos
 */
export const UMBRALES_MEDALLAS: Omit<UmbralMedalla, 'id'>[] = [
	{
		medalla: 'Bronce',
		minPuntos: 0,
		maxPuntos: 199,
		color: '#CD7F32'
	},
	{
		medalla: 'Plata',
		minPuntos: 200,
		maxPuntos: 499,
		color: '#C0C0C0'
	},
	{
		medalla: 'Oro',
		minPuntos: 500,
		maxPuntos: 999,
		color: '#FFD700'
	},
	{
		medalla: 'Platino',
		minPuntos: 1000,
		maxPuntos: 1999,
		color: '#E5E4E2'
	},
	{
		medalla: 'Diamante',
		minPuntos: 2000,
		maxPuntos: Infinity,
		color: '#B9F2FF'
	}
];

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa el catálogo de logros en la base de datos
 * Solo se ejecuta si la tabla está vacía
 */
export async function inicializarCatalogoLogros(): Promise<void> {
	const db = getDB();
	if (!db) return;

	const count = await db.logrosDefinicion.count();
	
	if (count === 0) {
		const logrosConId: LogroDefinicion[] = CATALOGO_LOGROS.map(logro => ({
			...logro,
			id: generarUUID()
		}));

		await db.logrosDefinicion.bulkAdd(logrosConId);
		console.log(`[Logros] Catálogo inicializado con ${logrosConId.length} logros`);
	}
}

/**
 * Inicializa los umbrales de medallas en la base de datos
 * Solo se ejecuta si la tabla está vacía
 */
export async function inicializarUmbralesMedallas(): Promise<void> {
	const db = getDB();
	if (!db) return;

	const count = await db.umbralesMedalla.count();
	
	if (count === 0) {
		const umbralesConId: UmbralMedalla[] = UMBRALES_MEDALLAS.map(umbral => ({
			...umbral,
			id: generarUUID()
		}));

		await db.umbralesMedalla.bulkAdd(umbralesConId);
		console.log(`[Logros] Umbrales de medallas inicializados`);
	}
}

/**
 * Inicializa todo el sistema de logros
 * Debe llamarse al inicio de la aplicación
 */
export async function inicializarSistemaLogros(): Promise<void> {
	await inicializarCatalogoLogros();
	await inicializarUmbralesMedallas();
}

// ============================================================================
// CONSULTAS DE LOGROS
// ============================================================================

/**
 * Obtiene todos los logros definidos en el catálogo
 */
export async function obtenerTodosLosLogros(): Promise<LogroDefinicion[]> {
	const db = getDB();
	if (!db) return [];
	
	return await db.logrosDefinicion.toArray();
}

/**
 * Obtiene logros filtrados por modo
 */
export async function obtenerLogrosPorModo(modo: Modo): Promise<LogroDefinicion[]> {
	const db = getDB();
	if (!db) return [];
	
	return await db.logrosDefinicion.where('modo').equals(modo).toArray();
}

/**
 * Obtiene logros asociados a una escena específica
 */
export async function obtenerLogrosPorEscenaId(escenaId: string): Promise<LogroDefinicion[]> {
	const db = getDB();
	if (!db) return [];
	
	return await db.logrosDefinicion.where('escenaId').equals(escenaId).toArray();
}

/**
 * Obtiene un logro por su código único
 */
export async function obtenerLogroPorCodigo(codigo: string): Promise<LogroDefinicion | undefined> {
	const db = getDB();
	if (!db) return undefined;
	
	return await db.logrosDefinicion.where('codigo').equals(codigo).first();
}

/**
 * Obtiene logros generales (sin modo específico)
 */
export async function obtenerLogrosGenerales(): Promise<LogroDefinicion[]> {
	const db = getDB();
	if (!db) return [];
	
	const todos = await db.logrosDefinicion.toArray();
	return todos.filter(logro => !logro.modo);
}

// ============================================================================
// GESTIÓN DE LOGROS POR ARTISTA
// ============================================================================

/**
 * Obtiene el estado de todos los logros de un artista
 */
export async function obtenerLogrosDeArtista(artistaId: number): Promise<{
	definicion: LogroDefinicion;
	estado: LogroArtista;
}[]> {
	const db = getDB();
	if (!db) return [];
	
	const definiciones = await db.logrosDefinicion.toArray();
	const estados = await db.logrosArtista.where('artistaId').equals(artistaId).toArray();
	
	// Crear mapa de estados por logroId
	const estadosMap = new Map(estados.map(e => [e.logroId, e]));
	
	// Combinar definiciones con estados
	return definiciones.map(def => {
		const estado = estadosMap.get(def.id) || {
			id: generarUUID(),
			artistaId,
			logroId: def.id,
			desbloqueado: false,
			progresoParcial: 0
		};
		
		return { definicion: def, estado };
	});
}

/**
 * Obtiene solo los logros desbloqueados de un artista
 */
export async function obtenerLogrosDesbloqueados(artistaId: number): Promise<LogroDefinicion[]> {
	const db = getDB();
	if (!db) return [];
	
	const estadosDesbloqueados = await db.logrosArtista
		.where('artistaId').equals(artistaId)
		.and(estado => estado.desbloqueado === true)
		.toArray();
	
	const logroIds = estadosDesbloqueados.map(e => e.logroId);
	
	if (logroIds.length === 0) return [];
	
	return await db.logrosDefinicion.where('id').anyOf(logroIds).toArray();
}

/**
 * Obtiene logros desbloqueados por modo
 */
export async function obtenerLogrosDesbloqueadosPorModo(
	artistaId: number,
	modo: Modo
): Promise<LogroDefinicion[]> {
	const db = getDB();
	if (!db) return [];
	
	const estadosDesbloqueados = await db.logrosArtista
		.where('artistaId').equals(artistaId)
		.and(estado => estado.desbloqueado === true)
		.toArray();
	
	const logroIds = estadosDesbloqueados.map(e => e.logroId);
	
	if (logroIds.length === 0) return [];
	
	return await db.logrosDefinicion
		.where('id').anyOf(logroIds)
		.and(logro => logro.modo === modo)
		.toArray();
}

/**
 * Verifica si un artista tiene un logro desbloqueado
 */
export async function tieneLogroDesbloqueado(
	artistaId: number,
	codigoLogro: string
): Promise<boolean> {
	const db = getDB();
	if (!db) return false;
	
	const logro = await obtenerLogroPorCodigo(codigoLogro);
	if (!logro) return false;
	
	const estado = await db.logrosArtista
		.where('artistaId').equals(artistaId)
		.and(e => e.logroId === logro.id)
		.first();
	
	return estado?.desbloqueado ?? false;
}

// ============================================================================
// DESBLOQUEO DE LOGROS
// ============================================================================

/**
 * Desbloquea un logro para un artista
 * Actualiza el puntaje total del artista
 * @returns true si se desbloqueó exitosamente, false si ya estaba desbloqueado
 */
export async function desbloquearLogro(
	artistaId: number,
	codigoLogro: string
): Promise<boolean> {
	const db = getDB();
	if (!db) return false;
	
	const logro = await obtenerLogroPorCodigo(codigoLogro);
	if (!logro) {
		console.warn(`[Logros] Logro no encontrado: ${codigoLogro}`);
		return false;
	}
	
	// Verificar si ya está desbloqueado
	const yaDesbloqueado = await tieneLogroDesbloqueado(artistaId, codigoLogro);
	if (yaDesbloqueado) {
		return false;
	}
	
	// Crear o actualizar el estado del logro
	const estadoExistente = await db.logrosArtista
		.where('artistaId').equals(artistaId)
		.and(e => e.logroId === logro.id)
		.first();
	
	if (estadoExistente) {
		await db.logrosArtista.update(estadoExistente.id, {
			desbloqueado: true,
			fechaDesbloqueo: new Date()
		});
	} else {
		const nuevoEstado: LogroArtista = {
			id: generarUUID(),
			artistaId,
			logroId: logro.id,
			desbloqueado: true,
			fechaDesbloqueo: new Date(),
			progresoParcial: 100
		};
		await db.logrosArtista.add(nuevoEstado);
	}
	
	// Actualizar puntuación del artista
	await actualizarPuntuacionArtista(artistaId);
	
	console.log(`[Logros] Desbloqueado: ${logro.nombre} (+${logro.puntos} pts)`);
	
	return true;
}

/**
 * Actualiza el progreso parcial de un logro progresivo
 */
export async function actualizarProgresoLogro(
	artistaId: number,
	codigoLogro: string,
	progreso: number
): Promise<void> {
	const db = getDB();
	if (!db) return;
	
	const logro = await obtenerLogroPorCodigo(codigoLogro);
	if (!logro) return;
	
	// Limitar progreso entre 0 y 100
	const progresoLimitado = Math.max(0, Math.min(100, progreso));
	
	const estadoExistente = await db.logrosArtista
		.where('artistaId').equals(artistaId)
		.and(e => e.logroId === logro.id)
		.first();
	
	if (estadoExistente) {
		await db.logrosArtista.update(estadoExistente.id, {
			progresoParcial: progresoLimitado
		});
	} else {
		const nuevoEstado: LogroArtista = {
			id: generarUUID(),
			artistaId,
			logroId: logro.id,
			desbloqueado: false,
			progresoParcial: progresoLimitado
		};
		await db.logrosArtista.add(nuevoEstado);
	}
	
	// Si alcanzó el 100%, desbloquear automáticamente
	if (progresoLimitado >= 100) {
		await desbloquearLogro(artistaId, codigoLogro);
	}
}

// ============================================================================
// PUNTUACIÓN Y MEDALLAS
// ============================================================================

/**
 * Calcula el puntaje total de un artista sumando todos sus logros desbloqueados
 */
export async function calcularPuntajeTotal(artistaId: number): Promise<number> {
	const db = getDB();
	if (!db) return 0;
	
	const logrosDesbloqueados = await obtenerLogrosDesbloqueados(artistaId);
	
	return logrosDesbloqueados.reduce((total, logro) => total + logro.puntos, 0);
}

/**
 * Actualiza la puntuación total de un artista en su registro
 */
export async function actualizarPuntuacionArtista(artistaId: number): Promise<void> {
	const db = getDB();
	if (!db) return;
	
	const puntaje = await calcularPuntajeTotal(artistaId);
	
	await db.artistas.update(artistaId, {
		puntuacion: puntaje
	});
}

/**
 * Obtiene la medalla actual de un artista según su puntuación
 */
export async function obtenerMedallaActual(artistaId: number): Promise<UmbralMedalla | null> {
	const db = getDB();
	if (!db) return null;
	
	const artista = await db.artistas.get(artistaId);
	if (!artista) return null;
	
	const umbrales = await db.umbralesMedalla.toArray();
	
	// Ordenar de mayor a menor para encontrar la medalla más alta que cumple
	const umbralesOrdenados = umbrales.sort((a, b) => b.minPuntos - a.minPuntos);
	
	for (const umbral of umbralesOrdenados) {
		if (artista.puntuacion >= umbral.minPuntos && artista.puntuacion <= umbral.maxPuntos) {
			return umbral;
		}
	}
	
	return null;
}

/**
 * Obtiene todos los umbrales de medallas
 */
export async function obtenerTodosLosUmbrales(): Promise<UmbralMedalla[]> {
	const db = getDB();
	if (!db) return [];
	
	const umbrales = await db.umbralesMedalla.toArray();
	return umbrales.sort((a, b) => a.minPuntos - b.minPuntos);
}

/**
 * Calcula cuántos puntos faltan para la siguiente medalla
 */
export async function puntosParaSiguienteMedalla(artistaId: number): Promise<number | null> {
	const db = getDB();
	if (!db) return null;
	
	const artista = await db.artistas.get(artistaId);
	if (!artista) return null;
	
	const umbrales = await obtenerTodosLosUmbrales();
	
	// Encontrar el siguiente umbral
	const siguienteUmbral = umbrales.find(u => u.minPuntos > artista.puntuacion);
	
	if (!siguienteUmbral) {
		return null; // Ya tiene la medalla máxima
	}
	
	return siguienteUmbral.minPuntos - artista.puntuacion;
}

// ============================================================================
// ESTADÍSTICAS
// ============================================================================

/**
 * Obtiene estadísticas de logros de un artista
 */
export async function obtenerEstadisticasLogros(artistaId: number): Promise<{
	totalLogros: number;
	logrosDesbloqueados: number;
	porcentajeCompletado: number;
	puntajeTotal: number;
	medallaActual: UmbralMedalla | null;
	puntosParaSiguiente: number | null;
	logrosPorModo: {
		dibujo: { total: number; desbloqueados: number };
		cuerpoHumano: { total: number; desbloqueados: number };
		historias: { total: number; desbloqueados: number };
		generales: { total: number; desbloqueados: number };
	};
}> {
	const db = getDB();
	if (!db) {
		return {
			totalLogros: 0,
			logrosDesbloqueados: 0,
			porcentajeCompletado: 0,
			puntajeTotal: 0,
			medallaActual: null,
			puntosParaSiguiente: null,
			logrosPorModo: {
				dibujo: { total: 0, desbloqueados: 0 },
				cuerpoHumano: { total: 0, desbloqueados: 0 },
				historias: { total: 0, desbloqueados: 0 },
				generales: { total: 0, desbloqueados: 0 }
			}
		};
	}
	
	const todosLosLogros = await obtenerTodosLosLogros();
	const desbloqueados = await obtenerLogrosDesbloqueados(artistaId);
	const puntaje = await calcularPuntajeTotal(artistaId);
	const medalla = await obtenerMedallaActual(artistaId);
	const puntosSiguiente = await puntosParaSiguienteMedalla(artistaId);
	
	// Estadísticas por modo
	const logrosDibujo = todosLosLogros.filter(l => l.modo === 'dibujo');
	const logrosDesbloqueadosDibujo = desbloqueados.filter(l => l.modo === 'dibujo');
	
	const logrosCuerpo = todosLosLogros.filter(l => l.modo === 'cuerpoHumano');
	const logrosDesbloqueadosCuerpo = desbloqueados.filter(l => l.modo === 'cuerpoHumano');
	
	const logrosHistorias = todosLosLogros.filter(l => l.modo === 'historias');
	const logrosDesbloqueadosHistorias = desbloqueados.filter(l => l.modo === 'historias');
	
	const logrosGenerales = todosLosLogros.filter(l => !l.modo);
	const logrosDesbloqueadosGenerales = desbloqueados.filter(l => !l.modo);
	
	return {
		totalLogros: todosLosLogros.length,
		logrosDesbloqueados: desbloqueados.length,
		porcentajeCompletado: todosLosLogros.length > 0 
			? Math.round((desbloqueados.length / todosLosLogros.length) * 100) 
			: 0,
		puntajeTotal: puntaje,
		medallaActual: medalla,
		puntosParaSiguiente: puntosSiguiente,
		logrosPorModo: {
			dibujo: {
				total: logrosDibujo.length,
				desbloqueados: logrosDesbloqueadosDibujo.length
			},
			cuerpoHumano: {
				total: logrosCuerpo.length,
				desbloqueados: logrosDesbloqueadosCuerpo.length
			},
			historias: {
				total: logrosHistorias.length,
				desbloqueados: logrosDesbloqueadosHistorias.length
			},
			generales: {
				total: logrosGenerales.length,
				desbloqueados: logrosDesbloqueadosGenerales.length
			}
		}
	};
}

// ============================================================================
// VERIFICADORES AUTOMÁTICOS
// ============================================================================

/**
 * Verifica y desbloquea logros basados en el total de obras
 */
export async function verificarLogrosObras(artistaId: number): Promise<string[]> {
	const db = getDB();
	if (!db) return [];
	
	const obras = await db.obras.where('artistaId').equals(artistaId).toArray();
	const totalObras = obras.length;
	
	const logrosDesbloqueados: string[] = [];
	
	// Primera obra
	if (totalObras >= 1) {
		const desbloqueado = await desbloquearLogro(artistaId, 'PRIMERA_OBRA');
		if (desbloqueado) logrosDesbloqueados.push('PRIMERA_OBRA');
	}
	
	// Coleccionista novato (5 obras)
	if (totalObras >= 5) {
		const desbloqueado = await desbloquearLogro(artistaId, 'COLECCIONISTA_NOVATO');
		if (desbloqueado) logrosDesbloqueados.push('COLECCIONISTA_NOVATO');
	}
	
	// Coleccionista experto (20 obras)
	if (totalObras >= 20) {
		const desbloqueado = await desbloquearLogro(artistaId, 'COLECCIONISTA_EXPERTO');
		if (desbloqueado) logrosDesbloqueados.push('COLECCIONISTA_EXPERTO');
	}
	
	return logrosDesbloqueados;
}

/**
 * Verifica y desbloquea el logro de obra en todos los modos
 */
export async function verificarLogroMultimodal(artistaId: number): Promise<boolean> {
	const db = getDB();
	if (!db) return false;
	
	const obras = await db.obras.where('artistaId').equals(artistaId).toArray();
	
	const tieneDibujo = obras.some(o => o.modo === 'dibujo');
	const tieneCuerpo = obras.some(o => o.modo === 'cuerpoHumano');
	const tieneHistorias = obras.some(o => o.modo === 'historias');
	
	if (tieneDibujo && tieneCuerpo && tieneHistorias) {
		return await desbloquearLogro(artistaId, 'MAESTRO_MULTIMODAL');
	}
	
	return false;
}

/**
 * Verifica logros específicos del modo dibujo
 */
export async function verificarLogrosDibujo(artistaId: number, escenaId?: string): Promise<string[]> {
	const db = getDB();
	if (!db) return [];
	
	const obras = await db.obras
		.where('artistaId').equals(artistaId)
		.and(o => o.modo === 'dibujo')
		.toArray();
	
	const logrosDesbloqueados: string[] = [];
	
	// Primera escena completada
	if (obras.length >= 1) {
		const desbloqueado = await desbloquearLogro(artistaId, 'ESCENA_DIBUJO_COMPLETADA');
		if (desbloqueado) logrosDesbloqueados.push('ESCENA_DIBUJO_COMPLETADA');
	}
	
	// Maestro de escenas (10 escenas únicas)
	const escenasUnicas = new Set(obras.map(o => o.escenaId).filter(Boolean));
	if (escenasUnicas.size >= 10) {
		const desbloqueado = await desbloquearLogro(artistaId, 'MAESTRO_ESCENAS');
		if (desbloqueado) logrosDesbloqueados.push('MAESTRO_ESCENAS');
	}
	
	// Perfeccionista (3 versiones de la misma escena)
	if (escenaId) {
		const versionesEscena = obras.filter(o => o.escenaId === escenaId).length;
		if (versionesEscena >= 3) {
			const desbloqueado = await desbloquearLogro(artistaId, 'PERFECCIONISTA_DIBUJO');
			if (desbloqueado) logrosDesbloqueados.push('PERFECCIONISTA_DIBUJO');
		}
	}
	
	return logrosDesbloqueados;
}

/**
 * Verifica logros del modo cuerpo humano
 */
export async function verificarLogrosCuerpoHumano(
	artistaId: number,
	partesCorrectas: number,
	errores: number,
	tiempoSegundos: number
): Promise<string[]> {
	const logrosDesbloqueados: string[] = [];
	
	// Primer cuerpo completado
	const desbloqueado1 = await desbloquearLogro(artistaId, 'PRIMER_CUERPO');
	if (desbloqueado1) logrosDesbloqueados.push('PRIMER_CUERPO');
	
	// Anatomista experto (20 partes correctas)
	if (partesCorrectas >= 20) {
		const desbloqueado = await desbloquearLogro(artistaId, 'ANATOMISTA_EXPERTO');
		if (desbloqueado) logrosDesbloqueados.push('ANATOMISTA_EXPERTO');
	}
	
	// Cuerpo perfecto (sin errores)
	if (errores === 0) {
		const desbloqueado = await desbloquearLogro(artistaId, 'CUERPO_PERFECTO');
		if (desbloqueado) logrosDesbloqueados.push('CUERPO_PERFECTO');
	}
	
	// Velocista (menos de 2 minutos = 120 segundos)
	if (tiempoSegundos < 120) {
		const desbloqueado = await desbloquearLogro(artistaId, 'VELOCISTA_ANATOMIA');
		if (desbloqueado) logrosDesbloqueados.push('VELOCISTA_ANATOMIA');
	}
	
	return logrosDesbloqueados;
}

/**
 * Verifica logros del modo historias
 */
export async function verificarLogrosHistorias(
	artistaId: number,
	numeroEscenas?: number
): Promise<string[]> {
	const db = getDB();
	if (!db) return [];
	
	const historias = await db.obras
		.where('artistaId').equals(artistaId)
		.and(o => o.modo === 'historias')
		.toArray();
	
	const logrosDesbloqueados: string[] = [];
	
	// Primera historia
	if (historias.length >= 1) {
		const desbloqueado = await desbloquearLogro(artistaId, 'PRIMERA_HISTORIA');
		if (desbloqueado) logrosDesbloqueados.push('PRIMERA_HISTORIA');
	}
	
	// Cuentacuentos (5 historias)
	if (historias.length >= 5) {
		const desbloqueado = await desbloquearLogro(artistaId, 'CUENTACUENTOS');
		if (desbloqueado) logrosDesbloqueados.push('CUENTACUENTOS');
	}
	
	// Maestro narrativo (15 historias)
	if (historias.length >= 15) {
		const desbloqueado = await desbloquearLogro(artistaId, 'MAESTRO_NARRATIVO');
		if (desbloqueado) logrosDesbloqueados.push('MAESTRO_NARRATIVO');
	}
	
	// Escritor prolijo (historia con más de 10 escenas)
	if (numeroEscenas && numeroEscenas >= 10) {
		const desbloqueado = await desbloquearLogro(artistaId, 'ESCRITOR_PROLIJO');
		if (desbloqueado) logrosDesbloqueados.push('ESCRITOR_PROLIJO');
	}
	
	return logrosDesbloqueados;
}
