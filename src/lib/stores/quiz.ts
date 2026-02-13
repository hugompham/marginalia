/**
 * Quiz Session Store
 *
 * Manages the state of an active quiz session including question queue,
 * current position, timing, and results. No FSRS dependency -- pure
 * client-side state machine for one-off quiz sessions.
 *
 * @module stores/quiz
 */

import { writable, derived } from 'svelte/store';
import type { QuizQuestion, QuizAnswer, QuizSession, QuizResults } from '$lib/types';

function createQuizStore() {
	const { subscribe, set, update } = writable<QuizSession | null>(null);

	return {
		subscribe,

		/**
		 * Start a new quiz session with the given questions
		 */
		startSession(questions: QuizQuestion[], collectionId: string, collectionTitle: string) {
			const now = new Date();
			set({
				collectionId,
				collectionTitle,
				questions,
				currentIndex: 0,
				answers: [],
				startedAt: now,
				questionStartedAt: now,
				isComplete: questions.length === 0
			});
		},

		/**
		 * Record an answer for the current question
		 * Returns the QuizAnswer or null if session is inactive/complete
		 */
		answerQuestion(userAnswer: string, isCorrect: boolean): QuizAnswer | null {
			let result: QuizAnswer | null = null;

			update((session) => {
				if (!session || session.isComplete) return session;

				const now = new Date();
				const answer: QuizAnswer = {
					questionIndex: session.currentIndex,
					userAnswer,
					isCorrect,
					timeMs: now.getTime() - session.questionStartedAt.getTime()
				};
				result = answer;

				const nextIndex = session.currentIndex + 1;

				return {
					...session,
					answers: [...session.answers, answer],
					currentIndex: nextIndex,
					isComplete: nextIndex >= session.questions.length,
					questionStartedAt: now
				};
			});

			return result;
		},

		/**
		 * Skip the current question (recorded as incorrect with empty answer)
		 */
		skipQuestion(): QuizAnswer | null {
			return this.answerQuestion('', false);
		},

		/**
		 * End the session early
		 */
		endSession() {
			update((session) => {
				if (!session) return null;
				return { ...session, isComplete: true };
			});
		},

		/**
		 * Clear the session entirely
		 */
		clearSession() {
			set(null);
		}
	};
}

/** Main quiz session store instance */
export const quizSession = createQuizStore();

/**
 * The question currently being presented (null if session complete or not started)
 */
export const currentQuizQuestion = derived(quizSession, ($session) =>
	$session && !$session.isComplete ? ($session.questions[$session.currentIndex] ?? null) : null
);

/**
 * Progress through the current quiz (1-indexed current, total, percent answered)
 */
export const quizProgress = derived(quizSession, ($session) => {
	if (!$session) return null;
	const total = $session.questions.length;
	const answered = $session.answers.length;
	return {
		current: Math.min($session.currentIndex + 1, total),
		total,
		percent: total > 0 ? Math.round((answered / total) * 100) : 0
	};
});

/**
 * Computed results once the quiz is complete (null while in progress)
 */
export const quizResults = derived(quizSession, ($session): QuizResults | null => {
	if (!$session || !$session.isComplete) return null;

	const { answers, questions, startedAt } = $session;
	const correctCount = answers.filter((a) => a.isCorrect).length;
	const totalQuestions = questions.length;
	const totalTimeMs = Date.now() - startedAt.getTime();

	return {
		totalQuestions,
		correctCount,
		scorePercent: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
		totalTimeMs,
		answers
	};
});
