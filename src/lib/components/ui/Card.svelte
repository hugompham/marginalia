<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		padding?: 'none' | 'sm' | 'md' | 'lg';
		hover?: boolean;
		children: Snippet;
	}

	let {
		padding = 'md',
		hover = true,
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	const paddingStyles = {
		none: '',
		sm: 'p-sm',
		md: 'p-lg',
		lg: 'p-xl'
	};
</script>

<div
	class="card {paddingStyles[padding]} {hover ? 'hover:shadow-card-hover' : ''} {className}"
	{...restProps}
>
	{@render children()}
</div>
