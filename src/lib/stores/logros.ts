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
// TRACKING DE RESPUESTAS CONSECUTIVAS
// ============================================================================

/**
 * Contador de respuestas correctas consecutivas
 */
let respuestasCorrectasConsecutivas = 0;

/**
 * Resetea el contador de respuestas consecutivas
 */
export function resetearRespuestasConsecutivas(): void {
	respuestasCorrectasConsecutivas = 0;
}

/**
 * Incrementa el contador de respuestas consecutivas
 */
export function incrementarRespuestasConsecutivas(): void {
	respuestasCorrectasConsecutivas++;
}

/**
 * Obtiene el contador actual
 */
export function obtenerRespuestasConsecutivas(): number {
	return respuestasCorrectasConsecutivas;
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
	if (respuestaCorrecta) {
		incrementarRespuestasConsecutivas();
		
		if (obtenerRespuestasConsecutivas() >= 3) {
			const yaDesbloqueado = await logrosService.tieneLogroDesbloqueado(
				artistaId,
				LOGROS_HISTORIAS.MENTE_BRILLANTE
			);

			if (!yaDesbloqueado) {
				await desbloquearLogro(artistaId, LOGROS_HISTORIAS.MENTE_BRILLANTE);
			}
		}
	} else {
		resetearRespuestasConsecutivas();
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
