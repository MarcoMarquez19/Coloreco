/**
 * Servicio de gestión de obras de arte
 * Funciones para crear, recuperar y eliminar dibujos de la galería
 * 
 * @module db/obras.service
 */

import { getDB } from './database';
import type { Obra, ObraBlob } from './schemas';

/**
 * Datos necesarios para crear una nueva obra
 */
export interface DatosNuevaObra {
	artistaId: number;
	titulo: string;
	descripcion: string;
	modo: 'dibujo' | 'cuerpoHumano' | 'historias';
	blob: Blob;
	mime: string;
	escenaId?: string;
	etiquetas?: string[];
	alt?: string;
}

/**
 * Obra completa con su blob de imagen
 */
export interface ObraCompleta extends Obra {
	imagen?: Blob | ArrayBuffer;
	urlImagen?: string;
}

/**
 * Guarda una nueva obra en la base de datos
 * Crea tanto los metadatos (tabla obras) como el blob binario (tabla obrasBlobs)
 * 
 * @param datos - Información de la obra a guardar
 * @returns ID único (UUID) de la obra creada
 */
export async function guardarObra(datos: DatosNuevaObra): Promise<string> {
	const db = getDB();
	if (!db) {
		throw new Error('Base de datos no disponible');
	}
	
	const ahora = new Date();
	
	// Generar UUID simple
	const id = crypto.randomUUID();
	
	// Crear registro de metadatos
	const obra: Obra = {
		id,
		artistaId: datos.artistaId,
		titulo: datos.titulo,
		descripcion: datos.descripcion,
		modo: datos.modo,
		escenaId: datos.escenaId,
		fechaCreacion: ahora,
		fechaActualizacion: ahora,
		mime: datos.mime,
		etiquetas: datos.etiquetas || [],
		alt: datos.alt || `Dibujo titulado ${datos.titulo}`,
		editable: true,
		version: 1
	};
	
	// Crear registro de blob
	const obraBlob: ObraBlob = {
		idObra: id,
		blob: datos.blob
	};
	
	// Guardar en transacción para garantizar atomicidad
	await db.transaction('rw', [db.obras, db.obrasBlobs], async () => {
		await db.obras.add(obra);
		await db.obrasBlobs.add(obraBlob);
	});
	
	console.log(`[ObrasService] Obra guardada: ${id} - "${datos.titulo}"`);
	return id;
}

/**
 * Recupera todas las obras de un artista específico
 * Incluye metadatos e imágenes, ordenadas por fecha de creación (más recientes primero)
 * 
 * @param artistaId - ID del artista
 * @returns Array de obras completas con sus imágenes
 */
export async function obtenerObras(artistaId: number): Promise<ObraCompleta[]> {
	const db = getDB();
	if (!db) {
		throw new Error('Base de datos no disponible');
	}
	
	// Obtener metadatos ordenados por fecha
	const obras = await db.obras
		.where('artistaId')
		.equals(artistaId)
		.reverse() // Más recientes primero
		.sortBy('fechaCreacion');
	
	// Cargar blobs asociados
	const obrasCompletas: ObraCompleta[] = [];
	
	for (const obra of obras) {
		const obraBlob = await db.obrasBlobs.get(obra.id);
		
		// Convertir blob a URL para mostrar en <img>
		let urlImagen: string | undefined;
		if (obraBlob?.blob) {
			const blob = obraBlob.blob instanceof Blob 
				? obraBlob.blob 
				: new Blob([obraBlob.blob], { type: obra.mime });
			urlImagen = URL.createObjectURL(blob);
		}
		
		obrasCompletas.push({
			...obra,
			imagen: obraBlob?.blob,
			urlImagen
		});
	}
	
	console.log(`[ObrasService] Recuperadas ${obrasCompletas.length} obras del artista ${artistaId}`);
	return obrasCompletas;
}

/**
 * Recupera una obra específica por su ID
 * Incluye metadatos e imagen
 * 
 * @param obraId - UUID de la obra
 * @returns Obra completa con su imagen o null si no existe
 */
export async function obtenerObraPorId(obraId: string): Promise<ObraCompleta | null> {
	const db = getDB();
	if (!db) {
		throw new Error('Base de datos no disponible');
	}
	
	// Obtener metadatos
	const obra = await db.obras.get(obraId);
	if (!obra) {
		console.log(`[ObrasService] Obra no encontrada: ${obraId}`);
		return null;
	}
	
	// Cargar blob asociado
	const obraBlob = await db.obrasBlobs.get(obra.id);
	
	// Convertir blob a URL para mostrar en <img>
	let urlImagen: string | undefined;
	if (obraBlob?.blob) {
		const blob = obraBlob.blob instanceof Blob 
			? obraBlob.blob 
			: new Blob([obraBlob.blob], { type: obra.mime });
		urlImagen = URL.createObjectURL(blob);
	}
	
	const obraCompleta: ObraCompleta = {
		...obra,
		imagen: obraBlob?.blob,
		urlImagen
	};
	
	console.log(`[ObrasService] Obra recuperada: ${obraId} - "${obra.titulo}"`);
	return obraCompleta;
}

/**
 * Elimina una obra de la base de datos
 * Borra tanto metadatos como blob asociado
 * 
 * @param obraId - UUID de la obra a eliminar
 * @returns true si se eliminó correctamente
 */
export async function eliminarObra(obraId: string): Promise<boolean> {
	const db = getDB();
	if (!db) {
		throw new Error('Base de datos no disponible');
	}
	
	try {
		// Eliminar en transacción para garantizar consistencia
		await db.transaction('rw', [db.obras, db.obrasBlobs, db.miniaturasBlobs], async () => {
			await db.obras.delete(obraId);
			await db.obrasBlobs.delete(obraId);
			
			// Si existe miniatura, eliminarla también
			const miniatura = await db.miniaturasBlobs.get(obraId);
			if (miniatura) {
				await db.miniaturasBlobs.delete(obraId);
			}
		});
		
		console.log(`[ObrasService] Obra eliminada: ${obraId}`);
		return true;
	} catch (error) {
		console.error(`[ObrasService] Error eliminando obra ${obraId}:`, error);
		return false;
	}
}

/**
 * Libera las URLs de objetos creadas para las imágenes
 * Debe llamarse cuando las obras ya no se muestren para evitar fugas de memoria
 * 
 * @param obras - Array de obras con URLs de imagen
 */
export function liberarURLsImagenes(obras: ObraCompleta[]): void {
	obras.forEach(obra => {
		if (obra.urlImagen) {
			URL.revokeObjectURL(obra.urlImagen);
		}
	});
}
