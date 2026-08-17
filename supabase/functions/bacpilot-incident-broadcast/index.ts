import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type Profile = { id: string; display_name: string | null; email: string | null };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

const clean = (value: unknown, limit = 240) => typeof value === 'string'
  ? value.trim().replace(/\s+/g, ' ').slice(0, limit)
  : '';

function adminKey(): string | null {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modern) {
    try {
      const parsed = JSON.parse(modern);
      if (typeof parsed?.default === 'string' && parsed.default) return parsed.default;
    } catch {
      // Repli legacy ci-dessous.
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || null;
}

function escapeHtml(value: unknown, limit = 500) {
  return clean(value, limit)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function incidentHtml(displayName: string, resolved: boolean) {
  const name = escapeHtml(displayName || 'utilisateur BacPilot', 120);
  const title = resolved ? 'Assistant BacPilot à nouveau disponible' : 'Information importante — assistant BacPilot temporairement indisponible';
  const paragraphs = resolved
    ? `<p style="margin:0 0 18px;font-size:16px;line-height:1.6">Nous vous remercions pour votre patience. L’assistant IA de BacPilot est à nouveau disponible.</p><p style="margin:0 0 18px;font-size:16px;line-height:1.6">Vous pouvez reprendre votre orientation et réessayer vos demandes dès maintenant.</p>`
    : `<p style="margin:0 0 18px;font-size:16px;line-height:1.6">Nous vous prions de nous excuser : l’assistant IA de BacPilot rencontre actuellement quelques difficultés techniques.</p><p style="margin:0 0 18px;font-size:16px;line-height:1.6">Notre équipe est déjà en train de corriger le problème. Le service devrait être à nouveau disponible dans quelques minutes.</p><p style="margin:0 0 18px;font-size:16px;line-height:1.6">Vous pourrez réessayer dès le rétablissement. Nous vous enverrons également une notification par e-mail dès que la disponibilité aura été confirmée.</p>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;background:#fff;color:#1f2937;font-family:Arial,Helvetica,sans-serif"><main style="max-width:600px;margin:0 auto;padding:32px 20px"><p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#111827">BacPilot</p><p style="margin:0 0 18px;font-size:16px;line-height:1.6">Bonjour ${name},</p>${paragraphs}<p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563">Merci pour votre patience et votre confiance.<br><br>BacPilot — par MHM SOLUTIONS<br><a href="mailto:contact@bacpilot.site" style="color:#1d4ed8">contact@bacpilot.site</a></p><hr style="border:0;border-top:1px solid #e5e7eb;margin:28px 0 16px"><p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280">Ce message est une information de service envoyée aux utilisateurs inscrits de BacPilot.</p></main></body></html>`;
}

async function sendEmail(apiKey: string, email: string, displayName: string, resolved: boolean) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'BacPilot/1.0 (https://bacpilot.site)',
      },
      signal: controller.signal,
      body: JSON.stringify({
        from: 'BacPilot <contact@bacpilot.site>',
        reply_to: 'contact@bacpilot.site',
        to: [email],
        subject: resolved ? 'Assistant BacPilot à nouveau disponible' : 'Information importante — assistant BacPilot temporairement indisponible',
        html: incidentHtml(displayName, resolved),
        text: resolved
          ? `Bonjour ${displayName || 'utilisateur BacPilot'},\n\nNous vous remercions pour votre patience. L’assistant IA de BacPilot est à nouveau disponible. Vous pouvez reprendre votre orientation et réessayer vos demandes dès maintenant.\n\nBacPilot — par MHM SOLUTIONS\ncontact@bacpilot.site`
          : `Bonjour ${displayName || 'utilisateur BacPilot'},\n\nNous vous prions de nous excuser : l’assistant IA de BacPilot rencontre actuellement quelques difficultés techniques. Notre équipe est déjà en train de corriger le problème et le service devrait être à nouveau disponible dans quelques minutes. Vous pourrez réessayer dès le rétablissement. Nous vous enverrons également une notification par e-mail dès que la disponibilité aura été confirmée.\n\nMerci pour votre patience et votre confiance.\n\nBacPilot — par MHM SOLUTIONS\ncontact@bacpilot.site`,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return { status: 'failed', provider_message_id: null, error: `Resend HTTP ${response.status}: ${clean(payload?.message || payload?.name || 'erreur fournisseur', 180)}` };
    return { status: 'sent', provider_message_id: typeof payload?.id === 'string' ? payload.id : null, error: null };
  } catch (error) {
    return { status: 'failed', provider_message_id: null, error: error instanceof Error ? clean(error.message, 180) : 'Erreur réseau email.' };
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ ok: false, error: 'Méthode non autorisée.' }, 405);
  const webhookSecret = Deno.env.get('BACPILOT_DB_WEBHOOK_SECRET');
  if (!webhookSecret || request.headers.get('x-bacpilot-webhook-secret') !== webhookSecret) return json({ ok: false, error: 'Webhook non autorisé.' }, 401);
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = adminKey();
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!supabaseUrl || !serviceRoleKey || !resendKey) return json({ ok: false, error: 'Configuration serveur incomplète.' }, 500);

  let body: any;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Payload JSON invalide.' }, 400); }
  const incidentCode = clean(body?.incident_code, 80);
  if (!incidentCode) return json({ ok: false, error: 'incident_code requis.' }, 400);
  const resolved = body?.status === 'resolved';

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, display_name, email')
    .not('email', 'is', null)
    .limit(5000);
  if (profilesError) return json({ ok: false, error: 'Profils destinataires indisponibles.' }, 500);

  let skipped = 0;
  let sent = 0;
  let failed = 0;
  const results: Array<Record<string, unknown>> = [];
  for (const profile of (profiles || []) as Profile[]) {
    const email = clean(profile.email, 180).toLowerCase();
    if (!email || !email.includes('@')) { skipped += 1; continue; }
    const { data: existing } = await admin
      .from('incident_email_deliveries')
      .select('id, status')
      .eq('incident_code', incidentCode)
      .eq('user_id', profile.id)
      .maybeSingle();
    if (existing?.status === 'sent') { skipped += 1; continue; }

    const result = await sendEmail(resendKey, email, clean(profile.display_name, 120), resolved);
    if (result.status === 'sent') sent += 1; else failed += 1;
    await admin.from('incident_email_deliveries').upsert({
      incident_code: incidentCode,
      user_id: profile.id,
      recipient_email: email,
      subject: resolved ? 'Assistant BacPilot à nouveau disponible' : 'Information importante — assistant BacPilot temporairement indisponible',
      status: result.status,
      provider_message_id: result.provider_message_id,
      error_message: result.error,
      sent_at: result.status === 'sent' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'incident_code,user_id' });
    results.push({ user_id: profile.id, status: result.status, error: result.error });
  }
  return json({ ok: failed === 0, incident_code: incidentCode, total_profiles: (profiles || []).length, sent, failed, skipped, results }, failed === 0 ? 200 : 207);
});
