import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { DOMParser, Element } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

interface RequestBody {
	url: string;
}

interface ArticleData {
	title: string;
	author: string | null;
	content: string;
	excerpt: string | null;
	siteName: string | null;
	publishedDate: string | null;
	url: string;
}

function extractMetaContent(doc: Document, selectors: string[]): string | null {
	for (const selector of selectors) {
		const element = doc.querySelector(selector);
		if (element) {
			const content = element.getAttribute('content') || element.textContent;
			if (content?.trim()) {
				return content.trim();
			}
		}
	}
	return null;
}

function extractArticleContent(doc: Document): string {
	// Remove script, style, nav, footer, header, aside elements
	const elementsToRemove = doc.querySelectorAll(
		'script, style, nav, footer, header, aside, .sidebar, .comments, .advertisement, .ad, [role="navigation"], [role="banner"], [role="contentinfo"]'
	);
	elementsToRemove.forEach((el) => el.remove());

	// Try common article selectors
	const articleSelectors = [
		'article',
		'[role="main"]',
		'main',
		'.post-content',
		'.article-content',
		'.entry-content',
		'.content',
		'#content',
		'.post',
		'.article'
	];

	let articleElement: Element | null = null;

	for (const selector of articleSelectors) {
		articleElement = doc.querySelector(selector) as Element | null;
		if (articleElement && articleElement.textContent && articleElement.textContent.length > 200) {
			break;
		}
	}

	// Fall back to body if no article container found
	if (!articleElement) {
		articleElement = doc.body as unknown as Element;
	}

	if (!articleElement) {
		return '';
	}

	// Extract text content with paragraph structure
	const paragraphs: string[] = [];
	const textNodes = articleElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote');

	textNodes.forEach((node) => {
		const text = node.textContent?.trim();
		if (text && text.length > 20) {
			// Filter out very short paragraphs
			const tagName = node.tagName.toLowerCase();
			if (tagName.startsWith('h')) {
				paragraphs.push(`## ${text}`);
			} else if (tagName === 'blockquote') {
				paragraphs.push(`> ${text}`);
			} else {
				paragraphs.push(text);
			}
		}
	});

	return paragraphs.join('\n\n');
}

serve(async (req) => {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const body: RequestBody = await req.json();
		const { url } = body;

		if (!url) {
			return new Response(JSON.stringify({ error: 'URL is required' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Validate URL
		let parsedUrl: URL;
		try {
			parsedUrl = new URL(url);
		} catch {
			return new Response(JSON.stringify({ error: 'Invalid URL' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Fetch the page
		const response = await fetch(parsedUrl.href, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (compatible; Marginalia/1.0; +https://marginalia.app)',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
			}
		});

		if (!response.ok) {
			return new Response(
				JSON.stringify({ error: `Failed to fetch URL: ${response.status}` }),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		const html = await response.text();
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');

		if (!doc) {
			return new Response(JSON.stringify({ error: 'Failed to parse HTML' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Extract metadata
		const title =
			extractMetaContent(doc, [
				'meta[property="og:title"]',
				'meta[name="twitter:title"]',
				'title'
			]) || 'Untitled';

		const author = extractMetaContent(doc, [
			'meta[name="author"]',
			'meta[property="article:author"]',
			'.author',
			'[rel="author"]'
		]);

		const siteName = extractMetaContent(doc, [
			'meta[property="og:site_name"]',
			'meta[name="application-name"]'
		]);

		const publishedDate = extractMetaContent(doc, [
			'meta[property="article:published_time"]',
			'meta[name="date"]',
			'time[datetime]'
		]);

		const excerpt = extractMetaContent(doc, [
			'meta[property="og:description"]',
			'meta[name="description"]',
			'meta[name="twitter:description"]'
		]);

		// Extract content
		const content = extractArticleContent(doc as unknown as Document);

		if (!content || content.length < 100) {
			return new Response(
				JSON.stringify({ error: 'Could not extract article content' }),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		const articleData: ArticleData = {
			title,
			author,
			content,
			excerpt,
			siteName,
			publishedDate,
			url: parsedUrl.href
		};

		return new Response(JSON.stringify(articleData), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Scrape error:', error);
		return new Response(
			JSON.stringify({ error: error.message || 'Failed to scrape URL' }),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
});
