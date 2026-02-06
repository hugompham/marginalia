<script lang="ts">
	import {
		SvelteFlow,
		Controls,
		MiniMap,
		Background,
		type Node,
		type Edge,
		type NodeTypes,
		type EdgeTypes
	} from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';

	import { Card } from '$components/ui';
	import {
		CollectionNode,
		HighlightNode,
		ChapterNode,
		MindmapNodeDetails,
		computeTreeLayout
	} from '$components/mindmap';
	import { untrack } from 'svelte';
	import { ChevronLeft } from 'lucide-svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const nodeTypes: NodeTypes = {
		collection: CollectionNode,
		highlight: HighlightNode,
		chapter: ChapterNode
	};
	const edgeTypes: EdgeTypes = {};

	const { nodes: treeNodes, edges: treeEdges } = untrack(() =>
		computeTreeLayout(data.collection, data.highlights)
	);

	let nodes = $state.raw<Node[]>(treeNodes);
	let edges = $state.raw<Edge[]>(treeEdges);

	let selectedNode = $state<Node | null>(null);

	function handleNodeClick({ node }: { node: Node; event: MouseEvent | TouchEvent }) {
		selectedNode = node;
	}

	function handlePaneClick() {
		selectedNode = null;
	}
</script>

<div class="mindmap-container">
	<!-- Floating back button -->
	<a
		href="/mindmap"
		class="absolute top-md left-md z-10 flex items-center gap-xs px-md py-sm rounded-button bg-surface border border-border shadow-card text-sm text-secondary hover:text-primary transition-colors"
	>
		<ChevronLeft size={16} />
		<span class="font-heading text-primary truncate max-w-[200px]">{data.collection.title}</span>
	</a>

	{#if data.highlights.length === 0}
		<div class="flex items-center justify-center h-full px-lg">
			<Card padding="lg" class="text-center max-w-sm">
				<p class="text-secondary">No highlights in this collection yet.</p>
			</Card>
		</div>
	{:else}
		<SvelteFlow
			bind:nodes
			bind:edges
			{nodeTypes}
			{edgeTypes}
			fitView
			fitViewOptions={{ padding: 0.5 }}
			onnodeclick={handleNodeClick}
			onpaneclick={handlePaneClick}
			class="mindmap-flow"
		>
			<Controls />
			<MiniMap />
			<Background />
		</SvelteFlow>

		<MindmapNodeDetails node={selectedNode} onclose={() => (selectedNode = null)} />
	{/if}
</div>

<style>
	.mindmap-container {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
	}

	@media (min-width: 1024px) {
		.mindmap-container {
			left: 256px;
		}
	}

	@media (max-width: 1023px) {
		.mindmap-container {
			bottom: 64px;
		}
	}

	:global(.mindmap-flow) {
		--xy-background-color: var(--color-canvas);
		--xy-node-background-color: transparent;
		--xy-node-border-color: transparent;
		--xy-node-border-radius: 0;
		--xy-node-box-shadow: none;
		--xy-edge-stroke: var(--color-border);
		--xy-controls-button-background-color: var(--color-surface);
		--xy-controls-button-border-color: var(--color-border);
		--xy-controls-button-color: var(--color-text-secondary);
		--xy-minimap-background-color: var(--color-subtle);
		--xy-minimap-mask-background: var(--color-canvas);
	}

	:global(.mindmap-flow .svelte-flow__node) {
		padding: 0;
		border: none;
		background: transparent;
		box-shadow: none;
	}
</style>
