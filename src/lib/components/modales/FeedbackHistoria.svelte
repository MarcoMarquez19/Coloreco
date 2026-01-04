<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { configuraciones } from '$lib/stores/settings';

  interface Props {
    correct?: boolean;
    mensaje?: string;
    pista?: string;
  }

  let { correct = false, mensaje = '', pista = '' }: Props = $props();

  const dispatch = createEventDispatcher();
  let modalRef = $state<HTMLElement | null>(null);
  let backdropRef = $state<HTMLElement | null>(null);

  function handleClose() {
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

  // Aplicar filtro de daltonismo/contraste al propio modal (para que reciba la simulación aun cuando
  // el filtro global en .app-filtered-content se desactive temporalmente).
  $effect(() => {
    const filtro = `${$configuraciones.colorBlindness !== 'none' ? 'url(#cvd-filter)' : ''} ${$configuraciones.contrast === 'high' ? 'url(#smart-contrast-filter)' : ''}`.trim();
    if (modalRef) {
      modalRef.style.filter = filtro;
      modalRef.style.transition = 'filter 150ms ease';
    }

    // Restaurar al desmontar
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
    <div class="icon-container">
      {#if correct}
        <div class="icon success" aria-hidden="true">✔</div>
      {:else}
        <div class="icon error" aria-hidden="true">✖</div>
      {/if}
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <h2 id="modal-title" data-readable tabindex="0">{correct ? '¡Muy bien!' : '¡Oh no!'}</h2>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <p class="main-msg" data-readable tabindex="0">La respuesta es {correct ? 'correcta.' : 'incorrecta.'}</p>
    {#if correct}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <p class="detalle" data-readable tabindex="0">{mensaje}</p>
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <p class="detalle" data-readable tabindex="0">Pista: {pista}</p>
    {/if}
    <button class="action-btn" onclick={handleClose} data-readable>
      {correct ? 'Continuar' : 'Reintentar'}
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
    padding: calc(var(--spacing-base, 1rem) * 2.5) calc(var(--spacing-base, 1rem) * 2) calc(var(--spacing-base, 1rem) * 2) calc(var(--spacing-base, 1rem) * 2);
    min-width: 320px;
    max-width: 90vw;
    text-align: center;
    position: relative;
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
  }

  /* Excluir elementos del procesamiento de pictogramas */
  .no-pictogram,
  .icon {
    pointer-events: auto;
  }
  
  .icon-container {
    margin-bottom: 0.5rem;
  }
  
  .icon {
    font-size: calc(var(--font-size-base, 1rem) * 3.5);
    display: inline-block;
    border-radius: 50%;
    width: calc(var(--font-size-base, 1rem) * 4.5);
    height: calc(var(--font-size-base, 1rem) * 4.5);
    line-height: calc(var(--font-size-base, 1rem) * 4.5);
    margin-bottom: calc(var(--spacing-base, 1rem) * 0.5);
  }
  
  .icon.success {
    background: #e6f9ed;
    color: #2eaf6a;
    border: 2px solid #2eaf6a;
  }
  
  .icon.error {
    background: #ffeaea;
    color: #e74c3c;
    border: 2px solid #e74c3c;
  }
  
  h2 {
    margin: 0.5rem 0 0.2rem 0;
    font-size: calc(var(--font-size-base, 1rem) * 2);
    font-weight: 700;
    color: var(--color-texto, #333);
  }
  
  .main-msg {
    font-size: calc(var(--font-size-base, 1rem) * 1.2);
    margin-bottom: calc(var(--spacing-base, 1rem) * 0.5);
    color: var(--color-texto, #222);
  }
  
  .detalle {
    font-size: calc(var(--font-size-base, 1rem) * 1.1);
    margin-bottom: calc(var(--spacing-base, 1rem) * 1.2);
    color: var(--color-texto, #222);
  }
  
  .action-btn {
    background: #2eaf6a;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: calc(var(--spacing-base, 1rem) * 0.7) calc(var(--spacing-base, 1rem) * 2.5);
    font-size: calc(var(--font-size-base, 1rem) * 1.1);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .action-btn:hover {
    background: #249a5a;
  }
</style>
