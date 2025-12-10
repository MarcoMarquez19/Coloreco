/**
 * rhyme.ts - Detección y resaltado de rimas y sílabas
 * 
 * Procesa texto para identificar patrones de rima y asignar colores
 * a sílabas o terminaciones similares.
 */

export interface RhymePattern {
	word: string;
	rhymeGroup: number;
	color: string;
}

// Paleta de colores para rimas
const RHYME_COLORS = [
	'#FF6B6B', // rojo suave
	'#4ECDC4', // turquesa
	'#FFE66D', // amarillo
	'#95E1D3', // verde menta
	'#F38181', // rosa coral
	'#AA96DA', // lavanda
	'#FCBAD3', // rosa pastel
	'#A8D8EA', // azul cielo
];

/**
 * Detecta patrones de rima en un texto
 * @param text Texto a analizar
 * @returns Array de palabras con su grupo de rima y color asignado
 */
export function detectRhymes(text: string): RhymePattern[] {
	const words = text
		.toLowerCase()
		.replace(/[.,;:!?¿¡()]/g, '')
		.split(/\s+/)
		.filter((w) => w.length > 2);

	const rhymeGroups = new Map<string, number>();
	let groupCounter = 0;

	const patterns: RhymePattern[] = words.map((word) => {
		const ending = getWordEnding(word);
		
		if (!rhymeGroups.has(ending)) {
			rhymeGroups.set(ending, groupCounter);
			groupCounter++;
		}

		const groupId = rhymeGroups.get(ending)!;
		const color = RHYME_COLORS[groupId % RHYME_COLORS.length];

		return {
			word,
			rhymeGroup: groupId,
			color,
		};
	});

	return patterns;
}

/**
 * Obtiene la terminación de una palabra para detectar rima
 * (últimas 2-3 letras o desde última vocal acentuada)
 */
function getWordEnding(word: string): string {
	const vowels = 'aeiouáéíóú';
	
	// Buscar última vocal
	let lastVowelIndex = -1;
	for (let i = word.length - 1; i >= 0; i--) {
		if (vowels.includes(word[i])) {
			lastVowelIndex = i;
			break;
		}
	}

	// Si no hay vocal o es muy corta, usar últimas 2 letras
	if (lastVowelIndex === -1 || lastVowelIndex < word.length - 3) {
		return word.slice(-2);
	}

	// Retornar desde última vocal
	return word.slice(lastVowelIndex);
}

/**
 * Aplica resaltado de colores a texto con rimas
 * @param text Texto original
 * @param patterns Patrones de rima detectados
 * @returns HTML con spans coloreados
 */
export function applyRhymeHighlight(text: string, patterns: RhymePattern[]): string {
	let result = text;

	// Ordenar por longitud descendente para evitar reemplazos parciales
	const sortedPatterns = [...patterns].sort((a, b) => b.word.length - a.word.length);

	sortedPatterns.forEach((pattern) => {
		const regex = new RegExp(`\\b${pattern.word}\\b`, 'gi');
		result = result.replace(
			regex,
			`<span class="rhyme-word" style="--rhyme-color: ${pattern.color}">${pattern.word}</span>`
		);
	});

	return result;
}

/**
 * Divide una palabra en sílabas y las colorea
 * @param word Palabra a dividir
 * @returns HTML con sílabas coloreadas
 */
export function applySyllableColors(word: string): string {
	const syllables = splitIntoSyllables(word);
	
	return syllables
		.map((syllable, index) => {
			const color = RHYME_COLORS[index % RHYME_COLORS.length];
			return `<span class="syllable" style="--syllable-color: ${color}">${syllable}</span>`;
		})
		.join('');
}

/**
 * Divide una palabra en sílabas (reglas básicas del español)
 */
function splitIntoSyllables(word: string): string[] {
	const syllables: string[] = [];
	const vowels = 'aeiouáéíóúAEIOUÁÉÍÓÚ';
	let currentSyllable = '';

	for (let i = 0; i < word.length; i++) {
		const char = word[i];
		currentSyllable += char;

		// Si es vocal, revisar si termina la sílaba
		if (vowels.includes(char)) {
			// Mirar siguiente carácter
			const next = word[i + 1];
			
			if (!next || vowels.includes(next)) {
				// Termina sílaba
				syllables.push(currentSyllable);
				currentSyllable = '';
			}
		}
	}

	// Agregar última sílaba si quedó algo
	if (currentSyllable) {
		syllables.push(currentSyllable);
	}

	return syllables.length > 0 ? syllables : [word];
}
