<script lang="ts">
	import type { Rating } from '$lib/types';
	import type { SchedulingOptions } from '$lib/services/spaced-repetition/fsrs';

	interface Props {
		schedulingOptions: SchedulingOptions;
		onrate: (rating: Rating) => void;
	}

	let { schedulingOptions, onrate }: Props = $props();

	const ratings: { key: Rating; label: string; color: string; shortcut: string }[] = [
		{ key: 'again', label: 'Again', color: 'bg-error/10 text-error hover:bg-error/20', shortcut: '1' },
		{ key: 'hard', label: 'Hard', color: 'bg-warning/10 text-warning hover:bg-warning/20', shortcut: '2' },
		{ key: 'good', label: 'Good', color: 'bg-success/10 text-success hover:bg-success/20', shortcut: '3' },
		{ key: 'easy', label: 'Easy', color: 'bg-accent/10 text-accent hover:bg-accent/20', shortcut: '4' }
	];
</script>

<div class="grid grid-cols-4 gap-sm">
	{#each ratings as { key, label, color, shortcut }}
		<button
			type="button"
			class="flex flex-col items-center py-md px-sm rounded-button transition-colors {color}"
			onclick={() => onrate(key)}
		>
			<span class="font-medium">{label}</span>
			<span class="text-xs opacity-70 mt-xs">{schedulingOptions[key].interval}</span>
			<span class="text-xs opacity-50 mt-xs desktop:block hidden">[{shortcut}]</span>
		</button>
	{/each}
</div>
