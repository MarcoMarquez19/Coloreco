/**
 * Helper de pruebas para la galería de obras
 * Funciones temporales para crear y eliminar obras de prueba
 * 
 * ⚠️ ARCHIVO TEMPORAL - Solo para desarrollo y testing
 * 
 * @module db/obras.helper
 */

import { guardarObra, obtenerObras, eliminarObra } from './obras.service';
import { obtenerSesionActual } from './artistas.service';

/**
 * Genera una imagen de canvas con un color sólido y texto
 * @param color - Color de fondo en formato hexadecimal
 * @param titulo - Texto a mostrar en el centro de la imagen
 * @returns Blob de la imagen generada
 */
async function generarImagenPrueba(color: string, titulo: string): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = 800;
	canvas.height = 600;
	const ctx = canvas.getContext('2d');
	
	if (!ctx) {
		throw new Error('No se pudo crear el contexto del canvas');
	}
	
	// Fondo de color
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	// Agregar algunos elementos decorativos
	ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
	for (let i = 0; i < 10; i++) {
		ctx.beginPath();
		ctx.arc(
			Math.random() * canvas.width,
			Math.random() * canvas.height,
			Math.random() * 50 + 20,
			0,
			Math.PI * 2
		);
		ctx.fill();
	}
	
	// Texto principal
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 48px Arial';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
	ctx.shadowBlur = 10;
	ctx.fillText(titulo, canvas.width / 2, canvas.height / 2);
	
	// Subtítulo
	ctx.font = '24px Arial';
	ctx.fillText('Obra de Prueba', canvas.width / 2, canvas.height / 2 + 60);
	
	// Convertir a blob
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) {
				resolve(blob);
			} else {
				reject(new Error('No se pudo generar el blob'));
			}
		}, 'image/png');
	});
}

/**
 * Crea 5 obras de prueba con diferentes colores y modos
 * Las obras se guardan en la base de datos para el artista actual
 * 
 * @returns Promise que se resuelve cuando todas las obras están creadas
 */
export async function crearObrasDePrueba(): Promise<void> {
	try {
		// Obtener artista actual
		const sesion = await obtenerSesionActual();
		const artistaId = sesion?.artistaActualId;
		
		if (!artistaId) {
			throw new Error('No hay un artista seleccionado');
		}
		
		const obrasPrueba = [
			{ 
				titulo: 'Atardecer Rojo', 
				color: '#ff6b6b', 
				modo: 'dibujo' as const,
				descripcion: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla in turpis lacinia, vehicula justo in, porttitor massa. Duis eu arcu lectus. Cras fringilla tortor sit amet lacus ultrices varius. Nulla id purus quis mi sodales eleifend et nec lectus. Aenean vulputate erat magna, eu finibus tellus congue sed. Etiam maximus eget lectus in gravida. Vestibulum semper sagittis lorem ac molestie. Nunc ut justo arcu. In sit amet mauris sit amet odio aliquam condimentum ac vel orci. Maecenas ac tortor nec diam porta fermentum in non est. Sed nisi neque, imperdiet sed consectetur nec, rutrum sit amet ipsum. Vestibulum at vulputate eros. Aliquam in luctus augue. In tristique diam sed orci vulputate luctus.Nam eu dolor faucibus, efficitur risus ac, varius nulla. Suspendisse leo sem, lobortis maximus nisi in, bibendum lacinia magna. Fusce at varius nisl. Aliquam libero turpis, aliquet et enim dapibus, viverra blandit arcu. Proin luctus semper leo in aliquet. Curabitur velit est, consectetur eu ornare posuere, scelerisque in ex. Aenean egestas at ipsum sed sodales. Morbi neque dolor, tincidunt non commodo ac, fermentum sed ex. Suspendisse vehicula lectus lectus, a porta turpis consectetur nec. Vestibulum libero nibh, finibus sit amet ipsum imperdiet, gravida blandit mauris. Pellentesque nec mattis purus. Nunc at pulvinar nibh, quis sollicitudin arcu. Sed faucibus odio vel pharetra feugiat. Fusce nisi enim, mattis in dolor non, fermentum placerat felis. Nullam luctus leo sit amet ipsum aliquam rhoncus. Sed suscipit, neque ut efficitur ornare, est risus euismod enim, eget aliquet purus orci vitae mi.Nunc sagittis, enim a tincidunt ultricies, nibh metus efficitur erat, sit amet semper tellus massa sed nunc. Curabitur mattis imperdiet nisl, ut luctus erat laoreet id. Praesent vehicula mollis lectus eget ultricies. Sed vulputate magna eleifend semper commodo. Sed volutpat neque nisl, ut porta libero suscipit sit amet. Phasellus quis luctus lorem. Morbi et dui nec lorem ullamcorper finibus. Nunc mattis, massa a eleifend suscipit, velit mi placerat dolor, eget congue dolor leo quis metus. In scelerisque sem id aliquam pulvinar. Aenean ac metus purus. Nulla in vulputate est, vitae dictum purus. Aliquam quis placerat orci. Proin dui ante, venenatis id vulputate at, cursus congue erat. Aenean turpis risus, egestas in orci in, convallis vehicula turpis.Praesent porta, quam sit amet facilisis sodales, dui ante tempor erat, quis luctus leo nulla sit amet dolor. Sed vestibulum orci at viverra venenatis. Donec bibendum viverra erat, finibus hendrerit metus accumsan eu. Sed velit leo, porta vitae lectus vitae, sagittis consectetur purus. Pellentesque non ultricies lorem, vel mattis ligula. Phasellus in eros sed dui aliquam aliquet. Phasellus vehicula, lorem non mattis tincidunt, turpis lorem scelerisque lorem, a vulputate sem lectus congue nulla. Donec placerat ex eros. Sed ultricies ultricies purus a semper. Integer in ligula a eros porta cursus bibendum et elit. Pellentesque varius lorem eget volutpat faucibus. Aliquam in gravida lectus. Ut tempus, nisl ut auctor ultrices, enim felis dictum libero, sed ornare velit ante vulputate sapien.Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Cras eleifend rhoncus justo. Proin efficitur lorem vitae tristique tempor. Nulla facilisi. Fusce euismod leo et metus condimentum dapibus. Sed sollicitudin fringilla arcu vitae sollicitudin. Integer quis justo metus.'
			},
			{ 
				titulo: 'Océano Azul', 
				color: '#4ecdc4', 
				modo: 'cuerpoHumano' as const,
				descripcion: 'Las profundidades del océano'
			},
			{ 
				titulo: 'Bosque Verde', 
				color: '#95e1d3', 
				modo: 'dibujo' as const,
				descripcion: 'Naturaleza en su máximo esplendor'
			},
			{ 
				titulo: 'Sol Amarillo', 
				color: '#ffe66d', 
				modo: 'historias' as const,
				descripcion: 'La calidez del sol en un día brillante'
			},
			{ 
				titulo: 'Noche Violeta', 
				color: '#a786df', 
				modo: 'dibujo' as const,
				descripcion: 'El misterio de la noche estrellada'
			}
		];

		console.log('🎨 Creando obras de prueba...');
		
		for (const obra of obrasPrueba) {
			try {
				const imagenBlob = await generarImagenPrueba(obra.color, obra.titulo);
				
				const obraId = await guardarObra({
					artistaId,
					titulo: obra.titulo,
					descripcion: obra.descripcion,
					modo: obra.modo,
					blob: imagenBlob,
					mime: 'image/png',
					etiquetas: ['prueba', 'generada'],
					alt: `Obra de prueba: ${obra.titulo}`
				});
				
				console.log(`✅ Obra creada: ${obra.titulo} (ID: ${obraId})`);
			} catch (error) {
				console.error(`❌ Error al crear ${obra.titulo}:`, error);
			}
		}
		
		console.log('🎉 ¡Obras de prueba creadas exitosamente!');
	} catch (error) {
		console.error('❌ Error general al crear obras de prueba:', error);
		throw error;
	}
}

/**
 * Elimina todas las obras del artista actual
 * Útil para limpiar la base de datos durante testing
 * 
 * ⚠️ PRECAUCIÓN: Esta acción no se puede deshacer
 * 
 * @returns Promise que se resuelve cuando todas las obras están eliminadas
 */
export async function limpiarObrasPrueba(): Promise<void> {
	try {
		// Obtener artista actual
		const sesion = await obtenerSesionActual();
		const artistaId = sesion?.artistaActualId;
		
		if (!artistaId) {
			throw new Error('No hay un artista seleccionado');
		}
		
		console.log('🗑️ Limpiando obras...');
		const obras = await obtenerObras(artistaId);
		
		if (obras.length === 0) {
			console.log('ℹ️ No hay obras para eliminar');
			return;
		}
		
		for (const obra of obras) {
			try {
				await eliminarObra(obra.id);
				console.log(`✅ Obra eliminada: ${obra.titulo}`);
			} catch (error) {
				console.error(`❌ Error al eliminar ${obra.titulo}:`, error);
			}
		}
		
		console.log(`🎉 ¡${obras.length} obra(s) eliminada(s)!`);
	} catch (error) {
		console.error('❌ Error general al limpiar obras:', error);
		throw error;
	}
}
