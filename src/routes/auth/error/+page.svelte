<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Auth Error | Marginalia</title>
</svelte:head>

<div class="card p-xl text-center">
	<div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-lg">
		<svg class="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
			/>
		</svg>
	</div>

	<h2 class="font-heading text-xl mb-sm">Authentication Error</h2>
	<p class="text-secondary text-sm mb-lg">
		We couldn't complete your sign in. The link may have expired or already been used.
	</p>

	<button type="button" class="btn-primary" onclick={() => goto('/auth/login')}> Try Again </button>
</div>
