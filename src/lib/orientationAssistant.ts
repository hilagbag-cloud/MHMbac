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

export interface AssistantResponse {
  ok: boolean;
  error?: string;
  mode?: 'deterministic' | 'ai_reordered' | 'ai_rephrased' | 'fallback';
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

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await realSupabase.functions.invoke<AssistantResponse>('orientation-assistant', { body: payload });
    if (!error) return data || { ok: false, error: 'Réponse vide de l’assistant.' };
    lastError = error;
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 750));
  }

  console.warn('orientation-assistant invoke failed after retry', lastError);
  return { ok: false, error: 'La connexion avec l’assistant est temporairement instable. Réessaie dans un instant.' };
}

export function formatAssistantFreshness(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return 'date de collecte inconnue';
  if (minutes < 1) return 'mise à jour à l’instant';
  if (minutes < 60) return `mise à jour il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `mise à jour il y a ${hours} h`;
}
