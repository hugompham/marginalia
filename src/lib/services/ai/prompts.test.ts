import { describe, it, expect, vi } from 'vitest';
import {
	parseGeneratedQuestions,
	buildOpenAIMessages,
	buildAnthropicMessages,
	buildAnthropicSystem,
	buildGenerationPrompt,
	SYSTEM_MESSAGE
} from './prompts';
import type { Highlight, Collection } from '$lib/types';

const mockCollection: Collection = {
	id: 'col-1',
	userId: 'user-1',
	title: 'Thinking, Fast and Slow',
	author: 'Daniel Kahneman',
	sourceType: 'kindle',
	sourceUrl: null,
	coverImageUrl: null,
	highlightCount: 5,
	cardCount: 2,
	createdAt: new Date(),
	updatedAt: new Date()
};

const mockHighlight: Highlight = {
	id: 'h-1',
	collectionId: 'col-1',
	userId: 'user-1',
	text: 'System 1 operates automatically and quickly, with little or no effort and no sense of voluntary control.',
	note: 'Key distinction between the two systems',
	chapter: 'Chapter 1',
	pageNumber: null,
	locationPercent: null,
	contextBefore: null,
	contextAfter: null,
	hasCards: false,
	isArchived: false,
	createdAt: new Date(),
	updatedAt: new Date()
};

describe('AI Prompts', () => {
	describe('parseGeneratedQuestions', () => {
		it('should parse plain JSON array', () => {
			const content = JSON.stringify([
				{
					highlightId: 'h1',
					questionType: 'definition',
					question: 'What is X?',
					answer: 'Y',
					confidence: 0.9
				}
			]);

			const result = parseGeneratedQuestions(content);

			expect(result).toHaveLength(1);
			expect(result[0].highlightId).toBe('h1');
			expect(result[0].questionType).toBe('definition');
			expect(result[0].question).toBe('What is X?');
			expect(result[0].answer).toBe('Y');
			expect(result[0].confidence).toBe(0.9);
		});

		it('should parse JSON wrapped in markdown code block', () => {
			const content = `\`\`\`json
[
  {
    "highlightId": "h1",
    "questionType": "cloze",
    "question": "What is the answer?",
    "answer": "42",
    "clozeText": "The {{c1::42}} is the answer",
    "confidence": 0.95
  }
]
\`\`\``;

			const result = parseGeneratedQuestions(content);

			expect(result).toHaveLength(1);
			expect(result[0].highlightId).toBe('h1');
			expect(result[0].questionType).toBe('cloze');
			expect(result[0].clozeText).toBe('The {{c1::42}} is the answer');
		});

		it('should parse JSON with surrounding text', () => {
			const content = `Here are the questions:

[
  {
    "highlightId": "h1",
    "questionType": "conceptual",
    "question": "Why?",
    "answer": "Because",
    "confidence": 0.8
  }
]

Hope this helps!`;

			const result = parseGeneratedQuestions(content);

			expect(result).toHaveLength(1);
			expect(result[0].questionType).toBe('conceptual');
		});

		it('should filter out incomplete questions', () => {
			const content = JSON.stringify([
				{
					highlightId: 'h1',
					questionType: 'definition',
					question: 'What is X?',
					answer: 'Y',
					confidence: 0.9
				},
				{
					// Missing answer
					highlightId: 'h2',
					questionType: 'definition',
					question: 'What is Z?',
					confidence: 0.85
				},
				{
					// Missing confidence
					highlightId: 'h3',
					questionType: 'cloze',
					question: 'Fill in',
					answer: 'blank'
				}
			]);

			const result = parseGeneratedQuestions(content);

			expect(result).toHaveLength(1);
			expect(result[0].highlightId).toBe('h1');
		});

		it('should handle empty array', () => {
			const content = '[]';

			const result = parseGeneratedQuestions(content);

			expect(result).toEqual([]);
		});

		it('should handle invalid JSON', () => {
			const content = 'This is not valid JSON';

			const result = parseGeneratedQuestions(content);

			expect(result).toEqual([]);
		});

		it('should extract questions from JSON object wrapper', () => {
			const content = JSON.stringify({
				questions: [
					{
						highlightId: 'h1',
						questionType: 'definition',
						question: 'What is X?',
						answer: 'Y',
						confidence: 0.9
					}
				]
			});

			const result = parseGeneratedQuestions(content);

			expect(result).toHaveLength(1);
			expect(result[0].highlightId).toBe('h1');
		});

		it('should extract array from object with non-standard key', () => {
			const content = JSON.stringify({
				generated: [
					{
						highlightId: 'h1',
						questionType: 'cloze',
						question: 'Q',
						answer: 'A',
						clozeText: 'The {{c1::A}} is here',
						confidence: 0.85
					}
				]
			});

			const result = parseGeneratedQuestions(content);

			expect(result).toHaveLength(1);
			expect(result[0].questionType).toBe('cloze');
		});

		it('should return empty for object without any arrays', () => {
			const content = JSON.stringify({
				highlightId: 'h1',
				question: 'Q',
				answer: 'A'
			});

			const result = parseGeneratedQuestions(content);

			expect(result).toEqual([]);
		});

		it('should preserve clozeText for cloze questions', () => {
			const content = JSON.stringify([
				{
					highlightId: 'h1',
					questionType: 'cloze',
					question: 'Fill in the blank',
					answer: 'answer',
					clozeText: 'The {{c1::answer}} is here',
					confidence: 0.9
				}
			]);

			const result = parseGeneratedQuestions(content);

			expect(result).toHaveLength(1);
			expect(result[0].clozeText).toBe('The {{c1::answer}} is here');
		});

		it('should handle multiple questions', () => {
			const content = JSON.stringify([
				{
					highlightId: 'h1',
					questionType: 'definition',
					question: 'Q1',
					answer: 'A1',
					confidence: 0.9
				},
				{
					highlightId: 'h2',
					questionType: 'conceptual',
					question: 'Q2',
					answer: 'A2',
					confidence: 0.85
				},
				{
					highlightId: 'h3',
					questionType: 'cloze',
					question: 'Q3',
					answer: 'A3',
					clozeText: 'C3',
					confidence: 0.95
				}
			]);

			const result = parseGeneratedQuestions(content);

			expect(result).toHaveLength(3);
			expect(result[0].questionType).toBe('definition');
			expect(result[1].questionType).toBe('conceptual');
			expect(result[2].questionType).toBe('cloze');
		});

		it('should parse object wrapper in markdown code block', () => {
			const content = `\`\`\`json
{
  "questions": [
    {
      "highlightId": "h1",
      "questionType": "definition",
      "question": "What is X?",
      "answer": "Y",
      "confidence": 0.9
    }
  ]
}
\`\`\``;

			const result = parseGeneratedQuestions(content);

			expect(result).toHaveLength(1);
			expect(result[0].highlightId).toBe('h1');
		});

		it('should warn when content exists but no valid questions parsed', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const content = JSON.stringify({
				questions: [{ highlightId: 'h1', question: 'Q' }]
			});
			const result = parseGeneratedQuestions(content);

			expect(result).toEqual([]);
			expect(warnSpy).toHaveBeenCalled();
			warnSpy.mockRestore();
		});

		it('should handle whitespace variations', () => {
			const content = `

			\`\`\`
			[
				{
					"highlightId": "h1",
					"questionType": "definition",
					"question": "Q",
					"answer": "A",
					"confidence": 0.9
				}
			]
			\`\`\`

			`;

			const result = parseGeneratedQuestions(content);

			expect(result).toHaveLength(1);
		});
	});

	describe('buildOpenAIMessages', () => {
		it('should create messages with system and user roles', () => {
			const prompt = 'Generate questions for this highlight';
			const messages = buildOpenAIMessages(prompt);

			expect(messages).toHaveLength(2);
			expect(messages[0].role).toBe('system');
			expect(messages[1].role).toBe('user');
			expect(messages[1].content).toBe(prompt);
		});

		it('should include system message about JSON output', () => {
			const messages = buildOpenAIMessages('test');

			expect(messages[0].content).toContain('JSON');
		});

		it('should use the shared SYSTEM_MESSAGE', () => {
			const messages = buildOpenAIMessages('test');

			expect(messages[0].content).toBe(SYSTEM_MESSAGE);
		});
	});

	describe('buildAnthropicMessages', () => {
		it('should create message with user role', () => {
			const prompt = 'Generate questions for this highlight';
			const messages = buildAnthropicMessages(prompt);

			expect(messages).toHaveLength(1);
			expect(messages[0].role).toBe('user');
			expect(messages[0].content).toBe(prompt);
		});
	});

	describe('buildAnthropicSystem', () => {
		it('should return the shared system message', () => {
			const system = buildAnthropicSystem();

			expect(system).toBe(SYSTEM_MESSAGE);
			expect(system).toContain('Bloom');
			expect(system).toContain('JSON');
		});
	});

	describe('buildGenerationPrompt', () => {
		it('should include collection title and author', () => {
			const prompt = buildGenerationPrompt([mockHighlight], ['cloze'], mockCollection);

			expect(prompt).toContain('Thinking, Fast and Slow');
			expect(prompt).toContain('Daniel Kahneman');
		});

		it('should include source type label', () => {
			const prompt = buildGenerationPrompt([mockHighlight], ['cloze'], mockCollection);

			expect(prompt).toContain('Kindle book');
		});

		it('should include highlight text and metadata', () => {
			const prompt = buildGenerationPrompt([mockHighlight], ['cloze'], mockCollection);

			expect(prompt).toContain('System 1 operates automatically');
			expect(prompt).toContain('Chapter 1');
			expect(prompt).toContain(mockHighlight.id);
		});

		it('should include user note when present', () => {
			const prompt = buildGenerationPrompt([mockHighlight], ['cloze'], mockCollection);

			expect(prompt).toContain('Key distinction between the two systems');
			expect(prompt).toContain("reader's annotation");
		});

		it('should not include note line when note is null', () => {
			const noNoteHighlight = { ...mockHighlight, note: null };
			const prompt = buildGenerationPrompt([noNoteHighlight], ['cloze'], mockCollection);

			expect(prompt).not.toContain("reader's annotation");
		});

		it('should use standard difficulty by default', () => {
			const prompt = buildGenerationPrompt([mockHighlight], ['cloze'], mockCollection);

			// Standard cloze instructions mention "multi-word phrase"
			expect(prompt).toContain('multi-word phrase');
			// Should NOT contain the challenging marker
			expect(prompt).not.toContain('CLOZE DELETIONS (CHALLENGING)');
		});

		it('should use challenging difficulty when specified', () => {
			const prompt = buildGenerationPrompt([mockHighlight], ['cloze'], mockCollection, {
				difficulty: 'challenging'
			});

			expect(prompt).toContain('CLOZE DELETIONS (CHALLENGING)');
		});

		it('should include tags when provided', () => {
			const prompt = buildGenerationPrompt([mockHighlight], ['cloze'], mockCollection, {
				highlightTags: { 'h-1': ['psychology', 'cognition'] }
			});

			expect(prompt).toContain('Tags: psychology, cognition');
		});

		it('should include existing card count when provided', () => {
			const prompt = buildGenerationPrompt([mockHighlight], ['cloze'], mockCollection, {
				existingCardCounts: { 'h-1': 3 }
			});

			expect(prompt).toContain('Existing cards: 3');
			expect(prompt).toContain('avoid redundant');
		});

		it('should not show existing cards line when count is 0', () => {
			const prompt = buildGenerationPrompt([mockHighlight], ['cloze'], mockCollection, {
				existingCardCounts: { 'h-1': 0 }
			});

			expect(prompt).not.toContain('Existing cards');
		});

		it('should include confidence scoring rubric', () => {
			const prompt = buildGenerationPrompt([mockHighlight], ['cloze'], mockCollection);

			expect(prompt).toContain('CONFIDENCE SCORING');
			expect(prompt).toContain('0.90-1.0');
		});

		it('should include few-shot examples for each question type', () => {
			const prompt = buildGenerationPrompt(
				[mockHighlight],
				['cloze', 'definition', 'conceptual'],
				mockCollection
			);

			// Each type should have good/bad examples
			expect(prompt).toContain('Example (good)');
			expect(prompt).toContain('Example (bad');
		});

		it('should handle collection without author', () => {
			const noAuthor = { ...mockCollection, author: null };
			const prompt = buildGenerationPrompt([mockHighlight], ['cloze'], noAuthor);

			expect(prompt).toContain('Thinking, Fast and Slow');
			expect(prompt).not.toContain('by null');
		});

		it('should handle web article source type', () => {
			const webCollection = { ...mockCollection, sourceType: 'web_article' as const };
			const prompt = buildGenerationPrompt([mockHighlight], ['cloze'], webCollection);

			expect(prompt).toContain('web article');
		});
	});
});
