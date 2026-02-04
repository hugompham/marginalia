import { createSupabaseClient } from '$lib/supabase';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, fetch, depends }) => {
	depends('supabase:auth');

	const supabase = createSupabaseClient(fetch);

	return {
		supabase,
		session: data.session
	};
};
