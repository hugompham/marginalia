import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await requireAuth(locals);

	try {
		const body = await request.json();
		const {
			collectionId,
			questions,
			answers,
			totalQuestions,
			correctCount,
			scorePercent,
			durationMs,
			provider
		} = body;

		// Validate required fields
		if (!collectionId || typeof collectionId !== 'string') {
			return json({ error: 'Missing or invalid collectionId' }, { status: 400 });
		}

		if (!Array.isArray(questions) || questions.length === 0) {
			return json({ error: 'Missing or empty questions array' }, { status: 400 });
		}

		if (!Array.isArray(answers)) {
			return json({ error: 'Missing answers array' }, { status: 400 });
		}

		if (typeof totalQuestions !== 'number' || totalQuestions < 1) {
			return json({ error: 'Invalid totalQuestions' }, { status: 400 });
		}

		if (typeof correctCount !== 'number' || correctCount < 0) {
			return json({ error: 'Invalid correctCount' }, { status: 400 });
		}

		if (typeof scorePercent !== 'number' || scorePercent < 0 || scorePercent > 100) {
			return json({ error: 'Invalid scorePercent' }, { status: 400 });
		}

		if (typeof durationMs !== 'number' || durationMs < 0) {
			return json({ error: 'Invalid durationMs' }, { status: 400 });
		}

		if (!provider || typeof provider !== 'string') {
			return json({ error: 'Missing provider' }, { status: 400 });
		}

		// Insert quiz session
		const { data: row, error: insertError } = await locals.supabase
			.from('quiz_sessions')
			.insert({
				collection_id: collectionId,
				user_id: user.id,
				questions,
				answers,
				total_questions: totalQuestions,
				correct_count: correctCount,
				score_percent: scorePercent,
				duration_ms: durationMs,
				provider
			})
			.select('id')
			.single();

		if (insertError) {
			console.error('Failed to save quiz session:', insertError);
			return json({ error: 'Failed to save quiz session' }, { status: 500 });
		}

		return json({ id: row.id, success: true });
	} catch (error) {
		console.error('Quiz save error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to save quiz' },
			{ status: 500 }
		);
	}
};
