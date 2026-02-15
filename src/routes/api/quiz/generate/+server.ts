import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateQuiz, type AIConfig } from '$lib/services/ai';
import { decrypt } from '$lib/utils/crypto';
import type { AIProvider } from '$lib/types';
import { requireAuth } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await requireAuth(locals);

	try {
		const body = await request.json();
		const { collectionId, questionCount = 10 } = body;

		if (!collectionId || typeof collectionId !== 'string') {
			return json({ error: 'Missing or invalid collectionId' }, { status: 400 });
		}

		if (typeof questionCount !== 'number' || questionCount < 1 || questionCount > 30) {
			return json({ error: 'questionCount must be between 1 and 30' }, { status: 400 });
		}

		// Fetch collection (verify user owns it via RLS)
		const { data: collection, error: collectionError } = await locals.supabase
			.from('collections')
			.select('id, title, author')
			.eq('id', collectionId)
			.single();

		if (collectionError || !collection) {
			return json({ error: 'Collection not found' }, { status: 404 });
		}

		// Fetch highlights for this collection
		const { data: highlights, error: highlightsError } = await locals.supabase
			.from('highlights')
			.select('id, text, note, chapter, page_number')
			.eq('collection_id', collectionId)
			.eq('is_archived', false)
			.order('created_at', { ascending: true });

		if (highlightsError) {
			console.error('Failed to fetch highlights:', highlightsError);
			return json({ error: 'Failed to fetch highlights' }, { status: 500 });
		}

		if (!highlights || highlights.length < 3) {
			return json({ error: 'Need at least 3 highlights to generate a quiz' }, { status: 400 });
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

		// Select API key: prefer OpenAI, fall back to any available
		const selectedKey = apiKeys.find((k) => k.provider === 'openai') ?? apiKeys[0];

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

		// Map DB rows to the shape generateQuiz expects
		const mappedHighlights = highlights.map((h) => ({
			id: h.id as string,
			text: h.text as string,
			note: h.note as string | null,
			chapter: h.chapter as string | null,
			pageNumber: h.page_number as number | null
		}));

		const result = await generateQuiz(
			config,
			mappedHighlights,
			{ title: collection.title, author: collection.author },
			questionCount
		);

		return json({
			questions: result.questions,
			usage: result.usage,
			provider: selectedKey.provider
		});
	} catch (error) {
		console.error('Quiz generation error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Quiz generation failed' },
			{ status: 500 }
		);
	}
};
