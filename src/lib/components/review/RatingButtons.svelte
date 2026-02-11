<script lang="ts">
	import type { Rating } from '$lib/types';
	import type { SchedulingOptions } from '$lib/services/spaced-repetition/fsrs';

	interface Props {
		schedulingOptions: SchedulingOptions;
		onrate: (rating: Rating) => void;
	}

	let { schedulingOptions, onrate }: Props = $props();

	const ratings: { key: Rating; label: string; color: string; border: string; shortcut: string }[] =
		[
			{
				key: 'again',
				label: 'Again',
				color: 'bg-error/10 text-error hover:bg-error/20',
				border: 'border-error/30',
				shortcut: '1'
			},
			{
				key: 'hard',
				label: 'Hard',
				color: 'bg-warning/10 text-warning hover:bg-warning/20',
				border: 'border-warning/30',
				shortcut: '2'
			},
			{
				key: 'good',
				label: 'Good',
				color: 'bg-success/10 text-success hover:bg-success/20',
				border: 'border-success/30',
				shortcut: '3'
			},
			{
				key: 'easy',
				label: 'Easy',
				color: 'bg-accent/10 text-accent hover:bg-accent/20',
				border: 'border-accent/30',
				shortcut: '4'
			}
		];
</script>

<div class="grid grid-cols-4 gap-sm">
	{#each ratings as { key, label, color, border, shortcut }}
		<button
			type="button"
			class="flex flex-col items-center py-lg px-sm rounded-button border transition-all duration-fast active:scale-95 {color} {border}"
			onclick={() => onrate(key)}
		>
			<span class="text-xs opacity-70">{schedulingOptions[key].interval}</span>
			<span class="font-heading font-semibold mt-xs">{label}</span>
			<kbd class="text-xs opacity-50 mt-xs desktop:block hidden font-mono">{shortcut}</kbd>
		</button>
	{/each}
</div>
