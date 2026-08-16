import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type ProfileRecord = {
  id?: unknown;
  display_name?: unknown;
  email?: unknown;
  signup_intent?: unknown;
  signup_entrypoint?: unknown;
  signup_route?: unknown;
  signup_device_class?: unknown;
  signup_browser?: unknown;
  signup_context_consent_at?: unknown;
  created_at?: unknown;
};

type DatabaseWebhookPayload = {
  type?: unknown;
  table?: unknown;
  schema?: unknown;
  record?: ProfileRecord;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

const cleanText = (value: unknown, limit = 160) => typeof value === 'string'
  ? value.trim().replace(/\s+/g, ' ').slice(0, limit)
  : '';

function getSupabaseAdminKey(): string | null {
  const modernKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modernKeys) {
    try {
      const parsed = JSON.parse(modernKeys);
      if (typeof parsed?.default === 'string' && parsed.default) return parsed.default;
    } catch {
      // Repli contrôlé vers la clé legacy si elle est encore active.
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || null;
}

const isSafeId = (value: unknown) => typeof value === 'string' && /^[0-9a-f-]{16,80}$/i.test(value);

const formatDate = (value: unknown) => {
  const parsed = typeof value === 'string' ? new Date(value) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Porto-Novo',
  }).format(date);
};

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
    if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload?.ok) throw new Error('Telegram a refusé le message.');
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ ok: false, error: 'Méthode non autorisée.' }, 405);

  const webhookSecret = Deno.env.get('BACPILOT_DB_WEBHOOK_SECRET');
  if (!webhookSecret || request.headers.get('x-bacpilot-webhook-secret') !== webhookSecret) {
    return json({ ok: false, error: 'Webhook non autorisé.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = getSupabaseAdminKey();
  const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!supabaseUrl || !serviceRoleKey || !telegramToken || !telegramChatId) {
    return json({ ok: false, error: 'Configuration serveur incomplète.' }, 500);
  }

  let payload: DatabaseWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Payload JSON invalide.' }, 400);
  }

  if (payload.type !== 'INSERT' || payload.schema !== 'public' || payload.table !== 'profiles' || !isSafeId(payload.record?.id)) {
    return json({ ok: false, error: 'Évènement de profil invalide.' }, 400);
  }

  const userId = payload.record!.id as string;
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: delivery, error: deliveryLookupError } = await admin
    .from('operator_notifications')
    .select('id, delivery_status, delivery_attempts')
    .eq('user_id', userId)
    .eq('channel', 'telegram')
    .maybeSingle();
  if (deliveryLookupError) return json({ ok: false, error: 'Journal de notification indisponible.' }, 500);

  if (delivery?.delivery_status === 'sent') {
    return json({ ok: true, duplicate: true, message: 'Notification déjà livrée.' });
  }

  const attempts = Math.min(Number(delivery?.delivery_attempts || 0) + 1, 9);
  const { data: deliveryRow, error: deliveryError } = await admin
    .from('operator_notifications')
    .upsert({
      id: delivery?.id,
      user_id: userId,
      channel: 'telegram',
      delivery_status: 'pending',
      delivery_attempts: attempts,
      last_error: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,channel' })
    .select('id')
    .single();
  if (deliveryError || !deliveryRow?.id) return json({ ok: false, error: 'Journal de notification non enregistré.' }, 500);

  const { data: betaTester, error: betaError } = await admin
    .from('beta_testers')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();
  if (betaError) return json({ ok: false, error: 'Vérification du statut bêta impossible.' }, 500);

  const status = betaTester?.status === 'active' ? 'Bêta actif' : 'Standard';
  const displayName = cleanText(payload.record?.display_name, 120) || 'Non renseigné';
  const email = cleanText(payload.record?.email, 180) || 'Non renseigné';
  const signupIntent = cleanText(payload.record?.signup_intent, 40);
  const betaRequested = signupIntent === 'beta_interest';
  const entrypoint = cleanText(payload.record?.signup_entrypoint, 40) || 'direct';
  const route = cleanText(payload.record?.signup_route, 160) || 'non renseignée';
  const contextConsentAt = cleanText(payload.record?.signup_context_consent_at, 80);
  const deviceClass = cleanText(payload.record?.signup_device_class, 20);
  const browser = cleanText(payload.record?.signup_browser, 20);
  const technicalContext = betaRequested && contextConsentAt && (deviceClass || browser)
    ? `${deviceClass || 'type inconnu'} · ${browser || 'navigateur inconnu'}`
    : 'non communiqué';
  const text = [
    'BacPilot — nouvelle inscription',
    '',
    `Intention : ${betaRequested ? 'Demande bêta — à valider' : 'Utilisation standard'}`,
    `Nom : ${displayName}`,
    `E-mail : ${email}`,
    `ID BacPilot : ${userId}`,
    `Créé le : ${formatDate(payload.record?.created_at)}`,
    '',
    `Entrée : ${entrypoint} · ${route}`,
    `Contexte technique consenti : ${technicalContext}`,
    `Statut bêta actuel : ${status}`,
    '',
    betaRequested
      ? `Action proposée : /beta_add ${userId} puis /confirm CODE`
      : 'Aucune action bêta demandée.',
    'Le statut bêta est attribué uniquement par validation serveur.',
  ].join('\n');

  try {
    await sendTelegramMessage(telegramToken, telegramChatId, text);
    const { error: sentError } = await admin
      .from('operator_notifications')
      .update({ delivery_status: 'sent', sent_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() })
      .eq('id', deliveryRow.id);
    if (sentError) return json({ ok: false, error: 'Message envoyé mais journal non mis à jour.' }, 500);
    return json({ ok: true, status, message: 'Notification Telegram envoyée.' });
  } catch (error) {
    await admin
      .from('operator_notifications')
      .update({ delivery_status: 'failed', last_error: cleanText(error instanceof Error ? error.message : 'Échec Telegram', 240), updated_at: new Date().toISOString() })
      .eq('id', deliveryRow.id);
    return json({ ok: false, error: 'Envoi Telegram impossible.' }, 502);
  }
});
