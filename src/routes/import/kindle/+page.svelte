<script lang="ts">
	import { enhance } from '$app/forms';
	import { Header } from '$components/layout';
	import { Button, Card, Modal, Input } from '$components/ui';
	import { toast } from '$components/ui/Toast.svelte';
	import { BookMarked, Upload } from 'lucide-svelte';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();

	let fileName = $state('');
	let loadingAction = $state<'preview' | 'import' | null>(null);
	let minHighlightsInput = $state('1');
	let showPreviewModal = $state(false);

	const minHighlightsValue = $derived(
		Number.parseInt(minHighlightsInput, 10) > 0 ? Number.parseInt(minHighlightsInput, 10) : 1
	);

	const previewReady = $derived(
		!!form?.preview &&
			form.preview.fileName === fileName &&
			form.preview.minHighlights === minHighlightsValue
	);

	const importedHighlights = $derived(
		form?.summary?.collections
			? form.summary.collections.reduce((sum, collection) => {
					if (collection.action === 'skipped') return sum;
					return sum + (collection.highlightCount ?? 0);
				}, 0)
			: 0
	);

	function handleFileChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const file = target.files?.[0];
		fileName = file?.name ?? '';
	}

	$effect(() => {
		if (
			form?.preview &&
			form.preview.fileName === fileName &&
			form.preview.minHighlights === minHighlightsValue
		) {
			showPreviewModal = true;
		}
	});
</script>

<Header title="Import from Kindle" backHref="/import" />

<div class="px-lg py-xl max-w-content mx-auto space-y-xl">
	<Card padding="lg" class="space-y-lg">
		<div class="flex items-start gap-md">
			<div class="p-md rounded-button bg-warning/10">
				<BookMarked class="text-warning" size={24} />
			</div>
			<div>
				<h2 class="font-heading text-lg text-primary">Upload My Clippings.txt</h2>
				<p class="text-secondary text-sm">
					Connect your Kindle via USB and locate the file in the Documents folder.
				</p>
			</div>
		</div>

		<ol class="space-y-md text-sm text-secondary">
			<li>1. Connect your Kindle to your computer via USB.</li>
			<li>2. Open the Kindle drive and locate `Documents/My Clippings.txt`.</li>
			<li>3. Upload the file below to import your highlights.</li>
		</ol>

		<form
			method="POST"
			action="?/preview"
			enctype="multipart/form-data"
			use:enhance={({ submitter, action }) => {
				const formAction =
					submitter?.getAttribute('formaction') ?? action?.toString?.() ?? '';
				loadingAction = formAction.includes('preview') ? 'preview' : 'import';
				return async ({ result, update }) => {
					loadingAction = null;
					if (result.type === 'success') {
						if (result.data?.preview) {
							toast.info('Preview ready. Review before importing.');
						} else if (result.data?.summary) {
							toast.success('Kindle highlights imported!');
						}
					} else if (result.type === 'failure') {
						toast.error(result.data?.error ?? form?.error ?? 'Failed to import highlights');
					}
					await update();
				};
			}}
			class="space-y-md"
		>
			<div class="space-y-sm">
				<label class="block text-sm font-medium text-primary" for="clippings">
					Choose file
				</label>
				<div class="flex items-center gap-md">
					<label
						for="clippings"
						class="inline-flex items-center gap-sm px-4 py-2 rounded-button border border-border text-sm text-primary hover:bg-subtle cursor-pointer"
					>
						<Upload size={16} />
						Select File
					</label>
					<span class="text-sm text-tertiary">
						{fileName || 'No file selected'}
					</span>
				</div>
				<input
					id="clippings"
					name="clippings"
					type="file"
					accept=".txt,text/plain"
					class="hidden"
					onchange={handleFileChange}
					required
				/>
			</div>

			<Input
				label="Minimum highlights per book"
				name="minHighlights"
				type="number"
				min="1"
				max="1000"
				bind:value={minHighlightsInput}
				hint="Books with fewer highlights will be skipped."
			/>

			{#if form?.error}
				<p class="text-error text-sm">{form.error}</p>
			{/if}

			<div class="flex flex-wrap gap-sm">
				<Button
					type="submit"
					formaction="?/preview"
					disabled={!fileName || loadingAction !== null}
					loading={loadingAction === 'preview'}
				>
					Preview Import
				</Button>
				<Button
					type="submit"
					formaction="?/import"
					variant="secondary"
					disabled={!fileName || !previewReady || loadingAction !== null}
					loading={loadingAction === 'import'}
				>
					Import Highlights
				</Button>
			</div>
			<p class="text-xs text-tertiary">
				Run a preview before importing to see how your highlights will be organized.
			</p>
		</form>
	</Card>

	{#if form?.success && form?.summary}
		<Card padding="lg">
			<h3 class="font-heading text-lg text-primary mb-sm">Import Complete</h3>
			<p class="text-secondary text-sm mb-md">
				Imported {importedHighlights} new highlight{importedHighlights === 1 ? '' : 's'} across {form.summary.totalCollections} book{form.summary.totalCollections === 1 ? '' : 's'}.
			</p>
			{#if form.summary.createdCollections !== undefined}
				<p class="text-xs text-tertiary mb-md">
					Created {form.summary.createdCollections} new collection{form.summary.createdCollections === 1 ? '' : 's'}, appended to {form.summary.appendedCollections} existing collection{form.summary.appendedCollections === 1 ? '' : 's'}, and skipped {form.summary.skippedCollections} collection{form.summary.skippedCollections === 1 ? '' : 's'}.
				</p>
			{/if}
			{#if form.summary.collections?.length}
				<div class="space-y-sm mb-md">
					{#each form.summary.collections as collection}
						<div class="flex items-center justify-between text-sm">
							<div>
								<span class="text-primary">{collection.title}</span>
								{#if collection.action}
									<span class="text-xs text-tertiary ml-sm">
										({collection.action === 'created' ? 'new' : collection.action === 'appended' ? 'appended' : 'skipped'})
									</span>
								{/if}
								{#if collection.action === 'skipped' && collection.skippedReason}
									<span class="text-xs text-warning ml-sm">
										{collection.skippedReason}
									</span>
								{/if}
							</div>
							<span class="text-tertiary">{collection.highlightCount} highlights</span>
						</div>
					{/each}
				</div>
			{/if}
			<Button href="/library" variant="secondary">Go to Library</Button>
		</Card>
	{/if}
</div>

{#if form?.preview && form.preview.fileName === fileName && form.preview.minHighlights === minHighlightsValue}
	<Modal bind:open={showPreviewModal} title="Import Preview">
		<div class="space-y-md">
			<p class="text-secondary text-sm">
				Found {form.preview.totalHighlights} highlights across {form.preview.totalCollections} book{form.preview.totalCollections === 1 ? '' : 's'}.
			</p>
			<p class="text-xs text-tertiary">
				Minimum highlights per book: {form.preview.minHighlights}
			</p>
			{#if form.preview.collections?.length}
				<div class="space-y-sm max-h-80 overflow-y-auto">
					{#each form.preview.collections as collection}
						<div class="flex items-start justify-between text-sm gap-md">
							<div>
								<p class="text-primary">{collection.title}</p>
								{#if collection.author}
									<p class="text-xs text-tertiary">{collection.author}</p>
								{/if}
								{#if collection.willImport}
									<p class="text-xs {collection.exists ? 'text-warning' : 'text-success'}">
										{collection.exists ? 'Will append to existing collection' : 'Will create new collection'}
									</p>
								{:else if collection.reason}
									<p class="text-xs text-warning">Skipped: {collection.reason}</p>
								{/if}
							</div>
							<div class="text-right">
								<p class="text-tertiary">{collection.highlightCount} in file</p>
								<p class="text-xs text-tertiary">{collection.newHighlightCount} new</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		{#snippet footer()}
			<div class="flex justify-end gap-sm">
				<Button variant="secondary" onclick={() => (showPreviewModal = false)}>
					Close
				</Button>
				<Button
					variant="primary"
					disabled={!previewReady}
					onclick={() => (showPreviewModal = false)}
				>
					Ready to Import
				</Button>
			</div>
		{/snippet}
	</Modal>
{/if}
