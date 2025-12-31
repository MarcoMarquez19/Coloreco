<script lang="ts">
	let { clase = '' } = $props<{ clase?: string }>();
</script>

<svg 
	class={clase}
	viewBox="0 0 200 200" 
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<!-- Corazón con estilo amigable para niños -->
	<g>
		<!-- Corazón principal -->
		<path
			d="M 100 160
			   L 60 120
			   C 50 110, 45 95, 50 80
			   C 55 65, 70 55, 85 60
			   C 92 62, 97 68, 100 75
			   C 103 68, 108 62, 115 60
			   C 130 55, 145 65, 150 80
			   C 155 95, 150 110, 140 120
			   L 100 160 Z"
			fill="currentColor"
			stroke="var(--color-borde, currentColor)"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		
		<!-- Brillo/Reflejo -->
		<ellipse
			cx="80"
			cy="85"
			rx="12"
			ry="18"
			fill="white"
			opacity="0.3"
		/>
		
		<!-- Líneas decorativas internas -->
		<path
			d="M 100 95 C 90 105, 80 110, 70 115"
			fill="none"
			stroke="var(--color-borde, currentColor)"
			stroke-width="2"
			stroke-linecap="round"
			opacity="0.5"
		/>
		<path
			d="M 100 95 C 110 105, 120 110, 130 115"
			fill="none"
			stroke="var(--color-borde, currentColor)"
			stroke-width="2"
			stroke-linecap="round"
			opacity="0.5"
		/>
		
		<!-- Pequeñas decoraciones (latidos) -->
		<circle cx="65" cy="100" r="3" fill="var(--color-borde, currentColor)" opacity="0.6" />
		<circle cx="135" cy="100" r="3" fill="var(--color-borde, currentColor)" opacity="0.6" />
		<circle cx="100" cy="130" r="3" fill="var(--color-borde, currentColor)" opacity="0.6" />
	</g>
</svg>

<style>
	svg {
		width: 100%;
		height: 100%;
	}
</style>
