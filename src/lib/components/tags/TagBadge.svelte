<script lang="ts">
	import { X } from 'lucide-svelte';
	import type { Tag } from '$lib/types';

	interface Props {
		tag: Tag;
		removable?: boolean;
		onremove?: () => void;
	}

	let { tag, removable = false, onremove }: Props = $props();
</script>

<span
	class="inline-flex items-center gap-xs px-sm py-xs rounded-full text-xs font-medium border-2"
	style="border-color: {tag.color || '#d4856d'}; color: {tag.color || '#d4856d'}"
>
	{tag.name}
	{#if removable && onremove}
		<button
			type="button"
			onclick={onremove}
			class="hover:opacity-70 transition-opacity"
			aria-label="Remove tag"
		>
			<X size={12} />
		</button>
	{/if}
</span>
