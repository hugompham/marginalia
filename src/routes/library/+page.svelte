<script lang="ts">
	import { Button, Card } from '$components/ui';
	import { CollectionCard } from '$components/highlights';
	import { Plus, BookOpen, Search, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let searchQuery = $state('');
	let searchInput = $state<HTMLInputElement | null>(null);

	function handleGlobalKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			searchInput?.focus();
		}
	}

	const filteredCollections = $derived(
		data.collections.filter(
			(c) =>
				c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.author?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const showPagination = $derived(data.totalPages > 1);
	const hasPrev = $derived(data.currentPage > 1);
	const hasNext = $derived(data.currentPage < data.totalPages);

	function goToPage(page: number) {
		goto(`/library?page=${page}`);
	}
</script>

<svelte:head>
	<title>Library | Marginalia</title>
</svelte:head>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="px-lg py-xl">
	<div class="flex items-center justify-between mb-xl">
		<h1 class="font-heading text-xl text-primary">Library</h1>
		<Button href="/import" size="sm">
			<Plus size={16} />
			Import
		</Button>
	</div>
	<!-- Search -->
	{#if data.collections.length > 0}
		<div class="relative mb-xl">
			<Search class="absolute left-lg top-1/2 -translate-y-1/2 text-tertiary" size={20} />
			<input
				type="search"
				bind:value={searchQuery}
				bind:this={searchInput}
				placeholder="Search collections... ({navigator?.platform?.includes('Mac') ? '⌘' : 'Ctrl+'}K)"
				class="input pl-12"
			/>
		</div>
	{/if}

	<!-- Collections List -->
	{#if filteredCollections.length > 0}
		<div class="space-y-md">
			{#each filteredCollections as collection (collection.id)}
				<CollectionCard {collection} />
			{/each}
		</div>

		<!-- Pagination -->
		{#if showPagination && !searchQuery}
			<div class="flex items-center justify-between mt-xl pt-lg border-t border-border">
				<Button
					variant="ghost"
					size="sm"
					disabled={!hasPrev}
					onclick={() => goToPage(data.currentPage - 1)}
				>
					<ChevronLeft size={16} />
					Previous
				</Button>

				<span class="text-sm text-secondary">
					Page {data.currentPage} of {data.totalPages}
				</span>

				<Button
					variant="ghost"
					size="sm"
					disabled={!hasNext}
					onclick={() => goToPage(data.currentPage + 1)}
				>
					Next
					<ChevronRight size={16} />
				</Button>
			</div>
		{/if}
	{:else if searchQuery}
		<Card padding="lg" class="text-center">
			<Search class="text-tertiary mx-auto mb-md" size={32} />
			<p class="text-secondary">No collections match "{searchQuery}"</p>
		</Card>
	{:else}
		<Card padding="lg" class="text-center">
			<BookOpen class="text-tertiary mx-auto mb-md" size={48} />
			<h2 class="font-heading text-xl text-primary mb-sm">Your library is empty</h2>
			<p class="text-secondary mb-lg">
				Import highlights from articles, books, or paste them manually.
			</p>
			<Button href="/import">
				<Plus size={16} />
				Import Highlights
			</Button>
		</Card>
	{/if}
</div>
