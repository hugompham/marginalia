import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateSummary, type AIConfig } from '$lib/services/ai';
import { decrypt } from '$lib/utils/crypto';
import type { AIProvider } from '$lib/types';
import { requireAuth } from '$lib/server/auth';
import { mapCollectionSummary } from '$utils/mappers';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await requireAuth(locals);

	try {
		const { collectionId } = await request.json();

		if (!collectionId || typeof collectionId !== 'string') {
			return json({ error: 'Missing or invalid collectionId' }, { status: 400 });
		}

		// Fetch collection (verify ownership via RLS)
		const { data: collection, error: collectionError } = await locals.supabase
			.from('collections')
			.select('id, title, author')
			.eq('id', collectionId)
			.single();

		if (collectionError || !collection) {
			return json({ error: 'Collection not found' }, { status: 404 });
		}

		// Fetch highlights (cap at 50, ordered by position)
		const { data: highlights, error: highlightsError } = await locals.supabase
			.from('highlights')
			.select('text, note, chapter, page_number')
			.eq('collection_id', collectionId)
			.eq('is_archived', false)
			.order('page_number', { ascending: true, nullsFirst: false })
			.order('created_at', { ascending: true })
			.limit(50);

		if (highlightsError) {
			console.error('Failed to fetch highlights:', highlightsError);
			return json({ error: 'Failed to fetch highlights' }, { status: 500 });
		}

		if (!highlights?.length) {
			return json({ error: 'No highlights found for this collection' }, { status: 400 });
		}

		// Fetch user's API keys
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

		// Select API key (prefer OpenAI, fall back to any available)
		const selectedKey = apiKeys.find((k) => k.provider === 'openai') ?? apiKeys[0];

		// Decrypt API key
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

		// Map DB rows to prompt-friendly shape
		const mappedHighlights = highlights.map((h) => ({
			text: h.text,
			note: h.note,
			chapter: h.chapter,
			pageNumber: h.page_number
		}));

		const result = await generateSummary(config, mappedHighlights, {
			title: collection.title,
			author: collection.author
		});

		// Upsert into collection_summaries
		const { data: upserted, error: upsertError } = await locals.supabase
			.from('collection_summaries')
			.upsert(
				{
					collection_id: collectionId,
					user_id: user.id,
					summary: result.summary,
					themes: result.themes,
					highlight_count: result.highlightCount,
					provider: selectedKey.provider,
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'collection_id,user_id' }
			)
			.select('*')
			.single();

		if (upsertError || !upserted) {
			console.error('Failed to save summary:', upsertError);
			return json({ error: 'Failed to save summary' }, { status: 500 });
		}

		const mapped = mapCollectionSummary(upserted as Record<string, unknown>);

		return json(mapped);
	} catch (error) {
		console.error('Summary generation error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Summary generation failed' },
			{ status: 500 }
		);
	}
};
