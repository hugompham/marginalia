import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

interface RequestBody {
	theme: 'light' | 'dark';
}

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const user = await requireAuth(locals);

	const body: RequestBody = await request.json();
	const { theme } = body;

	if (!theme || (theme !== 'light' && theme !== 'dark')) {
		return json({ error: 'Invalid theme value' }, { status: 400 });
	}

	const { error } = await locals.supabase.from('profiles').update({ theme }).eq('id', user.id);

	if (error) {
		console.error('Failed to update theme:', error);
		return json({ error: 'Failed to update theme' }, { status: 500 });
	}

	return json({ success: true, theme });
};
