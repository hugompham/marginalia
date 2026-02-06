export const DEFAULT_TAG_COLOR = '#d4856d';

export { default as CollectionNode } from './nodes/CollectionNode.svelte';
export { default as HighlightNode } from './nodes/HighlightNode.svelte';
export { default as ChapterNode } from './nodes/ChapterNode.svelte';
export { default as TagEdge } from './edges/TagEdge.svelte';
export { default as MindmapNodeDetails } from './MindmapNodeDetails.svelte';
export { computeRadialLayout, computeTagEdges } from './layout/radialLayout';
export { computeTreeLayout } from './layout/treeLayout';
export type { TagConnection } from './layout/radialLayout';
