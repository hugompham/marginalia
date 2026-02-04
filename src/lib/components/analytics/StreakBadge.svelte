<script lang="ts">
	import { Flame, Award, Zap } from 'lucide-svelte';

	interface Props {
		streak: number;
		size?: 'sm' | 'md' | 'lg';
	}

	let { streak, size = 'md' }: Props = $props();

	const sizes = {
		sm: {
			container: 'px-2 py-1 gap-1',
			icon: 14,
			text: 'text-sm'
		},
		md: {
			container: 'px-3 py-1.5 gap-1.5',
			icon: 16,
			text: 'text-base'
		},
		lg: {
			container: 'px-4 py-2 gap-2',
			icon: 20,
			text: 'text-lg'
		}
	};

	const s = $derived(sizes[size]);

	// Determine streak tier and styling
	const tier = $derived(() => {
		if (streak >= 30)
			return { color: 'text-amber-500 bg-amber-500/10', icon: 'award', label: 'Master' };
		if (streak >= 14)
			return { color: 'text-orange-500 bg-orange-500/10', icon: 'flame', label: 'Hot' };
		if (streak >= 7) return { color: 'text-red-500 bg-red-500/10', icon: 'flame', label: 'Warm' };
		if (streak >= 3) return { color: 'text-yellow-500 bg-yellow-500/10', icon: 'zap', label: '' };
		return { color: 'text-tertiary bg-subtle', icon: 'zap', label: '' };
	});

	const { color, icon, label } = $derived(tier());
</script>

{#if streak > 0}
	<div class="inline-flex items-center rounded-full {s.container} {color}">
		{#if icon === 'award'}
			<Award size={s.icon} />
		{:else if icon === 'flame'}
			<Flame size={s.icon} />
		{:else}
			<Zap size={s.icon} />
		{/if}
		<span class="font-semibold {s.text}">{streak}</span>
		{#if label}
			<span class="text-xs opacity-75">{label}</span>
		{/if}
	</div>
{/if}
