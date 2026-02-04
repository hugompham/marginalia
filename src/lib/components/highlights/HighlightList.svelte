<script lang="ts">
	import type { Highlight } from '$lib/types';
	import HighlightCard from './HighlightCard.svelte';

	interface Props {
		highlights: Highlight[];
		selectable?: boolean;
		selectedIds?: Set<string>;
		onselectionchange?: (ids: Set<string>) => void;
	}

	let {
		highlights,
		selectable = false,
		selectedIds = $bindable(new Set<string>()),
		onselectionchange
	}: Props = $props();

	function toggleSelection(id: string) {
		const newSelection = new Set(selectedIds);
		if (newSelection.has(id)) {
			newSelection.delete(id);
		} else {
			newSelection.add(id);
		}
		selectedIds = newSelection;
		onselectionchange?.(newSelection);
	}
</script>

<div class="space-y-md">
	{#each highlights as highlight (highlight.id)}
		<HighlightCard
			{highlight}
			{selectable}
			selected={selectedIds.has(highlight.id)}
			onselect={() => toggleSelection(highlight.id)}
		/>
	{/each}
</div>
