<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		color?: 'accent' | 'white' | 'current';
	}

	let { size = 'md', color = 'accent' }: Props = $props();

	const sizes = {
		sm: 'w-4 h-4 border-2',
		md: 'w-8 h-8 border-2',
		lg: 'w-12 h-12 border-3'
	};

	const colors = {
		accent: 'border-accent/30 border-t-accent',
		white: 'border-white/30 border-t-white',
		current: 'border-current/30 border-t-current'
	};
</script>

<div
	class="inline-block rounded-full animate-spin {sizes[size]} {colors[color]}"
	role="status"
	aria-label="Loading"
>
	<span class="sr-only">Loading...</span>
</div>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>
