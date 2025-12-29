/**
 * Configuraciones de escenas para el modo Cuerpo Humano
 * Cada escena tiene sus partes y zonas válidas definidas en porcentajes (0-100)
 * para que sean responsivas al tamaño del canvas
 */

import type { EscenaConfig } from './types/cuerpo-humano.types';

export const CONFIGURACIONES_ESCENAS: Record<string, EscenaConfig> = {
	'cabeza': {
		id: 'cabeza',
		nombre: 'Partes de la Cabeza',
		svgPath: '/escenas/cabeza.svg',
		partes: [
			{ id: 'oreja', nombre: 'Oreja', zonaValidaId: 'zona-oreja' },
			{ id: 'ojo', nombre: 'Ojo', zonaValidaId: 'zona-ojo' },
            { id: 'cerebro', nombre: 'Cerebro', zonaValidaId: 'zona-cerebro' },
			{ id: 'boca', nombre: 'Boca', zonaValidaId: 'zona-boca' },
            { id: 'nariz', nombre: 'Nariz', zonaValidaId: 'zona-nariz' }
		],
		zonasValidas: [
			{ id: 'zona-cerebro', x: 83.4, y: 4.9, width: 15.6, height: 5.7, parteCorrecta: 'cerebro' },
			{ id: 'zona-ojo', x: 0.1, y: 41.6, width: 13.9, height: 4.9, parteCorrecta: 'ojo' },
			{ id: 'zona-nariz', x: 85.1, y: 61.4, width: 14.2, height: 4.7, parteCorrecta: 'nariz' },
			{ id: 'zona-boca', x: 85.1, y: 76.5, width: 14.1, height: 5.2, parteCorrecta: 'boca' },
			{ id: 'zona-oreja', x: 85.3, y: 49.4, width: 13.9, height: 4.9, parteCorrecta: 'oreja' }
		]
	},

	'cinco-sentidos': {
		id: 'cinco-sentidos',
		nombre: 'Los Cinco Sentidos',
		svgPath: '/escenas/cinco-sentidos.svg',
		partes: [
            { id: 'nariz', nombre: 'Nariz', zonaValidaId: 'zona-nariz' },
			{ id: 'ojo', nombre: 'Ojo', zonaValidaId: 'zona-ojo' },
            { id: 'boca', nombre: 'Boca', zonaValidaId: 'zona-boca' },
			{ id: 'oreja', nombre: 'Oreja', zonaValidaId: 'zona-oreja' },
			{ id: 'mano', nombre: 'Mano', zonaValidaId: 'zona-mano' }
			
		],
		zonasValidas: [
			{ id: 'zona-ojo', x: 82.5, y: 36.9, width: 16.5, height: 10.4, parteCorrecta: 'ojo' },
			{ id: 'zona-oreja', x: 50.9, y: 37.4, width: 16.9, height: 9.6, parteCorrecta: 'oreja' },
			{ id: 'zona-nariz', x: 28.8, y: 87.9, width: 16.7, height: 9.9, parteCorrecta: 'nariz' },
			{ id: 'zona-boca', x: 77.4, y: 87.7, width: 16.8, height: 9.9, parteCorrecta: 'boca' },
			{ id: 'zona-mano', x: 17, y: 37.4, width: 16.8, height: 9.6, parteCorrecta: 'mano' }
		]
	},

	'cuerpo-humano': {
		id: 'cuerpo-humano',
		nombre: 'Cuerpo Humano',
		svgPath: '/escenas/cuerpo-humano.svg',
		partes: [
            { id: 'pierna', nombre: 'Pierna', zonaValidaId: 'zona-pierna' },
			{ id: 'torso', nombre: 'Torso', zonaValidaId: 'zona-torso' },
            { id: 'cabeza', nombre: 'Cabeza', zonaValidaId: 'zona-cabeza' },
			{ id: 'brazo', nombre: 'Brazo', zonaValidaId: 'zona-brazo' }
		],
		zonasValidas: [
			{ id: 'zona-cabeza',x: 71.5, y: 0.9, width: 21.5, height: 5.2, parteCorrecta: 'cabeza' },
			{ id: 'zona-torso', x: 77.7, y: 34.3, width: 21.6, height: 4.9, parteCorrecta: 'torso' },
			{ id: 'zona-brazo', x: 0, y: 26.2, width: 21.5, height: 4.7, parteCorrecta: 'brazo' },
			{ id: 'zona-pierna', x: 73.4, y: 74.9, width: 22.8, height: 8.6, parteCorrecta: 'pierna' }
		]
	},

	'mano': {
		id: 'mano',
		nombre: 'Partes de la Mano',
		svgPath: '/escenas/mano.svg',
		partes: [
            { id: 'muneca', nombre: 'Muñeca', zonaValidaId: 'zona-muneca' },
			
			{ id: 'indice', nombre: 'Índice', zonaValidaId: 'zona-indice' },
            { id: 'pulgar', nombre: 'Pulgar', zonaValidaId: 'zona-pulgar' },
            { id: 'menique', nombre: 'Meñique', zonaValidaId: 'zona-menique' },
			{ id: 'medio', nombre: 'Medio', zonaValidaId: 'zona-medio' },
			{ id: 'palma', nombre: 'Palma', zonaValidaId: 'zona-palma' }
		],
		zonasValidas: [
			{ id: 'zona-pulgar', x: 0, y: 37, width: 19, height: 10, parteCorrecta: 'pulgar' },
            { id: 'zona-indice', x: 8.2, y: 4.1, width: 18.9, height: 8.6, parteCorrecta: 'indice' },
			{ id: 'zona-medio', x: 74.1, y: 0.9, width: 18.7, height: 8.9, parteCorrecta: 'medio' },
			{ id: 'zona-menique', x: 80.1, y: 22.8, width: 18.7, height: 8.9, parteCorrecta: 'menique' },
			{ id: 'zona-palma', x: 74.3, y: 56.7, width: 19, height: 9.1, parteCorrecta: 'palma' },
			{ id: 'zona-muneca', x: 71.2, y: 85.8, width: 19.4, height: 9.4, parteCorrecta: 'muneca' }
		]
	},

	'sistema-oseo-inferior': {
		id: 'oseo-inferior',
		nombre: 'Sistema Óseo Inferior',
		svgPath: '/escenas/oseo-inferior.svg',
		partes: [
            { id: 'tibia', nombre: 'Tibia', zonaValidaId: 'zona-tibia' },
			{ id: 'rotula', nombre: 'Rótula', zonaValidaId: 'zona-rotula' },
			{ id: 'femur', nombre: 'Fémur', zonaValidaId: 'zona-femur' },
			{ id: 'pie', nombre: 'Pie', zonaValidaId: 'zona-pie' },
            { id: 'pelvis', nombre: 'Pelvis', zonaValidaId: 'zona-pelvis' }
		],
		zonasValidas: [
			{ id: 'zona-pelvis', x: 61.6, y: 7.5, width: 37.8, height: 4.7, parteCorrecta: 'pelvis' },
			{ id: 'zona-femur', x: 61.4, y: 31.9, width: 37.8, height: 5.2, parteCorrecta: 'femur' },
			{ id: 'zona-rotula', x: 61.4, y: 49.1, width: 37.8, height: 4.7, parteCorrecta: 'rotula' },
			{ id: 'zona-tibia', x: 61.3, y: 66.3, width: 38.1, height: 4.9, parteCorrecta: 'tibia' },
			{ id: 'zona-pie', x: 61.6, y: 87.1, width: 37.5, height: 5.2, parteCorrecta: 'pie' }
		]
	},

	'sistema-oseo-superior': {
		id: 'oseo-superior',
		nombre: 'Sistema Óseo Superior',
		svgPath: '/escenas/oseo-superior.svg',
		partes: [
            { id: 'humero', nombre: 'Húmero', zonaValidaId: 'zona-humero' },
			{ id: 'craneo', nombre: 'Cráneo', zonaValidaId: 'zona-craneo' },
			{ id: 'claviculas', nombre: 'Clavícula', zonaValidaId: 'zona-claviculas' },
			{ id: 'columna', nombre: 'Columna', zonaValidaId: 'zona-columna' },
            { id: 'costillas', nombre: 'Costillas', zonaValidaId: 'zona-costillas' }
		],
		zonasValidas: [
			{ id: 'zona-craneo', x: 71.5, y: 7.5, width: 17.6, height: 4.7, parteCorrecta: 'craneo' },
			{ id: 'zona-claviculas', x: 71.6, y: 29.6, width: 17.3, height: 4.9, parteCorrecta: 'claviculas' },
			{ id: 'zona-costillas', x: 0.2, y: 57.2, width: 17.4, height: 4.7, parteCorrecta: 'costillas' },
			{ id: 'zona-humero', x: 81.7, y: 64.2, width: 17.8, height: 4.4, parteCorrecta: 'humero' },
			{ id: 'zona-columna', x: 0.1, y: 90.3, width: 17.6, height: 4.7, parteCorrecta: 'columna' }
		]
	},

	'sistema-circulatorio': {
		id: 'sistema-circulatorio',
		nombre: 'Sistema Circulatorio',
		svgPath: '/escenas/sistema-circulatorio.svg',
		partes: [
            { id: 'arterias', nombre: 'Arteria', zonaValidaId: 'zona-arterias' },
			{ id: 'corazon', nombre: 'Corazón', zonaValidaId: 'zona-corazon' },
			{ id: 'venas', nombre: 'Vena', zonaValidaId: 'zona-venas' },
		],
		zonasValidas: [
			{ id: 'zona-corazon', x: 79.8, y: 48.9, width: 19.5, height: 9.6, parteCorrecta: 'corazon' },
			{ id: 'zona-arterias', x: 81, y: 66.3, width: 18.2, height: 9.4, parteCorrecta: 'arterias' },
			{ id: 'zona-venas', x: 76.4, y: 10.3, width: 19, height: 9.1, parteCorrecta: 'venas' }
		]
	},

	'sistema-digestivo': {
		id: 'sistema-digestivo',
		nombre: 'Sistema Digestivo',
		svgPath: '/escenas/sistema-digestivo.svg',
		partes: [
            { id: 'intestino-grueso', nombre: 'Intestino Grueso', zonaValidaId: 'zona-intestino-grueso' },
			{ id: 'esofago', nombre: 'Esófago', zonaValidaId: 'zona-esofago' },
			{ id: 'recto', nombre: 'Recto', zonaValidaId: 'zona-recto' },
			{ id: 'intestino-delgado', nombre: 'Intestino Delgado', zonaValidaId: 'zona-intestino-delgado' },
			{ id: 'estomago', nombre: 'Estómago', zonaValidaId: 'zona-estomago' }
		],
		zonasValidas: [
			{ id: 'zona-esofago', x: 79.9, y: 16.6, width: 19.4, height: 6, parteCorrecta: 'esofago' },
			{ id: 'zona-estomago', x: 80.2, y: 45.2, width: 18.9, height: 6.5, parteCorrecta: 'estomago' },
			{ id: 'zona-intestino-delgado', x: 80.1, y: 69.4, width: 19.4, height: 6.2, parteCorrecta: 'intestino-delgado' },
			{ id: 'zona-intestino-grueso', x: 0, y: 68.6, width: 19.4, height: 6, parteCorrecta: 'intestino-grueso' },
            { id: 'zona-recto', x: 79.9, y: 91.6, width: 19.3, height: 6, parteCorrecta: 'recto' }
		]
	},

	'sistema-respiratorio': {
		id: 'sistema-respiratorio',
		nombre: 'Sistema Respiratorio',
		svgPath: '/escenas/sistema-respiratorio.svg',
		partes: [
			{ id: 'pulmones', nombre: 'Pulmones', zonaValidaId: 'zona-pulmones' },
			{ id: 'traquea', nombre: 'Tráquea', zonaValidaId: 'zona-traquea' },
			{ id: 'boca', nombre: 'Boca', zonaValidaId: 'zona-boca' },
            { id: 'nariz', nombre: 'Nariz', zonaValidaId: 'zona-nariz' }
		],
		zonasValidas: [
			{ id: 'zona-nariz', x: 62.7, y: 0.9, width: 21, height: 9.4, parteCorrecta: 'nariz' },
			{ id: 'zona-traquea', x: 69, y: 34.5, width: 21.9, height: 9.6, parteCorrecta: 'traquea' },
			{ id: 'zona-boca', x: 62.5, y: 15.3, width: 21.5, height: 9.4, parteCorrecta: 'boca' },
			{ id: 'zona-pulmones', x: 77.2, y: 66, width: 22, height: 9.9, parteCorrecta: 'pulmones' }
		]
	}
};

/**
 * Obtiene la configuración de una escena por su ID
 */
export function obtenerConfiguracionEscena(sceneId: string): EscenaConfig | null {
	return CONFIGURACIONES_ESCENAS[sceneId] || null;
}

/**
 * Obtiene todas las escenas disponibles
 */
export function obtenerTodasLasEscenas(): EscenaConfig[] {
	return Object.values(CONFIGURACIONES_ESCENAS);
}
