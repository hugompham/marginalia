<script lang="ts">
	import { Button, Modal } from '$components/ui';
	import { toast } from '$components/ui/Toast.svelte';
	import type { Collection } from '$lib/types';

	interface Props {
		open: boolean;
		collection: Collection;
		onConfirm?: () => void;
		onClose?: () => void;
	}

	let { open = $bindable(false), collection, onConfirm, onClose }: Props = $props();

	let deleting = $state(false);

	function handleClose() {
		open = false;
		onClose?.();
	}

	async function handleDelete() {
		deleting = true;

		try {
			const response = await fetch(`/api/collections/${collection.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to delete collection');
			}

			onConfirm?.();
			open = false;
			toast.success('Collection deleted');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete collection');
		} finally {
			deleting = false;
		}
	}
</script>

<Modal bind:open title="Delete Collection" onclose={handleClose}>
	{#snippet children()}
		<p class="text-secondary">
			Are you sure you want to delete "<strong class="text-primary">{collection.title}</strong>"?
		</p>
		<p class="mt-md text-sm text-tertiary">
			This will permanently remove {collection.highlightCount} highlight{collection.highlightCount !==
			1
				? 's'
				: ''}
			and {collection.cardCount} card{collection.cardCount !== 1 ? 's' : ''}. This action cannot be
			undone.
		</p>
	{/snippet}

	{#snippet footer()}
		<Button variant="ghost" onclick={handleClose}>Cancel</Button>
		<Button variant="danger" onclick={handleDelete} loading={deleting}>Delete Collection</Button>
	{/snippet}
</Modal>
