import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from './types/database';

export function createSupabaseClient(fetch?: typeof globalThis.fetch) {
	return createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch
		}
	});
}

interface CookieToSet {
	name: string;
	value: string;
	options?: Record<string, unknown>;
}

export function createSupabaseServerClient(
	cookies: {
		getAll: () => Array<{ name: string; value: string }>;
		setAll: (
			cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>
		) => void;
	},
	fetch?: typeof globalThis.fetch
) {
	return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return cookies.getAll();
			},
			setAll(cookiesToSet: CookieToSet[]) {
				cookiesToSet.forEach(({ name, value, options }) => {
					cookies.setAll([{ name, value, options }]);
				});
			}
		},
		global: {
			fetch
		}
	});
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
