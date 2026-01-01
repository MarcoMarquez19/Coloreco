// Store de configuración para la UI adaptativa de COLORECO
// Este "cerebro" centralizado almacena todas las preferencias de accesibilidad y diseño

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { obtenerSesionActual } from '$lib/db/artistas.service';
import { guardarAjustesDesdeUI, cargarAjustesDelArtista } from '$lib/db/ajustes.service';

// === Tipos daltonismo ===
export type ColorBlindnessMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
export type ContrastMode = 'normal' | 'high';

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

//DISLEXIA
	bionicMode: boolean; // activar lectura biónica
	narrationEnabled: boolean; // activar narración TTS
	ttsSpeed: number; // velocidad de narración (0.1 - 10)
	// Nombre de la voz TTS preferida (p. ej. 'Sabina')
	ttsVoiceName?: string | null;
	rhymeMode: boolean; // resaltar rimas
	pictogramMode: boolean; // mostrar pictogramas

	// === Propiedades daltonismo ===
	colorBlindness: ColorBlindnessMode;
	intensity: number; // 0 a 1
	textures: boolean;
	contrast: ContrastMode;

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

//DISLEXIA
	bionicMode: false,
	narrationEnabled: false,
	ttsSpeed: 1,
	ttsVoiceName: null,
	rhymeMode: false,
	pictogramMode: false,

	// Daltonismo
	colorBlindness: 'none',
	intensity: 1,
	textures: false,
	contrast: 'normal'
};

// Crear el store reactivo
// Cualquier componente puede suscribirse a este store y reaccionar a cambios
function crearEstadoConfiguraciones() {
	// Lógica de carga inicial desde localStorage (Agregada para persistencia)
	let estadoInicial = valoresPorDefecto;
	if (browser) {
		const guardado = localStorage.getItem('coloreco_settings');
		if (guardado) {
			try {
				estadoInicial = { ...valoresPorDefecto, ...JSON.parse(guardado) };
			} catch (e) {
				console.error('Error cargando configuración:', e);
			}
		}
	}

	const { subscribe, set, update } = writable<ConfiguracionUI>(estadoInicial);

	// Persistencia automática: guardar solo después de la hidración inicial.
	// Esto evita que el valor por defecto o el localStorage sobrescriban
	// los ajustes del artista al recargar la página.
	if (browser) {
		(async () => {
			try {
				const sesion = await obtenerSesionActual();
				const artistaId = sesion?.artistaActualId ?? null;
				if (artistaId) {
					// Hidratar desde la BD antes de suscribir para evitar sobrescrituras
					await cargarAjustesDelArtista(artistaId);
				}
			} catch (e) {
				console.error('Error durante hidratación inicial de configuraciones:', e);
			}
			// Tras hidratación, suscribirse para persistir cambios
			subscribe(valor => {
				// Ejecutar async en segundo plano para no bloquear el store
				(async () => {
					try {
						const sesion2 = await obtenerSesionActual();
						const artistaId2 = sesion2?.artistaActualId ?? null;
						if (artistaId2) {
							// Guardar en Dexie para el artista activo
							await guardarAjustesDesdeUI(artistaId2);
						} else {
							// Sin artista: persistir temporalmente en localStorage
							localStorage.setItem('coloreco_settings', JSON.stringify(valor));
						}
					} catch (e) {
						// Si falla la BD, fallback a localStorage
						console.error('Error guardando configuraciones:', e);
						try { localStorage.setItem('coloreco_settings', JSON.stringify(valor)); } catch {}
					}
				})();
			});
		})();
	}

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
		
		// Setter explícito para modoNoche (evita toggles inconsistentes)
		setModoNoche: (value: boolean) => update(config => ({
			...config,
			modoNoche: value,
			// Si desactivamos modoNoche, forzamos modoInverso a false
			modoInverso: value ? config.modoInverso : false
		})),
		// Alterna el modo noche (alto contraste con fondo oscuro)
		toggleModoNoche: () => update(config => {
			const nuevoModo = !config.modoNoche;
			return {
				...config,
				modoNoche: nuevoModo,
				modoInverso: nuevoModo ? config.modoInverso : false
			};
		}),
		
		// Setter explícito para modoInverso (activa modoNoche si se habilita)
		setModoInverso: (value: boolean) => update(config => ({
			...config,
			modoInverso: value,
			modoNoche: value ? true : config.modoNoche
		})),
		// Alterna el modo inverso (invierte la paleta del modo noche)
		toggleModoInverso: () => update(config => {
			const nuevoInv = !config.modoInverso;
			return {
				...config,
				modoInverso: nuevoInv,
				modoNoche: nuevoInv ? true : config.modoNoche
			};
		}),

		//DISLEXIA
		// HU-02: Lectura biónica
		toggleBionicMode: () => update(config => ({
			...config,
			bionicMode: !config.bionicMode
		})),
		// HU-03: Narración auditiva
		toggleNarration: () => {
			update(config => {
				const nuevoEstado = !config.narrationEnabled;
				
				// Ajustar volúmenes según el estado de narración
				if (browser) {
					import('$lib/stores/audio').then(({ audioStore }) => {
						if (nuevoEstado) {
							// Activar narración: reducir música y efectos al 10%
							audioStore.setMusicVolume(0.1);
							audioStore.setSoundVolume(0.1);
						} else {
							// Desactivar narración: restaurar volúmenes predeterminados
							audioStore.setMusicVolume(0.5);
							audioStore.setSoundVolume(0.5);
						}
					});
				}
				
				return {
					...config,
					narrationEnabled: nuevoEstado
				};
			});
		},
		// Setter explícito para narración (usado por sincronización BD → UI)
		setNarrationEnabled: (value: boolean) => {
			update(config => {
				// Ajustar volúmenes según el estado de narración
				if (browser) {
					import('$lib/stores/audio').then(({ audioStore }) => {
						if (value) {
							// Activar narración: reducir música y efectos al 10%
							audioStore.setMusicVolume(0.1);
							audioStore.setSoundVolume(0.1);
						} else {
							// Desactivar narración: restaurar volúmenes predeterminados
							audioStore.setMusicVolume(0.5);
							audioStore.setSoundVolume(0.5);
						}
					});
				}
				
				return {
					...config,
					narrationEnabled: value
				};
			});
		},
		
		setTTSSpeed: (speed: number) => update(config => ({
			...config,
			ttsSpeed: speed
		})),
		// Guardar nombre de voz TTS preferida (no expuesto en la UI por ahora)
		setTTSVoiceName: (name: string | null) => update(config => ({
			...config,
			ttsVoiceName: name
		})),
		
		// HU-04: Rimas
		toggleRhymeMode: () => update(config => ({
			...config,
			rhymeMode: !config.rhymeMode
		})),
		// Setter explícito para modoRima
		setRhymeMode: (value: boolean) => update(config => ({
			...config,
			rhymeMode: value
		})),
		
		// HU-05: Pictogramas
		togglePictogramMode: () => update(config => ({
			...config,
			pictogramMode: !config.pictogramMode
		})),
		// Setter explícito para pictogramas
		setPictogramMode: (value: boolean) => update(config => ({
			...config,
			pictogramMode: value
		})),
		
		// Setter explícito para modo biónico
		setBionicMode: (value: boolean) => update(config => ({
			...config,
			bionicMode: value
		})),
		//HASTA AQUI DISLEXIA

		// === Métodos daltonismo ===
		setColorBlindness: (mode: ColorBlindnessMode) => update(config => ({ ...config, colorBlindness: mode })),
		setIntensity: (val: number) => update(config => ({ ...config, intensity: val })),
		setTextures: (enabled: boolean) => update(config => ({ ...config, textures: enabled })),
		setContrast: (mode: ContrastMode) => update(config => ({ ...config, contrast: mode })),

		
		// Reinicia toda la configuración a valores por defecto
		reset: () => set(valoresPorDefecto)
	};
}

// Exportar una única instancia del store para usar en toda la app
export const configuraciones = crearEstadoConfiguraciones();
