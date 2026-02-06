<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Card, Input, Modal } from '$components/ui';
	import { TagManager } from '$components/tags';
	import { toast } from '$components/ui/Toast.svelte';
	import {
		Key,
		LogOut,
		User,
		Trash2,
		Brain,
		Tag as TagIcon,
		Palette,
		Sun,
		Moon
	} from 'lucide-svelte';
	import { theme, setTheme } from '$lib/stores/theme';
	import type { PageData, ActionData } from './$types';
	import type { Tag } from '$lib/types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form: _form }: Props = $props();
	let tags = $state<Tag[]>([]);

	// Sync tags when data changes
	$effect(() => {
		tags = data.tags || [];
	});

	// Theme handling
	async function selectTheme(newTheme: 'light' | 'dark') {
		if ($theme === newTheme) return;
		const oldTheme = $theme;

		try {
			await setTheme(newTheme);
			toast.success(`Switched to ${newTheme} mode`);
		} catch {
			theme.set(oldTheme);
			toast.error('Failed to update theme');
		}
	}

	let showApiKeyModal = $state(false);
	let showDeleteConfirm = $state(false);
	let apiKeyProvider = $state<'openai' | 'anthropic'>('openai');
	let apiKey = $state('');
	let apiModel = $state('gpt-4o-mini');
	let testingKey = $state(false);
	let savingKey = $state(false);

	const openaiModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'];
	const anthropicModels = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'];

	const models = $derived(apiKeyProvider === 'openai' ? openaiModels : anthropicModels);

	$effect(() => {
		// Reset model when provider changes
		apiModel = apiKeyProvider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-sonnet-20241022';
	});

	async function testApiKey() {
		if (!apiKey) return;

		testingKey = true;

		try {
			const response = await fetch('/api/test-key', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ provider: apiKeyProvider, key: apiKey, model: apiModel })
			});

			if (response.ok) {
				toast.success('API key is valid!');
			} else {
				const data = await response.json();
				toast.error(data.error || 'Invalid API key');
			}
		} catch {
			toast.error('Failed to test API key');
		} finally {
			testingKey = false;
		}
	}

	function openAddKeyModal(provider: 'openai' | 'anthropic') {
		apiKeyProvider = provider;
		apiKey = '';
		showApiKeyModal = true;
	}
</script>

<svelte:head>
	<title>Settings | Marginalia</title>
</svelte:head>

<div class="px-lg py-xl space-y-xl">
	<h1 class="font-heading text-xl text-primary">Settings</h1>
	<!-- Account Section -->
	<section>
		<h2 class="font-heading text-lg text-primary mb-md flex items-center gap-sm">
			<User size={20} />
			Account
		</h2>
		<Card padding="lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium text-primary">{data.user?.email}</p>
					<p class="text-sm text-secondary">
						Signed in via {data.user?.app_metadata?.provider ?? 'email'}
					</p>
				</div>
				<form method="POST" action="?/signout">
					<Button type="submit" variant="ghost" size="sm">
						<LogOut size={16} />
						Sign Out
					</Button>
				</form>
			</div>
		</Card>
	</section>

	<!-- Appearance Section -->
	<section>
		<h2 class="font-heading text-lg text-primary mb-md flex items-center gap-sm">
			<Palette size={20} />
			Appearance
		</h2>
		<Card padding="lg">
			<div class="flex justify-between items-center">
				<p class="font-medium text-primary mb-sm">Theme</p>
				<div class="flex gap-sm">
					<button
						type="button"
						onclick={() => selectTheme('light')}
						class="flex items-center gap-sm px-lg py-sm rounded-button border text-sm font-medium transition-all duration-fast ease-out
							{$theme === 'light'
							? 'border-accent bg-accent/10 text-accent'
							: 'border-border bg-transparent text-secondary hover:bg-subtle hover:text-primary'}"
						aria-pressed={$theme === 'light'}
					>
						<Sun size={16} />
						Light
					</button>
					<button
						type="button"
						onclick={() => selectTheme('dark')}
						class="flex items-center gap-sm px-lg py-sm rounded-button border text-sm font-medium transition-all duration-fast ease-out
							{$theme === 'dark'
							? 'border-accent bg-accent/10 text-accent'
							: 'border-border bg-transparent text-secondary hover:bg-subtle hover:text-primary'}"
						aria-pressed={$theme === 'dark'}
					>
						<Moon size={16} />
						Dark
					</button>
				</div>
			</div>
		</Card>
	</section>

	<!-- AI Provider Section -->
	<section>
		<h2 class="font-heading text-lg text-primary mb-md flex items-center gap-sm">
			<Key size={20} />
			AI Provider
		</h2>

		<div class="space-y-md">
			<!-- OpenAI -->
			<Card padding="lg">
				<div class="flex items-start justify-between">
					<div class="flex items-start gap-md">
						<div class="p-sm rounded-button bg-subtle">
							<svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"
								/>
							</svg>
						</div>
						<div>
							<h3 class="font-medium text-primary">OpenAI</h3>
							{#if data.apiKeys.openai}
								<p class="text-sm text-secondary">
									{data.apiKeys.openai.model}
								</p>
								<p class="text-xs text-tertiary">
									sk-...{data.apiKeys.openai.keyHint}
								</p>
							{:else}
								<p class="text-sm text-tertiary">Not configured</p>
							{/if}
						</div>
					</div>
					<div class="flex items-center gap-sm">
						{#if data.apiKeys.openai}
							<span class="text-xs text-success bg-success/10 px-sm py-xs rounded">Active</span>
							<form method="POST" action="?/removeKey">
								<input type="hidden" name="provider" value="openai" />
								<Button type="submit" variant="ghost" size="sm">
									<Trash2 size={14} />
								</Button>
							</form>
						{:else}
							<Button size="sm" onclick={() => openAddKeyModal('openai')}>Add Key</Button>
						{/if}
					</div>
				</div>
			</Card>

			<!-- Anthropic -->
			<Card padding="lg">
				<div class="flex items-start justify-between">
					<div class="flex items-start gap-md">
						<div class="p-sm rounded-button bg-subtle">
							<svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M17.304 3.541l-5.083 16.918H8.691L3.609 3.541h3.492l3.25 11.705 3.25-11.705h3.703zM20.391 20.459l-2.031-6.163h-1.648l2.031 6.163h1.648z"
								/>
							</svg>
						</div>
						<div>
							<h3 class="font-medium text-primary">Anthropic (Claude)</h3>
							{#if data.apiKeys.anthropic}
								<p class="text-sm text-secondary">
									{data.apiKeys.anthropic.model}
								</p>
								<p class="text-xs text-tertiary">
									sk-ant-...{data.apiKeys.anthropic.keyHint}
								</p>
							{:else}
								<p class="text-sm text-tertiary">Not configured</p>
							{/if}
						</div>
					</div>
					<div class="flex items-center gap-sm">
						{#if data.apiKeys.anthropic}
							<span class="text-xs text-success bg-success/10 px-sm py-xs rounded">Active</span>
							<form method="POST" action="?/removeKey">
								<input type="hidden" name="provider" value="anthropic" />
								<Button type="submit" variant="ghost" size="sm">
									<Trash2 size={14} />
								</Button>
							</form>
						{:else}
							<Button size="sm" variant="secondary" onclick={() => openAddKeyModal('anthropic')}>
								Add Key
							</Button>
						{/if}
					</div>
				</div>
			</Card>
		</div>
	</section>

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

	<!-- Review Settings -->
	<section>
		<h2 class="font-heading text-lg text-primary mb-md flex items-center gap-sm">
			<Brain size={20} />
			Review Settings
		</h2>
		<Card padding="lg">
			<form
				method="POST"
				action="?/updateSettings"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							toast.success('Settings saved!');
						} else if (result.type === 'failure') {
							toast.error('Failed to save settings');
						}
					};
				}}
			>
				<div class="space-y-lg">
					<div>
						<label for="dailyGoal" class="block text-sm font-medium text-primary mb-sm">
							Daily review goal
						</label>
						<select
							id="dailyGoal"
							name="dailyReviewGoal"
							class="input"
							value={data.profile?.dailyReviewGoal ?? 20}
						>
							<option value="10">10 cards</option>
							<option value="20">20 cards</option>
							<option value="30">30 cards</option>
							<option value="50">50 cards</option>
							<option value="100">100 cards</option>
						</select>
					</div>

					<div>
						<p class="text-sm font-medium text-primary mb-sm">Question types</p>
						<div class="space-y-sm">
							<label class="flex items-center gap-md">
								<input
									type="checkbox"
									name="questionTypes"
									value="cloze"
									checked={data.profile?.preferredQuestionTypes?.includes('cloze')}
									class="w-5 h-5 rounded accent-accent"
								/>
								<span>Cloze deletions</span>
							</label>
							<label class="flex items-center gap-md">
								<input
									type="checkbox"
									name="questionTypes"
									value="definition"
									checked={data.profile?.preferredQuestionTypes?.includes('definition')}
									class="w-5 h-5 rounded accent-accent"
								/>
								<span>Definition questions</span>
							</label>
							<label class="flex items-center gap-md">
								<input
									type="checkbox"
									name="questionTypes"
									value="conceptual"
									checked={data.profile?.preferredQuestionTypes?.includes('conceptual')}
									class="w-5 h-5 rounded accent-accent"
								/>
								<span>Conceptual questions</span>
							</label>
						</div>
					</div>

					<Button type="submit" size="sm">Save Settings</Button>
				</div>
			</form>
		</Card>
	</section>

	<!-- Danger Zone -->
	<section>
		<h2 class="font-heading text-lg text-error mb-md">Danger Zone</h2>
		<Card padding="lg" class="border-error/20">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium text-primary">Delete Account</p>
					<p class="text-sm text-secondary">Permanently delete your account and all data</p>
				</div>
				<Button variant="danger" size="sm" onclick={() => (showDeleteConfirm = true)}>
					Delete Account
				</Button>
			</div>
		</Card>
	</section>
</div>

<!-- Add API Key Modal -->
<Modal bind:open={showApiKeyModal} title="Add API Key">
	<form
		id="apiKeyForm"
		method="POST"
		action="?/saveKey"
		use:enhance={() => {
			savingKey = true;
			return async ({ result }) => {
				savingKey = false;
				if (result.type === 'success') {
					showApiKeyModal = false;
					apiKey = '';
					toast.success('API key saved!');
				}
			};
		}}
	>
		<input type="hidden" name="provider" value={apiKeyProvider} />

		<div class="space-y-lg">
			<p class="text-secondary">
				Add your {apiKeyProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API key. Your key is encrypted
				and never stored in plain text.
			</p>

			<Input
				label="API Key"
				name="apiKey"
				type="password"
				bind:value={apiKey}
				placeholder={apiKeyProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
				required
			/>

			<div>
				<label for="model" class="block text-sm font-medium text-primary mb-sm"> Model </label>
				<select id="model" name="model" bind:value={apiModel} class="input">
					{#each models as model}
						<option value={model}>{model}</option>
					{/each}
				</select>
			</div>

			<Button
				type="button"
				variant="secondary"
				size="sm"
				onclick={testApiKey}
				loading={testingKey}
				disabled={!apiKey}
			>
				Test Connection
			</Button>
		</div>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-md">
			<Button variant="secondary" onclick={() => (showApiKeyModal = false)}>Cancel</Button>
			<Button type="submit" form="apiKeyForm" loading={savingKey} disabled={!apiKey}>
				Save Key
			</Button>
		</div>
	{/snippet}
</Modal>

<!-- Delete Confirmation Modal -->
<Modal bind:open={showDeleteConfirm} title="Delete Account">
	<p class="text-secondary">
		Are you sure you want to delete your account? This action cannot be undone. All your
		collections, highlights, and cards will be permanently deleted.
	</p>
	<form id="deleteAccountForm" method="POST" action="?/deleteAccount"></form>

	{#snippet footer()}
		<div class="flex justify-end gap-md">
			<Button variant="secondary" onclick={() => (showDeleteConfirm = false)}>Cancel</Button>
			<Button type="submit" form="deleteAccountForm" variant="danger">
				Yes, Delete My Account
			</Button>
		</div>
	{/snippet}
</Modal>
