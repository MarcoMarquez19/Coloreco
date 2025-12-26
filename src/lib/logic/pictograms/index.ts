/**
 * pictograms/index.ts - Sistema de pictogramas para apoyo visual
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
 * Diccionario de palabras a pictogramas
 */
export const PICTOGRAM_DICTIONARY: PictogramMapping[] = [
	// Acciones básicas
	{ word: 'comer', icon: '🍽️', category: 'accion' },
	{ word: 'beber', icon: '🥤', category: 'accion' },
	{ word: 'dormir', icon: '😴', category: 'accion' },
	{ word: 'correr', icon: '🏃', category: 'accion' },
	{ word: 'caminar', icon: '🚶', category: 'accion' },
	{ word: 'jugar', icon: '🎮', category: 'accion' },
	{ word: 'leer', icon: '📖', category: 'accion' },
	{ word: 'escribir', icon: '✍️', category: 'accion' },
	{ word: 'pintar', icon: '🎨', category: 'accion' },
	{ word: 'dibujar', icon: '✏️', category: 'accion' },
	{ word: 'iniciar', icon: '▶️', category: 'accion' },
	{ word: 'crear', icon: '➕', category: 'accion' },
	{ word: 'nuevo', icon: '🆕', category: 'accion' },
	{ word: 'volver', icon: '⬅️', category: 'accion' },

	// Lugares
	{ word: 'casa', icon: '🏠', category: 'lugar' },
	{ word: 'escuela', icon: '🏫', category: 'lugar' },
	{ word: 'parque', icon: '🏞️', category: 'lugar' },
	{ word: 'tienda', icon: '🏪', category: 'lugar' },
	{ word: 'hospital', icon: '🏥', category: 'lugar' },
	{ word: 'estudio', icon: '🎨', category: 'lugar' },

	// Emociones
	{ word: 'feliz', icon: '😊', category: 'emocion' },
	{ word: 'triste', icon: '😢', category: 'emocion' },
	{ word: 'enojado', icon: '😠', category: 'emocion' },
	{ word: 'sorprendido', icon: '😮', category: 'emocion' },
	{ word: 'asustado', icon: '😨', category: 'emocion' },
	{ word: 'bienvenido', icon: '👋', category: 'emocion' },

	// Colores
	{ word: 'rojo', icon: '🔴', category: 'color' },
	{ word: 'azul', icon: '🔵', category: 'color' },
	{ word: 'amarillo', icon: '🟡', category: 'color' },
	{ word: 'verde', icon: '🟢', category: 'color' },
	{ word: 'naranja', icon: '🟠', category: 'color' },
	{ word: 'morado', icon: '🟣', category: 'color' },

	// Animales
	{ word: 'perro', icon: '🐕', category: 'animal' },
	{ word: 'gato', icon: '🐈', category: 'animal' },
	{ word: 'pájaro', icon: '🐦', category: 'animal' },
	{ word: 'pez', icon: '🐟', category: 'animal' },
	{ word: 'mariposa', icon: '🦋', category: 'animal' },

	// Objetos comunes
	{ word: 'lápiz', icon: '✏️', category: 'objeto' },
	{ word: 'libro', icon: '📚', category: 'objeto' },
	{ word: 'pelota', icon: '⚽', category: 'objeto' },
	{ word: 'computadora', icon: '💻', category: 'objeto' },
	{ word: 'teléfono', icon: '📱', category: 'objeto' },
	
	// Conceptos relacionados con la app
	{ word: 'artista', icon: '🎨', category: 'concepto' },
	{ word: 'pintura', icon: '🖼️', category: 'concepto' },
	{ word: 'historia', icon: '📖', category: 'concepto' },
	{ word: 'ajustes', icon: '⚙️', category: 'concepto' },
	{ word: 'configuración', icon: '🔧', category: 'concepto' },
];

/**
 * Busca el pictograma correspondiente a una palabra
 * @param word Palabra a buscar
 * @returns Mapping del pictograma o null si no existe
 */
export function findPictogram(word: string): PictogramMapping | null {
	const normalized = word.toLowerCase().trim();
	return PICTOGRAM_DICTIONARY.find((p) => p.word === normalized) || null;
}

/**
 * Aplica pictogramas a un texto
 * @param text Texto original
 * @returns HTML con pictogramas insertados
 */
export function applyPictograms(text: string): string {
	const words = text.split(/(\s+|[.,;:!?¿¡()])/);

	return words
		.map((word) => {
			// Mantener espacios y puntuación
			if (/^\s+$/.test(word) || /^[.,;:!?¿¡()]$/.test(word)) {
				return word;
			}

			const pictogram = findPictogram(word);
			
			if (pictogram) {
				return `<span class="word-with-pictogram">
					<span class="pictogram-icon" title="${pictogram.category}">${pictogram.icon}</span>
					<span class="pictogram-word">${word}</span>
				</span>`;
			}

			return word;
		})
		.join('');
}

/**
 * Agrega un nuevo pictograma al diccionario (en tiempo de ejecución)
 */
export function addPictogram(mapping: PictogramMapping): void {
	const exists = PICTOGRAM_DICTIONARY.some((p) => p.word === mapping.word);
	if (!exists) {
		PICTOGRAM_DICTIONARY.push(mapping);
	}
}

/**
 * Obtiene todos los pictogramas por categoría
 */
export function getPictogramsByCategory(category: string): PictogramMapping[] {
	return PICTOGRAM_DICTIONARY.filter((p) => p.category === category);
}

/**
 * Obtiene todas las categorías disponibles
 */
export function getCategories(): string[] {
	return [...new Set(PICTOGRAM_DICTIONARY.map((p) => p.category))];
}
