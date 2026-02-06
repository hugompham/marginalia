<script lang="ts">
	import { Card, Button } from '$components/ui';
	import { CheckCircle, Flame } from 'lucide-svelte';

	interface Props {
		stats: {
			totalCards: number;
			totalDuration: number;
			ratingCounts: {
				again: number;
				hard: number;
				good: number;
				easy: number;
			};
			retention: number;
		};
		streak?: number;
	}

	let { stats, streak = 0 }: Props = $props();

	function formatDuration(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;

		if (minutes === 0) {
			return `${seconds}s`;
		}
		return `${minutes}m ${remainingSeconds}s`;
	}

	const maxCount = $derived(
		Math.max(
			stats.ratingCounts.again,
			stats.ratingCounts.hard,
			stats.ratingCounts.good,
			stats.ratingCounts.easy,
			1
		)
	);
</script>

<div class="text-center py-xl px-lg">
	<!-- Success icon -->
	<div class="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-xl">
		<CheckCircle class="text-success" size={40} />
	</div>

	<h2 class="font-heading text-2xl text-primary mb-sm">Session Complete!</h2>
	<p class="text-secondary mb-xl">
		{stats.totalCards} cards reviewed in {formatDuration(stats.totalDuration)}
	</p>

	<!-- Stats card -->
	<Card padding="lg" class="text-left mb-xl">
		<div class="space-y-md">
			<!-- Rating bars -->
			<div class="space-y-sm">
				{#each [{ label: 'Again', count: stats.ratingCounts.again, color: 'bg-error' }, { label: 'Hard', count: stats.ratingCounts.hard, color: 'bg-warning' }, { label: 'Good', count: stats.ratingCounts.good, color: 'bg-success' }, { label: 'Easy', count: stats.ratingCounts.easy, color: 'bg-accent' }] as item}
					<div class="flex items-center gap-md">
						<span class="w-12 text-sm text-secondary">{item.label}</span>
						<div class="flex-1 h-4 bg-subtle rounded-full overflow-hidden">
							<div
								class="h-full {item.color} transition-all"
								style="width: {(item.count / maxCount) * 100}%"
							></div>
						</div>
						<span class="w-8 text-sm text-secondary text-right">{item.count}</span>
					</div>
				{/each}
			</div>

			<div class="pt-md border-t border-border">
				<div class="flex items-center justify-between">
					<span class="text-secondary">Retention</span>
					<span class="font-medium text-primary">{stats.retention}%</span>
				</div>
			</div>
		</div>
	</Card>

	<!-- Streak -->
	{#if streak > 0}
		<div class="flex items-center justify-center gap-sm text-accent mb-xl">
			<Flame size={24} />
			<span class="font-heading text-xl">{streak} day streak!</span>
		</div>
	{/if}

	<!-- Actions -->
	<div class="flex flex-col gap-md">
		<Button href="/review" variant="secondary">Review More</Button>
		<Button href="/" variant="ghost">Done</Button>
	</div>
</div>
