<script lang="ts">
	import { BaseEdge, EdgeLabel, getBezierPath, type EdgeProps } from '@xyflow/svelte';
	import { DEFAULT_TAG_COLOR } from '$components/mindmap';

	let { id, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, data }: EdgeProps =
		$props();

	let [path, labelX, labelY] = $derived(
		getBezierPath({
			sourceX,
			sourceY,
			targetX,
			targetY,
			sourcePosition,
			targetPosition
		})
	);

	const tagColor = $derived((data?.tagColor as string) || DEFAULT_TAG_COLOR);
	const tagName = $derived((data?.tagName as string) || '');
</script>

<BaseEdge {id} {path} style="stroke: {tagColor}; stroke-opacity: 0.5; stroke-width: 1.5" />

{#if tagName}
	<EdgeLabel
		x={labelX}
		y={labelY}
		style="font-size: 10px; color: {tagColor}; background: var(--color-surface); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--color-border)"
	>
		{tagName}
	</EdgeLabel>
{/if}
