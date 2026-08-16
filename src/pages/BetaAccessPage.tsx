import React, { useEffect } from 'react';
import { CheckCircle2, CircleAlert, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BetaAccessPageProps { navigate: (route: string) => void; }

export const BetaAccessPage: React.FC<BetaAccessPageProps> = ({ navigate }) => {
  const { user, profile, isBetaTester, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) navigate('/login?returnTo=beta');
    if (!isLoading && user && isBetaTester) navigate('/beta');
  }, [isLoading, isBetaTester, navigate, user]);

  if (isLoading || (user && isBetaTester)) {
    return <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 dark:bg-slate-950"><div className="text-center"><LoaderCircle className="mx-auto h-9 w-9 animate-spin text-rose-500" /><h1 className="mt-4 text-xl font-black">Vérification de ton accès bêta…</h1><p className="mt-2 text-sm text-slate-500">BacPilot vérifie ta session et ton statut d’invitation.</p></div></main>;
  }

  if (!user) return null;

  const betaRequested = profile?.signup_intent === 'beta_interest';

  return <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950"><section className="w-full max-w-2xl rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm dark:border-amber-900/50 dark:bg-slate-900 sm:p-10"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-950/30">{betaRequested ? <CheckCircle2 className="h-7 w-7" /> : <CircleAlert className="h-7 w-7" />}</div><h1 className="mt-5 text-2xl font-black">{betaRequested ? 'Demande bêta transmise' : 'Invitation bêta requise'}</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{betaRequested ? 'Ton intérêt pour la bêta a bien été transmis à l’équipe BacPilot. Elle vérifie ton profil avant toute activation ; l’accès n’est jamais attribué automatiquement.' : 'Ton compte est bien connecté, mais il n’est pas encore actif dans le programme bêta. L’équipe BacPilot doit d’abord l’enrôler côté serveur ; ce statut ne peut pas être choisi depuis le navigateur.'}</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => navigate('/dashboard')} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold dark:border-slate-700">Retour au tableau de bord</button><button onClick={() => navigate('/contact')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white"><ShieldCheck className="h-4 w-4" /> {betaRequested ? 'Contacter BacPilot' : 'Demander une invitation'}</button></div><p className="mt-6 text-xs text-slate-400">Compte connecté : {user.email}</p></section></main>;
};

export default BetaAccessPage;
