<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import {crearArtista,cambiarArtista} from '$lib/db/artistas.service';
    import { audioStore } from '$lib/stores/audio';
    import { configuraciones } from '$lib/stores/settings';

    // Creamos el despachador de eventos para comunicarnos con el padre
    const dispatch = createEventDispatcher();

    let inputElement: HTMLInputElement | null = null;
    let nombre = '';
    const maxCaracteres = 7;

    // Función vacía para programar la lógica más tarde
    async function accionAlDarEnter() {
        if (nombre.trim() === '') return;
        
        audioStore.playSound('success');
        const id = await crearArtista(nombre);
        cambiarArtista(id);
    }

    // Limita el input a 7 caracteres
    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.value.length > maxCaracteres) {
            target.value = target.value.slice(0, maxCaracteres);
        }
        nombre = target.value;
    }

    // Maneja el ENTER específicamente en el input
    function handleInputKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            accionAlDarEnter();
            dispatch('close');
        }
    }

    // Maneja la tecla Q globalmente para cerrar el modal
    function handleGlobalKeydown(event: KeyboardEvent) {
        if (event.key === 'q' || event.key === 'Q') {
            dispatch('close');
        }
    }

    // Usabilidad: Enfocar el input automáticamente al abrir el modal
    onMount(() => {
        let blockedElements: Array<{element: HTMLElement, originalTabIndex: string | null}> = [];
        
        // Bloquear todos los elementos tabulables excepto el modal y controles permitidos
        const allowedIds = ['narration-controls-container', 'floating-back-button', 'floating-settings-button', 'floating-instructions-button'];
        const tabbableElements = document.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        tabbableElements.forEach((element) => {
            // No bloquear si el elemento está dentro del backdrop del modal
            const backdrop = document.querySelector('.backdrop');
            if (backdrop?.contains(element)) {
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
        
        // Disparar evento personalizado para que el layout procese el modal
        setTimeout(() => {
            const event = new CustomEvent('modal-mounted');
            window.dispatchEvent(event);
            
            // Si la narración está activada, iniciar lectura automática del modal
            if ($configuraciones.narrationEnabled) {
                setTimeout(() => {
                    const readModalEvent = new CustomEvent('read-modal');
                    window.dispatchEvent(readModalEvent);
                }, 200);
            } else {
                // Solo enfocar el input si la narración NO está activada
                if (inputElement) inputElement.focus();
            }
        }, 50);
        
        // Cleanup: Restaurar interacción con contenido de fondo
        return () => {
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

    // Cierra el modal si se hace click fuera de la caja modal
    function handleBackdropClick() {
        audioStore.playSound('click');
        dispatch('close');
    }

    // Accesibilidad: Permitir cerrar modal con Enter o Espacio en el backdrop
    function handleBackdropKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            dispatch('close');
        }
    }

    // Accesibilidad: Evitar propagación de teclas en el modal principal
    function handleModalKeydown(event: KeyboardEvent) {
        event.stopPropagation();
    }
</script>

<!-- Detectamos eventos de teclado en toda la ventana -->
<svelte:window on:keydown={handleGlobalKeydown} />

<!-- Contenedor del fondo oscuro (Backdrop) -->
<div class="backdrop" role="presentation" on:click={handleBackdropClick} on:keydown={handleBackdropKeydown}>
    <!-- Contenedor del Modal -->
    <div class="modal-box" aria-label="Modal para registrar un nuevo artista" role="dialog" tabindex="0" on:click|stopPropagation on:keydown={handleModalKeydown}>
        <p data-readable>Presiona fuera de esta área para salir</p>
        <label for="nombre-artista" class="sr-only">Ingresa tu nombre</label>
        <input 
            id="nombre-artista"
            bind:this={inputElement}
            bind:value={nombre}
            type="text" 
            placeholder="Ingresa tu nombre" 
            maxlength={maxCaracteres}
            on:input={handleInput}
            on:keydown={handleInputKeydown}
            aria-label="Ingresa tu nombre de artista"
            aria-hidden="true"
        />
        <div class="contador-caracteres" aria-hidden="true">
            {maxCaracteres - nombre.length} caracteres restantes
        </div>
        <div class="mensaje-enter" data-readable>
            Presiona <b>ENTER</b> para agregar el nuevo artista
        </div>
    </div>
</div>


<style>
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
    
    .mensaje-enter {
        margin-top: calc(var(--spacing-base, 1rem) * 1);
        font-size: calc(var(--font-size-base, 1rem) * 1);
        color: #2b8aef;
        text-align: right;
        font-weight: 600;
    }
    .contador-caracteres {
        margin-top: calc(var(--spacing-base, 1rem) * 0.6);
        font-size: calc(var(--font-size-base, 1rem) * 1);
        color: #555;    
        text-align: right;
    }
    /* El fondo oscuro que cubre toda la pantalla */
    .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.795);
        display: flex;
        justify-content: center; 
        align-items: center; 
        z-index: 50000000;
    }

    /* La caja central */
    .modal-box {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px; 
        min-height: 10vh;
    }

    p {
        color: #000000;
        margin-top: 0;
        margin-bottom: calc(var(--spacing-base,1rem)*2);
        font-size: calc(var(--font-size-base, 1rem) * 1.2);
        font-weight: bold;
    }

    /* Estilo del input */
    input {
        width: 100%;
        padding: 1rem;
        font-size: calc(var(--font-size-base, 1rem) * 1.4);
        border: 1px solid #ccc;
        border-radius: 4px;
        outline: none;
        box-sizing: border-box; 
    }

    input:focus {
        border-color: #333;
        box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
    }
</style>