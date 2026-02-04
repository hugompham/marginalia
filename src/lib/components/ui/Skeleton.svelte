<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
		class?: string;
	}

	let {
		width = '100%',
		height = '1rem',
		rounded = 'md',
		class: className = ''
	}: Props = $props();

	const roundedClasses = {
		none: 'rounded-none',
		sm: 'rounded-sm',
		md: 'rounded-md',
		lg: 'rounded-lg',
		full: 'rounded-full'
	};
</script>

<div
	class="animate-pulse bg-canvas {roundedClasses[rounded]} {className}"
	style="width: {width}; height: {height};"
	role="status"
	aria-label="Loading..."
></div>
