<script lang="ts">
	import { Modal, Button } from '$components/ui';
	import { toast } from '$components/ui/Toast.svelte';
	import { Loader2, Copy, RefreshCw } from 'lucide-svelte';
	import type { CollectionSummary } from '$lib/types';

	interface Props {
		open: boolean;
		collection: { id: string; title: string; author?: string | null };
		hasApiKey: boolean;
	}

	let { open = $bindable(), collection, hasApiKey }: Props = $props();

	let summary = $state<CollectionSummary | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Fetch cached summary on open
	$effect(() => {
		if (open) {
			fetchSummary();
		} else {
			// Reset state on close
			error = null;
		}
	});

	async function fetchSummary() {
		isLoading = true;
		error = null;
		try {
			const res = await fetch(`/api/summaries/${collection.id}`);
			if (res.ok) {
				summary = await res.json();
				isLoading = false;
			} else if (res.status === 404) {
				// No cached summary -- auto-generate
				await generateSummary();
			} else {
				throw new Error('Failed to fetch summary');
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch summary';
			isLoading = false;
		}
	}

	async function generateSummary() {
		isLoading = true;
		error = null;
		try {
			const res = await fetch('/api/summarize', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ collectionId: collection.id })
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to generate summary');
			}
			summary = await res.json();
			toast.success('Summary generated');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to generate summary';
		} finally {
			isLoading = false;
		}
	}

	async function copyToClipboard() {
		if (!summary) return;
		try {
			await navigator.clipboard.writeText(summary.summary);
			toast.success('Copied to clipboard');
		} catch {
			toast.error('Failed to copy');
		}
	}

	function timeAgo(date: Date | string): string {
		const now = Date.now();
		const then = new Date(date).getTime();
		const diffMs = now - then;
		const minutes = Math.floor(diffMs / 60000);
		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}
</script>

<Modal bind:open title="Summary">
	{#if isLoading}
		<div class="flex flex-col items-center justify-center py-2xl">
			<Loader2 size={32} class="text-accent spinner" />
			<p class="mt-lg text-secondary">Generating summary...</p>
		</div>
	{:else if error}
		<div class="flex flex-col items-center justify-center py-2xl">
			<p class="text-error mb-lg">{error}</p>
			<Button variant="secondary" onclick={generateSummary}>Try Again</Button>
		</div>
	{:else if summary}
		<!-- Themes -->
		{#if summary.themes.length > 0}
			<div class="flex flex-wrap gap-sm mb-lg">
				{#each summary.themes as theme}
					<span class="px-sm py-xs rounded-full bg-subtle text-xs text-secondary">
						{theme}
					</span>
				{/each}
			</div>
		{/if}

		<!-- Summary text -->
		<div class="prose prose-sm text-primary whitespace-pre-wrap">
			{summary.summary}
		</div>

		<!-- Timestamp -->
		<p class="text-xs text-tertiary mt-md">
			Generated {timeAgo(summary.updatedAt)}
		</p>
	{/if}

	{#snippet footer()}
		<div class="flex justify-between items-center w-full">
			<Button variant="secondary" onclick={() => (open = false)}>Close</Button>
			<div class="flex gap-sm">
				{#if summary}
					<Button variant="ghost" onclick={copyToClipboard}>
						<Copy size={16} />
						Copy
					</Button>
					<Button variant="ghost" onclick={generateSummary} disabled={isLoading}>
						<RefreshCw size={16} class={isLoading ? 'spinner' : ''} />
						Regenerate
					</Button>
				{/if}
			</div>
		</div>
	{/snippet}
</Modal>

<style>
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	:global(.spinner) {
		animation: spin 1s linear infinite;
	}
</style>
