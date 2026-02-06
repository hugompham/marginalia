<script lang="ts">
	import { Card, Button } from '$components/ui';
	import { WeeklyChart, StatsCard, StreakBadge } from '$components/analytics';
	import { Brain, BookOpen, Clock, ChevronRight, Target, TrendingUp } from 'lucide-svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Get greeting based on time of day
	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	};

	const greeting = getGreeting();

	// Prepare chart data with day labels
	const chartData = $derived(
		data.weeklyData.map((d) => ({
			date: d.date,
			count: d.count,
			dayOfWeek: d.label
		}))
	);

	// Display retention rate from server data
	const retentionDisplay = $derived(() => {
		if (data.stats.reviewedToday === 0) return '--';
		if (data.stats.retentionRate === 0) return '--';
		return `${data.stats.retentionRate}%`;
	});
</script>

<div class="px-lg py-xl space-y-xl">
	<!-- Greeting with streak -->
	<div class="flex items-start justify-between">
		<div>
			<h2 class="font-heading text-2xl text-primary mb-xs">{greeting}</h2>
			<p class="text-secondary">Ready to strengthen your memory?</p>
		</div>
		{#if data.stats.streak > 0}
			<StreakBadge streak={data.stats.streak} size="md" />
		{/if}
	</div>

	<!-- Review CTA Card -->
	<Card padding="lg" class="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
		<div class="flex items-start gap-lg">
			<div class="p-md rounded-full bg-accent/10">
				<Brain class="text-accent" size={28} />
			</div>
			<div class="flex-1">
				<p class="text-primary font-heading text-2xl mb-xs">
					{data.stats.dueToday} cards due
				</p>
				<p class="text-secondary text-sm mb-lg">
					{#if data.stats.dueToday > 0}
						Estimated ~{Math.ceil(data.stats.dueToday * 0.4)} min to complete
					{:else}
						All caught up! Great job.
					{/if}
				</p>
				<Button href="/review" variant={data.stats.dueToday > 0 ? 'primary' : 'secondary'}>
					{data.stats.dueToday > 0 ? 'Start Review Session' : 'Practice Ahead'}
					<ChevronRight size={16} />
				</Button>
			</div>
		</div>
	</Card>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-md">
		<StatsCard
			title="Due Today"
			value={data.stats.dueToday}
			subtitle="cards to review"
			icon={Target}
		/>
		<StatsCard
			title="Reviewed Today"
			value={data.stats.reviewedToday}
			subtitle={data.dailyGoal ? `of ${data.dailyGoal} goal` : undefined}
			icon={Clock}
		/>
		<StatsCard
			title="Total Cards"
			value={data.stats.totalCards}
			subtitle="in your library"
			icon={Brain}
		/>
		<StatsCard
			title="Retention"
			value={retentionDisplay()}
			subtitle="success rate"
			icon={TrendingUp}
		/>
	</div>

	<!-- This Week Chart -->
	<Card padding="lg">
		<div class="flex items-center justify-between mb-lg">
			<h3 class="font-heading text-lg text-primary">This Week</h3>
			<span class="text-sm text-secondary">{data.weeklyTotal} total reviews</span>
		</div>
		<WeeklyChart data={chartData} goal={data.dailyGoal ?? 20} />
	</Card>

	<!-- Recent Collections -->
	<div>
		<div class="flex items-center justify-between mb-md">
			<h3 class="font-heading text-lg text-primary">Recent Collections</h3>
			<a href="/library" class="text-sm text-accent hover:text-accent-hover transition-colors">
				See all
			</a>
		</div>

		{#if data.recentCollections.length > 0}
			<div class="space-y-sm">
				{#each data.recentCollections as collection}
					<a href="/library/{collection.id}" class="block group">
						<Card padding="md" class="flex items-center gap-md transition-colors hover:border-accent/30">
							<div class="p-sm rounded-button bg-subtle group-hover:bg-accent/10 transition-colors">
								<BookOpen class="text-secondary group-hover:text-accent transition-colors" size={20} />
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-medium text-primary truncate group-hover:text-accent transition-colors">
									{collection.title}
								</p>
								<p class="text-sm text-secondary">
									{collection.highlightCount} highlights · {collection.cardCount} cards
								</p>
							</div>
							<ChevronRight
								class="text-tertiary flex-shrink-0 group-hover:text-accent transition-colors"
								size={20}
							/>
						</Card>
					</a>
				{/each}
			</div>
		{:else}
			<Card padding="lg" class="text-center">
				<div class="py-lg">
					<BookOpen class="text-tertiary mx-auto mb-md" size={40} />
					<h4 class="font-heading text-lg text-primary mb-xs">No collections yet</h4>
					<p class="text-secondary text-sm mb-lg max-w-xs mx-auto">
						Import your reading highlights to start creating flashcards
					</p>
					<Button href="/import" variant="primary">
						Import Highlights
					</Button>
				</div>
			</Card>
		{/if}
	</div>

	<!-- Quick Actions -->
	{#if data.stats.totalCards === 0 && data.recentCollections.length === 0}
		<Card padding="lg" class="bg-subtle border-none">
			<h3 class="font-heading text-lg text-primary mb-md">Getting Started</h3>
			<ol class="space-y-md text-sm">
				<li class="flex items-start gap-md">
					<span
						class="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center shrink-0"
						>1</span
					>
					<div>
						<p class="text-primary font-medium">Import your highlights</p>
						<p class="text-secondary">Paste highlights from books or articles</p>
					</div>
				</li>
				<li class="flex items-start gap-md">
					<span
						class="w-6 h-6 rounded-full bg-accent/60 text-white text-xs flex items-center justify-center shrink-0"
						>2</span
					>
					<div>
						<p class="text-primary font-medium">Generate questions with AI</p>
						<p class="text-secondary">Turn highlights into study cards</p>
					</div>
				</li>
				<li class="flex items-start gap-md">
					<span
						class="w-6 h-6 rounded-full bg-accent/30 text-white text-xs flex items-center justify-center shrink-0"
						>3</span
					>
					<div>
						<p class="text-primary font-medium">Review daily</p>
						<p class="text-secondary">Build lasting knowledge with spaced repetition</p>
					</div>
				</li>
			</ol>
		</Card>
	{/if}
</div>
