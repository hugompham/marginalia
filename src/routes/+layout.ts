import { createSupabaseClient } from '$lib/supabase';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, fetch, depends }) => {
	depends('supabase:auth');
	depends('app:profile');

	const supabase = createSupabaseClient(fetch);

	return {
		supabase,
		session: data.session,
		profile: data.profile,
		apiKeys: data.apiKeys,
		theme: data.theme,
		sidebarCollapsed: data.sidebarCollapsed
	};
};
