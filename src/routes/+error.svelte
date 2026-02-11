<script lang="ts">
	import { page } from '$app/stores';
	import { Button, Card } from '$components/ui';
	import { Home, ArrowLeft } from 'lucide-svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data: _data }: Props = $props();

	const status = $derived($page.status);
	const message = $derived($page.error?.message || 'An unexpected error occurred');

	const errorTitle = $derived(() => {
		switch (status) {
			case 404:
				return 'Page Not Found';
			case 403:
				return 'Access Denied';
			case 500:
				return 'Server Error';
			default:
				return 'Error';
		}
	});

	const errorDescription = $derived(() => {
		switch (status) {
			case 404:
				return "The page you're looking for doesn't exist or has been moved.";
			case 403:
				return "You don't have permission to access this page.";
			case 500:
				return 'Something went wrong on our end. Please try again later.';
			default:
				return message;
		}
	});
</script>

<svelte:head>
	<title>{errorTitle} | Marginalia</title>
</svelte:head>

<div class="min-h-screen bg-canvas flex items-center justify-center px-lg">
	<Card padding="xl" class="max-w-md w-full text-center">
		<!-- Error Icon -->
		<div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-lg">
			<span class="text-accent font-heading text-3xl font-bold">{status}</span>
		</div>

		<!-- Error Message -->
		<h1 class="font-heading text-2xl text-primary mb-sm">{errorTitle()}</h1>
		<p class="text-secondary mb-xl">{errorDescription()}</p>

		<!-- Actions -->
		<div class="flex gap-md justify-center">
			<Button variant="ghost" onclick={() => window.history.back()}>
				<ArrowLeft size={16} />
				Go Back
			</Button>
			<Button href="/">
				<Home size={16} />
				Home
			</Button>
		</div>
	</Card>
</div>
