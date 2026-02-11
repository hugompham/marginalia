<script lang="ts">
	interface DayData {
		date: string;
		count: number;
		dayOfWeek: string;
	}

	interface Props {
		data: DayData[];
		goal?: number;
	}

	let { data, goal = 20 }: Props = $props();

	const maxCount = $derived(Math.max(...data.map((d) => d.count), goal));

	function getBarHeight(count: number): string {
		if (maxCount === 0) return '4px';
		const percentage = (count / maxCount) * 100;
		return `${Math.max(4, percentage)}%`;
	}

	function isToday(dateStr: string): boolean {
		const today = new Date().toISOString().split('T')[0];
		return dateStr === today;
	}
</script>

<div class="flex flex-col h-full">
	<!-- Chart -->
	<div class="flex items-end justify-between gap-2 h-32 mb-2">
		{#each data as day, i}
			<div class="group flex flex-col items-center flex-1 h-full relative">
				<!-- Hover tooltip -->
				{#if day.count > 0}
					<div class="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
						<span class="text-xs font-medium text-primary bg-surface border border-border rounded px-xs py-px shadow-sm whitespace-nowrap">{day.count}</span>
					</div>
				{/if}
				<div class="flex-1 w-full flex items-end justify-center">
					<div
						class="chart-bar w-full max-w-8 rounded-t-md transition-all duration-300 {day.count >= goal
							? 'bg-success'
							: isToday(day.date)
								? 'bg-accent'
								: 'bg-accent/40'}"
						style="height: {getBarHeight(day.count)}; animation-delay: {i * 50}ms"
						title="{day.count} reviews on {day.date}"
					></div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Labels -->
	<div class="flex justify-between gap-2">
		{#each data as day}
			<div class="flex-1 text-center">
				<span class="text-xs {isToday(day.date) ? 'text-accent font-medium' : 'text-tertiary'}">
					{day.dayOfWeek}
				</span>
			</div>
		{/each}
	</div>

	<!-- Goal line indicator -->
	{#if goal > 0}
		<div class="flex items-center gap-2 mt-3 pt-3 border-t border-canvas">
			<div class="w-3 h-3 rounded-sm bg-success"></div>
			<span class="text-xs text-secondary">Goal reached ({goal} cards)</span>
		</div>
	{/if}
</div>

<style>
	.chart-bar {
		animation: bar-grow 400ms ease-out both;
	}

	@keyframes bar-grow {
		from {
			transform: scaleY(0);
			transform-origin: bottom;
		}
		to {
			transform: scaleY(1);
			transform-origin: bottom;
		}
	}
</style>
