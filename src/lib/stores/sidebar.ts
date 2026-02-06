import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const SIDEBAR_EXPANDED = 256;
export const SIDEBAR_COLLAPSED = 64;

export const sidebarCollapsed = writable<boolean>(false);

if (browser) {
	sidebarCollapsed.subscribe((value) => {
		document.cookie = `sidebar=${value ? 'collapsed' : 'expanded'};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
	});
}

export function toggleSidebar() {
	sidebarCollapsed.update((v) => !v);
}
