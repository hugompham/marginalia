<script lang="ts">
	import { type NodeProps } from '@xyflow/svelte';
	import type { Highlight } from '$lib/types';

	let { data, selected }: NodeProps = $props();

	const highlight = $derived(data.highlight as Highlight);
	const collectionTitle = $derived((data.collectionTitle as string) || 'Unknown');
	const truncatedText = $derived(
		highlight.text.length > 50 ? highlight.text.slice(0, 50) + '...' : highlight.text
	);
</script>

<div
	class="px-md py-sm rounded-card bg-surface/60 border border-dashed border-border shadow-card transition-shadow duration-fast
		{selected ? 'border-accent shadow-card-hover' : 'hover:shadow-card-hover'}"
	style="min-width: 130px; max-width: 180px"
>
	<p class="text-xs text-secondary leading-relaxed opacity-80">{truncatedText}</p>
	<p class="text-xs text-tertiary mt-xs truncate" title={collectionTitle}>
		{collectionTitle}
	</p>
</div>
