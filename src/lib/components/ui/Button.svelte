<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	type BaseProps = {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		loading?: boolean;
		fullWidth?: boolean;
		disabled?: boolean;
		children: Snippet;
		class?: string;
	};

	type ButtonProps = BaseProps & HTMLButtonAttributes & { href?: never };
	type AnchorProps = BaseProps & Omit<HTMLAnchorAttributes, 'disabled'> & { href: string };

	type Props = ButtonProps | AnchorProps;

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		fullWidth = false,
		disabled = false,
		href,
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	const baseStyles =
		'inline-flex items-center justify-center gap-2 font-medium rounded-button transition-all duration-fast focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

	const variants = {
		primary: 'bg-accent text-white hover:bg-accent-hover active:bg-accent-hover',
		secondary: 'bg-transparent border border-border text-primary hover:bg-subtle active:bg-subtle',
		ghost: 'bg-transparent text-secondary hover:bg-subtle hover:text-primary',
		danger: 'bg-error text-white hover:bg-error/90 active:bg-error/90'
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-5 py-3 text-base',
		lg: 'px-6 py-4 text-lg'
	};

	const classes = $derived(
		`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`
	);
</script>

{#if href}
	<a
		{href}
		class={classes}
		class:pointer-events-none={disabled || loading}
		class:opacity-50={disabled || loading}
		{...restProps}
	>
		{#if loading}
			<span
				class="inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"
			></span>
		{/if}
		{@render children()}
	</a>
{:else}
	<button class={classes} disabled={disabled || loading} {...restProps}>
		{#if loading}
			<span
				class="inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"
			></span>
		{/if}
		{@render children()}
	</button>
{/if}
