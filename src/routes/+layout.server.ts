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

	// Fetch profile for authenticated users
	let profile = null;
	if (user) {
		const { data: profileData } = await locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		if (profileData) {
			profile = mapProfile(profileData);
		}

		// Onboarding guard: redirect to /onboarding if not completed
		const pathname = url.pathname;
		const isExemptRoute =
			pathname.startsWith('/auth') ||
			pathname.startsWith('/onboarding') ||
			pathname.startsWith('/api');

		if (profile && !profile.onboardingCompleted && !isExemptRoute) {
			throw redirect(303, '/onboarding');
		}
	}

	return {
		session,
		profile,
		theme: locals.theme,
		sidebarCollapsed: locals.sidebarCollapsed
	};
};
