<script lang="ts">
	import type { QuizQuestion, QuizResults } from '$lib/types';
	import { Card, Button } from '$components/ui';
	import { ChevronDown } from 'lucide-svelte';

	interface Props {
		questions: QuizQuestion[];
		results: QuizResults;
		collectionTitle: string;
		ontryagain?: () => void;
		onback?: () => void;
	}

	let { questions, results, collectionTitle, ontryagain, onback }: Props = $props();

	let showMistakes = $state(false);

	function formatTime(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;

		if (minutes === 0) {
			return `${seconds}s`;
		}
		return `${minutes}m ${remainingSeconds}s`;
	}

	const performanceMessage = $derived(
		results.scorePercent >= 90
			? 'Excellent!'
			: results.scorePercent >= 70
				? 'Great job!'
				: results.scorePercent >= 50
					? 'Good effort!'
					: 'Keep practicing!'
	);

	const incorrectAnswers = $derived(
		results.answers
			.map((answer, index) => ({ answer, question: questions[answer.questionIndex] }))
			.filter(({ answer }) => !answer.isCorrect)
	);

	// Donut chart constants
	const RADIUS = 40;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	const scoreOffset = $derived((1 - results.scorePercent / 100) * CIRCUMFERENCE);
</script>

<div class="text-center py-xl px-lg">
	<!-- Score donut chart -->
	<div class="relative w-40 h-40 mx-auto mb-xl">
		<svg
			viewBox="0 0 100 100"
			class="w-full h-full -rotate-90"
			role="img"
			aria-label="Quiz score: {results.scorePercent}%"
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
			<!-- Score arc -->
			<circle
				cx="50"
				cy="50"
				r={RADIUS}
				fill="none"
				stroke="var(--color-accent)"
				stroke-width="8"
				stroke-dasharray={CIRCUMFERENCE}
				stroke-dashoffset={scoreOffset}
				stroke-linecap="round"
			/>
		</svg>
		<!-- Center text -->
		<div class="absolute inset-0 flex flex-col items-center justify-center">
			<span class="font-heading text-3xl text-primary">{results.scorePercent}%</span>
			<span class="text-xs text-tertiary">score</span>
		</div>
	</div>

	<h2 class="font-heading text-2xl text-primary mb-xs">{performanceMessage}</h2>
	<p class="text-secondary mb-lg">Quiz on {collectionTitle}</p>

	<!-- Stats -->
	<div class="flex gap-xl justify-center mb-xl">
		<div>
			<p class="text-2xl font-heading text-primary">{results.correctCount}/{results.totalQuestions}</p>
			<p class="text-sm text-tertiary">correct</p>
		</div>
		<div>
			<p class="text-2xl font-heading text-primary">{formatTime(results.totalTimeMs)}</p>
			<p class="text-sm text-tertiary">time</p>
		</div>
	</div>

	<!-- Review mistakes section -->
	{#if incorrectAnswers.length > 0}
		<Card padding="none" class="text-left mb-xl">
			<button
				type="button"
				class="w-full px-lg py-md flex items-center justify-between text-primary hover:bg-subtle transition-colors"
				onclick={() => (showMistakes = !showMistakes)}
			>
				<span class="font-medium">Review Mistakes ({incorrectAnswers.length})</span>
				<ChevronDown
					size={20}
					class="transition-transform duration-fast {showMistakes ? 'rotate-180' : ''}"
				/>
			</button>

			{#if showMistakes}
				<div class="border-t border-border">
					{#each incorrectAnswers as { answer, question }, index}
						<div class="px-lg py-md {index > 0 ? 'border-t border-border' : ''}">
							<p class="text-sm font-medium text-primary mb-xs">
								Q{answer.questionIndex + 1}: {question.question}
							</p>
							<p class="text-sm text-red-600 dark:text-red-400 mb-xs">
								Your answer: {answer.userAnswer}
							</p>
							<p class="text-sm text-green-600 dark:text-green-400 mb-xs">
								Correct answer: {question.correctAnswer}
							</p>
							<p class="text-sm text-secondary">
								{question.explanation}
							</p>
						</div>
					{/each}
				</div>
			{/if}
		</Card>
	{/if}

	<!-- Actions -->
	<div class="flex flex-col gap-md">
		{#if ontryagain}
			<Button variant="secondary" onclick={ontryagain}>Try Again</Button>
		{/if}
		{#if onback}
			<Button onclick={onback}>Back to Collection</Button>
		{:else}
			<Button href="/library">Back to Library</Button>
		{/if}
	</div>
</div>
