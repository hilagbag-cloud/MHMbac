import React, { useMemo, useState } from 'react';
import { ArrowRight, Bookmark, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatFreshness, useLiveProgrammes } from '../lib/liveProgrammes';
import { LiveProgramme } from '../types/orientation';

interface DashboardPageProps { navigate: (route: string) => void; }

function liveScore(row: LiveProgramme, goal: string): number {
  if (row.score_opportunity != null) return row.score_opportunity;
  if (goal === 'bourse') return Math.max(0, Math.min(100, Math.round((row.scholarships / Math.max(row.total, 1)) * 100)));
  return Math.max(0, Math.min(100, Math.round((1 - row.passable / Math.max(row.total, 1)) * 100)));
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  const { profile, preferences, updatePreferences } = useAuth();
  const [goal, setGoal] = useState(preferences?.primary_goal || 'bourse');
  const [selected, setSelected] = useState<number[]>([]);
  const live = useLiveProgrammes(100);
  const keywords = preferences?.career_keywords || [];
  const rows = useMemo(() => [...live.rows].sort((a, b) => {
    const aMatch = keywords.some((word) => `${a.programme} ${a.school}`.toLowerCase().includes(word.toLowerCase()));
    const bMatch = keywords.some((word) => `${b.programme} ${b.school}`.toLowerCase().includes(word.toLowerCase()));
    if (goal === 'carriere' && aMatch !== bMatch) return Number(bMatch) - Number(aMatch);
    return liveScore(b, goal) - liveScore(a, goal);
  }), [live.rows, goal, keywords]);
  const title = goal === 'bourse' ? 'Classement selon tes chances de bourse' : 'Classement selon ton objectif carrière';
  const changeGoal = async (next: 'bourse' | 'carriere') => { setGoal(next); await updatePreferences({ primary_goal: next, scholarship_priority: next === 'bourse' ? 100 : 40, career_priority: next === 'carriere' ? 100 : 40 }); };
  const toggle = (id: number) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return <main className="min-h-[70vh] bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:py-12"><div className="mx-auto max-w-6xl space-y-8">
    <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Espace orientation</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Bonjour {profile?.display_name || 'candidat'}.</h1><p className="mt-2 text-sm text-slate-500">{profile?.series ? `Série ${profile.series}` : 'Série non renseignée'}{profile?.mention ? ` · Mention ${profile.mention}` : ''}</p></div><button onClick={() => navigate('/onboarding')} className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700">Modifier mon profil <ArrowRight className="h-4 w-4" /></button></header>
    <section className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center"><div><h2 className="font-bold">Quel classement veux-tu consulter ?</h2><p className="mt-1 text-sm text-slate-500">Le changement réordonne uniquement les observations réelles disponibles.</p></div><div className="flex gap-2"><button onClick={() => void changeGoal('bourse')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${goal === 'bourse' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Chances de bourse</button><button onClick={() => void changeGoal('carriere')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${goal === 'carriere' ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Objectif carrière</button></div></section>
    <section><div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">{live.rows.length} observation(s) · dernière collecte {formatFreshness(live.lastUpdated)}</p></div><span className={`text-xs font-semibold ${live.realtime === 'connected' ? 'text-emerald-600' : 'text-slate-500'}`}>{live.realtime === 'connected' ? '● Temps réel connecté' : '○ Connexion en cours'}</span></div>{live.loading && <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 dark:bg-slate-900">Chargement des données observées…</div>}{live.error && <div className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700 dark:bg-rose-950/30">Les données live sont momentanément indisponibles : {live.error}</div>}{!live.loading && !live.error && rows.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">Aucune donnée réelle disponible. Lance une collecte depuis l’extension.</div>}<div className="grid gap-4 md:grid-cols-2">{rows.map((row, index) => <article key={row.programme_id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-slate-400">#{index + 1} · {row.university} · {row.school}</p><h3 className="mt-2 font-bold">{row.programme}</h3></div><div className="text-right"><strong className="text-2xl text-rose-500">{liveScore(row, goal)}</strong><span className="block text-[10px] uppercase text-slate-400">score observé</span></div></div><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800"><strong>{row.scholarships}</strong><span className="block text-slate-500">bourses</span></div><div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800"><strong>{row.passable}</strong><span className="block text-slate-500">Passable</span></div><div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800"><strong>{row.total}</strong><span className="block text-slate-500">inscrits</span></div></div><button onClick={() => toggle(row.programme_id)} className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${selected.includes(row.programme_id) ? 'text-emerald-600' : 'text-slate-500'}`}><Bookmark className="h-4 w-4" />{selected.includes(row.programme_id) ? 'Proposition sélectionnée' : 'Sélectionner cette proposition'}</button></article>)}</div></section>
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/20"><div className="flex gap-3"><Sparkles className="mt-0.5 h-5 w-5 text-indigo-500" /><div><h2 className="font-bold">À venir : analyse IA personnalisée</h2><p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Nous préparons une fonctionnalité qui pourra comparer ton profil, tes notes, les données observées et le guide officiel pour proposer une aide à la décision. Elle n’est pas encore active : aucun résultat prédictif n’est présenté aujourd’hui.</p></div></div></section>
  </div></main>;
};
export default DashboardPage;
