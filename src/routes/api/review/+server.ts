import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processReview } from '$lib/services/spaced-repetition/fsrs';
import type { Card, CardState, Rating } from '$lib/types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession();

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { cardId, rating, stabilityBefore, difficultyBefore, stateBefore, durationMs } = body as {
		cardId: string;
		rating: Rating;
		stabilityBefore: number;
		difficultyBefore: number;
		stateBefore: CardState;
		durationMs?: number | null;
	};

	if (!cardId || !rating) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	// Fetch the card
	const { data: card, error: fetchError } = await locals.supabase
		.from('cards')
		.select('*')
		.eq('id', cardId)
		.eq('user_id', session.user.id)
		.single();

	if (fetchError || !card) {
		return json({ error: 'Card not found' }, { status: 404 });
	}

	// Process with FSRS
	const fullCard: Card = {
		id: card.id,
		highlightId: card.highlight_id,
		userId: card.user_id,
		questionType: card.question_type as Card['questionType'],
		question: card.question,
		answer: card.answer,
		clozeText: card.cloze_text,
		isAiGenerated: card.is_ai_generated,
		aiConfidence: card.ai_confidence,
		stability: parseFloat(card.stability),
		difficulty: parseFloat(card.difficulty),
		elapsedDays: card.elapsed_days,
		scheduledDays: card.scheduled_days,
		reps: card.reps,
		lapses: card.lapses,
		state: card.state as CardState,
		lastReview: card.last_review ? new Date(card.last_review) : null,
		due: new Date(card.due),
		isSuspended: card.is_suspended,
		createdAt: new Date(card.created_at),
		updatedAt: new Date(card.updated_at)
	};

	const { updatedCard } = processReview(fullCard, rating);

	// Update the card
	const { error: updateError } = await locals.supabase
		.from('cards')
		.update({
			stability: updatedCard.stability,
			difficulty: updatedCard.difficulty,
			elapsed_days: updatedCard.elapsedDays,
			scheduled_days: updatedCard.scheduledDays,
			reps: updatedCard.reps,
			lapses: updatedCard.lapses,
			state: updatedCard.state,
			last_review: updatedCard.lastReview?.toISOString(),
			due: updatedCard.due?.toISOString()
		})
		.eq('id', cardId);

	if (updateError) {
		console.error('Failed to update card:', updateError);
		return json({ error: 'Failed to update card' }, { status: 500 });
	}

	// Create review record
	const { error: reviewError } = await locals.supabase.from('reviews').insert({
		card_id: cardId,
		user_id: session.user.id,
		rating,
		stability_before: stabilityBefore,
		difficulty_before: difficultyBefore,
		state_before: stateBefore,
		duration_ms: durationMs ?? null
	});

	if (reviewError) {
		console.error('Failed to create review record:', reviewError);
		// Don't fail the request, the card was updated
	}

	return json({ success: true, updatedCard });
};
