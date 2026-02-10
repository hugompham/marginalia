import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { mapHighlightLinks } from '$lib/utils/mappers';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/highlight-links
 * List highlight links with optional filters
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const user = await requireAuth(locals);

	const status = url.searchParams.get('status');
	const collectionId = url.searchParams.get('collectionId');

	let query = locals.supabase
		.from('highlight_links')
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (status) {
		query = query.eq('status', status);
	}

	if (collectionId) {
		// Filter links where either source or target belongs to this collection
		const { data: highlightIds } = await locals.supabase
			.from('highlights')
			.select('id')
			.eq('collection_id', collectionId)
			.eq('user_id', user.id);

		if (!highlightIds?.length) {
			return json([]);
		}

		const ids = highlightIds.map((h) => h.id).filter((id) => UUID_RE.test(id));
		if (!ids.length) {
			return json([]);
		}
		query = query.or(
			`source_highlight_id.in.(${ids.join(',')}),target_highlight_id.in.(${ids.join(',')})`
		);
	}

	const { data, error } = await query;

	if (error) {
		console.error('Failed to fetch highlight links:', error);
		return json({ error: 'Failed to fetch highlight links' }, { status: 500 });
	}

	return json(mapHighlightLinks(data ?? []));
};

/**
 * POST /api/highlight-links
 * Create a manual highlight link
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await requireAuth(locals);

	const {
		sourceHighlightId,
		targetHighlightId,
		description,
		linkType,
		status: linkStatus,
		aiConfidence
	} = await request.json();

	if (!sourceHighlightId || !targetHighlightId) {
		return json({ error: 'Source and target highlight IDs are required' }, { status: 400 });
	}

	if (sourceHighlightId === targetHighlightId) {
		return json({ error: 'Cannot link a highlight to itself' }, { status: 400 });
	}

	if (description && typeof description === 'string' && description.length > 500) {
		return json({ error: 'Description too long (max 500 characters)' }, { status: 400 });
	}

	const validLinkTypes = ['manual', 'ai_suggested'];
	const validStatuses = ['active', 'pending', 'dismissed'];
	const resolvedLinkType = validLinkTypes.includes(linkType) ? linkType : 'manual';
	const resolvedStatus = validStatuses.includes(linkStatus) ? linkStatus : 'active';

	// Verify both highlights belong to the user
	const { data: highlights, error: hlError } = await locals.supabase
		.from('highlights')
		.select('id')
		.eq('user_id', user.id)
		.in('id', [sourceHighlightId, targetHighlightId]);

	if (hlError || !highlights || highlights.length !== 2) {
		return json({ error: 'One or both highlights not found' }, { status: 404 });
	}

	const { data: link, error } = await locals.supabase
		.from('highlight_links')
		.insert({
			source_highlight_id: sourceHighlightId,
			target_highlight_id: targetHighlightId,
			user_id: user.id,
			link_type: resolvedLinkType,
			description: description || null,
			ai_confidence: typeof aiConfidence === 'number' ? aiConfidence : null,
			status: resolvedStatus
		})
		.select()
		.single();

	if (error) {
		if (error.code === '23505') {
			return json({ error: 'This link already exists' }, { status: 409 });
		}
		console.error('Failed to create highlight link:', error);
		return json({ error: 'Failed to create highlight link' }, { status: 500 });
	}

	return json(link, { status: 201 });
};
