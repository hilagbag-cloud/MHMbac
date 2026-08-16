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
  | '/cancel';

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
  expected_input: 'user_identifier' | 'beta_user_identifier' | 'confirmation_ack';
  origin_command: '/user' | '/user_delete' | '/beta_add' | '/beta_pause' | '/beta_revoke' | '/confirm';
  pending_action_id?: string | null;
  expires_at: string;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

const commandNames = new Set<OperatorCommand>([
  '/start', '/help', '/status', '/stats', '/health', '/test', '/user', '/user_delete',
  '/beta_add', '/beta_pause', '/beta_revoke', '/beta_list', '/feedback',
  '/pending', '/confirm', '/cancel',
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

async function audit(admin: ReturnType<typeof createClient>, chatId: string, command: string, outcome: 'read' | 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'failed', targetUserId?: string | null, details: Record<string, unknown> = {}) {
  await admin.from('operator_command_audit').insert({
    telegram_chat_id: chatId,
    command,
    target_user_id: targetUserId || null,
    outcome,
    details,
  });
}

async function resolveUser(admin: ReturnType<typeof createClient>, identifier: string): Promise<ResolvedUser | null> {
  const lookup = text(identifier, 180);
  if (!lookup) return null;
  const query = admin.from('profiles').select('id, display_name, email, series, mention, signup_intent, signup_entrypoint, signup_route, signup_device_class, signup_browser, signup_context_consent_at, created_at, updated_at');
  const { data, error } = lookup.includes('@')
    ? await query.ilike('email', lookup.toLowerCase()).maybeSingle()
    : await query.eq('id', lookup).maybeSingle();
  if (error || !data?.id) return null;
  return data as ResolvedUser;
}

async function boundedCount(admin: ReturnType<typeof createClient>, table: string, limit = 2_000) {
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

async function beginInputSession(admin: ReturnType<typeof createClient>, chatId: string, command: InputSession['origin_command']) {
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

async function getInputSession(admin: ReturnType<typeof createClient>, chatId: string) {
  const { data, error } = await admin
    .from('operator_input_sessions')
    .select('telegram_chat_id, expected_input, origin_command, pending_action_id, expires_at')
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

async function clearInputSession(admin: ReturnType<typeof createClient>, chatId: string) {
  await admin.from('operator_input_sessions').delete().eq('telegram_chat_id', chatId);
}

function userLabel(user: Pick<ResolvedUser, 'display_name' | 'email' | 'id'>) {
  return text(user.display_name, 80) || text(user.email, 120) || user.id;
}

async function getStatusMessage(admin: ReturnType<typeof createClient>) {
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

async function getStatsMessage(admin: ReturnType<typeof createClient>) {
  const [profileCount, betaCount, feedbackCount, observationCount, recommendationCount] = await Promise.all([
    boundedCount(admin, 'profiles'),
    admin.from('beta_testers').select('user_id').eq('status', 'active').limit(2_000).then((result) => {
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

async function getUserMessage(admin: ReturnType<typeof createClient>, user: ResolvedUser) {
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

async function createPendingAction(admin: ReturnType<typeof createClient>, chatId: string, command: string, action: 'beta_activate' | 'beta_pause' | 'beta_revoke' | 'user_delete', user: ResolvedUser) {
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

async function listPending(admin: ReturnType<typeof createClient>, chatId: string) {
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
  }), '', 'Envoie /confirm pour valider l’action la plus récente, puis réponds OUI ou NON.'].join('\n');
}

type PendingAction = {
  id: string;
  action: 'beta_activate' | 'beta_pause' | 'beta_revoke' | 'user_delete';
  target_user_id: string;
  payload: Record<string, unknown> | null;
  expires_at: string;
};

async function executePendingAction(admin: ReturnType<typeof createClient>, chatId: string, pending: PendingAction) {
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

  await audit(admin, chatId, '/confirm', 'confirmed', pending.target_user_id, { action: pending.action, status: desiredStatus });
  return `Action confirmée : statut bêta ${desiredStatus} pour ${text(pending.payload?.label, 140) || pending.target_user_id}.`;
}

async function beginConfirmationSession(admin: ReturnType<typeof createClient>, chatId: string) {
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

  const expiresAt = new Date(Math.min(new Date(pending.expires_at).getTime(), Date.now() + 10 * 60 * 1000)).toISOString();
  const { error } = await admin.from('operator_input_sessions').upsert({
    telegram_chat_id: chatId,
    expected_input: 'confirmation_ack',
    origin_command: '/confirm',
    pending_action_id: pending.id,
    expires_at: expiresAt,
  }, { onConflict: 'telegram_chat_id' });
  if (error) throw new Error('Confirmation conversationnelle indisponible.');

  const isUserDeletion = pending.action === 'user_delete';
  const label = pending.action === 'beta_activate' ? 'activer' : pending.action === 'beta_pause' ? 'mettre en pause' : 'révoquer';
  const targetLabel = text((pending.payload as any)?.label, 140) || pending.target_user_id;
  return [
    isUserDeletion
      ? `Tu vas supprimer définitivement le compte de ${targetLabel} ainsi que ses données BacPilot associées.`
      : `Tu vas ${label} le statut bêta de ${targetLabel}.`,
    `Cette demande expire : ${formatDate(expiresAt)}`,
    '',
    isUserDeletion
      ? 'Action irréversible : réponds exactement SUPPRIMER pour confirmer ou NON pour annuler.'
      : 'Réponds simplement OUI pour confirmer ou NON pour annuler.',
  ].join('\n');
}

async function confirmActionById(admin: ReturnType<typeof createClient>, chatId: string, pendingActionId: string) {
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

async function cancelActionById(admin: ReturnType<typeof createClient>, chatId: string, pendingActionId: string) {
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

async function confirmAction(admin: ReturnType<typeof createClient>, chatId: string, code: string) {
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

async function cancelAction(admin: ReturnType<typeof createClient>, chatId: string, code: string) {
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

async function listBeta(admin: ReturnType<typeof createClient>, statusArgument: string) {
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

async function listFeedback(admin: ReturnType<typeof createClient>) {
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
    command = activeSession.origin_command;
    argument = text(update.message?.text, 180);
    if (activeSession.expected_input !== 'confirmation_ack') {
      await clearInputSession(admin, sourceChatId).catch((error) => {
        console.error('Nettoyage de session Telegram impossible:', error instanceof Error ? error.message : JSON.stringify(error));
      });
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
    if (activeSession?.expected_input === 'confirmation_ack' && command === '/confirm' && activeSession.pending_action_id) {
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
          ? 'Action irréversible : réponds exactement SUPPRIMER pour confirmer ou NON pour annuler. Tu peux aussi envoyer /cancel.'
          : 'Réponds simplement OUI pour confirmer ou NON pour annuler. Tu peux aussi envoyer /cancel.';
      }
    } else if (command === '/start' || command === '/help') {
      reply = helpMessage();
    } else if (command === '/status' || command === '/health') {
      reply = await withTimeout(getStatusMessage(admin));
    } else if (command === '/stats') {
      reply = await withTimeout(getStatsMessage(admin));
    } else if (command === '/test') {
      reply = 'BacPilot — test réussi. Le bot, son webhook et le contrôle de chat répondent.';
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

    if (!['/user_delete', '/beta_add', '/beta_pause', '/beta_revoke', '/confirm', '/cancel'].includes(command)) {
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
