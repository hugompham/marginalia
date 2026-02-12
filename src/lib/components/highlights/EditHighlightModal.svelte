<script lang="ts">
	import { Button, Textarea, Modal } from '$components/ui';
	import { toast } from '$components/ui/Toast.svelte';
	import type { Highlight } from '$lib/types';

	interface Props {
		open: boolean;
		highlight: Highlight;
		onSave?: (updated: Highlight) => void;
		onClose?: () => void;
	}

	let { open = $bindable(false), highlight, onSave, onClose }: Props = $props();

	let text = $state('');
	let note = $state('');
	let saving = $state(false);

	$effect(() => {
		if (open) {
			text = highlight.text;
			note = highlight.note ?? '';
		}
	});

	function handleClose() {
		open = false;
		onClose?.();
	}

	async function handleSave() {
		if (!text.trim()) {
			toast.error('Highlight text is required');
			return;
		}

		saving = true;

		try {
			const response = await fetch(`/api/highlights/${highlight.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: text.trim(), note: note.trim() || null })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to update highlight');
			}

			const updated: Highlight = await response.json();
			onSave?.(updated);
			open = false;
			toast.success('Highlight updated');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update highlight');
		} finally {
			saving = false;
		}
	}
</script>

<Modal bind:open title="Edit Highlight" onclose={handleClose}>
	{#snippet children()}
		<div class="space-y-lg">
			<Textarea label="Highlight text" bind:value={text} rows={4} />
			<Textarea label="Note (optional)" bind:value={note} rows={3} placeholder="Your thoughts..." />
		</div>
	{/snippet}

	{#snippet footer()}
		<Button variant="ghost" onclick={handleClose}>Cancel</Button>
		<Button onclick={handleSave} loading={saving}>Save Changes</Button>
	{/snippet}
</Modal>
