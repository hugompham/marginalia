<script lang="ts">
	import { Card } from '$components/ui';
	import { BookOpen } from 'lucide-svelte';
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

	const SWIPE_THRESHOLD = 100;

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
				? `<mark class="bg-accent/20 px-1 rounded">${answer}</mark>`
				: '<span class="inline-block w-24 border-b-2 border-accent">&nbsp;</span>';
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

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="h-full flex flex-col touch-pan-y"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	role="region"
	aria-label="Review card - use keyboard keys 1-4 to rate or swipe on touch"
	tabindex="0"
>
	<!-- Card content -->
	<div
		class="flex-1 overflow-y-auto transition-transform duration-fast {swiping
			? ''
			: 'ease-default'}"
		style="transform: translateX({translateX}px)"
	>
		<Card padding="lg" class="h-full border-2 {swipeColor} transition-colors">
			<!-- Source info -->
			{#if card.highlight?.collection}
				<div class="text-sm text-secondary mb-lg">
					<span class="font-medium">{card.highlight.collection.title}</span>
					{#if card.highlight.chapter}
						<span class="text-tertiary"> · {card.highlight.chapter}</span>
					{/if}
				</div>
			{/if}

			<!-- Question type badge -->
			<div class="mb-lg">
				<span class="text-xs uppercase tracking-wide text-tertiary bg-subtle px-sm py-xs rounded">
					{card.questionType}
				</span>
			</div>

			<!-- Question content -->
			<div class="flex-1">
				{#if card.questionType === 'cloze' && card.clozeText}
					<p class="text-xl leading-relaxed text-primary">
						{@html renderCloze(card.clozeText, revealed)}
					</p>
				{:else}
					<p class="text-xl leading-relaxed text-primary mb-lg">
						{card.question}
					</p>
					{#if revealed}
						<div class="pt-lg border-t border-border">
							<p class="text-lg text-primary">{card.answer}</p>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Original highlight (shown after reveal) -->
			{#if revealed && card.highlight}
				<div class="mt-xl pt-lg border-t border-border">
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
		</Card>
	</div>

	<!-- Actions -->
	<div class="mt-lg">
		{#if revealed}
			<RatingButtons {schedulingOptions} {onrate} />
		{:else}
			<button
				type="button"
				class="w-full py-lg text-center text-secondary hover:text-primary transition-colors"
				onclick={reveal}
			>
				<span class="text-lg">Tap to Reveal</span>
				<span class="block text-sm mt-xs">or press Space</span>
			</button>
		{/if}
	</div>
</div>
