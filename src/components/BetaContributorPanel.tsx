import React, { useEffect, useMemo, useState } from 'react';
import { Award, Camera, CheckCircle2, ExternalLink, Globe2, Link2, LoaderCircle, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  createContributorSlug,
  SEO_PROFILE_MAX_FOCUS_AREAS,
  SEO_PROFILE_MIN_BIO_LENGTH,
  isContributorProfileSeoReady,
  normalizeContributorFocusAreas,
  getContributorPhotoUrl,
  getMyBetaContributionSummary,
  getMyBetaContributorProfile,
  saveMyBetaContributorProfile,
  uploadMyContributorPhoto,
  type BetaContributionSummary,
  type ContributorPublicationStatus,
  type ContributorVisibility,
} from '../lib/betaContributors';

const visibilityOptions: Array<{ value: ContributorVisibility; status: ContributorPublicationStatus; title: string; text: string }> = [
  { value: 'private', status: 'private', title: 'Privé', text: 'Tu suis ta contribution, mais rien n’apparaît publiquement.' },
  { value: 'name_only', status: 'published_name', title: 'Nom et niveau', text: 'Ton nom choisi et ton niveau peuvent apparaître dans la communauté, sans fiche personnelle.' },
  { value: 'profile', status: 'published_profile', title: 'Fiche personnelle', text: 'Tu publies une fiche individuelle à ton nom choisi, si tu le confirmes explicitement.' },
];

function scoreTone(score: number) {
  if (score >= 80) return 'from-amber-400 to-rose-500';
  if (score >= 50) return 'from-emerald-400 to-teal-500';
  if (score >= 20) return 'from-sky-400 to-indigo-500';
  return 'from-rose-400 to-fuchsia-500';
}

function statusToVisibility(status: ContributorPublicationStatus, fallback: ContributorVisibility): ContributorVisibility {
  if (status === 'published_name') return 'name_only';
  if (status === 'published_profile') return 'profile';
  return fallback === 'private' ? 'private' : 'private';
}

export const BetaContributorPanel: React.FC<{ navigate: (route: string) => void; refreshKey?: number }> = ({ navigate, refreshKey = 0 }) => {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<BetaContributionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [publicName, setPublicName] = useState(profile?.display_name || '');
  const [publicBio, setPublicBio] = useState('');
  const [focusAreasText, setFocusAreasText] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [visibilityLevel, setVisibilityLevel] = useState<ContributorVisibility>('private');
  const [publicationStatus, setPublicationStatus] = useState<ContributorPublicationStatus>('private');
  const [publicSlug, setPublicSlug] = useState('');
  const [publicationAttestation, setPublicationAttestation] = useState(false);
  const [profileConsent, setProfileConsent] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [searchIndexingConsent, setSearchIndexingConsent] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const isPublic = publicationStatus === 'published_name' || publicationStatus === 'published_profile';
  const isCompleteProfile = publicationStatus === 'published_profile';
  const profileUrl = publicSlug ? `https://bacpilot.site/contributeurs-beta/${createContributorSlug(publicSlug)}` : '';
  const focusAreas = useMemo(() => normalizeContributorFocusAreas(focusAreasText.split(',')), [focusAreasText]);
  const seoReady = isContributorProfileSeoReady({
    publicBio,
    focusAreas,
    publicationStatus,
    profileConsent,
    searchIndexingConsent,
  });
  const progressBreakdown = useMemo(() => summary ? [
    ['Exploration', summary.score_exploration, 'Actions de test uniques'],
    ['Retours', summary.score_feedback, 'Retours enregistrés'],
    ['Pris en compte', summary.score_taken_into_account, 'Retours étudiés par l’équipe'],
    ['Résolus', summary.score_resolved, 'Retours désormais résolus'],
  ] : [], [summary]);

  const load = async () => {
    setLoading(true);
    try {
      const [nextSummary, contributor] = await Promise.all([getMyBetaContributionSummary(), getMyBetaContributorProfile()]);
      setSummary(nextSummary);
      if (contributor) {
        const nextStatus = contributor.publication_status || (contributor.visibility_level === 'profile' ? 'published_name' : 'private');
        setPublicName(contributor.public_name || profile?.display_name || '');
        setPublicBio(contributor.public_bio || '');
        setFocusAreasText((contributor.focus_areas || []).join(', '));
        setPortfolioUrl(contributor.portfolio_url || '');
        setLinkedinUrl(contributor.linkedin_url || '');
        setVisibilityLevel(statusToVisibility(nextStatus, contributor.visibility_level));
        setPublicationStatus(nextStatus);
        setPublicSlug(contributor.public_slug || '');
        setPublicationAttestation(Boolean(contributor.publication_attestation_at));
        setProfileConsent(Boolean(contributor.profile_consent_at));
        setPhotoConsent(Boolean(contributor.photo_consent_at));
        setSearchIndexingConsent(Boolean(contributor.search_indexing_consent_at));
        setPhotoPath(contributor.photo_path);
        if (contributor.photo_path) setPhotoUrl(await getContributorPhotoUrl(contributor.photo_path));
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Impossible de charger la reconnaissance bêta.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [refreshKey]);

  const chooseVisibility = (option: typeof visibilityOptions[number]) => {
    setMessage(null);
    setVisibilityLevel(option.value);
    setPublicationStatus(option.status);
    if (option.status === 'published_profile' && !publicSlug) setPublicSlug(createContributorSlug(publicName));
  };

  const save = async (status = publicationStatus) => {
    setMessage(null);
    setSaving(true);
    try {
      let nextPhotoPath = photoPath;
      if (photoFile) {
        nextPhotoPath = await uploadMyContributorPhoto(photoFile);
        setPhotoPath(nextPhotoPath);
        setPhotoUrl(await getContributorPhotoUrl(nextPhotoPath));
      }
      await saveMyBetaContributorProfile({
        publicName,
        publicBio,
        focusAreas: focusAreasText.split(','),
        portfolioUrl,
        linkedinUrl,
        visibilityLevel: statusToVisibility(status, visibilityLevel),
        publicationStatus: status,
        publicSlug,
        publicationAttestation,
        profileConsent,
        photoConsent,
        searchIndexingConsent,
        photoPath: nextPhotoPath,
      });
      if (status === 'withdrawn') {
        setMessage({ type: 'success', text: 'Ta fiche individuelle a été retirée de BacPilot et sera signalée aux moteurs de recherche comme indisponible.' });
      } else if (status === 'published_profile') {
        setMessage({ type: 'success', text: seoReady ? 'Ta fiche est publiée et rejoint automatiquement le sitemap des profils BacPilot. Les moteurs pourront la découvrir progressivement.' : 'Ta fiche est publiée et partageable. Complète la bio et les domaines indiqués pour qu’elle rejoigne automatiquement le sitemap des moteurs.' });
      } else if (status === 'published_name') {
        setMessage({ type: 'success', text: 'Ton nom et ton niveau sont publiés dans l’annuaire, sans fiche individuelle.' });
      } else {
        setMessage({ type: 'success', text: 'Tes préférences restent privées. Ton indicateur de contribution continue à se mettre à jour.' });
      }
      setPhotoFile(null);
      await load();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Le profil contributeur n’a pas pu être enregistré.' });
    } finally {
      setSaving(false);
    }
  };

  const withdraw = () => {
    if (!window.confirm('Retirer ta fiche individuelle ? Elle disparaîtra immédiatement de l’annuaire et du sitemap, sans effacer tes retours privés.')) return;
    setPublicationStatus('withdrawn');
    setVisibilityLevel('private');
    void save('withdrawn');
  };

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900">Chargement de ta reconnaissance bêta…</div>;

  return <section className="space-y-6" aria-labelledby="contribution-title">
    <div className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-rose-100"><Award className="h-3.5 w-3.5" /> Reconnaissance bêta</div><h2 id="contribution-title" className="mt-4 text-2xl font-black tracking-tight">Ta contribution rend BacPilot plus fiable.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Ton indicateur est mis à jour à partir de tes tests et des retours que l’équipe étudie. Ce n’est ni une note scolaire, ni un classement d’orientation.</p></div><button type="button" onClick={() => navigate('/contributeurs-beta')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"><Globe2 className="h-4 w-4" /> Voir la communauté</button></div>
      <div className="mt-7 grid gap-4 lg:grid-cols-[190px_1fr]"><div className={`flex min-h-44 flex-col justify-between rounded-3xl bg-gradient-to-br ${scoreTone(summary?.contribution_score || 0)} p-5 shadow-xl`}><span className="text-xs font-black uppercase tracking-[0.14em] text-white/85">Indice de contribution</span><strong className="text-6xl font-black leading-none">{summary?.contribution_score ?? 0}</strong><span className="text-sm font-bold text-white">{summary?.contribution_level || 'Découvreur bêta'}</span></div><div className="grid gap-3 sm:grid-cols-2">{progressBreakdown.map(([title, points, description]) => <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><span className="font-bold">{title}</span><b className="text-rose-200">+{points}</b></div><p className="mt-1 text-xs leading-5 text-slate-400">{description}</p></div>)}</div></div>
      <p className="mt-5 text-xs leading-5 text-slate-400">Le calcul est plafonné et détaillé : actions de test uniques, retours soumis, retours pris en compte et retours résolus. Les répétitions ne gonflent pas artificiellement l’indicateur.</p>
    </div>

    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8"><div className="flex items-start gap-3"><div className="rounded-2xl bg-rose-50 p-3 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300"><UserRound className="h-5 w-5" /></div><div><h2 className="text-xl font-black">Mon profil contributeur</h2><p className="mt-1 text-sm leading-6 text-slate-500">Tu choisis le niveau de reconnaissance. La fiche personnelle nécessite une autorisation distincte et reste retirable à tout moment.</p></div></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">{visibilityOptions.map((option) => <button key={option.value} type="button" onClick={() => chooseVisibility(option)} className={`rounded-2xl border p-4 text-left transition-colors ${visibilityLevel === option.value && publicationStatus !== 'withdrawn' ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-100 dark:bg-rose-950/20 dark:ring-rose-950/40' : 'border-slate-200 dark:border-slate-700'}`}><b className="block text-sm">{option.title}</b><span className="mt-1 block text-xs leading-5 text-slate-500">{option.text}</span></button>)}</div>
      {publicationStatus === 'withdrawn' && <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Ta dernière fiche a été retirée. Tu peux préparer un nouveau brouillon, mais rien ne sera republié sans tes nouvelles confirmations.</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Nom à afficher publiquement"><input value={publicName} onChange={(event) => setPublicName(event.target.value)} onBlur={() => { if (isCompleteProfile && !publicSlug) setPublicSlug(createContributorSlug(publicName)); }} maxLength={80} placeholder={profile?.display_name || 'Ex. Prénom N.'} /></Field><Field label="Domaines ou centres d’intérêt"><input value={focusAreasText} onChange={(event) => setFocusAreasText(event.target.value)} maxLength={160} placeholder="Ex. Technologie, design, éducation" /><span className="mt-1 block text-xs text-slate-400">Sépare les domaines par des virgules. Trois maximum pour une fiche claire.</span>{isCompleteProfile && <div className="mt-2 flex flex-wrap gap-2">{['Intelligence artificielle', 'Data science', 'Technologie', 'Design', 'Éducation', 'Entrepreneuriat'].map((area) => <button key={area} type="button" onClick={() => { const next = normalizeContributorFocusAreas([...focusAreas, area]); setFocusAreasText(next.join(', ')); }} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700">+ {area}</button>)}</div>}</Field></div>
      {isCompleteProfile && <><div className="mt-4"><Field label="Courte présentation"><textarea value={publicBio} onChange={(event) => setPublicBio(event.target.value)} maxLength={420} placeholder="Explique avec tes mots ce que tu as testé ou l’amélioration à laquelle tu as contribué." /><span className="mt-1 flex justify-between text-xs text-slate-400"><span>{SEO_PROFILE_MIN_BIO_LENGTH} caractères et un domaine pour entrer automatiquement dans le sitemap. La fiche reste partageable dès 60 caractères.</span><span>{publicBio.length}/420</span></span></Field></div><div className="mt-4"><Field label="Adresse de ma fiche BacPilot"><div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-rose-200 dark:border-slate-700 dark:bg-slate-950"><span className="flex shrink-0 items-center border-r border-slate-200 px-3 text-xs font-semibold text-slate-400 dark:border-slate-700">/contributeurs-beta/</span><input className="min-w-0 !rounded-none !border-0 !bg-transparent" value={publicSlug} onChange={(event) => setPublicSlug(createContributorSlug(event.target.value))} maxLength={56} placeholder="prenom-nom" /></div></Field>{profileUrl && <p className="mt-2 inline-flex items-center gap-2 text-xs text-rose-600"><Link2 className="h-3.5 w-3.5" /> {profileUrl}</p>}</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Portfolio (facultatif)"><input value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} type="url" placeholder="https://…" /></Field><Field label="LinkedIn (facultatif)"><input value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} type="url" placeholder="https://www.linkedin.com/in/…" /></Field></div><div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-950">{photoUrl ? <img src={photoUrl} alt="Aperçu de mon profil contributeur" className="h-full w-full object-cover" /> : <Camera className="h-5 w-5" />}</div><div className="flex-1"><label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold"><Camera className="h-4 w-4 text-rose-500" /> Ajouter ou remplacer ma photo <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhotoFile(event.target.files?.[0] || null)} /></label><p className="mt-1 text-xs leading-5 text-slate-500">JPEG, PNG ou WebP, 3 Mo maximum. La photo reste privée tant que tu ne coches pas son accord de publication.</p>{photoFile && <p className="mt-1 text-xs font-semibold text-emerald-600">{photoFile.name}</p>}</div></div></div></>}
      {isPublic && <div className="mt-6 space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"><label className="flex cursor-pointer items-start gap-3"><input checked={profileConsent} onChange={(event) => setProfileConsent(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 accent-rose-500" /><span><b>J’accepte d’apparaître comme contributeur ou contributrice BacPilot.</b><br /><small>Mon e-mail, mes données scolaires et mes retours privés ne seront jamais affichés.</small></span></label><label className="flex cursor-pointer items-start gap-3"><input checked={searchIndexingConsent} onChange={(event) => setSearchIndexingConsent(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 accent-rose-500" /><span><b>J’accepte que cette publication puisse être explorée par les moteurs de recherche.</b><br /><small>Je peux retirer cette autorisation à tout moment ; BacPilot supprimera immédiatement la fiche et son URL du sitemap.</small></span></label>{isCompleteProfile && <><label className="flex cursor-pointer items-start gap-3"><input checked={publicationAttestation} onChange={(event) => setPublicationAttestation(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 accent-rose-500" /><span><b>Je confirme avoir l’autorisation nécessaire pour publier cette fiche individuelle.</b><br /><small>Si je suis mineur ou mineure, je confirme avoir l’accord requis de mon responsable légal avant de publier mon nom, mes liens ou ma photo.</small></span></label>{photoPath && <label className="flex cursor-pointer items-start gap-3"><input checked={photoConsent} onChange={(event) => setPhotoConsent(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 accent-rose-500" /><span><b>J’accepte l’affichage de ma photo sur cette fiche et dans les résultats qui peuvent l’utiliser.</b></span></label>}</>}</div>}
      {isCompleteProfile && <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${seoReady ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100' : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100'}`}><b>{seoReady ? 'Fiche prête pour le référencement automatique' : 'Fiche partageable — référencement à compléter'}</b><p className="mt-1 text-xs leading-5">{seoReady ? 'Après enregistrement, BacPilot ajoutera automatiquement cette adresse au sitemap des profils publics.' : `Pour rejoindre automatiquement le sitemap : une bio de ${SEO_PROFILE_MIN_BIO_LENGTH} caractères minimum, 1 à ${SEO_PROFILE_MAX_FOCUS_AREAS} domaines, et les deux consentements de publication et d’indexation.`}</p></div>}
      {message && <div role="status" className={`mt-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200'}`}><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{message.text}</div>}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"><button type="button" disabled={saving} onClick={() => void save()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{saving ? 'Enregistrement…' : isCompleteProfile ? 'Publier ma fiche' : 'Enregistrer mes choix'}</button>{isCompleteProfile && profileUrl && <a href={profileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold dark:border-slate-700"><ExternalLink className="h-4 w-4" /> Prévisualiser la fiche</a>}{publicationStatus === 'published_profile' && <button type="button" disabled={saving} onClick={withdraw} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-5 py-3 text-sm font-bold text-rose-700 dark:border-rose-900/60 dark:text-rose-300"><ShieldCheck className="h-4 w-4" /> Retirer ma fiche publique</button>}</div>
    </div>
  </section>;
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">{label}<div className="mt-2 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-slate-200 [&>input]:bg-slate-50 [&>input]:px-3 [&>input]:py-3 [&>input]:text-sm [&>input]:font-normal [&>input]:outline-none [&>input]:ring-rose-200 [&>input]:focus:ring-2 dark:[&>input]:border-slate-700 dark:[&>input]:bg-slate-950 [&>textarea]:min-h-28 [&>textarea]:w-full [&>textarea]:resize-y [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-slate-200 [&>textarea]:bg-slate-50 [&>textarea]:px-3 [&>textarea]:py-3 [&>textarea]:text-sm [&>textarea]:font-normal [&>textarea]:outline-none [&>textarea]:ring-rose-200 [&>textarea]:focus:ring-2 dark:[&>textarea]:border-slate-700 dark:[&>textarea]:bg-slate-950">{children}</div></label>;
