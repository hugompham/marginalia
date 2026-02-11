<script lang="ts">
	import { Card } from '$components/ui';
	import { TagManager } from '$components/tags';
	import { Tag as TagIcon, User, Settings as SettingsIcon } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Tag } from '$lib/types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let tags = $state<Tag[]>([]);

	$effect(() => {
		tags = data.tags || [];
	});
</script>

<svelte:head>
	<title>Settings | Marginalia</title>
</svelte:head>

<div class="px-lg py-xl space-y-xl">
	<h1 class="font-heading text-xl text-primary">Settings</h1>

	<!-- Quick links to profile/account dialogs -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
		<a
			href="/settings"
			class="flex items-center gap-md p-lg bg-surface border border-border rounded-card hover:shadow-card transition-shadow"
			onclick={(e) => {
				e.preventDefault();
				// Dispatch a custom event that the layout can listen to
				window.dispatchEvent(new CustomEvent('open-profile-dialog'));
			}}
		>
			<div class="p-sm rounded-button bg-subtle">
				<User size={20} class="text-secondary" />
			</div>
			<div>
				<p class="text-sm font-medium text-primary">Edit Profile</p>
				<p class="text-xs text-tertiary">Name, avatar, display name</p>
			</div>
		</a>

		<a
			href="/settings"
			class="flex items-center gap-md p-lg bg-surface border border-border rounded-card hover:shadow-card transition-shadow"
			onclick={(e) => {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent('open-account-settings'));
			}}
		>
			<div class="p-sm rounded-button bg-subtle">
				<SettingsIcon size={20} class="text-secondary" />
			</div>
			<div>
				<p class="text-sm font-medium text-primary">Account Settings</p>
				<p class="text-xs text-tertiary">API keys, review preferences, account</p>
			</div>
		</a>
	</div>

	<!-- Tags Section -->
	<section>
		<h2 class="font-heading text-lg text-primary mb-md flex items-center gap-sm">
			<TagIcon size={20} />
			Tags
		</h2>
		<Card padding="lg">
			<TagManager
				{tags}
				onTagCreated={(tag) => (tags = [...tags, tag])}
				onTagUpdated={(tag) => (tags = tags.map((t) => (t.id === tag.id ? tag : t)))}
				onTagDeleted={(tagId) => (tags = tags.filter((t) => t.id !== tagId))}
			/>
		</Card>
	</section>
</div>
