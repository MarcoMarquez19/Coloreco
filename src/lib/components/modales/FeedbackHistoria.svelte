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
      handleClose();
    }
  }

  // Aplicar modos de accesibilidad cuando se monta el modal
  onMount(() => {
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
    
    // Prevenir scroll del contenedor principal (.app-main)
    const appMain = document.querySelector('.app-main') as HTMLElement;
    if (appMain) {
      appMain.style.overflow = 'hidden';
    }

    // Mover el backdrop al body para evitar que herede contextos de apilamiento/transform del padre
    const prevParent = backdropRef?.parentElement ?? null;
    const nextSibling = backdropRef?.nextSibling ?? null;
    if (backdropRef && backdropRef.parentElement !== document.body) {
      document.body.appendChild(backdropRef);
    }

    // Disparar un evento personalizado para que el layout procese el modal
    setTimeout(() => {
      const event = new CustomEvent('modal-mounted');
      window.dispatchEvent(event);
      
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
      if (backdropRef && document.body.contains(backdropRef)) {
        document.body.removeChild(backdropRef);
        // No reinsertemos automáticamente — el componente se desmonta de todas formas
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
    data-magnificable
  >
    <button class="close-btn no-pictogram" onclick={handleClose} aria-label="Cerrar modal" aria-hidden="true" tabindex="-1">×</button>
    <div class="icon-container" data-magnificable>
      {#if correct}
        <div class="icon success" aria-hidden="true">✔</div>
      {:else}
        <div class="icon error" aria-hidden="true">✖</div>
      {/if}
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <h2 id="modal-title" data-magnificable data-readable tabindex="0">{correct ? '¡Muy bien!' : '¡Oh no!'}</h2>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <p class="main-msg" data-magnificable data-readable tabindex="0">La respuesta es {correct ? 'correcta.' : 'incorrecta.'}</p>
    {#if correct}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <p class="detalle" data-magnificable data-readable tabindex="0">{mensaje}</p>
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <p class="detalle" data-magnificable data-readable tabindex="0">Pista: {pista}</p>
    {/if}
    <button class="action-btn" onclick={handleClose} data-magnificable data-readable>
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
    padding: 2.5rem 2rem 2rem 2rem;
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
    font-size: 3.5rem;
    display: inline-block;
    border-radius: 50%;
    width: 70px;
    height: 70px;
    line-height: 70px;
    margin-bottom: 0.5rem;
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
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-texto, #333);
  }
  
  .main-msg {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: var(--color-texto, #222);
  }
  
  .detalle {
    font-size: 1.1rem;
    margin-bottom: 1.2rem;
    color: var(--color-texto, #222);
  }
  
  .action-btn {
    background: #2eaf6a;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.7rem 2.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .action-btn:hover {
    background: #249a5a;
  }
</style>
