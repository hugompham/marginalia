import { describe, it, expect, vi } from 'vitest';
import { buildQuizPrompt, parseQuizQuestions } from './quiz-prompts';
import type { QuizQuestion } from '$lib/types';

const mockCollection = {
	title: 'Thinking, Fast and Slow',
	author: 'Daniel Kahneman'
};

const mockHighlights = [
	{
		id: 'hl-1',
		text: 'System 1 operates automatically and quickly.',
		note: 'Key concept',
		chapter: 'Chapter 1',
		pageNumber: 24
	},
	{
		id: 'hl-2',
		text: 'Anchoring effects bias our judgments.',
		note: null,
		chapter: null,
		pageNumber: null
	}
];

function validMC(): Record<string, unknown> {
	return {
		highlightId: 'hl-1',
		type: 'multiple_choice',
		question: 'What does System 1 do?',
		correctAnswer: 'Operates automatically',
		explanation: 'The highlight states that System 1 operates automatically.',
		options: ['Operates automatically', 'Requires effort', 'Uses logic', 'Is slow'],
		confidence: 0.9
	};
}

function validTF(): Record<string, unknown> {
	return {
		highlightId: 'hl-2',
		type: 'true_false',
		question: 'Evaluate the following statement:',
		statement: 'Anchoring effects bias our judgments.',
		correctAnswer: 'true',
		explanation: 'The highlight confirms anchoring effects bias judgments.',
		confidence: 0.88
	};
}

function validSA(): Record<string, unknown> {
	return {
		highlightId: 'hl-1',
		type: 'short_answer',
		question: 'Explain how System 1 differs from System 2.',
		correctAnswer: 'System 1 is fast and automatic while System 2 is slow and deliberate.',
		explanation: 'The highlight describes System 1 as automatic and quick.',
		confidence: 0.85
	};
}

describe('quiz-prompts', () => {
	describe('buildQuizPrompt', () => {
		it('should include collection title', () => {
			const prompt = buildQuizPrompt(mockHighlights, mockCollection);

			expect(prompt).toContain('Thinking, Fast and Slow');
		});

		it('should include collection author when provided', () => {
			const prompt = buildQuizPrompt(mockHighlights, mockCollection);

			expect(prompt).toContain('Daniel Kahneman');
		});

		it('should include highlight text and IDs', () => {
			const prompt = buildQuizPrompt(mockHighlights, mockCollection);

			expect(prompt).toContain('hl-1');
			expect(prompt).toContain('System 1 operates automatically');
			expect(prompt).toContain('hl-2');
			expect(prompt).toContain('Anchoring effects bias');
		});

		it('should include question count in prompt', () => {
			const prompt = buildQuizPrompt(mockHighlights, mockCollection, 15);

			expect(prompt).toContain('exactly 15 questions');
		});

		it('should default question count to 10', () => {
			const prompt = buildQuizPrompt(mockHighlights, mockCollection);

			expect(prompt).toContain('exactly 10 questions');
		});

		it('should omit author clause when author is null', () => {
			const prompt = buildQuizPrompt(mockHighlights, { title: 'Test', author: null });

			expect(prompt).toContain('"Test"');
			expect(prompt).not.toContain('by null');
		});
	});

	describe('parseQuizQuestions', () => {
		it('should parse valid multiple choice question', () => {
			const content = JSON.stringify({ questions: [validMC()] });

			const result = parseQuizQuestions(content);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('multiple_choice');
			expect(result[0].options).toHaveLength(4);
			expect(result[0].options).toContain(result[0].correctAnswer);
		});

		it('should parse valid true/false question', () => {
			const content = JSON.stringify({ questions: [validTF()] });

			const result = parseQuizQuestions(content);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('true_false');
			expect(result[0].statement).toBe('Anchoring effects bias our judgments.');
			expect(result[0].correctAnswer).toBe('true');
		});

		it('should parse valid short answer question', () => {
			const content = JSON.stringify({ questions: [validSA()] });

			const result = parseQuizQuestions(content);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('short_answer');
			expect(result[0].correctAnswer.length).toBeGreaterThan(0);
		});

		it('should filter MC with wrong number of options', () => {
			const bad = { ...validMC(), options: ['A', 'B', 'C'] };
			const content = JSON.stringify({ questions: [bad] });

			const result = parseQuizQuestions(content);

			expect(result).toHaveLength(0);
		});

		it('should filter MC where correctAnswer is not in options', () => {
			const bad = {
				...validMC(),
				correctAnswer: 'Not in the options',
				options: ['A', 'B', 'C', 'D']
			};
			const content = JSON.stringify({ questions: [bad] });

			const result = parseQuizQuestions(content);

			expect(result).toHaveLength(0);
		});

		it('should filter TF without statement field', () => {
			const bad = { ...validTF() };
			delete bad.statement;
			const content = JSON.stringify({ questions: [bad] });

			const result = parseQuizQuestions(content);

			expect(result).toHaveLength(0);
		});

		it('should filter questions with confidence below 0.5', () => {
			const bad = { ...validMC(), confidence: 0.3 };
			const content = JSON.stringify({ questions: [bad] });

			const result = parseQuizQuestions(content);

			expect(result).toHaveLength(0);
		});

		it('should return empty array for completely invalid input', () => {
			const result = parseQuizQuestions('This is not JSON at all and is quite long enough');

			expect(result).toEqual([]);
		});

		it('should return empty array for empty string', () => {
			const result = parseQuizQuestions('');

			expect(result).toEqual([]);
		});

		it('should handle JSON wrapped in markdown code blocks', () => {
			const content = `\`\`\`json
{
  "questions": [${JSON.stringify(validMC())}]
}
\`\`\``;

			const result = parseQuizQuestions(content);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('multiple_choice');
		});

		it('should keep valid questions and filter invalid ones', () => {
			const good = validMC();
			const badConfidence = { ...validSA(), confidence: 0.1 };
			const badMC = { ...validMC(), options: ['A'] };
			const goodTF = validTF();
			const content = JSON.stringify({ questions: [good, badConfidence, badMC, goodTF] });

			const result = parseQuizQuestions(content);

			expect(result).toHaveLength(2);
			expect(result[0].type).toBe('multiple_choice');
			expect(result[1].type).toBe('true_false');
		});

		it('should parse plain JSON array (no object wrapper)', () => {
			const content = JSON.stringify([validMC(), validTF()]);

			const result = parseQuizQuestions(content);

			expect(result).toHaveLength(2);
		});

		it('should normalize true_false correctAnswer to lowercase', () => {
			const tf = { ...validTF(), correctAnswer: 'True' };
			const content = JSON.stringify({ questions: [tf] });

			const result = parseQuizQuestions(content);

			expect(result).toHaveLength(1);
			expect(result[0].correctAnswer).toBe('true');
		});

		it('should filter TF where correctAnswer is not true or false', () => {
			const bad = { ...validTF(), correctAnswer: 'maybe' };
			const content = JSON.stringify({ questions: [bad] });

			const result = parseQuizQuestions(content);

			expect(result).toHaveLength(0);
		});

		it('should warn when content exists but no valid questions parsed', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const bad = { ...validMC(), confidence: 0.1 };
			const content = JSON.stringify({ questions: [bad] });

			const result = parseQuizQuestions(content);

			expect(result).toEqual([]);
			expect(warnSpy).toHaveBeenCalled();
			warnSpy.mockRestore();
		});
	});
});
