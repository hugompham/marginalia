import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface HighlightInput {
	text: string;
	note?: string;
	chapter?: string;
}

interface RequestBody {
	title: string;
	author?: string;
	sourceType: 'manual' | 'kindle' | 'web' | 'web_article' | 'pdf' | 'epub';
	sourceUrl?: string;
	highlights: HighlightInput[];
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession();

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body: RequestBody = await request.json();
		const { title, author, sourceType, sourceUrl, highlights } = body;

		if (!title || !highlights?.length) {
			return json({ error: 'Title and highlights are required' }, { status: 400 });
		}

		// Map source types to database values
		const dbSourceType = sourceType === 'web' ? 'web_article' : (sourceType || 'manual');

		// Create collection
		const { data: collection, error: collectionError } = await locals.supabase
			.from('collections')
			.insert({
				user_id: session.user.id,
				title,
				author: author || null,
				source_type: dbSourceType,
				source_url: sourceUrl || null,
				highlight_count: highlights.length,
				card_count: 0
			})
			.select()
			.single();

		if (collectionError || !collection) {
			console.error('Failed to create collection:', collectionError);
			return json({ error: 'Failed to create collection' }, { status: 500 });
		}

		// Create highlights
		const highlightsToInsert = highlights.map((h) => ({
			user_id: session.user.id,
			collection_id: collection.id,
			text: h.text,
			note: h.note || null,
			chapter: h.chapter || null,
			has_cards: false,
			is_archived: false
		}));

		const { error: highlightsError } = await locals.supabase
			.from('highlights')
			.insert(highlightsToInsert);

		if (highlightsError) {
			console.error('Failed to create highlights:', highlightsError);
			// Try to clean up the collection
			await locals.supabase.from('collections').delete().eq('id', collection.id);
			return json({ error: 'Failed to create highlights' }, { status: 500 });
		}

		return json({
			collection: {
				id: collection.id,
				title: collection.title,
				author: collection.author,
				highlightCount: collection.highlight_count
			}
		});
	} catch (error) {
		console.error('Collection creation error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to create collection' },
			{ status: 500 }
		);
	}
};
