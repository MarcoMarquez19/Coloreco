<script lang="ts">
	import { onMount } from 'svelte';
	import { applyBionic, applyBionicBySyllable } from '$lib/juegos/modos/historias/bionic';

	export let text: string = '';
	export let mode: 'character' | 'syllable' = 'character';
	export let intensity: number = 0.5;

	let bionicHTML: string = '';

	$: {
		if (text) {
			bionicHTML = mode === 'syllable' 
				? applyBionicBySyllable(text)
				: applyBionic(text, intensity);
		}
	}
</script>

<div class="bionic-text">
	{@html bionicHTML}
</div>

<style>
	.bionic-text {
		font-size: inherit;
		line-height: inherit;
	}

	.bionic-text :global(.bionic-word) {
		font-weight: 700;
		color: var(--bionic-highlight-color, #0b6efd);
	}

	.bionic-text :global(.bionic-rest) {
		font-weight: 400;
		color: inherit;
	}
</style>
