<script lang="ts">
	import { Button, Modal } from '$components/ui';
	import { toast } from '$components/ui/Toast.svelte';
	import type { Highlight } from '$lib/types';

	interface Props {
		open: boolean;
		highlight: Highlight;
		onConfirm?: () => void;
		onClose?: () => void;
	}

	let { open = $bindable(false), highlight, onConfirm, onClose }: Props = $props();

	let deleting = $state(false);

	function handleClose() {
		open = false;
		onClose?.();
	}

	async function handleDelete() {
		deleting = true;

		try {
			const response = await fetch(`/api/highlights/${highlight.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to delete highlight');
			}

			onConfirm?.();
			open = false;
			toast.success('Highlight deleted');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete highlight');
		} finally {
			deleting = false;
		}
	}
</script>

<Modal bind:open title="Delete Highlight" onclose={handleClose}>
	{#snippet children()}
		<p class="text-secondary">Are you sure you want to delete this highlight?</p>
		{#if highlight.hasCards}
			<p class="mt-md text-sm text-warning">
				This highlight has associated flashcards that will also be deleted.
			</p>
		{/if}
	{/snippet}

	{#snippet footer()}
		<Button variant="ghost" onclick={handleClose}>Cancel</Button>
		<Button variant="danger" onclick={handleDelete} loading={deleting}>Delete Highlight</Button>
	{/snippet}
</Modal>
