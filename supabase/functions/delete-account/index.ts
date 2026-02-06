import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const authHeader = req.headers.get('Authorization') ?? '';
		const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
		const accessToken = tokenMatch?.[1];

		if (!accessToken) {
			return new Response(JSON.stringify({ error: 'Missing access token' }), {
				status: 401,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const supabaseUrl = Deno.env.get('SUPABASE_URL');
		const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
		const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

		if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
			return new Response(JSON.stringify({ error: 'Server configuration missing' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const userClient = createClient(supabaseUrl, supabaseAnonKey, {
			auth: { persistSession: false }
		});

		const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);

		if (userError || !userData?.user) {
			return new Response(JSON.stringify({ error: 'Invalid session' }), {
				status: 401,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const adminClient = createClient(supabaseUrl, serviceRoleKey, {
			auth: { persistSession: false }
		});

		const { error: deleteError } = await adminClient.auth.admin.deleteUser(userData.user.id);

		if (deleteError) {
			return new Response(JSON.stringify({ error: deleteError.message }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		return new Response(JSON.stringify({ success: true }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Delete account error:', error);
		return new Response(JSON.stringify({ error: error.message || 'Failed to delete account' }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});
