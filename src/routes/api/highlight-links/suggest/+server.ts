import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { suggestHighlightLinks, type AIConfig } from '$lib/services/ai';
import { decrypt } from '$lib/utils/crypto';
import type { AIProvider } from '$lib/types';

/**
 * POST /api/highlight-links/suggest
 * Get AI-suggested links between highlights
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await requireAuth(locals);

	try {
		const { highlightIds, provider: preferredProvider } = await request.json();

		if (!highlightIds?.length || highlightIds.length < 2) {
			return json({ error: 'At least 2 highlight IDs are required' }, { status: 400 });
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

		return json({
			suggestions: result.suggestions,
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
