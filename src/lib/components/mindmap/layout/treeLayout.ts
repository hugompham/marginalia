import type { Node, Edge } from '@xyflow/svelte';
import type { Collection, Highlight, Tag } from '$lib/types';

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
			chapterHighlights.length > 1
				? highlightAngleSpread / (chapterHighlights.length - 1)
				: 0;
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
