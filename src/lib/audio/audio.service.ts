/**
 * audio.service.ts - Servicio de efectos de audio y retroalimentación sonora
 * 
 * Proporciona reproducción de efectos de sonido para interacciones del usuario:
 * - Respuestas correctas/incorrectas
 * - Clicks y hover
 * - Logros desbloqueados
 */

export type SoundEffect = 'correct' | 'incorrect' | 'click' | 'hover' | 'achievement' | 'complete';

interface AudioConfig {
	volume: number;
	enabled: boolean;
}

class AudioService {
	private audioContext: AudioContext | null = null;
	private config: AudioConfig = {
		volume: 0.7,
		enabled: true,
	};

	constructor() {
		if (typeof window !== 'undefined') {
			this.initAudioContext();
		}
	}

	private initAudioContext(): void {
		try {
			this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		} catch (e) {
			console.warn('Web Audio API no soportada', e);
		}
	}

	/**
	 * Reproduce un efecto de sonido sintético
	 */
	async playSound(effect: SoundEffect): Promise<void> {
		if (!this.config.enabled || !this.audioContext) return;

		const now = this.audioContext.currentTime;
		const oscillator = this.audioContext.createOscillator();
		const gainNode = this.audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(this.audioContext.destination);

		// Configurar según el tipo de efecto
		switch (effect) {
			case 'correct':
				this.playCorrectSound(oscillator, gainNode, now);
				break;
			case 'incorrect':
				this.playIncorrectSound(oscillator, gainNode, now);
				break;
			case 'click':
				this.playClickSound(oscillator, gainNode, now);
				break;
			case 'hover':
				this.playHoverSound(oscillator, gainNode, now);
				break;
			case 'achievement':
				this.playAchievementSound(oscillator, gainNode, now);
				break;
			case 'complete':
				this.playCompleteSound(oscillator, gainNode, now);
				break;
		}

		oscillator.start(now);
	}

	private playCorrectSound(osc: OscillatorNode, gain: GainNode, time: number): void {
		// Sonido ascendente alegre
		osc.type = 'sine';
		osc.frequency.setValueAtTime(523.25, time); // C5
		osc.frequency.exponentialRampToValueAtTime(659.25, time + 0.1); // E5
		osc.frequency.exponentialRampToValueAtTime(783.99, time + 0.2); // G5

		gain.gain.setValueAtTime(this.config.volume, time);
		gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
		osc.stop(time + 0.3);
	}

	private playIncorrectSound(osc: OscillatorNode, gain: GainNode, time: number): void {
		// Sonido descendente
		osc.type = 'square';
		osc.frequency.setValueAtTime(440, time); // A4
		osc.frequency.exponentialRampToValueAtTime(220, time + 0.2); // A3

		gain.gain.setValueAtTime(this.config.volume * 0.6, time);
		gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
		osc.stop(time + 0.25);
	}

	private playClickSound(osc: OscillatorNode, gain: GainNode, time: number): void {
		// Click corto
		osc.type = 'sine';
		osc.frequency.setValueAtTime(800, time);

		gain.gain.setValueAtTime(this.config.volume * 0.3, time);
		gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
		osc.stop(time + 0.05);
	}

	private playHoverSound(osc: OscillatorNode, gain: GainNode, time: number): void {
		// Hover suave
		osc.type = 'sine';
		osc.frequency.setValueAtTime(600, time);

		gain.gain.setValueAtTime(this.config.volume * 0.2, time);
		gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
		osc.stop(time + 0.08);
	}

	private playAchievementSound(osc: OscillatorNode, gain: GainNode, time: number): void {
		// Fanfarria de logro
		osc.type = 'triangle';
		osc.frequency.setValueAtTime(523.25, time); // C5
		osc.frequency.setValueAtTime(659.25, time + 0.1); // E5
		osc.frequency.setValueAtTime(783.99, time + 0.2); // G5
		osc.frequency.setValueAtTime(1046.5, time + 0.3); // C6

		gain.gain.setValueAtTime(this.config.volume, time);
		gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
		osc.stop(time + 0.5);
	}

	private playCompleteSound(osc: OscillatorNode, gain: GainNode, time: number): void {
		// Sonido de completado
		osc.type = 'sine';
		osc.frequency.setValueAtTime(659.25, time); // E5
		osc.frequency.setValueAtTime(783.99, time + 0.15); // G5

		gain.gain.setValueAtTime(this.config.volume * 0.8, time);
		gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
		osc.stop(time + 0.4);
	}

	/**
	 * Configura el volumen global
	 */
	setVolume(volume: number): void {
		this.config.volume = Math.max(0, Math.min(1, volume));
	}

	/**
	 * Habilita o deshabilita sonidos
	 */
	setEnabled(enabled: boolean): void {
		this.config.enabled = enabled;
	}

	/**
	 * Obtiene la configuración actual
	 */
	getConfig(): AudioConfig {
		return { ...this.config };
	}

	/**
	 * Reproduce un archivo de audio externo
	 */
	async playAudioFile(url: string): Promise<void> {
		if (!this.config.enabled) return;

		try {
			const audio = new Audio(url);
			audio.volume = this.config.volume;
			await audio.play();
		} catch (e) {
			console.error('Error reproduciendo audio:', e);
		}
	}
}

// Singleton
export const audioService = new AudioService();
