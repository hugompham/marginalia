import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { mapCollectionSummary } from '$utils/mappers';

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = await requireAuth(locals);
	const { collectionId } = params;

	if (!collectionId) {
		return json({ error: 'Missing collectionId' }, { status: 400 });
	}

	const { data: row, error } = await locals.supabase
		.from('collection_summaries')
		.select('*')
		.eq('collection_id', collectionId)
		.eq('user_id', user.id)
		.single();

	if (error || !row) {
		return json({ error: 'No summary found' }, { status: 404 });
	}

	return json(mapCollectionSummary(row as Record<string, unknown>));
};
