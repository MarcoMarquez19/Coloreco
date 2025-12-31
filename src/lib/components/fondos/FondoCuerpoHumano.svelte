<script lang="ts">
	import Cerebro from '$lib/components/iconos/Cerebro.svelte';
	import Corazon from '$lib/components/iconos/Corazon.svelte';
	import { configuraciones } from '$lib/stores/settings';
	let { style } = $props<{ style?: string }>();
</script>

<div class="contenedor-fondo" style={style}>
	<!-- Cerebro arriba izquierda -->
	<div class="icono noroeste cerebro pattern-yellow">
		<Cerebro clase="icono noroeste"/>
	</div>

	<!-- Corazón arriba derecha -->
	<div class="icono noreste corazon pattern-magenta">
		<Corazon clase="icono noreste"/>
	</div>

	<!-- Cerebro abajo derecha -->
	<div class="icono sureste cerebro pattern-blue">
		<Cerebro clase="icono sureste"/>
	</div>

	<!-- Corazón abajo izquierda -->
	<div class="icono suroeste corazon pattern-green">
		<Corazon clase="icono suroeste"/>
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
		
		/* Importante: para que los iconos no generen scrollbars */
		overflow: hidden;
	}

	.icono {
		position: absolute;
		/* Tamaño base de los iconos (un poco más pequeños que las manchas) */
		width: 45vmin; /* 45% del lado más pequeño de la pantalla */
		height: 45vmin;
		
		/* Propiedades del SVG */
		color: var(--color-relleno);
		
		/* Animación suave si entras a la página */
		opacity: 0.8;
	}

	/* IMPORTANTE: Forzar que los iconos siempre usen position: absolute
	   incluso cuando se apliquen las clases de pattern */
	:global(.icono.pattern-magenta),
	:global(.icono.pattern-green),
	:global(.icono.pattern-blue),
	:global(.icono.pattern-yellow) {
		position: absolute !important;
	}

	/* --- CORRECCIÓN DE TEXTURAS (Para que no sean cuadradas) --- */
	:global(.icono.pattern-magenta::after),
	:global(.icono.pattern-green::after),
	:global(.icono.pattern-blue::after),
	:global(.icono.pattern-yellow::after) {
		border-radius: 50%; /* Hace que la textura sea redonda */
		transform: scale(0.9); /* La encoge un poco para asegurar que quede dentro */
		opacity: 0.6; /* Hacemos la textura un poco más sutil en el fondo */
	}

	/* --- CONFIGURACIÓN DE CADA ESQUINA --- */

	/* 1. Arriba Izquierda: Cerebro Amarillo */
	.noroeste {
		top: -18vmin;  /* Se sale hacia arriba */
		left: -18vmin; /* Se sale hacia la izquierda */
		--color-relleno: #e9b870;
		--color-borde: #ff9800;
		transform: rotate(-15deg); /* Ligera rotación */
	}

	/* 2. Arriba Derecha: Corazón Rosado */
	.noreste {
		top: -20vmin;
		right: -15vmin;
		--color-relleno: #e4618d;
		--color-borde: #e91e63;
		transform: rotate(15deg);
	}

	/* 3. Abajo Derecha: Cerebro Azul */
	.sureste {
		bottom: -16vmin;
		right: -14vmin;
		--color-relleno: #5bb0f7;
		--color-borde: #2196f3;
		transform: rotate(10deg);
	}

	/* 4. Abajo Izquierda: Corazón Verde */
	.suroeste {
		bottom: -19vmin;
		left: -17vmin;
		--color-relleno: #6fec73;
		--color-borde: #4caf50;
		transform: rotate(-20deg);
	}

	/* Estilos específicos para cerebros */
	.cerebro {
		/* Los cerebros pueden ser ligeramente más grandes */
		width: 48vmin;
		height: 48vmin;
	}

	/* Estilos específicos para corazones */
	.corazon {
		/* Los corazones pueden tener un efecto de latido sutil */
		animation: latido 3s ease-in-out infinite;
	}

	@keyframes latido {
		0%, 100% {
			transform: scale(1) rotate(var(--rotacion-base, 0deg));
		}
		50% {
			transform: scale(1.05) rotate(var(--rotacion-base, 0deg));
		}
	}

	/* Aplicar rotación base a cada corazón */
	.corazon.noreste {
		--rotacion-base: 15deg;
	}

	.corazon.suroeste {
		--rotacion-base: -20deg;
	}
</style>
