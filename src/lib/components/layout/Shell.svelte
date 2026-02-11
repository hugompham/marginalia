<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Profile } from '$lib/types';
	import { PanelLeftOpen } from 'lucide-svelte';
	import Sidebar from './Sidebar.svelte';
	import BottomNav from './BottomNav.svelte';
	import {
		sidebarCollapsed,
		toggleSidebar,
		SIDEBAR_EXPANDED,
		SIDEBAR_COLLAPSED
	} from '$lib/stores/sidebar';

	interface Props {
		children: Snippet;
		userEmail?: string;
		profile?: Profile | null;
		onviewprofile?: () => void;
		onaccountsettings?: () => void;
	}

	let {
		children,
		userEmail,
		profile = null,
		onviewprofile = () => {},
		onaccountsettings = () => {}
	}: Props = $props();

	const sidebarWidth = $derived($sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED);
</script>

<div class="min-h-screen bg-canvas">
	<!-- Desktop sidebar -->
	<Sidebar {userEmail} {profile} {onviewprofile} {onaccountsettings} />

	<!-- Floating expand button (visible only when sidebar is collapsed) -->
	{#if $sidebarCollapsed}
		<button
			type="button"
			onclick={toggleSidebar}
			class="hidden desktop:flex fixed top-lg z-30 items-center justify-center w-8 h-8 rounded-button bg-surface border border-border text-tertiary hover:text-primary hover:bg-subtle shadow-sm transition-colors"
			style="left: {SIDEBAR_COLLAPSED + 8}px"
			aria-label="Expand sidebar"
			title="Expand sidebar"
		>
			<PanelLeftOpen size={16} />
		</button>
	{/if}

	<!-- Main content area -->
	<main class="desktop-sidebar-margin pb-20 desktop:pb-0" style="--sidebar-width: {sidebarWidth}px">
		<div class="max-w-app mx-auto">
			{@render children()}
		</div>
	</main>

	<!-- Mobile bottom navigation -->
	<BottomNav />
</div>
