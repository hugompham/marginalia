<script lang="ts">
	import { Button, Input, Modal } from '$components/ui';
	import { toast } from '$components/ui/Toast.svelte';
	import type { Collection } from '$lib/types';

	interface Props {
		open: boolean;
		collection: Collection;
		onSave?: (updated: Collection) => void;
		onClose?: () => void;
	}

	let { open = $bindable(false), collection, onSave, onClose }: Props = $props();

	let title = $state('');
	let author = $state('');
	let saving = $state(false);

	$effect(() => {
		if (open) {
			title = collection.title;
			author = collection.author ?? '';
		}
	});

	function handleClose() {
		open = false;
		onClose?.();
	}

	async function handleSave() {
		if (!title.trim()) {
			toast.error('Title is required');
			return;
		}

		saving = true;

		try {
			const response = await fetch(`/api/collections/${collection.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: title.trim(), author: author.trim() || null })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to update collection');
			}

			const updated: Collection = await response.json();
			onSave?.(updated);
			open = false;
			toast.success('Collection updated');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update collection');
		} finally {
			saving = false;
		}
	}
</script>

<Modal bind:open title="Edit Collection" onclose={handleClose}>
	{#snippet children()}
		<div class="space-y-lg">
			<Input label="Title" bind:value={title} placeholder="Book or article title" autofocus />
			<Input label="Author" bind:value={author} placeholder="Author name (optional)" />
		</div>
	{/snippet}

	{#snippet footer()}
		<Button variant="ghost" onclick={handleClose}>Cancel</Button>
		<Button onclick={handleSave} loading={saving}>Save Changes</Button>
	{/snippet}
</Modal>
