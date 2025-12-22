# Sistema de Logros - Guía de Uso

## Descripción General

El sistema de logros de Coloreco permite:
- Desbloquear logros en los 3 modos de juego (dibujos, cuerpo humano, historias)
- Sumar puntos de todos los modos para un puntaje total
- Obtener medallas según la puntuación acumulada
- Consultar logros por escena, modo o artista

## Estructura de la Base de Datos

### Tablas
- **logrosDefinicion**: Catálogo de todos los logros disponibles
- **logrosArtista**: Estado de cada logro para cada artista
- **umbralesMedallas**: Umbrales de puntuación para cada medalla

### Schema LogroDefinicion
```typescript
interface LogroDefinicion {
  id: string;
  codigo: string;        // Código único (ej: 'PRIMER_DIBUJO')
  nombre: string;        // Nombre visible
  descripcion: string;   // Descripción del logro
  puntos: number;        // Puntos otorgados
  modo?: Modo;           // 'dibujo' | 'cuerpoHumano' | 'historias' | undefined
  escenaId?: string;     // ID de escena específica (opcional)
  criterio: string;      // Criterio de desbloqueo
  icono?: string;        // Emoji o icono
  categoria?: string;    // Categoría (creatividad, velocidad, etc.)
}
```

## Inicialización del Sistema

### Al inicio de la aplicación (en +layout.svelte o similar):

```typescript
import { inicializarSistemaLogros } from '$lib/db/logros.service';
import { browser } from '$app/environment';

if (browser) {
  await inicializarSistemaLogros();
}
```

Esto crea el catálogo de logros y umbrales de medallas si no existen.

## Funciones Principales

### 1. Consultar Logros

#### Obtener todos los logros
```typescript
import { obtenerTodosLosLogros } from '$lib/db/logros.service';

const logros = await obtenerTodosLosLogros();
```

#### Obtener logros por modo
```typescript
import { obtenerLogrosPorModo } from '$lib/db/logros.service';

const logrosDibujo = await obtenerLogrosPorModo('dibujo');
const logrosCuerpo = await obtenerLogrosPorModo('cuerpoHumano');
const logrosHistorias = await obtenerLogrosPorModo('historias');
```

#### Obtener logros por escena ⭐
```typescript
import { obtenerLogrosPorEscenaId } from '$lib/db/logros.service';

const logrosEscena = await obtenerLogrosPorEscenaId('escena-bosque-123');
```

#### Obtener logros generales (sin modo específico)
```typescript
import { obtenerLogrosGenerales } from '$lib/db/logros.service';

const logrosGenerales = await obtenerLogrosGenerales();
```

### 2. Logros de un Artista

#### Obtener todos los logros con su estado
```typescript
import { obtenerLogrosDeArtista } from '$lib/db/logros.service';

const logrosConEstado = await obtenerLogrosDeArtista(artistaId);
// Retorna: { definicion: LogroDefinicion, estado: LogroArtista }[]
```

#### Obtener solo logros desbloqueados
```typescript
import { obtenerLogrosDesbloqueados } from '$lib/db/logros.service';

const desbloqueados = await obtenerLogrosDesbloqueados(artistaId);
```

#### Obtener logros desbloqueados por modo
```typescript
import { obtenerLogrosDesbloqueadosPorModo } from '$lib/db/logros.service';

const desbloqueadosDibujo = await obtenerLogrosDesbloqueadosPorModo(artistaId, 'dibujo');
```

#### Verificar si tiene un logro específico
```typescript
import { tieneLogroDesbloqueado } from '$lib/db/logros.service';

const tiene = await tieneLogroDesbloqueado(artistaId, 'PRIMER_DIBUJO');
```

### 3. Desbloquear Logros

#### Desbloquear manualmente
```typescript
import { desbloquearLogro } from '$lib/db/logros.service';

const desbloqueado = await desbloquearLogro(artistaId, 'PRIMERA_OBRA');
// Retorna true si se desbloqueó, false si ya estaba desbloqueado
```

#### Actualizar progreso parcial (logros progresivos)
```typescript
import { actualizarProgresoLogro } from '$lib/db/logros.service';

// Actualizar al 50%
await actualizarProgresoLogro(artistaId, 'COLECCIONISTA_NOVATO', 50);

// Si llega a 100%, se desbloquea automáticamente
await actualizarProgresoLogro(artistaId, 'COLECCIONISTA_NOVATO', 100);
```

### 4. Verificadores Automáticos ⚡

Estas funciones verifican condiciones y desbloquean logros automáticamente:

#### Después de crear una obra
```typescript
import { verificarLogrosObras, verificarLogroMultimodal } from '$lib/db/logros.service';

// Verifica logros de cantidad de obras
const desbloqueados = await verificarLogrosObras(artistaId);

// Verifica si tiene obras en todos los modos
await verificarLogroMultimodal(artistaId);
```

#### Después de completar un dibujo
```typescript
import { verificarLogrosDibujo } from '$lib/db/logros.service';

const desbloqueados = await verificarLogrosDibujo(artistaId, escenaId);
```

#### Después de completar cuerpo humano
```typescript
import { verificarLogrosCuerpoHumano } from '$lib/db/logros.service';

const desbloqueados = await verificarLogrosCuerpoHumano(
  artistaId,
  partesCorrectas,  // número de partes colocadas correctamente
  errores,          // número de errores
  tiempoSegundos    // tiempo en segundos
);
```

#### Después de crear una historia
```typescript
import { verificarLogrosHistorias } from '$lib/db/logros.service';

const desbloqueados = await verificarLogrosHistorias(
  artistaId,
  numeroEscenas  // opcional: número de escenas en la historia
);
```

### 5. Puntuación y Medallas

#### Calcular puntaje total
```typescript
import { calcularPuntajeTotal } from '$lib/db/logros.service';

const puntaje = await calcularPuntajeTotal(artistaId);
```

#### Obtener medalla actual
```typescript
import { obtenerMedallaActual } from '$lib/db/logros.service';

const medalla = await obtenerMedallaActual(artistaId);
// Retorna: { medalla: 'Bronce', minPuntos: 0, maxPuntos: 199, color: '#CD7F32' }
```

#### Puntos para siguiente medalla
```typescript
import { puntosParaSiguienteMedalla } from '$lib/db/logros.service';

const puntos = await puntosParaSiguienteMedalla(artistaId);
// Retorna: número de puntos que faltan, o null si ya tiene la máxima
```

#### Obtener todos los umbrales
```typescript
import { obtenerTodosLosUmbrales } from '$lib/db/logros.service';

const umbrales = await obtenerTodosLosUmbrales();
// ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante']
```

### 6. Estadísticas Completas

```typescript
import { obtenerEstadisticasLogros } from '$lib/db/logros.service';

const stats = await obtenerEstadisticasLogros(artistaId);
```

Retorna:
```typescript
{
  totalLogros: number;
  logrosDesbloqueados: number;
  porcentajeCompletado: number;
  puntajeTotal: number;
  medallaActual: UmbralMedalla | null;
  puntosParaSiguiente: number | null;
  logrosPorModo: {
    dibujo: { total: number; desbloqueados: number };
    cuerpoHumano: { total: number; desbloqueados: number };
    historias: { total: number; desbloqueados: number };
    generales: { total: number; desbloqueados: number };
  };
}
```

## Ejemplo de Uso en una Página

### Página de Logros de Dibujo

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { obtenerLogrosPorModo, obtenerLogrosDeArtista } from '$lib/db/logros.service';
  
  let artistaId = 1; // Obtener del store de sesión
  let logrosConEstado: Array<{ definicion: LogroDefinicion; estado: LogroArtista }> = [];
  
  onMount(async () => {
    // Opción 1: Obtener solo logros de dibujo
    const logrosDibujo = await obtenerLogrosPorModo('dibujo');
    
    // Opción 2: Obtener todos los logros con estado
    const todos = await obtenerLogrosDeArtista(artistaId);
    logrosConEstado = todos.filter(l => l.definicion.modo === 'dibujo');
  });
</script>

<div>
  {#each logrosConEstado as { definicion, estado }}
    <div class:desbloqueado={estado.desbloqueado}>
      <h3>{definicion.icono} {definicion.nombre}</h3>
      <p>{definicion.descripcion}</p>
      <p>Puntos: {definicion.puntos}</p>
      
      {#if estado.desbloqueado}
        <span>✅ Desbloqueado</span>
      {:else if estado.progresoParcial}
        <progress value={estado.progresoParcial} max="100" />
      {/if}
    </div>
  {/each}
</div>
```

### Al guardar una obra

```typescript
import { 
  verificarLogrosObras, 
  verificarLogrosDibujo,
  verificarLogroMultimodal 
} from '$lib/db/logros.service';

async function guardarObra(artistaId: number, escenaId: string, modo: Modo) {
  // ... guardar obra en la BD ...
  
  // Verificar logros automáticamente
  const logrosDesbloqueados = [];
  
  logrosDesbloqueados.push(...await verificarLogrosObras(artistaId));
  await verificarLogroMultimodal(artistaId);
  
  if (modo === 'dibujo') {
    logrosDesbloqueados.push(...await verificarLogrosDibujo(artistaId, escenaId));
  }
  
  // Mostrar notificación si se desbloqueó algo
  if (logrosDesbloqueados.length > 0) {
    mostrarNotificacionLogros(logrosDesbloqueados);
  }
}
```

## Catálogo de Logros Predefinidos

### Logros Generales
- `BIENVENIDA` - Crear perfil (10 pts)
- `PRIMERA_OBRA` - Primera obra (20 pts)
- `COLECCIONISTA_NOVATO` - 5 obras (50 pts)
- `COLECCIONISTA_EXPERTO` - 20 obras (150 pts)
- `MAESTRO_MULTIMODAL` - Obra en cada modo (100 pts)

### Modo Dibujo
- `ESCENA_DIBUJO_COMPLETADA` - Primera escena (30 pts)
- `MAESTRO_ESCENAS` - 10 escenas únicas (200 pts)
- `PERFECCIONISTA_DIBUJO` - 3 versiones de una escena (75 pts)

### Modo Cuerpo Humano
- `PRIMER_CUERPO` - Primer cuerpo (30 pts)
- `ANATOMISTA_EXPERTO` - 20 partes correctas (100 pts)
- `CUERPO_PERFECTO` - Sin errores (150 pts)
- `VELOCISTA_ANATOMIA` - Menos de 2 min (80 pts)

### Modo Historias
- `PRIMERA_HISTORIA` - Primera historia (30 pts)
- `CUENTACUENTOS` - 5 historias (100 pts)
- `ESCRITOR_PROLIJO` - Historia con 10+ escenas (120 pts)
- `MAESTRO_NARRATIVO` - 15 historias (250 pts)

### Accesibilidad
- `EXPLORADOR_ACCESIBILIDAD` - 3 herramientas (50 pts)
- `USUARIO_INCLUSIVE` - Todas las herramientas (150 pts)

## Medallas

| Medalla | Puntos Mínimos | Color |
|---------|---------------|-------|
| Bronce | 0 - 199 | #CD7F32 |
| Plata | 200 - 499 | #C0C0C0 |
| Oro | 500 - 999 | #FFD700 |
| Platino | 1000 - 1999 | #E5E4E2 |
| Diamante | 2000+ | #B9F2FF |

## Flujo Recomendado por Modo

### Dibujos (Escenas)
1. Usuario completa una escena
2. Guardar obra con `escenaId`
3. Llamar `verificarLogrosDibujo(artistaId, escenaId)`
4. Llamar `verificarLogrosObras(artistaId)`
5. Llamar `verificarLogroMultimodal(artistaId)`
6. Mostrar notificaciones de logros desbloqueados

### Cuerpo Humano
1. Usuario completa el juego
2. Guardar progreso con estadísticas
3. Llamar `verificarLogrosCuerpoHumano(artistaId, partes, errores, tiempo)`
4. Guardar obra si corresponde
5. Mostrar notificaciones

### Historias
1. Usuario completa una historia
2. Contar número de escenas
3. Guardar obra
4. Llamar `verificarLogrosHistorias(artistaId, numeroEscenas)`
5. Llamar `verificarLogrosObras(artistaId)`
6. Mostrar notificaciones

## IDs de Escenas

Para exponer los IDs de escenas en cada modo:

### Opción 1: En el servicio de escenas
```typescript
// src/lib/db/escenas.service.ts
export const ESCENAS_DIBUJO = {
  BOSQUE: 'escena-bosque-001',
  PLAYA: 'escena-playa-002',
  CIUDAD: 'escena-ciudad-003',
  // ...
};

export const ESCENAS_CUERPO_HUMANO = {
  CUERPO_BASICO: 'cuerpo-basico-001',
  CUERPO_DETALLADO: 'cuerpo-detallado-002',
  // ...
};

export const ESCENAS_HISTORIAS = {
  CUENTO_HADAS: 'historia-hadas-001',
  AVENTURA: 'historia-aventura-002',
  // ...
};
```

### Opción 2: Desde el catálogo de escenas
```typescript
import { obtenerEscenasCatalogo } from '$lib/db/escenas.service';

const escenasDibujo = await obtenerEscenasCatalogo('dibujo');
const idEscena = escenasDibujo[0].escenaId;
```

## Notas Importantes

1. **Puntaje Total**: El puntaje se suma automáticamente de todos los modos
2. **Inicialización**: Llamar `inicializarSistemaLogros()` una sola vez al inicio
3. **Verificadores**: Llamar las funciones `verificar*()` después de cada acción relevante
4. **Notificaciones**: Los verificadores retornan array de códigos de logros desbloqueados
5. **Progreso Parcial**: Útil para logros que requieren acciones múltiples

## Expandir el Sistema

### Añadir un nuevo logro:

1. Agregar al `CATALOGO_LOGROS` en `logros.service.ts`
2. Crear verificador si es necesario
3. Llamar `await db.logrosDefinicion.clear()` y reiniciar la app para actualizar el catálogo
   O mejor: crear una función de migración para añadir solo los nuevos logros

### Añadir logros específicos por escena:

```typescript
{
  codigo: 'ESCENA_BOSQUE_MAESTRO',
  nombre: 'Maestro del Bosque',
  descripcion: 'Completa la escena del bosque 5 veces',
  puntos: 60,
  modo: 'dibujo',
  escenaId: 'escena-bosque-001',
  criterio: 'escena_completada:5',
  icono: '🌲',
  categoria: 'maestria'
}
```
