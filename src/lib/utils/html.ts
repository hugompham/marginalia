/**
 * HTML utility functions
 *
 * @module utils/html
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 *
 * @param unsafe - Unescaped string that may contain HTML
 * @returns HTML-escaped string safe for innerHTML
 *
 * @example
 * ```ts
 * const safe = escapeHtml('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(unsafe: string): string {
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
