import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

/**
 * POST /api/highlights/[id]/tags
 * Add a tag to a highlight
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = await requireAuth(locals);

	const { tagId } = await request.json();

	if (!tagId) {
		return json({ error: 'Tag ID is required' }, { status: 400 });
	}

	// Verify ownership of highlight
	const { data: highlight } = await locals.supabase
		.from('highlights')
		.select('id')
		.eq('id', params.id)
		.eq('user_id', user.user.id)
		.single();

	if (!highlight) {
		return json({ error: 'Highlight not found' }, { status: 404 });
	}

	// Add tag
	const { error } = await locals.supabase.from('highlight_tags').insert({
		highlight_id: params.id,
		tag_id: tagId
	});

	if (error) {
		if (error.code === '23505') {
			// Already tagged
			return json({ error: 'Highlight already has this tag' }, { status: 409 });
		}
		console.error('Failed to add tag:', error);
		return json({ error: 'Failed to add tag' }, { status: 500 });
	}

	return json({ success: true }, { status: 201 });
};

/**
 * DELETE /api/highlights/[id]/tags
 * Remove a tag from a highlight
 */
export const DELETE: RequestHandler = async ({ params, request, locals }) => {
	const user = await requireAuth(locals);

	const { tagId } = await request.json();

	if (!tagId) {
		return json({ error: 'Tag ID is required' }, { status: 400 });
	}

	// Verify ownership via highlight
	const { data: highlight } = await locals.supabase
		.from('highlights')
		.select('id')
		.eq('id', params.id)
		.eq('user_id', user.user.id)
		.single();

	if (!highlight) {
		return json({ error: 'Highlight not found' }, { status: 404 });
	}

	// Remove tag
	const { error } = await locals.supabase
		.from('highlight_tags')
		.delete()
		.eq('highlight_id', params.id)
		.eq('tag_id', tagId);

	if (error) {
		console.error('Failed to remove tag:', error);
		return json({ error: 'Failed to remove tag' }, { status: 500 });
	}

	return json({ success: true });
};
