<script lang="ts">
    import CuerpoHumano from '$lib/components/iconos/CuerpoHumano.png';
    import LogrosViewer from '$lib/components/logros/LogrosViewer.svelte';
    import FondoCuerpoHumano from '$lib/components/fondos/FondoCuerpoHumano.svelte';

    // Tamaño de la imagen decorativa (ajustable)
    let tamañoImagen = '20rem';
</script>

<FondoCuerpoHumano />

<LogrosViewer categoria="cuerpoHumano" tituloSeccion="Logros de cuerpo humano" />
