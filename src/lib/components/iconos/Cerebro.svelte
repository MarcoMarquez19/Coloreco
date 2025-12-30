<script lang="ts">
	let { clase = '' } = $props<{ clase?: string }>();
</script>

<svg 
	class={clase}
	viewBox="0 0 200 200" 
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<!-- Cerebro con estilo amigable para niños -->
	<g>
		<!-- Lado izquierdo del cerebro -->
		<path
			d="M 60 80 
			   C 45 80, 35 90, 35 105
			   C 35 115, 40 125, 45 130
			   C 40 135, 38 142, 40 150
			   C 42 158, 48 165, 55 168
			   C 55 175, 58 182, 65 185
			   C 72 188, 82 188, 88 185
			   C 88 188, 92 190, 100 190"
			fill="currentColor"
			stroke="var(--color-borde, currentColor)"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		
		<!-- Lado derecho del cerebro -->
		<path
			d="M 140 80
			   C 155 80, 165 90, 165 105
			   C 165 115, 160 125, 155 130
			   C 160 135, 162 142, 160 150
			   C 158 158, 152 165, 145 168
			   C 145 175, 142 182, 135 185
			   C 128 188, 118 188, 112 185
			   C 112 188, 108 190, 100 190"
			fill="currentColor"
			stroke="var(--color-borde, currentColor)"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		
		<!-- Línea central divisoria -->
		<path
			d="M 100 80 L 100 190"
			fill="none"
			stroke="var(--color-borde, currentColor)"
			stroke-width="2"
			stroke-linecap="round"
		/>
		
		<!-- Curvas internas izquierda -->
		<path
			d="M 55 100 C 65 95, 75 95, 85 100"
			fill="none"
			stroke="var(--color-borde, currentColor)"
			stroke-width="2"
			stroke-linecap="round"
		/>
		<path
			d="M 50 125 C 60 120, 70 120, 80 125"
			fill="none"
			stroke="var(--color-borde, currentColor)"
			stroke-width="2"
			stroke-linecap="round"
		/>
		<path
			d="M 55 150 C 65 145, 75 145, 85 150"
			fill="none"
			stroke="var(--color-borde, currentColor)"
			stroke-width="2"
			stroke-linecap="round"
		/>
		
		<!-- Curvas internas derecha -->
		<path
			d="M 145 100 C 135 95, 125 95, 115 100"
			fill="none"
			stroke="var(--color-borde, currentColor)"
			stroke-width="2"
			stroke-linecap="round"
		/>
		<path
			d="M 150 125 C 140 120, 130 120, 120 125"
			fill="none"
			stroke="var(--color-borde, currentColor)"
			stroke-width="2"
			stroke-linecap="round"
		/>
		<path
			d="M 145 150 C 135 145, 125 145, 115 150"
			fill="none"
			stroke="var(--color-borde, currentColor)"
			stroke-width="2"
			stroke-linecap="round"
		/>
		
		<!-- Círculos decorativos (neuronas) -->
		<circle cx="70" cy="110" r="4" fill="var(--color-borde, currentColor)" />
		<circle cx="130" cy="110" r="4" fill="var(--color-borde, currentColor)" />
		<circle cx="65" cy="140" r="4" fill="var(--color-borde, currentColor)" />
		<circle cx="135" cy="140" r="4" fill="var(--color-borde, currentColor)" />
	</g>
</svg>

<style>
	svg {
		width: 100%;
		height: 100%;
	}
</style>
