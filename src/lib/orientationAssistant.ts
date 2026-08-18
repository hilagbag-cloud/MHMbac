import { realSupabase } from './supabase';
import { BacMention, BacSeries, PrimaryGoal } from '../types/orientation';

export type AssistantAction = 'answer' | 'recommend' | 'explain' | 'programme_details';

export interface AssistantRecommendation {
  programme_id: number;
  university: string;
  school: string;
  programme: string;
  confidence: 'low' | 'medium' | 'high';
  observed_at: string | null;
  updated_at: string | null;
  freshness_minutes: number | null;
  factors: {
    scholarships_observed?: number;
    applicants_observed?: number;
    selected_mention_observed?: number;
    scholarship_signal?: number;
    scholarship_rate_signal?: number;
    scholarship_volume_signal?: number;
    general_pressure_signal?: number;
    mention_pressure_signal?: number;
    career_match_signal?: number;
    career_keywords_used?: string[];
    [key: string]: unknown;
  };
  caveats: string[];
  rationale?: string;
}

export interface AssistantProgrammeRankingRule {
  subjects: Array<{ key: string; label: string; coefficient: number }>;
  calculated_average: number | null;
  missing_subjects: string[];
  source_pdf_page: number;
  verification_status: 'source_explicit' | 'verified' | 'needs_review';
}

export interface AssistantGuideReference {
  recommendation_programme: string;
  match_type: 'exact' | 'search';
  source_pdf_page: number;
  establishment: string;
  locality?: string;
  programme: string;
  entry_mode: string;
  scholarship_quota: number | null;
  aid_or_fpp_quota: number | null;
  recommended_baccalaureates: string[];
  key_subjects: string[];
  career_outcomes: string[];
  source_excerpt: string;
  completeness: 'complete' | 'partial';
  verification_status: 'extracted' | 'needs_source_check' | 'verified';
  ranking_rule?: AssistantProgrammeRankingRule;
}

export interface AssistantQuota {
  used_calls: number;
  base_daily_limit: number;
  referral_bonus_calls: number;
  daily_limit: number;
  remaining_calls: number;
  confirmed_referrals: number;
  referral_bonus_cap: number;
  referrals_until_next_bonus: number;
}

export interface AssistantResponse {
  ok: boolean;
  error?: string;
  mode?: 'ai_recommended' | 'ai_rephrased' | 'fallback' | 'quota_exhausted';
  ai_provider?: string | null;
  response?: string;
  next_question?: string;
  freshness?: {
    total_programmes?: number;
    last_observed_at?: string | null;
    last_updated_at?: string | null;
    age_minutes?: number | null;
    status?: 'fresh' | 'aging' | 'stale' | 'missing' | 'unknown';
  };
  recommendations?: AssistantRecommendation[];
  guide_references?: AssistantGuideReference[];
  thinking_steps?: string[];
  ai_explanations_remaining_today?: number | null;
  ai_quota?: AssistantQuota | null;
  manual_validation_required?: boolean;
}

export type AssistantPayload = {
  action?: AssistantAction;
  message?: string;
  profile_patch?: { display_name?: string; series?: BacSeries; mention?: BacMention };
  preference_patch?: { primary_goal?: PrimaryGoal; career_keywords?: string[]; free_intent?: string | null };
  academic_patch?: { strengths?: string[]; notes?: string; notes_enabled?: boolean; ranking_subjects?: Record<string, number>; subjects?: Record<string, number> };
  programme_id?: number;
};

export async function askOrientationAssistant(payload: AssistantPayload): Promise<AssistantResponse> {
  if (!realSupabase) {
    return { ok: false, error: 'La connexion sécurisée à Supabase est indisponible.' };
  }

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const publishableKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const { data: sessionData } = await realSupabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!supabaseUrl || !publishableKey || !accessToken) {
    return { ok: false, error: 'Ta session a expiré. Connecte-toi à nouveau avant de continuer.' };
  }

  let lastFailure = '';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/orientation-assistant`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: publishableKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null) as AssistantResponse | null;
      if (response.ok && data) return data;
      lastFailure = data?.error || `HTTP ${response.status}`;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : 'Erreur réseau inconnue.';
    }
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 750));
  }

  console.warn('orientation-assistant request failed after retry', lastFailure);
  return { ok: false, error: `La connexion avec l’assistant a échoué (${lastFailure}). Réessaie dans un instant.` };
}

export function formatAssistantFreshness(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return 'date de collecte inconnue';
  if (minutes < 1) return 'mise à jour à l’instant';
  if (minutes < 60) return `mise à jour il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `mise à jour il y a ${hours} h`;
}
