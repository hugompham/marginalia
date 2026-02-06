<script lang="ts">
	import { page } from '$app/stores';
	import {
		Home,
		BookOpen,
		Network,
		Plus,
		Settings,
		Brain,
		PanelLeftClose,
		PanelLeftOpen
	} from 'lucide-svelte';
	import {
		sidebarCollapsed,
		toggleSidebar,
		SIDEBAR_EXPANDED,
		SIDEBAR_COLLAPSED
	} from '$lib/stores/sidebar';

	interface Props {
		userEmail?: string;
	}

	let { userEmail = 'User' }: Props = $props();

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

	const initial = $derived(userEmail[0]?.toUpperCase() || 'U');
</script>

<aside
	class="hidden desktop:flex flex-col h-screen bg-surface border-r border-border fixed left-0 top-0 transition-[width] duration-normal ease-ease-default overflow-hidden"
	style="width: {sidebarWidth}px"
>
	<!-- Logo -->
	<div class="py-lg border-b border-border {collapsed ? 'px-0' : 'px-xl'}">
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

	<!-- Toggle button -->
	<div class="border-t border-border py-sm {collapsed ? 'px-sm' : 'px-md'}">
		<button
			type="button"
			onclick={toggleSidebar}
			class="flex items-center rounded-button transition-colors text-secondary hover:text-primary hover:bg-subtle
				{collapsed ? 'justify-center p-sm w-full' : 'gap-md px-md py-sm w-full'}"
			aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			<span class="shrink-0">
				{#if collapsed}
					<PanelLeftOpen size={20} />
				{:else}
					<PanelLeftClose size={20} />
				{/if}
			</span>
			{#if !collapsed}
				<span class="font-medium whitespace-nowrap">Collapse</span>
			{/if}
		</button>
	</div>

	<!-- User section -->
	<div class="border-t border-border py-lg {collapsed ? 'px-sm' : 'px-md'}">
		<div
			class="flex items-center py-sm text-sm text-secondary
				{collapsed ? 'justify-center' : 'gap-md px-md'}"
			title={collapsed ? userEmail : undefined}
		>
			<div class="w-8 h-8 rounded-full bg-subtle flex items-center justify-center shrink-0">
				<span class="text-xs font-medium">{initial}</span>
			</div>
			{#if !collapsed}
				<span class="truncate" title={userEmail}>{userEmail}</span>
			{/if}
		</div>
	</div>
</aside>
