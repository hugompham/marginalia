import type { Node, Edge } from '@xyflow/svelte';
import type { Collection, Highlight, HighlightLink, Tag } from '$lib/types';

type HighlightWithTags = Highlight & { tags: Tag[] };

/**
 * Build a tree layout with the collection at center,
 * chapters as first ring, highlights as second ring.
 * Ungrouped highlights radiate directly from the collection.
 */
export function computeTreeLayout(
	collection: Collection,
	highlights: HighlightWithTags[]
): { nodes: Node[]; edges: Edge[] } {
	const nodes: Node[] = [];
	const edges: Edge[] = [];

	// Center node: the collection
	nodes.push({
		id: collection.id,
		type: 'collection',
		position: { x: 0, y: 0 },
		data: { collection }
	});

	// Group highlights by chapter
	const chapters = new Map<string, HighlightWithTags[]>();
	const ungrouped: HighlightWithTags[] = [];

	for (const h of highlights) {
		if (h.chapter) {
			if (!chapters.has(h.chapter)) {
				chapters.set(h.chapter, []);
			}
			chapters.get(h.chapter)!.push(h);
		} else {
			ungrouped.push(h);
		}
	}

	const chapterEntries = Array.from(chapters.entries());
	const totalBranches = chapterEntries.length + (ungrouped.length > 0 ? 1 : 0);

	if (totalBranches === 0) return { nodes, edges };

	const branchAngleStep = (2 * Math.PI) / Math.max(totalBranches, 1);
	const chapterRadius = 300;
	const highlightRadius = 550;
	let branchIndex = 0;
	const seenChapterIds = new Set<string>();

	// Place chapter nodes and their highlights
	for (const [chapter, chapterHighlights] of chapterEntries) {
		const chapterId = encodeChapterId(chapter, seenChapterIds);
		const angle = branchIndex * branchAngleStep - Math.PI / 2;

		nodes.push({
			id: chapterId,
			type: 'chapter',
			position: {
				x: Math.cos(angle) * chapterRadius,
				y: Math.sin(angle) * chapterRadius
			},
			data: {
				chapter,
				highlightCount: chapterHighlights.length
			}
		});

		edges.push({
			id: `e-${collection.id}-${chapterId}`,
			source: collection.id,
			target: chapterId,
			type: 'smoothstep',
			style: 'stroke-width: 2'
		});

		// Fan highlights around the chapter
		const highlightAngleSpread = Math.min(branchAngleStep * 0.8, Math.PI / 3);
		const highlightStep =
			chapterHighlights.length > 1 ? highlightAngleSpread / (chapterHighlights.length - 1) : 0;
		const startAngle = angle - highlightAngleSpread / 2;

		for (let i = 0; i < chapterHighlights.length; i++) {
			const h = chapterHighlights[i];
			const hAngle = chapterHighlights.length === 1 ? angle : startAngle + i * highlightStep;

			nodes.push({
				id: h.id,
				type: 'highlight',
				position: {
					x: Math.cos(hAngle) * highlightRadius,
					y: Math.sin(hAngle) * highlightRadius
				},
				data: { highlight: h }
			});

			edges.push({
				id: `e-${chapterId}-${h.id}`,
				source: chapterId,
				target: h.id,
				type: 'smoothstep'
			});
		}

		branchIndex++;
	}

	// Place ungrouped highlights directly from collection
	if (ungrouped.length > 0) {
		const baseAngle = branchIndex * branchAngleStep - Math.PI / 2;
		const spreadAngle = Math.min(branchAngleStep * 0.8, Math.PI / 3);
		const step = ungrouped.length > 1 ? spreadAngle / (ungrouped.length - 1) : 0;
		const startAngle = baseAngle - spreadAngle / 2;

		for (let i = 0; i < ungrouped.length; i++) {
			const h = ungrouped[i];
			const hAngle = ungrouped.length === 1 ? baseAngle : startAngle + i * step;

			nodes.push({
				id: h.id,
				type: 'highlight',
				position: {
					x: Math.cos(hAngle) * highlightRadius,
					y: Math.sin(hAngle) * highlightRadius
				},
				data: { highlight: h }
			});

			edges.push({
				id: `e-${collection.id}-${h.id}`,
				source: collection.id,
				target: h.id,
				type: 'smoothstep'
			});
		}
	}

	return { nodes, edges };
}

/**
 * Compute link edges and ghost nodes for cross-collection highlights.
 * Ghost nodes are placed in an outer ring beyond the highlight radius.
 */
export function computeLinkEdges(
	highlightLinks: HighlightLink[],
	localIds: Set<string>,
	externalHighlights: Array<Highlight & { collectionTitle: string }>,
	existingNodes: Node[]
): { ghostNodes: Node[]; linkEdges: Edge[] } {
	const ghostNodes: Node[] = [];
	const linkEdges: Edge[] = [];

	if (highlightLinks.length === 0) return { ghostNodes, linkEdges };

	const ghostRadius = 800;
	const existingNodeIds = new Set(existingNodes.map((n) => n.id));
	const extById = new Map(externalHighlights.map((h) => [h.id, h]));

	// Place ghost nodes for external highlights
	const externalIds = new Set<string>();
	for (const link of highlightLinks) {
		if (!localIds.has(link.sourceHighlightId)) externalIds.add(link.sourceHighlightId);
		if (!localIds.has(link.targetHighlightId)) externalIds.add(link.targetHighlightId);
	}

	const extArray = [...externalIds];
	const angleStep = extArray.length > 0 ? (2 * Math.PI) / extArray.length : 0;

	for (let i = 0; i < extArray.length; i++) {
		const extId = extArray[i];
		if (existingNodeIds.has(extId)) continue;

		const ext = extById.get(extId);
		if (!ext) continue;

		const angle = i * angleStep - Math.PI / 2;
		ghostNodes.push({
			id: extId,
			type: 'ghostHighlight',
			position: {
				x: Math.cos(angle) * ghostRadius,
				y: Math.sin(angle) * ghostRadius
			},
			data: {
				highlight: ext,
				collectionTitle: ext.collectionTitle
			}
		});
	}

	// Create link edges
	for (const link of highlightLinks) {
		const sourceExists =
			existingNodeIds.has(link.sourceHighlightId) || extById.has(link.sourceHighlightId);
		const targetExists =
			existingNodeIds.has(link.targetHighlightId) || extById.has(link.targetHighlightId);
		if (!sourceExists || !targetExists) continue;

		linkEdges.push({
			id: `e-link-${link.id}`,
			source: link.sourceHighlightId,
			target: link.targetHighlightId,
			type: 'link',
			data: {
				description: link.description,
				confidence: link.aiConfidence,
				linkType: link.linkType
			}
		});
	}

	return { ghostNodes, linkEdges };
}

function encodeChapterId(chapter: string, seen: Set<string>): string {
	let id = `chapter-${chapter.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50)}`;
	let suffix = 1;
	const base = id;
	while (seen.has(id)) {
		id = `${base}-${suffix++}`;
	}
	seen.add(id);
	return id;
}
