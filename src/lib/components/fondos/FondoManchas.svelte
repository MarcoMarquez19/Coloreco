<script>
	import Mancha from '$lib/components/iconos/Manchas.svelte';
	// Importamos el store para reactividad (opcional si usas las clases globales, 
	// pero buena práctica tenerlo si necesitas lógica futura)
	import { configuraciones } from '$lib/stores/settings';
</script>

<div class="contenedor-fondo">
	<div class="mancha noroeste pattern-yellow">
		<Mancha clase="mancha noroeste"/>
	</div>

	<div class="mancha noreste pattern-red">
		<Mancha clase="mancha noreste"/>
	</div>

	<div class="mancha sureste pattern-blue">
		<Mancha clase="mancha sureste"/>
	</div>

	<div class="mancha suroeste pattern-green">
		<Mancha clase="mancha suroeste"/>
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
		
		/* Importante: para que las manchas no generen scrollbars */
		overflow: hidden;
	}

	.mancha {
		position: absolute;
		/* Tamaño base de las manchas (ajustable) */
		width: 50vmin; /* 50% del lado más pequeño de la pantalla */
		height: 50vmin;
		
		/* Propiedades del SVG */
		fill: var(--color-relleno);
		stroke: var(--color-borde);
		stroke-linecap: round;
		stroke-linejoin: round;
		
		/* Animación suave si entras a la página */
		opacity: 0.8;
	}

	/* --- CORRECCIÓN DE TEXTURAS (Para que no sean cuadradas) --- */
	/* Esto recorta la textura (::after) en forma circular para que se ajuste mejor 
	   a la forma orgánica de la mancha y no se vea el cuadro del div.
	*/
	:global(.mancha.pattern-red::after),
	:global(.mancha.pattern-green::after),
	:global(.mancha.pattern-blue::after),
	:global(.mancha.pattern-yellow::after) {
		border-radius: 50%; /* Hace que la textura sea redonda */
		transform: scale(0.9); /* La encoge un poco para asegurar que quede dentro */
		opacity: 0.6; /* Hacemos la textura un poco más sutil en el fondo */
	}

	/* --- CONFIGURACIÓN DE CADA ESQUINA --- */

	/* 1. Arriba Izquierda: Azulado */
	.noroeste {
		top: -22vmin;  /* Se sale hacia arriba */
		left: -20vmin; /* Se sale hacia la izquierda */
        --color-relleno: #e9b870;
		--color-borde: #ff9800;
		transform: rotate(0deg); /* Posición original */
	}

	/* 2. Arriba Derecha: Rosado/Rojo */
	.noreste {
		top: -23.5vmin;
		right: -17vmin; /* Variable para que no sea simétrico */
		--color-relleno: #e4618d;
		--color-borde: #e91e63;
		transform: rotate(9deg); /* Rotamos para que se vea diferente */
	}

	/* 3. Abajo Derecha: Naranja/Amarillo */
	.sureste {
		bottom: -18vmin;
		right: -12.5vmin;
		--color-relleno: #5bb0f7;
		--color-borde: #2196f3;
		transform: rotate(180deg) scaleX(-1); /* Rotamos y volteamos */
	}

	/* 4. Abajo Izquierda: Verdoso */
	.suroeste {
		bottom: -15vmin;
		left: -20vmin;
		--color-relleno: #6fec73;
		--color-borde: #4caf50;
		transform: rotate(80deg);
	}
</style>