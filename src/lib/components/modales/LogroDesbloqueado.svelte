<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { configuraciones } from '$lib/stores/settings';
  import type { LogroDefinicion } from '$lib/db/schemas';
  import { audioStore } from '$lib/stores/audio';

  interface Props {
    logro?: LogroDefinicion | null;
  }

  let { logro = null }: Props = $props();

  const dispatch = createEventDispatcher();
  let modalRef = $state<HTMLElement | null>(null);
  let backdropRef = $state<HTMLElement | null>(null);

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

  // Aplicar modos de accesibilidad cuando se monta el modal
  onMount(() => {
    // Reproducir sonido de logro desbloqueado
    audioStore.playSound('achievement');
    
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
      // Delay mayor para evitar conflictos con narración de modal anterior
      if ($configuraciones.narrationEnabled) {
        // Primero detener cualquier narración en curso
        setTimeout(() => {
          // Forzar detención de narración anterior
          const stopEvent = new CustomEvent('read-modal');
          window.dispatchEvent(stopEvent);
          
          // Luego iniciar la narración de este modal
          setTimeout(() => {
            const readModalEvent = new CustomEvent('read-modal');
            window.dispatchEvent(readModalEvent);
          }, 100);
        }, 300);
      }
    }, 50);

    // Cleanup: restaurar scroll del body y app-main cuando el componente se desmonte
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

  // Sincronizar filtro de daltonismo/contraste con el modal (para que reciba la simulación aunque
  // el filtro global en .app-filtered-content se haya desactivado temporalmente).
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
    class="modal" 
    bind:this={modalRef}
    onclick={handleModalClick}
    onkeydown={handleGlobalKeydown}
    role="dialog" 
    aria-modal="true" 
    aria-labelledby="modal-title" 
    tabindex="-1"
  >
    <button class="close-btn no-pictogram" onclick={handleClose} aria-label="Cerrar modal" aria-hidden="true" type="button">×</button>
    
    <div class="celebration-container">
      <div class="sparkles" aria-hidden="true">✨</div>
      <div class="icon-container">
        <div class="icon-logro" aria-hidden="true">{logro?.icono || '🏆'}</div>
      </div> 
      <div class="sparkles" aria-hidden="true">✨</div>
    </div>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<h2 id="modal-title" data-readable tabindex="0">¡Logro Desbloqueado!</h2>

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <h3 class="logro-nombre" data-readable tabindex="0">{logro?.nombre}</h3>

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <p class="logro-descripcion" data-readable tabindex="0">{logro?.descripcion}</p>
    
    <button class="action-btn pattern-yellow" onclick={handleClose} data-readable> 
      ¡Continuar!
    </button>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50000000;
    animation: fadeIn 0.3s ease;
    filter: none !important;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .modal {
    background: var(--bg, #fff);
    border: 3px solid #FFD700;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 215, 0, 0.2);
    padding: calc(var(--spacing-base, 1rem) * 2.5) calc(var(--spacing-base, 1rem) * 2) calc(var(--spacing-base, 1rem) * 2) calc(var(--spacing-base, 1rem) * 2);
    min-width: 380px;
    max-width: 90vw;
    text-align: center;
    position: relative;
    animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes slideUp {
    from {
      transform: translateY(100px) scale(0.8);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
  
  .close-btn {
    position: absolute;
    top: 0.7rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--color-texto, #888);
    cursor: pointer;
    transition: transform 0.2s;
  }

  .close-btn:hover {
    transform: scale(1.2);
  }

  /* Excluir elementos del procesamiento de pictogramas */
  .no-pictogram,
  .icon-logro {
    pointer-events: auto;
  }

  .celebration-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: calc(var(--spacing-base, 1rem) * 1);
    margin-bottom: calc(var(--spacing-base, 1rem) * 1);
  }

  .sparkles {
    font-size: calc(var(--font-size-base, 1rem) * 2);
    animation: sparkle 1.5s infinite alternate;
  }

  .sparkles:first-child {
    animation-delay: 0.2s;
  }

  @keyframes sparkle {
    0%, 100% {
      transform: scale(1) rotate(0deg);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.3) rotate(180deg);
      opacity: 1;
    }
  }
  
  .icon-container {
    margin: 0;
  }
  
  .icon-logro {
    font-size: calc(var(--font-size-base, 1rem) * 5);
    display: inline-block;
    animation: bounce 1s infinite;
  }

  h2 { font-size: calc(var(--font-size-base, 1rem) * 2); }
  h3.logro-nombre { font-size: calc(var(--font-size-base, 1rem) * 1.4); margin: 0.5rem 0; }
  .logro-descripcion { font-size: calc(var(--font-size-base, 1rem) * 1.0); margin-bottom: calc(var(--spacing-base, 1rem) * 1); }
  .action-btn { padding: calc(var(--spacing-base, 1rem) * 1) calc(var(--spacing-base, 1rem) * 2); font-size: calc(var(--font-size-base, 1rem) * 1); border-radius: 12px; }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-10px) scale(1.1);
    }
  }
  
  h2 {
    margin: 1rem 0 0.5rem 0;
    font-size: 2.2rem;
    font-weight: 700;
    color: #FFD700;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  }

  .logro-nombre {
    margin: 0.5rem 0;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--color-texto, #333);
  }
  
  .logro-descripcion {
    font-size: 1.2rem;
    margin: 1rem 0 1.5rem 0;
    color: var(--color-texto, #555);
    line-height: 1.5;
  }
  
  .action-btn {
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    color: #000;
    border: none;
    border-radius: 8px;
    padding: 0.8rem 2.5rem;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  }
  
  .action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 215, 0, 0.6);
  }

  .action-btn:active {
    transform: translateY(0);
  }
</style>
