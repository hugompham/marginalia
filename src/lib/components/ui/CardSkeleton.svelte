<script lang="ts">
	import Skeleton from './Skeleton.svelte';

	interface Props {
		lines?: number;
		showIcon?: boolean;
	}

	let { lines = 3, showIcon = true }: Props = $props();
</script>

<div class="bg-surface border border-canvas rounded-card p-lg">
	<div class="flex items-start gap-md">
		{#if showIcon}
			<Skeleton width="48px" height="48px" rounded="lg" />
		{/if}
		<div class="flex-1 space-y-sm">
			<Skeleton width="60%" height="1.25rem" />
			{#each Array(lines - 1) as _, i}
				<Skeleton width="{80 - i * 15}%" height="0.875rem" />
			{/each}
		</div>
	</div>
</div>
