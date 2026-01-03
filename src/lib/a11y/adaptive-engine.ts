/**
 * Motor Adaptativo Inteligente de Accesibilidad
 * Detecta patrones de comportamiento del usuario y ajusta automáticamente
 * las configuraciones de accesibilidad para usuarios con baja visión.
 * 
 * @module a11y/adaptive-engine
 */

import { configuraciones } from '$lib/stores/settings';
import { ttsService } from '$lib/audio/tts.service';
import { getDB } from '$lib/db/database';
import { get } from 'svelte/store';

// ============================================================================
// TIPOS Y CONSTANTES
// ============================================================================

interface HoverEvent {
	element: Element;
	timestamp: number;
	hasText: boolean;
}

interface ClickEvent {
	x: number;
	y: number;
	timestamp: number;
	isInteractive: boolean;
}

interface AdaptationMemory {
	rechazadoModoNoche?: number; // timestamp
	rechazadoModoInverso?: number;
	rechazadoLupa?: number;
	rechazadoNarrador?: number;
	rechazadoEscalado?: number;
	aplicadoEscalado?: boolean;
	aplicadoLupa?: boolean;
	aplicadoModoNoche?: boolean;
	aplicadoModoInverso?: boolean;
	aplicadoNarrador?: boolean;
}

interface ConfiguracionPrevia {
	multiplicadorTamanioFuente: number;
	multiplicadorEspaciado: number;
	lupaActivada: boolean;
	nivelMagnificacion: number;
	modoNoche: boolean;
	modoInverso: boolean;
	narrationEnabled: boolean;
}

// Umbrales de detección
const THRESHOLDS = {
	HOVER_DURATION: 1500, // ms para detectar hover prolongado
	HOVER_COUNT_FOR_SCALING: 3, // hovers consecutivos antes de escalar
	HOVER_COUNT_FOR_MAGNIFIER: 5, // hovers después de escalar para activar lupa
	FAILED_CLICK_RADIUS: 50, // px para considerar clics cercanos
	FAILED_CLICK_COUNT: 4, // clics fallidos antes de cambiar contraste
	FAILED_CLICK_WINDOW: 5000, // ms ventana temporal para clics fallidos
	INACTIVITY_TIMEOUT: 10000, // ms de inactividad antes de activar narrador
	NIGHT_MODE_REJECTION_WINDOW: 60000, // ms para detectar rechazo rápido
	COOLDOWN_PERIOD: 300000, // 5 minutos antes de reintentar adaptación rechazada
	ZOOM_DETECT_THRESHOLD: 1.1 // Detectar zoom del navegador > 110%
} as const;

// ============================================================================
// CLASE MOTOR ADAPTATIVO
// ============================================================================

export class AdaptiveEngine {
	private static instance: AdaptiveEngine | null = null;
	
	// Estado de detección
	private hoverHistory: HoverEvent[] = [];
	private clickHistory: ClickEvent[] = [];
	private lastActivityTimestamp: number = Date.now();
	private inactivityTimer: number | null = null;
	private currentHoverElement: Element | null = null;
	private currentHoverTimer: number | null = null;
	
	// Memoria de adaptaciones (persistida en sessionStorage)
	private memory: AdaptationMemory = {};
	
	// Event listeners para cleanup
	private boundHandlers = {
		mouseMove: this.handleMouseMove.bind(this),
		mouseOver: this.handleMouseOver.bind(this),
		mouseOut: this.handleMouseOut.bind(this),
		click: this.handleClick.bind(this),
		keyDown: this.handleKeyDown.bind(this),
		touchStart: this.handleTouchStart.bind(this),
		resize: this.handleResize.bind(this),
		visibilityChange: this.handleVisibilityChange.bind(this)
	};
	
	private isActive = false;
	private artistaId: number | null = null;
	private configPrevia: ConfiguracionPrevia | null = null;
	private currentRoute: string = '';

	private constructor() {
		this.loadMemory();
		if (typeof window !== 'undefined') {
			this.currentRoute = window.location.pathname;
		}
	}

	/**
	 * Obtiene la instancia única del motor (Singleton)
	 */
	public static getInstance(): AdaptiveEngine {
		if (!AdaptiveEngine.instance) {
			AdaptiveEngine.instance = new AdaptiveEngine();
		}
		return AdaptiveEngine.instance;
	}

	/**
	 * Inicia el motor adaptativo
	 */
	public async start(artistaId?: number): Promise<void> {
		if (this.isActive) {
			console.warn('[AdaptiveEngine] Motor ya está activo');
			return;
		}

		this.artistaId = artistaId ?? await this.getArtistaActual();
		this.isActive = true;
		this.attachEventListeners();
		this.startInactivityMonitor();
		
		console.log('[AdaptiveEngine] Motor adaptativo iniciado');
	}

	/**
	 * Detiene el motor y limpia recursos
	 */
	public stop(): void {
		if (!this.isActive) return;

		this.isActive = false;
		this.detachEventListeners();
		this.stopInactivityMonitor();
		this.clearHoverTimer();
		
		console.log('[AdaptiveEngine] Motor adaptativo detenido');
	}

	/**
	 * Destruye la instancia (para testing o limpieza completa)
	 */
	public destroy(): void {
		this.stop();
		this.saveMemory();
		AdaptiveEngine.instance = null;
	}

	// ========================================================================
	// GESTIÓN DE EVENTOS
	// ========================================================================

	private attachEventListeners(): void {
		if (typeof window === 'undefined') return;

		window.addEventListener('mousemove', this.boundHandlers.mouseMove, { passive: true });
		window.addEventListener('mouseover', this.boundHandlers.mouseOver, { passive: true });
		window.addEventListener('mouseout', this.boundHandlers.mouseOut, { passive: true });
		window.addEventListener('click', this.boundHandlers.click, true); // capture phase
		window.addEventListener('keydown', this.boundHandlers.keyDown, { passive: true });
		window.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: true });
		window.addEventListener('resize', this.boundHandlers.resize, { passive: true });
		document.addEventListener('visibilitychange', this.boundHandlers.visibilityChange);
	}

	private detachEventListeners(): void {
		if (typeof window === 'undefined') return;

		window.removeEventListener('mousemove', this.boundHandlers.mouseMove);
		window.removeEventListener('mouseover', this.boundHandlers.mouseOver);
		window.removeEventListener('mouseout', this.boundHandlers.mouseOut);
		window.removeEventListener('click', this.boundHandlers.click, true);
		window.removeEventListener('keydown', this.boundHandlers.keyDown);
		window.removeEventListener('touchstart', this.boundHandlers.touchStart);
		window.removeEventListener('resize', this.boundHandlers.resize);
		document.removeEventListener('visibilitychange', this.boundHandlers.visibilityChange);
	}

	private handleMouseMove(e: MouseEvent): void {
		this.checkRouteChange();
		this.resetInactivityTimer();
	}

	private handleMouseOver(e: MouseEvent): void {
		const target = e.target as Element;
		
		// Verificar si el elemento tiene texto o es interactivo
		const hasText = this.elementHasText(target);
		if (!hasText) {
			// Limpiar timer si pasamos de un elemento válido a uno inválido
			this.clearHoverTimer();
			this.currentHoverElement = null;
			return;
		}

		// Evitar reiniciar el timer si ya estamos sobre el mismo elemento válido
		if (this.currentHoverElement === target) return;

		this.currentHoverElement = target;
		this.clearHoverTimer();
		
		// Iniciar temporizador para detectar hover prolongado
		this.currentHoverTimer = window.setTimeout(() => {
			this.onProlongedHover(target);
		}, THRESHOLDS.HOVER_DURATION);
	}

	private handleMouseOut(e: MouseEvent): void {
		this.clearHoverTimer();
		this.currentHoverElement = null;
	}

	private handleClick(e: MouseEvent): void {
		this.resetInactivityTimer();
		
		const target = e.target as Element;
		const isInteractive = this.isInteractiveElement(target);
		
		this.clickHistory.push({
			x: e.clientX,
			y: e.clientY,
			timestamp: Date.now(),
			isInteractive
		});

		// Limpiar historial antiguo
		this.cleanOldClicks();

		// Detectar patrón de clics fallidos
		if (!isInteractive) {
			this.checkFailedClickPattern();
		}
	}

	private handleKeyDown(e: KeyboardEvent): void {
		this.resetInactivityTimer();
	}

	private handleTouchStart(e: TouchEvent): void {
		this.resetInactivityTimer();
	}

	private handleResize(e: Event): void {
		// Detectar zoom del navegador
		this.checkBrowserZoom();
	}

	private handleVisibilityChange(): void {
		if (document.hidden) {
			// Pausar detección cuando la pestaña no está visible
			this.stopInactivityMonitor();
		} else {
			// Reanudar detección
			this.startInactivityMonitor();
		}
	}

	// ========================================================================
	// REGLA 1: AGUDEZA VISUAL (ESCALADO PROGRESIVO)
	// ========================================================================

	private onProlongedHover(element: Element): void {
		const now = Date.now();
		
		this.hoverHistory.push({
			element,
			timestamp: now,
			hasText: true
		});

		// Mantener solo los últimos 10 hovers
		if (this.hoverHistory.length > 10) {
			this.hoverHistory.shift();
		}

		// Contar hovers recientes (últimos 30 segundos)
		const recentHovers = this.hoverHistory.filter(
			h => now - h.timestamp < 30000
		);

		const config = get(configuraciones);

		// Estado de control para debugging
		const estadoEscalado = {
			hoversRecientes: recentHovers.length,
			aplicado: this.memory.aplicadoEscalado,
			rechazado: this.isAdaptationRejected('rechazadoEscalado'),
			multiplicador: config.multiplicadorTamanioFuente
		};

		const estadoLupa = {
			hoversRecientes: recentHovers.length,
			escaladoAplicado: this.memory.aplicadoEscalado,
			lupaAplicada: this.memory.aplicadoLupa,
			lupaActiva: config.lupaActivada,
			rechazado: this.isAdaptationRejected('rechazadoLupa')
		};

		// Nivel 1: Escalado de fuente y espaciado
		// Verificar que NO esté aplicado, NO esté rechazado, y la config esté en valor por defecto
		if (recentHovers.length >= THRESHOLDS.HOVER_COUNT_FOR_SCALING && 
		    !this.memory.aplicadoEscalado &&
		    !this.isAdaptationRejected('rechazadoEscalado') &&
		    config.multiplicadorTamanioFuente === 1 &&
		    config.multiplicadorEspaciado === 1) {
			
			console.log('[AdaptiveEngine] ✅ Regla 1: Se cumplen TODAS las condiciones para ESCALADO', estadoEscalado);
			this.applyScaling();
		}
		
		// Nivel 2: Activar lupa mágica
		// Requiere que el escalado YA esté aplicado Y confirmado por el usuario
		else if (recentHovers.length >= THRESHOLDS.HOVER_COUNT_FOR_MAGNIFIER &&
		         this.memory.aplicadoEscalado === true &&
		         !this.memory.aplicadoLupa &&
		         !config.lupaActivada &&
		         !this.isAdaptationRejected('rechazadoLupa')) {
			
			console.log('[AdaptiveEngine] ✅ Regla 1: Se cumplen TODAS las condiciones para LUPA', estadoLupa);
			this.applyMagnifier();
		}
	}

	private applyScaling(): void {
		// Guardar configuración previa
		const config = get(configuraciones);
		this.configPrevia = {
			multiplicadorTamanioFuente: config.multiplicadorTamanioFuente,
			multiplicadorEspaciado: config.multiplicadorEspaciado,
			lupaActivada: config.lupaActivada,
			nivelMagnificacion: config.nivelMagnificacion,
			modoNoche: config.modoNoche ?? false,
			modoInverso: config.modoInverso ?? false,
			narrationEnabled: config.narrationEnabled
		};

		configuraciones.setFontSize(1.5);
		configuraciones.setSpacing(1.2);
		
		console.log('[AdaptiveEngine] 🔍 Escalado aplicado (Nivel 1). Esperando confirmación del usuario...');
		
		// Solicitar confirmación del usuario
		this.showConfirmation(
			'escalado',
			'He aumentado el tamaño del texto para facilitar la lectura. ¿Deseas mantener este cambio?',
			() => {
				// Aceptar
				this.memory.aplicadoEscalado = true;
				// Asegurarse de limpiar cualquier rechazo previo
				delete this.memory.rechazadoEscalado;
				this.saveMemory();
				ttsService.speak('Escalado confirmado');
				console.log('[AdaptiveEngine] ✅ ESCALADO CONFIRMADO por el usuario. Estado guardado en memoria.');
			},
			() => {
				// Rechazar
				if (this.configPrevia) {
					configuraciones.setFontSize(this.configPrevia.multiplicadorTamanioFuente);
					configuraciones.setSpacing(this.configPrevia.multiplicadorEspaciado);
				}
				// Marcar como rechazado con timestamp
				this.memory.rechazadoEscalado = Date.now();
				this.memory.aplicadoEscalado = false;
				this.saveMemory();
				ttsService.speak('Escalado revertido');
				console.log('[AdaptiveEngine] ❌ ESCALADO RECHAZADO por el usuario. Cooldown de', THRESHOLDS.COOLDOWN_PERIOD / 1000, 'segundos activado.');
			}
		);
	}

	private applyMagnifier(): void {
		// Guardar configuración previa
		const config = get(configuraciones);
		this.configPrevia = {
			multiplicadorTamanioFuente: config.multiplicadorTamanioFuente,
			multiplicadorEspaciado: config.multiplicadorEspaciado,
			lupaActivada: config.lupaActivada,
			nivelMagnificacion: config.nivelMagnificacion,
			modoNoche: config.modoNoche ?? false,
			modoInverso: config.modoInverso ?? false,
			narrationEnabled: config.narrationEnabled
		};

		configuraciones.setMagnifierEnabled(true);
		configuraciones.setMagnifierZoom(2);
		
		console.log('[AdaptiveEngine] 🔍 Lupa activada (Nivel 2). Esperando confirmación del usuario...');
		
		// Solicitar confirmación del usuario
		this.showConfirmation(
			'lupa',
			'He activado la lupa mágica para ayudarte. ¿Deseas mantener este cambio?',
			() => {
				// Aceptar
				this.memory.aplicadoLupa = true;
				// Asegurarse de limpiar cualquier rechazo previo
				delete this.memory.rechazadoLupa;
				this.saveMemory();
				ttsService.speak('Lupa confirmada');
				console.log('[AdaptiveEngine] ✅ LUPA CONFIRMADA por el usuario. Estado guardado en memoria.');
			},
			() => {
				// Rechazar
				if (this.configPrevia) {
					configuraciones.setMagnifierEnabled(this.configPrevia.lupaActivada);
					configuraciones.setMagnifierZoom(this.configPrevia.nivelMagnificacion);
				}
				// Marcar como rechazado con timestamp
				this.memory.rechazadoLupa = Date.now();
				this.memory.aplicadoLupa = false;
				this.saveMemory();
				ttsService.speak('Lupa desactivada');
				console.log('[AdaptiveEngine] ❌ LUPA RECHAZADA por el usuario. Cooldown de', THRESHOLDS.COOLDOWN_PERIOD / 1000, 'segundos activado.');
			}
		);
	}

	/**
	 * Detecta zoom manual del navegador y lo revierte aplicando escalado interno
	 */
	private checkBrowserZoom(): void {
		if (typeof window === 'undefined') return;
		
		const zoom = window.devicePixelRatio || 1;
		
		if (zoom >= THRESHOLDS.ZOOM_DETECT_THRESHOLD) {
			// Revertir zoom del navegador (no directamente posible, pero podemos notificar)
			// En su lugar, aplicamos escalado interno
			const config = get(configuraciones);
			
			if (config.multiplicadorTamanioFuente === 1 && !this.memory.aplicadoEscalado) {
				this.applyScaling();
				
				if (!this.memory.aplicadoLupa && !config.lupaActivada) {
					// Aplicar lupa también si el zoom es significativo
					setTimeout(() => {
						this.applyMagnifier();
					}, 1000);
				}
			}
		}
	}

	// ========================================================================
	// REGLA 2: CONTRASTE Y FOTOFOBIA
	// ========================================================================

	private checkFailedClickPattern(): void {
		const recentClicks = this.getRecentFailedClicks();
		
		if (recentClicks.length < THRESHOLDS.FAILED_CLICK_COUNT) return;

		// Verificar si están en un radio pequeño
		const clustered = this.areClicksClustered(recentClicks, THRESHOLDS.FAILED_CLICK_RADIUS);
		
		if (clustered) {
			this.applyNightMode();
		}
	}

	private getRecentFailedClicks(): ClickEvent[] {
		const now = Date.now();
		return this.clickHistory.filter(
			click => !click.isInteractive && 
			         now - click.timestamp < THRESHOLDS.FAILED_CLICK_WINDOW
		);
	}

	private areClicksClustered(clicks: ClickEvent[], radius: number): boolean {
		if (clicks.length < 2) return false;

		// Calcular centroide
		const centerX = clicks.reduce((sum, c) => sum + c.x, 0) / clicks.length;
		const centerY = clicks.reduce((sum, c) => sum + c.y, 0) / clicks.length;

		// Verificar si todos están dentro del radio
		return clicks.every(click => {
			const distance = Math.sqrt(
				Math.pow(click.x - centerX, 2) + 
				Math.pow(click.y - centerY, 2)
			);
			return distance <= radius;
		});
	}

	private applyNightMode(): void {
		const config = get(configuraciones);
		
		if (config.modoNoche || this.memory.aplicadoModoNoche) return;
		if (this.isAdaptationRejected('rechazadoModoNoche')) return;

		// Guardar configuración previa
		this.configPrevia = {
			multiplicadorTamanioFuente: config.multiplicadorTamanioFuente,
			multiplicadorEspaciado: config.multiplicadorEspaciado,
			lupaActivada: config.lupaActivada,
			nivelMagnificacion: config.nivelMagnificacion,
			modoNoche: config.modoNoche ?? false,
			modoInverso: config.modoInverso ?? false,
			narrationEnabled: config.narrationEnabled
		};

		configuraciones.setModoNoche(true);
		
		console.log('[AdaptiveEngine] Modo noche aplicado');
		
		const timestamp = Date.now();

		// Solicitar confirmación del usuario
		this.showConfirmation(
			'modo-noche',
			'He activado el modo de alto contraste para mejorar la visibilidad. ¿Deseas mantener este cambio?',
			() => {
				// Aceptar
				this.memory.aplicadoModoNoche = true;
				this.saveMemory();
				ttsService.speak('Modo noche confirmado');
				console.log('[AdaptiveEngine] Modo noche confirmado por el usuario');
				// Monitorear si el usuario lo desactiva rápidamente (fotofobia)
				this.monitorNightModeRejection(timestamp);
			},
			() => {
				// Rechazar
				if (this.configPrevia) {
					configuraciones.setModoNoche(this.configPrevia.modoNoche);
				}
				this.memory.rechazadoModoNoche = Date.now();
				this.memory.aplicadoModoNoche = false;
				this.saveMemory();
				ttsService.speak('Modo noche desactivado');
				console.log('[AdaptiveEngine] Modo noche rechazado por el usuario');
			}
		);
	}

	private monitorNightModeRejection(activationTimestamp: number): void {
		// Suscribirse temporalmente al store
		const unsubscribe = configuraciones.subscribe(config => {
			if (!config.modoNoche) {
				const rejectionTime = Date.now() - activationTimestamp;
				
				if (rejectionTime < THRESHOLDS.NIGHT_MODE_REJECTION_WINDOW) {
					// Usuario rechazó modo noche rápidamente → Fotofobia detectada
					this.applyInverseMode();
					this.memory.rechazadoModoNoche = Date.now();
					this.saveMemory();
				}
				
				unsubscribe();
			}
		});

		// Auto-cancelar suscripción después de la ventana de detección
		setTimeout(() => {
			unsubscribe();
		}, THRESHOLDS.NIGHT_MODE_REJECTION_WINDOW + 1000);
	}

	private applyInverseMode(): void {
		const config = get(configuraciones);
		
		if (config.modoInverso || this.memory.aplicadoModoInverso) return;
		if (this.isAdaptationRejected('rechazadoModoInverso')) return;

		// Guardar configuración previa
		this.configPrevia = {
			multiplicadorTamanioFuente: config.multiplicadorTamanioFuente,
			multiplicadorEspaciado: config.multiplicadorEspaciado,
			lupaActivada: config.lupaActivada,
			nivelMagnificacion: config.nivelMagnificacion,
			modoNoche: config.modoNoche ?? false,
			modoInverso: config.modoInverso ?? false,
			narrationEnabled: config.narrationEnabled
		};

		configuraciones.setModoInverso(true);
		
		console.log('[AdaptiveEngine] Modo inverso aplicado (fotofobia detectada)');
		
		// Solicitar confirmación del usuario
		this.showConfirmation(
			'modo-inverso',
			'He ajustado el contraste inverso para mayor comodidad visual. ¿Deseas mantener este cambio?',
			() => {
				// Aceptar
				this.memory.aplicadoModoInverso = true;
				this.saveMemory();
				ttsService.speak('Modo inverso confirmado');
				console.log('[AdaptiveEngine] Modo inverso confirmado por el usuario');
			},
			() => {
				// Rechazar
				if (this.configPrevia) {
					configuraciones.setModoInverso(this.configPrevia.modoInverso);
				}
				this.memory.rechazadoModoInverso = Date.now();
				this.memory.aplicadoModoInverso = false;
				this.saveMemory();
				ttsService.speak('Modo inverso desactivado');
				console.log('[AdaptiveEngine] Modo inverso rechazado por el usuario');
			}
		);
	}

	// ========================================================================
	// REGLA 3: ASISTENCIA COGNITIVA (NARRADOR)
	// ========================================================================

	private startInactivityMonitor(): void {
		this.resetInactivityTimer();
	}

	private stopInactivityMonitor(): void {
		if (this.inactivityTimer !== null) {
			window.clearTimeout(this.inactivityTimer);
			this.inactivityTimer = null;
		}
	}

	private resetInactivityTimer(): void {
		this.lastActivityTimestamp = Date.now();
		
		if (this.inactivityTimer !== null) {
			window.clearTimeout(this.inactivityTimer);
		}

		this.inactivityTimer = window.setTimeout(() => {
			this.onInactivityDetected();
		}, THRESHOLDS.INACTIVITY_TIMEOUT);
	}

	private onInactivityDetected(): void {
		const config = get(configuraciones);
		
		if (config.narrationEnabled || this.memory.aplicadoNarrador) return;
		if (this.isAdaptationRejected('rechazadoNarrador')) return;
		
		const now = Date.now();
		const tiempoInactivo = now - this.lastActivityTimestamp;
		console.log(`[AdaptiveEngine] Tiempo de inactividad detectado: ${tiempoInactivo} ms (umbral: ${THRESHOLDS.INACTIVITY_TIMEOUT} ms)`);
		
		// Guardar configuración previa
		this.configPrevia = {
			multiplicadorTamanioFuente: config.multiplicadorTamanioFuente,
			multiplicadorEspaciado: config.multiplicadorEspaciado,
			lupaActivada: config.lupaActivada,
			nivelMagnificacion: config.nivelMagnificacion,
			modoNoche: config.modoNoche ?? false,
			modoInverso: config.modoInverso ?? false,
			narrationEnabled: config.narrationEnabled
		};

		
		console.log('[AdaptiveEngine] Narrador activado por inactividad');
		
		// Solicitar confirmación del usuario
		this.showConfirmation(
			'narrador',
			'He activado la narración de textos para ayudarte a navegar. ¿Deseas mantener este cambio?',
			() => {
				// Aceptar
				this.memory.aplicadoNarrador = true;
				this.saveMemory();
				ttsService.speak('Narración confirmada');
				setTimeout(() => {
					configuraciones.setNarrationEnabled(true);
				}, 3000);
				console.log('[AdaptiveEngine] Narrador confirmado por el usuario');
			},
			() => {
				// Rechazar
				if (this.configPrevia) {
					configuraciones.setNarrationEnabled(this.configPrevia.narrationEnabled);
				}
				this.memory.rechazadoNarrador = Date.now();
				this.memory.aplicadoNarrador = false;
				this.saveMemory();
				ttsService.speak('Narración desactivada');
				console.log('[AdaptiveEngine] Narrador rechazado por el usuario');
			}
		);
	}

	// ========================================================================
	// DETECCIÓN DE CAMBIOS DE RUTA
	// ========================================================================

	/**
	 * Detecta automáticamente cambios de ruta y resetea el estado de detección
	 */
	private checkRouteChange(): void {
		if (typeof window === 'undefined') return;
		
		const newRoute = window.location.pathname;
		if (newRoute !== this.currentRoute) {
			console.log(`[AdaptiveEngine] 🔄 Cambio de ruta detectado: ${this.currentRoute} → ${newRoute}`);
			this.currentRoute = newRoute;
			this.resetDetectionState();
		}
	}

	/**
	 * Método público para llamar manualmente cuando cambia la ruta
	 * (útil para integraciones con routers de SvelteKit)
	 */
	public onRouteChange(newRoute?: string): void {
		if (typeof window === 'undefined') return;
		
		const route = newRoute || window.location.pathname;
		if (route !== this.currentRoute) {
			console.log(`[AdaptiveEngine] 🔄 Cambio de ruta manual: ${this.currentRoute} → ${route}`);
			this.currentRoute = route;
			this.resetDetectionState();
		}
	}

	/**
	 * Resetea SOLO el estado de detección (contadores, historiales, timers)
	 * pero MANTIENE la memoria de preferencias del usuario (aplicadoEscalado, rechazos, etc.)
	 */
	private resetDetectionState(): void {
		console.log('[AdaptiveEngine] 🔄 Reseteando estado de detección para nueva página');
		
		// Limpiar historiales de eventos
		this.hoverHistory = [];
		this.clickHistory = [];
		
		// Resetear timestamp de actividad
		this.lastActivityTimestamp = Date.now();
		
		// Limpiar timers de hover
		this.clearHoverTimer();
		this.currentHoverElement = null;
		
		// Reiniciar monitor de inactividad
		this.stopInactivityMonitor();
		if (this.isActive) {
			this.startInactivityMonitor();
		}
		
		console.log('[AdaptiveEngine] ✅ Estado de detección reseteado. Memoria de preferencias mantenida.');
	}

	// ========================================================================
	// UTILIDADES
	// ========================================================================

	private elementHasText(element: Element): boolean {
		const tagName = element.tagName.toUpperCase();
		
		// EXCLUIR elementos que NO deben activar magnificación
		// Canvas, SVG, imágenes, videos, contenedores de dibujo
		const excludedTags = ['CANVAS', 'SVG', 'VIDEO', 'IMG', 'PICTURE', 'IFRAME'];
		if (excludedTags.includes(tagName)) {
			console.log(`[AdaptiveEngine] ⏭️ Elemento ${tagName} excluido de detección de hover`);
			return false;
		}
		
		// EXCLUIR por clases específicas (contenedores de canvas/dibujo)
		const excludedClasses = ['contenedor-lienzo', 'drawing-area', 'sketch-container', 'image-container'];
		const classList = Array.from(element.classList || []);
		if (excludedClasses.some(cls => classList.includes(cls))) {
			console.log(`[AdaptiveEngine] ⏭️ Contenedor de dibujo excluido de detección`);
			return false;
		}
		
		// INCLUIR elementos interactivos (botones, enlaces)
		const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'];
		if (interactiveTags.includes(tagName)) {
			// Verificar que tenga texto o aria-label
			if (element.getAttribute('aria-label')) return true;
			const textContent = element.textContent?.trim();
			if (textContent && textContent.length > 0) return true;
		}
		
		// INCLUIR elementos con roles interactivos
		const role = element.getAttribute('role');
		if (role && ['button', 'link', 'menuitem', 'tab', 'option'].includes(role)) {
			if (element.getAttribute('aria-label')) return true;
			const textContent = element.textContent?.trim();
			if (textContent && textContent.length > 0) return true;
		}
		
		// INCLUIR elementos con texto directo (no heredado de hijos profundos)
		// Solo párrafos, encabezados, spans, listas
		const textualTags = ['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH', 'STRONG', 'EM', 'MARK'];
		if (textualTags.includes(tagName)) {
			// Verificar texto directo (no de nietos)
			for (const child of element.childNodes) {
				if (child.nodeType === Node.TEXT_NODE) {
					const text = child.textContent?.trim();
					if (text && text.length > 5) { // Mínimo 5 caracteres
						return true;
					}
				}
			}
		}
		
		// Por defecto, rechazar (contenedores genéricos como DIV sin texto directo)
		return false;
	}

	private isInteractiveElement(element: Element): boolean {
		const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
		const tagName = element.tagName.toUpperCase();
		
		if (interactiveTags.includes(tagName)) return true;
		
		// Verificar roles ARIA
		const role = element.getAttribute('role');
		if (role && ['button', 'link', 'menuitem', 'tab'].includes(role)) {
			return true;
		}
		
		// Verificar si tiene event listeners (aproximación)
		if (element.getAttribute('onclick')) return true;
		
		// Verificar si es clickeable por CSS
		const cursor = window.getComputedStyle(element).cursor;
		if (cursor === 'pointer') return true;
		
		return false;
	}

	private cleanOldClicks(): void {
		const now = Date.now();
		this.clickHistory = this.clickHistory.filter(
			click => now - click.timestamp < THRESHOLDS.FAILED_CLICK_WINDOW * 2
		);
	}

	private clearHoverTimer(): void {
		if (this.currentHoverTimer !== null) {
			window.clearTimeout(this.currentHoverTimer);
			this.currentHoverTimer = null;
		}
	}

	private isAdaptationRejected(key: keyof AdaptationMemory): boolean {
		const timestamp = this.memory[key];
		if (!timestamp || typeof timestamp !== 'number') return false;
		
		const elapsed = Date.now() - timestamp;
		const isInCooldown = elapsed < THRESHOLDS.COOLDOWN_PERIOD;
		
		// Log para debugging
		if (isInCooldown) {
			const remaining = Math.round((THRESHOLDS.COOLDOWN_PERIOD - elapsed) / 1000);
			console.log(`[AdaptiveEngine] 🚫 ${key} aún en cooldown. Tiempo restante: ${remaining}s de ${THRESHOLDS.COOLDOWN_PERIOD / 1000}s`);
		}
		
		return isInCooldown;
	}

	private async getArtistaActual(): Promise<number | null> {
		try {
			const db = getDB();
			if (!db) return null;
			
			const sesion = await db.sesion.get('actual');
			return sesion?.artistaActualId ?? null;
		} catch (e) {
			console.error('[AdaptiveEngine] Error obteniendo artista actual:', e);
			return null;
		}
	}

	// ========================================================================
	// PERSISTENCIA DE MEMORIA
	// ========================================================================

	private loadMemory(): void {
		if (typeof sessionStorage === 'undefined') return;
		
		try {
			const stored = sessionStorage.getItem('adaptive_engine_memory');
			if (stored) {
				this.memory = JSON.parse(stored);
			}
		} catch (e) {
			console.error('[AdaptiveEngine] Error cargando memoria:', e);
		}
	}

	private saveMemory(): void {
		if (typeof sessionStorage === 'undefined') return;
		
		try {
			sessionStorage.setItem('adaptive_engine_memory', JSON.stringify(this.memory));
		} catch (e) {
			console.error('[AdaptiveEngine] Error guardando memoria:', e);
		}
	}

	/**
	 * Resetea la memoria de adaptaciones (útil para testing o nuevo artista)
	 */
	public resetMemory(): void {
		this.memory = {};
		this.saveMemory();
		this.resetDetectionState();
		console.log('[AdaptiveEngine] Memoria y estado de detección reseteados');
	}

	// ========================================================================
	// SISTEMA DE CONFIRMACIÓN
	// ========================================================================

	/**
	 * Muestra un mensaje de confirmación al usuario para aceptar o rechazar una adaptación
	 * @param tipo - Tipo de adaptación (escalado, lupa, modo-noche, modo-inverso, narrador)
	 * @param mensaje - Mensaje a mostrar/narrar al usuario
	 * @param onAceptar - Callback cuando el usuario acepta
	 * @param onRechazar - Callback cuando el usuario rechaza
	 */
	private showConfirmation(
		tipo: string,
		mensaje: string,
		onAceptar: () => void,
		onRechazar: () => void
	): void {
		// Narrar el mensaje
		ttsService.speak(mensaje);

		// Crear modal de confirmación
		const modal = document.createElement('div');
		modal.id = `adaptive-engine-confirmation-${tipo}`;
		modal.setAttribute('role', 'dialog');
		modal.setAttribute('aria-labelledby', `adaptive-title-${tipo}`);
		modal.setAttribute('aria-describedby', `adaptive-desc-${tipo}`);
		modal.style.cssText = `
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			background: white;
			padding: 2rem;
			border-radius: 12px;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
			z-index: 10000;
			max-width: 500px;
			width: 90%;
			border: 3px solid #4A90E2;
		`;

		modal.innerHTML = `
			<h2 id="adaptive-title-${tipo}" style="margin: 0 0 1rem 0; color: #333; font-size: 1.5rem;">
				💡 Adaptación Automática
			</h2>
			<p id="adaptive-desc-${tipo}" style="margin: 0 0 2rem 0; color: #666; font-size: 1.2rem; line-height: 1.5;">
				${mensaje}
			</p>
			<div style="display: flex; gap: 1rem; justify-content: flex-end;">
				<button 
					id="adaptive-reject-${tipo}"
					style="
						padding: 0.75rem 1.5rem;
						font-size: 1.1rem;
						background: #E74C3C;
						color: white;
						border: none;
						border-radius: 8px;
						cursor: pointer;
						font-weight: bold;
					"
					aria-label="Rechazar cambio"
				>
					❌ No, gracias
				</button>
				<button 
					id="adaptive-accept-${tipo}"
					style="
						padding: 0.75rem 1.5rem;
						font-size: 1.1rem;
						background: #27AE60;
						color: white;
						border: none;
						border-radius: 8px;
						cursor: pointer;
						font-weight: bold;
					"
					aria-label="Aceptar cambio"
				>
					✅ Sí, mantener
				</button>
			</div>
		`;

		// Crear overlay oscuro
		const overlay = document.createElement('div');
		overlay.id = `adaptive-overlay-${tipo}`;
		overlay.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.5);
			z-index: 9999;
		`;

		// Agregar al DOM
		document.body.appendChild(overlay);
		document.body.appendChild(modal);

		// Función para limpiar el modal
		const cleanup = () => {
			modal.remove();
			overlay.remove();
		};

		// Retrasar el focus para permitir que el mensaje se narré completamente
		// Esto evita que el narrador automático interrumpa leyendo el texto del botón
		setTimeout(() => {
			const acceptButton = document.getElementById(`adaptive-accept-${tipo}`);
			if (acceptButton) {
				// Solo hacer focus si el narrador NO está activado
				// Si el narrador está activado, evitamos el focus para no interrumpir
				const config = get(configuraciones);
				if (!config.narrationEnabled) {
					acceptButton.focus();
				}
			}
		}, 2500); // Dar 2.5 segundos para que el mensaje se narré

		// Manejar aceptación
		document.getElementById(`adaptive-accept-${tipo}`)?.addEventListener('click', () => {
			cleanup();
			onAceptar();
		});

		// Manejar rechazo
		document.getElementById(`adaptive-reject-${tipo}`)?.addEventListener('click', () => {
			cleanup();
			onRechazar();
		});

		// Auto-aceptar después de 15 segundos si no hay respuesta
		setTimeout(() => {
			if (document.getElementById(`adaptive-engine-confirmation-${tipo}`)) {
				cleanup();
				console.log('[AdaptiveEngine] Confirmación auto-aceptada por timeout');
				onAceptar();
			}
		}, 15000);
	}
}

// ============================================================================
// ACTION DE SVELTE (USO SIMPLIFICADO)
// ============================================================================

/**
 * Svelte Action para activar el motor adaptativo en un componente
 * 
 * @example
 * ```svelte
 * <div use:adaptiveObserver>
 *   <!-- contenido -->
 * </div>
 * ```
 */
export function adaptiveObserver(node: HTMLElement, artistaId?: number) {
	const engine = AdaptiveEngine.getInstance();
	engine.start(artistaId);

	return {
		destroy() {
			engine.stop();
		}
	};
}

// Exportar instancia singleton para uso directo
export const adaptiveEngine = AdaptiveEngine.getInstance();
