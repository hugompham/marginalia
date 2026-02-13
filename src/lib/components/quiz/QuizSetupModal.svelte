<script lang="ts">
	import { Modal, Button } from '$components/ui';
	import { Loader2 } from 'lucide-svelte';

	interface Props {
		open: boolean;
		highlightCount: number;
		isLoading?: boolean;
		onstart?: (questionCount: number) => void;
		onclose?: () => void;
	}

	let {
		open = $bindable(false),
		highlightCount,
		isLoading = false,
		onstart,
		onclose
	}: Props = $props();

	let selectedCount = $state(10);

	const questionOptions = [5, 10, 15, 20];

	function handleStart() {
		if (highlightCount < 3 || isLoading) return;
		onstart?.(selectedCount);
	}

	function handleClose() {
		open = false;
		onclose?.();
	}

	const canStart = $derived(highlightCount >= 3 && !isLoading);
</script>

<Modal {open} title="Start Quiz" onclose={handleClose}>
	<div class="space-y-lg">
		<p class="text-secondary">
			Generate quiz questions from <span class="font-medium text-primary"
				>{highlightCount} highlight{highlightCount === 1 ? '' : 's'}</span
			>
		</p>

		<!-- Question count selector -->
		<div>
			<p class="block text-sm font-medium text-secondary mb-sm">Number of Questions</p>
			<div class="grid grid-cols-4 gap-sm" role="group" aria-label="Number of questions">
				{#each questionOptions as count}
					<button
						type="button"
						class="px-md py-lg rounded-button text-center font-medium transition-all duration-fast focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 {selectedCount ===
						count
							? 'bg-accent text-white shadow-md'
							: 'bg-subtle text-primary hover:bg-border'}"
						onclick={() => (selectedCount = count)}
						aria-pressed={selectedCount === count}
					>
						{count}
					</button>
				{/each}
			</div>
		</div>

		<!-- Warning if insufficient highlights -->
		{#if highlightCount < 3}
			<div class="rounded-button bg-warning/10 border border-warning/30 px-md py-sm">
				<p class="text-sm text-warning">Need at least 3 highlights to start a quiz</p>
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex gap-sm justify-end">
			<Button variant="secondary" onclick={handleClose} disabled={isLoading}>Cancel</Button>
			<Button onclick={handleStart} disabled={!canStart}>
				{#if isLoading}
					<Loader2 size={16} class="animate-spin" />
				{/if}
				Start Quiz
			</Button>
		</div>
	{/snippet}
</Modal>
