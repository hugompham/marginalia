import { describe, it, expect } from 'vitest';
import {
	mapCollection,
	mapCollections,
	mapHighlight,
	mapHighlights,
	mapCard,
	mapCards,
	mapReview,
	mapTag,
	mapProfile,
	mapAPIKey,
	mapPendingQuestion,
	mapHighlightLink,
	mapHighlightLinks
} from './mappers';
import type { Database } from '$lib/types/database';

type DbCollection = Database['public']['Tables']['collections']['Row'];
type DbHighlight = Database['public']['Tables']['highlights']['Row'];
type DbCard = Database['public']['Tables']['cards']['Row'];
type DbReview = Database['public']['Tables']['reviews']['Row'];
type DbTag = Database['public']['Tables']['tags']['Row'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbAPIKey = Database['public']['Tables']['api_keys']['Row'];
type DbPendingQuestion = Database['public']['Tables']['pending_questions']['Row'];

describe('mappers', () => {
	describe('mapCollection', () => {
		it('should map database collection to TypeScript Collection', () => {
			const dbRow: DbCollection = {
				id: '123',
				user_id: 'user123',
				title: 'Test Book',
				author: 'Test Author',
				source_type: 'kindle',
				source_url: null,
				cover_image_url: null,
				highlight_count: 5,
				card_count: 3,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-02T00:00:00Z'
			};

			const result = mapCollection(dbRow);

			expect(result).toEqual({
				id: '123',
				userId: 'user123',
				title: 'Test Book',
				author: 'Test Author',
				sourceType: 'kindle',
				sourceUrl: null,
				coverImageUrl: null,
				highlightCount: 5,
				cardCount: 3,
				createdAt: new Date('2024-01-01T00:00:00Z'),
				updatedAt: new Date('2024-01-02T00:00:00Z')
			});
		});

		it('should handle batch mapping with mapCollections', () => {
			const rows: DbCollection[] = [
				{
					id: '1',
					user_id: 'user1',
					title: 'Book 1',
					author: 'Author 1',
					source_type: 'kindle',
					source_url: null,
					cover_image_url: null,
					highlight_count: 2,
					card_count: 1,
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z'
				},
				{
					id: '2',
					user_id: 'user1',
					title: 'Book 2',
					author: null,
					source_type: 'manual',
					source_url: null,
					cover_image_url: null,
					highlight_count: 1,
					card_count: 0,
					created_at: '2024-01-02T00:00:00Z',
					updated_at: '2024-01-02T00:00:00Z'
				}
			];

			const result = mapCollections(rows);

			expect(result).toHaveLength(2);
			expect(result[0].title).toBe('Book 1');
			expect(result[1].title).toBe('Book 2');
		});
	});

	describe('mapHighlight', () => {
		it('should map database highlight to TypeScript Highlight', () => {
			const dbRow: DbHighlight = {
				id: '123',
				collection_id: 'coll123',
				user_id: 'user123',
				text: 'This is a highlight',
				note: 'My note',
				chapter: 'Chapter 1',
				page_number: 42,
				location_percent: 0.5,
				context_before: 'Before text',
				context_after: 'After text',
				has_cards: true,
				is_archived: false,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-02T00:00:00Z'
			};

			const result = mapHighlight(dbRow);

			expect(result).toEqual({
				id: '123',
				collectionId: 'coll123',
				userId: 'user123',
				text: 'This is a highlight',
				note: 'My note',
				chapter: 'Chapter 1',
				pageNumber: 42,
				locationPercent: 0.5,
				contextBefore: 'Before text',
				contextAfter: 'After text',
				hasCards: true,
				isArchived: false,
				createdAt: new Date('2024-01-01T00:00:00Z'),
				updatedAt: new Date('2024-01-02T00:00:00Z')
			});
		});

		it('should handle null values with defaults', () => {
			const dbRow: DbHighlight = {
				id: '123',
				collection_id: 'coll123',
				user_id: 'user123',
				text: 'Highlight',
				note: null,
				chapter: null,
				page_number: null,
				location_percent: null,
				context_before: null,
				context_after: null,
				has_cards: null,
				is_archived: null,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			};

			const result = mapHighlight(dbRow);

			expect(result.hasCards).toBe(false);
			expect(result.isArchived).toBe(false);
		});
	});

	describe('mapCard', () => {
		it('should map database card to TypeScript Card', () => {
			const dbRow: DbCard = {
				id: '123',
				highlight_id: 'hl123',
				user_id: 'user123',
				question_type: 'definition',
				question: 'What is X?',
				answer: 'X is Y',
				cloze_text: null,
				is_ai_generated: true,
				ai_confidence: 0.95,
				stability: 2.5,
				difficulty: 5.0,
				elapsed_days: 1,
				scheduled_days: 3,
				reps: 2,
				lapses: 0,
				state: 'review',
				last_review: '2024-01-01T00:00:00Z',
				due: '2024-01-04T00:00:00Z',
				is_suspended: false,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			};

			const result = mapCard(dbRow);

			expect(result).toEqual({
				id: '123',
				highlightId: 'hl123',
				userId: 'user123',
				questionType: 'definition',
				question: 'What is X?',
				answer: 'X is Y',
				clozeText: null,
				isAiGenerated: true,
				aiConfidence: 0.95,
				stability: 2.5,
				difficulty: 5.0,
				elapsedDays: 1,
				scheduledDays: 3,
				reps: 2,
				lapses: 0,
				state: 'review',
				lastReview: new Date('2024-01-01T00:00:00Z'),
				due: new Date('2024-01-04T00:00:00Z'),
				isSuspended: false,
				createdAt: new Date('2024-01-01T00:00:00Z'),
				updatedAt: new Date('2024-01-01T00:00:00Z')
			});
		});

		it('should handle null values with defaults', () => {
			const dbRow: DbCard = {
				id: '123',
				highlight_id: 'hl123',
				user_id: 'user123',
				question_type: 'cloze',
				question: 'Q',
				answer: 'A',
				cloze_text: 'The {{c1::answer}}',
				is_ai_generated: null,
				ai_confidence: null,
				stability: null,
				difficulty: null,
				elapsed_days: null,
				scheduled_days: null,
				reps: null,
				lapses: null,
				state: null,
				last_review: null,
				due: '2024-01-04T00:00:00Z',
				is_suspended: null,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			};

			const result = mapCard(dbRow);

			expect(result.isAiGenerated).toBe(false);
			expect(result.stability).toBe(0);
			expect(result.difficulty).toBe(0);
			expect(result.state).toBe('new');
			expect(result.lastReview).toBeNull();
		});
	});

	describe('mapReview', () => {
		it('should map database review to TypeScript Review', () => {
			const dbRow: DbReview = {
				id: '123',
				card_id: 'card123',
				user_id: 'user123',
				rating: 'good',
				stability_before: 2.0,
				difficulty_before: 5.0,
				state_before: 'review',
				duration_ms: 5000,
				reviewed_at: '2024-01-01T00:00:00Z'
			};

			const result = mapReview(dbRow);

			expect(result).toEqual({
				id: '123',
				cardId: 'card123',
				userId: 'user123',
				rating: 'good',
				stabilityBefore: 2.0,
				difficultyBefore: 5.0,
				stateBefore: 'review',
				durationMs: 5000,
				reviewedAt: new Date('2024-01-01T00:00:00Z')
			});
		});
	});

	describe('mapTag', () => {
		it('should map database tag to TypeScript Tag', () => {
			const dbRow: DbTag = {
				id: '123',
				user_id: 'user123',
				name: 'important',
				color: '#FF0000'
			};

			const result = mapTag(dbRow);

			expect(result).toEqual({
				id: '123',
				userId: 'user123',
				name: 'important',
				color: '#FF0000'
			});
		});
	});

	describe('mapProfile', () => {
		it('should map database profile to TypeScript Profile', () => {
			const dbRow: DbProfile = {
				id: 'user123',
				display_name: 'Test User',
				daily_review_goal: 30,
				preferred_question_types: ['definition', 'cloze'],
				theme: 'dark',
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			};

			const result = mapProfile(dbRow);

			expect(result).toEqual({
				id: 'user123',
				displayName: 'Test User',
				dailyReviewGoal: 30,
				preferredQuestionTypes: ['definition', 'cloze'],
				theme: 'dark',
				createdAt: new Date('2024-01-01T00:00:00Z'),
				updatedAt: new Date('2024-01-01T00:00:00Z')
			});
		});

		it('should handle null values with defaults', () => {
			const dbRow: DbProfile = {
				id: 'user123',
				display_name: null,
				daily_review_goal: null,
				preferred_question_types: null,
				theme: null,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			};

			const result = mapProfile(dbRow);

			expect(result.dailyReviewGoal).toBe(20);
			expect(result.preferredQuestionTypes).toEqual(['definition', 'conceptual']);
			expect(result.theme).toBe('light');
		});
	});

	describe('mapAPIKey', () => {
		it('should map database API key to TypeScript APIKey', () => {
			const dbRow: DbAPIKey = {
				id: '123',
				user_id: 'user123',
				provider: 'openai',
				model: 'gpt-4o-mini',
				encrypted_key: 'encrypted',
				key_hint: 'sk-...1234',
				is_active: true,
				created_at: '2024-01-01T00:00:00Z'
			};

			const result = mapAPIKey(dbRow);

			expect(result).toEqual({
				id: '123',
				userId: 'user123',
				provider: 'openai',
				model: 'gpt-4o-mini',
				isActive: true,
				createdAt: new Date('2024-01-01T00:00:00Z')
			});
		});
	});

	describe('mapPendingQuestion', () => {
		it('should map database pending question to TypeScript PendingQuestion', () => {
			const dbRow: DbPendingQuestion = {
				id: '123',
				highlight_id: 'hl123',
				user_id: 'user123',
				question_type: 'definition',
				question: 'What is X?',
				answer: 'X is Y',
				cloze_text: null,
				ai_confidence: 0.9,
				status: 'pending',
				created_at: '2024-01-01T00:00:00Z'
			};

			const result = mapPendingQuestion(dbRow);

			expect(result).toEqual({
				id: '123',
				highlightId: 'hl123',
				userId: 'user123',
				questionType: 'definition',
				question: 'What is X?',
				answer: 'X is Y',
				clozeText: null,
				aiConfidence: 0.9,
				status: 'pending',
				createdAt: new Date('2024-01-01T00:00:00Z')
			});
		});
	});

	describe('mapHighlightLink', () => {
		it('should map a manual highlight link', () => {
			const dbRow = {
				id: '123',
				source_highlight_id: 'hl1',
				target_highlight_id: 'hl2',
				user_id: 'user123',
				link_type: 'manual',
				description: 'Related concept',
				ai_confidence: null,
				status: 'active',
				created_at: '2024-01-01T00:00:00Z'
			};

			const result = mapHighlightLink(dbRow);

			expect(result).toEqual({
				id: '123',
				sourceHighlightId: 'hl1',
				targetHighlightId: 'hl2',
				userId: 'user123',
				linkType: 'manual',
				description: 'Related concept',
				aiConfidence: null,
				status: 'active',
				createdAt: new Date('2024-01-01T00:00:00Z')
			});
		});

		it('should map an AI-suggested link', () => {
			const dbRow = {
				id: '456',
				source_highlight_id: 'hl3',
				target_highlight_id: 'hl4',
				user_id: 'user123',
				link_type: 'ai_suggested',
				description: 'Both discuss emergence',
				ai_confidence: 0.87,
				status: 'pending',
				created_at: '2024-01-01T00:00:00Z'
			};

			const result = mapHighlightLink(dbRow);

			expect(result.linkType).toBe('ai_suggested');
			expect(result.aiConfidence).toBe(0.87);
			expect(result.status).toBe('pending');
		});

		it('should batch map highlight links', () => {
			const rows = [
				{
					id: '1',
					source_highlight_id: 'a',
					target_highlight_id: 'b',
					user_id: 'u1',
					link_type: 'manual',
					description: null,
					ai_confidence: null,
					status: 'active',
					created_at: '2024-01-01T00:00:00Z'
				},
				{
					id: '2',
					source_highlight_id: 'c',
					target_highlight_id: 'd',
					user_id: 'u1',
					link_type: 'ai_suggested',
					description: 'Test',
					ai_confidence: 0.9,
					status: 'pending',
					created_at: '2024-01-02T00:00:00Z'
				}
			];

			const result = mapHighlightLinks(rows);
			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('1');
			expect(result[1].linkType).toBe('ai_suggested');
		});
	});
});
