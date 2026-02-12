import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { mapCollection, mapHighlight } from '$lib/utils/mappers';

/**
 * GET /api/search?q=query
 * Search collections and highlights by text
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const user = await requireAuth(locals);

	const query = url.searchParams.get('q')?.trim();

	if (!query || query.length < 2) {
		return json({ error: 'Query must be at least 2 characters' }, { status: 400 });
	}

	const pattern = `%${query}%`;

	// Search collections (title + author)
	const collectionsPromise = locals.supabase
		.from('collections')
		.select('*')
		.eq('user_id', user.id)
		.or(`title.ilike.${pattern},author.ilike.${pattern}`)
		.order('updated_at', { ascending: false })
		.limit(5);

	// Search highlights (text + note), join collection for context
	const highlightsPromise = locals.supabase
		.from('highlights')
		.select('*, collections!inner(id, title, author)')
		.eq('user_id', user.id)
		.or(`text.ilike.${pattern},note.ilike.${pattern}`)
		.order('created_at', { ascending: false })
		.limit(10);

	const [collectionsResult, highlightsResult] = await Promise.all([
		collectionsPromise,
		highlightsPromise
	]);

	if (collectionsResult.error) {
		console.error('Search collections error:', collectionsResult.error);
	}
	if (highlightsResult.error) {
		console.error('Search highlights error:', highlightsResult.error);
	}

	const collections = (collectionsResult.data ?? []).map(mapCollection);

	const highlights = (highlightsResult.data ?? []).map((row) => {
		const { collections: col, ...highlightRow } = row as Record<string, unknown>;
		const collection = col as Record<string, unknown> | null;
		return {
			...mapHighlight(highlightRow as Parameters<typeof mapHighlight>[0]),
			collection: collection
				? {
						id: collection.id as string,
						title: collection.title as string,
						author: (collection.author as string) ?? null
					}
				: null
		};
	});

	return json({ collections, highlights });
};
