import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateQuestions, type AIConfig } from '$lib/services/ai';
import { decrypt } from '$lib/utils/crypto';
import type { Highlight, Collection, QuestionType, AIProvider } from '$lib/types';
import { requireAuth } from '$lib/server/auth';

interface RequestBody {
	highlights: Highlight[];
	collection: Collection;
	questionTypes: QuestionType[];
	provider?: AIProvider;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await requireAuth({ request, locals } as any);

	try {
		const body: RequestBody = await request.json();
		const { highlights, collection, questionTypes, provider: preferredProvider } = body;

		if (!highlights?.length || !collection || !questionTypes?.length) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

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

		const result = await generateQuestions(config, highlights, collection, questionTypes);

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
