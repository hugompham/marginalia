<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sidebar from './Sidebar.svelte';
	import BottomNav from './BottomNav.svelte';
	import { sidebarCollapsed, SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from '$lib/stores/sidebar';

	interface Props {
		children: Snippet;
		userEmail?: string;
	}

	let { children, userEmail }: Props = $props();

	const sidebarWidth = $derived($sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED);
</script>

<div class="min-h-screen bg-canvas">
	<!-- Desktop sidebar -->
	<Sidebar {userEmail} />

	<!-- Main content area -->
	<main class="desktop-sidebar-margin pb-20 desktop:pb-0" style="--sidebar-width: {sidebarWidth}px">
		<div class="max-w-app mx-auto">
			{@render children()}
		</div>
	</main>

	<!-- Mobile bottom navigation -->
	<BottomNav />
</div>
