import { realSupabase } from './supabase';

export type ContributorVisibility = 'private' | 'name_only' | 'profile';

export type BetaContributionSummary = {
  contribution_score: number;
  contribution_level: string;
  unique_test_actions: number;
  feedback_submitted: number;
  feedback_taken_into_account: number;
  feedback_resolved: number;
  score_exploration: number;
  score_feedback: number;
  score_taken_into_account: number;
  score_resolved: number;
};

export type BetaContributorProfile = {
  user_id: string;
  public_name: string | null;
  public_bio: string | null;
  focus_areas: string[];
  photo_path: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  visibility_level: ContributorVisibility;
  profile_consent_at: string | null;
  photo_consent_at: string | null;
  search_indexing_consent_at: string | null;
  updated_at: string;
};

export type PublicBetaContributor = {
  public_name: string;
  public_bio: string | null;
  focus_areas: string[];
  photo_path: string | null;
  photo_url: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  contribution_score: number;
  contribution_level: string;
};

const PHOTO_BUCKET = 'beta-contributor-photos';

function requireClient() {
  if (!realSupabase) throw new Error('La connexion sécurisée à BacPilot est indisponible.');
  return realSupabase;
}

function normalizeHttpsUrl(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') throw new Error();
    return parsed.toString();
  } catch {
    throw new Error(`${label} doit être une URL sécurisée commençant par https://.`);
  }
}

export async function getMyBetaContributionSummary(): Promise<BetaContributionSummary | null> {
  const client = requireClient();
  const { data, error } = await client.rpc('get_my_beta_contribution_summary');
  if (error) throw new Error(`Lecture de la contribution impossible : ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    contribution_score: Number(row.contribution_score || 0),
    contribution_level: String(row.contribution_level || 'Découvreur bêta'),
    unique_test_actions: Number(row.unique_test_actions || 0),
    feedback_submitted: Number(row.feedback_submitted || 0),
    feedback_taken_into_account: Number(row.feedback_taken_into_account || 0),
    feedback_resolved: Number(row.feedback_resolved || 0),
    score_exploration: Number(row.score_exploration || 0),
    score_feedback: Number(row.score_feedback || 0),
    score_taken_into_account: Number(row.score_taken_into_account || 0),
    score_resolved: Number(row.score_resolved || 0),
  };
}

export async function getMyBetaContributorProfile(): Promise<BetaContributorProfile | null> {
  const client = requireClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Connectez-vous pour gérer votre profil contributeur.');
  const { data, error } = await client
    .from('beta_contributor_profiles')
    .select('user_id, public_name, public_bio, focus_areas, photo_path, portfolio_url, linkedin_url, visibility_level, profile_consent_at, photo_consent_at, search_indexing_consent_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw new Error(`Lecture du profil contributeur impossible : ${error.message}`);
  return data as BetaContributorProfile | null;
}

export async function getContributorPhotoUrl(photoPath: string, expiresIn = 60 * 60): Promise<string | null> {
  const client = requireClient();
  const { data, error } = await client.storage.from(PHOTO_BUCKET).createSignedUrl(photoPath, expiresIn);
  if (error) return null;
  return data?.signedUrl || null;
}

export async function uploadMyContributorPhoto(file: File): Promise<string> {
  if (!file.type || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choisis une image JPEG, PNG ou WebP.');
  }
  if (file.size > 3 * 1024 * 1024) throw new Error('La photo doit faire moins de 3 Mo.');
  const client = requireClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Connectez-vous pour ajouter une photo.');
  const path = `${user.id}/profile-image`;
  const { error } = await client.storage.from(PHOTO_BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(`Photo non envoyée : ${error.message}`);
  return path;
}

export async function saveMyBetaContributorProfile(input: {
  publicName: string;
  publicBio: string;
  focusAreas: string[];
  portfolioUrl: string;
  linkedinUrl: string;
  visibilityLevel: ContributorVisibility;
  profileConsent: boolean;
  photoConsent: boolean;
  searchIndexingConsent: boolean;
  photoPath: string | null;
}) {
  const client = requireClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Connectez-vous pour enregistrer votre profil.');

  const publicName = input.publicName.trim();
  const isPublic = input.visibilityLevel !== 'private';
  if (isPublic && (!input.profileConsent || !input.searchIndexingConsent)) {
    throw new Error('La publication nécessite votre accord pour apparaître et être indexé sur la page des contributeurs.');
  }
  if (isPublic && (publicName.length < 2 || publicName.length > 80)) {
    throw new Error('Le nom public doit comporter entre 2 et 80 caractères.');
  }
  if (input.publicBio.trim().length > 420) throw new Error('La présentation doit comporter au maximum 420 caractères.');
  const focusAreas = input.focusAreas
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, all) => all.findIndex((value) => value.toLocaleLowerCase() === item.toLocaleLowerCase()) === index)
    .slice(0, 6)
    .map((item) => item.slice(0, 40));

  const now = new Date().toISOString();
  const payload = {
    user_id: user.id,
    public_name: publicName || null,
    public_bio: input.publicBio.trim() || null,
    focus_areas: focusAreas,
    photo_path: input.photoPath,
    portfolio_url: normalizeHttpsUrl(input.portfolioUrl, 'Le lien portfolio'),
    linkedin_url: normalizeHttpsUrl(input.linkedinUrl, 'Le lien LinkedIn'),
    visibility_level: input.visibilityLevel,
    profile_consent_at: isPublic && input.profileConsent ? now : null,
    photo_consent_at: input.visibilityLevel === 'profile' && input.photoPath && input.photoConsent ? now : null,
    search_indexing_consent_at: isPublic && input.searchIndexingConsent ? now : null,
  };

  const { error } = await client.from('beta_contributor_profiles').upsert(payload, { onConflict: 'user_id' });
  if (error) throw new Error(`Profil contributeur non enregistré : ${error.message}`);
}

export async function listPublicBetaContributors(): Promise<PublicBetaContributor[]> {
  const functionsBaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const publishableKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  if (!functionsBaseUrl || !publishableKey) throw new Error('La connexion sécurisée à BacPilot est indisponible.');
  const response = await fetch(`${functionsBaseUrl}/functions/v1/public-beta-contributors?limit=24`, {
    headers: { apikey: publishableKey },
  });
  if (!response.ok) throw new Error('Contributeurs indisponibles pour le moment.');
  const payload = await response.json();
  const rows = Array.isArray(payload?.contributors) ? payload.contributors : [];
  return rows.map((row: Record<string, unknown>) => ({
    public_name: String(row.public_name || ''),
    public_bio: row.public_bio ? String(row.public_bio) : null,
    focus_areas: Array.isArray(row.focus_areas) ? row.focus_areas.map(String) : [],
    photo_path: null,
    photo_url: row.photo_url ? String(row.photo_url) : null,
    portfolio_url: row.portfolio_url ? String(row.portfolio_url) : null,
    linkedin_url: row.linkedin_url ? String(row.linkedin_url) : null,
    contribution_score: Number(row.contribution_score || 0),
    contribution_level: String(row.contribution_level || 'Découvreur bêta'),
  }));
}
