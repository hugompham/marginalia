import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { encrypt } from '$lib/utils/crypto';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	const user = await locals.getUser();

	if (!session || !user) {
		throw redirect(303, '/auth/login');
	}

	// Fetch profile
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	// Fetch API keys (only hints, not actual keys)
	const { data: apiKeys } = await locals.supabase
		.from('api_keys')
		.select('provider, model, is_active, key_hint')
		.eq('user_id', user.id);

	const apiKeyMap: Record<string, { model: string; keyHint: string } | null> = {
		openai: null,
		anthropic: null
	};

	apiKeys?.forEach((key) => {
		apiKeyMap[key.provider] = {
			model: key.model,
			keyHint: key.key_hint ?? '****'
		};
	});

	return {
		user,
		profile: profile
			? {
					dailyReviewGoal: profile.daily_review_goal,
					preferredQuestionTypes: profile.preferred_question_types,
					theme: profile.theme
				}
			: null,
		apiKeys: apiKeyMap
	};
};

export const actions: Actions = {
	saveKey: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) throw redirect(303, '/auth/login');

		const formData = await request.formData();
		const provider = formData.get('provider') as 'openai' | 'anthropic';
		const apiKey = formData.get('apiKey') as string;
		const model = formData.get('model') as string;

		if (!apiKey || !provider || !model) {
			return fail(400, { error: 'Missing required fields' });
		}

		// Encrypt the API key before storing
		let encryptedKey: string;
		try {
			encryptedKey = await encrypt(apiKey);
		} catch (err) {
			console.error('Encryption error:', err);
			return fail(500, { error: 'Failed to encrypt API key. Check ENCRYPTION_KEY environment variable.' });
		}

		// Store the last 4 characters as a hint for display
		const keyHint = apiKey.slice(-4);

		const { error } = await locals.supabase.from('api_keys').upsert(
			{
				user_id: session.user.id,
				provider,
				encrypted_key: encryptedKey,
				key_hint: keyHint,
				model,
				is_active: true
			},
			{ onConflict: 'user_id,provider' }
		);

		if (error) {
			console.error('Failed to save API key:', error);
			return fail(500, { error: 'Failed to save API key' });
		}

		return { success: true };
	},

	removeKey: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) throw redirect(303, '/auth/login');

		const formData = await request.formData();
		const provider = formData.get('provider') as string;

		const { error } = await locals.supabase
			.from('api_keys')
			.delete()
			.eq('user_id', session.user.id)
			.eq('provider', provider);

		if (error) {
			return fail(500, { error: 'Failed to remove API key' });
		}

		return { success: true };
	},

	updateSettings: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) throw redirect(303, '/auth/login');

		const formData = await request.formData();
		const dailyReviewGoal = parseInt(formData.get('dailyReviewGoal') as string) || 20;
		const questionTypes = formData.getAll('questionTypes') as string[];

		const { error } = await locals.supabase
			.from('profiles')
			.update({
				daily_review_goal: dailyReviewGoal,
				preferred_question_types: questionTypes.length > 0 ? questionTypes : ['cloze', 'definition']
			})
			.eq('id', session.user.id);

		if (error) {
			return fail(500, { error: 'Failed to update settings' });
		}

		return { success: true };
	},

	signout: async ({ locals }) => {
		await locals.supabase.auth.signOut();
		throw redirect(303, '/auth/login');
	},

	deleteAccount: async ({ locals }) => {
		const session = await locals.getSession();
		if (!session) throw redirect(303, '/auth/login');

		// Delete user data (cascade will handle related tables)
		await locals.supabase.from('profiles').delete().eq('id', session.user.id);

		// Sign out
		await locals.supabase.auth.signOut();

		// Note: In production, you'd also need to delete the auth.users entry
		// which requires admin privileges or a server-side function

		throw redirect(303, '/auth/login');
	}
};
