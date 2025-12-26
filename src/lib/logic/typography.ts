/**
 * typography.ts - Control de tipografía y accesibilidad de texto
 * 
 * Proporciona funciones para aplicar configuraciones tipográficas dinámicas
 * y manejar cambios de zoom de manera estable.
 */

export interface TypographySettings {
	fontFamily?: string;
	fontSize?: number;
	letterSpacing?: number;
	lineHeight?: number;
	dyslexiaMode?: boolean;
}

/**
 * Aplica las configuraciones de tipografía al documento
 * @param settings Configuración de tipografía a aplicar
 */
export function applyTypography(settings: TypographySettings): void {
	const root = document.documentElement;

	if (settings.fontFamily) {
		root.style.setProperty('--font-family', settings.fontFamily);
	}

	if (settings.fontSize) {
		root.style.setProperty('--font-size', `${settings.fontSize}px`);
	}

	if (settings.letterSpacing) {
		root.style.setProperty('--letter-spacing', `${settings.letterSpacing}em`);
	}

	if (settings.lineHeight) {
		root.style.setProperty('--line-height', `${settings.lineHeight}`);
	}

	// Modo dislexia: usa fuente OpenDyslexic si está disponible
	if (settings.dyslexiaMode) {
		root.style.setProperty('--font-family', 'OpenDyslexic, Arial, sans-serif');
		root.style.setProperty('--letter-spacing', '0.05em');
		root.style.setProperty('--line-height', '1.8');
	}
}

/**
 * Observa cambios en el nivel de zoom del navegador
 * y mantiene la estabilidad visual
 */
export function watchZoomChanges(callback?: (zoomLevel: number) => void): () => void {
	let lastWidth = window.innerWidth;

	const handleResize = () => {
		const currentWidth = window.innerWidth;
		const widthDiff = Math.abs(currentWidth - lastWidth);

		// Detectar cambio de zoom (no de tamaño de ventana)
		if (widthDiff > 0 && widthDiff < 100) {
			const zoomLevel = window.devicePixelRatio || 1;
			
			if (callback) {
				callback(zoomLevel);
			}

			// Ajustar variables CSS para mantener proporciones
			const root = document.documentElement;
			const baseFontSize = parseFloat(getComputedStyle(root).fontSize);
			root.style.setProperty('--zoom-level', `${zoomLevel}`);
		}

		lastWidth = currentWidth;
	};

	window.addEventListener('resize', handleResize);

	// Retornar función de limpieza
	return () => {
		window.removeEventListener('resize', handleResize);
	};
}

/**
 * Obtiene la configuración de tipografía actual del documento
 */
export function getCurrentTypography(): TypographySettings {
	const root = document.documentElement;
	const computedStyle = getComputedStyle(root);

	return {
		fontFamily: computedStyle.getPropertyValue('--font-family').trim(),
		fontSize: parseFloat(computedStyle.getPropertyValue('--font-size')),
		letterSpacing: parseFloat(computedStyle.getPropertyValue('--letter-spacing')),
		lineHeight: parseFloat(computedStyle.getPropertyValue('--line-height')),
	};
}
