<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		title: string;
		value: string | number;
		subtitle?: string;
		icon?: Component<{ size?: number; class?: string }>;
		trend?: 'up' | 'down' | 'neutral';
		trendValue?: string;
	}

	let { title, value, subtitle, icon: Icon, trend, trendValue }: Props = $props();

	const trendColors = {
		up: 'text-success',
		down: 'text-error',
		neutral: 'text-tertiary'
	};

	const trendIcons = {
		up: '↑',
		down: '↓',
		neutral: '→'
	};
</script>

<div class="bg-surface border border-canvas rounded-card p-lg">
	<div class="flex items-start justify-between mb-sm">
		<span class="text-sm text-secondary">{title}</span>
		{#if Icon}
			<Icon size={16} class="text-tertiary" />
		{/if}
	</div>

	<div class="flex items-baseline gap-sm">
		<span class="text-2xl font-heading text-primary">{value}</span>
		{#if trend && trendValue}
			<span class="text-sm {trendColors[trend]}">
				{trendIcons[trend]} {trendValue}
			</span>
		{/if}
	</div>

	{#if subtitle}
		<p class="text-xs text-tertiary mt-xs">{subtitle}</p>
	{/if}
</div>
