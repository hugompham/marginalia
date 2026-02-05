import type { PageServerLoad } from './$types';
import type { Card, CardState } from '$lib/types';
import { mapCard } from '$lib/utils/mappers';
import { getAuthenticatedSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = await getAuthenticatedSession(locals);

	const userId = session.user.id;

	// Get session type from query params
	const sessionType = url.searchParams.get('type') ?? 'due';
	const collectionId = url.searchParams.get('collection');
	const limit = parseInt(url.searchParams.get('limit') ?? '20');

	let query = locals.supabase
		.from('cards')
		.select(
			`
			*,
			highlights!inner (
				id,
				text,
				note,
				chapter,
				page_number,
				collections!inner (
					id,
					title,
					author
				)
			)
		`
		)
		.eq('user_id', userId)
		.eq('is_suspended', false);

	// Apply filters based on session type
	switch (sessionType) {
		case 'due':
			query = query.lte('due', new Date().toISOString());
			break;
		case 'new':
			query = query.eq('state', 'new');
			break;
		case 'struggling':
			query = query.gte('lapses', 2);
			break;
		// 'all' or 'quick' - no additional filter
	}

	// Filter by collection if specified
	if (collectionId) {
		query = query.eq('highlights.collection_id', collectionId);
	}

	// Order by due date and limit
	query = query.order('due', { ascending: true }).limit(limit);

	const { data: cards, error } = await query;

	if (error) {
		console.error('Failed to load cards:', error);
		return { cards: [], upcomingCount: 0, streak: 0 };
	}

	// Get upcoming cards count (for "all caught up" message)
	const { count: upcomingCount } = await locals.supabase
		.from('cards')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', userId)
		.eq('is_suspended', false)
		.gt('due', new Date().toISOString())
		.lte('due', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

	// Get user streak
	const { data: streak } = await locals.supabase.rpc('get_user_streak', {
		p_user_id: userId
	});

	// Transform to our types
	const transformedCards: Card[] = (cards ?? []).map((c) => {
		const card = mapCard(c);

		// Add joined highlight and collection data
		if (c.highlights) {
			card.highlight = {
				id: c.highlights.id,
				collectionId: c.highlights.collections?.id ?? '',
				userId,
				text: c.highlights.text,
				note: c.highlights.note,
				chapter: c.highlights.chapter,
				pageNumber: c.highlights.page_number,
				locationPercent: null,
				contextBefore: null,
				contextAfter: null,
				hasCards: true,
				isArchived: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				collection: c.highlights.collections
					? {
							id: c.highlights.collections.id,
							userId,
							title: c.highlights.collections.title,
							author: c.highlights.collections.author,
							sourceType: 'manual',
							sourceUrl: null,
							coverImageUrl: null,
							highlightCount: 0,
							cardCount: 0,
							createdAt: new Date(),
							updatedAt: new Date()
						}
					: undefined
			};
		}

		return card;
	});

	return {
		cards: transformedCards,
		upcomingCount: upcomingCount ?? 0,
		streak: streak ?? 0
	};
};
