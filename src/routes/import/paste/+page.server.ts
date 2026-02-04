import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	if (!session) {
		throw redirect(303, '/auth/login');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = await locals.getSession();

		if (!session) {
			throw redirect(303, '/auth/login');
		}

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const author = (formData.get('author') as string) || null;
		const highlightsRaw = formData.get('highlights') as string;

		// Validation
		const errors: Record<string, string> = {};

		if (!title?.trim()) {
			errors.title = 'Title is required';
		}

		if (!highlightsRaw?.trim()) {
			errors.highlights = 'At least one highlight is required';
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		// Parse highlights
		const highlights = highlightsRaw
			.split(/\n\n+/)
			.map((h) => h.trim())
			.filter((h) => h.length > 0);

		if (highlights.length === 0) {
			return fail(400, {
				errors: { highlights: 'At least one highlight is required' }
			});
		}

		// Create collection
		const { data: collection, error: collectionError } = await locals.supabase
			.from('collections')
			.insert({
				user_id: session.user.id,
				title: title.trim(),
				author: author?.trim() || null,
				source_type: 'manual',
				highlight_count: 0, // Will be updated by trigger
				card_count: 0
			})
			.select('id')
			.single();

		if (collectionError || !collection) {
			console.error('Failed to create collection:', collectionError);
			return fail(500, { error: 'Failed to create collection' });
		}

		// Create highlights
		const highlightRecords = highlights.map((text) => ({
			collection_id: collection.id,
			user_id: session.user.id,
			text,
			has_cards: false,
			is_archived: false
		}));

		const { error: highlightsError } = await locals.supabase
			.from('highlights')
			.insert(highlightRecords);

		if (highlightsError) {
			console.error('Failed to create highlights:', highlightsError);
			// Cleanup: delete the collection
			await locals.supabase
				.from('collections')
				.delete()
				.eq('id', collection.id);
			return fail(500, { error: 'Failed to create highlights' });
		}

		// Redirect to the new collection
		throw redirect(303, `/library/${collection.id}`);
	}
};
