/**
 * rhyme.ts - Sistema equilibrado de detección de rimas para niños con dislexia
 * 
 * Detecta patrones de rima reales con criterios balanceados.
 * Usa resaltado tipo biónico para las terminaciones de rima.
 */

export interface RhymePattern {
	word: string;
	rhymeGroup: number;
	color: string;
	hasRhyme: boolean;
	rhymeType: string;
	ending: string;
}

/**
 * Calcula cuántos caracteres resaltar según la longitud del ending
 * Reglas del modo biónico:
 * - 1-3 letras: resaltar la primera letra
 * - 4 letras: resaltar 2 letras
 * - 5-6 letras: resaltar 3 letras
 * - 7+ letras: resaltar aproximadamente 40% - 50%
 */
function getBionicHighlightLength(endingLength: number): number {
	if (endingLength <= 3) return 1;
	if (endingLength === 4) return 2;
	if (endingLength === 5 || endingLength === 6) return 3;

	// Para endings largos, usar 40%-50%
	const pct = 0.45; // 45% como punto medio
	return Math.min(endingLength - 1, Math.max(1, Math.ceil(endingLength * pct)));
}

// Paleta de colores con alto contraste
const RHYME_COLORS = [
	'#D32F2F', // rojo oscuro
	'#1976D2', // azul oscuro
	'#388E3C', // verde oscuro
	'#F57C00', // naranja oscuro
	'#7B1FA2', // morado oscuro
	'#0097A7', // cian oscuro
	'#C2185B', // rosa oscuro
	'#5D4037', // marrón
	'#E64A19', // naranja rojizo
	'#00796B', // verde azulado
	'#455A64', // gris azulado
	'#6A1B9A', // morado intenso
	'#C62828', // rojo intenso
	'#AD1457', // rosa intenso
	'#00838F', // cian intenso
	'#4E342E', // marrón oscuro
];

/**
 * Detecta patrones de rima con criterios balanceados
 */
export function detectRhymes(text: string): RhymePattern[] {
	const words = text
		.toLowerCase()
		.replace(/[.,;:!?¿¡()"""']/g, '')
		.split(/\s+/)
		.filter((w) => w.length > 0);

	if (words.length < 2) {
		return words.map(word => createNoRhymePattern(word));
	}

	// Mapa para agrupar palabras por tipo de rima
	const rhymeGroups = new Map<string, {
		words: Set<string>;
		type: string;
		priority: number;
	}>();

	// Analizar cada palabra
	words.forEach(word => {
		const analyses = analyzeWord(word);
		
		analyses.forEach(({ key, type, priority }) => {
			if (!rhymeGroups.has(key)) {
				rhymeGroups.set(key, {
					words: new Set(),
					type,
					priority
				});
			}
			rhymeGroups.get(key)!.words.add(word);
		});
	});

	// Filtrar grupos válidos (2+ palabras) y asignar IDs
	const validGroups = new Map<string, {
		words: Set<string>;
		type: string;
		priority: number;
		groupId: number;
	}>();
	
	// Asignar IDs usando hash del key para colores consistentes y únicos
	rhymeGroups.forEach((group, key) => {
		// Para sufijos comunes, permitir incluso 1 palabra (son terminaciones importantes)
		const isSuffix = key.startsWith('suf:');
		const minWords = isSuffix ? 1 : 2;
		
		if (group.words.size >= minWords) {
			// Generar un ID único basado en el hash del key
			const groupId = hashStringToNumber(key);
			validGroups.set(key, { ...group, groupId });
		}
	});

	// Asignar patrones a palabras
	const patterns: RhymePattern[] = words.map(word => {
		let bestMatchKey = '';
		let bestMatchGroupId = -1;
		let bestMatchType = '';
		let bestMatchPriority = -1;
		let hasBestMatch = false;

		// Buscar el mejor grupo (mayor prioridad)
		validGroups.forEach((group, key) => {
			if (group.words.has(word)) {
				if (!hasBestMatch || group.priority > bestMatchPriority) {
					bestMatchKey = key;
					bestMatchGroupId = group.groupId;
					bestMatchType = group.type;
					bestMatchPriority = group.priority;
					hasBestMatch = true;
				}
			}
		});

		if (hasBestMatch) {
			const color = RHYME_COLORS[bestMatchGroupId % RHYME_COLORS.length];
			const ending = extractEnding(word, bestMatchKey, bestMatchType);

			return {
				word,
				rhymeGroup: bestMatchGroupId,
				color,
				hasRhyme: true,
				rhymeType: bestMatchType,
				ending
			};
		}

		return createNoRhymePattern(word);
	});

	return patterns;
}

/**
 * Analiza una palabra y retorna todas sus posibles rimas
 */
function analyzeWord(word: string): Array<{ key: string; type: string; priority: number }> {
	const results: Array<{ key: string; type: string; priority: number }> = [];
	
	// 1. Terminaciones comunes (-ción, -dad, -mente, etc) - MÁXIMA PRIORIDAD
	const suffix = getCommonSuffix(word);
	if (suffix) {
		results.push({
			key: `suf:${suffix}`,
			type: 'terminación',
			priority: 100
		});
	}
	
	// 2. Rima consonante - últimas 2-3 letras exactas
	if (word.length >= 3) {
		const ending3 = word.slice(-3);
		const ending2 = word.slice(-2);
		
		// Verificar que tenga al menos una vocal
		if (/[aeiouáéíóú]/.test(ending3)) {
			results.push({
				key: `cons3:${ending3}`,
				type: 'consonante (3)',
				priority: 90
			});
		}
		
		if (/[aeiouáéíóú]/.test(ending2)) {
			results.push({
				key: `cons2:${ending2}`,
				type: 'consonante (2)',
				priority: 85
			});
		}
	}
	
	// 3. Rima asonante - últimas 2 vocales
	const vowelPattern = extractVowels(word);
	if (vowelPattern.length >= 2) {
		results.push({
			key: `ason:${vowelPattern}`,
			type: 'asonante',
			priority: 75
		});
	}
	
	// 4. Rima por última sílaba
	const syllables = splitIntoSyllables(word);
	if (syllables.length > 0) {
		const lastSyll = syllables[syllables.length - 1];
		if (lastSyll.length >= 1) {
			results.push({
				key: `syll:${lastSyll}`,
				type: 'sílaba',
				priority: 70
			});
		}
	}
	
	return results;
}

/**
 * Extrae vocales de los últimos 4 caracteres
 */
function extractVowels(word: string): string {
	const last4 = word.slice(-4);
	const vowels: string[] = [];
	
	for (const char of last4) {
		const normalized = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		if ('aeiou'.includes(normalized)) {
			vowels.push(normalized);
		}
	}
	
	return vowels.join('');
}

/**
 * Detecta sufijos comunes del español
 * Incluye terminaciones para palabras agudas, graves y esdrújulas
 */
function getCommonSuffix(word: string): string | null {
	// Ordenados por longitud descendente para evitar matches parciales
	const suffixes = [
		// Terminaciones largas (esdrújulas y graves)
		'ibilidad', 'amiento', 'imiento',
		// Terminaciones medias - graves comunes
		'ción', 'sión', 'mente', 'idad', 'edad', 'ador', 'edor', 'idor',
		'ante', 'ente', 'tad', 'dad', 'ura', 'ura',
		// Verbos y participios - graves
		'ando', 'iendo', 'ado', 'ido', 'aba', 'ían', 'aba', 'ían',
		// Diminutivos y aumentativos - graves
		'ito', 'ita', 'illo', 'illa', 'ón', 'ona', 'azo', 'aza',
		// Adjetivos - graves
		'able', 'ible', 'oso', 'osa', 'ivo', 'iva', 'ica', 'ico',
		// Profesiones y oficios
		'ero', 'era', 'ista', 'or', 'ora',
		// Terminaciones agudas (palabras con acento en última sílaba)
		'ión', 'ón', 'án', 'és', 'ás',
		// Otras terminaciones comunes
		'tes', 'ar', 'er', 'ir', 'en', 'to', 'ta', 'no', 'na',
		'al', 'el', 'il', 'ol', 'ul'
	];
	
	for (const suffix of suffixes) {
		if (word.endsWith(suffix) && word.length > suffix.length) {
			return suffix;
		}
	}
	
	return null;
}

/**
 * Extrae la terminación según el tipo
 * Para palabras graves/esdrújulas: últimas 3 letras
 * Para palabras agudas: últimas 2 letras o desde vocal acentuada
 */
function extractEnding(word: string, key: string, type: string): string {
	if (key.startsWith('cons3:')) {
		return word.slice(-3);
	} else if (key.startsWith('cons2:')) {
		return word.slice(-2);
	} else if (key.startsWith('ason:')) {
		// Para asonante, retornar desde la primera vocal del patrón
		const pattern = key.replace('ason:', '');
		return findVowelSection(word, pattern);
	} else if (key.startsWith('syll:')) {
		const syllables = splitIntoSyllables(word);
		return syllables[syllables.length - 1] || '';
	} else if (key.startsWith('suf:')) {
		const suffix = key.replace('suf:', '');
		// Para sufijos, determinar si es aguda o grave
		const hasAccentedVowel = /[áéíóú]/.test(word);
		const endsInVowelNS = /[aeiou]$|[ns]$/.test(word);
		
		// Si tiene vocal acentuada o termina en consonante (excepto n,s) = aguda
		if (hasAccentedVowel || !endsInVowelNS) {
			// Aguda: últimas 2 letras o el sufijo si es corto
			return suffix.length <= 3 ? suffix : word.slice(-2);
		} else {
			// Grave: últimas 3 letras o el sufijo
			return suffix.length <= 4 ? suffix : word.slice(-3);
		}
	}
	
	// Por defecto, usar últimas 3 letras para palabras graves
	return word.slice(-3);
}

/**
 * Encuentra la sección de la palabra que contiene el patrón de vocales
 */
function findVowelSection(word: string, vowelPattern: string): string {
	const vowels = 'aeiouáéíóú';
	let vowelCount = 0;
	let startIndex = -1;
	
	// Buscar desde el final
	for (let i = word.length - 1; i >= 0; i--) {
		const normalized = word[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		if ('aeiou'.includes(normalized)) {
			if (startIndex === -1) {
				startIndex = i;
			}
			vowelCount++;
			if (vowelCount === vowelPattern.length) {
				return word.slice(i);
			}
		}
	}
	
	return startIndex !== -1 ? word.slice(startIndex) : word.slice(-2);
}

/**
 * Separa palabra en sílabas (algoritmo simplificado)
 */
export function splitIntoSyllables(word: string): string[] {
	const vowels = 'aeiouáéíóúü';
	const syllables: string[] = [];
	let current = '';
	
	for (let i = 0; i < word.length; i++) {
		const char = word[i];
		const isVowel = vowels.includes(char.toLowerCase());
		const next = word[i + 1];
		const nextIsVowel = next && vowels.includes(next.toLowerCase());
		
		current += char;
		
		// Separar en: vocal + consonante(s) + vocal
		if (isVowel && next && !nextIsVowel) {
			const afterNext = word[i + 2];
			if (afterNext && vowels.includes(afterNext.toLowerCase())) {
				syllables.push(current);
				current = '';
			}
		}
	}
	
	if (current) {
		syllables.push(current);
	}
	
	return syllables.length > 0 ? syllables : [word];
}

/**
 * Genera un número único basado en el hash de un string
 * Asegura que diferentes patrones tengan diferentes colores
 */
function hashStringToNumber(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convertir a 32bit integer
	}
	return Math.abs(hash);
}

/**
 * Crea patrón sin rima
 */
function createNoRhymePattern(word: string): RhymePattern {
	return {
		word,
		rhymeGroup: -1,
		color: '',
		hasRhyme: false,
		rhymeType: 'none',
		ending: ''
	};
}

/**
 * Aplica resaltado visual estilo biónico a las rimas
 * Resalta solo la parte crítica del ending según las reglas biónicas
 */
export function applyRhymeHighlight(
	text: string,
	patterns: RhymePattern[],
	backgroundColor?: string
): string {
	const words = text.split(/(\s+)/);
	
	const result = words.map(segment => {
		if (/^\s+$/.test(segment)) return segment;
		
		const match = segment.match(/^([^.,;:!?¿¡()"""']*)([.,;:!?¿¡()"""']*)$/);
		if (!match) return segment;
		
		const [, wordPart, punctuation] = match;
		const cleanWord = wordPart.toLowerCase();
		const pattern = patterns.find(p => p.word === cleanWord);
		
		if (!pattern || !pattern.hasRhyme || !pattern.ending) {
			return segment;
		}
		
		// Encontrar posición del ending
		const ending = pattern.ending.toLowerCase();
		const wordLower = cleanWord;
		
		// Buscar la mejor coincidencia del ending
		let endingIndex = wordLower.lastIndexOf(ending);
		
		// Si no se encuentra exacto, intentar encontrar desde el final
		if (endingIndex === -1 || endingIndex + ending.length !== wordLower.length) {
			endingIndex = wordLower.length - ending.length;
		}
		
		if (endingIndex < 0 || endingIndex >= wordPart.length) {
			return segment;
		}
		
		// Aplicar reglas biónicas al ending
		const endingPart = wordPart.substring(endingIndex);
		const bionicLength = getBionicHighlightLength(endingPart.length);
		
		const before = wordPart.substring(0, endingIndex);
		const bionicHighlight = endingPart.substring(0, bionicLength);
		const bionicRest = endingPart.substring(bionicLength);
		
		const color = backgroundColor 
			? ensureContrast(pattern.color, backgroundColor)
			: pattern.color;
		
		// Convertir color hex a rgba con opacidad suave (15%)
		const bgColor = hexToRgba(color, 0.15);
		
		// Aplicar solo fondo resaltado suave y subrayado, sin alterar el texto
		// Usar clase "rhyme-highlight" para que +layout.svelte lo detecte y no lo procese
		if (bionicRest.length > 0) {
			return `${before}<span class="rhyme-highlight" data-type="${pattern.rhymeType}" style="background-color: ${bgColor}; border-bottom: 2px solid ${color}; padding: 0 2px; border-radius: 2px;">${bionicHighlight}${bionicRest}</span>${punctuation}`;
		} else {
			// Si el ending es muy corto, resaltar todo
			return `${before}<span class="rhyme-highlight" data-type="${pattern.rhymeType}" style="background-color: ${bgColor}; border-bottom: 2px solid ${color}; padding: 0 2px; border-radius: 2px;">${bionicHighlight}</span>${punctuation}`;
		}
	});
	
	return result.join('');
}

/**
 * Asegura contraste adecuado
 */
function ensureContrast(color: string, bgColor: string): string {
	const lum = getLuminance(color);
	if (lum > 0.4) {
		return darkenColor(color, 0.4);
	}
	return color;
}

function getLuminance(hex: string): number {
	const rgb = hexToRgb(hex);
	if (!rgb) return 0.5;
	
	const [r, g, b] = rgb.map(v => {
		v = v / 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	});
	
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): [number, number, number] | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? [
		parseInt(result[1], 16),
		parseInt(result[2], 16),
		parseInt(result[3], 16)
	] : null;
}

function darkenColor(hex: string, amount: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;
	
	const [r, g, b] = rgb.map(v => Math.max(0, Math.floor(v * (1 - amount))));
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToRgba(hex: string, alpha: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
	
	const [r, g, b] = rgb;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Colorea sílabas individuales
 */
export function applySyllableColors(word: string): string {
	const syllables = splitIntoSyllables(word);
	
	return syllables
		.map((syll, i) => {
			const color = RHYME_COLORS[i % RHYME_COLORS.length];
			return `<span style="background-color: ${color}; color: white; padding: 2px 4px; border-radius: 3px; margin: 0 1px; font-weight: 600;">${syll}</span>`;
		})
		.join('');
}

export function getWordEnding(word: string): string {
	return word.slice(-3);
}