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

	const SWIPE_THRESHOLD = 100;

	// Reset revealed state when card changes
	$effect(() => {
		card.id;
		revealed = false;
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
	class="h-full flex flex-col touch-pan-y"
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
			<Card padding="xl" class="h-full border-2 {swipeColor} transition-colors">
				<!-- Question content -->
				<div class="flex-1">
					{#if card.questionType === 'cloze' && card.clozeText}
						<p class="text-2xl leading-relaxed text-primary">
							{@html renderCloze(card.clozeText, revealed)}
						</p>
					{:else}
						<p class="text-2xl leading-relaxed text-primary mb-xl">
							{card.question}
						</p>
						{#if revealed}
							<div class="pt-lg border-t border-border answer-reveal">
								<p class="text-lg text-primary">{card.answer}</p>
							</div>
						{/if}
					{/if}
				</div>

				<!-- Source info + type badge (footer, subtle) -->
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

				<!-- Source + type badge as subtle footer -->
				<div
					class="mt-xl pt-md border-t border-border flex items-center gap-sm text-xs text-tertiary"
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
			</Card>
		</div>
	{/key}

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
</style>
