import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { mapTag } from '$lib/utils/mappers';

/**
 * PATCH /api/tags/[id]
 * Update a tag
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = await requireAuth(locals);

	const { name, color } = await request.json();

	if (!name || typeof name !== 'string') {
		return json({ error: 'Tag name is required' }, { status: 400 });
	}

	const { data: tag, error } = await locals.supabase
		.from('tags')
		.update({
			name: name.trim(),
			color: color || null
		})
		.eq('id', params.id)
		.eq('user_id', session.user.id)
		.select()
		.single();

	if (error) {
		if (error.code === '23505') {
			return json({ error: 'A tag with this name already exists' }, { status: 409 });
		}
		console.error('Failed to update tag:', error);
		return json({ error: 'Failed to update tag' }, { status: 500 });
	}

	if (!tag) {
		return json({ error: 'Tag not found' }, { status: 404 });
	}

	return json(mapTag(tag));
};

/**
 * DELETE /api/tags/[id]
 * Delete a tag
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const session = await requireAuth(locals);

	const { error } = await locals.supabase
		.from('tags')
		.delete()
		.eq('id', params.id)
		.eq('user_id', session.user.id);

	if (error) {
		console.error('Failed to delete tag:', error);
		return json({ error: 'Failed to delete tag' }, { status: 500 });
	}

	return json({ success: true });
};
