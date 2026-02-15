import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getAuthenticatedSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await getAuthenticatedSession(locals);

	// Fetch collection (RLS ensures ownership)
	const { data: collectionData, error } = await locals.supabase
		.from('collections')
		.select('id, title, author, highlight_count, card_count')
		.eq('id', params.id)
		.single();

	if (error || !collectionData) {
		throw redirect(303, '/library');
	}

	// Cast to work around Supabase generated types producing `never` for partial selects
	const collection = collectionData as Record<string, unknown>;

	// Fetch API keys for provider detection
	const { data: apiKeysData } = await locals.supabase
		.from('api_keys')
		.select('provider, key_hint')
		.eq('user_id', user.id);

	const apiKeys = (apiKeysData ?? []) as Record<string, unknown>[];
	const hasOpenAI = apiKeys.some((k) => k.provider === 'openai');
	const hasAnthropic = apiKeys.some((k) => k.provider === 'anthropic');

	return {
		collection: {
			id: collection.id as string,
			title: collection.title as string,
			author: collection.author as string | null,
			highlightCount: collection.highlight_count as number,
			cardCount: collection.card_count as number
		},
		hasApiKey: hasOpenAI || hasAnthropic
	};
};
