<script lang="ts">
	import { type NodeProps } from '@xyflow/svelte';
	import { DEFAULT_TAG_COLOR } from '$components/mindmap';
	import type { Highlight, Tag } from '$lib/types';

	let { data, selected }: NodeProps = $props();

	const highlight = $derived(data.highlight as Highlight & { tags: Tag[] });
	const truncatedText = $derived(
		highlight.text.length > 60 ? highlight.text.slice(0, 60) + '...' : highlight.text
	);
</script>

<div
	class="px-md py-sm rounded-card bg-surface border border-border shadow-card transition-shadow duration-fast
		{selected ? 'border-accent shadow-card-hover' : 'hover:shadow-card-hover'}"
	style="min-width: 140px; max-width: 200px"
>
	<p class="text-xs text-primary leading-relaxed">{truncatedText}</p>

	{#if highlight.tags && highlight.tags.length > 0}
		<div class="flex items-center gap-xs mt-xs flex-wrap">
			{#each highlight.tags.slice(0, 3) as tag}
				<span
					class="w-2 h-2 rounded-full shrink-0"
					style="background-color: {tag.color || DEFAULT_TAG_COLOR}"
					title={tag.name}
				></span>
			{/each}
			{#if highlight.tags.length > 3}
				<span class="text-xs text-tertiary">+{highlight.tags.length - 3}</span>
			{/if}
		</div>
	{/if}

	{#if highlight.hasCards}
		<div class="mt-xs">
			<span class="text-xs text-success">Has cards</span>
		</div>
	{/if}
</div>
