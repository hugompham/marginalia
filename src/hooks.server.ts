import { createSupabaseServerClient } from '$lib/supabase';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Create Supabase client for this request
	event.locals.supabase = createSupabaseServerClient(
		{
			getAll: () => event.cookies.getAll(),
			setAll: (cookies) => {
				cookies.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, {
						...options,
						path: '/'
					});
				});
			}
		},
		event.fetch
	);

	// Helper to get session
	event.locals.getSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		return session;
	};

	// Helper to get user (validates JWT)
	event.locals.getUser = async () => {
		const {
			data: { user }
		} = await event.locals.supabase.auth.getUser();
		return user;
	};

	// Protected routes - redirect to login if not authenticated
	const protectedRoutes = [
		'/library',
		'/import',
		'/review',
		'/settings',
		'/cards'
	];

	const isProtectedRoute = protectedRoutes.some(route =>
		event.url.pathname.startsWith(route)
	);

	const requiresAuth = isProtectedRoute || event.url.pathname === '/';

	// Check auth for protected routes and dashboard (validate JWT)
	if (requiresAuth) {
		const user = await event.locals.getUser();
		if (!user) {
			throw redirect(303, '/auth/login');
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
