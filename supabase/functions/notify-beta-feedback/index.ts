import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type FeedbackRecord = {
  id?: unknown;
  user_id?: unknown;
  category?: unknown;
  severity?: unknown;
  title?: unknown;
  description?: unknown;
  expected_behavior?: unknown;
  actual_behavior?: unknown;
  zone?: unknown;
  route?: unknown;
  screenshot_path?: unknown;
  created_at?: unknown;
};

type DatabaseWebhookPayload = {
  type?: unknown;
  table?: unknown;
  schema?: unknown;
  record?: FeedbackRecord;
};

type EmailResult = {
  status: 'sent' | 'failed' | 'skipped' | 'not_configured';
  provider_message_id?: string | null;
  error_message?: string | null;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

const cleanText = (value: unknown, limit = 240) => typeof value === 'string'
  ? value.trim().replace(/\s+/g, ' ').slice(0, limit)
  : '';

const isUuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value);

function getSupabaseAdminKey(): string | null {
  const modernKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modernKeys) {
    try {
      const parsed = JSON.parse(modernKeys);
      if (typeof parsed?.default === 'string' && parsed.default) return parsed.default;
    } catch {
      // Repli maîtrisé sur l’environnement legacy.
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || null;
}

function escapeHtml(value: unknown, limit = 240) {
  return cleanText(value, limit)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function telegramSend(token: string, chatId: string, message: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ chat_id: chatId, text: message.slice(0, 3800), disable_web_page_preview: true }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) throw new Error(`Telegram HTTP ${response.status}`);
  } finally {
    clearTimeout(timeout);
  }
}

function feedbackEmailHtml(title: string, body: string) {
  const safeTitle = escapeHtml(title, 160);
  const safeBody = escapeHtml(body, 3000).replace(/\n/g, '<br>');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title></head><body style="margin:0;background:#f4f6fb;color:#172033;font-family:Arial,Helvetica,sans-serif"><div style="max-width:640px;margin:0 auto;padding:28px 16px"><div style="background:#fff;border:1px solid #e4e8f0;border-radius:20px;overflow:hidden"><div style="padding:24px 28px;background:linear-gradient(135deg,#171d3b,#321b48)"><img src="https://bacpilot.site/branding/bacpilot-mark-512.png" width="64" height="64" alt="BacPilot" style="display:block;width:64px;height:64px;object-fit:contain;margin-bottom:16px"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#fda4af;font-weight:700">BacPilot — par MHM SOLUTIONS</div><h1 style="margin:10px 0 0;color:#fff;font-size:24px;line-height:1.2">${safeTitle}</h1></div><div style="padding:28px"><div style="font-size:15px;line-height:1.75;color:#303b50">${safeBody}</div></div></div><p style="font-size:12px;line-height:1.6;color:#778198;text-align:center;margin:18px 0">BacPilot — Compare. Décide. Avance.<br>Créé par Hilarus GBAGOULE · MHM SOLUTIONS</p></div></body></html>`;
}

async function sendOperatorEmail(subject: string, body: string): Promise<EmailResult> {
  const recipient = cleanText(Deno.env.get('OPERATOR_NOTIFICATION_EMAIL'), 180).toLowerCase();
  if (!recipient) return { status: 'not_configured', error_message: 'OPERATOR_NOTIFICATION_EMAIL absente.' };
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return { status: 'not_configured', error_message: 'RESEND_API_KEY absente.' };
  const configuredFrom = cleanText(Deno.env.get('BETA_EMAIL_FROM'), 180);
  const from = configuredFrom && !configuredFrom.toLowerCase().includes('@send.bacpilot.site')
    ? configuredFrom
    : 'BacPilot <contact@bacpilot.site>';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'BacPilot/1.0 (https://bacpilot.site)',
      },
      signal: controller.signal,
      body: JSON.stringify({ from, to: [recipient], subject, html: feedbackEmailHtml(subject, body), text: body }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return { status: 'failed', error_message: `Resend HTTP ${response.status}: ${cleanText(payload?.message || payload?.name, 180)}` };
    return { status: 'sent', provider_message_id: typeof payload?.id === 'string' ? payload.id : null };
  } catch (error) {
    return { status: 'failed', error_message: error instanceof Error ? cleanText(error.message, 180) : 'Erreur réseau email.' };
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ ok: false, error: 'Méthode non autorisée.' }, 405);
  const webhookSecret = Deno.env.get('BACPILOT_DB_WEBHOOK_SECRET');
  if (!webhookSecret || request.headers.get('x-bacpilot-webhook-secret') !== webhookSecret) return json({ ok: false, error: 'Webhook non autorisé.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = getSupabaseAdminKey();
  const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!supabaseUrl || !serviceRoleKey || !telegramToken || !telegramChatId) return json({ ok: false, error: 'Configuration serveur incomplète.' }, 500);

  let payload: DatabaseWebhookPayload;
  try { payload = await request.json(); } catch { return json({ ok: false, error: 'Payload JSON invalide.' }, 400); }
  if (payload.type !== 'INSERT' || payload.schema !== 'public' || payload.table !== 'beta_feedback' || !isUuid(payload.record?.id) || !isUuid(payload.record?.user_id)) {
    return json({ ok: false, error: 'Évènement de retour invalide.' }, 400);
  }

  const feedback = payload.record!;
  const feedbackId = feedback.id as string;
  const userId = feedback.user_id as string;
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: existing } = await admin.from('operator_feedback_deliveries').select('telegram_status, email_status, delivery_attempts').eq('feedback_id', feedbackId).maybeSingle();
  if (existing?.telegram_status === 'sent' && ['sent', 'not_configured', 'skipped'].includes(existing.email_status)) return json({ ok: true, duplicate: true });

  const attempts = Math.min(Number(existing?.delivery_attempts || 0) + 1, 9);
  await admin.from('operator_feedback_deliveries').upsert({ feedback_id: feedbackId, delivery_attempts: attempts, updated_at: new Date().toISOString() }, { onConflict: 'feedback_id' });
  const { data: profile } = await admin.from('profiles').select('display_name, email').eq('id', userId).maybeSingle();

  const category = cleanText(feedback.category, 30) || 'retour';
  const severity = cleanText(feedback.severity, 30) || 'medium';
  const title = cleanText(feedback.title, 160) || 'Retour sans titre';
  const description = cleanText(feedback.description, 1800);
  const expected = cleanText(feedback.expected_behavior, 500);
  const actual = cleanText(feedback.actual_behavior, 500);
  const zone = cleanText(feedback.zone, 60) || 'autre';
  const route = cleanText(feedback.route, 160) || 'non renseignée';
  const author = cleanText(profile?.display_name, 120) || 'Bêta-testeur';
  const email = cleanText(profile?.email, 180) || 'non renseigné';
  const telegramMessage = [
    'BacPilot — nouveau retour bêta',
    '',
    `Type : ${category} · Priorité : ${severity}`,
    `Titre : ${title}`,
    `Zone : ${zone} · Route : ${route}`,
    `Testeur : ${author} · ${email}`,
    '',
    `Description : ${description}`,
    expected ? `Attendu : ${expected}` : '',
    actual ? `Observé : ${actual}` : '',
    feedback.screenshot_path ? 'Capture jointe au retour privé : oui' : 'Capture jointe : non',
    '',
    `Référence retour : ${feedbackId}`,
    'Les détails restent stockés dans Supabase pour analyse et correction.',
  ].filter(Boolean).join('\n');

  let telegramStatus: EmailResult['status'] = 'failed';
  let emailResult: EmailResult = { status: 'not_configured', error_message: 'Non tenté.' };
  let telegramError: string | null = null;
  try { await telegramSend(telegramToken, telegramChatId, telegramMessage); telegramStatus = 'sent'; }
  catch (error) { telegramError = cleanText(error instanceof Error ? error.message : 'Échec Telegram', 180); }
  emailResult = await sendOperatorEmail(`[BacPilot] ${category} ${severity} — ${title}`, telegramMessage);

  await admin.from('operator_feedback_deliveries').update({
    telegram_status: telegramStatus,
    email_status: emailResult.status,
    telegram_sent_at: telegramStatus === 'sent' ? new Date().toISOString() : null,
    email_sent_at: emailResult.status === 'sent' ? new Date().toISOString() : null,
    provider_message_id: emailResult.provider_message_id || null,
    last_error: telegramError || emailResult.error_message || null,
    updated_at: new Date().toISOString(),
  }).eq('feedback_id', feedbackId);

  return json({ ok: telegramStatus === 'sent', feedback_id: feedbackId, telegram_status: telegramStatus, email_status: emailResult.status });
});
