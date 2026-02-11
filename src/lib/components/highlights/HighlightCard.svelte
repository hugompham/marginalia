<script lang="ts">
	import { Card } from '$components/ui';
	import { TagPicker } from '$components/tags';
	import { Sparkles, MoreHorizontal } from 'lucide-svelte';
	import type { Highlight, Tag } from '$lib/types';

	interface Props {
		highlight: Highlight & { tags?: Tag[] };
		availableTags?: Tag[];
		selectable?: boolean;
		selected?: boolean;
		onselect?: () => void;
		ontagadd?: (tag: Tag) => void;
		ontagremove?: (tag: Tag) => void;
	}

	let {
		highlight,
		availableTags = [],
		selectable = false,
		selected = false,
		onselect,
		ontagadd,
		ontagremove
	}: Props = $props();
</script>

<Card
	padding="lg"
	class="relative {selectable ? 'cursor-pointer' : ''} {selected
		? 'ring-2 ring-accent'
		: ''} {highlight.hasCards ? 'border-l-[3px] border-l-accent' : ''}"
	onclick={selectable ? onselect : undefined}
>
	{#if selectable}
		<div class="absolute top-lg right-lg">
			<div
				class="w-5 h-5 rounded-full border-2 transition-colors {selected
					? 'bg-accent border-accent'
					: 'border-border'}"
			>
				{#if selected}
					<svg class="w-full h-full text-white" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}
			</div>
		</div>
	{/if}

	<blockquote class="text-primary leading-relaxed pr-8">
		"{highlight.text}"
	</blockquote>

	{#if highlight.note}
		<p class="mt-md text-sm text-secondary italic">
			Note: {highlight.note}
		</p>
	{/if}

	<!-- Tags -->
	{#if availableTags.length > 0 && !selectable}
		<div class="mt-md">
			<TagPicker
				{availableTags}
				selectedTags={highlight.tags || []}
				ontagadd={(tag) => ontagadd?.(tag)}
				ontagremove={(tag) => ontagremove?.(tag)}
			/>
		</div>
	{/if}

	<div class="flex items-center justify-between mt-lg pt-md border-t border-border">
		<div class="flex items-center gap-md text-sm text-tertiary">
			{#if highlight.chapter}
				<span>{highlight.chapter}</span>
			{/if}
			{#if highlight.pageNumber}
				<span>p. {highlight.pageNumber}</span>
			{/if}
		</div>

		<div class="flex items-center gap-sm">
			{#if highlight.hasCards}
				<span class="flex items-center gap-xs text-sm text-success">
					<Sparkles size={14} />
					Cards
				</span>
			{/if}
			{#if !selectable}
				<button
					type="button"
					class="p-sm rounded-button text-tertiary hover:text-primary hover:bg-subtle transition-colors"
					aria-label="More options"
				>
					<MoreHorizontal size={16} />
				</button>
			{/if}
		</div>
	</div>
</Card>
