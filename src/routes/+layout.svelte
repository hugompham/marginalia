<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { Shell } from '$components/layout';
	import { Toast } from '$components/ui';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	onMount(() => {
		// Listen for auth state changes
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((event, session) => {
			if (session?.access_token !== data.session?.access_token) {
				// Token changed, invalidate data
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});

	// Show shell only for authenticated routes
	const showShell = $derived(data.session !== null);
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
</svelte:head>

{#if showShell}
	<Shell>
		{@render children()}
	</Shell>
{:else}
	{@render children()}
{/if}

<!-- Global Toast container -->
<Toast />
