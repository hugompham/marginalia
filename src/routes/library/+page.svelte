<script lang="ts">
	import { Header } from '$components/layout';
	import { Button, Card } from '$components/ui';
	import { CollectionCard } from '$components/highlights';
	import { Plus, BookOpen, Search } from 'lucide-svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let searchQuery = $state('');

	const filteredCollections = $derived(
		data.collections.filter(
			(c) =>
				c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.author?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

{#snippet headerActions()}
	<Button href="/import" size="sm">
		<Plus size={16} />
		Import
	</Button>
{/snippet}

<Header title="Library" actions={headerActions} />

<div class="px-lg py-xl">
	<!-- Search -->
	{#if data.collections.length > 0}
		<div class="relative mb-xl">
			<Search
				class="absolute left-lg top-1/2 -translate-y-1/2 text-tertiary"
				size={20}
			/>
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search collections..."
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
