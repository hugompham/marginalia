import type { PageServerLoad } from './$types';
import { mapCollections } from '$lib/utils/mappers';
import { getAuthenticatedSession } from '$lib/server/auth';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = await getAuthenticatedSession(locals);

	const page = parseInt(url.searchParams.get('page') || '1');
	const offset = (page - 1) * PAGE_SIZE;

	// Get total count
	const { count } = await locals.supabase
		.from('collections')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', session.user.id);

	// Get paginated collections
	const { data: collections, error } = await locals.supabase
		.from('collections')
		.select('*')
		.eq('user_id', session.user.id)
		.order('updated_at', { ascending: false })
		.range(offset, offset + PAGE_SIZE - 1);

	if (error) {
		console.error('Failed to load collections:', error);
		return {
			collections: [],
			totalCount: 0,
			currentPage: page,
			totalPages: 0
		};
	}

	const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

	return {
		collections: mapCollections(collections),
		totalCount: count || 0,
		currentPage: page,
		totalPages
	};
};
