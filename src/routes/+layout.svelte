<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { Shell } from '$components/layout';
	import { Toast } from '$components/ui';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { sidebarCollapsed } from '$lib/stores/sidebar';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	// Initialize theme and sidebar state from server data
	$effect(() => {
		theme.set(data.theme);
	});

	$effect(() => {
		sidebarCollapsed.set(data.sidebarCollapsed);
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
	<title>Marginalia</title>
	<link rel="icon" href="/icons/icon-192.png" />
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
