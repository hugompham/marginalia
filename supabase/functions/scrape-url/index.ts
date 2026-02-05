import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { DOMParser, Element } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

function isPublicUrl(url: URL): boolean {
	const hostname = url.hostname.toLowerCase();

	// Block localhost
	if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
		return false;
	}

	// Block private IPv4 ranges
	const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
	if (ipv4Match) {
		const [, a, b, c, d] = ipv4Match.map(Number);
		// 10.0.0.0/8
		if (a === 10) return false;
		// 172.16.0.0/12
		if (a === 172 && b >= 16 && b <= 31) return false;
		// 192.168.0.0/16
		if (a === 192 && b === 168) return false;
		// 169.254.0.0/16 (link-local)
		if (a === 169 && b === 254) return false;
		// 127.0.0.0/8 (loopback)
		if (a === 127) return false;
	}

	// Block link-local IPv6 (fe80::/10)
	if (hostname.startsWith('fe80:') || hostname.startsWith('[fe80:')) {
		return false;
	}

	// Block localhost IPv6
	if (hostname === '::1' || hostname === '[::1]') {
		return false;
	}

	return true;
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
		// Verify JWT token
		const authHeader = req.headers.get('Authorization');
		if (!authHeader) {
			return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
				status: 401,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const token = authHeader.replace('Bearer ', '');
		const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
		const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

		const supabase = createClient(supabaseUrl, supabaseAnonKey, {
			global: {
				headers: { Authorization: authHeader }
			}
		});

		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser(token);

		if (authError || !user) {
			return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
				status: 401,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

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

		// SSRF protection: block private IP ranges
		if (!isPublicUrl(parsedUrl)) {
			return new Response(
				JSON.stringify({ error: 'Access to private/local IP addresses is not allowed' }),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
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
