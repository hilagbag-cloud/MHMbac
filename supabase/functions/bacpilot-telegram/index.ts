import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type TelegramUpdate = {
  message?: {
    chat?: { id?: unknown };
    text?: unknown;
  };
};

type OperatorCommand =
  | '/start'
  | '/help'
  | '/status'
  | '/stats'
  | '/health'
  | '/test'
  | '/user'
  | '/user_delete'
  | '/beta_add'
  | '/beta_pause'
  | '/beta_revoke'
  | '/beta_list'
  | '/feedback'
  | '/pending'
  | '/confirm'
  | '/cancel'
  | '/menu'
  | '/email'
  | '/collector_issue'
  | '/collector_list'
  | '/collector_revoke';

type ResolvedUser = {
  id: string;
  display_name: string | null;
  email: string | null;
  series: string | null;
  mention: string | null;
  signup_intent: string | null;
  signup_entrypoint: string | null;
  signup_route: string | null;
  signup_device_class: string | null;
  signup_browser: string | null;
  signup_context_consent_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type InputSession = {
  telegram_chat_id: string;
  expected_input: 'user_identifier' | 'beta_user_identifier' | 'confirmation_ack' | 'menu_choice' | 'email_subject' | 'email_body';
  origin_command: '/start' | '/help' | '/menu' | '/status' | '/stats' | '/user' | '/email' | '/user_delete' | '/beta_add' | '/beta_pause' | '/beta_revoke' | '/confirm' | '/cancel';
  pending_action_id?: string | null;
  menu_state?: string | null;
  menu_context?: Record<string, unknown> | null;
  expires_at: string;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

const commandNames = new Set<OperatorCommand>([
  '/start', '/help', '/status', '/stats', '/health', '/test', '/user', '/user_delete',
  '/beta_add', '/beta_pause', '/beta_revoke', '/beta_list', '/feedback',
  '/pending', '/confirm', '/cancel', '/menu', '/email', '/collector_issue', '/collector_list', '/collector_revoke',
]);

const betaStatuses = new Set(['active', 'invited', 'paused', 'revoked']);
const DATABASE_OPERATION_TIMEOUT_MS = 6_000;

function withTimeout<T>(task: Promise<T>, timeoutMs = DATABASE_OPERATION_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Opération interrompue après ${timeoutMs} ms.`)), timeoutMs);
  });
  return Promise.race([task, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function getSupabaseAdminKey(): string | null {
  const modernKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modernKeys) {
    try {
      const parsed = JSON.parse(modernKeys);
      if (typeof parsed?.default === 'string' && parsed.default) return parsed.default;
    } catch {
      // Repli maîtrisé vers la clé legacy pour les projets qui ne l’ont pas encore migrée.
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || null;
}

function parseCommand(value: unknown): { command: OperatorCommand | null; argument: string } {
  if (typeof value !== 'string') return { command: null, argument: '' };
  const [first = '', ...rest] = value.trim().split(/\s+/);
  const normalized = first.toLowerCase().split('@', 1)[0] as OperatorCommand;
  return { command: commandNames.has(normalized) ? normalized : null, argument: rest.join(' ').trim() };
}

function text(value: unknown, limit = 240) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, limit) : '';
}

function messageText(value: unknown, limit = 6000) {
  return typeof value === 'string'
    ? value.trim().replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{4,}/g, '\n\n\n').slice(0, limit)
    : '';
}

function formatDate(value: unknown) {
  const date = typeof value === 'string' ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'inconnue';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Porto-Novo',
  }).format(date);
}

function compactJson(value: unknown, limit = 700) {
  try {
    const raw = JSON.stringify(value ?? {});
    return raw.length > limit ? `${raw.slice(0, limit - 1)}…` : raw;
  } catch {
    return '{}';
  }
}

function makeConfirmationCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = crypto.getRandomValues(new Uint8Array(8));
  return [...values].map((value) => alphabet[value % alphabet.length]).join('');
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function makeCollectorActivationCode() {
  return `BPC-${makeConfirmationCode()}-${makeConfirmationCode()}`;
}

async function issueCollectorActivation(admin: any, label: string) {
  const code = makeCollectorActivationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const { error } = await admin.from('collector_activation_codes').insert({
    code_hash: await sha256(code),
    label: text(label, 120) || 'Extension BacPilot',
    expires_at: expiresAt,
  });
  if (error) throw new Error('Code d’activation non créé.');
  return [
    'Code d’enrôlement BacPilot créé.',
    '',
    `Code : ${code}`,
    `Expire : ${formatDate(expiresAt)}`,
    '',
    'À saisir une seule fois dans la console de l’extension. Le code ne sera plus réutilisable après activation.',
  ].join('\n');
}

async function listCollectors(admin: any) {
  const { data, error } = await admin.from('collector_devices')
    .select('id, label, status, activated_at, last_seen_at, last_preflight_at, revoked_at')
    .order('activated_at', { ascending: false })
    .limit(20);
  if (error) throw new Error('Liste des collecteurs indisponible.');
  if (!data?.length) return 'Aucun collecteur enrôlé.';
  return [
    'BacPilot — collecteurs enrôlés',
    '',
    ...data.map((collector: any, index: number) => [
      `${index + 1}. ${text(collector.label, 100) || 'Extension BacPilot'}`,
      `ID : ${collector.id}`,
      `État : ${collector.status} · activé ${formatDate(collector.activated_at)}`,
      `Dernier contact : ${formatDate(collector.last_seen_at)}`,
    ].join('\n')),
    '',
    'Pour révoquer : /collector_revoke <ID> puis /confirm.',
  ].join('\n');
}

async function createCollectorRevokePending(admin: any, chatId: string, collectorId: string) {
  const id = text(collectorId, 80);
  const { data: collector } = await admin.from('collector_devices')
    .select('id, label, status')
    .eq('id', id)
    .maybeSingle();
  if (!collector) return 'Collecteur introuvable. Utilise /collector_list pour copier son ID.';
  if (collector.status === 'revoked') return 'Ce collecteur est déjà révoqué.';
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await admin.from('operator_pending_actions').insert({
    telegram_chat_id: chatId,
    action: 'collector_revoke',
    target_user_id: null,
    confirmation_code: makeConfirmationCode(),
    payload: { collector_id: collector.id, label: text(collector.label, 120) || collector.id },
    expires_at: expiresAt,
  });
  if (error) throw new Error('Révocation en attente non créée.');
  return beginConfirmationSession(admin, chatId);
}

async function telegramApi(token: string, method: string, body: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) throw new Error(`Telegram ${method} indisponible.`);
    return payload.result;
  } finally {
    clearTimeout(timeout);
  }
}

async function sendMessage(token: string, chatId: string, message: string) {
  await telegramApi(token, 'sendMessage', {
    chat_id: chatId,
    text: message.slice(0, 4000),
    disable_web_page_preview: true,
  });
}

function escapeHtml(value: unknown, limit = 240) {
  return text(value, limit)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

type BetaEmailResult = {
  status: 'sent' | 'failed' | 'not_configured' | 'skipped';
  provider_message_id?: string | null;
  error_message?: string | null;
};

function betaEmailHtml(displayName: string, betaUrl: string) {
  const safeName = escapeHtml(displayName || 'bêta-testeur', 100);
  const safeUrl = escapeHtml(betaUrl, 240);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bienvenue dans la bêta BacPilot</title></head><body style="margin:0;background:#0b1020;color:#e5e7eb;font-family:Arial,Helvetica,sans-serif"><div style="max-width:620px;margin:0 auto;padding:28px 16px"><div style="background:#111a31;border:1px solid #263454;border-radius:24px;overflow:hidden"><div style="padding:26px 28px;background:linear-gradient(135deg,#161d3a,#301b46)"><img src="https://bacpilot.site/branding/bacpilot-mark-512.png" width="72" height="72" alt="BacPilot" style="display:block;width:72px;height:72px;object-fit:contain;margin-bottom:18px"><div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#fda4af;font-weight:700">BacPilot — par MHM SOLUTIONS</div><h1 style="margin:10px 0 0;color:#fff;font-size:30px;line-height:1.15">Bienvenue dans la bêta</h1></div><div style="padding:28px"><p style="font-size:17px;line-height:1.6;margin-top:0">Bonjour ${safeName},</p><p style="font-size:16px;line-height:1.7">Ton statut de <strong> bêta-testeur BacPilot </strong> vient d’être confirmé par l’équipe. Tu peux maintenant accéder à ton espace réservé, tester les fonctionnalités et nous signaler les anomalies ou améliorations utiles.</p><div style="text-align:center;margin:28px 0 30px"><a href="${safeUrl}" style="display:inline-block;background:#f43f5e;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">Ouvrir mon espace bêta</a></div><p style="font-size:13px;line-height:1.6;color:#aab4cc;margin-bottom:0">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br><a href="${safeUrl}" style="color:#fda4af;word-break:break-all">${safeUrl}</a></p></div></div><p style="font-size:12px;line-height:1.6;color:#8792aa;text-align:center;margin:18px 0">BacPilot — Compare. Décide. Avance.<br>Créé par Hilarus GBAGOULE · MHM SOLUTIONS</p></div></body></html>`;
}

async function sendBetaActivationEmail(email: string, displayName: string): Promise<BetaEmailResult> {
  if (!email) return { status: 'skipped', error_message: 'Adresse email absente du profil.' };
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return { status: 'not_configured', error_message: 'RESEND_API_KEY absente des secrets Edge Function.' };
  const betaUrl = Deno.env.get('BETA_PORTAL_URL') || 'https://beta.bacpilot.site/';
  const configuredFrom = text(Deno.env.get('BETA_EMAIL_FROM'), 180);
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
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Ton accès bêta BacPilot est confirmé',
        html: betaEmailHtml(displayName, betaUrl),
        text: `Bonjour ${displayName || 'bêta-testeur'}, ton statut bêta BacPilot est confirmé. Ouvre ton espace : ${betaUrl}`,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const providerMessage = typeof payload?.message === 'string'
        ? payload.message
        : typeof payload?.name === 'string'
          ? payload.name
          : 'Réponse fournisseur sans détail.';
      return { status: 'failed', error_message: `Resend HTTP ${response.status}: ${text(providerMessage, 180)}` };
    }
    return { status: 'sent', provider_message_id: typeof payload?.id === 'string' ? payload.id : null };
  } catch (error) {
    return { status: 'failed', error_message: error instanceof Error ? text(error.message, 180) : 'Erreur réseau email.' };
  } finally {
    clearTimeout(timeout);
  }
}

async function deliverBetaActivationEmail(admin: any, userId: string): Promise<BetaEmailResult> {
  const { data: profile } = await admin.from('profiles').select('email, display_name').eq('id', userId).maybeSingle();
  const email = text(profile?.email, 180).toLowerCase();
  const { data: existing } = await admin.from('beta_email_deliveries').select('status, provider_message_id').eq('user_id', userId).eq('event_type', 'beta_activated').maybeSingle();
  if (existing?.status === 'sent') return { status: 'sent', provider_message_id: typeof existing.provider_message_id === 'string' ? existing.provider_message_id : null };
  const result = await sendBetaActivationEmail(email, text(profile?.display_name, 120));
  await admin.from('beta_email_deliveries').upsert({
    user_id: userId,
    event_type: 'beta_activated',
    recipient_email: email || 'unknown',
    status: result.status,
    provider_message_id: result.provider_message_id || null,
    error_message: result.error_message || null,
    sent_at: result.status === 'sent' ? new Date().toISOString() : null,
  }, { onConflict: 'user_id,event_type' });
  return result;
}

async function audit(admin: any, chatId: string, command: string, outcome: 'read' | 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'failed', targetUserId?: string | null, details: Record<string, unknown> = {}) {
  await admin.from('operator_command_audit').insert({
    telegram_chat_id: chatId,
    command,
    target_user_id: targetUserId || null,
    outcome,
    details,
  });
}

async function resolveUser(admin: any, identifier: string): Promise<ResolvedUser | null> {
  const lookup = text(identifier, 180);
  if (!lookup) return null;
  const query = admin.from('profiles').select('id, display_name, email, series, mention, signup_intent, signup_entrypoint, signup_route, signup_device_class, signup_browser, signup_context_consent_at, created_at, updated_at');
  const { data, error } = lookup.includes('@')
    ? await query.ilike('email', lookup.toLowerCase()).maybeSingle()
    : await query.eq('id', lookup).maybeSingle();
  if (error || !data?.id) return null;
  return data as ResolvedUser;
}

async function boundedCount(admin: any, table: string, limit = 2_000) {
  const { data, error } = await admin.from(table).select('*').limit(limit);
  if (error) {
    const details = typeof error === 'object' ? JSON.stringify(error) : String(error);
    throw new Error(`Lecture ${table} impossible : ${text(details, 360)}`);
  }
  return (data || []).length;
}

function assertRead(result: { error: unknown }, source: string) {
  if (!result.error) return;
  const details = typeof result.error === 'object' ? JSON.stringify(result.error) : String(result.error);
  throw new Error(`Lecture ${source} impossible : ${text(details, 360)}`);
}

async function beginInputSession(admin: any, chatId: string, command: InputSession['origin_command']) {
  const isUserLookup = command === '/user' || command === '/user_delete';
  const session: InputSession = {
    telegram_chat_id: chatId,
    expected_input: isUserLookup ? 'user_identifier' : 'beta_user_identifier',
    origin_command: command,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
  const { error } = await admin.from('operator_input_sessions').upsert(session, { onConflict: 'telegram_chat_id' });
  if (error) throw new Error('Session de saisie impossible.');
  const prompt = command === '/user_delete'
    ? 'Envoie maintenant l’adresse e-mail exacte ou l’ID BacPilot du compte à supprimer.\n\nAucune suppression ne sera effectuée avant la confirmation renforcée. Réponds /cancel pour annuler.'
    : isUserLookup
      ? 'Envoie maintenant l’adresse e-mail exacte ou l’ID BacPilot de l’utilisateur.\n\nRéponds /cancel pour annuler.'
      : `Envoie maintenant l’adresse e-mail exacte ou l’ID BacPilot pour ${command}.\n\nRéponds /cancel pour annuler.`;
  await audit(admin, chatId, command, 'pending', null, { expected_input: session.expected_input });
  return prompt;
}

async function getInputSession(admin: any, chatId: string) {
  const { data, error } = await admin
    .from('operator_input_sessions')
      .select('telegram_chat_id, expected_input, origin_command, pending_action_id, menu_state, menu_context, expires_at')
    .eq('telegram_chat_id', chatId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error('Session de saisie indisponible.');
  if (!data) {
    await admin.from('operator_input_sessions').delete().eq('telegram_chat_id', chatId);
    return null;
  }
  return data as InputSession;
}

async function clearInputSession(admin: any, chatId: string) {
  await admin.from('operator_input_sessions').delete().eq('telegram_chat_id', chatId);
}

function userLabel(user: { display_name?: unknown; email?: unknown; id?: unknown }) {
  return text(user.display_name, 80) || text(user.email, 120) || text(user.id, 120);
}

async function getStatusMessage(admin: any) {
  const [programmes, profiles, activeBetas] = await Promise.all([
    admin.from('live_programmes').select('programme_id, observed_at').order('observed_at', { ascending: false }).limit(2_000),
    admin.from('profiles').select('id').limit(2_000),
    admin.from('beta_testers').select('user_id').eq('status', 'active').limit(2_000),
  ]);
  assertRead(programmes, 'live_programmes');
  assertRead(profiles, 'profiles');
  assertRead(activeBetas, 'beta_testers');

  return [
    'BacPilot — état rapide',
    '',
    `Filières observées : ${(programmes.data || []).length}`,
    `Dernière observation : ${formatDate(programmes.data?.[0]?.observed_at)}`,
    `Comptes créés : ${(profiles.data || []).length}`,
    `Bêta-testeurs actifs : ${(activeBetas.data || []).length}`,
  ].join('\n');
}

async function getStatsMessage(admin: any) {
  const [profileCount, betaCount, feedbackCount, observationCount, recommendationCount] = await Promise.all([
    boundedCount(admin, 'profiles'),
    admin.from('beta_testers').select('user_id').eq('status', 'active').limit(2_000).then((result: any) => {
      assertRead(result, 'beta_testers');
      return (result.data || []).length;
    }),
    boundedCount(admin, 'beta_feedback'),
    boundedCount(admin, 'gauge_observations'),
    boundedCount(admin, 'recommendation_runs'),
  ]);

  return [
    'BacPilot — statistiques',
    '',
    `Utilisateurs : ${profileCount}`,
    `Bêta actifs : ${betaCount}`,
    `Retours bêta : ${feedbackCount}`,
    `Recommandations générées : ${recommendationCount}`,
    `Observations historiques : ${observationCount}`,
  ].join('\n');
}

async function getUserMessage(admin: any, user: ResolvedUser) {
  const [{ data: preferences }, { data: academicSignals }, { data: beta }, { count: activityCount, data: latestActivity }, { count: feedbackCount, data: recentFeedback }, { count: sessionCount }, { count: recommendationCount }] = await Promise.all([
    admin.from('user_preferences').select('primary_goal, career_keywords, preferred_universities, scholarship_priority, career_priority, competition_priority').eq('user_id', user.id).maybeSingle(),
    admin.from('user_academic_signals').select('strengths, subjects, notes, updated_at').eq('user_id', user.id).maybeSingle(),
    admin.from('beta_testers').select('status, cohort, joined_at, updated_at').eq('user_id', user.id).maybeSingle(),
    admin.from('beta_test_events').select('event_type, zone, route, occurred_at', { count: 'exact' }).eq('user_id', user.id).order('occurred_at', { ascending: false }).limit(1),
    admin.from('beta_feedback').select('category, severity, title, zone, status, created_at', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    admin.from('orientation_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    admin.from('recommendation_runs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const feedbackSummary = (recentFeedback || []).length
    ? (recentFeedback || []).map((item: any) => `• ${text(item.severity, 20)} · ${text(item.status, 20)} · ${text(item.title, 100)} (${formatDate(item.created_at)})`).join('\n')
    : 'Aucun retour bêta.';

  return [
    'BacPilot — fiche utilisateur',
    '',
    `Nom : ${text(user.display_name, 120) || 'Non renseigné'}`,
    `E-mail : ${text(user.email, 180) || 'Non renseigné'}`,
    `ID BacPilot : ${user.id}`,
    `Créé le : ${formatDate(user.created_at)}`,
    `Intention : ${user.signup_intent === 'beta_interest' ? 'Demande bêta — à valider' : 'Utilisation standard'}`,
    `Entrée : ${text(user.signup_entrypoint, 40) || 'direct'} · ${text(user.signup_route, 160) || 'non renseignée'}`,
    `Contexte technique : ${user.signup_intent === 'beta_interest' && user.signup_context_consent_at ? `${text(user.signup_device_class, 20) || 'type inconnu'} · ${text(user.signup_browser, 20) || 'navigateur inconnu'}` : 'non communiqué'}`,
    `Profil : série ${text(user.series, 30) || '—'} · mention ${text(user.mention, 40) || '—'}`,
    '',
    `Objectif : ${text(preferences?.primary_goal, 40) || 'Non renseigné'}`,
    `Domaines : ${Array.isArray(preferences?.career_keywords) && preferences.career_keywords.length ? preferences.career_keywords.map((item: unknown) => text(item, 60)).join(', ') : '—'}`,
    `Universités préférées : ${Array.isArray(preferences?.preferred_universities) && preferences.preferred_universities.length ? preferences.preferred_universities.map((item: unknown) => text(item, 60)).join(', ') : '—'}`,
    `Priorités bourse/carrière/concurrence : ${preferences?.scholarship_priority ?? '—'} / ${preferences?.career_priority ?? '—'} / ${preferences?.competition_priority ?? '—'}`,
    '',
    `Forces : ${Array.isArray(academicSignals?.strengths) && academicSignals.strengths.length ? academicSignals.strengths.map((item: unknown) => text(item, 60)).join(', ') : '—'}`,
    `Résultats saisis : ${compactJson(academicSignals?.subjects, 500)}`,
    `Note personnelle : ${text(academicSignals?.notes, 280) || '—'}`,
    '',
    `Statut bêta : ${text(beta?.status, 40) || 'Standard'}`,
    `Cohorte : ${text(beta?.cohort, 60) || '—'}`,
    `Activité bêta : ${activityCount ?? 0} évènement(s)${latestActivity?.[0] ? ` · dernier : ${text(latestActivity[0].event_type, 50)} (${formatDate(latestActivity[0].occurred_at)})` : ''}`,
    `Sessions d’orientation : ${sessionCount ?? 0} · recommandations : ${recommendationCount ?? 0}`,
    `Retours bêta : ${feedbackCount ?? 0}`,
    feedbackSummary,
    '',
    'Limites : aucun mot de passe, jeton, conversation privée ou capture privée n’est affiché par Telegram.',
  ].join('\n');
}

function customEmailHtml(subject: string, displayName: string, bodyText: string) {
  const safeSubject = escapeHtml(subject, 160);
  const safeName = escapeHtml(displayName || 'utilisateur BacPilot', 120);
  const safeBody = messageText(bodyText, 6000).split('\n').map((line) => escapeHtml(line, 6000)).join('<br>');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeSubject}</title></head><body style="margin:0;background:#f4f6fb;color:#172033;font-family:Arial,Helvetica,sans-serif"><div style="max-width:640px;margin:0 auto;padding:28px 16px"><div style="background:#fff;border:1px solid #e4e8f0;border-radius:20px;overflow:hidden"><div style="padding:24px 28px;background:linear-gradient(135deg,#171d3b,#321b48)"><img src="https://bacpilot.site/branding/bacpilot-mark-512.png" width="64" height="64" alt="BacPilot" style="display:block;width:64px;height:64px;object-fit:contain;margin-bottom:16px"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#fda4af;font-weight:700">BacPilot — par MHM SOLUTIONS</div><h1 style="margin:10px 0 0;color:#fff;font-size:26px;line-height:1.2">${safeSubject}</h1></div><div style="padding:28px"><p style="font-size:16px;line-height:1.6;margin-top:0">Bonjour ${safeName},</p><div style="font-size:16px;line-height:1.75;color:#303b50">${safeBody}</div></div></div><p style="font-size:12px;line-height:1.6;color:#778198;text-align:center;margin:18px 0">BacPilot — Compare. Décide. Avance.<br>Créé par Hilarus GBAGOULE · MHM SOLUTIONS<br><a href="https://bacpilot.site" style="color:#d52e59">bacpilot.site</a></p></div></body></html>`;
}

async function beginEmailSubject(admin: any, chatId: string, user: ResolvedUser) {
  const { error } = await admin.from('operator_input_sessions').upsert({
    telegram_chat_id: chatId,
    expected_input: 'email_subject',
    origin_command: '/email',
    pending_action_id: null,
    menu_state: 'email_compose',
    menu_context: { user_id: user.id },
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }, { onConflict: 'telegram_chat_id' });
  if (error) throw new Error('Session de rédaction indisponible.');
  return [`Destinataire : ${userLabel(user)} <${text(user.email, 180) || 'email absent'}>`, '', 'Étape 1/2 — écris le sujet du mail.', 'Réponds /cancel pour annuler.'].join('\n');
}

async function prepareCustomEmail(admin: any, chatId: string, userId: string, subject: string) {
  const { error } = await admin.from('operator_input_sessions').upsert({
    telegram_chat_id: chatId,
    expected_input: 'email_body',
    origin_command: '/email',
    pending_action_id: null,
    menu_state: 'email_compose',
    menu_context: { user_id: userId, subject },
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }, { onConflict: 'telegram_chat_id' });
  if (error) throw new Error('Session de rédaction indisponible.');
  return ['Étape 2/2 — écris le contenu du mail.', '', 'Tu peux utiliser plusieurs lignes. Le HTML, le CSS, le logo et les informations BacPilot seront ajoutés automatiquement.', 'Réponds /cancel pour annuler.'].join('\n');
}

async function createPendingEmail(admin: any, chatId: string, user: ResolvedUser, subject: string, bodyText: string) {
  const safeSubject = text(subject, 160);
  const safeBody = messageText(bodyText, 6000);
  if (!safeSubject || !safeBody) throw new Error('Sujet ou contenu email vide.');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await admin.from('operator_pending_actions').insert({
    telegram_chat_id: chatId,
    action: 'email_send',
    target_user_id: user.id,
    confirmation_code: makeConfirmationCode(),
    payload: { label: userLabel(user), subject: safeSubject, body_text: safeBody },
    expires_at: expiresAt,
  });
  if (error) throw new Error('Email en attente non créé.');
  await audit(admin, chatId, '/email', 'pending', user.id, { action: 'email_send', subject: safeSubject, expires_at: expiresAt });
  return [`Email préparé pour ${userLabel(user)} <${text(user.email, 180) || 'email absent'}>.`, `Sujet : ${safeSubject}`, '', '1. Confirmer l’envoi', '2. Annuler', `Expire : ${formatDate(expiresAt)}`].join('\n');
}

async function sendCustomEmail(email: string, displayName: string, subject: string, bodyText: string): Promise<BetaEmailResult> {
  if (!email) return { status: 'skipped', error_message: 'Adresse email absente du profil.' };
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return { status: 'not_configured', error_message: 'RESEND_API_KEY absente des secrets Edge Function.' };
  const configuredFrom = text(Deno.env.get('BETA_EMAIL_FROM'), 180);
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
      body: JSON.stringify({
        from,
        to: [email],
        subject: text(subject, 160),
        html: customEmailHtml(subject, displayName, bodyText),
        text: `Bonjour ${displayName || 'utilisateur BacPilot'},\n\n${messageText(bodyText, 6000)}\n\nBacPilot — par MHM SOLUTIONS`,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const providerMessage = typeof payload?.message === 'string'
        ? payload.message
        : typeof payload?.name === 'string'
          ? payload.name
          : 'Réponse fournisseur sans détail.';
      return { status: 'failed', error_message: `Resend HTTP ${response.status}: ${text(providerMessage, 180)}` };
    }
    return { status: 'sent', provider_message_id: typeof payload?.id === 'string' ? payload.id : null };
  } catch (error) {
    return { status: 'failed', error_message: error instanceof Error ? text(error.message, 180) : 'Erreur réseau email.' };
  } finally {
    clearTimeout(timeout);
  }
}

async function createPendingAction(admin: any, chatId: string, command: string, action: 'beta_activate' | 'beta_pause' | 'beta_revoke' | 'user_delete', user: ResolvedUser) {
  const code = makeConfirmationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await admin.from('operator_pending_actions').insert({
    telegram_chat_id: chatId,
    action,
    target_user_id: user.id,
    confirmation_code: code,
    payload: { label: userLabel(user) },
    expires_at: expiresAt,
  });
  if (error) throw new Error('Action en attente non créée.');
  await audit(admin, chatId, command, 'pending', user.id, { action, expires_at: expiresAt });
  const label = action === 'beta_activate'
    ? 'activer le statut bêta de'
    : action === 'beta_pause'
      ? 'mettre en pause le statut bêta de'
      : action === 'beta_revoke'
        ? 'révoquer le statut bêta de'
        : 'supprimer définitivement le compte de';
  const confirmationHint = action === 'user_delete'
    ? 'Envoie /confirm : le bot te demandera ensuite de répondre exactement SUPPRIMER.'
    : 'Envoie simplement /confirm : le bot te demandera ensuite de répondre OUI ou NON.';
  return [
    `Action préparée : ${label} ${userLabel(user)}.`,
    `Expire : ${formatDate(expiresAt)}`,
    '',
    confirmationHint,
  ].join('\n');
}

async function listPending(admin: any, chatId: string) {
  const { data: pending } = await admin
    .from('operator_pending_actions')
    .select('id, action, target_user_id, confirmation_code, expires_at')
    .eq('telegram_chat_id', chatId)
    .is('executed_at', null)
    .is('cancelled_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(10);
  if (!pending?.length) return 'Aucune action en attente.';
  const ids = pending.map((item: any) => item.target_user_id);
  const { data: profiles } = await admin.from('profiles').select('id, display_name, email').in('id', ids);
  const byId = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
  return ['BacPilot — actions en attente', '', ...pending.map((item: any) => {
    const profile = byId.get(item.target_user_id) || { id: item.target_user_id };
    return `• ${item.action} · ${userLabel(profile)} · expire ${formatDate(item.expires_at)}`;
  }), '', 'Envoie /confirm pour valider l’action la plus récente, puis choisis 1 ou 2.'].join('\n');
}

type PendingAction = {
  id: string;
  action: 'beta_activate' | 'beta_pause' | 'beta_revoke' | 'user_delete' | 'collector_revoke' | 'email_send';
  target_user_id: string;
  payload: Record<string, unknown> | null;
  expires_at: string;
};

async function executePendingAction(admin: any, chatId: string, pending: PendingAction) {
  const now = new Date().toISOString();
  const { data: lock, error: lockError } = await admin
    .from('operator_pending_actions')
    .update({ executed_at: now })
    .eq('id', pending.id)
    .is('executed_at', null)
    .is('cancelled_at', null)
    .select('id')
    .maybeSingle();
  if (lockError || !lock) return 'Cette action est déjà en cours ou indisponible.';

  if (pending.action === 'email_send') {
    const { data: profile } = await admin.from('profiles').select('email, display_name').eq('id', pending.target_user_id).maybeSingle();
    const subject = text(pending.payload?.subject, 160);
    const bodyText = messageText(pending.payload?.body_text, 6000);
    const recipientEmail = text(profile?.email, 180).toLowerCase();
    const result: BetaEmailResult = await withTimeout(sendCustomEmail(recipientEmail, text(profile?.display_name, 120), subject, bodyText), 10_000)
      .catch((error): BetaEmailResult => ({ status: 'failed', error_message: error instanceof Error ? text(error.message, 180) : 'Délai email dépassé.' }));
    const { error: deliveryLogError } = await admin.from('operator_email_deliveries').insert({
      telegram_chat_id: chatId,
      target_user_id: pending.target_user_id,
      recipient_email: recipientEmail || 'unknown',
      subject,
      body_text: bodyText,
      status: result.status,
      provider_message_id: result.provider_message_id || null,
      error_message: result.error_message || null,
      sent_at: result.status === 'sent' ? now : null,
    });
    if (deliveryLogError) console.error('Journal email opérateur impossible:', deliveryLogError.message);
    await audit(admin, chatId, '/email', 'confirmed', pending.target_user_id, {
      action: 'email_send',
      email_status: result.status,
      email_provider_message_id: result.provider_message_id || null,
      subject,
    });
    if (result.status === 'sent') return `Email envoyé à ${recipientEmail}. Référence : ${result.provider_message_id || 'confirmée par Resend'}.`;
    if (result.status === 'not_configured') return 'Email non envoyé : RESEND_API_KEY n’est pas configurée.';
    if (result.status === 'skipped') return 'Email non envoyé : le profil ne contient pas d’adresse email.';
    return `Email non envoyé. La tentative a été journalisée : ${result.error_message || 'erreur fournisseur'}.`;
  }

  if (pending.action === 'collector_revoke') {
    const collectorId = text(pending.payload?.collector_id, 80);
    if (!collectorId) throw new Error('Identifiant de collecteur absent.');
    const { data: revoked, error: revokeError } = await admin.from('collector_devices')
      .update({ status: 'revoked', revoked_at: now, revoked_reason: 'Révocation opérateur Telegram' })
      .eq('id', collectorId)
      .eq('status', 'active')
      .select('id')
      .maybeSingle();
    if (revokeError || !revoked) {
      await admin.from('operator_pending_actions').update({ executed_at: null }).eq('id', pending.id);
      throw new Error('Collecteur déjà révoqué ou introuvable.');
    }
    await audit(admin, chatId, '/confirm', 'confirmed', null, { action: pending.action, collector_id: collectorId });
    return `Action confirmée : le collecteur ${collectorId} est révoqué. Ses prochaines synchronisations seront refusées.`;
  }

  if (pending.action === 'user_delete') {
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(pending.target_user_id);
    if (authDeleteError) {
      await admin.from('operator_pending_actions').update({ executed_at: null }).eq('id', pending.id);
      throw new Error('Compte Auth non supprimé.');
    }
    const { error: profileDeleteError } = await admin.from('profiles').delete().eq('id', pending.target_user_id);
    if (profileDeleteError) {
      // L’accès a déjà été supprimé ; l’erreur est explicitement journalisée pour permettre la reprise opérateur.
      await audit(admin, chatId, '/confirm', 'failed', null, { action: pending.action, cleanup: 'profile_failed' });
      throw new Error('Accès supprimé, mais nettoyage du profil incomplet.');
    }
    await audit(admin, chatId, '/confirm', 'confirmed', null, { action: pending.action, account_removed: true });
    return 'Action confirmée : le compte et ses données BacPilot associées ont été supprimés.';
  }

  const desiredStatus = pending.action === 'beta_activate' ? 'active' : pending.action === 'beta_pause' ? 'paused' : 'revoked';
  const { error: betaError } = await admin
    .from('beta_testers')
    .upsert({ user_id: pending.target_user_id, status: desiredStatus, updated_at: now }, { onConflict: 'user_id' });
  if (betaError) {
    await admin.from('operator_pending_actions').update({ executed_at: null }).eq('id', pending.id);
    throw new Error('Statut bêta non mis à jour.');
  }

  let emailResult: BetaEmailResult | null = null;
  if (desiredStatus === 'active') {
    emailResult = await withTimeout(deliverBetaActivationEmail(admin, pending.target_user_id), 10_000)
      .catch((error) => ({ status: 'failed' as const, error_message: error instanceof Error ? text(error.message, 180) : 'Délai email dépassé.' }));
  }
  await audit(admin, chatId, '/confirm', 'confirmed', pending.target_user_id, {
    action: pending.action,
    status: desiredStatus,
    email_status: emailResult?.status || null,
    email_provider_message_id: emailResult?.provider_message_id || null,
  });
  const emailNotice = emailResult
    ? emailResult.status === 'sent'
      ? ' Email de bienvenue envoyé au candidat.'
      : emailResult.status === 'not_configured'
        ? ' Statut activé, mais email non envoyé : configure RESEND_API_KEY.'
        : emailResult.status === 'skipped'
          ? ' Statut activé, mais aucun email n’est renseigné sur le profil.'
          : ' Statut activé, mais l’envoi email a échoué ; la tentative est journalisée.'
    : '';
  return `Action confirmée : statut bêta ${desiredStatus} pour ${text(pending.payload?.label, 140) || pending.target_user_id}.${emailNotice}`;
}

async function beginConfirmationSession(admin: any, chatId: string) {
  const { data: pending } = await admin
    .from('operator_pending_actions')
    .select('id, action, target_user_id, payload, expires_at')
    .eq('telegram_chat_id', chatId)
    .is('executed_at', null)
    .is('cancelled_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!pending) return 'Aucune action à confirmer. Utilise d’abord /beta_add, /beta_pause ou /beta_revoke.';

  const expiresAt = new Date(Math.min(new Date(String(pending.expires_at)).getTime(), Date.now() + 10 * 60 * 1000)).toISOString();
  const { error } = await admin.from('operator_input_sessions').upsert({
    telegram_chat_id: chatId,
    expected_input: 'menu_choice',
    origin_command: '/confirm',
    pending_action_id: pending.id,
    menu_state: 'confirm_action',
    menu_context: { action: pending.action },
    expires_at: expiresAt,
  }, { onConflict: 'telegram_chat_id' });
  if (error) throw new Error('Confirmation conversationnelle indisponible.');

  const isUserDeletion = pending.action === 'user_delete';
  const isCollectorRevocation = pending.action === 'collector_revoke';
  const label = pending.action === 'beta_activate' ? 'activer' : pending.action === 'beta_pause' ? 'mettre en pause' : pending.action === 'beta_revoke' ? 'révoquer' : pending.action === 'collector_revoke' ? 'révoquer le collecteur' : 'envoyer un email personnalisé à';
  const targetLabel = text((pending.payload as any)?.label, 140) || pending.target_user_id;
  const description = pending.action === 'email_send'
    ? `Tu vas envoyer l’email « ${text((pending.payload as any)?.subject, 160)} » à ${targetLabel}.`
    : isUserDeletion
      ? `Tu vas supprimer définitivement le compte de ${targetLabel} ainsi que ses données BacPilot associées.`
      : isCollectorRevocation
        ? `Tu vas révoquer définitivement le collecteur ${targetLabel}. Ses prochaines synchronisations seront refusées.`
        : `Tu vas ${label} le statut bêta de ${targetLabel}.`;
  return [
    description,
    `Cette demande expire : ${formatDate(expiresAt)}`,
    '',
    isUserDeletion
      ? '1. Confirmer SUPPRIMER\n2. Annuler'
      : '1. Confirmer\n2. Annuler',
  ].join('\n');
}

async function confirmActionById(admin: any, chatId: string, pendingActionId: string) {
  const { data: pending } = await admin
    .from('operator_pending_actions')
    .select('id, action, target_user_id, payload, expires_at')
    .eq('id', pendingActionId)
    .eq('telegram_chat_id', chatId)
    .is('executed_at', null)
    .is('cancelled_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (!pending) return 'Cette action n’est plus disponible. Prépare une nouvelle action si nécessaire.';
  return executePendingAction(admin, chatId, pending as PendingAction);
}

async function cancelActionById(admin: any, chatId: string, pendingActionId: string) {
  const { data: pending } = await admin
    .from('operator_pending_actions')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('id', pendingActionId)
    .eq('telegram_chat_id', chatId)
    .is('executed_at', null)
    .is('cancelled_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('target_user_id, action')
    .maybeSingle();
  if (!pending) return 'Cette action n’est plus disponible.';
  await audit(admin, chatId, '/cancel', 'cancelled', pending.target_user_id, { action: pending.action });
  return 'Action annulée.';
}

async function confirmAction(admin: any, chatId: string, code: string) {
  const normalized = text(code, 20).toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(normalized)) return 'Envoie /confirm sans code : le bot te demandera simplement OUI ou NON.';
  const { data: pending } = await admin
    .from('operator_pending_actions')
    .select('id, action, target_user_id, payload, expires_at')
    .eq('telegram_chat_id', chatId)
    .eq('confirmation_code', normalized)
    .is('executed_at', null)
    .is('cancelled_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (!pending) return 'Aucune action valide trouvée pour ce code. Elle a peut-être expiré ou été annulée.';
  if ((pending as PendingAction).action === 'user_delete') {
    return 'Pour une suppression, envoie /confirm sans code, puis réponds exactement SUPPRIMER.';
  }
  return executePendingAction(admin, chatId, pending as PendingAction);
}

async function cancelAction(admin: any, chatId: string, code: string) {
  const normalized = text(code, 20).toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(normalized)) return 'Envoie /cancel seul pour annuler une saisie en cours.';
  const { data: pending } = await admin
    .from('operator_pending_actions')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('telegram_chat_id', chatId)
    .eq('confirmation_code', normalized)
    .is('executed_at', null)
    .is('cancelled_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('target_user_id, action')
    .maybeSingle();
  if (!pending) return 'Aucune action active trouvée pour ce code.';
  await audit(admin, chatId, '/cancel', 'cancelled', pending.target_user_id, { action: pending.action });
  return 'Action annulée.';
}

async function listBeta(admin: any, statusArgument: string) {
  const status = text(statusArgument, 20).toLowerCase();
  const query = admin.from('beta_testers').select('user_id, status, cohort, joined_at, updated_at').order('updated_at', { ascending: false }).limit(10);
  const { data: testers } = betaStatuses.has(status) ? await query.eq('status', status) : await query;
  if (!testers?.length) return `Aucun bêta-testeur${status ? ` au statut ${status}` : ''}.`;
  const { data: profiles } = await admin.from('profiles').select('id, display_name, email').in('id', testers.map((item: any) => item.user_id));
  const profilesById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
  return [
    `BacPilot — bêta-testeurs${status ? ` (${status})` : ''}`,
    '',
    ...testers.map((item: any) => {
      const profile = profilesById.get(item.user_id) || { id: item.user_id };
      return `• ${userLabel(profile)} · ${item.status} · ${text(item.cohort, 50) || '—'} · maj ${formatDate(item.updated_at)}`;
    }),
    '',
    'Limite : 10 résultats. Utilise /beta_list active, paused, revoked ou invited.',
  ].join('\n');
}

async function listFeedback(admin: any) {
  const { data: feedback } = await admin
    .from('beta_feedback')
    .select('id, user_id, category, severity, title, zone, status, created_at')
    .order('created_at', { ascending: false })
    .limit(8);
  if (!feedback?.length) return 'Aucun retour bêta enregistré.';
  const { data: profiles } = await admin.from('profiles').select('id, display_name, email').in('id', feedback.map((item: any) => item.user_id));
  const byId = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
  return [
    'BacPilot — derniers retours bêta',
    '',
    ...feedback.map((item: any) => {
      const profile = byId.get(item.user_id) || { id: item.user_id };
      return `• ${text(item.severity, 20)} · ${text(item.status, 20)} · ${text(item.title, 100)}\n  ${userLabel(profile)} · ${text(item.zone, 30) || '—'} · ${formatDate(item.created_at)}`;
    }),
    '',
    'Les captures privées et leurs chemins de stockage ne sont jamais transmis par Telegram.',
  ].join('\n');
}

async function setMenuSession(admin: any, chatId: string, menuState: string, menuContext: Record<string, unknown> = {}) {
  await admin.from('operator_input_sessions').upsert({
    telegram_chat_id: chatId,
    expected_input: 'menu_choice',
    origin_command: '/menu',
    pending_action_id: null,
    menu_state: menuState,
    menu_context: menuContext,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }, { onConflict: 'telegram_chat_id' });
}

function mainMenuText(prefix = '') {
  return [
    prefix,
    '',
    'BacPilot — menu opérateur',
    '',
    '1. Statistiques globales',
    '2. Liste des utilisateurs',
    '3. Liste des bêta-testeurs',
    '4. Retours bêta',
    '5. État de la plateforme',
    '6. Actions en attente',
    '7. Aide et commandes avancées',
    '8. Envoyer un email personnalisé',
    '',
    'Réponds avec un chiffre. 0 = revenir/fermer le menu.',
  ].filter(Boolean).join('\n');
}

async function showMainMenu(admin: any, chatId: string, prefix = '') {
  await setMenuSession(admin, chatId, 'main');
  return mainMenuText(prefix);
}

async function showUserList(admin: any, chatId: string) {
  const { data, error } = await admin.from('profiles').select('id, display_name, email, series, mention').order('created_at', { ascending: false }).limit(10);
  if (error) throw new Error('Liste des utilisateurs indisponible.');
  const users = Array.isArray(data) ? data : [];
  await setMenuSession(admin, chatId, 'users_list', { user_ids: users.map((user: any) => user.id) });
  const lines = users.map((user: any, index: number) => `${index + 1}. ${userLabel(user)} · ${text(user.series, 20) || 'série —'} · ${text(user.email, 100) || 'email —'}`);
  return [
    'BacPilot — utilisateurs récents',
    '',
    ...(lines.length ? lines : ['Aucun utilisateur trouvé.']),
    '',
    'Choisis un numéro pour ouvrir le détail.',
    '0. Retour au menu principal',
  ].join('\n');
}

async function showUserDetailMenu(admin: any, chatId: string, userId: string) {
  const user = await resolveUser(admin, userId);
  if (!user) return showUserList(admin, chatId);
  await setMenuSession(admin, chatId, 'user_detail', { user_id: user.id });
  return [
    await getUserMessage(admin, user),
    '',
    'Actions disponibles',
    '1. Activer comme bêta-testeur',
    '2. Mettre en pause le bêta',
    '3. Révoquer le bêta',
    '4. Préparer la suppression définitive',
    '5. Rédiger et envoyer un email',
    '0. Retour à la liste des utilisateurs',
  ].join('\n');
}

async function handleMenuChoice(admin: any, chatId: string, session: InputSession, input: string): Promise<string> {
  const rawChoice = text(input, 20).toLowerCase();
  const state = session.menu_state || 'main';
  const choice = state === 'confirm_action'
    ? (['oui', 'o', 'yes', 'supprimer', 'sup'].includes(rawChoice) ? '1' : ['non', 'n', 'no'].includes(rawChoice) ? '2' : rawChoice)
    : rawChoice;
  if (choice === '0') {
    if (state === 'main') {
      await clearInputSession(admin, chatId);
      return 'Menu fermé. Envoie /menu quand tu veux le rouvrir.';
    }
    return showMainMenu(admin, chatId);
  }

  if (state === 'main') {
    if (choice === '1') return showMainMenu(admin, chatId, await getStatsMessage(admin));
    if (choice === '2') return showUserList(admin, chatId);
    if (choice === '3') return showMainMenu(admin, chatId, await listBeta(admin, 'active'));
    if (choice === '4') return showMainMenu(admin, chatId, await listFeedback(admin));
    if (choice === '5') return showMainMenu(admin, chatId, await getStatusMessage(admin));
    if (choice === '6') return showMainMenu(admin, chatId, await listPending(admin, chatId));
    if (choice === '7') return showMainMenu(admin, chatId, helpMessage());
    if (choice === '8') return showUserList(admin, chatId);
    return mainMenuText('Choix non reconnu.');
  }

  if (state === 'users_list') {
    const ids = Array.isArray(session.menu_context?.user_ids) ? session.menu_context.user_ids.map((item) => text(item, 80)) : [];
    const index = Number(choice) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= ids.length) return showUserList(admin, chatId);
    return showUserDetailMenu(admin, chatId, ids[index]);
  }

  if (state === 'user_detail') {
    const userId = text(session.menu_context?.user_id, 80);
    const user = await resolveUser(admin, userId);
    if (!user) return showUserList(admin, chatId);
    if (choice === '5') return beginEmailSubject(admin, chatId, user);
    const action = choice === '1' ? 'beta_activate' : choice === '2' ? 'beta_pause' : choice === '3' ? 'beta_revoke' : choice === '4' ? 'user_delete' : null;
    if (!action) return showUserDetailMenu(admin, chatId, userId);
    const command = action === 'beta_activate' ? '/beta_add' : action === 'beta_pause' ? '/beta_pause' : action === 'beta_revoke' ? '/beta_revoke' : '/user_delete';
    await clearInputSession(admin, chatId);
    return createPendingAction(admin, chatId, command, action, user);
  }

  if (state === 'confirm_action') {
    if (choice === '1') {
      await clearInputSession(admin, chatId);
      return confirmActionById(admin, chatId, session.pending_action_id || '');
    }
    if (choice === '2') {
      await clearInputSession(admin, chatId);
      return cancelActionById(admin, chatId, session.pending_action_id || '');
    }
    return 'Choisis 1 pour confirmer ou 2 pour annuler.';
  }

  return showMainMenu(admin, chatId);
}

function helpMessage() {
  return [
    'BacPilot — console opérateur privée',
    '',
    '/status — données observées et comptes',
    '/stats — statistiques agrégées',
    '/health — vérification rapide',
    '/user [e-mail|ID] — fiche ciblée ; sans valeur, le bot demande',
    '/user_delete [e-mail|ID] — suppression définitive ; confirmation SUPPRIMER obligatoire',
    '/beta_add [e-mail|ID] — activation ; sans valeur, le bot demande',
    '/beta_pause [e-mail|ID] — pause ; sans valeur, le bot demande',
    '/beta_revoke [e-mail|ID] — révocation ; sans valeur, le bot demande',
    '/beta_list [active|paused|revoked|invited] — 10 derniers',
    '/feedback — 8 derniers retours bêta',
    '/pending — actions à confirmer',
    '/confirm — confirmer l’action la plus récente ; OUI/NON pour bêta, SUPPRIMER/NON pour suppression',
    '/cancel — annuler une saisie en cours',
    '/test — vérifier le bot',
    '/collector_issue [libellé] — générer un code d’activation à usage unique',
    '/collector_list — afficher les appareils enrôlés et leur état',
    '/collector_revoke [ID] — préparer la révocation d’un appareil ; confirmation 1/2',
    '',
    'Les statuts bêta exigent une confirmation. La suppression est irréversible, exige SUPPRIMER et toutes les actions sont journalisées.',
  ].join('\n');
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ ok: false, error: 'Méthode non autorisée.' }, 405);

  const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const operatorChatId = Deno.env.get('TELEGRAM_CHAT_ID');
  const telegramWebhookSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = getSupabaseAdminKey();
  if (!telegramToken || !operatorChatId || !telegramWebhookSecret || !supabaseUrl || !serviceRoleKey) {
    return json({ ok: false, error: 'Configuration serveur incomplète.' }, 500);
  }

  if (request.headers.get('x-telegram-bot-api-secret-token') !== telegramWebhookSecret) {
    return json({ ok: false, error: 'Webhook Telegram non autorisé.' }, 401);
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return json({ ok: false, error: 'Update Telegram invalide.' }, 400);
  }

  const sourceChatId = String(update.message?.chat?.id ?? '');
  const parsed = parseCommand(update.message?.text);
  if (sourceChatId !== operatorChatId) return json({ ok: true, ignored: true });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  let command: OperatorCommand | null = parsed.command;
  let argument = parsed.argument;
  let activeSession: InputSession | null = null;
  try {
    activeSession = await withTimeout(getInputSession(admin, sourceChatId));
  } catch (error) {
    console.error('Erreur de session Telegram:', error instanceof Error ? error.message : JSON.stringify(error));
    await sendMessage(telegramToken, operatorChatId, 'BacPilot — session temporairement indisponible. Réessaie dans quelques secondes ou utilise /cancel.').catch(() => undefined);
    // Toujours acquitter une mise à jour Telegram déjà authentifiée pour stopper les retries.
    return json({ ok: true, handled: false, error: 'Session indisponible.' }, 200);
  }

  if (!command && activeSession) {
    if (activeSession.expected_input === 'menu_choice') {
      command = '/menu';
      argument = text(update.message?.text, 180);
    } else {
      command = activeSession.origin_command;
      argument = activeSession.expected_input === 'email_body'
        ? messageText(update.message?.text, 6000)
        : text(update.message?.text, 180);
      if (!['confirmation_ack', 'email_subject', 'email_body'].includes(activeSession.expected_input)) {
        await clearInputSession(admin, sourceChatId).catch((error) => {
          console.error('Nettoyage de session Telegram impossible:', error instanceof Error ? error.message : JSON.stringify(error));
        });
      }
    }
  }

  if (!command) {
    await sendMessage(telegramToken, operatorChatId, 'Commande inconnue. Envoie /help pour voir les commandes disponibles.');
    return json({ ok: true, ignored: true });
  }

  if (activeSession && command !== '/cancel' && command !== activeSession.origin_command) {
    await clearInputSession(admin, sourceChatId).catch((error) => {
      console.error('Nettoyage de session Telegram impossible:', error instanceof Error ? error.message : JSON.stringify(error));
    });
  }

  let reply = '';
  let targetUserId: string | null = null;

  try {
    if (activeSession?.expected_input === 'email_subject' && command === '/email') {
      const userId = text(activeSession.menu_context?.user_id, 80);
      const user = await withTimeout(resolveUser(admin, userId));
      if (!user) reply = 'Utilisateur introuvable. Recommence avec /email.';
      else reply = await withTimeout(prepareCustomEmail(admin, sourceChatId, user.id, text(argument, 160)));
    } else if (activeSession?.expected_input === 'email_body' && command === '/email') {
      const userId = text(activeSession.menu_context?.user_id, 80);
      const subject = text(activeSession.menu_context?.subject, 160);
      const user = await withTimeout(resolveUser(admin, userId));
      if (!user) reply = 'Utilisateur introuvable. Recommence avec /email.';
      else {
        await withTimeout(createPendingEmail(admin, sourceChatId, user, subject, messageText(argument, 6000)));
        reply = await withTimeout(beginConfirmationSession(admin, sourceChatId));
      }
    } else if (activeSession?.expected_input === 'menu_choice' && command === '/menu') {
      reply = await withTimeout(handleMenuChoice(admin, sourceChatId, activeSession, argument));
    } else if (activeSession?.expected_input === 'confirmation_ack' && command === '/confirm' && activeSession.pending_action_id) {
      const acknowledgement = text(argument, 20).toLowerCase();
      const { data: pendingForAcknowledgement } = await admin
        .from('operator_pending_actions')
        .select('action')
        .eq('id', activeSession.pending_action_id)
        .eq('telegram_chat_id', sourceChatId)
        .is('executed_at', null)
        .is('cancelled_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      const requiresDeletePhrase = pendingForAcknowledgement?.action === 'user_delete';
      const confirmed = requiresDeletePhrase
        ? acknowledgement === 'supprimer'
        : ['oui', 'o', 'yes'].includes(acknowledgement);
      if (confirmed) {
        await clearInputSession(admin, sourceChatId);
        reply = await withTimeout(confirmActionById(admin, sourceChatId, activeSession.pending_action_id));
      } else if (['non', 'n', 'no'].includes(acknowledgement)) {
        await clearInputSession(admin, sourceChatId);
        reply = await withTimeout(cancelActionById(admin, sourceChatId, activeSession.pending_action_id));
      } else {
        reply = requiresDeletePhrase
          ? 'Action irréversible : choisis 1 pour confirmer SUPPRIMER ou 2 pour annuler. Tu peux aussi envoyer /cancel.'
          : 'Choisis 1 pour confirmer ou 2 pour annuler. Tu peux aussi envoyer /cancel.';
      }
    } else if (command === '/start' || command === '/help' || command === '/menu') {
      reply = await withTimeout(showMainMenu(admin, sourceChatId));
    } else if (command === '/status' || command === '/health') {
      reply = await withTimeout(getStatusMessage(admin));
    } else if (command === '/stats') {
      reply = await withTimeout(getStatsMessage(admin));
    } else if (command === '/test') {
      reply = 'BacPilot — test réussi. Le bot, son webhook et le contrôle de chat répondent.';
    } else if (command === '/collector_issue') {
      reply = await withTimeout(issueCollectorActivation(admin, argument || 'Extension BacPilot'));
    } else if (command === '/collector_list') {
      reply = await withTimeout(listCollectors(admin));
    } else if (command === '/collector_revoke') {
      if (!argument) reply = 'Envoie `/collector_revoke <ID>` avec l’identifiant affiché par /collector_list.';
      else reply = await withTimeout(createCollectorRevokePending(admin, sourceChatId, argument));
    } else if (command === '/user') {
      if (!argument) reply = await withTimeout(beginInputSession(admin, sourceChatId, '/user'));
      else {
        const user = await withTimeout(resolveUser(admin, argument));
        if (!user) reply = 'Utilisateur introuvable. Vérifie l’e-mail exact ou l’ID BacPilot, puis réessaie avec /user.';
        else {
          targetUserId = user.id;
          reply = await withTimeout(getUserMessage(admin, user));
        }
      }
    } else if (command === '/email') {
      if (!argument) reply = await withTimeout(showUserList(admin, sourceChatId));
      else {
        const user = await withTimeout(resolveUser(admin, argument));
        if (!user) reply = 'Utilisateur introuvable. Vérifie l’e-mail exact ou l’ID BacPilot, puis réessaie.';
        else {
          targetUserId = user.id;
          reply = await withTimeout(beginEmailSubject(admin, sourceChatId, user));
        }
      }
    } else if (command === '/user_delete') {
      if (!argument) reply = await withTimeout(beginInputSession(admin, sourceChatId, '/user_delete'));
      else {
        const user = await withTimeout(resolveUser(admin, argument));
        if (!user) reply = 'Utilisateur introuvable. Vérifie l’e-mail exact ou l’ID BacPilot, puis réessaie.';
        else {
          targetUserId = user.id;
          reply = await withTimeout(createPendingAction(admin, sourceChatId, command, 'user_delete', user));
        }
      }
    } else if (command === '/beta_add' || command === '/beta_pause' || command === '/beta_revoke') {
      if (!argument) reply = await withTimeout(beginInputSession(admin, sourceChatId, command));
      else {
        const user = await withTimeout(resolveUser(admin, argument));
        if (!user) reply = 'Utilisateur introuvable. Vérifie l’e-mail exact ou l’ID BacPilot, puis réessaie.';
        else {
          targetUserId = user.id;
          const action = command === '/beta_add' ? 'beta_activate' : command === '/beta_pause' ? 'beta_pause' : 'beta_revoke';
          reply = await withTimeout(createPendingAction(admin, sourceChatId, command, action, user));
        }
      }
    } else if (command === '/beta_list') {
      reply = await withTimeout(listBeta(admin, argument));
    } else if (command === '/feedback') {
      reply = await withTimeout(listFeedback(admin));
    } else if (command === '/pending') {
      reply = await withTimeout(listPending(admin, sourceChatId));
    } else if (command === '/cancel' && !argument) {
      await clearInputSession(admin, sourceChatId);
      reply = 'Saisie en cours annulée.';
    } else if (command === '/confirm') {
      reply = argument
        ? await withTimeout(confirmAction(admin, sourceChatId, argument))
        : await withTimeout(beginConfirmationSession(admin, sourceChatId));
    } else if (command === '/cancel') {
      reply = await withTimeout(cancelAction(admin, sourceChatId, argument));
    }

    if (!['/user_delete', '/email', '/beta_add', '/beta_pause', '/beta_revoke', '/confirm', '/cancel'].includes(command)) {
      await withTimeout(audit(admin, sourceChatId, command, 'read', targetUserId, { has_argument: Boolean(argument) })).catch((error) => {
        console.error('Audit Telegram impossible:', error instanceof Error ? error.message : JSON.stringify(error));
      });
    }
    await withTimeout(sendMessage(telegramToken, operatorChatId, reply || 'Commande traitée.'), 8_000);
    return json({ ok: true, command });
  } catch (error) {
    console.error('Erreur de commande Telegram:', error instanceof Error ? error.message : JSON.stringify(error));
    await withTimeout(audit(admin, sourceChatId, command, 'failed', targetUserId, { has_argument: Boolean(argument) })).catch(() => undefined);
    await withTimeout(sendMessage(telegramToken, operatorChatId, 'BacPilot — la commande n’a pas pu être exécutée. Réessaie avec /help ou /cancel.'), 8_000).catch(() => undefined);
    // Pour une mise à jour Telegram déjà authentifiée, répondre 200 évite la répétition infinie.
    return json({ ok: true, handled: false, error: 'Commande indisponible.' }, 200);
  }
});
