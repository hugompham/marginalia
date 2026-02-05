<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { Shell } from '$components/layout';
	import { Toast } from '$components/ui';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	// Initialize theme from server data (runs during SSR and client)
	theme.set(data.theme);

	// Keep in sync after client-side navigation
	$effect(() => {
		theme.set(data.theme);
	});

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
	const userEmail = $derived(data.session?.user?.email);
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
</svelte:head>

{#if showShell}
	<Shell {userEmail}>
		{@render children()}
	</Shell>
{:else}
	{@render children()}
{/if}

<!-- Global Toast container -->
<Toast />
