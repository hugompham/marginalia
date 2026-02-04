/**
 * Review Session Store
 *
 * Manages the state of an active review session including card queue,
 * current position, timing, and results. Integrates with FSRS for
 * scheduling calculations.
 *
 * @module stores/review
 */

import { writable, derived } from 'svelte/store';
import type { Card, Rating } from '$lib/types';
import { getSchedulingOptions, processReview, type SchedulingOptions } from '$lib/services/spaced-repetition/fsrs';

/**
 * Result of a single card review
 */
export interface ReviewResult {
	/** ID of the reviewed card */
	cardId: string;
	/** User's rating for this review */
	rating: Rating;
	/** Time spent on this card in milliseconds */
	durationMs: number;
	/** Card stability before this review */
	stabilityBefore: number;
	/** Card difficulty before this review */
	difficultyBefore: number;
	/** Card state before this review */
	stateBefore: Card['state'];
}

/**
 * State of an active review session
 */
export interface ReviewSessionState {
	/** Cards in the review queue */
	cards: Card[];
	/** Index of the current card being reviewed */
	currentIndex: number;
	/** When the session started */
	startedAt: Date;
	/** When the current card was shown */
	cardStartedAt: Date;
	/** Results for completed reviews */
	results: ReviewResult[];
	/** Whether the session is complete */
	isComplete: boolean;
}

function createReviewStore() {
	const { subscribe, set, update } = writable<ReviewSessionState | null>(null);

	return {
		subscribe,

		/**
		 * Start a new review session with the given cards
		 */
		startSession(cards: Card[]) {
			const now = new Date();
			set({
				cards,
				currentIndex: 0,
				startedAt: now,
				cardStartedAt: now,
				results: [],
				isComplete: cards.length === 0
			});
		},

		/**
		 * Record an answer for the current card
		 */
		answerCard(rating: Rating) {
			update((session) => {
				if (!session || session.isComplete) return session;

				const card = session.cards[session.currentIndex];
				const now = new Date();
				const durationMs = now.getTime() - session.cardStartedAt.getTime();

				// Process the review with FSRS
				const { updatedCard } = processReview(card, rating, now);

				// Record the result
				const result: ReviewResult = {
					cardId: card.id,
					rating,
					durationMs,
					stabilityBefore: card.stability,
					difficultyBefore: card.difficulty,
					stateBefore: card.state
				};

				// Update the card in the session (for potential relearning)
				const updatedCards = [...session.cards];
				updatedCards[session.currentIndex] = {
					...card,
					...updatedCard
				};

				const nextIndex = session.currentIndex + 1;
				const isComplete = nextIndex >= session.cards.length;

				return {
					...session,
					cards: updatedCards,
					currentIndex: nextIndex,
					cardStartedAt: now,
					results: [...session.results, result],
					isComplete
				};
			});
		},

		/**
		 * Skip the current card (move to end of queue)
		 */
		skipCard() {
			update((session) => {
				if (!session || session.isComplete) return session;

				// Move current card to end
				const cards = [...session.cards];
				const [skipped] = cards.splice(session.currentIndex, 1);
				cards.push(skipped);

				return {
					...session,
					cards,
					cardStartedAt: new Date()
				};
			});
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
		 * Clear the session
		 */
		clearSession() {
			set(null);
		}
	};
}

/** Main review session store instance */
export const reviewSession = createReviewStore();

/**
 * The card currently being reviewed (null if session complete or not started)
 */
export const currentCard = derived(reviewSession, ($session) =>
	$session && !$session.isComplete ? $session.cards[$session.currentIndex] : null
);

/**
 * Progress through the current session (current position, total, percentage)
 */
export const sessionProgress = derived(reviewSession, ($session) =>
	$session
		? {
				current: Math.min($session.currentIndex + 1, $session.cards.length),
				total: $session.cards.length,
				percent: ($session.results.length / $session.cards.length) * 100
			}
		: null
);

/**
 * FSRS scheduling options for the current card (intervals for each rating)
 */
export const currentSchedulingOptions = derived(currentCard, ($card): SchedulingOptions | null =>
	$card ? getSchedulingOptions($card) : null
);

/**
 * Session statistics (total cards, duration, rating counts, retention rate)
 */
export const sessionStats = derived(reviewSession, ($session) => {
	if (!$session) return null;

	const results = $session.results;
	const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);

	const ratingCounts = {
		again: results.filter((r) => r.rating === 'again').length,
		hard: results.filter((r) => r.rating === 'hard').length,
		good: results.filter((r) => r.rating === 'good').length,
		easy: results.filter((r) => r.rating === 'easy').length
	};

	const retention =
		results.length > 0
			? ((ratingCounts.good + ratingCounts.easy) / results.length) * 100
			: 0;

	return {
		totalCards: results.length,
		totalDuration,
		avgDuration: results.length > 0 ? totalDuration / results.length : 0,
		ratingCounts,
		retention: Math.round(retention)
	};
});
