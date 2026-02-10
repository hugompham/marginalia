import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

/**
 * PATCH /api/highlight-links/[id]
 * Update a highlight link (description or status)
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const user = await requireAuth(locals);

	const body = await request.json();
	const updates: Record<string, unknown> = {};

	if ('description' in body) {
		if (body.description && typeof body.description === 'string' && body.description.length > 500) {
			return json({ error: 'Description too long (max 500 characters)' }, { status: 400 });
		}
		updates.description = body.description || null;
	}
	if ('status' in body) {
		if (!['active', 'dismissed', 'pending'].includes(body.status)) {
			return json({ error: 'Invalid status' }, { status: 400 });
		}
		updates.status = body.status;
	}

	if (Object.keys(updates).length === 0) {
		return json({ error: 'No valid fields to update' }, { status: 400 });
	}

	const { data: link, error } = await locals.supabase
		.from('highlight_links')
		.update(updates)
		.eq('id', params.id)
		.eq('user_id', user.id)
		.select()
		.single();

	if (error) {
		console.error('Failed to update highlight link:', error);
		return json({ error: 'Failed to update highlight link' }, { status: 500 });
	}

	if (!link) {
		return json({ error: 'Link not found' }, { status: 404 });
	}

	return json(link);
};

/**
 * DELETE /api/highlight-links/[id]
 * Delete a highlight link
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = await requireAuth(locals);

	const { error } = await locals.supabase
		.from('highlight_links')
		.delete()
		.eq('id', params.id)
		.eq('user_id', user.id);

	if (error) {
		console.error('Failed to delete highlight link:', error);
		return json({ error: 'Failed to delete highlight link' }, { status: 500 });
	}

	return json({ success: true });
};
