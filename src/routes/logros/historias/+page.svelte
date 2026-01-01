<script lang="ts">
    import LibroHistorias from '$lib/components/iconos/LibroAbierto.png';
    import LogrosViewer from '$lib/components/logros/LogrosViewer.svelte';

    // Tamaño de la imagen decorativa (ajustable)
    let tamañoImagen = '20rem'; // Puedes cambiar este valor: '8rem', '12rem', etc.
</script>

<img 
    src={LibroHistorias} 
    alt="Libro de historias"
    class="imagen-decorativa"
    style="width: {tamañoImagen};"
>

<LogrosViewer categoria="historias" tituloSeccion="Logros de historias" />

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