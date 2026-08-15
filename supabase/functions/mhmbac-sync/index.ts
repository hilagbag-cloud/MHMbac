import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mhm-sync-token, x-mhm-sync-token-b64',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const numericFields = ['scholarships', 'aid', 'tb', 'b', 'ab', 'passable', 'total'] as const;
type NumericField = typeof numericFields[number];

type GaugeItem = {
  universityId: number;
  university: string;
  schoolId: number;
  school: string;
  programmeId: number;
  programme: string;
  scholarships: number;
  aid: number;
  tb: number;
  b: number;
  ab: number;
  passable: number;
  total: number;
  rank?: number | null;
  capacity?: number | null;
  applicants?: number | null;
  observedAt?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function cleanText(value: unknown, max = 240): string {
  return String(value ?? '').trim().slice(0, max);
}

function nonNegativeInteger(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function normalizeItem(raw: any): GaugeItem {
  const item: any = {
    universityId: nonNegativeInteger(raw?.universityId),
    university: cleanText(raw?.university),
    schoolId: nonNegativeInteger(raw?.schoolId),
    school: cleanText(raw?.school),
    programmeId: nonNegativeInteger(raw?.programmeId),
    programme: cleanText(raw?.programme),
  };
  for (const field of numericFields) item[field] = nonNegativeInteger(raw?.[field]);
  if (!item.universityId || !item.schoolId || !item.programmeId || !item.university || !item.school || !item.programme) {
    throw new Error('Identifiants ou libellés de filière invalides');
  }
  for (const field of numericFields) {
    if (item[field] === null) throw new Error(`Valeur invalide pour ${field}`);
  }
  for (const field of ['rank', 'capacity', 'applicants']) {
    const value = raw?.[field];
    item[field] = value === null || value === undefined || value === '' ? null : nonNegativeInteger(value);
    if (value !== null && value !== undefined && value !== '' && item[field] === null) throw new Error(`Valeur invalide pour ${field}`);
  }
  item.observedAt = typeof raw?.observedAt === 'string' && !Number.isNaN(Date.parse(raw.observedAt))
    ? new Date(raw.observedAt).toISOString()
    : new Date().toISOString();
  return item as GaugeItem;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function decodeBase64Url(value: string | null): string | null {
  if (!value || value.length > 4096 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const padding = '='.repeat((4 - (value.length % 4)) % 4);
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + padding);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ ok: false, error: 'Méthode non autorisée' }, 405);

  const expectedToken = Deno.env.get('MHM_SYNC_TOKEN');
  const encodedToken = request.headers.get('x-mhm-sync-token-b64');
  const receivedToken = encodedToken ? decodeBase64Url(encodedToken) : request.headers.get('x-mhm-sync-token');
  if (!expectedToken || !receivedToken || receivedToken !== expectedToken) {
    return json({ ok: false, error: 'Jeton de synchronisation invalide' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ ok: false, error: 'Configuration serveur incomplète' }, 500);

  let body: any;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'JSON invalide' }, 400); }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  if (body?.action === 'preflight') {
    const { error } = await admin.from('live_programmes').select('programme_id').limit(1);
    if (error) return json({ ok: false, error: 'Vérification serveur impossible' }, 500);
    return json({ ok: true, mode: 'preflight', message: 'Jeton validé et serveur prêt pour la collecte.', serverCheckedAt: new Date().toISOString() });
  }

  const batchId = cleanText(body?.batchId, 120);
  if (!batchId) return json({ ok: false, error: 'batchId obligatoire pour garantir l’idempotence' }, 400);
  const part = nonNegativeInteger(body?.part) ?? 0;
  const totalParts = nonNegativeInteger(body?.totalParts) ?? 1;
  const rawItems = Array.isArray(body?.items) ? body.items : [];
  if (rawItems.length === 0 || rawItems.length > 500) return json({ ok: false, error: 'Le relevé doit contenir entre 1 et 500 filières' }, 400);

  let items: GaugeItem[];
  try { items = rawItems.map(normalizeItem); } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Données invalides' }, 400);
  }

  const unique = new Map<number, GaugeItem>();
  for (const item of items) unique.set(item.programmeId, item);
  items = [...unique.values()];

  const programmeIds = items.map((item) => item.programmeId);
  const { data: previous, error: previousError } = await admin
    .from('live_programmes')
    .select('*')
    .in('programme_id', programmeIds);
  if (previousError) return json({ ok: false, error: previousError.message }, 500);
  const previousById = new Map<number, any>((previous ?? []).map((row: any) => [Number(row.programme_id), row]));

  const source = cleanText(body?.source || 'chrome_extension', 80);
  const observedAt = typeof body?.observedAt === 'string' && !Number.isNaN(Date.parse(body.observedAt))
    ? new Date(body.observedAt).toISOString() : new Date().toISOString();
  const alerts: any[] = [];
  const observations: any[] = [];
  const rows = [];
  const scoreVersion = 'v1';

  for (const item of items) {
    const before = previousById.get(item.programmeId);
    const comparable = Object.fromEntries(numericFields.map((field) => [field, item[field]]));
    const pressure = item.total > 0 ? Math.min(100, Math.round((item.passable / item.total) * 100)) : null;
    const scholarshipRate = item.total > 0 ? Math.min(100, Math.round((item.scholarships / item.total) * 100)) : null;
    const opportunity = pressure === null || scholarshipRate === null ? null : Math.round((100 - pressure) * 0.6 + scholarshipRate * 0.4);
    const confidence = item.total > 0 ? 'moyenne' : 'limitée';
    const score = { scoreVersion, opportunity, pressure, scholarshipRate, confidence, explanation: 'Indicateur fondé sur les jauges observées ; il ne garantit ni admission ni bourse.' };
    const snapshotHash = await sha256(JSON.stringify({ programmeId: item.programmeId, ...comparable, rank: item.rank, capacity: item.capacity, applicants: item.applicants }));
    observations.push({ programme_id: item.programmeId, snapshot_hash: snapshotHash, payload: { ...item, score }, observed_at: item.observedAt || observedAt, source });
    rows.push({
      university_id: item.universityId, university: item.university, school_id: item.schoolId, school: item.school,
      programme_id: item.programmeId, programme: item.programme, ...comparable,
      rank: item.rank ?? null, capacity: item.capacity ?? null, applicants: item.applicants ?? null,
      score_version: scoreVersion, score_opportunity: score.opportunity, score_confidence: score.confidence,
      observed_at: item.observedAt || observedAt, source,
    });
    if (before) {
      for (const field of numericFields) {
        const oldValue = Number(before[field] ?? 0);
        const newValue = Number(item[field]);
        if (oldValue !== newValue) alerts.push({ programme_id: item.programmeId, programme: item.programme, university: item.university, school: item.school, field_name: field, before_value: oldValue, after_value: newValue, delta: newValue - oldValue, observed_at: item.observedAt || observedAt });
      }
    }
  }

  const { error: upsertError } = await admin.from('live_programmes').upsert(rows, { onConflict: 'programme_id' });
  if (upsertError) return json({ ok: false, error: upsertError.message }, 500);
  const { error: observationError } = await admin.from('gauge_observations').upsert(observations, { onConflict: 'programme_id,snapshot_hash', ignoreDuplicates: true });
  if (observationError) return json({ ok: false, error: observationError.message }, 500);
  if (alerts.length) {
    const { error: alertError } = await admin.from('gauge_alerts').insert(alerts);
    if (alertError) return json({ ok: false, error: alertError.message }, 500);
  }

  return json({ ok: true, batchId, part, totalParts, received: items.length, updated: rows.length, alerts: alerts.length, observedAt, serverReceivedAt: new Date().toISOString() });
});
