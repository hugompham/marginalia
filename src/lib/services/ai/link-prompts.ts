/**
 * AI Prompt Building and Response Parsing for Highlight Link Suggestions
 *
 * @module services/ai/link-prompts
 */

import type { SuggestedLink } from '$lib/types';

/**
 * Highlight shape as returned from Supabase with joined collection data
 */
interface HighlightForSuggestion {
	id: string;
	text: string;
	chapter?: string | null;
	collections?: { title: string; author: string | null } | null;
}

/**
 * Builds the prompt for AI link suggestion between highlights
 */
export function buildLinkSuggestionPrompt(highlights: HighlightForSuggestion[]): string {
	return `You are analyzing a reader's highlights to find meaningful semantic connections between them.

Identify pairs of highlights that share:
- Related concepts or themes
- Cause-and-effect relationships
- Complementary or contrasting ideas
- Shared terminology or definitions
- Cross-references or dependencies

GUIDELINES:
- Only suggest connections where there is a genuine intellectual relationship
- Each connection must include a brief description explaining WHY they are connected
- Rate your confidence (0-1) that the connection is meaningful
- Do not suggest trivial connections (both mention a common word like "the" or "important")
- Suggest 3-10 connections maximum, preferring quality over quantity
- Highlights from different books/sources that relate are especially valuable

OUTPUT FORMAT (JSON object with "connections" array):
{
  "connections": [
    {
      "sourceHighlightId": "uuid",
      "targetHighlightId": "uuid",
      "description": "Brief explanation of the connection",
      "confidence": 0.85
    }
  ]
}

HIGHLIGHTS:
${highlights
	.map(
		(h) => `
---
ID: ${h.id}
Source: "${h.collections?.title ?? 'Unknown'}"${h.collections?.author ? ` by ${h.collections.author}` : ''}
${h.chapter ? `Chapter: ${h.chapter}` : ''}
Text: "${h.text}"
`
	)
	.join('\n')}

Analyze these highlights and suggest meaningful connections. Output ONLY the JSON object, no other text:`;
}

/**
 * Attempts to parse a string as JSON with fallback extraction
 */
function tryParseJSON(str: string): Record<string, unknown> | unknown[] | undefined {
	try {
		return JSON.parse(str);
	} catch {
		const arrayMatch = str.match(/\[[\s\S]*\]/);
		if (arrayMatch) {
			try {
				return JSON.parse(arrayMatch[0]);
			} catch {
				// fall through
			}
		}
		const objectMatch = str.match(/\{[\s\S]*\}/);
		if (objectMatch) {
			try {
				return JSON.parse(objectMatch[0]);
			} catch {
				// fall through
			}
		}
		return undefined;
	}
}

/**
 * Parses AI response content into structured link suggestions
 */
export function parseSuggestedLinks(content: string): SuggestedLink[] {
	let jsonStr = content.trim();

	// Handle markdown code block wrapper
	const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
	if (jsonMatch) {
		jsonStr = jsonMatch[1].trim();
	}

	const parsed = tryParseJSON(jsonStr);
	if (parsed === undefined) {
		if (content.length > 10) {
			console.warn('Failed to parse link suggestion response:', content.slice(0, 200));
		}
		return [];
	}

	let connections: unknown[];
	if (Array.isArray(parsed)) {
		connections = parsed;
	} else if (parsed && typeof parsed === 'object') {
		const obj = parsed as Record<string, unknown>;
		connections = Array.isArray(obj.connections)
			? obj.connections
			: ((Object.values(obj).find((v) => Array.isArray(v)) as unknown[]) ?? []);
	} else {
		return [];
	}

	// Validate and filter
	const valid = connections
		.filter((c: unknown): c is SuggestedLink => {
			const item = c as Record<string, unknown>;
			return (
				typeof item?.sourceHighlightId === 'string' &&
				typeof item?.targetHighlightId === 'string' &&
				typeof item?.description === 'string' &&
				item.description.length > 0 &&
				typeof item?.confidence === 'number' &&
				item.sourceHighlightId !== item.targetHighlightId
			);
		})
		.map((item) => ({
			...item,
			confidence: Math.max(0, Math.min(1, item.confidence))
		}));

	if (valid.length === 0 && content.length > 10) {
		console.warn(
			'AI returned content but no valid link suggestions were parsed:',
			content.slice(0, 200)
		);
	}

	return valid;
}
