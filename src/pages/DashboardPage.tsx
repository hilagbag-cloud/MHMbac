import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { askOrientationAssistant, AssistantRecommendation, AssistantResponse, formatAssistantFreshness } from '../lib/orientationAssistant';
import { formatFreshness, useLiveProgrammes } from '../lib/liveProgrammes';
import { MHM_PROMOTION_CONFIG } from '../lib/promotion';
import { LiveProgramme, PrimaryGoal } from '../types/orientation';

interface DashboardPageProps { navigate: (route: string) => void; }

function liveScore(row: LiveProgramme, goal: PrimaryGoal): number {
  if (row.score_opportunity != null) return row.score_opportunity;
  if (goal === 'bourse') return Math.max(0, Math.min(100, Math.round((row.scholarships / Math.max(row.total, 1)) * 100)));
  if (goal === 'carriere') return Math.max(0, Math.min(100, Math.round((1 - row.passable / Math.max(row.total, 1)) * 100)));
  return Math.max(0, Math.min(100, Math.round(((row.scholarships / Math.max(row.total, 1)) * 50) + ((1 - row.passable / Math.max(row.total, 1)) * 50))));
}

function freshnessTone(confidence: AssistantRecommendation['confidence']) {
  if (confidence === 'high') return 'text-emerald-300';
  if (confidence === 'medium') return 'text-amber-300';
  return 'text-slate-400';
}

function freshnessLabel(confidence: AssistantRecommendation['confidence']) {
  if (confidence === 'high') return 'Données récentes';
  if (confidence === 'medium') return 'Données à surveiller';
  return 'Données plus anciennes';
}

function goalText(goal: PrimaryGoal) {
  if (goal === 'bourse') return 'Trouver une piste favorable pour la bourse';
  if (goal === 'carriere') return 'Trouver une piste proche de ton projet métier';
  return 'Trouver un bon équilibre entre bourse et projet métier';
}

function factorText(item: AssistantRecommendation) {
  const factors = item.factors || {};
  const scholarships = Number(factors.scholarships_observed ?? 0);
  const applicants = Number(factors.applicants_observed ?? 0);
  const mentionApplicants = Number(factors.selected_mention_observed ?? 0);
  return { scholarships, applicants, mentionApplicants };
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  const { profile, preferences, updatePreferences } = useAuth();
  const [goal, setGoal] = useState<PrimaryGoal>(preferences?.primary_goal || 'bourse');
  const [selected, setSelected] = useState<number[]>([]);
  const [openFactors, setOpenFactors] = useState<number | null>(null);
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

  const runAnalysis = async () => {
    setAnalysisError(null);
    setExplanation(null);
    setIsAnalysing(true);
    setAssistant({
      ok: true,
      thinking_steps: [
        'Vérification de la dernière mise à jour des données',
        `Lecture de ${live.rows.length} filière(s) observée(s)`,
        'Comparaison selon ton profil et ton objectif',
      ],
    });
    const result = await askOrientationAssistant({ action: 'recommend' });
    setIsAnalysing(false);
    if (!result.ok) {
      setAnalysisError(result.error || 'BacPilot ne peut pas préparer tes pistes pour le moment.');
      return;
    }
    setAssistant(result);
  };

  useEffect(() => {
    if (profile?.series && profile?.mention && preferences?.primary_goal && live.rows.length && !assistant && !isAnalysing) {
      void runAnalysis();
    }
    // L’analyse se relance à la demande lorsque les données se mettent à jour.
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
      setAnalysisError('Ton objectif n’a pas été enregistré. Réessaie avant de relancer la comparaison.');
      return;
    }
    await runAnalysis();
  };

  const askForExplanation = async () => {
    if (!question.trim() || isExplaining) return;
    setIsExplaining(true);
    setExplanation(null);
    const result = await askOrientationAssistant({ action: 'explain', message: question.trim() });
    setIsExplaining(false);
    if (!result.ok) {
      setAnalysisError(result.error || 'Je ne peux pas préciser cette piste maintenant.');
      return;
    }
    setQuestion('');
    setExplanation(result.response || 'Les éléments utilisés sont déjà indiqués dans tes trois pistes.');
    setAssistant((current) => current ? { ...current, ai_explanations_remaining_today: result.ai_explanations_remaining_today ?? current.ai_explanations_remaining_today } : result);
  };

  const toggle = (id: number) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const recommendations = assistant?.recommendations || [];
  const freshness = assistant?.freshness?.age_minutes ?? null;
  const proofSteps = assistant?.thinking_steps || ['En attente des données observées.'];

  return (
    <main className="min-h-[72vh] bg-[#08111f] px-3 py-3 text-slate-100 sm:px-6 sm:py-7">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">BacPilot · tes données, ton choix</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Bonjour {profile?.display_name || 'à toi'}.</h1>
            <p className="mt-2 text-sm text-slate-400">{profile?.series ? `Série ${profile.series}` : 'Série à renseigner'}{profile?.mention ? ` · Mention ${profile.mention}` : ''} · BacPilot compare les données observées pour t’aider à préparer tes choix.</p>
          </div>
          <button onClick={() => navigate('/onboarding')} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-amber-300 hover:text-white active:scale-[0.98]">
            Modifier mon parcours <ArrowRight className="h-4 w-4" />
          </button>
        </header>

        <section className="mt-5 flex flex-col gap-4 border-b border-slate-800 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-white">Ce que tu veux privilégier</p>
            <p className="mt-1 text-sm text-slate-400">{goalText(goal)}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              ['bourse', 'Bourse'],
              ['carriere', 'Carrière'],
              ['equilibre', 'Équilibre'],
            ] as [PrimaryGoal, string][]).map(([value, label]) => (
              <button key={value} onClick={() => void changeGoal(value)} disabled={isAnalysing} className={`rounded-full px-4 py-2 text-sm font-bold transition active:scale-[0.97] disabled:opacity-50 ${goal === value ? 'bg-amber-300 text-slate-950' : 'border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
        </section>

        {analysisError && <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{analysisError}</p>}

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(270px,0.68fr)_minmax(0,1.55fr)]">
          <aside className="order-2 space-y-5 lg:order-1">
            <section className="border border-slate-800 bg-[#0c1828] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-300 text-slate-950"><Bot className="h-5 w-5" /></div>
                <div>
                  <p className="font-black text-white">BacPilot</p>
                  <p className="mt-1 text-sm leading-5 text-slate-400">J’utilise les observations disponibles. Je te propose des pistes, mais tu gardes le dernier mot.</p>
                </div>
              </div>
              <button onClick={() => void runAnalysis()} disabled={isAnalysing} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-amber-200 transition hover:text-amber-100 disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${isAnalysing ? 'animate-spin' : ''}`} />
                Mettre à jour mes pistes
              </button>
            </section>

            <section className="border border-slate-800 bg-[#0c1828] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div><p className="font-black text-white">Ce que BacPilot a vérifié</p><p className="mt-1 text-xs text-slate-500">Des étapes réelles, pas une promesse.</p></div>
                <ShieldCheck className="h-5 w-5 text-amber-300" />
              </div>
              <div className="mt-5 space-y-0 border-l border-slate-700 pl-4">
                {proofSteps.map((item, index) => {
                  const current = isAnalysing && index === proofSteps.length - 1;
                  return <div key={`${item}-${index}`} className="relative pb-5 last:pb-0">
                    <span className="absolute -left-[23px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0c1828] ring-1 ring-slate-700">
                      {current ? <LoaderCircle className="h-3 w-3 animate-spin text-amber-300" /> : <Check className="h-3 w-3 text-emerald-300" />}
                    </span>
                    <p className="text-sm font-semibold leading-5 text-slate-200">{item}</p>
                    {index === 0 && <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3 w-3" />{freshness !== null ? formatAssistantFreshness(freshness) : `dernière collecte ${formatFreshness(live.lastUpdated)}`}</p>}
                  </div>;
                })}
              </div>
            </section>

            <section className="border border-slate-800 bg-slate-950/50 p-5 text-sm leading-6 text-slate-400">
              <p className="font-bold text-slate-200">À retenir</p>
              <p className="mt-2">{MHM_PROMOTION_CONFIG.ethicsDisclaimer}</p>
            </section>
          </aside>

          <section className="order-1 lg:order-2">
            <div className="border border-slate-800 bg-[#0c1828]">
              <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Comparaison selon ton profil</p>
                  <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Tes 3 pistes à vérifier</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{assistant?.response || 'BacPilot prépare une lecture à partir des dernières données observées.'}</p>
                </div>
                <span className={`inline-flex items-center gap-2 text-xs font-bold ${live.realtime === 'connected' ? 'text-emerald-300' : 'text-slate-500'}`}><span className={`h-2 w-2 rounded-full ${live.realtime === 'connected' ? 'bg-emerald-400' : 'bg-slate-600'}`} />{live.realtime === 'connected' ? 'Données qui se mettent à jour' : 'Connexion aux données en cours'}</span>
              </div>

              <div className="divide-y divide-slate-800">
                {recommendations.length === 0 && <div className="px-5 py-10 sm:px-7"><div className="flex items-center gap-3 text-sm text-slate-400"><LoaderCircle className="h-5 w-5 animate-spin text-amber-300" />BacPilot prépare tes pistes à partir des données observées…</div></div>}
                {recommendations.map((item, index) => {
                  const factors = factorText(item);
                  const isOpen = openFactors === item.programme_id;
                  return <article key={item.programme_id} className={`px-5 py-6 sm:px-7 ${index === 0 ? 'bg-amber-300/[0.035]' : ''}`}>
                    <div className="grid gap-5 md:grid-cols-[100px_minmax(0,1fr)_190px] md:items-start">
                      <div className="flex items-center gap-3 md:block">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${index === 0 ? 'bg-amber-300 text-slate-950' : 'border border-slate-700 text-slate-300'}`}>{index + 1}</span>
                        <p className={`text-xs font-bold uppercase tracking-[0.16em] md:mt-3 ${index === 0 ? 'text-amber-200' : 'text-slate-500'}`}>Piste {index + 1}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.university}</p>
                        <h3 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">{item.programme}</h3>
                        <p className="mt-2 text-sm text-slate-400">{item.school}</p>
                        {index === 0 && <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-amber-200"><Sparkles className="h-4 w-4" />Première piste selon les données observées</p>}
                        <button onClick={() => setOpenFactors(isOpen ? null : item.programme_id)} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sky-300 transition hover:text-sky-200">
                          {isOpen ? 'Masquer les éléments comparés' : 'Voir pourquoi cette piste ressort'} <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && <div className="mt-4 grid gap-3 border-l-2 border-amber-300/70 pl-4 text-sm leading-6 text-slate-300 sm:grid-cols-2">
                          <p><strong className="text-white">{factors.scholarships}</strong> bourse(s) observée(s) dans cette filière.</p>
                          <p><strong className="text-white">{factors.applicants}</strong> inscription(s) observée(s) au dernier passage.</p>
                          <p><strong className="text-white">{factors.mentionApplicants}</strong> inscription(s) observée(s) pour ta mention.</p>
                          <p className={freshnessTone(item.confidence)}>{freshnessLabel(item.confidence)} · {formatAssistantFreshness(item.freshness_minutes)}</p>
                        </div>}
                      </div>
                      <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                        <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Indicateur BacPilot</p><p className={`mt-1 text-3xl font-black ${index === 0 ? 'text-amber-300' : 'text-white'}`}>{item.score}<span className="ml-1 text-sm text-slate-500">/100</span></p><p className="mt-1 text-xs leading-5 text-slate-500">Ce n’est pas une garantie d’admission.</p></div>
                        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${item.confidence === 'high' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : item.confidence === 'medium' ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : 'border-slate-600 bg-slate-800 text-slate-300'}`}><Clock3 className="h-3.5 w-3.5" />{freshnessLabel(item.confidence)}</span>
                        <button onClick={() => toggle(item.programme_id)} className={`inline-flex items-center gap-2 text-sm font-bold transition ${selected.includes(item.programme_id) ? 'text-emerald-300' : 'text-slate-300 hover:text-white'}`}><Bookmark className="h-4 w-4" />{selected.includes(item.programme_id) ? 'Piste retenue' : 'Retenir cette piste'}</button>
                      </div>
                    </div>
                  </article>;
                })}
              </div>
            </div>

            <section className="mt-6 border border-slate-800 bg-[#0c1828] px-5 py-5 sm:px-7">
              <div className="flex items-start gap-3"><MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" /><div className="w-full"><h2 className="font-black text-white">Poser une question à BacPilot</h2><p className="mt-1 text-sm leading-6 text-slate-400">Je peux t’expliquer ce qui fait ressortir une piste. Je ne remplace pas les règles du portail officiel.</p><div className="mt-4 flex gap-2 border border-slate-700 bg-slate-950/60 p-2 focus-within:border-sky-300"><input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void askForExplanation(); }} placeholder="Ex. Pourquoi la piste 1 est-elle en premier ?" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600" /><button onClick={() => void askForExplanation()} disabled={!question.trim() || isExplaining} aria-label="Envoyer ma question à BacPilot" className="flex h-10 w-10 shrink-0 items-center justify-center bg-sky-500 text-slate-950 transition active:scale-95 disabled:opacity-40"><Send className="h-4 w-4" /></button></div>{isExplaining && <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-sky-200"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Je prépare une explication à partir de tes pistes…</p>}{explanation && <div className="mt-4 border-l-2 border-sky-300 bg-slate-950/60 px-4 py-4 text-sm leading-6 text-slate-300"><p className="font-black text-sky-200">BacPilot</p><p className="mt-2">{explanation}</p>{assistant?.ai_explanations_remaining_today !== null && assistant?.ai_explanations_remaining_today !== undefined && <p className="mt-3 text-xs text-slate-500">Explications IA restantes aujourd’hui : {assistant.ai_explanations_remaining_today}</p>}</div>}</div></div>
            </section>
          </section>
        </div>

        <section className="mt-10 border-t border-slate-800 pt-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Pour explorer davantage</p><h2 className="mt-2 text-2xl font-black text-white">Toutes les filières observées</h2><p className="mt-2 text-sm text-slate-400">{live.rows.length} filière(s) observée(s) · dernière mise à jour {formatFreshness(live.lastUpdated)}</p></div></div>
          {live.loading && <div className="mt-5 border border-slate-800 bg-[#0c1828] p-8 text-center text-sm text-slate-400">Chargement des données observées…</div>}
          {live.error && <div className="mt-5 border border-rose-400/30 bg-rose-500/10 p-5 text-sm text-rose-100">Les données sont momentanément indisponibles : {live.error}</div>}
          {!live.loading && !live.error && rows.length === 0 && <div className="mt-5 border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">Aucune donnée observée n’est disponible pour le moment. Lance une collecte depuis l’extension.</div>}
          <div className="mt-5 grid gap-px border border-slate-800 bg-slate-800 md:grid-cols-2">
            {rows.map((row, index) => <article key={row.programme_id} className="bg-[#0c1828] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-slate-500">Filière observée #{index + 1} · {row.university}</p><h3 className="mt-2 font-bold text-white">{row.programme}</h3><p className="mt-1 text-xs text-slate-400">{row.school}</p></div><div className="text-right"><strong className="text-2xl text-amber-300">{liveScore(row, goal)}</strong><span className="block text-[10px] uppercase tracking-wide text-slate-500">indicateur</span></div></div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400"><span><strong className="text-slate-200">{row.scholarships}</strong> bourses observées</span><span><strong className="text-slate-200">{row.passable}</strong> mention Passable</span><span><strong className="text-slate-200">{row.total}</strong> inscriptions</span></div><button onClick={() => toggle(row.programme_id)} className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${selected.includes(row.programme_id) ? 'text-emerald-300' : 'text-slate-400 hover:text-white'}`}><Bookmark className="h-4 w-4" />{selected.includes(row.programme_id) ? 'Piste retenue' : 'Retenir comme piste'}</button></article>)}
          </div>
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;
