# Modal Reutilizable - Documentación

Componente modal flexible y accesible para Coloreco, construido con Svelte 5 y optimizado para funcionar perfectamente con las opciones de accesibilidad de la aplicación.

## Características

- ✅ **Accesible**: ARIA labels, focus trap, navegación con teclado (ESC para cerrar)
- ✅ **Flexible**: Snippets personalizables para contenido y acciones
- ✅ **Responsive**: Se adapta a diferentes tamaños de pantalla
- ✅ **Optimizado para accesibilidad**: Funciona correctamente con duplicación de texto y espaciado
- ✅ **Scroll inteligente**: El contenido hace scroll mientras encabezado y botones permanecen visibles
- ✅ **Z-index elevado**: Siempre visible por encima de cualquier elemento (z-index: 50000000)
- ✅ **Reutilizable**: Un componente para todos los casos de uso

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `abierto` | `boolean` | `false` | Controla si el modal está visible (usar con `bind:`) |
| `alCerrar` | `() => void` | `() => {}` | Callback opcional ejecutado al cerrar el modal |
| `titulo` | `string` | `''` | Título mostrado en el encabezado |
| `anchoMaximo` | `string` | `'600px'` | Ancho máximo del modal (CSS válido) |
| `mostrarBotonCerrar` | `boolean` | `true` | Muestra/oculta el botón X en el encabezado |
| `cerrarAlClickearFuera` | `boolean` | `true` | Permite cerrar clickeando el backdrop oscuro |
| `clase` | `string` | `''` | Clase CSS adicional para el contenedor del modal |

## Snippets (Svelte 5)

El modal utiliza la nueva API de snippets de Svelte 5:

- **`children`**: Contenido principal del modal (obligatorio)
- **`acciones`**: Botones de acción en el pie del modal (opcional)

**Importante:** Ambos snippets deben declararse con la sintaxis `{#snippet nombre()}...{/snippet}` dentro del componente Modal.

## Ejemplos de Uso

### 1. Modal de Confirmación (Eliminar Obra)

```svelte
<script>
	import Modal from '$lib/components/modales/Modal.svelte';
	
	let modalAbierto = $state(false);
	let obraNombre = "Mi Obra";
	
	function confirmar() {
		modalAbierto = false;
		// Lógica de eliminación
	}
</script>

<Modal
	bind:abierto={modalAbierto}
	titulo="Confirmar eliminación"
	anchoMaximo="500px"
	cerrarAlClickearFuera={false}
>
	{#snippet children()}
		<p>¿Estás seguro que deseas eliminar <strong>"{obraNombre}"</strong>?</p>
		<p style="color: #d32f2f; font-weight: 600;">⚠️ Esta acción no se puede deshacer.</p>
	{/snippet}

	{#snippet acciones()}
		<button onclick={() => modalAbierto = false}>Cancelar</button>
		<button onclick={confirmar}>Eliminar</button>
	{/snippet}
</Modal>
```

### 2. Modal de Instrucciones de Juego

```svelte
<script>
	import Modal from '$lib/components/modales/Modal.svelte';
	
	let modalInstrucciones = $state(false);
	
	function comenzarJuego() {
		modalInstrucciones = false;
		// Iniciar juego
	}
</script>

<Modal
	bind:abierto={modalInstrucciones}
	titulo="¿Cómo jugar?"
	anchoMaximo="700px"
>
	{#snippet children()}
		<h3>Instrucciones:</h3>
		<ol>
			<li>Selecciona los colores de la paleta</li>
			<li>Dibuja sobre el lienzo</li>
			<li>Guarda tu obra al terminar</li>
		</ol>
		
		<div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
			💡 <strong>Consejo:</strong> Usa las teclas de flecha para navegar
		</div>
	{/snippet}

	{#snippet acciones()}
		<button onclick={comenzarJuego}>¡Entendido, comenzar!</button>
	{/snippet}
</Modal>
```

### 3. Modal de Retroalimentación

```svelte
<script>
	import Modal from '$lib/components/modales/Modal.svelte';
	
	let modalFeedback = $state(false);
	let aciertos = 8;
	let total = 10;
	let porcentaje = (aciertos / total) * 100;
</script>

<Modal
	bind:abierto={modalFeedback}
	titulo="¡Felicidades!"
	anchoMaximo="600px"
	mostrarBotonCerrar={false}
>
	{#snippet children()}
		<div style="text-align: center;">
			<div style="font-size: 4rem; margin: 1rem 0;">🎉</div>
			<h3>¡Excelente trabajo!</h3>
			<p style="font-size: 1.5rem; margin: 1rem 0;">
				Completaste <strong>{aciertos} de {total}</strong> actividades
			</p>
			
			<!-- Barra de progreso -->
			<div style="background: #e0e0e0; height: 30px; border-radius: 15px; overflow: hidden;">
				<div style="background: #4caf50; height: 100%; width: {porcentaje}%; transition: width 0.5s ease;"></div>
			</div>
			
			<p style="margin-top: 1rem; color: #666;">
				¡Sigue así! 🌟
			</p>
		</div>
	{/snippet}

	{#snippet acciones()}
		<button onclick={() => modalFeedback = false}>Continuar</button>
	{/snippet}
</Modal>
```

### 4. Modal de Información Simple

```svelte
<script>
	import Modal from '$lib/components/modales/Modal.svelte';
	
	let modalInfo = $state(false);
</script>

<Modal
	bind:abierto={modalInfo}
	titulo="Sobre esta aplicación"
	anchoMaximo="500px"
>
	{#snippet children()}
		<p>Coloreco es una aplicación educativa para niños con TEA.</p>
		<p><strong>Versión:</strong> 1.0.0</p>
		<p><strong>Desarrollado por:</strong> Tu Equipo</p>
	{/snippet}
</Modal>
```

### 5. Modal sin Título (Solo Contenido)

```svelte
<Modal
	bind:abierto={modalSimple}
	mostrarBotonCerrar={true}
	anchoMaximo="400px"
>
	{#snippet children()}
		<div style="text-align: center; padding: 2rem;">
			<div style="font-size: 5rem;">🎨</div>
			<h2>¡Obra guardada!</h2>
			<p>Tu creación está ahora en la galería</p>
		</div>
	{/snippet}

	{#snippet acciones()}
		<button onclick={() => modalSimple = false}>Cerrar</button>
	{/snippet}
</Modal>
```

## Accesibilidad

El modal incluye características avanzadas de accesibilidad:

### Navegación por Teclado
- **ESC**: Cierra el modal
- **Tab**: Navega entre elementos interactivos dentro del modal
- **Focus automático**: Al abrir, enfoca el primer elemento interactivo

### Compatibilidad con Opciones de Accesibilidad
El modal está optimizado para funcionar con las opciones de accesibilidad de Coloreco:
- **Duplicación de texto**: Los tamaños se ajustan usando `calc(var(--font-size-base, 1rem) * factor)`
- **Duplicación de espaciado**: Los paddings usan `calc(var(--spacing-base, 1rem) * factor)`
- **Alto contraste**: Los colores usan variables CSS de tema
- **Daltonismo**: Compatible con filtros de color

### Scroll Inteligente
- El encabezado y pie permanecen fijos
- Solo el contenido del cuerpo hace scroll cuando es necesario
- `max-height: 80vh` para evitar modales demasiado grandes
- Funciona perfectamente incluso con texto y espaciado duplicados

### ARIA y Semántica
- `role="dialog"` con `aria-modal="true"`
- `aria-labelledby` vincula el título con el modal
- `tabindex="-1"` permite enfoque programático
- Prevención de scroll del body cuando está abierto

## Estilos Personalizados

Puedes personalizar los botones del modal usando clases CSS globales en tu componente:

```css
/* En tu archivo .svelte donde usas el modal */
<style>
	/* Estilo base para todos los botones del modal */
	:global(.modal-boton) {
		padding: calc(var(--spacing-base, 1rem) * 1) calc(var(--spacing-base, 1rem) * 1.5);
		font-size: calc(var(--font-size-base, 1rem) * 1.1);
		font-weight: 600;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: transform 120ms ease, background 120ms ease;
		min-width: 100px;
	}

	/* Botón de cancelar */
	:global(.modal-boton-cancelar) {
		background: #757575;
		color: white;
	}

	:global(.modal-boton-cancelar:hover) {
		background: #616161;
		transform: translateY(-2px);
	}

	:global(.modal-boton-cancelar:focus) {
		outline: 2px solid #000000;
		background: #616161;
		outline-offset: 2px;
	}

	/* Botón de confirmar (acción principal) */
	:global(.modal-boton-confirmar) {
		background: #4caf50; /* o #f44336 para acciones destructivas */
		color: white;
	}

	:global(.modal-boton-confirmar:hover) {
		background: #388e3c; /* o #d32f2f para destructivas */
		transform: translateY(-2px);
	}

	:global(.modal-boton-confirmar:focus) {
		outline: 2px solid #000000;
		background: #388e3c; /* o #d32f2f para destructivas */
		outline-offset: 2px;
	}
</style>
```

### Paleta de Colores Recomendada

Para mantener consistencia con Coloreco:

- **Acción primaria/positiva**: `#4caf50` (verde) → hover `#388e3c`
- **Acción destructiva/peligro**: `#f44336` (rojo) → hover `#d32f2f`
- **Cancelar/secundario**: `#757575` (gris) → hover `#616161`
- **Advertencia**: `#ff9800` (naranja) → hover `#f57c00`
- **Información**: `#2196f3` (azul) → hover `#1976d2`

## Buenas Prácticas

### Acciones del Modal

1. **Usa `cerrarAlClickearFuera={false}`** para modales de confirmación importantes
   ```svelte
   <Modal cerrarAlClickearFuera={false}>
   ```

2. **Limita los botones de acción** - No uses más de 2-3 botones para mantener claridad

3. **Orden de botones** - Cancelar a la izquierda, acción principal a la derecha
   ```svelte
   {#snippet acciones()}
       <button class="modal-boton-cancelar">Cancelar</button>
       <button class="modal-boton-confirmar">Confirmar</button>
   {/snippet}
   ```

### Contenido

4. **Mantén el contenido conciso** - Los modales deben ser rápidos de leer
   - Usa párrafos cortos
   - Resalta información importante con `<strong>`
   - Usa iconos emoji para contexto visual (⚠️ 🎉 💡 ✅ ❌)

5. **Usa tamaños relativos** - Siempre usa variables CSS para tamaños:
   ```svelte
   <p style="font-size: calc(var(--font-size-base, 1rem) * 1);">
       Tu contenido aquí
   </p>
   ```

### Semántica y Accesibilidad

6. **Proporciona un título descriptivo** - Ayuda a los usuarios a entender el propósito
   ```svelte
   <Modal titulo="Confirmar eliminación">
   ```

7. **Usa el callback `alCerrar`** para limpiar estado si es necesario
   ```svelte
   <Modal alCerrar={() => { /* limpieza */ }}>
   ```

8. **Feedback visual claro** - Usa colores y iconos consistentes:
   - 🗑️ ❌ ⚠️ → Destructivo (rojo)
   - ✅ 💾 ✓ → Positivo (verde)
   - ℹ️ 💡 → Información (azul)

### Rendimiento

9. **No renderices modales innecesariamente** - Usa la prop `abierto` con `bind:`
   ```svelte
   let modalAbierto = $state(false);
   <Modal bind:abierto={modalAbierto}>
   ```

10. **Evita lógica pesada en el contenido del modal** - Calcula datos antes de abrir

## Integración con Sistema de Diseño

El modal usa las variables CSS del sistema de accesibilidad de Coloreco:

| Variable CSS | Uso | Valor por defecto |
|--------------|-----|-------------------|
| `--font-size-base` | Tamaño de fuente base que se multiplica | `1rem` |
| `--spacing-base` | Espaciado base para padding/margin | `1rem` |
| `--border-radius` | Radio de bordes redondeados | `8px` |

### Cómo funciona la accesibilidad

Cuando el usuario activa "Duplicar tamaño de texto" o "Duplicar espaciado":
- Las variables CSS cambian automáticamente (ej: `--font-size-base: 2rem`)
- El modal se ajusta usando `calc()` para mantener proporciones
- El scroll aparece automáticamente si el contenido es demasiado grande
- El encabezado y botones permanecen visibles y accesibles

**Ejemplo de cómo se calcula:**
```css
/* Normal: 1rem * 1.3 = 1.3rem */
/* Duplicado: 2rem * 1.3 = 2.6rem */
font-size: calc(var(--font-size-base, 1rem) * 1.3);
```

Esto asegura que el modal respete las preferencias de accesibilidad del usuario en toda la aplicación.

## Troubleshooting

### El modal no se cierra con ESC
- Verifica que no haya otros event listeners capturando el evento
- Asegúrate de que `abierto` esté correctamente vinculado con `bind:`

### El modal aparece detrás de otros elementos
- El modal usa `z-index: 50000000` por diseño
- Si aún aparece detrás, verifica que no haya elementos con `z-index` mayor

### El contenido se corta o no hace scroll
- El modal tiene `max-height: 80vh` y scroll automático
- El cuerpo del modal tiene `overflow-y: auto` para permitir scroll
- Verifica que no estés usando `height: 100%` en elementos hijos

### Los tamaños no se ajustan con accesibilidad
- Asegúrate de usar `calc(var(--font-size-base, 1rem) * factor)`
- No uses tamaños fijos en píxeles para texto/espaciado
- Usa las variables CSS de Coloreco para consistencia

## Licencia y Créditos

Componente desarrollado para Coloreco, optimizado para accesibilidad y uso con niños con TEA.
