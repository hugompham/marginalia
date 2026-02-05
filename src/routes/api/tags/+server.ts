import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { mapTag } from '$lib/utils/mappers';

/**
 * GET /api/tags
 * List all tags for the authenticated user
 */
export const GET: RequestHandler = async ({ locals }) => {
	const user = await requireAuth(locals);

	const { data: tags, error } = await locals.supabase
		.from('tags')
		.select('*')
		.eq('user_id', user.user.id)
		.order('name');

	if (error) {
		console.error('Failed to fetch tags:', error);
		return json({ error: 'Failed to fetch tags' }, { status: 500 });
	}

	return json(tags.map(mapTag));
};

/**
 * POST /api/tags
 * Create a new tag
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await requireAuth(locals);

	const { name, color } = await request.json();

	if (!name || typeof name !== 'string') {
		return json({ error: 'Tag name is required' }, { status: 400 });
	}

	const { data: tag, error } = await locals.supabase
		.from('tags')
		.insert({
			user_id: user.user.id,
			name: name.trim(),
			color: color || null
		})
		.select()
		.single();

	if (error) {
		if (error.code === '23505') {
			// Unique constraint violation
			return json({ error: 'A tag with this name already exists' }, { status: 409 });
		}
		console.error('Failed to create tag:', error);
		return json({ error: 'Failed to create tag' }, { status: 500 });
	}

	return json(mapTag(tag), { status: 201 });
};
