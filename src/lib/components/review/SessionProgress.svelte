<script lang="ts">
	import type { Rating } from '$lib/types';

	interface Props {
		current: number;
		total: number;
		results?: Array<{ rating: Rating }>;
	}

	let { current, total, results = [] }: Props = $props();

	const ratingColors: Record<Rating, string> = {
		again: 'bg-error',
		hard: 'bg-warning',
		good: 'bg-success',
		easy: 'bg-accent'
	};
</script>

<div class="flex-1 mr-md">
	<div class="flex items-center gap-sm mb-xs">
		<span class="text-sm text-secondary">{current} of {total}</span>
	</div>
	<div class="flex gap-px h-1.5 rounded-full overflow-hidden">
		{#each Array(total) as _, i}
			{@const result = results[i]}
			<div
				class="flex-1 transition-colors duration-normal {result
					? ratingColors[result.rating]
					: i < current - 1
						? 'bg-accent/40'
						: 'bg-subtle'}"
			></div>
		{/each}
	</div>
</div>
