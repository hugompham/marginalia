<script lang="ts">
	import type { QuizQuestion } from '$lib/types';
	import { Button, Card } from '$components/ui';
	import { CheckCircle, XCircle } from 'lucide-svelte';

	interface Props {
		question: QuizQuestion;
		questionNumber: number;
		totalQuestions: number;
		onanswer?: (userAnswer: string, isCorrect: boolean) => void;
	}

	let { question, questionNumber, totalQuestions, onanswer }: Props = $props();

	let selectedAnswer = $state<string>('');
	let hasAnswered = $state(false);
	let isCorrect = $state(false);

	function handleAnswer(answer: string) {
		if (hasAnswered) return;

		selectedAnswer = answer;
		hasAnswered = true;

		if (question.type === 'short_answer') {
			// Case-insensitive keyword matching
			const userLower = answer.toLowerCase().trim();
			const correctLower = question.correctAnswer.toLowerCase().trim();
			isCorrect = userLower.includes(correctLower) || correctLower.includes(userLower);
		} else {
			isCorrect = answer === question.correctAnswer;
		}
	}

	function handleNext() {
		onanswer?.(selectedAnswer, isCorrect);
		// Reset for next question
		selectedAnswer = '';
		hasAnswered = false;
		isCorrect = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (hasAnswered) {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				handleNext();
			}
			return;
		}

		if (question.type === 'multiple_choice') {
			const key = parseInt(event.key);
			if (key >= 1 && key <= 4 && question.options?.[key - 1]) {
				event.preventDefault();
				handleAnswer(question.options[key - 1]);
			}
		} else if (question.type === 'true_false') {
			if (event.key === 't' || event.key === 'T') {
				event.preventDefault();
				handleAnswer('True');
			} else if (event.key === 'f' || event.key === 'F') {
				event.preventDefault();
				handleAnswer('False');
			}
		} else if (question.type === 'short_answer' && event.key === 'Enter') {
			event.preventDefault();
			if (selectedAnswer.trim()) {
				handleAnswer(selectedAnswer);
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="space-y-lg">
	<!-- Question header -->
	<div>
		<p class="text-sm text-tertiary mb-xs">
			Question {questionNumber} of {totalQuestions}
		</p>
		<h3 class="font-heading text-xl text-primary">
			{question.question}
		</h3>
	</div>

	<!-- Answer options based on type -->
	{#if question.type === 'multiple_choice' && question.options}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-sm">
			{#each question.options as option, index}
				{@const isSelected = selectedAnswer === option}
				{@const isCorrectOption = option === question.correctAnswer}
				<button
					type="button"
					class="px-lg py-md rounded-button text-left transition-all duration-fast border-2 {!hasAnswered
						? 'border-border bg-surface hover:border-accent hover:bg-subtle'
						: isCorrectOption
							? 'border-green-600 dark:border-green-400 bg-green-500/10'
							: isSelected
								? 'border-red-600 dark:border-red-400 bg-red-500/10'
								: 'border-border bg-subtle opacity-60'}"
					onclick={() => handleAnswer(option)}
					disabled={hasAnswered}
				>
					<span class="text-xs text-tertiary mr-sm">{index + 1}</span>
					<span class="text-primary">{option}</span>
				</button>
			{/each}
		</div>
	{:else if question.type === 'true_false'}
		<div class="flex gap-sm">
			{#each ['True', 'False'] as option}
				{@const isSelected = selectedAnswer === option}
				{@const isCorrectOption = option === question.correctAnswer}
				<button
					type="button"
					class="flex-1 px-lg py-md rounded-button text-center font-medium transition-all duration-fast border-2 {!hasAnswered
						? 'border-border bg-surface hover:border-accent hover:bg-subtle'
						: isCorrectOption
							? 'border-green-600 dark:border-green-400 bg-green-500/10'
							: isSelected
								? 'border-red-600 dark:border-red-400 bg-red-500/10'
								: 'border-border bg-subtle opacity-60'}"
					onclick={() => handleAnswer(option)}
					disabled={hasAnswered}
				>
					{option}
					<span class="text-xs text-tertiary ml-sm">
						({option === 'True' ? 'T' : 'F'})
					</span>
				</button>
			{/each}
		</div>
	{:else if question.type === 'short_answer'}
		<div class="space-y-sm">
			<input
				type="text"
				class="input"
				placeholder="Type your answer..."
				bind:value={selectedAnswer}
				disabled={hasAnswered}
			/>
			{#if !hasAnswered}
				<Button
					onclick={() => selectedAnswer.trim() && handleAnswer(selectedAnswer)}
					disabled={!selectedAnswer.trim()}
					fullWidth
				>
					Submit Answer
				</Button>
			{/if}
		</div>
	{/if}

	<!-- Feedback after answering -->
	{#if hasAnswered}
		<Card padding="lg" class="border-2 {isCorrect ? 'border-green-600 dark:border-green-400' : 'border-red-600 dark:border-red-400'}">
			<div class="flex gap-sm items-start">
				{#if isCorrect}
					<CheckCircle size={20} class="text-green-600 dark:text-green-400 flex-shrink-0 mt-xs" />
				{:else}
					<XCircle size={20} class="text-red-600 dark:text-red-400 flex-shrink-0 mt-xs" />
				{/if}
				<div class="flex-1">
					<p class="font-medium text-primary mb-xs">
						{isCorrect ? 'Correct!' : 'Incorrect'}
					</p>
					{#if !isCorrect || question.type === 'short_answer'}
						<p class="text-sm text-secondary mb-sm">
							Correct answer: <span class="font-medium text-primary"
								>{question.correctAnswer}</span
							>
						</p>
					{/if}
					<p class="text-sm text-secondary">
						{question.explanation}
					</p>
				</div>
			</div>
		</Card>

		<div class="flex justify-end">
			<Button onclick={handleNext}>Next</Button>
		</div>
	{/if}
</div>
