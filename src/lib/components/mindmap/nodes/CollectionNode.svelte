<script lang="ts">
	import { type NodeProps } from '@xyflow/svelte';
	import { BookOpen } from 'lucide-svelte';
	import type { Collection } from '$lib/types';

	let { data, selected }: NodeProps = $props();

	const collection = $derived(data.collection as Collection);
</script>

<div
	class="px-lg py-md rounded-card bg-surface border border-border shadow-card transition-shadow duration-fast
		{selected ? 'border-accent shadow-card-hover' : 'hover:shadow-card-hover'}"
	style="min-width: 180px; max-width: 240px"
>
	<div class="flex items-start gap-md">
		<div class="p-sm rounded-button bg-subtle shrink-0">
			<BookOpen class="text-secondary" size={16} />
		</div>
		<div class="flex-1 min-w-0">
			<h3 class="font-heading text-sm text-primary truncate" title={collection.title}>
				{collection.title}
			</h3>
			{#if collection.author}
				<p class="text-xs text-secondary truncate">{collection.author}</p>
			{/if}
			<div class="flex items-center gap-md mt-xs text-xs text-tertiary">
				<span>{collection.highlightCount} highlights</span>
				<span>{collection.cardCount} cards</span>
			</div>
		</div>
	</div>
</div>
