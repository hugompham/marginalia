import { getAuthenticatedSession } from '$lib/server/auth';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { AIProvider, Tag, Highlight } from '$lib/types';
import { mapCollection, mapHighlights, mapTags } from '$lib/utils/mappers';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { session } = await getAuthenticatedSession(locals);

	const { id } = params;

	// Fetch collection, highlights, tags, and API keys in parallel
	const [collectionResult, highlightsResult, tagsResult, highlightTagsResult, apiKeysResult] = await Promise.all([
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
			.from('tags')
			.select('*')
			.eq('user_id', session.user.id)
			.order('name'),
		locals.supabase
			.from('highlight_tags')
			.select('highlight_id, tag_id'),
		locals.supabase
			.from('api_keys')
			.select('provider, model')
			.eq('user_id', session.user.id)
	]);

	const { data: collection, error: collectionError } = collectionResult;
	const { data: highlights, error: highlightsError } = highlightsResult;
	const { data: tagsData, error: tagsError } = tagsResult;
	const { data: highlightTagsData, error: highlightTagsError } = highlightTagsResult;
	const { data: apiKeys, error: apiKeysError } = apiKeysResult;

	if (collectionError || !collection) {
		throw error(404, 'Collection not found');
	}

	if (highlightsError) {
		console.error('Failed to load highlights:', highlightsError);
	}

	if (tagsError || highlightTagsError) {
		console.error('Failed to load tags:', tagsError || highlightTagsError);
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

	// Map tags
	const tags = tagsData ? mapTags(tagsData) : [];

	// Create a map of highlight_id -> Tag[]
	const highlightTagMap = new Map<string, Tag[]>();
	for (const ht of highlightTagsData ?? []) {
		const tag = tags.find((t) => t.id === ht.tag_id);
		if (tag) {
			if (!highlightTagMap.has(ht.highlight_id)) {
				highlightTagMap.set(ht.highlight_id, []);
			}
			highlightTagMap.get(ht.highlight_id)!.push(tag);
		}
	}

	// Extend highlights with tags
	type HighlightWithTags = Highlight & { tags: Tag[] };
	const highlightsWithTags: HighlightWithTags[] = mapHighlights(highlights ?? []).map((h) => ({
		...h,
		tags: highlightTagMap.get(h.id) || []
	}));

	return {
		collection: mapCollection(collection),
		highlights: highlightsWithTags,
		availableTags: tags,
		apiKeys: apiKeyMap
	};
};
