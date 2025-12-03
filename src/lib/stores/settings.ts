// Store de configuración para la UI adaptativa de COLORECO
// Este "cerebro" centralizado almacena todas las preferencias de accesibilidad y diseño

import { writable } from 'svelte/store';

// Interfaz que define la estructura de la configuración
// Define todas las propiedades que controlan la apariencia de la aplicación
export interface ConfiguracionUI {
	// Controla si el menú de ajustes está visible
	isMenuOpen: boolean; // menu abierto/cerrado
	
	// Multiplicador para el tamaño de fuente base (1 = normal, 1.5 = 150%, etc.)
	fontSizeMultiplier: number; // multiplicador de tamaño de fuente
	
	// Multiplicador para espaciado entre elementos (1 = normal, 1.2 = 120%, etc.)
	spacingMultiplier: number; // multiplicador de espaciado
	
	// Tema de color (ej: 'claro', 'oscuro', 'alto-contraste')
	tema: string; // theme
	
	// Radio de bordes redondeados en píxeles
	borderRadius: number; // radio de borde
	
	// Lupa Mágica: controla si la lupa está habilitada
	magnifierEnabled: boolean; // lupa activa/inactiva
	
	// Lupa Mágica: nivel de magnificación (1.5, 2, 3)
	magnifierZoom: number; // nivel de zoom de la lupa
}

// Valores por defecto para una experiencia estándar
const valoresPorDefecto: ConfiguracionUI = {
	isMenuOpen: false,
	fontSizeMultiplier: 1,
	spacingMultiplier: 1,
	tema: 'claro',
	borderRadius: 8,
	magnifierEnabled: false,
	magnifierZoom: 1.85
};

// Crear el store reactivo
// Cualquier componente puede suscribirse a este store y reaccionar a cambios
function crearStoreSettings() {
	const { subscribe, set, update } = writable<ConfiguracionUI>(valoresPorDefecto);

	return {
		subscribe,
		
		// Alterna la visibilidad del menú de ajustes (abierto ↔ cerrado)
		toggleMenu: () => update(config => ({ 
			...config, 
			isMenuOpen: !config.isMenuOpen 
		})),
		
		// Cierra el menú de ajustes
		cerrarMenu: () => update(config => ({ 
			...config, 
			isMenuOpen: false 
		})),
		
		// Actualiza el multiplicador de tamaño de fuente
		// @param valor - nuevo multiplicador (ej: 1.2 para texto 20% más grande)
		setFontSize: (valor: number) => update(config => ({ 
			...config, 
			fontSizeMultiplier: valor 
		})),
		
		// Actualiza el multiplicador de espaciado
		// @param valor - nuevo multiplicador (ej: 1.5 para espaciado 50% mayor)
		setSpacing: (valor: number) => update(config => ({ 
			...config, 
			spacingMultiplier: valor 
		})),
		
		// Cambia el tema de color de la aplicación
		// @param nuevoTema - nombre del tema ('claro', 'oscuro', 'alto-contraste')
		setTema: (nuevoTema: string) => update(config => ({ 
			...config, 
			tema: nuevoTema 
		})),
		
		// Actualiza el radio de los bordes redondeados
		// @param valor - radio en píxeles
		setBorderRadius: (valor: number) => update(config => ({ 
			...config, 
			borderRadius: valor 
		})),
		
		// Activa o desactiva la lupa mágica
		// @param enabled - true para activar, false para desactivar
		setMagnifierEnabled: (enabled: boolean) => update(config => ({
			...config,
			magnifierEnabled: enabled
		})),
		
		// Alterna el estado de la lupa mágica
		toggleMagnifier: () => update(config => ({
			...config,
			magnifierEnabled: !config.magnifierEnabled
		})),
		
		// Establece el nivel de zoom de la lupa mágica
		// @param zoom - nivel de magnificación (1.5, 2, 3)
		setMagnifierZoom: (zoom: number) => update(config => ({
			...config,
			magnifierZoom: zoom
		})),
		
		// Reinicia toda la configuración a valores por defecto
		reset: () => set(valoresPorDefecto)
	};
}

// Exportar una única instancia del store para usar en toda la app
export const settings = crearStoreSettings();
