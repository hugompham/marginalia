// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session, User } from '@supabase/supabase-js';
import type { SupabaseClient } from '$lib/supabase';

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			supabase: SupabaseClient;
			getSession: () => Promise<Session | null>;
			getUser: () => Promise<User | null>;
		}
		interface PageData {
			session: Session | null;
		}
		// interface PageState {}
		interface Platform {
			env?: {
				// Cloudflare bindings
			};
		}
	}
}

export {};
