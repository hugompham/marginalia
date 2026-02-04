<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'value'> {
		label?: string;
		error?: string;
		hint?: string;
		value?: string;
		prefix?: Snippet;
	}

	let {
		label,
		error,
		hint,
		id,
		value = $bindable(''),
		prefix,
		class: className = '',
		...restProps
	}: Props = $props();

	// Use a stable random ID generated once, but allow prop override
	const randomId = `input-${Math.random().toString(36).slice(2, 9)}`;
	const inputId = $derived(id ?? randomId);
</script>

<div class="w-full">
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-primary mb-sm">
			{label}
		</label>
	{/if}

	<div class="relative">
		{#if prefix}
			<div class="absolute left-md top-1/2 -translate-y-1/2">
				{@render prefix()}
			</div>
		{/if}
		<input
			id={inputId}
			class="input {error ? 'border-error focus:border-error focus:ring-error/20' : ''} {prefix ? 'pl-10' : ''} {className}"
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
			bind:value
			{...restProps}
		/>
	</div>

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
