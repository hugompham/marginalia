import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAuthenticatedSession } from '$lib/server/auth';
import { mapCollection, mapHighlights, mapTags } from '$lib/utils/mappers';
import type { Tag } from '$lib/types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { session } = await getAuthenticatedSession(locals);
	const { id } = params;
	const userId = session!.user.id;

	const [collectionResult, highlightsResult, tagsResult, highlightTagsResult] = await Promise.all([
		locals.supabase
			.from('collections')
			.select('*')
			.eq('id', id)
			.eq('user_id', userId)
			.single(),
		locals.supabase
			.from('highlights')
			.select('*')
			.eq('collection_id', id)
			.eq('user_id', userId)
			.order('created_at', { ascending: true }),
		locals.supabase
			.from('tags')
			.select('*')
			.eq('user_id', userId)
			.order('name'),
		// highlight_tags fetched below after we have highlight IDs
		Promise.resolve({ data: null, error: null })
	]);

	const { data: collection, error: collectionError } = collectionResult;
	const { data: highlights, error: highlightsError } = highlightsResult;
	const { data: tagsData, error: tagsError } = tagsResult;

	if (collectionError || !collection) {
		throw error(404, 'Collection not found');
	}

	if (highlightsError) {
		console.error('Failed to load highlights:', highlightsError);
	}

	if (tagsError) {
		console.error('Failed to load tags:', tagsError);
	}

	// Fetch highlight-tag relationships scoped to this collection's highlights
	const highlightIds = (highlights ?? []).map((h) => h.id);
	const { data: highlightTagsData } = highlightIds.length > 0
		? await locals.supabase
				.from('highlight_tags')
				.select('*')
				.in('highlight_id', highlightIds)
		: { data: [] };

	const tags = tagsData ? mapTags(tagsData) : [];

	// Build highlight -> tags map
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

	const highlightsWithTags = mapHighlights(highlights ?? []).map((h) => ({
		...h,
		tags: highlightTagMap.get(h.id) || []
	}));

	return {
		collection: mapCollection(collection),
		highlights: highlightsWithTags
	};
};
