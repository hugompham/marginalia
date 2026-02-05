import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/public';
import { requireAuth } from '$lib/server/auth';

interface RequestBody {
	url: string;
}

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
	await requireAuth(locals);

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
		const supabaseUrl =
			env.PUBLIC_SUPABASE_URL ||
			(typeof process !== 'undefined' ? process.env.PUBLIC_SUPABASE_URL : undefined);
		const supabaseAnonKey =
			env.PUBLIC_SUPABASE_ANON_KEY ||
			(typeof process !== 'undefined' ? process.env.PUBLIC_SUPABASE_ANON_KEY : undefined);

		if (!supabaseUrl || !supabaseAnonKey) {
			// Fall back to direct scraping if Edge Function not available
			return await scrapeDirectly(url);
		}

		const response = await fetch(`${supabaseUrl}/functions/v1/scrape-url`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${supabaseAnonKey}`
			},
			body: JSON.stringify({ url })
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return json(
				{ error: errorData.error || 'Failed to fetch article' },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Scrape error:', error);
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
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; Marginalia/1.0)',
				Accept: 'text/html,application/xhtml+xml'
			}
		});

		if (!response.ok) {
			return json({ error: `Failed to fetch: ${response.status}` }, { status: 400 });
		}

		const html = await response.text();

		// Basic extraction using regex (simplified for fallback)
		const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
		const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

		// Extract meta description
		const descMatch = html.match(
			/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
		);
		const excerpt = descMatch ? descMatch[1] : null;

		// Extract author from meta
		const authorMatch = html.match(
			/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i
		);
		const author = authorMatch ? authorMatch[1] : null;

		// Basic content extraction - get all paragraph text
		const paragraphs: string[] = [];
		const pRegex = /<p[^>]*>([^<]+(?:<[^p][^>]*>[^<]*<\/[^p][^>]*>)*[^<]*)<\/p>/gi;
		let match;

		while ((match = pRegex.exec(html)) !== null) {
			const text = match[1]
				.replace(/<[^>]+>/g, '')
				.trim();
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
