import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bot, ChevronRight, LoaderCircle, Send, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { askOrientationAssistant } from '../lib/orientationAssistant';
import { useAuth } from '../context/AuthContext';
import { BacMention, BacSeries, PrimaryGoal } from '../types/orientation';

interface OnboardingPageProps { navigate: (route: string) => void; }

type Message = { id: string; role: 'agent' | 'user'; content: string };
type ChatStep = 'name' | 'series' | 'mention' | 'goal' | 'career' | 'signals' | 'complete';

type QuickReply = { label: string; value: string };

const seriesReplies: QuickReply[] = ['A', 'B', 'C', 'D', 'E'].map((value) => ({ label: `Série ${value}`, value }));
const mentionReplies: QuickReply[] = ['Passable', 'Assez bien', 'Bien', 'Très bien'].map((value) => ({ label: value, value }));
const goalReplies: QuickReply[] = [
  { label: 'Priorité bourse', value: 'bourse' },
  { label: 'Priorité carrière', value: 'carriere' },
  { label: 'Trouver un équilibre', value: 'equilibre' },
];
const signalReplies: QuickReply[] = [
  { label: 'Mathématiques', value: 'Mathématiques' },
  { label: 'Sciences de la vie', value: 'Sciences de la vie' },
  { label: 'Physique-chimie', value: 'Physique-chimie' },
  { label: 'Passer cette étape', value: '__skip__' },
];

const questions: Record<Exclude<ChatStep, 'complete'>, string> = {
  name: 'Bonjour, je suis BacPilot. Pour bien t’accompagner, comment puis-je t’appeler ?',
  series: 'Merci. Quelle est ta série au Bac ?',
  mention: 'Quelle mention as-tu obtenue ?',
  goal: 'Que souhaites-tu privilégier pour cette recherche ?',
  career: 'Quel domaine ou métier veux-tu explorer ? Tu peux répondre avec quelques mots, par exemple « informatique » ou « santé ».',
  signals: 'Dernière question, facultative : dans quelle matière ou force académique te sens-tu le plus à l’aise ?',
};

function getQuickReplies(step: ChatStep, goal: PrimaryGoal | null): QuickReply[] {
  if (step === 'series') return [...seriesReplies, { label: 'Autre série', value: 'Autre' }];
  if (step === 'mention') return mentionReplies;
  if (step === 'goal') return goalReplies;
  if (step === 'signals') return signalReplies;
  if (step === 'career' && goal === 'bourse') return [{ label: 'Passer cette étape', value: '__skip__' }];
  return [];
}

function useTypewriter(text: string, enabled: boolean) {
  const [content, setContent] = useState(enabled ? '' : text);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!enabled || reducedMotion) {
      setContent(text);
      return;
    }
    setContent('');
    let cursor = 0;
    const timer = window.setInterval(() => {
      cursor += 1;
      setContent(text.slice(0, cursor));
      if (cursor >= text.length) window.clearInterval(timer);
    }, 13);
    return () => window.clearInterval(timer);
  }, [enabled, reducedMotion, text]);

  return content;
}

function AgentBubble({ message, animate }: { message: Message; animate: boolean }) {
  const content = useTypewriter(message.content, animate);
  return <div className="flex max-w-2xl items-start gap-3">
    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white"><Bot className="h-4 w-4" /></div>
    <div className="rounded-2xl rounded-tl-md bg-slate-800 px-4 py-3 text-sm leading-6 text-slate-100 shadow-sm sm:text-[15px]">{content}<span aria-hidden="true" className={animate && content !== message.content ? 'ml-0.5 inline-block h-4 border-r border-rose-300 align-[-2px]' : 'hidden'} /></div>
  </div>;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ navigate }) => {
  const { user, profile, preferences, updateProfile, updatePreferences } = useAuth();
  const initialStep = useMemo<ChatStep>(() => {
    if (!profile?.display_name) return 'name';
    if (!profile?.series) return 'series';
    if (!profile?.mention) return 'mention';
    if (!preferences?.primary_goal) return 'goal';
    if (preferences.primary_goal !== 'bourse' && !preferences.career_keywords?.length) return 'career';
    return 'signals';
  }, [profile, preferences]);

  const [step, setStep] = useState<ChatStep>(initialStep);
  const [messages, setMessages] = useState<Message[]>([{ id: 'welcome', role: 'agent', content: questions[initialStep] }]);
  const [input, setInput] = useState('');
  const [goal, setGoal] = useState<PrimaryGoal | null>(preferences?.primary_goal || null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const quickReplies = getQuickReplies(step, goal);
  const placeholder = step === 'name' ? 'Écris ton prénom ou ton nom…' : step === 'career' ? 'Ex. informatique, santé, agronomie…' : step === 'signals' ? 'Ex. je suis à l’aise en mathématiques…' : 'Écris ta réponse…';

  const appendAgent = (content: string) => setMessages((current) => [...current, { id: `agent-${Date.now()}-${current.length}`, role: 'agent', content }]);
  const appendUser = (content: string) => setMessages((current) => [...current, { id: `user-${Date.now()}-${current.length}`, role: 'user', content }]);

  const finalize = async () => {
    setIsSaving(true);
    appendAgent('Je vérifie la dernière synchronisation, je compare les filières compatibles et je prépare tes trois pistes.');
    const result = await askOrientationAssistant({ action: 'recommend' });
    setIsSaving(false);
    if (!result.ok) {
      setError(result.error || 'Je ne peux pas encore lancer l’analyse. Réessaie dans un instant.');
      return;
    }
    appendAgent(result.response || 'Ton analyse est prête. Ouvre tes trois pistes pour voir les données utilisées.');
    setIsReady(true);
  };

  const submitAnswer = async (rawAnswer: string) => {
    const answer = rawAnswer.trim();
    if (!answer || isSaving || step === 'complete') return;
    setError(null);
    appendUser(answer === '__skip__' ? 'Passer cette étape' : answer);
    setInput('');
    setIsSaving(true);

    try {
      if (step === 'name') {
        if (answer.length < 2) throw new Error('Indique au moins deux caractères pour que je puisse t’appeler correctement.');
        const saved = await updateProfile({ display_name: answer });
        if (!saved) throw new Error('Je n’ai pas pu enregistrer ton nom. Vérifie ta connexion puis réessaie.');
        await askOrientationAssistant({ action: 'answer', message: answer, profile_patch: { display_name: answer } });
        setStep('series');
        appendAgent(questions.series);
      } else if (step === 'series') {
        const series = answer as BacSeries;
        if (!['A', 'B', 'C', 'D', 'E', 'Autre'].includes(series)) throw new Error('Choisis une série proposée ou écris « Autre ».');
        const saved = await updateProfile({ series });
        if (!saved) throw new Error('Je n’ai pas pu enregistrer ta série. Réessaie.');
        await askOrientationAssistant({ action: 'answer', message: answer, profile_patch: { series } });
        setStep('mention');
        appendAgent(questions.mention);
      } else if (step === 'mention') {
        const mention = answer as BacMention;
        if (!mentionReplies.some((item) => item.value === mention)) throw new Error('Choisis une mention proposée.');
        const saved = await updateProfile({ mention });
        if (!saved) throw new Error('Je n’ai pas pu enregistrer ta mention. Réessaie.');
        await askOrientationAssistant({ action: 'answer', message: answer, profile_patch: { mention } });
        setStep('goal');
        appendAgent(questions.goal);
      } else if (step === 'goal') {
        const nextGoal = answer as PrimaryGoal;
        if (!['bourse', 'carriere', 'equilibre'].includes(nextGoal)) throw new Error('Choisis une priorité proposée.');
        const saved = await updatePreferences({
          primary_goal: nextGoal,
          scholarship_priority: nextGoal === 'bourse' ? 100 : nextGoal === 'equilibre' ? 65 : 40,
          career_priority: nextGoal === 'carriere' ? 100 : nextGoal === 'equilibre' ? 65 : 40,
          competition_priority: nextGoal === 'bourse' ? 70 : 60,
        });
        if (!saved) throw new Error('Je n’ai pas pu enregistrer ton objectif. Réessaie.');
        await askOrientationAssistant({ action: 'answer', message: answer, preference_patch: { primary_goal: nextGoal } });
        setGoal(nextGoal);
        setStep('career');
        appendAgent(questions.career);
      } else if (step === 'career') {
        const keywords = answer === '__skip__' ? [] : answer.split(',').map((item) => item.trim()).filter((item) => item.length >= 2).slice(0, 8);
        if (goal !== 'bourse' && !keywords.length) throw new Error('Ajoute au moins un domaine ou un métier pour une recommandation carrière pertinente.');
        const saved = await updatePreferences({ career_keywords: keywords });
        if (!saved) throw new Error('Je n’ai pas pu enregistrer ce domaine. Réessaie.');
        await askOrientationAssistant({ action: 'answer', message: answer, preference_patch: { career_keywords: keywords } });
        setStep('signals');
        appendAgent(questions.signals);
      } else if (step === 'signals') {
        const strengths = answer === '__skip__' ? [] : answer.split(',').map((item) => item.trim()).filter((item) => item.length >= 2).slice(0, 8);
        await askOrientationAssistant({ action: 'answer', message: answer, academic_patch: { strengths } });
        setStep('complete');
        await finalize();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
    } finally {
      if (step !== 'signals') setIsSaving(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitAnswer(input);
  };

  if (!user) {
    return <main className="min-h-[70vh] bg-slate-950 px-4 py-10 text-white sm:py-16"><section className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-2xl sm:p-12"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500"><ShieldCheck className="h-6 w-6" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-rose-300">Assistant BacPilot</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Personnalise ton orientation en quelques messages.</h1><p className="mt-4 text-sm leading-6 text-slate-300">Connecte-toi d’abord. Tes réponses seront enregistrées uniquement dans ton espace personnel et ne modifieront jamais les observations collectées.</p><button onClick={() => navigate('/login')} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white transition active:scale-[0.97]">Me connecter pour commencer <ArrowRight className="h-4 w-4" /></button></section></main>;
  }

  return <main className="min-h-[78vh] bg-slate-950 px-3 py-3 text-slate-100 sm:px-6 sm:py-6"><div className="mx-auto flex min-h-[72vh] max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/30">
    <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500"><Bot className="h-5 w-5" /></div><div><p className="text-sm font-black">BacPilot</p><p className="text-xs text-slate-400">Assistant d’orientation · données observées</p></div></div><button onClick={() => navigate('/dashboard')} className="text-xs font-semibold text-slate-400 transition hover:text-white">Voir le classement public</button></header>

    <section aria-live="polite" className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-7 sm:py-8">
      {messages.map((message, index) => message.role === 'agent'
        ? <AgentBubble key={message.id} message={message} animate={index === messages.length - 1 && !isSaving} />
        : <div key={message.id} className="ml-auto flex max-w-2xl items-start gap-3"><div className="rounded-2xl rounded-tr-md bg-rose-500 px-4 py-3 text-sm leading-6 text-white sm:text-[15px]">{message.content}</div><div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700"><UserRound className="h-4 w-4" /></div></div>)}
      {isSaving && <div className="flex items-center gap-3 text-sm text-slate-400"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800"><LoaderCircle className="h-4 w-4 animate-spin text-rose-400" /></div><span>Je prépare la suite…</span></div>}
      {error && <p role="alert" className="max-w-2xl rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
    </section>

    {isReady ? <footer className="border-t border-slate-800 bg-slate-900 px-4 py-4 sm:px-7"><button onClick={() => navigate('/dashboard')} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 py-3.5 text-sm font-black text-white transition active:scale-[0.98]">Découvrir mes 3 pistes <Sparkles className="h-4 w-4" /><ChevronRight className="h-4 w-4" /></button><p className="mt-3 text-center text-[11px] leading-5 text-slate-500">Les suggestions sont indicatives. Tu gardes toujours la main pour vérifier et valider manuellement tes choix sur le portail officiel.</p></footer>
      : <footer className="border-t border-slate-800 bg-slate-900 px-4 py-4 sm:px-7"><div className="mb-3 flex flex-wrap gap-2">{quickReplies.map((reply) => <button key={reply.value} type="button" disabled={isSaving} onClick={() => void submitAnswer(reply.value)} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-rose-400 hover:text-white disabled:opacity-50">{reply.label}</button>)}</div><form onSubmit={onSubmit} className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 p-2 focus-within:border-rose-400"><input value={input} onChange={(event) => setInput(event.target.value)} disabled={isSaving} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" /><button type="submit" disabled={isSaving || !input.trim()} aria-label="Envoyer ma réponse" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white transition active:scale-95 disabled:opacity-40"><Send className="h-4 w-4" /></button></form><p className="mt-3 text-center text-[11px] text-slate-500">BacPilot répond avec les observations disponibles et ne promet jamais une admission ou une bourse.</p></footer>}
  </div></main>;
};

export default OnboardingPage;
