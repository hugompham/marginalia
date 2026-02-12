import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAuthenticatedSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await getAuthenticatedSession(locals);

	// If already completed onboarding, redirect to home
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	if ((profile as Record<string, unknown>)?.onboarding_completed) {
		throw redirect(303, '/');
	}

	// Pre-fill from OAuth provider metadata (e.g. Google)
	const meta = user.user_metadata ?? {};

	return {
		user,
		prefill: {
			firstName: (meta.given_name as string) ?? '',
			lastName: (meta.family_name as string) ?? '',
			avatarUrl: (meta.avatar_url as string) ?? ''
		}
	};
};

export const actions: Actions = {
	complete: async ({ request, locals }) => {
		const { user } = await getAuthenticatedSession(locals);

		const formData = await request.formData();
		const firstName = (formData.get('firstName') as string)?.trim();
		const lastName = (formData.get('lastName') as string)?.trim();
		const displayName = (formData.get('displayName') as string)?.trim();
		const themeChoice = formData.get('theme') as 'light' | 'dark';

		if (!firstName || firstName.length > 100) {
			return fail(400, { error: 'First name is required (max 100 characters)' });
		}
		if (lastName && lastName.length > 100) {
			return fail(400, { error: 'Last name is too long (max 100 characters)' });
		}

		// Cast needed: generated types lag behind migration (new columns)
		const { error } = await locals.supabase
			.from('profiles')
			.update({
				first_name: firstName,
				last_name: lastName || null,
				display_name: displayName || `${firstName}${lastName ? ` ${lastName}` : ''}`,
				theme: themeChoice || 'light',
				onboarding_completed: true
			} as Record<string, unknown>)
			.eq('id', user.id);

		if (error) {
			console.error('Onboarding update failed:', error);
			return fail(500, { error: 'Failed to save profile' });
		}

		throw redirect(303, '/');
	}
};
