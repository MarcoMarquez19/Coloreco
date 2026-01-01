/**
 * Store reactivo para gestión de logros
 * Maneja el estado de logros y proporciona funciones para desbloquearlos
 * 
 * @module stores/logros
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import * as logrosService from '$lib/db/logros.service';
import { LOGROS_HISTORIAS, LOGROS_CUERPO_HUMANO } from '$lib/db/schemas';
import type { LogroDefinicion, LogroArtista } from '$lib/db/schemas';

// ============================================================================
// TIPOS
// ============================================================================

export interface LogroConEstado {
	definicion: LogroDefinicion;
	estado: LogroArtista | null;
	desbloqueado: boolean;
	progreso: number;
}

export interface EstadisticasLogros {
	totalLogros: number;
	desbloqueados: number;
	rango: 'bronce' | 'plata' | 'oro' | null;
}

// ============================================================================
// STORES
// ============================================================================

/**
 * Store con todos los logros y su estado actual
 */
export const logros = writable<LogroConEstado[]>([]);

/**
 * Store con estadísticas de logros
 */
export const estadisticasLogros = writable<EstadisticasLogros>({
	totalLogros: 0,
	desbloqueados: 0,
	rango: null
});

/**
 * Store para notificaciones de logros recién desbloqueados
 */
export const logroDesbloqueado = writable<LogroDefinicion | null>(null);

/**
 * Logros filtrados solo de historias
 */
export const logrosHistorias = derived(
	logros,
	$logros => $logros.filter(l => l.definicion.modo === 'historias')
);

// ============================================================================
// TRACKING DE RESPUESTAS CONSECUTIVAS (POR ARTISTA)
// ============================================================================

/**
 * Map que guarda el contador de respuestas correctas consecutivas por artista.
 * Key: artistaId, Value: contador
 */
const respuestasConsecutivasPorArtista = new Map<number, number>();

/**
 * Resetea el contador de respuestas consecutivas para un artista o todos si no se pasa artistaId
 */
export function resetearRespuestasConsecutivas(artistaId?: number): void {
	if (typeof artistaId === 'number') {
		// Actualizar DB en background
		logrosService.resetearRachaArtista(artistaId).catch(e => console.error('[LogrosStore] Error reseteando racha en DB:', e));
		respuestasConsecutivasPorArtista.set(artistaId, 0);
		console.debug(`[LogrosStore] Racha reseteada para artista ${artistaId}`);
		return;
	}
	// Sin artistaId: limpiar todo (mantener compatibilidad)
	respuestasConsecutivasPorArtista.clear();
	console.debug('[LogrosStore] Racha reseteada para todos los artistas');
}

/**
 * Incrementa el contador de respuestas consecutivas para un artista
 * Devuelve la nueva racha (Promise<number>) para que el caller pueda esperar
 */
export async function incrementarRespuestasConsecutivas(artistaId: number): Promise<number> {
	try {
		const nueva = await logrosService.incrementarRachaArtista(artistaId);
		respuestasConsecutivasPorArtista.set(artistaId, nueva);
		console.debug(`[LogrosStore] Racha para artista ${artistaId}: ${nueva}`);
		return nueva;
	} catch (e) {
		// Fallback: incrementar en memoria si falla la DB
		const current = respuestasConsecutivasPorArtista.get(artistaId) ?? 0;
		const nuevo = current + 1;
		respuestasConsecutivasPorArtista.set(artistaId, nuevo);
		console.error('[LogrosStore] Error incrementando racha en DB, usando valor en memoria:', e);
		return nuevo;
	}
}

/**
 * Obtiene el contador actual para un artista
 */
export function obtenerRespuestasConsecutivas(artistaId?: number): number {
	if (typeof artistaId === 'number') {
		return respuestasConsecutivasPorArtista.get(artistaId) ?? 0;
	}
	// Sin artistaId: devolver 0 para evitar comportamiento global inesperado
	return 0;
}

// Sincronizar racha desde la DB al cargar logros de artista
export async function sincronizarRachaDesdeDB(artistaId: number): Promise<void> {
	try {
		const racha = await logrosService.obtenerRachaArtista(artistaId);
		respuestasConsecutivasPorArtista.set(artistaId, racha);
		console.debug(`[LogrosStore] Racha sincronizada desde DB para artista ${artistaId}: ${racha}`);
	} catch (e) {
		console.error('[LogrosStore] Error sincronizando racha desde DB:', e);
	}
} 

// ============================================================================
// FUNCIONES DE CARGA
// ============================================================================

/**
 * Carga los logros de un artista desde la base de datos
 * 
 * @param artistaId - ID del artista
 */
export async function cargarLogrosArtista(artistaId: number): Promise<void> {
	if (!browser) return;

	try {
		// Inicializar catálogo si es necesario
		await logrosService.inicializarCatalogoLogros();

		// Cargar logros con estado
		const logrosConEstado = await logrosService.obtenerLogrosArtista(artistaId);
		
		const logrosFormateados: LogroConEstado[] = logrosConEstado.map(({ definicion, estado }) => ({
			definicion,
			estado,
			desbloqueado: estado?.desbloqueado ?? false,
			progreso: estado?.progresoParcial ?? 0
		}));

		logros.set(logrosFormateados);

		// Cargar estadísticas
		const stats = await logrosService.obtenerEstadisticasLogros(artistaId);
		estadisticasLogros.set(stats);

		// Sincronizar la racha desde la DB para este artista (en vez de resetearla automáticamente)
		await sincronizarRachaDesdeDB(artistaId);

		console.log('[LogrosStore] Logros cargados:', logrosFormateados.length);
	} catch (error) {
		console.error('[LogrosStore] Error cargando logros:', error);
	}
}

/**
 * Recarga los logros (útil después de desbloquear uno)
 * 
 * @param artistaId - ID del artista
 */
export async function recargarLogros(artistaId: number): Promise<void> {
	await cargarLogrosArtista(artistaId);
}

// ============================================================================
// FUNCIONES DE DESBLOQUEO
// ============================================================================

/**
 * Desbloquea un logro y actualiza el store
 * 
 * @param artistaId - ID del artista
 * @param codigoLogro - Código del logro
 * @returns true si se desbloqueó, false si ya estaba desbloqueado
 */
export async function desbloquearLogro(artistaId: number, codigoLogro: string): Promise<boolean> {
	if (!browser) return false;

	console.log(`[LogrosStore] Intentando desbloquear logro: ${codigoLogro} para artista ${artistaId}`);
	const desbloqueado = await logrosService.desbloquearLogro(artistaId, codigoLogro);
	
	console.log(`[LogrosStore] Resultado de desbloqueo: ${desbloqueado}`);
	
	if (desbloqueado) {
		// Recargar logros
		await recargarLogros(artistaId);
		
		// Mostrar notificación
		const logro = await logrosService.obtenerLogroPorCodigo(codigoLogro);
		if (logro) {
			console.log(`[LogrosStore] Mostrando notificación de logro: ${logro.nombre}`);
			logroDesbloqueado.set(logro);
			// Limpiar notificación después de 5 segundos
			setTimeout(() => {
				logroDesbloqueado.set(null);
			}, 5000);
		}
	}

	return desbloqueado;
}

// ============================================================================
// LOGROS DE HISTORIAS
// ============================================================================

/**
 * Verifica y otorga el logro "Gran Lector" si se completó una historia
 * 
 * @param artistaId - ID del artista
 * @param historiaCompletada - Si se completó una historia
 */
export async function verificarGranLector(artistaId: number, historiaCompletada: boolean): Promise<void> {
	if (!historiaCompletada) return;
	
	const yaDesbloqueado = await logrosService.tieneLogroDesbloqueado(
		artistaId,
		LOGROS_HISTORIAS.GRAN_LECTOR
	);

	if (!yaDesbloqueado) {
		await desbloquearLogro(artistaId, LOGROS_HISTORIAS.GRAN_LECTOR);
	}
}

/**
 * Verifica y otorga el logro "Mente Brillante" si se respondieron 3 preguntas correctas seguidas
 * 
 * @param artistaId - ID del artista
 * @param respuestaCorrecta - Si la última respuesta fue correcta
 */
export async function verificarMenteBrillante(artistaId: number, respuestaCorrecta: boolean): Promise<void> {
	console.debug(`[LogrosStore] verificarMenteBrillante invoked para artista ${artistaId} - respuestaCorrecta=${respuestaCorrecta}`);
	if (respuestaCorrecta) {
		// Esperar al incremento para evitar condiciones de carrera
		const racha = await incrementarRespuestasConsecutivas(artistaId);
		console.debug(`[LogrosStore] Racha actual para artista ${artistaId}: ${racha}`);
		
		if (racha >= 3) {
			console.debug(`[LogrosStore] Intentando desbloquear Mente Brillante para artista ${artistaId}`);
			const yaDesbloqueado = await logrosService.tieneLogroDesbloqueado(
				artistaId,
				LOGROS_HISTORIAS.MENTE_BRILLANTE
			);

			if (!yaDesbloqueado) {
				await desbloquearLogro(artistaId, LOGROS_HISTORIAS.MENTE_BRILLANTE);
			}
		}
	} else {
		resetearRespuestasConsecutivas(artistaId);
	}
}

/**
 * Verifica y otorga el logro "Lector Alocado" si se completaron 2 historias
 * 
 * @param artistaId - ID del artista
 * @param historiasCompletadas - Número de historias completadas
 */
export async function verificarLectorAlocado(
	artistaId: number,
	historiasCompletadas: number
): Promise<void> {
	if (historiasCompletadas >= 2) {
		const yaDesbloqueado = await logrosService.tieneLogroDesbloqueado(
			artistaId,
			LOGROS_HISTORIAS.LECTOR_ALOCADO
		);

		if (!yaDesbloqueado) {
			await desbloquearLogro(artistaId, LOGROS_HISTORIAS.LECTOR_ALOCADO);
		}
	}
}

/**
 * Verifica y otorga el logro "Maestro de Historias" si se completaron todas las historias
 * 
 * @param artistaId - ID del artista
 * @param totalHistorias - Total de historias disponibles
 * @param historiasCompletadas - Número de historias completadas
 */
export async function verificarMaestroHistorias(
	artistaId: number,
	totalHistorias: number,
	historiasCompletadas: number
): Promise<void> {
	if (historiasCompletadas >= totalHistorias && totalHistorias > 0) {
		const yaDesbloqueado = await logrosService.tieneLogroDesbloqueado(
			artistaId,
			LOGROS_HISTORIAS.MAESTRO_HISTORIAS
		);

		if (!yaDesbloqueado) {
			await desbloquearLogro(artistaId, LOGROS_HISTORIAS.MAESTRO_HISTORIAS);
		}
	}
}

/**
 * Procesa los logros después de completar un capítulo
 * 
 * @param artistaId - ID del artista
 * @param respuestaCorrecta - Si la respuesta fue correcta
 * @param historiaCompletada - Si se completó toda la historia
 * @param totalHistorias - Total de historias disponibles
 * @param historiasCompletadas - Historias completadas por el artista
 */
export async function procesarLogrosHistorias(
	artistaId: number,
	respuestaCorrecta: boolean,
	historiaCompletada: boolean,
	totalHistorias: number,
	historiasCompletadas: number
): Promise<void> {
	if (!browser) return;

	try {
		// Verificar Mente Brillante
		await verificarMenteBrillante(artistaId, respuestaCorrecta);

		// Verificar Gran Lector
		if (historiaCompletada) {
			await verificarGranLector(artistaId, true);
		}

		// Verificar Lector Alocado si completó 2 historias
		await verificarLectorAlocado(artistaId, historiasCompletadas);

		// Verificar Maestro de Historias
		await verificarMaestroHistorias(artistaId, totalHistorias, historiasCompletadas);
	} catch (error) {
		console.error('[LogrosStore] Error procesando logros:', error);
	}
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Limpia las notificaciones de logros
 */
export function limpiarNotificaciones(): void {
	logroDesbloqueado.set(null);
}

/**
 * Obtiene el progreso hacia un logro específico
 * 
 * @param codigoLogro - Código del logro
 * @returns Progreso (0-100) o null si no se encuentra
 */
export function obtenerProgresoLogro(codigoLogro: string): number | null {
	const logrosActuales = get(logros);
	const logro = logrosActuales.find(l => l.definicion.codigo === codigoLogro);
	return logro?.progreso ?? null;
}

// ============================================================================
// LOGROS DE CUERPO HUMANO
// ============================================================================

/**
 * Verifica y otorga el logro "Primera Parte" cuando se coloca correctamente la primera parte
 * 
 * @param artistaId - ID del artista
 */
export async function verificarPrimeraParte(artistaId: number): Promise<void> {
	if (!browser) return;

	const yaDesbloqueado = await logrosService.tieneLogroDesbloqueado(
		artistaId,
		LOGROS_CUERPO_HUMANO.PRIMERA_PARTE
	);

	if (!yaDesbloqueado) {
		await desbloquearLogro(artistaId, LOGROS_CUERPO_HUMANO.PRIMERA_PARTE);
	}
}

/**
 * Verifica y otorga el logro "Anatomista Novato" cuando se completa la primera escena
 * 
 * @param artistaId - ID del artista
 */
export async function verificarAnatomistaNovato(artistaId: number): Promise<void> {
	if (!browser) return;

	const yaDesbloqueado = await logrosService.tieneLogroDesbloqueado(
		artistaId,
		LOGROS_CUERPO_HUMANO.ANATOMISTA_NOVATO
	);

	if (!yaDesbloqueado) {
		await desbloquearLogro(artistaId, LOGROS_CUERPO_HUMANO.ANATOMISTA_NOVATO);
	}
}

/**
 * Verifica y otorga el logro "Precisión Perfecta" cuando se completa una escena sin errores
 * 
 * @param artistaId - ID del artista
 * @param huboErrores - Si hubo errores durante la escena
 */
export async function verificarPrecisionPerfecta(artistaId: number, huboErrores: boolean): Promise<void> {
	if (!browser || huboErrores) return;

	const yaDesbloqueado = await logrosService.tieneLogroDesbloqueado(
		artistaId,
		LOGROS_CUERPO_HUMANO.PRECISION_PERFECTA
	);

	if (!yaDesbloqueado) {
		await desbloquearLogro(artistaId, LOGROS_CUERPO_HUMANO.PRECISION_PERFECTA);
	}
}

/**
 * Verifica y otorga el logro "Maestro de Anatomía" cuando se completan 3 escenas diferentes
 * 
 * @param artistaId - ID del artista
 * @param escenasCompletadas - Número de escenas completadas
 */
export async function verificarMaestroAnatomia(artistaId: number, escenasCompletadas: number): Promise<void> {
	if (!browser || escenasCompletadas < 3) return;

	const yaDesbloqueado = await logrosService.tieneLogroDesbloqueado(
		artistaId,
		LOGROS_CUERPO_HUMANO.MAESTRO_ANATOMIA
	);

	if (!yaDesbloqueado) {
		await desbloquearLogro(artistaId, LOGROS_CUERPO_HUMANO.MAESTRO_ANATOMIA);
	}
}

/**
 * Actualiza el progreso del logro "Experto en Órganos" acumulando partes colocadas
 * 
 * @param artistaId - ID del artista
 * @param partesColocadasTotal - Total acumulado de partes colocadas correctamente
 */
export async function verificarExpertoOrganos(artistaId: number, partesColocadasTotal: number): Promise<void> {
	if (!browser) return;

	// Actualizar progreso
	await logrosService.actualizarProgresoLogro(
		artistaId,
		LOGROS_CUERPO_HUMANO.EXPERTO_ORGANOS,
		partesColocadasTotal
	);

	// Verificar si alcanzó las 20 partes
	if (partesColocadasTotal >= 20) {
		const yaDesbloqueado = await logrosService.tieneLogroDesbloqueado(
			artistaId,
			LOGROS_CUERPO_HUMANO.EXPERTO_ORGANOS
		);

		if (!yaDesbloqueado) {
			await desbloquearLogro(artistaId, LOGROS_CUERPO_HUMANO.EXPERTO_ORGANOS);
		}
	}
}

/**
 * Procesa todos los logros al colocar una parte correctamente
 * 
 * @param artistaId - ID del artista
 * @param esPrimeraParte - Si es la primera parte colocada por el artista
 * @param partesColocadasTotal - Total acumulado de partes colocadas correctamente
 */
export async function procesarLogroParteColocada(
	artistaId: number,
	esPrimeraParte: boolean,
	partesColocadasTotal: number
): Promise<void> {
	if (!browser) return;

	try {
		// Primera Parte (solo la primera vez)
		if (esPrimeraParte) {
			await verificarPrimeraParte(artistaId);
		}

		// Experto en Órganos (acumulativo)
		await verificarExpertoOrganos(artistaId, partesColocadasTotal);
	} catch (error) {
		console.error('[LogrosStore] Error procesando logro de parte colocada:', error);
	}
}

/**
 * Procesa todos los logros al completar una escena del modo Cuerpo Humano
 * 
 * @param artistaId - ID del artista
 * @param esPrimeraEscena - Si es la primera escena completada
 * @param escenasCompletadas - Total de escenas completadas
 * @param huboErrores - Si hubo errores durante la escena
 */
export async function procesarLogrosEscenaCompletada(
	artistaId: number,
	esPrimeraEscena: boolean,
	escenasCompletadas: number,
	huboErrores: boolean
): Promise<void> {
	if (!browser) return;

	try {
		// Anatomista Novato (primera escena)
		if (esPrimeraEscena) {
			await verificarAnatomistaNovato(artistaId);
		}

		// Precisión Perfecta (sin errores)
		if (!huboErrores) {
			await verificarPrecisionPerfecta(artistaId, false);
		}

		// Maestro de Anatomía (3 escenas)
		if (escenasCompletadas >= 3) {
			await verificarMaestroAnatomia(artistaId, escenasCompletadas);
		}
	} catch (error) {
		console.error('[LogrosStore] Error procesando logros de escena completada:', error);
	}
}
