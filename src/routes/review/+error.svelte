<script lang="ts">
	import { page } from '$app/stores';
	import { Header } from '$components/layout';
	import { Button, Card } from '$components/ui';
	import { Brain, Home, RefreshCw } from 'lucide-svelte';

	const status = $derived($page.status);
	const message = $derived($page.error?.message || 'Failed to load review session');
</script>

<svelte:head>
	<title>Error | Review | Marginalia</title>
</svelte:head>

<Header title="Review" />

<div class="px-lg py-xl">
	<Card padding="xl" class="text-center max-w-md mx-auto">
		<Brain class="text-tertiary mx-auto mb-md" size={48} />
		<h2 class="font-heading text-xl text-primary mb-sm">Error Loading Review Session</h2>
		<p class="text-secondary mb-lg">{message}</p>

		<div class="flex gap-md justify-center">
			<Button variant="ghost" onclick={() => window.location.reload()}>
				<RefreshCw size={16} />
				Reload
			</Button>
			<Button href="/">
				<Home size={16} />
				Home
			</Button>
		</div>
	</Card>
</div>
