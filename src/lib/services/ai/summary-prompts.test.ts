import { describe, it, expect } from 'vitest';
import { buildSummaryPrompt, parseSummaryResponse } from './summary-prompts';

const mockCollection = {
	title: 'Thinking, Fast and Slow',
	author: 'Daniel Kahneman'
};

const mockHighlights = [
	{
		text: 'System 1 operates automatically and quickly, with little or no effort.',
		note: 'Key distinction between the two systems',
		chapter: 'Chapter 1',
		pageNumber: 24
	},
	{
		text: 'Nothing in life is as important as you think it is, while you are thinking about it.',
		note: null,
		chapter: 'Chapter 13',
		pageNumber: null
	}
];

describe('summary-prompts', () => {
	describe('buildSummaryPrompt', () => {
		it('should include collection title', () => {
			const prompt = buildSummaryPrompt(mockHighlights, mockCollection);

			expect(prompt).toContain('Thinking, Fast and Slow');
		});

		it('should include collection author when provided', () => {
			const prompt = buildSummaryPrompt(mockHighlights, mockCollection);

			expect(prompt).toContain('Daniel Kahneman');
		});

		it('should omit author clause when author is null', () => {
			const prompt = buildSummaryPrompt(mockHighlights, { title: 'Test', author: null });

			expect(prompt).toContain('"Test"');
			expect(prompt).not.toContain('by null');
		});

		it('should include highlight text', () => {
			const prompt = buildSummaryPrompt(mockHighlights, mockCollection);

			expect(prompt).toContain('System 1 operates automatically');
			expect(prompt).toContain('Nothing in life is as important');
		});

		it('should include chapter when available', () => {
			const prompt = buildSummaryPrompt(mockHighlights, mockCollection);

			expect(prompt).toContain('Chapter: Chapter 1');
			expect(prompt).toContain('Chapter: Chapter 13');
		});

		it('should include page number when available', () => {
			const prompt = buildSummaryPrompt(mockHighlights, mockCollection);

			expect(prompt).toContain('Page: 24');
		});

		it('should include reader note when available', () => {
			const prompt = buildSummaryPrompt(mockHighlights, mockCollection);

			expect(prompt).toContain('Reader note: "Key distinction between the two systems"');
		});

		it('should handle highlights without chapter or page', () => {
			const barebones = [
				{ text: 'Some important passage', note: null, chapter: null, pageNumber: null }
			];
			const prompt = buildSummaryPrompt(barebones, mockCollection);

			expect(prompt).toContain('Some important passage');
			expect(prompt).not.toContain('Chapter:');
			expect(prompt).not.toContain('Page:');
		});

		it('should include highlight count', () => {
			const prompt = buildSummaryPrompt(mockHighlights, mockCollection);

			expect(prompt).toContain('2 highlight(s)');
		});
	});

	describe('parseSummaryResponse', () => {
		it('should parse valid JSON response', () => {
			const content = JSON.stringify({
				summary: '## Key Ideas\n\nThe two systems of thinking...',
				themes: ['Dual Process Theory', 'Cognitive Biases', 'Decision Making']
			});

			const result = parseSummaryResponse(content);

			expect(result.summary).toBe('## Key Ideas\n\nThe two systems of thinking...');
			expect(result.themes).toEqual(['Dual Process Theory', 'Cognitive Biases', 'Decision Making']);
		});

		it('should parse JSON wrapped in markdown code blocks', () => {
			const content = `\`\`\`json
{
  "summary": "A structured overview of key concepts.",
  "themes": ["Memory", "Learning"]
}
\`\`\``;

			const result = parseSummaryResponse(content);

			expect(result.summary).toBe('A structured overview of key concepts.');
			expect(result.themes).toEqual(['Memory', 'Learning']);
		});

		it('should throw on empty summary', () => {
			const content = JSON.stringify({ summary: '', themes: ['Theme'] });

			expect(() => parseSummaryResponse(content)).toThrow('missing or empty "summary"');
		});

		it('should throw on empty themes array', () => {
			const content = JSON.stringify({ summary: 'Valid summary text', themes: [] });

			expect(() => parseSummaryResponse(content)).toThrow('missing or empty "themes"');
		});

		it('should throw on completely invalid input', () => {
			expect(() => parseSummaryResponse('This is not JSON at all')).toThrow(
				'Failed to parse summary response as JSON'
			);
		});

		it('should handle response with extra fields gracefully', () => {
			const content = JSON.stringify({
				summary: 'The key takeaway is...',
				themes: ['Theme A'],
				confidence: 0.95,
				metadata: { model: 'gpt-4o' }
			});

			const result = parseSummaryResponse(content);

			expect(result.summary).toBe('The key takeaway is...');
			expect(result.themes).toEqual(['Theme A']);
			// Extra fields are not present on result
			expect((result as Record<string, unknown>).confidence).toBeUndefined();
		});

		it('should trim whitespace from summary and themes', () => {
			const content = JSON.stringify({
				summary: '  Trimmed summary  ',
				themes: ['  Theme A  ', 'Theme B ']
			});

			const result = parseSummaryResponse(content);

			expect(result.summary).toBe('Trimmed summary');
			expect(result.themes).toEqual(['Theme A', 'Theme B']);
		});

		it('should filter out empty theme strings', () => {
			const content = JSON.stringify({
				summary: 'Valid summary',
				themes: ['Real Theme', '', '  ', 'Another Theme']
			});

			const result = parseSummaryResponse(content);

			expect(result.themes).toEqual(['Real Theme', 'Another Theme']);
		});

		it('should throw when all themes are empty strings', () => {
			const content = JSON.stringify({
				summary: 'Valid summary',
				themes: ['', '  ']
			});

			expect(() => parseSummaryResponse(content)).toThrow('no valid theme strings');
		});

		it('should throw when response is an array instead of object', () => {
			const content = JSON.stringify([{ summary: 'text', themes: ['a'] }]);

			expect(() => parseSummaryResponse(content)).toThrow('Expected JSON object, got array');
		});
	});
});
