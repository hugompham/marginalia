import type { Node, Edge } from '@xyflow/svelte';
import type { Collection, Tag } from '$lib/types';
import { DEFAULT_TAG_COLOR } from '$components/mindmap';

export interface TagConnection {
	collectionId: string;
	tagId: string;
	tagName: string;
	tagColor: string | null;
}

/**
 * Distribute collections in a radial layout.
 * Collections sharing more tags are clustered closer together.
 */
export function computeRadialLayout(
	collections: Collection[],
	tagConnections: TagConnection[]
): Node[] {
	if (collections.length === 0) return [];

	// Single collection: center it
	if (collections.length === 1) {
		return [
			{
				id: collections[0].id,
				type: 'collection',
				position: { x: 0, y: 0 },
				data: { collection: collections[0] }
			}
		];
	}

	const radius = Math.max(200, collections.length * 60);
	const angleStep = (2 * Math.PI) / collections.length;

	// Build a tag-affinity index: group collections by shared tags
	const collectionTags = new Map<string, Set<string>>();
	for (const tc of tagConnections) {
		if (!collectionTags.has(tc.collectionId)) {
			collectionTags.set(tc.collectionId, new Set());
		}
		collectionTags.get(tc.collectionId)!.add(tc.tagId);
	}

	// Sort collections so those sharing more tags sit adjacent in the circle
	const sorted = sortByTagAffinity(collections, collectionTags);

	return sorted.map((collection, i) => {
		const angle = i * angleStep - Math.PI / 2;
		return {
			id: collection.id,
			type: 'collection',
			position: {
				x: Math.cos(angle) * radius,
				y: Math.sin(angle) * radius
			},
			data: { collection }
		};
	});
}

/**
 * Compute edges between collections that share at least one tag.
 * Each shared tag produces one edge.
 */
export function computeTagEdges(tagConnections: TagConnection[], tags: Tag[]): Edge[] {
	// Group collections by tag
	const tagToCollections = new Map<string, string[]>();
	for (const tc of tagConnections) {
		if (!tagToCollections.has(tc.tagId)) {
			tagToCollections.set(tc.tagId, []);
		}
		tagToCollections.get(tc.tagId)!.push(tc.collectionId);
	}

	const tagMap = new Map(tags.map((t) => [t.id, t]));
	const edges: Edge[] = [];
	const seen = new Set<string>();

	for (const [tagId, collectionIds] of tagToCollections) {
		if (collectionIds.length < 2) continue;
		const tag = tagMap.get(tagId);

		// Create edges for each pair
		for (let i = 0; i < collectionIds.length; i++) {
			for (let j = i + 1; j < collectionIds.length; j++) {
				const key = [collectionIds[i], collectionIds[j], tagId].sort().join('-');
				if (seen.has(key)) continue;
				seen.add(key);

				edges.push({
					id: `e-${collectionIds[i]}-${collectionIds[j]}-${tagId}`,
					source: collectionIds[i],
					target: collectionIds[j],
					type: 'tag',
					data: {
						tagName: tag?.name ?? '',
						tagColor: tag?.color ?? DEFAULT_TAG_COLOR
					}
				});
			}
		}
	}

	return edges;
}

/**
 * Sort collections by tag affinity so collections sharing tags
 * are positioned adjacent in the radial layout.
 */
function sortByTagAffinity(
	collections: Collection[],
	collectionTags: Map<string, Set<string>>
): Collection[] {
	if (collections.length <= 2) return collections;

	// Greedy nearest-neighbor ordering
	const remaining = new Set(collections.map((c) => c.id));
	const byId = new Map(collections.map((c) => [c.id, c]));
	const sorted: Collection[] = [];

	// Start with the collection that has the most tags
	let currentId = collections.reduce(
		(best, c) => {
			const count = collectionTags.get(c.id)?.size ?? 0;
			return count > best.count ? { id: c.id, count } : best;
		},
		{ id: collections[0].id, count: 0 }
	).id;

	remaining.delete(currentId);
	sorted.push(byId.get(currentId)!);

	while (remaining.size > 0) {
		const currentTags = collectionTags.get(currentId) ?? new Set();
		let bestId = '';
		let bestOverlap = -1;

		for (const candidateId of remaining) {
			const candidateTags = collectionTags.get(candidateId) ?? new Set();
			let overlap = 0;
			for (const tag of currentTags) {
				if (candidateTags.has(tag)) overlap++;
			}
			if (overlap > bestOverlap) {
				bestOverlap = overlap;
				bestId = candidateId;
			}
		}

		if (!bestId) {
			// Pick first remaining
			bestId = remaining.values().next().value!;
		}

		remaining.delete(bestId);
		sorted.push(byId.get(bestId)!);
		currentId = bestId;
	}

	return sorted;
}
