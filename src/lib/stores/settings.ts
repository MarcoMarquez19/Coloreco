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
	modoInverso: false
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
		
		// Reinicia toda la configuración a valores por defecto
		reset: () => set(valoresPorDefecto)
	};
}

// Exportar una única instancia del store para usar en toda la app
export const configuraciones = crearEstadoConfiguraciones();
