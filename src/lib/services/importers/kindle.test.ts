import { describe, it, expect } from 'vitest';

// Helper functions extracted from the Kindle parser for testing
function normalizeValue(value: string | null | undefined): string {
	return (value ?? '').trim().toLowerCase();
}

function normalizeHighlightText(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

function buildCollectionKey(title: string, author: string | null | undefined): string {
	return `${normalizeValue(title)}::${normalizeValue(author)}`;
}

function parseTitleLine(line: string): { title: string; author: string | null } {
	const match = line.match(/^(.*)\s+\((.*)\)\s*$/);
	if (match) {
		return { title: match[1].trim(), author: match[2].trim() };
	}
	return { title: line.trim(), author: null };
}

function parsePageNumber(metaLine: string): number | null {
	const match = metaLine.match(/page\s+(\d+)/i);
	if (match) {
		return Number.parseInt(match[1], 10);
	}
	return null;
}

function parseLocation(metaLine: string): number | null {
	const match = metaLine.match(/location\s+(\d+)/i);
	if (match) {
		return Number.parseInt(match[1], 10);
	}
	return null;
}

interface HighlightInput {
	text: string;
	note?: string | null;
	pageNumber?: number | null;
}

function dedupeHighlights(highlights: HighlightInput[]): HighlightInput[] {
	const deduped = new Map<string, HighlightInput>();

	for (const highlight of highlights) {
		const normalizedText = normalizeHighlightText(highlight.text);
		if (!normalizedText) continue;

		const existing = deduped.get(normalizedText);
		if (!existing) {
			deduped.set(normalizedText, {
				text: normalizedText,
				note: highlight.note ?? null,
				pageNumber: highlight.pageNumber ?? null
			});
		} else {
			if (!existing.note && highlight.note) {
				existing.note = highlight.note;
			}
			if (!existing.pageNumber && highlight.pageNumber) {
				existing.pageNumber = highlight.pageNumber;
			}
		}
	}

	return Array.from(deduped.values());
}

describe('Kindle Parser Utilities', () => {
	describe('normalizeValue', () => {
		it('should trim and lowercase strings', () => {
			expect(normalizeValue('  Hello World  ')).toBe('hello world');
		});

		it('should handle null values', () => {
			expect(normalizeValue(null)).toBe('');
		});

		it('should handle undefined values', () => {
			expect(normalizeValue(undefined)).toBe('');
		});

		it('should handle empty strings', () => {
			expect(normalizeValue('')).toBe('');
		});
	});

	describe('normalizeHighlightText', () => {
		it('should collapse multiple spaces', () => {
			expect(normalizeHighlightText('hello    world')).toBe('hello world');
		});

		it('should trim leading and trailing spaces', () => {
			expect(normalizeHighlightText('  hello world  ')).toBe('hello world');
		});

		it('should handle newlines', () => {
			expect(normalizeHighlightText('hello\n\nworld')).toBe('hello world');
		});

		it('should handle tabs', () => {
			expect(normalizeHighlightText('hello\t\tworld')).toBe('hello world');
		});
	});

	describe('buildCollectionKey', () => {
		it('should create a key from title and author', () => {
			const key = buildCollectionKey('The Great Book', 'John Doe');
			expect(key).toBe('the great book::john doe');
		});

		it('should handle null author', () => {
			const key = buildCollectionKey('The Great Book', null);
			expect(key).toBe('the great book::');
		});

		it('should handle undefined author', () => {
			const key = buildCollectionKey('The Great Book', undefined);
			expect(key).toBe('the great book::');
		});

		it('should normalize both parts', () => {
			const key = buildCollectionKey('  LOUD TITLE  ', '  Author Name  ');
			expect(key).toBe('loud title::author name');
		});
	});

	describe('parseTitleLine', () => {
		it('should parse title with author in parentheses', () => {
			const result = parseTitleLine('Atomic Habits (James Clear)');
			expect(result.title).toBe('Atomic Habits');
			expect(result.author).toBe('James Clear');
		});

		it('should parse title without author', () => {
			const result = parseTitleLine('Book Title');
			expect(result.title).toBe('Book Title');
			expect(result.author).toBeNull();
		});

		it('should handle titles with multiple parentheses', () => {
			const result = parseTitleLine('Book (Subtitle) (Author Name)');
			expect(result.title).toBe('Book (Subtitle)');
			expect(result.author).toBe('Author Name');
		});

		it('should handle extra whitespace', () => {
			const result = parseTitleLine('  Book Title  (  Author  )  ');
			expect(result.title).toBe('Book Title');
			expect(result.author).toBe('Author');
		});
	});

	describe('parsePageNumber', () => {
		it('should extract page number', () => {
			const result = parsePageNumber('Your Highlight on page 42 | Location 123-456');
			expect(result).toBe(42);
		});

		it('should handle case-insensitive matching', () => {
			const result = parsePageNumber('Your Highlight on PAGE 100');
			expect(result).toBe(100);
		});

		it('should return null if no page number', () => {
			const result = parsePageNumber('Your Highlight on Location 123-456');
			expect(result).toBeNull();
		});

		it('should handle multi-digit page numbers', () => {
			const result = parsePageNumber('page 1234');
			expect(result).toBe(1234);
		});
	});

	describe('parseLocation', () => {
		it('should extract location number', () => {
			const result = parseLocation('Your Highlight on page 42 | Location 1234');
			expect(result).toBe(1234);
		});

		it('should handle case-insensitive matching', () => {
			const result = parseLocation('LOCATION 5678');
			expect(result).toBe(5678);
		});

		it('should return null if no location', () => {
			const result = parseLocation('Your Highlight on page 42');
			expect(result).toBeNull();
		});

		it('should extract first location from range', () => {
			const result = parseLocation('Location 123-456');
			expect(result).toBe(123);
		});
	});

	describe('dedupeHighlights', () => {
		it('should remove exact duplicates', () => {
			const highlights: HighlightInput[] = [
				{ text: 'Same text', note: null, pageNumber: 10 },
				{ text: 'Same text', note: null, pageNumber: 10 }
			];

			const result = dedupeHighlights(highlights);

			expect(result).toHaveLength(1);
			expect(result[0].text).toBe('Same text');
		});

		it('should normalize whitespace when deduping', () => {
			const highlights: HighlightInput[] = [
				{ text: 'Text  with   spaces', note: null },
				{ text: 'Text with spaces', note: null }
			];

			const result = dedupeHighlights(highlights);

			expect(result).toHaveLength(1);
			expect(result[0].text).toBe('Text with spaces');
		});

		it('should merge notes from duplicates', () => {
			const highlights: HighlightInput[] = [
				{ text: 'Highlighted text', note: null, pageNumber: 10 },
				{ text: 'Highlighted text', note: 'My note', pageNumber: 10 }
			];

			const result = dedupeHighlights(highlights);

			expect(result).toHaveLength(1);
			expect(result[0].note).toBe('My note');
		});

		it('should merge page numbers from duplicates', () => {
			const highlights: HighlightInput[] = [
				{ text: 'Highlighted text', note: null, pageNumber: null },
				{ text: 'Highlighted text', note: null, pageNumber: 42 }
			];

			const result = dedupeHighlights(highlights);

			expect(result).toHaveLength(1);
			expect(result[0].pageNumber).toBe(42);
		});

		it('should keep first non-null values', () => {
			const highlights: HighlightInput[] = [
				{ text: 'Text', note: 'First note', pageNumber: 10 },
				{ text: 'Text', note: 'Second note', pageNumber: 20 }
			];

			const result = dedupeHighlights(highlights);

			expect(result).toHaveLength(1);
			expect(result[0].note).toBe('First note');
			expect(result[0].pageNumber).toBe(10);
		});

		it('should filter out empty highlights', () => {
			const highlights: HighlightInput[] = [
				{ text: '', note: null },
				{ text: '   ', note: null },
				{ text: 'Valid text', note: null }
			];

			const result = dedupeHighlights(highlights);

			expect(result).toHaveLength(1);
			expect(result[0].text).toBe('Valid text');
		});

		it('should handle empty array', () => {
			const result = dedupeHighlights([]);
			expect(result).toEqual([]);
		});
	});
});
