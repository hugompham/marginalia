<script lang="ts">
	interface Props {
		current: number;
		total: number;
	}

	let { current, total }: Props = $props();

	const percent = $derived((Math.max(0, current - 1) / total) * 100);
</script>

<div class="space-y-sm">
	<div class="flex items-center justify-between text-sm">
		<span class="text-secondary">{current} of {total}</span>
		<span class="text-tertiary">{Math.round(percent)}%</span>
	</div>
	<div class="h-1 bg-subtle rounded-full overflow-hidden">
		<div
			class="h-full bg-accent transition-all duration-normal ease-default"
			style="width: {percent}%"
		></div>
	</div>
</div>
