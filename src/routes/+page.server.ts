import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	if (!session) {
		throw redirect(303, '/auth/login');
	}

	const userId = session.user.id;

	// Fetch dashboard stats
	const [
		{ count: dueToday },
		{ count: reviewedToday },
		{ count: totalCards },
		{ data: streak },
		{ data: recentCollections },
		{ data: weeklyReviews },
		{ data: profile },
		{ data: todayReviews }
	] = await Promise.all([
		// Due cards count
		locals.supabase
			.from('cards')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId)
			.eq('is_suspended', false)
			.lte('due', new Date().toISOString()),

		// Today's review count
		locals.supabase
			.from('reviews')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId)
			.gte('reviewed_at', new Date().toISOString().split('T')[0]),

		// Total cards
		locals.supabase
			.from('cards')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId)
			.eq('is_suspended', false),

		// Streak (use RPC function)
		locals.supabase.rpc('get_user_streak', { p_user_id: userId }),

		// Recent collections
		locals.supabase
			.from('collections')
			.select('id, title, author, highlight_count, card_count, updated_at')
			.eq('user_id', userId)
			.order('updated_at', { ascending: false })
			.limit(3),

		// Weekly reviews for chart
		locals.supabase
			.from('reviews')
			.select('reviewed_at')
			.eq('user_id', userId)
			.gte('reviewed_at', getWeekStart().toISOString()),

		// User profile for daily goal
		locals.supabase
			.from('profiles')
			.select('daily_review_goal')
			.eq('id', userId)
			.single(),

		// Today's reviews with ratings (for retention calculation)
		locals.supabase
			.from('reviews')
			.select('rating')
			.eq('user_id', userId)
			.gte('reviewed_at', new Date().toISOString().split('T')[0])
	]);

	// Process weekly data
	const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
	const weeklyData = weekDays.map((label, index) => {
		const date = new Date(getWeekStart());
		date.setDate(date.getDate() + index);
		const dateStr = date.toISOString().split('T')[0];

		const count =
			weeklyReviews?.filter((r) => r.reviewed_at?.startsWith(dateStr)).length ?? 0;

		return { label, count, date: dateStr };
	});

	const weeklyTotal = weeklyReviews?.length ?? 0;
	const dailyGoal = profile?.daily_review_goal ?? 20;

	// Calculate retention rate (% of cards rated Good or Easy)
	let retentionRate = 0;
	if (todayReviews && todayReviews.length > 0) {
		const successfulReviews = todayReviews.filter(
			(r) => r.rating === 'good' || r.rating === 'easy'
		).length;
		retentionRate = Math.round((successfulReviews / todayReviews.length) * 100);
	}

	return {
		stats: {
			dueToday: dueToday ?? 0,
			reviewedToday: reviewedToday ?? 0,
			totalCards: totalCards ?? 0,
			streak: streak ?? 0,
			retentionRate
		},
		recentCollections: (recentCollections ?? []).map((c) => ({
			id: c.id,
			title: c.title,
			author: c.author,
			highlightCount: c.highlight_count,
			cardCount: c.card_count
		})),
		weeklyData,
		weeklyTotal,
		dailyGoal
	};
};

function getWeekStart(): Date {
	const now = new Date();
	const day = now.getDay();
	const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
	const monday = new Date(now.setDate(diff));
	monday.setHours(0, 0, 0, 0);
	return monday;
}
