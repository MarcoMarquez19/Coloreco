<script lang="ts">
	import { detectRhymes, applyRhymeHighlight, applySyllableColors } from '$lib/juegos/modos/historias/rhyme';

	export let text: string = '';
	export let mode: 'rhyme' | 'syllable' = 'rhyme';

	let processedHTML: string = '';

	$: {
		if (text) {
			if (mode === 'rhyme') {
				const patterns = detectRhymes(text);
				processedHTML = applyRhymeHighlight(text, patterns);
			} else {
				// Modo sílaba: procesar palabra por palabra
				const words = text.split(/(\s+|[.,;:!?¿¡()])/);
				processedHTML = words
					.map((word) => {
						if (/^\s+$/.test(word) || /^[.,;:!?¿¡()]$/.test(word)) {
							return word;
						}
						return applySyllableColors(word);
					})
					.join('');
			}
		}
	}
</script>

<div class="rhyme-text" class:syllable-mode={mode === 'syllable'}>
	{@html processedHTML}
</div>

<style>
	.rhyme-text {
		font-size: inherit;
		line-height: 1.8;
	}

	.rhyme-text :global(.rhyme-word) {
		font-weight: 600;
		padding: 0.1rem 0.3rem;
		border-radius: 4px;
		background-color: var(--rhyme-color);
		color: #fff;
		margin: 0 0.1rem;
		display: inline-block;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.rhyme-text.syllable-mode :global(.syllable) {
		font-weight: 500;
		padding: 0.1rem 0.2rem;
		border-radius: 3px;
		background-color: var(--syllable-color);
		color: #fff;
		margin: 0 0.05rem;
		display: inline-block;
	}
</style>
