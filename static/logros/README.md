# Sistema de Logros - Guía de Implementación

Este documento explica cómo implementar nuevos logros en el sistema Coloreco.

## 📋 Tabla de Contenidos

- [Estructura del Sistema](#estructura-del-sistema)
- [Cómo Añadir un Nuevo Logro](#cómo-añadir-un-nuevo-logro)
- [Componentes y Páginas](#componentes-y-páginas)
- [Ejemplos](#ejemplos)

---

## 🏗️ Estructura del Sistema

El sistema de logros está distribuido en varios archivos:

### 1. **Definiciones de Logros**
- **Archivo**: `/static/logros/logros.json`
- **Propósito**: Define todos los logros disponibles por categoría

### 2. **Esquemas de Base de Datos**
- **Archivo**: `/src/lib/db/schemas.ts`
- **Propósito**: Define las interfaces TypeScript y constantes de códigos de logros

### 3. **Servicio de Base de Datos**
- **Archivo**: `/src/lib/db/logros.service.ts`
- **Propósito**: Funciones para consultar, crear y desbloquear logros

### 4. **Store Reactivo**
- **Archivo**: `/src/lib/stores/logros.ts`
- **Propósito**: Gestión del estado de logros y lógica de verificación/desbloqueo

### 5. **Componente Reutilizable**
- **Archivo**: `/src/lib/components/logros/LogrosViewer.svelte`
- **Propósito**: Componente para visualizar logros con trofeo y navegación

### 6. **Páginas de Logros**
- `/src/routes/logros/historias/+page.svelte` - Logros de historias
- `/src/routes/logros/escenas/+page.svelte` - Logros de dibujo/escenas
- `/src/routes/logros/cuerpo-humano/+page.svelte` - Logros de cuerpo humano

---

## 🆕 Cómo Añadir un Nuevo Logro

### Paso 1: Definir el Logro en JSON

Edita `/static/logros/logros.json` y añade tu logro en la categoría correspondiente:

```json
{
  "historias": [...],
  "dibujo": [
    {
      "codigo": "MI_NUEVO_LOGRO",
      "nombre": "Mi Nuevo Logro",
      "descripcion": "Descripción de lo que hace el logro",
      "criterio": "Criterio específico para desbloquearlo",
      "icono": "🎨"
    }
  ],
  "cuerpoHumano": [...]
}
```

**Campos obligatorios:**
- `codigo`: Identificador único en MAYÚSCULAS_CON_GUIONES_BAJOS
- `nombre`: Título visible del logro
- `descripcion`: Texto que describe el logro
- `criterio`: Condición para desbloquearlo
- `icono`: Emoji que representa el logro

### Paso 2: Añadir Constante en Schemas (Opcional)

Si quieres tener constantes tipadas, edita `/src/lib/db/schemas.ts`:

```typescript
export const LOGROS_DIBUJO = {
	PRIMER_DIBUJO: 'PRIMER_DIBUJO',
	MI_NUEVO_LOGRO: 'MI_NUEVO_LOGRO',
	// ... otros logros
} as const;
```

**Nota**: Este paso es opcional pero recomendado para evitar errores de tipeo.

### Paso 3: Implementar Lógica de Verificación

Edita `/src/lib/stores/logros.ts` y crea una función de verificación:

```typescript
/**
 * Verifica y otorga el logro "Mi Nuevo Logro"
 * 
 * @param artistaId - ID del artista
 * @param condicion - Condición específica del logro
 */
export async function verificarMiNuevoLogro(
	artistaId: number,
	condicion: boolean
): Promise<void> {
	if (!condicion) return;
	
	const yaDesbloqueado = await logrosService.tieneLogroDesbloqueado(
		artistaId,
		'MI_NUEVO_LOGRO' // o LOGROS_DIBUJO.MI_NUEVO_LOGRO si usaste constantes
	);

	if (!yaDesbloqueado) {
		await desbloquearLogro(artistaId, 'MI_NUEVO_LOGRO');
	}
}
```

### Paso 4: Llamar a la Verificación

En el lugar donde ocurre la acción que desbloquea el logro, llama a la función:

```typescript
import { verificarMiNuevoLogro } from '$lib/stores/logros';

// Cuando el usuario complete la acción...
await verificarMiNuevoLogro(artistaId, true);
```

---

## 🧩 Componentes y Páginas

### Componente Reutilizable: LogrosViewer

Ubicación: `/src/lib/components/logros/LogrosViewer.svelte`

**Props:**
- `categoria`: `'historias' | 'dibujo' | 'cuerpoHumano'`
- `tituloSeccion`: string (ej: "Logros de historias")

**Ejemplo de uso:**
```svelte
<script>
	import LogrosViewer from '$lib/components/logros/LogrosViewer.svelte';
</script>

<LogrosViewer categoria="dibujo" tituloSeccion="Logros de escenas" />
```

**Características:**
- Muestra trofeo con rango (oro/plata/bronce)
- Navegación entre logros con flechas
- Responsive con escala automática
- Soporte de accesibilidad completo

### Páginas de Logros

Cada categoría tiene su propia página que usa el componente `LogrosViewer`:

1. **Historias**: `/src/routes/logros/historias/+page.svelte`
   - Categoría: `"historias"`
   - Imagen decorativa: LibroAbierto.png

2. **Escenas/Dibujo**: `/src/routes/logros/escenas/+page.svelte`
   - Categoría: `"dibujo"`
   - Imagen decorativa: LibroDibujo.png

3. **Cuerpo Humano**: `/src/routes/logros/cuerpo-humano/+page.svelte`
   - Categoría: `"cuerpoHumano"`
   - Imagen decorativa: CuerpoHumano.png

---

## 📚 Ejemplos Completos

### Ejemplo 1: Logro Simple - "Primer Dibujo"

**1. JSON (`/static/logros/logros.json`):**
```json
{
  "dibujo": [
    {
      "codigo": "PRIMER_DIBUJO",
      "nombre": "Primer Dibujo",
      "descripcion": "Completa tu primera escena de dibujo",
      "criterio": "Completar una escena",
      "icono": "🎨"
    }
  ]
}
```

**2. Schema (`/src/lib/db/schemas.ts`):**
```typescript
export const LOGROS_DIBUJO = {
	PRIMER_DIBUJO: 'PRIMER_DIBUJO',
} as const;
```

**3. Store (`/src/lib/stores/logros.ts`):**
```typescript
import { LOGROS_DIBUJO } from '$lib/db/schemas';

export async function verificarPrimerDibujo(
	artistaId: number,
	escenaCompletada: boolean
): Promise<void> {
	if (!escenaCompletada) return;
	
	const yaDesbloqueado = await logrosService.tieneLogroDesbloqueado(
		artistaId,
		LOGROS_DIBUJO.PRIMER_DIBUJO
	);

	if (!yaDesbloqueado) {
		await desbloquearLogro(artistaId, LOGROS_DIBUJO.PRIMER_DIBUJO);
	}
}
```

**4. Uso en componente:**
```svelte
<script>
	import { verificarPrimerDibujo } from '$lib/stores/logros';
	
	async function completarEscena() {
		// ... lógica de completar escena
		
		// Verificar logro
		await verificarPrimerDibujo(artistaId, true);
	}
</script>
```

### Ejemplo 2: Logro con Contador - "5 Escenas Completadas"

**1. JSON:**
```json
{
  "dibujo": [
    {
      "codigo": "ARTISTA_NOVATO",
      "nombre": "Artista Novato",
      "descripcion": "Completa 5 escenas diferentes",
      "criterio": "Completar 5 escenas",
      "icono": "🖌️"
    }
  ]
}
```

**2. Store con contador:**
```typescript
export async function verificarArtistaNovato(
	artistaId: number,
	escenasCompletadas: number
): Promise<void> {
	if (escenasCompletadas >= 5) {
		const yaDesbloqueado = await logrosService.tieneLogroDesbloqueado(
			artistaId,
			LOGROS_DIBUJO.ARTISTA_NOVATO
		);

		if (!yaDesbloqueado) {
			await desbloquearLogro(artistaId, LOGROS_DIBUJO.ARTISTA_NOVATO);
		}
	}
}
```

---

## 🔧 Funciones Útiles del Servicio

### Funciones Principales

- `obtenerDefinicionesLogrosJSON(modo?)` - Obtiene logros del JSON
- `obtenerLogrosPorModo(modo)` - Filtra logros por categoría
- `obtenerLogrosPorEscenaId(escenaId)` - Filtra logros por escena específica
- `obtenerLogrosArtista(artistaId)` - Obtiene logros con estado del artista
- `desbloquearLogro(artistaId, codigoLogro)` - Desbloquea un logro
- `tieneLogroDesbloqueado(artistaId, codigoLogro)` - Verifica si está desbloqueado

### Tipos de Categoría (Modo)

```typescript
type Modo = 'dibujo' | 'cuerpoHumano' | 'historias';
```

---

## 🎯 Mejores Prácticas

1. **Códigos Únicos**: Usa nombres descriptivos en MAYÚSCULAS_CON_GUIONES_BAJOS
2. **Iconos**: Elige emojis representativos y visualmente claros
3. **Criterios Claros**: Define condiciones específicas y medibles
4. **Verificaciones**: Siempre verifica si ya está desbloqueado antes de desbloquear
5. **Logging**: Usa console.log para depuración durante desarrollo
6. **Constantes**: Usa constantes tipadas en vez de strings hardcodeados

---

## 🐛 Debugging

Si un logro no se desbloquea:

1. Verifica que el código en JSON coincida exactamente con el usado en el código
2. Revisa la consola del navegador para errores
3. Verifica que la función de verificación se esté llamando
4. Comprueba que la condición se cumpla correctamente
5. Revisa IndexedDB en DevTools para ver el estado de los logros

---

## 📝 Notas Adicionales

- Los logros se almacenan en IndexedDB localmente
- El sistema soporta progreso parcial (campo `progresoParcial`)
- Los rangos (oro/plata/bronce) se calculan automáticamente según porcentaje de logros desbloqueados
- Las notificaciones de logros aparecen automáticamente por 5 segundos
- El campo `escenaId` en el schema permite asociar logros a escenas específicas

---

¿Necesitas ayuda? Revisa los logros existentes en el código para ver más ejemplos.
