<script lang="ts">
	import { Modal, Button, Input } from '$components/ui';
	import { toast } from '$components/ui/Toast.svelte';
	import { invalidate } from '$app/navigation';
	import type { Profile } from '$lib/types';
	import type { SupabaseClient } from '@supabase/supabase-js';

	interface Props {
		open: boolean;
		profile: Profile | null;
		userEmail: string;
		supabase: SupabaseClient;
	}

	let { open = $bindable(false), profile, userEmail, supabase }: Props = $props();

	let firstName = $state('');
	let lastName = $state('');
	let displayName = $state('');
	let saving = $state(false);

	// Sync form state when dialog opens or profile changes
	$effect(() => {
		if (open && profile) {
			firstName = profile.firstName ?? '';
			lastName = profile.lastName ?? '';
			displayName = profile.displayName ?? '';
		}
	});

	const initial = $derived(
		firstName?.[0]?.toUpperCase() || userEmail[0]?.toUpperCase() || 'U'
	);

	async function handleSave() {
		if (!profile) return;
		saving = true;

		try {
			// Cast needed: generated types lag behind migration (new columns)
			const { error } = await supabase
				.from('profiles')
				.update({
					first_name: firstName || null,
					last_name: lastName || null,
					display_name: displayName || null
				} as Record<string, unknown>)
				.eq('id', profile.id);

			if (error) throw error;

			toast.success('Profile updated');
			await invalidate('app:profile');
			open = false;
		} catch (err) {
			console.error('Profile update failed:', err);
			toast.error('Failed to update profile');
		} finally {
			saving = false;
		}
	}
</script>

<Modal bind:open title="Edit Profile">
	<div class="space-y-xl">
		<!-- Avatar -->
		<div class="flex justify-center">
			{#if profile?.avatarUrl}
				<img
					src={profile.avatarUrl}
					alt=""
					class="w-20 h-20 rounded-full object-cover"
				/>
			{:else}
				<div class="w-20 h-20 rounded-full bg-subtle flex items-center justify-center">
					<span class="text-2xl font-medium text-secondary">{initial}</span>
				</div>
			{/if}
		</div>

		<!-- Form fields -->
		<div class="grid grid-cols-2 gap-md">
			<Input
				label="First name"
				name="firstName"
				bind:value={firstName}
				placeholder="First name"
			/>
			<Input
				label="Last name"
				name="lastName"
				bind:value={lastName}
				placeholder="Last name"
			/>
		</div>

		<Input
			label="Display name"
			name="displayName"
			bind:value={displayName}
			placeholder="How you appear to others"
		/>

		<div>
			<span class="block text-sm font-medium text-primary mb-sm">Email</span>
			<p class="text-sm text-secondary px-md py-sm bg-subtle rounded-button">{userEmail}</p>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-md">
			<Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
			<Button onclick={handleSave} loading={saving}>Save</Button>
		</div>
	{/snippet}
</Modal>
