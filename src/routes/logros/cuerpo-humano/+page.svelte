<script lang="ts">
    import CuerpoHumano from '$lib/components/iconos/CuerpoHumano.png';
    import LogrosViewer from '$lib/components/logros/LogrosViewer.svelte';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    onMount(() => {
        const handlePopState = (event: PopStateEvent) => {
			event.preventDefault();
			goto('/logros');
		};
		window.addEventListener('popstate', handlePopState);
		
		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
    });
    
    // Tamaño de la imagen decorativa (ajustable)
    let tamañoImagen = '20rem';
</script>

<LogrosViewer categoria="cuerpoHumano" tituloSeccion="Logros de cuerpo humano" />
