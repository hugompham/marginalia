<script lang="ts">
	import { type NodeProps } from '@xyflow/svelte';

	let { data, selected }: NodeProps = $props();

	const chapter = $derived(data.chapter as string);
	const highlightCount = $derived(data.highlightCount as number);
</script>

<div
	class="px-md py-sm rounded-card bg-subtle border border-border transition-shadow duration-fast
		{selected ? 'border-accent' : ''}"
	style="min-width: 120px; max-width: 180px"
>
	<p class="text-xs font-medium text-secondary truncate" title={chapter}>
		{chapter}
	</p>
	<span class="text-xs text-tertiary">{highlightCount} highlights</span>
</div>
