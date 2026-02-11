<script lang="ts">
	import { Toggle } from '$components/ui';
	import { toast } from '$components/ui/Toast.svelte';
	import { theme, setTheme } from '$lib/stores/theme';
	import { beforeNavigate } from '$app/navigation';
	import { User, Settings, Moon, LogOut } from 'lucide-svelte';
	import type { Profile } from '$lib/types';

	interface Props {
		profile: Profile | null;
		userEmail: string;
		collapsed: boolean;
		onviewprofile: () => void;
		onaccountsettings: () => void;
	}

	let { profile, userEmail, collapsed, onviewprofile, onaccountsettings }: Props = $props();

	let showDropdown = $state(false);
	let triggerEl = $state<HTMLButtonElement | null>(null);
	let menuStyle = $state('');

	// Close dropdown on route change
	beforeNavigate(() => {
		showDropdown = false;
	});

	const displayName = $derived(
		profile?.firstName
			? `${profile.firstName}${profile.lastName ? ` ${profile.lastName}` : ''}`
			: profile?.displayName || userEmail
	);
	const initial = $derived(
		profile?.firstName?.[0]?.toUpperCase() || userEmail[0]?.toUpperCase() || 'U'
	);
	const isDark = $derived($theme === 'dark');

	function handleToggleDropdown() {
		if (!showDropdown && triggerEl) {
			// Position menu using fixed coordinates to escape overflow:hidden
			const rect = triggerEl.getBoundingClientRect();
			const menuWidth = 256; // w-64 = 16rem = 256px
			menuStyle = `position:fixed; left:${rect.left}px; bottom:${window.innerHeight - rect.top + 4}px; width:${menuWidth}px; z-index:50;`;
		}
		showDropdown = !showDropdown;
	}

	function closeDropdown() {
		showDropdown = false;
	}

	function handleViewProfile() {
		closeDropdown();
		onviewprofile();
	}

	function handleAccountSettings() {
		closeDropdown();
		onaccountsettings();
	}

	async function handleThemeToggle(checked: boolean) {
		const newTheme = checked ? 'dark' : 'light';
		const oldTheme = $theme;
		try {
			await setTheme(newTheme);
		} catch {
			theme.set(oldTheme);
			toast.error('Failed to update theme');
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeDropdown();
		}
	}
</script>

<!-- Trigger -->
<button
	type="button"
	bind:this={triggerEl}
	onclick={handleToggleDropdown}
	class="flex items-center w-full rounded-button py-sm text-sm text-secondary hover:text-primary hover:bg-subtle transition-colors
		{collapsed ? 'justify-center p-sm' : 'gap-md px-md'}"
	aria-expanded={showDropdown}
	aria-haspopup="menu"
	title={collapsed ? displayName : undefined}
>
	{#if profile?.avatarUrl}
		<img
			src={profile.avatarUrl}
			alt=""
			class="w-8 h-8 rounded-full object-cover shrink-0"
		/>
	{:else}
		<div class="w-8 h-8 rounded-full bg-subtle flex items-center justify-center shrink-0">
			<span class="text-xs font-medium">{initial}</span>
		</div>
	{/if}
	{#if !collapsed}
		<span class="truncate text-left flex-1">{displayName}</span>
	{/if}
</button>

<!-- Dropdown (fixed position to escape sidebar overflow:hidden) -->
{#if showDropdown}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-40" onclick={closeDropdown}></div>

	<!-- Menu -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="bg-surface border border-border rounded-card shadow-xl overflow-hidden animate-in"
		style={menuStyle}
		role="menu"
		tabindex="-1"
		onkeydown={handleKeydown}
	>
		<!-- User info header -->
		<div class="px-lg py-md border-b border-border">
			<p class="text-sm font-medium text-primary truncate">{displayName}</p>
			<p class="text-xs text-tertiary truncate">{userEmail}</p>
		</div>

		<!-- Menu items -->
		<div class="py-xs">
			<button
				type="button"
				class="flex items-center gap-md w-full px-lg py-sm text-sm text-secondary hover:text-primary hover:bg-subtle transition-colors"
				role="menuitem"
				onclick={handleViewProfile}
			>
				<User size={16} />
				View Profile
			</button>

			<button
				type="button"
				class="flex items-center gap-md w-full px-lg py-sm text-sm text-secondary hover:text-primary hover:bg-subtle transition-colors"
				role="menuitem"
				onclick={handleAccountSettings}
			>
				<Settings size={16} />
				Account Settings
			</button>

			<div
				class="flex items-center justify-between px-lg py-sm text-sm text-secondary"
				role="menuitem"
			>
				<span class="flex items-center gap-md">
					<Moon size={16} />
					Dark Mode
				</span>
				<Toggle checked={isDark} onchange={handleThemeToggle} />
			</div>
		</div>

		<!-- Sign out -->
		<div class="border-t border-border py-xs">
			<form method="POST" action="/settings?/signout">
				<button
					type="submit"
					class="flex items-center gap-md w-full px-lg py-sm text-sm text-secondary hover:text-primary hover:bg-subtle transition-colors"
					role="menuitem"
				>
					<LogOut size={16} />
					Sign Out
				</button>
			</form>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-up-fade {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-in {
		animation: slide-up-fade 150ms ease-out;
	}
</style>
