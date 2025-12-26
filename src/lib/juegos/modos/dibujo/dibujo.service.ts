/**
 * ServicioDibujo
 * Servicio orquestador del modo de dibujo accesible.
 * Gestiona el estado global y facilita la comunicación entre el lienzo,
 * la barra de herramientas y el overlay de accesibilidad.
 */

import type { Sticker } from './stickers.data';

// Tipos e interfaces
export interface HerramientaDibujo {
	id: 'pincel' | 'borrador' | 'stickers';
	nombre: string;
	icono: string;
	descripcion: string;
}

export interface EstadoDibujo {
	herramientaActual: HerramientaDibujo;
	colorActual: string;
	grosorActual: number;
	estaDibujando: boolean;
	modoAccesible: boolean;
	// Estado de stickers
	stickerActual: Sticker | null;
	escalaSticker: number;
}

// Herramientas disponibles
const HERRAMIENTAS_DISPONIBLES: HerramientaDibujo[] = [
	{
		id: 'pincel',
		nombre: 'Pincel',
		icono: '🖌️',
		descripcion: 'Herramienta para dibujar con color'
	},
	{
		id: 'borrador',
		nombre: 'Borrador',
		icono: '🧽',
		descripcion: 'Herramienta para borrar partes del dibujo'
	},
	{
		id: 'stickers',
		nombre: 'Stickers',
		icono: '🌟',
		descripcion: 'Añadir stickers decorativos al dibujo'
	}
];

// Colores predefinidos
export const COLORES_PREDEFINIDOS = [
	'#222121ff', // Negro
	'#f53c3cff', // Rojo
	'#45d145ff', // Verde
	'#0000FF', // Azul
	'#e7e74fff', // Amarillo
	'#fa64faff', // Magenta
	'#89ebebff', // Cian
	'#e2b35dff', // Naranja
	'#9c359cff', // Púrpura
	'#FFC0CB'  // Rosa
];

/**
 * Clase principal del servicio de dibujo
 */
class ServicioDibujo {
	private componenteCanvas: any = null;
	private componenteOverlay: any = null;
	private estado: EstadoDibujo;
	private bloqueado: boolean = false;

	constructor() {
		this.estado = {
			herramientaActual: HERRAMIENTAS_DISPONIBLES[0], // Pincel por defecto
			colorActual: '#000000',
			grosorActual: 5,
			estaDibujando: false,
			modoAccesible: false,
			stickerActual: null,
			escalaSticker: 1.0
		};
	}

	/**
	 * Inicializa el servicio con referencias a los componentes
	 */
	inicializar(componenteCanvas: any, componenteOverlay?: any) {
		this.componenteCanvas = componenteCanvas;
		this.componenteOverlay = componenteOverlay;
		
		// Establecer estilo inicial en el canvas
		this.aplicarEstiloActualAlCanvas();
		
		console.log('[ServicioDibujo] Servicio inicializado correctamente');
	}

	/**
	 * Cambia la herramienta activa
	 */
	cambiarHerramienta(idHerramienta: 'pincel' | 'borrador' | 'stickers') {
		const nuevaHerramienta = HERRAMIENTAS_DISPONIBLES.find(h => h.id === idHerramienta);
		
		if (!nuevaHerramienta) {
			console.error(`[ServicioDibujo] Herramienta no encontrada: ${idHerramienta}`);
			return;
		}

		// Limpiar sticker pendiente si se cambia a otra herramienta
		if (idHerramienta !== 'stickers' && this.componenteCanvas) {
			this.componenteCanvas.limpiarStickerPendiente?.();
			this.estado.stickerActual = null;
		}

		this.estado.herramientaActual = nuevaHerramienta;
		this.aplicarEstiloActualAlCanvas();
		
		console.log(`[ServicioDibujo] Herramienta cambiada a: ${nuevaHerramienta.nombre}`);
	}

	/**
	 * Cambia el color actual (solo para pincel)
	 */
	cambiarColor(color: string) {
		if (!COLORES_PREDEFINIDOS.includes(color)) {
			console.warn(`[ServicioDibujo] Color no predefinido: ${color}`);
		}

		this.estado.colorActual = color;
		
		// Solo aplicar si la herramienta actual es el pincel
		if (this.estado.herramientaActual.id === 'pincel') {
			this.aplicarEstiloActualAlCanvas();
		}
		
		console.log(`[ServicioDibujo] Color cambiado a: ${color}`);
	}

	/**
	 * Cambia el grosor/tamaño de la herramienta
	 */
	cambiarTamano(grosor: number) {
		// Validar límites según la herramienta
		let grosorValidado: number;
		
		if (this.estado.herramientaActual.id === 'pincel') {
			grosorValidado = Math.max(1, Math.min(50, grosor));
		} else if (this.estado.herramientaActual.id === 'borrador') {
			grosorValidado = Math.max(5, Math.min(100, grosor));
		} else {
			grosorValidado = grosor; // Para stickers u otras herramientas futuras
		}

		this.estado.grosorActual = grosorValidado;
		this.aplicarEstiloActualAlCanvas();
		
		console.log(`[ServicioDibujo] Grosor cambiado a: ${grosorValidado}px`);
	}

	/**
	 * Selecciona un sticker para colocar
	 */
	seleccionarSticker(sticker: Sticker) {
		this.estado.stickerActual = sticker;
		
		// Cambiar automáticamente a herramienta stickers si no está seleccionada
		if (this.estado.herramientaActual.id !== 'stickers') {
			this.cambiarHerramienta('stickers');
		}
		
		// Configurar el sticker pendiente en el canvas
		if (this.componenteCanvas) {
			this.componenteCanvas.establecerStickerPendiente(sticker.emoji, this.estado.escalaSticker);
		}
		
		console.log(`[ServicioDibujo] Sticker seleccionado: ${sticker.nombre}`);
	}

	/**
	 * Cambia la escala del sticker
	 */
	cambiarTamanoSticker(escala: number) {
		// Validar límites de escala (0.25 a 2.0)
		const escalaValidada = Math.max(0.25, Math.min(2.0, escala));
		this.estado.escalaSticker = escalaValidada;
		
		// Actualizar escala en el canvas si hay sticker pendiente
		if (this.componenteCanvas) {
			this.componenteCanvas.actualizarEscalaSticker(escalaValidada);
		}
		
		console.log(`[ServicioDibujo] Escala de sticker cambiada a: ${escalaValidada}`);
	}

	/**
	 * Coloca el sticker seleccionado en las coordenadas indicadas
	 */
	colocarSticker(x: number, y: number): boolean {
		if (!this.componenteCanvas || !this.estado.stickerActual) {
			console.error('[ServicioDibujo] No hay canvas o sticker seleccionado');
			return false;
		}

		// Llamar al método del canvas para colocar el sticker
		this.componenteCanvas.colocarSticker(
			this.estado.stickerActual.emoji,
			x,
			y,
			this.estado.escalaSticker
		);
		
		console.log(`[ServicioDibujo] Sticker colocado en (${x}, ${y})`);
		return true;
	}

	/**
	 * Obtiene el sticker actualmente seleccionado
	 */
	obtenerStickerActual(): Sticker | null {
		return this.estado.stickerActual;
	}

	/**
	 * Obtiene la escala actual del sticker
	 */
	obtenerEscalaSticker(): number {
		return this.estado.escalaSticker;
	}

	/**
	 * Indica que se ha iniciado el dibujo
	 */
	iniciarDibujo() {
		this.estado.estaDibujando = true;
	}

	/**
	 * Procesa el dibujo en progreso
	 */
	dibujar() {
		// Esta función se ejecuta durante el movimiento de dibujo
		// El canvas maneja la lógica específica del dibujo
	}

	/**
	 * Indica que se ha terminado el dibujo
	 */
	detenerDibujo() {
		this.estado.estaDibujando = false;
	}

	/**
	 * Limpia el lienzo completamente
	 */
	limpiarLienzo() {
		if (!this.componenteCanvas) {
			console.error('[ServicioDibujo] No hay referencia al canvas');
			return;
		}

		this.componenteCanvas.limpiar();
		console.log('[ServicioDibujo] Lienzo limpiado');
	}

	/**
	 * Deshace la última acción
	 */
	deshacer() {
		if (!this.componenteCanvas) {
			console.error('[ServicioDibujo] No hay referencia al canvas');
			return;
		}

		this.componenteCanvas.deshacer();
		console.log('[ServicioDibujo] Acción deshecha');
	}

	/**
	 * Guarda el dibujo actual
	 */
	guardarDibujo() {
		if (!this.componenteCanvas) {
			console.error('[ServicioDibujo] No hay referencia al canvas');
			return;
		}

		this.componenteCanvas.guardarDibujo();
		console.log('[ServicioDibujo] Dibujo guardado');
	}

	/**
	 * Activa o desactiva el modo accesible
	 */
	alternarModoAccesible() {
		this.estado.modoAccesible = !this.estado.modoAccesible;
		
		if (this.componenteOverlay) {
			if (this.estado.modoAccesible) {
				this.componenteOverlay.activarNavegacion();
			} else {
				this.componenteOverlay.desactivarNavegacion();
			}
		}
		
		console.log(`[ServicioDibujo] Modo accesible: ${this.estado.modoAccesible ? 'activado' : 'desactivado'}`);
	}

	/**
	 * Obtiene el estado actual del servicio
	 */
	obtenerEstado(): EstadoDibujo {
		return { ...this.estado };
	}

	/**
	 * Obtiene el contexto del canvas
	 */
	obtenerContextoCanvas(): CanvasRenderingContext2D | null {
		if (!this.componenteCanvas) {
			return null;
		}

		return this.componenteCanvas.obtenerContexto();
	}

	/**
	 * Obtiene las herramientas disponibles
	 */
	obtenerHerramientasDisponibles(): HerramientaDibujo[] {
		return [...HERRAMIENTAS_DISPONIBLES];
	}

	/**
	 * Obtiene los colores predefinidos
	 */
	obtenerColoresPredefinidos(): string[] {
		return [...COLORES_PREDEFINIDOS];
	}

	// Métodos privados

	/**
	 * Aplica el estilo actual al canvas según la herramienta seleccionada
	 */
	private aplicarEstiloActualAlCanvas() {
		if (!this.componenteCanvas) return;

		if (this.estado.herramientaActual.id === 'pincel') {
			this.componenteCanvas.establecerEstiloDibujo(
				this.estado.colorActual,
				this.estado.grosorActual
			);
		} else if (this.estado.herramientaActual.id === 'borrador') {
			this.componenteCanvas.establecerBorrador(this.estado.grosorActual);
		}
		// Para stickers u otras herramientas, se implementarán métodos específicos
	}

	/**
	 * Resetea el servicio a su estado inicial
	 */
	resetear() {
		this.estado = {
			herramientaActual: HERRAMIENTAS_DISPONIBLES[0],
			colorActual: '#000000',
			grosorActual: 5,
			estaDibujando: false,
			modoAccesible: false,
			stickerActual: null,
			escalaSticker: 1.0
		};
		
		this.aplicarEstiloActualAlCanvas();
		console.log('[ServicioDibujo] Servicio reseteado');
	}

	/**
	 * Destruye el servicio y limpia referencias
	 */
	destruir() {
		this.componenteCanvas = null;
		this.componenteOverlay = null;
		console.log('[ServicioDibujo] Servicio destruido');
	}

	/**
	 * Bloquea temporalmente el canvas durante drag & drop
	 */
	bloquear(): void {
		this.bloqueado = true;
		if (this.componenteCanvas) {
			// Deshabilitar eventos del canvas
			this.componenteCanvas.deshabilitarEventos?.();
		}
		console.log('[ServicioDibujo] Canvas bloqueado');
	}

	/**
	 * Desbloquea el canvas
	 */
	desbloquear(): void {
		this.bloqueado = false;
		if (this.componenteCanvas) {
			// Rehabilitar eventos del canvas
			this.componenteCanvas.habilitarEventos?.();
		}
		console.log('[ServicioDibujo] Canvas desbloqueado');
	}

	/**
	 * Verifica si el canvas está bloqueado
	 */
	estaBloqueado(): boolean {
		return this.bloqueado;
	}
}

// Instancia singleton del servicio
export const servicioDibujo = new ServicioDibujo();