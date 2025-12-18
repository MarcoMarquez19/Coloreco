<script lang="ts">
	import Lazos from '$lib/components/iconos/Lazos.svelte';
	import { configuraciones } from '$lib/stores/settings';
	let { style } = $props<{ style?: string }>();
</script>

<div class="contenedor-fondo" style={style}>
	<!-- Lazito superior izquierdo -->
	<div class="lazo noroeste pattern-lazo-izq">
		<Lazos clase="lazo noroeste pattern-lazo-izq"/>
	</div>

	<!-- Lazito superior derecho -->
	<div class="lazo noreste pattern-lazo-der">
		<Lazos clase="lazo noreste pattern-lazo-der"/>
	</div>
</div>

<style>
	.contenedor-fondo {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: var(--bg, transparent);
		
		/* Enviar al fondo */
		z-index: -1;
		
		/* Evitar interacción con el mouse */
		pointer-events: none;
		
		/* Importante: para que los lazos no generen scrollbars */
		overflow: hidden;
	}

	.lazo {
		position: absolute;
		/* Tamaño de los lazos */
		width: 25vmin;
		height: 25vmin;
		
		/* Propiedades visuales */
		opacity: 0.85;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
	}

	svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	/* --- CONFIGURACIÓN DE CADA ESQUINA --- */

	/* Arriba Izquierda */
	.noroeste {
		top: -5vmin;
		left: -3vmin;
		--color-relleno: #a73a18;
		--color-detalle: #000000;
		--color-borde: #8b2f14;
		transform: rotate(0deg);
	}

	/* Arriba Derecha */
	.noreste {
		top: -5vmin;
		right: -3vmin;
		--color-relleno: #a73a18;
		--color-detalle: #000000;
		--color-borde: #8b2f14;
		transform: scaleX(-1) rotate(0deg);
	}
</style>
