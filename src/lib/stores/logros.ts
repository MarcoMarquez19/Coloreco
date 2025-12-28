/**
 * Store reactivo para gestión de logros
 * Maneja el estado de logros y proporciona funciones para desbloquearlos
 * 
 * @module stores/logros
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import * as logrosService from '$lib/db/logros.service';
import { LOGROS_HISTORIAS } from '$lib/db/schemas';
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

	const desbloqueado = await logrosService.desbloquearLogro(artistaId, codigoLogro);
	
	if (desbloqueado) {
		// Recargar logros
		await recargarLogros(artistaId);
		
		// Mostrar notificación
		const logro = await logrosService.obtenerLogroPorCodigo(codigoLogro);
		if (logro) {
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
// VERIFICADORES DE LOGROS DE HISTORIAS
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
