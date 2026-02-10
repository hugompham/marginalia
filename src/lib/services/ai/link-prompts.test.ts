import { describe, it, expect } from 'vitest';
import { buildLinkSuggestionPrompt, parseSuggestedLinks } from './link-prompts';

describe('AI Link Prompts', () => {
	describe('buildLinkSuggestionPrompt', () => {
		it('should include highlight IDs, text, and collection info', () => {
			const highlights = [
				{
					id: 'h1',
					text: 'The mitochondria is the powerhouse of the cell',
					chapter: 'Chapter 1',
					collections: { title: 'Biology 101', author: 'Dr. Smith' }
				},
				{
					id: 'h2',
					text: 'ATP is produced through cellular respiration',
					chapter: null,
					collections: { title: 'Biochemistry', author: null }
				}
			];

			const prompt = buildLinkSuggestionPrompt(highlights);

			expect(prompt).toContain('h1');
			expect(prompt).toContain('h2');
			expect(prompt).toContain('mitochondria');
			expect(prompt).toContain('ATP');
			expect(prompt).toContain('Biology 101');
			expect(prompt).toContain('Dr. Smith');
			expect(prompt).toContain('Biochemistry');
			expect(prompt).toContain('Chapter 1');
			expect(prompt).toContain('connections');
			expect(prompt).toContain('JSON');
		});

		it('should handle highlights without collection data', () => {
			const highlights = [
				{ id: 'h1', text: 'Some text', collections: null },
				{ id: 'h2', text: 'Other text', collections: undefined }
			];

			const prompt = buildLinkSuggestionPrompt(highlights);

			expect(prompt).toContain('Unknown');
			expect(prompt).toContain('h1');
			expect(prompt).toContain('h2');
		});
	});

	describe('parseSuggestedLinks', () => {
		it('should parse valid JSON with connections array', () => {
			const content = JSON.stringify({
				connections: [
					{
						sourceHighlightId: 'h1',
						targetHighlightId: 'h2',
						description: 'Both discuss energy production',
						confidence: 0.92
					}
				]
			});

			const result = parseSuggestedLinks(content);

			expect(result).toHaveLength(1);
			expect(result[0].sourceHighlightId).toBe('h1');
			expect(result[0].targetHighlightId).toBe('h2');
			expect(result[0].description).toBe('Both discuss energy production');
			expect(result[0].confidence).toBe(0.92);
		});

		it('should parse plain JSON array', () => {
			const content = JSON.stringify([
				{
					sourceHighlightId: 'h1',
					targetHighlightId: 'h2',
					description: 'Related',
					confidence: 0.8
				}
			]);

			const result = parseSuggestedLinks(content);
			expect(result).toHaveLength(1);
		});

		it('should handle markdown code blocks', () => {
			const content =
				'```json\n{"connections": [{"sourceHighlightId": "h1", "targetHighlightId": "h2", "description": "Test", "confidence": 0.85}]}\n```';

			const result = parseSuggestedLinks(content);
			expect(result).toHaveLength(1);
		});

		it('should handle JSON embedded in surrounding text', () => {
			const content =
				'Here are the connections I found:\n{"connections": [{"sourceHighlightId": "h1", "targetHighlightId": "h2", "description": "Related concepts", "confidence": 0.75}]}\nI hope this helps!';

			const result = parseSuggestedLinks(content);
			expect(result).toHaveLength(1);
		});

		it('should filter out self-links', () => {
			const content = JSON.stringify({
				connections: [
					{
						sourceHighlightId: 'h1',
						targetHighlightId: 'h1',
						description: 'Self reference',
						confidence: 0.9
					},
					{
						sourceHighlightId: 'h1',
						targetHighlightId: 'h2',
						description: 'Valid link',
						confidence: 0.8
					}
				]
			});

			const result = parseSuggestedLinks(content);
			expect(result).toHaveLength(1);
			expect(result[0].targetHighlightId).toBe('h2');
		});

		it('should filter out incomplete items', () => {
			const content = JSON.stringify({
				connections: [
					{ sourceHighlightId: 'h1', targetHighlightId: 'h2' },
					{ sourceHighlightId: 'h1', description: 'Missing target', confidence: 0.5 },
					{
						sourceHighlightId: 'h1',
						targetHighlightId: 'h2',
						description: 'Complete',
						confidence: 0.8
					}
				]
			});

			const result = parseSuggestedLinks(content);
			expect(result).toHaveLength(1);
			expect(result[0].description).toBe('Complete');
		});

		it('should return empty array for invalid JSON', () => {
			const result = parseSuggestedLinks('This is not valid JSON at all');
			expect(result).toEqual([]);
		});

		it('should return empty array for empty content', () => {
			const result = parseSuggestedLinks('');
			expect(result).toEqual([]);
		});

		it('should handle object with non-standard array key', () => {
			const content = JSON.stringify({
				suggestions: [
					{
						sourceHighlightId: 'h1',
						targetHighlightId: 'h2',
						description: 'Found via alternate key',
						confidence: 0.7
					}
				]
			});

			const result = parseSuggestedLinks(content);
			expect(result).toHaveLength(1);
		});
	});
});
