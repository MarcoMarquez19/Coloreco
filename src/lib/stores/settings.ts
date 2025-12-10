// Store de configuración para la UI adaptativa de COLORECO
// Este "cerebro" centralizado almacena todas las preferencias de accesibilidad y diseño

import { writable } from 'svelte/store';

// Interfaz que define la estructura de la configuración
// Define todas las propiedades que controlan la apariencia de la aplicación
export interface ConfiguracionUI {
	// Controla si el menú de ajustes está visible
	estaAbiertoElMenu: boolean; // menu abierto/cerrado
	
	// Multiplicador para el tamaño de fuente base (1 = normal, 1.5 = 150%, etc.)
	multiplicadorTamanioFuente: number; // multiplicador de tamaño de fuente
	
	// Multiplicador para espaciado entre elementos (1 = normal, 1.2 = 120%, etc.)
	multiplicadorEspaciado: number; // multiplicador de espaciado
	
	// Radio de bordes redondeados en píxeles
	redondesBordes: number; // radio de borde
	
	// Lupa Mágica: controla si la lupa está habilitada
	lupaActivada: boolean; // lupa activa/inactiva
	
	// Lupa Mágica: nivel de magnificación (1.5, 2, 3)
	nivelMagnificacion: number; // nivel de zoom de la lupa
	
	// Modo Noche: activa paleta de alto contraste con fondo oscuro
	modoNoche?: boolean;
	
	// Modo Inverso: invierte la paleta del modo noche (solo disponible si modoNoche está activo)
	modoInverso?: boolean;

	// === HU-01: Accesibilidad tipográfica ===
	fontFamily?: string; // familia de fuente
	fontSize?: number; // tamaño de fuente en px
	letterSpacing?: number; // espaciado entre letras en em
	lineHeight?: number; // altura de línea
	dyslexiaMode?: boolean; // modo dislexia (OpenDyslexic)

	// === HU-02: Lectura biónica ===
	bionicMode?: boolean; // activar lectura biónica

	// === HU-03: Narración auditiva ===
	narrationEnabled?: boolean; // activar narración TTS
	ttsSpeed?: number; // velocidad de narración (0.1 - 10)

	// === HU-04: Resaltado de rimas ===
	rhymeMode?: boolean; // resaltar rimas

	// === HU-05: Pictogramas ===
	pictogramMode?: boolean; // mostrar pictogramas

	// === HU-06: Contraste y fondo ===
	backgroundColor?: string; // color de fondo personalizado
	contrastLevel?: 'normal' | 'high' | 'maximum'; // nivel de contraste WCAG
}

// Valores por defecto para una experiencia estándar
const valoresPorDefecto: ConfiguracionUI = {
	estaAbiertoElMenu: false,
	multiplicadorTamanioFuente: 1,
	multiplicadorEspaciado: 1,
	redondesBordes: 8,
	lupaActivada: false,
	nivelMagnificacion: 2,
	modoNoche: false,
	modoInverso: false,
	// Nuevos valores por defecto
	fontFamily: 'Arial, sans-serif',
	fontSize: 16,
	letterSpacing: 0,
	lineHeight: 1.5,
	dyslexiaMode: false,
	bionicMode: false,
	narrationEnabled: false,
	ttsSpeed: 1,
	rhymeMode: false,
	pictogramMode: false,
	backgroundColor: '#ffffff',
	contrastLevel: 'normal'
};

// Crear el store reactivo
// Cualquier componente puede suscribirse a este store y reaccionar a cambios
function crearEstadoConfiguraciones() {
	const { subscribe, set, update } = writable<ConfiguracionUI>(valoresPorDefecto);

	return {
		subscribe,
		
		// Alterna la visibilidad del menú de ajustes (abierto ↔ cerrado)
		toggleMenu: () => update(config => ({ 
			...config, 
			estaAbiertoElMenu: !config.estaAbiertoElMenu 
		})),
		
		// Cierra el menú de ajustes
		cerrarMenu: () => update(config => ({ 
			...config, 
			estaAbiertoElMenu: false 
		})),
		
		// Actualiza el multiplicador de tamaño de fuente
		// @param valor - nuevo multiplicador (ej: 1.2 para texto 20% más grande)
		setFontSize: (valor: number) => update(config => ({ 
			...config, 
			multiplicadorTamanioFuente: valor 
		})),
		
		// Actualiza el multiplicador de espaciado
		// @param valor - nuevo multiplicador (ej: 1.5 para espaciado 50% mayor)
		setSpacing: (valor: number) => update(config => ({ 
			...config, 
			multiplicadorEspaciado: valor 
		})),
		
		// Actualiza el radio de los bordes redondeados
		// @param valor - radio en píxeles
		setBorderRadius: (valor: number) => update(config => ({ 
			...config, 
			redondesBordes: valor 
		})),
		
		// Activa o desactiva la lupa mágica
		// @param enabled - true para activar, false para desactivar
		setMagnifierEnabled: (enabled: boolean) => update(config => ({
			...config,
			lupaActivada: enabled
		})),
		
		// Alterna el estado de la lupa mágica
		toggleMagnifier: () => update(config => ({
			...config,
			lupaActivada: !config.lupaActivada
		})),
		
		// Establece el nivel de zoom de la lupa mágica
		// @param zoom - nivel de magnificación (1.5, 2, 3)
		setMagnifierZoom: (zoom: number) => update(config => ({
			...config,
			nivelMagnificacion: zoom
		})),
		
		// Alterna el modo noche (alto contraste con fondo oscuro)
		// Si se desactiva el modo noche, también se desactiva el modo inverso automáticamente
		toggleModoNoche: () => update(config => ({
			...config,
			modoNoche: !config.modoNoche,
			// Si modoNoche pasa a false, modoInverso también debe ser false
			modoInverso: !config.modoNoche ? false : config.modoInverso
		})),
		
		// Alterna el modo inverso (invierte la paleta del modo noche)
		toggleModoInverso: () => update(config => ({
			...config,
			modoInverso: !config.modoInverso
		})),

		// === Nuevos métodos para historias de usuario ===
		
		// HU-01: Tipografía
		setFontFamily: (family: string) => update(config => ({ 
			...config, 
			fontFamily: family 
		})),
		
		setFontSizeValue: (size: number) => update(config => ({ 
			...config, 
			fontSize: size 
		})),
		
		setLetterSpacing: (spacing: number) => update(config => ({ 
			...config, 
			letterSpacing: spacing 
		})),
		
		setLineHeight: (height: number) => update(config => ({ 
			...config, 
			lineHeight: height 
		})),
		
		toggleDyslexiaMode: () => update(config => ({
			...config,
			dyslexiaMode: !config.dyslexiaMode
		})),
		
		// HU-02: Lectura biónica
		toggleBionicMode: () => update(config => ({
			...config,
			bionicMode: !config.bionicMode
		})),
		
		// HU-03: Narración auditiva
		toggleNarration: () => update(config => ({
			...config,
			narrationEnabled: !config.narrationEnabled
		})),
		
		setTTSSpeed: (speed: number) => update(config => ({
			...config,
			ttsSpeed: speed
		})),
		
		// HU-04: Rimas
		toggleRhymeMode: () => update(config => ({
			...config,
			rhymeMode: !config.rhymeMode
		})),
		
		// HU-05: Pictogramas
		togglePictogramMode: () => update(config => ({
			...config,
			pictogramMode: !config.pictogramMode
		})),
		
		// HU-06: Contraste y fondo
		setBackgroundColor: (color: string) => update(config => ({
			...config,
			backgroundColor: color
		})),
		
		setContrastLevel: (level: 'normal' | 'high' | 'maximum') => update(config => ({
			...config,
			contrastLevel: level
		})),
		
		// Reinicia toda la configuración a valores por defecto
		reset: () => set(valoresPorDefecto)
	};
}

// Exportar una única instancia del store para usar en toda la app
export const configuraciones = crearEstadoConfiguraciones();
