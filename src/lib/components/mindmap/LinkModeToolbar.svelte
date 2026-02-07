<script lang="ts">
	import { Link, Sparkles, Loader2 } from 'lucide-svelte';

	interface Props {
		linkMode: boolean;
		sourceNodeId: string | null;
		isSuggesting: boolean;
		hasApiKey: boolean;
		ontogglelink: () => void;
		onsuggest: () => void;
	}

	let { linkMode, sourceNodeId, isSuggesting, hasApiKey, ontogglelink, onsuggest }: Props =
		$props();
</script>

<div
	class="absolute bottom-md left-1/2 -translate-x-1/2 z-10 flex items-center gap-sm px-md py-sm rounded-card bg-surface border border-border shadow-card"
>
	<button
		type="button"
		onclick={ontogglelink}
		class="flex items-center gap-xs px-md py-sm rounded-button text-sm font-medium transition-colors
			{linkMode
			? 'bg-accent text-white'
			: 'bg-subtle text-secondary hover:text-primary hover:bg-surface'}"
	>
		<Link size={14} />
		{#if linkMode && sourceNodeId}
			Click target...
		{:else if linkMode}
			Click source...
		{:else}
			Link
		{/if}
	</button>

	{#if hasApiKey}
		<button
			type="button"
			onclick={onsuggest}
			disabled={isSuggesting}
			class="flex items-center gap-xs px-md py-sm rounded-button text-sm font-medium bg-subtle text-secondary hover:text-primary hover:bg-surface transition-colors disabled:opacity-50"
		>
			{#if isSuggesting}
				<Loader2 size={14} class="animate-spin" />
				Analyzing...
			{:else}
				<Sparkles size={14} />
				Suggest
			{/if}
		</button>
	{/if}
</div>
