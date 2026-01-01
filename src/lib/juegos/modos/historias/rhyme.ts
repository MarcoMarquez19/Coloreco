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

// Paleta de colores predefinidos (versiones oscuras para alto contraste)
const RHYME_COLORS = [
    '#C00000', // Rojo oscuro
    '#0000CC', // Azul oscuro
    '#008000', // Verde oscuro
    '#CC6600', // Naranja oscuro
    '#660066', // Púrpura oscuro
    '#CC00CC', // Magenta oscuro
    '#006666', // Cian oscuro
    '#CC0066', // Rosa oscuro
    '#999900', // Amarillo oscuro (oliva)
    '#000000', // Negro
    '#006B54', // Verde mar oscuro
    '#556B2F', // Verde oliva muy oscuro
    '#3A006F', // Índigo oscuro
    '#CC4400', // Coral oscuro
    '#B8860B', // Dorado oscuro
    '#004D4D', // Verde azulado oscuro
    '#8B0000', // Rojo muy oscuro
    '#000066'  // Azul marino oscuro
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
		colorIndex: number;
	}>();
	
	// Asignar IDs y colores únicos a cada grupo
	// Ordenar por tamaño de grupo (descendente) para asignar colores a los grupos más importantes primero
	const sortedGroups = Array.from(rhymeGroups.entries())
		.filter(([, group]) => group.words.size >= 2)
		.sort((a, b) => b[1].words.size - a[1].words.size);
	
	let colorIndex = 0;
	sortedGroups.forEach(([key, group]) => {
		// Generar un ID único basado en el hash del key
		const groupId = hashStringToNumber(key);
		// Asignar color secuencialmente para evitar repeticiones
		validGroups.set(key, { ...group, groupId, colorIndex: colorIndex % RHYME_COLORS.length });
		colorIndex++;
	});

	// Asignar patrones a palabras
	const patterns: RhymePattern[] = words.map(word => {
		let bestMatchKey = '';
		let bestMatchGroupId = -1;
		let bestMatchType = '';
		let bestMatchPriority = -1;
		let bestMatchGroupSize = 0;
		let bestMatchEndingLength = 0;
		let hasBestMatch = false;

		// Buscar el mejor grupo: priorizar longitud de terminación, luego tamaño del grupo
		validGroups.forEach((group, key) => {
			if (group.words.has(word)) {
				const groupSize = group.words.size;
				const ending = extractEnding(word, key, group.type);
				const endingLength = ending.length;
				
				// Estrategia de selección:
				// 1. Priorizar terminaciones más largas (3 letras > 2 letras)
				// 2. Si hay empate en longitud, preferir grupos más grandes
				// 3. Si hay empate en tamaño, usar mayor prioridad
				const isBetter = !hasBestMatch || 
					endingLength > bestMatchEndingLength ||
					(endingLength === bestMatchEndingLength && groupSize > bestMatchGroupSize) ||
					(endingLength === bestMatchEndingLength && groupSize === bestMatchGroupSize && group.priority > bestMatchPriority);
				
				if (isBetter) {
					bestMatchKey = key;
					bestMatchGroupId = group.groupId;
					bestMatchType = group.type;
					bestMatchPriority = group.priority;
					bestMatchGroupSize = groupSize;
					bestMatchEndingLength = endingLength;
					hasBestMatch = true;
				}
			}
		});

		if (hasBestMatch) {
			// Usar el colorIndex del grupo en lugar del groupId para evitar colisiones
			const groupData = validGroups.get(bestMatchKey);
			const color = groupData ? RHYME_COLORS[groupData.colorIndex] : RHYME_COLORS[0];
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
		
		// También añadir las últimas 2 letras del sufijo como rima adicional
		// para que palabras con sufijos diferentes pero misma terminación rimen
		// (ej: "historias" [ias] y "escenas" [as] ambas riman por "as")
		if (suffix.length >= 2) {
			const shortEnding = suffix.slice(-2);
			results.push({
				key: `suf-short:${shortEnding}`,
				type: 'terminación corta',
				priority: 95
			});
		}
		
		// Para sufijos de 3+ letras, también añadir las últimas 3 letras
		// (ej: "hombre" [bre], "madre" [dre], "entre" [tre] todas riman por "re")
		if (suffix.length >= 3) {
			const mediumEnding = suffix.slice(-3);
			results.push({
				key: `suf-medium:${mediumEnding}`,
				type: 'terminación media',
				priority: 96
			});
		}
	}
	
	// 2. Rima consonante - últimas 2-4 letras exactas (RIMA REAL)
	// Esta es la rima que los niños realmente escuchan y reconocen
	if (word.length >= 3) {
		const ending4 = word.length >= 4 ? word.slice(-4) : '';
		const ending3 = word.length >= 4 ? word.slice(-3) : '';
		const ending2 = word.slice(-2);
		
		// Verificar que tenga al menos una vocal Y una consonante (no solo vocales)
		const hasVowel4 = ending4 && /[aeiouáéíóú]/.test(ending4);
		const hasConsonant4 = ending4 && /[bcdfghjklmnpqrstvwxyz]/.test(ending4);
		
		const hasVowel3 = ending3 && /[aeiouáéíóú]/.test(ending3);
		const hasConsonant3 = ending3 && /[bcdfghjklmnpqrstvwxyz]/.test(ending3);
		
		const hasVowel2 = /[aeiouáéíóú]/.test(ending2);
		const hasConsonant2 = /[bcdfghjklmnpqrstvwxyz]/.test(ending2);
		
		// Para 4 letras: debe tener vocal y consonante
		if (hasVowel4 && hasConsonant4) {
			results.push({
				key: `cons4:${ending4}`,
				type: 'consonante (4)',
				priority: 90
			});
		}
		
		// Para 3 letras: debe tener vocal y consonante
		if (word.length >= 4 && hasVowel3 && hasConsonant3) {
			results.push({
				key: `cons3:${ending3}`,
				type: 'consonante (3)',
				priority: 85
			});
		}
		
		// Para 2 letras: debe tener vocal y consonante Y ser una sílaba completa
		if (word.length >= 3 && hasVowel2 && hasConsonant2) {
			// Verificar que las últimas 2 letras formen una sílaba completa
			const syllables = splitIntoSyllables(word);
			const lastSyllable = syllables[syllables.length - 1];
			if (lastSyllable && lastSyllable.length === 2 && lastSyllable === ending2) {
				results.push({
					key: `cons2:${ending2}`,
					type: 'consonante (2)',
					priority: 80
				});
			}
		}
	}
	
	// 3. Rima por última sílaba - ALTA PRIORIDAD (después de sufijos)
	// Ayuda a la conciencia fonológica
	const syllables = splitIntoSyllables(word);
	if (syllables.length > 0) {
		const lastSyll = syllables[syllables.length - 1];
		if (lastSyll.length >= 2) {
			results.push({
				key: `syll:${lastSyll}`,
				type: 'sílaba',
				priority: 95 // Alta prioridad - es la segunda más importante
			});
		}
	}
	
	// ❌ RIMA ASONANTE ELIMINADA
	// La rima asonante (solo vocales) genera demasiados falsos positivos
	// y es confusa para niños con dislexia (ej: joven/noche por "o-e")
	
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
 * Incluye terminaciones significativas y comunes
 */
function getCommonSuffix(word: string): string | null {
	// Ordenados por longitud descendente para evitar matches parciales
	// Solo sufijos significativos de 3+ letras para evitar falsos positivos
	const suffixes = [
		// --- ACCIONES Y PROCESOS (Sustantivos de verbos) ---
		'ibilidad', 'abilidad', 'amiento', 'imiento', 'adura', 'edura', 'idura',
		'anza', 'ción', 'sión', 'xión', 'aje',

		// --- CUALIDADES Y ESTADOS (Sustantivos abstractos) ---
		'idad', 'edad', 'tad', 'dad', 'ez', 'eza', 'ura', 'ia', 'icía', 'itúd', 
		'ancia', 'encia', 'ismo', 'ería',

		// --- QUIÉN LO HACE (Oficios y agentes) ---
		'ador', 'edor', 'idor', 'ante', 'ente', 'iente', 'ero', 'era', 
		'ista', 'ario', 'aria', 'triz', 'dor',

		// --- DIMINUTIVOS (Claves en textos infantiles) ---
		'ito', 'ita', 'illo', 'illa', 'ico', 'ica', 'ín', 'ina', 'uelo', 'uela',

		// --- AUMENTATIVOS Y DESPECTIVOS ---
		'ón', 'ona', 'azo', 'aza', 'ote', 'ota', 'ucha', 'ucho', 'aco', 'aca',

		// --- CÓMO ES ALGO (Adjetivos) ---
		'able', 'ible', 'oso', 'osa', 'ivo', 'iva', 'ido', 'ida', 'ado', 'ada',
		'esco', 'esca', 'iento', 'ienta', 'izo', 'iza', 'udo', 'uda', 'al', 'ar',
		'ento', 'enta', 'ico', 'ica', 'ista', 'il',

		// --- TIEMPOS VERBALES COMUNES (Para rimas de narración) ---
		'ábamos', 'ábais', 'aban', 'ieron', 'amos', 'emos', 'imos',
		'asteis', 'isteis', 'aban', 'ían',
		'aba', 'abas', 'aste', 'iste', 'ías',
		'ará', 'erá', 'irá', 'aría', 'ería', 'iría', 'ando', 'iendo',
		'ara', 'era', 'iera', 'ese', 'iese', 'ase', 'ias',

		// --- INFINITIVOS Y FORMAS VERBALES ---
		'uar', 'iar', 'ear', // actuar, estudiar, pasear
		'ais', 'eis', 'ías', // váis, seáis, tenéis, venías
		
		// --- LUGAR Y CONJUNTO ---
		'ería', 'ario', 'ero', 'eda', 'edo', 'edero',

		// --- TERMINACIONES COMUNES (Sustantivos y otras) ---
		'che', // noche, leche, coche
		'día', // melodía, alegría
		'bre', // hombre, nombre,iembre
		'tre', // mientras, entre
		'dre', // madre, padre, piedre
		'rre', // corre, barre, amarre
		
		// --- TERMINACIONES VOCÁLICAS + CONSONANTE (2 letras) ---
		// Vocal + R
		'ar', 'er', 'ir', 'or', 'ur', // hablar, comer, vivir, color, azur
		
		// Vocal + S  
		'as', 'es', 'is', 'os', 'us', // casas, jueves, crisis, ojos, autobús
		
		// Vocal + Z
		'az', 'ez', 'iz', 'oz', 'uz', // paz, pez, nariz, voz, luz
		
		// Vocal + N
		'án', 'en', 'ín', 'ón', 'ún', // pan, bien, jardín, ratón, algún
		'an', 'in', 'un', // fan, fin, tun
		
		// Vocal + L
		'al', 'el', 'il', 'ol', 'ul', // mal, piel, abril, sol, azul
		
		// Vocal + D
		'ad', 'ed', 'id', 'od', 'ud', // verdad, pared, Madrid,ود, salud
		
		// Otras consonantes finales comunes
		'ay', 'ey', 'oy', 'uy', // hay, rey, voy, muy

		// --- MODO (Adverbios) ---
		'mente'
	];
	
	for (const suffix of suffixes) {
		// Requiere que la palabra sea significativamente más larga que el sufijo
		// (al menos 2 letras antes del sufijo)
		if (word.endsWith(suffix) && word.length > suffix.length + 1) {
			return suffix;
		}
	}
	
	return null;
}

/**
 * Extrae la terminación según el tipo
 * Para sufijos: devuelve el sufijo completo
 * Para otros tipos: últimas 3-4 letras
 */
function extractEnding(word: string, key: string, type: string): string {
	if (key.startsWith('cons4:')) {
		return word.slice(-4);
	} else if (key.startsWith('cons3:')) {
		return word.slice(-3);
	} else if (key.startsWith('cons2:')) {
		return word.slice(-2);
	} else if (key.startsWith('syll:')) {
		const syllables = splitIntoSyllables(word);
		return syllables[syllables.length - 1] || '';
	} else if (key.startsWith('suf:')) {
		// Para sufijos, devolver el sufijo completo
		const suffix = key.replace('suf:', '');
		return suffix;
	} else if (key.startsWith('suf-medium:')) {
		// Para sufijos medios, devolver las últimas 3 letras
		const mediumSuffix = key.replace('suf-medium:', '');
		return mediumSuffix;
	} else if (key.startsWith('suf-short:')) {
		// Para sufijos cortos, devolver las últimas 2 letras
		const shortSuffix = key.replace('suf-short:', '');
		return shortSuffix;
	}
	
	// Por defecto, usar últimas 3 letras
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
	
	// Crear un mapa de grupos de rima para búsqueda eficiente
	const rhymeGroupMap = new Map<number, { color: string; rhymeType: string; ending: string }>();
	patterns.forEach(p => {
		if (p.hasRhyme && p.rhymeGroup !== -1) {
			rhymeGroupMap.set(p.rhymeGroup, {
				color: p.color,
				rhymeType: p.rhymeType,
				ending: p.ending
			});
		}
	});
	
	const result = words.map(segment => {
		if (/^\s+$/.test(segment)) return segment;
		
		const match = segment.match(/^([^.,;:!?¿¡()"""']*)([.,;:!?¿¡()"""']*)$/);
		if (!match) return segment;
		
		const [, wordPart, punctuation] = match;
		const cleanWord = wordPart.toLowerCase();
		
		// Primero buscar coincidencia exacta de palabra
		let pattern = patterns.find(p => p.word === cleanWord);
		
		// Si no hay coincidencia exacta, buscar por terminación
		if (!pattern || !pattern.hasRhyme) {
			// Intentar encontrar un grupo de rima que coincida con esta palabra
			for (const p of patterns) {
				if (p.hasRhyme && p.ending && cleanWord.endsWith(p.ending.toLowerCase())) {
					// Verificar que sea una terminación válida (no solo parte de la palabra)
					const beforeEnding = cleanWord.substring(0, cleanWord.length - p.ending.length);
					if (beforeEnding.length > 0) {
						pattern = {
							word: cleanWord,
							rhymeGroup: p.rhymeGroup,
							color: p.color,
							hasRhyme: true,
							rhymeType: p.rhymeType,
							ending: p.ending
						};
						break;
					}
				}
			}
		}
		
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
		
		// Convertir color hex a rgba con opacidad suave (25%)
		const bgColor = hexToRgba(color, 0.20);
		
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