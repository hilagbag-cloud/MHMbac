import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

function randomToken(prefix = 'bpc') {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const encoded = btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
  return `${prefix}_${encoded}`;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ ok: false, error: 'Méthode non autorisée' }, 405);

  let body: any;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'JSON invalide' }, 400); }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ ok: false, error: 'Configuration serveur incomplète' }, 500);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const requestNow = new Date().toISOString();

  if (body?.action === 'enroll') {
    const activationCode = cleanText(body?.activationCode, 160);
    if (!activationCode) return json({ ok: false, code: 'ACTIVATION_REQUIRED', error: 'Code d’activation requis.' }, 400);
    const activationHash = await sha256(activationCode);
    const { data: activation, error: activationReadError } = await admin
      .from('collector_activation_codes')
      .select('id, status, expires_at, label')
      .eq('code_hash', activationHash)
      .maybeSingle();
    if (activationReadError) return json({ ok: false, code: 'ENROLLMENT_STORE_UNAVAILABLE', error: 'Service d’enrôlement indisponible.' }, 500);
    if (!activation) return json({ ok: false, code: 'ACTIVATION_INVALID', error: 'Code d’activation inconnu.' }, 401);
    if (activation.status !== 'issued') return json({ ok: false, code: 'ACTIVATION_CONSUMED', error: 'Code d’activation déjà utilisé ou révoqué.' }, 409);
    if (Date.parse(activation.expires_at) <= Date.now()) {
      await admin.from('collector_activation_codes').update({ status: 'expired' }).eq('id', activation.id).eq('status', 'issued');
      return json({ ok: false, code: 'ACTIVATION_EXPIRED', error: 'Code d’activation expiré.' }, 410);
    }
    const { data: consumed, error: consumeError } = await admin
      .from('collector_activation_codes')
      .update({ status: 'consumed', consumed_at: requestNow })
      .eq('id', activation.id)
      .eq('status', 'issued')
      .select('id')
      .maybeSingle();
    if (consumeError) return json({ ok: false, code: 'ENROLLMENT_STORE_UNAVAILABLE', error: 'Activation impossible pour le moment.' }, 500);
    if (!consumed) return json({ ok: false, code: 'ACTIVATION_CONSUMED', error: 'Code d’activation déjà utilisé.' }, 409);
    const collectorToken = randomToken();
    const tokenHash = await sha256(collectorToken);
    const { data: collector, error: collectorError } = await admin.from('collector_devices').insert({
      token_hash: tokenHash,
      label: cleanText(body?.label || activation.label || 'Extension BacPilot', 120),
      activated_at: requestNow,
    }).select('id, activated_at, label').single();
    if (collectorError || !collector) return json({ ok: false, code: 'ENROLLMENT_STORE_UNAVAILABLE', error: 'Collecteur non créé ; demande un nouveau code à l’opérateur.' }, 500);
    return json({ ok: true, mode: 'enroll', collectorId: collector.id, collectorToken, label: collector.label, activatedAt: collector.activated_at });
  }

  let authMode = 'legacy';
  let collectorId: string | null = null;
  const hasCollectorCredentials = body?.collectorId !== undefined || body?.collectorToken !== undefined;
  if (hasCollectorCredentials) {
    const requestedCollectorId = cleanText(body?.collectorId, 120);
    const collectorToken = cleanText(body?.collectorToken, 240);
    if (!requestedCollectorId || !collectorToken) return json({ ok: false, code: 'ENROLLMENT_REQUIRED', error: 'Collecteur non enrôlé : utilisez un code d’activation.' }, 401);
    const { data: collector, error: collectorReadError } = await admin
      .from('collector_devices')
      .select('id, status, token_hash')
      .eq('id', requestedCollectorId)
      .maybeSingle();
    if (collectorReadError) return json({ ok: false, code: 'COLLECTOR_STORE_UNAVAILABLE', error: 'Vérification du collecteur impossible.' }, 500);
    if (!collector) return json({ ok: false, code: 'COLLECTOR_NOT_FOUND', error: 'Collecteur inconnu ; réenrôlez cette extension.' }, 401);
    if (collector.status !== 'active') return json({ ok: false, code: 'COLLECTOR_REVOKED', error: 'Collecteur révoqué par l’opérateur.' }, 403);
    if ((await sha256(collectorToken)) !== collector.token_hash) return json({ ok: false, code: 'COLLECTOR_TOKEN_INVALID', error: 'Identifiant de collecteur ou token invalide.' }, 401);
    collectorId = collector.id;
    authMode = 'collector';
    const seenPatch: Record<string, string> = { last_seen_at: requestNow };
    if (body?.action === 'preflight') seenPatch.last_preflight_at = requestNow;
    await admin.from('collector_devices').update(seenPatch).eq('id', collectorId).eq('status', 'active');
  } else {
    const expectedToken = Deno.env.get('MHM_SYNC_TOKEN') || Deno.env.get('MHMBAC_SYNC_API_KEY');
    const receivedToken = typeof body?.syncToken === 'string' ? body.syncToken : null;
    if (!expectedToken || !receivedToken || receivedToken !== expectedToken) {
      return json({ ok: false, code: 'LEGACY_TOKEN_INVALID', error: 'Jeton legacy absent ou invalide. Enrôlez cette extension avec un code à usage unique.' }, 401);
    }
  }

  if (body?.action === 'preflight') {
    const { error } = await admin.from('live_programmes').select('programme_id').limit(1);
    if (error) return json({ ok: false, error: 'Vérification serveur impossible' }, 500);
    return json({ ok: true, mode: 'preflight', authMode, collectorId, message: authMode === 'collector' ? 'Collecteur autorisé et serveur prêt pour la collecte.' : 'Mode legacy autorisé ; enrôlez cette extension pour une sécurité renforcée.', serverCheckedAt: requestNow });
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

  const source = cleanText(body?.source || 'chrome_extension', 80);
  const collectionId = cleanText(body?.collectionId, 120) || null;
  const observedAt = typeof body?.observedAt === 'string' && !Number.isNaN(Date.parse(body.observedAt))
    ? new Date(body.observedAt).toISOString() : new Date().toISOString();
  const payloadHash = await sha256(JSON.stringify({
    source,
    collectionId,
    part,
    totalParts,
    observedAt,
    items: [...items].sort((left, right) => left.programmeId - right.programmeId),
  }));
  const { data: existingReceipt, error: receiptReadError } = await admin
    .from('sync_batch_receipts')
    .select('payload_hash, result, collector_id')
    .eq('batch_id', batchId)
    .maybeSingle();
  if (receiptReadError) return json({ ok: false, error: 'Lecture du reçu de lot impossible' }, 500);
  if (existingReceipt) {
    if (existingReceipt.collector_id !== collectorId) {
      return json({ ok: false, code: 'BATCH_OWNER_MISMATCH', error: 'batchId déjà utilisé par un autre collecteur' }, 409);
    }
    if (existingReceipt.payload_hash !== payloadHash) {
      return json({ ok: false, error: 'batchId déjà utilisé pour un contenu différent' }, 409);
    }
    return json({ ...(existingReceipt.result || {}), replayed: true, batchId }, 200);
  }

  const programmeIds = items.map((item) => item.programmeId);
  const { data: previous, error: previousError } = await admin
    .from('live_programmes')
    .select('*')
    .in('programme_id', programmeIds);
  if (previousError) return json({ ok: false, error: previousError.message }, 500);
  const previousById = new Map<number, any>((previous ?? []).map((row: any) => [Number(row.programme_id), row]));

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
          if (oldValue !== newValue) {
            const alertObservedAt = item.observedAt || observedAt;
            const eventHash = await sha256(JSON.stringify({ programmeId: item.programmeId, field, before: oldValue, after: newValue, observedAt: alertObservedAt }));
            alerts.push({ programme_id: item.programmeId, programme: item.programme, university: item.university, school: item.school, field_name: field, before_value: oldValue, after_value: newValue, delta: newValue - oldValue, observed_at: alertObservedAt, event_hash: eventHash });
          }
      }
    }
  }

  const { error: upsertError } = await admin.from('live_programmes').upsert(rows, { onConflict: 'programme_id' });
  if (upsertError) return json({ ok: false, error: upsertError.message }, 500);
  const { error: observationError } = await admin.from('gauge_observations').upsert(observations, { onConflict: 'programme_id,snapshot_hash', ignoreDuplicates: true });
  if (observationError) return json({ ok: false, error: observationError.message }, 500);
  if (alerts.length) {
    const { error: alertError } = await admin.from('gauge_alerts').upsert(alerts, { onConflict: 'event_hash', ignoreDuplicates: true });
    if (alertError) return json({ ok: false, error: alertError.message }, 500);
  }

  const result = { ok: true, batchId, collectionId, collectorId, authMode, part, totalParts, received: items.length, updated: rows.length, alerts: alerts.length, observedAt, serverReceivedAt: new Date().toISOString() };
  const { error: receiptWriteError } = await admin.from('sync_batch_receipts').insert({
    batch_id: batchId,
    payload_hash: payloadHash,
    collection_id: collectionId,
    part,
    total_parts: totalParts,
    item_count: items.length,
    source,
    observed_at: observedAt,
    collector_id: collectorId,
    result,
  });
  if (receiptWriteError) {
    const { data: racedReceipt } = await admin.from('sync_batch_receipts').select('payload_hash, result, collector_id').eq('batch_id', batchId).maybeSingle();
    if (racedReceipt?.collector_id === collectorId && racedReceipt?.payload_hash === payloadHash) return json({ ...(racedReceipt.result || result), replayed: true, batchId }, 200);
    return json({ ok: false, error: 'Enregistrement du reçu de lot impossible' }, 500);
  }

  return json(result);
});
