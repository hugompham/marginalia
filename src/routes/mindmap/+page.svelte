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

	import { Card, Button } from '$components/ui';
	import {
		CollectionNode,
		TagEdge,
		MindmapNodeDetails,
		computeRadialLayout,
		computeTagEdges
	} from '$components/mindmap';
	import { untrack } from 'svelte';
	import { Plus } from 'lucide-svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const nodeTypes: NodeTypes = { collection: CollectionNode };
	const edgeTypes: EdgeTypes = { tag: TagEdge };

	let nodes = $state.raw<Node[]>(
		untrack(() => computeRadialLayout(data.collections, data.tagConnections))
	);
	let edges = $state.raw<Edge[]>(untrack(() => computeTagEdges(data.tagConnections, data.tags)));

	let selectedNode = $state<Node | null>(null);

	function handleNodeClick({ node }: { node: Node; event: MouseEvent | TouchEvent }) {
		selectedNode = node;
	}

	function handlePaneClick() {
		selectedNode = null;
	}
</script>

<svelte:head>
	<title>Mindmap | Marginalia</title>
</svelte:head>

<div class="mindmap-container">
	{#if data.collections.length === 0}
		<div class="flex items-center justify-center h-full px-lg">
			<Card padding="lg" class="text-center max-w-sm">
				<p class="text-secondary mb-md">
					Your library is empty. Import some highlights to see them visualized here.
				</p>
				<Button href="/import">
					<Plus size={16} />
					Import
				</Button>
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

	/* Offset for desktop sidebar */
	@media (min-width: 1024px) {
		.mindmap-container {
			left: 256px;
		}
	}

	/* Offset for mobile bottom nav */
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
