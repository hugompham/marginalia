import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { mapProfile } from '$lib/utils/mappers';

export const load: LayoutServerLoad = async ({ locals, depends, url }) => {
	depends('supabase:auth');
	depends('app:profile');

	// Validate JWT and get session
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	const {
		data: { session }
	} = await locals.supabase.auth.getSession();

	// Fetch profile and API keys for authenticated users
	let profile = null;
	let apiKeys: Record<string, { model: string; keyHint: string } | null> = {
		openai: null,
		anthropic: null
	};

	if (user) {
		const [profileResult, apiKeysResult] = await Promise.all([
			locals.supabase.from('profiles').select('*').eq('id', user.id).single(),
			locals.supabase
				.from('api_keys')
				.select('provider, model, is_active, key_hint')
				.eq('user_id', user.id)
		]);

		if (profileResult.data) {
			profile = mapProfile(profileResult.data);
		}

		apiKeysResult.data?.forEach((key) => {
			apiKeys[key.provider] = {
				model: key.model,
				keyHint: key.key_hint ?? '****'
			};
		});

		// Onboarding guard: redirect to /onboarding if not completed
		const pathname = url.pathname;
		const isExemptRoute =
			pathname.startsWith('/auth') ||
			pathname.startsWith('/onboarding') ||
			pathname.startsWith('/api');

		// Only redirect if onboarding_completed is explicitly false (not undefined/null)
		// to avoid redirect loops if migration hasn't been applied yet
		if (profile && profile.onboardingCompleted === false && !isExemptRoute) {
			throw redirect(303, '/onboarding');
		}
	}

	return {
		session,
		profile,
		apiKeys,
		theme: locals.theme,
		sidebarCollapsed: locals.sidebarCollapsed
	};
};
