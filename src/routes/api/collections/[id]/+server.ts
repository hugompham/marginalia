import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { mapCollection } from '$lib/utils/mappers';

/**
 * PATCH /api/collections/[id]
 * Update a collection's title and/or author
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const user = await requireAuth(locals);

	const { title, author } = await request.json();

	if (!title || typeof title !== 'string' || !title.trim()) {
		return json({ error: 'Title is required' }, { status: 400 });
	}

	const { data: collection, error } = await locals.supabase
		.from('collections')
		.update({
			title: title.trim(),
			author: author?.trim() || null
		})
		.eq('id', params.id)
		.eq('user_id', user.id)
		.select()
		.single();

	if (error) {
		console.error('Failed to update collection:', error);
		return json({ error: 'Failed to update collection' }, { status: 500 });
	}

	if (!collection) {
		return json({ error: 'Collection not found' }, { status: 404 });
	}

	return json(mapCollection(collection));
};

/**
 * DELETE /api/collections/[id]
 * Delete a collection (CASCADE handles highlights, cards, etc.)
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = await requireAuth(locals);

	const { error } = await locals.supabase
		.from('collections')
		.delete()
		.eq('id', params.id)
		.eq('user_id', user.id);

	if (error) {
		console.error('Failed to delete collection:', error);
		return json({ error: 'Failed to delete collection' }, { status: 500 });
	}

	return json({ success: true });
};
