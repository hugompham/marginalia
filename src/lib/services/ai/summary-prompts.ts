/**
 * AI Prompt Building and Response Parsing for Collection Summaries
 *
 * Synthesizes highlights into structured summaries with key themes.
 *
 * @module services/ai/summary-prompts
 */

import { tryParseJSON } from './parse-utils';

/**
 * Highlight shape accepted by the summary prompt builder
 */
interface HighlightForSummary {
	text: string;
	note?: string | null;
	chapter?: string | null;
	pageNumber?: number | null;
}

/**
 * Collection context for the summary prompt
 */
interface CollectionContext {
	title: string;
	author?: string | null;
}

/**
 * Parsed summary response from AI
 */
export interface SummaryResponse {
	summary: string;
	themes: string[];
}

/** System message for summary generation */
export const SUMMARY_SYSTEM_MESSAGE =
	'You are a reading comprehension assistant that synthesizes highlights ' +
	'into structured, insightful summaries. You identify key themes and ' +
	'organize information clearly. Always output valid JSON.';

/**
 * Builds the prompt for AI summary generation from a set of highlights.
 *
 * @param highlights - Highlights to summarize
 * @param collection - Parent collection (title, author)
 * @returns Complete prompt string
 */
export function buildSummaryPrompt(
	highlights: HighlightForSummary[],
	collection: CollectionContext
): string {
	const authorLine = collection.author ? ` by ${collection.author}` : '';

	const formattedHighlights = highlights
		.map((h, i) => {
			const parts = [`${i + 1}. "${h.text}"`];
			if (h.chapter) parts.push(`   Chapter: ${h.chapter}`);
			if (h.pageNumber != null) parts.push(`   Page: ${h.pageNumber}`);
			if (h.note) parts.push(`   Reader note: "${h.note}"`);
			return parts.join('\n');
		})
		.join('\n\n');

	return `You are summarizing highlights from "${collection.title}"${authorLine}.

The reader has saved ${highlights.length} highlight(s) from this source. Synthesize them into a structured summary.

INSTRUCTIONS:
- Write a markdown-formatted summary that captures the key ideas across all highlights
- Identify 3-7 key themes that emerge from the highlights
- Organize the summary by theme, not by highlight order
- Reference specific ideas from the highlights to support each theme
- Use clear, concise language -- match the domain vocabulary of the source material
- The summary should stand alone as a useful reference for the reader
- If reader notes are present, treat them as signals for what the reader found important

OUTPUT FORMAT (JSON object):
{
  "summary": "## Main Takeaways\\n\\nMarkdown-formatted summary text organized by theme...",
  "themes": ["Theme 1", "Theme 2", "Theme 3"]
}

HIGHLIGHTS:
${formattedHighlights}

Synthesize these highlights into a structured summary. Output ONLY the JSON object, no other text:`;
}

/**
 * Parses AI response content into a structured summary with themes.
 *
 * @param content - Raw AI response content
 * @returns Parsed summary and themes
 * @throws Error if response is invalid or missing required fields
 */
export function parseSummaryResponse(content: string): SummaryResponse {
	let jsonStr = content.trim();

	// Handle markdown code block wrapper
	const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
	if (jsonMatch) {
		jsonStr = jsonMatch[1].trim();
	}

	const parsed = tryParseJSON(jsonStr);
	if (parsed === undefined) {
		throw new Error('Failed to parse summary response as JSON');
	}

	if (Array.isArray(parsed)) {
		throw new Error('Expected JSON object, got array');
	}

	const obj = parsed as Record<string, unknown>;

	// Validate summary
	if (typeof obj.summary !== 'string' || obj.summary.trim().length === 0) {
		throw new Error('Summary response missing or empty "summary" field');
	}

	// Validate themes
	if (!Array.isArray(obj.themes) || obj.themes.length === 0) {
		throw new Error('Summary response missing or empty "themes" array');
	}

	const validThemes = obj.themes.filter(
		(t): t is string => typeof t === 'string' && t.trim().length > 0
	);

	if (validThemes.length === 0) {
		throw new Error('Summary response contains no valid theme strings');
	}

	return {
		summary: obj.summary.trim(),
		themes: validThemes.map((t) => t.trim())
	};
}
