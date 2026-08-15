import { realSupabase } from './supabase';
import { BacMention, BacSeries, PrimaryGoal } from '../types/orientation';

export type AssistantAction = 'answer' | 'recommend' | 'explain' | 'programme_details';

export interface AssistantRecommendation {
  programme_id: number;
  university: string;
  school: string;
  programme: string;
  score: number;
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

export interface AssistantResponse {
  ok: boolean;
  error?: string;
  mode?: 'deterministic' | 'ai_rephrased' | 'fallback';
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
  thinking_steps?: string[];
  ai_explanations_remaining_today?: number | null;
  manual_validation_required?: boolean;
}

export type AssistantPayload = {
  action?: AssistantAction;
  message?: string;
  profile_patch?: { display_name?: string; series?: BacSeries; mention?: BacMention };
  preference_patch?: { primary_goal?: PrimaryGoal; career_keywords?: string[] };
  academic_patch?: { strengths?: string[]; notes?: string };
  programme_id?: number;
};

export async function askOrientationAssistant(payload: AssistantPayload): Promise<AssistantResponse> {
  if (!realSupabase) {
    return { ok: false, error: 'La connexion sécurisée à Supabase est indisponible.' };
  }

  const { data, error } = await realSupabase.functions.invoke<AssistantResponse>('orientation-assistant', { body: payload });
  if (error) {
    return { ok: false, error: 'L’assistant est momentanément indisponible. Réessaie dans un instant.' };
  }
  return data || { ok: false, error: 'Réponse vide de l’assistant.' };
}

export function formatAssistantFreshness(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return 'date de collecte inconnue';
  if (minutes < 1) return 'mise à jour à l’instant';
  if (minutes < 60) return `mise à jour il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `mise à jour il y a ${hours} h`;
}
