/**
 * pictograms.ts - Sistema de pictogramas para apoyo visual
 * 
 * Mapea palabras clave a iconos/pictogramas para facilitar
 * la comprensión lectora, especialmente útil para niños
 * y personas con dificultades de aprendizaje.
 */

export interface PictogramMapping {
	word: string;
	icon: string; // ruta al icono o emoji
	category: string;
}

/**
 * Cache del diccionario de pictogramas
 */
let pictogramCache: PictogramMapping[] | null = null;

/**
 * Carga el diccionario de pictogramas desde el archivo JSON
 */
async function loadPictogramDictionary(): Promise<PictogramMapping[]> {
	if (pictogramCache !== null) {
		return pictogramCache;
	}
	
	try {
		const response = await fetch('/pictograms/pictogramas.json');
		if (!response.ok) {
			throw new Error(`Error cargando pictogramas: ${response.status}`);
		}
		pictogramCache = await response.json();
		return pictogramCache as PictogramMapping[];
	} catch (error) {
		console.error('Error al cargar diccionario de pictogramas:', error);
		return [];
	}
}



/**
 * Busca el pictograma correspondiente a una palabra (búsqueda case-insensitive)
 * @param word Palabra a buscar
 * @returns Mapping del pictograma o null si no existe
 */
export async function findPictogram(word: string): Promise<PictogramMapping | null> {
	const dictionary = await loadPictogramDictionary();
	const normalized = word.toLowerCase().trim();
	return dictionary.find((p) => p.word === normalized) || null;
}

/**
 * Versión síncrona de findPictogram (requiere que el diccionario esté precargado)
 * @param word Palabra a buscar
 * @returns Mapping del pictograma o null si no existe
 */
export function findPictogramSync(word: string): PictogramMapping | null {
	if (!pictogramCache) {
		console.warn('Diccionario de pictogramas no cargado. Llama a loadPictogramDictionary() primero.');
		return null;
	}
	const normalized = word.toLowerCase().trim();
	return pictogramCache.find((p) => p.word === normalized) || null;
}

/**
 * Precarga el diccionario de pictogramas
 */
export async function preloadPictograms(): Promise<void> {
	await loadPictogramDictionary();
}

/**
 * Aplica pictogramas a un texto con sistema de popover (bajo demanda)
 * @param text Texto original
 * @returns HTML con palabras interactivas que muestran pictogramas al hover/focus
 * @deprecated Esta función no se usa actualmente - el procesamiento se hace en +layout.svelte
 */
export async function applyPictogramsWithPopover(text: string): Promise<string> {
	const words = text.split(/(\s+|[.,;:!?¿¡()])/);
	const results: string[] = [];

	for (const word of words) {
		// Mantener espacios y puntuación
		if (/^\s+$/.test(word) || /^[.,;:!?¿¡()]$/.test(word)) {
			results.push(word);
			continue;
		}

		const pictogram = await findPictogram(word);
			
			if (pictogram) {
				// Palabra con pictograma disponible - usar button para accesibilidad
			results.push(`<span class="pictogram-wrapper">
				<button class="pictogram-word" 
					type="button" 
					aria-label="${word} - Ver pictograma"
					aria-haspopup="true"
					data-pictogram-icon="${pictogram.icon}"
					data-pictogram-category="${pictogram.category}">
					${word}
				</button>
				<div class="pictogram-popover" role="tooltip" aria-hidden="true">
					<span class="pictogram-icon">${pictogram.icon}</span>
				</div>
			</span>`);
		} else {
			results.push(word);
		}
	}

	return results.join('');
}

/**
 * Aplica pictogramas a un texto (versión original - muestra siempre el icono)
 * @param text Texto original
 * @returns HTML con pictogramas insertados
 * @deprecated Esta función no se usa actualmente - el procesamiento se hace en +layout.svelte
 */
export async function applyPictograms(text: string): Promise<string> {
	const words = text.split(/(\s+|[.,;:!?¿¡()])/);
	const results: string[] = [];

	for (const word of words) {
		// Mantener espacios y puntuación
		if (/^\s+$/.test(word) || /^[.,;:!?¿¡()]$/.test(word)) {
			results.push(word);
			continue;
		}

		const pictogram = await findPictogram(word);
		
		if (pictogram) {
			// Pictograma ENCIMA de la palabra para mejor legibilidad en niños
			results.push(`<span class="word-with-pictogram">
				<span class="pictogram-icon" title="${pictogram.category}" aria-hidden="true">${pictogram.icon}</span>
				<span class="pictogram-word">${word}</span>
			</span>`);
		} else {
			results.push(word);
		}
	}

	return results.join('');
}

/**
 * Agrega un nuevo pictograma al diccionario (en tiempo de ejecución)
 */
export async function addPictogram(mapping: PictogramMapping): Promise<void> {
	const dictionary = await loadPictogramDictionary();
	const exists = dictionary.some((p) => p.word === mapping.word);
	if (!exists && pictogramCache) {
		pictogramCache.push(mapping);
	}
}

/**
 * Obtiene todos los pictogramas por categoría
 */
export async function getPictogramsByCategory(category: string): Promise<PictogramMapping[]> {
	const dictionary = await loadPictogramDictionary();
	return dictionary.filter((p) => p.category === category);
}

/**
 * Obtiene todas las categorías disponibles
 */
export async function getCategories(): Promise<string[]> {
	const dictionary = await loadPictogramDictionary();
	return [...new Set(dictionary.map((p) => p.category))];
}
