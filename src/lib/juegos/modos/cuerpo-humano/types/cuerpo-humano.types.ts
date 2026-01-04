/**
 * Tipos y interfaces para el modo de juego Cuerpo Humano
 */

/**
 * Representa una parte del cuerpo que puede ser arrastrada
 */
export interface ParteCuerpo {
	/** Identificador único de la parte */
	id: string;
	/** Nombre visible de la parte del cuerpo */
	nombre: string;
	/** ID de la zona válida donde debe colocarse */
	zonaValidaId: string;
}

/**
 * Representa una zona válida donde se puede colocar una parte
 */
export interface ZonaValida {
	/** Identificador único de la zona */
	id: string;
	/** Posición X en el canvas (px) */
	x: number;
	/** Posición Y en el canvas (px) */
	y: number;
	/** Ancho de la zona (px) */
	width: number;
	/** Alto de la zona (px) */
	height: number;
	/** Etiqueta opcional para mostrar */
	label?: string;
	/** ID de la parte correcta que debe colocarse aquí */
	parteCorrecta: string;
}

/**
 * Configuración completa de una escena del juego
 */
export interface EscenaConfig {
	/** ID único de la escena */
	id: string;
	/** Nombre de la escena */
	nombre: string;
	/** Ruta al archivo SVG de la plantilla */
	svgPath: string;
	/** Lista de partes del cuerpo disponibles */
	partes: ParteCuerpo[];
	/** Lista de zonas válidas donde colocar las partes */
	zonasValidas: ZonaValida[];
}

/**
 * Estado de una parte durante el juego
 */
export interface EstadoParte {
	/** ID de la parte */
	id: string;
	/** Si la parte ya fue colocada correctamente */
	colocada: boolean;
	/** Si la parte está siendo arrastrada actualmente */
	arrastrando: boolean;
}
