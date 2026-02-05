import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { testApiKey } from '$lib/services/ai';
import type { AIProvider } from '$lib/types';
import { requireAuth } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals }) => {
	await requireAuth(locals);

	const body = await request.json();
	const { provider, key, model } = body as {
		provider: AIProvider;
		key: string;
		model: string;
	};

	if (!provider || !key || !model) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	const result = await testApiKey(provider, key, model);

	if (result.valid) {
		return json({ success: true });
	} else {
		return json({ error: result.error || 'Invalid API key' }, { status: 400 });
	}
};
