/**
 * bionic.ts - Lectura biónica (resaltado de primeras sílabas)
 * 
 * Convierte texto normal en formato de "lectura biónica" donde las primeras
 * sílabas o caracteres de cada palabra están resaltados (negrita/color)
 * para facilitar la lectura rápida.
 */

/**
 * Convierte texto a formato de lectura biónica
 * @param text Texto a convertir
 * @param intensity Intensidad del resaltado (0.3 = 30% de la palabra, 0.5 = 50%)
 * @returns Texto HTML con spans para resaltar
 */
export function applyBionic(text: string, intensity: number = 0.5): string {
	if (!text) return '';

	// Dividir en palabras manteniendo espacios y puntuación
	const words = text.split(/(\s+|[.,;:!?¿¡()])/);

	return words
		.map((word) => {
			// Si es espacio o puntuación, retornar tal cual
			if (/^\s+$/.test(word) || /^[.,;:!?¿¡()]$/.test(word)) {
				return word;
			}

			// Si la palabra tiene menos de 3 caracteres, resaltar toda
			if (word.length < 3) {
				return `<strong class="bionic-word">${word}</strong>`;
			}

			// Calcular cuántos caracteres resaltar
			const highlightLength = Math.ceil(word.length * intensity);
			const highlighted = word.slice(0, highlightLength);
			const rest = word.slice(highlightLength);

			return `<strong class="bionic-word">${highlighted}</strong><span class="bionic-rest">${rest}</span>`;
		})
		.join('');
}

/**
 * Aplica lectura biónica por sílabas (español)
 * @param text Texto a convertir
 * @returns Texto HTML con primeras sílabas resaltadas
 */
export function applyBionicBySyllable(text: string): string {
	if (!text) return '';

	const words = text.split(/(\s+|[.,;:!?¿¡()])/);

	return words
		.map((word) => {
			if (/^\s+$/.test(word) || /^[.,;:!?¿¡()]$/.test(word)) {
				return word;
			}

			// Detectar primera sílaba (simplificado para español)
			const firstSyllable = detectFirstSyllable(word);
			const rest = word.slice(firstSyllable.length);

			if (rest.length === 0) {
				return `<strong class="bionic-word">${word}</strong>`;
			}

			return `<strong class="bionic-word">${firstSyllable}</strong><span class="bionic-rest">${rest}</span>`;
		})
		.join('');
}

/**
 * Detecta la primera sílaba de una palabra (español)
 * Reglas simplificadas: busca primera vocal + consonante siguiente
 */
function detectFirstSyllable(word: string): string {
	const vowels = 'aeiouáéíóúAEIOUÁÉÍÓÚ';
	let syllable = '';

	for (let i = 0; i < word.length; i++) {
		syllable += word[i];

		// Si encontramos vocal
		if (vowels.includes(word[i])) {
			// Agregar consonantes siguientes hasta la próxima vocal
			for (let j = i + 1; j < word.length; j++) {
				if (vowels.includes(word[j])) {
					break;
				}
				syllable += word[j];
			}
			break;
		}
	}

	return syllable || word.slice(0, Math.ceil(word.length * 0.5));
}

/**
 * Elimina el formato biónico y retorna texto plano
 */
export function removeBionic(bionicText: string): string {
	return bionicText.replace(/<\/?[^>]+(>|$)/g, '');
}
