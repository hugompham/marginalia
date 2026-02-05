import { describe, it, expect } from 'vitest';
import {
	formatInterval,
	toFSRSCard,
	fromFSRSCard,
	createNewCard
} from './fsrs';
import type { Card, CardState } from '$lib/types';

describe('FSRS Service', () => {
	const createMockCard = (overrides?: Partial<Card>): Card => ({
		id: 'test-card-id',
		highlightId: 'test-highlight-id',
		userId: 'test-user-id',
		questionType: 'factual',
		question: 'What is 2+2?',
		answer: '4',
		clozeText: null,
		isAiGenerated: false,
		aiConfidence: null,
		stability: 0,
		difficulty: 0,
		elapsedDays: 0,
		scheduledDays: 0,
		reps: 0,
		lapses: 0,
		state: 'new' as CardState,
		due: new Date().toISOString(),
		lastReview: new Date().toISOString(),
		isSuspended: false,
		tags: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...overrides
	});

	describe('createNewCard', () => {
		it('should create a card with default FSRS values', () => {
			const card = createNewCard();

			expect(card.state).toBe('new');
			expect(card.stability).toBe(0);
			expect(card.difficulty).toBe(0);
			expect(card.reps).toBe(0);
			expect(card.lapses).toBe(0);
		});
	});

	describe('toFSRSCard and fromFSRSCard', () => {
		it('should convert app card to FSRS card and back', () => {
			const appCard = createMockCard({
				stability: 5.0,
				difficulty: 3.0,
				reps: 2,
				lapses: 1,
				state: 'review',
				elapsedDays: 10,
				scheduledDays: 15
			});

			const fsrsCard = toFSRSCard(appCard);
			expect(fsrsCard).toBeDefined();
			expect(fsrsCard.stability).toBe(5.0);
			expect(fsrsCard.difficulty).toBe(3.0);

			const converted = fromFSRSCard(fsrsCard);
			expect(converted.stability).toBe(5.0);
			expect(converted.difficulty).toBe(3.0);
			expect(converted.reps).toBe(2);
			expect(converted.lapses).toBe(1);
			expect(converted.state).toBe('review');
		});

		it('should preserve all scheduling fields in round-trip conversion', () => {
			const appCard = createMockCard({
				stability: 7.5,
				difficulty: 4.2,
				reps: 3,
				lapses: 2,
				elapsedDays: 15,
				scheduledDays: 20
			});

			const fsrsCard = toFSRSCard(appCard);
			const converted = fromFSRSCard(fsrsCard);

			expect(converted.stability).toBe(appCard.stability);
			expect(converted.difficulty).toBe(appCard.difficulty);
			expect(converted.reps).toBe(appCard.reps);
			expect(converted.lapses).toBe(appCard.lapses);
			expect(converted.elapsedDays).toBe(appCard.elapsedDays);
			expect(converted.scheduledDays).toBe(appCard.scheduledDays);
		});
	});

	describe('formatInterval', () => {
		it('should format minutes correctly', () => {
			const now = new Date();
			const in10Minutes = new Date(now.getTime() + 10 * 60 * 1000);

			const result = formatInterval(in10Minutes, now);

			expect(result).toContain('10');
			expect(result).toContain('m');
		});

		it('should format hours correctly', () => {
			const now = new Date();
			const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

			const result = formatInterval(in2Hours, now);

			expect(result).toContain('2');
			expect(result).toContain('h');
		});

		it('should format days correctly', () => {
			const now = new Date();
			const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

			const result = formatInterval(in3Days, now);

			expect(result).toContain('3');
			expect(result).toContain('d');
		});

		it('should format months correctly', () => {
			const now = new Date();
			const in2Months = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

			const result = formatInterval(in2Months, now);

			expect(result).toContain('mo');
		});

		it('should handle past dates', () => {
			const now = new Date();
			const past = new Date(now.getTime() - 1000);

			const result = formatInterval(past, now);

			// Should return a valid string even for past dates
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});
	});
});
