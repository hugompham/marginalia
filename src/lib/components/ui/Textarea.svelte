<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLTextareaAttributes, 'value'> {
		label?: string;
		error?: string;
		hint?: string;
		value?: string;
	}

	let {
		label,
		error,
		hint,
		id,
		value = $bindable(''),
		class: className = '',
		...restProps
	}: Props = $props();

	// Use a stable random ID generated once, but allow prop override
	const randomId = `textarea-${Math.random().toString(36).slice(2, 9)}`;
	const inputId = $derived(id ?? randomId);
</script>

<div class="w-full">
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-primary mb-sm">
			{label}
		</label>
	{/if}

	<textarea
		id={inputId}
		class="input min-h-[120px] resize-y {error ? 'border-error focus:border-error focus:ring-error/20' : ''} {className}"
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
		bind:value
		{...restProps}
	></textarea>

	{#if error}
		<p id="{inputId}-error" class="mt-sm text-sm text-error">
			{error}
		</p>
	{:else if hint}
		<p id="{inputId}-hint" class="mt-sm text-sm text-tertiary">
			{hint}
		</p>
	{/if}
</div>
