import type { PageServerLoad } from './$types';
import { getAuthenticatedSession } from '$lib/server/auth';
import { mapCollections } from '$lib/utils/mappers';
import type { TagConnection } from '$components/mindmap';
import type { Tag, CollectionLinkCount } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await getAuthenticatedSession(locals);

	const userId = session!.user.id;

	// Fetch collections
	const { data: collectionsData, error: collectionsError } = await locals.supabase
		.from('collections')
		.select('*')
		.eq('user_id', userId)
		.order('updated_at', { ascending: false });

	if (collectionsError) {
		console.error('Failed to load collections:', collectionsError);
	}

	// Fetch highlights (just id + collection_id for mapping)
	const { data: highlightsData } = await locals.supabase
		.from('highlights')
		.select('*')
		.eq('user_id', userId);

	// Fetch tags
	const { data: tagsData } = await locals.supabase.from('tags').select('*').eq('user_id', userId);

	const highlights = highlightsData ?? [];

	// Fetch highlight-tag relationships scoped to user's highlights
	const highlightIds = highlights.map((h) => h.id);
	const { data: highlightTagsData } =
		highlightIds.length > 0
			? await locals.supabase.from('highlight_tags').select('*').in('highlight_id', highlightIds)
			: { data: [] };
	const allTags = tagsData ?? [];
	const highlightTags = highlightTagsData ?? [];

	// Build highlight -> collection mapping
	const highlightToCollection = new Map<string, string>();
	for (const h of highlights) {
		highlightToCollection.set(h.id, h.collection_id);
	}

	// Build tag lookup
	const tagById = new Map(allTags.map((t) => [t.id, t]));

	// Build tag connections: collection -> tag relationships
	const tagConnections: TagConnection[] = [];
	const seen = new Set<string>();

	for (const ht of highlightTags) {
		const collectionId = highlightToCollection.get(ht.highlight_id);
		const tag = tagById.get(ht.tag_id);
		if (!collectionId || !tag) continue;

		const key = `${collectionId}-${ht.tag_id}`;
		if (seen.has(key)) continue;
		seen.add(key);

		tagConnections.push({
			collectionId,
			tagId: ht.tag_id,
			tagName: tag.name,
			tagColor: tag.color
		});
	}

	const tags: Tag[] = allTags.map((t) => ({
		id: t.id,
		userId,
		name: t.name,
		color: t.color
	}));

	// Fetch cross-collection link counts
	const { data: linkCountsData } = await locals.supabase.rpc('get_collection_link_counts', {
		p_user_id: userId
	});

	const collectionLinkCounts: CollectionLinkCount[] = (linkCountsData ?? []).map(
		(row: { source_collection_id: string; target_collection_id: string; link_count: number }) => ({
			sourceCollectionId: row.source_collection_id,
			targetCollectionId: row.target_collection_id,
			linkCount: row.link_count
		})
	);

	return {
		collections: mapCollections(collectionsData ?? []),
		tagConnections,
		tags,
		collectionLinkCounts
	};
};
