import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { requireAuth } from '$lib/server/auth';
import { decodeHtmlEntities } from '$lib/utils/html';

interface RequestBody {
	url: string;
}

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
	await requireAuth(locals);

	const session = await locals.getSession();

	try {
		const body: RequestBody = await request.json();
		const { url } = body;

		if (!url) {
			return json({ error: 'URL is required' }, { status: 400 });
		}

		// Validate URL
		let parsedUrl: URL;
		try {
			parsedUrl = new URL(url);
		} catch {
			return json({ error: 'Invalid URL' }, { status: 400 });
		}

		// SSRF protection: block private IP ranges
		if (!isPublicUrl(parsedUrl)) {
			return json(
				{ error: 'Access to private/local IP addresses is not allowed' },
				{ status: 400 }
			);
		}

		// Call the Supabase Edge Function
		if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY || !session) {
			return await scrapeDirectly(url);
		}

		try {
			const response = await fetch(`${PUBLIC_SUPABASE_URL}/functions/v1/scrape-url`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`,
					apikey: PUBLIC_SUPABASE_ANON_KEY
				},
				body: JSON.stringify({ url })
			});

			if (!response.ok) {
				console.warn('Edge function failed, falling back to direct scraping:', response.status);
				return await scrapeDirectly(url);
			}

			const data = await response.json();
			return json(data);
		} catch (edgeFunctionError) {
			console.warn('Edge function error, falling back to direct scraping:', edgeFunctionError);
			return await scrapeDirectly(url);
		}
	} catch (error) {
		console.error('Scrape error (outer catch):', error);
		if (error instanceof Error) {
			console.error('Error stack:', error.stack);
		}
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch article' },
			{ status: 500 }
		);
	}
};

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

// Fallback direct scraping for development
async function scrapeDirectly(url: string) {
	try {
		console.log('Direct scraping started for:', url);
		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9',
				'Accept-Encoding': 'gzip, deflate, br'
			}
		});

		console.log('Direct scraping response status:', response.status);
		if (!response.ok) {
			console.error('Direct scraping failed with status:', response.status);
			return json({ error: `Failed to fetch: ${response.status}` }, { status: 400 });
		}

		const html = await response.text();
		console.log('HTML length:', html.length);

		// Basic extraction using regex (simplified for fallback)
		const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
		const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : 'Untitled';
		console.log('Extracted title:', title);

		// Extract meta description - try multiple formats
		let excerpt = null;
		const descMatch1 = html.match(
			/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
		);
		const descMatch2 = html.match(
			/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i
		);
		const descMatch3 = html.match(
			/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
		);
		const descMatch4 = html.match(
			/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i
		);
		const rawExcerpt =
			descMatch1?.[1] || descMatch2?.[1] || descMatch3?.[1] || descMatch4?.[1] || null;
		excerpt = rawExcerpt ? decodeHtmlEntities(rawExcerpt) : null;
		console.log('Extracted excerpt:', excerpt ? excerpt.substring(0, 100) + '...' : 'none');

		// Extract author from meta - try multiple formats
		let author = null;
		const authorMatch1 = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i);
		const authorMatch2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']author["']/i);
		const authorMatch3 = html.match(
			/<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']+)["']/i
		);
		const rawAuthor = authorMatch1?.[1] || authorMatch2?.[1] || authorMatch3?.[1] || null;
		author = rawAuthor ? decodeHtmlEntities(rawAuthor) : null;
		console.log('Extracted author:', author);

		// Basic content extraction - get all paragraph text
		const paragraphs: string[] = [];
		const pRegex = /<p[^>]*>([^<]+(?:<[^p][^>]*>[^<]*<\/[^p][^>]*>)*[^<]*)<\/p>/gi;
		let match;

		while ((match = pRegex.exec(html)) !== null) {
			const text = decodeHtmlEntities(match[1].replace(/<[^>]+>/g, '').trim());
			if (text.length > 50) {
				paragraphs.push(text);
			}
		}

		const content = paragraphs.join('\n\n');

		if (content.length < 100) {
			return json({ error: 'Could not extract article content' }, { status: 400 });
		}

		return json({
			title,
			author,
			content,
			excerpt,
			siteName: new URL(url).hostname,
			publishedDate: null,
			url
		});
	} catch (error) {
		console.error('Direct scrape error:', error);
		return json({ error: 'Failed to scrape URL' }, { status: 500 });
	}
}
