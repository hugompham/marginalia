<script lang="ts">
	import { Button } from '$components/ui';
	import { TagBadge } from '$components/tags';
	import { Plus } from 'lucide-svelte';
	import type { Tag } from '$lib/types';

	interface Props {
		availableTags: Tag[];
		selectedTags: Tag[];
		ontagadd: (tag: Tag) => void;
		ontagremove: (tag: Tag) => void;
	}

	let { availableTags, selectedTags, ontagadd, ontagremove }: Props = $props();

	let showDropdown = $state(false);

	const unselectedTags = $derived(
		availableTags.filter((t) => !selectedTags.some((st) => st.id === t.id))
	);

	function handleTagAdd(tag: Tag) {
		ontagadd(tag);
		showDropdown = false;
	}
</script>

<div class="space-y-sm">
	<!-- Selected Tags -->
	{#if selectedTags.length > 0}
		<div class="flex flex-wrap gap-xs">
			{#each selectedTags as tag (tag.id)}
				<TagBadge {tag} removable onremove={() => ontagremove(tag)} />
			{/each}
		</div>
	{/if}

	<!-- Add Tag Button -->
	{#if unselectedTags.length > 0}
		<div class="relative">
			<Button variant="ghost" size="sm" onclick={() => (showDropdown = !showDropdown)}>
				<Plus size={16} />
				Add Tag
			</Button>

			{#if showDropdown}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="fixed inset-0 z-40" onclick={() => (showDropdown = false)}></div>

				<div
					class="absolute left-0 top-full mt-xs z-50 bg-surface border border-border rounded-button shadow-lg max-h-48 overflow-y-auto min-w-[200px]"
				>
					{#each unselectedTags as tag (tag.id)}
						<button
							type="button"
							onclick={() => handleTagAdd(tag)}
							class="w-full px-md py-sm text-left hover:bg-subtle transition-colors flex items-center gap-sm"
						>
							<div
								class="w-3 h-3 rounded-full border-2"
								style="border-color: {tag.color || '#d4856d'}"
							></div>
							<span class="text-sm text-primary">{tag.name}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
