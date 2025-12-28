/**
 * Lógica de negocio para el sistema de historias
 * Combina datos del JSON estático con el progreso de la base de datos
 * 
 * @module logic/historias
 */

import type { ProgresoHistoria, ProgresoCapitulo } from '$lib/db/schemas';
import * as historiasService from '$lib/db/historias.service';

/**
 * Información de un capítulo desde el JSON
 */
export interface CapituloJSON {
	id: number;
	nombre: string;
	imagen: string;
	desbloqueado: boolean;
}

/**
 * Información de una historia desde el JSON
 */
export interface HistoriaJSON {
	historiaId: string;
	titulo: string;
	imagen: string;
	progreso: number;
	totalCapitulos: number;
	version: number;
	capitulos: CapituloJSON[];
}

/**
 * Capítulo con estado de progreso
 */
export interface CapituloConProgreso {
	id: number;
	nombre: string;
	imagen: string;
	desbloqueado: boolean;
	completado: boolean;
	intentos: number;
}

/**
 * Historia con progreso completo
 */
export interface HistoriaConProgreso {
	historiaId: string;
	titulo: string;
	imagen: string;
	capituloActual: number;
	totalCapitulos: number;
	completada: boolean;
	capitulos: CapituloConProgreso[];
}

/**
 * Carga todas las historias desde el JSON estático
 * 
 * @returns Array de historias o array vacío si hay error
 */
export async function cargarHistoriasJSON(): Promise<HistoriaJSON[]> {
	try {
		const response = await fetch('/historias/historias.json');
		if (!response.ok) {
			throw new Error('Error al cargar historias');
		}
		return await response.json();
	} catch (error) {
		console.error('Error cargando historias JSON:', error);
		return [];
	}
}

/**
 * Carga una historia específica desde el JSON
 * 
 * @param historiaId - ID de la historia
 * @returns Historia o null si no se encuentra
 */
export async function cargarHistoriaJSON(historiaId: string): Promise<HistoriaJSON | null> {
	const historias = await cargarHistoriasJSON();
	return historias.find(h => h.historiaId === historiaId) ?? null;
}

/**
 * Combina la información del JSON con el progreso de la BD
 * 
 * @param artistaId - ID del artista actual
 * @param historiaJSON - Historia desde el JSON
 * @returns Historia con progreso completo
 */
export async function combinarHistoriaConProgreso(
	artistaId: number,
	historiaJSON: HistoriaJSON
): Promise<HistoriaConProgreso> {
	// Obtener o crear progreso en la BD
	const progresoHistoria = await historiasService.obtenerProgresoHistoria(
		artistaId,
		historiaJSON.historiaId,
		historiaJSON.totalCapitulos
	);

	// Si no hay progreso (sin BD), usar valores por defecto
	if (!progresoHistoria) {
		return {
			historiaId: historiaJSON.historiaId,
			titulo: historiaJSON.titulo,
			imagen: historiaJSON.imagen,
			capituloActual: 1,
			totalCapitulos: historiaJSON.totalCapitulos,
			completada: false,
			capitulos: historiaJSON.capitulos.map((cap, idx) => ({
				id: cap.id,
				nombre: cap.nombre,
				imagen: cap.imagen,
				desbloqueado: idx === 0, // Solo el primero desbloqueado
				completado: false,
				intentos: 0
			}))
		};
	}

	// Combinar datos del JSON con progreso de BD
	const capitulos: CapituloConProgreso[] = historiaJSON.capitulos.map(capJSON => {
		const progresoCap = progresoHistoria.capitulos.find(
			p => p.numeroCapitulo === capJSON.id
		);

		return {
			id: capJSON.id,
			nombre: capJSON.nombre,
			imagen: capJSON.imagen,
			desbloqueado: progresoCap?.desbloqueado ?? false,
			completado: progresoCap?.completado ?? false,
			intentos: progresoCap?.intentos ?? 0
		};
	});

	return {
		historiaId: historiaJSON.historiaId,
		titulo: historiaJSON.titulo,
		imagen: historiaJSON.imagen,
		capituloActual: progresoHistoria.capituloActual,
		totalCapitulos: historiaJSON.totalCapitulos,
		completada: progresoHistoria.completada,
		capitulos
	};
}

/**
 * Obtiene todas las historias con su progreso para un artista
 * 
 * @param artistaId - ID del artista
 * @returns Array de historias con progreso
 */
export async function obtenerHistoriasConProgreso(
	artistaId: number
): Promise<HistoriaConProgreso[]> {
	const historiasJSON = await cargarHistoriasJSON();
	
	const historiasConProgreso = await Promise.all(
		historiasJSON.map(h => combinarHistoriaConProgreso(artistaId, h))
	);

	return historiasConProgreso;
}

/**
 * Calcula el número de capítulos completados de una historia
 * 
 * @param historia - Historia con progreso
 * @returns Número de capítulos completados
 */
export function calcularCapitulosCompletados(historia: HistoriaConProgreso): number {
	return historia.capitulos.filter(c => c.completado).length;
}

/**
 * Calcula el porcentaje de completitud de una historia
 * 
 * @param historia - Historia con progreso
 * @returns Porcentaje (0-100)
 */
export function calcularPorcentajeCompletitud(historia: HistoriaConProgreso): number {
	if (historia.totalCapitulos === 0) return 0;
	const completados = calcularCapitulosCompletados(historia);
	return Math.round((completados / historia.totalCapitulos) * 100);
}

/**
 * Maneja el resultado de responder una pregunta en un capítulo
 * 
 * @param artistaId - ID del artista
 * @param historiaId - ID de la historia
 * @param numeroCapitulo - Número del capítulo
 * @param respuestaCorrecta - Si la respuesta fue correcta
 * @returns true si se procesó correctamente
 */
export async function procesarRespuesta(
	artistaId: number,
	historiaId: string,
	numeroCapitulo: number,
	respuestaCorrecta: boolean
): Promise<boolean> {
	// Incrementar intentos
	await historiasService.incrementarIntentos(artistaId, historiaId, numeroCapitulo);

	// Si la respuesta es correcta, completar el capítulo
	if (respuestaCorrecta) {
		return await historiasService.completarCapitulo(artistaId, historiaId, numeroCapitulo);
	}

	return true;
}

/**
 * Verifica si un capítulo puede ser jugado (está desbloqueado)
 * 
 * @param artistaId - ID del artista
 * @param historiaId - ID de la historia
 * @param numeroCapitulo - Número del capítulo
 * @returns true si puede jugarse
 */
export async function puedeJugarCapitulo(
	artistaId: number,
	historiaId: string,
	numeroCapitulo: number
): Promise<boolean> {
	return await historiasService.estaCapituloDesbloqueado(
		artistaId,
		historiaId,
		numeroCapitulo
	);
}

/**
 * Carga un capítulo desde el JSON
 * 
 * @param historiaId - ID de la historia
 * @param numeroCapitulo - Número del capítulo
 * @returns Datos del capítulo o null si hay error
 */
export async function cargarCapituloJSON(
	historiaId: string,
	numeroCapitulo: number
): Promise<any | null> {
	try {
		const response = await fetch(`/historias/${historiaId}/cap${numeroCapitulo}.json`);
		if (!response.ok) {
			throw new Error('Error al cargar capítulo');
		}
		return await response.json();
	} catch (error) {
		console.error('Error cargando capítulo JSON:', error);
		return null;
	}
}

/**
 * Verifica si es el último capítulo de una historia
 * 
 * @param historiaId - ID de la historia
 * @param numeroCapitulo - Número del capítulo actual
 * @returns true si es el último capítulo
 */
export async function esUltimoCapitulo(
	historiaId: string,
	numeroCapitulo: number
): Promise<boolean> {
	const historia = await cargarHistoriaJSON(historiaId);
	if (!historia) return false;
	return numeroCapitulo === historia.totalCapitulos;
}
