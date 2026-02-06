import { describe, it, expect, vi } from 'vitest';
import { parseGeneratedQuestions, buildOpenAIMessages, buildAnthropicMessages } from './prompts';

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
});
