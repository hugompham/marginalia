<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button, Card, Modal } from '$components/ui';
	import { toast } from '$components/ui/Toast.svelte';
	import { escapeHtml } from '$lib/utils/html';
	import {
		Highlighter,
		Check,
		Trash2,
		Save,
		Loader2,
		ChevronLeft,
		ChevronDown,
		ChevronUp
	} from 'lucide-svelte';

	interface ArticleData {
		title: string;
		author: string | null;
		content: string;
		excerpt: string | null;
		siteName: string | null;
		publishedDate: string | null;
		url: string;
	}

	interface SelectedHighlight {
		id: string;
		text: string;
		index: number;
	}

	let article = $state<ArticleData | null>(null);
	let highlights = $state<SelectedHighlight[]>([]);
	let showSidebar = $state(true);
	let isSaving = $state(false);
	let showConfirmModal = $state(false);

	onMount(() => {
		const stored = sessionStorage.getItem('pendingArticle');
		if (!stored) {
			toast.error('No article data found');
			goto('/import/url');
			return;
		}

		try {
			article = JSON.parse(stored);
		} catch {
			toast.error('Failed to load article');
			goto('/import/url');
		}
	});

	function handleTextSelection() {
		const selection = window.getSelection();
		if (!selection || selection.isCollapsed) return;

		const text = selection.toString().trim();
		if (text.length < 10) return;

		// Check if already highlighted
		if (highlights.some((h) => h.text === text)) {
			toast.warning('This text is already highlighted');
			return;
		}

		const newHighlight: SelectedHighlight = {
			id: crypto.randomUUID(),
			text,
			index: highlights.length
		};

		highlights = [...highlights, newHighlight];
		selection.removeAllRanges();

		toast.success('Highlight added');
	}

	function removeHighlight(id: string) {
		highlights = highlights.filter((h) => h.id !== id);
	}

	function clearAllHighlights() {
		highlights = [];
		toast.success('All highlights cleared');
	}

	async function saveCollection() {
		if (!article || highlights.length === 0) return;

		isSaving = true;

		try {
			const response = await fetch('/api/collections', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: article.title,
					author: article.author,
					sourceType: 'web',
					sourceUrl: article.url,
					highlights: highlights.map((h) => ({
						text: h.text
					}))
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to save collection');
			}

			const { collection } = await response.json();

			// Clear session storage
			sessionStorage.removeItem('pendingArticle');

			toast.success('Collection created!');
			goto(`/library/${collection.id}`);
		} catch (error) {
			console.error('Save error:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to save');
		} finally {
			isSaving = false;
		}
	}

	function handleBackClick() {
		if (highlights.length > 0) {
			showConfirmModal = true;
		} else {
			sessionStorage.removeItem('pendingArticle');
			goto('/import/url');
		}
	}

	function confirmBack() {
		sessionStorage.removeItem('pendingArticle');
		goto('/import/url');
	}

	// Format content for display (convert markdown-ish to HTML)
	function formatContent(content: string): string {
		return content
			.split('\n\n')
			.map((para) => {
				const trimmed = para.trim();
				if (!trimmed) return '';
				if (trimmed.startsWith('## ')) {
					const title = escapeHtml(trimmed.slice(3));
					return `<h2 class="font-heading text-xl text-primary mt-xl mb-md">${title}</h2>`;
				}
				if (trimmed.startsWith('> ')) {
					const quote = escapeHtml(trimmed.slice(2));
					return `<blockquote class="border-l-2 border-accent pl-md italic text-secondary">${quote}</blockquote>`;
				}
				return `<p class="text-primary leading-relaxed mb-md">${escapeHtml(trimmed)}</p>`;
			})
			.join('');
	}
</script>

<svelte:head>
	<title>{article?.title ?? 'Highlight Article'} | Marginalia</title>
</svelte:head>

{#if article}
	<div class="flex items-center justify-between px-lg py-md border-b border-border">
		<div class="flex items-center gap-sm">
			<button
				type="button"
				onclick={handleBackClick}
				class="p-sm -ml-sm rounded-button text-secondary hover:text-primary hover:bg-subtle transition-colors"
				aria-label="Go back"
			>
				<ChevronLeft size={20} />
			</button>
			<h1 class="font-heading text-xl text-primary">Highlight Article</h1>
		</div>
		<Button variant="ghost" size="sm" onclick={() => (showSidebar = !showSidebar)}>
			{showSidebar ? 'Hide' : 'Show'} Highlights ({highlights.length})
			{#if showSidebar}
				<ChevronUp size={16} />
			{:else}
				<ChevronDown size={16} />
			{/if}
		</Button>
	</div>

	<div class="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
		<!-- Article Content - mouseup handler for text selection highlighting -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="flex-1 px-lg py-xl max-w-prose mx-auto" onmouseup={handleTextSelection}>
			<article>
				<header class="mb-xl">
					<h1 class="font-heading text-2xl lg:text-3xl text-primary mb-md">
						{article.title}
					</h1>
					{#if article.author || article.siteName}
						<p class="text-secondary">
							{#if article.author}
								<span>{article.author}</span>
							{/if}
							{#if article.author && article.siteName}
								<span class="mx-sm">·</span>
							{/if}
							{#if article.siteName}
								<span class="text-tertiary">{article.siteName}</span>
							{/if}
						</p>
					{/if}
				</header>

				<div class="article-content select-text">
					{@html formatContent(article.content)}
				</div>
			</article>

			<Card padding="md" class="mt-xl bg-subtle border-none">
				<div class="flex items-center gap-sm text-secondary">
					<Highlighter size={16} />
					<span class="text-sm">Select text to create highlights</span>
				</div>
			</Card>
		</div>

		<!-- Highlights Sidebar -->
		{#if showSidebar}
			<aside
				class="lg:w-80 border-t lg:border-t-0 lg:border-l border-canvas bg-surface p-lg shrink-0"
			>
				<div class="sticky top-4">
					<div class="flex items-center justify-between mb-md">
						<h3 class="font-heading text-lg text-primary">
							Highlights ({highlights.length})
						</h3>
						{#if highlights.length > 0}
							<Button variant="ghost" size="sm" onclick={clearAllHighlights}>Clear All</Button>
						{/if}
					</div>

					{#if highlights.length === 0}
						<Card padding="md" class="text-center">
							<Highlighter class="text-tertiary mx-auto mb-sm" size={24} />
							<p class="text-sm text-secondary">Select text in the article to create highlights</p>
						</Card>
					{:else}
						<div class="space-y-sm max-h-[60vh] overflow-y-auto">
							{#each highlights as highlight (highlight.id)}
								<Card padding="sm" class="group">
									<p class="text-sm text-primary line-clamp-3 mb-sm">
										"{highlight.text}"
									</p>
									<button
										onclick={() => removeHighlight(highlight.id)}
										class="text-xs text-tertiary hover:text-error flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<Trash2 size={12} />
										Remove
									</button>
								</Card>
							{/each}
						</div>

						<div class="mt-lg pt-lg border-t border-canvas">
							<Button onclick={saveCollection} disabled={isSaving} class="w-full">
								{#if isSaving}
									<Loader2 size={16} class="animate-spin mr-sm" />
									Saving...
								{:else}
									<Save size={16} class="mr-sm" />
									Save {highlights.length} Highlight{highlights.length !== 1 ? 's' : ''}
								{/if}
							</Button>
						</div>
					{/if}
				</div>
			</aside>
		{/if}
	</div>

	<!-- Mobile Floating Button -->
	{#if highlights.length > 0 && !showSidebar}
		<div class="fixed bottom-20 left-1/2 -translate-x-1/2 lg:hidden">
			<Button onclick={saveCollection} disabled={isSaving}>
				{#if isSaving}
					<Loader2 size={16} class="animate-spin mr-sm" />
				{:else}
					<Check size={16} class="mr-sm" />
				{/if}
				Save {highlights.length} Highlight{highlights.length !== 1 ? 's' : ''}
			</Button>
		</div>
	{/if}
{:else}
	<div class="flex items-center justify-center min-h-[50vh]">
		<Loader2 size={32} class="animate-spin text-accent" />
	</div>
{/if}

<!-- Confirm Leave Modal -->
<Modal bind:open={showConfirmModal} title="Discard Highlights?">
	<p class="text-secondary">
		You have {highlights.length} unsaved highlight{highlights.length !== 1 ? 's' : ''}. Going back
		will discard them.
	</p>

	{#snippet footer()}
		<div class="flex justify-end gap-md">
			<Button variant="secondary" onclick={() => (showConfirmModal = false)}>Keep Editing</Button>
			<Button variant="danger" onclick={confirmBack}>Discard & Go Back</Button>
		</div>
	{/snippet}
</Modal>

<style>
	.article-content :global(h2) {
		scroll-margin-top: 2rem;
	}

	.article-content :global(::selection) {
		background-color: rgba(196, 115, 100, 0.3);
	}
</style>
