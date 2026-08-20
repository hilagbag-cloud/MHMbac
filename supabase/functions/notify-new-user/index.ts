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

function escapeHtml(value: unknown, limit = 240) {
  return cleanText(value, limit)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function welcomeEmailHtml(displayName: string) {
  const name = escapeHtml(displayName || 'utilisateur BacPilot', 120);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Votre compte BacPilot est prêt</title></head><body style="margin:0;background:#ffffff;color:#1f2937;font-family:Arial,Helvetica,sans-serif"><main style="max-width:600px;margin:0 auto;padding:32px 20px"><p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#111827">BacPilot</p><p style="margin:0 0 18px;font-size:16px;line-height:1.6">Bonjour ${name},</p><p style="margin:0 0 18px;font-size:16px;line-height:1.6">Votre compte BacPilot vient d’être créé.</p><p style="margin:0 0 22px;font-size:16px;line-height:1.6">Vous pouvez accéder à votre espace pour renseigner votre profil et consulter les données disponibles.</p><p style="margin:0 0 24px;font-size:16px;line-height:1.6"><a href="https://bacpilot.site" style="color:#1d4ed8;text-decoration:underline">Accéder à BacPilot</a></p><p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563">Vous recevez ce message parce qu’un compte a été créé avec cette adresse. Besoin d’aide ? Répondez à cet e-mail ou écrivez à contact@bacpilot.site.</p><hr style="border:0;border-top:1px solid #e5e7eb;margin:28px 0 16px"><p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280">BacPilot — par MHM SOLUTIONS</p></main></body></html>`;
}

async function sendWelcomeEmail(apiKey: string, email: string, displayName: string) {
  const configuredFrom = cleanText(Deno.env.get('BETA_EMAIL_FROM'), 180);
  const from = configuredFrom && !configuredFrom.toLowerCase().includes('@send.bacpilot.site')
    ? configuredFrom
    : 'BacPilot <contact@bacpilot.site>';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, 'User-Agent': 'BacPilot/1.0 (https://bacpilot.site)' },
      signal: controller.signal,
      body: JSON.stringify({
        from,
        reply_to: 'contact@bacpilot.site',
        to: [email],
        subject: 'Votre compte BacPilot est prêt',
        html: welcomeEmailHtml(displayName),
        text: `Bonjour ${displayName || 'utilisateur BacPilot'},\n\nVotre compte BacPilot vient d’être créé. Vous pouvez accéder à votre espace : https://bacpilot.site\n\nBesoin d’aide ? Répondez à cet e-mail ou écrivez à contact@bacpilot.site.`,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`Resend HTTP ${response.status}: ${cleanText(payload?.message || payload?.name || 'réponse fournisseur inconnue', 180)}`);
    return { status: 'sent', providerMessageId: typeof payload?.id === 'string' ? payload.id : null, error: null };
  } catch (error) {
    return { status: 'failed', providerMessageId: null, error: error instanceof Error ? cleanText(error.message, 240) : 'Erreur réseau email.' };
  } finally {
    clearTimeout(timeout);
  }
}

async function sendTelegramMessage(token: string, chatId: string, text: string, replyMarkup?: Record<string, unknown>) {
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
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
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
  const testEmail = cleanText(payload.record?.email, 180).toLowerCase();
  // Compte de recette éphémère : aucun e-mail ni message opérateur ne doit être émis.
  if (testEmail.endsWith('@example.invalid')) {
    return json({ ok: true, test: true, message: 'Profil de recette ignoré.' });
  }
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
  const emailAddress = cleanText(payload.record?.email, 180).toLowerCase();
  const emailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(emailAddress);
  const { data: authLookup } = await admin.auth.admin.getUserById(userId);
  const emailConfirmed = Boolean(authLookup?.user?.email_confirmed_at);
  const emailSecurityStatus = !emailFormatValid
    ? 'format invalide ou absent — aucun e-mail automatique'
    : emailConfirmed
      ? 'format valide · identité Auth confirmée'
      : 'format valide · confirmation du titulaire en attente';
  const resendKey = Deno.env.get('RESEND_API_KEY');
  let welcomeStatus = emailFormatValid ? 'à envoyer' : 'ignoré — adresse e-mail absente ou invalide';
  if (emailFormatValid && resendKey) {
    const { data: existingWelcome } = await admin.from('welcome_email_deliveries').select('id, status, attempts').eq('user_id', userId).maybeSingle();
    if (existingWelcome?.status === 'sent') {
      welcomeStatus = 'déjà envoyé';
    } else {
      const attempts = Math.min(Number(existingWelcome?.attempts || 0) + 1, 9);
      const { data: ledger } = await admin.from('welcome_email_deliveries').upsert({
        id: existingWelcome?.id,
        user_id: userId,
        recipient_email: emailAddress,
        status: 'pending',
        attempts,
        error_message: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' }).select('id').single();
      if (ledger?.id) {
        const delivery = await sendWelcomeEmail(resendKey, emailAddress, displayName);
        welcomeStatus = delivery.status === 'sent' ? 'envoyé automatiquement' : `échec — ${delivery.error || 'à reprendre'}`;
        await admin.from('welcome_email_deliveries').update({
          status: delivery.status,
          provider_message_id: delivery.providerMessageId,
          error_message: delivery.error,
          sent_at: delivery.status === 'sent' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }).eq('id', ledger.id);
      }
    }
  } else if (!resendKey && emailFormatValid) {
    welcomeStatus = 'à envoyer — Resend non configuré';
  }

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
    `E-mail : ${emailSecurityStatus}`,
    `Welcome : ${welcomeStatus}`,
    '',
    betaRequested
      ? `Action proposée : appuie sur « Valider bêta » pour préparer l’action.`
      : `Contrôle possible : appuie sur « Voir la fiche »`,
    `Fiche complète : /user ${userId}`,
    'Le statut bêta est attribué uniquement par validation serveur.',
  ].join('\n');

  const replyMarkup = {
    inline_keyboard: [
      [{ text: '✉️ Renvoyer welcome', callback_data: `welcome:${userId}` }, { text: '👤 Voir la fiche', callback_data: `user:${userId}` }],
      ...(betaRequested ? [[{ text: '✅ Valider bêta', callback_data: `beta_add:${userId}` }]] : []),
      [{ text: '🛡️ Vérifier / supprimer', callback_data: `delete:${userId}` }],
    ],
  };

  try {
    await sendTelegramMessage(telegramToken, telegramChatId, text, replyMarkup);
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
