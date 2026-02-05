import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	depends('supabase:auth');

	const session = await locals.getSession();

	// Fetch user theme preference if logged in
	let theme: 'light' | 'dark' = 'light';
	if (session) {
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('theme')
			.eq('id', session.user.id)
			.single();

		theme = (profile?.theme as 'light' | 'dark') ?? 'light';
	}

	return {
		session,
		theme
	};
};
