<script lang="ts">
	import type { Highlight, Tag } from '$lib/types';
	import HighlightCard from './HighlightCard.svelte';

	interface Props {
		highlights: Highlight[];
		availableTags?: Tag[];
		selectable?: boolean;
		selectedIds?: Set<string>;
		onselectionchange?: (ids: Set<string>) => void;
		ontagadd?: (highlightId: string, tag: Tag) => void;
		ontagremove?: (highlightId: string, tag: Tag) => void;
	}

	let {
		highlights,
		availableTags = [],
		selectable = false,
		selectedIds = $bindable(new Set<string>()),
		onselectionchange,
		ontagadd,
		ontagremove
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
			{availableTags}
			{selectable}
			selected={selectedIds.has(highlight.id)}
			onselect={() => toggleSelection(highlight.id)}
			ontagadd={(tag) => ontagadd?.(highlight.id, tag)}
			ontagremove={(tag) => ontagremove?.(highlight.id, tag)}
		/>
	{/each}
</div>
