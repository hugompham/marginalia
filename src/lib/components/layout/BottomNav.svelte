<script lang="ts">
	import { page } from '$app/stores';
	import { Home, BookOpen, Plus, Settings, Brain } from 'lucide-svelte';

	const navItems = [
		{ href: '/', label: 'Home', icon: 'home' },
		{ href: '/library', label: 'Library', icon: 'library' },
		{ href: '/import', label: 'Import', icon: 'import' },
		{ href: '/review', label: 'Review', icon: 'review' },
		{ href: '/settings', label: 'Settings', icon: 'settings' }
	] as const;

	function isActive(href: string, pathname: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}
</script>

<nav
	class="desktop:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border safe-area-inset-bottom"
>
	<ul class="flex items-center justify-around px-sm py-sm">
		{#each navItems as item}
			{@const active = isActive(item.href, $page.url.pathname)}
			<li class="flex-1">
				<a
					href={item.href}
					class="flex flex-col items-center gap-xs py-xs transition-colors {active
						? 'text-accent'
						: 'text-tertiary hover:text-secondary'}"
					aria-current={active ? 'page' : undefined}
				>
					{#if item.icon === 'home'}
						<Home size={24} />
					{:else if item.icon === 'library'}
						<BookOpen size={24} />
					{:else if item.icon === 'import'}
						<Plus size={24} />
					{:else if item.icon === 'review'}
						<Brain size={24} />
					{:else if item.icon === 'settings'}
						<Settings size={24} />
					{/if}
					<span class="text-xs font-medium">{item.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
