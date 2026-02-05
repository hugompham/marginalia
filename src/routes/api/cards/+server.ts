import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GeneratedQuestion } from '$lib/types';
import { requireAuth } from '$lib/server/auth';

interface RequestBody {
	questions: GeneratedQuestion[];
	collectionId: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await requireAuth(locals);

	const supabase = locals.supabase;

	try {
		const body: RequestBody = await request.json();
		const { questions, collectionId } = body;

		if (!questions?.length || !collectionId) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Verify collection belongs to user
		const { data: collection, error: collectionError } = await supabase
			.from('collections')
			.select('id')
			.eq('id', collectionId)
			.eq('user_id', user.id)
			.single();

		if (collectionError || !collection) {
			return json({ error: 'Collection not found' }, { status: 404 });
		}

		// Verify highlights belong to the user and collection
		const highlightIds = Array.from(new Set(questions.map((q) => q.highlightId)));
		const { data: highlights, error: highlightsError } = await supabase
			.from('highlights')
			.select('id')
			.eq('user_id', user.id)
			.eq('collection_id', collectionId)
			.in('id', highlightIds);

		if (highlightsError || !highlights || highlights.length !== highlightIds.length) {
			return json({ error: 'One or more highlights are invalid' }, { status: 400 });
		}

		// Create cards from approved questions
		const cardsToInsert = questions.map((q) => ({
			user_id: user.id,
			highlight_id: q.highlightId,
			question: q.question,
			answer: q.answer,
			question_type: q.questionType,
			cloze_text: q.clozeText || null,
			is_ai_generated: true,
			ai_confidence: q.confidence,
			state: 'new',
			due: new Date().toISOString(),
			stability: 0,
			difficulty: 0,
			elapsed_days: 0,
			scheduled_days: 0,
			reps: 0,
			lapses: 0,
			last_review: null
		}));

		const { data: cards, error: insertError } = await supabase
			.from('cards')
			.insert(cardsToInsert)
			.select();

		if (insertError) {
			console.error('Failed to insert cards:', insertError);
			return json({ error: 'Failed to create cards' }, { status: 500 });
		}

		return json({
			success: true,
			cardsCreated: cards.length
		});
	} catch (error) {
		console.error('Card creation error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to create cards' },
			{ status: 500 }
		);
	}
};
