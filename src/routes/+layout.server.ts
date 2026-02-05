import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	depends('supabase:auth');

	// Validate JWT and get session
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	const {
		data: { session }
	} = await locals.supabase.auth.getSession();

	return {
		session,
		theme: locals.theme
	};
};
