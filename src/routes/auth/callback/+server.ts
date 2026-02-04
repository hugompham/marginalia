import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			// Successfully authenticated, redirect to intended page
			throw redirect(303, `/${next.slice(1)}`);
		}
	}

	// Handle token_hash for magic link (email confirmation flow)
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type');

	if (tokenHash && type) {
		const { error } = await locals.supabase.auth.verifyOtp({
			token_hash: tokenHash,
			type: type as 'email' | 'recovery' | 'invite' | 'magiclink'
		});

		if (!error) {
			throw redirect(303, `/${next.slice(1)}`);
		}
	}

	// Authentication failed, redirect to error page
	throw redirect(303, '/auth/error');
};
