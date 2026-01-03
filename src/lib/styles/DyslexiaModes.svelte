<style>
	/* =========================================
	   MODOS DE ACCESIBILIDAD PARA DISLEXIA
	   Modo Biónico, Modo Rima, Modo Pictográfico y Modo Narración
	   ========================================= */

	/* =========================================
	   MODO BIÓNICO
	   ========================================= */

	/* Estilos para el resaltado biónico */
	:global(.bionic-highlight) {
		font-weight: 700;
	}

	:global(.bionic-rest) {
		font-weight: 400;
	}

	/* =========================================
	   MODO RIMA
	   ========================================= */

	/* Estilos para el resaltado de rimas */
	:global(.rhyme-highlight) {
		border-radius: 2px;
		padding: 0;
	}

	/* =========================================
	   MODO PICTOGRÁFICO CON POPOVER
	   ========================================= */

	/* Wrapper para posicionamiento del popover */
	:global(.pictogram-wrapper) {
		position: relative;
		display: inline-block;
		z-index: 1;
	}

	/* Wrapper activo (con popover visible) debe estar encima de todo */
	:global(.pictogram-wrapper:has(.pictogram-popover.visible)) {
		z-index: 1000000;
	}

    	/* Asegurar que los contenedores padres no corten los pictogramas */
	:global([data-pictogram="true"] .texto-historia),
	:global([data-pictogram="true"] p),
	:global([data-pictogram="true"] .imagen-principal-contenedor),
	:global([data-pictogram="true"] .contenido-historia),
	:global([data-pictogram="true"] .historia-texto) {
		overflow: visible !important;
	}

	/* Palabra con pictograma disponible - marcador de esquina */
	:global(.pictogram-word) {
		position: relative;
		display: inline-block;
		background: none;
		border: none;
		padding: 0 2px 0 0; /* Padding mínimo */
		font: inherit;
		color: inherit;
		cursor: help;
		border-radius: 0;
		transition: all 0.2s ease;
		outline-offset: 2px;
		z-index: auto;
	}

	/* Marcador de esquina estilo "dog-ear" - versión compacta */
	:global(.pictogram-word::after) {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 0 6px 6px 0;
		border-color: transparent #0b6efd transparent transparent;
		opacity: 0.85;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		pointer-events: none;
	}

	/* Marcador en modo noche */
	:global([data-theme="dark"] .pictogram-word::after),
	:global([data-theme="dark-inverted"] .pictogram-word::after) {
		border-color: transparent #4d9fff transparent transparent;
	}

	:global(.pictogram-word:hover),
	:global(.pictogram-word:focus) {
		background: rgba(11, 110, 253, 0.08);
		outline: 2px solid #0b6efd;
		border-radius: 2px;
	}

	:global(.pictogram-word:hover::after),
	:global(.pictogram-word:focus::after) {
		opacity: 1;
		border-width: 0 7px 7px 0;
		border-color: transparent #0952c7 transparent transparent;
	}

	/* Hover en modo noche */
	:global([data-theme="dark"] .pictogram-word:hover::after),
	:global([data-theme="dark"] .pictogram-word:focus::after),
	:global([data-theme="dark-inverted"] .pictogram-word:hover::after),
	:global([data-theme="dark-inverted"] .pictogram-word:focus::after) {
		border-width: 0 7px 7px 0;
		border-color: transparent #6bb0ff transparent transparent;
	}

	/* Popover emergente - oculto por defecto */
	:global(.pictogram-popover) {
		position: absolute;
		bottom: auto;
		top: auto;
		left: 50%;
		transform: translateX(-50%) translateY(-100%) translateY(-10px) scale(0.8);
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transition: none;
		
		background: white;
		border: 3px solid #0b6efd;
		border-radius: 12px;
		padding: 8px;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.05);
		z-index: 999999;
		
		min-width: 50px;
		min-height: 50px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		
		/* Asegurar que se renderice por encima de todo */
		isolation: isolate;
		will-change: transform, opacity;
	}

	/* Flecha del popover (arriba por defecto) */
	:global(.pictogram-popover::after) {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 8px solid transparent;
		border-top-color: #0b6efd;
	}

	/* Popover cuando se abre hacia abajo */
	:global(.pictogram-popover.popover-below) {
		transform: translateX(-50%) translateY(45px) scale(0.8);
	}

	:global(.pictogram-popover.popover-below::after) {
		top: auto;
		bottom: 100%;
		border-top-color: transparent;
		border-bottom-color: #0b6efd;
	}

	/* Estado visible */
	:global(.pictogram-popover.visible) {
		opacity: 1;
		visibility: visible;
		transform: translateX(-50%) translateY(-100%) translateY(-10px) scale(1);
		pointer-events: auto;
	}

	:global(.pictogram-popover.visible.popover-below) {
		transform: translateX(-50%) translateY(45px) scale(1);
	}

	/* Icono del pictograma */
	:global(.pictogram-popover .pictogram-icon) {
		font-size: 2em;
		line-height: 1;
		display: block;
	}

	/* Adaptación para modo noche */
	:global([data-theme="dark"] .pictogram-popover) {
		background: #1a1a1a;
		border-color: #4d9fff;
	}

	:global([data-theme="dark"] .pictogram-popover::after) {
		border-top-color: #4d9fff;
	}

	:global([data-theme="dark"] .pictogram-popover.popover-below::after) {
		border-top-color: transparent;
		border-bottom-color: #4d9fff;
	}

	:global([data-theme="dark"] .pictogram-word) {
		border-bottom-color: #90CAF9;
	}

	:global([data-theme="dark"] .pictogram-word:hover),
	:global([data-theme="dark"] .pictogram-word:focus) {
		border-bottom-color: #64B5F6;
		background: rgba(144, 202, 249, 0.1);
		outline-color: #90CAF9;
	}

	/* Animación de entrada */
	:global(.pictogram-popover.visible) {
		animation: bounce-in-above 0.3s ease;
	}

	:global(.pictogram-popover.visible.popover-below) {
		animation: bounce-in-below 0.3s ease;
	}

	@keyframes bounce-in-above {
		0% {
			transform: translateX(-50%) translateY(-100%) translateY(-10px) scale(0);
			opacity: 0;
		}
		50% {
			transform: translateX(-50%) translateY(-100%) translateY(-15px) scale(1.1);
		}
		100% {
			transform: translateX(-50%) translateY(-100%) translateY(-10px) scale(1);
			opacity: 1;
		}
	}

	@keyframes bounce-in-below {
		0% {
			transform: translateX(-50%) translateY(45px) scale(0);
			opacity: 0;
		}
		50% {
			transform: translateX(-50%) translateY(45px) scale(1.1);
		}
		100% {
			transform: translateX(-50%) translateY(45px) scale(1);
			opacity: 1;
		}
	}

	/* Accesibilidad: reducción de movimiento */
	@media (prefers-reduced-motion: reduce) {
		:global(.pictogram-popover) {
			transition: opacity 0.1s;
		}
		
		:global(.pictogram-popover.visible) {
			animation: none;
		}
	}
</style>
