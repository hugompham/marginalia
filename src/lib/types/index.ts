/**
 * Core type definitions for Marginalia
 * @module types
 */

// =============================================================================
// Enums and Literal Types
// =============================================================================

/**
 * Type of question generated from a highlight
 * - cloze: Fill-in-the-blank style questions
 * - definition: "What is X?" style questions
 * - conceptual: "Why/How" deeper understanding questions
 */
export type QuestionType = 'cloze' | 'definition' | 'conceptual';

/**
 * FSRS card state indicating the learning phase
 * - new: Card has never been reviewed
 * - learning: Card is being initially learned
 * - review: Card is in the review phase (graduated)
 * - relearning: Card was forgotten and is being relearned
 */
export type CardState = 'new' | 'learning' | 'review' | 'relearning';

/**
 * User rating for a card during review
 * - again: Complete failure to recall
 * - hard: Recalled with significant difficulty
 * - good: Recalled with acceptable effort
 * - easy: Recalled effortlessly
 */
export type Rating = 'again' | 'hard' | 'good' | 'easy';

/**
 * Source type for a collection of highlights
 */
export type SourceType = 'web_article' | 'manual' | 'kindle' | 'epub' | 'pdf';

/**
 * AI provider for question generation
 */
export type AIProvider = 'openai' | 'anthropic';

/**
 * Difficulty level for AI-generated questions
 * - standard: recall + basic understanding (Bloom's levels 1-2)
 * - challenging: application, analysis, evaluation (Bloom's levels 3-5)
 */
export type Difficulty = 'standard' | 'challenging';

/**
 * Status of a pending question awaiting user review
 */
export type PendingStatus = 'pending' | 'accepted' | 'rejected' | 'edited';

// =============================================================================
// User Entities
// =============================================================================

/**
 * User profile with preferences and settings
 */
export interface Profile {
	/** Unique user identifier (matches auth.users.id) */
	id: string;
	/** User's display name */
	displayName: string | null;
	/** Daily review card goal */
	dailyReviewGoal: number;
	/** Preferred question types for AI generation */
	preferredQuestionTypes: QuestionType[];
	/** UI theme preference */
	theme: 'light' | 'dark';
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Stored API key for AI providers (encrypted at rest)
 */
export interface APIKey {
	id: string;
	userId: string;
	/** AI provider (openai or anthropic) */
	provider: AIProvider;
	/** Model identifier (e.g., gpt-4o-mini) */
	model: string;
	/** Whether this key is currently active */
	isActive: boolean;
	createdAt: Date;
}

// =============================================================================
// Content Entities
// =============================================================================

/**
 * A collection of highlights from a single source (book, article, etc.)
 */
export interface Collection {
	id: string;
	userId: string;
	/** Title of the book, article, or document */
	title: string;
	/** Author name if available */
	author: string | null;
	/** How the collection was imported */
	sourceType: SourceType;
	/** Original URL for web articles */
	sourceUrl: string | null;
	/** Cover image URL if available */
	coverImageUrl: string | null;
	/** Denormalized count of highlights */
	highlightCount: number;
	/** Denormalized count of cards */
	cardCount: number;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * A highlighted passage from a collection
 */
export interface Highlight {
	id: string;
	/** Parent collection ID */
	collectionId: string;
	userId: string;
	/** The highlighted text content */
	text: string;
	/** User's personal note about the highlight */
	note: string | null;
	/** Chapter or section name */
	chapter: string | null;
	/** Page number if from a book */
	pageNumber: number | null;
	/** Location as percentage through the document */
	locationPercent: number | null;
	/** Text before the highlight for context */
	contextBefore: string | null;
	/** Text after the highlight for context */
	contextAfter: string | null;
	/** Whether cards have been generated from this highlight */
	hasCards: boolean;
	/** Whether the highlight is archived */
	isArchived: boolean;
	createdAt: Date;
	updatedAt: Date;

	// Joined data (populated when needed)
	collection?: Collection;
	tags?: Tag[];
	cards?: Card[];
}

/**
 * A tag for organizing highlights
 */
export interface Tag {
	id: string;
	userId: string;
	/** Tag name (e.g., "important", "review later") */
	name: string;
	/** Hex color code for display */
	color: string | null;
}

// =============================================================================
// Spaced Repetition Entities
// =============================================================================

/**
 * A flashcard generated from a highlight
 * Contains both content and FSRS scheduling state
 */
export interface Card {
	id: string;
	/** Source highlight ID */
	highlightId: string;
	userId: string;
	/** Type of question */
	questionType: QuestionType;
	/** Question text (for definition/conceptual types) */
	question: string;
	/** Answer text */
	answer: string;
	/** Full text with cloze markers for cloze type (e.g., "The {{c1::answer}} is here") */
	clozeText: string | null;
	/** Whether this card was AI-generated */
	isAiGenerated: boolean;
	/** AI confidence score (0-1) if AI-generated */
	aiConfidence: number | null;

	// FSRS algorithm state
	/** Memory stability (higher = more stable memory) */
	stability: number;
	/** Card difficulty (higher = harder to remember) */
	difficulty: number;
	/** Days since last review */
	elapsedDays: number;
	/** Days until next scheduled review */
	scheduledDays: number;
	/** Total number of reviews */
	reps: number;
	/** Number of times card was forgotten (rated "again") */
	lapses: number;
	/** Current learning state */
	state: CardState;
	/** Timestamp of last review */
	lastReview: Date | null;
	/** When the card is next due for review */
	due: Date;

	/** Whether the card is suspended from review */
	isSuspended: boolean;
	createdAt: Date;
	updatedAt: Date;

	// Joined data
	highlight?: Highlight;
}

/**
 * Record of a single review event
 */
export interface Review {
	id: string;
	cardId: string;
	userId: string;
	/** User's rating for this review */
	rating: Rating;
	/** Card stability before this review */
	stabilityBefore: number;
	/** Card difficulty before this review */
	difficultyBefore: number;
	/** Card state before this review */
	stateBefore: CardState;
	/** Time spent on this review in milliseconds */
	durationMs: number | null;
	/** When the review occurred */
	reviewedAt: Date;
}

/**
 * A question awaiting user approval before becoming a card
 */
export interface PendingQuestion {
	id: string;
	highlightId: string;
	userId: string;
	questionType: QuestionType;
	question: string;
	answer: string;
	clozeText: string | null;
	/** AI confidence score (0-1) */
	aiConfidence: number | null;
	/** Approval status */
	status: PendingStatus;
	createdAt: Date;
}

// =============================================================================
// FSRS Algorithm Types
// =============================================================================

/**
 * FSRS card state used by the scheduling algorithm
 * Subset of Card containing only scheduling-relevant fields
 */
export interface FSRSCard {
	stability: number;
	difficulty: number;
	elapsedDays: number;
	scheduledDays: number;
	reps: number;
	lapses: number;
	state: CardState;
	lastReview: Date | null;
}

/**
 * Scheduling information for a potential rating
 */
export interface SchedulingInfo {
	/** Updated card state if this rating is chosen */
	card: FSRSCard;
	/** Next due date if this rating is chosen */
	due: Date;
	/** The rating this info corresponds to */
	rating: Rating;
}

// =============================================================================
// Session and Statistics Types
// =============================================================================

/**
 * State of an active review session
 */
export interface ReviewSession {
	/** Cards to review in this session */
	cards: Card[];
	/** Index of the current card */
	currentIndex: number;
	/** When the session started */
	startedAt: Date;
	/** Results for each reviewed card */
	results: Array<{
		cardId: string;
		rating: Rating;
		/** Time spent on this card in milliseconds */
		duration: number;
	}>;
}

/**
 * Dashboard statistics summary
 */
export interface DashboardStats {
	/** Number of cards due for review today */
	dueToday: number;
	/** Number of cards reviewed today */
	reviewedToday: number;
	/** Current review streak in days */
	streak: number;
	/** Total number of active cards */
	totalCards: number;
	/** Retention rate as percentage (0-100) */
	retentionRate: number;
}

/**
 * Daily review data for weekly chart
 */
export interface WeeklyReviewData {
	date: Date;
	/** Number of reviews on this day */
	count: number;
	/** Total review duration in milliseconds */
	duration: number;
}

// =============================================================================
// AI Generation Types
// =============================================================================

/**
 * Request to generate questions from highlights
 */
export interface GenerationRequest {
	/** IDs of highlights to generate questions from */
	highlightIds: string[];
	/** Types of questions to generate */
	questionTypes: QuestionType[];
	/** AI provider to use */
	provider: AIProvider;
	/** Model identifier */
	model: string;
	/** Difficulty level for generated questions */
	difficulty?: Difficulty;
}

/**
 * AI-generated question before user approval
 */
export interface GeneratedQuestion {
	/** Source highlight ID */
	highlightId: string;
	questionType: QuestionType;
	question: string;
	answer: string;
	/** Cloze text with markers (only for cloze type) */
	clozeText?: string;
	/** AI confidence score (0-1) */
	confidence: number;
}

// =============================================================================
// Input Types (for creation operations)
// =============================================================================

/**
 * Input for creating a new collection
 */
export interface CreateCollectionInput {
	title: string;
	author?: string;
	sourceType: SourceType;
	sourceUrl?: string;
}

/**
 * Input for creating a new highlight
 */
export interface CreateHighlightInput {
	text: string;
	note?: string;
	chapter?: string;
	pageNumber?: number;
	locationPercent?: number;
	contextBefore?: string;
	contextAfter?: string;
}

/**
 * Input for paste import (manual highlight entry)
 */
export interface PasteImportInput {
	title: string;
	author?: string;
	/** Raw highlight texts to import */
	highlights: string[];
}

/**
 * Result from scraping a web article
 */
export interface ScrapedArticle {
	title: string;
	author: string | null;
	/** Formatted article content */
	content: string;
	/** Plain text content */
	textContent: string;
	/** Article description/excerpt */
	excerpt: string;
	/** Website name */
	siteName: string | null;
	/** Publication timestamp */
	publishedTime: string | null;
}
