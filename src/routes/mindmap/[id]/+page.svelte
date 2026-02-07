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
		GhostHighlightNode,
		LinkEdge,
		MindmapNodeDetails,
		LinkModeToolbar,
		SuggestionPanel,
		computeTreeLayout,
		computeLinkEdges
	} from '$components/mindmap';
	import { untrack } from 'svelte';
	import { ChevronLeft } from 'lucide-svelte';
	import type { HighlightLink, Highlight } from '$lib/types';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const nodeTypes: NodeTypes = {
		collection: CollectionNode,
		highlight: HighlightNode,
		chapter: ChapterNode,
		ghostHighlight: GhostHighlightNode
	};
	const edgeTypes: EdgeTypes = { link: LinkEdge };

	// Compute tree layout
	const { nodes: treeNodes, edges: treeEdges } = untrack(() =>
		computeTreeLayout(data.collection, data.highlights)
	);

	// Compute link edges and ghost nodes
	const localIds = new Set(data.highlights.map((h) => h.id));
	const { ghostNodes, linkEdges } = untrack(() =>
		computeLinkEdges(data.highlightLinks ?? [], localIds, data.externalHighlights ?? [], treeNodes)
	);

	let nodes = $state.raw<Node[]>([...treeNodes, ...ghostNodes]);
	let edges = $state.raw<Edge[]>([...treeEdges, ...linkEdges]);

	let selectedNode = $state<Node | null>(null);

	// Link mode state
	let linkMode = $state(false);
	let sourceNodeId = $state<string | null>(null);
	let isSuggesting = $state(false);
	let showSuggestionPanel = $state(false);
	let pendingSuggestions = $state<HighlightLink[]>(data.pendingSuggestions ?? []);

	// Build highlights lookup
	const highlightsById = $derived.by(() => {
		const map = new Map<string, Highlight>();
		for (const h of data.highlights) {
			map.set(h.id, h);
		}
		for (const h of data.externalHighlights ?? []) {
			map.set(h.id, h);
		}
		return map;
	});

	// Check if user has an API key (for suggestion button visibility)
	const hasApiKey = true; // Server could pass this, but we'll let the API endpoint handle the error

	function handleNodeClick({ node }: { node: Node; event: MouseEvent | TouchEvent }) {
		if (linkMode && node.type === 'highlight') {
			if (!sourceNodeId) {
				sourceNodeId = node.id;
			} else if (sourceNodeId !== node.id) {
				createLink(sourceNodeId, node.id);
				sourceNodeId = null;
				linkMode = false;
			}
			return;
		}
		selectedNode = node;
	}

	function handlePaneClick() {
		if (linkMode) {
			sourceNodeId = null;
			linkMode = false;
			return;
		}
		selectedNode = null;
	}

	function toggleLinkMode() {
		linkMode = !linkMode;
		sourceNodeId = null;
		if (linkMode) {
			selectedNode = null;
		}
	}

	async function createLink(source: string, target: string) {
		try {
			const res = await fetch('/api/highlight-links', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sourceHighlightId: source,
					targetHighlightId: target
				})
			});

			if (!res.ok) {
				const err = await res.json();
				console.error('Failed to create link:', err.error);
				return;
			}

			// Add edge to the graph
			const newEdge: Edge = {
				id: `e-link-${source}-${target}-${Date.now()}`,
				source,
				target,
				type: 'link',
				data: { linkType: 'manual', description: null, confidence: null }
			};
			edges = [...edges, newEdge];
		} catch (err) {
			console.error('Failed to create link:', err);
		}
	}

	async function suggestLinks() {
		isSuggesting = true;
		try {
			const highlightIds = data.highlights.map((h) => h.id);
			const res = await fetch('/api/highlight-links/suggest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ highlightIds })
			});

			if (!res.ok) {
				const err = await res.json();
				console.error('Suggestion failed:', err.error);
				return;
			}

			const result = await res.json();

			// Save suggestions as pending links
			for (const suggestion of result.suggestions) {
				const saveRes = await fetch('/api/highlight-links', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						sourceHighlightId: suggestion.sourceHighlightId,
						targetHighlightId: suggestion.targetHighlightId,
						description: suggestion.description,
						linkType: 'ai_suggested',
						status: 'pending',
						aiConfidence: suggestion.confidence
					})
				});

				if (saveRes.ok) {
					const saved = await saveRes.json();
					pendingSuggestions = [
						...pendingSuggestions,
						{
							id: saved.id,
							sourceHighlightId: suggestion.sourceHighlightId,
							targetHighlightId: suggestion.targetHighlightId,
							userId: '',
							linkType: 'ai_suggested',
							description: suggestion.description,
							aiConfidence: suggestion.confidence,
							status: 'pending',
							createdAt: new Date()
						}
					];
				}
			}

			if (result.suggestions.length > 0) {
				showSuggestionPanel = true;
			}
		} catch (err) {
			console.error('Suggestion failed:', err);
		} finally {
			isSuggesting = false;
		}
	}

	async function acceptSuggestion(id: string) {
		const suggestion = pendingSuggestions.find((s) => s.id === id);
		if (!suggestion) return;

		const edgeId = `e-link-${id}`;
		if (edges.some((e) => e.id === edgeId)) return;

		try {
			await fetch(`/api/highlight-links/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'active' })
			});

			pendingSuggestions = pendingSuggestions.filter((s) => s.id !== id);

			const newEdge: Edge = {
				id: edgeId,
				source: suggestion.sourceHighlightId,
				target: suggestion.targetHighlightId,
				type: 'link',
				data: {
					description: suggestion.description,
					confidence: suggestion.aiConfidence,
					linkType: 'ai_suggested'
				}
			};
			edges = [...edges, newEdge];
		} catch (err) {
			console.error('Failed to accept suggestion:', err);
		}
	}

	async function dismissSuggestion(id: string) {
		try {
			await fetch(`/api/highlight-links/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'dismissed' })
			});
			pendingSuggestions = pendingSuggestions.filter((s) => s.id !== id);
		} catch (err) {
			console.error('Failed to dismiss suggestion:', err);
		}
	}

	async function deleteLink(linkId: string) {
		try {
			await fetch(`/api/highlight-links/${linkId}`, { method: 'DELETE' });
			edges = edges.filter((e) => e.id !== `e-link-${linkId}`);
		} catch (err) {
			console.error('Failed to delete link:', err);
		}
	}
</script>

<svelte:head>
	<title>{data.collection.title} - Mindmap | Marginalia</title>
</svelte:head>

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

		<LinkModeToolbar
			{linkMode}
			{sourceNodeId}
			{isSuggesting}
			{hasApiKey}
			ontogglelink={toggleLinkMode}
			onsuggest={suggestLinks}
		/>

		{#if showSuggestionPanel}
			<SuggestionPanel
				suggestions={pendingSuggestions}
				{highlightsById}
				onaccept={acceptSuggestion}
				ondismiss={dismissSuggestion}
				onclose={() => (showSuggestionPanel = false)}
			/>
		{/if}

		{#if !showSuggestionPanel}
			<MindmapNodeDetails
				node={selectedNode}
				onclose={() => (selectedNode = null)}
				highlightLinks={data.highlightLinks}
				{highlightsById}
				ondeletelink={deleteLink}
			/>
		{/if}

		<!-- Pending suggestions badge -->
		{#if pendingSuggestions.length > 0 && !showSuggestionPanel}
			<button
				type="button"
				onclick={() => (showSuggestionPanel = true)}
				class="absolute top-md right-md z-10 flex items-center gap-xs px-md py-sm rounded-button bg-accent text-white text-sm font-medium shadow-card"
			>
				{pendingSuggestions.length} pending
			</button>
		{/if}
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
