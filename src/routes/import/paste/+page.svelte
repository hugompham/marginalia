<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button, Input, Textarea, Card } from '$components/ui';
	import { ChevronLeft } from 'lucide-svelte';
	import { toast } from '$components/ui/Toast.svelte';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();

	let title = $state('');
	let author = $state('');
	let highlights = $state('');
	let loading = $state(false);

	// Parse highlights preview
	const parsedHighlights = $derived(
		highlights
			.split(/\n\n+/)
			.map((h) => h.trim())
			.filter((h) => h.length > 0)
	);
</script>

<div class="px-lg py-xl">
	<div class="flex items-center gap-sm mb-xl">
		<a
			href="/import"
			class="p-sm -ml-sm rounded-button text-secondary hover:text-primary hover:bg-subtle transition-colors"
			aria-label="Go back"
		>
			<ChevronLeft size={20} />
		</a>
		<h1 class="font-heading text-xl text-primary">Paste Highlights</h1>
	</div>
	<form
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ result }) => {
				loading = false;
				if (result.type === 'redirect') {
					toast.success('Collection created successfully!');
				} else if (result.type === 'failure') {
					toast.error(form?.error ?? 'Failed to create collection');
				}
			};
		}}
	>
		<div class="space-y-lg">
			<Input
				label="Title"
				name="title"
				bind:value={title}
				placeholder="e.g., Atomic Habits"
				required
				error={form?.errors?.title}
			/>

			<Input
				label="Author (optional)"
				name="author"
				bind:value={author}
				placeholder="e.g., James Clear"
			/>

			<Textarea
				label="Highlights"
				name="highlights"
				bind:value={highlights}
				placeholder="Paste your highlights here.

Separate each highlight with a blank line.

Like this third highlight."
				rows={10}
				required
				error={form?.errors?.highlights}
				hint="Separate each highlight with a blank line"
			/>
		</div>

		<!-- Preview -->
		{#if parsedHighlights.length > 0}
			<Card padding="md" class="mt-xl">
				<div class="flex items-center justify-between mb-md">
					<h3 class="font-medium text-primary">Preview</h3>
					<span class="text-sm text-secondary">
						{parsedHighlights.length} highlight{parsedHighlights.length === 1 ? '' : 's'}
					</span>
				</div>
				<div class="space-y-sm max-h-48 overflow-y-auto">
					{#each parsedHighlights.slice(0, 5) as highlight, i}
						<p class="text-sm text-secondary truncate">
							{i + 1}. "{highlight}"
						</p>
					{/each}
					{#if parsedHighlights.length > 5}
						<p class="text-sm text-tertiary">
							...and {parsedHighlights.length - 5} more
						</p>
					{/if}
				</div>
			</Card>
		{/if}

		{#if form?.error}
			<p class="text-error text-sm mt-lg">{form.error}</p>
		{/if}

		<div class="flex justify-end gap-md mt-xl">
			<Button type="button" variant="secondary" href="/import">Cancel</Button>
			<Button type="submit" {loading} disabled={!title || parsedHighlights.length === 0}>
				Import {parsedHighlights.length} Highlight{parsedHighlights.length === 1 ? '' : 's'}
			</Button>
		</div>
	</form>
</div>
