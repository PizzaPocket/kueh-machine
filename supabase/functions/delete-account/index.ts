// Deletes the CALLING user's own auth account — and, via the FK cascades
// set up in supabase/migrations/0001_init.sql, their profiles/
// ruth_profiles rows along with it (each has `on delete cascade` against
// auth.users). ruth_scores/liwei_scores rows survive with user_id set to
// null instead of being deleted (`on delete set null`), so past
// leaderboard entries stay up but stop being tied to the deleted account.
//
// This can't live in shared/account-widget.js alongside the rest of the
// account system — auth.admin.deleteUser() needs the service-role key,
// which must never reach client code, so it has to run server-side. The
// service-role key itself is never pasted into this file: Deno.env.get
// reads it from SUPABASE_SERVICE_ROLE_KEY, which the Edge Functions
// runtime injects automatically for every function in this project.
//
// Deploy (no CLI needed): Supabase dashboard → Edge Functions →
// New Function → name it exactly "delete-account" → paste this file's
// contents in → Deploy. shared/account-widget.js's deleteAccount() calls
// it by that name (client.functions.invoke('delete-account')).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Edge Functions live on a different origin (*.supabase.co) than every
// page that calls this one (localhost in dev, the real domain in prod) —
// every request is cross-origin, so the browser sends a CORS preflight
// OPTIONS request before the real POST. Every response below (including
// error ones) carries these headers, and OPTIONS gets its own short-
// circuit branch before the auth check — without both of those, the
// browser blocks the request before it ever reaches the logic that
// actually deletes anything, surfacing client-side as a generic
// "Failed to send a request to the Edge Function" with nothing to debug.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Verify the caller's own JWT (as themselves — the anon key plus their
  // own bearer token, exactly what a normal signed-in client request
  // looks like) before touching anything. Never trust a user id passed in
  // a request body — the only identity this ever acts on is whichever
  // token the caller actually holds, so no one can delete an account that
  // isn't their own by passing a different id.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await callerClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: 'Not authenticated' }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 500);
  }

  return jsonResponse({ ok: true }, 200);
});
