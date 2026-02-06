import { json, redirect } from '@sveltejs/kit';

/**
 * Verify JWT authentication for API routes
 * Returns the authenticated user or throws an error response
 *
 * Use this instead of getSession() for stronger JWT-based authentication
 */
export async function requireAuth(locals: App.Locals) {
	const {
		data: { user },
		error
	} = await locals.supabase.auth.getUser();

	if (error || !user) {
		throw json({ error: 'Unauthorized' }, { status: 401 });
	}

	return user;
}

/**
 * Get authenticated session for page loads
 * Uses getUser() to verify JWT, then returns both user and session
 *
 * @param locals - Request locals with Supabase client
 * @param redirectTo - Optional path to redirect to if not authenticated
 * @returns Object with user and session, or throws redirect
 */
export async function getAuthenticatedSession(locals: App.Locals, redirectTo = '/auth/login') {
	// Verify JWT authentication
	const {
		data: { user },
		error: userError
	} = await locals.supabase.auth.getUser();

	if (userError || !user) {
		throw redirect(303, redirectTo);
	}

	// Get session (already validated above)
	const {
		data: { session }
	} = await locals.supabase.auth.getSession();

	return { user, session };
}
