import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { suggestHighlightLinks, type AIConfig } from '$lib/services/ai';
import { decrypt } from '$lib/utils/crypto';
import type { AIProvider } from '$lib/types';
import { mapHighlightLinks } from '$lib/utils/mappers';

/**
 * POST /api/highlight-links/suggest
 * Get AI-suggested links between highlights
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await requireAuth(locals);

	try {
		const { highlightIds, provider: preferredProvider } = await request.json();

		if (!Array.isArray(highlightIds) || highlightIds.length < 2) {
			return json({ error: 'At least 2 highlight IDs are required' }, { status: 400 });
		}

		if (highlightIds.length > 100) {
			return json({ error: 'Maximum 100 highlights per request' }, { status: 400 });
		}

		if (!highlightIds.every((id: unknown) => typeof id === 'string' && id.length > 0)) {
			return json({ error: 'Invalid highlight IDs' }, { status: 400 });
		}

		// Fetch highlights with collection context
		const { data: highlights, error: hlError } = await locals.supabase
			.from('highlights')
			.select('id, text, chapter, collection_id, collections(title, author)')
			.eq('user_id', user.id)
			.in('id', highlightIds);

		if (hlError || !highlights?.length) {
			return json({ error: 'Failed to fetch highlights' }, { status: 500 });
		}

		if (highlights.length < 2) {
			return json({ error: 'At least 2 valid highlights are required' }, { status: 400 });
		}

		// Fetch user's API key
		const { data: apiKeys, error: keysError } = await locals.supabase
			.from('api_keys')
			.select('provider, model, encrypted_key')
			.eq('user_id', user.id)
			.eq('is_active', true);

		if (keysError || !apiKeys?.length) {
			return json(
				{ error: 'No API key configured. Please add your API key in settings.' },
				{ status: 400 }
			);
		}

		let selectedKey = apiKeys.find((k) => k.provider === preferredProvider);
		if (!selectedKey) {
			selectedKey = apiKeys.find((k) => k.provider === 'openai') ?? apiKeys[0];
		}

		let decryptedKey: string;
		try {
			decryptedKey = await decrypt(selectedKey.encrypted_key);
		} catch (err) {
			console.error('Failed to decrypt API key:', err);
			return json(
				{ error: 'Failed to decrypt API key. Please re-add your API key in settings.' },
				{ status: 500 }
			);
		}

		const config: AIConfig = {
			provider: selectedKey.provider as AIProvider,
			apiKey: decryptedKey,
			model: selectedKey.model
		};

		// Transform highlights for the AI service
		const highlightsForAI = highlights.map((h) => ({
			id: h.id,
			text: h.text,
			chapter: h.chapter,
			collections: h.collections as { title: string; author: string | null } | null
		}));

		const result = await suggestHighlightLinks(config, highlightsForAI);

		// Filter suggestions to only reference valid highlight IDs
		const validIds = new Set(highlights.map((h) => h.id));
		result.suggestions = result.suggestions.filter(
			(s) => validIds.has(s.sourceHighlightId) && validIds.has(s.targetHighlightId)
		);

		if (result.suggestions.length === 0) {
			return json({
				suggestions: [],
				saved: [],
				usage: result.usage,
				provider: selectedKey.provider
			});
		}

		// Batch-insert suggestions as pending links (single DB round-trip)
		const rows = result.suggestions.map((s) => ({
			source_highlight_id: s.sourceHighlightId,
			target_highlight_id: s.targetHighlightId,
			user_id: user.id,
			link_type: 'ai_suggested' as const,
			description: s.description,
			ai_confidence: s.confidence,
			status: 'pending' as const
		}));

		const { data: savedRows, error: insertError } = await locals.supabase
			.from('highlight_links')
			.insert(rows)
			.select();

		if (insertError) {
			console.error('Failed to save suggestions:', insertError);
			// Return suggestions even if save failed so UI can still show them
			return json({
				suggestions: result.suggestions,
				saved: [],
				usage: result.usage,
				provider: selectedKey.provider
			});
		}

		return json({
			suggestions: result.suggestions,
			saved: mapHighlightLinks(savedRows ?? []),
			usage: result.usage,
			provider: selectedKey.provider
		});
	} catch (error) {
		console.error('Link suggestion error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Suggestion failed' },
			{ status: 500 }
		);
	}
};
