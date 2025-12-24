/**
 * ServicioDibujo
 * Servicio orquestador del modo de dibujo accesible.
 * Gestiona el estado global y facilita la comunicación entre el lienzo,
 * la barra de herramientas y el overlay de accesibilidad.
 */

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
		descripcion: 'Añadir stickers decorativos (próximamente)'
	}
];

// Colores predefinidos
export const COLORES_PREDEFINIDOS = [
	'#000000', // Negro
	'#FF0000', // Rojo
	'#00FF00', // Verde
	'#0000FF', // Azul
	'#FFFF00', // Amarillo
	'#FF00FF', // Magenta
	'#00FFFF', // Cian
	'#FFA500', // Naranja
	'#800080', // Púrpura
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
			modoAccesible: false
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
			modoAccesible: false
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