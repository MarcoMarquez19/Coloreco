<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { configuraciones } from '$lib/stores/settings';
  import { audioStore } from '$lib/stores/audio';
  import zoomGif from '$lib/assets/gifts/Opcion_zoom.gif';
  import deshacerGif from '$lib/assets/gifts/Opcion_deshacer.gif';
  import navegacionGif from '$lib/assets/gifts/Modo_navegacion.gif';
  import stickersGif from '$lib/assets/gifts/Herramienta_stickers.gif';
  import lapizGif from '$lib/assets/gifts/Herramienta_lapiz_borrador.gif';



  const dispatch = createEventDispatcher();
  let modalRef = $state<HTMLElement | null>(null);
  let backdropRef = $state<HTMLElement | null>(null);
  let descripcionRef = $state<HTMLElement | null>(null);

  // Estado del carrusel
  let indiceGifActual = $state<number>(0);

  // Configuración de GIFs de instrucciones
  const gifsInstrucciones = [
    {
      src: lapizGif,
      descripcion: 'Con las herramientas "pincel" y "borrador", puedes dibujar y borrar partes del dibujo' 
    },
    {
      src: stickersGif,
      descripcion: 'Con la herramienta "stickers", puedes colocar pegatinas en el dibujo' 
    },
    {
      src: navegacionGif,
      descripcion: 'Presiona "SHIFT + D" para activar el modo de navegación y "ENTER" para escoger una zona. El mismo te permite identificar zonas específicas del dibujo.'
    },
    {
      src: deshacerGif,
      descripcion: 'Presiona la opción "Deshacer" para revertir el último cambio en el dibujo' 
    },
    {
      src: zoomGif,
      descripcion: 'Presiona la opción "Zoom" para acercar o alejar el dibujo, solamente podras desplazar el dibujo en esta opción. Puedes seguir dibujando con cualquiera de las herramientas disponibles'
    }
  ];

  function handleClose() {
    audioStore.playSound('click');
    dispatch('close');
  }

  // Cierra el modal si se hace click fuera de la caja modal
  function handleBackdropClick() {
    handleClose();
  }

  // Evitar propagación de clicks en el modal principal
  function handleModalClick(event: MouseEvent) {
    event.stopPropagation();
  }

  /**
   * Navega al GIF anterior en el carrusel
   */
  function gifAnterior() {
    audioStore.playSound('click');
    indiceGifActual = (indiceGifActual - 1 + gifsInstrucciones.length) % gifsInstrucciones.length;
    // Enfocar el elemento de descripción para lectores de pantalla
    setTimeout(() => descripcionRef?.focus(), 100);
  }

  /**
   * Navega al GIF siguiente en el carrusel
   */
  function gifSiguiente() {
    audioStore.playSound('click');
    indiceGifActual = (indiceGifActual + 1) % gifsInstrucciones.length;
    // Enfocar el elemento de descripción para lectores de pantalla
    setTimeout(() => descripcionRef?.focus(), 100);
  }

  /**
   * Ir a un GIF específico
   */
  function irAGif(index: number) {
    audioStore.playSound('click');
    indiceGifActual = index;
  }

  /**
   * Navega al GIF anterior usando el teclado
   */
  function gifAnteriorTeclado() {
    gifAnterior();
    // Temporalmente enfoca otro elemento para que el lector de pantalla re-anuncie
    setTimeout(() => {
      document.querySelector('h2')?.focus();
      setTimeout(() => descripcionRef?.focus(), 50);
    }, 100);
  }

  /**
   * Navega al GIF siguiente usando el teclado
   */
  function gifSiguienteTeclado() {
    gifSiguiente();
    // Temporalmente enfoca otro elemento para que el lector de pantalla re-anuncie
    setTimeout(() => {
      document.querySelector('h2')?.focus();
      setTimeout(() => descripcionRef?.focus(), 50);
    }, 100);
  }

  // Maneja la tecla Escape y flechas globalmente
  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      handleClose();
    } else if (event.key === 'ArrowLeft') {
      event.stopPropagation();
      event.preventDefault();
      gifAnteriorTeclado();
    } else if (event.key === 'ArrowRight') {
      event.stopPropagation();
      event.preventDefault();
      gifSiguienteTeclado();
    }
  }

  // Aplicar modos de accesibilidad cuando se monta el modal
  onMount(() => {
    let blockedElements: Array<{element: HTMLElement, originalTabIndex: string | null}> = [];
    
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';

    // Prevenir scroll del contenedor principal (.app-main)
    const appMain = document.querySelector('.app-main') as HTMLElement;
    if (appMain) {
      appMain.style.overflow = 'hidden';
    }
    
    // Bloquear todos los elementos tabulables excepto el modal y controles permitidos
    const allowedIds = ['narration-controls-container', 'floating-back-button', 'floating-settings-button', 'floating-instructions-button'];
    const tabbableElements = document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    tabbableElements.forEach((element) => {
      // No bloquear si el elemento está dentro del modal
      if (modalRef?.contains(element)) {
        return;
      }
      
      // No bloquear si el elemento está en un contenedor permitido
      const isInAllowedContainer = allowedIds.some(id => {
        const container = document.getElementById(id);
        return container?.contains(element);
      });
      
      if (!isInAllowedContainer) {
        const originalTabIndex = element.getAttribute('tabindex');
        blockedElements.push({ element, originalTabIndex });
        element.setAttribute('tabindex', '-1');
        element.setAttribute('data-modal-blocked', 'true');
      }
    });
    
    // Marcar contenido de fondo para lectores de pantalla
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.setAttribute('aria-hidden', 'true');
    }

    // Disparar un evento personalizado para que el layout procese el modal
    setTimeout(() => {
      const event = new CustomEvent('modal-mounted');
      window.dispatchEvent(event);

      // Enfocar el primer elemento interactivo del modal para accesibilidad
      setTimeout(() => {
        const primerElemento = modalRef?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        primerElemento?.focus();
      }, 100);
      
      // Si la narración está activada, iniciar lectura automática del modal
      if ($configuraciones.narrationEnabled) {
        setTimeout(() => {
          const readModalEvent = new CustomEvent('read-modal');
          window.dispatchEvent(readModalEvent);
        }, 200);
      }
    }, 50);

    // Cleanup: restaurar scroll y filtro cuando el componente se desmonte
    return () => {
      document.body.style.overflow = '';
      if (appMain) {
        appMain.style.overflow = '';
      }
      
      // Restaurar tabindex de elementos bloqueados
      blockedElements.forEach(({ element, originalTabIndex }) => {
        if (originalTabIndex !== null) {
          element.setAttribute('tabindex', originalTabIndex);
        } else {
          element.removeAttribute('tabindex');
        }
        element.removeAttribute('data-modal-blocked');
      });
      
      // Restaurar aria-hidden
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.removeAttribute('aria-hidden');
      }
    };
  });

  // Aplicar filtro de daltonismo/contraste al propio modal (actualiza en tiempo real)
  $effect(() => {
    const filtro = `${$configuraciones.colorBlindness !== 'none' ? 'url(#cvd-filter)' : ''} ${$configuraciones.contrast === 'high' ? 'url(#smart-contrast-filter)' : ''}`.trim();
    if (modalRef) {
      modalRef.style.filter = filtro;
      modalRef.style.transition = 'filter 150ms ease';
    }

    return () => {
      if (modalRef) {
        modalRef.style.filter = '';
        modalRef.style.transition = '';
      }
    };
  });

  // Inyectar variables de accesibilidad (tamaño de fuente y espaciado) directamente
  $effect(() => {
    if (backdropRef) {
      backdropRef.style.setProperty('--font-size-base', `${$configuraciones.multiplicadorTamanioFuente}rem`);
      backdropRef.style.setProperty('--spacing-base', `${$configuraciones.multiplicadorEspaciado}rem`);
    }

    if (modalRef) {
      modalRef.style.setProperty('--font-size-base', `${$configuraciones.multiplicadorTamanioFuente}rem`);
      modalRef.style.setProperty('--spacing-base', `${$configuraciones.multiplicadorEspaciado}rem`);
    }

    return () => {
      if (backdropRef) {
        backdropRef.style.removeProperty('--font-size-base');
        backdropRef.style.removeProperty('--spacing-base');
      }
      if (modalRef) {
        modalRef.style.removeProperty('--font-size-base');
        modalRef.style.removeProperty('--spacing-base');
      }
    };
  });
</script>

<!-- Detectamos eventos de teclado en toda la ventana -->
<svelte:window onkeydown={handleGlobalKeydown} />

<div class="modal-backdrop" bind:this={backdropRef} onclick={handleBackdropClick} role="presentation">
  <div 
    class="modal pattern-black" 
    bind:this={modalRef}
    onclick={handleModalClick}
    onkeydown={handleGlobalKeydown}
    role="dialog" 
    aria-modal="true" 
    aria-labelledby="modal-title" 
    tabindex="-1"
  >
    <button class="close-btn no-pictogram" onclick={handleClose} aria-label="Cerrar instrucciones" type="button">
      ×
      <span class="sr-only">cerrarInstrucciones</span>
    </button>
    
    <h2 id="modal-title" data-readable>Instrucciones del Modo Dibujo</h2>
    
    <div class="instrucciones-contenido">
      <!-- Carrusel de GIFs -->
      <div class="carrusel-container">
        <!-- Botón anterior -->
        <button 
          class="boton-carrusel pattern-green"
          onclick={gifAnterior}
          aria-label="GIF anterior (Flecha izquierda)"
          type="button"
        >
          ◀
          <span class="sr-only">gifAnterior (Flecha izquierda)</span>
        </button>

        <!-- Contenedor del GIF actual -->
        <div class="gif-wrapper">
          <img 
            src={gifsInstrucciones[indiceGifActual].src}
            alt="Instrucción {indiceGifActual + 1} de {gifsInstrucciones.length}"
            class="gif-instruccion"
          />
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <p class="descripcion-gif" bind:this={descripcionRef} data-readable tabindex="0">
            {gifsInstrucciones[indiceGifActual].descripcion}
          </p>
        </div>

        <!-- Botón siguiente -->
        <button 
          class="boton-carrusel pattern-green"
          onclick={gifSiguiente}
          aria-label="GIF siguiente (Flecha derecha)"
          type="button"
        >
          ▶
          <span class="sr-only">gifSiguiente (Flecha derecha)</span>
        </button>
      </div>

      <!-- Indicadores de posición -->
      <div class="indicadores">
        {#each gifsInstrucciones as _, index}
          <button
            class="indicador"
            class:activo={index === indiceGifActual}
            onclick={() => irAGif(index)}
            aria-label="Ir a instrucción {index + 1}"
            type="button"
          ></button>
        {/each}
      </div>

      <!-- Indicación de navegación por teclado -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <p class="ayuda-teclado" data-readable tabindex="0">
        Usa las flechas ← → del teclado para navegar
      </p>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.795);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50000000;
    filter: none !important;
  }
  
  .modal {
    background: var(--bg, #fff);
    border: 2px solid var(--icono-color-borde, #000000);
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: calc(var(--spacing-base, 1rem) * 1.5);
    width: 75vw;
    max-width: 1200px;
    max-height: 90vh;
    overflow-y: auto;
    text-align: center;
    position: relative;
  }
  
  .close-btn {
    position: absolute;
    top: 0.7rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: calc(var(--font-size-base, 1rem) * 1.5);
    color: var(--color-texto, #888);
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .close-btn:hover {
    color: var(--color-error, #f44336);
  }

  .no-pictogram {
    pointer-events: auto;
  }

  /* Clase para contenido solo visible para lectores de pantalla */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  h2 {
    margin: 0 0 1rem 0;
    font-size: calc(var(--font-size-base, 1rem) * 1.6);
    font-weight: 700;
    color: var(--color-texto, #000);
  }
  
  .instrucciones-contenido {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: calc(var(--spacing-base, 1rem) * 1);
  }

  .carrusel-container {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing-base, 1rem) * 1.5);
    justify-content: center;
    padding: 0 calc(var(--spacing-base, 1rem) * 1);
    width: 100%;
  }

  .boton-carrusel {
    background: var(--fondo-botones, #4CAF50);
    color: var(--icono-color-relleno, #000);
    border: 2px solid var(--icono-color-borde, #000);
    border-radius: 50%;
    width: 60px;
    height: 60px;
    font-size: calc(var(--font-size-base, 1rem) * 1.5);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .boton-carrusel:hover {
    background: var(--fondo-botones-hover, #45a049);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  }

  .boton-carrusel:active {
    transform: scale(0.95);
  }

  .boton-carrusel:focus {
    outline: var(--borde-botones, 4px solid #000000);
    outline-offset: 4px;
  }

  .gif-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: calc(var(--spacing-base, 1rem) * 1);
    max-width: 800px;
    width: 100%;
  }

  .gif-instruccion {
    width: 100%;
    height: auto;
    max-height: 50vh;
    object-fit: contain;
    border-radius: 12px;
    border: 3px solid var(--icono-color-borde, #ddd);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    background: var(--bg, #fff);
  }

  .descripcion-gif {
    text-align: center;
    font-size: calc(var(--font-size-base, 1rem) * 1.2);
    color: var(--color-texto, #333);
    line-height: 1.6;
    margin: 0;
    padding: 0 calc(var(--spacing-base, 1rem) * 1);
    font-weight: 600;
  }

  .indicadores {
    display: flex;
    gap: calc(var(--spacing-base, 1rem) * 0.75);
    justify-content: center;
    align-items: center;
    padding: calc(var(--spacing-base, 1rem) * 0.5) 0;
  }

  .indicador {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid var(--icono-color-borde, #4CAF50);
    background: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
  }

  .indicador:hover {
    transform: scale(1.2);
    background: var(--fondo-botones-hover, #45a049);
  }

  .indicador.activo {
    background: var(--fondo-botones, #4CAF50);
    transform: scale(1.3);
  }

  .ayuda-teclado {
    text-align: center;
    font-size: calc(var(--font-size-base, 1rem) * 0.95);
    color: var(--color-texto, #666);
    font-style: italic;
    padding: calc(var(--spacing-base, 1rem) * 0.5) 0;
    border-top: 2px dashed var(--icono-color-borde, #ddd);
    margin: calc(var(--spacing-base, 1rem) * 0.5) 0 0 0;
    width: 60%;
  }

  /* Responsividad */
  @media (max-width: 768px) {
    .modal {
      width: 95vw;
      padding: calc(var(--spacing-base, 1rem) * 1);
    }

    .carrusel-container {
      gap: calc(var(--spacing-base, 1rem) * 0.75);
    }

    .boton-carrusel {
      width: 45px;
      height: 45px;
      font-size: calc(var(--font-size-base, 1rem) * 1.2);
    }

    .gif-instruccion {
      max-height: 40vh;
    }

    .descripcion-gif {
      font-size: calc(var(--font-size-base, 1rem) * 1);
    }

    .ayuda-teclado {
      width: 80%;
    }
  }
</style>
