<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sidebar from './Sidebar.svelte';
	import BottomNav from './BottomNav.svelte';
	import { Toast } from '$components/ui';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="min-h-screen bg-canvas">
	<!-- Desktop sidebar -->
	<Sidebar />

	<!-- Main content area -->
	<main class="desktop:ml-64 pb-20 desktop:pb-0">
		<div class="max-w-app mx-auto">
			{@render children()}
		</div>
	</main>

	<!-- Mobile bottom navigation -->
	<BottomNav />

	<!-- Toast notifications -->
	<Toast />
</div>
