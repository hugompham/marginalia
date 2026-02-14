<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Card } from '$components/ui';
	import { toast } from '$components/ui/Toast.svelte';
	import { QuizSetupModal, QuizQuestion, QuizProgress, QuizComplete } from '$components/quiz';
	import { quizSession, currentQuizQuestion, quizProgress, quizResults } from '$stores/quiz';
	import { ChevronLeft, X, Brain } from 'lucide-svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let showSetup = $state(true);
	let isGenerating = $state(false);
	let isSaving = $state(false);

	// Reactive store access
	const session = $derived($quizSession);
	const question = $derived($currentQuizQuestion);
	const progress = $derived($quizProgress);
	const results = $derived($quizResults);

	// View states
	const isActive = $derived(session !== null && !session.isComplete);
	const isComplete = $derived(session !== null && session.isComplete);

	async function handleStart(questionCount: number) {
		isGenerating = true;
		try {
			const res = await fetch('/api/quiz/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ collectionId: data.collection.id, questionCount })
			});
			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || 'Failed to generate quiz');
			}
			const { questions } = await res.json();
			if (questions.length === 0) {
				toast.warning('No questions could be generated');
				return;
			}
			quizSession.startSession(questions, data.collection.id, data.collection.title);
			showSetup = false;
			toast.success(`Generated ${questions.length} questions`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to generate quiz');
		} finally {
			isGenerating = false;
		}
	}

	function handleAnswer(userAnswer: string, isCorrect: boolean) {
		quizSession.answerQuestion(userAnswer, isCorrect);
		// Auto-save when complete
		if ($quizSession?.isComplete) {
			saveResults();
		}
	}

	async function saveResults() {
		const currentResults = $quizResults;
		const currentSession = $quizSession;
		if (!currentResults || !currentSession) return;

		isSaving = true;
		try {
			await fetch('/api/quiz/save', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					collectionId: data.collection.id,
					questions: currentSession.questions,
					answers: currentResults.answers,
					totalQuestions: currentResults.totalQuestions,
					correctCount: currentResults.correctCount,
					scorePercent: currentResults.scorePercent,
					durationMs: currentResults.totalTimeMs,
					provider: 'openai'
				})
			});
		} catch {
			// Silent fail on save -- quiz results still shown locally
		} finally {
			isSaving = false;
		}
	}

	function handleClose() {
		// If no answers recorded, just go back
		if (!session?.answers.length) {
			handleBack();
			return;
		}
		quizSession.endSession();
		// Trigger save for early-exit sessions
		if ($quizSession?.isComplete) {
			saveResults();
		}
	}

	function handleTryAgain() {
		quizSession.clearSession();
		showSetup = true;
	}

	function handleBack() {
		quizSession.clearSession();
		goto(`/library/${data.collection.id}`);
	}
</script>

<svelte:head>
	<title>Quiz: {data.collection.title} | Marginalia</title>
</svelte:head>

{#if showSetup && !isActive && !isComplete}
	<!-- Setup state: choose question count -->
	<div class="min-h-screen bg-canvas flex flex-col">
		<header class="flex items-center gap-sm px-lg py-md border-b border-border bg-surface">
			<a
				href="/library/{data.collection.id}"
				class="p-sm rounded-button text-secondary hover:text-primary hover:bg-subtle transition-colors"
				aria-label="Back to collection"
			>
				<ChevronLeft size={20} />
			</a>
			<h1 class="font-heading text-lg text-primary truncate">
				Quiz: {data.collection.title}
			</h1>
		</header>

		<div class="flex-1 flex items-center justify-center p-lg">
			<!-- The modal is rendered inline on this page -->
		</div>
	</div>

	<QuizSetupModal
		open={showSetup}
		highlightCount={data.collection.highlightCount}
		isLoading={isGenerating}
		onstart={handleStart}
		onclose={handleBack}
	/>
{:else if isActive && question && progress}
	<!-- Active quiz session -->
	<div class="min-h-screen bg-canvas flex flex-col">
		<header class="flex items-center justify-between px-lg py-md border-b border-border bg-surface">
			<div class="flex-1 max-w-md">
				<QuizProgress
					current={progress.current}
					total={progress.total}
					answers={session?.answers ?? []}
				/>
			</div>
			<button
				type="button"
				class="p-sm rounded-button text-secondary hover:text-primary hover:bg-subtle transition-colors ml-md"
				onclick={handleClose}
				aria-label="End quiz"
			>
				<X size={20} />
			</button>
		</header>

		<div class="flex-1 flex justify-center overflow-y-auto">
			<div class="w-full max-w-content px-lg py-xl">
				<QuizQuestion
					{question}
					questionNumber={progress.current}
					totalQuestions={progress.total}
					onanswer={handleAnswer}
				/>
			</div>
		</div>
	</div>
{:else if isComplete && results && session}
	<!-- Quiz complete -->
	<div class="min-h-screen bg-canvas flex flex-col">
		<header class="flex items-center gap-sm px-lg py-md border-b border-border bg-surface">
			<h1 class="font-heading text-lg text-primary">Quiz Complete</h1>
		</header>

		<div class="flex-1 flex justify-center overflow-y-auto">
			<div class="w-full max-w-content">
				<QuizComplete
					questions={session.questions}
					{results}
					collectionTitle={data.collection.title}
					ontryagain={handleTryAgain}
					onback={handleBack}
				/>
			</div>
		</div>
	</div>
{:else}
	<!-- Loading state -->
	<div class="min-h-screen bg-canvas flex items-center justify-center">
		<div class="text-center">
			<Brain class="text-accent mx-auto mb-md animate-pulse" size={48} />
			<p class="text-secondary">Loading quiz...</p>
		</div>
	</div>
{/if}
