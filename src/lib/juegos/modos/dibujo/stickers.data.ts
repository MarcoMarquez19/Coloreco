/**
 * stickers.data.ts
 * Definición de categorías y stickers para el modo de dibujo
 * Basado en los objetivos pedagógicos ECA para educación artística
 */

export interface Sticker {
	id: string;
	nombre: string;
	emoji: string; // Usando emojis como representación visual
	categoria: string;
	subcategoria: string;
	descripcion: string;
	estilo: 'realista' | 'ilustracion' | 'pictorico' | 'esquematico';
}

export interface Subcategoria {
	id: string;
	nombre: string;
	icono: string;
	stickers: Sticker[];
}

export interface Categoria {
	id: string;
	nombre: string;
	icono: string;
	descripcion: string;
	subcategorias: Subcategoria[];
}

// Definición de stickers por subcategoría
const stickersFlora: Sticker[] = [
	{ id: 'arbol-1', nombre: 'Árbol Realista', emoji: '🌳', categoria: 'natural', subcategoria: 'flora', descripcion: 'Árbol con follaje verde', estilo: 'realista' },
	{ id: 'arbol-2', nombre: 'Árbol Ilustración', emoji: '🎄', categoria: 'natural', subcategoria: 'flora', descripcion: 'Árbol estilo dibujo infantil', estilo: 'ilustracion' },
	{ id: 'flor-1', nombre: 'Flor Rosa', emoji: '🌸', categoria: 'natural', subcategoria: 'flora', descripcion: 'Flor de cerezo', estilo: 'realista' },
	{ id: 'flor-2', nombre: 'Girasol', emoji: '🌻', categoria: 'natural', subcategoria: 'flora', descripcion: 'Girasol amarillo', estilo: 'realista' },
	{ id: 'flor-3', nombre: 'Rosa', emoji: '🌹', categoria: 'natural', subcategoria: 'flora', descripcion: 'Rosa roja', estilo: 'realista' },
	{ id: 'hoja-1', nombre: 'Hoja Verde', emoji: '🍃', categoria: 'natural', subcategoria: 'flora', descripcion: 'Hojas verdes', estilo: 'realista' },
	{ id: 'hoja-2', nombre: 'Hoja Otoño', emoji: '🍂', categoria: 'natural', subcategoria: 'flora', descripcion: 'Hoja de otoño', estilo: 'realista' },
	{ id: 'arbusto-1', nombre: 'Arbusto', emoji: '🌿', categoria: 'natural', subcategoria: 'flora', descripcion: 'Hierba y arbusto', estilo: 'realista' },
	{ id: 'cactus-1', nombre: 'Cactus', emoji: '🌵', categoria: 'natural', subcategoria: 'flora', descripcion: 'Cactus del desierto', estilo: 'realista' },
	{ id: 'palma-1', nombre: 'Palmera', emoji: '🌴', categoria: 'natural', subcategoria: 'flora', descripcion: 'Palmera tropical', estilo: 'realista' }
];

const stickersFauna: Sticker[] = [
	{ id: 'perro-1', nombre: 'Perro', emoji: '🐕', categoria: 'natural', subcategoria: 'fauna', descripcion: 'Perro doméstico', estilo: 'realista' },
	{ id: 'gato-1', nombre: 'Gato', emoji: '🐈', categoria: 'natural', subcategoria: 'fauna', descripcion: 'Gato doméstico', estilo: 'realista' },
	{ id: 'pajaro-1', nombre: 'Pájaro', emoji: '🐦', categoria: 'natural', subcategoria: 'fauna', descripcion: 'Pájaro volando', estilo: 'realista' },
	{ id: 'mariposa-1', nombre: 'Mariposa', emoji: '🦋', categoria: 'natural', subcategoria: 'fauna', descripcion: 'Mariposa colorida', estilo: 'realista' },
	{ id: 'abeja-1', nombre: 'Abeja', emoji: '🐝', categoria: 'natural', subcategoria: 'fauna', descripcion: 'Abeja trabajadora', estilo: 'realista' },
	{ id: 'vaca-1', nombre: 'Vaca', emoji: '🐄', categoria: 'natural', subcategoria: 'fauna', descripcion: 'Vaca de granja', estilo: 'realista' },
	{ id: 'caballo-1', nombre: 'Caballo', emoji: '🐴', categoria: 'natural', subcategoria: 'fauna', descripcion: 'Caballo', estilo: 'realista' },
	{ id: 'conejo-1', nombre: 'Conejo', emoji: '🐇', categoria: 'natural', subcategoria: 'fauna', descripcion: 'Conejo saltando', estilo: 'realista' },
	{ id: 'pez-1', nombre: 'Pez', emoji: '🐟', categoria: 'natural', subcategoria: 'fauna', descripcion: 'Pez tropical', estilo: 'realista' },
	{ id: 'tortuga-1', nombre: 'Tortuga', emoji: '🐢', categoria: 'natural', subcategoria: 'fauna', descripcion: 'Tortuga', estilo: 'realista' }
];

const stickersGeografia: Sticker[] = [
	{ id: 'montana-1', nombre: 'Montaña', emoji: '⛰️', categoria: 'natural', subcategoria: 'geografia', descripcion: 'Montaña nevada', estilo: 'realista' },
	{ id: 'sol-1', nombre: 'Sol', emoji: '☀️', categoria: 'natural', subcategoria: 'geografia', descripcion: 'Sol brillante', estilo: 'realista' },
	{ id: 'luna-1', nombre: 'Luna', emoji: '🌙', categoria: 'natural', subcategoria: 'geografia', descripcion: 'Luna creciente', estilo: 'realista' },
	{ id: 'estrella-1', nombre: 'Estrella', emoji: '⭐', categoria: 'natural', subcategoria: 'geografia', descripcion: 'Estrella brillante', estilo: 'realista' },
	{ id: 'nube-1', nombre: 'Nube', emoji: '☁️', categoria: 'natural', subcategoria: 'geografia', descripcion: 'Nube blanca', estilo: 'realista' },
	{ id: 'lluvia-1', nombre: 'Lluvia', emoji: '🌧️', categoria: 'natural', subcategoria: 'geografia', descripcion: 'Nube con lluvia', estilo: 'realista' },
	{ id: 'arcoiris-1', nombre: 'Arcoíris', emoji: '🌈', categoria: 'natural', subcategoria: 'geografia', descripcion: 'Arcoíris colorido', estilo: 'realista' },
	{ id: 'volcan-1', nombre: 'Volcán', emoji: '🌋', categoria: 'natural', subcategoria: 'geografia', descripcion: 'Volcán en erupción', estilo: 'realista' },
	{ id: 'piedra-1', nombre: 'Roca', emoji: '🪨', categoria: 'natural', subcategoria: 'geografia', descripcion: 'Piedra', estilo: 'realista' },
	{ id: 'fuego-1', nombre: 'Fuego', emoji: '🔥', categoria: 'natural', subcategoria: 'geografia', descripcion: 'Llamas de fuego', estilo: 'realista' }
];

const stickersArquitectura: Sticker[] = [
	{ id: 'casa-1', nombre: 'Casa', emoji: '🏠', categoria: 'artificial', subcategoria: 'arquitectura', descripcion: 'Casa con jardín', estilo: 'realista' },
	{ id: 'edificio-1', nombre: 'Edificio', emoji: '🏢', categoria: 'artificial', subcategoria: 'arquitectura', descripcion: 'Edificio de oficinas', estilo: 'realista' },
	{ id: 'escuela-1', nombre: 'Escuela', emoji: '🏫', categoria: 'artificial', subcategoria: 'arquitectura', descripcion: 'Edificio escolar', estilo: 'realista' },
	{ id: 'hospital-1', nombre: 'Hospital', emoji: '🏥', categoria: 'artificial', subcategoria: 'arquitectura', descripcion: 'Hospital', estilo: 'realista' },
	{ id: 'fabrica-1', nombre: 'Fábrica', emoji: '🏭', categoria: 'artificial', subcategoria: 'arquitectura', descripcion: 'Fábrica industrial', estilo: 'realista' },
	{ id: 'puente-1', nombre: 'Puente', emoji: '🌉', categoria: 'artificial', subcategoria: 'arquitectura', descripcion: 'Puente sobre agua', estilo: 'realista' },
	{ id: 'castillo-1', nombre: 'Castillo', emoji: '🏰', categoria: 'artificial', subcategoria: 'arquitectura', descripcion: 'Castillo medieval', estilo: 'realista' },
	{ id: 'tienda-1', nombre: 'Tienda', emoji: '🏪', categoria: 'artificial', subcategoria: 'arquitectura', descripcion: 'Tienda de conveniencia', estilo: 'realista' },
	{ id: 'banco-1', nombre: 'Banco', emoji: '🏦', categoria: 'artificial', subcategoria: 'arquitectura', descripcion: 'Edificio bancario', estilo: 'realista' },
	{ id: 'hotel-1', nombre: 'Hotel', emoji: '🏨', categoria: 'artificial', subcategoria: 'arquitectura', descripcion: 'Hotel', estilo: 'realista' }
];

const stickersTransporte: Sticker[] = [
	{ id: 'carro-1', nombre: 'Carro', emoji: '🚗', categoria: 'artificial', subcategoria: 'transporte', descripcion: 'Automóvil', estilo: 'realista' },
	{ id: 'bus-1', nombre: 'Bus', emoji: '🚌', categoria: 'artificial', subcategoria: 'transporte', descripcion: 'Autobús', estilo: 'realista' },
	{ id: 'bicicleta-1', nombre: 'Bicicleta', emoji: '🚲', categoria: 'artificial', subcategoria: 'transporte', descripcion: 'Bicicleta', estilo: 'realista' },
	{ id: 'avion-1', nombre: 'Avión', emoji: '✈️', categoria: 'artificial', subcategoria: 'transporte', descripcion: 'Avión comercial', estilo: 'realista' },
	{ id: 'barco-1', nombre: 'Barco', emoji: '🚢', categoria: 'artificial', subcategoria: 'transporte', descripcion: 'Barco de pasajeros', estilo: 'realista' },
	{ id: 'tren-1', nombre: 'Tren', emoji: '🚂', categoria: 'artificial', subcategoria: 'transporte', descripcion: 'Locomotora', estilo: 'realista' },
	{ id: 'helicoptero-1', nombre: 'Helicóptero', emoji: '🚁', categoria: 'artificial', subcategoria: 'transporte', descripcion: 'Helicóptero', estilo: 'realista' },
	{ id: 'ambulancia-1', nombre: 'Ambulancia', emoji: '🚑', categoria: 'artificial', subcategoria: 'transporte', descripcion: 'Ambulancia de emergencia', estilo: 'realista' },
	{ id: 'bomberos-1', nombre: 'Camión de Bomberos', emoji: '🚒', categoria: 'artificial', subcategoria: 'transporte', descripcion: 'Camión de bomberos', estilo: 'realista' },
	{ id: 'policia-1', nombre: 'Patrulla', emoji: '🚓', categoria: 'artificial', subcategoria: 'transporte', descripcion: 'Carro de policía', estilo: 'realista' }
];

const stickersCotidianos: Sticker[] = [
	{ id: 'silla-1', nombre: 'Silla', emoji: '🪑', categoria: 'artificial', subcategoria: 'cotidianos', descripcion: 'Silla', estilo: 'realista' },
	{ id: 'libro-1', nombre: 'Libro', emoji: '📚', categoria: 'artificial', subcategoria: 'cotidianos', descripcion: 'Libros apilados', estilo: 'realista' },
	{ id: 'lapiz-1', nombre: 'Lápiz', emoji: '✏️', categoria: 'artificial', subcategoria: 'cotidianos', descripcion: 'Lápiz para escribir', estilo: 'realista' },
	{ id: 'pelota-1', nombre: 'Pelota', emoji: '⚽', categoria: 'artificial', subcategoria: 'cotidianos', descripcion: 'Pelota de fútbol', estilo: 'realista' },
	{ id: 'regalo-1', nombre: 'Regalo', emoji: '🎁', categoria: 'artificial', subcategoria: 'cotidianos', descripcion: 'Caja de regalo', estilo: 'realista' },
	{ id: 'reloj-1', nombre: 'Reloj', emoji: '⏰', categoria: 'artificial', subcategoria: 'cotidianos', descripcion: 'Reloj despertador', estilo: 'realista' },
	{ id: 'telefono-1', nombre: 'Teléfono', emoji: '📱', categoria: 'artificial', subcategoria: 'cotidianos', descripcion: 'Teléfono móvil', estilo: 'realista' },
	{ id: 'computadora-1', nombre: 'Computadora', emoji: '💻', categoria: 'artificial', subcategoria: 'cotidianos', descripcion: 'Computadora portátil', estilo: 'realista' },
	{ id: 'llave-1', nombre: 'Llave', emoji: '🔑', categoria: 'artificial', subcategoria: 'cotidianos', descripcion: 'Llave', estilo: 'realista' },
	{ id: 'tijeras-1', nombre: 'Tijeras', emoji: '✂️', categoria: 'artificial', subcategoria: 'cotidianos', descripcion: 'Tijeras', estilo: 'realista' }
];

// Estructura de categorías con subcategorías
export const CATEGORIAS_STICKERS: Categoria[] = [
	{
		id: 'natural',
		nombre: 'Entorno Natural',
		icono: '🌿',
		descripcion: 'Elementos del mundo natural: plantas, animales y paisajes',
		subcategorias: [
			{
				id: 'flora',
				nombre: 'Flora',
				icono: '🌳',
				stickers: stickersFlora
			},
			{
				id: 'fauna',
				nombre: 'Fauna',
				icono: '🦋',
				stickers: stickersFauna
			},
			{
				id: 'geografia',
				nombre: 'Geografía',
				icono: '⛰️',
				stickers: stickersGeografia
			}
		]
	},
	{
		id: 'artificial',
		nombre: 'Entorno Artificial',
		icono: '🏗️',
		descripcion: 'Elementos creados por el ser humano: edificios, transporte y objetos',
		subcategorias: [
			{
				id: 'arquitectura',
				nombre: 'Arquitectura',
				icono: '🏛️',
				stickers: stickersArquitectura
			},
			{
				id: 'transporte',
				nombre: 'Transporte',
				icono: '🚗',
				stickers: stickersTransporte
			},
			{
				id: 'cotidianos',
				nombre: 'Objetos Cotidianos',
				icono: '🪑',
				stickers: stickersCotidianos
			}
		]
	}
];

// Tamaños de stickers disponibles
export const TAMANOS_STICKER = [
	{ id: 'pequeno', nombre: 'Pequeño', escala: 0.5, descripcion: 'Tamaño pequeño (50%)' },
	{ id: 'mediano', nombre: 'Mediano', escala: 1.0, descripcion: 'Tamaño mediano (100%)' },
	{ id: 'grande', nombre: 'Grande', escala: 1.5, descripcion: 'Tamaño grande (150%)' }
];

/**
 * Obtiene todos los stickers de todas las categorías
 */
export function obtenerTodosLosStickers(): Sticker[] {
	const stickers: Sticker[] = [];
	CATEGORIAS_STICKERS.forEach(categoria => {
		categoria.subcategorias.forEach(subcategoria => {
			stickers.push(...subcategoria.stickers);
		});
	});
	return stickers;
}

/**
 * Busca un sticker por su ID
 */
export function buscarStickerPorId(id: string): Sticker | null {
	const todosLosStickers = obtenerTodosLosStickers();
	return todosLosStickers.find(s => s.id === id) || null;
}
