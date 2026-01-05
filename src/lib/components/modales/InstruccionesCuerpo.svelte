<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { configuraciones } from '$lib/stores/settings';
  import Teclado from '$lib/components/iconos/Teclado.svelte';
  import Mouse from '$lib/components/iconos/Mouse.svelte';
  import { audioStore } from '$lib/stores/audio';

  const dispatch = createEventDispatcher();
  let modalRef = $state<HTMLElement | null>(null);

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

  // Maneja la tecla Escape globalmente para cerrar el modal
  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      handleClose();
    }
  }

  let backdropRef = $state<HTMLElement | null>(null);

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
  // en el backdrop y en el modal para que sigan aplicándose aunque el backdrop
  // se mueva al <body> y deje de heredar las variables del layout.
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
    <button class="close-btn no-pictogram" onclick={handleClose} aria-label="Cerrar instrucciones" aria-hidden="true" type="button">×</button>
    
    <h2 id="modal-title" data-readable>Instrucciones</h2>
    
    <div class="instrucciones-contenido">
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <p data-readable tabindex="0">Navega entre las escenas con el ratón</p>
      
      <div class="icono-mouse" aria-hidden="true">
        <Mouse />
      </div>
      
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <p data-readable tabindex="0">o con las flechas del teclado</p>
      
      <div class="teclado-container" aria-hidden="true">
        <Teclado />
      </div>
      
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <p data-readable tabindex="0">y presiona ENTER para seleccionar</p>

      <div class="separador"></div>

      <!-- Instrucciones específicas del juego de cuerpo humano -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <p data-readable tabindex="0" class="instruccion-destacada">En el juego:</p>
      
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <p data-readable tabindex="0">Arrastra y suelta las partes del cuerpo</p>
      
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <p data-readable tabindex="0">para colocar el nombre en el lugar indicado</p>

      <div class="icono-drag-drop" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
          <path d="M9 3L5 7h3v8H5l4 4 4-4h-3V7h3L9 3zm5 18l4-4h-3V9h3l-4-4-4 4h3v8h-3l4 4z"/>
        </svg>
      </div>
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
    padding: calc(var(--spacing-base, 1rem) * 1.5) calc(var(--spacing-base, 1rem) * 1.5) calc(var(--spacing-base, 1rem) * 1.5) calc(var(--spacing-base, 1rem) * 1.5);
    min-width: 320px;
    max-width: 90vw;
    max-height: 85vh;
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
  }

  .no-pictogram {
    pointer-events: auto;
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
    gap: 0.3rem;
  }

  .instrucciones-contenido p {
    font-size: calc(var(--font-size-base, 1rem) * 1);
    color: var(--color-texto, #222);
    margin: 0.1rem 0;
  }

  .instruccion-destacada {
    font-weight: 600;
    font-size: calc(var(--font-size-base, 1rem) * 1.1) !important;
    margin-top: 0.3rem !important;
    color: var(--color-texto, #000);
  }

  .separador {
    width: 60%;
    height: 2px;
    background: var(--icono-color-borde, #ccc);
    margin: 0.6rem 0;
  }

  .icono-mouse {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0.2rem 0;
    transform: scale(0.8);
  }

  .teclado-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0.2rem 0;
    min-height: 70px;
    width: 100%;
    transform: scale(0.8);
  }

  .icono-drag-drop {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0.3rem 0;
    color: var(--icono-color-relleno, #333);
  }

  .icono-drag-drop svg {
    width: 48px;
    height: 48px;
  }
</style>
