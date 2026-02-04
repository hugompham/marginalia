import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Collection, Highlight, AIProvider } from '$lib/types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const session = await locals.getSession();

	if (!session) {
		throw redirect(303, '/auth/login');
	}

	const { id } = params;

	// Fetch collection, highlights, and API keys in parallel
	const [collectionResult, highlightsResult, apiKeysResult] = await Promise.all([
		locals.supabase
			.from('collections')
			.select('*')
			.eq('id', id)
			.eq('user_id', session.user.id)
			.single(),
		locals.supabase
			.from('highlights')
			.select('*')
			.eq('collection_id', id)
			.eq('user_id', session.user.id)
			.order('created_at', { ascending: true }),
		locals.supabase
			.from('api_keys')
			.select('provider, model')
			.eq('user_id', session.user.id)
	]);

	const { data: collection, error: collectionError } = collectionResult;
	const { data: highlights, error: highlightsError } = highlightsResult;
	const { data: apiKeys, error: apiKeysError } = apiKeysResult;

	if (collectionError || !collection) {
		throw error(404, 'Collection not found');
	}

	if (highlightsError) {
		console.error('Failed to load highlights:', highlightsError);
	}

	if (apiKeysError) {
		console.error('Failed to load API keys:', apiKeysError);
	}

	// Parse API keys into a map by provider
	const apiKeyMap: Record<AIProvider, { model: string } | null> = {
		openai: null,
		anthropic: null
	};

	for (const key of apiKeys ?? []) {
		apiKeyMap[key.provider as AIProvider] = {
			model: key.model
		};
	}

	return {
		collection: {
			id: collection.id,
			userId: collection.user_id,
			title: collection.title,
			author: collection.author,
			sourceType: collection.source_type as Collection['sourceType'],
			sourceUrl: collection.source_url,
			coverImageUrl: collection.cover_image_url,
			highlightCount: collection.highlight_count,
			cardCount: collection.card_count,
			createdAt: new Date(collection.created_at),
			updatedAt: new Date(collection.updated_at)
		} as Collection,
		highlights: (highlights ?? []).map(
			(h): Highlight => ({
				id: h.id,
				collectionId: h.collection_id,
				userId: h.user_id,
				text: h.text,
				note: h.note,
				chapter: h.chapter,
				pageNumber: h.page_number,
				locationPercent: h.location_percent ? parseFloat(h.location_percent) : null,
				contextBefore: h.context_before,
				contextAfter: h.context_after,
				hasCards: h.has_cards,
				isArchived: h.is_archived,
				createdAt: new Date(h.created_at),
				updatedAt: new Date(h.updated_at)
			})
		),
		apiKeys: apiKeyMap
	};
};
