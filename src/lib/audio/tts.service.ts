/**
 * tts.service.ts - Servicio de Text-to-Speech con resaltado de palabras
 * 
 * Versión ultra-optimizada para niños de 7 años con voz natural y expresiva
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
	rate?: number;
	pitch?: number;
	volume?: number;
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
	private currentPromiseReject: ((e?: any) => void) | null = null;

	private preferredVoiceName: string | null = null;
	private selectedVoice: SpeechSynthesisVoice | null = null;
	// Si es true, siempre priorizamos voces Google disponibles (persistido en localStorage)
	private forceGoogle: boolean = false;

	// Configuración ultra-optimizada para voz natural
	private readonly CHILD_FRIENDLY_DEFAULTS = {
		rate: 0.9,      // Velocidad natural y cómoda
		pitch: 1.1,     // Pitch ligeramente elevado pero natural
		volume: 0.95    // Volumen claro
	};

	constructor() {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			this.synthesis = window.speechSynthesis;

			try {
				const pref = (window.localStorage && window.localStorage.getItem && window.localStorage.getItem('coloreco_tts_preferred_voice')) || null;
				if (pref) this.preferredVoiceName = pref;
			// Leer flag para forzar Google si existe. Si NO existe, activamos forceGoogle por defecto
			const rawForce = (window.localStorage && window.localStorage.getItem && window.localStorage.getItem('coloreco_tts_force_google'));
			if (rawForce === null) {
				this.forceGoogle = true;
				try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('coloreco_tts_force_google', 'true'); } catch (e) {}
			} else {
				this.forceGoogle = rawForce === 'true';
			} 
			} catch (e) {
				/* Ignorar errores de acceso a localStorage */
			}

			this.synthesis.addEventListener('voiceschanged', () => {
				if (this.preferredVoiceName) {
					this.setVoiceByName(this.preferredVoiceName);
				} else if (this.forceGoogle) {
					const g = this.selectGoogleVoice();
					if (g) {
						this.selectedVoice = g;
					} else {
						const best = this.selectBestAvailableVoice();
						if (best) {
							this.selectedVoice = best;
						}
					}
				} else {
					const best = this.selectBestAvailableVoice();
					if (best) {
						this.selectedVoice = best;
					}
				}
			});

			// Intentar cargar voces inmediatamente
			const voices = this.synthesis.getVoices();
			if (voices.length > 0 && !this.selectedVoice) {
				if (this.preferredVoiceName) {
					this.setVoiceByName(this.preferredVoiceName);
				} else if (this.forceGoogle) {
					const g = this.selectGoogleVoice();
					if (g) {
						this.selectedVoice = g;
						console.log('🎤 Voz inicial forzada Google:', g.name);
					} else {
						const best = this.selectBestAvailableVoice();
						if (best) {
							this.selectedVoice = best;
							console.log('🎤 Voz inicial:', best.name);
						}
					}
				} else {
					const best = this.selectBestAvailableVoice();
					if (best) {
						this.selectedVoice = best;
						console.log('🎤 Voz inicial:', best.name);
					}
				}
			}
		}
	}

	/**
	 * Preprocesa el texto para hacerlo más expresivo y natural
	 * Usa técnicas de procesamiento de lenguaje natural
	 */
	private preprocessText(text: string): string {
		let processed = text;
		
		// Normalizar espacios antes de procesar
		processed = processed.trim().replace(/\s+/g, ' ');
		
		// Añadir micro-pausas con espacios extra para puntuación
		// Esto ayuda a que la voz suene más natural y menos robótica
		processed = processed.replace(/\.\s*/g, '.  ');   // Pausa larga después de punto
		processed = processed.replace(/,\s*/g, ', ');      // Pausa corta después de coma
		processed = processed.replace(/;\s*/g, ';  ');     // Pausa media después de punto y coma
		processed = processed.replace(/:\s*/g, ': ');      // Pausa corta después de dos puntos
		processed = processed.replace(/\?\s*/g, '?  ');    // Pausa larga después de pregunta
		processed = processed.replace(/!\s*/g, '!  ');     // Pausa larga después de exclamación
		processed = processed.replace(/\n/g, '.  ');       // Convertir saltos de línea en pausas
		
		// Enfatizar palabras importantes añadiendo espacios
		// Esto hace que la voz tome más tiempo en palabras clave
		processed = processed.replace(/\b(muy|mucho|super|increíble|genial|excelente|fantástico|maravilloso)\b/gi, ' $1 ');
		
		// Mejorar pronunciación de números
		processed = processed.replace(/\b(\d+)\b/g, ' $1 ');
		
		// Limpiar espacios múltiples al final
		processed = processed.replace(/\s{3,}/g, '  ').trim();
		
		return processed;
	}

	/**
	 * Reproduce texto con TTS ultra-optimizado para niños
	 */
	speak(text: string, options: TTSOptions = {}): void {
		if (!this.synthesis) {
			console.warn('Text-to-Speech no disponible en este navegador');
			return;
		}

		// Detener narración anterior
		this.stop();

		// Asegurar que tenemos la mejor voz disponible
		if (!this.selectedVoice) {
			const best = this.selectBestAvailableVoice();
			if (best) this.selectedVoice = best;
		}

		// Preprocesar texto para mejor naturalidad
		const processedText = this.preprocessText(text);
		this.currentText = text;
		this.currentOptions = options;
		this.utterance = new SpeechSynthesisUtterance(processedText);

		// Configuración optimizada para máxima naturalidad
		this.utterance.lang = options.lang || 'es-ES';
		this.utterance.rate = this.clampRate(options.rate !== undefined ? options.rate : this.CHILD_FRIENDLY_DEFAULTS.rate);
		this.utterance.pitch = options.pitch !== undefined ? options.pitch : this.CHILD_FRIENDLY_DEFAULTS.pitch;
		this.utterance.volume = options.volume !== undefined ? options.volume : this.CHILD_FRIENDLY_DEFAULTS.volume;

		// Selección de voz: prioridad -> options.voice -> Google (si forzado) -> voz seleccionada -> fallback
		let voiceToUse: SpeechSynthesisVoice | undefined = options.voice;
		if (!voiceToUse && this.forceGoogle) {
			const g = this.selectGoogleVoice();
			if (g) voiceToUse = g;
		}
		if (!voiceToUse) {
			voiceToUse = this.selectedVoice || undefined;
		}
		if (voiceToUse) {
			this.utterance.voice = voiceToUse;
			console.log('🗣️ Usando voz:', voiceToUse.name, '| Rate:', this.utterance.rate, '| Pitch:', this.utterance.pitch);
		} else {
			console.warn('⚠️ No se pudo seleccionar una voz específica, usando voz por defecto del sistema');
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
			if (this.currentPromiseReject) {
				const rejectFn = this.currentPromiseReject;
				this.currentPromiseReject = null;
			}
			this.cleanup();
		});

		this.utterance.addEventListener('error', (event) => {
			console.error('Error en TTS:', event);
			if (this.currentPromiseReject) {
				this.currentPromiseReject(new Error('tts-error'));
				this.currentPromiseReject = null;
			}
			this.cleanup();
		});

		// Iniciar reproducción
		this.synthesis.speak(this.utterance);
		this.isPaused = false;
	}

	/**
	 * Reproduce texto y devuelve una promesa
	 */
	speakAsync(text: string, options: TTSOptions = {}): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.synthesis) {
				reject(new Error('TTS not supported'));
				return;
			}

			this.speak(text, options);

			const utter = this.utterance;
			if (!utter) {
				reject(new Error('Failed to create utterance'));
				return;
			}

			let finished = false;

			const onEnd = () => {
				if (finished) return;
				finished = true;
				cleanupListeners();
				resolve();
			};

			const onError = (e: any) => {
				if (finished) return;
				finished = true;
				cleanupListeners();
				reject(e || new Error('tts-error'));
			};

			const cleanupListeners = () => {
				utter.removeEventListener('end', onEnd);
				utter.removeEventListener('error', onError as any);
				this.currentPromiseReject = null;
			};

			utter.addEventListener('end', onEnd);
			utter.addEventListener('error', onError as any);

			this.currentPromiseReject = (e?: any) => {
				if (finished) return;
				finished = true;
				cleanupListeners();
				reject(e || new Error('tts-cancelled'));
			};
		});
	}

	private clampRate(rate: number): number {
		return Math.max(0.75, Math.min(1.75, rate));
	}

	changeSpeed(newRate: number): void {
		if (!this.synthesis) return;

		const clampedRate = this.clampRate(newRate);
		this.currentOptions.rate = clampedRate;
		
		if (this.synthesis.speaking && !this.isPaused && this.currentText) {
			this.synthesis.cancel();
			this.speak(this.currentText, this.currentOptions);
		}
	}

	private handleWordEvent(event: SpeechSynthesisEvent): void {
		const charIndex = event.charIndex || 0;
		const charLength = event.charLength || 0;
		const word = this.currentText.slice(charIndex, charIndex + charLength);

		const wordEvent: WordEvent = {
			word,
			charIndex,
			charLength,
		};

		this.wordCallbacks.forEach((callback) => callback(wordEvent));
	}

	onWord(callback: WordCallback): () => void {
		this.wordCallbacks.push(callback);
		return () => {
			this.wordCallbacks = this.wordCallbacks.filter((cb) => cb !== callback);
		};
	}

	onEnd(callback: EndCallback): () => void {
		this.endCallbacks.push(callback);
		return () => {
			this.endCallbacks = this.endCallbacks.filter((cb) => cb !== callback);
		};
	}

	onEndOnce(callback: EndCallback): () => void {
		const wrapper = () => {
			try {
				callback();
			} finally {
				this.endCallbacks = this.endCallbacks.filter((cb) => cb !== wrapper);
			}
		};

		this.endCallbacks.push(wrapper);
		return () => {
			this.endCallbacks = this.endCallbacks.filter((cb) => cb !== wrapper);
		};
	}

	private notifyEnd(): void {
		this.endCallbacks.forEach((callback) => callback());
	}

	pause(): void {
		if (this.synthesis && !this.isPaused) {
			this.synthesis.pause();
			this.isPaused = true;
		}
	}

	resume(): void {
		if (this.synthesis && this.isPaused) {
			this.synthesis.resume();
			this.isPaused = false;
		}
	}

	stop(): void {
		if (this.synthesis) {
			this.synthesis.cancel();
			if (this.currentPromiseReject) {
				try { this.currentPromiseReject(new Error('tts-cancelled')); } catch {}
				this.currentPromiseReject = null;
			}
			this.cleanup();
		}
	}

	private cleanup(): void {
		this.utterance = null;
		this.currentText = '';
		this.isPaused = false;
		this.currentOptions = {};
	}

	getVoices(): SpeechSynthesisVoice[] {
		if (!this.synthesis) return [];
		return this.synthesis.getVoices();
	}

	getSpanishVoices(): SpeechSynthesisVoice[] {
		return this.getVoices().filter((voice) => voice.lang.startsWith('es'));
	}

	setVoiceByName(name: string): boolean {
		const voices = this.getVoices();
		const found = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()) || v.name === name);
		if (found) {
			this.selectedVoice = found;
			this.preferredVoiceName = found.name;
			console.log('✅ Voz configurada:', found.name, '(' + found.lang + ')');
			try { 
				if (typeof window !== 'undefined' && window.localStorage) {
					window.localStorage.setItem('coloreco_tts_preferred_voice', found.name);
				}
			} catch (e) {}
			try { 
				import('$lib/stores/settings').then(({ configuraciones }) => 
					configuraciones.setTTSVoiceName(found.name)
				);
			} catch (e) {}
			return true;
		}
		return false;
	}

	setVoiceByIndex(index: number): boolean {
		const voices = this.getVoices();
		if (index >= 0 && index < voices.length) {
			this.selectedVoice = voices[index];
			this.preferredVoiceName = voices[index].name;
			console.log('✅ Voz configurada:', voices[index].name);
			try { 
				if (typeof window !== 'undefined' && window.localStorage) {
					window.localStorage.setItem('coloreco_tts_preferred_voice', voices[index].name);
				}
			} catch (e) {}
			try { 
				import('$lib/stores/settings').then(({ configuraciones }) => 
					configuraciones.setTTSVoiceName(voices[index].name)
				);
			} catch (e) {}
			return true;
		}
		return false;
	}

	/**
	 * Forzar el uso de voces Google cuando estén disponibles
	 */
	setForceGoogle(force: boolean): void {
		this.forceGoogle = !!force;
		try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('coloreco_tts_force_google', this.forceGoogle ? 'true' : 'false'); } catch (e) {}
		if (this.forceGoogle) {
			const g = this.selectGoogleVoice();
			if (g) {
				this.selectedVoice = g;
				try { import('$lib/stores/settings').then(({ configuraciones }) => configuraciones.setTTSVoiceName(g.name)); } catch (e) {}
				console.log('✅ Forzando voz Google:', g.name);
			} else {
				console.warn('⚠️ Se pidió forzar Google, pero no se encontró voz Google disponible');
			}
		} else {
			// Restaurar preferida o seleccionar la mejor disponible
			if (this.preferredVoiceName) {
				this.setVoiceByName(this.preferredVoiceName);
			} else {
				const best = this.selectBestAvailableVoice();
				if (best) this.selectedVoice = best;
			}
		}
	}

	isForceGoogle(): boolean {
		return this.forceGoogle;
	}

	/**
	 * Selección MEJORADA de voces - Prioriza SOLO voces premium y naturales
	 */
	selectBestAvailableVoice(): SpeechSynthesisVoice | undefined {
		const allVoices = this.getVoices();
		const spanishVoices = allVoices.filter(v => v.lang.startsWith('es'));
		
		if (!spanishVoices.length) {
			console.warn('⚠️ No hay voces en español disponibles');
			return undefined;
		}

		// NIVEL 1: Voces premium/neurales (las mejores)
		const premiumKeywords = [
			'neural', 'premium', 'enhanced', 'natural', 'wavenet',
			'google', 'microsoft', 'azure', 'cloud', 'studio'
		];

		// NIVEL 2: Voces específicas conocidas por ser naturales
		const knownGoodVoices = [
			'sabina', 'monica', 'lucia', 'paulina', 'jorge',
			'helena', 'marisol', 'carmen', 'rosa', 'esperanza',
			'google español', 'microsoft helena'
		];

		// NIVEL 3: Voces femeninas (generalmente más cálidas)
		const femaleKeywords = [
			'female', 'woman', 'mujer', 'femenino',
			'monica', 'lucia', 'helena', 'paulina', 'sabina',
			'carmen', 'rosa', 'maria', 'ana', 'sofia'
		];

		const scoreVoice = (voice: SpeechSynthesisVoice): number => {
			let score = 0;
			const nameLower = voice.name.toLowerCase();
			const langLower = voice.lang.toLowerCase();

			// CRÍTICO: Voces neurales/premium (máxima prioridad)
			for (const keyword of premiumKeywords) {
				if (nameLower.includes(keyword)) {
					score += 50; // Puntaje MUY alto
					break; // Solo contar una vez
				}
			}

			// Voces conocidas de alta calidad
			for (const goodVoice of knownGoodVoices) {
				if (nameLower.includes(goodVoice)) {
					score += 30;
					break;
				}
			}

			// Voces femeninas (más cálidas)
			for (const keyword of femaleKeywords) {
				if (nameLower.includes(keyword)) {
					score += 20;
					break;
				}
			}

			// Voces online son generalmente mejores
			if (!voice.localService) score += 25;

			// Voces por defecto del sistema
			if (voice.default) score += 10;

			// Preferir español latinoamericano neutral
			if (langLower.includes('es-mx') || langLower.includes('es-us')) score += 15;
			else if (langLower.includes('es-es')) score += 10;

			// PENALIZACIÓN FUERTE para voces masculinas/robóticas
			if (/male|masculino|hombre|robot|system|default/i.test(nameLower) && 
			    !/female|femenino/i.test(nameLower)) {
				score -= 30;
			}

			// PENALIZACIÓN para voces que suenan genéricas/antiguas
			if (/compact|basic|lite|simple|old/i.test(nameLower)) {
				score -= 20;
			}

			return score;
		};

		// Puntuar todas las voces
		const scoredVoices = spanishVoices.map(voice => ({
			voice,
			score: scoreVoice(voice)
		})).sort((a, b) => b.score - a.score);

		// Retornar la mejor voz
		const bestVoice = scoredVoices[0]?.voice;

		return bestVoice || spanishVoices[0];
	}

	/**
	 * Busca la mejor voz de Google disponible.
	 * Si `forceGoogle` está activo, prioriza conscientemente la variante en-US
	 * (útil para obtener la voz Google US en navegadores que la exponen).
	 */
	selectGoogleVoice(): SpeechSynthesisVoice | undefined {
		const voices = this.getVoices();
		const googleVoices = voices.filter(v => v.name.toLowerCase().includes('google'));
		if (!googleVoices.length) return undefined;

		// Si se forzó Google, preferir explícitamente en-US -> es -> en
		if (this.forceGoogle) {
			let found = googleVoices.find(v => v.lang.toLowerCase().startsWith('es-us'));
			if (found) return found;
			found = googleVoices.find(v => v.lang.toLowerCase().startsWith('es'));
			if (found) return found;
			return googleVoices[0];
		}

		// Comportamiento por defecto: preferir español si existe, luego inglés
		let found = googleVoices.find(v => v.lang.startsWith('es'));
		if (!found) found = googleVoices.find(v => v.lang.startsWith('en'));
		if (!found) found = googleVoices[0];
		return found;
	}

	getSelectedVoice(): SpeechSynthesisVoice | null {
		return this.selectedVoice;
	}

	isSupported(): boolean {
		return this.synthesis !== null;
	}

	isSpeaking(): boolean {
		return this.synthesis?.speaking || false;
	}

	isPausedState(): boolean {
		return this.isPaused;
	}

	getChildFriendlyDefaults(): TTSOptions {
		return { ...this.CHILD_FRIENDLY_DEFAULTS };
	}

	/**
	 * Método para probar diferentes voces fácilmente
	 */
	testVoice(voiceName: string, text: string = "Hola, soy una voz de prueba. ¿Te gusta cómo sueno?"): void {
		const voices = this.getVoices();
		const voice = voices.find(v => v.name.toLowerCase().includes(voiceName.toLowerCase()));
		
		if (voice) {
			console.log('🧪 Probando voz:', voice.name);
			this.speak(text, { voice });
		} else {
			console.error('❌ Voz no encontrada:', voiceName);
			console.log('Voces disponibles:', voices.map(v => v.name).join(', '));
		}
	}

	/**
	 * Muestra todas las voces disponibles en la consola
	 */
	listAllVoices(): void {
		const voices = this.getVoices();
		console.log('📋 Total de voces disponibles:', voices.length);
		console.log('\n🇪🇸 Voces en español:');
		
		const spanish = voices.filter(v => v.lang.startsWith('es'));
		spanish.forEach((v, i) => {
			console.log(`${i + 1}. ${v.name} (${v.lang}) ${v.localService ? '📱 Local' : '☁️ Online'} ${v.default ? '⭐ Default' : ''}`);
		});
	}
}

// Singleton
export const ttsService = new TTSService();

/**
 * Hook de utilidad para cargar voces cuando estén disponibles
 */
export function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
	return new Promise((resolve) => {
		const voices = ttsService.getVoices();
		
		if (voices.length > 0) {
			if (!ttsService.getSelectedVoice()) {
				if (ttsService.isForceGoogle && ttsService.isForceGoogle()) {
					const g = ttsService.selectGoogleVoice();
					if (g) ttsService.setVoiceByName(g.name);
					else {
						const best = ttsService.selectBestAvailableVoice();
						if (best) ttsService.setVoiceByName(best.name);
					}
				} else {
					const best = ttsService.selectBestAvailableVoice();
					if (best) ttsService.setVoiceByName(best.name);
				}
			}
			resolve(voices);
		} else {
			if (typeof window !== 'undefined' && window.speechSynthesis) {
				window.speechSynthesis.addEventListener('voiceschanged', () => {
					if (!ttsService.getSelectedVoice()) {
						if (ttsService.isForceGoogle && ttsService.isForceGoogle()) {
							const g = ttsService.selectGoogleVoice();
							if (g) ttsService.setVoiceByName(g.name);
							else {
								const best = ttsService.selectBestAvailableVoice();
								if (best) ttsService.setVoiceByName(best.name);
							}
						} else {
							const best = ttsService.selectBestAvailableVoice();
							if (best) ttsService.setVoiceByName(best.name);
						}
					}
					resolve(ttsService.getVoices());
				}, { once: true });
			} else {
				resolve([]);
			}
		}
	});
}