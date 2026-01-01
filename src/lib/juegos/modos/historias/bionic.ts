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

	// Debug: log en modo desarrollo para confirmar ejecución
	// eslint-disable-next-line no-console
	if (typeof window !== 'undefined' && (import.meta.env && import.meta.env.DEV)) {
		console.debug('[bionic] applyBionic called', { text: text.slice(0, 100), intensity });
	}

	// Dividir en palabras manteniendo espacios y puntuación
	const words = text.split(/(\s+|[.,;:!?¿¡()])/);

	return words
		.map((word) => {
			// Si es espacio o puntuación, retornar tal cual
			if (/^\s+$/.test(word) || /^[.,;:!?¿¡()]$/.test(word)) {
				return word;
			}

			const len = word.length;
			const highlightLength = getHighlightLength(len, intensity);
			const highlighted = word.slice(0, highlightLength);
			const rest = word.slice(highlightLength);

			// Si no queda resto, resaltar toda la palabra
			if (rest.length === 0) {
				return `<strong class="bionic-word">${word}</strong>`;
			}

			return `<strong class="bionic-word">${highlighted}</strong><span class="bionic-rest">${rest}</span>`;
		})
		.join('');
}

/**
 * Calcula cuántos caracteres resaltar según la longitud de la palabra
 * Reglas:
 * - 1-3 letras: resaltar la primera letra
 * - 4 letras: resaltar 2 letras
 * - 5-6 letras: resaltar 3 letras
 * - 7+ letras: resaltar aproximadamente 40% - 50% (se usa `intensity` y se clampa entre 0.4 y 0.5)
 */
function getHighlightLength(wordLength: number, intensity: number): number {
	if (wordLength <= 3) return 1;
	if (wordLength === 4) return 2;
	if (wordLength === 5 || wordLength === 6) return 3;

	// Para palabras largas, usar intensidad entre 40% y 50%
	const minPct = 0.4;
	const maxPct = 0.5;
	const pct = Math.max(minPct, Math.min(intensity, maxPct));

	// Asegurarnos de no resaltar toda la palabra y que al menos 1 carácter sea resaltado
	return Math.min(wordLength - 1, Math.max(1, Math.ceil(wordLength * pct)));
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
