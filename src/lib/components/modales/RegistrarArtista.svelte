<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';

    // Creamos el despachador de eventos para comunicarnos con el padre
    const dispatch = createEventDispatcher();

    let inputElement: HTMLInputElement | null = null;
    let nombre = '';
    const maxCaracteres = 7;

    // Función vacía para programar la lógica más tarde
    function accionAlDarEnter() {
        console.log("Acción ejecutada: " + nombre);
        // Aquí ira la logica de registro
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
        if (inputElement) inputElement.focus();
    });

    // Cierra el modal si se hace click fuera de la caja modal
    function handleBackdropClick() {
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
        <p>Presiona fuera de esta área para salir</p>
        <input 
            bind:this={inputElement}
            bind:value={nombre}
            type="text" 
            placeholder="Ingresa tu nombre" 
            maxlength={maxCaracteres}
            on:input={handleInput}
            on:keydown={handleInputKeydown}
        />
        <div class="contador-caracteres">
            {maxCaracteres - nombre.length} caracteres restantes
        </div>
        <div class="mensaje-enter">
            Presiona <b>ENTER</b> para agregar el nuevo artista
        </div>
    </div>
</div>


<style>
    .mensaje-enter {
        margin-top: 0.3rem;
        font-size: 0.98rem;
        color: #2b8aef;
        text-align: right;
    }
    .contador-caracteres {
        margin-top: 0.5rem;
        font-size: 1rem;
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