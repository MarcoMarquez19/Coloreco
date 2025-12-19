/**
 * tts.service.ts - Servicio de Text-to-Speech con resaltado de palabras
 * 
 * Proporciona funcionalidad de narración auditiva sincronizada con
 * resaltado visual palabra por palabra usando Web Speech API.
 * 
 * Cumple con WCAG 2.2 Nivel AA:
 * - 2.2.2 Pause, Stop, Hide
 * - 3.2.1 On Focus
 * - 3.2.2 On Input
 */

export interface TTSOptions {
	lang?: string;
	rate?: number; // 0.75 a 1.75 (1 = normal) - umbrales accesibles
	pitch?: number; // 0 a 2 (1 = normal)
	volume?: number; // 0 a 1
	voice?: SpeechSynthesisVoice;
}

export interface WordEvent {
	word: string;
	charIndex: number;
	charLength: number;
}

type WordCallback = (event: WordEvent) => void;
type EndCallback = () => void;

class TTSService {
	private synthesis: SpeechSynthesis | null = null;
	private utterance: SpeechSynthesisUtterance | null = null;
	private wordCallbacks: WordCallback[] = [];
	private endCallbacks: EndCallback[] = [];
	private currentText: string = '';
	private isPaused: boolean = false;
	private currentOptions: TTSOptions = {};

	constructor() {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			this.synthesis = window.speechSynthesis;
		}
	}

	/**
	 * Reproduce texto con TTS
	 * @param text Texto a narrar
	 * @param options Opciones de voz
	 */
	speak(text: string, options: TTSOptions = {}): void {
		if (!this.synthesis) {
			console.warn('Text-to-Speech no disponible en este navegador');
			return;
		}

		// Detener narración anterior si existe
		this.stop();

		this.currentText = text;
		this.currentOptions = options;
		this.utterance = new SpeechSynthesisUtterance(text);

		// Aplicar opciones (con límites accesibles)
		this.utterance.lang = options.lang || 'es-ES';
		this.utterance.rate = this.clampRate(options.rate || 1);
		this.utterance.pitch = options.pitch || 1;
		this.utterance.volume = options.volume !== undefined ? options.volume : 1;

		if (options.voice) {
			this.utterance.voice = options.voice;
		}

		// Eventos de palabra (boundary)
		this.utterance.addEventListener('boundary', (event) => {
			if (event.name === 'word') {
				this.handleWordEvent(event);
			}
		});

		// Eventos de finalización
		this.utterance.addEventListener('end', () => {
			this.notifyEnd();
			this.cleanup();
		});

		this.utterance.addEventListener('error', (event) => {
			console.error('Error en TTS:', event);
			this.cleanup();
		});

		this.synthesis.speak(this.utterance);
		this.isPaused = false;
	}

	/**
	 * Limita la velocidad a rangos accesibles (WCAG)
	 * @param rate Velocidad solicitada
	 * @returns Velocidad limitada entre 0.75 y 1.75
	 */
	private clampRate(rate: number): number {
		return Math.max(0.75, Math.min(1.75, rate));
	}

	/**
	 * Cambia la velocidad en tiempo real sin interrumpir la lectura
	 * @param newRate Nueva velocidad (0.75 - 1.75)
	 */
	changeSpeed(newRate: number): void {
		if (!this.synthesis) {
			return;
		}

		const clampedRate = this.clampRate(newRate);
		
		// Actualizar las opciones guardadas para futuras reproducciones
		this.currentOptions.rate = clampedRate;
		
		// Si está hablando, cambiar la velocidad dinámicamente
		if (this.synthesis.speaking && !this.isPaused && this.currentText) {
			// Cancelar y reiniciar con nueva velocidad
			// Nota: Web Speech API no soporta cambio de velocidad sin reiniciar
			// Esta es la mejor aproximación posible
			this.synthesis.cancel();
			this.speak(this.currentText, this.currentOptions);
		}
	}

	/**
	 * Maneja el evento de palabra
	 */
	private handleWordEvent(event: SpeechSynthesisEvent): void {
		const charIndex = event.charIndex || 0;
		const charLength = event.charLength || 0;
		const word = this.currentText.slice(charIndex, charIndex + charLength);

		const wordEvent: WordEvent = {
			word,
			charIndex,
			charLength,
		};

		// Notificar a todos los callbacks
		this.wordCallbacks.forEach((callback) => callback(wordEvent));
	}

	/**
	 * Registra un callback para eventos de palabra
	 * @param callback Función a ejecutar cuando se pronuncia una palabra
	 * @returns Función para desregistrar el callback
	 */
	onWord(callback: WordCallback): () => void {
		this.wordCallbacks.push(callback);

		// Retornar función de limpieza
		return () => {
			this.wordCallbacks = this.wordCallbacks.filter((cb) => cb !== callback);
		};
	}

	/**
	 * Registra un callback para cuando termina la narración
	 * @param callback Función a ejecutar cuando termina
	 * @returns Función para desregistrar el callback
	 */
	onEnd(callback: EndCallback): () => void {
		this.endCallbacks.push(callback);

		// Retornar función de limpieza
		return () => {
			this.endCallbacks = this.endCallbacks.filter((cb) => cb !== callback);
		};
	}

	/**
	 * Notifica a todos los callbacks que la narración terminó
	 */
	private notifyEnd(): void {
		this.endCallbacks.forEach((callback) => callback());
	}

	/**
	 * Pausa la narración
	 */
	pause(): void {
		if (this.synthesis && !this.isPaused) {
			this.synthesis.pause();
			this.isPaused = true;
		}
	}

	/**
	 * Resume la narración
	 */
	resume(): void {
		if (this.synthesis && this.isPaused) {
			this.synthesis.resume();
			this.isPaused = false;
		}
	}

	/**
	 * Detiene la narración
	 */
	stop(): void {
		if (this.synthesis) {
			// Cancelar TODO lo que está en la cola de síntesis
			this.synthesis.cancel();
			this.cleanup();
		}
	}

	/**
	 * Limpia el estado interno
	 */
	private cleanup(): void {
		this.utterance = null;
		this.currentText = '';
		this.isPaused = false;
		this.wordCallbacks = [];
		this.endCallbacks = [];
		this.currentOptions = {};
	}

	/**
	 * Obtiene las voces disponibles
	 * @returns Lista de voces disponibles
	 */
	getVoices(): SpeechSynthesisVoice[] {
		if (!this.synthesis) return [];
		return this.synthesis.getVoices();
	}

	/**
	 * Obtiene las voces en español
	 */
	getSpanishVoices(): SpeechSynthesisVoice[] {
		return this.getVoices().filter((voice) => voice.lang.startsWith('es'));
	}

	/**
	 * Verifica si TTS está soportado
	 */
	isSupported(): boolean {
		return this.synthesis !== null;
	}

	/**
	 * Verifica si está hablando actualmente
	 */
	isSpeaking(): boolean {
		return this.synthesis?.speaking || false;
	}

	/**
	 * Verifica si está pausado
	 */
	isPausedState(): boolean {
		return this.isPaused;
	}
}

// Singleton
export const ttsService = new TTSService();

/**
 * Hook de utilidad para cargar voces cuando estén disponibles
 * Las voces pueden cargar de forma asíncrona en algunos navegadores
 */
export function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
	return new Promise((resolve) => {
		const voices = ttsService.getVoices();
		
		if (voices.length > 0) {
			resolve(voices);
		} else {
			if (typeof window !== 'undefined' && window.speechSynthesis) {
				window.speechSynthesis.addEventListener('voiceschanged', () => {
					resolve(ttsService.getVoices());
				}, { once: true });
			} else {
				resolve([]);
			}
		}
	});
}
