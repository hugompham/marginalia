<script lang="ts">
	import type { Snippet, Component } from 'svelte';

	interface MenuItem {
		label: string;
		icon?: Component<{ size?: number }>;
		variant?: 'default' | 'danger';
		onclick: () => void;
	}

	interface Props {
		open: boolean;
		items: MenuItem[];
		trigger: Snippet;
	}

	let { open = $bindable(false), items, trigger }: Props = $props();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			open = false;
		}
	}

	function handleItemClick(item: MenuItem) {
		item.onclick();
		open = false;
	}
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if open}
	<div class="fixed inset-0 z-40" onclick={() => (open = false)} onkeydown={handleKeydown}></div>
{/if}

<div class="relative">
	{@render trigger()}

	{#if open}
		<div
			class="absolute right-0 top-full mt-1 min-w-[160px] bg-surface border border-border rounded-card shadow-card z-40 py-1 animate-in fade-in"
			role="menu"
		>
			{#each items as item}
				<button
					type="button"
					class="w-full flex items-center gap-sm px-md py-sm text-sm transition-colors
						{item.variant === 'danger' ? 'text-error hover:bg-error/10' : 'text-primary hover:bg-subtle'}"
					role="menuitem"
					onclick={() => handleItemClick(item)}
				>
					{#if item.icon}
						<item.icon size={14} />
					{/if}
					{item.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
