import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, CircleHelp, UserRound } from 'lucide-react';
import { BacMention, BacSeries, PrimaryGoal } from '../types/orientation';
import { useAuth } from '../context/AuthContext';

interface OnboardingPageProps { navigate: (route: string) => void; }

const seriesOptions: { value: BacSeries; label: string }[] = [
  { value: 'A', label: 'Série A' }, { value: 'B', label: 'Série B' }, { value: 'C', label: 'Série C' },
  { value: 'D', label: 'Série D' }, { value: 'E', label: 'Série E' }, { value: 'Autre', label: 'Autre série' },
];
const mentionOptions: BacMention[] = ['Passable', 'Assez bien', 'Bien', 'Très bien'];

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ navigate }) => {
  const { user, profile, preferences, updateProfile, updatePreferences } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [series, setSeries] = useState<BacSeries | null>(profile?.series || null);
  const [mention, setMention] = useState<BacMention | null>(profile?.mention || null);
  const [goal, setGoal] = useState<PrimaryGoal>(preferences?.primary_goal || 'bourse');
  const [career, setCareer] = useState(preferences?.career_keywords?.join(', ') || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = useMemo(() => {
    const next: string[] = [];
    if (displayName.trim().length < 2) next.push('ton prénom ou ton nom');
    if (!series) next.push('ta série');
    if (!mention) next.push('ta mention');
    if (goal === 'carriere' && career.trim().length < 2) next.push('ton domaine ou métier cible');
    return next;
  }, [displayName, series, mention, goal, career]);

  const save = async () => {
    setError(null);
    if (errors.length) { setError(`Complète ${errors.join(', ')} avant de continuer.`); return; }
    if (!user) { setError('Connecte-toi ou crée ton compte pour enregistrer ton profil et accéder au dashboard personnalisé.'); return; }
    setSaving(true);
    try {
      const profileSaved = await updateProfile({ display_name: displayName.trim(), series, mention });
      const preferencesSaved = await updatePreferences({ primary_goal: goal, career_keywords: career.split(',').map((item) => item.trim()).filter(Boolean), scholarship_priority: goal === 'bourse' ? 100 : 40, career_priority: goal === 'carriere' ? 100 : 40, competition_priority: 60 });
      if (!profileSaved || !preferencesSaved) throw new Error('Le profil n’a pas pu être enregistré. Vérifie ta connexion puis réessaie.');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’enregistrer ton profil.');
    } finally { setSaving(false); }
  };

  return <main className="min-h-[70vh] bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:py-12">
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex items-start gap-4">
        <div className="rounded-2xl bg-rose-500 p-3 text-white"><UserRound className="h-6 w-6" /></div>
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">Personnaliser mon orientation</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Renseigne tout ton profil en une seule fois</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Tes réponses serviront à ordonner les relevés réels selon ton objectif. Tu pourras modifier ces informations depuis ton espace.</p></div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div><label htmlFor="display-name" className="mb-2 block text-sm font-bold">Comment devons-nous t’appeler ?</label><input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ex. Hilarus Gbagoule" className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 outline-none focus:border-rose-500 dark:border-slate-700" /></div>
            <div><p className="mb-3 text-sm font-bold">Quelle est ta série au Bac ?</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{seriesOptions.map((option) => <button type="button" key={option.value} onClick={() => setSeries(option.value)} aria-pressed={series === option.value} className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold ${series === option.value ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : 'border-slate-200 dark:border-slate-700'}`}>{series === option.value && <Check className="mb-1 h-4 w-4" />}{option.label}</button>)}</div></div>
            <div><p className="mb-3 text-sm font-bold">Quelle mention as-tu obtenue ?</p><div className="grid grid-cols-2 gap-3">{mentionOptions.map((option) => <button type="button" key={option} onClick={() => setMention(option)} aria-pressed={mention === option} className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold ${mention === option ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : 'border-slate-200 dark:border-slate-700'}`}>{mention === option && <Check className="mb-1 h-4 w-4" />}{option}</button>)}</div></div>
          </div>

          <div className="space-y-6">
            <div><p className="mb-3 text-sm font-bold">Quel classement veux-tu privilégier ?</p><div className="grid gap-3"><button type="button" onClick={() => setGoal('bourse')} aria-pressed={goal === 'bourse'} className={`rounded-2xl border p-5 text-left ${goal === 'bourse' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700'}`}><strong>Garantir au mieux ma bourse</strong><p className="mt-2 text-sm text-slate-500">Classe les observations selon les bourses et la pression mesurée.</p></button><button type="button" onClick={() => setGoal('carriere')} aria-pressed={goal === 'carriere'} className={`rounded-2xl border p-5 text-left ${goal === 'carriere' ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-700'}`}><strong>Construire mon parcours carrière</strong><p className="mt-2 text-sm text-slate-500">Met en avant les filières correspondant à ton domaine cible.</p></button></div></div>
            <div><label htmlFor="career" className="mb-2 block text-sm font-bold">Domaine ou métier cible <span className="font-normal text-slate-400">{goal === 'bourse' ? '(facultatif)' : '(obligatoire)'}</span></label><input id="career" value={career} onChange={(event) => setCareer(event.target.value)} placeholder="Ex. informatique, santé, agronomie" className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 outline-none focus:border-rose-500 dark:border-slate-700" /><p className="mt-2 text-xs text-slate-500">Tu peux inscrire plusieurs mots-clés séparés par des virgules.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800/60"><div className="flex gap-3"><CircleHelp className="h-5 w-5 shrink-0 text-rose-500" /><p className="text-slate-600 dark:text-slate-300">Le dashboard affichera uniquement les observations disponibles. Les propositions restent indicatives et la validation finale de tes choix reste manuelle.</p></div></div>
          </div>
        </div>
        {error && <p role="alert" className="mt-8 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
        <div className="mt-10 flex flex-col items-stretch justify-between gap-4 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row sm:items-center"><p className="text-xs text-slate-500">{errors.length ? `${errors.length} information(s) à compléter` : 'Profil prêt à être enregistré'}</p><button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer et voir mon dashboard'} <ArrowRight className="h-4 w-4" /></button></div>
      </section>
    </div>
  </main>;
};

export default OnboardingPage;
