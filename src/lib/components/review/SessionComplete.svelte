<script lang="ts">
	import { Card, Button } from '$components/ui';
	import { Flame } from 'lucide-svelte';

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
		onclear?: () => void;
	}

	let { stats, streak = 0, onclear }: Props = $props();

	function formatDuration(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;

		if (minutes === 0) {
			return `${seconds}s`;
		}
		return `${minutes}m ${remainingSeconds}s`;
	}

	const retentionMessage = $derived(
		stats.retention >= 90
			? 'Excellent recall'
			: stats.retention >= 70
				? 'Good progress, keep reviewing'
				: 'Some cards need more practice'
	);

	// Donut chart data
	const segments = $derived([
		{ label: 'Again', count: stats.ratingCounts.again, color: 'var(--color-error)' },
		{ label: 'Hard', count: stats.ratingCounts.hard, color: 'var(--color-warning)' },
		{ label: 'Good', count: stats.ratingCounts.good, color: 'var(--color-success)' },
		{ label: 'Easy', count: stats.ratingCounts.easy, color: 'var(--color-accent)' }
	]);

	const RADIUS = 40;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

	// Calculate stroke-dasharray offsets for each segment
	const arcs = $derived.by(() => {
		const total = stats.totalCards || 1;
		let offset = 0;
		return segments
			.filter((s) => s.count > 0)
			.map((s) => {
				const fraction = s.count / total;
				const dashLength = fraction * CIRCUMFERENCE;
				const dashOffset = offset;
				offset += dashLength;
				return { ...s, dashLength, dashOffset, fraction };
			});
	});
</script>

<div class="text-center py-xl px-lg">
	<!-- Donut chart with retention in center -->
	<div class="relative w-40 h-40 mx-auto mb-xl">
		<svg
			viewBox="0 0 100 100"
			class="w-full h-full -rotate-90"
			role="img"
			aria-label="Review breakdown: {stats.ratingCounts.good} good, {stats.ratingCounts
				.easy} easy, {stats.ratingCounts.hard} hard, {stats.ratingCounts.again} again"
		>
			<!-- Background circle -->
			<circle
				cx="50"
				cy="50"
				r={RADIUS}
				fill="none"
				stroke="var(--color-subtle)"
				stroke-width="8"
			/>
			<!-- Segments -->
			{#each arcs as arc}
				<circle
					cx="50"
					cy="50"
					r={RADIUS}
					fill="none"
					stroke={arc.color}
					stroke-width="8"
					stroke-dasharray="{arc.dashLength} {CIRCUMFERENCE - arc.dashLength}"
					stroke-dashoffset={-arc.dashOffset}
					stroke-linecap="butt"
				/>
			{/each}
		</svg>
		<!-- Center text -->
		<div class="absolute inset-0 flex flex-col items-center justify-center">
			<span class="font-heading text-3xl text-primary">{stats.retention}%</span>
			<span class="text-xs text-tertiary">retention</span>
		</div>
	</div>

	<h2 class="font-heading text-2xl text-primary mb-xs">{retentionMessage}</h2>
	<p class="text-secondary mb-xl">
		{stats.totalCards} cards in {formatDuration(stats.totalDuration)}
	</p>

	<!-- Rating legend -->
	<Card padding="lg" class="text-left mb-xl">
		<div class="grid grid-cols-2 gap-md">
			{#each segments as segment}
				<div class="flex items-center gap-sm">
					<div class="w-3 h-3 rounded-full" style="background: {segment.color}"></div>
					<span class="text-sm text-secondary">{segment.label}</span>
					<span class="text-sm text-primary font-medium ml-auto">{segment.count}</span>
				</div>
			{/each}
		</div>
	</Card>

	<!-- Streak -->
	{#if streak > 0}
		<div class="flex items-center justify-center gap-sm text-accent mb-xl">
			<Flame size={28} />
			<span class="font-heading text-2xl">{streak} day streak</span>
		</div>
	{/if}

	<!-- Actions -->
	<div class="flex flex-col gap-md">
		<Button href="/review" variant="secondary">Review More</Button>
		{#if onclear}
			<Button variant="ghost" onclick={onclear}>Back to Home</Button>
		{:else}
			<Button href="/" variant="ghost">Back to Home</Button>
		{/if}
	</div>
</div>
