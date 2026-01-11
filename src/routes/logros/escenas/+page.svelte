<script lang="ts">
    import LibroDibujo from '$lib/components/iconos/LibroDibujo.png';
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

<img 
    src={LibroDibujo} 
    alt="Libro de dibujo"
    class="imagen-decorativa"
    style="width: {tamañoImagen};"
>

<LogrosViewer categoria="dibujo" tituloSeccion="Logros de escenas" />

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
