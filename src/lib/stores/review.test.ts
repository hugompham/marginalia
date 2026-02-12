import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import type { Card } from '$lib/types';

// Mock the FSRS module before importing the store
vi.mock('$lib/services/spaced-repetition/fsrs', () => ({
	processReview: vi.fn((card: Card, _rating: string) => ({
		updatedCard: {
			stability: card.stability + 1,
			difficulty: card.difficulty,
			reps: card.reps + 1,
			state: 'review' as const,
			due: new Date('2025-01-10')
		},
		log: {}
	})),
	getSchedulingOptions: vi.fn(() => ({
		again: { card: {}, interval: '1m' },
		hard: { card: {}, interval: '6m' },
		good: { card: {}, interval: '1d' },
		easy: { card: {}, interval: '4d' }
	}))
}));

const { reviewSession, currentCard, sessionProgress, currentSchedulingOptions, sessionStats } =
	await import('./review');

function makeCard(overrides: Partial<Card> = {}): Card {
	return {
		id: `card-${Math.random().toString(36).slice(2, 6)}`,
		highlightId: 'hl-1',
		userId: 'user-1',
		questionType: 'conceptual',
		question: 'What is X?',
		answer: 'X is Y',
		clozeText: null,
		isAiGenerated: true,
		aiConfidence: 0.9,
		stability: 1,
		difficulty: 5,
		elapsedDays: 0,
		scheduledDays: 1,
		reps: 0,
		lapses: 0,
		state: 'new',
		lastReview: null,
		due: new Date('2025-01-01'),
		isSuspended: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

describe('Review Session Store', () => {
	beforeEach(() => {
		reviewSession.clearSession();
	});

	describe('startSession', () => {
		it('should initialize session with cards', () => {
			const cards = [makeCard({ id: 'c1' }), makeCard({ id: 'c2' })];
			reviewSession.startSession(cards);

			const session = get(reviewSession);
			expect(session).not.toBeNull();
			expect(session!.cards).toHaveLength(2);
			expect(session!.currentIndex).toBe(0);
			expect(session!.results).toHaveLength(0);
			expect(session!.isComplete).toBe(false);
			expect(session!.skipCount).toBe(0);
		});

		it('should mark session complete immediately if no cards', () => {
			reviewSession.startSession([]);

			const session = get(reviewSession);
			expect(session!.isComplete).toBe(true);
		});
	});

	describe('answerCard', () => {
		it('should advance to next card and record result', () => {
			const cards = [makeCard({ id: 'c1' }), makeCard({ id: 'c2' })];
			reviewSession.startSession(cards);

			const result = reviewSession.answerCard('good');

			expect(result).not.toBeNull();
			expect(result!.cardId).toBe('c1');
			expect(result!.rating).toBe('good');
			expect(result!.durationMs).toBeGreaterThanOrEqual(0);

			const session = get(reviewSession);
			expect(session!.currentIndex).toBe(1);
			expect(session!.results).toHaveLength(1);
			expect(session!.isComplete).toBe(false);
		});

		it('should mark complete after last card', () => {
			reviewSession.startSession([makeCard({ id: 'c1' })]);
			reviewSession.answerCard('good');

			const session = get(reviewSession);
			expect(session!.isComplete).toBe(true);
			expect(session!.results).toHaveLength(1);
		});

		it('should reset skip count on answer', () => {
			const cards = [makeCard({ id: 'c1' }), makeCard({ id: 'c2' }), makeCard({ id: 'c3' })];
			reviewSession.startSession(cards);

			reviewSession.skipCard(); // skip c1

			const session = get(reviewSession);
			expect(session!.skipCount).toBe(1);

			reviewSession.answerCard('good'); // answer c2

			const updated = get(reviewSession);
			expect(updated!.skipCount).toBe(0);
		});

		it('should return null if session is complete', () => {
			reviewSession.startSession([makeCard({ id: 'c1' })]);
			reviewSession.answerCard('good');

			const result = reviewSession.answerCard('easy');
			expect(result).toBeNull();
		});
	});

	describe('skipCard', () => {
		it('should move current card to end of queue', () => {
			const cards = [makeCard({ id: 'c1' }), makeCard({ id: 'c2' }), makeCard({ id: 'c3' })];
			reviewSession.startSession(cards);

			reviewSession.skipCard();

			const session = get(reviewSession);
			// c1 moved to end; currentIndex stays 0, so next card is c2
			expect(session!.cards[0].id).toBe('c2');
			expect(session!.cards[2].id).toBe('c1');
			expect(session!.currentIndex).toBe(0);
			expect(session!.skipCount).toBe(1);
		});

		it('should end session if all remaining cards are skipped', () => {
			const cards = [makeCard({ id: 'c1' }), makeCard({ id: 'c2' })];
			reviewSession.startSession(cards);

			reviewSession.skipCard(); // skip c1 (skipCount=1)
			reviewSession.skipCard(); // skip c2 (skipCount=2, remaining=2) -> complete

			const session = get(reviewSession);
			expect(session!.isComplete).toBe(true);
		});
	});

	describe('endSession', () => {
		it('should mark session as complete', () => {
			reviewSession.startSession([makeCard(), makeCard()]);
			reviewSession.endSession();

			const session = get(reviewSession);
			expect(session!.isComplete).toBe(true);
		});
	});

	describe('clearSession', () => {
		it('should set state to null', () => {
			reviewSession.startSession([makeCard()]);
			reviewSession.clearSession();

			expect(get(reviewSession)).toBeNull();
		});
	});

	describe('derived stores', () => {
		it('currentCard should return the active card', () => {
			const card = makeCard({ id: 'active-card' });
			reviewSession.startSession([card, makeCard()]);

			expect(get(currentCard)!.id).toBe('active-card');
		});

		it('currentCard should be null when session is null', () => {
			expect(get(currentCard)).toBeNull();
		});

		it('currentCard should be null when session is complete', () => {
			reviewSession.startSession([makeCard()]);
			reviewSession.answerCard('good');

			expect(get(currentCard)).toBeNull();
		});

		it('sessionProgress should reflect current position', () => {
			reviewSession.startSession([makeCard(), makeCard(), makeCard()]);

			let progress = get(sessionProgress);
			expect(progress!.current).toBe(1);
			expect(progress!.total).toBe(3);
			expect(progress!.percent).toBe(0);

			reviewSession.answerCard('good');

			progress = get(sessionProgress);
			expect(progress!.current).toBe(2);
			expect(progress!.percent).toBeCloseTo(33.33, 0);
		});

		it('sessionProgress should be null when no session', () => {
			expect(get(sessionProgress)).toBeNull();
		});

		it('currentSchedulingOptions should return options for current card', () => {
			reviewSession.startSession([makeCard()]);
			const options = get(currentSchedulingOptions);
			expect(options).not.toBeNull();
			expect(options!.good.interval).toBe('1d');
		});

		it('sessionStats should track rating counts and retention', () => {
			reviewSession.startSession([makeCard(), makeCard(), makeCard()]);
			reviewSession.answerCard('good');
			reviewSession.answerCard('again');
			reviewSession.answerCard('easy');

			const stats = get(sessionStats);
			expect(stats!.totalCards).toBe(3);
			expect(stats!.ratingCounts.good).toBe(1);
			expect(stats!.ratingCounts.again).toBe(1);
			expect(stats!.ratingCounts.easy).toBe(1);
			// retention = (good + easy) / total * 100 = 2/3 * 100 = 67
			expect(stats!.retention).toBe(67);
		});
	});
});
