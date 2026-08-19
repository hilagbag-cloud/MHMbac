import React, { useEffect, useMemo, useState } from 'react';
import { Bug, Camera, CheckCircle2, Lightbulb, MessageSquare, ShieldCheck, Sparkles, ThumbsUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getBetaStats, submitBetaFeedback, type BetaStats } from '../lib/beta';
import { BetaContributorPanel } from '../components/BetaContributorPanel';
import type { BetaFeedbackCategory, BetaFeedbackSeverity, BetaZone } from '../types/orientation';

interface BetaPageProps { navigate: (route: string) => void; }

const zones: Array<{ value: BetaZone; label: string }> = [
  { value: 'accueil', label: 'Accueil' },
  { value: 'onboarding', label: 'Onboarding / questions' },
  { value: 'dashboard', label: 'Tableau de bord / Top 3' },
  { value: 'profil', label: 'Mon profil' },
  { value: 'extension', label: 'Extension Chrome' },
  { value: 'authentification', label: 'Connexion / inscription' },
  { value: 'autre', label: 'Autre zone' },
];

const categoryOptions: Array<{ value: BetaFeedbackCategory; label: string; icon: React.ReactNode }> = [
  { value: 'bug', label: 'Signaler un bug', icon: <Bug className="h-4 w-4" /> },
  { value: 'confusion', label: 'Je ne comprends pas', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'idea', label: 'Proposer une idée', icon: <Lightbulb className="h-4 w-4" /> },
  { value: 'praise', label: 'Dire ce qui fonctionne', icon: <ThumbsUp className="h-4 w-4" /> },
];

export const BetaPage: React.FC<BetaPageProps> = ({ navigate }) => {
  const { user, profile, isBetaTester } = useAuth();
  const queryZone = new URLSearchParams(window.location.search).get('zone') as BetaZone | null;
  const [category, setCategory] = useState<BetaFeedbackCategory>('bug');
  const [severity, setSeverity] = useState<BetaFeedbackSeverity>('medium');
  const [zone, setZone] = useState<BetaZone>(zones.some((item) => item.value === queryZone) ? queryZone as BetaZone : 'dashboard');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<BetaStats | null>(null);

  useEffect(() => {
    if (!isBetaTester) return;
    getBetaStats().then(setStats).catch(() => setStats(null));
  }, [isBetaTester]);

  const zoneLabel = useMemo(() => zones.find((item) => item.value === zone)?.label || zone, [zone]);

  if (!user) {
    return <section className="mx-auto max-w-4xl px-4 py-16 sm:py-20"><div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10"><ShieldCheck className="mx-auto h-10 w-10 text-rose-500" /><p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-rose-500">Programme bêta BacPilot</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Tester l’orientation post-bac avec BacPilot</h1><p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-500">Le programme bêta permet à des volontaires de tester les parcours d’orientation, la recherche de filières et les résultats proposés, puis de signaler rapidement un bug, une incompréhension ou une idée d’amélioration.</p><div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950"><b className="block text-slate-900 dark:text-white">Teste</b><span className="mt-1 block text-slate-500">L’accueil, les questions, le tableau de bord et les résultats.</span></div><div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950"><b className="block text-slate-900 dark:text-white">Signale</b><span className="mt-1 block text-slate-500">Décris ce qui s’est passé et ce qui était attendu.</span></div><div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950"><b className="block text-slate-900 dark:text-white">Améliore</b><span className="mt-1 block text-slate-500">Tes retours aident à rendre BacPilot plus clair et plus fiable.</span></div></div><p className="mx-auto mt-7 max-w-2xl text-sm leading-6 text-slate-500">La phase bêta est volontaire. BacPilot reste une aide à la préparation : les décisions d’orientation doivent toujours être vérifiées sur les sources et plateformes officielles.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => navigate('/login')} className="rounded-xl bg-rose-500 px-5 py-3 font-bold text-white">Se connecter à l’espace bêta</button><button onClick={() => navigate('/contact')} className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Demander une invitation</button></div></div></section>;
  }

  if (!isBetaTester) {
    return <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16"><div className="w-full rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900/50 dark:bg-amber-950/20"><ShieldCheck className="mx-auto h-10 w-10 text-amber-500" /><h1 className="mt-4 text-2xl font-black">Espace réservé aux bêta-testeurs</h1><p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-300">Ton compte n’est pas encore enrôlé dans la phase bêta. Demande une invitation à l’équipe BacPilot ; le statut sera ensuite reconnu automatiquement.</p><button onClick={() => navigate('/contact')} className="mt-6 rounded-xl border border-slate-300 px-5 py-3 font-bold dark:border-slate-700">Contacter l’équipe</button></div></section>;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedbackMessage(null);
    if (title.trim().length < 3 || description.trim().length < 10) {
      setFeedbackMessage({ type: 'error', text: 'Ajoute un titre et une description suffisamment précis.' });
      return;
    }
    setSending(true);
    try {
      await submitBetaFeedback({ category, severity, title, description, expectedBehavior, actualBehavior, zone, route: window.location.pathname, screenshot });
      setTitle(''); setDescription(''); setExpectedBehavior(''); setActualBehavior(''); setScreenshot(null);
      setFeedbackMessage({ type: 'success', text: 'Merci ! Ton retour est enregistré et sera étudié par l’équipe BacPilot.' });
      setStats(await getBetaStats());
    } catch (error: any) {
      setFeedbackMessage({ type: 'error', text: error.message || 'Le retour n’a pas pu être envoyé.' });
    } finally { setSending(false); }
  };

  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300"><Sparkles className="h-3.5 w-3.5" /> Bêta-testeur actif</div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Teste, trouve, signale.</h1><p className="mt-2 max-w-2xl text-slate-500">Bonjour {profile?.display_name || 'testeur'} ! Utilise cet espace pour envoyer un retour en moins d’une minute, directement depuis la zone que tu testes.</p></div><div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900"><span className="text-slate-500">Compte bêta</span><strong className="ml-2 text-rose-500">{user.email}</strong></div></div>

    <div className="mb-8 grid gap-4 sm:grid-cols-3"><StatCard label="Retours envoyés" value={stats?.feedbackCount ?? '—'} /><StatCard label="Bugs encore ouverts" value={stats?.bugsOpen ?? '—'} accent="text-amber-500" /><StatCard label="Actions testées" value={stats?.eventCount ?? '—'} accent="text-emerald-500" /></div>

    <div className="mb-8"><BetaContributorPanel navigate={navigate} refreshKey={stats?.feedbackCount ?? 0} /></div>

    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]"><form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"><div className="mb-6 flex items-start justify-between gap-4"><div><h2 className="text-xl font-black">Nouveau retour</h2><p className="mt-1 text-sm text-slate-500">Les champs essentiels sont courts ; les détails nous aident à reproduire le problème.</p></div><Bug className="h-6 w-6 text-rose-500" /></div>
      <div className="grid gap-2 sm:grid-cols-2">{categoryOptions.map((item) => <button key={item.value} type="button" onClick={() => setCategory(item.value)} className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-bold ${category === item.value ? 'border-rose-400 bg-rose-50 text-rose-600 dark:bg-rose-950/30' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>{item.icon}{item.label}</button>)}</div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Zone testée"><select value={zone} onChange={(event) => setZone(event.target.value as BetaZone)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-normal outline-none ring-rose-200 focus:ring-2 dark:border-slate-700 dark:bg-slate-950">{zones.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><span className="mt-1 block text-xs text-slate-400">Détectée : {zoneLabel}</span></Field><Field label="Priorité"><select value={severity} onChange={(event) => setSeverity(event.target.value as BetaFeedbackSeverity)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-normal outline-none ring-rose-200 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"><option value="low">Faible</option><option value="medium">Normale</option><option value="high">Importante</option><option value="blocker">Bloquante</option></select></Field></div>
      <div className="mt-4"><Field label="Titre"><input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-normal outline-none ring-rose-200 focus:ring-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Ex. Le classement ne se met pas à jour" maxLength={160} /></Field></div>
      <div className="mt-4"><Field label="Ce qui s’est passé"><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-normal outline-none ring-rose-200 focus:ring-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Décris les étapes, le résultat observé et, si possible, les données utilisées." maxLength={5000} /></Field></div>
      {category === 'bug' && <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Ce qui devait se passer"><textarea value={expectedBehavior} onChange={(event) => setExpectedBehavior(event.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-normal outline-none ring-rose-200 focus:ring-2 dark:border-slate-700 dark:bg-slate-950" maxLength={2000} /></Field><Field label="Résultat obtenu"><textarea value={actualBehavior} onChange={(event) => setActualBehavior(event.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-normal outline-none ring-rose-200 focus:ring-2 dark:border-slate-700 dark:bg-slate-950" maxLength={2000} /></Field></div>}
      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700"><label className="flex cursor-pointer items-center gap-3 text-sm font-bold"><Camera className="h-5 w-5 text-slate-400" /> Ajouter une capture d’écran <input type="file" accept="image/*" onChange={(event) => setScreenshot(event.target.files?.[0] || null)} className="sr-only" /></label><span className="text-xs text-slate-400">Optionnel, 5 Mo maximum. La capture reste privée et rattachée à ton compte.</span>{screenshot && <span className="text-xs font-semibold text-emerald-600">{screenshot.name}</span>}</div>
      {feedbackMessage && <div role="status" className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${feedbackMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'}`}>{feedbackMessage.text}</div>}
      <button disabled={sending} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-60">{sending ? 'Envoi…' : 'Envoyer mon retour'} <MessageSquare className="h-4 w-4" /></button>
    </form>

    <aside className="space-y-6"><div className="rounded-3xl bg-slate-950 p-6 text-white"><h2 className="text-lg font-black">Mode d’emploi</h2><ol className="mt-4 space-y-4 text-sm text-slate-300"><li><b className="text-rose-300">01.</b> Teste une zone comme un vrai utilisateur.</li><li><b className="text-rose-300">02.</b> Ouvre cet espace dès qu’une incohérence apparaît.</li><li><b className="text-rose-300">03.</b> Indique ce que tu faisais et ce qui était attendu.</li><li><b className="text-rose-300">04.</b> Ajoute une capture seulement si elle aide à reproduire.</li></ol></div><div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-black">Tes derniers retours</h2>{stats?.recentFeedback.length ? <div className="mt-4 space-y-3">{stats.recentFeedback.map((item) => <div key={item.id} className="border-b border-slate-100 pb-3 text-sm last:border-0 dark:border-slate-800"><div className="flex justify-between gap-2"><b className="truncate">{item.title}</b><span className="text-xs text-slate-400">{item.status}</span></div><span className="text-xs text-slate-400">{item.category}</span></div>)}</div> : <p className="mt-3 text-sm text-slate-500">Aucun retour envoyé pour le moment.</p>}</div></aside></div></section>;
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">{label}{children}</label>;
const StatCard: React.FC<{ label: string; value: string | number; accent?: string }> = ({ label, value, accent = 'text-rose-500' }) => <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</p><p className={`mt-2 text-3xl font-black ${accent}`}>{value}</p></div>;
