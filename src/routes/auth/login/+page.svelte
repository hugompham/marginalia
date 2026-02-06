<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();

	let email = $state('');
	let loading = $state(false);
	let showSuccess = $state(false);
</script>

<svelte:head>
	<title>Sign In | Marginalia</title>
</svelte:head>

<div class="card p-xl">
	{#if showSuccess || form?.success}
		<!-- Success state -->
		<div class="text-center">
			<div
				class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-lg"
			>
				<svg class="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
			</div>
			<h2 class="font-heading text-xl mb-sm">Check your email</h2>
			<p class="text-secondary text-sm mb-lg">
				We sent a magic link to <strong class="text-primary">{email || form?.email}</strong>
			</p>
			<p class="text-tertiary text-xs">
				Click the link in the email to sign in. The link expires in 1 hour.
			</p>
			<button
				type="button"
				class="btn-ghost mt-lg text-sm"
				onclick={() => {
					showSuccess = false;
					email = '';
				}}
			>
				Use a different email
			</button>
		</div>
	{:else}
		<!-- Login form -->
		<h2 class="font-heading text-xl text-center mb-xl">Sign in to continue</h2>

		<form
			method="POST"
			action="?/magicLink"
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					if (result.type === 'success') {
						showSuccess = true;
					}
					await update();
				};
			}}
		>
			<div class="mb-lg">
				<label for="email" class="block text-sm font-medium text-primary mb-sm">
					Email address
				</label>
				<input
					type="email"
					id="email"
					name="email"
					bind:value={email}
					required
					autocomplete="email"
					class="input"
					placeholder="you@example.com"
					disabled={loading}
				/>
			</div>

			{#if form?.error}
				<p class="text-error text-sm mb-lg">{form.error}</p>
			{/if}

			<button type="submit" class="btn-primary w-full" disabled={loading || !email}>
				{#if loading}
					<span
						class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
					></span>
					Sending link...
				{:else}
					Continue with Email
				{/if}
			</button>
		</form>

		<div class="relative my-xl">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-border"></div>
			</div>
			<div class="relative flex justify-center text-xs">
				<span class="px-md bg-surface text-tertiary">or</span>
			</div>
		</div>

		<form method="POST" action="?/google">
			<button type="submit" class="btn-secondary w-full" disabled={loading}>
				<svg class="w-5 h-5" viewBox="0 0 24 24">
					<path
						fill="currentColor"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="currentColor"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="currentColor"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="currentColor"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				Continue with Google
			</button>
		</form>
	{/if}
</div>
