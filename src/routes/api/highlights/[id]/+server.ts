import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { mapHighlight } from '$lib/utils/mappers';

/**
 * PATCH /api/highlights/[id]
 * Update a highlight's text and/or note
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const user = await requireAuth(locals);

	const { text, note } = await request.json();

	if (!text || typeof text !== 'string' || !text.trim()) {
		return json({ error: 'Highlight text is required' }, { status: 400 });
	}

	const { data: highlight, error } = await locals.supabase
		.from('highlights')
		.update({
			text: text.trim(),
			note: note?.trim() || null
		})
		.eq('id', params.id)
		.eq('user_id', user.id)
		.select()
		.single();

	if (error) {
		console.error('Failed to update highlight:', error);
		return json({ error: 'Failed to update highlight' }, { status: 500 });
	}

	if (!highlight) {
		return json({ error: 'Highlight not found' }, { status: 404 });
	}

	return json(mapHighlight(highlight));
};

/**
 * DELETE /api/highlights/[id]
 * Delete a highlight (CASCADE handles cards, links, etc.)
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = await requireAuth(locals);

	const { error } = await locals.supabase
		.from('highlights')
		.delete()
		.eq('id', params.id)
		.eq('user_id', user.id);

	if (error) {
		console.error('Failed to delete highlight:', error);
		return json({ error: 'Failed to delete highlight' }, { status: 500 });
	}

	return json({ success: true });
};
