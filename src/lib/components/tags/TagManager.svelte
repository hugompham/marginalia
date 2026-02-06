<script lang="ts">
	import { Button, Card, Input, Modal } from '$components/ui';
	import { toast } from '$components/ui/Toast.svelte';
	import { Plus, Edit2, Trash2, X } from 'lucide-svelte';
	import type { Tag } from '$lib/types';

	interface Props {
		tags: Tag[];
		onTagCreated?: (tag: Tag) => void;
		onTagUpdated?: (tag: Tag) => void;
		onTagDeleted?: (tagId: string) => void;
	}

	let { tags, onTagCreated, onTagUpdated, onTagDeleted }: Props = $props();

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let editingTag = $state<Tag | null>(null);
	let deletingTag = $state<Tag | null>(null);

	let formName = $state('');
	let formColor = $state('#d4856d');

	const DEFAULT_COLORS = [
		'#d4856d', // Accent (terracotta)
		'#e57373', // Red
		'#81c784', // Green
		'#64b5f6', // Blue
		'#ffb74d', // Orange
		'#ba68c8', // Purple
		'#4db6ac', // Teal
		'#f06292' // Pink
	];

	function openCreateModal() {
		formName = '';
		formColor = DEFAULT_COLORS[0];
		showCreateModal = true;
	}

	function openEditModal(tag: Tag) {
		formName = tag.name;
		formColor = tag.color || DEFAULT_COLORS[0];
		editingTag = tag;
		showEditModal = true;
	}

	async function handleCreateTag() {
		if (!formName.trim()) {
			toast.error('Tag name is required');
			return;
		}

		try {
			const response = await fetch('/api/tags', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: formName.trim(), color: formColor })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to create tag');
			}

			const newTag: Tag = await response.json();
			onTagCreated?.(newTag);
			showCreateModal = false;
			toast.success(`Created tag "${newTag.name}"`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create tag');
		}
	}

	async function handleUpdateTag() {
		if (!editingTag || !formName.trim()) return;

		try {
			const response = await fetch(`/api/tags/${editingTag.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: formName.trim(), color: formColor })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to update tag');
			}

			const updatedTag: Tag = await response.json();
			onTagUpdated?.(updatedTag);
			showEditModal = false;
			editingTag = null;
			toast.success(`Updated tag "${updatedTag.name}"`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update tag');
		}
	}

	async function handleDeleteTag() {
		if (!deletingTag) return;

		try {
			const response = await fetch(`/api/tags/${deletingTag.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to delete tag');
			}

			onTagDeleted?.(deletingTag.id);
			showDeleteModal = false;
			deletingTag = null;
			toast.success('Tag deleted');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete tag');
		}
	}
</script>

<div class="space-y-md">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h3 class="font-heading text-lg text-primary">Tags</h3>
		<Button size="sm" onclick={openCreateModal}>
			<Plus size={16} />
			New Tag
		</Button>
	</div>

	<!-- Tags List -->
	{#if tags.length > 0}
		<div class="space-y-xs">
			{#each tags as tag (tag.id)}
				<div
					class="flex items-center justify-between p-md rounded-button bg-surface border border-border hover:border-accent/30 transition-colors"
				>
					<div class="flex items-center gap-md">
						<div
							class="w-4 h-4 rounded-full border-2"
							style="border-color: {tag.color || '#d4856d'}"
						></div>
						<span class="text-sm text-primary font-medium">{tag.name}</span>
					</div>

					<div class="flex items-center gap-xs">
						<button
							onclick={() => openEditModal(tag)}
							class="p-sm rounded-button hover:bg-subtle transition-colors text-secondary hover:text-primary"
							aria-label="Edit tag"
						>
							<Edit2 size={16} />
						</button>
						<button
							onclick={() => {
								deletingTag = tag;
								showDeleteModal = true;
							}}
							class="p-sm rounded-button hover:bg-subtle transition-colors text-secondary hover:text-danger"
							aria-label="Delete tag"
						>
							<Trash2 size={16} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<Card padding="lg" class="text-center">
			<p class="text-sm text-secondary">No tags yet. Create one to organize your highlights.</p>
		</Card>
	{/if}
</div>

<!-- Create Modal -->
<Modal bind:open={showCreateModal} title="Create Tag" onclose={() => (showCreateModal = false)}>
	{#snippet children()}
		<div class="space-y-lg">
			<div>
				<label for="tag-name" class="label">Name</label>
				<Input
					id="tag-name"
					bind:value={formName}
					placeholder="e.g., Important, Review Later"
					autofocus
				/>
			</div>

			<fieldset>
				<legend class="label mb-sm block">Color</legend>
				<div class="flex gap-sm flex-wrap">
					{#each DEFAULT_COLORS as color}
						<button
							type="button"
							onclick={() => (formColor = color)}
							class="w-10 h-10 rounded-button border-2 transition-all {formColor === color
								? 'scale-110 shadow-md'
								: 'hover:scale-105'}"
							style="background-color: {color}; border-color: {formColor === color
								? color
								: 'transparent'}"
							aria-label="Select color {color}"
						></button>
					{/each}
				</div>
			</fieldset>
		</div>
	{/snippet}

	{#snippet footer()}
		<Button variant="ghost" onclick={() => (showCreateModal = false)}>Cancel</Button>
		<Button onclick={handleCreateTag}>Create Tag</Button>
	{/snippet}
</Modal>

<!-- Edit Modal -->
<Modal
	bind:open={showEditModal}
	title="Edit Tag"
	onclose={() => {
		showEditModal = false;
		editingTag = null;
	}}
>
	{#snippet children()}
		<div class="space-y-lg">
			<div>
				<label for="edit-tag-name" class="label">Name</label>
				<Input
					id="edit-tag-name"
					bind:value={formName}
					placeholder="e.g., Important, Review Later"
					autofocus
				/>
			</div>

			<fieldset>
				<legend class="label mb-sm block">Color</legend>
				<div class="flex gap-sm flex-wrap">
					{#each DEFAULT_COLORS as color}
						<button
							type="button"
							onclick={() => (formColor = color)}
							class="w-10 h-10 rounded-button border-2 transition-all {formColor === color
								? 'scale-110 shadow-md'
								: 'hover:scale-105'}"
							style="background-color: {color}; border-color: {formColor === color
								? color
								: 'transparent'}"
							aria-label="Select color {color}"
						></button>
					{/each}
				</div>
			</fieldset>
		</div>
	{/snippet}

	{#snippet footer()}
		<Button
			variant="ghost"
			onclick={() => {
				showEditModal = false;
				editingTag = null;
			}}>Cancel</Button
		>
		<Button onclick={handleUpdateTag}>Save Changes</Button>
	{/snippet}
</Modal>

<!-- Delete Confirmation -->
<Modal
	bind:open={showDeleteModal}
	title="Delete Tag"
	onclose={() => {
		showDeleteModal = false;
		deletingTag = null;
	}}
>
	{#snippet children()}
		{#if deletingTag}
			<p class="text-secondary">
				Are you sure you want to delete the tag "<strong class="text-primary"
					>{deletingTag.name}</strong
				>"? This will remove it from all highlights.
			</p>
		{/if}
	{/snippet}

	{#snippet footer()}
		<Button
			variant="ghost"
			onclick={() => {
				showDeleteModal = false;
				deletingTag = null;
			}}>Cancel</Button
		>
		<Button variant="danger" onclick={handleDeleteTag}>Delete Tag</Button>
	{/snippet}
</Modal>
