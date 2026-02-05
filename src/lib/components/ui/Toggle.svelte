<script lang="ts">
	interface Props {
		checked: boolean;
		onchange: (checked: boolean) => void;
		label?: string;
		disabled?: boolean;
	}

	let { checked = $bindable(false), onchange, label, disabled = false }: Props = $props();

	function handleToggle() {
		if (disabled) return;
		const newValue = !checked;
		onchange(newValue);
	}
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={label}
	onclick={handleToggle}
	disabled={disabled}
	class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
		{checked ? 'bg-accent' : 'bg-border-strong'}
		{disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
		focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
>
	<span
		class="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out
			{checked ? 'translate-x-6' : 'translate-x-1'}"
	></span>
</button>
