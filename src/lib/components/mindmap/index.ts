export const DEFAULT_TAG_COLOR = '#d4856d';

export { default as CollectionNode } from './nodes/CollectionNode.svelte';
export { default as HighlightNode } from './nodes/HighlightNode.svelte';
export { default as ChapterNode } from './nodes/ChapterNode.svelte';
export { default as GhostHighlightNode } from './nodes/GhostHighlightNode.svelte';
export { default as TagEdge } from './edges/TagEdge.svelte';
export { default as LinkEdge } from './edges/LinkEdge.svelte';
export { default as CollectionLinkEdge } from './edges/CollectionLinkEdge.svelte';
export { default as MindmapNodeDetails } from './MindmapNodeDetails.svelte';
export { default as LinkModeToolbar } from './LinkModeToolbar.svelte';
export { default as SuggestionPanel } from './SuggestionPanel.svelte';
export {
	computeRadialLayout,
	computeTagEdges,
	computeCollectionLinkEdges
} from './layout/radialLayout';
export { computeTreeLayout, computeLinkEdges } from './layout/treeLayout';
export type { TagConnection } from './layout/radialLayout';
