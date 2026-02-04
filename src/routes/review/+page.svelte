<script lang="ts">
	import { goto } from '$app/navigation';
	import { Header } from '$components/layout';
	import { Button, Card } from '$components/ui';
	import { ReviewCard, SessionProgress, SessionComplete } from '$components/review';
	import {
		reviewSession,
		currentCard,
		sessionProgress,
		currentSchedulingOptions,
		sessionStats
	} from '$stores/review';
	import { X, Brain, Sparkles, AlertCircle, Clock } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Rating, Card as CardType } from '$lib/types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Start session when page loads with cards
	$effect(() => {
		if (data.cards.length > 0 && !$reviewSession) {
			reviewSession.startSession(data.cards);
		}
	});

	async function handleRate(rating: Rating) {
		if (!$currentCard) return;

		// Save review to database
		const card = $currentCard;
		const reviewResult = reviewSession.answerCard(rating);

		// In background, save the review result
		await fetch('/api/review', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				cardId: card.id,
				rating,
				stabilityBefore: reviewResult?.stabilityBefore ?? card.stability,
				difficultyBefore: reviewResult?.difficultyBefore ?? card.difficulty,
				stateBefore: reviewResult?.stateBefore ?? card.state,
				durationMs: reviewResult?.durationMs ?? null
			})
		});
	}

	function handleClose() {
		reviewSession.clearSession();
		goto('/');
	}
</script>

{#if !data.cards.length}
	<!-- No cards due -->
	<Header title="Review" />

	<div class="px-lg py-xl max-w-content mx-auto">
		<Card padding="lg" class="text-center">
			<div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-lg">
				<Sparkles class="text-success" size={32} />
			</div>
			<h2 class="font-heading text-xl text-primary mb-sm">All caught up!</h2>
			<p class="text-secondary mb-lg">
				You have no cards due for review right now. Check back later or add more highlights.
			</p>
			<div class="flex flex-col gap-md">
				<Button href="/library">Browse Library</Button>
				<Button href="/import" variant="secondary">Import Highlights</Button>
			</div>
		</Card>

		{#if data.upcomingCount > 0}
			<Card padding="md" class="mt-lg flex items-center gap-md">
				<Clock class="text-tertiary" size={20} />
				<span class="text-secondary">
					{data.upcomingCount} cards coming up soon
				</span>
			</Card>
		{/if}
	</div>
{:else if $reviewSession?.isComplete && $sessionStats}
	<!-- Session complete -->
	<SessionComplete stats={$sessionStats} streak={data.streak} />
{:else if $currentCard && $currentSchedulingOptions && $sessionProgress}
	<!-- Active review session -->
	<div class="h-screen flex flex-col">
		<!-- Header -->
		<header class="flex items-center justify-between px-lg py-md border-b border-border bg-surface">
			<SessionProgress current={$sessionProgress.current} total={$sessionProgress.total} />
			<button
				type="button"
				class="p-sm rounded-button text-secondary hover:text-primary hover:bg-subtle transition-colors"
				onclick={handleClose}
				aria-label="End session"
			>
				<X size={20} />
			</button>
		</header>

		<!-- Card -->
		<div class="flex-1 p-lg overflow-hidden">
			<ReviewCard
				card={$currentCard}
				schedulingOptions={$currentSchedulingOptions}
				onrate={handleRate}
			/>
		</div>
	</div>
{:else}
	<!-- Loading state -->
	<div class="h-screen flex items-center justify-center">
		<div class="text-center">
			<Brain class="text-accent mx-auto mb-md animate-pulse" size={48} />
			<p class="text-secondary">Loading cards...</p>
		</div>
	</div>
{/if}
