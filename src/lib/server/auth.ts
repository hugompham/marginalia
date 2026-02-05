import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Verify JWT authentication for API routes
 * Returns the authenticated user or throws an error response
 *
 * Use this instead of getSession() for stronger JWT-based authentication
 */
export async function requireAuth(event: RequestEvent) {
	const {
		data: { user },
		error
	} = await event.locals.supabase.auth.getUser();

	if (error || !user) {
		throw json({ error: 'Unauthorized' }, { status: 401 });
	}

	return user;
}
