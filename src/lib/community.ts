import { realSupabase } from './supabase';

export const OFFICIAL_CHOICE_PORTAL_URL = 'https://apresmonbac.bj/Home/choice';
export const BACPILOT_WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbDpHRNAYlUQHSqika2n';

export type PreparedChoice = {
  rank: 1 | 2 | 3;
  programme_id: number;
  programme: string;
  university: string;
  school: string;
  locality?: string;
  guide_page?: number;
  prepared_at: string;
};

export type ReferralSummary = {
  referral_code: string;
  invited_count: number;
  reward_label: string;
  next_milestone: number;
};

export type PublicReview = {
  id: string;
  rating: number;
  title: string;
  body: string;
  display_name: string;
  published_at: string | null;
};

export type FeaturedSupporter = {
  id: string;
  full_name: string;
  photo_url: string;
  note: string;
};

function requireClient() {
  if (!realSupabase) throw new Error('La connexion sécurisée à BacPilot est indisponible.');
  return realSupabase;
}

export async function savePreparedChoices(userId: string, choices: PreparedChoice[]) {
  if (choices.length < 1 || choices.length > 3) throw new Error('Sélectionne entre une et trois pistes.');
  const client = requireClient();
  const { error } = await client
    .from('candidate_choice_preparations')
    .upsert({
      user_id: userId,
      choices,
      status: 'prepared',
      official_portal_url: OFFICIAL_CHOICE_PORTAL_URL,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  if (error) throw new Error(`Préparation des choix impossible : ${error.message}`);
}

export async function getPreparedChoices(userId: string): Promise<PreparedChoice[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('candidate_choice_preparations')
    .select('choices')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`Lecture des choix impossible : ${error.message}`);
  return Array.isArray(data?.choices) ? data.choices as PreparedChoice[] : [];
}

export async function applyReferralCode(referralCode: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('apply_referral_code', { p_code: referralCode });
  if (error) throw new Error(`Parrainage impossible : ${error.message}`);
  return data as { applied: boolean; reason?: string };
}

export async function getMyReferralSummary(): Promise<ReferralSummary | null> {
  const client = requireClient();
  const { data, error } = await client.rpc('get_my_referral_summary');
  if (error) throw new Error(`Lecture du parrainage impossible : ${error.message}`);
  const summary = Array.isArray(data) ? data[0] : null;
  return summary ? {
    referral_code: String(summary.referral_code || ''),
    invited_count: Number(summary.invited_count || 0),
    reward_label: String(summary.reward_label || 'Premier partage'),
    next_milestone: Number(summary.next_milestone || 0),
  } : null;
}

export async function submitReview(input: { userId: string; rating: number; title: string; body: string; displayName: string }) {
  const client = requireClient();
  const { error } = await client.from('bacpilot_reviews').insert({
    user_id: input.userId,
    rating: input.rating,
    title: input.title.trim(),
    body: input.body.trim(),
    display_name: input.displayName.trim(),
    public_consent: true,
    status: 'pending',
  });
  if (error) throw new Error(`Avis non envoyé : ${error.message}`);
}

export async function listPublishedReviews(): Promise<PublicReview[]> {
  const client = requireClient();
  const { data, error } = await client.rpc('list_published_bacpilot_reviews', { p_limit: 24 });
  if (error) throw new Error(`Avis indisponibles : ${error.message}`);
  return Array.isArray(data) ? data as PublicReview[] : [];
}

export async function createSupportIntent(input: { userId: string; name: string; email: string; amountXof: number; message: string; recognitionConsent: boolean }) {
  const client = requireClient();
  const { error } = await client.from('support_intents').insert({
    user_id: input.userId,
    donor_name: input.name.trim(),
    contact_email: input.email.trim().toLowerCase(),
    amount_xof: Math.round(input.amountXof),
    message: input.message.trim(),
    recognition_consent: input.recognitionConsent,
    status: 'awaiting_contact',
  });
  if (error) throw new Error(`Demande de soutien non enregistrée : ${error.message}`);
}

export async function listFeaturedSupporters(): Promise<FeaturedSupporter[]> {
  const client = requireClient();
  const { data, error } = await client.rpc('list_featured_supporters', { p_limit: 24 });
  if (error) throw new Error(`Reconnaissances indisponibles : ${error.message}`);
  return Array.isArray(data) ? data as FeaturedSupporter[] : [];
}
