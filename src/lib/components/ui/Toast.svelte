<script lang="ts" module>
	import { writable } from 'svelte/store';

	export interface ToastMessage {
		id: string;
		type: 'success' | 'error' | 'warning' | 'info';
		message: string;
		duration?: number;
	}

	function createToastStore() {
		const { subscribe, update } = writable<ToastMessage[]>([]);

		function add(type: ToastMessage['type'], message: string, duration = 4000) {
			const id = Math.random().toString(36).slice(2, 9);
			const toast: ToastMessage = { id, type, message, duration };

			update((toasts) => [...toasts, toast]);

			if (duration > 0) {
				setTimeout(() => remove(id), duration);
			}

			return id;
		}

		function remove(id: string) {
			update((toasts) => toasts.filter((t) => t.id !== id));
		}

		return {
			subscribe,
			success: (message: string, duration?: number) => add('success', message, duration),
			error: (message: string, duration?: number) => add('error', message, duration),
			warning: (message: string, duration?: number) => add('warning', message, duration),
			info: (message: string, duration?: number) => add('info', message, duration),
			remove
		};
	}

	export const toast = createToastStore();
</script>

<script lang="ts">
	import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-svelte';

	const colors = {
		success: 'bg-success/10 border-success/20 text-success',
		error: 'bg-error/10 border-error/20 text-error',
		warning: 'bg-warning/10 border-warning/20 text-warning',
		info: 'bg-accent/10 border-accent/20 text-accent'
	};
</script>

<div class="fixed bottom-lg right-lg z-50 flex flex-col gap-sm max-w-sm w-full pointer-events-none">
	{#each $toast as message (message.id)}
		<div
			class="pointer-events-auto flex items-start gap-md p-lg rounded-card border bg-surface shadow-lg animate-slide-in"
			role="alert"
		>
			<div class="{colors[message.type]} p-1 rounded-full">
				{#if message.type === 'success'}
					<CheckCircle size={16} />
				{:else if message.type === 'error'}
					<AlertCircle size={16} />
				{:else if message.type === 'warning'}
					<AlertTriangle size={16} />
				{:else}
					<Info size={16} />
				{/if}
			</div>
			<p class="flex-1 text-sm text-primary">{message.message}</p>
			<button
				type="button"
				class="text-tertiary hover:text-primary transition-colors"
				onclick={() => toast.remove(message.id)}
				aria-label="Dismiss"
			>
				<X size={16} />
			</button>
		</div>
	{/each}
</div>

<style>
	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.animate-slide-in {
		animation: slide-in var(--duration-normal, 250ms) var(--ease-enter, ease-out);
	}
</style>
