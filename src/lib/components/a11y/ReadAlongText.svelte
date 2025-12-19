<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { ttsService, type WordEvent } from '$lib/audio/tts.service';

	export let text: string = '';
	export let autoplay: boolean = false;
	export let rate: number = 1;
	export let highlightColor: string = '#FFE66D';

	let words: string[] = [];
	let activeWordIndex: number = -1;
	let isPlaying: boolean = false;
	let unsubscribe: (() => void) | null = null;

	$: {
		if (text) {
			words = text.split(/\s+/);
		}
	}

	onMount(() => {
		if (autoplay && text) {
			play();
		}
	});

	onDestroy(() => {
		cleanup();
	});

	function play(): void {
		if (!text) return;

		isPlaying = true;
		activeWordIndex = 0;

		// Registrar callback de palabra
		unsubscribe = ttsService.onWord((event: WordEvent) => {
			// Encontrar índice de palabra
			const wordIndex = findWordIndex(event.charIndex);
			activeWordIndex = wordIndex;
		});

		// Iniciar TTS
		ttsService.speak(text, { rate, lang: 'es-ES' });
	}

	function pause(): void {
		ttsService.pause();
		isPlaying = false;
	}

	function resume(): void {
		ttsService.resume();
		isPlaying = true;
	}

	function stop(): void {
		ttsService.stop();
		cleanup();
	}

	function cleanup(): void {
		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}
		isPlaying = false;
		activeWordIndex = -1;
	}

	function findWordIndex(charIndex: number): number {
		let currentIndex = 0;
		
		for (let i = 0; i < words.length; i++) {
			const wordLength = words[i].length;
			
			if (charIndex >= currentIndex && charIndex < currentIndex + wordLength) {
				return i;
			}
			
			currentIndex += wordLength + 1; // +1 for space
		}
		
		return -1;
	}
</script>

<div class="read-along-container">
	<div class="text-container">
		{#each words as word, index}
			<span 
				class="word"
				class:active={index === activeWordIndex}
				style="--highlight-color: {highlightColor}"
			>
				{word}
			</span>
		{/each}
	</div>

	<div class="controls">
		{#if !isPlaying}
			<button on:click={play} class="btn-play">
				▶️ Reproducir
			</button>
		{:else}
			<button on:click={pause} class="btn-pause">
				⏸️ Pausar
			</button>
		{/if}
		
		<button on:click={stop} class="btn-stop">
			⏹️ Detener
		</button>
	</div>
</div>

<style>
	.read-along-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.text-container {
		font-size: 1.2rem;
		line-height: 2;
		padding: 1rem;
		border-radius: 8px;
		background: var(--surface, #f5f5f5);
	}

	.word {
		display: inline-block;
		padding: 0.2rem 0.3rem;
		margin: 0.1rem;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.word.active {
		background-color: var(--highlight-color, #FFE66D);
		font-weight: 700;
		transform: scale(1.1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.controls {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.controls button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 8px;
		background: var(--accent, #0b6efd);
		color: white;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.controls button:hover {
		background: var(--accent-hover, #0958d9);
		transform: translateY(-2px);
	}

	.controls button:active {
		transform: translateY(0);
	}
</style>
