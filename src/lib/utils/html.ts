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

const HTML_ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: '\u00A0',
	mdash: '\u2014',
	ndash: '\u2013',
	ldquo: '\u201C',
	rdquo: '\u201D',
	lsquo: '\u2018',
	rsquo: '\u2019',
	hellip: '\u2026',
	copy: '\u00A9',
	reg: '\u00AE',
	trade: '\u2122',
	laquo: '\u00AB',
	raquo: '\u00BB',
	bull: '\u2022',
	middot: '\u00B7',
	deg: '\u00B0',
	prime: '\u2032',
	Prime: '\u2033',
	frac12: '\u00BD',
	frac14: '\u00BC',
	frac34: '\u00BE',
	times: '\u00D7',
	divide: '\u00F7',
	para: '\u00B6',
	sect: '\u00A7',
	euro: '\u20AC',
	pound: '\u00A3',
	yen: '\u00A5',
	cent: '\u00A2'
};

export function decodeHtmlEntities(text: string): string {
	return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
		if (entity.startsWith('#x') || entity.startsWith('#X')) {
			const code = parseInt(entity.slice(2), 16);
			return code > 0 ? String.fromCodePoint(code) : match;
		}
		if (entity.startsWith('#')) {
			const code = parseInt(entity.slice(1), 10);
			return code > 0 ? String.fromCodePoint(code) : match;
		}
		return HTML_ENTITIES[entity] ?? match;
	});
}
