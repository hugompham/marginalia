<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronLeft } from 'lucide-svelte';

	interface Props {
		title: string;
		backHref?: string;
		backAction?: () => void;
		actions?: Snippet;
	}

	let { title, backHref, backAction, actions }: Props = $props();
</script>

<header class="sticky top-0 z-40 bg-canvas/80 backdrop-blur-sm border-b border-border">
	<div class="flex items-center justify-between px-lg py-md">
		<div class="flex items-center gap-sm">
			{#if backHref}
				<a
					href={backHref}
					class="p-sm -ml-sm rounded-button text-secondary hover:text-primary hover:bg-subtle transition-colors"
					aria-label="Go back"
				>
					<ChevronLeft size={20} />
				</a>
			{:else if backAction}
				<button
					type="button"
					onclick={backAction}
					class="p-sm -ml-sm rounded-button text-secondary hover:text-primary hover:bg-subtle transition-colors"
					aria-label="Go back"
				>
					<ChevronLeft size={20} />
				</button>
			{/if}
			<h1 class="font-heading text-xl text-primary">{title}</h1>
		</div>

		{#if actions}
			<div class="flex items-center gap-sm">
				{@render actions()}
			</div>
		{/if}
	</div>
</header>
