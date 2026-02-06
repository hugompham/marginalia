<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from 'lucide-svelte';

	interface Props {
		open: boolean;
		title?: string;
		onclose?: () => void;
		children: Snippet;
		footer?: Snippet;
	}

	let { open = $bindable(false), title, onclose, children, footer }: Props = $props();

	function handleClose() {
		open = false;
		onclose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-lg"
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<!-- Backdrop -->
		<div
			class="absolute inset-0 bg-primary/50 backdrop-blur-sm"
			onclick={handleBackdropClick}
			aria-hidden="true"
		></div>

		<!-- Modal content -->
		<div
			class="relative w-full max-w-lg max-h-[90vh] bg-surface rounded-card shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-normal"
		>
			<!-- Header -->
			{#if title}
				<div class="flex items-center justify-between px-xl py-lg border-b border-border">
					<h2 id="modal-title" class="font-heading text-xl text-primary">
						{title}
					</h2>
					<button
						type="button"
						class="p-sm rounded-button text-secondary hover:text-primary hover:bg-subtle transition-colors"
						onclick={handleClose}
						aria-label="Close modal"
					>
						<X size={20} />
					</button>
				</div>
			{:else}
				<button
					type="button"
					class="absolute top-lg right-lg p-sm rounded-button text-secondary hover:text-primary hover:bg-subtle transition-colors z-10"
					onclick={handleClose}
					aria-label="Close modal"
				>
					<X size={20} />
				</button>
			{/if}

			<!-- Body -->
			<div class="flex-1 overflow-y-auto p-xl">
				{@render children()}
			</div>

			<!-- Footer -->
			{#if footer}
				<div class="px-xl py-lg border-t border-border bg-subtle/50">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes zoom-in-95 {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}

	.animate-in {
		animation:
			fade-in var(--duration-normal) var(--ease-enter),
			zoom-in-95 var(--duration-normal) var(--ease-enter);
	}
</style>
