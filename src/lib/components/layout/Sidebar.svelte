<script lang="ts">
	import { page } from '$app/stores';
	import { Home, BookOpen, Network, Plus, Settings, Brain } from 'lucide-svelte';

	interface Props {
		userEmail?: string;
	}

	let { userEmail = 'User' }: Props = $props();

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

	// Get first letter of email for avatar
	const initial = $derived(userEmail[0]?.toUpperCase() || 'U');
</script>

<aside
	class="hidden desktop:flex flex-col w-64 h-screen bg-surface border-r border-border fixed left-0 top-0"
>
	<!-- Logo -->
	<div class="px-xl py-lg border-b border-border">
		<a href="/" class="flex items-center gap-md">
			<img src="/icons/icon-192.png" alt="" class="w-8 h-8 rounded-button" />
			<span class="font-heading text-xl text-primary">Marginalia</span>
		</a>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 px-md py-lg">
		<ul class="space-y-xs">
			{#each navItems as item}
				{@const active = isActive(item.href, $page.url.pathname)}
				<li>
					<a
						href={item.href}
						class="flex items-center gap-md px-md py-sm rounded-button transition-colors {active
							? 'bg-accent/10 text-accent'
							: 'text-secondary hover:text-primary hover:bg-subtle'}"
						aria-current={active ? 'page' : undefined}
					>
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
						<span class="font-medium">{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- User section -->
	<div class="px-md py-lg border-t border-border">
		<div class="flex items-center gap-md px-md py-sm text-sm text-secondary">
			<div class="w-8 h-8 rounded-full bg-subtle flex items-center justify-center">
				<span class="text-xs font-medium">{initial}</span>
			</div>
			<span class="truncate" title={userEmail}>{userEmail}</span>
		</div>
	</div>
</aside>
