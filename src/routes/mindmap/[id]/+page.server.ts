import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAuthenticatedSession } from '$lib/server/auth';
import { mapCollection, mapHighlights, mapTags, mapHighlightLinks } from '$lib/utils/mappers';
import type { Tag, Highlight } from '$lib/types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { session } = await getAuthenticatedSession(locals);
	const { id } = params;
	const userId = session!.user.id;

	const [collectionResult, highlightsResult, tagsResult, highlightTagsResult] = await Promise.all([
		locals.supabase.from('collections').select('*').eq('id', id).eq('user_id', userId).single(),
		locals.supabase
			.from('highlights')
			.select('*')
			.eq('collection_id', id)
			.eq('user_id', userId)
			.order('created_at', { ascending: true }),
		locals.supabase.from('tags').select('*').eq('user_id', userId).order('name'),
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
	const { data: highlightTagsData } =
		highlightIds.length > 0
			? await locals.supabase.from('highlight_tags').select('*').in('highlight_id', highlightIds)
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

	// Fetch highlight links where source or target is in this collection
	const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	const localIds = highlightsWithTags.map((h) => h.id).filter((id) => UUID_RE.test(id));
	let highlightLinks = [];
	let pendingSuggestions = [];
	let externalHighlights: Array<Highlight & { collectionTitle: string }> = [];

	if (localIds.length > 0) {
		const { data: linksData } = await locals.supabase
			.from('highlight_links')
			.select('*')
			.eq('user_id', userId)
			.or(
				`source_highlight_id.in.(${localIds.join(',')}),target_highlight_id.in.(${localIds.join(',')})`
			);

		const allLinks = mapHighlightLinks(linksData ?? []);
		highlightLinks = allLinks.filter((l) => l.status === 'active');
		pendingSuggestions = allLinks.filter((l) => l.status === 'pending');

		// Collect external highlight IDs (from other collections)
		const localIdSet = new Set(localIds);
		const externalIds = new Set<string>();
		for (const link of allLinks) {
			if (!localIdSet.has(link.sourceHighlightId)) externalIds.add(link.sourceHighlightId);
			if (!localIdSet.has(link.targetHighlightId)) externalIds.add(link.targetHighlightId);
		}

		if (externalIds.size > 0) {
			const { data: extData } = await locals.supabase
				.from('highlights')
				.select('*, collections(title)')
				.eq('user_id', userId)
				.in('id', [...externalIds]);

			externalHighlights = mapHighlights(extData ?? []).map((h) => {
				const raw = (extData ?? []).find((r) => r.id === h.id);
				const colTitle =
					raw?.collections && typeof raw.collections === 'object' && 'title' in raw.collections
						? (raw.collections as { title: string }).title
						: 'Unknown';
				return { ...h, collectionTitle: colTitle };
			});
		}
	}

	return {
		collection: mapCollection(collection),
		highlights: highlightsWithTags,
		highlightLinks,
		pendingSuggestions,
		externalHighlights
	};
};
