import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const theme = writable<'light' | 'dark'>('light');

// Apply theme to DOM and cookie when it changes (client-side only)
if (browser) {
	theme.subscribe((value) => {
		document.documentElement.setAttribute('data-theme', value);
		document.cookie = `theme=${value};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
	});
}

export async function setTheme(newTheme: 'light' | 'dark') {
	theme.set(newTheme);

	// Persist to database
	try {
		const response = await fetch('/api/theme', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ theme: newTheme })
		});

		if (!response.ok) {
			throw new Error('Failed to update theme');
		}
	} catch (error) {
		console.error('Failed to persist theme:', error);
		throw error;
	}
}
