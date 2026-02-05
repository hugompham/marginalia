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

	// Fetch user theme preference if logged in
	let theme: 'light' | 'dark' = 'light';
	if (user) {
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('theme')
			.eq('id', user.id)
			.single();

		theme = (profile?.theme as 'light' | 'dark') ?? 'light';
	}

	return {
		session,
		theme
	};
};
