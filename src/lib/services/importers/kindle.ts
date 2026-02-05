/**
 * Kindle My Clippings.txt Parser
 *
 * Parses Amazon Kindle's My Clippings.txt export format into structured collections
 * with highlights, notes, and metadata.
 *
 * @module services/importers/kindle
 */

interface HighlightInput {
	text: string;
	note?: string | null;
	pageNumber?: number | null;
}

interface ParsedCollection {
	title: string;
	author: string | null;
	highlights: HighlightInput[];
}

interface ParseResult {
	collections: ParsedCollection[];
	totalHighlights: number;
}

/**
 * Parses Kindle My Clippings.txt format into structured collections
 *
 * @param raw - Raw text content from My Clippings.txt file
 * @returns Parsed collections with highlights and metadata
 */
export function parseKindleClippings(raw: string): ParseResult {
	const normalized = raw.replace(/\r\n/g, '\n').replace(/\uFEFF/g, '');
	const entries = normalized.split('==========');

	const collections = new Map<
		string,
		{
			title: string;
			author: string | null;
			highlights: HighlightInput[];
			highlightIndexByLocation: Map<number, number>;
		}
	>();

	let totalHighlights = 0;

	for (const entry of entries) {
		const trimmed = entry.trim();
		if (!trimmed) continue;

		const lines = trimmed.split('\n');
		if (lines.length < 3) continue;

		const titleLine = lines[0].trim();
		const metaLine = lines[1]?.trim() ?? '';
		const metaLower = metaLine.toLowerCase();

		const isNote = metaLower.includes('note');
		const isHighlight = metaLower.includes('highlight');

		if (!isHighlight && !isNote) continue;

		const contentStartIndex = findContentStartIndex(lines);
		const content = lines.slice(contentStartIndex).join('\n').trim();

		if (!content) continue;

		const { title, author } = parseTitleLine(titleLine);
		const pageNumber = parsePageNumber(metaLine);
		const location = parseLocation(metaLine);

		const key = buildCollectionKey(title, author);

		if (!collections.has(key)) {
			collections.set(key, {
				title,
				author,
				highlights: [],
				highlightIndexByLocation: new Map()
			});
		}

		const collection = collections.get(key)!;

		if (isNote) {
			if (location !== null) {
				const index = collection.highlightIndexByLocation.get(location);
				if (index !== undefined && !collection.highlights[index].note) {
					collection.highlights[index].note = content;
				}
			}
			continue;
		}

		collection.highlights.push({
			text: content,
			note: null,
			pageNumber
		});

		if (location !== null) {
			collection.highlightIndexByLocation.set(location, collection.highlights.length - 1);
		}

		totalHighlights += 1;
	}

	const resultCollections: ParsedCollection[] = Array.from(collections.values()).map(
		(collection) => ({
			title: collection.title,
			author: collection.author,
			highlights: collection.highlights
		})
	);

	return {
		collections: resultCollections,
		totalHighlights
	};
}

/**
 * Removes duplicate highlights based on normalized text
 *
 * Merges notes and page numbers from duplicates, keeping the first occurrence's values
 *
 * @param highlights - Array of highlights to deduplicate
 * @returns Deduplicated highlights
 */
export function dedupeHighlights(highlights: HighlightInput[]): HighlightInput[] {
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

/**
 * Builds a unique key for a collection from title and author
 */
export function buildCollectionKey(title: string, author: string | null | undefined): string {
	return `${normalizeValue(title)}::${normalizeValue(author)}`;
}

// Internal helper functions

function normalizeValue(value: string | null | undefined): string {
	return (value ?? '').trim().toLowerCase();
}

function normalizeHighlightText(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

function findContentStartIndex(lines: string[]): number {
	for (let i = 2; i < lines.length; i += 1) {
		if (lines[i].trim() === '') {
			return i + 1;
		}
	}
	return 2;
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
