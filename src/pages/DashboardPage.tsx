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
  Bug,
  Building2,
  ExternalLink,
  Landmark,
  ListChecks,
  MapPin,
  Copy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { askOrientationAssistant, AssistantRecommendation, AssistantResponse, formatAssistantFreshness } from '../lib/orientationAssistant';
import { formatFreshness, useLiveProgrammes } from '../lib/liveProgrammes';
import { MHM_PROMOTION_CONFIG } from '../lib/promotion';
import { OFFICIAL_CHOICE_PORTAL_URL, PreparedChoice, savePreparedChoices } from '../lib/community';
import { LiveProgramme, PrimaryGoal } from '../types/orientation';

interface DashboardPageProps { navigate: (route: string) => void; }

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
  const { user, profile, preferences, isBetaTester, updatePreferences } = useAuth();
  const [goal, setGoal] = useState<PrimaryGoal>(preferences?.primary_goal || 'bourse');
  const [selected, setSelected] = useState<number[]>([]);
  const [openFactors, setOpenFactors] = useState<number | null>(null);
  const [assistant, setAssistant] = useState<AssistantResponse | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isPreparingChoices, setIsPreparingChoices] = useState(false);
  const [choiceNotice, setChoiceNotice] = useState<string | null>(null);
  const live = useLiveProgrammes(100);

  const rows = useMemo(() => [...live.rows].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()), [live.rows]);

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

  const toggle = (id: number) => setSelected((current) => {
    if (current.includes(id)) return current.filter((item) => item !== id);
    if (current.length >= 3) {
      setChoiceNotice('Tu peux préparer au maximum trois choix. Retire une piste avant d’en ajouter une autre.');
      return current;
    }
    setChoiceNotice(null);
    return [...current, id];
  });
  const recommendations = assistant?.recommendations || [];
  const guideReferences = assistant?.guide_references || [];
  const freshness = assistant?.freshness?.age_minutes ?? null;
  const proofSteps = assistant?.thinking_steps || ['En attente des données observées.'];

  const preparedRecommendationChoices = recommendations
    .filter((item) => selected.includes(item.programme_id))
    .slice(0, 3)
    .map((item, index): PreparedChoice => {
      const guideReference = guideReferences.find((reference) => reference.recommendation_programme === item.programme);
      return {
        rank: (index + 1) as 1 | 2 | 3,
        programme_id: item.programme_id,
        programme: item.programme,
        university: guideReference?.institution || item.university,
        school: guideReference?.establishment || item.school,
        locality: guideReference?.locality || '',
        guide_page: guideReference?.source_pdf_page,
        prepared_at: new Date().toISOString(),
      };
    });

  const prepareChoices = async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    if (preparedRecommendationChoices.length === 0) {
      setChoiceNotice('Sélectionne d’abord une à trois pistes parmi tes résultats.');
      return;
    }
    setIsPreparingChoices(true);
    try {
      await savePreparedChoices(user.id, preparedRecommendationChoices);
      setChoiceNotice('Tes choix 1, 2 et 3 sont préparés dans ton espace. Vérifie chaque intitulé, puis reporte-les toi-même sur le portail officiel.');
    } catch (error) {
      setChoiceNotice(error instanceof Error ? error.message : 'Préparation des choix impossible.');
    } finally {
      setIsPreparingChoices(false);
    }
  };

  const copyPreparedChoices = async () => {
    if (!preparedRecommendationChoices.length) {
      setChoiceNotice('Sélectionne d’abord une à trois pistes.');
      return;
    }
    const text = preparedRecommendationChoices.map((choice) => `${choice.rank}. ${choice.programme} — ${choice.school}${choice.locality ? ` (${choice.locality})` : ''}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setChoiceNotice('La liste ordonnée a été copiée. Ouvre maintenant le portail officiel et vérifie chaque choix avant toute validation.');
    } catch {
      setChoiceNotice('La copie automatique est indisponible sur cet appareil. Consulte les choix préparés à l’écran avant d’ouvrir le portail officiel.');
    }
  };

  return (
    <main className="min-h-[72vh] bg-[#08111f] px-3 py-3 text-slate-100 sm:px-6 sm:py-7">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">BacPilot · tes données, ton choix</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Bonjour {profile?.display_name || 'à toi'}.</h1>
            <p className="mt-2 text-sm text-slate-400">{profile?.series ? `Série ${profile.series}` : 'Série à renseigner'}{profile?.mention ? ` · Mention ${profile.mention}` : ''} · BacPilot compare les données observées pour t’aider à préparer tes choix.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/onboarding')} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-amber-300 hover:text-white active:scale-[0.98]">
              Modifier mon parcours <ArrowRight className="h-4 w-4" />
            </button>
            {isBetaTester && <button onClick={() => navigate('/beta?zone=dashboard')} className="inline-flex w-fit items-center gap-2 rounded-xl border border-rose-400/50 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 active:scale-[0.98]"><Bug className="h-4 w-4" /> Signaler sur cette zone</button>}
          </div>
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
                {recommendations.length === 0 && <div className="px-5 py-10 sm:px-7"><div className="flex items-start gap-3 text-sm leading-6 text-slate-400">{isAnalysing ? <LoaderCircle className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-amber-300" /> : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />}<p>{isAnalysing ? 'BacPilot prépare une comparaison personnalisée à partir des observations et du guide…' : assistant?.response || 'Aucune comparaison personnalisée n’est encore disponible.'}</p></div></div>}
                {recommendations.map((item, index) => {
                  const factors = factorText(item);
                  const isOpen = openFactors === item.programme_id;
                  const guideReference = guideReferences.find((reference) => reference.recommendation_programme === item.programme);
                  return <article key={item.programme_id} className={`px-5 py-6 sm:px-7 ${index === 0 ? 'bg-amber-300/[0.035]' : ''}`}>
                    <div className="grid gap-5 md:grid-cols-[100px_minmax(0,1fr)_190px] md:items-start">
                      <div className="flex items-center gap-3 md:block">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${index === 0 ? 'bg-amber-300 text-slate-950' : 'border border-slate-700 text-slate-300'}`}>{index + 1}</span>
                        <p className={`text-xs font-bold uppercase tracking-[0.16em] md:mt-3 ${index === 0 ? 'text-amber-200' : 'text-slate-500'}`}>Piste {index + 1}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Piste retenue après comparaison personnalisée</p>
                        <h3 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">{item.programme}</h3>
                        <dl className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                          <div className="flex items-start gap-2"><Landmark className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" /><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Université / institution</dt><dd className="mt-0.5">{guideReference?.match_type === 'exact' && guideReference.institution ? guideReference.institution : item.university}</dd></div></div>
                          <div className="flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" /><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Établissement</dt><dd className="mt-0.5">{guideReference?.match_type === 'exact' && guideReference.establishment ? guideReference.establishment : item.school}</dd></div></div>
                          <div className="flex items-start gap-2 sm:col-span-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" /><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Localité</dt><dd className="mt-0.5">{guideReference?.match_type === 'exact' && guideReference.locality ? guideReference.locality : 'Localité à confirmer sur le portail officiel.'}</dd></div></div>
                        </dl>
                        {item.rationale && <div className="mt-4 border-l-2 border-amber-300/70 pl-3 text-sm leading-6 text-slate-300"><p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200">Pourquoi cette piste ressort pour toi</p><p className="mt-1">{item.rationale}</p></div>}
                        {index === 0 && <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-amber-200"><Sparkles className="h-4 w-4" />Piste prioritaire pour ton profil actuel</p>}
                        <button onClick={() => setOpenFactors(isOpen ? null : item.programme_id)} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sky-300 transition hover:text-sky-200">
                          {isOpen ? 'Masquer les éléments comparés' : 'Voir pourquoi cette piste ressort'} <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && <div className="mt-4 space-y-4 border-l-2 border-amber-300/70 pl-4 text-sm leading-6 text-slate-300">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <p><strong className="text-white">{factors.scholarships}</strong> bourse(s) observée(s) dans cette filière.</p>
                            <p><strong className="text-white">{factors.applicants}</strong> inscription(s) observée(s) au dernier passage.</p>
                            <p><strong className="text-white">{factors.mentionApplicants}</strong> inscription(s) observée(s) pour ta mention.</p>
                            <p className={freshnessTone(item.confidence)}>{freshnessLabel(item.confidence)} · {formatAssistantFreshness(item.freshness_minutes)}</p>
                          </div>
                          {guideReference?.match_type === 'exact' && <div className="border-t border-slate-800 pt-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">Repères du guide officiel</p>
                            <p className="mt-1 text-xs text-slate-500">Guide MESRS 2026-2027 · page {guideReference.source_pdf_page}{guideReference.completeness === 'partial' ? ' · fiche incomplète' : ''} · à vérifier avant toute démarche.</p>
                            {guideReference.ranking_rule && <div className="mt-3 border border-amber-300/20 bg-amber-300/[0.05] p-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200">Moyenne de classement de cette filière</p>{guideReference.ranking_rule.calculated_average !== null ? <p className="mt-1 text-lg font-black text-white">{guideReference.ranking_rule.calculated_average.toFixed(2)}<span className="ml-1 text-xs font-semibold text-slate-400">/20</span></p> : <p className="mt-1 text-sm leading-5 text-slate-300">Renseigne encore : {guideReference.ranking_rule.missing_subjects.join(', ')}.</p>}<p className="mt-2 text-xs leading-5 text-slate-400">{guideReference.ranking_rule.subjects.map((subject) => `${subject.label} · coef. ${subject.coefficient}`).join(' · ')}. Guide MESRS 2026-2027 · page {guideReference.ranking_rule.source_pdf_page}.</p></div>}
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              {guideReference.entry_mode && <p><strong className="text-white">Accès :</strong> {guideReference.entry_mode}.</p>}
                              {guideReference.recommended_baccalaureates.length > 0 && <p><strong className="text-white">Séries recommandées :</strong> {guideReference.recommended_baccalaureates.join(', ')}.</p>}
                              {guideReference.scholarship_quota !== null && <p><strong className="text-white">Quota bourse du guide :</strong> {guideReference.scholarship_quota}.</p>}
                              {guideReference.aid_or_fpp_quota !== null && <p><strong className="text-white">Quota aide/FPP du guide :</strong> {guideReference.aid_or_fpp_quota}.</p>}
                            </div>
                            {guideReference.career_outcomes.length > 0 && <p className="mt-3"><strong className="text-white">Débouchés indiqués :</strong> {guideReference.career_outcomes.slice(0, 5).join(' · ')}.</p>}
                          </div>}
                          {guideReference?.match_type === 'search' && <p className="border-t border-slate-800 pt-4 text-xs text-amber-100">Le guide contient une fiche proche ; son rattachement à cette piste doit encore être vérifié avant affichage des débouchés.</p>}
                        </div>}
                      </div>
                      <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                        <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Analyse personnalisée</p><p className={`mt-1 text-lg font-black ${index === 0 ? 'text-amber-300' : 'text-white'}`}>{index === 0 ? 'Piste prioritaire' : 'Piste complémentaire'}</p><p className="mt-1 text-xs leading-5 text-slate-500">Décision IA contrôlée par les observations et le guide.</p></div>
                        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${item.confidence === 'high' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : item.confidence === 'medium' ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : 'border-slate-600 bg-slate-800 text-slate-300'}`}><Clock3 className="h-3.5 w-3.5" />{freshnessLabel(item.confidence)}</span>
                        <a href={OFFICIAL_CHOICE_PORTAL_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-sky-300 transition hover:text-sky-200"><ExternalLink className="h-4 w-4" />Vérifier sur le portail officiel</a>
                        <button onClick={() => toggle(item.programme_id)} className={`inline-flex items-center gap-2 text-sm font-bold transition ${selected.includes(item.programme_id) ? 'text-emerald-300' : 'text-slate-300 hover:text-white'}`}><Bookmark className="h-4 w-4" />{selected.includes(item.programme_id) ? 'Retirée de mes choix' : 'Ajouter à mes choix'}</button>
                      </div>
                    </div>
                  </article>;
                })}
              </div>
            </div>

            <section className="mt-6 border border-sky-400/30 bg-sky-400/[0.06] px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Préparation guidée</p>
                  <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-white"><ListChecks className="h-6 w-6 text-sky-300" />Préparer mes choix 1, 2, 3</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">BacPilot conserve ton ordre de préférence. Il ne remplit pas et ne valide pas le portail officiel à ta place : tu restes responsable de vérifier chaque intitulé avant toute sélection.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => void prepareChoices()} disabled={isPreparingChoices || preparedRecommendationChoices.length === 0} className="inline-flex items-center gap-2 bg-sky-300 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-sky-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"><ListChecks className="h-4 w-4" />{isPreparingChoices ? 'Préparation…' : 'Enregistrer mes choix'}</button>
                  <button onClick={() => void copyPreparedChoices()} disabled={preparedRecommendationChoices.length === 0} className="inline-flex items-center gap-2 border border-slate-600 px-4 py-2.5 text-sm font-bold text-slate-100 transition hover:border-sky-300 disabled:cursor-not-allowed disabled:opacity-40"><Copy className="h-4 w-4" />Copier l’ordre</button>
                  <a href={OFFICIAL_CHOICE_PORTAL_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-slate-600 px-4 py-2.5 text-sm font-bold text-slate-100 transition hover:border-sky-300"><ExternalLink className="h-4 w-4" />Ouvrir le portail officiel</a>
                </div>
              </div>
              <ol className="mt-5 grid gap-3 md:grid-cols-3">
                {[1, 2, 3].map((rank) => {
                  const choice = preparedRecommendationChoices[rank - 1];
                  return <li key={rank} className="min-h-24 border border-slate-700 bg-slate-950/45 p-4"><p className="text-xs font-black uppercase tracking-[0.16em] text-sky-200">Choix {rank}</p>{choice ? <><p className="mt-2 text-sm font-bold text-white">{choice.programme}</p><p className="mt-1 text-xs leading-5 text-slate-400">{choice.school}{choice.locality ? ` · ${choice.locality}` : ''}</p>{choice.guide_page && <p className="mt-1 text-[11px] text-slate-500">Guide MESRS · p. {choice.guide_page}</p>}</> : <p className="mt-2 text-sm text-slate-500">Ajoute une piste depuis les résultats.</p>}</li>;
                })}
              </ol>
              {choiceNotice && <p role="status" className="mt-4 border-l-2 border-sky-300 pl-3 text-sm leading-6 text-sky-100">{choiceNotice}</p>}
            </section>

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
            {rows.map((row, index) => <article key={row.programme_id} className="bg-[#0c1828] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-slate-500">Filière observée #{index + 1} · {row.university}</p><h3 className="mt-2 font-bold text-white">{row.programme}</h3><p className="mt-1 text-xs text-slate-400">{row.school}</p></div><div className="text-right"><strong className="text-sm text-amber-300">Données observées</strong><span className="block text-[10px] uppercase tracking-wide text-slate-500">à comparer</span></div></div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400"><span><strong className="text-slate-200">{row.scholarships}</strong> bourses observées</span><span><strong className="text-slate-200">{row.passable}</strong> mention Passable</span><span><strong className="text-slate-200">{row.total}</strong> inscriptions</span></div><button onClick={() => toggle(row.programme_id)} className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${selected.includes(row.programme_id) ? 'text-emerald-300' : 'text-slate-400 hover:text-white'}`}><Bookmark className="h-4 w-4" />{selected.includes(row.programme_id) ? 'Piste retenue' : 'Retenir comme piste'}</button></article>)}
          </div>
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;
