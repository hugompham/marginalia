<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Card, Input } from '$components/ui';
	import { ChevronLeft } from 'lucide-svelte';
	import { toast } from '$components/ui/Toast.svelte';
	import { Link, Loader2, Globe, ArrowRight } from 'lucide-svelte';

	let url = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	const isValidUrl = $derived(() => {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!isValidUrl()) {
			error = 'Please enter a valid URL';
			return;
		}

		isLoading = true;
		error = null;

		try {
			const response = await fetch('/api/scrape-url', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to fetch article');
			}

			const article = await response.json();

			// Store article data in sessionStorage for the highlight page
			sessionStorage.setItem('pendingArticle', JSON.stringify(article));

			goto('/import/url/highlight');
		} catch (err) {
			console.error('Scrape error:', err);
			error = err instanceof Error ? err.message : 'Failed to fetch article';
			toast.error(error);
		} finally {
			isLoading = false;
		}
	}

	const exampleUrls = [
		{ title: 'Blog post', url: 'https://paulgraham.com/superlinear.html' },
		{ title: 'News article', url: 'https://www.nytimes.com' },
		{ title: 'Documentation', url: 'https://docs.anthropic.com' }
	];
</script>

<div class="px-lg py-xl">
	<div class="flex items-center gap-sm mb-lg">
		<a
			href="/import"
			class="p-sm -ml-sm rounded-button text-secondary hover:text-primary hover:bg-subtle transition-colors"
			aria-label="Go back"
		>
			<ChevronLeft size={20} />
		</a>
		<h1 class="font-heading text-xl text-primary">Import from URL</h1>
	</div>
	<Card padding="lg">
		<div class="flex items-center gap-md mb-lg">
			<div class="p-md rounded-button bg-subtle">
				<Globe class="text-secondary" size={24} />
			</div>
			<div>
				<h2 class="font-heading text-lg text-primary">Import Web Article</h2>
				<p class="text-sm text-secondary">Paste a URL to extract and highlight content</p>
			</div>
		</div>

		<form onsubmit={handleSubmit} class="space-y-lg">
			<div>
				<Input
					label="Article URL"
					type="url"
					bind:value={url}
					placeholder="https://example.com/article"
					error={error ?? undefined}
					disabled={isLoading}
				>
					{#snippet prefix()}
						<Link size={16} class="text-tertiary" />
					{/snippet}
				</Input>
			</div>

			<Button type="submit" disabled={!url || isLoading} class="w-full">
				{#if isLoading}
					<Loader2 size={16} class="animate-spin mr-sm" />
					Fetching article...
				{:else}
					<ArrowRight size={16} class="mr-sm" />
					Continue to Highlight
				{/if}
			</Button>
		</form>
	</Card>

	<div class="mt-xl">
		<h3 class="text-sm font-medium text-tertiary mb-md">Try with</h3>
		<div class="space-y-sm">
			{#each exampleUrls as example}
				<button
					onclick={() => (url = example.url)}
					class="w-full text-left px-md py-sm rounded-button border border-canvas hover:bg-subtle transition-colors"
				>
					<span class="text-sm text-secondary">{example.title}</span>
					<span class="text-xs text-tertiary block truncate">{example.url}</span>
				</button>
			{/each}
		</div>
	</div>

	<Card padding="md" class="mt-xl bg-subtle border-none">
		<h4 class="text-sm font-medium text-primary mb-sm">Supported content</h4>
		<ul class="text-sm text-secondary space-y-xs">
			<li>Blog posts and articles</li>
			<li>News sites</li>
			<li>Documentation pages</li>
			<li>Medium, Substack, and similar platforms</li>
		</ul>
		<p class="text-xs text-tertiary mt-md">
			Note: Some sites may block scraping or have content behind paywalls.
		</p>
	</Card>
</div>
