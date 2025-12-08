<script>
	// Si quisieras pasar un color de fondo base específico por prop, podrías hacerlo aquí.
	// Por defecto usará var(--bg) o transparente.
</script>

<div class="contenedor-fondo">
	<!-- 
		Usamos el mismo SVG 4 veces. 
		La magia ocurre en el CSS con las clases específicas (.noroeste, .noreste, etc.)
		que cambian el color, la rotación y la posición.
	-->

	<!-- Esquina Superior Izquierda -->
	<svg class="mancha noroeste" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
		<path d="M45.7,-76.3C58.9,-69.3,69.1,-55.5,77.3,-40.8C85.5,-26.1,91.6,-10.5,89.6,4.1C87.6,18.7,77.4,32.3,66.6,44.2C55.8,56.1,44.4,66.3,31.4,72.4C18.4,78.5,3.8,80.5,-9.8,78.2C-23.4,75.9,-36.1,69.3,-47.9,60.8C-59.7,52.3,-70.7,41.9,-77.2,29.1C-83.7,16.3,-85.7,1.1,-82.1,-12.6C-78.5,-26.3,-69.3,-38.5,-57.8,-46.4C-46.3,-54.3,-32.5,-57.9,-19.1,-63.9C-5.7,-69.9,7.3,-78.3,21.5,-79.8C35.7,-81.3,51.1,-75.9,45.7,-76.3Z" transform="translate(100 100)" />
	</svg>

	<!-- Esquina Superior Derecha -->
	<svg class="mancha noreste" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
		<path d="M45.7,-76.3C58.9,-69.3,69.1,-55.5,77.3,-40.8C85.5,-26.1,91.6,-10.5,89.6,4.1C87.6,18.7,77.4,32.3,66.6,44.2C55.8,56.1,44.4,66.3,31.4,72.4C18.4,78.5,3.8,80.5,-9.8,78.2C-23.4,75.9,-36.1,69.3,-47.9,60.8C-59.7,52.3,-70.7,41.9,-77.2,29.1C-83.7,16.3,-85.7,1.1,-82.1,-12.6C-78.5,-26.3,-69.3,-38.5,-57.8,-46.4C-46.3,-54.3,-32.5,-57.9,-19.1,-63.9C-5.7,-69.9,7.3,-78.3,21.5,-79.8C35.7,-81.3,51.1,-75.9,45.7,-76.3Z" transform="translate(100 100)" />
	</svg>

	<!-- Esquina Inferior Derecha -->
	<svg class="mancha sureste" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
		<path d="M45.7,-76.3C58.9,-69.3,69.1,-55.5,77.3,-40.8C85.5,-26.1,91.6,-10.5,89.6,4.1C87.6,18.7,77.4,32.3,66.6,44.2C55.8,56.1,44.4,66.3,31.4,72.4C18.4,78.5,3.8,80.5,-9.8,78.2C-23.4,75.9,-36.1,69.3,-47.9,60.8C-59.7,52.3,-70.7,41.9,-77.2,29.1C-83.7,16.3,-85.7,1.1,-82.1,-12.6C-78.5,-26.3,-69.3,-38.5,-57.8,-46.4C-46.3,-54.3,-32.5,-57.9,-19.1,-63.9C-5.7,-69.9,7.3,-78.3,21.5,-79.8C35.7,-81.3,51.1,-75.9,45.7,-76.3Z" transform="translate(100 100)" />
	</svg>

	<!-- Esquina Inferior Izquierda -->
	<svg class="mancha suroeste" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
		<path d="M45.7,-76.3C58.9,-69.3,69.1,-55.5,77.3,-40.8C85.5,-26.1,91.6,-10.5,89.6,4.1C87.6,18.7,77.4,32.3,66.6,44.2C55.8,56.1,44.4,66.3,31.4,72.4C18.4,78.5,3.8,80.5,-9.8,78.2C-23.4,75.9,-36.1,69.3,-47.9,60.8C-59.7,52.3,-70.7,41.9,-77.2,29.1C-83.7,16.3,-85.7,1.1,-82.1,-12.6C-78.5,-26.3,-69.3,-38.5,-57.8,-46.4C-46.3,-54.3,-32.5,-57.9,-19.1,-63.9C-5.7,-69.9,7.3,-78.3,21.5,-79.8C35.7,-81.3,51.1,-75.9,45.7,-76.3Z" transform="translate(100 100)" />
	</svg>
</div>

<style>
	.contenedor-fondo {
		/* Posición fija ocupando toda la pantalla */
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		
		/* Respetamos la variable --bg definida globalmente, o usamos transparente */
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
		stroke-width: 4px; /* Grosor del borde */
		stroke-linecap: round;
		stroke-linejoin: round;
		
		/* Animación suave si entras a la página */
		opacity: 0.8;
	}

	/* --- CONFIGURACIÓN DE CADA ESQUINA --- */

	/* 1. Arriba Izquierda: Azulado */
	.noroeste {
		top: -15vmin;  /* Se sale hacia arriba */
		left: -15vmin; /* Se sale hacia la izquierda */
        --color-relleno: #fff3e0;
		--color-borde: #ff9800;
		transform: rotate(0deg); /* Posición original */
	}

	/* 2. Arriba Derecha: Rosado/Rojo */
	.noreste {
		top: -20vmin;
		right: -10vmin; /* Variable para que no sea simétrico */
		--color-relleno: #fce4ec;
		--color-borde: #e91e63;
		transform: rotate(90deg); /* Rotamos para que se vea diferente */
	}

	/* 3. Abajo Derecha: Naranja/Amarillo */
	.sureste {
		bottom: -15vmin;
		right: -15vmin;
		--color-relleno: #e3f2fd;
		--color-borde: #2196f3;
		transform: rotate(180deg) scaleX(-1); /* Rotamos y volteamos */
	}

	/* 4. Abajo Izquierda: Verdoso */
	.suroeste {
		bottom: -10vmin;
		left: -20vmin;
		--color-relleno: #e8f5e9;
		--color-borde: #4caf50;
		transform: rotate(-90deg);
	}
</style>