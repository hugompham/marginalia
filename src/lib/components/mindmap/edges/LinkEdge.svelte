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

	const description = $derived((data?.description as string) || '');
	const confidence = $derived(data?.confidence as number | null);
	const linkType = $derived((data?.linkType as string) || 'manual');
	const isDashed = $derived(linkType === 'ai_suggested');
</script>

<BaseEdge
	{id}
	{path}
	style="stroke: var(--color-accent); stroke-width: 2; {isDashed ? 'stroke-dasharray: 6 4;' : ''}"
/>

{#if description}
	<EdgeLabel
		x={labelX}
		y={labelY}
		style="font-size: 10px; color: var(--color-text-secondary); background: var(--color-surface); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--color-border); max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
	>
		{description}{#if confidence !== null}&nbsp;({Math.round(confidence * 100)}%){/if}
	</EdgeLabel>
{/if}
