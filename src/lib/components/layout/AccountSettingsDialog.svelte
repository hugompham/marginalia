<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { Modal, Button, Input } from '$components/ui';
	import { toast } from '$components/ui/Toast.svelte';
	import { Key, Brain, Trash2 } from 'lucide-svelte';
	import type { Profile } from '$lib/types';

	interface ApiKeyInfo {
		model: string;
		keyHint: string;
	}

	interface Props {
		open: boolean;
		profile: Profile | null;
		apiKeys: Record<string, ApiKeyInfo | null>;
	}

	let { open = $bindable(false), profile, apiKeys }: Props = $props();

	// API key modal state
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

<Modal bind:open title="Account Settings" onclose={() => (open = false)}>
	<div class="space-y-xl divide-y divide-border [&>section]:pt-xl [&>section:first-of-type]:pt-0">
		<!-- AI Provider Section -->
		<section>
			<h3 class="font-heading text-base text-primary mb-md flex items-center gap-sm">
				<Key size={18} />
				AI Provider
			</h3>
			<div class="space-y-md">
				<!-- OpenAI -->
				<div class="flex items-center justify-between p-md bg-subtle/50 rounded-button">
					<div>
						<p class="text-sm font-medium text-primary">OpenAI</p>
						{#if apiKeys.openai}
							<p class="text-xs text-secondary">{apiKeys.openai.model}</p>
							<p class="text-xs text-tertiary">sk-...{apiKeys.openai.keyHint}</p>
						{:else}
							<p class="text-xs text-tertiary">Not configured</p>
						{/if}
					</div>
					<div class="flex items-center gap-sm">
						{#if apiKeys.openai}
							<span class="text-xs text-success bg-success/10 px-sm py-xs rounded">Active</span>
							<form method="POST" action="/settings?/removeKey">
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

				<!-- Anthropic -->
				<div class="flex items-center justify-between p-md bg-subtle/50 rounded-button">
					<div>
						<p class="text-sm font-medium text-primary">Anthropic (Claude)</p>
						{#if apiKeys.anthropic}
							<p class="text-xs text-secondary">{apiKeys.anthropic.model}</p>
							<p class="text-xs text-tertiary">sk-ant-...{apiKeys.anthropic.keyHint}</p>
						{:else}
							<p class="text-xs text-tertiary">Not configured</p>
						{/if}
					</div>
					<div class="flex items-center gap-sm">
						{#if apiKeys.anthropic}
							<span class="text-xs text-success bg-success/10 px-sm py-xs rounded">Active</span>
							<form method="POST" action="/settings?/removeKey">
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
			</div>
		</section>

		<!-- Review Settings -->
		<section>
			<h3 class="font-heading text-base text-primary mb-md flex items-center gap-sm">
				<Brain size={18} />
				Review Settings
			</h3>
			<form
				method="POST"
				action="/settings?/updateSettings"
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
						<label for="dialogDailyGoal" class="block text-sm font-medium text-primary mb-sm">
							Daily review goal
						</label>
						<select
							id="dialogDailyGoal"
							name="dailyReviewGoal"
							class="input"
							value={profile?.dailyReviewGoal ?? 20}
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
									checked={profile?.preferredQuestionTypes?.includes('cloze')}
									class="w-5 h-5 rounded accent-accent"
								/>
								<span class="text-sm">Cloze deletions</span>
							</label>
							<label class="flex items-center gap-md">
								<input
									type="checkbox"
									name="questionTypes"
									value="definition"
									checked={profile?.preferredQuestionTypes?.includes('definition')}
									class="w-5 h-5 rounded accent-accent"
								/>
								<span class="text-sm">Definition questions</span>
							</label>
							<label class="flex items-center gap-md">
								<input
									type="checkbox"
									name="questionTypes"
									value="conceptual"
									checked={profile?.preferredQuestionTypes?.includes('conceptual')}
									class="w-5 h-5 rounded accent-accent"
								/>
								<span class="text-sm">Conceptual questions</span>
							</label>
						</div>
					</div>

					<Button type="submit" size="sm">Save Settings</Button>
				</div>
			</form>
		</section>

		<!-- Danger Zone -->
		<section>
			<h3 class="font-heading text-base text-error mb-md">Danger Zone</h3>
			<div class="flex items-center justify-between p-md border border-error/20 rounded-button">
				<div>
					<p class="text-sm font-medium text-primary">Delete Account</p>
					<p class="text-xs text-secondary">Permanently delete your account and all data</p>
				</div>
				<Button variant="danger" size="sm" onclick={() => (showDeleteConfirm = true)}>
					Delete Account
				</Button>
			</div>
		</section>
	</div>
</Modal>

<!-- Add API Key Modal (nested) -->
<Modal bind:open={showApiKeyModal} title="Add API Key">
	<form
		id="dialogApiKeyForm"
		method="POST"
		action="/settings?/saveKey"
		use:enhance={() => {
			savingKey = true;
			return async ({ result }) => {
				savingKey = false;
				if (result.type === 'success') {
					showApiKeyModal = false;
					apiKey = '';
					await invalidate('app:profile');
					toast.success('API key saved!');
				}
			};
		}}
	>
		<input type="hidden" name="provider" value={apiKeyProvider} />

		<div class="space-y-lg">
			<p class="text-secondary text-sm">
				Add your {apiKeyProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API key. Your key is
				encrypted and never stored in plain text.
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
				<label for="dialogModel" class="block text-sm font-medium text-primary mb-sm">
					Model
				</label>
				<select id="dialogModel" name="model" bind:value={apiModel} class="input">
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
			<Button type="submit" form="dialogApiKeyForm" loading={savingKey} disabled={!apiKey}>
				Save Key
			</Button>
		</div>
	{/snippet}
</Modal>

<!-- Delete Confirmation Modal (nested) -->
<Modal bind:open={showDeleteConfirm} title="Delete Account">
	<p class="text-secondary">
		Are you sure you want to delete your account? This action cannot be undone. All your
		collections, highlights, and cards will be permanently deleted.
	</p>
	<form id="dialogDeleteForm" method="POST" action="/settings?/deleteAccount"></form>

	{#snippet footer()}
		<div class="flex justify-end gap-md">
			<Button variant="secondary" onclick={() => (showDeleteConfirm = false)}>Cancel</Button>
			<Button type="submit" form="dialogDeleteForm" variant="danger">
				Yes, Delete My Account
			</Button>
		</div>
	{/snippet}
</Modal>
