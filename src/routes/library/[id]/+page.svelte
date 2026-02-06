<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Card, Modal } from '$components/ui';
	import { toast } from '$components/ui/Toast.svelte';
	import { HighlightList } from '$components/highlights';
	import { TagPicker } from '$components/tags';
	import { GenerationModal, ReviewQueue } from '$components/questions';
	import { Sparkles, BookOpen, AlertCircle, Settings, Filter, ChevronLeft } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { GeneratedQuestion, Highlight, Tag } from '$lib/types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let selectedIds = $state(new Set<string>());
	let showGenerateModal = $state(false);
	let showReviewQueue = $state(false);
	let showNoApiKeyModal = $state(false);
	let isGenerating = $state(false);
	let isSaving = $state(false);
	let generatedQuestions = $state<GeneratedQuestion[]>([]);
	let filterTags = $state<Tag[]>([]);

	const highlightsWithoutCards = $derived(data.highlights.filter((h) => !h.hasCards));

	// Filter highlights by selected tags
	const filteredHighlights = $derived(
		filterTags.length === 0
			? data.highlights
			: data.highlights.filter((h) =>
					filterTags.every((filterTag) => h.tags.some((tag) => tag.id === filterTag.id))
				)
	);

	const selectedHighlights = $derived(filteredHighlights.filter((h) => selectedIds.has(h.id)));

	async function handleTagAdd(highlightId: string, tag: Tag) {
		try {
			const response = await fetch(`/api/highlights/${highlightId}/tags`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tagId: tag.id })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to add tag');
			}

			// Update local state
			const highlightIndex = data.highlights.findIndex((h) => h.id === highlightId);
			if (highlightIndex !== -1) {
				data.highlights[highlightIndex].tags = [...data.highlights[highlightIndex].tags, tag];
			}

			toast.success('Tag added');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to add tag');
		}
	}

	async function handleTagRemove(highlightId: string, tag: Tag) {
		try {
			const response = await fetch(`/api/highlights/${highlightId}/tags`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tagId: tag.id })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to remove tag');
			}

			// Update local state
			const highlightIndex = data.highlights.findIndex((h) => h.id === highlightId);
			if (highlightIndex !== -1) {
				data.highlights[highlightIndex].tags = data.highlights[highlightIndex].tags.filter(
					(t) => t.id !== tag.id
				);
			}

			toast.success('Tag removed');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to remove tag');
		}
	}

	// Check if user has any API key configured
	const hasApiKey = $derived(data.apiKeys.openai !== null || data.apiKeys.anthropic !== null);

	// Get the primary API key (prefer OpenAI)
	const primaryApiKey = $derived(data.apiKeys.openai ?? data.apiKeys.anthropic);
	const primaryProvider = $derived(data.apiKeys.openai ? 'openai' : 'anthropic');

	function selectAll() {
		selectedIds = new Set(highlightsWithoutCards.map((h) => h.id));
	}

	function clearSelection() {
		selectedIds = new Set();
	}

	function handleGenerateClick() {
		if (!hasApiKey) {
			showNoApiKeyModal = true;
			return;
		}
		showGenerateModal = true;
	}

	async function handleGenerate(questionTypes: QuestionType[]) {
		isGenerating = true;

		try {
			const response = await fetch('/api/generate-questions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					highlights: selectedHighlights,
					collection: data.collection,
					questionTypes,
					provider: primaryProvider // Server will fetch the actual key
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Generation failed');
			}

			const result = await response.json();

			if (result.questions.length === 0) {
				toast.warning('No questions could be generated from the selected highlights.');
				showGenerateModal = false;
				return;
			}

			generatedQuestions = result.questions;
			showGenerateModal = false;
			showReviewQueue = true;

			toast.success(`Generated ${result.questions.length} questions`);
		} catch (error) {
			console.error('Generation error:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to generate questions');
		} finally {
			isGenerating = false;
		}
	}

	async function handleSaveCards(approved: GeneratedQuestion[]) {
		if (approved.length === 0) {
			showReviewQueue = false;
			return;
		}

		isSaving = true;

		try {
			const response = await fetch('/api/cards', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					questions: approved,
					collectionId: data.collection.id
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to save cards');
			}

			const result = await response.json();

			toast.success(`Created ${result.cardsCreated} new cards`);
			showReviewQueue = false;
			clearSelection();

			// Refresh the page to show updated card counts
			goto(`/library/${data.collection.id}`, { invalidateAll: true });
		} catch (error) {
			console.error('Save error:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to save cards');
		} finally {
			isSaving = false;
		}
	}

	function handleCancelReview() {
		showReviewQueue = false;
		generatedQuestions = [];
	}
</script>

<svelte:head>
	<title>{data.collection.title} | Marginalia</title>
</svelte:head>

<div class="px-lg py-xl">
	<div class="flex items-center justify-between mb-xl">
		<div class="flex items-center gap-sm min-w-0">
			<a
				href="/library"
				class="p-sm -ml-sm rounded-button text-secondary hover:text-primary hover:bg-subtle transition-colors shrink-0"
				aria-label="Go back"
			>
				<ChevronLeft size={20} />
			</a>
			<h1 class="font-heading text-xl text-primary truncate">{data.collection.title}</h1>
		</div>
		<div class="flex items-center gap-sm shrink-0">
			{#if selectedIds.size > 0}
				<span class="text-sm text-secondary mr-md">{selectedIds.size} selected</span>
				<Button size="sm" variant="ghost" onclick={clearSelection}>Clear</Button>
				<Button size="sm" onclick={handleGenerateClick}>
					<Sparkles size={16} />
					Generate
				</Button>
			{:else if highlightsWithoutCards.length > 0}
				<Button size="sm" variant="secondary" onclick={selectAll}>Select All</Button>
			{/if}
		</div>
	</div>
	<!-- Collection Info -->
	<Card padding="lg" class="mb-xl">
		<div class="flex items-start gap-lg">
			<div class="p-md rounded-button bg-subtle">
				<BookOpen class="text-secondary" size={24} />
			</div>
			<div class="flex-1">
				<h2 class="font-heading text-xl text-primary">{data.collection.title}</h2>
				{#if data.collection.author}
					<p class="text-secondary">{data.collection.author}</p>
				{/if}
				<div class="flex items-center gap-lg mt-md text-sm text-tertiary">
					<span>{data.collection.highlightCount} highlights</span>
					<span>{data.collection.cardCount} cards</span>
				</div>
			</div>
		</div>
	</Card>

	<!-- Tag Filter -->
	{#if data.availableTags.length > 0}
		<Card padding="md" class="mb-md">
			<div class="flex items-center gap-md">
				<Filter size={16} class="text-secondary" />
				<span class="text-sm text-secondary">Filter by tags:</span>
				<div class="flex-1">
					<TagPicker
						availableTags={data.availableTags}
						selectedTags={filterTags}
						ontagadd={(tag) => (filterTags = [...filterTags, tag])}
						ontagremove={(tag) => (filterTags = filterTags.filter((t) => t.id !== tag.id))}
					/>
				</div>
			</div>
		</Card>
	{/if}

	<!-- API Key Warning -->
	{#if !hasApiKey}
		<Card padding="md" class="mb-xl border-warning/20 bg-warning/5">
			<div class="flex items-center gap-md">
				<AlertCircle class="text-warning shrink-0" size={20} />
				<div class="flex-1">
					<p class="text-sm text-primary">
						No API key configured. Add your OpenAI or Anthropic API key to generate questions.
					</p>
				</div>
				<Button size="sm" variant="secondary" href="/settings">
					<Settings size={14} />
					Settings
				</Button>
			</div>
		</Card>
	{/if}

	<!-- Highlights Section -->
	<div class="flex items-center justify-between mb-md">
		<h3 class="font-heading text-lg text-primary">Highlights</h3>
		{#if highlightsWithoutCards.length > 0}
			<span class="text-sm text-tertiary">{highlightsWithoutCards.length} without cards</span>
		{/if}
	</div>

	{#if filteredHighlights.length > 0}
		<HighlightList
			highlights={filteredHighlights}
			availableTags={data.availableTags}
			selectable={highlightsWithoutCards.length > 0}
			bind:selectedIds
			ontagadd={handleTagAdd}
			ontagremove={handleTagRemove}
		/>
	{:else}
		<Card padding="lg" class="text-center">
			<p class="text-secondary">No highlights yet</p>
		</Card>
	{/if}
</div>

<!-- Generate Questions Modal -->
<GenerationModal
	open={showGenerateModal}
	highlights={selectedHighlights}
	collection={data.collection}
	onClose={() => (showGenerateModal = false)}
	onGenerate={handleGenerate}
	{isGenerating}
/>

<!-- Review Queue Modal -->
{#if showReviewQueue}
	<div class="fixed inset-0 z-50 flex flex-col bg-canvas">
		<ReviewQueue
			questions={generatedQuestions}
			highlights={selectedHighlights}
			onSave={handleSaveCards}
			onCancel={handleCancelReview}
			{isSaving}
		/>
	</div>
{/if}

<!-- No API Key Modal -->
<Modal bind:open={showNoApiKeyModal} title="API Key Required">
	<div class="space-y-md">
		<p class="text-secondary">
			To generate questions, you need to add your OpenAI or Anthropic API key in settings.
		</p>
		<p class="text-sm text-tertiary">
			Your API key is used to call AI models that transform your highlights into study questions.
			Keys are stored encrypted and never shared.
		</p>
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-md">
			<Button variant="secondary" onclick={() => (showNoApiKeyModal = false)}>Cancel</Button>
			<Button href="/settings">
				<Settings size={16} />
				Go to Settings
			</Button>
		</div>
	{/snippet}
</Modal>
