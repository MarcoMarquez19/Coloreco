<script lang="ts">
    import CuerpoHumano from '$lib/components/iconos/CuerpoHumano.png';
    import LogrosViewer from '$lib/components/logros/LogrosViewer.svelte';

    // Tamaño de la imagen decorativa (ajustable)
    let tamañoImagen = '20rem';
</script>

<img 
    src={CuerpoHumano} 
    alt="Cuerpo humano"
    class="imagen-decorativa"
    style="width: {tamañoImagen};"
>

<LogrosViewer categoria="cuerpoHumano" tituloSeccion="Logros de cuerpo humano" />

<style>
    .imagen-decorativa {
        position: fixed;
        top: clamp(-6rem, -20vh, 2rem);
        right: clamp(-6rem, -20vw, -5rem);
        height: auto;
        z-index: 10;
        filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
        pointer-events: none;
    }
</style>
