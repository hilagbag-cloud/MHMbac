import { realSupabase } from './supabase';
import type { BetaFeedbackCategory, BetaFeedbackSeverity, BetaTester, BetaZone } from '../types/orientation';

export interface BetaFeedbackInput {
  category: BetaFeedbackCategory;
  severity: BetaFeedbackSeverity;
  title: string;
  description: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  zone: BetaZone;
  route?: string;
  screenshot?: File | null;
}

export interface BetaStats {
  feedbackCount: number;
  eventCount: number;
  bugsOpen: number;
  zones: Array<{ zone: string; count: number }>;
  recentFeedback: Array<{ id: string; category: string; title: string; status: string; created_at: string }>;
}

const BUCKET = 'beta-feedback';

export function isActiveBetaTester(betaTester: BetaTester | null) {
  return betaTester?.status === 'active';
}

export async function recordBetaEvent(
  eventType: 'route_view' | 'feature_tested' | 'feedback_submitted' | 'search_used' | 'recommendation_viewed',
  zone?: BetaZone,
  route?: string,
  metadata: Record<string, unknown> = {},
) {
  if (!realSupabase) return;
  const { data: { user } } = await realSupabase.auth.getUser();
  if (!user) return;
  await realSupabase.from('beta_test_events').insert({
    user_id: user.id,
    event_type: eventType,
    zone: zone || null,
    route: route || null,
    metadata,
  });
}

export async function submitBetaFeedback(input: BetaFeedbackInput) {
  if (!realSupabase) throw new Error('Le service bêta est indisponible hors connexion.');
  const { data: { user } } = await realSupabase.auth.getUser();
  if (!user) throw new Error('Connectez-vous pour envoyer un retour bêta.');

  const feedbackId = crypto.randomUUID();
  let screenshotPath: string | null = null;
  if (input.screenshot) {
    if (input.screenshot.size > 5 * 1024 * 1024) throw new Error('La capture doit faire moins de 5 Mo.');
    if (!input.screenshot.type.startsWith('image/')) throw new Error('Le fichier doit être une image.');
    const safeName = input.screenshot.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(-80) || 'capture.png';
    screenshotPath = `${user.id}/${feedbackId}/${safeName}`;
    const { error: uploadError } = await realSupabase.storage.from(BUCKET).upload(screenshotPath, input.screenshot, { contentType: input.screenshot.type, upsert: false });
    if (uploadError) throw new Error(`Capture non envoyée : ${uploadError.message}`);
  }

  const { data, error } = await realSupabase.from('beta_feedback').insert({
    id: feedbackId,
    user_id: user.id,
    category: input.category,
    severity: input.severity,
    title: input.title.trim(),
    description: input.description.trim(),
    expected_behavior: input.expectedBehavior?.trim() || null,
    actual_behavior: input.actualBehavior?.trim() || null,
    zone: input.zone,
    route: input.route || window.location.pathname,
    screenshot_path: screenshotPath,
    user_agent: navigator.userAgent.slice(0, 500),
    app_version: 'beta-web-1',
  }).select('id, created_at').single();

  if (error) {
    if (screenshotPath) await realSupabase.storage.from(BUCKET).remove([screenshotPath]);
    throw new Error(`Retour non enregistré : ${error.message}`);
  }
  await recordBetaEvent('feedback_submitted', input.zone, input.route, { feedback_id: data.id, category: input.category });
  return data;
}

export async function getBetaStats(): Promise<BetaStats> {
  if (!realSupabase) return { feedbackCount: 0, eventCount: 0, bugsOpen: 0, zones: [], recentFeedback: [] };
  const [{ data: feedback = [], count: feedbackCount }, { data: events = [], count: eventCount }] = await Promise.all([
    realSupabase.from('beta_feedback').select('id, category, title, status, zone, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(50),
    realSupabase.from('beta_test_events').select('event_type, zone, occurred_at', { count: 'exact' }).order('occurred_at', { ascending: false }).limit(200),
  ]);
  const zones = Object.entries((feedback as Array<{ zone: string }>).reduce<Record<string, number>>((acc, item) => { acc[item.zone] = (acc[item.zone] || 0) + 1; return acc; }, {})).map(([zone, count]) => ({ zone, count }));
  return {
    feedbackCount: feedbackCount || 0,
    eventCount: eventCount || 0,
    bugsOpen: (feedback as Array<{ category: string; status: string }>).filter((item) => item.category === 'bug' && !['resolved', 'rejected', 'duplicate'].includes(item.status)).length,
    zones,
    recentFeedback: (feedback || []).slice(0, 5) as BetaStats['recentFeedback'],
  };
}
