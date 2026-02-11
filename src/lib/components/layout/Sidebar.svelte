<script lang="ts">
	import { page } from '$app/stores';
	import { Home, BookOpen, Network, Plus, Settings, Brain, PanelLeftClose } from 'lucide-svelte';
	import {
		sidebarCollapsed,
		toggleSidebar,
		SIDEBAR_EXPANDED,
		SIDEBAR_COLLAPSED
	} from '$lib/stores/sidebar';
	import ProfileDropdown from './ProfileDropdown.svelte';
	import type { Profile } from '$lib/types';

	interface Props {
		userEmail?: string;
		profile?: Profile | null;
		onviewprofile?: () => void;
		onaccountsettings?: () => void;
	}

	let {
		userEmail = 'User',
		profile = null,
		onviewprofile = () => {},
		onaccountsettings = () => {}
	}: Props = $props();

	const collapsed = $derived($sidebarCollapsed);
	const sidebarWidth = $derived(collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED);

	const navItems = [
		{ href: '/', label: 'Home', icon: 'home' },
		{ href: '/library', label: 'Library', icon: 'library' },
		{ href: '/mindmap', label: 'Mindmap', icon: 'mindmap' },
		{ href: '/review', label: 'Review', icon: 'review' },
		{ href: '/import', label: 'Import', icon: 'import' },
		{ href: '/settings', label: 'Settings', icon: 'settings' }
	] as const;

	function isActive(href: string, pathname: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}
</script>

<aside
	class="hidden desktop:flex flex-col h-screen bg-surface border-r border-border fixed left-0 top-0 transition-[width] duration-normal ease-ease-default overflow-hidden"
	style="width: {sidebarWidth}px"
>
	<!-- Logo + Collapse toggle -->
	<div class="py-lg border-b border-border {collapsed ? 'px-0' : 'px-xl'}">
		<div class="flex items-center {collapsed ? 'justify-center' : 'justify-between'}">
			<a
				href="/"
				class="flex items-center {collapsed ? 'justify-center' : 'gap-md'}"
				title={collapsed ? 'Marginalia' : undefined}
			>
				<img src="/icons/icon-192.png" alt="" class="w-8 h-8 rounded-button shrink-0" />
				{#if !collapsed}
					<span class="font-heading text-xl text-primary whitespace-nowrap">Marginalia</span>
				{/if}
			</a>
			{#if !collapsed}
				<button
					type="button"
					onclick={toggleSidebar}
					class="p-xs rounded-button text-tertiary hover:text-primary hover:bg-subtle transition-colors"
					aria-label="Collapse sidebar"
					title="Collapse sidebar"
				>
					<PanelLeftClose size={18} />
				</button>
			{/if}
		</div>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 py-lg {collapsed ? 'px-sm' : 'px-md'}">
		<ul class="space-y-xs">
			{#each navItems as item}
				{@const active = isActive(item.href, $page.url.pathname)}
				<li>
					<a
						href={item.href}
						class="flex items-center rounded-button transition-colors
							{collapsed ? 'justify-center p-sm' : 'gap-md px-md py-sm'}
							{active ? 'bg-accent/10 text-accent' : 'text-secondary hover:text-primary hover:bg-subtle'}"
						aria-current={active ? 'page' : undefined}
						title={collapsed ? item.label : undefined}
					>
						<span class="shrink-0">
							{#if item.icon === 'home'}
								<Home size={20} />
							{:else if item.icon === 'library'}
								<BookOpen size={20} />
							{:else if item.icon === 'mindmap'}
								<Network size={20} />
							{:else if item.icon === 'import'}
								<Plus size={20} />
							{:else if item.icon === 'review'}
								<Brain size={20} />
							{:else if item.icon === 'settings'}
								<Settings size={20} />
							{/if}
						</span>
						{#if !collapsed}
							<span class="font-medium whitespace-nowrap">{item.label}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- Profile dropdown -->
	<div class="border-t border-border py-md {collapsed ? 'px-sm' : 'px-md'}">
		<ProfileDropdown {profile} {userEmail} {collapsed} {onviewprofile} {onaccountsettings} />
	</div>
</aside>
