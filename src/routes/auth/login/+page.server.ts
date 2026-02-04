import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	// Redirect to dashboard if already logged in
	if (session) {
		throw redirect(303, '/');
	}

	return {};
};

export const actions: Actions = {
	magicLink: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return fail(400, { error: 'Email is required', email });
		}

		const { error } = await locals.supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			return fail(500, { error: error.message, email });
		}

		return { success: true, email };
	},

	google: async ({ locals, url }) => {
		const { data, error } = await locals.supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			return fail(500, { error: error.message });
		}

		if (data.url) {
			throw redirect(303, data.url);
		}

		return fail(500, { error: 'Could not initiate Google sign in' });
	}
};
