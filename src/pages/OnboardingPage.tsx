import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleHelp } from 'lucide-react';
import { BacMention, BacSeries, PrimaryGoal } from '../types/orientation';
import { useAuth } from '../context/AuthContext';

interface OnboardingPageProps { navigate: (route: string) => void; }

const seriesOptions: { value: BacSeries; label: string }[] = [
  { value: 'A', label: 'Série A' }, { value: 'B', label: 'Série B' }, { value: 'C', label: 'Série C' },
  { value: 'D', label: 'Série D' }, { value: 'E', label: 'Série E' }, { value: 'Autre', label: 'Autre série' },
];
const mentionOptions: BacMention[] = ['Passable', 'Assez bien', 'Bien', 'Très bien'];

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ navigate }) => {
  const { profile, preferences, updateProfile, updatePreferences } = useAuth();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [series, setSeries] = useState<BacSeries | null>(profile?.series || null);
  const [mention, setMention] = useState<BacMention | null>(profile?.mention || null);
  const [goal, setGoal] = useState<PrimaryGoal>(preferences?.primary_goal || 'bourse');
  const [career, setCareer] = useState(preferences?.career_keywords?.[0] || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = useMemo(() => [
    { title: 'Comment devons-nous t’appeler ?', help: 'Ton prénom ou ton nom sert uniquement à personnaliser ton espace.', valid: displayName.trim().length >= 2 },
    { title: 'Quelle est ta série au Bac ?', help: 'Nous l’afficherons dans ton profil. La compatibilité officielle dépendra des données disponibles.', valid: Boolean(series) },
    { title: 'Quelle mention as-tu obtenue ?', help: 'Cette information sera conservée avec ton profil pour les prochaines améliorations.', valid: Boolean(mention) },
    { title: 'Quel résultat veux-tu privilégier ?', help: 'Le classement sera présenté selon cet objectif, à partir des relevés réels disponibles.', valid: Boolean(goal) },
    { title: 'Quel domaine ou métier t’intéresse ?', help: goal === 'carriere' ? 'Écris un domaine, un métier ou plusieurs mots séparés par des virgules.' : 'Cette question est facultative pour l’objectif bourse.', valid: goal === 'bourse' || career.trim().length >= 2 },
  ], [displayName, series, mention, goal, career]);

  const next = () => { setError(null); if (!questions[step].valid) { setError('Réponds à cette question pour continuer.'); return; } setStep((current) => Math.min(questions.length - 1, current + 1)); };
  const previous = () => { setError(null); setStep((current) => Math.max(0, current - 1)); };
  const save = async () => {
    if (!questions[step].valid) { setError('Réponds à cette question pour terminer.'); return; }
    setSaving(true); setError(null);
    try {
      await updateProfile({ display_name: displayName.trim(), series, mention });
      await updatePreferences({ primary_goal: goal, career_keywords: career.split(',').map((item) => item.trim()).filter(Boolean), scholarship_priority: goal === 'bourse' ? 100 : 40, career_priority: goal === 'carriere' ? 100 : 40, competition_priority: 60 });
      navigate('/dashboard');
    } catch (err) { setError(err instanceof Error ? err.message : 'Impossible d’enregistrer ton profil.'); }
    finally { setSaving(false); }
  };

  return <main className="min-h-[70vh] bg-slate-50 dark:bg-slate-950 px-4 py-10 text-slate-900 dark:text-white">
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between text-sm text-slate-500"><span>Ton profil d’orientation</span><span>{step + 1} / {questions.length}</span></div>
      <div className="mb-10 flex gap-2">{questions.map((_, index) => <div key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-800'}`} />)}</div>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <div className="mb-8 flex items-start gap-3"><CircleHelp className="mt-1 h-5 w-5 text-rose-500" /><div><p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Question {step + 1}</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">{questions[step].title}</h1><p className="mt-2 text-sm leading-relaxed text-slate-500">{questions[step].help}</p></div></div>
        {step === 0 && <input autoFocus value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ex. Hilarus Gbagoule" className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 outline-none focus:border-rose-500 dark:border-slate-700" />}
        {step === 1 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{seriesOptions.map((option) => <button key={option.value} onClick={() => setSeries(option.value)} className={`rounded-xl border px-4 py-4 text-left font-semibold ${series === option.value ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : 'border-slate-200 dark:border-slate-700'}`}>{series === option.value && <Check className="mb-2 h-4 w-4" />}{option.label}</button>)}</div>}
        {step === 2 && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{mentionOptions.map((option) => <button key={option} onClick={() => setMention(option)} className={`rounded-xl border px-4 py-4 text-left font-semibold ${mention === option ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : 'border-slate-200 dark:border-slate-700'}`}>{mention === option && <Check className="mb-2 h-4 w-4" />}{option}</button>)}</div>}
        {step === 3 && <div className="grid gap-3 sm:grid-cols-2"><button onClick={() => setGoal('bourse')} className={`rounded-xl border p-5 text-left ${goal === 'bourse' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700'}`}><strong>Classement selon mes chances de bourse</strong><p className="mt-2 text-sm text-slate-500">Priorise les bourses observées et la concurrence mesurée.</p></button><button onClick={() => setGoal('carriere')} className={`rounded-xl border p-5 text-left ${goal === 'carriere' ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-700'}`}><strong>Classement selon mon objectif carrière</strong><p className="mt-2 text-sm text-slate-500">Met en avant les données live, puis ton domaine d’intérêt.</p></button></div>}
        {step === 4 && <input autoFocus value={career} onChange={(event) => setCareer(event.target.value)} placeholder={goal === 'carriere' ? 'Ex. informatique, santé, agronomie' : 'Facultatif pour la bourse'} className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 outline-none focus:border-rose-500 dark:border-slate-700" />}
        {error && <p className="mt-6 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
        <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800"><button onClick={previous} disabled={step === 0 || saving} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Retour</button>{step < questions.length - 1 ? <button onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white">Continuer <ArrowRight className="h-4 w-4" /></button> : <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Enregistrement…' : 'Voir mon classement'} <ArrowRight className="h-4 w-4" /></button>}</div>
      </section>
    </div>
  </main>;
};

export default OnboardingPage;
