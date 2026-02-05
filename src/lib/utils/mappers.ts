/**
 * Type-safe mappers for converting database snake_case to TypeScript camelCase
 * @module mappers
 */

import type {
	Collection,
	Highlight,
	Card,
	Review,
	Tag,
	Profile,
	APIKey,
	PendingQuestion,
	QuestionType,
	CardState,
	Rating,
	SourceType,
	AIProvider,
	PendingStatus
} from '$lib/types';
import type { Database } from '$lib/types/database';

// Database row types
type DbCollection = Database['public']['Tables']['collections']['Row'];
type DbHighlight = Database['public']['Tables']['highlights']['Row'];
type DbCard = Database['public']['Tables']['cards']['Row'];
type DbReview = Database['public']['Tables']['reviews']['Row'];
type DbTag = Database['public']['Tables']['tags']['Row'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbAPIKey = Database['public']['Tables']['api_keys']['Row'];
type DbPendingQuestion = Database['public']['Tables']['pending_questions']['Row'];

/**
 * Map database collection to TypeScript Collection
 */
export function mapCollection(row: DbCollection): Collection {
	return {
		id: row.id,
		userId: row.user_id,
		title: row.title,
		author: row.author,
		sourceType: row.source_type as SourceType,
		sourceUrl: row.source_url,
		coverImageUrl: row.cover_image_url,
		highlightCount: row.highlight_count ?? 0,
		cardCount: row.card_count ?? 0,
		createdAt: new Date(row.created_at!),
		updatedAt: new Date(row.updated_at!)
	};
}

/**
 * Map database highlight to TypeScript Highlight
 */
export function mapHighlight(row: DbHighlight): Highlight {
	return {
		id: row.id,
		collectionId: row.collection_id,
		userId: row.user_id,
		text: row.text,
		note: row.note,
		chapter: row.chapter,
		pageNumber: row.page_number,
		locationPercent: row.location_percent,
		contextBefore: row.context_before,
		contextAfter: row.context_after,
		hasCards: row.has_cards ?? false,
		isArchived: row.is_archived ?? false,
		createdAt: new Date(row.created_at!),
		updatedAt: new Date(row.updated_at!)
	};
}

/**
 * Map database card to TypeScript Card
 */
export function mapCard(row: DbCard): Card {
	return {
		id: row.id,
		highlightId: row.highlight_id,
		userId: row.user_id,
		questionType: row.question_type as QuestionType,
		question: row.question,
		answer: row.answer,
		clozeText: row.cloze_text,
		isAiGenerated: row.is_ai_generated ?? false,
		aiConfidence: row.ai_confidence,
		stability: row.stability ?? 0,
		difficulty: row.difficulty ?? 0,
		elapsedDays: row.elapsed_days ?? 0,
		scheduledDays: row.scheduled_days ?? 0,
		reps: row.reps ?? 0,
		lapses: row.lapses ?? 0,
		state: (row.state as CardState) ?? 'new',
		lastReview: row.last_review ? new Date(row.last_review) : null,
		due: new Date(row.due!),
		isSuspended: row.is_suspended ?? false,
		createdAt: new Date(row.created_at!),
		updatedAt: new Date(row.updated_at!)
	};
}

/**
 * Map database review to TypeScript Review
 */
export function mapReview(row: DbReview): Review {
	return {
		id: row.id,
		cardId: row.card_id,
		userId: row.user_id,
		rating: row.rating as Rating,
		stabilityBefore: row.stability_before ?? 0,
		difficultyBefore: row.difficulty_before ?? 0,
		stateBefore: row.state_before as CardState,
		durationMs: row.duration_ms,
		reviewedAt: new Date(row.reviewed_at!)
	};
}

/**
 * Map database tag to TypeScript Tag
 */
export function mapTag(row: DbTag): Tag {
	return {
		id: row.id,
		userId: row.user_id,
		name: row.name,
		color: row.color
	};
}

/**
 * Map database profile to TypeScript Profile
 */
export function mapProfile(row: DbProfile): Profile {
	return {
		id: row.id,
		displayName: row.display_name,
		dailyReviewGoal: row.daily_review_goal ?? 20,
		preferredQuestionTypes: (row.preferred_question_types as QuestionType[]) ?? [
			'definition',
			'conceptual'
		],
		theme: (row.theme as 'light' | 'dark') ?? 'light',
		createdAt: new Date(row.created_at!),
		updatedAt: new Date(row.updated_at!)
	};
}

/**
 * Map database API key to TypeScript APIKey
 */
export function mapAPIKey(row: DbAPIKey): APIKey {
	return {
		id: row.id,
		userId: row.user_id,
		provider: row.provider as AIProvider,
		model: row.model,
		isActive: row.is_active ?? true,
		createdAt: new Date(row.created_at!)
	};
}

/**
 * Map database pending question to TypeScript PendingQuestion
 */
export function mapPendingQuestion(row: DbPendingQuestion): PendingQuestion {
	return {
		id: row.id,
		highlightId: row.highlight_id,
		userId: row.user_id,
		questionType: row.question_type as QuestionType,
		question: row.question,
		answer: row.answer,
		clozeText: row.cloze_text,
		aiConfidence: row.ai_confidence,
		status: (row.status as PendingStatus) ?? 'pending',
		createdAt: new Date(row.created_at!)
	};
}

/**
 * Batch map collections
 */
export function mapCollections(rows: DbCollection[]): Collection[] {
	return rows.map(mapCollection);
}

/**
 * Batch map highlights
 */
export function mapHighlights(rows: DbHighlight[]): Highlight[] {
	return rows.map(mapHighlight);
}

/**
 * Batch map cards
 */
export function mapCards(rows: DbCard[]): Card[] {
	return rows.map(mapCard);
}

/**
 * Batch map reviews
 */
export function mapReviews(rows: DbReview[]): Review[] {
	return rows.map(mapReview);
}

/**
 * Batch map tags
 */
export function mapTags(rows: DbTag[]): Tag[] {
	return rows.map(mapTag);
}

/**
 * Batch map pending questions
 */
export function mapPendingQuestions(rows: DbPendingQuestion[]): PendingQuestion[] {
	return rows.map(mapPendingQuestion);
}
