import { browser } from '$app/environment';

type ColorBlindnessMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
type ContrastMode = 'normal' | 'high';

class SettingsStore {
    // Estado reactivo con Runes
    isMenuOpen = $state(false);
    fontSizeMultiplier = $state(1);
    spacingMultiplier = $state(1);
    borderRadius = $state(8);
    
    // Nuevas propiedades de accesibilidad visual
    colorBlindness = $state<ColorBlindnessMode>('none');
    intensity = $state(1); // 0 a 1
    textures = $state(false);
    contrast = $state<ContrastMode>('normal');

    constructor() {
        // Cargar configuración guardada al iniciar (solo en cliente)
        if (browser) {
            const saved = localStorage.getItem('coloreco_settings');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    this.fontSizeMultiplier = parsed.fontSizeMultiplier ?? 1;
                    this.spacingMultiplier = parsed.spacingMultiplier ?? 1;
                    this.borderRadius = parsed.borderRadius ?? 8;
                    this.colorBlindness = parsed.colorBlindness ?? 'none';
                    this.intensity = parsed.intensity ?? 1;
                    this.textures = parsed.textures ?? false;
                    this.contrast = parsed.contrast ?? 'normal';
                } catch (e) {
                    console.error('Error cargando configuración:', e);
                }
            }

            // Persistencia automática usando $effect.root para que funcione fuera de componentes
            $effect.root(() => {
                $effect(() => {
                    const dataToSave = {
                        fontSizeMultiplier: this.fontSizeMultiplier,
                        spacingMultiplier: this.spacingMultiplier,
                        borderRadius: this.borderRadius,
                        colorBlindness: this.colorBlindness,
                        intensity: this.intensity,
                        textures: this.textures,
                        contrast: this.contrast
                    };
                    localStorage.setItem('coloreco_settings', JSON.stringify(dataToSave));
                });
            });
        }
    }

    // Acciones
    toggleMenu = () => {
        this.isMenuOpen = !this.isMenuOpen;
    };

    cerrarMenu = () => {
        this.isMenuOpen = false;
    };

    reset = () => {
        this.fontSizeMultiplier = 1;
        this.spacingMultiplier = 1;
        this.borderRadius = 8;
        this.colorBlindness = 'none';
        this.intensity = 1;
        this.textures = false;
        this.contrast = 'normal';
    };
}

// Exportar una instancia única (Singleton)
export const settings = new SettingsStore();
