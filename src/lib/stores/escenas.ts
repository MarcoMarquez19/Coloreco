/**
 * Store de Svelte para gestionar el catálogo de escenas en la UI
 * Proporciona caché en memoria y funciones reactivas
 */

import { writable, derived, get } from 'svelte/store';
import type { EscenaCatalogo, Modo } from '$lib/db/schemas';
import {
	listarTodos,
	listarPorModo,
	obtenerPorId,
	sembrarIniciales
} from '$lib/db/escenas.service';
import { browser } from '$app/environment';

// Estado interno del store
interface EscenasState {
	escenas: EscenaCatalogo[];
	cargando: boolean;
	error: string | null;
	filtroModo: Modo | null;
	textoBusqueda: string;
}

const estadoInicial: EscenasState = {
	escenas: [],
	cargando: false,
	error: null,
	filtroModo: null,
	textoBusqueda: ''
};

// Store writable principal
const escenasState = writable<EscenasState>(estadoInicial);

/**
 * Carga todas las escenas del catálogo desde la BD
 */
export async function cargarTodas(): Promise<void> {
	if (!browser) {
		console.warn('[escenas.store] No se puede cargar en SSR');
		return;
	}

	escenasState.update((state) => ({ ...state, cargando: true, error: null }));

	try {
		const escenas = await listarTodos();
		escenasState.update((state) => ({
			...state,
			escenas,
			cargando: false,
			filtroModo: null,
			textoBusqueda: ''
		}));
	} catch (error) {
		console.error('[escenas.store] Error al cargar escenas:', error);
		escenasState.update((state) => ({
			...state,
			cargando: false,
			error: 'Error al cargar el catálogo de escenas'
		}));
	}
}

/**
 * Carga escenas filtradas por modo
 * @param modo - Modo a filtrar
 */
export async function cargarPorModo(modo: Modo): Promise<void> {
	if (!browser) {
		console.warn('[escenas.store] No se puede cargar en SSR');
		return;
	}

	escenasState.update((state) => ({ ...state, cargando: true, error: null }));

	try {
		const escenas = await listarPorModo(modo);
		escenasState.update((state) => ({
			...state,
			escenas,
			cargando: false,
			filtroModo: modo,
			textoBusqueda: ''
		}));
	} catch (error) {
		console.error(`[escenas.store] Error al cargar escenas del modo ${modo}:`, error);
		escenasState.update((state) => ({
			...state,
			cargando: false,
			error: `Error al cargar escenas del modo ${modo}`
		}));
	}
}

/**
 * Obtiene una escena específica por ID
 * @param id - ID de la escena
 */
export async function obtenerEscena(id: string): Promise<EscenaCatalogo | undefined> {
	if (!browser) {
		console.warn('[escenas.store] No se puede obtener escena en SSR');
		return undefined;
	}

	return await obtenerPorId(id);
}

/**
 * Establece un filtro de búsqueda por texto (nombre)
 * @param texto - Texto a buscar en el nombre de la escena
 */
export function buscarPorTexto(texto: string): void {
	escenasState.update((state) => ({
		...state,
		textoBusqueda: texto.toLowerCase()
	}));
}

/**
 * Limpia todos los filtros y recarga el catálogo completo
 */
export async function limpiarFiltros(): Promise<void> {
	await cargarTodas();
}

/**
 * Siembra el catálogo si está vacío
 * @param escenasIniciales - Array de escenas iniciales
 */
export async function inicializarCatalogo(
	escenasIniciales: Omit<EscenaCatalogo, 'id'>[]
): Promise<boolean> {
	if (!browser) return false;

	try {
		const sembrado = await sembrarIniciales(escenasIniciales);
		if (sembrado) {
			// Recargar después de sembrar
			await cargarTodas();
		}
		return sembrado;
	} catch (error) {
		console.error('[escenas.store] Error al inicializar catálogo:', error);
		return false;
	}
}

// Store derivado que filtra las escenas según los criterios activos
export const escenasFiltradas = derived(escenasState, ($state) => {
	let resultado = $state.escenas;

	// Filtrar por texto de búsqueda si existe
	if ($state.textoBusqueda) {
		resultado = resultado.filter((escena) =>
			escena.nombre.toLowerCase().includes($state.textoBusqueda)
		);
	}

	return resultado;
});

// Export del store de estado completo
export const escenasStore = {
	subscribe: escenasState.subscribe,
	cargarTodas,
	cargarPorModo,
	obtenerEscena,
	buscarPorTexto,
	limpiarFiltros,
	inicializarCatalogo
};

// Stores derivados de solo lectura para propiedades específicas
export const cargando = derived(escenasState, ($state) => $state.cargando);
export const error = derived(escenasState, ($state) => $state.error);
export const modoActual = derived(escenasState, ($state) => $state.filtroModo);
