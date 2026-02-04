import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Collection } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	if (!session) {
		throw redirect(303, '/auth/login');
	}

	const { data: collections, error } = await locals.supabase
		.from('collections')
		.select('*')
		.eq('user_id', session.user.id)
		.order('updated_at', { ascending: false });

	if (error) {
		console.error('Failed to load collections:', error);
		return { collections: [] };
	}

	return {
		collections: collections.map(
			(c): Collection => ({
				id: c.id,
				userId: c.user_id,
				title: c.title,
				author: c.author,
				sourceType: c.source_type as Collection['sourceType'],
				sourceUrl: c.source_url,
				coverImageUrl: c.cover_image_url,
				highlightCount: c.highlight_count,
				cardCount: c.card_count,
				createdAt: new Date(c.created_at),
				updatedAt: new Date(c.updated_at)
			})
		)
	};
};
