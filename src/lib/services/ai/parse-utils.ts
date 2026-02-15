/**
 * Shared JSON parsing utilities for AI response handling
 *
 * Provides robust parsing that handles various AI response formats:
 * direct JSON, markdown-wrapped, and embedded in prose.
 *
 * @module services/ai/parse-utils
 */

/**
 * Attempts to parse a string as JSON, with fallback extraction for
 * JSON embedded in surrounding text (e.g., Anthropic responses with prose).
 *
 * Strategy (in order):
 * 1. Direct JSON.parse
 * 2. Extract outermost JSON array via regex
 * 3. Extract outermost JSON object via regex
 */
export function tryParseJSON(str: string): Record<string, unknown> | unknown[] | undefined {
	try {
		return JSON.parse(str);
	} catch {
		// Fallback: try to extract JSON from surrounding text (Anthropic responses)
		// Try array first since object regex would match inner objects within an array
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
