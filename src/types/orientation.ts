/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Types & Modèles de données pour l'orientation post-baccalauréat
 * Créateur : Hilarus GBAGOULE
 */

// `A` est conservée uniquement pour les anciens profils ; les nouveaux parcours distinguent A1 et A2,
// dont les coefficients officiels de Français, Philosophie et Histoire-Géographie diffèrent.
export type BacSeries = 'A' | 'A1' | 'A2' | 'B' | 'C' | 'D' | 'E' | 'Autre';

export type BacMention = 'Passable' | 'Assez bien' | 'Bien' | 'Très bien';

export type PrimaryGoal = 'bourse' | 'carriere' | 'equilibre';
export type SignupIntent = 'standard' | 'beta_interest';
export type SignupEntrypoint = 'direct' | 'beta_portal' | 'partner_portal' | 'other';
export type SignupDeviceClass = 'mobile' | 'tablet' | 'desktop' | 'unknown';
export type SignupBrowser = 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other';
export type AccountStatus = 'active' | 'suspended_notice';

export type AcademicSubjectScores = Record<string, number>;

export interface UserAcademicSignals {
  user_id: string;
  strengths: string[];
  subjects: AcademicSubjectScores;
  notes?: string | null;
  notes_enabled: boolean;
  ranking_subjects: AcademicSubjectScores;
  ranking_average?: number | null;
  calculation_version?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  display_name: string;
  email?: string;
  series?: BacSeries | null;
  mention?: BacMention | null;
  signup_intent?: SignupIntent;
  signup_entrypoint?: SignupEntrypoint;
  signup_route?: string | null;
  signup_device_class?: SignupDeviceClass | null;
  signup_browser?: SignupBrowser | null;
  signup_context_consent_at?: string | null;
  account_status?: AccountStatus;
  account_notice_title?: string | null;
  account_notice_body?: string | null;
  account_notice_created_at?: string | null;
  account_notice_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type BetaTesterStatus = 'invited' | 'active' | 'paused' | 'revoked';

export interface BetaTester {
  user_id: string;
  status: BetaTesterStatus;
  cohort: string;
  joined_at?: string;
  consent_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type BetaFeedbackCategory = 'bug' | 'confusion' | 'idea' | 'praise';
export type BetaFeedbackSeverity = 'low' | 'medium' | 'high' | 'blocker';
export type BetaZone = 'accueil' | 'onboarding' | 'dashboard' | 'profil' | 'extension' | 'authentification' | 'autre';

export interface UserPreferences {
  id?: string;
  user_id: string;
  primary_goal: PrimaryGoal;
  career_keywords: string[];
  free_intent?: string | null;
  preferred_universities: string[];
  scholarship_priority: number; // 0 à 100
  career_priority: number;      // 0 à 100
  competition_priority: number; // 0 à 100
  created_at?: string;
  updated_at?: string;
}

export interface DemoProgramme {
  id: string;
  university: string;
  school: string;
  programme: string;
  domain: string;
  description?: string;
  admissibleSeries: BacSeries[];
  is_demo: boolean;
  
  // Indicateurs de démonstration (clairement identifiés comme données simulées MVP1)
  demoStats: {
    estimatedCapacity: number;
    estimatedScholarships: number;
    scholarshipRatio: number; // e.g. 0.45 = 45% des admis boursiers
    competitionLevel: 'Faible' | 'Modéré' | 'Élevé' | 'Très élevé';
    competitionScore: number; // 1 to 10
    employmentRateDemo: number; // % simulé
    marketDemand: 'Forte' | 'Moyenne' | 'Émergente';
    keySubjects: string[];
    sampleCareers: string[];
  };
}

export interface ScoredProgramme {
  programme: DemoProgramme;
  /** Legacy QA-only shape; no longer used in the candidate experience. */
  score: number;
  compatibilityScore: number;
  scholarshipScore: number;
  careerScore: number;
  badge: {
    label: string;
    variant: 'emerald' | 'rose' | 'indigo' | 'amber';
  };
  reasons: string[];
}

export interface DomainSuggestion {
  id: string;
  name: string;
  iconName: string;
  description: string;
  popularCareers: string[];
}

// ============================================================================
// MODÈLES DE DONNÉES PRÉPARATOIRES (Phases futures : n8n, Extension Chrome, Alertes)
// ============================================================================

export interface LiveProgramme {
  id: number;
  university_id: number;
  university: string;
  school_id: number;
  school: string;
  programme_id: number;
  programme: string;
  scholarships: number;
  aid: number;
  tb: number;
  b: number;
  ab: number;
  passable: number;
  total: number;
  rank: number | null;
  capacity: number | null;
  applicants: number | null;
  score_version: string | null;
  score_opportunity: number | null;
  score_confidence: string | null;
  observed_at: string;
  updated_at: string;
  source: string;
}

export interface GaugeObservation {
  id: string;
  programme_id: string;
  source: 'chrome_extension' | 'n8n_crawler' | 'manual_sync';
  scholarship_ratio: number;
  competition_index: number;
  raw_payload?: Record<string, unknown>;
  recorded_at: string;
}

export interface RegistrationHistoryEntry {
  id: string;
  programme_id: string;
  academic_year: string;
  admitted_count: number;
  scholarship_count: number;
  min_bac_average?: number;
}

export interface OrientationAlert {
  id: string;
  user_id: string;
  programme_id: string;
  alert_type: 'gauge_drop' | 'competition_spike' | 'deadline_approaching';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface N8nWebhookPayload {
  sync_batch_id: string;
  timestamp: string;
  target_university: string;
  records_extracted: number;
  status: 'pending' | 'processed' | 'failed';
}

export interface ChromeExtensionObservation {
  extension_version: string;
  portal_session_id?: string;
  observed_url: string;
  scraped_fields: {
    programme_title?: string;
    places_total?: number;
    places_bourses?: number;
    current_applicants?: number;
  };
}

export interface ShortlistItem {
  id: string;
  programme_id: string;
  programme: DemoProgramme;
  order_rank: number;
  user_notes?: string;
  added_at: string;
}
