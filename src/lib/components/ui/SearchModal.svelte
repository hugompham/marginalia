<script lang="ts">
	import { goto } from '$app/navigation';
	import { BookOpen, Search, FileText } from 'lucide-svelte';
	import type { Collection } from '$lib/types';

	interface SearchHighlight {
		id: string;
		collectionId: string;
		text: string;
		note: string | null;
		collection: { id: string; title: string; author: string | null } | null;
	}

	interface SearchResults {
		collections: Collection[];
		highlights: SearchHighlight[];
	}

	interface Props {
		open: boolean;
	}

	let { open = $bindable(false) }: Props = $props();

	let query = $state('');
	let results = $state<SearchResults | null>(null);
	let loading = $state(false);
	let activeIndex = $state(-1);
	let debounceTimer: ReturnType<typeof setTimeout>;
	let inputEl: HTMLInputElement;

	// Counts for keyboard nav
	const collectionCount = $derived(results?.collections.length ?? 0);
	const totalItems = $derived(collectionCount + (results?.highlights.length ?? 0));

	$effect(() => {
		if (open) {
			query = '';
			results = null;
			activeIndex = -1;
			// Focus input after modal renders
			requestAnimationFrame(() => inputEl?.focus());
		}
	});

	function handleClose() {
		open = false;
	}

	function handleInput() {
		clearTimeout(debounceTimer);
		activeIndex = -1;

		if (query.trim().length < 2) {
			results = null;
			return;
		}

		loading = true;
		debounceTimer = setTimeout(async () => {
			try {
				const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
				if (response.ok) {
					results = await response.json();
				}
			} catch {
				// Silently fail -- user can retry
			} finally {
				loading = false;
			}
		}, 250);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = totalItems > 0 ? (activeIndex + 1) % totalItems : -1;
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = totalItems > 0 ? (activeIndex - 1 + totalItems) % totalItems : -1;
			return;
		}

		if (event.key === 'Enter' && activeIndex >= 0) {
			event.preventDefault();
			navigateToActive();
		}
	}

	function navigateToActive() {
		if (!results || activeIndex < 0) return;

		const collectionCount = results.collections.length;

		if (activeIndex < collectionCount) {
			navigateToCollection(results.collections[activeIndex].id);
		} else {
			const highlight = results.highlights[activeIndex - collectionCount];
			navigateToCollection(highlight.collectionId);
		}
	}

	function navigateToCollection(id: string) {
		handleClose();
		goto(`/library/${id}`);
	}

	function truncate(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength) + '...';
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
		role="dialog"
		aria-modal="true"
		aria-label="Search"
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<!-- Backdrop -->
		<div
			class="absolute inset-0 bg-primary/50 backdrop-blur-sm"
			onclick={handleClose}
			aria-hidden="true"
		></div>

		<!-- Search Panel -->
		<div
			class="relative w-full max-w-xl bg-surface rounded-card shadow-xl overflow-hidden animate-in fade-in"
		>
			<!-- Search Input -->
			<div class="flex items-center gap-md px-xl py-lg border-b border-border">
				<Search size={20} class="text-tertiary shrink-0" />
				<input
					bind:this={inputEl}
					bind:value={query}
					oninput={handleInput}
					type="text"
					class="flex-1 bg-transparent text-primary placeholder:text-tertiary outline-none text-base"
					placeholder="Search collections and highlights..."
				/>
				<kbd
					class="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-tertiary border border-border rounded"
					>esc</kbd
				>
			</div>

			<!-- Results -->
			{#if results && (results.collections.length > 0 || results.highlights.length > 0)}
				<div class="max-h-[50vh] overflow-y-auto p-sm">
					<!-- Collections -->
					{#if results.collections.length > 0}
						<div class="px-md py-sm">
							<span class="text-xs font-medium text-tertiary uppercase tracking-wider"
								>Collections</span
							>
						</div>
						{#each results.collections as collection, i (collection.id)}
							<button
								type="button"
								class="w-full flex items-center gap-md px-md py-sm rounded-button transition-colors text-left
									{activeIndex === i ? 'bg-accent/10 text-accent' : 'hover:bg-subtle text-primary'}"
								onclick={() => navigateToCollection(collection.id)}
								onmouseenter={() => (activeIndex = i)}
							>
								<BookOpen size={16} class="shrink-0 text-secondary" />
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium truncate">{collection.title}</p>
									{#if collection.author}
										<p class="text-xs text-tertiary truncate">{collection.author}</p>
									{/if}
								</div>
								<span class="text-xs text-tertiary shrink-0"
									>{collection.highlightCount} highlights</span
								>
							</button>
						{/each}
					{/if}

					<!-- Highlights -->
					{#if results.highlights.length > 0}
						<div
							class="px-md py-sm {results.collections.length > 0
								? 'mt-sm border-t border-border pt-md'
								: ''}"
						>
							<span class="text-xs font-medium text-tertiary uppercase tracking-wider"
								>Highlights</span
							>
						</div>
						{#each results.highlights as highlight, i (highlight.id)}
							<button
								type="button"
								class="w-full flex items-start gap-md px-md py-sm rounded-button transition-colors text-left
									{activeIndex === collectionCount + i ? 'bg-accent/10 text-accent' : 'hover:bg-subtle text-primary'}"
								onclick={() => navigateToCollection(highlight.collectionId)}
								onmouseenter={() => (activeIndex = collectionCount + i)}
							>
								<FileText size={16} class="shrink-0 text-secondary mt-0.5" />
								<div class="min-w-0 flex-1">
									<p class="text-sm leading-relaxed">{truncate(highlight.text, 120)}</p>
									{#if highlight.collection}
										<p class="text-xs text-tertiary mt-xs truncate">
											from {highlight.collection.title}
										</p>
									{/if}
								</div>
							</button>
						{/each}
					{/if}
				</div>
			{:else if results && query.trim().length >= 2}
				<div class="px-xl py-lg text-center">
					<p class="text-sm text-secondary">No results for "{query}"</p>
				</div>
			{:else if loading}
				<div class="px-xl py-lg text-center">
					<p class="text-sm text-tertiary">Searching...</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-in {
		animation: fade-in 150ms ease-out;
	}
</style>
