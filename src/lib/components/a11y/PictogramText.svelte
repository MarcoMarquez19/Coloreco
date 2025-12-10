<script lang="ts">
	import { applyPictograms } from '$lib/a11y/pictograms';

	export let text: string = '';
	export let showIcons: boolean = true;

	let processedHTML: string = '';

	$: {
		if (text) {
			processedHTML = showIcons ? applyPictograms(text) : text;
		}
	}
</script>

<div class="pictogram-text" class:icons-enabled={showIcons}>
	{@html processedHTML}
</div>

<style>
	.pictogram-text {
		font-size: inherit;
		line-height: 2;
	}

	.pictogram-text :global(.word-with-pictogram) {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		margin: 0 0.2rem;
		padding: 0.2rem 0.4rem;
		border-radius: 6px;
		background: var(--surface, #f5f5f5);
		transition: all 0.2s ease;
	}

	.pictogram-text :global(.word-with-pictogram:hover) {
		background: var(--surface-hover, #e8e8e8);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.pictogram-text :global(.pictogram-icon) {
		font-size: 1.5em;
		line-height: 1;
		display: inline-block;
	}

	.pictogram-text :global(.pictogram-word) {
		font-weight: 500;
	}

	.pictogram-text.icons-enabled :global(.pictogram-icon) {
		animation: pop-in 0.3s ease;
	}

	@keyframes pop-in {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}
</style>
