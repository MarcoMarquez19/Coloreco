<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { configuraciones } from '$lib/stores/settings';
  import Teclado from '$lib/components/iconos/Teclado.svelte';
  import Mouse from '$lib/components/iconos/Mouse.svelte';

  const dispatch = createEventDispatcher();
  let modalRef = $state<HTMLElement | null>(null);

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
      handleClose();
    }
  }

  let backdropRef = $state<HTMLElement | null>(null);

  // Aplicar modos de accesibilidad cuando se monta el modal
  onMount(() => {
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';

    // Prevenir scroll del contenedor principal (.app-main)
    const appMain = document.querySelector('.app-main') as HTMLElement;
    if (appMain) {
      appMain.style.overflow = 'hidden';
    }

    // Mover el backdrop al body para evitar que herede contextos del padre
    if (backdropRef && backdropRef.parentElement !== document.body) {
      document.body.appendChild(backdropRef);
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
      if (backdropRef && document.body.contains(backdropRef)) {
        document.body.removeChild(backdropRef);
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
    class="modal" 
    bind:this={modalRef}
    onclick={handleModalClick}
    onkeydown={handleGlobalKeydown}
    role="dialog" 
    aria-modal="true" 
    aria-labelledby="modal-title" 
    tabindex="-1"
  >
    <button class="close-btn no-pictogram" onclick={handleClose} aria-label="Cerrar instrucciones" type="button">×</button>
    
    <h2 id="modal-title" data-readable>Instrucciones</h2>
    
    <div class="instrucciones-contenido">
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <p data-readable tabindex="0">Navega entre las opciones disponibles con el ratón</p>
      
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
    padding: calc(var(--spacing-base, 1rem) * 2.5) calc(var(--spacing-base, 1rem) * 2) calc(var(--spacing-base, 1rem) * 2) calc(var(--spacing-base, 1rem) * 2);
    min-width: 380px;
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
    font-size: calc(var(--font-size-base, 1rem) * 1.5);
    color: var(--color-texto, #888);
    cursor: pointer;
  }

  .no-pictogram {
    pointer-events: auto;
  }
  
  h2 {
    margin: 0 0 1.5rem 0;
    font-size: calc(var(--font-size-base, 1rem) * 2);
    font-weight: 700;
    color: var(--color-texto, #000);
  }
  
  .instrucciones-contenido {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .instrucciones-contenido p {
    font-size: calc(var(--font-size-base, 1rem) * 1.1);
    color: var(--color-texto, #222);
    margin: 0.2rem 0;
  }

  .icono-mouse {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0.3rem 0;
  }

  .teclado-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0.3rem 0;
    min-height: 100px;
    width: 100%;
  }
</style>
