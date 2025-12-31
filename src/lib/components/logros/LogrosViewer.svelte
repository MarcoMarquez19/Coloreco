<script lang="ts">
    import Trofeo from '$lib/components/iconos/Trofeo.svelte';
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import { afterNavigate } from '$app/navigation';
    import { obtenerArtistaActivo } from '$lib/db/artistas.service';
    import { obtenerLogrosArtista, obtenerDefinicionesLogrosJSON } from '$lib/db/logros.service';
    import { estadisticasLogros, cargarLogrosArtista } from '$lib/stores/logros';

    // Props
    interface Props {
        categoria: 'historias' | 'dibujo' | 'cuerpoHumano';
        tituloSeccion: string;
    }

    let { categoria, tituloSeccion }: Props = $props();

    // Props para controlar el trofeo dinámicamente
    let rangoTrofeo = $state<'oro' | 'plata' | 'bronce' | null>(null);
    let textoRango = $state('...');

    // Sistema de logros con información real
    interface LogroDisplay {
        codigo: string;
        titulo: string;
        descripcion: string;
        icono: string;
        desbloqueado: boolean;
        fechaDesbloqueo?: Date;
    }

    let logrosDisplay = $state<LogroDisplay[]>([]);

    let logroActualIndex = $state(0);
    let artistaId = $state<number | null>(null);
    let cargando = $state(true);

    // Animación de carrusel: clase temporal y duración accesible
    let animClass = $state<string>('');
    const CAROUSEL_ANIM_DURATION = 700; // ms, velocidad moderada
    let animTimer: ReturnType<typeof setTimeout> | null = null;

    function logroAnterior() {
        if (logrosDisplay.length === 0) return;
        const prevIndex = (logrosDisplay.length === 0) ? 0 : (logroActualIndex - 1 + logrosDisplay.length) % logrosDisplay.length;
        animClass = 'slide-left';
        if (animTimer) { clearTimeout(animTimer); animTimer = null; }
        logroActualIndex = prevIndex;
        animTimer = setTimeout(() => { animClass = ''; animTimer = null; }, CAROUSEL_ANIM_DURATION);
    }

    function logroSiguiente() {
        if (logrosDisplay.length === 0) return;
        const nextIndex = (logrosDisplay.length === 0) ? 0 : (logroActualIndex + 1) % logrosDisplay.length;
        animClass = 'slide-right';
        if (animTimer) { clearTimeout(animTimer); animTimer = null; }
        logroActualIndex = nextIndex;
        animTimer = setTimeout(() => { animClass = ''; animTimer = null; }, CAROUSEL_ANIM_DURATION);
    }

    // Cargar logros del artista
    async function cargarLogros() {
        try {
            const artista = await obtenerArtistaActivo();
            if (!artista || !artista.id) {
                console.error('No hay artista activo');
                return;
            }
            
            artistaId = artista.id;
            
            // Cargar logros en el store (esto actualiza estadisticasLogros automáticamente)
            await cargarLogrosArtista(artista.id);
            
            // Cargar definiciones de logros desde JSON
            const definicionesLogros = await obtenerDefinicionesLogrosJSON(categoria);
            
            if (!definicionesLogros || definicionesLogros.length === 0) {
                console.error('No se pudieron cargar las definiciones de logros');
                return;
            }
            
            // Cargar logros desbloqueados del artista
            const logrosArtista = await obtenerLogrosArtista(artista.id);
            
            // Crear logrosDisplay desde las definiciones JSON
            logrosDisplay = definicionesLogros.map(defLogro => {
                const logroData = logrosArtista.find(
                    (la) => la.definicion.codigo === defLogro.codigo
                );
                
                return {
                    codigo: defLogro.codigo,
                    titulo: defLogro.nombre,
                    descripcion: defLogro.descripcion,
                    icono: defLogro.icono,
                    desbloqueado: logroData?.estado?.desbloqueado ?? false,
                    fechaDesbloqueo: logroData?.estado?.fechaDesbloqueo
                };
            });
            
            // El rango se actualiza automáticamente por el $effect que escucha estadisticasLogros
        } catch (error) {
            console.error('Error cargando logros:', error);
        } finally {
            cargando = false;
        }
    }

    // Navegación con teclado
    function manejarTecla(event: KeyboardEvent) {
        if (event.key === 'ArrowLeft') {
            logroAnterior();
        } else if (event.key === 'ArrowRight') {
            logroSiguiente();
        }
    }

    let contenedorLogrosRef: HTMLElement | null = null;

    /** Calcula y aplica la escala según la altura de la ventana (máx 1080px) */
    function actualizarEscala(): void {
        if (!contenedorLogrosRef) return;
        const maxHeight = 1080; // referencia 1080p
        const rawScale = window.innerHeight / maxHeight;
        // limitar entre 0.6 y 1 para evitar escalados excesivos
        const scale = Math.max(0.6, Math.min(1, rawScale));
        contenedorLogrosRef.style.transform = `scale(${scale})`;
        contenedorLogrosRef.style.transformOrigin = 'top center';
    }

    onMount(() => {
        document.body.style.overflow = 'hidden';
        
        // Cargar logros
        cargarLogros();
        
        // Agregar listener para teclas
        window.addEventListener('keydown', manejarTecla);
        
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', manejarTecla);
        };
    });

    // Recargar cuando se navega de vuelta a esta página
    afterNavigate(async () => {
        if (artistaId) {
            await cargarLogrosArtista(artistaId);
        }
    });

    // Reaccionar a cambios en estadísticas de logros para actualizar rango
    $effect(() => {
        const stats = $estadisticasLogros;
        
        if (stats.rango === 'oro') {
            rangoTrofeo = 'oro';
            textoRango = 'Oro';
        } else if (stats.rango === 'plata') {
            rangoTrofeo = 'plata';
            textoRango = 'Plata';
        } else if (stats.rango === 'bronce') {
            rangoTrofeo = 'bronce';
            textoRango = 'Bronce';
        } else {
            rangoTrofeo = null;
            textoRango = 'Sin Rango';
        }
    });

    $effect(() => {
        actualizarEscala();
        window.addEventListener('resize', actualizarEscala);
        return () => {
            window.removeEventListener('resize', actualizarEscala);
            if (contenedorLogrosRef) {
                contenedorLogrosRef.style.transform = '';
                contenedorLogrosRef.style.transformOrigin = '';
                contenedorLogrosRef.style.margin = '';
            }
        };
    })
</script>

<div class="seleccionar-logros-contenedor" bind:this={contenedorLogrosRef} aria-label="Contenedor de logros de {categoria}" data-magnificable>
    <h1>Rango General</h1>
    
    <div class="trofeo-contenedor">
        <div class="trofeo-con-texto">
            <div class="trofeo-wrapper" data-tipo-trofeo={rangoTrofeo}>
                <Trofeo/>
            </div>
            <p class="texto-trofeo" data-tipo-trofeo={rangoTrofeo} aria-label="Tu rango actual es {textoRango}">{textoRango}</p>
        </div>
    </div>

    <h2 class="titulo-logro">{tituloSeccion}</h2>

    {#if cargando}
        <div class="mensaje-carga">
            <p>Cargando logros...</p>
        </div>
    {:else if logrosDisplay.length === 0}
        <div class="mensaje-error">
            <p>No se pudieron cargar los logros. Por favor, recarga la página.</p>
        </div>
    {:else}
    <div class="navegacion-logros">
        <button 
            class="boton-flecha boton-izquierda" 
            onclick={logroAnterior}
            aria-label="Logro anterior"
            title="Ver logro anterior (←)"
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
                width="62"
                height="62"
            >
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
        </button>

        {#key logroActualIndex}
        <article 
            class={"tarjeta-logro " + animClass} 
            class:desbloqueado={logrosDisplay[logroActualIndex]?.desbloqueado}
            aria-label="{logrosDisplay[logroActualIndex]?.titulo || 'Cargando'}. {logrosDisplay[logroActualIndex]?.descripcion || 'Espera un momento'}. Estado: {logrosDisplay[logroActualIndex]?.desbloqueado ? 'Desbloqueado' : 'Bloqueado'}"
            in:fly={{ x: animClass === 'slide-right' ? 300 : animClass === 'slide-left' ? -300 : 0, duration: CAROUSEL_ANIM_DURATION }}
        >

            <div class="icono-logro" aria-hidden="true">{logrosDisplay[logroActualIndex]?.icono || '🏆'}</div>
            <h3 id={"titulo-logro-" + logroActualIndex} class="titulo-logro-individual">{logrosDisplay[logroActualIndex]?.titulo || 'Cargando...'}</h3>
            <p class="descripcion-logro">{logrosDisplay[logroActualIndex]?.descripcion || 'Espera un momento...'}</p>
            <div class="estado-logro" aria-hidden="true">
                <p>
                {#if logrosDisplay[logroActualIndex]?.desbloqueado}
                    <span class="badge desbloqueado">✓ Desbloqueado</span>
                {:else}
                    <span class="badge bloqueado">🔒 Bloqueado</span>
                {/if}
                </p>
            </div>
        </article>
        {/key}

        <button 
            class="boton-flecha boton-derecha" 
            onclick={logroSiguiente}
            aria-label="Logro siguiente"
            title="Ver siguiente logro (→)"
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
                width="62"
                height="62"
            >
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
        </button>
    </div>
    {/if}
</div>

<style>
    .seleccionar-logros-contenedor {
        margin: 1vh auto 0;
        background: transparent;
        z-index: 1;
        max-width: 1080px;
        width: 100%;
        text-align: center;
        align-items: center;
        justify-content: flex-start;
        display: flex;
        flex-direction: column;
    }
    h1 {
        font-size: calc(var(--font-size-base, 1rem) * 2.5);
        margin: 0 0 calc(var(--spacing-base, 1rem) * 0.25) 0; /* menos espacio inferior */
        padding: 0;
        font-weight: 600;
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.1);
        word-spacing: calc(var(--spacing-base, 1rem) * 0.2);
    }

    h1:focus {
        outline: 2px solid #0066cc;
        outline-offset: 4px;
        border-radius: 4px;
    }

    .trofeo-contenedor {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: calc(var(--spacing-base, 1rem) * 0.25);
        margin-bottom: calc(var(--spacing-base, 1rem) * 0.25);
        width: 100%;
    }

    .trofeo-con-texto {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: calc(var(--spacing-base, 1rem) * 0.1); /* aún más juntos sin pegarse del todo */
    }

    .trofeo-wrapper {
        width: calc(var(--font-size-base, 1rem) * 10);
        height: calc(var(--font-size-base, 1rem) * 10);
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    }

    .trofeo-wrapper :global(svg) {
        /* Aplicar directamente stroke/fill desde variables de tema o del trofeo para evitar referencias circulares */
        stroke: var(--trofeo-color-borde, var(--icono-color-borde, #B8860B));
        fill: var(--trofeo-color-relleno, var(--icono-color-relleno, #FFD700));
    }

    /* Colores de trofeo según el rango */
    .trofeo-wrapper[data-tipo-trofeo="oro"] :global(svg) {
        --trofeo-color-borde: #B8860B;
        --trofeo-color-relleno: #FFD700;
    }

    .trofeo-wrapper[data-tipo-trofeo="plata"] :global(svg) {
        --trofeo-color-borde: #888888;
        --trofeo-color-relleno: #C0C0C0;
    }

    .trofeo-wrapper[data-tipo-trofeo="bronce"] :global(svg) {
        --trofeo-color-borde: #804A00;
        --trofeo-color-relleno: #CD7F32;
    }

    /* Forzar stroke/fill en el PATH (importante) para que los atributos inline no impidan el override */
    :global(.trofeo-wrapper[data-tipo-trofeo="oro"] svg path) {
        stroke: var(--trofeo-color-borde, #B8860B);
        fill: var(--trofeo-color-relleno, #FFD700);
    }

    :global(.trofeo-wrapper[data-tipo-trofeo="plata"] svg path) {
        stroke: var(--trofeo-color-borde, #888888);
        fill: var(--trofeo-color-relleno, #C0C0C0);
    }

    :global(.trofeo-wrapper[data-tipo-trofeo="bronce"] svg path) {
        stroke: var(--trofeo-color-borde, #804A00);
        fill: var(--trofeo-color-relleno, #CD7F32);
    }

    /* Sin rango - borde según tema, sin relleno */
    :global(.trofeo-wrapper[data-tipo-trofeo="null"] svg path),
    :global(.trofeo-wrapper:not([data-tipo-trofeo="oro"]):not([data-tipo-trofeo="plata"]):not([data-tipo-trofeo="bronce"]) svg path) {
        stroke: var(--icono-color-borde, #000000); /* forzar stroke desde la variable del tema (blanco en dark) */
        fill: transparent !important; /* asegurarse de que no haya relleno */
    }

    .texto-trofeo {
        margin: 0;
        font-size: calc(var(--font-size-base, 1rem) * 2);
        font-weight: 600;
        color: var(--trofeo-texto-color, #FFD700);
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.05);
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .texto-trofeo:focus {
        outline: 2px solid #0066cc;
        outline-offset: 4px;
        border-radius: 4px;
    }

    /* Colores de texto según el rango */
    .texto-trofeo[data-tipo-trofeo="oro"] {
        --trofeo-texto-color: #FFD700;
        color: var(--trofeo-texto-color);
    }

    .texto-trofeo[data-tipo-trofeo="plata"] {
        --trofeo-texto-color: #C0C0C0;
        color: var(--trofeo-texto-color);
    }

    .texto-trofeo[data-tipo-trofeo="bronce"] {
        --trofeo-texto-color: #CD7F32;
        color: var(--trofeo-texto-color);
    }

    /* Sin rango - texto gris */
    .texto-trofeo[data-tipo-trofeo="null"],
    .texto-trofeo:not([data-tipo-trofeo="oro"]):not([data-tipo-trofeo="plata"]):not([data-tipo-trofeo="bronce"]) {
        --trofeo-texto-color: var(--text-secondary, #666666); /* usar color secundario del tema para sin rango */
        color: var(--trofeo-texto-color);
    }

    .titulo-logro {
        font-size: calc(var(--font-size-base, 1rem) * 2);
        font-weight: 600;
        margin: calc(var(--spacing-base, 1rem) * 0.5) 0 calc(var(--spacing-base, 1rem) * 0.25) 0; /* más cerca del trofeo */
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.05);
    }

    .navegacion-logros {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: calc(var(--font-size-base, 1rem) * 5.5);
        width: 100%;
        margin: 1rem 0; /* menos espacio entre tarjeta y elementos superiores/inferiores */
    }

    .boton-flecha {
        background: var(--fondo-botones, #ffca00);
        color: var(--icono-color-relleno, black);
        border: none;
        border-radius: var(--border-radius, 8px);
        cursor: pointer;
        box-shadow: var(--sombra-botones, 0 6px 18px rgba(0, 0, 0, 0.3));
        transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 140px;
        min-height: 140px;
    }

    .boton-flecha:hover {
        background: var(--fondo-botones-hover, #d1a700);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
    }

    .boton-flecha:active {
        transform: translateY(0);
    }

    .boton-flecha:focus {
        outline: var(--borde-botones, 4px solid #000000);
        background: var(--fondo-botones-hover, #d1a700);
        outline-offset: 7px;
    }

    .boton-flecha svg {
        width: calc(var(--font-size-base,1rem)*6);
        height: calc(var(--font-size-base,1rem)*6);
        pointer-events: none;
    }

    .tarjeta-logro {
        background: var(--surface, white); /* usar variable de tema para soportar modo oscuro */
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        transition: transform 0.3s, box-shadow 0.3s;
        flex: 1;
        min-width: 40vw; /* más ancho para más texto horizontal */
        max-width: 60vw; /* permitir crecer en pantallas grandes */
        padding: calc(var(--spacing-base, 1rem) * 0.75); /* menos padding vertical */
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: calc(var(--spacing-base, 1rem) * 0.5); /* reducir gap para menor altura */
        border: 2px solid var(--icono-color-borde, #000000);
        min-height: calc(var(--font-size-base, 1rem) * 8); /* menos altura */
    }
    .tarjeta-logro:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
    }

    :global([data-theme="dark"]) .tarjeta-logro {
        background: var(--bg, #0a0a0a); /* fondo oscuro en modo dark */
        border-color: var(--icono-color-borde, #f5f5f5); /* borde claro en dark */
        box-shadow: 0 4px 16px rgba(255, 255, 255, 0.03);
    }

@media (max-width: 768px) {
    .navegacion-logros {
        padding: 0 1rem;
        gap: 1rem;
    }

    .boton-flecha {
        min-width: 60px;
        min-height: 60px;
        padding: 1rem;
    }

    .boton-flecha svg {
        width: 32px;
        height: 32px;
    }

    .tarjeta-logro {
        max-width: 90%;
        min-width: auto;
        padding: calc(var(--spacing-base, 1rem) * 0.75);
        min-height: calc(var(--font-size-base, 1rem) * 8);
    }
    .icono-logro {
        font-size: calc(var(--font-size-base, 1rem) * 4);
    }
}

@media (max-width: 480px) {
    .navegacion-logros { gap: 0.5rem; }
    .boton-flecha { min-width: 50px; min-height: 50px; padding: 0.75rem; }
    .boton-flecha svg { width: 24px; height: 24px; }
}

/* Animaciones de entrada para simular movimiento de carrusel */
@keyframes slideInFromRight {
	from { transform: translateX(30%); opacity: 0; }
	to   { transform: translateX(0);   opacity: 1; }
}

@keyframes slideInFromLeft {
	from { transform: translateX(-30%); opacity: 0; }
	to   { transform: translateX(0);     opacity: 1; }
}

.slide-right {
	animation: slideInFromRight 700ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
}

.slide-left {
	animation: slideInFromLeft 700ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
}

/* Respetar preferencias de reducción de movimiento */
@media (prefers-reduced-motion: reduce) {
	.slide-right,
	.slide-left {
		animation: none !important;
		transition: none !important;
	}
}

    .icono-logro {
        font-size: calc(var(--font-size-base, 1rem) * 6);
        line-height: 1;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
    }

    .titulo-logro-individual {
        margin: 0;
        font-size: calc(var(--font-size-base, 1rem) * 2.2);
        font-weight: 700;
        color: var(--color-texto, #333);
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.03);
    }

    .descripcion-logro {
        margin: 0;
        font-size: calc(var(--font-size-base, 1rem) * 1.5);
        font-weight: 500;
        color: var(--color-texto, #333); /* usar mismo color que el título del logro */
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.02);
    }

    .estado-logro {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: calc(var(--spacing-base, 1rem) * 0.5);
        margin-top: calc(var(--spacing-base, 1rem) * 0.5);
    }

    .badge {
        padding: calc(var(--spacing-base, 1rem) * 0.5) calc(var(--spacing-base, 1rem) * 1);
        border-radius: calc(var(--border-radius, 8px) * 0.5);
        font-size: calc(var(--font-size-base, 1rem) * 1.2);
        font-weight: 600;
        letter-spacing: calc(var(--spacing-base, 1rem) * 0.02);
    }

    .badge.desbloqueado {
        background: #4caf50;
        color: white;
    }

    .badge.bloqueado {
        background: #9e9e9e;
        color: white;
    }

    .tarjeta-logro:not(.desbloqueado) {
        opacity: 0.6;
        filter: grayscale(0.5);
    }

    .tarjeta-logro.desbloqueado {
        border-color: #4caf50;
        box-shadow: 0 8px 24px rgba(76, 175, 80, 0.3);
    }

    .mensaje-carga,
    .mensaje-error {
        padding: calc(var(--spacing-base, 1rem) * 2);
        text-align: center;
        font-size: calc(var(--font-size-base, 1rem) * 1.2);
        color: var(--color-texto, #333);
    }

    .mensaje-error {
        color: var(--color-error, #d32f2f);
    }

    /* Clase para texto solo para lectores de pantalla */
    .solo-lectores {
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
</style>
