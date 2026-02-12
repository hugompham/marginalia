import { describe, it, expect } from 'vitest';
import { escapeHtml, decodeHtmlEntities } from './html';

describe('HTML Utilities', () => {
	describe('escapeHtml', () => {
		it('should escape script tags', () => {
			expect(escapeHtml('<script>alert("xss")</script>')).toBe(
				'&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
			);
		});

		it('should escape all 5 special characters', () => {
			expect(escapeHtml('&')).toBe('&amp;');
			expect(escapeHtml('<')).toBe('&lt;');
			expect(escapeHtml('>')).toBe('&gt;');
			expect(escapeHtml('"')).toBe('&quot;');
			expect(escapeHtml("'")).toBe('&#039;');
		});

		it('should return empty string for empty input', () => {
			expect(escapeHtml('')).toBe('');
		});

		it('should not modify strings without special characters', () => {
			const safe = 'Hello World 123';
			expect(escapeHtml(safe)).toBe(safe);
		});

		it('should handle mixed content', () => {
			expect(escapeHtml('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d');
		});
	});

	describe('decodeHtmlEntities', () => {
		it('should decode named entities', () => {
			expect(decodeHtmlEntities('&amp;')).toBe('&');
			expect(decodeHtmlEntities('&lt;')).toBe('<');
			expect(decodeHtmlEntities('&gt;')).toBe('>');
			expect(decodeHtmlEntities('&quot;')).toBe('"');
			expect(decodeHtmlEntities('&apos;')).toBe("'");
			expect(decodeHtmlEntities('&nbsp;')).toBe('\u00A0');
			expect(decodeHtmlEntities('&mdash;')).toBe('\u2014');
		});

		it('should decode decimal numeric entities', () => {
			expect(decodeHtmlEntities('&#65;')).toBe('A');
			expect(decodeHtmlEntities('&#8212;')).toBe('\u2014'); // em-dash
		});

		it('should decode hex numeric entities', () => {
			expect(decodeHtmlEntities('&#x41;')).toBe('A');
			expect(decodeHtmlEntities('&#x2014;')).toBe('\u2014');
		});

		it('should leave invalid entities unchanged', () => {
			expect(decodeHtmlEntities('&notarealentity;')).toBe('&notarealentity;');
			expect(decodeHtmlEntities('&#0;')).toBe('&#0;');
			expect(decodeHtmlEntities('&#x0;')).toBe('&#x0;');
		});

		it('should handle text with no entities', () => {
			const plain = 'Just normal text';
			expect(decodeHtmlEntities(plain)).toBe(plain);
		});

		it('should handle multiple entities in one string', () => {
			expect(decodeHtmlEntities('&lt;div&gt;Hello&lt;/div&gt;')).toBe('<div>Hello</div>');
		});
	});
});
