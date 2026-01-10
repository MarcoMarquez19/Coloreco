/**
 * Store para gestionar la música de fondo y efectos de sonido
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// ============================================================================
// TIPOS
// ============================================================================

interface AudioState {
	/** Música de fondo activada */
	musicEnabled: boolean;
	/** Efectos de sonido activados */
	soundEnabled: boolean;
	/** Volumen de la música (0-1) */
	musicVolume: number;
	/** Volumen de efectos (0-1) */
	soundVolume: number;
	/** Música actual reproduciendo */
	currentMusic: string | null;
}

// ============================================================================
// CONFIGURACIÓN DE AUDIO
// ============================================================================

/** Rutas a archivos de música de fondo por pantalla */
export const MUSIC_TRACKS = {
	modoDibujo: '/audio/music/modo_dibujo.mp3',
	modoCuerpo: '/audio/music/modo_cuerpo.mp3',
	modoHistorias: '/audio/music/modo_historias.mp3',
	default: '/audio/music/background.mp3'
} as const;

/** Rutas a efectos de sonido */
export const SOUND_EFFECTS = {
	click: '/audio/effects/click.mp3',
	success: '/audio/effects/success.mp3',
	error: '/audio/effects/error.mp3',
	hover: '/audio/effects/hover.mp3',
	draw: '/audio/effects/draw.mp3',
	save: '/audio/effects/save.mp3',
	warning: '/audio/effects/warning.mp3',
	achievement: '/audio/effects/achievement.mp3',
	finished: '/audio/effects/finished.mp3',
	// Herramientas de dibujo
	pencil: '/audio/effects/pencil.mp3', // Sonido de lápiz para pincel
	eraser: '/audio/effects/eraser.mp3', // Sonido de borrador
	stickerPlace: '/audio/effects/sticker.mp3' // Sonido al colocar sticker
} as const;

// ============================================================================
// ESTADO INICIAL
// ============================================================================

const INITIAL_STATE: AudioState = {
	musicEnabled: true,
	soundEnabled: true,
	musicVolume: 0.5,
	soundVolume: 0.5,
	currentMusic: null
};

// ============================================================================
// STORE
// ============================================================================

function createAudioStore() {
	const { subscribe, set, update } = writable<AudioState>(INITIAL_STATE);

	// Audio elements (solo en el navegador)
	let musicPlayer: HTMLAudioElement | null = null;
	let soundPlayers: Map<string, HTMLAudioElement> = new Map();
	let loopPlayer: HTMLAudioElement | null = null; // Reproductor para efectos en loop

	// Inicializar reproductores en el navegador
	if (browser) {
		// Cargar configuración guardada
		const saved = localStorage.getItem('coloreco-audio-settings');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				set({ ...INITIAL_STATE, ...parsed, currentMusic: null });
			} catch (e) {
				console.error('Error cargando configuración de audio:', e);
			}
		}

		// Crear reproductor de música
		musicPlayer = new Audio();
		musicPlayer.loop = true;
		musicPlayer.volume = INITIAL_STATE.musicVolume;

		// Precargar efectos de sonido
		Object.entries(SOUND_EFFECTS).forEach(([key, path]) => {
			const audio = new Audio(path);
			audio.volume = INITIAL_STATE.soundVolume;
			soundPlayers.set(key, audio);
		});
	}

	return {
		subscribe,

		/**
		 * Reproducir música de fondo para una pantalla específica
		 */
		playMusic: (track: keyof typeof MUSIC_TRACKS) => {
			if (!browser || !musicPlayer) return;

			const state = get({ subscribe });
			if (!state.musicEnabled) return;

			const musicPath = MUSIC_TRACKS[track] || MUSIC_TRACKS.default;

			// Si ya está reproduciendo esta música, no hacer nada
			if (state.currentMusic === musicPath && !musicPlayer.paused) {
				return;
			}

			update(s => ({ ...s, currentMusic: musicPath }));

			musicPlayer.src = musicPath;
			musicPlayer.volume = state.musicVolume;
			musicPlayer.play().catch(err => {
				console.log('No se pudo reproducir música (requiere interacción del usuario):', err);
			});
		},

		/**
		 * Detener música de fondo
		 */
		stopMusic: () => {
			if (!browser || !musicPlayer) return;
			musicPlayer.pause();
			musicPlayer.currentTime = 0;
			update(s => ({ ...s, currentMusic: null }));
		},

		/**
		 * Reproducir efecto de sonido
		 */
		playSound: (effect: keyof typeof SOUND_EFFECTS) => {
			if (!browser) return;

			const state = get({ subscribe });
			if (!state.soundEnabled) return;

			const audio = soundPlayers.get(effect);
			if (audio) {
				audio.currentTime = 0;
				audio.volume = state.soundVolume;
				audio.play().catch(err => {
					console.log('No se pudo reproducir sonido:', err);
				});
			}
		},

		/**
		 * Reproducir efecto de sonido en loop (para herramientas de dibujo)
		 */
		playLoopSound: (effect: keyof typeof SOUND_EFFECTS) => {
			if (!browser) return;

			const state = get({ subscribe });
			if (!state.soundEnabled) return;

			// Detener loop anterior si existe
			if (loopPlayer && !loopPlayer.paused) {
				loopPlayer.pause();
				loopPlayer.currentTime = 0;
			}

			// Crear nuevo reproductor de loop
			const soundPath = SOUND_EFFECTS[effect];
			loopPlayer = new Audio(soundPath);
			loopPlayer.loop = true;
			loopPlayer.volume = state.soundVolume;
			loopPlayer.play().catch(err => {
				console.log('No se pudo reproducir sonido en loop:', err);
			});
		},

		/**
		 * Detener el efecto de sonido en loop
		 */
		stopLoopSound: () => {
			if (!browser || !loopPlayer) return;

			if (!loopPlayer.paused) {
				loopPlayer.pause();
				loopPlayer.currentTime = 0;
			}
		},

		/**
		 * Activar/desactivar música
		 */
		toggleMusic: (enabled?: boolean) => {
			update(s => {
				const newEnabled = enabled !== undefined ? enabled : !s.musicEnabled;
				
				if (!newEnabled && musicPlayer && !musicPlayer.paused) {
					musicPlayer.pause();
				} else if (newEnabled && s.currentMusic && musicPlayer) {
					musicPlayer.play().catch(() => {});
				}

				const newState = { ...s, musicEnabled: newEnabled };
				if (browser) {
					localStorage.setItem('coloreco-audio-settings', JSON.stringify(newState));
				}
				return newState;
			});
		},

		/**
		 * Activar/desactivar efectos de sonido
		 */
		toggleSound: (enabled?: boolean) => {
			update(s => {
				const newState = { ...s, soundEnabled: enabled !== undefined ? enabled : !s.soundEnabled };
				if (browser) {
					localStorage.setItem('coloreco-audio-settings', JSON.stringify(newState));
				}
				return newState;
			});
		},

		/**
		 * Ajustar volumen de música
		 */
		setMusicVolume: (volume: number) => {
			const clampedVolume = Math.max(0, Math.min(1, volume));
			update(s => {
				if (musicPlayer) {
					musicPlayer.volume = clampedVolume;
				}
				const newState = { ...s, musicVolume: clampedVolume };
				if (browser) {
					localStorage.setItem('coloreco-audio-settings', JSON.stringify(newState));
				}
				return newState;
			});
		},

		/**
		 * Ajustar volumen de efectos
		 */
		setSoundVolume: (volume: number) => {
			const clampedVolume = Math.max(0, Math.min(1, volume));
			update(s => {
				soundPlayers.forEach(audio => {
					audio.volume = clampedVolume;
				});
				const newState = { ...s, soundVolume: clampedVolume };
				if (browser) {
					localStorage.setItem('coloreco-audio-settings', JSON.stringify(newState));
				}
				return newState;
			});
		},

		/**
		 * Resetear configuración de audio
		 */
		reset: () => {
			set(INITIAL_STATE);
			if (browser) {
				localStorage.removeItem('coloreco-audio-settings');
			}
		}
	};
}

export const audioStore = createAudioStore();

// ============================================================================
// HELPER: Directiva para agregar sonido a botones
// ============================================================================

/**
 * Acción de Svelte para agregar sonido de click a cualquier elemento
 * Uso: <button use:clickSound>Click me</button>
 */
export function clickSound(node: HTMLElement) {
	function handleClick() {
		audioStore.playSound('click');
	}

	node.addEventListener('click', handleClick);

	return {
		destroy() {
			node.removeEventListener('click', handleClick);
		}
	};
}
