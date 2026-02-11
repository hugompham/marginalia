<script lang="ts">
	import { Card } from '$components/ui';
	import { BookOpen } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { escapeHtml } from '$lib/utils/html';
	import type { Card as CardType, Rating } from '$lib/types';
	import type { SchedulingOptions } from '$lib/services/spaced-repetition/fsrs';
	import RatingButtons from './RatingButtons.svelte';

	interface Props {
		card: CardType;
		schedulingOptions: SchedulingOptions;
		onrate: (rating: Rating) => void;
	}

	let { card, schedulingOptions, onrate }: Props = $props();

	let revealed = $state(false);
	let touchStartX = $state(0);
	let touchStartY = $state(0);
	let translateX = $state(0);
	let swiping = $state(false);
	let showSwipeHint = $state(false);

	const SWIPE_THRESHOLD = 100;

	// Reset card interaction state when the active card changes
	$effect(() => {
		void card.id;
		revealed = false;
		translateX = 0;
		swiping = false;
	});

	function handleTouchStart(e: TouchEvent) {
		if (!revealed) return;
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
		swiping = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!revealed || !swiping) return;

		const deltaX = e.touches[0].clientX - touchStartX;
		const deltaY = e.touches[0].clientY - touchStartY;

		// Only allow horizontal swipe if predominantly horizontal
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			translateX = deltaX * 0.6;
			e.preventDefault();
		}
	}

	function handleTouchEnd() {
		if (!revealed || !swiping) return;

		swiping = false;

		if (Math.abs(translateX) > SWIPE_THRESHOLD) {
			if (translateX > 0) {
				onrate('good');
			} else {
				onrate('again');
			}
		}

		translateX = 0;
	}

	function reveal() {
		revealed = true;

		// Show swipe hint once on touch devices
		if (typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches) {
			const hintKey = 'marginalia:swipeHintShown';
			if (!localStorage.getItem(hintKey)) {
				showSwipeHint = true;
				localStorage.setItem(hintKey, '1');
				setTimeout(() => (showSwipeHint = false), 2500);
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'Enter') {
			if (!revealed) {
				reveal();
			}
		} else if (revealed) {
			if (e.key === '1') onrate('again');
			if (e.key === '2') onrate('hard');
			if (e.key === '3') onrate('good');
			if (e.key === '4') onrate('easy');
		}
	}

	// Render cloze text with blank or answer
	function renderCloze(text: string, showAnswer: boolean): string {
		const regex = /\{\{c1::(.*?)\}\}/g;
		let result = '';
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		while ((match = regex.exec(text)) !== null) {
			result += escapeHtml(text.slice(lastIndex, match.index));
			const answer = escapeHtml(match[1]);
			result += showAnswer
				? `<mark class="cloze-answer">${answer}</mark>`
				: '<span class="cloze-blank">&nbsp;</span>';
			lastIndex = regex.lastIndex;
		}

		result += escapeHtml(text.slice(lastIndex));
		return result;
	}

	// Swipe indicator color
	const swipeColor = $derived(
		translateX > SWIPE_THRESHOLD / 2
			? 'border-success'
			: translateX < -SWIPE_THRESHOLD / 2
				? 'border-error'
				: 'border-transparent'
	);
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="h-full flex flex-col touch-pan-y gap-md outline-none"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	role="region"
	aria-label="Review card - use keyboard keys 1-4 to rate or swipe on touch"
	tabindex="0"
>
	{#key card.id}
		<!-- Card content -->
		<div
			class="flex-1 overflow-y-auto transition-transform duration-fast {swiping
				? ''
				: 'ease-default'}"
			style="transform: translateX({translateX}px)"
			in:fly={{ x: 300, duration: 250 }}
			out:fly={{ x: -300, duration: 200 }}
		>
			<Card padding="lg" class="h-full border-2 {swipeColor} transition-colors">
				<div class="flex flex-col h-full">
					<!-- Question (vertically centered in available space) -->
					<div class="flex-1 flex flex-col justify-center py-xl">
						{#if card.questionType === 'cloze' && card.clozeText}
							<p class="text-2xl font-heading leading-relaxed text-primary">
								{@html renderCloze(card.clozeText, revealed)}
							</p>
						{:else}
							<p class="text-2xl font-heading leading-relaxed text-primary">
								{card.question}
							</p>
							{#if revealed}
								<div class="mt-xl pt-lg border-t border-border answer-reveal">
									<p class="text-lg text-primary leading-relaxed">{card.answer}</p>
								</div>
							{/if}
						{/if}
					</div>

					<!-- Source highlight (shown on reveal) -->
					{#if revealed && card.highlight}
						<div class="pt-lg border-t border-border mb-md">
							<div class="flex items-center gap-sm text-sm text-tertiary mb-sm">
								<BookOpen size={14} />
								<span>Original Highlight</span>
							</div>
							<blockquote class="text-secondary text-sm italic leading-relaxed">
								"{card.highlight.text}"
							</blockquote>
							{#if card.highlight.pageNumber}
								<p class="text-xs text-tertiary mt-sm">p. {card.highlight.pageNumber}</p>
							{/if}
						</div>
					{/if}

					<!-- Type badge + source anchored to card bottom -->
					<div
						class="mt-auto pt-md border-t border-border flex items-center gap-sm text-xs text-tertiary"
					>
						<span class="uppercase tracking-wide bg-subtle px-sm py-xs rounded">
							{card.questionType}
						</span>
						{#if card.highlight?.collection}
							<span class="truncate">{card.highlight.collection.title}</span>
							{#if card.highlight.chapter}
								<span>--</span>
								<span class="truncate">{card.highlight.chapter}</span>
							{/if}
						{/if}
					</div>
				</div>
			</Card>
		</div>
	{/key}

	<!-- Swipe hint (one-time, touch only) -->
	{#if showSwipeHint}
		<div class="swipe-hint flex items-center justify-center gap-xl text-tertiary text-sm py-sm">
			<span class="swipe-arrow-left">&larr; Again</span>
			<span class="text-xs">swipe to rate</span>
			<span class="swipe-arrow-right">Good &rarr;</span>
		</div>
	{/if}

	<!-- Actions -->
	<div class="shrink-0">
		{#if revealed}
			<RatingButtons {schedulingOptions} {onrate} />
		{:else}
			<button
				type="button"
				class="reveal-btn w-full py-lg px-xl text-center bg-subtle border border-border rounded-card hover:bg-canvas hover:border-accent/40 transition-all duration-normal active:scale-[0.98]"
				onclick={reveal}
			>
				<span class="text-lg font-medium text-primary">Reveal Answer</span>
				<span class="flex items-center justify-center gap-xs mt-xs text-sm text-tertiary">
					<span class="hidden desktop:inline">press</span>
					<kbd class="hidden desktop:inline-block px-xs py-px bg-canvas border border-border rounded text-xs font-mono">Space</kbd>
					<span class="desktop:hidden">Tap to reveal</span>
				</span>
			</button>
		{/if}
	</div>
</div>

<style>
	:global(.cloze-blank) {
		display: inline-block;
		width: 8rem;
		border-bottom: 2px solid var(--color-accent);
	}

	:global(.cloze-answer) {
		background: color-mix(in srgb, var(--color-accent) 15%, transparent);
		padding: 0 0.25rem;
		border-radius: 0.25rem;
		animation: cloze-fill 300ms ease-out;
	}

	@keyframes cloze-fill {
		from {
			opacity: 0;
			transform: scaleX(0.9);
		}
		to {
			opacity: 1;
			transform: scaleX(1);
		}
	}

	.answer-reveal {
		animation: answer-fade 250ms ease-out;
	}

	@keyframes answer-fade {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Swipe hint animation */
	.swipe-hint {
		animation: swipe-hint-fade 2.5s ease-out forwards;
	}

	.swipe-arrow-left {
		animation: nudge-left 1s ease-in-out 2;
	}

	.swipe-arrow-right {
		animation: nudge-right 1s ease-in-out 2;
	}

	@keyframes swipe-hint-fade {
		0%, 70% { opacity: 1; }
		100% { opacity: 0; }
	}

	@keyframes nudge-left {
		0%, 100% { transform: translateX(0); }
		50% { transform: translateX(-6px); }
	}

	@keyframes nudge-right {
		0%, 100% { transform: translateX(0); }
		50% { transform: translateX(6px); }
	}

	/* Reveal button subtle pulse on idle */
	.reveal-btn {
		animation: reveal-pulse 3s ease-in-out infinite;
	}

	.reveal-btn:hover, .reveal-btn:active {
		animation: none;
	}

	@keyframes reveal-pulse {
		0%, 100% { box-shadow: 0 0 0 0 transparent; }
		50% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 12%, transparent); }
	}
</style>
