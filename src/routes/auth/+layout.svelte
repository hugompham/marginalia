<script lang="ts">
	import '../../app.css';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="min-h-screen bg-canvas flex flex-col items-center justify-center p-lg">
	<div class="w-full max-w-md">
		<!-- Logo -->
		<div class="text-center mb-2xl">
			<h1 class="font-heading text-3xl text-primary mb-sm">Marginalia</h1>
			<p class="text-secondary text-sm">
				Transform reading highlights into lasting knowledge
			</p>
		</div>

		<!-- Auth content -->
		{@render children()}

		<!-- Footer -->
		<p class="text-center text-tertiary text-xs mt-2xl">
			By continuing, you agree to our Terms of Service and Privacy Policy.
		</p>
	</div>
</div>
