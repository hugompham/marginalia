/**
 * FSRS (Free Spaced Repetition Scheduler) Integration
 *
 * Wraps the ts-fsrs library to provide spaced repetition scheduling
 * for flashcard reviews. FSRS optimizes review intervals based on
 * memory stability and difficulty to maximize retention efficiency.
 *
 * @module services/spaced-repetition/fsrs
 *
 * @see {@link https://github.com/open-spaced-repetition/ts-fsrs} ts-fsrs library
 * @see {@link https://github.com/open-spaced-repetition/fsrs4anki/wiki/Algorithm-Overview} FSRS Algorithm
 */

import { createEmptyCard, fsrs, generatorParameters, Rating, State } from 'ts-fsrs';
import type { Card as FSRSCard, RecordLog } from 'ts-fsrs';
import type { Card, CardState, Rating as AppRating } from '$lib/types';

/**
 * FSRS scheduler instance configured for optimal retention.
 *
 * Parameters:
 * - request_retention: 0.9 (target 90% recall rate)
 * - maximum_interval: 36,500 days (100 years max)
 * - enable_fuzz: true (adds randomness to prevent review clustering)
 */
const f = fsrs(
	generatorParameters({
		request_retention: 0.9,
		maximum_interval: 365 * 100,
		enable_fuzz: true
	})
);

/** Maps application rating strings to ts-fsrs Rating enum values */
const ratingMap: Record<AppRating, Rating> = {
	again: Rating.Again,
	hard: Rating.Hard,
	good: Rating.Good,
	easy: Rating.Easy
};

/** Maps ts-fsrs State enum to application CardState strings */
const stateMap: Record<State, CardState> = {
	[State.New]: 'new',
	[State.Learning]: 'learning',
	[State.Review]: 'review',
	[State.Relearning]: 'relearning'
};

/** Maps application CardState strings to ts-fsrs State enum */
const reverseStateMap: Record<CardState, State> = {
	new: State.New,
	learning: State.Learning,
	review: State.Review,
	relearning: State.Relearning
};

/**
 * Converts application Card to ts-fsrs Card format
 *
 * @param card - Application card with scheduling state
 * @returns ts-fsrs compatible card object
 */
export function toFSRSCard(card: Card): FSRSCard {
	return {
		due: card.due,
		stability: card.stability,
		difficulty: card.difficulty,
		elapsed_days: card.elapsedDays,
		scheduled_days: card.scheduledDays,
		reps: card.reps,
		lapses: card.lapses,
		state: reverseStateMap[card.state],
		last_review: card.lastReview ?? undefined
	};
}

/**
 * Converts ts-fsrs Card back to application Card fields
 *
 * @param fsrsCard - ts-fsrs card object after scheduling
 * @returns Partial Card with updated scheduling fields
 */
export function fromFSRSCard(fsrsCard: FSRSCard): Partial<Card> {
	return {
		stability: fsrsCard.stability,
		difficulty: fsrsCard.difficulty,
		elapsedDays: fsrsCard.elapsed_days,
		scheduledDays: fsrsCard.scheduled_days,
		reps: fsrsCard.reps,
		lapses: fsrsCard.lapses,
		state: stateMap[fsrsCard.state],
		lastReview: fsrsCard.last_review ?? null,
		due: fsrsCard.due
	};
}

/**
 * Creates a new card with default FSRS values
 *
 * Initial state: new, stability: 0, difficulty: 0, due: now
 *
 * @returns Partial Card with default scheduling fields
 *
 * @example
 * ```ts
 * const defaults = createNewCard();
 * const card = { ...cardContent, ...defaults };
 * ```
 */
export function createNewCard(): Partial<Card> {
	const emptyCard = createEmptyCard();
	return fromFSRSCard(emptyCard);
}

/**
 * Scheduling options for all possible rating choices
 *
 * Each option contains the resulting card state and
 * a human-readable interval string for display.
 */
export interface SchedulingOptions {
	/** Result if user rates "Again" (complete failure) */
	again: { card: Partial<Card>; interval: string };
	/** Result if user rates "Hard" (difficult recall) */
	hard: { card: Partial<Card>; interval: string };
	/** Result if user rates "Good" (successful recall) */
	good: { card: Partial<Card>; interval: string };
	/** Result if user rates "Easy" (effortless recall) */
	easy: { card: Partial<Card>; interval: string };
}

/**
 * Calculates scheduling options for all possible ratings
 *
 * Returns what would happen to the card for each rating choice,
 * allowing the UI to display interval previews on rating buttons.
 *
 * @param card - Card to calculate scheduling for
 * @param now - Current time (defaults to now)
 * @returns Scheduling options for all four ratings
 *
 * @example
 * ```ts
 * const options = getSchedulingOptions(card);
 * // options.good.interval might be "2d" (2 days)
 * // options.again.interval might be "10m" (10 minutes)
 * ```
 */
export function getSchedulingOptions(card: Card, now: Date = new Date()): SchedulingOptions {
	const fsrsCard = toFSRSCard(card);
	const schedulingCards = f.repeat(fsrsCard, now);

	return {
		again: {
			card: fromFSRSCard(schedulingCards[Rating.Again].card),
			interval: formatInterval(schedulingCards[Rating.Again].card.due, now)
		},
		hard: {
			card: fromFSRSCard(schedulingCards[Rating.Hard].card),
			interval: formatInterval(schedulingCards[Rating.Hard].card.due, now)
		},
		good: {
			card: fromFSRSCard(schedulingCards[Rating.Good].card),
			interval: formatInterval(schedulingCards[Rating.Good].card.due, now)
		},
		easy: {
			card: fromFSRSCard(schedulingCards[Rating.Easy].card),
			interval: formatInterval(schedulingCards[Rating.Easy].card.due, now)
		}
	};
}

/**
 * Processes a card review and returns updated scheduling state
 *
 * This is the main function called when a user rates a card.
 * It calculates the new stability, difficulty, and due date
 * based on the FSRS algorithm.
 *
 * @param card - Card being reviewed
 * @param rating - User's rating (again/hard/good/easy)
 * @param now - Review timestamp (defaults to now)
 * @returns Updated card fields and review log
 *
 * @example
 * ```ts
 * const { updatedCard } = processReview(card, 'good');
 * await updateCardInDatabase(card.id, updatedCard);
 * ```
 */
export function processReview(
	card: Card,
	rating: AppRating,
	now: Date = new Date()
): { updatedCard: Partial<Card>; log: RecordLog } {
	const fsrsCard = toFSRSCard(card);
	const schedulingCards = f.repeat(fsrsCard, now);
	const result = schedulingCards[ratingMap[rating]];

	return {
		updatedCard: fromFSRSCard(result.card),
		log: result
	};
}

/**
 * Formats a time interval for display
 *
 * Converts the difference between two dates into a human-readable
 * format suitable for display on rating buttons.
 *
 * @param dueDate - Future due date
 * @param now - Reference time (defaults to now)
 * @returns Formatted interval (e.g., "1m", "2h", "3d", "2w", "1mo")
 *
 * @example
 * ```ts
 * formatInterval(new Date('2024-01-03'), new Date('2024-01-01'))
 * // Returns "2d"
 * ```
 */
export function formatInterval(dueDate: Date, now: Date = new Date()): string {
	const diffMs = dueDate.getTime() - now.getTime();
	const diffMinutes = Math.round(diffMs / (1000 * 60));
	const diffHours = Math.round(diffMs / (1000 * 60 * 60));
	const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
	const diffWeeks = Math.round(diffDays / 7);
	const diffMonths = Math.round(diffDays / 30);

	if (diffMinutes < 60) {
		return `${Math.max(1, diffMinutes)}m`;
	}
	if (diffHours < 24) {
		return `${diffHours}h`;
	}
	if (diffDays < 7) {
		return `${diffDays}d`;
	}
	if (diffWeeks < 4) {
		return `${diffWeeks}w`;
	}
	return `${diffMonths}mo`;
}

/**
 * Calculates the probability of successfully recalling a card
 *
 * Uses the FSRS forgetting curve formula based on stability
 * and time elapsed since last review.
 *
 * @param card - Card to calculate retrievability for
 * @param now - Current time (defaults to now)
 * @returns Probability between 0 and 1 (1 = certain recall)
 *
 * @example
 * ```ts
 * const prob = getRetrievability(card);
 * if (prob < 0.9) {
 *   // Card should be reviewed soon
 * }
 * ```
 */
export function getRetrievability(card: Card, now: Date = new Date()): number {
	if (card.state === 'new') return 1;

	const elapsedDays =
		(now.getTime() - (card.lastReview?.getTime() ?? now.getTime())) / (1000 * 60 * 60 * 24);

	if (card.stability === 0) return 1;

	// FSRS retrievability formula
	return Math.exp((Math.log(0.9) / card.stability) * elapsedDays);
}

/**
 * Sorts cards by review urgency
 *
 * Prioritization order:
 * 1. Due cards come before non-due cards
 * 2. Among due cards, lower retrievability = more urgent
 * 3. Among non-due cards, earlier due date = more urgent
 *
 * @param cards - Array of cards to sort
 * @param now - Current time for due calculations (defaults to now)
 * @returns New array sorted by urgency (most urgent first)
 *
 * @example
 * ```ts
 * const sorted = sortCardsByUrgency(cards);
 * const nextCard = sorted[0]; // Most urgent card
 * ```
 */
export function sortCardsByUrgency(cards: Card[], now: Date = new Date()): Card[] {
	return [...cards].sort((a, b) => {
		// Due cards first
		const aDue = a.due.getTime() <= now.getTime();
		const bDue = b.due.getTime() <= now.getTime();

		if (aDue && !bDue) return -1;
		if (!aDue && bDue) return 1;

		// Among due cards, sort by retrievability (lower first = more urgent)
		if (aDue && bDue) {
			return getRetrievability(a, now) - getRetrievability(b, now);
		}

		// Among not due cards, sort by due date
		return a.due.getTime() - b.due.getTime();
	});
}
