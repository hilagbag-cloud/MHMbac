import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const ALLOWED_ORIGINS = new Set([
  'https://bacpilot.site',
  'https://beta.bacpilot.site',
  'https://mhmbac.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
]);

function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://bacpilot.site';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=300',
    'Vary': 'Origin',
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'GET') return json(request, { error: 'Méthode non autorisée.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json(request, { error: 'Configuration serveur indisponible.' }, 500);

  const requestedLimit = Number(new URL(request.url).searchParams.get('limit') || '24');
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), 24) : 24;
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.rpc('list_public_beta_contributors', { p_limit: limit });
  if (error) return json(request, { error: 'Annuaire indisponible.' }, 500);

  const contributors = await Promise.all((Array.isArray(data) ? data : []).map(async (row) => {
    const photoPath = typeof row.photo_path === 'string' ? row.photo_path : null;
    let photoUrl: string | null = null;
    if (photoPath) {
      const signed = await admin.storage.from('beta-contributor-photos').createSignedUrl(photoPath, 60 * 30);
      photoUrl = signed.data?.signedUrl || null;
    }
    const publicationStatus = row.publication_status === 'published_profile' ? 'published_profile' : 'published_name';
    return {
      public_slug: publicationStatus === 'published_profile' && typeof row.public_slug === 'string' ? row.public_slug : null,
      publication_status: publicationStatus,
      public_name: String(row.public_name || ''),
      public_bio: row.public_bio ? String(row.public_bio) : null,
      focus_areas: Array.isArray(row.focus_areas) ? row.focus_areas.map(String) : [],
      photo_url: photoUrl,
      portfolio_url: row.portfolio_url ? String(row.portfolio_url) : null,
      linkedin_url: row.linkedin_url ? String(row.linkedin_url) : null,
      contribution_score: Number(row.contribution_score || 0),
      contribution_level: String(row.contribution_level || 'Découvreur bêta'),
    };
  }));

  return json(request, { contributors });
});
