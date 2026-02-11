<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { Shell } from '$components/layout';
	import { ProfileDialog, AccountSettingsDialog } from '$components/layout';
	import { Toast } from '$components/ui';
	import { page } from '$app/stores';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { sidebarCollapsed } from '$lib/stores/sidebar';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	// Dialog state
	let showProfileDialog = $state(false);
	let showAccountSettingsDialog = $state(false);

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
				invalidate('supabase:auth');
			}
		});

		// Listen for custom events from settings page
		function handleOpenProfile() {
			showProfileDialog = true;
		}
		function handleOpenAccountSettings() {
			showAccountSettingsDialog = true;
		}

		window.addEventListener('open-profile-dialog', handleOpenProfile);
		window.addEventListener('open-account-settings', handleOpenAccountSettings);

		return () => {
			subscription.unsubscribe();
			window.removeEventListener('open-profile-dialog', handleOpenProfile);
			window.removeEventListener('open-account-settings', handleOpenAccountSettings);
		};
	});

	// Show shell for authenticated routes, but not onboarding
	const isOnboarding = $derived($page.url.pathname.startsWith('/onboarding'));
	const showShell = $derived(data.session !== null && !isOnboarding);
	const userEmail = $derived(data.session?.user?.email ?? '');
</script>

<svelte:head>
	<title>Marginalia</title>
	<link rel="icon" href="/icons/icon-192.png" />
</svelte:head>

{#if showShell}
	<Shell
		{userEmail}
		profile={data.profile}
		onviewprofile={() => (showProfileDialog = true)}
		onaccountsettings={() => (showAccountSettingsDialog = true)}
	>
		{@render children()}
	</Shell>

	<!-- Profile Dialog -->
	<ProfileDialog
		bind:open={showProfileDialog}
		profile={data.profile}
		{userEmail}
		supabase={data.supabase}
	/>

	<!-- Account Settings Dialog -->
	<AccountSettingsDialog
		bind:open={showAccountSettingsDialog}
		profile={data.profile}
		apiKeys={data.apiKeys}
	/>
{:else}
	{@render children()}
{/if}

<!-- Global Toast container -->
<Toast />
