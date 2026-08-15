import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bookmark, Bot, CheckCircle2, ChevronRight, CircleAlert, LoaderCircle, MessageCircle, RefreshCw, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { askOrientationAssistant, AssistantRecommendation, AssistantResponse, formatAssistantFreshness } from '../lib/orientationAssistant';
import { formatFreshness, useLiveProgrammes } from '../lib/liveProgrammes';
import { LiveProgramme, PrimaryGoal } from '../types/orientation';

interface DashboardPageProps { navigate: (route: string) => void; }

function liveScore(row: LiveProgramme, goal: PrimaryGoal): number {
  if (row.score_opportunity != null) return row.score_opportunity;
  if (goal === 'bourse') return Math.max(0, Math.min(100, Math.round((row.scholarships / Math.max(row.total, 1)) * 100)));
  if (goal === 'carriere') return Math.max(0, Math.min(100, Math.round((1 - row.passable / Math.max(row.total, 1)) * 100)));
  return Math.max(0, Math.min(100, Math.round(((row.scholarships / Math.max(row.total, 1)) * 50) + ((1 - row.passable / Math.max(row.total, 1)) * 50))));
}

function confidenceLabel(confidence: AssistantRecommendation['confidence']) {
  if (confidence === 'high') return 'Données récentes';
  if (confidence === 'medium') return 'Données à surveiller';
  return 'Données anciennes';
}

function objectiveTitle(goal: PrimaryGoal) {
  if (goal === 'bourse') return 'tes chances de bourse';
  if (goal === 'carriere') return 'ton objectif carrière';
  return 'le meilleur équilibre bourse et carrière';
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  const { profile, preferences, updatePreferences } = useAuth();
  const [goal, setGoal] = useState<PrimaryGoal>(preferences?.primary_goal || 'bourse');
  const [selected, setSelected] = useState<number[]>([]);
  const [assistant, setAssistant] = useState<AssistantResponse | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const live = useLiveProgrammes(100);
  const keywords = preferences?.career_keywords || [];

  const rows = useMemo(() => [...live.rows].sort((a, b) => {
    const aMatch = keywords.some((word) => `${a.programme} ${a.school}`.toLowerCase().includes(word.toLowerCase()));
    const bMatch = keywords.some((word) => `${b.programme} ${b.school}`.toLowerCase().includes(word.toLowerCase()));
    if ((goal === 'carriere' || goal === 'equilibre') && aMatch !== bMatch) return Number(bMatch) - Number(aMatch);
    return liveScore(b, goal) - liveScore(a, goal);
  }), [live.rows, goal, keywords]);

  const runAnalysis = async (nextGoal: PrimaryGoal = goal) => {
    setAnalysisError(null);
    setExplanation(null);
    setIsAnalysing(true);
    setAssistant({
      ok: true,
      thinking_steps: [
        'Vérification de la dernière synchronisation',
        `Lecture de ${live.rows.length} filière(s) observée(s)`,
        'Calcul des trois pistes selon ton profil',
      ],
    });
    const result = await askOrientationAssistant({ action: 'recommend' });
    setIsAnalysing(false);
    if (!result.ok) {
      setAnalysisError(result.error || 'L’analyse est indisponible pour le moment.');
      return;
    }
    setAssistant(result);
  };

  useEffect(() => {
    if (profile?.series && profile?.mention && preferences?.primary_goal && live.rows.length && !assistant && !isAnalysing) {
      void runAnalysis();
    }
  // L’analyse est relancée manuellement lorsque les données live changent afin de ne pas générer de requêtes inutiles.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.series, profile?.mention, preferences?.primary_goal, live.rows.length]);

  const changeGoal = async (next: PrimaryGoal) => {
    setGoal(next);
    const saved = await updatePreferences({
      primary_goal: next,
      scholarship_priority: next === 'bourse' ? 100 : next === 'equilibre' ? 65 : 40,
      career_priority: next === 'carriere' ? 100 : next === 'equilibre' ? 65 : 40,
      competition_priority: next === 'bourse' ? 70 : 60,
    });
    if (!saved) {
      setAnalysisError('Ton objectif n’a pas été enregistré. Réessaie avant de relancer l’analyse.');
      return;
    }
    await runAnalysis(next);
  };

  const askForExplanation = async () => {
    if (!question.trim() || isExplaining) return;
    setIsExplaining(true);
    setExplanation(null);
    const result = await askOrientationAssistant({ action: 'explain', message: question.trim() });
    setIsExplaining(false);
    if (!result.ok) {
      setAnalysisError(result.error || 'Je ne peux pas approfondir cette réponse maintenant.');
      return;
    }
    setQuestion('');
    setExplanation(result.response || 'Les éléments utilisés sont déjà affichés dans les trois pistes.');
    setAssistant((current) => current ? { ...current, ai_explanations_remaining_today: result.ai_explanations_remaining_today ?? current.ai_explanations_remaining_today } : result);
  };

  const toggle = (id: number) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const recommendations = assistant?.recommendations || [];
  const freshness = assistant?.freshness?.age_minutes ?? null;

  return <main className="min-h-[70vh] bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:py-12"><div className="mx-auto max-w-6xl space-y-8">
    <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-500">Assistant BacPilot</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Bonjour {profile?.display_name || 'candidat'}.</h1><p className="mt-2 text-sm text-slate-500">{profile?.series ? `Série ${profile.series}` : 'Série non renseignée'}{profile?.mention ? ` · Mention ${profile.mention}` : ''} · Classements basés sur les observations disponibles.</p></div><button onClick={() => navigate('/onboarding')} className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-rose-400 dark:border-slate-700">Modifier mon profil <ArrowRight className="h-4 w-4" /></button></header>

    <section className="border-y border-slate-200 bg-white py-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-black">Que veux-tu privilégier ?</h2><p className="mt-1 text-sm text-slate-500">Le moteur recalcule les trois pistes à partir des observations réelles.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => void changeGoal('bourse')} className={`rounded-full px-4 py-2 text-sm font-bold ${goal === 'bourse' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>Bourse</button><button onClick={() => void changeGoal('carriere')} className={`rounded-full px-4 py-2 text-sm font-bold ${goal === 'carriere' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>Carrière</button><button onClick={() => void changeGoal('equilibre')} className={`rounded-full px-4 py-2 text-sm font-bold ${goal === 'equilibre' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>Équilibre</button></div></div></section>

    <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl shadow-slate-900/15"><div className="grid gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-9"><div className="border-b border-slate-800 pb-7 lg:border-b-0 lg:border-r lg:pr-8 lg:pb-0"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500"><Bot className="h-5 w-5" /></div><div><p className="font-black">Analyse BacPilot</p><p className="text-xs text-slate-400">{freshness !== null ? formatAssistantFreshness(freshness) : `dernière collecte ${formatFreshness(live.lastUpdated)}`}</p></div></div><div className="mt-6 space-y-3">{(assistant?.thinking_steps || ['En attente de l’analyse.']).map((item, index) => <div key={`${item}-${index}`} className="flex items-start gap-3 text-sm text-slate-300">{isAnalysing && index === (assistant?.thinking_steps?.length || 1) - 1 ? <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-rose-300" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />}<span>{item}</span></div>)}</div><button onClick={() => void runAnalysis()} disabled={isAnalysing} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-rose-200 transition hover:text-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${isAnalysing ? 'animate-spin' : ''}`} />Actualiser l’analyse</button></div>
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-300">Top 3 selon {objectiveTitle(goal)}</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Trois pistes à vérifier.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{assistant?.response || 'Je prépare une lecture fondée sur les dernières observations synchronisées.'}</p>{analysisError && <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl bg-rose-500/15 p-4 text-sm text-rose-100"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{analysisError}</p>}</div></div></section>

    {recommendations.length > 0 && <section><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-500">Résultats calculés</p><h2 className="mt-1 text-2xl font-black">Les trois pistes de l’assistant</h2></div><span className={`text-xs font-bold ${live.realtime === 'connected' ? 'text-emerald-600' : 'text-slate-500'}`}>{live.realtime === 'connected' ? '● Observations live connectées' : '○ Reconnexion des données'}</span></div><div className="grid gap-4 lg:grid-cols-3">{recommendations.map((item, index) => { const factors = item.factors || {}; return <article key={item.programme_id} className={`relative rounded-3xl border bg-white p-5 dark:bg-slate-900 ${index === 0 ? 'border-rose-400 ring-1 ring-rose-300/50 dark:border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">#{index + 1} · {item.university}</p><h3 className="mt-2 text-lg font-black">{item.programme}</h3><p className="mt-1 text-xs text-slate-500">{item.school}</p></div><div className="text-right"><strong className="text-3xl text-rose-500">{item.score}</strong><span className="block text-[10px] font-bold uppercase text-slate-400">score /100</span></div></div>{index === 0 && <p className="mt-4 inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"><Sparkles className="h-3.5 w-3.5" />Meilleur compromis observé</p>}<div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300"><p><strong>{Number(factors.scholarships_observed ?? 0)}</strong> bourse(s) observée(s) pour <strong>{Number(factors.applicants_observed ?? 0)}</strong> inscription(s).</p><p><strong>{Number(factors.selected_mention_observed ?? 0)}</strong> inscription(s) observée(s) pour ta mention.</p><p className="font-semibold text-slate-500">{confidenceLabel(item.confidence)} · {formatAssistantFreshness(item.freshness_minutes)}</p></div><button onClick={() => toggle(item.programme_id)} className={`mt-5 inline-flex items-center gap-2 text-sm font-bold ${selected.includes(item.programme_id) ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}><Bookmark className="h-4 w-4" />{selected.includes(item.programme_id) ? 'Piste retenue' : 'Retenir cette piste'}</button></article>; })}</div></section>}

    <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/25 sm:p-6"><div className="flex items-start gap-3"><MessageCircle className="mt-1 h-5 w-5 shrink-0 text-indigo-500" /><div className="w-full"><h2 className="font-black">Besoin d’une explication plus précise ?</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Demande pourquoi une piste ressort, ou ce que les données permettent réellement de conclure. L’assistant reformule les résultats calculés ; il ne les invente pas.</p><div className="mt-4 flex gap-2 rounded-2xl border border-indigo-200 bg-white p-2 dark:border-indigo-900 dark:bg-slate-900"><input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void askForExplanation(); }} placeholder="Ex. Pourquoi la première piste est-elle la plus favorable ?" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" /><button onClick={() => void askForExplanation()} disabled={!question.trim() || isExplaining} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></div>{isExplaining && <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Préparation d’une réponse concise…</p>}{explanation && <div className="mt-4 rounded-2xl border border-indigo-100 bg-white p-4 text-sm leading-6 text-slate-700 dark:border-indigo-900 dark:bg-slate-900 dark:text-slate-200"><p className="font-bold text-indigo-600 dark:text-indigo-300">BacPilot</p><p className="mt-2">{explanation}</p>{assistant?.ai_explanations_remaining_today !== null && assistant?.ai_explanations_remaining_today !== undefined && <p className="mt-3 text-xs text-slate-400">Explications IA restantes aujourd’hui : {assistant.ai_explanations_remaining_today}</p>}</div>}</div></div></section>

    <section><div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Observations complètes</p><h2 className="mt-1 text-2xl font-black">Classement en temps réel</h2><p className="mt-1 text-sm text-slate-500">{live.rows.length} filière(s) observée(s) · dernière collecte {formatFreshness(live.lastUpdated)}</p></div></div>{live.loading && <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 dark:bg-slate-900">Chargement des données observées…</div>}{live.error && <div className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700 dark:bg-rose-950/30">Les données live sont momentanément indisponibles : {live.error}</div>}{!live.loading && !live.error && rows.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">Aucune donnée réelle disponible. Lance une collecte depuis l’extension.</div>}<div className="grid gap-4 md:grid-cols-2">{rows.map((row, index) => <article key={row.programme_id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-slate-400">#{index + 1} · {row.university} · {row.school}</p><h3 className="mt-2 font-bold">{row.programme}</h3></div><div className="text-right"><strong className="text-2xl text-rose-500">{liveScore(row, goal)}</strong><span className="block text-[10px] uppercase text-slate-400">score observé</span></div></div><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800"><strong>{row.scholarships}</strong><span className="block text-slate-500">bourses</span></div><div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800"><strong>{row.passable}</strong><span className="block text-slate-500">Passable</span></div><div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800"><strong>{row.total}</strong><span className="block text-slate-500">inscrits</span></div></div><button onClick={() => toggle(row.programme_id)} className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${selected.includes(row.programme_id) ? 'text-emerald-600' : 'text-slate-500'}`}><Bookmark className="h-4 w-4" />{selected.includes(row.programme_id) ? 'Proposition sélectionnée' : 'Sélectionner cette proposition'}</button></article>)}</div></section>
  </div></main>;
};
export default DashboardPage;
