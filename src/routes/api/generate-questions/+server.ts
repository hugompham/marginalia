import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateQuestions, type AIConfig, type PromptContext } from '$lib/services/ai';
import { decrypt } from '$lib/utils/crypto';
import type { Highlight, Collection, QuestionType, AIProvider, Difficulty } from '$lib/types';
import { requireAuth } from '$lib/server/auth';

interface RequestBody {
	highlights: Highlight[];
	collection: Collection;
	questionTypes: QuestionType[];
	provider?: AIProvider;
	difficulty?: Difficulty;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await requireAuth(locals);

	try {
		const body: RequestBody = await request.json();
		const { highlights, collection, questionTypes, provider: preferredProvider, difficulty } = body;

		if (!highlights?.length || !collection || !questionTypes?.length) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const validTypes = ['cloze', 'definition', 'conceptual'];
		if (!questionTypes.every((t) => validTypes.includes(t))) {
			return json({ error: 'Invalid question type' }, { status: 400 });
		}

		const validDifficulties = ['standard', 'challenging'];
		const safeDifficulty =
			difficulty && validDifficulties.includes(difficulty) ? difficulty : undefined;

		// Fetch user's API keys from database
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

		// Select the API key to use (prefer user's choice, then OpenAI, then any available)
		let selectedKey = apiKeys.find((k) => k.provider === preferredProvider);
		if (!selectedKey) {
			selectedKey = apiKeys.find((k) => k.provider === 'openai') ?? apiKeys[0];
		}

		// Decrypt the API key
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

		// Build prompt context with tags and existing card counts
		const highlightIds = highlights.map((h) => h.id);

		const [tagsResult, cardCountsResult] = await Promise.all([
			locals.supabase
				.from('highlight_tags')
				.select('highlight_id, tags(name)')
				.in('highlight_id', highlightIds),
			locals.supabase.from('cards').select('highlight_id').in('highlight_id', highlightIds)
		]);

		const highlightTags: Record<string, string[]> = {};
		if (tagsResult.error) {
			console.error('Failed to fetch highlight tags:', tagsResult.error);
		}
		if (tagsResult.data) {
			for (const row of tagsResult.data as Array<{
				highlight_id: string;
				tags: { name: string } | null;
			}>) {
				if (!highlightTags[row.highlight_id]) highlightTags[row.highlight_id] = [];
				if (row.tags?.name) highlightTags[row.highlight_id].push(row.tags.name);
			}
		}

		const existingCardCounts: Record<string, number> = {};
		if (cardCountsResult.data) {
			for (const row of cardCountsResult.data) {
				existingCardCounts[row.highlight_id] = (existingCardCounts[row.highlight_id] ?? 0) + 1;
			}
		}

		const promptContext: PromptContext = {
			highlightTags,
			existingCardCounts,
			difficulty: safeDifficulty
		};

		const result = await generateQuestions(
			config,
			highlights,
			collection,
			questionTypes,
			promptContext
		);

		return json({
			questions: result.questions,
			usage: result.usage,
			provider: selectedKey.provider
		});
	} catch (error) {
		console.error('Question generation error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Generation failed' },
			{ status: 500 }
		);
	}
};
