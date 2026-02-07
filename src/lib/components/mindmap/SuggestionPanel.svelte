<script lang="ts">
	import { X, Check, XCircle } from 'lucide-svelte';
	import type { HighlightLink, Highlight } from '$lib/types';

	interface Props {
		suggestions: HighlightLink[];
		highlightsById: Map<string, Highlight>;
		onaccept: (id: string) => void;
		ondismiss: (id: string) => void;
		onclose: () => void;
	}

	let { suggestions, highlightsById, onaccept, ondismiss, onclose }: Props = $props();

	function getPreview(highlightId: string): string {
		const h = highlightsById.get(highlightId);
		if (!h) return 'Unknown highlight';
		return h.text.length > 60 ? h.text.slice(0, 60) + '...' : h.text;
	}
</script>

<div
	class="fixed z-50
		desktop:right-0 desktop:top-0 desktop:w-96 desktop:h-full desktop:border-l
		mobile:bottom-0 mobile:left-0 mobile:right-0 mobile:max-h-[50vh] mobile:rounded-t-xl mobile:border-t
		tablet:bottom-0 tablet:left-0 tablet:right-0 tablet:max-h-[50vh] tablet:rounded-t-xl tablet:border-t
		bg-surface border-border shadow-card-hover overflow-y-auto"
>
	<div
		class="flex items-center justify-between px-lg py-md border-b border-border sticky top-0 bg-surface"
	>
		<h3 class="font-heading text-base text-primary">
			Suggestions ({suggestions.length})
		</h3>
		<button
			type="button"
			onclick={onclose}
			class="p-xs rounded-button text-secondary hover:text-primary hover:bg-subtle transition-colors"
			aria-label="Close suggestions"
		>
			<X size={18} />
		</button>
	</div>

	<div class="px-lg py-md space-y-md">
		{#if suggestions.length === 0}
			<p class="text-sm text-tertiary text-center py-lg">No pending suggestions.</p>
		{:else}
			{#each suggestions as suggestion (suggestion.id)}
				<div class="p-md rounded-card border border-border space-y-sm">
					<div class="space-y-xs">
						<p class="text-xs text-secondary leading-relaxed">
							{getPreview(suggestion.sourceHighlightId)}
						</p>
						<div class="flex items-center gap-xs text-xs text-tertiary">
							<span class="flex-1 border-t border-border"></span>
							<span>linked to</span>
							<span class="flex-1 border-t border-border"></span>
						</div>
						<p class="text-xs text-secondary leading-relaxed">
							{getPreview(suggestion.targetHighlightId)}
						</p>
					</div>

					{#if suggestion.description}
						<p class="text-xs text-accent italic">{suggestion.description}</p>
					{/if}

					{#if suggestion.aiConfidence !== null}
						<p class="text-xs text-tertiary">
							Confidence: {Math.round(suggestion.aiConfidence * 100)}%
						</p>
					{/if}

					<div class="flex items-center gap-sm">
						<button
							type="button"
							onclick={() => onaccept(suggestion.id)}
							class="flex items-center gap-xs px-sm py-xs rounded-button text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
						>
							<Check size={12} />
							Accept
						</button>
						<button
							type="button"
							onclick={() => ondismiss(suggestion.id)}
							class="flex items-center gap-xs px-sm py-xs rounded-button text-xs font-medium bg-subtle text-secondary hover:text-primary transition-colors"
						>
							<XCircle size={12} />
							Dismiss
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
