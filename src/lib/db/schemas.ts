/**
 * Esquemas e interfaces de TypeScript para la base de datos Dexie.js
 * Todas las interfaces usan nomenclatura en español (camelCase sin tildes)
 * 
 * @module db/schemas
 */

// ============================================================================
// TIPOS DE UNIÓN
// ============================================================================

/**
 * Modos de juego/actividad disponibles en Coloreco
 */
export type Modo = 'dibujo' | 'cuerpoHumano' | 'historias';

/**
 * Modos de visión del color (daltonismo)
 * Sincronizado con ColorBlindnessMode del store settings.ts
 */
export type ModoVisionColor = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

/**
 * Modos de contraste
 * Sincronizado con ContrastMode del store settings.ts
 */
export type ModoContraste = 'normal' | 'high';

// ============================================================================
// ENTIDADES PRINCIPALES
// ============================================================================

/**
 * Representa un artista/usuario del sistema
 * Clave primaria: id (autoincremental)
 */
export interface Artista {
	/** ID único autoincremental */
	id?: number;
	/** Nombre artístico del usuario */
	nombre: string;
	/** Fecha de creación del perfil */
	fechaCreacion: Date;
	/** Última vez que el artista estuvo activo */
	ultimaActividad: Date;
}

/**
 * Sesión activa del sistema
 * Clave primaria: 'actual' (singleton)
 */
export interface Sesion {
	/** Clave única, siempre 'actual' */
	id: 'actual';
	/** ID del artista actualmente seleccionado */
	artistaActualId: number | null;
	/** Fecha del último cambio de artista */
	cambioEn: Date;
}

/**
 * Ajustes de accesibilidad y preferencias por artista
 * Clave primaria: id (UUID)
 * Estructura sincronizada con ConfiguracionUI de settings.ts
 */
export interface Ajustes {
	/** UUID único del registro */
	id: string;
	/** FK al artista propietario */
	artistaId: number;
	
	// === Ajustes de interfaz ===
	/** Multiplicador de tamaño de fuente (1 = 100%) */
	multiplicadorTamanioFuente: number;
	/** Multiplicador de espaciado entre elementos */
	multiplicadorEspaciado: number;
	/** Radio de bordes redondeados en px */
	redondesBordes: number;
	
	// === Lupa mágica ===
	/** Si la lupa está habilitada */
	lupaActivada: boolean;
	/** Nivel de zoom de la lupa (1.5, 2, 3) */
	nivelMagnificacion: number;
	
	// === Modos de tema ===
	/** Modo noche (alto contraste oscuro) */
	modoNoche: boolean;
	/** Modo inverso (invierte paleta del modo noche) */
	modoInverso: boolean;
	
	// === DISLEXIA / Modos de lectura accesible ===
	/** Modo biónico: resalta primeras sílabas */
	modoBionico: boolean;
	/** Narración TTS activada */
	narracionActivada: boolean;
	/** Modo rima: resalta rimas */
	modoRima: boolean;
	/** Modo pictograma: muestra pictogramas junto a textos */
	modoPictograma: boolean;
	
	// === Daltonismo ===
	/** Modo de visión del color */
	modoVisionColor: ModoVisionColor;
	/** Intensidad del filtro de daltonismo (0-1) */
	intensidadFiltro: number;
	/** Texturas de ayuda para daltonismo */
	texturasActivas: boolean;
	/** Modo de contraste */
	modoContraste: ModoContraste;
	
	// === Audio (para futuras implementaciones) ===
	/** Volumen de música de fondo (0-1) */
	volumenMusica: number;
	/** Volumen de efectos de sonido (0-1) */
	volumenEfectos: number;
	/** Velocidad de texto a voz (0.5-2) */
	velocidadTTS: number;
	
	/** Fecha de última actualización */
	actualizadoEn: Date;
}

// ============================================================================
// SISTEMA DE LOGROS
// ============================================================================

/**
 * Códigos únicos de logros de historias
 */
export const LOGROS_HISTORIAS = {
	GRAN_LECTOR: 'GRAN_LECTOR',
	LECTOR_ALOCADO: 'LECTOR_ALOCADO',
	MENTE_BRILLANTE: 'MENTE_BRILLANTE',
	MAESTRO_HISTORIAS: 'MAESTRO_HISTORIAS'
} as const;

/**
 * Tipo para códigos de logros
 */
export type CodigoLogro = typeof LOGROS_HISTORIAS[keyof typeof LOGROS_HISTORIAS];

/**
 * Definición de un logro en el catálogo
 * Clave primaria: id (UUID)
 */
export interface LogroDefinicion {
	/** UUID único del logro */
	id: string;
	/** Código único del logro (ej: 'PRIMER_DIBUJO') */
	codigo: string;
	/** Nombre visible del logro */
	nombre: string;
	/** Descripción del logro */
	descripcion: string;
	/** Modo específico del logro (opcional, si aplica a un modo) */
	modo?: Modo;
	/** ID de la escena específica (opcional, si el logro está asociado a una escena) */
	escenaId?: string;
	/** Criterio de desbloqueo en formato JSON o texto */
	criterio: string;
	/** Icono o emoji del logro (opcional) */
	icono?: string;
}

/**
 * Estado de un logro para un artista específico
 * Clave primaria: id (UUID)
 */
export interface LogroArtista {
	/** UUID único del registro */
	id: string;
	/** FK al artista */
	artistaId: number;
	/** FK al logro (LogroDefinicion.id) */
	logroId: string;
	/** Si el logro ha sido desbloqueado */
	desbloqueado: boolean;
	/** Fecha de desbloqueo (si aplica) */
	fechaDesbloqueo?: Date;
	/** Progreso parcial para logros progresivos (0-100) */
	progresoParcial?: number;
}

/**
 * SISTEMA DE RANGOS GENERALES
 * 
 * Los rangos se calculan automáticamente según la cantidad de logros desbloqueados:
 * - Bronce: 1-3 logros desbloqueados (color: #CD7F32)
 * - Plata: 4-7 logros desbloqueados (color: #C0C0C0)
 * - Oro: 8+ logros desbloqueados (color: #FFD700)
 * 
 * No se usa una tabla de base de datos, se calcula dinámicamente.
 */

// ============================================================================
// GALERÍA DE OBRAS
// ============================================================================

/**
 * Metadatos de una obra creada por un artista
 * Clave primaria: id (UUID)
 */
export interface Obra {
	/** UUID único de la obra */
	id: string;
	/** FK al artista creador */
	artistaId: number;
	/** Título de la obra */
	titulo: string;
	/** Descripción de la obra */
	descripcion: string;
	/** Modo en que fue creada */
	modo: Modo;
	/** ID de la escena base usada (si aplica) */
	escenaId?: string;
	/** Fecha de creación */
	fechaCreacion: Date;
	/** Fecha de última actualización */
	fechaActualizacion: Date;
	/** Tipo MIME del blob (image/png, image/svg+xml, etc.) */
	mime: string;
	/** Etiquetas para categorización */
	etiquetas?: string[];
	/** Texto alternativo para accesibilidad */
	alt?: string;
	/** Si la obra puede ser editada */
	editable: boolean;
	/** Número de versión (para versionado) */
	version: number;
	/** ID de la obra padre (si es una versión) */
	padreId?: string;
	/** Modo de origen (si fue copiada de otro modo) */
	origenModo?: Modo;
	/** ID de escena de origen */
	origenEscenaId?: string;
	/** Versión de escena de origen */
	origenVersionEscena?: number;
	/** ID de la miniatura asociada */
	miniaturaId?: string;
}

/**
 * Blob binario de una obra
 * Clave primaria: idObra (FK)
 */
export interface ObraBlob {
	/** FK a la obra (Obra.id) */
	idObra: string;
	/** Datos binarios de la imagen */
	blob: Blob | ArrayBuffer;
}

/**
 * Miniatura de una obra (opcional)
 * Clave primaria: idObra (FK)
 */
export interface MiniaturaBlob {
	/** FK a la obra (Obra.id) */
	idObra: string;
	/** Datos binarios de la miniatura */
	blob: Blob | ArrayBuffer;
}

// ============================================================================
// CATÁLOGO DE ESCENAS
// ============================================================================

/**
 * Escena SVG disponible en el catálogo
 * Clave primaria: id (UUID)
 */
export interface EscenaCatalogo {
	/** UUID único de la escena */
	id: string;
	/** Modo al que pertenece la escena */
	modo: Modo;
	/** ID único de la escena dentro del modo */
	escenaId: string;
	/** Nombre visible de la escena */
	nombre: string;
	/** Ruta al archivo SVG en static/ */
	ruta: string;
	/** Versión de la escena */
	version: number;
}

// ============================================================================
// PROGRESO DE JUEGO
// ============================================================================

/**
 * Campos específicos para el modo Culture Quiz
 */
export interface ProgresoCultureQuiz {
	/** Número de preguntas respondidas */
	preguntasRespondidas: number;
	/** Número de respuestas correctas */
	respuestasCorrectas: number;
	/** Tiempo acumulado en segundos */
	tiempoAcumulado: number;
}

/**
 * Campos específicos para el modo Human Body
 */
export interface ProgresoHumanBody {
	/** Partes del cuerpo ubicadas correctamente */
	partesUbicadasCorrectamente: number;
	/** Número de errores cometidos */
	errores: number;
}

/**
 * Progreso de un artista en un modo/nivel específico
 * Clave primaria: id (UUID)
 */
export interface Progreso {
	/** UUID único del registro */
	id: string;
	/** FK al artista */
	artistaId: number;
	/** Modo de juego */
	modo: Modo;
	/** Nivel actual (1, 2, 3...) */
	nivel: number;
	/** Puntaje obtenido en el nivel */
	puntaje: number;
	/** Número de intentos realizados */
	intentos: number;
	/** Si el nivel fue completado */
	completado: boolean;
	/** Última vez que se jugó */
	ultimaVez: Date;
	
	// Campos condicionales según el modo
	/** Datos específicos de Culture Quiz */
	cultureQuiz?: ProgresoCultureQuiz;
	/** Datos específicos de Human Body */
	humanBody?: ProgresoHumanBody;
}

// ============================================================================
// SISTEMA DE HISTORIAS
// ============================================================================

/**
 * Progreso de un capítulo individual
 */
export interface ProgresoCapitulo {
	/** Número del capítulo (1, 2, 3...) */
	numeroCapitulo: number;
	/** Si el capítulo está desbloqueado para jugar */
	desbloqueado: boolean;
	/** Si el capítulo fue completado */
	completado: boolean;
	/** Fecha de desbloqueo (si aplica) */
	fechaDesbloqueo?: Date;
	/** Fecha de completado (si aplica) */
	fechaCompletado?: Date;
	/** Número de intentos realizados */
	intentos: number;
}

/**
 * Progreso de una historia completa para un artista
 * Clave primaria: id (UUID)
 */
export interface ProgresoHistoria {
	/** UUID único del registro */
	id: string;
	/** FK al artista */
	artistaId: number;
	/** ID de la historia (ej: 'cantuna', 'padre-almeida') */
	historiaId: string;
	/** Capítulos con su progreso */
	capitulos: ProgresoCapitulo[];
	/** Capítulo actual (último desbloqueado) */
	capituloActual: number;
	/** Número total de capítulos de la historia */
	totalCapitulos: number;
	/** Si la historia fue completada */
	completada: boolean;
	/** Fecha de inicio de la historia */
	fechaInicio: Date;
	/** Fecha de última actividad */
	ultimaActividad: Date;
	/** Fecha de completado (si aplica) */
	fechaCompletado?: Date;
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

/**
 * Tipo para generar UUIDs
 */
export type UUID = string;

/**
 * Genera un UUID v4
 */
export function generarUUID(): UUID {
	return crypto.randomUUID();
}
