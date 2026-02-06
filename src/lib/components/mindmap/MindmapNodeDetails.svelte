<script lang="ts">
	import { X, BookOpen, ExternalLink } from 'lucide-svelte';
	import { TagBadge } from '$components/tags';
	import { Button } from '$components/ui';
	import type { Collection, Highlight, Tag } from '$lib/types';
	import type { Node } from '@xyflow/svelte';

	interface Props {
		node: Node | null;
		onclose: () => void;
	}

	let { node, onclose }: Props = $props();

	const nodeType = $derived(node?.type);
	const collection = $derived(
		nodeType === 'collection' ? (node?.data.collection as Collection) : null
	);
	const highlight = $derived(
		nodeType === 'highlight' ? (node?.data.highlight as Highlight & { tags: Tag[] }) : null
	);
	const chapter = $derived(
		nodeType === 'chapter'
			? { name: node?.data.chapter as string, count: node?.data.highlightCount as number }
			: null
	);
</script>

{#if node}
	<!-- Desktop: side panel; Mobile: bottom sheet -->
	<div
		class="fixed z-50
			desktop:right-0 desktop:top-0 desktop:w-80 desktop:h-full desktop:border-l
			mobile:bottom-0 mobile:left-0 mobile:right-0 mobile:max-h-[60vh] mobile:rounded-t-xl mobile:border-t
			tablet:bottom-0 tablet:left-0 tablet:right-0 tablet:max-h-[60vh] tablet:rounded-t-xl tablet:border-t
			bg-surface border-border shadow-card-hover overflow-y-auto"
	>
		<div
			class="flex items-center justify-between px-lg py-md border-b border-border sticky top-0 bg-surface"
		>
			<h3 class="font-heading text-base text-primary">
				{#if collection}
					Collection
				{:else if highlight}
					Highlight
				{:else if chapter}
					Chapter
				{/if}
			</h3>
			<button
				type="button"
				onclick={onclose}
				class="p-xs rounded-button text-secondary hover:text-primary hover:bg-subtle transition-colors"
				aria-label="Close details"
			>
				<X size={18} />
			</button>
		</div>

		<div class="px-lg py-lg space-y-md">
			{#if collection}
				<div class="flex items-start gap-md">
					<div class="p-sm rounded-button bg-subtle shrink-0">
						<BookOpen class="text-secondary" size={20} />
					</div>
					<div>
						<h4 class="font-heading text-lg text-primary">{collection.title}</h4>
						{#if collection.author}
							<p class="text-sm text-secondary">{collection.author}</p>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-lg text-sm text-tertiary">
					<span>{collection.highlightCount} highlights</span>
					<span>{collection.cardCount} cards</span>
				</div>

				<div class="flex items-center gap-sm">
					<Button size="sm" href="/mindmap/{collection.id}">Explore</Button>
					<Button size="sm" variant="secondary" href="/library/{collection.id}">
						<ExternalLink size={14} />
						Library
					</Button>
				</div>
			{:else if highlight}
				<p class="text-sm text-primary leading-relaxed">{highlight.text}</p>

				{#if highlight.note}
					<div class="px-md py-sm bg-subtle rounded-card">
						<p class="text-xs text-secondary italic">{highlight.note}</p>
					</div>
				{/if}

				{#if highlight.chapter}
					<p class="text-xs text-tertiary">Chapter: {highlight.chapter}</p>
				{/if}

				{#if highlight.tags && highlight.tags.length > 0}
					<div class="flex flex-wrap gap-xs">
						{#each highlight.tags as tag}
							<TagBadge {tag} />
						{/each}
					</div>
				{/if}

				{#if highlight.hasCards}
					<span class="inline-flex items-center text-xs text-success">Has cards</span>
				{/if}
			{:else if chapter}
				<h4 class="font-heading text-lg text-primary">{chapter.name}</h4>
				<p class="text-sm text-tertiary">{chapter.count} highlights</p>
			{/if}
		</div>
	</div>
{/if}
