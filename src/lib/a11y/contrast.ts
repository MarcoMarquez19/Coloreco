/**
 * contrast.ts - Control de contraste y cumplimiento WCAG
 * 
 * Proporciona funciones para calcular y ajustar el contraste de colores
 * según las pautas WCAG (Web Content Accessibility Guidelines).
 */

export type ContrastLevel = 'normal' | 'high' | 'maximum';

export interface ContrastRatio {
	ratio: number;
	passesAA: boolean;
	passesAAA: boolean;
	level: 'AA' | 'AAA' | 'fail';
}

/**
 * Calcula la luminancia relativa de un color
 * @param rgb Color en formato [r, g, b] (0-255)
 */
function getRelativeLuminance(rgb: [number, number, number]): number {
	const [r, g, b] = rgb.map((channel) => {
		const normalized = channel / 255;
		return normalized <= 0.03928
			? normalized / 12.92
			: Math.pow((normalized + 0.055) / 1.055, 2.4);
	});

	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convierte color hex a RGB
 */
function hexToRgb(hex: string): [number, number, number] | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? [
				parseInt(result[1], 16),
				parseInt(result[2], 16),
				parseInt(result[3], 16),
		  ]
		: null;
}

/**
 * Calcula el ratio de contraste entre dos colores
 * @param color1 Color 1 en formato hex
 * @param color2 Color 2 en formato hex
 * @returns Ratio de contraste y cumplimiento WCAG
 */
export function calculateContrastRatio(color1: string, color2: string): ContrastRatio {
	const rgb1 = hexToRgb(color1);
	const rgb2 = hexToRgb(color2);

	if (!rgb1 || !rgb2) {
		return { ratio: 0, passesAA: false, passesAAA: false, level: 'fail' };
	}

	const lum1 = getRelativeLuminance(rgb1);
	const lum2 = getRelativeLuminance(rgb2);

	const lighter = Math.max(lum1, lum2);
	const darker = Math.min(lum1, lum2);

	const ratio = (lighter + 0.05) / (darker + 0.05);

	return {
		ratio: Math.round(ratio * 100) / 100,
		passesAA: ratio >= 4.5, // WCAG AA para texto normal
		passesAAA: ratio >= 7, // WCAG AAA para texto normal
		level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'fail',
	};
}

/**
 * Ajusta el contraste de un color contra un fondo
 * @param foreground Color de texto en hex
 * @param background Color de fondo en hex
 * @param targetLevel Nivel de contraste deseado
 * @returns Color ajustado
 */
export function adjustContrast(
	foreground: string,
	background: string,
	targetLevel: ContrastLevel = 'high'
): string {
	const targetRatio = targetLevel === 'maximum' ? 21 : targetLevel === 'high' ? 7 : 4.5;

	let currentContrast = calculateContrastRatio(foreground, background);

	if (currentContrast.ratio >= targetRatio) {
		return foreground;
	}

	// Intentar oscurecer o aclarar el color de texto
	const fg = hexToRgb(foreground);
	const bg = hexToRgb(background);

	if (!fg || !bg) return foreground;

	const bgLum = getRelativeLuminance(bg);

	// Si el fondo es oscuro, aclarar el texto
	if (bgLum < 0.5) {
		return lightenColor(foreground, targetRatio);
	} else {
		return darkenColor(foreground, targetRatio);
	}
}

/**
 * Aclara un color
 */
function lightenColor(hex: string, targetRatio: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;

	const factor = Math.min(1, targetRatio / 7);
	const adjusted = rgb.map((channel) =>
		Math.min(255, Math.round(channel + (255 - channel) * factor))
	);

	return rgbToHex(adjusted[0], adjusted[1], adjusted[2]);
}

/**
 * Oscurece un color
 */
function darkenColor(hex: string, targetRatio: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;

	const factor = Math.min(1, targetRatio / 7);
	const adjusted = rgb.map((channel) => Math.max(0, Math.round(channel * (1 - factor))));

	return rgbToHex(adjusted[0], adjusted[1], adjusted[2]);
}

/**
 * Convierte RGB a hex
 */
function rgbToHex(r: number, g: number, b: number): string {
	return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Aplica configuración de contraste al documento
 */
export function applyContrastSettings(level: ContrastLevel, backgroundColor?: string): void {
	const root = document.documentElement;

	root.setAttribute('data-contrast', level);

	if (backgroundColor) {
		root.style.setProperty('--background-color', backgroundColor);
	}

	// Ajustar automáticamente el color de texto según el fondo
	if (backgroundColor) {
		const textColor = adjustContrast('#000000', backgroundColor, level);
		root.style.setProperty('--text-color', textColor);
	}
}
