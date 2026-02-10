<script lang="ts">
	import { BaseEdge, EdgeLabel, getBezierPath, type EdgeProps } from '@xyflow/svelte';

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

	const linkCount = $derived((data?.linkCount as number) || 1);
	const strokeWidth = $derived(Math.min(1 + linkCount * 0.5, 6));
</script>

<BaseEdge
	{id}
	{path}
	style="stroke: var(--color-accent); stroke-opacity: 0.6; stroke-width: {strokeWidth}"
/>

<EdgeLabel
	x={labelX}
	y={labelY}
	style="font-size: 10px; color: var(--color-accent); background: var(--color-surface); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--color-border)"
>
	{linkCount}
	{linkCount === 1 ? 'link' : 'links'}
</EdgeLabel>
