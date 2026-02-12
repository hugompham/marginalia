<script lang="ts">
	import { enhance } from '$app/forms';
	import { Sun, Moon } from 'lucide-svelte';
	import { theme, setTheme } from '$lib/stores/theme';
	import type { ActionData, PageData } from './$types';

	interface Props {
		form: ActionData;
		data: PageData;
	}

	let { form, data }: Props = $props();

	let firstName = $state(data.prefill?.firstName ?? '');
	let lastName = $state(data.prefill?.lastName ?? '');
	let submitting = $state(false);
	let selectedTheme = $state<'light' | 'dark'>($theme);

	function selectTheme(t: 'light' | 'dark') {
		selectedTheme = t;
		// Apply immediately for visual feedback
		setTheme(t).catch(() => {});
	}
</script>

<svelte:head>
	<title>Welcome | Marginalia</title>
</svelte:head>

<div class="min-h-screen bg-canvas flex flex-col items-center justify-center p-lg">
	<div class="w-full max-w-md">
		<!-- Logo -->
		<div class="text-center mb-2xl">
			<img src="/icons/icon-192.png" alt="" class="w-16 h-16 rounded-card mx-auto mb-md" />
			<h1 class="font-heading text-3xl text-primary mb-sm">Welcome to Marginalia</h1>
			<p class="text-secondary text-sm">Let's set up your profile to get started.</p>
		</div>

		<!-- Form -->
		<div class="card p-xl">
			<form
				method="POST"
				action="?/complete"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update();
					};
				}}
			>
				<div class="space-y-lg">
					<!-- Name fields -->
					<div class="grid grid-cols-2 gap-md">
						<div>
							<label for="firstName" class="block text-sm font-medium text-primary mb-sm">
								First name *
							</label>
							<input
								type="text"
								id="firstName"
								name="firstName"
								bind:value={firstName}
								required
								autocomplete="given-name"
								class="input"
								placeholder="First name"
								disabled={submitting}
							/>
						</div>
						<div>
							<label for="lastName" class="block text-sm font-medium text-primary mb-sm">
								Last name
							</label>
							<input
								type="text"
								id="lastName"
								name="lastName"
								bind:value={lastName}
								autocomplete="family-name"
								class="input"
								placeholder="Last name"
								disabled={submitting}
							/>
						</div>
					</div>

					<!-- Display name (auto-generated) -->
					<input
						type="hidden"
						name="displayName"
						value="{firstName}{lastName ? ` ${lastName}` : ''}"
					/>

					<!-- Theme preference -->
					<div>
						<p class="text-sm font-medium text-primary mb-sm">Theme preference</p>
						<input type="hidden" name="theme" value={selectedTheme} />
						<div class="grid grid-cols-2 gap-md">
							<button
								type="button"
								onclick={() => selectTheme('light')}
								class="flex flex-col items-center gap-sm p-lg rounded-card border-2 transition-all
									{selectedTheme === 'light' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30'}"
							>
								<Sun
									size={24}
									class={selectedTheme === 'light' ? 'text-accent' : 'text-secondary'}
								/>
								<span
									class="text-sm font-medium {selectedTheme === 'light'
										? 'text-accent'
										: 'text-secondary'}"
								>
									Light
								</span>
							</button>
							<button
								type="button"
								onclick={() => selectTheme('dark')}
								class="flex flex-col items-center gap-sm p-lg rounded-card border-2 transition-all
									{selectedTheme === 'dark' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30'}"
							>
								<Moon
									size={24}
									class={selectedTheme === 'dark' ? 'text-accent' : 'text-secondary'}
								/>
								<span
									class="text-sm font-medium {selectedTheme === 'dark'
										? 'text-accent'
										: 'text-secondary'}"
								>
									Dark
								</span>
							</button>
						</div>
					</div>

					{#if form?.error}
						<p class="text-error text-sm">{form.error}</p>
					{/if}

					<button
						type="submit"
						class="btn-primary w-full"
						disabled={submitting || !firstName.trim()}
					>
						{#if submitting}
							<span
								class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
							></span>
							Setting up...
						{:else}
							Get Started
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
