<script lang="ts">
	import { Card } from '$components/ui';
	import { BookOpen, ChevronRight } from 'lucide-svelte';
	import type { Collection } from '$lib/types';

	interface Props {
		collection: Collection;
	}

	let { collection }: Props = $props();

	function formatDate(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days} days ago`;
		if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
		return date.toLocaleDateString();
	}
</script>

<a href="/library/{collection.id}" class="block group">
	<Card padding="lg" class="flex items-start gap-lg transition-shadow">
		<div class="p-md rounded-button bg-subtle group-hover:bg-accent/10 transition-colors">
			<BookOpen class="text-secondary group-hover:text-accent transition-colors" size={24} />
		</div>

		<div class="flex-1 min-w-0">
			<h3
				class="font-heading text-lg text-primary truncate group-hover:text-accent transition-colors"
			>
				{collection.title}
			</h3>
			{#if collection.author}
				<p class="text-sm text-secondary truncate">{collection.author}</p>
			{/if}
			<div class="flex items-center gap-lg mt-sm text-sm text-tertiary">
				<span>{collection.highlightCount} highlights</span>
				<span>{collection.cardCount} cards</span>
			</div>
		</div>

		<div class="flex flex-col items-end gap-sm">
			<span class="text-xs text-tertiary">{formatDate(collection.updatedAt)}</span>
			<ChevronRight class="text-tertiary group-hover:text-accent transition-colors" size={20} />
		</div>
	</Card>
</a>
